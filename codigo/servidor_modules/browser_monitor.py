"""
Monitoramento do navegador - Versão SIMPLIFICADA
Apenas para compatibilidade, sem verificações de atividade
"""

import time
from servidor_modules import config

def monitorar_navegador(port, httpd):
    """
    Monitoramento SIMPLIFICADO - sem verificações de porta
    Mantido apenas para compatibilidade com o código existente
    """
    print("🔍 MONITOR: Sistema de monitoramento INICIADO")
    print("   • Encerramento automático DESATIVADO")
    print("   • Servidor permanecerá aberto até encerramento manual")
    print("   • Use o botão 'Encerrar Servidor' na interface web")
    print("   • Ou pressione Ctrl+C neste terminal\n")
    
    # Loop simples que apenas mantém a thread ativa
    while config.servidor_rodando:
        try:
            time.sleep(10)  # Verificação a cada 10 segundos (apenas para manter a thread)
        except KeyboardInterrupt:
            print("\nMONITOR: Interrupção recebida")
            config.servidor_rodando = False
            break
        except Exception as e:
            print(f"MONITOR: Erro inesperado: {e}")
            time.sleep(10)
    
    print("MONITOR: Thread finalizada")