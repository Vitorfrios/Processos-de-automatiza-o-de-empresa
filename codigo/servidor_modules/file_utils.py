"""
Utilitários para manipulação de arquivos e paths
"""

import json
from pathlib import Path

def find_project_root():
    """Encontra a raiz do projeto procurando pela estrutura de pastas"""
    current_dir = Path.cwd()
    
    print(f"🔍 Procurando estrutura a partir de: {current_dir}")
    
    # Cenário 1: Estamos DENTRO da pasta codigo
    if (current_dir / "public" / "pages" / "index.html").exists():
        print("✅ Estrutura encontrada: Dentro da pasta codigo")
        return current_dir
    
    # Cenário 2: A pasta codigo está no diretório atual
    codigo_dir = current_dir / "codigo"
    if (codigo_dir / "public" / "pages" / "index.html").exists():
        print("✅ Estrutura encontrada: Pasta codigo no diretório atual")
        return codigo_dir
    
    # Cenário 3: Procurar em diretórios pais
    for parent in current_dir.parents:
        codigo_dir = parent / "codigo"
        if (codigo_dir / "public" / "pages" / "index.html").exists():
            print(f"✅ Estrutura encontrada: {codigo_dir}")
            return codigo_dir
    
    # Fallback: usa o diretório atual
    print("⚠️  Estrutura de pastas não encontrada, usando diretório atual")
    return current_dir

def find_json_file(filename, project_root):
    """Encontra arquivos JSON"""
    possible_locations = [
        project_root / "json" / filename,
        Path.cwd() / "json" / filename,
    ]
    
    for location in possible_locations:
        if location.exists():
            return location
    
    target_dir = project_root / "json"
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir / filename

def load_json_file(filepath, default_data=None):
    """Carrega arquivo JSON com tratamento de erro"""
    try:
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        elif default_data is not None:

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(default_data, f, indent=2)
            return default_data
        else:
            return None
    except Exception as e:
        print(f"❌ Erro ao carregar {filepath}: {e}")
        return default_data

def save_json_file(filepath, data):
    """Salva dados em arquivo JSON"""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"❌ Erro ao salvar {filepath}: {e}")
        return False