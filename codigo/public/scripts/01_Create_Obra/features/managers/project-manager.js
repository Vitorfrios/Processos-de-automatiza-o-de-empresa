import { createEmptyRoom } from '../../data/modules/rooms.js';
import { generateProjectId } from '../../data/utils/id-generator.js';
import { getNextProjectNumber } from '../../data/utils/data-utils.js'
import { removeEmptyObraMessage } from '../../ui/helpers.js';
import { addNewRoomToProject } from '../../data/modules/rooms.js';
import { buildServicosInProject } from './servicos.js';

// Cache de totais por projeto
const projectTotals = new Map();

/**
 * Converte texto monetário para número
 */
function parseCurrency(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Remove "R$" e espaços
    let cleaned = text.replace(/R\$/g, '').trim();
    
    // Se não tem vírgula, assume que é valor inteiro
    if (!cleaned.includes(',')) {
        // Remove pontos (separadores de milhar)
        cleaned = cleaned.replace(/\./g, '');
        const result = parseFloat(cleaned);
        return isNaN(result) ? 0 : result;
    }
    
    // Tem vírgula (formato brasileiro)
    // Remove todos os pontos (separadores de milhar)
    cleaned = cleaned.replace(/\./g, '');
    
    // Troca vírgula por ponto para parseFloat
    cleaned = cleaned.replace(',', '.');
    
    const result = parseFloat(cleaned);
    return isNaN(result) ? 0 : result;
}

/**
 * Sistema de Eventos para total do projeto
 */
class ProjectTotalManager {
    constructor() {
        this.observers = new Map();
        this.updating = new Set();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('valorAtualizado', (event) => {
            const { projectId } = event.detail;
            if (projectId && !this.updating.has(projectId)) {
                this.scheduleUpdate(projectId);
            }
        });
    }

    scheduleUpdate(projectId) {
        clearTimeout(this[`timeout_${projectId}`]);
        this[`timeout_${projectId}`] = setTimeout(() => {
            this.updateProjectTotal(projectId);
        }, 300);
    }

    calculateProjectTotal(projectId) {
        const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
        if (!projectElement) return 0;

        let total = 0;

        // 1. Serviços
        try {
            if (typeof calculateServicosTotal === 'function') {
                const servicosTotal = calculateServicosTotal(projectId);
                total += servicosTotal;
            }
        } catch (error) {}

        // 2. Salas
        const rooms = projectElement.querySelectorAll('.room-block');

        rooms.forEach(room => {
            const roomId = room.dataset.roomId;

            // Máquinas
            const machinesElement = this.findMachinesTotalElement(roomId);
            if (machinesElement) {
                const machinesText = machinesElement.textContent.trim();
                const machinesValue = parseCurrency(machinesText);
                total += machinesValue;
            }

            // Acessórios
            const acessoriosElement = document.getElementById(`acessorios-total-${roomId}`);
            if (acessoriosElement) {
                const acessoriosText = acessoriosElement.textContent.trim();
                const acessoriosValue = parseCurrency(acessoriosText);
                total += acessoriosValue;
            }

            // Dutos
            const dutosElement = document.getElementById(`dutos-total-${roomId}`);
            if (dutosElement) {
                const dutosText = dutosElement.textContent.trim();
                const dutosValue = parseCurrency(dutosText);
                total += dutosValue;
            }

            // Tubulação
            const tubulacaoElement = document.getElementById(`total-geral-valor-${roomId}`);
            if (tubulacaoElement) {
                const tubulacaoText = tubulacaoElement.textContent.trim();
                const tubulacaoValue = parseCurrency(tubulacaoText);
                total += tubulacaoValue;
            }
        });

        return total;
    }

    /**
     * Encontra o elemento de total de máquinas
     */
    findMachinesTotalElement(roomId) {
        // Tenta primeiro pelo formato direto
        let element = document.getElementById(`total-all-machines-price-${roomId}`);

        if (element) return element;

        // Se não encontrar, busca por elementos que contenham o padrão
        const allElements = document.querySelectorAll('[id*="total-all-machines-price-"]');

        for (const el of allElements) {
            // Verifica se o ID termina com o roomId ou contém o roomId
            if (el.id.includes(roomId) ||
                el.id.endsWith(roomId) ||
                el.id.includes(`sala_${roomId.split('_').pop()}`)) {
                return el;
            }
        }

        return null;
    }

    updateProjectTotal(projectId) {
        if (this.updating.has(projectId)) return;

        this.updating.add(projectId);

        try {
            const total = this.calculateProjectTotal(projectId);
            this.updateDisplay(projectId, total);
            projectTotals.set(projectId, total);
        } catch (error) {
        } finally {
            this.updating.delete(projectId);
        }
    }

    updateDisplay(projectId, total) {
        const displayElement = document.getElementById(`total-projeto-valor-${projectId}`);
        if (!displayElement) return;

        const formattedValue = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(total);

        displayElement.textContent = formattedValue;

        // Removidas as classes has-value, high-value e zero
        displayElement.classList.add('updating');
        setTimeout(() => {
            displayElement.classList.remove('updating');
        }, 500);
    }

    registerObserver(projectId, callback) {
        if (!this.observers.has(projectId)) {
            this.observers.set(projectId, new Set());
        }
        this.observers.get(projectId).add(callback);
    }

    unregisterObserver(projectId, callback) {
        if (this.observers.has(projectId)) {
            this.observers.get(projectId).delete(callback);
        }
    }
}

// Inicializa o gerenciador global
const totalManager = new ProjectTotalManager();

/**
 * Constrói o HTML de um projeto
 */
function buildProjectHTML(obraId, obraName, projectId, projectName) {
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        return ''
    }

    const finalProjectId = projectId || generateProjectId(document.querySelector(`[data-obra-id="${obraId}"]`))

    if (!finalProjectId || finalProjectId === 'undefined' || finalProjectId === 'null') {
        return ''
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
    `
}

/**
 * Cria um projeto vazio na obra
 */
async function createEmptyProject(obraId, obraName, projectId, projectName) {
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`)

    if (!obraBlock) {
        return false
    }

    const projectsContainer = document.getElementById(`projects-${obraId}`)
    if (!projectsContainer) {
        return false
    }

    removeEmptyObraMessage(obraName)

    const projectNumber = getNextProjectNumber(obraId)
    const finalProjectId = projectId || generateProjectId(obraBlock, projectNumber)

    if (!finalProjectId) {
        return false
    }

    const projectHTML = buildProjectHTML(obraId, obraName, finalProjectId, projectName)
    projectsContainer.insertAdjacentHTML('beforeend', projectHTML)

    // Remove mensagem de "nenhum projeto"
    const emptyMessage = projectsContainer.querySelector('.empty-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    setTimeout(() => {
        totalManager.updateProjectTotal(finalProjectId);
    }, 1000);

    return true
}

/**
 * Adiciona um novo projeto à obra especificada
 */
async function addNewProjectToObra(obraId) {
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);

    if (!obraBlock) {
        return;
    }

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
    const projectElement = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`)

    if (!projectElement) {
        return
    }

    projectTotals.delete(projectId);

    const projectName = projectElement.dataset.projectName
    projectElement.remove()
}

/**
 * Inicializa totais para projetos existentes
 */
function initializeExistingProjectTotals() {
    const projectBlocks = document.querySelectorAll('.project-block');

    projectBlocks.forEach(project => {
        const projectId = project.dataset.projectId;
        if (projectId) {
            let totalElement = document.getElementById(`total-projeto-valor-${projectId}`);

            if (!totalElement) {
                const addRoomSection = project.querySelector('.add-room-section');
                if (addRoomSection) {
                    addRoomSection.insertAdjacentHTML('beforeend',
                        `<span class="project-total-value" id="total-projeto-valor-${projectId}" 
                              data-project-id="${projectId}" 
                              title="Valor total do projeto">
                            R$ 0,00
                        </span>`
                    );
                }
            }

            setTimeout(() => {
                totalManager.updateProjectTotal(projectId);
            }, 1000);
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
    window.parseCurrency  = parseCurrency ;
    window.updateProjectTotal = (projectId) => totalManager.updateProjectTotal(projectId);
}

// Inicializa quando carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExistingProjectTotals);
} else {
    setTimeout(initializeExistingProjectTotals, 1000);
}

export {
    createEmptyProject,
    buildProjectHTML,
    addNewProjectToObra,
    deleteProject,
    initializeExistingProjectTotals
}