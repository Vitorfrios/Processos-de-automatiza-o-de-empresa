// server-modules/obra-loader.js - CORREÇÃO COMPLETA:

import { isSessionActive } from "./session-manager.js"

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
 * Carrega obras salvas do servidor para a sessão atual - VERSÃO CORRIGIDA
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

        // ✅ CORREÇÃO CRÍTICA: Buscar TODAS as obras do servidor
        const obrasResponse = await fetch('/obras');
        if (!obrasResponse.ok) {
            console.error("❌ [LOAD OBRAS] Erro ao buscar dados das obras");
            return;
        }

        const todasObras = await obrasResponse.json();
        console.log(`📦 [LOAD OBRAS] ${todasObras.length} obras disponíveis no servidor`);
        
        // ✅ CORREÇÃO CRÍTICA: Converter IDs da sessão para string e encontrar correspondências
        const obrasDaSessao = todasObras.filter(obra => {
            // Tentar encontrar por ID exato (novo formato)
            if (obraIds.includes(obra.id)) {
                return true;
            }
            
            // ✅ CORREÇÃO: Tentar encontrar por ID numérico (compatibilidade com sessão antiga)
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
            
            // ✅ CORREÇÃO: Limpar sessão se não encontrar obras correspondentes
            console.log("🔄 [LOAD OBRAS] Tentando migrar sessão para novos IDs...");
            await migrateSessionToNewIds(obraIds, todasObras);
            return;
        }

        // ✅ CORREÇÃO: Limpar interface antes de carregar
        removeBaseObraFromHTML();
        
        // ✅ CORREÇÃO: Carregar cada obra individualmente com await
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
 * ✅ NOVA FUNÇÃO: Migra sessão de IDs antigos para novos
 */
async function migrateSessionToNewIds(oldObraIds, todasObras) {
    try {
        console.log("🔄 [MIGRATION] Iniciando migração de sessão...");
        
        // Buscar TODAS as obras disponíveis
        const novasObraIds = todasObras.map(obra => obra.id);
        
        if (novasObraIds.length > 0) {
            // Atualizar sessão com novos IDs
            await fetch('/api/session-obras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ obras: novasObraIds })
            });
            
            console.log(`✅ [MIGRATION] Sessão migrada: ${oldObraIds.length} IDs antigos → ${novasObraIds.length} IDs novos`);
            console.log("🔄 [MIGRATION] Recarregando obras com novos IDs...");
            
            // Recarregar com novos IDs
            await loadObrasFromServer();
        } else {
            console.log("📭 [MIGRATION] Nenhuma obra disponível para migração");
        }
    } catch (error) {
        console.error("❌ [MIGRATION] Erro na migração:", error);
    }
}

/**
 * ✅ CORREÇÃO: Função para carregar uma obra individual
 */
async function loadSingleObra(obraData) {
    if (!obraData || !obraData.id) {
        console.error('❌ [LOAD OBRAS] Dados de obra inválidos:', obraData);
        return false;
    }

    console.log(`🔄 [LOAD OBRAS] Carregando obra: "${obraData.nome}" (ID: ${obraData.id})`);
    
    try {
        // ✅ CORREÇÃO: Verificar se a obra já existe no DOM
        const obraExistente = document.querySelector(`[data-obra-id="${obraData.id}"]`);
        if (obraExistente) {
            console.log(`⚠️ [LOAD OBRAS] Obra "${obraData.nome}" já existe no DOM, atualizando...`);
            
            if (typeof window.populateObraData === 'function') {
                await window.populateObraData(obraData);
                console.log(`✅ [LOAD OBRAS] Obra "${obraData.nome}" atualizada com sucesso`);
                return true;
            }
        }
        
        // ✅ CORREÇÃO: Se não existe, criar nova obra
        if (typeof window.createEmptyObra === 'function') {
            console.log(`🔨 [LOAD OBRAS] Criando nova obra: "${obraData.nome}"`);
            
            // Criar obra vazia com ID específico
            await window.createEmptyObra(obraData.nome, obraData.id);
            
            // ✅ CORREÇÃO: Aguardar criação no DOM
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Verificar se foi criada
            const obraCriada = document.querySelector(`[data-obra-id="${obraData.id}"]`);
            if (obraCriada && typeof window.populateObraData === 'function') {
                console.log(`🎨 [LOAD OBRAS] Preenchendo dados da obra "${obraData.nome}"...`);
                await window.populateObraData(obraData);
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

// ✅ CORREÇÃO: Função alternativa para debug
async function debugLoadObras() {
    console.log("🐛 [DEBUG] Iniciando debug do carregamento...");
    
    // Verificar funções globais
    console.log("🔍 [DEBUG] Funções disponíveis:", {
        createEmptyObra: typeof window.createEmptyObra,
        populateObraData: typeof window.populateObraData,
        createEmptyProject: typeof window.createEmptyProject,
        createEmptyRoom: typeof window.createEmptyRoom
    });
    
    // Verificar obras no servidor
    try {
        const response = await fetch('/obras');
        if (response.ok) {
            const obras = await response.json();
            console.log(`📦 [DEBUG] Obras no servidor: ${obras.length}`, obras.map(o => ({id: o.id, nome: o.nome})));
        }
    } catch (error) {
        console.error("❌ [DEBUG] Erro ao buscar obras:", error);
    }
}

export {
    loadObrasFromServer,
    removeBaseObraFromHTML,
    loadSingleObra,
    debugLoadObras // ✅ Exportar função de debug
};