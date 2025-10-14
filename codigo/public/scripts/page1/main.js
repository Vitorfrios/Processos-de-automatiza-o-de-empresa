
// Inicializar variáveis globais simples
window.systemConstants = null;
window.projectCounter = 0;
window.GeralCount = 0;

console.log(" Variáveis globais inicializadas:", {
  systemConstants: window.systemConstants,
  projectCounter: window.projectCounter,
  GeralCount: window.GeralCount
});

// Importar APENAS o necessário para inicialização
import { normalizeAllProjectsOnServer, loadProjectsFromServer, getGeralCount, createSingleBaseProject } from './data/server.js'

// Carregar módulos dinamicamente
let modulesLoaded = false;

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
    console.log(" Todos os módulos foram carregados com sucesso");
    
  } catch (error) {
    console.error(" Erro ao carregar módulos:", error);
  }
}

/**
 * Carrega as constantes do sistema do servidor
 * Essenciais para todos os cálculos do sistema
 */
async function loadSystemConstants() {
  try {
    console.log(" Carregando constantes do sistema...")
    const response = await fetch(`/constants`)

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const constantsData = await response.json();
    window.systemConstants = constantsData;
    console.log(" Constantes carregadas do JSON:", window.systemConstants);
    
    if (!window.systemConstants.VARIAVEL_PD || !window.systemConstants.VARIAVEL_PS) {
      console.error(" ERRO: Constantes essenciais não encontradas no JSON:", {
        VARIAVEL_PD: window.systemConstants.VARIAVEL_PD,
        VARIAVEL_PS: window.systemConstants.VARIAVEL_PS
      });
      throw new Error("Constantes essenciais não encontradas no JSON");
    }
    
    if (window.showSystemStatus) {
      window.showSystemStatus("Constantes do sistema carregadas com sucesso", "success")
    }
  } catch (error) {
    console.error(" ERRO CRÍTICO ao carregar constantes:", error)
    if (window.showSystemStatus) {
      window.showSystemStatus("ERRO CRÍTICO: Não foi possível carregar as constantes do sistema. Verifique o servidor.", "error")
    }
    throw error;
  }
}

/**
 * Verifica se é necessário criar um projeto base quando não há projetos existentes
 * Garante que o usuário sempre tenha pelo menos um projeto para trabalhar
 */
async function verifyAndCreateBaseProject() {
  console.log(" Verificando necessidade de criar projeto base...");
  
  // Aguardar para garantir carregamento
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const currentCount = getGeralCount();
  const projectsInDOM = document.querySelectorAll('.project-block').length;
  
  console.log(` Estado atual - GeralCount: ${currentCount}, Projetos no DOM: ${projectsInDOM}`);
  
  // Se não há projetos, criar projeto base
  if (currentCount === 0 && projectsInDOM === 0) {
    console.log(" Nenhum projeto encontrado - criando projeto base...");
    createSingleBaseProject();
  } else {
    console.log(` Projetos já existem - GeralCount: ${currentCount}, DOM: ${projectsInDOM}`);
  }
}

/**
 * Função de debug para verificar o estado final do sistema após inicialização
 * Exibe informações detalhadas sobre projetos, salas e módulos carregados
 */
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

/**
 * Inicialização principal do sistema quando o DOM estiver carregado
 * Orquestra o carregamento de módulos, constantes e projetos na ordem correta
 */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Inicializando sistema...");
  
  try {
    // 1. Carregar módulos primeiro
    await loadAllModules();
    
    // 2. Carregar constantes do sistema
    await loadSystemConstants();
    
    // 3. Normalizar projetos no servidor
    await normalizeAllProjectsOnServer();
    
    // 4. Carregar projetos do servidor (AGORA FUNCIONA CORRETAMENTE)
    await loadProjectsFromServer();
    
    // 5. Inicializar project counter
    if (window.initializeProjectCounter) {
      await window.initializeProjectCounter();
    }
    
    // 6. Verificação de fallback (apenas se realmente necessário)
    await verifyAndCreateBaseProject();
    
    console.log("✅ Sistema inicializado com sucesso");
    
    // Debug final
    setTimeout(finalSystemDebug, 1000);
    
  } catch (error) {
    console.error("❌ ERRO na inicialização do sistema:", error);
    
    // Fallback robusto
    setTimeout(() => {
      console.log("🔄 Executando fallback...");
      verifyAndCreateBaseProject();
    }, 1000);
  }
});

/**
 * Fallback: Carrega módulos quando qualquer função for chamada (caso não tenham carregado ainda)
 * Garante que o sistema funcione mesmo se o carregamento inicial falhar
 */
window.addEventListener('click', async (event) => {
  if (!modulesLoaded) {
    await loadAllModules();
  }
});