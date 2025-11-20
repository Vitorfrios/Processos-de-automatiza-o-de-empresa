"""
servidor.py
Servidor principal com inicialização acelerada
"""

import os
import sys
import time
from pathlib import Path

def setup_environment():
    """Configuração rápida do ambiente"""
    current_dir = Path(__file__).parent
    sys.path.insert(0, str(current_dir))
    
    # Configurações de performance
    os.environ['PYTHONOPTIMIZE'] = '1'

def load_optimized_modules():
    """Carrega módulos de forma otimizada"""
    try:
        from servidor_modules.core.server_core import ServerCore
        from servidor_modules.handlers.http_handler import UniversalHTTPRequestHandler
        from servidor_modules.utils.browser_monitor import monitorar_navegador
        
        return ServerCore, UniversalHTTPRequestHandler, monitorar_navegador
    except ImportError as e:
        print(f"❌ Erro ao carregar módulos: {e}")
        sys.exit(1)

def initialize_server():
    """Inicialização rápida do servidor"""
    print("🚀 INICIANDO SERVIDOR ")
    start_time = time.time()
    
    # Carrega módulos
    ServerCore, UniversalHTTPRequestHandler, monitorar_navegador = load_optimized_modules()
    
    # Cria núcleo do servidor
    server_core = ServerCore()
    
    # Configura porta de forma rápida
    print("🔧 Configurando porta...")
    port = server_core.setup_port(8000)
    if not port:
        print("❌ Não foi possível encontrar porta disponível")
        sys.exit(1)
    
    # Cria servidor
    print("🔄 Criando servidor HTTP...")
    try:
        httpd = server_core.create_server(port, UniversalHTTPRequestHandler)
    except Exception as e:
        print(f"❌ Erro ao criar servidor: {e}")
        sys.exit(1)
    
    # Configura handlers de sinal (rápido)
    server_core.setup_signal_handlers()
    
    # Exibe informações
    server_core.print_server_info(port)
    
    # Inicia threads (otimizado)
    server_core.start_server_threads(port, httpd, monitorar_navegador)
    
    # Tempo de inicialização
    init_time = time.time() - start_time
    print(f"⚡ Servidor iniciado em {init_time:.2f} segundos")
    
    return httpd, server_core

def run_server():
    """Loop principal otimizado do servidor"""
    httpd, server_core = initialize_server()
    
    try:
        # Loop principal com timeout reduzido
        print("🔄 Servidor em execução...")
        
        while server_core.servidor_rodando:
            try:
                httpd.handle_request()
            except KeyboardInterrupt:
                print("\n⏹️  Interrupção pelo usuário")
                break
            except Exception as e:
                # Apenas logs críticos
                if "Broken pipe" not in str(e) and "Connection reset" not in str(e):
                    print(f"⚠️  Erro não crítico: {e}")
                continue
        
    except Exception as e:
        print(f"❌ Erro no servidor: {e}")
    
    finally:
        # Encerramento rápido
        shutdown_server(httpd, server_core)

def shutdown_server(httpd, server_core):
    """Encerramento otimizado do servidor"""
    print("\n🔴 Encerrando servidor...")
    
    try:
        # Limpeza rápida
        from servidor_modules.utils.cache_cleaner import CacheCleaner
        cache_cleaner = CacheCleaner()
        
        # Encerra servidor em thread separada (não bloqueante)
        server_core.shutdown_server_async(httpd, cache_cleaner)
        
        print("✅ Servidor encerrado com sucesso")
        
    except Exception as e:
        print(f"⚠️  Aviso no encerramento: {e}")
    
    finally:
        sys.exit(0)

if __name__ == "__main__":
    # Configura ambiente
    setup_environment()
    
    # Inicia servidor
    run_server()