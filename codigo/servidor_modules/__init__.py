# servidor_modules/__init__.py

"""
Modulos do Servidor Python - ESTRUTURA REORGANIZADA
"""

import os
import sys
import tempfile
from pathlib import Path


os.environ.setdefault('PYTHONDONTWRITEBYTECODE', '1')
os.environ.setdefault('PYTHONPYCACHEPREFIX', str(Path(tempfile.gettempdir()) / 'esi_python_cache'))
sys.dont_write_bytecode = True
if hasattr(sys, 'pycache_prefix'):
    sys.pycache_prefix = os.environ['PYTHONPYCACHEPREFIX']

__all__ = [
    'config',
    'ServerCore', 'RoutesCore', 'SessionsManager',
    'UniversalHTTPRequestHandler', 'RouteHandler',
    'FileUtils', 'ServerUtils', 'CacheCleaner', 'monitorar_navegador'
]
