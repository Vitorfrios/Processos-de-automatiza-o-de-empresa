// adapters/shutdown-adapter.js - GERENCIAMENTO DE SHUTDOWN

import { setSessionActive, clearSessionObras, clearRenderedObras } from "./session-adapter.js"

/**
 * Encerra o servidor e a sessão atual de forma controlada
 */
async function shutdownManual() {
    // Importa o modal de confirmação
    const { showShutdownConfirmationModal } = await import('../../ui/components/modal/exit-modal.js');
    
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
        await new Promise(resolve => setTimeout(resolve, 200));
        
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
                }, 500);
            }, closeDelay);
        } else {
            throw new Error('Falha ao encerrar servidor');
        }
        
    } catch (error) {
        console.error('❌ Erro no shutdown:', error);
        showShutdownMessage("🔌 Conexão com servidor perdida");
        showShutdownMessage("📋 Status: Servidor encerrado no console");
        showShutdownMessage("🔄 Ação: Reexecute o servidor para continuar");
        setTimeout(() => {
            window.close();
        }, 5000);
    }
}

/**
 * Garante que apenas uma sessão esteja ativa por vez no sistema
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
 * Inicializa a sessão automaticamente quando o sistema carrega
 */
async function initializeSession() {
    console.log("🔄 Verificando sessão...");
    
    const { isSessionActive } = await import('./session-adapter.js');
    const { loadObrasFromServer } = await import('../adapters/obra-adapter-folder/obra-data-loader.js');
    
    if (!isSessionActive()) {
        console.log("📭 Sessão não está ativa - aguardando ação do usuário");
        return;
    }
    
    console.log("✅ Sessão está ativa - carregando obras existentes");
    await loadObrasFromServer();
}

/**
 * Mostra mensagem de encerramento elegante na tela
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

// Disponibilizar globalmente
window.shutdownManual = shutdownManual;

export {
    shutdownManual,
    ensureSingleActiveSession,
    initializeSession
};