/**
 * data/modules/rooms.js
 * ARQUIVO DE BUILDER DE SALA - VERSÃO CORRIGIDA
 */

import { buildClimatizationSection } from './climatizacao.js';
import { buildMachinesSection } from './machines/machines-core.js';
import { buildEquipamentosSection } from './equipamentos.js';
import { buildTubosSection } from './tubos.js';
import { buildDutosSection } from './dutos.js';
import { generateRoomId } from '../utils/id-generator.js';
import { removeEmptyProjectMessage } from '../../ui/helpers.js';
import { triggerCalculation, syncTitleToAmbienteDirect } from '../../core/shared-utils.js';

// Cache para módulo de máquinas
let machinesPreloadModule = null;

/**
 * 🏗️ FUNÇÕES DE CONSTRUÇÃO DE HTML
 */

/**
 * Constrói o HTML completo de uma sala com todas as seções na ORDEM CORRETA
 */
function buildRoomHTML(obraId, projectId, roomName, roomId) {
    if (!obraId || !projectId || !roomId) {
        console.error(`ERRO (buildRoomHTML) Parâmetros inválidos`);
        return '';
    }

    console.log(`[BUILD ROOM] Construindo sala: ${roomName} (ID: ${roomId})`);

    return `
      <div class="room-block" data-room-id="${roomId}" data-room-name="${roomName}" data-project-id="${projectId}" data-obra-id="${obraId}">
        <div class="room-header">
          <button class="minimizer" onclick="toggleRoom('${roomId}', event)">+</button>
          <h4 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h4>
          <div class="room-actions">
            <button class="btn btn-delete" onclick="deleteRoom('${obraId}', '${projectId}', '${roomId}')">Remover</button>
          </div>
        </div>
        <div class="room-content collapsed" id="room-content-${roomId}">
          <!-- ORDEM FIXA E CORRETA DAS SEÇÕES -->
          ${buildClimatizationSection(obraId, projectId, roomName, roomId)}
          ${buildMachinesSection(obraId, projectId, roomName, roomId)}
          ${buildEquipamentosSection(obraId, projectId, roomName, roomId)}
          ${buildDutosSection(obraId, projectId, roomName, roomId)}
          ${buildTubosSection(obraId, projectId, roomName, roomId)}
        </div>
      </div>
    `;
}

/**
 * Constrói apenas o cabeçalho da sala
 */
function buildRoomHeader(obraId, projectId, roomName, roomId) {
    if (!roomId) {
        console.error(`ERRO (buildRoomHeader) Room ID inválido`);
        return '';
    }

    return `
    <div class="room-header">
      <button class="minimizer" onclick="toggleRoom('${roomId}', event)">+</button>
      <h3 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h3>
      <button class="btn btn-delete-small" onclick="deleteRoom('${obraId}', '${projectId}', '${roomId}')">Remover</button>
    </div>
  `;
}

/**
 * Constrói a seção de ações da sala
 */
function buildRoomActions(roomId) {
    return "";
}

/**
 * 🔧 FUNÇÕES DE OPERAÇÕES
 */

/**
 * Carrega o módulo de máquinas
 */
async function loadMachinesPreloadModule() {
    if (!machinesPreloadModule) {
        try {
            machinesPreloadModule = await import('./machines/machines-core.js');
            console.log("✅ Módulo de máquinas carregado");
        } catch (error) {
            console.error("❌ Erro ao carregar módulo de máquinas:", error);
        }
    }
    return machinesPreloadModule;
}

/**
 * Cria uma nova sala vazia - VERSÃO CORRIGIDA
 */
async function createEmptyRoom(obraId, projectId, roomName, roomId) {
    console.log(`🔄 Criando sala: ${roomName}`);

    if (!obraId || !projectId) {
        console.error(`ERRO (createEmptyRoom) IDs inválidos`);
        return false;
    }

    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);

    if (!projectElement) {
        console.error(`❌ Projeto não encontrado`);
        return false;
    }

    let finalRoomId;

    if (roomId) {
        finalRoomId = roomId;
    } else {
        const roomCount = getRoomCountInProject(obraId, projectId);
        finalRoomId = generateRoomId(projectElement, roomCount + 1);
    }

    // Limpar ID
    finalRoomId = finalRoomId.toString()
        .replace(/-undefined/g, '')
        .replace(/-null/g, '')
        .trim();

    console.log(`📝 ID da sala: "${finalRoomId}"`);

    try {
        const machinesModule = await loadMachinesPreloadModule();
        if (machinesModule && machinesModule.preloadMachinesDataForRoom) {
            await machinesModule.preloadMachinesDataForRoom(finalRoomId);
        }
    } catch (error) {
        console.log("ℹ️ Não foi possível pré-carregar dados das máquinas");
    }

    const roomHTML = buildRoomHTML(obraId, projectId, roomName, finalRoomId);

    const projectContent = projectElement.querySelector('.project-content');
    if (!projectContent) {
        console.error(`❌ Conteúdo do projeto não encontrado`);
        return false;
    }

    removeEmptyProjectMessage(projectContent);

    const addRoomSection = projectContent.querySelector('.add-room-section');
    if (addRoomSection) {
        addRoomSection.insertAdjacentHTML('beforebegin', roomHTML);
    } else {
        projectContent.insertAdjacentHTML('beforeend', roomHTML);
    }

    console.log(`✅ Sala ${roomName} criada`);

    // Inicializar componentes com timing correto
    setTimeout(() => {
        initializeRoomComponents(obraId, projectId, roomName, finalRoomId);
    }, 300);

    return true;
}

/**
 * Conta salas no projeto
 */
function getRoomCountInProject(obraId, projectId) {
    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);
    if (!projectElement) return 0;

    const rooms = projectElement.querySelectorAll('.room-block');
    return rooms.length;
}

/**
 * Inicializa componentes da sala - VERSÃO SIMPLIFICADA
 */
function initializeRoomComponents(obraId, projectId, roomName, roomId) {
    console.log(`🔧 Inicializando sala: ${roomName}`);

    // Configurar sincronizações básicas
    setTimeout(() => {
        setupBidirectionalTitleAmbienteSync(roomId, roomName);
        setupFirstInteractionWallSync(roomId);
    }, 500);

    // Inicializar outros sistemas
    setTimeout(async () => {
        try {
            const machinesModule = await import('./machines/machines-core.js');
            if (machinesModule.preloadMachinesDataForRoom) {
                await machinesModule.preloadMachinesDataForRoom(roomId);
            }
        } catch (error) {
            // Silencioso
        }
    }, 800);

    setTimeout(() => {
        safeInitializeFatorSeguranca(roomId);
    }, 1000);
}

/**
 * Sincronização título ↔ ambiente
 */
function setupBidirectionalTitleAmbienteSync(roomId, roomName) {
    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomBlock) return;

    const roomTitle = roomBlock.querySelector('.room-title');
    const ambienteInput = roomBlock.querySelector('input[data-field="ambiente"]');

    if (roomTitle && ambienteInput) {
        // Sincronização inicial
        if (!ambienteInput.value || ambienteInput.value.trim() === '') {
            ambienteInput.value = roomTitle.textContent || roomName;
        }

        // Ambiente → Título
        ambienteInput.addEventListener('input', function () {
            if (this.value && this.value.trim() !== '' && this.value !== roomTitle.textContent) {
                roomTitle.textContent = this.value;
                roomBlock.dataset.roomName = this.value;
                triggerCalculation(roomId);
            }
        });

        // Observer para edição do título
        setupTitleChangeObserver(roomTitle, roomId);
    }
}

/**
 * Observer para mudanças no título
 */
function setupTitleChangeObserver(roomTitle, roomId) {
    let isEditing = false;

    roomTitle.addEventListener('click', function () {
        isEditing = true;
    });

    const observer = new MutationObserver((mutations) => {
        if (!isEditing) return;

        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData' || mutation.type === 'childList') {
                const newTitle = roomTitle.textContent.trim();
                if (newTitle && newTitle !== mutation.oldValue) {
                    syncTitleToAmbienteDirect(roomId, newTitle);
                }
            }
        });
    });

    roomTitle.addEventListener('blur', function () {
        isEditing = false;
        const newTitle = roomTitle.textContent.trim();
        if (newTitle) {
            syncTitleToAmbienteDirect(roomId, newTitle);
        }
    });

    observer.observe(roomTitle, {
        characterData: true,
        childList: true,
        subtree: true,
        characterDataOldValue: true
    });
}

/**
 * Sincronização de paredes - primeira interação
 */
function setupFirstInteractionWallSync(roomId) {
    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomBlock) return;

    const paredeOeste = roomBlock.querySelector('input[data-field="paredeOeste"]');
    const paredeLeste = roomBlock.querySelector('input[data-field="paredeLeste"]');
    const paredeNorte = roomBlock.querySelector('input[data-field="paredeNorte"]');
    const paredeSul = roomBlock.querySelector('input[data-field="paredeSul"]');

    if (paredeOeste && paredeLeste) {
        setupFirstInteractionWallPair(paredeOeste, paredeLeste, roomId, 'Oeste', 'Leste');
    }

    if (paredeNorte && paredeSul) {
        setupFirstInteractionWallPair(paredeNorte, paredeSul, roomId, 'Norte', 'Sul');
    }
}

/**
 * Configura par de paredes
 */
function setupFirstInteractionWallPair(input1, input2, roomId, name1, name2) {
    let isFirstInteraction1 = true;
    let isFirstInteraction2 = true;
    let isEditing1 = false;
    let isEditing2 = false;
    
    const placeholderValues = ['Ex: 5.5', 'Ex: 8.0', ''];

    function syncDuringFirstEdit(editingInput, otherInput, value) {
        if (!value || placeholderValues.includes(value)) return;
        
        if (editingInput === input1 && isFirstInteraction1 && isEditing1) {
            otherInput.value = value;
            triggerCalculation(roomId);
        } else if (editingInput === input2 && isFirstInteraction2 && isEditing2) {
            otherInput.value = value;
            triggerCalculation(roomId);
        }
    }

    // Input 1
    input1.addEventListener('focus', function() {
        if (isFirstInteraction1) isEditing1 = true;
    });

    input1.addEventListener('input', function() {
        if (isEditing1) syncDuringFirstEdit(input1, input2, this.value);
    });

    input1.addEventListener('blur', function() {
        if (isFirstInteraction1) {
            isFirstInteraction1 = false;
            isEditing1 = false;
        }
    });

    // Input 2
    input2.addEventListener('focus', function() {
        if (isFirstInteraction2) isEditing2 = true;
    });

    input2.addEventListener('input', function() {
        if (isEditing2) syncDuringFirstEdit(input2, input1, this.value);
    });

    input2.addEventListener('blur', function() {
        if (isFirstInteraction2) {
            isFirstInteraction2 = false;
            isEditing2 = false;
        }
    });

    // Sincronização inicial
    if (input1.value && !placeholderValues.includes(input1.value)) {
        if (!input2.value || placeholderValues.includes(input2.value)) {
            input2.value = input1.value;
        }
    } else if (input2.value && !placeholderValues.includes(input2.value)) {
        if (!input1.value || placeholderValues.includes(input1.value)) {
            input1.value = input2.value;
        }
    }
}

/**
 * Inicializa sistema de equipamentos
 */
async function initializeEquipamentosSystem(roomId) {
    console.log(`🔧 Inicializando equipamentos para sala: ${roomId}`);

    try {
        if (typeof window.initEquipamentosSystem === 'function') {
            await window.initEquipamentosSystem(roomId);
        } else {
            const equipamentosModule = await import('./equipamentos.js');
            if (equipamentosModule && equipamentosModule.initEquipamentosSystem) {
                equipamentosModule.initEquipamentosSystem(roomId);
            }
        }
    } catch (error) {
        console.error(`❌ Erro ao inicializar equipamentos:`, error);
    }
}

/**
 * Inicializa fator de segurança
 */
function safeInitializeFatorSeguranca(roomId) {
    if (typeof window.initializeFatorSeguranca === 'function') {
        try {
            window.initializeFatorSeguranca(roomId);
        } catch (error) {
            // Silencioso
        }
    }
}

/**
 * Insere sala no projeto
 */
function insertRoomIntoProject(obraId, projectId, roomHTML, roomId) {
    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);
    if (!projectElement) {
        console.error(`❌ Projeto não encontrado`);
        return;
    }

    const projectContent = projectElement.querySelector('.project-content');
    if (!projectContent) {
        console.error(`❌ Conteúdo do projeto não encontrado`);
        return;
    }

    const addRoomSection = projectContent.querySelector(".add-room-section");
    if (addRoomSection) {
        addRoomSection.insertAdjacentHTML("beforebegin", roomHTML);
    } else {
        projectContent.insertAdjacentHTML("beforeend", roomHTML);
    }

    removeEmptyProjectMessage(projectContent);
    console.log(`✅ Sala inserida no projeto`);
}

/**
 * Adiciona nova sala
 */
async function addNewRoom(obraId, projectId) {
    console.log(`➕ Adicionando nova sala`);

    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);

    if (!projectElement) {
        console.error(`❌ Projeto não encontrado`);
        return;
    }

    const roomCount = getRoomCountInProject(obraId, projectId);
    const roomName = `Sala${roomCount + 1}`;

    await createEmptyRoom(obraId, projectId, roomName, null);
    console.log(`✅ ${roomName} adicionada`);
}

/**
 * Adiciona nova sala (alias)
 */
async function addNewRoomToProject(obraId, projectId) {
    return addNewRoom(obraId, projectId);
}

/**
 * Função legada
 */
async function addNewRoomLegacy(projectName) {
    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`);
    const obraId = projectBlock?.dataset.obraId;
    const projectId = projectBlock?.dataset.projectId;

    if (obraId && projectId) {
        return addNewRoomToProject(obraId, projectId);
    } else {
        console.error('❌ Não foi possível determinar a obra do projeto:', projectName);
    }
}

/**
 * Remove sala
 */
function deleteRoom(obraId, projectId, roomId) {
    const roomBlock = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"][data-room-id="${roomId}"]`);

    if (!roomBlock) {
        console.error(`❌ Sala não encontrada`);
        return;
    }

    const roomName = roomBlock.dataset.roomName;
    const projectContent = roomBlock.closest(".project-content");

    roomBlock.remove();

    if (projectContent && typeof window.showEmptyProjectMessageIfNeeded === 'function') {
        window.showEmptyProjectMessageIfNeeded(projectContent);
    }

    console.log(`🗑️ Sala ${roomName} removida`);
}

/**
 * Remove sala (legada)
 */
function deleteRoomLegacy(projectName, roomName) {
    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`);
    const obraId = projectBlock?.dataset.obraId;
    const projectId = projectBlock?.dataset.projectId;

    if (obraId && projectId) {
        const roomBlock = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"][data-room-name="${roomName}"]`);
        const roomId = roomBlock?.dataset.roomId;

        if (roomId) {
            return deleteRoom(obraId, projectId, roomId);
        } else {
            console.error(`❌ ID da sala ${roomName} não encontrado`);
        }
    } else {
        console.error('❌ Não foi possível determinar a obra do projeto:', projectName);
    }
}

/**
 * Corrige inputs de fator de segurança
 */
function fixExistingCapacityInputs() {
    console.log('🔄 Verificando inputs de capacidade...');

    const roomBlocks = document.querySelectorAll('.room-block');

    roomBlocks.forEach(roomBlock => {
        const roomId = roomBlock.dataset.roomId;

        if (roomId) {
            const input = document.getElementById(`fator-seguranca-${roomId}`);

            if (input && input.value === '') {
                const valor = window.systemConstants?.FATOR_SEGURANCA_CAPACIDADE.value || 10;
                input.value = valor;
            }
        }
    });
}

// Executar quando o projeto for carregado
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(fixExistingCapacityInputs, 2000);
});

/**
 * 🌐 EXPORTAÇÕES
 */

// Exportações ES6
export {
    buildRoomHTML,
    buildRoomHeader,
    buildRoomActions,
    createEmptyRoom,
    insertRoomIntoProject,
    addNewRoom,
    deleteRoom,
    deleteRoomLegacy,
    safeInitializeFatorSeguranca,
    addNewRoomToProject,
    getRoomCountInProject,
    initializeRoomComponents,
    fixExistingCapacityInputs,
    loadMachinesPreloadModule,
};

// Compatibilidade global
if (typeof window !== 'undefined') {
    window.addNewRoom = addNewRoom;
    window.deleteRoom = deleteRoom;
    window.addNewRoomToProject = addNewRoomToProject;
    window.createEmptyRoom = createEmptyRoom;
    window.safeInitializeFatorSeguranca = safeInitializeFatorSeguranca;
    window.buildRoomHTML = buildRoomHTML;
}