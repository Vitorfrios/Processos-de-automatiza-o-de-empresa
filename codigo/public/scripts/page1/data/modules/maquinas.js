// ========== CONFIGURAÇÕES E ESTADOS ==========
// REMOVA o import se não está funcionando
// import { API_CONFIG } from '../../config/config.js';

// Defina API_CONFIG diretamente já que sabemos a URL
const API_CONFIG = {
  data: "http://localhost:3001"
};

const capacityConfig = {
  maxInitAttempts: 3,
  initDelay: 500,
  fallbackFatorSeguranca: 10
};

const capacityState = new Map();
let machinesData = null;

// ========== SEÇÃO DE MÁQUINAS ==========

function buildMachinesSection(projectName, roomName) {
  const roomId = `${projectName}-${roomName}`;
  
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
  `;
}

function buildCapacityCalculationTable(roomId) {
  scheduleCapacityInit(roomId);
  
  // Buscar o valor do backup dos inputs de climatização
  const backupFromInputs = getBackupFromClimaInputs(roomId);
  console.log(`[CAPACITY] Backup dos inputs para tabela: ${backupFromInputs}`);
  
  return `
    <div class="capacity-calculation-table">
      <h5 class="table-title">Cálculo de Capacidade de Refrigeração</h5>
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
                     class="capacity-input" onchange="calculateCapacitySolution('${roomId}')">
            </td>
            <td>
              <select id="capacidade-unitaria-${roomId}" class="capacity-select" 
                      onchange="calculateCapacitySolution('${roomId}')">
                <option value="1">1 TR</option>
                <option value="2">2 TR</option>
                <option value="3">3 TR</option>
                <option value="4">4 TR</option>
                <option value="5">5 TR</option>
                <option value="7.5">7,5 TR</option>
                <option value="10">10 TR</option>
                <option value="12.5">12,5 TR</option>
                <option value="15">15 TR</option>
                <option value="20">20 TR</option>
                <option value="25">25 TR</option>
                <option value="30">30 TR</option>
              </select>
            </td>
            <td id="solucao-${roomId}">0</td>
            <td class="backup-cell">
              <div class="backup-selection">
                <select class="backup-select" onchange="updateBackupConfiguration(this)">
                  <option value="n" ${backupFromInputs === 'n' ? 'selected' : ''}>n</option>
                  <option value="n+1" ${backupFromInputs === 'n+1' ? 'selected' : ''}>n+1</option>
                  <option value="n+2" ${backupFromInputs === 'n+2' ? 'selected' : ''}>n+2</option>
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
  `;
}

// Função auxiliar para buscar backup dos inputs de climatização
function getBackupFromClimaInputs(roomId) {
  const roomContent = document.getElementById(`room-content-${roomId}`);
  if (roomContent) {
    const backupInput = roomContent.querySelector(`.clima-input[data-field="backup"]`);
    if (backupInput?.value) {
      return backupInput.value;
    }
  }
  return 'n'; // Valor padrão
}

// ========== CARREGAMENTO DOS DADOS DAS MÁQUINAS ==========

// ========== CARREGAMENTO DOS DADOS DAS MÁQUINAS ==========

async function loadMachinesData() {
  if (machinesData) return machinesData;

  try {
    const url = `${API_CONFIG.data}/machines`;
    console.log('🔍 Tentando carregar dados de:', url);
    
    const response = await fetch(url);
    
    console.log('📡 Status da resposta:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos (array):', data);
    
    // CORREÇÃO: Os dados vêm como array direto, não como {machines: [...]}
    machinesData = { machines: data }; // Convertemos array para o formato esperado
    
    console.log(`📋 Total de máquinas carregadas: ${machinesData.machines.length}`);
    
    return machinesData;
    
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    throw error;
  }
}

// ========== GERENCIAMENTO DE MÁQUINAS DE CLIMATIZAÇÃO ==========

async function addMachine(roomId) {
  const machinesContainer = document.getElementById(`machines-${roomId}`);
  const machineCount = machinesContainer.querySelectorAll(".climatization-machine").length + 1;

  removeEmptyMachinesMessage(machinesContainer);

  try {
    console.log('🔄 Iniciando carregamento de dados para máquina...');
    const data = await loadMachinesData();
    
    console.log('📋 Dados recebidos no addMachine:', data);
    
    // Verificar se os dados foram carregados corretamente
    if (!data || !data.machines || data.machines.length === 0) {
      throw new Error('Nenhum dado de máquina disponível');
    }
    
    console.log(`✅ ${data.machines.length} máquinas carregadas`);
    
    const machineHTML = buildClimatizationMachineHTML(machineCount, data.machines);
    machinesContainer.insertAdjacentHTML("beforeend", machineHTML);
    
    console.log('🎉 Máquina adicionada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar máquina:', error);
    alert(`Erro ao carregar dados: ${error.message}. Verifique o console.`);
  }
}

function removeEmptyMachinesMessage(container) {
  const emptyMessage = container.querySelector(".empty-message");
  if (emptyMessage) emptyMessage.remove();
}

function buildClimatizationMachineHTML(machineCount, machines) {
  const machineTypes = machines.map(m => m.type);
  const firstMachine = machines[0];
  
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
          <div class="form-group">
            <label>Tipo de Equipamento:</label>
            <select class="form-input machine-type-select" 
                    data-machine-index="${machineCount}"
                    onchange="updateMachineOptions(this)">
              ${machineTypes.map(type => 
                `<option value="${type}">${type}</option>`
              ).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Potência (TR):</label>
            <select class="form-input machine-potency-select" 
                    data-machine-index="${machineCount}"
                    onchange="calculateMachinePrice(${machineCount})">
              ${firstMachine.potencies.map(potency => 
                `<option value="${potency}">${potency}</option>`
              ).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Tensão:</label>
            <select class="form-input machine-voltage-select" 
                    data-machine-index="${machineCount}"
                    onchange="calculateMachinePrice(${machineCount})">
              ${firstMachine.voltages.map(voltage => 
                `<option value="${voltage}">${voltage}</option>`
              ).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Preço Base:</label>
            <div class="price-display" id="base-price-${machineCount}">
              R$ ${firstMachine.baseValue.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineCount}">
            ${firstMachine.options.map(option => `
              <div class="option-checkbox">
                <input type="checkbox" 
                      value="${option.value}" 
                      data-option-id="${option.id}"
                      onchange="calculateMachinePrice(${machineCount})"
                      id="option-${machineCount}-${option.id}">
                <label for="option-${machineCount}-${option.id}">
                  <div class="option-text-wrapper">
                    <div class="option-name">${option.name}</div>
                    <div class="option-price">+R$ ${option.value.toLocaleString('pt-BR')}</div>
                  </div>
                </label>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="machine-total-price">
          <strong>Preço Total: <span id="total-price-${machineCount}">R$ ${firstMachine.baseValue.toLocaleString('pt-BR')}</span></strong>
        </div>
      </div>
    </div>
  `;
}

// ========== NOVAS FUNÇÕES PARA EDITAR E MINIMIZAR ==========

function toggleMachineSection(button) {
  const machineItem = button.closest('.climatization-machine');
  const machineContent = machineItem.querySelector('.machine-content');
  const isCollapsed = machineContent.classList.contains('collapsed');

  if (isCollapsed) {
    machineContent.classList.remove('collapsed');
    button.textContent = '−';
  } else {
    machineContent.classList.add('collapsed');
    button.textContent = '+';
  }
}

function updateMachineTitle(input, machineIndex) {
  const newTitle = input.value.trim();
  if (!newTitle) {
    input.value = `Equipamento de Climatização ${machineIndex}`;
  }
  console.log(`Máquina ${machineIndex} renomeada para: ${newTitle}`);
}


// ========== ATUALIZAÇÃO DINÂMICA DAS OPÇÕES ==========

async function updateMachineOptions(selectElement) {
  const machineIndex = selectElement.getAttribute('data-machine-index');
  const selectedType = selectElement.value;
  
  try {
    const data = await loadMachinesData();
    const selectedMachine = data.machines.find(m => m.type === selectedType);
    
    if (!selectedMachine) {
      console.error('Máquina não encontrada:', selectedType);
      console.log('Máquinas disponíveis:', data.machines.map(m => m.type));
      return;
    }
    
    console.log('🔄 Atualizando opções para:', selectedType, selectedMachine);
    
    // Atualizar opções de potência
    const potencySelect = document.querySelector(`.machine-potency-select[data-machine-index="${machineIndex}"]`);
    if (potencySelect && selectedMachine.potencies) {
      potencySelect.innerHTML = selectedMachine.potencies.map(potency => 
        `<option value="${potency}">${potency}</option>`
      ).join('');
    }
    
    // Atualizar opções de tensão
    const voltageSelect = document.querySelector(`.machine-voltage-select[data-machine-index="${machineIndex}"]`);
    if (voltageSelect && selectedMachine.voltages) {
      voltageSelect.innerHTML = selectedMachine.voltages.map(voltage => 
        `<option value="${voltage}">${voltage}</option>`
      ).join('');
    }
    
    // Atualizar preço base
    const basePriceElement = document.getElementById(`base-price-${machineIndex}`);
    if (basePriceElement && selectedMachine.baseValue !== undefined) {
      basePriceElement.textContent = `R$ ${selectedMachine.baseValue.toLocaleString('pt-BR')}`;
    }
    
    // Atualizar opções adicionais - CORRIGIDO para a nova estrutura
    const optionsContainer = document.getElementById(`options-container-${machineIndex}`);
    if (optionsContainer && selectedMachine.options) {
      optionsContainer.innerHTML = selectedMachine.options.map(option => `
        <div class="option-checkbox">
          <input type="checkbox" 
                 value="${option.value}" 
                 data-option-id="${option.id}"
                 onchange="calculateMachinePrice(${machineIndex})"
                 id="option-${machineIndex}-${option.id}">
          <label for="option-${machineIndex}-${option.id}">
            <div class="option-text-wrapper">
              <div class="option-name">${option.name}</div>
              <div class="option-price">+R$ ${option.value.toLocaleString('pt-BR')}</div>
            </div>
          </label>
        </div>
      `).join('');
    }
    
    // Recalcular preço
    calculateMachinePrice(machineIndex);
    
  } catch (error) {
    console.error('Erro ao atualizar opções da máquina:', error);
  }
}

// ========== CÁLCULO DO PREÇO ==========

function calculateMachinePrice(machineIndex) {
  try {
    const basePriceElement = document.getElementById(`base-price-${machineIndex}`);
    if (!basePriceElement) return;
    
    const basePriceText = basePriceElement.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
    const basePrice = parseFloat(basePriceText) || 0;
    
    const optionsContainer = document.getElementById(`options-container-${machineIndex}`);
    let optionsTotal = 0;
    
    if (optionsContainer) {
      const selectedOptions = optionsContainer.querySelectorAll('input[type="checkbox"]:checked');
      selectedOptions.forEach(option => {
        optionsTotal += parseFloat(option.value) || 0;
      });
    }
    
    const totalPrice = basePrice + optionsTotal;
    const totalPriceElement = document.getElementById(`total-price-${machineIndex}`);
    
    if (totalPriceElement) {
      totalPriceElement.textContent = `R$ ${totalPrice.toLocaleString('pt-BR')}`;
    }
    
  } catch (error) {
    console.error('Erro ao calcular preço:', error);
  }
}

// ========== EXCLUSÃO DE MÁQUINA ==========

function deleteClimatizationMachine(button) {
  if (!confirm("Deseja remover este equipamento de climatização?")) return;

  const machineItem = button.closest(".climatization-machine");
  const machinesContainer = machineItem.closest(".machines-container");

  machineItem.remove();
  showEmptyMachinesMessageIfNeeded(machinesContainer);
}

function showEmptyMachinesMessageIfNeeded(container) {
  if (container.querySelectorAll(".climatization-machine").length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhuma máquina adicionada ainda.</p>';
  }
}

// ========== FUNÇÕES EXISTENTES ==========

function scheduleCapacityInit(roomId) {
  if (capacityState.has(roomId)) return;

  capacityState.set(roomId, {
    initialized: false,
    attempts: 0
  });

  setTimeout(() => initializeCapacitySystem(roomId), capacityConfig.initDelay);
}

function initializeCapacitySystem(roomId) {
  const state = capacityState.get(roomId);
  if (!state || state.initialized) return;

  state.attempts++;

  const systemConstantsReady = window.systemConstants &&
    window.systemConstants.FATOR_SEGURANCA_CAPACIDADE !== undefined;

  if (systemConstantsReady || state.attempts >= capacityConfig.maxInitAttempts) {
    const fatorSeguranca = systemConstantsReady ?
      window.systemConstants.FATOR_SEGURANCA_CAPACIDADE :
      capacityConfig.fallbackFatorSeguranca;

    applyFatorSeguranca(roomId, fatorSeguranca);
    state.initialized = true;
  }
}

function applyFatorSeguranca(roomId, fatorSeguranca) {
  const inputFator = document.getElementById(`fator-seguranca-${roomId}`);
  if (!inputFator) return;

  inputFator.value = fatorSeguranca;
  calculateCapacitySolution(roomId);
}

function getThermalLoadTR(roomId) {
  try {
    // Tentar elemento total-tr primeiro
    const totalTRElement = document.getElementById(`total-tr-${roomId}`);
    if (totalTRElement && totalTRElement.textContent) {
      const trValue = parseFloat(totalTRElement.textContent) || 0;
      console.log(`[CAPACITY] TR da sala ${roomId}: ${trValue} (do elemento total-tr)`);
      return trValue;
    }
    
    // Fallback para cálculo a partir de W
    const totalGanhosWElement = document.getElementById(`total-ganhos-w-${roomId}`);
    if (totalGanhosWElement && totalGanhosWElement.textContent) {
      const totalW = parseFloat(totalGanhosWElement.textContent) || 0;
      const trValue = totalW / 3517;
      console.log(`[CAPACITY] TR da sala ${roomId}: ${trValue} (calculado de W: ${totalW}W)`);
      return trValue;
    }
    
    console.warn(`[CAPACITY] Não foi possível obter carga térmica para sala ${roomId}`);
    return 0;
    
  } catch (error) {
    console.error(`[CAPACITY] Erro ao obter carga térmica para sala ${roomId}:`, error);
    return 0;
  }
}

function calculateCapacitySolution(roomId) {
  try {
    console.log(`[CAPACITY] Calculando capacidade para sala: ${roomId}`);
    
    const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`);
    const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`);
    
    if (!fatorSegurancaInput || !capacidadeUnitariaSelect) {
      console.warn(`[CAPACITY] Elementos não encontrados para sala ${roomId}`);
      return;
    }
    
    const cargaEstimada = getThermalLoadTR(roomId);
    const fatorSeguranca = parseFloat(fatorSegurancaInput.value) / 100;
    const capacidadeUnitaria = parseFloat(capacidadeUnitariaSelect.value);
    const backupType = getBackupFromClimatization(roomId);
    
    const safeFatorSeguranca = isNaN(fatorSeguranca) ? 0.1 : fatorSeguranca;
    const safeCapacidadeUnitaria = isNaN(capacidadeUnitaria) ? 1 : capacidadeUnitaria;

    console.log(`[CAPACITY] Dados - Carga: ${cargaEstimada}, Fator: ${safeFatorSeguranca}, Cap. Unit: ${safeCapacidadeUnitaria}, Backup: ${backupType}`);

    const capacidadeNecessaria = cargaEstimada * (1 + safeFatorSeguranca);
    const unidadesOperacionais = Math.ceil(capacidadeNecessaria / safeCapacidadeUnitaria);
    const unidadesTotais = applyBackupConfiguration(unidadesOperacionais, backupType);

    const total = unidadesOperacionais * safeCapacidadeUnitaria;
    const folga = cargaEstimada > 0 ? ((total / cargaEstimada) - 1) * 100 : 0;

    console.log(`[CAPACITY] Resultados - Operacionais: ${unidadesOperacionais}, Com Backup: ${unidadesTotais}, Total: ${total}`);

    updateCapacityDisplay(roomId, cargaEstimada, unidadesOperacionais, unidadesTotais, total, folga, backupType);
    
  } catch (error) {
    console.error(`[CAPACITY] Erro ao calcular capacidade para sala ${roomId}:`, error);
  }
}

function applyBackupConfiguration(unidadesOperacionais, backupType) {
  console.log(`[BACKUP] Aplicando configuração: ${unidadesOperacionais} unidades, backup: ${backupType}`);
  
  switch(backupType) {
    case 'n+1':
      const resultN1 = unidadesOperacionais + 1;
      console.log(`[BACKUP] n+1: ${unidadesOperacionais} + 1 = ${resultN1}`);
      return resultN1;
    case 'n+2':
      const resultN2 = unidadesOperacionais + 2;
      console.log(`[BACKUP] n+2: ${unidadesOperacionais} + 2 = ${resultN2}`);
      return resultN2;
    case 'n':
    default:
      console.log(`[BACKUP] n: ${unidadesOperacionais} (sem backup adicional)`);
      return unidadesOperacionais;
  }
}

function getBackupFromClimatization(roomId) {
  // SEMPRE usar o valor da tabela de capacidade (que reflete a seleção atual)
  const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`);
  if (capacityTable) {
    const backupSelect = capacityTable.querySelector('.backup-select');
    if (backupSelect) {
      return backupSelect.value;
    }
  }
  
  // Fallback: buscar nos inputs
  return getBackupFromClimaInputs(roomId);
}

function updateCapacityDisplay(roomId, cargaEstimada, solucao, solucaoComBackup, total, folga, backupType) {
  updateElementText(`carga-estimada-${roomId}`, cargaEstimada.toFixed(1));
  updateElementText(`solucao-${roomId}`, solucao);
  updateElementText(`solucao-backup-${roomId}`, solucaoComBackup);
  updateElementText(`total-capacidade-${roomId}`, total.toFixed(1));
  updateElementText(`folga-${roomId}`, folga.toFixed(1) + '%');

  // Atualizar e habilitar o select de backup
  const backupSelect = document.querySelector(`#room-content-${roomId} .backup-select`);
  if (backupSelect) {
    backupSelect.value = backupType;
    backupSelect.disabled = false; // Garantir que está habilitado
  }
}

function updateElementText(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = value;
}

function updateCapacityFromThermalGains(roomId) {
  calculateCapacitySolution(roomId);
}
// ========== FUNÇÃO PARA ATUALIZAR BACKUP ==========

function updateBackupConfiguration(selectElement) {
  const roomId = findRoomIdFromBackupSelect(selectElement);
  if (roomId) {
    const newBackupValue = selectElement.value;
    console.log(`[BACKUP] Backup alterado na tabela para: ${newBackupValue}`);
    
    // 1. Sincronizar com os inputs de climatização
    syncBackupWithClimaInputs(roomId, newBackupValue);
    
    // 2. Recalcular a capacidade com o novo backup
    calculateCapacitySolution(roomId);
    
    console.log(`[BACKUP] Sincronização completa - Inputs atualizados e cálculo realizado`);
  }
}

function syncBackupWithClimaInputs(roomId, backupValue) {
  const roomContent = document.getElementById(`room-content-${roomId}`);
  if (roomContent) {
    const backupInputs = roomContent.querySelectorAll(`.clima-input[data-field="backup"]`);
    let updatedCount = 0;
    
    backupInputs.forEach(input => {
      if (input.value !== backupValue) {
        input.value = backupValue;
        updatedCount++;
        
        // Disparar evento change para atualizar qualquer cálculo dependente
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    });
    
    console.log(`[BACKUP] ${updatedCount} input(s) de climatização atualizado(s) para: ${backupValue}`);
  }
}

function findRoomIdFromBackupSelect(selectElement) {
  // Encontrar o roomId a partir do elemento select de backup
  const capacityTable = selectElement.closest('.capacity-calculation-table');
  if (!capacityTable) return null;
  
  const roomBlock = capacityTable.closest('.room-block');
  if (!roomBlock) return null;
  
  const roomContent = roomBlock.querySelector('[id^="room-content-"]');
  if (!roomContent) return null;
  
  return roomContent.id.replace('room-content-', '');
}

function initializeStaticCapacityTable() {
  const staticTable = document.querySelector('.capacity-calculation-table');
  if (staticTable) {
    scheduleCapacityInit('Projeto1-Sala1');
  }
}

document.addEventListener('DOMContentLoaded', initializeStaticCapacityTable);

if (typeof window.systemConstants === 'undefined') {
  window.systemConstants = {
    FATOR_SEGURANCA_CAPACIDADE: 10
  };
}
// ========== CARREGAMENTO DE MÁQUINAS SALVAS ==========

async function loadSavedMachines(roomId, savedMachines) {
  const machinesContainer = document.getElementById(`machines-${roomId}`);
  
  if (!savedMachines || !Array.isArray(savedMachines) || savedMachines.length === 0) {
    console.log(`[MAQUINAS] Nenhuma máquina salva para carregar na sala ${roomId}`);
    // Mesmo sem máquinas, calcular capacidade
    setTimeout(() => calculateCapacitySolution(roomId), 100);
    return;
  }

  removeEmptyMachinesMessage(machinesContainer);
  
  console.log(`[MAQUINAS] Carregando ${savedMachines.length} máquina(s) salva(s) para sala ${roomId}`);

  try {
    const machinesData = await loadMachinesData();
    
    savedMachines.forEach((savedMachine, index) => {
      const machineHTML = buildClimatizationMachineFromSavedData(
        index + 1, 
        savedMachine, 
        machinesData.machines
      );
      machinesContainer.insertAdjacentHTML("beforeend", machineHTML);
    });
    
    console.log(`[MAQUINAS] ${savedMachines.length} máquina(s) carregada(s) com sucesso`);
    
    // FORÇAR CÁLCULO APÓS CARREGAR MÁQUINAS
    setTimeout(() => {
      console.log(`[MAQUINAS] Acionando cálculo de capacidade para ${roomId} após carregar máquinas`);
      calculateCapacitySolution(roomId);
    }, 300);
    
  } catch (error) {
    console.error('[MAQUINAS] Erro ao carregar máquinas salvas:', error);
  }
}

function buildClimatizationMachineFromSavedData(machineCount, savedMachine, allMachines) {
  // Encontrar o tipo de máquina correspondente nos dados
  const machineType = allMachines.find(m => m.type === savedMachine.tipo);
  
  if (!machineType) {
    console.warn(`[MAQUINAS] Tipo de máquina não encontrado: ${savedMachine.tipo}`);
    return buildFallbackMachineFromSavedData(machineCount, savedMachine);
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
          <div class="form-group">
            <label>Tipo de Equipamento:</label>
            <select class="form-input machine-type-select" 
                    data-machine-index="${machineCount}"
                    onchange="updateMachineOptions(this)">
              ${allMachines.map(machine => 
                `<option value="${machine.type}" ${machine.type === savedMachine.tipo ? 'selected' : ''}>${machine.type}</option>`
              ).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Potência (TR):</label>
            <select class="form-input machine-potency-select" 
                    data-machine-index="${machineCount}"
                    onchange="calculateMachinePrice(${machineCount})">
              ${machineType.potencies.map(potency => 
                `<option value="${potency}" ${potency === savedMachine.potencia ? 'selected' : ''}>${potency}</option>`
              ).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Tensão:</label>
            <select class="form-input machine-voltage-select" 
                    data-machine-index="${machineCount}"
                    onchange="calculateMachinePrice(${machineCount})">
              ${machineType.voltages.map(voltage => 
                `<option value="${voltage}" ${voltage === savedMachine.tensao ? 'selected' : ''}>${voltage}</option>`
              ).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Preço Base:</label>
            <div class="price-display" id="base-price-${machineCount}">
              R$ ${savedMachine.precoBase.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        <div class="machine-options-section">
          <h6>Opções Adicionais:</h6>
          <div class="options-grid" id="options-container-${machineCount}">
            ${machineType.options.map(option => {
              const isChecked = savedMachine.opcoesSelecionadas?.some(selected => selected.id === option.id) || false;
              return `
                <div class="option-checkbox">
                  <input type="checkbox" 
                         value="${option.value}" 
                         data-option-id="${option.id}"
                         onchange="calculateMachinePrice(${machineCount})"
                         id="option-${machineCount}-${option.id}"
                         ${isChecked ? 'checked' : ''}>
                  <label for="option-${machineCount}-${option.id}">
                    <div class="option-text-wrapper">
                      <div class="option-name">${option.name}</div>
                      <div class="option-price">+R$ ${option.value.toLocaleString('pt-BR')}</div>
                    </div>
                  </label>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="machine-total-price">
          <strong>Preço Total: <span id="total-price-${machineCount}">R$ ${savedMachine.precoTotal.toLocaleString('pt-BR')}</span></strong>
        </div>
      </div>
    </div>
  `;
}

function buildFallbackMachineFromSavedData(machineCount, savedMachine) {
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
        <div style="padding: 1rem; background: #fff3cd; border-radius: 4px; margin: 1rem;">
          <strong>Aviso:</strong> Tipo de máquina "${savedMachine.tipo}" não encontrado nos dados atuais.
        </div>
        
        <div class="climatization-form-grid">
          <div class="form-group">
            <label>Tipo de Equipamento:</label>
            <select class="form-input machine-type-select" disabled>
              <option>${savedMachine.tipo} (não disponível)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Potência (TR):</label>
            <div class="form-input">${savedMachine.potencia}</div>
          </div>
          <div class="form-group">
            <label>Tensão:</label>
            <div class="form-input">${savedMachine.tensao}</div>
          </div>
          <div class="form-group">
            <label>Preço Base:</label>
            <div class="price-display">R$ ${savedMachine.precoBase.toLocaleString('pt-BR')}</div>
          </div>
        </div>

        <div class="machine-total-price">
          <strong>Preço Total: <span>R$ ${savedMachine.precoTotal.toLocaleString('pt-BR')}</span></strong>
        </div>
      </div>
    </div>
  `;
}
// ========== DETECÇÃO AUTOMÁTICA DE SALAS CARREGADAS ==========

function initializeMachinesOnLoad() {
  console.log('[MAQUINAS] Iniciando detecção de salas carregadas...');
  
  // Múltiplas tentativas para garantir que o DOM esteja carregado
  const attempts = [100, 500, 1000, 2000];
  
  attempts.forEach(delay => {
    setTimeout(() => {
      const roomBlocks = document.querySelectorAll('.room-block');
      console.log(`[MAQUINAS] Tentativa ${delay}ms: ${roomBlocks.length} sala(s) encontrada(s)`);
      
      roomBlocks.forEach(roomBlock => {
        const roomId = roomBlock.id.replace('room-content-', '');
        const machinesContainer = document.getElementById(`machines-${roomId}`);
        
        if (machinesContainer) {
          console.log(`[MAQUINAS] Container de máquinas encontrado para ${roomId}`);
          checkForSavedMachines(roomBlock, roomId);
        }
      });
    }, delay);
  });
}
// ========== CÁLCULO AUTOMÁTICO AO CARREGAR PROJETOS ==========

function initializeCapacityCalculations() {
  console.log('[CAPACITY] Iniciando cálculos automáticos de capacidade...');
  
  // Múltiplas tentativas para garantir que todas as salas estejam carregadas
  const attempts = [100, 500, 1000, 2000];
  
  attempts.forEach(delay => {
    setTimeout(() => {
      const roomBlocks = document.querySelectorAll('.room-block');
      console.log(`[CAPACITY] Tentativa ${delay}ms: ${roomBlocks.length} sala(s) encontrada(s)`);
      
      roomBlocks.forEach(roomBlock => {
        const roomId = roomBlock.id.replace('room-content-', '');
        
        // Verificar se a seção de capacidade existe para esta sala
        const capacityTable = roomBlock.querySelector('.capacity-calculation-table');
        if (!capacityTable) {
          console.log(`[CAPACITY] Sala ${roomId} não tem tabela de capacidade - pulando`);
          return;
        }
        
        // Verificar se os elementos necessários existem
        const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`);
        const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`);
        
        if (fatorSegurancaInput && capacidadeUnitariaSelect) {
          console.log(`[CAPACITY] Calculando capacidade para sala: ${roomId}`);
          calculateCapacitySolution(roomId);
        } else {
          console.warn(`[CAPACITY] Elementos não prontos para sala ${roomId} - tentando na próxima rodada`);
        }
      });
    }, delay);
  });
}

// Função para forçar atualização de todos os cálculos
function refreshAllCapacityCalculations() {
  const roomBlocks = document.querySelectorAll('.room-block');
  console.log(`[CAPACITY] Atualizando cálculos para ${roomBlocks.length} sala(s)`);
  
  roomBlocks.forEach(roomBlock => {
    const roomId = roomBlock.id.replace('room-content-', '');
    calculateCapacitySolution(roomId);
  });
}


// Função para quando o backup é alterado nos inputs de climatização
function onClimaBackupChange(inputElement) {
  const roomId = findRoomIdFromClimaInput(inputElement);
  if (roomId) {
    const newBackupValue = inputElement.value;
    console.log(`[BACKUP] Backup alterado nos inputs para: ${newBackupValue}`);
    
    // Sincronizar com a tabela de capacidade
    syncBackupWithCapacityTable(roomId, newBackupValue);
  }
}

function syncBackupWithCapacityTable(roomId, backupValue) {
  const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`);
  if (capacityTable) {
    const backupSelect = capacityTable.querySelector('.backup-select');
    if (backupSelect && backupSelect.value !== backupValue) {
      backupSelect.value = backupValue;
      console.log(`[BACKUP] Tabela de capacidade atualizada para: ${backupValue}`);
      
      // Recalcular capacidade
      calculateCapacitySolution(roomId);
    }
  }
}

function findRoomIdFromClimaInput(inputElement) {
  const roomContent = inputElement.closest('[id^="room-content-"]');
  if (roomContent) {
    return roomContent.id.replace('room-content-', '');
  }
  return null;
}
// ========== FUNÇÃO PARA SINCRONIZAR BACKUP APÓS CARREGAMENTO ==========

function syncCapacityTableBackup(roomId) {
  console.log(`[SYNC] Sincronizando backup da tabela para sala ${roomId}`);
  
  // Aguardar um pouco para garantir que os inputs estão carregados
  setTimeout(() => {
    const backupFromInputs = getBackupFromClimaInputs(roomId);
    const capacityTable = document.querySelector(`#room-content-${roomId} .capacity-calculation-table`);
    
    if (capacityTable) {
      const backupSelect = capacityTable.querySelector('.backup-select');
      if (backupSelect && backupSelect.value !== backupFromInputs) {
        backupSelect.value = backupFromInputs;
        console.log(`[SYNC] Backup da tabela atualizado para: ${backupFromInputs}`);
        
        // Recalcular com o backup correto
        calculateCapacitySolution(roomId);
      }
    }
  }, 500);
}
// ========== TORNAR FUNÇÕES GLOBAIS ==========

window.calculateMachinePrice = calculateMachinePrice;
window.updateMachineOptions = updateMachineOptions;
window.deleteClimatizationMachine = deleteClimatizationMachine;
window.toggleMachineSection = toggleMachineSection;
window.updateMachineTitle = updateMachineTitle;
window.addMachine = addMachine;
window.calculateCapacitySolution = calculateCapacitySolution;
window.updateCapacityFromThermalGains = updateCapacityFromThermalGains;
window.initializeStaticCapacityTable = initializeStaticCapacityTable;
window.loadSavedMachines = loadSavedMachines; // ← ADICIONAR ESTA LINHA
window.initializeMachinesOnLoad = initializeMachinesOnLoad; // ← E ESTA
window.updateBackupConfiguration = updateBackupConfiguration; // ← NOVA FUNÇÃO
window.syncCapacityTableBackup = syncCapacityTableBackup;

// Inicialização automática quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
  console.log('[CAPACITY] Página carregada - aguardando para cálculos automáticos...');
  
  // Aguardar um pouco mais para garantir que tudo está carregado
  setTimeout(() => {
    initializeCapacityCalculations();
  }, 1500);
});
// ========== VERIFICAÇÃO PERIÓDICA DE SINCRONIZAÇÃO ==========

function initializeBackupSync() {
  console.log('[SYNC] Iniciando verificação de sincronização de backup...');
  
  // Verificar a cada 2 segundos por 10 segundos (para cobrir diferentes tempos de carregamento)
  const intervals = [1000, 3000, 5000, 7000, 10000];
  
  intervals.forEach(delay => {
    setTimeout(() => {
      const roomBlocks = document.querySelectorAll('.room-block');
      console.log(`[SYNC] Verificação ${delay}ms: ${roomBlocks.length} sala(s)`);
      
      roomBlocks.forEach(roomBlock => {
        const roomId = roomBlock.id.replace('room-content-', '');
        syncCapacityTableBackup(roomId);
      });
    }, delay);
  });
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initializeBackupSync, 2000);
});
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
  initializeMachinesOnLoad,
  initializeCapacityCalculations,  // ← NOVA
  refreshAllCapacityCalculations   // ← NOVA
};