// scripts/03_Edit_data/core/equipamentos.js
// Sistema CRUD completo para equipamentos

export function initEquipments() {
    console.log('🚀 Inicializando sistema de equipamentos...');
    
    // Verificar se estamos na página correta
    if (!document.getElementById('equipmentsTab')) {
        console.log('⚠️ Tab de equipamentos não encontrada, saindo...');
        return;
    }
    
    // Inicializar sistema
    setupEquipmentSystem();
    
    console.log('✅ Sistema de equipamentos pronto');
}

// Configuração do sistema
function setupEquipmentSystem() {
    // Estado global
    window.equipmentsData = {};
    window.currentEquipmentType = '';
    window.equipmentViewMode = 'table';
    
    // Expor funções globais
    exposeGlobalFunctions();
    
    // Configurar listeners
    setupEventListeners();
    
    // Carregar se tab está ativa
    if (document.getElementById('equipmentsTab').classList.contains('active')) {
        setTimeout(loadEquipmentsData, 100);
    }
}

// Expor funções globais
function exposeGlobalFunctions() {
    window.loadEquipmentsData = loadEquipmentsData;
    window.filterEquipmentTable = filterEquipmentTable;
    window.editEquipmentType = editEquipmentType;
    window.saveEquipmentChanges = saveEquipmentChanges;
    window.deleteEquipmentType = deleteEquipmentType;
    window.addNewEquipmentType = addNewEquipmentType;
    window.addDimensionToEquipment = addDimensionToEquipment;
    window.toggleEquipmentView = toggleEquipmentView;
    window.closeEquipmentDetail = closeEquipmentDetail;
    window.resetEquipmentChanges = resetEquipmentChanges;
    window.addNewDimension = addNewDimension;
    window.removeDimension = removeDimension;
    window.updateDimensionName = updateDimensionName;
    window.updateDimensionValue = updateDimensionValue;
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Listener para tab de equipamentos
    const equipmentTabBtn = document.querySelector('.tab[onclick*="equipments"]');
    if (equipmentTabBtn) {
        equipmentTabBtn.addEventListener('click', () => {
            setTimeout(() => {
                if (isEquipmentTabActive()) {
                    loadEquipmentsData();
                }
            }, 150);
        });
    }
    
    // Enter nos campos de nova dimensão
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && isEquipmentTabActive()) {
            const activeElement = document.activeElement;
            if (activeElement.id === 'newDimensionName' || activeElement.id === 'newDimensionValue') {
                addNewDimension();
            }
        }
    });
}

// Verifica se a tab está ativa
function isEquipmentTabActive() {
    return document.getElementById('equipmentsTab')?.classList.contains('active');
}

// ==================== FUNÇÕES PRINCIPAIS ====================

// Carrega dados da API
async function loadEquipmentsData() {
    try {
        console.log('📥 Carregando equipamentos...');
        showEquipmentStatus('Carregando equipamentos...', 'info');
        
        const response = await fetch('/api/equipamentos');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        
        if (data.success && data.equipamentos) {
            window.equipmentsData = data.equipamentos;
            renderEquipmentTable();
            populateEquipmentTypeFilter();
            showEquipmentStatus(`${Object.keys(data.equipamentos).length} equipamentos carregados`, 'success');
        } else {
            throw new Error(data.error || 'Dados inválidos');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        showEquipmentStatus(`Erro: ${error.message}`, 'error');
        renderEmptyState(error.message);
    }
}

// Preenche filtro de tipos
function populateEquipmentTypeFilter() {
    const filterSelect = document.getElementById('equipmentTypeFilter');
    if (!filterSelect) return;
    
    filterSelect.innerHTML = '<option value="">Todos os tipos</option>';
    
    Object.keys(window.equipmentsData).forEach(type => {
        const equipment = window.equipmentsData[type];
        const option = document.createElement('option');
        option.value = type;
        option.textContent = `${type} - ${equipment.descricao}`;
        filterSelect.appendChild(option);
    });
}

// Renderiza tabela principal
function renderEquipmentTable(filterType = '') {
    const tableBody = document.getElementById('equipmentsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const filteredTypes = filterType 
        ? [filterType] 
        : Object.keys(window.equipmentsData);
    
    filteredTypes.forEach(type => {
        const equipment = window.equipmentsData[type];
        if (!equipment) return;
        
        const dimensions = equipment.valores_padrao || {};
        const dimensionKeys = Object.keys(dimensions);
        
        if (dimensionKeys.length === 0) {
            // Sem dimensões
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="equipment-code">${type}</span>
                </td>
                <td>${equipment.descricao}</td>
                <td colspan="2" class="text-muted">Sem dimensões cadastradas</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editEquipmentType('${type}')">
                        <i class="icon-edit"></i> Editar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }
        
        // Com dimensões
        dimensionKeys.forEach((dimension, index) => {
            const row = document.createElement('tr');
            
            if (index === 0) {
                row.innerHTML = `
                    <td rowspan="${dimensionKeys.length}">
                        <span class="equipment-code">${type}</span>
                        <span class="equipment-desc">${equipment.descricao}</span>
                    </td>
                    <td rowspan="${dimensionKeys.length}">
                        <span class="equipment-desc">
                            <small>${dimensionKeys.length} dimensões</small>
                        </span>
                    </td>
                    <td class="dimension-cell">${dimension}</td>
                    <td class="value-cell">${formatCurrency(dimensions[dimension])}</td>
                    <td rowspan="${dimensionKeys.length}">
                        <div class="equipment-actions">
                            <button class="btn btn-sm btn-primary" onclick="editEquipmentType('${type}')">
                                <i class="icon-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteEquipmentType('${type}')">
                                <i class="icon-delete"></i> Excluir
                            </button>
                        </div>
                    </td>
                `;
            } else {
                row.innerHTML = `
                    <td class="dimension-cell">${dimension}</td>
                    <td class="value-cell">${formatCurrency(dimensions[dimension])}</td>
                `;
            }
            
            tableBody.appendChild(row);
        });
    });
    
    if (tableBody.innerHTML === '') {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    Nenhum equipamento encontrado
                </td>
            </tr>
        `;
    }
}

// Filtra tabela
function filterEquipmentTable() {
    const filterSelect = document.getElementById('equipmentTypeFilter');
    renderEquipmentTable(filterSelect?.value || '');
}

// Abre editor de equipamento
function editEquipmentType(type) {
    if (!window.equipmentsData[type]) return;
    
    window.currentEquipmentType = type;
    const equipment = window.equipmentsData[type];
    
    // Mostrar editor
    document.getElementById('equipmentTableView').style.display = 'none';
    document.getElementById('equipmentDetailView').style.display = 'block';
    
    // Atualizar título
    document.getElementById('equipmentDetailTitle').textContent = `${type} - ${equipment.descricao}`;
    
    // Renderizar formulário
    renderEquipmentEditForm(equipment);
}

// Renderiza formulário de edição
function renderEquipmentEditForm(equipment) {
    const content = document.getElementById('equipmentDetailContent');
    const dimensions = equipment.valores_padrao || {};
    
    content.innerHTML = `
        <div class="equipment-edit-form">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Código:</label>
                        <input type="text" class="form-control" value="${window.currentEquipmentType}" disabled>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Descrição:</label>
                        <input type="text" id="editEquipmentDesc" class="form-control" 
                               value="${equipment.descricao}" maxlength="100">
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h5><i class="icon-list"></i> Dimensões e Valores</h5>
                <div class="dimensions-table-container">
                    <table class="dimensions-table">
                        <thead>
                            <tr>
                                <th width="45%">Dimensão</th>
                                <th width="45%">Valor (R$)</th>
                                <th width="10%">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="dimensionsTableBody">
                            ${Object.keys(dimensions).map(dim => `
                                <tr data-dimension="${dim}">
                                    <td>
                                        <input type="text" class="dimension-input" 
                                               value="${dim}" 
                                               onchange="updateDimensionName('${dim}', this.value)">
                                    </td>
                                    <td>
                                        <input type="number" class="value-input" 
                                               value="${dimensions[dim]}" step="0.01"
                                               onchange="updateDimensionValue('${dim}', this.value)">
                                    </td>
                                    <td>
                                        <button class="btn btn-xs btn-danger" 
                                                onclick="removeDimension('${dim}')"
                                                title="Remover dimensão">
                                            <i class="icon-delete"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="add-dimension-form">
                    <h6>Adicionar Nova Dimensão</h6>
                    <div class="form-row">
                        <input type="text" id="newDimensionName" 
                               class="form-control" placeholder="Ex: 200x100">
                        <input type="number" id="newDimensionValue" 
                               class="form-control" placeholder="Valor" step="0.01">
                        <button class="btn btn-success" onclick="addNewDimension()">
                            <i class="icon-add"></i> Adicionar
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="form-actions mt-4">
                <button class="btn btn-success" onclick="saveEquipmentChanges()">
                    <i class="icon-save"></i> Salvar Alterações
                </button>
                <button class="btn btn-secondary" onclick="closeEquipmentDetail()">
                    <i class="icon-close"></i> Cancelar
                </button>
            </div>
        </div>
    `;
}

// Salva alterações
async function saveEquipmentChanges() {
    try {
        const newDesc = document.getElementById('editEquipmentDesc').value.trim();
        if (!newDesc) throw new Error('Descrição é obrigatória');
        
        window.equipmentsData[window.currentEquipmentType].descricao = newDesc;
        
        const response = await fetch('/api/equipamentos/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                tipo: window.currentEquipmentType,
                descricao: newDesc,
                valores: window.equipmentsData[window.currentEquipmentType].valores_padrao
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        
        showEquipmentStatus('Equipamento salvo com sucesso!', 'success');
        closeEquipmentDetail();
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        showEquipmentStatus(`Erro: ${error.message}`, 'error');
    }
}

// Fecha editor
function closeEquipmentDetail() {
    document.getElementById('equipmentDetailView').style.display = 'none';
    document.getElementById('equipmentTableView').style.display = 'block';
    renderEquipmentTable();
}

// Adiciona nova dimensão
function addNewDimension() {
    const nameInput = document.getElementById('newDimensionName');
    const valueInput = document.getElementById('newDimensionValue');
    
    const name = nameInput.value.trim();
    const value = parseFloat(valueInput.value);
    
    if (!name || !validateDimensionFormat(name)) {
        alert('Formato de dimensão inválido! Use: LARGURAxALTURA');
        nameInput.focus();
        return;
    }
    
    if (isNaN(value) || value <= 0) {
        alert('Informe um valor válido maior que zero!');
        valueInput.focus();
        return;
    }
    
    if (window.equipmentsData[window.currentEquipmentType].valores_padrao[name]) {
        alert('Dimensão já existe!');
        nameInput.focus();
        return;
    }
    
    // Adicionar
    window.equipmentsData[window.currentEquipmentType].valores_padrao[name] = value;
    
    // Atualizar tabela
    const tableBody = document.getElementById('dimensionsTableBody');
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-dimension', name);
    newRow.innerHTML = `
        <td>
            <input type="text" class="dimension-input" 
                   value="${name}" 
                   onchange="updateDimensionName('${name}', this.value)">
        </td>
        <td>
            <input type="number" class="value-input" 
                   value="${value}" step="0.01"
                   onchange="updateDimensionValue('${name}', this.value)">
        </td>
        <td>
            <button class="btn btn-xs btn-danger" 
                    onclick="removeDimension('${name}')"
                    title="Remover dimensão">
                <i class="icon-delete"></i>
            </button>
        </td>
    `;
    tableBody.appendChild(newRow);
    
    // Limpar campos
    nameInput.value = '';
    valueInput.value = '';
    nameInput.focus();
}

// Remove dimensão
function removeDimension(dimension) {
    if (!confirm(`Remover dimensão "${dimension}"?`)) return;
    
    delete window.equipmentsData[window.currentEquipmentType].valores_padrao[dimension];
    
    const row = document.querySelector(`[data-dimension="${dimension}"]`);
    if (row) row.remove();
}

// Valida formato de dimensão
function validateDimensionFormat(dimension) {
    return /^\d+x\d+$/.test(dimension);
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(value);
}

function showEquipmentStatus(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Pode implementar um sistema de notificação visual aqui
    if (type === 'error') {
        alert(`❌ ${message}`);
    } else if (type === 'success') {
        // Não alerta para sucesso, apenas log
    }
}

function renderEmptyState(error = '') {
    const tableBody = document.getElementById('equipmentsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-5">
                <div class="text-muted mb-2">
                    <i class="icon-empty" style="font-size: 2rem;"></i>
                    <p class="mt-2">Não foi possível carregar os equipamentos</p>
                    ${error ? `<small class="text-danger">${error}</small>` : ''}
                </div>
                <button class="btn btn-primary mt-3" onclick="loadEquipmentsData()">
                    <i class="icon-refresh"></i> Tentar novamente
                </button>
            </td>
        </tr>
    `;
}

// Adiciona dimensão a equipamento existente
function addDimensionToEquipment() {
    const types = Object.keys(window.equipmentsData);
    if (types.length === 0) {
        alert('Primeiro crie um tipo de equipamento!');
        return;
    }
    
    const typeList = types.join('\n');
    const selected = prompt(`Digite o código do equipamento:\n\n${typeList}`);
    
    if (selected && window.equipmentsData[selected]) {
        editEquipmentType(selected);
        setTimeout(() => {
            const nameInput = document.getElementById('newDimensionName');
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

// Exclui equipamento
async function deleteEquipmentType(type) {
    if (!confirm(`Excluir equipamento "${type}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/equipamentos/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ tipo: type })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        
        delete window.equipmentsData[type];
        renderEquipmentTable();
        populateEquipmentTypeFilter();
        showEquipmentStatus('Equipamento excluído com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        showEquipmentStatus(`Erro: ${error.message}`, 'error');
    }
}

// Adiciona novo tipo
async function addNewEquipmentType() {
    const code = prompt('Código do equipamento (ex: VZ, DSP_15):');
    if (!code) return;
    
    if (!/^[A-Z0-9_]+$/.test(code)) {
        alert('Use apenas letras maiúsculas, números e underline!');
        return;
    }
    
    if (window.equipmentsData[code]) {
        alert('Código já existe!');
        return;
    }
    
    const desc = prompt('Descrição do equipamento:');
    if (!desc) return;
    
    try {
        const response = await fetch('/api/equipamentos/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                tipo: code,
                descricao: desc,
                valores: {}
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        
        window.equipmentsData[code] = { descricao: desc, valores_padrao: {} };
        renderEquipmentTable();
        populateEquipmentTypeFilter();
        showEquipmentStatus('Equipamento criado! Editando...', 'success');
        
        setTimeout(() => editEquipmentType(code), 300);
        
    } catch (error) {
        console.error('❌ Erro ao criar:', error);
        showEquipmentStatus(`Erro: ${error.message}`, 'error');
    }
}

// Funções placeholder (para implementação futura)
function toggleEquipmentView() {
    alert('Funcionalidade em desenvolvimento!');
}

function resetEquipmentChanges() {
    if (confirm('Descartar todas as alterações?')) {
        closeEquipmentDetail();
    }
}

function updateDimensionName(oldName, newName) {
    if (!newName || oldName === newName) return;
    
    if (!validateDimensionFormat(newName)) {
        alert('Formato inválido! Use: LARGURAxALTURA');
        return;
    }
    
    const valores = window.equipmentsData[window.currentEquipmentType].valores_padrao;
    if (valores[newName]) {
        alert('Dimensão já existe!');
        return;
    }
    
    valores[newName] = valores[oldName];
    delete valores[oldName];
    
    const row = document.querySelector(`[data-dimension="${oldName}"]`);
    if (row) row.setAttribute('data-dimension', newName);
}

function updateDimensionValue(dimension, newValue) {
    const value = parseFloat(newValue);
    if (isNaN(value) || value < 0) return;
    
    window.equipmentsData[window.currentEquipmentType].valores_padrao[dimension] = value;
}

// Inicialização automática
setTimeout(() => {
    if (typeof initEquipments === 'function') {
        initEquipments();
    }
}, 100);