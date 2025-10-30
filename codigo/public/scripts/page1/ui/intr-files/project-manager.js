/**
 * project-manager.js
 * Gerenciador de projetos - SISTEMA CORRIGIDO COM IDs ÚNICOS
 */

import { createEmptyRoom } from '../../data/rooms.js'
import { generateProjectId,getNextProjectNumber } from '../../data/data-files/data-utils-core.js'
import { removeEmptyObraMessage } from './ui-helpers.js'

/**
 * Constrói o HTML de um projeto - CORREÇÃO COMPLETA
 * @param {string} obraId - ID único da obra
 * @param {string} obraName - Nome da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} projectName - Nome do projeto
 * @returns {string} HTML do projeto
 */
function buildProjectHTML(obraId, obraName, projectId, projectName) {
    // ✅ CORREÇÃO: Validar IDs únicos
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (buildProjectHTML) project-manager.js [Obra ID inválido: ${obraId}]`)
        return ''
    }
    
    const finalProjectId = projectId || generateProjectId(document.querySelector(`[data-obra-id="${obraId}"]`))
    
    if (!finalProjectId || finalProjectId === 'undefined' || finalProjectId === 'null') {
        console.error(`ERRO FALBACK (buildProjectHTML) project-manager.js [Project ID inválido: ${finalProjectId}]`)
        return ''
    }
    
    console.log(`🔨 [BUILD PROJECT HTML] Obra: ${obraName}, Projeto: ${projectName}, ObraID: ${obraId}, ProjectID: ${finalProjectId}`)

    return `
        <div class="project-block" 
             data-project-id="${finalProjectId}" 
             data-project-name="${projectName}" 
             data-obra-id="${obraId}" 
             data-obra-name="${obraName}">
            <div class="project-header">
                <!-- ✅ CORREÇÃO: usar APENAS projectId para toggle -->
                <button class="minimizer" onclick="toggleProject('${finalProjectId}', event)">+</button>
                <h3 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">${projectName}</h3>
                <div class="project-actions">
                    <!-- ✅ CORREÇÃO: passar IDs únicos para delete -->
                    <button class="btn btn-delete" onclick="deleteProject('${obraId}', '${finalProjectId}')">Remover Projeto</button>
                </div>
            </div>
            <!-- ✅ CORREÇÃO: usar APENAS projectId no conteúdo -->
            <div class="project-content collapsed" id="project-content-${finalProjectId}">

            
                <div class="rooms-container">
                    <p class="empty-message">Adicione salas a este projeto...</p>
                </div>
                <div class="add-room-section">
                    <!-- ✅ CORREÇÃO: passar IDs únicos para add room -->
                    <button class="btn btn-add-secondary" onclick="addNewRoom('${obraId}', '${finalProjectId}')">+ Adicionar Sala</button>
                </div>
            </div>
        </div>
    `
}

/**
 * Cria um projeto vazio na obra especificada - CORREÇÃO COMPLETA
 * @param {string} obraId - ID único da obra
 * @param {string} obraName - Nome da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} projectName - Nome do projeto
 * @returns {Promise<boolean>} True se o projeto foi criado com sucesso
 */
async function createEmptyProject(obraId, obraName, projectId, projectName) {
    console.log(`📁 [CREATE PROJECT] Buscando obra: "${obraName}" (ID: ${obraId}) para criar projeto: "${projectName}" (ID: ${projectId})`)
    
    // ✅ CORREÇÃO: Buscar APENAS por ID único da obra
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`)
    
    if (!obraBlock) {
        console.error(`❌ Obra com ID ${obraId} não encontrada`)
        
        // Debug: listar obras disponíveis
        console.log('🔍 Obras disponíveis no DOM:')
        document.querySelectorAll('.obra-block').forEach(obra => {
            console.log(`  - Obra: "${obra.dataset.obraName}", ID: "${obra.dataset.obraId}"`)
        })
        return false
    }

    console.log(`✅ Obra encontrada:`, obraBlock.dataset)

    const projectsContainer = document.getElementById(`projects-${obraId}`)
    if (!projectsContainer) {
        console.error(`❌ Container de projetos não encontrado para obra: ${obraId}`)
        return false
    }

    removeEmptyObraMessage(obraName)

    // ✅ CORREÇÃO: Gerar ID SEGURO hierárquico se não fornecido
    const projectNumber = getNextProjectNumber(obraId)
    const finalProjectId = projectId || generateProjectId(obraBlock, projectNumber)
    
    if (!finalProjectId) {
        console.error(`❌ Falha ao gerar ID para projeto ${projectName}`)
        return false
    }

    const projectHTML = buildProjectHTML(obraId, obraName, finalProjectId, projectName)
    projectsContainer.insertAdjacentHTML('beforeend', projectHTML)

    console.log(`✅ Projeto ${projectName} criado na obra ${obraName} com ID SEGURO: ${finalProjectId}`)
    
    // Aguardar e confirmar que o projeto foi criado no DOM
    setTimeout(() => {
        const createdProject = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${finalProjectId}"]`)
        if (createdProject) {
            console.log(`✅ PROJETO CONFIRMADO NO DOM: ${projectName}`, createdProject.dataset)
        } else {
            console.error(`❌ PROJETO NÃO ENCONTRADO NO DOM: ${projectName}`)
        }
    }, 100)

    return true
}

/**
 * Adiciona um novo projeto à obra especificada - CORREÇÃO COMPLETA
 * @param {string} obraId - ID único da obra
 * @returns {Promise<void>}
 */
async function addNewProjectToObra(obraId) {
    console.log(`➕ Adicionando novo projeto à obra: ${obraId}`)
    
    // ✅ CORREÇÃO: Buscar obra por ID único
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`)
    
    if (!obraBlock) {
        console.error(`❌ Obra com ID ${obraId} não encontrada`)
        
        // Debug: listar obras disponíveis com seus IDs
        console.log('🔍 Obras disponíveis no DOM:')
        document.querySelectorAll('.obra-block').forEach(obra => {
            console.log(`  - Obra: "${obra.dataset.obraName}", ID: "${obra.dataset.obraId}"`)
        })
        return
    }
    
    const obraName = obraBlock.dataset.obraName
    const projectNumber = getNextProjectNumber(obraId)
    const projectName = `Projeto${projectNumber}`
    
    // ✅ CORREÇÃO: Gerar ID hierárquico único para projeto
    const projectId = generateProjectId(obraBlock)

    await createEmptyProject(obraId, obraName, projectId, projectName)
    console.log(`✅ ${projectName} adicionado à obra ${obraName} (ID: ${obraId})`)
}




/**
 * Remove um projeto da obra
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @returns {void}
 */
function deleteProject(obraId, projectId) {
    // ✅ CORREÇÃO: Buscar APENAS por IDs únicos
    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`)
    
    if (!projectElement) {
        console.error(`❌ Projeto com ID ${projectId} não encontrado na obra ${obraId}`)
        return
    }

    const projectName = projectElement.dataset.projectName
    projectElement.remove()
    
    console.log(`🗑️ Projeto ${projectName} (ID: ${projectId}) removido da obra ${obraId}`)
}

if (typeof window !== 'undefined') {
    window.addNewProjectToObra = addNewProjectToObra
    window.getNextProjectNumber = getNextProjectNumber
    window.deleteProject = deleteProject
    window.createEmptyProject = createEmptyProject // ✅ LINHA CRÍTICA FALTANTE
    window.buildProjectHTML = buildProjectHTML // ✅ Adicionar também para consistência
}

export {
    createEmptyProject,
    buildProjectHTML,
    addNewProjectToObra,
    deleteProject
}