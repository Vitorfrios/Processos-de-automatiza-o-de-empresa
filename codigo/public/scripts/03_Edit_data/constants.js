// scripts/03_Edit_data/constants.js
// Gerenciamento de constantes

import { systemData, addPendingChange } from './state.js';
import { escapeHtml, showError, showInfo, showWarning } from './ui.js';
import { getConstantDescription } from './utils.js';

export function loadConstants() {
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

export function addConstant() {
    const newKey = `NOVA_CONSTANTE_${Date.now().toString().slice(-6)}`;
    systemData.constants[newKey] = 0;
    loadConstants();
    addPendingChange('constants');
    showInfo('Nova constante adicionada. Edite o nome e valor.');
    
    setTimeout(() => {
        const lastRow = document.querySelector('#constantsTableBody tr:nth-last-child(2)');
        if (lastRow) {
            lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = lastRow.querySelector('input[type="text"]');
            if (input) input.focus();
        }
    }, 100);
}

export function updateConstantKey(index, newKey) {
    const oldKey = Object.keys(systemData.constants)[index];
    if (oldKey && newKey && newKey.trim() !== '' && newKey !== oldKey) {
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

export function updateConstantDescription(key, description) {
    addPendingChange('constants');
}

export function updateConstantValue(key, value) {
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

export async function deleteConstant(key) {
    showConfirmation(`Deseja excluir a constante "${key}"?`, async () => {
        try {
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

// Exportar funções globalmente
window.loadConstants = loadConstants;
window.addConstant = addConstant;
window.updateConstantKey = updateConstantKey;
window.updateConstantDescription = updateConstantDescription;
window.updateConstantValue = updateConstantValue;
window.deleteConstant = deleteConstant;