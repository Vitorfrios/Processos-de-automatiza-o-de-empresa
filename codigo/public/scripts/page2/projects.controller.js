import { showSystemStatus } from "../page1/ui/interface.js"
import { getAllProjects } from "./projects.repo.js"
import { renderProjectCard, ensureCollapsed } from "./project-card.view.js"

function sortProjectsByTimestampDesc(projects) {
  return [...projects].sort((a, b) => {
    const ta = a?.timestamp ? Date.parse(a.timestamp) : 0
    const tb = b?.timestamp ? Date.parse(b.timestamp) : 0
    return tb - ta
  })
}

async function initProjectsPage() {
  const container = document.getElementById('projects-container')
  if (!container) {
    showSystemStatus('ERRO: container de projetos não encontrado', 'error')
    console.error('[PAGE2] Elemento #projects-container ausente na página 02')
    return
  }

  try {
    container.innerHTML = ''
    const all = await getAllProjects()

    if (!all || all.length === 0) {
      showSystemStatus('Nenhum projeto encontrado', 'success')
      return
    }

    const ordered = sortProjectsByTimestampDesc(all)
    for (const project of ordered) {
      renderProjectCard(project)
      // Já nasce colapsado pela view da página 01, reforçar por garantia
      ensureCollapsed(project.nome)
    }

    showSystemStatus(`${ordered.length} projeto(s) carregado(s)`, 'success')
  } catch (err) {
    console.error('[PAGE2] Falha ao carregar/renderizar projetos:', err)
    showSystemStatus('ERRO: não foi possível carregar os projetos', 'error')
  }
}

export { initProjectsPage }

