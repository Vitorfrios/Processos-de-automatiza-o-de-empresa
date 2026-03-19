/* ==== INÍCIO: button-mode-manager.js ==== */
/**
 * ButtonModeManager - Gerencia APENAS a mudança de texto dos botões de OBRA
 */
class ButtonModeManager {
    constructor() {
        this.state = {
            filterMode: false,
            originalTexts: new Map()
        };
        
        console.log('✅ ButtonModeManager criado (APENAS OBRAS)');
    }

    /**
     * Ativa o modo filtro (muda textos APENAS dos botões de obra)
     */
    enableFilterMode() {
        if (this.state.filterMode) return;
        
        console.log('🎛️ [BUTTON-MANAGER] Ativando modo filtro...');
        this.state.filterMode = true;
        this.changeButtonTexts('Deletar');
        
        // ATIVAR ButtonDeleteUniversal
        if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.setupAllDeleteButtons) {
            setTimeout(() => {
                window.ButtonDeleteUniversal.setupAllDeleteButtons();
                console.log('✅ [BUTTON-MANAGER] ButtonDeleteUniversal ativado');
            }, 37);
        }
    }

    /**
     * Desativa o modo filtro (restaura textos)
     */
    disableFilterMode() {
        if (!this.state.filterMode) return;
        
        console.log('🎛️ [BUTTON-MANAGER] Desativando modo filtro...');
        this.state.filterMode = false;
        this.restoreButtonTexts();
        
        // DESATIVAR ButtonDeleteUniversal
        this.disableUniversalDeleteButtons();
    }

    /**
     * Desativa botões universais quando filtro desativado
     */
    disableUniversalDeleteButtons() {
        if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.restoreOriginalButtons) {
            const restoredCount = window.ButtonDeleteUniversal.restoreOriginalButtons();
            console.log(`✅ [BUTTON-MANAGER] ${restoredCount} botões de obra universais desativados`);
        } else {
            // Fallback manual
            const deleteButtons = document.querySelectorAll('.delete-real');
            
            deleteButtons.forEach(button => {
                const originalOnclick = button.getAttribute('data-original-onclick');
                const originalText = button.getAttribute('data-original-text');
                
                if (originalOnclick) {
                    button.setAttribute('onclick', originalOnclick);
                }
                
                if (originalText) {
                    button.textContent = originalText;
                }
                
                button.classList.remove('delete-real');
                button.removeAttribute('data-original-onclick');
                button.removeAttribute('data-original-text');
                button.removeAttribute('data-button-type');
                button.removeAttribute('data-item-id');
                button.removeAttribute('data-item-name');
            });
            
            console.log(`✅ [BUTTON-MANAGER] ${deleteButtons.length} botões de obra restaurados manualmente`);
        }
    }

    /**
     * Muda textos APENAS dos botões de obra
     */
    changeButtonTexts(newText) {
        console.log(` Mudando textos dos botões de obra para: "${newText}"`);
        
        const allButtons = document.querySelectorAll('button');
        
        allButtons.forEach(button => {
            const text = button.textContent?.trim();
            const onclick = button.getAttribute('onclick') || '';
            
            // APENAS botões que têm texto com "Obra" e onclick com "deleteObra"
            if (text && text.includes('Obra') && onclick.includes('deleteObra')) {
                // Guardar texto original se não guardado ainda
                if (!this.state.originalTexts.has(button)) {
                    this.state.originalTexts.set(button, text);
                }
                
                if (text === 'Deletar Obra' || text === 'Remover Obra') {
                    button.textContent = newText + ' Obra';
                } else if (text.includes('Obra')) {
                    button.textContent = text.replace(/Remover|Deletar/, newText);
                }
                
                // Adicionar classe para estilo
                button.classList.add('filter-mode-active');
                button.style.fontWeight = 'bold';
                
                console.log(`✅ Texto alterado: "${this.state.originalTexts.get(button)}" → "${button.textContent}"`);
            }
        });
        
        console.log(` Textos alterados para modo filtro`);
    }

    /**
     * Restaura textos originais
     */
    restoreButtonTexts() {
        console.log(' Restaurando textos originais dos botões de obra...');
        
        this.state.originalTexts.forEach((originalText, button) => {
            button.textContent = originalText;
            button.classList.remove('filter-mode-active');
            button.style.fontWeight = '';
            
            console.log(`✅ Texto restaurado: "${button.textContent}"`);
        });
        
        // Limpar cache
        this.state.originalTexts.clear();
        console.log('✅ Textos restaurados para modo normal');
    }

    /**
     * Aplica modo atual
     */
    applyMode() {
        console.log('🎛️ [BUTTON-MANAGER] Aplicando modo atual...');
        
        if (window.FilterSystem) {
            try {
                const filterState = window.FilterSystem.getState();
                if (filterState && filterState.active) {
                    this.enableFilterMode();
                } else {
                    this.disableFilterMode();
                }
            } catch (error) {
                console.error('❌ Erro ao verificar FilterSystem:', error);
                this.disableFilterMode();
            }
        } else {
            this.disableFilterMode();
        }
    }

    /**
     * Configura observador para novos botões
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0 && this.state.filterMode) {
                    setTimeout(() => {
                        this.changeButtonTexts('Deletar');
                        
                        if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.setupAllDeleteButtons) {
                            window.ButtonDeleteUniversal.setupAllDeleteButtons();
                        }
                    }, 12);
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('🔍 Observador configurado para novos botões de obra');
        return observer;
    }

    /**
     * Inicializa o gerenciador
     */
    initialize() {
        console.log(' [BUTTON-MANAGER] Inicializando (APENAS OBRAS)...');
        
        this.setupMutationObserver();
        setTimeout(() => {
            this.applyMode();
        }, 62);
        
        console.log('✅ ButtonModeManager inicializado');
        return true;
    }
}

export { ButtonModeManager };

if (typeof window !== 'undefined') {
    window.ButtonModeManager = ButtonModeManager;
}
/* ==== FIM: button-mode-manager.js ==== */
