/**
 * Modal de confirmação para encerramento do servidor - ESTILO TOAST
 * @module ExitModal
 */

/**
 * Configuração padrão do modal
 */
const DEFAULT_CONFIG = {
    id: 'shutdown-confirmation-modal',
    title: 'Encerrar Servidor',
    message: 'Tem certeza que deseja encerrar o servidor?',
    confirmText: 'Encerrar Servidor',
    cancelText: 'Cancelar',
    icon: '⚠️',
    borderColor: '#4299e1'
};

/**
 * Cria o HTML do modal baseado na configuração
 * @param {Object} config - Configuração do modal
 * @returns {string} HTML do modal
 */
function createModalHTML(config) {
    const isDefaultModal = config.isDefault;
    
    const messageContent = isDefaultModal ? `
        <strong>Tem certeza que deseja encerrar o servidor?</strong>
        
        <div class="warning-list">
            <span>Esta ação irá:</span>
            <ul>
                <li>Desligar o servidor</li>
                <li>Limpar todas as sessões ativas</li>
                <li>Fechar esta aplicação</li>
            </ul>
        </div>

        <div class="warning-note">
            <small>⚠️ Todas as conexões ativas serão finalizadas e o servidor será desligado completamente.</small>
        </div>
    ` : config.message;

    const borderStyle = config.borderColor ? `style="--custom-border-color: ${config.borderColor}"` : '';
    const customClass = config.borderColor ? 'custom-border' : '';

    return `
        <div class="modal-content toast-style ${customClass}" ${borderStyle}>
            <div class="modal-icon">${config.icon}</div>
            <h2 class="modal-title">${config.title}</h2>
            <p class="modal-message">${messageContent}</p>
            <div class="modal-actions">
                <button class="modal-btn btn-cancel" id="shutdown-cancel-btn">
                    ${config.cancelText}
                </button>
                <button class="modal-btn btn-confirm" id="shutdown-confirm-btn">
                    ${config.confirmText}
                </button>
            </div>
        </div>
    `;
}

/**
 * Configura os event listeners do modal
 * @param {HTMLElement} modalElement - Elemento do modal
 * @param {Function} resolve - Função resolve da Promise
 */
function setupModalEvents(modalElement, resolve) {
    const cancelBtn = document.getElementById('shutdown-cancel-btn');
    const confirmBtn = document.getElementById('shutdown-confirm-btn');

    const cleanup = () => {
        cancelBtn.removeEventListener('click', onCancel);
        confirmBtn.removeEventListener('click', onConfirm);
        modalElement.removeEventListener('click', onBackdropClick);
        document.removeEventListener('keydown', onKeyDown);
        
        if (modalElement) {
            modalElement.classList.remove('active');
            setTimeout(() => {
                if (modalElement.parentNode) {
                    modalElement.remove();
                }
            }, 300);
        }
    };

    const onConfirm = () => {
        cleanup();
        resolve(true);
    };

    const onCancel = () => {
        cleanup();
        resolve(false);
    };

    const onBackdropClick = (e) => {
        if (e.target === modalElement) {
            onCancel();
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        } else if (e.key === 'Enter') {
            onConfirm();
        }
    };

    // Adiciona os event listeners
    cancelBtn.addEventListener('click', onCancel);
    confirmBtn.addEventListener('click', onConfirm);
    modalElement.addEventListener('click', onBackdropClick);
    document.addEventListener('keydown', onKeyDown);

    // Foca no botão de cancelar por segurança
    cancelBtn.focus();
}

/**
 * Remove modal existente se houver
 */
function removeExistingModal() {
    const existingModal = document.getElementById('shutdown-confirmation-modal');
    if (existingModal) {
        existingModal.remove();
    }
}

/**
 * Cria e exibe o modal de confirmação
 * @param {Object} config - Configuração do modal
 * @returns {Promise<boolean>} Promise que resolve com true se confirmado, false se cancelado
 */
function createShutdownModal(config) {
    return new Promise((resolve) => {
        removeExistingModal();

        const modal = document.createElement('div');
        modal.id = config.id;
        modal.className = 'confirmation-modal active';
        modal.innerHTML = createModalHTML(config);

        document.body.appendChild(modal);
        setupModalEvents(modal, resolve);
    });
}

/**
 * Cria e exibe o modal de confirmação para encerramento do servidor
 * @returns {Promise<boolean>} Promise que resolve com true se confirmado, false se cancelado
 */
export function showShutdownConfirmationModal() {
    return createShutdownModal({
        ...DEFAULT_CONFIG,
        isDefault: true
    });
}

/**
 * Versão alternativa do modal com opções customizáveis - ESTILO TOAST
 * @param {Object} options - Opções de customização
 * @param {string} options.title - Título do modal
 * @param {string} options.message - Mensagem principal
 * @param {string} options.confirmText - Texto do botão de confirmação
 * @param {string} options.cancelText - Texto do botão de cancelamento
 * @param {string} options.icon - Ícone do modal
 * @param {string} options.borderColor - Cor da borda (padrão: #4299e1)
 * @returns {Promise<boolean>}
 */
export function showCustomShutdownModal(options = {}) {
    const config = {
        ...DEFAULT_CONFIG,
        ...options,
        isDefault: false
    };
    
    return createShutdownModal(config);
}