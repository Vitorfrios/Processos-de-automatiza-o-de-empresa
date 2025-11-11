from pathlib import Path
from collections import defaultdict, Counter
import re

ROOT = Path(".").resolve()
JS_DIR = ROOT / "codigo" / "public" / "scripts" / "page1"
REPORT_FILE = ROOT / "relatorio_js_detalhado.txt"

def analyze_js_comprehensive():
    """
    Analisa todos os arquivos JS de forma completa e gera relatório detalhado
    """
    if not JS_DIR.exists():
        print(f"[aviso] Diretório JS não encontrado: {JS_DIR}")
        return
    
    # Padrões regex melhorados
    function_pattern = r'function\s+([a-zA-Z_$][\w$]*)'
    arrow_function_pattern = r'const\s+([a-zA-Z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>'
    import_pattern = r'import\s+(?:(?:\{([^}]+)\}|([^;]+))\s+from\s+[\'"]([^\'"]+)[\'"]|[\'"]([^\'"]+)[\'"])'
    export_pattern = r'export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([a-zA-Z_$][\w$]*)|export\s+\{([^}]+)\}'
    export_default_pattern = r'export\s+default\s+([a-zA-Z_$][\w$]*)'
    
    all_files_data = {}
    function_usages = defaultdict(list)
    
    print(f"[*] Analisando arquivos JS em {JS_DIR}")
    
    with open(REPORT_FILE, 'w', encoding='utf-8') as report:
        report.write("=" * 80 + "\n")
        report.write("RELATÓRIO COMPLETO DE ANÁLISE JAVASCRIPT\n")
        report.write("=" * 80 + "\n\n")
        
        # Primeira passagem: coleta dados básicos de todos os arquivos
        for js_file in JS_DIR.rglob("*.js"):
            if not js_file.is_file():
                continue
                
            try:
                content = js_file.read_text(encoding="utf-8")
                relative_path = str(js_file.relative_to(JS_DIR))
                lines = content.split('\n')
                num_lines = len(lines)
                
                # Remove comentários para análise
                content_no_comments = re.sub(r'//.*?$|/\*.*?\*/', '', content, flags=re.DOTALL | re.MULTILINE)
                
                # Encontra funções
                normal_functions = re.findall(function_pattern, content_no_comments)
                arrow_functions = re.findall(arrow_function_pattern, content_no_comments)
                all_functions = normal_functions + arrow_functions
                
                # Encontra imports
                imports = []
                import_matches = re.findall(import_pattern, content)
                for match in import_matches:
                    named_imports = match[0] if match[0] else match[1]
                    source = match[2] if match[2] else match[3]
                    if named_imports:
                        imports.append(f"{{ {named_imports} }} from '{source}'")
                    elif source:
                        imports.append(f"* from '{source}'")
                
                # Encontra exports
                exports = []
                export_matches = re.findall(export_pattern, content)
                for match in export_matches:
                    if match[0]:  # export individual
                        exports.append(match[0])
                    elif match[1]:  # export múltiplo
                        exports.extend([exp.strip() for exp in match[1].split(',')])
                
                # Export default
                export_default = re.findall(export_default_pattern, content)
                exports.extend([f"{exp} (default)" for exp in export_default])
                
                # Armazena dados do arquivo
                all_files_data[relative_path] = {
                    'lines': num_lines,
                    'functions': all_functions,
                    'imports': imports,
                    'exports': exports,
                    'content': content
                }
                
                # Registra usos de funções
                for func in all_functions:
                    function_usages[func].append(relative_path)
                    
            except Exception as e:
                print(f"[erro] Não pude ler {js_file}: {e}")
        
        # Gera relatório por arquivo
        report.write("DETALHAMENTO POR ARQUIVO:\n")
        report.write("=" * 80 + "\n\n")
        
        for file_path, data in sorted(all_files_data.items()):
            report.write(f"📁 ARQUIVO: {file_path}\n")
            report.write(f"   📏 Linhas de código: {data['lines']}\n")
            report.write(f"   🔧 Funções encontradas: {len(data['functions'])}\n")
            
            if data['functions']:
                report.write("   📋 Lista de funções:\n")
                for func in sorted(data['functions']):
                    usage_count = len(function_usages.get(func, []))
                    report.write(f"      • {func}() (usada em {usage_count} arquivos)\n")
            
            if data['imports']:
                report.write("   📥 IMPORTS:\n")
                for imp in data['imports']:
                    report.write(f"      • {imp}\n")
            
            if data['exports']:
                report.write("   📤 EXPORTS:\n")
                for exp in data['exports']:
                    report.write(f"      • {exp}\n")
            
            report.write("-" * 60 + "\n\n")
        
        # Análise de duplicatas
        report.write("\n" + "=" * 80 + "\n")
        report.write("ANÁLISE DE FUNÇÕES DUPLICADAS\n")
        report.write("=" * 80 + "\n\n")
        
        duplicate_functions = {func: files for func, files in function_usages.items() if len(files) > 1}
        
        if duplicate_functions:
            report.write(f"🚨 FUNÇÕES DUPLICADAS ENCONTRADAS: {len(duplicate_functions)}\n\n")
            
            for func, files in sorted(duplicate_functions.items(), key=lambda x: len(x[1]), reverse=True):
                file_count = Counter(files)
                report.write(f"🔧 function {func}() - aparece em {len(files)} arquivos:\n")
                
                for file_path, count in file_count.most_common():
                    # Mostra contexto da função nos arquivos
                    file_data = all_files_data.get(file_path, {})
                    functions_in_file = file_data.get('functions', [])
                    
                    if func in functions_in_file:
                        status = "🔴 DEFINIDA"
                    else:
                        status = "🔵 USADA"
                    
                    report.write(f"   📁 {file_path} ({count}x) - {status}\n")
                
                report.write("\n")
        else:
            report.write("✅ Nenhuma função duplicada encontrada!\n\n")
        
        # Estatísticas gerais
        report.write("\n" + "=" * 80 + "\n")
        report.write("ESTATÍSTICAS GERAIS\n")
        report.write("=" * 80 + "\n\n")
        
        total_files = len(all_files_data)
        total_lines = sum(data['lines'] for data in all_files_data.values())
        total_functions = sum(len(data['functions']) for data in all_files_data.values())
        total_imports = sum(len(data['imports']) for data in all_files_data.values())
        total_exports = sum(len(data['exports']) for data in all_files_data.values())
        
        report.write(f"📊 ESTATÍSTICAS:\n")
        report.write(f"   • Total de arquivos .js: {total_files}\n")
        report.write(f"   • Total de linhas de código: {total_lines}\n")
        report.write(f"   • Total de funções: {total_functions}\n")
        report.write(f"   • Total de imports: {total_imports}\n")
        report.write(f"   • Total de exports: {total_exports}\n")
        report.write(f"   • Funções duplicadas: {len(duplicate_functions)}\n")
        
        # Top 10 arquivos com mais funções
        report.write(f"\n🏆 TOP 10 ARQUIVOS COM MAIS FUNÇÕES:\n")
        top_files = sorted(all_files_data.items(), key=lambda x: len(x[1]['functions']), reverse=True)[:10]
        for i, (file_path, data) in enumerate(top_files, 1):
            report.write(f"   {i:2d}. {file_path}: {len(data['functions'])} funções, {data['lines']} linhas\n")
        
        # Arquivos sem exports
        files_without_exports = [fp for fp, data in all_files_data.items() if not data['exports']]
        if files_without_exports:
            report.write(f"\n⚠️  ARQUIVOS SEM EXPORTS ({len(files_without_exports)}):\n")
            for file_path in sorted(files_without_exports)[:10]:  # Mostra só os 10 primeiros
                report.write(f"   • {file_path}\n")
            if len(files_without_exports) > 10:
                report.write(f"   ... e mais {len(files_without_exports) - 10} arquivos\n")
    
    print(f"[+] Relatório gerado em: {REPORT_FILE}")
    
    # Mostra resumo no console
    print(f"\n=== RESUMO DA ANÁLISE ===")
    print(f"Arquivos analisados: {total_files}")
    print(f"Linhas de código: {total_lines}")
    print(f"Funções totais: {total_functions}")
    print(f"Funções duplicadas: {len(duplicate_functions)}")
    print(f"Relatório detalhado: {REPORT_FILE}")
    
    return {
        'total_files': total_files,
        'total_lines': total_lines,
        'total_functions': total_functions,
        'duplicate_functions': duplicate_functions,
        'all_files_data': all_files_data
    }

def main():
    print("[*] Iniciando análise completa de JavaScript...")
    analysis = analyze_js_comprehensive()
    
    if analysis['duplicate_functions']:
        print(f"\n🚨 FUNÇÕES DUPLICADAS ENCONTRADAS:")
        for func, files in sorted(analysis['duplicate_functions'].items(), key=lambda x: len(x[1]), reverse=True)[:10]:
            print(f"   • {func}(): {len(files)} arquivos")
        if len(analysis['duplicate_functions']) > 10:
            print(f"   ... e mais {len(analysis['duplicate_functions']) - 10} funções")
    else:
        print(f"\n✅ Nenhuma função duplicada encontrada!")
    
    print(f"\n[✅] Análise concluída! Verifique o relatório completo em: {REPORT_FILE}")

if __name__ == "__main__":
    main()