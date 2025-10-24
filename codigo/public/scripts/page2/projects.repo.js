// Camada de dados da Página 02
// Reutiliza a mesma abordagem da página 01 (fetch/JSON + sessão backend)

import { ensureStringId } from "../page1/utils/utils.js"
import { fetchProjects as fetchSessionProjects, atualizarProjeto } from "../page1/data/projects.js"
import { removeProjectFromSession } from "../page1/data/server.js"

async function getAllProjects() {
  // 1) Preferir backup completo
  try {
    const resp = await fetch('/backup')
    if (resp.ok) {
      const json = await resp.json()
      const list = Array.isArray(json?.projetos) ? json.projetos : []
      // Normalizar IDs como na página 01
      return list.map((p) => normalizeProject(p))
    }
  } catch (_) {
    // fallback abaixo
  }

  // 2) Fallback para lista filtrada da sessão atual (mesma usada na página 01)
  try {
    const list = await fetchSessionProjects()
    return list.map((p) => normalizeProject(p))
  } catch (err) {
    console.error('[PAGE2][repo] Erro ao carregar projetos:', err)
    return []
  }
}

function normalizeProject(project) {
  const out = { ...project }
  out.id = ensureStringId(out.id)
  if (Array.isArray(out.salas)) {
    out.salas = out.salas.map((s) => ({ ...s, id: ensureStringId(s.id) }))
  }
  return out
}

async function updateProjectById(id, data) {
  return atualizarProjeto(id, data)
}

async function deleteProjectById(id) {
  try {
    await removeProjectFromSession(ensureStringId(id))
    return true
  } catch (err) {
    console.error('[PAGE2][repo] Erro ao remover projeto da sessão:', err)
    return false
  }
}

export { getAllProjects, updateProjectById, deleteProjectById }

