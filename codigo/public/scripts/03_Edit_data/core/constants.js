// scripts/03_Edit_data/constants.js
// Gerenciamento de constantes

import { systemData, addPendingChange } from '../config/state.js';
import { escapeHtml, showError, showInfo } from '../config/ui.js';

export function loadConstants() {
    const tbody = document.getElementById('constantsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!systemData.constants) {
        systemData.constants = {};
    }
    
    Object.entries(systemData.constants).forEach(([key, constantData]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" value="${escapeHtml(key)}" 
                       readonly
                       placeholder="Nome da constante"
                       class="form-input readonly-input"
                       style="background-color: #f5f5f5; cursor: default; color: #666;">
            </td>
            <td>
                <input type="text" value="${escapeHtml(constantData.description || '')}" 
                       onchange="updateConstantDescription('${key}', this.value)"
                       placeholder="Descrição"
                       class="form-input">
            </td>
            <td>
                <input type="number" value="${constantData.value}" step="0.1"
                       onchange="updateConstantValue('${key}', this.value)"
                       class="form-input">
            </td>
        `;
        tbody.appendChild(row);
    });
    
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
        <td colspan="3" style="text-align: center; padding: 20px; color: #666; font-style: italic;">
            Constantes do sistema - Somente alteração
        </td>
    `;
    tbody.appendChild(emptyRow);
}

export function updateConstantDescription(key, description) {
    if (systemData.constants[key]) {
        if (systemData.constants[key].description !== description) {
            systemData.constants[key].description = description;
            addPendingChange('constants');
        }
    } else {
        showError(`Constante "${key}" não encontrada!`);
    }
}

export function updateConstantValue(key, value) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        showError(`Valor inválido para "${key}": ${value}`);
        return;
    }
    
    if (systemData.constants[key] && systemData.constants[key].value !== numValue) {
        systemData.constants[key].value = numValue;
        addPendingChange('constants');
        showInfo(`Valor da constante "${key}" atualizado para ${numValue}`);
    }
}

// Exportar funções globalmente
window.loadConstants = loadConstants;
window.updateConstantDescription = updateConstantDescription;
window.updateConstantValue = updateConstantValue;