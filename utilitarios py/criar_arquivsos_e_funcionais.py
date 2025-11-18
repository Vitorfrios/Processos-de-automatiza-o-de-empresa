import os

# pasta alvo (ajuste se o caminho for diferente)
DIRETORIO_ALVO = r"codigo/public/scripts/01_Create_Obra"

# arquivo de saída
ARQUIVO_SAIDA = "relatorio_console_logs.txt"

BUSCA = "console.log"

resultados = []
total_encontrados = 0
arquivos_lidos = 0
arquivos_com_erro = 0

for raiz, _, arquivos in os.walk(DIRETORIO_ALVO):
    for nome_arquivo in arquivos:
        # só .js (se tiver .mjs, .jsx etc, dá pra incluir aqui)
        if not nome_arquivo.endswith(".js"):
            continue

        caminho_completo = os.path.join(raiz, nome_arquivo)

        try:
            # lê tudo, ignorando problemas de encoding
            with open(caminho_completo, "r", encoding="utf-8", errors="ignore") as f:
                conteudo = f.read()
        except Exception as e:
            print(f"[ERRO] Não foi possível ler {caminho_completo}: {e}")
            arquivos_com_erro += 1
            continue

        arquivos_lidos += 1

        # procura todas as ocorrências de "console.log"
        inicio_busca = 0
        while True:
            pos = conteudo.find(BUSCA, inicio_busca)
            if pos == -1:
                break  # não tem mais

            total_encontrados += 1

            # descobre a linha em que está essa ocorrência
            num_linha = conteudo.count("\n", 0, pos) + 1

            # pega o texto da linha pra facilitar inspeção
            inicio_linha = conteudo.rfind("\n", 0, pos)
            if inicio_linha == -1:
                inicio_linha = 0
            else:
                inicio_linha += 1  # avança o '\n'

            fim_linha = conteudo.find("\n", pos)
            if fim_linha == -1:
                fim_linha = len(conteudo)

            linha_texto = conteudo[inicio_linha:fim_linha].strip()

            resultados.append(
                f"{caminho_completo} (linha {num_linha}): {linha_texto}"
            )

            # continua buscando a partir do fim dessa ocorrência
            inicio_busca = pos + len(BUSCA)

# grava o relatório
with open(ARQUIVO_SAIDA, "w", encoding="utf-8") as saida:
    saida.write(f"Total de '{BUSCA}' encontrados: {total_encontrados}\n")
    saida.write(f"Arquivos lidos: {arquivos_lidos}\n")
    saida.write(f"Arquivos com erro de leitura: {arquivos_com_erro}\n")
    saida.write("\n")
    saida.write("\n".join(resultados))

print("====================================")
print(f"Relatório criado: {ARQUIVO_SAIDA}")
print(f"Total de '{BUSCA}' encontrados: {total_encontrados}")
print(f"Arquivos lidos: {arquivos_lidos}")
print(f"Arquivos com erro de leitura: {arquivos_com_erro}")
print("====================================")
