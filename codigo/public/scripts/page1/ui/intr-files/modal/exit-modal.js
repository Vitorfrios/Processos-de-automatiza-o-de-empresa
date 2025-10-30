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
                        <span style="font-size: 1.2rem;">Esta ação irá:</span>
                        <ul>
                            <li style="margin-top: 15px">Desligar o servidor</li>
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

        // Adiciona estilos específicos para combinar com o toast
        const style = document.createElement('style');
        style.textContent = `
            /* ESTILO TOAST PARA O MODAL DE SHUTDOWN */
            .toast-style {
                background: #2d3748 !important;
                color: white !important;
                border-left: 4px solid #4299e1 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                padding: 2rem !important;
                max-width: 500px !important;
            }
            
            .toast-style .modal-icon {
                color: #4299e1 !important;
                animation: iconPulse 2s infinite ease-in-out;
                font-size: 3.5rem !important;
                margin-bottom: 1rem !important;
            }
            
            .toast-style .modal-title {
                color: white !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                font-size: 1.6rem !important;
                margin-bottom: 1.5rem !important;
            }
            
            .toast-style .modal-message {
                color: rgba(255, 255, 255, 0.9) !important;
                text-align: left !important;
                margin-bottom: 2rem !important;
            }
            
            .toast-style .modal-message strong {
                color: #ff6b6b !important;
                display: block;
                margin-bottom: 1.5rem !important;
                font-size: 1.1rem !important;
                text-align: center !important;
            }
            
            /* Lista de avisos */
            .toast-style .warning-list {
                background: rgba(255, 255, 255, 0.05);
                padding: 1.2rem;
                border-radius: 8px;
                margin: 1.5rem 0;
                border-left: 3px solid #4299e1;
            }
            
            .toast-style .warning-list ul {
                text-align: left;
                margin: 0;
                padding-left: 1.5rem;
                color: rgba(255, 255, 255);
            }
            
            .toast-style .warning-list ul li {
                margin-bottom: 0.5rem;
                padding-left: 0.5rem;
                line-height: 2;
            }
            
            .toast-style .warning-list ul li:last-child {
                margin-bottom: 0;
            }
            
            /* Nota de aviso */
            .toast-style .warning-note {
                background: rgba(255, 107, 107, 0.1);
                padding: 1rem;
                border-radius: 6px;
                border-left: 3px solid #ff6b6b;
                margin-top: 1.5rem;
            }
            
            .toast-style .warning-note small {
                color: rgb(255 255 255) !important;
                font-size: 1rem !important;
                line-height: 1.4;
                display: block;
            }
            
            /* Botões menores */
            .toast-style .modal-actions {
                margin-top: 1.5rem !important;
                gap: 1rem !important;
            }
            
            .toast-style .modal-btn {
                padding: 0.8rem 1.5rem !important;
                min-width: 120px !important;
                font-size: 0.95rem !important;
            }
            
            .toast-style .btn-cancel {
                background: #6c757d !important;
                color: white !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
            }
            
            .toast-style .btn-cancel:hover {
                background: #5a6268 !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .toast-style .btn-confirm {
                background: #e53e3e !important;
                color: white !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
            }
            
            .toast-style .btn-confirm:hover {
                background: #c53030 !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);
            }
            
            /* Animações específicas */
            @keyframes iconPulse {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.1);
                    opacity: 1;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            /* Responsividade */
            @media (max-width: 480px) {
                .toast-style {
                    padding: 1.5rem !important;
                    margin: 1rem !important;
                    width: 90vw !important;
                }
                
                .toast-style .modal-actions {
                    flex-direction: column !important;
                }
                
                .toast-style .modal-btn {
                    width: 100% !important;
                    min-width: auto !important;
                }
                
                .toast-style .modal-icon {
                    font-size: 3rem !important;
                }
                
                .toast-style .modal-title {
                    font-size: 1.4rem !important;
                }
            }
        `;
        
        document.head.appendChild(style);
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
                    if (style.parentNode) {
                        style.remove();
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
            <div class="modal-content toast-style">
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

        // Estilos dinâmicos baseados na cor da borda
        const style = document.createElement('style');
        style.textContent = `
            .toast-style {
                background: #2d3748 !important;
                color: white !important;
                border-left: 4px solid ${borderColor} !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                padding: 2rem !important;
                max-width: 500px !important;
            }
            
            .toast-style .modal-icon {
                color: ${borderColor} !important;
                animation: iconPulse 2s infinite ease-in-out;
                font-size: 3.5rem !important;
            }
            
            .toast-style .modal-title {
                color: white !important;
            }
            
            .toast-style .modal-message {
                color: rgba(255, 255, 255, 0.9) !important;
                text-align: left !important;
            }
            
            .toast-style .modal-actions {
                gap: 1rem !important;
            }
            
            .toast-style .modal-btn {
                padding: 0.8rem 1.5rem !important;
                min-width: 120px !important;
                font-size: 0.95rem !important;
            }
            
            .toast-style .btn-cancel {
                background: #6c757d !important;
                color: white !important;
            }
            
            .toast-style .btn-cancel:hover {
                background: #5a6268 !important;
            }
            
            .toast-style .btn-confirm {
                background: #e53e3e !important;
                color: white !important;
            }
            
            .toast-style .btn-confirm:hover {
                background: #c53030 !important;
            }
            
            @keyframes iconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @media (max-width: 480px) {
                .toast-style {
                    padding: 1.5rem !important;
                    margin: 1rem !important;
                }
                
                .toast-style .modal-actions {
                    flex-direction: column !important;
                }
                
                .toast-style .modal-btn {
                    width: 100% !important;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);

        // Configura event listeners (similar à função principal)
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
                    if (style.parentNode) {
                        style.remove();
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