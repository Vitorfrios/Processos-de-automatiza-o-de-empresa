import { escapeHtml } from '../config/ui.js';
import { showError, showSuccess, showWarning } from '../config/ui.js';

// Estado de staging (JSON a ser aplicado)
window.stagingData = null;
window.hasPendingChanges = false;

// Função para exportar JSON (existente)
export function exportToJSON() {
    try {
        const systemData = window.systemData || {};
        const dataStr = JSON.stringify(systemData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `sistema_dados_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        showSuccess('JSON exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar JSON:', error);
        showError('Erro ao exportar JSON.');
    }
}

// Função para importar JSON (existente - mas modificada)
export function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar estrutura básica
            const validation = validateJSONStructure(importedData);
            
            if (!validation.valid) {
                throw new Error(validation.errors.join('; '));
            }
            
            // Armazenar em staging, NÃO aplicar ainda
            window.stagingData = importedData;
            window.hasPendingChanges = true;
            
            // Exibir no editor JSON Bruto
            const editor = document.getElementById('jsonEditor');
            if (editor) {
                editor.value = JSON.stringify(importedData, null, 2);
                // Mudar para a tab JSON Bruto
                switchTab('raw');
            }
            
            // Mostrar mensagem de staging
            showWarning('JSON carregado na área de staging. Clique em "Aplicar JSON" para confirmar as alterações.');
            updateJSONStatus('JSON carregado em staging. Aguardando aplicação.', 'warning');
            
            // Atualizar status do botão Aplicar
            updateApplyButtonState();
            
        } catch (error) {
            console.error('Erro ao importar JSON:', error);
            showError(`Erro ao importar JSON: ${error.message}`);
            updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
        }
    };
    
    reader.onerror = function() {
        showError('Erro ao ler o arquivo.');
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// NOVA FUNÇÃO: Importar Excel
export async function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        return;
    }
    
    showWarning('Convertendo Excel para JSON...');
    
    try {
        // Converter arquivo para base64
        const base64File = await fileToBase64(file);
        
        // Enviar para API Python
        const response = await fetch('/api/excel/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: file.name,
                file: base64File
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro na conversão: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro desconhecido na conversão');
        }
        
        // Armazenar em staging
        window.stagingData = result.data;
        window.hasPendingChanges = true;
        
        // Exibir no editor
        const editor = document.getElementById('jsonEditor');
        if (editor) {
            editor.value = JSON.stringify(result.data, null, 2);
            // Mudar para a tab JSON Bruto
            switchTab('raw');
        }
        
        showSuccess('Excel convertido para JSON com sucesso!');
        updateJSONStatus('✅ Excel convertido. Dados em staging.', 'success');
        
        // Atualizar botão Aplicar
        updateApplyButtonState();
        
    } catch (error) {
        console.error('Erro ao importar Excel:', error);
        showError(`Erro ao importar Excel: ${error.message}`);
        updateJSONStatus(`❌ Erro na conversão: ${error.message}`, 'error');
    }
    
    event.target.value = '';
}

// NOVA FUNÇÃO: Exportar para Excel
export async function exportToExcel() {
    try {
        const systemData = window.systemData || {};
        
        // Validar dados antes de exportar
        const validation = validateJSONStructure(systemData);
        if (!validation.valid) {
            showError('Dados do sistema inválidos para exportação');
            return;
        }
        
        showWarning('Gerando arquivo Excel...');
        
        // Enviar dados para API Python
        const response = await fetch('/api/excel/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(systemData)
        });
        
        if (!response.ok) {
            throw new Error(`Erro na geração: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro desconhecido na geração');
        }
        
        // Decodificar base64 e fazer download
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'sistema_export.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSuccess('Excel exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        showError(`Erro ao exportar Excel: ${error.message}`);
    }
}

// NOVA FUNÇÃO: Aplicar JSON (botão da tab JSON Bruto)
export async function applyJSON() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) {
        showError('Editor JSON não encontrado');
        return;
    }
    
    try {
        // Validar JSON no editor
        const proposedData = JSON.parse(editor.value);
        const validation = validateJSONStructure(proposedData);
        
        if (!validation.valid) {
            showError('JSON inválido. Corrija os erros antes de aplicar.');
            updateJSONStatus(`❌ JSON inválido: ${validation.errors.join(', ')}`, 'error');
            return;
        }
        
        // Se há dados atuais, pedir confirmação
        const currentData = window.systemData || {};
        const hasCurrentData = Object.keys(currentData).length > 0;
        
        if (hasCurrentData) {
            // Comparar para mostrar resumo
            const comparison = await compareJSONData(currentData, proposedData);
            
            if (!comparison.summary.has_changes) {
                showWarning('Nenhuma alteração detectada entre os dados atuais e propostos.');
                return;
            }
            
            // Mostrar modal de confirmação com resumo
            const confirmed = await showJsonConfirmationModal(comparison);
            
            if (!confirmed) {
                showWarning('Aplicação cancelada pelo usuário.');
                return;
            }
            
            // Aplicar mudanças incrementalmente
            const applied = applyChangesIncremental(currentData, proposedData, comparison.differences);
            
            if (applied) {
                window.systemData = currentData; // Atualizar estado global
                window.stagingData = null;
                window.hasPendingChanges = false;
                
                // Salvar no servidor
                await saveSystemData(currentData);
                
                // Disparar evento de dados aplicados
                window.dispatchEvent(new CustomEvent('dataApplied', { 
                    detail: { data: currentData, changes: comparison.differences }
                }));
                
                // Atualizar UI de todas as tabs
                updateAllTabsUI();
                
                showSuccess('JSON aplicado com sucesso!');
                updateJSONStatus('✅ JSON aplicado ao sistema.', 'success');
                updateApplyButtonState();
            }
        } else {
            // Primeira carga, aplicar tudo
            window.systemData = proposedData;
            window.stagingData = null;
            window.hasPendingChanges = false;
            
            // Salvar no servidor
            await saveSystemData(proposedData);
            
            // Disparar eventos
            window.dispatchEvent(new CustomEvent('dataImported', { 
                detail: proposedData 
            }));
            
            // Atualizar UI
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

// Função auxiliar para salvar dados no servidor
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

// Função auxiliar para atualizar todas as tabs
function updateAllTabsUI() {
    if (window.loadConstants) window.loadConstants();
    if (window.loadMachines) window.loadMachines();
    if (window.loadMaterials) window.loadMaterials();
    if (window.loadEmpresas) window.loadEmpresas();
    if (window.populateMachineFilter) window.populateMachineFilter();
    if (window.loadJSONEditor) window.loadJSONEditor();
}

// Funções auxiliares
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
        // Fallback: comparação local simples
        return performLocalComparison(current, proposed);
    }
}

function performLocalComparison(current, proposed) {
    // Implementação simplificada para fallback
    const differences = {
        constants: { added: [], modified: [], removed: [] },
        machines: { added: [], modified: [], removed: [] },
        materials: { added: [], modified: [], removed: [] },
        empresas: { added: [], modified: [], removed: [] }
    };
    
    // Comparação básica de constants
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
    
    // Calcular totais
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

function applyChangesIncremental(current, proposed, differences) {
    try {
        // Garantir que as seções existam
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
        // NOTA: Não removemos constants por padrão (política conservadora)
        
        // Aplicar machines (por type)
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
        
        // Aplicar empresas (política: mesclar, não substituir)
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

async function showJsonConfirmationModal(comparison) {
    return new Promise((resolve) => {
        // Usar o modal existente
        const modal = document.getElementById('confirmationModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        if (!modal || !modalTitle || !modalMessage) {
            // Fallback: confirm simples
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
        
        // Configurar modal
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
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        // Substituir temporariamente a função de callback
        const originalCallback = window.confirmCallback;
        
        window.confirmCallback = function() {
            // Restaurar callback original
            window.confirmCallback = originalCallback;
            modal.style.display = 'none';
            resolve(true);
        };
        
        // Adicionar listener para cancelamento
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

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remover prefixo data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

function updateApplyButtonState() {
    const applyButton = document.querySelector('button[onclick="applyJSON()"]');
    if (applyButton) {
        if (window.hasPendingChanges) {
            applyButton.disabled = false;
            applyButton.style.opacity = '1';
            applyButton.style.cursor = 'pointer';
            applyButton.innerHTML = '<i class="icon-check"></i> Aplicar JSON';
        } else {
            applyButton.disabled = true;
            applyButton.style.opacity = '0.5';
            applyButton.style.cursor = 'not-allowed';
            applyButton.innerHTML = '<i class="icon-check"></i> Nada para aplicar';
        }
    }
}

// Função para mudar de tab (deve estar disponível globalmente)
function switchTab(tabName) {
    // Esta função deve estar implementada no seu sistema
    if (typeof window.switchTab === 'function') {
        window.switchTab(tabName);
    }
}

// Funções de formatação e validação (existentes)
export function formatJSON() {
    const editor = document.getElementById('jsonEditor');
    try {
        const parsed = JSON.parse(editor.value);
        editor.value = JSON.stringify(parsed, null, 2);
        updateJSONStatus('JSON formatado com sucesso', 'success');
    } catch (error) {
        updateJSONStatus(`Erro de formatação: ${error.message}`, 'error');
    }
}

export function validateJSON() {
    const editor = document.getElementById('jsonEditor');
    try {
        const parsed = JSON.parse(editor.value);
        
        const validation = validateJSONStructure(parsed);
        
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        
        // Validação adicional
        const requiredKeys = ['constants', 'machines', 'materials', 'empresas'];
        const missingKeys = requiredKeys.filter(key => !(key in parsed));
        
        if (missingKeys.length > 0) {
            throw new Error(`Campos ausentes: ${missingKeys.join(', ')}`);
        }
        
        if (typeof parsed.constants !== 'object') {
            throw new Error('constants deve ser um objeto');
        }
        if (!Array.isArray(parsed.machines)) {
            throw new Error('machines deve ser um array');
        }
        if (typeof parsed.materials !== 'object') {
            throw new Error('materials deve ser um objeto');
        }
        if (!Array.isArray(parsed.empresas)) {
            throw new Error('empresas deve ser um array');
        }
        
        updateJSONStatus('✅ JSON válido e com estrutura correta', 'success');
        return true;
        
    } catch (error) {
        updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
        return false;
    }
}

function updateJSONStatus(message, type) {
    const status = document.getElementById('jsonStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = 'json-status-message';
    
    // Classes CSS devem existir no seu edit_data.css
    status.classList.remove('success', 'error', 'warning', 'info');
    
    switch (type) {
        case 'success':
            status.classList.add('success');
            break;
        case 'error':
            status.classList.add('error');
            break;
        case 'warning':
            status.classList.add('warning');
            break;
        case 'info':
            status.classList.add('info');
            break;
        default:
            status.classList.add('info');
    }
}

// Função para salvar dados (integrando com o sistema existente)
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

// Função para carregar dados (integrando com o sistema existente)
export async function loadData() {
    try {
        const response = await fetch('/api/system-data');
        
        if (response.ok) {
            const data = await response.json();
            window.systemData = data;
            
            // Disparar evento de dados carregados
            window.dispatchEvent(new CustomEvent('dataLoaded', { 
                detail: data 
            }));
            
            // Limpar staging
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

// Exportar funções globalmente
window.exportToJSON = exportToJSON;
window.importFromJSON = importFromJSON;
window.importFromExcel = importFromExcel;
window.exportToExcel = exportToExcel;
window.applyJSON = applyJSON;
window.formatJSON = formatJSON;
window.validateJSON = validateJSON;
window.saveData = saveData;
window.loadData = loadData;