import os
import re
from pathlib import Path

def extract_function_names_from_file(file_path):
    """
    Extrai nomes de funções significativas de um arquivo JavaScript/TypeScript.
    Ignora callbacks, funções anônimas e elementos de linguagem.
    """
    function_names = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
            # Padrões para funções significativas (apenas as que fazem sentido)
            patterns = [
                # Funções nomeadas regulares: function nomeFuncao()
                r'function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(',
                
                # Arrow functions atribuídas a variáveis/constantes nomeadas: 
                # const nome = () => ou let nome = async () =>
                r'(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\(?[^)=]*\)?\s*=>',
                
                # Métodos de classe nomeados: nome() { ou async nome() {
                r'^\s*(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{',
                
                # Exportações nomeadas: export function nome() ou export const nome = () =>
                r'export\s+(?:const|let|var|async\s+function|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b',
                
                # Export default nomeado: export default function nome()
                r'export\s+default\s+(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(',
                
                # Getter/Setter de classe: get nome() ou set nome()
                r'^\s*(?:get|set)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{',
            ]
            
            # Processar linha por linha para melhor controle
            lines = content.split('\n')
            for line in lines:
                line_stripped = line.strip()
                
                # Ignorar linhas que são claramente callbacks ou elementos de linguagem
                if any(word in line_stripped for word in [
                    '.forEach', '.map', '.filter', '.reduce', '.then', '.catch',
                    '.finally', 'switch(', 'if(', 'for(', 'while(', 'setTimeout',
                    'setInterval', '=> {', '=> function', 'function()'
                ]):
                    continue
                
                # Ignorar funções anônimas em atribuições
                if re.search(r'=\s*(?:async\s*)?\([^)]*\)\s*=>', line) and not re.search(r'(?:const|let|var)\s+[a-zA-Z_]', line):
                    continue
                
                # Buscar funções nomeadas
                for pattern in patterns:
                    matches = re.findall(pattern, line)
                    for match in matches:
                        if isinstance(match, str) and match:
                            # Filtrar palavras reservadas e nomes não significativos
                            if match.lower() not in [
                                'if', 'for', 'while', 'switch', 'case', 'default',
                                'return', 'break', 'continue', 'throw', 'try',
                                'catch', 'finally', 'await', 'async', 'function',
                                'var', 'let', 'const', 'class', 'interface', 'type'
                            ]:
                                function_names.append(match)
                
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='latin-1') as file:
                content = file.read()
                lines = content.split('\n')
                
                for line in lines:
                    line_stripped = line.strip()
                    
                    if any(word in line_stripped for word in [
                        '.forEach', '.map', '.filter', '.reduce', '.then', '.catch',
                        '.finally', 'switch(', 'if(', 'for(', 'while(', 'setTimeout',
                        'setInterval', '=> {', '=> function', 'function()'
                    ]):
                        continue
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, line)
                        for match in matches:
                            if isinstance(match, str) and match:
                                if match.lower() not in [
                                    'if', 'for', 'while', 'switch', 'case', 'default',
                                    'return', 'break', 'continue', 'throw', 'try',
                                    'catch', 'finally', 'await', 'async', 'function',
                                    'var', 'let', 'const', 'class', 'interface', 'type'
                                ]:
                                    function_names.append(match)
        except Exception as e:
            print(f"Erro ao ler arquivo {file_path}: {e}")
            return []
    
    except Exception as e:
        print(f"Erro ao processar arquivo {file_path}: {e}")
        return []
    
    # Remover duplicatas mantendo a ordem
    unique_names = []
    for name in function_names:
        if name not in unique_names and len(name) > 1:  # Nome deve ter mais de 1 caractere
            unique_names.append(name)
    
    return unique_names

def save_all_functions_to_single_txt(function_data, output_path, base_folder_name):
    """
    Salva TODAS as funções em um único arquivo txt organizado.
    """
    if not function_data:
        print("Nenhuma função encontrada para salvar.")
        return
    
    output_file_path = output_path / f'funcoes_{base_folder_name}.txt'
    
    total_functions = sum(data['count'] for data in function_data)
    
    with open(output_file_path, 'w', encoding='utf-8') as output_file:
        output_file.write(f"LISTA COMPLETA DE FUNÇÕES - {base_folder_name}\n")
        output_file.write("=" * 70 + "\n")
        output_file.write(f"Total de arquivos: {len(function_data)}\n")
        output_file.write(f"Total de funções: {total_functions}\n")
        output_file.write("=" * 70 + "\n\n")
        
        for file_info in function_data:
            if file_info['functions']:  # Só incluir se tiver funções
                output_file.write(f"\n[{file_info['relative_path']}]\n")
                output_file.write(f"Arquivo: {file_info['filename']}\n")
                output_file.write(f"Funções encontradas: {file_info['count']}\n")
                output_file.write("-" * 50 + "\n")
                
                for i, func_name in enumerate(file_info['functions'], 1):
                    output_file.write(f"{i:3d}. {func_name}\n")
                
                output_file.write("\n")
        
        # Adicionar índice alfabético no final
        output_file.write("\n" + "=" * 70 + "\n")
        output_file.write("ÍNDICE ALFABÉTICO DE FUNÇÕES\n")
        output_file.write("=" * 70 + "\n\n")
        
        # Coletar todas as funções
        all_functions = []
        for file_info in function_data:
            for func_name in file_info['functions']:
                all_functions.append(func_name)
        
        # Ordenar alfabeticamente
        all_functions_sorted = sorted(set(all_functions))
        
        for i, func_name in enumerate(all_functions_sorted, 1):
            output_file.write(f"{i:4d}. {func_name}\n")
        
        output_file.write("\n" + "=" * 70 + "\n")
        output_file.write(f"RESUMO FINAL\n")
        output_file.write(f"Total de funções únicas: {len(all_functions_sorted)}\n")
        output_file.write(f"Total geral: {total_functions}\n")
        output_file.write("=" * 70 + "\n")

def process_directory_to_single_file(input_path, output_path=None):
    """
    Processa todos os arquivos e salva em um único arquivo txt.
    """
    input_path = Path(input_path)
    
    if output_path is None:
        output_path = input_path.parent / 'extracoes_funcoes'
    
    output_path = Path(output_path)
    output_path.mkdir(exist_ok=True)
    
    valid_extensions = ['.js', '.ts', '.jsx', '.tsx']
    
    print(f"🔍 Processando: {input_path}")
    print(f"💾 Saída única em: {output_path}")
    print("-" * 60)
    
    function_data = []
    total_files_processed = 0
    total_functions_found = 0
    
    # Percorrer arquivos
    for file_path in input_path.rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in valid_extensions:
            try:
                print(f"📄 Analisando: {file_path.relative_to(input_path)}")
                
                function_names = extract_function_names_from_file(file_path)
                
                if function_names:
                    relative_path = file_path.relative_to(input_path.parent).as_posix()
                    
                    function_data.append({
                        'filename': file_path.name,
                        'relative_path': relative_path,
                        'functions': function_names,
                        'count': len(function_names)
                    })
                    
                    total_files_processed += 1
                    total_functions_found += len(function_names)
                    
                    print(f"   ✅ {len(function_names)} funções válidas")
                else:
                    print(f"   ⓘ Nenhuma função significativa encontrada")
                    
            except Exception as e:
                print(f"   ❌ Erro: {str(e)[:50]}...")
    
    # Salvar tudo em um único arquivo
    if function_data:
        base_folder_name = input_path.name
        save_all_functions_to_single_txt(function_data, output_path, base_folder_name)
        
        output_file = output_path / f'funcoes_{base_folder_name}.txt'
        print("\n" + "=" * 60)
        print("✅ PROCESSAMENTO CONCLUÍDO!")
        print(f"📊 Arquivos processados: {total_files_processed}")
        print(f"🔢 Funções encontradas: {total_functions_found}")
        print(f"💾 Arquivo único salvo em: {output_file}")
        print("=" * 60)
        
        # Mostrar preview do conteúdo
        print("\n📋 PREVIEW DO ARQUIVO GERADO:")
        print("-" * 40)
        with open(output_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()[:20]
            for line in lines:
                print(line.rstrip())
        
        if total_functions_found > 0:
            print(f"\n... (continua com mais {total_functions_found - 10} funções)")
    else:
        print("\n⚠️  Nenhuma função significativa foi encontrada nos arquivos.")
    
    return function_data

def main():
    """
    Função principal - versão para único arquivo de saída.
    """
    print("🔧 EXTRAÇÃO DE FUNÇÕES SIGNIFICATIVAS")
    print("📌 Versão: Apenas funções nomeadas (ignora callbacks)")
    print("=" * 60)
    
    # Caminho base
    base_path = r"codigo\public\scripts\01_Create_Obra\data\empresa-system"
    
    if not os.path.exists(base_path):
        print(f"⚠️  Caminho não encontrado: {base_path}")
        print("\n🔄 Usando caminho atual como referência...")
        
        # Tentar encontrar a pasta começando do diretório atual
        current_dir = Path.cwd()
        possible_paths = [
            current_dir / base_path,
            current_dir / "codigo" / "public" / "scripts" / "01_Create_Obra" / "data" / "empresa-system",
            current_dir.parent / base_path,
        ]
        
        found_path = None
        for path in possible_paths:
            if path.exists():
                found_path = path
                break
        
        if found_path:
            base_path = str(found_path)
            print(f"✅ Caminho encontrado: {base_path}")
        else:
            print("❌ Não foi possível encontrar o caminho automaticamente.")
            base_path = input("📝 Digite o caminho completo da pasta: ").strip()
            
            if not os.path.exists(base_path):
                print("❌ Caminho inválido. Encerrando...")
                return
    
    print(f"\n🎯 Processando pasta: {base_path}")
    print("⏳ Isso pode levar alguns segundos...\n")
    
    # Processar e salvar em único arquivo
    process_directory_to_single_file(base_path)

if __name__ == "__main__":
    main()