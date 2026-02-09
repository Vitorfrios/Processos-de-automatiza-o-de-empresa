/* ==== INÍCIO: core/machines/machines-impostos.js ==== */
// scripts/03_Edit_data/machines/machines-impostos.js
// Gerenciamento de impostos

import { systemData, addPendingChange, getCurrentMachineIndex } from '../../config/state.js';
import { escapeHtml, showConfirmation, showWarning, showInfo } from '../../config/ui.js';

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
        
        // Prevenir mudança do nome FORNECEDOR
        if (oldKey === 'FORNECEDOR') {
            showWarning('O nome "FORNECEDOR" não pode ser alterado.');
            
            // Restaurar o valor no input
            const input = document.querySelector(`.imposto-item[data-key="FORNECEDOR"] .imposto-header input`);
            if (input) {
                input.value = 'FORNECEDOR';
            }
            return;
        }
        
        if (machine.impostos && machine.impostos[oldKey] !== undefined) {
            const value = machine.impostos[oldKey];
            delete machine.impostos[oldKey];
            machine.impostos[newKey] = value;
            addPendingChange('machines');

            // Atualizar o DOM
            setTimeout(() => {
                const item = document.querySelector(`.imposto-item[data-key="${newKey}"]`);
                if (item) {
                    item.setAttribute('data-key', newKey);
                    
                    // Atualizar o botão de remover
                    const removeBtn = item.querySelector('button.btn-danger');
                    if (removeBtn) {
                        removeBtn.setAttribute('onclick', `removeImposto('${newKey}', event)`);
                    }
                }
            }, 50);
        }
    }
}

export function removeImposto(key, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    showConfirmation(`Deseja remover "${key}"?`, () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.impostos && machine.impostos[key] !== undefined) {
                // Se for FORNECEDOR, apenas limpa o valor, não remove o campo
                if (key === 'FORNECEDOR') {
                    machine.impostos[key] = '';
                    addPendingChange('machines');
                    
                    // Atualiza o valor no input
                    const input = document.querySelector(`.imposto-item[data-key="FORNECEDOR"] .imposto-value input`);
                    if (input) {
                        input.value = '';
                    }
                    
                    showWarning('Valor do fornecedor limpo.');
                } else {
                    // Para outros impostos, remove completamente
                    delete machine.impostos[key];
                    addPendingChange('machines');
                    
                    const item = document.querySelector(`.imposto-item[data-key="${key}"]`);
                    if (item) item.remove();
                    
                    showWarning(`"${key}" removido.`);
                }
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
        // Verificar se já existe um campo FORNECEDOR
        const machine = systemData.machines[currentIndex];
        const existingKeys = Object.keys(machine.impostos || {});
        
        // Verificar se já existe FORNECEDOR (case insensitive)
        const hasFornecedor = existingKeys.some(key => key.toUpperCase() === 'FORNECEDOR');
        
        if (hasFornecedor) {
            showInfo('O campo FORNECEDOR já existe na lista.');
            return;
        }
        
        const newKey = `NOVO_IMPOSTO_${Date.now().toString().slice(-4)}`;
        if (!machine.impostos) {
            machine.impostos = {};
        }
        machine.impostos[newKey] = '';
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

// Exportar para window
window.updateImposto = updateImposto;
window.updateImpostoKey = updateImpostoKey;
window.removeImposto = removeImposto;
window.addImposto = addImposto;
/* ==== FIM: core/machines/machines-impostos.js ==== */