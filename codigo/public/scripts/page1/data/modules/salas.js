import { buildClimatizationSection } from './climatizacao.js'
import { buildMachinesSection } from './maquinas.js'
import { buildConfigurationSection } from './configuracao.js'

/**
 * Constrói o HTML completo de uma sala com todas as seções
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala (opcional)
 * @returns {string} HTML completo da sala
 */
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

/**
 * Constrói o cabeçalho da sala com título editável e botões de ação
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @returns {string} HTML do cabeçalho da sala
 */
function buildRoomHeader(projectName, roomName) {
  return `
    <div class="room-header">
      <button class="minimizer" onclick="toggleRoom('${projectName}-${roomName}')">+</button>
      <h3 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h3>
      <button class="btn btn-delete-small" onclick="deleteRoom('${projectName}', '${roomName}')">Deletar</button>
    </div>
  `
}

/**
 * Constrói a seção de ações da sala (atualmente vazia)
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @returns {string} HTML das ações da sala
 */
function buildRoomActions(projectName, roomName) {
  return ""
}

export {
  buildRoomHTML,
  buildRoomHeader,
  buildRoomActions
}