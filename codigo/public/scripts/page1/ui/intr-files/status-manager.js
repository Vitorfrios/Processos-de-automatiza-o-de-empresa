import { UI_CONSTANTS } from '../../config/config.js'

/**
 * Gerenciador de status do sistema (banners de sucesso, erro, etc.)
 */

/**
 * Exibe um banner de status do sistema
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de status ('success', 'error', etc.)
 */
function showSystemStatus(message, type) {
  removeExistingStatusBanner()

  const banner = createStatusBanner(message, type)
  insertStatusBanner(banner)

  if (type === "success") {
    scheduleStatusBannerRemoval(banner)
  }
}

/**
 * Remove qualquer banner de status existente
 */
function removeExistingStatusBanner() {
  const existingBanner = document.getElementById("system-status-banner")
  if (existingBanner) {
    existingBanner.remove()
  }
}

/**
 * Cria um elemento de banner de status
 * @param {string} message - Mensagem do banner
 * @param {string} type - Tipo de banner
 * @returns {HTMLElement} Elemento do banner criado
 */
function createStatusBanner(message, type) {
  const banner = document.createElement("div")
  banner.id = "system-status-banner"
  banner.className = `system-status-banner ${type}`
  banner.textContent = message
  return banner
}

/**
 * Insere o banner de status no DOM
 * @param {HTMLElement} banner - Banner a ser inserido
 */
function insertStatusBanner(banner) {
  const mainContent = document.querySelector(".main-content")
  mainContent.insertBefore(banner, mainContent.firstChild)
}

/**
 * Agenda a remoção automática do banner de sucesso
 * @param {HTMLElement} banner - Banner a ser removido
 */
function scheduleStatusBannerRemoval(banner) {
  setTimeout(() => {
    banner.remove()
  }, UI_CONSTANTS.SUCCESS_MESSAGE_DURATION)
}

export {
    showSystemStatus,
    removeExistingStatusBanner,
    createStatusBanner,
    insertStatusBanner,
    scheduleStatusBannerRemoval,
}