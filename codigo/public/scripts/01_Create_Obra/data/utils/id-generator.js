/**
 * data/utils/id-generator.js
 * 🎯 SISTEMA UNIFICADO DE GERENÇÃO E VALIDAÇÃO DE IDs ÚNICOS
 * ⚡ IDs SEGUROS: obra_w12, obra_w12_proj_t34_1, obra_w12_proj_t34_1_sala_r21_1
 */

/**
 * Gera um ID único para obra baseado no timestamp
 * @returns {string} ID único no formato "obra_w12"
 */
function generateObraId() {
    const timestamp = Date.now().toString();
    const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
    const randomNum = Math.floor(Math.random() * 90 + 10); // 10-99
    
    return `obra_${randomChar}${randomNum}`;
}

/**
 * Gera um ID único para projeto baseado na obra pai
 * @param {HTMLElement} obraElement - Elemento da obra pai
 * @param {number} projectNumber - Número sequencial do projeto
 * @returns {string} ID único no formato "obra_w12_proj_t34_1"
 */
function generateProjectId(obraElement, projectNumber = null) {
    const obraId = obraElement?.dataset?.obraId;
    
    if (!obraId || !isValidSecureId(obraId)) {
        console.error('❌ Obra ID inválido para gerar projeto ID:', obraId);
        return generateObraId() + '_proj_t' + (Math.floor(Math.random() * 90) + 10) + '_1';
    }
    
    // Extrair base da obra (ex: "obra_w12")
    const obraBase = obraId.split('_').slice(0, 2).join('_');
    const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
    const randomNum = Math.floor(Math.random() * 90 + 10); // 10-99
    const sequence = projectNumber || (getProjectCountInObra(obraId) + 1);
    
    return `${obraBase}_proj_${randomChar}${randomNum}_${sequence}`;
}

/**
 * Gera um ID único para sala baseado no projeto pai
 * @param {HTMLElement} projectElement - Elemento do projeto pai
 * @param {number} roomNumber - Número sequencial da sala
 * @returns {string} ID único no formato "obra_w12_proj_t34_1_sala_r21_1"
 */
function generateRoomId(projectElement, roomNumber = null) {
    const projectId = projectElement?.dataset?.projectId;
    const obraId = projectElement?.dataset?.obraId;
    
    if (!projectId || !isValidSecureId(projectId)) {
        console.error('❌ Project ID inválido para gerar room ID:', projectId);
        const obraBase = obraId && isValidSecureId(obraId) 
            ? obraId.split('_').slice(0, 2).join('_')
            : 'obra_w' + (Math.floor(Math.random() * 90) + 10);
        
        const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        const randomNum = Math.floor(Math.random() * 90 + 10);
        const sequence = roomNumber || 1;
        
        return `${obraBase}_proj_t${randomNum}_1_sala_${randomChar}${randomNum}_${sequence}`;
    }
    
    const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    const randomNum = Math.floor(Math.random() * 90 + 10);
    const sequence = roomNumber || (getRoomCountInProjectFromId(projectId) + 1);
    
    return `${projectId}_sala_${randomChar}${randomNum}_${sequence}`;
}

/**
 * Conta quantos projetos existem em uma obra específica
 * @param {string} obraId - ID único da obra
 * @returns {number} Quantidade de projetos na obra
 */
function getProjectCountInObra(obraId) {
    if (!obraId || !isValidSecureId(obraId)) return 0;
    
    const projectElements = document.querySelectorAll(`[data-obra-id="${obraId}"]`);
    return projectElements.length;
}

/**
 * Conta quantas salas existem em um projeto específico
 * @param {string} projectId - ID único do projeto
 * @returns {number} Quantidade de salas no projeto
 */
function getRoomCountInProjectFromId(projectId) {
    if (!projectId || !isValidSecureId(projectId)) return 0;
    
    const roomElements = document.querySelectorAll(`[data-project-id="${projectId}"]`);
    return roomElements.length;
}

/**
 * Garante que um ID seja uma string válida
 * @param {any} id - ID a ser validado
 * @returns {string|null} ID como string ou null se inválido
 */
function ensureStringId(id) {
    if (id === null || id === undefined || id === "") return null;
    
    const stringId = String(id);
    
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

/**
 * Extrai a base do ID da obra de qualquer ID hierárquico
 * @param {string} id - ID completo (obra, projeto ou sala)
 * @returns {string|null} Base da obra (ex: "obra_w12") ou null
 */
function extractObraBaseFromId(id) {
    if (!id || !isValidSecureId(id)) return null;
    
    const match = id.match(/^(obra_[a-z][0-9]{2})/);
    return match ? match[1] : null;
}

/**
 * Valida se dois IDs pertencem à mesma obra
 * @param {string} id1 - Primeiro ID
 * @param {string} id2 - Segundo ID
 * @returns {boolean} True se pertencem à mesma obra
 */
function areIdsFromSameObra(id1, id2) {
    const obraBase1 = extractObraBaseFromId(id1);
    const obraBase2 = extractObraBaseFromId(id2);
    
    return obraBase1 !== null && obraBase2 !== null && obraBase1 === obraBase2;
}

/**
 * Gera um ID único para máquina baseado na sala pai
 * @param {string} roomId - ID único da sala pai
 * @returns {string} ID único no formato "machine_123456789"
 */
function generateMachineId(roomId) {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `machine_${timestamp}_${randomSuffix}`;
}

/**
 * Sanitiza um ID removendo caracteres inválidos
 * @param {string} id - ID a ser sanitizado
 * @returns {string} ID sanitizado
 */
function sanitizeId(id) {
    if (!id) return '';
    
    return id.toString()
        .replace(/-undefined/g, '')
        .replace(/-null/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .trim();
}

/**
 * Verifica se um elemento DOM possui um ID seguro válido
 * @param {HTMLElement} element - Elemento DOM a ser verificado
 * @param {string} expectedType - Tipo esperado ('obra', 'project', 'room')
 * @returns {boolean} True se o elemento tem ID seguro válido
 */
function hasValidSecureId(element, expectedType) {
    if (!element || !expectedType) return false;
    
    const idAttribute = expectedType === 'obra' ? 'data-obra-id' :
                       expectedType === 'project' ? 'data-project-id' :
                       'data-room-id';
    
    const id = element.getAttribute(idAttribute);
    return id && isValidSecureId(id);
}

// 🆕 FUNÇÃO: Gera um ID de sessão único
function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${randomPart}`;
}

// 🆕 FUNÇÃO: Valida a hierarquia completa de IDs
function validateIdHierarchy(obraId, projectId = null, roomId = null) {
    if (!isValidSecureId(obraId)) return false;
    if (projectId && !areIdsFromSameObra(obraId, projectId)) return false;
    if (roomId && projectId && !areIdsFromSameObra(projectId, roomId)) return false;
    
    return true;
}

// 🆕 FUNÇÃO: Obtém o próximo número sequencial disponível
function getNextSequenceNumber(parentId, childType) {
    if (!parentId || !childType) return 1;
    
    const existingElements = document.querySelectorAll(
        childType === 'project' ? `[data-obra-id="${parentId}"]` :
        childType === 'room' ? `[data-project-id="${parentId}"]` : []
    );
    
    const existingSequences = Array.from(existingElements).map(element => {
        const id = childType === 'project' ? element.dataset.projectId : element.dataset.roomId;
        return extractSequenceNumber(id, childType === 'project' ? 'proj' : 'sala');
    }).filter(seq => seq !== null);
    
    return existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1;
}

/**
 * 🌐 EXPORTAÇÕES E COMPATIBILIDADE GLOBAL
 */

// Exportações para módulos ES6
export {
    generateObraId,
    generateProjectId, 
    generateRoomId,
    generateMachineId,
    generateSessionId,
    ensureStringId,
    isValidSecureId,
    extractSequenceNumber,
    extractObraBaseFromId,
    areIdsFromSameObra,
    validateIdHierarchy,
    hasValidSecureId,
    getProjectCountInObra,
    getRoomCountInProjectFromId,
    getNextSequenceNumber,
    sanitizeId
};

// Compatibilidade global para scripts legados
if (typeof window !== 'undefined') {
    window.generateObraId = generateObraId;
    window.generateProjectId = generateProjectId;
    window.generateRoomId = generateRoomId;
    window.generateMachineId = generateMachineId;
    window.ensureStringId = ensureStringId;
    window.isValidSecureId = isValidSecureId;
    window.sanitizeId = sanitizeId;
}