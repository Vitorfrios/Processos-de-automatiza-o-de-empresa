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
    
    console.warn('❌ Não foi possível encontrar o ID da sala para o elemento:', element);
    return null;
}

// Configurações para inicialização do sistema de capacidade
const capacityConfig = {
  maxInitAttempts: 3,
  initDelay: 500
}

// Estado global para controle de inicialização por sala
const capacityState = new Map()

/**
 * Constrói a tabela de cálculo de capacidade de refrigeração para uma sala
 * @param {string} roomId - ID da sala
 * @returns {string} HTML da tabela de capacidade
 */
function buildCapacityCalculationTable(roomId) {
  scheduleCapacityInit(roomId)
  const backupValue = getBackupFromClimaInputs(roomId)

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
              <td id="carga-estimada-${roomId}">0</td> 
              <td>
                <input type="number" id="fator-seguranca-${roomId}" step="1" 
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
              <td id="solucao-${roomId}">0</td>
              <td class="backup-cell">
                <div class="backup-selection">
                  <select class="backup-select" onchange="updateBackupConfiguration(this)">
                    ${["n", "n+1", "n+2"]
                      .map((opt) => `<option value="${opt}" ${backupValue === opt ? "selected" : ""}>${opt}</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="backup-solution">
                  <span id="solucao-backup-${roomId}">0</span>
                </div>
              </td>
              <td id="total-capacidade-${roomId}">0</td>
              <td id="folga-${roomId}">0%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}

/**
 * Inicializa a tabela de capacidade estática (para casos específicos)
 * @returns {void}
 */
function initializeStaticCapacityTable() {
  const staticTable = document.querySelector(".capacity-calculation-table")
  if (staticTable) {
    scheduleCapacityInit("Projeto1-Sala1")
  }
}

/**
 * Agenda a inicialização do sistema de capacidade para uma sala
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function scheduleCapacityInit(roomId) {
  if (capacityState.has(roomId)) return

  capacityState.set(roomId, { initialized: false, attempts: 0 })
  setTimeout(() => initializeCapacitySystem(roomId), capacityConfig.initDelay)
}

/**
 * Inicializa o sistema de capacidade com tentativas controladas
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function initializeCapacitySystem(roomId) {
  const state = capacityState.get(roomId)
  if (!state || state.initialized) return

  state.attempts++

  const systemConstantsReady = window.systemConstants?.FATOR_SEGURANCA_CAPACIDADE !== undefined

  if (systemConstantsReady || state.attempts >= capacityConfig.maxInitAttempts) {
    const fatorSeguranca = systemConstantsReady
      ? window.systemConstants.FATOR_SEGURANCA_CAPACIDADE
      : 10 // Valor padrão sem fallback complexo

    applyFatorSeguranca(roomId, fatorSeguranca)
    state.initialized = true
  }
}

/**
 * Aplica o fator de segurança ao input correspondente
 * @param {string} roomId - ID da sala
 * @param {number} fatorSeguranca - Valor do fator de segurança
 * @returns {void}
 */
function applyFatorSeguranca(roomId, fatorSeguranca) {
  const inputFator = document.getElementById(`fator-seguranca-${roomId}`)
  if (!inputFator) return

  inputFator.value = fatorSeguranca
  calculateCapacitySolution(roomId)
}

/**
 * Obtém a carga térmica em TR (Tons de Refrigeração) para uma sala
 * @param {string} roomId - ID da sala
 * @returns {number} Carga térmica em TR
 */
function getThermalLoadTR(roomId) {
  try {
    const totalTRElement = document.getElementById(`total-tr-${roomId}`)
    if (totalTRElement?.textContent) {
      return Number.parseFloat(totalTRElement.textContent) || 0
    }

    const totalGanhosWElement = document.getElementById(`total-ganhos-w-${roomId}`)
    if (totalGanhosWElement?.textContent) {
      const totalW = Number.parseFloat(totalGanhosWElement.textContent) || 0
      return totalW / 3517
    }

    return 0
  } catch (error) {
    console.error(`Erro ao obter carga térmica para sala ${roomId}:`, error)
    return 0
  }
}

/**
 * Calcula a solução de capacidade de refrigeração baseada nos parâmetros
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function calculateCapacitySolution(roomId) {
  try {
    const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`)
    const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`)
    const cargaEstimadaInput = document.querySelector(`carga-estimada-${roomId} input`)

    if (!fatorSegurancaInput || !capacidadeUnitariaSelect) return

    // Usa o valor do input se existir, senão usa o cálculo automático
    const cargaEstimada = cargaEstimadaInput ? 
      (Number.parseInt(cargaEstimadaInput.value) || 0) : 
      getThermalLoadTR(roomId)

    const fatorSeguranca = Number.parseFloat(fatorSegurancaInput.value) / 100
    const capacidadeUnitaria = Number.parseFloat(capacidadeUnitariaSelect.value)
    const backupType = getBackupFromClimatization(roomId)

    const capacidadeNecessaria = cargaEstimada * (1 + fatorSeguranca)
    const unidadesOperacionais = Math.ceil(capacidadeNecessaria / capacidadeUnitaria)
    const unidadesTotais = applyBackupConfiguration(unidadesOperacionais, backupType)

    const total = unidadesOperacionais * capacidadeUnitaria
    const folga = cargaEstimada > 0 ? (total / cargaEstimada - 1) * 100 : 0

    updateCapacityDisplay(roomId, cargaEstimada, unidadesOperacionais, unidadesTotais, total, folga, backupType)
    
    // ✅ CORREÇÃO: Salvar usando roomId em vez de projectName/roomName
    saveCapacityData(roomId)
  } catch (error) {
    console.error(`Erro ao calcular capacidade para sala ${roomId}:`, error)
  }
}

/**
 * Obtém os dados atuais de capacidade de uma sala
 * @param {string} roomId - ID da sala
 * @returns {Object|null} Dados de capacidade ou null se não encontrado
 */
function getCapacityData(roomId) {
  const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`)
  const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`)
  const backupSelect = document.querySelector(`#room-content-${roomId} .backup-select`)

  if (!fatorSegurancaInput || !capacidadeUnitariaSelect || !backupSelect) return null

  return {
    fatorSeguranca: Number.parseFloat(fatorSegurancaInput.value) || 10,
    capacidadeUnitaria: Number.parseFloat(capacidadeUnitariaSelect.value) || 1,
    backup: backupSelect.value || "n",
    cargaEstimada: getThermalLoadTR(roomId),
    solucao: document.getElementById(`solucao-${roomId}`)?.textContent || "0",
    solucaoBackup: document.getElementById(`solucao-backup-${roomId}`)?.textContent || "0",
    totalCapacidade: document.getElementById(`total-capacidade-${roomId}`)?.textContent || "0",
    folga: document.getElementById(`folga-${roomId}`)?.textContent || "0%"
  }
}

/**
 * ✅ CORREÇÃO COMPLETA: Salva os dados de capacidade no servidor usando roomId
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function saveCapacityData(roomId) {
  try {
    const capacityData = getCapacityData(roomId)
    
    if (!capacityData) {
      console.warn(`[CAPACITY] Nenhum dado de capacidade para sala ${roomId}`)
      return
    }

    console.log(`[CAPACITY] Salvando dados para sala: ${roomId}`)

    // ✅ CORREÇÃO: Verificar primeiro se a sala existe localmente (recém-criada)
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomElement) {
      console.log(`[CAPACITY] Sala ${roomId} não encontrada localmente - ignorando save`)
      return;
    }

    // Buscar todas as obras
    fetch(`/obras`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
      .then(obras => {
        console.log(`[CAPACITY] Obras carregadas:`, obras.map(o => ({ id: o.id, nome: o.nome })))
        
        let obraUpdated = false
        let obraParaAtualizar = null
        
        // Buscar pela sala usando roomId
        for (const obra of obras) {
          for (const projeto of obra.projetos || []) {
            for (const sala of projeto.salas || []) {
              if (sala.id === roomId) {
                // Encontrou a sala pelo ID único
                if (!sala.capacidade) {
                  sala.capacidade = {}
                }
                
                sala.capacidade = capacityData
                obraUpdated = true
                obraParaAtualizar = obra
                console.log(`[CAPACITY] Dados atualizados na obra ${obra.nome}, projeto ${projeto.nome}, sala ${sala.nome}`)
                break
              }
            }
            if (obraUpdated) break
          }
          if (obraUpdated) break
        }

        if (!obraUpdated) {
          console.log(`[CAPACITY] Sala ${roomId} ainda não salva no servidor - dados mantidos localmente`)
          return
        }

        // Atualizar apenas a obra específica
        return fetch(`/obras/${obraParaAtualizar.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(obraParaAtualizar)
        })
      })
      .then(response => {
        if (response && response.ok) {
          console.log(`[CAPACITY] Dados de capacidade salvos para sala ${roomId}`)
        } else if (response) {
          console.log(`[CAPACITY] Erro HTTP ${response.status} ao salvar`)
        }
      })
      .catch(error => {
        console.log(`[CAPACITY] Erro ao buscar obras: ${error.message}`)
      })
      
  } catch (error) {
    console.log(`[CAPACITY] Erro inesperado: ${error.message}`)
  }
}

/**
 * ✅ CORREÇÃO COMPLETA: Carrega os dados de capacidade do servidor para uma sala
 * @param {string} roomId - ID único da sala
 * @returns {boolean} True se os dados foram carregados com sucesso
 */
function loadCapacityData(roomId) {
  try {
    console.log(`[CAPACITY] Tentando carregar dados para sala ${roomId}`)
    
    // Buscar obras
    fetch(`/obras`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
      .then(obras => {
        console.log(`[CAPACITY] Obras carregadas:`, obras.map(o => o.nome))
        
        // ✅ CORREÇÃO: Buscar pela sala usando roomId
        for (const obra of obras) {
          for (const projeto of obra.projetos || []) {
            for (const sala of projeto.salas || []) {
              if (sala.id === roomId && sala.capacidade) {
                console.log(`[CAPACITY] Dados encontrados na obra ${obra.nome}, projeto ${projeto.nome}`)
                applyCapacityData(roomId, sala.capacidade)
                return true
              }
            }
          }
        }

        console.log(`[CAPACITY] Nenhum dado de capacidade encontrado para sala ${roomId}`)
        return false
      })
      .catch(error => {
        console.error('[CAPACITY] Erro ao carregar obras:', error)
        return false
      })
      
  } catch (error) {
    console.error('[CAPACITY] Erro geral:', error)
    return false
  }
}

/**
 * Aplica os dados de capacidade carregados aos elementos da interface
 * @param {string} roomId - ID da sala
 * @param {Object} capacityData - Dados de capacidade a serem aplicados
 * @returns {void}
 */
function applyCapacityData(roomId, capacityData) {
  const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`)
  const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`)
  const backupSelect = document.querySelector(`#room-content-${roomId} .backup-select`)

  if (fatorSegurancaInput && capacityData.fatorSeguranca) {
    fatorSegurancaInput.value = capacityData.fatorSeguranca
  }

  if (capacidadeUnitariaSelect && capacityData.capacidadeUnitaria) {
    capacidadeUnitariaSelect.value = capacityData.capacidadeUnitaria
  }

  if (backupSelect && capacityData.backup) {
    backupSelect.value = capacityData.backup
  }

  // Recalcular após carregar os dados
  setTimeout(() => {
    calculateCapacitySolution(roomId)
  }, 100)
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
      return unidadesOperacionais + 1
    case "n+2":
      return unidadesOperacionais + 2
    default:
      return unidadesOperacionais
  }
}

/**
 * Obtém o tipo de backup configurado para climatização da sala
 * @param {string} roomId - ID da sala
 * @returns {string} Tipo de backup ("n", "n+1", "n+2")
 */
function getBackupFromClimatization(roomId) {
  const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`)
  if (capacityTable) {
    const backupSelect = capacityTable.querySelector(".backup-select")
    if (backupSelect) return backupSelect.value
  }

  return getBackupFromClimaInputs(roomId)
}

/**
 * Obtém o backup dos inputs de clima da sala
 * @param {string} roomId - ID da sala
 * @returns {string} Tipo de backup ("n", "n+1", "n+2")
 */
function getBackupFromClimaInputs(roomId) {
  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (roomContent) {
    const backupInput = roomContent.querySelector(`.clima-input[data-field="backup"]`)
    if (backupInput?.value) return backupInput.value
  }
  return "n"
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
  
  // Atualizar o campo de carga estimada com input editável (valor inteiro)
  updateCargaEstimadaInput(roomId, Math.round(cargaEstimada))
  updateElementText(`solucao-${roomId}`, solucao)
  updateElementText(`solucao-backup-${roomId}`, solucaoComBackup)
  updateElementText(`total-capacidade-${roomId}`, total.toFixed(1))
  updateElementText(`folga-${roomId}`, folga.toFixed(1) + "%")

  const backupSelect = document.querySelector(`#room-content-${roomId} .backup-select`)
  if (backupSelect) {
    backupSelect.value = backupType
    backupSelect.disabled = false
  }
}

/**
 * Atualiza ou cria o input para carga estimada (apenas inteiros)
 * @param {string} roomId - ID da sala
 * @param {number} value - Valor a ser definido (inteiro)
 * @returns {void}
 */
function updateCargaEstimadaInput(roomId, value) {
  const cargaEstimadaElement = document.getElementById(`carga-estimada-${roomId}`)
  
  if (!cargaEstimadaElement) return

  // Verificar se já existe um input
  let input = cargaEstimadaElement.querySelector('input')
  
  if (!input) {
    // Criar input se não existir
    input = document.createElement('input')
    input.type = 'number'
    input.className = 'capacity-input'
    input.min = '0'
    input.step = '1' // Força números inteiros
    input.value = value
    
    // Adicionar evento apenas para salvar, não para recalcular
    input.addEventListener('change', () => {
      // ✅ CORREÇÃO: Salvar usando roomId
      saveCapacityData(roomId)
    })
    
    // Limpar conteúdo anterior e adicionar o input
    cargaEstimadaElement.innerHTML = ''
    cargaEstimadaElement.appendChild(input)
  } else {
    // Atualiza com o valor calculado quando a função é chamada
    input.value = Math.round(value)
  }
}

/**
 * Atualiza a configuração de backup quando alterada pelo usuário
 * @param {HTMLSelectElement} selectElement - Elemento select do backup
 * @returns {void}
 */
function updateBackupConfiguration(selectElement) {
  const roomId = findRoomId(selectElement.closest(".capacity-calculation-table"))
  if (roomId) {
    const newBackupValue = selectElement.value
    syncBackupWithClimaInputs(roomId, newBackupValue)
    calculateCapacitySolution(roomId)
    
    // ✅ CORREÇÃO: Salvar usando roomId
    saveCapacityData(roomId)
  }
}

/**
 * Manipula mudanças no backup provenientes dos inputs de clima
 * @param {string} roomId - ID da sala
 * @param {string} newBackupValue - Novo valor de backup
 * @returns {void}
 */
function handleClimaInputBackupChange(roomId, newBackupValue) {
  const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`)

  if (capacityTable) {
    const backupSelect = capacityTable.querySelector(".backup-select")
    if (backupSelect && backupSelect.value !== newBackupValue) {
      backupSelect.value = newBackupValue
      calculateCapacitySolution(roomId)
      
      // ✅ CORREÇÃO: Salvar usando roomId
      saveCapacityData(roomId)
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
  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (roomContent) {
    const backupInputs = roomContent.querySelectorAll(`.clima-input[data-field="backup"]`)

    backupInputs.forEach((input) => {
      if (input.value !== backupValue) {
        input.value = backupValue
        input.dispatchEvent(new Event("change", { bubbles: true }))
      }
    })
  }
}

/**
 * Sincroniza o backup da tabela de capacidade com os valores atuais
 * @param {string} roomId - ID da sala
 * @returns {void}
 */
function syncCapacityTableBackup(roomId) {
  setTimeout(() => {
    const backupFromInputs = getBackupFromClimaInputs(roomId)
    const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`)

    if (capacityTable) {
      const backupSelect = capacityTable.querySelector(".backup-select")
      if (backupSelect && backupSelect.value !== backupFromInputs) {
        backupSelect.value = backupFromInputs
        calculateCapacitySolution(roomId)
      }
    }
  }, 500)
}

// Exportação das funções do módulo
export {
  buildCapacityCalculationTable,
  calculateCapacitySolution,
  getCapacityData,
  saveCapacityData,
  loadCapacityData,
  applyCapacityData,
  updateBackupConfiguration,
  handleClimaInputBackupChange,
  syncCapacityTableBackup,
  initializeStaticCapacityTable
}