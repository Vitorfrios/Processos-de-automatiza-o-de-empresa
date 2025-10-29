/**
 * =====================
 * Gerenciador de Modal e Toast
 * =====================
 */

// Variáveis globais para controle do modal e undo
let pendingDeletion = {
    obraName: null,
    obraId: null,
    obraBlock: null,
    obraHTML: null,
    originalPosition: null
};

let undoTimeout = null;
let currentToast = null;

/**
 * Mostra o modal de confirmação
 */
export function showConfirmationModal(obraName, obraId, obraBlock) {
    // Salva a posição original da obra no DOM
    const projectsContainer = document.getElementById("projects-container");
    const obraBlocks = Array.from(projectsContainer.children);
    const originalIndex = obraBlocks.indexOf(obraBlock);
    
    pendingDeletion = {
        obraName,
        obraId,
        obraBlock,
        obraHTML: obraBlock.outerHTML,
        originalPosition: originalIndex
    };

    const modal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    
    // Mensagem atualizada
    modalMessage.innerHTML = `
        <strong>"${obraName}"</strong> será removida <span style="color: #ff6b6b; font-weight: bold; text-decoration: underline;">apenas da tela</span>.<br><br>
        
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem; border-radius: 8px;">
            <span style="color: #51f956ff; font-size: 1.2rem;">✓</span>
            <small style="color: #ffffffff;">A obra permanece salva no servidor e pode ser recuperada a qualquer momento.</small>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
    
    setTimeout(() => {
        document.querySelector('.btn-cancel').focus();
    }, 100);
}

/**
 * Fecha o modal de confirmação
 */
export function closeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
    pendingDeletion = { 
        obraName: null, 
        obraId: null, 
        obraBlock: null, 
        obraHTML: null,
        originalPosition: null 
    };
}

/**
 * Mostra toast notification
 */
function showToast(obraName, type = 'undo') {
    // Remove toast anterior se existir
    if (currentToast) {
        hideToast();
    }

    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = 'currentToast';
    
    if (type === 'undo') {
        toast.innerHTML = `
            <div class="toast-icon">⏳</div>
            <div class="toast-content">
                <div class="toast-title">Obra "${obraName}" removida</div>
                <div class="toast-message">Você tem 8 segundos para desfazer esta ação</div>
                <div class="toast-actions">
                    <button class="toast-btn toast-undo" onclick="window.undoDeletion()">Desfazer</button>
                </div>
                <div class="countdown-bar"></div>
            </div>
        `;
    } else {
        toast.innerHTML = `
            <div class="toast-icon">✅</div>
            <div class="toast-content">
                <div class="toast-title">Obra "${obraName}" removida</div>
                <div class="toast-message">Removida da interface com sucesso</div>
                <button class="toast-btn toast-close" onclick="window.hideToast()">Fechar</button>
            </div>
        `;
    }
    
    toastContainer.appendChild(toast);
    currentToast = toast;
    
    // Auto-remove após 8 segundos apenas para undo
    if (type === 'undo') {
        undoTimeout = setTimeout(() => {
            if (toast.parentNode && !toast.classList.contains('hiding')) {
                completeDeletion();
            }
        }, 8000);
    } else {
        setTimeout(() => {
            hideToast();
        }, 5000);
    }
}

/**
 * Cria container de toast se não existir
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Esconde o toast atual
 */
export function hideToast() {
    if (currentToast) {
        currentToast.classList.add('hiding');
        setTimeout(() => {
            if (currentToast && currentToast.parentNode) {
                currentToast.remove();
                currentToast = null;
            }
        }, 300);
    }
}

/**
 * Desfaz a exclusão
 */
export function undoDeletion() {
    if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
    }
    
    hideToast();
    
    // Restaura a obra no DOM na posição original
    const { obraHTML, originalPosition, obraName } = pendingDeletion;
    
    if (obraHTML && obraName) {
        const projectsContainer = document.getElementById("projects-container");
        
        // Se temos a posição original, insere na posição correta
        if (originalPosition !== null && originalPosition >= 0) {
            const referenceNode = projectsContainer.children[originalPosition];
            if (referenceNode) {
                referenceNode.insertAdjacentHTML('beforebegin', obraHTML);
            } else {
                projectsContainer.insertAdjacentHTML('beforeend', obraHTML);
            }
        } else {
            projectsContainer.insertAdjacentHTML('beforeend', obraHTML);
        }
        
        console.log(`↩️ Obra "${obraName}" restaurada na posição ${originalPosition}`);
        
        // Força a atualização da interface
        forceInterfaceUpdate();
        
        // Mostra toast de sucesso
        showToast(obraName, 'success');
    }
    
    pendingDeletion = { 
        obraName: null, 
        obraId: null, 
        obraBlock: null, 
        obraHTML: null,
        originalPosition: null 
    };
}

/**
 * Força a atualização da interface após restaurar obra
 */
function forceInterfaceUpdate() {
    // Dispara um evento customizado para notificar outros componentes
    const event = new CustomEvent('obraRestored', {
        detail: { obraName: pendingDeletion.obraName }
    });
    document.dispatchEvent(event);
    
    // Força reflow para garantir que a interface seja atualizada
    document.body.offsetHeight;
}

/**
 * Completa a exclusão após timeout (remove do servidor)
 */
async function completeDeletion() {
    hideToast();
    await completeDeletionImmediate();
}

/**
 * Remove a obra do servidor imediatamente
 */
async function completeDeletionImmediate() {
    const { obraName, obraId } = pendingDeletion;
    
    if (!obraName) return;
    
    // Remove do servidor se tiver ID
    if (obraId && obraId !== "" && obraId !== "null" && obraId !== "undefined") {
        try {
            const response = await fetch(`/api/sessions/remove-obra/${obraId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log(`🗑️ Obra ${obraName} (ID: ${obraId}) removida da sessão`);
                showToast(obraName, 'success');
            } else {
                console.error(`❌ Falha ao remover obra ${obraName} da sessão`);
                showToast(`Erro ao remover ${obraName}`, 'success');
            }
        } catch (error) {
            console.error(`❌ Erro ao remover obra ${obraName} da sessão:`, error);
            showToast(`Erro ao remover ${obraName}`, 'success');
        }
    } else {
        console.log(`ℹ️ Obra ${obraName} não tinha ID salvo`);
        showToast(obraName, 'success');
    }
    
    pendingDeletion = { 
        obraName: null, 
        obraId: null, 
        obraBlock: null, 
        obraHTML: null,
        originalPosition: null 
    };
}

/**
 * Confirma e executa a exclusão com sistema de undo
 */
export async function confirmDeletion() {
    const { obraName, obraId, obraBlock } = pendingDeletion;
    
    if (!obraName) return;
    
    closeConfirmationModal();
    
    // Efeito visual de remoção
    if (obraBlock) {
        // Adiciona animação de saída
        obraBlock.style.transition = 'all 0.5s ease';
        obraBlock.style.transform = 'translateX(-100%)';
        obraBlock.style.opacity = '0';
        
        setTimeout(() => {
            if (obraBlock.parentNode) {
                obraBlock.remove();
                console.log(`🗑️ Obra ${obraName} removida do DOM (aguardando undo)`);
            }
        }, 500);
    }
    
    // Mostra toast com opção de desfazer
    showToast(obraName, 'undo');
}

/**
 * Obtém os dados pendentes de deleção
 */
export function getPendingDeletion() {
    return pendingDeletion;
}

// ===== EVENT LISTENERS =====

// Event listeners para os botões do modal
document.addEventListener('DOMContentLoaded', () => {
    // Botões do modal
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-action="cancel"]')) {
            closeConfirmationModal();
        }
        if (e.target.matches('[data-action="confirm"]')) {
            confirmDeletion();
        }
    });
    
    // Fecha modal clicando fora
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmationModal') {
                closeConfirmationModal();
            }
        });
    }
});

// Fecha modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeConfirmationModal();
    }
});