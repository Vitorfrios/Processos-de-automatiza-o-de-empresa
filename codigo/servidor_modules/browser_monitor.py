"""
Monitoramento do navegador - Versão Windows Compatível
"""

import time
import psutil
from servidor_modules import config, server_utils

def is_browser_connected(port):
    """
    Verifica se há navegadores conectados - Versão Windows Compatível
    """
    try:
        browser_processes = [
            'chrome.exe', 'firefox.exe', 'msedge.exe', 
            'opera.exe', 'safari.exe', 'brave.exe',
            'iexplore.exe', 'vivaldi.exe', 'waterfox.exe'
        ]
        
        # Verifica processos de navegador (sem 'connections' no Windows)
        for proc in psutil.process_iter(['name']):
            try:
                proc_name = proc.info['name'].lower() if proc.info['name'] else ''
                
                # Verifica se é um navegador conhecido
                if any(browser in proc_name for browser in browser_processes):
                    # Método alternativo para Windows: verifica se o processo está ativo
                    # Em vez de verificar conexões, assumimos que se é um navegador e está rodando, está conectado
                    if proc.status() == psutil.STATUS_RUNNING:
                        return True
                        
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
                
        return False
        
    except Exception as e:
        print(f"⚠️  Aviso no monitor: {e}")
        return True  # Fail-safe: em caso de erro, mantém servidor ativo

def check_port_connections(port):
    """
    Método alternativo: verifica conexões na porta via socket
    """
    try:
        import socket
        # Tenta criar uma conexão de teste
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('localhost', port))
            return result == 0  # True se conseguiu conectar
    except:
        return False

def monitorar_navegador(port, httpd):
    """
    Monitoramento inteligente e compatível com Windows
    """
    print("🔍 MONITORAMENTO ATIVO")
    print("   • Servidor permanecerá ativo durante o uso")
    print("   • Encerramento automático após inatividade prolongada")
    print("   • Pressione Ctrl+C para encerrar manualmente\n")
    
    # Tempo inicial mais longo para estabilização
    time.sleep(config.MONITOR_START_DELAY)
    print("✅ Sistema de monitoramento inicializado")
    
    tentativas_inativas = 0
    max_tentativas_inativas = 24  # 2 minutos total (24 * 5s)
    ultima_conexao_ativa = time.time()

    while config.servidor_rodando:
        try:
            # Método 1: Verifica navegadores pelo processo
            navegador_ativo = is_browser_connected(port)
            
            # Método 2: Verifica conexões na porta
            porta_ativa = check_port_connections(port)
            
            # Considera ativo se qualquer um dos métodos retornar True
            sistema_ativo = navegador_ativo or porta_ativa
            
            if sistema_ativo:
                # Reset contador se detectar atividade
                if tentativas_inativas > 0:
                    print("✅ Atividade detectada - reiniciando contador")
                    tentativas_inativas = 0
                ultima_conexao_ativa = time.time()
            else:
                tentativas_inativas += 1
                
                tempo_inativo = time.time() - ultima_conexao_ativa
                
                if tentativas_inativas == 1:
                    print("⏰ Aguardando atividade...")
                elif tentativas_inativas % 6 == 0:  # A cada 30 segundos
                    print(f"   ⏱️  {int(tempo_inativo)} segundos sem atividade")
                
                if tentativas_inativas >= max_tentativas_inativas:
                    print(f"\n🌐 SEM ATIVIDADE POR {int(tempo_inativo)} SEGUNDOS")
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
        print("💾 Finalizando servidor...")
        config.servidor_rodando = False
        server_utils.shutdown_server_async(httpd)