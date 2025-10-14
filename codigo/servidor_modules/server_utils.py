"""
Utilitários do servidor - Versão Estável para Cliente
"""

import socket
import socketserver
import threading
import time
import signal
import sys
import subprocess
from pathlib import Path

from servidor_modules import config

def is_port_in_use(port):
    """Verifica se a porta está em uso de forma confiável"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        try:
            s.bind(('localhost', port))
            return False
        except socket.error:
            return True

def kill_process_on_port(port):
    """Tenta liberar a porta de forma segura"""
    try:
        if sys.platform == "win32":
            result = subprocess.run(
                ['netstat', '-ano', '-p', 'tcp'], 
                capture_output=True, 
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            
            for line in result.stdout.split('\n'):
                if f':{port} ' in line and 'LISTENING' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        print(f"🔄 Liberando porta {port} (PID: {pid})...")
                        subprocess.run(
                            ['taskkill', '/PID', pid, '/F'], 
                            capture_output=True,
                            creationflags=subprocess.CREATE_NO_WINDOW
                        )
                        time.sleep(2)
                        return True
        return False
    except Exception as e:
        print(f"⚠️  Aviso ao liberar porta: {e}")
        return False

def find_available_port(start_port=config.DEFAULT_PORT, max_attempts=config.MAX_PORT_ATTEMPTS):
    """Encontra porta disponível com fallback"""
    for port in range(start_port, start_port + max_attempts):
        if not is_port_in_use(port):
            return port
    
    # Tenta portas aleatórias como fallback
    import random
    for _ in range(5):
        port = random.randint(8000, 9000)
        if not is_port_in_use(port):
            print(f"🎯 Usando porta alternativa: {port}")
            return port
    return None

def setup_port(default_port):
    """Configura porta com múltiplas tentativas"""
    port = default_port
    
    if is_port_in_use(port):
        print(f"⚠️  Porta {port} ocupada. Tentando liberar...")
        if kill_process_on_port(port):
            print("✅ Porta liberada com sucesso!")
            time.sleep(2)
        else:
            available_port = find_available_port(port)
            if available_port:
                port = available_port
                print(f"🔀 Usando porta alternativa: {port}")
            else:
                print("❌ Não foi possível encontrar porta disponível")
                return None
    
    print(f"✅ Porta configurada: {port}")
    return port

def signal_handler(signum, frame):
    """Handler graceful para sinais de sistema"""
    print(f"\n🔄 Recebido sinal {signum}. Encerrando graceful...")
    config.servidor_rodando = False

def setup_signal_handlers():
    """Configura handlers para encerramento graceful"""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

def create_server(port, handler_class):
    """Cria servidor HTTP com configurações otimizadas"""
    server = socketserver.TCPServer(("", port), handler_class)
    server.timeout = config.SERVER_TIMEOUT
    server.allow_reuse_address = True
    return server

def print_server_info(port):
    """Exibe informações profissionais do servidor"""
    print(f"\n🎉 SERVIDOR INICIADO COM SUCESSO!")
    print("=" * 50)
    print(f"🌐 URL: http://localhost:{port}/public/pages/index.html")
    print("=" * 50)
    print("📋 CONTROLES:")
    print("   • Pressione Ctrl+C para PARAR o servidor")
    print("   • Feche o navegador para encerramento automático")
    print("   • Seu trabalho é salvo automaticamente")
    print("=" * 50)

def open_browser(port=8000):
    """Abre navegador automaticamente com tratamento de erro"""
    time.sleep(2)  # Espera servidor estabilizar
    
    url = f"http://localhost:{port}/public/pages/index.html"
    print(f"🌐 Abrindo aplicação: {url}")
    
    try:
        import webbrowser
        webbrowser.open(url)
        print("✅ Navegador iniciado com sucesso!")
    except Exception as e:
        print(f"⚠️  Não foi possível abrir navegador automaticamente")
        print(f"💡 Acesse manualmente: {url}")

def start_server_threads(port, httpd, monitor_function):
    """Inicia threads do servidor de forma organizada"""
    # Thread do navegador
    browser_thread = threading.Thread(target=open_browser, args=(port,), daemon=True)
    browser_thread.start()
    
    # Thread de monitoramento
    monitor_thread = threading.Thread(target=monitor_function, args=(port, httpd), daemon=True)
    monitor_thread.start()
    
    print("\n🟢 SISTEMA PRONTO!")
    print("   Aplicação carregada no navegador")
    print("   Trabalhe normalmente - tudo é salvo automaticamente")
    print("   O servidor gerencia automaticamente o encerramento\n")

def run_server_loop(httpd):
    """Loop principal otimizado e estável"""
    print("🔄 Servidor em execução...")
    
    while config.servidor_rodando:
        try:
            httpd.handle_request()
        except socket.timeout:
            continue  # Timeout é normal
        except Exception as e:
            if config.servidor_rodando:
                print(f"⚠️  Erro não crítico: {e}")
                continue
            else:
                break
    
    print("👋 Encerramento solicitado...")

def shutdown_server_async(httpd):
    """Desligamento graceful do servidor"""
    def shutdown_task():
        try:
            print("🔄 Finalizando conexões...")
            httpd.shutdown()
            httpd.server_close()
            print("✅ Servidor finalizado com sucesso")
        except Exception as e:
            print(f"⚠️  Aviso no encerramento: {e}")
    
    shutdown_thread = threading.Thread(target=shutdown_task, daemon=True)
    shutdown_thread.start()
    shutdown_thread.join(timeout=5.0)
    
    if shutdown_thread.is_alive():
        print("⏰ Timeout no encerramento - finalizando...")