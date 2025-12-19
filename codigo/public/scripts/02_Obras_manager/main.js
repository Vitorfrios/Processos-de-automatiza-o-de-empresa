/* ==== INÍCIO: main.js ==== */
/**
 * main.js - Sistema de Gerenciamento de Obras (Página 2)
 * EXATAMENTE igual ao filtro ativo da página 1
 */

// Estado do sistema
const obrasManager = {
    state: {
        isLoading: false,
        obras: [],
        filteredObras: [],
        filters: {
            empresa: '',
            numeroCliente: '',
            nomeObra: ''
        }
    },
    
    // 🔥 FUNÇÕES COPIADAS DO filter-system.js
    
    /**
     * Carrega TODAS as obras (igual a loadAndFilterAllObras)
     */
    async loadAllObras() {
        console.log('📥 Carregando TODAS as obras...');
        this.state.isLoading = true;
        
        try {
            // Limpar obras atuais
            this.clearCurrentObras();
            
            // Buscar todas as obras do endpoint
            const response = await fetch('/api/backup-completo');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extrair obras da resposta
            let todasObras = [];
            if (Array.isArray(data)) {
                todasObras = data;
            } else if (data.obras && Array.isArray(data.obras)) {
                todasObras = data.obras;
            } else if (data.data && Array.isArray(data.data)) {
                todasObras = data.data;
            }
            
            console.log(`✅ ${todasObras.length} obras carregadas`);
            
            // Salvar no estado
            this.state.obras = todasObras;
            this.state.filteredObras = todasObras;
            
            // Renderizar cada obra
            for (const obraData of todasObras) {
                await this.loadObraIntoDOM(obraData);
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar obras:', error);
            this.showError('Não foi possível carregar as obras: ' + error.message);
        } finally {
            this.state.isLoading = false;
        }
    },
    
    /**
     * Carrega uma obra no DOM (EXATAMENTE igual a loadObraIntoDOM do filter-system.js)
     */
    async loadObraIntoDOM(obraData) {
        try {
            console.log(`🔄 Carregando obra: ${obraData.nome || obraData.id}`);
            
            // Verificar se já existe no DOM
            const obraExistente = document.querySelector(`[data-obra-id="${obraData.id}"]`);
            if (obraExistente) {
                console.log(`⚠️ Obra ${obraData.id} já existe, ignorando`);
                return;
            }
            
            // 🔥 TENTAR AS MESMAS FUNÇÕES DO SISTEMA DA PÁGINA 1
            
            // OPÇÃO 1: Usar loadSingleObra se disponível
            if (window.systemFunctions && typeof window.systemFunctions.loadSingleObra === 'function') {
                console.log(`🔨 Carregando via loadSingleObra (systemFunctions)`);
                await window.systemFunctions.loadSingleObra(obraData);
            }
            else if (typeof window.loadSingleObra === 'function') {
                console.log(`🔨 Carregando via loadSingleObra (window)`);
                await window.loadSingleObra(obraData);
            }
            else if (typeof loadSingleObra === 'function') {
                console.log(`🔨 Carregando via loadSingleObra (global)`);
                await loadSingleObra(obraData);
            }
            // OPÇÃO 2: Usar createEmptyObra + populateObraData
            else if (window.systemFunctions &&
                typeof window.systemFunctions.createEmptyObra === 'function' &&
                typeof window.systemFunctions.populateObraData === 'function') {
                console.log(`🔨 Criando via createEmptyObra + populateObraData`);
                
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
                console.log(`🔨 Criando via createEmptyObra (window) + populateObraData`);
                
                await window.createEmptyObra(obraData.nome || `Obra ${obraData.id}`, obraData.id);
                await new Promise(resolve => setTimeout(resolve, 200));
                
                const obraElement = document.querySelector(`[data-obra-id="${obraData.id}"]`);
                if (obraElement) {
                    await window.populateObraData(obraData);
                }
            }
            else {
                console.error(`NENHUMA FUNÇÃO FOR ENCONTRADA`);
            }
            
            console.log(`✅ Obra "${obraData.nome}" carregada com sucesso`);
            
        } catch (error) {
            console.error(`❌ Erro ao carregar obra ${obraData.id}:`, error);
        }
    },
    

    
    /**
     * Aplica filtros (igual a aplicarFiltros do filter-system.js)
     */
    aplicarFiltros() {
        const { empresa, numeroCliente, nomeObra } = this.state.filters;
        
        console.log(`🎯 Aplicando filtros:`, { empresa, numeroCliente, nomeObra });
        
        // Se nenhum filtro preenchido, mostrar todas
        const hasActiveFilter = empresa || numeroCliente || nomeObra;
        
        if (!hasActiveFilter) {
            console.log('🔓 Nenhum filtro ativo - mostrando TODAS as obras');
            this.state.filteredObras = this.state.obras;
            this.reloadObrasNoDOM();
            return;
        }
        
        // Filtrar obras
        const obrasFiltradas = this.state.obras.filter(obra => {
            let passaEmpresa = true;
            let passaNumero = true;
            let passaNome = true;
            
            // FILTRO POR EMPRESA
            if (empresa) {
                const empresaFiltro = empresa.toUpperCase().trim();
                const filtroSigla = empresaFiltro.includes(' - ')
                    ? empresaFiltro.split(' - ')[0].trim()
                    : empresaFiltro;
                
                const obraSigla = (obra.empresaSigla || '').toUpperCase().trim();
                const obraNomeCompleto = (obra.empresa || '').toUpperCase().trim();
                const obraNomeEmpresa = (obra.nomeEmpresa || '').toUpperCase().trim();
                
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
            }
            
            // FILTRO POR NÚMERO DO CLIENTE
            if (numeroCliente) {
                const filtroNumero = parseInt(numeroCliente);
                
                const obraNumero1 = obra.numeroClienteFinal ? parseInt(obra.numeroClienteFinal) : null;
                const obraNumero2 = obra.numeroCliente ? parseInt(obra.numeroCliente) : null;
                const obraNumero3 = obra.clienteNumero ? parseInt(obra.clienteNumero) : null;
                const obraNumero4 = obra.numero ? parseInt(obra.numero) : null;
                
                const obraNumeros = [obraNumero1, obraNumero2, obraNumero3, obraNumero4];
                const numerosValidos = obraNumeros.filter(n => n !== null && !isNaN(n));
                
                passaNumero = numerosValidos.some(n => n === filtroNumero);
            }
            
            // FILTRO POR NOME DA OBRA
            if (nomeObra) {
                const filtroNome = nomeObra.toUpperCase().trim();
                const obraNome1 = (obra.nome || '').toUpperCase().trim();
                const obraNome2 = (obra.titulo || '').toUpperCase().trim();
                const obraNome3 = (obra.nomeObra || '').toUpperCase().trim();
                
                passaNome = obraNome1.includes(filtroNome) ||
                    obraNome2.includes(filtroNome) ||
                    obraNome3.includes(filtroNome);
            }
            
            return passaEmpresa && passaNumero && passaNome;
        });
        
        console.log(`📊 ${obrasFiltradas.length} obras após filtros`);
        
        // Atualizar estado
        this.state.filteredObras = obrasFiltradas;
        
        // Recarregar DOM
        this.reloadObrasNoDOM();
    },
    
    /**
     * Recarrega obras no DOM
     */
    async reloadObrasNoDOM() {
        // Limpar DOM
        this.clearCurrentObras();
        
        // Carregar obras filtradas
        for (const obraData of this.state.filteredObras) {
            await this.loadObraIntoDOM(obraData);
        }
        
        // Se não houver obras, mostrar mensagem
        if (this.state.filteredObras.length === 0) {
            this.showNoResults();
        }
    },
    
    /**
     * Limpa obras atuais do DOM
     */
    clearCurrentObras() {
        // Remover todas as obras do DOM, mas manter os filtros
        const obrasElements = document.querySelectorAll('.obra-wrapper, [data-obra-id]');
        obrasElements.forEach(el => {
            // Verificar se não é o container de filtros
            if (!el.closest('.filtro-inputs-area')) {
                el.remove();
            }
        });
    },
    
    /**
     * Mostra mensagem de "nenhuma obra"
     */
    showNoResults() {
        const container = document.getElementById('projects-container');
        const noResultsHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
                <h3>Nenhuma obra encontrada</h3>
                <p>Tente ajustar os critérios de busca</p>
            </div>
        `;
        
        // Inserir após os filtros
        const filters = document.querySelector('.filtro-inputs-area');
        if (filters) {
            filters.insertAdjacentHTML('afterend', noResultsHTML);
        } else {
            container.innerHTML += noResultsHTML;
        }
    },
    
    /**
     * Mostra erro
     */
    showError(message) {
        const container = document.getElementById('projects-container');
        const errorHTML = `
            <div style="text-align: center; padding: 40px; background: #ffebee; border-radius: 8px; color: #c62828;">
                <h3>❌ Erro</h3>
                <p>${message}</p>
                <button onclick="location.reload()" 
                        style="margin-top: 20px; padding: 10px 20px; background: #c62828; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Tentar Novamente
                </button>
            </div>
        `;
        
        container.innerHTML = errorHTML;
    },
    
    /**
     * Configura sistema de deleção permanente
     */
    configurarDelecaoPermanente() {
        console.log('🗑️ Configurando deleção permanente...');
        
        // 🔥 SUBSTITUIR funções de delete por versão PERMANENTE
        // IGUAL ao que acontece quando o filtro está ativo na página 1
        
        // Guardar funções originais
        const originalFunctions = {
            deleteObra: window.deleteObra,
            deleteProject: window.deleteProject,
            deleteRoom: window.deleteRoom,
            deleteMachine: window.deleteMachine
        };
        
        // Função de deleção genérica
        const deleteItemPermanently = async (type, name, path) => {
            const confirmed = confirm(`DELETAR PERMANENTEMENTE ${type.toUpperCase()}?\n\n"${name}"\n\nEsta ação NÃO pode ser desfeita!`);
            
            if (!confirmed) return false;
            
            try {
                const response = await fetch('/api/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: path,
                        itemType: type,
                        itemName: name,
                        timestamp: new Date().toISOString()
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        alert(`✅ ${type} "${name}" deletado permanentemente!`);
                        location.reload(); // Recarregar página
                        return true;
                    }
                }
                throw new Error('Falha na deleção');
            } catch (error) {
                console.error(`❌ Erro ao deletar ${type}:`, error);
                alert(`❌ Erro ao deletar ${type}: ${error.message}`);
                return false;
            }
        };
        
        // Sobrescrever deleteObra
        if (window.deleteObra) {
            window.deleteObra = async (obraName, obraId) => {
                return deleteItemPermanently('obra', obraName, ['obras', obraId]);
            };
            console.log('✅ deleteObra configurada (permanente)');
        }
        
        // Sobrescrever deleteProject
        if (window.deleteProject) {
            window.deleteProject = async (obraId, projectId) => {
                return deleteItemPermanently('projeto', `Projeto ${projectId}`, 
                    ['obras', obraId, 'projetos', projectId]);
            };
            console.log('✅ deleteProject configurada (permanente)');
        }
        
        // Sobrescrever deleteRoom
        if (window.deleteRoom) {
            window.deleteRoom = async (obraId, projectId, roomId) => {
                return deleteItemPermanently('sala', `Sala ${roomId}`,
                    ['obras', obraId, 'projetos', projectId, 'salas', roomId]);
            };
            console.log('✅ deleteRoom configurada (permanente)');
        }
        
        // Sobrescrever deleteMachine
        if (window.deleteMachine) {
            window.deleteMachine = async (machineId) => {
                // Extrair path do machineId
                const parts = machineId.split('_');
                if (parts.length >= 5) {
                    const obraId = `obra_${parts[1]}`;
                    const projectId = `${obraId}_proj_${parts[3]}_${parts[4]}`;
                    const roomId = `${projectId}_sala_${parts[6]}_${parts[7]}`;
                    
                    let machineIndex = 0;
                    for (let i = 0; i < parts.length; i++) {
                        if (parts[i] === 'maquina' && i + 1 < parts.length) {
                            machineIndex = parseInt(parts[i + 1]) || 0;
                            break;
                        }
                    }
                    
                    return deleteItemPermanently('máquina', `Máquina ${machineId}`,
                        ['obras', obraId, 'projetos', projectId, 'salas', roomId, 'maquinas', machineIndex]);
                }
                return false;
            };
            console.log('✅ deleteMachine configurada (permanente)');
        }
    },
    
    /**
     * Inicializa o sistema
     */
    async initialize() {
        console.log('🚀 Inicializando Sistema de Gerenciamento (Página 2)');
        
        // Remover loading inicial
        const loading = document.querySelector('.loading-obras');
        if (loading) loading.remove();
        
        try {
            // 1. Configurar sistema de deleção permanente
            this.configurarDelecaoPermanente();
            
            // 2. Configurar filtros
            this.setupFiltros();
            
            // 3. Carregar todas as obras
            await this.loadAllObras();
            
            console.log('✅ Sistema de gerenciamento pronto!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.showError('Erro ao inicializar sistema: ' + error.message);
        }
    },
    
    /**
     * Configura os filtros (sempre visíveis)
     */
    setupFiltros() {
        console.log('🔧 Configurando filtros...');
        
        // Obter elementos
        const empresaInput = document.getElementById('filter-empresa');
        const numeroInput = document.getElementById('filter-numero-cliente');
        const nomeInput = document.getElementById('filter-nome-obra');
        const applyBtn = document.getElementById('apply-filters');
        const clearBtn = document.getElementById('clear-filters');
        const reloadBtn = document.getElementById('reload-obras');
        
        // Atualizar estado quando inputs mudam
        if (empresaInput) {
            empresaInput.addEventListener('input', (e) => {
                this.state.filters.empresa = e.target.value.trim();
                clearTimeout(this.filterTimeout);
                this.filterTimeout = setTimeout(() => {
                    this.aplicarFiltros();
                }, 500);
            });
        }
        
        if (numeroInput) {
            numeroInput.addEventListener('input', (e) => {
                this.state.filters.numeroCliente = e.target.value.trim();
                clearTimeout(this.filterTimeout);
                this.filterTimeout = setTimeout(() => {
                    this.aplicarFiltros();
                }, 500);
            });
        }
        
        if (nomeInput) {
            nomeInput.addEventListener('input', (e) => {
                this.state.filters.nomeObra = e.target.value.trim();
                clearTimeout(this.filterTimeout);
                this.filterTimeout = setTimeout(() => {
                    this.aplicarFiltros();
                }, 500);
            });
        }
        
        // Botão Aplicar Filtros
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.aplicarFiltros();
            });
        }
        
        // Botão Limpar Filtros
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                // Limpar inputs
                if (empresaInput) empresaInput.value = '';
                if (numeroInput) numeroInput.value = '';
                if (nomeInput) nomeInput.value = '';
                
                // Limpar estado
                this.state.filters = {
                    empresa: '',
                    numeroCliente: '',
                    nomeObra: ''
                };
                
                // Mostrar todas as obras
                this.state.filteredObras = this.state.obras;
                this.reloadObrasNoDOM();
                
                console.log('🧹 Filtros limpos');
            });
        }
        
        // Botão Recarregar
        if (reloadBtn) {
            reloadBtn.addEventListener('click', async () => {
                console.log('🔄 Recarregando todas as obras...');
                await this.loadAllObras();
            });
        }
        
        console.log('✅ Filtros configurados (sempre visíveis)');
    }
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Página 2 - Gerenciamento de Obras');
    obrasManager.initialize();
});

// Expor para debugging
window.obrasManager = obrasManager;
/* ==== FIM: main.js ==== */