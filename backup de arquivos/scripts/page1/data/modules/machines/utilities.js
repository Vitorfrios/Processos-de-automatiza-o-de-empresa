// utilities.js
// SISTEMA CORRIGIDO COM IDs ÚNICOS

/**
 * Atualiza o texto de um elemento HTML baseado no seu ID
 * Função utilitária para manipulação segura de elementos DOM
 * @param {string} elementId - ID do elemento a ser atualizado
 * @param {string} value - Novo valor de texto para o elemento
 */
function updateElementText(elementId, value) {
    // ✅ CORREÇÃO: Validar elementId
    if (!elementId || elementId === 'undefined' || elementId === 'null') {
        console.error(`ERRO FALBACK (updateElementText) utilities.js [Element ID inválido: ${elementId}]`);
        return;
    }
    
    const element = document.getElementById(elementId);
    if (element) element.textContent = value;
}

/**
 * Remove mensagens de "vazio" de um container
 * Usado para limpar mensagens padrão quando conteúdo é adicionado
 * @param {HTMLElement} container - Elemento container onde procurar a mensagem
 * @param {string} selector - Seletor CSS para encontrar a mensagem (padrão: ".empty-message")
 */
function removeEmptyMessage(container, selector = ".empty-message") {
    // ✅ CORREÇÃO: Validar container
    if (!container || !(container instanceof HTMLElement)) {
        console.error(`ERRO FALBACK (removeEmptyMessage) utilities.js [Container inválido: ${container}]`);
        return;
    }
    
    const message = container.querySelector(selector);
    if (message) message.remove();
}

/**
 * Exibe uma mensagem de "vazio" em um container se estiver vazio
 * Útil para fornecer feedback visual quando não há conteúdo
 * @param {HTMLElement} container - Elemento container onde adicionar a mensagem
 * @param {string} message - Texto da mensagem a ser exibida
 */
function showEmptyMessage(container, message) {
    // ✅ CORREÇÃO: Validar container
    if (!container || !(container instanceof HTMLElement)) {
        console.error(`ERRO FALBACK (showEmptyMessage) utilities.js [Container inválido: ${container}]`);
        return;
    }
    
    if (container.children.length === 0) {
        container.innerHTML = `<p class="empty-message">${message}</p>`;
    }
}

/**
 * Encontra o ID da sala a partir de um elemento dentro dela - CORREÇÃO COMPLETA
 * Navega pela árvore DOM para encontrar o container da sala
 * @param {HTMLElement} element - Elemento de partida para a busca
 * @returns {string|null} ID da sala ou null se não encontrado
 */
function findRoomId(element) {
    // ✅ CORREÇÃO: Validar elemento
    if (!element || !(element instanceof HTMLElement)) {
        console.error(`ERRO FALBACK (findRoomId) utilities.js [Element inválido: ${element}]`);
        return null;
    }
    
    // ✅ CORREÇÃO: Buscar por data attribute em vez de ID
    const roomBlock = element.closest('.room-block');
    if (roomBlock) {
        const roomId = roomBlock.dataset.roomId;
        if (roomId && roomId !== 'undefined' && roomId !== 'null') {
            return roomId;
        }
    }
    
    console.warn('⚠️ Room ID não encontrado para elemento:', element);
    return null;
}

// Exportação das funções utilitárias
export {
  updateElementText,
  removeEmptyMessage,
  showEmptyMessage,
  findRoomId
}