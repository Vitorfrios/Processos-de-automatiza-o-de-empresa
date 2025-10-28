// ============================================
// FUNÇÕES UTILITÁRIAS - utils.js
// ============================================

function ensureStringId(id) {
  if (id === null || id === undefined || id === "") return null
  return String(id)
}

export { ensureStringId }
