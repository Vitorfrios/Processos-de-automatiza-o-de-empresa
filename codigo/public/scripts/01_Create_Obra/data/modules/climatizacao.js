// data/modules/climatizacao/climatizacao-core.js
// 🎯 ARQUIVO PRINCIPAL - ORQUESTRADOR

// Importar todos os módulos
import { 
    buildClimatizationSection,
    buildClimatizationTable, 
    buildClimaRow,
    buildClimaCell,
    buildSelectInput, 
    buildTextInput,
    buildResultRow,
    buildThermalGainsSection,
    buildPressurizationRow,
    togglePressurizationFields
} from './climatizate/climatizacao-builder.js';

import {
    handleWallInputSync,
    syncTitleToAmbiente,
    syncAmbienteToTitle,
    setupCompleteRoomSync
} from './climatizate/climatizacao-sync.js';

// Re-exportar todas as funções
export {
    // Funções de construção
    buildClimatizationSection,
    buildClimatizationTable,
    buildClimaRow,
    buildClimaCell,
    buildSelectInput,
    buildTextInput,
    buildResultRow,
    buildThermalGainsSection,
    buildPressurizationRow,
    togglePressurizationFields,
    
    // Funções de sincronização
    handleWallInputSync,
    syncTitleToAmbiente,
    syncAmbienteToTitle,
    setupCompleteRoomSync
};

// Compatibilidade global
if (typeof window !== 'undefined') {
    // Funções de construção
    window.buildClimatizationSection = buildClimatizationSection;
    window.buildClimatizationTable = buildClimatizationTable;
    window.buildClimaRow = buildClimaRow;
    window.buildClimaCell = buildClimaCell;
    window.buildSelectInput = buildSelectInput;
    window.buildTextInput = buildTextInput;
    window.buildResultRow = buildResultRow;
    window.buildThermalGainsSection = buildThermalGainsSection;
    window.buildPressurizationRow = buildPressurizationRow;
    window.togglePressurizationFields = togglePressurizationFields;
    
    // Funções de sincronização
    window.handleWallInputSync = handleWallInputSync;
    window.syncTitleToAmbiente = syncTitleToAmbiente;
    window.syncAmbienteToTitle = syncAmbienteToTitle;
    window.setupCompleteRoomSync = setupCompleteRoomSync;
}