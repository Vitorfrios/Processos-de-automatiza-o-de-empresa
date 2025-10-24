// View da Página 02: usa os mesmos construtores/estruturas da Página 01

import { renderProjectFromData } from "../page1/data/server-utils.js"
import { UI_CONSTANTS } from "../page1/config/config.js"

function renderProjectCard(projectData) {
  // Reaproveita fluxo de renderização completo (projeto + salas/inputs)
  renderProjectFromData(projectData)
}

function ensureCollapsed(projectName) {
  const content = document.getElementById(`project-content-${projectName}`)
  const block = document.querySelector(`[data-project-name="${projectName}"]`)
  if (!content || !block) return
  const minimizer = block.querySelector('.project-header .minimizer')
  content.classList.add(UI_CONSTANTS.COLLAPSED_CLASS)
  if (minimizer) minimizer.textContent = UI_CONSTANTS.MINIMIZED_SYMBOL
}

function removeProjectCardById(projectId) {
  const el = document.querySelector(`.project-block[data-project-id="${projectId}"]`)
  if (el) el.remove()
}

export { renderProjectCard, ensureCollapsed, removeProjectCardById }

