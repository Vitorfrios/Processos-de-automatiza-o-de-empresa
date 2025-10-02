import os
import json

# Estrutura de diretórios e arquivos
estrutura = {
    "sistema": {
        "dados": {
            "modelos.json": {},
            "opcionais.json": {}
        },
        "tcpdf": {},  # Precisa ser baixado manualmente e colocado aqui
        "images": {
            "logo.jpg": None  # Você pode substituir depois por sua logo real
        },
        "index.html": "",
        "processa.php": "",
        "gera_pdf.php": "",
        "calculo_termico.php": ""
    }
}

# Função para criar estrutura
def criar_estrutura(base, estrutura):
    for nome, conteudo in estrutura.items():
        caminho = os.path.join(base, nome)
        if isinstance(conteudo, dict):
            os.makedirs(caminho, exist_ok=True)
            criar_estrutura(caminho, conteudo)
        else:
            with open(caminho, "w", encoding="utf-8") as f:
                if nome.endswith(".json"):
                    json.dump({}, f, indent=4)
                elif nome.endswith(".jpg"):
                    pass  # Deixe vazio, você deve substituir manualmente depois
                else:
                    f.write("")  # Arquivos .php, .html vazios por enquanto

# Criar estrutura
criar_estrutura(".", estrutura)
print("Estrutura criada com sucesso.")

