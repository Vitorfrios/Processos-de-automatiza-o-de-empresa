/**
 * data/modules/rooms.js
 * 🎯 FUSÃO COMPLETA: room-operations.js + salas.js
 * ⚡ REDUÇÃO: 2 arquivos → 1 arquivo (~350 → ~250 linhas)
 */

import { buildClimatizationSection } from './climatizacao.js';
import { buildMachinesSection } from './machines/machines-core.js';
import { buildEquipamentosSection, initEquipamentosSystem } from './equipamentos.js';
import { generateRoomId } from '../utils/id-generator.js';
import { removeEmptyProjectMessage, showEmptyProjectMessageIfNeeded } from '../../ui/helpers.js';
import { triggerCalculation, syncTitleToAmbienteDirect } from '../../core/shared-utils.js';

// Cache para módulo de máquinas
let machinesPreloadModule = null;

/**
 * 🏗️ FUNÇÕES DE CONSTRUÇÃO DE HTML (salas.js)
 */

/**
 * Constrói o HTML completo de uma sala com todas as seções
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML completo da sala
 */
function buildRoomHTML(obraId, projectId, roomName, roomId) {
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (buildRoomHTML) [Obra ID inválido: ${obraId}]`);
        return '';
    }

    if (!projectId || projectId === 'undefined' || projectId === 'null') {
        console.error(`ERRO FALBACK (buildRoomHTML) [Project ID inválido: ${projectId}]`);
        return '';
    }

    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`ERRO FALBACK (buildRoomHTML) [Room ID inválido: ${roomId}]`);
        return '';
    }

    console.log(`[BUILD ROOM] Parâmetros:`, { obraId, projectId, roomName, roomId });
    console.log(`[BUILD ROOM] ID ÚNICO: ${roomId}`);

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
          ${buildClimatizationSection(obraId, projectId, roomName, roomId)}
          ${buildMachinesSection(obraId, projectId, roomName, roomId)}
          ${buildEquipamentosSection(obraId, projectId, roomName, roomId)}
        
        </div>
      </div>
    `;
} //adicionar ao final de build as sessoes de tubulação e dutos;

/**
 * Constrói apenas o cabeçalho da sala com título e ações
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML do cabeçalho da sala
 */
function buildRoomHeader(obraId, projectId, roomName, roomId) {
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`ERRO FALBACK (buildRoomHeader) [Room ID inválido: ${roomId}]`);
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
 * Constrói a seção de ações da sala (reservado para futuras implementações)
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML vazio
 */
function buildRoomActions(roomId) {
    return "";
}

/**
 * 🔧 FUNÇÕES DE OPERAÇÕES (room-operations.js)
 */

/**
 * Carrega o módulo de máquinas para pré-carregamento assíncrono
 * @returns {Promise<Object|null>} Módulo de máquinas carregado
 */
async function loadMachinesPreloadModule() {
    if (!machinesPreloadModule) {
        try {
            machinesPreloadModule = await import('./machines/machines-core.js');
            console.log("✅ Módulo de máquinas carregado para pré-carregamento");
        } catch (error) {
            console.error("❌ Erro ao carregar módulo de máquinas:", error);
        }
    }
    return machinesPreloadModule;
}

/**
 * Cria uma nova sala vazia no projeto especificado
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto  
 * @param {string} roomName - Nome da sala
 * @param {string} roomId - ID único da sala (opcional)
 * @returns {Promise<boolean>} True se a sala foi criada com sucesso
 */
async function createEmptyRoom(obraId, projectId, roomName, roomId) {
    console.log(`🔄 Criando sala: ${roomName} na obra "${obraId}", projeto "${projectId}"`);

    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (createEmptyRoom) [Obra ID inválido: ${obraId}]`);
        return false;
    }

    if (!projectId || projectId === 'undefined' || projectId === 'null') {
        console.error(`ERRO FALBACK (createEmptyRoom) [Project ID inválido: ${projectId}]`);
        return false;
    }

    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);

    if (!projectElement) {
        console.error(`❌ Projeto ${projectId} não encontrado na obra ${obraId}`);

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

    let finalRoomId;

    if (roomId && roomId !== 'undefined' && roomId !== 'null' && !roomId.includes('undefined')) {
        finalRoomId = roomId;
    } else {
        const roomCount = getRoomCountInProject(obraId, projectId);
        finalRoomId = generateRoomId(projectElement, roomCount + 1);
    }

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
 * Conta quantas salas já existem no projeto específico
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @returns {number} Quantidade de salas no projeto
 */
function getRoomCountInProject(obraId, projectId) {
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
    console.log(`🔧 INICIALIZAÇÃO COMPLETA DA SALA: ${roomName} (ID: ${roomId})`);

    // ✅ CONFIGURAÇÃO COM TIMING CORRETO
    setTimeout(() => {
        console.log(`🎯 CONFIGURANDO TODAS AS SINCRONIZAÇÕES PARA: ${roomId}`);

        // 1. SINCRONIZAÇÃO TÍTULO ↔ AMBIENTE (BIDIRECIONAL)
        setupBidirectionalTitleAmbienteSync(roomId, roomName);

        // 2. SINCRONIZAÇÃO PAREDES (APENAS PRIMEIRA INTERAÇÃO)
        setupFirstInteractionWallSync(roomId);

        // 3. SINCRONIZAÇÃO INICIAL DOS VALORES
        initializeDefaultValues(roomId, roomName);

        // 4. INICIALIZAR SISTEMA DE EQUIPAMENTOS
        initializeEquipamentosSystem(roomId);

        console.log(`✅ TODAS AS SINCRONIZAÇÕES CONFIGURADAS PARA: ${roomId}`);

    }, 1000);

    // Outras inicializações...
    setTimeout(async () => {
        try {
            const machinesModule = await import('./machines/machines-core.js');
            if (machinesModule.preloadMachinesDataForRoom) {
                await machinesModule.preloadMachinesDataForRoom(roomId);
                console.log(`✅ Dados das máquinas pré-carregados para ${roomId}`);
            }
        } catch (error) {
            console.log(`ℹ️ Não foi possível pré-carregar dados das máquinas para ${roomId}`);
        }
    }, 800);

    // ✅ INICIALIZAÇÃO DE FATOR DE SEGURANÇA
    setTimeout(() => {
        safeInitializeFatorSeguranca(roomId);
    }, 1200);

    // ✅ VERIFICAÇÃO FINAL
    setTimeout(() => {
        console.log(`🔍 VERIFICAÇÃO FINAL DA SALA: ${roomName} (ID: ${roomId})`);
        verifyRoomSetupComplete(roomId);
    }, 2000);
}

// ✅ FUNÇÃO PARA SINCRONIZAÇÃO BIDIRECIONAL TÍTULO ↔ AMBIENTE
function setupBidirectionalTitleAmbienteSync(roomId, roomName) {
    console.log(`🔧 CONFIGURANDO SINCRONIZAÇÃO BIDIRECIONAL TÍTULO↔AMBIENTE: ${roomId}`);

    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomBlock) {
        console.error(`❌ Room block não encontrado: ${roomId}`);
        return;
    }

    const roomTitle = roomBlock.querySelector('.room-title');
    const ambienteInput = findAmbienteInput(roomId);

    if (roomTitle && ambienteInput) {
        console.log(`✅ Elementos encontrados para sincronização bidirecional`);

        // ✅ SINCRONIZAÇÃO INICIAL: Título → Ambiente
        if (!ambienteInput.value || ambienteInput.value.trim() === '' || ambienteInput.value === 'Sala1') {
            ambienteInput.value = roomTitle.textContent || roomName;
            console.log(`✅ Sincronização inicial: Título → Ambiente: "${ambienteInput.value}"`);
        }

        // ✅ SINCRONIZAÇÃO CONTÍNUA: Ambiente → Título
        ambienteInput.addEventListener('input', function () {
            if (this.value && this.value.trim() !== '' && this.value !== roomTitle.textContent) {
                roomTitle.textContent = this.value;
                roomBlock.dataset.roomName = this.value;
                console.log(`🔄 Ambiente → Título: "${this.value}"`);
                triggerCalculation(roomId);
            }
        });

        // ✅ SINCRONIZAÇÃO CONTÍNUA: Título → Ambiente (via Observer para edição inline)
        setupTitleChangeObserver(roomTitle, roomId);

        console.log(`✅ Sincronização bidirecional Título↔Ambiente configurada`);

    } else {
        console.error(`❌ Elementos não encontrados para sincronização:`, {
            roomTitle: !!roomTitle,
            ambienteInput: !!ambienteInput
        });
    }
}

// ✅ FUNÇÃO PARA OBSERVAR MUDANÇAS NO TÍTULO (edição inline)
function setupTitleChangeObserver(roomTitle, roomId) {
    let isEditing = false;

    // Observar quando entra em modo de edição
    roomTitle.addEventListener('click', function () {
        isEditing = true;
        console.log(`✏️ Título em modo de edição: ${roomId}`);
    });

    // Observar mudanças no conteúdo do título
    const observer = new MutationObserver((mutations) => {
        if (!isEditing) return;

        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData' || mutation.type === 'childList') {
                const newTitle = roomTitle.textContent.trim();
                if (newTitle && newTitle !== mutation.oldValue) {
                    console.log(`🎯 Título alterado via edição inline: "${mutation.oldValue}" → "${newTitle}"`);
                    syncTitleToAmbienteDirect(roomId, newTitle);
                }
            }
        });
    });

    // Observar quando sai do modo de edição (blur)
    roomTitle.addEventListener('blur', function () {
        isEditing = false;
        const newTitle = roomTitle.textContent.trim();
        if (newTitle) {
            console.log(`💾 Edição concluída: "${newTitle}"`);
            syncTitleToAmbienteDirect(roomId, newTitle);
        }
    });

    observer.observe(roomTitle, {
        characterData: true,
        childList: true,
        subtree: true,
        characterDataOldValue: true
    });

    console.log(`✅ Observer configurado para título da sala ${roomId}`);
}

// ✅ FUNÇÃO PARA SINCRONIZAÇÃO DE PAREDES (APENAS PRIMEIRA INTERAÇÃO)
function setupFirstInteractionWallSync(roomId) {
    console.log(`🧱 CONFIGURANDO SINCRONIZAÇÃO PAREDES (PRIMEIRA INTERAÇÃO): ${roomId}`);

    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomBlock) {
        console.error(`❌ Room block não encontrado: ${roomId}`);
        return;
    }

    // Buscar inputs de parede
    const paredeOeste = roomBlock.querySelector('input[data-field="paredeOeste"]');
    const paredeLeste = roomBlock.querySelector('input[data-field="paredeLeste"]');
    const paredeNorte = roomBlock.querySelector('input[data-field="paredeNorte"]');
    const paredeSul = roomBlock.querySelector('input[data-field="paredeSul"]');

    console.log(`📊 Elementos de parede encontrados:`, {
        paredeOeste: !!paredeOeste,
        paredeLeste: !!paredeLeste,
        paredeNorte: !!paredeNorte,
        paredeSul: !!paredeSul
    });

    // ✅ SINCRONIZAÇÃO LESTE/OESTE (apenas primeira interação)
    if (paredeOeste && paredeLeste) {
        setupFirstInteractionWallPair(paredeOeste, paredeLeste, roomId, 'Oeste', 'Leste');
    } else {
        console.warn(`⚠️ Par Leste/Oeste incompleto para ${roomId}`);
    }

    // ✅ SINCRONIZAÇÃO NORTE/SUL (apenas primeira interação)
    if (paredeNorte && paredeSul) {
        setupFirstInteractionWallPair(paredeNorte, paredeSul, roomId, 'Norte', 'Sul');
    } else {
        console.warn(`⚠️ Par Norte/Sul incompleto para ${roomId}`);
    }
}

// ✅ FUNÇÃO PARA SINCRONIZAÇÃO DE PAR DE PAREDES (APENAS PRIMEIRA INTERAÇÃO)
function setupFirstInteractionWallPair(input1, input2, roomId, name1, name2) {
    console.log(`🔧 Configurando par ${name1}/${name2} (primeira interação) para ${roomId}`);

    let firstInteraction1 = true;
    let firstInteraction2 = true;

    const placeholderValues = ['Ex: 5.5', 'Ex: 8.0', ''];

    // Input 1 → Input 2 (apenas primeira interação)
    input1.addEventListener('input', function () {
        if (firstInteraction1 && this.value && !placeholderValues.includes(this.value)) {
            const shouldSync = !input2.value || placeholderValues.includes(input2.value);
            if (shouldSync && input2.value !== this.value) {
                input2.value = this.value;
                console.log(`🔄 Primeira interação: ${name1} → ${name2}: ${this.value}`);
                triggerCalculation(roomId);
            }
            firstInteraction1 = false;
        }
    });

    // Input 2 → Input 1 (apenas primeira interação)
    input2.addEventListener('input', function () {
        if (firstInteraction2 && this.value && !placeholderValues.includes(this.value)) {
            const shouldSync = !input1.value || placeholderValues.includes(input1.value);
            if (shouldSync && input1.value !== this.value) {
                input1.value = this.value;
                console.log(`🔄 Primeira interação: ${name2} → ${name1}: ${this.value}`);
                triggerCalculation(roomId);
            }
            firstInteraction2 = false;
        }
    });

    console.log(`✅ Sincronização ${name1}/${name2} (primeira interação) configurada`);
}

// ✅ FUNÇÃO PARA INICIALIZAÇÃO DOS VALORES PADRÃO
function initializeDefaultValues(roomId, roomName) {
    console.log(`⚡ INICIALIZANDO VALORES PADRÃO PARA: ${roomId}`);

    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomBlock) return;

    // Verificar e sincronizar valores iniciais das paredes
    const walls = [
        { field: 'paredeOeste', selector: 'input[data-field="paredeOeste"]' },
        { field: 'paredeLeste', selector: 'input[data-field="paredeLeste"]' },
        { field: 'paredeNorte', selector: 'input[data-field="paredeNorte"]' },
        { field: 'paredeSul', selector: 'input[data-field="paredeSul"]' }
    ];

    walls.forEach(wall => {
        const input = roomBlock.querySelector(wall.selector);
        if (input && input.value && input.value !== 'Ex: 5.5' && input.value !== 'Ex: 8.0') {
            syncOppositeWallInitial(roomId, wall.field, input.value);
        }
    });
}



// ✅ FUNÇÃO AUXILIAR PARA SINCRONIZAÇÃO INICIAL DAS PAREDES
function syncOppositeWallInitial(roomId, field, value) {
    const oppositeMap = {
        'paredeOeste': 'paredeLeste',
        'paredeLeste': 'paredeOeste',
        'paredeNorte': 'paredeSul',
        'paredeSul': 'paredeNorte'
    };

    const oppositeField = oppositeMap[field];
    if (oppositeField) {
        const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
        if (roomBlock) {
            const oppositeInput = roomBlock.querySelector(`input[data-field="${oppositeField}"]`);
            if (oppositeInput && (!oppositeInput.value || oppositeInput.value === 'Ex: 5.5' || oppositeInput.value === 'Ex: 8.0')) {
                oppositeInput.value = value;
                console.log(`✅ Sincronização inicial ${field} → ${oppositeField}: ${value}`);
            }
        }
    }
}

// ✅ FUNÇÃO AUXILIAR PARA BUSCAR INPUT AMBIENTE
function findAmbienteInput(roomId) {
    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomBlock) return null;

    // Estratégias de busca em ordem de prioridade
    return roomBlock.querySelector('input[data-field="ambiente"]') ||
        roomBlock.querySelector('input[placeholder*="ambiente" i]') ||
        roomBlock.querySelector('input[placeholder*="sala" i]');
}

async function initializeEquipamentosSystem(roomId) {
    console.log(`🔧 Inicializando sistema de equipamentos para sala: ${roomId}`);

    try {
        // Verificar se a função está disponível
        if (typeof window.initEquipamentosSystem === 'function') {
            await window.initEquipamentosSystem(roomId);
            console.log(`✅ Sistema de equipamentos inicializado para sala: ${roomId}`);
        } else {
            console.warn(`⚠️ Função initEquipamentosSystem não disponível. Tentando importar...`);

            // Tentar importar dinamicamente
            const equipamentosModule = await import('./equipamentos.js');
            if (equipamentosModule && equipamentosModule.initEquipamentosSystem) {
                equipamentosModule.initEquipamentosSystem(roomId);
                console.log(`✅ Sistema de equipamentos inicializado via import dinâmico`);
            } else {
                console.error(`❌ Não foi possível inicializar sistema de equipamentos`);
            }
        }
    } catch (error) {
        console.error(`❌ Erro ao inicializar sistema de equipamentos:`, error);
    }
}



// ✅ FUNÇÃO PARA VERIFICAÇÃO COMPLETA DO SETUP
function verifyRoomSetupComplete(roomId) {
    console.log(`🔍 VERIFICAÇÃO COMPLETA DA SALA: ${roomId}`);

    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomBlock) {
        console.error(`❌ Room block não encontrado: ${roomId}`);
        return false;
    }

    const elements = {
        'Título': roomBlock.querySelector('.room-title'),
        'Ambiente': findAmbienteInput(roomId),
        'Parede Oeste': roomBlock.querySelector('input[data-field="paredeOeste"]'),
        'Parede Leste': roomBlock.querySelector('input[data-field="paredeLeste"]'),
        'Parede Norte': roomBlock.querySelector('input[data-field="paredeNorte"]'),
        'Parede Sul': roomBlock.querySelector('input[data-field="paredeSul"]')
    };

    let allFound = true;
    let foundCount = 0;

    Object.entries(elements).forEach(([name, element]) => {
        const found = !!element;
        if (!found) allFound = false;
        if (found) foundCount++;
        console.log(`📊 ${name}: ${found ? '✅ Encontrado' : '❌ Não encontrado'}`);
    });

    if (allFound) {
        console.log(`🎉 TODOS OS ${foundCount} ELEMENTOS ENCONTRADOS PARA: ${roomId}`);
    } else {
        console.warn(`⚠️ ${foundCount}/6 ELEMENTOS ENCONTRADOS PARA: ${roomId}`);
    }

    return allFound;
}

// ✅ ADICIONAR FUNÇÃO GLOBAL PARA DEBUG
if (typeof window !== 'undefined') {
    window.debugRoomSync = function (roomId) {
        console.log(`🐛 DEBUG COMPLETO DA SALA: ${roomId}`);
        const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
        if (roomBlock) {
            console.log('📋 Elementos encontrados:');
            console.log('- Título:', roomBlock.querySelector('.room-title')?.textContent);
            console.log('- Ambiente:', findAmbienteInput(roomId)?.value);
            console.log('- Parede Oeste:', roomBlock.querySelector('input[data-field="paredeOeste"]')?.value);
            console.log('- Parede Leste:', roomBlock.querySelector('input[data-field="paredeLeste"]')?.value);
            console.log('- Parede Norte:', roomBlock.querySelector('input[data-field="paredeNorte"]')?.value);
            console.log('- Parede Sul:', roomBlock.querySelector('input[data-field="paredeSul"]')?.value);

            // Testar sincronização manual
            const roomTitle = roomBlock.querySelector('.room-title');
            if (roomTitle) {
                console.log('🔄 Testando sincronização título → ambiente...');
                syncTitleToAmbienteDirect(roomId, roomTitle.textContent);
            }
        }
    };
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
 * Adiciona uma nova sala ao projeto
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @returns {Promise<void>}
 */
async function addNewRoom(obraId, projectId) {
    console.log(`➕ Adicionando nova sala à obra "${obraId}", projeto "${projectId}"`);

    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);

    if (!projectElement) {
        console.error(`❌ Projeto ${projectId} não encontrado na obra ${obraId}`);
        return;
    }

    const roomCount = getRoomCountInProject(obraId, projectId);
    const roomName = `Sala${roomCount + 1}`;

    await createEmptyRoom(obraId, projectId, roomName, null);
    console.log(`✅ ${roomName} adicionada à obra "${obraId}", projeto "${projectId}"`);
}

/**
 * Adiciona uma nova sala ao projeto (alias para compatibilidade)
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @returns {Promise<void>}
 */
async function addNewRoomToProject(obraId, projectId) {
    console.log(`➕ Adicionando nova sala à obra "${obraId}", projeto "${projectId}"`);

    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);

    if (!projectElement) {
        console.error(`❌ Projeto ${projectId} não encontrado na obra ${obraId}`);
        return;
    }

    const roomCount = getRoomCountInProject(obraId, projectId);
    const roomName = `Sala${roomCount + 1}`;

    await createEmptyRoom(obraId, projectId, roomName, null);
    console.log(`✅ ${roomName} adicionada à obra "${obraId}", projeto "${projectId}"`);
}

/**
 * Função de compatibilidade para código existente que usa apenas projectName
 * @param {string} projectName - Nome do projeto
 * @returns {Promise<void>}
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
 * Remove uma sala do projeto após confirmação do usuário
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomId - ID único da sala a ser removida
 * @returns {void}
 */
function deleteRoom(obraId, projectId, roomId) {
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
 * Corrige inputs de fator de segurança que estejam vazios
 * Aplica valores padrão baseados nas constantes do sistema
 * @returns {void}
 */
function fixExistingCapacityInputs() {
    console.log('🔄 Verificando inputs de capacidade existentes...');

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
                const valor = window.systemConstants?.FATOR_SEGURANCA_CAPACIDADE.value || 10;
                input.value = valor;
                console.log(`✅ Input ${roomId} : ${valor}% (Obra: ${obraId}, Projeto: ${projectId})`);
            }
        }
    });
}

// Executar quando o projeto for carregado
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(fixExistingCapacityInputs, 2000);
});

/**
 * 🌐 EXPORTAÇÕES E COMPATIBILIDADE GLOBAL
 */

// Exportações para módulos ES6
export {
    // Construção
    buildRoomHTML,
    buildRoomHeader,
    buildRoomActions,

    // Operações
    createEmptyRoom,
    insertRoomIntoProject,
    addNewRoom,
    deleteRoom,
    deleteRoomLegacy,
    safeInitializeFatorSeguranca,
    addNewRoomToProject,

    // Utilitários
    getRoomCountInProject,
    initializeRoomComponents,
    fixExistingCapacityInputs,
    loadMachinesPreloadModule,


    triggerCalculation,
};

// Compatibilidade global para scripts legados
if (typeof window !== 'undefined') {
    window.addNewRoom = addNewRoom;
    window.deleteRoom = deleteRoom;
    window.addNewRoomToProject = addNewRoomToProject;
    window.createEmptyRoom = createEmptyRoom;
    window.safeInitializeFatorSeguranca = safeInitializeFatorSeguranca;
    window.buildRoomHTML = buildRoomHTML;
}