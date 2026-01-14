// scripts/03_Edit_data/core/tubos.js
// Gerenciamento de tubos - Versão simplificada

import { systemData, addPendingChange } from '../config/state.js';
import { escapeHtml, showError, showInfo, showWarning, showConfirmation } from '../config/ui.js';

// Variável para controlar alterações pendentes nos tubos
let pendingTuboChanges = [];

// ==================== FUNÇÕES PRINCIPAIS ====================

export function loadTubos() {
    const tbody = document.getElementById('tubosTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!systemData.tubos || !Array.isArray(systemData.tubos)) {
        systemData.tubos = [];
        return;
    }
    
    // Separar tubos existentes (com polegadas definidas) de novos tubos (sem polegadas)
    const tubosComPolegadas = systemData.tubos.filter(t => t.polegadas && t.polegadas.trim() !== '');
    const novosTubos = systemData.tubos.filter(t => !t.polegadas || t.polegadas.trim() === '');
    
    // Ordenar apenas os tubos com polegadas definidas
    const tubosOrdenados = [...tubosComPolegadas].sort((a, b) => {
        const aValue = parsePolegadas(a.polegadas);
        const bValue = parsePolegadas(b.polegadas);
        return aValue - bValue;
    });
    
    // Juntar os ordenados com os novos tubos (novos ficam no final)
    const todosTubos = [...tubosOrdenados, ...novosTubos];
    
    if (todosTubos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 30px;">
                    <div class="empty-state">
                        <i class="icon-tube" style="font-size: 48px; opacity: 0.5;"></i>
                        <h3>Nenhum tubo cadastrado</h3>
                        <p>Clique no botão abaixo para adicionar seu primeiro tubo.</p>
                        <button class="btn btn-success" onclick="addTubo()">
                            <i class="icon-add"></i> Adicionar Primeiro Tubo
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // DEBUG: Mostrar ordem de classificação
    console.log('📊 Tubos carregados:', todosTubos.map(t => ({
        polegadas: t.polegadas || '(vazio)',
        valorDecimal: t.polegadas ? parsePolegadas(t.polegadas) : 0,
        isNew: !t.polegadas || t.polegadas.trim() === ''
    })));
    
    todosTubos.forEach((tubo, displayIndex) => {
        // Encontrar índice original no array não ordenado
        const originalIndex = systemData.tubos.findIndex(t => 
            t.polegadas === tubo.polegadas && 
            t.mm === tubo.mm && 
            t.valor === tubo.valor
        );
        
        // Verifica se o tubo está marcado como modificado
        const isModified = pendingTuboChanges.some(change => {
            // Para novos tubos (sem originalData)
            if (!change.originalData && change.newData) {
                return change.newData.polegadas === tubo.polegadas &&
                       change.newData.mm === tubo.mm &&
                       change.newData.valor === tubo.valor;
            }
            // Para tubos existentes
            if (change.originalData) {
                return change.originalData.polegadas === tubo.polegadas ||
                       change.newData?.polegadas === tubo.polegadas;
            }
            return false;
        });
        
        const isNewTubo = !tubo.polegadas || tubo.polegadas.trim() === '';
        
        const row = document.createElement('tr');
        if (isModified) {
            row.style.backgroundColor = '#fff8e1';
        } else if (isNewTubo) {
            row.style.backgroundColor = '#f0f9ff';
        }
        
        const effectiveIndex = originalIndex >= 0 ? originalIndex : displayIndex;
        
        row.innerHTML = `
            <td>
                <input type="text" value="${escapeHtml(tubo.polegadas || '')}"
                       onchange="updateTuboField(${effectiveIndex}, 'polegadas', this.value)"
                       placeholder="Ex: 1/2, 3/4, 1 1/4"
                       class="form-input" style="width: 100px;"
                       ${isNewTubo ? 'style="width: 100px; border: 2px solid #4CAF50;"' : 'style="width: 100px;"'}>
            </td>
            <td>
                <input type="number" value="${tubo.mm || 0}"
                       onchange="updateTuboField(${effectiveIndex}, 'mm', parseFloat(this.value) || 0)"
                       placeholder="Milímetros"
                       class="form-input" style="width: 100px;" step="0.01">
            </td>
            <td>
                <input type="number" value="${tubo.valor || 0}"
                       onchange="updateTuboField(${effectiveIndex}, 'valor', parseFloat(this.value) || 0)"
                       placeholder="R$ 0.00"
                       class="form-input" style="width: 120px;" step="0.01">
            </td>
            <td class="actions-cell">
                <button class="btn btn-small btn-danger"
                        onclick="deleteTubo(${effectiveIndex}, '${escapeHtml(tubo.polegadas || 'Novo tubo')}')"
                        title="Excluir tubo">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Botão para adicionar novo tubo com botão de cancelar
    const addRow = document.createElement('tr');
    addRow.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 20px;">
            <button class="btn btn-success" onclick="addTubo()">
                <i class="icon-add"></i> Adicionar Novo Tubo
            </button>
            ${pendingTuboChanges.length > 0 ? `
                <button class="btn btn-warning btn-sm" onclick="resetTuboChanges()" style="margin-left: 10px;">
                    <i class="icon-refresh"></i> Cancelar Alterações
                </button>
            ` : ''}
        </td>
    `;
    tbody.appendChild(addRow);
}

export function addTubo() {
    try {
        // Adiciona novo tubo com valores padrão AO FINAL da lista
        const novoTubo = {
            polegadas: "",
            mm: 0,
            valor: 0
        };
        
        systemData.tubos.push(novoTubo);
        
        // Marca como nova adição pendente
        pendingTuboChanges.push({
            originalData: null, // null indica novo tubo
            newData: { ...novoTubo },
            action: 'add'
        });
        
        loadTubos();
        addPendingChange('tubos');
        showInfo('Novo tubo adicionado. Preencha as polegadas para organizar.');
        
        // Foca no campo de polegadas do novo tubo
        setTimeout(() => {
            const rows = document.querySelectorAll('#tubosTableBody tr');
            if (rows.length >= 2) {
                // Novo tubo está na penúltima linha
                const newRow = rows[rows.length - 2];
                const input = newRow.querySelector('input[type="text"]');
                if (input) {
                    input.focus();
                    newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 100);
        
    } catch (error) {
        console.error('Erro ao adicionar tubo:', error);
        showError(`Erro ao adicionar tubo: ${error.message}`);
    }
}

export function updateTuboField(index, field, value) {
    if (!systemData.tubos[index]) return;
    
    try {
        const originalTubo = { ...systemData.tubos[index] };
        systemData.tubos[index][field] = value;
        const updatedTubo = { ...systemData.tubos[index] };
        
        // Verifica se já existe uma alteração pendente para este tubo
        const existingChangeIndex = pendingTuboChanges.findIndex(change => {
            // Para tubos existentes
            if (change.originalData && change.originalData.polegadas === originalTubo.polegadas) {
                return true;
            }
            // Para novos tubos
            if (!change.originalData && change.newData?.polegadas === originalTubo.polegadas) {
                return true;
            }
            return false;
        });
        
        if (existingChangeIndex >= 0) {
            // Atualiza alteração existente
            pendingTuboChanges[existingChangeIndex].newData = updatedTubo;
            if (!pendingTuboChanges[existingChangeIndex].action) {
                pendingTuboChanges[existingChangeIndex].action = originalTubo.polegadas ? 'update' : 'add';
            }
        } else {
            // Cria nova alteração
            pendingTuboChanges.push({
                originalData: originalTubo.polegadas ? originalTubo : null,
                newData: updatedTubo,
                action: originalTubo.polegadas ? 'update' : 'add'
            });
        }
        
        // Se o usuário preencheu as polegadas de um novo tubo, reorganiza
        if (field === 'polegadas' && value && value.trim() !== '') {
            // Chama loadTubos novamente para reorganizar
            setTimeout(() => {
                loadTubos();
            }, 100);
        } else {
            // Atualiza a visualização apenas para esse campo
            const row = document.querySelector(`#tubosTableBody tr:nth-child(${index + 1})`);
            if (row) {
                row.style.backgroundColor = '#e8f4fd';
                setTimeout(() => {
                    row.style.backgroundColor = '';
                }, 500);
            }
        }
        
        addPendingChange('tubos');
        
    } catch (error) {
        console.error('Erro ao atualizar campo do tubo:', error);
        showError(`Erro ao atualizar campo: ${error.message}`);
    }
}

// ==================== FUNÇÃO PARA CONVERTER POLEGADAS ====================

function parsePolegadas(polegadasStr) {
    if (!polegadasStr) return 0;
    
    try {
        let str = polegadasStr.toString().trim();
        
        // Remove " (aspas) se existir
        str = str.replace(/["]/g, '');
        
        // Caso especial: "1.3/8" - interpretar como "1 3/8" (um inteiro e três oitavos)
        if (str.includes('.') && str.includes('/')) {
            // Substitui o ponto por espaço para facilitar parsing
            str = str.replace('.', ' ');
        }
        
        // Se contém espaço e fração (ex: "1 1/4" ou "1 3/8")
        if (str.includes(' ') && str.includes('/')) {
            const parts = str.split(' ');
            if (parts.length === 2) {
                const integer = parseFloat(parts[0]) || 0;
                const fractionParts = parts[1].split('/');
                if (fractionParts.length === 2) {
                    const numerator = parseFloat(fractionParts[0]) || 0;
                    const denominator = parseFloat(fractionParts[1]) || 1;
                    return integer + (numerator / denominator);
                }
            }
        }
        
        // Se é apenas fração (ex: "1/2")
        if (str.includes('/') && !str.includes(' ')) {
            const fractionParts = str.split('/');
            if (fractionParts.length === 2) {
                const numerator = parseFloat(fractionParts[0]) || 0;
                const denominator = parseFloat(fractionParts[1]) || 1;
                return numerator / denominator;
            }
        }
        
        // Se é número decimal (ex: "1.5")
        if (str.includes('.') && !str.includes('/')) {
            return parseFloat(str) || 0;
        }
        
        // Se é número inteiro (ex: "1")
        return parseFloat(str) || 0;
        
    } catch (e) {
        console.warn('❌ Erro ao converter polegadas:', polegadasStr, e);
        return 0;
    }
}

// ==================== FUNÇÕES RESTANTES (MANTIDAS) ====================

export async function deleteTubo(index, polegadas) {
    showConfirmation(`Deseja excluir o tubo de ${polegadas || 'tamanho desconhecido'}?`, async () => {
        try {
            if (!systemData.tubos[index]) {
                showError('Tubo não encontrado');
                return;
            }
            
            const tuboToDelete = systemData.tubos[index];
            
            // Verifica se é um novo tubo (não salvo)
            const isNewTubo = !tuboToDelete.polegadas || pendingTuboChanges.some(change => 
                !change.originalData && 
                change.newData?.polegadas === tuboToDelete.polegadas &&
                change.action === 'add'
            );
            
            if (isNewTubo) {
                // Remove da lista de alterações pendentes
                pendingTuboChanges = pendingTuboChanges.filter(change => 
                    !(!change.originalData && change.newData?.polegadas === tuboToDelete.polegadas)
                );
                
                // Remove do array principal
                systemData.tubos.splice(index, 1);
                loadTubos();
                addPendingChange('tubos');
                showInfo('Novo tubo removido.');
                return;
            }
            
            // Para tubos existentes, marca para exclusão
            pendingTuboChanges.push({
                originalData: { ...tuboToDelete },
                newData: null, // null indica remoção
                action: 'delete'
            });
            
            // Remove localmente para visualização
            systemData.tubos.splice(index, 1);
            loadTubos();
            addPendingChange('tubos');
            
            showInfo(`Tubo de ${polegadas}'' marcado para exclusão. Clique em "Salvar Alterações" para confirmar.`);
            
        } catch (error) {
            console.error('Erro ao excluir tubo:', error);
            showError(`Erro ao excluir tubo: ${error.message}`);
        }
    });
}

export function resetTuboChanges() {
    showConfirmation('Deseja cancelar todas as alterações pendentes nos tubos?', () => {
        try {
            // Limpa a lista de alterações pendentes
            pendingTuboChanges = [];
            
            // Recarrega os dados da API para restaurar estado original
            initTubosModule().then(() => {
                showInfo('Alterações nos tubos canceladas. Dados restaurados.');
            }).catch(error => {
                console.error('Erro ao recarregar tubos:', error);
                showInfo('Alterações canceladas localmente.');
            });
            
        } catch (error) {
            console.error('Erro ao cancelar alterações:', error);
            showError(`Erro ao cancelar alterações: ${error.message}`);
        }
    });
}

export async function saveTuboChanges() {
    if (pendingTuboChanges.length === 0) {
        showInfo('Nenhuma alteração pendente para salvar.');
        return;
    }
    
    showConfirmation(`Deseja salvar ${pendingTuboChanges.length} alteração(ões) nos tubos?`, async () => {
        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];
            
            // Processa cada alteração
            for (const change of pendingTuboChanges) {
                try {
                    if (change.action === 'delete') {
                        // Exclusão
                        const response = await fetch(`/api/tubos/delete`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ polegadas: change.originalData.polegadas })
                        });
                        
                        if (response.ok) {
                            successCount++;
                        } else {
                            errorCount++;
                            errors.push(`Erro ao excluir ${change.originalData.polegadas}`);
                        }
                    } else if (change.action === 'add') {
                        // Criação de novo tubo
                        const response = await fetch('/api/tubos/add', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(change.newData)
                        });
                        
                        if (response.ok) {
                            successCount++;
                        } else {
                            errorCount++;
                            errors.push(`Erro ao adicionar ${change.newData.polegadas}`);
                        }
                    } else {
                        // Atualização
                        const response = await fetch('/api/tubos/update', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(change.newData)
                        });
                        
                        if (response.ok) {
                            successCount++;
                        } else {
                            errorCount++;
                            errors.push(`Erro ao atualizar ${change.newData.polegadas}`);
                        }
                    }
                } catch (apiError) {
                    console.warn('Erro na API:', apiError);
                    errorCount++;
                    errors.push(`Erro de conexão para ${change.originalData?.polegadas || change.newData?.polegadas || 'tubo'}`);
                }
            }
            
            // Limpa a lista de alterações pendentes
            pendingTuboChanges = [];
            
            // Recarrega os dados da API
            await initTubosModule();
            
            // Mostra resultado
            if (errorCount === 0) {
                showInfo(`${successCount} alteração(ões) salva(s) com sucesso!`);
            } else {
                let message = `${successCount} alteração(ões) salva(s), ${errorCount} falha(s).`;
                if (errors.length > 0) {
                    message += `\nErros: ${errors.join(', ')}`;
                }
                showWarning(message);
            }
            
        } catch (error) {
            console.error('Erro ao salvar alterações:', error);
            showError(`Erro ao salvar alterações: ${error.message}`);
        }
    });
}

// ==================== INICIALIZAÇÃO ====================

export async function initTubosModule() {
    console.log('🔧 Inicializando módulo de tubos...');
    
    try {
        // Carrega dados iniciais da API
        const response = await fetch('/api/tubos');
        if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.tubos)) {
                systemData.tubos = data.tubos;
                // Limpa alterações pendentes ao recarregar
                pendingTuboChanges = [];
            }
        } else {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        loadTubos();
        
        // Exporta funções globalmente
        window.loadTubos = loadTubos;
        window.addTubo = addTubo;
        window.updateTuboField = updateTuboField;
        window.deleteTubo = deleteTubo;
        window.resetTuboChanges = resetTuboChanges;
        window.saveTuboChanges = saveTuboChanges;
        
        console.log('✅ Módulo de tubos inicializado');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de tubos:', error);
        showError('Erro ao carregar dados dos tubos');
        systemData.tubos = [];
        pendingTuboChanges = [];
        loadTubos();
    }
}

// Inicializa automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof initTubosModule === 'function') {
                initTubosModule();
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        if (typeof initTubosModule === 'function') {
            initTubosModule();
        }
    }, 100);
}

// Exportar por padrão
export default {
    loadTubos,
    addTubo,
    updateTuboField,
    deleteTubo,
    resetTuboChanges,
    saveTuboChanges,
    initTubosModule
};