"""Repositorio de obras e da estrutura hierarquica do backup."""

from __future__ import annotations

import json

from servidor_modules.database.storage import get_storage


class ObraRepository:
    def __init__(self, project_root):
        self.storage = get_storage(project_root)
        self.conn = self.storage.conn

    def get_backup_payload(self):
        return self.storage.load_document(
            "backup.json", self.storage.default_document("backup.json")
        )

    def replace_backup_payload(self, payload):
        self.storage.save_document("backup.json", payload or {"obras": []})
        return self.get_backup_payload()

    def get_all(self):
        rows = self.conn.execute(
            "SELECT raw_json FROM obras ORDER BY sort_order, id"
        ).fetchall()
        return [json.loads(row["raw_json"]) for row in rows]

    def get_by_id(self, obra_id):
        row = self.conn.execute(
            "SELECT raw_json FROM obras WHERE id = ?",
            (str(obra_id),),
        ).fetchone()
        return json.loads(row["raw_json"]) if row else None

    def save(self, obra):
        if not isinstance(obra, dict) or not obra.get("id"):
            raise ValueError("Obra invalida")

        payload = self.get_backup_payload()
        obras = list(payload.get("obras", []))
        obra_id = str(obra.get("id"))

        updated = False
        for index, existing in enumerate(obras):
            if str(existing.get("id")) == obra_id:
                obras[index] = obra
                updated = True
                break

        if not updated:
            obras.append(obra)

        payload["obras"] = obras
        self.storage.save_document("backup.json", payload)
        return obra

    def delete(self, obra_id):
        payload = self.get_backup_payload()
        obras = list(payload.get("obras", []))
        obra_id_str = str(obra_id)
        novos = [obra for obra in obras if str(obra.get("id")) != obra_id_str]
        if len(novos) == len(obras):
            return False

        payload["obras"] = novos
        self.storage.save_document("backup.json", payload)
        return True

    def get_by_session_ids(self, obra_ids):
        ids = {str(obra_id) for obra_id in obra_ids}
        if not ids:
            return []

        return [obra for obra in self.get_all() if str(obra.get("id", "")) in ids]

    def get_next_numero_cliente(self, sigla):
        row = self.conn.execute(
            """
            SELECT MAX(COALESCE(numero_cliente_final, 0)) AS max_numero
            FROM obras
            WHERE empresa_codigo = ?
            """,
            (str(sigla),),
        ).fetchone()
        max_numero = row["max_numero"] if row and row["max_numero"] is not None else 0
        return int(max_numero) + 1

