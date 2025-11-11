/**
 * ui/components/modal.js
 * 🎯 VERSÃO CORRIGIDA - REMOÇÃO DE FUNÇÕES DUPLICADAS
 * ⚡ ELIMINAÇÃO: 5 funções duplicadas internamente
 */

/**
 * =====================
 * SISTEMA UNIFICADO DE MODAIS E TOASTS - CORRIGIDO
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

/**
 * 🔧 FUNÇÃO ÚNICA DE CLEANUP PARA MODAIS
 */
function createModalCleanup(modalElement, cancelBtn, confirmBtn, resolve, shouldResolve = true) {
    return () => {
        cancelBtn.removeEventListener('click', onCancel);
        confirmBtn.removeEventListener('click', onConfirm);
        modalElement.removeEventListener('click', onBackdropClick);
        document.removeEventListener('keydown', onKeyDown);
        
        if (modalElement) {
            modalElement.classList.remove('active');
            setTimeout(() => {
                if (modalElement.parentNode) {
                    modalElement.remove();
                }
            }, 300);
        }
        
        if (shouldResolve) {
            resolve(false); // Cancel por padrão
        }
    };
}

/**
 * 🔧 FUNÇÕES ÚNICAS DE EVENT HANDLERS
 */
function createModalEventHandlers(modalElement, cleanup, resolve, confirmValue = true) {
    const onConfirm = () => {
        cleanup();
        resolve(confirmValue);
    };

    const onCancel = () => {
        cleanup();
        resolve(!confirmValue);
    };

    const onBackdropClick = (e) => {
        if (e.target === modalElement) {
            onCancel();
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        } else if (e.key === 'Enter') {
            onConfirm();
        }
    };

    return { onConfirm, onCancel, onBackdropClick, onKeyDown };
}

/**
 * 🔴 MODAL DE ENCERRAMENTO DO SERVIDOR
 */

/**
 * Cria e exibe o modal de confirmação para encerramento do servidor
 * @returns {Promise<boolean>} Promise que resolve com true se confirmado, false se cancelado
 */
function showShutdownConfirmationModal() {
    return new Promise((resolve) => {
        const existingModal = document.getElementById('shutdown-confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'shutdown-confirmation-modal';
        modal.className = 'confirmation-modal active';
        
        modal.innerHTML = `
            <div class="modal-content toast-style">
                <div class="modal-icon">⚠️</div>
                <h2 class="modal-title">Encerrar Servidor</h2>
                <p class="modal-message">
                    <strong>Tem certeza que deseja encerrar o servidor?</strong>
                    
                    <div class="warning-list">
                        <span>Esta ação irá:</span>
                        <ul>
                            <li>Desligar o servidor</li>
                            <li>Limpar todas as sessões ativas</li>
                            <li>Fechar esta aplicação</li>
                        </ul>
                    </div>

                    <div class="warning-note">
                        <small>⚠️ Todas as conexões ativas serão finalizadas e o servidor será desligado completamente.</small>
                    </div>
                </p>
                <div class="modal-actions">
                    <button class="modal-btn btn-cancel" id="shutdown-cancel-btn">
                        Cancelar
                    </button>
                    <button class="modal-btn btn-confirm" id="shutdown-confirm-btn">
                        Encerrar Servidor
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const cancelBtn = document.getElementById('shutdown-cancel-btn');
        const confirmBtn = document.getElementById('shutdown-confirm-btn');
        const modalElement = document.getElementById('shutdown-confirmation-modal');

        // ✅ USAR FUNÇÃO ÚNICA DE CLEANUP
        const cleanup = createModalCleanup(modalElement, cancelBtn, confirmBtn, resolve);
        
        // ✅ USAR FUNÇÕES ÚNICAS DE EVENT HANDLERS
        const { onConfirm, onCancel, onBackdropClick, onKeyDown } = 
            createModalEventHandlers(modalElement, cleanup, resolve, true);

        cancelBtn.addEventListener('click', onCancel);
        confirmBtn.addEventListener('click', onConfirm);
        modalElement.addEventListener('click', onBackdropClick);
        document.addEventListener('keydown', onKeyDown);

        cancelBtn.focus();
    });
}

/**
 * Versão alternativa do modal com opções customizáveis
 * @param {Object} options - Opções de customização
 * @returns {Promise<boolean>}
 */
function showCustomShutdownModal(options = {}) {
    const {
        title = 'Encerrar Servidor',
        message = 'Tem certeza que deseja encerrar o servidor?',
        confirmText = 'Encerrar Servidor',
        cancelText = 'Cancelar',
        icon = '⚠️',
        borderColor = '#4299e1'
    } = options;

    return new Promise((resolve) => {
        const existingModal = document.getElementById('shutdown-confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'shutdown-confirmation-modal';
        modal.className = 'confirmation-modal active';
        
        modal.innerHTML = `
            <div class="modal-content toast-style custom-border" style="--custom-border-color: ${borderColor}">
                <div class="modal-icon">${icon}</div>
                <h2 class="modal-title">${title}</h2>
                <p class="modal-message">${message}</p>
                <div class="modal-actions">
                    <button class="modal-btn btn-cancel" id="shutdown-cancel-btn">
                        ${cancelText}
                    </button>
                    <button class="modal-btn btn-confirm" id="shutdown-confirm-btn">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const cancelBtn = document.getElementById('shutdown-cancel-btn');
        const confirmBtn = document.getElementById('shutdown-confirm-btn');
        const modalElement = document.getElementById('shutdown-confirmation-modal');

        // ✅ USAR FUNÇÃO ÚNICA DE CLEANUP
        const cleanup = createModalCleanup(modalElement, cancelBtn, confirmBtn, resolve);
        
        // ✅ USAR FUNÇÕES ÚNICAS DE EVENT HANDLERS
        const { onConfirm, onCancel, onBackdropClick, onKeyDown } = 
            createModalEventHandlers(modalElement, cleanup, resolve, true);

        cancelBtn.addEventListener('click', onCancel);
        confirmBtn.addEventListener('click', onConfirm);
        modalElement.addEventListener('click', onBackdropClick);
        document.addEventListener('keydown', onKeyDown);

        cancelBtn.focus();
    });
}

/**
 * 🎭 MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
 */

/**
 * Mostra o modal de confirmação para exclusão de obra
 */
function showConfirmationModal(obraName, obraId, obraBlock) {
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (showConfirmationModal) [ID de obra inválido: ${obraId}]`);
        return;
    }
    
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
    }, 100);
}

/**
 * Fecha o modal de confirmação
 */
function closeConfirmationModal() {
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

/**
 * 📢 SISTEMA DE TOASTS
 */

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

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
                <div class="toast-message">
                    <span class="countdown-text">Você tem <span class="countdown-number">8</span> segundos para desfazer esta ação</span>
                </div>
                <div class="toast-id">ID: ${obraId}</div>
                <div class="toast-actions">
                    <button class="toast-btn toast-undo" onclick="window.undoDeletion('${obraId}', '${obraName}')">Desfazer</button>
                </div>
                <div class="countdown-bar"></div>
            </div>
        `;

        setTimeout(() => {
            const countdownBar = toast.querySelector('.countdown-bar');
            if (countdownBar) {
                countdownBar.style.animation = 'countdown 8s linear forwards';
            }
        }, 100);

        startCountdown(toast, 8);

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

    if (toastContainer.firstChild) {
        toastContainer.insertBefore(toast, toastContainer.firstChild);
    } else {
        toastContainer.appendChild(toast);
    }

    const toastData = {
        id: toastId,
        element: toast,
        obraName,
        obraId,
        type,
        timeout: null,
        countdownInterval: null
    };
    currentToasts.push(toastData);

    if (type === 'undo') {
        toastData.timeout = setTimeout(() => {
            console.log(`⏰ Timeout de 8 segundos completado para obra ${obraName} (ID: ${obraId})`);
            hideSpecificToast(toastId);
            completeDeletion(obraId, obraName);
        }, 8000);
    } else {
        toastData.timeout = setTimeout(() => {
            console.log(`⏰ Removendo toast de ${type} para obra ${obraName} (ID: ${obraId})`);
            hideSpecificToast(toastId);
        }, 3500);
    }
}

function startCountdown(toastElement, seconds) {
    const countdownNumber = toastElement.querySelector('.countdown-number');
    if (!countdownNumber) return;

    let timeLeft = seconds;
    
    const countdownInterval = setInterval(() => {
        timeLeft--;
        countdownNumber.textContent = timeLeft;
        
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

    const toastData = currentToasts.find(t => t.element === toastElement);
    if (toastData) {
        toastData.countdownInterval = countdownInterval;
    }
}

function animateAndRemove(el) {
    try {
        el.classList.add('hiding');
        setTimeout(() => { if (el && el.parentNode) el.remove(); }, 300);
    } catch (_) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
}

function sweepDanglingToasts() {
    for (let i = currentToasts.length - 1; i >= 0; i--) {
        const t = currentToasts[i];
        if (!t.element || !document.body.contains(t.element)) {
            if (t.timeout) clearTimeout(t.timeout);
            currentToasts.splice(i, 1);
        }
    }
}

function hideSpecificToast(toastId) {
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

    const orphan = document.getElementById(toastId);
    if (orphan) {
        animateAndRemove(orphan);
        console.log(`✅ Toast ${toastId} removido (fallback DOM).`);
        sweepDanglingToasts();
        return;
    }

    console.log(`⚠️ Toast ${toastId} não encontrado em estado nem DOM.`);
}

function hideToast() {
    if (currentToasts.length > 0) {
        hideSpecificToast(currentToasts[0].id);
    }
}

/**
 * 🔄 SISTEMA DE UNDO E EXCLUSÃO
 */

function undoDeletion(obraId, obraName) {
    console.log(`↩️ Usuário clicou em Desfazer para obra ${obraName} (ID: ${obraId})`);

    const toastIndex = currentToasts.findIndex(t => t.obraId === obraId && t.type === 'undo');
    if (toastIndex !== -1) {
        hideSpecificToast(currentToasts[toastIndex].id);
    } else {
        const fallbackToast = currentToasts.find(t => t.obraName === obraName && t.type === 'undo');
        if (fallbackToast) hideSpecificToast(fallbackToast.id);
    }

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

    sessionStorage.removeItem(`pendingDeletion-${obraId}`);
}

async function completeDeletion(obraId, obraName) {
    console.log(`⏰ completeDeletion() chamado para obra ${obraName} (ID: ${obraId})`);
    await completeDeletionImmediate(obraId, obraName);
}

async function completeDeletionImmediate(obraId, obraName) {
    console.log(`🔍 Iniciando remoção completa da obra: ${obraName} (ID: ${obraId})`);

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
        console.log(`ℹ️ Obra ${obraName} não existe no servidor ou ID inválido - removendo apenas da interface`);
        showToast(obraName, 'success', obraId);
    }

    sessionStorage.removeItem(`pendingDeletion-${obraId}`);
}

async function verificarObraNoServidor(obraId) {
    try {
        console.log(`🔍 Verificando se obra ${obraId} existe no servidor...`);
        
        const response = await fetch('/api/backup-completo');
        if (!response.ok) {
            console.log('⚠️ Não foi possível verificar obras no servidor');
            return false;
        }
        
        const backupData = await response.json();
        const todasObras = backupData.obras || [];
        
        const obraExiste = todasObras.some(obra => String(obra.id) === String(obraId));
        
        console.log(`📊 Obra ${obraId} existe no servidor? ${obraExiste}`);
        console.log(`📋 Obras no servidor:`, todasObras.map(o => ({ id: o.id, nome: o.nome })));
        
        return obraExiste;
        
    } catch (error) {
        console.log(`🌐 Erro ao verificar obra no servidor:`, error.message);
        return false;
    }
}

async function confirmDeletion() {
    console.log('🎯 confirmDeletion() CHAMADO - Iniciando processo de deleção');
    
    const { obraName, obraId, obraBlock, obraHTML, originalPosition } = pendingDeletion;
    
    if (!obraName || !obraId) {
        console.error('❌ Dados incompletos para deleção');
        return;
    }

    if (obraId === 'undefined' || obraId === 'null') {
        console.error(`❌ ID de obra inválido para deleção: ${obraId}`);
        return;
    }

    console.log(`🗑️ Confirmando deleção da obra: ${obraName} (ID: ${obraId})`);

    sessionStorage.setItem(`pendingDeletion-${obraId}`, JSON.stringify({
        obraName,
        obraId,
        obraHTML,
        originalPosition
    }));

    closeConfirmationModalWithoutClearing();

    if (obraBlock) {
        obraBlock.style.transition = 'all 0.5s ease';
        obraBlock.style.transform = 'translateX(-100%)';
        obraBlock.style.opacity = '0';

        setTimeout(() => {
            if (obraBlock.parentNode) {
                obraBlock.remove();
                console.log(`🗑️ Obra ${obraName} (ID: ${obraId}) removida do DOM (aguardando undo)`);
            }
        }, 500);
    }

    showToast(obraName, 'undo', obraId);
    
    console.log('✅ Deleção confirmada e processo iniciado');
}

function getPendingDeletion() {
    return pendingDeletion;
}

/**
 * 🔧 INICIALIZAÇÃO E EVENT LISTENERS
 */

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

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeConfirmationModal();
    }
});

/**
 * 🌐 EXPORTAÇÕES E COMPATIBILIDADE GLOBAL
 */

// Exportações para módulos ES6
export {
    showShutdownConfirmationModal,
    showCustomShutdownModal,
    showConfirmationModal,
    closeConfirmationModal,
    hideSpecificToast,
    hideToast,
    undoDeletion,
    confirmDeletion,
    getPendingDeletion
};

// Compatibilidade global para scripts legados
if (typeof window !== 'undefined') {
    window.closeConfirmationModal = closeConfirmationModal;
    window.confirmDeletion = confirmDeletion;
    window.undoDeletion = undoDeletion;
    window.hideToast = hideToast;
    window.hideSpecificToast = hideSpecificToast;
    window.showShutdownConfirmationModal = showShutdownConfirmationModal;
    window.showCustomShutdownModal = showCustomShutdownModal;
}

console.log('✅ Modal system corrigido - funções duplicadas removidas');