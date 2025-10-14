"""
Configurações do Servidor - Versão SEM TIMEOUT
"""

# Variáveis globais
servidor_rodando = True
ultimo_heartbeat = None  

# Configurações do servidor
SERVER_TIMEOUT = None  # Sem timeout - servidor fica ativo indefinidamente
DEFAULT_PORT = 8000
MAX_PORT_ATTEMPTS = 10

# Configurações de monitoramento
MONITOR_MAX_ATTEMPTS = None    
MONITOR_CHECK_INTERVAL = 10    
MONITOR_START_DELAY = 3        
HEARTBEAT_TIMEOUT = None       

# Mensagens 
MESSAGES = {
    'server_start': "🚀 INICIANDO SISTEMA",
    'server_running': "🎉 SISTEMA OPERACIONAL", 
    'server_stop': "⏹️  ENCERRANDO SISTEMA",
    'browser_open': "🌐 APLICAÇÃO ABERTA NO NAVEGADOR",
    'monitor_active': "🔍 MONITORANDO NAVEGADOR",
    'browser_closed': "📱 Navegador fechado - encerrando servidor",  
}