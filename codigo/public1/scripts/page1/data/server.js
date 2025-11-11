// server.js - ARQUIVO PRINCIPAL ORQUESTRADOR

// Importar módulos
import { 
    isSessionActive, 
    setSessionActive, 
    getSessionObras, 
    addObraToSession,
    removeObraFromSessionLocal,
    clearSessionObras,
    clearRenderedObras,
    initializeGeralCount,
    incrementGeralCount,
    decrementGeralCount,
    getGeralCount,
    saveFirstObraIdOfSession,
    addObraToRemovedList,
    getRemovedObrasList,
    isObraRemoved,
    resetDisplayLogic,
    startNewSession,
    startSessionOnFirstSave
} from './adapters/session-adapter.js';

import { 
    loadObrasFromServer,
    removeBaseObraFromHTML
} from './adapters/obra-adapter.js';

import { 
    shutdownManual,
    ensureSingleActiveSession,
    initializeSession
} from './adapters/shutdown-adapter.js';

// Re-exportar todas as funções
export {
    // Session Manager
    isSessionActive,
    setSessionActive,
    getSessionObras,
    addObraToSession,
    removeObraFromSessionLocal,
    clearSessionObras,
    clearRenderedObras,
    initializeGeralCount,
    incrementGeralCount,
    decrementGeralCount,
    getGeralCount,
    saveFirstObraIdOfSession,
    addObraToRemovedList,
    getRemovedObrasList,
    isObraRemoved,
    resetDisplayLogic,
    startNewSession,
    startSessionOnFirstSave,
    
    // Obra Loader
    loadObrasFromServer,
    removeBaseObraFromHTML,
    
    // Shutdown Manager
    shutdownManual,
    ensureSingleActiveSession,
    initializeSession
};

// Inicialização
initializeGeralCount();