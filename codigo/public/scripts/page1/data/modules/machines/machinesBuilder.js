import { buildCapacityCalculationTable } from './capacityCalculator.js'
import { buildClimatizationMachineHTML } from './machineManagement.js'
import { removeEmptyMessage, showEmptyMessage } from './utilities.js'

// Cache para dados das máquinas - AGORA GLOBAL
if (typeof window !== 'undefined' && !window.machinesDataCache) {
    window.machinesDataCache = null;
}

/**
 * Constrói a seção completa de máquinas para uma sala
 * Inclui tabela de capacidade e container para máquinas
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @returns {string} HTML da seção de máquinas
 */
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

/**
 * Carrega os dados das máquinas do servidor com cache - CORRIGIDA
 * @returns {Promise<Object>} Dados das máquinas disponíveis
 */
async function loadMachinesData() {
    // Verificar se o cache é válido (não apenas se existe)
    if (window.machinesDataCache && Array.isArray(window.machinesDataCache.machines) && window.machinesDataCache.machines.length > 0) {
        console.log("📦 Retornando dados das máquinas do cache GLOBAL (válido)");
        return window.machinesDataCache;
    }

    try {
        console.log("🔄 Carregando dados das máquinas do servidor...");
        const response = await fetch(`/machines`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const machinesData = { machines: Array.isArray(data) ? data : data.machines };
        
        // Cache GLOBAL - disponível para todas as máquinas de todas as salas
        window.machinesDataCache = machinesData;
        window.machinesData = machinesData.machines;
        
        console.log(`✅ Dados das máquinas carregados GLOBALMENTE: ${machinesData.machines.length} máquinas`);
        return machinesData;
        
    } catch (error) {
        console.error("❌ Erro ao carregar dados das máquinas:", error);
        // Se houver cache antigo, usar mesmo que incompleto
        if (window.machinesDataCache) {
            console.log("🔄 Usando cache antigo devido ao erro");
            return window.machinesDataCache;
        }
        // Retorna dados vazios apenas se não houver cache
        const emptyData = { machines: [] };
        window.machinesDataCache = emptyData;
        return emptyData;
    }
}

/**
 * Carrega máquinas salvas previamente para uma sala
 * @param {string} roomId - ID da sala
 * @param {Array} savedMachines - Lista de máquinas salvas
 */
async function loadSavedMachines(roomId, savedMachines) {
    const machinesContainer = document.getElementById(`machines-${roomId}`);
    
    if (!savedMachines?.length) {
        console.log(`📭 Nenhuma máquina salva para a sala ${roomId}`);
        return;
    }

    removeEmptyMessage(machinesContainer);

    try {
        const machinesData = await loadMachinesData();
        console.log(`🔄 Carregando ${savedMachines.length} máquinas salvas para ${roomId}`);
        
        savedMachines.forEach((savedMachine, index) => {
            const machineHTML = buildClimatizationMachineFromSavedData(index + 1, savedMachine, machinesData.machines);
            machinesContainer.insertAdjacentHTML("beforeend", machineHTML);
            console.log(`✅ Máquina ${index + 1} carregada: ${savedMachine.nome}`);
        });

        // Recalcula preços após carregar todas as máquinas
        setTimeout(() => {
            savedMachines.forEach((_, index) => {
                calculateMachinePrice(index + 1);
            });
        }, 100);

    } catch (error) {
        console.error("❌ Erro ao carregar máquinas salvas:", error);
    }
}

/**
 * Constrói uma máquina de climatização a partir de dados salvos
 * @param {number} machineCount - Número sequencial da máquina
 * @param {Object} savedMachine - Dados da máquina salvos
 * @param {Array} allMachines - Lista de todas as máquinas disponíveis
 * @returns {string} HTML da máquina reconstruída
 */
function buildClimatizationMachineFromSavedData(machineCount, savedMachine, allMachines) {
  const machineType = allMachines.find((m) => m.type === savedMachine.tipo)

  if (!machineType) {
    return buildFallbackMachineFromSavedData(machineCount, savedMachine)
  }

  // Obter potências e tensões disponíveis
  const potencies = Object.keys(machineType.baseValues || {})
  const voltageNames = (machineType.voltages || []).map(v => v.name)
  
  // Calcular preço base atual - CORREÇÃO: usar valores específicos por TR
  const basePrice = calculateBasePrice(machineType, savedMachine.potencia)

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
              potencies,
              machineCount,
              "machine-power-select",
              `calculateMachinePrice(${machineCount})`,
              savedMachine.potencia,
            ),
          )}
          ${buildFormGroup(
            "Tensão:",
            buildSelectWithSelected(
              voltageNames,
              machineCount,
              "machine-voltage-select",
              `calculateMachinePrice(${machineCount})`,
              savedMachine.tensao,
            ),
          )}
          <div class="form-group">
            <label>Preço Base:</label>
            <div class="price-display" id="base-price-${machineCount}">
              R$ ${basePrice.toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineCount}">
            ${buildSavedOptionsHTML(machineType.options, machineCount, savedMachine.opcoesSelecionadas, savedMachine.potencia)}
          </div>
        </div>
        <div class="machine-total-price">
          <strong>Preço Total: <span id="total-price-${machineCount}">R$ ${savedMachine.precoTotal.toLocaleString("pt-BR")}</span></strong>
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
 * Constrói um elemento select com opção pré-selecionada
 * @param {Array} options - Lista de opções
 * @param {number} machineIndex - Índice da máquina
 * @param {string} className - Classe CSS
 * @param {string} onchangeHandler - Handler de change
 * @param {string} selectedValue - Valor pré-selecionado
 * @returns {string} HTML do select com seleção
 */
function buildSelectWithSelected(options, machineIndex, className, onchangeHandler, selectedValue) {
  return `
    <select class="form-input ${className}" 
            data-machine-index="${machineIndex}"
            onchange="${onchangeHandler}">
      <option value="">Selecionar</option>
      ${options
        .map((opt) => `<option value="${opt}" ${opt === selectedValue ? "selected" : ""}>${opt}</option>`)
        .join("")}
    </select>
  `
}

/**
 * Constrói opções com seleções pré-definidas a partir de dados salvos
 * @param {Array} options - Lista de opções disponíveis
 * @param {number} machineCount - Número da máquina
 * @param {Array} selectedOptions - Opções que estavam selecionadas
 * @param {string} selectedPower - Potência selecionada (para calcular valores específicos)
 * @returns {string} HTML das opções com checkboxes marcados
 */
function buildSavedOptionsHTML(options, machineCount, selectedOptions = [], selectedPower = null) {
  if (!options || options.length === 0) {
    return '<p class="empty-options-message">Nenhuma opção disponível para esta máquina</p>'
  }

  return options
    .map((option) => {
      const isChecked = selectedOptions.some((selected) => selected.id === option.id)
      
      // Calcular valor da opção baseado na potência selecionada
      let optionValue = 0;
      if (selectedPower && option.values && option.values[selectedPower] !== undefined) {
        optionValue = option.values[selectedPower];
      } else if (option.value) {
        // Fallback para valor fixo se não houver valores por TR
        optionValue = option.value;
      }
      
      const optionDisplayValue = selectedPower ? 
        `+R$ ${optionValue.toLocaleString("pt-BR")} (${selectedPower})` :
        `+R$ ${optionValue.toLocaleString("pt-BR")}`;

      return `
      <div class="option-checkbox-container" onclick="handleOptionClick(event, ${machineCount}, ${option.id})">
        <input type="checkbox" 
               value="${optionValue}" 
               data-option-id="${option.id}"
               data-option-name="${option.name}"
               onchange="calculateMachinePrice(${machineCount})"
               id="option-${machineCount}-${option.id}"
               ${isChecked ? "checked" : ""}>
        <label for="option-${machineCount}-${option.id}">
          <div class="option-text-wrapper">
            <div class="option-name">${option.name}</div>
            <div class="option-price">${optionDisplayValue}</div>
          </div>
        </label>
      </div>
    `
    })
    .join("")
}

/**
 * Constrói uma máquina fallback quando o tipo não é encontrado
 * @param {number} machineCount - Número sequencial da máquina
 * @param {Object} savedMachine - Dados da máquina salvos
 * @returns {string} HTML da máquina fallback (somente leitura)
 */
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
        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid">
            ${savedMachine.opcoesSelecionadas?.map(opt => `
              <div class="option-checkbox-container">
                <input type="checkbox" checked disabled>
                <label>${opt.name} (+R$ ${opt.value?.toLocaleString("pt-BR")})</label>
              </div>
            `).join('') || '<p>Nenhuma opção selecionada</p>'}
          </div>
        </div>
        <div class="machine-total-price">
          <strong>Preço Total: <span>R$ ${savedMachine.precoTotal.toLocaleString("pt-BR")}</span></strong>
        </div>
      </div>
    </div>
  `
}

/**
 * Calcula o preço base baseado no tipo de máquina e potência selecionada
 * @param {Object} machineType - Tipo da máquina
 * @param {string} potencia - Potência selecionada
 * @returns {number} Preço base calculado
 */
function calculateBasePrice(machineType, potencia) {
  if (!machineType || !machineType.baseValues) return 0
  
  // Garantir que a potência esteja no formato correto (ex: "7,5TR")
  const formattedPotency = potencia.includes('TR') ? potencia : `${potencia}TR`
  
  return machineType.baseValues[formattedPotency] || 0
}

/**
 * Atualiza os valores das opções quando a potência é alterada (para máquinas salvas)
 * @param {number} machineId - ID único da máquina
 * @param {string} selectedPower - Potência selecionada (TR)
 */
function updateSavedMachineOptionValues(machineId, selectedPower) {
    const machineElement = document.querySelector(`[data-machine-index="${machineId}"]`);
    if (!machineElement) return;
    
    const typeSelect = machineElement.querySelector('.machine-type-select');
    const selectedType = typeSelect?.value;
    
    if (!selectedType || !window.machinesData) return;
    
    const machine = window.machinesData.find(m => m.type === selectedType);
    if (!machine || !machine.options) return;
    
    const optionsContainer = document.getElementById(`options-container-${machineId}`);
    if (!optionsContainer) return;
    
    // Atualizar valores e display de todas as opções
    machine.options.forEach(option => {
        const checkbox = document.getElementById(`option-${machineId}-${option.id}`);
        if (checkbox) {
            let optionValue = 0;
            if (selectedPower && option.values && option.values[selectedPower] !== undefined) {
                optionValue = option.values[selectedPower];
            } else if (option.value) {
                optionValue = option.value;
            }
            
            // Atualizar valor do checkbox
            checkbox.value = optionValue;
            
            // Atualizar display do preço
            const priceDisplay = checkbox.closest('.option-checkbox-container')?.querySelector('.option-price');
            if (priceDisplay) {
                const optionDisplayValue = selectedPower ? 
                    `+R$ ${optionValue.toLocaleString("pt-BR")} (${selectedPower})` :
                    `+R$ ${optionValue.toLocaleString("pt-BR")}`;
                priceDisplay.textContent = optionDisplayValue;
            }
        }
    });
    
    // Recalcular preço
    calculateMachinePrice(machineId);
}

/**
 * Atualiza os cálculos de capacidade quando os ganhos térmicos mudam
 * @param {string} roomId - ID da sala
 */
function updateCapacityFromThermalGains(roomId) {
  calculateCapacitySolution(roomId)
}

/**
 * Inicializa os cálculos de capacidade com múltiplas tentativas
 * Usa timeouts progressivos para garantir que a DOM esteja pronta
 */
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

/**
 * Atualiza todos os cálculos de capacidade em todas as salas
 * Útil para recálculos em lote
 */
function refreshAllCapacityCalculations() {
  document.querySelectorAll(".room-block").forEach((roomBlock) => {
    const roomId = roomBlock.id.replace("room-content-", "")
    calculateCapacitySolution(roomId)
  })
}

// Exportação das funções do módulo
export {
  buildMachinesSection,
  loadMachinesData,
  loadSavedMachines,
  updateCapacityFromThermalGains,
  initializeCapacityCalculations,
  refreshAllCapacityCalculations,
  updateSavedMachineOptionValues
}

// Disponibilização global das funções necessárias
if (typeof window !== 'undefined') {
    window.updateSavedMachineOptionValues = updateSavedMachineOptionValues;
}