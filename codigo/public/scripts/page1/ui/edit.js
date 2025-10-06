function makeEditable(element, type) {
  if (element.classList.contains("editing")) return

  const originalText = element.textContent.trim()
  element.dataset.originalText = originalText

  enableEditing(element)
  selectElementContent(element)
  attachEditingEventListeners(element, type)
}

function enableEditing(element) {
  element.contentEditable = true
  element.classList.add("editing")
}

function selectElementContent(element) {
  const range = document.createRange()
  const selection = window.getSelection()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
  element.focus()
}

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

function saveInlineEdit(element, type) {
  const newText = element.textContent.trim()
  const originalText = element.dataset.originalText

  disableEditing(element)

  if (!validateEditedText(newText, originalText, element)) return

  if (newText !== originalText) {
    element.textContent = newText
    const entityType = type === "project" ? "Projeto" : "Sala"
    console.log(`[v0] ${entityType} renomeado para: ${newText}`)
  }

  delete element.dataset.originalText
}

function disableEditing(element) {
  element.contentEditable = false
  element.classList.remove("editing")
}

function validateEditedText(newText, originalText, element) {
  if (newText === "") {
    element.textContent = originalText
    alert("O nome não pode estar vazio.")
    return false
  }
  return true
}

function cancelInlineEdit(element) {
  const originalText = element.dataset.originalText

  disableEditing(element)
  element.textContent = originalText
  delete element.dataset.originalText

  console.log("[v0] Edição cancelada")
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