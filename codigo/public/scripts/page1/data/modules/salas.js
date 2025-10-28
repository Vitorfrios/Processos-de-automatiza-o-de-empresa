// salas.js
import { buildClimatizationSection } from './climatizacao.js'
import { buildMachinesSection } from './maquinas.js'
import { buildConfigurationSection } from './configuracao.js'

/**
 * Constrói o HTML completo de uma sala com todas as seções
 * Inclui cabeçalho, climatização, máquinas e configurações
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML completo da sala
 */
function buildRoomHTML(obraName, projectName, roomName, roomId) {
    console.log(`[BUILD ROOM] Parâmetros:`, { obraName, projectName, roomName, roomId });
    
    // Usar o roomId fornecido (agora é único)
    const finalRoomId = roomId;
    
    console.log(`[BUILD ROOM] ID ÚNICO: ${finalRoomId}`);
    
    return `
      <div class="room-block" data-room-id="${finalRoomId}" data-room-name="${roomName}" data-project-name="${projectName}" data-obra-name="${obraName}">
        <div class="room-header">
          <button class="minimizer" onclick="toggleRoom('${finalRoomId}', event)">+</button>
          <h4 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h4>
          <div class="room-actions">
            <button class="btn btn-delete" onclick="deleteRoom('${obraName}', '${projectName}', '${finalRoomId}')">Remover</button>
          </div>
        </div>
        <div class="room-content collapsed" id="room-content-${finalRoomId}">
          ${buildClimatizationSection(finalRoomId)}
          ${buildMachinesSection(finalRoomId)}
          ${buildConfigurationSection(finalRoomId)}
        </div>
      </div>
    `;
}

/**
 * Constrói apenas o cabeçalho da sala com título e ações
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML do cabeçalho da sala
 */
function buildRoomHeader(obraName, projectName, roomName, roomId) {
    return `
    <div class="room-header">
      <button class="minimizer" onclick="toggleRoom('${roomId}', event)">+</button>
      <h3 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h3>
      <button class="btn btn-delete-small" onclick="deleteRoom('${obraName}', '${projectName}', '${roomId}')">Remover</button>
    </div>
  `;
}

/**
 * Constrói a seção de ações da sala (atualmente vazia)
 * Reservado para futuras implementações de ações adicionais
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML vazio (string vazia)
 */
function buildRoomActions(roomId) {
    return "";
}

export {
    buildRoomHTML,
    buildRoomHeader,
    buildRoomActions
}