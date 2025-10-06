import { createEmptyProject } from '../ui/interface.js'
import { createEmptyRoom } from './rooms.js'
import { updateProjectButton } from './server.js'
import { calculateVazaoArAndThermalGains } from '../calculos/calculos.js'
import { ensureStringId } from '../utils/utils.js'
// CORREÇÃO 1: Importar funções do contador
import { getGeralCount, incrementGeralCount } from './server.js'

function renderProjectFromData(projectData) {
  const projectName = projectData.nome
  const projectId = ensureStringId(projectData.id)

  console.log(`[v0] Renderizando projeto: ${projectName} (ID: ${projectId})`)

  createEmptyProject(projectName, projectId)

  if (projectData.salas && projectData.salas.length > 0) {
    const projectContent = document.getElementById(`project-content-${projectName}`)
    // CORREÇÃO 2: Verificar se projectContent existe
    if (projectContent) {
      const emptyMessage = projectContent.querySelector(".empty-message")
      if (emptyMessage) {
        emptyMessage.remove()
      }
    }
  }

  if (projectId) {
    updateProjectButton(projectName, true)
  }

  // CORREÇÃO 3: Atualizar o contador quando renderizar projeto existente
  if (projectId && projectId !== "" && projectId !== "null") {
    // Verificar se é um projeto novo (não está no contador atual)
    const currentCount = getGeralCount();
    // Se o contador está vazio, incrementar
    if (currentCount === 0) {
      incrementGeralCount();
      console.log(`[v0] Projeto renderizado - GeralCount incrementado para: ${getGeralCount()}`)
    }
  }

  const projectNumber = Number.parseInt(projectName.replace("Projeto", "")) || 0
  if (projectNumber > window.projectCounter) {
    window.projectCounter = projectNumber
  }

  console.log(`[v0] Projeto ${projectName} renderizado com sucesso - GeralCount: ${getGeralCount()}`)
}

function renderRoomFromData(projectName, roomData) {
  const roomName = roomData.nome
  const roomId = ensureStringId(roomData.id)

  console.log(`[v0] Renderizando sala: ${roomName} no projeto ${projectName}`)

  createEmptyRoom(projectName, roomName, roomId)

  if (roomData.inputs) {
    populateRoomInputs(projectName, roomName, roomData.inputs, roomData.ganhosTermicos)
  }

  console.log(`[v0] Sala ${roomName} renderizada com sucesso`)
}

function populateRoomInputs(projectName, roomName, inputsData, ganhosTermicos) {
  const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
  if (!roomBlock) {
    console.error(`[v0] Sala ${roomName} não encontrada`)
    return
  }

  const roomId = `${projectName}-${roomName}`

  Object.entries(inputsData).forEach(([field, value]) => {
    if (field === "vazaoArExterno") {
      const vazaoElement = document.getElementById(`vazao-ar-${roomId}`)
      if (vazaoElement) {
        vazaoElement.textContent = value
      }
      return
    }

    const input = roomBlock.querySelector(`.clima-input[data-field="${field}"]`)
    if (input) {
      // CORREÇÃO 4: Não preencher inputs com zero
      if (value === 0 || value === "0") {
        input.value = ""; // Manter vazio se for zero
      } else {
        input.value = value
      }
    }
  })

  // CORREÇÃO 5: Pequeno delay para garantir que os inputs foram renderizados
  setTimeout(() => {
    calculateVazaoArAndThermalGains(roomId)
  }, 100);

  console.log(`[v0] Inputs da sala ${roomName} preenchidos e cálculos recalculados`)
}

// CORREÇÃO 6: Adicionar função de debug
function debugServerUtils() {
  console.log('=== DEBUG SERVER-UTILS ===');
  console.log('- Projetos renderizados:', document.querySelectorAll('.project-block').length);
  console.log('- Salas renderizadas:', document.querySelectorAll('.room-block').length);
  console.log('- GeralCount:', getGeralCount());
}

export {
  renderProjectFromData,
  renderRoomFromData,
  populateRoomInputs,
  debugServerUtils
}