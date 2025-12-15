// ===== SISTEMA DE EDIÇÃO DE DADOS - CRUD COMPLETO =====

let systemData = {};
let originalData = {};
let pendingChanges = new Set();
let currentEditItem = null;
let currentEditType = null;

// ===== FUNÇÕES DE INICIALIZAÇÃO =====

async function loadData() {
    try {
        showLoading('Carregando dados do sistema...');
        
        // Carregar dados do backend
        const response = await fetch('/api/system-data');
        if (!response.ok) throw new Error('Erro ao carregar dados');
        
        systemData = await response.json();
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
    // Aqui você pode carregar os dados do JSON fornecido
    // Por enquanto, usaremos um objeto vazio
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
}

function saveData() {
    try {
        showLoading('Salvando dados...');
        
        // Validar dados antes de salvar
        if (!validateData()) {
            throw new Error('Dados inválidos encontrados');
        }
        
        // Aqui você faria a chamada para salvar no backend
        // Por enquanto, apenas simulamos o salvamento
        setTimeout(() => {
            originalData = JSON.parse(JSON.stringify(systemData));
            clearPendingChanges();
            showSuccess('Dados salvos com sucesso!');
            hideLoading();
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showError(`Erro ao salvar dados: ${error.message}`);
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
                       placeholder="Nome da constante">
            </td>
            <td>
                <input type="text" value="${getConstantDescription(key)}"
                       placeholder="Descrição">
            </td>
            <td>
                <input type="number" value="${value}" step="0.0001"
                       onchange="updateConstantValue('${key}', this.value)">
            </td>
            <td>
                <button class="btn btn-small btn-danger" 
                        onclick="deleteConstant('${key}')">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
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
    const newKey = `NOVA_CONSTANTE_${Date.now()}`;
    systemData.constants[newKey] = 0;
    loadConstants();
    addPendingChange('constants');
    showInfo('Nova constante adicionada. Edite o nome e valor.');
}

function updateConstantKey(index, newKey) {
    const oldKey = Object.keys(systemData.constants)[index];
    if (oldKey && newKey && newKey !== oldKey) {
        systemData.constants[newKey] = systemData.constants[oldKey];
        delete systemData.constants[oldKey];
        loadConstants();
        addPendingChange('constants');
    }
}

function updateConstantValue(key, value) {
    if (systemData.constants[key] !== parseFloat(value)) {
        systemData.constants[key] = parseFloat(value);
        addPendingChange('constants');
    }
}

function deleteConstant(key) {
    showConfirmation(`Deseja excluir a constante "${key}"?`, () => {
        delete systemData.constants[key];
        loadConstants();
        addPendingChange('constants');
        showWarning('Constante excluída.');
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
    
    systemData.machines.forEach((machine, index) => {
        const card = document.createElement('div');
        card.className = 'machine-card';
        card.innerHTML = `
            <div class="machine-card-header">
                <h3>${escapeHtml(machine.type)}</h3>
                <div class="machine-card-actions">
                    <button class="btn btn-small btn-primary" 
                            onclick="editMachine(${index})">
                        <i class="icon-edit"></i> Editar
                    </button>
                    <button class="btn btn-small btn-danger"
                            onclick="deleteMachine(${index})">
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
                <span>Última edição: ${new Date().toLocaleDateString()}</span>
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
        option.textContent = machine.type;
        filter.appendChild(option);
    });
}

function filterMachines() {
    const filterValue = document.getElementById('machineTypeFilter').value;
    const cards = document.querySelectorAll('.machine-card');
    
    cards.forEach(card => {
        const machineType = card.querySelector('h3').textContent;
        if (!filterValue || machineType === filterValue) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function addMachine() {
    const newMachine = {
        type: `NOVO_TIPO_${Date.now()}`,
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
}

function editMachine(index) {
    if (index < 0 || index >= systemData.machines.length) return;
    
    const machine = systemData.machines[index];
    currentEditItem = index;
    
    // Atualizar título
    document.getElementById('machineDetailTitle').textContent = machine.type;
    
    // Construir conteúdo de edição
    let content = `
        <div class="machine-edit-form">
            <div class="form-group">
                <label>Tipo de Máquina:</label>
                <input type="text" id="editMachineType" value="${escapeHtml(machine.type)}" 
                       class="form-control" onchange="updateMachineField('type', this.value)">
            </div>
            
            <div class="form-section">
                <h4>Impostos</h4>
                ${Object.entries(machine.impostos).map(([key, value]) => `
                    <div class="form-group">
                        <label>${key}:</label>
                        <input type="text" value="${escapeHtml(value)}"
                               onchange="updateImposto('${key}', this.value)">
                    </div>
                `).join('')}
            </div>
            
            <div class="form-section">
                <h4>Configurações de Instalação</h4>
                <div id="configuracoesList"></div>
                <button class="btn btn-small btn-success" onclick="addConfiguracao()">
                    <i class="icon-add"></i> Adicionar Configuração
                </button>
            </div>
            
            <div class="form-section">
                <h4>Valores Base</h4>
                <div id="baseValuesList"></div>
                <button class="btn btn-small btn-success" onclick="addBaseValue()">
                    <i class="icon-add"></i> Adicionar Valor Base
                </button>
            </div>
            
            <div class="form-section">
                <h4>Opções</h4>
                <div id="optionsList"></div>
                <button class="btn btn-small btn-success" onclick="addOption()">
                    <i class="icon-add"></i> Adicionar Opção
                </button>
            </div>
            
            <div class="form-section">
                <h4>Tensões</h4>
                <div id="voltagesList"></div>
                <button class="btn btn-small btn-success" onclick="addVoltage()">
                    <i class="icon-add"></i> Adicionar Tensão
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('machineDetailContent').innerHTML = content;
    document.getElementById('machineDetailView').style.display = 'block';
    
    // Carregar dados específicos
    loadConfiguracoes();
    loadBaseValues();
    loadOptions();
    loadVoltages();
}

function closeMachineDetail() {
    document.getElementById('machineDetailView').style.display = 'none';
    currentEditItem = null;
}

function updateMachineField(field, value) {
    if (currentEditItem !== null) {
        systemData.machines[currentEditItem][field] = value;
        document.getElementById('machineDetailTitle').textContent = value;
        addPendingChange('machines');
    }
}

function updateImposto(key, value) {
    if (currentEditItem !== null) {
        systemData.machines[currentEditItem].impostos[key] = value;
        addPendingChange('machines');
    }
}

// ===== GERENCIAMENTO DE MATERIAIS =====

function loadMaterials() {
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!systemData.materials) {
        systemData.materials = {};
    }
    
    Object.entries(systemData.materials).forEach(([material, preco]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" value="${escapeHtml(material)}"
                       onchange="updateMaterialKey('${material}', this.value)"
                       placeholder="Nome do material">
            </td>
            <td>
                <input type="text" value="${getMaterialUnit(material)}"
                       placeholder="Unidade (kg, m, etc)">
            </td>
            <td>
                <input type="number" value="${preco}" step="0.01"
                       onchange="updateMaterialPrice('${material}', this.value)">
            </td>
            <td>
                <button class="btn btn-small btn-danger"
                        onclick="deleteMaterial('${material}')">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
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
    const newMaterial = `NOVO_MATERIAL_${Date.now()}`;
    systemData.materials[newMaterial] = 0;
    loadMaterials();
    addPendingChange('materials');
}

function updateMaterialKey(oldKey, newKey) {
    if (oldKey && newKey && newKey !== oldKey) {
        systemData.materials[newKey] = systemData.materials[oldKey];
        delete systemData.materials[oldKey];
        loadMaterials();
        addPendingChange('materials');
    }
}

function updateMaterialPrice(key, value) {
    if (systemData.materials[key] !== parseFloat(value)) {
        systemData.materials[key] = parseFloat(value);
        addPendingChange('materials');
    }
}

function deleteMaterial(key) {
    showConfirmation(`Deseja excluir o material "${key}"?`, () => {
        delete systemData.materials[key];
        loadMaterials();
        addPendingChange('materials');
        showWarning('Material excluído.');
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
    
    systemData.empresas.forEach((empresa, index) => {
        const sigla = Object.keys(empresa)[0];
        const nome = empresa[sigla];
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" value="${escapeHtml(sigla)}"
                       onchange="updateEmpresaSigla(${index}, this.value)"
                       placeholder="Sigla (3 letras)">
            </td>
            <td>
                <input type="text" value="${escapeHtml(nome)}"
                       onchange="updateEmpresaNome(${index}, this.value)"
                       placeholder="Nome completo da empresa">
            </td>
            <td>
                <button class="btn btn-small btn-danger"
                        onclick="deleteEmpresa(${index})">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addEmpresa() {
    const newSigla = `NOV${Date.now().toString().slice(-3)}`;
    systemData.empresas.push({ [newSigla]: `Nova Empresa ${newSigla}` });
    loadEmpresas();
    addPendingChange('empresas');
}

function updateEmpresaSigla(index, newSigla) {
    const empresa = systemData.empresas[index];
    const oldSigla = Object.keys(empresa)[0];
    const nome = empresa[oldSigla];
    
    if (newSigla && newSigla !== oldSigla) {
        systemData.empresas[index] = { [newSigla]: nome };
        loadEmpresas();
        addPendingChange('empresas');
    }
}

function updateEmpresaNome(index, newNome) {
    const empresa = systemData.empresas[index];
    const sigla = Object.keys(empresa)[0];
    
    if (newNome && newNome !== empresa[sigla]) {
        systemData.empresas[index][sigla] = newNome;
        addPendingChange('empresas');
    }
}

function deleteEmpresa(index) {
    showConfirmation(`Deseja excluir esta empresa?`, () => {
        systemData.empresas.splice(index, 1);
        loadEmpresas();
        addPendingChange('empresas');
        showWarning('Empresa excluída.');
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
        if (!parsed.constants) throw new Error('Objeto constants não encontrado');
        if (!parsed.machines) throw new Error('Array machines não encontrado');
        if (!parsed.materials) throw new Error('Objeto materials não encontrado');
        if (!parsed.empresas) throw new Error('Array empresas não encontrado');
        
        updateJSONStatus('JSON válido e com estrutura correta', 'success');
        return true;
    } catch (error) {
        updateJSONStatus(`JSON inválido: ${error.message}`, 'error');
        return false;
    }
}

function updateJSONStatus(message, type) {
    const status = document.getElementById('jsonStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = '';
    
    switch (type) {
        case 'success':
            status.classList.add('success-message');
            break;
        case 'error':
            status.classList.add('error-message');
            break;
        case 'info':
            status.classList.add('warning-message');
            break;
    }
}

// ===== FUNÇÕES UTILITÁRIAS =====

function exportToJSON() {
    const dataStr = JSON.stringify(systemData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `sistema_dados_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showSuccess('JSON exportado com sucesso!');
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
                throw new Error('Estrutura de dados inválida');
            }
            
            systemData = importedData;
            loadData();
            showSuccess('Dados importados com sucesso!');
        } catch (error) {
            showError(`Erro ao importar JSON: ${error.message}`);
        }
    };
    reader.readAsText(file);
    
    // Resetar input
    event.target.value = '';
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filter = document.getElementById('searchFilter').value;
    
    if (!searchTerm) {
        showWarning('Digite um termo para buscar');
        return;
    }
    
    // Implementar busca específica
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
    let found = false;
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const text = Array.from(cells).map(cell => cell.textContent || '').join(' ').toLowerCase();
        
        if (text.includes(searchTerm)) {
            row.classList.add('highlight');
            found = true;
        } else {
            row.classList.remove('highlight');
        }
    });
    
    if (found) {
        showInfo('Resultados encontrados nas constantes');
    } else {
        showWarning('Nenhum resultado encontrado nas constantes');
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
    const saveBtn = document.querySelector('.btn-success');
    if (!saveBtn) return;
    
    if (pendingChanges.size > 0) {
        saveBtn.innerHTML = '<i class="icon-save"></i> Salvar (' + pendingChanges.size + ')';
        saveBtn.classList.add('saving');
    } else {
        saveBtn.innerHTML = '<i class="icon-save"></i> Salvar Tudo';
        saveBtn.classList.remove('saving');
    }
}

function validateData() {
    // Validar constantes
    for (const [key, value] of Object.entries(systemData.constants)) {
        if (typeof value !== 'number' || isNaN(value)) {
            showError(`Valor inválido para constante: ${key}`);
            return false;
        }
    }
    
    // Validar máquinas
    for (const machine of systemData.machines) {
        if (!machine.type || typeof machine.type !== 'string') {
            showError('Tipo de máquina inválido');
            return false;
        }
    }
    
    // Validar materiais
    for (const [key, value] of Object.entries(systemData.materials)) {
        if (typeof value !== 'number' || isNaN(value) || value < 0) {
            showError(`Preço inválido para material: ${key}`);
            return false;
        }
    }
    
    return true;
}

// ===== FUNÇÕES DE UI =====

function showConfirmation(message, callback) {
    const modal = document.getElementById('confirmationModal');
    const messageEl = document.getElementById('modalMessage');
    
    if (!modal || !messageEl) return;
    
    messageEl.textContent = message;
    modal.style.display = 'flex';
    
    window.confirmAction = function(confirmed) {
        modal.style.display = 'none';
        if (confirmed && callback) callback();
    };
}

function showLoading(message) {
    // Implementar overlay de loading
    console.log('Loading:', message);
}

function hideLoading() {
    console.log('Loading hidden');
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
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = text;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.maxWidth = '300px';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    
    // Carregar dados iniciais
    loadData();
});

// ===== FUNÇÕES PARA OS MODAIS =====

function confirmAction(confirmed) {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
    
    if (confirmed && window.confirmCallback) {
        window.confirmCallback();
        window.confirmCallback = null;
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
}

function saveEdit() {
    // Implementar lógica de salvamento do modal
    closeEditModal();
}

// ===== FUNÇÕES ADICIONAIS PARA MÁQUINAS =====

function deleteMachine(index) {
    showConfirmation(`Deseja excluir o tipo de máquina "${systemData.machines[index].type}"?`, () => {
        systemData.machines.splice(index, 1);
        loadMachines();
        populateMachineFilter();
        closeMachineDetail();
        addPendingChange('machines');
        showWarning('Máquina excluída.');
    });
}

// Nota: As funções para gerenciar configurações, valores base, opções e tensões
// serão implementadas de forma semelhante às outras funções CRUD.