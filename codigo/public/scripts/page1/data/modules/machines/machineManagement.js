import { loadMachinesData } from './machinesBuilder.js'
import { updateElementText, removeEmptyMessage, showEmptyMessage } from './utilities.js'

// Contador global único para máquinas
let globalMachineCounter = 0;

/**
 * Gera um ID único para máquina
 */
function generateUniqueMachineId() {
    return `machine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Adiciona uma nova máquina de climatização à sala especificada
 * Carrega dados das máquinas e constrói a interface HTML
 * @param {string} roomId - ID da sala onde a máquina será adicionada
 */
async function addMachine(roomId) {
    const machinesContainer = document.getElementById(`machines-${roomId}`);
    const roomMachineCount = machinesContainer.querySelectorAll(".climatization-machine").length + 1;
    
    // Usar contador global único
    globalMachineCounter++;
    const uniqueMachineId = globalMachineCounter;

    removeEmptyMessage(machinesContainer);

    console.log(`➕ Adicionando máquina ${uniqueMachineId} (sala: ${roomId}, local: ${roomMachineCount})`);

    try {
         if (!window.machinesData || window.machinesData.length === 0) {
            console.log("🔄 Cache não encontrado, carregando dados das máquinas...");
            await loadMachinesData();
        }

        if (!window.machinesData || window.machinesData.length === 0) {
            throw new Error("Nenhum dado de máquina disponível após carregamento");
        }

        const machineHTML = buildClimatizationMachineHTML(uniqueMachineId, window.machinesData);
        machinesContainer.insertAdjacentHTML("beforeend", machineHTML);
        
        console.log(`✅ Máquina ${uniqueMachineId} adicionada à sala ${roomId}`);

    } catch (error) {
        console.error("❌ Erro ao adicionar máquina:", error);

        const fallbackHTML = buildFallbackMachineHTML(uniqueMachineId);
        machinesContainer.insertAdjacentHTML("beforeend", fallbackHTML);
    }
}

/**
 * Constrói o HTML completo para uma máquina de climatização
 * Inclui cabeçalho, formulário de configuração e seção de opções
 * @param {number} machineId - ID único da máquina
 * @param {Array} machines - Lista de máquinas disponíveis
 * @returns {string} HTML da máquina de climatização
 */
function buildClimatizationMachineHTML(machineId, machines) {
    const machineTypes = machines.map((m) => m.type);

    return `
        <div class="climatization-machine" data-machine-id="${machineId}">
            <div class="machine-header">
                <button class="minimizer" onclick="toggleMachineSection(this)">−</button>
                <input type="text" 
                       class="machine-title-editable" 
                       value="Equipamento de Climatização ${machineId}"
                       onchange="updateMachineTitle(this, ${machineId})"
                       onclick="this.select()">
                <button class="btn btn-delete-small" onclick="deleteClimatizationMachine(this)">Remover</button>
            </div>
            <div class="machine-content" id="machine-content-${machineId}">
                <div class="climatization-form-grid">
                    ${buildFormGroup(
                        "Tipo de Equipamento:",
                        buildSelectWithDefault(machineTypes, machineId, "machine-type-select", "updateMachineOptions(this)", "Selecionar Máquina"),
                    )}
                    ${buildFormGroup(
                        "Potência (TR):",
                        buildSelectWithDefault([], machineId, "machine-power-select", `calculateMachinePrice(${machineId})`, "Selecionar TR", true),
                    )}
                    ${buildFormGroup(
                        "Tensão:",
                        buildSelectWithDefault([], machineId, "machine-voltage-select", `calculateMachinePrice(${machineId})`, "Selecionar Tensão", true),
                    )}
                    <div class="form-group">
                        <label>Preço Base:</label>
                        <div class="price-display" id="base-price-${machineId}">
                            R$ 0,00
                        </div>
                    </div>
                </div>
                <div class="machine-options-section">
                    <h6>Opções Adicionais:</h6>
                    <div class="options-grid" id="options-container-${machineId}">
                        <p class="empty-options-message">Selecione um tipo de máquina para ver as opções</p>
                    </div>
                </div>
                <div class="machine-total-price">
                    <strong>Preço Total: <span id="total-price-${machineId}">R$ 0,00</span></strong>
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
 * @param {number} machineId - ID único da máquina
 * @param {string} className - Classe CSS do select
 * @param {string} onchangeHandler - Função a ser executada onchange
 * @param {string} defaultText - Texto padrão para opção vazia
 * @param {boolean} disabled - Se o select deve iniciar desabilitado
 * @returns {string} HTML do elemento select
 */
function buildSelectWithDefault(options, machineId, className, onchangeHandler, defaultText = "Selecionar", disabled = false) {
  const disabledAttr = disabled ? 'disabled' : ''
  return `
    <select class="form-input ${className}" 
            data-machine-id="${machineId}"
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
 * @param {number} machineId - ID único da máquina
 * @param {Array} selectedOptions - Opções pré-selecionadas
 * @returns {string} HTML das opções
 */
function buildOptionsHTML(options, machineId, selectedOptions = []) {
  if (!options || options.length === 0) {
    return '<p class="empty-options-message">Nenhuma opção disponível para esta máquina</p>'
  }

  return options
    .map((option) => {
      const isSelected = selectedOptions.some(selected => selected.id === option.id);
      const selectedClass = isSelected ? 'option-selected' : '';

      return `
        <div class="option-item ${selectedClass}" onclick="handleOptionClick(${machineId}, ${option.id})">
          <div class="option-checkbox">
            <input type="checkbox" 
                  value="${option.value}" 
                  data-option-id="${option.id}"
                  onchange="updateOptionSelection(${machineId}, ${option.id}); calculateMachinePrice(${machineId})"
                  id="option-${machineId}-${option.id}"
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
 * @param {number} machineId - ID único da máquina
 * @param {number} optionId - ID da opção
 */
function handleOptionClick(machineId, optionId) {
  const checkbox = document.getElementById(`option-${machineId}-${optionId}`)
  if (checkbox) {
    checkbox.checked = !checkbox.checked
    // Disparar o evento change manualmente para garantir que todos os handlers sejam executados
    const event = new Event('change', { bubbles: true })
    checkbox.dispatchEvent(event)
  }
}

/**
 * Atualiza a aparência visual da opção quando selecionada/deselecionada
 * @param {number} machineId - ID único da máquina
 * @param {number} optionId - ID da opção
 */
function updateOptionSelection(machineId, optionId) {
  const checkbox = document.getElementById(`option-${machineId}-${optionId}`)
  const optionItem = checkbox?.closest('.option-item')
  
  if (optionItem) {
    if (checkbox.checked) {
      optionItem.classList.add('option-selected')
    } else {
      optionItem.classList.remove('option-selected')
    }
    console.log(`🔧 Opção ${optionId} ${checkbox.checked ? 'selecionada' : 'deselecionada'} na máquina ${machineId}`)
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
 * @param {number} machineId - ID único da máquina
 */
function updateMachineTitle(input, machineId) {
  const newTitle = input.value.trim()
  if (!newTitle) {
    input.value = `Equipamento de Climatização ${machineId}`
  }
}

/**
 * Atualiza as opções da máquina quando o tipo é alterado
 * Carrega novos dados de potência, tensão e opções
 * @param {HTMLSelectElement} selectElement - Select do tipo de máquina
 */
async function updateMachineOptions(selectElement) {
    const machineId = selectElement.getAttribute("data-machine-id");
    const selectedType = selectElement.value;

    console.log(`🔄 Atualizando opções para máquina ${machineId}, tipo: ${selectedType}`);

    if (!selectedType) {
        resetMachineFields(machineId);
        return;
    }

    try {
        // PRIMEIRA TENTATIVA: Buscar nos dados em cache
        if (window.machinesData && window.machinesData.length > 0) {
            const selectedMachine = window.machinesData.find((m) => m.type === selectedType);
            if (selectedMachine) {
                console.log(`✅ Máquina encontrada no cache: ${selectedType}`);
                updateMachineUI(machineId, selectedMachine);
                return;
            }
        }

        // SEGUNDA TENTATIVA: Carregar dados do servidor
        console.log("🚀 Carregando dados do servidor...");
        const response = await fetch('/machines');
        if (response.ok) {
            const data = await response.json();
            const machines = Array.isArray(data) ? data : data.machines;
            window.machinesData = machines;
            
            const selectedMachine = machines.find((m) => m.type === selectedType);
            if (selectedMachine) {
                console.log(`✅ Máquina encontrada no servidor: ${selectedType}`);
                updateMachineUI(machineId, selectedMachine);
            } else {
                console.error(`❌ Máquina não encontrada: ${selectedType}`);
                resetMachineFields(machineId);
            }
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

    } catch (error) {
        console.error("❌ Erro crítico ao atualizar opções:", error);
        // Fallback: tentar usar dados locais se disponíveis
        if (window.machinesData && window.machinesData.length > 0) {
            const selectedMachine = window.machinesData.find((m) => m.type === selectedType);
            if (selectedMachine) {
                console.log(`🔄 Usando fallback com dados locais para: ${selectedType}`);
                updateMachineUI(machineId, selectedMachine);
                return;
            }
        }
        resetMachineFields(machineId);
    }
}

/**
 * Atualiza a UI da máquina rapidamente
 */
function updateMachineUI(machineId, selectedMachine) {
    console.log(`🎯 Atualizando UI completa para máquina ${machineId}`);
    
    // 1. Atualizar potências
    const potencies = Object.keys(selectedMachine.baseValues || {});
    updateSelect(`.machine-power-select[data-machine-id="${machineId}"]`, potencies, "Selecionar TR", false);

    // 2. Atualizar tensões
    const voltageNames = (selectedMachine.voltages || []).map(v => v.name);
    updateSelect(`.machine-voltage-select[data-machine-id="${machineId}"]`, voltageNames, "Selecionar Tensão", false);

    // 3. ATUALIZAR OPCÕES - CORREÇÃO DEFINITIVA
    const optionsContainer = document.getElementById(`options-container-${machineId}`);
    
    if (optionsContainer) {
        console.log(`🔧 Container de opções encontrado para máquina ${machineId}`);
        
        // LIMPAR COMPLETAMENTE o container
        optionsContainer.innerHTML = '';
        
        const options = selectedMachine.options || [];
        console.log(`🔧 Renderizando ${options.length} opções para máquina ${machineId}`);
        
        if (options.length > 0) {
            // Usar a função buildOptionsHTML existente
            const optionsHTML = buildOptionsHTML(options, machineId, []);
            optionsContainer.innerHTML = optionsHTML;
            console.log(`✅ ${options.length} opções HTML inseridas no container da máquina ${machineId}`);
            
            // Garantir que as opções sejam visíveis
            setTimeout(() => {
                const renderedOptions = optionsContainer.querySelectorAll('.option-item');
                console.log(`👁️ ${renderedOptions.length} opções visíveis no DOM para máquina ${machineId}`);
                
                // Atualizar seleção visual de todas as opções
                options.forEach(option => {
                    updateOptionSelection(machineId, option.id);
                });
            }, 50);
        } else {
            // Se não há opções, mostrar mensagem específica
            optionsContainer.innerHTML = '<p class="empty-options-message">Nenhuma opção disponível para esta máquina</p>';
        }
    } else {
        console.error(`❌ Container de opções não encontrado para máquina ${machineId}`);
    }

    // 4. Resetar preços
    updateElementText(`base-price-${machineId}`, `R$ 0,00`);
    updateElementText(`total-price-${machineId}`, `R$ 0,00`);

    console.log(`✅ UI completamente atualizada para máquina ${machineId}`);
}

/**
 * Reseta os campos da máquina para o estado inicial
 * @param {number} machineId - ID único da máquina
 */
function resetMachineFields(machineId) {
    console.log(`🔄 Resetando campos da máquina ${machineId}`);
    
    updateSelect(`.machine-power-select[data-machine-id="${machineId}"]`, [], "Selecionar TR", true);
    updateSelect(`.machine-voltage-select[data-machine-id="${machineId}"]`, [], "Selecionar Tensão", true);

    const optionsContainer = document.getElementById(`options-container-${machineId}`);
    if (optionsContainer) {
        optionsContainer.innerHTML = '<p class="empty-options-message">Selecione um tipo de máquina para ver as opções</p>';
    }

    updateElementText(`base-price-${machineId}`, `R$ 0,00`);
    updateElementText(`total-price-${machineId}`, `R$ 0,00`);
}

/**
 * Atualiza as opções de um elemento select
 * @param {string} selector - Seletor do elemento select
 * @param {Array} options - Novas opções a serem adicionadas
 * @param {string} defaultText - Texto da opção padrão
 * @param {boolean} disabled - Se deve desabilitar o select
 */
function updateSelect(selector, options, defaultText = "Selecionar", disabled = false) {
    const select = document.querySelector(selector);
    if (select) {
        select.innerHTML = `
            <option value="">${defaultText}</option>
            ${options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")}
        `;
        select.disabled = disabled;
        console.log(`🔧 Select ${selector} atualizado com ${options.length} opções`);
    } else {
        console.error(`❌ Select não encontrado: ${selector}`);
    }
}

/**
 * Calcula o preço total da máquina considerando preço base e opções selecionadas
 * @param {number} machineId - ID único da máquina a ser calculada
 */
function calculateMachinePrice(machineId) {
  try {
    const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`)
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
    updateElementText(`base-price-${machineId}`, `R$ ${basePrice.toLocaleString("pt-BR")}`)

    // Calcular total das opções
    const optionsContainer = document.getElementById(`options-container-${machineId}`)
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
    updateElementText(`total-price-${machineId}`, `R$ ${totalPrice.toLocaleString("pt-BR")}`)

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

// Fallback function
function buildFallbackMachineHTML(machineId) {
    return `
        <div class="climatization-machine" data-machine-id="${machineId}">
            <div class="machine-header">
                <button class="minimizer" onclick="toggleMachineSection(this)">−</button>
                <input type="text" class="machine-title-editable" 
                       value="Equipamento de Climatização ${machineId}"
                       onchange="updateMachineTitle(this, ${machineId})" onclick="this.select()">
                <button class="btn btn-delete-small" onclick="deleteClimatizationMachine(this)">Remover</button>
            </div>
            <div class="machine-content" id="machine-content-${machineId}">
                <div style="padding: 1rem; background: #fff3cd; border-radius: 4px; margin: 1rem;">
                    <strong>Aviso:</strong> Não foi possível carregar os dados das máquinas.
                </div>
            </div>
        </div>
    `;
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