import { createEmptyProject } from '../ui/interface.js'
import { createEmptyRoom } from './rooms.js'
import { updateProjectButton } from './server.js'
import { calculateVazaoArAndThermalGains } from '../calculos/calculos.js'
import { ensureStringId } from '../utils/utils.js'
// CORREÇÃO: Importar funções do contador
import { getGeralCount, incrementGeralCount } from './server.js'

function renderProjectFromData(projectData) {
  const projectName = projectData.nome
  const projectId = ensureStringId(projectData.id)

  console.log(`[v0] Renderizando projeto: ${projectName} (ID: ${projectId})`)

  createEmptyProject(projectName, projectId)

  if (projectData.salas && projectData.salas.length > 0) {
    const projectContent = document.getElementById(`project-content-${projectName}`)
    // CORREÇÃO: Verificar se projectContent existe
    if (projectContent) {
      const emptyMessage = projectContent.querySelector(".empty-message")
      if (emptyMessage) {
        emptyMessage.remove()
      }

      // CORREÇÃO: Pequeno delay para garantir que o projeto foi criado antes de adicionar salas
      setTimeout(() => {
        projectData.salas.forEach((roomData) => {
          renderRoomFromData(projectName, roomData)
        })
      }, 100);
    }
  }

  if (projectId) {
    updateProjectButton(projectName, true)
  }

  // CORREÇÃO: Atualizar o contador quando renderizar projeto existente
  if (projectId && projectId !== "" && projectId !== "null") {
    const currentCount = getGeralCount();
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

  // CORREÇÃO: Pequeno delay para garantir que o projeto está pronto
  setTimeout(() => {
    createEmptyRoom(projectName, roomName, roomId)

    // CORREÇÃO: Delay adicional para garantir que a sala foi criada antes de preencher inputs
    setTimeout(() => {
      if (roomData.inputs) {
        populateRoomInputs(projectName, roomName, roomData.inputs, roomData.ganhosTermicos)
      }
    }, 50);
    
  }, 50);

  console.log(`[v0] Sala ${roomName} renderizada com sucesso`)
}

function populateRoomInputs(projectName, roomName, inputsData, ganhosTermicos) {
  // CORREÇÃO: Tentar encontrar a sala múltiplas vezes com timeout
  let attempts = 0;
  const maxAttempts = 10;
  
  const tryPopulate = () => {
    const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
    
    if (!roomBlock && attempts < maxAttempts) {
      attempts++;
      console.log(`[v0] Tentativa ${attempts} - Sala ${roomName} não encontrada, tentando novamente...`)
      setTimeout(tryPopulate, 100);
      return;
    }
    
    if (!roomBlock) {
      console.error(`[v0] Sala ${roomName} não encontrada após ${maxAttempts} tentativas`)
      return;
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
        // CORREÇÃO: Não preencher inputs com zero
        if (value === 0 || value === "0") {
          input.value = ""; // Manter vazio se for zero
        } else {
          input.value = value
        }
      }
    })

    // CORREÇÃO: Pequeno delay para garantir que os inputs foram renderizados
    setTimeout(() => {
      calculateVazaoArAndThermalGains(roomId)
    }, 150);

    console.log(`[v0] Inputs da sala ${roomName} preenchidos e cálculos recalculados`)
  };
  
  tryPopulate();
}

// CORREÇÃO: Adicionar função de debug
function debugServerUtils() {
  console.log('=== DEBUG SERVER-UTILS ===');
  console.log('- Projetos renderizados:', document.querySelectorAll('.project-block').length);
  console.log('- Salas renderizadas:', document.querySelectorAll('.room-block').length);
  console.log('- GeralCount:', getGeralCount());
  
  // Debug detalhado das salas
  const projects = document.querySelectorAll('.project-block');
  projects.forEach((project, pIndex) => {
    const projectName = project.dataset.projectName;
    const rooms = project.querySelectorAll('.room-block');
    console.log(`- Projeto ${pIndex + 1} (${projectName}): ${rooms.length} salas`);
    
    rooms.forEach((room, rIndex) => {
      const roomName = room.dataset.roomName;
      console.log(`  - Sala ${rIndex + 1}: ${roomName}`);
    });
  });
}

export {
  renderProjectFromData,
  renderRoomFromData,
  populateRoomInputs,
  debugServerUtils
}