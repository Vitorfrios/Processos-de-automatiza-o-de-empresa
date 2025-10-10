"""
Utilitários do servidor - configuração, portas, etc.
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
    """Verifica se a porta está em uso"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return False
        except socket.error:
            return True

def kill_process_on_port(port):
    """Tenta matar o processo usando a porta"""
    try:
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
                    print(f"🔫 Matando processo PID {pid}...")
                    subprocess.run(
                        ['taskkill', '/PID', pid, '/F'], 
                        capture_output=True,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                    time.sleep(2)
                    return True
        return False
    except Exception:
        return False

def find_available_port(start_port=config.DEFAULT_PORT, max_attempts=config.MAX_PORT_ATTEMPTS):
    """Encontra uma porta disponível"""
    for port in range(start_port, start_port + max_attempts):
        if not is_port_in_use(port):
            return port
    return None

def setup_port(default_port):
    """Configura a porta do servidor"""
    port = default_port
    
    if is_port_in_use(port):
        print(f"⚠️  Porta {port} está em uso! Tentando liberar...")
        if kill_process_on_port(port):
            print("✅ Processo anterior finalizado!")
            time.sleep(2)
        else:
            available_port = find_available_port(port)
            if available_port:
                port = available_port
                print(f"🎯 Usando porta alternativa: {port}")
            else:
                return None
    
    print(f"✅ Usando porta: {port}")
    return port

def signal_handler(signum, frame):
    """Handler para sinais de interrupção"""
    print(f"\n⏹️  ENCERRANDO SERVIDOR (Sinal: {signum})...")
    config.servidor_rodando = False

def setup_signal_handlers():
    """Configura os handlers de sinal"""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

def create_server(port, handler_class):
    """Cria e configura o servidor HTTP"""
    server = socketserver.TCPServer(("", port), handler_class)
    server.timeout = config.SERVER_TIMEOUT
    return server

def print_server_info(port):
    """Mostra informações do servidor"""
    print(f"\n🎉 {config.MESSAGES['server_running']}")
    print(f"🌐 URL: http://localhost:{port}/public/pages/index.html")
    print("=" * 60)
    print("📋 CONTROLES:")
    print("   • Pressione Ctrl+C para PARAR o servidor")
    print("   • Feche o navegador para PARAR automaticamente")
    print("   • Seu trabalho é salvo automaticamente")
    print("=" * 60)

def open_browser(port=8000):
    """Abre o navegador automaticamente"""
    time.sleep(2)  # Dá tempo para o servidor iniciar
    
    # URL direta para a página principal
    url = f"http://localhost:{port}/public/pages/index.html"
    print(f"🌐 Abrindo navegador: {url}")
    
    try:
        import webbrowser
        webbrowser.open(url)
        print("✅ Navegador aberto com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao abrir navegador: {e}")
        print(f"💡 Acesse manualmente: {url}")

def start_server_threads(port, httpd, monitor_function):
    """Inicia todas as threads do servidor"""
    # Inicia o navegador
    browser_thread = threading.Thread(target=open_browser, args=(port,), daemon=True)
    browser_thread.start()
    
    # Inicia o monitoramento
    monitor_thread = threading.Thread(target=monitor_function, args=(port, httpd), daemon=True)
    monitor_thread.start()
    
    print("🟢 PRONTO! Servidor está ativo e aguardando conexões...")
    print("   Trabalhe normalmente no navegador que abriu")
    print("   O servidor ficará aberto até você fechar o navegador ou pressionar Ctrl+C\n")

def run_server_loop(httpd):
    """Executa o loop principal do servidor"""
    while config.servidor_rodando:
        try:
            httpd.handle_request()
        except socket.timeout:
            # Timeout é normal, continua o loop
            continue
        except Exception as e:
            if config.servidor_rodando:
                # Erro menor, continua
                continue
            else:
                # Servidor está sendo encerrado
                break
    
    print("👋 Encerrando servidor...")

def shutdown_server_async(httpd):
    """Desliga o servidor de forma assíncrona com timeout"""
    def shutdown_task():
        try:
            print("🔄 Iniciando shutdown do servidor...")
            httpd.shutdown()
            httpd.server_close()
            print("✅ Servidor desligado com sucesso")
        except Exception as e:
            print(f"⚠️  Erro durante shutdown: {e}")
    
    shutdown_thread = threading.Thread(target=shutdown_task, daemon=True)
    shutdown_thread.start()
    shutdown_thread.join(timeout=3.0)
    
    if shutdown_thread.is_alive():
        print("⏰ Timeout no shutdown - forçando encerramento...")
        import os
        os._exit(0)