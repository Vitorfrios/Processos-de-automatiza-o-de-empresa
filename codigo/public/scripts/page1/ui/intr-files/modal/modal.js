/**
 * =====================
 * Gerenciador de Modal e Toast - CORRIGIDO (Notificações Acumulativas)
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
let currentToasts = []; // armazena toasts ativos (inclusive seus timeouts)

/* =========================
 * MODAL: abrir / fechar
 * ========================= */

/**
 * Mostra o modal de confirmação
 */
export function showConfirmationModal(obraName, obraId, obraBlock) {
    // Salva a posição original da obra no DOM
    const projectsContainer = document.getElementById("projects-container");
    const obraBlocks = projectsContainer ? Array.from(projectsContainer.children) : [];
    const originalIndex = obraBlocks.indexOf(obraBlock);

    pendingDeletion = {
        obraName,
        obraId,
        obraBlock,
        obraHTML: obraBlock ? obraBlock.outerHTML : null,
        originalPosition: originalIndex
    };

    const modal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');

    if (!modal || !modalMessage) return;

    modalMessage.innerHTML = `
        <strong>"${obraName}"</strong> será removida <span style="color: #ff6b6b; font-weight: bold; text-decoration: underline;">apenas da tela</span>.<br><br>
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem; border-radius: 8px;">
            <span style="color: #51f956ff; font-size: 2rem;">✓</span>
            <small style="color: #ffffffff;">A obra permanece salva no servidor e pode ser recuperada a qualquer momento.</small>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('active');

    setTimeout(() => {
        const btn = document.querySelector('.btn-cancel');
        if (btn) btn.focus();
    }, 100);
}

/**
 * Fecha o modal de confirmação (limpa estado)
 */
export function closeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.classList.remove('active');
        modal.classList.add('hidden');
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
 * Fecha modal sem limpar pendingDeletion (usado no fluxo de confirmação)
 */
function closeConfirmationModalWithoutClearing() {
    const modal = document.getElementById('confirmationModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

/* =========================
 * TOASTS
 * ========================= */

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
 * Mostra toast notification (undo/success/error) - acumulativa
 */
function showToast(obraName, type = 'undo', obraId = null) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    toast.id = toastId;
    toast.dataset.obraId = obraId || '';

    if (type === 'undo') {
        toast.innerHTML = `
            <div class="toast-icon">⏳</div>
            <div class="toast-content">
                <div class="toast-title">Obra "${obraName}" removida</div>
                <div class="toast-message">Você tem 8 segundos para desfazer esta ação</div>
                <div class="toast-actions">
                    <button class="toast-btn toast-undo" onclick="window.undoDeletion('${obraId}', '${obraName}')">Desfazer</button>
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
                <div class="toast-message">Removida com sucesso</div>
                <button class="toast-btn toast-close" onclick="window.hideSpecificToast('${toastId}')">Fechar</button>
            </div>
        `;
    } else {
        toast.innerHTML = `
            <div class="toast-icon">❌</div>
            <div class="toast-content">
                <div class="toast-title">Erro ao remover "${obraName}"</div>
                <div class="toast-message">Ocorreu um erro durante a remoção</div>
                <button class="toast-btn toast-close" onclick="window.hideSpecificToast('${toastId}')">Fechar</button>
            </div>
        `;
    }

    // Insere no topo
    if (toastContainer.firstChild) {
        toastContainer.insertBefore(toast, toastContainer.firstChild);
    } else {
        toastContainer.appendChild(toast);
    }

    // Estado interno
    const toastData = {
        id: toastId,
        element: toast,
        obraName,
        obraId,
        type,
        timeout: null
    };
    currentToasts.push(toastData);

    // Timeouts por tipo
    if (type === 'undo') {
        toastData.timeout = setTimeout(() => {
            console.log(`⏰ Timeout de 8 segundos completado para obra ${obraName}`);
            // Remove o toast de undo primeiro
            hideSpecificToast(toastId);
            // Em seguida processa remoção definitiva
            completeDeletion(obraId, obraName);
        }, 8000);
    } else {
        toastData.timeout = setTimeout(() => {
            console.log(`⏰ Removendo toast de ${type} para obra ${obraName}`);
            hideSpecificToast(toastId);
        }, 3500);
    }
}

/**
 * Remove (com animação) um elemento de toast
 */
function animateAndRemove(el) {
    try {
        el.classList.add('hiding'); // se existir CSS de transição
        setTimeout(() => { if (el && el.parentNode) el.remove(); }, 300);
    } catch (_) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
}

/**
 * Limpa do array toasts cujo elemento já não está no DOM
 */
function sweepDanglingToasts() {
    for (let i = currentToasts.length - 1; i >= 0; i--) {
        const t = currentToasts[i];
        if (!t.element || !document.body.contains(t.element)) {
            if (t.timeout) clearTimeout(t.timeout);
            currentToasts.splice(i, 1);
        }
    }
}

/**
 * Esconde um toast específico (robusta com fallback DOM)
 */
export function hideSpecificToast(toastId) {
    // 1) tenta remover pelo estado (currentToasts)
    const idx = currentToasts.findIndex(t => t.id === toastId);
    if (idx !== -1) {
        const t = currentToasts[idx];
        console.log(`🗑️ Removendo toast ${toastId} para obra ${t.obraName}`);
        if (t.timeout) clearTimeout(t.timeout);

        animateAndRemove(t.element);
        currentToasts.splice(idx, 1);
        console.log(`✅ Toast ${toastId} removido (estado). Restantes: ${currentToasts.length}`);
        return;
    }

    // 2) Fallback: remove direto do DOM (toast “órfão” não registrado em currentToasts)
    const orphan = document.getElementById(toastId);
    if (orphan) {
        animateAndRemove(orphan);
        console.log(`✅ Toast ${toastId} removido (fallback DOM).`);
        // saneia array de possíveis zumbis
        sweepDanglingToasts();
        return;
    }

    console.log(`⚠️ Toast ${toastId} não encontrado em estado nem DOM.`);
}

/**
 * Esconde o primeiro toast (compatibilidade)
 */
export function hideToast() {
    if (currentToasts.length > 0) {
        hideSpecificToast(currentToasts[0].id);
    }
}

/* =========================
 * UNDO / DELETE
 * ========================= */

/**
 * Desfaz a exclusão (restaura obra e mostra success)
 */
export function undoDeletion(obraId, obraName) {
    console.log(`↩️ Usuário clicou em Desfazer para obra ${obraName} (ID: ${obraId})`);

    // Encontra e remove o toast correspondente
    const toastIndex = currentToasts.findIndex(t => t.obraId === obraId && t.type === 'undo');
    if (toastIndex !== -1) {
        hideSpecificToast(currentToasts[toastIndex].id);
    } else {
        const fallbackToast = currentToasts.find(t => t.obraName === obraName && t.type === 'undo');
        if (fallbackToast) hideSpecificToast(fallbackToast.id);
    }

    // Restaura a obra no DOM a partir do sessionStorage
    const savedDeletion = sessionStorage.getItem(`pendingDeletion-${obraId}`);
    if (savedDeletion) {
        try {
            const deletionData = JSON.parse(savedDeletion);
            const { obraHTML, originalPosition } = deletionData;

            if (obraHTML) {
                const projectsContainer = document.getElementById("projects-container");
                if (projectsContainer) {
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

                // Toast de sucesso
                showToast(obraName, 'success', obraId);
            }
        } catch (e) {
            console.error("❌ Erro ao restaurar obra:", e);
            showToast(obraName, 'error', obraId);
        }
    } else {
        console.error("❌ Dados não encontrados para restaurar obra");
        showToast(obraName, 'error', obraId);
    }

    // Limpa chave da deleção
    sessionStorage.removeItem(`pendingDeletion-${obraId}`);
}

/**
 * Completa a exclusão após timeout (remove do servidor)
 */
async function completeDeletion(obraId, obraName) {
    console.log(`⏰ completeDeletion() chamado para obra ${obraName} (ID: ${obraId})`);
    await completeDeletionImmediate(obraId, obraName);
}

/**
 * Remove a obra do servidor imediatamente
 */
async function completeDeletionImmediate(obraId, obraName) {
    console.log(`🔍 Iniciando remoção completa da obra: ${obraName} (ID: ${obraId})`);

    // Remove do servidor se tiver ID
    if (obraId && obraId !== "" && obraId !== "null" && obraId !== "undefined") {
        try {
            console.log(`🗑️ Enviando requisição para remover obra ${obraId} da sessão...`);

            const response = await fetch(`/api/sessions/remove-obra/${obraId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            console.log(`📡 Resposta do servidor: ${response.status}`);

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Obra removida da sessão:`, result);
                // Toast de sucesso (remove sozinho em 5s)
                showToast(obraName, 'success', obraId);
            } else {
                const errorText = await response.text();
                console.error(`❌ Falha HTTP ao remover obra: ${response.status}`, errorText);
                showToast(obraName, 'error', obraId);
            }
        } catch (error) {
            console.error(`❌ Erro de rede ao remover obra:`, error);
            showToast(obraName, 'error', obraId);
        }
    } else {
        console.log(`ℹ️ Obra ${obraName} não tinha ID salvo, apenas removendo da interface`);
        showToast(obraName, 'success', obraId);
    }

    // Remove dados salvos
    sessionStorage.removeItem(`pendingDeletion-${obraId}`);
}

/**
 * Confirma e executa a exclusão com sistema de undo
 */
export async function confirmDeletion() {
    const { obraName, obraId, obraBlock, obraHTML, originalPosition } = pendingDeletion;
    if (!obraName) return;

    // Salva dados específicos para esta obra (para permitir undo independente)
    sessionStorage.setItem(`pendingDeletion-${obraId}`, JSON.stringify({
        obraName,
        obraId,
        obraHTML,
        originalPosition
    }));

    // Fecha modal sem limpar o pendingDeletion (fluxo pede isso)
    closeConfirmationModalWithoutClearing();

    // Efeito visual de remoção do bloco
    if (obraBlock) {
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
    showToast(obraName, 'undo', obraId);
}

/**
 * Acessa dados pendentes de deleção (se necessário em outro módulo)
 */
export function getPendingDeletion() {
    return pendingDeletion;
}

/* =========================
 * EVENT LISTENERS
 * ========================= */

// Listeners gerais
document.addEventListener('DOMContentLoaded', () => {
    // Botões do modal (delegação)
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

// ESC fecha modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeConfirmationModal();
    }
});

/* =========================
 * EXPORTAÇÕES P/ HTML
 * ========================= */

// Disponibiliza globais para HTML inline
window.undoDeletion = undoDeletion;
window.hideToast = hideToast;
window.hideSpecificToast = hideSpecificToast;
