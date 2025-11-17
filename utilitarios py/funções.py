import os
from pathlib import Path

# pasta base do seu projeto (ajuste se precisar)
BASE_DIR = Path(__file__).resolve().parent  # pasta onde está este .py
TARGET_DIR = BASE_DIR / "data" / "builders" / "data-builders-folder"

# arquivos que você quer criar dentro da pasta
files = {
    "obra-data-builder.js": """// data/builders/data-builders-folder/obra-data-builder.js
// Responsável por montar o objeto completo da obra (incluindo dados de empresa, projetos e salas).
""",
    "room-data-extractor.js": """// data/builders/data-builders-folder/room-data-extractor.js
// Extrai dados das salas (inputs, máquinas, capacidade, configuração, ganhos térmicos).
""",
    "climatization-data-extractor.js": """// data/builders/data-builders-folder/climatization-data-extractor.js
// Extrai e prepara os inputs de climatização usados nos cálculos.
""",
    "thermal-gains-extractor.js": """// data/builders/data-builders-folder/thermal-gains-extractor.js
// Extrai resultados e componentes de ganhos térmicos (W e TR) da sala.
""",
    "machines-data-extractor.js": """// data/builders/data-builders-folder/machines-data-extractor.js
// Extrai dados de máquinas (tipo, potência, tensão, opções e preços).
""",
    "capacity-data-extractor.js": """// data/builders/data-builders-folder/capacity-data-extractor.js
// Extrai dados da tabela de capacidade de refrigeração (TR, fator de segurança, backup, folga etc.).
""",
    "configuration-data-extractor.js": """// data/builders/data-builders-folder/configuration-data-extractor.js
// Extrai opções de configuração/instalação (checkboxes) da sala.
""",
    "empresa-data-extractor.js": """// data/builders/data-builders-folder/empresa-data-extractor.js
// Extrai dados de empresa da obra (empresaSigla, numeroClienteFinal, clienteFinal etc.).
""",
    "data-builders.js": """// data/builders/data-builders-folder/data-builders.js
// Arquivo principal que orquestra todos os builders/extractors e expõe a API pública.

export * from './obra-data-builder.js';
export * from './room-data-extractor.js';
export * from './climatization-data-extractor.js';
export * from './thermal-gains-extractor.js';
export * from './machines-data-extractor.js';
export * from './capacity-data-extractor.js';
export * from './configuration-data-extractor.js';
export * from './empresa-data-extractor.js';
"""
}

def main():
    # cria a pasta (e pais) se não existir
    os.makedirs(TARGET_DIR, exist_ok=True)

    for filename, content in files.items():
        file_path = TARGET_DIR / filename
        # não sobrescreve se já existir – mude se quiser sobrescrever sempre
        if file_path.exists():
            print(f"Já existe, não alterado: {file_path}")
            continue
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Criado: {file_path}")

if __name__ == "__main__":
    main()
