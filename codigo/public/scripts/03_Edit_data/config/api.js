// scripts/03_Edit_data/api.js
// Funções de comunicação com API

import { 
    systemData, 
    originalData, 
    pendingChanges, 
    updateSystemData,
    clearPendingChanges,
    updateOriginalData
} from './state.js';
import { showLoading, hideLoading, showSuccess, showError, showWarning, showInfo } from './ui.js';

// Função para debug dos dados
function debugDataValidation() {
    console.group('🔍 DEBUG: Validação de Dados');
    
    // Verificar estrutura do systemData
    console.log('📊 systemData structure:', Object.keys(systemData));
    
    // Verificar dutos
    if (systemData.dutos) {
        console.log('📦 Dutos:', systemData.dutos.length);
        systemData.dutos.forEach((duto, index) => {
            console.log(`  Duto ${index}:`, {
                type: duto.type,
                valor: duto.valor,
                descricao: duto.descricao,
                opcionais: duto.opcionais ? duto.opcionais.length : 0
            });
            
            // Verificar problemas específicos
            if (typeof duto.valor !== 'number' || isNaN(duto.valor)) {
                console.error(`  ❌ Duto ${index} tem valor inválido:`, duto.valor);
            }
            
            // Verificar opcionais
            if (duto.opcionais && Array.isArray(duto.opcionais)) {
                duto.opcionais.forEach((opcional, opcIndex) => {
                    if (typeof opcional.value !== 'number' || isNaN(opcional.value)) {
                        console.error(`    ❌ Opcional ${opcIndex} tem valor inválido:`, opcional.value);
                    }
                });
            }
        });
    }
    
    // Verificar banco_equipamentos
    if (systemData.banco_equipamentos) {
        console.log('⚙️ Equipamentos:', Object.keys(systemData.banco_equipamentos).length);
        Object.entries(systemData.banco_equipamentos).forEach(([id, equip], index) => {
            console.log(`  Equipamento ${index}:`, {
                id,
                codigo: equip.codigo,
                descricao: equip.descricao,
                dimensoes: equip.valores_padrao ? Object.keys(equip.valores_padrao).length : 0
            });
            
            // Verificar problemas
            if (!equip.codigo || equip.codigo.trim() === '') {
                console.error(`  ❌ Equipamento ${id} não tem código`);
            }
        });
    }
    
    console.groupEnd();
}

export async function loadData() {
    try {
        showLoading('Carregando dados do sistema...');
        
        const response = await fetch('/api/system-data');
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
            throw new Error('Dados recebidos são inválidos');
        }
        
        updateSystemData(data);
        
        // Notificar outros módulos que os dados foram carregados
        window.dispatchEvent(new CustomEvent('dataLoaded', { detail: data }));
        
        clearPendingChanges();
        showSuccess('Dados carregados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError(`Erro ao carregar dados: ${error.message}`);
        
        // Fallback
    } finally {
        hideLoading();
    }
}

export async function saveData() {
    try {
        if (pendingChanges.size === 0) {
            showInfo('Nenhuma alteração para salvar.');
            return;
        }
        
        showLoading('Salvando dados...');
        
        // Debug: Verificar dados antes da validação
        console.log('🔄 Tentando salvar dados...');
        console.log('Mudanças pendentes:', Array.from(pendingChanges));
        debugDataValidation();
        
        // Validar dados antes de salvar
        const validateData = window.validateData;
        if (validateData && !validateData()) {
            console.error('❌ Validação falhou. Dados atuais:');
            console.log(JSON.stringify(systemData, null, 2));
            throw new Error('Dados inválidos encontrados. Verifique o console para detalhes.');
        }
        
        console.log('✅ Validação passou. Enviando dados para API...');
        
        const response = await fetch('/api/system-data/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(systemData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Atualizar dados originais
            updateOriginalData(systemData);
            
            clearPendingChanges();
            showSuccess(result.message || 'Dados salvos com sucesso!');
            
            // Recarregar para sincronização
            setTimeout(() => loadData(), 500);
        } else {
            throw new Error(result.error || 'Erro ao salvar dados');
        }
        
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showError(`Erro ao salvar: ${error.message}`);
        
        // Mostrar detalhes do erro
        showError(`Detalhes: ${error.message}. Verifique o console para mais informações.`);
    } finally {
        hideLoading();
    }
}

// Função para corrigir dados automaticamente
export function fixDataIssues() {
    try {
        console.log('🛠️  Corrigindo problemas de dados...');
        let fixedIssues = 0;
        
        // Corrigir dutos
        if (systemData.dutos && Array.isArray(systemData.dutos)) {
            systemData.dutos.forEach((duto, index) => {
                // Garantir que valor é número
                if (typeof duto.valor !== 'number' || isNaN(duto.valor)) {
                    console.warn(`Corrigindo valor do duto ${index}: ${duto.valor} -> 0`);
                    duto.valor = 0;
                    fixedIssues++;
                }
                
                // Garantir que type é string
                if (typeof duto.type !== 'string') {
                    duto.type = String(duto.type || 'Duto sem nome');
                    fixedIssues++;
                }
                
                // Garantir que descricao é string
                if (duto.descricao && typeof duto.descricao !== 'string') {
                    duto.descricao = String(duto.descricao);
                    fixedIssues++;
                }
                
                // Corrigir opcionais
                if (duto.opcionais) {
                    if (!Array.isArray(duto.opcionais)) {
                        duto.opcionais = [];
                        fixedIssues++;
                    } else {
                        duto.opcionais.forEach((opcional, opcIndex) => {
                            if (typeof opcional.value !== 'number' || isNaN(opcional.value)) {
                                opcional.value = 0;
                                fixedIssues++;
                            }
                        });
                    }
                }
            });
        }
        
        // Corrigir equipamentos
        if (systemData.banco_equipamentos && typeof systemData.banco_equipamentos === 'object') {
            Object.entries(systemData.banco_equipamentos).forEach(([id, equip]) => {
                // Garantir código
                if (!equip.codigo || typeof equip.codigo !== 'string') {
                    equip.codigo = `EQP_${Date.now().toString().slice(-6)}`;
                    fixedIssues++;
                }
                
                // Garantir descrição
                if (typeof equip.descricao !== 'string') {
                    equip.descricao = String(equip.descricao || 'Equipamento sem descrição');
                    fixedIssues++;
                }
                
                // Garantir valores_padrao
                if (!equip.valores_padrao || typeof equip.valores_padrao !== 'object') {
                    equip.valores_padrao = {};
                    fixedIssues++;
                }
            });
        }
        
        if (fixedIssues > 0) {
            console.log(`✅ ${fixedIssues} problemas corrigidos automaticamente.`);
            showInfo(`${fixedIssues} problemas de dados corrigidos automaticamente.`);
            
            // Atualizar referências globais
            if (window.dutosData && systemData.dutos) {
                window.dutosData = systemData.dutos;
            }
            
            if (window.equipmentsData && systemData.banco_equipamentos) {
                window.equipmentsData = systemData.banco_equipamentos;
            }
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Erro ao corrigir dados:', error);
        return false;
    }
}

// Função de salvamento com correção automática
export async function saveDataWithFix() {
    try {
        // Primeiro tentar corrigir problemas
        const issuesFixed = fixDataIssues();
        
        if (issuesFixed) {
            showWarning('Problemas de dados corrigidos. Tentando salvar novamente...');
            setTimeout(() => saveData(), 1000);
        } else {
            // Se não há problemas, salvar normalmente
            await saveData();
        }
    } catch (error) {
        console.error('Erro no salvamento com correção:', error);
        showError(`Erro ao salvar: ${error.message}`);
    }
}

// Exportar funções globalmente
window.loadData = loadData;
window.saveData = saveDataWithFix;  // Usar versão com correção
window.fixDataIssues = fixDataIssues;
window.debugDataValidation = debugDataValidation;