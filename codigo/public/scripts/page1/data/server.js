import { SESSION_STORAGE_KEY, REMOVED_PROJECTS_KEY, NORMALIZATION_DONE_KEY, SESSION_ACTIVE_KEY } from "../config/config.js"
import { ensureStringId } from "../utils/utils.js"
import { showSystemStatus } from "../ui/interface.js"

// CONSTANTES PARA CONTROLE DE SESSÃO - ATUALIZADAS PARA OBRAS
const SESSION_OBRAS = 'session_obras';

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
        clearSessionObras();
        clearRenderedObras();
    }
}

/**
 * Obtém a lista de OBRAS da sessão atual - ATUALIZADO
 */
function getSessionObras() {
    if (!isSessionActive()) return [];
    
    const stored = sessionStorage.getItem(SESSION_OBRAS);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Define a lista de OBRAS da sessão atual - ATUALIZADO
 */
function setSessionObras(obraIds) {
    if (!isSessionActive()) return;
    
    sessionStorage.setItem(SESSION_OBRAS, JSON.stringify(obraIds));
}

/**
 * Adiciona uma OBRA à lista da sessão - ATUALIZADO
 */
function addObraToSession(obraId) {
    if (!isSessionActive()) return;
    
    const sessionObras = getSessionObras();
    if (!sessionObras.includes(obraId)) {
        sessionObras.push(obraId);
        setSessionObras(sessionObras);
    }
}

/**
 * Remove uma OBRA da lista da sessão - ATUALIZADO
 */
function removeObraFromSessionLocal(obraId) {
    if (!isSessionActive()) return;
    
    const sessionObras = getSessionObras();
    const updatedObras = sessionObras.filter(id => id !== obraId);
    setSessionObras(updatedObras);
}

/**
 * Limpa todas as OBRAS da sessão local - ATUALIZADO
 */
function clearSessionObras() {
    sessionStorage.removeItem(SESSION_OBRAS);
    sessionStorage.removeItem(REMOVED_PROJECTS_KEY);
}

/**
 * Remove todas as OBRAS renderizadas da tela - ATUALIZADO
 */
function clearRenderedObras() {
    const obrasContainer = document.getElementById("projects-container");
    if (!obrasContainer) return;
    
    const obras = obrasContainer.querySelectorAll('.obra-block');
    obras.forEach(obra => obra.remove());
    
    window.GeralCount = 0;
}

/**
 * Inicializa o contador global de OBRAS - ATUALIZADO
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
 * Remove todas as OBRAS base do HTML - ATUALIZADO
 */
function removeBaseObraFromHTML() {
    const obrasContainer = document.getElementById("projects-container")
    if (!obrasContainer) return

    const existingObras = obrasContainer.querySelectorAll(".obra-block")
    existingObras.forEach((obra) => obra.remove())
}

/**
 * Carrega OBRAS salvas do servidor para a sessão atual - ATUALIZADO PARA OBRAS
 */
async function loadObrasFromServer() {
    console.log("🔄 Carregando OBRAS do servidor...");
    
    if (!isSessionActive()) {
        console.log("📭 Sessão encerrada - nenhuma obra será carregada");
        clearRenderedObras();
        return;
    }
    
    try {
        // 1. Busca sessão atual do backend
        const sessionResponse = await fetch('/api/sessions/current');
        if (!sessionResponse.ok) {
            throw new Error('Falha ao carregar sessão');
        }
        
        const sessionData = await sessionResponse.json();
        console.log("📋 Dados da sessão:", sessionData);

        // ✅ CORREÇÃO: Extrai dados da sessão atual
        const sessions = sessionData.sessions || {};
        const sessionIds = Object.keys(sessions);
        
        // Verifica se há sessão ativa
        if (sessionIds.length === 0) {
            console.log("📭 Nenhuma sessão ativa encontrada");
            return;
        }

        // ✅ CORREÇÃO: Usa a primeira sessão (que é a atual)
        const currentSessionId = sessionIds[0];
        const obraIds = sessions[currentSessionId].obras || []; // ATUALIZADO: obras em vez de projects
        
        console.log(`📊 Sessão ${currentSessionId} com ${obraIds.length} obras:`, obraIds);

        // Se não há obras na sessão, não precisa carregar nada
        if (obraIds.length === 0) {
            console.log("📭 Nenhuma obra na sessão atual");
            return;
        }

        // 2. Busca obras completas do backup - ATUALIZADO
        const obrasResponse = await fetch('/obras');
        if (!obrasResponse.ok) {
            // Se endpoint de obras não existir, tentar carregar projetos como fallback
            console.log("⚠️ Endpoint /obras não disponível, tentando fallback...");
            await loadProjectsAsFallback(obraIds);
            return;
        }

        const allObras = await obrasResponse.json();
        console.log(`📁 Total de obras no backup: ${allObras.length}`);
        console.log(`📝 IDs no backup: ${allObras.map(o => o.id)}`);
        
        // 3. Filtra apenas obras que estão na sessão
        const sessionObras = allObras.filter(obra => {
            const obraId = String(obra.id);
            const isInSession = obraIds.includes(obraId);
            console.log(`🔍 Obra ${obraId} na sessão? ${isInSession}`);
            return isInSession;
        });

        console.log(`🎯 Encontradas ${sessionObras.length} obras da sessão para carregar`);

        // 4. Limpa interface
        removeBaseObraFromHTML();
        
        let loadedCount = 0;
        for (const obraData of sessionObras) {
            console.log(`🔄 Processando obra: ${obraData.nome} (ID: ${obraData.id})`);
            // A obra será renderizada automaticamente pela interface
            addObraToSession(obraData.id);
            loadedCount++;
        }
        
        window.GeralCount = loadedCount;
        console.log(`✅ ${loadedCount} obra(s) da sessão processadas com sucesso`);
        
    } catch (error) {
        console.error("❌ Erro ao carregar obras da sessão:", error);
    }
}

/**
 * Fallback para carregar projetos como obras - NOVA FUNÇÃO
 */
async function loadProjectsAsFallback(obraIds) {
    try {
        console.log("🔄 Carregando projetos como fallback para obras...");
        
        const projectsResponse = await fetch('/projetos');
        if (!projectsResponse.ok) {
            throw new Error('Falha ao carregar projetos como fallback');
        }

        const allProjects = await projectsResponse.json();
        console.log(`📁 Total de projetos no backup (fallback): ${allProjects.length}`);
        
        // Filtra projetos que estão na sessão
        const sessionProjects = allProjects.filter(project => {
            const projectId = String(project.id);
            return obraIds.includes(projectId);
        });

        console.log(`🎯 Encontrados ${sessionProjects.length} projetos como fallback`);

        removeBaseObraFromHTML();
        
        let loadedCount = 0;
        for (const projectData of sessionProjects) {
            console.log(`🔄 Processando projeto como obra: ${projectData.nome} (ID: ${projectData.id})`);
            addObraToSession(projectData.id);
            loadedCount++;
        }
        
        window.GeralCount = loadedCount;
        console.log(`✅ ${loadedCount} projeto(s) carregados como fallback`);
        
    } catch (error) {
        console.error("❌ Erro no fallback de carregamento:", error);
    }
}

/**
 * Incrementa o contador global de OBRAS - ATUALIZADO
 */
function incrementGeralCount() {
    if (!isSessionActive()) return 0;
    
    initializeGeralCount()
    window.GeralCount++
    return window.GeralCount
}

/**
 * Decrementa o contador global de OBRAS - ATUALIZADO
 */
function decrementGeralCount() {
    if (!isSessionActive()) return 0;
    
    initializeGeralCount()

    if (window.GeralCount > 0) {
        window.GeralCount--

        const existingObras = document.querySelectorAll(".obra-block")

        if (window.GeralCount === 0 && existingObras.length === 0) {
            // Não cria obra base automaticamente
        } else if (window.GeralCount === 0 && existingObras.length > 0) {
            window.GeralCount = existingObras.length
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
 * Reseta a lógica de exibição de OBRAS - ATUALIZADO
 */
function resetDisplayLogic() {
    setSessionActive(false);
    clearSessionObras();
    clearRenderedObras();
    
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    sessionStorage.removeItem(REMOVED_PROJECTS_KEY)
    window.GeralCount = 0
}

/**
 * Inicia uma nova sessão - ATUALIZADO
 */
async function startNewSession() {
    clearSessionObras();
    clearRenderedObras();
    
    setSessionActive(true);
    window.GeralCount = 0;
    
    console.log("🆕 Nova sessão iniciada");
}

/**
 * Encerra a sessão atual - FUNÇÃO PRINCIPAL DO BOTÃO "ENCERRAR SERVIDOR"
 */
async function shutdownManual() {
    if (!confirm('Tem certeza que deseja encerrar o servidor? TODAS as sessões serão apagadas.')) {
        return;
    }
    
    console.log("🔴 ENCERRANDO SERVIDOR E SESSÕES...");
    
    try {
        // 1. Limpa sessões no backend
        console.log("🔄 Limpando sessões...");
        const sessionsResponse = await fetch('/api/sessions/shutdown', {
            method: 'POST'
        });
        
        if (!sessionsResponse.ok) {
            throw new Error('Falha ao limpar sessões');
        }
        
        const sessionsResult = await sessionsResponse.json();
        console.log("✅ Sessões limpas:", sessionsResult);
        
        // 2. Limpa interface
        setSessionActive(false);
        clearSessionObras();
        clearRenderedObras();
        window.GeralCount = 0;
        
        // 3. Encerra servidor e recebe instrução para fechar
        console.log("🔄 Encerrando servidor...");
        const shutdownResponse = await fetch('/api/shutdown', {
            method: 'POST'
        });
        
        if (shutdownResponse.ok) {
            const result = await shutdownResponse.json();
            console.log("📭 Comando de shutdown enviado:", result);
            
            // ✅ Mostra mensagem elegante
            const message = document.createElement('div');
            message.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                color: #fff;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-align: center;
                backdrop-filter: blur(4px);
                animation: fadeIn 0.3s ease-out forwards;
            `;

            message.innerHTML = `
                <div style="
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    gap: 15px;
                ">
                    <div style="
                        font-size: 64px; 
                        margin-bottom: 10px; 
                        color: #ff4c4c;
                        animation: pulse 1s infinite alternate;
                    ">✅</div>
                    <div style="font-size: 28px; font-weight: bold;">Servidor encerrado</div>
                    <div style="
                        font-size: 16px; 
                        margin-top: 5px; 
                        opacity: 0.7;
                    ">Esta janela fechará automaticamente</div>
                </div>
            `;
            document.body.innerHTML = ''; // Limpa toda a página
            document.body.appendChild(message);
            
            // ✅ Fecha a janela após o tempo especificado pelo Python
            const closeDelay = result.close_delay || 2000; // 3 segundos padrão
            console.log(`⏰ Fechando janela em ${closeDelay}ms...`);
            
            setTimeout(() => {
                console.log("🚪 Fechando janela...");
                window.close();
                // Fallback se window.close não funcionar
                if (!window.closed) {
                    document.body.innerHTML = `
                        <div style="padding: 20px; text-align: center;">
                            <h1>✅ Servidor Encerrado</h1>
                            <p>Você pode fechar esta aba manualmente.</p>
                        </div>
                    `;
                }
            }, closeDelay);
        }
        
    } catch (error) {
        console.error('❌ Erro no shutdown:', error);
        // Fecha após 3 segundos mesmo com erro
        setTimeout(() => {
            window.close();
        }, 3000);
    }
}

/**
 * Remove uma OBRA individual da sessão (BACKEND) - ATUALIZADO
 */
async function removeObraFromSession(obraId) {
    if (!isSessionActive()) return;
    
    try {
        const response = await fetch(`/api/sessions/remove-obra/${obraId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Falha ao remover obra da sessão no backend');
        }
        
        // Remove também da sessão local
        removeObraFromSessionLocal(obraId);
        
        console.log(`🗑️ Obra ${obraId} removida da sessão`);
        return await response.json();
    } catch (error) {
        console.error('❌ Erro ao remover obra da sessão:', error);
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
 * Salva o ID da primeira OBRA da sessão - ATUALIZADO
 */
function saveFirstObraIdOfSession(obraId) {
    if (!isSessionActive()) return;
    
    const existingId = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!existingId) {
        const idAsInteger = ensureStringId(obraId)
        if (idAsInteger !== null) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, idAsInteger.toString())
            addObraToSession(idAsInteger);
            incrementGeralCount()
        }
    }
}

/**
 * Adiciona uma OBRA à lista de removidas - ATUALIZADO
 */
function addObraToRemovedList(obraId) {
    if (!isSessionActive()) return;
    
    obraId = ensureStringId(obraId)

    const removedList = getRemovedObrasList()

    if (!removedList.includes(obraId)) {
        removedList.push(obraId)
        sessionStorage.setItem(REMOVED_PROJECTS_KEY, JSON.stringify(removedList))
        removeObraFromSession(obraId);
        decrementGeralCount()
    }
}

/**
 * Retorna a lista de OBRAS removidas - ATUALIZADO
 */
function getRemovedObrasList() {
    const stored = sessionStorage.getItem(REMOVED_PROJECTS_KEY)
    return stored ? JSON.parse(stored) : []
}

/**
 * Verifica se uma OBRA foi removida - ATUALIZADO
 */
function isObraRemoved(obraId) {
    const removedList = getRemovedObrasList()
    return removedList.includes(obraId)
}

/**
 * Inicializa a sessão automaticamente quando o sistema carrega - ATUALIZADO
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
    
    // Carrega obras da sessão
    await loadObrasFromServer();
}

window.shutdownManual = shutdownManual;

// Exportações atualizadas - AGORA TRABALHA COM OBRAS
export {
    loadObrasFromServer, // ATUALIZADO
    removeBaseObraFromHTML, // ATUALIZADO
    saveFirstObraIdOfSession, // ATUALIZADO
    addObraToRemovedList, // ATUALIZADO
    getRemovedObrasList, // ATUALIZADO
    isObraRemoved, // ATUALIZADO
    resetDisplayLogic,
    incrementGeralCount,
    decrementGeralCount,
    getGeralCount,
    isSessionActive,
    setSessionActive,
    startNewSession,
    getSessionObras, // ATUALIZADO
    addObraToSession, // ATUALIZADO
    removeObraFromSession, // ATUALIZADO
    shutdownManual,
    ensureSingleActiveSession,
    initializeSession
}