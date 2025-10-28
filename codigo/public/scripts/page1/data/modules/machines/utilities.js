// utilities.js

/**
 * Atualiza o texto de um elemento HTML baseado no seu ID
 * Função utilitária para manipulação segura de elementos DOM
 * @param {string} elementId - ID do elemento a ser atualizado
 * @param {string} value - Novo valor de texto para o elemento
 */
function updateElementText(elementId, value) {
  const element = document.getElementById(elementId)
  if (element) element.textContent = value
}

/**
 * Remove mensagens de "vazio" de um container
 * Usado para limpar mensagens padrão quando conteúdo é adicionado
 * @param {HTMLElement} container - Elemento container onde procurar a mensagem
 * @param {string} selector - Seletor CSS para encontrar a mensagem (padrão: ".empty-message")
 */
function removeEmptyMessage(container, selector = ".empty-message") {
  const message = container.querySelector(selector)
  if (message) message.remove()
}

/**
 * Exibe uma mensagem de "vazio" em um container se estiver vazio
 * Útil para fornecer feedback visual quando não há conteúdo
 * @param {HTMLElement} container - Elemento container onde adicionar a mensagem
 * @param {string} message - Texto da mensagem a ser exibida
 */
function showEmptyMessage(container, message) {
  if (container.children.length === 0) {
    container.innerHTML = `<p class="empty-message">${message}</p>`
  }
}

/**
 * Encontra o ID da sala a partir de um elemento dentro dela
 * Navega pela árvore DOM para encontrar o container da sala
 * @param {HTMLElement} element - Elemento de partida para a busca
 * @param {string} prefix - Prefixo usado nos IDs das salas (padrão: "room-content-")
 * @returns {string|null} ID da sala ou null se não encontrado
 */
function findRoomId(element, prefix = "room-content-") {
  const roomContent = element.closest(`[id^="${prefix}"]`)
  return roomContent ? roomContent.id.replace(prefix, "") : null
}

// Exportação das funções utilitárias
export {
  updateElementText,
  removeEmptyMessage,
  showEmptyMessage,
  findRoomId
}