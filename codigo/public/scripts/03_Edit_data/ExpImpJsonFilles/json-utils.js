// json-utils.js - Arquivo principal que coordena tudo
import { 
    initJSONEditor, 
    updateLineNumbers, 
    formatJSON, 
    validateJSON,
    updateApplyButtonState,
    updateJSONStatus
} from './json-editor.js';

import {
    exportToJSON,
    importFromJSON,
    importFromExcel,
    exportToExcel
} from './json-import-export.js';

import { showError, showSuccess, showWarning } from '../config/ui.js';

// ==================== FUNÇÃO APLICAR JSON ====================

export async function applyJSON() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) {
        showError('Editor JSON não encontrado');
        return;
    }
    
    try {
        const proposedData = JSON.parse(editor.value);
        const validation = validateJSONStructure(proposedData);
        
        if (!validation.valid) {
            showError('JSON inválido. Corrija os erros antes de aplicar.');
            updateJSONStatus(`❌ JSON inválido: ${validation.errors.join(', ')}`, 'error');
            return;
        }
        
        const currentData = window.systemData || {};
        const hasCurrentData = Object.keys(currentData).length > 0;
        
        if (hasCurrentData) {
            const comparison = await compareJSONData(currentData, proposedData);
            
            if (!comparison.summary.has_changes) {
                showWarning('Nenhuma alteração detectada entre os dados atuais e propostos.');
                return;
            }
            
            const confirmed = await showJsonConfirmationModal(comparison);
            
            if (!confirmed) {
                showWarning('Aplicação cancelada pelo usuário.');
                return;
            }
            
            const applied = applyChangesIncremental(currentData, proposedData, comparison.differences);
            
            if (applied) {
                window.systemData = currentData;
                window.stagingData = null;
                window.hasPendingChanges = false;
                
                await saveSystemData(currentData);
                
                window.dispatchEvent(new CustomEvent('dataApplied', { 
                    detail: { data: currentData, changes: comparison.differences }
                }));
                
                updateAllTabsUI();
                editor.value = JSON.stringify(currentData, null, 2);
                updateLineNumbers();
                
                showSuccess('JSON aplicado com sucesso!');
                updateJSONStatus('✅ JSON aplicado ao sistema.', 'success');
                updateApplyButtonState();
            }
        } else {
            window.systemData = proposedData;
            window.stagingData = null;
            window.hasPendingChanges = false;
            
            await saveSystemData(proposedData);
            
            window.dispatchEvent(new CustomEvent('dataImported', { 
                detail: proposedData 
            }));
            
            updateAllTabsUI();
            
            showSuccess('JSON aplicado com sucesso!');
            updateJSONStatus('✅ JSON aplicado ao sistema.', 'success');
            updateApplyButtonState();
        }
        
    } catch (error) {
        console.error('Erro ao aplicar JSON:', error);
        showError(`Erro ao aplicar JSON: ${error.message}`);
        updateJSONStatus(`❌ Erro na aplicação: ${error.message}`, 'error');
    }
}

// ==================== FUNÇÕES AUXILIARES ====================

// Salva dados no servidor
async function saveSystemData(data) {
    try {
        const response = await fetch('/api/system-data/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar dados no servidor');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro ao salvar dados');
        }
        
        console.log('✅ Dados salvos no servidor');
        return true;
        
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showError('Erro ao salvar dados no servidor. As alterações foram aplicadas apenas localmente.');
        return false;
    }
}

// Atualiza todas as tabs
function updateAllTabsUI() {
    if (window.loadConstants) window.loadConstants();
    if (window.loadMachines) window.loadMachines();
    if (window.loadMaterials) window.loadMaterials();
    if (window.loadEmpresas) window.loadEmpresas();
    if (window.populateMachineFilter) window.populateMachineFilter();
    if (window.loadJSONEditor) window.loadJSONEditor();
}

// Compara dados JSON
async function compareJSONData(current, proposed) {
    try {
        const response = await fetch('/api/system/apply-json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                current: current,
                proposed: proposed
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro na comparação');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro na comparação');
        }
        
        return result;
        
    } catch (error) {
        console.error('Erro na comparação:', error);
        return performLocalComparison(current, proposed);
    }
}

// Comparação local
function performLocalComparison(current, proposed) {
    const differences = {
        constants: { added: [], modified: [], removed: [] },
        machines: { added: [], modified: [], removed: [] },
        materials: { added: [], modified: [], removed: [] },
        empresas: { added: [], modified: [], removed: [] }
    };
    
    // Comparação de constants
    const currentConstKeys = Object.keys(current.constants || {});
    const proposedConstKeys = Object.keys(proposed.constants || {});
    
    for (const key of proposedConstKeys) {
        if (!currentConstKeys.includes(key)) {
            differences.constants.added.push(key);
        } else if (JSON.stringify(proposed.constants[key]) !== JSON.stringify(current.constants[key])) {
            differences.constants.modified.push(key);
        }
    }
    
    for (const key of currentConstKeys) {
        if (!proposedConstKeys.includes(key)) {
            differences.constants.removed.push(key);
        }
    }
    
    // Cálculo de totais
    const totalAdded = differences.constants.added.length + differences.machines.added.length + 
                      differences.materials.added.length + differences.empresas.added.length;
    const totalModified = differences.constants.modified.length + differences.machines.modified.length + 
                         differences.materials.modified.length + differences.empresas.modified.length;
    const totalRemoved = differences.constants.removed.length + differences.machines.removed.length + 
                        differences.materials.removed.length + differences.empresas.removed.length;
    
    return {
        success: true,
        differences: differences,
        summary: {
            total_changes: totalAdded + totalModified + totalRemoved,
            total_added: totalAdded,
            total_modified: totalModified,
            total_removed: totalRemoved,
            has_changes: (totalAdded + totalModified + totalRemoved) > 0
        }
    };
}

// Aplica mudanças incrementais
function applyChangesIncremental(current, proposed, differences) {
    try {
        if (!current.constants) current.constants = {};
        if (!current.machines) current.machines = [];
        if (!current.materials) current.materials = {};
        if (!current.empresas) current.empresas = [];
        
        // Aplicar constants
        for (const added of differences.constants.added) {
            current.constants[added] = proposed.constants[added];
        }
        for (const modified of differences.constants.modified) {
            current.constants[modified] = proposed.constants[modified];
        }
        
        // Aplicar machines
        for (const added of differences.machines.added) {
            const newMachine = proposed.machines.find(m => m.type === added);
            if (newMachine) {
                current.machines.push(newMachine);
            }
        }
        for (const modified of differences.machines.modified) {
            const updatedMachine = proposed.machines.find(m => m.type === modified);
            const index = current.machines.findIndex(m => m.type === modified);
            if (index !== -1 && updatedMachine) {
                current.machines[index] = updatedMachine;
            }
        }
        
        // Aplicar materials
        for (const added of differences.materials.added) {
            current.materials[added] = proposed.materials[added];
        }
        for (const modified of differences.materials.modified) {
            current.materials[modified] = proposed.materials[modified];
        }
        
        // Aplicar empresas
        for (const added of differences.empresas.added) {
            const newEmpresa = proposed.empresas.find(e => {
                const key = Object.keys(e)[0];
                return key === added;
            });
            if (newEmpresa) {
                current.empresas.push(newEmpresa);
            }
        }
        for (const modified of differences.empresas.modified) {
            const updatedEmpresa = proposed.empresas.find(e => {
                const key = Object.keys(e)[0];
                return key === modified;
            });
            const index = current.empresas.findIndex(e => {
                const key = Object.keys(e)[0];
                return key === modified;
            });
            if (index !== -1 && updatedEmpresa) {
                current.empresas[index] = updatedEmpresa;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Erro ao aplicar mudanças:', error);
        return false;
    }
}

// Modal de confirmação
async function showJsonConfirmationModal(comparison) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmationModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        if (!modal || !modalTitle || !modalMessage) {
            const confirmed = confirm(
                `Confirmar aplicação de JSON?\n\n` +
                `Adicionados: ${comparison.summary.total_added}\n` +
                `Modificados: ${comparison.summary.total_modified}\n` +
                `Removidos: ${comparison.summary.total_removed}\n\n` +
                `Total: ${comparison.summary.total_changes} alterações`
            );
            resolve(confirmed);
            return;
        }
        
        modalTitle.textContent = 'Confirmar Aplicação de JSON';
        
        let messageHtml = `
            <div class="comparison-summary">
                <h4>Resumo das Alterações:</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><strong>Adicionados:</strong> ${comparison.summary.total_added}</li>
                    <li><strong>Modificados:</strong> ${comparison.summary.total_modified}</li>
                    <li><strong>Removidos:</strong> ${comparison.summary.total_removed}</li>
                </ul>
                <p style="margin-top: 10px;"><strong>Total de alterações:</strong> ${comparison.summary.total_changes}</p>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                    <i class="icon-info"></i> Os itens marcados como "removidos" serão mantidos no sistema.
                    Para remover itens, edite manualmente.
                </p>
            </div>
        `;
        
        modalMessage.innerHTML = messageHtml;
        modal.style.display = 'flex';
        
        const originalCallback = window.confirmCallback;
        
        window.confirmCallback = function() {
            window.confirmCallback = originalCallback;
            modal.style.display = 'none';
            resolve(true);
        };
        
        const cancelButton = modal.querySelector('.btn-secondary');
        if (cancelButton) {
            const originalOnClick = cancelButton.onclick;
            cancelButton.onclick = function() {
                modal.style.display = 'none';
                resolve(false);
                return false;
            };
        }
    });
}

// Valida estrutura básica do JSON
function validateJSONStructure(data) {
    const errors = [];
    
    if (!data.constants || typeof data.constants !== 'object') {
        errors.push('constants deve ser um objeto');
    }
    
    if (!data.machines || !Array.isArray(data.machines)) {
        errors.push('machines deve ser um array');
    }
    
    if (!data.materials || typeof data.materials !== 'object') {
        errors.push('materials deve ser um objeto');
    }
    
    if (!data.empresas || !Array.isArray(data.empresas)) {
        errors.push('empresas deve ser um array');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ==================== FUNÇÕES DE SISTEMA ====================

// Salva dados
export async function saveData() {
    try {
        if (!window.systemData) {
            showError('Nenhum dado para salvar');
            return;
        }
        
        const response = await fetch('/api/system-data/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(window.systemData)
        });
        
        if (response.ok) {
            showSuccess('Dados salvos com sucesso!');
        } else {
            throw new Error('Erro ao salvar dados');
        }
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showError('Erro ao salvar dados');
    }
}

// Carrega dados
export async function loadData() {
    try {
        const response = await fetch('/api/system-data');
        
        if (response.ok) {
            const data = await response.json();
            window.systemData = data;
            
            window.dispatchEvent(new CustomEvent('dataLoaded', { 
                detail: data 
            }));
            
            window.stagingData = null;
            window.hasPendingChanges = false;
            updateApplyButtonState();
            
            showSuccess('Dados carregados com sucesso!');
            
        } else {
            throw new Error('Erro ao carregar dados');
        }
        
    } catch (error) {
        console.error('Erro ao carregar:', error);
        showError('Erro ao carregar dados do servidor');
    }
}

// ==================== EXPORTAÇÃO GLOBAL ====================

// Exporta todas as funções para o escopo global
window.exportToJSON = exportToJSON;
window.importFromJSON = importFromJSON;
window.importFromExcel = importFromExcel;
window.exportToExcel = exportToExcel;
window.applyJSON = applyJSON;
window.formatJSON = formatJSON;
window.validateJSON = validateJSON;
window.saveData = saveData;
window.loadData = loadData;
window.updateLineNumbers = updateLineNumbers;
window.initJSONEditor = initJSONEditor;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initJSONEditor, 100);
    
    window.addEventListener('dataLoaded', function() {
        setTimeout(initJSONEditor, 50);
    });
    
    window.addEventListener('dataImported', function() {
        setTimeout(initJSONEditor, 50);
    });
    
    window.addEventListener('dataApplied', function(event) {
        setTimeout(initJSONEditor, 50);
    });
});