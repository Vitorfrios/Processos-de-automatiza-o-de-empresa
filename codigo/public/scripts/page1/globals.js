//globals.js

// Importar todas as funções que serão usadas globalmente
import { 
  toggleProject, 
  toggleRoom, 
  toggleSection, 
  toggleSubsection,
  addNewProject,
  showSystemStatus 
} from './ui/interface.js';

import { makeEditable } from './ui/edit.js';

import { 
  deleteProject, 
  verifyProjectData, 
  saveProject,
  getNextProjectNumber 
} from './data/projects.js';

import { 
  addNewRoom, 
  deleteRoom, 
  addMachine, 
  deleteMachine 
} from './data/rooms.js';

import { calculateVazaoArAndThermalGains } from './calculos/calculos-manager.js';

/**
 * Inicializa todas as funções globais no objeto window para acesso universal
 * Disponibiliza funções de interface, edição, projetos, salas e cálculos
 * @returns {void}
 * 
 * @example
 * initializeGlobals() // Todas as funções ficam disponíveis em window
 */
export function initializeGlobals() {
  // Interface e navegação
  window.toggleProject = toggleProject;
  window.toggleRoom = toggleRoom;
  window.toggleSection = toggleSection;
  window.toggleSubsection = toggleSubsection;
  
  // Edição
  window.makeEditable = makeEditable;
  
  // Projetos
  window.deleteProject = deleteProject;
  window.verifyProjectData = verifyProjectData;
  window.saveProject = saveProject;
  window.addNewProject = addNewProject;
  window.getNextProjectNumber = getNextProjectNumber;
  
  // Salas
  window.addNewRoom = addNewRoom;
  window.deleteRoom = deleteRoom;
  window.addMachine = addMachine;
  window.deleteMachine = deleteMachine;
  
  // Cálculos
  window.calculateVazaoArAndThermalGains = calculateVazaoArAndThermalGains;
  
  // Status do sistema
  window.showSystemStatus = showSystemStatus;
  
  console.log("✅ Todas as funções globais foram inicializadas");
}

// Exportar individualmente se necessário
export {
  toggleProject,
  toggleRoom, 
  toggleSection,
  toggleSubsection,
  makeEditable,
  deleteProject,
  verifyProjectData,
  saveProject,
  addNewProject,
  addNewRoom,
  deleteRoom,
  addMachine,
  calculateVazaoArAndThermalGains,
  showSystemStatus
};