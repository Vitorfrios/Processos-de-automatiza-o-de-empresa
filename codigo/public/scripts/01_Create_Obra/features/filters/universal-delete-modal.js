/* ==== INÍCIO: features/filters/universal-delete-modal.js ==== */
/**
 * UniversalDeleteModal - Sistema de deleção REAL para todos os itens
 * Substitui o modal antigo que só removia da tela
 */

class UniversalDeleteModal {
    constructor() {
        this.modal = null;
        this.modalContent = null;
        this.currentDeletion = null;
        this.isShowing = false;
        this.escHandler = null;
        
        console.log('✅ UniversalDeleteModal inicializado');
        this.init();
    }
    
    init() {
        this.createModalHTML();
        this.setupEventListeners();
    }
    
    /**
     * Cria o HTML do modal (uma única vez)
     */
    createModalHTML() {
        if (document.getElementById('universal-delete-modal')) {
            this.modal = document.getElementById('universal-delete-modal');
            this.modalContent = this.modal.querySelector('.modal-content');
            return;
        }
        
        const modalHTML = `
            <div id="universal-delete-modal" class="universal-delete-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="warning-icon">
                            <span>⚠️</span>
                        </div>
                        <h2 class="modal-title">DELETAR PERMANENTEMENTE</h2>
                        <p class="modal-subtitle">Esta ação não pode ser desfeita</p>
                    </div>
                    
                    <div id="universal-delete-message">
                        <!-- Conteúdo dinâmico será inserido aqui -->
                    </div>
                    
                    <div id="universal-delete-details">
                        <!-- Detalhes do item serão inseridos aqui -->
                    </div>
                    
                    <div class="action-buttons">
                        <button id="universal-delete-cancel" class="universal-btn universal-btn-cancel">
                            Cancelar (ESC)
                        </button>
                        <button id="universal-delete-confirm" class="universal-btn universal-btn-confirm">
                            DELETAR AGORA
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('universal-delete-modal');
        this.modalContent = this.modal.querySelector('.modal-content');
    }
    
    /**
     * Configura listeners do modal
     */
    setupEventListeners() {
        if (!this.modal) return;
        
        const cancelBtn = document.getElementById('universal-delete-cancel');
        const confirmBtn = document.getElementById('universal-delete-confirm');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hide());
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                if (this.currentDeletion && this.currentDeletion.callback) {
                    await this.currentDeletion.callback();
                }
                this.hide();
            });
        }
        
        // Fechar ao clicar fora
        this.modal.addEventListener('click', (e) => {
            if (e.target.id === 'universal-delete-modal') {
                this.hide();
            }
        });
        
        console.log('✅ Event listeners do UniversalDeleteModal configurados');
    }
    
    /**
     * Mostra o modal com informações específicas
     * @param {string} itemType - Tipo do item (usuário, produto, etc.)
     * @param {string} itemName - Nome do item a ser deletado
     * @param {string} itemDetails - Detalhes adicionais (opcional)
     * @param {Function} deleteCallback - Função a ser executada ao confirmar
     * @returns {boolean} - Se o modal foi mostrado com sucesso
     */
    show(itemType, itemName, itemDetails, deleteCallback) {
        if (!this.modal) {
            console.error('❌ Modal não encontrado ao tentar mostrar');
            return false;
        }
        
        this.currentDeletion = {
            itemType,
            itemName,
            itemDetails,
            callback: deleteCallback
        };
        
        // Atualizar conteúdo do modal
        const messageEl = document.getElementById('universal-delete-message');
        const detailsEl = document.getElementById('universal-delete-details');
        
        if (messageEl) {
            messageEl.innerHTML = `
                <div class="message-content">
                    <span class="message-icon">🗑️</span>
                    <div class="message-text">
                        <strong>"${itemName}"</strong> será 
                        <span style="color: #d32f2f; font-weight: bold; text-decoration: underline;">DELETADO PERMANENTEMENTE</span> 
                        do sistema.
                        <br><br>
                        <small>
                            Esta ação removerá o item do servidor, do backup e de todos os registros. 
                            <strong>NÃO HAVERÁ COMO RECUPERAR</strong>.
                        </small>
                    </div>
                </div>
            `;
        }
        
        if (detailsEl) {
            detailsEl.innerHTML = `
                <div class="details-grid">
                    <strong>Tipo:</strong> <span>${itemType}</span>
                    <strong>Nome:</strong> <span>${itemName}</span>
                    <strong>Data/Hora:</strong> <span>${new Date().toLocaleString()}</span>
                    ${itemDetails ? `<strong>Detalhes:</strong> <span>${itemDetails}</span>` : ''}
                </div>
            `;
        }
        
        // Mostrar modal com animação
        this.modal.style.display = 'flex';
        this.isShowing = true;
        
        // Forçar reflow para ativar transição
        this.modal.offsetHeight;
        
        setTimeout(() => {
            if (this.modal) {
                this.modal.style.opacity = '1';
            }
            if (this.modalContent) {
                this.modalContent.style.transform = 'translateY(0)';
            }
        }, 10);
        
        // Configurar ESC handler
        this.escHandler = (e) => {
            if (e.key === 'Escape' && this.isShowing) {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.escHandler);
        
        // Focar no botão de cancelar para acessibilidade
        setTimeout(() => {
            const cancelBtn = document.getElementById('universal-delete-cancel');
            if (cancelBtn) cancelBtn.focus();
        }, 100);
        
        // Prevenir scroll da página
        document.body.style.overflow = 'hidden';
        
        return true;
    }
    
    /**
     * Esconde o modal
     */
    hide() {
        if (!this.modal || !this.isShowing) return;
        
        this.modal.style.opacity = '0';
        if (this.modalContent) {
            this.modalContent.style.transform = 'translateY(-30px)';
        }
        
        // Remover ESC handler
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
        
        // Restaurar scroll da página
        document.body.style.overflow = '';
        
        setTimeout(() => {
            if (this.modal) {
                this.modal.style.display = 'none';
            }
            this.isShowing = false;
            this.currentDeletion = null;
        }, 300);
    }
    
    /**
     * Função estática para mostrar confirmação (para uso fácil)
     * @param {string} itemType - Tipo do item
     * @param {string} itemName - Nome do item
     * @param {string} itemDetails - Detalhes adicionais (opcional)
     * @returns {Promise<boolean>} - True se confirmado, False se cancelado
     */
    static async confirmDelete(itemType, itemName, itemDetails = '') {
        return new Promise((resolve) => {
            // Criar instância se não existir
            if (!window.universalDeleteModalInstance) {
                window.universalDeleteModalInstance = new UniversalDeleteModal();
            }
            
            const modal = window.universalDeleteModalInstance;
            
            // Configurar callback de confirmação
            const deleteCallback = () => {
                resolve(true);
            };
            
            // Guardar referência à função hide original
            const originalHide = modal.hide.bind(modal);
            
            // Sobrescrever hide temporariamente para capturar cancelamento
            const tempHide = function() {
                originalHide();
                // Resolver como false (cancelado) após animação
                setTimeout(() => {
                    resolve(false);
                    // Restaurar hide original
                    modal.hide = originalHide;
                }, 350);
            };
            
            modal.hide = tempHide;
            
            // Mostrar modal
            const shown = modal.show(itemType, itemName, itemDetails, deleteCallback);
            
            if (!shown) {
                // Se não conseguiu mostrar, resolver como false
                resolve(false);
                modal.hide = originalHide;
            }
        });
    }
    
    /**
     * Destrói o modal e remove do DOM
     */
    destroy() {
        this.hide();
        
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
        }
        
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        
        this.modal = null;
        this.modalContent = null;
        this.currentDeletion = null;
        this.isShowing = false;
        
        console.log('🗑️ UniversalDeleteModal destruído');
    }
    
    /**
     * Método auxiliar para integrar com botões existentes
     * @param {HTMLElement} button - Botão que acionará o modal
     * @param {Object} options - Opções de configuração
     */
    static attachToButton(button, options = {}) {
        const {
            itemType = 'item',
            getName = () => button.dataset.name || 'Item sem nome',
            getDetails = () => button.dataset.details || '',
            onConfirm = async () => console.log('Deleção confirmada'),
            onCancel = () => console.log('Deleção cancelada'),
            confirmText = 'DELETAR AGORA',
            cancelText = 'Cancelar (ESC)'
        } = options;
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const confirmed = await UniversalDeleteModal.confirmDelete(
                itemType,
                getName(),
                getDetails()
            );
            
            if (confirmed) {
                await onConfirm();
            } else {
                onCancel();
            }
        });
        
        // Opcional: atualizar texto dos botões no modal
        const updateButtonTexts = () => {
            const confirmBtn = document.getElementById('universal-delete-confirm');
            const cancelBtn = document.getElementById('universal-delete-cancel');
            
            if (confirmBtn && confirmText) {
                confirmBtn.textContent = confirmText;
            }
            
            if (cancelBtn && cancelText) {
                cancelBtn.textContent = cancelText;
            }
        };
        
        // Executar quando modal for criado
        setTimeout(updateButtonTexts, 100);
    }
}

// Exportar e disponibilizar globalmente
export { UniversalDeleteModal };

if (typeof window !== 'undefined') {
    window.UniversalDeleteModal = UniversalDeleteModal;
    // Não criar instância automaticamente - será criada quando necessário
}

/**
 * Função helper para uso rápido (opcional)
 * @param {string} type - Tipo do item
 * @param {string} name - Nome do item
 * @param {string} details - Detalhes adicionais
 * @returns {Promise<boolean>}
 */
window.confirmDelete = async (type, name, details = '') => {
    return UniversalDeleteModal.confirmDelete(type, name, details);
};

/**
 * Inicialização automática para elementos com data attributes
 */
document.addEventListener('DOMContentLoaded', () => {
    // Encontrar todos os botões com data-delete-modal
    const deleteButtons = document.querySelectorAll('[data-delete-modal]');
    
    deleteButtons.forEach(button => {
        UniversalDeleteModal.attachToButton(button, {
            itemType: button.dataset.deleteType || 'item',
            getName: () => button.dataset.deleteName || button.textContent.trim(),
            getDetails: () => button.dataset.deleteDetails || '',
            onConfirm: async () => {
                // Disparar evento customizado
                const event = new CustomEvent('deleteConfirmed', {
                    detail: {
                        type: button.dataset.deleteType,
                        name: button.dataset.deleteName,
                        element: button
                    }
                });
                button.dispatchEvent(event);
                
                // Executar função customizada se definida
                if (button.dataset.onConfirm && window[button.dataset.onConfirm]) {
                    await window[button.dataset.onConfirm](button);
                }
            }
        });
    });
    
    console.log(`🔗 ${deleteButtons.length} botões de deleção vinculados automaticamente`);
});
/* ==== FIM: features/filters/universal-delete-modal.js ==== */