// adapters/obra-adapter.js - CORREÇÃO COMPLETA COM EMPRESAS:

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
        
        // 🆕 ATUALIZAR INTERFACE COM DADOS DA EMPRESA
        await atualizarInterfaceComEmpresa(obraElement, obraData);
        
        // 🆕 ATUALIZAR HEADER DA OBRA
        if (window.empresaCadastro && typeof window.empresaCadastro.atualizarHeaderObra === 'function') {
            window.empresaCadastro.atualizarHeaderObra(obraElement, obraData);
        }
        
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
        
        // 🆕 SEMPRE CRIAR FORMULÁRIO ATIVO (não verificar se já existe)
        criarVisualizacaoEmpresa(obraData, empresaContainer);
        
        console.log(`✅ [EMPRESA] Interface atualizada com formulário ativo`);
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao atualizar interface:`, error);
    }
}

/**
 * 🆕 ATUALIZA CAMPOS DO FORMULÁRIO DE EMPRESA EXISTENTE
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
            input.value = obraData[dataField];
            
            // Configurar dados adicionais para empresa
            if (dataField === 'empresaSigla' && obraData.empresaNome) {
                input.dataset.siglaSelecionada = obraData.empresaSigla;
                input.dataset.nomeSelecionado = obraData.empresaNome;
            }
        }
    });
    
    // Atualizar preview do ID da obra
    const idObraContainer = formElement.querySelector('#obra-id-gerado');
    const idObraValue = formElement.querySelector('#obra-id-value');
    if (idObraContainer && idObraValue && obraData.idGerado) {
        idObraValue.textContent = obraData.idGerado;
        idObraContainer.style.display = 'block';
    }
}

/**
 * 🆕 CRIA FORMULÁRIO DE EMPRESA COM DADOS EXISTENTES
 */
function criarVisualizacaoEmpresa(obraData, container) {
    // Ocultar botão se existir
    const botao = container.querySelector('.btn-empresa-cadastro');
    if (botao) {
        botao.style.display = 'none';
    }
    
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
                    value="${obraData.dataCadastro || ''}" readonly>
            </div>

            <div class="form-group-horizontal">
                <label>Orçamentista</label>
                <input type="text" class="orcamentista-responsavel-input" 
                    value="${obraData.orcamentistaResponsavel || ''}" 
                    onchange="atualizarDadosEmpresa(this, 'orcamentistaResponsavel', '${obraData.id}')">
            </div>
        </div>

        ${obraData.idGerado ? `
        <div class="obra-id-gerado">
            <strong>ID da Obra:</strong>
            <code id="obra-id-value">${obraData.idGerado}</code>
        </div>
        ` : ''}

        <div class="empresa-form-actions">
            <button type="button" class="btn-cancel" 
                    onclick="window.ocultarFormularioEmpresa(this, '${obraData.id}')">
                Ocultar
            </button>
        </div>
    </div>
    `;
    
    container.insertAdjacentHTML('beforeend', formularioHTML);
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

export {
    loadObrasFromServer,
    removeBaseObraFromHTML,
    loadSingleObra,
    debugLoadObras, // ✅ Exportar função de debug
    obterDadosEmpresaDaObra, // 🆕 Exportar função de empresa
    prepararDadosEmpresaNaObra // 🆕 Exportar função de preparação
};



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
 * 🆕 FUNÇÃO GLOBAL PARA ATIVAR CADASTRO DE EMPRESA
 */
window.ativarCadastroEmpresa = function(obraId) {
    try {
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
        
        // Ocultar botão
        const botao = empresaContainer.querySelector('.btn-empresa-cadastro');
        if (botao) {
            botao.style.display = 'none';
        }
        
        // Verificar se já existe formulário
        const formularioExistente = empresaContainer.querySelector('.empresa-formulario-ativo');
        if (formularioExistente) {
            console.log(`✅ [EMPRESA] Formulário já existe para obra ${obraId}`);
            return;
        }
        
        // Verificar se há dados de empresa existentes
        const dadosEmpresa = obterDadosEmpresaDaObra(obraId);
        
        if (dadosEmpresa) {
            // Se já tem dados, criar formulário com dados existentes
            criarVisualizacaoEmpresa({...dadosEmpresa, id: obraId}, empresaContainer);
            console.log(`✅ [EMPRESA] Formulário com dados existentes criado para obra ${obraId}`);
        } else {
            // Se não tem dados, criar formulário vazio usando empresaCadastro
            if (window.empresaCadastro && typeof window.empresaCadastro.ativarCadastro === 'function') {
                // Simular clique no botão para ativar o cadastro completo
                const event = new Event('click');
                if (botao) {
                    botao.dispatchEvent(event);
                }
            } else {
                console.error('❌ [EMPRESA] Sistema de cadastro de empresas não disponível');
            }
        }
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao ativar cadastro para obra ${obraId}:`, error);
    }
};