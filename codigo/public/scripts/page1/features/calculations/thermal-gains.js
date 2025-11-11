/**
 * thermal-gains.js
 * 🎯 FUSÃO COMPLETA: thermalCalculations + thermalComponents + thermalDisplay
 * ⚡ REDUÇÃO: 3 arquivos → 1 arquivo (~600 → ~350 linhas)
 */


import { 
    waitForSystemConstants, 
    validateSystemConstants,
    collectClimatizationInputs,
} from './calculations-core.js'  

import { safeNumber, updateElementText } from '../../utils/core-utils.js';

/**
 * 🔥 CÁLCULOS DE COMPONENTES TÉRMICOS (thermalComponents.js)
 */

function calculateCeilingGain(area, uValue, deltaT) {
  const areaNum = safeNumber(area);
  const uValueNum = safeNumber(uValue);
  const deltaTNum = safeNumber(deltaT);
  const result = areaNum * uValueNum * deltaTNum;
  console.log(`[DEBUG DETAIL] calculateCeilingGain: ${areaNum} * ${uValueNum} * ${deltaTNum} = ${result}`);
  return result;
}

function calculateWallGain(comprimento, peDireito, uValue, deltaT) {
  const compNum = safeNumber(comprimento);
  const peDireitoNum = safeNumber(peDireito);
  const uValueNum = safeNumber(uValue);
  const deltaTNum = safeNumber(deltaT);
  const area = compNum * peDireitoNum;
  const result = area * uValueNum * deltaTNum;
  console.log(`[DEBUG DETAIL] calculateWallGain: (${compNum} * ${peDireitoNum}) = ${area}m² * ${uValueNum} * ${deltaTNum} = ${result}`);
  return result;
}

function calculatePartitionGain(inputArea, peDireito, uValue, deltaT) {
  const area = safeNumber(inputArea) * safeNumber(peDireito);
  const result = area * uValue * deltaT;
  return result;
}

function calculateFloorGain(area, constants) {
  const uValue = window.systemConstants?.AUX_U_Value_Piso || 2.7;
  const deltaT = window.systemConstants?.deltaT_piso || 7.5;
  const result = safeNumber(area) * uValue * deltaT;
  return result;
}

function calculateLightingGain(area, constants) {
  const fatorIluminacao = window.systemConstants?.AUX_Fator_Iluminacao || 7;
  const fsIluminacao = window.systemConstants?.AUX_Fs_Iluminacao || 1;
  const result = safeNumber(area) * fatorIluminacao * fsIluminacao;
  return result;
}

function calculateDissipationGain(dissipacao, constants) {
  const fatorConversao = window.systemConstants?.AUX_Fator_Conver_Painel || 1;
  const fsPaineis = window.systemConstants?.AUX_Fs_Paineis || 100;
  const result = (fatorConversao * safeNumber(dissipacao) * fsPaineis) / 100;
  return result;
}

function calculatePeopleGain(numPessoas, constants) {
  const csp = window.systemConstants?.AUX_OCp_Csp || 86.5;
  const clp = window.systemConstants?.AUX_OCp_Clp || 133.3;
  const fsPessoas = 100;
  const pessoas = safeNumber(numPessoas);
  const ganhoSensivel = (csp * pessoas * fsPessoas) / 100;
  const ganhoLatente = (clp * pessoas * fsPessoas) / 100;
  const result = ganhoSensivel + ganhoLatente;
  return result;
}

function calculateExternalAirSensibleGain(vazaoArExterno, auxVars, constants) {
  const c_ArExterno = window.systemConstants?.AUX_c_ArExterno || 0.24;
  const deltaT_ArExterno = window.systemConstants?.AUX_deltaT_ArExterno || 10;
  
  const calc_Gsens_ArE = auxVars.m_ArExterno * c_ArExterno * deltaT_ArExterno;
  const resultado = (calc_Gsens_ArE / 1000) * 1.16;
  
  return resultado;
}

function calculateExternalAirLatentGain(vazaoArExterno, constants) {
  const f_ArExterno = window.systemConstants?.AUX_f_ArExterno || 3.01;
  const deltaUa_ArExterno = window.systemConstants?.AUX_deltaUa_ArExterno || 8.47;
  
  const vazao = safeNumber(vazaoArExterno);
  const ganho = vazao * f_ArExterno * deltaUa_ArExterno;
  
  return ganho;
}

/**
 * 📊 CÁLCULOS DE TOTAIS E DISPLAY (thermalDisplay.js)
 */

function calculateTotals(gains) {
  const totalExterno = gains.teto + gains.paredeOeste + gains.paredeLeste + gains.paredeNorte + gains.paredeSul;
  const totalDivisoes = gains.divisoriaNaoClima1 + gains.divisoriaNaoClima2 + gains.divisoriaClima1 + gains.divisoriaClima2;
  const totalPiso = gains.piso;
  const totalIluminacao = gains.iluminacao;
  const totalEquipamentos = gains.dissipacao;
  const totalPessoas = gains.pessoas;
  const totalArSensivel = gains.arSensivel;
  const totalArLatente = gains.arLatente;
  const totalArExterno = totalArSensivel + totalArLatente;

  const totalGeralW = totalExterno + totalDivisoes + totalPiso + totalIluminacao + totalEquipamentos + totalPessoas + totalArExterno;
  const totalGeralTR = totalGeralW / 3517;

  const totals = {
    externo: Math.ceil(totalExterno),
    divisoes: Math.ceil(totalDivisoes),
    piso: Math.ceil(totalPiso),
    iluminacao: Math.ceil(totalIluminacao),
    equipamentos: Math.ceil(totalEquipamentos),
    pessoas: Math.ceil(totalPessoas),
    arSensivel: Math.ceil(totalArSensivel),
    arLatente: Math.ceil(totalArLatente),
    arExterno: Math.ceil(totalArExterno),
    geralW: Math.ceil(totalGeralW),
    geralTR: Math.ceil(totalGeralTR),
  };

  return totals;
}

function updateWallDisplay(roomId, direction, gain, uValue, inputWidth, peDireito, deltaT) {
  const area = safeNumber(inputWidth) * safeNumber(peDireito);
  updateElementText(`area-parede-${direction}-${roomId}`, Math.ceil(area));
  updateElementText(`uvalue-parede-${direction}-${roomId}`, uValue.toFixed(3));
  updateElementText(`deltat-parede-${direction}-${roomId}`, deltaT || 0);
  updateElementText(`ganho-parede-${direction}-${roomId}`, Math.ceil(gain));
}

function updatePartitionDisplay(roomId, type, gain, uValue, inputArea, peDireito, deltaT) {
  const areaCalculada = safeNumber(inputArea) * safeNumber(peDireito);
  updateElementText(`area-divi-${type}-${roomId}`, Math.ceil(areaCalculada));
  updateElementText(`uvalue-divi-${type}-${roomId}`, uValue.toFixed(3));
  updateElementText(`deltat-divi-${type}-${roomId}`, deltaT || 0);
  updateElementText(`ganho-divi-${type}-${roomId}`, Math.ceil(gain));
}

function updateThermalGainsDisplay(roomId, gains, totals, uValues, inputData) {
  console.log(`🔥 Atualizando display térmico para sala: ${roomId}`);
  
  updateElementText(`total-ganhos-w-${roomId}`, totals.geralW);
  updateElementText(`total-tr-${roomId}`, totals.geralTR);

  updateElementText(`area-teto-${roomId}`, Math.ceil(inputData.area || 0));
  updateElementText(`uvalue-teto-${roomId}`, uValues.teto.toFixed(3));
  updateElementText(`deltat-teto-${roomId}`, window.systemConstants?.deltaT_teto || 20);
  updateElementText(`ganho-teto-${roomId}`, Math.ceil(gains.teto));

  updateWallDisplay(roomId, "oeste", gains.paredeOeste, uValues.parede, inputData.paredeOeste, inputData.peDireito, window.systemConstants?.deltaT_parede_Oes || 0);
  updateWallDisplay(roomId, "leste", gains.paredeLeste, uValues.parede, inputData.paredeLeste, inputData.peDireito, window.systemConstants?.deltaT_parede_Les || 0);
  updateWallDisplay(roomId, "norte", gains.paredeNorte, uValues.parede, inputData.paredeNorte, inputData.peDireito, window.systemConstants?.deltaT_parede_Nor || 0);
  updateWallDisplay(roomId, "sul", gains.paredeSul, uValues.parede, inputData.paredeSul, inputData.peDireito, window.systemConstants?.deltaT_parede_Sul || 0);

  updatePartitionDisplay(roomId, "nc1", gains.divisoriaNaoClima1, uValues.parede, inputData.divisoriaNaoClima1, inputData.peDireito, window.systemConstants?.deltaT_divi_N_clim1 || 0);
  updatePartitionDisplay(roomId, "nc2", gains.divisoriaNaoClima2, uValues.parede, inputData.divisoriaNaoClima2, inputData.peDireito, window.systemConstants?.deltaT_divi_N_clim2 || 0);
  updatePartitionDisplay(roomId, "c1", gains.divisoriaClima1, uValues.parede, inputData.divisoriaClima1, inputData.peDireito, window.systemConstants?.deltaT_divi_clim1 || 0);
  updatePartitionDisplay(roomId, "c2", gains.divisoriaClima2, uValues.parede, inputData.divisoriaClima2, inputData.peDireito, window.systemConstants?.deltaT_divi_clim2 || 0);

  updateElementText(`area-piso-${roomId}`, Math.ceil(inputData.area || 0));
  updateElementText(`uvalue-piso-${roomId}`, uValues.piso.toFixed(3));
  updateElementText(`deltat-piso-${roomId}`, window.systemConstants?.deltaT_piso || 5);
  updateElementText(`ganho-piso-${roomId}`, Math.ceil(gains.piso));
  updateElementText(`total-piso-${roomId}`, totals.piso);

  updateElementText(`area-iluminacao-${roomId}`, Math.ceil(inputData.area || 0));
  updateElementText(`fator-iluminacao-${roomId}`, window.systemConstants?.AUX_Fator_Iluminacao || 7);
  updateElementText(`fs-iluminacao-${roomId}`, window.systemConstants?.AUX_Fs_Iluminacao || 1);
  updateElementText(`ganho-iluminacao-${roomId}`, Math.ceil(gains.iluminacao));
  updateElementText(`total-iluminacao-${roomId}`, totals.iluminacao);

  updateElementText(`fator-conversao-dissi-${roomId}`, window.systemConstants?.AUX_Fator_Conver_Painel || 1);
  updateElementText(`pe-dissi-${roomId}`, inputData.dissipacao || 0);
  updateElementText(`fs-dissi-${roomId}`, window.systemConstants?.AUX_Fs_Paineis || 100);
  updateElementText(`ganho-dissi-${roomId}`, Math.ceil(gains.dissipacao));
  updateElementText(`total-dissi-${roomId}`, totals.equipamentos);

  updateElementText(`csp-pessoas-${roomId}`, window.systemConstants?.AUX_OCp_Csp || 86.5);
  updateElementText(`clp-pessoas-${roomId}`, window.systemConstants?.AUX_OCp_Clp || 133.3);
  updateElementText(`o-pessoas-${roomId}`, inputData.numPessoas || 0);
  updateElementText(`fs-pessoas-${roomId}`, 100);
  updateElementText(`ganho-pessoas-${roomId}`, Math.ceil(gains.pessoas));
  updateElementText(`total-pessoas-${roomId}`, totals.pessoas);

  const densiAr = window.systemConstants?.Densi_ar || 1.17;
  const m_ArExterno = (inputData.vazaoArExterno || 0) * 3.6 * densiAr * 1000;

  updateElementText(`m-ar-sensivel-${roomId}`, Math.ceil(m_ArExterno));
  updateElementText(`c-ar-sensivel-${roomId}`, window.systemConstants?.AUX_c_ArExterno || 0.24);
  updateElementText(`deltat-ar-sensivel-${roomId}`, window.systemConstants?.AUX_deltaT_ArExterno || 10);
  updateElementText(`ganho-ar-sensivel-${roomId}`, Math.ceil(gains.arSensivel));
  updateElementText(`total-ar-sensivel-${roomId}`, totals.arSensivel);

  updateElementText(`var-ar-latente-${roomId}`, inputData.vazaoArExterno || 0);
  updateElementText(`f-ar-latente-${roomId}`, window.systemConstants?.AUX_f_ArExterno || 3.01);
  updateElementText(`deltaua-ar-latente-${roomId}`, window.systemConstants?.AUX_deltaUa_ArExterno || 8.47);
  updateElementText(`ganho-ar-latente-${roomId}`, Math.ceil(gains.arLatente));
  updateElementText(`total-ar-latente-${roomId}`, totals.arLatente);

  updateElementText(`total-externo-${roomId}`, totals.externo);
  updateElementText(`total-divisoes-${roomId}`, totals.divisoes);
  
  console.log(`✅ Display térmico atualizado para sala: ${roomId}`);
}

/**
 * 🔍 FUNÇÕES AUXILIARES DE BUSCA (thermalCalculations.js)
 */

function findRoomContentThermal(roomId) {
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`ERRO FALBACK (findRoomContentThermal) thermalCalculations.js [ID de sala inválido: ${roomId}]`);
        return null;
    }
    
    console.log(`🔍 [THERMAL] Procurando sala: "${roomId}"`);
    
    let roomContent = document.getElementById(`room-content-${roomId}`);
    
    if (roomContent) {
        console.log(`✅ [THERMAL] Sala encontrada pelo ID: room-content-${roomId}`);
        return roomContent;
    }
    
    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    
    if (roomBlock) {
        const foundId = roomBlock.dataset.roomId;
        console.log(`✅ [THERMAL] Sala encontrada pelo data-room-id: ${foundId}`);
        
        const finalRoomContent = document.getElementById(`room-content-${foundId}`);
        if (finalRoomContent) {
            return finalRoomContent;
        }
    }
  
    console.error(`❌ [THERMAL] Sala não encontrada: ${roomId}`);
    const allRooms = document.querySelectorAll('.room-block');
    console.log('🔍 [THERMAL] Todas as salas disponíveis no DOM:');
    allRooms.forEach(room => {
        console.log(`  - ID: "${room.dataset.roomId}", Nome: "${room.dataset.roomName}", Projeto: "${room.dataset.projectId}", Obra: "${room.dataset.obraId}"`);
    });
    
    return null;
}

function calculateUValues(tipoConstrucao) {
  const U_VALUE_ALVENARIA_TETO = 3.961;
  const U_VALUE_ALVENARIA_PAREDE = 2.546;
  const U_VALUE_LA_ROCHA_TETO = 1.145;
  const U_VALUE_LA_ROCHA_PAREDE = 1.12;

  console.log(`[THERMAL UVALUES] tipoConstrucao recebido: "${tipoConstrucao}"`);

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

  console.log("[THERMAL UVALUES] UValues calculados:", result);
  return result;
}

function calculateAuxiliaryVariables(inputData) {
  const vazaoArExterno = safeNumber(inputData.vazaoArExterno);
  const densiAr = window.systemConstants?.Densi_ar || 1.17;

  const m_ArExterno = vazaoArExterno * 3.6 * densiAr * 1000;

  return {
    m_ArExterno: m_ArExterno,
    vazaoArExterno: vazaoArExterno
  };
}

/**
 * 🎯 FUNÇÃO PRINCIPAL DE CÁLCULO (thermalCalculations.js)
 */

async function calculateThermalGains(roomId, vazaoArExterno = 0) {
  try {
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`ERRO FALBACK (calculateThermalGains) thermalCalculations.js [ID de sala inválido: ${roomId}]`);
        return;
    }
    
    console.log(`🔥 [THERMAL] Iniciando cálculos para sala: ${roomId}`);
    
    await waitForSystemConstants();

    if (!validateSystemConstants()) {
      console.error(`[THERMAL] validateSystemConstants FALHOU para ${roomId}`);
      return;
    }

    const roomContent = findRoomContentThermal(roomId);
    if (!roomContent) {
      console.error(`[THERMAL] room-content-${roomId} NÃO ENCONTRADO`);
      return;
    }

    const climaSection = roomContent.querySelector('[id*="-clima"]');
    if (!climaSection) {
      console.error(`[THERMAL] Seção clima NÃO ENCONTRADA para ${roomId}`);
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

    console.log(`🔥 [THERMAL] Ganhos calculados para ${roomId}:`, gains);
    console.log(`🔥 [THERMAL] Totais para ${roomId}:`, totals);
    console.log("🔥 [THERMAL] ===== FIM DO CÁLCULO DE GANHOS TÉRMICOS =====");

    updateThermalGainsDisplay(roomId, gains, totals, uValues, {...inputData, vazaoArExterno});

    console.log(`🔥 [THERMAL] Tentando atualizar tabela de capacidade para ${roomId}`);
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
        
        const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`);
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
    console.error(`[THERMAL] Erro em calculateThermalGains para ${roomId}:`, error);
  }
}

/**
 * 🌐 EXPORTAÇÕES E COMPATIBILIDADE GLOBAL
 */

// Exportações para módulos ES6
export {
  calculateThermalGains,
  calculateUValues,
  calculateAuxiliaryVariables,
  findRoomContentThermal,
  calculateCeilingGain,
  calculateWallGain,
  calculatePartitionGain,
  calculateFloorGain,
  calculateLightingGain,
  calculateDissipationGain,
  calculatePeopleGain,
  calculateExternalAirSensibleGain,
  calculateExternalAirLatentGain,
  calculateTotals,
  updateThermalGainsDisplay,
  updateWallDisplay,
  updatePartitionDisplay
};

// Compatibilidade global para scripts legados
if (typeof window !== 'undefined') {
  window.calculateThermalGains = calculateThermalGains;
  window.calculateUValues = calculateUValues;
  window.calculateAuxiliaryVariables = calculateAuxiliaryVariables;
  window.findRoomContentThermal = findRoomContentThermal;
  window.calculateCeilingGain = calculateCeilingGain;
  window.calculateWallGain = calculateWallGain;
  window.calculatePartitionGain = calculatePartitionGain;
  window.calculateFloorGain = calculateFloorGain;
  window.calculateLightingGain = calculateLightingGain;
  window.calculateDissipationGain = calculateDissipationGain;
  window.calculatePeopleGain = calculatePeopleGain;
  window.calculateExternalAirSensibleGain = calculateExternalAirSensibleGain;
  window.calculateExternalAirLatentGain = calculateExternalAirLatentGain;
  window.calculateTotals = calculateTotals;
  window.updateThermalGainsDisplay = updateThermalGainsDisplay;
  window.updateWallDisplay = updateWallDisplay;
  window.updatePartitionDisplay = updatePartitionDisplay;
}