import { loadModules } from './loader.js';
import { createSmartLogger } from '../01_Create_Obra/core/logger.js';

// ✅ INICIALIZAR LOGGER
window.logger = createSmartLogger();

// ✅ EXPOR FUNÇÃO GLOBAL PARA CONTROLE DO LOGGER
window.toggleSystemLogger = function(enable = null) {
    if (window.logger && typeof window.toggleLogger === 'function') {
        return window.toggleLogger(enable);
    } else {
        console.warn('⚠️ Logger não disponível para controle');
        return false;
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sistema de Edição de Dados iniciado');
    
    // Carregar todos os módulos
    await loadModules();
    
    // Inicializar sistema de staging
    window.stagingData = null;
    window.hasPendingChanges = false;
    
    // Carregar dados iniciais
    setTimeout(() => {
        if (typeof window.loadData === 'function') {
            window.loadData();
        }
        
        // Inicializar botão Aplicar JSON
        if (typeof updateApplyButtonState === 'function') {
            updateApplyButtonState();
        }
    }, 500);
});

// Funções globais para modais (existentes)
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

// Arquivo adicional para JSON Editor (existente)
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

// Atribuir funções globais
window.loadJSONEditor = jsonEditorModule.loadJSONEditor.bind(jsonEditorModule);
window.formatJSON = jsonEditorModule.formatJSON.bind(jsonEditorModule);
window.validateJSON = jsonEditorModule.validateJSON.bind(jsonEditorModule);
window.updateJSONStatus = jsonEditorModule.updateJSONStatus.bind(jsonEditorModule);

// Disparar evento quando os dados são carregados
window.addEventListener('dataLoaded', function(event) {
    const data = event.detail;
    
    // Atualizar todas as visualizações
    if (window.loadConstants) window.loadConstants();
    if (window.loadMachines) window.loadMachines();
    if (window.loadMaterials) window.loadMaterials();
    if (window.loadEmpresas) window.loadEmpresas();
    if (window.populateMachineFilter) window.populateMachineFilter();
    if (window.loadJSONEditor) window.loadJSONEditor();
    
    // Limpar staging
    window.stagingData = null;
    window.hasPendingChanges = false;
    if (typeof updateApplyButtonState === 'function') {
        updateApplyButtonState();
    }
});

// Disparar evento quando os dados são importados (via staging)
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
    
    // Limpar staging
    window.stagingData = null;
    window.hasPendingChanges = false;
    if (typeof updateApplyButtonState === 'function') {
        updateApplyButtonState();
    }
});

// NOVO EVENTO: Dados aplicados via botão "Aplicar JSON"
window.addEventListener('dataApplied', function(event) {
    const data = event.detail.data;
    const changes = event.detail.changes;
    
    console.log('Dados aplicados via botão "Aplicar JSON":', changes);
    
    // Atualizar JSON Editor com os novos dados
    if (window.loadJSONEditor) {
        window.loadJSONEditor();
    }
    
    // Registrar no logger se disponível
    if (window.logger && window.logger.log) {
        window.logger.log('Sistema', `JSON aplicado: ${changes.summary.total_changes} alterações`);
    }
});

// Função para switchTab (se não existir)
if (typeof window.switchTab === 'undefined') {
    window.switchTab = function(tabName) {
        // Esconder todas as tabs
        document.querySelectorAll('.tab-pane').forEach(tab => {
            tab.classList.remove('active');
            tab.style.display = 'none';
        });
        
        // Remover active de todos os botões
        document.querySelectorAll('.tabs .tab').forEach(tabBtn => {
            tabBtn.classList.remove('active');
        });
        
        // Mostrar tab selecionada
        const tabElement = document.getElementById(tabName + 'Tab');
        if (tabElement) {
            tabElement.classList.add('active');
            tabElement.style.display = 'block';
        }
        
        // Ativar botão correspondente
        const tabButtons = document.querySelectorAll('.tabs .tab');
        tabButtons.forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName.toLowerCase()) || 
                btn.getAttribute('onclick')?.includes(tabName)) {
                btn.classList.add('active');
            }
        });
    };
}