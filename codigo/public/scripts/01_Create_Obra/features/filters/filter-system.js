/**
 * filter-system.js - Cérebro do sistema de filtros
 * Gerencia estados, switch e endpoint
 * TOTALMENTE MODULAR - não altera funções existentes
 */

const FilterSystem = (function () {
    // Estado interno do filtro
    const state = {
        active: false,
        endpointMode: 'session', // 'session' | 'general'
        filterValues: {
            empresa: null,
            numeroCliente: null,
            nomeObra: null
        },
        systemReady: false,
        isLoading: false,
        currentObras: [] // Cache das obras carregadas
    };

    // Referências DOM
    let filterToggle = null;
    let filterSwitchArea = null;

    /**
     * Inicializa o sistema de filtros
     */
    function initialize() {
        console.log('🔧 [FILTER-SYSTEM] Inicializando...');

        // Buscar elementos DOM
        filterToggle = document.getElementById('filter-toggle');
        filterSwitchArea = document.querySelector('.filtro-switch-area');

        if (!filterToggle) {
            console.error('❌ [FILTER-SYSTEM] Switch de filtro não encontrado');
            return false;
        }

        // Inicializar outros módulos
        if (window.FilterDOM) {
            window.FilterDOM.initialize();
        }

        // Configurar listener do switch (mas switch ainda desabilitado)
        setupSwitchListener();

        // Aguardar sistema principal carregar (mesma lógica do botão Nova Obra)
        waitForSystemReady();

        console.log('✅ [FILTER-SYSTEM] Inicializado com sucesso');
        return true;
    }

    /**
     * Aguarda sistema principal carregar para habilitar switch
     * MESMA LÓGICA DO BOTÃO "NOVA OBRA"
     */
    function waitForSystemReady() {
        console.log('⏳ [FILTER-SYSTEM] Aguardando sistema principal carregar...');

        const checkInterval = setInterval(() => {
            if (window.systemLoaded) {
                clearInterval(checkInterval);
                state.systemReady = true;
                enableFilterSwitch();
                console.log('✅ [FILTER-SYSTEM] Sistema carregado - switch habilitado');
            }
        }, 500);

        // Timeout de segurança (30 segundos)
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!state.systemReady) {
                console.warn('⚠️ [FILTER-SYSTEM] Timeout ao aguardar sistema carregar');
                // Tenta habilitar mesmo assim (fallback)
                enableFilterSwitch();
            }
        }, 30000);
    }

    /**
     * Habilita o switch de filtro (MESMA LÓGICA DO BOTÃO "NOVA OBRA")
     */
    function enableFilterSwitch() {
        if (!filterToggle) return;

        filterToggle.disabled = false;
        filterToggle.title = 'Ativar filtros avançados';

        if (filterSwitchArea) {
            filterSwitchArea.style.opacity = '1';
            filterSwitchArea.style.cursor = 'pointer';
        }

        console.log('✅ [FILTER-SYSTEM] Switch de filtro habilitado');
    }

    /**
     * Configura listener para mudança do switch
     */
    function setupSwitchListener() {
        filterToggle.addEventListener('change', function (e) {
            const isActive = e.target.checked;
            handleFilterToggleChange(isActive);
        });
    }

    /**
     * Manipula mudança no switch
     */
    function handleFilterToggleChange(isActive) {
        if (state.isLoading) {
            console.log('⏳ [FILTER-SYSTEM] Sistema ocupado, ignorando toggle');
            filterToggle.checked = !isActive; // Reverte visualmente
            return;
        }

        console.log(`🔀 [FILTER-SYSTEM] Switch ${isActive ? 'ATIVADO' : 'DESATIVADO'}`);

        // Atualizar estado
        state.active = isActive;
        state.endpointMode = isActive ? 'general' : 'session';

        // Limpar cache quando desativar
        if (!isActive) {
            state.currentObras = [];
        }

        // Notificar outros módulos
        if (window.FilterDOM) {
            window.FilterDOM.setFiltersEnabled(isActive);
        }

        // Inicializar autocomplete se ativado
        if (window.FilterAutocomplete && isActive) {
            window.FilterAutocomplete.initialize();
        }

        // Atualizar UI do switch
        updateSwitchUI(isActive);

        // Recarregar obras com endpoint correto
        reloadObrasWithCurrentEndpoint();
    }


    /**
     * Atualiza UI do switch
     */
    function updateSwitchUI(isActive) {
        if (!filterSwitchArea) return;

        const label = filterSwitchArea.querySelector('.switch-label-text');
        if (label) {
            label.textContent = isActive
                ? 'Filtro Ativo (Modo Geral)'
                : 'Filtro de Obras';
            label.style.color = isActive ? '#4CAF50' : '#666';
            label.style.fontWeight = isActive ? 'bold' : 'normal';
            label.style.transition = 'color 0.3s ease';
        }

        // Visual feedback no switch
        if (filterSwitchArea) {
            filterSwitchArea.style.backgroundColor = isActive
                ? 'rgba(76, 175, 80, 0.1)'
                : 'transparent';
            filterSwitchArea.style.transition = 'background-color 0.3s ease';
            filterSwitchArea.style.borderRadius = '6px';
            filterSwitchArea.style.padding = isActive ? '8px' : '4px';
        }

        // 🔥 ATUALIZAR: Feedback visual no switch toggle
        const switchElement = document.querySelector('.filter-switch');
        if (switchElement) {
            switchElement.style.boxShadow = isActive
                ? '0 0 10px rgba(76, 175, 80, 0.5)'
                : 'none';
        }
    }

    /**
     * Retorna endpoint correto baseado no estado
     */
    function getCurrentEndpoint() {
        if (state.active) {
            console.log('🌐 [FILTER-SYSTEM] Endpoint: /obras (TODAS as obras)');
            return '/obras';
        } else {
            console.log('🌐 [FILTER-SYSTEM] Endpoint: /api/session-obras (apenas sessão)');
            return '/api/session-obras';
        }
    }

    /**
     * Recarrega obras com endpoint atual + filtros
     */
    async function reloadObrasWithCurrentEndpoint() {
        if (state.isLoading) {
            console.log('⏳ [FILTER-SYSTEM] Já recarregando, ignorando...');
            return;
        }

        state.isLoading = true;
        console.log('🔄 [FILTER-SYSTEM] Recarregando obras...');

        try {
            // Limpar obras atuais (reutiliza função existente)
            clearCurrentObras();

            if (state.active) {
                // Modo filtro: carrega TODAS as obras e aplica filtros
                await loadAndFilterAllObras();
            } else {
                // Modo normal: carrega apenas obras da sessão
                await loadSessionObras();
            }

            console.log('✅ [FILTER-SYSTEM] Obras recarregadas com sucesso');

        } catch (error) {
            console.error('❌ [FILTER-SYSTEM] Erro ao recarregar obras:', error);
        } finally {
            state.isLoading = false;
        }
    }

    /**
     * Limpa obras atuais do DOM
     */
    function clearCurrentObras() {
        console.log('🧹 [FILTER-SYSTEM] Limpando obras atuais do DOM');

        // Tentar usar função existente primeiro
        if (typeof removeBaseObraFromHTML === 'function') {
            removeBaseObraFromHTML();
        } else if (typeof window.removeBaseObraFromHTML === 'function') {
            window.removeBaseObraFromHTML();
        } else {
            // Fallback: limpar container manualmente
            const container = document.getElementById('projects-container');
            if (container) {
                container.innerHTML = '';
                console.log('🗑️ [FILTER-SYSTEM] Container de obras limpo manualmente');
            }
        }

        // Resetar contador se existir
        if (typeof window.resetGeralCount === 'function') {
            window.resetGeralCount();
        }
    }

    /**
     * Carrega TODAS as obras e aplica filtros
     */
    async function loadAndFilterAllObras() {
        console.log('🔍 [FILTER-SYSTEM] Carregando TODAS as obras do endpoint /obras');

        try {
            // 1. Buscar todas as obras
            const response = await fetch('/obras');
            if (!response.ok) {
                throw new Error(`Erro ${response.status} ao buscar obras`);
            }

            const todasObras = await response.json();
            console.log(`📦 [FILTER-SYSTEM] ${todasObras.length} obras disponíveis no servidor`);

            // Salvar cache para filtragem
            state.currentObras = todasObras;

            // 2. Aplicar filtros
            const obrasFiltradas = aplicarFiltros(todasObras);
            console.log(`🎯 [FILTER-SYSTEM] ${obrasFiltradas.length} obras após filtros`);

            // 3. Carregar obras filtradas
            if (obrasFiltradas.length === 0) {
                console.log('📭 [FILTER-SYSTEM] Nenhuma obra corresponde aos filtros');
                return;
            }

            // 4. Carregar cada obra
            for (const obraData of obrasFiltradas) {
                await loadObraIntoDOM(obraData);
            }

        } catch (error) {
            console.error('❌ [FILTER-SYSTEM] Erro ao carregar todas as obras:', error);
            throw error;
        }
    }

    /**
     * Carrega uma obra no DOM (reutilizando sistema existente)
     */
    /**
     * Carrega uma obra no DOM (reutilizando sistema existente) - SEM FALLBACK
     */
    async function loadObraIntoDOM(obraData) {
        try {
            console.log(`🔄 [FILTER-SYSTEM] Carregando obra: ${obraData.nome || obraData.id}`);

            // Verificar se já existe no DOM
            const obraExistente = document.querySelector(`[data-obra-id="${obraData.id}"]`);
            if (obraExistente) {
                console.log(`⚠️ [FILTER-SYSTEM] Obra ${obraData.id} já existe, ignorando`);
                return;
            }

            // 🔥 OPÇÃO 1: Usar loadSingleObra se disponível
            if (window.systemFunctions && typeof window.systemFunctions.loadSingleObra === 'function') {
                console.log(`🔨 [FILTER-SYSTEM] Carregando via loadSingleObra (systemFunctions)`);
                await window.systemFunctions.loadSingleObra(obraData);
            }
            else if (typeof window.loadSingleObra === 'function') {
                console.log(`🔨 [FILTER-SYSTEM] Carregando via loadSingleObra (window)`);
                await window.loadSingleObra(obraData);
            }
            else if (typeof loadSingleObra === 'function') {
                console.log(`🔨 [FILTER-SYSTEM] Carregando via loadSingleObra (global)`);
                await loadSingleObra(obraData);
            }
            // 🔥 OPÇÃO 2: Usar createEmptyObra + populateObraData
            else if (window.systemFunctions &&
                typeof window.systemFunctions.createEmptyObra === 'function' &&
                typeof window.systemFunctions.populateObraData === 'function') {
                console.log(`🔨 [FILTER-SYSTEM] Criando via createEmptyObra + populateObraData`);

                // Criar obra vazia
                await window.systemFunctions.createEmptyObra(obraData.nome || `Obra ${obraData.id}`, obraData.id);

                // Aguardar criação no DOM
                await new Promise(resolve => setTimeout(resolve, 200));

                // Preencher dados
                const obraElement = document.querySelector(`[data-obra-id="${obraData.id}"]`);
                if (obraElement) {
                    await window.systemFunctions.populateObraData(obraData);
                }
            }
            else if (typeof window.createEmptyObra === 'function' && typeof window.populateObraData === 'function') {
                console.log(`🔨 [FILTER-SYSTEM] Criando via createEmptyObra (window) + populateObraData`);

                await window.createEmptyObra(obraData.nome || `Obra ${obraData.id}`, obraData.id);
                await new Promise(resolve => setTimeout(resolve, 200));

                const obraElement = document.querySelector(`[data-obra-id="${obraData.id}"]`);
                if (obraElement) {
                    await window.populateObraData(obraData);
                }
            }
            else {
                // 🔥 CRÍTICO: Se não encontrar funções de carregamento
                console.error(`❌ [FILTER-SYSTEM] NENHUMA função de carregamento disponível para obra ${obraData.id}`);
                console.error('💡 Verifique se estas funções estão disponíveis:');
                console.error('   - loadSingleObra');
                console.error('   - createEmptyObra + populateObraData');

                // Não criar fallback manual - apenas logar erro
                return;
            }

            console.log(`✅ [FILTER-SYSTEM] Obra "${obraData.nome}" carregada com sucesso`);

        } catch (error) {
            console.error(`❌ [FILTER-SYSTEM] Erro ao carregar obra ${obraData.id}:`, error);
        }
    }

    /**
     * Carrega obras da sessão (modo normal)
     */
    /**
     * Carrega obras da sessão (modo normal) - SEM FALLBACK
     */
    async function loadSessionObras() {
        console.log('📁 [FILTER-SYSTEM] Carregando obras da sessão');

        try {
            // 🔥 IMPORTANTE: Limpar DOM completamente primeiro
            clearCurrentObras();

            // 🔥 USAR SOMENTE FUNÇÕES EXPORTADAS - SEM FALLBACK
            if (window.systemFunctions && typeof window.systemFunctions.loadObrasFromServer === 'function') {
                console.log('✅ [FILTER-SYSTEM] Usando loadObrasFromServer do systemFunctions');
                await window.systemFunctions.loadObrasFromServer();
            }
            // 🔥 ALTERNATIVA: função direta no window
            else if (typeof window.loadObrasFromServer === 'function') {
                console.log('✅ [FILTER-SYSTEM] Usando loadObrasFromServer do window');
                await window.loadObrasFromServer();
            }
            // 🔥 ALTERNATIVA: função global direta
            else if (typeof loadObrasFromServer === 'function') {
                console.log('✅ [FILTER-SYSTEM] Usando loadObrasFromServer global');
                await loadObrasFromServer();
            }
            else {
                // 🔥 CRÍTICO: Se não encontrar a função, mostrar erro claro
                console.error('❌ [FILTER-SYSTEM] FUNÇÃO loadObrasFromServer NÃO ENCONTRADA');
                console.error('💡 SOLUÇÃO: Certifique-se que a função está disponível em:');
                console.error('   - window.loadObrasFromServer');
                console.error('   - window.systemFunctions.loadObrasFromServer');
                console.error('   - ou no escopo global (loadObrasFromServer)');

                // Lançar erro para tratamento externo
                throw new Error('Função loadObrasFromServer não disponível para filtros');
            }

            console.log('✅ [FILTER-SYSTEM] Obras da sessão carregadas com sucesso');

        } catch (error) {
            console.error('❌ [FILTER-SYSTEM] ERRO ao carregar sessão:', error);

            // 🔥 IMPORTANTE: Não tentar fallback, apenas propagar o erro
            throw error;
        }
    }

    /**
     * Aplica filtros ao array de obras
     */
    function aplicarFiltros(obras) {
        if (!state.active || !obras || obras.length === 0) {
            return obras; // Se filtro não ativo ou sem obras, retorna todas
        }

        const { empresa, numeroCliente, nomeObra } = state.filterValues;

        // 🔥 CORREÇÃO: Se NENHUM filtro preenchido, retorna TODAS as obras
        const hasActiveFilter = empresa || (numeroCliente !== null && numeroCliente !== undefined) || nomeObra;

        if (!hasActiveFilter) {
            console.log('🔓 [FILTER-SYSTEM] Nenhum filtro ativo - retornando TODAS as obras');
            return obras;
        }

        console.log(`🎯 [FILTER-SYSTEM] Aplicando filtros:`, { empresa, numeroCliente, nomeObra });

        return obras.filter(obra => {
            let passaEmpresa = true;
            let passaNumero = true;
            let passaNome = true;

            // 🔥 FILTRO POR EMPRESA - CORREÇÃO CRÍTICA
            if (empresa) {
                const empresaFiltro = empresa.toUpperCase().trim();

                // Extrair apenas sigla do filtro (remover " - NOME" se existir)
                const filtroSigla = empresaFiltro.includes(' - ')
                    ? empresaFiltro.split(' - ')[0].trim()
                    : empresaFiltro;

                // Verificar em vários campos da obra
                const obraSigla = (obra.empresaSigla || '').toUpperCase().trim();
                const obraNomeCompleto = (obra.empresa || '').toUpperCase().trim();
                const obraNomeEmpresa = (obra.nomeEmpresa || '').toUpperCase().trim();

                // Tentar extrair sigla do nome completo se existir
                let obraSiglaExtraida = '';
                if (obraNomeCompleto.includes(' - ')) {
                    obraSiglaExtraida = obraNomeCompleto.split(' - ')[0].trim();
                }

                passaEmpresa = obraSigla === filtroSigla ||
                    obraSigla.includes(filtroSigla) ||
                    obraNomeCompleto.includes(filtroSigla) ||
                    obraNomeEmpresa.includes(filtroSigla) ||
                    obraSiglaExtraida === filtroSigla ||
                    obraSiglaExtraida.includes(filtroSigla);

                if (!passaEmpresa) {
                    console.log(`❌ [FILTRO] Obra ${obra.id} falhou no filtro empresa:`, {
                        filtro: filtroSigla,
                        obraSigla,
                        obraNomeCompleto,
                        obraNomeEmpresa,
                        obraSiglaExtraida
                    });
                }
            }

            // 🔥 FILTRO POR NÚMERO DO CLIENTE
            if (numeroCliente !== null && numeroCliente !== undefined) {
                const filtroNumero = parseInt(numeroCliente);

                // Verificar em vários campos possíveis
                const obraNumero1 = obra.numeroClienteFinal ? parseInt(obra.numeroClienteFinal) : null;
                const obraNumero2 = obra.numeroCliente ? parseInt(obra.numeroCliente) : null;
                const obraNumero3 = obra.clienteNumero ? parseInt(obra.clienteNumero) : null;
                const obraNumero4 = obra.numero ? parseInt(obra.numero) : null;

                const obraNumeros = [obraNumero1, obraNumero2, obraNumero3, obraNumero4];
                const numerosValidos = obraNumeros.filter(n => n !== null && !isNaN(n));

                passaNumero = numerosValidos.some(n => n === filtroNumero);

                if (!passaNumero) {
                    console.log(`❌ [FILTRO] Obra ${obra.id} falhou no filtro número:`, {
                        filtro: filtroNumero,
                        obraNumeros: numerosValidos
                    });
                }
            }

            // 🔥 FILTRO POR NOME DA OBRA
            if (nomeObra) {
                const filtroNome = nomeObra.toUpperCase().trim();
                const obraNome1 = (obra.nome || '').toUpperCase().trim();
                const obraNome2 = (obra.titulo || '').toUpperCase().trim();
                const obraNome3 = (obra.nomeObra || '').toUpperCase().trim();

                passaNome = obraNome1.includes(filtroNome) ||
                    obraNome2.includes(filtroNome) ||
                    obraNome3.includes(filtroNome);

                if (!passaNome) {
                    console.log(`❌ [FILTRO] Obra ${obra.id} falhou no filtro nome:`, {
                        filtro: filtroNome,
                        obraNome1,
                        obraNome2,
                        obraNome3
                    });
                }
            }

            const passaTodos = passaEmpresa && passaNumero && passaNome;

            if (passaTodos) {
                console.log(`✅ [FILTRO] Obra ${obra.id} passou nos filtros:`, {
                    nome: obra.nome || obra.titulo,
                    empresa: obra.empresaSigla || obra.empresa
                });
            }

            return passaTodos;
        });
    }

    /**
     * Atualiza valor de um filtro específico
     */
    function updateFilterValue(filterName, value) {
        if (state.filterValues.hasOwnProperty(filterName)) {
            const oldValue = state.filterValues[filterName];

            // 🔥 CORREÇÃO: Não atualizar se valor for o mesmo (evita loop)
            if (oldValue === value) {
                return;
            }

            state.filterValues[filterName] = value;
            console.log(`📝 [FILTER-SYSTEM] Filtro "${filterName}" atualizado: ${oldValue} → ${value}`);

            // 🔥 ATUALIZAR: Recarregar SEMPRE que filtro mudar (mesmo que seja null)
            if (state.active) {
                console.log('🔄 [FILTER-SYSTEM] Filtro alterado - recarregando obras...');

                // Debounce para evitar múltiplas recargas rápidas
                clearTimeout(window._filterDebounce);
                window._filterDebounce = setTimeout(() => {
                    reloadObrasWithCurrentEndpoint();
                }, 300);
            }
        }
    }

    /**
     * Limpa todos os filtros
     */
    function clearFilters() {
        console.log('🧹 [FILTER-SYSTEM] Limpando todos os filtros');

        state.filterValues = {
            empresa: null,
            numeroCliente: null,
            nomeObra: null
        };

        // Notificar DOM para limpar inputs
        if (window.FilterDOM) {
            window.FilterDOM.clearFilterInputs();
        }

        // Se filtro ativo, recarregar (para mostrar todas as obras)
        if (state.active) {
            reloadObrasWithCurrentEndpoint();
        }
    }

    /**
     * Retorna estado atual
     */
    function getState() {
        return { ...state };
    }

    /**
     * Verifica se há filtros ativos
     */
    function hasActiveFilters() {
        return state.active && (
            state.filterValues.empresa !== null ||
            state.filterValues.numeroCliente !== null ||
            state.filterValues.nomeObra !== null
        );
    }

    // API pública
    return {
        initialize,
        updateFilterValue,
        clearFilters,
        getState,
        hasActiveFilters,
        getCurrentEndpoint
    };
})();

// Exportar para uso global
window.FilterSystem = FilterSystem;