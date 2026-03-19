"""
browser_monitor.py
Monitoramento do navegador - Com tempo ativo do servidor
"""

import time
import threading

class ServerTimeMonitor:
    """Monitor de tempo ativo do servidor"""
    
    def __init__(self):
        self.start_time = time.time()
        self.is_running = True
        self.monitor_thread = None
    
    def start_monitoring(self):
        """Inicia o monitoramento de tempo"""
        self.monitor_thread = threading.Thread(target=self._time_monitor_loop, daemon=True)
        self.monitor_thread.start()
    
    def _time_monitor_loop(self):
        """Loop de monitoramento de tempo"""
        print(" MONITOR DE TEMPO: Iniciado")
        
        while self.is_running:
            try:
                time.sleep(1800)  # Verifica a cada 5 minutos
                self._log_uptime()
            except Exception as e:
                print(f" Monitor de tempo: Erro - {e}")
    
    def _log_uptime(self):
        """Loga o tempo de atividade do servidor"""
        elapsed = time.time() - self.start_time
        hours = int(elapsed // 3600)
        minutes = int((elapsed % 3600) // 60)
        
        if hours > 0:
            print(f" Servidor ativo há {hours}h {minutes}min")
        else:
            print(f" Servidor ativo há {minutes}min")
    
    def get_uptime(self):
        """Retorna o tempo de atividade em formato legível"""
        elapsed = time.time() - self.start_time
        hours = int(elapsed // 3600)
        minutes = int((elapsed % 3600) // 60)
        seconds = int(elapsed % 60)
        
        if hours > 0:
            return f"{hours}h {minutes}min {seconds}s"
        elif minutes > 0:
            return f"{minutes}min {seconds}s"
        else:
            return f"{seconds}s"
    
    def stop(self):
        """Para o monitoramento"""
        self.is_running = False

# Instância global do monitor
time_monitor = ServerTimeMonitor()

def monitorar_navegador(port, httpd):
    """
    Monitoramento do servidor com tempo ativo
    """
    # Inicia o monitor de tempo
    time_monitor.start_monitoring()
    
    print("🔍 MONITOR: Sistema de monitoramento INICIADO")
    print("   • Encerramento automático DESATIVADO")
    print("   • Servidor permanecerá aberto até encerramento manual")
    print("   • Use o botão 'Encerrar Servidor' na interface web")
    print("   • Ou pressione Ctrl+C neste terminal")
    print(f"   • Tempo de atividade será mostrado a cada 30 minutos\n")
    
    # Loop principal
    while True:
        try:
            time.sleep(10)
        except KeyboardInterrupt:
            print("\n MONITOR: Interrupção recebida - parando monitor de tempo...")
            time_monitor.stop()
            break
        except Exception as e:
            print(f" MONITOR: Erro inesperado: {e}")
            time.sleep(10)
    
    print(" MONITOR: Thread finalizada")

def get_server_uptime():
    """Retorna o tempo de atividade do servidor (para APIs)"""
    return time_monitor.get_uptime()
