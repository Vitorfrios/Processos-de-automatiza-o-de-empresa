/**
 * filter-dom.js - Interface gráfica dos filtros
 * Gerencia DOM, inputs e estados visuais
 */

const FilterDOM = (function () {
    // Elementos DOM
    let filterInputsArea = null;
    let empresaInput = null;
    let numeroClienteInput = null;
    let nomeObraInput = null;
    let inputsInitialized = false;

    /**
     * Inicializa o módulo DOM
     */
    /**
     * Inicializa o módulo DOM
     */
    function initialize() {
        console.log(' [FILTER-DOM] Inicializando...');

        // Buscar elementos
        filterInputsArea = document.getElementById('filtros-inputs');
        empresaInput = document.getElementById('filter-empresa');
        numeroClienteInput = document.getElementById('filter-numero-cliente');
        nomeObraInput = document.getElementById('filter-nome-obra');

        if (!validateElements()) {
            console.error('❌ [FILTER-DOM] Elementos dos filtros não encontrados');
            return false;
        }

        // 🔥 INICIALIZAR OCULTO (não desabilitado, mas invisível)
        setFiltersEnabled(false);

        console.log('✅ [FILTER-DOM] Inicializado com sucesso (inputs ocultos)');
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
    /**
     * Habilita/desabilita os inputs de filtro
     */
    function setFiltersEnabled(enabled) {
        console.log(`🎚️ [FILTER-DOM] ${enabled ? 'Habilitando' : 'Desabilitando'} inputs`);

        // 🔥 CORREÇÃO: Controlar VISIBILIDADE além de habilitação
        [empresaInput, numeroClienteInput, nomeObraInput].forEach(input => {
            if (input) {
                // 🔥 IMPORTANTE: Controlar display/visibility
                if (enabled) {
                    // Mostrar e habilitar inputs
                    input.style.display = 'block';
                    input.style.visibility = 'visible';
                    input.style.opacity = '1';
                    input.disabled = false;
                    input.style.cursor = 'text';
                    input.style.height = 'auto';
                    input.style.marginTop = '4px';
                    input.style.pointerEvents = 'auto';
                } else {
                    // 🔥 OCULTAR COMPLETAMENTE quando desabilitado
                    input.style.display = 'none';
                    input.style.visibility = 'hidden';
                    input.style.opacity = '0';
                    input.disabled = true;
                    input.style.cursor = 'default';
                    input.style.height = '0';
                    input.style.marginTop = '0';
                    input.style.pointerEvents = 'none';
                    input.value = '';

                    // Disparar eventos de limpeza
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });

        // 🔥 Área de inputs - controlar altura
        if (filterInputsArea) {
            if (enabled) {
                // Mostrar área com transição suave
                filterInputsArea.style.display = 'flex'; // ou 'flex' dependendo do CSS
                filterInputsArea.style.visibility = 'visible';
                filterInputsArea.style.opacity = '1';
                filterInputsArea.style.height = 'auto';
                filterInputsArea.style.maxHeight = '200px';
                filterInputsArea.style.transition = 'all 0.3s ease';
                filterInputsArea.style.pointerEvents = 'auto';
                filterInputsArea.style.marginTop = '8px';
            } else {
                // Ocultar área completamente
                filterInputsArea.style.display = 'none';
                filterInputsArea.style.visibility = 'hidden';
                filterInputsArea.style.opacity = '0';
                filterInputsArea.style.height = '0';
                filterInputsArea.style.maxHeight = '0';
                filterInputsArea.style.overflow = 'hidden';
                filterInputsArea.style.pointerEvents = 'none';
                filterInputsArea.style.marginTop = '0';
                filterInputsArea.style.padding = '0';
                filterInputsArea.style.border = 'none';
            }
        }

        // 🔥 Configurar listeners apenas quando habilitado pela primeira vez
        if (enabled && !inputsInitialized) {
            setupInputListeners();
            inputsInitialized = true;
        }

        // 🔥 Se desabilitando, notificar sistema para limpar filtros
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
        empresaInput.addEventListener('input', debounce(function (e) {
            const value = e.target.value.trim();
            console.log(`🏢 [FILTER-DOM] Empresa alterada: "${value}"`);

            if (window.FilterSystem) {
                // Enviar valor completo para filtro (o sistema extrairá a sigla)
                window.FilterSystem.updateFilterValue('empresa', value || null);
            }
        }, 500));

        // Listener para número do cliente (com debounce)
        numeroClienteInput.addEventListener('input', debounce(function (e) {
            const value = e.target.value.trim();
            const numValue = value ? parseInt(value) : null;

            console.log(`🔢 [FILTER-DOM] Nº Cliente alterado: ${value}`);

            if (window.FilterSystem) {
                window.FilterSystem.updateFilterValue('numeroCliente', numValue);
            }
        }, 500));

        // Listener para nome da obra (com debounce)
        nomeObraInput.addEventListener('input', debounce(function (e) {
            const value = e.target.value.trim();

            console.log(`🏗️ [FILTER-DOM] Nome obra alterado: "${value}"`);

            if (window.FilterSystem) {
                window.FilterSystem.updateFilterValue('nomeObra', value || null);
            }
        }, 500));

        // Clear on Escape key
        document.addEventListener('keydown', function (e) {
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
