// core/shared-utils.js
function attachModuleToWindow(module) {
  Object.keys(module).forEach((key) => {
    if (typeof module[key] === "function") {
      window[key] = module[key];
    }
  });
}

function normalizeEmpresa(empresa) {
  if (!empresa || typeof empresa !== "object") {
    return null;
  }

  if (empresa.codigo && empresa.nome) {
    return empresa;
  }

  const codigo = Object.keys(empresa)[0];
  if (!codigo) {
    return null;
  }

  return {
    codigo,
    nome: empresa[codigo],
    credenciais: empresa.credenciais ?? null,
  };
}

function normalizeEmpresas(empresas) {
  if (!Array.isArray(empresas)) {
    return [];
  }

  return empresas
    .map(normalizeEmpresa)
    .filter((empresa) => empresa && empresa.codigo);
}

/**
 * FUNÇÃO CENTRALIZADA: Dispara cálculo de vazão e ganhos térmicos
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function triggerCalculation(roomId) {
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.warn(" Room ID inválido para triggerCalculation");
    return;
  }

  setTimeout(() => {
    // Tenta ambas as formas de chamar a função
    if (typeof calculateVazaoArAndThermalGains === "function") {
      calculateVazaoArAndThermalGains(roomId);
    } else if (typeof window.calculateVazaoArAndThermalGains === "function") {
      window.calculateVazaoArAndThermalGains(roomId);
    } else {
      console.warn(" calculateVazaoArAndThermalGains não disponível");
    }
  }, 12);
}

/**
 * FUNÇÃO CENTRALIZADA: Sincroniza título da sala com campo ambiente
 * @param {string} roomId - ID da sala
 * @param {string} newTitle - Novo título
 * @returns {void}
 */
function syncTitleToAmbienteDirect(roomId, newTitle) {
  if (!roomId || !newTitle) {
    console.warn(" Parâmetros inválidos para syncTitleToAmbienteDirect");
    return;
  }

  const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
  if (!roomBlock) {
    console.warn(` Sala ${roomId} não encontrada`);
    return;
  }

  // Busca o input de ambiente
  let ambienteInput = document.querySelector(
    `input[data-field="ambiente"][data-room-id="${roomId}"]`,
  );

  if (!ambienteInput) {
    ambienteInput = roomBlock.querySelector('input[data-field="ambiente"]');
  }

  if (ambienteInput && ambienteInput.value !== newTitle) {
    ambienteInput.value = newTitle;
    console.log(` Título → Ambiente: "${newTitle}"`);

    // Disparar cálculo
    triggerCalculation(roomId);
  }
}

// EXPORTS - Adicionar as novas funções
export {
  attachModuleToWindow,
  normalizeEmpresa,
  normalizeEmpresas,
  triggerCalculation, // NOVA
  syncTitleToAmbienteDirect, // NOVA
};
