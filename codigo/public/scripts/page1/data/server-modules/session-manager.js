// server-modules/session-manager.js - GERENCIAMENTO DE SESSÃO

import { SESSION_STORAGE_KEY, REMOVED_PROJECTS_KEY, SESSION_ACTIVE_KEY } from "../../config/config.js"
import { ensureStringId } from "../../utils/utils.js"

// CONSTANTES PARA CONTROLE DE SESSÃO
const SESSION_OBRAS = 'session_obras';

/**
 * Verifica se a sessão está ativa no navegador
 */
function isSessionActive() {
    return sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
}

/**
 * Define o estado da sessão como ativa ou inativa
 */
function setSessionActive(active) {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, active.toString());
    
    if (!active) {
        clearSessionObras();
        clearRenderedObras();
    }
}

/**
 * Obtém a lista de obras da sessão atual do sessionStorage
 */
function getSessionObras() {
    if (!isSessionActive()) return [];
    
    const stored = sessionStorage.getItem(SESSION_OBRAS);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Define a lista de obras da sessão atual no sessionStorage
 */
function setSessionObras(obraIds) {
    if (!isSessionActive()) return;
    sessionStorage.setItem(SESSION_OBRAS, JSON.stringify(obraIds));
}

/**
 * Adiciona uma obra à lista da sessão atual
 */
function addObraToSession(obraId) {
    if (!isSessionActive()) return;
    
    const sessionObras = getSessionObras();
    if (!sessionObras.includes(obraId)) {
        sessionObras.push(obraId);
        setSessionObras(sessionObras);
    }
}

/**
 * Remove uma obra da lista da sessão local (sessionStorage)
 */
function removeObraFromSessionLocal(obraId) {
    if (!isSessionActive()) return;
    
    const sessionObras = getSessionObras();
    const updatedObras = sessionObras.filter(id => id !== obraId);
    setSessionObras(updatedObras);
}

/**
 * Limpa todas as obras da sessão local e dados relacionados
 */
function clearSessionObras() {
    sessionStorage.removeItem(SESSION_OBRAS);
    sessionStorage.removeItem(REMOVED_PROJECTS_KEY);
}

/**
 * Remove todas as obras renderizadas da interface do usuário
 */
function clearRenderedObras() {
    const obrasContainer = document.getElementById("projects-container");
    if (!obrasContainer) return;
    
    const obras = obrasContainer.querySelectorAll('.obra-block');
    obras.forEach(obra => obra.remove());
    
    window.GeralCount = 0;
}

/**
 * Inicializa o contador global de obras
 */
function initializeGeralCount() {
    if (!isSessionActive()) {
        window.GeralCount = 0;
        return 0;
    }
    
    if (typeof window.GeralCount === "undefined" || window.GeralCount === null) {
        window.GeralCount = 0;
    }
    return window.GeralCount;
}

/**
 * Incrementa o contador global de obras
 */
function incrementGeralCount() {
    if (!isSessionActive()) return 0;
    
    initializeGeralCount()
    window.GeralCount++
    return window.GeralCount
}

/**
 * Decrementa o contador global de obras
 */
function decrementGeralCount() {
    if (!isSessionActive()) return 0;
    
    initializeGeralCount()

    if (window.GeralCount > 0) {
        window.GeralCount--

        const existingObras = document.querySelectorAll(".obra-block")

        if (window.GeralCount === 0 && existingObras.length === 0) {
            // Não cria obra base automaticamente
        } else if (window.GeralCount === 0 && existingObras.length > 0) {
            window.GeralCount = existingObras.length
        }
    }
    return window.GeralCount
}

/**
 * Retorna o valor atual do contador global de obras
 */
function getGeralCount() {
    initializeGeralCount()
    return window.GeralCount
}

/**
 * Reseta toda a lógica de exibição de obras e limpa a sessão
 */
function resetDisplayLogic() {
    setSessionActive(false);
    clearSessionObras();
    clearRenderedObras();
    
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    sessionStorage.removeItem(REMOVED_PROJECTS_KEY)
    window.GeralCount = 0
}

/**
 * Inicia uma nova sessão - chamada apenas manualmente pelo usuário
 */
async function startNewSession() {
    clearSessionObras();
    clearRenderedObras();
    setSessionActive(true);
    window.GeralCount = 0;
    console.log("🆕 Nova sessão iniciada pelo usuário");
}

/**
 * Inicia a sessão automaticamente quando o usuário salva a primeira obra
 */
async function startSessionOnFirstSave() {
    if (!isSessionActive()) {
        console.log("🆕 Iniciando sessão na primeira obra salva");
        await startNewSession();
        return true;
    }
    return false;
}

/**
 * Salva o ID da primeira obra da sessão no sessionStorage
 */
function saveFirstObraIdOfSession(obraId) {
    if (!isSessionActive()) return;
    
    const existingId = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!existingId) {
        const idAsInteger = ensureStringId(obraId)
        if (idAsInteger !== null) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, idAsInteger.toString())
            addObraToSession(idAsInteger);
            incrementGeralCount()
        }
    }
}

/**
 * Adiciona uma obra à lista de obras removidas
 */
function addObraToRemovedList(obraId) {
    if (!isSessionActive()) return;
    
    obraId = ensureStringId(obraId)
    const removedList = getRemovedObrasList()

    if (!removedList.includes(obraId)) {
        removedList.push(obraId)
        sessionStorage.setItem(REMOVED_PROJECTS_KEY, JSON.stringify(removedList))
        decrementGeralCount()
    }
}

/**
 * Retorna a lista de obras removidas da sessão
 */
function getRemovedObrasList() {
    const stored = sessionStorage.getItem(REMOVED_PROJECTS_KEY)
    return stored ? JSON.parse(stored) : []
}

/**
 * Verifica se uma obra específica foi removida da sessão
 */
function isObraRemoved(obraId) {
    const removedList = getRemovedObrasList()
    return removedList.includes(obraId)
}

export {
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
};