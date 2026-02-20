# Script para verificar consistência em TODOS os arquivos
import os
from pathlib import Path

def check_all_files():
    project_root = Path('.')
    
    # Padrões para buscar
    patterns = {
        'total-tr-aprox': [],
        'total-tr-exato': [],
        'totalTRaprox': [],
        'totalTRexato': [],
        'carga-estimada': []
    }
    
    print("=" * 80)
    print("🔍 VERIFICAÇÃO DE CONSISTÊNCIA EM TODOS OS ARQUIVOS")
    print("=" * 80)
    
    # Procurar em todos os arquivos JS
    js_files = list(project_root.glob('**/*.js'))
    
    for file_path in js_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                for pattern in patterns.keys():
                    if pattern in content:
                        patterns[pattern].append(str(file_path.relative_to(project_root)))
                        
        except:
            continue
    
    # Mostrar resultados
    for pattern, files in patterns.items():
        if files:
            print(f"\n📋 '{pattern}' encontrado em {len(files)} arquivos:")
            for file in files[:5]:  # Mostrar até 5 arquivos
                print(f"   • {file}")
            if len(files) > 5:
                print(f"   ... e mais {len(files) - 5} arquivos")

check_all_files()