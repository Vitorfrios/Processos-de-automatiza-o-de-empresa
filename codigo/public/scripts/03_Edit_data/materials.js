// scripts/03_Edit_data/materials.js
// Gerenciamento de materiais

import { systemData, addPendingChange } from './state.js';
import { escapeHtml, showError, showInfo, showWarning, showConfirmation } from './ui.js';
import { getMaterialUnit } from './utils.js';

export function loadMaterials() {
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!systemData.materials) {
        systemData.materials = {};
    }
    
    Object.entries(systemData.materials).forEach(([material, preco], index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" value="${escapeHtml(material)}"
                       onchange="updateMaterialKey('${material}', this.value)"
                       placeholder="Nome do material"
                       class="form-input">
            </td>
            <td>
                <input type="text" value="${getMaterialUnit(material)}"
                       onchange="updateMaterialUnit('${material}', this.value)"
                       placeholder="Unidade (kg, m, etc)"
                       class="form-input">
            </td>
            <td>
                <input type="number" value="${preco}" step="0.01"
                       onchange="updateMaterialPrice('${material}', this.value)"
                       class="form-input">
            </td>
            <td class="actions-cell">
                <button class="btn btn-small btn-danger"
                        onclick="deleteMaterial('${material}')"
                        title="Excluir material">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 20px;">
            <button class="btn btn-success" onclick="addMaterial()">
                <i class="icon-add"></i> Adicionar Novo Material
            </button>
        </td>
    `;
    tbody.appendChild(emptyRow);
}

export function addMaterial() {
    const newMaterial = `NOVO_MATERIAL_${Date.now().toString().slice(-6)}`;
    systemData.materials[newMaterial] = 0;
    loadMaterials();
    addPendingChange('materials');
    showInfo('Novo material adicionado. Edite os detalhes.');
    
    setTimeout(() => {
        const lastRow = document.querySelector('#materialsTableBody tr:nth-last-child(2)');
        if (lastRow) {
            lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = lastRow.querySelector('input[type="text"]');
            if (input) input.focus();
        }
    }, 100);
}

export function updateMaterialKey(oldKey, newKey) {
    if (oldKey && newKey && newKey.trim() !== '' && newKey !== oldKey) {
        if (systemData.materials[newKey] !== undefined) {
            showError(`O material "${newKey}" já existe!`);
            return;
        }
        
        systemData.materials[newKey] = systemData.materials[oldKey];
        delete systemData.materials[oldKey];
        loadMaterials();
        addPendingChange('materials');
        showInfo(`Material renomeado: "${oldKey}" → "${newKey}"`);
    }
}

export function updateMaterialUnit(key, unit) {
    addPendingChange('materials');
}

export function updateMaterialPrice(key, value) {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
        showError(`Preço inválido para "${key}": ${value}`);
        return;
    }
    
    if (systemData.materials[key] !== numValue) {
        systemData.materials[key] = numValue;
        addPendingChange('materials');
    }
}

export async function deleteMaterial(key) {
    showConfirmation(`Deseja excluir o material "${key}"?`, async () => {
        try {
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    path: ['materials', key] 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                delete systemData.materials[key];
                loadMaterials();
                addPendingChange('materials');
                showWarning(`Material "${key}" excluído.`);
            } else {
                throw new Error(result.error || 'Erro ao excluir');
            }
        } catch (error) {
            console.error('Erro ao excluir material:', error);
            showError(`Erro ao excluir material: ${error.message}`);
        }
    });
}

// Exportar funções globalmente
window.loadMaterials = loadMaterials;
window.addMaterial = addMaterial;
window.updateMaterialKey = updateMaterialKey;
window.updateMaterialUnit = updateMaterialUnit;
window.updateMaterialPrice = updateMaterialPrice;
window.deleteMaterial = deleteMaterial;