/**
 * salas.js
 * Construtor de salas - SISTEMA CORRIGIDO COM IDs ÚNICOS
 */

import { buildClimatizationSection } from './climatizacao.js'
import { buildMachinesSection } from './maquinas.js'
import { buildConfigurationSection } from './configuracao.js'

/**
 * Constrói o HTML completo de uma sala com todas as seções - CORREÇÃO COMPLETA
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML completo da sala
 */
function buildRoomHTML(obraId, projectId, roomName, roomId) {
    // ✅ CORREÇÃO: Validar todos os IDs
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (buildRoomHTML) salas.js [Obra ID inválido: ${obraId}]`);
        return '';
    }
    
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
        console.error(`ERRO FALBACK (buildRoomHTML) salas.js [Project ID inválido: ${projectId}]`);
        return '';
    }
    
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`ERRO FALBACK (buildRoomHTML) salas.js [Room ID inválido: ${roomId}]`);
        return '';
    }
    
    console.log(`[BUILD ROOM] Parâmetros:`, { obraId, projectId, roomName, roomId });
    
    console.log(`[BUILD ROOM] ID ÚNICO: ${roomId}`);
    
    return `
      <div class="room-block" data-room-id="${roomId}" data-room-name="${roomName}" data-project-id="${projectId}" data-obra-id="${obraId}">
        <div class="room-header">
          <!-- ✅ CORREÇÃO: usar APENAS roomId para toggle -->
          <button class="minimizer" onclick="toggleRoom('${roomId}', event)">+</button>
          <h4 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h4>
          <div class="room-actions">
            <!-- ✅ CORREÇÃO: Usar IDs únicos na função delete -->
            <button class="btn btn-delete" onclick="deleteRoom('${obraId}', '${projectId}', '${roomId}')">Remover</button>
          </div>
        </div>
        <!-- ✅ CORREÇÃO: usar APENAS roomId no conteúdo -->
        <div class="room-content collapsed" id="room-content-${roomId}">
          ${buildClimatizationSection(obraId, projectId, roomName, roomId)}
          ${buildMachinesSection(obraId, projectId, roomName, roomId)}
          ${buildConfigurationSection(obraId, projectId, roomName, roomId)}
        </div>
      </div>
    `;
}

/**
 * Constrói apenas o cabeçalho da sala com título e ações
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML do cabeçalho da sala
 */
function buildRoomHeader(obraId, projectId, roomName, roomId) {
    // ✅ CORREÇÃO: Validar IDs
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`ERRO FALBACK (buildRoomHeader) salas.js [Room ID inválido: ${roomId}]`);
        return '';
    }
    
    return `
    <div class="room-header">
      <!-- ✅ CORREÇÃO: usar APENAS roomId para toggle -->
      <button class="minimizer" onclick="toggleRoom('${roomId}', event)">+</button>
      <h3 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h3>
      <!-- ✅ CORREÇÃO: usar IDs únicos na função delete -->
      <button class="btn btn-delete-small" onclick="deleteRoom('${obraId}', '${projectId}', '${roomId}')">Remover</button>
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