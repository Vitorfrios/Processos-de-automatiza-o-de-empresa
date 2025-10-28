#!/usr/bin/env python3
"""
Sistema de Climatização - Servidor Principal
Versão com Diagnóstico Completo
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
        'servidor_modules/server_utils.py',
        'servidor_modules/http_handler.py',
        'servidor_modules/routes.py',
        'servidor_modules/sessions_manager.py',
        'servidor_modules/file_utils.py',
        'servidor_modules/browser_monitor.py',
        'json/backup.json',
        'json/dados.json',
        'json/sessions.json'
    ]
    
    for arquivo in arquivos:
        caminho = os.path.join(diretorio_atual, arquivo)
        existe = os.path.exists(caminho)
        status = "✅" if existe else "❌"
        print(f"   {status} {arquivo}: {existe}")
    
    print("\n3. VERIFICANDO IMPORTAÇÕES...")

# Executa diagnóstico primeiro
diagnostico_completo()

# Agora tenta importar os módulos
try:
    print("\n4. IMPORTANDO MÓDULOS...")
    from servidor_modules import server_utils, http_handler, browser_monitor, sessions_manager
    from servidor_modules import config
    print("   ✅ Módulos importados com sucesso!")
    
except ImportError as e:
    print(f"   ❌ ERRO DE IMPORTAÇÃO: {e}")
    print(f"   TRACEBACK:")
    traceback.print_exc()
    print("\nPressione Enter para sair...")
    input()
    sys.exit(1)

except Exception as e:
    print(f"   ❌ ERRO INESPERADO: {e}")
    print(f"   TRACEBACK:")
    traceback.print_exc()
    print("\nPressione Enter para sair...")
    input()
    sys.exit(1)

def force_shutdown_after_delay(interval_seconds):
    """✅ CORREÇÃO: Mostra tempo de execução a cada intervalo especificado em SEGUNDOS"""
    def monitor():
        start_time = time.time()
        last_report = 0
        
        while config.servidor_rodando:
            try:
                # Calcular tempo decorrido
                elapsed_time = time.time() - start_time
                
                # Verificar se passou um intervalo completo
                if elapsed_time >= last_report + interval_seconds:
                    # Calcular horas, minutos e segundos formatados
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
                
                # Aguardar próximo check (0.1 segundo para ser responsivo)
                time.sleep(0.1)
                
            except Exception as e:
                print(f"❌ Erro no monitor: {e}")
                break
    
    monitor_thread = threading.Thread(target=monitor)
    monitor_thread.daemon = True
    monitor_thread.start()
    print(f"🔔 Monitor ativado: mostrando tempo a cada {interval_seconds} segundos")

def main():
    """Função principal com tratamento robusto de erros"""
    try:
        print("\n5. INICIANDO SERVIDOR...")
        
        # Configuração
        print("   Configurando handlers de sinal...")
        server_utils.setup_signal_handlers()
        
        # Configura porta
        print("   Configurando porta...")
        port = server_utils.setup_port(8000)
        if not port:
            print("   ❌ Não foi possível configurar porta")
            print("Pressione Enter para sair...")
            input()
            return
        
        print(f"   ✅ Porta {port} configurada")
        
        # Inicialização do servidor
        print("   Criando servidor...")
        with server_utils.create_server(port, http_handler.UniversalHTTPRequestHandler) as httpd:
            # Informações do sistema
            server_utils.print_server_info(port)
            
            # Inicialização das threads
            print("   Iniciando threads...")
            server_utils.start_server_threads(port, httpd, browser_monitor.monitorar_navegador)
            
            print("   ✅ SERVIDOR INICIADO COM SUCESSO!")
            print("   🟢 SISTEMA OPERACIONAL")
            
            # ✅ CORREÇÃO: Ativar monitor de tempo a cada 0.3 segundos para teste
            delay = 1200
            force_shutdown_after_delay(delay)  # Mostra tempo a cada 0.3 segundos
            
            # Loop principal
            server_utils.run_server_loop(httpd)
            
    except KeyboardInterrupt:
        print("\n   ⏹️  Encerramento solicitado pelo usuário (Ctrl+C)")
        config.servidor_rodando = False
    except Exception as e:
        print(f"\n   ❌ ERRO CRÍTICO: {e}")
        print("   TRACEBACK COMPLETO:")
        traceback.print_exc()
        print("\n   O sistema será finalizado em 10 segundos...")
        time.sleep(10)
    finally:
        print("\n   🔴 Servidor finalizado!")
        config.servidor_rodando = False
        
        # ✅ CORREÇÃO: Garantir que o processo termine completamente
        print("   🚪 Encerrando processo Python...")
        time.sleep(1)  # Dar tempo para logs serem exibidos
        
        # Método mais agressivo para garantir encerramento
        os._exit(0)     
if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERRO FATAL: {e}")
        traceback.print_exc()
        # Garante encerramento mesmo com erro fatal
        os._exit(1)
    
    # ✅ CORREÇÃO: REMOVIDO o input final que mantinha o terminal aberto
    # O servidor agora fecha completamente quando encerrado via botão