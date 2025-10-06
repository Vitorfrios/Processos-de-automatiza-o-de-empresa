import { UI_CONSTANTS } from '../config/config.js'
import { createEmptyRoom } from '../data/rooms.js'
import { getNextProjectNumber } from '../data/projects.js'

function showSystemStatus(message, type) {
  removeExistingStatusBanner()

  const banner = createStatusBanner(message, type)
  insertStatusBanner(banner)

  if (type === "success") {
    scheduleStatusBannerRemoval(banner)
  }
}

function removeExistingStatusBanner() {
  const existingBanner = document.getElementById("system-status-banner")
  if (existingBanner) {
    existingBanner.remove()
  }
}

function createStatusBanner(message, type) {
  const banner = document.createElement("div")
  banner.id = "system-status-banner"
  banner.className = `system-status-banner ${type}`
  banner.textContent = message
  return banner
}

function insertStatusBanner(banner) {
  const mainContent = document.querySelector(".main-content")
  mainContent.insertBefore(banner, mainContent.firstChild)
}

function scheduleStatusBannerRemoval(banner) {
  setTimeout(() => {
    banner.remove()
  }, UI_CONSTANTS.SUCCESS_MESSAGE_DURATION)
}

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

function expandElement(element, minimizerElement) {
  element.classList.remove(UI_CONSTANTS.COLLAPSED_CLASS)
  minimizerElement.textContent = UI_CONSTANTS.EXPANDED_SYMBOL
}

function collapseElement(element, minimizerElement) {
  element.classList.add(UI_CONSTANTS.COLLAPSED_CLASS)
  minimizerElement.textContent = UI_CONSTANTS.MINIMIZED_SYMBOL
}

function toggleProject(projectName) {
  toggleElementVisibility(`project-content-${projectName}`, event.target)
}

function toggleRoom(roomId) {
  toggleElementVisibility(`room-content-${roomId}`, event.target)
}

function toggleSection(sectionId) {
  toggleElementVisibility(`section-content-${sectionId}`, event.target)
}

function toggleSubsection(subsectionId) {
  toggleElementVisibility(`subsection-content-${subsectionId}`, event.target)
}

function createEmptyProject(projectName, projectId) {
  const projectHTML = buildProjectHTML(projectName, projectId)
  insertProjectIntoDOM(projectHTML)
  console.log(`[v0] Projeto ${projectName} criado`)
}

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

function insertProjectIntoDOM(projectHTML) {
  const projectsContainer = document.getElementById("projects-container")
  projectsContainer.insertAdjacentHTML("beforeend", projectHTML)
}

async function addNewProject() {
  try {
    const projectNumber = getNextProjectNumber()
    const projectName = `Projeto${projectNumber}`

    createEmptyProject(projectName, null)
 
    const defaultRoomName = "Sala1"
    createEmptyRoom(projectName, defaultRoomName, null)
    
    console.log(`[v0] ${projectName} adicionado com sala padrão: ${defaultRoomName}`)
    
  } catch (error) {
    console.error("[v0] Erro ao adicionar novo projeto:", error)
    alert("Erro ao criar novo projeto. Verifique o console para detalhes.")
  }
}

function removeEmptyProjectMessage(projectContent) {
  const emptyMessage = projectContent.querySelector(".empty-message")
  if (emptyMessage) {
    emptyMessage.remove()
  }
}

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