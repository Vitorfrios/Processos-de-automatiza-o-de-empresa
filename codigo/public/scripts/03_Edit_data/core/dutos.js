// scripts/03_Edit_data/core/dutos.js
// Módulo de gerenciamento de Dutos - Versão simplificada

// Estado do módulo
let dutosData = [];

// Elementos DOM
let dutosTableBody;
let dutoDetailView;
let dutoDetailContent;
let dutoDetailTitle;

// ==================== INICIALIZAÇÃO ====================

export async function initDutosModule() {
    console.log('🔧 Inicializando módulo de dutos...');
    
    // Inicializar elementos DOM
    dutosTableBody = document.getElementById('dutosTableBody');
    dutoDetailView = document.getElementById('dutoDetailView');
    dutoDetailContent = document.getElementById('dutoDetailContent');
    dutoDetailTitle = document.getElementById('dutoDetailTitle');
    
    // Carregar dados iniciais
    await loadDutosData();
    
    // Expor funções globalmente
    window.loadDutos = loadDutosData;
    window.addDuto = addDuto;
    window.editDuto = editDuto;
    window.deleteDuto = deleteDuto;
    window.closeDutoDetail = closeDutoDetail;
    window.addOpcional = addOpcional;
    window.deleteOpcional = deleteOpcional;
    
    console.log('✅ Módulo de dutos inicializado');
}

// ==================== FUNÇÕES DE CARREGAMENTO ====================

export async function loadDutosData() {
    try {
        console.log('📥 Carregando dados dos dutos da API...');
        
        const response = await fetch('/api/dutos');
        
        if (!response.ok) {
            throw new Error(`API retornou status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Garantir que é um array
        if (Array.isArray(data)) {
            dutosData = data;
        } else if (data && typeof data === 'object') {
            // Tentar extrair de diferentes formatos
            if (data.dutos && Array.isArray(data.dutos)) {
                dutosData = data.dutos;
            } else if (data.data && Array.isArray(data.data)) {
                dutosData = data.data;
            } else {
                dutosData = Object.values(data);
            }
        } else {
            dutosData = [];
        }
        
        // Atualizar systemData
        if (window.systemData) {
            window.systemData.dutos = dutosData;
        }
        
        renderDutosTable();
        
        console.log('✅ Dados dos dutos carregados:', dutosData.length);
        
        return dutosData;
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados dos dutos:', error);
        showMessage('error', 'Erro ao carregar dados dos dutos');
        dutosData = [];
        renderDutosTable();
        return dutosData;
    }
}

// ==================== RENDERIZAÇÃO ====================

function renderDutosTable() {
    if (!dutosTableBody) return;
    
    dutosTableBody.innerHTML = '';
    
    if (!Array.isArray(dutosData) || dutosData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="4" class="text-center py-4">
                <div class="text-muted">
                    <i class="icon-duct"></i>
                    <p class="mt-2">Nenhum tipo de duto cadastrado</p>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="addDuto()">
                        Adicionar primeiro duto
                    </button>
                </div>
            </td>
        `;
        dutosTableBody.appendChild(tr);
        return;
    }
    
    dutosData.forEach((duto, index) => {
        const tr = document.createElement('tr');
        const opcionaisCount = duto.opcionais && Array.isArray(duto.opcionais) ? duto.opcionais.length : 0;
        
        tr.innerHTML = `
            <td>
                <strong>${duto.type || 'Sem nome'}</strong>
                <div class="text-muted small">${duto.descricao || 'Sem descrição'}</div>
            </td>
            <td class="text-center">
                <span class="badge bg-success">R$ ${parseFloat(duto.valor || 0).toFixed(2)}</span>
            </td>
            <td class="text-center">
                <span class="badge bg-secondary">
                    ${opcionaisCount} ${opcionaisCount === 1 ? 'opcional' : 'opcionais'}
                </span>
            </td>

            <td class="text-center">
                <button class="btn btn-sm btn-outline-info me-1" onclick="editDuto(${index})">
                    Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDuto(${index})">
                    Excluir
                </button>
            </td>
        `;
        
        dutosTableBody.appendChild(tr);
    });
}

// ==================== CRUD DE DUTOS ====================

export function addDuto() {
    dutosData.push({
        type: "Novo Tipo de Duto",
        valor: 0,
        descricao: "",
        opcionais: []
    });
    
    renderDutosTable();
    editDuto(dutosData.length - 1);
}

export function editDuto(index) {
    if (!dutosData[index]) return;
    
    const duto = dutosData[index];
    
    if (dutoDetailTitle) {
        dutoDetailTitle.textContent = duto.type || 'Editar Duto';
    }
    
    if (dutoDetailContent) {
        dutoDetailContent.innerHTML = `
            <div class="duto-editor">
                <div class="editor-header">
                    <h4>Dados do Duto</h4>
                    <button class="btn-close-editor" onclick="closeDutoDetail()">
                        ×
                    </button>
                </div>
                
                <div class="editor-body">
                    <div class="form-section">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Tipo de Duto</label>
                                <input type="text" class="form-control" 
                                       value="${duto.type || ''}" 
                                       onchange="dutosData[${index}].type = this.value"
                                       placeholder="Ex: Chapa de aço inoxidável">
                            </div>
                            
                            <div class="form-group">
                                <label>Valor Base (R$)</label>
                                <input type="number" class="form-control" step="0.01"
                                       value="${duto.valor || 0}" 
                                       onchange="dutosData[${index}].valor = parseFloat(this.value) || 0"
                                       placeholder="0.00">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Descrição</label>
                            <input type="text" class="form-control"
                                   value="${duto.descricao || ''}"
                                   onchange="dutosData[${index}].descricao = this.value"
                                   placeholder="Descrição detalhada do duto">
                        </div>
                    </div>
                    

                    <div class="opcionais-section">
                        <div class="section-header">
                            <h5>Lista de Opcionais</h5>
                            <button class="btn btn-add" onclick="addOpcional(${index})">
                                + Novo Opcional
                            </button>
                        </div>
                        
                        <div class="opcionais-grid" id="opcionaisGrid-${index}">
                            ${renderOpcionaisCards(duto.opcionais, index)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (dutoDetailView) {
        dutoDetailView.style.display = 'block';
    }
}

function renderOpcionaisCards(opcionais, dutoIndex) {
    if (!opcionais || !Array.isArray(opcionais) || opcionais.length === 0) {
        return `
            <div class="empty-opcionais">
                <p>Nenhum opcional cadastrado</p>
                <button class="btn btn-outline-primary btn-sm" onclick="addOpcional(${dutoIndex})">
                    Adicionar primeiro opcional
                </button>
            </div>
        `;
    }
    
    let html = '';
    
    opcionais.forEach((opcional, opcIndex) => {
        html += `
            <div class="opcional-card" data-index="${opcIndex}">
                <div class="card-header">
                    <input type="text" class="card-title-input" 
                           value="${opcional.nome || ''}" 
                           onchange="dutosData[${dutoIndex}].opcionais[${opcIndex}].nome = this.value"
                           placeholder="Nome do opcional">
                    <button class="btn-delete" onclick="deleteOpcional(${dutoIndex}, ${opcIndex})" 
                            title="Excluir opcional">
                        ×
                    </button>
                </div>
                
                <div class="card-body">
                    <div class="form-group">
                        <label>Valor Adicional (R$)</label>
                        <input type="number" class="form-control" step="0.01"
                               value="${opcional.value || 0}" 
                               onchange="dutosData[${dutoIndex}].opcionais[${opcIndex}].value = parseFloat(this.value) || 0"
                               placeholder="0.00">
                    </div>
                    
                    <div class="form-group">
                        <label>Descrição</label>
                        <input type="text" class="form-control"
                               value="${opcional.descricao || ''}" 
                               onchange="dutosData[${dutoIndex}].opcionais[${opcIndex}].descricao = this.value"
                               placeholder="Descrição do opcional">
                    </div>
                </div>
            </div>
        `;
    });
    
    return html;
}

export function deleteDuto(index) {
    if (!confirm('Tem certeza que deseja excluir este duto?')) return;
    
    dutosData.splice(index, 1);
    renderDutosTable();
    closeDutoDetail();
    showMessage('success', 'Duto excluído');
    
    if (window.systemData) {
        window.systemData.dutos = dutosData;
    }
    
    window.hasPendingChanges = true;
}

// ==================== CRUD DE OPÇÕES ====================

export function addOpcional(dutoIndex) {
    const duto = dutosData[dutoIndex];
    if (!duto) return;
    
    if (!duto.opcionais) duto.opcionais = [];
    
    duto.opcionais.push({
        nome: "",
        value: 0,
        descricao: ""
    });
    
    editDuto(dutoIndex);
    showMessage('info', 'Novo opcional adicionado');
    window.hasPendingChanges = true;
}

export function deleteOpcional(dutoIndex, opcionalIndex) {
    if (!confirm('Excluir este opcional?')) return;
    
    const duto = dutosData[dutoIndex];
    if (duto && duto.opcionais) {
        duto.opcionais.splice(opcionalIndex, 1);
        editDuto(dutoIndex);
        showMessage('success', 'Opcional excluído');
        window.hasPendingChanges = true;
    }
}

// ==================== FUNÇÕES AUXILIARES ====================

export function closeDutoDetail() {
    if (dutoDetailView) dutoDetailView.style.display = 'none';
    if (dutoDetailContent) dutoDetailContent.innerHTML = '';
}

export function viewOpcionais(index) {
    editDuto(index);
}

// ==================== PERSISTÊNCIA ====================

export async function saveDutosData() {
    try {
        const response = await fetch('/api/dutos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dutosData)
        });
        
        if (response.ok) {
            console.log('✅ Dutos salvos');
            return true;
        } else {
            throw new Error(`Status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Erro ao salvar dutos:', error);
        return false;
    }
}

export function getDutosData() {
    return dutosData;
}

export function updateDutosData(newData) {
    dutosData = Array.isArray(newData) ? newData : [];
    if (window.systemData) window.systemData.dutos = dutosData;
    renderDutosTable();
}

// ==================== UTILITÁRIOS ====================

function showMessage(type, text) {
    console.log(`${type}: ${text}`);
    
    if (typeof window.showNotification === 'function') {
        window.showNotification(text, type);
    } else {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            padding: 12px 20px; background: #28a745; color: white;
            border-radius: 4px; z-index: 10000;
        `;
        toast.textContent = text;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// ==================== INICIALIZAÇÃO ====================

setTimeout(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDutosModule);
    } else {
        initDutosModule();
    }
}, 100);