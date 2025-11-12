// helpers.js

/**
 * Converte valores de entrada de forma segura para números
 * @param {any} value - Valor a ser convertido
 * @param {number} defaultValue - Valor padrão caso a conversão falhe
 * @returns {number} Valor numérico convertido
 */
function safeNumber(value, defaultValue = 0) {
  return (value !== "" && value !== undefined && value !== null) 
    ? Number(value) 
    : defaultValue;
}

/**
 * Aguarda carregamento assíncrono das constantes do sistema
 * @returns {Promise<boolean>} True quando as constantes estão disponíveis
 * @throws {Error} Se as constantes não carregarem dentro do tempo limite
 */
async function waitForSystemConstants() {
  let attempts = 0;
  const maxAttempts = 100;
  
  while ((!window.systemConstants || !window.systemConstants.VARIAVEL_PD) && attempts < maxAttempts) {
    console.log(" Aguardando constantes do sistema...", attempts);
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    console.error(" TIMEOUT: Constantes do sistema não carregadas após", maxAttempts, "tentativas");
    console.error(" systemConstants atual:", window.systemConstants);
    throw new Error("Constantes do sistema não carregadas");
  }
  
  console.log(" Constantes do sistema disponíveis após", attempts, "tentativas");
  return true;
}

/**
 * Valida integridade das constantes do sistema necessárias para cálculos
 * @returns {boolean} True se todas as constantes necessárias estão disponíveis
 */
function validateSystemConstants() {
  if (!window.systemConstants) {
    console.error(" systemConstants é null ou undefined");
    return false;
  }
  
  const requiredConstants = [
    'VARIAVEL_PD', 'VARIAVEL_PS', 'AUX_U_Value_Piso', 'AUX_Fator_Iluminacao',
    'AUX_Fs_Iluminacao', 'AUX_Fator_Conver_Painel', 'AUX_Fs_Paineis',
    'AUX_OCp_Csp', 'AUX_OCp_Clp', 'Densi_ar', 'AUX_c_ArExterno',
    'AUX_deltaT_ArExterno', 'AUX_f_ArExterno', 'AUX_deltaUa_ArExterno',
    'deltaT_piso', 'deltaT_teto', 'deltaT_parede_Oes', 'deltaT_parede_Les',
    'deltaT_parede_Nor', 'deltaT_parede_Sul', 'deltaT_divi_N_clim1',
    'deltaT_divi_N_clim2', 'deltaT_divi_clim1', 'deltaT_divi_clim2'
  ];
  
  const missingConstants = requiredConstants.filter(constant => 
    window.systemConstants[constant] === undefined || window.systemConstants[constant] === null
  );
  
  if (missingConstants.length > 0) {
    console.error(" Constantes faltando:", missingConstants);
    return false;
  }
  
  console.log(" Todas as constantes necessárias estão disponíveis");
  return true;
}

/**
 * Coleta dados de entrada da interface para processamento de climatização
 * @param {HTMLElement} climaSection - Elemento HTML da seção de climatização
 * @param {string} roomId - ID único da sala (formato: obra_w12_proj_t34_1_sala_r21_1)
 * @returns {Object} Dados coletados dos inputs
 */
function collectClimatizationInputs(climaSection, roomId) {
  console.log(`📝 [COLLECT] Coletando inputs para sala: ${roomId}`);
  
  const inputs = climaSection.querySelectorAll(".clima-input, input[data-field], select[data-field]");
  const data = {};

  inputs.forEach((input) => {
    const field = input.dataset.field;
    let value;
    
    // ✅ CORREÇÃO: Tratar diferentes tipos de input
    if (input.type === 'checkbox') {
      value = input.checked;
    } else if (input.type === 'number' || input.type === 'text') {
      value = input.value !== "" ? (input.type === 'number' ? Number.parseFloat(input.value) : input.value) : "";
    } else if (input.tagName === 'SELECT') {
      value = input.value !== "" ? input.value : "";
    }
    
    if (field) {
      data[field] = value;
    }
  });

  // ✅ CORREÇÃO: Garantir que pressurizacao e setpointTemp estejam presentes
  if (data.pressurizacao === undefined) {
    const pressurizacaoCheckbox = climaSection.querySelector('input[data-field="pressurizacaoSetpoint"]');
    data.pressurizacao = pressurizacaoCheckbox ? pressurizacaoCheckbox.checked : false;
  }
  
  if (data.setpointTemp === undefined) {
    const setpointInput = climaSection.querySelector('input[data-field="setpointTemp"]');
    data.setpointTemp = setpointInput ? safeNumber(setpointInput.value) : 0;
  }

  console.log(`✅ [COLLECT] ${Object.keys(data).length} dados coletados para ${roomId}:`, data);
  return data;
}

/**
 * Encontra a seção de climatização de uma sala pelo ID único
 * @param {string} roomId - ID único da sala
 * @returns {HTMLElement|null} Elemento da seção de climatização
 */
function findClimatizationSection(roomId) {
  // ✅ CORREÇÃO: Buscar APENAS por ID único
  const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
  if (!roomElement) {
    console.error(`❌ [FIND] Sala não encontrada: ${roomId}`);
    return null;
  }
  
  const climaSection = roomElement.querySelector('#section-content-' + roomId + '-clima');
  if (!climaSection) {
    console.error(`❌ [FIND] Seção de climatização não encontrada para: ${roomId}`);
    return null;
  }
  
  console.log(`✅ [FIND] Seção encontrada para: ${roomId}`);
  return climaSection;
}

/**
 * Atualiza elemento de texto genérico no DOM
 * @param {string} elementId - ID do elemento a ser atualizado
 * @param {any} value - Novo valor a ser definido
 * @returns {void}
 */
function updateElementText(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  } else {
    console.log(`⚠️  [DEBUG] Elemento ${elementId} não encontrado`);
  }
}

/**
 * Atualiza display de vazão de ar para sala específica
 * @param {string} roomId - ID único da sala
 * @param {number} flowRate - Valor da vazão calculada
 * @returns {void}
 */
function updateAirFlowDisplay(roomId, flowRate) {
  const flowElement = document.getElementById(`vazao-ar-${roomId}`);
  if (flowElement) {
    flowElement.textContent = Math.round(flowRate);
    console.log(`✅ [AIR FLOW] Vazão atualizada para ${roomId}: ${Math.round(flowRate)} l/s`);
  } else {
    console.error(`❌ [AIR FLOW] Elemento de vazão não encontrado para: ${roomId}`);
  }
}

/**
 * Atualiza display de ganhos térmicos para sala específica
 * @param {string} roomId - ID único da sala
 * @param {Object} thermalData - Dados de ganhos térmicos
 * @returns {void}
 */
function updateThermalGainsDisplay(roomId, thermalData) {
  console.log(`🔥 [THERMAL] Atualizando ganhos para: ${roomId}`, thermalData);
  
  // Mapeamento de campos para elementos
  const thermalElements = {
    'total-ganhos-w': `total-ganhos-w-${roomId}`,
    'total-tr': `total-tr-${roomId}`,
    'total-externo': `total-externo-${roomId}`,
    'total-divisoes': `total-divisoes-${roomId}`,
    'total-piso': `total-piso-${roomId}`,
    'total-iluminacao': `total-iluminacao-${roomId}`,
    'total-dissi': `total-dissi-${roomId}`,
    'total-pessoas': `total-pessoas-${roomId}`,
    'total-ar-sensivel': `total-ar-sensivel-${roomId}`,
    'total-ar-latente': `total-ar-latente-${roomId}`
  };
  
  Object.entries(thermalElements).forEach(([key, elementId]) => {
    const element = document.getElementById(elementId);
    if (element && thermalData[key] !== undefined) {
      element.textContent = Math.round(thermalData[key]);
    }
  });
  
  console.log(`✅ [THERMAL] Ganhos atualizados para: ${roomId}`);
}

export {
  safeNumber,
  waitForSystemConstants,
  validateSystemConstants,
  collectClimatizationInputs,
  findClimatizationSection,
  updateElementText,
  updateAirFlowDisplay,
  updateThermalGainsDisplay
};