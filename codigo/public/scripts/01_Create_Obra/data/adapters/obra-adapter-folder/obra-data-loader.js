// obra-data-loader.js
import { obterDadosEmpresaDaObra } from '../../empresa-system/empresa-core.js'
import {
    prepararDadosEmpresaNaObra,
    forcarAtualizacaoEmpresa
} from '../../empresa-system/empresa-data-extractor.js'
import { matchesEmpresaContext } from '../../../core/config.js'
/**
 * Remove todas as obras base do container HTML
 */
function removeBaseObraFromHTML() {
    const obrasContainer = document.getElementById("projects-container")
    if (!obrasContainer) return

    const existingObras = obrasContainer.querySelectorAll(".obra-block")
    existingObras.forEach((obra) => obra.remove())
}

function filterObrasForCurrentMode(obras) {
    if (!Array.isArray(obras)) return []

    return obras.filter((obra) => {
        if (matchesEmpresaContext(obra)) {
            return true
        }

        console.warn(`[LOAD OBRAS] Obra ${obra.id} ignorada por nao pertencer a empresa autenticada`)
        return false
    })
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
        
        const obrasPermitidas = filterObrasForCurrentMode(obrasParaCarregar);

        if (obrasPermitidas.length === 0) return;
        
        // Limpar interface
        removeBaseObraFromHTML();
        
        // Criar todas as estruturas básicas primeiro
        if (window.createEmptyObra) {
            await Promise.allSettled(
                obrasPermitidas.map(obra => 
                    window.createEmptyObra(obra.nome, obra.id)
                )
            );
        }
        
        // Aguardar micro-tick para DOM
        await new Promise(resolve => setTimeout(resolve, 5));
        
        // Carregar TODOS os dados em PARALELO ABSOLUTO
        const loadPromises = obrasPermitidas.map(obra => 
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
        const obrasPermitidas = filterObrasForCurrentMode(obraData)

        console.log(`⚡ Carregando ${obraData.length} obras em PARALELO...`);
        
        if (obrasPermitidas.length === 0) return 0;
        
        const startTime = performance.now();
        
        // 1. Criar estruturas em paralelo
        if (window.createEmptyObra) {
            await Promise.allSettled(
                obrasPermitidas.map(obra => window.createEmptyObra(obra.nome, obra.id))
            );
        }
        
        // 2. Aguardar DOM se estabilizar
        await new Promise(resolve => setTimeout(resolve, 5));
        
        // 3. Carregar TODOS os dados em paralelo
        const promises = obrasPermitidas.map(async (obra) => {
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
        if (!matchesEmpresaContext(obraData)) {
            console.warn(`[LOAD OBRAS] Obra ${obraData?.id} bloqueada para a empresa autenticada`)
            return 0
        }

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
if (typeof window !== 'undefined') {
    window.loadObrasFromServer=loadObrasFromServer
    window.removeBaseObraFromHTML=removeBaseObraFromHTML
    window.loadSingleObra=loadSingleObra
}

// EXPORTS
export {
    removeBaseObraFromHTML,
    loadObrasFromServer,
    loadSingleObra,
    debugLoadObras
};
