"""
Configurações do Servidor - Versão Cliente
"""

# Variáveis globais
servidor_rodando = True

# Configurações do servidor
SERVER_TIMEOUT = 1
DEFAULT_PORT = 8000
MAX_PORT_ATTEMPTS = 10

# Configurações de monitoramento (OTIMIZADAS)
MONITOR_MAX_ATTEMPTS = 12    # 1 minuto total
MONITOR_CHECK_INTERVAL = 5   # 5 segundos entre verificações
MONITOR_START_DELAY = 8      # 8 segundos para estabilização

# Mensagens profissionais
MESSAGES = {
    'server_start': "🚀 INICIANDO SISTEMA",
    'server_running': "🎉 SISTEMA OPERACIONAL", 
    'server_stop': "⏹️  ENCERRANDO SISTEMA",
    'browser_open': "🌐 INICIANDO APLICAÇÃO",
    'monitor_active': "🔍 MONITORAMENTO ATIVO",
}