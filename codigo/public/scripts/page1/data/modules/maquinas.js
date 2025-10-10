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
  getCapacityData,
  applyCapacityData,
  initializeStaticCapacityTable
} from './machines/capacityCalculator.js'  

import { 
  updateElementText, 
  removeEmptyMessage, 
  showEmptyMessage, 
  findRoomId 
} from './machines/utilities.js'  



// Configurações globais
const capacityConfig = {
  maxInitAttempts: 3,
  initDelay: 500,
  fallbackFatorSeguranca: 10,
}

const capacityState = new Map()
let machinesData = null

// Inicialização
function initializeMachinesModule() {
  setTimeout(initializeCapacityCalculations, 1500)
  setTimeout(initializeBackupSync, 2000)
  initializeClimaInputBackupListener()
  initializeFatorSegurancaListeners()
}

function initializeBackupSync() {
  const intervals = [1000, 3000, 5000, 7000, 10000]
  intervals.forEach((delay) => {
    setTimeout(() => {
      document.querySelectorAll(".room-block").forEach((roomBlock) => {
        const roomId = roomBlock.id.replace("room-content-", "")
        syncCapacityTableBackup(roomId)
      })
    }, delay)
  })
}

function initializeClimaInputBackupListener() {
  document.addEventListener("change", (event) => {
    const target = event.target
    if (target.classList.contains("clima-input") && target.dataset.field === "backup") {
      const roomContent = target.closest('[id^="room-content-"]')
      if (roomContent) {
        const roomId = roomContent.id.replace("room-content-", "")
        const newBackupValue = target.value
        handleClimaInputBackupChange(roomId, newBackupValue)
      }
    }
  })
}

function initializeFatorSegurancaListeners() {
  document.addEventListener('change', (event) => {
    if (event.target.id && event.target.id.startsWith('fator-seguranca-')) {
      const roomId = event.target.id.replace('fator-seguranca-', '')
      calculateCapacitySolution(roomId)
    }
  })
}

// Expor no escopo global para HTML
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
// Exportações principais
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