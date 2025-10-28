// server.js - CORREÇÃO: IMPORTAR FUNÇÕES DE UI

import { SESSION_STORAGE_KEY, REMOVED_PROJECTS_KEY, NORMALIZATION_DONE_KEY, SESSION_ACTIVE_KEY } from "../config/config.js"
import { ensureStringId } from "../utils/utils.js"

// ✅ CORREÇÃO: IMPORTAR FUNÇÕES DE CRIAÇÃO DE OBRAS
import { createEmptyObra, createEmptyProject, createEmptyRoom } from "../ui/interface.js"

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
 * Carrega OBRAS salvas do servidor para a sessão atual - VERSÃO CORRIGIDA COM DEBUG
 */
async function loadObrasFromServer() {
    console.log("🔄 Carregando OBRAS do servidor...");
    
    if (!isSessionActive()) {
        console.log("📭 Sessão não está ativa - nenhuma obra será carregada");
        console.log("🔍 Debug: isSessionActive() =", isSessionActive());
        return;
    }
    
    try {
        const sessionResponse = await fetch('/api/session-obras');
        if (!sessionResponse.ok) {
            throw new Error('Falha ao carregar sessão de obras');
        }
        
        const sessionData = await sessionResponse.json();
        const obraIds = sessionData.obras || [];
        
        console.log(`📊 Sessão com ${obraIds.length} obras:`, obraIds);
        
        if (obraIds.length === 0) {
            console.log("📭 Nenhuma obra na sessão atual");
            return;
        }

        // ✅ Buscar obras da sessão
        const obrasResponse = await fetch('/obras');
        if (!obrasResponse.ok) {
            throw new Error('Falha ao carregar obras');
        }

        const obrasDaSessao = await obrasResponse.json();
        
        console.log(`🎯 Encontradas ${obrasDaSessao.length} obras da sessão para carregar`);

        // ✅ DEBUG: Verificar se o container existe
        const projectsContainer = document.getElementById("projects-container");
        console.log(`🔍 Container de obras:`, projectsContainer ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO');
        if (projectsContainer) {
            console.log(`📊 Obras no container antes:`, projectsContainer.querySelectorAll('.obra-block').length);
        }

        // Limpar interface
        removeBaseObraFromHTML();
        
        // ✅ CORREÇÃO: AGORA AS FUNÇÕES ESTÃO DISPONÍVEIS
        console.log(`🔍 createEmptyObra disponível:`, typeof createEmptyObra === 'function');
        console.log(`🔍 createEmptyProject disponível:`, typeof createEmptyProject === 'function');
        console.log(`🔍 createEmptyRoom disponível:`, typeof createEmptyRoom === 'function');
        
        // Renderizar cada obra
        let loadedCount = 0;
        for (const obraData of obrasDaSessao) {
            console.log(`🔄 Renderizando obra: ${obraData.nome} (ID: ${obraData.id})`);
            
            try {
                // ✅ CORREÇÃO: AGORA createEmptyObra ESTÁ DISPONÍVEL
                if (typeof createEmptyObra === 'function') {
                    console.log(`🎯 Chamando createEmptyObra para: ${obraData.nome}`);
                    
                    // Criar obra na interface
                    createEmptyObra(obraData.nome, obraData.id);
                    
                    // Adicionar projetos da obra
                    if (obraData.projetos && obraData.projetos.length > 0) {
                        obraData.projetos.forEach(projeto => {
                            if (typeof createEmptyProject === 'function') {
                                createEmptyProject(obraData.nome, projeto.nome, projeto.id);
                                
                                // Adicionar salas do projeto
                                if (projeto.salas && projeto.salas.length > 0) {
                                    projeto.salas.forEach(sala => {
                                        if (typeof createEmptyRoom === 'function') {
                                            createEmptyRoom(obraData.nome, projeto.nome, sala.nome, sala.id);
                                        }
                                    });
                                }
                            }
                        });
                    }
                    
                    loadedCount++;
                    console.log(`✅ Obra ${obraData.nome} processada com sucesso`);
                } else {
                    console.error(`❌ createEmptyObra não é uma função`);
                }
            } catch (error) {
                console.error(`💥 ERRO ao criar obra ${obraData.nome}:`, error);
            }
        }
        
        // ✅ DEBUG FINAL: Verificar quantas obras foram realmente criadas
        setTimeout(() => {
            const obrasCriadas = document.querySelectorAll('.obra-block');
            console.log(`📊 DEBUG FINAL: ${obrasCriadas.length} obra(s) criada(s) no DOM`);
            obrasCriadas.forEach((obra, index) => {
                console.log(`  ${index + 1}. ${obra.dataset.obraName} (ID: ${obra.dataset.obraId})`);
            });
            
            if (obrasCriadas.length > 0) {
                console.log("🎉 OBRAS CARREGADAS COM SUCESSO NA INTERFACE!");
            } else {
                console.log("❌ NENHUMA OBRA FOI CRIADA NA INTERFACE");
            }
        }, 500);
        
        console.log(`✅ ${loadedCount} obra(s) da sessão processadas`);
        
    } catch (error) {
        console.error("❌ Erro ao carregar obras da sessão:", error);
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
 * Inicia uma nova sessão - CORREÇÃO: AGORA SÓ É CHAMADA MANUALMENTE
 */
async function startNewSession() {
    // ✅ CORREÇÃO: Esta função agora só é chamada quando o usuário salva a primeira obra
    clearSessionObras();
    clearRenderedObras();
    
    setSessionActive(true);
    window.GeralCount = 0;
    
    console.log("🆕 Nova sessão iniciada pelo usuário");
}

/**
 * Função NOVA: Inicia sessão quando usuário salva primeira obra
 */
async function startSessionOnFirstSave() {
    if (!isSessionActive()) {
        console.log("🆕 Iniciando sessão na primeira obra salva");
        await startNewSession();
        return true;
    }
    return false;
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
        const response = await fetch(`/api/sessions/remove-project/${obraId}`, {
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
 * Inicializa a sessão automaticamente quando o sistema carrega - CORREÇÃO: NÃO INICIA AUTOMATICAMENTE
 */
async function initializeSession() {
    console.log("🔄 Verificando sessão...");
    
    if (!isSessionActive()) {
        console.log("📭 Sessão não está ativa - aguardando ação do usuário");
        return;
    }
    
    console.log("✅ Sessão está ativa - carregando obras existentes");
    await loadObrasFromServer();
}

window.shutdownManual = shutdownManual;

// Exportações atualizadas - AGORA TRABALHA COM OBRAS
export {
    loadObrasFromServer,
    removeBaseObraFromHTML,
    saveFirstObraIdOfSession,
    addObraToRemovedList,
    getRemovedObrasList,
    isObraRemoved,
    resetDisplayLogic,
    incrementGeralCount,
    decrementGeralCount,
    getGeralCount,
    isSessionActive,
    setSessionActive,
    startNewSession,
    startSessionOnFirstSave,
    getSessionObras,
    addObraToSession,
    removeObraFromSession,
    shutdownManual,
    ensureSingleActiveSession,
    initializeSession
}