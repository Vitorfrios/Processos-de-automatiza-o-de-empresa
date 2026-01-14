/* ==== INÍCIO: json-utils.js (REMOVIDO IMPORT/EXPORT) ==== */
// json-utils.js - Arquivo principal que coordena tudo (SEM FUNÇÕES DE IMPORT/EXPORT)

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Garante estrutura completa dos dados (COM TUBOS)
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
        dutos: data.dutos || [],   // Array de dutos
        tubos: data.tubos || []    // Array de tubos
    };
}

/**
 * Cria dados padrão com estrutura completa (COM TUBOS)
 */
function createDefaultData() {
    return {
        constants: {},
        machines: [],
        materials: {},
        empresas: [],
        banco_equipamentos: {},
        dutos: [],   // Array vazio
        tubos: []    // Array vazio
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
        dutos: result.dutos.length,
        tubos: result.tubos.length  // ✅ Adicionado tubos
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
    if (window.loadTubos) window.loadTubos();  // ✅ Adicionado tubos
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
        dutos: { added: [], modified: [], removed: [] },
        tubos: { added: [], modified: [], removed: [] }  // ✅ Adicionado tubos
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

    // Comparar dutos como array
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

    // ✅ Comparar tubos como array
    const currentTubos = current.tubos || [];
    const proposedTubos = proposed.tubos || [];
    
    for (const tubo of proposedTubos) {
        const currentTubo = currentTubos.find(t => t.polegadas === tubo.polegadas);
        if (!currentTubo) {
            differences.tubos.added.push(tubo.polegadas);
        } else if (JSON.stringify(currentTubo) !== JSON.stringify(tubo)) {
            differences.tubos.modified.push(tubo.polegadas);
        }
    }
    
    for (const tubo of currentTubos) {
        if (!proposedTubos.some(t => t.polegadas === tubo.polegadas)) {
            differences.tubos.removed.push(tubo.polegadas);
        }
    }

    // Calcular totais
    const totalAdded =
        differences.constants.added.length +
        differences.machines.added.length +
        differences.materials.added.length +
        differences.empresas.added.length +
        differences.banco_equipamentos.added.length +
        differences.dutos.added.length +
        differences.tubos.added.length;  // ✅ Adicionado tubos

    const totalModified =
        differences.constants.modified.length +
        differences.machines.modified.length +
        differences.materials.modified.length +
        differences.empresas.modified.length +
        differences.banco_equipamentos.modified.length +
        differences.dutos.modified.length +
        differences.tubos.modified.length;  // ✅ Adicionado tubos

    const totalRemoved =
        differences.constants.removed.length +
        differences.machines.removed.length +
        differences.materials.removed.length +
        differences.empresas.removed.length +
        differences.banco_equipamentos.removed.length +
        differences.dutos.removed.length +
        differences.tubos.removed.length;  // ✅ Adicionado tubos

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
        if (!current.dutos) current.dutos = [];
        if (!current.tubos) current.tubos = [];  // ✅ Adicionado tubos

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

        // Aplicar dutos como array
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

        // ✅ Aplicar tubos como array
        for (const added of differences.tubos.added) {
            const newTubo = proposed.tubos.find(t => t.polegadas === added);
            if (newTubo) {
                current.tubos.push(newTubo);
            }
        }
        
        for (const modified of differences.tubos.modified) {
            const updatedTubo = proposed.tubos.find(t => t.polegadas === modified);
            const index = current.tubos.findIndex(t => t.polegadas === modified);
            if (index !== -1 && updatedTubo) {
                current.tubos[index] = updatedTubo;
            }
        }

        // Remover tubos que foram removidos
        for (const removed of differences.tubos.removed) {
            const index = current.tubos.findIndex(t => t.polegadas === removed);
            if (index !== -1) {
                current.tubos.splice(index, 1);
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
                `Adicionados: ${comparison.summary?.total_added || 0}\n` +
                `Modificados: ${comparison.summary?.total_modified || 0}\n` +
                `Removidos: ${comparison.summary?.total_removed || 0}\n\n` +
                `Total: ${comparison.summary?.total_changes || 0} alterações`
            );
            resolve(confirmed);
            return;
        }

        // Garantir que os dados existem
        const differences = comparison.differences || {};
        const categories = {
            constants: differences.constants || { added: [], modified: [], removed: [] },
            machines: differences.machines || { added: [], modified: [], removed: [] },
            materials: differences.materials || { added: [], modified: [], removed: [] },
            empresas: differences.empresas || { added: [], modified: [], removed: [] },
            banco_equipamentos: differences.banco_equipamentos || { added: [], modified: [], removed: [] },
            dutos: differences.dutos || { added: [], modified: [], removed: [] },
            tubos: differences.tubos || { added: [], modified: [], removed: [] }
        };

        const totalAdded = Object.values(categories).reduce((sum, cat) => sum + (cat.added?.length || 0), 0);
        const totalModified = Object.values(categories).reduce((sum, cat) => sum + (cat.modified?.length || 0), 0);
        const totalRemoved = Object.values(categories).reduce((sum, cat) => sum + (cat.removed?.length || 0), 0);
        const totalChanges = totalAdded + totalModified + totalRemoved;
        const hasChanges = totalChanges > 0;

        modalTitle.textContent = 'Resumo de Alterações';

        let messageHtml = `
            <div class="simple-summary">
                <!-- Status -->
                <div class="status-banner ${hasChanges ? 'has-changes' : 'no-changes'}">
                    <span class="status-icon">${hasChanges ? '📝' : '✅'}</span>
                    <span class="status-text">
                        ${hasChanges ? `${totalChanges} alteração${totalChanges !== 1 ? 'ões' : ''} encontrada${totalChanges !== 1 ? 's' : ''}` : 'Nenhuma alteração'}
                    </span>
                </div>

                <!-- Métricas horizontais -->
                <div class="metrics-row">
                    <div class="metric-box ${totalAdded > 0 ? 'active' : ''}">
                        <div class="metric-number">${totalAdded}</div>
                        <div class="metric-label">Adições</div>
                    </div>
                    <div class="metric-box ${totalModified > 0 ? 'active' : ''}">
                        <div class="metric-number">${totalModified}</div>
                        <div class="metric-label">Modificações</div>
                    </div>
                    <div class="metric-box ${totalRemoved > 0 ? 'active' : ''}">
                        <div class="metric-number">${totalRemoved}</div>
                        <div class="metric-label">Exclusões</div>
                    </div>
                </div>

                <!-- Detalhes -->
                <div class="details-panel">
                    <div class="details-header">
                        <h4>Detalhamento por Categoria</h4>
                        <div class="header-actions">
                            <button class="action-btn" onclick="expandAllDetails()">Expandir</button>
                            <button class="action-btn" onclick="collapseAllDetails()">Recolher</button>
                        </div>
                    </div>
                    
                    <div class="categories-list">
        `;

        // Função para obter detalhes específicos das modificações
        const getChangeDetails = (categoryName, itemName) => {
            if (categoryName === 'Constantes' && window.systemData?.constants && window.stagingData?.constants) {
                const current = window.systemData.constants[itemName];
                const proposed = window.stagingData.constants[itemName];
                
                if (current && proposed) {
                    const changes = [];
                    
                    if (current.value !== proposed.value) {
                        changes.push(`<strong>valor:</strong> ${current.value} → ${proposed.value}`);
                    }
                    
                    if (current.description !== proposed.description) {
                        changes.push(`<strong>descrição:</strong> "${current.description}" → "${proposed.description}"`);
                    }
                    
                    if (changes.length > 0) {
                        return `<div class="change-details">${changes.join('<br>')}</div>`;
                    }
                }
            }
            return '';
        };

        // Gerar categorias
        Object.entries({
            'Constantes': categories.constants,
            'Máquinas': categories.machines,
            'Materiais': categories.materials,
            'Empresas': categories.empresas,
            'Equipamentos': categories.banco_equipamentos,
            'Dutos': categories.dutos,
            'Tubos': categories.tubos
        }).forEach(([name, data]) => {
            const added = data.added || [];
            const modified = data.modified || [];
            const removed = data.removed || [];
            const total = added.length + modified.length + removed.length;
            
            if (total === 0) return;

            const categoryId = name.toLowerCase().replace(/\s+/g, '-');
            
            messageHtml += `
                <div class="category-item" data-category="${categoryId}">
                    <div class="category-header" onclick="toggleCategory('${categoryId}')">
                        <div class="category-info">
                            <span class="category-name">${name}</span>
                            <div class="category-badges">
                                ${added.length > 0 ? `<span class="badge add">+${added.length}</span>` : ''}
                                ${modified.length > 0 ? `<span class="badge mod">↻${modified.length}</span>` : ''}
                                ${removed.length > 0 ? `<span class="badge del">−${removed.length}</span>` : ''}
                            </div>
                        </div>
                        <span class="toggle-arrow">▼</span>
                    </div>
                    
                    <div class="category-content" id="content-${categoryId}">
                        ${added.length > 0 ? `
                            <div class="change-section add">
                                <div class="section-title">Novos itens (${added.length})</div>
                                <div class="items-grid">
                                    ${added.map(item => `
                                        <div class="item">${item}</div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${modified.length > 0 ? `
                            <div class="change-section mod">
                                <div class="section-title">Modificações (${modified.length})</div>
                                <div class="items-grid">
                                    ${modified.map(item => {
                                        const details = getChangeDetails(name, item);
                                        return `
                                            <div class="item modified">
                                                <div class="item-name">${item}</div>
                                                ${details}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${removed.length > 0 ? `
                            <div class="change-section del">
                                <div class="section-title">Remoções (${removed.length})</div>
                                <div class="items-grid">
                                    ${removed.map(item => `
                                        <div class="item removed">${item}</div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        messageHtml += `
                    </div>
                </div>

                <!-- Aviso -->
                ${totalRemoved > 0 ? `
                    <div class="warning-message">
                        ⚠️ <strong>Atenção:</strong> ${totalRemoved} item${totalRemoved !== 1 ? 'ns' : ''} será${totalRemoved !== 1 ? 'ão' : ''} permanentemente removido${totalRemoved !== 1 ? 's' : ''}.
                    </div>
                ` : ''}
            </div>
        `;

        modalMessage.innerHTML = messageHtml;
        modal.classList.add('active');
        modal.style.display = 'flex';

        // Funções de controle
        window.toggleCategory = function(categoryId) {
            const content = document.getElementById(`content-${categoryId}`);
            const arrow = content.closest('.category-item').querySelector('.toggle-arrow');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                arrow.textContent = '▲';
            } else {
                content.style.display = 'none';
                arrow.textContent = '▼';
            }
        };

        window.expandAllDetails = function() {
            document.querySelectorAll('.category-content').forEach(content => {
                content.style.display = 'block';
            });
            document.querySelectorAll('.toggle-arrow').forEach(arrow => {
                arrow.textContent = '▲';
            });
        };

        window.collapseAllDetails = function() {
            document.querySelectorAll('.category-content').forEach(content => {
                content.style.display = 'none';
            });
            document.querySelectorAll('.toggle-arrow').forEach(arrow => {
                arrow.textContent = '▼';
            });
        };

        // Configurar botões do modal
        const originalCallback = window.confirmCallback;
        window.confirmCallback = function () {
            window.confirmCallback = originalCallback;
            modal.classList.remove('active');
            modal.style.display = 'none';
            resolve(true);
        };

        const cancelButton = modal.querySelector('.btn-secondary, .btn-cancel');
        if (cancelButton) {
            cancelButton.onclick = function () {
                modal.classList.remove('active');
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
                dutos: data.dutos?.length || 0,
                tubos: data.tubos?.length || 0  // ✅ Adicionado tubos
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
                dutos: completeData.dutos,
                tubos: completeData.tubos  // ✅ Adicionado tubos
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
        console.log('🎯 Tubos:', event.detail.tubos);
        console.log('🎯 Tubos é array?', Array.isArray(event.detail.tubos));
        console.log('🎯 Número de tubos:', event.detail.tubos?.length || 0);
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
 * Função para converter dados de formato antigo para novo
 * Útil para migração de dados existentes
 */
export function convertToArrayFormat(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    // Converter dutos se necessário
    if (data.dutos && !Array.isArray(data.dutos)) {
        const oldFormat = data.dutos;
        const newDutosArray = [];
        
        if (oldFormat.tipos && Array.isArray(oldFormat.tipos)) {
            newDutosArray.push(...oldFormat.tipos);
        }
        
        data.dutos = newDutosArray;
    }
    
    // Converter tubos se necessário
    if (data.tubos && !Array.isArray(data.tubos)) {
        const oldFormat = data.tubos;
        const newTubosArray = [];
        
        if (oldFormat.tipos && Array.isArray(oldFormat.tipos)) {
            newTubosArray.push(...oldFormat.tipos);
        }
        
        data.tubos = newTubosArray;
    }
    
    return data;
}

// Exportar a função de conversão globalmente
window.convertToArrayFormat = convertToArrayFormat;

/* ==== FIM: json-utils.js ==== */