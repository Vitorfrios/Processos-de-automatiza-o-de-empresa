/**
 * rooms.js
 * Módulo de salas - SISTEMA CORRIGIDO COM IDs ÚNICOS
 */

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
  
  // ✅ CORREÇÃO: Buscar inputs por data attributes em vez de apenas ID
  const inputs = document.querySelectorAll('input[id^="fator-seguranca-"]');
  const valor = window.systemConstants.FATOR_SEGURANCA_CAPACIDADE;
  
  inputs.forEach(input => {
    // ✅ CORREÇÃO: Validar que o input pertence a uma sala válida
    const roomId = input.id.replace('fator-seguranca-', '');
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    
    if (roomElement && input.value === '') {
      input.value = valor;
      console.log(`[INIT] ✅ ${input.id} inicializado: ${valor}% (Sala: ${roomId})`);
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
 * Inclui timestamp para garantir unicidade - FUNÇÃO LEGACY
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
 * Encontra uma sala no DOM pelo seu ID único
 * Retorna informações completas da sala incluindo obra e projeto
 * @param {string} roomId - ID único da sala
 * @returns {Object|null} Objeto com dados da sala ou null se não encontrada
 */
function findRoomByUniqueId(roomId) {
    // ✅ CORREÇÃO: Buscar APENAS por data-room-id
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomElement) {
        return {
            element: roomElement,
            obraId: roomElement.dataset.obraId,
            obraName: roomElement.dataset.obraName,
            projectId: roomElement.dataset.projectId,
            projectName: roomElement.dataset.projectName,
            roomName: roomElement.dataset.roomName
        };
    }
    return null;
}

/**
 * Encontra todas as salas de um projeto específico
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @returns {Array} Lista de elementos de sala
 */
function findRoomsByProject(obraId, projectId) {
    // ✅ CORREÇÃO: Buscar por IDs únicos
    return Array.from(document.querySelectorAll(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`));
}

/**
 * Obtém informações completas de uma sala pelo ID
 * @param {string} roomId - ID único da sala
 * @returns {Object|null} Informações da sala
 */
function getRoomInfo(roomId) {
    const roomData = findRoomByUniqueId(roomId);
    if (!roomData) return null;
    
    return {
        ...roomData,
        fullId: roomId,
        isSecureId: roomId.includes('_proj_') && roomId.includes('_sala_')
    };
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
  findRoomByUniqueId,
  findRoomsByProject,
  getRoomInfo,
  
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
    window.findRoomsByProject = findRoomsByProject;
    window.getRoomInfo = getRoomInfo;
}