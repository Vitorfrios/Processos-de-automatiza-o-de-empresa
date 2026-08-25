/**
 * data/modules/rooms.js
 * ARQUIVO DE BUILDER DE SALA
 */

import {
  buildClimatizationSection,
  buildTableSection,
} from "./climatizate/climatizacao-builder.js";
import { buildMachinesSection } from "./machines/machines-core.js";
import { buildAcessoriosSection } from "./acessorios.js";
import { buildTubosSection } from "./tubos.js";
import { buildDutosSection } from "./dutos.js";
import { buildVentilacaoSection } from "./ventilacao.js";
import { generateRoomId } from "../utils/id-generator.js";
import { removeEmptyProjectMessage } from "../../ui/helpers.js";
import {
  triggerCalculation,
  syncTitleToAmbienteDirect,
} from "../../core/shared-utils.js";
import {
  parseCurrency,
  formatCurrency,
} from "../../features/managers/project-manager.js";
// Cache para módulo de máquinas
let machinesPreloadModule = null;

function scheduleRoomTask(
  task,
  { delay = 0, idle = false, timeout = 1000 } = {},
) {
  const runTask = () => {
    if (idle && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => task(), { timeout });
      return;
    }

    window.requestAnimationFrame(() => task());
  };

  if (delay > 0) {
    window.setTimeout(runTask, delay);
    return;
  }

  runTask();
}

/**
 * FUNÇÕES DE CONSTRUÇÃO DE HTML
 */

function buildRoomHTML(obraId, projectId, roomName, roomId) {
  if (!obraId || obraId === "undefined" || obraId === "null") {
    console.error(`ERRO FALBACK (buildRoomHTML) [Obra ID inválido: ${obraId}]`);
    return "";
  }

  if (!projectId || projectId === "undefined" || projectId === "null") {
    console.error(
      `ERRO FALBACK (buildRoomHTML) [Project ID inválido: ${projectId}]`,
    );
    return "";
  }

  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(`ERRO FALBACK (buildRoomHTML) [Room ID inválido: ${roomId}]`);
    return "";
  }

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
 ${buildTableSection(roomId, roomName)}
 ${buildClimatizationSection(obraId, projectId, roomName, roomId)}
 ${buildVentilacaoSection(roomId)}
 ${buildMachinesSection(obraId, projectId, roomName, roomId)}
 ${buildAcessoriosSection(obraId, projectId, roomName, roomId)}
 ${buildTubosSection(obraId, projectId, roomName, roomId)}
 ${buildDutosSection(obraId, projectId, roomName, roomId)}
 <div class="room-total-container">
 <span id="room-total-${roomId}" class="room-total-value" title= "Valor total da sala" >R$ 0,00</span>
 </div>
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
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildRoomHeader) [Room ID inválido: ${roomId}]`,
    );
    return "";
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
 * FUNÇÕES DE OPERAÇÕES
 */

/**
 * Carrega o módulo de máquinas para pré-carregamento assíncrono
 * @returns {Promise<Object|null>} Módulo de máquinas carregado
 */
async function loadMachinesPreloadModule() {
  if (!machinesPreloadModule) {
    try {
      machinesPreloadModule = await import("./machines/machines-core.js");
      console.log(" Módulo de máquinas carregado para pré-carregamento");
    } catch (error) {
      console.error(" Erro ao carregar módulo de máquinas:", error);
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
  console.log(
    ` Criando sala: ${roomName} na obra "${obraId}", projeto "${projectId}"`,
  );

  if (!obraId || obraId === "undefined" || obraId === "null") {
    console.error(
      `ERRO FALBACK (createEmptyRoom) [Obra ID inválido: ${obraId}]`,
    );
    return false;
  }

  if (!projectId || projectId === "undefined" || projectId === "null") {
    console.error(
      `ERRO FALBACK (createEmptyRoom) [Project ID inválido: ${projectId}]`,
    );
    return false;
  }

  const projectElement = document.querySelector(
    `[data-obra-id="${obraId}"][data-project-id="${projectId}"]`,
  );

  if (!projectElement) {
    console.error(` Projeto ${projectId} não encontrado na obra ${obraId}`);
    return false;
  }

  let finalRoomId;

  if (
    roomId &&
    roomId !== "undefined" &&
    roomId !== "null" &&
    !roomId.includes("undefined")
  ) {
    finalRoomId = roomId;
  } else {
    const roomCount = getRoomCountInProject(obraId, projectId);
    finalRoomId = generateRoomId(projectElement, roomCount + 1);
  }

  finalRoomId = finalRoomId
    .toString()
    .replace(/-undefined/g, "")
    .replace(/-null/g, "")
    .trim();

  try {
    const machinesModule = await loadMachinesPreloadModule();
    if (machinesModule && machinesModule.preloadMachinesDataForRoom) {
      await machinesModule.preloadMachinesDataForRoom(finalRoomId);
    }
  } catch (error) {
    console.error(
      " Aviso: Não foi possível pré-carregar dados das máquinas:",
      error,
    );
  }

  const roomHTML = buildRoomHTML(obraId, projectId, roomName, finalRoomId);

  const projectContent = projectElement.querySelector(".project-content");

  if (!projectContent) {
    console.error(` Conteúdo do projeto não encontrado em ${projectId}`);
    return false;
  }

  removeEmptyProjectMessage(projectContent);

  const addRoomSection = projectContent.querySelector(".add-room-section");
  if (addRoomSection) {
    addRoomSection.insertAdjacentHTML("beforebegin", roomHTML);
  } else {
    projectContent.insertAdjacentHTML("beforeend", roomHTML);
  }

  console.log(
    ` Sala ${roomName} criada (ID: ${finalRoomId}) na obra "${obraId}", projeto "${projectId}"`,
  );

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
  const projectElement = document.querySelector(
    `[data-obra-id="${obraId}"][data-project-id="${projectId}"]`,
  );
  if (!projectElement) return 0;

  const rooms = projectElement.querySelectorAll(".room-block");
  return rooms.length;
}

/**
 * ATUALIZAÇÃO DO TOTAL DA SALA (NÍVEL 2)
 * Escuta eventos dos módulos e dispara evento para o projeto
 */
function updateRoomTotal(roomId) {
  const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
  if (!roomBlock) return;

  let total = 0;

  // Máquinas
  const machinesEl = document.getElementById(
    `total-all-machines-price-${roomId}`,
  );
  if (machinesEl) total += parseCurrency(machinesEl.textContent);

  // Acessórios
  const acessoriosEl = document.getElementById(`acessorios-total-${roomId}`);
  if (acessoriosEl) total += parseCurrency(acessoriosEl.textContent);

  // Dutos
  const dutosEl = document.getElementById(`dutos-total-${roomId}`);
  if (dutosEl) total += parseCurrency(dutosEl.textContent);

  // Tubulação
  const tubosEl = document.getElementById(`total-geral-valor-${roomId}`);
  if (tubosEl) total += parseCurrency(tubosEl.textContent);

  // Atualiza o display
  const roomTotalSpan = document.getElementById(`room-total-${roomId}`);
  if (roomTotalSpan) {
    roomTotalSpan.textContent = formatCurrency(total);

    // DISPARA EVENTO PARA O PROJETO (NÍVEL 3)
    const projectId = roomBlock.dataset.projectId;
    if (projectId) {
      document.dispatchEvent(
        new CustomEvent("salaAtualizada", {
          detail: {
            roomId,
            projectId,
            total,
          },
        }),
      );
    }
  }
}

/**
 * INICIALIZAÇÃO DA SALA
 */
function initializeRoomComponents(obraId, projectId, roomName, roomId) {
  console.log(` INICIALIZAÇÃO COMPLETA DA SALA: ${roomName} (ID: ${roomId})`);

  scheduleRoomTask(
    () => {
      setupBidirectionalTitleAmbienteSync(roomId, roomName);
      initializeDefaultValues(roomId, roomName);
      initializeAcessoriosSystem(roomId);

      // Atualiza total inicial
      updateRoomTotal(roomId);

      console.log(` TODAS AS SINCRONIZAÇÕES CONFIGURADAS PARA: ${roomId}`);
    },
    { delay: 120, idle: true, timeout: 1000 },
  );

  scheduleRoomTask(
    async () => {
      try {
        const machinesModule = await import("./machines/machines-core.js");
        if (machinesModule.preloadMachinesDataForRoom) {
          await machinesModule.preloadMachinesDataForRoom(roomId);
        }
      } catch (error) {
        console.log(
          ` Não foi possível pré-carregar dados das máquinas para ${roomId}`,
        );
      }
    },
    { delay: 60, idle: true, timeout: 1000 },
  );

  scheduleRoomTask(() => safeInitializeFatorSeguranca(roomId), { delay: 90 });
  scheduleRoomTask(() => verifyRoomSetupComplete(roomId), {
    delay: 160,
    idle: true,
    timeout: 1000,
  });
}

// ESCUTA EVENTOS DOS MÓDULOS (NÍVEL 1)
document.addEventListener("valorAtualizado", (e) => {
  const { roomId } = e.detail;
  if (roomId) {
    setTimeout(() => updateRoomTotal(roomId), 10);
  }
});

// FUNÇÕES DE SINCRONIZAÇÃO (mantidas como estão)
function setupBidirectionalTitleAmbienteSync(roomId, roomName) {
  const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
  if (!roomBlock) return;

  const roomTitle = roomBlock.querySelector(".room-title");
  const ambienteInput = findAmbienteInput(roomId);

  if (roomTitle && ambienteInput) {
    if (
      !ambienteInput.value ||
      ambienteInput.value.trim() === "" ||
      ambienteInput.value === "Sala1"
    ) {
      ambienteInput.value = roomTitle.textContent || roomName;
    }

    ambienteInput.addEventListener("input", function () {
      if (
        this.value &&
        this.value.trim() !== "" &&
        this.value !== roomTitle.textContent
      ) {
        roomTitle.textContent = this.value;
        roomBlock.dataset.roomName = this.value;
        triggerCalculation(roomId);
      }
    });

    setupTitleChangeObserver(roomTitle, roomId);
  }
}

// FUNÇÃO PARA OBSERVAR MUDANÇAS NO TÍTULO (edição inline)
function setupTitleChangeObserver(roomTitle, roomId) {
  let isEditing = false;

  roomTitle.addEventListener("click", function () {
    isEditing = true;
  });

  const observer = new MutationObserver((mutations) => {
    if (!isEditing) return;

    mutations.forEach((mutation) => {
      if (mutation.type === "characterData" || mutation.type === "childList") {
        const newTitle = roomTitle.textContent.trim();
        if (newTitle && newTitle !== mutation.oldValue) {
          syncTitleToAmbienteDirect(roomId, newTitle);
        }
      }
    });
  });

  roomTitle.addEventListener("blur", function () {
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
    characterDataOldValue: true,
  });
}

// FUNÇÃO PARA INICIALIZAÇÃO DOS VALORES PADRÃO
function initializeDefaultValues(roomId, roomName) {
  const areaInput = document.querySelector(
    `input[data-field="area"][data-room-id="${roomId}"]`,
  );
  if (areaInput && (!areaInput.value || Number(areaInput.value) < 0)) {
    areaInput.value = "0";
  }
}

// FUNÇÃO AUXILIAR PARA BUSCAR INPUT AMBIENTE
function findAmbienteInput(roomId) {
  const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
  if (!roomBlock) return null;

  return (
    roomBlock.querySelector('input[data-field="ambiente"]') ||
    roomBlock.querySelector('input[placeholder*="ambiente" i]') ||
    roomBlock.querySelector('input[placeholder*="sala" i]')
  );
}

async function initializeAcessoriosSystem(roomId) {
  try {
    if (typeof window.initAcessoriosSystem === "function") {
      await window.initAcessoriosSystem(roomId);
    } else {
      const acessoriosModule = await import("./acessorios.js");
      if (acessoriosModule && acessoriosModule.initAcessoriosSystem) {
        acessoriosModule.initAcessoriosSystem(roomId);
      }
    }
  } catch (error) {
    console.error(` Erro ao inicializar sistema de acessorios:`, error);
  }
}

// FUNÇÃO PARA VERIFICAÇÃO COMPLETA DO SETUP
function verifyRoomSetupComplete(roomId) {
  const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
  if (!roomBlock) return false;

  const elements = {
    Titulo: roomBlock.querySelector(".room-title"),
    Ambiente: findAmbienteInput(roomId),
    Area: roomBlock.querySelector('input[data-field="area"]'),
  };

  let allFound = true;
  Object.entries(elements).forEach(([name, element]) => {
    if (!element) allFound = false;
  });

  return allFound;
}

if (typeof window !== "undefined") {
  window.debugRoomSync = function (roomId) {
    console.log(` DEBUG COMPLETO DA SALA: ${roomId}`);
    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomBlock) {
      console.log(" Elementos encontrados:");
      console.log(
        "- Titulo:",
        roomBlock.querySelector(".room-title")?.textContent,
      );
      console.log("- Ambiente:", findAmbienteInput(roomId)?.value);
      console.log("- Area:", roomBlock.querySelector('input[data-field="area"]')?.value);
    }
  };
}

/**
 * Função auxiliar para inicializar fator de segurança de forma segura
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function safeInitializeFatorSeguranca(roomId) {
  if (typeof window.initializeFatorSeguranca === "function") {
    try {
      window.initializeFatorSeguranca(roomId);
    } catch (error) {
      console.log(
        ` Erro ao inicializar fator de segurança para ${roomId}:`,
        error.message,
      );
    }
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
  const projectElement = document.querySelector(
    `[data-obra-id="${obraId}"][data-project-id="${projectId}"]`,
  );
  if (!projectElement) {
    console.error(` Projeto ${projectId} não encontrado na obra ${obraId}`);
    return;
  }

  const projectContent = projectElement.querySelector(".project-content");
  if (!projectContent) {
    console.error(` Conteúdo do projeto ${projectId} não encontrado`);
    return;
  }

  const addRoomSection = projectContent.querySelector(".add-room-section");
  if (addRoomSection) {
    addRoomSection.insertAdjacentHTML("beforebegin", roomHTML);
  } else {
    projectContent.insertAdjacentHTML("beforeend", roomHTML);
  }

  removeEmptyProjectMessage(projectContent);
}

async function addNewRoom(obraId, projectId) {
  const projectElement = document.querySelector(
    `[data-obra-id="${obraId}"][data-project-id="${projectId}"]`,
  );
  if (!projectElement) {
    console.error(` Projeto ${projectId} não encontrado na obra ${obraId}`);
    return;
  }

  const roomCount = getRoomCountInProject(obraId, projectId);
  const roomName = `Sala${roomCount + 1}`;

  await createEmptyRoom(obraId, projectId, roomName, null);
}

async function addNewRoomToProject(obraId, projectId) {
  return addNewRoom(obraId, projectId);
}

/**
 * Remove uma sala do projeto após confirmação do usuário
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomId - ID único da sala a ser removida
 * @returns {void}
 */
function deleteRoom(obraId, projectId, roomId) {
  const roomBlock = document.querySelector(
    `[data-obra-id="${obraId}"][data-project-id="${projectId}"][data-room-id="${roomId}"]`,
  );

  if (!roomBlock) {
    console.error(` Sala com ID ${roomId} não encontrada`);
    return;
  }

  const projectContent = roomBlock.closest(".project-content");
  roomBlock.remove();

  // Dispara evento para o projeto
  document.dispatchEvent(
    new CustomEvent("salaAtualizada", {
      detail: { projectId, roomId, total: 0 },
    }),
  );

  if (
    projectContent &&
    typeof window.showEmptyProjectMessageIfNeeded === "function"
  ) {
    window.showEmptyProjectMessageIfNeeded(projectContent);
  }
}

function deleteRoomLegacy(projectName, roomName) {
  const projectBlock = document.querySelector(
    `[data-project-name="${projectName}"]`,
  );
  const obraId = projectBlock?.dataset.obraId;
  const projectId = projectBlock?.dataset.projectId;

  if (obraId && projectId) {
    const roomBlock = document.querySelector(
      `[data-obra-id="${obraId}"][data-project-id="${projectId}"][data-room-name="${roomName}"]`,
    );
    const roomId = roomBlock?.dataset.roomId;

    if (roomId) {
      return deleteRoom(obraId, projectId, roomId);
    }
  }
}

/**
 * Corrige inputs de fator de segurança que estejam vazios
 * Aplica valores padrão baseados nas constantes do sistema
 * @returns {void}
 */
function fixExistingCapacityInputs() {
  const roomBlocks = document.querySelectorAll(".room-block");

  roomBlocks.forEach((roomBlock) => {
    const roomId = roomBlock.dataset.roomId;
    if (roomId) {
      const input = document.getElementById(`fator-seguranca-${roomId}`);
      if (input && input.value === "") {
        const valor =
          window.systemConstants?.FATOR_SEGURANCA_CAPACIDADE.value || 10;
        input.value = valor;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(fixExistingCapacityInputs, 250);
});

/**
 * EXPORTAÇÕES
 */
export {
  buildRoomHTML,
  buildRoomHeader,
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
  updateRoomTotal,
  triggerCalculation,
  parseCurrency,
  formatCurrency,
};

// Compatibilidade global para scripts legados
if (typeof window !== "undefined") {
  window.addNewRoom = addNewRoom;
  window.deleteRoom = deleteRoom;
  window.addNewRoomToProject = addNewRoomToProject;
  window.createEmptyRoom = createEmptyRoom;
  window.safeInitializeFatorSeguranca = safeInitializeFatorSeguranca;
  window.buildRoomHTML = buildRoomHTML;
  window.updateRoomTotal = updateRoomTotal;
}

