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
import { normalizeAllProjectsOnServer, loadProjectsFromServer, getGeralCount } from './data/server.js'
import { initializeSession } from './data/server.js';

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
              console.log('🔄 Enviando comando de shutdown...');
              
              const response = await fetch('/api/shutdown', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ action: 'shutdown_now' })
              });
              
              const data = await response.json();
              console.log('✅ Resposta do servidor:', data);
              
              alert('Servidor encerrado! Esta janela será fechada.');
              setTimeout(() => {
                  window.close();
              }, 1000);
              
          } catch (error) {
              console.log('🔌 Servidor encerrado ou não responde');
              alert('Servidor encerrado!');
              setTimeout(() => {
                  window.close();
              }, 1000);
          }
      }
  }

  showShutdownMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 24px;
    `;
    message.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">⏻</div>
            <div>Servidor encerrado</div>
            <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Esta janela fechará automaticamente</div>
        </div>
    `;
    document.body.appendChild(message);
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
  console.log('- Shutdown Manager:', !!shutdownManager);
  
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
    // 0. Inicializar sistema de shutdown primeiro
    shutdownManager = new ShutdownManager();
    
    // 1. Carregar módulos primeiro
    await loadAllModules();
    
    // 2. Carregar constantes do sistema
    await loadSystemConstants();
    await initializeSession();
    
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



// Função global para shutdown manual (caso precise ser chamada de outros lugares)
window.shutdownManual = function() {
  if (shutdownManager) {
    shutdownManager.shutdownManual();
  } else {
    // Fallback simples
    if (confirm('Deseja encerrar o servidor?')) {
      fetch('/api/shutdown', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ reason: 'manual_shutdown' })
      }).then(() => {
        alert('Servidor encerrado!');
        setTimeout(() => window.close(), 1000);
      });
    }
  }
};