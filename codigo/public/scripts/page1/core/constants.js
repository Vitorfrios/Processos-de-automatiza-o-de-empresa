/**
 * core/constants.js
 * Constantes globais do sistema - FUSÃO: config.js + constantes adicionais
 * Centraliza todas as constantes para fácil manutenção
 */

// =============================================================================
// CONSTANTES DE CÁLCULO (De config.js)
// =============================================================================

/**
 * Constantes para cálculos de engenharia e climatização
 */
export const CALCULATION_CONSTANTS = {
    // Cálculos de vazão de ar
    FLOW_COEFFICIENT: 0.827,
    SECONDS_PER_HOUR: 3600,
    FLOW_DIVISOR: 3.6,
    SAFETY_FACTOR: 1.25,
    PRESSURE_EXPONENT: 0.5,
    
    // Cálculos de ganhos térmicos
    DENSIDADE_AR: 1.2, // kg/m³
    CALOR_ESPECIFICO_AR: 1.006, // kJ/kg·K
    FATOR_CONVERSAO_TR: 3.5169, // kW para TR
    FATOR_CONVERSAO_WATT: 1000, // kW para W
    
    // Fatores de segurança
    FATOR_SEGURANCA_MINIMO: 1.1,
    FATOR_SEGURANCA_PADRAO: 1.25,
    FATOR_SEGURANCA_MAXIMO: 1.5,
    
    // Tolerâncias
    TOLERANCIA_TEMPERATURA: 0.5, // °C
    TOLERANCIA_CARGA_TERMICA: 0.01, // kW
    TOLERANCIA_VAZAO_AR: 1, // l/s
};

// =============================================================================
// CONSTANTES DE INTERFACE (De config.js)
// =============================================================================

/**
 * Constantes para interface do usuário e UX
 */
export const UI_CONSTANTS = {
    // Símbolos de toggle
    MINIMIZED_SYMBOL: "+",
    EXPANDED_SYMBOL: "−",
    
    // Durações e timeouts
    SUCCESS_MESSAGE_DURATION: 5000,
    ERROR_MESSAGE_DURATION: 8000,
    LOADING_TIMEOUT: 10000,
    DEBOUNCE_DELAY: 300,
    
    // Classes CSS
    COLLAPSED_CLASS: "collapsed",
    HIDDEN_CLASS: "hidden",
    LOADING_CLASS: "loading",
    ERROR_CLASS: "error",
    SUCCESS_CLASS: "success",
    
    // Estados visuais
    DEFAULT_OPACITY: 1,
    DISABLED_OPACITY: 0.6,
    HOVER_OPACITY: 0.8,
    
    // Animações
    TRANSITION_DURATION: "0.3s",
    TRANSITION_TIMING: "ease-in-out",
    
    // Breakpoints responsivos
    BREAKPOINT_MOBILE: 768,
    BREAKPOINT_TABLET: 1024,
    BREAKPOINT_DESKTOP: 1200,
};

// =============================================================================
// CONSTANTES DE SESSÃO E ARMAZENAMENTO (De config.js)
// =============================================================================

/**
 * Chaves para localStorage e gerenciamento de sessão
 */
export const STORAGE_KEYS = {
    // Sessão atual
    SESSION_ACTIVE: 'session_active',
    SESSION_STORAGE_KEY: "firstProjectIdOfSession",
    REMOVED_PROJECTS_KEY: "removedProjectsFromScreen",
    NORMALIZATION_DONE_KEY: "idsNormalizedOnServer",
    
    // Cache de dados
    MACHINES_DATA_CACHE: 'machines_data_cache',
    SYSTEM_CONSTANTS_CACHE: 'system_constants_cache',
    USER_PREFERENCES: 'user_preferences',
    
    // Estado da aplicação
    APP_STATE_BACKUP: 'app_state_backup',
    LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',
    OFFLINE_DATA_QUEUE: 'offline_data_queue',
};

// =============================================================================
// CONSTANTES DE VALIDAÇÃO
// =============================================================================

/**
 * Regras de validação para dados de entrada
 */
export const VALIDATION_CONSTANTS = {
    // Comprimentos máximos
    MAX_OBRA_NAME_LENGTH: 100,
    MAX_PROJECT_NAME_LENGTH: 80,
    MAX_ROOM_NAME_LENGTH: 60,
    MAX_MACHINE_NAME_LENGTH: 50,
    
    // Valores numéricos
    MIN_ROOM_AREA: 1, // m²
    MAX_ROOM_AREA: 1000, // m²
    MIN_TEMPERATURE: -50, // °C
    MAX_TEMPERATURE: 100, // °C
    MIN_PRESSURE: 0, // Pa
    MAX_PRESSURE: 5000, // Pa
    
    // Padrões de regex
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_PATTERN: /^[\d\s\-\+\(\)]+$/,
    NUMERIC_PATTERN: /^-?\d*\.?\d+$/,
    ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
};

// =============================================================================
// CONSTANTES DE API E COMUNICAÇÃO
// =============================================================================

/**
 * Configurações de API e endpoints
 */
export const API_CONSTANTS = {
    // Base URLs
    BASE_URL: window.location.origin,
    API_VERSION: 'v1',
    
    // Endpoints principais
    ENDPOINTS: {
        OBRAS: '/obras',
        MACHINES: '/machines',
        SESSIONS: '/api/sessions',
        BACKUP: '/api/backup-completo',
        SYSTEM_CONSTANTS: '/api/system-constants',
    },
    
    // Timeouts
    REQUEST_TIMEOUT: 30000,
    UPLOAD_TIMEOUT: 60000,
    
    // Headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    
    // Status codes
    SUCCESS_CODES: [200, 201, 204],
    CLIENT_ERROR_CODES: [400, 401, 403, 404],
    SERVER_ERROR_CODES: [500, 502, 503],
};

// =============================================================================
// CONSTANTES DE MENSAGENS E NOTIFICAÇÕES
// =============================================================================

/**
 * Mensagens padronizadas para o usuário
 */
export const MESSAGE_CONSTANTS = {
    // Sucesso
    SUCCESS: {
        OBRA_SAVED: "Obra salva com sucesso!",
        OBRA_UPDATED: "Obra atualizada com sucesso!",
        OBRA_DELETED: "Obra removida com sucesso!",
        PROJECT_ADDED: "Projeto adicionado com sucesso!",
        ROOM_ADDED: "Sala adicionada com sucesso!",
        DATA_SYNCED: "Dados sincronizados com sucesso!",
    },
    
    // Erros
    ERROR: {
        OBRA_NOT_FOUND: "Obra não encontrada.",
        PROJECT_NOT_FOUND: "Projeto não encontrado.",
        ROOM_NOT_FOUND: "Sala não encontrada.",
        SAVE_FAILED: "Erro ao salvar dados.",
        LOAD_FAILED: "Erro ao carregar dados.",
        NETWORK_ERROR: "Erro de conexão. Verifique sua internet.",
        SERVER_ERROR: "Erro no servidor. Tente novamente.",
        VALIDATION_ERROR: "Dados inválidos. Verifique os campos.",
    },
    
    // Avisos
    WARNING: {
        UNSAVED_CHANGES: "Há alterações não salvas.",
        SESSION_EXPIRED: "Sessão expirada.",
        OFFLINE_MODE: "Modo offline ativado.",
    },
    
    // Informações
    INFO: {
        LOADING: "Carregando...",
        SAVING: "Salvando...",
        SYNCING: "Sincronizando...",
        PROCESSING: "Processando...",
    },
};

// =============================================================================
// CONSTANTES DE PERFORMANCE
// =============================================================================

/**
 * Configurações de performance e otimização
 */
export const PERFORMANCE_CONSTANTS = {
    // Debounce delays
    INPUT_DEBOUNCE: 300,
    RESIZE_DEBOUNCE: 250,
    SCROLL_DEBOUNCE: 100,
    
    // Cache durations (ms)
    CACHE_DURATION_SHORT: 5 * 60 * 1000, // 5 minutos
    CACHE_DURATION_MEDIUM: 30 * 60 * 1000, // 30 minutos
    CACHE_DURATION_LONG: 24 * 60 * 60 * 1000, // 24 horas
    
    // Batch processing
    BATCH_SIZE_SMALL: 10,
    BATCH_SIZE_MEDIUM: 50,
    BATCH_SIZE_LARGE: 100,
    
    // Memory limits
    MAX_LOCAL_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_CACHE_ITEMS: 1000,
};

// =============================================================================
// EXPORTAÇÕES DE COMPATIBILIDADE (Para migração gradual)
// =============================================================================

// Exportações individuais para compatibilidade com imports antigos
export const SESSION_ACTIVE_KEY = STORAGE_KEYS.SESSION_ACTIVE;
export const SESSION_STORAGE_KEY = STORAGE_KEYS.SESSION_STORAGE_KEY;
export const REMOVED_PROJECTS_KEY = STORAGE_KEYS.REMOVED_PROJECTS_KEY;
export const NORMALIZATION_DONE_KEY = STORAGE_KEYS.NORMALIZATION_DONE_KEY;

// =============================================================================
// UTILITÁRIOS DE CONSTANTES
// =============================================================================

/**
 * Obtém todas as constantes como objeto plano
 * @returns {Object} Todas as constantes
 */
export function getAllConstants() {
    return {
        CALCULATION_CONSTANTS,
        UI_CONSTANTS,
        STORAGE_KEYS,
        VALIDATION_CONSTANTS,
        API_CONSTANTS,
        MESSAGE_CONSTANTS,
        PERFORMANCE_CONSTANTS,
    };
}

/**
 * Valida se uma constante existe
 * @param {string} category - Categoria da constante
 * @param {string} key - Chave da constante
 * @returns {boolean} True se existe
 */
export function hasConstant(category, key) {
    const constantsMap = {
        calculation: CALCULATION_CONSTANTS,
        ui: UI_CONSTANTS,
        storage: STORAGE_KEYS,
        validation: VALIDATION_CONSTANTS,
        api: API_CONSTANTS,
        message: MESSAGE_CONSTANTS,
        performance: PERFORMANCE_CONSTANTS,
    };
    
    return constantsMap[category]?.[key] !== undefined;
}

/**
 * Obtém uma constante de forma segura
 * @param {string} category - Categoria da constante
 * @param {string} key - Chave da constante
 * @param {any} defaultValue - Valor padrão se não encontrado
 * @returns {any} Valor da constante
 */
export function getConstant(category, key, defaultValue = null) {
    const constantsMap = {
        calculation: CALCULATION_CONSTANTS,
        ui: UI_CONSTANTS,
        storage: STORAGE_KEYS,
        validation: VALIDATION_CONSTANTS,
        api: API_CONSTANTS,
        message: MESSAGE_CONSTANTS,
        performance: PERFORMANCE_CONSTANTS,
    };
    
    return constantsMap[category]?.[key] ?? defaultValue;
}

// Disponibilização global para compatibilidade
if (typeof window !== 'undefined') {
    window.APP_CONSTANTS = getAllConstants();
    window.getAppConstant = getConstant;
}