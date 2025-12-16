// scripts/03_Edit_data/machines/machines-configs.js
// Gerenciamento de configurações e valores base

import { systemData, addPendingChange, getCurrentMachineIndex } from '../state.js';
import { escapeHtml, showConfirmation, showWarning, showError } from '../ui.js';
import { ensureTRSuffix, selectTextInLabel } from './machines-core.js';

// ===== FUNÇÕES PARA CONFIGURAÇÕES =====

export function addConfiguracao(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (!machine.configuracoes_instalacao) {
            machine.configuracoes_instalacao = [];
        }

        const newIndex = machine.configuracoes_instalacao.length;
        machine.configuracoes_instalacao.push({
            nome: 'Nova Configuração'
        });

        addPendingChange('machines');

        const configuracoesList = document.querySelector('.configuracoes-list');
        if (configuracoesList) {
            const newItem = document.createElement('div');
            newItem.className = 'config-item';
            newItem.setAttribute('data-index', newIndex);
            newItem.innerHTML = `
                <div class="config-header">
                    <span>Configuração ${newIndex + 1}</span>
                    <button class="btn btn-xs btn-danger" onclick="removeConfiguracao(${newIndex}, event)" title="Remover">
                        <i class="icon-delete"></i>
                    </button>
                </div>
                <div class="config-content">
                    <div class="config-field">
                        <span class="config-label">Descrição:</span>
                        <input type="text" value="Nova Configuração" 
                               placeholder="Descrição da configuração"
                               onchange="updateConfiguracao(${newIndex}, 'nome', this.value)"
                               class="form-input">
                    </div>
                </div>
            `;
            configuracoesList.appendChild(newItem);

            setTimeout(() => {
                const input = newItem.querySelector('input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        } else {
            window.editMachine(currentIndex);
        }
    }
}

export function updateConfiguracao(index, field, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.configuracoes_instalacao && machine.configuracoes_instalacao[index]) {
            machine.configuracoes_instalacao[index][field] = value;
            addPendingChange('machines');
        }
    }
}

export function removeConfiguracao(index, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    showConfirmation('Deseja remover esta configuração?', () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.configuracoes_instalacao) {
                machine.configuracoes_instalacao.splice(index, 1);
                addPendingChange('machines');

                const item = document.querySelector(`.config-item[data-index="${index}"]`);
                if (item) item.remove();

                const items = document.querySelectorAll('.config-item');
                items.forEach((item, newIndex) => {
                    item.setAttribute('data-index', newIndex);
                    const span = item.querySelector('.config-header span');
                    if (span) span.textContent = `Configuração ${newIndex + 1}`;

                    const removeBtn = item.querySelector('button.btn-danger');
                    if (removeBtn) {
                        removeBtn.setAttribute('onclick', `removeConfiguracao(${newIndex}, event)`);
                    }

                    const input = item.querySelector('input');
                    if (input) {
                        input.setAttribute('onchange', `updateConfiguracao(${newIndex}, 'nome', this.value)`);
                    }
                });

                showWarning('Configuração removida.');
            }
        }
    });
}

// ===== FUNÇÕES PARA VALORES BASE =====

export function updateBaseValueKey(oldKey, newKey) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null && newKey && newKey.trim() !== '') {
        const machine = systemData.machines[currentIndex];
        
        const formattedKey = ensureTRSuffix(newKey);
        
        if (machine.baseValues && machine.baseValues[oldKey] !== undefined) {
            if (oldKey !== formattedKey) {
                const value = machine.baseValues[oldKey];
                delete machine.baseValues[oldKey];
                machine.baseValues[formattedKey] = value;
                addPendingChange('machines');
                
                updateBaseValueKeyInDOM(oldKey, formattedKey, value);
            }
        }
    }
}

function updateBaseValueKeyInDOM(oldKey, newKey, value) {
    const item = document.querySelector(`.base-value-item[data-key="${oldKey}"]`);
    if (item) {
        item.setAttribute('data-key', newKey);
        
        const label = item.querySelector('label');
        if (label) {
            label.textContent = newKey;
            label.setAttribute('onblur', `updateBaseValueKey('${newKey}', this.textContent.trim())`);
        }
        
        const valueInput = item.querySelector('input[type="number"]');
        if (valueInput) {
            valueInput.value = value;
            valueInput.setAttribute('onchange', `updateBaseValue('${newKey}', this.value)`);
        }
    }
}

export function updateBaseValue(key, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.baseValues && machine.baseValues[key] !== undefined) {
            machine.baseValues[key] = parseInt(value) || 0;
            addPendingChange('machines');
        }
    }
}

export function addBaseValue(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (!machine.baseValues) {
            machine.baseValues = {};
        }

        const trValue = prompt('Digite o valor TR (apenas o número):', '1');
        if (trValue === null) return;
        
        const trNumber = parseFloat(trValue.replace(',', '.')) || 1;
        const capacityKey = `${trNumber}TR`;
        
        if (machine.baseValues[capacityKey] !== undefined) {
            showError(`A capacidade ${capacityKey} já existe!`);
            return;
        }

        machine.baseValues[capacityKey] = 0;
        addPendingChange('machines');
        addBaseValueToDOM(capacityKey);
    }
}

function addBaseValueToDOM(capacityKey) {
    const baseValuesList = document.querySelector('.base-values-list');
    if (baseValuesList) {
        const newItem = document.createElement('div');
        newItem.className = 'base-value-item';
        newItem.setAttribute('data-key', capacityKey);
        newItem.innerHTML = `
            <div class="base-value-header">
                <label contenteditable="true" 
                       onblur="updateBaseValueKey('${capacityKey}', this.textContent.trim())"
                       onkeydown="if(event.key === 'Enter') { event.preventDefault(); this.blur(); }">
                    ${capacityKey}
                </label>
                <button class="btn btn-xs btn-danger" onclick="removeBaseValue('${capacityKey}', event)" title="Remover">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <input type="number" value="0" step="1"
                   placeholder="Valor"
                   onchange="updateBaseValue('${capacityKey}', this.value)"
                   class="form-input">
        `;
        baseValuesList.appendChild(newItem);

        setTimeout(() => {
            const label = newItem.querySelector('label');
            if (label) {
                label.focus();
                selectTextInLabel(label);
            }
        }, 50);
    }
}

export function removeBaseValue(key, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    showConfirmation(`Deseja remover o valor base "${key}"?`, () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.baseValues && machine.baseValues[key] !== undefined) {
                delete machine.baseValues[key];
                addPendingChange('machines');

                const item = document.querySelector(`.base-value-item[data-key="${key}"]`);
                if (item) item.remove();

                showWarning(`Valor base "${key}" removido.`);
            }
        }
    });
}