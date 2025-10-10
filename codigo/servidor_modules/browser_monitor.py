"""
Monitoramento do navegador e encerramento automático
"""

import socket
import time
from servidor_modules import config, server_utils

def monitorar_navegador(port, httpd):
    """Monitora se o navegador foi fechado - VERSÃO SIMPLIFICADA"""
    print(f"🔍 {config.MESSAGES['monitor_active']}: servidor ficará aberto até você fechar o navegador")
    
    # Aguarda um pouco antes de começar a monitorar
    time.sleep(config.MONITOR_START_DELAY)
    
    tentativas_falhas = 0
    
    while config.servidor_rodando:
        try:
            # Tenta conectar ao servidor
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(config.MONITOR_CHECK_INTERVAL)
                resultado = s.connect_ex(('localhost', port))
                
                if resultado == 0:
                    # Servidor está respondendo - navegador provavelmente aberto
                    tentativas_falhas = 0
                else:
                    # Não conseguiu conectar
                    tentativas_falhas += 1
                    print(f"⚠️  Tentativa {tentativas_falhas}/{config.MONITOR_MAX_ATTEMPTS} - Servidor não respondeu")
                
                if tentativas_falhas >= config.MONITOR_MAX_ATTEMPTS:
                    print("\n🌐 NAVEGADOR FECHADO DETECTADO")
                    print("⏹️  Encerrando servidor automaticamente...")
                    break
            
            # Verifica no intervalo configurado
            time.sleep(config.MONITOR_CHECK_INTERVAL)
            
        except Exception as e:
            print(f"❌ Erro no monitor: {e}")
            break
    
    if config.servidor_rodando:
        print("💾 Encerrando servidor...")
        server_utils.shutdown_server_async(httpd)