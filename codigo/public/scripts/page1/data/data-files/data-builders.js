/**
 * data-builders.js
 * Módulo de construção de objetos de dados
 * Responsável por criar estruturas de obras, projetos e salas COM IDs ÚNICOS
 */

// Importações necessárias
import { generateObraId, generateProjectId, generateRoomId, getObraName, getProjectName, getRoomName } from './data-utils-core.js'
import { extractClimatizationInputs, extractMachinesData, extractCapacityData, extractThermalGainsData, extractConfigurationData } from './data-extractors.js'

/**
 * Constrói o objeto de dados completo de uma obra a partir do HTML
 * @param {string|HTMLElement} obraIdOrElement - ID da obra ou elemento HTML
 * @returns {Object|null} Dados completos da obra ou null em caso de erro
 */
function buildObraData(obraIdOrElement) {
    let obraElement
    
    if (typeof obraIdOrElement === 'string') {
        obraElement = document.querySelector(`.obra-block[data-obra-id="${obraIdOrElement}"]`) || 
                     document.querySelector(`.obra-block[data-obra-name="${obraIdOrElement}"]`)
    } else if (obraIdOrElement instanceof HTMLElement) {
        if (obraIdOrElement.classList.contains('obra-block')) {
            obraElement = obraIdOrElement
        } else {
            console.error('❌ Elemento não é uma obra:', obraIdOrElement)
            return null
        }
    } else {
        console.error('❌ Tipo inválido para obraIdOrElement:', typeof obraIdOrElement, obraIdOrElement)
        return null
    }

    if (!obraElement) {
        console.error('❌ Elemento da obra não encontrado:', obraIdOrElement)
        return null
    }

    const obraName = obraElement.dataset.obraName
    const obraId = obraElement.dataset.obraId

    console.log(`📦 Construindo dados da obra: "${obraName}" (ID: ${obraId})`)

    // ✅ CORREÇÃO: SEMPRE usar ID único, mesmo se já existir (para consistência)
    const finalObraId = obraId || generateObraId()
    
    const obraData = {
        id: finalObraId, // ✅ ID ÚNICO CURTO
        nome: getObraName(obraElement),
        timestamp: new Date().toISOString(),
        projetos: []
    }

    const projectElements = obraElement.querySelectorAll('.project-block')
    console.log(`🔍 Encontrados ${projectElements.length} projetos na obra "${obraName}"`)
    
    projectElements.forEach((projectElement, index) => {
        const projectData = buildProjectData(projectElement)
        if (projectData) {
            obraData.projetos.push(projectData)
            console.log(`✅ Projeto "${projectData.nome}" adicionado à obra "${obraName}"`)
        } else {
            console.error(`❌ Falha ao construir projeto ${index} da obra "${obraName}"`)
        }
    })

    console.log('📦 Dados da obra construídos:', {
        obra: obraData.nome,
        id: obraData.id,
        projetos: obraData.projetos.length
    })
    
    return obraData
}

/**
 * Constrói o objeto de dados completo de um projeto a partir do HTML
 * @param {string|HTMLElement} projectIdOrElement - ID do projeto ou elemento HTML
 * @returns {Object|null} Dados completos do projeto ou null em caso de erro
 */
function buildProjectData(projectIdOrElement) {
    let projectElement
    
    if (typeof projectIdOrElement === 'string') {
        projectElement = document.querySelector(`[data-project-name="${projectIdOrElement}"]`)
    } else if (projectIdOrElement instanceof HTMLElement) {
        projectElement = projectIdOrElement
    } else {
        console.error('❌ Tipo inválido para projectIdOrElement:', projectIdOrElement)
        return null
    }

    if (!projectElement) {
        console.error('❌ Elemento do projeto não encontrado:', projectIdOrElement)
        return null
    }

    const projectName = projectElement.dataset.projectName || projectElement.id
    const projectId = projectElement.dataset.projectId
    const obraElement = projectElement.closest('.obra-block')

    if (!obraElement) {
        console.error('❌ Elemento da obra pai não encontrado para projeto:', projectName)
        return null
    }

    // ✅ CORREÇÃO: SEMPRE usar ID hierárquico único
    const finalProjectId = projectId || generateProjectId(obraElement)

    const projectData = {
        id: finalProjectId, // ✅ ID HIERÁRQUICO ÚNICO
        nome: getProjectName(projectElement),
        salas: [],
        timestamp: new Date().toISOString()
    }

    const roomElements = projectElement.querySelectorAll('.room-block')
    console.log(`🔍 Encontradas ${roomElements.length} salas no projeto "${projectName}"`)
    
    roomElements.forEach((roomElement, index) => {
        const roomData = extractRoomData(roomElement, projectElement)
        if (roomData) {
            projectData.salas.push(roomData)
        }
    })

    return projectData
}

/**
 * Extrai todos os dados de uma sala a partir do elemento HTML
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {HTMLElement} projectElement - Elemento HTML do projeto pai
 * @returns {Object|null} Dados completos da sala ou null em caso de erro
 */
function extractRoomData(roomElement, projectElement) {
    if (!roomElement) {
        console.error('❌ Elemento da sala é nulo')
        return null
    }

    if (!projectElement) {
        console.error('❌ Elemento do projeto pai é nulo')
        return null
    }

    // ✅ CORREÇÃO: SEMPRE usar ID hierárquico único
    const roomId = roomElement.dataset.roomId || generateRoomId(projectElement)
    const roomName = getRoomName(roomElement) || `Sala ${roomId}`

    console.log(`🔍 Extraindo dados da sala: "${roomName}" (ID: ${roomId})`)

    const roomData = {
        id: roomId, // ✅ ID HIERÁRQUICO ÚNICO
        nome: roomName,
        inputs: extractClimatizationInputs(roomElement),
        maquinas: extractMachinesData(roomElement),
        capacidade: extractCapacityData(roomElement),
        ganhosTermicos: extractThermalGainsData(roomElement),
        configuracao: extractConfigurationData(roomElement)
    }

    console.log(`📊 Dados extraídos da sala ${roomId} "${roomData.nome}":`, {
        inputs: Object.keys(roomData.inputs).length,
        maquinas: roomData.maquinas.length,
        capacidade: Object.keys(roomData.capacidade).length,
        ganhosTermicos: Object.keys(roomData.ganhosTermicos).length,
        configuracao: Object.keys(roomData.configuracao).length
    })
    
    return roomData
}

export {
    buildObraData,
    buildProjectData,
    extractRoomData
}