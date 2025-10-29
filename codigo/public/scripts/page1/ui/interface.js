// interface.js
import { 
    showSystemStatus,
    removeExistingStatusBanner,
    createStatusBanner,
    insertStatusBanner,
    scheduleStatusBannerRemoval,
} from './intr-files/status-manager.js'

import { 
    toggleElementVisibility,
    expandElement,
    collapseElement,
    calculateRoomCompletionStats,
    removeEmptyObraMessage,
    showEmptyObraMessageIfNeeded,
    removeEmptyProjectMessage,
    showEmptyProjectMessageIfNeeded,
} from './intr-files/ui-helpers.js'

import { 
    createEmptyObra,
    buildObraHTML,
    buildObraActionsFooter,
    insertObraIntoDOM,
    updateObraButtonAfterSave,
    deleteObra,
    getNextObraNumber,
    addNewObra,
} from './intr-files/obra-manager.js'

import { 
    createEmptyProject,
    buildProjectHTML,
    addNewProjectToObra,
    getNextProjectNumber,
} from './intr-files/project-manager.js'

import { createEmptyRoom } from '../data/modules/room-operations.js'

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
}

/**
 * Adiciona um novo projeto à obra mais recente
 * @returns {void}
 * 
 * @example
 * addNewProject() // Cria uma nova obra e adiciona um projeto nela
 */
function addNewProject() {
  addNewObra().then(() => {
    const obraNumber = getNextObraNumber() - 1
    const obraName = `Obra${obraNumber}`
    addNewProjectToObra(obraName)
  })
}

/**
 * Alterna a visibilidade do conteúdo de uma obra (expandir/recolher)
 * @param {string} obraName - Nome da obra a ser alternada
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 * 
 * @example
 * toggleObra('Obra1', event) // Expande ou recolhe a Obra1
 */

function toggleObra(obraIdentifier, event) {
  // ✅ CORREÇÃO: Buscar por ID único primeiro, depois por nome
  let content = document.getElementById(`obra-content-${obraIdentifier}`);
  let obraBlock = document.querySelector(`[data-obra-id="${obraIdentifier}"]`);
  
  // Se não encontrou pelo ID, tentar pelo nome
  if (!content || !obraBlock) {
    obraBlock = document.querySelector(`[data-obra-name="${obraIdentifier}"]`);
    if (obraBlock) {
      const obraId = obraBlock.dataset.obraId;
      content = document.getElementById(`obra-content-${obraId || obraIdentifier}`);
    }
  }
  
  if (!content) {
    console.error(`❌ Conteúdo da obra ${obraIdentifier} não encontrado`);
    return;
  }

  const isCollapsed = content.classList.contains("collapsed");
  const minimizer = event.target;

  if (isCollapsed) {
    content.classList.remove("collapsed");
    minimizer.textContent = "−";
    console.log(`📂 Obra ${obraIdentifier} expandida`);
  } else {
    content.classList.add("collapsed");
    minimizer.textContent = "+";
    console.log(`📁 Obra ${obraIdentifier} recolhida`);
  }
}

/**
 * Alterna a visibilidade do conteúdo de um projeto (expandir/recolher)
 * @param {string} projectName - Nome do projeto a ser alternado
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 * 
 * @example
 * toggleProject('Projeto1', event) // Expande ou recolhe o Projeto1
 */
function toggleProject(projectName, event) {
  const contentId = `project-content-${projectName}`
  const content = document.getElementById(contentId)
  
  if (!content) {
    console.error(`❌ Conteúdo do projeto ${projectName} não encontrado`)
    return
  }

  const isCollapsed = content.classList.contains("collapsed")
  const minimizer = event.target

  if (isCollapsed) {
    content.classList.remove("collapsed")
    minimizer.textContent = "−"
    console.log(`📂 Projeto ${projectName} expandido`)
  } else {
    content.classList.add("collapsed")
    minimizer.textContent = "+"
    console.log(`📁 Projeto ${projectName} recolhida`)
  }
}

/**
 * Alterna a visibilidade do conteúdo de uma sala (expandir/recolher)
 * @param {string} roomId - ID único da sala
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 * 
 * @example
 * toggleRoom('sala-123', event) // Expande ou recolhe a sala com ID 'sala-123'
 */
function toggleRoom(roomId, event) {
  console.log(`🔧 Toggle Sala chamado: ID ${roomId}`, event)
  
  const allRoomsWithId = document.querySelectorAll(`[data-room-id="${roomId}"]`)
  
  if (allRoomsWithId.length === 0) {
    console.error(`❌ Nenhuma sala encontrada com ID: ${roomId}`)
    return
  }
  
  if (allRoomsWithId.length > 1) {
    console.warn(`⚠️  Múltiplas salas encontradas com ID: ${roomId} (${allRoomsWithId.length} salas)`)
    
    const clickedElement = event.target
    const roomBlock = clickedElement.closest('.room-block')
    
    if (roomBlock && roomBlock.dataset.roomId === roomId) {
      toggleSpecificRoom(roomBlock, roomId, event)
      return
    }
  }
  
  const roomBlock = allRoomsWithId[0]
  toggleSpecificRoom(roomBlock, roomId, event)
}

/**
 * Função interna para alternar uma sala específica
 * @param {HTMLElement} roomBlock - Elemento HTML da sala
 * @param {string} roomId - ID único da sala
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 * 
 * @example
 * toggleSpecificRoom(roomElement, 'sala-123', event) // Alterna sala específica
 */
function toggleSpecificRoom(roomBlock, roomId, event) {
  const contentId = `room-content-${roomId}`
  const content = document.getElementById(contentId)
  
  if (!content) {
    console.error(`❌ Conteúdo da sala ${roomId} não encontrado`)
    console.log(`🔍 Procurando por: ${contentId}`)
    return
  }

  const isCollapsed = content.classList.contains("collapsed")
  const minimizer = event.target

  console.log(`📂 Estado da sala ${roomId}: ${isCollapsed ? 'recolhida' : 'expandida'} (Obra: ${roomBlock.dataset.obraName}, Projeto: ${roomBlock.dataset.projectName})`)

  if (isCollapsed) {
    content.classList.remove("collapsed")
    minimizer.textContent = "−"
    console.log(`📂 Sala ${roomId} EXPANDIDA`)
  } else {
    content.classList.add("collapsed")
    minimizer.textContent = "+"
    console.log(`📁 Sala ${roomId} RECOLHIDA`)
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
  toggleElementVisibility(`section-content-${sectionId}`, event.target)
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
  toggleElementVisibility(`subsection-content-${subsectionId}`, event.target)
}

/**
 * Gera e inicia o download de um PDF para uma obra ou projeto específico
 * @param {string} obraName - Nome da obra
 * @param {string|null} projectName - Nome do projeto (opcional)
 * @returns {void}
 * 
 * @example
 * downloadPDF('Obra1') // Gera PDF para a Obra1
 * downloadPDF('Obra1', 'ProjetoA') // Gera PDF para o ProjetoA da Obra1
 */
function downloadPDF(obraName, projectName = null) {
  const target = projectName ? `projeto ${projectName} da obra ${obraName}` : `obra ${obraName}`
  console.log(`📄 Gerando PDF para ${target}`)
  showSystemStatus(`Gerando PDF para ${target}...`, "info")
}

/**
 * Gera e inicia o download de um documento Word para uma obra ou projeto específico
 * @param {string} obraName - Nome da obra
 * @param {string|null} projectName - Nome do projeto (opcional)
 * @returns {void}
 * 
 * @example
 * downloadWord('Obra1') // Gera Word para a Obra1
 * downloadWord('Obra1', 'ProjetoA') // Gera Word para o ProjetoA da Obra1
 */
function downloadWord(obraName, projectName = null) {
  const target = projectName ? `projeto ${projectName} da obra ${obraName}` : `obra ${obraName}`
  console.log(`📝 Gerando Word para ${target}`)
  showSystemStatus(`Gerando documento Word para ${target}...`, "info")
}

/**
 * Salva ou atualiza os dados de uma obra no sistema
 * @param {string} obraName - Nome da obra a ser salva/atualizada
 * @param {Event} event - Evento que triggered a ação
 * @returns {void}
 * 
 * @example
 * saveOrUpdateObra('Obra1', event) // Salva/atualiza a Obra1
 */
function saveOrUpdateObra(obraName, event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  console.log(`💾 SALVANDO/ATUALIZANDO OBRA: "${obraName}"`)

  const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`)
  if (!obraBlock) {
    console.error(`❌ Obra "${obraName}" não encontrada no DOM para salvar`)
    console.log('🔍 Obras disponíveis no DOM:')
    document.querySelectorAll('[data-obra-name]').forEach(obra => {
      console.log(`  - ${obra.dataset.obraName}`)
    })
    showSystemStatus(`ERRO: Obra "${obraName}" não encontrada`, "error")
    return
  }

  console.log(`✅ Obra encontrada no DOM:`, obraBlock.dataset)

  if (typeof window.saveObra === 'function') {
    window.saveObra(obraName, event)
  } else {
    console.error('❌ Função saveObra não encontrada no window')
    showSystemStatus("ERRO: Funcionalidade de salvar não disponível", "error")
  }
}

// Exportações adicionais do orquestrador
export {
    addNewProject,
    toggleObra,
    toggleProject,
    toggleRoom,
    toggleSpecificRoom,
    downloadPDF,
    downloadWord,
    saveOrUpdateObra,
    toggleSubsection,
    toggleSection
}

// Disponibilização global das funções
if (typeof window !== 'undefined') {
  window.addNewObra = addNewObra
  window.addNewProjectToObra = addNewProjectToObra
  window.toggleObra = toggleObra
  window.toggleProject = toggleProject
  window.toggleRoom = toggleRoom
  window.toggleSubsection = toggleSubsection
  window.toggleSection = toggleSection
  window.getNextObraNumber = getNextObraNumber
  window.deleteObra = deleteObra
  window.saveOrUpdateObra = saveOrUpdateObra
  window.downloadPDF = downloadPDF
  window.downloadWord = downloadWord
  window.addNewProject = addNewProject
}