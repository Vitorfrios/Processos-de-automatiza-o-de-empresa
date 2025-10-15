import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../../ui/interface.js'
import { buildRoomHTML } from './salas.js' 

// Importar a função de pré-carregamento
let machinesPreloadModule = null;

/**
 * Carrega o módulo de máquinas para pré-carregamento
 */
async function loadMachinesPreloadModule() {
    if (!machinesPreloadModule) {
        try {
            machinesPreloadModule = await import('./machines/machinesBuilder.js');
            console.log("✅ Módulo de máquinas carregado para pré-carregamento");
        } catch (error) {
            console.error("❌ Erro ao carregar módulo de máquinas:", error);
        }
    }
    return machinesPreloadModule;
}

/**
 * Cria uma nova sala vazia no projeto especificado
 * Insere o HTML da sala e inicializa componentes necessários
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala (opcional)
 * @returns {boolean} True se a sala foi criada com sucesso
 */
async function createEmptyRoom(projectName, roomName, roomId) {
  console.log(`🔄 Criando sala: ${roomName} no projeto ${projectName}`);
  
  try {
    // PRÉ-CARREGA dados das máquinas ANTES de criar a sala
    const machinesModule = await loadMachinesPreloadModule();
    if (machinesModule && machinesModule.preloadMachinesDataForRoom) {
      const fullRoomId = roomId || `${projectName}-${roomName}`;
      await machinesModule.preloadMachinesDataForRoom(fullRoomId);
    }
  } catch (error) {
    console.error("⚠️  Aviso: Não foi possível pré-carregar dados das máquinas:", error);
  }

  const roomHTML = buildRoomHTML(projectName, roomName, roomId);
  const projectContent = document.getElementById(`project-content-${projectName}`);
  
  if (!projectContent) {
    console.error(`❌ Conteúdo do projeto ${projectName} não encontrado para adicionar sala`);
    return false;
  }

  removeEmptyProjectMessage(projectContent);
  
  const addRoomSection = projectContent.querySelector('.add-room-section');
  if (addRoomSection) {
    addRoomSection.insertAdjacentHTML('beforebegin', roomHTML);
  } else {
    projectContent.insertAdjacentHTML('beforeend', roomHTML);
  }

  console.log(`✅ Sala ${roomName} criada no projeto ${projectName}`);
  
  // Inicializa componentes após criação da sala
  initializeRoomComponents(projectName, roomName, roomId);
  
  return true;
}

/**
 * Inicializa todos os componentes da sala após criação
 */
function initializeRoomComponents(projectName, roomName, roomId) {
  const fullRoomId = roomId || `${projectName}-${roomName}`;
  
  // 1. Inicializar fator de segurança
  setTimeout(() => {
    if (typeof initializeFatorSeguranca === 'function') {
      initializeFatorSeguranca(fullRoomId);
      console.log(`✅ Fator de segurança inicializado para ${fullRoomId}`);
    }
  }, 500);
  
  // 2. Sincronizar backup
  setTimeout(() => {
    if (typeof window.syncCapacityTableBackup !== 'undefined') {
      window.syncCapacityTableBackup(fullRoomId);
      console.log(`✅ Backup sincronizado para ${fullRoomId}`);
    }
  }, 800);
  
  // 3. Inicializar componentes das máquinas (NOVO)
  setTimeout(() => {
    if (typeof initializeMachineComponentsForRoom === 'function') {
      initializeMachineComponentsForRoom(fullRoomId);
    } else {
      console.log(`⚠️ initializeMachineComponentsForRoom não disponível para ${fullRoomId}`);
    }
  }, 1200);
  
  // 4. Verificar dados das máquinas
  setTimeout(() => {
    if (window.machinesData && window.machinesData.length > 0) {
      console.log(`✅ Dados das máquinas disponíveis para ${fullRoomId}: ${window.machinesData.length} máquinas`);
    } else {
      console.log(`⚠️ Dados das máquinas não disponíveis para ${fullRoomId}`);
    }
  }, 1500);
}

/**
 * Insere o HTML de uma sala no conteúdo do projeto
 * @param {HTMLElement} projectContent - Elemento do conteúdo do projeto
 * @param {string} roomHTML - HTML da sala a ser inserida
 */
function insertRoomIntoProject(projectContent, roomHTML) {
  const addRoomSection = projectContent.querySelector(".add-room-section");
  if (addRoomSection) {
    addRoomSection.insertAdjacentHTML("beforebegin", roomHTML);
  } else {
    projectContent.insertAdjacentHTML("beforeend", roomHTML);
  }
}

/**
 * Adiciona uma nova sala ao projeto com nome automático
 * @param {string} projectName - Nome do projeto onde adicionar a sala
 */
async function addNewRoom(projectName) {
  console.log(`➕ Adicionando nova sala ao projeto ${projectName}`);
  
  const projectContent = document.getElementById(`project-content-${projectName}`);
  if (!projectContent) {
    console.error(`❌ Projeto ${projectName} não encontrado`);
    return;
  }
  
  const roomCount = projectContent.querySelectorAll(".room-block").length + 1;
  const roomName = `Sala${roomCount}`;

  await createEmptyRoom(projectName, roomName, null);
  console.log(`✅ ${roomName} adicionada ao ${projectName}`);
}

/**
 * Corrige inputs de fator de segurança que estejam vazios
 * Aplica valores padrão baseados nas constantes do sistema
 */
function fixExistingCapacityInputs() {
  console.log('🔄 Verificando inputs de capacidade existentes...');
  
  // Encontrar todas as salas
  const roomBlocks = document.querySelectorAll('.room-block');
  
  roomBlocks.forEach(roomBlock => {
    const roomName = roomBlock.dataset.roomName;
    const projectName = roomBlock.closest('.project-block')?.dataset.projectName;
    
    if (roomName && projectName) {
      const roomId = `${projectName}-${roomName}`;
      const input = document.getElementById(`fator-seguranca-${roomId}`);
      
      if (input && input.value === '') {
        const valor = window.systemConstants?.FATOR_SEGURANCA_CAPACIDADE || 10;
        input.value = valor;
        console.log(`✅ Input ${roomId} corrigido: ${valor}%`);
      }
    }
  });
}

// Executar quando o projeto for carregado
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(fixExistingCapacityInputs, 2000);
});

/**
 * Remove uma sala do projeto após confirmação do usuário
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala a ser removida
 */
function deleteRoom(projectName, roomName) {
  const confirmMessage = "Tem certeza que deseja deletar esta sala? Os dados permanecerão no servidor.";

  if (!confirm(confirmMessage)) return;

  const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`);
  if (!roomBlock) {
    console.error(`❌ Sala ${roomName} não encontrada para remoção`);
    return;
  }

  const projectContent = roomBlock.closest(".project-content");

  roomBlock.remove();
  showEmptyProjectMessageIfNeeded(projectContent);

  console.log(`🗑️  Sala ${roomName} removida da interface`);
}

export {
  createEmptyRoom,
  insertRoomIntoProject,
  addNewRoom,
  deleteRoom
}