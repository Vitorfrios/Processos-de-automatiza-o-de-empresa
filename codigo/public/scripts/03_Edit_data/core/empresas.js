// scripts/03_Edit_data/empresas.js
// Gerenciamento de empresas

import { systemData, addPendingChange } from '../config/state.js';
import { escapeHtml, showError, showInfo, showWarning, showConfirmation } from '../config/ui.js';

export function loadEmpresas() {
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
                        onclick="deleteEmpresa(${index}, '${sigla}')"
                        title="Excluir empresa">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
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

export function addEmpresa() {
    const newSigla = `NOV${Date.now().toString().slice(-3)}`;
    systemData.empresas.push({ [newSigla]: `Nova Empresa ${newSigla}` });
    loadEmpresas();
    addPendingChange('empresas');
    showInfo('Nova empresa adicionada. Edite os detalhes.');
    
    setTimeout(() => {
        const lastRow = document.querySelector('#empresasTableBody tr:nth-last-child(2)');
        if (lastRow) {
            lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = lastRow.querySelector('input[type="text"]');
            if (input) input.focus();
        }
    }, 100);
}

export function updateEmpresaSigla(index, newSigla) {
    const empresa = systemData.empresas[index];
    const oldSigla = Object.keys(empresa)[0];
    const nome = empresa[oldSigla];
    
    if (newSigla && newSigla.trim() !== '' && newSigla !== oldSigla) {
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

export function updateEmpresaNome(index, newNome) {
    const empresa = systemData.empresas[index];
    const sigla = Object.keys(empresa)[0];
    
    if (newNome && newNome.trim() !== '' && newNome !== empresa[sigla]) {
        systemData.empresas[index][sigla] = newNome;
        addPendingChange('empresas');
    }
}

export async function deleteEmpresa(index, sigla) {
    const empresa = systemData.empresas[index];
    const nome = empresa[sigla] || '';
    
    showConfirmation(`Deseja excluir a empresa "${sigla} - ${nome}"?`, async () => {
        try {

            const response = await fetch(`/api/empresas/${index}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Atualiza localmente apenas se a API confirmar sucesso
                systemData.empresas.splice(index, 1);
                loadEmpresas();
                addPendingChange('empresas');
                showWarning(`Empresa "${sigla}" excluída.`);
            } else {
                throw new Error(result.error || 'Erro ao excluir empresa na API');
            }
            
        } catch (error) {
            console.error('Erro ao excluir empresa:', error);
            showError(`Erro ao excluir empresa: ${error.message}`);
        }
    });
}

// Exportar funções globalmente
window.loadEmpresas = loadEmpresas;
window.addEmpresa = addEmpresa;
window.updateEmpresaSigla = updateEmpresaSigla;
window.updateEmpresaNome = updateEmpresaNome;
window.deleteEmpresa = deleteEmpresa;