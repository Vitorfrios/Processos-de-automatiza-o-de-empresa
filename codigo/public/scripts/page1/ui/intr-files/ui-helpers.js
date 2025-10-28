import { UI_CONSTANTS } from '../../config/config.js'

/**
 * Utilitários de interface do usuário
 */

/**
 * Alterna a visibilidade de um elemento (expandir/recolher)
 * @param {string} contentId - ID do elemento a ser alternado
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function toggleElementVisibility(contentId, minimizerElement) {
  const content = document.getElementById(contentId)
  if (!content) {
    console.error(`❌ Elemento ${contentId} não encontrado para toggle`)
    return
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

export {
    toggleElementVisibility,
    expandElement,
    collapseElement,
    calculateRoomCompletionStats,
    removeEmptyObraMessage,
    showEmptyObraMessageIfNeeded,
    removeEmptyProjectMessage,
    showEmptyProjectMessageIfNeeded,
}