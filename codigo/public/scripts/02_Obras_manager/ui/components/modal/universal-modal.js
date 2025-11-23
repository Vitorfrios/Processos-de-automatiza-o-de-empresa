/**
 * ui/components/modal/universal-modal.js
 * Modal universal para exclusão de obras, projetos, salas e máquinas
 */

// Variáveis globais para controle do modal
let pendingDeletion = {
    type: null, // 'obra', 'project', 'room', 'machine'
    id: null,
    name: null,
    element: null,
    parentId: null, // Para projetos, salas e máquinas
    parentName: null // Nome do pai para contexto
};

/**
 * Configurações por tipo de exclusão
 */
const DELETE_CONFIGS = {
    obra: {
        title: 'Excluir Obra',
        message: 'Tem certeza que deseja excluir esta obra permanentemente do backup?',
        confirmText: 'Excluir Obra',
        warning: '⚠️ Esta ação não pode ser desfeita. Todos os projetos, salas e máquinas desta obra serão removidos.',
        endpoint: '/api/backup/obras/remove'
    },
    project: {
        title: 'Excluir Projeto',
        message: 'Tem certeza que deseja excluir este projeto permanentemente?',
        confirmText: 'Excluir Projeto', 
        warning: '⚠️ Todas as salas e máquinas deste projeto serão removidas.',
        endpoint: '/api/backup/projetos/remove'
    },
    room: {
        title: 'Excluir Sala',
        message: 'Tem certeza que deseja excluir esta sala permanentemente?',
        confirmText: 'Excluir Sala',
        warning: '⚠️ Todas as máquinas desta sala serão removidas.',
        endpoint: '/api/backup/salas/remove'
    },
    machine: {
        title: 'Excluir Máquina',
        message: 'Tem certeza que deseja excluir esta máquina permanentemente?',
        confirmText: 'Excluir Máquina',
        warning: '⚠️ Esta ação não pode ser desfeita.',
        endpoint: '/api/backup/maquinas/remove'
    }
};

/**
 * Mostra o modal de confirmação universal
 */
function showUniversalDeleteModal(type, id, name, element, parentInfo = {}) {
    const config = DELETE_CONFIGS[type];
    if (!config) {
        console.error('❌ Tipo de exclusão não suportado:', type);
        return;
    }

    // Validar ID seguro
    if (!id || id === 'undefined' || id === 'null') {
        console.error(`❌ ID inválido para exclusão de ${type}: ${id}`);
        return;
    }

    // Salvar dados pendentes
    pendingDeletion = {
        type,
        id,
        name,
        element,
        parentId: parentInfo.parentId,
        parentName: parentInfo.parentName
    };

    // Criar ou atualizar modal
    const modal = getOrCreateModal();
    const modalMessage = modal.querySelector('#universalModalMessage');

    // Construir mensagem contextual
    let messageHTML = `
        <strong>"${name}"</strong> será excluído <span style="color: #ff6b6b; font-weight: bold; text-decoration: underline;">permanentemente do backup</span>.<br><br>
        <div style="background: rgba(255, 107, 107, 0.1); padding: 0.8rem; border-radius: 8px; border-left: 4px solid #ff6b6b;">
            <small style="color: #ff6b6b;">${config.warning}</small>
        </div>
    `;

    // Adicionar contexto do pai se existir
    if (parentInfo.parentName) {
        let parentType = '';
        if (type === 'project') parentType = 'obra';
        if (type === 'room') parentType = 'projeto';
        if (type === 'machine') parentType = 'sala';
        
        messageHTML += `
            <div style="margin-top: 0.8rem; padding: 0.6rem; background: rgba(66, 153, 225, 0.1); border-radius: 6px;">
                <small style="color: #4299e1;">
                    <strong>${parentType.charAt(0).toUpperCase() + parentType.slice(1)}:</strong> ${parentInfo.parentName}
                </small>
            </div>
        `;
    }

    // Informações técnicas
    messageHTML += `
        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #cccccc;">
            Tipo: ${type} | ID: ${id} | Nome: ${name}
        </div>
    `;

    modalMessage.innerHTML = messageHTML;

    // Atualizar título e texto do botão
    modal.querySelector('#universalModalTitle').textContent = config.title;
    modal.querySelector('#universalConfirmBtn').textContent = config.confirmText;

    // Mostrar modal
    modal.classList.remove('hidden');
    modal.classList.add('active');

    // Focar no botão de cancelar por segurança
    setTimeout(() => {
        const cancelBtn = modal.querySelector('#universalCancelBtn');
        if (cancelBtn) cancelBtn.focus();
    }, 100);
}

/**
 * Cria o modal universal se não existir
 */
function getOrCreateModal() {
    let modal = document.getElementById('universalDeleteModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'universalDeleteModal';
        modal.className = 'confirmation-modal hidden';
        modal.innerHTML = `
            <div class="modal-content universal-modal-style">
                <div class="modal-icon">⚠️</div>
                <h2 class="modal-title" id="universalModalTitle">Excluir</h2>
                <p class="modal-message" id="universalModalMessage"></p>
                <div class="modal-actions">
                    <button class="modal-btn btn-cancel" id="universalCancelBtn">
                        Cancelar
                    </button>
                    <button class="modal-btn btn-confirm" id="universalConfirmBtn">
                        Excluir
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setupUniversalModalEvents(modal);
    }
    
    return modal;
}

/**
 * Configura os event listeners do modal universal
 */
function setupUniversalModalEvents(modal) {
    const cancelBtn = modal.querySelector('#universalCancelBtn');
    const confirmBtn = modal.querySelector('#universalConfirmBtn');

    const cleanup = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    const onConfirm = () => {
        cleanup();
        confirmUniversalDeletion();
    };

    const onCancel = () => {
        cleanup();
        pendingDeletion = {
            type: null,
            id: null, 
            name: null,
            element: null,
            parentId: null,
            parentName: null
        };
    };

    const onBackdropClick = (e) => {
        if (e.target === modal) {
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

    // Adicionar event listeners
    cancelBtn.addEventListener('click', onCancel);
    confirmBtn.addEventListener('click', onConfirm);
    modal.addEventListener('click', onBackdropClick);
    document.addEventListener('keydown', onKeyDown);
}

/**
 * Confirma e executa a exclusão
 */
async function confirmUniversalDeletion() {
    const { type, id, name, element, parentId, parentName } = pendingDeletion;
    
    if (!type || !id || !name) {
        console.error('❌ Dados incompletos para exclusão');
        return;
    }

    console.log(`🗑️ Confirmando exclusão de ${type}: ${name} (ID: ${id})`);

    try {
        const config = DELETE_CONFIGS[type];
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                id,
                parentId, // Para projetos, salas e máquinas
                parentName // Para contexto no backend
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ ${type} excluído:`, result);
            
            // Remover elemento do DOM
            if (element && element.parentNode) {
                element.remove();
            }
            
            showUniversalToast('success', type, name);
            
        } else {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

    } catch (error) {
        console.error(`❌ Erro ao excluir ${type}:`, error);
        showUniversalToast('error', type, name);
    }

    // Limpar dados pendentes
    pendingDeletion = {
        type: null,
        id: null,
        name: null,
        element: null,
        parentId: null,
        parentName: null
    };
}

/**
 * Mostra toast de resultado
 */
function showUniversalToast(type, itemType, itemName) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const toastId = `toast-${Date.now()}`;
    toast.id = toastId;

    const messages = {
        success: {
            icon: '✅',
            title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} excluído`,
            message: `"${itemName}" foi removido do backup`
        },
        error: {
            icon: '❌',
            title: 'Erro na exclusão',
            message: `Falha ao excluir "${itemName}"`
        }
    };

    const msg = messages[type] || messages.error;

    toast.innerHTML = `
        <div class="toast-icon">${msg.icon}</div>
        <div class="toast-content">
            <div class="toast-title">${msg.title}</div>
            <div class="toast-message">${msg.message}</div>
            <button class="toast-btn toast-close" onclick="hideSpecificToast('${toastId}')">Fechar</button>
        </div>
    `;

    if (toastContainer.firstChild) {
        toastContainer.insertBefore(toast, toastContainer.firstChild);
    } else {
        toastContainer.appendChild(toast);
    }

    // Auto-remover após 3 segundos
    setTimeout(() => {
        hideSpecificToast(toastId);
    }, 3000);
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
 * Esconde toast específico
 */
function hideSpecificToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }
}

// Exportações
export {
    showUniversalDeleteModal,
    hideSpecificToast
};

// Disponibilizar globalmente
window.showUniversalDeleteModal = showUniversalDeleteModal;
window.hideSpecificToast = hideSpecificToast;

console.log('✅ Modal universal carregado e funções globais disponíveis');