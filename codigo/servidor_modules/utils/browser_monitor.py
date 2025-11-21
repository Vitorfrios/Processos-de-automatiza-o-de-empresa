"""
browser_monitor.py
Monitoramento do navegador - Com tempo ativo do servidor e limpeza de cache
"""

import time
import threading
import sys
import os
import glob

class ServerTimeMonitor:
    """Monitor de tempo ativo do servidor com gerenciamento de cache"""
    
    def __init__(self):
        self.start_time = time.time()
        self.is_running = True
        self.monitor_thread = None
        self.last_reload_time = time.time()
    
    def start_monitoring(self):
        """Inicia o monitoramento de tempo"""
        self.monitor_thread = threading.Thread(target=self._time_monitor_loop, daemon=True)
        self.monitor_thread.start()
    
    def _time_monitor_loop(self):
        """Loop de monitoramento de tempo"""
        print("⏰ MONITOR DE TEMPO: Iniciado")
        
        while self.is_running:
            try:
                time.sleep(1800)  # Verifica a cada 30 minutos
                self._log_uptime()
            except Exception as e:
                print(f"⏰ Monitor de tempo: Erro - {e}")
    
    def _log_uptime(self):
        """Loga o tempo de atividade do servidor"""
        elapsed = time.time() - self.start_time
        hours = int(elapsed // 3600)
        minutes = int((elapsed % 3600) // 60)
        
        if hours > 0:
            print(f"⏰ Servidor ativo há {hours}h {minutes}min")
        else:
            print(f"⏰ Servidor ativo há {minutes}min")
    
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
    
    def clear_python_cache(self):
        """Limpa o cache de bytecode Python (.pyc files) de forma silenciosa"""
        try:
            cache_dirs = [
                "codigo/servidor_modules/utils/__pycache__",
                "codigo/servidor_modules/handlers/__pycache__", 
                "codigo/servidor_modules/core/__pycache__",
                "codigo/servidor_modules/__pycache__",
                "__pycache__"
            ]
            
            pyc_files = []
            for cache_dir in cache_dirs:
                if os.path.exists(cache_dir):
                    # Encontra todos os arquivos .pyc
                    pattern = os.path.join(cache_dir, "*.pyc")
                    pyc_files.extend(glob.glob(pattern))
            
            # Também procura por arquivos .pyc em todo o diretório atual
            pyc_files.extend(glob.glob("**/*.pyc", recursive=True))
            
            deleted_count = 0
            for pyc_file in pyc_files:
                try:
                    os.remove(pyc_file)
                    deleted_count += 1
                    # Remove os prints individuais de arquivos
                except Exception:
                    # Ignora erros silenciosamente
                    pass
            
            # Mostra apenas o resumo
            if deleted_count > 0:
                print(f"🧹 CACHE: {deleted_count} arquivos .pyc removidos")
            # Não mostra mensagem se não encontrou arquivos
                
            self.last_reload_time = time.time()
            return deleted_count
            
        except Exception as e:
            # Mostra apenas erros críticos
            print(f"❌ ERRO CACHE: Falha ao limpar cache: {e}")
            return 0
    
    def check_and_clear_cache_on_reload(self):
        """Verifica se deve limpar o cache baseado no tempo desde o último recarregamento"""
        current_time = time.time()
        # Se passou mais de 2 segundos desde o último recarregamento, limpa o cache
        if current_time - self.last_reload_time > 2:
            print("🔄 Recarregamento detectado - limpando cache...")
            return self.clear_python_cache()
        return 0
    
    def force_clear_cache(self):
        """Força a limpeza do cache imediatamente"""
        print("🧹 Forçando limpeza de cache...")
        return self.clear_python_cache()
    
    def stop(self):
        """Para o monitoramento"""
        self.is_running = False

# Instância global do monitor
time_monitor = ServerTimeMonitor()

def monitorar_navegador(port, httpd):
    """
    Monitoramento do servidor com tempo ativo e controle de cache
    """
    # Inicia o monitor de tempo
    time_monitor.start_monitoring()
    
    print("🔍 MONITOR: Sistema de monitoramento INICIADO")
    print("   • Encerramento automático DESATIVADO")
    print("   • Servidor permanecerá aberto até encerramento manual") 
    print("   • Use o botão 'Encerrar Servidor' na interface web")
    print("   • Ou pressione Ctrl+C neste terminal")
    print("   • Tempo de atividade será mostrado a cada 5 minutos")
    print("   • Cache será limpo automaticamente em recarregamentos\n")
    
    # Limpa cache inicial
    time_monitor.force_clear_cache()
    
    # Loop principal
    while True:
        try:
            time.sleep(10)
        except KeyboardInterrupt:
            print("\n⏰ MONITOR: Interrupção recebida - parando monitor de tempo...")
            time_monitor.stop()
            break
        except Exception as e:
            print(f"⏰ MONITOR: Erro inesperado: {e}")
            time.sleep(10)
    
    print("⏰ MONITOR: Thread finalizada")

def get_server_uptime():
    """Retorna o tempo de atividade do servidor (para APIs)"""
    return time_monitor.get_uptime()

def clear_server_cache():
    """Limpa o cache do servidor (para APIs)"""
    return time_monitor.force_clear_cache()

def handle_reload_cache():
    """Função para ser chamada quando uma página é recarregada"""
    return time_monitor.check_and_clear_cache_on_reload()