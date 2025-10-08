// modules/utilities.js
function updateElementText(elementId, value) {
  const element = document.getElementById(elementId)
  if (element) element.textContent = value
}

function removeEmptyMessage(container, selector = ".empty-message") {
  const message = container.querySelector(selector)
  if (message) message.remove()
}

function showEmptyMessage(container, message) {
  if (container.children.length === 0) {
    container.innerHTML = `<p class="empty-message">${message}</p>`
  }
}

function findRoomId(element, prefix = "room-content-") {
  const roomContent = element.closest(`[id^="${prefix}"]`)
  return roomContent ? roomContent.id.replace(prefix, "") : null
}

// modules/utilities.js
export {
  updateElementText,
  removeEmptyMessage,
  showEmptyMessage,
  findRoomId
}