// scripts/03_Edit_data/core/dutos.js
// Módulo de gerenciamento de Dutos - Versão corrigida

// Importar sistema de estado global
import { systemData, addPendingChange, clearPendingChanges, updateSaveButton } from '../config/state.js';

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
    
    try {
        // Inicializar elementos DOM
        dutosTableBody = document.getElementById('dutosTableBody');
        dutoDetailView = document.getElementById('dutoDetailView');
        dutoDetailContent = document.getElementById('dutoDetailContent');
        dutoDetailTitle = document.getElementById('dutoDetailTitle');
        
        // Carregar dados iniciais
        await loadDutosData();
        
        // Expor funções e dados globalmente para acesso do HTML
        window.dutosData = dutosData;
        window.loadDutos = loadDutosData;
        window.addDuto = addDuto;
        window.editDuto = editDuto;
        window.deleteDuto = deleteDuto;
        window.closeDutoDetail = closeDutoDetail;
        window.addOpcional = addOpcional;
        window.deleteOpcional = deleteOpcional;
        window.updateDutoField = updateDutoField;
        window.updateDutoOpcional = updateDutoOpcional;
        window.resetDutoChanges = resetDutoChanges;
        window.viewOpcionais = viewOpcionais;
        window.saveDutosData = saveDutosData;
        
        console.log('✅ Módulo de dutos inicializado');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de dutos:', error);
        showMessage('error', 'Erro ao inicializar módulo de dutos');
        return false;
    }
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
        
        // Atualizar systemData (ESTADO GLOBAL)
        systemData.dutos = dutosData;
        
        // Atualizar referência global
        window.dutosData = dutosData;
        
        renderDutosTable();
        
        console.log('✅ Dados dos dutos carregados:', dutosData.length);
        
        return dutosData;
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados dos dutos:', error);
        showMessage('error', 'Erro ao carregar dados dos dutos');
        dutosData = [];
        systemData.dutos = dutosData; // Atualizar estado global
        window.dutosData = dutosData;
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

// ==================== FUNÇÕES GLOBAIS DE ACESSO ====================

// Funções para acessar dutosData do HTML
export function updateDutoField(index, field, value) {
    if (dutosData[index]) {
        dutosData[index][field] = value;
        systemData.dutos = dutosData; // Atualizar estado global
        
        // Marcar mudança pendente
        addPendingChange('dutos');
        window.hasPendingChanges = true;
        
        // Atualizar visualização se necessário
        if (field === 'type' && dutoDetailTitle) {
            dutoDetailTitle.textContent = value || 'Editar Duto';
        }
    }
}

export function updateDutoOpcional(dutoIndex, opcionalIndex, field, value) {
    if (dutosData[dutoIndex] && dutosData[dutoIndex].opcionais) {
        dutosData[dutoIndex].opcionais[opcionalIndex][field] = value;
        systemData.dutos = dutosData; // Atualizar estado global
        
        // Marcar mudança pendente
        addPendingChange('dutos');
        window.hasPendingChanges = true;
    }
}

// ==================== CRUD DE DUTOS ====================

export function addDuto() {
    const newDuto = {
        type: "Novo Tipo de Duto",
        valor: 0,
        descricao: "",
        opcionais: []
    };
    
    dutosData.push(newDuto);
    systemData.dutos = dutosData; // Atualizar estado global
    window.dutosData = dutosData; // Atualizar referência global
    
    renderDutosTable();
    editDuto(dutosData.length - 1);
    showMessage('success', 'Novo duto adicionado');
    
    // Marcar mudança pendente
    addPendingChange('dutos');
    window.hasPendingChanges = true;
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
                                       value="${escapeHtml(duto.type || '')}" 
                                       onchange="updateDutoField(${index}, 'type', this.value)"
                                       placeholder="Ex: Chapa de aço inoxidável">
                            </div>
                            
                            <div class="form-group">
                                <label>Valor Base (R$)</label>
                                <input type="number" class="form-control" step="0.01"
                                       value="${duto.valor || 0}" 
                                       onchange="updateDutoField(${index}, 'valor', parseFloat(this.value) || 0)"
                                       placeholder="0.00">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Descrição</label>
                            <input type="text" class="form-control"
                                   value="${escapeHtml(duto.descricao || '')}"
                                   onchange="updateDutoField(${index}, 'descricao', this.value)"
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
        dutoDetailView.scrollIntoView({ behavior: 'smooth' });
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
                           value="${escapeHtml(opcional.nome || '')}" 
                           onchange="updateDutoOpcional(${dutoIndex}, ${opcIndex}, 'nome', this.value)"
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
                               onchange="updateDutoOpcional(${dutoIndex}, ${opcIndex}, 'value', parseFloat(this.value) || 0)"
                               placeholder="0.00">
                    </div>
                    
                    <div class="form-group">
                        <label>Descrição</label>
                        <input type="text" class="form-control"
                               value="${escapeHtml(opcional.descricao || '')}" 
                               onchange="updateDutoOpcional(${dutoIndex}, ${opcIndex}, 'descricao', this.value)"
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
    systemData.dutos = dutosData; // Atualizar estado global
    window.dutosData = dutosData; // Atualizar referência global
    renderDutosTable();
    closeDutoDetail();
    showMessage('success', 'Duto excluído');
    
    // Marcar mudança pendente
    addPendingChange('dutos');
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
    
    // Atualizar estado global
    systemData.dutos = dutosData;
    
    editDuto(dutoIndex);
    showMessage('info', 'Novo opcional adicionado');
    
    // Marcar mudança pendente
    addPendingChange('dutos');
    window.hasPendingChanges = true;
}

export function deleteOpcional(dutoIndex, opcionalIndex) {
    if (!confirm('Excluir este opcional?')) return;
    
    const duto = dutosData[dutoIndex];
    if (duto && duto.opcionais) {
        duto.opcionais.splice(opcionalIndex, 1);
        
        // Atualizar estado global
        systemData.dutos = dutosData;
        
        editDuto(dutoIndex);
        showMessage('success', 'Opcional excluído');
        
        // Marcar mudança pendente
        addPendingChange('dutos');
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

export function resetDutoChanges() {
    if (confirm('Descartar todas as alterações nos dutos? Esta ação não pode ser desfeita.')) {
        // Remover mudanças pendentes de dutos
        if (window.pendingChanges && window.pendingChanges.has) {
            window.pendingChanges.delete('dutos');
        }
        
        loadDutosData(); // Recarrega os dados originais da API
        closeDutoDetail();
        window.hasPendingChanges = false;
        
        // Atualizar botão de salvar
        if (typeof updateSaveButton === 'function') {
            updateSaveButton();
        }
        
        showMessage('info', 'Alterações nos dutos descartadas');
    }
}

// ==================== PERSISTÊNCIA ====================

export async function saveDutosData() {
    try {
        console.log('💾 Salvando dados dos dutos...');
        
        const response = await fetch('/api/dutos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dutosData)
        });
        
        if (response.ok) {
            console.log('✅ Dutos salvos com sucesso');
            
            // Remover mudanças pendentes
            if (window.pendingChanges && window.pendingChanges.has) {
                window.pendingChanges.delete('dutos');
            }
            window.hasPendingChanges = false;
            
            // Atualizar botão de salvar
            if (typeof updateSaveButton === 'function') {
                updateSaveButton();
            }
            
            showMessage('success', 'Dutos salvos com sucesso');
            return true;
        } else {
            const errorText = await response.text();
            throw new Error(`API retornou status ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('❌ Erro ao salvar dutos:', error);
        showMessage('error', `Erro ao salvar dutos: ${error.message}`);
        return false;
    }
}

// ==================== GETTERS E SETTERS ====================

export function getDutosData() {
    return dutosData;
}

export function updateDutosData(newData) {
    dutosData = Array.isArray(newData) ? newData : [];
    systemData.dutos = dutosData; // Atualizar estado global
    window.dutosData = dutosData; // Atualizar referência global
    
    renderDutosTable();
}

// ==================== UTILITÁRIOS ====================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(type, text) {
    console.log(`${type.toUpperCase()}: ${text}`);
    
    // Tentar usar o sistema de notificação global se disponível
    if (typeof window.showNotification === 'function') {
        window.showNotification(text, type);
        return;
    }
    
    // Fallback: criar uma notificação simples
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#28a745' : 
                     type === 'error' ? '#dc3545' : 
                     type === 'info' ? '#17a2b8' : '#6c757d'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        font-size: 14px;
        min-width: 250px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    // Adicionar estilo de animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .toast-notification { animation: slideIn 0.3s ease; }
    `;
    document.head.appendChild(style);
    
    toast.textContent = text;
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 300);
    }, 3000);
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof initDutosModule === 'function') {
                initDutosModule().catch(error => {
                    console.error('❌ Falha na inicialização automática do módulo de dutos:', error);
                });
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        if (typeof initDutosModule === 'function') {
            initDutosModule().catch(error => {
                console.error('❌ Falha na inicialização automática do módulo de dutos:', error);
            });
        }
    }, 100);
}

// Exportar por padrão para facilitar importação
export default {
    initDutosModule,
    loadDutosData,
    saveDutosData,
    getDutosData,
    updateDutosData,
    addDuto,
    editDuto,
    deleteDuto,
    addOpcional,
    deleteOpcional,
    closeDutoDetail,
    resetDutoChanges
};