"""Executa a migracao segura do SQLite local para o PostgreSQL configurado em DATABASE_URL."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
CODIGO_DIR = ROOT_DIR / "codigo"
if str(CODIGO_DIR) not in sys.path:
    sys.path.insert(0, str(CODIGO_DIR))

from servidor_modules.database.connection import migrate_sqlite_to_postgres


def main():
    summary = migrate_sqlite_to_postgres(CODIGO_DIR)
    print("Migracao SQLite -> PostgreSQL concluida.")
    print(f"Projeto: {CODIGO_DIR}")
    print(f"SQLite origem: {summary['sqlite_path']}")
    print(f"PostgreSQL destino: {summary['database_url']}")
    print("Contagens atuais no PostgreSQL:")
    for table_name, row_count in summary["postgres_counts"].items():
        print(f"  - {table_name}: {row_count}")


if __name__ == "__main__":
    main()
