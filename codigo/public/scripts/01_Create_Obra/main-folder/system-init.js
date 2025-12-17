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

    if (!window.systemConstants.VARIAVEL_PD.value
      || !window.systemConstants.VARIAVEL_PS.value
    ) {
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

    // ✅ CORREÇÃO: Todos os módulos importados dentro do Promise.all
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
      import('../data/modules/equipamentos.js'), // ✅ MANTER aqui
      import('../data/modules/machines/machines-core.js'),
      import('../data/modules/machines/capacity-calculator.js'),
      import('../features/calculations/air-flow.js'),
      import('../features/calculations/calculations-core.js'),
      import('../data/utils/id-generator.js'),
      import('../data/utils/data-utils.js'),
      import('../data/builders/ui-builders.js'),
      import('../data/builders/data-builders.js'),
      import('../data/builders/ui-folder/data-fillers.js'), // ✅ ADICIONAR para funções auxiliares
      import('../data/builders/ui-folder/room-renderer.js') // ✅ ADICIONAR para renderização
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
      equipamentosModule, // ✅ RECUPERADO
      machinesCoreModule,
      capacityCalculatorModule,
      airFlowModule,
      calculationsCoreModule,
      idGeneratorModule,
      dataUtilsModule,
      uiBuildersModule,
      dataBuildersModule,
      dataFillersModule, // ✅ NOVO
      roomRendererModule // ✅ NOVO
    ] = modules;

    // ✅ CORREÇÃO: Juntar TODAS as funções em um objeto
    const allFunctions = {
      // Interface
      toggleSection: interfaceModule.toggleSection,
      toggleSubsection: interfaceModule.toggleSubsection,
      toggleObra: interfaceModule.toggleObra,
      toggleProject: interfaceModule.toggleProject,
      toggleRoom: interfaceModule.toggleRoom,
      collapseElement: helpersModule.collapseElement,
      expandElement: helpersModule.expandElement,
      showSystemStatus: statusModule.showSystemStatus,

      // Obras
      addNewObra: obraManagerModule.addNewObra,
      saveOrUpdateObra: obraManagerModule.saveObra,
      verifyObraData: obraManagerModule.verifyObraData,
      deleteObra: obraManagerModule.deleteObra,
      saveObra: obraManagerModule.saveObra,
      fetchObras: obraManagerModule.fetchObras,
      supportFrom_saveObra: obraManagerModule.supportFrom_saveObra,
      atualizarObra: obraManagerModule.atualizarObra,

      // Projetos
      addNewProjectToObra: projectManagerModule.addNewProjectToObra,
      deleteProject: projectManagerModule.deleteProject,

      // Salas
      addNewRoom: roomsModule.addNewRoom,
      deleteRoom: roomsModule.deleteRoom,
      createEmptyRoom: roomsModule.createEmptyRoom,

      // Climatização
      buildClimatizationSection: climatizationModule.buildClimatizationSection,

      // Máquinas
      buildMachinesSection: machinesCoreModule.buildMachinesSection,
      calculateCapacitySolution: capacityCalculatorModule.calculateCapacitySolution,
      updateBackupConfiguration: capacityCalculatorModule.updateBackupConfiguration,
      toggleOption: machinesCoreModule.toggleOption,
      addMachine: machinesCoreModule.addMachine,
      deleteMachine: machinesCoreModule.deleteMachine,

      // ✅ CORREÇÃO: EQUIPAMENTOS COMPLETO
      buildEquipamentosSection: equipamentosModule.buildEquipamentosSection,
      initEquipamentosSystem: equipamentosModule.initEquipamentosSystem,
      fillEquipamentosData: equipamentosModule.fillEquipamentosData, // ← AGORA EXISTE!
      adicionarEquipamentoNaTabela: equipamentosModule.adicionarEquipamentoNaTabela,
      atualizarTotalEquipamentos: equipamentosModule.atualizarTotalEquipamentos,
      formatarMoeda: equipamentosModule.formatarMoeda,
      carregarTiposEquipamentos: equipamentosModule.carregarTiposEquipamentos,
      loadEquipamentoDimensoes: equipamentosModule.loadEquipamentoDimensoes,
      adicionarEquipamento: equipamentosModule.adicionarEquipamento,
      carregarEquipamentos: equipamentosModule.carregarEquipamentos,
      limparEquipamentos: equipamentosModule.limparEquipamentos,

      // Cálculos
      calculateVazaoArAndThermalGains: airFlowModule.calculateVazaoArAndThermalGains,
      calculateVazaoArAndThermalGainsDebounced: calculationsCoreModule.calculateVazaoArAndThermalGainsDebounced,

      // Edição
      makeEditable: editModule.makeEditable,

      // Utilitários
      ensureStringId: idGeneratorModule.ensureStringId,
      getNextObraNumber: dataUtilsModule.getNextObraNumber,
      getNextProjectNumber: dataUtilsModule.getNextProjectNumber,
      getNextRoomNumber: dataUtilsModule.getNextRoomNumber,

      // Modal
      showConfirmationModal: modalModule.showConfirmationModal,
      closeConfirmationModal: modalModule.closeConfirmationModal,
      undoDeletion: modalModule.undoDeletion,

      // Helpers
      removeEmptyObraMessage: helpersModule.removeEmptyObraMessage,
      showEmptyObraMessageIfNeeded: helpersModule.showEmptyObraMessageIfNeeded,
      removeEmptyProjectMessage: helpersModule.removeEmptyProjectMessage,
      showEmptyProjectMessageIfNeeded: helpersModule.showEmptyProjectMessageIfNeeded,

      // ✅ NOVO: Funções de preenchimento de dados
      fillClimatizationInputs: dataFillersModule.fillClimatizationInputs,
      fillThermalGainsData: dataFillersModule.fillThermalGainsData,
      fillCapacityData: dataFillersModule.fillCapacityData,
      // REMOVER: fillEquipamentosData: dataFillersModule.fillEquipamentosData, ← DUPLICADA
      ensureAllRoomSections: dataFillersModule.ensureAllRoomSections,
      setupRoomTitleChangeListener: dataFillersModule.setupRoomTitleChangeListener,

      // ✅ NOVO: Funções de renderização
      renderRoomFromData: roomRendererModule.renderRoomFromData,
      populateRoomData: roomRendererModule.populateRoomData,
      populateRoomInputs: roomRendererModule.populateRoomInputs,

      // UI Builders
      populateObraData: uiBuildersModule.populateObraData,
      renderObraFromData: uiBuildersModule.renderObraFromData,
      renderProjectFromData: uiBuildersModule.renderProjectFromData,
      fillMachinesData: uiBuildersModule.fillMachinesData,
      ensureMachinesSection: uiBuildersModule.ensureMachinesSection,
      populateMachineData: uiBuildersModule.populateMachineData,

      // Data Builders
      buildObraData: dataBuildersModule.buildObraData,
      buildProjectData: dataBuildersModule.buildProjectData,
      extractRoomData: dataBuildersModule.extractRoomData,
      extractMachinesData: dataBuildersModule.extractMachinesData,
      extractThermalGainsData: dataBuildersModule.extractThermalGainsData,
      extractClimatizationInputs: dataBuildersModule.extractClimatizationInputs,
      extractCapacityData: dataBuildersModule.extractCapacityData,
      extractEquipamentosData: dataBuildersModule.extractEquipamentosData,

      // Adapters
      loadObrasFromServer: loadObrasFromServer
    };

    window.systemFunctions = {};

    // ✅ CORREÇÃO: Filtrar funções válidas antes de atribuir
    Object.keys(allFunctions).forEach(funcName => {
      const func = allFunctions[funcName];
      
      if (typeof func === 'function') {
        window[funcName] = func;
        window.systemFunctions[funcName] = func;
        console.log(`✅ ${funcName} atribuída ao window`);
      } else if (func !== undefined) {
        console.warn(`⚠️ ${funcName} não é uma função:`, typeof func);
      } else {
        console.error(`❌ ${funcName} é undefined no módulo`);
      }
    });

    // ✅ CORREÇÃO: Verificar funções críticas
    const criticalFunctions = [
      'fillEquipamentosData',
      'buildEquipamentosSection',
      'initEquipamentosSystem'
    ];
    
    criticalFunctions.forEach(funcName => {
      if (typeof window[funcName] !== 'function') {
        console.error(`🚨 CRÍTICO: ${funcName} não está disponível!`);
      } else {
        console.log(`👍 ${funcName} OK`);
      }
    });

    window.modulesLoaded = true;
    console.log("✅ Todos os módulos foram carregados com sucesso");
    
    // ✅ CORREÇÃO: Verificar função específica após carregamento
    setTimeout(() => {
      console.log('🔍 Verificação pós-carregamento:');
      console.log('- fillEquipamentosData:', typeof window.fillEquipamentosData);
      console.log('- initEquipamentosSystem:', typeof window.initEquipamentosSystem);
      console.log('- buildEquipamentosSection:', typeof window.buildEquipamentosSection);
    }, 500);

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

    // ✅ CORREÇÃO: Verificação final
    console.log('🔍 Verificação final de funções:');
    console.log('- fillEquipamentosData:', typeof window.fillEquipamentosData);
    console.log('- buildEquipamentosSection:', typeof window.buildEquipamentosSection);
    
    // ✅ CORREÇÃO: Inicializar fallback manual se necessário
    if (typeof window.fillEquipamentosData !== 'function') {
      console.warn('⚠️ fillEquipamentosData não disponível, tentando fallback...');
      try {
        const equipamentosModule = await import('../data/modules/equipamentos.js');
        if (equipamentosModule.fillEquipamentosData) {
          window.fillEquipamentosData = equipamentosModule.fillEquipamentosData;
          console.log('✅ fillEquipamentosData atribuída via fallback manual');
        }
      } catch (error) {
        console.error('❌ Fallback manual falhou:', error);
      }
    }

    const event = new CustomEvent('systemInitialized', {
      detail: {
        time: loadingTime,
        timestamp: new Date().toISOString(),
        modules: window.modulesLoaded,
        constants: !!window.systemConstants,
        equipamentosReady: typeof window.fillEquipamentosData === 'function'
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