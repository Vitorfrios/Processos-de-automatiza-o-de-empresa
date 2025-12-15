/* ==== INÍCIO: features/filters/button-mode-manager.js ==== */
/**
 * ButtonModeManager - Gerencia o modo dos botões (normal vs filtro)
 * Versão em Classe ES6 para compatibilidade com import/export
 */
/**
 * ButtonModeManager - Gerencia APENAS a mudança de texto dos botões
 * Versão SIMPLES: muda "Remover" para "Deletar" quando filtro ativo
 */
class ButtonModeManager {
    constructor() {
        this.state = {
            filterMode: false,
            originalTexts: new Map() // Guarda textos originais
        };
        
        console.log('✅ ButtonModeManager criado (versão SIMPLES)');
    }

    /**
     * Ativa o modo filtro (muda textos)
     */
    enableFilterMode() {
        if (this.state.filterMode) return;
        
        console.log('🎛️ [BUTTON-MANAGER] Ativando modo filtro (mudando textos)...');
        this.state.filterMode = true;
        this.changeButtonTexts('Deletar');
    }

    /**
     * Desativa o modo filtro (restaura textos)
     */
    disableFilterMode() {
        if (!this.state.filterMode) return;
        
        console.log('🎛️ [BUTTON-MANAGER] Desativando modo filtro (restaurando textos)...');
        this.state.filterMode = false;
        this.restoreButtonTexts();
    }

    /**
     * Muda textos dos botões
     */
    changeButtonTexts(newText) {
        console.log(`🔄 Mudando textos dos botões para: "${newText}"`);
        
        // 🔥 BUSCAR TODOS OS BOTÕES COM "Remover"
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
                
                // 🔥 MUDAR APENAS O TEXTO, MANTENDO O RESTO
                if (text === 'Remover') {
                    button.textContent = newText;
                } else if (text === 'Remover Projeto') {
                    button.textContent = 'Deletar Projeto';
                } else if (text.includes('Remover')) {
                    button.textContent = text.replace('Remover', newText);
                }
                
                // 🔥 ADICIONAR CLASSE PARA ESTILO (OPCIONAL)
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
        console.log('🔧 [BUTTON-MANAGER] Inicializando (versão SIMPLES)...');
        
        this.setupMutationObserver();
        setTimeout(() => {
            this.applyMode();
        }, 500);
        
        console.log('✅ ButtonModeManager inicializado');
        return true;
    }
}

// 🔥 EXPORTAR
export { ButtonModeManager };

// 🔥 TAMBÉM EXPORTAR PARA WINDOW (para compatibilidade)
if (typeof window !== 'undefined') {
    window.ButtonModeManager = ButtonModeManager;
}
/* ==== FIM: features/filters/button-mode-manager.js ==== */