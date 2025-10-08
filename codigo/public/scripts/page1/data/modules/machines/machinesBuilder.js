import { API_CONFIG } from '../../../config/config.js'   
import { buildCapacityCalculationTable } from './capacityCalculator.js'
import { buildClimatizationMachineHTML } from './machineManagement.js'
import { removeEmptyMessage, showEmptyMessage } from './utilities.js'

let machinesData = null

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

async function loadSavedMachines(roomId, savedMachines) {
  const machinesContainer = document.getElementById(`machines-${roomId}`)
  const roomContent = document.getElementById(`room-content-${roomId}`)
  
  // Carregar dados de capacidade primeiro
  if (roomContent) {
    const projectName = roomContent.getAttribute('data-project-name')
    const roomName = roomContent.getAttribute('data-room-name')
    if (projectName && roomName) {
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

function buildFormGroup(label, content) {
  return `
    <div class="form-group">
      <label>${label}</label>
      ${content}
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

function updateCapacityFromThermalGains(roomId) {
  calculateCapacitySolution(roomId)
}

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

// modules/machinesBuilder.js
export {
  buildMachinesSection,
  loadMachinesData,
  loadSavedMachines,
  updateCapacityFromThermalGains,
  initializeCapacityCalculations,
  refreshAllCapacityCalculations
}