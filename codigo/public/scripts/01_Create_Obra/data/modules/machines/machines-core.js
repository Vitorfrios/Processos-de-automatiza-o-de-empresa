/**
 * data/modules/machines/machines-core.js
 * Sistema unificado de máquinas - FUSÃO OTIMIZADA: machineManagement.js + machinesBuilder.js
 * Versão reduzida de ~1100 para ~400 linhas
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
function buildMachineHTML(machineId, displayNumber, machines, roomId) {
    const machineTypes = machines.map(m => m.type);

    return `
    <div class="climatization-machine" data-machine-id="${machineId}" data-room-id="${roomId}">
      <div class="machine-header">
        <button class="minimizer" onclick="toggleMachineSection(this)">−</button>
        <input type="text" class="machine-title-editable" value="Maquina${displayNumber}" 
               onchange="updateMachineTitle(this, '${machineId}')" onclick="this.select()">
        <button class="btn btn-delete-small" onclick="deleteMachine('${machineId}')">Remover</button>
      </div>
      <div class="machine-content" id="machine-content-${machineId}">
        <div class="climatization-form-grid">
          ${buildFormGroup("Tipo:", buildSelect(machineTypes, machineId, "machine-type-select", "updateMachineOptions(this)"))}
          ${buildFormGroup("Capacidade:", buildSelect([], machineId, "machine-power-select", `handlePowerChange('${machineId}')`, true))}
          ${buildFormGroup("Tensão:", buildSelect([], machineId, "machine-voltage-select", `calculateMachinePrice('${machineId}')`, true))}
          ${buildFormGroup("Preço Base:", `<div class="price-display" id="base-price-${machineId}">R$ 0,00</div>`)}
          ${buildFormGroup("Preço Total:", `<div class="price-display" id="total-price-${machineId}">R$ 0,00</div>`)}
        </div>
        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineId}">
            <p class="empty-options-message">Selecione tipo e capacidade</p>
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

    return `
    <div class="climatization-machine" data-machine-id="${machineId}" data-room-id="${savedMachine.roomId || ''}">
      <div class="machine-header">
        <button class="minimizer" onclick="toggleMachineSection(this)">−</button>
        <input type="text" class="machine-title-editable" value="${savedMachine.nome || 'Maquina'}"
               onchange="updateMachineTitle(this, '${machineId}')" onclick="this.select()">
        <button class="btn btn-delete-small" onclick="deleteMachine('${machineId}')">Remover</button>
      </div>
      <div class="machine-content" id="machine-content-${machineId}">
        <div class="climatization-form-grid">
          ${buildFormGroup("Tipo:", buildSelect(allMachines.map(m => m.type), machineId, "machine-type-select", "updateMachineOptions(this)", false, savedMachine.tipo))}
          ${buildFormGroup("Capacidade:", buildSelect(potencies, machineId, "machine-power-select", `handlePowerChange('${machineId}')`, false, savedMachine.potencia))}
          ${buildFormGroup("Tensão:", buildSelect(voltages, machineId, "machine-voltage-select", `calculateMachinePrice('${machineId}')`, false, savedMachine.tensao))}
          ${buildFormGroup("Preço Base:", `<div class="price-display" id="base-price-${machineId}">R$ 0,00</div>`)}
          ${buildFormGroup("Preço Total:", `<div class="price-display" id="total-price-${machineId}">R$ ${savedMachine.precoTotal.toLocaleString("pt-BR")}</div>`)}
        </div>
        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineId}">
            ${buildOptionsHTML(machineType.options, machineId, savedMachine.opcoesSelecionadas, savedMachine.potencia)}
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

// =============================================================================
// GERENCIAMENTO DE MÁQUINAS
// =============================================================================

/**
 * Adiciona nova máquina
 */
async function addMachine(roomId) {
    const container = document.getElementById(`machines-${roomId}`);
    if (!container) return;

    const machineCount = container.querySelectorAll(".climatization-machine").length;
    const machineId = generateMachineId(roomId);

    try {
        const machinesData = await loadMachinesData();
        if (!machinesData.machines.length) throw new Error("Nenhum dado disponível");

        const machineHTML = buildMachineHTML(machineId, machineCount + 1, machinesData.machines, roomId);
        container.insertAdjacentHTML("beforeend", machineHTML);

        // Remove mensagem de vazio
        const emptyMsg = container.querySelector('.empty-message');
        if (emptyMsg) emptyMsg.remove();

        updateAllMachinesTotal(roomId);
        console.log(`✅ Máquina ${machineCount+1} adicionada à sala ${roomId}`);
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
            });
            updateAllMachinesTotal(roomId);
        }, 200);

    } catch (error) {
        console.error("❌ Erro ao carregar máquinas salvas:", error);
    }
}

// =============================================================================
// ATUALIZAÇÃO DE UI
// =============================================================================

/**
 * Atualiza opções da máquina
 */
async function updateMachineOptions(selectElement) {
    const machineId = selectElement.dataset.machineId;
    const selectedType = selectElement.value;

    if (!selectedType) {
        resetMachineFields(machineId);
        return;
    }

    try {
        const machinesData = await loadMachinesData();
        const machine = machinesData.machines.find(m => m.type === selectedType);

        if (machine) {
            updateMachineUI(machineId, machine);
        } else {
            resetMachineFields(machineId);
        }
    } catch (error) {
        console.error("❌ Erro ao atualizar opções:", error);
        resetMachineFields(machineId);
    }
}

/**
 * Atualiza UI completa da máquina
 */
function updateMachineUI(machineId, machine) {
    const potencies = Object.keys(machine.baseValues || {});
    const voltages = (machine.voltages || []).map(v => v.name);

    updateSelectUI(`.machine-power-select[data-machine-id="${machineId}"]`, potencies, false);
    updateSelectUI(`.machine-voltage-select[data-machine-id="${machineId}"]`, voltages, false);

    const optionsContainer = document.getElementById(`options-container-${machineId}`);
    if (optionsContainer) {
        optionsContainer.innerHTML = machine.options?.length
            ? buildOptionsHTML(machine.options, machineId)
            : '<p class="empty-options-message">Nenhuma opção disponível</p>';
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
        select.innerHTML = `<option value="">Selecionar</option>${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')
            }`;
        select.disabled = disabled;
    }
}

/**
 * Reseta campos da máquina
 */
function resetMachineFields(machineId) {
    updateSelectUI(`.machine-power-select[data-machine-id="${machineId}"]`, [], true);
    updateSelectUI(`.machine-voltage-select[data-machine-id="${machineId}"]`, [], true);

    const optionsContainer = document.getElementById(`options-container-${machineId}`);
    if (optionsContainer) {
        optionsContainer.innerHTML = '<p class="empty-options-message">Selecione um tipo de máquina</p>';
    }

    updateElementText(`base-price-${machineId}`, 'R$ 0,00');
    updateElementText(`total-price-${machineId}`, 'R$ 0,00');
}

// =============================================================================
// CÁLCULOS DE PREÇO
// =============================================================================

/**
 * Calcula preço da máquina
 */
function calculateMachinePrice(machineId) {
    const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
    if (!machineElement) return;

    const typeSelect = machineElement.querySelector('.machine-type-select');
    const powerSelect = machineElement.querySelector('.machine-power-select');
    const voltageSelect = machineElement.querySelector('.machine-voltage-select');

    const selectedType = typeSelect?.value;
    const selectedPower = powerSelect?.value;
    const selectedVoltage = voltageSelect?.value;

    let basePrice = 0, voltageValue = 0;

    // Preço base
    if (selectedType && selectedPower && window.machinesData) {
        const machine = window.machinesData.find(m => m.type === selectedType);
        basePrice = machine?.baseValues?.[selectedPower] || 0;
    }

    // Valor da tensão
    if (selectedType && selectedVoltage && window.machinesData) {
        const machine = window.machinesData.find(m => m.type === selectedType);
        const voltageObj = machine?.voltages?.find(v => v.name === selectedVoltage);
        voltageValue = voltageObj?.value || 0;
    }

    // Total das opções
    let optionsTotal = 0;
    const optionsContainer = document.getElementById(`options-container-${machineId}`);
    if (optionsContainer) {
        optionsContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(option => {
            optionsTotal += safeNumber(option.value);
        });
    }

    const totalPrice = basePrice + optionsTotal + voltageValue;

    updateElementText(`base-price-${machineId}`, `R$ ${basePrice.toLocaleString("pt-BR")}`);
    updateElementText(`total-price-${machineId}`, `R$ ${totalPrice.toLocaleString("pt-BR")}`);

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
function updateAllMachinesTotal(roomId) {
    const total = calculateAllMachinesTotal(roomId);
    const display = document.getElementById(`total-all-machines-price-${roomId}`);
    if (display) {
        display.textContent = `R$ ${total.toLocaleString('pt-BR')}`;
    }
    saveTotalToRoom(roomId, total);
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
    if (!input.value.trim()) input.value = `Maquina${machineId}`;
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

function handlePowerChange(machineId) {
    calculateMachinePrice(machineId);
    updateOptionValues(machineId);
}

function deleteMachine(machineId) {
    const machineElement = document.querySelector(`[data-machine-id="${machineId}"]`);
    if (!machineElement) return;

    const roomId = machineElement.dataset.roomId;
    const container = machineElement.closest(".machines-container");

    machineElement.remove();

    if (roomId) updateAllMachinesTotal(roomId);

    // Mostra mensagem se não houver máquinas
    if (container && container.querySelectorAll('.climatization-machine').length === 0) {
        showEmptyMessage(container, "Nenhuma máquina adicionada ainda.");
    }
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
    calculateMachinePrice,
    deleteMachine,
    toggleOption,
    updateOptionSelection,
    updateOptionValues,
    handlePowerChange,
    calculateAllMachinesTotal,
    updateAllMachinesTotal,
    generateMachineId
};

// Disponibilização global
if (typeof window !== 'undefined') {
    const functions = {
        addMachine, toggleMachineSection, updateMachineTitle, updateMachineOptions,
        calculateMachinePrice, deleteMachine, deleteClimatizationMachine: deleteMachine,
        handleOptionClick: toggleOption, updateOptionSelection, updateOptionValues,
        handlePowerChange, calculateTotalAllMachinesPrice: calculateAllMachinesTotal,
        updateAllMachinesTotalDisplay: updateAllMachinesTotal, loadSavedMachines,
        generateMachineId
    };

    Object.assign(window, functions);
}