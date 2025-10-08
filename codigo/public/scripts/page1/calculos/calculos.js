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
  calculateVazaoArAndThermalGains
};