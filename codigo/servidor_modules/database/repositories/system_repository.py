"""Repositorio do payload agregado do sistema."""

from __future__ import annotations

from servidor_modules.database.storage import get_storage


class SystemRepository:
    def __init__(self, project_root):
        self.storage = get_storage(project_root)

    def get_dados_payload(self):
        return self.storage.load_document(
            "dados.json", self.storage.default_document("dados.json")
        )

    def save_dados_payload(self, payload):
        self.storage.save_document("dados.json", payload)
        return self.get_dados_payload()

    def get_constants(self):
        return self.get_dados_payload().get("constants", {})

    def save_constants(self, constants):
        dados = self.get_dados_payload()
        dados["constants"] = constants
        self.storage.save_document("dados.json", dados)
        return constants

    def get_materials(self):
        return self.get_dados_payload().get("materials", {})

    def save_materials(self, materials):
        dados = self.get_dados_payload()
        dados["materials"] = materials
        self.storage.save_document("dados.json", dados)
        return materials
