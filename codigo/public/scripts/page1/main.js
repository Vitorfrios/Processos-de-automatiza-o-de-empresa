// main.js

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
      // Remove event listeners de shutdown automático se existirem
      window.removeEventListener('beforeunload', this.autoShutdown);
      window.removeEventListener('unload', this.autoShutdown);
      window.removeEventListener('pagehide', this.autoShutdown);
  }

  createShutdownButton() {
    // Verifica se o botão já existe
    if (document.querySelector('.shutdown-btn')) return;
    
    // Cria botão no header
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
                
                // ✅ USA a função CORRETA do server.js
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

/**
 * Carrega todos os módulos do sistema dinamicamente e os atribui ao escopo global
 * Garante que todas as funções estejam disponíveis no objeto window
 */
async function loadAllModules() {
  if (modulesLoaded) return;
  
  try {
    const modules = await Promise.all([
      import('./ui/interface.js'),
      import('./ui/edit.js'),
      import('./data/projects.js'),
      import('./data/rooms.js'),
      import('./calculos/calculos-manager.js'),
      import('./utils/utils.js')
    ]);

    const [
      interfaceModule,
      editModule,
      projectsModule,
      roomsModule,
      calculosModule,
      utilsModule
    ] = modules;

    // ✅ CORREÇÃO: ATRIBUIR FUNÇÕES DE TOGGLE PRIMEIRO
    const toggleFunctions = {
      // UI Interface - FUNÇÕES DE TOGGLE PRIMEIRO
      toggleSection: interfaceModule.toggleSection,
      toggleSubsection: interfaceModule.toggleSubsection,
      toggleObra: interfaceModule.toggleObra,
      toggleProject: interfaceModule.toggleProject,
      toggleRoom: interfaceModule.toggleRoom,
      collapseElement: interfaceModule.collapseElement,
      expandElement: interfaceModule.expandElement,

      // Restante das funções
      addNewObra: interfaceModule.addNewObra,
      addNewProjectToObra: interfaceModule.addNewProjectToObra,
      showSystemStatus: interfaceModule.showSystemStatus,
      saveOrUpdateObra: interfaceModule.saveOrUpdateObra,
      verifyObraData: interfaceModule.verifyObraData,
      deleteObra: interfaceModule.deleteObra,

      // Edit
      makeEditable: editModule.makeEditable,

      // Projects
      deleteProject: projectsModule.deleteProject,
      saveObra: projectsModule.saveObra,

      // Rooms
      addNewRoom: roomsModule.addNewRoom,
      deleteRoom: roomsModule.deleteRoom,
      addMachine: roomsModule.addMachine,
      deleteMachine: roomsModule.deleteMachine,
      createEmptyRoom: roomsModule.createEmptyRoom,

      // Cálculos
      calculateVazaoArAndThermalGains: calculosModule.calculateVazaoArAndThermalGains,
      calculateVazaoAr: calculosModule.calculateVazaoAr,
      calculateThermalGains: calculosModule.calculateThermalGains,

      // Utils
      ensureStringId: utilsModule.ensureStringId
    };

    // ✅ CORREÇÃO: Atribuir todas as funções ao window de uma vez
    Object.assign(window, toggleFunctions);

    modulesLoaded = true;
    console.log("✅ Todos os módulos foram carregados com sucesso");
    console.log("✅ Funções de toggle disponíveis:", {
      toggleSection: typeof window.toggleSection,
      toggleSubsection: typeof window.toggleSubsection,
      toggleObra: typeof window.toggleObra,
      toggleProject: typeof window.toggleProject,
      toggleRoom: typeof window.toggleRoom
    });
    
  } catch (error) {
    console.error("❌ Erro ao carregar módulos:", error);
  }
}

/**
 * Carrega as constantes do sistema do servidor
 * Essenciais para todos os cálculos do sistema
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
      console.error("❌ ERRO: Constantes essenciais não encontradas no JSON:", {
        VARIAVEL_PD: window.systemConstants.VARIAVEL_PD,
        VARIAVEL_PS: window.systemConstants.VARIAVEL_PS
      });
      throw new Error("Constantes essenciais não encontradas no JSON");
    }
    
    if (window.showSystemStatus) {
      window.showSystemStatus("Constantes do sistema carregadas com sucesso", "success")
    }
  } catch (error) {
    console.error("❌ ERRO CRÍTICO ao carregar constantes:", error)
    
    // ✅ DETECTA ERRO DE CONEXÃO E MOSTRA MENSAGEM AMIGÁVEL
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('404') ||
        error.message.includes('Not Found')) {
      throw error; // Para cair no catch principal
    }
    
    if (window.showSystemStatus) {
      window.showSystemStatus("ERRO CRÍTICO: Não foi possível carregar as constantes do sistema. Verifique o servidor.", "error")
    }
    throw error;
  }
}

/**
 * Verifica se é necessário criar uma obra base - CORREÇÃO: NÃO CRIA AUTOMATICAMENTE
 */
async function verifyAndCreateBaseObra() {
  console.log("🔍 Verificando obras existentes...");
  
  // Aguardar para garantir carregamento
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const currentCount = getGeralCount();
  const obrasInDOM = document.querySelectorAll('.obra-block').length;
  
  console.log(`📊 Estado atual - GeralCount: ${currentCount}, Obras no DOM: ${obrasInDOM}`);
  
  // ✅ CORREÇÃO: NÃO CRIA OBRA AUTOMATICAMENTE
  if (obrasInDOM === 0 && currentCount === 0) {
    console.log("📭 Sistema iniciado vazio - aguardando ação do usuário");
    console.log("💡 Dica: Clique em 'Nova Obra' para começar");
  }
}

/**
 * Função de debug para verificar o estado final do sistema após inicialização
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
  
  // Debug detalhado das funções de toggle
  console.log('- Funções de toggle disponíveis:', {
    toggleSection: typeof window.toggleSection,
    toggleSubsection: typeof window.toggleSubsection,
    toggleObra: typeof window.toggleObra,
    toggleProject: typeof window.toggleProject,
    toggleRoom: typeof window.toggleRoom
  });
}

/**
 * 
 * @returns {Promise<void>} - Opera��o conclu�da.
 * @example checkAndLoadExistingSession() // Opera��o conclu�da.
 */
async function checkAndLoadExistingSession() {
  try {
    console.log("🔍 Verificando se há sessão com obras salvas...");
    
    const sessionResponse = await fetch('/api/session-obras');
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      const obraIds = sessionData.obras || [];
      
      console.log(`📊 Sessão encontrada com ${obraIds.length} obras:`, obraIds);
      
      if (obraIds.length > 0) {
        console.log("🔄 Carregando obras existentes da sessão...");
        
        // ✅ Ativar sessão via sessionStorage diretamente
        try {
          sessionStorage.setItem('session_active', 'true');
          console.log("✅ Sessão ativada via sessionStorage");
        } catch (error) {
          console.error("❌ Erro ao ativar sessão:", error);
        }
        
        // ✅ CARREGA as obras
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
 * Mostra mensagem amigável quando o servidor está offline
 * @returns {void}
 */
function showServerOfflineMessage() {
    console.log("🔄 Mostrando mensagem de servidor offline...");
    
    // Remove qualquer mensagem anterior
    const existingMessage = document.getElementById('server-offline-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Cria a div de mensagem
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
    
    // Adiciona ao body
    document.body.appendChild(messageDiv);
    
    // Adiciona animação de bounce
    const style = document.createElement('style');
    style.textContent = `
        @keyframes iconPulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
            40% {transform: translateY(-20px);}
            60% {transform: translateY(-10px);}
        }

        @media (max-width: 480px) {
            .toast-style {
                padding: 1.5rem !important;
                margin: 1rem !important;
                width: 90vw !important;
            }
            
            .modal-actions {
                flex-direction: column !important;
            }
            
            .modal-btn {
                width: 100% !important;
                min-width: auto !important;
            }
            
            .modal-icon {
                font-size: 3rem !important;
            }
            
            .modal-title {
                font-size: 1.4rem !important;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Contador regressivo
    let countdown = 10;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            // ===== Aqui fecha a window ===== //
            window.close();
        }
    }, 1000);
    
    // ===== Aqui fecha a window ===== //
    setTimeout(() => {
        window.close();
    }, 10000);
}

/**
 * Inicialização principal do sistema quando o DOM estiver carregado
 */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Inicializando sistema...");
  
  try {
    // 0. Inicializar sistema de shutdown primeiro
    shutdownManager = new ShutdownManager();
    
    // 1. ✅ CORREÇÃO: CARREGAR MÓDULOS PRIMEIRO (INCLUINDO TOGGLE FUNCTIONS)
    await loadAllModules();
    
    // 2. Carregar constantes do sistema
    await loadSystemConstants();
    
    // ✅ VERIFICAR E CARREGAR SESSÃO EXISTENTE
    const hasExistingSession = await checkAndLoadExistingSession();
    
    if (!hasExistingSession) {
      console.log("📭 Nenhuma sessão existente - sistema começa vazio");
      console.log("💡 Dica: Clique em 'Nova Obra' para começar");
    }
    
    // 3. Verificar obras existentes (agora só para obras locais)
    await verifyAndCreateBaseObra();
    
    console.log("✅ Sistema inicializado com sucesso - PRONTO PARA USO");
    
    // Mostrar status do sistema para usuário
    setTimeout(() => {
      if (window.showSystemStatus) {
        const message = hasExistingSession 
          ? `Sessão carregada com ${document.querySelectorAll('.obra-block').length} obra(s)!` 
          : "Sistema carregado. Clique em 'Nova Obra' para começar.";
        const type = hasExistingSession ? "success" : "success";
        window.showSystemStatus(message, type);
      }
    }, 500);
    
    // Debug final
    setTimeout(finalSystemDebug, 1000);
    
  } catch (error) {
    console.error("❌ ERRO na inicialização do sistema:", error);
    
    // ✅ DETECTA ERRO DE CONEXÃO E MOSTRA MENSAGEM AMIGÁVEL
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