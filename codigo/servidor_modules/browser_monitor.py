"""
Monitoramento do navegador
"""

import time
import threading
import psutil
from servidor_modules import config, server_utils

def is_browser_connected(port):
    """
    Verifica se há navegadores conectados - Método OTIMIZADO
    """
    try:
        browser_processes = [
            'chrome.exe', 'firefox.exe', 'msedge.exe', 
            'opera.exe', 'safari.exe', 'brave.exe',
            'iexplore.exe', 'vivaldi.exe', 'waterfox.exe'
        ]
        
        browser_count = 0
        for proc in psutil.process_iter(['name']):
            try:
                proc_name = proc.info['name'].lower() if proc.info['name'] else ''
                
                if any(browser in proc_name for browser in browser_processes):
                    if proc.status() == psutil.STATUS_RUNNING:
                        browser_count += 1
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        return browser_count > 0
        
    except Exception as e:
        print(f"⚠️  Aviso no monitor: {e}")
        return True  # Por segurança, assume que está conectado

def monitorar_navegador(port, httpd):
    """
    Monitoramento RÁPIDO - só fecha quando o navegador for fechado
    """
    print("🔍 MONITORAMENTO ATIVO - FECHAMENTO RÁPIDO")
    print("   • Servidor ficará ativo INDEFINIDAMENTE")
    print("   • Fechamento em 5-10 segundos após fechar navegador")
    print("   • Pressione Ctrl+C para encerrar manualmente\n")
    
    time.sleep(2)  # Reduzido para 2 segundos
    print("✅ Sistema de monitoramento inicializado")
    
    tentativas_sem_navegador = 0
    max_tentativas = 3  # Apenas 3 verificações (5-10 segundos no total)
    
    while config.servidor_rodando:
        try:
            # Verifica se o navegador ainda está aberto
            navegador_aberto = is_browser_connected(port)
            
            if navegador_aberto:
                tentativas_sem_navegador = 0  # Reset do contador
                # print("✅ Navegador ativo")  # Opcional: descomente para debug
            else:
                tentativas_sem_navegador += 1
                print(f"📱 Navegador não encontrado ({tentativas_sem_navegador}/{max_tentativas})")
                
                if tentativas_sem_navegador >= max_tentativas:
                    print("🚨 NAVEGADOR FECHADO - Encerrando servidor...")
                    break
            
            # Verificação mais frequente para detectar fechamento rápido
            time.sleep(3)  # Verifica a cada 3 segundos
            
        except KeyboardInterrupt:
            print("\n⏹️  Interrupção recebida no monitor")
            break
        except Exception as e:
            print(f"⚠️  Erro não crítico no monitor: {e}")
            time.sleep(3)
    
    # Encerramento rápido
    if config.servidor_rodando:
        print("💾 Finalizando servidor (navegador fechado)...")
        config.servidor_rodando = False
        
        # Encerramento mais rápido
        def shutdown_rapido():
            print("🔄 Finalizando conexões...")
            try:
                httpd.shutdown()
                httpd.server_close()
                print("✅ Servidor finalizado com sucesso")
            except Exception as e:
                print(f"⚠️  Aviso no encerramento: {e}")
        
        shutdown_thread = threading.Thread(target=shutdown_rapido, daemon=True)
        shutdown_thread.start()
        shutdown_thread.join(timeout=3.0)  # Timeout reduzido para 3 segundos