/**
 * ui/components/status.js
 *  FUSÃO: status-manager.js → status.js
 * ⚡ REFATORAÇÃO: Import atualizado + funcionalidades estendidas
 */

import { UI_CONSTANTS } from '../../core/constants.js';

/**
 * Gerenciador de status do sistema (banners de sucesso, erro, etc.) - SISTEMA UNIFICADO
 */

// Cache para controle de banners ativos
let activeBanners = new Set();

/**
 * Exibe um banner de status do sistema
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de status ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duração em ms (opcional, padrão baseado no tipo)
 */
function showSystemStatus(message, type = 'info', duration = null) {
    removeExistingStatusBanner();

    const banner = createStatusBanner(message, type);
    insertStatusBanner(banner);
    
    // Adicionar ao controle de banners ativos
    activeBanners.add(banner);

    // Configurar remoção automática baseada no tipo
    if (type === "success" || duration !== null) {
        const removalTime = duration || getDefaultDuration(type);
        scheduleStatusBannerRemoval(banner, removalTime);
    }
    
    // Log para debug
    console.log(`📢 Status [${type.toUpperCase()}]: ${message}`);
}

/**
 * Remove qualquer banner de status existente
 */
function removeExistingStatusBanner() {
    const existingBanner = document.getElementById("system-status-banner");
    if (existingBanner) {
        existingBanner.remove();
        activeBanners.delete(existingBanner);
    }
}

/**
 * Remove todos os banners de status (limpeza completa)
 */
function removeAllStatusBanners() {
    const allBanners = document.querySelectorAll('#system-status-banner, .system-status-banner');
    allBanners.forEach(banner => {
        banner.remove();
        activeBanners.delete(banner);
    });
    activeBanners.clear();
}

/**
 * Cria um elemento de banner de status
 * @param {string} message - Mensagem do banner
 * @param {string} type - Tipo de banner
 * @returns {HTMLElement} Elemento do banner criado
 */
function createStatusBanner(message, type) {
    const banner = document.createElement("div");
    banner.id = "system-status-banner";
    banner.className = `system-status-banner ${type}`;
    
    // Ícone baseado no tipo
    const icon = getStatusIcon(type);
    
    banner.innerHTML = `
        <div class="status-banner-content">
            <span class="status-icon">${icon}</span>
            <span class="status-message">${message}</span>
        </div>
    `;
    
    return banner;
}

/**
 * Obtém ícone apropriado para o tipo de status
 * @param {string} type - Tipo de status
 * @returns {string} Emoji do ícone
 */
function getStatusIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳'
    };
    return icons[type] || icons.info;
}

/**
 * Obtém duração padrão baseada no tipo
 * @param {string} type - Tipo de status
 * @returns {number} Duração em ms
 */
function getDefaultDuration(type) {
    const durations = {
        success: UI_CONSTANTS.SUCCESS_MESSAGE_DURATION || 5000,
        error: 8000,    // Erros ficam mais tempo
        warning: 6000,  // Warnings tempo médio
        info: 4000,     // Info tempo curto
        loading: 0      // Loading não some automaticamente
    };
    return durations[type] || 5000;
}

/**
 * Insere o banner de status no DOM
 * @param {HTMLElement} banner - Banner a ser inserido
 */
function insertStatusBanner(banner) {
    // Tentar inserir no main-content primeiro
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
        mainContent.insertBefore(banner, mainContent.firstChild);
        return;
    }
    
    // Fallback: inserir no body
    const body = document.body;
    if (body.firstChild) {
        body.insertBefore(banner, body.firstChild);
    } else {
        body.appendChild(banner);
    }
}

/**
 * Agenda a remoção automática do banner
 * @param {HTMLElement} banner - Banner a ser removido
 * @param {number} duration - Duração em ms
 */
function scheduleStatusBannerRemoval(banner, duration) {
    if (duration > 0) {
        setTimeout(() => {
            if (banner && banner.parentNode) {
                banner.remove();
                activeBanners.delete(banner);
            }
        }, duration);
    }
}

/**
 * 🆕 FUNÇÃO: Exibe status de carregamento
 * @param {string} message - Mensagem de carregamento
 * @returns {Function} Função para remover o loading
 */
function showLoadingStatus(message = 'Carregando...') {
    removeExistingStatusBanner();
    const banner = createStatusBanner(message, 'loading');
    insertStatusBanner(banner);
    activeBanners.add(banner);
    
    // Retorna função para remover o loading
    return () => {
        if (banner && banner.parentNode) {
            banner.remove();
            activeBanners.delete(banner);
        }
    };
}

/**
 * 🆕 FUNÇÃO: Exibe status temporário com callback
 * @param {string} message - Mensagem
 * @param {string} type - Tipo de status
 * @param {number} duration - Duração
 * @param {Function} callback - Callback após remoção
 */
function showTemporaryStatus(message, type = 'success', duration = 3000, callback = null) {
    showSystemStatus(message, type, duration);
    
    if (callback && typeof callback === 'function') {
        setTimeout(callback, duration);
    }
}

/**
 * 🆕 FUNÇÃO: Verifica se há banner ativo
 * @returns {boolean} True se há banner ativo
 */
function hasActiveStatusBanner() {
    return activeBanners.size > 0;
}

/**
 * 🆕 FUNÇÃO: Obtém contagem de banners ativos
 * @returns {number} Número de banners ativos
 */
function getActiveBannersCount() {
    return activeBanners.size;
}

// Exportações para módulos ES6
export {
    showSystemStatus,
    removeExistingStatusBanner,
    removeAllStatusBanners,
    createStatusBanner,
    insertStatusBanner,
    scheduleStatusBannerRemoval,
    showLoadingStatus,
    showTemporaryStatus,
    hasActiveStatusBanner,
    getActiveBannersCount
};

// Compatibilidade global para scripts legados
if (typeof window !== 'undefined') {
    window.showSystemStatus = showSystemStatus;
    window.removeExistingStatusBanner = removeExistingStatusBanner;
    window.removeAllStatusBanners = removeAllStatusBanners;
    window.showLoadingStatus = showLoadingStatus;
    window.showTemporaryStatus = showTemporaryStatus;
}
