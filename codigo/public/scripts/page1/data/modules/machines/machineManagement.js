// modules/machineManagement.js
import { loadMachinesData } from './machinesBuilder.js'
import { updateElementText, removeEmptyMessage, showEmptyMessage } from './utilities.js'

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

// modules/machineManagement.js
export {
  addMachine,
  buildClimatizationMachineHTML,
  toggleMachineSection,
  updateMachineTitle,
  updateMachineOptions,
  calculateMachinePrice,
  deleteClimatizationMachine
}