/**
 * ui/components/edit.js
 * Sistema de edição inline
 * Gerencia edição inline de obras, projetos e salas
 */

import { syncTitleToAmbienteDirect } from "../../core/shared-utils.js";
import { isValidElement } from "../../data/utils/core-utils.js";

// =============================================================================
// SISTEMA DE EDIÇÃO INLINE (De edit.js)
// =============================================================================

/**
 * Inicia o modo de edição inline para um elemento (obra, projeto ou sala)
 * Permite que o usuário edite o texto diretamente no elemento
 * @param {HTMLElement} element - Elemento a ser editado
 * @param {string} type - Tipo do elemento ('obra', 'project', 'room')
 * @returns {void}
 *
 * @example
 * makeEditable(titleElement, 'project') // Torna título do projeto editável
 * makeEditable(roomElement, 'room') // Torna título da sala editável
 */
function makeEditable(element, type) {
  // Validações de segurança
  if (!isValidElement(element)) {
    console.error(" Elemento inválido para edição");
    return;
  }

  if (element.classList.contains("editing")) {
    console.log(" Elemento já está em modo de edição");
    return;
  }

  const originalText = element.textContent.trim();
  element.dataset.originalText = originalText;
  element.dataset.editType = type;

  enableEditing(element);
  selectElementContent(element);
  attachEditingEventListeners(element, type);

  console.log(` Modo edição ativado para ${type}: "${originalText}"`);
}

/**
 * Habilita a edição do elemento configurando contentEditable
 * @param {HTMLElement} element - Elemento a ser habilitado para edição
 * @returns {void}
 */
function enableEditing(element) {
  if (!isValidElement(element)) return;

  element.contentEditable = true;
  element.classList.add("editing");

  // Estilo visual para indicar modo de edição
  element.style.backgroundColor = "#fff3cd";
  element.style.border = "1px solid #ffc107";
  element.style.borderRadius = "3px";
  element.style.padding = "2px 4px";
  element.style.minWidth = "50px";
}

/**
 * Seleciona todo o conteúdo do elemento para facilitar a edição
 * @param {HTMLElement} element - Elemento cujo conteúdo será selecionado
 * @returns {void}
 */
function selectElementContent(element) {
  if (!isValidElement(element)) return;

  // Aguarda um frame para garantir que o elemento está focado
  setTimeout(() => {
    const range = document.createRange();
    const selection = window.getSelection();

    // Limpa seleções anteriores
    selection.removeAllRanges();

    // Seleciona todo o conteúdo
    range.selectNodeContents(element);
    selection.addRange(range);

    element.focus();
  }, 10);
}

/**
 * Anexa event listeners para tratar teclas e perda de foco durante edição
 * @param {HTMLElement} element - Elemento em edição
 * @param {string} type - Tipo do elemento ('obra', 'project', 'room')
 * @returns {void}
 */
function attachEditingEventListeners(element, type) {
  if (!isValidElement(element)) return;

  /**
   * Handler para eventos de teclado
   */
  function handleKeydown(e) {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        saveInlineEdit(element, type);
        element.removeEventListener("keydown", handleKeydown);
        break;

      case "Escape":
        e.preventDefault();
        cancelInlineEdit(element);
        element.removeEventListener("keydown", handleKeydown);
        break;

      case "Tab":
        e.preventDefault();
        saveInlineEdit(element, type);
        // Poderia navegar para próximo elemento editável aqui
        break;
    }
  }

  /**
   * Handler para perda de foco
   */
  function handleBlur() {
    saveInlineEdit(element, type);
    element.removeEventListener("blur", handleBlur);
  }

  // Adiciona listeners
  element.addEventListener("keydown", handleKeydown);
  element.addEventListener("blur", handleBlur, { once: true });
}

/**
 * Salva as alterações feitas durante a edição inline
 * @param {HTMLElement} element - Elemento sendo editado
 * @param {string} type - Tipo do elemento ('obra', 'project', 'room')
 * @returns {void}
 */
function saveInlineEdit(element, type) {
  if (!isValidElement(element)) return;

  const newText = element.textContent.trim();
  const originalText = element.dataset.originalText;

  disableEditing(element);

  // Valida o texto editado
  if (!validateEditedText(newText, originalText, element)) {
    return;
  }

  // Aplica mudanças se houver diferença
  if (newText !== originalText) {
    applyNameChange(element, newText, type, originalText);
  }

  // Limpa dados temporários
  delete element.dataset.originalText;
  delete element.dataset.editType;
}

/**
 * Aplica a mudança de nome ao elemento e atualiza dados relacionados
 * @param {HTMLElement} element - Elemento sendo editado
 * @param {string} newText - Novo texto
 * @param {string} type - Tipo do elemento
 * @param {string} originalText - Texto original
 * @returns {void}
 */

function applyNameChange(element, newText, type, originalText) {
  element.textContent = newText;

  // Atualizar data-attributes de forma mais robusta
  let parentElement;

  if (type === "project") {
    parentElement = element.closest(".project-block");
    if (parentElement) {
      parentElement.dataset.projectName = newText;
      console.log(` Projeto: data-project-name atualizado para "${newText}"`);
    }
  } else if (type === "obra") {
    parentElement = element.closest(".obra-block");
    if (parentElement) {
      parentElement.dataset.obraName = newText;
      console.log(` Obra: data-obra-name atualizado para "${newText}"`);
    }
  } else if (type === "room") {
    parentElement = element.closest(".room-block");
    if (parentElement) {
      parentElement.dataset.roomName = newText;
      console.log(` Sala: data-room-name atualizado para "${newText}"`);

      // Sincronizar com campo ambiente
      const roomId = parentElement.dataset.roomId;
      if (roomId) {
        syncTitleToAmbienteDirect(roomId, newText);
      }
    }
  }

  // Log apropriado
  const entityNames = {
    obra: "Obra",
    project: "Projeto",
    room: "Sala",
  };

  const entityName = entityNames[type] || "Elemento";
  console.log(
    ` ${entityName} renomeado e sincronizado: "${originalText}" → "${newText}"`,
  );

  // Dispara evento customizado
  const changeEvent = new CustomEvent("entity:name-changed", {
    detail: {
      type: type,
      element: element,
      oldName: originalText,
      newName: newText,
      parentElement: parentElement,
      dataAttributeUpdated: !!parentElement,
    },
  });
  element.dispatchEvent(changeEvent);
}

/**
 * Desabilita o modo de edição do elemento
 * @param {HTMLElement} element - Elemento a ser desabilitado
 * @returns {void}
 */
function disableEditing(element) {
  if (!isValidElement(element)) return;

  element.contentEditable = false;
  element.classList.remove("editing");

  // Remove estilos de edição
  element.style.backgroundColor = "";
  element.style.border = "";
  element.style.borderRadius = "";
  element.style.padding = "";
  element.style.minWidth = "";
}

/**
 * Valida o texto editado pelo usuário
 * @param {string} newText - Novo texto inserido
 * @param {string} originalText - Texto original
 * @param {HTMLElement} element - Elemento sendo validado
 * @returns {boolean} True se o texto é válido
 */
function validateEditedText(newText, originalText, element) {
  // Texto vazio
  if (newText === "") {
    element.textContent = originalText;
    showEditError("O nome não pode estar vazio.");
    return false;
  }

  // Texto muito longo
  if (newText.length > 100) {
    element.textContent = originalText;
    showEditError("O nome é muito longo (máximo 100 caracteres).");
    return false;
  }

  // Caracteres inválidos
  const invalidChars = /[<>"/\\&]/;
  if (invalidChars.test(newText)) {
    element.textContent = originalText;
    showEditError("O nome contém caracteres inválidos.");
    return false;
  }

  // Nome não alterado
  if (newText === originalText) {
    console.log(" Nome não alterado");
    return false;
  }

  return true;
}

/**
 * Exibe mensagem de erro durante edição
 * @param {string} message - Mensagem de erro
 * @returns {void}
 */
function showEditError(message) {
  // Poderia usar um sistema de notificação mais sofisticado
  console.error(` Erro na edição: ${message}`);

  // Feedback visual simples
  if (typeof window.showSystemStatus === "function") {
    window.showSystemStatus(message, "error");
  } else {
    alert(message);
  }
}

/**
 * Cancela a edição e restaura o texto original
 * @param {HTMLElement} element - Elemento cuja edição será cancelada
 * @returns {void}
 */
function cancelInlineEdit(element) {
  if (!isValidElement(element)) return;

  const originalText = element.dataset.originalText;
  const editType = element.dataset.editType;

  disableEditing(element);
  element.textContent = originalText;

  // Limpa dados temporários
  delete element.dataset.originalText;
  delete element.dataset.editType;

  console.log(` Edição de ${editType} cancelada: "${originalText}"`);
}

// =============================================================================
// FUNÇÕES AVANÇADAS DE EDIÇÃO
// =============================================================================

/**
 * Torna editável todos os elementos de um tipo específico
 * @param {string} selector - Seletor CSS dos elementos
 * @param {string} type - Tipo dos elementos
 * @returns {void}
 */
function makeAllEditable(selector, type) {
  const elements = document.querySelectorAll(selector);
  console.log(` Tornando ${elements.length} elementos editáveis: ${selector}`);

  elements.forEach((element, index) => {
    // Adiciona pequeno delay para evitar conflitos
    setTimeout(() => {
      makeEditable(element, type);
    }, index * 50);
  });
}

/**
 * Desabilita edição em todos os elementos editáveis
 * @returns {void}
 */
function disableAllEditing() {
  const editingElements = document.querySelectorAll(".editing");
  console.log(` Desativando edição em ${editingElements.length} elementos`);

  editingElements.forEach((element) => {
    disableEditing(element);
  });
}

/**
 * Salva todas as edições pendentes
 * @returns {void}
 */
function saveAllPendingEdits() {
  const editingElements = document.querySelectorAll(".editing");
  console.log(` Salvando ${editingElements.length} edições pendentes`);

  editingElements.forEach((element) => {
    const type = element.dataset.editType || "unknown";
    saveInlineEdit(element, type);
  });
}

/**
 * Verifica se há edições pendentes
 * @returns {boolean} True se há elementos em edição
 */
function hasPendingEdits() {
  return document.querySelectorAll(".editing").length > 0;
}

/**
 * Obtém estatísticas de edição
 * @returns {Object} Estatísticas de edição
 */
function getEditStats() {
  const editingElements = document.querySelectorAll(".editing");
  const stats = {
    totalEditing: editingElements.length,
    byType: {},
  };

  editingElements.forEach((element) => {
    const type = element.dataset.editType || "unknown";
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  return stats;
}

// =============================================================================
// FUNÇÕES DE COMPATIBILIDADE (Para migração gradual)
// =============================================================================

/**
 * Função de compatibilidade para interface.js
 * @param {HTMLElement} element - Elemento a ser editado
 * @param {string} type - Tipo do elemento
 * @returns {void}
 */
function makeEditableCompatibility(element, type) {
  console.log(` [COMPAT] Tornando ${type} editável:`, element);

  // Implementação simplificada para compatibilidade
  if (element.isContentEditable) {
    element.contentEditable = false;
    element.blur();
  } else {
    element.contentEditable = true;
    element.focus();
  }
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

export {
  // Sistema principal de edição
  makeEditable,
  enableEditing,
  selectElementContent,
  attachEditingEventListeners,
  saveInlineEdit,
  disableEditing,
  validateEditedText,
  cancelInlineEdit,

  // Funções avançadas
  makeAllEditable,
  disableAllEditing,
  saveAllPendingEdits,
  hasPendingEdits,
  getEditStats,

  // Funções de aplicação
  applyNameChange,
  showEditError,

  // Compatibilidade
  makeEditableCompatibility,
};

// =============================================================================
// DISPONIBILIZAÇÃO GLOBAL
// =============================================================================

if (typeof window !== "undefined") {
  // Sistema principal
  window.makeEditable = makeEditable;
  window.enableEditing = enableEditing;
  window.disableEditing = disableEditing;
  window.cancelInlineEdit = cancelInlineEdit;
  window.saveInlineEdit = saveInlineEdit;

  // Funções avançadas
  window.makeAllEditable = makeAllEditable;
  window.disableAllEditing = disableAllEditing;
  window.saveAllPendingEdits = saveAllPendingEdits;
  window.hasPendingEdits = hasPendingEdits;
  window.getEditStats = getEditStats;

  // Compatibilidade
  window.makeEditableCompatibility = makeEditableCompatibility;
}

// =============================================================================
// EVENT LISTENERS GLOBAIS
// =============================================================================

// Previne edição acidental com Ctrl+A, Ctrl+C, etc em elementos não editáveis
document.addEventListener("keydown", function (e) {
  const activeElement = document.activeElement;

  if (activeElement.classList.contains("editing")) {
    // Permite comandos de edição apenas em elementos em modo de edição
    return;
  }

  // Bloqueia comandos de edição em elementos não editáveis
  if ((e.ctrlKey || e.metaKey) && ["a", "c", "x", "v"].includes(e.key)) {
    e.stopPropagation();
  }
});

// Salva edições pendentes antes de sair da página
