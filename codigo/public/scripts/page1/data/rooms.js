import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../ui/interface.js'
// Importações dos módulos - AGORA DO projeto.js
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
  
  // Verificar se systemConstants está disponível
  if (!window.systemConstants || window.systemConstants.FATOR_SEGURANCA_CAPACIDADE === undefined) {
    console.error('[INIT] ❌ systemConstants não carregado - abortando inicialização');
    return;
  }
  
  const inputs = document.querySelectorAll('input[id^="fator-seguranca-"]');
  const valor = window.systemConstants.FATOR_SEGURANCA_CAPACIDADE;
  
  inputs.forEach(input => {
    if (input.value === '') {
      input.value = valor;
      console.log(`[INIT] ✅ ${input.id} inicializado: ${valor}%`);
    }
  });
}

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  // Tentar inicializar após um delay
  setTimeout(initializeAllCapacityInputs, 3000);
});

// Função para forçar reinicialização quando systemConstants estiver disponível
window.reinitializeCapacityInputs = function() {
  console.log('[REINIT] Reinicializando inputs de capacidade...');
  initializeAllCapacityInputs();
};

// ✅ CORREÇÃO: Função para criar ID único de sala (mantida para compatibilidade)
function generateUniqueRoomId(obraName, projectName, roomName) {
    const baseId = roomName.toLowerCase().replace(/\s+/g, '-');
    const timestamp = Date.now().toString().slice(-6);
    return `${obraName}-${projectName}-${baseId}-${timestamp}`.replace(/\s+/g, '-');
}

// ✅ CORREÇÃO: Função para obter próximo número de sala (mantida para compatibilidade)
function getNextRoomNumber(obraName, projectName) {
    const projectElement = document.querySelector(`[data-obra-name="${obraName}"] [data-project-name="${projectName}"]`);
    if (!projectElement) return 1;

    const rooms = projectElement.querySelectorAll('.room-block');
    const roomNumbers = Array.from(rooms).map(room => {
        const roomName = room.dataset.roomName;
        const match = roomName.match(/Sala(\d+)/);
        return match ? parseInt(match[1]) : 0;
    });

    const maxNumber = Math.max(0, ...roomNumbers);
    return maxNumber + 1;
}

// ✅ CORREÇÃO: Função para encontrar sala pelo ID único (mantida para compatibilidade)
function findRoomByUniqueId(roomId) {
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomElement) {
        return {
            element: roomElement,
            obraName: roomElement.dataset.obraName,
            projectName: roomElement.dataset.projectName,
            roomName: roomElement.dataset.roomName
        };
    }
    return null;
}

// ✅ CORREÇÃO: Funções principais AGORA SÃO DO projeto.js
// Este arquivo serve apenas como ponte e para funções auxiliares

// Exportações atualizadas - FUNÇÕES PRINCIPAIS VÊM DO projeto.js
export {
  // Projeto - FUNÇÕES DO projeto.js
  createEmptyRoom,
  insertRoomIntoProject,
  addNewRoom,
  deleteRoom,
  
  // Salas
  buildRoomHTML,
  buildRoomHeader,
  buildRoomActions,
  
  // Funções auxiliares de IDs únicos
  generateUniqueRoomId,
  getNextRoomNumber,
  findRoomByUniqueId,
  
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

// ✅ CORREÇÃO: Disponibilizar funções globalmente (as principais já estão no projeto.js)
if (typeof window !== 'undefined') {
    // Funções auxiliares
    window.generateUniqueRoomId = generateUniqueRoomId;
    window.findRoomByUniqueId = findRoomByUniqueId;
    
    // As funções principais addNewRoom, deleteRoom, createEmptyRoom 
    // já estão disponíveis via projeto.js
}