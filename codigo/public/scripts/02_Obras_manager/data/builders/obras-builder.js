/**
 * data/builders/obras-builder.js
 * Auxiliares não-visuais para obras (contagens, formatos, metadados)
 */

/**
 * Calcula estatísticas de uma obra
 * @param {Object} obra - Dados da obra
 * @returns {Object} Estatísticas da obra
 */
export function getObraStats(obra) {
    const projetos = obra.projetos || [];
    let totalSalas = 0;
    let totalMaquinas = 0;
    
    projetos.forEach(projeto => {
        const salas = projeto.salas || [];
        totalSalas += salas.length;
        
        salas.forEach(sala => {
            totalMaquinas += (sala.maquinas || []).length;
        });
    });
    
    return {
        projetos: projetos.length,
        salas: totalSalas,
        maquinas: totalMaquinas,
        lastUpdated: obra.timestamp || 'N/A'
    };
}

/**
 * Formata estatísticas para exibição
 * @param {Object} stats - Estatísticas da obra
 * @returns {string} Texto formatado
 */
export function formatObraStats(stats) {
    const parts = [];
    
    if (stats.projetos > 0) {
        parts.push(`${stats.projetos} projeto${stats.projetos !== 1 ? 's' : ''}`);
    }
    
    if (stats.salas > 0) {
        parts.push(`${stats.salas} sala${stats.salas !== 1 ? 's' : ''}`);
    }
    
    if (stats.maquinas > 0) {
        parts.push(`${stats.maquinas} máquina${stats.maquinas !== 1 ? 's' : ''}`);
    }
    
    return parts.join(' • ') || 'Vazia';
}

/**
 * Extrai metadados para filtros futuros
 * @param {Object} obra - Dados da obra
 * @returns {Object} Metadados para filtragem
 */
export function extractObraMetadata(obra) {
    const stats = getObraStats(obra);
    
    return {
        id: obra.id,
        nome: obra.nome,
        ...stats,
        hasProjects: stats.projetos > 0,
        hasRooms: stats.salas > 0,
        hasMachines: stats.maquinas > 0,
        isEmpty: stats.projetos === 0 && stats.salas === 0 && stats.maquinas === 0,
        timestamp: obra.timestamp,
        searchableText: `${obra.nome} ${obra.id}`.toLowerCase()
    };
}

/**
 * Aplica filtros às obras (stub para implementação futura)
 * @param {Array} obras - Array de obras
 * @param {Object} criteria - Critérios de filtro
 * @returns {Array} Obras filtradas
 */
export function applyFilters(obras, criteria = {}) {
    console.log('🔍 Aplicando filtros:', criteria);
    
    let filtered = [...obras];
    
    // Filtro por texto (nome ou ID)
    if (criteria.searchText) {
        const searchText = criteria.searchText.toLowerCase();
        filtered = filtered.filter(obra => 
            obra.nome.toLowerCase().includes(searchText) ||
            obra.id.toLowerCase().includes(searchText)
        );
    }
    
    // Filtro por projetos
    if (criteria.hasProjects !== undefined) {
        const stats = filtered.map(obra => getObraStats(obra));
        filtered = filtered.filter((obra, index) => 
            criteria.hasProjects ? stats[index].projetos > 0 : stats[index].projetos === 0
        );
    }
    
    // Filtro por salas
    if (criteria.hasRooms !== undefined) {
        const stats = filtered.map(obra => getObraStats(obra));
        filtered = filtered.filter((obra, index) => 
            criteria.hasRooms ? stats[index].salas > 0 : stats[index].salas === 0
        );
    }
    
    console.log(`📊 Filtros aplicados: ${filtered.length} obra(s) restante(s)`);
    return filtered;
}