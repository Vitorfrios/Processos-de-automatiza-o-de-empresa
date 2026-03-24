"""Repositorio do payload agregado do sistema."""

from __future__ import annotations

import json

from servidor_modules.database.storage import get_storage


class SystemRepository:
    def __init__(self, project_root):
        self.storage = get_storage(project_root)
        self.conn = self.storage.conn

    def get_dados_payload(self):
        return self.storage.load_document(
            "dados.json", self.storage.default_document("dados.json")
        )

    def save_dados_payload(self, payload):
        self.storage.save_document("dados.json", payload)
        return self.get_dados_payload()

    def save_admins(self, admins):
        cursor = self.conn.cursor()
        cursor.execute("BEGIN")
        try:
            cursor.execute("DELETE FROM admins")
            for index, admin in enumerate(admins or []):
                if not isinstance(admin, dict):
                    continue
                usuario = str(admin.get("usuario", "")).strip()
                token = str(admin.get("token", "")).strip()
                if not usuario or not token:
                    continue
                cursor.execute(
                    """
                    INSERT INTO admins(usuario, token, raw_json, sort_order)
                    VALUES(?, ?, ?, ?)
                    """,
                    (
                        usuario,
                        token,
                        json.dumps(admin, ensure_ascii=False),
                        index,
                    ),
                )
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise
        return admins

    def get_constants(self):
        return self.get_dados_payload().get("constants", {})

    def save_constants(self, constants):
        cursor = self.conn.cursor()
        cursor.execute("BEGIN")
        try:
            cursor.execute("DELETE FROM constants")
            for key, constant_data in (constants or {}).items():
                cursor.execute(
                    """
                    INSERT INTO constants(key, value_json, description)
                    VALUES(?, ?, ?)
                    """,
                    (
                        str(key),
                        json.dumps(constant_data, ensure_ascii=False),
                        constant_data.get("description")
                        if isinstance(constant_data, dict)
                        else None,
                    ),
                )
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise
        return constants

    def get_materials(self):
        return self.get_dados_payload().get("materials", {})

    def save_materials(self, materials):
        cursor = self.conn.cursor()
        cursor.execute("BEGIN")
        try:
            cursor.execute("DELETE FROM materials")
            for index, (key, material_data) in enumerate((materials or {}).items()):
                cursor.execute(
                    """
                    INSERT INTO materials(key, raw_json, sort_order)
                    VALUES(?, ?, ?)
                    """,
                    (
                        str(key),
                        json.dumps(material_data, ensure_ascii=False),
                        index,
                    ),
                )
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise
        return materials

    def save_acessorios(self, acessorios):
        cursor = self.conn.cursor()
        cursor.execute("BEGIN")
        try:
            cursor.execute("DELETE FROM acessorios")
            for index, (tipo, acessorio) in enumerate((acessorios or {}).items()):
                cursor.execute(
                    """
                    INSERT INTO acessorios(tipo, descricao, raw_json, sort_order)
                    VALUES(?, ?, ?, ?)
                    """,
                    (
                        str(tipo),
                        acessorio.get("descricao") if isinstance(acessorio, dict) else None,
                        json.dumps(acessorio, ensure_ascii=False),
                        index,
                    ),
                )
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise
        return acessorios

    def save_dutos(self, dutos):
        cursor = self.conn.cursor()
        cursor.execute("BEGIN")
        try:
            cursor.execute("DELETE FROM dutos")
            for index, duto in enumerate(dutos or []):
                if not isinstance(duto, dict) or not duto.get("type"):
                    continue
                cursor.execute(
                    """
                    INSERT INTO dutos(type, descricao, raw_json, sort_order)
                    VALUES(?, ?, ?, ?)
                    """,
                    (
                        str(duto.get("type")),
                        duto.get("descricao"),
                        json.dumps(duto, ensure_ascii=False),
                        index,
                    ),
                )
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise
        return dutos

    def save_tubos(self, tubos):
        cursor = self.conn.cursor()
        cursor.execute("BEGIN")
        try:
            cursor.execute("DELETE FROM tubos")
            for index, tubo in enumerate(tubos or []):
                if not isinstance(tubo, dict) or not tubo.get("polegadas"):
                    continue
                cursor.execute(
                    """
                    INSERT INTO tubos(polegadas, mm, valor, raw_json, sort_order)
                    VALUES(?, ?, ?, ?, ?)
                    """,
                    (
                        str(tubo.get("polegadas")),
                        tubo.get("mm"),
                        tubo.get("valor"),
                        json.dumps(tubo, ensure_ascii=False),
                        index,
                    ),
                )
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise
        return tubos
