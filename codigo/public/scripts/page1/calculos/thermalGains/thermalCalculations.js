// thermalCalculations.js
import { 
  waitForSystemConstants, 
  validateSystemConstants, 
  collectClimatizationInputs,
  safeNumber 
} from '../utils/helpers.js';

import { 
  calculateCeilingGain,
  calculateWallGain,
  calculatePartitionGain,
  calculateFloorGain,
  calculateLightingGain,
  calculateDissipationGain,
  calculatePeopleGain,
  calculateExternalAirSensibleGain,
  calculateExternalAirLatentGain
} from './thermalComponents.js';

import { calculateTotals } from './thermalDisplay.js';
import { updateThermalGainsDisplay } from './thermalDisplay.js';

/**
 * Encontra o elemento roomContent pelo ID único da sala
 * @param {string} roomId - ID único da sala
 * @returns {HTMLElement|null} Elemento do conteúdo da sala ou null se não encontrado
 */
function findRoomContentThermal(roomId) {
    // Limpar o ID de qualquer "undefined"
    const cleanRoomId = roomId.replace(/-undefined/g, '').replace(/undefined-/g, '');
    
    console.log(`🔍 [THERMAL] Procurando sala: "${roomId}" -> Limpo: "${cleanRoomId}"`);
    
    // Tentar com o ID limpo primeiro
    let roomContent = document.getElementById(`room-content-${cleanRoomId}`);
    
    if (roomContent) {
        console.log(`✅ [THERMAL] Sala encontrada pelo ID LIMPO: room-content-${cleanRoomId}`);
        return roomContent;
    }
    
    // Se não encontrou com ID limpo, tentar com o original
    roomContent = document.getElementById(`room-content-${roomId}`);
    if (roomContent) {
        console.log(`✅ [THERMAL] Sala encontrada pelo ID ORIGINAL: room-content-${roomId}`);
        return roomContent;
    }
    
    // Procurar pela sala no DOM usando data attributes
    const roomBlock = document.querySelector(`[data-room-id="${cleanRoomId}"]`) || 
                     document.querySelector(`[data-room-id="${roomId}"]`);
    
    if (roomBlock) {
        const foundId = roomBlock.dataset.roomId;
        console.log(`✅ [THERMAL] Sala encontrada pelo data-room-id: ${foundId}`);
        return document.getElementById(`room-content-${foundId}`);
    }
  
    // Debug detalhado
    console.error(`❌ [THERMAL] Sala não encontrada: ${roomId} (limpo: ${cleanRoomId})`);
    const allRooms = document.querySelectorAll('.room-block');
    console.log('🔍 [THERMAL] Todas as salas disponíveis no DOM:');
    allRooms.forEach(room => {
        console.log(`  - ID: "${room.dataset.roomId}", Nome: ${room.dataset.roomName}, Projeto: ${room.dataset.projectName}, Obra: ${room.dataset.obraName}`);
    });
    
    return null;
}

/**
 * Calcula ganhos térmicos totais do ambiente
 * @param {string} roomId - ID único da sala
 * @param {number} vazaoArExterno - Vazão de ar externo em l/s
 * @returns {Promise<void>}
 */
async function calculateThermalGains(roomId, vazaoArExterno = 0) {
  try {
    await waitForSystemConstants();

    if (!validateSystemConstants()) {
      console.error(`[DEBUG] validateSystemConstants FALHOU para ${roomId}`);
      return;
    }

    // Usar a nova função para encontrar a sala
    const roomContent = findRoomContentThermal(roomId);
    if (!roomContent) {
      console.error(`[DEBUG] room-content-${roomId} NÃO ENCONTRADO`);
      return;
    }

    const climaSection = roomContent.querySelector('[id*="-clima"]');
    if (!climaSection) {
      console.error(`[DEBUG] Seção clima NÃO ENCONTRADA para ${roomId}`);
      return;
    }

    const inputData = collectClimatizationInputs(climaSection, roomId);

    const calcData = {
      ...inputData,
      area: safeNumber(inputData.area),
      paredeOeste: safeNumber(inputData.paredeOeste),
      paredeLeste: safeNumber(inputData.paredeLeste),
      paredeNorte: safeNumber(inputData.paredeNorte),
      paredeSul: safeNumber(inputData.paredeSul),
      peDireito: safeNumber(inputData.peDireito),
      divisoriaNaoClima1: safeNumber(inputData.divisoriaNaoClima1),
      divisoriaNaoClima2: safeNumber(inputData.divisoriaNaoClima2),
      divisoriaClima1: safeNumber(inputData.divisoriaClima1),
      divisoriaClima2: safeNumber(inputData.divisoriaClima2),
      dissipacao: safeNumber(inputData.dissipacao),
      numPessoas: safeNumber(inputData.numPessoas),
      vazaoArExterno: vazaoArExterno
    };

    const uValues = calculateUValues(calcData.tipoConstrucao);
    const auxVars = calculateAuxiliaryVariables({...calcData, vazaoArExterno});

    const gains = {
      teto: calculateCeilingGain(calcData.area, uValues.teto, window.systemConstants.deltaT_teto),
      paredeOeste: calculateWallGain(calcData.paredeOeste, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_parede_Oes),
      paredeLeste: calculateWallGain(calcData.paredeLeste, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_parede_Les),
      paredeNorte: calculateWallGain(calcData.paredeNorte, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_parede_Nor),
      paredeSul: calculateWallGain(calcData.paredeSul, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_parede_Sul),
      divisoriaNaoClima1: calculatePartitionGain(calcData.divisoriaNaoClima1, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_divi_N_clim1),
      divisoriaNaoClima2: calculatePartitionGain(calcData.divisoriaNaoClima2, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_divi_N_clim2),
      divisoriaClima1: calculatePartitionGain(calcData.divisoriaClima1, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_divi_clim1),
      divisoriaClima2: calculatePartitionGain(calcData.divisoriaClima2, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_divi_clim2),
      piso: calculateFloorGain(calcData.area, window.systemConstants),
      iluminacao: calculateLightingGain(calcData.area, window.systemConstants),
      dissipacao: calculateDissipationGain(calcData.dissipacao, window.systemConstants),
      pessoas: calculatePeopleGain(calcData.numPessoas, window.systemConstants),
      arSensivel: calculateExternalAirSensibleGain(vazaoArExterno, auxVars, window.systemConstants),
      arLatente: calculateExternalAirLatentGain(vazaoArExterno, window.systemConstants),
    };

    const totals = calculateTotals(gains);

    console.log(" Ganhos calculados:", gains);
    console.log(" Totais:", totals);
    console.log(" ===== FIM DO CÁLCULO DE GANHOS TÉRMICOS =====");

    updateThermalGainsDisplay(roomId, gains, totals, uValues, {...inputData, vazaoArExterno});

    console.log(`[THERMAL] Tentando atualizar tabela de capacidade para ${roomId}`);
    setTimeout(() => {
      if (typeof calculateCapacitySolution === 'function') {
        calculateCapacitySolution(roomId);
      } else if (typeof window.calculateCapacitySolution === 'function') {
        window.calculateCapacitySolution(roomId);
      } else if (typeof updateCapacityFromThermalGains === 'function') {
        updateCapacityFromThermalGains(roomId);
      } else if (typeof window.updateCapacityFromThermalGains === 'function') {
        window.updateCapacityFromThermalGains(roomId);
      } else {
        console.error(`[THERMAL] Nenhuma função de capacidade encontrada para ${roomId}`);
        const capacityTable = document.querySelector('.capacity-calculation-table');
        if (capacityTable) {
          console.log(`[THERMAL] Tabela de capacidade encontrada, tentando inicialização manual`);
          const cargaEstimadaElement = document.getElementById(`carga-estimada-${roomId}`);
          const totalTRElement = document.getElementById(`total-tr-${roomId}`);
          
          if (totalTRElement && cargaEstimadaElement) {
            const totalTR = parseFloat(totalTRElement.textContent) || 0;
            cargaEstimadaElement.textContent = totalTR.toFixed(1);
            console.log(`[THERMAL] Carga estimada atualizada manualmente: ${totalTR}`);
          }
        }
      }
    }, 300);
    
  } catch (error) {
    console.error(`[DEBUG] Erro em calculateThermalGains:`, error);
  }
}

/**
 * Determina coeficientes de transferência térmica baseados no tipo de construção
 * @param {string} tipoConstrucao - Tipo de construção ("Alvenaria" ou "Eletrocentro")
 * @returns {Object} Valores U para parede, teto e piso
 */
function calculateUValues(tipoConstrucao) {
  const U_VALUE_ALVENARIA_TETO = 3.961;
  const U_VALUE_ALVENARIA_PAREDE = 2.546;
  const U_VALUE_LA_ROCHA_TETO = 1.145;
  const U_VALUE_LA_ROCHA_PAREDE = 1.12;

  console.log(`[DEBUG UVALUES] tipoConstrucao recebido: "${tipoConstrucao}"`);

  let uValueParede, uValueTeto;

  const tipoLower = tipoConstrucao ? tipoConstrucao.toLowerCase() : "";
  
  if (tipoLower === "eletrocentro") {
    uValueParede = U_VALUE_LA_ROCHA_PAREDE;
    uValueTeto = U_VALUE_LA_ROCHA_TETO;
  } else if (tipoLower === "alvenaria") {
    uValueParede = U_VALUE_ALVENARIA_PAREDE;
    uValueTeto = U_VALUE_ALVENARIA_TETO;
  } else {
    uValueParede = 0;
    uValueTeto = 0;
  }

  const result = {
    parede: uValueParede,
    teto: uValueTeto,
    piso: window.systemConstants?.AUX_U_Value_Piso || 2.7,
  };

  console.log("[DEBUG UVALUES] UValues calculados:", result);
  return result;
}

/**
 * Calcula variáveis auxiliares para cálculos de ar externo
 * @param {Object} inputData - Dados de entrada incluindo vazão de ar externo
 * @returns {Object} Variáveis auxiliares calculadas
 */
function calculateAuxiliaryVariables(inputData) {
  const vazaoArExterno = safeNumber(inputData.vazaoArExterno);
  const densiAr = window.systemConstants?.Densi_ar || 1.17;

  const m_ArExterno = vazaoArExterno * 3.6 * densiAr * 1000;

  return {
    m_ArExterno: m_ArExterno,
    vazaoArExterno: vazaoArExterno
  };
}

export {
  calculateThermalGains,
  calculateUValues,
  calculateAuxiliaryVariables
};