/**
 * room-operations.js
 * Operações com salas - SISTEMA CORRIGIDO COM IDs ÚNICOS
 */

// REMOVIDO NA REFACTOR: import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../../ui/interface.js'
import { buildRoomHTML } from './salas.js' 
import { generateRoomId } from '../data-files/data-utils-core.js'
import { removeEmptyProjectMessage } from '../../ui/intr-files/ui-helpers.js'

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
 * Cria uma nova sala vazia no projeto especificado - CORREÇÃO COMPLETA
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto  
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala (opcional)
 * @returns {Promise<boolean>} True se a sala foi criada com sucesso
 */
async function createEmptyRoom(obraId, projectId, roomName, roomId) {
    console.log(`🔄 Criando sala: ${roomName} na obra "${obraId}", projeto "${projectId}"`);
    
    // ✅ CORREÇÃO: Validar IDs únicos
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (createEmptyRoom) room-operations.js [Obra ID inválido: ${obraId}]`);
        return false;
    }
    
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
        console.error(`ERRO FALBACK (createEmptyRoom) room-operations.js [Project ID inválido: ${projectId}]`);
        return false;
    }
    
    // ✅ CORREÇÃO: Buscar por IDs únicos
    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);
    
    if (!projectElement) {
        console.error(`❌ Projeto ${projectId} não encontrado na obra ${obraId}`);
        
        // Debug detalhado: listar projetos disponíveis com seus dados
        console.log('🔍 Projetos disponíveis no DOM:');
        document.querySelectorAll('.project-block').forEach(proj => {
            console.log(`  - Projeto: ${proj.dataset.projectName}, 
                         ProjectID: ${proj.dataset.projectId}, 
                         ObraID: ${proj.dataset.obraId}, 
                         ObraName: ${proj.dataset.obraName}`);
        });
        return false;
    }
    
    console.log(`✅ Projeto encontrado:`, projectElement.dataset);

    // ✅ CORREÇÃO: Gerar ID SEGURO hierárquico único para sala
    let finalRoomId;
    
    if (roomId && roomId !== 'undefined' && roomId !== 'null' && !roomId.includes('undefined')) {
        finalRoomId = roomId;
    } else {
        const roomCount = getRoomCountInProject(obraId, projectId);
        finalRoomId = generateRoomId(projectElement, roomCount + 1);
    }
    
    // ✅ CORREÇÃO: Limpar ID de possíveis problemas
    finalRoomId = finalRoomId.toString()
        .replace(/-undefined/g, '')
        .replace(/-null/g, '')
        .trim();
    
    console.log(`📝 ID SEGURO DEFINITIVO DA SALA: "${finalRoomId}"`);
    
    try {
        const machinesModule = await loadMachinesPreloadModule();
        if (machinesModule && machinesModule.preloadMachinesDataForRoom) {
            await machinesModule.preloadMachinesDataForRoom(finalRoomId);
        }
    } catch (error) {
        console.error("⚠️ Aviso: Não foi possível pré-carregar dados das máquinas:", error);
    }

    // ✅ CORREÇÃO: Passar IDs únicos corretamente
    const roomHTML = buildRoomHTML(obraId, projectId, roomName, finalRoomId);
    
    const projectContent = projectElement.querySelector('.project-content');
    
    if (!projectContent) {
        console.error(`❌ Conteúdo do projeto não encontrado em ${projectId}`);
        return false;
    }

    removeEmptyProjectMessage(projectContent);
    
    const addRoomSection = projectContent.querySelector('.add-room-section');
    if (addRoomSection) {
        addRoomSection.insertAdjacentHTML('beforebegin', roomHTML);
    } else {
        projectContent.insertAdjacentHTML('beforeend', roomHTML);
    }

    console.log(`✅ Sala ${roomName} criada (ID: ${finalRoomId}) na obra "${obraId}", projeto "${projectId}"`);
    
    initializeRoomComponents(obraId, projectId, roomName, finalRoomId);
    
    return true;
}

/**
 * Conta quantas salas já existem no projeto específico - CORREÇÃO COMPLETA
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @returns {number} Quantidade de salas no projeto
 */
function getRoomCountInProject(obraId, projectId) {
    // ✅ CORREÇÃO: Buscar por IDs únicos
    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);
    if (!projectElement) return 0;
    
    const rooms = projectElement.querySelectorAll('.room-block');
    return rooms.length;
}

/**
 * Inicializa todos os componentes da sala após criação
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function initializeRoomComponents(obraId, projectId, roomName, roomId) {
    console.log(`🔧 Inicializando componentes da sala: ${roomName} (ID: ${roomId})`);
    
    // ✅ CORREÇÃO: Verificar se as funções existem antes de chamar
    const initializeWithRetry = (functionName, delay, maxAttempts = 5) => {
        let attempts = 0;
        
        const tryInitialize = () => {
            if (typeof window[functionName] === 'function') {
                window[functionName](roomId);
                console.log(`✅ ${functionName} inicializado para ${roomId}`);
            } else if (attempts < maxAttempts) {
                attempts++;
                console.log(`⏳ Tentativa ${attempts}/${maxAttempts} - ${functionName} não disponível, tentando novamente...`);
                setTimeout(tryInitialize, delay);
            } else {
                console.log(`ℹ️ ${functionName} não disponível após ${maxAttempts} tentativas - pode ser normal`);
            }
        };
        
        setTimeout(tryInitialize, delay);
    };
    
    // 1. Inicializar fator de segurança com retry
    initializeWithRetry('initializeFatorSeguranca', 300, 5);
    
    // 2. Sincronizar backup com retry
    initializeWithRetry('syncCapacityTableBackup', 500, 3);
    
    // 3. ✅ CORREÇÃO: Pré-carregar dados das máquinas
    setTimeout(async () => {
        try {
            const machinesModule = await import('./machines/machinesBuilder.js');
            if (machinesModule.preloadMachinesDataForRoom) {
                await machinesModule.preloadMachinesDataForRoom(roomId);
                console.log(`✅ Dados das máquinas pré-carregados para ${roomId}`);
            }
        } catch (error) {
            console.log(`ℹ️ Não foi possível pré-carregar dados das máquinas para ${roomId} - pode ser normal`);
        }
    }, 800);
}

/**
 * Função auxiliar para inicializar fator de segurança de forma segura
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function safeInitializeFatorSeguranca(roomId) {
    if (typeof window.initializeFatorSeguranca === 'function') {
        try {
            window.initializeFatorSeguranca(roomId);
            console.log(`✅ Fator de segurança inicializado para ${roomId}`);
        } catch (error) {
            console.log(`ℹ️ Erro ao inicializar fator de segurança para ${roomId}:`, error.message);
        }
    } else {
        console.log(`ℹ️ initializeFatorSeguranca não disponível - aguardando carregamento`);
    }
}

/**
 * Insere o HTML de uma sala no conteúdo do projeto
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomHTML - HTML da sala a ser inserida
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function insertRoomIntoProject(obraId, projectId, roomHTML, roomId) {
    // ✅ CORREÇÃO: Buscar projeto por IDs únicos
    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);
    if (!projectElement) {
        console.error(`❌ Projeto ${projectId} não encontrado na obra ${obraId}`);
        return;
    }

    const projectContent = projectElement.querySelector('.project-content');
    if (!projectContent) {
        console.error(`❌ Conteúdo do projeto ${projectId} não encontrado`);
        return;
    }

    const addRoomSection = projectContent.querySelector(".add-room-section");
    if (addRoomSection) {
        addRoomSection.insertAdjacentHTML("beforebegin", roomHTML);
    } else {
        projectContent.insertAdjacentHTML("beforeend", roomHTML);
    }

    removeEmptyProjectMessage(projectContent);
    console.log(`✅ Sala inserida no projeto ${projectId} (ID único: ${roomId})`);
}

/**
 * Adiciona uma nova sala ao projeto - CORREÇÃO COMPLETA
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @returns {Promise<void>}
 */
async function addNewRoom(obraId, projectId) {
    console.log(`➕ Adicionando nova sala à obra "${obraId}", projeto "${projectId}"`);
    
    // ✅ CORREÇÃO: Buscar por IDs únicos
    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);
    
    if (!projectElement) {
        console.error(`❌ Projeto ${projectId} não encontrado na obra ${obraId}`);
        return;
    }
    
    // Contar APENAS salas DESTE projeto específico
    const roomCount = getRoomCountInProject(obraId, projectId);
    const roomName = `Sala${roomCount + 1}`;

    // Gerar ID DEFINITIVO automaticamente
    await createEmptyRoom(obraId, projectId, roomName, null);
    console.log(`✅ ${roomName} adicionada à obra "${obraId}", projeto "${projectId}"`);
}


/**
 * Remove uma sala do projeto após confirmação do usuário - CORREÇÃO COMPLETA
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomId - ID único da sala a ser removida
 * @returns {void}
 */
function deleteRoom(obraId, projectId, roomId) {
    // ✅ CORREÇÃO: Buscar por IDs únicos
    const roomBlock = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"][data-room-id="${roomId}"]`);
    
    if (!roomBlock) {
        console.error(`❌ Sala com ID ${roomId} não encontrada no projeto ${projectId}, obra ${obraId}`);
        return;
    }

    const roomName = roomBlock.dataset.roomName;
    const projectContent = roomBlock.closest(".project-content");

    roomBlock.remove();
    
    if (projectContent && typeof window.showEmptyProjectMessageIfNeeded === 'function') {
        window.showEmptyProjectMessageIfNeeded(projectContent);
    }

    console.log(`🗑️ Sala ${roomName} (ID: ${roomId}) removida da obra "${obraId}", projeto "${projectId}"`);
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
    const obraId = projectBlock?.dataset.obraId;
    const projectId = projectBlock?.dataset.projectId;
    
    if (obraId && projectId) {
        // Encontrar sala pela hierarquia completa
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
        const projectId = projectBlock?.dataset.projectId;
        const obraId = projectBlock?.dataset.obraId;
        
        if (roomId) {
            const input = document.getElementById(`fator-seguranca-${roomId}`);
            
            if (input && input.value === '') {
                const valor = window.systemConstants?.FATOR_SEGURANCA_CAPACIDADE || 10;
                input.value = valor;
                console.log(`✅ Input ${roomId} corrigido: ${valor}% (Obra: ${obraId}, Projeto: ${projectId})`);
            }
        }
    });
}

// Executar quando o projeto for carregado
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixExistingCapacityInputs, 2000);
});

// Exportações simplificadas
export {
    createEmptyRoom,
    insertRoomIntoProject,
    addNewRoom,
    deleteRoom,
    deleteRoomLegacy,
    safeInitializeFatorSeguranca
}

// Disponibilização global correta
if (typeof window !== 'undefined') {
    window.addNewRoom = addNewRoom;
    window.deleteRoom = deleteRoom;
    window.createEmptyRoom = createEmptyRoom;
    window.safeInitializeFatorSeguranca = safeInitializeFatorSeguranca;
}