"""
Configurações do Servidor - Versão Cliente OTIMIZADA
"""

# Variáveis globais
servidor_rodando = True
ultimo_heartbeat = None  

# Configurações do servidor
SERVER_TIMEOUT = 1
DEFAULT_PORT = 8000
MAX_PORT_ATTEMPTS = 10

# Configurações de monitoramento 
MONITOR_MAX_ATTEMPTS = 6    
MONITOR_CHECK_INTERVAL = 5  
MONITOR_START_DELAY = 3     
HEARTBEAT_TIMEOUT = 15      

# Mensagens 
MESSAGES = {
    'server_start': "🚀 INICIANDO SISTEMA",
    'server_running': "🎉 SISTEMA OPERACIONAL", 
    'server_stop': "⏹️  ENCERRANDO SISTEMA",
    'browser_open': "🌐 INICIANDO APLICAÇÃO",
    'monitor_active': "🔍 MONITORAMENTO ATIVO",
    'heartbeat_received': "💓 Heartbeat recebido",  
    'client_timeout': "⏰ Cliente inativo - encerrando",  
}