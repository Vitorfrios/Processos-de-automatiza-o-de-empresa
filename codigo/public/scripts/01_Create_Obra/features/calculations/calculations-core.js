/**
 * features/calculations/calculations-core.js
 * Núcleo de cálculos unificado - FUSÃO OTIMIZADA: calculos-manager.js + helpers.js
 * Sistema centralizado para cálculos de climatização
 */


import { 
    safeNumber as coreSafeNumber, 
    updateElementText as coreUpdateElementText,
    waitForElement as coreWaitForElement,
    debounce as coreDebounce
} from '../../data/utils/core-utils.js';

import {
    collectClimatizationInputs as dataCollectClimatizationInputs,
    findClimatizationSection as dataFindClimatizationSection
} from '../../data/utils/data-utils.js';

// ✅ RE-EXPORTAR funções de data-utils para compatibilidade
export const collectClimatizationInputs = dataCollectClimatizationInputs;
export const findClimatizationSection = dataFindClimatizationSection;

// ✅ RE-EXPORTAR funções de core-utils para compatibilidade  
export const safeNumber = coreSafeNumber;
export const updateElementText = coreUpdateElementText;


// =============================================================================
// SISTEMA DE DEBOUNCE E PERFORMANCE
// =============================================================================

const calculationTimeouts = new Map();

/**
 * Sistema de debounce para otimizar cálculos
 * @param {string} roomId - ID da sala
 * @param {Function} calculationFunction - Função a executar
 * @param {number} delay - Delay em ms (padrão: 300ms)
 */
function debouncedCalculation(roomId, calculationFunction, delay = 300) {
    if (calculationTimeouts.has(roomId)) {
        clearTimeout(calculationTimeouts.get(roomId));
    }
    
    const timeoutId = setTimeout(() => {
        calculationFunction(roomId);
        calculationTimeouts.delete(roomId);
    }, delay);
    
    calculationTimeouts.set(roomId, timeoutId);
}

/**
 * Limpa todos os timeouts de cálculo
 */
function clearAllCalculationTimeouts() {
    calculationTimeouts.forEach((timeoutId, roomId) => {
        clearTimeout(timeoutId);
        calculationTimeouts.delete(roomId);
    });
}

// =============================================================================
// SISTEMA DE CONSTANTES
// =============================================================================

/**
 * Aguarda carregamento das constantes do sistema
 */
async function waitForSystemConstants() {
    let attempts = 0;
    const maxAttempts = 100;
    
    while ((!window.systemConstants || !window.systemConstants.VARIAVEL_PD.value
) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 25));
        attempts++;
    }
    
    if (attempts >= maxAttempts) {
        throw new Error("Constantes do sistema não carregadas");
    }
    
    return true;
}

/**
 * Valida integridade das constantes necessárias
 */
function validateSystemConstants() {
    if (!window.systemConstants) {
        console.error("systemConstants não disponível");
        return false;
    }
    
    const required = [
        'VARIAVEL_PD', 'VARIAVEL_PS', 'AUX_U_Value_Piso', 'AUX_Fator_Iluminacao',
        'AUX_Fs_Iluminacao', 'AUX_Fator_Conver_Painel', 'AUX_Fs_Paineis',
        'AUX_OCp_Csp', 'AUX_OCp_Clp', 'Densi_ar', 'AUX_c_ArExterno',
        'AUX_deltaT_ArExterno', 'AUX_f_ArExterno', 'AUX_deltaUa_ArExterno',
        'deltaT_piso', 'deltaT_teto', 'deltaT_parede_Oes', 'deltaT_parede_Les',
        'deltaT_parede_Nor', 'deltaT_parede_Sul', 'deltaT_divi_N_clim1',
        'deltaT_divi_N_clim2', 'deltaT_divi_clim1', 'deltaT_divi_clim2'
    ];
    
    const missing = required.filter(constant => 
        window.systemConstants[constant] === undefined || window.systemConstants[constant] === null
    );
    
    if (missing.length > 0) {
        console.error("Constantes faltando:", missing);
        return false;
    }
    
    return true;
}

// =============================================================================
// COLETA E PROCESSAMENTO DE DADOS
// =============================================================================






// =============================================================================
// SISTEMA DE CÁLCULOS COORDENADOS
// =============================================================================

/**
 * Executa cálculo coordenado de vazão e ganhos térmicos com debounce
 */
async function calculateVazaoArAndThermalGainsDebounced(roomId) {
    debouncedCalculation(roomId, async (id) => {
        try {
            // Importação dinâmica para evitar dependência circular
            const { calculateVazaoAr } = await import('./air-flow.js');
            const { calculateThermalGains } = await import('./thermal-gains.js');
            
            const flowRate = await calculateVazaoAr(id, false);
            await calculateThermalGains(id, flowRate);
            
        } catch (error) {
            console.error(`Erro em cálculo para ${id}:`, error);
        }
    }, 300);
}

/**
 * Executa cálculo imediato (sem debounce)
 */
async function calculateVazaoArAndThermalGainsImmediate(roomId) {
    try {
        const { calculateVazaoAr } = await import('./air-flow.js');
        const { calculateThermalGains } = await import('./thermal-gains.js');
        
        const flowRate = await calculateVazaoAr(roomId, false);
        await calculateThermalGains(roomId, flowRate);
        
    } catch (error) {
        console.error(`Erro em cálculo imediato para ${roomId}:`, error);
    }
}

// =============================================================================
// FUNÇÕES DE COMPATIBILIDADE
// =============================================================================




// =============================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// =============================================================================

/**
 * Valida se os dados coletados são suficientes para cálculos
 */
function validateCalculationData(inputData) {
    const requiredFields = ['area', 'altura', 'qtdPessoas', 'qtdEquipamentos'];
    const missingFields = requiredFields.filter(field => 
        !inputData[field] || inputData[field] === ''
    );
    
    if (missingFields.length > 0) {
        console.warn(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
        return false;
    }
    
    return true;
}

/**
 * Prepara dados para cálculo (conversões e formatações)
 */
function prepareCalculationData(rawData) {
    const prepared = { ...rawData };
    
    // Converter números
    const numericFields = ['area', 'altura', 'qtdPessoas', 'qtdEquipamentos', 'potenciaIluminacao'];
    numericFields.forEach(field => {
        if (prepared[field]) {
            prepared[field] = coreSafeNumber(prepared[field]);
        }
    });
    
    // Aplicar fatores de segurança
    if (prepared.fatorSeguranca) {
        const factor = coreSafeNumber(prepared.fatorSeguranca);
        if (factor > 1) {
            prepared.area = prepared.area * factor;
        }
    }
    
    return prepared;
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

export {
    // Sistema de Performance
    debouncedCalculation,
    clearAllCalculationTimeouts,
    
    // Sistema de Constantes
    waitForSystemConstants,
    validateSystemConstants,

    
    // Sistema de Cálculos
    calculateVazaoArAndThermalGainsDebounced,
    calculateVazaoArAndThermalGainsImmediate,
    
    // Validação e Preparação
    validateCalculationData,
    prepareCalculationData,
    


};

// =============================================================================
// INICIALIZAÇÃO E CONFIGURAÇÃO
// =============================================================================

// Configuração padrão do sistema de cálculos
const CALCULATION_CONFIG = {
    debounceDelay: 300,
    maxRetryAttempts: 3,
    validationStrict: false,
    enableLogging: window.location.hostname === 'localhost'
};


// Disponibilização global para compatibilidade
if (typeof window !== 'undefined') {
    window.calculationCore = {
        debouncedCalculation,
        waitForSystemConstants,
        collectClimatizationInputs,

        calculateVazaoArAndThermalGainsDebounced
    };
}

// Limpeza de timeouts ao descarregar a página
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', clearAllCalculationTimeouts);
}