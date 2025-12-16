// scripts/03_Edit_data/machines/machines-impostos.js
// Gerenciamento de impostos

import { systemData, addPendingChange, getCurrentMachineIndex } from '../../config/state.js';
import { escapeHtml, showConfirmation, showWarning } from '../../config/ui.js';

export function updateImposto(key, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        if (!systemData.machines[currentIndex].impostos) {
            systemData.machines[currentIndex].impostos = {};
        }
        systemData.machines[currentIndex].impostos[key] = value;
        addPendingChange('machines');
    }
}

export function updateImpostoKey(oldKey, newKey) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null && newKey && newKey.trim() !== '') {
        const machine = systemData.machines[currentIndex];
        if (machine.impostos && machine.impostos[oldKey] !== undefined) {
            const value = machine.impostos[oldKey];
            delete machine.impostos[oldKey];
            machine.impostos[newKey] = value;
            addPendingChange('machines');

            setTimeout(() => window.editMachine(currentIndex), 100);
        }
    }
}

export function removeImposto(key, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    showConfirmation(`Deseja remover o imposto "${key}"?`, () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.impostos && machine.impostos[key] !== undefined) {
                delete machine.impostos[key];
                addPendingChange('machines');
                
                const item = document.querySelector(`.imposto-item[data-key="${key}"]`);
                if (item) item.remove();
                
                showWarning(`Imposto "${key}" removido.`);
            }
        }
    });
}

export function addImposto(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const newKey = `NOVO_IMPOSTO_${Date.now().toString().slice(-4)}`;
        if (!systemData.machines[currentIndex].impostos) {
            systemData.machines[currentIndex].impostos = {};
        }
        systemData.machines[currentIndex].impostos[newKey] = '';
        addPendingChange('machines');
        
        const impostosList = document.querySelector('.impostos-grid');
        if (impostosList) {
            const newItem = document.createElement('div');
            newItem.className = 'imposto-item';
            newItem.setAttribute('data-key', newKey);
            newItem.innerHTML = `
                <div class="imposto-header">
                    <input type="text" value="${newKey}" 
                           class="form-input-small"
                           onchange="updateImpostoKey('${newKey}', this.value)"
                           placeholder="Nome do imposto">
                    <button class="btn btn-xs btn-danger" 
                            onclick="removeImposto('${newKey}', event)" 
                            title="Remover">
                        <i class="icon-delete"></i>
                    </button>
                </div>
                <div class="imposto-value">
                    <input type="text" value=""
                           onchange="updateImposto('${newKey}', this.value)"
                           class="form-input"
                           placeholder="Valor do imposto">
                </div>
            `;
            impostosList.appendChild(newItem);
            
            setTimeout(() => {
                const input = newItem.querySelector('.imposto-header input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        }
    }
}