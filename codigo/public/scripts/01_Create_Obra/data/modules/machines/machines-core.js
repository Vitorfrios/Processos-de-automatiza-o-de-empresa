/**
 * data/modules/machines/machines-core.js
 * Sistema unificado de máquinas - COM NOMENCLATURA AUTOMÁTICA
 * Versão COMPLETA E CORRIGIDA com geração automática de nomes
 */

import { buildCapacityCalculationTable } from './capacity-calculator.js';
import { updateElementText, safeNumber } from '../../utils/core-utils.js';
import { generateMachineId } from '../../utils/id-generator.js';

// =============================================================================
// CACHE E ESTADO GLOBAL
// =============================================================================

if (typeof window !== 'undefined' && !window.machinesDataCache) {
    window.machinesDataCache = null;
}

// =============================================================================
// FUNÇÕES CORE UNIFICADAS
// =============================================================================

/**
 * Carrega dados das máquinas com cache
 */
async function loadMachinesData() {
    if (window.machinesDataCache?.machines?.length) {
        return window.machinesDataCache;
    }

    try {
        const response = await fetch('/machines');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const machinesData = { machines: Array.isArray(data) ? data : data.machines };

        window.machinesDataCache = machinesData;
        window.machinesData = machinesData.machines;
        return machinesData;

    } catch (error) {
        console.error("❌ Erro ao carregar máquinas:", error);
        return window.machinesDataCache || { machines: [] };
    }
}

// =============================================================================
// SISTEMA DE NOMENCLATURA AUTOMÁTICA
// =============================================================================

/**
 * 🆕 GERA NOME AUTOMÁTICO APENAS QUANDO TIPO E CAPACIDADE ESTÃO SELECIONADOS
 */
function generateMachineName(machineType, roomId, currentMachineId = null) {
    console.log(`🔤 Gerando nome automático para ${machineType} na sala ${roomId}`);
    
    const container = document.getElementById(`machines-${roomId}`);
    if (!container) return machineType; // 🆕 RETORNA APENAS O TIPO SE NÃO HÁ CAPACIDADE

    // Buscar apenas máquinas que TENHAM TIPO E CAPACIDADE SELECIONADOS
    const existingMachines = Array.from(container.querySelectorAll('.climatization-machine'));
    
    const allMachinesData = [];
    
    existingMachines.forEach(machine => {
        const machineId = machine.dataset.machineId;
        const typeSelect = machine.querySelector('.machine-type-select');
        const powerSelect = machine.querySelector('.machine-power-select');
        const titleInput = machine.querySelector('.machine-title-editable');
        
        // 🆕 SÓ INCLUI NA LÓGICA SE TIVER TIPO E CAPACIDADE SELECIONADOS
        if (typeSelect && typeSelect.value === machineType && powerSelect && powerSelect.value) {
            allMachinesData.push({
                machineId: machineId,
                element: machine,
                type: typeSelect.value,
                power: powerSelect.value,
                capacity: powerSelect.value,
                currentName: titleInput ? titleInput.value : '',
                capacityValue: getGenericCapacityValue(powerSelect.value)
            });
        }
    });

    // Adicionar a nova máquina (se for o caso) - SÓ SE TIVER CAPACIDADE
    if (currentMachineId && machineType) {
        const currentMachineElement = document.querySelector(`[data-machine-id="${currentMachineId}"]`);
        const powerSelect = currentMachineElement?.querySelector('.machine-power-select');
        const currentPower = powerSelect ? powerSelect.value : '';
        
        if (currentPower) {
            allMachinesData.push({
                machineId: currentMachineId,
                type: machineType,
                power: currentPower,
                capacity: currentPower,
                capacityValue: getGenericCapacityValue(currentPower),
                isNew: true
            });
        } else {
            // 🆕 SE NÃO TEM CAPACIDADE, RETORNA APENAS O TIPO
            return machineType;
        }
    }

    // 🆕 SE NÃO HÁ MÁQUINAS COM TIPO E CAPACIDADE SELECIONADOS, RETORNA APENAS O TIPO
    if (allMachinesData.length === 0) {
        return machineType;
    }

    // Ordenar por capacidade (decrescente)
    allMachinesData.sort((a, b) => b.capacityValue - a.capacityValue);

    // Agrupar por capacidade
    const capacityGroups = {};
    allMachinesData.forEach(machine => {
        const capacityKey = machine.capacity;
        if (!capacityGroups[capacityKey]) {
            capacityGroups[capacityKey] = [];
        }
        capacityGroups[capacityKey].push(machine);
    });

    // Ordenar grupos por capacidade (decrescente)
    const sortedGroups = Object.entries(capacityGroups)
        .sort(([,groupA], [,groupB]) => {
            const capacityA = groupA[0].capacityValue;
            const capacityB = groupB[0].capacityValue;
            return capacityB - capacityA;
        });

    // Atribuir números e letras
    let groupNumber = 1;
    const newNames = {};

    sortedGroups.forEach(([capacityKey, machines]) => {
        // Ordenar máquinas dentro do grupo (para consistência)
        machines.sort((a, b) => a.machineId.localeCompare(b.machineId));
        
        // Atribuir letras
        machines.forEach((machine, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C...
            const newName = `${machineType}-${groupNumber.toString().padStart(2, '0')}${letter} (${machine.capacity})`;
            newNames[machine.machineId] = newName;
        });
        
        groupNumber++;
    });

    // Retornar o nome para a máquina atual ou atualizar todos
    if (currentMachineId) {
        return newNames[currentMachineId] || machineType;
    } else {
        // Atualizar todos os nomes
        Object.entries(newNames).forEach(([machineId, newName]) => {
            const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
            if (machineElement) {
                const titleInput = machineElement.querySelector('.machine-title-editable');
                if (titleInput && titleInput.value !== newName) {
                    titleInput.value = newName;
                }
            }
        });
    }
}

/**
 * 🆕 OBTÉM VALOR NUMÉRICO DA CAPACIDADE PARA ORDENAÇÃO
 */
function getGenericCapacityValue(powerText) {
    if (!powerText) return 0;
    
    try {
        // Extrair números do texto (funciona para BTU, kW, CFM, m³/h, etc.)
        const numericMatch = powerText.match(/(\d+[.,]?\d*)/);
        if (numericMatch) {
            return parseFloat(numericMatch[0].replace(',', '.'));
        }
        return 0;
    } catch (error) {
        console.error('Erro ao obter capacidade:', error);
        return 0;
    }
}

/**
 * 🆕 ATUALIZA NOME QUANDO A CAPACIDADE É ALTERADA
 */
function updateMachineNameOnPowerChange(machineId) {
    const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
    if (!machineElement) return;

    const typeSelect = machineElement.querySelector('.machine-type-select');
    const powerSelect = machineElement.querySelector('.machine-power-select');
    const roomId = machineElement.dataset.roomId;
    
    if (typeSelect && typeSelect.value && roomId) {
        // ATUALIZAR TODOS OS NOMES DO MESMO TIPO
        generateMachineName(typeSelect.value, roomId);
    }
}

/**
 * 🆕 ATUALIZA TODOS OS NOMES DAS MÁQUINAS NA SALA
 */
function updateAllMachineNamesInRoom(roomId) {
    console.log(`🔄 Atualizando todos os nomes das máquinas na sala ${roomId}`);
    
    const container = document.getElementById(`machines-${roomId}`);
    if (!container) return;

    // Para cada tipo de máquina existente, atualizar os nomes
    const machines = Array.from(container.querySelectorAll('.climatization-machine'));
    const machineTypes = new Set();
    
    machines.forEach(machine => {
        const typeSelect = machine.querySelector('.machine-type-select');
        if (typeSelect && typeSelect.value) {
            machineTypes.add(typeSelect.value);
        }
    });

    // Atualizar nomes para cada tipo
    machineTypes.forEach(type => {
        generateMachineName(type, roomId);
    });
}

// =============================================================================
// CONSTRUÇÃO DE UI UNIFICADA
// =============================================================================

/**
 * Constrói seção completa de máquinas
 */
function buildMachinesSection(obraId, projectId, roomName, finalRoomId) {
    if (!finalRoomId) return '';

    return `
    <div class="section-block">
      <div class="section-header-machine">
        <button class="minimizer" onclick="toggleSection('${finalRoomId}-maquinas')">+</button>
        <h4 class="section-title">Máquinas</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${finalRoomId}-maquinas">
        ${buildCapacityCalculationTable(finalRoomId)}
        <div class="machines-container" id="machines-${finalRoomId}">
          <p class="empty-message">Nenhuma máquina adicionada ainda.</p>
        </div>
        <div class="add-machine">
            <button class="btn btn-add-secondary" onclick="addMachine('${finalRoomId}')">+ Adicionar Máquina</button> 
        </div>
        <div class="all-machines-total-price">
          <strong>Total de Maquinas: <span id="total-all-machines-price-${finalRoomId}">R$ 0,00</span></strong>
        </div>
      </div>
    </div>`;
}

/**
 * Constrói HTML de máquina individual
 */
function buildMachineHTML(machineId, displayName, machines, roomId) {
    const machineTypes = machines.map(m => m.type);

    return `
    <div class="climatization-machine" data-machine-id="${machineId}" data-room-id="${roomId}">
      <div class="machine-header">
        <button class="minimizer" onclick="toggleMachineSection(this)">−</button>
        <input type="text" class="machine-title-editable" value="${displayName}" 
               onchange="updateMachineTitle(this, '${machineId}')" onclick="this.select()">
        <button class="btn btn-delete-small" onclick="deleteMachine('${machineId}')">Remover</button>
      </div>
      <div class="machine-content" id="machine-content-${machineId}">
        <div class="climatization-form-grid">
          ${buildFormGroup("Tipo:", buildSelect(machineTypes, machineId, "machine-type-select", "updateMachineOptions(this)"))}
          ${buildFormGroup("Capacidade:", buildSelect([], machineId, "machine-power-select", `handlePowerChange('${machineId}')`, true))}
          ${buildFormGroup("Tensão:", buildSelect([], machineId, "machine-voltage-select", `calculateMachinePrice('${machineId}')`, true))}
          ${buildFormGroup("Qnt:", `<input type="number" class="form-input machine-qnt-input" data-machine-id="${machineId}" min="1" value="1" onchange="updateQuantity('${machineId}')">`)}
          ${buildFormGroup("Preço Base:", `<div class="price-display" id="base-price-${machineId}">R$ 0,00</div>`)}
          ${buildFormGroup("Preço Total:", `<div class="price-display" id="total-price-${machineId}">R$ 0,00</div>`)}
        </div>
        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineId}">
            <p class="empty-options-message">Selecione tipo e capacidade</p>
          </div>
        </div>
        <!-- 🆕 SEÇÃO DE CONFIGURAÇÕES -->
        <div class="machine-config-section">
            <h6>Configurações de Instalação:</h6>
            <div class="config-grid" id="config-container-${machineId}">
                <p class="empty-config-message">Selecione tipo e capacidade</p>
            </div>
        </div>
      </div>
    </div>`;
}

/**
 * Constrói máquina a partir de dados salvos
 */
function buildMachineFromSavedData(machineId, savedMachine, allMachines) {
    const machineType = allMachines.find(m => m.type === savedMachine.tipo);
    if (!machineType) return '';

    const potencies = Object.keys(machineType.baseValues || {});
    const voltages = (machineType.voltages || []).map(v => v.name);
    const quantidade = savedMachine.quantidade || 1;

    return `
    <div class="climatization-machine" data-machine-id="${machineId}" data-room-id="${savedMachine.roomId || ''}">
      <div class="machine-header">
        <input type="text" class="machine-title-editable" value="${savedMachine.nome || 'Maquina'}"
               onchange="updateMachineTitle(this, '${machineId}')" onclick="this.select()">
        <button class="btn btn-delete-small" onclick="deleteMachine('${machineId}')">Remover</button>
      </div>
      <div class="machine-content" id="machine-content-${machineId}">
        <div class="climatization-form-grid">
          ${buildFormGroup("Tipo:", buildSelect(allMachines.map(m => m.type), machineId, "machine-type-select", "updateMachineOptions(this)", false, savedMachine.tipo))}
          ${buildFormGroup("Capacidade:", buildSelect(potencies, machineId, "machine-power-select", `handlePowerChange('${machineId}')`, false, savedMachine.potencia))}
          ${buildFormGroup("Tensão:", buildSelect(voltages, machineId, "machine-voltage-select", `calculateMachinePrice('${machineId}')`, false, savedMachine.tensao))}
          ${buildFormGroup("Quantidade:", `<input type="number" class="form-input machine-qnt-input" data-machine-id="${machineId}" min="1" value="${quantidade}" onchange="updateQuantity('${machineId}')">`)}
          ${buildFormGroup("Preço Base:", `<div class="price-display" id="base-price-${machineId}">R$ ${(savedMachine.precoBase || 0).toLocaleString("pt-BR") || '0,00'}</div>`)}
          ${buildFormGroup("Preço Total:", `<div class="price-display" id="total-price-${machineId}">R$ ${(savedMachine.precoTotal || 0).toLocaleString("pt-BR") || '0,00'}</div>`)}
        </div>
        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineId}">
            ${buildOptionsHTML(machineType.options, machineId, savedMachine.opcoesSelecionadas || [], savedMachine.potencia)}
          </div>
        </div>
        <!-- SEÇÃO DE CONFIGURAÇÕES - COM DADOS SALVOS -->
        <div class="machine-config-section">
          <h6>Configurações de Instalação:</h6>
          <div class="config-grid" id="config-container-${machineId}">
            ${buildConfigHTML(machineType.configuracoes_instalacao, machineId, savedMachine.configuracoesSelecionadas || [], savedMachine.potencia)}
          </div>
        </div>
      </div>
    </div>`;
}

// =============================================================================
// COMPONENTES UI REUTILIZÁVEIS
// =============================================================================

/**
 * Constrói grupo de formulário
 */
function buildFormGroup(label, content) {
    return `<div class="form-group"><label>${label}</label>${content}</div>`;
}

/**
 * Constrói elemento select
 */
function buildSelect(options, machineId, className, onchangeHandler, disabled = false, selectedValue = '') {
    const disabledAttr = disabled ? 'disabled' : '';
    const optionsHTML = options.map(opt =>
        `<option value="${opt}" ${opt === selectedValue ? 'selected' : ''}>${opt}</option>`
    ).join('');

    return `
    <select class="form-input ${className}" data-machine-id="${machineId}" 
            onchange="${onchangeHandler}" ${disabledAttr}>
      <option value="">Selecionar</option>${optionsHTML}
    </select>`;
}

/**
 * Constrói opções da máquina
 */
function buildOptionsHTML(options, machineId, selectedOptions = [], selectedPower = null) {
    if (!options?.length) return '<p class="empty-options-message">Nenhuma opção disponível</p>';

    return options.map(option => {
        const isChecked = selectedOptions.some(selected => selected.id === option.id);
        const optionValue = selectedPower && option.values?.[selectedPower] || 0;
        const displayValue = `+R$ ${optionValue.toLocaleString("pt-BR")}`;

        return `
        <div class="option-item ${isChecked ? 'option-selected' : ''}" onclick="toggleOption('${machineId}', ${option.id})">
          <div class="option-checkbox">
            <input type="checkbox" value="${optionValue}" data-option-id="${option.id}" 
                   data-option-name="${option.name}" id="option-${machineId}-${option.id}"
                   onchange="updateOptionSelection('${machineId}', ${option.id}); calculateMachinePrice('${machineId}')"
                   ${isChecked ? 'checked' : ''}>
            <div class="option-content">
              <div class="option-name">${option.name}</div>
              <div class="option-price">${displayValue}</div>
            </div>
          </div>
        </div>`;
    }).join('');
}

/**
 * CONSTRÓI HTML DAS CONFIGURAÇÕES DE INSTALAÇÃO
 */
function buildConfigHTML(configuracoes, machineId, configuracoesSelecionadas = [], potencia = '') {
    console.log(`🔨 buildConfigHTML: ${configuracoes?.length || 0} configurações para ${machineId}`);
    console.log(`   Configurações selecionadas:`, configuracoesSelecionadas);

    if (!configuracoes || !Array.isArray(configuracoes) || configuracoes.length === 0) {
        return '<p class="empty-config-message">Nenhuma configuração disponível</p>';
    }
    
    const html = configuracoes.map(config => {
        // Verificar se esta configuração está salva
        const isSaved = configuracoesSelecionadas.some(savedConfig => {
            // Comparar por ID ou por nome
            if (typeof savedConfig === 'object') {
                return savedConfig.id === config.id || savedConfig.nome === config.nome;
            }
            return savedConfig === config.id || savedConfig === config.nome;
        });
        
        const isChecked = isSaved;
        
        // IDENTIFICAR CONFIGURAÇÕES EXCLUSIVAS
        const configName = config.nome;
        const isBocalInsuflamento = configName === "Bocal de insuflamento protegido por grelha diretamente no ambiente";
        const isBocalAcoplado = configName === "Bocal acoplado à rede de dutos por lona flexível. Distribuição por grelhas";
        const isExclusiveGroup = isBocalInsuflamento || isBocalAcoplado;
        
        const configElement = `
        <div class="config-option ${isChecked ? 'config-selected' : ''} ${isExclusiveGroup ? 'exclusive-group' : ''}" 
             onclick="toggleConfig('${machineId}', ${config.id})">
            <div class="config-checkbox">
                <input type="checkbox" data-config-id="${config.id}" 
                       data-config-name="${configName}" 
                       data-exclusive-group="${isExclusiveGroup ? 'bocal-distribuicao' : ''}"
                       id="config-${machineId}-${config.id}"
                       onchange="handleConfigChange('${machineId}', ${config.id})"
                       ${isChecked ? 'checked' : ''}>
                <div class="config-content">
                    <div class="config-name">${configName}</div>
                </div>
            </div>
        </div>`;
        
        console.log(`   Config ${config.id}: "${configName}" ${isExclusiveGroup ? '(EXCLUSIVA)' : ''} ${isChecked ? '[SALVA]' : ''}`);
        return configElement;
    }).join('');
    
    console.log(`📦 HTML final gerado com ${configuracoes.length} configurações`);
    return html;
}

// =============================================================================
// GERENCIAMENTO DE MÁQUINAS
// =============================================================================

/**
 * Adiciona nova máquina COM NOME SIMPLES INICIAL
 */
async function addMachine(roomId) {
    const container = document.getElementById(`machines-${roomId}`);
    if (!container) return;

    const machineId = generateMachineId(roomId);
    const machineCount = container.querySelectorAll(".climatization-machine").length;

    try {
        const machinesData = await loadMachinesData();
        if (!machinesData.machines.length) throw new Error("Nenhum dado disponível");

        // 🆕 NOME SIMPLES INICIAL - SEM TIPO DEFINIDO
        const autoName = `Maquina ${machineCount + 1}`;

        const machineHTML = buildMachineHTML(machineId, autoName, machinesData.machines, roomId);
        container.insertAdjacentHTML("beforeend", machineHTML);

        // Remove mensagem de vazio
        const emptyMsg = container.querySelector('.empty-message');
        if (emptyMsg) emptyMsg.remove();

        updateAllMachinesTotal(roomId);
        console.log(`✅ Máquina ${autoName} adicionada à sala ${roomId}`);
        return true;
    } catch (error) {
        console.error("❌ Erro ao adicionar máquina:", error);
        showEmptyMessage(container, "Erro ao carregar dados");
    }
}

/**
 * Carrega máquinas salvas
 */
async function loadSavedMachines(roomId, savedMachines) {
    if (!savedMachines?.length || !roomId) return;

    const container = document.getElementById(`machines-${roomId}`);
    if (!container) return;

    try {
        const machinesData = await loadMachinesData();

        savedMachines.forEach((savedMachine, index) => {
            const machineId = generateMachineId(roomId);
            const machineHTML = buildMachineFromSavedData(machineId, savedMachine, machinesData.machines);
            container.insertAdjacentHTML("beforeend", machineHTML);
            
            // ✅ AGORA APLICAMOS AS CONFIGURAÇÕES IMEDIATAMENTE
            setTimeout(() => {
                const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
                if (machineElement && savedMachine.configuracoesSelecionadas) {
                    applySavedConfigurations(machineId, savedMachine.configuracoesSelecionadas);
                }
            }, 100);
        });

        // Atualiza valores após carregamento
        setTimeout(() => {
            container.querySelectorAll('.climatization-machine').forEach((element, index) => {
                const machineId = element.dataset.machineId;
                const savedMachine = savedMachines[index];
                
                if (savedMachine?.potencia) {
                    updateOptionValues(machineId);
                    calculateMachinePrice(machineId);
                }
                
                // ✅ APLICA CONFIGURAÇÕES NOVAMENTE PARA GARANTIR
                if (savedMachine?.configuracoesSelecionadas) {
                    applySavedConfigurations(machineId, savedMachine.configuracoesSelecionadas);
                }
            });
            updateAllMachinesTotal(roomId);
        }, 300);

    } catch (error) {
        console.error("❌ Erro ao carregar máquinas salvas:", error);
    }
}
/**
 * Aplica configurações salvas a uma máquina
 */
function applySavedConfigurations(machineId, configuracoesSelecionadas) {
    if (!configuracoesSelecionadas || !Array.isArray(configuracoesSelecionadas)) return;
    
    console.log(`🔧 Aplicando ${configuracoesSelecionadas.length} configurações salvas na máquina ${machineId}`);
    
    const configContainer = document.getElementById(`config-container-${machineId}`);
    if (!configContainer) {
        console.error(`❌ Container de configurações não encontrado para máquina ${machineId}`);
        return;
    }
    
    // Aguardar um pouco para garantir que o HTML esteja renderizado
    setTimeout(() => {
        configuracoesSelecionadas.forEach(config => {
            const configId = config.id || config;
            const checkbox = document.getElementById(`config-${machineId}-${configId}`);
            
            if (checkbox) {
                checkbox.checked = true;
                // Disparar evento para aplicar a lógica exclusiva
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Configuração ${configId} aplicada na máquina ${machineId}`);
            } else {
                console.warn(`⚠️ Configuração ${configId} não encontrada na máquina ${machineId}`);
            }
        });
    }, 200);
}
// =============================================================================
// ATUALIZAÇÃO DE UI
// =============================================================================

/**
 * Atualiza opções da máquina - APENAS ATUALIZA NOME SE TIVER CAPACIDADE
 */
async function updateMachineOptions(selectElement) {
    const machineId = selectElement.dataset.machineId;
    const selectedType = selectElement.value;

    console.log(`🔄 updateMachineOptions: ${selectedType} para ${machineId}`);

    if (!selectedType) {
        resetMachineFields(machineId);
        
        // SE DESSELECIONOU O TIPO, VOLTA PARA NOME SIMPLES
        const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
        if (machineElement) {
            const titleInput = machineElement.querySelector('.machine-title-editable');
            const container = document.getElementById(`machines-${machineElement.dataset.roomId}`);
            const machineCount = container ? container.querySelectorAll(".climatization-machine").length : 1;
            
            if (titleInput && !titleInput.value.includes('Maquina')) {
                titleInput.value = `Maquina ${machineCount}`;
            }
        }
        return;
    }

    try {
        const machinesData = window.machinesData || [];
        const machine = machinesData.find(m => m.type === selectedType);

        if (machine) {
            console.log(`✅ Máquina encontrada: ${machine.type}`);
            
            // 🆕 ATUALIZA A UI MAS NÃO APLICA NOME AUTOMÁTICO AINDA
            updateMachineUI(machineId, machine);
            
            // 🆕 SÓ APLICA NOME AUTOMÁTICO SE JÁ TIVER CAPACIDADE SELECIONADA
            const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
            if (machineElement) {
                const powerSelect = machineElement.querySelector('.machine-power-select');
                if (powerSelect && powerSelect.value) {
                    const roomId = machineElement.dataset.roomId;
                    const newName = generateMachineName(selectedType, roomId, machineId);
                    
                    const titleInput = machineElement.querySelector('.machine-title-editable');
                    if (titleInput) {
                        titleInput.value = newName;
                    }
                } else {
                    // 🆕 SE NÃO TEM CAPACIDADE, APENAS COLOCA O TIPO
                    const titleInput = machineElement.querySelector('.machine-title-editable');
                    if (titleInput) {
                        titleInput.value = selectedType;
                    }
                }
            }
            
        } else {
            console.log(`❌ Máquina não encontrada: ${selectedType}`);
            resetMachineFields(machineId);
        }
    } catch (error) {
        console.error("❌ Erro em updateMachineOptions:", error);
        resetMachineFields(machineId);
    }
}

/**
 * ATUALIZA UI COMPLETA DA MÁQUINA
 */
function updateMachineUI(machineId, machine) {
    console.log(`🎨 updateMachineUI: ${machine.type} para ${machineId}`);
    
    const potencies = Object.keys(machine.baseValues || {});
    const voltages = (machine.voltages || []).map(v => v.name);

    // Atualizar selects
    updateSelectUI(`.machine-power-select[data-machine-id="${machineId}"]`, potencies, false);
    updateSelectUI(`.machine-voltage-select[data-machine-id="${machineId}"]`, voltages, false);

    // Atualizar opções
    const optionsContainer = document.getElementById(`options-container-${machineId}`);
    if (optionsContainer) {
        optionsContainer.innerHTML = machine.options?.length
            ? buildOptionsHTML(machine.options, machineId)
            : '<p class="empty-options-message">Nenhuma opção disponível</p>';
    }

    // ATUALIZAR CONFIGURAÇÕES
    const configContainer = document.getElementById(`config-container-${machineId}`);
    console.log(`🔍 Container encontrado:`, configContainer);

    if (configContainer) {
        if (machine.configuracoes_instalacao?.length) {
            console.log(`🚀 Inserindo ${machine.configuracoes_instalacao.length} configurações`);
            
            const configHTML = buildConfigHTML(machine.configuracoes_instalacao, machineId);
            console.log(`📝 HTML gerado:`, configHTML);
            
            configContainer.innerHTML = '';
            configContainer.insertAdjacentHTML('beforeend', configHTML);
            
            setTimeout(() => {
                const insertedOptions = configContainer.querySelectorAll('.config-option');
                console.log(`✅ Configurações inseridas: ${insertedOptions.length} opções`);
            }, 50);
            
        } else {
            configContainer.innerHTML = '<p class="empty-config-message">Nenhuma configuração disponível</p>';
        }
    } else {
        console.error(`❌ Container config-container-${machineId} não encontrado`);
    }

    updateElementText(`base-price-${machineId}`, 'R$ 0,00');
    updateElementText(`total-price-${machineId}`, 'R$ 0,00');
}

/**
 * Atualiza select na UI
 */
function updateSelectUI(selector, options, disabled = false) {
    const select = document.querySelector(selector);
    if (select) {
        select.innerHTML = `<option value="">Selecionar</option>${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}`;
        select.disabled = disabled;
    }
}

/**
 * RESETA CAMPOS DA MÁQUINA
 */
function resetMachineFields(machineId) {
    updateSelectUI(`.machine-power-select[data-machine-id="${machineId}"]`, [], true);
    updateSelectUI(`.machine-voltage-select[data-machine-id="${machineId}"]`, [], true);

    const optionsContainer = document.getElementById(`options-container-${machineId}`);
    if (optionsContainer) {
        optionsContainer.innerHTML = '<p class="empty-options-message">Selecione um tipo de máquina</p>';
    }

    const configContainer = document.getElementById(`config-container-${machineId}`);
    if (configContainer) {
        configContainer.innerHTML = '<p class="empty-config-message">Selecione um tipo de máquina</p>';
    }

    updateElementText(`base-price-${machineId}`, 'R$ 0,00');
    updateElementText(`total-price-${machineId}`, 'R$ 0,00');
}

// =============================================================================
// CÁLCULOS DE PREÇO
// =============================================================================
/**
 * Atualiza a quantidade e recalcula o preço
 */
function updateQuantity(machineId) {
    const qntInput = document.querySelector(`.machine-qnt-input[data-machine-id="${machineId}"]`);
    if (!qntInput) return;
    
    // Garantir que a quantidade seja pelo menos 1
    const quantidade = Math.max(1, parseInt(qntInput.value) || 1);
    qntInput.value = quantidade;
    
    // Recalcular preço
    calculateMachinePrice(machineId);
    
    console.log(`🔢 Quantidade atualizada para ${quantidade} na máquina ${machineId}`);
}

/**
 * Calcula preço da máquina
 */
function calculateMachinePrice(machineId) {
    const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
    if (!machineElement) return;

    const typeSelect = machineElement.querySelector('.machine-type-select');
    const powerSelect = machineElement.querySelector('.machine-power-select');
    const voltageSelect = machineElement.querySelector('.machine-voltage-select');
    const qntInput = machineElement.querySelector('.machine-qnt-input');

    const selectedType = typeSelect?.value;
    const selectedPower = powerSelect?.value;
    const selectedVoltage = voltageSelect?.value;
    const quantidade = qntInput ? parseInt(qntInput.value) || 1 : 1;

    let basePrice = 0, voltageValue = 0;

    // Preço base unitário
    if (selectedType && selectedPower && window.machinesData) {
        const machine = window.machinesData.find(m => m.type === selectedType);
        basePrice = machine?.baseValues?.[selectedPower] || 0;
    }

    // Valor da tensão unitário
    if (selectedType && selectedVoltage && window.machinesData) {
        const machine = window.machinesData.find(m => m.type === selectedType);
        const voltageObj = machine?.voltages?.find(v => v.name === selectedVoltage);
        voltageValue = voltageObj?.value || 0;
    }

    // Total das opções (unitário)
    let optionsTotal = 0;
    const optionsContainer = document.getElementById(`options-container-${machineId}`);
    if (optionsContainer) {
        optionsContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(option => {
            optionsTotal += safeNumber(option.value);
        });
    }

    // Cálculos totais considerando quantidade
    const basePriceUnitario = basePrice + voltageValue;
    const totalPriceUnitario = basePriceUnitario + optionsTotal;
    const totalPriceFinal = totalPriceUnitario * quantidade;

    updateElementText(`base-price-${machineId}`, `R$ ${basePriceUnitario.toLocaleString("pt-BR")}`);
    updateElementText(`total-price-${machineId}`, `R$ ${totalPriceFinal.toLocaleString("pt-BR")}`);

    // Atualiza total geral
    const roomId = machineElement.dataset.roomId;
    if (roomId) updateAllMachinesTotal(roomId);
}

/**
 * Atualiza valores das opções
 */
function updateOptionValues(machineId) {
    const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
    if (!machineElement) return;

    const typeSelect = machineElement.querySelector('.machine-type-select');
    const powerSelect = machineElement.querySelector('.machine-power-select');

    const selectedType = typeSelect?.value;
    const selectedPower = powerSelect?.value;

    if (!selectedType || !selectedPower || !window.machinesData) return;

    const machine = window.machinesData.find(m => m.type === selectedType);
    if (!machine?.options) return;

    machine.options.forEach(option => {
        const checkbox = document.getElementById(`option-${machineId}-${option.id}`);
        if (checkbox) {
            const optionValue = selectedPower && option.values?.[selectedPower] || 0;
            checkbox.value = optionValue;

            const priceDisplay = checkbox.closest('.option-item')?.querySelector('.option-price');
            if (priceDisplay) {
                priceDisplay.textContent = `+R$ ${optionValue.toLocaleString("pt-BR")}`;
            }
        }
    });

    calculateMachinePrice(machineId);
}

// =============================================================================
// GERENCIAMENTO DE TOTAL GERAL
// =============================================================================

/**
 * Calcula total de todas as máquinas
 */
function calculateAllMachinesTotal(roomId) {
    const container = document.getElementById(`machines-${roomId}`);
    if (!container) return 0;

    let total = 0;
    container.querySelectorAll('.climatization-machine').forEach(machineElement => {
        const machineId = machineElement.dataset.machineId;
        const priceElement = document.getElementById(`total-price-${machineId}`);
        if (priceElement) {
            const priceText = priceElement.textContent;
            const cleanText = priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            total += safeNumber(cleanText);
        }
    });

    return total;
}

/**
 * Atualiza display do total geral
 */
/**
 * Atualiza display do total geral
 */
function updateAllMachinesTotal(roomId) {
    const total = calculateAllMachinesTotal(roomId);
    const display = document.getElementById(`total-all-machines-price-${roomId}`);
    if (display) {
        display.textContent = `R$ ${total.toLocaleString('pt-BR')}`;
    }
    saveTotalToRoom(roomId, total);
    
    // 🔥 NOVO: Dispara evento de atualização
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomElement) {
        const projectId = roomElement.dataset.projectId;
        if (projectId) {
            document.dispatchEvent(new CustomEvent('valorAtualizado', {
                detail: { 
                    tipo: 'maquina',
                    roomId,
                    projectId,
                    valor: total
                }
            }));
        }
    }
}

/**
 * Salva total no servidor
 */
function saveTotalToRoom(roomId, total) {
    fetch('/obras')
        .then(response => response.ok ? response.json() : [])
        .then(obras => {
            for (const obra of obras) {
                for (const projeto of obra.projetos || []) {
                    for (const sala of projeto.salas || []) {
                        if (sala.id === roomId) {
                            sala.somavaloresmaquinatotal = total;
                            return fetch(`/obras/${obra.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(obra)
                            });
                        }
                    }
                }
            }
        })
        .catch(error => console.error('❌ Erro ao salvar total:', error));
}

// =============================================================================
// FUNÇÕES DE INTERAÇÃO DO USUÁRIO
// =============================================================================

function toggleMachineSection(button) {
    const content = button.closest(".climatization-machine").querySelector(".machine-content");
    const isCollapsed = content.classList.toggle("collapsed");
    button.textContent = isCollapsed ? "+" : "−";
}

function updateMachineTitle(input, machineId) {
    if (!input.value.trim()) {
        // 🆕 SE O USUÁRIO APAGAR O NOME, VOLTA PARA NOME SIMPLES
        const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
        const container = document.getElementById(`machines-${machineElement.dataset.roomId}`);
        const machineCount = container ? container.querySelectorAll(".climatization-machine").length : 1;
        input.value = `Maquina ${machineCount}`;
    }
}

function toggleOption(machineId, optionId) {
    const checkbox = document.getElementById(`option-${machineId}-${optionId}`);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function updateOptionSelection(machineId, optionId) {
    const checkbox = document.getElementById(`option-${machineId}-${optionId}`);
    const item = checkbox?.closest('.option-item');
    if (item) {
        item.classList.toggle('option-selected', checkbox.checked);
    }
}

/**
 * Atualiza quando a capacidade muda - AGORA SIM APLICA A LÓGICA COMPLETA
 */
function handlePowerChange(machineId) {
    calculateMachinePrice(machineId);
    updateOptionValues(machineId);
    
    // 🆕 ATUALIZAR NOME QUANDO A CAPACIDADE MUDAR - AGORA COM LÓGICA COMPLETA
    const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
    if (machineElement) {
        const typeSelect = machineElement.querySelector('.machine-type-select');
        const powerSelect = machineElement.querySelector('.machine-power-select');
        const roomId = machineElement.dataset.roomId;
        
        if (typeSelect && typeSelect.value && powerSelect && powerSelect.value) {
            // ATUALIZAR TODOS OS NOMES DO MESMO TIPO
            generateMachineName(typeSelect.value, roomId);
        } else if (typeSelect && typeSelect.value && (!powerSelect || !powerSelect.value)) {
            // 🆕 SE TEM TIPO MAS NÃO TEM CAPACIDADE, VOLTA PARA APENAS O TIPO
            const titleInput = machineElement.querySelector('.machine-title-editable');
            if (titleInput) {
                titleInput.value = typeSelect.value;
            }
        }
    }
}

function deleteMachine(machineId) {
    const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
    if (!machineElement) return;

    const roomId = machineElement.dataset.roomId;
    const container = machineElement.closest(".machines-container");

    machineElement.remove();

    // ATUALIZAR NOMES DAS MÁQUINAS RESTANTES
    if (roomId) {
        updateAllMachineNamesInRoom(roomId);
        updateAllMachinesTotal(roomId);
    }

    // Mostra mensagem se não houver máquinas
    if (container && container.querySelectorAll('.climatization-machine').length === 0) {
        showEmptyMessage(container, "Nenhuma máquina adicionada ainda.");
    }
}

// =============================================================================
// FUNÇÕES DE INTERAÇÃO PARA CONFIGURAÇÕES
// =============================================================================

/**
 * Alterna o estado de uma configuração
 */
function toggleConfig(machineId, configId) {
    const checkbox = document.getElementById(`config-${machineId}-${configId}`);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        handleConfigChange(machineId, configId);
    }
}

/**
 * Atualiza a seleção visual da configuração
 */
function updateConfigSelection(machineId, configId) {
    const checkbox = document.getElementById(`config-${machineId}-${configId}`);
    const item = checkbox?.closest('.config-option');
    if (item) {
        item.classList.toggle('config-selected', checkbox.checked);
    }
}

/**
 * MANIPULA MUDANÇAS NAS CONFIGURAÇÕES COM LÓGICA EXCLUSIVA
 */
function handleConfigChange(machineId, configId) {
    console.log(`🔄 handleConfigChange: máquina ${machineId}, config ${configId}`);
    
    const checkbox = document.getElementById(`config-${machineId}-${configId}`);
    if (!checkbox) return;
    
    const configName = checkbox.getAttribute('data-config-name');
    const isExclusiveGroup = checkbox.getAttribute('data-exclusive-group') === 'bocal-distribuicao';
    
    console.log(`🔍 Configuração: "${configName}", Exclusiva: ${isExclusiveGroup}, Marcada: ${checkbox.checked}`);
    
    // ATUALIZAÇÃO VISUAL
    updateConfigSelection(machineId, configId);
    
    // LÓGICA DE SELEÇÃO EXCLUSIVA
    if (isExclusiveGroup && checkbox.checked) {
        console.log(`🚫 Aplicando lógica exclusiva para configuração "${configName}"`);
        deselectOtherBocalOptions(machineId, configId);
    }
    
    // RECALCULAR PREÇO (se necessário)
    calculateMachinePrice(machineId);
}

/**
 * DESMARCA OUTRAS OPÇÕES DO GRUPO EXCLUSIVO "BOCAL"
 */
function deselectOtherBocalOptions(machineId, selectedConfigId) {
    console.log(`🚫 Desmarcando outras opções do grupo bocal, exceto ${selectedConfigId}`);
    
    const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
    if (!machineElement) return;
    
    const bocalCheckboxes = machineElement.querySelectorAll('input[data-exclusive-group="bocal-distribuicao"]');
    
    console.log(`🔍 Encontradas ${bocalCheckboxes.length} checkboxes do grupo bocal`);
    
    bocalCheckboxes.forEach(checkbox => {
        const configId = parseInt(checkbox.getAttribute('data-config-id'));
        const configName = checkbox.getAttribute('data-config-name');
        
        if (configId !== selectedConfigId && checkbox.checked) {
            console.log(`❌ Desmarcando configuração ${configId}: "${configName}"`);
            checkbox.checked = false;
            updateConfigSelection(machineId, configId);
        }
    });
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

function showEmptyMessage(container, message) {
    const existing = container.querySelector('.empty-message');
    if (existing) existing.remove();
    container.insertAdjacentHTML('beforeend', `<p class="empty-message">${message}</p>`);
}

function removeEmptyMessage(container) {
    const emptyMsg = container.querySelector('.empty-message');
    if (emptyMsg) emptyMsg.remove();
}

// =============================================================================
// EXPORTAÇÕES E GLOBAIS
// =============================================================================

export {
    buildMachinesSection,
    loadMachinesData,
    loadSavedMachines,
    addMachine,
    buildMachineHTML,
    toggleMachineSection,
    updateMachineTitle,
    updateMachineOptions,
    updateMachineUI,
    resetMachineFields,
    calculateMachinePrice,
    deleteMachine,
    toggleOption,
    updateOptionSelection,
    updateOptionValues,
    handlePowerChange,
    calculateAllMachinesTotal,
    updateAllMachinesTotal,
    generateMachineId,
    buildConfigHTML,
    toggleConfig,
    updateConfigSelection,
    handleConfigChange, 
    deselectOtherBocalOptions, 
    buildOptionsHTML,
    updateSelectUI,
    showEmptyMessage,
    removeEmptyMessage,
    updateQuantity,
    generateMachineName,
    getGenericCapacityValue,
    updateAllMachineNamesInRoom,
    updateMachineNameOnPowerChange
};

// 🆕 DISPONIBILIZAÇÃO GLOBAL COMPLETA
if (typeof window !== 'undefined') {
    const functions = {
        // Funções principais
        addMachine,
        toggleMachineSection,
        updateMachineTitle,
        updateMachineOptions,
        updateMachineUI,
        resetMachineFields,
        calculateMachinePrice,
        deleteMachine,
        updateQuantity,
        // Opções
        toggleOption,
        updateOptionSelection,
        updateOptionValues,
        handlePowerChange,
        
        // CONFIGURAÇÕES 
        buildConfigHTML,
        toggleConfig,
        updateConfigSelection,
        handleConfigChange, 
        deselectOtherBocalOptions, 
        
        // Totais
        calculateAllMachinesTotal,
        updateAllMachinesTotal,
        
        // Utilitários
        loadSavedMachines,
        generateMachineId,
        buildOptionsHTML,
        updateSelectUI,
        showEmptyMessage,
        removeEmptyMessage,
        
        // 🆕 NOMENCLATURA AUTOMÁTICA
        generateMachineName,
        getGenericCapacityValue,
        updateAllMachineNamesInRoom,
        updateMachineNameOnPowerChange
    };

    Object.assign(window, functions);
    console.log('✅ Todas as funções de máquinas carregadas no escopo global (incluindo nomenclatura automática)');
}

// ✅ GARANTIR QUE AS FUNÇÕES ESTEJAM DISPONÍVEIS
setTimeout(() => {
    if (typeof window !== 'undefined') {
        if (!window.generateMachineName) {
            window.generateMachineName = generateMachineName;
            console.log('✅ generateMachineName forçada no escopo global');
        }
        if (!window.updateAllMachineNamesInRoom) {
            window.updateAllMachineNamesInRoom = updateAllMachineNamesInRoom;
            console.log('✅ updateAllMachineNamesInRoom forçada no escopo global');
        }
    }
}, 2000);