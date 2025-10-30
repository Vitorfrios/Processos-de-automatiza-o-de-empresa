/**
 * airFlowCalculations.js
 * Cálculos de vazão de ar e fluxo baseados em pressurização
 * SISTEMA CORRIGIDO COM IDs ÚNICOS
 *
 * @module airFlowCalculations
 * @description Implementa cálculos de vazão de ar considerando portas e pressurização
 */

import { CALCULATION_CONSTANTS } from "../../config/config.js"
import {
  waitForSystemConstants,
  validateSystemConstants,
  collectClimatizationInputs,
  safeNumber,
} from "../utils/helpers.js"
import { updateFlowRateDisplay } from "./airFlowDisplay.js"
import { calculateThermalGains } from "../thermalGains/thermalCalculations.js"

/**
 * Calcula fluxo de ar individual por porta baseado em contagem e pressurização
 * @param {number|string} doorCount - Número de portas
 * @param {number|string} doorVariable - Variável específica da porta
 * @param {number|string} pressure - Pressurização em Pa
 * @returns {number} Fluxo de ar calculado em m³/h
 */
function calculateDoorFlow(doorCount, doorVariable, pressure) {
  const count = safeNumber(doorCount)
  const variable = safeNumber(doorVariable)
  const press = safeNumber(pressure)

  console.log(`[v0] calculateDoorFlow: count=${count}, variable=${variable}, pressure=${press}`)

  const pressureExponent = press > 0 ? Math.pow(press, CALCULATION_CONSTANTS.PRESSURE_EXPONENT) : 0

  const flow =
    CALCULATION_CONSTANTS.FLOW_COEFFICIENT *
    count *
    variable *
    pressureExponent *
    CALCULATION_CONSTANTS.SECONDS_PER_HOUR

  console.log(`[v0] Fluxo calculado: ${flow}`)
  return flow
}

/**
 * Calcula vazão total de ar baseada em portas e pressurização
 * @param {Object} inputData - Dados de entrada contendo contagem de portas e pressurização
 * @returns {number} Vazão total de ar arredondada em l/s
 */
function computeAirFlowRate(inputData) {
  const numPortasDuplas = safeNumber(inputData.numPortasDuplas)
  const numPortasSimples = safeNumber(inputData.numPortasSimples)

  const pressure = inputData.pressurizacao ? safeNumber(inputData.setpointPressurizacao) : 0

  console.log("[v0] ===== CÁLCULO DE VAZÃO =====")
  console.log("[v0] Portas Duplas:", numPortasDuplas)
  console.log("[v0] Portas Simples:", numPortasSimples)
  console.log("[v0] Pressurização (Pa):", pressure)

  if (!window.systemConstants || !window.systemConstants.VARIAVEL_PD || !window.systemConstants.VARIAVEL_PS) {
    console.error(
      "[v0] ERRO FALBACK (computeAirFlowRate) {airFlowCalculations.js} [Constantes do sistema não disponíveis]",
    )
    return 0
  }

  const doubleDoorFlow = calculateDoorFlow(numPortasDuplas, window.systemConstants.VARIAVEL_PD, pressure)
  const singleDoorFlow = calculateDoorFlow(numPortasSimples, window.systemConstants.VARIAVEL_PS, pressure)

  console.log("[v0] Fluxo Portas Duplas:", doubleDoorFlow)
  console.log("[v0] Fluxo Portas Simples:", singleDoorFlow)

  const totalFlow = doubleDoorFlow + singleDoorFlow
  const adjustedFlow = totalFlow / CALCULATION_CONSTANTS.FLOW_DIVISOR
  const finalFlow = adjustedFlow * CALCULATION_CONSTANTS.SAFETY_FACTOR
  const roundedFlow = Math.ceil(finalFlow)

  console.log("[v0] Fluxo Total:", totalFlow)
  console.log("[v0] Fluxo Ajustado:", adjustedFlow)
  console.log("[v0] Fluxo Final:", finalFlow)
  console.log("[v0] Vazão Arredondada:", roundedFlow)
  console.log("[v0] ===== FIM DO CÁLCULO =====")

  return roundedFlow
}

/**
 * Encontra o elemento roomContent pelo ID único da sala - CORREÇÃO COMPLETA
 * @param {string} roomId - ID único da sala
 * @returns {HTMLElement|null} Elemento do conteúdo da sala ou null se não encontrado
 */
function findRoomContent(roomId) {
  // ✅ CORREÇÃO: Validar ID único
  if (!roomId || roomId === 'undefined' || roomId === 'null') {
    console.error(`ERRO FALBACK (findRoomContent) airFlowCalculations.js [ID de sala inválido: ${roomId}]`);
    return null;
  }

  console.log(`[v0] Procurando sala: "${roomId}"`);

  // ✅ CORREÇÃO: Buscar APENAS por ID único SEM limpeza complexa
  let roomContent = document.getElementById(`room-content-${roomId}`);

  if (roomContent) {
    console.log(`[v0] Sala encontrada pelo ID ÚNICO: room-content-${roomId}`);
    return roomContent;
  }

  // ✅ CORREÇÃO: Buscar pelo data attribute com ID exato
  const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);

  if (roomBlock) {
    const foundId = roomBlock.dataset.roomId;
    console.log(`[v0] Sala encontrada pelo data-room-id: ${foundId}`);
    
    // ✅ CORREÇÃO: Tentar encontrar o conteúdo com o ID encontrado
    const foundContent = document.getElementById(`room-content-${foundId}`);
    if (foundContent) {
      return foundContent;
    }
  }

  // ✅ CORREÇÃO: Debug detalhado com IDs reais
  console.error(`[v0] ERRO FALBACK (findRoomContent) airFlowCalculations.js [Sala não encontrada: ${roomId}]`);
  const allRooms = document.querySelectorAll(".room-block");
  console.log("[v0] Todas as salas disponíveis no DOM:");
  allRooms.forEach((room) => {
    console.log(`[v0]   - ID: "${room.dataset.roomId}", Nome: "${room.dataset.roomName}"`);
  });

  return null;
}

/**
 * Orquestra cálculo completo de vazão com validações - CORREÇÃO COMPLETA
 * @param {string} roomId - ID único da sala
 * @param {boolean} calculateThermal - Se deve calcular ganhos térmicos após vazão
 * @returns {Promise<number>} Vazão de ar calculada em l/s
 */
async function calculateVazaoAr(roomId, calculateThermal = true) {
  try {
    // ✅ CORREÇÃO: Validar ID único antes de processar
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
      console.error(`ERRO FALBACK (calculateVazaoAr) airFlowCalculations.js [ID de sala inválido: ${roomId}]`);
      return 0;
    }

    console.log(`[v0] Iniciando cálculo de vazão para ${roomId}`);

    await waitForSystemConstants();

    if (!validateSystemConstants()) {
      console.error("[v0] ERRO FALBACK (calculateVazaoAr) airFlowCalculations.js [Constantes do sistema inválidas]");
      return 0;
    }

    const roomContent = findRoomContent(roomId);
    if (!roomContent) {
      console.error(`[v0] ERRO FALBACK (calculateVazaoAr) airFlowCalculations.js [Sala não encontrada: ${roomId}]`);
      return 0;
    }

    // ✅ CORREÇÃO: Buscar seção de climatização usando ID único
    const climaSection = roomContent.querySelector(`#section-content-${roomId}-clima`);
    
    if (!climaSection) {
      console.error(
        `[v0] ERRO FALBACK (calculateVazaoAr) airFlowCalculations.js [Seção de climatização não encontrada para sala ${roomId}]`,
      );
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
    console.error(`[v0] ERRO FALBACK (calculateVazaoAr) airFlowCalculations.js [${error.message}]`);
    return 0;
  }
}

/**
 * Coordena cálculo sequencial de vazão e ganhos térmicos - CORREÇÃO COMPLETA
 * @param {string} roomId - ID único da sala
 * @returns {Promise<void>}
 */
async function calculateVazaoArAndThermalGains(roomId) {
  try {
    // ✅ CORREÇÃO: Validar ID único
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
      console.error(`ERRO FALBACK (calculateVazaoArAndThermalGains) airFlowCalculations.js [ID de sala inválido: ${roomId}]`);
      return;
    }
    
    const flowRate = await calculateVazaoAr(roomId, false);
    await calculateThermalGains(roomId, flowRate);
  } catch (error) {
    console.error(`[v0] ERRO FALBACK (calculateVazaoArAndThermalGains) airFlowCalculations.js [${error.message}]`);
  }
}

export { calculateDoorFlow, computeAirFlowRate, calculateVazaoAr, calculateVazaoArAndThermalGains, findRoomContent }