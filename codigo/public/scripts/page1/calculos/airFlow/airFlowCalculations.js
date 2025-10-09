import { CALCULATION_CONSTANTS } from '../../config/config.js';
import { 
  waitForSystemConstants, 
  validateSystemConstants, 
  collectClimatizationInputs,
  safeNumber 
} from '../utils/helpers.js';
import { updateFlowRateDisplay } from './airFlowDisplay.js';
import { calculateThermalGains } from '../thermalGains/thermalCalculations.js';

/**
 * Calcula fluxo de ar individual por porta
 */
function calculateDoorFlow(doorCount, doorVariable, pressure) {
  const count = safeNumber(doorCount);
  const variable = safeNumber(doorVariable);
  const press = safeNumber(pressure);
  
  console.log(` calculateDoorFlow: count=${count}, variable=${variable}, pressure=${press}`);
  
  const pressureExponent = press > 0 ? Math.pow(press, CALCULATION_CONSTANTS.PRESSURE_EXPONENT) : 0;
  
  const flow = CALCULATION_CONSTANTS.FLOW_COEFFICIENT *
    count *
    variable *
    pressureExponent *
    CALCULATION_CONSTANTS.SECONDS_PER_HOUR;
    
  console.log(` Fluxo calculado: ${flow}`);
  return flow;
}

/**
 * Calcula vazão total de ar baseada em portas e pressurização
 */
function computeAirFlowRate(inputData) {
  const numPortasDuplas = safeNumber(inputData.numPortasDuplas);
  const numPortasSimples = safeNumber(inputData.numPortasSimples);
  const pressurizacao = safeNumber(inputData.pressurizacao);

  console.log(" ===== CÁLCULO DE VAZÃO =====");
  console.log(" Portas Duplas:", numPortasDuplas);
  console.log(" Portas Simples:", numPortasSimples);
  console.log(" Pressurização (Pa):", pressurizacao);

  if (!window.systemConstants || !window.systemConstants.VARIAVEL_PD || !window.systemConstants.VARIAVEL_PS) {
    console.error(" ERRO: Constantes do sistema não disponíveis para cálculo");
    alert("ERRO: Constantes do sistema não carregadas. Verifique o servidor.");
    return 0;
  }

  const doubleDoorFlow = calculateDoorFlow(numPortasDuplas, window.systemConstants.VARIAVEL_PD, pressurizacao);
  const singleDoorFlow = calculateDoorFlow(numPortasSimples, window.systemConstants.VARIAVEL_PS, pressurizacao);

  console.log(" Fluxo Portas Duplas:", doubleDoorFlow);
  console.log(" Fluxo Portas Simples:", singleDoorFlow);

  const totalFlow = doubleDoorFlow + singleDoorFlow;
  const adjustedFlow = totalFlow / CALCULATION_CONSTANTS.FLOW_DIVISOR;
  const finalFlow = adjustedFlow * CALCULATION_CONSTANTS.SAFETY_FACTOR;
  const roundedFlow = Math.ceil(finalFlow);

  console.log(" Fluxo Total:", totalFlow);
  console.log(" Fluxo Ajustado:", adjustedFlow);
  console.log(" Fluxo Final:", finalFlow);
  console.log(" Vazão Arredondada:", roundedFlow);
  console.log(" ===== FIM DO CÁLCULO =====");

  return roundedFlow;
}

/**
 * Orquestra cálculo completo de vazão com validações
 */
async function calculateVazaoAr(roomId, calculateThermal = true) {
  try {
    console.log(` Iniciando cálculo de vazão para ${roomId}`);
    
    await waitForSystemConstants();
    
    if (!validateSystemConstants()) {
      console.error(" Constantes do sistema inválidas");
      return 0;
    }

    const roomContent = document.getElementById(`room-content-${roomId}`);
    if (!roomContent) {
      console.error(" Sala não encontrada:", roomId);
      return 0;
    }

    const climaSection = roomContent.querySelector('[id*="-clima"]');
    if (!climaSection) {
      console.error(" Seção de climatização não encontrada");
      return 0;
    }

    const inputData = collectClimatizationInputs(climaSection, roomId);
    const flowRate = computeAirFlowRate(inputData);

    updateFlowRateDisplay(roomId, flowRate);

    if (calculateThermal) {
      console.log(` Chamando cálculo de ganhos térmicos para ${roomId}`);
      await calculateThermalGains(roomId, flowRate);
    }

    return flowRate;
  } catch (error) {
    console.error(" Erro no cálculo de vazão:", error);
    alert("Erro ao calcular vazão. Verifique se as constantes do sistema foram carregadas.");
    return 0;
  }
}

/**
 * Coordena cálculo sequencial de vazão e ganhos térmicos
 */
async function calculateVazaoArAndThermalGains(roomId) {
  try {
    const flowRate = await calculateVazaoAr(roomId, false);
    await calculateThermalGains(roomId, flowRate);
  } catch (error) {
    console.error(`[DEBUG] Erro em calculateVazaoArAndThermalGains:`, error);
  }
}

export {
  calculateDoorFlow,
  computeAirFlowRate,
  calculateVazaoAr,
  calculateVazaoArAndThermalGains
};