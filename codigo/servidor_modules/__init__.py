# servidor_modules/__init__.py

"""
Modulos do Servidor Python - ESTRUTURA REORGANIZADA
"""

import os
import sys


os.environ.setdefault('PYTHONDONTWRITEBYTECODE', '1')
sys.dont_write_bytecode = True

__all__ = [
    'config',
    'ServerCore', 'RoutesCore', 'SessionsManager',
    'UniversalHTTPRequestHandler', 'RouteHandler',
    'FileUtils', 'ServerUtils', 'CacheCleaner', 'monitorar_navegador'
]
