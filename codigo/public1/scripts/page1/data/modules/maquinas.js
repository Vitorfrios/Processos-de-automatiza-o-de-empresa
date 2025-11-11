/**
 * maquinas.js
 * Módulo principal de máquinas - SISTEMA CORRIGIDO COM IDs ÚNICOS
 */

import * as Utilities from './machines/utilities.js';
import * as MachinesBuilder from './machines/machinesBuilder.js';
import * as MachineManagement from './machines/machineManagement.js';
import * as CapacityCalculator from './machines/capacityCalculator.js';

import { 
  buildMachinesSection, 
  loadSavedMachines, 
  updateCapacityFromThermalGains,
  initializeCapacityCalculations,
  refreshAllCapacityCalculations
} from './machines/machinesBuilder.js'  

import { 
  addMachine, 
  calculateMachinePrice, 
  updateMachineOptions, 
  deleteClimatizationMachine,
  toggleMachineSection,
  updateMachineTitle
} from './machines/machineManagement.js'  

import { 
  calculateCapacitySolution, 
  updateBackupConfiguration,
  handleClimaInputBackupChange,
  syncCapacityTableBackup,
  saveCapacityData,
  loadCapacityData,
  initializeStaticCapacityTable
} from './machines/capacityCalculator.js'  

// Configurações globais para cálculos de capacidade
const capacityConfig = {
  maxInitAttempts: 3,
  initDelay: 500,
  fallbackFatorSeguranca: 10,
}

const capacityState = new Map()

/**
 * Inicializa o módulo completo de máquinas e cálculos de capacidade
 * Configura listeners e inicia processos em background
 * @returns {void}
 */
function initializeMachinesModule() {
  setTimeout(initializeCapacityCalculations, 1500)
  setTimeout(initializeBackupSync, 2000)
  initializeClimaInputBackupListener()
  initializeFatorSegurancaListeners()
}

/**
 * Inicializa a sincronização de backup em intervalos regulares
 * Garante que os dados de capacidade sejam salvos periodicamente
 * @returns {void}
 */
function initializeBackupSync() {
  const intervals = [1000, 3000, 5000, 7000, 10000]
  intervals.forEach((delay) => {
    setTimeout(() => {
      // ✅ CORREÇÃO: Buscar salas por data attributes em vez de ID
      document.querySelectorAll(".room-block").forEach((roomBlock) => {
        const roomId = roomBlock.dataset.roomId
        if (roomId && roomId !== 'undefined' && roomId !== 'null') {
          syncCapacityTableBackup(roomId)
        }
      })
    }, delay)
  })
}

/**
 * Inicializa o listener para mudanças no campo de backup de climatização
 * Atualiza automaticamente os cálculos quando o backup é alterado
 * @returns {void}
 */
function initializeClimaInputBackupListener() {
  document.addEventListener("change", (event) => {
    const target = event.target
    if (target.classList.contains("clima-input") && target.dataset.field === "backup") {
      // ✅ CORREÇÃO: Buscar sala pelo elemento pai em vez de ID
      const roomBlock = target.closest('.room-block')
      if (roomBlock) {
        const roomId = roomBlock.dataset.roomId
        const newBackupValue = target.value
        if (roomId && roomId !== 'undefined' && roomId !== 'null') {
          handleClimaInputBackupChange(roomId, newBackupValue)
        }
      }
    }
  })
}

/**
 * Inicializa listeners para mudanças no fator de segurança
 * Recalcula a capacidade sempre que o fator de segurança é alterado
 * @returns {void}
 */
function initializeFatorSegurancaListeners() {
  document.addEventListener('change', (event) => {
    if (event.target.id && event.target.id.startsWith('fator-seguranca-')) {
      const roomId = event.target.id.replace('fator-seguranca-', '')
      // ✅ CORREÇÃO: Validar roomId antes de calcular
      if (roomId && roomId !== 'undefined' && roomId !== 'null') {
        calculateCapacitySolution(roomId)
      }
    }
  })
}

// Expor funções no escopo global para acesso via HTML
window.updateElementText = Utilities.updateElementText;
window.removeEmptyMessage = Utilities.removeEmptyMessage;
window.showEmptyMessage = Utilities.showEmptyMessage;
window.findRoomId = Utilities.findRoomId;

window.buildMachinesSection = MachinesBuilder.buildMachinesSection;
window.loadMachinesData = MachinesBuilder.loadMachinesData;
window.loadSavedMachines = MachinesBuilder.loadSavedMachines;
window.updateCapacityFromThermalGains = MachinesBuilder.updateCapacityFromThermalGains;
window.initializeCapacityCalculations = MachinesBuilder.initializeCapacityCalculations;
window.refreshAllCapacityCalculations = MachinesBuilder.refreshAllCapacityCalculations;

window.addMachine = MachineManagement.addMachine;
window.buildClimatizationMachineHTML = MachineManagement.buildClimatizationMachineHTML;
window.toggleMachineSection = MachineManagement.toggleMachineSection;
window.updateMachineTitle = MachineManagement.updateMachineTitle;
window.updateMachineOptions = MachineManagement.updateMachineOptions;
window.calculateMachinePrice = MachineManagement.calculateMachinePrice;
window.deleteClimatizationMachine = MachineManagement.deleteClimatizationMachine;

window.buildCapacityCalculationTable = CapacityCalculator.buildCapacityCalculationTable;
window.calculateCapacitySolution = CapacityCalculator.calculateCapacitySolution;
window.getCapacityData = CapacityCalculator.getCapacityData;
window.saveCapacityData = CapacityCalculator.saveCapacityData;
window.loadCapacityData = CapacityCalculator.loadCapacityData;
window.applyCapacityData = CapacityCalculator.applyCapacityData;
window.updateBackupConfiguration = CapacityCalculator.updateBackupConfiguration;
window.handleClimaInputBackupChange = CapacityCalculator.handleClimaInputBackupChange;
window.syncCapacityTableBackup = CapacityCalculator.syncCapacityTableBackup;
window.initializeStaticCapacityTable = CapacityCalculator.initializeStaticCapacityTable;

// Exportações principais do módulo
export {
  buildMachinesSection,
  addMachine,
  calculateCapacitySolution,
  updateCapacityFromThermalGains,
  calculateMachinePrice,
  updateMachineOptions,
  deleteClimatizationMachine,
  toggleMachineSection,
  updateMachineTitle,
  loadSavedMachines,
  initializeCapacityCalculations,
  refreshAllCapacityCalculations,
  updateBackupConfiguration,
  saveCapacityData,
  loadCapacityData,
  initializeMachinesModule,
  initializeStaticCapacityTable
}

// Inicialização automática quando o módulo é carregado
document.addEventListener("DOMContentLoaded", initializeMachinesModule)