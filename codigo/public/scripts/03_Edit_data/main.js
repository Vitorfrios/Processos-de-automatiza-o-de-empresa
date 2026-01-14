// scripts/03_Edit_data/main.js
import { loadModules } from './loader.js';
import { createSmartLogger } from '../01_Create_Obra/core/logger.js';

// ==================== CONFIGURAÇÃO INICIAL ====================

// Função para garantir que systemData tenha estrutura completa
function ensureCompleteSystemData(data) {
    if (!data || typeof data !== 'object') {
        return {
            constants: {},
            machines: [],
            materials: {},
            empresas: [],
            banco_equipamentos: {},
            dutos: {
                tipos: [],
                opcionais: []
            },
            tubos: []  // ADICIONADO: estrutura para tubos
        };
    }
    
    return {
        constants: data.constants || {},
        machines: data.machines || [],
        materials: data.materials || {},
        empresas: data.empresas || [],
        banco_equipamentos: data.banco_equipamentos || {},
        dutos: data.dutos || {
            tipos: [],
            opcionais: []
        },
        tubos: Array.isArray(data.tubos) ? data.tubos : []  // ADICIONADO
    };
}

// Sobrescrever o setter de window.systemData para garantir estrutura
Object.defineProperty(window, 'systemData', {
    get() {
        return window._systemData;
    },
    set(value) {
        console.log('📥 systemData sendo definido...');
        
        // Sempre garante estrutura completa
        window._systemData = ensureCompleteSystemData(value);
        
        console.log('✅ systemData corrigido:', {
            constants: Object.keys(window._systemData.constants).length,
            machines: window._systemData.machines.length,
            materials: Object.keys(window._systemData.materials).length,
            empresas: window._systemData.empresas.length,
            banco_equipamentos: Object.keys(window._systemData.banco_equipamentos).length,
            dutos: {
                tipos: window._systemData.dutos?.tipos?.length || 0,
                opcionais: window._systemData.dutos?.opcionais?.length || 0
            },
            tubos: window._systemData.tubos?.length || 0  // ADICIONADO
        });
    },
    configurable: true,
    enumerable: true
});

// Inicializar systemData vazio
window._systemData = ensureCompleteSystemData({});

// ==================== INICIALIZAÇÃO PRINCIPAL ====================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Sistema de Edição de Dados iniciado');
    
    // Carregar todos os módulos
    await loadModules();
    
    // Inicializar sistema de staging
    window.stagingData = null;
    window.hasPendingChanges = false;
    
    // Função para forçar atualização do editor quando a tab é aberta
    window.activateJSONTab = function() {
        console.log('📝 Ativando tab JSON...');
        
        // Garante que o editor seja inicializado
        if (typeof window.initJSONEditor === 'function') {
            setTimeout(() => {
                window.initJSONEditor();
                
                // Atualiza botão de aplicar
                if (typeof window.updateApplyButtonState === 'function') {
                    window.updateApplyButtonState();
                }
            }, 100);
        }
    };
    
    // Carregar dados iniciais
    setTimeout(async () => {
        console.log('📥 Iniciando carregamento de dados...');
        
        if (typeof window.loadData === 'function') {
            try {
                // Força o carregamento dos dados
                await window.loadData();
                
                // Verifica se os dados foram carregados corretamente
                console.log('✅ Dados carregados. Verificando estrutura...');
                console.log('✅ window.systemData:', window.systemData);
                console.log('✅ Tem banco_equipamentos?', 'banco_equipamentos' in window.systemData);
                console.log('✅ Tem dutos?', 'dutos' in window.systemData);
                console.log('✅ Tem tubos?', 'tubos' in window.systemData);  // ADICIONADO
                console.log('✅ banco_equipamentos:', window.systemData?.banco_equipamentos);
                console.log('✅ dutos:', window.systemData?.dutos);
                console.log('✅ tubos:', window.systemData?.tubos);  // ADICIONADO
                
                // Inicializa o editor com os dados carregados
                if (typeof window.initJSONEditor === 'function') {
                    setTimeout(window.initJSONEditor, 200);
                }
                
            } catch (error) {
                console.error('❌ Erro ao carregar dados:', error);
                
                // Mesmo com erro, inicializa o editor com estrutura vazia
                if (typeof window.initJSONEditor === 'function') {
                    setTimeout(window.initJSONEditor, 200);
                }
            }
        } else {
            console.warn('⚠️ Função loadData não encontrada');
            // Inicializa editor com estrutura vazia
            if (typeof window.initJSONEditor === 'function') {
                setTimeout(window.initJSONEditor, 200);
            }
        }
    }, 500);
});

// ==================== FUNÇÕES GLOBAIS ====================

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

// ==================== MÓDULO JSON EDITOR ====================

const jsonEditorModule = {
    loadJSONEditor: function() {
        console.log('📝 Carregando JSON Editor...');
        const editor = document.getElementById('jsonEditor');
        if (!editor) {
            console.warn('⚠️ Editor não encontrado');
            return;
        }
        
        const systemData = window.systemData || {};
        console.log('📝 Dados para o editor:', {
            banco_equipamentos: Object.keys(systemData.banco_equipamentos || {}).length,
            dutos: {
                tipos: systemData.dutos?.tipos?.length || 0,
                opcionais: systemData.dutos?.opcionais?.length || 0
            },
            tubos: systemData.tubos?.length || 0  // ADICIONADO
        });
        
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
            
            // ADICIONADO: tubos na lista de campos obrigatórios
            const requiredKeys = ['constants', 'machines', 'materials', 'empresas', 'banco_equipamentos', 'dutos', 'tubos'];
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
            if (typeof parsed.banco_equipamentos !== 'object') {
                throw new Error('banco_equipamentos deve ser um objeto');
            }
            if (typeof parsed.dutos !== 'object') {
                throw new Error('dutos deve ser um objeto');
            }
            if (!Array.isArray(parsed.dutos.tipos)) {
                throw new Error('dutos.tipos deve ser um array');
            }
            if (!Array.isArray(parsed.dutos.opcionais)) {
                throw new Error('dutos.opcionais deve ser um array');
            }
            // ADICIONADO: validação de tubos
            if (!Array.isArray(parsed.tubos)) {
                throw new Error('tubos deve ser um array');
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

// Atribuir funções globais do JSON Editor
window.loadJSONEditor = jsonEditorModule.loadJSONEditor.bind(jsonEditorModule);
window.formatJSON = jsonEditorModule.formatJSON.bind(jsonEditorModule);
window.validateJSON = jsonEditorModule.validateJSON.bind(jsonEditorModule);
window.updateJSONStatus = jsonEditorModule.updateJSONStatus.bind(jsonEditorModule);

// ==================== EVENT LISTENERS ====================

// Disparar evento quando os dados são carregados
window.addEventListener('dataLoaded', function(event) {
    const data = event.detail;
    
    console.log('🎯 EVENTO dataLoaded recebido na main.js');
    console.log('🎯 Dados recebidos:', {
        constants: Object.keys(data.constants || {}).length,
        machines: data.machines?.length || 0,
        materials: Object.keys(data.materials || {}).length,
        empresas: data.empresas?.length || 0,
        banco_equipamentos: Object.keys(data.banco_equipamentos || {}).length,
        dutos: {
            tipos: data.dutos?.tipos?.length || 0,
            opcionais: data.dutos?.opcionais?.length || 0
        },
        tubos: data.tubos?.length || 0  // ADICIONADO
    });
    
    // Atualiza window.systemData com os dados recebidos
    window.systemData = data;
    
    // Carrega todos os componentes
    setTimeout(() => {
        if (window.loadConstants) window.loadConstants();
        if (window.loadMachines) window.loadMachines();
        if (window.loadMaterials) window.loadMaterials();
        if (window.loadEmpresas) window.loadEmpresas();
        if (window.loadEquipamentos) window.loadEquipamentos();
        if (window.loadDutos) window.loadDutos();
        if (window.loadTubos) window.loadTubos();  // ADICIONADO
        if (window.populateMachineFilter) window.populateMachineFilter();
        if (window.loadJSONEditor) window.loadJSONEditor();
        
        // Limpar staging
        window.stagingData = null;
        window.hasPendingChanges = false;
        if (typeof updateApplyButtonState === 'function') {
            updateApplyButtonState();
        }
        
        console.log('✅ Todos os componentes carregados após dataLoaded');
    }, 100);
});

// Disparar evento quando os dados são importados (via staging)
window.addEventListener('dataImported', function(event) {
    const data = event.detail;
    
    console.log('🎯 EVENTO dataImported recebido');
    window.systemData = data;
    
    if (window.loadConstants) window.loadConstants();
    if (window.loadMachines) window.loadMachines();
    if (window.loadMaterials) window.loadMaterials();
    if (window.loadEmpresas) window.loadEmpresas();
    if (window.loadEquipamentos) window.loadEquipamentos();
    if (window.loadDutos) window.loadDutos();
    if (window.loadTubos) window.loadTubos();  // ADICIONADO
    if (window.populateMachineFilter) window.populateMachineFilter();
    if (window.loadJSONEditor) window.loadJSONEditor();
    
    // Limpar staging
    window.stagingData = null;
    window.hasPendingChanges = false;
    if (typeof updateApplyButtonState === 'function') {
        updateApplyButtonState();
    }
});

// Evento: Dados aplicados via botão "Aplicar JSON"
window.addEventListener('dataApplied', function(event) {
    const data = event.detail.data;
    const changes = event.detail.changes;
    
    console.log('🎯 EVENTO dataApplied recebido:', changes);
    
    // Atualizar window.systemData
    window.systemData = data;
    
    // Atualizar JSON Editor com os novos dados
    if (window.loadJSONEditor) {
        window.loadJSONEditor();
    }
    
    // Atualizar equipamentos também
    if (window.loadEquipamentos) {
        window.loadEquipamentos();
    }
    
    // Atualizar dutos também
    if (window.loadDutos) {
        window.loadDutos();
    }
    
    // Atualizar tubos também
    if (window.loadTubos) {
        window.loadTubos();
    }
    
    // Registrar no logger se disponível
    if (window.logger && window.logger.log) {
        window.logger.log('Sistema', `JSON aplicado: ${changes.summary.total_changes} alterações`);
    }
});

// ==================== FUNÇÕES DE DEBUG ====================

// Função de debug para verificar dados
window.debugSystemData = function() {
    console.log('=== DEBUG SYSTEMDATA ===');
    console.log('systemData:', window.systemData);
    console.log('Tem banco_equipamentos?', 'banco_equipamentos' in window.systemData);
    console.log('Tem dutos?', 'dutos' in window.systemData);
    console.log('Tem tubos?', 'tubos' in window.systemData);  // ADICIONADO
    console.log('banco_equipamentos:', window.systemData?.banco_equipamentos);
    console.log('dutos:', window.systemData?.dutos);
    console.log('tubos:', window.systemData?.tubos);  // ADICIONADO
    console.log('Número de equipamentos:', Object.keys(window.systemData?.banco_equipamentos || {}).length);
    console.log('Número de tipos de dutos:', window.systemData?.dutos?.tipos?.length || 0);
    console.log('Número de opcionais:', window.systemData?.dutos?.opcionais?.length || 0);
    console.log('Número de tubos:', window.systemData?.tubos?.length || 0);  // ADICIONADO
    console.log('Keys de banco_equipamentos:', Object.keys(window.systemData?.banco_equipamentos || {}));
    
    // Verifica o editor
    const editor = document.getElementById('jsonEditor');
    if (editor && editor.value) {
        try {
            const parsed = JSON.parse(editor.value);
            console.log('Editor tem banco_equipamentos?', 'banco_equipamentos' in parsed);
            console.log('Editor tem dutos?', 'dutos' in parsed);
            console.log('Editor tem tubos?', 'tubos' in parsed);  // ADICIONADO
            console.log('Equipamentos no editor:', Object.keys(parsed?.banco_equipamentos || {}).length);
            console.log('Tipos de dutos no editor:', parsed?.dutos?.tipos?.length || 0);
            console.log('Tubos no editor:', parsed?.tubos?.length || 0);  // ADICIONADO
        } catch(e) {
            console.error('Erro ao parsear editor:', e);
        }
    }
};

// Função para forçar recarregamento completo
window.reloadCompleteData = async function() {
    console.log('🔄 Forçando recarregamento completo...');
    
    try {
        // Busca dados diretamente da API
        const response = await fetch('/api/system-data');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Dados da API:', {
                banco_equipamentos: Object.keys(data.banco_equipamentos || {}).length,
                dutos: {
                    tipos: data.dutos?.tipos?.length || 0,
                    opcionais: data.dutos?.opcionais?.length || 0
                },
                tubos: data.tubos?.length || 0  // ADICIONADO
            });
            
            // Atualiza window.systemData
            window.systemData = data;
            
            // Dispara evento
            window.dispatchEvent(new CustomEvent('dataLoaded', {
                detail: data
            }));
            
            console.log('✅ Dados recarregados com sucesso!');
            return data;
        } else {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Erro ao recarregar dados:', error);
        throw error;
    }
};

// ==================== MANIPULAÇÃO DE TABS ====================

// Função para switchTab (se não existir)
if (typeof window.switchTab === 'undefined') {
    window.switchTab = function(tabName) {
        console.log(`🔄 Alternando para tab: ${tabName}`);
        
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
            
            // Disparar evento personalizado
            const event = new CustomEvent('tabChanged', {
                detail: { tab: tabName }
            });
            document.dispatchEvent(event);
            
            // Ações específicas por tab
            switch(tabName) {
                case 'dutos':
                    console.log('🎯 Tab de dutos ativada');
                    if (typeof window.loadDutos === 'function') {
                        setTimeout(window.loadDutos, 100);
                    }
                    break;
                    
                case 'tubos':  // ADICIONADO
                    console.log('🎯 Tab de tubos ativada');
                    if (typeof window.loadTubos === 'function') {
                        setTimeout(window.loadTubos, 100);
                    }
                    break;
                    
                case 'equipments':
                case 'equipamentos':
                    console.log('🎯 Tab de equipamentos ativada');
                    if (typeof window.loadEquipamentos === 'function') {
                        setTimeout(window.loadEquipamentos, 100);
                    } else if (typeof window.loadEquipmentsData === 'function') {
                        setTimeout(window.loadEquipmentsData, 100);
                    }
                    break;
                    
                case 'raw':
                    console.log('🎯 Tab JSON ativada');
                    if (typeof window.initJSONEditor === 'function') {
                        setTimeout(window.initJSONEditor, 100);
                    }
                    break;
            }
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

// Adiciona evento para quando as tabs forem clicadas
document.addEventListener('DOMContentLoaded', function() {
    // Encontra todas as tabs
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabText = this.textContent.toLowerCase();
            
            if (tabText.includes('json') || tabText.includes('raw') || tabText.includes('bruto')) {
                console.log('🎯 Tab JSON clicada, inicializando editor...');
                
                // Pequeno delay para garantir que a tab está visível
                setTimeout(() => {
                    if (typeof window.initJSONEditor === 'function') {
                        window.initJSONEditor();
                    }
                    
                    if (typeof window.updateApplyButtonState === 'function') {
                        window.updateApplyButtonState();
                    }
                }, 150);
            }
            
            if (tabText.includes('dutos') || tabText.includes('duto')) {
                console.log('🎯 Tab de dutos clicada');
                
                setTimeout(() => {
                    if (typeof window.loadDutos === 'function') {
                        window.loadDutos();
                    }
                }, 150);
            }
            
            if (tabText.includes('tubos') || tabText.includes('tubo')) {  // ADICIONADO
                console.log('🎯 Tab de tubos clicada');
                
                setTimeout(() => {
                    if (typeof window.loadTubos === 'function') {
                        window.loadTubos();
                    }
                }, 150);
            }
            
            if (tabText.includes('equipamento') || tabText.includes('equipment')) {
                console.log('🎯 Tab de equipamentos clicada');
                
                setTimeout(() => {
                    if (typeof window.loadEquipamentos === 'function') {
                        window.loadEquipamentos();
                    } else if (typeof window.loadEquipmentsData === 'function') {
                        window.loadEquipmentsData();
                    }
                }, 150);
            }
        });
    });
});

// ==================== INICIALIZAÇÃO EXTRA ====================

// Adiciona listener para debug quando o sistema está pronto
setTimeout(() => {
    console.log('✅ Sistema completamente inicializado');
    console.log('📊 Estado final do systemData:', {
        constants: Object.keys(window.systemData?.constants || {}).length,
        machines: window.systemData?.machines?.length || 0,
        materials: Object.keys(window.systemData?.materials || {}).length,
        empresas: window.systemData?.empresas?.length || 0,
        banco_equipamentos: Object.keys(window.systemData?.banco_equipamentos || {}).length,
        dutos: {
            tipos: window.systemData?.dutos?.tipos?.length || 0,
            opcionais: window.systemData?.dutos?.opcionais?.length || 0
        },
        tubos: window.systemData?.tubos?.length || 0  // ADICIONADO
    });
}, 2000);