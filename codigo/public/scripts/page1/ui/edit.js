//edit.js

/**
 * Inicia o modo de edição inline para um elemento (projeto ou sala)
 * Permite que o usuário edite o texto diretamente no elemento
 * @param {HTMLElement} element - Elemento a ser editado
 * @param {string} type - Tipo do elemento ('project' ou 'room')
 */
function makeEditable(element, type) {
  if (element.classList.contains("editing")) return

  const originalText = element.textContent.trim()
  element.dataset.originalText = originalText

  enableEditing(element)
  selectElementContent(element)
  attachEditingEventListeners(element, type)
}

/**
 * Habilita a edição do elemento configurando contentEditable
 * @param {HTMLElement} element - Elemento a ser habilitado para edição
 */
function enableEditing(element) {
  element.contentEditable = true
  element.classList.add("editing")
}

/**
 * Seleciona todo o conteúdo do elemento para facilitar a edição
 * @param {HTMLElement} element - Elemento cujo conteúdo será selecionado
 */
function selectElementContent(element) {
  const range = document.createRange()
  const selection = window.getSelection()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
  element.focus()
}

/**
 * Anexa event listeners para tratar teclas e perda de foco durante edição
 * @param {HTMLElement} element - Elemento em edição
 * @param {string} type - Tipo do elemento ('project' ou 'room')
 */
function attachEditingEventListeners(element, type) {
  element.addEventListener("keydown", function handleKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      saveInlineEdit(element, type)
      element.removeEventListener("keydown", handleKeydown)
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelInlineEdit(element)
      element.removeEventListener("keydown", handleKeydown)
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
 * Salva as alterações feitas durante a edição inline
 * @param {HTMLElement} element - Elemento sendo editado
 * @param {string} type - Tipo do elemento ('project' ou 'room')
 */
function saveInlineEdit(element, type) {
  const newText = element.textContent.trim()
  const originalText = element.dataset.originalText

  disableEditing(element)

  if (!validateEditedText(newText, originalText, element)) return

  if (newText !== originalText) {
    element.textContent = newText
    const entityType = type === "project" ? "Projeto" : "Sala"
    console.log(` ${entityType} renomeado para: ${newText}`)
  }

  delete element.dataset.originalText
}

/**
 * Desabilita o modo de edição do elemento
 * @param {HTMLElement} element - Elemento a ser desabilitado
 */
function disableEditing(element) {
  element.contentEditable = false
  element.classList.remove("editing")
}

/**
 * Valida o texto editado pelo usuário
 * @param {string} newText - Novo texto inserido
 * @param {string} originalText - Texto original
 * @param {HTMLElement} element - Elemento sendo validado
 * @returns {boolean} True se o texto é válido
 */
function validateEditedText(newText, originalText, element) {
  if (newText === "") {
    element.textContent = originalText
    alert("O nome não pode estar vazio.")
    return false
  }
  return true
}

/**
 * Cancela a edição e restaura o texto original
 * @param {HTMLElement} element - Elemento cuja edição será cancelada
 */
function cancelInlineEdit(element) {
  const originalText = element.dataset.originalText

  disableEditing(element)
  element.textContent = originalText
  delete element.dataset.originalText

  console.log(" Edição cancelada")
}

export {
  makeEditable,
  enableEditing,
  selectElementContent,
  attachEditingEventListeners,
  saveInlineEdit,
  disableEditing,
  validateEditedText,
  cancelInlineEdit
}