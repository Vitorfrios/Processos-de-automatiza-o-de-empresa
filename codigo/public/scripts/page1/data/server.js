import { 
  SESSION_STORAGE_KEY, 
  REMOVED_PROJECTS_KEY, 
  NORMALIZATION_DONE_KEY
} from '../config/config.js'
import { ensureStringId } from '../utils/utils.js'
import { fetchProjects, normalizeProjectIds, atualizarProjeto } from './projects.js'
import { showSystemStatus } from '../ui/interface.js'
import { renderProjectFromData, renderRoomFromData, populateRoomInputs } from './server-utils.js'



// ADICIONAR a função removeBaseProjectFromHTML que estava faltando
function removeBaseProjectFromHTML() {
  const projectsContainer = document.getElementById("projects-container")
  const existingProjects = projectsContainer.querySelectorAll(".project-block")

  existingProjects.forEach((project) => {
    project.remove()
  })

  console.log("[v0] Projetos base do HTML removidos")
}


async function loadProjectsFromServer() {
  console.log("[v0] Verificando projetos da sessão atual...")

  const firstProjectId = sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (!firstProjectId) {
    console.log("[v0] Nenhum projeto salvo nesta sessão - mantendo projeto base do HTML")
    window.GeralCount = 0; // ← CORRIGIR: usar window.GeralCount
    return
  }

  console.log(`[v0] Carregando projetos a partir do ID ${firstProjectId}...`)

  const allProjects = await fetchProjects()

  if (allProjects.length === 0) {
    console.log("[v0] Nenhum projeto encontrado no servidor")
    window.GeralCount = 0; // ← CORRIGIR: usar window.GeralCount
    return
  }

  const sessionProjects = allProjects.filter((project) => {
    const isFromSession = project.id >= Number.parseInt(firstProjectId)
    const isNotRemoved = !isProjectRemoved(project.id)
    return isFromSession && isNotRemoved
  })

  if (sessionProjects.length === 0) {
    console.log("[v0] Nenhum projeto da sessão atual encontrado (ou todos foram removidos)")
    resetDisplayLogic()
    return
  }

  console.log(`[v0] ${sessionProjects.length} projeto(s) da sessão atual encontrado(s)`)

  window.GeralCount = sessionProjects.length; // ← CORRIGIR: usar window.GeralCount
  console.log(`[v0] GeralCount inicializado: ${window.GeralCount}`)

  removeBaseProjectFromHTML()

  for (const projectData of sessionProjects) {
    renderProjectFromData(projectData)
  }

  console.log("[v0] Todos os projetos da sessão foram carregados e renderizados")
}


// abaixo desta linha deve vir apenas outras funções

function resetDisplayLogic() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  console.log("[v0] SESSION_STORAGE_KEY limpo")

  sessionStorage.removeItem(REMOVED_PROJECTS_KEY)
  console.log("[v0] REMOVED_PROJECTS_KEY limpo")

  window.GeralCount = 0; // ← CORRIGIR: usar window.GeralCount
  console.log("[v0] Lógica de exibição reiniciada - próximo save será o novo ponto inicial")
}


function saveFirstProjectIdOfSession(projectId) {
  const existingId = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!existingId) {
    const idAsInteger = ensureStringId(projectId)
    if (idAsInteger !== null) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, idAsInteger.toString())
      console.log(`[v0] Primeiro projeto da sessão salvo: ID ${idAsInteger}`)
    }
  }
}

function addProjectToRemovedList(projectId) {
  projectId = ensureStringId(projectId)

  const removedList = getRemovedProjectsList()

  if (!removedList.includes(projectId)) {
    removedList.push(projectId)
    sessionStorage.setItem(REMOVED_PROJECTS_KEY, JSON.stringify(removedList))
    console.log(`[v0] Projeto ID ${projectId} adicionado à lista de removidos`)
  }
}

function getRemovedProjectsList() {
  const stored = sessionStorage.getItem(REMOVED_PROJECTS_KEY)
  return stored ? JSON.parse(stored) : []
}

function isProjectRemoved(projectId) {
  const removedList = getRemovedProjectsList()
  return removedList.includes(projectId)
}

function updateProjectButton(projectName, hasId) {
  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  if (!projectBlock) return

  const saveButton = projectBlock.querySelector(
    ".project-actions-footer .btn-save, .project-actions-footer .btn-update",
  )
  if (!saveButton) return

  if (hasId) {
    saveButton.textContent = "Atualizar Projeto"
    saveButton.classList.remove("btn-save")
    saveButton.classList.add("btn-update")
    console.log(`[v0] Botão do projeto ${projectName} alterado para "Atualizar Projeto"`)
  } else {
    saveButton.textContent = "Salvar Projeto"
    saveButton.classList.remove("btn-update")
    saveButton.classList.add("btn-save")
    console.log(`[v0] Botão do projeto ${projectName} alterado para "Salvar Projeto"`)
  }
}

async function normalizeAllProjectsOnServer() {
  const alreadyNormalized = sessionStorage.getItem(NORMALIZATION_DONE_KEY)
  if (alreadyNormalized === "true") {
    console.log("[v0] IDs já foram normalizados nesta sessão")
    return
  }

  console.log("[v0] Iniciando normalização de IDs no servidor...")

  try {
    const allProjects = await fetchProjects()

    if (allProjects.length === 0) {
      console.log("[v0] Nenhum projeto para normalizar")
      sessionStorage.setItem(NORMALIZATION_DONE_KEY, "true")
      return
    }

    console.log(`[v0] Normalizando ${allProjects.length} projeto(s)...`)

    let normalizedCount = 0
    for (const project of allProjects) {
      const needsNormalization = typeof project.id === "string"

      if (needsNormalization) {
        const normalizedProject = normalizeProjectIds(project)
        const result = await atualizarProjeto(normalizedProject.id, normalizedProject)

        if (result) {
          normalizedCount++
          console.log(`[v0] Projeto ID ${normalizedProject.id} normalizado no servidor`)
        }
      }
    }

    if (normalizedCount > 0) {
      console.log(`[v0] ${normalizedCount} projeto(s) normalizado(s) no servidor`)
      showSystemStatus(`${normalizedCount} projeto(s) com IDs corrigidos no servidor`, "success")
    } else {
      console.log("[v0] Todos os projetos já estavam com IDs corretos")
    }

    sessionStorage.setItem(NORMALIZATION_DONE_KEY, "true")
  } catch (error) {
    console.error("[v0] Erro ao normalizar IDs no servidor:", error)
    showSystemStatus("ERRO: Não foi possível normalizar IDs no servidor", "error")
  }
}

// CORRIGIR AS EXPORTAÇÕES - garantir que cada função é exportada apenas uma vez
export {
  loadProjectsFromServer,
  removeBaseProjectFromHTML,
  renderProjectFromData,
  renderRoomFromData,
  populateRoomInputs,
  normalizeAllProjectsOnServer,
  saveFirstProjectIdOfSession,
  addProjectToRemovedList,
  getRemovedProjectsList,
  isProjectRemoved,
  updateProjectButton,
  resetDisplayLogic
}