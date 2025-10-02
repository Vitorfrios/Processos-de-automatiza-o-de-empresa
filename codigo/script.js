// ============================================
// CONFIGURAÇÃO DA API
// ============================================

const API_CONFIG = {
  projects: "http://localhost:3000",
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

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

/**
 * Carrega as constantes do sistema do servidor
 */
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

/**
 * Busca todos os projetos do servidor
 */
async function fetchProjects() {
  try {
    console.log("[v0] Buscando projetos...")
    const response = await fetch(`${API_CONFIG.projects}/projetos`)

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const projects = await response.json()
    console.log("[v0] Projetos carregados:", projects)
    return projects
  } catch (error) {
    console.error("[v0] Erro ao buscar projetos:", error)
    showSystemStatus("ERRO: Não foi possível carregar projetos", "error")
    return []
  }
}

// ============================================
// GERENCIAMENTO DE IDs
// ============================================

/**
 * Determina o próximo ID de projeto
 */
async function getNextProjectId() {
  const projects = await fetchProjects()

  if (projects.length === 0) {
    return UI_CONSTANTS.INITIAL_PROJECT_ID
  }

  const maxId = Math.max(...projects.map((p) => p.id || 0))
  return maxId >= UI_CONSTANTS.INITIAL_PROJECT_ID ? maxId + 1 : UI_CONSTANTS.INITIAL_PROJECT_ID
}

/**
 * Obtém o próximo número de projeto
 */
function getNextProjectNumber() {
  projectCounter++
  return projectCounter
}

/**
 * Inicializa o contador de projetos baseado nos existentes
 */
async function initializeProjectCounter() {
  const projects = await fetchProjects()

  if (projects.length === 0) {
    projectCounter = 0
    return
  }

  const projectNumbers = projects
    .map((project) => {
      const match = project.nome.match(/Projeto(\d+)/)
      return match ? Number.parseInt(match[1]) : 0
    })
    .filter((num) => num > 0)

  projectCounter = projectNumbers.length > 0 ? Math.max(...projectNumbers) : 0
}

// ============================================
// OPERAÇÕES DE PROJETO (CRUD)
// ============================================

/**
 * Cria um novo projeto no servidor
 */
async function createProject(projectData) {
  try {
    if (!projectData.id) {
      projectData.id = await getNextProjectId()
    }

    console.log("[v0] Criando projeto:", projectData)
    const response = await fetch(`${API_CONFIG.projects}/projetos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const createdProject = await response.json()
    console.log("[v0] Projeto criado:", createdProject)
    showSystemStatus("Projeto salvo com sucesso!", "success")
    return createdProject
  } catch (error) {
    console.error("[v0] Erro ao criar projeto:", error)
    showSystemStatus("ERRO: Não foi possível salvar o projeto", "error")
    return null
  }
}

/**
 * Atualiza um projeto existente no servidor
 */
async function updateProject(projectId, projectData) {
  try {
    console.log("[v0] Atualizando projeto:", projectId)
    const response = await fetch(`${API_CONFIG.projects}/projetos/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const updatedProject = await response.json()
    console.log("[v0] Projeto atualizado:", updatedProject)
    showSystemStatus("Projeto atualizado com sucesso!", "success")
    return updatedProject
  } catch (error) {
    console.error("[v0] Erro ao atualizar projeto:", error)
    showSystemStatus("ERRO: Não foi possível atualizar o projeto", "error")
    return null
  }
}

// ============================================
// UI - MENSAGENS DE STATUS
// ============================================

/**
 * Exibe mensagem de status do sistema
 */
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

/**
 * Alterna visibilidade de um elemento
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

/**
 * Cria um projeto vazio na interface
 */
function createEmptyProject(projectName, projectId) {
  const projectHTML = buildProjectHTML(projectName, projectId)
  insertProjectIntoDOM(projectHTML)
  console.log(`[v0] Projeto ${projectName} criado`)
}

function buildProjectHTML(projectName, projectId) {
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
        ${buildProjectActionsFooter(projectName)}
      </div>
    </div>
  `
}

function buildProjectActionsFooter(projectName) {
  return `
    <div class="project-actions-footer">
      <button class="btn btn-verify" onclick="verifyProjectData('${projectName}')">Verificar Dados</button>
      <button class="btn btn-save" onclick="saveProject('${projectName}')">Salvar Projeto</button>
      <button class="btn btn-download" onclick="downloadPDF('${projectName}')">Baixar PDF</button>
      <button class="btn btn-download" onclick="downloadWord('${projectName}')">Baixar Word</button>
    </div>
  `
}

function insertProjectIntoDOM(projectHTML) {
  const projectsContainer = document.getElementById("projects-container")
  projectsContainer.insertAdjacentHTML("beforeend", projectHTML)
}

/**
 * Adiciona um novo projeto à interface
 */
async function addNewProject() {
  const projectNumber = getNextProjectNumber()
  const projectName = `Projeto${projectNumber}`

  createEmptyProject(projectName, null)
  console.log(`[v0] ${projectName} adicionado`)
}

/**
 * Deleta um projeto da interface
 */
function deleteProject(projectName) {
  const confirmMessage = "Tem certeza que deseja deletar este projeto? Os dados permanecerão no servidor."

  if (!confirm(confirmMessage)) return

  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  projectBlock.remove()
  console.log(`[v0] Projeto ${projectName} removido da interface`)
}

// ============================================
// UI - CRIAÇÃO DE SALAS
// ============================================

/**
 * Cria uma sala vazia na interface
 */
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
    <select class="form-input clima-input" data-field="${field.field}" onchange="calculateVazaoAr('${roomId}')">
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
      onchange="calculateVazaoAr('${roomId}')"
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
  return `
    <div class="room-actions">
      <button class="btn btn-update" onclick="updateRoom('${projectName}', '${roomName}')">Atualizar Dados</button>
      <button class="btn btn-save" onclick="saveRoom('${projectName}', '${roomName}')">Salvar</button>
    </div>
  `
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

/**
 * Adiciona uma nova sala a um projeto
 */
function addNewRoom(projectName) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const roomCount = projectContent.querySelectorAll(".room-block").length + 1
  const roomName = `Sala${roomCount}`

  createEmptyRoom(projectName, roomName, null)
  console.log(`[v0] ${roomName} adicionada ao ${projectName}`)
}

/**
 * Deleta uma sala da interface
 */
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

/**
 * Adiciona uma nova máquina a uma sala
 */
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

/**
 * Deleta uma máquina
 */
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

/**
 * Atualiza os dados de uma sala (validação local)
 */
function updateRoom(projectName, roomName) {
  const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
  const inputs = roomBlock.querySelectorAll(".form-input")

  const hasEmptyRequiredFields = validateRoomInputs(inputs)

  if (hasEmptyRequiredFields) {
    alert("Por favor, preencha todos os campos obrigatórios.")
  } else {
    alert("Dados da sala atualizados localmente!")
    console.log(`[v0] Dados da sala ${roomName} atualizados`)
  }
}

function validateRoomInputs(inputs) {
  let hasEmptyFields = false

  inputs.forEach((input) => {
    const isEmpty = input.value.trim() === "" && input.hasAttribute("required")

    input.style.borderColor = isEmpty ? "#dc3545" : "#dee2e6"

    if (isEmpty) {
      hasEmptyFields = true
    }
  })

  return hasEmptyFields
}

/**
 * Salva os dados de uma sala
 */
async function saveRoom(projectName, roomName) {
  console.log(`[v0] Salvando sala ${roomName} do projeto ${projectName}`)
  await saveProject(projectName)
}

/**
 * Extrai dados de uma sala para JSON
 */
function extractRoomData(roomBlock) {
  return {
    nome: extractRoomName(roomBlock),
    climatizacao: extractClimatizationData(roomBlock),
    maquinas: extractMachinesData(roomBlock),
    configuracaoGeral: extractConfigurationData(roomBlock),
  }
}

function extractRoomName(roomBlock) {
  return roomBlock.querySelector(".room-title").textContent.trim()
}

function extractClimatizationData(roomBlock) {
  const climatizationData = {}
  const climaInputs = roomBlock.querySelectorAll(".clima-input")

  climaInputs.forEach((input) => {
    const field = input.dataset.field
    if (field) {
      climatizationData[field] = input.value
    }
  })

  return climatizationData
}

function extractMachinesData(roomBlock) {
  const machinesData = []
  const machines = roomBlock.querySelectorAll(".machine-item")

  machines.forEach((machine) => {
    const machineData = {}
    const inputs = machine.querySelectorAll(".form-input")

    inputs.forEach((input) => {
      const label = input.closest(".form-group")?.querySelector("label")?.textContent.replace(":", "")
      if (label) {
        machineData[label] = input.value
      }
    })

    machinesData.push(machineData)
  })

  return machinesData
}

function extractConfigurationData(roomBlock) {
  const configData = {}
  const configSection = roomBlock.querySelector('[id*="-config"]')

  if (!configSection) return configData

  const responsavelInput = configSection.querySelector('input[placeholder*="responsável"]')
  if (responsavelInput) {
    configData.responsavel = responsavelInput.value
  }

  const dataInput = configSection.querySelector('input[type="date"]')
  if (dataInput) {
    configData.dataInstalacao = dataInput.value
  }

  const obsInput = configSection.querySelector("textarea")
  if (obsInput) {
    configData.observacoes = obsInput.value
  }

  return configData
}

// ============================================
// OPERAÇÕES DE PROJETO
// ============================================

/**
 * Salva um projeto completo no servidor
 */
async function saveProject(projectName) {
  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  const projectId = projectBlock.dataset.projectId

  const projectData = buildProjectData(projectBlock)

  const result = projectId
    ? await updateExistingProject(projectId, projectData)
    : await createNewProject(projectData, projectBlock)

  if (result) {
    collapseProjectAfterSave(projectName, projectBlock)
    console.log(`[v0] Projeto ${projectName} salvo e minimizado`)
  }
}

function buildProjectData(projectBlock) {
  const projectData = {
    nome: projectBlock.querySelector(".project-title").textContent.trim(),
    salas: [],
  }

  const roomBlocks = projectBlock.querySelectorAll(".room-block")
  roomBlocks.forEach((roomBlock, index) => {
    const roomData = extractRoomData(roomBlock)
    roomData.id = index + 1
    projectData.salas.push(roomData)
  })

  return projectData
}

async function updateExistingProject(projectId, projectData) {
  projectData.id = Number.parseInt(projectId)
  return await updateProject(projectId, projectData)
}

async function createNewProject(projectData, projectBlock) {
  const result = await createProject(projectData)
  if (result) {
    projectBlock.dataset.projectId = result.id
  }
  return result
}

function collapseProjectAfterSave(projectName, projectBlock) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const minimizer = projectBlock.querySelector(".project-header .minimizer")

  if (projectContent && !projectContent.classList.contains(UI_CONSTANTS.COLLAPSED_CLASS)) {
    collapseElement(projectContent, minimizer)
  }
}

/**
 * Verifica os dados de um projeto
 */
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

/**
 * Habilita edição inline de títulos
 */
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

/**
 * Salva a edição inline
 */
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

/**
 * Cancela a edição inline
 */
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

/**
 * Calcula a Vazão de Ar Externo para uma sala
 */
async function calculateVazaoAr(roomId) {
  await waitForSystemConstants()

  if (!validateSystemConstants()) return

  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (!roomContent) return

  const climaSection = roomContent.querySelector('[id*="-clima"]')
  if (!climaSection) return

  const inputData = collectClimatizationInputs(climaSection)
  const flowRate = computeAirFlowRate(inputData)

  updateFlowRateDisplay(roomId, flowRate)
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

function collectClimatizationInputs(climaSection) {
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
// INICIALIZAÇÃO
// ============================================

window.addEventListener("DOMContentLoaded", async () => {
  await loadSystemConstants()
  await initializeProjectCounter()

  console.log("[v0] Criando projeto inicial...")

  const projectName = `Projeto${getNextProjectNumber()}`
  createEmptyProject(projectName, null)
  createEmptyRoom(projectName, "Sala1", null)

  console.log("[v0] Sistema inicializado")
})
