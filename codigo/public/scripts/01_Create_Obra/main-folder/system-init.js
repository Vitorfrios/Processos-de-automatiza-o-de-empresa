/**
 * system-init.js - INICIALIZAÇÃO DO SISTEMA
 * 🎯 Carrega constantes, módulos e componentes principais
 */

// ✅ IMPORTAR MÓDULOS COM CAMINHOS CORRETOS
import { loadObrasFromServer } from '../data/adapters/obra-adapter.js';
import { getGeralCount } from '../data/adapters/session-adapter.js';
import { shutdownManual } from '../data/adapters/shutdown-adapter.js';
import EmpresaCadastroInline from '../data/builders/empresa-cadastro-inline.js';

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
          import('../data/modules/acessorios.js'),       // acessoriosModule
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
          extractAccessoriesData: dataBuildersModule.extractAccessoriesData
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
    
    // Aguardar um pouco para garantir que o DOM esteja pronto
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Inicializar o sistema de cadastro inline de empresas
    window.empresaCadastro = new EmpresaCadastroInline();
    
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
 * Inicializa o sistema completo
 */
export async function initializeSystem() {
  try {
    // 1. Inicializar sistema de shutdown primeiro
    window.shutdownManager = new ShutdownManager();
    
    // 2. Carregar constantes do sistema (crítico para cálculos)
    console.log("📊 Carregando constantes do sistema...");
    const constantsLoaded = await loadSystemConstants();
    if (!constantsLoaded) {
      throw new Error("Não foi possível carregar constantes do sistema");
    }
    
    // 3. Carregar todos os módulos do sistema
    console.log("📦 Carregando módulos do sistema...");
    const modulesLoadedSuccess = await loadAllModules();
    if (!modulesLoadedSuccess) {
      console.warn("⚠️ Alguns módulos não carregaram completamente");
    }
    
    // 4. Inicializar sistema de cadastro de empresas
    console.log("🏢 Inicializando sistema de empresas...");
    const empresaSystemLoaded = await initializeEmpresaCadastro();
    if (!empresaSystemLoaded) {
      console.warn("⚠️ Sistema de cadastro de empresas não carregou completamente");
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Erro na inicialização do sistema:", error);
    throw error;
  }
}