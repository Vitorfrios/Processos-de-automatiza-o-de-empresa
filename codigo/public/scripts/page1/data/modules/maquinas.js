// ========== CONFIGURAÇÕES E ESTADOS ==========
const capacityConfig = {
  maxInitAttempts: 3,
  initDelay: 500,
  fallbackFatorSeguranca: 10
};

const capacityState = new Map();

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
  // Inicialização única e controlada
  scheduleCapacityInit(roomId);
  
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
                <select class="backup-select" disabled>
                  <option value="n">n</option>
                  <option value="n+1">n+1</option>
                  <option value="n+2">n+2</option>
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

// ========== INICIALIZAÇÃO CONTROLADA ==========

function scheduleCapacityInit(roomId) {
  // Garantir inicialização única
  if (capacityState.has(roomId)) return;
  
  capacityState.set(roomId, {
    initialized: false,
    attempts: 0
  });
  
  // Delay único para inicialização
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
    
    console.log(`[CAPACITY] ${roomId} inicializado com fator: ${fatorSeguranca}%`);
  } else {
    // Tentar novamente apenas se não excedeu as tentativas
    setTimeout(() => initializeCapacitySystem(roomId), capacityConfig.initDelay);
  }
}

function applyFatorSeguranca(roomId, fatorSeguranca) {
  const inputFator = document.getElementById(`fator-seguranca-${roomId}`);
  if (!inputFator) return;
  
  inputFator.value = fatorSeguranca;
  calculateCapacitySolution(roomId);
}

// ========== CÁLCULOS DE CAPACIDADE ==========

function getThermalLoadTR(roomId) {
  // Tentar elemento total-tr primeiro
  const totalTRElement = document.getElementById(`total-tr-${roomId}`);
  if (totalTRElement) {
    return parseFloat(totalTRElement.textContent) || 0;
  }
  
  // Fallback para cálculo a partir de W
  const totalGanhosWElement = document.getElementById(`total-ganhos-w-${roomId}`);
  if (totalGanhosWElement) {
    const totalW = parseFloat(totalGanhosWElement.textContent) || 0;
    return totalW / 3517;
  }
  
  return 0;
}

function calculateCapacitySolution(roomId) {
  const cargaEstimada = getThermalLoadTR(roomId);
  const fatorSeguranca = parseFloat(document.getElementById(`fator-seguranca-${roomId}`).value) / 100;
  const capacidadeUnitaria = parseFloat(document.getElementById(`capacidade-unitaria-${roomId}`).value);
  const backupType = getBackupFromClimatization(roomId);
  
  // Cálculos
  const capacidadeNecessaria = cargaEstimada * (1 + fatorSeguranca);
  const unidadesOperacionais = Math.ceil(capacidadeNecessaria / capacidadeUnitaria);
  const unidadesTotais = applyBackupConfiguration(unidadesOperacionais, backupType);
  
  // CORREÇÃO: TOTAL usa unidades operacionais, não unidades totais com backup
  const total = unidadesOperacionais * capacidadeUnitaria; // ← AQUI ESTAVA O ERRO
  const folga = cargaEstimada > 0 ? ((total / cargaEstimada) - 1) * 100 : 0;
  
  updateCapacityDisplay(roomId, cargaEstimada, unidadesOperacionais, unidadesTotais, total, folga, backupType);
}

function applyBackupConfiguration(unidadesOperacionais, backupType) {
  switch(backupType) {
    case 'n+1':
      return unidadesOperacionais + 1;
    case 'n+2':
      return unidadesOperacionais + 2;
    case 'n':
    default:
      return unidadesOperacionais;
  }
}

function getBackupFromClimatization(roomId) {
  // Estratégia 1: Buscar no room-content específico
  const roomContent = document.getElementById(`room-content-${roomId}`);
  if (roomContent) {
    const backupSelect = roomContent.querySelector(`[data-field="backup"]`);
    if (backupSelect?.value) return backupSelect.value;
  }
  
  // Estratégia 2: Buscar em seções de climatização
  const climatizationSections = document.querySelectorAll('.section-block, [id*="-clima"]');
  for (let section of climatizationSections) {
    const backupSelect = section.querySelector(`[data-field="backup"]`);
    if (backupSelect?.value) return backupSelect.value;
  }
  
  // Estratégia 3: Buscar qualquer select de backup
  const backupSelects = document.querySelectorAll(`[data-field="backup"]`);
  for (let select of backupSelects) {
    if (select.value) return select.value;
  }
  
  return 'n'; // Valor padrão
}

function updateCapacityDisplay(roomId, cargaEstimada, solucao, solucaoComBackup, total, folga, backupType) {
  // Atualizar elementos visuais
  updateElementText(`carga-estimada-${roomId}`, cargaEstimada.toFixed(1));
  updateElementText(`solucao-${roomId}`, solucao);
  updateElementText(`solucao-backup-${roomId}`, solucaoComBackup);
  updateElementText(`total-capacidade-${roomId}`, total.toFixed(1));
  updateElementText(`folga-${roomId}`, folga.toFixed(1) + '%');
  
  // Atualizar visual do backup
  document.querySelectorAll(`.backup-select`).forEach(select => {
    select.value = backupType;
    select.disabled = false;
  });
}


function updateElementText(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = value;
}

// ========== GERENCIAMENTO DE MÁQUINAS ==========

function addMachine(roomId) {
  const machinesContainer = document.getElementById(`machines-${roomId}`);
  const machineCount = machinesContainer.querySelectorAll(".machine-item").length + 1;

  removeEmptyMachinesMessage(machinesContainer);

  const machineHTML = buildMachineHTML(machineCount);
  machinesContainer.insertAdjacentHTML("beforeend", machineHTML);
}

function removeEmptyMachinesMessage(container) {
  const emptyMessage = container.querySelector(".empty-message");
  if (emptyMessage) emptyMessage.remove();
}

function buildMachineHTML(machineCount) {
  return `
    <div class="machine-item">
      <div class="machine-header">
        <span class="machine-title">Máquina ${machineCount}</span>
        <button class="btn btn-delete-small" onclick="deleteMachine(this)">×</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nome:</label>
          <input type="text" class="form-input" data-field="maquina_nome" placeholder="Ex: Servidor Principal">
        </div>
        <div class="form-group">
          <label>Modelo:</label>
          <input type="text" class="form-input" data-field="maquina_modelo" placeholder="Ex: Dell PowerEdge">
        </div>
        <div class="form-group">
          <label>Potência (W):</label>
          <input type="number" class="form-input" data-field="maquina_potencia" placeholder="Ex: 500">
        </div>
        <div class="form-group">
          <label>Status:</label>
          <select class="form-input" data-field="maquina_status">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

function deleteMachine(button) {
  if (!confirm("Deseja remover esta máquina?")) return;

  const machineItem = button.closest(".machine-item");
  const machinesContainer = machineItem.closest(".machines-container");

  machineItem.remove();
  showEmptyMachinesMessageIfNeeded(machinesContainer);
}

function showEmptyMachinesMessageIfNeeded(container) {
  if (container.querySelectorAll(".machine-item").length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhuma máquina adicionada ainda.</p>';
  }
}

// ========== FUNÇÕES DE INTEGRAÇÃO ==========

function updateCapacityFromThermalGains(roomId) {
  calculateCapacitySolution(roomId);
}

// ========== INICIALIZAÇÃO PARA HTML ESTÁTICO ==========

function initializeStaticCapacityTable() {
  const staticTable = document.querySelector('.capacity-calculation-table');
  if (staticTable) {
    scheduleCapacityInit('Projeto1-Sala1');
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', initializeStaticCapacityTable);

// Fallback global para systemConstants
if (typeof window.systemConstants === 'undefined') {
  window.systemConstants = {
    FATOR_SEGURANCA_CAPACIDADE: 10
  };
}

export {
  buildMachinesSection,
  addMachine,
  deleteMachine,
  calculateCapacitySolution,
  updateCapacityFromThermalGains,
  initializeStaticCapacityTable
  // Não exporte funções internas a menos que sejam necessárias
};