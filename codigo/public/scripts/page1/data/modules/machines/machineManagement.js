import { loadMachinesData } from './machinesBuilder.js'
import { updateElementText, removeEmptyMessage, showEmptyMessage } from './utilities.js'

/**
 * Adiciona uma nova máquina de climatização à sala especificada
 * Carrega dados das máquinas e constrói a interface HTML
 * @param {string} roomId - ID da sala onde a máquina será adicionada
 */
async function addMachine(roomId) {
    const machinesContainer = document.getElementById(`machines-${roomId}`);
    const machineCount = machinesContainer.querySelectorAll(".climatization-machine").length + 1;

    removeEmptyMessage(machinesContainer);

    console.log(`➕ Adicionando máquina ${machineCount} à sala ${roomId}`);

    try {
         if (!window.machinesData || window.machinesData.length === 0) {
            console.log("🔄 Cache não encontrado, carregando dados das máquinas...");
            await loadMachinesData();
        }

        if (!window.machinesData || window.machinesData.length === 0) {
            throw new Error("Nenhum dado de máquina disponível após carregamento");
        }

        const machineHTML = buildClimatizationMachineHTML(machineCount, window.machinesData);
        machinesContainer.insertAdjacentHTML("beforeend", machineHTML);
        
        console.log(`✅ Máquina ${machineCount} adicionada à sala ${roomId}`);

    } catch (error) {
        console.error("❌ Erro ao adicionar máquina:", error);

        const fallbackHTML = buildFallbackMachineHTML(machineCount);
        machinesContainer.insertAdjacentHTML("beforeend", fallbackHTML);
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
    const machineTypes = machines.map((m) => m.type);

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
                        buildSelectWithDefault(machineTypes, machineCount, "machine-type-select", "updateMachineOptions(this)", "Selecionar Máquina"),
                    )}
                    ${buildFormGroup(
                        "Potência (TR):",
                        buildSelectWithDefault([], machineCount, "machine-power-select", `calculateMachinePrice(${machineCount})`, "Selecionar TR", true),
                    )}
                    ${buildFormGroup(
                        "Tensão:",
                        buildSelectWithDefault([], machineCount, "machine-voltage-select", `calculateMachinePrice(${machineCount})`, "Selecionar Tensão", true),
                    )}
                    <div class="form-group">
                        <label>Preço Base:</label>
                        <div class="price-display" id="base-price-${machineCount}">
                            R$ 0,00
                        </div>
                    </div>
                </div>
                <div class="machine-options-section">
                    <h6>Opções Adicionais:</h6>
                    <div class="options-grid" id="options-container-${machineCount}">
                        <p class="empty-options-message">Selecione um tipo de máquina para ver as opções</p>
                    </div>
                </div>
                <div class="machine-total-price">
                    <strong>Preço Total: <span id="total-price-${machineCount}">R$ 0,00</span></strong>
                </div>
            </div>
        </div>
    `;
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
 * @param {string} defaultText - Texto padrão para opção vazia
 * @param {boolean} disabled - Se o select deve iniciar desabilitado
 * @returns {string} HTML do elemento select
 */
function buildSelectWithDefault(options, machineIndex, className, onchangeHandler, defaultText = "Selecionar", disabled = false) {
  const disabledAttr = disabled ? 'disabled' : ''
  return `
    <select class="form-input ${className}" 
            data-machine-index="${machineIndex}"
            onchange="${onchangeHandler}"
            ${disabledAttr}>
      <option value="">${defaultText}</option>
      ${options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")}
    </select>
  `
}

/**
 * Constrói a interface de opções adicionais da máquina
 * @param {Array} options - Lista de opções disponíveis
 * @param {number} machineCount - Número da máquina
 * @param {Array} selectedOptions - Opções pré-selecionadas
 * @returns {string} HTML das opções
 */
function buildOptionsHTML(options, machineCount, selectedOptions = []) {
  if (!options || options.length === 0) {
    return '<p class="empty-options-message">Nenhuma opção disponível para esta máquina</p>'
  }

  return options
    .map((option) => {
      const isSelected = selectedOptions.some(selected => selected.id === option.id);
      const selectedClass = isSelected ? 'option-selected' : '';

      return `
        <div class="option-item ${selectedClass}" onclick="handleOptionClick(${machineCount}, ${option.id})">
          <div class="option-checkbox">
            <input type="checkbox" 
                  value="${option.value}" 
                  data-option-id="${option.id}"
                  onchange="updateOptionSelection(${machineCount}, ${option.id})"
                  id="option-${machineCount}-${option.id}"
                  ${isSelected ? 'checked' : ''}>
            <div class="option-content">
              <div class="option-name">${option.name}</div>
              <div class="option-price">+R$ ${option.value.toLocaleString("pt-BR")}</div>
            </div>
          
          
          </div>
        </div>
      `;
    })
    .join("")
}

/**
 * Manipula o clique na opção
 * @param {number} machineIndex - Índice da máquina
 * @param {number} optionId - ID da opção
 */
function handleOptionClick(machineIndex, optionId) {
  const checkbox = document.getElementById(`option-${machineIndex}-${optionId}`)
  if (checkbox) {
    checkbox.checked = !checkbox.checked
    updateOptionSelection(machineIndex, optionId)
    calculateMachinePrice(machineIndex)
  }
}

/**
 * Atualiza a aparência visual da opção quando selecionada/deselecionada
 * @param {number} machineIndex - Índice da máquina
 * @param {number} optionId - ID da opção
 */
function updateOptionSelection(machineIndex, optionId) {
  const optionItem = document.querySelector(`#option-${machineIndex}-${optionId}`).closest('.option-item')
  const checkbox = document.getElementById(`option-${machineIndex}-${optionId}`)

  if (optionItem && checkbox) {
    if (checkbox.checked) {
      optionItem.classList.add('option-selected')
    } else {
      optionItem.classList.remove('option-selected')
    }
  }
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
    const machineIndex = selectElement.getAttribute("data-machine-index");
    const selectedType = selectElement.value;

    console.log(`🔄 Atualizando opções para máquina ${machineIndex}, tipo: ${selectedType}`);

    if (!selectedType) {
        resetMachineFields(machineIndex);
        return;
    }

    try {
         if (window.machinesData && window.machinesData.length > 0) {
            const selectedMachine = window.machinesData.find((m) => m.type === selectedType);
            if (selectedMachine) {
                updateMachineUI(machineIndex, selectedMachine);
                return;
            }
        }


        console.log("🚀 Carregamento rápido de dados das máquinas...");
        const response = await fetch('/machines');
        if (response.ok) {
            const data = await response.json();
            const machines = Array.isArray(data) ? data : data.machines;
            window.machinesData = machines;
            
            const selectedMachine = machines.find((m) => m.type === selectedType);
            if (selectedMachine) {
                updateMachineUI(machineIndex, selectedMachine);
            } else {
                console.error("❌ Máquina não encontrada após carregamento:", selectedType);
                resetMachineFields(machineIndex);
            }
        } else {
            throw new Error('Falha no fetch');
        }

    } catch (error) {
        console.error("❌ Erro crítico ao atualizar opções:", error);

        createFallbackOptions(machineIndex);
    }
}

/**
 * Atualiza a UI da máquina rapidamente
 */
function updateMachineUI(machineIndex, selectedMachine) {
    // Potências
    const potencies = Object.keys(selectedMachine.baseValues || {});
    updateSelect(`.machine-power-select[data-machine-index="${machineIndex}"]`, potencies, "Selecionar TR", false);

    // Tensões
    const voltageNames = (selectedMachine.voltages || []).map(v => v.name);
    updateSelect(`.machine-voltage-select[data-machine-index="${machineIndex}"]`, voltageNames, "Selecionar Tensão", false);

    // Opções
    const optionsContainer = document.getElementById(`options-container-${machineIndex}`);
    if (optionsContainer) {
        optionsContainer.innerHTML = buildOptionsHTML(selectedMachine.options || [], machineIndex);
    }

    updateElementText(`base-price-${machineIndex}`, `R$ 0,00`);
    updateElementText(`total-price-${machineIndex}`, `R$ 0,00`);

    console.log(`✅ Opções atualizadas para máquina ${machineIndex}`);
}

/**
 * Fallback para quando não consegue carregar opções
 */
function createFallbackOptions(machineIndex) {
    const optionsContainer = document.getElementById(`options-container-${machineIndex}`);
    if (optionsContainer) {
        optionsContainer.innerHTML = `
            <div class="option-item" onclick="handleOptionClick(${machineIndex}, 1)">
                <div class="option-checkbox"></div>
                <div class="option-content">
                    <div class="option-name">Opção Básica 1</div>
                    <div class="option-price">+R$ 100</div>
                </div>
                <input type="checkbox" value="100" data-option-id="1" onchange="updateOptionSelection(${machineIndex}, 1)">
            </div>
            <div class="option-item" onclick="handleOptionClick(${machineIndex}, 2)">
                <div class="option-checkbox"></div>
                <div class="option-content">
                    <div class="option-name">Opção Básica 2</div>
                    <div class="option-price">+R$ 200</div>
                </div>
                <input type="checkbox" value="200" data-option-id="2" onchange="updateOptionSelection(${machineIndex}, 2)">
            </div>
        `;
    }
}


/**
 * Reseta os campos da máquina para o estado inicial
 * @param {number} machineIndex - Índice da máquina
 */
function resetMachineFields(machineIndex) {
  updateSelect(`.machine-power-select[data-machine-index="${machineIndex}"]`, [], "Selecionar TR", true)
  updateSelect(`.machine-voltage-select[data-machine-index="${machineIndex}"]`, [], "Selecionar Tensão", true)

  const optionsContainer = document.getElementById(`options-container-${machineIndex}`)
  if (optionsContainer) {
    optionsContainer.innerHTML = '<p class="empty-options-message">Selecione um tipo de máquina para ver as opções</p>'
  }

  updateElementText(`base-price-${machineIndex}`, `R$ 0,00`)
  updateElementText(`total-price-${machineIndex}`, `R$ 0,00`)
}

/**
 * Atualiza as opções de um elemento select
 * @param {string} selector - Seletor do elemento select
 * @param {Array} options - Novas opções a serem adicionadas
 * @param {string} defaultText - Texto da opção padrão
 * @param {boolean} disabled - Se deve desabilitar o select
 */
function updateSelect(selector, options, defaultText = "Selecionar", disabled = false) {
  const select = document.querySelector(selector)
  if (select) {
    const disabledAttr = disabled ? 'disabled' : ''
    select.innerHTML = `
      <option value="">${defaultText}</option>
      ${options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")}
    `
    select.disabled = disabled
  }
}

/**
 * Calcula o preço total da máquina considerando preço base e opções selecionadas
 * @param {number} machineIndex - Índice da máquina a ser calculada
 */
function calculateMachinePrice(machineIndex) {
  try {
    const machineElement = document.querySelector(`[data-machine-index="${machineIndex}"]`)
    if (!machineElement) return

    // Obter tipo, potência e tensão selecionados
    const typeSelect = machineElement.querySelector('.machine-type-select')
    const powerSelect = machineElement.querySelector('.machine-power-select')
    const voltageSelect = machineElement.querySelector('.machine-voltage-select')

    const selectedType = typeSelect?.value
    const selectedPower = powerSelect?.value
    const selectedVoltage = voltageSelect?.value

    let basePrice = 0
    let voltageValue = 0

    // Calcular preço base apenas se tipo e potência estiverem selecionados
    if (selectedType && selectedPower && window.machinesData) {
      const machine = window.machinesData.find(m => m.type === selectedType)
      if (machine && machine.baseValues) {
        basePrice = machine.baseValues[selectedPower] || 0
      }
    }

    // Calcular valor da tensão apenas se tensão estiver selecionada
    if (selectedType && selectedVoltage && window.machinesData) {
      const machine = window.machinesData.find(m => m.type === selectedType)
      if (machine && machine.voltages) {
        const voltageObj = machine.voltages.find(v => v.name === selectedVoltage)
        voltageValue = voltageObj ? voltageObj.value : 0
      }
    }

    // Atualizar display do preço base
    updateElementText(`base-price-${machineIndex}`, `R$ ${basePrice.toLocaleString("pt-BR")}`)

    // Calcular total das opções
    const optionsContainer = document.getElementById(`options-container-${machineIndex}`)
    let optionsTotal = 0

    if (optionsContainer) {
      const selectedOptions = optionsContainer.querySelectorAll('input[type="checkbox"]:checked')
      selectedOptions.forEach((option) => {
        optionsTotal += Number.parseFloat(option.value) || 0
      })
    }

    // Calcular preço total
    const totalPrice = basePrice + optionsTotal + voltageValue

    // Atualizar display do preço total
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

  // Mostrar mensagem de vazio se não houver máquinas
  if (machinesContainer && machinesContainer.querySelectorAll('.climatization-machine').length === 0) {
    showEmptyMessage(machinesContainer, "Nenhuma máquina adicionada ainda.")
  }
}

// Exportação e disponibilização global
if (typeof window !== 'undefined') {
    window.addMachine = addMachine;
    window.toggleMachineSection = toggleMachineSection;
    window.updateMachineTitle = updateMachineTitle;
    window.updateMachineOptions = updateMachineOptions;
    window.calculateMachinePrice = calculateMachinePrice;
    window.deleteClimatizationMachine = deleteClimatizationMachine;
    window.handleOptionClick = handleOptionClick;
    window.updateOptionSelection = updateOptionSelection;
}

export {
    addMachine,
    buildClimatizationMachineHTML,
    toggleMachineSection,
    updateMachineTitle,
    updateMachineOptions,
    calculateMachinePrice,
    deleteClimatizationMachine,
    handleOptionClick,
    updateOptionSelection
}