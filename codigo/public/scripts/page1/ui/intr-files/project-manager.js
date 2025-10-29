// project-manager.js

import { createEmptyRoom } from '../../data/rooms.js'
import { generateProjectId } from '../../data/data-utils.js'
import { removeEmptyObraMessage } from './ui-helpers.js'

/**
 * Gerenciador de projetos
 */


/**
 * Cria um projeto vazio dentro de uma obra
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto
 * @param {string} projectId - ID do projeto (opcional)
 */
function createEmptyProject(obraName, projectName, projectId) {
    console.log(`📁 [CREATE PROJECT] Buscando obra: "${obraName}" para criar projeto: "${projectName}"`);
    
    // ✅ CORREÇÃO: Buscar obra com seletor mais específico
    const obraElement = document.querySelector(`.obra-block[data-obra-name="${obraName}"]`);
    
    if (!obraElement) {
        console.error(`❌ Obra "${obraName}" não encontrada no DOM`);
        console.log(`🔍 Obras disponíveis:`, Array.from(document.querySelectorAll('.obra-block')).map(o => o.dataset.obraName));
        return;
    }

    console.log(`✅ Obra encontrada:`, obraElement.dataset);

    const finalProjectId = projectId || generateProjectId(obraElement);
    const projectHTML = buildProjectHTML(obraName, projectName, finalProjectId);
    const obraProjectsContainer = document.getElementById(`projects-${obraName}`);

    if (obraProjectsContainer) {
        console.log(`✅ Container de projetos encontrado: projects-${obraName}`);
        
        // ✅ CORREÇÃO: Remover mensagem de obra vazia antes de inserir
        const emptyMessage = obraProjectsContainer.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
            console.log(`✅ Mensagem de obra vazia removida`);
        }
        
        // ✅ CORREÇÃO: Inserir projeto no container
        obraProjectsContainer.insertAdjacentHTML("beforeend", projectHTML);
        console.log(`✅ Projeto ${projectName} criado na obra ${obraName} com ID: ${finalProjectId}`);
        
        // ✅ CORREÇÃO: Verificar se o projeto foi realmente criado
        setTimeout(() => {
            const createdProject = document.querySelector(`[data-project-name="${projectName}"][data-obra-name="${obraName}"]`);
            if (createdProject) {
                console.log(`✅ PROJETO CONFIRMADO NO DOM: ${projectName}`, createdProject);
            } else {
                console.error(`❌ PROJETO NÃO CRIADO: ${projectName} não encontrado no DOM após criação`);
            }
        }, 100);
    } else {
        console.error(`❌ Container de projetos não encontrado para obra ${obraName}`);
        console.log(`🔍 Containers disponíveis:`, Array.from(document.querySelectorAll('[id^="projects-"]')).map(c => c.id));
    }
}

/**
 * Constrói o HTML completo de um projeto dentro de uma obra
 * Cria a estrutura DOM com header, conteúdo recolhível e ações
 * @param {string} obraName - Nome da obra pai do projeto
 * @param {string} projectName - Nome do projeto a ser criado
 * @param {string|number|null} projectId - ID único do projeto (opcional)
 * @returns {string} HTML completo do bloco do projeto
 */
function buildProjectHTML(obraName, projectName, projectId) {
    const hasId = projectId !== null && projectId !== undefined && projectId !== ""
    // ID único incluindo obra para evitar conflitos
    const uniqueProjectId = `${obraName}-${projectName}`.replace(/\s+/g, '-').toLowerCase()

    console.log(`🔨 [BUILD PROJECT HTML] Obra: ${obraName}, Projeto: ${projectName}, ID: ${projectId}, UniqueID: ${uniqueProjectId}`);

    return `
    <div class="project-block" data-project-id="${projectId || ""}" data-project-name="${projectName}" data-obra-name="${obraName}">
      <div class="project-header">
        <button class="minimizer" onclick="toggleProject('${uniqueProjectId}', event)">+</button>
        <h3 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">${projectName}</h3>
        <div class="project-actions">
          <button class="btn btn-delete" onclick="deleteProject('${obraName}', '${projectName}')">Remover</button>
        </div>
      </div>
      <div class="project-content collapsed" id="project-content-${uniqueProjectId}">
        <p class="empty-message">Adicione salas a este projeto...</p>
        <div class="add-room-section">
          <button class="btn btn-add-secondary" onclick="addNewRoom('${obraName}', '${projectName}', '${uniqueProjectId}')">+ Adicionar Nova Sala</button>
        </div>
      </div>
    </div>
  `
}

/**
 * Adiciona um novo projeto à obra especificada
 * @param {string} obraName - Nome da obra
 */
function addNewProjectToObra(obraName) {
  try {
    const projectNumber = getNextProjectNumber(obraName)
    const projectName = `Projeto${projectNumber}`

    console.log(`➕ Adicionando projeto ${projectName} à obra ${obraName}`)
    
    createEmptyProject(obraName, projectName, null)

    const defaultRoomName = "Sala1"
    createEmptyRoom(obraName, projectName, defaultRoomName, null)

    console.log(`📁 ${projectName} adicionado à obra ${obraName} com sala padrão: ${defaultRoomName}`)

  } catch (error) {
    console.error("❌ Erro ao adicionar novo projeto:", error)
    alert("Erro ao criar novo projeto. Verifique o console para detalhes.")
  }
}

/**
 * Obtém o próximo número de projeto dentro de uma obra
 * @param {string} obraName - Nome da obra
 * @returns {number} Próximo número disponível para projeto
 */
function getNextProjectNumber(obraName) {
  const obraElement = document.querySelector(`[data-obra-name="${obraName}"]`)
  if (!obraElement) return 1

  const projects = obraElement.querySelectorAll('.project-block')
  const projectNumbers = Array.from(projects).map(project => {
    const projectName = project.dataset.projectName
    const match = projectName.match(/Projeto(\d+)/)
    return match ? parseInt(match[1]) : 0
  })

  const maxNumber = Math.max(0, ...projectNumbers)
  return maxNumber + 1
}

export {
    createEmptyProject,
    buildProjectHTML,
    addNewProjectToObra,
    getNextProjectNumber,
}