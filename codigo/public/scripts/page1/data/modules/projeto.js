import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../../ui/interface.js'
import { buildRoomHTML } from './salas.js' 

function createEmptyRoom(projectName, roomName, roomId) {
  const roomHTML = buildRoomHTML(projectName, roomName, roomId)
  const projectContent = document.getElementById(`project-content-${projectName}`)
  
  if (!projectContent) {
    console.error(`[v0] Conteúdo do projeto ${projectName} não encontrado para adicionar sala`)
    return false
  }

  // Remover mensagem de "nenhuma sala" se existir
  removeEmptyProjectMessage(projectContent)
  
  // Inserir a sala antes do botão "Adicionar Nova Sala"
  const addRoomSection = projectContent.querySelector('.add-room-section')
  if (addRoomSection) {
    addRoomSection.insertAdjacentHTML('beforebegin', roomHTML)
  } else {
    // Se não encontrar a seção, inserir no final
    projectContent.insertAdjacentHTML('beforeend', roomHTML)
  }

  console.log(`[v0] Sala ${roomName} criada no projeto ${projectName}`)
  
  // CORREÇÃO: Inicializar fator de segurança após criar a sala
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
function insertRoomIntoProject(projectContent, roomHTML) {
  const addRoomSection = projectContent.querySelector(".add-room-section")
  addRoomSection.insertAdjacentHTML("beforebegin", roomHTML)
}

function addNewRoom(projectName) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const roomCount = projectContent.querySelectorAll(".room-block").length + 1
  const roomName = `Sala${roomCount}`

  createEmptyRoom(projectName, roomName, null)
  console.log(`[v0] ${roomName} adicionada ao ${projectName}`)
}

// Função para corrigir inputs de fator de segurança em HTML existente
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

function deleteRoom(projectName, roomName) {
  const confirmMessage = "Tem certeza que deseja deletar esta sala? Os dados permanecerão no servidor."

  if (!confirm(confirmMessage)) return

  const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
  const projectContent = roomBlock.closest(".project-content")

  roomBlock.remove()
  showEmptyProjectMessageIfNeeded(projectContent)

  console.log(`[v0] Sala ${roomName} removida da interface`)
}

export {
  createEmptyRoom,
  insertRoomIntoProject,
  addNewRoom,
  deleteRoom
}