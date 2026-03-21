"""Repositorio de empresas."""

from __future__ import annotations

import json

from servidor_modules.database.storage import get_storage, normalize_empresa


class EmpresaRepository:
    def __init__(self, project_root):
        self.storage = get_storage(project_root)
        self.conn = self.storage.conn

    def get_all(self):
        rows = self.conn.execute(
            "SELECT raw_json FROM empresas ORDER BY sort_order, codigo"
        ).fetchall()
        return [json.loads(row["raw_json"]) for row in rows]

    def get_public(self):
        empresas = []
        for empresa in self.get_all():
            empresa_normalizada = normalize_empresa(empresa)
            if not empresa_normalizada:
                continue
            empresas.append(
                {
                    "codigo": empresa_normalizada.get("codigo", ""),
                    "nome": empresa_normalizada.get("nome", ""),
                }
            )
        return empresas

    def replace_all(self, empresas):
        dados = self.storage.load_document(
            "dados.json", self.storage.default_document("dados.json")
        )
        dados["empresas"] = list(empresas or [])
        self.storage.save_document("dados.json", dados)
        return self.get_all()

    def add(self, empresa):
        empresa_normalizada = normalize_empresa(empresa)
        if not empresa_normalizada or not empresa_normalizada.get("codigo"):
            raise ValueError("Estrutura de empresa invalida")

        dados = self.storage.load_document(
            "dados.json", self.storage.default_document("dados.json")
        )
        empresas = list(dados.get("empresas", []))
        if any(
            normalize_empresa(item)
            and normalize_empresa(item).get("codigo") == empresa_normalizada["codigo"]
            for item in empresas
        ):
            raise ValueError(
                f"Empresa com sigla {empresa_normalizada['codigo']} ja existe"
            )

        empresas.append(empresa_normalizada)
        dados["empresas"] = empresas
        self.storage.save_document("dados.json", dados)
        return empresa_normalizada

    def search(self, termo):
        termo_normalizado = str(termo or "").strip().upper()
        if not termo_normalizado:
            return []

        resultados = []
        for empresa in self.get_all():
            empresa_normalizada = normalize_empresa(empresa)
            if not empresa_normalizada:
                continue

            codigo = empresa_normalizada.get("codigo", "")
            nome = empresa_normalizada.get("nome", "")
            primeiro_nome = nome.split(" ")[0].upper() if nome else ""
            nome_upper = nome.upper()

            if (
                codigo == termo_normalizado
                or primeiro_nome.startswith(termo_normalizado)
                or termo_normalizado in nome_upper
            ):
                resultados.append(empresa_normalizada)

        return resultados

    def upsert_recovery_email(self, codigo, nome, email):
        codigo_normalizado = str(codigo or "").strip()
        nome_normalizado = str(nome or "").strip()
        email_normalizado = str(email or "").strip()

        if not codigo_normalizado or not email_normalizado:
            return False

        dados = self.storage.load_document(
            "dados.json", self.storage.default_document("dados.json")
        )
        empresas = list(dados.get("empresas", []))
        updated = False

        for index, empresa in enumerate(empresas):
            empresa_normalizada = normalize_empresa(empresa)
            if not empresa_normalizada:
                continue
            if str(empresa_normalizada.get("codigo", "")).strip() != codigo_normalizado:
                continue

            credenciais = empresa_normalizada.get("credenciais")
            if not isinstance(credenciais, dict):
                credenciais = {}
            else:
                credenciais = dict(credenciais)

            if str(credenciais.get("email") or "").strip() == email_normalizado:
                return False

            credenciais["email"] = email_normalizado
            empresa_normalizada["credenciais"] = credenciais
            if nome_normalizado and not empresa_normalizada.get("nome"):
                empresa_normalizada["nome"] = nome_normalizado

            empresas[index] = empresa_normalizada
            updated = True
            break

        if not updated:
            empresas.append(
                {
                    "codigo": codigo_normalizado,
                    "nome": nome_normalizado or codigo_normalizado,
                    "credenciais": {"email": email_normalizado},
                }
            )
            updated = True

        dados["empresas"] = empresas
        self.storage.save_document("dados.json", dados)
        return updated
