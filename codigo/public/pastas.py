# tree_permitidos.py
from pathlib import Path

ALLOW_EXTS = {".js",".py",".json",".css",".txt",".md",".yml"}# extensões permitidas

def listar(p: Path, prefixo: str = ""):
    try:
        itens = list(p.iterdir())
    except PermissionError:
        return

    # diretórios primeiro, depois arquivos — ambos ordenados por nome
    dirs = sorted([x for x in itens if x.is_dir()], key=lambda x: x.name.lower())
    files = sorted([x for x in itens if x.is_file() and x.suffix.lower() in ALLOW_EXTS],
                   key=lambda x: x.name.lower())

    visiveis = dirs + files  # IMPORTANTe: o "total" é baseado no que será impresso

    total = len(visiveis)
    for i, x in enumerate(visiveis):
        ultimo = (i == total - 1)
        con = "└─ " if ultimo else "├─ "
        linha = f"{prefixo}{con}{x.name}{'/' if x.is_dir() else ''}"
        print(linha)

        if x.is_dir():
            novo_prefixo = prefixo + ("    " if ultimo else "│   ")
            listar(x, novo_prefixo)

def tree(raiz="C:/Users/vitor/OneDrive/Repositórios/Processos-de-automatiza-o-de-empresa"):
    raiz_path = Path(raiz)
    print(f"{raiz_path.name}/")
    listar(raiz_path)

if __name__ == "__main__":
    tree("codigo")   # troque para "." se quiser o diretório atual
