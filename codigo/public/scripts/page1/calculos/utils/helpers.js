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
 * @param {string} roomId - ID da sala para debug
 * @returns {Object} Dados coletados dos inputs
 */
function collectClimatizationInputs(climaSection, roomId) {
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

  // ✅ CORREÇÃO: Garantir que pressurizacao e setpointPressurizacao estejam presentes
  if (data.pressurizacao === undefined) {
    const pressurizacaoCheckbox = climaSection.querySelector('input[data-field="pressurizacao"]');
    data.pressurizacao = pressurizacaoCheckbox ? pressurizacaoCheckbox.checked : false;
  }
  
  if (data.setpointPressurizacao === undefined) {
    const setpointInput = climaSection.querySelector('input[data-field="setpointPressurizacao"]');
    data.setpointPressurizacao = setpointInput ? safeNumber(setpointInput.value) : 0;
  }

  console.log("✅ [DEBUG COLLECT] Dados coletados para cálculo:", data);
  return data;
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

export {
  safeNumber,
  waitForSystemConstants,
  validateSystemConstants,
  collectClimatizationInputs,
  updateElementText
};