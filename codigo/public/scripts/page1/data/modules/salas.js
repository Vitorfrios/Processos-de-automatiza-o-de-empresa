import { buildClimatizationSection } from './climatizacao.js'
import { buildMachinesSection } from './maquinas.js'
import { buildConfigurationSection } from './configuracao.js'

function buildRoomHTML(projectName, roomName, roomId) {
  return `
    <div class="room-block" data-room-id="${roomId || ""}" data-room-name="${roomName}">
      ${buildRoomHeader(projectName, roomName)}
      <div class="room-content collapsed" id="room-content-${projectName}-${roomName}">
        ${buildClimatizationSection(projectName, roomName)}
        ${buildMachinesSection(projectName, roomName)}
        ${buildConfigurationSection(projectName, roomName)}
        ${buildRoomActions(projectName, roomName)}
      </div>
    </div>
  `
}

function buildRoomHeader(projectName, roomName) {
  return `
    <div class="room-header">
      <button class="minimizer" onclick="toggleRoom('${projectName}-${roomName}')">+</button>
      <h3 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h3>
      <button class="btn btn-delete-small" onclick="deleteRoom('${projectName}', '${roomName}')">Deletar</button>
    </div>
  `
}

function buildRoomActions(projectName, roomName) {
  return ""
}

export {
  buildRoomHTML,
  buildRoomHeader,
  buildRoomActions
}