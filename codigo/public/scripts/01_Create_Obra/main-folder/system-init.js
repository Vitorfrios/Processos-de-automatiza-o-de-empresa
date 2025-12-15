/* ==== INÍCIO: main-folder/system-init.js ==== */
/**
 * system-init.js - INICIALIZAÇÃO DO SISTEMA PRINCIPAL
 * 🎯 Carrega constantes, módulos e componentes principais
 */

// ✅ IMPORTAR MÓDULOS COM CAMINHOS CORRETOS
import { loadObrasFromServer } from '../data/adapters/obra-adapter.js';
import { getGeralCount } from '../data/adapters/session-adapter.js';
import { shutdownManual } from '../data/adapters/shutdown-adapter.js';
import EmpresaCadastroInline from '../data/builders/empresa-cadastro-inline.js';

// 🔥 Importar módulo de filtros separado
import { initializeFilterSystem } from './filter-init.js';

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
        await shutdownManual();
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
    console.log("🔍 Carregando constantes do sistema...");
    const response = await fetch(`/constants`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const constantsData = await response.json();
    window.systemConstants = constantsData;
    console.log("✅ Constantes carregadas do JSON:", window.systemConstants);

    if (!window.systemConstants.VARIAVEL_PD || !window.systemConstants.VARIAVEL_PS) {
      throw new Error("Constantes essenciais não encontradas no JSON");
    }

    return true;
  } catch (error) {
    console.error("❌ ERRO CRÍTICO ao carregar constantes:", error);
    throw error;
  }
}

/**
 * Carrega todos os módulos do sistema dinamicamente
 */
async function loadAllModules() {
  if (window.modulesLoaded) return;

  try {
    console.log("📦 Iniciando carregamento de módulos...");

    const modules = await Promise.all([
      import('../ui/interface.js'),
      import('../ui/components/edit.js'),
      import('../ui/components/status.js'),
      import('../ui/components/modal/modal.js'),
      import('../ui/components/modal/exit-modal.js'),
      import('../ui/helpers.js'),
      import('../features/managers/obra-manager.js'),
      import('../features/managers/project-manager.js'),
      import('../data/modules/rooms.js'),
      import('../data/modules/climatizacao.js'),
      import('../data/modules/acessorios.js'),
      import('../data/modules/machines/machines-core.js'),
      import('../data/modules/machines/capacity-calculator.js'),
      import('../features/calculations/air-flow.js'),
      import('../features/calculations/calculations-core.js'),
      import('../data/utils/id-generator.js'),
      import('../data/utils/data-utils.js'),
      import('../data/builders/ui-builders.js'),
      import('../data/builders/data-builders.js')
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

    const allFunctions = {
      toggleSection: interfaceModule.toggleSection,
      toggleSubsection: interfaceModule.toggleSubsection,
      toggleObra: interfaceModule.toggleObra,
      toggleProject: interfaceModule.toggleProject,
      toggleRoom: interfaceModule.toggleRoom,
      collapseElement: helpersModule.collapseElement,
      expandElement: helpersModule.expandElement,
      showSystemStatus: statusModule.showSystemStatus,

      addNewObra: obraManagerModule.addNewObra,
      saveOrUpdateObra: obraManagerModule.saveObra,
      verifyObraData: obraManagerModule.verifyObraData,
      deleteObra: obraManagerModule.deleteObra,
      saveObra: obraManagerModule.saveObra,
      fetchObras: obraManagerModule.fetchObras,
      supportFrom_saveObra: obraManagerModule.supportFrom_saveObra,
      atualizarObra: obraManagerModule.atualizarObra,

      addNewProjectToObra: projectManagerModule.addNewProjectToObra,
      deleteProject: projectManagerModule.deleteProject,

      addNewRoom: roomsModule.addNewRoom,
      deleteRoom: roomsModule.deleteRoom,
      createEmptyRoom: roomsModule.createEmptyRoom,

      buildClimatizationSection: climatizationModule.buildClimatizationSection,
      buildMachinesSection: machinesCoreModule.buildMachinesSection,
      buildAccessoriesSection: configuracaoModule.buildAccessoriesSection,

      calculateVazaoArAndThermalGains: airFlowModule.calculateVazaoArAndThermalGains,
      calculateVazaoArAndThermalGainsDebounced: calculationsCoreModule.calculateVazaoArAndThermalGainsDebounced,

      calculateCapacitySolution: capacityCalculatorModule.calculateCapacitySolution,
      updateBackupConfiguration: capacityCalculatorModule.updateBackupConfiguration,
      toggleOption: machinesCoreModule.toggleOption,
      addMachine: machinesCoreModule.addMachine,
      deleteMachine: machinesCoreModule.deleteMachine,

      makeEditable: editModule.makeEditable,

      ensureStringId: idGeneratorModule.ensureStringId,
      getNextObraNumber: dataUtilsModule.getNextObraNumber,
      getNextProjectNumber: dataUtilsModule.getNextProjectNumber,
      getNextRoomNumber: dataUtilsModule.getNextRoomNumber,

      showConfirmationModal: modalModule.showConfirmationModal,
      closeConfirmationModal: modalModule.closeConfirmationModal,
      undoDeletion: modalModule.undoDeletion,

      removeEmptyObraMessage: helpersModule.removeEmptyObraMessage,
      showEmptyObraMessageIfNeeded: helpersModule.showEmptyObraMessageIfNeeded,
      removeEmptyProjectMessage: helpersModule.removeEmptyProjectMessage,
      showEmptyProjectMessageIfNeeded: helpersModule.showEmptyProjectMessageIfNeeded,

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

      buildObraData: dataBuildersModule.buildObraData,
      buildProjectData: dataBuildersModule.buildProjectData,
      extractRoomData: dataBuildersModule.extractRoomData,
      extractMachinesData: dataBuildersModule.extractMachinesData,
      extractThermalGainsData: dataBuildersModule.extractThermalGainsData,
      extractClimatizationInputs: dataBuildersModule.extractClimatizationInputs,
      extractCapacityData: dataBuildersModule.extractCapacityData,
      extractAccessoriesData: dataBuildersModule.extractAccessoriesData,

      loadObrasFromServer: loadObrasFromServer
    };

    window.systemFunctions = {};

    Object.keys(allFunctions).forEach(funcName => {
      if (typeof allFunctions[funcName] === 'function') {
        window[funcName] = allFunctions[funcName];
        window.systemFunctions[funcName] = allFunctions[funcName];
        console.log(`✅ ${funcName} atribuída ao window e systemFunctions`);
      }
    });

    window.modulesLoaded = true;
    console.log("✅ Todos os módulos foram carregados com sucesso");
    return true;

  } catch (error) {
    console.error("❌ Erro ao carregar módulos:", error);
    throw error;
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
    throw error;
  }
}

/**
 * Inicializa o sistema completo
 */
export async function initializeSystem() {
  try {
    console.log("🚀 [SYSTEM-INIT] Iniciando sistema completo...");
    
    window.systemLoadingStart = Date.now();

    console.log("🔒 [SYSTEM-INIT] Inicializando shutdown manager...");
    window.shutdownManager = new ShutdownManager();

    console.log("📊 [SYSTEM-INIT] Carregando constantes do sistema...");
    await loadSystemConstants();
    console.log("✅ [SYSTEM-INIT] Constantes carregadas");

    console.log("📦 [SYSTEM-INIT] Carregando módulos do sistema...");
    await loadAllModules();
    console.log("✅ [SYSTEM-INIT] Módulos carregados");

    console.log("🏢 [SYSTEM-INIT] Inicializando sistema de empresas...");
    await initializeEmpresaCadastro();
    console.log("✅ [SYSTEM-INIT] Sistema de empresas inicializado");

    console.log("🔧 [SYSTEM-INIT] Inicializando sistema de filtros...");
    await initializeFilterSystem();
    console.log("✅ [SYSTEM-INIT] Sistema de filtros inicializado");

    const loadingTime = Date.now() - window.systemLoadingStart;
    window.systemLoaded = true;
    window.systemLoadTime = loadingTime;
    
    console.log(`🎉 [SYSTEM-INIT] Sistema completamente inicializado em ${loadingTime}ms!`);
    
    const event = new CustomEvent('systemInitialized', { 
      detail: { 
        time: loadingTime,
        timestamp: new Date().toISOString(),
        modules: window.modulesLoaded,
        constants: !!window.systemConstants
      }
    });
    document.dispatchEvent(event);
    
    return true;

  } catch (error) {
    console.error("❌ [SYSTEM-INIT] ERRO CRÍTICO na inicialização do sistema:", error);
    throw error;
  }
}
/* ==== FIM: main-folder/system-init.js ==== */