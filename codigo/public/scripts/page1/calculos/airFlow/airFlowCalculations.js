// airFlowCalculations.js
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
 * Calcula fluxo de ar individual por porta baseado em contagem e pressurização
 * @param {number|string} doorCount - Número de portas
 * @param {number|string} doorVariable - Variável específica da porta
 * @param {number|string} pressure - Pressurização em Pa
 * @returns {number} Fluxo de ar calculado em m³/h
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
 * @param {Object} inputData - Dados de entrada contendo contagem de portas e pressurização
 * @returns {number} Vazão total de ar arredondada em l/s
 */
function computeAirFlowRate(inputData) {
  const numPortasDuplas = safeNumber(inputData.numPortasDuplas);
  const numPortasSimples = safeNumber(inputData.numPortasSimples);
  
  // ✅ CORREÇÃO: Usar pressure em vez de pressurizacao
  const pressure = inputData.pressurizacao ? safeNumber(inputData.setpointPressurizacao) : 0;

  console.log(" ===== CÁLCULO DE VAZÃO =====");
  console.log(" Portas Duplas:", numPortasDuplas);
  console.log(" Portas Simples:", numPortasSimples);
  console.log(" Pressurização (Pa):", pressure);

  if (!window.systemConstants || !window.systemConstants.VARIAVEL_PD || !window.systemConstants.VARIAVEL_PS) {
    console.error(" ERRO: Constantes do sistema não disponíveis para cálculo");
    alert("ERRO: Constantes do sistema não carregadas. Verifique o servidor.");
    return 0;
  }

  // ✅ CORREÇÃO CRÍTICA: pressure em vez de pressurizacao
  const doubleDoorFlow = calculateDoorFlow(numPortasDuplas, window.systemConstants.VARIAVEL_PD, pressure);
  const singleDoorFlow = calculateDoorFlow(numPortasSimples, window.systemConstants.VARIAVEL_PS, pressure);

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
 * Encontra o elemento roomContent pelo ID único da sala
 * @param {string} roomId - ID único da sala
 * @returns {HTMLElement|null} Elemento do conteúdo da sala ou null se não encontrado
 */
function findRoomContent(roomId) {
    // Limpar o ID de qualquer "undefined"
    const cleanRoomId = roomId.replace(/-undefined/g, '').replace(/undefined-/g, '');
    
    console.log(`🔍 Procurando sala: "${roomId}" -> Limpo: "${cleanRoomId}"`);
    
    // Tentar com o ID limpo primeiro
    let roomContent = document.getElementById(`room-content-${cleanRoomId}`);
    
    if (roomContent) {
        console.log(`✅ Sala encontrada pelo ID LIMPO: room-content-${cleanRoomId}`);
        return roomContent;
    }
    
    // Se não encontrou com ID limpo, tentar com o original
    roomContent = document.getElementById(`room-content-${roomId}`);
    if (roomContent) {
        console.log(`✅ Sala encontrada pelo ID ORIGINAL: room-content-${roomId}`);
        return roomContent;
    }
    
    // Procurar pela sala no DOM usando data attributes
    const roomBlock = document.querySelector(`[data-room-id="${cleanRoomId}"]`) || 
                     document.querySelector(`[data-room-id="${roomId}"]`);
    
    if (roomBlock) {
        const foundId = roomBlock.dataset.roomId;
        console.log(`✅ Sala encontrada pelo data-room-id: ${foundId}`);
        return document.getElementById(`room-content-${foundId}`);
    }
  
    // Debug detalhado
    console.error(`❌ Sala não encontrada: ${roomId} (limpo: ${cleanRoomId})`);
    const allRooms = document.querySelectorAll('.room-block');
    console.log('🔍 Todas as salas disponíveis no DOM:');
    allRooms.forEach(room => {
        console.log(`  - ID: "${room.dataset.roomId}", Nome: ${room.dataset.roomName}, Projeto: ${room.dataset.projectName}, Obra: ${room.dataset.obraName}`);
    });
    
    return null;
}

/**
 * Orquestra cálculo completo de vazão com validações
 * @param {string} roomId - ID único da sala
 * @param {boolean} calculateThermal - Se deve calcular ganhos térmicos após vazão
 * @returns {Promise<number>} Vazão de ar calculada em l/s
 */
async function calculateVazaoAr(roomId, calculateThermal = true) {
  try {
    console.log(` Iniciando cálculo de vazão para ${roomId}`);
    
    await waitForSystemConstants();
    
    if (!validateSystemConstants()) {
      console.error(" Constantes do sistema inválidas");
      return 0;
    }

    // Usar a nova função para encontrar a sala
    const roomContent = findRoomContent(roomId);
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
 * @param {string} roomId - ID único da sala
 * @returns {Promise<void>}
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
  calculateVazaoArAndThermalGains,
  findRoomContent
};