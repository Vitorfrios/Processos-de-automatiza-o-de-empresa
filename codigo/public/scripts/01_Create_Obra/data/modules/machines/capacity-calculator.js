// capacityCalculator.js

import { updateElementText } from '../../utils/core-utils.js';

/**
 * Encontra o ID da sala a partir de um elemento dentro dela
 * @param {HTMLElement} element - Elemento dentro da sala
 * @returns {string|null} ID da sala ou null se não encontrado
 */
function findRoomId(element) {
    if (!element) return null;
    
    // Buscar o elemento room-block mais próximo
    const roomBlock = element.closest('.room-block');
    if (roomBlock) {
        return roomBlock.dataset.roomId || null;
    }
    
    // Tentar extrair do ID do elemento de conteúdo
    const roomContent = element.closest('[id^="room-content-"]');
    if (roomContent) {
        const match = roomContent.id.match(/room-content-(.+)/);
        if (match) return match[1];
    }
    
    // Tentar extrair de elementos com data-room-id
    const roomElement = element.closest('[data-room-id]');
    if (roomElement) {
        return roomElement.dataset.roomId;
    }
    
    console.warn(' Não foi possível encontrar o ID da sala para o elemento:', element);
    return null;
}

// Configurações para inicialização do sistema de capacidade
const capacityConfig = {
  maxInitAttempts: 5, // Aumentado para mais tentativas
  initDelay: 800,
  domCheckDelay: 300
}

// Estado global para controle de inicialização por sala
const capacityState = new Map()

/**
 * Constrói a tabela de cálculo de capacidade de refrigeração para uma sala
 * @param {string} roomId - ID da sala
 * @returns {string} HTML da tabela de capacidade
 */
function buildCapacityCalculationTable(roomId) {
  console.log(` Construindo tabela para: ${roomId}`);
  scheduleCapacityInit(roomId);
  const backupValue = getBackupFromClimaInputs(roomId);

  return `
    <div class="capacity-calculation-table">
      <h5 class="table-title">Cálculo de Capacidade de Refrigeração</h5>
      <div class="table-container">
        <table class="thermal-capacity-table">
          <thead>
            <tr>
              <th>Carga Estimada (TR)</th>
              <th>Fator de Seg.</th>
              <th>Cap. Unit. (TR)</th>
              <th>Solução</th>
              <th>Com back-up</th>
              <th>TOTAL (TR)</th>
              <th>FOLGA (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td id="carga-estimada-${roomId}">
                <input
                  type="number"
                  class="capacity-input"
                  min="0"
                  step="any"
                  placeholder="Aguardando cálculo..."
                  onchange="calculateCapacitySolution('${roomId}')"
                  oninput="calculateCapacitySolution('${roomId}')"
                >
              </td>
              <td>
                <input type="number" id="fator-seguranca-${roomId}" value="10" step="1" 
                      class="capacity-input" 
                      onchange="calculateCapacitySolution('${roomId}')"
                      oninput="calculateCapacitySolution('${roomId}')">
              </td>
              <td>
                <select id="capacidade-unitaria-${roomId}" class="capacity-select" 
                        onchange="calculateCapacitySolution('${roomId}')">
                  ${[1, 2, 3, 4, 5, 7.5, 10, 12.5, 15, 20, 25, 30]
                    .map((tr) => `<option value="${tr}">${tr} TR</option>`)
                    .join("")}
                </select>
              </td>
              <td id="solucao-${roomId}">-</td>
              <td class="backup-cell">
                <div class="backup-selection">
                  <select class="backup-select" onchange="updateBackupConfiguration(this)">
                    ${["n", "n+1", "n+2"]
                      .map((opt) => `<option value="${opt}" ${backupValue === opt ? "selected" : ""}>${opt}</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="backup-solution">
                  <span id="solucao-backup-${roomId}">-</span>
                </div>
              </td>
              <td id="total-capacidade-${roomId}">-</td>
              <td id="folga-${roomId}">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    `;
}

/**
 * Inicializa a tabela de capacidade estática (para casos específicos)
 * @returns {void}
 */
function initializeStaticCapacityTable() {
  const staticTable = document.querySelector(".capacity-calculation-table");
  if (staticTable) {
    scheduleCapacityInit("Projeto1-Sala1");
  }
}

/**
 * Agenda a inicialização do sistema de capacidade para uma sala
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function scheduleCapacityInit(roomId) {
  if (capacityState.has(roomId)) return;

  capacityState.set(roomId, { initialized: false, attempts: 0 });
  console.log(` Agendando inicialização para: ${roomId}`);
  setTimeout(() => initializeCapacitySystem(roomId), capacityConfig.initDelay);
}

/**
 * Inicializa o sistema de capacidade com tentativas controladas
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function initializeCapacitySystem(roomId) {
  const state = capacityState.get(roomId);
  if (!state || state.initialized) return;

  state.attempts++;

  const systemConstantsReady = window.systemConstants?.FATOR_SEGURANCA_CAPACIDADE.value !== undefined;

  if (systemConstantsReady || state.attempts >= capacityConfig.maxInitAttempts) {
    const fatorSeguranca = systemConstantsReady
      ? window.systemConstants.FATOR_SEGURANCA_CAPACIDADE.value
      : 10;

    applyFatorSeguranca(roomId, fatorSeguranca);

    // CORREÇÃO: Aguarda o DOM estar pronto antes de tentar buscar a carga térmica
    setTimeout(() => {
      const cargaInicial = getThermalLoadTR(roomId);
      const cargaInput = document.querySelector(`#carga-estimada-${roomId} input`);

      if (cargaInicial > 0 && cargaInput) {
        console.log(` Definindo carga inicial para ${roomId}: ${cargaInicial} TR`);
        cargaInput.value = Math.round(cargaInicial);
        calculateCapacitySolution(roomId);
      } else {
        console.log(` Aguardando cálculo térmico para ${roomId}`);
        // Agenda nova tentativa se não houver carga térmica ainda
        if (state.attempts < capacityConfig.maxInitAttempts * 2) {
          setTimeout(() => initializeCapacitySystem(roomId), capacityConfig.domCheckDelay);
        }
      }
    }, 250);

    state.initialized = true;
    console.log(` Sistema inicializado para: ${roomId}`);
  } else {
    setTimeout(() => initializeCapacitySystem(roomId), capacityConfig.initDelay);
  }
}

/**
 * Aplica o fator de segurança ao input correspondente
 * @param {string} roomId - ID da sala
 * @param {number} fatorSeguranca - Valor do fator de segurança
 * @returns {void}
 */
function applyFatorSeguranca(roomId, fatorSeguranca) {
  const inputFator = document.getElementById(`fator-seguranca-${roomId}`);
  if (!inputFator) return;

  inputFator.value = fatorSeguranca;
}

/**
 * Obtém a carga térmica em TR (Tons de Refrigeração) para uma sala
 * @param {string} roomId - ID da sala
 * @returns {number} Carga térmica em TR
 */
function getThermalLoadTR(roomId) {
  try {
    console.log(` Buscando carga térmica para: ${roomId}`);
    
    // PRIORIDADE 1: Buscar pelo campo TR-exato
    const totalTRExatoElement = document.getElementById(`total-tr-exato-${roomId}`);

    if (totalTRExatoElement && totalTRExatoElement.textContent !== '') {
      const trExato = Number(totalTRExatoElement.textContent);
      if (Number.isFinite(trExato) && trExato > 0) {
        console.log(` Usando TR-exato (sem aproximação): ${trExato} TR`);
        return trExato;
      }
    }
    
    // // PRIORIDADE 2: Buscar pelo campo TR-aproximado (referência principal)
    // const totalTRaproxElement = document.getElementById(`total-tr-aprox-${roomId}`);
    // if (totalTRaproxElement?.textContent) {
    //   const trAprox = Number.parseFloat(totalTRaproxElement.textContent);
    //   if (!isNaN(trAprox) && trAprox > 0) {
    //     console.log(` Usando TR-aproximado: ${trAprox} TR`);
    //     return trAprox;
    //   }
    // }

    // // PRIORIDADE 3: Calcular a partir dos ganhos em Watts
    // const totalGanhosWElement = document.getElementById(`total-ganhos-w-${roomId}`);
    // if (totalGanhosWElement?.textContent) {
    //   const totalW = Number.parseFloat(totalGanhosWElement.textContent) || 0;
    //   if (totalW > 0) {
    //     const trCalculado = totalW / 3517;
    //     console.log(` Calculado de Watts: ${totalW}W = ${trCalculado} TR`);
    //     return trCalculado;
    //   }
    // }

    console.log(` Nenhuma carga térmica encontrada para ${roomId}`);
    return 0;
  } catch (error) {
    console.error(`Erro ao obter carga térmica para sala ${roomId}:`, error);
    return 0;
  }
}

/**
 * Calcula a solução de capacidade de refrigeração baseada nos parâmetros
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function calculateCapacitySolution(roomId) {
  try {
    console.log(` Calculando solução para: ${roomId}`);
    
    const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`);
    const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`);
    const cargaEstimadaInput = document.querySelector(`#carga-estimada-${roomId} input`);

    if (!fatorSegurancaInput || !capacidadeUnitariaSelect || !cargaEstimadaInput) {
      console.warn(` Elementos não encontrados para: ${roomId}`);
      return;
    }

    const rawCarga = cargaEstimadaInput.value.trim();

    // Se usuário não digitou nada  só limpa os resultados
    if (rawCarga === "" || rawCarga === "0") {
      updateElementText(`solucao-${roomId}`, "N/A");
      updateElementText(`solucao-backup-${roomId}`, "N/A");
      updateElementText(`total-capacidade-${roomId}`, "N/A");
      updateElementText(`folga-${roomId}`, "N/A");
      return;
    }

    const cargaEstimada = Number.parseFloat(rawCarga);
    if (isNaN(cargaEstimada) || cargaEstimada <= 0) {
      console.warn(` Carga estimada inválida: ${rawCarga}`);
      return;
    }

    const fatorSegurancaRaw = Number.parseFloat(fatorSegurancaInput.value);
    const capacidadeUnitariaRaw = Number.parseFloat(capacidadeUnitariaSelect.value);

    const fatorSeguranca = isNaN(fatorSegurancaRaw) ? 0 : (fatorSegurancaRaw / 100);
    const capacidadeUnitaria = isNaN(capacidadeUnitariaRaw) ? 1 : capacidadeUnitariaRaw;

    const backupType = getBackupFromClimatization(roomId);

    const capacidadeNecessaria = cargaEstimada * (1 + fatorSeguranca);
    const unidadesOperacionais = Math.ceil(capacidadeNecessaria / capacidadeUnitaria);
    const unidadesTotais = applyBackupConfiguration(unidadesOperacionais, backupType);

    const total = unidadesOperacionais * capacidadeUnitaria;
    const folga = cargaEstimada > 0 ? ((total / cargaEstimada) - 1) * 100 : 0;

    updateCapacityDisplay(roomId, cargaEstimada, unidadesOperacionais, unidadesTotais, total, folga, backupType);
    
    console.log(` Solução calculada para ${roomId}:`, {
      cargaEstimada,
      fatorSeguranca: `${fatorSeguranca * 100}%`,
      capacidadeUnitaria,
      unidadesOperacionais,
      backupType,
      unidadesTotais,
      total: `${total.toFixed(1)} TR`,
      folga: `${folga.toFixed(1)}%`
    });
  } catch (error) {
    console.error(`Erro ao calcular capacidade para sala ${roomId}:`, error);
  }
}

/**
 * Obtém os dados atuais de capacidade de uma sala
 * @param {string} roomId - ID da sala
 * @returns {Object|null} Dados de capacidade ou null se não encontrado
 */
function getCapacityData(roomId) {
  const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`);
  const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`);
  const backupSelect = document.querySelector(`#room-content-${roomId} .backup-select`);

  if (!fatorSegurancaInput || !capacidadeUnitariaSelect || !backupSelect) return null;

  return {
    fatorSeguranca: Number.parseFloat(fatorSegurancaInput.value) || 10,
    capacidadeUnitaria: Number.parseFloat(capacidadeUnitariaSelect.value) || 1,
    backup: backupSelect.value || "n",
    cargaEstimada:  document.getElementById(`total-tr-exato-${roomId}`),
    solucao: document.getElementById(`solucao-${roomId}`)?.textContent || "0",
    solucaoBackup: document.getElementById(`solucao-backup-${roomId}`)?.textContent || "0",
    totalCapacidade: document.getElementById(`total-capacidade-${roomId}`)?.textContent || "0",
    folga: document.getElementById(`folga-${roomId}`)?.textContent || "0%"
  };
}

/**
 * Aplica a configuração de backup ao número de unidades
 * @param {number} unidadesOperacionais - Número de unidades operacionais
 * @param {string} backupType - Tipo de backup ("n", "n+1", "n+2")
 * @returns {number} Número total de unidades considerando backup
 */
function applyBackupConfiguration(unidadesOperacionais, backupType) {
  switch (backupType) {
    case "n+1":
      return unidadesOperacionais + 1;
    case "n+2":
      return unidadesOperacionais + 2;
    default:
      return unidadesOperacionais;
  }
}

/**
 * Obtém o tipo de backup configurado para climatização da sala
 * @param {string} roomId - ID da sala
 * @returns {string} Tipo de backup ("n", "n+1", "n+2")
 */
function getBackupFromClimatization(roomId) {
  const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`);
  if (capacityTable) {
    const backupSelect = capacityTable.querySelector(".backup-select");
    if (backupSelect) return backupSelect.value;
  }

  return getBackupFromClimaInputs(roomId);
}

/**
 * Obtém o backup dos inputs de clima da sala
 * @param {string} roomId - ID da sala
 * @returns {string} Tipo de backup ("n", "n+1", "n+2")
 */
function getBackupFromClimaInputs(roomId) {
  const roomContent = document.getElementById(`room-content-${roomId}`);
  if (roomContent) {
    const backupInput = roomContent.querySelector(`.clima-input[data-field="backup"]`);
    if (backupInput?.value) return backupInput.value;
  }
  return "n";
}

/**
 * Atualiza a exibição dos resultados de capacidade na tabela
 * @param {string} roomId - ID da sala
 * @param {number} cargaEstimada - Carga térmica estimada em TR
 * @param {number} solucao - Número de unidades da solução
 * @param {number} solucaoComBackup - Número de unidades com backup
 * @param {number} total - Capacidade total em TR
 * @param {number} folga - Percentual de folga
 * @param {string} backupType - Tipo de backup
 * @returns {void}
 */
function updateCapacityDisplay(roomId, cargaEstimada, solucao, solucaoComBackup, total, folga, backupType) {
  updateElementText(`solucao-${roomId}`, String(solucao));
  updateElementText(`solucao-backup-${roomId}`, String(solucaoComBackup));

  if (typeof total === "number" && !Number.isNaN(total)) {
    updateElementText(`total-capacidade-${roomId}`, total.toFixed(1));
  }

  if (typeof folga === "number" && !Number.isNaN(folga)) {
    updateElementText(`folga-${roomId}`, folga.toFixed(1) + "%");
  }

  const backupSelect = document.querySelector(`#room-content-${roomId} .backup-select`);
  if (backupSelect && backupSelect.value !== backupType) {
    backupSelect.value = backupType;
  }
}

/**
 * Atualiza ou cria o input para carga estimada 
 * @param {string} roomId - ID da sala
 * @param {number} value - Valor a ser definido 
 * @returns {void}
 */
function updateCargaEstimadaInput(roomId, value) {
  const cargaEstimadaElement = document.getElementById(`carga-estimada-${roomId}`);
  if (!cargaEstimadaElement) return;

  let input = cargaEstimadaElement.querySelector("input");
  if (!input) {
    input = document.createElement("input");
    input.type = "number";
    input.className = "capacity-input";
    input.min = "0";
    input.step = "any";
    input.onchange = () => calculateCapacitySolution(roomId);
    input.oninput = () => calculateCapacitySolution(roomId);
    input.value = value;

    cargaEstimadaElement.innerHTML = "";
    cargaEstimadaElement.appendChild(input);
  } else {
    input.value = value;

  }
}

/**
 * Atualiza a configuração de backup quando alterada pelo usuário
 * @param {HTMLSelectElement} selectElement - Elemento select do backup
 * @returns {void}
 */
function updateBackupConfiguration(selectElement) {
  const roomId = findRoomId(selectElement.closest(".capacity-calculation-table"));
  if (roomId) {
    const newBackupValue = selectElement.value;
    syncBackupWithClimaInputs(roomId, newBackupValue);
    calculateCapacitySolution(roomId);
  }
}

/**
 * Manipula mudanças no backup provenientes dos inputs de clima
 * @param {string} roomId - ID da sala
 * @param {string} newBackupValue - Novo valor de backup
 * @returns {void}
 */
function handleClimaInputBackupChange(roomId, newBackupValue) {
  const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`);

  if (capacityTable) {
    const backupSelect = capacityTable.querySelector(".backup-select");
    if (backupSelect && backupSelect.value !== newBackupValue) {
      backupSelect.value = newBackupValue;
      calculateCapacitySolution(roomId);
    }
  }
}

/**
 * Sincroniza o backup com os inputs de clima da sala
 * @param {string} roomId - ID da sala
 * @param {string} backupValue - Valor de backup a ser sincronizado
 * @returns {void}
 */
function syncBackupWithClimaInputs(roomId, backupValue) {
    const roomContent = document.getElementById(`room-content-${roomId}`);
    if (roomContent) {
        const backupInputs = roomContent.querySelectorAll(`.clima-input[data-field="backup"]`);

        backupInputs.forEach((input) => {
            if (input.value !== backupValue) {
                // Remove temporariamente o onchange para evitar loop
                const originalOnChange = input.onchange;
                input.onchange = null;
                
                input.value = backupValue;
                
                // Restaura o onchange após um breve delay
                setTimeout(() => {
                    input.onchange = originalOnChange;
                }, 12);
            }
        });
    }
}

/**
 * Sincroniza o backup da tabela de capacidade com os valores atuais
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function syncCapacityTableBackup(roomId) {
  setTimeout(() => {
    const backupFromInputs = getBackupFromClimaInputs(roomId);
    const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`);

    if (capacityTable) {
      const backupSelect = capacityTable.querySelector(".backup-select");
      if (backupSelect && backupSelect.value !== backupFromInputs) {
        backupSelect.value = backupFromInputs;
        calculateCapacitySolution(roomId);
      }
    }
  }, 62);
}

/**
 *  Função global para ser chamada diretamente do HTML - EVITA LOOP
 * @param {string} roomId - ID da sala
 * @param {string} newValue - Novo valor do backup
 * @returns {void}
 */
function handleClimaBackupChange(roomId, newValue) {
    console.log(` Backup alterado no form: ${newValue} (sala: ${roomId})`);
    
    // Atualiza o backup-select SEM disparar eventos de volta
    const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`);
    if (capacityTable) {
        const backupSelect = capacityTable.querySelector(".backup-select");
        if (backupSelect && backupSelect.value !== newValue) {
            backupSelect.value = newValue;
            calculateCapacitySolution(roomId);
        }
    }
    
    // Mantém o cálculo térmico original
    if (typeof window.calculateVazaoArAndThermalGains === 'function') {
        window.calculateVazaoArAndThermalGains(roomId);
    }
}

/**
 *  WRAPPER: Para ser chamada diretamente do onchange do HTML
 * @param {HTMLSelectElement} selectElement - Elemento select do form
 * @returns {void}
 */
function handleClimaInputBackupChangeFromEvent(selectElement) {
    const roomId = findRoomId(selectElement);
    if (!roomId) {
        console.warn(' Não foi possível encontrar roomId para handleClimaInputBackupChangeFromEvent');
        return;
    }
    
    const newBackupValue = selectElement.value;
    console.log(` Backup alterado no form: ${newBackupValue} (sala: ${roomId})`);
    
    // Usa a função existente que já faz todo o trabalho
    handleClimaInputBackupChange(roomId, newBackupValue);
    
    // Também dispara o cálculo térmico (mantém funcionalidade original)
    if (typeof window.calculateVazaoArAndThermalGains === 'function') {
        window.calculateVazaoArAndThermalGains(roomId);
    }
}

/**
 * NOVA FUNÇÃO: Atualiza capacidade a partir dos ganhos térmicos
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function updateCapacityFromThermalGains(roomId) {
  console.log(` Atualizando capacidade a partir de ganhos térmicos para ${roomId}`);
  
  const cargaEstimada = getThermalLoadTR(roomId);
  if (cargaEstimada > 0) {
    updateCargaEstimadaInput(roomId, cargaEstimada);
    calculateCapacitySolution(roomId);
    return true;
  }
  return false;
}

//  Torna as funções globais para serem acessíveis do HTML
if (typeof window !== 'undefined') {
  window.handleClimaBackupChange = handleClimaBackupChange;
  window.handleClimaInputBackupChangeFromEvent = handleClimaInputBackupChangeFromEvent;
  window.updateBackupConfiguration = updateBackupConfiguration;
  window.calculateCapacitySolution = calculateCapacitySolution;
  window.updateCapacityFromThermalGains = updateCapacityFromThermalGains;
}

// Exportação das funções do módulo
export {
  buildCapacityCalculationTable,
  calculateCapacitySolution,
  getCapacityData,
  updateBackupConfiguration,
  handleClimaInputBackupChange,
  syncCapacityTableBackup,
  initializeStaticCapacityTable,
  handleClimaInputBackupChangeFromEvent,
  updateCapacityFromThermalGains,
  getThermalLoadTR
};