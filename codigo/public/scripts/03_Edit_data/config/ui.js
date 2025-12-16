// scripts/03_Edit_data/ui.js
// Funções de UI e utilitários

export function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    const tab = document.querySelector(`.tab[onclick*="${tabName}"]`);
    if (tab) tab.classList.add('active');
    
    const pane = document.getElementById(`${tabName}Tab`);
    if (pane) pane.classList.add('active');
    
    if (tabName !== 'machines') {
        const closeMachineDetail = window.closeMachineDetail;
        if (closeMachineDetail) closeMachineDetail();
    }
}

export function showConfirmation(message, callback) {
    const modal = document.getElementById('confirmationModal');
    const messageEl = document.getElementById('modalMessage');
    const titleEl = document.getElementById('modalTitle');
    
    if (!modal || !messageEl || !titleEl) return;
    
    titleEl.textContent = 'Confirmação';
    messageEl.textContent = message;
    modal.style.display = 'flex';
    
    window.confirmAction = function(confirmed) {
        modal.style.display = 'none';
        if (confirmed && callback) callback();
    };
}

export function showLoading(message) {
    let loadingEl = document.getElementById('loadingOverlay');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loadingOverlay';
        loadingEl.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 18px;
        `;
        document.body.appendChild(loadingEl);
    }
    
    loadingEl.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner" style="
                width: 50px;
                height: 50px;
                border: 5px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            "></div>
            <p>${message || 'Carregando...'}</p>
        </div>
    `;
    loadingEl.style.display = 'flex';
}

export function hideLoading() {
    const loadingEl = document.getElementById('loadingOverlay');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

export function showSuccess(message) {
    createMessage(message, 'success');
}

export function showError(message) {
    createMessage(message, 'error');
}

export function showWarning(message) {
    createMessage(message, 'warning');
}

export function showInfo(message) {
    createMessage(message, 'info');
}

function createMessage(text, type) {
    document.querySelectorAll(`.message-${type}`).forEach(el => {
        el.remove();
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = text;
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9998;
        padding: 15px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
        animation-fill-mode: forwards;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    switch (type) {
        case 'success':
            messageDiv.style.background = 'linear-gradient(135deg, #2D774E 0%, #298650 100%)';
            break;
        case 'error':
            messageDiv.style.background = 'linear-gradient(135deg, #C53030 0%, #FC8181 100%)';
            break;
        case 'warning':
            messageDiv.style.background = 'linear-gradient(135deg, #D69E2E 0%, #F6AD55 100%)';
            break;
        case 'info':
            messageDiv.style.background = 'linear-gradient(135deg, #3182CE 0%, #63B3ED 100%)';
            break;
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// Exportar funções globalmente
window.switchTab = switchTab;
window.showConfirmation = showConfirmation;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;