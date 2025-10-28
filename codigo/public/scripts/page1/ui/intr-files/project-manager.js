import { createEmptyRoom } from '../../data/rooms.js'
import { generateProjectId } from '../../data/data-utils.js'
import { removeEmptyObraMessage } from './ui-helpers.js'

/**
 * Gerenciador de projetos
 */

/**
 * Cria um projeto vazio dentro de uma obra
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} projectId - ID do projeto (opcional)
 */
function createEmptyProject(obraName, projectName, projectId) {
  const obraElement = document.querySelector(`[data-obra-name="${obraName}"]`)
  if (!obraElement) {
    console.error(`❌ Obra ${obraName} não encontrada`)
    return
  }

  const finalProjectId = projectId || generateProjectId(obraElement)
  const projectHTML = buildProjectHTML(obraName, projectName, finalProjectId)
  const obraProjectsContainer = document.getElementById(`projects-${obraName}`)

  if (obraProjectsContainer) {
    obraProjectsContainer.insertAdjacentHTML("beforeend", projectHTML)
    console.log(`📁 Projeto ${projectName} criado na obra ${obraName} com ID: ${finalProjectId}`)
    
    // ✅ CORREÇÃO: REMOVER MENSAGEM DE OBRA VAZIA
    removeEmptyObraMessage(obraName)
  } else {
    console.error(`❌ Container de projetos não encontrado para obra ${obraName}`)
  }
}

/**
 * Constrói o HTML de um projeto dentro de uma obra
 */
function buildProjectHTML(obraName, projectName, projectId) {
  const hasId = projectId !== null && projectId !== undefined && projectId !== ""
  const uniqueProjectId = `${obraName}-${projectName}`.replace(/\s+/g, '-')

  return `
    <div class="project-block" data-project-id="${projectId || ""}" data-project-name="${projectName}" data-obra-name="${obraName}">
      <div class="project-header">
        <button class="minimizer" onclick="toggleProject('${uniqueProjectId}', event)">+</button>
        <h3 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">${projectName}</h3>
        <div class="project-actions">
          <button class="btn btn-delete" onclick="deleteProject('${obraName}', '${projectName}')">Remover</button>
        </div>
      </div>
      <div class="project-content collapsed" id="project-content-${uniqueProjectId}">
        <p class="empty-message">Adicione salas a este projeto...</p>
        <div class="add-room-section">
          <button class="btn btn-add-secondary" onclick="addNewRoom('${obraName}', '${projectName}', '${uniqueProjectId}')">+ Adicionar Nova Sala</button>
        </div>
      </div>
    </div>
  `
}

/**
 * Adiciona um novo projeto à obra especificada
 * @param {string} obraName - Nome da obra
 */
function addNewProjectToObra(obraName) {
  try {
    const projectNumber = getNextProjectNumber(obraName)
    const projectName = `Projeto${projectNumber}`

    console.log(`➕ Adicionando projeto ${projectName} à obra ${obraName}`)
    
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
 * Obtém o próximo número de projeto dentro de uma obra
 * @param {string} obraName - Nome da obra
 * @returns {number} Próximo número disponível para projeto
 */
function getNextProjectNumber(obraName) {
  const obraElement = document.querySelector(`[data-obra-name="${obraName}"]`)
  if (!obraElement) return 1

  const projects = obraElement.querySelectorAll('.project-block')
  const projectNumbers = Array.from(projects).map(project => {
    const projectName = project.dataset.projectName
    const match = projectName.match(/Projeto(\d+)/)
    return match ? parseInt(match[1]) : 0
  })

  const maxNumber = Math.max(0, ...projectNumbers)
  return maxNumber + 1
}

export {
    createEmptyProject,
    buildProjectHTML,
    addNewProjectToObra,
    getNextProjectNumber,
}