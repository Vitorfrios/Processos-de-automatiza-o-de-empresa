// adapters/session-adapter.js - GERENCIAMENTO DE SESSÃO

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
/**
 * Remove todas as obras renderizadas da interface do usuário - VERSÃO CORRIGIDA
 * AGORA: Preserva obras que já foram salvas no servidor/sessão
 */
function clearRenderedObras() {
    const obrasContainer = document.getElementById("projects-container");
    if (!obrasContainer) return;
    
    console.log('🔍 clearRenderedObras: Analisando obras no DOM...');
    
    const obras = obrasContainer.querySelectorAll('.obra-block');
    console.log(`📊 Total de obras encontradas: ${obras.length}`);
    
    let obrasRemovidas = 0;
    let obrasPreservadas = 0;
    
    obras.forEach((obra, index) => {
        const obraId = obra.dataset.obraId;
        const obraName = obra.dataset.obraName;
        
        // ✅ CORREÇÃO CRÍTICA: Verificar se a obra JÁ FOI SALVA
        const hasSaveButton = obra.querySelector('.btn-save'); // Botão "Salvar" = obra NÃO salva
        const hasUpdateButton = obra.querySelector('.btn-update'); // Botão "Atualizar" = obra JÁ salva
        const hasProjects = obra.querySelector('.project-block'); // Tem projetos = conteúdo válido
        
        console.log(`🔍 Obra ${index + 1}: ${obraName} (${obraId})`, {
            hasSaveButton: !!hasSaveButton,
            hasUpdateButton: !!hasUpdateButton,
            hasProjects: !!hasProjects
        });
        
        // ✅ PRESERVAR obras que:
        // 1. Já foram salvas (tem botão "Atualizar") OU
        // 2. Têm projetos (conteúdo válido) OU  
        // 3. Estão na sessão atual
        if (hasUpdateButton || hasProjects || isObraInSession(obraId)) {
            console.log(`✅ PRESERVANDO: ${obraName} - Já salva ou tem conteúdo`);
            obrasPreservadas++;
            return; // NÃO remove
        }
        
        // ❌ REMOVER apenas obras que:
        // 1. Não foram salvas (só tem botão "Salvar") E
        // 2. Não têm projetos (vazias) E
        // 3. Não estão na sessão
        if (hasSaveButton && !hasProjects && !isObraInSession(obraId)) {
            console.log(`🗑️ REMOVENDO: ${obraName} - Obra não salva e vazia`);
            obra.remove();
            obrasRemovidas++;
        } else {
            console.log(`✅ PRESERVANDO: ${obraName} - Tem conteúdo ou está na sessão`);
            obrasPreservadas++;
        }
    });
    
    // ✅ Atualizar contador APENAS se obras foram removidas
    if (obrasRemovidas > 0) {
        window.GeralCount = Math.max(0, window.GeralCount - obrasRemovidas);
    }
    
    console.log(`📊 clearRenderedObras finalizado: ${obrasPreservadas} preservadas, ${obrasRemovidas} removidas`);
}

/**
 * Verifica se uma obra está na sessão atual - FUNÇÃO AUXILIAR
 */
function isObraInSession(obraId) {
    const sessionObras = getSessionObras();
    return sessionObras.includes(obraId);
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