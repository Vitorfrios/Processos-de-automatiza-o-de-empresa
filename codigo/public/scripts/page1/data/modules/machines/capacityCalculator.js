import { API_CONFIG } from '../../../config/config.js'  
import { updateElementText, findRoomId } from './utilities.js'

const capacityConfig = {
  maxInitAttempts: 3,
  initDelay: 500,
  fallbackFatorSeguranca: 10,
}

const capacityState = new Map()

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
                <input type="number" id="fator-seguranca-${roomId}" step="0.01" 
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

function initializeStaticCapacityTable() {
  const staticTable = document.querySelector(".capacity-calculation-table")
  if (staticTable) {
    scheduleCapacityInit("Projeto1-Sala1")
  }
}
function scheduleCapacityInit(roomId) {
  if (capacityState.has(roomId)) return

  capacityState.set(roomId, { initialized: false, attempts: 0 })
  setTimeout(() => initializeCapacitySystem(roomId), capacityConfig.initDelay)
}

function initializeCapacitySystem(roomId) {
  const state = capacityState.get(roomId)
  if (!state || state.initialized) return

  state.attempts++

  const systemConstantsReady = window.systemConstants?.FATOR_SEGURANCA_CAPACIDADE !== undefined

  if (systemConstantsReady || state.attempts >= capacityConfig.maxInitAttempts) {
    const fatorSeguranca = systemConstantsReady
      ? window.systemConstants.FATOR_SEGURANCA_CAPACIDADE
      : capacityConfig.fallbackFatorSeguranca

    applyFatorSeguranca(roomId, fatorSeguranca)
    state.initialized = true
  }
}

function applyFatorSeguranca(roomId, fatorSeguranca) {
  const inputFator = document.getElementById(`fator-seguranca-${roomId}`)
  if (!inputFator) return

  inputFator.value = fatorSeguranca
  calculateCapacitySolution(roomId)
}

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

function calculateCapacitySolution(roomId) {
  try {
    const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`)
    const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`)

    if (!fatorSegurancaInput || !capacidadeUnitariaSelect) return

    const cargaEstimada = getThermalLoadTR(roomId)
    const fatorSeguranca = Number.parseFloat(fatorSegurancaInput.value) / 100
    const capacidadeUnitaria = Number.parseFloat(capacidadeUnitariaSelect.value)
    const backupType = getBackupFromClimatization(roomId)

    const safeFatorSeguranca = isNaN(fatorSeguranca) ? 0.1 : fatorSeguranca
    const safeCapacidadeUnitaria = isNaN(capacidadeUnitaria) ? 1 : capacidadeUnitaria

    const capacidadeNecessaria = cargaEstimada * (1 + safeFatorSeguranca)
    const unidadesOperacionais = Math.ceil(capacidadeNecessaria / safeCapacidadeUnitaria)
    const unidadesTotais = applyBackupConfiguration(unidadesOperacionais, backupType)

    const total = unidadesOperacionais * safeCapacidadeUnitaria
    const folga = cargaEstimada > 0 ? (total / cargaEstimada - 1) * 100 : 0

    updateCapacityDisplay(roomId, cargaEstimada, unidadesOperacionais, unidadesTotais, total, folga, backupType)
    
    // SALVAR AUTOMATICAMENTE APÓS CALCULAR
    const roomContent = document.getElementById(`room-content-${roomId}`)
    if (roomContent) {
      const projectName = roomContent.getAttribute('data-project-name')
      const roomName = roomContent.getAttribute('data-room-name')
      if (projectName && roomName) {
        saveCapacityData(projectName, roomName)
      }
    }
  } catch (error) {
    console.error(`Erro ao calcular capacidade para sala ${roomId}:`, error)
  }
}

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

function saveCapacityData(projectName, roomName) {
  try {
    const roomId = `${projectName}-${roomName}`
    const capacityData = getCapacityData(roomId)
    
    if (!capacityData) return

    fetch(`${API_CONFIG.projects}/projetos`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
      .then(projetos => {
        const projetoIndex = projetos.findIndex(p => p.nome === projectName)
        if (projetoIndex === -1) {
          console.warn(`[CAPACITY] Projeto ${projectName} não encontrado`)
          return
        }

        const salaIndex = projetos[projetoIndex].salas.findIndex(sala => sala.nome === roomName)
        if (salaIndex === -1) {
          console.warn(`[CAPACITY] Sala ${roomName} não encontrada no projeto ${projectName}`)
          return
        }

        if (!projetos[projetoIndex].salas[salaIndex]['Cálculo_Capacidade_Refrigeração']) {
          projetos[projetoIndex].salas[salaIndex]['Cálculo_Capacidade_Refrigeração'] = {}
        }
        
        projetos[projetoIndex].salas[salaIndex]['Cálculo_Capacidade_Refrigeração'] = capacityData
        
        return fetch(`${API_CONFIG.projects}/projetos`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projetos)
        })
      })
      .then(response => {
        if (response && response.ok) {
          console.log(`[CAPACITY] Dados de capacidade salvos para ${roomId}`, capacityData)
        }
      })
      .catch(error => {
        console.error('[CAPACITY] Erro ao salvar dados de capacidade:', error)
      })
      
  } catch (error) {
    console.error('[CAPACITY] Erro ao salvar dados de capacidade:', error)
  }
}

function loadCapacityData(projectName, roomName) {
  try {
    const roomId = `${projectName}-${roomName}`
    
    console.log(`[CAPACITY] Tentando carregar dados para ${projectName}-${roomName}`)
    
    fetch(`${API_CONFIG.projects}/projetos`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
      .then(projetos => {
        console.log(`[CAPACITY] Projetos carregados:`, projetos)
        
        const projeto = projetos.find(p => p.nome === projectName)
        if (!projeto) {
          console.warn(`[CAPACITY] Projeto ${projectName} não encontrado. Projetos disponíveis:`, projetos.map(p => p.nome))
          return false
        }

        const sala = projeto.salas.find(sala => sala.nome === roomName)
        if (!sala) {
          console.warn(`[CAPACITY] Sala ${roomName} não encontrada. Salas disponíveis:`, projeto.salas.map(s => s.nome))
          return false
        }

        if (!sala['Cálculo_Capacidade_Refrigeração']) {
          console.log(`[CAPACITY] Nenhum dado de capacidade encontrado para ${roomName}`)
          return false
        }

        const capacityData = sala['Cálculo_Capacidade_Refrigeração']
        applyCapacityData(roomId, capacityData)
        return true
      })
      .catch(error => {
        console.error('[CAPACITY] Erro ao carregar projetos:', error)
        return false
      })
      
  } catch (error) {
    console.error('[CAPACITY] Erro geral:', error)
    return false
  }
}

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

function getBackupFromClimatization(roomId) {
  const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`)
  if (capacityTable) {
    const backupSelect = capacityTable.querySelector(".backup-select")
    if (backupSelect) return backupSelect.value
  }

  return getBackupFromClimaInputs(roomId)
}

function getBackupFromClimaInputs(roomId) {
  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (roomContent) {
    const backupInput = roomContent.querySelector(`.clima-input[data-field="backup"]`)
    if (backupInput?.value) return backupInput.value
  }
  return "n"
}

function updateCapacityDisplay(roomId, cargaEstimada, solucao, solucaoComBackup, total, folga, backupType) {
  updateElementText(`carga-estimada-${roomId}`, cargaEstimada.toFixed(1))
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

function updateBackupConfiguration(selectElement) {
  const roomId = findRoomId(selectElement.closest(".capacity-calculation-table"))
  if (roomId) {
    const newBackupValue = selectElement.value
    syncBackupWithClimaInputs(roomId, newBackupValue)
    calculateCapacitySolution(roomId)
    
    // Salvar após alterar backup
    const roomContent = document.getElementById(`room-content-${roomId}`)
    if (roomContent) {
      const projectName = roomContent.getAttribute('data-project-name')
      const roomName = roomContent.getAttribute('data-room-name')
      if (projectName && roomName) {
        saveCapacityData(projectName, roomName)
      }
    }
  }
}

function handleClimaInputBackupChange(roomId, newBackupValue) {
  const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`)

  if (capacityTable) {
    const backupSelect = capacityTable.querySelector(".backup-select")
    if (backupSelect && backupSelect.value !== newBackupValue) {
      backupSelect.value = newBackupValue
      calculateCapacitySolution(roomId)
      
      // Salvar após alterar backup via inputs de clima
      const roomContent = document.getElementById(`room-content-${roomId}`)
      if (roomContent) {
        const projectName = roomContent.getAttribute('data-project-name')
        const roomName = roomContent.getAttribute('data-room-name')
        if (projectName && roomName) {
          saveCapacityData(projectName, roomName)
        }
      }
    }
  }
}

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

// modules/capacityCalculator.js
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