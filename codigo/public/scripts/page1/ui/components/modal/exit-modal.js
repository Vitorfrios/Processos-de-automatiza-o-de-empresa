/**
 * Modal de confirmação para encerramento do servidor - ESTILO TOAST
 * @module ExitModal
 */

/**
 * Cria e exibe o modal de confirmação para encerramento do servidor
 * @returns {Promise<boolean>} Promise que resolve com true se confirmado, false se cancelado
 */
export function showShutdownConfirmationModal() {
    return new Promise((resolve) => {
        // Remove modal existente se houver
        const existingModal = document.getElementById('shutdown-confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Cria o modal com estilo TOAST
        const modal = document.createElement('div');
        modal.id = 'shutdown-confirmation-modal';
        modal.className = 'confirmation-modal active';
        
        modal.innerHTML = `
            <div class="modal-content toast-style">
                <div class="modal-icon">⚠️</div>
                <h2 class="modal-title">Encerrar Servidor</h2>
                <p class="modal-message">
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
                </p>
                <div class="modal-actions">
                    <button class="modal-btn btn-cancel" id="shutdown-cancel-btn">
                        Cancelar
                    </button>
                    <button class="modal-btn btn-confirm" id="shutdown-confirm-btn">
                        Encerrar Servidor
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Configura os event listeners
        const cancelBtn = document.getElementById('shutdown-cancel-btn');
        const confirmBtn = document.getElementById('shutdown-confirm-btn');
        const modalElement = document.getElementById('shutdown-confirmation-modal');

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
    const {
        title = 'Encerrar Servidor',
        message = 'Tem certeza que deseja encerrar o servidor?',
        confirmText = 'Encerrar Servidor',
        cancelText = 'Cancelar',
        icon = '⚠️',
        borderColor = '#4299e1'
    } = options;

    return new Promise((resolve) => {
        const existingModal = document.getElementById('shutdown-confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'shutdown-confirmation-modal';
        modal.className = 'confirmation-modal active';
        
        modal.innerHTML = `
            <div class="modal-content toast-style custom-border" style="--custom-border-color: ${borderColor}">
                <div class="modal-icon">${icon}</div>
                <h2 class="modal-title">${title}</h2>
                <p class="modal-message">${message}</p>
                <div class="modal-actions">
                    <button class="modal-btn btn-cancel" id="shutdown-cancel-btn">
                        ${cancelText}
                    </button>
                    <button class="modal-btn btn-confirm" id="shutdown-confirm-btn">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Configura event listeners
        const cancelBtn = document.getElementById('shutdown-cancel-btn');
        const confirmBtn = document.getElementById('shutdown-confirm-btn');
        const modalElement = document.getElementById('shutdown-confirmation-modal');

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

        cancelBtn.addEventListener('click', onCancel);
        confirmBtn.addEventListener('click', onConfirm);
        modalElement.addEventListener('click', onBackdropClick);
        document.addEventListener('keydown', onKeyDown);

        cancelBtn.focus();
    });
}