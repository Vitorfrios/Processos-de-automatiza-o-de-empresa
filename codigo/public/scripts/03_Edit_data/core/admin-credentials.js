import { systemData, addPendingChange } from '../config/state.js';
import { showConfirmation, showError, showSuccess, showInfo } from '../config/ui.js';

const adminState = {
    search: '',
    initialized: false,
    modalListenerBound: false,
    emailConfig: {
        email: '',
        token: '',
        nome: ''
    },
    emailConfigLoaded: false
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    if (!date) return 'Sem registro';

    const rawDate = String(date).trim();
    const normalizedDate =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(rawDate)
            ? `${rawDate}Z`
            : rawDate;

    const parsedDate = new Date(normalizedDate);
    if (Number.isNaN(parsedDate.getTime())) return 'Sem registro';

    return parsedDate.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
    });
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function normalizeSmtpToken(email, token) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedToken = String(token || '').trim();

    if (!normalizedToken) {
        return '';
    }

    if (normalizedEmail.endsWith('@gmail.com') || normalizedEmail.endsWith('@googlemail.com')) {
        return normalizedToken.replace(/\s+/g, '');
    }

    return normalizedToken;
}

function generateToken() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let token = '';

    for (let index = 0; index < 12; index += 1) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return token;
}

function maskToken(token) {
    if (!token || token.length < 6) return '******';
    return `${token.slice(0, 3)}****${token.slice(-3)}`;
}

function normalizeAdmin(admin, index = 0) {
    const usuario = String(admin?.usuario || '').trim() || `ADM${index + 1}`;
    const token = String(admin?.token || '').trim() || generateToken();
    const email = String(admin?.email || '').trim();

    return {
        id: String(admin?.id || `adm_${index}_${usuario.toLowerCase()}`),
        usuario,
        token,
        email,
        criadoEm: admin?.criadoEm || admin?.createdAt || null,
        ultimoAcesso: admin?.ultimoAcesso || admin?.lastLogin || null
    };
}

function getAdmins() {
    if (Array.isArray(systemData.ADM)) {
        return systemData.ADM
            .filter((admin) => admin && typeof admin === 'object')
            .map((admin, index) => normalizeAdmin(admin, index));
    }

    if (systemData.ADM && typeof systemData.ADM === 'object') {
        return [normalizeAdmin(systemData.ADM, 0)];
    }

    return [];
}

function saveAdmins(admins) {
    systemData.ADM = admins.map((admin) => {
        const savedAdmin = {
            usuario: admin.usuario,
            token: admin.token
        };

        if (admin.email) {
            savedAdmin.email = admin.email;
        }

        if (admin.criadoEm) {
            savedAdmin.criadoEm = admin.criadoEm;
        }

        if (admin.ultimoAcesso) {
            savedAdmin.ultimoAcesso = admin.ultimoAcesso;
        }

        return savedAdmin;
    });

    addPendingChange('ADM');
}

function filterAdmins(admins) {
    const search = adminState.search.trim().toLowerCase();

    if (!search) {
        return admins;
    }

    return admins.filter((admin) => admin.usuario.toLowerCase().includes(search));
}

function renderAdminCard(admin, index) {
    return `
        <article class="admin-card" data-admin-id="${escapeHtml(admin.id)}">
            <div class="admin-card-header">
                <div class="admin-card-info">
                    <span class="admin-index-badge">ADM ${index + 1}</span>
                    <strong>@${escapeHtml(admin.usuario)}</strong>
                </div>
            </div>

            <div class="admin-card-body">
                <div class="admin-card-detail">
                    <span class="detail-label">Usuário</span>
                    <span class="detail-value">@${escapeHtml(admin.usuario)}</span>
                </div>
                <div class="admin-card-detail">
                    <span class="detail-label">Email de recuperação</span>
                    <span class="detail-value">${escapeHtml(admin.email || 'Não cadastrado')}</span>
                </div>
                <div class="admin-card-detail">
                    <span class="detail-label">Senha atual</span>
                    <span class="detail-value admin-token-value">${escapeHtml(admin.token)}</span>
                </div>
                <div class="admin-card-detail">
                    <span class="detail-label">Preview</span>
                    <span class="detail-value">${escapeHtml(maskToken(admin.token))}</span>
                </div>
                <div class="admin-card-detail">
                    <span class="detail-label">Criado em</span>
                    <span class="detail-value">${escapeHtml(formatDate(admin.criadoEm))}</span>
                </div>
                <div class="admin-card-detail">
                    <span class="detail-label">Último acesso</span>
                    <span class="detail-value">${escapeHtml(formatDate(admin.ultimoAcesso))}</span>
                </div>
            </div>

            <div class="admin-card-footer">
                <button class="btn-icon edit-admin" type="button" title="Editar administrador">Editar</button>
                <button class="btn-icon reset-password" type="button" title="Gerar nova senha">Nova senha</button>
                <button class="btn-icon delete-admin" type="button" title="Remover administrador">Remover</button>
            </div>
        </article>
    `;
}

function renderEmailConfigPanel() {
    const config = adminState.emailConfig || {};
    const helperText = adminState.emailConfigLoaded
        ? 'Use este remetente para exportação por email e notificações automáticas.'
        : 'Carregando configuração de email...';

    return `
        <section class="admin-email-config-panel">
            <div class="admin-section-header admin-section-header-panel">
                <div class="admin-section-copy">
                    <span class="dashboard-eyebrow">SMTP</span>
                    <h3>Email do responsável</h3>
                    <p>${helperText}</p>
                </div>
            </div>

            <div class="admin-form-grid admin-form-grid-simple">
                <label class="admin-field">
                    <span>Email do responsável</span>
                    <input type="email" id="adminEmail" placeholder="Email do responsável" value="${escapeHtml(config.email || '')}">
                </label>

                <label class="admin-field">
                    <span>Senha ou token SMTP</span>
                    <input type="password" id="adminToken" placeholder="Senha ou token SMTP" value="${escapeHtml(config.token || '')}">
                </label>

                <label class="admin-field">
                    <span>Nome do remetente</span>
                    <input type="text" id="adminNome" placeholder="Nome do remetente" value="${escapeHtml(config.nome || '')}">
                </label>
            </div>

            <div class="modal-actions-adm">
                <button class="btn btn-success" id="saveAdminEmailConfigBtn" type="button" onclick="salvarCredenciais()">Salvar</button>
            </div>
        </section>
    `;
}

async function loadAdminEmailConfig() {
    try {
        const response = await fetch('/api/admin/email-config');
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Falha ao carregar configuração de email.');
        }

        adminState.emailConfig = {
            email: result.config?.email || '',
            token: result.config?.token || '',
            nome: result.config?.nome || ''
        };
        adminState.emailConfigLoaded = true;
    } catch (error) {
        adminState.emailConfigLoaded = true;
        adminState.emailConfig = {
            email: '',
            token: '',
            nome: ''
        };
        showInfo(error.message || 'Configuração SMTP ainda não definida.');
    }
}

async function saveAdminEmailConfig() {
    const email = document.getElementById('adminEmail')?.value.trim() || '';
    const token = document.getElementById('adminToken')?.value.trim() || '';
    const nome = document.getElementById('adminNome')?.value.trim() || '';

    if (!isValidEmail(email)) {
        showError('Informe um email válido para o responsável.');
        return;
    }

    if (!token) {
        showError('Informe a senha ou token SMTP.');
        return;
    }

    const normalizedToken = normalizeSmtpToken(email, token);
    if (
        (email.toLowerCase().endsWith('@gmail.com') || email.toLowerCase().endsWith('@googlemail.com'))
        && normalizedToken.length !== 16
    ) {
        showError('Para Gmail, informe a senha de app de 16 caracteres do Google.');
        return;
    }

    if (!nome) {
        showError('Informe o nome do remetente.');
        return;
    }

    try {
        const response = await fetch('/api/admin/email-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, token: normalizedToken, nome })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Falha ao salvar configuração de email.');
        }

        adminState.emailConfig = {
            email,
            token: normalizedToken,
            nome
        };
        adminState.emailConfigLoaded = true;
        renderAdminCredentials();
        showSuccess('Configuração de email salva com sucesso.');
    } catch (error) {
        showError(error.message || 'Falha ao salvar configuração de email.');
    }
}

export function renderAdminCredentials() {
    const container = document.getElementById('adminCredentialsContent');
    if (!container) return;

    const admins = getAdmins();
    const filteredAdmins = filterAdmins(admins);

    container.innerHTML = `
        ${renderEmailConfigPanel()}

        <div class="admin-section-header admin-section-header-panel">
            <div class="admin-section-copy">
                <span class="dashboard-eyebrow">ADM</span>
                <h3>Credenciais administrativas</h3>
            </div>
            <button class="btn-add-admin" id="btnAddAdmin" type="button">
                <span>+</span> Novo ADM
            </button>
        </div>

        <div class="admin-grid">
            ${filteredAdmins.length > 0
                ? filteredAdmins.map((admin, index) => renderAdminCard(admin, index)).join('')
                : '<div class="empty-state">Nenhum ADM encontrado.</div>'}
        </div>
    `;

    bindAdminEvents();
}

function openAdminModal(admin = null) {
    const modal = document.getElementById('adminCredentialModal');
    const title = document.getElementById('adminCredentialModalTitle');
    const idInput = document.getElementById('adminRecordId');
    const usuarioInput = document.getElementById('adminUsernameInput');
    const tokenInput = document.getElementById('adminTokenInput');
    const emailInput = document.getElementById('adminEmailInput');

    if (!modal || !title || !idInput || !usuarioInput || !tokenInput || !emailInput) {
        return;
    }

    if (admin) {
        title.textContent = 'Editar ADM';
        idInput.value = admin.id;
        usuarioInput.value = admin.usuario;
        tokenInput.value = admin.token;
        emailInput.value = admin.email || '';
    } else {
        title.textContent = 'Novo ADM';
        idInput.value = `new_${Date.now()}`;
        usuarioInput.value = '';
        tokenInput.value = generateToken();
        emailInput.value = '';
    }

    modal.style.display = 'flex';
}

function closeAdminModal() {
    const modal = document.getElementById('adminCredentialModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveAdminFromForm(event) {
    event.preventDefault();

    const id = document.getElementById('adminRecordId')?.value;
    const usuario = document.getElementById('adminUsernameInput')?.value.trim();
    const token = document.getElementById('adminTokenInput')?.value.trim();
    const email = document.getElementById('adminEmailInput')?.value.trim() || '';

    if (!id || !usuario || !token) {
        showError('Preencha usuario e senha do ADM.');
        return;
    }

    if (email && !isValidEmail(email)) {
        showError('Informe um email válido para recuperação do ADM.');
        return;
    }

    const admins = getAdmins();
    const duplicateAdmin = admins.find(
        (admin) => admin.usuario.toLowerCase() === usuario.toLowerCase() && admin.id !== id
    );

    if (duplicateAdmin) {
        showError('Ja existe um ADM com este usuario.');
        return;
    }

    const existingAdmin = admins.find((admin) => admin.id === id);
    let nextAdmins;

    if (existingAdmin) {
        nextAdmins = admins.map((admin) => (
            admin.id === id
                ? {
                    ...admin,
                    usuario,
                    token,
                    email
                }
                : admin
        ));
    } else {
        nextAdmins = [
            ...admins,
            {
                id,
                usuario,
                token,
                email,
                criadoEm: new Date().toISOString()
            }
        ];
    }

    saveAdmins(nextAdmins);
    closeAdminModal();
    renderAdminCredentials();
    showSuccess('Credencial ADM salva com sucesso.');
}

function handleAdminAction(event) {
    const card = event.target.closest('[data-admin-id]');
    if (!card) return;

    const adminId = card.dataset.adminId;
    const admins = getAdmins();
    const admin = admins.find((item) => item.id === adminId);

    if (!admin) return;

    if (event.target.closest('.edit-admin')) {
        openAdminModal(admin);
        return;
    }

    if (event.target.closest('.reset-password')) {
        showConfirmation(`Gerar nova senha para @${admin.usuario}?`, () => {
            const newToken = generateToken();
            const nextAdmins = admins.map((item) => (
                item.id === adminId
                    ? { ...item, token: newToken }
                    : item
            ));

            saveAdmins(nextAdmins);
            renderAdminCredentials();
            showInfo(`Nova senha de @${admin.usuario}: ${newToken}`);
        });
        return;
    }

    if (event.target.closest('.delete-admin')) {
        if (admins.length <= 1) {
            showError('O sistema precisa manter pelo menos um ADM.');
            return;
        }

        showConfirmation(`Remover @${admin.usuario} da lista de ADM?`, () => {
            const nextAdmins = admins.filter((item) => item.id !== adminId);
            saveAdmins(nextAdmins);
            renderAdminCredentials();
            showSuccess('ADM removido com sucesso.');
        });
    }
}

function bindAdminEvents() {
    const addBtn = document.getElementById('btnAddAdmin');
    const adminGrid = document.querySelector('.admin-grid');
    const modalForm = document.getElementById('adminCredentialForm');
    const closeModalBtn = document.getElementById('closeAdminModalBtn');
    const cancelBtn = document.getElementById('cancelAdminCredentialBtn');
    const generateBtn = document.getElementById('generateAdminTokenBtn');
    const saveEmailConfigBtn = document.getElementById('saveAdminEmailConfigBtn');



    if (addBtn) {
        addBtn.onclick = () => openAdminModal();
    }

    if (adminGrid) {
        adminGrid.onclick = handleAdminAction;
    }

    if (modalForm) {
        modalForm.onsubmit = saveAdminFromForm;
    }

    if (closeModalBtn) {
        closeModalBtn.onclick = closeAdminModal;
    }

    if (cancelBtn) {
        cancelBtn.onclick = closeAdminModal;
    }

    if (generateBtn) {
        generateBtn.onclick = () => {
            const tokenInput = document.getElementById('adminTokenInput');
            if (tokenInput) {
                tokenInput.value = generateToken();
            }
        };
    }

    if (saveEmailConfigBtn) {
        saveEmailConfigBtn.onclick = saveAdminEmailConfig;
    }

    if (!adminState.modalListenerBound) {
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('adminCredentialModal');
            if (event.target === modal) {
                closeAdminModal();
            }
        });

        adminState.modalListenerBound = true;
    }
}

export function initializeAdminCredentials() {
    renderAdminCredentials();

    if (adminState.initialized) {
        return;
    }

    window.addEventListener('dataLoaded', renderAdminCredentials);
    window.addEventListener('dataImported', renderAdminCredentials);
    window.addEventListener('dataApplied', renderAdminCredentials);
    window.salvarCredenciais = saveAdminEmailConfig;

    loadAdminEmailConfig().then(() => {
        renderAdminCredentials();
    });

    adminState.initialized = true;
}
