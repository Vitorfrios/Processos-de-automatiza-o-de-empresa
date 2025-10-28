"""
config.py
Configurações do Servidor 
Configurações globais e constantes do sistema de climatização
"""

# Variáveis globais de estado do servidor
servidor_rodando = True
ultimo_heartbeat = None  

# Configurações do servidor
SERVER_TIMEOUT = 1  # 1 segundo - permite verificação periódica de sinais
DEFAULT_PORT = 8000
MAX_PORT_ATTEMPTS = 15  # Número máximo de tentativas para encontrar porta disponível

# # Configurações de monitoramento comentei para caso de precisar 
# MONITOR_MAX_ATTEMPTS = 3      # Tentativas antes de encerrar
# MONITOR_CHECK_INTERVAL = 5    # Verifica a cada 5 segundos
# MONITOR_START_DELAY = 5       # Espera 5 segundos antes de começar a monitorar
# HEARTBEAT_TIMEOUT = 30        # Timeout de heartbeat em segundos

# Mensagens do sistema
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
# MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10MB tamanho máximo para requests
ALLOWED_ORIGINS = ["http://localhost", "http://127.0.0.1"]  # Origens permitidas para CORS