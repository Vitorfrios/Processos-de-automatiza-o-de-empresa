"""
file_utils.py
Utilitários para manipulação de arquivos e paths
"""

import json
import os
from pathlib import Path

from servidor_modules.database.storage import get_storage

class FileUtils:
    """Utilitários para manipulação de arquivos"""
    
    def __init__(self):
        self._project_root = None  # Cache do project root
        self._storage = None

    def _get_storage(self, project_root=None):
        if project_root is None:
            project_root = self.find_project_root()
        if self._storage is None or Path(project_root) != self._storage.project_root:
            self._storage = get_storage(project_root)
        return self._storage
    
    def find_project_root(self):
        """Encontra a raiz do projeto COM CACHE"""
        if self._project_root is not None:
            return self._project_root
            
        current_dir = Path(__file__).parent.parent.parent
        
        # Verificação rápida
        if (current_dir / "public" / "pages" / "login" / "index.html").exists():
            self._project_root = current_dir
        else:
            self._project_root = current_dir
            
        return self._project_root

    def find_json_file(self, filename, project_root=None):
        """Encontra arquivos JSON"""
        if project_root is None:
            project_root = self.find_project_root()
        
        # Garante que a pasta json existe
        json_dir = project_root / "json"
        json_dir.mkdir(parents=True, exist_ok=True)
        
        target_file = json_dir / filename

        if filename in {"backup.json", "dados.json", "sessions.json"}:
            storage = self._get_storage(project_root)
            storage.load_document(filename, storage.default_document(filename))
            storage.sync_document_to_disk(filename)
        elif not target_file.exists():
            self.save_json_file(target_file, {})
        
        return target_file

    def load_json_file(self, filepath, default_data=None):
        """Carrega arquivo JSON com tratamento de erro"""
        try:
            filepath = Path(filepath)
            if filepath.name in {"backup.json", "dados.json", "sessions.json"}:
                storage = self._get_storage(filepath.parent.parent)
                return storage.load_document(filepath.name, default_data)

            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            elif default_data is not None:
                # Cria o arquivo com dados padrão
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(default_data, f, indent=2, ensure_ascii=False)
                return default_data
            else:
                return None
        except Exception as e:
            print(f"ERRO ao carregar {filepath}: {e}")
            return default_data

    def save_json_file(self, filepath, data):
        """Salva dados em arquivo JSON"""
        try:
            filepath = Path(filepath)
            if filepath.name in {"backup.json", "dados.json", "sessions.json"}:
                storage = self._get_storage(filepath.parent.parent)
                return storage.save_document(filepath.name, data)

            # Garante que o diretório existe
            filepath.parent.mkdir(parents=True, exist_ok=True)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"ERRO ao salvar {filepath}: {e}")
            return False
