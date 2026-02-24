/* ==== INÍCIO: features/filters/filter-system.js ==== */
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
        currentObras: [], // Cache das obras carregadas
        modalsDisabled: false // Novo estado para controlar modais
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
        }, 3750);
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
        
        // 🔥 ATUALIZADO: Integração com ButtonModeManager
        if (window.ButtonModeManager) {
            if (isActive) {
                window.ButtonModeManager.enableFilterMode();
                disableModals();
            } else {
                window.ButtonModeManager.disableFilterMode();
                enableModals();
            }
        }
        
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
     * Desativa modais quando filtro está ativo
     */
    function disableModals() {
        console.log('🚫 [FILTER-SYSTEM] Desativando modais...');
        state.modalsDisabled = true;
        
        // Sobrescrever funções de modal temporariamente
        if (window.showConfirmationModal) {
            window._originalShowConfirmationModal = window.showConfirmationModal;
            window.showConfirmationModal = function(...args) {
                console.log('🚫 Modal bloqueado - filtro ativo');
                return null; // Retorna null para indicar que o modal não foi mostrado
            };
        }
        
        // Sobrescrever função undoDeletion se existir
        if (window.undoDeletion) {
            window._originalUndoDeletion = window.undoDeletion;
            window.undoDeletion = function(...args) {
                console.log('🚫 Undo deletion bloqueado - filtro ativo');
                return false;
            };
        }
        
        // Ocultar modais existentes
        const modals = document.querySelectorAll('.modal, .confirmation-modal, .exit-modal, [class*="modal"]');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
        });
    }
    
    /**
     * Reativa modais quando filtro está desativado
     */
    function enableModals() {
        console.log('✅ [FILTER-SYSTEM] Reativando modais...');
        state.modalsDisabled = false;
        
        // Restaurar funções originais
        if (window._originalShowConfirmationModal) {
            window.showConfirmationModal = window._originalShowConfirmationModal;
            delete window._originalShowConfirmationModal;
        }
        
        if (window._originalUndoDeletion) {
            window.undoDeletion = window._originalUndoDeletion;
            delete window._originalUndoDeletion;
        }
        
        // Mostrar modais novamente (se aplicável)
        const modals = document.querySelectorAll('.modal, .confirmation-modal, .exit-modal, [class*="modal"]');
        modals.forEach(modal => {
            modal.style.display = '';
            modal.style.visibility = '';
        });
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
            console.log('🌐 [FILTER-SYSTEM] Endpoint: /api/backup-completo (TODAS as obras)');
            return '/api/backup-completo';
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
        console.log('🔍 [FILTER-SYSTEM] Carregando TODAS as obras...');

        try {
            // 1. Tentar diferentes endpoints para obter todas as obras
            let todasObras = [];
            let endpointUsed = '';
            
            // 🔥 ENDPOINTS ESPECÍFICOS PARA TODAS AS OBRAS (conforme sua API)
            const endpointsToTry = [
                '/api/backup-completo',  // Primeiro endpoint
                '/obras',                 // Segundo endpoint
                '/api/obras',             // Terceiro (fallback)
                '/all-obras'              // Quarto (fallback)
            ];
            
            for (const endpoint of endpointsToTry) {
                try {
                    console.log(`🔍 [FILTER-SYSTEM] Tentando endpoint: ${endpoint}`);
                    const response = await fetch(endpoint);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        // 🔥 ADAPTAÇÃO: Verificar estrutura da resposta
                        // Pode ser um array direto ou um objeto com propriedade 'obras'
                        if (Array.isArray(data)) {
                            todasObras = data;
                        } else if (data.obras && Array.isArray(data.obras)) {
                            todasObras = data.obras;
                        } else if (data.data && Array.isArray(data.data)) {
                            todasObras = data.data;
                        } else {
                            console.warn(`⚠️ [FILTER-SYSTEM] Estrutura inesperada do endpoint ${endpoint}:`, data);
                            continue;
                        }
                        
                        endpointUsed = endpoint;
                        console.log(`✅ [FILTER-SYSTEM] ${todasObras.length} obras carregadas de ${endpoint}`);
                        break;
                    }
                } catch (endpointError) {
                    console.log(`⚠️ [FILTER-SYSTEM] Endpoint ${endpoint} falhou:`, endpointError.message);
                    continue;
                }
            }
            
            // Se nenhum endpoint funcionou, lançar erro
            if (todasObras.length === 0) {
                throw new Error('Não foi possível carregar obras de nenhum endpoint');
            }

            // 🔥 CORREÇÃO: Garantir que os dados completos estão no cache
            state.currentObras = todasObras.map(obra => ({
                ...obra,
                empresaSigla: obra.empresaSigla || obra.empresaSigla || '',
                empresaNome: obra.empresaNome || obra.empresaNome || '',
                numeroClienteFinal: obra.numeroClienteFinal || obra.numeroCliente || null,
                // 🔥 IMPORTANTE: Garantir que empresa_id também está disponível
                empresa_id: obra.empresa_id || obra.empresa_id || ''
            }));

            // 2. Aplicar filtros
            const obrasFiltradas = aplicarFiltros(state.currentObras);
            console.log(`🎯 [FILTER-SYSTEM] ${obrasFiltradas.length} obras após filtros`);

            // 🔥 VERIFICAÇÃO: Log das obras filtradas
            if (obrasFiltradas.length > 0) {
                console.log('📋 [FILTER-SYSTEM] Obras filtradas (primeiras 3):', 
                    obrasFiltradas.slice(0, 3).map(o => ({
                        id: o.id,
                        nome: o.nome,
                        empresaSigla: o.empresaSigla,
                        empresaNome: o.empresaNome,
                        empresa_id: o.empresa_id
                    }))
                );
            }

            // 3. Carregar obras filtradas
            if (obrasFiltradas.length === 0) {
                console.log('📭 [FILTER-SYSTEM] Nenhuma obra corresponde aos filtros');
                showNoResultsMessage();
                return;
            }

            // 🔥 CORREÇÃO CRÍTICA: Usar loadSingleObra para garantir que empresa seja carregada
            // 4. Carregar obras usando a função otimizada
            await carregarObrasComEmpresa(obrasFiltradas);

        } catch (error) {
            console.error('❌ [FILTER-SYSTEM] Erro ao carregar todas as obras:', error);
            showErrorMessage('Não foi possível carregar as obras. Verifique o servidor.');
        }
    }
    
    /**
     * 🔥 NOVA FUNÇÃO: Carrega obras garantindo dados da empresa
     */
    async function carregarObrasComEmpresa(obrasFiltradas) {
        console.log(`🏗️ [FILTER-SYSTEM] Carregando ${obrasFiltradas.length} obras com suporte a empresa...`);
        
        // Criar todas as estruturas primeiro (em paralelo)
        if (window.createEmptyObra) {
            const createPromises = obrasFiltradas.map(obra => 
                window.createEmptyObra(obra.nome || `Obra ${obra.id}`, obra.id)
                    .catch(e => {
                        console.warn(`⚠️ Falha ao criar obra ${obra.id}:`, e.message);
                        return null;
                    })
            );
            
            await Promise.allSettled(createPromises);
            
            // Aguardar DOM se estabilizar
            await new Promise(resolve => setTimeout(resolve, 12));
        }
        
        // 🔥 CORREÇÃO: Usar loadSingleObra para cada obra (já inclui prepararDadosEmpresaNaObra)
        for (const obraData of obrasFiltradas) {
            try {
                console.log(`🔄 [FILTER-SYSTEM] Carregando obra ${obraData.nome} com dados de empresa...`);
                
                // Opção 1: Usar loadSingleObra se disponível (que já chama prepararDadosEmpresaNaObra)
                if (typeof window.loadSingleObra === 'function') {
                    const result = await window.loadSingleObra(obraData);
                    console.log(`✅ [FILTER-SYSTEM] Obra ${obraData.nome} carregada: ${result ? 'sucesso' : 'falha'}`);
                }
                // Opção 2: Usar populateObraData + prepararDadosEmpresaNaObra manualmente
                else if (typeof window.populateObraData === 'function') {
                    const obraElement = document.querySelector(`[data-obra-id="${obraData.id}"]`);
                    if (obraElement) {
                        // Primeiro: popular dados básicos
                        await window.populateObraData(obraData);
                        
                        // Segundo: preparar dados da empresa (CRÍTICO)
                        if (typeof window.prepararDadosEmpresaNaObra === 'function') {
                            await window.prepararDadosEmpresaNaObra(obraData, obraElement);
                            console.log(`✅ [FILTER-SYSTEM] Dados de empresa preparados para ${obraData.nome}`);
                        } else {
                            console.warn(`⚠️ [FILTER-SYSTEM] prepararDadosEmpresaNaObra não disponível para ${obraData.nome}`);
                        }
                    } else {
                        console.error(`❌ [FILTER-SYSTEM] Elemento não encontrado para obra ${obraData.id}`);
                    }
                }
                else {
                    console.error(`❌ [FILTER-SYSTEM] Nenhuma função de carregamento disponível para ${obraData.id}`);
                }
            } catch (error) {
                console.error(`❌ [FILTER-SYSTEM] Erro ao carregar obra ${obraData.id}:`, error);
            }
        }
        
        console.log(`✅ [FILTER-SYSTEM] ${obrasFiltradas.length} obras carregadas com suporte a empresa`);
    }
    
    /**
     * Mostra mensagem quando não há resultados
     */
    function showNoResultsMessage() {
        const container = document.getElementById('projects-container');
        if (container) {
            container.innerHTML = `
                <div class="no-results-message" style="text-align: center; padding: 40px; color: #666;">
                    <h3>Nenhuma obra encontrada com os filtros aplicados</h3>
                    <p>Tente ajustar os critérios de busca</p>
                </div>
            `;
        }
    }
    
    /**
     * Mostra mensagem de erro
     */
    function showErrorMessage(message) {
        const container = document.getElementById('projects-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 40px; color: #d32f2f;">
                    <h3>Erro ao carregar obras</h3>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px;">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
    }

    /**
     * 🔥 ATUALIZADA: Carrega obras da sessão (modo normal)
     */
    async function loadSessionObras() {
        console.log('📁 [FILTER-SYSTEM] Carregando obras da sessão');

        try {
            // 🔥 IMPORTANTE: Limpar DOM completamente primeiro
            clearCurrentObras();

            // 🔥 NOVA ABORDAGEM: Usar loadObrasFromServer importada diretamente
            if (typeof loadObrasFromServer === 'function') {
                console.log('✅ [FILTER-SYSTEM] Usando loadObrasFromServer do escopo global');
                await loadObrasFromServer();
            } 
            // Fallback: tentar outras localizações
            else if (window.loadObrasFromServer && typeof window.loadObrasFromServer === 'function') {
                console.log('✅ [FILTER-SYSTEM] Usando loadObrasFromServer do window');
                await window.loadObrasFromServer();
            } 
            else if (window.systemFunctions && window.systemFunctions.loadObrasFromServer && 
                     typeof window.systemFunctions.loadObrasFromServer === 'function') {
                console.log('✅ [FILTER-SYSTEM] Usando loadObrasFromServer do systemFunctions');
                await window.systemFunctions.loadObrasFromServer();
            } 
            else {
                console.warn('⚠️ [FILTER-SYSTEM] Nenhuma função encontrada');
                throw new Error('Função de carregamento não encontrada');
            }

            console.log('✅ [FILTER-SYSTEM] Obras da sessão carregadas com sucesso');

        } catch (error) {
            console.error('❌ [FILTER-SYSTEM] ERRO ao carregar sessão:', error);
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
                const obraNomeCompleto = (obra.empresaNome || obra.empresa || '').toUpperCase().trim();
                const obraNomeEmpresa = (obra.nomeEmpresa || '').toUpperCase().trim();

                // 🔥 NOVA VERIFICAÇÃO: Verificar também empresa_id
                const obraEmpresaId = (obra.empresa_id || '').toUpperCase().trim();

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
                    obraSiglaExtraida.includes(filtroSigla) ||
                    obraEmpresaId.includes(filtroSigla);
                
                console.log(`🔍 [FILTER-SYSTEM] Filtro empresa "${filtroSigla}" vs obra "${obraSigla}": ${passaEmpresa}`);
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
                
                console.log(`🔍 [FILTER-SYSTEM] Filtro número "${filtroNumero}" vs obra "${obraNumero1}": ${passaNumero}`);
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
                    
                console.log(`🔍 [FILTER-SYSTEM] Filtro nome "${filtroNome}" vs obra "${obraNome1}": ${passaNome}`);
            }

            const resultado = passaEmpresa && passaNumero && passaNome;
            if (resultado) {
                console.log(`✅ [FILTER-SYSTEM] Obra "${obra.nome}" passou nos filtros`);
            }
            
            return resultado;
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
                }, 62); // 🔥 Aumentado para 500ms para evitar sobrecarga
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
    
    /**
     * Recarrega obras com endpoint atual (para uso externo)
     */
    function reloadObras() {
        return reloadObrasWithCurrentEndpoint();
    }
    
    /**
     * Retorna se o filtro está ativo
     */
    function isFilterActive() {
        return state.active;
    }
    
    /**
     * 🔥 NOVA FUNÇÃO: Forçar recarregamento de dados da empresa
     */
    async function recarregarDadosEmpresa() {
        if (!state.active || state.currentObras.length === 0) {
            console.log('📭 [FILTER-SYSTEM] Nenhuma obra para recarregar empresa');
            return;
        }
        
        console.log('🔄 [FILTER-SYSTEM] Recarregando dados de empresa nas obras visíveis...');
        
        const obrasVisiveis = document.querySelectorAll('.obra-block[data-obra-id]');
        for (const obraElement of obrasVisiveis) {
            try {
                const obraId = obraElement.dataset.obraId;
                
                // Encontrar dados completos da obra
                const obraData = state.currentObras.find(o => o.id === obraId || o.id.toString() === obraId);
                
                if (obraData && typeof window.prepararDadosEmpresaNaObra === 'function') {
                    await window.prepararDadosEmpresaNaObra(obraData, obraElement);
                    console.log(`✅ [FILTER-SYSTEM] Dados de empresa recarregados para obra ${obraId}`);
                }
            } catch (error) {
                console.error(`❌ [FILTER-SYSTEM] Erro ao recarregar empresa:`, error);
            }
        }
    }

    // API pública
    return {
        initialize,
        updateFilterValue,
        clearFilters,
        getState,
        hasActiveFilters,
        getCurrentEndpoint,
        reloadObrasWithCurrentEndpoint,
        reloadObras,
        isFilterActive,
        handleFilterToggleChange, // 🔥 EXPORTADO para integração
        recarregarDadosEmpresa // 🔥 NOVA FUNÇÃO exportada
    };
})();

// Exportar para uso global
window.FilterSystem = FilterSystem;

// 🔥 CORREÇÃO FINAL: Adicionar evento para recarregar empresa quando filtro mudar
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que tudo está carregado
    setTimeout(() => {
        if (window.FilterSystem && window.FilterDOM) {
            // Monitorar mudanças nos inputs de filtro
            const inputs = document.querySelectorAll('#filter-empresa, #filter-numero-cliente, #filter-nome-obra');
            inputs.forEach(input => {
                input.addEventListener('change', function() {
                    // Pequeno delay antes de recarregar empresa
                    setTimeout(() => {
                        if (window.FilterSystem.isFilterActive()) {
                            window.FilterSystem.recarregarDadosEmpresa();
                        }
                    }, 125);
                });
            });
        }
    }, 750);
});
/* ==== FIM: features/filters/filter-system.js ==== */