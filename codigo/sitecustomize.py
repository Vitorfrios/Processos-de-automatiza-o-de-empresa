import os
import sys


# Impede a geracao de arquivos .pyc e pastas __pycache__
# antes do carregamento dos modulos do projeto.
os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
sys.dont_write_bytecode = True
