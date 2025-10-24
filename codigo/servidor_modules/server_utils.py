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
import os
from pathlib import Path

from servidor_modules import config

def is_port_in_use(port):
    """
    Verifica se uma porta específica está em uso no localhost
    @param {int} port - Número da porta a ser verificada
    @returns {bool} - True se a porta estiver em uso, False se estiver disponível
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
    @param {int} port - Número da porta a ser liberada
    @returns {bool} - True se conseguiu liberar a porta, False caso contrário
    """
    try:
        if sys.platform == "win32":
            # Método melhorado para Windows
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
                        # Verifica se é um PID válido
                        if pid.isdigit():
                            print(f"🔄 Liberando porta {port} (PID: {pid})...")
                            try:
                                subprocess.run(
                                    ['taskkill', '/PID', pid, '/F'], 
                                    capture_output=True,
                                    timeout=5
                                )
                                time.sleep(1)
                                # Verifica se a porta foi liberada
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
    @param {int} start_port - Porta inicial para busca (padrão: config.DEFAULT_PORT)
    @param {int} max_attempts - Número máximo de tentativas (padrão: config.MAX_PORT_ATTEMPTS)
    @returns {int|None} - Número da porta disponível ou None se não encontrou
    """
    # Primeiro, tenta as portas sequenciais
    for port in range(start_port, start_port + max_attempts):
        if not is_port_in_use(port):
            return port
    
    # Tenta portas aleatórias como fallback
    import random
    for attempt in range(10):  # Aumenta para 10 tentativas
        port = random.randint(8000, 9000)
        if not is_port_in_use(port):
            print(f"🎯 Usando porta alternativa: {port}")
            return port
    
    print("❌ Não foi possível encontrar porta disponível após múltiplas tentativas")
    return None

def setup_port(default_port):
    """
    Configura a porta do servidor, tentando liberar portas ocupadas se necessário
    @param {int} default_port - Porta padrão desejada
    @returns {int|None} - Porta configurada ou None em caso de falha
    """
    print(f"🔧 Configurando porta do servidor...")
    
    # Verifica se a porta padrão está disponível
    if not is_port_in_use(default_port):
        print(f"✅ Porta {default_port} disponível")
        return default_port
    
    print(f"⚠️  Porta {default_port} ocupada. Tentando liberar...")
    
    # Tenta liberar a porta
    if kill_process_on_port(default_port):
        time.sleep(2)  # Espera o processo ser finalizado
        if not is_port_in_use(default_port):
            print(f"✅ Porta {default_port} liberada com sucesso!")
            return default_port
    
    # Se não conseguiu liberar, busca porta alternativa
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
    @param {int} signum - Número do sinal recebido
    @param {frame} frame - Frame de execução atual
    """
    print(f"\n🔄 Recebido sinal {signum}. Encerrando graceful...")
    config.servidor_rodando = False

def setup_signal_handlers():
    """
    Configura os handlers para sinais de interrupção e término
    Permite encerramento graceful com Ctrl+C
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
    @param {int} port - Porta onde o servidor irá escutar
    @param {class} handler_class - Classe handler para processar requisições
    @returns {socketserver.TCPServer} - Instância do servidor configurado
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
    @param {int} port - Porta em que o servidor está rodando
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
    @param {int} port - Porta do servidor (padrão: 8000)
    """
    time.sleep(2)  # Espera servidor estabilizar
    
    url = f"http://localhost:{port}/public/pages/01_CreateProjects.html"
    print(f"🌐 Abrindo aplicação: {url}")
    
    try:
        import webbrowser
        # Tenta abrir no navegador padrão
        webbrowser.open(url)
        print("✅ Navegador iniciado com sucesso!")
    except Exception as e:
        print(f"⚠️  Não foi possível abrir navegador automaticamente: {e}")
        print(f"💡 Acesse manualmente: {url}")

def start_server_threads(port, httpd, monitor_function):
    """
    Inicia as threads auxiliares do servidor (browser e monitor)
    @param {int} port - Porta do servidor
    @param {socketserver.TCPServer} httpd - Instância do servidor
    @param {function} monitor_function - Função de monitoramento a ser executada
    """
    try:
        # Thread para abrir navegador
        browser_thread = threading.Thread(target=open_browser, args=(port,), daemon=True)
        browser_thread.start()
        
        # Thread para monitoramento
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
    @param {socketserver.TCPServer} httpd - Instância do servidor
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
                time.sleep(1)  # Previne loop infinito em caso de erro contínuo
                continue
            else:
                break
    
    print("👋 Encerramento solicitado...")

def shutdown_server_async(httpd):
    """
    Executa o desligamento graceful do servidor em thread separada
    @param {socketserver.TCPServer} httpd - Instância do servidor a ser encerrada
    """
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
        print("⏰ Timeout no encerramento - finalizando forçadamente...")
        # Força a saída se necessário
        try:
            httpd.server_close()
        except:
            pass