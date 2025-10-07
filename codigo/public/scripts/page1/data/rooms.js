import { showEmptyProjectMessageIfNeeded, removeEmptyProjectMessage } from '../ui/interface.js'
import { calculateVazaoArAndThermalGains } from '../calculos/calculos.js'


function createEmptyRoom(projectName, roomName, roomId) {
  const roomHTML = buildRoomHTML(projectName, roomName, roomId)
  const projectContent = document.getElementById(`project-content-${projectName}`)
  
  if (!projectContent) {
    console.error(`[v0] Conteúdo do projeto ${projectName} não encontrado para adicionar sala`)
    return false
  }

  // Remover mensagem de "nenhuma sala" se existir
  removeEmptyProjectMessage(projectContent)
  
  // Inserir a sala antes do botão "Adicionar Nova Sala"
  const addRoomSection = projectContent.querySelector('.add-room-section')
  if (addRoomSection) {
    addRoomSection.insertAdjacentHTML('beforebegin', roomHTML)
  } else {
    // Se não encontrar a seção, inserir no final
    projectContent.insertAdjacentHTML('beforeend', roomHTML)
  }

  console.log(`[v0] Sala ${roomName} criada no projeto ${projectName}`)
  return true
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
        options: ["", "Alvenaria", "Eletrocentro"],
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

function buildThermalGainsSection(roomId) {
  return `
    <div class="subsection-block">
      <div class="subsection-header">
        <button class="minimizer" onclick="toggleSubsection('${roomId}-ganhos')">+</button>
        <h5 class="subsection-title">Cálculo de Ganhos Térmicos</h5>
      </div>
      <div class="subsection-content collapsed" id="subsection-content-${roomId}-ganhos">
        <!-- Conteúdo dos ganhos térmicos -->
        <div class="thermal-summary">
          <div class="thermal-summary-item">
            <span class="thermal-summary-label">Total de Ganhos Térmicos:</span>
            <span class="thermal-summary-value" id="total-ganhos-w-${roomId}">0</span>
            <span class="thermal-summary-unit">W</span>
          </div>
          <div class="thermal-summary-item">
            <span class="thermal-summary-label">Total em TR:</span>
            <span class="thermal-summary-value" id="total-tr-${roomId}">0</span>
            <span class="thermal-summary-unit">TR</span>
          </div>
        </div>
        <!-- Tabela de Paredes e Teto -->
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
                <td id="area-teto-${roomId}">0</td>
                <td id="uvalue-teto-${roomId}">0</td>
                <td id="deltat-teto-${roomId}">0</td>
                <td id="ganho-teto-${roomId}">0</td>
              </tr>
              <tr>
                <td>Parede Oeste</td>
                <td id="area-parede-oeste-${roomId}">0</td>
                <td id="uvalue-parede-oeste-${roomId}">0</td>
                <td id="deltat-parede-oeste-${roomId}">0</td>
                <td id="ganho-parede-oeste-${roomId}">0</td>
              </tr>
              <tr>
                <td>Parede Leste</td>
                <td id="area-parede-leste-${roomId}">0</td>
                <td id="uvalue-parede-leste-${roomId}">0</td>
                <td id="deltat-parede-leste-${roomId}">0</td>
                <td id="ganho-parede-leste-${roomId}">0</td>
              </tr>
              <tr>
                <td>Parede Norte</td>
                <td id="area-parede-norte-${roomId}">0</td>
                <td id="uvalue-parede-norte-${roomId}">0</td>
                <td id="deltat-parede-norte-${roomId}">0</td>
                <td id="ganho-parede-norte-${roomId}">0</td>
              </tr>
              <tr>
                <td>Parede Sul</td>
                <td id="area-parede-sul-${roomId}">0</td>
                <td id="uvalue-parede-sul-${roomId}">0</td>
                <td id="deltat-parede-sul-${roomId}">0</td>
                <td id="ganho-parede-sul-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Paredes Externas e Teto</td>
                <td id="total-externo-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Divisórias -->
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
                <td id="area-divi-nc1-${roomId}">0</td>
                <td id="uvalue-divi-nc1-${roomId}">0</td>
                <td id="deltat-divi-nc1-${roomId}">0</td>
                <td id="ganho-divi-nc1-${roomId}">0</td>
              </tr>
              <tr>
                <td>Divisória Não Climatizada 2</td>
                <td id="area-divi-nc2-${roomId}">0</td>
                <td id="uvalue-divi-nc2-${roomId}">0</td>
                <td id="deltat-divi-nc2-${roomId}">0</td>
                <td id="ganho-divi-nc2-${roomId}">0</td>
              </tr>
              <tr>
                <td>Divisória Climatizada 1</td>
                <td id="area-divi-c1-${roomId}">0</td>
                <td id="uvalue-divi-c1-${roomId}">0</td>
                <td id="deltat-divi-c1-${roomId}">0</td>
                <td id="ganho-divi-c1-${roomId}">0</td>
              </tr>
              <tr>
                <td>Divisória Climatizada 2</td>
                <td id="area-divi-c2-${roomId}">0</td>
                <td id="uvalue-divi-c2-${roomId}">0</td>
                <td id="deltat-divi-c2-${roomId}">0</td>
                <td id="ganho-divi-c2-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Divisórias</td>
                <td id="total-divisoes-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Piso -->
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
                <td id="area-piso-${roomId}">0</td>
                <td id="uvalue-piso-${roomId}">0</td>
                <td id="deltat-piso-${roomId}">0</td>
                <td id="ganho-piso-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Piso</td>
                <td id="total-piso-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Iluminação -->
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
                <td id="area-iluminacao-${roomId}">0</td>
                <td id="fator-iluminacao-${roomId}">0</td>
                <td id="fs-iluminacao-${roomId}">0</td>
                <td id="ganho-iluminacao-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Iluminação</td>
                <td id="total-iluminacao-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Dissipação Térmica Interna -->
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
                <td id="fator-conversao-dissi-${roomId}">0</td>
                <td id="pe-dissi-${roomId}">0</td>
                <td id="fs-dissi-${roomId}">0</td>
                <td id="ganho-dissi-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Equipamentos</td>
                <td id="total-dissi-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Ocupação de Pessoas -->
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
                <td id="csp-pessoas-${roomId}">0</td>
                <td id="clp-pessoas-${roomId}">0</td>
                <td id="o-pessoas-${roomId}">0</td>
                <td id="fs-pessoas-${roomId}">0</td>
                <td id="ganho-pessoas-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="5">Total Pessoas</td>
                <td id="total-pessoas-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Ar Externo Sensível -->
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
                <td id="m-ar-sensivel-${roomId}">0</td>
                <td id="c-ar-sensivel-${roomId}">0</td>
                <td id="deltat-ar-sensivel-${roomId}">0</td>
                <td id="ganho-ar-sensivel-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Ar Externo Sensível</td>
                <td id="total-ar-sensivel-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Ar Externo Latente -->
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
                <td id="var-ar-latente-${roomId}">0</td>
                <td id="f-ar-latente-${roomId}">0</td>
                <td id="deltaua-ar-latente-${roomId}">0</td>
                <td id="ganho-ar-latente-${roomId}">0</td>
              </tr>
              <tr class="thermal-table-total">
                <td colspan="4">Total Ar Externo Latente</td>
                <td id="total-ar-latente-${roomId}">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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

export {
  createEmptyRoom,
  buildRoomHTML,
  buildRoomHeader,
  buildClimatizationSection,
  buildClimatizationTable,
  buildClimaRow,
  buildClimaCell,
  buildSelectInput,
  buildTextInput,
  buildResultRow,
  buildThermalGainsSection,
  buildMachinesSection,
  buildConfigurationSection,
  buildRoomActions,
  insertRoomIntoProject,
  addNewRoom,
  deleteRoom,
  addMachine,
  removeEmptyMachinesMessage,
  buildMachineHTML,
  deleteMachine,
  showEmptyMachinesMessageIfNeeded
}