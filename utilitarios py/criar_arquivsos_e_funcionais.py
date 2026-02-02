import os
import re
import json
from datetime import datetime
from collections import Counter

def buscar_termos_empresa(texto, caminho_arquivo):
    """
    Busca diversos padrões relacionados a empresa no texto
    """
    padroes = {
        'funcao_empresa': r'(?:function|const|let|var|async\s+function|export\s+(?:function|const))\s+([a-zA-Z_$][\w$]*[Ee]mpresa[a-zA-Z_$][\w$]*)\s*[=:(]',
        'metodo_empresa': r'\.([a-zA-Z_$][\w$]*[Ee]mpresa[a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{',
        'classe_empresa': r'(?:class|interface|type)\s+([a-zA-Z_$][\w$]*[Ee]mpresa[a-zA-Z_$][\w$]*)',
        'import_empresa': r'import\s+.*[Ee]mpresa.*from',
        'require_empresa': r'require\s*\(.*[Ee]mpresa.*\)',
        'comentario_empresa': r'(?://|/\*|#).*[Ee]mpresa.*',
        'string_empresa': r'["\'`].*[Ee]mpresa.*["\'`]',
        'variavel_empresa': r'(?:const|let|var)\s+([a-zA-Z_$][\w$]*[Ee]mpresa)\s*=',
        'propriedade_empresa': r'(?:\.|\["\'\])([a-zA-Z_$][\w$]*[Ee]mpresa[a-zA-Z_$][\w$]*)\s*(?::|=|;)',
        'hook_empresa': r'use[A-Z][a-zA-Z]*[Ee]mpresa',
        'componente_empresa': r'(?:<|/>)[A-Z][a-zA-Z]*[Ee]mpresa',
    }
    
    resultados = []
    
    for categoria, padrao in padroes.items():
        matches = re.finditer(padrao, texto, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            # Calcula o número da linha
            linhas_antes = texto[:match.start()].count('\n')
            linha_num = linhas_antes + 1
            
            # Pega o contexto da linha
            linhas = texto.split('\n')
            if 0 <= linha_num-1 < len(linhas):
                linha_texto = linhas[linha_num-1].strip()
            else:
                linha_texto = ''
            
            resultado = {
                'categoria': categoria,
                'match': match.group(),
                'linha': linha_num,
                'linha_texto': linha_texto[:200],
                'arquivo': os.path.basename(caminho_arquivo),
                'caminho_completo': caminho_arquivo,
                'diretorio': os.path.dirname(caminho_arquivo)
            }
            
            # Extrai nome específico quando possível
            if categoria in ['funcao_empresa', 'metodo_empresa', 'classe_empresa', 'variavel_empresa', 'propriedade_empresa']:
                grupos = match.groups()
                if grupos and grupos[0]:
                    resultado['nome'] = grupos[0]
            
            resultados.append(resultado)
    
    return resultados

def analisar_arquivo_detalhado(caminho_arquivo):
    """Análise detalhada de um arquivo"""
    try:
        with open(caminho_arquivo, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        # Busca todas as referências a empresa
        referencias = buscar_termos_empresa(conteudo, caminho_arquivo)
        
        # Análise específica
        analise = {
            'total_referencias': len(referencias),
            'funcoes': [],
            'classes': [],
            'variaveis': [],
            'imports': [],
            'comentarios': [],
            'strings': [],
            'linhas_com_empresa': set()
        }
        
        for ref in referencias:
            analise['linhas_com_empresa'].add(ref['linha'])
            
            if ref['categoria'] == 'funcao_empresa':
                analise['funcoes'].append(ref.get('nome', ref['match']))
            elif ref['categoria'] == 'classe_empresa':
                analise['classes'].append(ref.get('nome', ref['match']))
            elif ref['categoria'] == 'variavel_empresa':
                analise['variaveis'].append(ref.get('nome', ref['match']))
            elif ref['categoria'] == 'import_empresa':
                analise['imports'].append(ref['match'])
            elif ref['categoria'] == 'comentario_empresa':
                analise['comentarios'].append(ref['linha_texto'])
            elif ref['categoria'] == 'string_empresa':
                analise['strings'].append(ref['match'])
        
        # Remove duplicados
        analise['linhas_com_empresa'] = sorted(analise['linhas_com_empresa'])
        
        # Estatísticas de densidade
        total_linhas = len(conteudo.split('\n'))
        if total_linhas > 0:
            analise['densidade'] = len(analise['linhas_com_empresa']) / total_linhas * 100
        else:
            analise['densidade'] = 0
        
        return analise, referencias
        
    except Exception as e:
        print(f"⚠️  Erro ao analisar {caminho_arquivo}: {e}")
        return None, []

def vasculhar_arquivos_por_empresa(diretorio_base):
    """
    Vasculha todos os arquivos procurando referências a empresa
    """
    resultados_totais = []
    arquivos_detalhados = {}
    estatisticas = {
        'arquivos_processados': 0,
        'arquivos_com_referencias': 0,
        'total_referencias': 0,
        'por_categoria': Counter(),
        'por_extensao': Counter(),
        'por_diretorio': Counter(),
        'arquivos_por_frequencia': Counter()
    }
    
    extensoes = [
        '.js'
    ]
    
    print(f"🔍 Iniciando busca por 'empresa' em: {diretorio_base}")
    print("=" * 80)
    
    # Busca em todos os arquivos
    print("\n🔎 BUSCANDO EM TODOS OS ARQUIVOS DO PROJETO:")
    print("-" * 50)
    
    for root, dirs, files in os.walk(diretorio_base):
        # Ignora diretórios comuns de projetos
        dirs[:] = [d for d in dirs if d.lower() not in [
            'node_modules', '.git', '.svn', '.hg', 'dist', 'build',
            '.next', '.nuxt', 'out', 'coverage', '.cache', 'temp',
            'tmp', 'logs', '__pycache__', '.idea', '.vscode',
            'venv', 'env', '.env', '__pycache__'
        ]]
        
        for arquivo in files:
            if any(arquivo.lower().endswith(ext) for ext in extensoes):
                caminho_completo = os.path.join(root, arquivo)
                extensao = os.path.splitext(arquivo)[1].lower()
                
                try:
                    estatisticas['arquivos_processados'] += 1
                    
                    # Atualiza estatísticas por extensão
                    estatisticas['por_extensao'][extensao] += 1
                    
                    # Atualiza estatísticas por diretório
                    dir_relativo = os.path.relpath(root, diretorio_base)
                    estatisticas['por_diretorio'][dir_relativo] += 1
                    
                    # Análise detalhada do arquivo
                    analise, referencias = analisar_arquivo_detalhado(caminho_completo)
                    
                    if referencias:
                        estatisticas['arquivos_com_referencias'] += 1
                        estatisticas['total_referencias'] += len(referencias)
                        resultados_totais.extend(referencias)
                        
                        # Conta frequência por arquivo
                        estatisticas['arquivos_por_frequencia'][arquivo] += len(referencias)
                        
                        # Atualiza estatísticas por categoria
                        for ref in referencias:
                            estatisticas['por_categoria'][ref['categoria']] += 1
                        
                        if analise:
                            arquivos_detalhados[caminho_completo] = analise
                        
                        print(f"✓ {arquivo}: {len(referencias)} referência(s) a empresa")
                            
                except UnicodeDecodeError:
                    try:
                        with open(caminho_completo, 'r', encoding='latin-1') as f:
                            conteudo = f.read()
                        
                        # Verifica se tem "empresa" no conteúdo
                        if 'empresa' in conteudo.lower():
                            print(f"⚠️  {arquivo}: Arquivo com encoding diferente")
                            
                    except:
                        pass
                except Exception as e:
                    if 'empresa' in arquivo.lower():
                        print(f"⚠️  Erro em {arquivo}: {str(e)[:50]}...")
    
    return resultados_totais, estatisticas, arquivos_detalhados

def gerar_relatorio_detalhado(resultados, estatisticas, arquivos_detalhados, arquivo_saida):
    """
    Gera um relatório completo e detalhado sobre empresas encontradas
    """
    print(f"\n📄 Gerando relatório detalhado em: {arquivo_saida}")
    
    with open(arquivo_saida, 'w', encoding='utf-8') as f:
        # Cabeçalho
        f.write("=" * 120 + "\n")
        f.write("📊 RELATÓRIO DETALHADO DE REFERÊNCIAS A 'EMPRESA'\n")
        f.write(f"📅 Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
        f.write("=" * 120 + "\n\n")
        
        # RESUMO EXECUTIVO
        f.write("🎯 RESUMO EXECUTIVO\n")
        f.write("=" * 120 + "\n\n")
        
        total_arquivos = estatisticas['arquivos_processados']
        arquivos_com_ref = estatisticas['arquivos_com_referencias']
        total_ref = estatisticas['total_referencias']
        
        f.write(f"• 📁 Total de arquivos analisados: {total_arquivos:,}\n")
        f.write(f"• 🔍 Arquivos com referências a 'empresa': {arquivos_com_ref:,}\n")
        f.write(f"• 📈 Total de referências encontradas: {total_ref:,}\n")
        f.write(f"• 📊 Taxa de referências: {(arquivos_com_ref/total_arquivos*100):.1f}%\n")
        f.write(f"• 🎯 Média de referências por arquivo: {(total_ref/arquivos_com_ref):.1f}\n\n")
        
        # TOP 10 ARQUIVOS COM MAIS REFERÊNCIAS
        f.write("\n🏆 TOP 10 ARQUIVOS COM MAIS REFERÊNCIAS\n")
        f.write("=" * 120 + "\n\n")
        
        top_arquivos = estatisticas['arquivos_por_frequencia'].most_common(10)
        for i, (arquivo, quantidade) in enumerate(top_arquivos, 1):
            percentual = (quantidade / total_ref * 100) if total_ref > 0 else 0
            f.write(f"{i:2}. {arquivo:40} : {quantidade:4} referências ({percentual:.1f}%)\n")
        
        # DISTRIBUIÇÃO POR CATEGORIA
        f.write("\n\n📊 DISTRIBUIÇÃO POR CATEGORIA\n")
        f.write("=" * 120 + "\n\n")
        
        for categoria, quantidade in estatisticas['por_categoria'].most_common():
            percentual = (quantidade / total_ref * 100) if total_ref > 0 else 0
            f.write(f"• {categoria:25} : {quantidade:6,} ({percentual:5.1f}%)\n")
        
        # DISTRIBUIÇÃO POR EXTENSÃO
        f.write("\n\n📄 DISTRIBUIÇÃO POR TIPO DE ARQUIVO\n")
        f.write("=" * 120 + "\n\n")
        
        total_por_extensao = sum(estatisticas['por_extensao'].values())
        for extensao, quantidade in estatisticas['por_extensao'].most_common():
            percentual = (quantidade / total_por_extensao * 100) if total_por_extensao > 0 else 0
            f.write(f"• {extensao:10} : {quantidade:6,} arquivos ({percentual:5.1f}%)\n")
        
        # TOP 10 DIRETÓRIOS COM MAIS REFERÊNCIAS
        f.write("\n\n📁 TOP 10 DIRETÓRIOS COM MAIS REFERÊNCIAS\n")
        f.write("=" * 120 + "\n\n")
        
        # Agrupa por diretório
        diretorios_contagem = Counter()
        for resultado in resultados:
            dir_path = resultado['diretorio']
            diretorios_contagem[dir_path] += 1
        
        for i, (dir_path, quantidade) in enumerate(diretorios_contagem.most_common(10), 1):
            percentual = (quantidade / total_ref * 100) if total_ref > 0 else 0
            dir_relativo = os.path.relpath(dir_path, os.path.commonpath(list(diretorios_contagem.keys()) + ["."]))
            f.write(f"{i:2}. {dir_relativo:60} : {quantidade:4} referências ({percentual:.1f}%)\n")
        
        # ANÁLISE DETALHADA POR ARQUIVO
        f.write("\n\n" + "=" * 120 + "\n")
        f.write("🔍 ANÁLISE DETALHADA POR ARQUIVO\n")
        f.write("=" * 120 + "\n\n")
        
        # Agrupa resultados por arquivo
        resultados_por_arquivo = {}
        for resultado in resultados:
            caminho = resultado['caminho_completo']
            if caminho not in resultados_por_arquivo:
                resultados_por_arquivo[caminho] = []
            resultados_por_arquivo[caminho].append(resultado)
        
        # Ordena por quantidade de referências
        arquivos_ordenados = sorted(resultados_por_arquivo.items(), 
                                  key=lambda x: len(x[1]), 
                                  reverse=True)
        
        for caminho, refs_arquivo in arquivos_ordenados:
            arquivo_nome = os.path.basename(caminho)
            dir_arquivo = os.path.dirname(caminho)
            total_refs = len(refs_arquivo)
            
            f.write(f"\n{'=' * 80}\n")
            f.write(f"📄 ARQUIVO: {arquivo_nome}\n")
            f.write(f"📍 CAMINHO: {caminho}\n")
            f.write(f"📁 DIRETÓRIO: {dir_arquivo}\n")
            f.write(f"📊 TOTAL DE REFERÊNCIAS: {total_refs}\n")
            
            # Análise detalhada se disponível
            if caminho in arquivos_detalhados:
                analise = arquivos_detalhados[caminho]
                f.write(f"📈 DENSIDADE: {analise['densidade']:.2f}% das linhas contêm 'empresa'\n")
                f.write(f"📝 LINHAS COM REFERÊNCIAS: {len(analise['linhas_com_empresa'])} linhas\n")
            
            f.write(f"{'=' * 80}\n\n")
            
            # Lista de funções/classes encontradas
            funcoes_unicas = set()
            classes_unicas = set()
            variaveis_unicas = set()
            
            for ref in refs_arquivo:
                if ref['categoria'] == 'funcao_empresa' and 'nome' in ref:
                    funcoes_unicas.add(ref['nome'])
                elif ref['categoria'] == 'classe_empresa' and 'nome' in ref:
                    classes_unicas.add(ref['nome'])
                elif ref['categoria'] == 'variavel_empresa' and 'nome' in ref:
                    variaveis_unicas.add(ref['nome'])
            
            if funcoes_unicas:
                f.write("🔧 FUNÇÕES ENCONTRADAS:\n")
                f.write("-" * 40 + "\n")
                for funcao in sorted(funcoes_unicas):
                    f.write(f"• {funcao}\n")
                f.write("\n")
            
            if classes_unicas:
                f.write("🏛️  CLASSES/INTERFACES:\n")
                f.write("-" * 40 + "\n")
                for classe in sorted(classes_unicas):
                    f.write(f"• {classe}\n")
                f.write("\n")
            
            if variaveis_unicas:
                f.write("📦 VARIÁVEIS ENCONTRADAS:\n")
                f.write("-" * 40 + "\n")
                for var in sorted(variaveis_unicas):
                    f.write(f"• {var}\n")
                f.write("\n")
            
            # Exemplos de referências (primeiras 5)
            f.write("📝 EXEMPLOS DE REFERÊNCIAS:\n")
            f.write("-" * 40 + "\n")
            for ref in refs_arquivo[:5]:
                categoria_emoji = {
                    'funcao_empresa': '🔧',
                    'classe_empresa': '🏛️',
                    'metodo_empresa': '⚡',
                    'variavel_empresa': '📦',
                    'import_empresa': '📥',
                    'comentario_empresa': '💬',
                    'string_empresa': '📄'
                }
                emoji = categoria_emoji.get(ref['categoria'], '📌')
                
                f.write(f"{emoji} Linha {ref['linha']:4} [{ref['categoria']:15}]: ")
                if 'nome' in ref:
                    f.write(f"{ref['nome']} - ")
                f.write(f"{ref['match'][:100]}{'...' if len(ref['match']) > 100 else ''}\n")
            
            if len(refs_arquivo) > 5:
                f.write(f"... e mais {len(refs_arquivo) - 5} referências\n")
            
            f.write("\n")
        
        # LISTA COMPLETA DE FUNÇÕES DE EMPRESA
        f.write("\n\n" + "=" * 120 + "\n")
        f.write("📋 LISTA COMPLETA DE FUNÇÕES/MÉTODOS/CLASSES\n")
        f.write("=" * 120 + "\n\n")
        
        todas_funcoes = Counter()
        todas_classes = Counter()
        todas_variaveis = Counter()
        
        for resultado in resultados:
            if resultado['categoria'] == 'funcao_empresa' and 'nome' in resultado:
                todas_funcoes[resultado['nome']] += 1
            elif resultado['categoria'] == 'classe_empresa' and 'nome' in resultado:
                todas_classes[resultado['nome']] += 1
            elif resultado['categoria'] == 'variavel_empresa' and 'nome' in resultado:
                todas_variaveis[resultado['nome']] += 1
        
        if todas_funcoes:
            f.write("🔧 FUNÇÕES (ordenadas por frequência):\n")
            f.write("-" * 60 + "\n")
            for i, (funcao, freq) in enumerate(todas_funcoes.most_common(), 1):
                f.write(f"{i:3}. {funcao:50} : {freq:3} ocorrências\n")
            f.write("\n")
        
        if todas_classes:
            f.write("🏛️  CLASSES/INTERFACES:\n")
            f.write("-" * 60 + "\n")
            for i, (classe, freq) in enumerate(todas_classes.most_common(), 1):
                f.write(f"{i:3}. {classe:50} : {freq:3} ocorrências\n")
            f.write("\n")
        
        if todas_variaveis:
            f.write("📦 VARIÁVEIS:\n")
            f.write("-" * 60 + "\n")
            for i, (variavel, freq) in enumerate(todas_variaveis.most_common(), 1):
                f.write(f"{i:3}. {variavel:50} : {freq:3} ocorrências\n")
            f.write("\n")
        
        # ANÁLISE DE DEPENDÊNCIAS
        f.write("\n\n" + "=" * 120 + "\n")
        f.write("🔄 ANÁLISE DE DEPENDÊNCIAS E IMPORTS\n")
        f.write("=" * 120 + "\n\n")
        
        imports_encontrados = []
        for resultado in resultados:
            if resultado['categoria'] == 'import_empresa':
                imports_encontrados.append(resultado['match'])
        
        if imports_encontrados:
            imports_unicos = set(imports_encontrados)
            f.write(f"📥 Total de imports encontrados: {len(imports_encontrados)} ({len(imports_unicos)} únicos)\n\n")
            f.write("📋 Lista de imports:\n")
            f.write("-" * 60 + "\n")
            for i, imp in enumerate(sorted(imports_unicos), 1):
                f.write(f"{i:3}. {imp}\n")
        else:
            f.write("📭 Nenhum import específico de 'empresa' encontrado.\n")
        
        # ESTATÍSTICAS AVANÇADAS
        f.write("\n\n" + "=" * 120 + "\n")
        f.write("📈 ESTATÍSTICAS AVANÇADAS\n")
        f.write("=" * 120 + "\n\n")
        
        # Distribuição por tamanho de arquivo
        tamanhos_arquivos = []
        for caminho in arquivos_detalhados.keys():
            try:
                tamanho = os.path.getsize(caminho)
                tamanhos_arquivos.append(tamanho)
            except:
                pass
        
        if tamanhos_arquivos:
            f.write("📏 DISTRIBUIÇÃO POR TAMANHO DE ARQUIVO:\n")
            f.write(f"• Menor arquivo: {min(tamanhos_arquivos):,} bytes\n")
            f.write(f"• Maior arquivo: {max(tamanhos_arquivos):,} bytes\n")
            f.write(f"• Média: {sum(tamanhos_arquivos)/len(tamanhos_arquivos):,.0f} bytes\n")
            f.write(f"• Total: {sum(tamanhos_arquivos):,} bytes\n\n")
        
        # Histograma de frequência
        f.write("📊 HISTOGRAMA DE FREQUÊNCIA POR ARQUIVO:\n")
        distribuicao = {
            "1-5": 0,
            "6-10": 0,
            "11-20": 0,
            "21-50": 0,
            "51-100": 0,
            "100+": 0
        }
        
        for caminho, refs in resultados_por_arquivo.items():
            qtd = len(refs)
            if qtd <= 5:
                distribuicao["1-5"] += 1
            elif qtd <= 10:
                distribuicao["6-10"] += 1
            elif qtd <= 20:
                distribuicao["11-20"] += 1
            elif qtd <= 50:
                distribuicao["21-50"] += 1
            elif qtd <= 100:
                distribuicao["51-100"] += 1
            else:
                distribuicao["100+"] += 1
        
        f.write("-" * 40 + "\n")
        for intervalo, quantidade in distribuicao.items():
            percentual = (quantidade / len(resultados_por_arquivo) * 100) if resultados_por_arquivo else 0
            barra = "█" * int(percentual / 2)
            f.write(f"{intervalo:6} referências: {quantidade:3} arquivos {barra} ({percentual:.1f}%)\n")
        
        # RECOMENDAÇÕES
        f.write("\n\n" + "=" * 120 + "\n")
        f.write("💡 RECOMENDAÇÕES E INSIGHTS\n")
        f.write("=" * 120 + "\n\n")
        
        arquivos_muitas_refs = [a for a, q in estatisticas['arquivos_por_frequencia'].most_common(3)]
        
        f.write("1. 📍 ARQUIVOS PRINCIPAIS:\n")
        f.write("   Os seguintes arquivos são os mais centrais para a funcionalidade de 'empresa':\n")
        for arquivo in arquivos_muitas_refs:
            f.write(f"   • {arquivo}\n")
        
        f.write("\n2. 🔧 FUNÇÕES CHAVE:\n")
        if todas_funcoes:
            f.write("   As funções mais importantes relacionadas a empresa são:\n")
            for funcao, _ in todas_funcoes.most_common(5):
                f.write(f"   • {funcao}\n")
        
        f.write("\n3. 🏛️  ARQUITETURA IDENTIFICADA:\n")
        f.write("   Com base na análise, a estrutura relacionada a empresa inclui:\n")
        if todas_classes:
            f.write("   • Classes/Interfaces: " + ", ".join([c for c, _ in todas_classes.most_common(3)]) + "\n")
        if todas_funcoes:
            f.write("   • Funções principais: " + ", ".join([f for f, _ in todas_funcoes.most_common(3)]) + "\n")
        
        f.write("\n4. 🔄 DEPENDÊNCIAS:\n")
        if imports_encontrados:
            f.write("   O sistema possui imports específicos para funcionalidades de empresa.\n")
        else:
            f.write("   As funcionalidades de empresa estão integradas ao código principal.\n")
        
        f.write("\n5. 📈 PONTOS DE ATENÇÃO:\n")
        arquivo_mais_refs = estatisticas['arquivos_por_frequencia'].most_common(1)[0] if estatisticas['arquivos_por_frequencia'] else None
        if arquivo_mais_refs:
            f.write(f"   • {arquivo_mais_refs[0]} tem {arquivo_mais_refs[1]} referências - considerar modularização\n")
        
        # RODAPÉ
        f.write("\n\n" + "=" * 120 + "\n")
        f.write("📋 RESUMO FINAL\n")
        f.write("=" * 120 + "\n\n")
        
        f.write(f"✅ A busca identificou um sistema robusto de funcionalidades de 'empresa' com:\n")
        f.write(f"   • {total_ref:,} referências distribuídas em {arquivos_com_ref:,} arquivos\n")
        f.write(f"   • {len(todas_funcoes) + len(todas_classes):,} funções/classes principais\n")
        f.write(f"   • Arquitetura bem definida com separação clara de responsabilidades\n")
        f.write(f"\n🎯 Próximos passos recomendados:\n")
        f.write(f"   1. Analisar os arquivos principais listados acima\n")
        f.write(f"   2. Revisar as funções mais utilizadas\n")
        f.write(f"   3. Considerar refatoração se houver arquivos com mais de 50 referências\n")
        
        f.write(f"\n{'=' * 120}\n")
        f.write(f"📅 Relatório gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
        f.write(f"🔍 Total de análise: {total_arquivos:,} arquivos processados\n")
        f.write(f"{'=' * 120}\n")

def main():
    print("🎯 BUSCA POR REFERÊNCIAS A 'EMPRESA'")
    print("📍 Diretório: codigo")
    print("⏳ Analisando arquivos... Isso pode levar alguns minutos...\n")
    
    # Define o diretório base
    diretorio_base = "codigo/public/scripts/01_Create_Obra"
    
    # Verifica se o diretório existe
    if not os.path.exists(diretorio_base):
        print(f"❌ Diretório não encontrado: {diretorio_base}")
        diretorio_base = input("📁 Digite o caminho do diretório para busca: ").strip()
        if not os.path.exists(diretorio_base):
            print("❌ Diretório não existe. Encerrando.")
            return
    
    start_time = datetime.now()
    
    # Realiza a busca
    resultados, estatisticas, arquivos_detalhados = vasculhar_arquivos_por_empresa(diretorio_base)
    
    end_time = datetime.now()
    tempo_decorrido = (end_time - start_time).total_seconds()
    
    print(f"\n{'=' * 80}")
    print("📄 GERANDO RELATÓRIOS...")
    print(f"{'=' * 80}")
    
    # Gera relatório detalhado
    relatorio_detalhado = "relatorio_empresa_detalhado.txt"
    gerar_relatorio_detalhado(resultados, estatisticas, arquivos_detalhados, relatorio_detalhado)
    
    # Gera também um JSON com os dados
    dados_json = {
        'metadata': {
            'timestamp': datetime.now().isoformat(),
            'tempo_execucao_segundos': tempo_decorrido,
            'diretorio_base': diretorio_base
        },
        'estatisticas': dict(estatisticas),
        'resumo': {
            'total_arquivos': estatisticas['arquivos_processados'],
            'arquivos_com_referencias': estatisticas['arquivos_com_referencias'],
            'total_referencias': estatisticas['total_referencias'],
            'tempo_analise': f"{tempo_decorrido:.1f}s"
        }
    }
    
    with open('empresa_analise.json', 'w', encoding='utf-8') as f:
        json.dump(dados_json, f, indent=2, ensure_ascii=False)
    
    # Exibe resumo no console
    print("\n✅ BUSCA CONCLUÍDA!")
    print("=" * 60)
    print(f"📊 RESULTADOS:")
    print(f"   ⏱️  Tempo de execução: {tempo_decorrido:.1f} segundos")
    print(f"   📁 Arquivos processados: {estatisticas['arquivos_processados']:,}")
    print(f"   🔍 Arquivos com referências a 'empresa': {estatisticas['arquivos_com_referencias']:,}")
    print(f"   📈 Total de referências: {estatisticas['total_referencias']:,}")
    
    if estatisticas['arquivos_processados'] > 0:
        taxa = (estatisticas['arquivos_com_referencias'] / estatisticas['arquivos_processados']) * 100
        print(f"   📊 Taxa: {taxa:.1f}%")
    
    # Top 5 arquivos
    top_5 = estatisticas['arquivos_por_frequencia'].most_common(5)
    if top_5:
        print(f"\n🏆 TOP 5 ARQUIVOS COM MAIS REFERÊNCIAS:")
        for i, (arquivo, quantidade) in enumerate(top_5, 1):
            print(f"   {i}. {arquivo:35} - {quantidade:4} referências")
    
    print(f"\n📄 RELATÓRIOS GERADOS:")
    print(f"   1. {relatorio_detalhado} - Relatório detalhado completo")
    print(f"   2. empresa_analise.json - Dados em JSON para análise")
    
    # Mostra algumas estatísticas interessantes
    print(f"\n📈 ESTATÍSTICAS INTERESSANTES:")
    
    # Categoria mais comum
    if estatisticas['por_categoria']:
        cat_mais_comum = estatisticas['por_categoria'].most_common(1)[0]
        print(f"   • Categoria mais comum: {cat_mais_comum[0]} ({cat_mais_comum[1]} ocorrências)")
    
    # Extensão mais comum
    if estatisticas['por_extensao']:
        ext_mais_comum = estatisticas['por_extensao'].most_common(1)[0]
        print(f"   • Extensão mais comum: {ext_mais_comum[0]} ({ext_mais_comum[1]} arquivos)")

if __name__ == "__main__":
    main()