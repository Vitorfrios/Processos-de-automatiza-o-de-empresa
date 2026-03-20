"""Gerenciamento centralizado da conexao SQLite."""

from __future__ import annotations

import sqlite3
import threading
from pathlib import Path


_CONNECTIONS = {}
_CONNECTIONS_LOCK = threading.Lock()


SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS json_documents (
    name TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    usuario TEXT PRIMARY KEY,
    token TEXT,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS empresas (
    codigo TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    credenciais_json TEXT,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS constants (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS materials (
    key TEXT PRIMARY KEY,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS machine_catalog (
    type TEXT PRIMARY KEY,
    aplicacao TEXT,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS acessorios (
    tipo TEXT PRIMARY KEY,
    descricao TEXT,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dutos (
    type TEXT PRIMARY KEY,
    descricao TEXT,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tubos (
    polegadas TEXT PRIMARY KEY,
    mm REAL,
    valor REAL,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS obras (
    id TEXT PRIMARY KEY,
    nome TEXT,
    empresa_codigo TEXT,
    empresa_id TEXT,
    empresa_nome TEXT,
    numero_cliente_final INTEGER,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (empresa_codigo) REFERENCES empresas(codigo) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projetos (
    id TEXT PRIMARY KEY,
    obra_id TEXT NOT NULL,
    nome TEXT,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salas (
    id TEXT PRIMARY KEY,
    projeto_id TEXT NOT NULL,
    nome TEXT,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sala_maquinas (
    id TEXT PRIMARY KEY,
    sala_id TEXT NOT NULL,
    machine_type TEXT,
    raw_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_email_config (
    config_key TEXT PRIMARY KEY,
    email TEXT NOT NULL DEFAULT '',
    token TEXT NOT NULL DEFAULT '',
    nome TEXT NOT NULL DEFAULT '',
    smtp_host TEXT NOT NULL DEFAULT '',
    smtp_port INTEGER,
    use_tls INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS obra_notifications (
    obra_id TEXT PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    last_subject TEXT NOT NULL DEFAULT '',
    last_message TEXT NOT NULL DEFAULT '',
    last_sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_empresas_sort_order ON empresas(sort_order);
CREATE INDEX IF NOT EXISTS idx_machine_catalog_sort_order ON machine_catalog(sort_order);
CREATE INDEX IF NOT EXISTS idx_obras_empresa_codigo ON obras(empresa_codigo);
CREATE INDEX IF NOT EXISTS idx_obras_sort_order ON obras(sort_order);
CREATE INDEX IF NOT EXISTS idx_obra_notifications_sent_at ON obra_notifications(last_sent_at);
CREATE INDEX IF NOT EXISTS idx_projetos_obra_id_sort ON projetos(obra_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_salas_projeto_id_sort ON salas(projeto_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_sala_maquinas_sala_id_sort ON sala_maquinas(sala_id, sort_order);
"""


def get_database_path(project_root) -> Path:
    return Path(project_root) / "database" / "app.sqlite3"


def _initialize_connection(conn: sqlite3.Connection) -> None:
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.executescript(SCHEMA_SQL)
    conn.commit()


def get_connection(project_root) -> sqlite3.Connection:
    db_path = get_database_path(project_root).resolve()

    with _CONNECTIONS_LOCK:
        connection = _CONNECTIONS.get(str(db_path))
        if connection is not None:
            return connection

        db_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(str(db_path), check_same_thread=False)
        _initialize_connection(connection)
        _CONNECTIONS[str(db_path)] = connection
        return connection
