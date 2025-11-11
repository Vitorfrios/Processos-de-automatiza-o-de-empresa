/**
 * core/app.js
 * Ponto único de entrada do sistema - FUSÃO: bootstrap.js + event-bus.js + state.js
 * Sistema de inicialização, eventos e estado global unificados
 */

// =============================================================================
// SISTEMA DE EVENTOS (PUB/SUB) - De event-bus.js
// =============================================================================

class EventBus {
    constructor() {
        this.listeners = {};
    }
    
    /**
     * Registra um listener para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser executada
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    /**
     * Remove um listener de um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser removida
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * Dispara um evento para todos os listeners
     * @param {string} event - Nome do evento
     * @param {any} data - Dados a serem passados
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Erro no listener do evento ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Remove todos os listeners de um evento
     * @param {string} event - Nome do evento
     */
    clear(event) {
        if (event) {
            delete this.listeners[event];
        } else {
            this.listeners = {};
        }
    }
}

// Instância global do EventBus
export const eventBus = new EventBus();

// =============================================================================
// SISTEMA DE ESTADO GLOBAL - De state.js
// =============================================================================

class ApplicationState {
    constructor() {
        this.obras = [];
        this.projetos = [];
        this.salas = [];
        this.currentObra = null;
        this.currentProject = null;
        this.currentRoom = null;
        this.sessionActive = false;
        this.systemConstants = null;
    }
    
    /**
     * Define a lista de obras
     * @param {Array} obras - Lista de obras
     */
    setObras(obras) {
        this.obras = obras;
        eventBus.emit('state:obras-changed', obras);
    }
    
    /**
     * Define a lista de projetos
     * @param {Array} projetos - Lista de projetos
     */
    setProjetos(projetos) {
        this.projetos = projetos;
        eventBus.emit('state:projetos-changed', projetos);
    }
    
    /**
     * Define a lista de salas
     * @param {Array} salas - Lista de salas
     */
    setSalas(salas) {
        this.salas = salas;
        eventBus.emit('state:salas-changed', salas);
    }
    
    /**
     * Define a obra atual
     * @param {Object} obra - Obra atual
     */
    setCurrentObra(obra) {
        this.currentObra = obra;
        eventBus.emit('state:current-obra-changed', obra);
    }
    
    /**
     * Define o projeto atual
     * @param {Object} project - Projeto atual
     */
    setCurrentProject(project) {
        this.currentProject = project;
        eventBus.emit('state:current-project-changed', project);
    }
    
    /**
     * Define a sala atual
     * @param {Object} room - Sala atual
     */
    setCurrentRoom(room) {
        this.currentRoom = room;
        eventBus.emit('state:current-room-changed', room);
    }
    
    /**
     * Define o estado da sessão
     * @param {boolean} active - Sessão ativa
     */
    setSessionActive(active) {
        this.sessionActive = active;
        eventBus.emit('state:session-changed', active);
    }
    
    /**
     * Define as constantes do sistema
     * @param {Object} constants - Constantes do sistema
     */
    setSystemConstants(constants) {
        this.systemConstants = constants;
        eventBus.emit('state:constants-loaded', constants);
    }
    
    /**
     * Obtém uma constante do sistema
     * @param {string} key - Chave da constante
     * @returns {any} Valor da constante
     */
    getConstant(key) {
        return this.systemConstants?.[key];
    }
    
    /**
     * Limpa todo o estado
     */
    clear() {
        this.obras = [];
        this.projetos = [];
        this.salas = [];
        this.currentObra = null;
        this.currentProject = null;
        this.currentRoom = null;
        this.sessionActive = false;
        eventBus.emit('state:cleared');
    }
}

// Instância global do Estado
export const appState = new ApplicationState();

// =============================================================================
// SISTEMA DE INICIALIZAÇÃO - De bootstrap.js
// =============================================================================

/**
 * Inicializa o sistema de eventos
 */
function initializeEventBus() {
    window.eventBus = eventBus;
    console.log('✅ Event Bus inicializado');
}

/**
 * Inicializa o sistema de estado
 */
function initializeState() {
    window.appState = appState;
    console.log('✅ State inicializado');
}

/**
 * Inicializa a interface do usuário
 */
function initializeInterface() {
    // Importação dinâmica para evitar circular dependencies
    import('../ui/interface.js')
        .then(module => {
            if (module.initializeInterface) {
                module.initializeInterface();
            } else {
                console.warn('⚠️ initializeInterface não encontrado em interface.js');
            }
        })
        .catch(error => {
            console.error('❌ Erro ao inicializar interface:', error);
        });
}

/**
 * Inicializa sistemas core da aplicação
 */
function initializeCoreSystems() {
    console.log('🚀 Inicializando sistemas core...');
    
    try {
        // 1. Inicializa Event Bus
        initializeEventBus();
        
        // 2. Inicializa State
        initializeState();
        
        // 3. Inicializa Interface (assíncrona)
        initializeInterface();
        
        console.log('✅ Sistemas core inicializados com sucesso');
        
        // Dispara evento de inicialização completa
        eventBus.emit('app:core-ready');
        
    } catch (error) {
        console.error('❌ Erro na inicialização dos sistemas core:', error);
        eventBus.emit('app:core-error', error);
    }
}

/**
 * Bootstrap principal da aplicação
 * Ponto único de entrada - substitui main.js
 */
export function bootstrapApplication() {
    console.log('🎯 Bootstrap da aplicação iniciado...');
    
    // Verifica se já está inicializado
    if (window.appInitialized) {
        console.log('⚠️ Aplicação já inicializada');
        return;
    }
    
    // Inicializa sistemas core
    initializeCoreSystems();
    
    // Marca como inicializado
    window.appInitialized = true;
    
    console.log('✅ Aplicação bootstrap completa');
}

/**
 * Reinicializa a aplicação
 */
export function reinitializeApplication() {
    console.log('🔄 Reinicializando aplicação...');
    
    // Limpa estado
    appState.clear();
    eventBus.clear();
    
    // Remove flag
    window.appInitialized = false;
    
    // Reinicializa
    bootstrapApplication();
}

/**
 * Verifica o status da aplicação
 */
export function getAppStatus() {
    return {
        initialized: !!window.appInitialized,
        eventBus: Object.keys(eventBus.listeners).length,
        state: {
            obras: appState.obras.length,
            projetos: appState.projetos.length,
            salas: appState.salas.length,
            sessionActive: appState.sessionActive
        }
    };
}

// =============================================================================
// INICIALIZAÇÃO AUTOMÁTICA
// =============================================================================

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApplication);
} else {
    // DOM já está pronto, inicializa imediatamente
    setTimeout(bootstrapApplication, 0);
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

export {
    // Event Bus
    EventBus,
    
    // Application State
    ApplicationState,
    
    // Initialization functions
    initializeEventBus,
    initializeState,
    initializeCoreSystems,
    reinitializeApplication,
    getAppStatus
};

// Disponibilização global para compatibilidade
if (typeof window !== 'undefined') {
    window.bootstrapApplication = bootstrapApplication;
    window.reinitializeApplication = reinitializeApplication;
    window.getAppStatus = getAppStatus;
}