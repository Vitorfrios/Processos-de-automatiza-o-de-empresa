/**
 * ui/helpers.js
 * 🎯 FUSÃO: ui-helpers.js → ui/helpers.js
 * ⚡ REFATORAÇÃO: Import atualizado + compatibilidade global
 */

import { UI_CONSTANTS } from '../core/constants.js';

/**
 * Utilitários de interface do usuário - SISTEMA UNIFICADO
 */

/**
 * Alterna a visibilidade de um elemento (expandir/recolher)
 * @param {string} contentId - ID do elemento a ser alternado
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function toggleElementVisibility(contentId, minimizerElement) {
  const content = document.getElementById(contentId);
  if (!content) {
    console.error(`❌ Elemento ${contentId} não encontrado para toggle`);
    return;
  }

  const isCollapsed = content.classList.contains(UI_CONSTANTS.COLLAPSED_CLASS);

  if (isCollapsed) {
    expandElement(content, minimizerElement);
  } else {
    collapseElement(content, minimizerElement);
  }
}

/**
 * Expande um elemento na interface
 * @param {HTMLElement} element - Elemento a ser expandido
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function expandElement(element, minimizerElement) {
  element.classList.remove(UI_CONSTANTS.COLLAPSED_CLASS);
  minimizerElement.textContent = UI_CONSTANTS.EXPANDED_SYMBOL;
}

/**
 * Recolhe um elemento na interface
 * @param {HTMLElement} element - Elemento a ser recolhido
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function collapseElement(element, minimizerElement) {
  element.classList.add(UI_CONSTANTS.COLLAPSED_CLASS);
  minimizerElement.textContent = UI_CONSTANTS.MINIMIZED_SYMBOL;
}

/**
 * Calcula estatísticas de preenchimento de uma sala
 * @param {HTMLElement} room - Elemento da sala
 * @returns {Object} Estatísticas de preenchimento
 */
function calculateRoomCompletionStats(room) {
  const inputs = room.querySelectorAll(".form-input, .clima-input");
  const filledInputs = Array.from(inputs).filter((input) => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      return input.checked;
    }
    return input.value && input.value.trim() !== "";
  }).length;

  const totalInputs = inputs.length;
  const percentage = totalInputs > 0 ? ((filledInputs / totalInputs) * 100).toFixed(1) : 0;

  return {
    filled: filledInputs,
    total: totalInputs,
    percentage: percentage,
  };
}

/**
 * Remove a mensagem de "obra vazia" quando projetos são adicionados
 * @param {string} obraName - Nome da obra
 */
function removeEmptyObraMessage(obraName) {
  const projectsContainer = document.getElementById(`projects-${obraName}`);
  if (projectsContainer) {
    const emptyMessage = projectsContainer.querySelector(".empty-message");
    if (emptyMessage) {
      console.log(`🗑️ Removendo mensagem de obra vazia: ${obraName}`);
      emptyMessage.remove();
    }
  }
}

/**
 * Exibe mensagem de "obra vazia" se não houver projetos
 * @param {string} obraName - Nome da obra
 */
function showEmptyObraMessageIfNeeded(obraName) {
  const projectsContainer = document.getElementById(`projects-${obraName}`);
  if (projectsContainer) {
    const projects = projectsContainer.querySelectorAll(".project-block");
    
    if (projects.length === 0) {
      const existingMessage = projectsContainer.querySelector(".empty-message");
      if (!existingMessage) {
        console.log(`📝 Exibindo mensagem de obra vazia: ${obraName}`);
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'Adicione projetos a esta obra...';
        projectsContainer.appendChild(emptyMessage);
      }
    } else {
      removeEmptyObraMessage(obraName);
    }
  }
}

/**
 * Remove a mensagem de "projeto vazio" quando salas são adicionadas
 * @param {HTMLElement} projectContent - Elemento do conteúdo do projeto
 */
function removeEmptyProjectMessage(projectContent) {
  const emptyMessage = projectContent.querySelector(".empty-message");
  if (emptyMessage) {
    console.log(`🗑️ Removendo mensagem de projeto vazio`);
    emptyMessage.remove();
  }
}

/**
 * Exibe mensagem de "projeto vazio" se não houver salas
 * @param {HTMLElement} projectContent - Elemento do conteúdo do projeto
 */
function showEmptyProjectMessageIfNeeded(projectContent) {
  const remainingRooms = projectContent.querySelectorAll(".room-block");

  if (remainingRooms.length === 0) {
    const existingMessage = projectContent.querySelector(".empty-message");
    if (!existingMessage) {
      console.log(`📝 Exibindo mensagem de projeto vazio`);
      const addRoomSection = projectContent.querySelector(".add-room-section");
      if (addRoomSection) {
        addRoomSection.insertAdjacentHTML("beforebegin", '<p class="empty-message">Adicione salas a este projeto...</p>');
      }
    }
  } else {
    removeEmptyProjectMessage(projectContent);
  }
}

/**
 * 🆕 FUNÇÃO ADICIONAL: Verifica se elemento está visível
 * @param {string} elementId - ID do elemento
 * @returns {boolean} True se visível
 */
function isElementVisible(elementId) {
  const element = document.getElementById(elementId);
  return element && !element.classList.contains(UI_CONSTANTS.COLLAPSED_CLASS);
}

/**
 * 🆕 FUNÇÃO ADICIONAL: Alterna todos os elementos de um container
 * @param {string} containerId - ID do container
 * @param {boolean} expand - True para expandir, false para recolher
 */
function toggleAllElements(containerId, expand = true) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const minimizers = container.querySelectorAll('.minimizer');
  const contents = container.querySelectorAll('.collapsible-content');

  contents.forEach((content, index) => {
    const minimizer = minimizers[index];
    if (minimizer && content) {
      if (expand) {
        expandElement(content, minimizer);
      } else {
        collapseElement(content, minimizer);
      }
    }
  });
}


/**
 * 🆕 RECOLHER ELEMENTO COM ANIMAÇÃO
 */
function collapseElementWithAnimation(element, minimizerElement) {
    // Adicionar classe de animação
    element.classList.add('collapsing');
    
    // Definir altura atual
    const currentHeight = element.scrollHeight;
    element.style.height = currentHeight + 'px';
    
    // Forçar reflow
    element.offsetHeight;
    
    // Animar para altura 0
    setTimeout(() => {
        element.style.height = '0px';
        element.style.overflow = 'hidden';
    }, 10);
    
    // Finalizar animação
    setTimeout(() => {
        element.classList.add("collapsed");
        element.classList.remove("collapsing");
        element.style.height = '';
        element.style.overflow = '';
        minimizerElement.textContent = "+";
        
        console.log(`📁 Elemento recolhido com animação: ${element.id}`);
    }, 37);
}

/**
 * 🆕 EXPANDIR ELEMENTO COM ANIMAÇÃO  
 */
function expandElementWithAnimation(element, minimizerElement) {
    // Remover classe collapsed
    element.classList.remove("collapsed");
    element.classList.add("expanding");
    
    // Definir altura para auto após animação
    setTimeout(() => {
        const fullHeight = element.scrollHeight;
        element.style.height = '0px';
        
        // Forçar reflow
        element.offsetHeight;
        
        // Animar para altura completa
        element.style.height = fullHeight + 'px';
        
        // Finalizar animação
        setTimeout(() => {
            element.classList.remove("expanding");
            element.style.height = '';
            minimizerElement.textContent = "−";
            
            console.log(`📂 Elemento expandido com animação: ${element.id}`);
        }, 37);
    }, 10);
}


// Exportações para módulos ES6
export {
  toggleElementVisibility,
  expandElement,
  collapseElement,
  calculateRoomCompletionStats,
  removeEmptyObraMessage,
  showEmptyObraMessageIfNeeded,
  removeEmptyProjectMessage,
  showEmptyProjectMessageIfNeeded,
  isElementVisible,
  toggleAllElements
};

// Compatibilidade global para scripts legados
if (typeof window !== 'undefined') {
  window.toggleElementVisibility = toggleElementVisibility;
  window.expandElement = expandElement;
  window.collapseElement = collapseElement;
  window.calculateRoomCompletionStats = calculateRoomCompletionStats;
  window.removeEmptyObraMessage = removeEmptyObraMessage;
  window.showEmptyObraMessageIfNeeded = showEmptyObraMessageIfNeeded;
  window.removeEmptyProjectMessage = removeEmptyProjectMessage;
  window.showEmptyProjectMessageIfNeeded = showEmptyProjectMessageIfNeeded;
  window.isElementVisible = isElementVisible;
  window.toggleAllElements = toggleAllElements;
}