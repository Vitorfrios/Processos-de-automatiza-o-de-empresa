// scripts/03_Edit_data/materials.js
// Gerenciamento de materiais

import { systemData, addPendingChange } from './state.js';
import { escapeHtml, showError, showInfo } from './ui.js';

export function loadMaterials() {
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!systemData.materials) {
        systemData.materials = {};
    }

    Object.entries(systemData.materials).forEach(([key, materialData]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>
            <input type="text" value="${escapeHtml(key)}" 
                   readonly
                   placeholder="Nome do material"
                   class="form-input readonly-input"
                   style="background-color: #f5f5f5; cursor: default; color: #666;">
        </td>
        <td>
            <input type="text" value="${escapeHtml(materialData.description || '')}" 
                   onchange="updateMaterialDescription('${key}', this.value)"
                   placeholder="Descrição"
                   class="form-input">
        </td>
        <td>
            <input type="text" value="${escapeHtml(materialData.unit || '')}" 
                   onchange="updateMaterialUnit('${key}', this.value)"
                   placeholder="Unidade"
                   class="form-input">
        </td>
        <td>
            <input type="number" value="${materialData.value}" step="0.01"
                   onchange="updateMaterialValue('${key}', this.value)"
                   class="form-input">
        </td>
    `;
        tbody.appendChild(row);
    });

    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 20px; color: #666; font-style: italic;">
            Materiais do sistema - Somente leitura
        </td>
    `;
    tbody.appendChild(emptyRow);
}

export function updateMaterialUnit(key, unit) {
    if (systemData.materials[key]) {
        if (systemData.materials[key].unit !== unit) {
            systemData.materials[key].unit = unit;
            addPendingChange('materials');
        }
    } else {
        showError(`Material "${key}" não encontrado!`);
    }
}

export function updateMaterialValue(key, value) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        showError(`Valor inválido para "${key}": ${value}`);
        return;
    }

    if (systemData.materials[key] && systemData.materials[key].value !== numValue) {
        systemData.materials[key].value = numValue;
        addPendingChange('materials');
        showInfo(`Valor do material "${key}" atualizado para ${numValue}`);
    }
}

export function updateMaterialDescription(key, description) {
    if (systemData.materials[key]) {
        if (systemData.materials[key].description !== description) {
            systemData.materials[key].description = description;
            addPendingChange('materials');
        }
    } else {
        showError(`Material "${key}" não encontrado!`);
    }
}

// Exportar funções globalmente
window.loadMaterials = loadMaterials;
window.updateMaterialUnit = updateMaterialUnit;
window.updateMaterialValue = updateMaterialValue;
window.updateMaterialDescription = updateMaterialDescription;