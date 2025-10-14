import { SESSION_STORAGE_KEY, REMOVED_PROJECTS_KEY, NORMALIZATION_DONE_KEY } from "../config/config.js"
import { ensureStringId } from "../utils/utils.js"
import { fetchProjects, normalizeProjectIds, atualizarProjeto } from "./projects.js"
import { showSystemStatus } from "../ui/interface.js"
import { renderProjectFromData, renderRoomFromData, populateRoomInputs } from "./server-utils.js"

/**
 * Inicializa o contador global de projetos
 * @returns {number} Valor atual do contador
 */
function initializeGeralCount() {
  if (typeof window.GeralCount === "undefined" || window.GeralCount === null) {
    window.GeralCount = 0
  }
  return window.GeralCount
}

initializeGeralCount()

/**
 * Remove todos os projetos base do HTML
 */
function removeBaseProjectFromHTML() {
  const projectsContainer = document.getElementById("projects-container")
  if (!projectsContainer) return

  const existingProjects = projectsContainer.querySelectorAll(".project-block")
  existingProjects.forEach((project) => project.remove())
}

/**
 * Carrega projetos salvos do servidor para a sessão atual
 */
async function loadProjectsFromServer() {
  const firstProjectId = sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (!firstProjectId) {
    setTimeout(() => {
      if (getGeralCount() === 0) {
        createSingleBaseProject()
      }
    }, 100)
    return
  }

  const allProjects = await fetchProjects()

  if (allProjects.length === 0) {
    setTimeout(() => {
      if (getGeralCount() === 0) {
        createSingleBaseProject()
      }
    }, 100)
    return
  }

  const sessionProjects = allProjects.filter((project) => {
    const isFromSession = project.id >= Number.parseInt(firstProjectId)
    const isNotRemoved = !isProjectRemoved(project.id)
    return isFromSession && isNotRemoved
  })

  if (sessionProjects.length === 0) {
    resetDisplayLogic()
    setTimeout(() => {
      createSingleBaseProject()
    }, 100)
    return
  }

  window.GeralCount = sessionProjects.length

  removeBaseProjectFromHTML()

  for (const projectData of sessionProjects) {
    renderProjectFromData(projectData)
  }
}

/**
 * Carrega máquinas salvas para uma sala específica
 */
async function loadSavedMachinesForRoom(roomBlock, roomData) {
  const roomId = roomBlock.id.replace("room-content-", "")

  if (roomData.maquinasClimatizacao && Array.isArray(roomData.maquinasClimatizacao)) {
    setTimeout(async () => {
      try {
        if (typeof window.loadSavedMachines !== "undefined") {
          await window.loadSavedMachines(roomId, roomData.maquinasClimatizacao)
        }
      } catch (error) {
        console.error("[SERVER] Erro ao carregar máquinas:", error)
      }
    }, 500)
  }
}

/**
 * Incrementa o contador global de projetos
 * @returns {number} Novo valor do contador
 */
function incrementGeralCount() {
  initializeGeralCount()
  window.GeralCount++
  return window.GeralCount
}

/**
 * Decrementa o contador global de projetos
 * @returns {number} Novo valor do contador
 */
function decrementGeralCount() {
  initializeGeralCount()

  if (window.GeralCount > 0) {
    window.GeralCount--

    const existingProjects = document.querySelectorAll(".project-block")

    if (window.GeralCount === 0 && existingProjects.length === 0) {
      setTimeout(() => {
        createSingleBaseProject()
      }, 50)
    } else if (window.GeralCount === 0 && existingProjects.length > 0) {
      window.GeralCount = existingProjects.length
    }
  }
  return window.GeralCount
}

/**
 * Retorna o valor atual do contador global
 * @returns {number} Valor do contador
 */
function getGeralCount() {
  initializeGeralCount()
  return window.GeralCount
}

/**
 * Reseta a lógica de exibição de projetos
 */
function resetDisplayLogic() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  sessionStorage.removeItem(REMOVED_PROJECTS_KEY)
  window.GeralCount = 0
}

/**
 * Cria um único projeto base na interface
 */
function createSingleBaseProject() {
  const projectsContainer = document.getElementById("projects-container")
  if (!projectsContainer) {
    setTimeout(() => {
      const retryContainer = document.getElementById("projects-container")
      if (retryContainer) {
        createProjectBaseHTML(retryContainer)
      }
    }, 600)
    return
  }

  const existingProjects = projectsContainer.querySelectorAll(".project-block")

  if (existingProjects.length === 0) {
    createProjectBaseHTML(projectsContainer)
  }
}

/**
 * Cria o HTML do projeto base
 * @param {HTMLElement} container - Container onde o projeto será inserido
 */
function createProjectBaseHTML(container) {
  const existingBaseProject = container.querySelector('[data-project-name="Projeto1"]');
  if (existingBaseProject) return;

  // ✅ CORREÇÃO: Gerar um ID temporário único baseado em timestamp
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const projectHTML = `
    <div class="project-block" data-project-id="${tempId}" data-project-name="Projeto1">
      <div class="project-header">
        <button class="minimizer" onclick="toggleProject('Projeto1')">+</button>
        <h2 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">Projeto1</h2>
        <div class="project-actions">
          <button class="btn btn-delete" onclick="deleteProject('Projeto1')">Remover</button>
        </div>
      </div>
      <div class="project-content collapsed" id="project-content-Projeto1">
        <p class="empty-message">Nenhuma sala adicionada ainda.</p>
        <div class="add-room-section">
          <button class="btn btn-add-secondary" onclick="addNewRoom('Projeto1')">+ Adicionar Nova Sala</button>
        </div>
        <div class="project-actions-footer">
          <button class="btn btn-verify" onclick="verifyProjectData('Projeto1')">Verificar Dados</button>
          <button class="btn btn-save project-save-btn" onclick="saveProject('Projeto1', event)" data-project-name="Projeto1">Salvar Projeto</button>
          <button class="btn btn-download" onclick="downloadPDF('Projeto1')">Baixar PDF</button>
          <button class="btn btn-download" onclick="downloadWord('Projeto1')">Baixar Word</button>
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", projectHTML);

  setTimeout(() => {
    addNewRoom("Projeto1");
  }, 800);

  window.GeralCount = Math.max(window.GeralCount, 1);
}

/**
 * Salva o ID do primeiro projeto da sessão
 * @param {string|number} projectId - ID do projeto
 */
function saveFirstProjectIdOfSession(projectId) {
  const existingId = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!existingId) {
    const idAsInteger = ensureStringId(projectId)
    if (idAsInteger !== null) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, idAsInteger.toString())
      incrementGeralCount()
    }
  }
}

/**
 * Adiciona um projeto à lista de removidos
 * @param {string|number} projectId - ID do projeto removido
 */
function addProjectToRemovedList(projectId) {
  projectId = ensureStringId(projectId)

  const removedList = getRemovedProjectsList()

  if (!removedList.includes(projectId)) {
    removedList.push(projectId)
    sessionStorage.setItem(REMOVED_PROJECTS_KEY, JSON.stringify(removedList))
    decrementGeralCount()
  }
}

/**
 * Retorna a lista de projetos removidos
 * @returns {Array} Lista de IDs de projetos removidos
 */
function getRemovedProjectsList() {
  const stored = sessionStorage.getItem(REMOVED_PROJECTS_KEY)
  return stored ? JSON.parse(stored) : []
}

/**
 * Verifica se um projeto foi removido
 * @param {string|number} projectId - ID do projeto
 * @returns {boolean} True se o projeto foi removido
 */
function isProjectRemoved(projectId) {
  const removedList = getRemovedProjectsList()
  return removedList.includes(projectId)
}

/**
 * Atualiza o botão de salvar/atualizar do projeto
 * @param {string} projectName - Nome do projeto
 * @param {boolean} hasId - Se o projeto tem ID
 */
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
  } else {
    saveButton.textContent = "Salvar Projeto"
    saveButton.classList.remove("btn-update")
    saveButton.classList.add("btn-save")
  }
}

/**
 * Normaliza todos os IDs de projetos no servidor
 */
async function normalizeAllProjectsOnServer() {
  const alreadyNormalized = sessionStorage.getItem(NORMALIZATION_DONE_KEY)
  if (alreadyNormalized === "true") return

  try {
    const allProjects = await fetchProjects()

    if (allProjects.length === 0) {
      sessionStorage.setItem(NORMALIZATION_DONE_KEY, "true")
      return
    }

    let normalizedCount = 0
    for (const project of allProjects) {
      const needsNormalization = typeof project.id === "string"

      if (needsNormalization) {
        const normalizedProject = normalizeProjectIds(project)
        const result = await atualizarProjeto(normalizedProject.id, normalizedProject)

        if (result) {
          normalizedCount++
        }
      }
    }

    if (normalizedCount > 0) {
      showSystemStatus(`${normalizedCount} projeto(s) com IDs corrigidos no servidor`, "success")
    }

    sessionStorage.setItem(NORMALIZATION_DONE_KEY, "true")
  } catch (error) {
    console.error(" Erro ao normalizar IDs no servidor:", error)
    showSystemStatus("ERRO: Não foi possível normalizar IDs no servidor", "error")
  }
}

// EXPORTAR AS NOVAS FUNÇÕES DO CONTADOR
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
  resetDisplayLogic,
  incrementGeralCount,
  decrementGeralCount,
  getGeralCount,
  createSingleBaseProject,
}