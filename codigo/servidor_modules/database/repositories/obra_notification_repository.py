"""Repositorio para controle da ultima notificacao enviada por obra."""

from __future__ import annotations

from datetime import datetime

from servidor_modules.database.connection import get_connection


class ObraNotificationRepository:
    def __init__(self, project_root):
        self.conn = get_connection(project_root)

    def get_by_obra_id(self, obra_id):
        row = self.conn.execute(
            """
            SELECT obra_id, fingerprint, last_subject, last_message, last_sent_at
            FROM obra_notifications
            WHERE obra_id = ?
            """,
            (str(obra_id),),
        ).fetchone()

        return dict(row) if row else None

    def upsert(self, obra_id, fingerprint, subject="", message=""):
        self.conn.execute(
            """
            INSERT INTO obra_notifications (
                obra_id,
                fingerprint,
                last_subject,
                last_message,
                last_sent_at
            )
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(obra_id) DO UPDATE SET
                fingerprint = excluded.fingerprint,
                last_subject = excluded.last_subject,
                last_message = excluded.last_message,
                last_sent_at = excluded.last_sent_at
            """,
            (
                str(obra_id),
                str(fingerprint),
                str(subject or ""),
                str(message or ""),
                datetime.now().isoformat(),
            ),
        )
        self.conn.commit()

