/**
 * interface.js - Sistema de toggle
 * Sistema com IDs únicos
 */
import { downloadWord } from "./download/infodownload.js";
import {
  showSystemStatus,
  removeExistingStatusBanner,
  createStatusBanner,
  insertStatusBanner,
  scheduleStatusBannerRemoval,
} from "./components/status.js";

import {
  toggleElementVisibility,
  expandElement,
  collapseElement,
  calculateRoomCompletionStats,
  removeEmptyObraMessage,
  showEmptyObraMessageIfNeeded,
  removeEmptyProjectMessage,
  showEmptyProjectMessageIfNeeded,
} from "./helpers.js";

import {
  createEmptyObra,
  buildObraHTML,
  buildObraActionsFooter,
  insertObraIntoDOM,
  updateObraButtonAfterSave,
  deleteObra,
  addNewObra,
} from "../features/managers/obra-manager.js";

import {
  createEmptyProject,
  buildProjectHTML,
  addNewProjectToObra,
} from "../features/managers/project-manager.js";

import {
  getNextProjectNumber,
  getNextObraNumber,
} from "../data/utils/data-utils.js";

import { createEmptyRoom } from "../data/modules/rooms.js";

// Re-exportações para manter compatibilidade
export {
  showSystemStatus,
  removeExistingStatusBanner,
  createStatusBanner,
  insertStatusBanner,
  scheduleStatusBannerRemoval,
  toggleElementVisibility,
  expandElement,
  collapseElement,
  calculateRoomCompletionStats,
  removeEmptyObraMessage,
  showEmptyObraMessageIfNeeded,
  removeEmptyProjectMessage,
  showEmptyProjectMessageIfNeeded,
  createEmptyObra,
  buildObraHTML,
  buildObraActionsFooter,
  insertObraIntoDOM,
  updateObraButtonAfterSave,
  deleteObra,
  getNextObraNumber,
  addNewObra,
  createEmptyProject,
  buildProjectHTML,
  addNewProjectToObra,
  getNextProjectNumber,
  createEmptyRoom,
};

/**
 * Adiciona um novo projeto à obra mais recente
 * @returns {void}
 *
 * @example
 * addNewProject() // Cria uma nova obra e adiciona um projeto nela
 */
function addNewProject() {
  addNewObra().then(() => {
    const obraNumber = getNextObraNumber() - 1;
    const obraName = `Obra${obraNumber}`;
    addNewProjectToObra(obraName);
  });
}

// =============================================================================
// SISTEMA DE TOGGLE - IDs ÚNICOS
// =============================================================================

/**
 * Alterna a visibilidade do conteúdo de uma obra (expandir/recolher)
 * @param {string} obraId - ID único da obra a ser alternada
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 *
 * @example
 * toggleObra('obra_a42', event) // Expande ou recolhe a obra com ID 'obra_a42'
 */
function toggleObra(obraId, event) {
  console.log(` Toggle Obra chamado: ${obraId}`);

  // Validar ID único
  if (!obraId || obraId === "undefined" || obraId === "null") {
    console.error(
      `ERRO FALBACK (toggleObra) interface.js [ID de obra inválido: ${obraId}]`,
    );
    return;
  }

  // Buscar APENAS por ID único
  const contentId = `obra-content-${obraId}`;
  const content = document.getElementById(contentId);

  if (!content) {
    console.error(` Conteúdo da obra ${obraId} não encontrado`);
    console.log(" Conteúdos de obra disponíveis:");
    document.querySelectorAll('[id^="obra-content-"]').forEach((content) => {
      console.log(` - ${content.id}`);
    });
    return;
  }

  const isCollapsed = content.classList.contains("collapsed");
  const minimizer = event.target;

  if (isCollapsed) {
    content.classList.remove("collapsed");
    minimizer.textContent = "−";
    console.log(` Obra ${obraId} expandida`);
  } else {
    content.classList.add("collapsed");
    minimizer.textContent = "+";
    console.log(` Obra ${obraId} recolhida`);
  }
}

/**
 * Alterna a visibilidade do conteúdo de um projeto (expandir/recolher)
 * @param {string} projectId - ID único do projeto a ser alternado
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 *
 * @example
 * toggleProject('obra_a42_proj1', event) // Expande ou recolhe o projeto com ID 'obra_a42_proj1'
 */
function toggleProject(projectId, event) {
  console.log(` Toggle Project chamado: ${projectId}`);

  // Validar ID único
  if (!projectId || projectId === "undefined" || projectId === "null") {
    console.error(
      `ERRO FALBACK (toggleProject) interface.js [ID de projeto inválido: ${projectId}]`,
    );
    return;
  }

  // Buscar APENAS por ID único
  const contentId = `project-content-${projectId}`;
  const content = document.getElementById(contentId);

  if (!content) {
    console.error(` Conteúdo do projeto ${projectId} não encontrado`);
    console.log(" Conteúdos de projeto disponíveis:");
    document.querySelectorAll('[id^="project-content-"]').forEach((content) => {
      console.log(` - ${content.id}`);
    });
    return;
  }

  const isCollapsed = content.classList.contains("collapsed");
  const minimizer = event.target;

  if (isCollapsed) {
    content.classList.remove("collapsed");
    minimizer.textContent = "−";
    console.log(` Projeto ${projectId} expandido`);
  } else {
    content.classList.add("collapsed");
    minimizer.textContent = "+";
    console.log(` Projeto ${projectId} recolhido`);
  }
}

/**
 * Alterna a visibilidade do conteúdo de uma sala (expandir/recolher)
 * @param {string} roomId - ID único da sala
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 *
 * @example
 * toggleRoom('obra_a42_proj1_sala1', event) // Expande ou recolhe a sala com ID 'obra_a42_proj1_sala1'
 */
function toggleRoom(roomId, event) {
  console.log(` Toggle Sala chamado: ID ${roomId}`, event);

  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (toggleRoom) interface.js [ID de sala inválido: ${roomId}]`,
    );
    return;
  }

  // Buscar APENAS por ID único
  const contentId = `room-content-${roomId}`;
  const content = document.getElementById(contentId);

  if (!content) {
    console.error(` Conteúdo da sala ${roomId} não encontrado`);
    console.log(` Procurando por: ${contentId}`);
    console.log(" Conteúdos de sala disponíveis:");
    document.querySelectorAll('[id^="room-content-"]').forEach((content) => {
      console.log(` - ${content.id}`);
    });
    return;
  }

  const isCollapsed = content.classList.contains("collapsed");
  const minimizer = event.target;

  console.log(
    ` Estado da sala ${roomId}: ${isCollapsed ? "recolhida" : "expandida"}`,
  );

  if (isCollapsed) {
    content.classList.remove("collapsed");
    minimizer.textContent = "−";
    console.log(` Sala ${roomId} EXPANDIDA`);
  } else {
    content.classList.add("collapsed");
    minimizer.textContent = "+";
    console.log(` Sala ${roomId} RECOLHIDA`);
  }
}

/**
 * Alterna a visibilidade de uma seção
 * @param {string} sectionId - ID da seção
 * @returns {void}
 *
 * @example
 * toggleSection('materiais') // Alterna visibilidade da seção de materiais
 */
function toggleSection(sectionId) {
  // Validar ID
  if (!sectionId || sectionId === "undefined" || sectionId === "null") {
    console.error(
      `ERRO FALBACK (toggleSection) interface.js [ID de seção inválido: ${sectionId}]`,
    );
    return;
  }
  toggleElementVisibility(`section-content-${sectionId}`, event.target);
}

/**
 * Alterna a visibilidade de uma subseção
 * @param {string} subsectionId - ID da subseção
 * @returns {void}
 *
 * @example
 * toggleSubsection('pintura') // Alterna visibilidade da subseção de pintura
 */
function toggleSubsection(subsectionId) {
  // Validar ID
  if (
    !subsectionId ||
    subsectionId === "undefined" ||
    subsectionId === "null"
  ) {
    console.error(
      `ERRO FALBACK (toggleSubsection) interface.js [ID de subseção inválido: ${subsectionId}]`,
    );
    return;
  }
  toggleElementVisibility(`subsection-content-${subsectionId}`, event.target);
}

// =============================================================================
// FUNÇÕES DE DOWNLOAD E SALVAMENTO
// =============================================================================

/**
 * Salva ou atualiza os dados de uma obra no sistema
 * @param {string} obraName - Nome da obra a ser salva/atualizada
 * @param {Event} event - Evento que triggered a ação
 * @returns {void}
 *
 * @example
 * saveOrUpdateObra('Obra1', event) // Salva/atualiza a Obra1
 */
function saveOrUpdateObra(obraParam, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log(` SALVANDO/ATUALIZANDO OBRA pelo parâmetro: "${obraParam}"`);

  // Converter automaticamente nome para ID
  let obraId = obraParam;

  // Se for nome (não começa com "obra_" e não é numérico)
  if (!obraParam.startsWith("obra_") && !/^\d+$/.test(obraParam)) {
    console.warn(
      ` Parâmetro "${obraParam}" parece ser um nome, convertendo para ID...`,
    );

    // Busca ALL obras com este nome
    const obrasComEsteNome = Array.from(
      document.querySelectorAll("[data-obra-id]"),
    ).filter((obra) => obra.dataset.obraName === obraParam);

    if (obrasComEsteNome.length === 1) {
      obraId = obrasComEsteNome[0].dataset.obraId;
      console.log(` Convertido nome "${obraParam}" → ID "${obraId}"`);
    } else if (obrasComEsteNome.length > 1) {
      console.error(
        ` Múltiplas obras com nome "${obraParam}", usando a primeira`,
      );
      obraId = obrasComEsteNome[0].dataset.obraId;
    } else {
      console.error(` Nenhuma obra encontrada com nome "${obraParam}"`);
      showSystemStatus(`ERRO: Obra "${obraParam}" não encontrada`, "error");
      return;
    }
  }

  // Agora busca pelo ID
  const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);

  if (!obraBlock) {
    console.error(` ERRO: Obra com ID "${obraId}" não encontrada no DOM`);

    // Debug detalhado
    const availableObras = document.querySelectorAll("[data-obra-id]");
    console.log(` Obras disponíveis: ${availableObras.length}`);
    availableObras.forEach((obra, idx) => {
      console.log(
        ` ${idx + 1}. ID: "${obra.dataset.obraId}", Nome: "${obra.dataset.obraName}"`,
      );
    });

    showSystemStatus(`ERRO: Obra não encontrada`, "error");
    return;
  }

  console.log(` Obra encontrada:`, obraBlock.dataset);

  if (typeof window.saveObra === "function") {
    // Agora passa o ID correto para a função interna
    window.saveObra(obraId, event);
  } else {
    console.error(" Função saveObra não encontrada");
    showSystemStatus("ERRO: Funcionalidade de salvar não disponível", "error");
  }
}

// =============================================================================
// EXPORTAÇÕES ADICIONAIS
// =============================================================================

export {
  addNewProject,
  toggleObra,
  toggleProject,
  toggleRoom,
  saveOrUpdateObra,
  toggleSubsection,
  toggleSection,
};

// =============================================================================
// DISPONIBILIZAÇÃO GLOBAL DAS FUNÇÕES
// =============================================================================

if (typeof window !== "undefined") {
  window.addNewObra = addNewObra;
  window.addNewProjectToObra = addNewProjectToObra;
  window.toggleObra = toggleObra;
  window.toggleProject = toggleProject;
  window.toggleRoom = toggleRoom;
  window.toggleSubsection = toggleSubsection;
  window.toggleSection = toggleSection;
  window.getNextObraNumber = getNextObraNumber;
  window.deleteObra = deleteObra;
  window.saveOrUpdateObra = saveOrUpdateObra;
  window.downloadWord = downloadWord;
  window.addNewProject = addNewProject;
  window.createEmptyProject = createEmptyProject;
}
