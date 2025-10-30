//globals.js - ATUALIZADO PARA SISTEMA DE IDs SEGUROS

// Importar todas as funções que serão usadas globalmente
import { 
  toggleProject, 
  toggleRoom, 
  toggleSection, 
  toggleSubsection,
  addNewProject,
  showSystemStatus,
  addNewObra,
  deleteObra,
  saveOrUpdateObra,
  createEmptyProject,
  addNewProjectToObra
} from './ui/interface.js';

import { makeEditable } from './ui/edit.js';

import { 
  deleteProject} from './data/projects.js';

import { 
  addNewRoom, 
  deleteRoom, 
  addMachine, 
  createEmptyRoom
} from './data/rooms.js';

import { calculateVazaoArAndThermalGains } from './calculos/calculos-manager.js';

/**
 * Inicializa todas as funções globais no objeto window para acesso universal
 * Disponibiliza funções de interface, edição, projetos, salas e cálculos
 * SISTEMA ATUALIZADO COM IDs SEGUROS
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
  
  // Obras (NOVO - Sistema de IDs Seguros)
  window.addNewObra = addNewObra;
  window.deleteObra = deleteObra;
  window.saveOrUpdateObra = saveOrUpdateObra;
  
  // Projetos (ATUALIZADO - IDs Hierárquicos Seguros)
  window.deleteProject = deleteProject;
  window.addNewProject = addNewProject;
  window.addNewProjectToObra = addNewProjectToObra;
  window.createEmptyProject = createEmptyProject;
  
  // Salas (ATUALIZADO - IDs Hierárquicos Seguros)
  window.addNewRoom = addNewRoom;
  window.deleteRoom = deleteRoom;
  window.addMachine = addMachine;
  window.createEmptyRoom = createEmptyRoom;
  
  // Cálculos
  window.calculateVazaoArAndThermalGains = calculateVazaoArAndThermalGains;
  
  // Status do sistema
  window.showSystemStatus = showSystemStatus;
  
  console.log("✅ Todas as funções globais foram inicializadas (Sistema de IDs Seguros)");
}

// Exportar individualmente se necessário
export {
  toggleProject,
  toggleRoom, 
  toggleSection,
  toggleSubsection,
  makeEditable,
  deleteProject,
  addNewProject,
  addNewProjectToObra,
  addNewRoom,
  deleteRoom,
  addMachine,
  calculateVazaoArAndThermalGains,
  showSystemStatus,
  addNewObra,
  deleteObra,
  saveOrUpdateObra,
  createEmptyProject,
  createEmptyRoom
};