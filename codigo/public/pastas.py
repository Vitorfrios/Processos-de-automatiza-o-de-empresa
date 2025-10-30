import os
import re
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Any, Optional, Tuple, Set, Union

def extract_imported_functions_with_sources(file_content: str) -> List[Dict[str, str]]:
    """Extrai funções importadas de declarações import com suas fontes"""
    imports: List[Dict[str, str]] = []
    
    # Padrão para import { ... } from ...
    pattern = r'import\s*{([^}]+)}\s*from\s*[\'"]([^\'"]+)[\'"]'
    matches = re.findall(pattern, file_content, re.DOTALL)
    
    for functions_str, source in matches:
        # Divide as funções por vírgula e remove espaços em branco
        functions = [func.strip() for func in functions_str.split(',')]
        # Remove elementos vazios e filtra apenas identificadores válidos
        functions = [func for func in functions if func and not re.match(r'^\s*$', func)]
        
        for func in functions:
            imports.append({
                'function': func,
                'source': source
            })
    
    # Também captura imports padrão
    default_pattern = r'import\s+(\w+)\s+from\s*[\'"]([^\'"]+)[\'"]'
    default_matches = re.findall(default_pattern, file_content)
    
    for func, source in default_matches:
        imports.append({
            'function': func,
            'source': source
        })
    
    # Captura imports com alias
    alias_pattern = r'import\s*\*\s+as\s+(\w+)\s+from\s*[\'"]([^\'"]+)[\'"]'
    alias_matches = re.findall(alias_pattern, file_content)
    
    for alias, source in alias_matches:
        imports.append({
            'function': f'* as {alias}',
            'source': source
        })
    
    return imports

def extract_function_declarations(file_content: str) -> List[Dict[str, Any]]:
    """Extrai declarações de funções (function e async function) com seus corpos"""
    functions: List[Dict[str, Any]] = []
    
    # Padrões mais específicos para evitar falsos positivos
    patterns = [
        # function nome() { ... }
        r'(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}',
        # const nome = function() { ... }
        r'const\s+(\w+)\s*=\s*(?:async\s+)?function\s*\([^)]*\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}',
        # const nome = () => { ... }
        r'const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}',
        # let nome = function() { ... }
        r'let\s+(\w+)\s*=\s*(?:async\s+)?function\s*\([^)]*\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}',
        # let nome = () => { ... }
        r'let\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}',
        # var nome = function() { ... }
        r'var\s+(\w+)\s*=\s*(?:async\s+)?function\s*\([^)]*\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}',
        # var nome = () => { ... }
        r'var\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}',
        # Métodos de classe
        r'^(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}',
    ]
    
    for pattern in patterns:
        try:
            matches = re.findall(pattern, file_content, re.MULTILINE | re.DOTALL)
            for match in matches:
                if len(match) == 2:
                    function_name, function_body = match
                    functions.append({
                        'name': function_name,
                        'body': function_body.strip()
                    })
        except Exception as e:
            print(f"  Aviso: Erro no padrão {pattern}: {e}")
            continue
    
    return functions

def extract_function_calls(function_body: str) -> List[str]:
    """Extrai chamadas de função de um corpo de função"""
    calls = []
    
    # Padrão para chamadas de função: nomeFuncao(...) ou objeto.nomeFuncao(...)
    patterns = [
        r'\b(\w+)\s*\([^)]*\)',  # funcao()
        r'\.(\w+)\s*\([^)]*\)',  # objeto.funcao()
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, function_body)
        calls.extend(matches)
    
    # Remove duplicatas e palavras reservadas
    reserved_keywords = {'if', 'else', 'for', 'while', 'switch', 'case', 'return', 'console', 'log', 
                        'error', 'warn', 'info', 'debug', 'alert', 'prompt', 'confirm', 'document',
                        'window', 'this', 'super', 'new', 'delete', 'typeof', 'instanceof', 'in',
                        'await', 'async', 'function', 'class', 'extends', 'implements', 'interface',
                        'let', 'const', 'var', 'import', 'export', 'default', 'from', 'as', 'try',
                        'catch', 'finally', 'throw', 'yield', 'static', 'public', 'private', 'protected'}
    
    # Filtra palavras reservadas e mantém apenas chamadas válidas
    valid_calls = [call for call in calls if call and call not in reserved_keywords]
    
    return list(set(valid_calls))

def extract_exports(file_content: str) -> List[str]:
    """Extrai declarações de export"""
    exports: List[str] = []
    
    # Padrões para diferentes tipos de export
    patterns = [
        # export function nome
        r'export\s+(?:async\s+)?function\s+(\w+)',
        # export const/let/var nome
        r'export\s+(?:const|let|var)\s+(\w+)\s*=',
        # export default function
        r'export\s+default\s+(?:async\s+)?function\s*(\w+)',
        # export { a, b, c }
        r'export\s+{\s*([^}]+)\s*}',
        # export default nome
        r'export\s+default\s+(\w+)',
    ]
    
    for pattern in patterns:
        try:
            matches = re.findall(pattern, file_content)
            for match in matches:
                if match:
                    # Para export { a, b, c }
                    if ',' in str(match):
                        items = [item.strip() for item in str(match).split(',')]
                        exports.extend([item for item in items if item and item != 'default'])
                    else:
                        if match != 'default':
                            exports.append(str(match))
        except Exception as e:
            print(f"  Aviso: Erro no padrão de export {pattern}: {e}")
            continue
    
    # Remove elementos vazios e duplicatas
    exports = list(set([exp for exp in exports if exp]))
    
    return exports

def analyze_js_file(file_path: Path) -> Dict[str, Any]:
    """Analisa um arquivo JavaScript/TypeScript e retorna as informações"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
        
        imported_functions = extract_imported_functions_with_sources(content)
        function_declarations = extract_function_declarations(content)
        exports = extract_exports(content)
        
        # Analisa as funções utilizadas dentro de cada função
        function_usage = []
        for func in function_declarations:
            calls = extract_function_calls(func['body'])
            function_usage.append({
                'function_name': func['name'],
                'calls': calls
            })
        
        return {
            'file_path': str(file_path),
            'imported_functions': imported_functions,
            'function_declarations': [f['name'] for f in function_declarations],
            'function_usage': function_usage,
            'exports': exports
        }
    
    except Exception as e:
        print(f"  Erro ao analisar {file_path}: {e}")
        return {
            'file_path': str(file_path),
            'error': str(e),
            'imported_functions': [],
            'function_declarations': [],
            'function_usage': [],
            'exports': []
        }

def analyze_directory(directory_path: str, extensions: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """Analisa todos os arquivos em um diretório e subdiretórios"""
    if extensions is None:
        extensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']
    
    directory_path_obj = Path(directory_path)
    results: List[Dict[str, Any]] = []
    
    for ext in extensions:
        for file_path in directory_path_obj.rglob(f'*{ext}'):
            if file_path.is_file():
                print(f"Analisando: {file_path}")
                result = analyze_js_file(file_path)
                results.append(result)
    
    return results

def print_results(results: List[Dict[str, Any]]) -> None:
    """Imprime os resultados de forma organizada"""
    for result in results:
        print(f"\n{'='*80}")
        print(f"ARQUIVO: {result['file_path']}")
        print(f"{'='*80}")
        
        if 'error' in result:
            print(f"ERRO: {result['error']}")
            continue
        
        print(f"\n📥 FUNÇÕES IMPORTADAS ({len(result['imported_functions'])}):")
        if result['imported_functions']:
            for imp in result['imported_functions']:
                function_name = imp['function']
                source = imp['source']
                print(f"  • {function_name} ← {source}")
        else:
            print("  Nenhuma função importada")
        
        print(f"\n📝 FUNÇÕES DECLARADAS ({len(result['function_declarations'])}):")
        if result['function_declarations']:
            for func in result['function_declarations']:
                print(f"  • {func}")
        else:
            print("  Nenhuma função declarada")
        
        print(f"\n🔄 USO DE FUNÇÕES INTERNAS:")
        if result['function_usage']:
            for func_usage in result['function_usage']:
                if func_usage['calls']:
                    calls_str = ', '.join(func_usage['calls'])
                    print(f"  • {func_usage['function_name']} → [{calls_str}]")
                else:
                    print(f"  • {func_usage['function_name']} → [nenhuma função chamada]")
        else:
            print("  Nenhuma função com uso analisado")
        
        print(f"\n📤 EXPORTS ({len(result['exports'])}):")
        if result['exports']:
            for exp in result['exports']:
                print(f"  • {exp}")
        else:
            print("  Nenhum export")
        
        print(f"\n{'─'*80}")

def save_results_to_file(results: List[Dict[str, Any]], output_file: str = 'analise_funcoes.txt') -> None:
    """Salva os resultados em um arquivo de texto"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            for result in results:
                f.write(f"\n{'='*80}\n")
                f.write(f"ARQUIVO: {result['file_path']}\n")
                f.write(f"{'='*80}\n")
                
                if 'error' in result:
                    f.write(f"ERRO: {result['error']}\n")
                    continue
                
                f.write(f"\n📥 FUNÇÕES IMPORTADAS ({len(result['imported_functions'])}):\n")
                if result['imported_functions']:
                    for imp in result['imported_functions']:
                        function_name = imp['function']
                        source = imp['source']
                        f.write(f"  • {function_name} ← {source}\n")
                else:
                    f.write("  Nenhuma função importada\n")
                
                f.write(f"\n📝 FUNÇÕES DECLARADAS ({len(result['function_declarations'])}):\n")
                if result['function_declarations']:
                    for func in result['function_declarations']:
                        f.write(f"  • {func}\n")
                else:
                    f.write("  Nenhuma função declarada\n")
                
                f.write(f"\n🔄 USO DE FUNÇÕES INTERNAS:\n")
                if result['function_usage']:
                    for func_usage in result['function_usage']:
                        if func_usage['calls']:
                            calls_str = ', '.join(func_usage['calls'])
                            f.write(f"  • {func_usage['function_name']} → [{calls_str}]\n")
                        else:
                            f.write(f"  • {func_usage['function_name']} → [nenhuma função chamada]\n")
                else:
                    f.write("  Nenhuma função com uso analisado\n")
                
                f.write(f"\n📤 EXPORTS ({len(result['exports'])}):\n")
                if result['exports']:
                    for exp in result['exports']:
                        f.write(f"  • {exp}\n")
                else:
                    f.write("  Nenhum export\n")
                
                f.write(f"\n{'─'*80}\n")
        
        print(f"✅ Resultados salvos em: {output_file}")
    except Exception as e:
        print(f"❌ Erro ao salvar arquivo: {e}")

def generate_function_usage_report(results: List[Dict[str, Any]]) -> None:
    """Gera um relatório completo do uso de cada função em cada arquivo"""
    print(f"\n{'#'*80}")
    print(f"📊 RELATÓRIO DE USO DE FUNÇÕES POR ARQUIVO")
    print(f"{'#'*80}")
    
    # Estrutura para armazenar o uso de funções
    function_usage_map: Dict[str, Dict[str, List[str]]] = defaultdict(lambda: defaultdict(list))
    
    for result in results:
        if 'error' not in result:
            current_file = Path(result['file_path']).name
            
            # Funções declaradas neste arquivo
            for func_name in result['function_declarations']:
                function_usage_map[func_name]['declared_in'].append(current_file)
            
            # Funções usadas neste arquivo
            for func_usage in result['function_usage']:
                caller = func_usage['function_name']
                for called_function in func_usage['calls']:
                    function_usage_map[called_function]['used_by'].append(f"{current_file}::{caller}")
            
            # Funções importadas e usadas
            for imp in result['imported_functions']:
                imported_function = imp['function']
                function_usage_map[imported_function]['imported_by'].append(current_file)
    
    print(f"\n🔍 USO DETALHADO DE CADA FUNÇÃO:")
    
    for function_name, usage_data in sorted(function_usage_map.items()):
        print(f"\n🎯 FUNÇÃO: {function_name}")
        
        # Onde é declarada
        if 'declared_in' in usage_data and usage_data['declared_in']:
            declared_files = ', '.join(sorted(set(usage_data['declared_in'])))
            print(f"   📝 Declarada em: {declared_files}")
        
        # Quem importa
        if 'imported_by' in usage_data and usage_data['imported_by']:
            importers = ', '.join(sorted(set(usage_data['imported_by'])))
            print(f"   📥 Importada por: {importers}")
        
        # Quem usa
        if 'used_by' in usage_data and usage_data['used_by']:
            users = sorted(set(usage_data['used_by']))
            print(f"   🔄 Usada por ({len(users)} usos):")
            for user in users:
                print(f"      • {user}")

def generate_function_dependency_graph(results: List[Dict[str, Any]]) -> None:
    """Gera um gráfico de dependências entre funções"""
    print(f"\n{'#'*80}")
    print(f"🔄 GRAFICO DE DEPENDÊNCIAS ENTRE FUNÇÕES")
    print(f"{'#'*80}")
    
    function_dependencies: Dict[str, Set[str]] = defaultdict(set)
    
    for result in results:
        if 'error' not in result:
            current_file = Path(result['file_path']).name
            for func_usage in result['function_usage']:
                function_name = f"{current_file}::{func_usage['function_name']}"
                for called_function in func_usage['calls']:
                    function_dependencies[function_name].add(called_function)
    
    print(f"\n📊 DEPENDÊNCIAS ENTRE FUNÇÕES:")
    for function, deps in sorted(function_dependencies.items()):
        if deps:
            dep_list = ', '.join(sorted(deps))
            print(f"  🎯 {function} → [{dep_list}]")

def generate_import_summary(results: List[Dict[str, Any]]) -> None:
    """Gera um resumo de todas as importações do projeto"""
    print(f"\n{'#'*80}")
    print(f"📦 RESUMO DE IMPORTAÇÕES DO PROJETO")
    print(f"{'#'*80}")
    
    # Agrupa importações por fonte
    imports_by_source: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    imports_by_function: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    
    for result in results:
        if 'error' not in result:
            for imp in result['imported_functions']:
                source = imp['source']
                function_name = imp['function']
                imports_by_source[source].append({
                    'function': function_name,
                    'imported_by': result['file_path']
                })
                imports_by_function[function_name].append({
                    'source': source,
                    'imported_by': result['file_path']
                })
    
    # Mostra importações agrupadas por fonte
    print(f"\n📁 IMPORTAÇÕES AGRUPADAS POR FONTE:")
    for source, imports in sorted(imports_by_source.items()):
        print(f"\n  📁 {source}:")
        functions = set(imp['function'] for imp in imports)
        for func in sorted(functions):
            files = [imp['imported_by'] for imp in imports if imp['function'] == func]
            print(f"     • {func} (usado em {len(files)} arquivos)")
    
    # Mostra importações agrupadas por função
    print(f"\n🔍 IMPORTAÇÕES AGRUPADAS POR FUNÇÃO:")
    for function, imports in sorted(imports_by_function.items()):
        print(f"\n  🎯 {function}:")
        sources = set(imp['source'] for imp in imports)
        for source in sorted(sources):
            files = [imp['imported_by'] for imp in imports if imp['source'] == source]
            print(f"     ← {source} (importado por {len(files)} arquivos)")

def generate_dependency_graph(results: List[Dict[str, Any]]) -> None:
    """Gera um gráfico simplificado de dependências entre arquivos"""
    print(f"\n{'#'*80}")
    print(f"📁 GRAFICO DE DEPENDÊNCIAS ENTRE ARQUIVOS")
    print(f"{'#'*80}")
    
    dependencies: Dict[str, Set[str]] = defaultdict(set)
    
    for result in results:
        if 'error' not in result:
            current_file = Path(result['file_path']).name
            for imp in result['imported_functions']:
                source = imp['source']
                # Tenta extrair o nome do arquivo da source
                if '/' in source or '\\' in source:
                    source_file = Path(source).name
                    if '.' not in source_file:
                        source_file += '.js'  # Assume extensão padrão
                else:
                    source_file = source
                
                dependencies[current_file].add(source_file)
    
    print(f"\n📊 DEPENDÊNCIAS ENTRE ARQUIVOS:")
    for file, deps in sorted(dependencies.items()):
        if deps:
            dep_list = ', '.join(sorted(deps))
            print(f"  📄 {file} → [{dep_list}]")

def generate_statistics(results: List[Dict[str, Any]]) -> None:
    """Gera estatísticas gerais do projeto"""
    total_arquivos = len(results)
    arquivos_com_erro = sum(1 for r in results if 'error' in r)
    total_imports = sum(len(r['imported_functions']) for r in results if 'error' not in r)
    total_funcoes = sum(len(r['function_declarations']) for r in results if 'error' not in r)
    total_exports = sum(len(r['exports']) for r in results if 'error' not in r)
    
    # Conta uso de funções
    total_function_calls = 0
    unique_functions = set()
    
    for result in results:
        if 'error' not in result:
            unique_functions.update(result['function_declarations'])
            for func_usage in result['function_usage']:
                total_function_calls += len(func_usage['calls'])
    
    print(f"\n{'#'*80}")
    print(f"📈 ESTATÍSTICAS GERAIS")
    print(f"{'#'*80}")
    print(f"   📂 Arquivos analisados: {total_arquivos}")
    print(f"   ❌ Arquivos com erro: {arquivos_com_erro}")
    print(f"   📥 Total de imports: {total_imports}")
    print(f"   📝 Total de funções únicas: {len(unique_functions)}")
    print(f"   🔄 Total de chamadas de função: {total_function_calls}")
    print(f"   📤 Total de exports: {total_exports}")
    
    # Arquivos com mais funções
    arquivos_com_funcoes: List[Tuple[str, int]] = [
        (r['file_path'], len(r['function_declarations'])) 
        for r in results 
        if 'error' not in r and r['function_declarations']
    ]
    arquivos_com_funcoes.sort(key=lambda x: x[1], reverse=True)
    
    if arquivos_com_funcoes:
        print(f"\n🏆 TOP 5 ARQUIVOS COM MAIS FUNÇÕES:")
        for i, (arquivo, count) in enumerate(arquivos_com_funcoes[:5], 1):
            print(f"   {i}. {Path(arquivo).name} ({count} funções)")

# USO DO CÓDIGO
if __name__ == "__main__":
    # Substitua pelo caminho do seu diretório
    diretorio = input("Digite o caminho do diretório a ser analisado (ou Enter para usar o diretório atual): ").strip()
    
    if not diretorio:
        diretorio = "."
    
    if os.path.exists(diretorio):
        print(f"🔍 Analisando arquivos em: {os.path.abspath(diretorio)}")
        resultados = analyze_directory(diretorio)
        
        # Mostra resultados detalhados no console
        print_results(resultados)
        
        # Gera resumos e estatísticas
        generate_import_summary(resultados)
        generate_dependency_graph(resultados)
        generate_function_dependency_graph(resultados)
        generate_function_usage_report(resultados)  # NOVO: Relatório de uso de funções
        generate_statistics(resultados)
        
        # Salva em arquivo
        arquivo_saida = "analise_funcoes_detalhada.txt"
        save_results_to_file(resultados, arquivo_saida)
        
    else:
        print(f"❌ Diretório não encontrado: {diretorio}")