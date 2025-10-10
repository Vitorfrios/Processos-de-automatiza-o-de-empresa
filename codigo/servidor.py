#!/usr/bin/env python3
"""
Servidor Python Modularizado com Encerramento Automático
Arquivo principal - apenas orquestração
"""

import signal
import sys
from servidor_modules import server_utils, http_handler, browser_monitor

def main():
    """Função principal - limpa e organizada"""
    print("🚀 SERVIDOR MODULARIZADO INICIANDO...")
    print("=" * 60)
    
    # Configura handlers de sinal
    server_utils.setup_signal_handlers()
    
    # Encontra porta disponível
    port = server_utils.setup_port(8000)
    if not port:
        print("❌ Não foi possível encontrar porta disponível!")
        input("Pressione Enter para sair...")
        return
    
    # Inicia servidor
    try:
        with server_utils.create_server(port, http_handler.UniversalHTTPRequestHandler) as httpd:
            # Mostra informações do servidor
            server_utils.print_server_info(port)
            
            # Inicia threads (navegador e monitoramento)
            server_utils.start_server_threads(port, httpd, browser_monitor.monitorar_navegador)
            
            # Loop principal simplificado
            server_utils.run_server_loop(httpd)
            
    except KeyboardInterrupt:
        print("\n⏹️  Servidor interrompido pelo usuário (Ctrl+C)")
    except Exception as e:
        print(f"❌ ERRO CRÍTICO: {e}")
        print("💡 Tente reiniciar o servidor")
    finally:
        print("✅ Servidor finalizado com sucesso!")

if __name__ == "__main__":
    main()