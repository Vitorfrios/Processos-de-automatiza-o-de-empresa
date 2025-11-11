// machineBuilder.js
// SISTEMA CORRIGIDO COM IDs ÚNICOS

import { buildCapacityCalculationTable } from './capacityCalculator.js'
import { removeEmptyMessage } from './utilities.js'
import { generateSecureId } from '../../data-files/data-utils-core.js' // ✅ NOVA IMPORT

if (typeof window !== 'undefined' && !window.machinesDataCache) {
    window.machinesDataCache = null;
}

/**
 * Constrói a seção completa de máquinas para uma sala
 * Inclui tabela de capacidade e container para máquinas
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} finalRoomId - ID único da sala
 * @returns {string} HTML da seção de máquinas
 */
function buildMachinesSection(obraId, projectId, roomName, finalRoomId) {
  const roomId = finalRoomId;

  if (!roomId || roomId === 'undefined' || roomId === 'null') {
      console.error(`ERRO FALBACK (buildMachinesSection) machineBuilder.js [Room ID inválido: ${roomId}]`);
      return '';
  }

  return `
    <div class="section-block">
      <div class="section-header-machine">
        <button class="minimizer" onclick="toggleSection('${roomId}-maquinas')">+</button>
        <h4 class="section-title">Máquinas</h4>
        <button class="btn btn-add-small" onclick="addMachine('${roomId}')">+ Adicionar </button>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}-maquinas">
        ${buildCapacityCalculationTable(roomId)}
        
        <div class="machines-container" id="machines-${roomId}">
          <p class="empty-message">Nenhuma máquina adicionada ainda.</p>
        </div>
        
        <!-- ✅ TOTAL GERAL: FORA do machines-container, DENTRO da section-content -->
        <div class="all-machines-total-price">
          <strong>Total Geral de Todas as Máquinas da Sala: 
            <span id="total-all-machines-price-${roomId}">R$ 0,00</span>
          </strong>
        </div>
      </div>
    </div>
  `;
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
 * Gera ID único para máquina baseado na sala - CORREÇÃO COMPLETA
 * @param {string} roomId - ID único da sala
 * @returns {string} ID único da máquina
 */
function generateMachineId(roomId) {
    // ✅ CORREÇÃO: Validar roomId
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`ERRO FALBACK (generateMachineId) machineBuilder.js [Room ID inválido: ${roomId}]`);
        return generateSecureId('machine');
    }
    
    const machinePrefix = generateSecureId('machine').replace('machine_', '');
    return `${roomId}_machine_${machinePrefix}_${Date.now()}`;
}

/**
 * Carrega máquinas salvas previamente para uma sala - CORREÇÃO COMPLETA
 * @param {string} roomId - ID único da sala
 * @param {Array} savedMachines - Lista de máquinas salvas
 */
async function loadSavedMachines(roomId, savedMachines) {
    // ✅ CORREÇÃO: Validar roomId
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`ERRO FALBACK (loadSavedMachines) machineBuilder.js [Room ID inválido: ${roomId}]`);
        return;
    }
    
    const machinesContainer = document.getElementById(`machines-${roomId}`);
    
    if (!savedMachines?.length) {
        console.log(`📭 Nenhuma máquina salva para a sala ${roomId}`);
        return;
    }

    if (!machinesContainer) {
        console.error(`❌ Container de máquinas não encontrado: machines-${roomId}`);
        return;
    }

    removeEmptyMessage(machinesContainer);

    try {
        const machinesData = await loadMachinesData();
        console.log(`🔄 Carregando ${savedMachines.length} máquinas salvas para ${roomId}`);
        
        savedMachines.forEach((savedMachine, index) => {
            // ✅ CORREÇÃO: Gerar ID único para cada máquina
            const machineId = generateMachineId(roomId);
            const machineHTML = buildClimatizationMachineFromSavedData(machineId, savedMachine, machinesData.machines);
            machinesContainer.insertAdjacentHTML("beforeend", machineHTML);
            console.log(`✅ Máquina carregada: ${savedMachine.nome} (ID: ${machineId})`);
        });

        // Aguardar a DOM atualizar e então forçar atualização dos valores
        setTimeout(() => {
            const machineElements = machinesContainer.querySelectorAll('.climatization-machine');
            machineElements.forEach((machineElement, index) => {
                const machineId = machineElement.dataset.machineId;
                const savedMachine = savedMachines[index];
                
                if (savedMachine) {
                    console.log(`🔧 Processando máquina ${machineId} com TR: ${savedMachine.potencia} e Tensão: ${savedMachine.tensao}`);
                    
                    // Forçar atualização dos valores baseados na TR salva
                    if (savedMachine.potencia && window.updateOptionValues) {
                        console.log(`🔄 Atualizando opções para TR ${savedMachine.potencia}`);
                        window.updateOptionValues(machineId);
                    }
                    
                    // Recalcular preço total
                    if (window.calculateMachinePrice) {
                        window.calculateMachinePrice(machineId);
                    }
                }
            });

            // ✅ NOVO: Calcular TOTAL GERAL após carregar todas as máquinas
            if (window.updateAllMachinesTotalDisplay) {
                window.updateAllMachinesTotalDisplay(roomId);
            }

        }, 200);

    } catch (error) {
        console.error("❌ Erro ao carregar máquinas salvas:", error);
    }
}

/**
 * Constrói uma máquina de climatização a partir de dados salvos - CORREÇÃO COMPLETA
 * @param {string} machineId - ID único da máquina
 * @param {Object} savedMachine - Dados da máquina salvos
 * @param {Array} allMachines - Lista de todas as máquinas disponíveis
 * @returns {string} HTML da máquina reconstruída
 */
function buildClimatizationMachineFromSavedData(machineId, savedMachine, allMachines) {
    // ✅ CORREÇÃO: Validar machineId
    if (!machineId || machineId === 'undefined' || machineId === 'null') {
        console.error(`ERRO FALBACK (buildClimatizationMachineFromSavedData) machineBuilder.js [Machine ID inválido: ${machineId}]`);
        machineId = generateSecureId('machine');
    }

    const machineType = allMachines.find((m) => m.type === savedMachine.tipo);

    if (!machineType) {
        console.error("❌ ERRO: Tipo de Máquina não encontrado:", savedMachine.tipo);
        return '';
    }

    // Obter potências e tensões disponíveis
    const potencies = Object.keys(machineType.baseValues || {});
    const voltageNames = (machineType.voltages || []).map(v => v.name);
    
    // Calcular preço base atual - usar valores específicos por TR
    const basePrice = calculateBasePrice(machineType, savedMachine.potencia);

    return `
    <div class="climatization-machine" data-machine-id="${machineId}" data-room-id="${savedMachine.roomId || ''}">
      <div class="machine-header">
        <button class="minimizer" onclick="toggleMachineSection(this)">−</button>
        <input type="text" 
               class="machine-title-editable" 
               value="${savedMachine.nome || `Maquina`}"
               onchange="updateMachineTitle(this, '${machineId}')"
               onclick="this.select()">
        <button class="btn btn-delete-small" onclick="deleteClimatizationMachine(this)">Remover</button>
      </div>
      <div class="machine-content" id="machine-content-${machineId}">
        <div class="climatization-form-grid">
          ${buildFormGroup(
            "Tipo de Equipamento:",
            buildSelectWithSelected(
              allMachines.map((m) => m.type),
              machineId,
              "machine-type-select",
              "updateMachineOptions(this)",
              savedMachine.tipo,
            ),
          )}
          ${buildFormGroup(
            "Capacidade:",
            buildSelectWithSelected(
              potencies,
              machineId,
              "machine-power-select",
              `handlePowerChange('${machineId}')`,
              savedMachine.potencia,
            ),
          )}
          ${buildFormGroup(
            "Tensão:",
            buildSelectWithSelected(
              voltageNames,
              machineId,
              "machine-voltage-select",
              `calculateMachinePrice('${machineId}')`,
              savedMachine.tensao,
            ),
          )}
          <div class="form-group">
              <label>Preço Base:</label>
              <div class="price-display" id="base-price-${machineId}">
                  R$ 0,00
              </div>
          </div>
          <div class="form-group"> <!-- Preço final desta máquina -->
              <label>Preço Total desta Máquina: </label>
                <div class="price-display" id="total-price-${machineId}"">
                  R$ ${savedMachine.precoTotal.toLocaleString("pt-BR")}
                </div>
          </div>

          </div>
        </div>
        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineId}">
            ${buildSavedOptionsHTML(machineType.options, machineId, savedMachine.opcoesSelecionadas, savedMachine.potencia)}
          </div>
        </div>
        <!-- ❌ REMOVIDO: total-all-machines-price NÃO deve estar aqui dentro -->
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
  `;
}

/**
 * Constrói um elemento select com opção pré-selecionada - CORREÇÃO COMPLETA
 * @param {Array} options - Lista de opções
 * @param {string} machineId - ID único da máquina
 * @param {string} className - Classe CSS
 * @param {string} onchangeHandler - Handler de change
 * @param {string} selectedValue - Valor pré-selecionado
 * @returns {string} HTML do select com seleção
 */
function buildSelectWithSelected(options, machineId, className, onchangeHandler, selectedValue) {
  return `
    <select class="form-input ${className}" 
            data-machine-id="${machineId}"
            onchange="${onchangeHandler}">
      <option value="">Selecionar</option>
      ${options
        .map((opt) => `<option value="${opt}" ${opt === selectedValue ? "selected" : ""}>${opt}</option>`)
        .join("")}
    </select>
  `;
}

/**
 * Constrói opções com seleções pré-definidas a partir de dados salvos - CORREÇÃO COMPLETA
 * @param {Array} options - Lista de opções disponíveis
 * @param {string} machineId - ID único da máquina
 * @param {Array} selectedOptions - Opções que estavam selecionadas
 * @param {string} selectedPower - Potência selecionada (para calcular valores específicos)
 * @returns {string} HTML das opções com checkboxes marcados
 */
function buildSavedOptionsHTML(options, machineId, selectedOptions = [], selectedPower = null) {
  if (!options || options.length === 0) {
    return '<p class="empty-options-message">Nenhuma opção disponível para esta máquina</p>';
  }

  return options
    .map((option) => {
      const isChecked = selectedOptions.some((selected) => selected.id === option.id);
      
      let optionValue = 0;
      if (selectedPower && option.values && option.values[selectedPower] !== undefined) {
        optionValue = option.values[selectedPower];
        console.log(`💰 Opção ${option.name} para TR ${selectedPower}: R$ ${optionValue}`);
      }
      
      const optionDisplayValue = `+R$ ${optionValue.toLocaleString("pt-BR")}`;

      return `
      <div class="option-item" onclick="handleOptionClick('${machineId}', ${option.id})">
        <div class="option-checkbox">
          <input type="checkbox" 
                 value="${optionValue}" 
                 data-option-id="${option.id}"
                 data-option-name="${option.name}"
                 onchange="updateOptionSelection('${machineId}', '${option.id}'); calculateMachinePrice('${machineId}')"
                 id="option-${machineId}-${option.id}"
                 ${isChecked ? "checked" : ""}>
          <div class="option-content">
            <div class="option-name">${option.name}</div>
            <div class="option-price">${optionDisplayValue}</div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

/**
 * Calcula o preço base baseado no tipo de máquina e potência selecionada
 * @param {Object} machineType - Tipo da máquina
 * @param {string} potencia - Potência selecionada
 * @returns {number} Preço base calculado
 */
function calculateBasePrice(machineType, potencia) {
  if (!machineType || !machineType.baseValues) return 0;
  return machineType.baseValues[potencia] || 0;
}

/**
 * Atualiza os cálculos de capacidade quando os ganhos térmicos mudam
 * @param {string} roomId - ID da sala
 */
function updateCapacityFromThermalGains(roomId) {
  if (window.calculateCapacitySolution) {
    window.calculateCapacitySolution(roomId);
  }
}

/**
 * Inicializa os cálculos de capacidade com múltiplas tentativas
 * Usa timeouts progressivos para garantir que a DOM esteja pronta
 */
function initializeCapacityCalculations() {
  const attempts = [100, 500, 1000, 2000];
  attempts.forEach((delay) => {
    setTimeout(() => {
      document.querySelectorAll(".room-block").forEach((roomBlock) => {
        const roomId = roomBlock.dataset.roomId; // ✅ CORREÇÃO: Usar data attribute
        if (roomId) {
          const capacityTable = roomBlock.querySelector(".capacity-calculation-table");
          if (capacityTable) {
            const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`);
            const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`);
            if (fatorSegurancaInput && capacidadeUnitariaSelect && window.calculateCapacitySolution) {
              window.calculateCapacitySolution(roomId);
            }
          }
        }
      });
    }, delay);
  });
}

/**
 * Atualiza todos os cálculos de capacidade em todas as salas
 * Útil para recálculos em lote
 */
function refreshAllCapacityCalculations() {
  document.querySelectorAll(".room-block").forEach((roomBlock) => {
    const roomId = roomBlock.dataset.roomId; // ✅ CORREÇÃO: Usar data attribute
    if (roomId && window.calculateCapacitySolution) {
      window.calculateCapacitySolution(roomId);
    }
  });
}

// Exportação das funções do módulo
export {
  buildMachinesSection,
  loadMachinesData,
  loadSavedMachines,
  updateCapacityFromThermalGains,
  initializeCapacityCalculations,
  refreshAllCapacityCalculations,
  generateMachineId // ✅ NOVA EXPORT
}

// Disponibilização global das funções necessárias
if (typeof window !== 'undefined') {
    window.loadSavedMachines = loadSavedMachines;
    window.generateMachineId = generateMachineId; // ✅ NOVA GLOBAL
}