"""Persistencia e resolucao da configuracao de email administrativa via PostgreSQL."""

from __future__ import annotations

import json
import os
import re
from copy import deepcopy
from pathlib import Path

from servidor_modules.database.connection import get_connection


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

DEFAULT_EMAIL_CONFIG = {
    "email": "",
    "token": "",
    "nome": "",
    "smtpHost": "",
    "smtpPort": None,
    "useTls": True,
    "updatedAt": None,
}

COMMON_SMTP_PROVIDERS = {
    "gmail.com": {"host": "smtp.gmail.com", "port": 587, "use_tls": True},
    "googlemail.com": {"host": "smtp.gmail.com", "port": 587, "use_tls": True},
    "outlook.com": {"host": "smtp.office365.com", "port": 587, "use_tls": True},
    "hotmail.com": {"host": "smtp.office365.com", "port": 587, "use_tls": True},
    "live.com": {"host": "smtp.office365.com", "port": 587, "use_tls": True},
    "msn.com": {"host": "smtp.office365.com", "port": 587, "use_tls": True},
    "office365.com": {"host": "smtp.office365.com", "port": 587, "use_tls": True},
    "yahoo.com": {"host": "smtp.mail.yahoo.com", "port": 587, "use_tls": True},
    "icloud.com": {"host": "smtp.mail.me.com", "port": 587, "use_tls": True},
    "me.com": {"host": "smtp.mail.me.com", "port": 587, "use_tls": True},
}


def is_valid_email(value):
    """Valida um endereco de email simples."""
    return bool(EMAIL_REGEX.match(str(value or "").strip()))


class AdminEmailConfigStore:
    """Le e grava a configuracao SMTP do administrador no PostgreSQL."""

    def __init__(self, project_root=None):
        self.project_root = (
            Path(project_root)
            if project_root is not None
            else Path(__file__).resolve().parents[2]
        )
        self.file_path = self.project_root / "json" / "admin_email_config.json"
        self.conn = get_connection(self.project_root)
        self.config_key = "default"

    def _normalize_payload(self, payload):
        payload = payload if isinstance(payload, dict) else {}
        normalized = deepcopy(DEFAULT_EMAIL_CONFIG)

        normalized["email"] = str(
            payload.get("email")
            or payload.get("adminEmail")
            or payload.get("usuario")
            or ""
        ).strip()
        normalized["token"] = str(
            payload.get("token") or payload.get("adminToken") or ""
        ).strip()
        normalized["nome"] = str(
            payload.get("nome") or payload.get("adminNome") or ""
        ).strip()
        normalized["smtpHost"] = str(payload.get("smtpHost") or "").strip()

        smtp_port = payload.get("smtpPort")
        try:
            normalized["smtpPort"] = int(smtp_port) if smtp_port is not None else None
        except (TypeError, ValueError):
            normalized["smtpPort"] = None

        if "useTls" in payload:
            normalized["useTls"] = bool(payload.get("useTls"))

        normalized["updatedAt"] = payload.get("updatedAt")
        return normalized

    def load(self):
        try:
            row = self.conn.execute(
                """
                SELECT email, token, nome, smtp_host, smtp_port, use_tls, updated_at
                FROM admin_email_config
                WHERE config_key = ?
                """,
                (self.config_key,),
            ).fetchone()

            if row is not None:
                return self._normalize_payload(
                    {
                        "email": row["email"],
                        "token": row["token"],
                        "nome": row["nome"],
                        "smtpHost": row["smtp_host"],
                        "smtpPort": row["smtp_port"],
                        "useTls": bool(row["use_tls"]),
                        "updatedAt": row["updated_at"],
                    }
                )
        except Exception:
            pass

        migrated_config = self._migrate_legacy_json_if_available()
        if migrated_config is not None:
            return migrated_config

        return deepcopy(DEFAULT_EMAIL_CONFIG)

    def save(self, payload):
        normalized = self._normalize_payload(payload)
        self.conn.execute(
            """
            INSERT INTO admin_email_config(
                config_key,
                email,
                token,
                nome,
                smtp_host,
                smtp_port,
                use_tls,
                updated_at
            )
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(config_key) DO UPDATE SET
                email = excluded.email,
                token = excluded.token,
                nome = excluded.nome,
                smtp_host = excluded.smtp_host,
                smtp_port = excluded.smtp_port,
                use_tls = excluded.use_tls,
                updated_at = excluded.updated_at
            """,
            (
                self.config_key,
                normalized["email"],
                normalized["token"],
                normalized["nome"],
                normalized["smtpHost"],
                normalized["smtpPort"],
                1 if normalized["useTls"] else 0,
                normalized["updatedAt"],
            ),
        )
        self.conn.commit()
        self._remove_legacy_json_file()

        return normalized

    def _migrate_legacy_json_if_available(self):
        if not self.file_path.exists():
            return None

        try:
            with open(self.file_path, "r", encoding="utf-8") as file_obj:
                payload = json.load(file_obj)
        except Exception:
            return None

        normalized = self._normalize_payload(payload)
        self.save(normalized)
        return normalized

    def _remove_legacy_json_file(self):
        try:
            if self.file_path.exists():
                self.file_path.unlink()
        except Exception:
            pass

    def is_configured(self, config=None):
        loaded_config = config or self.load()
        return bool(
            loaded_config.get("email")
            and loaded_config.get("token")
            and is_valid_email(loaded_config.get("email"))
        )

    def resolve_smtp_settings(self, config=None):
        loaded_config = config or self.load()
        email = str(loaded_config.get("email") or "").strip().lower()
        domain = email.split("@", 1)[1] if "@" in email else ""

        env_host = str(os.environ.get("ESI_SMTP_HOST", "") or "").strip()
        env_port = str(os.environ.get("ESI_SMTP_PORT", "") or "").strip()
        env_use_tls = str(os.environ.get("ESI_SMTP_USE_TLS", "") or "").strip()

        if env_host:
            host = env_host
            try:
                port = int(env_port) if env_port else 587
            except ValueError:
                port = 587
            use_tls = env_use_tls.lower() not in {"0", "false", "no", "off"}
            return {"host": host, "port": port, "use_tls": use_tls}

        if loaded_config.get("smtpHost"):
            return {
                "host": loaded_config["smtpHost"],
                "port": int(loaded_config.get("smtpPort") or 587),
                "use_tls": bool(loaded_config.get("useTls", True)),
            }

        provider = COMMON_SMTP_PROVIDERS.get(domain)
        if provider:
            return dict(provider)

        if domain:
            return {
                "host": f"smtp.{domain}",
                "port": int(loaded_config.get("smtpPort") or 587),
                "use_tls": bool(loaded_config.get("useTls", True)),
            }

        return {"host": "", "port": 587, "use_tls": True}
