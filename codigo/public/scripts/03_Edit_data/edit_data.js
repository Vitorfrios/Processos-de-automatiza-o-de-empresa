// ===== SISTEMA DE EDIÇÃO DE DADOS - CRUD COMPLETO =====

let systemData = {
    constants: {},
    machines: [],
    materials: {},
    empresas: []
};
let originalData = {};
let pendingChanges = new Set();
let currentEditItem = null;
let currentEditType = null;
let currentMachineIndex = null;

// ===== FUNÇÕES DE INICIALIZAÇÃO =====

async function loadData() {
    try {
        showLoading('Carregando dados do sistema...');
        
        // Carregar dados do backend
        const response = await fetch('/api/system-data');
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Verificar se os dados têm a estrutura correta
        if (!data || typeof data !== 'object') {
            throw new Error('Dados recebidos são inválidos');
        }
        
        // Garantir que todas as chaves existam
        systemData = {
            constants: data.constants || {},
            machines: Array.isArray(data.machines) ? data.machines : [],
            materials: data.materials || {},
            empresas: Array.isArray(data.empresas) ? data.empresas : []
        };
        
        originalData = JSON.parse(JSON.stringify(systemData));
        
        // Carregar dados nas tabelas
        loadConstants();
        loadMachines();
        loadMaterials();
        loadEmpresas();
        loadJSONEditor();
        populateMachineFilter();
        
        clearPendingChanges();
        showSuccess('Dados carregados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError(`Erro ao carregar dados: ${error.message}`);
        
        // Fallback para dados estáticos
        await loadFallbackData();
    } finally {
        hideLoading();
    }
}

async function loadFallbackData() {
    try {
        // Tentar carregar dados localmente
        systemData = {
            constants: {},
            machines: [],
            materials: {},
            empresas: []
        };
        
        loadConstants();
        loadMachines();
        loadMaterials();
        loadEmpresas();
        loadJSONEditor();
        populateMachineFilter();
        
        showWarning('Usando dados locais. Algumas funcionalidades podem não estar disponíveis.');
    } catch (error) {
        console.error('Erro no fallback:', error);
        showError('Não foi possível carregar os dados. Verifique sua conexão.');
    }
}

async function saveData() {
    try {
        if (pendingChanges.size === 0) {
            showInfo('Nenhuma alteração para salvar.');
            return;
        }
        
        showLoading('Salvando dados...');
        
        // Validar dados antes de salvar
        if (!validateData()) {
            throw new Error('Dados inválidos encontrados');
        }
        
        // Salvar via API
        const response = await fetch('/api/system-data/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(systemData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            originalData = JSON.parse(JSON.stringify(systemData));
            clearPendingChanges();
            showSuccess(result.message || 'Dados salvos com sucesso!');
            
            // Recarregar para garantir sincronização
            setTimeout(() => loadData(), 500);
        } else {
            throw new Error(result.error || 'Erro ao salvar dados');
        }
        
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showError(`Erro ao salvar: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// ===== FUNÇÕES DE TAB =====

function switchTab(tabName) {
    // Remover classe active de todas as tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Adicionar classe active à tab selecionada
    const tab = document.querySelector(`.tab[onclick*="${tabName}"]`);
    if (tab) tab.classList.add('active');
    
    const pane = document.getElementById(`${tabName}Tab`);
    if (pane) pane.classList.add('active');
    
    // Se for a tab de máquinas, fechar detalhe se aberto
    if (tabName !== 'machines') {
        closeMachineDetail();
    }
}

// ===== GERENCIAMENTO DE CONSTANTES =====

function loadConstants() {
    const tbody = document.getElementById('constantsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!systemData.constants) {
        systemData.constants = {};
    }
    
    Object.entries(systemData.constants).forEach(([key, value], index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" value="${escapeHtml(key)}" 
                       onchange="updateConstantKey(${index}, this.value)"
                       placeholder="Nome da constante"
                       class="form-input">
            </td>
            <td>
                <input type="text" value="${getConstantDescription(key)}"
                       onchange="updateConstantDescription('${key}', this.value)"
                       placeholder="Descrição"
                       class="form-input">
            </td>
            <td>
                <input type="number" value="${value}" step="0.0001"
                       onchange="updateConstantValue('${key}', this.value)"
                       class="form-input">
            </td>
            <td class="actions-cell">
                <button class="btn btn-small btn-danger" 
                        onclick="deleteConstant('${key}')"
                        title="Excluir constante">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Adicionar linha vazia para novo item
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 20px;">
            <button class="btn btn-success" onclick="addConstant()">
                <i class="icon-add"></i> Adicionar Nova Constante
            </button>
        </td>
    `;
    tbody.appendChild(emptyRow);
}

function getConstantDescription(key) {
    const descriptions = {
        'VARIAVEL_PD': 'Variável PD - Fator de projeto',
        'VARIAVEL_PS': 'Variável PS - Fator de segurança',
        'AUX_U_Value_Piso': 'Valor U para piso',
        'AUX_Fator_Iluminacao': 'Fator de iluminação',
        'FATOR_SEGURANCA_CAPACIDADE': 'Fator de segurança para capacidade'
    };
    return descriptions[key] || '';
}

function addConstant() {
    const newKey = `NOVA_CONSTANTE_${Date.now().toString().slice(-6)}`;
    systemData.constants[newKey] = 0;
    loadConstants();
    addPendingChange('constants');
    showInfo('Nova constante adicionada. Edite o nome e valor.');
    
    // Rolar para o novo item
    setTimeout(() => {
        const lastRow = document.querySelector('#constantsTableBody tr:nth-last-child(2)');
        if (lastRow) {
            lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = lastRow.querySelector('input[type="text"]');
            if (input) input.focus();
        }
    }, 100);
}

function updateConstantKey(index, newKey) {
    const oldKey = Object.keys(systemData.constants)[index];
    if (oldKey && newKey && newKey.trim() !== '' && newKey !== oldKey) {
        // Verificar se a nova chave já existe
        if (systemData.constants[newKey] !== undefined) {
            showError(`A constante "${newKey}" já existe!`);
            return;
        }
        
        systemData.constants[newKey] = systemData.constants[oldKey];
        delete systemData.constants[oldKey];
        loadConstants();
        addPendingChange('constants');
        showInfo(`Constante renomeada: "${oldKey}" → "${newKey}"`);
    }
}

function updateConstantDescription(key, description) {
    // Aqui você pode armazenar descrições em um objeto separado
    // Por enquanto, apenas adicionamos ao pending changes
    addPendingChange('constants');
}

function updateConstantValue(key, value) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        showError(`Valor inválido para "${key}": ${value}`);
        return;
    }
    
    if (systemData.constants[key] !== numValue) {
        systemData.constants[key] = numValue;
        addPendingChange('constants');
    }
}

async function deleteConstant(key) {
    showConfirmation(`Deseja excluir a constante "${key}"?`, async () => {
        try {
            // Usar método universal delete
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    path: ['constants', key] 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                delete systemData.constants[key];
                loadConstants();
                addPendingChange('constants');
                showWarning(`Constante "${key}" excluída.`);
            } else {
                throw new Error(result.error || 'Erro ao excluir');
            }
        } catch (error) {
            console.error('Erro ao excluir constante:', error);
            showError(`Erro ao excluir constante: ${error.message}`);
        }
    });
}

// ===== GERENCIAMENTO DE MÁQUINAS =====

function loadMachines() {
    const container = document.getElementById('machinesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!systemData.machines || !Array.isArray(systemData.machines)) {
        systemData.machines = [];
        return;
    }
    
    if (systemData.machines.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="icon-machine" style="font-size: 48px; opacity: 0.5;"></i>
                <h3>Nenhuma máquina cadastrada</h3>
                <p>Clique no botão abaixo para adicionar sua primeira máquina.</p>
                <button class="btn btn-success" onclick="addMachine()">
                    <i class="icon-add"></i> Adicionar Primeira Máquina
                </button>
            </div>
        `;
        return;
    }
    
    systemData.machines.forEach((machine, index) => {
        const card = document.createElement('div');
        card.className = 'machine-card';
        card.innerHTML = `
            <div class="machine-card-header">
                <h3>${escapeHtml(machine.type || 'Sem nome')}</h3>
                <div class="machine-card-actions">
                    <button class="btn btn-small btn-primary" 
                            onclick="editMachine(${index})"
                            title="Editar máquina">
                        <i class="icon-edit"></i> Editar
                    </button>
                    <button class="btn btn-small btn-danger"
                            onclick="deleteMachine(${index})"
                            title="Excluir máquina">
                        <i class="icon-delete"></i>
                    </button>
                </div>
            </div>
            <div class="machine-card-body">
                <p><strong>Configurações:</strong> ${machine.configuracoes_instalacao?.length || 0}</p>
                <p><strong>Opções:</strong> ${machine.options?.length || 0}</p>
                <p><strong>Tensões:</strong> ${machine.voltages?.length || 0}</p>
                <p><strong>Valores base:</strong> ${Object.keys(machine.baseValues || {}).length}</p>
            </div>
            <div class="machine-card-footer">
                <span>ID: ${index}</span>
                <span>Tipo: ${machine.type || 'Não definido'}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function populateMachineFilter() {
    const filter = document.getElementById('machineTypeFilter');
    if (!filter) return;
    
    filter.innerHTML = '<option value="">Todas as máquinas</option>';
    
    systemData.machines.forEach((machine, index) => {
        const option = document.createElement('option');
        option.value = machine.type;
        option.textContent = machine.type || `Máquina ${index + 1}`;
        filter.appendChild(option);
    });
}

function filterMachines() {
    const filterValue = document.getElementById('machineTypeFilter').value.toLowerCase();
    const cards = document.querySelectorAll('.machine-card');
    
    cards.forEach(card => {
        const machineType = card.querySelector('h3').textContent.toLowerCase();
        if (!filterValue || machineType.includes(filterValue)) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
        }
    });
}

function addMachine() {
    const newMachine = {
        type: `NOVO_TIPO_${Date.now().toString().slice(-4)}`,
        impostos: {
            "PIS_COFINS": "INCL",
            "IPI": "ISENTO",
            "ICMS": "12%",
            "PRAZO": "45 a 60 dias",
            "FRETE": "FOB/Cabreúva/SP"
        },
        configuracoes_instalacao: [],
        baseValues: {},
        options: [],
        voltages: []
    };
    
    systemData.machines.push(newMachine);
    loadMachines();
    populateMachineFilter();
    editMachine(systemData.machines.length - 1);
    addPendingChange('machines');
    showInfo('Nova máquina adicionada. Configure os detalhes.');
}

function editMachine(index) {
    if (index < 0 || index >= systemData.machines.length) return;
    
    const machine = systemData.machines[index];
    currentMachineIndex = index;
    
    // Atualizar título
    document.getElementById('machineDetailTitle').textContent = machine.type || 'Nova Máquina';
    
    // Construir conteúdo de edição
    let content = `
        <div class="machine-edit-form">
            <div class="form-group">
                <label>Tipo de Máquina:</label>
                <input type="text" id="editMachineType" value="${escapeHtml(machine.type || '')}" 
                       class="form-control" onchange="updateMachineField('type', this.value)">
            </div>
            
            <div class="form-section">
                <h4>Impostos</h4>
                <div class="impostos-grid">
                    ${Object.entries(machine.impostos || {}).map(([key, value]) => `
                        <div class="form-group">
                            <label>${key}:</label>
                            <input type="text" value="${escapeHtml(value)}"
                                   onchange="updateImposto('${key}', this.value)"
                                   class="form-input-small">
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-small btn-info" onclick="addImposto()">
                    <i class="icon-add"></i> Adicionar Imposto
                </button>
            </div>
            
            <div class="form-section">
                <div class="section-header">
                    <h4>Configurações de Instalação</h4>
                    <button class="btn btn-small btn-success" onclick="addConfiguracao()">
                        <i class="icon-add"></i> Adicionar
                    </button>
                </div>
                <div id="configuracoesList" class="configuracoes-list">
                    ${loadConfiguracoesHTML(machine)}
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-header">
                    <h4>Valores Base</h4>
                    <button class="btn btn-small btn-success" onclick="addBaseValue()">
                        <i class="icon-add"></i> Adicionar
                    </button>
                </div>
                <div id="baseValuesList" class="base-values-list">
                    ${loadBaseValuesHTML(machine)}
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-header">
                    <h4>Opções</h4>
                    <button class="btn btn-small btn-success" onclick="addOption()">
                        <i class="icon-add"></i> Adicionar
                    </button>
                </div>
                <div id="optionsList" class="options-list">
                    ${loadOptionsHTML(machine)}
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-header">
                    <h4>Tensões</h4>
                    <button class="btn btn-small btn-success" onclick="addVoltage()">
                        <i class="icon-add"></i> Adicionar
                    </button>
                </div>
                <div id="voltagesList" class="voltages-list">
                    ${loadVoltagesHTML(machine)}
                </div>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-success" onclick="saveMachineChanges()">
                    <i class="icon-save"></i> Salvar Alterações
                </button>
                <button class="btn btn-secondary" onclick="closeMachineDetail()">
                    <i class="icon-close"></i> Fechar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('machineDetailContent').innerHTML = content;
    document.getElementById('machineDetailView').style.display = 'block';
    
    // Scroll para o topo
    document.getElementById('machineDetailView').scrollIntoView({ behavior: 'smooth' });
}

function loadConfiguracoesHTML(machine) {
    const configuracoes = machine.configuracoes_instalacao || [];
    
    if (configuracoes.length === 0) {
        return '<p class="empty-message">Nenhuma configuração cadastrada.</p>';
    }
    
    return configuracoes.map((config, index) => `
        <div class="config-item" data-index="${index}">
            <div class="config-header">
                <span>Configuração ${index + 1}</span>
                <button class="btn btn-xs btn-danger" onclick="removeConfiguracao(${index})" title="Remover">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="config-content">
                <input type="text" value="${escapeHtml(config.nome || '')}" 
                       placeholder="Descrição da configuração"
                       onchange="updateConfiguracao(${index}, 'nome', this.value)"
                       class="form-input">
                ${config.valor !== undefined ? `
                    <input type="number" value="${config.valor}" step="0.01"
                           placeholder="Valor"
                           onchange="updateConfiguracao(${index}, 'valor', this.value)"
                           class="form-input">
                ` : ''}
            </div>
        </div>
    `).join('');
}

function loadBaseValuesHTML(machine) {
    const baseValues = machine.baseValues || {};
    const entries = Object.entries(baseValues);
    
    if (entries.length === 0) {
        return '<p class="empty-message">Nenhum valor base cadastrado.</p>';
    }
    
    return entries.map(([key, value], index) => `
        <div class="base-value-item" data-key="${key}">
            <div class="base-value-header">
                <input type="text" value="${escapeHtml(key)}" 
                       placeholder="Chave (ex: 1TR)"
                       onchange="updateBaseValueKey('${key}', this.value)"
                       class="form-input-small">
                <button class="btn btn-xs btn-danger" onclick="removeBaseValue('${key}')" title="Remover">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <input type="number" value="${value}" step="0.01"
                   placeholder="Valor"
                   onchange="updateBaseValue('${key}', this.value)"
                   class="form-input">
        </div>
    `).join('');
}

function loadOptionsHTML(machine) {
    const options = machine.options || [];
    
    if (options.length === 0) {
        return '<p class="empty-message">Nenhuma opção cadastrada.</p>';
    }
    
    return options.map((option, index) => `
        <div class="option-item" data-index="${index}">
            <div class="option-header">
                <span>Opção ${index + 1}: ${escapeHtml(option.name || 'Sem nome')}</span>
                <button class="btn btn-xs btn-danger" onclick="removeOption(${index})" title="Remover">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="option-content">
                <input type="text" value="${escapeHtml(option.name || '')}" 
                       placeholder="Nome da opção"
                       onchange="updateOption(${index}, 'name', this.value)"
                       class="form-input">
                <div class="option-values">
                    <h5>Valores por Capacidade:</h5>
                    ${option.values ? Object.entries(option.values).map(([key, val]) => `
                        <div class="option-value-row">
                            <span>${key}:</span>
                            <input type="number" value="${val}" step="0.01"
                                   onchange="updateOptionValue(${index}, '${key}', this.value)"
                                   class="form-input-small">
                        </div>
                    `).join('') : '<p>Sem valores definidos</p>'}
                </div>
            </div>
        </div>
    `).join('');
}

function loadVoltagesHTML(machine) {
    const voltages = machine.voltages || [];
    
    if (voltages.length === 0) {
        return '<p class="empty-message">Nenhuma tensão cadastrada.</p>';
    }
    
    return voltages.map((voltage, index) => `
        <div class="voltage-item" data-index="${index}">
            <div class="voltage-header">
                <span>Tensão ${index + 1}</span>
                <button class="btn btn-xs btn-danger" onclick="removeVoltage(${index})" title="Remover">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="voltage-content">
                <input type="text" value="${escapeHtml(voltage.name || '')}" 
                       placeholder="Nome (ex: 220V/1F)"
                       onchange="updateVoltage(${index}, 'name', this.value)"
                       class="form-input">
                <input type="number" value="${voltage.value || 0}" step="0.01"
                       placeholder="Valor"
                       onchange="updateVoltage(${index}, 'value', this.value)"
                       class="form-input">
            </div>
        </div>
    `).join('');
}

function closeMachineDetail() {
    document.getElementById('machineDetailView').style.display = 'none';
    currentMachineIndex = null;
}

function updateMachineField(field, value) {
    if (currentMachineIndex !== null) {
        systemData.machines[currentMachineIndex][field] = value;
        document.getElementById('machineDetailTitle').textContent = value;
        addPendingChange('machines');
    }
}

function updateImposto(key, value) {
    if (currentMachineIndex !== null) {
        if (!systemData.machines[currentMachineIndex].impostos) {
            systemData.machines[currentMachineIndex].impostos = {};
        }
        systemData.machines[currentMachineIndex].impostos[key] = value;
        addPendingChange('machines');
    }
}

function addImposto() {
    if (currentMachineIndex !== null) {
        const newKey = `NOVO_IMPOSTO_${Date.now().toString().slice(-4)}`;
        if (!systemData.machines[currentMachineIndex].impostos) {
            systemData.machines[currentMachineIndex].impostos = {};
        }
        systemData.machines[currentMachineIndex].impostos[newKey] = '';
        editMachine(currentMachineIndex); // Recarregar view
        addPendingChange('machines');
    }
}

// Funções para Configurações
function addConfiguracao() {
    if (currentMachineIndex !== null) {
        if (!systemData.machines[currentMachineIndex].configuracoes_instalacao) {
            systemData.machines[currentMachineIndex].configuracoes_instalacao = [];
        }
        
        const newId = systemData.machines[currentMachineIndex].configuracoes_instalacao.length + 1;
        systemData.machines[currentMachineIndex].configuracoes_instalacao.push({
            id: newId,
            nome: 'Nova Configuração',
            valor: 0
        });
        
        editMachine(currentMachineIndex);
        addPendingChange('machines');
    }
}

function updateConfiguracao(index, field, value) {
    if (currentMachineIndex !== null) {
        const machine = systemData.machines[currentMachineIndex];
        if (machine.configuracoes_instalacao && machine.configuracoes_instalacao[index]) {
            if (field === 'valor') {
                machine.configuracoes_instalacao[index][field] = parseFloat(value) || 0;
            } else {
                machine.configuracoes_instalacao[index][field] = value;
            }
            addPendingChange('machines');
        }
    }
}

function removeConfiguracao(index) {
    showConfirmation('Deseja remover esta configuração?', () => {
        if (currentMachineIndex !== null) {
            const machine = systemData.machines[currentMachineIndex];
            if (machine.configuracoes_instalacao) {
                machine.configuracoes_instalacao.splice(index, 1);
                editMachine(currentMachineIndex);
                addPendingChange('machines');
                showWarning('Configuração removida.');
            }
        }
    });
}

// Funções para Valores Base
function addBaseValue() {
    if (currentMachineIndex !== null) {
        const machine = systemData.machines[currentMachineIndex];
        if (!machine.baseValues) {
            machine.baseValues = {};
        }
        
        const newKey = `NOVA_CAPACIDADE_${Object.keys(machine.baseValues).length + 1}`;
        machine.baseValues[newKey] = 0;
        
        editMachine(currentMachineIndex);
        addPendingChange('machines');
    }
}

function updateBaseValueKey(oldKey, newKey) {
    if (currentMachineIndex !== null && newKey && newKey.trim() !== '') {
        const machine = systemData.machines[currentMachineIndex];
        if (machine.baseValues && machine.baseValues[oldKey] !== undefined) {
            const value = machine.baseValues[oldKey];
            delete machine.baseValues[oldKey];
            machine.baseValues[newKey] = value;
            editMachine(currentMachineIndex);
            addPendingChange('machines');
        }
    }
}

function updateBaseValue(key, value) {
    if (currentMachineIndex !== null) {
        const machine = systemData.machines[currentMachineIndex];
        if (machine.baseValues && machine.baseValues[key] !== undefined) {
            machine.baseValues[key] = parseFloat(value) || 0;
            addPendingChange('machines');
        }
    }
}

function removeBaseValue(key) {
    showConfirmation(`Deseja remover o valor base "${key}"?`, () => {
        if (currentMachineIndex !== null) {
            const machine = systemData.machines[currentMachineIndex];
            if (machine.baseValues && machine.baseValues[key] !== undefined) {
                delete machine.baseValues[key];
                editMachine(currentMachineIndex);
                addPendingChange('machines');
                showWarning(`Valor base "${key}" removido.`);
            }
        }
    });
}

// Funções para Opções
function addOption() {
    if (currentMachineIndex !== null) {
        const machine = systemData.machines[currentMachineIndex];
        if (!machine.options) {
            machine.options = [];
        }
        
        const newId = machine.options.length + 1;
        machine.options.push({
            id: newId,
            name: 'Nova Opção',
            values: {}
        });
        
        editMachine(currentMachineIndex);
        addPendingChange('machines');
    }
}

function updateOption(index, field, value) {
    if (currentMachineIndex !== null) {
        const machine = systemData.machines[currentMachineIndex];
        if (machine.options && machine.options[index]) {
            machine.options[index][field] = value;
            addPendingChange('machines');
        }
    }
}

function updateOptionValue(optionIndex, key, value) {
    if (currentMachineIndex !== null) {
        const machine = systemData.machines[currentMachineIndex];
        if (machine.options && machine.options[optionIndex]) {
            if (!machine.options[optionIndex].values) {
                machine.options[optionIndex].values = {};
            }
            machine.options[optionIndex].values[key] = parseFloat(value) || 0;
            addPendingChange('machines');
        }
    }
}

function removeOption(index) {
    showConfirmation('Deseja remover esta opção?', () => {
        if (currentMachineIndex !== null) {
            const machine = systemData.machines[currentMachineIndex];
            if (machine.options) {
                machine.options.splice(index, 1);
                editMachine(currentMachineIndex);
                addPendingChange('machines');
                showWarning('Opção removida.');
            }
        }
    });
}

// Funções para Tensões
function addVoltage() {
    if (currentMachineIndex !== null) {
        const machine = systemData.machines[currentMachineIndex];
        if (!machine.voltages) {
            machine.voltages = [];
        }
        
        machine.voltages.push({
            id: machine.voltages.length + 1,
            name: 'Nova Tensão',
            value: 0
        });
        
        editMachine(currentMachineIndex);
        addPendingChange('machines');
    }
}

function updateVoltage(index, field, value) {
    if (currentMachineIndex !== null) {
        const machine = systemData.machines[currentMachineIndex];
        if (machine.voltages && machine.voltages[index]) {
            if (field === 'value') {
                machine.voltages[index][field] = parseFloat(value) || 0;
            } else {
                machine.voltages[index][field] = value;
            }
            addPendingChange('machines');
        }
    }
}

function removeVoltage(index) {
    showConfirmation('Deseja remover esta tensão?', () => {
        if (currentMachineIndex !== null) {
            const machine = systemData.machines[currentMachineIndex];
            if (machine.voltages) {
                machine.voltages.splice(index, 1);
                editMachine(currentMachineIndex);
                addPendingChange('machines');
                showWarning('Tensão removida.');
            }
        }
    });
}

function saveMachineChanges() {
    if (currentMachineIndex !== null) {
        addPendingChange('machines');
        showSuccess('Alterações na máquina salvas. Lembre-se de salvar todos os dados.');
        closeMachineDetail();
    }
}

async function deleteMachine(index) {
    const machine = systemData.machines[index];
    const machineType = machine.type || `Máquina ${index + 1}`;
    
    showConfirmation(`Deseja excluir a máquina "${machineType}"?`, async () => {
        try {
            // Usar método universal delete
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    path: ['machines', index.toString()] 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                systemData.machines.splice(index, 1);
                loadMachines();
                populateMachineFilter();
                closeMachineDetail();
                addPendingChange('machines');
                showWarning(`Máquina "${machineType}" excluída.`);
            } else {
                throw new Error(result.error || 'Erro ao excluir');
            }
        } catch (error) {
            console.error('Erro ao excluir máquina:', error);
            showError(`Erro ao excluir máquina: ${error.message}`);
        }
    });
}

// ===== GERENCIAMENTO DE MATERIAIS =====

function loadMaterials() {
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!systemData.materials) {
        systemData.materials = {};
    }
    
    Object.entries(systemData.materials).forEach(([material, preco], index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" value="${escapeHtml(material)}"
                       onchange="updateMaterialKey('${material}', this.value)"
                       placeholder="Nome do material"
                       class="form-input">
            </td>
            <td>
                <input type="text" value="${getMaterialUnit(material)}"
                       onchange="updateMaterialUnit('${material}', this.value)"
                       placeholder="Unidade (kg, m, etc)"
                       class="form-input">
            </td>
            <td>
                <input type="number" value="${preco}" step="0.01"
                       onchange="updateMaterialPrice('${material}', this.value)"
                       class="form-input">
            </td>
            <td class="actions-cell">
                <button class="btn btn-small btn-danger"
                        onclick="deleteMaterial('${material}')"
                        title="Excluir material">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Adicionar linha vazia para novo item
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 20px;">
            <button class="btn btn-success" onclick="addMaterial()">
                <i class="icon-add"></i> Adicionar Novo Material
            </button>
        </td>
    `;
    tbody.appendChild(emptyRow);
}

function getMaterialUnit(material) {
    const units = {
        'Kg cobre': 'kg',
        'Metro isolante 1.1/8': 'm',
        'Metro isolante 5/8': 'm',
        'Kg Gás R-410A': 'kg',
        'Metro tubo PVC 3/4"': 'm',
        'Metro tubo PVC 1"': 'm',
        'Metro Barra Roscada 3/8"': 'm',
        'Chumbador 3/8" por 2.1/2"': 'un'
    };
    return units[material] || '';
}

function addMaterial() {
    const newMaterial = `NOVO_MATERIAL_${Date.now().toString().slice(-6)}`;
    systemData.materials[newMaterial] = 0;
    loadMaterials();
    addPendingChange('materials');
    showInfo('Novo material adicionado. Edite os detalhes.');
    
    // Rolar para o novo item
    setTimeout(() => {
        const lastRow = document.querySelector('#materialsTableBody tr:nth-last-child(2)');
        if (lastRow) {
            lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = lastRow.querySelector('input[type="text"]');
            if (input) input.focus();
        }
    }, 100);
}

function updateMaterialKey(oldKey, newKey) {
    if (oldKey && newKey && newKey.trim() !== '' && newKey !== oldKey) {
        // Verificar se a nova chave já existe
        if (systemData.materials[newKey] !== undefined) {
            showError(`O material "${newKey}" já existe!`);
            return;
        }
        
        systemData.materials[newKey] = systemData.materials[oldKey];
        delete systemData.materials[oldKey];
        loadMaterials();
        addPendingChange('materials');
        showInfo(`Material renomeado: "${oldKey}" → "${newKey}"`);
    }
}

function updateMaterialUnit(key, unit) {
    // Aqui você pode armazenar unidades em um objeto separado
    // Por enquanto, apenas adicionamos ao pending changes
    addPendingChange('materials');
}

function updateMaterialPrice(key, value) {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
        showError(`Preço inválido para "${key}": ${value}`);
        return;
    }
    
    if (systemData.materials[key] !== numValue) {
        systemData.materials[key] = numValue;
        addPendingChange('materials');
    }
}

async function deleteMaterial(key) {
    showConfirmation(`Deseja excluir o material "${key}"?`, async () => {
        try {
            // Usar método universal delete
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    path: ['materials', key] 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                delete systemData.materials[key];
                loadMaterials();
                addPendingChange('materials');
                showWarning(`Material "${key}" excluído.`);
            } else {
                throw new Error(result.error || 'Erro ao excluir');
            }
        } catch (error) {
            console.error('Erro ao excluir material:', error);
            showError(`Erro ao excluir material: ${error.message}`);
        }
    });
}

// ===== GERENCIAMENTO DE EMPRESAS =====

function loadEmpresas() {
    const tbody = document.getElementById('empresasTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!systemData.empresas || !Array.isArray(systemData.empresas)) {
        systemData.empresas = [];
        return;
    }
    
    if (systemData.empresas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 30px;">
                    <div class="empty-state">
                        <i class="icon-company" style="font-size: 48px; opacity: 0.5;"></i>
                        <h3>Nenhuma empresa cadastrada</h3>
                        <p>Clique no botão abaixo para adicionar sua primeira empresa.</p>
                        <button class="btn btn-success" onclick="addEmpresa()">
                            <i class="icon-add"></i> Adicionar Primeira Empresa
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    systemData.empresas.forEach((empresa, index) => {
        const sigla = Object.keys(empresa)[0] || '';
        const nome = empresa[sigla] || '';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" value="${escapeHtml(sigla)}"
                       onchange="updateEmpresaSigla(${index}, this.value)"
                       placeholder="Sigla (3 letras)"
                       class="form-input" maxlength="10">
            </td>
            <td>
                <input type="text" value="${escapeHtml(nome)}"
                       onchange="updateEmpresaNome(${index}, this.value)"
                       placeholder="Nome completo da empresa"
                       class="form-input">
            </td>
            <td class="actions-cell">
                <button class="btn btn-small btn-danger"
                        onclick="deleteEmpresa(${index})"
                        title="Excluir empresa">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Adicionar linha vazia para novo item
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
        <td colspan="3" style="text-align: center; padding: 20px;">
            <button class="btn btn-success" onclick="addEmpresa()">
                <i class="icon-add"></i> Adicionar Nova Empresa
            </button>
        </td>
    `;
    tbody.appendChild(emptyRow);
}

function addEmpresa() {
    const newSigla = `NOV${Date.now().toString().slice(-3)}`;
    systemData.empresas.push({ [newSigla]: `Nova Empresa ${newSigla}` });
    loadEmpresas();
    addPendingChange('empresas');
    showInfo('Nova empresa adicionada. Edite os detalhes.');
    
    // Rolar para o novo item
    setTimeout(() => {
        const lastRow = document.querySelector('#empresasTableBody tr:nth-last-child(2)');
        if (lastRow) {
            lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = lastRow.querySelector('input[type="text"]');
            if (input) input.focus();
        }
    }, 100);
}

function updateEmpresaSigla(index, newSigla) {
    const empresa = systemData.empresas[index];
    const oldSigla = Object.keys(empresa)[0];
    const nome = empresa[oldSigla];
    
    if (newSigla && newSigla.trim() !== '' && newSigla !== oldSigla) {
        // Verificar se a sigla já existe
        const siglaExists = systemData.empresas.some((emp, idx) => {
            if (idx === index) return false;
            const empSigla = Object.keys(emp)[0];
            return empSigla === newSigla;
        });
        
        if (siglaExists) {
            showError(`A sigla "${newSigla}" já existe!`);
            return;
        }
        
        systemData.empresas[index] = { [newSigla]: nome };
        loadEmpresas();
        addPendingChange('empresas');
        showInfo(`Sigla alterada: "${oldSigla}" → "${newSigla}"`);
    }
}

function updateEmpresaNome(index, newNome) {
    const empresa = systemData.empresas[index];
    const sigla = Object.keys(empresa)[0];
    
    if (newNome && newNome.trim() !== '' && newNome !== empresa[sigla]) {
        systemData.empresas[index][sigla] = newNome;
        addPendingChange('empresas');
    }
}

async function deleteEmpresa(index) {
    const empresa = systemData.empresas[index];
    const sigla = Object.keys(empresa)[0] || '';
    const nome = empresa[sigla] || '';
    
    showConfirmation(`Deseja excluir a empresa "${sigla} - ${nome}"?`, async () => {
        try {
            // Usar método universal delete
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    path: ['empresas', index.toString()] 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                systemData.empresas.splice(index, 1);
                loadEmpresas();
                addPendingChange('empresas');
                showWarning(`Empresa "${sigla}" excluída.`);
            } else {
                throw new Error(result.error || 'Erro ao excluir');
            }
        } catch (error) {
            console.error('Erro ao excluir empresa:', error);
            showError(`Erro ao excluir empresa: ${error.message}`);
        }
    });
}

// ===== EDITOR JSON =====

function loadJSONEditor() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) return;
    
    editor.value = JSON.stringify(systemData, null, 2);
    updateJSONStatus('JSON carregado', 'info');
}

function formatJSON() {
    const editor = document.getElementById('jsonEditor');
    try {
        const parsed = JSON.parse(editor.value);
        editor.value = JSON.stringify(parsed, null, 2);
        updateJSONStatus('JSON formatado com sucesso', 'success');
    } catch (error) {
        updateJSONStatus(`Erro de formatação: ${error.message}`, 'error');
    }
}

function validateJSON() {
    const editor = document.getElementById('jsonEditor');
    try {
        const parsed = JSON.parse(editor.value);
        
        // Validar estrutura básica
        const requiredKeys = ['constants', 'machines', 'materials', 'empresas'];
        const missingKeys = requiredKeys.filter(key => !(key in parsed));
        
        if (missingKeys.length > 0) {
            throw new Error(`Campos ausentes: ${missingKeys.join(', ')}`);
        }
        
        // Validar tipos
        if (typeof parsed.constants !== 'object') {
            throw new Error('constants deve ser um objeto');
        }
        if (!Array.isArray(parsed.machines)) {
            throw new Error('machines deve ser um array');
        }
        if (typeof parsed.materials !== 'object') {
            throw new Error('materials deve ser um objeto');
        }
        if (!Array.isArray(parsed.empresas)) {
            throw new Error('empresas deve ser um array');
        }
        
        updateJSONStatus('✅ JSON válido e com estrutura correta', 'success');
        return true;
        
    } catch (error) {
        updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
        return false;
    }
}

function updateJSONStatus(message, type) {
    const status = document.getElementById('jsonStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = 'json-status-message';
    
    switch (type) {
        case 'success':
            status.classList.add('success');
            break;
        case 'error':
            status.classList.add('error');
            break;
        case 'info':
            status.classList.add('info');
            break;
        default:
            status.classList.add('info');
    }
}

// ===== FUNÇÕES DE EXPORTAÇÃO/IMPORTAÇÃO =====

function exportToJSON() {
    try {
        const dataStr = JSON.stringify(systemData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `sistema_dados_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        showSuccess('JSON exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar JSON:', error);
        showError('Erro ao exportar JSON.');
    }
}

function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar estrutura básica
            if (!importedData.constants || !importedData.machines || 
                !importedData.materials || !importedData.empresas) {
                throw new Error('Estrutura de dados inválida. Arquivo deve conter: constants, machines, materials, empresas');
            }
            
            // Validar tipos
            if (typeof importedData.constants !== 'object') {
                throw new Error('constants deve ser um objeto');
            }
            if (!Array.isArray(importedData.machines)) {
                throw new Error('machines deve ser um array');
            }
            if (typeof importedData.materials !== 'object') {
                throw new Error('materials deve ser um objeto');
            }
            if (!Array.isArray(importedData.empresas)) {
                throw new Error('empresas deve ser um array');
            }
            
            systemData = importedData;
            loadData();
            showSuccess('Dados importados com sucesso!');
            
        } catch (error) {
            console.error('Erro ao importar JSON:', error);
            showError(`Erro ao importar JSON: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        showError('Erro ao ler o arquivo.');
    };
    
    reader.readAsText(file);
    
    // Resetar input
    event.target.value = '';
}

// ===== FUNÇÕES DE BUSCA =====

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const filter = document.getElementById('searchFilter').value;
    
    if (!searchTerm) {
        showWarning('Digite um termo para buscar');
        return;
    }
    
    // Limpar highlights anteriores
    document.querySelectorAll('.highlight').forEach(el => {
        el.classList.remove('highlight');
    });
    
    switch (filter) {
        case 'constants':
            searchInConstants(searchTerm);
            break;
        case 'machines':
            searchInMachines(searchTerm);
            break;
        case 'materials':
            searchInMaterials(searchTerm);
            break;
        case 'empresas':
            searchInEmpresas(searchTerm);
            break;
        case 'all':
            searchAll(searchTerm);
            break;
    }
}

function searchInConstants(searchTerm) {
    const rows = document.querySelectorAll('#constantsTableBody tr');
    let foundCount = 0;
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        let rowText = '';
        inputs.forEach(input => {
            rowText += input.value.toLowerCase() + ' ';
        });
        
        if (rowText.includes(searchTerm)) {
            row.classList.add('highlight');
            foundCount++;
        }
    });
    
    if (foundCount > 0) {
        showInfo(`Encontrado ${foundCount} resultado(s) nas constantes`);
    } else {
        showWarning('Nenhum resultado encontrado nas constantes');
    }
}

function searchInMachines(searchTerm) {
    const cards = document.querySelectorAll('.machine-card');
    let foundCount = 0;
    
    cards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        if (cardText.includes(searchTerm)) {
            card.classList.add('highlight');
            foundCount++;
        }
    });
    
    if (foundCount > 0) {
        showInfo(`Encontrado ${foundCount} resultado(s) nas máquinas`);
        // Filtrar para mostrar apenas resultados
        filterMachinesForSearch(searchTerm);
    } else {
        showWarning('Nenhum resultado encontrado nas máquinas');
    }
}

function filterMachinesForSearch(searchTerm) {
    const cards = document.querySelectorAll('.machine-card');
    cards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        if (cardText.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function searchInMaterials(searchTerm) {
    const rows = document.querySelectorAll('#materialsTableBody tr');
    let foundCount = 0;
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        let rowText = '';
        inputs.forEach(input => {
            rowText += input.value.toLowerCase() + ' ';
        });
        
        if (rowText.includes(searchTerm)) {
            row.classList.add('highlight');
            foundCount++;
        }
    });
    
    if (foundCount > 0) {
        showInfo(`Encontrado ${foundCount} resultado(s) nos materiais`);
    } else {
        showWarning('Nenhum resultado encontrado nos materiais');
    }
}

function searchInEmpresas(searchTerm) {
    const rows = document.querySelectorAll('#empresasTableBody tr');
    let foundCount = 0;
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        let rowText = '';
        inputs.forEach(input => {
            rowText += input.value.toLowerCase() + ' ';
        });
        
        if (rowText.includes(searchTerm)) {
            row.classList.add('highlight');
            foundCount++;
        }
    });
    
    if (foundCount > 0) {
        showInfo(`Encontrado ${foundCount} resultado(s) nas empresas`);
    } else {
        showWarning('Nenhum resultado encontrado nas empresas');
    }
}

function searchAll(searchTerm) {
    let totalFound = 0;
    
    // Buscar em todas as seções
    const searchFunctions = [
        searchInConstants,
        searchInMachines,
        searchInMaterials,
        searchInEmpresas
    ];
    
    searchFunctions.forEach(func => {
        // Contar resultados de forma simplificada
        if (func.name === 'searchInConstants') {
            const rows = document.querySelectorAll('#constantsTableBody tr');
            rows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                let rowText = '';
                inputs.forEach(input => rowText += input.value.toLowerCase() + ' ');
                if (rowText.includes(searchTerm)) totalFound++;
            });
        }
        // Implementar contagem para outras seções...
    });
    
    if (totalFound > 0) {
        showInfo(`Encontrado ${totalFound} resultado(s) no total`);
    } else {
        showWarning('Nenhum resultado encontrado');
    }
}

// ===== GERENCIAMENTO DE MUDANÇAS =====

function addPendingChange(type) {
    pendingChanges.add(type);
    updateSaveButton();
}

function clearPendingChanges() {
    pendingChanges.clear();
    updateSaveButton();
}

function updateSaveButton() {
    const saveBtn = document.querySelector('.btn-success[onclick*="saveData"]');
    if (!saveBtn) return;
    
    if (pendingChanges.size > 0) {
        saveBtn.innerHTML = '<i class="icon-save"></i> Salvar (' + pendingChanges.size + ')';
        saveBtn.classList.add('has-changes');
    } else {
        saveBtn.innerHTML = '<i class="icon-save"></i> Salvar Tudo';
        saveBtn.classList.remove('has-changes');
    }
}

function validateData() {
    try {
        // Validar constantes
        for (const [key, value] of Object.entries(systemData.constants)) {
            if (typeof value !== 'number' || isNaN(value)) {
                showError(`Valor inválido para constante "${key}": ${value}`);
                return false;
            }
        }
        
        // Validar máquinas
        for (const machine of systemData.machines) {
            if (!machine.type || typeof machine.type !== 'string') {
                showError('Tipo de máquina inválido ou não especificado');
                return false;
            }
            
            // Validar valores base
            if (machine.baseValues) {
                for (const [key, value] of Object.entries(machine.baseValues)) {
                    if (typeof value !== 'number' || isNaN(value)) {
                        showError(`Valor base inválido para "${key}" na máquina "${machine.type}": ${value}`);
                        return false;
                    }
                }
            }
        }
        
        // Validar materiais
        for (const [key, value] of Object.entries(systemData.materials)) {
            if (typeof value !== 'number' || isNaN(value) || value < 0) {
                showError(`Preço inválido para material "${key}": ${value}`);
                return false;
            }
        }
        
        // Validar empresas
        for (const empresa of systemData.empresas) {
            if (typeof empresa !== 'object' || empresa === null) {
                showError('Estrutura de empresa inválida');
                return false;
            }
            
            const sigla = Object.keys(empresa)[0];
            if (!sigla || typeof sigla !== 'string' || sigla.trim() === '') {
                showError('Sigla de empresa inválida');
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Erro na validação:', error);
        showError(`Erro na validação: ${error.message}`);
        return false;
    }
}

// ===== FUNÇÕES DE UI =====

function showConfirmation(message, callback) {
    const modal = document.getElementById('confirmationModal');
    const messageEl = document.getElementById('modalMessage');
    const titleEl = document.getElementById('modalTitle');
    
    if (!modal || !messageEl || !titleEl) return;
    
    titleEl.textContent = 'Confirmação';
    messageEl.textContent = message;
    modal.style.display = 'flex';
    
    window.confirmAction = function(confirmed) {
        modal.style.display = 'none';
        if (confirmed && callback) callback();
    };
}

function showLoading(message) {
    // Criar overlay de loading
    let loadingEl = document.getElementById('loadingOverlay');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loadingOverlay';
        loadingEl.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 18px;
        `;
        document.body.appendChild(loadingEl);
    }
    
    loadingEl.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner" style="
                width: 50px;
                height: 50px;
                border: 5px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            "></div>
            <p>${message || 'Carregando...'}</p>
        </div>
    `;
    loadingEl.style.display = 'flex';
}

function hideLoading() {
    const loadingEl = document.getElementById('loadingOverlay');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function showSuccess(message) {
    createMessage(message, 'success');
}

function showError(message) {
    createMessage(message, 'error');
}

function showWarning(message) {
    createMessage(message, 'warning');
}

function showInfo(message) {
    createMessage(message, 'info');
}

function createMessage(text, type) {
    // Remover mensagens antigas do mesmo tipo
    document.querySelectorAll(`.message-${type}`).forEach(el => {
        el.remove();
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = text;
    
    // Estilos
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9998;
        padding: 15px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
        animation-fill-mode: forwards;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    // Cores por tipo
    switch (type) {
        case 'success':
            messageDiv.style.background = 'linear-gradient(135deg, #2D774E 0%, #298650 100%)';
            break;
        case 'error':
            messageDiv.style.background = 'linear-gradient(135deg, #C53030 0%, #FC8181 100%)';
            break;
        case 'warning':
            messageDiv.style.background = 'linear-gradient(135deg, #D69E2E 0%, #F6AD55 100%)';
            break;
        case 'info':
            messageDiv.style.background = 'linear-gradient(135deg, #3182CE 0%, #63B3ED 100%)';
            break;
    }
    
    document.body.appendChild(messageDiv);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
    
    // Animações CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Edição de Dados iniciado');
    
    // Configurar eventos
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
    
    // Configurar botão de busca
    const searchBtn = document.querySelector('.btn-info[onclick*="performSearch"]');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Carregar dados iniciais
    setTimeout(() => {
        loadData();
    }, 500);
    
    // Adicionar estilo CSS dinâmico
    addDynamicStyles();
});

function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilos para o sistema de edição */
        .form-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--color-gray-300);
            border-radius: var(--border-radius);
            font-size: 14px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px rgba(74, 85, 104, 0.1);
        }
        
        .form-input-small {
            padding: 6px 10px;
            font-size: 13px;
        }
        
        .actions-cell {
            text-align: center;
            vertical-align: middle;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--color-gray-500);
        }
        
        .empty-state h3 {
            margin: 15px 0 10px;
            color: var(--color-gray-700);
        }
        
        .empty-state p {
            margin-bottom: 20px;
            color: var(--color-gray-600);
        }
        
        .empty-message {
            color: var(--color-gray-500);
            font-style: italic;
            padding: 10px;
            text-align: center;
        }
        
        .form-section {
            margin-bottom: 25px;
            padding: 15px;
            background: var(--color-gray-50);
            border-radius: var(--border-radius);
            border: 1px solid var(--color-gray-200);
        }
        
        .form-section h4 {
            margin-top: 0;
            margin-bottom: 15px;
            color: var(--color-gray-800);
            border-bottom: 2px solid var(--color-gray-300);
            padding-bottom: 8px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .impostos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .config-item, .base-value-item, .option-item, .voltage-item {
            background: white;
            border: 1px solid var(--color-gray-200);
            border-radius: var(--border-radius);
            padding: 12px;
            margin-bottom: 10px;
        }
        
        .config-header, .base-value-header, .option-header, .voltage-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--color-gray-200);
        }
        
        .config-content, .base-value-content, .option-content, .voltage-content {
            display: grid;
            gap: 10px;
        }
        
        .option-values {
            margin-top: 10px;
            padding: 10px;
            background: var(--color-gray-100);
            border-radius: var(--border-radius);
        }
        
        .option-values h5 {
            margin-top: 0;
            margin-bottom: 10px;
            color: var(--color-gray-700);
        }
        
        .option-value-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 2px solid var(--color-gray-200);
        }
        
        .btn-xs {
            padding: 3px 8px;
            font-size: 12px;
        }
        
        .highlight {
            background-color: rgba(255, 255, 0, 0.15) !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 0, 0.3) !important;
            animation: pulseHighlight 1.5s infinite;
        }
        
        @keyframes pulseHighlight {
            0% { box-shadow: 0 0 0 2px rgba(255, 255, 0, 0.3); }
            50% { box-shadow: 0 0 0 4px rgba(255, 255, 0, 0.5); }
            100% { box-shadow: 0 0 0 2px rgba(255, 255, 0, 0.3); }
        }
        
        .has-changes {
            animation: pulseSave 2s infinite;
        }
        
        @keyframes pulseSave {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .fade-in {
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .json-status-message {
            padding: 10px 15px;
            border-radius: var(--border-radius);
            margin-top: 10px;
            font-weight: 500;
        }
        
        .json-status-message.success {
            background: linear-gradient(135deg, #2D774E 0%, #298650 100%);
            color: white;
        }
        
        .json-status-message.error {
            background: linear-gradient(135deg, #C53030 0%, #FC8181 100%);
            color: white;
        }
        
        .json-status-message.info {
            background: linear-gradient(135deg, #3182CE 0%, #63B3ED 100%);
            color: white;
        }
    `;
    document.head.appendChild(style);
}

// ===== FUNÇÕES GLOBAIS PARA OS MODAIS =====

function confirmAction(confirmed) {
    const modal = document.getElementById('confirmationModal');
    if (modal) modal.style.display = 'none';
    
    if (confirmed && window.confirmCallback) {
        window.confirmCallback();
        window.confirmCallback = null;
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
}

function saveEdit() {
    // Implementar lógica de salvamento do modal
    closeEditModal();
}

// ===== FUNÇÃO SHUTDOWN MANUAL (se necessário) =====

function shutdownManual() {
    showConfirmation('Deseja realmente encerrar o servidor?', async () => {
        try {
            const response = await fetch('/api/shutdown', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.action === 'close_window') {
                showSuccess('Servidor encerrado. Esta janela será fechada.');
                setTimeout(() => {
                    window.close();
                }, data.close_delay || 3000);
            }
        } catch (error) {
            console.error('Erro ao encerrar servidor:', error);
            showError('Erro ao encerrar servidor. Tente novamente.');
        }
    });
}

// Exportar funções para uso global
window.loadData = loadData;
window.saveData = saveData;
window.switchTab = switchTab;
window.addConstant = addConstant;
window.deleteConstant = deleteConstant;
window.addMachine = addMachine;
window.editMachine = editMachine;
window.deleteMachine = deleteMachine;
window.addMaterial = addMaterial;
window.deleteMaterial = deleteMaterial;
window.addEmpresa = addEmpresa;
window.deleteEmpresa = deleteEmpresa;
window.exportToJSON = exportToJSON;
window.performSearch = performSearch;
window.formatJSON = formatJSON;
window.validateJSON = validateJSON;
window.confirmAction = confirmAction;
window.closeEditModal = closeEditModal;
window.saveEdit = saveEdit;
window.shutdownManual = shutdownManual;