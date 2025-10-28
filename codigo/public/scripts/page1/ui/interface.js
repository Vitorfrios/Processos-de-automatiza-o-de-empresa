import { UI_CONSTANTS } from '../config/config.js'
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

import { createEmptyRoom } from '../data/modules/projeto.js'



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

// Funções de compatibilidade (para manter funcionamento com código existente)
function addNewProject() {
  addNewObra().then(() => {
    const obraNumber = getNextObraNumber() - 1
    const obraName = `Obra${obraNumber}`
    addNewProjectToObra(obraName)
  })
}

// Funções de toggle (mantidas no orquestrador por serem específicas)
function toggleObra(obraName, event) {
  const contentId = `obra-content-${obraName}`
  const content = document.getElementById(contentId)
  
  if (!content) {
    console.error(`❌ Conteúdo da obra ${obraName} não encontrado`)
    return
  }

  const isCollapsed = content.classList.contains("collapsed")
  const minimizer = event.target

  if (isCollapsed) {
    content.classList.remove("collapsed")
    minimizer.textContent = "−"
    console.log(`📂 Obra ${obraName} expandida`)
  } else {
    content.classList.add("collapsed")
    minimizer.textContent = "+"
    console.log(`📁 Obra ${obraName} recolhida`)
  }
}

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

// Funções utilitárias
function downloadPDF(obraName, projectName = null) {
  const target = projectName ? `projeto ${projectName} da obra ${obraName}` : `obra ${obraName}`
  console.log(`📄 Gerando PDF para ${target}`)
  showSystemStatus(`Gerando PDF para ${target}...`, "info")
}

function downloadWord(obraName, projectName = null) {
  const target = projectName ? `projeto ${projectName} da obra ${obraName}` : `obra ${obraName}`
  console.log(`📝 Gerando Word para ${target}`)
  showSystemStatus(`Gerando documento Word para ${target}...`, "info")
}

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
}

// Disponibilização global das funções
if (typeof window !== 'undefined') {
  window.addNewObra = addNewObra
  window.addNewProjectToObra = addNewProjectToObra
  window.toggleObra = toggleObra
  window.toggleProject = toggleProject
  window.toggleRoom = toggleRoom
  window.getNextObraNumber = getNextObraNumber
  window.deleteObra = deleteObra
  window.saveOrUpdateObra = saveOrUpdateObra
  window.downloadPDF = downloadPDF
  window.downloadWord = downloadWord
  window.addNewProject = addNewProject
}