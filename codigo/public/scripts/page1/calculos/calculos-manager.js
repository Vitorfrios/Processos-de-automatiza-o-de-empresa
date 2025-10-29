// calculos-manager.js
import { 
  waitForSystemConstants, 
  validateSystemConstants,
  safeNumber 
} from './utils/helpers.js';

import { 
  calculateVazaoAr,
  calculateVazaoArAndThermalGains,
  computeAirFlowRate
} from './airFlow/airFlowCalculations.js';

import { 
  updateFlowRateDisplay 
} from './airFlow/airFlowDisplay.js';

import { 
  calculateThermalGains,
  calculateUValues,
  calculateAuxiliaryVariables 
} from './thermalGains/thermalCalculations.js';

import { 
  updateThermalGainsDisplay 
} from './thermalGains/thermalDisplay.js';



// calculos-manager.js - ADIÇÃO DE DEBOUNCE
let calculationTimeouts = new Map();

/**
 * Sistema de debounce para cálculos - previne execuções repetidas
 * @param {string} roomId - ID da sala
 * @param {Function} calculationFunction - Função de cálculo a ser executada
 * @param {number} delay - Delay em milissegundos (padrão: 500ms)
 */
function debouncedCalculation(roomId, calculationFunction, delay = 500) {
  // Cancelar timeout anterior para esta sala
  if (calculationTimeouts.has(roomId)) {
    clearTimeout(calculationTimeouts.get(roomId));
  }
  
  // Agendar nova execução
  const timeoutId = setTimeout(() => {
    calculationFunction(roomId);
    calculationTimeouts.delete(roomId);
  }, delay);
  
  calculationTimeouts.set(roomId, timeoutId);
}

/**
 * Versão com debounce do cálculo de vazão e ganhos térmicos
 * @param {string} roomId - ID único da sala
 * @returns {Promise<void>}
 */
async function calculateVazaoArAndThermalGainsDebounced(roomId) {
  debouncedCalculation(roomId, async (id) => {
    try {
      console.log(`🔧 Executando cálculo DEBOUNCED para ${id}`);
      const flowRate = await calculateVazaoAr(id, false);
      await calculateThermalGains(id, flowRate);
    } catch (error) {
      console.error(`[DEBOUNCE] Erro em cálculo para ${id}:`, error);
    }
  }, 300);
}




// Re-export todas as funções para manter compatibilidade
export {
  // System
  waitForSystemConstants,
  validateSystemConstants,
  safeNumber,
  
  // Air Flow
  calculateVazaoAr,
  calculateVazaoArAndThermalGains,
  computeAirFlowRate,
  updateFlowRateDisplay,
  
  // Thermal Gains
  calculateThermalGains,
  calculateUValues,
  calculateAuxiliaryVariables,
  updateThermalGainsDisplay
};

// Inicialização do módulo
export default {
  waitForSystemConstants,
  validateSystemConstants,
  calculateVazaoAr,
  calculateThermalGains,
  calculateVazaoArAndThermalGains,
  debouncedCalculation,
  calculateVazaoArAndThermalGainsDebounced
};