import { SESSION_STORAGE_KEY, REMOVED_PROJECTS_KEY, NORMALIZATION_DONE_KEY, SESSION_ACTIVE_KEY } from "../config/config.js"
import { ensureStringId } from "../utils/utils.js"
import { fetchProjects, normalizeProjectIds, atualizarProjeto } from "./projects.js"
import { showSystemStatus } from "../ui/interface.js"
import { renderProjectFromData, renderRoomFromData, populateRoomInputs } from "./server-utils.js"

// CONSTANTES PARA CONTROLE DE SESSÃO
const SESSION_PROJECTS = 'session_projects';

/**
 * Verifica se a sessão está ativa
 */
function isSessionActive() {
    return sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
}

/**
 * Define o estado da sessão
 */
function setSessionActive(active) {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, active.toString());
    
    if (!active) {
        clearSessionProjects();
        clearRenderedProjects();
    }
}

/**
 * Obtém a lista de projetos da sessão atual
 */
function getSessionProjects() {
    if (!isSessionActive()) return [];
    
    const stored = sessionStorage.getItem(SESSION_PROJECTS);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Define a lista de projetos da sessão atual
 */
function setSessionProjects(projectIds) {
    if (!isSessionActive()) return;
    
    sessionStorage.setItem(SESSION_PROJECTS, JSON.stringify(projectIds));
}

/**
 * Adiciona um projeto à lista da sessão
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
 */
function removeProjectFromSessionLocal(projectId) {
    if (!isSessionActive()) return;
    
    const sessionProjects = getSessionProjects();
    const updatedProjects = sessionProjects.filter(id => id !== projectId);
    setSessionProjects(updatedProjects);
}

/**
 * Limpa todos os projetos da sessão local
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
 */
function initializeGeralCount() {
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
 * Carrega projetos salvos do servidor para a sessão atual - CORRIGIDO
 */
async function loadProjectsFromServer() {
    console.log("🔄 Carregando projetos do servidor...");
    
    if (!isSessionActive()) {
        console.log("📭 Sessão encerrada - nenhum projeto será carregado");
        clearRenderedProjects();
        return;
    }
    
    try {
        // 1. Busca sessão atual do backend (APENAS IDs)
        const sessionResponse = await fetch('/api/sessions/current');
        if (!sessionResponse.ok) {
            throw new Error('Falha ao carregar sessão');
        }
        
        const sessionData = await sessionResponse.json();
        console.log("📋 Dados da sessão:", sessionData);

        // 2. Extrai IDs da sessão
        const sessionIds = Object.keys(sessionData.sessions);


        const currentSessionId = sessionIds[0];
        const projectIds = sessionData.sessions[currentSessionId].projects;
        
        console.log(`📊 Sessão ${currentSessionId} com ${projectIds.length} projetos:`, projectIds);



        // 3. Busca projetos completos do backup
        const projectsResponse = await fetch('/projetos');
        if (!projectsResponse.ok) {
            throw new Error('Falha ao carregar projetos');
        }

        const allProjects = await projectsResponse.json();
        
        // 4. Filtra apenas projetos que estão na sessão
        const sessionProjects = allProjects.filter(project => 
            projectIds.includes(String(project.id))
        );

        console.log(`🎯 Carregando ${sessionProjects.length} projetos da sessão`);

        // 5. Limpa interface e renderiza projetos
        removeBaseProjectFromHTML();
        
        let loadedCount = 0;
        for (const projectData of sessionProjects) {
            await renderProjectFromData(projectData);
            addProjectToSession(projectData.id);
            loadedCount++;
        }
        
        window.GeralCount = loadedCount;
        console.log(`✅ ${loadedCount} projeto(s) da sessão carregados com sucesso`);
        
    } catch (error) {
        console.error("❌ Erro ao carregar projetos da sessão:", error);

    }
}

/**
 * Carrega máquinas salvas para uma sala específica
 */
async function loadSavedMachinesForRoom(roomBlock, roomData) {
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
 */
function incrementGeralCount() {
    if (!isSessionActive()) return 0;
    
    initializeGeralCount()
    window.GeralCount++
    return window.GeralCount
}

/**
 * Decrementa o contador global de projetos
 */
function decrementGeralCount() {
    if (!isSessionActive()) return 0;
    
    initializeGeralCount()

    if (window.GeralCount > 0) {
        window.GeralCount--

        const existingProjects = document.querySelectorAll(".project-block")

        if (window.GeralCount === 0 && existingProjects.length === 0) {
            // Não cria projeto base automaticamente
        } else if (window.GeralCount === 0 && existingProjects.length > 0) {
            window.GeralCount = existingProjects.length
        }
    }
    return window.GeralCount
}

/**
 * Retorna o valor atual do contador global
 */
function getGeralCount() {
    initializeGeralCount()
    return window.GeralCount
}

/**
 * Reseta a lógica de exibição de projetos
 */
function resetDisplayLogic() {
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
    clearSessionProjects();
    clearRenderedProjects();
    
    setSessionActive(true);
    window.GeralCount = 0;
    
    await startBackendSession();
    
    console.log("🆕 Nova sessão iniciada");
}

/**
 * Encerra a sessão atual - FUNÇÃO PRINCIPAL DO BOTÃO "ENCERRAR SERVIDOR"
 */
async function shutdownManual() {
    if (!confirm('Tem certeza que deseja encerrar o servidor? Todos os projetos em sessão serão removidos.')) {
        return;
    }
    
    try {
        // Limpa sessão no backend
        const response = await fetch('/api/sessions/shutdown', {
            method: 'POST'
        });
        
        if (response.ok) {
            // Limpa sessão local
            setSessionActive(false);
            clearSessionProjects();
            clearRenderedProjects();
            window.GeralCount = 0;
            
            console.log("📭 Servidor encerrado - sessão limpa com sucesso");
            showSystemStatus('Servidor encerrado. Sessão limpa com sucesso.', 'success');
        } else {
            throw new Error('Falha ao encerrar servidor no backend');
        }
    } catch (error) {
        console.error('❌ Erro ao encerrar servidor:', error);
        showSystemStatus('Erro ao encerrar servidor', 'error');
    }
}

/**
 * Remove um projeto individual da sessão (BACKEND)
 */
async function removeProjectFromSession(projectId) {
    if (!isSessionActive()) return;
    
    try {
        const response = await fetch(`/api/sessions/remove-project/${projectId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Falha ao remover projeto da sessão no backend');
        }
        
        // Remove também da sessão local
        removeProjectFromSessionLocal(projectId);
        
        console.log(`🗑️ Projeto ${projectId} removido da sessão`);
        return await response.json();
    } catch (error) {
        console.error('❌ Erro ao remover projeto da sessão:', error);
        throw error;
    }
}

/**
 * Garante que apenas uma sessão esteja ativa por vez
 */
async function ensureSingleActiveSession() {
    try {
        const response = await fetch('/api/sessions/ensure-single', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Falha ao configurar sessão única');
        }
        
        const result = await response.json();
        console.log("✅ Sessão única configurada:", result);
        return result;
    } catch (error) {
        console.error('❌ Erro ao configurar sessão única:', error);
        throw error;
    }
}



/**
 * Salva o ID do primeiro projeto da sessão
 */
function saveFirstProjectIdOfSession(projectId) {
    if (!isSessionActive()) return;
    
    const existingId = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!existingId) {
        const idAsInteger = ensureStringId(projectId)
        if (idAsInteger !== null) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, idAsInteger.toString())
            addProjectToSession(idAsInteger);
            incrementGeralCount()
        }
    }
}

/**
 * Adiciona um projeto à lista de removidos
 */
function addProjectToRemovedList(projectId) {
    if (!isSessionActive()) return;
    
    projectId = ensureStringId(projectId)

    const removedList = getRemovedProjectsList()

    if (!removedList.includes(projectId)) {
        removedList.push(projectId)
        sessionStorage.setItem(REMOVED_PROJECTS_KEY, JSON.stringify(removedList))
        removeProjectFromSession(projectId);
        decrementGeralCount()
    }
}

/**
 * Retorna a lista de projetos removidos
 */
function getRemovedProjectsList() {
    const stored = sessionStorage.getItem(REMOVED_PROJECTS_KEY)
    return stored ? JSON.parse(stored) : []
}

/**
 * Verifica se um projeto foi removido
 */
function isProjectRemoved(projectId) {
    const removedList = getRemovedProjectsList()
    return removedList.includes(projectId)
}

/**
 * Atualiza o botão de salvar/atualizar do projeto
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

// FUNÇÕES PARA SINCRONIZAÇÃO COM BACKEND

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


/**
 * Inicializa a sessão automaticamente quando o sistema carrega
 */
async function initializeSession() {
    console.log("🔄 Inicializando sessão...");
    
    // Verifica se já existe uma sessão ativa
    if (!isSessionActive()) {
        console.log("🆕 Iniciando nova sessão automaticamente");
        await startNewSession();
    } else {
        console.log("✅ Sessão já está ativa");
    }
    
    // Carrega projetos da sessão
    await loadProjectsFromServer();
}

// E modifique a exportação para incluir a nova função:
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
    isSessionActive,
    setSessionActive,
    startNewSession,
    getSessionProjects,
    addProjectToSession,
    removeProjectFromSession,
    shutdownManual,
    ensureSingleActiveSession,
    initializeSession
}