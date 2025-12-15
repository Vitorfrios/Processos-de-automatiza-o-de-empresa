// scripts/03_Edit_data/api.js
// Funções de comunicação com API

import { 
    systemData, 
    originalData, 
    pendingChanges, 
    updateSystemData,
    clearPendingChanges,
    updateOriginalData  // Importe a nova função
} from './state.js';
import { showLoading, hideLoading, showSuccess, showError, showWarning, showInfo } from './ui.js';

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
        await loadFallbackData();
    } finally {
        hideLoading();
    }
}

export async function loadFallbackData() {
    try {
        const fallbackData = {
            constants: {},
            machines: [],
            materials: {},
            empresas: []
        };
        
        updateSystemData(fallbackData);
        window.dispatchEvent(new CustomEvent('dataLoaded', { detail: fallbackData }));
        
        showWarning('Usando dados locais. Algumas funcionalidades podem não estar disponíveis.');
    } catch (error) {
        console.error('Erro no fallback:', error);
        showError('Não foi possível carregar os dados. Verifique sua conexão.');
    }
}

export async function saveData() {
    try {
        if (pendingChanges.size === 0) {
            showInfo('Nenhuma alteração para salvar.');
            return;
        }
        
        showLoading('Salvando dados...');
        
        const validateData = window.validateData;
        if (validateData && !validateData()) {
            throw new Error('Dados inválidos encontrados');
        }
        
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
            // CORREÇÃO: Use a função updateOriginalData
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
    } finally {
        hideLoading();
    }
}

// Exportar funções globalmente
window.loadData = loadData;
window.saveData = saveData;