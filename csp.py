from pathlib import Path
from collections import defaultdict, Counter
import re

ROOT = Path(".").resolve()
PAGE1 = ROOT / "codigo" / "public" / "scripts" / "page1"


# Diretório CSS para análise
CSS_DIR = ROOT / "codigo" / "public" / "static" / "page1"

def analyze_css_duplicates():
    """
    Analisa todos os arquivos CSS e identifica classes e IDs repetidos
    """
    if not CSS_DIR.exists():
        print(f"[aviso] Diretório CSS não encontrado: {CSS_DIR}")
        return
    
    # Padrões regex para capturar classes e IDs
    class_pattern = r'\.([a-zA-Z][\w-]*(?:\.[a-zA-Z][\w-]*)*)'
    id_pattern = r'#([a-zA-Z][\w-]*)'
    
    # Dicionários para armazenar seletores e onde aparecem
    classes = defaultdict(list)
    ids = defaultdict(list)
    
    # Contadores para estatísticas
    total_classes = 0
    total_ids = 0
    
    print(f"\n[*] Analisando arquivos CSS em {CSS_DIR}")
    
    # Percorre todos os arquivos CSS
    for css_file in CSS_DIR.rglob("*.css"):
        if not css_file.is_file():
            continue
            
        try:
            content = css_file.read_text(encoding="utf-8")
            relative_path = css_file.relative_to(CSS_DIR)
            
            # Remove comentários para evitar falsos positivos
            content_no_comments = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
            
            # Encontra classes
            found_classes = re.findall(class_pattern, content_no_comments)
            for class_name in found_classes:
                # Separa classes compostas (ex: .class1.class2)
                individual_classes = class_name.split('.')
                for cls in individual_classes:
                    if cls:  # Evita strings vazias
                        classes[cls].append(str(relative_path))
                        total_classes += 1
            
            # Encontra IDs
            found_ids = re.findall(id_pattern, content_no_comments)
            for id_name in found_ids:
                if id_name:  # Evita strings vazias
                    ids[id_name].append(str(relative_path))
                    total_ids += 1
                    
        except Exception as e:
            print(f"[erro] Não pude ler {css_file}: {e}")
    
    # Encontra duplicatas
    duplicate_classes = {cls: files for cls, files in classes.items() if len(files) > 1}
    duplicate_ids = {id_name: files for id_name, files in ids.items() if len(files) > 1}
    
    # Gera relatório
    print(f"\n=== RELATÓRIO DE DUPLICATAS CSS ===")
    print(f"Total de classes encontradas: {total_classes}")
    print(f"Total de IDs encontrados: {total_ids}")
    print(f"Classes duplicadas: {len(duplicate_classes)}")
    print(f"IDs duplicados: {len(duplicate_ids)}")
    
    if duplicate_classes:
        print(f"\n--- CLASSES DUPLICADAS ---")
        for cls, files in sorted(duplicate_classes.items(), key=lambda x: len(x[1]), reverse=True):
            file_count = Counter(files)
            print(f".{cls} - aparece {len(files)} vezes em:")
            for file_path, count in file_count.items():
                print(f"    {file_path} ({count} ocorrências)")
    
    if duplicate_ids:
        print(f"\n--- IDs DUPLICADOS ---")
        for id_name, files in sorted(duplicate_ids.items(), key=lambda x: len(x[1]), reverse=True):
            file_count = Counter(files)
            print(f"#{id_name} - aparece {len(files)} vezes em:")
            for file_path, count in file_count.items():
                print(f"    {file_path} ({count} ocorrências)")
    
    # Estatísticas por arquivo
    print(f"\n--- ESTATÍSTICAS POR ARQUIVO ---")
    css_files = {}
    for css_file in CSS_DIR.rglob("*.css"):
        if css_file.is_file():
            try:
                content = css_file.read_text(encoding="utf-8")
                relative_path = str(css_file.relative_to(CSS_DIR))
                
                content_no_comments = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
                
                file_classes = len(re.findall(class_pattern, content_no_comments))
                file_ids = len(re.findall(id_pattern, content_no_comments))
                
                css_files[relative_path] = {
                    'classes': file_classes,
                    'ids': file_ids,
                    'total': file_classes + file_ids
                }
                
            except Exception as e:
                print(f"[erro] Não pude analisar {css_file}: {e}")
    
    for file_path, stats in sorted(css_files.items(), key=lambda x: x[1]['total'], reverse=True):
        print(f"{file_path}: {stats['classes']} classes, {stats['ids']} IDs")
    
    return {
        'duplicate_classes': duplicate_classes,
        'duplicate_ids': duplicate_ids,
        'stats': css_files
    }

# ... (mantenha as outras funções existentes)

def main():


    print("[*] analisando duplicatas CSS")
    css_analysis = analyze_css_duplicates()

    print("\n[OK] ajustes aplicados. Agora rode seu bundler ou abra no navegador pra testar.")

if __name__ == "__main__":
    main()