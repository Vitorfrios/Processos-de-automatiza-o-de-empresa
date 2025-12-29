// scripts/03_Edit_data/core/equipamentos.js
// Sistema CRUD para equipamentos com interface estilo opções

// Importar sistema de estado global
import { systemData, addPendingChange } from '../config/state.js';

export function initEquipments() {
    console.log('🚀 Inicializando sistema de equipamentos...');
    
    // Verificar se estamos na página correta
    if (!document.getElementById('equipmentsTab')) {
        console.log('⚠️ Tab de equipamentos não encontrada');
        return;
    }
    
    // Inicializar sistema
    setupEquipmentSystem();
    
    console.log('✅ Sistema de equipamentos pronto');
}

// Configuração do sistema
function setupEquipmentSystem() {
    // Estado global
    window.equipmentsData = systemData.banco_equipamentos || {};
    
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
    window.deleteEquipment = deleteEquipment;
    window.addNewEquipment = addNewEquipment;
    window.toggleEquipmentItem = toggleEquipmentItem;
    window.removeEquipmentDimension = removeEquipmentDimension;
    window.addEquipmentDimension = addEquipmentDimension;
    window.syncEquipmentName = syncEquipmentName;
    window.updateEquipment = updateEquipment;
    window.updateEquipmentDimensionLabel = updateEquipmentDimensionLabel;
    window.updateEquipmentValue = updateEquipmentValue;
    window.selectEquipmentCodigo = selectEquipmentCodigo;
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
}

// Verifica se a tab está ativa
function isEquipmentTabActive() {
    return document.getElementById('equipmentsTab')?.classList.contains('active');
}

// ==================== FUNÇÕES PRINCIPAIS ====================

// Carrega dados da API
async function loadEquipmentsData() {
    try {
        const response = await fetch('/api/equipamentos');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.success && data.equipamentos) {
            window.equipmentsData = data.equipamentos;
            systemData.banco_equipamentos = data.equipamentos;
            renderEquipmentList();
            populateCodigosFilter();
        } else {
            throw new Error(data.error || 'Dados inválidos');
        }
        
    } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
        renderEmptyState();
    }
}

// Popula filtro de códigos
function populateCodigosFilter() {
    const filterSelect = document.getElementById('codigoFilter');
    if (!filterSelect) return;
    
    filterSelect.innerHTML = '<option value="">Todos os códigos</option>';
    
    const codigos = new Set();
    Object.values(window.equipmentsData).forEach(equipment => {
        if (equipment.codigo) {
            codigos.add(equipment.codigo);
        }
    });
    
    Array.from(codigos).sort().forEach(codigo => {
        const option = document.createElement('option');
        option.value = codigo;
        option.textContent = codigo;
        filterSelect.appendChild(option);
    });
}

// Renderiza lista de equipamentos
function renderEquipmentList(filterCodigo = '') {
    const equipmentList = document.getElementById('equipmentList');
    if (!equipmentList) return;
    
    equipmentList.innerHTML = '';
    
    const equipmentEntries = Object.entries(window.equipmentsData);
    
    if (equipmentEntries.length === 0) {
        equipmentList.innerHTML = `
            <div class="empty-state">
                <i class="icon-empty"></i>
                <p>Nenhum equipamento cadastrado</p>
                <button class="btn btn-primary mt-2" onclick="addNewEquipment()">
                    Adicionar Primeiro Equipamento
                </button>
            </div>
        `;
        return;
    }
    
    const filteredEntries = filterCodigo 
        ? equipmentEntries.filter(([_, equipment]) => equipment.codigo === filterCodigo)
        : equipmentEntries;
    
    if (filteredEntries.length === 0) {
        equipmentList.innerHTML = `
            <div class="empty-state">
                <i class="icon-empty"></i>
                <p>Nenhum equipamento encontrado para o código "${filterCodigo}"</p>
            </div>
        `;
        return;
    }
    
    filteredEntries.forEach(([id, equipment], index) => {
        const dimensions = equipment.valores_padrao || {};
        
        const equipmentItem = document.createElement('div');
        equipmentItem.className = 'equipment-item';
        equipmentItem.setAttribute('data-index', index);
        equipmentItem.setAttribute('data-id', id);
        
        equipmentItem.innerHTML = `
            <div class="equipment-header" onclick="toggleEquipmentItem(${index}, event)">
                <button class="minimizer">+</button>
                <span style="flex: 1; cursor: pointer;">
                    <strong>${escapeHtml(equipment.codigo || 'N/A')}</strong> - ${escapeHtml(equipment.descricao || 'Sem descrição')}
                </span>
                <button class="btn btn-xs btn-danger" onclick="deleteEquipment('${id}', event)">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="equipment-content collapsed">
                <div class="equipment-field">
                    <span class="equipment-label">Código/Sigla:</span>
                    <div style="flex: 1;">
                        <input type="text" id="equipmentCodigo-${index}" 
                               value="${escapeHtml(equipment.codigo || '')}" 
                               placeholder="Ex: VZ, DSP_15" 
                               onchange="updateEquipment(${index}, 'codigo', this.value)"
                               onfocus="selectEquipmentCodigo(${index})"
                               list="codigosList"
                               class="form-input">
                        <small class="text-muted">Código identificador do equipamento</small>
                    </div>
                </div>
                <div class="equipment-field">
                    <span class="equipment-label">Descrição:</span>
                    <input type="text" value="${escapeHtml(equipment.descricao || '')}" 
                           placeholder="Descrição detalhada do equipamento" 
                           oninput="syncEquipmentName(${index}, this.value)" 
                           onchange="updateEquipment(${index}, 'descricao', this.value)" 
                           class="form-input">
                </div>
                <div class="equipment-dimensions">
                    <h5>Dimensões e Valores:</h5>
                    <div class="dimensions-grid" id="dimensionsGrid-${index}">
                        ${renderDimensionGrid(dimensions, index)}
                    </div>
                    <div class="text-center mt-2">
                        <button class="btn btn-xs btn-info" onclick="addEquipmentDimension(${index}, event)">
                            <i class="icon-add"></i> Adicionar Dimensão
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        equipmentList.appendChild(equipmentItem);
    });
}

// Função de escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Renderiza grid de dimensões
function renderDimensionGrid(dimensions, index) {
    return Object.entries(dimensions).map(([dimensionKey, value], dimIndex) => `
        <div class="dimension-item" data-key="${dimensionKey}">
            <div class="dimension-header">
                <span>Dimensão ${dimIndex + 1}</span>
                <button class="btn btn-xs btn-danger" onclick="removeEquipmentDimension(${index}, '${dimensionKey}', event)">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="dimension-content">
                <div class="dimension-field">
                    <label>Dimensão:</label>
                    <input type="text" value="${escapeHtml(dimensionKey)}" 
                           placeholder="Ex: 300x400" 
                           onchange="updateEquipmentDimensionLabel(${index}, '${dimensionKey}', this.value)" 
                           class="form-input-small">
                </div>
                <div class="dimension-field">
                    <label>Valor (R$):</label>
                    <input type="number" value="${value}" step="0.01" min="0"
                           onchange="updateEquipmentValue(${index}, '${dimensionKey}', this.value)" 
                           class="form-input-small">
                </div>
            </div>
        </div>
    `).join('');
}

// Seleciona código para sugestão
function selectEquipmentCodigo(index) {
    const input = document.getElementById(`equipmentCodigo-${index}`);
    if (!input) return;
    
    if (!document.getElementById('codigosList')) {
        const datalist = document.createElement('datalist');
        datalist.id = 'codigosList';
        
        const codigos = new Set();
        Object.values(window.equipmentsData).forEach(equipment => {
            if (equipment.codigo) {
                codigos.add(equipment.codigo);
            }
        });
        
        Array.from(codigos).sort().forEach(codigo => {
            const option = document.createElement('option');
            option.value = codigo;
            datalist.appendChild(option);
        });
        
        document.body.appendChild(datalist);
    }
    
    input.setAttribute('list', 'codigosList');
}

// Alterna expansão/colapso do item
function toggleEquipmentItem(index, event) {
    if (event) {
        event.stopPropagation();
        if (event.target.closest('.btn-danger')) return;
    }
    
    const item = document.querySelector(`.equipment-item[data-index="${index}"]`);
    if (!item) return;
    
    const content = item.querySelector('.equipment-content');
    const minimizer = item.querySelector('.minimizer');
    
    content.classList.toggle('collapsed');
    minimizer.textContent = content.classList.contains('collapsed') ? '+' : '-';
    
    if (!content.classList.contains('collapsed')) {
        setTimeout(() => {
            const firstInput = content.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 50);
    }
}

// Adiciona nova dimensão ao equipamento
function addEquipmentDimension(index, event) {
    if (event) event.stopPropagation();
    
    const item = document.querySelector(`.equipment-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.equipmentsData[id]) return;
    
    const content = item.querySelector('.equipment-content');
    const minimizer = item.querySelector('.minimizer');
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        minimizer.textContent = '-';
    }
    
    const dimensions = window.equipmentsData[id].valores_padrao || {};
    let newKey = `300x200`;
    let counter = 1;
    while (dimensions[newKey]) {
        newKey = `300x${200 + counter * 100}`;
        counter++;
    }
    
    dimensions[newKey] = 0;
    window.equipmentsData[id].valores_padrao = dimensions;
    systemData.banco_equipamentos = window.equipmentsData;
    
    addPendingChange('banco_equipamentos');
    
    const grid = document.getElementById(`dimensionsGrid-${index}`);
    if (grid) {
        const newItem = document.createElement('div');
        newItem.className = 'dimension-item';
        newItem.setAttribute('data-key', newKey);
        newItem.innerHTML = `
            <div class="dimension-header">
                <span>Dimensão ${Object.keys(dimensions).length}</span>
                <button class="btn btn-xs btn-danger" onclick="removeEquipmentDimension(${index}, '${newKey}', event)">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="dimension-content">
                <div class="dimension-field">
                    <label>Dimensão:</label>
                    <input type="text" value="${escapeHtml(newKey)}" 
                           placeholder="Ex: 300x400" 
                           onchange="updateEquipmentDimensionLabel(${index}, '${newKey}', this.value)" 
                           class="form-input-small">
                </div>
                <div class="dimension-field">
                    <label>Valor (R$):</label>
                    <input type="number" value="0" step="0.01" min="0"
                           onchange="updateEquipmentValue(${index}, '${newKey}', this.value)" 
                           class="form-input-small">
                </div>
            </div>
        `;
        grid.appendChild(newItem);
        
        setTimeout(() => {
            const input = newItem.querySelector('input[type="text"]');
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }
}

// Remove dimensão do equipamento
function removeEquipmentDimension(index, key, event) {
    if (event) event.stopPropagation();
    
    if (!confirm(`Remover dimensão "${key}"?`)) return;
    
    const item = document.querySelector(`.equipment-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.equipmentsData[id]) return;
    
    delete window.equipmentsData[id].valores_padrao[key];
    systemData.banco_equipamentos = window.equipmentsData;
    
    addPendingChange('banco_equipamentos');
    
    const dimensionItem = document.querySelector(`.dimension-item[data-key="${key}"]`);
    if (dimensionItem) dimensionItem.remove();
    
    const grid = document.getElementById(`dimensionsGrid-${index}`);
    if (grid) {
        const items = grid.querySelectorAll('.dimension-item');
        items.forEach((item, idx) => {
            const header = item.querySelector('.dimension-header span');
            if (header) header.textContent = `Dimensão ${idx + 1}`;
        });
    }
}

// Sincroniza nome no header
function syncEquipmentName(index, value) {
    const item = document.querySelector(`.equipment-item[data-index="${index}"]`);
    if (!item) return;
    
    const headerText = item.querySelector('.equipment-header span');
    if (headerText) {
        const codigo = window.equipmentsData[item.getAttribute('data-id')]?.codigo || '';
        headerText.innerHTML = `<strong>${escapeHtml(codigo)}</strong> - ${escapeHtml(value || 'Sem descrição')}`;
    }
}

// Atualiza campo do equipamento
function updateEquipment(index, field, value) {
    const item = document.querySelector(`.equipment-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.equipmentsData[id]) return;
    
    const oldValue = window.equipmentsData[id][field];
    
    if (field === 'codigo') {
        const newCodigo = value.trim().toUpperCase();
        if (!newCodigo) {
            alert('O código/sigla é obrigatório!');
            return;
        }
        
        const existingEquipments = Object.entries(window.equipmentsData);
        for (const [equipId, equipment] of existingEquipments) {
            if (equipId !== id && equipment.codigo === newCodigo) {
                alert(`Código "${newCodigo}" já está em uso por outro equipamento!`);
                return;
            }
        }
        
        value = newCodigo;
        
        const headerText = item.querySelector('.equipment-header span');
        if (headerText) {
            const descricao = window.equipmentsData[id].descricao || '';
            headerText.innerHTML = `<strong>${escapeHtml(value)}</strong> - ${escapeHtml(descricao)}`;
        }
    }
    
    window.equipmentsData[id][field] = value;
    systemData.banco_equipamentos = window.equipmentsData;
    
    addPendingChange('banco_equipamentos');
    
    if (field === 'codigo' && oldValue !== value) {
        setTimeout(() => populateCodigosFilter(), 100);
    }
}

// Atualiza label da dimensão
function updateEquipmentDimensionLabel(index, oldKey, newKey) {
    const item = document.querySelector(`.equipment-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.equipmentsData[id]) return;
    
    const dimensions = window.equipmentsData[id].valores_padrao;
    if (!dimensions) return;
    
    if (newKey === oldKey) return;
    
    if (!/^\d+(x\d+)?$/.test(newKey)) {
        alert('Formato de dimensão inválido! Use: LARGURAxALTURA (ex: 300x400)');
        return;
    }
    
    if (dimensions[newKey]) {
        alert('Esta dimensão já existe!');
        return;
    }
    
    dimensions[newKey] = dimensions[oldKey];
    delete dimensions[oldKey];
    systemData.banco_equipamentos = window.equipmentsData;
    
    addPendingChange('banco_equipamentos');
    
    const dimensionItem = document.querySelector(`.dimension-item[data-key="${oldKey}"]`);
    if (dimensionItem) {
        dimensionItem.setAttribute('data-key', newKey);
        const input = dimensionItem.querySelector('input[type="text"]');
        if (input) input.value = newKey;
    }
}

// Atualiza valor da dimensão
function updateEquipmentValue(index, key, value) {
    const item = document.querySelector(`.equipment-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.equipmentsData[id]) return;
    
    const dimensions = window.equipmentsData[id].valores_padrao;
    if (!dimensions) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
        alert('Informe um valor numérico válido maior ou igual a zero!');
        return;
    }
    
    dimensions[key] = numValue;
    systemData.banco_equipamentos = window.equipmentsData;
    
    addPendingChange('banco_equipamentos');
}

// Adiciona novo equipamento
function addNewEquipment() {
    const newId = `equip_${Date.now()}`;
    
    window.equipmentsData[newId] = {
        codigo: '',
        descricao: 'Novo Equipamento',
        valores_padrao: { '300x200': 0 }
    };
    
    systemData.banco_equipamentos = window.equipmentsData;
    
    addPendingChange('banco_equipamentos');
    
    renderEquipmentList();
    
    setTimeout(() => {
        const items = document.querySelectorAll('.equipment-item');
        const newItem = items[items.length - 1];
        if (newItem) {
            newItem.scrollIntoView({ behavior: 'smooth' });
            
            const index = newItem.getAttribute('data-index');
            if (index) {
                const content = newItem.querySelector('.equipment-content');
                const minimizer = newItem.querySelector('.minimizer');
                
                content.classList.remove('collapsed');
                minimizer.textContent = '-';
                
                setTimeout(() => {
                    const codigoInput = newItem.querySelector('input[id^="equipmentCodigo-"]');
                    if (codigoInput) {
                        codigoInput.focus();
                        codigoInput.select();
                    }
                }, 100);
            }
        }
    }, 100);
}

// Exclui equipamento
async function deleteEquipment(id, event) {
    if (event) event.stopPropagation();
    
    const equipment = window.equipmentsData[id];
    if (!equipment) {
        alert('Equipamento não encontrado!');
        return;
    }
    
    const codigo = equipment.codigo;
    const descricao = equipment.descricao || 'Sem descrição';
    
    if (!confirm(`Excluir equipamento "${codigo} - ${descricao}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/equipamentos/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ tipo: id })
        });
        
        if (!response.ok) {
            throw new Error(`Falha ao excluir equipamento`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro ao excluir equipamento');
        }
        
        delete window.equipmentsData[id];
        systemData.banco_equipamentos = window.equipmentsData;
        
        addPendingChange('banco_equipamentos');
        
        renderEquipmentList();
        populateCodigosFilter();
        
        showNotification('Equipamento excluído com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showNotification(`Erro: ${error.message}`, 'error');
    }
}

// Filtra equipamentos por código
function filterEquipmentTable() {
    const filterSelect = document.getElementById('codigoFilter');
    renderEquipmentList(filterSelect?.value || '');
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

function showNotification(message, type = 'info') {
    // Usar sistema de notificação global se disponível
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Fallback simples
        alert(`${type === 'error' ? '❌' : '✅'} ${message}`);
    }
}

function renderEmptyState() {
    const equipmentList = document.getElementById('equipmentList');
    if (!equipmentList) return;
    
    equipmentList.innerHTML = `
        <div class="empty-state">
            <i class="icon-empty"></i>
            <p>Não foi possível carregar os equipamentos</p>
            <button class="btn btn-primary mt-2" onclick="loadEquipmentsData()">
                Tentar novamente
            </button>
        </div>
    `;
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof initEquipments === 'function') {
                initEquipments();
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        if (typeof initEquipments === 'function') {
            initEquipments();
        }
    }, 100);
}

// Exportar por padrão
export default {
    initEquipments,
    loadEquipmentsData,
    deleteEquipment,
    addNewEquipment
};