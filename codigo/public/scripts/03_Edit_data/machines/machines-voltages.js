// scripts/03_Edit_data/machines/machines-voltages.js
// Gerenciamento de tensões

import { systemData, addPendingChange, getCurrentMachineIndex } from '../state.js';
import { escapeHtml, showConfirmation, showWarning } from '../ui.js';

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
        window.editMachine(currentIndex);
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