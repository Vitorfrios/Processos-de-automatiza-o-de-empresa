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
ALLOWED_ORIGINS = ["http://localhost", "http://127.0.0.1"]  # Origens permitidas para CORS