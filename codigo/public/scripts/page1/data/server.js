// server.js

import { SESSION_STORAGE_KEY, REMOVED_PROJECTS_KEY, SESSION_ACTIVE_KEY } from "../config/config.js"
import { ensureStringId } from "../utils/utils.js"
import { createEmptyObra, createEmptyProject, createEmptyRoom } from "../ui/interface.js"

// CONSTANTES PARA CONTROLE DE SESSÃO - ATUALIZADAS PARA OBRAS
const SESSION_OBRAS = 'session_obras';

/**
 * Verifica se a sessão está ativa no navegador
 * @returns {boolean} True se a sessão está ativa, false caso contrário
 */
function isSessionActive() {
    return sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
}

/**
 * Define o estado da sessão como ativa ou inativa
 * @param {boolean} active - Estado desejado para a sessão
 * @returns {void}
 */
function setSessionActive(active) {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, active.toString());
    
    if (!active) {
        clearSessionObras();
        clearRenderedObras();
    }
}

/**
 * Obtém a lista de obras da sessão atual do sessionStorage
 * @returns {string[]} Array com os IDs das obras da sessão
 */
function getSessionObras() {
    if (!isSessionActive()) return [];
    
    const stored = sessionStorage.getItem(SESSION_OBRAS);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Define a lista de obras da sessão atual no sessionStorage
 * @param {string[]} obraIds - Array de IDs das obras a serem armazenadas
 * @returns {void}
 */
function setSessionObras(obraIds) {
    if (!isSessionActive()) return;
    
    sessionStorage.setItem(SESSION_OBRAS, JSON.stringify(obraIds));
}

/**
 * Adiciona uma obra à lista da sessão atual
 * @param {string} obraId - ID da obra a ser adicionada
 * @returns {void}
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
 * Remove uma obra da lista da sessão local (sessionStorage)
 * @param {string} obraId - ID da obra a ser removida
 * @returns {void}
 */
function removeObraFromSessionLocal(obraId) {
    if (!isSessionActive()) return;
    
    const sessionObras = getSessionObras();
    const updatedObras = sessionObras.filter(id => id !== obraId);
    setSessionObras(updatedObras);
}

/**
 * Limpa todas as obras da sessão local e dados relacionados
 * @returns {void}
 */
function clearSessionObras() {
    sessionStorage.removeItem(SESSION_OBRAS);
    sessionStorage.removeItem(REMOVED_PROJECTS_KEY);
}

/**
 * Remove todas as obras renderizadas da interface do usuário
 * @returns {void}
 */
function clearRenderedObras() {
    const obrasContainer = document.getElementById("projects-container");
    if (!obrasContainer) return;
    
    const obras = obrasContainer.querySelectorAll('.obra-block');
    obras.forEach(obra => obra.remove());
    
    window.GeralCount = 0;
}

/**
 * Inicializa o contador global de obras
 * @returns {number} Valor inicial do contador
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
 * Remove todas as obras base do container HTML
 * @returns {void}
 */
function removeBaseObraFromHTML() {
    const obrasContainer = document.getElementById("projects-container")
    if (!obrasContainer) return

    const existingObras = obrasContainer.querySelectorAll(".obra-block")
    existingObras.forEach((obra) => obra.remove())
}

/**
 * Carrega obras salvas do servidor para a sessão atual
 * @returns {Promise<void>}
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

        // Buscar obras da sessão
        const obrasResponse = await fetch('/obras');
        if (!obrasResponse.ok) {
            throw new Error('Falha ao carregar obras');
        }

        const obrasDaSessao = await obrasResponse.json();
        
        console.log(`🎯 Encontradas ${obrasDaSessao.length} obras da sessão para carregar`);

        // DEBUG: Verificar se o container existe
        const projectsContainer = document.getElementById("projects-container");
        console.log(`🔍 Container de obras:`, projectsContainer ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO');
        if (projectsContainer) {
            console.log(`📊 Obras no container antes:`, projectsContainer.querySelectorAll('.obra-block').length);
        }

        // Limpar interface
        removeBaseObraFromHTML();
        
        // Debug para funções: createEmptyObra ; createEmptyProject ; createEmptyRoom
        console.log(`🔍 createEmptyObra disponível:`, typeof createEmptyObra === 'function');
        console.log(`🔍 createEmptyProject disponível:`, typeof createEmptyProject === 'function');
        console.log(`🔍 createEmptyRoom disponível:`, typeof createEmptyRoom === 'function');
        
        // Renderizar cada obra
        // Renderizar cada obra
        let loadedCount = 0;
        for (const obraData of obrasDaSessao) {
            console.log(`🔄 Renderizando obra: ${obraData.nome} (ID: ${obraData.id})`);
            
            try {
                const obraId = obraData.id && obraData.id !== "" && obraData.id !== "null" && obraData.id !== "undefined" 
                    ? obraData.id 
                    : null;
                
                console.log(`🔍 ID da obra ${obraData.nome}:`, obraId);
                
                if (typeof createEmptyObra === 'function') {
                    console.log(`🎯 Chamando createEmptyObra para: ${obraData.nome} com ID: ${obraId}`);
                    
                    // Criar obra vazia
                    createEmptyObra(obraData.nome, obraId);
                    
                    // ✅ CORREÇÃO: Aguardar a criação da obra e então preencher com dados
                    // ✅ CORREÇÃO: Aguardar a criação da obra e então preencher com dados
                    // ✅ CORREÇÃO: Aguardar a criação da obra e então preencher com dados
                    setTimeout(async () => {
                        const obraElement = document.querySelector(`[data-obra-name="${obraData.nome}"]`);
                        if (obraElement) {
                            console.log(`🎨 Preenchendo dados da obra "${obraData.nome}"...`);
                            
                            try {
                                // ✅ CORREÇÃO: IMPORTAR AS FUNÇÕES DE CRIAÇÃO PRIMEIRO
                                const populateModule = await import('./data-files/data-populate.js');
                                const projectManagerModule = await import('../ui/intr-files/project-manager.js');
                                const roomOperationsModule = await import('../data/modules/room-operations.js');
                                
                                // ✅ CORREÇÃO: PASSAR AS FUNÇÕES COMO PARÂMETRO
                                if (populateModule.populateObraData) {
                                    await populateModule.populateObraData(
                                        obraElement, 
                                        obraData,
                                        projectManagerModule.createEmptyProject,
                                        roomOperationsModule.createEmptyRoom
                                    );
                                    console.log(`🎉 Obra "${obraData.nome}" preenchida completamente`);
                                } else {
                                    console.error('❌ Função populateObraData não encontrada');
                                }
                            } catch (error) {
                                console.error('❌ Erro ao importar/preencher módulo:', error);
                            }
                        } else {
                            console.error(`❌ Elemento da obra "${obraData.nome}" não encontrado para preenchimento`);
                        }
                    }, 200);
                    
                    loadedCount++;
                    console.log(`✅ Obra ${obraData.nome} processada com sucesso`);
                } else {
                    console.error(`❌ createEmptyObra não é uma função`);
                }
            } catch (error) {
                console.error(`💥 ERRO ao criar obra ${obraData.nome}:`, error);
            }
        }
        
        // DEBUG: Verificar quantas obras foram realmente criadas
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
 * Incrementa o contador global de obras
 * @returns {number} Novo valor do contador
 */
function incrementGeralCount() {
    if (!isSessionActive()) return 0;
    
    initializeGeralCount()
    window.GeralCount++
    return window.GeralCount
}

/**
 * Decrementa o contador global de obras
 * @returns {number} Novo valor do contador
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
 * Retorna o valor atual do contador global de obras
 * @returns {number} Valor atual do contador
 */
function getGeralCount() {
    initializeGeralCount()
    return window.GeralCount
}

/**
 * Reseta toda a lógica de exibição de obras e limpa a sessão
 * @returns {void}
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
 * Inicia uma nova sessão - chamada apenas manualmente pelo usuário
 * @returns {Promise<void>}
 */
async function startNewSession() {
    // Esta função só é chamada quando o usuário salva a primeira obra
    clearSessionObras();
    clearRenderedObras();
    
    setSessionActive(true);
    window.GeralCount = 0;
    
    console.log("🆕 Nova sessão iniciada pelo usuário");
}

/**
 * Inicia a sessão automaticamente quando o usuário salva a primeira obra
 * @returns {Promise<boolean>} True se a sessão foi iniciada, false se já estava ativa
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
 * Encerra o servidor e a sessão atual de forma controlada
 * @returns {Promise<void>}
 */
async function shutdownManual() {
    // Importa o modal de confirmação
    const { showShutdownConfirmationModal } = await import('./modle/exit-modal.js');
    
    // Usa o modal customizado em vez do confirm nativo
    const confirmed = await showShutdownConfirmationModal();
    
    if (!confirmed) {
        return;
    }
    
    console.log("🔴 ENCERRANDO SERVIDOR E SESSÕES...");
    
    try {
        // 2 MENSAGENS: Limpeza e Encerramento
        showShutdownMessage("🔄 Limpando sessões e encerrando servidor...");
        
        // 1. Limpa sessões no backend (continua mesmo com erro)
        console.log("🔄 Limpando sessões...");
        try {
            const sessionsResponse = await fetch('/api/sessions/shutdown', {
                method: 'POST'
            });
            
            if (sessionsResponse.ok) {
                const sessionsResult = await sessionsResponse.json();
                console.log("✅ Sessões limpas:", sessionsResult);
            }
        } catch (sessionError) {
            console.warn("⚠️  Erro ao limpar sessões, continuando:", sessionError);
        }
        
        // 2. Limpa interface local
        setSessionActive(false);
        clearSessionObras();
        clearRenderedObras();
        window.GeralCount = 0;
        
        // APENAS 1 SEGUNDO DE ESPERA ENTRE AS ETAPAS
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3. Encerra servidor
        console.log("🔄 Encerrando servidor...");
        
        const shutdownResponse = await fetch('/api/shutdown', {
            method: 'POST'
        });
        
        if (shutdownResponse.ok) {
            const result = await shutdownResponse.json();
            console.log("📭 Comando de shutdown enviado:", result);
            
            // MENSAGEM FINAL ÚNICA
            showFinalShutdownMessage();
            
            // Fechar após delay
            const closeDelay = result.close_delay || 2000;
            console.log(`⏰ Fechando janela em ${closeDelay}ms...`);
            
            setTimeout(() => {
                console.log("🚪 Fechando janela...");
                window.close();
                
                // Fallback se window.close não funcionar
                setTimeout(() => {
                    if (!window.closed) {
                        showFinalMessageWithManualClose();
                    }
                }, 1000);
            }, closeDelay);
        } else {
            throw new Error('Falha ao encerrar servidor');
        }
        
    } catch (error) {
        console.error('❌ Erro no shutdown:', error);
        showShutdownMessage("❌ Erro ao encerrar servidor");
        
        // Fecha após 3 segundos mesmo com erro
        setTimeout(() => {
            window.close();
        }, 3000);
    }
}

/**
 * Mostra mensagem de encerramento elegante na tela
 * @param {string} message - Mensagem a ser exibida
 * @returns {void}
 */
function showShutdownMessage(message) {
    // Remove mensagem anterior se existir
    const existingMessage = document.getElementById('shutdown-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'shutdown-message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        text-align: center;
        backdrop-filter: blur(8px);
        animation: fadeIn 0.5s ease-out forwards;
    `;

    messageDiv.innerHTML = `
        <div style="
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 20px;
            padding: 40px;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        ">
            <div style="
                font-size: 48px; 
                margin-bottom: 10px; 
                color: #ff6b6b;
                animation: pulse 1.5s infinite;
            ">⛔</div>
            <div style="font-size: 24px; font-weight: bold;">${message}</div>
            <div style="
                font-size: 14px; 
                margin-top: 10px; 
                opacity: 0.7;
            ">Aguarde enquanto o servidor é encerrado...</div>
        </div>
    `;
    
    // Adiciona estilos CSS dinamicamente
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(messageDiv);
}

/**
 * Mostra mensagem final de encerramento com confirmação
 * @returns {void}
 */
function showFinalShutdownMessage() {
    const messageDiv = document.getElementById('shutdown-message');
    if (!messageDiv) return;
    
    messageDiv.innerHTML = `
        <div style="
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 20px;
            padding: 40px;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        ">
            <div style="
                font-size: 64px; 
                margin-bottom: 10px; 
                color: #4CAF50;
                animation: bounce 1s;
            ">✅</div>
            <div style="font-size: 28px; font-weight: bold;">Servidor Encerrado</div>
            <div style="
                font-size: 16px; 
                margin-top: 5px; 
                opacity: 0.7;
            ">Esta janela fechará automaticamente</div>

        </div>
    `;
    
    // Adiciona animação de bounce
    const style = document.createElement('style');
    style.textContent += `
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
            40% {transform: translateY(-20px);}
            60% {transform: translateY(-10px);}
        }
    `;
    document.head.appendChild(style);
}

/**
 * Mostra mensagem final com opção de fechar manualmente a janela
 * @returns {void}
 */
function showFinalMessageWithManualClose() {
    const messageDiv = document.getElementById('shutdown-message');
    if (!messageDiv) return;
    
    messageDiv.innerHTML = `
        <div style="
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 20px;
            padding: 40px;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 400px;
        ">
            <div style="
                font-size: 48px; 
                margin-bottom: 10px; 
                color: #4CAF50;
            ">✅</div>
            <div style="font-size: 24px; font-weight: bold; text-align: center;">Servidor Encerrado</div>
            <div style="
                font-size: 14px; 
                margin-top: 10px; 
                opacity: 0.7;
                text-align: center;
            ">O servidor foi encerrado com sucesso</div>
            <button onclick="window.close()" style="
                margin-top: 20px;
                padding: 10px 20px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">Fechar Janela</button>

        </div>
    `;
}

/**
 * Remove uma obra individual da sessão no backend
 * @param {string} obraId - ID da obra a ser removida
 * @returns {Promise<Object>} Resposta do servidor
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
 * Garante que apenas uma sessão esteja ativa por vez no sistema
 * @returns {Promise<Object>} Resposta do servidor
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
 * Salva o ID da primeira obra da sessão no sessionStorage
 * @param {string} obraId - ID da primeira obra
 * @returns {void}
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
 * Adiciona uma obra à lista de obras removidas
 * @param {string} obraId - ID da obra removida
 * @returns {void}
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
 * Retorna a lista de obras removidas da sessão
 * @returns {string[]} Array com IDs das obras removidas
 */
function getRemovedObrasList() {
    const stored = sessionStorage.getItem(REMOVED_PROJECTS_KEY)
    return stored ? JSON.parse(stored) : []
}

/**
 * Verifica se uma obra específica foi removida da sessão
 * @param {string} obraId - ID da obra a ser verificada
 * @returns {boolean} True se a obra foi removida, false caso contrário
 */
function isObraRemoved(obraId) {
    const removedList = getRemovedObrasList()
    return removedList.includes(obraId)
}

/**
 * Inicializa a sessão automaticamente quando o sistema carrega
 * @returns {Promise<void>}
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