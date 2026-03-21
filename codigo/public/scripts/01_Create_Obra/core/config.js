const CLIENT_SESSION_STORAGE_KEY = 'esi_client_session';

const DEFAULT_APP_CONFIG = {
    mode: 'user',
    empresaAtual: null,
    empresaContext: null,
    auth: {
        required: false,
        storageKey: CLIENT_SESSION_STORAGE_KEY,
        storageType: 'local',
        loginPage: '/login',
        redirectAfterLogin: '/admin/obras/create'
    },
    features: {
        empresaAutocomplete: true,
        filtros: true,
        editDataNavigation: true,
        shutdown: true
    },
    ui: {
        lockEmpresaField: false
    }
};

const CLIENT_MODE_DEFAULTS = {
    auth: {
        required: true,
        storageType: 'session',
        loginPage: '/login',
        redirectAfterLogin: '/obras/create'
    },
    features: {
        empresaAutocomplete: false,
        filtros: false,
        editDataNavigation: false,
        shutdown: false
    },
    ui: {
        lockEmpresaField: true
    }
};

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, override) {
    const output = { ...base };

    Object.entries(override || {}).forEach(([key, value]) => {
        const baseValue = output[key];

        if (isPlainObject(baseValue) && isPlainObject(value)) {
            output[key] = deepMerge(baseValue, value);
            return;
        }

        output[key] = value;
    });

    return output;
}

function resolveAuthStorage(storageType = 'local') {
    if (typeof window === 'undefined') {
        return null;
    }

    return storageType === 'session'
        ? window.sessionStorage
        : window.localStorage;
}

function safeReadStoredSession(storageKey = CLIENT_SESSION_STORAGE_KEY, storageType = 'local') {
    try {
        const storage = resolveAuthStorage(storageType);
        const rawSession = storage?.getItem(storageKey);
        return rawSession ? JSON.parse(rawSession) : null;
    } catch (error) {
        console.warn('[APP-CONFIG] Falha ao ler sessao armazenada:', error);
        return null;
    }
}

function normalizeEmpresaContext(value) {
    if (!value) return null;

    if (typeof value === 'string') {
        return {
            codigo: value,
            sigla: value,
            nome: value,
            email: '',
            usuario: '',
            expiracao: null,
            expiraEm: null
        };
    }

    const codigo = value.codigo || value.empresaCodigo || value.sigla || value.empresaAtual || '';
    const expiracao = value.expiraEm || value.expiracao || null;

    return {
        codigo,
        sigla: codigo,
        nome: value.nome || value.empresaNome || value.empresaAtual || '',
        email: value.email || value.empresaEmail || value.recoveryEmail || '',
        usuario: value.usuario || '',
        expiracao,
        expiraEm: expiracao
    };
}

function getEmpresaContextFromSession(session) {
    if (!session) return null;

    if (!session.empresa && !session.empresaCodigo) return null;

    return normalizeEmpresaContext({
        codigo: session.empresaCodigo || session.empresa?.codigo || session.empresa?.sigla,
        nome: session.empresaNome || session.empresa?.nome,
        email: session.empresaEmail || session.empresa?.email,
        usuario: session.usuario || session.empresa?.usuario,
        expiraEm: session.expiraEm || session.empresa?.expiraEm || session.empresa?.expiracao
    });
}

function getEmpresaContextFromAuthContext() {
    if (typeof window === 'undefined' || !window.__AUTH_CONTEXT__) {
        return null;
    }

    return getEmpresaContextFromSession(window.__AUTH_CONTEXT__);
}

function mergeEmpresaContexts(primaryContext, fallbackContext) {
    if (!primaryContext) return fallbackContext;
    if (!fallbackContext) return primaryContext;

    return {
        ...fallbackContext,
        ...primaryContext,
        codigo: primaryContext.codigo || fallbackContext.codigo || '',
        sigla: primaryContext.sigla || fallbackContext.sigla || '',
        nome: primaryContext.nome || fallbackContext.nome || '',
        email: primaryContext.email || fallbackContext.email || '',
        usuario: primaryContext.usuario || fallbackContext.usuario || '',
        expiracao: primaryContext.expiracao || fallbackContext.expiracao || null,
        expiraEm: primaryContext.expiraEm || fallbackContext.expiraEm || null
    };
}

function buildAppConfig() {
    const runtimeOverrides = window.__APP_CONFIG_OVERRIDES__ || {};
    let config = deepMerge(DEFAULT_APP_CONFIG, runtimeOverrides);

    if (config.mode === 'client') {
        config = deepMerge(config, CLIENT_MODE_DEFAULTS);
        config = deepMerge(config, runtimeOverrides);
    }

    const storedSession = config.mode === 'client'
        ? safeReadStoredSession(config.auth?.storageKey, config.auth?.storageType)
        : null;
    const sessionEmpresaContext = mergeEmpresaContexts(
        getEmpresaContextFromSession(storedSession),
        getEmpresaContextFromAuthContext()
    );

    if (config.mode === 'client' && sessionEmpresaContext) {
        config.empresaContext = sessionEmpresaContext;
        config.empresaAtual = sessionEmpresaContext.codigo || sessionEmpresaContext.sigla;
    } else if (config.empresaContext || config.empresaAtual) {
        config.empresaContext = normalizeEmpresaContext(config.empresaContext || config.empresaAtual);
        config.empresaAtual = config.empresaContext?.codigo || config.empresaContext?.sigla || config.empresaAtual;
    } else if (config.mode !== 'client') {
        config.empresaContext = null;
        config.empresaAtual = null;
    }

    return config;
}

const APP_CONFIG = buildAppConfig();

function refreshAppConfigFromSession() {
    if (APP_CONFIG.mode !== 'client') {
        APP_CONFIG.empresaContext = null;
        APP_CONFIG.empresaAtual = null;
        return APP_CONFIG;
    }

    const sessionEmpresaContext = getEmpresaContextFromSession(
        safeReadStoredSession(APP_CONFIG.auth?.storageKey, APP_CONFIG.auth?.storageType)
    );
    const authEmpresaContext = getEmpresaContextFromAuthContext();

    APP_CONFIG.empresaContext = mergeEmpresaContexts(
        sessionEmpresaContext,
        authEmpresaContext
    );
    APP_CONFIG.empresaAtual = APP_CONFIG.empresaContext
        ? (APP_CONFIG.empresaContext.codigo || APP_CONFIG.empresaContext.sigla)
        : null;

    return APP_CONFIG;
}

function isClientMode() {
    return APP_CONFIG.mode === 'client';
}

function isFeatureEnabled(featureName) {
    return APP_CONFIG.features?.[featureName] !== false;
}

function getEmpresaContext() {
    if (APP_CONFIG.empresaContext) {
        return APP_CONFIG.empresaContext;
    }

    if (!APP_CONFIG.empresaAtual) {
        return null;
    }

    return normalizeEmpresaContext(APP_CONFIG.empresaAtual);
}

function normalizeComparableValue(value) {
    return (value || '')
        .toString()
        .trim()
        .toUpperCase();
}

function matchesEmpresaContext(obraData, empresaContext = getEmpresaContext()) {
    if (!obraData || !empresaContext || !isClientMode()) {
        return true;
    }

    const obraCodigo = normalizeComparableValue(
        obraData.empresaCodigo || obraData.empresaSigla || obraData.codigo || obraData.sigla || obraData.empresaAtual
    );
    const obraNome = normalizeComparableValue(
        obraData.empresaNome || obraData.nomeEmpresa || obraData.nome || obraData.empresa
    );
    const empresaCodigo = normalizeComparableValue(empresaContext.codigo || empresaContext.sigla);
    const empresaNome = normalizeComparableValue(empresaContext.nome);

    return Boolean(
        (empresaCodigo && obraCodigo === empresaCodigo) ||
        (empresaNome && obraNome === empresaNome)
    );
}

if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
    window.refreshAppConfigFromSession = refreshAppConfigFromSession;
}

export {
    APP_CONFIG,
    CLIENT_SESSION_STORAGE_KEY,
    refreshAppConfigFromSession,
    isClientMode,
    isFeatureEnabled,
    getEmpresaContext,
    matchesEmpresaContext
};
