// scripts/03_Edit_data/core/acessorios.js
// Sistema CRUD para acessorios com interface estilo opções

// Importar sistema de estado global
import { systemData, addPendingChange } from '../config/state.js';

export function initAcessories() {
    console.log('🚀 Inicializando sistema de acessorios...');
    
    // Verificar se estamos na página correta
    if (!document.getElementById('acessoriesTab')) {
        console.log('⚠️ Tab de acessorios não encontrada');
        return;
    }
    
    // Inicializar sistema
    setupAcessorieSystem();
    
    console.log('✅ Sistema de acessorios pronto');
}

// Configuração do sistema
function setupAcessorieSystem() {
    // Estado global
    window.acessoriesData = systemData.banco_acessorios || {};
    
    // Expor funções globais
    exposeGlobalFunctions();
    
    // Configurar listeners
    setupEventListeners();
    
    // Carregar se tab está ativa
    if (document.getElementById('acessoriesTab').classList.contains('active')) {
        setTimeout(loadAcessoriesData, 100);
    }
}

// Expor funções globais
function exposeGlobalFunctions() {
    window.loadAcessoriesData = loadAcessoriesData;
    window.filterAcessorieTable = filterAcessorieTable;
    window.deleteAcessorie = deleteAcessorie;
    window.addNewAcessorie = addNewAcessorie;
    window.toggleAcessorieItem = toggleAcessorieItem;
    window.removeAcessorieDimension = removeAcessorieDimension;
    window.addAcessorieDimension = addAcessorieDimension;
    window.syncAcessorieName = syncAcessorieName;
    window.updateAcessorie = updateAcessorie;
    window.updateAcessorieDimensionLabel = updateAcessorieDimensionLabel;
    window.updateAcessorieValue = updateAcessorieValue;
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Listener para tab de acessorios
    const acessorieTabBtn = document.querySelector('.tab[onclick*="acessories"]');
    if (acessorieTabBtn) {
        acessorieTabBtn.addEventListener('click', () => {
            setTimeout(() => {
                if (isAcessorieTabActive()) {
                    loadAcessoriesData();
                }
            }, 150);
        });
    }
}

// Verifica se a tab está ativa
function isAcessorieTabActive() {
    return document.getElementById('acessoriesTab')?.classList.contains('active');
}

// ==================== FUNÇÕES PRINCIPAIS ====================

// Carrega dados da API
async function loadAcessoriesData() {
    try {
        const response = await fetch('/api/acessorios');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.success && data.acessorios) {
            window.acessoriesData = data.acessorios;
            systemData.banco_acessorios = data.acessorios;
            renderAcessorieList();
            populateCodigosFilter();
        } else {
            throw new Error(data.error || 'Dados inválidos');
        }
        
    } catch (error) {
        console.error('Erro ao carregar acessorios:', error);
        renderEmptyState();
    }
}

// Popula filtro de códigos
function populateCodigosFilter() {
    const filterSelect = document.getElementById('codigoFilter');
    if (!filterSelect) return;
    
    filterSelect.innerHTML = '<option value="">Todos os códigos</option>';
    
    const codigos = new Set();
    Object.values(window.acessoriesData).forEach(acessorie => {
        if (acessorie.codigo) {
            codigos.add(acessorie.codigo);
        }
    });
    
    Array.from(codigos).sort().forEach(codigo => {
        const option = document.createElement('option');
        option.value = codigo;
        option.textContent = codigo;
        filterSelect.appendChild(option);
    });
}

// Renderiza lista de acessorios
function renderAcessorieList(filterCodigo = '') {
    const acessorieList = document.getElementById('acessorieList');
    if (!acessorieList) return;
    
    acessorieList.innerHTML = '';
    
    const acessorieEntries = Object.entries(window.acessoriesData);
    
    if (acessorieEntries.length === 0) {
        acessorieList.innerHTML = `
            <div class="empty-state">
                <i class="icon-empty"></i>
                <p>Nenhum acessorio cadastrado</p>
                <button class="btn btn-primary mt-2" onclick="addNewAcessorie()">
                    Adicionar Primeiro Acessorio
                </button>
            </div>
        `;
        return;
    }
    
    const filteredEntries = filterCodigo 
        ? acessorieEntries.filter(([_, acessorie]) => acessorie.codigo === filterCodigo)
        : acessorieEntries;
    
    if (filteredEntries.length === 0) {
        acessorieList.innerHTML = `
            <div class="empty-state">
                <i class="icon-empty"></i>
                <p>Nenhum acessorio encontrado para o código "${filterCodigo}"</p>
            </div>
        `;
        return;
    }
    
    filteredEntries.forEach(([id, acessorie], index) => {
        const dimensions = acessorie.valores_padrao || {};
        
        const acessorieItem = document.createElement('div');
        acessorieItem.className = 'acessorie-item';
        acessorieItem.setAttribute('data-index', index);
        acessorieItem.setAttribute('data-id', id);
        
        acessorieItem.innerHTML = `
            <div class="acessorie-header" onclick="toggleAcessorieItem(${index}, event)">
                <button class="minimizer">+</button>
                <span style="flex: 1; cursor: pointer;">
                    <strong>${escapeHtml(acessorie.codigo || 'N/A')}</strong> - ${escapeHtml(acessorie.descricao || 'Sem descrição')}
                </span>
                <button class="btn btn-xs btn-danger" onclick="deleteAcessorie('${id}', event)">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="acessorie-content collapsed">
                <div class="acessorie-field">
                    <span class="acessorie-label">Código/Sigla:</span>
                    <div style="flex: 1;">
                        <input type="text" id="acessorieCodigo-${index}" 
                               value="${escapeHtml(acessorie.codigo || '')}" 
                               placeholder="Ex: VZ, DSP_15" 
                               onchange="updateAcessorie(${index}, 'codigo', this.value)"
                               class="form-input">
                        <small class="text-muted">Código identificador do acessorio</small>
                    </div>
                </div>
                <div class="acessorie-field">
                    <span class="acessorie-label">Descrição:</span>
                    <input type="text" value="${escapeHtml(acessorie.descricao || '')}" 
                           placeholder="Descrição detalhada do acessorio" 
                           oninput="syncAcessorieName(${index}, this.value)" 
                           onchange="updateAcessorie(${index}, 'descricao', this.value)" 
                           class="form-input">
                </div>
                <div class="acessorie-dimensions">
                    <h5>Dimensões e Valores:</h5>
                    <div class="dimensions-grid" id="dimensionsGrid-${index}">
                        ${renderDimensionGrid(dimensions, index)}
                    </div>
                    <div class="text-center mt-2">
                        <button class="btn btn-xs btn-info" onclick="addAcessorieDimension(${index}, event)">
                            <i class="icon-add"></i> Adicionar Dimensão
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        acessorieList.appendChild(acessorieItem);
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
                <button class="btn btn-xs btn-danger" onclick="removeAcessorieDimension(${index}, '${dimensionKey}', event)">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="dimension-content">
                <div class="dimension-field">
                    <label>Dimensão:</label>
                    <input type="text" value="${escapeHtml(dimensionKey)}" 
                           placeholder="Ex: 300x400" 
                           onchange="updateAcessorieDimensionLabel(${index}, '${dimensionKey}', this.value)" 
                           class="form-input-small">
                </div>
                <div class="dimension-field">
                    <label>Valor (R$):</label>
                    <input type="number" value="${value}" step="0.01" min="0"
                           onchange="updateAcessorieValue(${index}, '${dimensionKey}', this.value)" 
                           class="form-input-small">
                </div>
            </div>
        </div>
    `).join('');
}



// Alterna expansão/colapso do item
function toggleAcessorieItem(index, event) {
    if (event) {
        event.stopPropagation();
        if (event.target.closest('.btn-danger')) return;
    }
    
    const item = document.querySelector(`.acessorie-item[data-index="${index}"]`);
    if (!item) return;
    
    const content = item.querySelector('.acessorie-content');
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

// Adiciona nova dimensão ao acessorio
function addAcessorieDimension(index, event) {
    if (event) event.stopPropagation();
    
    const item = document.querySelector(`.acessorie-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.acessoriesData[id]) return;
    
    const content = item.querySelector('.acessorie-content');
    const minimizer = item.querySelector('.minimizer');
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        minimizer.textContent = '-';
    }
    
    const dimensions = window.acessoriesData[id].valores_padrao || {};
    let newKey = `300x200`;
    let counter = 1;
    while (dimensions[newKey]) {
        newKey = `300x${200 + counter * 100}`;
        counter++;
    }
    
    dimensions[newKey] = 0;
    window.acessoriesData[id].valores_padrao = dimensions;
    systemData.banco_acessorios = window.acessoriesData;
    
    addPendingChange('banco_acessorios');
    
    const grid = document.getElementById(`dimensionsGrid-${index}`);
    if (grid) {
        const newItem = document.createElement('div');
        newItem.className = 'dimension-item';
        newItem.setAttribute('data-key', newKey);
        newItem.innerHTML = `
            <div class="dimension-header">
                <span>Dimensão ${Object.keys(dimensions).length}</span>
                <button class="btn btn-xs btn-danger" onclick="removeAcessorieDimension(${index}, '${newKey}', event)">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="dimension-content">
                <div class="dimension-field">
                    <label>Dimensão:</label>
                    <input type="text" value="${escapeHtml(newKey)}" 
                           placeholder="Ex: 300x400" 
                           onchange="updateAcessorieDimensionLabel(${index}, '${newKey}', this.value)" 
                           class="form-input-small">
                </div>
                <div class="dimension-field">
                    <label>Valor (R$):</label>
                    <input type="number" value="0" step="0.01" min="0"
                           onchange="updateAcessorieValue(${index}, '${newKey}', this.value)" 
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

// Remove dimensão do acessorio
function removeAcessorieDimension(index, key, event) {
    if (event) event.stopPropagation();
    
    if (!confirm(`Remover dimensão "${key}"?`)) return;
    
    const item = document.querySelector(`.acessorie-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.acessoriesData[id]) return;
    
    delete window.acessoriesData[id].valores_padrao[key];
    systemData.banco_acessorios = window.acessoriesData;
    
    addPendingChange('banco_acessorios');
    
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
function syncAcessorieName(index, value) {
    const item = document.querySelector(`.acessorie-item[data-index="${index}"]`);
    if (!item) return;
    
    const headerText = item.querySelector('.acessorie-header span');
    if (headerText) {
        const codigo = window.acessoriesData[item.getAttribute('data-id')]?.codigo || '';
        headerText.innerHTML = `<strong>${escapeHtml(codigo)}</strong> - ${escapeHtml(value || 'Sem descrição')}`;
    }
}

// Atualiza campo do acessorio
function updateAcessorie(index, field, value) {
    const item = document.querySelector(`.acessorie-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.acessoriesData[id]) return;
    
    const oldValue = window.acessoriesData[id][field];
    
    if (field === 'codigo') {
        const newCodigo = value.trim().toUpperCase();
        if (!newCodigo) {
            alert('O código/sigla é obrigatório!');
            return;
        }
        
        const existingAcessories = Object.entries(window.acessoriesData);
        for (const [equipId, acessorie] of existingAcessories) {
            if (equipId !== id && acessorie.codigo === newCodigo) {
                alert(`Código "${newCodigo}" já está em uso por outro acessorio!`);
                return;
            }
        }
        
        value = newCodigo;
        
        const headerText = item.querySelector('.acessorie-header span');
        if (headerText) {
            const descricao = window.acessoriesData[id].descricao || '';
            headerText.innerHTML = `<strong>${escapeHtml(value)}</strong> - ${escapeHtml(descricao)}`;
        }
    }
    
    window.acessoriesData[id][field] = value;
    systemData.banco_acessorios = window.acessoriesData;
    
    addPendingChange('banco_acessorios');
    
    if (field === 'codigo' && oldValue !== value) {
        setTimeout(() => populateCodigosFilter(), 100);
    }
}

// Atualiza label da dimensão
function updateAcessorieDimensionLabel(index, oldKey, newKey) {
    const item = document.querySelector(`.acessorie-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.acessoriesData[id]) return;
    
    const dimensions = window.acessoriesData[id].valores_padrao;
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
    systemData.banco_acessorios = window.acessoriesData;
    
    addPendingChange('banco_acessorios');
    
    const dimensionItem = document.querySelector(`.dimension-item[data-key="${oldKey}"]`);
    if (dimensionItem) {
        dimensionItem.setAttribute('data-key', newKey);
        const input = dimensionItem.querySelector('input[type="text"]');
        if (input) input.value = newKey;
    }
}

// Atualiza valor da dimensão
function updateAcessorieValue(index, key, value) {
    const item = document.querySelector(`.acessorie-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.acessoriesData[id]) return;
    
    const dimensions = window.acessoriesData[id].valores_padrao;
    if (!dimensions) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
        alert('Informe um valor numérico válido maior ou igual a zero!');
        return;
    }
    
    dimensions[key] = numValue;
    systemData.banco_acessorios = window.acessoriesData;
    
    addPendingChange('banco_acessorios');
}

// Adiciona novo acessorio
function addNewAcessorie() {
    const newId = `equip_${Date.now()}`;
    
    window.acessoriesData[newId] = {
        codigo: '',
        descricao: 'Novo Acessorio',
        valores_padrao: { '300x200': 0 }
    };
    
    systemData.banco_acessorios = window.acessoriesData;
    
    addPendingChange('banco_acessorios');
    
    renderAcessorieList();
    
    setTimeout(() => {
        const items = document.querySelectorAll('.acessorie-item');
        const newItem = items[items.length - 1];
        if (newItem) {
            newItem.scrollIntoView({ behavior: 'smooth' });
            
            const index = newItem.getAttribute('data-index');
            if (index) {
                const content = newItem.querySelector('.acessorie-content');
                const minimizer = newItem.querySelector('.minimizer');
                
                content.classList.remove('collapsed');
                minimizer.textContent = '-';
                
                setTimeout(() => {
                    const codigoInput = newItem.querySelector('input[id^="acessorieCodigo-"]');
                    if (codigoInput) {
                        codigoInput.focus();
                        codigoInput.select();
                    }
                }, 100);
            }
        }
    }, 100);
}

// Exclui acessorio
async function deleteAcessorie(id, event) {
    if (event) event.stopPropagation();
    
    const acessorie = window.acessoriesData[id];
    if (!acessorie) {
        alert('Acessorio não encontrado!');
        return;
    }
    
    const codigo = acessorie.codigo;
    const descricao = acessorie.descricao || 'Sem descrição';
    
    if (!confirm(`Excluir acessorio "${codigo} - ${descricao}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/acessorios/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ tipo: id })
        });
        
        if (!response.ok) {
            throw new Error(`Falha ao excluir acessorio`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro ao excluir acessorio');
        }
        
        delete window.acessoriesData[id];
        systemData.banco_acessorios = window.acessoriesData;
        
        addPendingChange('banco_acessorios');
        
        renderAcessorieList();
        populateCodigosFilter();
        
        showNotification('Acessorio excluído com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showNotification(`Erro: ${error.message}`, 'error');
    }
}

// Filtra acessorios por código
function filterAcessorieTable() {
    const filterSelect = document.getElementById('codigoFilter');
    renderAcessorieList(filterSelect?.value || '');
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
    const acessorieList = document.getElementById('acessorieList');
    if (!acessorieList) return;
    
    acessorieList.innerHTML = `
        <div class="empty-state">
            <i class="icon-empty"></i>
            <p>Não foi possível carregar os acessorios</p>
            <button class="btn btn-primary mt-2" onclick="loadAcessoriesData()">
                Tentar novamente
            </button>
        </div>
    `;
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof initAcessories === 'function') {
                initAcessories();
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        if (typeof initAcessories === 'function') {
            initAcessories();
        }
    }, 100);
}

// Exportar por padrão
export default {
    initAcessories,
    loadAcessoriesData,
    deleteAcessorie,
    addNewAcessorie
};