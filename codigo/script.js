// ============================================
// CONFIGURAÇÃO DA API
// ============================================

const API_CONFIG = {
  projects: "http://localhost:3004",
  data: "http://localhost:3001",
}

// ============================================
// CONSTANTES DE CÁLCULO
// ============================================

const CALCULATION_CONSTANTS = {
  FLOW_COEFFICIENT: 0.827,
  SECONDS_PER_HOUR: 3600,
  FLOW_DIVISOR: 3.6,
  SAFETY_FACTOR: 1.25,
  PRESSURE_EXPONENT: 0.5,
}

// ============================================
// CONSTANTES DE UI
// ============================================

const UI_CONSTANTS = {
  MINIMIZED_SYMBOL: "+",
  EXPANDED_SYMBOL: "−",
  SUCCESS_MESSAGE_DURATION: 5000,
  INITIAL_PROJECT_ID: 1001,
  COLLAPSED_CLASS: "collapsed",
}

// ============================================
// GERENCIAMENTO DE ESTADO
// ============================================

let systemConstants = null
let projectCounter = 0

const SESSION_STORAGE_KEY = "firstProjectIdOfSession"
const REMOVED_PROJECTS_KEY = "removedProjectsFromScreen"
const NORMALIZATION_DONE_KEY = "idsNormalizedOnServer"

// ============================================
// INICIALIZAÇÃO
// ============================================

window.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Inicializando sistema...")

  await normalizeAllProjectsOnServer()
  await loadSystemConstants()
  await loadProjectsFromServer()
  await initializeProjectCounter()

  console.log("[v0] Sistema inicializado - projetos carregados do servidor")
})

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

async function loadSystemConstants() {
  try {
    console.log("[v0] Carregando constantes do sistema...")
    const response = await fetch(`${API_CONFIG.data}/constants`)

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    systemConstants = await response.json()
    console.log("[v0] Constantes carregadas:", systemConstants)
    showSystemStatus("Constantes do sistema carregadas com sucesso", "success")
  } catch (error) {
    console.error("[v0] Erro ao carregar constantes:", error)
    showSystemStatus("ERRO: Não foi possível carregar as constantes do sistema", "error")
    systemConstants = null
  }
}

function ensureStringId(id) {
  if (id === null || id === undefined || id === "") return null
  return String(id)
}

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

// ============================================
// GERENCIAMENTO DE IDs
// ============================================

async function getNextProjectId() {
  const projects = await fetchProjects()

  if (projects.length === 0) {
    return ensureStringId(UI_CONSTANTS.INITIAL_PROJECT_ID)
  }

  const maxId = Math.max(...projects.map((p) => Number(p.id) || 0))
  const nextId = maxId >= UI_CONSTANTS.INITIAL_PROJECT_ID ? maxId + 1 : UI_CONSTANTS.INITIAL_PROJECT_ID
  return ensureStringId(nextId)
}

function getNextProjectNumber() {
  projectCounter++
  return projectCounter
}

async function initializeProjectCounter() {
  const projects = document.querySelectorAll(".project-block")

  if (projects.length === 0) {
    projectCounter = 0
    return
  }

  const projectNumbers = Array.from(projects)
    .map((project) => {
      const match = project.dataset.projectName.match(/Projeto(\d+)/)
      return match ? Number.parseInt(match[1]) : 0
    })
    .filter((num) => num > 0)

  projectCounter = projectNumbers.length > 0 ? Math.max(...projectNumbers) : 0
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

// ============================================
// OPERAÇÕES DE PROJETO (CRUD)
// ============================================

/**
 * SALVA um NOVO projeto no servidor (CREATE)
 */
async function salvarProjeto(projectData) {
  try {
    if (!projectData.id) {
      projectData.id = await getNextProjectId() // já retorna string
    }

    projectData = normalizeProjectIds(projectData)

    console.log("[v0] SALVANDO novo projeto:", projectData)
    const response = await fetch(`${API_CONFIG.projects}/projetos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData), // IDs já são strings
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

/**
 * ATUALIZA um projeto EXISTENTE no servidor (UPDATE)
 */
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
      body: JSON.stringify(projectData), // IDs como string
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

/**
 * Função principal que decide entre SALVAR ou ATUALIZAR
 */
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
    collapseProjectAfterSave(projectName, projectBlock)
    console.log(`[v0] ===== PROJETO ${projectName} SALVO COM SUCESSO (ID: ${finalId}) =====`)
  } else {
    console.error(`[v0] ===== FALHA AO SALVAR PROJETO ${projectName} =====`)
  }
}

function buildProjectData(projectBlock, projectId) {
  const projectData = {
    nome: projectBlock.querySelector(".project-title").textContent.trim(),
    salas: [],
  }

  if (projectId !== null && projectId !== undefined) {
    projectData.id = ensureStringId(projectId)
  }

  const roomBlocks = projectBlock.querySelectorAll(".room-block")
  roomBlocks.forEach((roomBlock, index) => {
    const roomData = extractRoomData(roomBlock)
    roomData.id = ensureStringId(index + 1)
    projectData.salas.push(roomData)
  })

  return projectData
}

function extractRoomData(roomBlock) {
  const roomData = {
    nome: roomBlock.querySelector(".room-title").textContent.trim(),
    inputs: {},
  }

  const climaInputs = roomBlock.querySelectorAll(".clima-input")
  climaInputs.forEach((input) => {
    const field = input.dataset.field
    const value = input.value

    if (value === "" || value === null || value === undefined) {
      roomData.inputs[field] = input.type === "number" ? 0 : ""
      return
    }

    if (input.tagName === "SELECT" || input.type === "text") {
      roomData.inputs[field] = value
    } else if (input.type === "number") {
      roomData.inputs[field] = Number.parseFloat(value) || 0
    } else {
      roomData.inputs[field] = value
    }
  })

  const roomId = roomBlock.querySelector('[id^="room-content-"]')?.id.replace("room-content-", "")
  if (roomId) {
    const vazaoElement = document.getElementById(`vazao-ar-${roomId}`)
    if (vazaoElement) {
      const vazaoValue = vazaoElement.textContent.trim()
      roomData.inputs.vazaoArExterno = Number.parseInt(vazaoValue) || 0
    }
  }

  return roomData
}

function collapseProjectAfterSave(projectName, projectBlock) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const minimizer = projectBlock.querySelector(".project-header .minimizer")

  if (projectContent && !projectContent.classList.contains(UI_CONSTANTS.COLLAPSED_CLASS)) {
    collapseElement(projectContent, minimizer)
  }
}

// ============================================
// UI - MENSAGENS DE STATUS
// ============================================

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

// ============================================
// UI - TOGGLE (MINIMIZAR/EXPANDIR)
// ============================================

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

// ============================================
// UI - CRIAÇÃO DE PROJETOS
// ============================================

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
  const projectNumber = getNextProjectNumber()
  const projectName = `Projeto${projectNumber}`

  createEmptyProject(projectName, null)
  console.log(`[v0] ${projectName} adicionado`)
}

function deleteProject(projectName) {
  const confirmMessage = "Tem certeza que deseja deletar este projeto? Os dados permanecerão no servidor."

  if (!confirm(confirmMessage)) return

  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  const projectId = projectBlock.dataset.projectId ? ensureStringId(projectBlock.dataset.projectId) : null

  projectBlock.remove()

  if (projectId) {
    addProjectToRemovedList(projectId)
  }

  console.log(`[v0] Projeto ${projectName} removido da interface`)
}

// ============================================
// CRIAÇÃO DE SALAS
// ============================================

function createEmptyRoom(projectName, roomName, roomId) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const roomHTML = buildRoomHTML(projectName, roomName, roomId)

  insertRoomIntoProject(projectContent, roomHTML)
  removeEmptyProjectMessage(projectContent)

  console.log(`[v0] Sala ${roomName} criada`)
}

function buildRoomHTML(projectName, roomName, roomId) {
  return `
    <div class="room-block" data-room-id="${roomId || ""}" data-room-name="${roomName}">
      ${buildRoomHeader(projectName, roomName)}
      <div class="room-content collapsed" id="room-content-${projectName}-${roomName}">
        ${buildClimatizationSection(projectName, roomName)}
        ${buildMachinesSection(projectName, roomName)}
        ${buildConfigurationSection(projectName, roomName)}
        ${buildRoomActions(projectName, roomName)}
      </div>
    </div>
  `
}

function buildRoomHeader(projectName, roomName) {
  return `
    <div class="room-header">
      <button class="minimizer" onclick="toggleRoom('${projectName}-${roomName}')">+</button>
      <h3 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h3>
      <button class="btn btn-delete-small" onclick="deleteRoom('${projectName}', '${roomName}')">Deletar</button>
    </div>
  `
}

function buildClimatizationSection(projectName, roomName) {
  const roomId = `${projectName}-${roomName}`
  return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}-clima')">+</button>
        <h4 class="section-title">Climatização</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}-clima">
        <div class="subsection-block">
          <div class="subsection-header">
            <button class="minimizer" onclick="toggleSubsection('${roomId}-clima-table')">+</button>
            <h5 class="subsection-title">Tabela de Inputs</h5>
          </div>
          <div class="subsection-content collapsed" id="subsection-content-${roomId}-clima-table">
            ${buildClimatizationTable(roomId)}
          </div>
        </div>
        ${buildThermalGainsSection(roomId)}
      </div>
    </div>
  `
}

function buildClimatizationTable(roomId) {
  return `
    <div class="clima-table">
      ${buildClimaRow(
        [
          { label: "Ambiente:", field: "ambiente", type: "text", placeholder: "Ex: Sala de Servidores" },
          { label: "Back-up:", field: "backup", type: "select", options: ["", "n", "n+1", "n+2"] },
        ],
        roomId,
      )}
      ${buildClimaRow(
        [
          { label: "Área (m²):", field: "area", type: "number", placeholder: "Ex: 50" },
          {
            label: "Tipo de Construção:",
            field: "tipoConstrucao",
            type: "select",
            options: ["", "alvenaria", "eletrocentro"],
          },
        ],
        roomId,
      )}
      ${buildClimaRow(
        [
          { label: "Parede Oeste (m):", field: "paredeOeste", type: "number", placeholder: "Ex: 5.5" },
          { label: "Parede Leste (m):", field: "paredeLeste", type: "number", placeholder: "Ex: 5.5" },
        ],
        roomId,
      )}
      ${buildClimaRow(
        [
          { label: "Parede Norte (m):", field: "paredeNorte", type: "number", placeholder: "Ex: 8.0" },
          { label: "Parede Sul (m):", field: "paredeSul", type: "number", placeholder: "Ex: 8.0" },
        ],
        roomId,
      )}
      ${buildClimaRow(
        [{ label: "Pé Direito (m):", field: "peDireito", type: "number", placeholder: "Ex: 3.0" }, null],
        roomId,
      )}
      ${buildClimaRow(
        [
          {
            label: "Divisória Área Não Climatizada 1 (m²):",
            field: "divisoriaNaoClima1",
            type: "number",
            placeholder: "Ex: 10",
          },
          {
            label: "Divisória Área Não Climatizada 2 (m²):",
            field: "divisoriaNaoClima2",
            type: "number",
            placeholder: "Ex: 10",
          },
        ],
        roomId,
      )}
      ${buildClimaRow(
        [
          {
            label: "Divisória Área Climatizada 1 (m²):",
            field: "divisoriaClima1",
            type: "number",
            placeholder: "Ex: 15",
          },
          {
            label: "Divisória Área Climatizada 2 (m²):",
            field: "divisoriaClima2",
            type: "number",
            placeholder: "Ex: 15",
          },
        ],
        roomId,
      )}
      ${buildClimaRow(
        [
          { label: "Dissipação (W):", field: "dissipacao", type: "number", placeholder: "Ex: 5000" },
          { label: "N° Pessoas:", field: "numPessoas", type: "number", placeholder: "Ex: 10" },
        ],
        roomId,
      )}
      ${buildClimaRow(
        [
          { label: "N° Portas Duplas:", field: "numPortasDuplas", type: "number", placeholder: "Ex: 2" },
          { label: "N° Portas Simples:", field: "numPortasSimples", type: "number", placeholder: "Ex: 3" },
        ],
        roomId,
      )}
      ${buildClimaRow(
        [
          { label: "Pressurização (Pa):", field: "pressurizacao", type: "number", placeholder: "Ex: 50" },
          { label: "Setpoint (°C):", field: "setpoint", type: "number", placeholder: "Ex: 22" },
        ],
        roomId,
      )}
      ${buildResultRow(roomId)}
      ${buildClimaRow(
        [
          {
            label: "Combate a Incêndio:",
            field: "combateIncendio",
            type: "select",
            options: ["", "manual", "fm200", "novec", "firepro", "ni"],
          },
          null,
        ],
        roomId,
      )}
    </div>
  `
}

function buildClimaRow(fields, roomId) {
  const cells = fields
    .map((field) => {
      if (!field) return '<div class="clima-cell clima-cell-empty"></div>'
      return buildClimaCell(field, roomId)
    })
    .join("")

  return `<div class="clima-row">${cells}</div>`
}

function buildClimaCell(field, roomId) {
  const input = field.type === "select" ? buildSelectInput(field, roomId) : buildTextInput(field, roomId)

  return `
    <div class="clima-cell">
      <label>${field.label}</label>
      ${input}
    </div>
  `
}

function buildSelectInput(field, roomId) {
  const options = field.options
    .map((opt) => `<option value="${opt}">${opt === "" ? "Selecione" : opt}</option>`)
    .join("")

  return `
    <select class="form-input clima-input" data-field="${field.field}" onchange="calculateVazaoArAndThermalGains('${roomId}')">
      ${options}
    </select>
  `
}

function buildTextInput(field, roomId) {
  const step = field.type === "number" ? 'step="0.01"' : ""
  const min = field.field.includes("num") ? 'min="0"' : ""

  return `
    <input
      type="${field.type}"
      class="form-input clima-input"
      data-field="${field.field}"
      placeholder="${field.placeholder}"
      ${step}
      ${min}
      onchange="calculateVazaoArAndThermalGains('${roomId}')"
    >
  `
}

function buildResultRow(roomId) {
  return `
    <div class="clima-row">
      <div class="clima-cell clima-cell-result">
        <label>Vazão de Ar Externo (l/s):</label>
        <div class="result-value-inline" id="vazao-ar-${roomId}">0</div>
      </div>
      <div class="clima-cell clima-cell-empty"></div>
    </div>
  `
}

function buildMachinesSection(projectName, roomName) {
  const roomId = `${projectName}-${roomName}`
  return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}-maquinas')">+</button>
        <h4 class="section-title">Máquinas</h4>
        <button class="btn btn-add-small" onclick="addMachine('${roomId}')">+ Adicionar Máquina</button>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}-maquinas">
        <div class="machines-container" id="machines-${roomId}">
          <p class="empty-message">Nenhuma máquina adicionada ainda.</p>
        </div>
      </div>
    </div>
  `
}

function buildConfigurationSection(projectName, roomName) {
  const roomId = `${projectName}-${roomName}`
  return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}-config')">+</button>
        <h4 class="section-title">Configuração Geral</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}-config">
        <div class="form-grid">
          <div class="form-group">
            <label>Responsável:</label>
            <input type="text" class="form-input" placeholder="Nome do responsável">
          </div>
          <div class="form-group">
            <label>Data de Instalação:</label>
            <input type="date" class="form-input">
          </div>
          <div class="form-group">
            <label>Observações:</label>
            <textarea class="form-input" rows="3" placeholder="Observações gerais"></textarea>
          </div>
        </div>
      </div>
    </div>
  `
}

function buildRoomActions(projectName, roomName) {
  return ""
}

function insertRoomIntoProject(projectContent, roomHTML) {
  const addRoomSection = projectContent.querySelector(".add-room-section")
  addRoomSection.insertAdjacentHTML("beforebegin", roomHTML)
}

function removeEmptyProjectMessage(projectContent) {
  const emptyMessage = projectContent.querySelector(".empty-message")
  if (emptyMessage) {
    emptyMessage.remove()
  }
}

function addNewRoom(projectName) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const roomCount = projectContent.querySelectorAll(".room-block").length + 1
  const roomName = `Sala${roomCount}`

  createEmptyRoom(projectName, roomName, null)
  console.log(`[v0] ${roomName} adicionada ao ${projectName}`)
}

function deleteRoom(projectName, roomName) {
  const confirmMessage = "Tem certeza que deseja deletar esta sala? Os dados permanecerão no servidor."

  if (!confirm(confirmMessage)) return

  const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
  const projectContent = roomBlock.closest(".project-content")

  roomBlock.remove()
  showEmptyProjectMessageIfNeeded(projectContent)

  console.log(`[v0] Sala ${roomName} removida da interface`)
}

function showEmptyProjectMessageIfNeeded(projectContent) {
  const remainingRooms = projectContent.querySelectorAll(".room-block")

  if (remainingRooms.length === 0) {
    const addRoomSection = projectContent.querySelector(".add-room-section")
    addRoomSection.insertAdjacentHTML("beforebegin", '<p class="empty-message">Adicione salas a este projeto...</p>')
  }
}

// ============================================
// GERENCIAMENTO DE MÁQUINAS
// ============================================

function addMachine(roomId) {
  const machinesContainer = document.getElementById(`machines-${roomId}`)
  const machineCount = machinesContainer.querySelectorAll(".machine-item").length + 1

  removeEmptyMachinesMessage(machinesContainer)

  const machineHTML = buildMachineHTML(machineCount)
  machinesContainer.insertAdjacentHTML("beforeend", machineHTML)

  console.log(`[v0] Máquina ${machineCount} adicionada`)
}

function removeEmptyMachinesMessage(container) {
  const emptyMessage = container.querySelector(".empty-message")
  if (emptyMessage) {
    emptyMessage.remove()
  }
}

function buildMachineHTML(machineCount) {
  return `
    <div class="machine-item">
      <div class="machine-header">
        <span class="machine-title">Máquina ${machineCount}</span>
        <button class="btn btn-delete-small" onclick="deleteMachine(this)">×</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nome:</label>
          <input type="text" class="form-input" placeholder="Ex: Servidor Principal">
        </div>
        <div class="form-group">
          <label>Modelo:</label>
          <input type="text" class="form-input" placeholder="Ex: Dell PowerEdge">
        </div>
        <div class="form-group">
          <label>Potência (W):</label>
          <input type="number" class="form-input" placeholder="Ex: 500">
        </div>
        <div class="form-group">
          <label>Status:</label>
          <select class="form-input">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>
      </div>
    </div>
  `
}

function deleteMachine(button) {
  if (!confirm("Deseja remover esta máquina?")) return

  const machineItem = button.closest(".machine-item")
  const machinesContainer = machineItem.closest(".machines-container")

  machineItem.remove()
  showEmptyMachinesMessageIfNeeded(machinesContainer)

  console.log("[v0] Máquina removida")
}

function showEmptyMachinesMessageIfNeeded(container) {
  if (container.querySelectorAll(".machine-item").length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhuma máquina adicionada ainda.</p>'
  }
}

// ============================================
// OPERAÇÕES DE SALA
// ============================================

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

// ============================================
// EDIÇÃO INLINE
// ============================================

function makeEditable(element, type) {
  if (element.classList.contains("editing")) return

  const originalText = element.textContent.trim()
  element.dataset.originalText = originalText

  enableEditing(element)
  selectElementContent(element)
  attachEditingEventListeners(element, type)
}

function enableEditing(element) {
  element.contentEditable = true
  element.classList.add("editing")
}

function selectElementContent(element) {
  const range = document.createRange()
  const selection = window.getSelection()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
  element.focus()
}

function attachEditingEventListeners(element, type) {
  element.addEventListener("keydown", function handleKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      saveInlineEdit(element, type)
      element.removeEventListener("keydown", handleKeydown)
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelInlineEdit(element)
      element.removeEventListener("keydown", handleKeydown)
    }
  })

  element.addEventListener(
    "blur",
    function handleBlur() {
      saveInlineEdit(element, type)
      element.removeEventListener("blur", handleBlur)
    },
    { once: true },
  )
}

function saveInlineEdit(element, type) {
  const newText = element.textContent.trim()
  const originalText = element.dataset.originalText

  disableEditing(element)

  if (!validateEditedText(newText, originalText, element)) return

  if (newText !== originalText) {
    element.textContent = newText
    const entityType = type === "project" ? "Projeto" : "Sala"
    console.log(`[v0] ${entityType} renomeado para: ${newText}`)
  }

  delete element.dataset.originalText
}

function disableEditing(element) {
  element.contentEditable = false
  element.classList.remove("editing")
}

function validateEditedText(newText, originalText, element) {
  if (newText === "") {
    element.textContent = originalText
    alert("O nome não pode estar vazio.")
    return false
  }
  return true
}

function cancelInlineEdit(element) {
  const originalText = element.dataset.originalText

  disableEditing(element)
  element.textContent = originalText
  delete element.dataset.originalText

  console.log("[v0] Edição cancelada")
}

// ============================================
// CÁLCULOS
// ============================================

async function calculateVazaoAr(roomId) {
  await waitForSystemConstants()

  if (!validateSystemConstants()) return 0 // Return 0 if validation fails

  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (!roomContent) return 0 // Return 0 if room not found

  const climaSection = roomContent.querySelector('[id*="-clima"]')
  if (!climaSection) return 0 // Return 0 if section not found

  const inputData = collectClimatizationInputs(climaSection, roomId)
  const flowRate = computeAirFlowRate(inputData)

  updateFlowRateDisplay(roomId, flowRate)

  return flowRate
}

async function waitForSystemConstants() {
  while (!systemConstants) {
    console.log("[v0] Aguardando constantes do sistema...")
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

function validateSystemConstants() {
  if (!systemConstants.VARIAVEL_PD || !systemConstants.VARIAVEL_PS) {
    console.error("[v0] Constantes do sistema não carregadas")
    alert("ERRO: As constantes do sistema não foram carregadas corretamente.")
    return false
  }
  return true
}

function collectClimatizationInputs(climaSection, roomId) {
  const inputs = climaSection.querySelectorAll(".clima-input")
  const data = {}

  inputs.forEach((input) => {
    const field = input.dataset.field
    const value = input.value
    data[field] = value !== "" ? Number.parseFloat(value) || value : 0
  })

  return data
}

function computeAirFlowRate(inputData) {
  const { numPortasDuplas = 0, numPortasSimples = 0, pressurizacao = 0 } = inputData

  console.log("[v0] ===== CÁLCULO DE VAZÃO =====")
  console.log("[v0] Portas Duplas:", numPortasDuplas)
  console.log("[v0] Portas Simples:", numPortasSimples)
  console.log("[v0] Pressurização (Pa):", pressurizacao)

  const doubleDoorFlow = calculateDoorFlow(numPortasDuplas, systemConstants.VARIAVEL_PD, pressurizacao)

  const singleDoorFlow = calculateDoorFlow(numPortasSimples, systemConstants.VARIAVEL_PS, pressurizacao)

  console.log("[v0] Fluxo Portas Duplas:", doubleDoorFlow)
  console.log("[v0] Fluxo Portas Simples:", singleDoorFlow)

  const totalFlow = doubleDoorFlow + singleDoorFlow
  const adjustedFlow = totalFlow / CALCULATION_CONSTANTS.FLOW_DIVISOR
  const finalFlow = adjustedFlow * CALCULATION_CONSTANTS.SAFETY_FACTOR
  const roundedFlow = Math.ceil(finalFlow)

  console.log("[v0] Fluxo Total:", totalFlow)
  console.log("[v0] Fluxo Ajustado:", adjustedFlow)
  console.log("[v0] Fluxo Final:", finalFlow)
  console.log("[v0] Vazão Arredondada:", roundedFlow)
  console.log("[v0] ===== FIM DO CÁLCULO =====")

  return roundedFlow
}

function calculateDoorFlow(doorCount, doorVariable, pressure) {
  return (
    CALCULATION_CONSTANTS.FLOW_COEFFICIENT *
    doorCount *
    doorVariable *
    Math.pow(pressure, CALCULATION_CONSTANTS.PRESSURE_EXPONENT) *
    CALCULATION_CONSTANTS.SECONDS_PER_HOUR
  )
}

function updateFlowRateDisplay(roomId, flowRate) {
  const resultElement = document.getElementById(`vazao-ar-${roomId}`)
  if (resultElement) {
    resultElement.textContent = flowRate
  }
}

// ============================================
// EXPORTAÇÃO (PLACEHOLDERS)
// ============================================

function downloadPDF(projectName) {
  alert(`Funcionalidade de exportação PDF será implementada para ${projectName}`)
}

function downloadWord(projectName) {
  alert(`Funcionalidade de exportação Word será implementada para ${projectName}`)
}

// ============================================
// CARREGAMENTO E RENDERIZAÇÃO DE PROJETOS
// ============================================

async function loadProjectsFromServer() {
  console.log("[v0] Verificando projetos da sessão atual...")

  const firstProjectId = sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (!firstProjectId) {
    console.log("[v0] Nenhum projeto salvo nesta sessão - mantendo projeto base do HTML")
    return
  }

  console.log(`[v0] Carregando projetos a partir do ID ${firstProjectId}...`)

  const allProjects = await fetchProjects()

  if (allProjects.length === 0) {
    console.log("[v0] Nenhum projeto encontrado no servidor")
    return
  }

  const sessionProjects = allProjects.filter((project) => {
    const isFromSession = project.id >= Number.parseInt(firstProjectId)
    const isNotRemoved = !isProjectRemoved(project.id)
    return isFromSession && isNotRemoved
  })

  if (sessionProjects.length === 0) {
    console.log("[v0] Nenhum projeto da sessão atual encontrado (ou todos foram removidos)")
    return
  }

  console.log(`[v0] ${sessionProjects.length} projeto(s) da sessão atual encontrado(s)`)

  removeBaseProjectFromHTML()

  for (const projectData of sessionProjects) {
    renderProjectFromData(projectData)
  }

  console.log("[v0] Todos os projetos da sessão foram carregados e renderizados")
}

function removeBaseProjectFromHTML() {
  const projectsContainer = document.getElementById("projects-container")
  const existingProjects = projectsContainer.querySelectorAll(".project-block")

  existingProjects.forEach((project) => {
    project.remove()
  })

  console.log("[v0] Projetos base do HTML removidos")
}

function renderProjectFromData(projectData) {
  const projectName = projectData.nome
  const projectId = ensureStringId(projectData.id)

  console.log(`[v0] Renderizando projeto: ${projectName} (ID: ${projectId})`)

  createEmptyProject(projectName, projectId)

  if (projectData.salas && projectData.salas.length > 0) {
    const projectContent = document.getElementById(`project-content-${projectName}`)
    const emptyMessage = projectContent.querySelector(".empty-message")
    if (emptyMessage) {
      emptyMessage.remove()
    }

    projectData.salas.forEach((roomData) => {
      renderRoomFromData(projectName, roomData)
    })
  }

  if (projectId) {
    updateProjectButton(projectName, true)
  }

  const projectNumber = Number.parseInt(projectName.replace("Projeto", "")) || 0
  if (projectNumber > projectCounter) {
    projectCounter = projectNumber
  }

  console.log(`[v0] Projeto ${projectName} renderizado com sucesso`)
}

function renderRoomFromData(projectName, roomData) {
  const roomName = roomData.nome
  const roomId = ensureStringId(roomData.id)

  console.log(`[v0] Renderizando sala: ${roomName} no projeto ${projectName}`)

  createEmptyRoom(projectName, roomName, roomId)

  if (roomData.inputs) {
    populateRoomInputs(projectName, roomName, roomData.inputs)
  }

  console.log(`[v0] Sala ${roomName} renderizada com sucesso`)
}

function populateRoomInputs(projectName, roomName, inputsData) {
  const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
  if (!roomBlock) {
    console.error(`[v0] Sala ${roomName} não encontrada`)
    return
  }

  const roomId = `${projectName}-${roomName}`

  Object.entries(inputsData).forEach(([field, value]) => {
    if (field === "vazaoArExterno") {
      const vazaoElement = document.getElementById(`vazao-ar-${roomId}`)
      if (vazaoElement) {
        vazaoElement.textContent = value
      }
      return
    }

    const input = roomBlock.querySelector(`.clima-input[data-field="${field}"]`)
    if (input) {
      input.value = value
    }
  })

  console.log(`[v0] Inputs da sala ${roomName} preenchidos`)
}

// ============================================
// NORMALIZAÇÃO DE IDs NO SERVIDOR
// ============================================

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

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

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

// ==========================
// IMPLEMENTAÇÃO DAS FUNÇÕES PARA A MOSTRAGEM DO TOTAL DE W E TR
// ==========================

/**
 * Calcula todos os ganhos térmicos para uma sala
 */
async function calculateThermalGains(roomId, vazaoArExterno = 0) {
  // Accept vazaoArExterno as parameter
  await waitForSystemConstants()

  if (!validateSystemConstants()) return

  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (!roomContent) return

  const climaSection = roomContent.querySelector('[id*="-clima"]')
  if (!climaSection) return

  const inputData = collectClimatizationInputs(climaSection, roomId)

  inputData.vazaoArExterno = vazaoArExterno

  console.log("[v0] ===== CÁLCULO DE GANHOS TÉRMICOS =====")
  console.log("[v0] Dados de entrada:", inputData)
  console.log("[v0] Vazão de ar externo:", vazaoArExterno)

  // Calcular U-Values baseado no tipo de construção
  const uValues = calculateUValues(inputData.tipoConstrucao)

  // Calcular variáveis auxiliares
  const auxVars = calculateAuxiliaryVariables(inputData)

  // Calcular ganhos individuais
  const gains = {
    teto: calculateCeilingGain(inputData, uValues, systemConstants),
    paredeOeste: calculateWallGain(
      inputData.paredeOeste,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_parede_Oes,
    ),
    paredeLeste: calculateWallGain(
      inputData.paredeLeste,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_parede_Les,
    ),
    paredeNorte: calculateWallGain(
      inputData.paredeNorte,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_parede_Nor,
    ),
    paredeSul: calculateWallGain(
      inputData.paredeSul,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_parede_Sul,
    ),
    divisoriaNaoClima1: calculatePartitionGain(
      inputData.divisoriaNaoClima1,
      uValues.parede,
      systemConstants.deltaT_divi_N_clim1,
    ),
    divisoriaNaoClima2: calculatePartitionGain(
      inputData.divisoriaNaoClima2,
      uValues.parede,
      systemConstants.deltaT_divi_N_clim2,
    ),
    divisoriaClima1: calculatePartitionGain(
      inputData.divisoriaClima1,
      uValues.parede,
      systemConstants.deltaT_divi_clim1,
    ),
    divisoriaClima2: calculatePartitionGain(
      inputData.divisoriaClima2,
      uValues.parede,
      systemConstants.deltaT_divi_clim2,
    ),
    piso: calculateFloorGain(inputData.area, systemConstants),
    iluminacao: calculateLightingGain(inputData.area, systemConstants),
    dissipacao: calculateDissipationGain(inputData.dissipacao, systemConstants),
    pessoas: calculatePeopleGain(inputData.numPessoas, systemConstants),
    arSensivel: calculateExternalAirSensibleGain(inputData.vazaoArExterno || 0, auxVars, systemConstants),
    arLatente: calculateExternalAirLatentGain(inputData.vazaoArExterno || 0, systemConstants),
  }

  // Calcular totais
  const totals = calculateTotals(gains)

  console.log("[v0] Ganhos calculados:", gains)
  console.log("[v0] Totais:", totals)
  console.log("[v0] ===== FIM DO CÁLCULO DE GANHOS TÉRMICOS =====")

  updateThermalGainsDisplay(roomId, gains, totals, uValues, inputData)
}

/**
 * Calcula U-Values baseado no tipo de construção
 */
function calculateUValues(tipoConstrucao) {
  const U_VALUE_ALVENARIA_TETO = 3.961
  const U_VALUE_ALVENARIA_PAREDE = 2.546
  const U_VALUE_LA_ROCHA_TETO = 1.145
  const U_VALUE_LA_ROCHA_PAREDE = 1.12

  let uValueParede, uValueTeto

  if (tipoConstrucao === "eletrocentro") {
    uValueParede = U_VALUE_LA_ROCHA_PAREDE
    uValueTeto = U_VALUE_LA_ROCHA_TETO
  } else if (tipoConstrucao === "alvenaria") {
    uValueParede = U_VALUE_ALVENARIA_PAREDE
    uValueTeto = U_VALUE_ALVENARIA_TETO
  } else {
    console.error("[v0] Tipo de construção inválido:", tipoConstrucao)
    uValueParede = 0
    uValueTeto = 0
  }

  return {
    parede: uValueParede,
    teto: uValueTeto,
    piso: systemConstants.AUX_U_Value_Piso || 2.7,
  }
}

/**
 * Calcula variáveis auxiliares para ar externo
 */
function calculateAuxiliaryVariables(inputData) {
  const vazaoArExterno = inputData.vazaoArExterno || 0
  const densiAr = systemConstants.Densi_ar || 1.17

  // AUX_m_ArExterno = B17 * 3.6 * Densi_ar * 1000
  const m_ArExterno = vazaoArExterno * 3.6 * densiAr * 1000

  return {
    m_ArExterno: m_ArExterno,
  }
}

/**
 * Ganho de teto
 */
function calculateCeilingGain(inputData, uValues, constants) {
  const area = inputData.area || 0
  const uValue = uValues.teto
  const deltaT = constants.deltaT_teto || 20

  return area * uValue * deltaT
}

/**
 * Ganho de parede
 */
function calculateWallGain(comprimento, peDireito, uValue, deltaT) {
  const area = (comprimento || 0) * (peDireito || 0)
  return area * uValue * deltaT
}

/**
 * Ganho por divisória
 */
function calculatePartitionGain(area, uValue, deltaT) {
  return (area || 0) * uValue * deltaT
}

/**
 * Ganho por piso
 */
function calculateFloorGain(area, constants) {
  const uValue = constants.AUX_U_Value_Piso || 2.7
  const deltaT = constants.deltaT_piso || 7.5

  return (area || 0) * uValue * deltaT
}

/**
 * Ganho por iluminação
 */
function calculateLightingGain(area, constants) {
  const fatorIluminacao = constants.AUX_Fator_Iluminacao || 7
  const fsIluminacao = constants.AUX_Fs_Iluminacao || 1

  return (area || 0) * fatorIluminacao * fsIluminacao
}

/**
 * Dissipação térmica interna
 */
function calculateDissipationGain(dissipacao, constants) {
  const fatorConversao = constants.AUX_Fator_Conver_Painel || 1
  const fsPaineis = constants.AUX_Fs_Paineis || 100

  return (fatorConversao * (dissipacao || 0) * fsPaineis) / 100
}

/**
 * Ganho por ocupação de pessoas
 */
function calculatePeopleGain(numPessoas, constants) {
  const csp = constants.AUX_OCp_Csp || 75 // Calor sensível por pessoa
  const clp = constants.AUX_OCp_Clp || 55 // Calor latente por pessoa
  const fsPessoas = constants.AUX_Fs_OCp_Pessoas || 100

  const pessoas = numPessoas || 0

  const ganhoSensivel = (csp * pessoas * fsPessoas) / 100
  const ganhoLatente = (clp * pessoas * fsPessoas) / 100

  return ganhoSensivel + ganhoLatente
}

/**
 * Ganho sensível de ar externo
 */
function calculateExternalAirSensibleGain(vazaoArExterno, auxVars, constants) {
  const c_ArExterno = constants.AUX_c_ArExterno || 0.24
  const deltaT_ArExterno = constants.AUX_deltaT_ArExterno || 10

  // Calc_Gsens_ArE = AUX_m_ArExterno * AUX_c_ArExterno * AUX_deltaT_ArExterno
  const calc_Gsens_ArE = auxVars.m_ArExterno * c_ArExterno * deltaT_ArExterno

  // ganho_ar_sensivel = Calc_Gsens_ArE / 1000 * 1.16
  return (calc_Gsens_ArE / 1000) * 1.16
}

/**
 * Ganho latente de ar externo
 */
function calculateExternalAirLatentGain(vazaoArExterno, constants) {
  const f_ArExterno = constants.AUX_f_ArExterno || 2.93
  const deltaUa_ArExterno = constants.AUX_deltaUa_ArExterno || 5.5

  // ganho_ar_latente = B17 * AUX_f_ArExterno * AUX_deltaUa_ArExterno
  return (vazaoArExterno || 0) * f_ArExterno * deltaUa_ArExterno
}

/**
 * Calcula totais
 */
function calculateTotals(gains) {
  // Total paredes externas
  const totalExterno = gains.teto + gains.paredeOeste + gains.paredeLeste + gains.paredeNorte + gains.paredeSul

  // Total divisórias
  const totalDivisoes =
    gains.divisoriaNaoClima1 + gains.divisoriaNaoClima2 + gains.divisoriaClima1 + gains.divisoriaClima2

  // Total piso
  const totalPiso = gains.piso

  // Total iluminação
  const totalIluminacao = gains.iluminacao

  // Total equipamentos (dissipação)
  const totalEquipamentos = gains.dissipacao

  // Total pessoas
  const totalPessoas = gains.pessoas

  // Total ar externo (sensível + latente)
  const totalArExterno = gains.arSensivel + gains.arLatente

  // Total geral em W
  const totalGeralW =
    totalExterno + totalDivisoes + totalPiso + totalIluminacao + totalEquipamentos + totalPessoas + totalArExterno

  // Total geral em TR (1 TR = 3517 W)
  const totalGeralTR = totalGeralW / 3517

  return {
    externo: Math.ceil(totalExterno),
    divisoes: Math.ceil(totalDivisoes),
    piso: Math.ceil(totalPiso),
    iluminacao: Math.ceil(totalIluminacao),
    equipamentos: Math.ceil(totalEquipamentos),
    pessoas: Math.ceil(totalPessoas),
    arExterno: Math.ceil(totalArExterno),
    geralW: Math.ceil(totalGeralW),
    geralTR: Math.ceil(totalGeralTR),
  }
}

/**
 * Atualiza o display dos ganhos térmicos
 */
function updateThermalGainsDisplay(roomId, gains, totals, uValues, inputData) {
  // Atualizar tabela de paredes e teto
  updateElementText(`ganho-teto-area-${roomId}`, (inputData.area || 0).toFixed(2))
  updateElementText(`ganho-teto-uvalue-${roomId}`, uValues.teto.toFixed(3))
  updateElementText(`ganho-teto-delta-${roomId}`, systemConstants.deltaT_teto || 20)
  updateElementText(`ganho-teto-valor-${roomId}`, Math.ceil(gains.teto))

  updateWallDisplay(
    roomId,
    "oeste",
    gains.paredeOeste,
    uValues.parede,
    systemConstants.deltaT_parede_Oes,
    inputData.paredeOeste,
    inputData.peDireito,
  )
  updateWallDisplay(
    roomId,
    "leste",
    gains.paredeLeste,
    uValues.parede,
    systemConstants.deltaT_parede_Les,
    inputData.paredeLeste,
    inputData.peDireito,
  )
  updateWallDisplay(
    roomId,
    "norte",
    gains.paredeNorte,
    uValues.parede,
    systemConstants.deltaT_parede_Nor,
    inputData.paredeNorte,
    inputData.peDireito,
  )
  updateWallDisplay(
    roomId,
    "sul",
    gains.paredeSul,
    uValues.parede,
    systemConstants.deltaT_parede_Sul,
    inputData.paredeSul,
    inputData.peDireito,
  )

  updateElementText(`total-externo-${roomId}`, totals.externo)

  // Atualizar tabela de divisórias
  updatePartitionDisplay(
    roomId,
    "nc1",
    gains.divisoriaNaoClima1,
    uValues.parede,
    systemConstants.deltaT_divi_N_clim1,
    inputData.divisoriaNaoClima1,
  )
  updatePartitionDisplay(
    roomId,
    "nc2",
    gains.divisoriaNaoClima2,
    uValues.parede,
    systemConstants.deltaT_divi_N_clim2,
    inputData.divisoriaNaoClima2,
  )
  updatePartitionDisplay(
    roomId,
    "c1",
    gains.divisoriaClima1,
    uValues.parede,
    systemConstants.deltaT_divi_clim1,
    inputData.divisoriaClima1,
  )
  updatePartitionDisplay(
    roomId,
    "c2",
    gains.divisoriaClima2,
    uValues.parede,
    systemConstants.deltaT_divi_clim2,
    inputData.divisoriaClima2,
  )

  updateElementText(`total-divisoes-${roomId}`, totals.divisoes)

  // Atualizar tabela de piso
  updateElementText(`ganho-piso-area-${roomId}`, (inputData.area || 0).toFixed(2))
  updateElementText(`ganho-piso-uvalue-${roomId}`, uValues.piso.toFixed(3))
  updateElementText(`ganho-piso-delta-${roomId}`, systemConstants.deltaT_piso || 7.5)
  updateElementText(`ganho-piso-valor-${roomId}`, Math.ceil(gains.piso))
  updateElementText(`total-piso-${roomId}`, totals.piso)

  // Atualizar tabela de iluminação
  updateElementText(`ganho-iluminacao-area-${roomId}`, (inputData.area || 0).toFixed(2))
  updateElementText(`ganho-iluminacao-fator-${roomId}`, systemConstants.AUX_Fator_Iluminacao || 7)
  updateElementText(`ganho-iluminacao-fs-${roomId}`, systemConstants.AUX_Fs_Iluminacao || 1)
  updateElementText(`ganho-iluminacao-valor-${roomId}`, Math.ceil(gains.iluminacao))
  updateElementText(`total-iluminacao-${roomId}`, totals.iluminacao)

  // Atualizar tabela de dissipação
  updateElementText(`ganho-dissipacao-fator-${roomId}`, systemConstants.AUX_Fator_Conver_Painel || 1)
  updateElementText(`ganho-dissipacao-pe-${roomId}`, inputData.dissipacao || 0)
  updateElementText(`ganho-dissipacao-fs-${roomId}`, systemConstants.AUX_Fs_Paineis || 100)
  updateElementText(`ganho-dissipacao-valor-${roomId}`, Math.ceil(gains.dissipacao))
  updateElementText(`total-equipamentos-${roomId}`, totals.equipamentos)

  // Atualizar tabela de pessoas
  updateElementText(`ganho-pessoas-csp-${roomId}`, systemConstants.AUX_OCp_Csp || 75)
  updateElementText(`ganho-pessoas-clp-${roomId}`, systemConstants.AUX_OCp_Clp || 55)
  updateElementText(`ganho-pessoas-o-${roomId}`, inputData.numPessoas || 0)
  updateElementText(`ganho-pessoas-fs-${roomId}`, systemConstants.AUX_Fs_OCp_Pessoas || 100)
  updateElementText(`ganho-pessoas-valor-${roomId}`, Math.ceil(gains.pessoas))
  updateElementText(`total-pessoas-${roomId}`, totals.pessoas)

  // Calcular m para ar sensível
  const vazaoArExterno = inputData.vazaoArExterno || 0
  const densiAr = systemConstants.Densi_ar || 1.17
  const m_ArExterno = vazaoArExterno * 3.6 * densiAr * 1000

  // Atualizar tabela de ar externo sensível
  updateElementText(`ganho-ar-sensivel-m-${roomId}`, m_ArExterno.toFixed(2))
  updateElementText(`ganho-ar-sensivel-c-${roomId}`, systemConstants.AUX_c_ArExterno || 0.24)
  updateElementText(`ganho-ar-sensivel-delta-${roomId}`, systemConstants.AUX_deltaT_ArExterno || 10)
  updateElementText(`ganho-ar-sensivel-valor-${roomId}`, Math.ceil(gains.arSensivel))
  updateElementText(`ganho-ar-sensivel-total-${roomId}`, Math.ceil(gains.arSensivel))

  // Atualizar tabela de ar externo latente
  updateElementText(`ganho-ar-latente-var-${roomId}`, vazaoArExterno)
  updateElementText(`ganho-ar-latente-f-${roomId}`, systemConstants.AUX_f_ArExterno || 2.93)
  updateElementText(`ganho-ar-latente-delta-${roomId}`, systemConstants.AUX_deltaUa_ArExterno || 5.5)
  updateElementText(`ganho-ar-latente-valor-${roomId}`, Math.ceil(gains.arLatente))
  updateElementText(`ganho-ar-latente-total-${roomId}`, Math.ceil(gains.arLatente))

  // Atualizar totais finais
  updateElementText(`total-geral-w-${roomId}`, totals.geralW)
  updateElementText(`total-geral-tr-${roomId}`, totals.geralTR)
}

/**
 * Atualiza display de parede
 */
function updateWallDisplay(roomId, direction, gain, uValue, deltaT, comprimento, peDireito) {
  const area = (comprimento || 0) * (peDireito || 0)
  updateElementText(`ganho-parede-${direction}-area-${roomId}`, area.toFixed(2))
  updateElementText(`ganho-parede-${direction}-uvalue-${roomId}`, uValue.toFixed(3))
  updateElementText(`ganho-parede-${direction}-delta-${roomId}`, deltaT)
  updateElementText(`ganho-parede-${direction}-valor-${roomId}`, Math.ceil(gain))
}

/**
 * Atualiza display de divisória
 */
function updatePartitionDisplay(roomId, type, gain, uValue, deltaT, area) {
  updateElementText(`ganho-divisoria-${type}-area-${roomId}`, (area || 0).toFixed(2))
  updateElementText(`ganho-divisoria-${type}-uvalue-${roomId}`, uValue.toFixed(3))
  updateElementText(`ganho-divisoria-${type}-delta-${roomId}`, deltaT)
  updateElementText(`ganho-divisoria-${type}-valor-${roomId}`, Math.ceil(gain))
}

/**
 * Atualiza texto de elemento
 */
function updateElementText(elementId, value) {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = value
  }
}

/**
 * Função principal que calcula vazão e ganhos térmicos
 */
async function calculateVazaoArAndThermalGains(roomId) {
  const flowRate = await calculateVazaoAr(roomId)
  await calculateThermalGains(roomId, flowRate)
}

function buildThermalGainsSection(roomId) {
  return `
    <div class="subsection-block">
      <div class="subsection-header">
        <button class="minimizer" onclick="toggleSubsection('${roomId}-ganhos')">+</button>
        <h5 class="subsection-title">Cálculo de Ganhos Térmicos</h5>
      </div>
      <div class="subsection-content collapsed" id="subsection-content-${roomId}-ganhos">
        <div class="thermal-summary">
          <div class="thermal-summary-item">
            <span class="thermal-summary-label">Total de Ganhos Térmicos:</span>
            <span class="thermal-summary-value" id="total-geral-w-${roomId}">0</span>
            <span class="thermal-summary-unit">W</span>
          </div>
          <div class="thermal-summary-item">
            <span class="thermal-summary-label">Total em TR:</span>
            <span class="thermal-summary-value" id="total-geral-tr-${roomId}">0</span>
            <span class="thermal-summary-unit">TR</span>
          </div>
        </div>

         Tabela de Paredes e Teto
        <div class="thermal-table-container">
          <h6 class="thermal-table-title">Ganhos por Paredes Externas e Teto</h6>
          <table class="thermal-table">
            <thead>
              <tr>
                <th>Elemento</th>
                <th>Área (m²)</th>
                <th>U-Value</th>
                <th>ΔT (°C)</th>
                <th>Ganho (W)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Teto</td>
                <td id="ganho-teto-area-${roomId}">0</td>
                <td id="ganho-teto-uvalue-${roomId}">0</td>
                <td id="ganho-teto-delta-${roomId}">0</td>
                <td id="ganho-teto-valor-${roomId}">0</td>
              </tr>
              <tr>
                <td>Parede Oeste</td>
                <td id="ganho-parede-oeste-area-${roomId}">0</td>
                <td id="ganho-parede-oeste-uvalue-${roomId}">0</td>
                <td id="ganho-parede-oeste-delta-${roomId}">0</td>
                <td id="ganho-parede-oeste-valor-${roomId}">0</td>
              </tr>
              <tr>
                <td>Parede Leste</td>
                <td id="ganho-parede-leste-area-${roomId}">0</td>
                <td id="ganho-parede-leste-uvalue-${roomId}">0</td>
                <td id="ganho-parede-leste-delta-${roomId}">0</td>
                <td id="ganho-parede-leste-valor-${roomId}">0</td>
              </tr>
              <tr>
                <td>Parede Norte</td>
                <td id="ganho-parede-norte-area-${roomId}">0</td>
                <td id="ganho-parede-norte-uvalue-${roomId}">0</td>
                <td id="ganho-parede-norte-delta-${roomId}">0</td>
                <td id="ganho-parede-norte-valor-${roomId}">0</td>
              </tr>
              <tr>
                <td>Parede Sul</td>
                <td id="ganho-parede-sul-area-${roomId}">0</td>
                <td id="ganho-parede-sul-uvalue-${roomId}">0</td>
                <td id="ganho-parede-sul-delta-${roomId}">0</td>
                <td id="ganho-parede-sul-valor-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Paredes Externas e Teto</td>
                <td id="total-externo-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

         Tabela de Divisórias
        <div class="thermal-table-container">
          <h6 class="thermal-table-title">Ganhos por Divisórias</h6>
          <table class="thermal-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Área (m²)</th>
                <th>U-Value</th>
                <th>ΔT (°C)</th>
                <th>Ganho (W)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Divisória Não Climatizada 1</td>
                <td id="ganho-divisoria-nc1-area-${roomId}">0</td>
                <td id="ganho-divisoria-nc1-uvalue-${roomId}">0</td>
                <td id="ganho-divisoria-nc1-delta-${roomId}">0</td>
                <td id="ganho-divisoria-nc1-valor-${roomId}">0</td>
              </tr>
              <tr>
                <td>Divisória Não Climatizada 2</td>
                <td id="ganho-divisoria-nc2-area-${roomId}">0</td>
                <td id="ganho-divisoria-nc2-uvalue-${roomId}">0</td>
                <td id="ganho-divisoria-nc2-delta-${roomId}">0</td>
                <td id="ganho-divisoria-nc2-valor-${roomId}">0</td>
              </tr>
              <tr>
                <td>Divisória Climatizada 1</td>
                <td id="ganho-divisoria-c1-area-${roomId}">0</td>
                <td id="ganho-divisoria-c1-uvalue-${roomId}">0</td>
                <td id="ganho-divisoria-c1-delta-${roomId}">0</td>
                <td id="ganho-divisoria-c1-valor-${roomId}">0</td>
              </tr>
              <tr>
                <td>Divisória Climatizada 2</td>
                <td id="ganho-divisoria-c2-area-${roomId}">0</td>
                <td id="ganho-divisoria-c2-uvalue-${roomId}">0</td>
                <td id="ganho-divisoria-c2-delta-${roomId}">0</td>
                <td id="ganho-divisoria-c2-valor-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Divisórias</td>
                <td id="total-divisoes-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

         Tabela de Piso
        <div class="thermal-table-container">
          <h6 class="thermal-table-title">Ganhos por Piso</h6>
          <table class="thermal-table">
            <thead>
              <tr>
                <th>Elemento</th>
                <th>Área (m²)</th>
                <th>U-Value</th>
                <th>ΔT (°C)</th>
                <th>Ganho (W)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Piso</td>
                <td id="ganho-piso-area-${roomId}">0</td>
                <td id="ganho-piso-uvalue-${roomId}">0</td>
                <td id="ganho-piso-delta-${roomId}">0</td>
                <td id="ganho-piso-valor-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Piso</td>
                <td id="total-piso-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

         Tabela de Iluminação
        <div class="thermal-table-container">
          <h6 class="thermal-table-title">Ganhos por Iluminação</h6>
          <table class="thermal-table">
            <thead>
              <tr>
                <th>Elemento</th>
                <th>Área (m²)</th>
                <th>Fator</th>
                <th>Fs</th>
                <th>Ganho (W)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Iluminação</td>
                <td id="ganho-iluminacao-area-${roomId}">0</td>
                <td id="ganho-iluminacao-fator-${roomId}">0</td>
                <td id="ganho-iluminacao-fs-${roomId}">0</td>
                <td id="ganho-iluminacao-valor-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Iluminação</td>
                <td id="total-iluminacao-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

         Tabela de Dissipação Térmica Interna
        <div class="thermal-table-container">
          <h6 class="thermal-table-title">Dissipação Térmica Interna</h6>
          <table class="thermal-table">
            <thead>
              <tr>
                <th>Elemento</th>
                <th>Fator Conversão</th>
                <th>Pe (W)</th>
                <th>Fs (%)</th>
                <th>Ganho (W)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Equipamentos</td>
                <td id="ganho-dissipacao-fator-${roomId}">0</td>
                <td id="ganho-dissipacao-pe-${roomId}">0</td>
                <td id="ganho-dissipacao-fs-${roomId}">0</td>
                <td id="ganho-dissipacao-valor-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Equipamentos</td>
                <td id="total-equipamentos-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

         Tabela de Ocupação de Pessoas
        <div class="thermal-table-container">
          <h6 class="thermal-table-title">Ganhos por Ocupação de Pessoas</h6>
          <table class="thermal-table">
            <thead>
              <tr>
                <th>Elemento</th>
                <th>Csp</th>
                <th>Clp</th>
                <th>O</th>
                <th>Fs (%)</th>
                <th>Ganho (W)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pessoas</td>
                <td id="ganho-pessoas-csp-${roomId}">0</td>
                <td id="ganho-pessoas-clp-${roomId}">0</td>
                <td id="ganho-pessoas-o-${roomId}">0</td>
                <td id="ganho-pessoas-fs-${roomId}">0</td>
                <td id="ganho-pessoas-valor-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="5">Total Pessoas</td>
                <td id="total-pessoas-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

         Tabela de Ar Externo Sensível
        <div class="thermal-table-container">
          <h6 class="thermal-table-title">Ganhos de Ar Externo - Sensível</h6>
          <table class="thermal-table">
            <thead>
              <tr>
                <th>Elemento</th>
                <th>m</th>
                <th>c</th>
                <th>ΔT (°C)</th>
                <th>Ganho (W)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ar Externo Sensível</td>
                <td id="ganho-ar-sensivel-m-${roomId}">0</td>
                <td id="ganho-ar-sensivel-c-${roomId}">0</td>
                <td id="ganho-ar-sensivel-delta-${roomId}">0</td>
                <td id="ganho-ar-sensivel-valor-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Ar Externo Sensível</td>
                <td id="ganho-ar-sensivel-total-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

         Tabela de Ar Externo Latente
        <div class="thermal-table-container">
          <h6 class="thermal-table-title">Ganhos de Ar Externo - Latente</h6>
          <table class="thermal-table">
            <thead>
              <tr>
                <th>Elemento</th>
                <th>Var</th>
                <th>f</th>
                <th>ΔUa</th>
                <th>Ganho (W)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ar Externo Latente</td>
                <td id="ganho-ar-latente-var-${roomId}">0</td>
                <td id="ganho-ar-latente-f-${roomId}">0</td>
                <td id="ganho-ar-latente-delta-${roomId}">0</td>
                <td id="ganho-ar-latente-valor-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Ar Externo Latente</td>
                <td id="ganho-ar-latente-total-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}
