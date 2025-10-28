
/**
 * =====================
 * Gerenciador de obras - obra-maganer.js
 * =====================
 */

/**
 * Cria uma obra vazia na interface
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra (opcional)
 */
function createEmptyObra(obraName, obraId) {
  const finalObraId = null
  const obraHTML = buildObraHTML(obraName, finalObraId)
  insertObraIntoDOM(obraHTML)
  console.log(`🏗️ Obra ${obraName} criada - Botão: SALVAR OBRA`)
}

/**
 * Constrói o HTML de uma obra
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra
 * @returns {string} HTML da obra
 */
function buildObraHTML(obraName, obraId) {
  const hasId = obraId && obraId !== "" && obraId !== "null" && obraId !== "undefined"

  console.log(`🔍 Build Obra HTML: ${obraName}, ID: ${obraId}, HasId: ${hasId}, Botão: ${hasId ? 'ATUALIZAR' : 'SALVAR'}`)

  return `
    <div class="obra-block" data-obra-id="${obraId || ""}" data-obra-name="${obraName}">
      <div class="obra-header">
        <button class="minimizer" onclick="toggleObra('${obraName}', event)">+</button>
        <h2 class="obra-title editable-title" data-editable="true" onclick="makeEditable(this, 'obra')">${obraName}</h2>
        <div class="obra-actions">
          <button class="btn btn-delete" onclick="deleteObra('${obraName}')">Remover Obra</button>
        </div>
      </div>
      <div class="obra-content collapsed" id="obra-content-${obraName}">
        <div class="projects-container" id="projects-${obraName}">
          <!-- Projetos serão inseridos aqui -->
          <p class="empty-message">Adicione projetos a esta obra...</p>
        </div>
        <div class="add-project-section">
          <button class="btn btn-add-secondary" onclick="addNewProjectToObra('${obraName}')">+ Adicionar Projeto</button>
        </div>
        ${buildObraActionsFooter(obraName, hasId)}
      </div>
    </div>
  `
}

/**
 * Constrói o rodapé de ações da obra
 * @param {string} obraName - Nome da obra
 * @param {boolean} hasId - Se a obra já foi SALVA no servidor
 * @returns {string} HTML do rodapé de ações
 */
function buildObraActionsFooter(obraName, hasId = false) {
  const buttonText = hasId ? "Atualizar Obra" : "Salvar Obra"
  const buttonClass = hasId ? "btn-update" : "btn-save"

  console.log(`🔧 Build Obra Footer: ${obraName}, HasId: ${hasId}, Button: ${buttonText}`)

  return `
    <div class="obra-actions-footer">
      <button class="btn btn-verify" onclick="verifyObraData('${obraName}')">Verificar Dados</button>
      <button class="btn ${buttonClass}" onclick="event.preventDefault(); saveOrUpdateObra('${obraName}')">${buttonText}</button>
      <button class="btn btn-download" onclick="downloadPDF('${obraName}')">Baixar PDF</button>
      <button class="btn btn-download" onclick="downloadWord('${obraName}')">Baixar Word</button>
    </div>
  `
}

/**
 * Insere o HTML da obra no DOM
 * @param {string} obraHTML - HTML da obra a ser inserida
 */
function insertObraIntoDOM(obraHTML) {
  const projectsContainer = document.getElementById("projects-container")
  projectsContainer.insertAdjacentHTML("beforeend", obraHTML)
}

/**
 * Atualiza o botão de uma obra após salvamento
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra salva
 */
function updateObraButtonAfterSave(obraName, obraId) {
  const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`)
  if (!obraBlock) {
    console.error(`❌ Obra ${obraName} não encontrada para atualizar botão`)
    return
  }

  obraBlock.dataset.obraId = obraId

  const obraContent = document.getElementById(`obra-content-${obraName}`)
  if (obraContent) {
    const oldFooter = obraContent.querySelector('.obra-actions-footer')
    if (oldFooter) {
      const newFooter = buildObraActionsFooter(obraName, true)
      oldFooter.outerHTML = newFooter
      console.log(`🔄 Botão da obra ${obraName} ATUALIZADO para "Atualizar Obra" (ID: ${obraId})`)
    } else {
      console.error(`❌ Rodapé não encontrado na obra ${obraName}`)
    }
  } else {
    console.error(`❌ Conteúdo da obra ${obraName} não encontrado`)
  }
}

/**
 * Remove uma obra
 * @param {string} obraName - Nome da obra
 */
function deleteObra(obraName) {
  if (!confirm("Tem certeza que deseja remover esta obra e todos os seus projetos?")) return

  const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`)
  if (obraBlock) {
    obraBlock.remove()
    console.log(`🗑️ Obra ${obraName} removida`)
  }
}

/**
 * Obtém o próximo número de obra
 * @returns {number} Próximo número disponível para obra
 */
function getNextObraNumber() {
  const obraBlocks = document.querySelectorAll('.obra-block')
  const obraNumbers = Array.from(obraBlocks).map(obra => {
    const obraName = obra.dataset.obraName
    const match = obraName.match(/Obra(\d+)/)
    return match ? parseInt(match[1]) : 0
  })

  const maxNumber = Math.max(0, ...obraNumbers)
  return maxNumber + 1
}

/**
 * Adiciona uma nova obra à interface
 */
async function addNewObra() {
  try {
    const obraNumber = getNextObraNumber()
    const obraName = `Obra${obraNumber}`

    console.log(`🏗️ Criando nova obra: ${obraName}`)
    createEmptyObra(obraName, null)
    console.log(`✅ ${obraName} adicionada com botão SALVAR OBRA`)

  } catch (error) {
    console.error("❌ Erro ao adicionar nova obra:", error)
    alert("Erro ao criar nova obra. Verifique o console para detalhes.")
  }
}

export {
    createEmptyObra,
    buildObraHTML,
    buildObraActionsFooter,
    insertObraIntoDOM,
    updateObraButtonAfterSave,
    deleteObra,
    getNextObraNumber,
    addNewObra,
}