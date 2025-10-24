#!/usr/bin/env python3
"""
Sistema de Climatização - Servidor Principal
Versão com Diagnóstico Completo
"""

import os
import sys
import time
import traceback

# Adiciona o diretório atual ao path para garantir imports
diretorio_atual = os.path.dirname(os.path.abspath(__file__))
if diretorio_atual not in sys.path:
    sys.path.insert(0, diretorio_atual)

print("=" * 60)
print("SISTEMA DE CLIMATIZAÇÃO - INICIANDO DIAGNÓSTICO")
print("=" * 60)

def diagnostico_completo():
    """Faz diagnóstico completo do sistema"""
    print("\n1. VERIFICANDO DIRETÓRIOS...")
    print(f"   Diretório atual: {diretorio_atual}")
    print(f"   Pasta json: {os.path.exists(os.path.join(diretorio_atual, 'json'))}")
    print(f"   Pasta servidor_modules: {os.path.exists(os.path.join(diretorio_atual, 'servidor_modules'))}")
    
    print("\n2. VERIFICANDO ARQUIVOS...")
    arquivos = [
        'servidor.py',
        'servidor_modules/__init__.py',
        'servidor_modules/config.py', 
        'servidor_modules/server_utils.py',
        'servidor_modules/http_handler.py',
        'servidor_modules/routes.py',
        'servidor_modules/sessions_manager.py',
        'servidor_modules/file_utils.py',
        'servidor_modules/browser_monitor.py',
        'json/backup.json',
        'json/dados.json',
        'json/sessions.json'
    ]
    
    for arquivo in arquivos:
        caminho = os.path.join(diretorio_atual, arquivo)
        existe = os.path.exists(caminho)
        status = "✅" if existe else "❌"
        print(f"   {status} {arquivo}: {existe}")
    
    print("\n3. VERIFICANDO IMPORTAÇÕES...")

# Executa diagnóstico primeiro
diagnostico_completo()

# Agora tenta importar os módulos
try:
    print("\n4. IMPORTANDO MÓDULOS...")
    from servidor_modules import server_utils, http_handler, browser_monitor, sessions_manager
    from servidor_modules import config
    print("   ✅ Módulos importados com sucesso!")
    
except ImportError as e:
    print(f"   ❌ ERRO DE IMPORTAÇÃO: {e}")
    print(f"   TRACEBACK:")
    traceback.print_exc()
    input("\nPressione Enter para sair...")
    sys.exit(1)

except Exception as e:
    print(f"   ❌ ERRO INESPERADO: {e}")
    print(f"   TRACEBACK:")
    traceback.print_exc()
    input("\nPressione Enter para sair...")
    sys.exit(1)

def main():
    """Função principal com tratamento robusto de erros"""
    try:
        print("\n5. INICIANDO SERVIDOR...")
        
        # Configuração
        print("   Configurando handlers de sinal...")
        server_utils.setup_signal_handlers()
        
        # Configura porta
        print("   Configurando porta...")
        port = server_utils.setup_port(8000)
        if not port:
            print("   ❌ Não foi possível configurar porta")
            input("Pressione Enter para sair...")
            return
        
        print(f"   ✅ Porta {port} configurada")
        
        # Inicialização do servidor
        print("   Criando servidor...")
        with server_utils.create_server(port, http_handler.UniversalHTTPRequestHandler) as httpd:
            # Informações do sistema
            server_utils.print_server_info(port)
            
            # Inicialização das threads
            print("   Iniciando threads...")
            server_utils.start_server_threads(port, httpd, browser_monitor.monitorar_navegador)
            
            print("   ✅ SERVIDOR INICIADO COM SUCESSO!")
            print("   🟢 SISTEMA OPERACIONAL")
            
            # Loop principal
            server_utils.run_server_loop(httpd)
            
    except KeyboardInterrupt:
        print("\n   ⏹️  Encerramento solicitado pelo usuário")
    except Exception as e:
        print(f"\n   ❌ ERRO CRÍTICO: {e}")
        print("   TRACEBACK COMPLETO:")
        traceback.print_exc()
        print("\n   O sistema será reiniciado em 10 segundos...")
        time.sleep(10)
        main()  # Reinicia automaticamente
    finally:
        print("\n   ✅ Sistema finalizado!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERRO FATAL: {e}")
        traceback.print_exc()
    
    input("\nPressione Enter para fechar...")