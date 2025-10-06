import { createEmptyProject } from '../ui/interface.js'
import { createEmptyRoom } from './rooms.js'
import { updateProjectButton } from './server.js'
import { calculateVazaoArAndThermalGains } from '../calculos/calculos.js'


function renderProjectFromData(projectData) {
  const projectName = projectData.nome
  const projectId = ensureStringId(projectData.id)

  console.log(`[v0] Renderizando projeto: ${projectName} (ID: ${projectId})`)

  createEmptyProject(projectName, projectId)

  if (projectData.salas && projectData.salas.length > 0) {
    const projectContent = document.getElementById(`project-content-${projectName}`)
    const emptyMessage = projectContent.querySelector(".empty-message")
    if (emptyMessage) {
      emptyMessage.remove()
    }

    projectData.salas.forEach((roomData) => {
      renderRoomFromData(projectName, roomData)
    })
  }

  if (projectId) {
    updateProjectButton(projectName, true)
  }

  const projectNumber = Number.parseInt(projectName.replace("Projeto", "")) || 0
  if (projectNumber > projectCounter) {
    projectCounter = projectNumber
  }

  console.log(`[v0] Projeto ${projectName} renderizado com sucesso`)
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
      input.value = value
    }
  })

  calculateVazaoArAndThermalGains(roomId)

  console.log(`[v0] Inputs da sala ${roomName} preenchidos e cálculos recalculados`)
}

export {
  renderProjectFromData,
  renderRoomFromData,
  populateRoomInputs
}