// scripts/03_Edit_data/main.js
// Ponto de entrada principal

import { loadModules } from './loader.js';

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sistema de Edição de Dados iniciado');
    
    // Carregar todos os módulos
    await loadModules();
    
    // Configurar eventos
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
    
    const searchBtn = document.querySelector('.btn-info[onclick*="performSearch"]');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Carregar dados iniciais
    setTimeout(() => {
        if (typeof window.loadData === 'function') {
            window.loadData();
        }
    }, 500);
});

// Funções globais para modais
window.confirmAction = function(confirmed) {
    const modal = document.getElementById('confirmationModal');
    if (modal) modal.style.display = 'none';
    
    if (confirmed && window.confirmCallback) {
        window.confirmCallback();
        window.confirmCallback = null;
    }
};

window.closeEditModal = function() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
};

window.saveEdit = function() {
    closeEditModal();
};

window.shutdownManual = function() {
    showConfirmation('Deseja realmente encerrar o servidor?', async () => {
        try {
            const response = await fetch('/api/shutdown', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.action === 'close_window') {
                showSuccess('Servidor encerrado. Esta janela será fechada.');
                setTimeout(() => {
                    window.close();
                }, data.close_delay || 3000);
            }
        } catch (error) {
            console.error('Erro ao encerrar servidor:', error);
            showError('Erro ao encerrar servidor. Tente novamente.');
        }
    });
};

// Função de busca (simplificada)
window.performSearch = function() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const filter = document.getElementById('searchFilter').value;
    
    if (!searchTerm) {
        showWarning('Digite um termo para buscar');
        return;
    }
    
    console.log(`Busca: "${searchTerm}" no filtro: ${filter}`);
    // Implementação completa será adicionada posteriormente
    showInfo('Funcionalidade de busca em desenvolvimento');
};

// Arquivo adicional para JSON Editor
const jsonEditorModule = {
    loadJSONEditor: function() {
        const editor = document.getElementById('jsonEditor');
        if (!editor) return;
        
        const systemData = window.systemData || {};
        editor.value = JSON.stringify(systemData, null, 2);
        this.updateJSONStatus('JSON carregado', 'info');
    },
    
    formatJSON: function() {
        const editor = document.getElementById('jsonEditor');
        try {
            const parsed = JSON.parse(editor.value);
            editor.value = JSON.stringify(parsed, null, 2);
            this.updateJSONStatus('JSON formatado com sucesso', 'success');
        } catch (error) {
            this.updateJSONStatus(`Erro de formatação: ${error.message}`, 'error');
        }
    },
    
    validateJSON: function() {
        const editor = document.getElementById('jsonEditor');
        try {
            const parsed = JSON.parse(editor.value);
            
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
            
            this.updateJSONStatus('✅ JSON válido e com estrutura correta', 'success');
            return true;
            
        } catch (error) {
            this.updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
            return false;
        }
    },
    
    updateJSONStatus: function(message, type) {
        const status = document.getElementById('jsonStatus');
        if (!status) return;
        
        status.textContent = message;
        status.className = 'json-status-message';
        
        switch (type) {
            case 'success':
                status.classList.add('success');
                break;
            case 'error':
                status.classList.add('error');
                break;
            case 'info':
                status.classList.add('info');
                break;
            default:
                status.classList.add('info');
        }
    }
};

window.loadJSONEditor = jsonEditorModule.loadJSONEditor.bind(jsonEditorModule);
window.formatJSON = jsonEditorModule.formatJSON.bind(jsonEditorModule);
window.validateJSON = jsonEditorModule.validateJSON.bind(jsonEditorModule);
window.updateJSONStatus = jsonEditorModule.updateJSONStatus.bind(jsonEditorModule);

// Disparar evento quando os dados são carregados para atualizar as tabelas
window.addEventListener('dataLoaded', function(event) {
    const data = event.detail;
    
    // Atualizar todas as visualizações
    if (window.loadConstants) window.loadConstants();
    if (window.loadMachines) window.loadMachines();
    if (window.loadMaterials) window.loadMaterials();
    if (window.loadEmpresas) window.loadEmpresas();
    if (window.populateMachineFilter) window.populateMachineFilter();
    if (window.loadJSONEditor) window.loadJSONEditor();
});

// Disparar evento quando os dados são importados
window.addEventListener('dataImported', function(event) {
    const data = event.detail;
    window.systemData = data;
    
    // Atualizar todas as visualizações
    if (window.loadConstants) window.loadConstants();
    if (window.loadMachines) window.loadMachines();
    if (window.loadMaterials) window.loadMaterials();
    if (window.loadEmpresas) window.loadEmpresas();
    if (window.populateMachineFilter) window.populateMachineFilter();
    if (window.loadJSONEditor) window.loadJSONEditor();
});