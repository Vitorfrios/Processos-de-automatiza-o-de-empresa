import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../ui/interface.js'
// Importações dos módulos
import { 
  createEmptyRoom, 
  insertRoomIntoProject, 
  addNewRoom, 
  deleteRoom 
} from './modules/projeto.js'

import { 
  buildRoomHTML, 
  buildRoomHeader, 
  buildRoomActions 
} from './modules/salas.js'

import { 
  buildClimatizationSection,
  buildClimatizationTable,
  buildClimaRow,
  buildClimaCell,
  buildSelectInput,
  buildTextInput,
  buildResultRow,
  buildThermalGainsSection
} from './modules/climatizacao.js'

import { 
  buildMachinesSection,
  addMachine,
  deleteClimatizationMachine,
  calculateCapacitySolution,
  updateCapacityFromThermalGains,
  initializeStaticCapacityTable

} from './modules/maquinas.js';

import { 
  buildConfigurationSection 
} from './modules/configuracao.js'

window.calculateCapacitySolution = calculateCapacitySolution;
window.updateCapacityFromThermalGains = updateCapacityFromThermalGains;
window.initializeStaticCapacityTable = initializeStaticCapacityTable;

// Inicializando todos os inputs de capacidade
function initializeAllCapacityInputs() {
  console.log('[INIT] Inicializando todos os inputs de capacidade...');
  
  // Esperar systemConstants carregar
  const waitForConstants = (callback, attempt = 1) => {
    if (window.systemConstants && window.systemConstants.FATOR_SEGURANCA_CAPACIDADE !== undefined) {
      callback();
    } else if (attempt < 10) {
      setTimeout(() => waitForConstants(callback, attempt + 1), 500);
    } else {
      console.error('[INIT] ❌ systemConstants não carregado');
      callback(true);
    }
  };
  
  waitForConstants((useFallback = false) => {
    const inputs = document.querySelectorAll('input[id^="fator-seguranca-"]');
    const valor = useFallback ? 10 : window.systemConstants.FATOR_SEGURANCA_CAPACIDADE;
    
    inputs.forEach(input => {
      if (input.value === '') {
        input.value = valor;
        console.log(`[INIT] ✅ ${input.id} inicializado: ${valor}%`);
      }
    });
  });
}

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initializeAllCapacityInputs, 3000);
});



// Exportações atualizadas
export {
  // Projeto
  createEmptyRoom,
  insertRoomIntoProject,
  addNewRoom,
  deleteRoom,
  
  // Salas
  buildRoomHTML,
  buildRoomHeader,
  buildRoomActions,
  
  // Climatização
  buildClimatizationSection,
  buildClimatizationTable,
  buildClimaRow,
  buildClimaCell,
  buildSelectInput,
  buildTextInput,
  buildResultRow,
  buildThermalGainsSection,
  
  // Máquinas
  buildMachinesSection,
  addMachine,
  deleteClimatizationMachine,
  initializeAllCapacityInputs, 
  
  // Configuração
  buildConfigurationSection
}