// json-utils.js - Arquivo principal que coordena tudo
import {
    initJSONEditor,
    updateLineNumbers,
    updateApplyButtonState,
    updateJSONStatus,
    validateJSONStructure
} from './json-editor.js';

import { showError, showSuccess, showWarning } from '../config/ui.js';

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Garante estrutura completa dos dados
 */
function ensureCompleteData(data) {
    if (!data || typeof data !== 'object') {
        return createDefaultData();
    }
    
    return {
        constants: data.constants || {},
        machines: data.machines || [],
        materials: data.materials || {},
        empresas: data.empresas || [],
        banco_equipamentos: data.banco_equipamentos || {}
    };
}

/**
 * Cria dados padrão com estrutura completa
 */
function createDefaultData() {
    return {
        constants: {},
        machines: [],
        materials: {},
        empresas: [],
        banco_equipamentos: {}
    };
}

/**
 * Valida e garante que os dados tenham banco_equipamentos
 */
function validateAndEnsureBancoEquipamentos(data) {
    const result = ensureCompleteData(data);
    
    // Log para debug
    console.log('🔍 Validando dados - banco_equipamentos:', 
        Object.keys(result.banco_equipamentos).length > 0 ? 
        `✅ (${Object.keys(result.banco_equipamentos).length} equipamentos)` : 
        '⚠️ VAZIO');
    
    return result;
}

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
                // ✅ GARANTIR ESTRUTURA COMPLETA
                const completeData = validateAndEnsureBancoEquipamentos(currentData);
                
                window.systemData = completeData;
                window.stagingData = null;
                window.hasPendingChanges = false;

                await saveSystemData(completeData);

                window.dispatchEvent(new CustomEvent('dataApplied', {
                    detail: { data: completeData, changes: comparison.differences }
                }));

                updateAllTabsUI();
                editor.value = JSON.stringify(completeData, null, 2);
                updateLineNumbers();

                showSuccess('JSON aplicado com sucesso!');
                updateJSONStatus('✅ JSON aplicado ao sistema.', 'success');
                updateApplyButtonState();
            }
        } else {
            // ✅ GARANTIR ESTRUTURA COMPLETA
            const completeProposedData = validateAndEnsureBancoEquipamentos(proposedData);
            
            window.systemData = completeProposedData;
            window.stagingData = null;
            window.hasPendingChanges = false;

            await saveSystemData(completeProposedData);

            window.dispatchEvent(new CustomEvent('dataImported', {
                detail: completeProposedData
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

// ==================== FUNÇÕES RESTANTES (mantenha igual) ====================

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

function updateAllTabsUI() {
    if (window.loadConstants) window.loadConstants();
    if (window.loadMachines) window.loadMachines();
    if (window.loadMaterials) window.loadMaterials();
    if (window.loadEmpresas) window.loadEmpresas();
    if (window.populateMachineFilter) window.populateMachineFilter();
    if (window.loadJSONEditor) window.loadJSONEditor();
    if (window.loadEquipamentos) window.loadEquipamentos();
}

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

function performLocalComparison(current, proposed) {
    const differences = {
        constants: { added: [], modified: [], removed: [] },
        machines: { added: [], modified: [], removed: [] },
        materials: { added: [], modified: [], removed: [] },
        empresas: { added: [], modified: [], removed: [] },
        banco_equipamentos: { added: [], modified: [], removed: [] }
    };

    const currentConstKeys = Object.keys(current.constants || {});
    const proposedConstKeys = Object.keys(proposed.constants || {});

    for (const key of proposedConstKeys) {
        if (!currentConstKeys.includes(key)) {
            differences.constants.added.push(key);
        } else if (
            JSON.stringify(proposed.constants[key]) !==
            JSON.stringify(current.constants[key])
        ) {
            differences.constants.modified.push(key);
        }
    }

    for (const key of currentConstKeys) {
        if (!proposedConstKeys.includes(key)) {
            differences.constants.removed.push(key);
        }
    }

    const currentEquipKeys = Object.keys(current.banco_equipamentos || {});
    const proposedEquipKeys = Object.keys(proposed.banco_equipamentos || {});

    for (const key of proposedEquipKeys) {
        if (!currentEquipKeys.includes(key)) {
            differences.banco_equipamentos.added.push(key);
        } else if (
            JSON.stringify(proposed.banco_equipamentos[key]) !==
            JSON.stringify(current.banco_equipamentos[key])
        ) {
            differences.banco_equipamentos.modified.push(key);
        }
    }

    for (const key of currentEquipKeys) {
        if (!proposedEquipKeys.includes(key)) {
            differences.banco_equipamentos.removed.push(key);
        }
    }

    const totalAdded =
        differences.constants.added.length +
        differences.machines.added.length +
        differences.materials.added.length +
        differences.empresas.added.length +
        differences.banco_equipamentos.added.length;

    const totalModified =
        differences.constants.modified.length +
        differences.machines.modified.length +
        differences.materials.modified.length +
        differences.empresas.modified.length +
        differences.banco_equipamentos.modified.length;

    const totalRemoved =
        differences.constants.removed.length +
        differences.machines.removed.length +
        differences.materials.removed.length +
        differences.empresas.removed.length +
        differences.banco_equipamentos.removed.length;

    return {
        success: true,
        differences,
        summary: {
            total_changes: totalAdded + totalModified + totalRemoved,
            total_added: totalAdded,
            total_modified: totalModified,
            total_removed: totalRemoved,
            has_changes: (totalAdded + totalModified + totalRemoved) > 0
        }
    };
}

function applyChangesIncremental(current, proposed, differences) {
    try {
        if (!current.constants) current.constants = {};
        if (!current.machines) current.machines = [];
        if (!current.materials) current.materials = {};
        if (!current.empresas) current.empresas = [];
        if (!current.banco_equipamentos) current.banco_equipamentos = {};

        for (const added of differences.constants.added) {
            current.constants[added] = proposed.constants[added];
        }
        for (const modified of differences.constants.modified) {
            current.constants[modified] = proposed.constants[modified];
        }

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

        for (const added of differences.materials.added) {
            current.materials[added] = proposed.materials[added];
        }
        for (const modified of differences.materials.modified) {
            current.materials[modified] = proposed.materials[modified];
        }

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

        for (const added of differences.banco_equipamentos.added) {
            current.banco_equipamentos[added] = proposed.banco_equipamentos[added];
        }

        for (const modified of differences.banco_equipamentos.modified) {
            current.banco_equipamentos[modified] = proposed.banco_equipamentos[modified];
        }

        return true;

    } catch (error) {
        console.error('Erro ao aplicar mudanças:', error);
        return false;
    }
}

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

        window.confirmCallback = function () {
            window.confirmCallback = originalCallback;
            modal.style.display = 'none';
            resolve(true);
        };

        const cancelButton = modal.querySelector('.btn-secondary');
        if (cancelButton) {
            const originalOnClick = cancelButton.onclick;
            cancelButton.onclick = function () {
                modal.style.display = 'none';
                resolve(false);
                return false;
            };
        }
    });
}

// ==================== FUNÇÕES DE SISTEMA ====================

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

// ==================== LOAD DATA CORRIGIDO ====================

export async function loadData() {
    try {
        console.log('📥 Carregando dados do servidor...');
        
        const response = await fetch('/api/system-data');

        if (response.ok) {
            const data = await response.json();
            
            console.log('✅ Dados brutos da API:', {
                constants: Object.keys(data.constants || {}).length,
                machines: data.machines?.length || 0,
                materials: Object.keys(data.materials || {}).length,
                empresas: data.empresas?.length || 0,
                banco_equipamentos: Object.keys(data.banco_equipamentos || {}).length
            });
            
            // ✅ GARANTIR ESTRUTURA COMPLETA
            const completeData = validateAndEnsureBancoEquipamentos(data);
            
            window.systemData = completeData;

            window.dispatchEvent(new CustomEvent('dataLoaded', {
                detail: completeData
            }));

            window.stagingData = null;
            window.hasPendingChanges = false;
            updateApplyButtonState();

            showSuccess('Dados carregados com sucesso!');
            
            console.log('✅ Dados completos no window.systemData:', completeData);
            return completeData;

        } else {
            throw new Error('Erro ao carregar dados');
        }

    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        showError('Erro ao carregar dados do servidor');
        throw error;
    }
}

// ==================== EXPORTAÇÃO GLOBAL ====================

window.applyJSON = applyJSON;
window.saveData = saveData;
window.loadData = loadData;

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🔄 DOM carregado, inicializando...');
    
    // Adicionar listener para debug
    window.addEventListener('dataLoaded', function (event) {
        console.log('🎯 EVENTO dataLoaded recebido no json-utils.js');
        console.log('🎯 Dados:', event.detail);
        console.log('🎯 Tem banco_equipamentos?', 'banco_equipamentos' in event.detail);
        console.log('🎯 banco_equipamentos:', event.detail.banco_equipamentos);
    });

    // Inicializar editor após um delay
    setTimeout(() => {
        console.log('⏰ Inicializando editor JSON...');
        initJSONEditor();
    }, 300);
});