/**
 * Utilitários core e funções auxiliares
 * Geração de IDs, helpers numéricos, funções de nomeação
 */

// Contadores globais para IDs sequenciais
let obraCounter = 1000
let projectCounter = 0
let roomCounter = 0

/**
 * Gera ID para obra (inicia em 1001, global)
 */
function generateObraId() {
    obraCounter++
    return obraCounter.toString()
}

/**
 * Gera ID para projeto (reinicia por obra)
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
 * Gera ID para sala (reinicia por projeto) - CORRIGIDO para numérico simples
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
 * Obtém o ID completo da sala (ex: "Projeto1-Sala1")
 */
function getRoomFullId(roomElement) {
    const roomName = roomElement.dataset.roomName
    const projectElement = roomElement.closest('.project-block')
    const projectName = projectElement ? getProjectName(projectElement) : 'Projeto1'
    
    if (roomName) {
        return `${projectName}-${roomName}`
    }
    
    const possibleIds = [
        'total-ganhos-w-', 'total-tr-', 'total-externo-', 
        'total-divisoes-', 'total-piso-', 'total-iluminacao-'
    ]
    
    for (const prefix of possibleIds) {
        const element = document.querySelector(`[id^="${prefix}"]`)
        if (element) {
            const fullId = element.id.replace(prefix, '')
            if (fullId && fullId.includes('-')) {
                console.log(`🔍 ID completo detectado: ${fullId}`)
                return fullId
            }
        }
    }
    
    return 'Projeto1-Sala1'
}

/**
 * Extrai número de um texto
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
 * Obtém o nome da obra de forma segura
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
 * Obtém o nome do projeto de forma segura
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
 * Obtém o nome da sala de forma segura
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
 * Obtém o nome da máquina de forma segura
 */
function getMachineName(machineElement, machineId) {
    const titleElement = machineElement.querySelector('.machine-title-editable')
    if (!titleElement) return `Máquina ${machineId}`
    
    const name = titleElement.value || titleElement.textContent || titleElement.getAttribute('value') || `Máquina ${machineId}`
    return name.trim() || `Máquina${machineId}`
}

/**
 * Converte texto de preço em número
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
 * Função auxiliar para converter valores para número com segurança
 */
function safeNumber(value) {
    if (value === null || value === undefined || value === '') return 0
    const num = parseFloat(value.toString().replace(',', '.'))
    return isNaN(num) ? 0 : num
}

/**
 * Função auxiliar para debug - mostra todos os elementos de ganhos térmicos disponíveis
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