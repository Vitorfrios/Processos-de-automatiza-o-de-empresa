from pathlib import Path
from collections import defaultdict, Counter
import re

ROOT = Path(".").resolve()
CSS_DIR = ROOT / "codigo" / "public" / "static" / "01_Create_Obra"
REPORT_FILE = ROOT / "relatorio_css_detalhado.txt"

def analyze_css_comprehensive():
    """
    Analisa todos os arquivos CSS de forma completa
    """
    if not CSS_DIR.exists():
        print(f"[erro] Diretório CSS não encontrado: {CSS_DIR}")
        return
    
    css_files = list(CSS_DIR.glob("*.css"))
    
    if not css_files:
        print(f"[aviso] Nenhum arquivo CSS encontrado em {CSS_DIR}")
        return
    
    # Padrões regex para CSS - CORRIGIDOS
    selector_pattern = r'^([^{]+)\{'
    class_pattern = r'\.([a-zA-Z][\w-]*)'
    id_pattern = r'#([a-zA-Z_][\w-]*)'  # IDs começam com letra ou _
    property_pattern = r'([a-zA-Z-]+)\s*:\s*([^;]+);'
    media_query_pattern = r'@media[^{]+\{'
    import_pattern = r'@import[^;]+;'
    color_hex_pattern = r'#([0-9a-fA-F]{3,6})'  # Padrão para cores hex
    
    all_files_data = {}
    selector_usages = defaultdict(list)
    class_usages = defaultdict(list)
    id_usages = defaultdict(list)
    color_usages = defaultdict(list)
    
    print(f"[*] Analisando arquivos CSS em {CSS_DIR}")
    
    with open(REPORT_FILE, 'w', encoding='utf-8') as report:
        report.write("=" * 80 + "\n")
        report.write("RELATÓRIO COMPLETO DE ANÁLISE CSS\n")
        report.write("=" * 80 + "\n\n")
        
        # Analisa cada arquivo CSS
        for css_file in css_files:
            try:
                content = css_file.read_text(encoding="utf-8")
                relative_path = str(css_file.relative_to(ROOT))
                lines = content.split('\n')
                num_lines = len(lines)
                
                # Encontra seletores
                selectors = re.findall(selector_pattern, content, re.MULTILINE)
                clean_selectors = []
                for selector in selectors:
                    # Remove comentários e espaços extras
                    clean_selector = re.sub(r'/\*.*?\*/', '', selector).strip()
                    if clean_selector and not clean_selector.startswith('@'):
                        clean_selectors.append(clean_selector)
                
                # Encontra classes
                classes = re.findall(class_pattern, content)
                unique_classes = list(set(classes))
                
                # Encontra IDs - Só IDs válidos (começam com letra)
                ids = re.findall(id_pattern, content)
                # Filtra para garantir que são IDs válidos, não cores
                valid_ids = [id_name for id_name in ids if not id_name.isdigit() and not re.match(r'^[0-9a-fA-F]{3,6}$', id_name)]
                unique_ids = list(set(valid_ids))
                
                # Encontra cores hexadecimais
                color_hexes = re.findall(color_hex_pattern, content)
                unique_colors = list(set([f"#{color}" for color in color_hexes]))
                
                # Encontra propriedades
                properties = re.findall(property_pattern, content)
                property_count = len(properties)
                
                # Encontra media queries
                media_queries = re.findall(media_query_pattern, content)
                
                # Encontra imports
                imports = re.findall(import_pattern, content)
                
                # Conta regras CSS
                rule_count = len(clean_selectors)
                
                # Armazena dados do arquivo
                all_files_data[relative_path] = {
                    'lines': num_lines,
                    'selectors': clean_selectors,
                    'classes': unique_classes,
                    'ids': unique_ids,
                    'colors': unique_colors,
                    'properties': properties,
                    'property_count': property_count,
                    'media_queries': media_queries,
                    'imports': imports,
                    'rule_count': rule_count,
                    'content': content
                }
                
                # Registra usos
                for selector in clean_selectors:
                    selector_usages[selector].append(relative_path)
                for class_name in unique_classes:
                    class_usages[class_name].append(relative_path)
                for id_name in unique_ids:
                    id_usages[id_name].append(relative_path)
                for color in unique_colors:
                    color_usages[color].append(relative_path)
                    
            except Exception as e:
                print(f"[erro] Não pude ler {css_file}: {e}")
        
        # Gera relatório por arquivo
        report.write("DETALHAMENTO POR ARQUIVO:\n")
        report.write("=" * 80 + "\n\n")
        
        for file_path, data in sorted(all_files_data.items()):
            report.write(f"🎨 ARQUIVO: {file_path}\n")
            report.write(f"   📏 Linhas de código: {data['lines']}\n")
            report.write(f"   🎯 Regras CSS: {data['rule_count']}\n")
            report.write(f"   ⚙️  Propriedades: {data['property_count']}\n")
            report.write(f"   📱 Media Queries: {len(data['media_queries'])}\n")
            report.write(f"   📥 Imports: {len(data['imports'])}\n")
            
            if data['classes']:
                report.write(f"   🏷️  Classes encontradas: {len(data['classes'])}\n")
                report.write("   📋 Lista de classes:\n")
                for class_name in sorted(data['classes'])[:20]:
                    usage_count = len(class_usages.get(class_name, []))
                    report.write(f"      • .{class_name} (usada em {usage_count} arquivos)\n")
                if len(data['classes']) > 20:
                    report.write(f"      ... e mais {len(data['classes']) - 20} classes\n")
            
            if data['ids']:
                report.write(f"   🆔 IDs encontrados: {len(data['ids'])}\n")
                report.write("   📋 Lista de IDs:\n")
                for id_name in sorted(data['ids'])[:10]:
                    usage_count = len(id_usages.get(id_name, []))
                    report.write(f"      • #{id_name} (usado em {usage_count} arquivos)\n")
                if len(data['ids']) > 10:
                    report.write(f"      ... e mais {len(data['ids']) - 10} IDs\n")
            else:
                report.write(f"   🆔 IDs encontrados: 0\n")
            
            if data['colors']:
                report.write(f"   🎨 Cores hexadecimais: {len(data['colors'])}\n")
                report.write("   📋 Lista de cores:\n")
                for color in sorted(data['colors'])[:15]:
                    usage_count = len(color_usages.get(color, []))
                    report.write(f"      • {color} (usada em {usage_count} arquivos)\n")
                if len(data['colors']) > 15:
                    report.write(f"      ... e mais {len(data['colors']) - 15} cores\n")
            
            if data['selectors']:
                report.write(f"   🎯 Seletores principais: {len(data['selectors'])}\n")
                report.write("   📋 Lista de seletores:\n")
                for selector in sorted(data['selectors'])[:10]:
                    usage_count = len(selector_usages.get(selector, []))
                    # Trunca seletores muito longos
                    display_selector = selector if len(selector) <= 50 else selector[:47] + "..."
                    report.write(f"      • {display_selector} (usado em {usage_count} arquivos)\n")
                if len(data['selectors']) > 10:
                    report.write(f"      ... e mais {len(data['selectors']) - 10} seletores\n")
            
            if data['media_queries']:
                report.write("   📱 Media Queries:\n")
                for media_query in data['media_queries'][:5]:
                    report.write(f"      • {media_query.strip()}\n")
                if len(data['media_queries']) > 5:
                    report.write(f"      ... e mais {len(data['media_queries']) - 5} media queries\n")
            
            report.write("-" * 60 + "\n\n")
        
        # Análise de duplicatas
        report.write("\n" + "=" * 80 + "\n")
        report.write("ANÁLISE DE CLASSES E IDs DUPLICADOS\n")
        report.write("=" * 80 + "\n\n")
        
        duplicate_classes = {cls: files for cls, files in class_usages.items() if len(files) > 1}
        duplicate_ids = {id_name: files for id_name, files in id_usages.items() if len(files) > 1}
        duplicate_selectors = {sel: files for sel, files in selector_usages.items() if len(files) > 1}
        
        if duplicate_classes:
            report.write(f"🚨 CLASSES DUPLICADAS ENCONTRADAS: {len(duplicate_classes)}\n\n")
            
            for cls, files in sorted(duplicate_classes.items(), key=lambda x: len(x[1]), reverse=True)[:10]:
                file_count = Counter(files)
                report.write(f"🏷️  .{cls} - aparece em {len(files)} arquivos:\n")
                
                for file_path, count in file_count.most_common():
                    report.write(f"   📁 {file_path} ({count}x)\n")
                
                report.write("\n")
        else:
            report.write("✅ Nenhuma classe duplicada encontrada!\n\n")
        
        if duplicate_ids:
            report.write(f"🚨 IDs DUPLICADOS ENCONTRADAS: {len(duplicate_ids)}\n\n")
            
            for id_name, files in sorted(duplicate_ids.items(), key=lambda x: len(x[1]), reverse=True)[:10]:
                file_count = Counter(files)
                report.write(f"🆔 #{id_name} - aparece em {len(files)} arquivos:\n")
                
                for file_path, count in file_count.most_common():
                    report.write(f"   📁 {file_path} ({count}x)\n")
                
                report.write("\n")
        else:
            report.write("✅ Nenhum ID duplicado encontrado!\n\n")
        
        if duplicate_selectors:
            report.write(f"🚨 SELETORES DUPLICADOS ENCONTRADOS: {len(duplicate_selectors)}\n\n")
            
            for selector, files in sorted(duplicate_selectors.items(), key=lambda x: len(x[1]), reverse=True)[:10]:
                file_count = Counter(files)
                display_selector = selector if len(selector) <= 40 else selector[:37] + "..."
                report.write(f"🎯 {display_selector} - aparece em {len(files)} arquivos:\n")
                
                for file_path, count in file_count.most_common():
                    report.write(f"   📁 {file_path} ({count}x)\n")
                
                report.write("\n")
        else:
            report.write("✅ Nenhum seletor duplicado encontrado!\n\n")
        
        # Estatísticas gerais
        report.write("\n" + "=" * 80 + "\n")
        report.write("ESTATÍSTICAS GERAIS CSS\n")
        report.write("=" * 80 + "\n\n")
        
        total_files = len(all_files_data)
        total_lines = sum(data['lines'] for data in all_files_data.values())
        total_selectors = sum(len(data['selectors']) for data in all_files_data.values())
        total_classes = sum(len(data['classes']) for data in all_files_data.values())
        total_ids = sum(len(data['ids']) for data in all_files_data.values())
        total_colors = sum(len(data['colors']) for data in all_files_data.values())
        total_properties = sum(data['property_count'] for data in all_files_data.values())
        total_media_queries = sum(len(data['media_queries']) for data in all_files_data.values())
        
        report.write(f"📊 ESTATÍSTICAS:\n")
        report.write(f"   • Total de arquivos .css: {total_files}\n")
        report.write(f"   • Total de linhas de código: {total_lines}\n")
        report.write(f"   • Total de seletores: {total_selectors}\n")
        report.write(f"   • Total de classes: {total_classes}\n")
        report.write(f"   • Total de IDs: {total_ids}\n")
        report.write(f"   • Total de cores hex: {total_colors}\n")
        report.write(f"   • Total de propriedades: {total_properties}\n")
        report.write(f"   • Total de media queries: {total_media_queries}\n")
        report.write(f"   • Classes duplicadas: {len(duplicate_classes)}\n")
        report.write(f"   • IDs duplicados: {len(duplicate_ids)}\n")
        report.write(f"   • Seletores duplicados: {len(duplicate_selectors)}\n")
        
        # Top 10 arquivos com mais regras
        report.write(f"\n🏆 TOP 10 ARQUIVOS COM MAIS REGRAS:\n")
        top_files = sorted(
            all_files_data.items(), 
            key=lambda x: x[1]['rule_count'], 
            reverse=True
        )[:10]
        
        for i, (file_path, data) in enumerate(top_files, 1):
            report.write(f"   {i:2d}. {file_path}: {data['rule_count']} regras, {data['property_count']} propriedades, {data['lines']} linhas\n")
        
        # Propriedades mais comuns
        report.write(f"\n⚙️  PROPRIEDADES MAIS COMUNS:\n")
        all_properties = []
        for data in all_files_data.values():
            all_properties.extend([prop[0] for prop in data['properties']])
        
        property_counter = Counter(all_properties)
        for prop, count in property_counter.most_common(15):
            report.write(f"   • {prop}: {count} ocorrências\n")
        
        # Cores mais usadas
        if total_colors > 0:
            report.write(f"\n🎨 CORES MAIS USADAS:\n")
            all_colors = []
            for data in all_files_data.values():
                all_colors.extend(data['colors'])
            
            color_counter = Counter(all_colors)
            for color, count in color_counter.most_common(10):
                report.write(f"   • {color}: {count} ocorrências\n")
    
    print(f"[+] Relatório CSS gerado em: {REPORT_FILE}")
    
    # Mostra resumo no console
    print(f"\n=== RESUMO DA ANÁLISE CSS ===")
    print(f"Arquivos CSS analisados: {total_files}")
    print(f"Linhas de código: {total_lines}")
    print(f"Seletores totais: {total_selectors}")
    print(f"Classes totais: {total_classes}")
    print(f"IDs totais: {total_ids}")
    print(f"Cores hex: {total_colors}")
    print(f"Propriedades totais: {total_properties}")
    print(f"Classes duplicadas: {len(duplicate_classes)}")
    print(f"IDs duplicados: {len(duplicate_ids)}")
    print(f"Relatório detalhado: {REPORT_FILE}")
    
    return {
        'total_files': total_files,
        'total_lines': total_lines,
        'total_selectors': total_selectors,
        'total_classes': total_classes,
        'total_ids': total_ids,
        'total_colors': total_colors,
        'total_properties': total_properties,
        'duplicate_classes': duplicate_classes,
        'duplicate_ids': duplicate_ids,
        'all_files_data': all_files_data
    }

def main():
    print("[*] Iniciando análise completa de CSS...")
    analysis = analyze_css_comprehensive()
    
    if analysis['duplicate_classes']:
        print(f"\n🚨 CLASSES DUPLICADAS ENCONTRADAS:")
        for cls, files in sorted(analysis['duplicate_classes'].items(), key=lambda x: len(x[1]), reverse=True)[:5]:
            print(f"   • .{cls}: {len(files)} arquivos")
        if len(analysis['duplicate_classes']) > 5:
            print(f"   ... e mais {len(analysis['duplicate_classes']) - 5} classes")
    
    if analysis['duplicate_ids']:
        print(f"\n🚨 IDs DUPLICADOS ENCONTRADAS:")
        for id_name, files in sorted(analysis['duplicate_ids'].items(), key=lambda x: len(x[1]), reverse=True)[:5]:
            print(f"   • #{id_name}: {len(files)} arquivos")
        if len(analysis['duplicate_ids']) > 5:
            print(f"   ... e mais {len(analysis['duplicate_ids']) - 5} IDs")
    
    if not analysis['duplicate_classes'] and not analysis['duplicate_ids']:
        print(f"\n✅ Nenhuma classe ou ID duplicado encontrado!")
    
    print(f"\n[✅] Análise CSS concluída! Verifique o relatório completo em: {REPORT_FILE}")

if __name__ == "__main__":
    main()