// rooms.js
import { 
  createEmptyRoom, 
  insertRoomIntoProject, 
  addNewRoom, 
  deleteRoom 
} from './modules/room-operations.js'

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

/**
 * Inicializa todos os inputs de capacidade com valores padrão do sistema
 * Aplica o fator de segurança padrão a todos os campos de capacidade vazios
 * @returns {void}
 */
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

/**
 * Força a reinicialização dos inputs de capacidade quando systemConstants estiver disponível
 * Útil para quando as constantes do sistema são carregadas de forma assíncrona
 * @returns {void}
 */
window.reinitializeCapacityInputs = function() {
  console.log('[REINIT] Reinicializando inputs de capacidade...');
  initializeAllCapacityInputs();
};

/**
 * Gera um ID único para uma sala baseado em obra, projeto e nome da sala
 * Inclui timestamp para garantir unicidade
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @returns {string} ID único gerado para a sala
 */
function generateUniqueRoomId(obraName, projectName, roomName) {
    const baseId = roomName.toLowerCase().replace(/\s+/g, '-');
    const timestamp = Date.now().toString().slice(-6);
    return `${obraName}-${projectName}-${baseId}-${timestamp}`.replace(/\s+/g, '-');
}

/**
 * Obtém o próximo número disponível para uma nova sala no projeto
 * Calcula baseado nas salas existentes para manter numeração sequencial
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @returns {number} Próximo número disponível para sala
 */
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

/**
 * Encontra uma sala no DOM pelo seu ID único
 * Retorna informações completas da sala incluindo obra e projeto
 * @param {string} roomId - ID único da sala
 * @returns {Object|null} Objeto com dados da sala ou null se não encontrada
 */
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



// Exportações atualizadas - FUNÇÕES PRINCIPAIS VÊM DO room-operations.js
export {
  // Projeto - FUNÇÕES DO room-operations.js
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

// Disponibilizar funções globalmente
if (typeof window !== 'undefined') {

    window.generateUniqueRoomId = generateUniqueRoomId;
    window.findRoomByUniqueId = findRoomByUniqueId;

}