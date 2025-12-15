/* ==== INÍCIO: main-folder/system-init.js ==== */
/**
 * system-init.js - INICIALIZAÇÃO DO SISTEMA
 * 🎯 Carrega constantes, módulos e componentes principais
 * 🔥 AGORA COM: Sistemas de deleção universal via import
 */

// ✅ IMPORTAR MÓDULOS COM CAMINHOS CORRETOS
import { loadObrasFromServer } from '../data/adapters/obra-adapter.js';
import { getGeralCount } from '../data/adapters/session-adapter.js';
import { shutdownManual } from '../data/adapters/shutdown-adapter.js';
import EmpresaCadastroInline from '../data/builders/empresa-cadastro-inline.js';

// 🔥 NOVOS IMPORTS: Sistemas de deleção universal
import { ButtonDeleteUniversal } from '../features/filters/button-delete-universal.js';
import { ButtonModeManager } from '../features/filters/button-mode-manager.js';

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
 * Carrega todos os módulos do sistema dinamicamente
 */
async function loadAllModules() {
  if (window.modulesLoaded) return;

  try {
    console.log("📦 Iniciando carregamento de módulos...");

    // ✅ CARREGAR MÓDULOS COM CAMINHOS CORRETOS
    const modules = await Promise.all([
      // UI Components
      import('../ui/interface.js'),                    // interfaceModule
      import('../ui/components/edit.js'),              // editModule
      import('../ui/components/status.js'),            // statusModule
      import('../ui/components/modal/modal.js'),       // modalModule
      import('../ui/components/modal/exit-modal.js'),  // modalExitModule
      import('../ui/helpers.js'),                      // helpersModule

      // Features Managers
      import('../features/managers/obra-manager.js'),  // obraManagerModule
      import('../features/managers/project-manager.js'), // projectManagerModule

      // Data Modules
      import('../data/modules/rooms.js'),              // roomsModule
      import('../data/modules/climatizacao.js'),       // climatizationModule
      import('../data/modules/acessorios.js'),         // acessoriosModule
      import('../data/modules/machines/machines-core.js'), // machinesCoreModule
      import('../data/modules/machines/capacity-calculator.js'), // capacityCalculatorModule

      // Calculations
      import('../features/calculations/air-flow.js'),  // airFlowModule
      import('../features/calculations/calculations-core.js'), // calculationsCoreModule

      // Data Utils
      import('../data/utils/id-generator.js'),         // idGeneratorModule
      import('../data/utils/data-utils.js'),           // dataUtilsModule

      // Data Builders
      import('../data/builders/ui-builders.js'),       // uiBuildersModule
      import('../data/builders/data-builders.js')      // dataBuildersModule
    ]);

    const [
      interfaceModule,
      editModule,
      statusModule,
      modalModule,
      modalExitModule,
      helpersModule,
      obraManagerModule,
      projectManagerModule,
      roomsModule,
      climatizationModule,
      configuracaoModule,
      machinesCoreModule,
      capacityCalculatorModule,
      airFlowModule,
      calculationsCoreModule,
      idGeneratorModule,
      dataUtilsModule,
      uiBuildersModule,
      dataBuildersModule
    ] = modules;

    // ✅ ATRIBUIR FUNÇÕES DOS MÓDULOS AO WINDOW
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
      supportFrom_saveObra: obraManagerModule.supportFrom_saveObra,
      atualizarObra: obraManagerModule.atualizarObra,

      // ========== PROJECT MANAGEMENT ==========
      addNewProjectToObra: projectManagerModule.addNewProjectToObra,
      deleteProject: projectManagerModule.deleteProject,

      // ========== ROOM MANAGEMENT ==========
      addNewRoom: roomsModule.addNewRoom,
      deleteRoom: roomsModule.deleteRoom,
      createEmptyRoom: roomsModule.createEmptyRoom,

      // ========== CONSTRUCTION SECTIONS ==========
      buildClimatizationSection: climatizationModule.buildClimatizationSection,
      buildMachinesSection: machinesCoreModule.buildMachinesSection,
      buildAccessoriesSection: configuracaoModule.buildAccessoriesSection,

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

      // ========== UI BUILDERS ==========
      populateObraData: uiBuildersModule.populateObraData,
      renderObraFromData: uiBuildersModule.renderObraFromData,
      renderProjectFromData: uiBuildersModule.renderProjectFromData,
      renderRoomFromData: uiBuildersModule.renderRoomFromData,
      fillMachinesData: uiBuildersModule.fillMachinesData,
      fillClimatizationInputs: uiBuildersModule.fillClimatizationInputs,
      fillThermalGainsData: uiBuildersModule.fillThermalGainsData,
      fillCapacityData: uiBuildersModule.fillCapacityData,
      fillAccessoriesData: uiBuildersModule.fillAccessoriesData,
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
      extractAccessoriesData: dataBuildersModule.extractAccessoriesData,
      
      // ========== FUNÇÃO CRÍTICA PARA FILTROS ==========
      loadObrasFromServer: loadObrasFromServer // Importada diretamente
    };

    // ✅ CRIAR systemFunctions PARA ORGANIZAÇÃO
    window.systemFunctions = window.systemFunctions || {};
    
    // ✅ ATRIBUIR FUNÇÕES AO WINDOW E systemFunctions
    Object.keys(allFunctions).forEach(funcName => {
      if (typeof allFunctions[funcName] === 'function') {
        window[funcName] = allFunctions[funcName];
        window.systemFunctions[funcName] = allFunctions[funcName];
        console.log(`✅ ${funcName} atribuída ao window e systemFunctions`);
      } else if (allFunctions[funcName] !== undefined) {
        console.warn(`⚠️ ${funcName} não é uma função:`, typeof allFunctions[funcName]);
      } else {
        console.error(`❌ ${funcName} não encontrado nos módulos`);
      }
    });

    window.modulesLoaded = true;
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

    await new Promise(resolve => setTimeout(resolve, 500));

    window.empresaCadastro = new EmpresaCadastroInline();

    console.log("✅ Sistema de cadastro de empresas inicializado");

    const spansCadastro = document.querySelectorAll('.projetc-header-record.very-dark span');
    console.log(`🔍 Encontrados ${spansCadastro.length} elementos de cadastro de empresas`);

    return true;
  } catch (error) {
    console.error("❌ Erro ao inicializar sistema de cadastro de empresas:", error);
    return false;
  }
}

/**
 * 🔥 Configura integração com FilterSystem
 */
function setupFilterSystemIntegration() {
  console.log("🔧 [SYSTEM-INIT] Configurando integração com FilterSystem...");

  if (!window.FilterSystem) {
    console.warn("⚠️ [SYSTEM-INIT] FilterSystem não disponível para integração");
    return false;
  }

  if (!window.ButtonModeManager) {
    console.error("❌ [SYSTEM-INIT] ButtonModeManager não disponível para integração");
    return false;
  }

  try {
    // Sobrescrever a função handleFilterToggleChange para incluir ButtonModeManager
    const originalHandleToggleChange = window.FilterSystem.handleFilterToggleChange;

    if (typeof originalHandleToggleChange === 'function') {
      window.FilterSystem.handleFilterToggleChange = function (isActive) {
        console.log(`🎛️ [INTEGRAÇÃO] Filtro ${isActive ? 'ATIVADO' : 'DESATIVADO'}`);

        // Executar função original
        originalHandleToggleChange.call(this, isActive);

        // Atualizar ButtonModeManager
        if (isActive) {
          window.ButtonModeManager.enableFilterMode();
        } else {
          window.ButtonModeManager.disableFilterMode();
        }

        // Também reaplicar modo dos botões
        if (window.ButtonModeManager && typeof window.ButtonModeManager.applyMode === 'function') {
          window.ButtonModeManager.applyMode();
        }
      };

      console.log("✅ [SYSTEM-INIT] Integração FilterSystem-ButtonModeManager configurada");
      return true;
    }
  } catch (error) {
    console.error("❌ [SYSTEM-INIT] Erro na integração:", error);
  }

  return false;
}

/**
 * 🔥 Aplica configuração inicial dos botões após carregar obras
 */
function setupInitialButtonConfiguration() {
  console.log("🔧 [SYSTEM-INIT] Configurando botões inicialmente...");

  // Configurar botões de deleção universal
  if (window.ButtonDeleteUniversal && typeof window.ButtonDeleteUniversal.setupAllDeleteButtons === 'function') {
    setTimeout(() => {
      window.ButtonDeleteUniversal.setupAllDeleteButtons();
      console.log("✅ [SYSTEM-INIT] Botões de deleção configurados inicialmente");
    }, 500); // Pequeno delay para garantir DOM carregado
  }

  // Aplicar modo inicial dos botões
  if (window.ButtonModeManager && typeof window.ButtonModeManager.applyMode === 'function') {
    setTimeout(() => {
      window.ButtonModeManager.applyMode();
      console.log("✅ [SYSTEM-INIT] Modo inicial aplicado aos botões");
    }, 600);
  }
}

/**
 * 🔥 Garante que loadObrasFromServer esteja disponível globalmente
 */
function ensureCriticalFunctionsAvailable() {
  console.log("🔧 [SYSTEM-INIT] Garantindo funções críticas disponíveis...");
  
  // Verificar se loadObrasFromServer está disponível
  if (!window.loadObrasFromServer && !window.systemFunctions?.loadObrasFromServer) {
    console.warn("⚠️ [SYSTEM-INIT] loadObrasFromServer não encontrada, criando fallback...");
    
    // Criar fallback básico
    window.loadObrasFromServer = async function() {
      console.log("🔄 [FALLBACK] Executando loadObrasFromServer fallback");
      
      try {
        const response = await fetch('/api/session-obras');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const obras = await response.json();
        console.log(`✅ [FALLBACK] ${obras.length} obras carregadas`);
        
        // Simplesmente recarregar a página como fallback final
        window.location.reload();
        
      } catch (error) {
        console.error("❌ [FALLBACK] Erro:", error);
        window.location.reload();
      }
    };
    
    // Adicionar ao systemFunctions também
    if (window.systemFunctions) {
      window.systemFunctions.loadObrasFromServer = window.loadObrasFromServer;
    }
    
    console.log("✅ [SYSTEM-INIT] Fallback para loadObrasFromServer criado");
  } else {
    console.log("✅ [SYSTEM-INIT] loadObrasFromServer já disponível");
  }
}

/**
 * Inicializa o sistema completo
 */
export async function initializeSystem() {
  try {
    console.log("🚀 [SYSTEM-INIT] Iniciando sistema completo...");

    console.log("🔧 [SYSTEM-INIT] Criando sistemas de deleção...");

    try {
      // Criar instâncias das classes importadas
      window.ButtonDeleteUniversal = new ButtonDeleteUniversal();
      window.ButtonModeManager = new ButtonModeManager();

      console.log("✅ [SYSTEM-INIT] Sistemas de deleção criados:", {
        ButtonDeleteUniversal: !!window.ButtonDeleteUniversal,
        ButtonModeManager: !!window.ButtonModeManager
      });

    } catch (error) {
      console.error("❌ [SYSTEM-INIT] Erro ao criar sistemas de deleção:", error);
      // Criar objetos vazios para evitar erros
      if (!window.ButtonDeleteUniversal) {
        window.ButtonDeleteUniversal = {
          setupAllDeleteButtons: () => console.warn('ButtonDeleteUniversal não disponível')
        };
      }
      if (!window.ButtonModeManager) {
        window.ButtonModeManager = {
          initialize: () => console.warn('ButtonModeManager não disponível'),
          applyMode: () => { },
          isFilterMode: () => false
        };
      }
    }

    // 🔥 PASSO 2: Inicializar sistema de shutdown
    console.log("🔒 [SYSTEM-INIT] Inicializando shutdown manager...");
    window.shutdownManager = new ShutdownManager();

    // 🔥 PASSO 3: Carregar constantes do sistema
    console.log("📊 [SYSTEM-INIT] Carregando constantes do sistema...");
    const constantsLoaded = await loadSystemConstants();
    if (!constantsLoaded) {
      throw new Error("Não foi possível carregar constantes do sistema");
    }
    console.log("✅ [SYSTEM-INIT] Constantes carregadas");

    // 🔥 PASSO 4: Carregar todos os módulos do sistema
    console.log("📦 [SYSTEM-INIT] Carregando módulos do sistema...");
    const modulesLoadedSuccess = await loadAllModules();
    if (!modulesLoadedSuccess) {
      console.warn("⚠️ [SYSTEM-INIT] Alguns módulos não carregaram completamente");
    }
    console.log("✅ [SYSTEM-INIT] Módulos carregados");

    // 🔥 PASSO 5: Garantir funções críticas disponíveis
    ensureCriticalFunctionsAvailable();

    // 🔥 PASSO 6: Inicializar sistema de cadastro de empresas
    console.log("🏢 [SYSTEM-INIT] Inicializando sistema de empresas...");
    const empresaSystemLoaded = await initializeEmpresaCadastro();
    if (!empresaSystemLoaded) {
      console.warn("⚠️ [SYSTEM-INIT] Sistema de cadastro de empresas não carregou completamente");
    }
    console.log("✅ [SYSTEM-INIT] Sistema de empresas inicializado");

    // 🔥 PASSO 7: Inicializar ButtonModeManager se disponível
    console.log("🔧 [SYSTEM-INIT] Inicializando ButtonModeManager...");
    if (window.ButtonModeManager && typeof window.ButtonModeManager.initialize === 'function') {
      try {
        await window.ButtonModeManager.initialize();
        console.log("✅ [SYSTEM-INIT] ButtonModeManager inicializado");
      } catch (initError) {
        console.error("❌ [SYSTEM-INIT] Erro ao inicializar ButtonModeManager:", initError);
      }
    } else {
      console.warn("⚠️ [SYSTEM-INIT] ButtonModeManager não disponível para inicialização");
    }

    // 🔥 PASSO 8: Configurar integração com FilterSystem
    console.log("🔗 [SYSTEM-INIT] Configurando integrações...");
    setupFilterSystemIntegration();

    // 🔥 PASSO 9: Configuração inicial dos botões (com delay para DOM)
    console.log("🔧 [SYSTEM-INIT] Agendando configuração inicial dos botões...");
    setupInitialButtonConfiguration();

    // 🔥 PASSO 10: Configurar listener para quando obras forem carregadas
    console.log("🔗 [SYSTEM-INIT] Configurando listeners de carregamento...");

    // Observer para detectar quando obras são carregadas/renderizadas
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Verificar se foram adicionadas obras
          const hasObras = Array.from(mutation.addedNodes).some(node =>
            node.nodeType === 1 &&
            (node.classList?.contains('obra-wrapper') ||
              node.querySelector?.('.obra-wrapper'))
          );

          if (hasObras && window.ButtonModeManager) {
            console.log("👀 [SYSTEM-INIT] Novas obras detectadas, reaplicando modo...");
            setTimeout(() => {
              if (window.ButtonModeManager && window.ButtonModeManager.applyMode) {
                window.ButtonModeManager.applyMode();
              }
              if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.setupAllDeleteButtons) {
                window.ButtonDeleteUniversal.setupAllDeleteButtons();
              }
            }, 300);
          }
        }
      });
    });

    // Observar container de projetos (onde obras são renderizadas)
    const projectsContainer = document.getElementById('projects-container');
    if (projectsContainer) {
      observer.observe(projectsContainer, { childList: true, subtree: true });
      console.log("🔍 [SYSTEM-INIT] Observer configurado para projetos-container");
    }

    console.log("🎉 [SYSTEM-INIT] Sistema completamente inicializado!");
    return true;

  } catch (error) {
    console.error("❌ [SYSTEM-INIT] ERRO CRÍTICO na inicialização do sistema:", error);
    throw error;
  }
}
/* ==== FIM: main-folder/system-init.js ==== */