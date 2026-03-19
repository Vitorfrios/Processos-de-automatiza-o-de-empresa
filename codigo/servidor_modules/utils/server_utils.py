"""
server_utils.py
UtilitÃ¡rios do servidor - VersÃ£o Simplificada
"""

import socket
import socketserver
import threading
import time
import signal
import sys
import subprocess
import os
from pathlib import Path

os.environ.setdefault('PYTHONDONTWRITEBYTECODE', '1')
sys.dont_write_bytecode = True

class ServerUtils:
    """UtilitÃ¡rios do servidor - Mantido para compatibilidade"""
    
    @staticmethod
    def setup_signal_handlers():
        """Configura handlers de sinal"""
        try:
            signal.signal(signal.SIGINT, lambda s, f: print("\nðŸ”„ Encerrando..."))
            signal.signal(signal.SIGTERM, lambda s, f: print("\nðŸ”„ Encerrando..."))
            print("âœ… Handlers de sinal configurados")
        except Exception as e:
            print(f"âš ï¸  Aviso na configuraÃ§Ã£o de sinais: {e}")

    @staticmethod
    def print_server_info(port):
        """Exibe informaÃ§Ãµes do servidor"""
        print(f"\n SERVIDOR INICIADO COM SUCESSO!")
        print("=" * 50)
        print(f" URL: http://localhost:{port}/admin/obras/create")
        print("=" * 50)

    @staticmethod
    def open_browser(port=8000):
        """Abre o navegador automaticamente"""
        time.sleep(2)
        
        url = f"http://localhost:{port}/admin/obras/create"
        print(f" Abrindo aplicaÃ§Ã£o: {url}")
        
        try:
            import webbrowser
            webbrowser.open(url)
            print("âœ… Navegador iniciado com sucesso!")
        except Exception as e:
            print(f"âš ï¸  NÃ£o foi possÃ­vel abrir navegador automaticamente: {e}")
            print(f"ðŸ’¡ Acesse manualmente: {url}")

    @staticmethod
    def start_server_threads(port, httpd, monitor_function):
        """Inicia threads auxiliares"""
        try:
            browser_thread = threading.Thread(target=ServerUtils.open_browser, args=(port,), daemon=True)
            browser_thread.start()
            
            monitor_thread = threading.Thread(target=monitor_function, args=(port, httpd), daemon=True)
            monitor_thread.start()
            
            print("\nðŸŸ¢ SISTEMA PRONTO!")
            print("   AplicaÃ§Ã£o carregada no navegador")
            print("   Trabalhe normalmente - tudo Ã© salvo automaticamente\n")
            
        except Exception as e:
            print(f"âš ï¸  Erro ao iniciar threads: {e}")
