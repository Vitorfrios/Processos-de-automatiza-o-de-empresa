/**
 * data-utils-core.js
 * Utilitários core e funções auxiliares
 * Geração de IDs, helpers numéricos, funções de nomeação
 */

// Contadores globais para IDs sequenciais
let obraCounter = 1000
let projectCounter = 0
let roomCounter = 0

/**
 * Gera ID para obra (inicia em 1001, global)
 * @returns {string} ID único da obra
 */
function generateObraId() {
    obraCounter++
    return obraCounter.toString()
}

/**
 * Gera ID para projeto baseado nos projetos existentes na obra
 * @param {HTMLElement} obraElement - Elemento da obra
 * @returns {string} ID único do projeto
 */
function generateProjectId(obraElement) {
    if (!obraElement) {
        projectCounter++
        return projectCounter.toString()
    }
    
    const projects = obraElement.querySelectorAll('.project-block')
    let maxId = 0
    
    projects.forEach(project => {
        const id = project.dataset.projectId
        if (id) {
            const numId = parseInt(id)
            if (numId > maxId) maxId = numId
        }
    })
    
    return (maxId + 1).toString()
}

/**
 * Gera ID para sala baseado nas salas existentes no projeto
 * @param {HTMLElement} projectElement - Elemento do projeto
 * @returns {string} ID único da sala
 */
function generateRoomId(projectElement) {
    const rooms = projectElement.querySelectorAll('.room-block')
    let maxId = 0
    
    rooms.forEach(room => {
        const id = room.dataset.roomId
        if (id) {
            const numMatch = id.match(/\d+/)
            const numId = numMatch ? parseInt(numMatch[0]) : 0
            if (numId > maxId) maxId = numId
        }
    })
    
    return (maxId + 1).toString()
}

/**
 * Obtém o ID completo da sala no formato correto "obra-projeto-sala"
 * @param {HTMLElement} roomElement - Elemento da sala
 * @returns {string} ID completo da sala
 */
function getRoomFullId(roomElement) {
    // Usar o roomId diretamente do data attribute (já está no formato correto)
    const roomId = roomElement.dataset.roomId;
    
    if (roomId && !roomId.includes('undefined')) {
        console.log(`✅ ID da sala obtido do data attribute: ${roomId}`);
        return roomId;
    }
    
    // Fallback: construir ID a partir da hierarquia
    const roomName = roomElement.dataset.roomName || 'Sala1';
    const projectElement = roomElement.closest('.project-block');
    const projectName = projectElement ? getProjectName(projectElement) : 'Projeto1';
    const obraElement = projectElement ? projectElement.closest('.obra-block') : null;
    const obraName = obraElement ? getObraName(obraElement) : 'Obra1';
    
    const fallbackId = `${obraName}-${projectName}-${roomName}`.toLowerCase().replace(/\s+/g, '');
    console.log(`🔄 ID fallback construído: ${fallbackId}`);
    
    return fallbackId;
}

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
 * Obtém o nome da obra a partir do elemento
 * @param {HTMLElement} obraElement - Elemento da obra
 * @returns {string} Nome da obra
 */
function getObraName(obraElement) {
    const titleElement = obraElement.querySelector('.obra-title')
    if (titleElement) {
        const name = titleElement.textContent || titleElement.innerText || ''
        const trimmedText = name.trim()
        if (trimmedText && trimmedText !== 'Obra') {
            return trimmedText
        }
    }
    
    const obraNameFromData = obraElement.dataset.obraName
    if (obraNameFromData) return obraNameFromData
    
    const allObras = document.querySelectorAll('.obra-block')
    const obraNumber = allObras.length > 0 ? allObras.length : 1
    return `Obra${obraNumber}`
}

/**
 * Obtém o nome do projeto a partir do elemento
 * @param {HTMLElement} projectElement - Elemento do projeto
 * @returns {string} Nome do projeto
 */
function getProjectName(projectElement) {
    const titleElement = projectElement.querySelector('.project-title')
    
    if (titleElement) {
        const titleText = titleElement.textContent || titleElement.innerText || ''
        const trimmedText = titleText.trim()
        
        if (trimmedText && trimmedText !== 'Projeto') {
            console.log(`📝 Nome do projeto obtido do título: "${trimmedText}"`)
            return trimmedText
        }
    }
    
    const projectNameFromData = projectElement.dataset.projectName
    if (projectNameFromData && projectNameFromData !== 'Projeto') {
        console.log(`📝 Nome do projeto obtido do data attribute: "${projectNameFromData}"`)
        return projectNameFromData
    }
    
    const projectId = projectElement.id
    if (projectId && projectId.startsWith('project-')) {
        const nameFromId = projectId.replace('project-', '')
        if (nameFromId && nameFromId !== 'Projeto') {
            console.log(`📝 Nome do projeto obtido do ID: "${nameFromId}"`)
            return nameFromId
        }
    }
    
    const allProjects = document.querySelectorAll('.project-block')
    const projectNumber = allProjects.length > 0 ? allProjects.length : 1
    const defaultName = `Projeto${projectNumber}`
    console.log(`📝 Nome do projeto usando fallback: "${defaultName}"`)
    
    return defaultName
}

/**
 * Obtém o nome da sala a partir do elemento
 * @param {HTMLElement} roomElement - Elemento da sala
 * @returns {string} Nome da sala
 */
function getRoomName(roomElement) {
    const titleElement = roomElement.querySelector('.room-title')
    if (titleElement) {
        const name = titleElement.textContent || titleElement.value || titleElement.getAttribute('value')
        if (name && name.trim() !== '') return name.trim()
    }
    
    const roomNameFromData = roomElement.dataset.roomName
    if (roomNameFromData) return roomNameFromData
    
    return `Sala ${roomElement.dataset.roomId || ''}`
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

export {
    generateObraId,
    generateProjectId,
    generateRoomId,
    getRoomFullId,
    extractNumberFromText,
    getObraName,
    getProjectName,
    getRoomName,
    getMachineName,
    parseMachinePrice,
    safeNumber,
    debugThermalGainsElements
}