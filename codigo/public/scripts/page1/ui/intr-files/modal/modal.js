/**
 * =====================
 * Gerenciador de Modal e Toast - CORRIGIDO
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

    // ✅ CORREÇÃO: Salva backup no sessionStorage
    sessionStorage.setItem('lastPendingDeletion', JSON.stringify(pendingDeletion));

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
    sessionStorage.removeItem('lastPendingDeletion');
}

/**
 * ✅ NOVA: Fecha modal sem limpar pendingDeletion
 */
function closeConfirmationModalWithoutClearing() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
    // ✅ CORREÇÃO CRÍTICA: NÃO limpa pendingDeletion aqui
}

/**
 * Mostra toast notification - CORRIGIDA
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
        
        // Inicia animação da barra de contagem regressiva
        setTimeout(() => {
            const countdownBar = toast.querySelector('.countdown-bar');
            if (countdownBar) {
                countdownBar.style.animation = 'countdown 8s linear forwards';
            }
        }, 100);
    } else if (type === 'success') {
        toast.innerHTML = `
            <div class="toast-icon">✅</div>
            <div class="toast-content">
                <div class="toast-title">Obra "${obraName}" removida</div>
                <div class="toast-message">Removida da interface com sucesso</div>
                <button class="toast-btn toast-close" onclick="window.hideToast()">Fechar</button>
            </div>
        `;
    } else {
        toast.innerHTML = `
            <div class="toast-icon">❌</div>
            <div class="toast-content">
                <div class="toast-title">Erro ao remover "${obraName}"</div>
                <div class="toast-message">Ocorreu um erro durante a remoção</div>
                <button class="toast-btn toast-close" onclick="window.hideToast()">Fechar</button>
            </div>
        `;
    }
    
    toastContainer.appendChild(toast);
    currentToast = toast;
    
    // ✅ CORREÇÃO: Auto-remove após 8 segundos apenas para undo
    if (type === 'undo') {
        // Limpa timeout anterior se existir
        if (undoTimeout) {
            clearTimeout(undoTimeout);
        }
        
        undoTimeout = setTimeout(() => {
            console.log("⏰ Timeout de 8 segundos completado - removendo obra");
            console.log("📊 Estado atual do pendingDeletion:", pendingDeletion);
            
            // ✅ CORREÇÃO: Verifica se ainda temos dados antes de processar
            if (pendingDeletion.obraName) {
                completeDeletion();
            } else {
                console.error("❌ Dados perdidos - não é possível completar a remoção");
                hideToast();
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
 * Esconde o toast atual - CORRIGIDA
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
    // ✅ CORREÇÃO: Limpa o timeout quando o toast é escondido manualmente
    if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
    }
}

/**
 * Desfaz a exclusão - CORRIGIDA
 */
export function undoDeletion() {
    console.log("↩️ Usuário clicou em Desfazer");
    
    if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
        console.log("⏹️ Timeout de remoção cancelado");
    }
    
    hideToast();
    
    const { obraName, obraId, obraHTML, originalPosition } = pendingDeletion;
    
    if (obraName && obraHTML) {
        console.log(`🔒 Obra "${obraName}" (ID: ${obraId}) - ação desfeita, NÃO removendo da sessão`);
        
        // Restaura a obra no DOM
        const projectsContainer = document.getElementById("projects-container");
        if (projectsContainer) {
            // Se temos a posição original, insere na posição correta
            if (originalPosition !== null && originalPosition >= 0) {
                const referenceNode = projectsContainer.children[originalPosition];
                if (referenceNode) {
                    referenceNode.insertAdjacentHTML('beforebegin', obraHTML);
                    console.log(`✅ Obra "${obraName}" restaurada na posição original ${originalPosition}`);
                } else {
                    projectsContainer.insertAdjacentHTML('beforeend', obraHTML);
                    console.log(`✅ Obra "${obraName}" restaurada no final`);
                }
            } else {
                projectsContainer.insertAdjacentHTML('beforeend', obraHTML);
                console.log(`✅ Obra "${obraName}" restaurada no final`);
            }
        }
        
        // Mostra toast de sucesso
        showToast(obraName, 'success');
        
    } else {
        console.error("❌ Dados insuficientes para restaurar obra");
        showToast(obraName || 'Obra', 'error');
    }
    
    // Limpa estado pendente
    pendingDeletion = { 
        obraName: null, 
        obraId: null, 
        obraBlock: null, 
        obraHTML: null,
        originalPosition: null 
    };
    sessionStorage.removeItem('lastPendingDeletion');
}

/**
 * Completa a exclusão após timeout (remove do servidor) - CORRIGIDA
 */
async function completeDeletion() {
    console.log("⏰ completeDeletion() chamado - removendo obra da sessão");
    // ✅ CORREÇÃO: Garante que o toast some antes de processar a remoção
    hideToast();
    await completeDeletionImmediate();
}

/**
 * Remove a obra do servidor imediatamente - CORRIGIDA
 */
async function completeDeletionImmediate() {
    // ✅ CORREÇÃO: Verificação mais robusta dos dados
    if (!pendingDeletion.obraName) {
        console.error("❌ ERRO CRÍTICO: pendingDeletion está vazio quando deveria ter dados");
        console.log("📊 Estado atual:", pendingDeletion);
        
        // Tenta recuperar da sessionStorage como fallback
        const fallbackData = sessionStorage.getItem('lastPendingDeletion');
        if (fallbackData) {
            try {
                const parsed = JSON.parse(fallbackData);
                pendingDeletion = parsed;
                console.log("🔄 Dados recuperados do sessionStorage:", pendingDeletion);
            } catch (e) {
                console.error("❌ Não foi possível recuperar dados de fallback");
            }
        }
    }
    
    const { obraName, obraId } = pendingDeletion;
    
    if (!obraName) {
        console.log("❌ Nenhuma obra pendente para remoção após tentativas de recuperação");
        // Limpa estado pendente
        pendingDeletion = { 
            obraName: null, 
            obraId: null, 
            obraBlock: null, 
            obraHTML: null,
            originalPosition: null 
        };
        sessionStorage.removeItem('lastPendingDeletion');
        return;
    }
    
    console.log(`🔍 Iniciando remoção completa da obra: ${obraName} (ID: ${obraId})`);
    
    // Remove do servidor se tiver ID
    if (obraId && obraId !== "" && obraId !== "null" && obraId !== "undefined") {
        try {
            console.log(`🗑️ Enviando requisição para remover obra ${obraId} da sessão...`);
            
            const response = await fetch(`/api/sessions/remove-obra/${obraId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log(`📡 Resposta do servidor: ${response.status}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Obra removida da sessão:`, result);
                
                // ✅ CORREÇÃO: NÃO recarrega a página, apenas mostra toast de sucesso
                showToast(obraName, 'success');
                
            } else {
                const errorText = await response.text();
                console.error(`❌ Falha HTTP ao remover obra: ${response.status}`, errorText);
                showToast(obraName, 'error');
            }
        } catch (error) {
            console.error(`❌ Erro de rede ao remover obra:`, error);
            showToast(obraName, 'error');
        }
    } else {
        console.log(`ℹ️ Obra ${obraName} não tinha ID salvo, apenas removendo da interface`);
        // ✅ CORREÇÃO: Mostra toast de sucesso mesmo sem ID
        showToast(obraName, 'success');
    }
    
    // ✅ CORREÇÃO: Limpa estado pendente APÓS processar tudo
    console.log("🧹 Limpando estado pendente após processamento");
    pendingDeletion = { 
        obraName: null, 
        obraId: null, 
        obraBlock: null, 
        obraHTML: null,
        originalPosition: null 
    };
    sessionStorage.removeItem('lastPendingDeletion');
}

/**
 * Confirma e executa a exclusão com sistema de undo - CORRIGIDA
 */
export async function confirmDeletion() {
    const { obraName, obraId, obraBlock } = pendingDeletion;
    
    if (!obraName) return;
    
    // ✅ CORREÇÃO: NÃO limpa o pendingDeletion aqui - só fecha o modal
    closeConfirmationModalWithoutClearing();
    
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

// ===== EXPORTAÇÕES PARA HTML =====

// Torne as funções globais para o HTML poder acessar
window.undoDeletion = undoDeletion;
window.hideToast = hideToast;