"""Utilitarios de exportacao e envio de documentos."""

from __future__ import annotations

import os
import smtplib
import shutil
import tempfile
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path

from servidor_modules.handlers.word_handler import WordHandler
from servidor_modules.utils.admin_email_config import (
    AdminEmailConfigStore,
    is_valid_email,
)


def cleanup_temp_files(*paths):
    """Remove arquivos temporarios silenciosamente."""
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


def duplicate_temp_file(source_path, output_filename=None):
    """Cria uma copia temporaria de um arquivo para uso paralelo em jobs distintos."""
    source = Path(source_path)
    if not source.exists():
        raise FileNotFoundError("Arquivo temporario nao encontrado para duplicacao")

    suffix = source.suffix or ".tmp"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
        duplicate_path = tmp_file.name

    shutil.copy2(source, duplicate_path)
    duplicate_name = output_filename or source.name
    return duplicate_path, duplicate_name


def duplicate_attachment_files(files):
    """Duplica uma lista de anexos temporarios para uso paralelo."""
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
    """Formata numero simples em moeda BRL."""
    try:
        numeric_value = float(value or 0)
    except (TypeError, ValueError):
        numeric_value = 0.0

    return f"R$ {numeric_value:,.2f}".replace(",", "X").replace(".", ",").replace(
        "X", "."
    )


def normalize_attachment_files(files):
    """Normaliza anexos para o formato interno padrao."""
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


def enviar_email_com_anexos(destino, assunto, mensagem, attachment_files):
    """Envia um email com anexos diretos usando a configuracao SMTP do ADM."""
    config_store = AdminEmailConfigStore()
    config = config_store.load()

    if not config_store.is_configured(config):
        raise RuntimeError("Configuracao SMTP do ADM nao encontrada")

    destination = str(destino or "").strip()
    if not is_valid_email(destination):
        raise ValueError("Endereco de email de destino invalido")

    attachments = normalize_attachment_files(attachment_files)
    if not attachments:
        raise FileNotFoundError("Nenhum arquivo valido encontrado para envio")

    smtp_settings = config_store.resolve_smtp_settings(config)
    host = str(smtp_settings.get("host") or "").strip()
    port = int(smtp_settings.get("port") or 587)
    use_tls = bool(smtp_settings.get("use_tls", True))

    if not host:
        raise RuntimeError("Nao foi possivel resolver o servidor SMTP")

    sender_email = str(config.get("email") or "").strip()
    sender_name = str(config.get("nome") or "").strip() or sender_email

    message = EmailMessage()
    message["Subject"] = str(assunto or "").strip() or "Exportacao de obra"
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = destination
    message.set_content(str(mensagem or "").strip() or "Segue arquivo em anexo.")

    for attachment in attachments:
        file_path = Path(str(attachment.get("path") or ""))
        filename = str(attachment.get("filename") or file_path.name).strip() or file_path.name
        suffix = file_path.suffix.lower()
        subtype = "octet-stream"

        if suffix == ".docx":
            subtype = "vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif suffix == ".zip":
            subtype = "zip"

        with open(file_path, "rb") as file_obj:
            message.add_attachment(
                file_obj.read(),
                maintype="application",
                subtype=subtype,
                filename=filename,
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

        smtp_client.login(sender_email, str(config.get("token") or ""))
        smtp_client.send_message(message)
    finally:
        if smtp_client is not None:
            try:
                smtp_client.quit()
            except Exception:
                pass


def enviar_email_com_zip(destino, assunto, mensagem, zip_path):
    """Compatibilidade: encaminha anexos diretos em vez de ZIP."""
    return enviar_email_com_anexos(
        destino,
        assunto,
        mensagem,
        [{"path": zip_path, "filename": Path(zip_path).name}],
    )


def build_export_file(file_path, filename, template_type=""):
    """Cria estrutura padrao de arquivo exportado."""
    return {
        "path": file_path,
        "filename": filename,
        "template_type": str(template_type or "").strip(),
    }


def prepare_export_assets(project_root, file_utils, obra_id, formato, need_download, need_email):
    """Gera os arquivos necessarios para um fluxo de exportacao."""
    export_format = str(formato or "ambos").strip().lower()
    if export_format not in {"pc", "pt", "ambos"}:
        raise ValueError("Formato de exportacao invalido")

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
        raise RuntimeError("Arquivo de exportacao nao foi gerado")

    return {
        "obra_data": obra_data,
        "download_files": files if need_download else [],
        "email_files": files if need_email else [],
    }
