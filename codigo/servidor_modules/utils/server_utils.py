"""
server_utils.py
Utilitários do servidor - Versão Simplificada
"""

import socket
import socketserver
import threading
import time
import signal
import sys
import subprocess
import os
import tempfile
from pathlib import Path

os.environ.setdefault('PYTHONDONTWRITEBYTECODE', '1')
os.environ.setdefault('PYTHONPYCACHEPREFIX', str(Path(tempfile.gettempdir()) / 'esi_python_cache'))
sys.dont_write_bytecode = True
if hasattr(sys, 'pycache_prefix'):
    sys.pycache_prefix = os.environ['PYTHONPYCACHEPREFIX']

class ServerUtils:
    """Utilitários do servidor - Mantido para compatibilidade"""
    
    @staticmethod
    def setup_signal_handlers():
        """Configura handlers de sinal"""
        try:
            signal.signal(signal.SIGINT, lambda s, f: print("\n Encerrando..."))
            signal.signal(signal.SIGTERM, lambda s, f: print("\n Encerrando..."))
            print(" Handlers de sinal configurados")
        except Exception as e:
            print(f"â   Aviso na configuração de sinais: {e}")

    @staticmethod
    def print_server_info(port):
        """Exibe informações do servidor"""
        print(f"\n SERVIDOR INICIADO COM SUCESSO!")
        print("=" * 50)
        print(f" URL: http://localhost:{port}/admin/obras/create")
        print("=" * 50)

    @staticmethod
    def open_browser(port=8000):
        """Abre o navegador automaticamente"""
        time.sleep(2)
        
        url = f"http://localhost:{port}/admin/obras/create"
        print(f" Abrindo aplicação: {url}")
        
        try:
            import webbrowser
            webbrowser.open(url)
            print(" Navegador iniciado com sucesso!")
        except Exception as e:
            print(f"â   Não foi possível abrir navegador automaticamente: {e}")
            print(f" Acesse manualmente: {url}")

    @staticmethod
    def start_server_threads(port, httpd, monitor_function):
        """Inicia threads auxiliares"""
        try:
            browser_thread = threading.Thread(target=ServerUtils.open_browser, args=(port,), daemon=True)
            browser_thread.start()
            
            monitor_thread = threading.Thread(target=monitor_function, args=(port, httpd), daemon=True)
            monitor_thread.start()
            
            print("\n SISTEMA PRONTO!")
            print("   Aplicação carregada no navegador")
            print("   Trabalhe normalmente - tudo é salvo automaticamente\n")
            
        except Exception as e:
            print(f"â   Erro ao iniciar threads: {e}")
