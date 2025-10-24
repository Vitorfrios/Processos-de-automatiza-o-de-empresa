/**
 * Página 02 – Lista/Atualiza/Deleta Projetos (ES Modules)
 *
 * Testes manuais sugeridos:
 * 1) Carregamento: ao abrir a página, ver a lista renderizada e minimizada.
 * 2) Alternar minimização: usar os botões "+" dos cards para expandir/recolher.
 * 3) Atualizar: editar campos do projeto/salas e clicar em "Atualizar Projeto".
 *    - Validações, persistência e mensagens devem seguir a página 01.
 * 4) Deletar: clicar "Remover" no cabeçalho do projeto, confirmar, e verificar remoção imediata.
 * 5) Feedbacks: observar banners de sucesso/erro no topo (mesmo estilo da página 01).
 *
 * Persistência/Fonte de dados:
 * - Reuso da camada da página 01: fetch/JSON pelo backend local.
 * - Carrega preferencialmente de `/backup` (backup.json → chave `projetos`).
 * - Fallback para `/projetos` (lista filtrada da sessão atual), exatamente como a 01.
 * - Atualizações usam o mesmo fluxo da página 01 (`saveProject`/`atualizarProjeto`).
 * - Exclusão usa a mesma abordagem da 01: remove o projeto da sessão no backend e da UI.
 *
 * Reuso de módulos da página 01:
 * - UI (minimizador, banners): `page1/ui/interface.js`
 * - Build/extração de dados + salvar/atualizar: `page1/data/projects.js`
 * - Renderização de salas/inputs: `page1/data/server-utils.js`
 * - Sessão/estado: `page1/data/server.js` (ativação de sessão e shutdown)
 */

import { showSystemStatus, toggleProject, toggleRoom, toggleSection, toggleSubsection } from "../page1/ui/interface.js"
import { makeEditable } from "../page1/ui/edit.js"
import { addNewRoom, deleteRoom, addMachine, createEmptyRoom } from "../page1/data/rooms.js"
import { saveProject, deleteProject, verifyProjectData, initializeProjectCounter } from "../page1/data/projects.js"
import { setSessionActive } from "../page1/data/server.js"
import "../page1/data/server.js" // side-effect: define window.shutdownManual

import { initProjectsPage } from "./projects.controller.js"

// Expor no window somente o que a UI da página 01 já usa nos onClicks gerados (mesmo padrão)
Object.assign(window, {
  toggleProject,
  toggleRoom,
  toggleSection,
  toggleSubsection,
  makeEditable,
  addNewRoom,
  deleteRoom,
  addMachine,
  createEmptyRoom,
  saveProject,
  deleteProject,
  verifyProjectData,
})

async function loadSystemConstants() {
  try {
    const response = await fetch('/constants')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    window.systemConstants = await response.json()
    if (window.systemConstants) {
      showSystemStatus("Constantes do sistema carregadas", "success")
    }
  } catch (error) {
    console.error("[PAGE2] Falha ao carregar constantes:", error)
    showSystemStatus("ERRO: não foi possível carregar as constantes do sistema", "error")
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // Garantir sessão ativa (sem carregar projetos automaticamente)
    setSessionActive(true)

    // Carregar constantes do sistema para cálculos que a renderização dispara
    await loadSystemConstants()

    // Inicializa contadores usados pela UI 01 (títulos/numeração)
    if (typeof initializeProjectCounter === "function") {
      await initializeProjectCounter()
    }

    // Orquestra carregamento, renderização e bindings da página 02
    await initProjectsPage()

  } catch (err) {
    console.error("[PAGE2] Erro na inicialização da página 02:", err)
    showSystemStatus("ERRO: não foi possível inicializar a página de projetos", "error")
  }
})
