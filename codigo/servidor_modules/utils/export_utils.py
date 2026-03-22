"""Utilitários de exportação e envio de documentos."""

from __future__ import annotations

import os
import smtplib
import shutil
import tempfile
import time
import zipfile
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path

from servidor_modules.handlers.word_handler import WordHandler
from servidor_modules.utils.admin_email_config import (
    AdminEmailConfigStore,
    is_valid_email,
)


def normalize_smtp_secret(sender_email, token):
    """Normaliza segredos SMTP para provedores com formatos conhecidos."""
    normalized_email = str(sender_email or "").strip().lower()
    normalized_token = str(token or "").strip()

    if not normalized_token:
        return ""

    domain = normalized_email.split("@", 1)[1] if "@" in normalized_email else ""
    if domain in {"gmail.com", "googlemail.com"}:
        return "".join(normalized_token.split())

    return normalized_token


def validate_smtp_secret(sender_email, token):
    """Valida segredos SMTP para provedores com regras conhecidas."""
    normalized_email = str(sender_email or "").strip().lower()
    normalized_token = normalize_smtp_secret(sender_email, token)
    domain = normalized_email.split("@", 1)[1] if "@" in normalized_email else ""

    if domain in {"gmail.com", "googlemail.com"} and len(normalized_token) != 16:
        raise RuntimeError(
            "Para Gmail, informe a senha de app de 16 caracteres do Google, não o token do ADM do sistema."
        )

    return normalized_token


def cleanup_temp_files(*paths):
    """Remove arquivos temporários silenciosamente."""
    for path in paths:
        if not path:
            continue
        try:
            if isinstance(path, (list, tuple, set)):
                cleanup_temp_files(*path)
                continue

            if isinstance(path, dict):
                cleanup_temp_files(path.get("path"))
                continue

            path_obj = Path(path)
            if path_obj.exists() and path_obj.is_file():
                path_obj.unlink()
        except Exception:
            continue


def read_verified_attachment_bytes(file_path, max_attempts=5, wait_seconds=0.25):
    """Lê o anexo e garante consistência de tamanho antes de enviá-lo."""
    attachment_path = Path(file_path)
    last_error = None

    for attempt in range(max_attempts):
        if not attachment_path.exists():
            last_error = FileNotFoundError(
                f"Arquivo de anexo não encontrado: {attachment_path}"
            )
        else:
            try:
                size_before = attachment_path.stat().st_size
                if size_before <= 0:
                    raise RuntimeError(
                        f"Arquivo de anexo vazio ou ainda não finalizado: {attachment_path}"
                    )

                with open(attachment_path, "rb") as file_obj:
                    file_bytes = file_obj.read()

                size_after = attachment_path.stat().st_size
                if len(file_bytes) == size_before == size_after:
                    return file_bytes

                last_error = RuntimeError(
                    "Leitura inconsistente do anexo: "
                    f"{attachment_path} (lido={len(file_bytes)}, antes={size_before}, depois={size_after})"
                )
            except Exception as exc:
                last_error = exc

        if attempt < max_attempts - 1:
            time.sleep(wait_seconds)

    raise last_error or RuntimeError(
        f"Não foi possível validar o anexo para envio: {attachment_path}"
    )


def duplicate_temp_file(source_path, output_filename=None):
    """Cria uma cópia temporária de um arquivo para uso paralelo em jobs distintos."""
    source = Path(source_path)
    if not source.exists():
        raise FileNotFoundError("Arquivo temporário não encontrado para duplicação")

    source_bytes = read_verified_attachment_bytes(source)
    suffix = source.suffix or ".tmp"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
        tmp_file.write(source_bytes)
        tmp_file.flush()
        os.fsync(tmp_file.fileno())
        duplicate_path = tmp_file.name

    duplicate_size = Path(duplicate_path).stat().st_size
    if duplicate_size != len(source_bytes):
        cleanup_temp_files(duplicate_path)
        raise RuntimeError(
            "Falha ao criar cópia íntegra do anexo para envio: "
            f"{source.name} (origem={len(source_bytes)}, copia={duplicate_size})"
        )

    try:
        shutil.copystat(source, duplicate_path)
    except Exception:
        pass

    duplicate_name = output_filename or source.name
    return duplicate_path, duplicate_name


def duplicate_attachment_files(files):
    """Duplica uma lista de anexos temporários para uso paralelo."""
    duplicates = []

    for file_info in files or []:
        if not isinstance(file_info, dict):
            continue

        duplicate_path, duplicate_name = duplicate_temp_file(
            file_info.get("path"),
            file_info.get("filename"),
        )
        duplicates.append(
            {
                **file_info,
                "path": duplicate_path,
                "filename": duplicate_name,
            }
        )

    return duplicates


def format_currency_brl(value):
    """Formata número simples em moeda BRL."""
    try:
        numeric_value = float(value or 0)
    except (TypeError, ValueError):
        numeric_value = 0.0

    return f"R$ {numeric_value:,.2f}".replace(",", "X").replace(".", ",").replace(
        "X", "."
    )


def normalize_attachment_files(files):
    """Normaliza anexos para o formato interno padrão."""
    normalized_files = []

    for file_info in files or []:
        if isinstance(file_info, dict):
            file_path = file_info.get("path")
            filename = file_info.get("filename")
            template_type = file_info.get("template_type")
        elif isinstance(file_info, (list, tuple)) and len(file_info) >= 2:
            file_path = file_info[0]
            filename = file_info[1]
            template_type = file_info[2] if len(file_info) > 2 else ""
        else:
            continue

        if not file_path or not os.path.exists(file_path):
            continue

        normalized_files.append(
            {
                "path": file_path,
                "filename": filename or Path(file_path).name,
                "template_type": template_type or "",
            }
        )

    return normalized_files


def create_zip_bundle(files, output_filename=None):
    """Compacta anexos em um ZIP temporário para envio íntegro por email."""
    normalized_files = normalize_attachment_files(files)
    if not normalized_files:
        raise FileNotFoundError("Nenhum arquivo válido encontrado para compactação")

    zip_name = str(output_filename or "").strip()
    if not zip_name:
        if len(normalized_files) == 1:
            zip_name = f"{Path(normalized_files[0]['filename']).stem}.zip"
        else:
            zip_name = "exportacao_anexos.zip"
    elif not zip_name.lower().endswith(".zip"):
        zip_name = f"{zip_name}.zip"

    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp_file:
        zip_path = tmp_file.name

    try:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for file_info in normalized_files:
                file_path = Path(str(file_info.get("path") or ""))
                filename = str(file_info.get("filename") or file_path.name).strip() or file_path.name
                file_bytes = read_verified_attachment_bytes(file_path)
                zip_file.writestr(filename, file_bytes)

        if Path(zip_path).stat().st_size <= 0:
            raise RuntimeError("Falha ao gerar ZIP temporário para envio por email")

        return zip_path, zip_name
    except Exception:
        cleanup_temp_files(zip_path)
        raise


def prepare_email_attachments(attachment_files):
    """Prepara anexos para email, compactando DOCX em ZIP para preservar integridade."""
    attachments = normalize_attachment_files(attachment_files)
    if not attachments:
        return [], []

    has_docx = any(
        Path(str(file_info.get("filename") or file_info.get("path") or "")).suffix.lower()
        == ".docx"
        for file_info in attachments
    )

    if not has_docx:
        return attachments, []

    zip_filename = (
        f"{Path(attachments[0]['filename']).stem}.zip"
        if len(attachments) == 1
        else "exportacao_documentos.zip"
    )
    zip_path, bundle_name = create_zip_bundle(attachments, zip_filename)
    return [build_export_file(zip_path, bundle_name, "zip_bundle")], [zip_path]


def enviar_email(destino, assunto, mensagem, attachment_files=None):
    """Envia um email usando a configuração SMTP do ADM."""
    config_store = AdminEmailConfigStore()
    config = config_store.load()

    if not config_store.is_configured(config):
        raise RuntimeError("Configuração SMTP do ADM não encontrada")

    destination = str(destino or "").strip()
    if not is_valid_email(destination):
        raise ValueError("Endereço de email de destino inválido")

    attachments = normalize_attachment_files(attachment_files)

    smtp_settings = config_store.resolve_smtp_settings(config)
    host = str(smtp_settings.get("host") or "").strip()
    port = int(smtp_settings.get("port") or 587)
    use_tls = bool(smtp_settings.get("use_tls", True))

    if not host:
        raise RuntimeError("Não foi possível resolver o servidor SMTP")

    sender_email = str(config.get("email") or "").strip()
    sender_name = str(config.get("nome") or "").strip() or sender_email

    message = EmailMessage()
    message["Subject"] = str(assunto or "").strip() or "Exportação de obra"
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = destination
    message.set_content(str(mensagem or "").strip() or "Segue arquivo em anexo.")

    for attachment in attachments:
        file_path = Path(str(attachment.get("path") or ""))
        filename = str(attachment.get("filename") or file_path.name).strip() or file_path.name
        suffix = file_path.suffix.lower()
        subtype = "octet-stream"
        file_bytes = read_verified_attachment_bytes(file_path)

        if suffix == ".docx":
            subtype = "vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif suffix == ".zip":
            subtype = "zip"

        message.add_attachment(
            file_bytes,
            maintype="application",
            subtype=subtype,
            filename=filename,
            cte="base64",
        )

    smtp_client = None
    try:
        if not use_tls and port == 465:
            smtp_client = smtplib.SMTP_SSL(host, port, timeout=30)
        else:
            smtp_client = smtplib.SMTP(host, port, timeout=30)
            smtp_client.ehlo()
            if use_tls:
                smtp_client.starttls()
                smtp_client.ehlo()

        smtp_token = validate_smtp_secret(sender_email, config.get("token") or "")
        smtp_client.login(sender_email, smtp_token)
        smtp_client.send_message(message)
    except smtplib.SMTPAuthenticationError as exc:
        domain = sender_email.split("@", 1)[1].lower() if "@" in sender_email else ""
        if domain in {"gmail.com", "googlemail.com"}:
            raise RuntimeError(
                "Gmail rejeitou a autenticação SMTP. Verifique se o App Password está correto e se a conta usa verificação em duas etapas."
            ) from exc
        raise RuntimeError("Credenciais SMTP rejeitadas pelo provedor de email.") from exc
    finally:
        if smtp_client is not None:
            try:
                smtp_client.quit()
            except Exception:
                pass


def enviar_email_com_anexos(destino, assunto, mensagem, attachment_files):
    """Envia um email com anexos diretos usando a configuração SMTP do ADM."""
    attachments, temp_paths = prepare_email_attachments(attachment_files)
    if not attachments:
        raise FileNotFoundError("Nenhum arquivo válido encontrado para envio")

    try:
        return enviar_email(destino, assunto, mensagem, attachments)
    finally:
        cleanup_temp_files(*temp_paths)


def enviar_email_com_zip(destino, assunto, mensagem, zip_path):
    """Compatibilidade: encaminha anexos diretos em vez de ZIP."""
    return enviar_email_com_anexos(
        destino,
        assunto,
        mensagem,
        [{"path": zip_path, "filename": Path(zip_path).name}],
    )


def build_export_file(file_path, filename, template_type=""):
    """Cria estrutura padrão de arquivo exportado."""
    return {
        "path": file_path,
        "filename": filename,
        "template_type": str(template_type or "").strip(),
    }


def prepare_export_assets(project_root, file_utils, obra_id, formato, need_download, need_email):
    """Gera os arquivos necessários para um fluxo de exportação."""
    export_format = str(formato or "ambos").strip().lower()
    if export_format not in {"pc", "pt", "ambos"}:
        raise ValueError("Formato de exportação inválido")

    word_handler = WordHandler(project_root, file_utils)
    obra_data = word_handler.get_obra_data(obra_id)

    if export_format == "ambos":
        files, error = word_handler.generate_selected_documents(obra_id, export_format)
        if error:
            raise RuntimeError(error)
    elif export_format == "pc":
        file_path, filename, error = word_handler.generate_proposta_comercial_avancada(
            obra_id
        )
        files = [build_export_file(file_path, filename, "comercial")]
    else:
        file_path, filename, error = word_handler.generate_proposta_tecnica_avancada(
            obra_id
        )
        files = [build_export_file(file_path, filename, "tecnica")]

    if error:
        raise RuntimeError(error)

    files = normalize_attachment_files(files)
    if not files:
        raise RuntimeError("Arquivo de exportação não foi gerado")

    return {
        "obra_data": obra_data,
        "download_files": files if need_download else [],
        "email_files": files if need_email else [],
    }
