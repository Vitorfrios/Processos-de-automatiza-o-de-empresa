/**
 * =====================
 * Gerenciador de Modal e Toast -  (Notificações Acumulativas)
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
let currentToasts = [];

/* =========================
 * MODAL: abrir / fechar
 * ========================= */

/**
 * Mostra o modal de confirmação
 */
export function showConfirmationModal(obraName, obraId, obraBlock) {
    // ✅ CORREÇÃO: Validar ID seguro
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (showConfirmationModal) modal.js [ID de obra inválido: ${obraId}]`);
        return;
    }

    // Salva a posição original da obra no DOM
    const projectsContainer = document.getElementById("projects-container");
    const obraBlocks = projectsContainer ? Array.from(projectsContainer.children) : [];
    const originalIndex = obraBlocks.indexOf(obraBlock);

    pendingDeletion = {
        obraName,
        obraId, // ✅ ID SEGURO (ex: obra_w12)
        obraBlock,
        obraHTML: obraBlock ? obraBlock.outerHTML : null,
        originalPosition: originalIndex
    };

    const modal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');

    if (!modal || !modalMessage) {
        console.error('❌ Modal ou modalMessage não encontrado no DOM');
        return;
    }

    modalMessage.innerHTML = `
        <strong>"${obraName}"</strong> será removida <span style="color: #ff6b6b; font-weight: bold; text-decoration: underline;">apenas da tela</span>.<br><br>
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem; border-radius: 8px;">
            <span style="color: #51f956ff; font-size: 2rem;">✓</span>
            <small style="color: #ffffffff;">A obra permanece salva no servidor e pode ser recuperada a qualquer momento.</small>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #cccccc;">
            ID: ${obraId} - Nome: ${obraName}
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('active');

    setTimeout(() => {
        const btn = document.querySelector('.btn-cancel');
        if (btn) btn.focus();
    }, 12);
}

/**
 * Fecha o modal de confirmação (limpa estado)
 */
export function closeConfirmationModal() {
    console.log('🔒 Fechando modal de confirmação');
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
    console.log('🔒 Fechando modal sem limpar dados');
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
    toast.dataset.obraId = obraId || ''; // ✅ ID SEGURO

    if (type === 'undo') {
        toast.innerHTML = `
            <div class="toast-icon">⏳</div>
            <div class="toast-content">
                <div class="toast-title">Obra "${obraName}" removida</div>
                <div class="toast-message">
                    <span class="countdown-text">Você tem <span class="countdown-number">5</span> segundos para desfazer esta ação</span>
                </div>
                <div class="toast-id">ID: ${obraId}</div>
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
                countdownBar.style.animation = 'countdown 5s linear forwards'; 
            }
        }, 6);

        // ✅ NOVO: Contador regressivo dos segundos
        startCountdown(toast, 5);

    } else if (type === 'success') {
        toast.innerHTML = `
            <div class="toast-icon">✅</div>
            <div class="toast-content">
                <div class="toast-title">Obra "${obraName}" removida</div>
                <div class="toast-message">Removida com sucesso</div>
                <div class="toast-id">ID: ${obraId}</div>
                <button class="toast-btn toast-close" onclick="window.hideSpecificToast('${toastId}')">Fechar</button>
            </div>
        `;
    } else {
        toast.innerHTML = `
            <div class="toast-icon">❌</div>
            <div class="toast-content">
                <div class="toast-title">Erro ao remover "${obraName}"</div>
                <div class="toast-message">Ocorreu um erro durante a remoção</div>
                <div class="toast-id">ID: ${obraId}</div>
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
        obraId, // ✅ ID SEGURO
        type,
        timeout: null,
        countdownInterval: null // ✅ NOVO: Para armazenar o intervalo do contador
    };
    currentToasts.push(toastData);

    // Timeouts por tipo
    if (type === 'undo') {
        toastData.timeout = setTimeout(() => {
            console.log(`⏰ Timeout de 5 segundos completado para obra ${obraName} (ID: ${obraId})`); // ← Atualize o texto
            // Remove o toast de undo primeiro
            hideSpecificToast(toastId);
            // Em seguida processa remoção definitiva
            completeDeletion(obraId, obraName);
        }, 2500);
    } else {
        toastData.timeout = setTimeout(() => {
            console.log(`⏰ Removendo toast de ${type} para obra ${obraName} (ID: ${obraId})`);
            hideSpecificToast(toastId);
        }, 437);
    }
}

/**
 * Inicia o contador regressivo visual
 */
function startCountdown(toastElement, seconds) {
    const countdownNumber = toastElement.querySelector('.countdown-number');
    if (!countdownNumber) return;

    let timeLeft = seconds;

    const countdownInterval = setInterval(() => {
        timeLeft--;
        countdownNumber.textContent = timeLeft;

        // Mudar cor quando estiver acabando o tempo
        if (timeLeft <= 3) {
            countdownNumber.style.color = '#ff6b6b';
            countdownNumber.style.fontWeight = 'bold';
        } else if (timeLeft <= 5) {
            countdownNumber.style.color = '#ffa726';
        }

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    // Armazenar o intervalo no toast data para poder parar se necessário
    const toastData = currentToasts.find(t => t.element === toastElement);
    if (toastData) {
        toastData.countdownInterval = countdownInterval;
    }
}

/**
 * Remove (com animação) um elemento de toast
 */
function animateAndRemove(el) {
    try {
        el.classList.add('hiding'); // se existir CSS de transição
        setTimeout(() => { if (el && el.parentNode) el.remove(); }, 37);
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

    // 2) Fallback: remove direto do DOM (toast "órfão" não registrado em currentToasts)
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
    console.log(`↩️ Usuário clicou em Desfazer para obra ${obraName} (ID SEGURO: ${obraId})`);

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
                            console.log(`✅ Obra "${obraName}" (ID: ${obraId}) restaurada na posição original ${originalPosition}`);
                        } else {
                            projectsContainer.insertAdjacentHTML('beforeend', obraHTML);
                            console.log(`✅ Obra "${obraName}" (ID: ${obraId}) restaurada no final`);
                        }
                    } else {
                        projectsContainer.insertAdjacentHTML('beforeend', obraHTML);
                        console.log(`✅ Obra "${obraName}" (ID: ${obraId}) restaurada no final`);
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
 * Remove a obra do servidor imediatamente - 
 */
async function completeDeletionImmediate(obraId, obraName) {
    console.log(`🔍 Iniciando remoção completa da obra: ${obraName} (ID SEGURO: ${obraId})`);

    // ✅ CORREÇÃO: Verificar se a obra existe no servidor antes de tentar remover
    const obraExisteNoServidor = await verificarObraNoServidor(obraId);

    if (obraExisteNoServidor && obraId && obraId !== "" && obraId !== "null" && obraId !== "undefined") {
        try {
            console.log(`🗑️ Obra existe no servidor, removendo ${obraId} da sessão...`);

            const response = await fetch(`/api/sessions/remove-obra/${obraId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Obra removida da sessão:`, result);
                showToast(obraName, 'success', obraId);
            } else {
                console.log(`⚠️ Erro ao remover do servidor (${response.status}) - obra removida apenas da interface`);
                showToast(obraName, 'success', obraId);
            }
        } catch (error) {
            console.log(`🌐 Erro de rede - obra removida apenas da interface:`, error.message);
            showToast(obraName, 'success', obraId);
        }
    } else {
        // ✅ CORREÇÃO: Obra não existe no servidor ou ID inválido - apenas remover da interface
        console.log(`ℹ️ Obra ${obraName} não existe no servidor ou ID inválido - removendo apenas da interface`);
        showToast(obraName, 'success', obraId);
    }

    // Sempre limpar sessionStorage
    sessionStorage.removeItem(`pendingDeletion-${obraId}`);
}

/**
 * ✅ NOVA FUNÇÃO: Verifica se uma obra existe no servidor
 */
async function verificarObraNoServidor(obraId) {
    try {
        console.log(`🔍 Verificando se obra ${obraId} existe no servidor...`);

        // Buscar todas as obras do servidor
        const response = await fetch('/api/backup-completo');
        if (!response.ok) {
            console.log('⚠️ Não foi possível verificar obras no servidor');
            return false;
        }

        const backupData = await response.json();
        const todasObras = backupData.obras || [];

        // Verificar se a obra existe
        const obraExiste = todasObras.some(obra => String(obra.id) === String(obraId));

        console.log(`📊 Obra ${obraId} existe no servidor? ${obraExiste}`);
        console.log(`📋 Obras no servidor:`, todasObras.map(o => ({ id: o.id, nome: o.nome })));

        return obraExiste;

    } catch (error) {
        console.log(`🌐 Erro ao verificar obra no servidor:`, error.message);
        return false;
    }
}

/**
 * Confirma e executa a exclusão com sistema de undo - ATUALIZADO
 */
export async function confirmDeletion() {
    console.log('🎯 confirmDeletion() CHAMADO - Iniciando processo de deleção');

    const { obraName, obraId, obraBlock, obraHTML, originalPosition } = pendingDeletion;

    if (!obraName || !obraId) {
        console.error('❌ Dados incompletos para deleção');
        return;
    }

    // ✅ CORREÇÃO: Validar ID seguro antes de salvar
    if (obraId === 'undefined' || obraId === 'null') {
        console.error(`❌ ID de obra inválido para deleção: ${obraId}`);
        return;
    }

    console.log(`🗑️ Confirmando deleção da obra: ${obraName} (ID: ${obraId})`);

    // Salva dados específicos para esta obra (para permitir undo independente)
    sessionStorage.setItem(`pendingDeletion-${obraId}`, JSON.stringify({
        obraName,
        obraId, // ✅ ID SEGURO
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
                console.log(`🗑️ Obra ${obraName} (ID: ${obraId}) removida do DOM (aguardando undo)`);
            }
        }, 62);
    }

    // Mostra toast com opção de desfazer
    showToast(obraName, 'undo', obraId);

    console.log('✅ Deleção confirmada e processo iniciado');
}

/**
 * Acessa dados pendentes de deleção (se necessário em outro módulo)
 */
export function getPendingDeletion() {
    return pendingDeletion;
}

/* =========================
 * EVENT LISTENERS - SIMPLIFICADOS
 * ========================= */

// Fecha modal clicando fora (mantido pois funciona bem)
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Modal system inicializado');

    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmationModal') {
                closeConfirmationModal();
            }
        });
        console.log('✅ Listener de clique fora do modal adicionado');
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

// Disponibiliza funções GLOBAIS para o HTML
window.closeConfirmationModal = closeConfirmationModal;
window.confirmDeletion = confirmDeletion;
window.undoDeletion = undoDeletion;
window.hideToast = hideToast;
window.hideSpecificToast = hideSpecificToast;

console.log('✅ Modal system carregado e funções globais disponíveis');