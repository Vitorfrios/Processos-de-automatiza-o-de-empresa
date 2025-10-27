// Inicializar variáveis globais simples
window.systemConstants = null;
window.obraCounter = 0; // ATUALIZADO: projectCounter → obraCounter
window.GeralCount = 0;

console.log(" Variáveis globais inicializadas:", {
  systemConstants: window.systemConstants,
  obraCounter: window.obraCounter, // ATUALIZADO
  GeralCount: window.GeralCount
});

// Importar APENAS o necessário para inicialização
import { loadObrasFromServer, getGeralCount } from './data/server.js' // ATUALIZADO
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
      import('./data/projects.js'), // MANTIDO para funções de projeto dentro de obras
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

    // Atribuir TODAS as funções ao window - ATUALIZADO para obras
    Object.assign(window, {
      // UI Interface - ATUALIZADO
      toggleObra: interfaceModule.toggleObra, // NOVA
      toggleProject: interfaceModule.toggleProject,
      toggleRoom: interfaceModule.toggleRoom,
      toggleSection: interfaceModule.toggleSection,
      toggleSubsection: interfaceModule.toggleSubsection,
      addNewObra: interfaceModule.addNewObra, // ATUALIZADO: addNewProject → addNewObra
      addNewProjectToObra: interfaceModule.addNewProjectToObra, // NOVA
      collapseElement: interfaceModule.collapseElement,
      expandElement: interfaceModule.expandElement,
      showSystemStatus: interfaceModule.showSystemStatus,
      saveOrUpdateObra: interfaceModule.saveOrUpdateObra, // NOVA
      verifyObraData: interfaceModule.verifyObraData, // NOVA
      deleteObra: interfaceModule.deleteObra, // NOVA

      // Edit
      makeEditable: editModule.makeEditable,

      // Projects - MANTIDO para operações dentro de obras
      deleteProject: projectsModule.deleteProject,
      saveOrUpdateObra: projectsModule.saveObra, // ATUALIZADO: saveProject → saveObra

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
  // O sistema agora começa completamente vazio
  if (obrasInDOM === 0 && currentCount === 0) {
    console.log("📭 Sistema iniciado vazio - aguardando ação do usuário");
    console.log("💡 Dica: Clique em 'Nova Obra' para começar");
    // ❌ REMOVIDO: window.addNewObra() automático
    // O usuário deve clicar em "Nova Obra" manualmente
  }
}

/**
 * Função de debug para verificar o estado final do sistema após inicialização
 * Exibe informações detalhadas sobre obras, projetos e módulos carregados
 */
function finalSystemDebug() {
  console.log('=== DEBUG FINAL DO SISTEMA ===');
  console.log('- window.GeralCount:', window.GeralCount);
  console.log('- getGeralCount():', getGeralCount());
  console.log('- Obras no DOM:', document.querySelectorAll('.obra-block').length); // ATUALIZADO
  console.log('- Projetos no DOM:', document.querySelectorAll('.project-block').length);
  console.log('- Salas no DOM:', document.querySelectorAll('.room-block').length);
  console.log('- Módulos carregados:', modulesLoaded);
  console.log('- Constantes carregadas:', !!window.systemConstants);
  console.log('- Shutdown Manager:', !!shutdownManager);
  
  // Debug detalhado das obras - ATUALIZADO
  const obras = document.querySelectorAll('.obra-block');
  obras.forEach((obra, index) => {
    const obraName = obra.dataset.obraName;
    const obraId = obra.dataset.obraId;
    const projects = obra.querySelectorAll('.project-block');
    console.log(`- Obra ${index + 1}: ${obraName} (ID: ${obraId}) - ${projects.length} projetos`);
    
    // Debug dos projetos dentro da obra
    projects.forEach((project, projIndex) => {
      const projectName = project.dataset.projectName;
      const projectId = project.dataset.projectId;
      const rooms = project.querySelectorAll('.room-block');
      console.log(`  ↳ Projeto ${projIndex + 1}: ${projectName} (ID: ${projectId}) - ${rooms.length} salas`);
    });
  });
}

/**
 * Inicialização principal do sistema quando o DOM estiver carregado
 * CORREÇÃO: NÃO INICIA SESSÃO AUTOMATICAMENTE - SISTEMA COMEÇA VAZIO
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
    
    // ✅ CORREÇÃO: NÃO INICIA SESSÃO AUTOMATICAMENTE
    // await initializeSession(); // ❌ REMOVIDO
    console.log("📭 Sessão não iniciada automaticamente - sistema começa vazio");
    
    // 3. ✅ CORREÇÃO: Só verifica obras existentes, não carrega automaticamente
    await verifyAndCreateBaseObra();
    
    console.log("✅ Sistema inicializado com sucesso - PRONTO PARA USO");
    console.log("💡 Dica: Clique em 'Nova Obra' para começar");
    
    // Mostrar status do sistema para usuário
    // Espera 5 segundos antes de mostrar o status
    setTimeout(() => {
      if (window.showSystemStatus) {
        setTimeout(() => {
          window.showSystemStatus("Sistema carregado. Clique em 'Nova Obra' para começar.", "success");
        }, 500);
      }
    }, 1000);



    
    // Debug final
    setTimeout(finalSystemDebug, 1000);
    
  } catch (error) {
    console.error("❌ ERRO na inicialização do sistema:", error);
    
    // ✅ CORREÇÃO: Fallback também não cria obra automática
    setTimeout(() => {
      console.log("🔄 Sistema em estado de espera - aguardando ação do usuário");
      if (window.showSystemStatus) {
        window.showSystemStatus("Sistema carregado com avisos. Clique em 'Nova Obra' para começar.", "warning");
      }
    }, 1000);
  }
});