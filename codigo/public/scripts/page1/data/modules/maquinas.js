
import { API_CONFIG } from '../../config/config.js'

const capacityConfig = {
  maxInitAttempts: 3,
  initDelay: 500,
  fallbackFatorSeguranca: 10,
}

const capacityState = new Map()
let machinesData = null

// ========== UTILITY FUNCTIONS ==========

function updateElementText(elementId, value) {
  const element = document.getElementById(elementId)
  if (element) element.textContent = value
}

function removeEmptyMessage(container, selector = ".empty-message") {
  const message = container.querySelector(selector)
  if (message) message.remove()
}

function showEmptyMessage(container, message) {
  if (container.children.length === 0) {
    container.innerHTML = `<p class="empty-message">${message}</p>`
  }
}

function findRoomId(element, prefix = "room-content-") {
  const roomContent = element.closest(`[id^="${prefix}"]`)
  return roomContent ? roomContent.id.replace(prefix, "") : null
}

// ========== MAIN SECTION BUILDER ==========

function buildMachinesSection(projectName, roomName) {
  const roomId = `${projectName}-${roomName}`

  return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}-maquinas')">+</button>
        <h4 class="section-title">Máquinas</h4>
        <button class="btn btn-add-small" onclick="addMachine('${roomId}')">+ Adicionar Máquina</button>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}-maquinas">
        ${buildCapacityCalculationTable(roomId)}
        <div class="machines-container" id="machines-${roomId}">
          <p class="empty-message">Nenhuma máquina adicionada ainda.</p>
        </div>
      </div>
    </div>
  `
}

// ========== CAPACITY CALCULATION TABLE ==========

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

function getBackupFromClimaInputs(roomId) {
  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (roomContent) {
    const backupInput = roomContent.querySelector(`.clima-input[data-field="backup"]`)
    if (backupInput?.value) return backupInput.value
  }
  return "n"
}

// ========== MACHINES DATA LOADING ==========

async function loadMachinesData() {
  if (machinesData) return machinesData

  try {
    const response = await fetch(`${API_CONFIG.data}/machines`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    machinesData = { machines: Array.isArray(data) ? data : data.machines }

    return machinesData
  } catch (error) {
    console.error("Erro ao carregar dados das máquinas:", error)
    throw error
  }
}

// ========== MACHINE MANAGEMENT ==========

async function addMachine(roomId) {
  const machinesContainer = document.getElementById(`machines-${roomId}`)
  const machineCount = machinesContainer.querySelectorAll(".climatization-machine").length + 1

  removeEmptyMessage(machinesContainer)

  try {
    const data = await loadMachinesData()

    if (!data?.machines?.length) {
      throw new Error("Nenhum dado de máquina disponível")
    }

    const machineHTML = buildClimatizationMachineHTML(machineCount, data.machines)
    machinesContainer.insertAdjacentHTML("beforeend", machineHTML)
  } catch (error) {
    console.error("Erro ao adicionar máquina:", error)
    alert(`Erro ao carregar dados: ${error.message}`)
  }
}

function buildClimatizationMachineHTML(machineCount, machines) {
  const machineTypes = machines.map((m) => m.type)
  const firstMachine = machines[0]

  return `
    <div class="climatization-machine" data-machine-index="${machineCount}">
      <div class="machine-header">
        <button class="minimizer" onclick="toggleMachineSection(this)">−</button>
        
        <input type="text" 
               class="machine-title-editable" 
               value="Equipamento de Climatização ${machineCount}"
               onchange="updateMachineTitle(this, ${machineCount})"
               onclick="this.select()">
               
        <button class="btn btn-delete-small" onclick="deleteClimatizationMachine(this)">Remover</button>
      </div>
      
      <div class="machine-content" id="machine-content-${machineCount}">
        <div class="climatization-form-grid">
          ${buildFormGroup(
            "Tipo de Equipamento:",
            buildSelect(machineTypes, machineCount, "machine-type-select", "updateMachineOptions(this)"),
          )}
          ${buildFormGroup(
            "Potência (TR):",
            buildSelect(
              firstMachine.potencies,
              machineCount,
              "machine-potency-select",
              `calculateMachinePrice(${machineCount})`,
            ),
          )}
          ${buildFormGroup(
            "Tensão:",
            buildSelect(
              firstMachine.voltages,
              machineCount,
              "machine-voltage-select",
              `calculateMachinePrice(${machineCount})`,
            ),
          )}
          <div class="form-group">
            <label>Preço Base:</label>
            <div class="price-display" id="base-price-${machineCount}">
              R$ ${firstMachine.baseValue.toLocaleString("pt-BR")}
            </div>
          </div>
        </div>

        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineCount}">
            ${buildOptionsHTML(firstMachine.options, machineCount)}
          </div>
        </div>

        <div class="machine-total-price">
          <strong>Preço Total: <span id="total-price-${machineCount}">R$ ${firstMachine.baseValue.toLocaleString("pt-BR")}</span></strong>
        </div>
      </div>
    </div>
  `
}

function buildFormGroup(label, content) {
  return `
    <div class="form-group">
      <label>${label}</label>
      ${content}
    </div>
  `
}

function buildSelect(options, machineIndex, className, onchangeHandler) {
  return `
    <select class="form-input ${className}" 
            data-machine-index="${machineIndex}"
            onchange="${onchangeHandler}">
      ${options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")}
    </select>
  `
}

function buildOptionsHTML(options, machineCount) {
  return options
    .map(
      (option) => `
    <div class="option-checkbox">
      <input type="checkbox" 
             value="${option.value}" 
             data-option-id="${option.id}"
             onchange="calculateMachinePrice(${machineCount})"
             id="option-${machineCount}-${option.id}">
      <label for="option-${machineCount}-${option.id}">
        <div class="option-text-wrapper">
          <div class="option-name">${option.name}</div>
          <div class="option-price">+R$ ${option.value.toLocaleString("pt-BR")}</div>
        </div>
      </label>
    </div>
  `,
    )
    .join("")
}

function toggleMachineSection(button) {
  const machineContent = button.closest(".climatization-machine").querySelector(".machine-content")
  const isCollapsed = machineContent.classList.toggle("collapsed")
  button.textContent = isCollapsed ? "+" : "−"
}

function updateMachineTitle(input, machineIndex) {
  const newTitle = input.value.trim()
  if (!newTitle) {
    input.value = `Equipamento de Climatização ${machineIndex}`
  }
}

// ========== DYNAMIC OPTIONS UPDATE ==========

async function updateMachineOptions(selectElement) {
  const machineIndex = selectElement.getAttribute("data-machine-index")
  const selectedType = selectElement.value

  try {
    const data = await loadMachinesData()
    const selectedMachine = data.machines.find((m) => m.type === selectedType)

    if (!selectedMachine) {
      console.error("Máquina não encontrada:", selectedType)
      return
    }

    updateSelect(`.machine-potency-select[data-machine-index="${machineIndex}"]`, selectedMachine.potencies)
    updateSelect(`.machine-voltage-select[data-machine-index="${machineIndex}"]`, selectedMachine.voltages)
    updateElementText(`base-price-${machineIndex}`, `R$ ${selectedMachine.baseValue.toLocaleString("pt-BR")}`)

    const optionsContainer = document.getElementById(`options-container-${machineIndex}`)
    if (optionsContainer) {
      optionsContainer.innerHTML = buildOptionsHTML(selectedMachine.options, machineIndex)
    }

    calculateMachinePrice(machineIndex)
  } catch (error) {
    console.error("Erro ao atualizar opções da máquina:", error)
  }
}

function updateSelect(selector, options) {
  const select = document.querySelector(selector)
  if (select) {
    select.innerHTML = options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")
  }
}

// ========== PRICE CALCULATION ==========

function calculateMachinePrice(machineIndex) {
  try {
    const basePriceElement = document.getElementById(`base-price-${machineIndex}`)
    if (!basePriceElement) return

    const basePriceText = basePriceElement.textContent.replace("R$ ", "").replace(/\./g, "").replace(",", ".")
    const basePrice = Number.parseFloat(basePriceText) || 0

    const optionsContainer = document.getElementById(`options-container-${machineIndex}`)
    let optionsTotal = 0

    if (optionsContainer) {
      const selectedOptions = optionsContainer.querySelectorAll('input[type="checkbox"]:checked')
      selectedOptions.forEach((option) => {
        optionsTotal += Number.parseFloat(option.value) || 0
      })
    }

    const totalPrice = basePrice + optionsTotal
    updateElementText(`total-price-${machineIndex}`, `R$ ${totalPrice.toLocaleString("pt-BR")}`)
  } catch (error) {
    console.error("Erro ao calcular preço:", error)
  }
}

function deleteClimatizationMachine(button) {
  if (!confirm("Deseja remover este equipamento de climatização?")) return

  const machineItem = button.closest(".climatization-machine")
  const machinesContainer = machineItem.closest(".machines-container")

  machineItem.remove()
  showEmptyMessage(machinesContainer, "Nenhuma máquina adicionada ainda.")
}

// ========== CAPACITY CALCULATION SYSTEM ==========

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

// ========== EVENT LISTENER PARA FATOR DE SEGURANÇA ==========
function initializeFatorSegurancaListeners() {
  document.addEventListener('change', (event) => {
    if (event.target.id && event.target.id.startsWith('fator-seguranca-')) {
      const roomId = event.target.id.replace('fator-seguranca-', '')
      calculateCapacitySolution(roomId)
    }
  })
}
// ========== CAPACITY DATA MANAGEMENT ==========


// ========== CAPACITY DATA MANAGEMENT ==========

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

    // Buscar dados atuais do projeto do seu servidor JSON
    fetch(`${API_CONFIG.projects}/projetos`)  // ← CORREÇÃO: usar API_CONFIG.projects
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
      .then(projetos => {
        // Encontrar o projeto específico
        const projetoIndex = projetos.findIndex(p => p.nome === projectName)
        if (projetoIndex === -1) {
          console.warn(`[CAPACITY] Projeto ${projectName} não encontrado`)
          return
        }

        // Encontrar a sala específica
        const salaIndex = projetos[projetoIndex].salas.findIndex(sala => sala.nome === roomName)
        if (salaIndex === -1) {
          console.warn(`[CAPACITY] Sala ${roomName} não encontrada no projeto ${projectName}`)
          return
        }

        // Salvar dados de capacidade no campo correto
        if (!projetos[projetoIndex].salas[salaIndex]['Cálculo_Capacidade_Refrigeração']) {
          projetos[projetoIndex].salas[salaIndex]['Cálculo_Capacidade_Refrigeração'] = {}
        }
        
        projetos[projetoIndex].salas[salaIndex]['Cálculo_Capacidade_Refrigeração'] = capacityData
        
        // Atualizar no servidor JSON
        return fetch(`${API_CONFIG.projects}/projetos`, {  // ← CORREÇÃO: usar API_CONFIG.projects
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

function updateCapacityFromThermalGains(roomId) {
  calculateCapacitySolution(roomId)
}

// ========== BACKUP CONFIGURATION ==========


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

// ========== LOAD SAVED MACHINES ==========

async function loadSavedMachines(roomId, savedMachines) {
  const machinesContainer = document.getElementById(`machines-${roomId}`)

  // PRIMEIRO CARREGAR DADOS DE CAPACIDADE
  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (roomContent) {
    const projectName = roomContent.getAttribute('data-project-name')
    const roomName = roomContent.getAttribute('data-room-name')
    if (projectName && roomName) {
      // Carregar dados de capacidade do JSON
      loadCapacityData(projectName, roomName)
    }
  }

  if (!savedMachines?.length) {
    return
  }

  removeEmptyMessage(machinesContainer)

  try {
    const machinesData = await loadMachinesData()

    savedMachines.forEach((savedMachine, index) => {
      const machineHTML = buildClimatizationMachineFromSavedData(index + 1, savedMachine, machinesData.machines)
      machinesContainer.insertAdjacentHTML("beforeend", machineHTML)
    })
  } catch (error) {
    console.error("Erro ao carregar máquinas salvas:", error)
  }
}

function buildClimatizationMachineFromSavedData(machineCount, savedMachine, allMachines) {
  const machineType = allMachines.find((m) => m.type === savedMachine.tipo)

  if (!machineType) {
    return buildFallbackMachineFromSavedData(machineCount, savedMachine)
  }

  return `
    <div class="climatization-machine" data-machine-index="${machineCount}">
      <div class="machine-header">
        <button class="minimizer" onclick="toggleMachineSection(this)">−</button>
        
        <input type="text" 
               class="machine-title-editable" 
               value="${savedMachine.nome || `Equipamento de Climatização ${machineCount}`}"
               onchange="updateMachineTitle(this, ${machineCount})"
               onclick="this.select()">
               
        <button class="btn btn-delete-small" onclick="deleteClimatizationMachine(this)">Remover</button>
      </div>
      
      <div class="machine-content" id="machine-content-${machineCount}">
        <div class="climatization-form-grid">
          ${buildFormGroup(
            "Tipo de Equipamento:",
            buildSelectWithSelected(
              allMachines.map((m) => m.type),
              machineCount,
              "machine-type-select",
              "updateMachineOptions(this)",
              savedMachine.tipo,
            ),
          )}
          ${buildFormGroup(
            "Potência (TR):",
            buildSelectWithSelected(
              machineType.potencies,
              machineCount,
              "machine-potency-select",
              `calculateMachinePrice(${machineCount})`,
              savedMachine.potencia,
            ),
          )}
          ${buildFormGroup(
            "Tensão:",
            buildSelectWithSelected(
              machineType.voltages,
              machineCount,
              "machine-voltage-select",
              `calculateMachinePrice(${machineCount})`,
              savedMachine.tensao,
            ),
          )}
          <div class="form-group">
            <label>Preço Base:</label>
            <div class="price-display" id="base-price-${machineCount}">
              R$ ${savedMachine.precoBase.toLocaleString("pt-BR")}
            </div>
          </div>
        </div>

        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineCount}">
            ${buildSavedOptionsHTML(machineType.options, machineCount, savedMachine.opcoesSelecionadas)}
          </div>
        </div>

        <div class="machine-total-price">
          <strong>Preço Total: <span id="total-price-${machineCount}">R$ ${savedMachine.precoTotal.toLocaleString("pt-BR")}</span></strong>
        </div>
      </div>
    </div>
  `
}

function buildSelectWithSelected(options, machineIndex, className, onchangeHandler, selectedValue) {
  return `
    <select class="form-input ${className}" 
            data-machine-index="${machineIndex}"
            onchange="${onchangeHandler}">
      ${options
        .map((opt) => `<option value="${opt}" ${opt === selectedValue ? "selected" : ""}>${opt}</option>`)
        .join("")}
    </select>
  `
}

function buildSavedOptionsHTML(options, machineCount, selectedOptions = []) {
  return options
    .map((option) => {
      const isChecked = selectedOptions.some((selected) => selected.id === option.id)
      return `
      <div class="option-checkbox">
        <input type="checkbox" 
               value="${option.value}" 
               data-option-id="${option.id}"
               onchange="calculateMachinePrice(${machineCount})"
               id="option-${machineCount}-${option.id}"
               ${isChecked ? "checked" : ""}>
        <label for="option-${machineCount}-${option.id}">
          <div class="option-text-wrapper">
            <div class="option-name">${option.name}</div>
            <div class="option-price">+R$ ${option.value.toLocaleString("pt-BR")}</div>
          </div>
        </label>
      </div>
    `
    })
    .join("")
}

function buildFallbackMachineFromSavedData(machineCount, savedMachine) {
  return `
    <div class="climatization-machine" data-machine-index="${machineCount}">
      <div class="machine-header">
        <button class="minimizer" onclick="toggleMachineSection(this)">−</button>
        <input type="text" class="machine-title-editable" 
               value="${savedMachine.nome || `Equipamento de Climatização ${machineCount}`}"
               onchange="updateMachineTitle(this, ${machineCount})" onclick="this.select()">
        <button class="btn btn-delete-small" onclick="deleteClimatizationMachine(this)">Remover</button>
      </div>
      
      <div class="machine-content" id="machine-content-${machineCount}">
        <div style="padding: 1rem; background: #fff3cd; border-radius: 4px; margin: 1rem;">
          <strong>Aviso:</strong> Tipo de máquina "${savedMachine.tipo}" não encontrado nos dados atuais.
        </div>
        
        <div class="climatization-form-grid">
          ${buildFormGroup("Tipo de Equipamento:", `<select class="form-input machine-type-select" disabled><option>${savedMachine.tipo} (não disponível)</option></select>`)}
          ${buildFormGroup("Potência (TR):", `<div class="form-input">${savedMachine.potencia}</div>`)}
          ${buildFormGroup("Tensão:", `<div class="form-input">${savedMachine.tensao}</div>`)}
          <div class="form-group">
            <label>Preço Base:</label>
            <div class="price-display">R$ ${savedMachine.precoBase.toLocaleString("pt-BR")}</div>
          </div>
        </div>

        <div class="machine-total-price">
          <strong>Preço Total: <span>R$ ${savedMachine.precoTotal.toLocaleString("pt-BR")}</span></strong>
        </div>
      </div>
    </div>
  `
}

// ========== INITIALIZATION ==========

function initializeCapacityCalculations() {
  const attempts = [100, 500, 1000, 2000]

  attempts.forEach((delay) => {
    setTimeout(() => {
      document.querySelectorAll(".room-block").forEach((roomBlock) => {
        const roomId = roomBlock.id.replace("room-content-", "")
        const capacityTable = roomBlock.querySelector(".capacity-calculation-table")

        if (capacityTable) {
          const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`)
          const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`)

          if (fatorSegurancaInput && capacidadeUnitariaSelect) {
            calculateCapacitySolution(roomId)
          }
        }
      })
    }, delay)
  })
}

function refreshAllCapacityCalculations() {
  document.querySelectorAll(".room-block").forEach((roomBlock) => {
    const roomId = roomBlock.id.replace("room-content-", "")
    calculateCapacitySolution(roomId)
  })
}

function initializeBackupSync() {
  const intervals = [1000, 3000, 5000, 7000, 10000]

  intervals.forEach((delay) => {
    setTimeout(() => {
      document.querySelectorAll(".room-block").forEach((roomBlock) => {
        const roomId = roomBlock.id.replace("room-content-", "")
        syncCapacityTableBackup(roomId)
      })
    }, delay)
  })
}

function initializeStaticCapacityTable() {
  const staticTable = document.querySelector(".capacity-calculation-table")
  if (staticTable) {
    scheduleCapacityInit("Projeto1-Sala1")
  }
}

function initializeClimaInputBackupListener() {
  document.addEventListener("change", (event) => {
    const target = event.target

    // Check if the changed element is a clima input backup field
    if (target.classList.contains("clima-input") && target.dataset.field === "backup") {
      const roomContent = target.closest('[id^="room-content-"]')
      if (roomContent) {
        const roomId = roomContent.id.replace("room-content-", "")
        const newBackupValue = target.value
        handleClimaInputBackupChange(roomId, newBackupValue)
      }
    }
  })
}

// ========== GLOBAL EXPORTS ==========

if (typeof window.systemConstants === "undefined") {
  window.systemConstants = { FATOR_SEGURANCA_CAPACIDADE: 10 }
}

Object.assign(window, {
  calculateMachinePrice,
  updateMachineOptions,
  deleteClimatizationMachine,
  toggleMachineSection,
  updateMachineTitle,
  addMachine,
  calculateCapacitySolution,
  updateCapacityFromThermalGains,
  initializeStaticCapacityTable,
  loadSavedMachines,
  updateBackupConfiguration,
  syncCapacityTableBackup,
  handleClimaInputBackupChange,
  saveCapacityData,
  loadCapacityData,
  getCapacityData,
  applyCapacityData
})

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(initializeCapacityCalculations, 1500)
  setTimeout(initializeBackupSync, 2000)
  initializeClimaInputBackupListener()
  initializeFatorSegurancaListeners()
})

export {
  buildMachinesSection,
  addMachine,
  calculateCapacitySolution,
  updateCapacityFromThermalGains,
  initializeStaticCapacityTable,
  calculateMachinePrice,
  updateMachineOptions,
  deleteClimatizationMachine,
  toggleMachineSection,
  updateMachineTitle,
  loadSavedMachines,
  initializeCapacityCalculations,
  refreshAllCapacityCalculations
};
