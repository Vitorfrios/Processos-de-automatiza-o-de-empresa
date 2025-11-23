/**
 * utils/page1-functions-loader.js
 * Carregador de funções da Página 1
 */

let functionsCache = null;

/**
 * Carrega todas as funções da Página 1 sem modificar nada
 */
export async function loadPage1Functions() {
    if (functionsCache) {
        return functionsCache;
    }
    
    try {
        console.log('📦 Carregando funções da Página 1...');

        const modules = await Promise.all([
            // 0 – Gerenciamento de Obras
            import('../../01_Create_Obra/features/managers/obra-manager.js'),

            // 1 – Gerenciamento de Projetos/Salas
            import('../../01_Create_Obra/features/managers/project-manager.js'),

            // 2 – UI Builders (renderização de obra/projeto/sala)
            import('../../01_Create_Obra/data/builders/ui-builders.js'),

            // 3 – Cálculos de vazão + ganhos térmicos
            import('../../01_Create_Obra/features/calculations/air-flow.js'),

            // 4 – Tabela de capacidade (TR, backup, folga)
            import('../../01_Create_Obra/data/modules/machines/capacity-calculator.js'),

            import('../../01_Create_Obra/data/modules/rooms.js')
        ]);

        functionsCache = {
            // Gerenciamento de Obras
            createEmptyObra: modules[0].createEmptyObra,
            insertObraIntoDOM: modules[0].insertObraIntoDOM,
            updateObraButtonAfterSave: modules[0].updateObraButtonAfterSave,

            // Gerenciamento de Projetos/Salas
            createEmptyProject: modules[1].createEmptyProject,
            createEmptyRoom: modules[5].createEmptyRoom,

            // UI Builders (reconstruir obra completa a partir de JSON)
            populateObraData: modules[2].populateObraData,

            // Cálculos (vazão + ganhos térmicos)
            calculateVazaoArAndThermalGains: modules[3].calculateVazaoArAndThermalGains,

            // Capacidade (TR, backup, folga)
            calculateCapacitySolution: modules[4].calculateCapacitySolution,
        };

        // ✅ CORREÇÃO CRÍTICA: Adicionar return faltante
        console.log('✅ Funções da Página 1 carregadas com sucesso');
        return functionsCache;
        
    } catch (error) {
        console.error('❌ Erro ao carregar funções da Página 1 no manager:', error);
        throw error; // ✅ CORREÇÃO: Propagar o erro
    }
}

/**
 * Remove stubs conflitantes para liberar espaço para funções reais
 */
export function removeConflictingStubs() {
    const stubsToRemove = [
        'calculateVazaoArAndThermalGains',
        'calculateCapacitySolution', 
        'updateCapacityFromThermalGains'
    ];
    
    stubsToRemove.forEach(stub => {
        if (window[stub] && window[stub].toString().includes('STUB')) {
            delete window[stub];
            console.log(`🗑️ Stub removido: ${stub}`);
        }
    });
}