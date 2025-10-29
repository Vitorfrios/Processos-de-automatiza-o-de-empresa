// room-operations.js

import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../../ui/interface.js'
import { buildRoomHTML } from './salas.js' 

// Importar a função de pré-carregamento
let machinesPreloadModule = null;

/**
 * Carrega o módulo de máquinas para pré-carregamento assíncrono
 * @returns {Promise<Object|null>} Módulo de máquinas carregado
 */
async function loadMachinesPreloadModule() {
    if (!machinesPreloadModule) {
        try {
            machinesPreloadModule = await import('./machines/machinesBuilder.js');
            console.log("✅ Módulo de máquinas carregado para pré-carregamento");
        } catch (error) {
            console.error("❌ Erro ao carregar módulo de máquinas:", error);
        }
    }
    return machinesPreloadModule;
}

/**
 * Cria uma nova sala vazia no projeto especificado
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala (opcional)
 * @returns {Promise<boolean>} True se a sala foi criada com sucesso
 */
async function createEmptyRoom(obraName, projectName, roomName, roomId) {
    console.log(`🔄 Criando sala: ${roomName} na obra "${obraName}", projeto "${projectName}"`);
    
    // Buscar o projectElement corretamente
    const projectElement = document.querySelector(`[data-obra-name="${obraName}"][data-project-name="${projectName}"]`);
    
    if (!projectElement) {
        console.error(`❌ Projeto ${projectName} não encontrado na obra ${obraName}`);
        return false;
    }
    
    // Gerar ID ÚNICO SEM "undefined"
    let finalRoomId;
    
    if (roomId && roomId !== 'undefined' && roomId !== 'null' && !roomId.includes('undefined')) {
        
        // Se roomId foi fornecido e é válido, limpar qualquer "undefined"
        finalRoomId = roomId.toString()
            .replace(/-undefined/g, '')
            .replace(/-null/g, '')
            .trim();
    } else {
        // Gerar ID ÚNICO SEM "undefined"
        const obraId = projectElement.closest('.obra-block')?.dataset.obraId || obraName.replace(/\s+/g, '-');
        const projectId = projectElement.dataset.projectId || projectName.replace(/\s+/g, '-');
        const roomNumber = getRoomCountInProject(obraName, projectName) + 1;
        
        // ID único limpo: obra1-projeto1-sala1, obra2-projeto1-sala1, etc.
        finalRoomId = `${obraId}-${projectId}-sala${roomNumber}`.toLowerCase();
        
        // GARANTIR que não tenha "undefined"
        finalRoomId = finalRoomId.replace(/-undefined/g, '').replace(/undefined-/g, '');
    }
    
    console.log(`📝 ID DEFINITIVO LIMPO: "${finalRoomId}"`);
    
    try {
        // PRÉ-CARREGA dados das máquinas ANTES de criar a sala
        const machinesModule = await loadMachinesPreloadModule();
        if (machinesModule && machinesModule.preloadMachinesDataForRoom) {
            await machinesModule.preloadMachinesDataForRoom(finalRoomId);
        }
    } catch (error) {
        console.error("⚠️  Aviso: Não foi possível pré-carregar dados das máquinas:", error);
    }

    // Passar o ID LIMPO para buildRoomHTML
    const roomHTML = buildRoomHTML(obraName, projectName, roomName, finalRoomId);
    
    // Encontrar o projectContent
    const projectContent = projectElement.querySelector('.project-content');
    
    if (!projectContent) {
        console.error(`❌ Conteúdo do projeto não encontrado em ${projectName}`);
        return false;
    }

    removeEmptyProjectMessage(projectContent);
    
    const addRoomSection = projectContent.querySelector('.add-room-section');
    if (addRoomSection) {
        addRoomSection.insertAdjacentHTML('beforebegin', roomHTML);
    } else {
        projectContent.insertAdjacentHTML('beforeend', roomHTML);
    }

    console.log(`✅ Sala ${roomName} criada (ID LIMPO: ${finalRoomId}) na obra "${obraName}", projeto "${projectName}"`);
    
    // Inicializar com ID LIMPO
    initializeRoomComponents(obraName, projectName, roomName, finalRoomId);
    
    return true;
}

/**
 * Conta quantas salas já existem no projeto específico
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @returns {number} Quantidade de salas no projeto
 */
function getRoomCountInProject(obraName, projectName) {
    const projectElement = document.querySelector(`[data-obra-name="${obraName}"][data-project-name="${projectName}"]`);
    if (!projectElement) return 0;
    
    const rooms = projectElement.querySelectorAll('.room-block');
    return rooms.length;
}

/**
 * Inicializa todos os componentes da sala após criação
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function initializeRoomComponents(obraName, projectName, roomName, roomId) {
    console.log(`🔧 Inicializando componentes da sala: ${roomName} (ID: ${roomId})`);
    
    // 1. Inicializar fator de segurança
    setTimeout(() => {
        if (typeof initializeFatorSeguranca === 'function') {
            initializeFatorSeguranca(roomId);
            console.log(`✅ Fator de segurança inicializado para ${roomId}`);
        } else {
            console.log(`⚠️ initializeFatorSeguranca não disponível para ${roomId}`);
        }
    }, 500);
    
    // 2. Sincronizar backup
    setTimeout(() => {
        if (typeof window.syncCapacityTableBackup !== 'undefined') {
            window.syncCapacityTableBackup(roomId);
            console.log(`✅ Backup sincronizado para ${roomId}`);
        } else {
            console.log(`⚠️ syncCapacityTableBackup não disponível para ${roomId}`);
        }
    }, 800);
    
    // 3. ✅ CORREÇÃO: Pré-carregar dados das máquinas para evitar o warning
    setTimeout(async () => {
        try {
            const machinesModule = await import('./machines/machinesBuilder.js');
            if (machinesModule.preloadMachinesDataForRoom) {
                await machinesModule.preloadMachinesDataForRoom(roomId);
                console.log(`✅ Dados das máquinas pré-carregados para ${roomId}`);
            }
        } catch (error) {
            console.log(`⚠️ Não foi possível pré-carregar dados das máquinas para ${roomId}:`, error);
        }
    }, 1000);
}

/**
 * Função de compatibilidade para código existente que usa apenas projectName
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID da sala
 * @returns {Promise<boolean>} True se a sala foi criada com sucesso
 */
async function createEmptyRoomLegacy(projectName, roomName, roomId) {
    // Tenta encontrar a obra do projeto
    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`);
    const obraName = projectBlock?.dataset.obraName;
    
    if (obraName) {
        return createEmptyRoom(obraName, projectName, roomName, roomId);
    } else {
        console.error('❌ Não foi possível determinar a obra do projeto:', projectName);
        return false;
    }
}

/**
 * Insere o HTML de uma sala no conteúdo do projeto
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} roomHTML - HTML da sala a ser inserida
 * @param {string} uniqueRoomId - ID único da sala
 * @returns {void}
 */
function insertRoomIntoProject(obraName, projectName, roomHTML, uniqueRoomId) {
    // Buscar projeto pela hierarquia
    const projectElement = document.querySelector(`[data-obra-name="${obraName}"][data-project-name="${projectName}"]`);
    if (!projectElement) {
        console.error(`❌ Projeto ${projectName} não encontrado na obra ${obraName}`);
        return;
    }

    const projectContent = projectElement.querySelector('.project-content');
    if (!projectContent) {
        console.error(`❌ Conteúdo do projeto ${projectName} não encontrado`);
        return;
    }

    const addRoomSection = projectContent.querySelector(".add-room-section");
    if (addRoomSection) {
        addRoomSection.insertAdjacentHTML("beforebegin", roomHTML);
    } else {
        projectContent.insertAdjacentHTML("beforeend", roomHTML);
    }

    removeEmptyProjectMessage(projectContent);
    console.log(`✅ Sala inserida no projeto ${projectName} (ID único: ${uniqueRoomId})`);
}

/**
 * Adiciona uma nova sala ao projeto com contagem INDEPENDENTE por projeto
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} uniqueProjectId - ID único do projeto (opcional)
 * @returns {Promise<void>}
 */
async function addNewRoom(obraName, projectName, uniqueProjectId = null) {
    console.log(`➕ Adicionando nova sala à obra "${obraName}", projeto "${projectName}"`);
    
    // Buscar projeto pela hierarquia
    const projectElement = document.querySelector(`[data-obra-name="${obraName}"][data-project-name="${projectName}"]`);
    
    if (!projectElement) {
        console.error(`❌ Projeto ${projectName} não encontrado na obra ${obraName}`);
        return;
    }
    
    // Contar APENAS salas DESTE projeto específico
    const roomCount = getRoomCountInProject(obraName, projectName);
    const roomName = `Sala${roomCount + 1}`;

    // Gerar ID DEFINITIVO automaticamente
    await createEmptyRoom(obraName, projectName, roomName, null);
    console.log(`✅ ${roomName} adicionada à obra "${obraName}", projeto "${projectName}"`);
}

/**
 * Função de compatibilidade para código existente que usa apenas projectName
 * @param {string} projectName - Nome do projeto
 * @returns {Promise<void>}
 */
async function addNewRoomLegacy(projectName) {
    // Tenta encontrar a obra do projeto
    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`);
    const obraName = projectBlock?.dataset.obraName;
    
    if (obraName) {
        return addNewRoom(obraName, projectName);
    } else {
        console.error('❌ Não foi possível determinar a obra do projeto:', projectName);
    }
}

/**
 * Corrige inputs de fator de segurança que estejam vazios
 * Aplica valores padrão baseados nas constantes do sistema
 * @returns {void}
 */
function fixExistingCapacityInputs() {
    console.log('🔄 Verificando inputs de capacidade existentes...');
    
    // Encontrar todas as salas
    const roomBlocks = document.querySelectorAll('.room-block');
    
    roomBlocks.forEach(roomBlock => {
        const roomId = roomBlock.dataset.roomId;
        const roomName = roomBlock.dataset.roomName;
        const projectBlock = roomBlock.closest('.project-block');
        const projectName = projectBlock?.dataset.projectName;
        const obraName = projectBlock?.dataset.obraName;
        
        if (roomId) {
            const input = document.getElementById(`fator-seguranca-${roomId}`);
            
            if (input && input.value === '') {
                const valor = window.systemConstants?.FATOR_SEGURANCA_CAPACIDADE || 10;
                input.value = valor;
                console.log(`✅ Input ${roomId} corrigido: ${valor}% (Obra: ${obraName}, Projeto: ${projectName})`);
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
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} uniqueRoomId - ID único da sala a ser removida
 * @returns {void}
 */
function deleteRoom(obraName, projectName, uniqueRoomId) {


    // Encontrar sala pelo ID único E hierarquia
    const roomBlock = document.querySelector(`[data-obra-name="${obraName}"][data-project-name="${projectName}"][data-room-id="${uniqueRoomId}"]`);
    
    if (!roomBlock) {
        console.error(`❌ Sala com ID ${uniqueRoomId} não encontrada no projeto ${projectName}, obra ${obraName}`);
        
        // Debug: listar salas disponíveis
        console.log('🔍 Salas disponíveis:');
        document.querySelectorAll('.room-block').forEach(room => {
            console.log(`  - Sala: ${room.dataset.roomName}, ID: ${room.dataset.roomId}, Projeto: ${room.dataset.projectName}, Obra: ${room.dataset.obraName}`);
        });
        return;
    }

    const roomName = roomBlock.dataset.roomName;
    const projectContent = roomBlock.closest(".project-content");

    roomBlock.remove();
    
    if (projectContent) {
        showEmptyProjectMessageIfNeeded(projectContent);
    }

    console.log(`🗑️  Sala ${roomName} (ID único: ${uniqueRoomId}) removida da obra "${obraName}", projeto "${projectName}"`);
}

/**
 * Função de compatibilidade para código existente que usa apenas projectName e roomName
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @returns {void}
 */
function deleteRoomLegacy(projectName, roomName) {
    // Tenta encontrar a obra do projeto
    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`);
    const obraName = projectBlock?.dataset.obraName;
    
    if (obraName) {
        // Encontrar sala pela hierarquia completa
        const roomBlock = document.querySelector(`[data-obra-name="${obraName}"][data-project-name="${projectName}"][data-room-name="${roomName}"]`);
        const roomId = roomBlock?.dataset.roomId;
        
        if (roomId) {
            return deleteRoom(obraName, projectName, roomId);
        } else {
            console.error(`❌ ID da sala ${roomName} não encontrado`);
        }
    } else {
        console.error('❌ Não foi possível determinar a obra do projeto:', projectName);
    }
}

// Exportações simplificadas
export {
    createEmptyRoom,
    createEmptyRoomLegacy,
    insertRoomIntoProject,
    addNewRoom,
    addNewRoomLegacy,
    deleteRoom,
    deleteRoomLegacy
}

// Disponibilização global correta
if (typeof window !== 'undefined') {
    window.addNewRoom = addNewRoom;
    window.deleteRoom = deleteRoom;
    window.createEmptyRoom = createEmptyRoom;
}