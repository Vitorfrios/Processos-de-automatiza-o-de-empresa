// adapters/obra-adapter.js - CORREÇÃO COMPLETA COM EMPRESAS:



/**
 * 🆕 SISTEMA DE DETECÇÃO DE BACKSPACE/DELETE
 */
window.usuarioEstaApagando = false;
window.ultimoValorInput = '';

/**
 * Remove todas as obras base do container HTML
 */
function removeBaseObraFromHTML() {
    const obrasContainer = document.getElementById("projects-container")
    if (!obrasContainer) return

    const existingObras = obrasContainer.querySelectorAll(".obra-block")
    existingObras.forEach((obra) => obra.remove())
}

/**
 * Carrega obras salvas do servidor para a sessão atual - 
 */
async function loadObrasFromServer() {
    console.log("🔄 [LOAD OBRAS] Carregando OBRAS do servidor...");
    
    try {
        const sessionResponse = await fetch('/api/session-obras');
        if (!sessionResponse.ok) {
            console.log("📭 Nenhuma sessão ativa encontrada");
            return;
        }
        
        const sessionData = await sessionResponse.json();
        const obraIds = sessionData.obras || [];
        
        console.log(`📊 [LOAD OBRAS] Sessão com ${obraIds.length} obras:`, obraIds);
        
        if (obraIds.length === 0) {
            console.log("📭 [LOAD OBRAS] Nenhuma obra na sessão");
            return;
        }

        // Buscar TODAS as obras do servidor
        const obrasResponse = await fetch('/obras');
        if (!obrasResponse.ok) {
            console.error("❌ [LOAD OBRAS] Erro ao buscar dados das obras");
            return;
        }

        const todasObras = await obrasResponse.json();
        console.log(`📦 [LOAD OBRAS] ${todasObras.length} obras disponíveis no servidor`);
        
        // Converter IDs da sessão para string e encontrar correspondências
        const obrasDaSessao = todasObras.filter(obra => {
            // Tentar encontrar por ID exato (novo formato)
            if (obraIds.includes(obra.id)) {
                return true;
            }
            
            // Tentar encontrar por ID numérico (compatibilidade com sessão antiga)
            const obraIdNumero = obra.id.toString();
            if (obraIds.includes(obraIdNumero)) {
                return true;
            }
            
            return false;
        });
        
        console.log(`🎯 [LOAD OBRAS] ${obrasDaSessao.length} obras da sessão encontradas:`, 
            obrasDaSessao.map(o => ({id: o.id, nome: o.nome})));

        if (obrasDaSessao.length === 0) {
            console.log("📭 [LOAD OBRAS] Nenhuma obra correspondente encontrada");
            
            // Limpar sessão se não encontrar obras correspondentes
            console.log("🔄 [LOAD OBRAS] Tentando migrar sessão para novos IDs...");
            //await migrateSessionToNewIds(obraIds, todasObras);
            return;
        }

        // Limpar interface antes de carregar
        removeBaseObraFromHTML();
        
        // Carregar cada obra individualmente com await
        let loadedCount = 0;
        for (const obraData of obrasDaSessao) {
            const success = await loadSingleObra(obraData);
            if (success) loadedCount++;
        }
        
        console.log(`✅ [LOAD OBRAS] ${loadedCount}/${obrasDaSessao.length} obras carregadas com sucesso`);
        
    } catch (error) {
        console.error("❌ [LOAD OBRAS] Erro ao carregar obras da sessão:", error);
    }
}

/**
 * Função para carregar uma obra individual
 */
async function loadSingleObra(obraData) {
    if (!obraData || !obraData.id) {
        console.error('❌ [LOAD OBRAS] Dados de obra inválidos:', obraData);
        return false;
    }

    console.log(`🔄 [LOAD OBRAS] Carregando obra: "${obraData.nome}" (ID: ${obraData.id})`);
    
    try {
        // Verificar se a obra já existe no DOM
        const obraExistente = document.querySelector(`[data-obra-id="${obraData.id}"]`);
        if (obraExistente) {
            console.log(`⚠️ [LOAD OBRAS] Obra "${obraData.nome}" já existe no DOM, atualizando...`);
            
            if (typeof window.populateObraData === 'function') {
                await window.populateObraData(obraData);
                console.log(`✅ [LOAD OBRAS] Obra "${obraData.nome}" atualizada com sucesso`);
                return true;
            }
        }
        
        // Se não existe, criar nova obra
        if (typeof window.createEmptyObra === 'function') {
            console.log(`🔨 [LOAD OBRAS] Criando nova obra: "${obraData.nome}"`);
            
            // Criar obra vazia com ID específico
            await window.createEmptyObra(obraData.nome, obraData.id);
            
            // Aguardar criação no DOM
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Verificar se foi criada
            const obraCriada = document.querySelector(`[data-obra-id="${obraData.id}"]`);
            if (obraCriada && typeof window.populateObraData === 'function') {
                console.log(`🎨 [LOAD OBRAS] Preenchendo dados da obra "${obraData.nome}"...`);
                await window.populateObraData(obraData);
                
                // 🆕 PREPARAR DADOS DE EMPRESA SE EXISTIREM
                await prepararDadosEmpresaNaObra(obraData, obraCriada);
                
                console.log(`✅ [LOAD OBRAS] Obra "${obraData.nome}" carregada com sucesso`);
                return true;
            } else {
                console.error(`❌ [LOAD OBRAS] Falha ao criar obra "${obraData.nome}" no DOM`);
            }
        } else {
            console.error(`❌ [LOAD OBRAS] createEmptyObra não disponível`);
        }
        
        return false;
    } catch (error) {
        console.error(`💥 [LOAD OBRAS] ERRO ao carregar obra "${obraData.nome}":`, error);
        return false;
    }
}

/**
 * 🆕 PREPARA DADOS DE EMPRESA NA OBRA CARREGADA
 */
async function prepararDadosEmpresaNaObra(obraData, obraElement) {
    try {
        // Verificar se a obra tem dados de empresa
        const camposEmpresa = [
            'empresaSigla', 'empresaNome', 'numeroClienteFinal', 
            'clienteFinal', 'codigoCliente', 'dataCadastro', 
            'orcamentistaResponsavel', 'idGerado'
        ];
        
        const temDadosEmpresa = camposEmpresa.some(campo => obraData[campo]);
        
        if (!temDadosEmpresa) {
            console.log(`📭 [EMPRESA] Obra "${obraData.nome}" não possui dados de empresa`);
            return;
        }
        
        console.log(`🏢 [EMPRESA] Preparando dados de empresa para obra "${obraData.nome}"`);
        
        // Preencher dados da empresa nos data attributes da obra
        camposEmpresa.forEach(campo => {
            if (obraData[campo]) {
                obraElement.dataset[campo] = obraData[campo];
                console.log(`📝 [EMPRESA] ${campo}: ${obraData[campo]}`);
            }
        });
        
        // 🆕 ATUALIZAR INTERFACE COM SPAN NO HEADER
        await atualizarInterfaceComEmpresa(obraElement, obraData);
        
        console.log(`✅ [EMPRESA] Dados de empresa preparados para obra "${obraData.nome}"`);
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao preparar dados de empresa:`, error);
    }
}

/**
 * 🆕 ATUALIZA A INTERFACE COM OS DADOS DA EMPRESA
 */
async function atualizarInterfaceComEmpresa(obraElement, obraData) {
    try {
        // Encontrar o container de cadastro de empresas
        const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');
        if (!empresaContainer) {
            console.log(`❌ [EMPRESA] Container de empresa não encontrado na obra "${obraData.nome}"`);
            return;
        }
        
        // 🆕 ATUALIZAR HEADER DA OBRA COM SPAN (não botão)
        if (window.empresaCadastro && typeof window.empresaCadastro.atualizarHeaderObra === 'function') {
            window.empresaCadastro.atualizarHeaderObra(obraElement, obraData);
        }
        
        console.log(`✅ [EMPRESA] Interface atualizada com SPAN no header`);
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao atualizar interface:`, error);
    }
}

/**
 * 🆕 ATUALIZA CAMPOS DO FORMULÁRIO DE EMPRESA EXISTENTE - COM DATA FORMATADA
 */
function atualizarCamposEmpresaForm(obraData, formElement) {
    const camposMapping = {
        'empresaSigla': 'empresa-input',
        'numeroClienteFinal': 'numero-cliente-final',
        'clienteFinal': 'cliente-final',
        'codigoCliente': 'codigo-cliente',
        'dataCadastro': 'data-cadastro',
        'orcamentistaResponsavel': 'orcamentista-responsavel'
    };
    
    Object.entries(camposMapping).forEach(([dataField, inputId]) => {
        const input = formElement.querySelector(`#${inputId}`);
        if (input && obraData[dataField]) {
            // 🆕 FORMATAR DATA SE FOR O CAMPO dataCadastro
            if (dataField === 'dataCadastro') {
                input.value = formatarData(obraData[dataField]);
            } else {
                input.value = obraData[dataField];
            }
            
            // Configurar dados adicionais para empresa
            if (dataField === 'empresaSigla' && obraData.empresaNome) {
                input.dataset.siglaSelecionada = obraData.empresaSigla;
                input.dataset.nomeSelecionado = obraData.empresaNome;
            }
        }
    });
    
    // Atualizar preview do ID da obra
    const idObraValue = formElement.querySelector('#obra-id-value');
    if (idObraContainer && idObraValue && obraData.idGerado) {
        idObraValue.textContent = obraData.idGerado;
        idObraContainer.style.display = 'block';
    }
}

/**
 * 🆕 CRIA FORMULÁRIO DE EMPRESA COM DADOS EXISTENTES - COM DATA FORMATADA
 */
function criarVisualizacaoEmpresa(obraData, container) {
    // Ocultar botão se existir
    const botao = container.querySelector('.btn-empresa-cadastro');
    if (botao) {
        botao.style.display = 'none';
    }
    
    // 🆕 FORMATAR DATA
    const dataFormatada = formatarData(obraData.dataCadastro);
    
    // Criar formulário
    const formularioHTML = `
    <div class="empresa-formulario-ativo">
        <h4>Dados da Empresa</h4>

        <div class="empresa-form-grid-horizontal">
            <div class="form-group-horizontal">
                <label>Empresa</label>
                <input type="text" class="empresa-input-readonly" 
                    value="${obraData.empresaSigla || ''} - ${obraData.empresaNome || ''}" readonly>
            </div>

            <div class="form-group-horizontal">
                <label>Nº Cliente</label>
                <input type="text" class="numero-cliente-final-readonly" 
                    value="${obraData.numeroClienteFinal || ''}" readonly>
            </div>

            <div class="form-group-horizontal">
                <label>Cliente Final</label>
                <input type="text" class="cliente-final-input" 
                    value="${obraData.clienteFinal || ''}" 
                    onchange="atualizarDadosEmpresa(this, 'clienteFinal', '${obraData.id}')">
            </div>

            <div class="form-group-horizontal">
                <label>Código</label>
                <input type="text" class="codigo-cliente-input" 
                    value="${obraData.codigoCliente || ''}" 
                    onchange="atualizarDadosEmpresa(this, 'codigoCliente', '${obraData.id}')">
            </div>

            <div class="form-group-horizontal">
                <label>Data</label>
                <input type="text" class="data-cadastro-readonly" 
                    value="${dataFormatada}" readonly>
            </div>

            <div class="form-group-horizontal">
                <label>Orçamentista</label>
                <input type="text" class="orcamentista-responsavel-input" 
                    value="${obraData.orcamentistaResponsavel || ''}" 
                    onchange="atualizarDadosEmpresa(this, 'orcamentistaResponsavel', '${obraData.id}')">
            </div>
        </div>



        <div class="empresa-form-actions">
            <button type="button" class="btn-cancel" 
                    onclick="window.ocultarFormularioEmpresa(this, '${obraData.id}')">
                Ocultar
            </button>
        </div>
    </div>
    `;
    
    container.insertAdjacentHTML('beforeend', formularioHTML);
    console.log(`✅ [EMPRESA] Formulário criado para obra ${obraData.id} com data: ${dataFormatada}`);
}

/**
 * 🆕 FUNÇÃO GLOBAL PARA EDITAR DADOS DA EMPRESA
 */
/**
 * 🆕 FUNÇÃO GLOBAL PARA EDITAR DADOS DA EMPRESA
 */
window.editarDadosEmpresa = function(button, obraId = null) {
    try {
        const visualizacao = button.closest('.empresa-dados-visualizacao');
        let obraBlock;
        
        if (obraId) {
            // Se recebeu obraId, buscar por ID
            obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
        } else {
            // Buscar pelo DOM
            obraBlock = visualizacao.closest('.obra-block');
        }
        
        if (!obraBlock) {
            console.error('❌ [EMPRESA] Obra não encontrada para edição');
            return;
        }
        
        // Remover visualização se existir
        if (visualizacao) {
            visualizacao.remove();
        }
        
        // Mostrar span original para ativar cadastro
        const spanOriginal = obraBlock.querySelector('.projetc-header-record.very-dark span');
        if (spanOriginal) {
            spanOriginal.style.display = 'inline';
            
            // Simular clique para ativar cadastro
            if (window.empresaCadastro && typeof window.empresaCadastro.ativarCadastro === 'function') {
                const event = new Event('click');
                spanOriginal.dispatchEvent(event);
            } else {
                spanOriginal.click();
            }
        }
        
    } catch (error) {
        console.error('❌ [EMPRESA] Erro ao editar dados da empresa:', error);
    }
};

/**
 * 🆕 OBTÉM DADOS DE EMPRESA DE UMA OBRA ESPECÍFICA
 */
function obterDadosEmpresaDaObra(obraId) {
    try {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            console.error(`❌ [EMPRESA] Obra com ID ${obraId} não encontrada`);
            return null;
        }
        
        const camposEmpresa = [
            'empresaSigla', 'empresaNome', 'numeroClienteFinal', 
            'clienteFinal', 'codigoCliente', 'dataCadastro', 
            'orcamentistaResponsavel', 'idGerado'
        ];
        
        const dadosEmpresa = {};
        let temDados = false;
        
        camposEmpresa.forEach(campo => {
            if (obraElement.dataset[campo]) {
                dadosEmpresa[campo] = obraElement.dataset[campo];
                temDados = true;
            }
        });
        
        return temDados ? dadosEmpresa : null;
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao obter dados de empresa:`, error);
        return null;
    }
}

// Função alternativa para debug
async function debugLoadObras() {
    console.log("🐛 [DEBUG] Iniciando debug do carregamento...");
    
    // Verificar funções globais
    console.log("🔍 [DEBUG] Funções disponíveis:", {
        createEmptyObra: typeof window.createEmptyObra,
        populateObraData: typeof window.populateObraData,
        createEmptyProject: typeof window.createEmptyProject,
        createEmptyRoom: typeof window.createEmptyRoom,
        obterDadosEmpresa: typeof window.obterDadosEmpresa
    });
    
    // Verificar obras no servidor
    try {
        const response = await fetch('/obras');
        if (response.ok) {
            const obras = await response.json();
            console.log(`📦 [DEBUG] Obras no servidor: ${obras.length}`, obras.map(o => ({
                id: o.id, 
                nome: o.nome,
                empresaSigla: o.empresaSigla,
                idGerado: o.idGerado
            })));
        }
    } catch (error) {
        console.error("❌ [DEBUG] Erro ao buscar obras:", error);
    }
}


/**
 * 🆕 FORMATA DATA PARA dd/mm/aaaa
 */
function formatarData(dataString) {
    if (!dataString) return '';
    
    try {
        // Se já estiver no formato dd/mm/aaaa, retornar como está
        if (typeof dataString === 'string' && dataString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return dataString;
        }
        
        // Tentar parse como Date
        const data = new Date(dataString);
        
        // Verificar se é uma data válida
        if (isNaN(data.getTime())) {
            console.warn(`⚠️ [EMPRESA] Data inválida: ${dataString}`);
            return dataString; // Retorna original se não conseguir formatar
        }
        
        // Formatar para dd/mm/aaaa
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        
        return `${dia}/${mes}/${ano}`;
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao formatar data ${dataString}:`, error);
        return dataString; // Retorna original em caso de erro
    }
}


/**
 * 🆕 ATUALIZA DADOS DA EMPRESA EM TEMPO REAL
 */
window.atualizarDadosEmpresa = function(input, campo, obraId) {
    try {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            console.error(`❌ [EMPRESA] Obra ${obraId} não encontrada`);
            return;
        }
        
        // Atualizar data attribute
        obraElement.dataset[campo] = input.value;
        
        console.log(`📝 [EMPRESA] Campo ${campo} atualizado para:`, input.value);
        
        // Se for cliente final ou orçamentista, atualizar tooltip do header
        if (campo === 'clienteFinal' || campo === 'orcamentistaResponsavel') {
            if (window.empresaCadastro && typeof window.empresaCadastro.atualizarHeaderObra === 'function') {
                const dadosAtuais = obterDadosEmpresaDaObra(obraId);
                if (dadosAtuais) {
                    window.empresaCadastro.atualizarHeaderObra(obraElement, dadosAtuais);
                }
            }
        }
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao atualizar campo ${campo}:`, error);
    }
};

/**
 * 🆕 OCULTAR FORMULÁRIO DE EMPRESA E RESTAURAR BOTÃO
 */
window.ocultarFormularioEmpresa = function(button, obraId) {
    try {
        const formulario = button.closest('.empresa-formulario-ativo');
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        
        if (!obraElement) {
            console.error(`❌ [EMPRESA] Obra ${obraId} não encontrada`);
            return;
        }
        
        // Encontrar o container de empresa
        const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');
        if (!empresaContainer) {
            console.error(`❌ [EMPRESA] Container de empresa não encontrado`);
            return;
        }
        
        // Remover formulário se existir
        if (formulario) {
            formulario.remove();
        }
        
        // Verificar se já existe botão
        const botaoExistente = empresaContainer.querySelector('.btn-empresa-cadastro');
        if (!botaoExistente) {
            // Criar e adicionar botão
            const botao = document.createElement('button');
            botao.className = 'btn-empresa-cadastro';
            botao.textContent = 'Adicionar campos de cadastro de empresas';
            botao.onclick = () => window.ativarCadastroEmpresa(obraId);
            
            empresaContainer.appendChild(botao);
        } else {
            // Garantir que o botão está visível
            botaoExistente.style.display = 'block';
        }
        
        console.log(`👁️ [EMPRESA] Formulário ocultado e botão restaurado para obra ${obraId}`);
        
    } catch (error) {
        console.error('❌ [EMPRESA] Erro ao ocultar formulário:', error);
    }
};

/**
 * 🆕 FUNÇÃO GLOBAL PARA ATIVAR CADASTRO DE EMPRESA - CORRIGIDA
 */
window.ativarCadastroEmpresa = function(obraId) {
    try {
        console.log(`🎯 [EMPRESA] Ativando cadastro para obra: ${obraId}`);
        
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            console.error(`❌ [EMPRESA] Obra ${obraId} não encontrada`);
            return;
        }
        
        // Encontrar container de empresa
        const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');
        if (!empresaContainer) {
            console.error(`❌ [EMPRESA] Container de empresa não encontrado`);
            return;
        }
        
        // ✅ CORREÇÃO: Verificar se já existe formulário ativo
        const formularioExistente = empresaContainer.querySelector('.empresa-formulario-ativo');
        if (formularioExistente) {
            console.log(`✅ [EMPRESA] Formulário já está ativo para obra ${obraId}`);
            return; // ✅ IMPEDE EXECUÇÃO DUPLICADA
        }
        
        // Ocultar botão
        const botao = empresaContainer.querySelector('.btn-empresa-cadastro');
        if (botao) {
            botao.style.display = 'none';
        }
        
        // Verificar se há dados de empresa existentes
        const dadosEmpresa = obterDadosEmpresaDaObra(obraId);
        
        if (dadosEmpresa) {
            // Se já tem dados, criar formulário com dados existentes
            console.log(`📊 [EMPRESA] Criando formulário com dados existentes para obra ${obraId}`);
            criarVisualizacaoEmpresa({...dadosEmpresa, id: obraId}, empresaContainer);
        } else {
            // Se não tem dados, criar formulário vazio para cadastro
            console.log(`🆕 [EMPRESA] Criando novo formulário para obra ${obraId}`);
            criarFormularioVazioEmpresa(obraId, empresaContainer);
        }
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao ativar cadastro para obra ${obraId}:`, error);
    }
};

/**
 * 🆕 CRIA FORMULÁRIO VAZIO PARA NOVO CADASTRO COM INPUT HÍBRIDO
 */
function criarFormularioVazioEmpresa(obraId, container) {
    const formularioHTML = `
    <div class="empresa-formulario-ativo">
        <h4>Cadastro de Empresa</h4>

        <div class="empresa-form-grid-horizontal">
            <div class="form-group-horizontal">
                <label>Empresa *</label>
                <div class="empresa-input-container">
                    <input type="text" 
                           class="empresa-input-cadastro" 
                           id="empresa-input-${obraId}"
                           placeholder="Digite sigla ou nome ou selecione..."
                           autocomplete="off">
                    <div class="empresa-dropdown" id="empresa-dropdown-${obraId}">
                        <div class="dropdown-options" id="empresa-options-${obraId}"></div>
                    </div>
                </div>
            </div>

            <div class="form-group-horizontal">
                <label>Nº Cliente</label>
                <input type="text" class="numero-cliente-final-cadastro" readonly
                    placeholder="Será gerado automaticamente">
            </div>

            <div class="form-group-horizontal">
                <label>Cliente Final</label>
                <input type="text" class="cliente-final-cadastro" 
                    placeholder="Nome do cliente final">
            </div>

            <div class="form-group-horizontal">
                <label>Código</label>
                <input type="text" class="codigo-cliente-cadastro" 
                    placeholder="Código do cliente">
            </div>

            <div class="form-group-horizontal">
                <label>Data</label>
                <input type="text" class="data-cadastro-cadastro" 
                    value="${new Date().toLocaleDateString('pt-BR')}" readonly>
            </div>

            <div class="form-group-horizontal">
                <label>Orçamentista</label>
                <input type="text" class="orcamentista-responsavel-cadastro" 
                    placeholder="Nome do orçamentista">
            </div>
        </div>

        <div class="empresa-form-actions">
            <button type="button" class="btn-cancel" 
                    onclick="window.ocultarFormularioEmpresa(this, '${obraId}')">
                Cancelar
            </button>
        </div>
    </div>
    `;
    
    container.insertAdjacentHTML('beforeend', formularioHTML);
    
    // 🔥 CORREÇÃO: Inicializar com timeout maior para garantir que o DOM está pronto
    setTimeout(() => {
        inicializarInputEmpresaHibrido(obraId);
    }, 300);
}

/**
 * INICIALIZAR INPUT HÍBRIDO - COM CONTROLE DE BACKSPACE (CORRIGIDO)
 */
async function inicializarInputEmpresaHibrido(obraId) {
    console.log(`🔧 [INPUT HÍBRIDO] Inicializando para obra: ${obraId}`);
    
    const input = document.getElementById(`empresa-input-${obraId}`);
    const dropdown = document.getElementById(`empresa-dropdown-${obraId}`);
    const optionsContainer = document.getElementById(`empresa-options-${obraId}`);
    
    if (!input) {
        console.error(`❌ [INPUT HÍBRIDO] Input não encontrado para obra ${obraId}`);
        return;
    }
    
    // 🔥 CORREÇÃO: CARREGAR EMPRESAS ANTES DE TUDO
    let empresas = [];
    try {
        console.log(`📦 [INPUT HÍBRIDO] Carregando empresas para obra ${obraId}...`);
        const response = await fetch('/api/dados/empresas');
        if (response.ok) {
            const data = await response.json();
            empresas = data.empresas || [];
            console.log(`✅ [INPUT HÍBRIDO] ${empresas.length} empresas carregadas`);
        } else {
            console.error(`❌ [INPUT HÍBRIDO] Erro ao carregar empresas: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ [INPUT HÍBRIDO] Erro no carregamento de empresas:`, error);
    }

    // 🔥 INICIALIZAR DETECTOR DE BACKSPACE PRIMEIRO
    inicializarDetectorBackspace(input, obraId);
    
    // 🔥 EVENTO DE INPUT ATUALIZADO - RESPEITAR BACKSPACE
    input.addEventListener('input', function(e) {
        const termo = e.target.value.trim();
        console.log(`🔍 [INPUT] Digitando: "${termo}" | Apagando: ${window.usuarioEstaApagando}`);
        
        // 🔥 SE USUÁRIO ESTÁ APAGANDO, NÃO FAZER AUTOCOMPLETE
        if (window.usuarioEstaApagando) {
            console.log('🚫 Autocomplete bloqueado - usuário apagando');
            
            // Apenas busca normal, sem autocomplete automático
            if (termo.length === 0) {
                limparDadosSelecao(input, obraId);
                exibirTodasEmpresas(empresas, optionsContainer, input, dropdown, obraId);
            } else {
                const sugestoes = filtrarEmpresas(termo, empresas);
                exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
            }
            
            // Resetar flag após processar o input
            setTimeout(() => {
                window.usuarioEstaApagando = false;
            }, 100);
            return;
        }
        
        // 🔥 COMPORTAMENTO NORMAL (não está apagando)
        if (termo.length === 0) {
            console.log('🔄 Campo apagado - mostrando todas empresas');
            limparDadosSelecao(input, obraId);
            exibirTodasEmpresas(empresas, optionsContainer, input, dropdown, obraId);
            return;
        }
        
        const sugestoes = filtrarEmpresas(termo, empresas);
        console.log(`🎯 [INPUT] ${sugestoes.length} sugestões para "${termo}"`);
        
        // 🔥 AUTOCOMPLETE SÓ SE NÃO ESTIVER APAGANDO
        if (sugestoes.length === 1 && termo.length > 0 && !window.usuarioEstaApagando) {
            const [sigla, nome] = Object.entries(sugestoes[0])[0];
            
            // Verificar se é um match forte (usuário digitou sigla completa ou nome significativo)
            const matchForte = termo === sigla || termo.length >= 3;
            
            if (matchForte) {
                console.log(`✅ [AUTOCOMPLETE] Única sugestão: ${sigla} - ${nome}`);
                selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'autocomplete');
                return;
            }
        }
        
        exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
    });
    
    // 🔥 EVENTO DE FOCO - RESETAR FLAGS E MOSTRAR EMPRESAS
    input.addEventListener('focus', function() {
        window.usuarioEstaApagando = false;
        window.ultimoValorInput = this.value;
        
        const valorAtual = this.value.trim();
        const empresaJaSelecionada = this.dataset.siglaSelecionada;
        
        if (valorAtual.length === 0) {
            exibirTodasEmpresas(empresas, optionsContainer, input, dropdown, obraId);
        } else if (empresaJaSelecionada && valorAtual === `${this.dataset.siglaSelecionada} - ${this.dataset.nomeSelecionado}`) {
            // Empresa já selecionada, não mostrar dropdown
            dropdown.style.display = 'none';
        } else {
            const sugestoes = filtrarEmpresas(valorAtual, empresas);
            exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
        }
    });
    
    // 🔥 EVENTO DE BLUR - RESETAR FLAGS
    input.addEventListener('blur', function() {
        setTimeout(() => {
            window.usuarioEstaApagando = false;
        }, 200);
    });
    
    // Evento de teclado para navegação
    input.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            navegarDropdown('down', optionsContainer, input, dropdown, obraId);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navegarDropdown('up', optionsContainer, input, dropdown, obraId);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            
            // 🔥 COMPORTAMENTO EXCEL: Se o dropdown está aberto, seleciona a opção ativa
            if (dropdown.style.display === 'block') {
                selecionarOpcaoAtiva(optionsContainer, input, dropdown, obraId);
            } else {
                // Se o dropdown está fechado mas há uma empresa já preenchida, apenas fecha
                dropdown.style.display = 'none';
                input.blur();
            }
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
            input.blur();
        } else if (e.key === 'Tab') {
            // 🔥 COMPORTAMENTO EXCEL: Tab também seleciona a opção ativa
            if (dropdown.style.display === 'block') {
                e.preventDefault();
                selecionarOpcaoAtiva(optionsContainer, input, dropdown, obraId);
            }
        }
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (input && dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    console.log(`✅ [INPUT HÍBRIDO] Inicializado com sucesso para obra ${obraId}`);
}

/**
 * 🆕 LIMPAR DADOS DE SELEÇÃO
 */
function limparDadosSelecao(input, obraId) {
    delete input.dataset.siglaSelecionada;
    delete input.dataset.nomeSelecionado;
    limparNumeroCliente(obraId);
    console.log('🔄 Dados de seleção limpos');
}

/**
 * 🆕 DETECTAR BACKSPACE/DELETE DE FORMA MAIS PRECISA
 */
function criarSistemaBackspaceDetector(input) {
    let pressionandoBackspace = false;
    let timeoutBackspace;
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            pressionandoBackspace = true;
            usuarioEstaApagando = true;
            
            // Limpar timeout anterior
            if (timeoutBackspace) clearTimeout(timeoutBackspace);
            
            // Timeout para resetar se parou de apertar
            timeoutBackspace = setTimeout(() => {
                pressionandoBackspace = false;
                usuarioEstaApagando = false;
            }, 500);
            
            console.log('⌫ Tecla de apagar pressionada');
        }
    });
    
    input.addEventListener('keyup', function(e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            // Pequeno delay para garantir que o input foi processado
            setTimeout(() => {
                if (!pressionandoBackspace) {
                    usuarioEstaApagando = false;
                }
            }, 50);
        }
    });
    
    // Detectar seleção total (Ctrl+A) + Backspace
    input.addEventListener('input', function(e) {
        if (pressionandoBackspace && this.value.length === 0) {
            console.log('🎯 Usuário apagou tudo - reset completo');
            limparDadosSelecao(input, input.closest('[data-obra-id]')?.dataset.obraId);
        }
    });
}

/**
 * 🆕 INICIALIZAR DETECTOR DE BACKSPACE SEPARADAMENTE (CORRIGIDO)
 */
function inicializarDetectorBackspace(input, obraId) {
    console.log(`⌫ [BACKSPACE] Inicializando detector para obra ${obraId}`);
    
    let pressionandoBackspace = false;
    let timeoutBackspace;
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            window.usuarioEstaApagando = true;
            pressionandoBackspace = true;
            
            console.log('⌫ Tecla de apagar pressionada - bloqueando autocomplete');
            
            // Limpar timeout anterior
            if (timeoutBackspace) clearTimeout(timeoutBackspace);
            
            // Timeout para resetar se parou de apertar
            timeoutBackspace = setTimeout(() => {
                pressionandoBackspace = false;
                window.usuarioEstaApagando = false;
                console.log('🔄 Resetando flag de apagamento');
            }, 500);
        }
        
        // Salvar valor atual para comparação
        window.ultimoValorInput = this.value;
    });
    
    input.addEventListener('keyup', function(e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            // Pequeno delay para garantir que o input foi processado
            setTimeout(() => {
                if (!pressionandoBackspace) {
                    window.usuarioEstaApagando = false;
                    console.log('🔄 Tecla de apagar liberada');
                }
            }, 50);
        }
    });
    
    // Detectar seleção total (Ctrl+A) + Backspace
    input.addEventListener('input', function(e) {
        if (pressionandoBackspace && this.value.length === 0) {
            console.log('🎯 Usuário apagou tudo - reset completo');
            limparDadosSelecao(input, obraId);
        }
    });
}

/**
 * 🆕 CORRIGIR POSIÇÃO DO DROPDOWN EM DISPOSITIVOS MÓVEIS
 */
function corrigirPosicaoDropdown() {
    const dropdowns = document.querySelectorAll('.empresa-dropdown');
    
    dropdowns.forEach(dropdown => {
        const input = dropdown.previousElementSibling;
        if (input && input.classList.contains('empresa-input-cadastro')) {
            // 🔥 GARANTIR QUE O DROPDOWN FIQUE EXATAMENTE ABAIXO DO INPUT
            const rect = input.getBoundingClientRect();
            dropdown.style.width = rect.width + 'px';
            dropdown.style.left = '0';
            dropdown.style.right = 'auto';
        }
    });
}


/**
 * 🆕 LIMPAR NÚMERO DO CLIENTE QUANDO EMPRESA FOR REMOVIDA
 */
function limparNumeroCliente(obraId) {
    const numeroInput = document.querySelector(`[data-obra-id="${obraId}"] .numero-cliente-final-cadastro`);
    if (numeroInput) {
        numeroInput.value = '';
        console.log(`🔄 [EMPRESA] Número do cliente limpo para obra ${obraId}`);
    }
}

/**
 * FILTRAR EMPRESAS POR TERMO
 */
function filtrarEmpresas(termo, empresas) {
    if (!termo || termo.length < 1) return [];
    
    const termoNormalizado = termo.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return empresas.filter(empresaObj => {
        const [sigla, nome] = Object.entries(empresaObj)[0];
        const nomeNormalizado = nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        return sigla === termoNormalizado || 
               sigla.includes(termoNormalizado) ||
               nomeNormalizado.includes(termoNormalizado);
    });
}

/**
 * EXIBIR SUGESTÕES NO DROPDOWN - COM COMPORTAMENTO EXCEL CORRIGIDO
 */
function exibirSugestoes(sugestoes, container, input, dropdown, obraId) {
    const valorAtual = input.value.trim();
    const empresaJaSelecionada = input.dataset.siglaSelecionada;
    
    // 🔥 NÃO FAZER AUTOCOMPLETE SE USUÁRIO ESTÁ APAGANDO
    if (usuarioEstaApagando) {
        console.log('🚫 Autocomplete ignorado - modo apagando ativo');
        // Mostrar sugestões normais, mas não auto-selecionar
    }
    
    if (empresaJaSelecionada && valorAtual === `${input.dataset.siglaSelecionada} - ${input.dataset.nomeSelecionado}`) {
        container.innerHTML = '';
        dropdown.style.display = 'none';
        return;
    }
    
    if (!sugestoes || sugestoes.length === 0) {
        if (valorAtual.length > 0) {
            container.innerHTML = `
                <div class="dropdown-no-results">
                    📝 Nenhuma empresa encontrada<br>
                    <small>Criando nova empresa: "${valorAtual}"</small>
                </div>
            `;
        } else {
            container.innerHTML = '<div class="dropdown-no-results">Digite para buscar empresas</div>';
        }
        dropdown.style.display = 'block';
        return;
    }
    
    const sugestoesLimitadas = sugestoes.slice(0, 50);
    
    // 🔥 BLOQUEAR SELEÇÃO AUTOMÁTICA SE ESTÁ APAGANDO
    if (sugestoesLimitadas.length === 1 && valorAtual.length > 0 && !usuarioEstaApagando) {
        const [sigla, nome] = Object.entries(sugestoesLimitadas[0])[0];
        console.log(`✅ [AUTOCOMPLETE] Única sugestão: ${sigla} - ${nome}`);
        selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'autocomplete');
        return;
    }
    
    const html = sugestoesLimitadas.map(empresaObj => {
        const [sigla, nome] = Object.entries(empresaObj)[0];
        
        return `
            <div class="dropdown-option" data-sigla="${sigla}" data-nome="${nome}" title="${nome}">
                <strong>${sigla}</strong> 
                <div class="nome-empresa">- ${nome}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    dropdown.style.display = 'block';
    setTimeout(corrigirPosicaoDropdown, 10);

    // COMPORTAMENTO EXCEL: Se há poucas sugestões, seleciona a primeira automaticamente para navegação com setas
    if (sugestoesLimitadas.length > 0) {
        const primeiraOpcao = container.querySelector('.dropdown-option');
        if (primeiraOpcao) {
            primeiraOpcao.classList.add('active');
        }
    }
    
    setTimeout(() => {
        if (dropdown.scrollHeight > 200) {
            dropdown.style.overflowY = 'auto';
            dropdown.style.maxHeight = '200px';
        }
    }, 10);
    
    // Vincular eventos de clique
    container.querySelectorAll('.dropdown-option').forEach(option => {
        // 2. NO CLIQUE MANUAL (dropdown)
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const sigla = this.dataset.sigla;
            const nome = this.dataset.nome;
            console.log('🖱️ Clique manual na opção');
            
            // 🔥 TIPO: manual (usuário clicou)
            selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'manual');
        });
    });
    
    console.log(`🔍 [EMPRESA] Exibindo ${sugestoesLimitadas.length} sugestões`);
}


/**
 * EXIBIR TODAS AS EMPRESAS
 */
function exibirTodasEmpresas(empresas, container, input, dropdown, obraId) {
    const empresaJaSelecionada = input.dataset.siglaSelecionada;
    
    if (empresaJaSelecionada) {
        container.innerHTML = '';
        dropdown.style.display = 'none';
        return;
    }
    
    if (!empresas || empresas.length === 0) {
        container.innerHTML = `
            <div class="dropdown-no-results">
                📝 Nenhuma empresa cadastrada<br>
                <small>Digite o nome para criar uma nova</small>
            </div>
        `;
        dropdown.style.display = 'block';
        return;
    }
    
    const empresasLimitadas = empresas.slice(0, 50);
    
    const html = empresasLimitadas.map(empresaObj => {
        const [sigla, nome] = Object.entries(empresaObj)[0];
        
        return `
            <div class="dropdown-option" data-sigla="${sigla}" data-nome="${nome}" title="${nome}">
                <strong>${sigla}</strong> 
                <div class="nome-empresa">- ${nome}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    dropdown.style.display = 'block';
    setTimeout(corrigirPosicaoDropdown, 10);

    setTimeout(() => {
        if (dropdown.scrollHeight > 200) {
            dropdown.style.overflowY = 'auto';
            dropdown.style.maxHeight = '200px';
        }
    }, 10);
    
    container.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function() {
            const sigla = this.dataset.sigla;
            const nome = this.dataset.nome;
            selecionarEmpresa(sigla, nome, input, dropdown, obraId);
        });
    });
    
    console.log(`📊 [EMPRESA] Exibindo ${empresasLimitadas.length} de ${empresas.length} empresas`);
}

/**
 * NAVEGAR NO DROPDOWN COM TECLADO - COM LOOP (FINAL → INÍCIO)
 */
function navegarDropdown(direcao, container, input, dropdown, obraId) {
    const options = container.querySelectorAll('.dropdown-option');
    if (options.length === 0) return;
    
    const activeOption = container.querySelector('.dropdown-option.active');
    let nextIndex = 0;
    
    if (activeOption) {
        const currentIndex = Array.from(options).indexOf(activeOption);
        
        // 🔥 COMPORTAMENTO EXCEL COM LOOP
        if (direcao === 'down') {
            // Para baixo: se está no último, volta para o primeiro
            nextIndex = currentIndex === options.length - 1 ? 0 : currentIndex + 1;
        } else {
            // Para cima: se está no primeiro, vai para o último
            nextIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
        }
        
        console.log(`🔄 Navegação: ${currentIndex} → ${nextIndex} (total: ${options.length})`);
    } else {
        // Se não há opção ativa, começa na primeira (down) ou última (up)
        nextIndex = direcao === 'down' ? 0 : options.length - 1;
    }
    
    // Remove active de todas e aplica na nova
    options.forEach(opt => opt.classList.remove('active'));
    options[nextIndex].classList.add('active');
    
    // 🔥 COMPORTAMENTO EXCEL: Atualiza o input em tempo real durante navegação
    const sigla = options[nextIndex].dataset.sigla;
    const nome = options[nextIndex].dataset.nome;
    input.value = `${sigla} - ${nome}`;
    
    // Scroll para a opção ativa
    options[nextIndex].scrollIntoView({ 
        block: 'nearest',
        behavior: 'smooth' 
    });
    
    console.log(`🎯 Navegando para: ${sigla} - ${nome} (${nextIndex + 1}/${options.length})`);
}


/**
 * SELECIONAR EMPRESA - COM CONTROLE DE TIPO DE SELEÇÃO
 */
function selecionarEmpresa(sigla, nome, input, dropdown, obraId, tipoSelecao = 'manual') {
    console.log('🎯 Selecionando empresa:', sigla, nome, 'Tipo:', tipoSelecao);
    
    // Preenche o input
    input.value = `${sigla} - ${nome}`;
    input.dataset.siglaSelecionada = sigla;
    input.dataset.nomeSelecionado = nome;
    
    // Fecha dropdown
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    // Remove foco do input
    setTimeout(() => {
        input.blur();
        
        // 🔥 MOSTRAR AVISO APENAS SE FOR AUTOCOMPLETE
        mostrarAvisoAutocompletado(input, tipoSelecao);
    }, 10);
    
    // Calcula o número do cliente
    calcularNumeroClienteFinal(sigla, obraId);
    
    console.log(`✅ Empresa selecionada: ${sigla} - ${nome} (${tipoSelecao})`);
}



/**
 * 🆕 MOSTRAR AVISO DE AUTOCOMPLETE - CSS EXTERNO
 */
function mostrarAvisoAutocompletado(input, tipoSelecao = 'manual') {
    if (tipoSelecao !== 'autocomplete') return;
    
    // Remove avisos anteriores
    document.querySelectorAll('.aviso-autocomplete-relativo').forEach(aviso => aviso.remove());
    
    // Encontrar container
    const container = input.closest('.form-group-horizontal') || 
                     input.closest('.empresa-input-container') || 
                     input.parentNode;
    
    if (!container) return;
    
    // Criar aviso
    const aviso = document.createElement('div');
    aviso.className = 'aviso-autocomplete-relativo';
    aviso.textContent = 'Empresa autocompletada ✓';
    
    // Adicionar ao container
    container.appendChild(aviso);
    
    // Animação
    setTimeout(() => aviso.classList.add('show'), 50);
    
    // Remover
    setTimeout(() => {
        aviso.classList.remove('show');
        setTimeout(() => aviso.remove(), 300);
    }, 1200);
}

/**
 * ATUALIZAR EVENTO DE ENTER - CORRIGIDO
 */
// 3. NO ENTER/TAB (navegação)
function selecionarOpcaoAtiva(container, input, dropdown, obraId) {
    const activeOption = container.querySelector('.dropdown-option.active');
    if (activeOption) {
        const sigla = activeOption.dataset.sigla;
        const nome = activeOption.dataset.nome;
        console.log('⌨️ Seleção por teclado');
        
        // 🔥 TIPO: manual (usuário usou teclado)
        selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'manual');
    }
}

/**
 * 🆕 CALCULAR NÚMERO DO CLIENTE FINAL - CORRIGIDO E MAIS ROBUSTO
 */
async function calcularNumeroClienteFinal(sigla, obraId) {
    try {
        console.log(`🔢 [EMPRESA] Calculando número para: ${sigla}`);
        
        // Tentar a API primeiro
        const response = await fetch(`/api/dados/empresas/numero/${encodeURIComponent(sigla)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const dados = await response.json();
        
        if (dados.success) {
            const novoNumero = dados.numero;
            atualizarNumeroClienteInput(novoNumero, obraId);
            console.log(`✅ [EMPRESA] Número da API: ${novoNumero} para ${sigla}`);
        } else {
            console.warn('⚠️ [EMPRESA] API retornou erro, usando cálculo local:', dados.error);
            calcularNumeroLocal(sigla, obraId);
        }
        
    } catch (error) {
        console.warn('⚠️ [EMPRESA] Erro na API, usando cálculo local:', error.message);
        calcularNumeroLocal(sigla, obraId);
    }
}

/**
 * 🆕 CALCULAR NÚMERO LOCALMENTE COMO FALLBACK
 */
async function calcularNumeroLocal(sigla, obraId) {
    try {
        // Buscar todas as obras para calcular localmente
        const response = await fetch('/api/backup-completo');
        if (!response.ok) {
            throw new Error('Não foi possível carregar obras');
        }
        
        const backup = await response.json();
        const obrasExistentes = backup.obras || [];
        
        // Filtrar obras da mesma empresa
        const obrasDaEmpresa = obrasExistentes.filter(obra => 
            obra.empresaSigla === sigla || 
            (obra.idGerado && obra.idGerado.startsWith(`obra_${sigla}_`))
        );
        
        // Encontrar maior número
        let maiorNumero = 0;
        obrasDaEmpresa.forEach(obra => {
            if (obra.numeroClienteFinal && obra.numeroClienteFinal > maiorNumero) {
                maiorNumero = obra.numeroClienteFinal;
            }
            
            if (obra.idGerado) {
                const match = obra.idGerado.match(new RegExp(`obra_${sigla}_(\\d+)`));
                if (match) {
                    const numero = parseInt(match[1]);
                    if (numero > maiorNumero) maiorNumero = numero;
                }
            }
        });
        
        const novoNumero = maiorNumero + 1;
        atualizarNumeroClienteInput(novoNumero, obraId);
        console.log(`🔢 [EMPRESA] Número local: ${novoNumero} para ${sigla}`);
        
    } catch (error) {
        console.error('❌ [EMPRESA] Erro no cálculo local:', error);
        // Fallback final: número aleatório
        const numeroFallback = Math.floor(Math.random() * 100) + 1;
        atualizarNumeroClienteInput(numeroFallback, obraId);
        console.log(`🔄 [EMPRESA] Número fallback: ${numeroFallback} para ${sigla}`);
    }
}

/**
 * 🆕 ATUALIZAR INPUT DO NÚMERO DO CLIENTE
 */
function atualizarNumeroClienteInput(numero, obraId) {
    const numeroInput = document.querySelector(`[data-obra-id="${obraId}"] .numero-cliente-final-cadastro`);
    if (numeroInput) {
        numeroInput.value = numero;
    }
}

window.addEventListener('resize', corrigirPosicaoDropdown);

// 🔥 CORRIGIR NO SCROLL (para casos de virtual keyboard)
window.addEventListener('scroll', corrigirPosicaoDropdown);

// 🔥 INICIALIZAR DETECTOR EM TODOS OS INPUTS EXISTENTES
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const inputs = document.querySelectorAll('.empresa-input-cadastro');
        inputs.forEach(input => {
            criarSistemaBackspaceDetector(input);
        });
    }, 1000);
});

export {
    formatarData,
    loadObrasFromServer,
    removeBaseObraFromHTML,
    loadSingleObra,
    debugLoadObras,
    obterDadosEmpresaDaObra,
    prepararDadosEmpresaNaObra
};