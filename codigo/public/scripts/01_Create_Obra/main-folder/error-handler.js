/**
 * error-handler.js - TRATAMENTO DE ERROS
 * 🎯 Gerencia erros e mensagens de sistema offline
 */

/**
 * Mostra mensagem amigável quando o servidor está offline
 */
export function showServerOfflineMessage() {
    console.log("🔄 Mostrando mensagem de servidor offline...");
    
    const existingMessage = document.getElementById('server-offline-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'server-offline-message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0,0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        font-family: Arial, sans-serif;
    `;
    
    messageDiv.innerHTML = `
        <div class="modal-content toast-style" style="
            background: #2d3748 !important;
            color: white !important;
            border-left: 4px solid #4299e1 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 2rem !important;
            max-width: 500px !important;
            border-radius: 15px;
            text-align: center;
        ">
            <div class="modal-icon" style="
                color: #4299e1 !important;
                animation: iconPulse 2s infinite ease-in-out;
                font-size: 3.5rem !important;
                margin-bottom: 1rem !important;
            ">🔌</div>
            
            <h2 class="modal-title" style="
                color: white !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                font-size: 1.6rem !important;
                margin-bottom: 1rem !important;
            ">Servidor Offline</h2>
            
            <p class="modal-message" style="
                color: rgba(255, 255, 255, 0.9) !important;
                text-align: left !important;
                margin-bottom: 1.5rem !important;
            ">
                <strong style="
                    color: #ff6b6b !important;
                    display: block;
                    margin-bottom: 1rem !important;
                    font-size: 1.1rem !important;
                    text-align: center !important;
                ">O servidor foi encerrado</strong>
                
                <div class="warning-list" style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1.2rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                    border-left: 3px solid #4299e1;
                ">
                    Para continuar usando o sistema:
                    <ul style="
                        text-align: left;
                        margin: 0.5rem 0 0 0;
                        padding-left: 1.5rem;
                        color: rgba(255, 255, 255, 0.8);
                    ">
                      <li style="margin-top: 15px; margin-bottom: 0.5rem; padding-left: 0.5rem;">Inicie novamente o servidor</li>
                      <li style="padding-left: 0.5rem;">Esta página será fechada automaticamente</li>
                    </ul>
                </div>
                
                <div class="warning-note" style="
                    background: rgba(255, 107, 107, 0.1);
                    padding: 1rem;
                    border-radius: 6px;
                    border-left: 3px solid #ff6b6b;
                    margin-top: 1rem;
                ">
                    <small style="
                        color: rgba(255, 255, 255, 0.8) !important;
                        font-size: 0.9rem !important;
                        line-height: 1.4;
                        display: block;
                    ">
                        ⏳ Esta janela será fechada automaticamente em <strong id="countdown">10</strong> segundos...
                    </small>
                </div>
            </p>
            
            <div class="modal-actions" style="
                margin-top: 1.5rem !important;
                gap: 1rem !important;
                display: flex;
                justify-content: center;
            ">
                <button onclick="window.close()" class="modal-btn btn-confirm" style="
                    padding: 0.8rem 1.5rem !important;
                    min-width: 120px !important;
                    font-size: 0.95rem !important;
                    background: #e53e3e !important;
                    color: white !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    border-radius: 6px;
                    cursor: pointer;
                ">
                    Fechar Agora
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes iconPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    let countdown = 10;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            window.close();
        }
    }, 1000);
    
    setTimeout(() => {
        window.close();
    }, 10000);
}

/**
 * Mostra avisos do sistema
 */
export function showSystemWarning(message, type = 'warning') {
    console.log(`⚠️ Aviso do sistema [${type}]:`, message);
    
    if (window.showSystemStatus) {
        window.showSystemStatus(message, type);
    }
}