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
  
  console.log(`[v0] calculateDoorFlow: count=${count}, variable=${variable}, pressure=${press}`);
  
  const pressureExponent = press > 0 ? Math.pow(press, CALCULATION_CONSTANTS.PRESSURE_EXPONENT) : 0;
  
  const flow = CALCULATION_CONSTANTS.FLOW_COEFFICIENT *
    count *
    variable *
    pressureExponent *
    CALCULATION_CONSTANTS.SECONDS_PER_HOUR;
    
  console.log(`[v0] Fluxo calculado: ${flow}`);
  return flow;
}

/**
 * Calcula vazão total de ar baseada em portas e pressurização
 */
function computeAirFlowRate(inputData) {
  const numPortasDuplas = safeNumber(inputData.numPortasDuplas);
  const numPortasSimples = safeNumber(inputData.numPortasSimples);
  const pressurizacao = safeNumber(inputData.pressurizacao);

  console.log("[v0] ===== CÁLCULO DE VAZÃO =====");
  console.log("[v0] Portas Duplas:", numPortasDuplas);
  console.log("[v0] Portas Simples:", numPortasSimples);
  console.log("[v0] Pressurização (Pa):", pressurizacao);

  if (!window.systemConstants || !window.systemConstants.VARIAVEL_PD || !window.systemConstants.VARIAVEL_PS) {
    console.error("[v0] ERRO: Constantes do sistema não disponíveis para cálculo");
    alert("ERRO: Constantes do sistema não carregadas. Verifique o servidor.");
    return 0;
  }

  const doubleDoorFlow = calculateDoorFlow(numPortasDuplas, window.systemConstants.VARIAVEL_PD, pressurizacao);
  const singleDoorFlow = calculateDoorFlow(numPortasSimples, window.systemConstants.VARIAVEL_PS, pressurizacao);

  console.log("[v0] Fluxo Portas Duplas:", doubleDoorFlow);
  console.log("[v0] Fluxo Portas Simples:", singleDoorFlow);

  const totalFlow = doubleDoorFlow + singleDoorFlow;
  const adjustedFlow = totalFlow / CALCULATION_CONSTANTS.FLOW_DIVISOR;
  const finalFlow = adjustedFlow * CALCULATION_CONSTANTS.SAFETY_FACTOR;
  const roundedFlow = Math.ceil(finalFlow);

  console.log("[v0] Fluxo Total:", totalFlow);
  console.log("[v0] Fluxo Ajustado:", adjustedFlow);
  console.log("[v0] Fluxo Final:", finalFlow);
  console.log("[v0] Vazão Arredondada:", roundedFlow);
  console.log("[v0] ===== FIM DO CÁLCULO =====");

  return roundedFlow;
}

/**
 * Orquestra cálculo completo de vazão com validações
 */
async function calculateVazaoAr(roomId, calculateThermal = true) {
  try {
    console.log(`[v0] Iniciando cálculo de vazão para ${roomId}`);
    
    await waitForSystemConstants();
    
    if (!validateSystemConstants()) {
      console.error("[v0] Constantes do sistema inválidas");
      return 0;
    }

    const roomContent = document.getElementById(`room-content-${roomId}`);
    if (!roomContent) {
      console.error("[v0] Sala não encontrada:", roomId);
      return 0;
    }

    const climaSection = roomContent.querySelector('[id*="-clima"]');
    if (!climaSection) {
      console.error("[v0] Seção de climatização não encontrada");
      return 0;
    }

    const inputData = collectClimatizationInputs(climaSection, roomId);
    const flowRate = computeAirFlowRate(inputData);

    updateFlowRateDisplay(roomId, flowRate);

    if (calculateThermal) {
      console.log(`[v0] Chamando cálculo de ganhos térmicos para ${roomId}`);
      await calculateThermalGains(roomId, flowRate);
    }

    return flowRate;
  } catch (error) {
    console.error("[v0] Erro no cálculo de vazão:", error);
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