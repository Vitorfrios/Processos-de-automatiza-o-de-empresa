"""
server_utils.py
Utilitários do servidor - Versão Estável para Cliente
COM INTEGRAÇÃO DE LIMPEZA DE CACHE
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

from servidor_modules import config
from servidor_modules.cache_cleaner import clean_on_shutdown

def is_port_in_use(port):
    """
    Verifica se uma porta específica está em uso no localhost
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        try:
            s.bind(('localhost', port))
            return False
        except socket.error:
            return True

def kill_process_on_port(port):
    """
    Tenta finalizar processos que estão utilizando uma porta específica
    """
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
                            print(f"🔄 Liberando porta {port} (PID: {pid})...")
                            try:
                                subprocess.run(
                                    ['taskkill', '/PID', pid, '/F'], 
                                    capture_output=True,
                                    timeout=5
                                )
                                time.sleep(1)
                                if not is_port_in_use(port):
                                    return True
                            except subprocess.TimeoutExpired:
                                print(f"⏰ Timeout ao tentar finalizar processo {pid}")
                            except Exception as e:
                                print(f"⚠️ Erro ao finalizar processo: {e}")
        return False
    except Exception as e:
        print(f"⚠️  Aviso ao liberar porta: {e}")
        return False

def find_available_port(start_port=config.DEFAULT_PORT, max_attempts=config.MAX_PORT_ATTEMPTS):
    """
    Encontra uma porta disponível para uso pelo servidor
    """
    for port in range(start_port, start_port + max_attempts):
        if not is_port_in_use(port):
            return port
    
    import random
    for attempt in range(10):
        port = random.randint(8000, 9000)
        if not is_port_in_use(port):
            print(f"🎯 Usando porta alternativa: {port}")
            return port
    
    print("❌ Não foi possível encontrar porta disponível após múltiplas tentativas")
    return None

def setup_port(default_port):
    """
    Configura a porta do servidor, tentando liberar portas ocupadas se necessário
    """
    print(f"🔧 Configurando porta do servidor...")
    
    if not is_port_in_use(default_port):
        print(f"✅ Porta {default_port} disponível")
        return default_port
    
    print(f"⚠️  Porta {default_port} ocupada. Tentando liberar...")
    
    if kill_process_on_port(default_port):
        time.sleep(2)
        if not is_port_in_use(default_port):
            print(f"✅ Porta {default_port} liberada com sucesso!")
            return default_port
    
    print("🔄 Buscando porta alternativa...")
    available_port = find_available_port(default_port)
    
    if available_port:
        print(f"🔀 Usando porta alternativa: {available_port}")
        return available_port
    else:
        print("❌ Não foi possível encontrar porta disponível")
        return None

def signal_handler(signum, frame):
    """
    Manipulador de sinais do sistema para encerramento graceful do servidor
    """
    print(f"\n🔄 Recebido sinal {signum}. Encerrando graceful...")
    config.servidor_rodando = False

def setup_signal_handlers():
    """
    Configura os handlers para sinais de interrupção e término
    """
    try:
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        print("✅ Handlers de sinal configurados")
    except Exception as e:
        print(f"⚠️  Aviso na configuração de sinais: {e}")

def create_server(port, handler_class):
    """
    Cria e configura uma instância do servidor TCP
    """
    try:
        server = socketserver.TCPServer(("", port), handler_class)
        server.timeout = config.SERVER_TIMEOUT
        server.allow_reuse_address = True
        print(f"✅ Servidor criado na porta {port}")
        return server
    except Exception as e:
        print(f"❌ Erro ao criar servidor: {e}")
        raise

def print_server_info(port):
    """
    Exibe informações formatadas sobre o servidor iniciado
    """
    print(f"\n🎉 SERVIDOR INICIADO COM SUCESSO!")
    print("=" * 50)
    print(f"🌐 URL: http://localhost:{port}/public/pages/01_CreateProjects.html")
    print("=" * 50)
    print("📋 CONTROLES:")
    print("   • Pressione Ctrl+C para PARAR o servidor")
    print("   • Feche o navegador para encerramento automático")
    print("   • Seu trabalho é salvo automaticamente")
    print("=" * 50)

def open_browser(port=8000):
    """
    Abre o navegador padrão automaticamente apontando para a aplicação
    """
    time.sleep(2)
    
    url = f"http://localhost:{port}/public/pages/01_CreateProjects.html"
    print(f"🌐 Abrindo aplicação: {url}")
    
    try:
        import webbrowser
        webbrowser.open(url)
        print("✅ Navegador iniciado com sucesso!")
    except Exception as e:
        print(f"⚠️  Não foi possível abrir navegador automaticamente: {e}")
        print(f"💡 Acesse manualmente: {url}")

def start_server_threads(port, httpd, monitor_function):
    """
    Inicia as threads auxiliares do servidor (browser e monitor)
    """
    try:
        browser_thread = threading.Thread(target=open_browser, args=(port,), daemon=True)
        browser_thread.start()
        
        monitor_thread = threading.Thread(target=monitor_function, args=(port, httpd), daemon=True)
        monitor_thread.start()
        
        print("\n🟢 SISTEMA PRONTO!")
        print("   Aplicação carregada no navegador")
        print("   Trabalhe normalmente - tudo é salvo automaticamente")
        print("   O servidor gerencia automaticamente o encerramento\n")
        
    except Exception as e:
        print(f"⚠️  Erro ao iniciar threads: {e}")

def run_server_loop(httpd):
    """
    Loop principal de execução do servidor com tratamento de exceções
    """
    print("🔄 Servidor em execução...")
    
    while config.servidor_rodando:
        try:
            httpd.handle_request()
        except socket.timeout:
            continue  
        except KeyboardInterrupt:
            print("\n⏹️  Interrupção pelo usuário detectada")
            config.servidor_rodando = False
            break
        except Exception as e:
            if config.servidor_rodando:
                print(f"⚠️  Erro não crítico no servidor: {e}")
                time.sleep(1)
                continue
            else:
                break
    
    print("👋 Encerramento solicitado...")

def shutdown_server_async(httpd):
    """
    Executa o desligamento graceful do servidor em thread separada
    INCLUINDO LIMPEZA DE CACHE
    """
    def shutdown_task():
        try:
            print("🔄 Finalizando conexões do servidor...")
            httpd.shutdown()
            httpd.server_close()
            print("✅ Conexões do servidor finalizadas")
            
            # 🆕 NOVO: Limpeza de cache após encerramento
            print("🔄 Iniciando limpeza de cache...")
            clean_on_shutdown()
            
        except Exception as e:
            print(f"⚠️  Aviso no encerramento: {e}")
    
    shutdown_thread = threading.Thread(target=shutdown_task, daemon=True)
    shutdown_thread.start()
    
    # Aguarda um pouco mais para garantir a limpeza
    shutdown_thread.join(timeout=8.0)
    
    if shutdown_thread.is_alive():
        print("⏰ Timeout no encerramento - finalizando forçadamente...")
        try:
            httpd.server_close()
        except:
            pass