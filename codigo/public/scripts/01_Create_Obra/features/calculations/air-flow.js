/**
 * features/calculations/air-flow.js
 * Sistema unificado de cálculos de vazão de ar - FUSÃO: airFlowCalculations.js + airFlowDisplay.js
 * Cálculos de fluxo de ar baseados em pressurização e portas
 */

import { CALCULATION_CONSTANTS } from '../../core/constants.js';
import {  
    waitForSystemConstants, 
    validateSystemConstants, 
    collectClimatizationInputs,
    findClimatizationSection,
    safeNumber 
} from './calculations-core.js';

// =============================================================================
// CÁLCULOS DE FLUXO DE AR
// =============================================================================

/**
 * Calcula fluxo de ar individual por porta
 * @param {number} doorCount - Número de portas
 * @param {number} doorVariable - Variável específica da porta
 * @param {number} pressure - Pressurização em Pa
 * @returns {number} Fluxo de ar em m³/h
 */
function calculateDoorFlow(doorCount, doorVariable, pressure) {
    const count = safeNumber(doorCount);
    const variable = safeNumber(doorVariable);
    const press = safeNumber(pressure);

    const pressureExponent = press > 0 ? Math.pow(press, CALCULATION_CONSTANTS.PRESSURE_EXPONENT) : 0;

    return CALCULATION_CONSTANTS.FLOW_COEFFICIENT *
           count *
           variable *
           pressureExponent *
           CALCULATION_CONSTANTS.SECONDS_PER_HOUR;
}

/**
 * Calcula vazão total de ar baseada em portas e pressurização
 * @param {Object} inputData - Dados de entrada
 * @returns {number} Vazão total em l/s
 */
function computeAirFlowRate(inputData) {
    const numPortasDuplas = safeNumber(inputData.numPortasDuplas);
    const numPortasSimples = safeNumber(inputData.numPortasSimples);
    
    // ✅ CORREÇÃO: Usar pressurizacaoSetpoint em vez de setpointTemp
    const pressure = inputData.pressurizacao ? safeNumber(inputData.pressurizacaoSetpoint) : 0;

    // Validação de constantes
    if (!window.systemConstants?.VARIAVEL_PD.value || !window.systemConstants?.VARIAVEL_PS.value) {
        console.error("Constantes do sistema não disponíveis");
        return 0;
    }

    const doubleDoorFlow = calculateDoorFlow(numPortasDuplas, window.systemConstants.VARIAVEL_PD.value
, pressure);
    const singleDoorFlow = calculateDoorFlow(numPortasSimples, window.systemConstants.VARIAVEL_PS.value
, pressure);

    const totalFlow = doubleDoorFlow + singleDoorFlow;
    const adjustedFlow = totalFlow / CALCULATION_CONSTANTS.FLOW_DIVISOR;
    const finalFlow = adjustedFlow * CALCULATION_CONSTANTS.SAFETY_FACTOR;

    return Math.ceil(finalFlow);
}

// =============================================================================
// ORQUESTRAÇÃO DE CÁLCULOS
// =============================================================================

/**
 * Executa cálculo completo de vazão de ar
 * @param {string} roomId - ID único da sala
 * @param {boolean} calculateThermal - Calcular ganhos térmicos após
 * @returns {Promise<number>} Vazão calculada em l/s
 */
async function calculateVazaoAr(roomId, calculateThermal = true) {
    try {
        if (!roomId) {
            console.error("ID de sala inválido");
            return 0;
        }

        await waitForSystemConstants();

        if (!validateSystemConstants()) {
            console.error("Constantes do sistema inválidas");
            return 0;
        }

        const tableSection = document.getElementById(`section-content-${roomId}-input-table`);
        
        // Fallback: se não encontrar a tabela, buscar inputs globalmente
        let inputContainer = tableSection;
        if (!tableSection) {
            console.warn(`⚠️ Tabela de inputs não encontrada para ${roomId}, buscando inputs globalmente`);
            inputContainer = document.querySelector(`[data-room-id="${roomId}"]`);
        }

        if (!inputContainer) {
            console.error(`Seção não encontrada para sala: ${roomId}`);
            return 0;
        }

        // ✅ CORREÇÃO: Coletar inputs do container correto
        const inputData = collectClimatizationInputs(inputContainer, roomId);
        
        // Debug: verificar dados coletados
        console.log(`📥 Dados coletados para cálculo de airflow (${roomId}):`, {
            numPortasDuplas: inputData.numPortasDuplas,
            numPortasSimples: inputData.numPortasSimples,
            pressurizacao: inputData.pressurizacao,
            pressurizacaoSetpoint: inputData.pressurizacaoSetpoint
        });
        
        const flowRate = computeAirFlowRate(inputData);

        updateFlowRateDisplay(roomId, flowRate);

        // Cálculo de ganhos térmicos se solicitado
        if (calculateThermal) {
            const { calculateThermalGains } = await import('./thermal-gains.js');
            await calculateThermalGains(roomId, flowRate);
        }

        return flowRate;

    } catch (error) {
        console.error(`Erro no cálculo de vazão para ${roomId}:`, error);
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
        if (!roomId) {
            console.error("ID de sala inválido");
            return;
        }
        
        const flowRate = await calculateVazaoAr(roomId, false);
        
        const { calculateThermalGains } = await import('./thermal-gains.js');
        await calculateThermalGains(roomId, flowRate);
        
    } catch (error) {
        console.error(`Erro no cálculo coordenado para ${roomId}:`, error);
    }
}

// =============================================================================
// ATUALIZAÇÃO DE DISPLAY
// =============================================================================

/**
 * Atualiza exibição do resultado de vazão na interface
 * @param {string} roomId - ID da sala
 * @param {number} flowRate - Vazão calculada
 */
function updateFlowRateDisplay(roomId, flowRate) {
    const resultElement = document.getElementById(`vazao-ar-${roomId}`);
    if (resultElement) {
        resultElement.textContent = flowRate;
        console.log(`✅ Vazão atualizada para ${roomId}: ${flowRate} l/s`);
    } else {
        console.error(`Elemento de vazão não encontrado: vazao-ar-${roomId}`);
    }
}

// =============================================================================
// VALIDAÇÕES E UTILITÁRIOS
// =============================================================================

/**
 * Valida dados de entrada para cálculo de vazão
 * @param {Object} inputData - Dados de entrada
 * @returns {boolean} True se dados são válidos
 */
function validateAirFlowInputs(inputData) {
    const required = ['numPortasDuplas', 'numPortasSimples'];
    const missing = required.filter(field => 
        inputData[field] === undefined || inputData[field] === null || inputData[field] === ''
    );
    
    if (missing.length > 0) {
        console.warn(`Campos obrigatórios faltando: ${missing.join(', ')}`);
        return false;
    }
    
    // Validações numéricas
    if (safeNumber(inputData.numPortasDuplas) < 0 || safeNumber(inputData.numPortasSimples) < 0) {
        console.warn("Quantidade de portas não pode ser negativa");
        return false;
    }
    
    if (inputData.pressurizacao && safeNumber(inputData.pressurizacaoSetpoint) < 0) {
        console.warn("Pressurização não pode ser negativa");
        return false;
    }
    
    return true;
}

/**
 * Prepara dados para cálculo de vazão
 * @param {Object} rawData - Dados brutos
 * @returns {Object} Dados preparados
 */
function prepareAirFlowData(rawData) {
    const prepared = { ...rawData };
    
    // Converter campos numéricos
    const numericFields = ['numPortasDuplas', 'numPortasSimples', 'pressurizacaoSetpoint'];
    numericFields.forEach(field => {
        if (prepared[field] !== undefined) {
            prepared[field] = safeNumber(prepared[field]);
        }
    });
    
    // Garantir valores padrão
    if (prepared.numPortasDuplas === undefined) prepared.numPortasDuplas = 0;
    if (prepared.numPortasSimples === undefined) prepared.numPortasSimples = 0;
    if (prepared.pressurizacao === undefined) prepared.pressurizacao = false;
    if (prepared.pressurizacaoSetpoint === undefined) prepared.pressurizacaoSetpoint = 0;
    
    return prepared;
}

/**
 * Obtém estatísticas do cálculo de vazão
 * @param {Object} inputData - Dados de entrada
 * @param {number} result - Resultado do cálculo
 * @returns {Object} Estatísticas
 */
function getAirFlowStats(inputData, result) {
    const numPortasDuplas = safeNumber(inputData.numPortasDuplas);
    const numPortasSimples = safeNumber(inputData.numPortasSimples);
    const pressure = inputData.pressurizacao ? safeNumber(inputData.pressurizacaoSetpoint) : 0;
    
    return {
        totalPortas: numPortasDuplas + numPortasSimples,
        portasDuplas: numPortasDuplas,
        portasSimples: numPortasSimples,
        pressurizacaoAtiva: inputData.pressurizacao,
        pressurizacaoValue: pressure,
        vazaoResultante: result,
    };
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

export {
    // Cálculos principais
    calculateDoorFlow,
    computeAirFlowRate,
    calculateVazaoAr,
    calculateVazaoArAndThermalGains,
    
    // Display
    updateFlowRateDisplay,
    
    // Validações e utilitários
    validateAirFlowInputs,
    prepareAirFlowData,
    getAirFlowStats
};

// =============================================================================
// DISPONIBILIZAÇÃO GLOBAL
// =============================================================================

if (typeof window !== 'undefined') {
    window.airFlowCalculations = {
        calculateVazaoAr,
        calculateVazaoArAndThermalGains,
        updateFlowRateDisplay,
        computeAirFlowRate
    };
}