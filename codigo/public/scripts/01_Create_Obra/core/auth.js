import {
    APP_CONFIG,
    CLIENT_SESSION_STORAGE_KEY,
    refreshAppConfigFromSession
} from './config.js';

const AUTH_ENDPOINTS = [
    '/api/empresas/all',
    '/api/dados/empresas'
];

function toIsoString(dateValue) {
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

function resolveExpiration(credenciais = {}) {
    const explicitExpiration = toIsoString(
        credenciais.expiracao || credenciais.expiresAt || credenciais.expiration
    );

    if (explicitExpiration) {
        return explicitExpiration;
    }

    const createdAt = toIsoString(credenciais.data_criacao || credenciais.createdAt);
    const tempoUso = Number.parseInt(
        credenciais.tempoUso || credenciais.validadeDias || credenciais.validade,
        10
    );

    if (!createdAt || !Number.isFinite(tempoUso)) {
        return null;
    }

    const expirationDate = new Date(createdAt);
    expirationDate.setDate(expirationDate.getDate() + tempoUso);

    return expirationDate.toISOString();
}

function normalizeEmpresaAuthRecord(rawEmpresa) {
    if (!rawEmpresa || typeof rawEmpresa !== 'object') {
        return null;
    }

    const credenciais = rawEmpresa.credenciais;
    if (!credenciais) {
        return null;
    }

    const codigo = (rawEmpresa.codigo || rawEmpresa.sigla || '').trim();
    const nome = (rawEmpresa.nome || '').trim();

    return {
        codigo,
        sigla: codigo,
        nome,
        usuario: (credenciais.usuario || '').trim(),
        token: (credenciais.token || '').trim(),
        expiracao: resolveExpiration(credenciais),
        credenciais
    };
}

async function fetchEmpresasForAuth() {
    let lastError = null;

    for (const endpoint of AUTH_ENDPOINTS) {
        try {
            const response = await fetch(endpoint);

            if (!response.ok) {
                lastError = new Error(`Falha ao carregar empresas em ${endpoint}: ${response.status}`);
                continue;
            }

            const payload = await response.json();
            const empresas = Array.isArray(payload.empresas) ? payload.empresas : [];

            return empresas
                .map(normalizeEmpresaAuthRecord)
                .filter((empresa) => empresa && empresa.codigo && empresa.usuario && empresa.token);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Nao foi possivel carregar empresas para autenticacao.');
}

function buildClientSession(empresaRecord) {
    return {
        empresaCodigo: empresaRecord.codigo,
        empresaNome: empresaRecord.nome,
        usuario: empresaRecord.usuario,
        token: empresaRecord.token,
        expiraEm: empresaRecord.expiracao
    };
}

function getAuthStorageKey() {
    return APP_CONFIG.auth?.storageKey || CLIENT_SESSION_STORAGE_KEY;
}

function persistClientSession(session) {
    window.localStorage.setItem(getAuthStorageKey(), JSON.stringify(session));
    refreshAppConfigFromSession();
    return session;
}

function getClientSession() {
    try {
        const rawSession = window.localStorage.getItem(getAuthStorageKey());
        if (!rawSession) {
            return null;
        }

        const parsedSession = JSON.parse(rawSession);
        if (!parsedSession) {
            return null;
        }

        if (parsedSession.empresaCodigo) {
            return parsedSession;
        }

        if (parsedSession.empresa) {
            return {
                empresaCodigo: parsedSession.empresa.codigo || parsedSession.empresa.sigla || '',
                empresaNome: parsedSession.empresa.nome || '',
                usuario: parsedSession.usuario || '',
                token: parsedSession.token || '',
                expiraEm: parsedSession.expiraEm || parsedSession.empresa.expiraEm || parsedSession.empresa.expiracao || null
            };
        }

        return parsedSession;
    } catch (error) {
        console.warn('[AUTH] Falha ao ler sessao client:', error);
        return null;
    }
}

function clearClientSession() {
    window.localStorage.removeItem(getAuthStorageKey());
    refreshAppConfigFromSession();
}

function validateToken(record) {
    const expiracao = record?.expiraEm || record?.expiracao || record?.empresa?.expiraEm || record?.empresa?.expiracao || null;

    if (!expiracao) {
        return {
            valid: true,
            reason: null,
            expiracao: null
        };
    }

    const expirationDate = new Date(expiracao);
    if (Number.isNaN(expirationDate.getTime())) {
        return {
            valid: false,
            reason: 'invalid_expiration',
            expiracao
        };
    }

    const valid = expirationDate.getTime() > Date.now();

    return {
        valid,
        reason: valid ? null : 'expired',
        expiracao: expirationDate.toISOString()
    };
}

async function loginClient({ usuario, token }) {
    const normalizedUser = (usuario || '').trim().toLowerCase();
    const normalizedToken = (token || '').trim();

    if (!normalizedUser || !normalizedToken) {
        return {
            success: false,
            reason: 'missing_credentials',
            message: 'Usuario e token sao obrigatorios.'
        };
    }

    const empresas = await fetchEmpresasForAuth();
    const empresa = empresas.find(
        (candidate) =>
            candidate.usuario.toLowerCase() === normalizedUser &&
            candidate.token === normalizedToken
    );

    if (!empresa) {
        const empresaByUser = empresas.find(
            (candidate) => candidate.usuario.toLowerCase() === normalizedUser
        );

        return {
            success: false,
            reason: empresaByUser ? 'invalid_token' : 'user_not_found',
            message: empresaByUser ? 'Token invalido.' : 'Usuario nao encontrado.'
        };
    }

    const tokenValidation = validateToken(empresa);
    if (!tokenValidation.valid) {
        return {
            success: false,
            reason: tokenValidation.reason,
            message: 'Token expirado. Solicite um novo acesso.'
        };
    }

    const session = persistClientSession(buildClientSession(empresa));

    return {
        success: true,
        session
    };
}

function hasValidClientSession() {
    const session = getClientSession();
    if (!session) {
        return false;
    }

    return validateToken(session).valid;
}

function redirectToLogin() {
    const loginPage = APP_CONFIG.auth?.loginPage;
    if (loginPage) {
        window.location.replace(loginPage);
    }
}

function redirectToClientApp() {
    const redirectTarget = APP_CONFIG.auth?.redirectAfterLogin;
    if (redirectTarget) {
        window.location.replace(redirectTarget);
    }
}

function ensureClientAccess({ redirectToLoginPage = true } = {}) {
    if (APP_CONFIG.mode !== 'client' || !APP_CONFIG.auth?.required) {
        return {
            allowed: true,
            session: null
        };
    }

    const session = getClientSession();
    if (!session) {
        if (redirectToLoginPage) {
            redirectToLogin();
        }

        return {
            allowed: false,
            reason: 'missing_session'
        };
    }

    const validation = validateToken(session);
    if (!validation.valid) {
        clearClientSession();

        if (redirectToLoginPage) {
            redirectToLogin();
        }

        return {
            allowed: false,
            reason: validation.reason
        };
    }

    refreshAppConfigFromSession();

    return {
        allowed: true,
        session
    };
}

function logoutClient({ redirect = true } = {}) {
    clearClientSession();

    if (redirect) {
        redirectToLogin();
    }
}

if (typeof window !== 'undefined') {
    window.validateToken = validateToken;
}

export {
    fetchEmpresasForAuth,
    getClientSession,
    persistClientSession,
    clearClientSession,
    validateToken,
    loginClient,
    hasValidClientSession,
    ensureClientAccess,
    redirectToClientApp,
    logoutClient
};
