// main.js - VERSÃO CORRIGIDA COM ORDEM CORRETA

// Inicializar variáveis globais simples
window.systemConstants = null;
window.obraCounter = 0;
window.GeralCount = 0;

console.log(" Variáveis globais inicializadas:", {
  systemConstants: window.systemConstants,
  obraCounter: window.obraCounter,
  GeralCount: window.GeralCount
});

// Importar APENAS o necessário para inicialização
import { loadObrasFromServer, getGeralCount } from './data/server.js'

// Carregar módulos dinamicamente
let modulesLoaded = false;

/**
 * Sistema de Shutdown Manual
 */
class ShutdownManager {
  constructor() {
      this.init();
  }

  init() {
      console.log('🔒 Sistema de shutdown manual ativado');
      this.disableAutoShutdown();
      this.createShutdownButton();
  }

  disableAutoShutdown() {
      window.removeEventListener('beforeunload', this.autoShutdown);
      window.removeEventListener('unload', this.autoShutdown);
      window.removeEventListener('pagehide', this.autoShutdown);
  }

  createShutdownButton() {
    if (document.querySelector('.shutdown-btn')) return;
    
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        const shutdownBtn = document.createElement('button');
        shutdownBtn.className = 'shutdown-btn';
        shutdownBtn.innerHTML = '⏻';
        shutdownBtn.title = 'Encerrar Servidor';
        shutdownBtn.onclick = () => this.shutdownManual();
        
        headerRight.appendChild(shutdownBtn);
        console.log('✅ Botão de shutdown adicionado ao header');
    }
  }

  async shutdownManual() {
        if (confirm('Deseja realmente ENCERRAR o servidor?')) {
            try {
                console.log('🔄 Executando shutdown COMPLETO...');
                
                if (typeof window.shutdownManual === 'function') {
                    await window.shutdownManual();
                } else {
                    console.error('❌ Função shutdownManual não encontrada');
                }
                
            } catch (error) {
                console.log('🔌 Servidor encerrado ou não responde:', error);
            }
        }
    }
}

// Inicializar shutdown manager
let shutdownManager = null;

// ✅ CORREÇÃO CRÍTICA: DEFINIR FUNÇÕES GLOBAIS PRIMEIRO - ANTES DE QUALQUER OUTRA COISA
window.createEmptyObra = async function(obraName, obraId) {
    try {
        if (typeof window._createEmptyObra === 'function') {
            return window._createEmptyObra(obraName, obraId);
        }
        
        const obraManager = await import('./ui/intr-files/obra-manager.js');
        if (obraManager && obraManager.createEmptyObra) {
            window._createEmptyObra = obraManager.createEmptyObra;
            return obraManager.createEmptyObra(obraName, obraId);
        }
        
        throw new Error('createEmptyObra não encontrada');
    } catch (error) {
        console.error('❌ Erro em createEmptyObra:', error);
        return false;
    }
};

// ✅ CORREÇÃO: Garantir que createEmptyProject esteja disponível globalmente ANTES do carregamento
window.createEmptyProject = async function(obraId, obraName, projectId, projectName) {
    try {
        // Se já temos a função carregada, usar ela
        if (typeof window._createEmptyProject === 'function') {
            return await window._createEmptyProject(obraId, obraName, projectId, projectName);
        }
        
        // Se não, tentar carregar o módulo
        const projectManager = await import('./ui/intr-files/project-manager.js');
        if (projectManager && projectManager.createEmptyProject) {
            window._createEmptyProject = projectManager.createEmptyProject;
            return await projectManager.createEmptyProject(obraId, obraName, projectId, projectName);
        }
        
        throw new Error('createEmptyProject não encontrada');
    } catch (error) {
        console.error('❌ Erro em createEmptyProject:', error);
        return false;
    }
};

// ✅ CORREÇÃO: Garantir que populateObraData esteja disponível globalmente
window.populateObraData = async function(obraData) {
    try {
        // Tentar carregar o módulo diretamente
        const populateModule = await import('./data/data-files/data-populate.js');
        if (populateModule && populateModule.populateObraData) {
            return await populateModule.populateObraData(obraData);
        }
        throw new Error('populateObraData não encontrada');
    } catch (error) {
        console.error('❌ Erro ao carregar populateObraData:', error);
      
        
        return null;
    }
};

/**
 * Carrega as constantes do sistema do servidor - DEVE VIR ANTES DOS MÓDULOS
 */
async function loadSystemConstants() {
  try {
    console.log("🔍 Carregando constantes do sistema...")
    const response = await fetch(`/constants`)

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const constantsData = await response.json();
    window.systemConstants = constantsData;
    console.log("✅ Constantes carregadas do JSON:", window.systemConstants);
    
    if (!window.systemConstants.VARIAVEL_PD || !window.systemConstants.VARIAVEL_PS) {
      console.error("❌ ERRO: Constantes essenciais não encontradas no JSON");
      throw new Error("Constantes essenciais não encontradas no JSON");
    }
    
    return true;
  } catch (error) {
    console.error("❌ ERRO CRÍTICO ao carregar constantes:", error)
    
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('404') ||
        error.message.includes('Not Found')) {
      throw error;
    }
    
    return false;
  }
}

/**
 * Carrega todos os módulos do sistema dinamicamente - VERSÃO CORRIGIDA
 */
async function loadAllModules() {
  if (modulesLoaded) return;
  
  try {
    console.log("📦 Iniciando carregamento de módulos...");
    
    const modules = await Promise.all([
      import('./ui/interface.js'),
      import('./ui/edit.js'),
      import('./data/projects.js'),
      import('./data/rooms.js'),
      import('./features/calculos/calculos-manager.js'),
      import('./utils/utils.js'),
      import('./ui/intr-files/project-manager.js'),
      import('./ui/intr-files/status-manager.js')

    ]);
    

    const [
      interfaceModule,
      editModule,
      projectsModule,
      roomsModule,
      calculosModule,
      utilsModule,
      projectManagerModule,  // ✅ NOVO
      statusManagerModule     // ✅ NOVO
    ] = modules;

    // ✅ CORREÇÃO: Atribuir TODAS as funções ao window - VERSÃO COMPLETA
    const allFunctions = {
      // UI Interface
      toggleSection: interfaceModule.toggleSection,
      toggleSubsection: interfaceModule.toggleSubsection,
      toggleObra: interfaceModule.toggleObra,
      toggleProject: interfaceModule.toggleProject,
      toggleRoom: interfaceModule.toggleRoom,
      collapseElement: interfaceModule.collapseElement,
      expandElement: interfaceModule.expandElement,
      addNewObra: interfaceModule.addNewObra,
      addNewProjectToObra: interfaceModule.addNewProjectToObra,
      showSystemStatus: statusManagerModule.showSystemStatus,
      saveOrUpdateObra: interfaceModule.saveOrUpdateObra,
      verifyObraData: projectsModule.verifyObraData,
      deleteObra: interfaceModule.deleteObra,

      // Edit
      makeEditable: editModule.makeEditable,

      // Projects - ✅ CORREÇÃO: AGORA COM TODAS AS FUNÇÕES
      deleteProject: projectsModule.deleteProject,
      saveObra: projectsModule.saveObra,
      fetchObras: projectsModule.fetchObras,
      salvarObra: projectsModule.salvarObra,
      atualizarObra: projectsModule.atualizarObra,

      // Rooms
      addNewRoom: roomsModule.addNewRoom,
      deleteRoom: roomsModule.deleteRoom,
      addMachine: roomsModule.addMachine,
      createEmptyRoom: roomsModule.createEmptyRoom,

      // Cálculos
      calculateVazaoArAndThermalGains: calculosModule.calculateVazaoArAndThermalGains,
      calculateVazaoAr: calculosModule.calculateVazaoAr,
      calculateThermalGains: calculosModule.calculateThermalGains,

      // Utils
      ensureStringId: utilsModule.ensureStringId
    };

    // ✅ CORREÇÃO: Verificar cada função antes de atribuir
    Object.keys(allFunctions).forEach(funcName => {
      if (typeof allFunctions[funcName] === 'function') {
        window[funcName] = allFunctions[funcName];
        console.log(`✅ ${funcName} atribuída ao window`);
      } else {
        console.error(`❌ ${funcName} não é uma função:`, typeof allFunctions[funcName]);
      }
    });

    modulesLoaded = true;
    console.log("✅ Todos os módulos foram carregados com sucesso");
    return true;
    
  } catch (error) {
    console.error("❌ Erro ao carregar módulos:", error);
    return false;
  }
}

/**
 * Verifica e carrega sessão existente - CORREÇÃO PARA NOVA ESTRUTURA DA API
 */
async function checkAndLoadExistingSession() {
  try {
    console.log("🔍 Verificando se há sessão com obras salvas...");
    
    const sessionResponse = await fetch('/api/session-obras');
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      
      // ✅ CORREÇÃO: Processar nova estrutura da API {session_id: 'session_active', obras: Array(5)}
      let obraIds = [];
      
      if (sessionData.obras && Array.isArray(sessionData.obras)) {
        obraIds = sessionData.obras;
      } else if (sessionData.sessions && sessionData.sessions.session_active && sessionData.sessions.session_active.obras) {
        obraIds = sessionData.sessions.session_active.obras;
      }
      
      console.log(`📊 Sessão encontrada com ${obraIds.length} obras:`, obraIds);
      
      if (obraIds.length > 0) {
        console.log("🔄 Carregando obras existentes da sessão...");
        
        try {
          sessionStorage.setItem('session_active', 'true');
          console.log("✅ Sessão ativada via sessionStorage");
        } catch (error) {
          console.error("❌ Erro ao ativar sessão:", error);
        }
        
        await loadObrasFromServer();
        console.log("✅ Sessão existente carregada automaticamente");
        return true;
      }
    }
    
    console.log("📭 Nenhuma sessão com obras encontrada - sistema inicia vazio");
    return false;
    
  } catch (error) {
    console.log("📭 Nenhuma sessão ativa ou erro ao verificar:", error);
    return false;
  }
}

/**
 * Verifica se é necessário criar uma obra base
 */
async function verifyAndCreateBaseObra() {
  console.log("🔍 Verificando obras existentes...");
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const currentCount = getGeralCount();
  const obrasInDOM = document.querySelectorAll('.obra-block').length;
  
  console.log(`📊 Estado atual - GeralCount: ${currentCount}, Obras no DOM: ${obrasInDOM}`);
  
  if (obrasInDOM === 0 && currentCount === 0) {
    console.log("📭 Sistema iniciado vazio - aguardando ação do usuário");
    console.log("💡 Dica: Clique em 'Nova Obra' para começar");
  }
}

/**
 * Função de debug para verificar o estado final do sistema
 */
function finalSystemDebug() {
  console.log('=== DEBUG FINAL DO SISTEMA ===');
  console.log('- window.GeralCount:', window.GeralCount);
  console.log('- getGeralCount():', getGeralCount());
  console.log('- Obras no DOM:', document.querySelectorAll('.obra-block').length);
  console.log('- Projetos no DOM:', document.querySelectorAll('.project-block').length);
  console.log('- Salas no DOM:', document.querySelectorAll('.room-block').length);
  console.log('- Módulos carregados:', modulesLoaded);
  console.log('- Constantes carregadas:', !!window.systemConstants);
  console.log('- Shutdown Manager:', !!shutdownManager);
  
  console.log('- Funções de toggle disponíveis:', {
    toggleSection: typeof window.toggleSection,
    toggleSubsection: typeof window.toggleSubsection,
    toggleObra: typeof window.toggleObra,
    toggleProject: typeof window.toggleProject,
    toggleRoom: typeof window.toggleRoom
  });
}

/**
 * Mostra mensagem amigável quando o servidor está offline
 */
function showServerOfflineMessage() {
    console.log("🔄 Mostrando mensagem de servidor offline...");
    
    const existingMessage = document.getElementById('server-offline-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'server-offline-message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0,0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        font-family: Arial, sans-serif;
    `;
    
    messageDiv.innerHTML = `
        <div class="modal-content toast-style" style="
            background: #2d3748 !important;
            color: white !important;
            border-left: 4px solid #4299e1 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 2rem !important;
            max-width: 500px !important;
            border-radius: 15px;
            text-align: center;
        ">
            <div class="modal-icon" style="
                color: #4299e1 !important;
                animation: iconPulse 2s infinite ease-in-out;
                font-size: 3.5rem !important;
                margin-bottom: 1rem !important;
            ">🔌</div>
            
            <h2 class="modal-title" style="
                color: white !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                font-size: 1.6rem !important;
                margin-bottom: 1rem !important;
            ">Servidor Offline</h2>
            
            <p class="modal-message" style="
                color: rgba(255, 255, 255, 0.9) !important;
                text-align: left !important;
                margin-bottom: 1.5rem !important;
            ">
                <strong style="
                    color: #ff6b6b !important;
                    display: block;
                    margin-bottom: 1rem !important;
                    font-size: 1.1rem !important;
                    text-align: center !important;
                ">O servidor foi encerrado</strong>
                
                <div class="warning-list" style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1.2rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                    border-left: 3px solid #4299e1;
                ">
                    Para continuar usando o sistema:
                    <ul style="
                        text-align: left;
                        margin: 0.5rem 0 0 0;
                        padding-left: 1.5rem;
                        color: rgba(255, 255, 255, 0.8);
                    ">
                      <li style="margin-top: 15px; margin-bottom: 0.5rem; padding-left: 0.5rem;">Inicie novamente o servidor</li>
                      <li style="padding-left: 0.5rem;">Esta página será fechada automaticamente</li>
                    </ul>
                </div>
                
                <div class="warning-note" style="
                    background: rgba(255, 107, 107, 0.1);
                    padding: 1rem;
                    border-radius: 6px;
                    border-left: 3px solid #ff6b6b;
                    margin-top: 1rem;
                ">
                    <small style="
                        color: rgba(255, 255, 255, 0.8) !important;
                        font-size: 0.9rem !important;
                        line-height: 1.4;
                        display: block;
                    ">
                        ⏳ Esta janela será fechada automaticamente em <strong id="countdown">10</strong> segundos...
                    </small>
                </div>
            </p>
            
            <div class="modal-actions" style="
                margin-top: 1.5rem !important;
                gap: 1rem !important;
                display: flex;
                justify-content: center;
            ">
                <button onclick="window.close()" class="modal-btn btn-confirm" style="
                    padding: 0.8rem 1.5rem !important;
                    min-width: 120px !important;
                    font-size: 0.95rem !important;
                    background: #e53e3e !important;
                    color: white !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    border-radius: 6px;
                    cursor: pointer;
                ">
                    Fechar Agora
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes iconPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    let countdown = 10;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            window.close();
        }
    }, 1000);
    
    setTimeout(() => {
        window.close();
    }, 10000);
}

/**
 * Verifica funções críticas do sistema
 */
function verifyCriticalFunctions() {
    const criticalFunctions = [
        'createEmptyObra',
        'createEmptyProject', 
        'createEmptyRoom',
        'populateObraData',
        'addMachine'
    ];
    
    console.log('🔍 Verificando funções críticas...');
    criticalFunctions.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            console.error(`❌ CRÍTICO: ${funcName} não está disponível globalmente`);
        } else {
            console.log(`✅ ${funcName} disponível globalmente`);
        }
    });
}

/**
 * Inicialização principal do sistema - ORDEM CORRIGIDA
 */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Inicializando sistema...");
  
  try {
    // ✅ ORDEM CORRETA DE INICIALIZAÇÃO:
    
    // 1. Inicializar sistema de shutdown primeiro (não crítico)
    shutdownManager = new ShutdownManager();
    
    // 2. ✅ CORREÇÃO CRÍTICA: DEFINIR FUNÇÕES GLOBAIS PRIMEIRO
    console.log("🔧 Definindo funções globais críticas...");
    // Já definidas no topo do arquivo - createEmptyObra, createEmptyProject, populateObraData
    
    // 3. Carregar constantes do sistema (crítico para cálculos)
    console.log("📊 Carregando constantes do sistema...");
    const constantsLoaded = await loadSystemConstants();
    if (!constantsLoaded) {
      throw new Error("Não foi possível carregar constantes do sistema");
    }
    
    // 4. Carregar todos os módulos do sistema
    console.log("📦 Carregando módulos do sistema...");
    const modulesLoadedSuccess = await loadAllModules();
    if (!modulesLoadedSuccess) {
      console.warn("⚠️ Alguns módulos não carregaram completamente");
    }
    
    // 5. ✅ VERIFICAR E CARREGAR SESSÃO EXISTENTE (agora com funções disponíveis)
    console.log("🔍 Verificando sessão existente...");
    const hasExistingSession = await checkAndLoadExistingSession();
    
    if (!hasExistingSession) {
      console.log("📭 Nenhuma sessão existente - sistema começa vazio");
      console.log("💡 Dica: Clique em 'Nova Obra' para começar");
    }
    
    // 6. Verificar obras existentes
    await verifyAndCreateBaseObra();
    
    console.log("✅ Sistema inicializado com sucesso - PRONTO PARA USO");
    
    // Mostrar status do sistema para usuário
    setTimeout(() => {
      if (window.showSystemStatus) {
        const message = hasExistingSession 
          ? `Sessão carregada com ${document.querySelectorAll('.obra-block').length} obra(s)!` 
          : "Sistema carregado. Clique em 'Nova Obra' para começar.";
        window.showSystemStatus(message, "success");
      }
    }, 500);
    
    // Debug final
    setTimeout(finalSystemDebug, 1000);
    
    // ✅ CORREÇÃO: Verificar funções críticas após inicialização completa
    setTimeout(verifyCriticalFunctions, 2000);
    
  } catch (error) {
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
});