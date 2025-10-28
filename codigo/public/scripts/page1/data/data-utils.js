/**
 * ORQUESTRADOR PRINCIPAL - data-utils.js
 * Mantém compatibilidade com imports existentes enquanto delega para módulos especializados
 */

// Debug global
console.log('🔄 data-utils.js carregado - versão modularizada')

// Re-exportações com sintaxe de chaves
export {
    buildObraData,
    buildProjectData,
    extractRoomData
} from './data-files/data-builders.js'

export {
    extractThermalGainsData,
    extractClimatizationInputs,
    extractMachinesData,
    extractClimatizationMachineData,
    extractCapacityData,
    extractConfigurationData
} from './data-files/data-extractors.js'

export {
    generateObraId,
    generateProjectId,
    generateRoomId,
    getRoomFullId,
    extractNumberFromText,
    getObraName,
    getProjectName,
    getRoomName,
    getMachineName,
    parseMachinePrice,
    safeNumber,
    debugThermalGainsElements
} from './data-files/data-utils-core.js'

console.log('✅ data-utils.js carregado com sucesso - estrutura modularizada ativa')