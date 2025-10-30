// thermalDisplay.js
import { updateElementText, safeNumber } from '../utils/helpers.js';

/**
 * Calcula totais consolidados de ganhos térmicos a partir dos ganhos individuais
 * @param {Object} gains - Objeto contendo todos os ganhos térmicos individuais
 * @returns {Object} Objeto com totais consolidados por categoria
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

/**
 * Atualiza a interface com resultados detalhados de ganhos térmicos
 * @param {string} roomId - ID SEGURO da sala para identificação dos elementos DOM
 * @param {Object} gains - Ganhos térmicos calculados
 * @param {Object} totals - Totais consolidados por categoria
 * @param {Object} uValues - Valores de transmitância térmica
 * @param {Object} inputData - Dados de entrada do usuário
 * @returns {void}
 */
function updateThermalGainsDisplay(roomId, gains, totals, uValues, inputData) {
  // ✅ CORREÇÃO: Log para debug de IDs seguros
  console.log(`🔥 Atualizando display térmico para sala: ${roomId}`);
  
  // ✅ CORREÇÃO: Usar roomId seguro diretamente (ex: obra_w12_proj_t34_1_sala_r21_1)
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
 * Atualiza exibição de dados de parede específica na interface
 * @param {string} roomId - ID SEGURO da sala para identificação dos elementos DOM
 * @param {string} direction - Direção da parede (oeste, leste, norte, sul)
 * @param {number} gain - Ganho térmico calculado para a parede
 * @param {number} uValue - Valor de transmitância térmica da parede
 * @param {number} inputWidth - Largura da parede informada pelo usuário
 * @param {number} peDireito - Altura do pé direito informada pelo usuário
 * @param {number} deltaT - Diferença de temperatura para cálculo
 * @returns {void}
 */
function updateWallDisplay(roomId, direction, gain, uValue, inputWidth, peDireito, deltaT) {
  const area = safeNumber(inputWidth) * safeNumber(peDireito);
  updateElementText(`area-parede-${direction}-${roomId}`, Math.ceil(area));
  updateElementText(`uvalue-parede-${direction}-${roomId}`, uValue.toFixed(3));
  updateElementText(`deltat-parede-${direction}-${roomId}`, deltaT || 0);
  updateElementText(`ganho-parede-${direction}-${roomId}`, Math.ceil(gain));
}

/**
 * Atualiza exibição de dados de divisória específica na interface
 * @param {string} roomId - ID SEGURO da sala para identificação dos elementos DOM
 * @param {string} type - Tipo da divisória (nc1, nc2, c1, c2)
 * @param {number} gain - Ganho térmico calculado para a divisória
 * @param {number} uValue - Valor de transmitância térmica da divisória
 * @param {number} inputArea - Área da divisória informada pelo usuário
 * @param {number} peDireito - Altura do pé direito informada pelo usuário
 * @param {number} deltaT - Diferença de temperatura para cálculo
 * @returns {void}
 */
function updatePartitionDisplay(roomId, type, gain, uValue, inputArea, peDireito, deltaT) {
  const areaCalculada = safeNumber(inputArea) * safeNumber(peDireito);
  updateElementText(`area-divi-${type}-${roomId}`, Math.ceil(areaCalculada));
  updateElementText(`uvalue-divi-${type}-${roomId}`, uValue.toFixed(3));
  updateElementText(`deltat-divi-${type}-${roomId}`, deltaT || 0);
  updateElementText(`ganho-divi-${type}-${roomId}`, Math.ceil(gain));
}

// ✅ CORREÇÃO: Disponibilização global para compatibilidade
if (typeof window !== 'undefined') {
  window.calculateTotals = calculateTotals;
  window.updateThermalGainsDisplay = updateThermalGainsDisplay;
  window.updateWallDisplay = updateWallDisplay;
  window.updatePartitionDisplay = updatePartitionDisplay;
}

export {
  calculateTotals,
  updateThermalGainsDisplay,
  updateWallDisplay,
  updatePartitionDisplay
};