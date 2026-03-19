"""Camada de compatibilidade entre o contrato JSON legado e SQLite."""

from __future__ import annotations

import json
import threading
from copy import deepcopy
from pathlib import Path

from servidor_modules.database.connection import get_connection


_STORAGES = {}
_STORAGES_LOCK = threading.Lock()


DEFAULT_DOCUMENTS = {
    "dados.json": {
        "ADM": [],
        "empresas": [],
        "constants": {},
        "machines": [],
        "materials": {},
        "banco_acessorios": {},
        "dutos": [],
        "tubos": [],
    },
    "backup.json": {"obras": []},
    "sessions.json": {"sessions": {"session_active": {"obras": []}}},
}


def normalize_empresa(empresa):
    if not isinstance(empresa, dict):
        return None

    codigo = empresa.get("codigo")
    nome = empresa.get("nome")
    if codigo and nome:
        return {
            "codigo": codigo,
            "nome": nome,
            "credenciais": empresa.get("credenciais"),
        }

    company_keys = [key for key in empresa.keys() if key != "credenciais"]
    if not company_keys:
        return None

    codigo = company_keys[0]
    return {
        "codigo": codigo,
        "nome": empresa.get(codigo),
        "credenciais": empresa.get("credenciais"),
    }


def normalize_admin_collection(admin_data):
    if isinstance(admin_data, list):
        return [{**admin} for admin in admin_data if isinstance(admin, dict)]

    if isinstance(admin_data, dict):
        return [{**admin_data}]

    return []


def sanitize_dados_payload(payload):
    if not isinstance(payload, dict):
        payload = {}

    legacy_admins = payload.get("administradores")
    primary_admins = payload.get("ADM")
    sanitized = {
        **payload,
        "ADM": normalize_admin_collection(
            primary_admins if primary_admins is not None else legacy_admins
        ),
    }

    sanitized.pop("administradores", None)

    for key, default_value in DEFAULT_DOCUMENTS["dados.json"].items():
        sanitized.setdefault(key, deepcopy(default_value))

    return sanitized


class DatabaseStorage:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.json_dir = self.project_root / "json"
        self.json_dir.mkdir(parents=True, exist_ok=True)
        self.conn = get_connection(self.project_root)
        self._lock = threading.RLock()
        self._bootstrapped = False

    def default_document(self, name):
        return deepcopy(DEFAULT_DOCUMENTS.get(name, {}))

    def ensure_bootstrap(self):
        with self._lock:
            if self._bootstrapped:
                return

            for name, default_payload in DEFAULT_DOCUMENTS.items():
                if self._document_exists(name):
                    continue

                disk_path = self.json_dir / name
                payload = default_payload
                if disk_path.exists():
                    try:
                        with open(disk_path, "r", encoding="utf-8") as file_obj:
                            payload = json.load(file_obj)
                    except Exception:
                        payload = default_payload

                self._save_document_internal(name, payload, mirror_to_disk=True)

            self._bootstrapped = True

    def load_document(self, name, default_payload=None):
        self.ensure_bootstrap()

        row = self.conn.execute(
            "SELECT payload_json FROM json_documents WHERE name = ?",
            (name,),
        ).fetchone()
        if row is None:
            payload = deepcopy(default_payload) if default_payload is not None else {}
            self._save_document_internal(name, payload, mirror_to_disk=True)
            return payload

        payload = json.loads(row["payload_json"])
        if name == "dados.json":
            payload = sanitize_dados_payload(payload)
        return payload

    def save_document(self, name, payload):
        self.ensure_bootstrap()
        self._save_document_internal(name, payload, mirror_to_disk=True)
        return True

    def sync_document_to_disk(self, name):
        payload = self.load_document(name, self.default_document(name))
        self._write_snapshot(name, payload)

    def _document_exists(self, name):
        row = self.conn.execute(
            "SELECT 1 FROM json_documents WHERE name = ?",
            (name,),
        ).fetchone()
        return row is not None

    def _save_document_internal(self, name, payload, mirror_to_disk):
        if name == "dados.json":
            payload = sanitize_dados_payload(payload)

        payload_json = json.dumps(payload, ensure_ascii=False)

        with self._lock:
            cursor = self.conn.cursor()
            cursor.execute("BEGIN")
            try:
                cursor.execute(
                    """
                    INSERT INTO json_documents(name, payload_json, updated_at)
                    VALUES(?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(name) DO UPDATE SET
                        payload_json = excluded.payload_json,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    (name, payload_json),
                )

                if name == "dados.json":
                    self._sync_dados(cursor, payload)
                    backup_row = cursor.execute(
                        "SELECT payload_json FROM json_documents WHERE name = ?",
                        ("backup.json",),
                    ).fetchone()
                    if backup_row is not None:
                        self._sync_backup(cursor, json.loads(backup_row["payload_json"]))
                elif name == "backup.json":
                    self._sync_backup(cursor, payload)
                elif name == "sessions.json":
                    self._sync_sessions(cursor, payload)

                self.conn.commit()
            except Exception:
                self.conn.rollback()
                raise

        if mirror_to_disk:
            self._write_snapshot(name, payload)

    def _write_snapshot(self, name, payload):
        file_path = self.json_dir / name
        with open(file_path, "w", encoding="utf-8") as file_obj:
            json.dump(payload, file_obj, ensure_ascii=False, indent=2)

    def _sync_dados(self, cursor, payload):
        cursor.execute("DELETE FROM admins")
        cursor.execute("DELETE FROM empresas")
        cursor.execute("DELETE FROM constants")
        cursor.execute("DELETE FROM materials")
        cursor.execute("DELETE FROM machine_catalog")
        cursor.execute("DELETE FROM acessorios")
        cursor.execute("DELETE FROM dutos")
        cursor.execute("DELETE FROM tubos")

        for index, admin in enumerate(payload.get("ADM", [])):
            if not isinstance(admin, dict):
                continue
            cursor.execute(
                """
                INSERT INTO admins(usuario, token, raw_json, sort_order)
                VALUES(?, ?, ?, ?)
                """,
                (
                    str(admin.get("usuario", "")).strip(),
                    str(admin.get("token", "")).strip() or None,
                    json.dumps(admin, ensure_ascii=False),
                    index,
                ),
            )

        for index, empresa in enumerate(payload.get("empresas", [])):
            empresa_normalizada = normalize_empresa(empresa)
            if not empresa_normalizada or not empresa_normalizada.get("codigo"):
                continue

            cursor.execute(
                """
                INSERT INTO empresas(codigo, nome, credenciais_json, raw_json, sort_order)
                VALUES(?, ?, ?, ?, ?)
                """,
                (
                    str(empresa_normalizada.get("codigo", "")).strip(),
                    str(empresa_normalizada.get("nome", "")).strip(),
                    json.dumps(
                        empresa_normalizada.get("credenciais"), ensure_ascii=False
                    )
                    if empresa_normalizada.get("credenciais") is not None
                    else None,
                    json.dumps(empresa_normalizada, ensure_ascii=False),
                    index,
                ),
            )

        for key, constant_data in (payload.get("constants") or {}).items():
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

        for index, (key, material_data) in enumerate((payload.get("materials") or {}).items()):
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

        for index, machine in enumerate(payload.get("machines", [])):
            if not isinstance(machine, dict) or not machine.get("type"):
                continue
            cursor.execute(
                """
                INSERT INTO machine_catalog(type, aplicacao, raw_json, sort_order)
                VALUES(?, ?, ?, ?)
                """,
                (
                    str(machine.get("type")),
                    machine.get("aplicacao"),
                    json.dumps(machine, ensure_ascii=False),
                    index,
                ),
            )

        for index, (tipo, acessorio) in enumerate((payload.get("banco_acessorios") or {}).items()):
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

        for index, duto in enumerate(payload.get("dutos", [])):
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

        for index, tubo in enumerate(payload.get("tubos", [])):
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

    def _sync_backup(self, cursor, payload):
        cursor.execute("DELETE FROM sala_maquinas")
        cursor.execute("DELETE FROM salas")
        cursor.execute("DELETE FROM projetos")
        cursor.execute("DELETE FROM obras")

        for obra_index, obra in enumerate(payload.get("obras", [])):
            if not isinstance(obra, dict):
                continue

            obra_id = str(obra.get("id", "")).strip()
            if not obra_id:
                continue

            empresa_codigo = str(obra.get("empresaSigla", "")).strip() or None
            empresa_nome = obra.get("empresaNome")
            if empresa_codigo:
                cursor.execute(
                    """
                    INSERT OR IGNORE INTO empresas(
                        codigo, nome, credenciais_json, raw_json, sort_order
                    )
                    VALUES(?, ?, NULL, ?, 999999)
                    """,
                    (
                        empresa_codigo,
                        empresa_nome or empresa_codigo,
                        json.dumps(
                            {
                                "codigo": empresa_codigo,
                                "nome": empresa_nome or empresa_codigo,
                                "credenciais": None,
                            },
                            ensure_ascii=False,
                        ),
                    ),
                )

            cursor.execute(
                """
                INSERT INTO obras(
                    id, nome, empresa_codigo, empresa_id, empresa_nome,
                    numero_cliente_final, raw_json, sort_order
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    obra_id,
                    obra.get("nome"),
                    empresa_codigo,
                    obra.get("empresa_id"),
                    empresa_nome,
                    obra.get("numeroClienteFinal"),
                    json.dumps(obra, ensure_ascii=False),
                    obra_index,
                ),
            )

            for projeto_index, projeto in enumerate(obra.get("projetos", [])):
                if not isinstance(projeto, dict):
                    continue
                projeto_id = str(projeto.get("id") or f"{obra_id}::projeto::{projeto_index}")
                cursor.execute(
                    """
                    INSERT INTO projetos(id, obra_id, nome, raw_json, sort_order)
                    VALUES(?, ?, ?, ?, ?)
                    """,
                    (
                        projeto_id,
                        obra_id,
                        projeto.get("nome"),
                        json.dumps(projeto, ensure_ascii=False),
                        projeto_index,
                    ),
                )

                for sala_index, sala in enumerate(projeto.get("salas", [])):
                    if not isinstance(sala, dict):
                        continue
                    sala_id = str(sala.get("id") or f"{projeto_id}::sala::{sala_index}")
                    cursor.execute(
                        """
                        INSERT INTO salas(id, projeto_id, nome, raw_json, sort_order)
                        VALUES(?, ?, ?, ?, ?)
                        """,
                        (
                            sala_id,
                            projeto_id,
                            sala.get("nome"),
                            json.dumps(sala, ensure_ascii=False),
                            sala_index,
                        ),
                    )

                    for machine_index, machine in enumerate(sala.get("maquinas", [])):
                        if not isinstance(machine, dict):
                            continue
                        machine_id = str(machine.get("id") or f"{sala_id}::machine::{machine_index}")
                        cursor.execute(
                            """
                            INSERT INTO sala_maquinas(
                                id, sala_id, machine_type, raw_json, sort_order
                            )
                            VALUES(?, ?, ?, ?, ?)
                            """,
                            (
                                machine_id,
                                sala_id,
                                machine.get("tipo") or machine.get("type"),
                                json.dumps(machine, ensure_ascii=False),
                                machine_index,
                            ),
                        )

    def _sync_sessions(self, cursor, payload):
        cursor.execute("DELETE FROM sessions")
        for session_id, session_payload in (payload.get("sessions") or {}).items():
            cursor.execute(
                """
                INSERT INTO sessions(session_id, payload_json)
                VALUES(?, ?)
                """,
                (
                    str(session_id),
                    json.dumps(session_payload, ensure_ascii=False),
                ),
            )


def get_storage(project_root):
    root_key = str(Path(project_root).resolve())
    with _STORAGES_LOCK:
        storage = _STORAGES.get(root_key)
        if storage is None:
            storage = DatabaseStorage(project_root)
            _STORAGES[root_key] = storage
        return storage
