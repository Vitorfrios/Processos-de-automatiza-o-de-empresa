#!/usr/bin/env python3
"""
Sistema de Climatização - Servidor Principal
Versão Cliente: Estável e Profissional
"""

import signal
import sys
from servidor_modules import server_utils, http_handler, browser_monitor

def main():
    """Função principal - Robusta e profissional"""
    print("🚀 INICIANDO SISTEMA DE CLIMATIZAÇÃO")
    print("=" * 55)
    
    # Configuração profissional
    server_utils.setup_signal_handlers()
    
    # Configura porta
    port = server_utils.setup_port(8000)
    if not port:
        print("❌ Não foi possível inicializar o sistema")
        print("💡 Verifique se as portas 8000-8010 estão disponíveis")
        input("Pressione Enter para sair...")
        return
    
    # Inicialização do servidor
    try:
        with server_utils.create_server(port, http_handler.UniversalHTTPRequestHandler) as httpd:
            # Informações do sistema
            server_utils.print_server_info(port)
            
            # Inicialização das threads
            server_utils.start_server_threads(port, httpd, browser_monitor.monitorar_navegador)
            
            # Loop principal
            server_utils.run_server_loop(httpd)
            
    except KeyboardInterrupt:
        print("\n⏹️  Encerramento solicitado pelo usuário")
    except Exception as e:
        print(f"❌ ERRO: {e}")
        print("🔧 O sistema será reiniciado automaticamente")
    finally:
        print("✅ Sistema finalizado com sucesso!")
        print("👋 Até logo!")

if __name__ == "__main__":
    main()