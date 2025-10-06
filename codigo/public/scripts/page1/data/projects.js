import { 
  API_CONFIG, 
  UI_CONSTANTS, 
  systemConstants,
  projectCounter, // ← AGORA USA O OBJETO COM GET/SET
  GeralCount,
  SESSION_STORAGE_KEY,
  REMOVED_PROJECTS_KEY
} from '../config/config.js'
import { ensureStringId } from '../utils/utils.js'
import { showSystemStatus } from '../ui/interface.js'
import { buildProjectData, extractRoomData } from './data-utils.js'
import { collapseElement } from '../ui/interface.js'
import { resetDisplayLogic, addProjectToRemovedList, saveFirstProjectIdOfSession, updateProjectButton } from './server.js'


async function fetchProjects() {
  try {
    console.log("[v0] Buscando projetos...")
    const response = await fetch(`${API_CONFIG.projects}/projetos`)

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const projects = await response.json()

    const normalizedProjects = projects.map((project) => {
      if (project.id !== undefined && project.id !== null) {
        project.id = ensureStringId(project.id)
      }

      if (project.salas && Array.isArray(project.salas)) {
        project.salas = project.salas.map((sala) => {
          if (sala.id !== undefined && sala.id !== null) {
            sala.id = ensureStringId(sala.id)
          }
          return sala
        })
      }

      return project
    })

    console.log("[v0] Projetos carregados e normalizados:", normalizedProjects)
    return normalizedProjects
  } catch (error) {
    console.error("[v0] Erro ao buscar projetos:", error)
    showSystemStatus("ERRO: Não foi possível carregar projetos", "error")
    return []
  }
}

async function getNextProjectId() {
  const projects = await fetchProjects()

  if (projects.length === 0) {
    return ensureStringId(UI_CONSTANTS.INITIAL_PROJECT_ID)
  }

  const maxId = Math.max(...projects.map((p) => Number(p.id) || 0))
  const nextId = maxId >= UI_CONSTANTS.INITIAL_PROJECT_ID ? maxId + 1 : UI_CONSTANTS.INITIAL_PROJECT_ID
  return ensureStringId(nextId)
}

async function initializeProjectCounter() {
  const projects = document.querySelectorAll(".project-block")

  if (projects.length === 0) {
    projectCounter.set(0) // ← USAR SETTER
    return
  }

  const projectNumbers = Array.from(projects)
    .map((project) => {
      const match = project.dataset.projectName.match(/Projeto(\d+)/)
      return match ? Number.parseInt(match[1]) : 0
    })
    .filter((num) => num > 0)

  const maxProjectNumber = projectNumbers.length > 0 ? Math.max(...projectNumbers) : 0
  projectCounter.set(maxProjectNumber) // ← USAR SETTER
  
  console.log(`[v0] projectCounter inicializado: ${projectCounter.get()}`)
}

function getNextProjectNumber() {
  // USAR O INCREMENT DO OBJETO
  return projectCounter.increment();
}

function normalizeProjectIds(projectData) {
  if (projectData.id !== undefined && projectData.id !== null) {
    projectData.id = ensureStringId(projectData.id)
  }

  if (projectData.salas && Array.isArray(projectData.salas)) {
    projectData.salas.forEach((sala) => {
      if (sala.id !== undefined && sala.id !== null) {
        sala.id = ensureStringId(sala.id)
      }
    })
  }

  return projectData
}

async function salvarProjeto(projectData) {
  try {
    if (!projectData.id) {
      projectData.id = await getNextProjectId()
    }

    projectData = normalizeProjectIds(projectData)

    console.log("[v0] SALVANDO novo projeto:", projectData)
    const response = await fetch(`${API_CONFIG.projects}/projetos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Erro ao SALVAR projeto:", errorText)
      throw new Error(`Erro ao salvar projeto: ${errorText}`)
    }

    const createdProject = await response.json()
    createdProject.id = ensureStringId(createdProject.id)
    console.log("[v0] Projeto SALVO com sucesso:", createdProject)
    showSystemStatus("Projeto salvo com sucesso!", "success")
    return createdProject
  } catch (error) {
    console.error("[v0] Erro ao SALVAR projeto:", error)
    showSystemStatus("ERRO: Não foi possível salvar o projeto", "error")
    return null
  }
}

async function atualizarProjeto(projectId, projectData) {
  try {
    projectId = ensureStringId(projectId)

    if (!projectId) {
      console.error("[v0] ERRO: Tentativa de ATUALIZAR projeto sem ID válido")
      showSystemStatus("ERRO: ID do projeto inválido para atualização", "error")
      return null
    }

    projectData = normalizeProjectIds(projectData)
    projectData.id = projectId

    console.log(`[v0] ATUALIZANDO projeto ID ${projectId}...`)

    const url = `${API_CONFIG.projects}/projetos/${projectId}`
    console.log(`[v0] Fazendo PUT para ATUALIZAR: ${url}`)

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Erro ao ATUALIZAR projeto:", errorText)
      throw new Error(`Erro ao atualizar projeto: ${errorText}`)
    }

    const updatedProject = await response.json()
    updatedProject.id = ensureStringId(updatedProject.id)
    console.log("[v0] Projeto ATUALIZADO com sucesso:", updatedProject)
    showSystemStatus("Projeto atualizado com sucesso!", "success")
    return updatedProject
  } catch (error) {
    console.error("[v0] Erro ao ATUALIZAR projeto:", error)
    showSystemStatus("ERRO: Não foi possível atualizar o projeto", "error")
    return null
  }
}

async function saveProject(projectName, event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  console.log(`[v0] ===== SALVANDO PROJETO ${projectName} =====`)

  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  if (!projectBlock) {
    console.error(`[v0] Projeto ${projectName} não encontrado`)
    showSystemStatus("ERRO: Projeto não encontrado na interface", "error")
    return
  }

  let projectId = projectBlock.dataset.projectId
  console.log(`[v0] DEBUG - dataset.projectId RAW: "${projectId}" (tipo: ${typeof projectId})`)

  projectId =
    projectId && projectId !== "" && projectId !== "undefined" && projectId !== "null"
      ? ensureStringId(projectId)
      : null

  console.log(`[v0] DEBUG - projectId após conversão: ${projectId} (tipo: ${typeof projectId})`)

  const projectData = buildProjectData(projectBlock, projectId)
  console.log(`[v0] DEBUG - projectData.id: ${projectData.id}`)
  console.log(`[v0] Dados do projeto coletados:`, projectData)

  let result = null
  const isNewProject = !projectId

  if (!projectId) {
    console.log("[v0] Nenhum ID encontrado - SALVANDO novo projeto...")
    result = await salvarProjeto(projectData)
  } else {
    console.log(`[v0] ID ${projectId} encontrado - ATUALIZANDO projeto existente...`)
    result = await atualizarProjeto(projectId, projectData)
  }

  if (result) {
    const finalId = ensureStringId(result.id)
    projectBlock.dataset.projectId = finalId
    console.log(`[v0] DEBUG - ID salvo no dataset: ${finalId}`)

    updateProjectButton(projectName, true)
    saveFirstProjectIdOfSession(finalId)

    if (isNewProject) {
      GeralCount++
      console.log(`[v0] GeralCount incrementado: ${GeralCount}`)
    }

    collapseProjectAfterSave(projectName, projectBlock)
    console.log(`[v0] ===== PROJETO ${projectName} SALVO COM SUCESSO (ID: ${finalId}) =====`)
  } else {
    console.error(`[v0] ===== FALHA AO SALVAR PROJETO ${projectName} =====`)
  }
}

function collapseProjectAfterSave(projectName, projectBlock) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const minimizer = projectBlock.querySelector(".project-header .minimizer")

  if (projectContent && !projectContent.classList.contains(UI_CONSTANTS.COLLAPSED_CLASS)) {
    collapseElement(projectContent, minimizer)
  }
}

function deleteProject(projectName) {
  const confirmMessage = "Tem certeza que deseja deletar este projeto? Os dados permanecerão no servidor."

  if (!confirm(confirmMessage)) return

  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  const projectId = projectBlock.dataset.projectId ? ensureStringId(projectBlock.dataset.projectId) : null

  projectBlock.remove()

  if (projectId) {
    addProjectToRemovedList(projectId)
    GeralCount--
    console.log(`[v0] GeralCount decrementado: ${GeralCount}`)

    if (GeralCount <= 0) {
      GeralCount = 0
      console.log("[v0] GeralCount = 0 - Reiniciando lógica de exibição")
      resetDisplayLogic()
    }
  }

  console.log(`[v0] Projeto ${projectName} removido da interface`)
}

function verifyProjectData(projectName) {
  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  const rooms = projectBlock.querySelectorAll(".room-block")

  const report = generateProjectVerificationReport(rooms)

  alert(report)
  console.log(`[v0] Verificação do projeto ${projectName} concluída`)
}

function generateProjectVerificationReport(rooms) {
  let report = `Verificação do Projeto:\n\n`
  report += `Total de salas: ${rooms.length}\n\n`

  rooms.forEach((room) => {
    const roomName = room.querySelector(".room-title").textContent
    const stats = calculateRoomCompletionStats(room)

    report += `${roomName}: ${stats.filled}/${stats.total} campos preenchidos (${stats.percentage}%)\n`
  })

  return report
}

function calculateRoomCompletionStats(room) {
  const inputs = room.querySelectorAll(".form-input")
  const filledInputs = Array.from(inputs).filter((input) => input.value.trim() !== "").length
  const totalInputs = inputs.length
  const percentage = totalInputs > 0 ? ((filledInputs / totalInputs) * 100).toFixed(1) : 0

  return {
    filled: filledInputs,
    total: totalInputs,
    percentage: percentage,
  }
}

export {
  fetchProjects,
  getNextProjectId,
  getNextProjectNumber,
  initializeProjectCounter,
  normalizeProjectIds,
  salvarProjeto,
  atualizarProjeto,
  saveProject,
  collapseProjectAfterSave,
  deleteProject,
  verifyProjectData,
  generateProjectVerificationReport,
  calculateRoomCompletionStats
  // NÃO exportar createEmptyRoom aqui - ela está em rooms.js
}