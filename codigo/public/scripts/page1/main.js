import { 
  API_CONFIG
} from './config/config.js'

// Inicializar variáveis globais simples
window.systemConstants = null;
window.projectCounter = 0;
window.GeralCount = 0;

console.log("[v0] Variáveis globais inicializadas:", {
  systemConstants: window.systemConstants,
  projectCounter: window.projectCounter,
  GeralCount: window.GeralCount
});

// Importar APENAS o necessário para inicialização
import { normalizeAllProjectsOnServer, loadProjectsFromServer, getGeralCount, createSingleBaseProject } from './data/server.js'

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
      import('./calculos/calculos.js'),
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
      calculateThermalGains: calculosModule.calculateThermalGains,

      // Utils
      ensureStringId: utilsModule.ensureStringId
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
    throw error;
  }
}

// CORREÇÃO: Função para verificar e criar projeto base se necessário
async function verifyAndCreateBaseProject() {
  console.log("[v0] Verificando necessidade de criar projeto base...");
  
  // Aguardar um pouco para garantir que tudo foi carregado
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const currentCount = getGeralCount();
  const projectsInDOM = document.querySelectorAll('.project-block').length;
  
  console.log(`[v0] Estado atual - GeralCount: ${currentCount}, Projetos no DOM: ${projectsInDOM}`);
  
  // Se não há projetos, criar projeto base
  if (currentCount === 0 && projectsInDOM === 0) {
    console.log("[v0] Nenhum projeto encontrado - criando projeto base...");
    createSingleBaseProject();
  } else {
    console.log(`[v0] Projetos já existem - GeralCount: ${currentCount}, DOM: ${projectsInDOM}`);
  }
}

// CORREÇÃO: Função de debug final
function finalSystemDebug() {
  console.log('=== DEBUG FINAL DO SISTEMA ===');
  console.log('- window.GeralCount:', window.GeralCount);
  console.log('- getGeralCount():', getGeralCount());
  console.log('- Projetos no DOM:', document.querySelectorAll('.project-block').length);
  console.log('- Salas no DOM:', document.querySelectorAll('.room-block').length);
  console.log('- Módulos carregados:', modulesLoaded);
  console.log('- Constantes carregadas:', !!window.systemConstants);
  
  // Debug detalhado dos projetos
  const projects = document.querySelectorAll('.project-block');
  projects.forEach((project, index) => {
    const projectName = project.dataset.projectName;
    const projectId = project.dataset.projectId;
    const rooms = project.querySelectorAll('.room-block');
    console.log(`- Projeto ${index + 1}: ${projectName} (ID: ${projectId}) - ${rooms.length} salas`);
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Inicializando sistema...")
  
  try {
    // 1. Carregar módulos primeiro
    await loadAllModules();
    
    // 2. Normalizar projetos no servidor
    await normalizeAllProjectsOnServer()
    
    // 3. Carregar constantes do sistema
    await loadSystemConstants();
    
    // 4. AGORA carregar projetos do servidor (depois das constantes)
    await loadProjectsFromServer()
    
    // 5. Inicializar project counter
    if (window.initializeProjectCounter) {
      await window.initializeProjectCounter();
    }
    
    // CORREÇÃO 6: Verificar e criar projeto base se necessário
    await verifyAndCreateBaseProject();
    
    console.log("[v0] Sistema inicializado - projetos carregados do servidor")
    console.log("[v0] Constantes disponíveis para cálculos:", window.systemConstants);
    
    // CORREÇÃO 7: Debug final
    setTimeout(finalSystemDebug, 1000);
    
  } catch (error) {
    console.error("[v0] ERRO na inicialização do sistema:", error);
    
    // CORREÇÃO: Mesmo com erro, tentar criar projeto base
    console.log("[v0] Tentando criar projeto base mesmo com erro...");
    setTimeout(() => {
      verifyAndCreateBaseProject();
    }, 1000);
    
    if (window.showSystemStatus) {
      window.showSystemStatus("Sistema carregado com avisos - verifique o console", "warning")
    }
  }
})

// Carregar módulos também quando uma função for chamada (fallback)
window.addEventListener('click', async (event) => {
  if (!modulesLoaded) {
    await loadAllModules();
  }
});