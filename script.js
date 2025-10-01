// ============================================
// GERENCIAMENTO DE DADOS LOCAIS
// ============================================

// Armazena temporariamente os dados dos projetos
let projectsData = {
  projects: [],
}

let systemConstants = {
  VARIVEL_PD: 0.042, // Valor padrão caso o JSON não carregue
  VARIVEL_PS: 0.024, // Valor padrão caso o JSON não carregue
}

async function loadSystemConstants() {
  try {
    const response = await fetch("dados.json")
    if (!response.ok) {
      throw new Error("Não foi possível carregar dados.json")
    }
    const data = await response.json()
    systemConstants = data.constants
    console.log("[v0] Constantes do sistema carregadas:", systemConstants)
  } catch (error) {
    console.warn("[v0] Erro ao carregar dados.json, usando valores padrão:", error)
    // Mantém os valores padrão já definidos
  }
}

// Carrega dados salvos do localStorage ao iniciar
window.addEventListener("DOMContentLoaded", async () => {
  await loadSystemConstants()
  loadFromLocalStorage()
  console.log("[v0] Sistema inicializado")
})

// ============================================
// FUNÇÕES DE MINIMIZAR/EXPANDIR
// ============================================

// Minimiza/expande um projeto completo
function toggleProject(projectId) {
  const content = document.getElementById(`project-content-${projectId}`)
  const minimizer = event.target

  if (content.classList.contains("collapsed")) {
    content.classList.remove("collapsed")
    minimizer.textContent = "−"
  } else {
    content.classList.add("collapsed")
    minimizer.textContent = "+"
  }
}

// Minimiza/expande uma sala
function toggleRoom(roomId) {
  const content = document.getElementById(`room-content-${roomId}`)
  const minimizer = event.target

  if (content.classList.contains("collapsed")) {
    content.classList.remove("collapsed")
    minimizer.textContent = "−"
  } else {
    content.classList.add("collapsed")
    minimizer.textContent = "+"
  }
}

// Minimiza/expande uma seção
function toggleSection(sectionId) {
  const content = document.getElementById(`section-content-${sectionId}`)
  const minimizer = event.target

  if (content.classList.contains("collapsed")) {
    content.classList.remove("collapsed")
    minimizer.textContent = "−"
  } else {
    content.classList.add("collapsed")
    minimizer.textContent = "+"
  }
}

// Minimiza/expande um subbloco
function toggleSubsection(subsectionId) {
  const content = document.getElementById(`subsection-content-${subsectionId}`)
  const minimizer = event.target

  if (content.classList.contains("collapsed")) {
    content.classList.remove("collapsed")
    minimizer.textContent = "−"
  } else {
    content.classList.add("collapsed")
    minimizer.textContent = "+"
  }
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE PROJETOS
// ============================================

// Adiciona um novo projeto
function addNewProject() {
  const projectsContainer = document.getElementById("projects-container")
  const projectCount = projectsContainer.children.length + 1
  const projectId = Date.now() // ID único baseado em timestamp

  const projectHTML = `
        <div class="project-block" data-project-id="${projectId}">
            <div class="project-header">
                <button class="minimizer" onclick="toggleProject(${projectId})">−</button>
                <h2 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">Projeto ${projectCount}</h2>
                <div class="project-actions">
                    <button class="btn btn-edit" onclick="editProject(${projectId})">Editar</button>
                    <button class="btn btn-delete" onclick="deleteProject(${projectId})">Deletar</button>
                </div>
            </div>
            <div class="project-content" id="project-content-${projectId}">
                <p class="empty-message">Adicione salas a este projeto...</p>
                <div class="add-room-section">
                    <button class="btn btn-add-secondary" onclick="addNewRoom(${projectId})">+ Adicionar Nova Sala</button>
                </div>
                <div class="project-actions-footer">
                    <button class="btn btn-verify" onclick="verifyProjectData(${projectId})">Verificar Dados</button>
                    <button class="btn btn-save" onclick="saveProject(${projectId})">Salvar Projeto</button>
                    <button class="btn btn-download" onclick="downloadPDF(${projectId})">Baixar PDF</button>
                    <button class="btn btn-download" onclick="downloadWord(${projectId})">Baixar Word</button>
                </div>
            </div>
        </div>
    `

  projectsContainer.insertAdjacentHTML("beforeend", projectHTML)
  console.log(`[v0] Projeto ${projectCount} adicionado`)
}

// Deleta um projeto
function deleteProject(projectId) {
  if (confirm("Tem certeza que deseja deletar este projeto? Esta ação não pode ser desfeita.")) {
    const projectBlock = document.querySelector(`[data-project-id="${projectId}"]`)
    projectBlock.remove()
    console.log(`[v0] Projeto ${projectId} deletado`)
  }
}

// ============================================
// FUNÇÕES DE EDIÇÃO INLINE
// ============================================

function makeEditable(element, type) {
  // Previne múltiplas edições simultâneas
  if (element.classList.contains("editing")) {
    return
  }

  // Armazena o texto original
  const originalText = element.textContent.trim()
  element.dataset.originalText = originalText

  // Torna o elemento editável
  element.contentEditable = true
  element.classList.add("editing")

  // Seleciona todo o texto
  const range = document.createRange()
  const selection = window.getSelection()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)

  // Foca no elemento
  element.focus()

  // Salva ao pressionar Enter
  element.addEventListener("keydown", function handleEnter(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      saveInlineEdit(element, type)
      element.removeEventListener("keydown", handleEnter)
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelInlineEdit(element)
      element.removeEventListener("keydown", handleEnter)
    }
  })

  // Salva ao clicar fora
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

  // Remove estado de edição
  element.contentEditable = false
  element.classList.remove("editing")

  // Se o texto estiver vazio, restaura o original
  if (newText === "") {
    element.textContent = originalText
    alert("O nome não pode estar vazio.")
    return
  }

  // Se o texto mudou, atualiza
  if (newText !== originalText) {
    element.textContent = newText

    // Salva no localStorage
    saveToLocalStorage()

    console.log(`[v0] ${type === "project" ? "Projeto" : "Sala"} renomeado para: ${newText}`)
  }

  // Remove o atributo temporário
  delete element.dataset.originalText
}

function cancelInlineEdit(element) {
  const originalText = element.dataset.originalText

  element.contentEditable = false
  element.classList.remove("editing")
  element.textContent = originalText

  delete element.dataset.originalText

  console.log("[v0] Edição cancelada")
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE SALAS
// ============================================

// Adiciona uma nova sala a um projeto
function addNewRoom(projectId) {
  const projectContent = document.getElementById(`project-content-${projectId}`)
  const roomCount = projectContent.querySelectorAll(".room-block").length + 1
  const roomId = `${projectId}-${Date.now()}`

  const roomHTML = `
        <div class="room-block" data-room-id="${roomId}">
            <div class="room-header">
                <button class="minimizer" onclick="toggleRoom('${roomId}')">−</button>
                <h3 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">Sala ${roomCount}</h3>
                <button class="btn btn-delete-small" onclick="deleteRoom('${roomId}')">Deletar</button>
            </div>
            <div class="room-content" id="room-content-${roomId}">
                <!-- Seção: Climatização -->
                <div class="section-block">
                    <div class="section-header">
                        <button class="minimizer" onclick="toggleSection('${roomId}-clima')">−</button>
                        <h4 class="section-title">Climatização</h4>
                    </div>
                    <div class="section-content" id="section-content-${roomId}-clima">
                        <div class="subsection-block">
                            <div class="subsection-header">
                                <button class="minimizer" onclick="toggleSubsection('${roomId}-clima-table')">−</button>
                                <h5 class="subsection-title">Tabela de Inputs</h5>
                            </div>
                            <div class="subsection-content" id="subsection-content-${roomId}-clima-table">
                                <div class="clima-table">
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Ambiente:</label>
                                            <input type="text" class="form-input clima-input" data-field="ambiente" placeholder="Ex: Sala de Servidores" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell">
                                            <label>Back-up:</label>
                                            <select class="form-input clima-input" data-field="backup" onchange="calculateVazaoAr('${roomId}')">
                                                <option value="">Selecione</option>
                                                <option value="n">n</option>
                                                <option value="n+1">n+1</option>
                                                <option value="n+2">n+2</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Área (m²):</label>
                                            <input type="number" class="form-input clima-input" data-field="area" placeholder="Ex: 50" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell">
                                            <label>Tipo de Construção:</label>
                                            <select class="form-input clima-input" data-field="tipoConstrucao" onchange="calculateVazaoAr('${roomId}')">
                                                <option value="">Selecione</option>
                                                <option value="alvenaria">Alvenaria</option>
                                                <option value="eletrocentro">Eletrocentro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Parede Oeste (m):</label>
                                            <input type="number" class="form-input clima-input" data-field="paredeOeste" placeholder="Ex: 5.5" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell">
                                            <label>Parede Leste (m):</label>
                                            <input type="number" class="form-input clima-input" data-field="paredeLeste" placeholder="Ex: 5.5" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Parede Norte (m):</label>
                                            <input type="number" class="form-input clima-input" data-field="paredeNorte" placeholder="Ex: 8.0" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell">
                                            <label>Parede Sul (m):</label>
                                            <input type="number" class="form-input clima-input" data-field="paredeSul" placeholder="Ex: 8.0" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Pé Direito (m):</label>
                                            <input type="number" class="form-input clima-input" data-field="peDireito" placeholder="Ex: 3.0" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell clima-cell-empty"></div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Divisória Área Não Climatizada 1 (m²):</label>
                                            <input type="number" class="form-input clima-input" data-field="divisoriaNaoClima1" placeholder="Ex: 10" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell">
                                            <label>Divisória Área Não Climatizada 2 (m²):</label>
                                            <input type="number" class="form-input clima-input" data-field="divisoriaNaoClima2" placeholder="Ex: 10" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Divisória Área Climatizada 1 (m²):</label>
                                            <input type="number" class="form-input clima-input" data-field="divisoriaClima1" placeholder="Ex: 15" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell">
                                            <label>Divisória Área Climatizada 2 (m²):</label>
                                            <input type="number" class="form-input clima-input" data-field="divisoriaClima2" placeholder="Ex: 15" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Dissipação (W):</label>
                                            <input type="number" class="form-input clima-input" data-field="dissipacao" placeholder="Ex: 5000" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell">
                                            <label>N° Pessoas:</label>
                                            <input type="number" class="form-input clima-input" data-field="numPessoas" placeholder="Ex: 10" min="0" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>N° Portas Duplas:</label>
                                            <input type="number" class="form-input clima-input" data-field="numPortasDuplas" placeholder="Ex: 2" min="0" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell">
                                            <label>N° Portas Simples:</label>
                                            <input type="number" class="form-input clima-input" data-field="numPortasSimples" placeholder="Ex: 3" min="0" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Pressurização (Pa):</label>
                                            <input type="number" class="form-input clima-input" data-field="pressurizacao" placeholder="Ex: 50" step="0.01" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                        <div class="clima-cell">
                                            <label>Setpoint (°C):</label>
                                            <input type="number" class="form-input clima-input" data-field="setpoint" placeholder="Ex: 22" step="0.1" onchange="calculateVazaoAr('${roomId}')">
                                        </div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell clima-cell-result">
                                            <label>Vazão de Ar Externo (l/s):</label>
                                            <div class="result-value-inline" id="vazao-ar-${roomId}">0</div>
                                        </div>
                                        <div class="clima-cell clima-cell-empty"></div>
                                    </div>
                                    <div class="clima-row">
                                        <div class="clima-cell">
                                            <label>Combate a Incêndio:</label>
                                            <select class="form-input clima-input" data-field="combateIncendio" onchange="calculateVazaoAr('${roomId}')">
                                                <option value="">Selecione</option>
                                                <option value="manual">Manual/Detecção</option>
                                                <option value="fm200">FM200</option>
                                                <option value="novec">NOVEC</option>
                                                <option value="firepro">FirePRO</option>
                                                <option value="ni">N/I</option>
                                            </select>
                                        </div>
                                        <div class="clima-cell clima-cell-empty"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção: Máquinas -->
                <div class="section-block">
                    <div class="section-header">
                        <button class="minimizer" onclick="toggleSection('${roomId}-maquinas')">−</button>
                        <h4 class="section-title">Máquinas</h4>
                        <button class="btn btn-add-small" onclick="addMachine('${roomId}')">+ Adicionar Máquina</button>
                    </div>
                    <div class="section-content" id="section-content-${roomId}-maquinas">
                        <div class="machines-container" id="machines-${roomId}">
                            <p class="empty-message">Nenhuma máquina adicionada ainda.</p>
                        </div>
                    </div>
                </div>

                <!-- Seção: Configuração Geral -->
                <div class="section-block">
                    <div class="section-header">
                        <button class="minimizer" onclick="toggleSection('${roomId}-config')">−</button>
                        <h4 class="section-title">Configuração Geral</h4>
                    </div>
                    <div class="section-content" id="section-content-${roomId}-config">
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

                <!-- Botões da Sala -->
                <div class="room-actions">
                    <button class="btn btn-update" onclick="updateRoom('${roomId}')">Atualizar Dados</button>
                    <button class="btn btn-save" onclick="saveRoom('${roomId}')">Salvar</button>
                </div>
            </div>
        </div>
    `

  const addRoomSection = projectContent.querySelector(".add-room-section")
  addRoomSection.insertAdjacentHTML("beforebegin", roomHTML)

  const emptyMessage = projectContent.querySelector(".empty-message")
  if (emptyMessage) {
    emptyMessage.remove()
  }

  console.log(`[v0] Sala ${roomCount} adicionada ao projeto ${projectId}`)
}

// Deleta uma sala
function deleteRoom(roomId) {
  if (confirm("Tem certeza que deseja deletar esta sala? Esta ação não pode ser desfeita.")) {
    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`)
    const projectContent = roomBlock.closest(".project-content")

    roomBlock.remove()

    // Se não houver mais salas, mostra mensagem vazia
    const remainingRooms = projectContent.querySelectorAll(".room-block")
    if (remainingRooms.length === 0) {
      const addRoomSection = projectContent.querySelector(".add-room-section")
      addRoomSection.insertAdjacentHTML("beforebegin", '<p class="empty-message">Adicione salas a este projeto...</p>')
    }

    // Salva no localStorage
    saveToLocalStorage()

    console.log(`[v0] Sala ${roomId} deletada`)
  }
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE MÁQUINAS
// ============================================

// Adiciona uma nova máquina a uma sala
function addMachine(roomId) {
  const machinesContainer = document.getElementById(`machines-${roomId}`)
  const machineCount = machinesContainer.querySelectorAll(".machine-item").length + 1

  // Remove mensagem vazia se existir
  const emptyMessage = machinesContainer.querySelector(".empty-message")
  if (emptyMessage) {
    emptyMessage.remove()
  }

  const machineHTML = `
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

  machinesContainer.insertAdjacentHTML("beforeend", machineHTML)
  console.log(`[v0] Máquina ${machineCount} adicionada à sala ${roomId}`)
}

// Deleta uma máquina
function deleteMachine(button) {
  if (confirm("Deseja remover esta máquina?")) {
    const machineItem = button.closest(".machine-item")
    const machinesContainer = machineItem.closest(".machines-container")
    machineItem.remove()

    // Se não houver mais máquinas, mostra mensagem vazia
    if (machinesContainer.querySelectorAll(".machine-item").length === 0) {
      machinesContainer.innerHTML = '<p class="empty-message">Nenhuma máquina adicionada ainda.</p>'
    }

    console.log("[v0] Máquina removida")
  }
}

// ============================================
// FUNÇÕES DE ATUALIZAÇÃO E SALVAMENTO
// ============================================

// Atualiza os dados de uma sala (validação local)
function updateRoom(roomId) {
  const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`)
  const inputs = roomBlock.querySelectorAll(".form-input")

  let hasEmptyFields = false
  inputs.forEach((input) => {
    if (input.value.trim() === "" && input.hasAttribute("required")) {
      hasEmptyFields = true
      input.style.borderColor = "#dc3545"
    } else {
      input.style.borderColor = "#dee2e6"
    }
  })

  if (hasEmptyFields) {
    alert("Por favor, preencha todos os campos obrigatórios.")
  } else {
    alert("Dados da sala atualizados localmente!")
    console.log(`[v0] Dados da sala ${roomId} atualizados`)
  }
}

// Salva os dados de uma sala
function saveRoom(roomId) {
  const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`)
  const roomData = extractRoomData(roomBlock)

  console.log(`[v0] Salvando dados da sala ${roomId}:`, roomData)

  // Salva no localStorage
  saveToLocalStorage()

  alert("Dados da sala salvos com sucesso!")
}

// Extrai dados de uma sala para JSON
function extractRoomData(roomBlock) {
  const roomData = {
    id: roomBlock.dataset.roomId,
    name: roomBlock.querySelector(".room-title").textContent,
    climatizacao: {},
    maquinas: [],
    configuracaoGeral: {},
  }

  // Extrai dados de climatização
  const climaSection = roomBlock.querySelector('[id*="-clima"]')
  if (climaSection) {
    const inputs = climaSection.querySelectorAll(".clima-input")
    inputs.forEach((input) => {
      const label = input.previousElementSibling?.textContent.replace(":", "")
      roomData.climatizacao[label] = input.value
    })
  }

  // Extrai dados de máquinas
  const machines = roomBlock.querySelectorAll(".machine-item")
  machines.forEach((machine) => {
    const machineData = {}
    const inputs = machine.querySelectorAll(".form-input")
    inputs.forEach((input) => {
      const label = input.previousElementSibling?.textContent.replace(":", "")
      machineData[label] = input.value
    })
    roomData.maquinas.push(machineData)
  })

  // Extrai dados de configuração geral
  const configSection = roomBlock.querySelector('[id*="-config"]')
  if (configSection) {
    const inputs = configSection.querySelectorAll(".form-input")
    inputs.forEach((input) => {
      const label = input.previousElementSibling?.textContent.replace(":", "")
      roomData.configuracaoGeral[label] = input.value
    })
  }

  return roomData
}

// ============================================
// FUNÇÕES DE PROJETO
// ============================================

// Verifica os dados de um projeto
function verifyProjectData(projectId) {
  const projectBlock = document.querySelector(`[data-project-id="${projectId}"]`)
  const rooms = projectBlock.querySelectorAll(".room-block")

  let report = `Verificação do Projeto:\n\n`
  report += `Total de salas: ${rooms.length}\n\n`

  rooms.forEach((room, index) => {
    const roomName = room.querySelector(".room-title").textContent
    const inputs = room.querySelectorAll(".form-input")
    const filledInputs = Array.from(inputs).filter((input) => input.value.trim() !== "").length
    const totalInputs = inputs.length
    const percentage = totalInputs > 0 ? ((filledInputs / totalInputs) * 100).toFixed(1) : 0

    report += `${roomName}: ${filledInputs}/${totalInputs} campos preenchidos (${percentage}%)\n`
  })

  alert(report)
  console.log(`[v0] Verificação do projeto ${projectId} concluída`)
}

// Salva um projeto completo
function saveProject(projectId) {
  const projectBlock = document.querySelector(`[data-project-id="${projectId}"]`)
  const projectData = {
    id: projectId,
    name: projectBlock.querySelector(".project-title").textContent,
    rooms: [],
  }

  const rooms = projectBlock.querySelectorAll(".room-block")
  rooms.forEach((room) => {
    projectData.rooms.push(extractRoomData(room))
  })

  console.log(`[v0] Salvando projeto ${projectId}:`, projectData)

  // Salva no localStorage
  saveToLocalStorage()

  alert("Projeto salvo com sucesso!")
}

// ============================================
// FUNÇÕES DE EXPORTAÇÃO
// ============================================

// Baixa o projeto em PDF (simulado)
function downloadPDF(projectId) {
  const projectBlock = document.querySelector(`[data-project-id="${projectId}"]`)
  const projectName = projectBlock.querySelector(".project-title").textContent

  alert(
    `Funcionalidade de download PDF será implementada.\n\nProjeto: ${projectName}\n\nEsta função pode ser integrada com bibliotecas como jsPDF ou html2pdf.js`,
  )
  console.log(`[v0] Download PDF solicitado para projeto ${projectId}`)
}

// Baixa o projeto em Word (simulado)
function downloadWord(projectId) {
  const projectBlock = document.querySelector(`[data-project-id="${projectId}"]`)
  const projectName = projectBlock.querySelector(".project-title").textContent

  alert(
    `Funcionalidade de download Word será implementada.\n\nProjeto: ${projectName}\n\nEsta função pode ser integrada com bibliotecas como docx.js`,
  )
  console.log(`[v0] Download Word solicitado para projeto ${projectId}`)
}

// ============================================
// FUNÇÕES DE ARMAZENAMENTO LOCAL
// ============================================

// Salva todos os dados no localStorage
function saveToLocalStorage() {
  const projects = []
  const projectBlocks = document.querySelectorAll(".project-block")

  projectBlocks.forEach((block) => {
    const projectId = block.dataset.projectId
    const projectData = {
      id: projectId,
      name: block.querySelector(".project-title").textContent,
      rooms: [],
    }

    const rooms = block.querySelectorAll(".room-block")
    rooms.forEach((room) => {
      projectData.rooms.push(extractRoomData(room))
    })

    projects.push(projectData)
  })

  localStorage.setItem("projectsData", JSON.stringify(projects))
  console.log("[v0] Dados salvos no localStorage")
}

// Carrega dados do localStorage
function loadFromLocalStorage() {
  const savedData = localStorage.getItem("projectsData")
  if (savedData) {
    projectsData = JSON.parse(savedData)
    console.log("[v0] Dados carregados do localStorage:", projectsData)
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Exporta dados para JSON (para integração futura com Python)
function exportToJSON() {
  saveToLocalStorage()
  const data = localStorage.getItem("projectsData")
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "projetos-data.json"
  a.click()
  console.log("[v0] Dados exportados para JSON")
}

// Importa dados de JSON (para integração futura com Python)
function importFromJSON(jsonData) {
  try {
    const data = JSON.parse(jsonData)
    localStorage.setItem("projectsData", jsonData)
    location.reload() // Recarrega a página para aplicar os dados
    console.log("[v0] Dados importados do JSON")
  } catch (error) {
    console.error("[v0] Erro ao importar JSON:", error)
    alert("Erro ao importar dados. Verifique o formato do arquivo JSON.")
  }
}

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

function calculateVazaoAr(roomId) {
  const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`)
  if (!roomBlock) return

  const climaSection = roomBlock.querySelector('[id*="-clima"]')
  if (!climaSection) return

  const VARIVEL_PD = systemConstants.VARIVEL_PD
  const VARIVEL_PS = systemConstants.VARIVEL_PS

  console.log("[v0] ===== INÍCIO DO CÁLCULO DE VAZÃO =====")
  console.log("[v0] Constantes carregadas:")
  console.log("[v0] VARIVEL_PD:", VARIVEL_PD)
  console.log("[v0] VARIVEL_PS:", VARIVEL_PS)

  // Coleta todos os valores dos inputs
  const inputs = climaSection.querySelectorAll(".clima-input")
  const data = {}

  inputs.forEach((input) => {
    const field = input.dataset.field
    const value = input.value
    data[field] = value !== "" ? Number.parseFloat(value) || value : 0
  })

  // Extrai valores necessários para o cálculo
  const numPortasDuplas = data.numPortasDuplas || 0
  const numPortasSimples = data.numPortasSimples || 0
  const pressurizacao = data.pressurizacao || 0

  console.log("[v0] Valores de entrada:")
  console.log("[v0] N° Portas Duplas (B18):", numPortasDuplas)
  console.log("[v0] N° Portas Simples (B19):", numPortasSimples)
  console.log("[v0] Pressurização Pa (B20):", pressurizacao)

  // Fórmula: 0.827 * B18 * Varivel_PD * (B20^0.5) * 3600
  const auxPortasDuplas = 0.827 * numPortasDuplas * 0.0402 * Math.pow(pressurizacao, 0.5) * 3600;
  //=(0,827*B18*0,0402*(POWER(B20;0,5))*3600)

  // Fórmula: 0.827 * B19 * Varivel_PS * (B20^0.5) * 3600
  const auxPortasSimples = 0.827 * numPortasSimples * VARIVEL_PS * Math.pow(pressurizacao, 0.5) * 3600
  console.log("[v0] Cálculos intermediários:")
  console.log("[v0] AUX Portas Duplas (B39):", auxPortasDuplas)
  console.log("[v0] AUX Portas Simples (B40):", auxPortasSimples)
  console.log("[v0] Soma (B39+B40):", auxPortasDuplas + auxPortasSimples)

  // Fórmula Excel: ROUNDUP((B39+B40)/3,6*1,25*1;0)
  const soma = auxPortasDuplas + auxPortasSimples
  const divisao = soma / 3.6
  const multiplicacao = divisao * 1.25 * 1
  const vazao = Math.ceil(multiplicacao)

  console.log("[v0] Cálculo final passo a passo:")
  console.log("[v0] (B39+B40) / 3.6 =", divisao)
  console.log("[v0] Resultado * 1.25 * 1 =", multiplicacao)
  console.log("[v0] ROUNDUP (Math.ceil) =", vazao)
  console.log("[v0] ===== FIM DO CÁLCULO DE VAZÃO =====")

  // Atualiza o campo de resultado
  const resultElement = document.getElementById(`vazao-ar-${roomId}`)
  if (resultElement) {
    resultElement.textContent = vazao
  }

  saveToLocalStorage()
}
