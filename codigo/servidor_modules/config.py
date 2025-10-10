"""
Configurações e constantes do servidor
"""

# Variáveis globais
servidor_rodando = True

# Configurações do servidor
SERVER_TIMEOUT = 1
DEFAULT_PORT = 8000
MAX_PORT_ATTEMPTS = 10

# Configurações do monitoramento
MONITOR_MAX_ATTEMPTS = 5
MONITOR_CHECK_INTERVAL = 5
MONITOR_START_DELAY = 5

# Mensagens do sistema
MESSAGES = {
    'server_start': "🚀 SERVIDOR INICIADO",
    'server_running': "🎉 SERVIDOR RODANDO COM SUCESSO!",
    'server_stop': "⏹️  ENCERRANDO SERVIDOR...",
    'browser_open': "🌐 Abrindo navegador...",
    'monitor_active': "🔍 Monitoramento ativo",
}