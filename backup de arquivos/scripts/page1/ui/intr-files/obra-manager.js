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

import { generateObraId } from '../../data/data-files/data-utils-core.js';
import {addNewProjectToObra} from './project-manager.js'


/**
 * Cria uma obra vazia na interface - CORRIGIDA
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra (opcional)
 */
async function createEmptyObra(obraName, obraId) {
    // ✅ CORREÇÃO: SEMPRE usar ID único, mesmo se fornecido (para consistência)
    const finalObraId = obraId || generateObraId();
    const obraHTML = buildObraHTML(obraName, finalObraId);
    
    console.log(`🏗️ Criando obra: ${obraName} com ID: ${finalObraId}`);
    console.log(`📝 HTML gerado:`, obraHTML.substring(0, 200) + '...');
    
    // ✅✅✅ CORREÇÃO CRÍTICA: Inserir no DOM e CONFIRMAR
    const inserted = await insertObraIntoDOM(obraHTML, finalObraId);
    
    if (inserted) {
        console.log(`✅ Obra ${obraName} criada e INSERIDA NO DOM - ID: ${finalObraId}`);
        
        // ✅ CONFIRMAÇÃO: Verificar se realmente está no DOM
        setTimeout(() => {
            const obraNoDOM = document.querySelector(`[data-obra-id="${finalObraId}"]`);
            if (obraNoDOM) {
                console.log(`✅ CONFIRMADO: Obra ${finalObraId} encontrada no DOM`);
            } else {
                console.error(`❌ FALHA CRÍTICA: Obra ${finalObraId} NÃO está no DOM após criação`);
            }
        }, 100);
    } else {
        console.error(`❌ FALHA: Obra ${obraName} NÃO FOI INSERIDA NO DOM`);
    }
    
    return inserted;
}
/**
 * Constrói o HTML de uma obra
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID único da obra
 * @returns {string} HTML da obra
 */
function buildObraHTML(obraName, obraId, hasId = false) {
  // ✅ CORREÇÃO: Validar ID único
  if (!obraId || obraId === 'undefined' || obraId === 'null') {
      console.error(`ERRO FALBACK (buildObraHTML) obra-manager.js [ID de obra inválido: ${obraId}]`);
      obraId = generateObraId();
  }
  
  console.log(`🔍 Build Obra HTML: ${obraName}, ID: ${obraId}`);

  return `
  <div class="obra-block" data-obra-id="${obraId}" data-obra-name="${obraName}">
    <div class="obra-header">
      <button class="minimizer" onclick="toggleObra('${obraId}', event)">+</button>
      <h2 class="obra-title compact-title editable-title" data-editable="true" onclick="makeEditable(this, 'obra')">${obraName}</h2>
      <div class="obra-header-spacer"><span>Adicionar campos de cadastro de empresas</span></div>
      <div class="obra-actions">
        <button class="btn btn-delete" onclick="window.deleteObra('${obraName}', '${obraId}')">Remover Obra</button>
      </div>
    </div>

    
    <div class="obra-content collapsed" id="obra-content-${obraId}">
      <div class="projetc-header-record very-dark">
          <span>Adicionar campos de cadastro de empresas</span>
      </div>
      <div class="projects-container" id="projects-${obraId}">

      </div>
      <div class="add-project-section">
        <button class="btn btn-add-secondary" onclick="addNewProjectToObra('${obraId}')">+ Adicionar Projeto</button>
      </div>
      ${buildObraActionsFooter(obraId, obraName, hasId)} 
 
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
function buildObraActionsFooter(obraId, obraName, hasId = false) {
  const buttonText = hasId ? "Atualizar Obra" : "Salvar Obra";
  const buttonClass = hasId ? "btn-update" : "btn-save";

  console.log(`🔧 Build Obra Footer: ${obraName}, ID: ${obraId}, HasId: ${hasId}, Button: ${buttonText}`);

  // ✅ CORREÇÃO: Usar obraId em TODAS as chamadas
  return `
    <div class="obra-actions-footer">
      <button class="btn btn-verify" onclick="verifyObraData('${obraId}')">Verificar Dados</button>
      <button class="btn ${buttonClass}" onclick="event.preventDefault(); saveOrUpdateObra('${obraId}')">${buttonText}</button>      
      <button class="btn btn-download" onclick="downloadPDF('${obraId}')">Baixar PDF</button>
      <button class="btn btn-download" onclick="downloadWord('${obraId}')">Baixar Word</button>
    </div>
  `;
}

/**
 * Insere o HTML da obra no DOM - CORRIGIDA
 * @param {string} obraHTML - HTML da obra a ser inserida
 * @param {string} obraId - ID da obra para debug
 * @returns {boolean} True se inserido com sucesso
 */
async function insertObraIntoDOM(obraHTML, obraId) {
    console.log(`📤 Inserindo obra no DOM: ${obraId}`);
    
    const projectsContainer = document.getElementById("projects-container");
    
    if (!projectsContainer) {
        console.error('❌ Container de projetos não encontrado');
        
        // ✅ FALLBACK: Tentar criar o container
        console.log('🔄 Tentando criar projects-container...');
        const mainContent = document.querySelector('main, body');
        if (mainContent) {
            const newContainer = document.createElement('div');
            newContainer.id = 'projects-container';
            newContainer.innerHTML = '<!-- Hierarquia: Obra → Projeto → Sala -->';
            mainContent.appendChild(newContainer);
            console.log('✅ projects-container criado');
            return insertObraIntoDOM(obraHTML, obraId); // Tentar novamente
        }
        
        return false;
    }
    
    console.log(`✅ Container encontrado, inserindo obra ${obraId}...`);
    console.log(`📦 Container antes:`, projectsContainer.children.length, 'elementos');
    
    try {
        projectsContainer.insertAdjacentHTML("beforeend", obraHTML);
        
        // ✅ CONFIRMAR inserção
        setTimeout(() => {
            const obraInserida = document.querySelector(`[data-obra-id="${obraId}"]`);
            if (obraInserida) {
                console.log(`✅ Obra ${obraId} INSERIDA COM SUCESSO no container`);
                console.log(`📦 Container depois:`, projectsContainer.children.length, 'elementos');
            } else {
                console.error(`❌ FALHA: Obra ${obraId} NÃO FOI INSERIDA no container`);
            }
        }, 50);
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao inserir obra no DOM:', error);
        return false;
    }
}

/**
 * Atualiza o botão de uma obra após salvamento - CORRIGIDA (APENAS ID)
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra salva
 */
function updateObraButtonAfterSave(obraName, obraId) {
    console.log(`🔄 Atualizando botão da obra: ${obraName} (${obraId})`);
    
    // ✅ BUSCAR APENAS POR ID ÚNICO
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraBlock) {
        console.error(`❌ Obra com ID ${obraId} não encontrada para atualizar botão`);
        return; // ❌ NUNCA tentar buscar por nome
    }

    // ✅ ATUALIZAR ID NO DATASET (para garantir consistência)
    obraBlock.dataset.obraId = obraId;

    // ✅ BUSCAR CONTEÚDO DA OBRA APENAS POR ID
    const obraContent = document.getElementById(`obra-content-${obraId}`);
    if (!obraContent) {
        console.error(`❌ Conteúdo da obra ${obraId} não encontrado`);
        return;
    }

    // ✅ BUSCAR RODAPÉ APENAS DENTRO DA OBRA ESPECÍFICA
    const oldFooter = obraContent.querySelector('.obra-actions-footer');
    if (!oldFooter) {
        console.error(`❌ Rodapé não encontrado na obra ${obraId}`);
        return;
    }

    // ✅ CORREÇÃO CRÍTICA: Atualizar APENAS o botão, preservando o container de projetos
    const saveButton = oldFooter.querySelector('.btn-save, .btn-update');
    if (saveButton) {
        saveButton.textContent = "Atualizar Obra";
        saveButton.className = "btn btn-update";
        saveButton.setAttribute('onclick', `event.preventDefault(); saveOrUpdateObra('${obraId}')`);
        console.log(`✅ Botão atualizado para: "Atualizar Obra" (ID: ${obraId})`);
    } else {
        console.error(`❌ Botão de salvar não encontrado na obra ${obraId}`);
    }

    // ✅ VERIFICAR se o container de projetos ainda existe (apenas por ID)
    const projectsContainer = document.getElementById(`projects-${obraId}`);
    if (!projectsContainer) {
        console.error(`❌ CRÍTICO: Container de projetos PERDIDO na obra ${obraId}!`);
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
    const obraNumber = getNextObraNumber();
    const obraName = `Obra${obraNumber}`;
    
    // ✅ CORREÇÃO: Gerar ID único para nova obra
    const obraId = generateObraId();

    console.log(`🏗️ Criando nova obra: ${obraName} com ID: ${obraId}`);
    createEmptyObra(obraName, obraId);
    console.log(`✅ ${obraName} adicionada com ID único: ${obraId}`);

    // ✅✅✅ AGUARDAR um pouco para o DOM ser atualizado antes de criar projeto
    setTimeout(async () => {
        console.log(`🔄 Criando projeto e sala automáticos para ${obraName}`);
        if (typeof window.addNewProjectToObra === 'function') {
            await window.addNewProjectToObra(obraId);
            console.log(`✅ Projeto e sala automáticos criados para ${obraName}`);
        } else {
            console.error('❌ addNewProjectToObra não disponível');
        }
    }, 500);

  } catch (error) {
    console.error("❌ Erro ao adicionar nova obra:", error);
    alert("Erro ao criar nova obra. Verifique o console para detalhes.");
  }
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