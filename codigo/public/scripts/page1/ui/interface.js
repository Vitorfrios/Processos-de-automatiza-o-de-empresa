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
 * Cria um projeto vazio na interface
 * @param {string} projectName - Nome do projeto
 * @param {string} projectId - ID do projeto (opcional)
 */
function createEmptyProject(projectName, projectId) {
  const projectHTML = buildProjectHTML(projectName, projectId)
  insertProjectIntoDOM(projectHTML)
  console.log(` Projeto ${projectName} criado`)
}

/**
 * Constrói o HTML de um projeto
 * @param {string} projectName - Nome do projeto
 * @param {string} projectId - ID do projeto
 * @returns {string} HTML do projeto
 */
function buildProjectHTML(projectName, projectId) {
  const hasId = projectId !== null && projectId !== undefined && projectId !== ""

  return `
    <div class="project-block" data-project-id="${projectId || ""}" data-project-name="${projectName}">
      <div class="project-header">
        <button class="minimizer" onclick="toggleProject('${projectName}')">+</button>
        <h2 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">${projectName}</h2>
        <div class="project-actions">
          <button class="btn btn-delete" onclick="deleteProject('${projectName}')">Remover</button>
        </div>
      </div>
      <div class="project-content collapsed" id="project-content-${projectName}">
        <p class="empty-message">Adicione salas a este projeto...</p>
        <div class="add-room-section">
          <button class="btn btn-add-secondary" onclick="addNewRoom('${projectName}')">+ Adicionar Nova Sala</button>
        </div>
        ${buildProjectActionsFooter(projectName, hasId)}
      </div>
    </div>
  `
}

/**
 * Constrói o rodapé de ações do projeto
 * @param {string} projectName - Nome do projeto
 * @param {boolean} hasId - Se o projeto já tem ID (já foi salvo)
 * @returns {string} HTML do rodapé de ações
 */
function buildProjectActionsFooter(projectName, hasId = false) {
  const buttonText = hasId ? "Atualizar Projeto" : "Salvar Projeto"
  const buttonClass = hasId ? "btn-update" : "btn-save"

  return `
    <div class="project-actions-footer">
      <button class="btn btn-verify" onclick="verifyProjectData('${projectName}')">Verificar Dados</button>
      <button class="btn ${buttonClass}" onclick="event.preventDefault(); saveProject('${projectName}', event)">${buttonText}</button>
      <button class="btn btn-download" onclick="downloadPDF('${projectName}')">Baixar PDF</button>
      <button class="btn btn-download" onclick="downloadWord('${projectName}')">Baixar Word</button>
    </div>
  `
}

/**
 * Insere o HTML do projeto no DOM
 * @param {string} projectHTML - HTML do projeto a ser inserido
 */
function insertProjectIntoDOM(projectHTML) {
  const projectsContainer = document.getElementById("projects-container")
  projectsContainer.insertAdjacentHTML("beforeend", projectHTML)
}

/**
 * Adiciona um novo projeto à interface
 */
async function addNewProject() {
  try {
    const projectNumber = getNextProjectNumber()
    const projectName = `Projeto${projectNumber}`

    createEmptyProject(projectName, null)
 
    const defaultRoomName = "Sala1"
    createEmptyRoom(projectName, defaultRoomName, null)
    
    console.log(` ${projectName} adicionado com sala padrão: ${defaultRoomName}`)
    
  } catch (error) {
    console.error(" Erro ao adicionar novo projeto:", error)
    alert("Erro ao criar novo projeto. Verifique o console para detalhes.")
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

export {
  showSystemStatus,
  removeExistingStatusBanner,
  createStatusBanner,
  insertStatusBanner,
  scheduleStatusBannerRemoval,
  toggleElementVisibility,
  expandElement,
  collapseElement,
  toggleProject,
  toggleRoom,
  toggleSection,
  toggleSubsection,
  createEmptyProject,
  buildProjectHTML,
  buildProjectActionsFooter,
  insertProjectIntoDOM,
  addNewProject,
  removeEmptyProjectMessage,
  showEmptyProjectMessageIfNeeded
}