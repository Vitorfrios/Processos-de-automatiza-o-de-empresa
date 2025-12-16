// scripts/03_Edit_data/machines/machines-voltages.js
// Gerenciamento de tensões

import { systemData, addPendingChange, getCurrentMachineIndex } from '../../config/state.js';
import { escapeHtml, showConfirmation, showWarning } from '../../config/ui.js';



export function addVoltage(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (!machine.voltages) {
            machine.voltages = [];
        }

        const newIndex = machine.voltages.length;
        machine.voltages.push({
            id: newIndex + 1,
            name: 'Nova Tensão',
            value: 0
        });

        addPendingChange('machines');

        // Tentar vários seletores possíveis
        let voltagesContainer = document.querySelector('.voltages-grid');
        if (!voltagesContainer) {
            voltagesContainer = document.querySelector('.voltages-container');
        }
        if (!voltagesContainer) {
            voltagesContainer = document.querySelector('.voltages-list');
        }
        
        if (voltagesContainer) {
            const newItem = document.createElement('div');
            newItem.className = 'voltage-card';
            newItem.setAttribute('data-index', newIndex);
            newItem.innerHTML = `
                <div class="voltage-card-header">
                    <span>Tensão ${newIndex + 1}</span>
                    <button class="btn btn-xs btn-danger" 
                            onclick="removeVoltage(${newIndex}, event)" 
                            title="Remover">
                        <i class="icon-delete"></i>
                    </button>
                </div>
                <div class="voltage-card-content">
                    <div class="voltage-field">
                        <label>Nome:</label>
                        <input type="text" value="Nova Tensão" 
                               placeholder="Nome da tensão"
                               onchange="updateVoltage(${newIndex}, 'name', this.value)"
                               class="form-input">
                    </div>
                    <div class="voltage-field">
                        <label>Valor (V):</label>
                        <input type="number" value="0" step="0.01"
                               onchange="updateVoltage(${newIndex}, 'value', this.value)"
                               class="form-input">
                    </div>
                </div>
            `;
            voltagesContainer.appendChild(newItem);

            setTimeout(() => {
                const input = newItem.querySelector('input[type="text"]');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        } else {
            // Se não encontrar o container, recarrega a página
            window.editMachine(currentIndex);
        }
    }
}

export function updateVoltage(index, field, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.voltages && machine.voltages[index]) {
            if (field === 'value') {
                machine.voltages[index][field] = parseFloat(value) || 0;
            } else {
                machine.voltages[index][field] = value;
            }
            addPendingChange('machines');
        }
    }
}

export function removeVoltage(index, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    showConfirmation('Deseja remover esta tensão?', () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.voltages) {
                machine.voltages.splice(index, 1);
                addPendingChange('machines');

                const gridCard = document.querySelector(`.voltage-card[data-index="${index}"]`);
                if (gridCard) gridCard.remove();

                document.querySelectorAll('.voltage-card[data-index]').forEach((card, newIndex) => {
                    card.setAttribute('data-index', newIndex);
                    card.querySelector('.voltage-card-header span').textContent = `Tensão ${newIndex + 1}`;
                    const inputs = card.querySelectorAll('input');
                    inputs[0].setAttribute('onchange', `updateVoltage(${newIndex}, 'name', this.value)`);
                    inputs[1].setAttribute('onchange', `updateVoltage(${newIndex}, 'value', this.value)`);
                    const button = card.querySelector('button');
                    button.setAttribute('onclick', `removeVoltage(${newIndex}, event)`);
                });

                showWarning('Tensão removida.');
            }
        }
    });
}