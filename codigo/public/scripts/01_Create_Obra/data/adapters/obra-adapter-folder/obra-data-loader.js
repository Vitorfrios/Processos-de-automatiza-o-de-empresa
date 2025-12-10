// obra-data-loader.js
import {atualizarInterfaceComEmpresa } from './empresa-form-manager.js'

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
 * Carrega obras salvas do servidor para a sessão atual
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
            await new Promise(resolve => setTimeout(resolve, 150));
            
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
        console.log('🔄 [PREPARAR EMPRESA] INICIANDO preparação para obra:', obraData.nome);
        console.log('📦 [PREPARAR EMPRESA] Dados recebidos da obra:', {
            empresaSigla: obraData.empresaSigla,
            empresaNome: obraData.empresaNome,
            numeroClienteFinal: obraData.numeroClienteFinal,
            clienteFinal: obraData.clienteFinal,
            codigoCliente: obraData.codigoCliente,
            dataCadastro: obraData.dataCadastro,
            orcamentistaResponsavel: obraData.orcamentistaResponsavel,
            idGerado: obraData.idGerado
        });

        const camposEmpresa = [
            'empresaSigla', 'empresaNome', 'numeroClienteFinal', 
            'clienteFinal', 'codigoCliente', 'dataCadastro', 
            'orcamentistaResponsavel', 'idGerado'
        ];
        
        // 🆕 VERIFICAR ANTES DE ATRIBUIR
        console.log('🔍 [PREPARAR EMPRESA] Data attributes ANTES da preparação:');
        camposEmpresa.forEach(campo => {
            console.log(`   ${campo}: "${obraElement.dataset[campo]}"`);
        });

        const temDadosEmpresa = camposEmpresa.some(campo => obraData[campo]);
        
        if (!temDadosEmpresa) {
            console.log('📭 [PREPARAR EMPRESA] Obra não possui dados de empresa');
            return;
        }
        
        console.log('🏢 [PREPARAR EMPRESA] Atribuindo dados aos data attributes...');
        
        // Preencher dados da empresa nos data attributes da obra
        camposEmpresa.forEach(campo => {
            const valorAntigo = obraElement.dataset[campo];
            const valorNovo = obraData[campo];
            
            if (valorNovo) {
                obraElement.dataset[campo] = valorNovo;
                console.log(`✅ [PREPARAR EMPRESA] ${campo}: "${valorAntigo || 'vazio'}" → "${valorNovo}"`);
            } else {
                console.log(`❌ [PREPARAR EMPRESA] ${campo}: VALOR AUSENTE nos dados da obra`);
            }
        });
        
        // 🆕 VERIFICAR DEPOIS DE ATRIBUIR
        console.log('🔍 [PREPARAR EMPRESA] Data attributes DEPOIS da preparação:');
        camposEmpresa.forEach(campo => {
            console.log(`   ${campo}: "${obraElement.dataset[campo]}"`);
        });
        
        // Atualizar interface
        await atualizarInterfaceComEmpresa(obraElement, obraData);
        
        console.log('✅ [PREPARAR EMPRESA] Preparação concluída');
        
    } catch (error) {
        console.error('❌ [PREPARAR EMPRESA] Erro:', error);
    }
}

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


if (typeof window !== "undefined") {
    window.prepararDadosEmpresaNaObra = prepararDadosEmpresaNaObra;
    window.obterDadosEmpresaDaObra = obterDadosEmpresaDaObra;
}



// EXPORTS NO FINAL
export {
    removeBaseObraFromHTML,
    loadObrasFromServer,
    loadSingleObra,
    prepararDadosEmpresaNaObra,
    obterDadosEmpresaDaObra,
    debugLoadObras
};