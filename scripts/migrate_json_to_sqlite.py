"""Migra os JSONs legados para a base SQLite do projeto."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CODIGO_DIR = ROOT_DIR / "codigo"
if str(CODIGO_DIR) not in sys.path:
    sys.path.insert(0, str(CODIGO_DIR))

from servidor_modules.database.storage import DEFAULT_DOCUMENTS, get_storage


def main():
    project_root = CODIGO_DIR
    json_dir = project_root / "json"
    storage = get_storage(project_root)

    migrated = []
    for name, default_payload in DEFAULT_DOCUMENTS.items():
        source_path = json_dir / name
        if source_path.exists():
            with open(source_path, "r", encoding="utf-8") as file_obj:
                payload = json.load(file_obj)
        else:
            payload = default_payload

        storage.save_document(name, payload)
        migrated.append(name)

    print("Migração concluída.")
    print(f"Projeto: {project_root}")
    print(f"Documentos migrados: {', '.join(migrated)}")


if __name__ == "__main__":
    main()
