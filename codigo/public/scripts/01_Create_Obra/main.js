/**
 * main.js - ARQUIVO PRINCIPAL
 * Sistema principal com controle de carregamento
 */

// ✅ IMPORTAR LOGGER
import { createSmartLogger } from './core/logger.js';

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

// ✅ VARIÁVEIS GLOBAIS
window.systemConstants = null;
window.obraCounter = 0;
window.GeralCount = 0;
window.systemLoaded = false;

console.log("🚀 Variáveis globais inicializadas:", {
  systemConstants: window.systemConstants,
  obraCounter: window.obraCounter,
  GeralCount: window.GeralCount,
  systemLoaded: window.systemLoaded
});

// ✅ IMPORTAR DOS MÓDULOS PRINCIPAIS
import { initializeSystem } from './main-folder/system-init.js';
import { checkAndLoadExistingSession } from './main-folder/session-manager-main.js';
import { showServerOfflineMessage } from './main-folder/error-handler.js';
import { configurarAutoFormatacaoData } from './empresa-form-manager.js';

/**
 * ✅ VERIFICA SE O SISTEMA ESTÁ 100% CARREGADO
 * Baseado na presença da div de status de sucesso
 */
function checkSystemLoaded() {
    const statusBanner = document.querySelector('#system-status-banner.system-status-banner.success');
    const isLoaded = !!statusBanner;
    
    if (isLoaded && !window.systemLoaded) {
        console.log('✅ SISTEMA 100% CARREGADO - Botão Nova Obra liberado');
        window.systemLoaded = true;
        updateAddObraButtonState();
        setupAddObraButtonProtection();
    }
    
    return isLoaded;
}

/**
 * ✅ ATUALIZA ESTADO DO BOTÃO "NOVA OBRA"
 */
function updateAddObraButtonState() {
    const addButton = document.getElementById('add-obra-btn');
    if (!addButton) {
        console.log('🔍 Botão add-obra-btn ainda não encontrado no DOM');
        return;
    }
    
    if (window.systemLoaded) {
        // ✅ Sistema carregado - botão funciona normalmente
        addButton.disabled = false;
        addButton.style.opacity = '1';
        addButton.style.cursor = 'pointer';
        addButton.title = 'Clique para adicionar uma nova obra';
        console.log('✅ Botão Nova Obra habilitado');
    } else {
        // ❌ Sistema não carregado - botão desabilitado
        addButton.disabled = true;
        addButton.style.opacity = '0.6';
        addButton.style.cursor = 'not-allowed';
        addButton.title = 'Sistema ainda não carregou completamente';
        console.log('⏳ Botão Nova Obra desabilitado - aguardando carregamento');
    }
}

/**
 * ✅ MOSTRA MENSAGEM RÁPIDA DE SISTEMA NÃO CARREGADO
 */
function showSystemNotLoadedMessage() {
    const tempMessage = document.createElement('div');
    tempMessage.textContent = '⏳ Sistema ainda não foi 100% carregado...';
    tempMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff9800;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: fadeInOut 2.5s ease-in-out;
    `;
    
    if (!document.querySelector('#system-loading-styles')) {
        const style = document.createElement('style');
        style.id = 'system-loading-styles';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-10px); }
                20% { opacity: 1; transform: translateY(0); }
                80% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(tempMessage);
    
    setTimeout(() => {
        if (tempMessage.parentNode) {
            tempMessage.parentNode.removeChild(tempMessage);
        }
    }, 2500);
}

/**
 * ✅ WRAPPER PARA A FUNÇÃO addNewObra ORIGINAL
 * Impede execução se sistema não estiver carregado
 */
function setupAddObraButtonProtection() {
    if (typeof window.addNewObra !== 'function') {
        console.log('⏳ addNewObra ainda não disponível - aguardando...');
        setTimeout(setupAddObraButtonProtection, 1000);
        return;
    }
    
    console.log('✅ Função addNewObra encontrada - configurando proteção');
    
    const originalAddNewObra = window.addNewObra;
    
    window.addNewObra = function(...args) {
        if (!window.systemLoaded) {
            console.warn('⚠️ Tentativa de adicionar obra bloqueada - sistema não carregado');
            showSystemNotLoadedMessage();
            return false;
        }
        
        console.log('✅ Sistema carregado - executando addNewObra normalmente');
        return originalAddNewObra.apply(this, args);
    };
    
    console.log('✅ Proteção do botão Nova Obra configurada com sucesso');
}

/**
 * ✅ PROTEGE CLIQUE DIRETO NO BOTÃO
 */
function setupDirectButtonProtection() {
    const checkButton = setInterval(() => {
        const addButton = document.getElementById('add-obra-btn');
        
        if (addButton) {
            console.log('✅ Botão Nova Obra encontrado no DOM - configurando proteção direta');
            
            const newButton = addButton.cloneNode(true);
            addButton.parentNode.replaceChild(newButton, addButton);
            
            newButton.addEventListener('click', function(e) {
                if (!window.systemLoaded) {
                    console.warn('⚠️ Clique direto no botão bloqueado - sistema não carregado');
                    showSystemNotLoadedMessage();
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                console.log('✅ Clique autorizado - sistema carregado');
            });
            
            clearInterval(checkButton);
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(checkButton);
    }, 10000);
}

/**
 * ✅ OBSERVER PARA MONITORAR CARREGAMENTO DO SISTEMA
 */
function setupSystemLoadObserver() {
    const observer = new MutationObserver(function(mutations) {
        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                if (checkSystemLoaded()) {
                    observer.disconnect();
                    console.log('✅ Observer do sistema carregado - desconectado');
                    break;
                }
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Observer do carregamento do sistema iniciado');
    
    const intervalCheck = setInterval(() => {
        if (checkSystemLoaded()) {
            clearInterval(intervalCheck);
            console.log('✅ Verificação periódica do sistema - concluída');
        }
    }, 500);
    
    setTimeout(() => {
        clearInterval(intervalCheck);
        if (!window.systemLoaded) {
            console.warn('⚠️ Timeout do carregamento do sistema - verificando estado atual');
            checkSystemLoaded();
        }
    }, 30000);
}

/**
 * Função de debug para verificar o estado final do sistema
 */
function finalSystemDebug() {
  console.log('=== DEBUG FINAL DO SISTEMA ===');
  console.log('- window.GeralCount:', window.GeralCount);
  console.log('- getGeralCount():', window.getGeralCount ? window.getGeralCount() : 'N/A');
  console.log('- Obras no DOM:', document.querySelectorAll('.obra-block').length);
  console.log('- Projetos no DOM:', document.querySelectorAll('.project-block').length);
  console.log('- Salas no DOM:', document.querySelectorAll('.room-block').length);
  console.log('- Módulos carregados:', !!window.modulesLoaded);
  console.log('- Constantes carregadas:', !!window.systemConstants);
  console.log('- Shutdown Manager:', !!window.shutdownManager);
  console.log('- Empresa Cadastro:', !!window.empresaCadastro);
  console.log('- Sistema Carregado:', window.systemLoaded);
  console.log('- addNewObra disponível:', typeof window.addNewObra === 'function');
  
  console.log('- Funções de toggle disponíveis:', {
    toggleSection: typeof window.toggleSection,
    toggleSubsection: typeof window.toggleSubsection,
    toggleObra: typeof window.toggleObra,
    toggleProject: typeof window.toggleProject,
    toggleRoom: typeof window.toggleRoom
  });
}

/**
 * Verifica se é necessário criar uma obra base
 */
async function verifyAndCreateBaseObra() {
  console.log("🔍 Verificando obras existentes...");
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const currentCount = window.getGeralCount ? window.getGeralCount() : 0;
  const obrasInDOM = document.querySelectorAll('.obra-block').length;
  
  console.log(`📊 Estado atual - GeralCount: ${currentCount}, Obras no DOM: ${obrasInDOM}`);
  
  if (obrasInDOM === 0 && currentCount === 0) {
    console.log("📭 Sistema iniciado vazio - aguardando ação do usuário");
    console.log("💡 Dica: Clique em 'Nova Obra' para começar");
  }
}

/**
 * Handler para erros de inicialização
 */
function handleInitializationError(error) {
  console.error("❌ ERRO na inicialização do sistema:", error);
  
  if (error.message.includes('Failed to fetch') || 
      error.message.includes('ERR_CONNECTION_REFUSED') ||
      error.message.includes('404') ||
      error.message.includes('Not Found') ||
      error.name === 'TypeError') {
    console.log("🔌 Servidor offline detectado - mostrando mensagem...");
    showServerOfflineMessage();
  } else {
    setTimeout(() => {
      console.log("🔄 Sistema em estado de espera");
      if (window.showSystemStatus) {
        window.showSystemStatus("Sistema carregado com avisos", "error");
      }
    }, 1000);
  }
}

/**
 * Mostra mensagem de status do sistema para usuário
 */
function showSystemStatusMessage(hasExistingSession) {
  setTimeout(() => {
    if (window.showSystemStatus) {
      const message = hasExistingSession 
        ? `Sessão carregada com ${document.querySelectorAll('.obra-block').length} obra(s)!` 
        : "Sistema carregado. Clique em 'Nova Obra' para começar.";
      window.showSystemStatus(message, "success");
    }
  }, 500);
}

/**
 * Verifica funções críticas do sistema - MOSTRA APENAS AS CARREGADAS
 */
function verifyCriticalFunctions() {
    const criticalFunctions = [
        'createEmptyObra',
        'createEmptyProject', 
        'createEmptyRoom',
        'populateObraData',
        'addNewObra',
        'addNewProjectToObra',
        'addNewRoom',
        'deleteObra',
        'deleteRoom',
        'calculateVazaoArAndThermalGains',
        'makeEditable'
    ];
    
    console.log('🔍 Verificando funções críticas CARREGADAS...');
    
    const loadedFunctions = [];
    const missingFunctions = [];

    criticalFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            loadedFunctions.push(funcName);
            console.log(`✅ ${funcName} atribuída ao window`); // ✅ MOSTRA APENAS AS CARREGADAS
        }
        else {
            missingFunctions.push(funcName);

        }
    });
    
    console.log(`📊 Total de funções carregadas: ${loadedFunctions.length}/${criticalFunctions.length}`);
    
    // ✅ AGORA MOSTRA APENAS AS QUE FORAM ENCONTRADAS
    if (loadedFunctions.length > 0) {
        console.log('🎯 Funções disponíveis:', loadedFunctions.join(', '));
    } else {
        console.warn('⚠️ Nenhuma função crítica foi carregada');
    }
    console.log(`📊 Resumo: ${loadedFunctions.length}/${criticalFunctions.length} funções carregadas`);
    
    if (missingFunctions.length > 0) {
        console.warn(`⚠️ Funções faltando: ${missingFunctions.join(', ')}`);
    }
}

/**
 * ✅ VERIFICAÇÃO CONTÍNUA DO BOTÃO E ESTADO
 */
function setupContinuousButtonMonitoring() {
    let checkCount = 0;
    const maxChecks = 60;
    
    const monitorInterval = setInterval(() => {
        checkCount++;
        
        updateAddObraButtonState();
        
        if (typeof window.addNewObra === 'function' && !window.addNewObra._protected) {
            setupAddObraButtonProtection();
        }
        
        if (window.systemLoaded || checkCount >= maxChecks) {
            clearInterval(monitorInterval);
            if (window.systemLoaded) {
                console.log('✅ Monitoramento do botão finalizado - sistema carregado');
            } else {
                console.warn('⚠️ Monitoramento do botão finalizado por timeout');
            }
        }
    }, 1000);
}

/**
 * ✅ INICIALIZAR SISTEMA DE AUTO-FORMATAÇÃO DE DATA
 */
function inicializarSistemaData() {
    try {
        // Aguardar um pouco para garantir que o DOM está pronto
        setTimeout(() => {
            configurarAutoFormatacaoData();
            console.log('✅ Sistema de auto-formatação de data inicializado');
            
            // Verificar se há campos de data já existentes no DOM
            const camposData = document.querySelectorAll('.data-cadastro-cadastro, .data-cadastro-input');
            if (camposData.length > 0) {
                console.log(`✅ ${camposData.length} campo(s) de data encontrado(s) - configurando auto-formatação`);
                camposData.forEach(campo => {
                    // Configurar atributos básicos
                    campo.placeholder = 'DD/MM/AAAA';
                    campo.maxLength = 10;
                });
            }
        }, 1000);
    } catch (error) {
        console.warn('⚠️ Erro ao inicializar sistema de auto-formatação de data:', error);
    }
}

/**
 * Inicialização principal do sistema
 */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Inicializando sistema...");
  
  try {
    // ✅ CONFIGURAR PROTEÇÕES IMEDIATAS
    setupDirectButtonProtection();
    setupAddObraButtonProtection();
    setupContinuousButtonMonitoring();
    
    // ✅ INICIAR OBSERVER DO CARREGAMENTO
    setupSystemLoadObserver();
    
    // ✅ INICIALIZAR SISTEMA DE AUTO-FORMATAÇÃO DE DATA
    inicializarSistemaData();
    
    // ✅ Inicializar sistema completo
    await initializeSystem();
    
    // ✅ Verificar e carregar sessão existente
    console.log("🔍 Verificando sessão existente...");
    const hasExistingSession = await checkAndLoadExistingSession();
    
    if (!hasExistingSession) {
      console.log("📭 Nenhuma sessão existente - sistema começa vazio");
      console.log("💡 Dica: Clique em 'Nova Obra' para começar (após carregamento)");
    }
    
    // ✅ Verificar obras existentes
    await verifyAndCreateBaseObra();
    
    console.log("✅ Sistema inicializado com sucesso - PRONTO PARA USO");
    
    // ✅ Mostrar status para usuário
    showSystemStatusMessage(hasExistingSession);
    
    // ✅ Verificação final do estado do sistema
    setTimeout(() => {
        checkSystemLoaded();
        finalSystemDebug();
    }, 1000);
    
    // ✅ Verificar funções críticas após inicialização completa
    setTimeout(verifyCriticalFunctions, 2000);
    
  } catch (error) {
    handleInitializationError(error);
  }
});