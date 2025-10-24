"""
Configurações do Servidor - Versão ESTÁVEL para Cliente
"""

# Variáveis globais
servidor_rodando = True
ultimo_heartbeat = None  

# Configurações do servidor - CORRIGIDO
SERVER_TIMEOUT = 1  # 1 segundo - permite verificação periódica de sinais
DEFAULT_PORT = 8000
MAX_PORT_ATTEMPTS = 15  # Aumentado para mais tentativas

# Configurações de monitoramento - CORRIGIDO
MONITOR_MAX_ATTEMPTS = 3      # Tentativas antes de encerrar
MONITOR_CHECK_INTERVAL = 5    # Verifica a cada 5 segundos (reduzido)
MONITOR_START_DELAY = 5       # Espera 5 segundos antes de começar a monitorar
HEARTBEAT_TIMEOUT = 30        # Timeout de heartbeat (segundos)

# Mensagens - CORRIGIDO encoding
MESSAGES = {
    'server_start': "INICIANDO SISTEMA DE CLIMATIZACAO",
    'server_running': "SISTEMA OPERACIONAL", 
    'server_stop': "ENCERRANDO SISTEMA",
    'browser_open': "APLICACAO ABERTA NO NAVEGADOR",
    'monitor_active': "MONITORANDO NAVEGADOR",
    'browser_closed': "Navegador fechado - encerrando servidor",
    'port_available': "Porta configurada com sucesso",
    'port_busy': "Porta ocupada, tentando alternativas",
    'shutdown_signal': "Sinal de encerramento recebido",
}

# Configurações de segurança
MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10MB max para requests
ALLOWED_ORIGINS = ["http://localhost", "http://127.0.0.1"]