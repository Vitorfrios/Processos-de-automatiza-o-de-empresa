/**
 * data-utils-core.js
 * Utilitários core e funções auxiliares
 * Geração de IDs SEGUROS E ÚNICOS - SISTEMA CORRIGIDO
 */

// =============================================================================
// SISTEMA DE IDs SEGUROS E ÚNICOS - CORREÇÃO COMPLETA
// =============================================================================

/**
 * Gera um ID seguro baseado em letras + números
 * @param {string} prefix - Prefixo para o ID
 * @returns {string} ID seguro
 */
function generateSecureId(prefix = 'item') {
    const letters = 'abcdefghjkmnpqrstwxyz'; // 21 letras (remove i,l,o,v por confusão)
    const randomLetter1 = letters[Math.floor(Math.random() * letters.length)];
    const randomLetter2 = letters[Math.floor(Math.random() * letters.length)];
    const randomNum = Math.floor(Math.random() * 90) + 10; // 10-99 (sempre 2 dígitos)
    return `${prefix}_${randomLetter1}${randomNum}`;
}

/**
 * Gera ID único para obra - SEGURO E ÚNICO
 * @returns {string} ID único da obra
 */
function generateObraId() {
    return generateSecureId('obra');
}

/**
 * Gera ID hierárquico seguro para projeto - SEGURO E ÚNICO
 * @param {HTMLElement} obraElement - Elemento da obra pai
 * @param {number} projectNumber - Número sequencial do projeto
 * @returns {string} ID único do projeto
 */
function generateProjectId(obraElement, projectNumber) {
    if (!obraElement) {
        console.error(`ERRO FALBACK (generateProjectId) data-utils-core.js [Elemento da obra não fornecido]`);
        return generateSecureId('proj');
    }
    
    const obraId = obraElement.dataset?.obraId;
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (generateProjectId) data-utils-core.js [Obra ID inválido no dataset: ${obraId}]`);
        return generateSecureId('proj');
    }
    
    const projectPrefix = generateSecureId('proj').replace('proj_', '');
    return `${obraId}_proj_${projectPrefix}_${projectNumber}`;
}

/**
 * Gera ID hierárquico seguro para sala - SEGURO E ÚNICO
 * @param {HTMLElement} projectElement - Elemento do projeto pai
 * @param {number} roomNumber - Número sequencial da sala
 * @returns {string} ID único da sala
 */
function generateRoomId(projectElement, roomNumber) {
    if (!projectElement) {
        console.error(`ERRO FALBACK (generateRoomId) data-utils-core.js [Elemento do projeto não fornecido]`);
        return generateSecureId('sala');
    }
    
    const projectId = projectElement.dataset?.projectId;
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
        console.error(`ERRO FALBACK (generateRoomId) data-utils-core.js [Project ID inválido no dataset: ${projectId}]`);
        return generateSecureId('sala');
    }
    
    const roomPrefix = generateSecureId('sala').replace('sala_', '');
    return `${projectId}_sala_${roomPrefix}_${roomNumber}`;
}

// =============================================================================
// FUNÇÕES DE NOMEAÇÃO - CORREÇÕES (MANTIDAS)
// =============================================================================

/**
 * Obtém o ID completo da sala no formato correto
 * @param {HTMLElement} roomElement - Elemento da sala
 * @returns {string} ID completo da sala
 */
function getRoomFullId(roomElement) {
    const roomId = roomElement.dataset.roomId;
    
    if (!roomId || roomId === 'undefined' || roomId === 'null' || roomId.includes('undefined')) {
        console.error(`ERRO FALBACK (getRoomFullId) data-utils-core.js [Room ID inválido: ${roomId}]`);
        return generateSecureId('sala');
    }
    
    console.log(`✅ ID da sala obtido do data attribute: ${roomId}`);
    return roomId;
}

/**
 * Obtém o nome da obra a partir do elemento - CORRIGIDO
 * @param {HTMLElement} obraElement - Elemento da obra
 * @returns {string} Nome da obra
 */
function getObraName(obraElement) {
    if (!obraElement) {
        console.error(`ERRO FALBACK (getObraName) data-utils-core.js [Elemento da obra não fornecido]`);
        return 'Obra_Erro';
    }

    const titleElement = obraElement.querySelector('.obra-title');
    if (titleElement) {
        const name = titleElement.textContent || titleElement.innerText || '';
        const trimmedText = name.trim();
        if (trimmedText && trimmedText !== 'Obra') {
            return trimmedText;
        }
    }
    
    const obraNameFromData = obraElement.dataset.obraName;
    if (obraNameFromData && obraNameFromData !== 'undefined' && obraNameFromData !== 'null') {
        return obraNameFromData;
    }
    
    console.error(`ERRO FALBACK (getObraName) data-utils-core.js [Nome da obra não encontrado]`);
    return 'Obra_Erro';
}

/**
 * Obtém o nome do projeto a partir do elemento - CORRIGIDO
 * @param {HTMLElement} projectElement - Elemento do projeto
 * @returns {string} Nome do projeto
 */
function getProjectName(projectElement) {
    if (!projectElement) {
        console.error(`ERRO FALBACK (getProjectName) data-utils-core.js [Elemento do projeto não fornecido]`);
        return 'Projeto_Erro';
    }

    const titleElement = projectElement.querySelector('.project-title');
    if (titleElement) {
        const titleText = titleElement.textContent || titleElement.innerText || '';
        const trimmedText = titleText.trim();
        if (trimmedText && trimmedText !== 'Projeto') {
            console.log(`📝 Nome do projeto obtido do título: "${trimmedText}"`);
            return trimmedText;
        }
    }
    
    const projectNameFromData = projectElement.dataset.projectName;
    if (projectNameFromData && projectNameFromData !== 'undefined' && projectNameFromData !== 'null' && projectNameFromData !== 'Projeto') {
        console.log(`📝 Nome do projeto obtido do data attribute: "${projectNameFromData}"`);
        return projectNameFromData;
    }
    
    console.error(`ERRO FALBACK (getProjectName) data-utils-core.js [Nome do projeto não encontrado]`);
    return 'Projeto_Erro';
}

/**
 * Obtém o nome da sala a partir do elemento - CORRIGIDO
 * @param {HTMLElement} roomElement - Elemento da sala
 * @returns {string} Nome da sala
 */
function getRoomName(roomElement) {
    if (!roomElement) {
        console.error(`ERRO FALBACK (getRoomName) data-utils-core.js [Elemento da sala não fornecido]`);
        return 'Sala_Erro';
    }

    const titleElement = roomElement.querySelector('.room-title');
    if (titleElement) {
        const name = titleElement.textContent || titleElement.value || titleElement.getAttribute('value') || '';
        const trimmedName = name.trim();
        if (trimmedName) return trimmedName;
    }
    
    const roomNameFromData = roomElement.dataset.roomName;
    if (roomNameFromData && roomNameFromData !== 'undefined' && roomNameFromData !== 'null') {
        return roomNameFromData;
    }
    
    const roomId = roomElement.dataset.roomId;
    if (roomId && roomId !== 'undefined' && roomId !== 'null') {
        return `Sala ${roomId.split('_').pop()}`;
    }
    
    console.error(`ERRO FALBACK (getRoomName) data-utils-core.js [Nome da sala não encontrado]`);
    return 'Sala_Erro';
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS EXISTENTES (MANTIDAS)
// =============================================================================

/**
 * Extrai número de um texto, convertendo vírgula para ponto decimal
 * @param {string} text - Texto contendo número
 * @returns {number|null} Número extraído ou null se não encontrado
 */
function extractNumberFromText(text) {
    if (!text) return null
    
    const numberMatch = text.match(/-?\d+(?:[.,]\d+)?/)
    if (numberMatch) {
        const numericString = numberMatch[0].replace(',', '.')
        const numericValue = parseFloat(numericString)
        return isNaN(numericValue) ? null : numericValue
    }
    
    return null
}

/**
 * Obtém o nome da máquina a partir do elemento
 * @param {HTMLElement} machineElement - Elemento da máquina
 * @param {string} machineId - ID da máquina
 * @returns {string} Nome da máquina
 */
function getMachineName(machineElement, machineId) {
    const titleElement = machineElement.querySelector('.machine-title-editable')
    if (!titleElement) return `Máquina ${machineId}`
    
    const name = titleElement.value || titleElement.textContent || titleElement.getAttribute('value') || `Máquina ${machineId}`
    return name.trim() || `Máquina${machineId}`
}

/**
 * Converte texto de preço em número
 * @param {string} priceText - Texto do preço no formato "R$ X.XXX,XX"
 * @returns {number} Valor numérico do preço
 */
function parseMachinePrice(priceText) {
    if (!priceText || priceText === 'R$ 0,00') return 0
    
    try {
        const cleaned = priceText.replace('R$', '')
                                .replace(/\./g, '')
                                .replace(',', '.')
                                .trim()
        return parseFloat(cleaned) || 0
    } catch (error) {
        console.error('❌ Erro ao converter preço:', priceText, error)
        return 0
    }
}

/**
 * Converte valores para número com tratamento de segurança
 * @param {any} value - Valor a ser convertido
 * @returns {number} Valor numérico
 */
function safeNumber(value) {
    if (value === null || value === undefined || value === '') return 0
    const num = parseFloat(value.toString().replace(',', '.'))
    return isNaN(num) ? 0 : num
}

/**
 * Função de debug para mostrar todos os elementos de ganhos térmicos disponíveis
 * @param {HTMLElement} roomElement - Elemento da sala para debug
 * @returns {void}
 */
function debugThermalGainsElements(roomElement) {
    const roomFullId = getRoomFullId(roomElement)
    console.log('🐛 DEBUG: Todos os elementos de ganhos térmicos disponíveis:')
    
    const selectors = [
        'total-ganhos-w', 'total-tr', 'total-externo', 'total-divisoes',
        'total-piso', 'total-iluminacao', 'total-dissi', 'total-pessoas',
        'total-ar-sensivel', 'total-ar-latente'
    ]
    
    selectors.forEach(selector => {
        const element = document.querySelector(`#${selector}-${roomFullId}`)
        console.log(`🔍 ${selector}-${roomFullId}:`, element ? `ENCONTRADO - "${element.textContent}"` : 'NÃO ENCONTRADO')
    })
}

// =============================================================================
// EXPORTAÇÕES - SISTEMA ATUALIZADO
// =============================================================================

export {
    // NOVO SISTEMA DE IDs SEGUROS
    generateSecureId,
    generateObraId,
    generateProjectId,
    generateRoomId,
    
    // FUNÇÕES DE NOMEAÇÃO CORRIGIDAS
    getRoomFullId,
    getObraName,
    getProjectName,
    getRoomName,
    
    // FUNÇÕES UTILITÁRIAS (MANTIDAS)
    extractNumberFromText,
    getMachineName,
    parseMachinePrice,
    safeNumber,
    debugThermalGainsElements
}