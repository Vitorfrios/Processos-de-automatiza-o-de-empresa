/**
 * =====================
 * Gerenciador de obras - obra-manager.js
 * SISTEMA CORRIGIDO COM IDs ÚNICOS
 * =====================
 */

import { 
    showConfirmationModal, 
    undoDeletion,
    hideToast 
} from './modal/modal.js'

/**
 * Cria uma obra vazia na interface
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra (opcional)
 */
function createEmptyObra(obraName, obraId) {
    // ✅ CORREÇÃO: SEMPRE usar ID único, mesmo se fornecido (para consistência)
    const finalObraId = obraId || generateObraId();
    const obraHTML = buildObraHTML(obraName, finalObraId);
    insertObraIntoDOM(obraHTML);
    console.log(`🏗️ Obra ${obraName} criada - ID: ${finalObraId}`);
}

/**
 * Constrói o HTML de uma obra
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID único da obra
 * @returns {string} HTML da obra
 */
function buildObraHTML(obraName, obraId) {
    // ✅ CORREÇÃO: Validar ID único
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (buildObraHTML) obra-manager.js [ID de obra inválido: ${obraId}]`);
        obraId = generateObraId();
    }
    
    console.log(`🔍 Build Obra HTML: ${obraName}, ID: ${obraId}`);

    return `
    <div class="obra-block" data-obra-id="${obraId}" data-obra-name="${obraName}">
      <div class="obra-header">
        <!-- ✅ CORREÇÃO: usar APENAS obraId para toggle -->
        <button class="minimizer" onclick="toggleObra('${obraId}', event)">+</button>
        <h2 class="obra-title editable-title" data-editable="true" onclick="makeEditable(this, 'obra')">${obraName}</h2>
        <div class="obra-actions">
          <button class="btn btn-delete" onclick="window.deleteObra('${obraName}', '${obraId}')">Remover Obra</button>
        </div>
      </div>
      <!-- ✅ CORREÇÃO: usar APENAS obraId no conteúdo -->
      <div class="obra-content collapsed" id="obra-content-${obraId}">
        <div class="projects-container" id="projects-${obraId}">
          <p class="empty-message">Adicione projetos a esta obra...</p>
        </div>
        <div class="add-project-section">
          <!-- ✅ CORREÇÃO: Passar obraId para a função -->
          <button class="btn btn-add-secondary" onclick="addNewProjectToObra('${obraId}')">+ Adicionar Projeto</button>
        </div>
        ${buildObraActionsFooter(obraName, !!obraId)}
      </div>
    </div>
  `;
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
  if (!projectsContainer) {
    console.error('❌ Container de projetos não encontrado')
    return
  }
  projectsContainer.insertAdjacentHTML("beforeend", obraHTML)
}

/**
 * Atualiza o botão de uma obra após salvamento
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra salva
 */
function updateObraButtonAfterSave(obraName, obraId) {
  // ✅ CORREÇÃO: Buscar APENAS por ID único
  const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`)
  if (!obraBlock) {
    console.error(`❌ Obra com ID ${obraId} não encontrada para atualizar botão`)
    return
  }

  obraBlock.dataset.obraId = obraId

  const obraContent = document.getElementById(`obra-content-${obraId}`)
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
    console.error(`❌ Conteúdo da obra ${obraId} não encontrado`)
  }
}

/**
 * Função principal de deletar obra (ATUALIZADA)
 */
async function deleteObra(obraName, obraId) {
  // ✅ CORREÇÃO: Buscar APENAS por ID único
  const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`)
  if (!obraBlock) {
    console.error(`❌ Obra com ID ${obraId} não encontrada`)
    return
  }

  // Mostra o modal personalizado em vez do confirm básico
  showConfirmationModal(obraName, obraId, obraBlock)
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
    
    // ✅ CORREÇÃO: Gerar ID único para nova obra
    const obraId = generateObraId()

    console.log(`🏗️ Criando nova obra: ${obraName} com ID: ${obraId}`)
    createEmptyObra(obraName, obraId)
    console.log(`✅ ${obraName} adicionada com ID único: ${obraId}`)

  } catch (error) {
    console.error("❌ Erro ao adicionar nova obra:", error)
    alert("Erro ao criar nova obra. Verifique o console para detalhes.")
  }
}

// =============================================================================
// SISTEMA DE IDs ÚNICOS PARA OBRAS
// =============================================================================

/**
 * Gera ID único para obra - CURTO E ÚNICO
 * @returns {string} ID único da obra
 */
function generateObraId() {
    const letters = 'abcdefghjkmnpqrstwxyz'
    const randomLetter = letters[Math.floor(Math.random() * letters.length)]
    const randomNum = Math.floor(Math.random() * 90) + 10
    return `obra_${randomLetter}${randomNum}`
}

// ===== EXPORTAÇÕES E CONFIGURAÇÃO GLOBAL =====

// Torne as funções globais para o HTML poder acessar
window.deleteObra = deleteObra
window.addNewObra = addNewObra
window.undoDeletion = undoDeletion
window.hideToast = hideToast

// Exportações para módulos
export {
    createEmptyObra,
    buildObraHTML,
    buildObraActionsFooter,
    insertObraIntoDOM,
    updateObraButtonAfterSave,
    deleteObra,
    getNextObraNumber,
    addNewObra,
    generateObraId
}