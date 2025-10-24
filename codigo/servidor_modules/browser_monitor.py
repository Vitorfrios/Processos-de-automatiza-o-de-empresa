"""
Monitoramento do navegador - Versão SEM psutil
"""

import time
import threading
import socket
from servidor_modules import config, server_utils

def is_browser_connected(port):
    """
    Verifica se há navegadores conectados - Método ALTERNATIVO sem psutil
    Verifica se a porta do servidor ainda está aceitando conexões
    """
    try:
        # Tenta conectar à porta do servidor
        # Se conseguir conectar, o servidor está ativo e provavelmente há navegadores conectados
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('localhost', port))
            # Se consegue conectar (result == 0), o servidor está ativo
            return result == 0
            
    except Exception as e:
        print(f"AVISO no monitor de porta: {e}")
        return True  # Por segurança, assume que está conectado

def monitorar_navegador(port, httpd):
    """
    Monitoramento por atividade de porta - SEM psutil
    """
    print("MONITORAMENTO ATIVO - MODO PORTA")
    print("   • Servidor monitora atividade na porta")
    print("   • Fechamento apos inatividade prolongada")
    print("   • Pressione Ctrl+C para encerrar manualmente\n")
    
    # Aguarda o servidor estabilizar
    time.sleep(config.MONITOR_START_DELAY)
    print("Sistema de monitoramento por porta inicializado")
    
    tentativas_sem_atividade = 0
    max_tentativas = config.MONITOR_MAX_ATTEMPTS
    
    while config.servidor_rodando:
        try:
            # Verifica atividade na porta
            porta_ativa = is_browser_connected(port)
            
            if porta_ativa:
                tentativas_sem_atividade = 0  # Reset do contador
            else:
                tentativas_sem_atividade += 1
                print(f"Porta inativa ({tentativas_sem_atividade}/{max_tentativas})")
                
                if tentativas_sem_atividade >= max_tentativas:
                    print("PORTA INATIVA - Encerrando servidor...")
                    config.servidor_rodando = False
                    break
            
            # Verificação no intervalo configurado
            time.sleep(config.MONITOR_CHECK_INTERVAL)
            
        except KeyboardInterrupt:
            print("\nInterrupcao recebida no monitor")
            config.servidor_rodando = False
            break
        except Exception as e:
            print(f"Erro no monitor de porta: {e}")
            time.sleep(config.MONITOR_CHECK_INTERVAL)
    
    # Encerramento
    print("Finalizando servidor por inatividade...")
    
    def shutdown_rapido():
        print("Finalizando conexoes...")
        try:
            httpd.shutdown()
            httpd.server_close()
            print("Servidor finalizado com sucesso")
        except Exception as e:
            print(f"Aviso no encerramento: {e}")
    
    shutdown_thread = threading.Thread(target=shutdown_rapido, daemon=True)
    shutdown_thread.start()
    shutdown_thread.join(timeout=3.0)
    
    # Força a saída se necessário
    if shutdown_thread.is_alive():
        print("Timeout no encerramento - finalizando...")
        try:
            httpd.server_close()
        except:
            pass