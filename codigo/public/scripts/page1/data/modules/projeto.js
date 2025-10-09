import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../../ui/interface.js'
import { buildRoomHTML } from './salas.js' 

/**
 * Cria uma nova sala vazia no projeto especificado
 * Insere o HTML da sala e inicializa componentes necessários
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala (opcional)
 * @returns {boolean} True se a sala foi criada com sucesso
 */
function createEmptyRoom(projectName, roomName, roomId) {
  const roomHTML = buildRoomHTML(projectName, roomName, roomId)
  const projectContent = document.getElementById(`project-content-${projectName}`)
  
  if (!projectContent) {
    console.error(` Conteúdo do projeto ${projectName} não encontrado para adicionar sala`)
    return false
  }

  removeEmptyProjectMessage(projectContent)
  
  const addRoomSection = projectContent.querySelector('.add-room-section')
  if (addRoomSection) {
    addRoomSection.insertAdjacentHTML('beforebegin', roomHTML)
  } else {

    projectContent.insertAdjacentHTML('beforeend', roomHTML)
  }

  console.log(` Sala ${roomName} criada no projeto ${projectName}`)
  
  setTimeout(() => {
    if (typeof initializeFatorSeguranca === 'function') {
      const newRoomId = roomId || `${projectName}-${roomName}`;
      initializeFatorSeguranca(newRoomId);
    }
  }, 500);
  setTimeout(() => {
    const fullRoomId = `${projectName}-${roomName}`;
    if (typeof window.syncCapacityTableBackup !== 'undefined') {
      window.syncCapacityTableBackup(fullRoomId);
    }
  }, 800);
  return true
}

/**
 * Insere o HTML de uma sala no conteúdo do projeto
 * @param {HTMLElement} projectContent - Elemento do conteúdo do projeto
 * @param {string} roomHTML - HTML da sala a ser inserida
 */
function insertRoomIntoProject(projectContent, roomHTML) {
  const addRoomSection = projectContent.querySelector(".add-room-section")
  addRoomSection.insertAdjacentHTML("beforebegin", roomHTML)
}

/**
 * Adiciona uma nova sala ao projeto com nome automático
 * @param {string} projectName - Nome do projeto onde adicionar a sala
 */
function addNewRoom(projectName) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const roomCount = projectContent.querySelectorAll(".room-block").length + 1
  const roomName = `Sala${roomCount}`

  createEmptyRoom(projectName, roomName, null)
  console.log(` ${roomName} adicionada ao ${projectName}`)
}

/**
 * Corrige inputs de fator de segurança que estejam vazios
 * Aplica valores padrão baseados nas constantes do sistema
 */
function fixExistingCapacityInputs() {
  console.log('[FIX] Verificando inputs de capacidade existentes...');
  
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
        console.log(`[FIX] ✅ Input ${roomId} corrigido: ${valor}%`);
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
  const confirmMessage = "Tem certeza que deseja deletar esta sala? Os dados permanecerão no servidor."

  if (!confirm(confirmMessage)) return

  const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
  const projectContent = roomBlock.closest(".project-content")

  roomBlock.remove()
  showEmptyProjectMessageIfNeeded(projectContent)

  console.log(` Sala ${roomName} removida da interface`)
}

export {
  createEmptyRoom,
  insertRoomIntoProject,
  addNewRoom,
  deleteRoom
}