"""
Monitoramento do navegador - Versão OTIMIZADA com Heartbeat
"""

import time
import psutil
from servidor_modules import config, server_utils

def is_browser_connected(port):
    """
    Verifica se há navegadores conectados - Método secundário
    """
    try:
        browser_processes = [
            'chrome.exe', 'firefox.exe', 'msedge.exe', 
            'opera.exe', 'safari.exe', 'brave.exe',
            'iexplore.exe', 'vivaldi.exe', 'waterfox.exe'
        ]
        
        for proc in psutil.process_iter(['name']):
            try:
                proc_name = proc.info['name'].lower() if proc.info['name'] else ''
                
                if any(browser in proc_name for browser in browser_processes):
                    if proc.status() == psutil.STATUS_RUNNING:
                        return True
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        return False
    except Exception as e:
        print(f"⚠️  Aviso no monitor: {e}")
        return True  # Fail-safe

def check_heartbeat_timeout():
    """
    NOVO: Verifica se o cliente está inativo baseado no heartbeat
    """
    if config.ultimo_heartbeat is None:
        # Primeira execução - ainda não recebeu heartbeat
        return False
    
    tempo_sem_heartbeat = time.time() - config.ultimo_heartbeat
    return tempo_sem_heartbeat > config.HEARTBEAT_TIMEOUT

def monitorar_navegador(port, httpd):
    """
    Monitoramento INTELIGENTE com heartbeat - REDUZIDO para 30s
    """
    print("🔍 MONITORAMENTO ATIVO - SISTEMA OTIMIZADO")
    print("   • Detecção de inatividade: 15-30 segundos")
    print("   • Recarregamentos NÃO encerram o servidor") 
    print("   • Heartbeat ativo")
    print("   • Pressione Ctrl+C para encerrar manualmente\n")
    
    # Tempo reduzido para estabilização
    time.sleep(config.MONITOR_START_DELAY)
    print("✅ Sistema de monitoramento inicializado")
    
    tentativas_inativas = 0
    max_tentativas_inativas = config.MONITOR_MAX_ATTEMPTS  # 30 segundos total
    ultima_conexao_ativa = time.time()

    while config.servidor_rodando:
        try:
            # MÉTODO PRINCIPAL: Verifica heartbeat (15 segundos)
            if check_heartbeat_timeout():
                print("🚨 CLIENTE INATIVO - Sem heartbeat por 15+ segundos")
                break
            
            # MÉTODO SECUNDÁRIO: Verifica processos (backup)
            navegador_ativo = is_browser_connected(port)
            
            if navegador_ativo:
                if tentativas_inativas > 0:
                    print("✅ Atividade detectada - reiniciando contador")
                    tentativas_inativas = 0
                ultima_conexao_ativa = time.time()
            else:
                tentativas_inativas += 1
                tempo_inativo = time.time() - ultima_conexao_ativa
                
                if tentativas_inativas == 1:
                    print("⏰ Aguardando atividade...")
                elif tentativas_inativas % 3 == 0:  # A cada 15 segundos
                    print(f"   ⏱️  {int(tempo_inativo)} segundos sem atividade de processo")
                
                # Timeout de backup: 30 segundos sem processo
                if tentativas_inativas >= max_tentativas_inativas:
                    print(f"\n🌐 SEM ATIVIDADE DE PROCESSO POR {int(tempo_inativo)} SEGUNDOS")
                    print("⏹️  Encerrando servidor automaticamente...")
                    break
            
            # Intervalo entre verificações
            time.sleep(config.MONITOR_CHECK_INTERVAL)
            
        except KeyboardInterrupt:
            print("\n⏹️  Interrupção recebida no monitor")
            break
        except Exception as e:
            print(f"⚠️  Erro não crítico no monitor: {e}")
            time.sleep(config.MONITOR_CHECK_INTERVAL)
    
    # Encerramento seguro
    if config.servidor_rodando:
        print("💾 Finalizando servidor por inatividade do cliente...")
        config.servidor_rodando = False
        server_utils.shutdown_server_async(httpd)