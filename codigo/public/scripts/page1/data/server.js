import { SESSION_STORAGE_KEY, REMOVED_PROJECTS_KEY, NORMALIZATION_DONE_KEY, SESSION_ACTIVE_KEY } from "../config/config.js"
import { ensureStringId } from "../utils/utils.js"
import { fetchProjects, normalizeProjectIds, atualizarProjeto } from "./projects.js"
import { showSystemStatus } from "../ui/interface.js"
import { renderProjectFromData, renderRoomFromData, populateRoomInputs } from "./server-utils.js"

// CONSTANTES PARA CONTROLE DE SESSÃO
const SESSION_PROJECTS = 'session_projects';

/**
 * Verifica se a sessão está ativa (z=1) ou encerrada (z=0)
 * @returns {boolean} true se sessão ativa, false se encerrada
 */
function isSessionActive() {
    return sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
}

/**
 * Define o estado da sessão
 * @param {boolean} active - true para ativa, false para encerrada
 */
function setSessionActive(active) {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, active.toString());
    
    // REGRA 3: Quando sessão é encerrada, esvaziar lista y
    if (!active) {
        clearSessionProjects();
        clearRenderedProjects();
    }
}

/**
 * Obtém a lista de projetos da sessão atual (lista y)
 * @returns {Array} Lista de IDs de projetos da sessão
 */
function getSessionProjects() {
    if (!isSessionActive()) return [];
    
    const stored = sessionStorage.getItem(SESSION_PROJECTS);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Define a lista de projetos da sessão atual (lista y)
 * @param {Array} projectIds - Lista de IDs de projetos
 */
function setSessionProjects(projectIds) {
    if (!isSessionActive()) return;
    
    sessionStorage.setItem(SESSION_PROJECTS, JSON.stringify(projectIds));
}

/**
 * Adiciona um projeto à lista da sessão
 * @param {string} projectId - ID do projeto
 */
function addProjectToSession(projectId) {
    if (!isSessionActive()) return;
    
    const sessionProjects = getSessionProjects();
    if (!sessionProjects.includes(projectId)) {
        sessionProjects.push(projectId);
        setSessionProjects(sessionProjects);
    }
}

/**
 * Remove um projeto da lista da sessão
 * @param {string} projectId - ID do projeto
 */
function removeProjectFromSession(projectId) {
    if (!isSessionActive()) return;
    
    const sessionProjects = getSessionProjects();
    const updatedProjects = sessionProjects.filter(id => id !== projectId);
    setSessionProjects(updatedProjects);
}

/**
 * Limpa todos os projetos da sessão
 */
function clearSessionProjects() {
    sessionStorage.removeItem(SESSION_PROJECTS);
    sessionStorage.removeItem(REMOVED_PROJECTS_KEY);
}

/**
 * Remove todos os projetos renderizados da tela
 */
function clearRenderedProjects() {
    const projectsContainer = document.getElementById("projects-container");
    if (!projectsContainer) return;
    
    const projects = projectsContainer.querySelectorAll('.project-block');
    projects.forEach(project => project.remove());
    
    window.GeralCount = 0;
}

/**
 * Inicializa o contador global de projetos
 * @returns {number} Valor atual do contador
 */
function initializeGeralCount() {
    // REGRA 4: Evitar cache de sessões anteriores - resetar se sessão não está ativa
    if (!isSessionActive()) {
        window.GeralCount = 0;
        return 0;
    }
    
    if (typeof window.GeralCount === "undefined" || window.GeralCount === null) {
        window.GeralCount = 0;
    }
    return window.GeralCount;
}

initializeGeralCount()

/**
 * Remove todos os projetos base do HTML
 */
function removeBaseProjectFromHTML() {
    const projectsContainer = document.getElementById("projects-container")
    if (!projectsContainer) return

    const existingProjects = projectsContainer.querySelectorAll(".project-block")
    existingProjects.forEach((project) => project.remove())
}

/**
 * Carrega projetos salvos do servidor para a sessão atual
 */
async function loadProjectsFromServer() {
    console.log("🔄 Carregando projetos do servidor...");
    
    // REGRA 3: Se sessão encerrada, não carregar projetos
    if (!isSessionActive()) {
        console.log("📭 Sessão encerrada - nenhum projeto será carregado");
        clearRenderedProjects();
        return;
    }
    
    try {
        // PRIMEIRO: Buscar apenas projetos da sessão atual do backend
        const response = await fetch('/projetos');
        const sessionProjects = await response.json();
        
        console.log(`📊 Projetos da sessão atual: ${sessionProjects.length}`);

        if (sessionProjects.length === 0) {
            console.log("🔄 Nenhum projeto na sessão - criando projeto base");
            setTimeout(() => {
                createSingleBaseProject();
            }, 100);
            return;
        }

        window.GeralCount = sessionProjects.length;
        removeBaseProjectFromHTML();

        // Renderizar apenas projetos da sessão atual
        for (const projectData of sessionProjects) {
            renderProjectFromData(projectData);
            // Adicionar à lista de sessão local também
            addProjectToSession(projectData.id);
        }
        
        console.log("✅ Projetos da sessão carregados com sucesso");
    } catch (error) {
        console.error("❌ Erro ao carregar projetos:", error);
        // Fallback: criar projeto base em caso de erro
        setTimeout(() => {
            createSingleBaseProject();
        }, 100);
    }
}

/**
 * Carrega máquinas salvas para uma sala específica
 */
async function loadSavedMachinesForRoom(roomBlock, roomData) {
    // REGRA 1: Só carregar máquinas se sessão estiver ativa
    if (!isSessionActive()) return;
    
    const roomId = roomBlock.id.replace("room-content-", "")

    if (roomData.maquinasClimatizacao && Array.isArray(roomData.maquinasClimatizacao)) {
        setTimeout(async () => {
            try {
                if (typeof window.loadSavedMachines !== "undefined") {
                    await window.loadSavedMachines(roomId, roomData.maquinasClimatizacao)
                }
            } catch (error) {
                console.error("[SERVER] Erro ao carregar máquinas:", error)
            }
        }, 500)
    }
}

/**
 * Incrementa o contador global de projetos
 * @returns {number} Novo valor do contador
 */
function incrementGeralCount() {
    // Só incrementar se sessão ativa
    if (!isSessionActive()) return 0;
    
    initializeGeralCount()
    window.GeralCount++
    return window.GeralCount
}

/**
 * Decrementa o contador global de projetos
 * @returns {number} Novo valor do contador
 */
function decrementGeralCount() {
    // Só decrementar se sessão ativa
    if (!isSessionActive()) return 0;
    
    initializeGeralCount()

    if (window.GeralCount > 0) {
        window.GeralCount--

        const existingProjects = document.querySelectorAll(".project-block")

        if (window.GeralCount === 0 && existingProjects.length === 0) {
            setTimeout(() => {
                createSingleBaseProject()
            }, 50)
        } else if (window.GeralCount === 0 && existingProjects.length > 0) {
            window.GeralCount = existingProjects.length
        }
    }
    return window.GeralCount
}

/**
 * Retorna o valor atual do contador global
 * @returns {number} Valor do contador
 */
function getGeralCount() {
    initializeGeralCount()
    return window.GeralCount
}

/**
 * Reseta a lógica de exibição de projetos
 */
function resetDisplayLogic() {
    // REGRA 3: Quando sessão é encerrada, limpar tudo
    setSessionActive(false);
    clearSessionProjects();
    clearRenderedProjects();
    
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    sessionStorage.removeItem(REMOVED_PROJECTS_KEY)
    window.GeralCount = 0
}

/**
 * Inicia uma nova sessão
 */
async function startNewSession() {
    // REGRA 4: Limpar cache de sessões anteriores
    clearSessionProjects();
    clearRenderedProjects();
    
    setSessionActive(true);
    window.GeralCount = 0;
    
    // Iniciar também no backend
    await startBackendSession();
    
    console.log("🆕 Nova sessão iniciada");
}

/**
 * Encerra a sessão atual
 */
async function endSession() {
    // REGRA 3: Quando sessão for encerrada (z=0)
    // - y deve ser esvaziado 
    // - e nenhum projeto deve permanecer visível na tela
    setSessionActive(false);
    clearSessionProjects();
    clearRenderedProjects();
    
    // Encerrar também no backend
    await endBackendSession();
    
    console.log("📭 Sessão encerrada - todos os projetos removidos");
}

/**
 * Cria um único projeto base na interface
 */
function createSingleBaseProject() {
    // REGRA 1: Só criar projeto base se sessão ativa
    if (!isSessionActive()) return;
    
    const projectsContainer = document.getElementById("projects-container")
    if (!projectsContainer) {
        setTimeout(() => {
            const retryContainer = document.getElementById("projects-container")
            if (retryContainer) {
                createProjectBaseHTML(retryContainer)
            }
        }, 600)
        return
    }

    const existingProjects = projectsContainer.querySelectorAll('.project-block[data-project-name="Projeto1"]');

    if (existingProjects.length === 0) {
        createProjectBaseHTML(projectsContainer)
    }
}

/**
 * Cria o HTML do projeto base
 * @param {HTMLElement} container - Container onde o projeto será inserido
 */
function createProjectBaseHTML(container) {
    // REGRA 1: Só criar se sessão ativa
    if (!isSessionActive()) return;
    
    const existingBaseProject = container.querySelector('[data-project-name="Projeto1"]');
    if (existingBaseProject) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const projectHTML = `
        <div class="project-block" data-project-id="${tempId}" data-project-name="Projeto1">
            <div class="project-header">
                <button class="minimizer" onclick="toggleProject('Projeto1')">+</button>
                <h2 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">Projeto1</h2>
                <div class="project-actions">
                    <button class="btn btn-delete" onclick="deleteProject('Projeto1')">Remover</button>
                </div>
            </div>
            <div class="project-content collapsed" id="project-content-Projeto1">
                <p class="empty-message">Nenhuma sala adicionada ainda.</p>
                <div class="add-room-section">
                    <button class="btn btn-add-secondary" onclick="addNewRoom('Projeto1')">+ Adicionar Nova Sala</button>
                </div>
                <div class="project-actions-footer">
                    <button class="btn btn-verify" onclick="verifyProjectData('Projeto1')">Verificar Dados</button>
                    <button class="btn btn-save project-save-btn" onclick="saveProject('Projeto1', event)" data-project-name="Projeto1">Salvar Projeto</button>
                    <button class="btn btn-download" onclick="downloadPDF('Projeto1')">Baixar PDF</button>
                    <button class="btn btn-download" onclick="downloadWord('Projeto1')">Baixar Word</button>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML("beforeend", projectHTML);

    setTimeout(() => {
        addNewRoom("Projeto1");
    }, 800);

    window.GeralCount = Math.max(window.GeralCount, 1);
}

/**
 * Salva o ID do primeiro projeto da sessão
 * @param {string|number} projectId - ID do projeto
 */
function saveFirstProjectIdOfSession(projectId) {
    // Só salvar se sessão ativa
    if (!isSessionActive()) return;
    
    const existingId = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!existingId) {
        const idAsInteger = ensureStringId(projectId)
        if (idAsInteger !== null) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, idAsInteger.toString())
            addProjectToSession(idAsInteger); // Adicionar à lista y
            incrementGeralCount()
        }
    }
}

/**
 * Adiciona um projeto à lista de removidos
 * @param {string|number} projectId - ID do projeto removido
 */
function addProjectToRemovedList(projectId) {
    // Só processar se sessão ativa
    if (!isSessionActive()) return;
    
    projectId = ensureStringId(projectId)

    const removedList = getRemovedProjectsList()

    if (!removedList.includes(projectId)) {
        removedList.push(projectId)
        sessionStorage.setItem(REMOVED_PROJECTS_KEY, JSON.stringify(removedList))
        removeProjectFromSession(projectId); // REGRA 2: Remover da lista y
        decrementGeralCount()
    }
}

/**
 * Retorna a lista de projetos removidos
 * @returns {Array} Lista de IDs de projetos removidos
 */
function getRemovedProjectsList() {
    const stored = sessionStorage.getItem(REMOVED_PROJECTS_KEY)
    return stored ? JSON.parse(stored) : []
}

/**
 * Verifica se um projeto foi removido
 * @param {string|number} projectId - ID do projeto
 * @returns {boolean} True se o projeto foi removido
 */
function isProjectRemoved(projectId) {
    const removedList = getRemovedProjectsList()
    return removedList.includes(projectId)
}

/**
 * Atualiza o botão de salvar/atualizar do projeto
 * @param {string} projectName - Nome do projeto
 * @param {boolean} hasId - Se o projeto tem ID
 */
function updateProjectButton(projectName, hasId) {
    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
    if (!projectBlock) return

    const saveButton = projectBlock.querySelector(
        ".project-actions-footer .btn-save, .project-actions-footer .btn-update",
    )
    if (!saveButton) return

    if (hasId) {
        saveButton.textContent = "Atualizar Projeto"
        saveButton.classList.remove("btn-save")
        saveButton.classList.add("btn-update")
    } else {
        saveButton.textContent = "Salvar Projeto"
        saveButton.classList.remove("btn-update")
        saveButton.classList.add("btn-save")
    }
}

/**
 * Normaliza todos os IDs de projetos no servidor
 */
async function normalizeAllProjectsOnServer() {
    // Só normalizar se sessão ativa
    if (!isSessionActive()) return;
    
    const alreadyNormalized = sessionStorage.getItem(NORMALIZATION_DONE_KEY)
    if (alreadyNormalized === "true") return

    try {
        const allProjects = await fetchProjects()

        if (allProjects.length === 0) {
            sessionStorage.setItem(NORMALIZATION_DONE_KEY, "true")
            return
        }

        let normalizedCount = 0
        for (const project of allProjects) {
            const needsNormalization = typeof project.id === "string"

            if (needsNormalization) {
                const normalizedProject = normalizeProjectIds(project)
                const result = await atualizarProjeto(normalizedProject.id, normalizedProject)

                if (result) {
                    normalizedCount++
                }
            }
        }

        if (normalizedCount > 0) {
            showSystemStatus(`${normalizedCount} projeto(s) com IDs corrigidos no servidor`, "success")
        }

        sessionStorage.setItem(NORMALIZATION_DONE_KEY, "true")
    } catch (error) {
        console.error(" Erro ao normalizar IDs no servidor:", error)
        showSystemStatus("ERRO: Não foi possível normalizar IDs no servidor", "error")
    }
}

// NOVAS FUNÇÕES PARA SINCRONIZAÇÃO COM BACKEND

/**
 * Inicia sessão no backend
 */
async function startBackendSession() {
    try {
        const response = await fetch('/api/session/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        console.log("🆕 Sessão iniciada no backend:", result.session_id);
        return result;
    } catch (error) {
        console.error("❌ Erro ao iniciar sessão no backend:", error);
        return null;
    }
}

/**
 * Encerra sessão no backend
 */
async function endBackendSession() {
    try {
        const response = await fetch('/api/session/end', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        console.log("📭 Sessão encerrada no backend:", result.session_id);
        return result;
    } catch (error) {
        console.error("❌ Erro ao encerrar sessão no backend:", error);
        return null;
    }
}

// Exportar as funções
export {
    loadProjectsFromServer,
    removeBaseProjectFromHTML,
    renderProjectFromData,
    renderRoomFromData,
    populateRoomInputs,
    normalizeAllProjectsOnServer,
    saveFirstProjectIdOfSession,
    addProjectToRemovedList,
    getRemovedProjectsList,
    isProjectRemoved,
    updateProjectButton,
    resetDisplayLogic,
    incrementGeralCount,
    decrementGeralCount,
    getGeralCount,
    createSingleBaseProject,
    // Novas funções de controle de sessão
    isSessionActive,
    setSessionActive,
    startNewSession,
    endSession,
    getSessionProjects,
    addProjectToSession,
    removeProjectFromSession
}