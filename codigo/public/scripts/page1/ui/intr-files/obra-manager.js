/**
 * =====================
 * Gerenciador de obras - obra-manager.js
 * =====================
 */

import { removeObraFromSession } from '../../data/server.js'

// Variáveis globais para controle do modal
let pendingDeletion = {
    obraName: null,
    obraId: null,
    obraBlock: null
};

/**
 * Cria uma obra vazia na interface
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra (opcional)
 */
function createEmptyObra(obraName, obraId) {
  const finalObraId = obraId; 
  const obraHTML = buildObraHTML(obraName, finalObraId);
  insertObraIntoDOM(obraHTML);
  console.log(`🏗️ Obra ${obraName} criada - Botão: ${finalObraId ? 'ATUALIZAR OBRA' : 'SALVAR OBRA'}`);
}

/**
 * Constrói o HTML de uma obra
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra
 * @returns {string} HTML da obra
 */
function buildObraHTML(obraName, obraId) {
  const hasId = obraId && obraId !== "" && obraId !== "null" && obraId !== "undefined";

  console.log(`🔍 Build Obra HTML: ${obraName}, ID: ${obraId}, HasId: ${hasId}, Botão: ${hasId ? 'ATUALIZAR' : 'SALVAR'}`);

  return `
    <div class="obra-block" data-obra-id="${obraId || ""}" data-obra-name="${obraName}">
      <div class="obra-header">
        <button class="minimizer" onclick="toggleObra('${obraName}', event)">+</button>
        <h2 class="obra-title editable-title" data-editable="true" onclick="makeEditable(this, 'obra')">${obraName}</h2>
        <div class="obra-actions">
          <button class="btn btn-delete" onclick="window.deleteObra('${obraName}')">Remover Obra</button>
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
 * Mostra o modal de confirmação
 */
function showConfirmationModal(obraName, obraId, obraBlock) {
    pendingDeletion = {
        obraName,
        obraId,
        obraBlock
    };

    const modal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    
    // Mensagem atualizada
    modalMessage.innerHTML = `
        <strong>"${obraName}"</strong> será removida <span style="color: #ff6b6b; font-weight: bold; text-decoration: underline;">apenas da tela</span>.<br><br>
        
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem; border-radius: 8px;">
            <span style="color: #51f956ff; font-size: 1.2rem;">✓</span>
            <small style="color: #ffffffff;">A obra permanece salva no servidor e pode ser recuperada a qualquer momento.</small>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
    
    setTimeout(() => {
        document.querySelector('.btn-cancel').focus();
    }, 100);
}

/**
 * Fecha o modal de confirmação
 */
function closeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
    pendingDeletion = { obraName: null, obraId: null, obraBlock: null };
}

/**
 * Confirma e executa a exclusão
 */
async function confirmDeletion() {
    const { obraName, obraId, obraBlock } = pendingDeletion;
    
    if (!obraName) return;
    
    closeConfirmationModal();
    
    // Efeito visual de remoção
    if (obraBlock) {
        // Adiciona animação de saída
        obraBlock.style.transition = 'all 0.5s ease';
        obraBlock.style.transform = 'translateX(-100%)';
        obraBlock.style.opacity = '0';
        
        setTimeout(() => {
            obraBlock.remove();
            console.log(`🗑️ Obra ${obraName} removida do DOM`);
        }, 500);
    }
    
    // Remove do servidor se tiver ID
    if (obraId && obraId !== "" && obraId !== "null" && obraId !== "undefined") {
        try {
            const response = await fetch(`/api/sessions/remove-obra/${obraId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log(`🗑️ Obra ${obraName} (ID: ${obraId}) removida da sessão`);
            } else {
                console.error(`❌ Falha ao remover obra ${obraName} da sessão`);
            }
        } catch (error) {
            console.error(`❌ Erro ao remover obra ${obraName} da sessão:`, error);
        }
    } else {
        console.log(`ℹ️ Obra ${obraName} não tinha ID salvo, apenas removida do DOM`);
    }
}

/**
 * Função principal de deletar obra (ATUALIZADA)
 */
async function deleteObra(obraName) {
    const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`);
    if (!obraBlock) return;

    const obraId = obraBlock.dataset.obraId;
    
    // Mostra o modal personalizado em vez do confirm básico
    showConfirmationModal(obraName, obraId, obraBlock);
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

// ===== EVENT LISTENERS E CONFIGURAÇÃO GLOBAL =====

// Event listeners para os botões do modal
document.addEventListener('DOMContentLoaded', () => {
    // Botões do modal
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-action="cancel"]')) {
            closeConfirmationModal();
        }
        if (e.target.matches('[data-action="confirm"]')) {
            confirmDeletion();
        }
    });
    
    // Fecha modal clicando fora
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmationModal') {
                closeConfirmationModal();
            }
        });
    }
});

// Fecha modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeConfirmationModal();
    }
});

// ===== EXPORTAÇÕES E CONFIGURAÇÃO GLOBAL =====

// Torne as funções globais para o HTML poder acessar
window.closeConfirmationModal = closeConfirmationModal;
window.confirmDeletion = confirmDeletion;
window.showConfirmationModal = showConfirmationModal;
window.deleteObra = deleteObra;
window.addNewObra = addNewObra;

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
    showConfirmationModal,
    closeConfirmationModal,
    confirmDeletion
}