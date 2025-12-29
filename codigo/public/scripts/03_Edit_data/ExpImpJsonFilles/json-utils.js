/* ==== INÍCIO: json-utils.js ==== */
// json-utils.js - Arquivo principal que coordena tudo (CORRIGIDO COM DUTOS COMO ARRAY)

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Garante estrutura completa dos dados (CORRIGIDA - DUTOS COMO ARRAY)
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
        banco_equipamentos: data.banco_equipamentos || {},
        dutos: data.dutos || []  // CORRIGIDO: array vazio
    };
}

/**
 * Cria dados padrão com estrutura completa (CORRIGIDA - DUTOS COMO ARRAY)
 */
function createDefaultData() {
    return {
        constants: {},
        machines: [],
        materials: {},
        empresas: [],
        banco_equipamentos: {},
        dutos: []  // CORRIGIDO: array vazio
    };
}

/**
 * Valida e garante que os dados tenham estrutura completa
 */
function validateAndEnsureCompleteData(data) {
    const result = ensureCompleteData(data);
    
    // Log para debug
    console.log('🔍 Validando dados:', {
        constants: Object.keys(result.constants).length,
        machines: result.machines.length,
        materials: Object.keys(result.materials).length,
        empresas: result.empresas.length,
        banco_equipamentos: Object.keys(result.banco_equipamentos).length,
        dutos: result.dutos.length  // CORRIGIDO
    });
    
    return result;
}

// ==================== FUNÇÃO APLICAR JSON ====================

export async function applyJSON() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) {
        if (window.showError) window.showError('Editor JSON não encontrado');
        return;
    }

    try {
        const proposedData = JSON.parse(editor.value);
        
        // Usar a função de validação do json-editor.js
        let validation;
        if (window.validateJSONStructure) {
            validation = window.validateJSONStructure(proposedData);
        } else {
            // Fallback básico
            validation = {
                valid: true,
                errors: []
            };
        }

        if (!validation.valid) {
            if (window.showError) window.showError('JSON inválido. Corrija os erros antes de aplicar.');
            if (window.updateJSONStatus) window.updateJSONStatus(`❌ JSON inválido: ${validation.errors.join(', ')}`, 'error');
            return;
        }

        const currentData = window.systemData || {};
        const hasCurrentData = Object.keys(currentData).length > 0;

        if (hasCurrentData) {
            const comparison = await compareJSONData(currentData, proposedData);

            if (!comparison.summary.has_changes) {
                if (window.showWarning) window.showWarning('Nenhuma alteração detectada.');
                return;
            }

            const confirmed = await showJsonConfirmationModal(comparison);

            if (!confirmed) {
                if (window.showWarning) window.showWarning('Aplicação cancelada.');
                return;
            }

            const applied = applyChangesIncremental(currentData, proposedData, comparison.differences);

            if (applied) {
                // ✅ GARANTIR ESTRUTURA COMPLETA
                const completeData = validateAndEnsureCompleteData(currentData);
                
                window.systemData = completeData;
                window.stagingData = null;
                window.hasPendingChanges = false;

                await saveSystemData(completeData);

                window.dispatchEvent(new CustomEvent('dataApplied', {
                    detail: { data: completeData, changes: comparison.differences }
                }));

                updateAllTabsUI();
                editor.value = JSON.stringify(completeData, null, 2);
                
                if (window.showSuccess) window.showSuccess('JSON aplicado com sucesso!');
                if (window.updateJSONStatus) window.updateJSONStatus('✅ JSON aplicado ao sistema.', 'success');
                if (window.updateApplyButtonState) window.updateApplyButtonState();
            }
        } else {
            // ✅ GARANTIR ESTRUTURA COMPLETA
            const completeProposedData = validateAndEnsureCompleteData(proposedData);
            
            window.systemData = completeProposedData;
            window.stagingData = null;
            window.hasPendingChanges = false;

            await saveSystemData(completeProposedData);

            window.dispatchEvent(new CustomEvent('dataImported', {
                detail: completeProposedData
            }));

            updateAllTabsUI();

            if (window.showSuccess) window.showSuccess('JSON aplicado com sucesso!');
            if (window.updateJSONStatus) window.updateJSONStatus('✅ JSON aplicado ao sistema.', 'success');
            if (window.updateApplyButtonState) window.updateApplyButtonState();
        }

    } catch (error) {
        console.error('Erro ao aplicar JSON:', error);
        if (window.showError) window.showError(`Erro ao aplicar JSON: ${error.message}`);
        if (window.updateJSONStatus) window.updateJSONStatus(`❌ Erro na aplicação: ${error.message}`, 'error');
    }
}

// ==================== FUNÇÕES RESTANTES ====================

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
        if (window.showError) window.showError('Erro ao salvar dados no servidor. Alterações aplicadas apenas localmente.');
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
    if (window.loadDutos) window.loadDutos();
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
        banco_equipamentos: { added: [], modified: [], removed: [] },
        dutos: { added: [], modified: [], removed: [] }  // CORRIGIDO: array
    };

    // Comparar constants
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

    // Comparar banco_equipamentos
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

    // ✅ CORRIGIDO: Comparar dutos como array
    const currentDutos = current.dutos || [];
    const proposedDutos = proposed.dutos || [];
    
    for (const duto of proposedDutos) {
        const currentDuto = currentDutos.find(d => d.type === duto.type);
        if (!currentDuto) {
            differences.dutos.added.push(duto.type);
        } else if (JSON.stringify(currentDuto) !== JSON.stringify(duto)) {
            differences.dutos.modified.push(duto.type);
        }
    }
    
    for (const duto of currentDutos) {
        if (!proposedDutos.some(d => d.type === duto.type)) {
            differences.dutos.removed.push(duto.type);
        }
    }

    // Calcular totais
    const totalAdded =
        differences.constants.added.length +
        differences.machines.added.length +
        differences.materials.added.length +
        differences.empresas.added.length +
        differences.banco_equipamentos.added.length +
        differences.dutos.added.length;

    const totalModified =
        differences.constants.modified.length +
        differences.machines.modified.length +
        differences.materials.modified.length +
        differences.empresas.modified.length +
        differences.banco_equipamentos.modified.length +
        differences.dutos.modified.length;

    const totalRemoved =
        differences.constants.removed.length +
        differences.machines.removed.length +
        differences.materials.removed.length +
        differences.empresas.removed.length +
        differences.banco_equipamentos.removed.length +
        differences.dutos.removed.length;

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
        if (!current.dutos) current.dutos = [];  // CORRIGIDO: array vazio

        // Aplicar constants
        for (const added of differences.constants.added) {
            current.constants[added] = proposed.constants[added];
        }
        for (const modified of differences.constants.modified) {
            current.constants[modified] = proposed.constants[modified];
        }

        // Aplicar banco_equipamentos
        for (const added of differences.banco_equipamentos.added) {
            current.banco_equipamentos[added] = proposed.banco_equipamentos[added];
        }

        for (const modified of differences.banco_equipamentos.modified) {
            current.banco_equipamentos[modified] = proposed.banco_equipamentos[modified];
        }

        // ✅ CORRIGIDO: Aplicar dutos como array
        for (const added of differences.dutos.added) {
            const newDuto = proposed.dutos.find(d => d.type === added);
            if (newDuto) {
                current.dutos.push(newDuto);
            }
        }
        
        for (const modified of differences.dutos.modified) {
            const updatedDuto = proposed.dutos.find(d => d.type === modified);
            const index = current.dutos.findIndex(d => d.type === modified);
            if (index !== -1 && updatedDuto) {
                current.dutos[index] = updatedDuto;
            }
        }

        // Remover dutos que foram removidos
        for (const removed of differences.dutos.removed) {
            const index = current.dutos.findIndex(d => d.type === removed);
            if (index !== -1) {
                current.dutos.splice(index, 1);
            }
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
                <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                    <h5 style="margin: 0 0 5px 0;">Detalhes por categoria:</h5>
                    ${comparison.differences.dutos.added.length > 0 ? 
                        `<p><strong>Dutos adicionados:</strong> ${comparison.differences.dutos.added.length}</p>` : ''}
                    ${comparison.differences.dutos.modified.length > 0 ? 
                        `<p><strong>Dutos modificados:</strong> ${comparison.differences.dutos.modified.length}</p>` : ''}
                    ${comparison.differences.dutos.removed.length > 0 ? 
                        `<p><strong>Dutos removidos:</strong> ${comparison.differences.dutos.removed.length}</p>` : ''}
                </div>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                    <i class="icon-info"></i> Os itens removidos serão excluídos do sistema.
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
            if (window.showError) window.showError('Nenhum dado para salvar');
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
            if (window.showSuccess) window.showSuccess('Dados salvos com sucesso!');
        } else {
            throw new Error('Erro ao salvar dados');
        }

    } catch (error) {
        console.error('Erro ao salvar:', error);
        if (window.showError) window.showError('Erro ao salvar dados');
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
                banco_equipamentos: Object.keys(data.banco_equipamentos || {}).length,
                dutos: data.dutos?.length || 0  // CORRIGIDO
            });
            
            // ✅ GARANTIR ESTRUTURA COMPLETA
            const completeData = validateAndEnsureCompleteData(data);
            
            window.systemData = completeData;

            window.dispatchEvent(new CustomEvent('dataLoaded', {
                detail: completeData
            }));

            window.stagingData = null;
            window.hasPendingChanges = false;
            if (window.updateApplyButtonState) window.updateApplyButtonState();

            if (window.showSuccess) window.showSuccess('Dados carregados com sucesso!');
            
            console.log('✅ Dados completos no window.systemData:', {
                dutos: completeData.dutos
            });
            return completeData;

        } else {
            throw new Error('Erro ao carregar dados');
        }

    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        if (window.showError) window.showError('Erro ao carregar dados do servidor');
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
        console.log('🎯 Dutos:', event.detail.dutos);
        console.log('🎯 Dutos é array?', Array.isArray(event.detail.dutos));
        console.log('🎯 Número de dutos:', event.detail.dutos?.length || 0);
    });

    // Inicializar editor após um delay
    setTimeout(() => {
        console.log('⏰ Inicializando editor JSON...');
        if (window.initJSONEditor) {
            window.initJSONEditor();
        }
    }, 300);
});

// ==================== FUNÇÕES DE UTILIDADE ====================

/**
 * Função para converter dutos de formato antigo para novo
 * Útil para migração de dados existentes
 */
export function convertDutosToArrayFormat(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    // Se dutos já é array, retorna como está
    if (Array.isArray(data.dutos)) {
        return data;
    }
    
    // Se dutos é objeto com 'tipos' e 'opcionais', converter para array
    if (data.dutos && typeof data.dutos === 'object') {
        const oldFormat = data.dutos;
        const newDutosArray = [];
        
        // Converter tipos
        if (oldFormat.tipos && Array.isArray(oldFormat.tipos)) {
            newDutosArray.push(...oldFormat.tipos);
        }
        
        // Se não houver tipos, mas houver opcionais, criar array vazio
        if (!oldFormat.tipos && oldFormat.opcionais) {
            // Aqui você pode implementar lógica específica para sua migração
            console.log('⚠️  Convertendo formato antigo de dutos para array');
        }
        
        data.dutos = newDutosArray;
    }
    
    return data;
}

// Exportar a função de conversão globalmente
window.convertDutosToArrayFormat = convertDutosToArrayFormat;

/* ==== FIM: json-utils.js ==== */