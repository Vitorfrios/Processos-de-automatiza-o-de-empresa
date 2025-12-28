// scripts/03_Edit_data/core/equipamentos.js
// Sistema CRUD para equipamentos com interface estilo opções

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
    window.currentEquipmentIndex = null;
    
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
    window.saveEquipmentChanges = saveEquipmentChanges;
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
        console.log('📥 Carregando equipamentos...');
        showEquipmentStatus('Carregando equipamentos...', 'info');
        
        const response = await fetch('/api/equipamentos');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        
        if (data.success && data.equipamentos) {
            window.equipmentsData = data.equipamentos;
            renderEquipmentList();
            populateCodigosFilter();
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

// Popula filtro de códigos
function populateCodigosFilter() {
    const filterSelect = document.getElementById('codigoFilter');
    if (!filterSelect) return;
    
    // Limpar opções existentes
    filterSelect.innerHTML = '<option value="">Todos os códigos</option>';
    
    // Agrupar por código
    const codigos = new Set();
    Object.values(window.equipmentsData).forEach(equipment => {
        if (equipment.codigo) {
            codigos.add(equipment.codigo);
        }
    });
    
    // Ordenar alfabeticamente e adicionar ao select
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
                <i class="icon-empty" style="font-size: 2rem;"></i>
                <p class="mt-2">Nenhum equipamento cadastrado</p>
                <button class="btn btn-primary mt-3" onclick="addNewEquipment()">
                    <i class="icon-add"></i> Adicionar Primeiro Equipamento
                </button>
            </div>
        `;
        return;
    }
    
    // Filtrar por código se necessário
    const filteredEntries = filterCodigo 
        ? equipmentEntries.filter(([_, equipment]) => equipment.codigo === filterCodigo)
        : equipmentEntries;
    
    if (filteredEntries.length === 0) {
        equipmentList.innerHTML = `
            <div class="empty-state">
                <i class="icon-empty" style="font-size: 2rem;"></i>
                <p class="mt-2">Nenhum equipamento encontrado para o código "${filterCodigo}"</p>
            </div>
        `;
        return;
    }
    
    filteredEntries.forEach(([id, equipment], index) => {
        const dimensions = equipment.valores_padrao || {};
        const dimensionKeys = Object.keys(dimensions);
        
        const equipmentItem = document.createElement('div');
        equipmentItem.className = 'equipment-item';
        equipmentItem.setAttribute('data-index', index);
        equipmentItem.setAttribute('data-id', id);
        
        equipmentItem.innerHTML = `
            <div class="equipment-header" onclick="toggleEquipmentItem(${index}, event)">
                <button class="minimizer" onclick="toggleEquipmentItem(${index}, event)">+</button>
                <span style="flex: 1; cursor: pointer;">
                    <strong>${equipment.codigo || 'N/A'}</strong> - ${equipment.descricao || 'Sem descrição'}
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
                               value="${equipment.codigo || ''}" 
                               placeholder="Ex: VZ, DSP_15" 
                               onchange="updateEquipment(${index}, 'codigo', this.value)"
                               onfocus="selectEquipmentCodigo(${index})"
                               list="codigosList"
                               class="form-input">
                        <small class="text-muted">Código identificador do equipamento (ex: VZ, DSP_15)</small>
                    </div>
                </div>
                <div class="equipment-field">
                    <span class="equipment-label">Descrição:</span>
                    <input type="text" value="${equipment.descricao || ''}" 
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
                    <div class="text-center" style="margin-top: var(--spacing-md);">
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
                    <input type="text" value="${dimensionKey}" 
                           placeholder="Ex: 300x400, 1500x1200" 
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
    if (input) {
        // Criar datalist se não existir
        if (!document.getElementById('codigosList')) {
            const datalist = document.createElement('datalist');
            datalist.id = 'codigosList';
            
            // Adicionar códigos existentes
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
}

// Alterna expansão/colapso do item
function toggleEquipmentItem(index, event) {
    // Se o evento foi passado, impede propagação dupla
    if (event) {
        event.stopPropagation();
        
        // Se clicou no botão delete, não faz toggle
        if (event.target.closest('.btn-danger')) {
            return;
        }
        
        // Se clicou no botão minimizer, já fazemos o toggle abaixo
        // Se clicou no header, também fazemos toggle
    }
    
    const item = document.querySelector(`.equipment-item[data-index="${index}"]`);
    if (!item) return;
    
    const content = item.querySelector('.equipment-content');
    const minimizer = item.querySelector('.minimizer');
    
    content.classList.toggle('collapsed');
    minimizer.textContent = content.classList.contains('collapsed') ? '+' : '-';
    
    // Se estiver expandindo, foca no primeiro campo editável
    if (!content.classList.contains('collapsed')) {
        setTimeout(() => {
            const firstInput = content.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
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
    
    // Garantir que o item está expandido
    const content = item.querySelector('.equipment-content');
    const minimizer = item.querySelector('.minimizer');
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        minimizer.textContent = '-';
    }
    
    // Gerar chave única para nova dimensão
    const dimensions = window.equipmentsData[id].valores_padrao || {};
    let newKey = `300x200`; // Dimensão padrão
    let counter = 1;
    while (dimensions[newKey]) {
        newKey = `300x${200 + counter * 100}`;
        counter++;
    }
    
    // Adicionar ao objeto
    dimensions[newKey] = 0;
    window.equipmentsData[id].valores_padrao = dimensions;
    
    // Renderizar novo item
    const grid = document.getElementById(`dimensionsGrid-${index}`);
    if (grid) {
        const dimIndex = Object.keys(dimensions).length;
        const newItem = document.createElement('div');
        newItem.className = 'dimension-item';
        newItem.setAttribute('data-key', newKey);
        newItem.innerHTML = `
            <div class="dimension-header">
                <span>Dimensão ${dimIndex}</span>
                <button class="btn btn-xs btn-danger" onclick="removeEquipmentDimension(${index}, '${newKey}', event)">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="dimension-content">
                <div class="dimension-field">
                    <label>Dimensão:</label>
                    <input type="text" value="${newKey}" 
                           placeholder="Ex: 300x400, 1500x1200" 
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
        
        // Focar no campo da nova dimensão
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
    
    // Remover do objeto
    delete window.equipmentsData[id].valores_padrao[key];
    
    // Remover do DOM
    const dimensionItem = document.querySelector(`.dimension-item[data-key="${key}"]`);
    if (dimensionItem) {
        dimensionItem.remove();
    }
    
    // Reordenar números das dimensões
    const grid = document.getElementById(`dimensionsGrid-${index}`);
    if (grid) {
        const items = grid.querySelectorAll('.dimension-item');
        items.forEach((item, idx) => {
            const header = item.querySelector('.dimension-header span');
            if (header) {
                header.textContent = `Dimensão ${idx + 1}`;
            }
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
        headerText.innerHTML = `<strong>${codigo}</strong> - ${value || 'Sem descrição'}`;
    }
}

// Atualiza campo do equipamento
function updateEquipment(index, field, value) {
    const item = document.querySelector(`.equipment-item[data-index="${index}"]`);
    if (!item) return;
    
    const id = item.getAttribute('data-id');
    if (!id || !window.equipmentsData[id]) return;
    
    const oldValue = window.equipmentsData[id][field];
    
    // Validar código
    if (field === 'codigo') {
        const newCodigo = value.trim().toUpperCase();
        if (!newCodigo) {
            alert('O código/sigla é obrigatório!');
            return;
        }
        
        // Verificar se código já existe em outro equipamento
        const existingEquipments = Object.entries(window.equipmentsData);
        for (const [equipId, equipment] of existingEquipments) {
            if (equipId !== id && equipment.codigo === newCodigo) {
                alert(`Código "${newCodigo}" já está em uso por outro equipamento!`);
                return;
            }
        }
        
        value = newCodigo;
        
        // Atualizar header
        const headerText = item.querySelector('.equipment-header span');
        if (headerText) {
            const descricao = window.equipmentsData[id].descricao || '';
            headerText.innerHTML = `<strong>${value}</strong> - ${descricao}`;
        }
    }
    
    // Atualizar valor
    window.equipmentsData[id][field] = value;
    
    // Se for código, atualizar filtro
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
    
    // Validar formato da dimensão
    if (!isValidDimension(newKey)) {
        alert('Formato de dimensão inválido! Use: LARGURAxALTURA (ex: 300x400) ou apenas um número para diâmetro (ex: 150)');
        return;
    }
    
    if (dimensions[newKey]) {
        alert('Esta dimensão já existe!');
        return;
    }
    
    // Atualizar chave
    dimensions[newKey] = dimensions[oldKey];
    delete dimensions[oldKey];
    
    // Atualizar DOM
    const dimensionItem = document.querySelector(`.dimension-item[data-key="${oldKey}"]`);
    if (dimensionItem) {
        dimensionItem.setAttribute('data-key', newKey);
        const input = dimensionItem.querySelector('input[type="text"]');
        if (input) input.value = newKey;
    }
}

// Valida formato da dimensão
function isValidDimension(dimension) {
    // Aceita formatos: 300x400, 1500x1200 ou apenas 150 (para diâmetro)
    return /^\d+(x\d+)?$/.test(dimension);
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
}

// Salva todas as alterações
async function saveEquipmentChanges() {
    try {
        showEquipmentStatus('Salvando alterações...', 'info');
        
        // Validar dados antes de enviar
        let isValid = true;
        const validationErrors = [];
        
        Object.entries(window.equipmentsData).forEach(([id, equipment]) => {
            if (!equipment.codigo || equipment.codigo.trim() === '') {
                isValid = false;
                validationErrors.push(`Equipamento "${equipment.descricao || id}" não possui código definido`);
            }
            
            // Validar dimensões
            if (equipment.valores_padrao) {
                Object.entries(equipment.valores_padrao).forEach(([dimension, value]) => {
                    if (!isValidDimension(dimension)) {
                        isValid = false;
                        validationErrors.push(`Dimensão "${dimension}" inválida no equipamento ${equipment.codigo}`);
                    }
                    
                    if (value < 0) {
                        isValid = false;
                        validationErrors.push(`Valor negativo (${value}) para dimensão "${dimension}" no equipamento ${equipment.codigo}`);
                    }
                });
            }
        });
        
        if (!isValid) {
            const errorMsg = validationErrors.join('\n• ');
            alert(`❌ Erros de validação:\n\n• ${errorMsg}`);
            showEquipmentStatus('Corrija os erros antes de salvar', 'error');
            return;
        }
        
        // Preparar dados para envio
        const equipmentsArray = Object.entries(window.equipmentsData).map(([id, data]) => ({
            id: id,
            ...data
        }));
        
        const response = await fetch('/api/equipamentos/save-all', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ equipments: equipmentsArray })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        
        showEquipmentStatus('Alterações salvas com sucesso!', 'success');
        
        // Recarregar dados
        setTimeout(() => loadEquipmentsData(), 500);
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        showEquipmentStatus(`Erro: ${error.message}`, 'error');
    }
}

// Adiciona novo equipamento
function addNewEquipment() {
    const newId = `equip_${Date.now()}`;
    
    window.equipmentsData[newId] = {
        codigo: '',
        descricao: 'Novo Equipamento',
        valores_padrao: {
            '300x200': 0
        }
    };
    
    renderEquipmentList();
    
    // Rolar para o novo item
    setTimeout(() => {
        const items = document.querySelectorAll('.equipment-item');
        const newItem = items[items.length - 1];
        if (newItem) {
            newItem.scrollIntoView({ behavior: 'smooth' });
            
            // Expandir e focar no campo de código
            const index = newItem.getAttribute('data-index');
            if (index) {
                // Já que estamos expandindo manualmente, também atualize o botão minimizer
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
    const codigo = equipment?.codigo || id;
    const descricao = equipment?.descricao || 'Sem descrição';
    
    if (!confirm(`Excluir equipamento "${codigo} - ${descricao}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/equipamentos/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: id })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        
        delete window.equipmentsData[id];
        renderEquipmentList();
        populateCodigosFilter();
        showEquipmentStatus('Equipamento excluído com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        showEquipmentStatus(`Erro: ${error.message}`, 'error');
    }
}

// Filtra equipamentos por código
function filterEquipmentTable() {
    const filterSelect = document.getElementById('codigoFilter');
    renderEquipmentList(filterSelect?.value || '');
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

function showEquipmentStatus(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Pode implementar um sistema de notificação visual aqui
    if (type === 'error') {
        alert(`❌ ${message}`);
    }
}

function renderEmptyState(error = '') {
    const equipmentList = document.getElementById('equipmentList');
    if (!equipmentList) return;
    
    equipmentList.innerHTML = `
        <div class="empty-state">
            <i class="icon-empty" style="font-size: 2rem;"></i>
            <p class="mt-2">Não foi possível carregar os equipamentos</p>
            ${error ? `<small class="text-danger">${error}</small>` : ''}
            <button class="btn btn-primary mt-3" onclick="loadEquipmentsData()">
                <i class="icon-refresh"></i> Tentar novamente
            </button>
        </div>
    `;
}

// Inicialização automática
setTimeout(() => {
    if (typeof initEquipments === 'function') {
        initEquipments();
    }
}, 100);