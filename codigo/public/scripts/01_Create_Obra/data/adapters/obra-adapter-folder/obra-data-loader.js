// obra-data-loader.js
import { atualizarInterfaceComEmpresa } from './empresa-form-manager.js'

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
 * Carrega obras do servidor - VERSÃO OTIMIZADA COM SUPORTE A EMPRESA
 */
async function loadObrasFromServer() {
    console.log("🚀 [LOAD OBRAS] Iniciando carregamento com suporte a empresa...");
    const startTime = performance.now();
    
    try {
        // Buscar dados em paralelo
        const [sessionResponse, obrasResponse] = await Promise.all([
            fetch('/api/session-obras'),
            fetch('/obras')
        ]);
        
        if (!sessionResponse.ok) return;
        
        const sessionData = await sessionResponse.json();
        const obraIds = sessionData.obras || [];
        const todasObras = await obrasResponse.json();
        
        if (obraIds.length === 0 || todasObras.length === 0) return;
        
        // Filtro rápido com suporte a empresa
        const lookup = {};
        todasObras.forEach(obra => {
            lookup[obra.id] = obra;
            lookup[obra.id.toString()] = obra;
        });
        
        const obrasParaCarregar = [];
        for (let i = 0; i < obraIds.length; i++) {
            const obra = lookup[obraIds[i]] || lookup[obraIds[i].toString()];
            if (obra) obrasParaCarregar.push(obra);
        }
        
        console.log(`🎯 ${obrasParaCarregar.length} obras encontradas para carregar`);
        
        if (obrasParaCarregar.length === 0) return;
        
        // Limpar interface
        removeBaseObraFromHTML();
        
        // Criar todas as estruturas básicas primeiro
        if (window.createEmptyObra) {
            await Promise.allSettled(
                obrasParaCarregar.map(obra => 
                    window.createEmptyObra(obra.nome, obra.id)
                )
            );
        }
        
        // Aguardar micro-tick para DOM
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Carregar TODOS os dados em PARALELO ABSOLUTO
        const loadPromises = obrasParaCarregar.map(obra => 
            loadSingleObra(obra).catch(e => {
                console.warn(`⚠️ Falha ao carregar obra ${obra.id}:`, e.message);
                return 0;
            })
        );
        
        const results = await Promise.allSettled(loadPromises);
        const successCount = results.reduce((count, result) => 
            result.status === 'fulfilled' ? count + result.value : count, 0);
        
        const endTime = performance.now();
        console.log(`✅ ${successCount} obras carregadas em ${Math.round(endTime - startTime)}ms`);
        
    } catch (error) {
        console.error("❌ Erro ao carregar obras:", error);
    }
}

/**
 * Carrega uma ou múltiplas obras com suporte completo a empresa
 */
async function loadSingleObra(obraData) {
    // Modo PARALELO: array de obras
    if (Array.isArray(obraData)) {
        console.log(`⚡ Carregando ${obraData.length} obras em PARALELO...`);
        
        if (obraData.length === 0) return 0;
        
        const startTime = performance.now();
        
        // 1. Criar estruturas em paralelo
        if (window.createEmptyObra) {
            await Promise.allSettled(
                obraData.map(obra => window.createEmptyObra(obra.nome, obra.id))
            );
        }
        
        // 2. Aguardar DOM se estabilizar
        await new Promise(resolve => setTimeout(resolve, 5));
        
        // 3. Carregar TODOS os dados em paralelo
        const promises = obraData.map(async (obra) => {
            try {
                const element = document.querySelector(`[data-obra-id="${obra.id}"]`);
                if (!element) {
                    console.warn(`⚠️ Elemento não encontrado para obra ${obra.id}`);
                    return false;
                }
                
                // 🔥 EXECUTAR EM SEQUÊNCIA PARA GARANTIR QUE EMPRESA SEJA CARREGADA
                // Primeiro: populateObraData (que pode ter lógica de empresa)
                if (window.populateObraData) {
                    await window.populateObraData(obra);
                }
                
                // Segundo: preparar dados da empresa especificamente
                await prepararDadosEmpresaNaObra(obra, element);
                
                return true;
            } catch (error) {
                console.warn(`⚠️ Erro ao carregar obra ${obra.id}:`, error.message);
                return false;
            }
        });
        
        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        
        const endTime = performance.now();
        console.log(`✅ ${successCount}/${obraData.length} obras em ${Math.round(endTime - startTime)}ms`);
        
        return successCount;
    }
    
    // Modo SINGLE: objeto único
    try {
        const obraId = obraData.id.toString();
        const obraNome = obraData.nome || `Obra ${obraId}`;
        
        console.log(`🔄 Carregando obra individual: "${obraNome}"`);
        
        // Verificar se já existe
        let element = document.querySelector(`[data-obra-id="${obraId}"]`);
        
        if (!element && window.createEmptyObra) {
            await window.createEmptyObra(obraNome, obraId);
            await new Promise(resolve => setTimeout(resolve, 5));
            element = document.querySelector(`[data-obra-id="${obraId}"]`);
        }
        
        if (!element) {
            console.error(`❌ Elemento da obra "${obraNome}" não encontrado`);
            return 0;
        }
        
        // 🔥 EXECUTAR EM SEQUÊNCIA PARA GARANTIR EMPRESA
        if (window.populateObraData) {
            await window.populateObraData(obraData);
        }
        
        // Preparar dados da empresa
        await prepararDadosEmpresaNaObra(obraData, element);
        
        return 1;
        
    } catch (error) {
        console.error(`💥 Erro ao carregar obra individual:`, error);
        return 0;
    }
}

/**
 * 🆕 PREPARA DADOS DE EMPRESA NA OBRA CARREGADA - VERSÃO CORRIGIDA
 */
async function prepararDadosEmpresaNaObra(obraData, obraElement) {
    try {
        // Verificar se a obra tem dados de empresa
        const camposEmpresa = [
            'empresaSigla', 'empresaNome', 'numeroClienteFinal', 
            'clienteFinal', 'codigoCliente', 'dataCadastro', 
            'orcamentistaResponsavel', 'idGerado'
        ];
        
        // Log detalhado dos dados recebidos
        console.log('🏢 [EMPRESA] Preparando dados para obra:', obraData.nome || obraData.id);
        console.log('📦 [EMPRESA] Dados disponíveis:', {
            empresaSigla: obraData.empresaSigla,
            empresaNome: obraData.empresaNome,
            numeroClienteFinal: obraData.numeroClienteFinal,
            empresa_id: obraData.empresa_id // 🔥 IMPORTANTE: verificar este campo também
        });
        
        // Verificar se temos dados de empresa
        const temDadosEmpresa = camposEmpresa.some(campo => 
            obraData[campo] && obraData[campo].trim() !== ''
        ) || (obraData.empresa_id && obraData.empresa_id.trim() !== '');
        
        if (!temDadosEmpresa) {
            console.log('📭 [EMPRESA] Obra não possui dados de empresa identificáveis');
            return;
        }
        
        console.log('✅ [EMPRESA] Dados de empresa detectados, preparando...');
        
        // Mapear todos os campos possíveis
        const mapeamentoCampos = {
            empresaSigla: obraData.empresaSigla,
            empresaNome: obraData.empresaNome,
            numeroClienteFinal: obraData.numeroClienteFinal,
            clienteFinal: obraData.clienteFinal,
            codigoCliente: obraData.codigoCliente,
            dataCadastro: obraData.dataCadastro,
            orcamentistaResponsavel: obraData.orcamentistaResponsavel,
            idGerado: obraData.idGerado,
            empresa_id: obraData.empresa_id // 🔥 Adicionar este campo
        };
        
        // Atribuir aos data attributes
        Object.entries(mapeamentoCampos).forEach(([campo, valor]) => {
            if (valor && valor.toString().trim() !== '') {
                const valorAntigo = obraElement.dataset[campo];
                obraElement.dataset[campo] = valor.toString().trim();
                console.log(`✅ [EMPRESA] ${campo}: "${valorAntigo || 'vazio'}" → "${valor}"`);
            }
        });
        
        // 🔥 CHAVE: Atualizar a interface COM OS DADOS DA OBRA
        await atualizarInterfaceComEmpresa(obraElement, obraData);
        
        console.log('✅ [EMPRESA] Preparação concluída com sucesso');
        
    } catch (error) {
        console.error('❌ [EMPRESA] Erro ao preparar dados:', error);
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
            'orcamentistaResponsavel', 'idGerado', 'empresa_id'
        ];
        
        const dadosEmpresa = {};
        let temDados = false;
        
        camposEmpresa.forEach(campo => {
            if (obraElement.dataset[campo]) {
                dadosEmpresa[campo] = obraElement.dataset[campo];
                temDados = true;
            }
        });
        
        if (temDados) {
            console.log(`✅ [EMPRESA] Dados recuperados para obra ${obraId}:`, dadosEmpresa);
        } else {
            console.log(`📭 [EMPRESA] Nenhum dado de empresa encontrado para obra ${obraId}`);
        }
        
        return temDados ? dadosEmpresa : null;
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao obter dados de empresa:`, error);
        return null;
    }
}

/**
 * 🔥 FUNÇÃO AUXILIAR: Forçar atualização de empresa em uma obra específica
 */
async function forcarAtualizacaoEmpresa(obraId) {
    try {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            console.error(`❌ [FORÇAR EMPRESA] Obra ${obraId} não encontrada`);
            return false;
        }
        
        // Obter dados atualizados do servidor
        const response = await fetch(`/obras/${obraId}`);
        if (!response.ok) {
            console.error(`❌ [FORÇAR EMPRESA] Erro ao buscar obra ${obraId}`);
            return false;
        }
        
        const obraData = await response.json();
        
        // Atualizar dados da empresa
        await prepararDadosEmpresaNaObra(obraData, obraElement);
        
        console.log(`✅ [FORÇAR EMPRESA] Empresa atualizada para obra ${obraId}`);
        return true;
        
    } catch (error) {
        console.error(`❌ [FORÇAR EMPRESA] Erro:`, error);
        return false;
    }
}

// Função para debug
async function debugLoadObras() {
    console.log("🐛 [DEBUG] Iniciando debug do carregamento...");
    
    // Verificar funções globais
    console.log("🔍 [DEBUG] Funções disponíveis:", {
        createEmptyObra: typeof window.createEmptyObra,
        populateObraData: typeof window.populateObraData,
        prepararDadosEmpresaNaObra: typeof window.prepararDadosEmpresaNaObra
    });
    
    // Verificar obras no servidor
    try {
        const response = await fetch('/obras');
        if (response.ok) {
            const obras = await response.json();
            console.log(`📦 [DEBUG] ${obras.length} obras no servidor`);
            
            // Verificar dados de empresa nas obras
            obras.forEach((obra, index) => {
                console.log(`   ${index + 1}. ${obra.nome} (${obra.id}):`, {
                    empresaSigla: obra.empresaSigla,
                    empresaNome: obra.empresaNome,
                    empresa_id: obra.empresa_id
                });
            });
        }
    } catch (error) {
        console.error("❌ [DEBUG] Erro ao buscar obras:", error);
    }
}

// Adicionar ao objeto global
if (typeof window !== "undefined") {
    window.prepararDadosEmpresaNaObra = prepararDadosEmpresaNaObra;
    window.obterDadosEmpresaDaObra = obterDadosEmpresaDaObra;
    window.forcarAtualizacaoEmpresa = forcarAtualizacaoEmpresa;
}

// EXPORTS
export {
    removeBaseObraFromHTML,
    loadObrasFromServer,
    loadSingleObra,
    prepararDadosEmpresaNaObra,
    obterDadosEmpresaDaObra,
    forcarAtualizacaoEmpresa,
    debugLoadObras
};