import { createEmptyRoom } from '../../data/modules/rooms.js';
import { generateProjectId } from '../../data/utils/id-generator.js';
import { getNextProjectNumber } from '../../data/utils/data-utils.js';
import { removeEmptyObraMessage } from '../../ui/helpers.js';
import { addNewRoomToProject } from '../../data/modules/rooms.js';
import { buildServicosInProject } from './servicos.js';

/**
 * Utilitário: converte texto monetário para número
 */
function parseCurrency(text) {
    if (!text || typeof text !== 'string') return 0;
    let cleaned = text.replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

/**
 * Utilitário: formata número para moeda brasileira
 */
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * ATUALIZA O TOTAL DO PROJETO (NÍVEL 3)
 * Escuta eventos das salas e dispara evento para a obra
 */
function updateProjectTotal(projectId) {
    const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
    if (!projectElement) return;

    let total = 0;

    // Soma os totais das salas
    projectElement.querySelectorAll('.room-block').forEach(room => {
        const roomId = room.dataset.roomId;
        const roomTotal = document.getElementById(`room-total-${roomId}`);
        if (roomTotal) {
            total += parseCurrency(roomTotal.textContent);
        }
    });

    // Soma os serviços (se existirem)
    try {
        if (typeof window.calculateServicosTotal === 'function') {
            total += window.calculateServicosTotal(projectId);
        }
    } catch (error) {
        // Silencia erro
    }

    const projectTotalSpan = document.getElementById(`total-projeto-valor-${projectId}`);
    if (projectTotalSpan) {
        projectTotalSpan.textContent = formatCurrency(total);
    } else {
        const addRoomSection = projectElement.querySelector('.add-room-section');
        if (addRoomSection) {
            addRoomSection.insertAdjacentHTML('beforeend',
                `<span class="project-total-value" id="total-projeto-valor-${projectId}" 
                      data-project-id="${projectId}" title="Valor total do projeto">
                    ${formatCurrency(total)}
                </span>`
            );
        }
    }

    // DISPARA EVENTO PARA A OBRA (NÍVEL 4)
    const obraId = projectElement.dataset.obraId;
    if (obraId) {
        document.dispatchEvent(new CustomEvent('projetoAtualizado', {
            detail: { projectId, obraId, total }
        }));
    }
}

// ESCUTA EVENTOS DAS SALAS (NÍVEL 2)
document.addEventListener('salaAtualizada', (e) => {
    const { projectId } = e.detail;
    if (projectId) {
        setTimeout(() => updateProjectTotal(projectId), 10);
    }
});

/**
 * Constrói o HTML de um projeto
 */
function buildProjectHTML(obraId, obraName, projectId, projectName) {
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        return '';
    }

    const finalProjectId = projectId || generateProjectId(document.querySelector(`[data-obra-id="${obraId}"]`));

    if (!finalProjectId || finalProjectId === 'undefined' || finalProjectId === 'null') {
        return '';
    }

    return `
        <div class="project-block" 
             data-project-id="${finalProjectId}" 
             data-project-name="${projectName}" 
             data-obra-id="${obraId}" 
             data-obra-name="${obraName}">
            <div class="project-header">
                <button class="minimizer" onclick="toggleProject('${finalProjectId}', event)">+</button>
                <h3 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">${projectName}</h3>
                <div class="project-actions">
                    <button class="btn btn-delete" onclick="deleteProject('${obraId}', '${finalProjectId}')">Remover Projeto</button>
                </div>
            </div>
            
            <div class="project-content collapsed" id="project-content-${finalProjectId}">                
                <div class="rooms-container">
                    <p class="empty-message">Adicione salas a este projeto...</p>
                </div>
                
                <div class="add-room-section">
                    <button class="btn btn-add-secondary" onclick="addNewRoom('${obraId}', '${finalProjectId}')">
                        + Adicionar Sala
                    </button>
                    
                    <span class="project-total-value" id="total-projeto-valor-${finalProjectId}" 
                          data-project-id="${finalProjectId}" 
                          title="Valor total do projeto">
                        R$ 0,00
                    </span>
                </div>
                ${buildServicosInProject(finalProjectId)}
            </div>
        </div>
    `;
}

/**
 * Cria um projeto vazio na obra
 */
async function createEmptyProject(obraId, obraName, projectId, projectName) {
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraBlock) return false;

    const projectsContainer = document.getElementById(`projects-${obraId}`);
    if (!projectsContainer) return false;

    removeEmptyObraMessage(obraName);

    const projectNumber = getNextProjectNumber(obraId);
    const finalProjectId = projectId || generateProjectId(obraBlock, projectNumber);

    if (!finalProjectId) return false;

    const projectHTML = buildProjectHTML(obraId, obraName, finalProjectId, projectName);
    projectsContainer.insertAdjacentHTML('beforeend', projectHTML);

    const emptyMessage = projectsContainer.querySelector('.empty-message');
    if (emptyMessage) emptyMessage.remove();

    // Inicializa o total do projeto
    setTimeout(() => updateProjectTotal(finalProjectId), 125);

    return true;
}

/**
 * Adiciona um novo projeto à obra especificada
 */
async function addNewProjectToObra(obraId) {
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraBlock) return;

    const obraName = obraBlock.dataset.obraName;
    const projectNumber = getNextProjectNumber(obraId);
    const projectName = `Projeto${projectNumber}`;
    const projectId = generateProjectId(obraBlock);

    await createEmptyProject(obraId, obraName, projectId, projectName);

    if (typeof window.addNewRoomToProject === 'function') {
        await window.addNewRoomToProject(obraId, projectId);
    }
}

/**
 * Remove um projeto da obra
 */
function deleteProject(obraId, projectId) {
    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`);
    if (!projectElement) return;

    projectElement.remove();

    // Dispara evento para a obra recalcular
    document.dispatchEvent(new CustomEvent('projetoAtualizado', {
        detail: { projectId, obraId, total: 0 }
    }));
}

/**
 * Inicializa totais para projetos existentes
 */
function initializeExistingProjectTotals() {
    document.querySelectorAll('.project-block').forEach(project => {
        const projectId = project.dataset.projectId;
        if (projectId) {
            let totalElement = document.getElementById(`total-projeto-valor-${projectId}`);
            if (!totalElement) {
                const addRoomSection = project.querySelector('.add-room-section');
                if (addRoomSection) {
                    addRoomSection.insertAdjacentHTML('beforeend',
                        `<span class="project-total-value" id="total-projeto-valor-${projectId}" 
                              data-project-id="${projectId}" title="Valor total do projeto">
                            R$ 0,00
                        </span>`
                    );
                }
            }
            setTimeout(() => updateProjectTotal(projectId), 125);
        }
    });
}

// Funções globais
if (typeof window !== 'undefined') {
    window.addNewProjectToObra = addNewProjectToObra;
    window.getNextProjectNumber = getNextProjectNumber;
    window.deleteProject = deleteProject;
    window.createEmptyProject = createEmptyProject;
    window.buildProjectHTML = buildProjectHTML;
    window.addNewRoomToProject = addNewRoomToProject || window.addNewRoomToProject;
    window.initializeExistingProjectTotals = initializeExistingProjectTotals;
    window.parseCurrency = parseCurrency;
    window.updateProjectTotal = updateProjectTotal;
}

// Inicializa quando carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExistingProjectTotals);
} else {
    setTimeout(initializeExistingProjectTotals, 125);
}

export {
    createEmptyProject,
    buildProjectHTML,
    addNewProjectToObra,
    deleteProject,
    initializeExistingProjectTotals,
    parseCurrency,
    formatCurrency
};
