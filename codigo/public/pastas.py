import re
from pathlib import Path

# regex cobre function normal, export, arrow e métodos de classe simples
PADRAO_FUNCAO = re.compile(
    r"""
    (?:function\s+(\w+))              # function nome()
    |(?:export\s+function\s+(\w+))    # export function nome()
    |(?:const\s+(\w+)\s*=\s*\()       # const nome = (
    |(?:let\s+(\w+)\s*=\s*\()         # let nome = (
    |(?:var\s+(\w+)\s*=\s*\()         # var nome = (
    |(?:(\w+)\s*=\s*\([\w\s,]*\)\s*=>) # nome = (...) =>
    """,
    re.VERBOSE
)

def listar_funcoes_arquivo(caminho: Path):
    try:
        texto = caminho.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        print(f"Erro ao ler {caminho}: {e}")
        return []

    nomes = []
    for match in PADRAO_FUNCAO.finditer(texto):
        nome = next((n for n in match.groups() if n), None)
        if nome and nome not in nomes:
            nomes.append(nome)
    return nomes

def listar_funcoes_pasta(pasta: str):
    pasta_path = Path(pasta)
    for arquivo in sorted(pasta_path.rglob("*.js")):
        funcoes = listar_funcoes_arquivo(arquivo)
        if funcoes:
            print(f"\n📄 {arquivo.relative_to(pasta_path)}")
            for nome in funcoes:
                print(f"   └─ {nome}()")

if __name__ == "__main__":
    raiz = "codigo/public"  # mude se quiser outro diretório (ex: ".")
    listar_funcoes_pasta(raiz)
