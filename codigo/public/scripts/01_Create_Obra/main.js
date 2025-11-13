/**
 * main.js -  PARA NOVA ESTRUTURA DE MÓDULOS
 * 🎯 Compatível com a reorganização completa do sistema
 */

// Inicializar variáveis globais simples
window.systemConstants = null;
window.obraCounter = 0;
window.GeralCount = 0;

console.log("🚀 Variáveis globais inicializadas:", {
  systemConstants: window.systemConstants,
  obraCounter: window.obraCounter,
  GeralCount: window.GeralCount
});

// ✅ IMPORTAR DOS NOVOS MÓDULOS
import { loadObrasFromServer } from './data/adapters/obra-adapter.js';
import { getGeralCount } from './data/adapters/session-adapter.js';
import { shutdownManual } from './data/adapters/shutdown-adapter.js';

// 🆕 IMPORTAR MÓDULO DE EMPRESAS
import EmpresaCadastroInline from './data/builders/empresa-cadastro-inline.js';

// Carregar módulos dinamicamente
let modulesLoaded = false;

/**
 * Sistema de Shutdown Manual - 
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
                
                // ✅ USAR função do novo módulo
                if (typeof shutdownManual === 'function') {
                    await shutdownManual();
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

// 🆕 Inicializar sistema de cadastro de empresas
let empresaCadastro = null;

// FUNÇÕES GLOBAIS ATUALIZADAS PARA NOVA ESTRUTURA
window.createEmptyObra = async function(obraName, obraId) {
    try {
        // ✅ CARREGAR DO NOVO MÓDULO
        const obraManager = await import('./features/managers/obra-manager.js');
        if (obraManager && obraManager.createEmptyObra) {
            return obraManager.createEmptyObra(obraName, obraId);
        }
        
        throw new Error('createEmptyObra não encontrada');
    } catch (error) {
        console.error('❌ Erro em createEmptyObra:', error);
        return false;
    }
};

window.createEmptyProject = async function(obraId, obraName, projectId, projectName) {
    try {
        // ✅ CARREGAR DO NOVO MÓDULO
        const projectManager = await import('./features/managers/project-manager.js');
        if (projectManager && projectManager.createEmptyProject) {
            return await projectManager.createEmptyProject(obraId, obraName, projectId, projectName);
        }
        
        throw new Error('createEmptyProject não encontrada');
    } catch (error) {
        console.error('❌ Erro em createEmptyProject:', error);
        return false;
    }
};

window.populateObraData = async function(obraData) {
    try {
        // ✅ CARREGAR DO NOVO MÓDULO
        const uiBuilders = await import('./data/builders/ui-builders.js');
        if (uiBuilders && uiBuilders.populateObraData) {
            return await uiBuilders.populateObraData(obraData);
        }
        throw new Error('populateObraData não encontrada');
    } catch (error) {
        console.error('❌ Erro ao carregar populateObraData:', error);
        return null;
    }
};

window.createEmptyRoom = async function(obraId, projectId, roomName, roomId) {
    try {
        // ✅ CARREGAR DO NOVO MÓDULO
        const roomsModule = await import('./data/modules/rooms.js');
        if (roomsModule && roomsModule.createEmptyRoom) {
            return await roomsModule.createEmptyRoom(obraId, projectId, roomName, roomId);
        }
        throw new Error('createEmptyRoom não encontrada');
    } catch (error) {
        console.error('❌ Erro em createEmptyRoom:', error);
        return false;
    }
};

// 🆕 FUNÇÃO PARA OBTER DADOS DE EMPRESA PREPARADOS
window.obterDadosEmpresa = function(obraId) {
    if (empresaCadastro && typeof empresaCadastro.obterDadosPreparados === 'function') {
        return empresaCadastro.obterDadosPreparados(obraId);
    }
    return null;
};

/**
 * Carrega as constantes do sistema do servidor
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
 * Carrega todos os módulos do sistema dinamicamente - 
 */
async function loadAllModules() {
  if (modulesLoaded) return;
  try {
      console.log("📦 Iniciando carregamento de módulos...");
      
      // ✅ CARREGAR MÓDULOS - 
      const modules = await Promise.all([
          // UI Components
          import('./ui/interface.js'),                    // interfaceModule
          import('./ui/components/edit.js'),              // editModule
          import('./ui/components/status.js'),            // statusModule
          import('./ui/components/modal/modal.js'),             // modalModule
          import('./ui/components/modal/exit-modal.js'),             // modalModule
          import('./ui/helpers.js'),                      // helpersModule
          
          // Features Managers
          import('./features/managers/obra-manager.js'),  // obraManagerModule
          import('./features/managers/project-manager.js'), // projectManagerModule
          
          // 🆕 MÓDULO DE EMPRESAS
          import('./data/builders/empresa-cadastro-inline.js'), // empresaCadastroModule
          
          // Data Modules - 
          import('./data/modules/rooms.js'),              // roomsModule
          import('./data/modules/climatizacao.js'),       // climatizationModule
          import('./data/modules/configuracao.js'),       // configuracaoModule
          import('./data/modules/machines/machines-core.js'), // machinesCoreModule
          import('./data/modules/machines/capacity-calculator.js'), // capacityCalculatorModule
          
          // Calculations
          import('./features/calculations/air-flow.js'),  // airFlowModule
          import('./features/calculations/calculations-core.js'), // calculationsCoreModule
          
          // Data Utils
          import('./data/utils/id-generator.js'),         // idGeneratorModule
          import('./data/utils/data-utils.js'),           // dataUtilsModule
          
          // Data Builders
          import('./data/builders/ui-builders.js'),       // uiBuildersModule
          import('./data/builders/data-builders.js')      // dataBuildersModule
      ]);

      const [
          // UI Components
          interfaceModule,
          editModule,
          statusModule,
          modalModule,
          modalExitModule,
          helpersModule,
          
          // Features Managers
          obraManagerModule,
          projectManagerModule,
          
          // 🆕 MÓDULO DE EMPRESAS
          empresaCadastroModule,
          
          // Data Modules - 
          roomsModule,
          climatizationModule,
          configuracaoModule,
          machinesCoreModule,
          capacityCalculatorModule,
          
          // Calculations
          airFlowModule,
          calculationsCoreModule,
          
          // Data Utils
          idGeneratorModule,
          dataUtilsModule,
          
          // Data Builders
          uiBuildersModule,
          dataBuildersModule
      ] = modules;

      // ✅ ATRIBUIR FUNÇÕES DOS NOVOS MÓDULOS
      const allFunctions = {
          // ========== UI INTERFACE ==========
          toggleSection: interfaceModule.toggleSection,
          toggleSubsection: interfaceModule.toggleSubsection,
          toggleObra: interfaceModule.toggleObra,
          toggleProject: interfaceModule.toggleProject,
          toggleRoom: interfaceModule.toggleRoom,
          collapseElement: helpersModule.collapseElement,
          expandElement: helpersModule.expandElement,
          showSystemStatus: statusModule.showSystemStatus,
          
          // ========== OBRA MANAGEMENT ==========
          addNewObra: obraManagerModule.addNewObra,
          saveOrUpdateObra: obraManagerModule.saveObra,
          verifyObraData: obraManagerModule.verifyObraData,
          deleteObra: obraManagerModule.deleteObra,
          saveObra: obraManagerModule.saveObra,
          fetchObras: obraManagerModule.fetchObras,
          salvarObra: obraManagerModule.salvarObra,
          atualizarObra: obraManagerModule.atualizarObra,
          
          // ========== PROJECT MANAGEMENT ==========
          addNewProjectToObra: projectManagerModule.addNewProjectToObra,
          deleteProject: projectManagerModule.deleteProject,
          
          // ========== ROOM MANAGEMENT ==========
          addNewRoom: roomsModule.addNewRoom,
          deleteRoom: roomsModule.deleteRoom,
          createEmptyRoom: roomsModule.createEmptyRoom,
          
          // ========== CONSTRUCTION SECTIONS -  ==========
          buildClimatizationSection: climatizationModule.buildClimatizationSection, 
          buildMachinesSection: machinesCoreModule.buildMachinesSection,           
          buildConfigurationSection: configuracaoModule.buildConfigurationSection, 
          
          // ========== CALCULATIONS ==========
          calculateVazaoArAndThermalGains: airFlowModule.calculateVazaoArAndThermalGains,
          calculateVazaoArAndThermalGainsDebounced: calculationsCoreModule.calculateVazaoArAndThermalGainsDebounced,
          
          // ========== CAPACITY & MACHINES ==========
          calculateCapacitySolution: capacityCalculatorModule.calculateCapacitySolution,
          updateBackupConfiguration: capacityCalculatorModule.updateBackupConfiguration,
          toggleOption: machinesCoreModule.toggleOption,
          addMachine: machinesCoreModule.addMachine,
          deleteMachine: machinesCoreModule.deleteMachine,
          
          // ========== EDIT FUNCTIONS ==========
          makeEditable: editModule.makeEditable,
          
          // ========== UTILS ==========
          ensureStringId: idGeneratorModule.ensureStringId,
          getNextObraNumber: dataUtilsModule.getNextObraNumber,
          getNextProjectNumber: dataUtilsModule.getNextProjectNumber,
          getNextRoomNumber: dataUtilsModule.getNextRoomNumber,
          
          // ========== MODAL FUNCTIONS ==========
          showConfirmationModal: modalModule.showConfirmationModal,
          closeConfirmationModal: modalModule.closeConfirmationModal,
          undoDeletion: modalModule.undoDeletion,
          
          // ========== HELPER FUNCTIONS ==========
          removeEmptyObraMessage: helpersModule.removeEmptyObraMessage,
          showEmptyObraMessageIfNeeded: helpersModule.showEmptyObraMessageIfNeeded,
          removeEmptyProjectMessage: helpersModule.removeEmptyProjectMessage,
          showEmptyProjectMessageIfNeeded: helpersModule.showEmptyProjectMessageIfNeeded,
          
          // ========== UI BUILDERS (PARA CORRIGIR OS ERROS) ==========
          populateObraData: uiBuildersModule.populateObraData,
          renderObraFromData: uiBuildersModule.renderObraFromData,
          renderProjectFromData: uiBuildersModule.renderProjectFromData,
          renderRoomFromData: uiBuildersModule.renderRoomFromData,
          fillMachinesData: uiBuildersModule.fillMachinesData, 
          fillClimatizationInputs: uiBuildersModule.fillClimatizationInputs,
          fillThermalGainsData: uiBuildersModule.fillThermalGainsData,
          fillCapacityData: uiBuildersModule.fillCapacityData,
          fillConfigurationData: uiBuildersModule.fillConfigurationData,
          ensureAllRoomSections: uiBuildersModule.ensureAllRoomSections,
          ensureMachinesSection: uiBuildersModule.ensureMachinesSection,
          populateMachineData: uiBuildersModule.populateMachineData,
          
          // ========== DATA BUILDERS ==========
          buildObraData: dataBuildersModule.buildObraData,
          buildProjectData: dataBuildersModule.buildProjectData,
          extractRoomData: dataBuildersModule.extractRoomData,
          extractMachinesData: dataBuildersModule.extractMachinesData,
          extractThermalGainsData: dataBuildersModule.extractThermalGainsData,
          extractClimatizationInputs: dataBuildersModule.extractClimatizationInputs,
          extractCapacityData: dataBuildersModule.extractCapacityData,
          extractConfigurationData: dataBuildersModule.extractConfigurationData,
          
          // 🆕 FUNÇÕES DE EMPRESA
          obterDadosEmpresa: window.obterDadosEmpresa
      };
      
      // ✅ ATRIBUIR FUNÇÕES AO WINDOW
      Object.keys(allFunctions).forEach(funcName => {
          if (typeof allFunctions[funcName] === 'function') {
              window[funcName] = allFunctions[funcName];
              console.log(`✅ ${funcName} atribuída ao window`);
          } else if (allFunctions[funcName] !== undefined) {
              console.warn(`⚠️ ${funcName} não é uma função:`, typeof allFunctions[funcName]);
          } else {
              console.error(`❌ ${funcName} não encontrado nos módulos`);
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
 * Inicializa o sistema de cadastro de empresas
 */
async function initializeEmpresaCadastro() {
  try {
    console.log("🏢 Inicializando sistema de cadastro de empresas...");
    
    // Aguardar um pouco para garantir que o DOM esteja pronto
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Inicializar o sistema de cadastro inline de empresas
    empresaCadastro = new EmpresaCadastroInline();
    
    // Disponibilizar globalmente
    window.empresaCadastro = empresaCadastro;
    
    console.log("✅ Sistema de cadastro de empresas inicializado");
    
    // Verificar se há elementos de cadastro disponíveis
    const spansCadastro = document.querySelectorAll('.projetc-header-record.very-dark span');
    console.log(`🔍 Encontrados ${spansCadastro.length} elementos de cadastro de empresas`);
    
    return true;
  } catch (error) {
    console.error("❌ Erro ao inicializar sistema de cadastro de empresas:", error);
    return false;
  }
}

/**
 * Verifica e carrega sessão existente
 */
async function checkAndLoadExistingSession() {
  try {
    console.log("🔍 Verificando se há sessão com obras salvas...");
    
    const sessionResponse = await fetch('/api/session-obras');
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      
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
  console.log('- Empresa Cadastro:', !!empresaCadastro);
  
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
        'addNewObra',
        'addNewProjectToObra',
        'addNewRoom',
        'deleteObra',
        'deleteRoom',
        'calculateVazaoArAndThermalGains',
        'makeEditable',
        'obterDadosEmpresa'
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
 * Inicialização principal do sistema - 
 */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Inicializando sistema...");
  
  try {
    // ✅ ORDEM CORRETA DE INICIALIZAÇÃO:
    
    // 1. Inicializar sistema de shutdown primeiro
    shutdownManager = new ShutdownManager();
    
    // 2. ✅ FUNÇÕES GLOBAIS JÁ DEFINIDAS NO TOPO
    
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
    
    // 5. 🆕 Inicializar sistema de cadastro de empresas
    console.log("🏢 Inicializando sistema de empresas...");
    const empresaSystemLoaded = await initializeEmpresaCadastro();
    if (!empresaSystemLoaded) {
      console.warn("⚠️ Sistema de cadastro de empresas não carregou completamente");
    }
    
    // 6. Verificar e carregar sessão existente
    console.log("🔍 Verificando sessão existente...");
    const hasExistingSession = await checkAndLoadExistingSession();
    
    if (!hasExistingSession) {
      console.log("📭 Nenhuma sessão existente - sistema começa vazio");
      console.log("💡 Dica: Clique em 'Nova Obra' para começar");
    }
    
    // 7. Verificar obras existentes
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
    
    // ✅ Verificar funções críticas após inicialização completa
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

