// ============================================
// CONFIGURAÇÃO DA API
// ============================================

const API_BASE_URL = "http://localhost:3000" // URL base para a API de projetos
const DADOS_API_URL = "http://localhost:3001" // URL base para a API de dados/constantes

// ============================================
// GERENCIAMENTO DE DADOS
// ============================================

let systemConstants = null // Armazena as constantes do sistema carregadas do arquivo dados.json
let projectCounter = 0



/**
 * Carrega as constantes do sistema do arquivo dados.json via json-server
 * Realiza uma requisição GET para obter as constantes do sistema
 * Atualiza a variável global systemConstants com os dados carregados
 * Exibe status de sucesso ou erro no sistema
 */
async function loadSystemConstants() {
  try {
    console.log("[v0] Tentando carregar dados.json via json-server")
    const response = await fetch(`${DADOS_API_URL}/constants`)

    if (!response.ok) {
      throw new Error(`Status HTTP: ${response.status}`)
    }

    const data = await response.json()

    // json-server retorna o objeto diretamente
    systemConstants = data
    console.log("[v0] Constantes do sistema carregadas:", systemConstants)
    showSystemStatus("Constantes do sistema carregadas com sucesso", "success")
  } catch (error) {
    console.error("[v0] ERRO CRÍTICO: Não foi possível carregar dados.json:", error)
    showSystemStatus(
      "ERRO: Não foi possível carregar o arquivo dados.json. Os cálculos não funcionarão até que o arquivo seja carregado corretamente.",
      "error",
    )
    systemConstants = null
  }
}



/**
 * Busca todos os projetos do json-server
 * Realiza uma requisição GET para obter a lista de projetos
 * Retorna array de projetos ou array vazio em caso de erro
 */
async function fetchProjects() {
  try {
    console.log("[v0] Buscando projetos do json-server...")
    const response = await fetch(`${API_BASE_URL}/projetos`)

    if (!response.ok) {
      throw new Error(`Status HTTP: ${response.status}`)
    }

    const projetos = await response.json()
    console.log("[v0] Projetos carregados:", projetos)
    return projetos
  } catch (error) {
    console.error("[v0] Erro ao buscar projetos:", error)
    showSystemStatus("ERRO: Não foi possível carregar projetos do servidor", "error")
    return []
  }
}



/**
 * Determina o próximo número de projeto baseado nos projetos existentes no servidor
 *
async function getNextProjectNumber() {
  const projetos = await fetchProjects()
  
  // Conta também os projetos já criados na interface atual
  const existingProjects = document.querySelectorAll('.project-item').length
  
  if (projetos.length === 0 && existingProjects === 0) {
    return 1
  }

  // Extrai números dos nomes dos projetos do banco
  const dbNumbers = projetos.map((projeto) => {
    const match = projeto.nome.match(/Projeto(\d+)/)
    return match ? Number.parseInt(match[1]) : 0
  })

  // Extrai números dos projetos na interface
  const interfaceNumbers = Array.from(document.querySelectorAll('.project-item')).map((projectElement) => {
    const projectName = projectElement.querySelector('.project-name').textContent
    const match = projectName.match(/Projeto(\d+)/)
    return match ? Number.parseInt(match[1]) : 0
  })

  // Combina todos os números e encontra o máximo
  const allNumbers = [...dbNumbers, ...interfaceNumbers]
  const maxNumber = Math.max(...allNumbers)
  
  return maxNumber + 1
}*/



/**
 * Determina o próximo ID de projeto baseado nos projetos existentes no servidor
 * Busca todos os projetos e encontra o maior ID existente
 * Retorna 1001 se não houver projetos, ou o próximo ID sequencial
 */
async function getNextProjectId() {
  const projetos = await fetchProjects()

  if (projetos.length === 0) {
    return 1001
  }

  // Encontra o maior ID existente
  const maxId = Math.max(...projetos.map((p) => p.id || 0))
  return maxId >= 1001 ? maxId + 1 : 1001
}

/**
 * Cria um novo projeto no json-server
 * Envia uma requisição POST com os dados do projeto
 * Atribui um ID automático se não fornecido
 * Retorna o projeto criado ou null em caso de erro
 */
async function createProject(projectData) {
  try {
    if (!projectData.id) {
      projectData.id = await getNextProjectId()
    }

    console.log("[v0] Criando novo projeto no servidor:", projectData)
    const response = await fetch(`${API_BASE_URL}/projetos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      throw new Error(`Status HTTP: ${response.status}`)
    }

    const createdProject = await response.json()
    console.log("[v0] Projeto criado com sucesso:", createdProject)
    showSystemStatus("Projeto salvo com sucesso!", "success")
    return createdProject
  } catch (error) {
    console.error("[v0] Erro ao criar projeto:", error)
    showSystemStatus("ERRO: Não foi possível salvar o projeto", "error")
    return null
  }
}

/**
 * Atualiza um projeto existente no json-server
 * Envia uma requisição PUT com os dados atualizados do projeto
 * Retorna o projeto atualizado ou null em caso de erro
 */
async function updateProject(projectId, projectData) {
  try {
    console.log("[v0] Atualizando projeto no servidor:", projectId, projectData)
    const response = await fetch(`${API_BASE_URL}/projetos/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      throw new Error(`Status HTTP: ${response.status}`)
    }

    const updatedProject = await response.json()
    console.log("[v0] Projeto atualizado com sucesso:", updatedProject)
    showSystemStatus("Projeto atualizado com sucesso!", "success")
    return updatedProject
  } catch (error) {
    console.error("[v0] Erro ao atualizar projeto:", error)
    showSystemStatus("ERRO: Não foi possível atualizar o projeto", "error")
    return null
  }
}

/**
 * Exibe mensagem de status do sistema
 * Cria um banner temporário com mensagem de sucesso ou erro
 * Remove automaticamente banners de sucesso após 5 segundos
 */
function showSystemStatus(message, type) {
  const existingBanner = document.getElementById("system-status-banner")
  if (existingBanner) {
    existingBanner.remove()
  }

  const banner = document.createElement("div")
  banner.id = "system-status-banner"
  banner.className = `system-status-banner ${type}`
  banner.textContent = message

  const mainContent = document.querySelector(".main-content")
  mainContent.insertBefore(banner, mainContent.firstChild)

  // Remove banner de sucesso após 5 segundos
  if (type === "success") {
    setTimeout(() => {
      banner.remove()
    }, 5000)
  }
}


/**
 * Inicializa o sistema ao carregar a página
 * Carrega as constantes do sistema e cria projeto inicial
 * Configura o contador de projetos baseado nos existentes no banco
 */
window.addEventListener("DOMContentLoaded", async () => {
  await loadSystemConstants()

  console.log("[v0] Criando projeto inicial completo com sala padrão...")
  
  // Inicializa o contador com projetos existentes no banco
  const projetos = await fetchProjects()
  if (projetos.length > 0) {
    const numbers = projetos.map((projeto) => {
      const match = projeto.nome.match(/Projeto(\d+)/)
      return match ? Number.parseInt(match[1]) : 0
    })
    projectCounter = Math.max(...numbers)
  } else {
    projectCounter = 0 // Começa do 0, pois getNextProjectNumber() incrementa
  }

  const projectName = `Projeto${getNextProjectNumber()}`

  createEmptyProject(projectName, null)
  createEmptyRoom(projectName, "Sala1", null)

  console.log("[v0] Sistema inicializado com projeto e sala padrão")
})

// Função única para obter próximo número
function getNextProjectNumber() {
  projectCounter++
  return projectCounter
}
// ============================================
// FUNÇÕES DE CRIAÇÃO DE PROJETOS E SALAS
// ============================================

/**
 * Cria um projeto vazio na interface (sem dados pré-preenchidos)
 * Gera HTML do projeto e insere no container de projetos
 * Inclui botões de ação e seção para adicionar salas
 */
function createEmptyProject(projectName, projectId) {
  const projectHTML = `
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
        <div class="project-actions-footer">
          <button class="btn btn-verify" onclick="verifyProjectData('${projectName}')">Verificar Dados</button>
          <button class="btn btn-save" onclick="saveProject('${projectName}')">Salvar Projeto</button>
          <button class="btn btn-download" onclick="downloadPDF('${projectName}')">Baixar PDF</button>
          <button class="btn btn-download" onclick="downloadWord('${projectName}')">Baixar Word</button>
        </div>
      </div>
    </div>
  `

  const projectsContainer = document.getElementById("projects-container")
  projectsContainer.insertAdjacentHTML("beforeend", projectHTML)

  console.log(`[v0] Projeto ${projectName} criado (vazio)`)
}

/**
 * Cria uma sala vazia na interface (sem dados pré-preenchidos)
 * Gera HTML completo da sala com seções de climatização, máquinas e configuração
 * Adiciona a sala ao projeto especificado
 */
function createEmptyRoom(projectName, roomName, roomId) {
  const projectContent = document.getElementById(`project-content-${projectName}`)

  const roomHTML = `
    <div class="room-block" data-room-id="${roomId || ""}" data-room-name="${roomName}">
      <div class="room-header">
        <button class="minimizer" onclick="toggleRoom('${projectName}-${roomName}')">+</button>
        <h3 class="room-title editable-title" data-editable="true" onclick="makeEditable(this, 'room')">${roomName}</h3>
        <button class="btn btn-delete-small" onclick="deleteRoom('${projectName}', '${roomName}')">Deletar</button>
      </div>
      <div class="room-content collapsed" id="room-content-${projectName}-${roomName}">
        <!-- Seção: Climatização -->
        <div class="section-block">
          <div class="section-header">
            <button class="minimizer" onclick="toggleSection('${projectName}-${roomName}-clima')">+</button>
            <h4 class="section-title">Climatização</h4>
          </div>
          <div class="section-content collapsed" id="section-content-${projectName}-${roomName}-clima">
            <div class="subsection-block">
              <div class="subsection-header">
                <button class="minimizer" onclick="toggleSubsection('${projectName}-${roomName}-clima-table')">+</button>
                <h5 class="subsection-title">Tabela de Inputs</h5>
              </div>
              <div class="subsection-content collapsed" id="subsection-content-${projectName}-${roomName}-clima-table">
                <div class="clima-table">
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>Ambiente:</label>
                      <input type="text" class="form-input clima-input" data-field="ambiente" placeholder="Ex: Sala de Servidores" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell">
                      <label>Back-up:</label>
                      <select class="form-input clima-input" data-field="backup" onchange="calculateVazaoAr('${projectName}-${roomName}')">
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
                      <input type="number" class="form-input clima-input" data-field="area" placeholder="Ex: 50" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell">
                      <label>Tipo de Construção:</label>
                      <select class="form-input clima-input" data-field="tipoConstrucao" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                        <option value="">Selecione</option>
                        <option value="alvenaria">Alvenaria</option>
                        <option value="eletrocentro">Eletrocentro</option>
                      </select>
                    </div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>Parede Oeste (m):</label>
                      <input type="number" class="form-input clima-input" data-field="paredeOeste" placeholder="Ex: 5.5" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell">
                      <label>Parede Leste (m):</label>
                      <input type="number" class="form-input clima-input" data-field="paredeLeste" placeholder="Ex: 5.5" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>Parede Norte (m):</label>
                      <input type="number" class="form-input clima-input" data-field="paredeNorte" placeholder="Ex: 8.0" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell">
                      <label>Parede Sul (m):</label>
                      <input type="number" class="form-input clima-input" data-field="paredeSul" placeholder="Ex: 8.0" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>Pé Direito (m):</label>
                      <input type="number" class="form-input clima-input" data-field="peDireito" placeholder="Ex: 3.0" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell clima-cell-empty"></div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>Divisória Área Não Climatizada 1 (m²):</label>
                      <input type="number" class="form-input clima-input" data-field="divisoriaNaoClima1" placeholder="Ex: 10" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell">
                      <label>Divisória Área Não Climatizada 2 (m²):</label>
                      <input type="number" class="form-input clima-input" data-field="divisoriaNaoClima2" placeholder="Ex: 10" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>Divisória Área Climatizada 1 (m²):</label>
                      <input type="number" class="form-input clima-input" data-field="divisoriaClima1" placeholder="Ex: 15" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell">
                      <label>Divisória Área Climatizada 2 (m²):</label>
                      <input type="number" class="form-input clima-input" data-field="divisoriaClima2" placeholder="Ex: 15" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>Dissipação (W):</label>
                      <input type="number" class="form-input clima-input" data-field="dissipacao" placeholder="Ex: 5000" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell">
                      <label>N° Pessoas:</label>
                      <input type="number" class="form-input clima-input" data-field="numPessoas" placeholder="Ex: 10" min="0" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>N° Portas Duplas:</label>
                      <input type="number" class="form-input clima-input" data-field="numPortasDuplas" placeholder="Ex: 2" min="0" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell">
                      <label>N° Portas Simples:</label>
                      <input type="number" class="form-input clima-input" data-field="numPortasSimples" placeholder="Ex: 3" min="0" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>Pressurização (Pa):</label>
                      <input type="number" class="form-input clima-input" data-field="pressurizacao" placeholder="Ex: 50" step="0.01" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                    <div class="clima-cell">
                      <label>Setpoint (°C):</label>
                      <input type="number" class="form-input clima-input" data-field="setpoint" placeholder="Ex: 22" step="0.1" onchange="calculateVazaoAr('${projectName}-${roomName}')">
                    </div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell clima-cell-result">
                      <label>Vazão de Ar Externo (l/s):</label>
                      <div class="result-value-inline" id="vazao-ar-${projectName}-${roomName}">0</div>
                    </div>
                    <div class="clima-cell clima-cell-empty"></div>
                  </div>
                  <div class="clima-row">
                    <div class="clima-cell">
                      <label>Combate a Incêndio:</label>
                      <select class="form-input clima-input" data-field="combateIncendio" onchange="calculateVazaoAr('${projectName}-${roomName}')">
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
            <button class="minimizer" onclick="toggleSection('${projectName}-${roomName}-maquinas')">+</button>
            <h4 class="section-title">Máquinas</h4>
            <button class="btn btn-add-small" onclick="addMachine('${projectName}-${roomName}')">+ Adicionar Máquina</button>
          </div>
          <div class="section-content collapsed" id="section-content-${projectName}-${roomName}-maquinas">
            <div class="machines-container" id="machines-${projectName}-${roomName}">
              <p class="empty-message">Nenhuma máquina adicionada ainda.</p>
            </div>
          </div>
        </div>

        <!-- Seção: Configuração Geral -->
        <div class="section-block">
          <div class="section-header">
            <button class="minimizer" onclick="toggleSection('${projectName}-${roomName}-config')">+</button>
            <h4 class="section-title">Configuração Geral</h4>
          </div>
          <div class="section-content collapsed" id="section-content-${projectName}-${roomName}-config">
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
          <button class="btn btn-update" onclick="updateRoom('${projectName}', '${roomName}')">Atualizar Dados</button>
          <button class="btn btn-save" onclick="saveRoom('${projectName}', '${roomName}')">Salvar</button>
        </div>
      </div>
    </div>
  `

  const addRoomSection = projectContent.querySelector(".add-room-section")
  addRoomSection.insertAdjacentHTML("beforebegin", roomHTML)

  // Remove mensagem vazia se existir
  const emptyMessage = projectContent.querySelector(".empty-message")
  if (emptyMessage) {
    emptyMessage.remove()
  }

  console.log(`[v0] Sala ${roomName} criada (vazia)`)
}

// ============================================
// FUNÇÕES DE MINIMIZAR/EXPANDIR
// ============================================

/**
 * Alterna entre estado minimizado e expandido de um projeto
 * Controla a visibilidade do conteúdo do projeto
 * Atualiza o texto do botão minimizador
 */
function toggleProject(projectName) {
  const content = document.getElementById(`project-content-${projectName}`)
  const minimizer = event.target

  if (content.classList.contains("collapsed")) {
    content.classList.remove("collapsed")
    minimizer.textContent = "−"
  } else {
    content.classList.add("collapsed")
    minimizer.textContent = "+"
  }
}

/**
 * Alterna entre estado minimizado e expandido de uma sala
 * Controla a visibilidade do conteúdo da sala
 * Atualiza o texto do botão minimizador
 */
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

/**
 * Alterna entre estado minimizado e expandido de uma seção
 * Controla a visibilidade do conteúdo da seção
 * Atualiza o texto do botão minimizador
 */
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

/**
 * Alterna entre estado minimizado e expandido de uma subseção
 * Controla a visibilidade do conteúdo da subseção
 * Atualiza o texto do botão minimizador
 */

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

/**
 * Adiciona um novo projeto à interface
 * Gera nome automático baseado no contador
 * Chama createEmptyProject para criar a estrutura HTML
 */
async function addNewProject() {
  const nextNumber = await getNextProjectNumber()
  const projectName = `Projeto${nextNumber}`

  createEmptyProject(projectName, null)
  console.log(`[v0] ${projectName} adicionado à interface`)
}

/**
 * Deleta um projeto da interface (apenas visual, não remove do backup.json)
 * Remove o elemento HTML do projeto após confirmação do usuário
 * Mantém os dados no servidor
 */
function deleteProject(projectName) {
  if (confirm("Tem certeza que deseja deletar este projeto da tela? Os dados permanecerão salvos no servidor.")) {
    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
    projectBlock.remove()

    console.log(`[v0] Projeto ${projectName} removido da tela (apenas visual)`)
  }
}


/**
 * Salva um projeto completo no json-server
 * Extrai dados de todas as salas do projeto
 * Cria novo projeto ou atualiza existente baseado no ID
 * Minimiza o projeto após salvar com sucesso
 */
async function saveProject(projectName) {
  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  const projectId = projectBlock.dataset.projectId

  // Extrai dados do projeto
  const projectData = {
    nome: projectBlock.querySelector(".project-title").textContent.trim(),
    salas: [],
  }

  // Extrai dados de todas as salas
  const roomBlocks = projectBlock.querySelectorAll(".room-block")
  roomBlocks.forEach((roomBlock, index) => {
    const roomData = extractRoomData(roomBlock)
    roomData.id = index + 1
    projectData.salas.push(roomData)
  })

  // Se o projeto já tem ID, atualiza; senão, cria novo
  let result
  if (projectId) {
    projectData.id = Number.parseInt(projectId)
    result = await updateProject(projectId, projectData)
  } else {
    result = await createProject(projectData)
    if (result) {
      // Atualiza o data-project-id no DOM
      projectBlock.dataset.projectId = result.id
    }
  }

  if (result) {
    const projectContent = document.getElementById(`project-content-${projectName}`)
    const minimizer = projectBlock.querySelector(".project-header .minimizer")

    if (projectContent && !projectContent.classList.contains("collapsed")) {
      projectContent.classList.add("collapsed")
      if (minimizer) {
        minimizer.textContent = "+"
      }
    }

    console.log(`[v0] Projeto ${projectName} salvo com sucesso e minimizado`)
  }
}

/**
 * Verifica os dados de um projeto
 * Analisa todos os campos preenchidos em cada sala
 * Gera relatório com estatísticas de preenchimento
 * Exibe alerta com o resumo da verificação
 */
function verifyProjectData(projectName) {
  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  const rooms = projectBlock.querySelectorAll(".room-block")

  let report = `Verificação do Projeto:\n\n`
  report += `Total de salas: ${rooms.length}\n\n`

  rooms.forEach((room) => {
    const roomName = room.querySelector(".room-title").textContent
    const inputs = room.querySelectorAll(".form-input")
    const filledInputs = Array.from(inputs).filter((input) => input.value.trim() !== "").length
    const totalInputs = inputs.length
    const percentage = totalInputs > 0 ? ((filledInputs / totalInputs) * 100).toFixed(1) : 0

    report += `${roomName}: ${filledInputs}/${totalInputs} campos preenchidos (${percentage}%)\n`
  })

  alert(report)
  console.log(`[v0] Verificação do projeto ${projectName} concluída`)
}

// ============================================
// FUNÇÕES DE EDIÇÃO INLINE
// ============================================

/**
 * Habilita edição inline de títulos de projetos e salas
 * Transforma o elemento em editável e seleciona o conteúdo
 * Controla salvamento com Enter e cancelamento com Escape
 */
function makeEditable(element, type) {
  if (element.classList.contains("editing")) {
    return
  }

  const originalText = element.textContent.trim()
  element.dataset.originalText = originalText

  element.contentEditable = true
  element.classList.add("editing")

  const range = document.createRange()
  const selection = window.getSelection()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)

  element.focus()

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
 * Salva a edição inline de um título
 * Valida se o texto não está vazio
 * Atualiza o conteúdo do elemento e registra a mudança
 */
function saveInlineEdit(element, type) {
  const newText = element.textContent.trim()
  const originalText = element.dataset.originalText

  element.contentEditable = false
  element.classList.remove("editing")

  if (newText === "") {
    element.textContent = originalText
    alert("O nome não pode estar vazio.")
    return
  }

  if (newText !== originalText) {
    element.textContent = newText
    console.log(`[v0] ${type === "project" ? "Projeto" : "Sala"} renomeado para: ${newText}`)
  }

  delete element.dataset.originalText
}


/**
 * Cancela a edição inline e restaura o texto original
 * Reverte para o conteúdo anterior sem salvar alterações
 */
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

/**
 * Adiciona uma nova sala a um projeto
 * Gera nome automático baseado no número de salas existentes
 * Chama createEmptyRoom para criar a estrutura HTML
 */
function addNewRoom(projectName) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const roomCount = projectContent.querySelectorAll(".room-block").length + 1
  const roomName = `Sala${roomCount}`

  createEmptyRoom(projectName, roomName, null)
  console.log(`[v0] ${roomName} adicionada ao ${projectName}`)
}


/**
 * Deleta uma sala da interface (apenas visual, não remove do backup.json)
 * Remove o elemento HTML da sala após confirmação
 * Mostra mensagem vazia se não houver mais salas no projeto
 */
function deleteRoom(projectName, roomName) {
  if (confirm("Tem certeza que deseja deletar esta sala da tela? Os dados permanecerão salvos no servidor.")) {
    const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
    const projectContent = roomBlock.closest(".project-content")

    roomBlock.remove()

    // Se não houver mais salas, mostra mensagem vazia
    const remainingRooms = projectContent.querySelectorAll(".room-block")
    if (remainingRooms.length === 0) {
      const addRoomSection = projectContent.querySelector(".add-room-section")
      addRoomSection.insertAdjacentHTML("beforebegin", '<p class="empty-message">Adicione salas a este projeto...</p>')
    }

    console.log(`[v0] Sala ${roomName} removida da tela (apenas visual)`)
  }
}

/**
 * Atualiza os dados de uma sala (validação local)
 * Verifica campos obrigatórios preenchidos
 * Aplica estilos visuais para campos inválidos
 * Exibe alerta com resultado da validação
 */
function updateRoom(projectName, roomName) {
  const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
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
    console.log(`[v0] Dados da sala ${roomName} atualizados`)
  }
}

/**
 * Salva os dados de uma sala (salva o projeto inteiro)
 * Chama saveProject para persistir todos os dados do projeto
 * Inclui a sala específica no processo de salvamento
 */ 
//AQUI DEVERIA SALVAR APENAS A SALA NO BACKEND AO INVES DE SALVAR TUDO, DOIS BOTÕES DIFERENTES UM DE SALA, QUE SALVA A SALA(ADICIONA OU ALTERA AS INFORMAÇÕES), OUTRO DO PROJETO QUE SALVA O PROJETO COMPLETO
async function saveRoom(projectName, roomName) {
  console.log(`[v0] Salvando sala ${roomName} do projeto ${projectName}`)

  // Salva o projeto inteiro (que inclui todas as salas)
  await saveProject(projectName)
}

/**
 * Extrai dados de uma sala para JSON
 * Coleta informações de climatização, máquinas e configuração geral
 * Estrutura os dados no formato adequado para persistência
 */
function extractRoomData(roomBlock) {
  const roomData = {
    nome: roomBlock.querySelector(".room-title").textContent.trim(),
    climatizacao: {},
    maquinas: [],
    configuracaoGeral: {},
  }

  // Extrai dados de climatização
  const climaInputs = roomBlock.querySelectorAll(".clima-input")
  climaInputs.forEach((input) => {
    const field = input.dataset.field
    if (field) {
      roomData.climatizacao[field] = input.value
    }
  })

  // Extrai dados de máquinas
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
    roomData.maquinas.push(machineData)
  })

  // Extrai dados de configuração geral
  const configSection = roomBlock.querySelector('[id*="-config"]')
  if (configSection) {
    const responsavelInput = configSection.querySelector('input[placeholder*="responsável"]')
    if (responsavelInput) {
      roomData.configuracaoGeral.responsavel = responsavelInput.value
    }

    const dataInput = configSection.querySelector('input[type="date"]')
    if (dataInput) {
      roomData.configuracaoGeral.dataInstalacao = dataInput.value
    }

    const obsInput = configSection.querySelector("textarea")
    if (obsInput) {
      roomData.configuracaoGeral.observacoes = obsInput.value
    }
  }

  return roomData
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE MÁQUINAS
// ============================================

/**
 * Adiciona uma nova máquina a uma sala
 * Cria formulário para dados da máquina com campos padrão
 * Remove mensagem de "nenhuma máquina" se existir
 */
function addMachine(roomId) {
  const machinesContainer = document.getElementById(`machines-${roomId}`)
  const machineCount = machinesContainer.querySelectorAll(".machine-item").length + 1

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
  console.log(`[v0] Máquina ${machineCount} adicionada`)
}

/**
 * Deleta uma máquina
 * Remove o elemento HTML da máquina após confirmação
 * Restaura mensagem de "nenhuma máquina" se for a última
 */
function deleteMachine(button) {
  if (confirm("Deseja remover esta máquina?")) {
    const machineItem = button.closest(".machine-item")
    const machinesContainer = machineItem.closest(".machines-container")
    machineItem.remove()

    if (machinesContainer.querySelectorAll(".machine-item").length === 0) {
      machinesContainer.innerHTML = '<p class="empty-message">Nenhuma máquina adicionada ainda.</p>'
    }

    console.log("[v0] Máquina removida")
  }
}

// ============================================
// FUNÇÕES DE EXPORTAÇÃO
// ============================================

/**
 * Prepara download do projeto em formato PDF
 * Exibe alerta informativo (funcionalidade a ser implementada)
 * Será integrada com bibliotecas como jsPDF ou html2pdf.js
 */
function downloadPDF(projectName) {
  // ... implementação
}

/**
 * Prepara download do projeto em formato Word
 * Exibe alerta informativo (funcionalidade a ser implementada)
 * Será integrada com bibliotecas como docx.js
 */
function downloadWord(projectName) {
  // ... implementação
}

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Calcula a Vazão de Ar Externo para uma sala
 * Utiliza constantes do sistema e fórmulas específicas
 * Processa dados de portas, pressurização e constantes PD/PS
 * Executa cálculo passo a passo similar à planilha Excel
 * Atualiza o resultado na interface do usuário
 */
async function calculateVazaoAr(roomId) {
  // Espera até systemConstants estar carregado
  while (!systemConstants) {
    console.log("[v0] aguardando constantes do sistema...")
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  if (!systemConstants.VARIAVEL_PD || !systemConstants.VARIAVEL_PS) {
    console.error("[v0] ERRO: Constantes do sistema não carregadas corretamente.")
    alert("ERRO: As constantes do sistema não foram carregadas corretamente.")
    return
  }

  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (!roomContent) return

  const climaSection = roomContent.querySelector('[id*="-clima"]')
  if (!climaSection) return

  const VARIAVEL_PD = systemConstants.VARIAVEL_PD
  const VARIAVEL_PS = systemConstants.VARIAVEL_PS

  console.log("[v0] ===== INÍCIO DO CÁLCULO DE VAZÃO =====")
  console.log("[v0] Constantes carregadas:")
  console.log("[v0] VARIAVEL_PD:", VARIAVEL_PD)
  console.log("[v0] VARIAVEL_PS:", VARIAVEL_PS)

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

  // Fórmula: 0.827 * B18 * VARIAVEL_PD * (B20^0.5) * 3600
  const auxPortasDuplas = 0.827 * numPortasDuplas * VARIAVEL_PD * Math.pow(pressurizacao, 0.5) * 3600

  // Fórmula: 0.827 * B19 * VARIAVEL_PS * (B20^0.5) * 3600
  const auxPortasSimples = 0.827 * numPortasSimples * VARIAVEL_PS * Math.pow(pressurizacao, 0.5) * 3600

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
}
