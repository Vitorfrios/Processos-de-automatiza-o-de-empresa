// thermalComponents.js
import { safeNumber } from '../utils/helpers.js';

/**
 * Calcula ganho térmico através do teto por condução
 * @param {number} area - Área do teto em metros quadrados
 * @param {number} uValue - Coeficiente de transferência de calor
 * @param {number} deltaT - Diferença de temperatura em graus Celsius
 * @returns {number} Ganho térmico em watts
 */
function calculateCeilingGain(area, uValue, deltaT) {
  const areaNum = safeNumber(area);
  const uValueNum = safeNumber(uValue);
  const deltaTNum = safeNumber(deltaT);
  const result = areaNum * uValueNum * deltaTNum;
  console.log(`[DEBUG DETAIL] calculateCeilingGain: ${areaNum} * ${uValueNum} * ${deltaTNum} = ${result}`);
  return result;
}

/**
 * Calcula ganho térmico através de paredes externas
 * @param {number} comprimento - Comprimento da parede em metros
 * @param {number} peDireito - Altura do pé-direito em metros
 * @param {number} uValue - Coeficiente de transferência de calor
 * @param {number} deltaT - Diferença de temperatura em graus Celsius
 * @returns {number} Ganho térmico em watts
 */
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

/**
 * Calcula ganho térmico através de divisórias internas
 * @param {number} inputArea - Área da divisória em metros quadrados
 * @param {number} peDireito - Altura do pé-direito em metros
 * @param {number} uValue - Coeficiente de transferência de calor
 * @param {number} deltaT - Diferença de temperatura em graus Celsius
 * @returns {number} Ganho térmico em watts
 */
function calculatePartitionGain(inputArea, peDireito, uValue, deltaT) {
  const area = safeNumber(inputArea) * safeNumber(peDireito);
  const result = area * uValue * deltaT;
  return result;
}

/**
 * Calcula ganho térmico através do piso por condução
 * @param {number} area - Área do piso em metros quadrados
 * @param {Object} constants - Constantes do sistema para cálculo
 * @returns {number} Ganho térmico em watts
 */
function calculateFloorGain(area, constants) {
  const uValue = window.systemConstants?.AUX_U_Value_Piso || 2.7;
  const deltaT = window.systemConstants?.deltaT_piso || 7.5;
  const result = safeNumber(area) * uValue * deltaT;
  return result;
}

/**
 * Calcula ganho térmico da iluminação artificial
 * @param {number} area - Área do ambiente em metros quadrados
 * @param {Object} constants - Constantes do sistema para cálculo
 * @returns {number} Ganho térmico em watts
 */
function calculateLightingGain(area, constants) {
  const fatorIluminacao = window.systemConstants?.AUX_Fator_Iluminacao || 7;
  const fsIluminacao = window.systemConstants?.AUX_Fs_Iluminacao || 1;
  const result = safeNumber(area) * fatorIluminacao * fsIluminacao;
  return result;
}

/**
 * Calcula ganho térmico de equipamentos elétricos
 * @param {number} dissipacao - Potência dissipada pelos equipamentos em watts
 * @param {Object} constants - Constantes do sistema para cálculo
 * @returns {number} Ganho térmico em watts
 */
function calculateDissipationGain(dissipacao, constants) {
  const fatorConversao = window.systemConstants?.AUX_Fator_Conver_Painel || 1;
  const fsPaineis = window.systemConstants?.AUX_Fs_Paineis || 100;
  const result = (fatorConversao * safeNumber(dissipacao) * fsPaineis) / 100;
  return result;
}

/**
 * Calcula ganho térmico por ocupação humana
 * @param {number} numPessoas - Número de pessoas no ambiente
 * @param {Object} constants - Constantes do sistema para cálculo
 * @returns {number} Ganho térmico total em watts
 */
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

/**
 * Calcula ganho sensível do ar externo
 * @param {number} vazaoArExterno - Vazão de ar externo em litros por segundo
 * @param {Object} auxVars - Variáveis auxiliares para cálculo
 * @param {Object} constants - Constantes do sistema para cálculo
 * @returns {number} Ganho térmico sensível em watts
 */
function calculateExternalAirSensibleGain(vazaoArExterno, auxVars, constants) {
  const c_ArExterno = window.systemConstants?.AUX_c_ArExterno || 0.24;
  const deltaT_ArExterno = window.systemConstants?.AUX_deltaT_ArExterno || 10;
  
  const calc_Gsens_ArE = auxVars.m_ArExterno * c_ArExterno * deltaT_ArExterno;
  const resultado = (calc_Gsens_ArE / 1000) * 1.16;
  
  return resultado;
}

/**
 * Calcula ganho latente do ar externo
 * @param {number} vazaoArExterno - Vazão de ar externo em litros por segundo
 * @param {Object} constants - Constantes do sistema para cálculo
 * @returns {number} Ganho térmico latente em watts
 */
function calculateExternalAirLatentGain(vazaoArExterno, constants) {
  const f_ArExterno = window.systemConstants?.AUX_f_ArExterno || 3.01;
  const deltaUa_ArExterno = window.systemConstants?.AUX_deltaUa_ArExterno || 8.47;
  
  const vazao = safeNumber(vazaoArExterno);
  const ganho = vazao * f_ArExterno * deltaUa_ArExterno;
  
  return ganho;
}

export {
  calculateCeilingGain,
  calculateWallGain,
  calculatePartitionGain,
  calculateFloorGain,
  calculateLightingGain,
  calculateDissipationGain,
  calculatePeopleGain,
  calculateExternalAirSensibleGain,
  calculateExternalAirLatentGain
};