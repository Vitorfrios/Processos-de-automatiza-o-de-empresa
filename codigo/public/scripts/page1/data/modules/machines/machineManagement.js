// modules/machineManagement.js
import { loadMachinesData } from './machinesBuilder.js'
import { updateElementText, removeEmptyMessage, showEmptyMessage } from './utilities.js'

/**
 * Adiciona uma nova máquina de climatização à sala especificada
 * Carrega dados das máquinas e constrói a interface HTML
 * @param {string} roomId - ID da sala onde a máquina será adicionada
 */
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

/**
 * Constrói o HTML completo para uma máquina de climatização
 * Inclui cabeçalho, formulário de configuração e seção de opções
 * @param {number} machineCount - Número sequencial da máquina
 * @param {Array} machines - Lista de máquinas disponíveis
 * @returns {string} HTML da máquina de climatização
 */
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

/**
 * Constrói um grupo de formulário com label e conteúdo
 * @param {string} label - Texto do label
 * @param {string} content - Conteúdo HTML do campo
 * @returns {string} HTML do grupo de formulário
 */
function buildFormGroup(label, content) {
  return `
    <div class="form-group">
      <label>${label}</label>
      ${content}
    </div>
  `
}

/**
 * Constrói um elemento select com opções e handlers
 * @param {Array} options - Lista de opções do select
 * @param {number} machineIndex - Índice da máquina
 * @param {string} className - Classe CSS do select
 * @param {string} onchangeHandler - Função a ser executada onchange
 * @returns {string} HTML do elemento select
 */
function buildSelect(options, machineIndex, className, onchangeHandler) {
  return `
    <select class="form-input ${className}" 
            data-machine-index="${machineIndex}"
            onchange="${onchangeHandler}">
      ${options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")}
    </select>
  `
}

/**
 * Constrói a interface de opções adicionais da máquina
 * @param {Array} options - Lista de opções disponíveis
 * @param {number} machineCount - Número da máquina
 * @returns {string} HTML das opções
 */
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

/**
 * Alterna a exibição da seção da máquina (expandir/recolher)
 * @param {HTMLButtonElement} button - Botão que acionou a função
 */
function toggleMachineSection(button) {
  const machineContent = button.closest(".climatization-machine").querySelector(".machine-content")
  const isCollapsed = machineContent.classList.toggle("collapsed")
  button.textContent = isCollapsed ? "+" : "−"
}

/**
 * Atualiza o título da máquina quando editado pelo usuário
 * @param {HTMLInputElement} input - Campo de input do título
 * @param {number} machineIndex - Índice da máquina
 */
function updateMachineTitle(input, machineIndex) {
  const newTitle = input.value.trim()
  if (!newTitle) {
    input.value = `Equipamento de Climatização ${machineIndex}`
  }
}

/**
 * Atualiza as opções da máquina quando o tipo é alterado
 * Carrega novos dados de potência, tensão e opções
 * @param {HTMLSelectElement} selectElement - Select do tipo de máquina
 */
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

/**
 * Atualiza as opções de um elemento select
 * @param {string} selector - Seletor do elemento select
 * @param {Array} options - Novas opções a serem adicionadas
 */
function updateSelect(selector, options) {
  const select = document.querySelector(selector)
  if (select) {
    select.innerHTML = options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")
  }
}

/**
 * Calcula o preço total da máquina considerando preço base e opções selecionadas
 * @param {number} machineIndex - Índice da máquina a ser calculada
 */
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

/**
 * Remove uma máquina de climatização após confirmação do usuário
 * @param {HTMLButtonElement} button - Botão de remover que acionou a função
 */
function deleteClimatizationMachine(button) {
  if (!confirm("Deseja remover este equipamento de climatização?")) return

  const machineItem = button.closest(".climatization-machine")
  const machinesContainer = machineItem.closest(".machines-container")

  machineItem.remove()
  showEmptyMessage(machinesContainer, "Nenhuma máquina adicionada ainda.")
}

// Exportação das funções do módulo de gerenciamento de máquinas
export {
  addMachine,
  buildClimatizationMachineHTML,
  toggleMachineSection,
  updateMachineTitle,
  updateMachineOptions,
  calculateMachinePrice,
  deleteClimatizationMachine
}