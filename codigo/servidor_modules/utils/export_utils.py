"""Utilitarios de exportacao e envio de documentos."""

from __future__ import annotations

import os
import smtplib
import shutil
import tempfile
import zipfile
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
            path_obj = Path(path)
            if path_obj.exists():
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


def format_currency_brl(value):
    """Formata numero simples em moeda BRL."""
    try:
        numeric_value = float(value or 0)
    except (TypeError, ValueError):
        numeric_value = 0.0

    return f"R$ {numeric_value:,.2f}".replace(",", "X").replace(".", ",").replace(
        "X", "."
    )


def create_zip_bundle(files, output_filename=None):
    """Compacta uma lista de arquivos em um unico ZIP temporario."""
    if not files:
        raise ValueError("Nenhum arquivo disponivel para compactacao")

    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp_zip:
        zip_path = tmp_zip.name

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for file_path, archive_name in files:
            if not file_path or not os.path.exists(file_path):
                continue
            zip_file.write(file_path, archive_name)

    zip_filename = output_filename or f"{Path(files[0][1]).stem}.zip"
    return zip_path, zip_filename


def enviar_email_com_zip(destino, assunto, mensagem, zip_path):
    """Envia um email com ZIP anexado usando a configuracao SMTP do ADM."""
    config_store = AdminEmailConfigStore()
    config = config_store.load()

    if not config_store.is_configured(config):
        raise RuntimeError("Configuracao SMTP do ADM nao encontrada")

    destination = str(destino or "").strip()
    if not is_valid_email(destination):
        raise ValueError("Endereco de email de destino invalido")

    zip_file = Path(zip_path)
    if not zip_file.exists():
        raise FileNotFoundError("Arquivo ZIP nao encontrado para envio")

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

    with open(zip_file, "rb") as file_obj:
        message.add_attachment(
            file_obj.read(),
            maintype="application",
            subtype="zip",
            filename=zip_file.name,
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


def prepare_export_assets(project_root, file_utils, obra_id, formato, need_download, need_email):
    """Gera os arquivos necessarios para um fluxo de exportacao."""
    export_format = str(formato or "ambos").strip().lower()
    if export_format not in {"pc", "pt", "ambos"}:
        raise ValueError("Formato de exportacao invalido")

    word_handler = WordHandler(project_root, file_utils)
    obra_data = word_handler.get_obra_data(obra_id)

    if export_format == "ambos":
        zip_path, zip_filename, error = word_handler.generate_both_documents(obra_id)
        if error:
            raise RuntimeError(error)

        return {
            "obra_data": obra_data,
            "download_path": zip_path if need_download else None,
            "download_filename": zip_filename if need_download else None,
            "email_zip_path": zip_path if need_email else None,
            "email_zip_filename": zip_filename if need_email else None,
        }

    if export_format == "pc":
        file_path, filename, error = word_handler.generate_proposta_comercial_avancada(
            obra_id
        )
    else:
        file_path, filename, error = word_handler.generate_proposta_tecnica_avancada(
            obra_id
        )

    if error:
        raise RuntimeError(error)

    if not file_path or not os.path.exists(file_path):
        raise RuntimeError("Arquivo de exportacao nao foi gerado")

    email_zip_path = None
    email_zip_filename = None

    if need_email:
        zip_name = f"{Path(filename).stem}.zip"
        email_zip_path, email_zip_filename = create_zip_bundle(
            [(file_path, filename)],
            zip_name,
        )

    if not need_download:
        cleanup_temp_files(file_path)
        file_path = None
        filename = None

    return {
        "obra_data": obra_data,
        "download_path": file_path if need_download else None,
        "download_filename": filename if need_download else None,
        "email_zip_path": email_zip_path,
        "email_zip_filename": email_zip_filename,
    }
