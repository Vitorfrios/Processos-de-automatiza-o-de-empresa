/* ==== INÍCIO: button-mode-manager.js ==== */
/**
 * ButtonModeManager - Gerencia APENAS a mudança de texto dos botões
 * Versão SIMPLES: muda "Remover" para "Deletar" quando filtro ativo
 * COM INTEGRAÇÃO com ButtonDeleteUniversal
 */
class ButtonModeManager {
    constructor() {
        this.state = {
            filterMode: false,
            originalTexts: new Map()
        };
        
        console.log('✅ ButtonModeManager criado (versão COM INTEGRAÇÃO)');
    }

    /**
     * Ativa o modo filtro (muda textos)
     */
    enableFilterMode() {
        if (this.state.filterMode) return;
        
        console.log('🎛️ [BUTTON-MANAGER] Ativando modo filtro...');
        this.state.filterMode = true;
        this.changeButtonTexts('Deletar');
        
        // 🔥 ATIVAR ButtonDeleteUniversal
        if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.setupAllDeleteButtons) {
            setTimeout(() => {
                window.ButtonDeleteUniversal.setupAllDeleteButtons();
                console.log('✅ [BUTTON-MANAGER] ButtonDeleteUniversal ativado');
            }, 300);
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
        
        // 🔥 DESATIVAR ButtonDeleteUniversal
        this.disableUniversalDeleteButtons();
    }

    /**
     * 🔥 NOVO: Desativa botões universais quando filtro desativado
     */
    disableUniversalDeleteButtons() {
        if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.restoreOriginalButtons) {
            const restoredCount = window.ButtonDeleteUniversal.restoreOriginalButtons();
            console.log(`✅ [BUTTON-MANAGER] ${restoredCount} botões universais desativados`);
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
            
            console.log(`✅ [BUTTON-MANAGER] ${deleteButtons.length} botões restaurados manualmente`);
        }
    }

    /**
     * Muda textos dos botões
     */
    changeButtonTexts(newText) {
        console.log(`🔄 Mudando textos dos botões para: "${newText}"`);
        
        const allButtons = document.querySelectorAll('button');
        
        allButtons.forEach(button => {
            const text = button.textContent?.trim();
            const onclick = button.getAttribute('onclick') || '';
            
            // Apenas botões que têm "Remover" e onclick com "delete"
            if (text && text.includes('Remover') && onclick.includes('delete')) {
                // Guardar texto original se não guardado ainda
                if (!this.state.originalTexts.has(button)) {
                    this.state.originalTexts.set(button, text);
                }
                
                if (text === 'Remover') {
                    button.textContent = newText;
                } else if (text === 'Remover Projeto') {
                    button.textContent = 'Deletar Projeto';
                } else if (text.includes('Remover')) {
                    button.textContent = text.replace('Remover', newText);
                }
                
                // Adicionar classe para estilo
                button.classList.add('filter-mode-active');
                button.style.fontWeight = 'bold';
                
                console.log(`✅ Texto alterado: "${this.state.originalTexts.get(button)}" → "${button.textContent}"`);
            }
        });
        
        console.log(`🎯 Textos alterados para modo filtro`);
    }

    /**
     * Restaura textos originais
     */
    restoreButtonTexts() {
        console.log('🔄 Restaurando textos originais...');
        
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
                    // Se novos botões foram adicionados e estamos no modo filtro
                    setTimeout(() => {
                        this.changeButtonTexts('Deletar');
                        
                        // Configurar botões de deleção universal
                        if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.setupAllDeleteButtons) {
                            window.ButtonDeleteUniversal.setupAllDeleteButtons();
                        }
                    }, 100);
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('🔍 Observador configurado para novos botões');
        return observer;
    }

    /**
     * Inicializa o gerenciador
     */
    initialize() {
        console.log('🔧 [BUTTON-MANAGER] Inicializando (versão COM INTEGRAÇÃO)...');
        
        this.setupMutationObserver();
        setTimeout(() => {
            this.applyMode();
        }, 500);
        
        console.log('✅ ButtonModeManager inicializado');
        return true;
    }
}

export { ButtonModeManager };

if (typeof window !== 'undefined') {
    window.ButtonModeManager = ButtonModeManager;
}
/* ==== FIM: button-mode-manager.js ==== */