import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../../ui/interface.js'
import { buildRoomHTML } from './salas.js' 

// Importar a função de pré-carregamento
let machinesPreloadModule = null;

/**
 * Carrega o módulo de máquinas para pré-carregamento
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
 * Cria uma nova sala vazia no projeto especificado - CORREÇÃO DEFINITIVA
 */
async function createEmptyRoom(obraName, projectName, roomName, roomId) {
    console.log(`🔄 Criando sala: ${roomName} na obra "${obraName}", projeto "${projectName}"`);
    
    // ✅ CORREÇÃO: Buscar o projectElement corretamente
    const projectElement = document.querySelector(`[data-obra-name="${obraName}"][data-project-name="${projectName}"]`);
    
    if (!projectElement) {
        console.error(`❌ Projeto ${projectName} não encontrado na obra ${obraName}`);
        return false;
    }
    
    // ✅ CORREÇÃO DEFINITIVA: Gerar ID ÚNICO SEM "undefined"
    let finalRoomId;
    
    if (roomId && roomId !== 'undefined' && roomId !== 'null' && !roomId.includes('undefined')) {
        // Se roomId foi fornecido e é válido, limpar qualquer "undefined"
        finalRoomId = roomId.toString()
            .replace(/-undefined/g, '')
            .replace(/-null/g, '')
            .trim();
    } else {
        // ✅ CORREÇÃO CRÍTICA: Gerar ID ÚNICO SEM "undefined"
        const obraId = projectElement.closest('.obra-block')?.dataset.obraId || obraName.replace(/\s+/g, '-');
        const projectId = projectElement.dataset.projectId || projectName.replace(/\s+/g, '-');
        const roomNumber = getRoomCountInProject(obraName, projectName) + 1;
        
        // ID único limpo: obra1-projeto1-sala1, obra2-projeto1-sala1, etc.
        finalRoomId = `${obraId}-${projectId}-sala${roomNumber}`.toLowerCase();
        
        // ✅ GARANTIR que não tenha "undefined"
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

    // ✅ CORREÇÃO: Passar o ID LIMPO para buildRoomHTML
    const roomHTML = buildRoomHTML(obraName, projectName, roomName, finalRoomId);
    
    // ✅ CORREÇÃO: Encontrar o projectContent
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
    
    // ✅ CORREÇÃO: Inicializar com ID LIMPO
    initializeRoomComponents(obraName, projectName, roomName, finalRoomId);
    
    return true;
}

/**
 * Conta quantas salas já existem no projeto específico
 */
function getRoomCountInProject(obraName, projectName) {
    const projectElement = document.querySelector(`[data-obra-name="${obraName}"][data-project-name="${projectName}"]`);
    if (!projectElement) return 0;
    
    const rooms = projectElement.querySelectorAll('.room-block');
    return rooms.length;
}

/**
 * Inicializa todos os componentes da sala após criação - CORRIGIDO
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
    
    // 3. Inicializar componentes das máquinas
    setTimeout(() => {
        if (typeof initializeMachineComponentsForRoom === 'function') {
            initializeMachineComponentsForRoom(roomId);
        } else {
            console.log(`⚠️ initializeMachineComponentsForRoom não disponível para ${roomId}`);
        }
    }, 1200);
    
    // 4. Verificar dados das máquinas
    setTimeout(() => {
        if (window.machinesData && window.machinesData.length > 0) {
            console.log(`✅ Dados das máquinas disponíveis para ${roomId}: ${window.machinesData.length} máquinas`);
        } else {
            console.log(`⚠️ Dados das máquinas não disponíveis para ${roomId}`);
        }
    }, 1500);
}



// Função de compatibilidade para código existente
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
 */
function insertRoomIntoProject(obraName, projectName, roomHTML, uniqueRoomId) {
    // ✅ CORREÇÃO: Buscar projeto pela hierarquia
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
 * Adiciona uma nova sala ao projeto com contagem INDEPENDENTE por projeto - CORRIGIDO
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} uniqueProjectId - ID único do projeto (opcional)
 */
async function addNewRoom(obraName, projectName, uniqueProjectId = null) {
    console.log(`➕ Adicionando nova sala à obra "${obraName}", projeto "${projectName}"`);
    
    // ✅ CORREÇÃO: Buscar projeto pela hierarquia
    const projectElement = document.querySelector(`[data-obra-name="${obraName}"][data-project-name="${projectName}"]`);
    
    if (!projectElement) {
        console.error(`❌ Projeto ${projectName} não encontrado na obra ${obraName}`);
        return;
    }
    
    // ✅ CORREÇÃO: Contar APENAS salas DESTE projeto específico
    const roomCount = getRoomCountInProject(obraName, projectName);
    const roomName = `Sala${roomCount + 1}`;

    // ✅ CORREÇÃO: Gerar ID DEFINITIVO automaticamente
    await createEmptyRoom(obraName, projectName, roomName, null);
    console.log(`✅ ${roomName} adicionada à obra "${obraName}", projeto "${projectName}"`);
}

// Função de compatibilidade para código existente
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
 * Remove uma sala do projeto após confirmação do usuário - CORREÇÃO DEFINITIVA com ID único
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} uniqueRoomId - ID único da sala a ser removida
 */
function deleteRoom(obraName, projectName, uniqueRoomId) {
    const confirmMessage = "Tem certeza que deseja deletar esta sala? Os dados permanecerão no servidor.";

    if (!confirm(confirmMessage)) return;

    // ✅ CORREÇÃO: Encontrar sala pelo ID único E hierarquia
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

// Função de compatibilidade para código existente
function deleteRoomLegacy(projectName, roomName) {
    // Tenta encontrar a obra do projeto
    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`);
    const obraName = projectBlock?.dataset.obraName;
    
    if (obraName) {
        // ✅ CORREÇÃO: Encontrar sala pela hierarquia completa
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

// ✅ CORREÇÃO: Exportações simplificadas
export {
    createEmptyRoom,
    createEmptyRoomLegacy,
    insertRoomIntoProject,
    addNewRoom,
    addNewRoomLegacy,
    deleteRoom,
    deleteRoomLegacy
}

// ✅ CORREÇÃO: Disponibilização global correta
if (typeof window !== 'undefined') {
    window.addNewRoom = addNewRoom;
    window.deleteRoom = deleteRoom;
    window.createEmptyRoom = createEmptyRoom;
}