"""
file_utils.py
Utilitários para manipulação de arquivos e paths
"""

import json
import os
from pathlib import Path

class FileUtils:
    """Utilitários para manipulação de arquivos"""
    
    def find_project_root(self):
        """Encontra a raiz do projeto procurando pela estrutura de pastas"""
        current_dir = Path(__file__).parent.parent.parent  # Pasta servidor_modules -> codigo
        
        print(f"Procurando estrutura a partir de: {current_dir}")
        
        # Verifica se estamos na estrutura correta
        if (current_dir / "public" / "pages" / "01_CreateProjects.html").exists():
            print("Estrutura encontrada: Diretorio correto")
            return current_dir
        
        # Fallback: diretório atual do script
        print("Usando diretorio do script como raiz")
        return current_dir

    def find_json_file(self, filename, project_root=None):
        """Encontra arquivos JSON"""
        if project_root is None:
            project_root = self.find_project_root()
        
        # Garante que a pasta json existe
        json_dir = project_root / "json"
        json_dir.mkdir(parents=True, exist_ok=True)
        
        target_file = json_dir / filename
        
        # Se o arquivo não existe, cria com estrutura básica
        if not target_file.exists():
            print(f"Criando arquivo: {target_file}")
            
            if filename == "backup.json":
                default_data = {"obras": []}
            elif filename == "dados.json":
                default_data = {"constants": {}, "machines": []}
            elif filename == "sessions.json":
                default_data = {"sessions": {}}
            else:
                default_data = {}
            
            self.save_json_file(target_file, default_data)
        
        return target_file

    def load_json_file(self, filepath, default_data=None):
        """Carrega arquivo JSON com tratamento de erro"""
        try:
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
            # Garante que o diretório existe
            filepath.parent.mkdir(parents=True, exist_ok=True)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"ERRO ao salvar {filepath}: {e}")
            return False