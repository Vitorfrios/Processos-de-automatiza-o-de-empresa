
// ============================================
// FUNÇÕES UTILITÁRIAS - utils.js
// ============================================

/**
 * Garante que um ID seja uma string válida
 * @param {any} id - ID a ser validado
 * @returns {string|null} ID como string ou null se inválido
 */
function ensureStringId(id) {
  if (id === null || id === undefined || id === "") return null;
  
  const stringId = String(id);
  
  // ✅ CORREÇÃO: Validar formato de ID seguro
  if (stringId === 'undefined' || stringId === 'null' || stringId.includes('undefined')) {
    console.error(`❌ ID inválido detectado: ${stringId}`);
    return null;
  }
  
  return stringId;
}

/**
 * Valida se um ID segue o formato seguro
 * @param {string} id - ID a ser validado
 * @returns {boolean} True se o ID é válido
 */
function isValidSecureId(id) {
  if (!id || typeof id !== 'string') return false;
  
  // Padrões para IDs seguros
  const secureIdPatterns = [
    /^obra_[a-z][0-9]{2}$/, // obra_w12
    /^obra_[a-z][0-9]{2}_proj_[a-z][0-9]{2}_[0-9]+$/, // obra_w12_proj_t34_1
    /^obra_[a-z][0-9]{2}_proj_[a-z][0-9]{2}_[0-9]+_sala_[a-z][0-9]{2}_[0-9]+$/ // obra_w12_proj_t34_1_sala_r21_1
  ];
  
  return secureIdPatterns.some(pattern => pattern.test(id));
}

/**
 * Extrai o número sequencial de um ID seguro
 * @param {string} id - ID seguro
 * @param {string} type - Tipo ('proj' ou 'sala')
 * @returns {number|null} Número sequencial ou null
 */
function extractSequenceNumber(id, type) {
  if (!id || !type) return null;
  
  const pattern = type === 'proj' 
    ? /_proj_[a-z][0-9]{2}_([0-9]+)/
    : /_sala_[a-z][0-9]{2}_([0-9]+)/;
  
  const match = id.match(pattern);
  return match ? parseInt(match[1]) : null;
}

export { 
  ensureStringId, 
  isValidSecureId, 
  extractSequenceNumber 
};