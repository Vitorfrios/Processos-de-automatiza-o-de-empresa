import { UI_CONSTANTS } from '../config/config.js'
import { createEmptyRoom } from '../data/rooms.js'
import { generateObraId, generateProjectId, generateRoomId } from '../data/data-utils.js'

/**
 * Exibe um banner de status do sistema (sucesso, erro, etc.)
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de status ('success', 'error', etc.)
 */
function showSystemStatus(message, type) {
  removeExistingStatusBanner()

  const banner = createStatusBanner(message, type)
  insertStatusBanner(banner)

  if (type === "success") {
    scheduleStatusBannerRemoval(banner)
  }
}

/**
 * Remove qualquer banner de status existente
 */
function removeExistingStatusBanner() {
  const existingBanner = document.getElementById("system-status-banner")
  if (existingBanner) {
    existingBanner.remove()
  }
}

/**
 * Cria um elemento de banner de status
 * @param {string} message - Mensagem do banner
 * @param {string} type - Tipo de banner
 * @returns {HTMLElement} Elemento do banner criado
 */
function createStatusBanner(message, type) {
  const banner = document.createElement("div")
  banner.id = "system-status-banner"
  banner.className = `system-status-banner ${type}`
  banner.textContent = message
  return banner
}

/**
 * Insere o banner de status no DOM
 * @param {HTMLElement} banner - Banner a ser inserido
 */
function insertStatusBanner(banner) {
  const mainContent = document.querySelector(".main-content")
  mainContent.insertBefore(banner, mainContent.firstChild)
}

/**
 * Agenda a remoção automática do banner de sucesso
 * @param {HTMLElement} banner - Banner a ser removido
 */
function scheduleStatusBannerRemoval(banner) {
  setTimeout(() => {
    banner.remove()
  }, UI_CONSTANTS.SUCCESS_MESSAGE_DURATION)
}

/**
 * Alterna a visibilidade de um elemento (expandir/recolher)
 * @param {string} contentId - ID do elemento a ser alternado
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function toggleElementVisibility(contentId, minimizerElement) {
  const content = document.getElementById(contentId)
  if (!content) {
    console.error(`❌ Elemento ${contentId} não encontrado para toggle`);
    return;
  }

  const isCollapsed = content.classList.contains(UI_CONSTANTS.COLLAPSED_CLASS)

  if (isCollapsed) {
    expandElement(content, minimizerElement)
  } else {
    collapseElement(content, minimizerElement)
  }
}

/**
 * Expande um elemento na interface
 * @param {HTMLElement} element - Elemento a ser expandido
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function expandElement(element, minimizerElement) {
  element.classList.remove(UI_CONSTANTS.COLLAPSED_CLASS)
  minimizerElement.textContent = UI_CONSTANTS.EXPANDED_SYMBOL
}

/**
 * Recolhe um elemento na interface
 * @param {HTMLElement} element - Elemento a ser recolhido
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function collapseElement(element, minimizerElement) {
  element.classList.add(UI_CONSTANTS.COLLAPSED_CLASS)
  minimizerElement.textContent = UI_CONSTANTS.MINIMIZED_SYMBOL
}

/**
 * Alterna a visibilidade de uma obra - CORRIGIDO
 */
function toggleObra(obraName, event) {
  const contentId = `obra-content-${obraName}`;
  const content = document.getElementById(contentId);
  
  if (!content) {
    console.error(`❌ Conteúdo da obra ${obraName} não encontrado`);
    return;
  }

  const isCollapsed = content.classList.contains("collapsed");
  const minimizer = event.target;

  if (isCollapsed) {
    // EXPANDIR
    content.classList.remove("collapsed");
    minimizer.textContent = "−";
    console.log(`📂 Obra ${obraName} expandida`);
  } else {
    // RECOLHER
    content.classList.add("collapsed");
    minimizer.textContent = "+";
    console.log(`📁 Obra ${obraName} recolhida`);
  }
}

/**
 * Alterna a visibilidade de um projeto - CORRIGIDO
 */
function toggleProject(projectName, event) {
  const contentId = `project-content-${projectName}`;
  const content = document.getElementById(contentId);
  
  if (!content) {
    console.error(`❌ Conteúdo do projeto ${projectName} não encontrado`);
    return;
  }

  const isCollapsed = content.classList.contains("collapsed");
  const minimizer = event.target;

  if (isCollapsed) {
    // EXPANDIR
    content.classList.remove("collapsed");
    minimizer.textContent = "−";
    console.log(`📂 Projeto ${projectName} expandido`);
  } else {
    // RECOLHER
    content.classList.add("collapsed");
    minimizer.textContent = "+";
    console.log(`📁 Projeto ${projectName} recolhido`);
  }
}

/**
 * Alterna a visibilidade de uma sala - CORREÇÃO DEFINITIVA COM BUSCA HIERÁRQUICA
 */
function toggleRoom(roomId, event) {
    console.log(`🔧 Toggle Sala chamado: ID ${roomId}`, event);
    
    // ✅ CORREÇÃO CRÍTICA: Buscar a sala específica pelo ID MAS garantindo que é a correta
    // Primeiro encontrar TODAS as salas com esse ID
    const allRoomsWithId = document.querySelectorAll(`[data-room-id="${roomId}"]`);
    
    if (allRoomsWithId.length === 0) {
        console.error(`❌ Nenhuma sala encontrada com ID: ${roomId}`);
        return;
    }
    
    if (allRoomsWithId.length > 1) {
        console.warn(`⚠️  Múltiplas salas encontradas com ID: ${roomId} (${allRoomsWithId.length} salas)`);
        
        // ✅ CORREÇÃO: Encontrar a sala CORRETA baseada no contexto do clique
        const clickedElement = event.target;
        const roomBlock = clickedElement.closest('.room-block');
        
        if (roomBlock && roomBlock.dataset.roomId === roomId) {
            // Usar a sala onde o clique ocorreu
            console.log(`✅ Usando sala do contexto do clique: ${roomId}`);
            toggleSpecificRoom(roomBlock, roomId, event);
            return;
        }
    }
    
    // Se há apenas uma sala ou não encontrou pelo contexto, usar a primeira
    const roomBlock = allRoomsWithId[0];
    toggleSpecificRoom(roomBlock, roomId, event);
}

/**
 * Alterna uma sala específica - FUNÇÃO AUXILIAR
 */
function toggleSpecificRoom(roomBlock, roomId, event) {
    const contentId = `room-content-${roomId}`;
    const content = document.getElementById(contentId);
    
    if (!content) {
        console.error(`❌ Conteúdo da sala ${roomId} não encontrado`);
        console.log(`🔍 Procurando por: ${contentId}`);
        return;
    }

    const isCollapsed = content.classList.contains("collapsed");
    const minimizer = event.target;

    console.log(`📂 Estado da sala ${roomId}: ${isCollapsed ? 'recolhida' : 'expandida'} (Obra: ${roomBlock.dataset.obraName}, Projeto: ${roomBlock.dataset.projectName})`);

    if (isCollapsed) {
        // EXPANDIR
        content.classList.remove("collapsed");
        minimizer.textContent = "−";
        console.log(`📂 Sala ${roomId} EXPANDIDA`);
    } else {
        // RECOLHER
        content.classList.add("collapsed");
        minimizer.textContent = "+";
        console.log(`📁 Sala ${roomId} RECOLHIDA`);
    }
}

/**
 * Alterna a visibilidade de uma seção
 * @param {string} sectionId - ID da seção
 */
function toggleSection(sectionId) {
  toggleElementVisibility(`section-content-${sectionId}`, event.target)
}

/**
 * Alterna a visibilidade de uma subseção
 * @param {string} subsectionId - ID da subseção
 */
function toggleSubsection(subsectionId) {
  toggleElementVisibility(`subsection-content-${subsectionId}`, event.target)
}

/**
 * Cria uma obra vazia na interface - CORREÇÃO COMPLETA
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra (opcional)
 */
function createEmptyObra(obraName, obraId) {
  // CORREÇÃO: Para obra NOVA, NÃO passar ID ou passar null
  const finalObraId = null; // SEMPRE null para obra nova

  const obraHTML = buildObraHTML(obraName, finalObraId)
  insertObraIntoDOM(obraHTML)
  console.log(`🏗️ Obra ${obraName} criada - Botão: SALVAR OBRA`)
}

/**
 * Constrói o HTML de uma obra - CORREÇÃO DEFINITIVA
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
          <button class="btn btn-delete" onclick="deleteObra('${obraName}')">Remover Obra</button>
        </div>
      </div>
      <div class="obra-content collapsed" id="obra-content-${obraName}">
        <p class="empty-message">Adicione projetos a esta obra...</p>
        <div class="projects-container" id="projects-${obraName}">
          <!-- Projetos serão inseridos aqui -->
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
 * Constrói o rodapé de ações da obra - CORREÇÃO DEFINITIVA
 * @param {string} obraName - Nome da obra
 * @param {boolean} hasId - Se a obra já foi SALVA no servidor
 * @returns {string} HTML do rodapé de ações
 */
function buildObraActionsFooter(obraName, hasId = false) {
  // LÓGICA CORRETA:
  // hasId = FALSE (obra NÃO salva) → "Salvar Obra" 
  // hasId = TRUE (obra JÁ salva) → "Atualizar Obra"
  const buttonText = hasId ? "Atualizar Obra" : "Salvar Obra";
  const buttonClass = hasId ? "btn-update" : "btn-save";

  console.log(`🔧 Build Obra Footer: ${obraName}, HasId: ${hasId}, Button: ${buttonText}`);

  return `
    <div class="obra-actions-footer">
      <button class="btn btn-verify" onclick="verifyObraData('${obraName}')">Verificar Dados</button>
      <button class="btn ${buttonClass}" onclick="event.preventDefault(); saveOrUpdateObra('${obraName}')">${buttonText}</button>
      <button class="btn btn-download" onclick="downloadPDF('${obraName}')">Baixar PDF</button>
      <button class="btn btn-download" onclick="downloadWord('${obraName}')">Baixar Word</button>
    </div>
  `;
}

/**
 * Atualiza o botão de uma obra após salvamento - CORREÇÃO
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra salva
 */
function updateObraButtonAfterSave(obraName, obraId) {
  const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`);
  if (!obraBlock) {
    console.error(`❌ Obra ${obraName} não encontrada para atualizar botão`);
    return;
  }

  // Atualizar o ID no DOM
  obraBlock.dataset.obraId = obraId;

  // CORREÇÃO: Agora a obra foi SALVA no servidor, então hasId = TRUE
  const obraContent = document.getElementById(`obra-content-${obraName}`);
  if (obraContent) {
    const oldFooter = obraContent.querySelector('.obra-actions-footer');
    if (oldFooter) {
      const newFooter = buildObraActionsFooter(obraName, true); // TRUE = obra SALVA no servidor
      oldFooter.outerHTML = newFooter;
      console.log(`🔄 Botão da obra ${obraName} ATUALIZADO para "Atualizar Obra" (ID: ${obraId})`);
    } else {
      console.error(`❌ Rodapé não encontrado na obra ${obraName}`);
    }
  } else {
    console.error(`❌ Conteúdo da obra ${obraName} não encontrado`);
  }
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
 * Cria um projeto vazio dentro de uma obra - ATUALIZADO com hierarquia de IDs
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} projectId - ID do projeto (opcional)
 */
function createEmptyProject(obraName, projectName, projectId) {
  const obraElement = document.querySelector(`[data-obra-name="${obraName}"]`);
  if (!obraElement) {
    console.error(`❌ Obra ${obraName} não encontrada`);
    return;
  }

  const finalProjectId = projectId || generateProjectId(obraElement);
  const projectHTML = buildProjectHTML(obraName, projectName, finalProjectId)
  const obraProjectsContainer = document.getElementById(`projects-${obraName}`)

  if (obraProjectsContainer) {
    obraProjectsContainer.insertAdjacentHTML("beforeend", projectHTML)
    removeEmptyObraMessage(obraName)
    console.log(`📁 Projeto ${projectName} criado na obra ${obraName} com ID: ${finalProjectId}`)
  } else {
    console.error(`❌ Container de projetos não encontrado para obra ${obraName}`)
  }
}

/**
 * Constrói o HTML de um projeto dentro de uma obra - CORRIGIDO com IDs únicos
 */
function buildProjectHTML(obraName, projectName, projectId) {
    const hasId = projectId !== null && projectId !== undefined && projectId !== "";

    // ✅ CORREÇÃO: IDs únicos para projetos
    const uniqueProjectId = `${obraName}-${projectName}`.replace(/\s+/g, '-');

    return `
    <div class="project-block" data-project-id="${projectId || ""}" data-project-name="${projectName}" data-obra-name="${obraName}">
      <div class="project-header">
        <button class="minimizer" onclick="toggleProject('${uniqueProjectId}', event)">+</button>
        <h3 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">${projectName}</h3>
        <div class="project-actions">
          <button class="btn btn-delete" onclick="deleteProject('${obraName}', '${projectName}')">Remover</button>
        </div>
      </div>
      <div class="project-content collapsed" id="project-content-${uniqueProjectId}">
        <p class="empty-message">Adicione salas a este projeto...</p>
        <div class="add-room-section">
          <button class="btn btn-add-secondary" onclick="addNewRoom('${obraName}', '${projectName}', '${uniqueProjectId}')">+ Adicionar Nova Sala</button>
        </div>
      </div>
    </div>
  `;
}
/**
 * Adiciona um novo projeto à obra especificada - ATUALIZADO
 * @param {string} obraName - Nome da obra
 */
function addNewProjectToObra(obraName) {
  try {
    const projectNumber = getNextProjectNumber(obraName)
    const projectName = `Projeto${projectNumber}`

    createEmptyProject(obraName, projectName, null)

    const defaultRoomName = "Sala1"
    createEmptyRoom(obraName, projectName, defaultRoomName, null)

    console.log(`📁 ${projectName} adicionado à obra ${obraName} com sala padrão: ${defaultRoomName}`)

  } catch (error) {
    console.error("❌ Erro ao adicionar novo projeto:", error)
    alert("Erro ao criar novo projeto. Verifique o console para detalhes.")
  }
}

/**
 * Adiciona uma nova obra à interface - CORREÇÃO COMPLETA
 */
async function addNewObra() {
  try {
    const obraNumber = getNextObraNumber()
    const obraName = `Obra${obraNumber}`

    console.log(`🏗️ Criando nova obra: ${obraName}`)

    // CORREÇÃO: Sempre criar obra com ID = null para obra nova
    createEmptyObra(obraName, null)

    console.log(`✅ ${obraName} adicionada com botão SALVAR OBRA`)

  } catch (error) {
    console.error("❌ Erro ao adicionar nova obra:", error)
    alert("Erro ao criar nova obra. Verifique o console para detalhes.")
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
    showSystemStatus("Obra removida com sucesso", "success")
  }
}

/**
 * Função única para salvar ou atualizar obra - CORREÇÃO DEFINITIVA
 * @param {string} obraName - Nome da obra
 * @param {Event} event - Evento do clique
 */
function saveOrUpdateObra(obraName, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log(`💾 SALVANDO/ATUALIZANDO OBRA: "${obraName}"`);

  // ✅ CORREÇÃO: Debug para verificar se a obra existe
  const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`);
  if (!obraBlock) {
    console.error(`❌ Obra "${obraName}" não encontrada no DOM para salvar`);
    console.log('🔍 Obras disponíveis no DOM:');
    document.querySelectorAll('[data-obra-name]').forEach(obra => {
      console.log(`  - ${obra.dataset.obraName}`);
    });
    showSystemStatus(`ERRO: Obra "${obraName}" não encontrada`, "error");
    return;
  }

  console.log(`✅ Obra encontrada no DOM:`, obraBlock.dataset);

  // CORREÇÃO: Chama a função real de salvamento do projects.js
  if (typeof window.saveObra === 'function') {
    window.saveObra(obraName, event);
  } else {
    console.error('❌ Função saveObra não encontrada no window');
    showSystemStatus("ERRO: Funcionalidade de salvar não disponível", "error");
  }
}


/**
 * Verifica os dados de uma obra
 * @param {string} obraName - Nome da obra
 */
function verifyObraData(obraName) {
  const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`)
  if (!obraBlock) return

  const projects = obraBlock.querySelectorAll(".project-block")
  let totalRooms = 0
  let report = `Verificação da Obra "${obraName}":\n\n`
  report += `Total de projetos: ${projects.length}\n\n`

  projects.forEach((project, index) => {
    const projectName = project.dataset.projectName
    const rooms = project.querySelectorAll(".room-block")
    totalRooms += rooms.length

    report += `Projeto ${index + 1}: ${projectName}\n`
    report += `  - Salas: ${rooms.length}\n`

    rooms.forEach((room, roomIndex) => {
      const roomName = room.querySelector(".room-title")?.textContent || `Sala ${roomIndex + 1}`
      const stats = calculateRoomCompletionStats(room)
      report += `    - ${roomName}: ${stats.filled}/${stats.total} campos (${stats.percentage}%)\n`
    })
    report += '\n'
  })

  report += `RESUMO: ${projects.length} projetos, ${totalRooms} salas`

  alert(report)
}

/**
 * Calcula estatísticas de preenchimento de uma sala
 * @param {HTMLElement} room - Elemento da sala
 * @returns {Object} Estatísticas de preenchimento
 */
function calculateRoomCompletionStats(room) {
  const inputs = room.querySelectorAll(".form-input, .clima-input")
  const filledInputs = Array.from(inputs).filter((input) => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      return input.checked
    }
    return input.value && input.value.trim() !== ""
  }).length

  const totalInputs = inputs.length
  const percentage = totalInputs > 0 ? ((filledInputs / totalInputs) * 100).toFixed(1) : 0

  return {
    filled: filledInputs,
    total: totalInputs,
    percentage: percentage,
  }
}

/**
 * Obtém o próximo número de obra - ATUALIZADO para usar hierarquia
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
 * Obtém o próximo número de projeto dentro de uma obra - NOVA FUNÇÃO
 * @param {string} obraName - Nome da obra
 * @returns {number} Próximo número disponível para projeto
 */
function getNextProjectNumber(obraName) {
  const obraElement = document.querySelector(`[data-obra-name="${obraName}"]`);
  if (!obraElement) return 1;

  const projects = obraElement.querySelectorAll('.project-block');
  const projectNumbers = Array.from(projects).map(project => {
    const projectName = project.dataset.projectName;
    const match = projectName.match(/Projeto(\d+)/);
    return match ? parseInt(match[1]) : 0;
  });

  const maxNumber = Math.max(0, ...projectNumbers);
  return maxNumber + 1;
}

/**
 * Remove a mensagem de "obra vazia" quando projetos são adicionados
 * @param {string} obraName - Nome da obra
 */
function removeEmptyObraMessage(obraName) {
  const obraContent = document.getElementById(`obra-content-${obraName}`)
  if (obraContent) {
    const emptyMessage = obraContent.querySelector(".empty-message")
    if (emptyMessage) {
      emptyMessage.remove()
    }
  }
}

/**
 * Exibe mensagem de "obra vazia" se não houver projetos
 * @param {string} obraName - Nome da obra
 */
function showEmptyObraMessageIfNeeded(obraName) {
  const obraContent = document.getElementById(`obra-content-${obraName}`)
  if (obraContent) {
    const projectsContainer = obraContent.querySelector(`#projects-${obraName}`)
    const remainingProjects = projectsContainer ? projectsContainer.querySelectorAll(".project-block") : []

    if (remainingProjects.length === 0) {
      const emptyMessage = document.createElement('p')
      emptyMessage.className = 'empty-message'
      emptyMessage.textContent = 'Adicione projetos a esta obra...'

      if (projectsContainer) {
        projectsContainer.insertAdjacentElement('beforebegin', emptyMessage)
      }
    }
  }
}

/**
 * Remove a mensagem de "projeto vazio" quando salas são adicionadas
 * @param {HTMLElement} projectContent - Elemento do conteúdo do projeto
 */
function removeEmptyProjectMessage(projectContent) {
  const emptyMessage = projectContent.querySelector(".empty-message")
  if (emptyMessage) {
    emptyMessage.remove()
  }
}

/**
 * Exibe mensagem de "projeto vazio" se não houver salas
 * @param {HTMLElement} projectContent - Elemento do conteúdo do projeto
 */
function showEmptyProjectMessageIfNeeded(projectContent) {
  const remainingRooms = projectContent.querySelectorAll(".room-block")

  if (remainingRooms.length === 0) {
    const addRoomSection = projectContent.querySelector(".add-room-section")
    addRoomSection.insertAdjacentHTML("beforebegin", '<p class="empty-message">Adicione salas a este projeto...</p>')
  }
}

// CORREÇÃO: Adicionar funções de download (placeholders)
function downloadPDF(obraName, projectName = null) {
  const target = projectName ? `projeto ${projectName} da obra ${obraName}` : `obra ${obraName}`
  console.log(`📄 Gerando PDF para ${target}`)
  showSystemStatus(`Gerando PDF para ${target}...`, "info")
}

function downloadWord(obraName, projectName = null) {
  const target = projectName ? `projeto ${projectName} da obra ${obraName}` : `obra ${obraName}`
  console.log(`📝 Gerando Word para ${target}`)
  showSystemStatus(`Gerando documento Word para ${target}...`, "info")
}

// Funções de compatibilidade (para manter funcionamento com código existente)
function addNewProject() {
  // Por padrão, cria uma obra com um projeto dentro
  addNewObra().then(() => {
    const obraNumber = getNextObraNumber() - 1 // Última obra criada
    const obraName = `Obra${obraNumber}`
    addNewProjectToObra(obraName)
  })
}

// Exportações atualizadas
export {
  showSystemStatus,
  removeExistingStatusBanner,
  createStatusBanner,
  insertStatusBanner,
  scheduleStatusBannerRemoval,
  toggleElementVisibility,
  expandElement,
  collapseElement,
  toggleObra,
  toggleProject,
  toggleRoom,
  toggleSection,
  toggleSubsection,
  createEmptyObra,
  buildObraHTML,
  buildObraActionsFooter,
  insertObraIntoDOM,
  createEmptyProject,
  buildProjectHTML,
  addNewObra,
  addNewProjectToObra,
  getNextObraNumber,
  getNextProjectNumber,
  removeEmptyObraMessage,
  showEmptyObraMessageIfNeeded,
  removeEmptyProjectMessage,
  showEmptyProjectMessageIfNeeded,
  addNewProject, // Export para compatibilidade
  deleteObra,
  saveOrUpdateObra, // CORREÇÃO: função única
  updateObraButtonAfterSave,
  verifyObraData,
  downloadPDF,
  downloadWord,
  calculateRoomCompletionStats,
  createEmptyRoom,
}

// Disponibilização global das funções - ATUALIZADA
if (typeof window !== 'undefined') {
  window.addNewObra = addNewObra
  window.addNewProjectToObra = addNewProjectToObra
  window.toggleObra = toggleObra
  window.toggleProject = toggleProject
  window.toggleRoom = toggleRoom
  window.getNextObraNumber = getNextObraNumber
  window.deleteObra = deleteObra
  window.saveOrUpdateObra = saveOrUpdateObra // CORREÇÃO: função única
  window.verifyObraData = verifyObraData
  window.downloadPDF = downloadPDF
  window.downloadWord = downloadWord
  window.addNewProject = addNewProject // Compatibilidade
}