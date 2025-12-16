// scripts/03_Edit_data/machines/machines-options.js
// Gerenciamento de opções

import { systemData, addPendingChange, getCurrentMachineIndex } from '../state.js';
import { escapeHtml, showConfirmation, showWarning, showError } from '../ui.js';

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
            
            // NÃO adiciona "TR" automaticamente
            const formattedKey = newKey.trim();
            
            // Se a chave mudou, atualiza no objeto
            if (oldKey !== formattedKey) {
                const value = machine.options[optionIndex].values[oldKey] || 0;
                delete machine.options[optionIndex].values[oldKey];
                machine.options[optionIndex].values[formattedKey] = value;
                addPendingChange('machines');
                
                // Atualiza o DOM
                const item = document.querySelector(`.option-item[data-index="${optionIndex}"] .option-value-item[data-key="${oldKey}"]`);
                if (item) {
                    item.setAttribute('data-key', formattedKey);
                    
                    // Atualiza input de capacidade
                    const capacityInput = item.querySelector('.option-value-content .option-value-field:nth-child(1) input');
                    if (capacityInput) {
                        capacityInput.value = formattedKey;
                        capacityInput.setAttribute('onchange', `updateOptionCapacityLabel(${optionIndex}, '${formattedKey}', this.value)`);
                    }
                    
                    // Atualiza botão de remover
                    const removeBtn = item.querySelector('button.btn-danger');
                    if (removeBtn) {
                        removeBtn.setAttribute('onclick', `removeOptionCapacity(${optionIndex}, '${formattedKey}', event)`);
                    }
                }
            }
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

        const optionsList = document.querySelector('.options-list');
        if (optionsList) {
            const newItem = document.createElement('div');
            newItem.className = 'option-item';
            newItem.setAttribute('data-index', newIndex);
            newItem.innerHTML = `
                <div class="option-header" onclick="toggleOptionItem(${newIndex}, event)">
                    <button class="minimizer">−</button>
                    <span>Opção ${newIndex + 1}: Nova Opção</span>
                    <button class="btn btn-xs btn-danger" onclick="removeOption(${newIndex}, event)" title="Remover">
                        <i class="icon-delete"></i>
                    </button>
                </div>
                <div class="option-content expanded">
                    <div class="option-field">
                        <span class="option-label">Nome da Opção:</span>
                        <input type="text" value="Nova Opção" 
                               placeholder="Nome da opção" 
                               oninput="syncOptionName(${newIndex}, this.value)" 
                               onchange="updateOption(${newIndex}, 'name', this.value)" 
                               class="form-input">
                    </div>
                    <div class="option-values">
                        <h5>Valores por Capacidade:</h5>
                        <div class="option-values-grid">
                            <!-- Capacidades serão adicionadas dinamicamente -->
                        </div>
                        <div class="text-center" style="margin-top: var(--spacing-md);">
                            <button class="btn btn-xs btn-info" onclick="addOptionValue(${newIndex}, event)">
                                <i class="icon-add"></i> Adicionar Capacidade
                            </button>
                        </div>
                    </div>
                </div>
            `;
            optionsList.appendChild(newItem);

            setTimeout(() => {
                const input = newItem.querySelector('.option-field input');
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

            // Contar quantas capacidades já existem para numerar
            const existingCapacities = Object.keys(machine.options[optionIndex].values);
            const capacityNumber = existingCapacities.length + 1;
            
            // Criar chave única
            const newKey = `NOVA_CAPACIDADE_${capacityNumber}`;
            machine.options[optionIndex].values[newKey] = 0;
            addPendingChange('machines');

            // Adicionar visualmente
            addOptionValueToDOM(optionIndex, newKey, capacityNumber);
        }
    }
}

function addOptionValueToDOM(optionIndex, capacityKey, capacityNumber) {
    const optionValuesGrid = document.querySelector(`.option-item[data-index="${optionIndex}"] .option-values-grid`);
    if (optionValuesGrid) {
        const newItem = document.createElement('div');
        newItem.className = 'option-value-item';
        newItem.setAttribute('data-key', capacityKey);
        newItem.innerHTML = `
            <div class="option-value-header">
                <span>Capacidade ${capacityNumber}</span>
                <button class="btn btn-xs btn-danger" 
                        onclick="removeOptionCapacity(${optionIndex}, '${capacityKey}', event)" 
                        title="Remover capacidade">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="option-value-content">
                <div class="option-value-field">
                    <label>Capacidade:</label>
                    <input type="text" value="${capacityKey}" 
                           placeholder="Ex: 35TR, 3100m³/h" 
                           onchange="updateOptionCapacityLabel(${optionIndex}, '${capacityKey}', this.value)" 
                           class="form-input-small">
                </div>
                <div class="option-value-field">
                    <label>Valor (R$):</label>
                    <input type="number" value="0" step="1" 
                           onchange="updateOptionValue(${optionIndex}, '${capacityKey}', this.value)" 
                           class="form-input-small">
                </div>
            </div>
        `;
        optionValuesGrid.appendChild(newItem);

        setTimeout(() => {
            const input = newItem.querySelector('.option-value-content .option-value-field:nth-child(1) input');
            if (input) {
                input.focus();
                input.select();
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

export function removeOptionCapacity(optionIndex, key, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    showConfirmation(`Deseja remover esta capacidade?`, () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.options && machine.options[optionIndex] && machine.options[optionIndex].values) {
                delete machine.options[optionIndex].values[key];
                addPendingChange('machines');

                // Remover visualmente
                const item = document.querySelector(`.option-item[data-index="${optionIndex}"] .option-value-item[data-key="${key}"]`);
                if (item) item.remove();

                // Renumerar as capacidades restantes
                renumberCapacities(optionIndex);
                
                showWarning('Capacidade removida.');
            }
        }
    });
}

// Função auxiliar para renumerar capacidades
function renumberCapacities(optionIndex) {
    const optionValuesGrid = document.querySelector(`.option-item[data-index="${optionIndex}"] .option-values-grid`);
    if (optionValuesGrid) {
        const capacityItems = optionValuesGrid.querySelectorAll('.option-value-item');
        capacityItems.forEach((item, index) => {
            const span = item.querySelector('.option-value-header span');
            if (span) {
                span.textContent = `Capacidade ${index + 1}`;
            }
        });
    }
}

// Função para renderizar capacidade existente (usada quando carrega opções)
export function renderExistingCapacity(optionIndex, key, value, capacityNumber) {
    const optionValuesGrid = document.querySelector(`.option-item[data-index="${optionIndex}"] .option-values-grid`);
    if (optionValuesGrid) {
        const newItem = document.createElement('div');
        newItem.className = 'option-value-item';
        newItem.setAttribute('data-key', key);
        newItem.innerHTML = `
            <div class="option-value-header">
                <span>Capacidade ${capacityNumber}</span>
                <button class="btn btn-xs btn-danger" 
                        onclick="removeOptionCapacity(${optionIndex}, '${key}', event)" 
                        title="Remover capacidade">
                    <i class="icon-delete"></i>
                </button>
            </div>
            <div class="option-value-content">
                <div class="option-value-field">
                    <label>Capacidade:</label>
                    <input type="text" value="${key}" 
                           placeholder="Ex: 35TR, 3100m³/h" 
                           onchange="updateOptionCapacityLabel(${optionIndex}, '${key}', this.value)" 
                           class="form-input-small">
                </div>
                <div class="option-value-field">
                    <label>Valor (R$):</label>
                    <input type="number" value="${value}" step="1" 
                           onchange="updateOptionValue(${optionIndex}, '${key}', this.value)" 
                           class="form-input-small">
                </div>
            </div>
        `;
        optionValuesGrid.appendChild(newItem);
    }
}

// Função para renderizar todas as capacidades existentes de uma opção
export function renderAllCapacities(optionIndex) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.options && machine.options[optionIndex] && machine.options[optionIndex].values) {
            const capacities = Object.entries(machine.options[optionIndex].values);
            
            capacities.forEach(([key, value], index) => {
                renderExistingCapacity(optionIndex, key, value, index + 1);
            });
        }
    }
}

// Função toggleOptionItem (adicione se ainda não existir)
export function toggleOptionItem(index, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const optionItem = document.querySelector(`.option-item[data-index="${index}"]`);
    if (optionItem) {
        const content = optionItem.querySelector('.option-content');
        const minimizer = optionItem.querySelector('.minimizer');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            minimizer.textContent = '+';
        } else {
            content.classList.add('expanded');
            minimizer.textContent = '−';
        }
    }
}