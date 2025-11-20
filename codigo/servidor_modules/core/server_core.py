"""
server_core.py
Núcleo principal do servidor - Lógica centralizada
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

class ServerCore:
    """Núcleo principal do servidor com todas as funcionalidades essenciais"""
    
    def __init__(self):
        self.servidor_rodando = True
        self.project_root = self._find_project_root()
        
    def _find_project_root(self):
        """Encontra a raiz do projeto"""
        current_dir = Path(__file__).parent.parent.parent
        return current_dir

    def is_port_in_use(self, port):
        """Verifica se uma porta está em uso"""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            try:
                s.bind(('localhost', port))
                return False
            except socket.error:
                return True

    def kill_process_on_port(self, port):
        """Tenta finalizar processos na porta"""
        try:
            if sys.platform == "win32":
                result = subprocess.run(
                    ['netstat', '-ano'], 
                    capture_output=True, 
                    text=True,
                    encoding='utf-8',
                    errors='ignore'
                )
                
                for line in result.stdout.split('\n'):
                    if f':{port}' in line and 'LISTENING' in line:
                        parts = line.split()
                        if len(parts) >= 5:
                            pid = parts[-1]
                            if pid.isdigit():
                                try:
                                    subprocess.run(
                                        ['taskkill', '/PID', pid, '/F'], 
                                        capture_output=True,
                                        timeout=5
                                    )
                                    time.sleep(1)
                                    if not self.is_port_in_use(port):
                                        return True
                                except subprocess.TimeoutExpired:
                                    pass
                                except Exception as e:
                                    pass
            return False
        except Exception as e:
            return False

    def find_available_port(self, start_port=8000, max_attempts=15):
        """Encontra uma porta disponível"""
        for port in range(start_port, start_port + max_attempts):
            if not self.is_port_in_use(port):
                return port
        
        import random
        for attempt in range(10):
            port = random.randint(8000, 9000)
            if not self.is_port_in_use(port):
                return port
        
        return None

    def setup_port(self, default_port):
        """Configura a porta do servidor"""
        if not self.is_port_in_use(default_port):
            return default_port
        
        if self.kill_process_on_port(default_port):
            time.sleep(2)
            if not self.is_port_in_use(default_port):
                return default_port
        
        available_port = self.find_available_port(default_port)
        
        if available_port:
            return available_port
        else:
            return None

    def setup_signal_handlers(self):
        """Configura handlers de sinal"""
        try:
            signal.signal(signal.SIGINT, self.signal_handler)
            signal.signal(signal.SIGTERM, self.signal_handler)
        except Exception as e:
            pass

    def signal_handler(self, signum, frame):
        """Manipulador de sinais do sistema"""
        self.servidor_rodando = False

    def create_server(self, port, handler_class):
        """Cria instância do servidor"""
        try:
            server = socketserver.TCPServer(("", port), handler_class)
            server.timeout = 1  # 1 segundo timeout
            server.allow_reuse_address = True
            return server
        except Exception as e:
            raise

    def print_server_info(self, port):
        """Exibe informações do servidor"""
        print(f"\n🎉 SERVIDOR INICIADO COM SUCESSO!")
        print("=" * 50)
        print(f"🌐 URL: http://localhost:{port}/public/pages/01_Create_Obras.html")
        print("=" * 50)

    def open_browser(self, port=8000):
        """Abre o navegador automaticamente"""
        time.sleep(2)
        
        url = f"http://localhost:{port}/public/pages/01_Create_Obras.html"
        
        try:
            import webbrowser
            webbrowser.open(url)
        except Exception as e:
            print(f"💡 Acesse manualmente: {url}")

    def start_server_threads(self, port, httpd, monitor_function):
        """Inicia threads auxiliares"""
        try:
            browser_thread = threading.Thread(target=self.open_browser, args=(port,), daemon=True)
            browser_thread.start()
            
            monitor_thread = threading.Thread(target=monitor_function, args=(port, httpd), daemon=True)
            monitor_thread.start()
            
        except Exception as e:
            pass

    def run_server_loop(self, httpd):
        """Loop principal do servidor"""
        while self.servidor_rodando:
            try:
                httpd.handle_request()
            except socket.timeout:
                continue  
            except KeyboardInterrupt:
                self.servidor_rodando = False
                break
            except Exception as e:
                if self.servidor_rodando:
                    time.sleep(1)
                    continue
                else:
                    break

    def shutdown_server_async(self, httpd, cache_cleaner):
        """Desligamento graceful do servidor"""
        def shutdown_task():
            try:
                httpd.shutdown()
                httpd.server_close()
                
                # Limpeza de cache
                cache_cleaner.clean_pycache_async()
                
            except Exception as e:
                pass
        
        shutdown_thread = threading.Thread(target=shutdown_task, daemon=True)
        shutdown_thread.start()
        
        shutdown_thread.join(timeout=5.0)
        
        if shutdown_thread.is_alive():
            try:
                httpd.server_close()
            except:
                pass