from pathlib import Path
from collections import defaultdict, Counter
import re

ROOT = Path(".").resolve()
SERV_DIR = ROOT / "codigo" / "servidor_modules"
SERVER_FILE = ROOT / "codigo" / "servidor.py"
REPORT_FILE = ROOT / "relatorio_python_detalhado.txt"

def analyze_python_comprehensive():
    """
    Analisa todos os arquivos Python do servidor de forma completa
    """
    python_files = []
    
    # Adiciona servidor.py se existir
    if SERVER_FILE.exists():
        python_files.append(SERVER_FILE)
    
    # Adiciona arquivos da pasta servidor_modules
    if SERV_DIR.exists():
        python_files.extend(SERV_DIR.rglob("*.py"))
    
    if not python_files:
        print(f"[aviso] Nenhum arquivo Python encontrado em {SERV_DIR} e {SERVER_FILE}")
        return
    
    # Padrões regex para Python
    function_pattern = r'^def\s+([a-zA-Z_][\w]*)'
    class_pattern = r'^class\s+([a-zA-Z_][\w]*)'
    import_pattern = r'^import\s+([^\n#]+)|^from\s+([^\s]+)\s+import\s+([^\n#]+)'
    async_function_pattern = r'^async\s+def\s+([a-zA-Z_][\w]*)'
    
    all_files_data = {}
    function_usages = defaultdict(list)
    class_usages = defaultdict(list)
    
    print(f"[*] Analisando arquivos Python...")
    
    with open(REPORT_FILE, 'w', encoding='utf-8') as report:
        report.write("=" * 80 + "\n")
        report.write("RELATÓRIO COMPLETO DE ANÁLISE PYTHON (SERVIDOR)\n")
        report.write("=" * 80 + "\n\n")
        
        # Primeira passagem: coleta dados básicos de todos os arquivos
        for py_file in python_files:
            if not py_file.is_file():
                continue
                
            try:
                content = py_file.read_text(encoding="utf-8")
                
                # Determina caminho relativo
                if py_file == SERVER_FILE:
                    relative_path = "servidor.py"
                else:
                    relative_path = str(py_file.relative_to(ROOT))
                    
                lines = content.split('\n')
                num_lines = len(lines)
                
                # Encontra funções
                functions = re.findall(function_pattern, content, re.MULTILINE)
                async_functions = re.findall(async_function_pattern, content, re.MULTILINE)
                classes = re.findall(class_pattern, content, re.MULTILINE)
                all_functions = functions + async_functions
                
                # Encontra imports
                imports = []
                import_matches = re.findall(import_pattern, content, re.MULTILINE)
                for match in import_matches:
                    if match[0]:  # import simples
                        imports.append(f"import {match[0].strip()}")
                    elif match[1] and match[2]:  # from ... import ...
                        imports.append(f"from {match[1].strip()} import {match[2].strip()}")
                
                # Encontra métodos de classe
                class_methods = defaultdict(list)
                current_class = None
                
                for line in lines:
                    class_match = re.match(class_pattern, line.strip())
                    if class_match:
                        current_class = class_match.group(1)
                    
                    method_match = re.match(r'^\s+def\s+([\w]+)', line)
                    if method_match and current_class:
                        class_methods[current_class].append(method_match.group(1))
                
                # Armazena dados do arquivo
                all_files_data[relative_path] = {
                    'lines': num_lines,
                    'functions': all_functions,
                    'classes': classes,
                    'imports': imports,
                    'class_methods': dict(class_methods),
                    'content': content
                }
                
                # Registra usos de funções e classes
                for func in all_functions:
                    function_usages[func].append(relative_path)
                for cls in classes:
                    class_usages[cls].append(relative_path)
                    
            except Exception as e:
                print(f"[erro] Não pude ler {py_file}: {e}")
        
        # Segunda passagem: análise de usos entre arquivos
        for file_path, data in all_files_data.items():
            content = data['content']
            
            # Busca por usos de funções definidas em outros arquivos
            for func_name, files_where_defined in function_usages.items():
                # Se a função não está definida neste arquivo mas é usada
                if func_name not in data['functions']:
                    # Padrão para uso de função (chamada)
                    usage_pattern = rf'\b{func_name}\s*\('
                    if re.search(usage_pattern, content):
                        function_usages[func_name].append(file_path)
            
            # Busca por usos de classes definidas em outros arquivos
            for class_name, files_where_defined in class_usages.items():
                # Se a classe não está definida neste arquivo mas é usada
                if class_name not in data['classes']:
                    # Padrão para uso de classe (instanciação, herança, etc)
                    usage_pattern = rf'\b{class_name}\b'
                    if re.search(usage_pattern, content):
                        class_usages[class_name].append(file_path)
        
        # Remove duplicatas
        for key in function_usages:
            function_usages[key] = list(set(function_usages[key]))
        for key in class_usages:
            class_usages[key] = list(set(class_usages[key]))
        
        # Gera relatório por arquivo
        report.write("DETALHAMENTO POR ARQUIVO:\n")
        report.write("=" * 80 + "\n\n")
        
        for file_path, data in sorted(all_files_data.items()):
            report.write(f"📁 ARQUIVO: {file_path}\n")
            report.write(f"   📏 Linhas de código: {data['lines']}\n")
            
            if data['classes']:
                report.write(f"   🏛️  Classes encontradas: {len(data['classes'])}\n")
                report.write("   📋 Lista de classes:\n")
                for cls in sorted(data['classes']):
                    usage_count = len(class_usages.get(cls, []))
                    report.write(f"      • {cls} (usada em {usage_count} arquivos)\n")
                    
                    # Mostra métodos da classe se existirem
                    if cls in data['class_methods']:
                        methods = data['class_methods'][cls]
                        for method in sorted(methods):
                            method_usage_count = len(function_usages.get(method, []))
                            report.write(f"          └── {method}() (usada em {method_usage_count} arquivos)\n")
            
            if data['functions']:
                report.write(f"   🔧 Funções encontradas: {len(data['functions'])}\n")
                report.write("   📋 Lista de funções:\n")
                for func in sorted(data['functions']):
                    usage_count = len(function_usages.get(func, []))
                    is_async = func in [f[0] for f in re.findall(async_function_pattern, data['content'], re.MULTILINE)]
                    async_tag = "🔄 " if is_async else ""
                    report.write(f"      • {async_tag}{func}() (usada em {usage_count} arquivos)\n")
            
            if data['imports']:
                report.write("   📥 IMPORTS:\n")
                for imp in data['imports']:
                    report.write(f"      • {imp}\n")
            
            report.write("-" * 60 + "\n\n")
        
        # Análise de duplicatas
        report.write("\n" + "=" * 80 + "\n")
        report.write("ANÁLISE DE FUNÇÕES E CLASSES DUPLICADAS\n")
        report.write("=" * 80 + "\n\n")
        
        duplicate_functions = {func: files for func, files in function_usages.items() if len(files) > 1}
        duplicate_classes = {cls: files for cls, files in class_usages.items() if len(files) > 1}
        
        if duplicate_functions:
            report.write(f"🚨 FUNÇÕES DUPLICADAS ENCONTRADAS: {len(duplicate_functions)}\n\n")
            
            for func, files in sorted(duplicate_functions.items(), key=lambda x: len(x[1]), reverse=True):
                file_count = Counter(files)
                report.write(f"🔧 def {func}() - aparece em {len(files)} arquivos:\n")
                
                for file_path, count in file_count.most_common():
                    file_data = all_files_data.get(file_path, {})
                    
                    if func in file_data.get('functions', []):
                        status = "🔴 DEFINIDA"
                    else:
                        status = "🔵 USADA"
                    
                    report.write(f"   📁 {file_path} ({count}x) - {status}\n")
                
                report.write("\n")
        else:
            report.write("✅ Nenhuma função duplicada encontrada!\n\n")
        
        if duplicate_classes:
            report.write(f"🚨 CLASSES DUPLICADAS ENCONTRADAS: {len(duplicate_classes)}\n\n")
            
            for cls, files in sorted(duplicate_classes.items(), key=lambda x: len(x[1]), reverse=True):
                file_count = Counter(files)
                report.write(f"🏛️  class {cls} - aparece em {len(files)} arquivos:\n")
                
                for file_path, count in file_count.most_common():
                    file_data = all_files_data.get(file_path, {})
                    
                    if cls in file_data.get('classes', []):
                        status = "🔴 DEFINIDA"
                    else:
                        status = "🔵 USADA"
                    
                    report.write(f"   📁 {file_path} ({count}x) - {status}\n")
                
                report.write("\n")
        else:
            report.write("✅ Nenhuma classe duplicada encontrada!\n\n")
        
        # Estatísticas gerais
        report.write("\n" + "=" * 80 + "\n")
        report.write("ESTATÍSTICAS GERAIS\n")
        report.write("=" * 80 + "\n\n")
        
        total_files = len(all_files_data)
        total_lines = sum(data['lines'] for data in all_files_data.values())
        total_functions = sum(len(data['functions']) for data in all_files_data.values())
        total_classes = sum(len(data['classes']) for data in all_files_data.values())
        total_imports = sum(len(data['imports']) for data in all_files_data.values())
        
        # Conta métodos totais
        total_methods = sum(
            len(methods) 
            for data in all_files_data.values() 
            for methods in data['class_methods'].values()
        )
        
        report.write(f"📊 ESTATÍSTICAS:\n")
        report.write(f"   • Total de arquivos .py: {total_files}\n")
        report.write(f"   • Total de linhas de código: {total_lines}\n")
        report.write(f"   • Total de funções: {total_functions}\n")
        report.write(f"   • Total de classes: {total_classes}\n")
        report.write(f"   • Total de métodos: {total_methods}\n")
        report.write(f"   • Total de imports: {total_imports}\n")
        report.write(f"   • Funções duplicadas: {len(duplicate_functions)}\n")
        report.write(f"   • Classes duplicadas: {len(duplicate_classes)}\n")
        
        # Top 10 arquivos com mais funções/classes
        report.write(f"\n🏆 TOP 10 ARQUIVOS COM MAIS FUNÇÕES:\n")
        top_files = sorted(
            all_files_data.items(), 
            key=lambda x: len(x[1]['functions']), 
            reverse=True
        )[:10]
        
        for i, (file_path, data) in enumerate(top_files, 1):
            func_count = len(data['functions'])
            class_count = len(data['classes'])
            report.write(f"   {i:2d}. {file_path}: {func_count} funções, {class_count} classes, {data['lines']} linhas\n")
        
        # Arquivos principais vs módulos
        main_files = [fp for fp in all_files_data.keys() if not fp.startswith('servidor_modules')]
        module_files = [fp for fp in all_files_data.keys() if fp.startswith('servidor_modules')]
        
        report.write(f"\n📁 DISTRIBUIÇÃO DE ARQUIVOS:\n")
        report.write(f"   • Arquivos principais: {len(main_files)}\n")
        report.write(f"   • Módulos (servidor_modules): {len(module_files)}\n")
        
        if module_files:
            report.write(f"\n📦 MÓDULOS ENCONTRADOS:\n")
            for module in sorted(module_files):
                data = all_files_data[module]
                report.write(f"   • {module}: {len(data['functions'])} funções, {len(data['classes'])} classes\n")
    
    print(f"[+] Relatório gerado em: {REPORT_FILE}")
    
    # Mostra resumo no console
    print(f"\n=== RESUMO DA ANÁLISE PYTHON ===")
    print(f"Arquivos analisados: {total_files}")
    print(f"Linhas de código: {total_lines}")
    print(f"Funções totais: {total_functions}")
    print(f"Classes totais: {total_classes}")
    print(f"Funções duplicadas: {len(duplicate_functions)}")
    print(f"Classes duplicadas: {len(duplicate_classes)}")
    print(f"Relatório detalhado: {REPORT_FILE}")
    
    return {
        'total_files': total_files,
        'total_lines': total_lines,
        'total_functions': total_functions,
        'total_classes': total_classes,
        'duplicate_functions': duplicate_functions,
        'duplicate_classes': duplicate_classes,
        'all_files_data': all_files_data
    }

def main():
    print("[*] Iniciando análise completa de Python (Servidor)...")
    analysis = analyze_python_comprehensive()
    
    if analysis['duplicate_functions']:
        print(f"\n🚨 FUNÇÕES DUPLICADAS ENCONTRADAS:")
        for func, files in sorted(analysis['duplicate_functions'].items(), key=lambda x: len(x[1]), reverse=True)[:5]:
            print(f"   • {func}(): {len(files)} arquivos")
        if len(analysis['duplicate_functions']) > 5:
            print(f"   ... e mais {len(analysis['duplicate_functions']) - 5} funções")
    
    if analysis['duplicate_classes']:
        print(f"\n🚨 CLASSES DUPLICADAS ENCONTRADAS:")
        for cls, files in sorted(analysis['duplicate_classes'].items(), key=lambda x: len(x[1]), reverse=True)[:5]:
            print(f"   • {cls}: {len(files)} arquivos")
        if len(analysis['duplicate_classes']) > 5:
            print(f"   ... e mais {len(analysis['duplicate_classes']) - 5} classes")
    
    if not analysis['duplicate_functions'] and not analysis['duplicate_classes']:
        print(f"\n✅ Nenhuma função ou classe duplicada encontrada!")
    
    print(f"\n[✅] Análise concluída! Verifique o relatório completo em: {REPORT_FILE}")

if __name__ == "__main__":
    main()