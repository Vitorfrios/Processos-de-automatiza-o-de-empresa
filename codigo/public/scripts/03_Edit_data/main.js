// scripts/03_Edit_data/main.js
import { loadModules } from './loader.js';
import { createSmartLogger } from '../01_Create_Obra/core/logger.js';
import { initializeDashboard } from './core/dashboard-summary.js';          // NOVO
import { initializeAdminCredentials } from './core/admin-credentials.js';

// ==================== CONFIGURAÇÃO INICIAL ====================

// ✅ INICIALIZAR LOGGER IMEDIATAMENTE
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

// Função para garantir que systemData tenha estrutura completa
function normalizeADMData(admData) {
    if (Array.isArray(admData)) {
        return admData
            .filter((admin) => admin && typeof admin === 'object')
            .map((admin) => ({ ...admin }));
    }

    if (admData && typeof admData === 'object') {
        return [{ ...admData }];
    }

    return [];
}

function ensureCompleteSystemData(data) {
    if (!data || typeof data !== 'object') {
        return {
            ADM: [],
            administradores: [],
            constants: {},
            machines: [],
            materials: {},
            empresas: [],
            banco_acessorios: {},
            dutos: {
                tipos: [],
                opcionais: []
            },
            tubos: []
        };
    }
    
    return {
        ...data,
        ADM: normalizeADMData(data.ADM),
        administradores: Array.isArray(data.administradores) ? [...data.administradores] : [],
        constants: data.constants || {},
        machines: data.machines || [],
        materials: data.materials || {},
        empresas: data.empresas || [],
        banco_acessorios: data.banco_acessorios || {},
        dutos: data.dutos || {
            tipos: [],
            opcionais: []
        },
        tubos: Array.isArray(data.tubos) ? data.tubos : []
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
            ADM: window._systemData.ADM.length,
            constants: Object.keys(window._systemData.constants).length,
            machines: window._systemData.machines.length,
            materials: Object.keys(window._systemData.materials).length,
            empresas: window._systemData.empresas.length,
            banco_acessorios: Object.keys(window._systemData.banco_acessorios).length,
            dutos: {
                tipos: window._systemData.dutos?.tipos?.length || 0,
                opcionais: window._systemData.dutos?.opcionais?.length || 0
            },
            tubos: window._systemData.tubos?.length || 0
        });
    },
    configurable: true,
    enumerable: true
});

// Inicializar systemData vazio
window._systemData = ensureCompleteSystemData({});

// ==================== INICIALIZAÇÃO PRINCIPAL ====================

document.addEventListener('DOMContentLoaded', async function() {
    console.log(' Sistema de Edição de Dados iniciado');
    
    // Carregar todos os módulos
    await loadModules();
    
    // Inicializar sistema de staging
    window.stagingData = null;
    window.hasPendingChanges = false;
    
    // Inicializar módulos das novas abas
    initializeDashboard();
    initializeAdminCredentials();
    
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
                console.log('✅ Tem banco_acessorios?', 'banco_acessorios' in window.systemData);
                console.log('✅ Tem dutos?', 'dutos' in window.systemData);
                console.log('✅ Tem tubos?', 'tubos' in window.systemData);
                console.log('✅ Tem administradores?', 'administradores' in window.systemData);
                console.log('✅ Tem ADM?', 'ADM' in window.systemData);
                
                // Atualiza as novas abas
                initializeDashboard();
                initializeAdminCredentials();
                
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

// ==================== MANIPULAÇÃO DE TABS ====================

// Função principal para alternar entre tabs
window.switchTab = function(tabName) {
    console.log(` Alternando para tab: ${tabName}`);
    
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
        
        // Ativar botão correspondente
        const tabButtons = document.querySelectorAll('.tabs .tab');
        tabButtons.forEach(btn => {
            const btnText = btn.textContent.toLowerCase().replace(/[^a-z]/g, '');
            const tabNameClean = tabName.toLowerCase().replace(/[^a-z]/g, '');
            
            if (btnText.includes(tabNameClean) || 
                btn.getAttribute('onclick')?.includes(tabName)) {
                btn.classList.add('active');
            }
        });
        
        // Disparar evento personalizado
        const event = new CustomEvent('tabChanged', {
            detail: { tab: tabName }
        });
        document.dispatchEvent(event);
        
        // Ações específicas por tab
        setTimeout(() => {
            switch(tabName) {
                case 'dashboard':
                    console.log(' Inicializando dashboard');
                    initializeDashboard();
                    break;
                    
                case 'adminCredentials':
                    console.log('👤 Inicializando credenciais ADM');
                    initializeAdminCredentials();
                    break;
                    
                case 'dutos':
                    console.log(' Tab de dutos ativada');
                    if (typeof window.loadDutos === 'function') {
                        window.loadDutos();
                    }
                    break;
                    
                case 'tubos':
                    console.log(' Tab de tubos ativada');
                    if (typeof window.loadTubos === 'function') {
                        window.loadTubos();
                    }
                    break;
                    
                case 'acessories':
                case 'acessorios':
                    console.log(' Tab de acessorios ativada');
                    if (typeof window.loadAcessorios === 'function') {
                        window.loadAcessorios();
                    } else if (typeof window.loadAcessoriesData === 'function') {
                        window.loadAcessoriesData();
                    }
                    break;
                    
                case 'constants':
                    console.log(' Tab de constantes ativada');
                    if (typeof window.loadConstants === 'function') {
                        window.loadConstants();
                    }
                    break;
                    
                case 'machines':
                    console.log(' Tab de máquinas ativada');
                    if (typeof window.loadMachines === 'function') {
                        window.loadMachines();
                    }
                    break;
                    
                case 'materials':
                    console.log(' Tab de materiais ativada');
                    if (typeof window.loadMaterials === 'function') {
                        window.loadMaterials();
                    }
                    break;
                    
                case 'empresas':
                    console.log(' Tab de empresas ativada');
                    if (typeof window.loadEmpresas === 'function') {
                        window.loadEmpresas();
                    }
                    break;
                    
                case 'raw':
                    console.log(' Tab JSON ativada');
                    if (typeof window.initJSONEditor === 'function') {
                        window.initJSONEditor();
                    }
                    if (typeof window.updateApplyButtonState === 'function') {
                        window.updateApplyButtonState();
                    }
                    break;
            }
        }, 100);
    }
};

// Adiciona evento para quando as tabs forem clicadas
document.addEventListener('DOMContentLoaded', function() {
    // Encontra todas as tabs
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabText = this.textContent.toLowerCase();
            
            // Mapear texto da tab para nome da tab
            if (tabText.includes('dashboard')) {
                // Já tratado pelo onclick
            } else if (tabText.includes('credenciais') || tabText.includes('adm')) {
                // Já tratado pelo onclick
            } else if (tabText.includes('json') || tabText.includes('raw') || tabText.includes('bruto')) {
                console.log(' Tab JSON clicada, inicializando editor...');
                
                setTimeout(() => {
                    if (typeof window.initJSONEditor === 'function') {
                        window.initJSONEditor();
                    }
                    if (typeof window.updateApplyButtonState === 'function') {
                        window.updateApplyButtonState();
                    }
                }, 150);
            } else if (tabText.includes('dutos') || tabText.includes('duto')) {
                console.log(' Tab de dutos clicada');
                
                setTimeout(() => {
                    if (typeof window.loadDutos === 'function') {
                        window.loadDutos();
                    }
                }, 150);
            } else if (tabText.includes('tubos') || tabText.includes('tubo')) {
                console.log(' Tab de tubos clicada');
                
                setTimeout(() => {
                    if (typeof window.loadTubos === 'function') {
                        window.loadTubos();
                    }
                }, 150);
            } else if (tabText.includes('acessorio') || tabText.includes('acessorie')) {
                console.log(' Tab de acessorios clicada');
                
                setTimeout(() => {
                    if (typeof window.loadAcessorios === 'function') {
                        window.loadAcessorios();
                    } else if (typeof window.loadAcessoriesData === 'function') {
                        window.loadAcessoriesData();
                    }
                }, 150);
            }
        });
    });
    
    // Inicializar a tab ativa se houver
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        const onclickAttr = activeTab.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/'([^']+)'/);
            if (match && match[1]) {
                setTimeout(() => {
                    if (match[1] === 'dashboard') {
                        initializeDashboard();
                    } else if (match[1] === 'adminCredentials') {
                        initializeAdminCredentials();
                    }
                }, 200);
            }
        }
    }
});

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
            banco_acessorios: Object.keys(systemData.banco_acessorios || {}).length,
            dutos: {
                tipos: systemData.dutos?.tipos?.length || 0,
                opcionais: systemData.dutos?.opcionais?.length || 0
            },
            tubos: systemData.tubos?.length || 0,
            administradores: systemData.administradores?.length || 0,
            ADM: systemData.ADM?.length || 0
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
            
            // Campos obrigatórios
            const requiredKeys = ['constants', 'machines', 'materials', 'empresas', 'banco_acessorios', 'dutos', 'tubos', 'administradores', 'ADM'];
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
            if (typeof parsed.banco_acessorios !== 'object') {
                throw new Error('banco_acessorios deve ser um objeto');
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
            if (!Array.isArray(parsed.tubos)) {
                throw new Error('tubos deve ser um array');
            }
            if (!Array.isArray(parsed.administradores)) {
                throw new Error('administradores deve ser um array');
            }
            if (!Array.isArray(parsed.ADM)) {
                throw new Error('ADM deve ser um array');
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
    
    console.log(' EVENTO dataLoaded recebido na main.js');
    console.log(' Dados recebidos:', {
        constants: Object.keys(data.constants || {}).length,
        machines: data.machines?.length || 0,
        materials: Object.keys(data.materials || {}).length,
        empresas: data.empresas?.length || 0,
        banco_acessorios: Object.keys(data.banco_acessorios || {}).length,
        dutos: {
            tipos: data.dutos?.tipos?.length || 0,
            opcionais: data.dutos?.opcionais?.length || 0
        },
        tubos: data.tubos?.length || 0,
        administradores: data.administradores?.length || 0,
        ADM: data.ADM?.length || 0
    });
    
    // Atualiza window.systemData com os dados recebidos
    window.systemData = data;
    
    // Carrega todos os componentes
    setTimeout(() => {
        if (window.loadConstants) window.loadConstants();
        if (window.loadMachines) window.loadMachines();
        if (window.loadMaterials) window.loadMaterials();
        if (window.loadEmpresas) window.loadEmpresas();
        if (window.loadAcessorios) window.loadAcessorios();
        if (window.loadDutos) window.loadDutos();
        if (window.loadTubos) window.loadTubos();
        if (window.filterMachines) window.filterMachines();
        if (window.loadJSONEditor) window.loadJSONEditor();
        
        // Atualiza as novas abas
        initializeDashboard();
        initializeAdminCredentials();
        
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
    
    console.log(' EVENTO dataImported recebido');
    window.systemData = data;
    
    if (window.loadConstants) window.loadConstants();
    if (window.loadMachines) window.loadMachines();
    if (window.loadMaterials) window.loadMaterials();
    if (window.loadEmpresas) window.loadEmpresas();
    if (window.loadAcessorios) window.loadAcessorios();
    if (window.loadDutos) window.loadDutos();
    if (window.loadTubos) window.loadTubos();
    if (window.filterMachines) window.filterMachines();
    if (window.loadJSONEditor) window.loadJSONEditor();
    
    // Atualiza as novas abas
    initializeDashboard();
    initializeAdminCredentials();
    
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
    
    console.log(' EVENTO dataApplied recebido:', changes);
    
    // Atualizar window.systemData
    window.systemData = data;
    
    // Atualizar JSON Editor com os novos dados
    if (window.loadJSONEditor) {
        window.loadJSONEditor();
    }
    
    // Atualizar todas as tabs
    if (window.loadConstants) window.loadConstants();
    if (window.loadMachines) window.loadMachines();
    if (window.loadMaterials) window.loadMaterials();
    if (window.loadEmpresas) window.loadEmpresas();
    if (window.loadAcessorios) window.loadAcessorios();
    if (window.loadDutos) window.loadDutos();
    if (window.loadTubos) window.loadTubos();
    
    // Atualiza as novas abas
    initializeDashboard();
    initializeAdminCredentials();
    
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
    console.log('Tem banco_acessorios?', 'banco_acessorios' in window.systemData);
    console.log('Tem dutos?', 'dutos' in window.systemData);
    console.log('Tem tubos?', 'tubos' in window.systemData);
    console.log('Tem administradores?', 'administradores' in window.systemData);
    console.log('Tem ADM?', 'ADM' in window.systemData);
    console.log('banco_acessorios:', window.systemData?.banco_acessorios);
    console.log('dutos:', window.systemData?.dutos);
    console.log('tubos:', window.systemData?.tubos);
    console.log('administradores:', window.systemData?.administradores);
    console.log('ADM:', window.systemData?.ADM);
    console.log('Número de acessorios:', Object.keys(window.systemData?.banco_acessorios || {}).length);
    console.log('Número de tipos de dutos:', window.systemData?.dutos?.tipos?.length || 0);
    console.log('Número de opcionais:', window.systemData?.dutos?.opcionais?.length || 0);
    console.log('Número de tubos:', window.systemData?.tubos?.length || 0);
    console.log('Número de administradores:', window.systemData?.administradores?.length || 0);
    console.log('Número de ADM:', window.systemData?.ADM?.length || 0);
    console.log('Keys de banco_acessorios:', Object.keys(window.systemData?.banco_acessorios || {}));
    
    // Verifica o editor
    const editor = document.getElementById('jsonEditor');
    if (editor && editor.value) {
        try {
            const parsed = JSON.parse(editor.value);
            console.log('Editor tem banco_acessorios?', 'banco_acessorios' in parsed);
            console.log('Editor tem dutos?', 'dutos' in parsed);
            console.log('Editor tem tubos?', 'tubos' in parsed);
            console.log('Editor tem administradores?', 'administradores' in parsed);
            console.log('Editor tem ADM?', 'ADM' in parsed);
            console.log('Acessorios no editor:', Object.keys(parsed?.banco_acessorios || {}).length);
            console.log('Tipos de dutos no editor:', parsed?.dutos?.tipos?.length || 0);
            console.log('Tubos no editor:', parsed?.tubos?.length || 0);
        } catch(e) {
            console.error('Erro ao parsear editor:', e);
        }
    }
};

// Função para forçar recarregamento completo
window.reloadCompleteData = async function() {
    console.log(' Forçando recarregamento completo...');
    
    try {
        // Busca dados diretamente da API
        const response = await fetch('/api/system-data');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Dados da API:', {
                banco_acessorios: Object.keys(data.banco_acessorios || {}).length,
                dutos: {
                    tipos: data.dutos?.tipos?.length || 0,
                    opcionais: data.dutos?.opcionais?.length || 0
                },
                tubos: data.tubos?.length || 0,
                administradores: data.administradores?.length || 0,
                ADM: data.ADM?.length || 0
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

// ==================== INICIALIZAÇÃO EXTRA ====================

// Adiciona listener para debug quando o sistema está pronto
setTimeout(() => {
    console.log('✅ Sistema completamente inicializado');
    console.log(' Estado final do systemData:', {
        constants: Object.keys(window.systemData?.constants || {}).length,
        machines: window.systemData?.machines?.length || 0,
        materials: Object.keys(window.systemData?.materials || {}).length,
        empresas: window.systemData?.empresas?.length || 0,
        banco_acessorios: Object.keys(window.systemData?.banco_acessorios || {}).length,
        dutos: {
            tipos: window.systemData?.dutos?.tipos?.length || 0,
            opcionais: window.systemData?.dutos?.opcionais?.length || 0
        },
        tubos: window.systemData?.tubos?.length || 0,
        administradores: window.systemData?.administradores?.length || 0,
        ADM: window.systemData?.ADM?.length || 0
    });
    
    // Inicializa as abas se estiverem ativas
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab) {
        if (activeTab.id === 'dashboardTab') {
            initializeDashboard();
        } else if (activeTab.id === 'adminCredentialsTab') {
            initializeAdminCredentials();
        }
    }
}, 2000);
