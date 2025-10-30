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

/**
 * Função principal de cálculo - ATUALIZADA para IDs seguros
 * @param {string} roomId - ID único da sala (formato: obra_w12_proj_t34_1_sala_r21_1)
 * @returns {Promise<void>}
 *
async function calculateVazaoArAndThermalGains(roomId) {
  try {
    console.log(`🎯 INICIANDO CÁLCULO PARA SALA: ${roomId}`);
    
    // ✅ VALIDAÇÃO: Verificar se o ID é válido
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
      console.error(`❌ ID de sala inválido: ${roomId}`);
      return;
    }
    
    // ✅ VALIDAÇÃO: Verificar se a sala existe no DOM
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomElement) {
      console.error(`❌ Elemento da sala não encontrado: ${roomId}`);
      console.log('🔍 Salas disponíveis no DOM:');
      document.querySelectorAll('[data-room-id]').forEach(room => {
        console.log(`  - ${room.dataset.roomId}`);
      });
      return;
    }
    
    console.log(`✅ Sala encontrada no DOM: ${roomId}`);
    
    // ✅ AGUARDAR constantes do sistema
    await waitForSystemConstants();
    
    // ✅ EXECUTAR cálculos
    const flowRate = await calculateVazaoAr(roomId, false);
    await calculateThermalGains(roomId, flowRate);
    
    console.log(`✅ CÁLCULO CONCLUÍDO PARA: ${roomId}`);
    
  } catch (error) {
    console.error(`❌ ERRO NO CÁLCULO PARA ${roomId}:`, error);
  }
}*/

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
  updateThermalGainsDisplay,
  
  // Debounce functions
  debouncedCalculation,
  calculateVazaoArAndThermalGainsDebounced
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