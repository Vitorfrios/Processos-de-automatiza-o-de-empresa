import { UI_CONSTANTS } from '../config/config.js'
import { createEmptyRoom } from '../data/rooms.js'
import { getNextProjectNumber } from '../data/projects.js'

/**
 * Exibe um banner de status do sistema (sucesso, erro, etc.)
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de status ('success', 'error', etc.)
 */
function showSystemStatus(message, type) {
  removeExistingStatusBanner()

  const banner = createStatusBanner(message, type)
  insertStatusBanner(banner)

  if (type === "success") {
    scheduleStatusBannerRemoval(banner)
  }
}

/**
 * Remove qualquer banner de status existente
 */
function removeExistingStatusBanner() {
  const existingBanner = document.getElementById("system-status-banner")
  if (existingBanner) {
    existingBanner.remove()
  }
}

/**
 * Cria um elemento de banner de status
 * @param {string} message - Mensagem do banner
 * @param {string} type - Tipo de banner
 * @returns {HTMLElement} Elemento do banner criado
 */
function createStatusBanner(message, type) {
  const banner = document.createElement("div")
  banner.id = "system-status-banner"
  banner.className = `system-status-banner ${type}`
  banner.textContent = message
  return banner
}

/**
 * Insere o banner de status no DOM
 * @param {HTMLElement} banner - Banner a ser inserido
 */
function insertStatusBanner(banner) {
  const mainContent = document.querySelector(".main-content")
  mainContent.insertBefore(banner, mainContent.firstChild)
}

/**
 * Agenda a remoção automática do banner de sucesso
 * @param {HTMLElement} banner - Banner a ser removido
 */
function scheduleStatusBannerRemoval(banner) {
  setTimeout(() => {
    banner.remove()
  }, UI_CONSTANTS.SUCCESS_MESSAGE_DURATION)
}

/**
 * Alterna a visibilidade de um elemento (expandir/recolher)
 * @param {string} contentId - ID do elemento a ser alternado
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function toggleElementVisibility(contentId, minimizerElement) {
  const content = document.getElementById(contentId)
  if (!content) return

  const isCollapsed = content.classList.contains(UI_CONSTANTS.COLLAPSED_CLASS)

  if (isCollapsed) {
    expandElement(content, minimizerElement)
  } else {
    collapseElement(content, minimizerElement)
  }
}

/**
 * Expande um elemento na interface
 * @param {HTMLElement} element - Elemento a ser expandido
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function expandElement(element, minimizerElement) {
  element.classList.remove(UI_CONSTANTS.COLLAPSED_CLASS)
  minimizerElement.textContent = UI_CONSTANTS.EXPANDED_SYMBOL
}

/**
 * Recolhe um elemento na interface
 * @param {HTMLElement} element - Elemento a ser recolhido
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function collapseElement(element, minimizerElement) {
  element.classList.add(UI_CONSTANTS.COLLAPSED_CLASS)
  minimizerElement.textContent = UI_CONSTANTS.MINIMIZED_SYMBOL
}

/**
 * Alterna a visibilidade de uma obra
 * @param {string} obraName - Nome da obra
 */
function toggleObra(obraName) {
  toggleElementVisibility(`obra-content-${obraName}`, event.target)
}

/**
 * Alterna a visibilidade de um projeto
 * @param {string} projectName - Nome do projeto
 */
function toggleProject(projectName) {
  toggleElementVisibility(`project-content-${projectName}`, event.target)
}

/**
 * Alterna a visibilidade de uma sala
 * @param {string} roomId - ID da sala
 */
function toggleRoom(roomId) {
  toggleElementVisibility(`room-content-${roomId}`, event.target)
}

/**
 * Alterna a visibilidade de uma seção
 * @param {string} sectionId - ID da seção
 */
function toggleSection(sectionId) {
  toggleElementVisibility(`section-content-${sectionId}`, event.target)
}

/**
 * Alterna a visibilidade de uma subseção
 * @param {string} subsectionId - ID da subseção
 */
function toggleSubsection(subsectionId) {
  toggleElementVisibility(`subsection-content-${subsectionId}`, event.target)
}

/**
 * Cria uma obra vazia na interface
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra (opcional)
 */
function createEmptyObra(obraName, obraId) {
  const obraHTML = buildObraHTML(obraName, obraId)
  insertObraIntoDOM(obraHTML)
  console.log(`🏗️ Obra ${obraName} criada`)
}

/**
 * Constrói o HTML de uma obra
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra
 * @returns {string} HTML da obra
 */
function buildObraHTML(obraName, obraId) {
  const hasId = obraId !== null && obraId !== undefined && obraId !== ""

  return `
    <div class="obra-block" data-obra-id="${obraId || ""}" data-obra-name="${obraName}">
      <div class="obra-header">
        <button class="minimizer" onclick="toggleObra('${obraName}')">+</button>
        <h2 class="obra-title editable-title" data-editable="true" onclick="makeEditable(this, 'obra')">${obraName}</h2>
        <div class="obra-actions">
          <button class="btn btn-delete" onclick="deleteObra('${obraName}')">Remover Obra</button>
        </div>
      </div>
      <div class="obra-content collapsed" id="obra-content-${obraName}">
        <p class="empty-message">Adicione projetos a esta obra...</p>
        <div class="projects-container" id="projects-${obraName}">
          <!-- Projetos serão inseridos aqui -->
        </div>
        <div class="add-project-section">
          <button class="btn btn-add-secondary" onclick="addNewProjectToObra('${obraName}')">+ Adicionar Projeto</button>
        </div>
        ${buildObraActionsFooter(obraName, hasId)}
      </div>
    </div>
  `
}

/**
 * Constrói o rodapé de ações da obra
 * @param {string} obraName - Nome da obra
 * @param {boolean} hasId - Se a obra já tem ID (já foi salva)
 * @returns {string} HTML do rodapé de ações
 */
/**
 * Constrói o rodapé de ações da obra - NOVO (botões que estavam no projeto)
 */
function buildObraActionsFooter(obraName, hasId = false) {
  const buttonText = hasId ? "Atualizar Obra" : "Salvar Obra"
  const buttonClass = hasId ? "btn-update" : "btn-save"

  return `
    <div class="obra-actions-footer">
      <button class="btn btn-verify" onclick="verifyObraData('${obraName}')">Verificar Dados</button>
      <button class="btn ${buttonClass}" onclick="event.preventDefault(); saveObra('${obraName}', event)">${buttonText}</button>
      <button class="btn btn-download" onclick="downloadPDF('${obraName}')">Baixar PDF</button>
      <button class="btn btn-download" onclick="downloadWord('${obraName}')">Baixar Word</button>
    </div>
  `
}

/**
 * Insere o HTML da obra no DOM
 * @param {string} obraHTML - HTML da obra a ser inserida
 */
function insertObraIntoDOM(obraHTML) {
  const projectsContainer = document.getElementById("projects-container")
  projectsContainer.insertAdjacentHTML("beforeend", obraHTML)
}

/**
 * Cria um projeto vazio dentro de uma obra
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} projectId - ID do projeto (opcional)
 */
function createEmptyProject(obraName, projectName, projectId) {
  const projectHTML = buildProjectHTML(obraName, projectName, projectId)
  const obraProjectsContainer = document.getElementById(`projects-${obraName}`)
  
  if (obraProjectsContainer) {
    obraProjectsContainer.insertAdjacentHTML("beforeend", projectHTML)
    removeEmptyObraMessage(obraName)
    console.log(`📁 Projeto ${projectName} criado na obra ${obraName}`)
  } else {
    console.error(`❌ Container de projetos não encontrado para obra ${obraName}`)
  }
}

/**
 * Constrói o HTML de um projeto dentro de uma obra
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} projectId - ID do projeto
 * @returns {string} HTML do projeto
 */
function buildProjectHTML(obraName, projectName, projectId) {
  const hasId = projectId !== null && projectId !== undefined && projectId !== ""

  return `
    <div class="project-block" data-project-id="${projectId || ""}" data-project-name="${projectName}" data-obra-name="${obraName}">
      <div class="project-header">
        <button class="minimizer" onclick="toggleProject('${projectName}')">+</button>
        <h3 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">${projectName}</h3>
        <div class="project-actions">
          <button class="btn btn-delete" onclick="deleteProject('${obraName}', '${projectName}')">Remover</button>
        </div>
      </div>
      <div class="project-content collapsed" id="project-content-${projectName}">
        <p class="empty-message">Adicione salas a este projeto...</p>
        <div class="add-room-section">
          <button class="btn btn-add-secondary" onclick="addNewRoom('${obraName}', '${projectName}')">+ Adicionar Nova Sala</button>
        </div>
        <!-- BOTÕES REMOVIDOS DO PROJETO - AGORA FICAM NO FINAL DA OBRA -->
      </div>
    </div>
  `
}

/**
 * Constrói o rodapé de ações do projeto
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {boolean} hasId - Se o projeto já tem ID (já foi salvo)
 * @returns {string} HTML do rodapé de ações
 */
function buildProjectActionsFooter(obraName, projectName, hasId = false) {
  const buttonText = hasId ? "Atualizar Projeto" : "Salvar Projeto"
  const buttonClass = hasId ? "btn-update" : "btn-save"

  return `
    <div class="project-actions-footer">
      <button class="btn btn-verify" onclick="verifyProjectData('${obraName}', '${projectName}')">Verificar Dados</button>
      <button class="btn ${buttonClass}" onclick="event.preventDefault(); saveProject('${obraName}', '${projectName}', event)">${buttonText}</button>
      <button class="btn btn-download" onclick="downloadPDF('${obraName}', '${projectName}')">Baixar PDF</button>
      <button class="btn btn-download" onclick="downloadWord('${obraName}', '${projectName}')">Baixar Word</button>
    </div>
  `
}

/**
 * Adiciona um novo projeto à obra especificada
 * @param {string} obraName - Nome da obra
 */
function addNewProjectToObra(obraName) {
  try {
    const projectNumber = getNextProjectNumber()
    const projectName = `Projeto${projectNumber}`

    createEmptyProject(obraName, projectName, null)
 
    const defaultRoomName = "Sala1"
    createEmptyRoom(obraName, projectName, defaultRoomName, null)
    
    console.log(`📁 ${projectName} adicionado à obra ${obraName} com sala padrão: ${defaultRoomName}`)
    
  } catch (error) {
    console.error("❌ Erro ao adicionar novo projeto:", error)
    alert("Erro ao criar novo projeto. Verifique o console para detalhes.")
  }
}

/**
 * Adiciona uma nova obra à interface - CORRIGIDA
 */
/**
 * Adiciona uma nova obra à interface - SIMPLIFICADA
 */
async function addNewObra() {
  try {
    const obraNumber = getNextObraNumber()
    const obraName = `Obra${obraNumber}`

    console.log(`🏗️ Criando nova obra: ${obraName}`)
    
    // Cria a obra vazia
    createEmptyObra(obraName, null)
    
    console.log(`✅ ${obraName} adicionada`)
    
  } catch (error) {
    console.error("❌ Erro ao adicionar nova obra:", error)
    alert("Erro ao criar nova obra. Verifique o console para detalhes.")
  }
}

// CORREÇÃO: Adicionar funções faltantes
function deleteObra(obraName) {
  if (!confirm("Tem certeza que deseja remover esta obra e todos os seus projetos?")) return
  
  const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`)
  if (obraBlock) {
    obraBlock.remove()
    console.log(`🗑️ Obra ${obraName} removida`)
    showSystemStatus("Obra removida com sucesso", "success")
  }
}

function saveObra(obraName, event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  console.log(`💾 Salvando obra: ${obraName}`)
  showSystemStatus("Funcionalidade de salvar obra em desenvolvimento", "success")
}

/**
 * Obtém o próximo número de obra
 * @returns {number} Próximo número disponível para obra
 */
function getNextObraNumber() {
  const obraBlocks = document.querySelectorAll('.obra-block')
  const obraNumbers = Array.from(obraBlocks).map(obra => {
    const obraName = obra.dataset.obraName
    const match = obraName.match(/Obra(\d+)/)
    return match ? parseInt(match[1]) : 0
  })
  
  const maxNumber = Math.max(0, ...obraNumbers)
  return maxNumber + 1
}

/**
 * Remove a mensagem de "obra vazia" quando projetos são adicionados
 * @param {string} obraName - Nome da obra
 */
function removeEmptyObraMessage(obraName) {
  const obraContent = document.getElementById(`obra-content-${obraName}`)
  if (obraContent) {
    const emptyMessage = obraContent.querySelector(".empty-message")
    if (emptyMessage) {
      emptyMessage.remove()
    }
  }
}

/**
 * Exibe mensagem de "obra vazia" se não houver projetos
 * @param {string} obraName - Nome da obra
 */
function showEmptyObraMessageIfNeeded(obraName) {
  const obraContent = document.getElementById(`obra-content-${obraName}`)
  if (obraContent) {
    const projectsContainer = obraContent.querySelector(`#projects-${obraName}`)
    const remainingProjects = projectsContainer ? projectsContainer.querySelectorAll(".project-block") : []

    if (remainingProjects.length === 0) {
      const emptyMessage = document.createElement('p')
      emptyMessage.className = 'empty-message'
      emptyMessage.textContent = 'Adicione projetos a esta obra...'
      
      if (projectsContainer) {
        projectsContainer.insertAdjacentElement('beforebegin', emptyMessage)
      }
    }
  }
}

/**
 * Remove a mensagem de "projeto vazio" quando salas são adicionadas
 * @param {HTMLElement} projectContent - Elemento do conteúdo do projeto
 */
function removeEmptyProjectMessage(projectContent) {
  const emptyMessage = projectContent.querySelector(".empty-message")
  if (emptyMessage) {
    emptyMessage.remove()
  }
}

/**
 * Exibe mensagem de "projeto vazio" se não houver salas
 * @param {HTMLElement} projectContent - Elemento do conteúdo do projeto
 */
function showEmptyProjectMessageIfNeeded(projectContent) {
  const remainingRooms = projectContent.querySelectorAll(".room-block")

  if (remainingRooms.length === 0) {
    const addRoomSection = projectContent.querySelector(".add-room-section")
    addRoomSection.insertAdjacentHTML("beforebegin", '<p class="empty-message">Adicione salas a este projeto...</p>')
  }
}

// Funções de compatibilidade (para manter funcionamento com código existente)
function addNewProject() {
  // Por padrão, cria uma obra com um projeto dentro
  addNewObra().then(() => {
    const obraNumber = getNextObraNumber() - 1 // Última obra criada
    const obraName = `Obra${obraNumber}`
    addNewProjectToObra(obraName)
  })
}

// Exportações atualizadas
export {
  showSystemStatus,
  removeExistingStatusBanner,
  createStatusBanner,
  insertStatusBanner,
  scheduleStatusBannerRemoval,
  toggleElementVisibility,
  expandElement,
  collapseElement,
  toggleObra,
  toggleProject,
  toggleRoom,
  toggleSection,
  toggleSubsection,
  createEmptyObra,
  buildObraHTML,
  buildObraActionsFooter,
  insertObraIntoDOM,
  createEmptyProject,
  buildProjectHTML,
  buildProjectActionsFooter,
  addNewObra,
  addNewProjectToObra,
  getNextObraNumber,
  removeEmptyObraMessage,
  showEmptyObraMessageIfNeeded,
  removeEmptyProjectMessage,
  showEmptyProjectMessageIfNeeded,
  addNewProject, // Export para compatibilidade
  deleteObra,
  saveObra
}

// Disponibilização global das novas funções
if (typeof window !== 'undefined') {
  window.addNewObra = addNewObra
  window.addNewProjectToObra = addNewProjectToObra
  window.toggleObra = toggleObra
  window.getNextObraNumber = getNextObraNumber
  window.deleteObra = deleteObra
  window.saveObra = saveObra
}