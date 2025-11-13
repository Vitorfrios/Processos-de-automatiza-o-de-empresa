#!/usr/bin/env python3
"""
servidor.py
Sistema de Climatização - Servidor Principal REORGANIZADO
"""

import os
import sys
import time
import traceback
import threading

# Adiciona o diretório atual ao path para garantir imports
diretorio_atual = os.path.dirname(os.path.abspath(__file__))
if diretorio_atual not in sys.path:
    sys.path.insert(0, diretorio_atual)

print("=" * 60)
print("SISTEMA DE CLIMATIZAÇÃO - INICIANDO DIAGNÓSTICO")
print("=" * 60)

def diagnostico_completo():
    """Faz diagnóstico completo do sistema"""
    print("\n1. VERIFICANDO DIRETÓRIOS...")
    print(f"   Diretório atual: {diretorio_atual}")
    print(f"   Pasta json: {os.path.exists(os.path.join(diretorio_atual, 'json'))}")
    print(f"   Pasta servidor_modules: {os.path.exists(os.path.join(diretorio_atual, 'servidor_modules'))}")
    
    print("\n2. VERIFICANDO ARQUIVOS...")
    arquivos = [
        'servidor.py',
        'servidor_modules/__init__.py',
        'servidor_modules/config.py', 
        'servidor_modules/core/__init__.py',
        'servidor_modules/core/server_core.py',
        'servidor_modules/core/routes_core.py',
        'servidor_modules/core/sessions_core.py',
        'servidor_modules/handlers/__init__.py',
        'servidor_modules/handlers/http_handler.py',
        'servidor_modules/handlers/route_handler.py',
        'servidor_modules/utils/__init__.py',
        'servidor_modules/utils/file_utils.py',
        'servidor_modules/utils/server_utils.py',
        'servidor_modules/utils/cache_cleaner.py',
        'servidor_modules/utils/browser_monitor.py',
        'json/backup.json',
        'json/dados.json',
        'json/sessions.json'
    ]
    
    for arquivo in arquivos:
        caminho = os.path.join(diretorio_atual, arquivo)
        existe = os.path.exists(caminho)
        status = "✅" if existe else "❌"
        print(f"   {status} {arquivo}: {existe}")

# Executa diagnóstico primeiro
diagnostico_completo()

# Agora tenta importar os módulos
try:
    print("\n4. IMPORTANDO MÓDULOS...")
    from servidor_modules.core.server_core import ServerCore
    from servidor_modules.handlers.http_handler import UniversalHTTPRequestHandler
    from servidor_modules.utils.browser_monitor import monitorar_navegador
    from servidor_modules.core.sessions_core import SessionsManager
    from servidor_modules.utils.cache_cleaner import CacheCleaner
    from servidor_modules.utils.file_utils import FileUtils
    
    print("   ✅ Módulos importados com sucesso!")
    
except ImportError as e:
    print(f"   ❌ ERRO DE IMPORTAÇÃO: {e}")
    print(f"   TRACEBACK:")
    traceback.print_exc()
    print("\nPressione Enter para sair...")
    input()
    sys.exit(1)

def active_session_after_delay(interval_seconds, server_core):
    """Mostra tempo de execução a cada intervalo"""
    def monitor():
        start_time = time.time()
        last_report = 0
        
        while server_core.servidor_rodando:
            try:
                elapsed_time = time.time() - start_time
                
                if elapsed_time >= last_report + interval_seconds:
                    hours = int(elapsed_time // 3600)
                    minutes = int((elapsed_time % 3600) // 60)
                    seconds = int(elapsed_time % 60)
                    
                    if hours > 0:
                        print(f"⏰ Monitoramento: Servidor ativo há {hours}h{minutes:02d}min{seconds:02d}s")
                    elif minutes > 0:
                        print(f"⏰ Monitoramento: Servidor ativo há {minutes}min{seconds:02d}s")
                    else:
                        print(f"⏰ Monitoramento: Servidor ativo há {seconds}s")
                    
                    last_report = elapsed_time
                
                time.sleep(0.1)
                
            except Exception as e:
                print(f"❌ Erro no monitor: {e}")
                break
    
    monitor_thread = threading.Thread(target=monitor)
    monitor_thread.daemon = True
    monitor_thread.start()
    print(f"🔔 Monitor ativado: mostrando tempo a cada {interval_seconds} segundos")

def main():
    """Função principal com nova estrutura"""
    try:
        print("\n5. INICIANDO SERVIDOR...")
        
        # Inicializa componentes
        server_core = ServerCore()
        cache_cleaner = CacheCleaner()
        file_utils = FileUtils()
        
        # SessionsManager é importado globalmente, não precisa instanciar aqui
        from servidor_modules.core.sessions_core import sessions_manager
        
        # Configuração
        print("   Configurando handlers de sinal...")
        server_core.setup_signal_handlers()
        
        # Configura porta
        print("   Configurando porta...")
        port = server_core.setup_port(8000)
        if not port:
            print("   ❌ Não foi possível configurar porta")
            print("Pressione Enter para sair...")
            input()
            return
        
        print(f"   ✅ Porta {port} configurada")
        
        # Inicialização do servidor
        print("   Criando servidor...")
        with server_core.create_server(port, UniversalHTTPRequestHandler) as httpd:
            # Informações do sistema
            server_core.print_server_info(port)
            
            # Inicialização das threads
            print("   Iniciando threads...")
            server_core.start_server_threads(port, httpd, monitorar_navegador)
            
            print("   ✅ SERVIDOR INICIADO COM SUCESSO!")
            print("   🟢 SISTEMA OPERACIONAL")
            
            # Ativar monitor de tempo
            active_session_after_delay(1200, server_core)
            
            # Loop principal
            server_core.run_server_loop(httpd)
            
    except KeyboardInterrupt:
        print("\n   ⏹️  Encerramento solicitado pelo usuário (Ctrl+C)")
        server_core.servidor_rodando = False
    except Exception as e:
        print(f"\n   ❌ ERRO CRÍTICO: {e}")
        print("   TRACEBACK COMPLETO:")
        traceback.print_exc()
        print("\n   O sistema será finalizado em 10 segundos...")
        time.sleep(10)
    finally:
        print("\n   🔴 Servidor finalizado!")
        
        # Garantir shutdown
        try:
            if 'httpd' in locals() and 'server_core' in locals():
                print("   🔄 Executando shutdown assíncrono...")
                server_core.shutdown_server_async(httpd, cache_cleaner)
        except Exception as e:
            print(f"   ⚠️  Erro no shutdown: {e}")
        
        print("   ⏳ Aguardando finalização dos processos...")
        time.sleep(2)
        
        print("   🚪 Encerrando processo Python...")
        os._exit(0)     
        
if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERRO FATAL: {e}")
        traceback.print_exc()
        os._exit(1)