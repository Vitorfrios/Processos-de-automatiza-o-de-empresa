// scripts/03_Edit_data/machines/machines-options.js
// Gerenciamento de opções

import { systemData, addPendingChange, getCurrentMachineIndex } from '../state.js';
import { escapeHtml, showConfirmation, showWarning, showError } from '../ui.js';
import { ensureTRSuffix, selectTextInLabel } from './machines-core.js';

export function syncOptionName(index, value) {
    const optionHeader = document.querySelector(`.option-item[data-index="${index}"] .option-header span`);
    if (optionHeader) {
        optionHeader.textContent = `Opção ${index + 1}: ${value}`;
    }
}

export function updateOption(index, field, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.options && machine.options[index]) {
            machine.options[index][field] = value;
            addPendingChange('machines');
            
            if (field === 'name') {
                syncOptionName(index, value);
            }
        }
    }
}

export function updateOptionCapacityLabel(optionIndex, oldKey, newKey) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null && newKey && newKey.trim() !== '') {
        const machine = systemData.machines[currentIndex];
        if (machine.options && machine.options[optionIndex] && machine.options[optionIndex].values) {
            
            const formattedKey = ensureTRSuffix(newKey);
            
            if (oldKey !== formattedKey) {
                const value = machine.options[optionIndex].values[oldKey] || 0;
                delete machine.options[optionIndex].values[oldKey];
                machine.options[optionIndex].values[formattedKey] = value;
                addPendingChange('machines');
                
                updateOptionCapacityInDOM(optionIndex, oldKey, formattedKey, value);
            }
        }
    }
}

function updateOptionCapacityInDOM(optionIndex, oldKey, newKey, value) {
    const item = document.querySelector(`.option-item[data-index="${optionIndex}"] .option-value-item[data-key="${oldKey}"]`);
    if (item) {
        item.setAttribute('data-key', newKey);
        
        const label = item.querySelector('label');
        if (label) {
            label.textContent = newKey;
            label.setAttribute('onblur', `updateOptionCapacityLabel(${optionIndex}, '${newKey}', this.textContent.trim())`);
        }
        
        const input = item.querySelector('input');
        if (input) {
            input.value = value;
            input.setAttribute('onchange', `updateOptionValue(${optionIndex}, '${newKey}', this.value)`);
        }
    }
}

export function updateOptionValue(optionIndex, key, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.options && machine.options[optionIndex]) {
            if (!machine.options[optionIndex].values) {
                machine.options[optionIndex].values = {};
            }
            machine.options[optionIndex].values[key] = parseInt(value) || 0;
            addPendingChange('machines');
        }
    }
}

export function addOption(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (!machine.options) {
            machine.options = [];
        }

        const newIndex = machine.options.length;
        machine.options.push({
            id: newIndex + 1,
            name: 'Nova Opção',
            values: {}
        });

        addPendingChange('machines');
        window.editMachine(currentIndex);
    }
}

export function addOptionValue(optionIndex, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.options && machine.options[optionIndex]) {
            if (!machine.options[optionIndex].values) {
                machine.options[optionIndex].values = {};
            }

            const trValue = prompt('Digite o valor TR (apenas o número, ex: 35, 40, 50):', '35');
            if (trValue === null) return;
            
            const trNumber = parseFloat(trValue.replace(',', '.')) || 35;
            const capacityKey = `${trNumber}TR`;
            
            if (machine.options[optionIndex].values[capacityKey] !== undefined) {
                showError(`A capacidade ${capacityKey} já existe!`);
                return;
            }

            machine.options[optionIndex].values[capacityKey] = 0;
            addPendingChange('machines');
            addOptionValueToDOM(optionIndex, capacityKey);
        }
    }
}

function addOptionValueToDOM(optionIndex, capacityKey) {
    const optionValuesGrid = document.querySelector(`.option-item[data-index="${optionIndex}"] .option-values-grid`);
    if (optionValuesGrid) {
        const newItem = document.createElement('div');
        newItem.className = 'option-value-item';
        newItem.setAttribute('data-key', capacityKey);
        newItem.innerHTML = `
            <label contenteditable="true" 
                   onblur="updateOptionCapacityLabel(${optionIndex}, '${capacityKey}', this.textContent.trim())"
                   onkeydown="if(event.key === 'Enter') { event.preventDefault(); this.blur(); }">
                ${capacityKey}
            </label>
            <input type="number" value="0" step="1"
                   onchange="updateOptionValue(${optionIndex}, '${capacityKey}', this.value)"
                   class="form-input-small">
        `;
        optionValuesGrid.appendChild(newItem);

        setTimeout(() => {
            const label = newItem.querySelector('label');
            if (label) {
                label.focus();
                selectTextInLabel(label);
            }
        }, 50);
    }
}

export function removeOption(index, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    showConfirmation('Deseja remover esta opção?', () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.options) {
                machine.options.splice(index, 1);
                addPendingChange('machines');
                window.editMachine(currentIndex);
                showWarning('Opção removida.');
            }
        }
    });
}