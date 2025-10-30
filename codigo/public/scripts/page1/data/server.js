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
} from './server-modules/session-manager.js';

import { 
    loadObrasFromServer,
    removeBaseObraFromHTML
} from './server-modules/obra-loader.js';

import { 
    shutdownManual,
    ensureSingleActiveSession,
    initializeSession
} from './server-modules/shutdown-manager.js';

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