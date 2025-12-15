/* ==== INÍCIO: features/filters/universal-delete-modal.js ==== */
/**
 * UniversalDeleteModal - Modal limpo e direto
 * Mostra apenas: Tipo, Nome e Data/Hora
 */

class UniversalDeleteModal {
    constructor() {
        this.modal = null;
        this.modalContent = null;
        this.currentDeletion = null;
        this.isShowing = false;
        this.escHandler = null;
        this.init();
    }
    
    init() {
        this.createModalHTML();
        this.setupEventListeners();
    }
    
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
                        <div class="warning-icon">⚠️</div>
                        <h2 class="modal-title">DELETAR PERMANENTEMENTE</h2>
                        <p class="modal-subtitle">Esta ação não pode ser desfeita</p>
                    </div>
                    
                    <div id="universal-delete-message"></div>
                    <div id="universal-delete-details"></div>
                    
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
    
    setupEventListeners() {
        if (!this.modal) return;
        
        document.getElementById('universal-delete-cancel').addEventListener('click', () => this.hide());
        document.getElementById('universal-delete-confirm').addEventListener('click', async () => {
            if (this.currentDeletion?.callback) await this.currentDeletion.callback();
            this.hide();
        });
        
        this.modal.addEventListener('click', (e) => {
            if (e.target.id === 'universal-delete-modal') this.hide();
        });
    }
    
    show(itemType, itemName, deleteCallback) {
        if (!this.modal) return false;
        
        this.currentDeletion = {
            itemType,
            itemName,
            callback: deleteCallback
        };
        
        // Mensagem principal
        document.getElementById('universal-delete-message').innerHTML = `
            <div class="message-content">
                <span class="message-icon">🗑️</span>
                <div class="message-text">
                    <strong>"${itemName}"</strong> será 
                    <span style="color: #d32f2f; font-weight: bold; text-decoration: underline;">DELETADO PERMANENTEMENTE</span> 
                    do sistema.
                    <br><br>
                    <small>Esta ação não pode ser desfeita.</small>
                </div>
            </div>
        `;
        
        // Apenas 3 informações
        document.getElementById('universal-delete-details').innerHTML = `
            <div class="details-grid">
                <strong>Tipo:</strong> <span>${itemType}</span>
                <strong>Nome:</strong> <span>${itemName}</span>
                <strong>Data/Hora:</strong> <span>${new Date().toLocaleString()}</span>
            </div>
        `;
        
        // Mostrar com animação
        this.modal.style.display = 'flex';
        this.isShowing = true;
        
        setTimeout(() => {
            this.modal.style.opacity = '1';
            this.modalContent.style.transform = 'translateY(0)';
        }, 10);
        
        // Configurar ESC
        this.escHandler = (e) => e.key === 'Escape' && this.isShowing && this.hide();
        document.addEventListener('keydown', this.escHandler);
        
        // Focar no botão de cancelar
        setTimeout(() => document.getElementById('universal-delete-cancel').focus(), 100);
        document.body.style.overflow = 'hidden';
        
        return true;
    }
    
    hide() {
        if (!this.modal || !this.isShowing) return;
        
        this.modal.style.opacity = '0';
        this.modalContent.style.transform = 'translateY(-30px)';
        
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
        
        document.body.style.overflow = '';
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.isShowing = false;
            this.currentDeletion = null;
        }, 300);
    }
    
    static async confirmDelete(itemType, itemName) {
        return new Promise((resolve) => {
            if (!window.universalDeleteModalInstance) {
                window.universalDeleteModalInstance = new UniversalDeleteModal();
            }
            
            const modal = window.universalDeleteModalInstance;
            const originalHide = modal.hide.bind(modal);
            
            modal.hide = function() {
                originalHide();
                setTimeout(() => {
                    resolve(false);
                    modal.hide = originalHide;
                }, 350);
            };
            
            const deleteCallback = () => {
                setTimeout(() => resolve(true), 50);
            };
            
            modal.show(itemType, itemName, deleteCallback);
        });
    }
}

// Exportar
export { UniversalDeleteModal };
if (typeof window !== 'undefined') window.UniversalDeleteModal = UniversalDeleteModal;
/* ==== FIM: features/filters/universal-delete-modal.js ==== */