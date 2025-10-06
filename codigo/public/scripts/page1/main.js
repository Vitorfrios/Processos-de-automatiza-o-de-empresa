import { 
  API_CONFIG
} from './config/config.js'

// Variáveis globais simples
window.systemConstants = null;
window.projectCounter = 0;
window.GeralCount = 0;

// Importar APENAS o necessário para inicialização
import { normalizeAllProjectsOnServer, loadProjectsFromServer } from './data/server.js'

// Carregar módulos dinamicamente
let modulesLoaded = false;

async function loadAllModules() {
  if (modulesLoaded) return;
  
  try {
    const modules = await Promise.all([
      import('./ui/interface.js'),
      import('./ui/edit.js'),
      import('./data/projects.js'),
      import('./data/rooms.js'),
      import('./calculos/calculos.js')
    ]);

    const [
      interfaceModule,
      editModule,
      projectsModule,
      roomsModule,
      calculosModule
    ] = modules;

    // Atribuir TODAS as funções ao window
    Object.assign(window, {
      // UI Interface
      toggleProject: interfaceModule.toggleProject,
      toggleRoom: interfaceModule.toggleRoom,
      toggleSection: interfaceModule.toggleSection,
      toggleSubsection: interfaceModule.toggleSubsection,
      addNewProject: interfaceModule.addNewProject,
      collapseElement: interfaceModule.collapseElement,
      expandElement: interfaceModule.expandElement,
      showSystemStatus: interfaceModule.showSystemStatus,

      // Edit
      makeEditable: editModule.makeEditable,

      // Projects
      deleteProject: projectsModule.deleteProject,
      verifyProjectData: projectsModule.verifyProjectData,
      saveProject: projectsModule.saveProject,
      getNextProjectNumber: projectsModule.getNextProjectNumber,
      initializeProjectCounter: projectsModule.initializeProjectCounter,

      // Rooms
      addNewRoom: roomsModule.addNewRoom,
      deleteRoom: roomsModule.deleteRoom,
      addMachine: roomsModule.addMachine,
      deleteMachine: roomsModule.deleteMachine,
      createEmptyRoom: roomsModule.createEmptyRoom,

      // Cálculos
      calculateVazaoArAndThermalGains: calculosModule.calculateVazaoArAndThermalGains,
      calculateVazaoAr: calculosModule.calculateVazaoAr,
      calculateThermalGains: calculosModule.calculateThermalGains
    });

    modulesLoaded = true;
    console.log("[v0] Todos os módulos foram carregados com sucesso");
    
  } catch (error) {
    console.error("[v0] Erro ao carregar módulos:", error);
  }
}

async function loadSystemConstants() {
  try {
    console.log("[v0] Carregando constantes do sistema...")
    const response = await fetch(`${API_CONFIG.data}/constants`)

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const constantsData = await response.json();
    window.systemConstants = constantsData;
    console.log("[v0] Constantes carregadas do JSON:", window.systemConstants);
    
    // Verificar se as constantes essenciais estão presentes
    if (!window.systemConstants.VARIAVEL_PD || !window.systemConstants.VARIAVEL_PS) {
      console.error("[v0] ERRO: Constantes essenciais não encontradas no JSON:", {
        VARIAVEL_PD: window.systemConstants.VARIAVEL_PD,
        VARIAVEL_PS: window.systemConstants.VARIAVEL_PS
      });
      throw new Error("Constantes essenciais não encontradas no JSON");
    }
    
    if (window.showSystemStatus) {
      window.showSystemStatus("Constantes do sistema carregadas com sucesso", "success")
    }
  } catch (error) {
    console.error("[v0] ERRO CRÍTICO ao carregar constantes:", error)
    if (window.showSystemStatus) {
      window.showSystemStatus("ERRO CRÍTICO: Não foi possível carregar as constantes do sistema. Verifique o servidor.", "error")
    }
    // NÃO usar fallback - parar a execução se não carregar do JSON
    throw error;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Inicializando sistema...")
  
  try {
    // Carregar módulos primeiro
    await loadAllModules();
    
    // Carregar constantes do sistema ANTES de qualquer cálculo
    await loadSystemConstants();
    
    await normalizeAllProjectsOnServer()
    await loadProjectsFromServer()
    
    // Inicializar project counter usando a função do módulo
    if (window.initializeProjectCounter) {
      await window.initializeProjectCounter();
    }
    
    console.log("[v0] Sistema inicializado - projetos carregados do servidor")
    console.log("[v0] Constantes disponíveis para cálculos:", window.systemConstants);
    
  } catch (error) {
    console.error("[v0] ERRO na inicialização do sistema:", error);
    alert("ERRO: Não foi possível inicializar o sistema. Verifique o console para detalhes.");
  }
})

// Carregar módulos também quando uma função for chamada (fallback)
window.addEventListener('click', async (event) => {
  if (!modulesLoaded) {
    await loadAllModules();
  }
});