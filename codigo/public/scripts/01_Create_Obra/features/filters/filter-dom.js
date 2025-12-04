/**
 * filter-dom.js - Interface gráfica dos filtros
 * Gerencia DOM, inputs e estados visuais
 */

const FilterDOM = (function() {
    // Elementos DOM
    let filterInputsArea = null;
    let empresaInput = null;
    let numeroClienteInput = null;
    let nomeObraInput = null;
    let inputsInitialized = false;

    /**
     * Inicializa o módulo DOM
     */
    function initialize() {
        console.log('🔧 [FILTER-DOM] Inicializando...');
        
        // Buscar elementos
        filterInputsArea = document.getElementById('filtros-inputs');
        empresaInput = document.getElementById('filter-empresa');
        numeroClienteInput = document.getElementById('filter-numero-cliente');
        nomeObraInput = document.getElementById('filter-nome-obra');
        
        if (!validateElements()) {
            console.error('❌ [FILTER-DOM] Elementos dos filtros não encontrados');
            return false;
        }
        
        // Inicialmente desabilitado
        setFiltersEnabled(false);
        
        console.log('✅ [FILTER-DOM] Inicializado com sucesso');
        return true;
    }

    /**
     * Valida se elementos existem
     */
    function validateElements() {
        const elements = [filterInputsArea, empresaInput, numeroClienteInput, nomeObraInput];
        const allExist = elements.every(el => el !== null);
        
        if (!allExist) {
            console.warn('⚠️ [FILTER-DOM] Alguns elementos não encontrados:', {
                filterInputsArea: !!filterInputsArea,
                empresaInput: !!empresaInput,
                numeroClienteInput: !!numeroClienteInput,
                nomeObraInput: !!nomeObraInput
            });
        }
        
        return allExist;
    }

    /**
     * Habilita/desabilita os inputs de filtro
     */
    function setFiltersEnabled(enabled) {
        console.log(`🎚️ [FILTER-DOM] ${enabled ? 'Habilitando' : 'Desabilitando'} inputs`);
        
        // Aplicar a todos os inputs
        [empresaInput, numeroClienteInput, nomeObraInput].forEach(input => {
            if (input) {
                input.disabled = !enabled;
                input.style.opacity = enabled ? '1' : '0.6';
                input.style.cursor = enabled ? 'text' : 'not-allowed';
                
                // Limpar quando desabilitado
                if (!enabled) {
                    input.value = '';
                    input.placeholder = getOriginalPlaceholder(input.id);
                }
            }
        });
        
        // Área de inputs
        if (filterInputsArea) {
            filterInputsArea.style.opacity = enabled ? '1' : '0.7';
            filterInputsArea.style.pointerEvents = enabled ? 'auto' : 'none';
        }
        
        // Configurar listeners apenas quando habilitado pela primeira vez
        if (enabled && !inputsInitialized) {
            setupInputListeners();
            inputsInitialized = true;
        }
        
        // Se desabilitando, notificar sistema
        if (!enabled && window.FilterSystem) {
            window.FilterSystem.clearFilters();
        }
    }

    /**
     * Retorna placeholder original
     */
    function getOriginalPlaceholder(inputId) {
        const placeholders = {
            'filter-empresa': 'Empresa',
            'filter-numero-cliente': 'Nº Cliente',
            'filter-nome-obra': 'Nome da Obra'
        };
        return placeholders[inputId] || '';
    }

    /**
     * Limpa todos os inputs
     */
    function clearFilterInputs() {
        console.log('🧹 [FILTER-DOM] Limpando inputs');
        
        [empresaInput, numeroClienteInput, nomeObraInput].forEach(input => {
            if (input) {
                input.value = '';
                
                // Disparar eventos
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    /**
     * Configura listeners nos inputs
     */
    function setupInputListeners() {
        if (!empresaInput || !numeroClienteInput || !nomeObraInput) return;
        
        console.log('🎧 [FILTER-DOM] Configurando listeners');
        
        // 🔥 CORREÇÃO: Usar 'input' em vez de 'change' para empresa
        // Para capturar seleção do autocomplete e digitação manual
        empresaInput.addEventListener('input', debounce(function(e) {
            const value = e.target.value.trim();
            console.log(`🏢 [FILTER-DOM] Empresa alterada: "${value}"`);
            
            if (window.FilterSystem) {
                // Enviar valor completo para filtro (o sistema extrairá a sigla)
                window.FilterSystem.updateFilterValue('empresa', value || null);
            }
        }, 500));
        
        // Listener para número do cliente (com debounce)
        numeroClienteInput.addEventListener('input', debounce(function(e) {
            const value = e.target.value.trim();
            const numValue = value ? parseInt(value) : null;
            
            console.log(`🔢 [FILTER-DOM] Nº Cliente alterado: ${value}`);
            
            if (window.FilterSystem) {
                window.FilterSystem.updateFilterValue('numeroCliente', numValue);
            }
        }, 500));
        
        // Listener para nome da obra (com debounce)
        nomeObraInput.addEventListener('input', debounce(function(e) {
            const value = e.target.value.trim();
            
            console.log(`🏗️ [FILTER-DOM] Nome obra alterado: "${value}"`);
            
            if (window.FilterSystem) {
                window.FilterSystem.updateFilterValue('nomeObra', value || null);
            }
        }, 500));
        
        // Clear on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && window.FilterSystem) {
                window.FilterSystem.clearFilters();
            }
        });
    }

    /**
     * Debounce helper
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Retorna valores atuais dos inputs
     */
    function getFilterValues() {
        return {
            empresa: empresaInput ? empresaInput.value.trim() : '',
            numeroCliente: numeroClienteInput ? numeroClienteInput.value.trim() : '',
            nomeObra: nomeObraInput ? nomeObraInput.value.trim() : ''
        };
    }

    /**
     * Atualiza placeholder dinamicamente (para dicas)
     */
    function updatePlaceholders(count) {
        if (!empresaInput || !nomeObraInput) return;
        
        if (count > 0) {
            empresaInput.placeholder = `Empresa (${count} obras)`;
            nomeObraInput.placeholder = `Nome da Obra (${count} obras)`;
        } else {
            empresaInput.placeholder = getOriginalPlaceholder('filter-empresa');
            nomeObraInput.placeholder = getOriginalPlaceholder('filter-nome-obra');
        }
    }

    // API pública
    return {
        initialize,
        setFiltersEnabled,
        clearFilterInputs,
        getFilterValues,
        updatePlaceholders
    };
})();

// Exportar para uso global
window.FilterDOM = FilterDOM;