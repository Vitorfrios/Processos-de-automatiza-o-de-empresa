"""
servidor.py
Servidor principal SEM CACHE
"""

import os
import sys
import time
from pathlib import Path

def setup_environment():
    """Configuração do ambiente SEM CACHE"""
    current_dir = Path(__file__).parent
    sys.path.insert(0, str(current_dir))
    
    # DESATIVA CACHES DO PYTHON
    os.environ['PYTHONDONTWRITEBYTECODE'] = '1'  # Não gera .pyc
    os.environ['PYTHONOPTIMIZE'] = '1'
    
    # Desativa cache de importação
    sys.dont_write_bytecode = True

def load_modules_no_cache():
    """Carrega módulos SEM cache"""
    try:
        # Force reload para evitar cache de módulos
        if 'servidor_modules.core.server_core' in sys.modules:
            del sys.modules['servidor_modules.core.server_core']
        if 'servidor_modules.handlers.http_handler' in sys.modules:
            del sys.modules['servidor_modules.handlers.http_handler']
        if 'servidor_modules.utils.browser_monitor' in sys.modules:
            del sys.modules['servidor_modules.utils.browser_monitor']
        
        from servidor_modules.core.server_core import ServerCore
        from servidor_modules.handlers.http_handler import UniversalHTTPRequestHandler
        from servidor_modules.utils.browser_monitor import monitorar_navegador
        
        return ServerCore, UniversalHTTPRequestHandler, monitorar_navegador
    except ImportError as e:
        print(f"❌ Erro ao carregar módulos: {e}")
        sys.exit(1)

def initialize_server():
    """Inicialização do servidor SEM CACHE"""
    print("🚀 INICIANDO SERVIDOR SEM CACHE")
    start_time = time.time()
    
    # Limpa possíveis caches na inicialização
    import gc
    gc.collect()
    
    # Carrega módulos
    ServerCore, UniversalHTTPRequestHandler, monitorar_navegador = load_modules_no_cache()
    
    # Cria núcleo do servidor
    server_core = ServerCore()
    
    # Configura porta
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
    
    # Configura handlers de sinal
    server_core.setup_signal_handlers()
    
    # Exibe informações
    server_core.print_server_info(port)
    
    # Inicia threads
    server_core.start_server_threads(port, httpd, monitorar_navegador)
    
    # Tempo de inicialização
    init_time = time.time() - start_time
    print(f"⚡ Servidor SEM CACHE iniciado em {init_time:.2f} segundos")
    
    return httpd, server_core

def run_server():
    """Loop principal do servidor SEM CACHE"""
    httpd, server_core = initialize_server()
    
    try:
        print("🔄 Servidor em execução (SEM CACHE)...")
        
        while server_core.servidor_rodando:
            try:
                httpd.handle_request()
            except KeyboardInterrupt:
                print("\n⏹️  Interrupção pelo usuário")
                break
            except Exception as e:
                if "Broken pipe" not in str(e) and "Connection reset" not in str(e):
                    print(f"⚠️  Erro não crítico: {e}")
                continue
        
    except Exception as e:
        print(f"❌ Erro no servidor: {e}")
    
    finally:
        shutdown_server(httpd, server_core)

def shutdown_server(httpd, server_core):
    """Encerramento do servidor"""
    print("\n🔴 Encerrando servidor...")
    
    try:
        # Encerra servidor sem limpeza de cache (já que não usamos)
        server_core.shutdown_server_async(httpd, None)  # Passa None para cache_cleaner
        
        print("✅ Servidor encerrado com sucesso")
        
    except Exception as e:
        print(f"⚠️  Aviso no encerramento: {e}")
    
    finally:
        sys.exit(0)

if __name__ == "__main__":
    # Configura ambiente SEM CACHE
    setup_environment()
    
    # Inicia servidor
    run_server()