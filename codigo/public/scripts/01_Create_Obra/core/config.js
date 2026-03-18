const CLIENT_SESSION_STORAGE_KEY = 'esi_client_session';

const DEFAULT_APP_CONFIG = {
    mode: 'user',
    empresaAtual: null,
    empresaContext: null,
    auth: {
        required: false,
        storageKey: CLIENT_SESSION_STORAGE_KEY,
        loginPage: './00_Login.html',
        redirectAfterLogin: './01_Create_Obras.html'
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
        loginPage: './00_Client_Login.html',
        redirectAfterLogin: './01_Create_Obras_Client.html'
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

function safeReadStoredSession(storageKey = CLIENT_SESSION_STORAGE_KEY) {
    try {
        const rawSession = window.localStorage.getItem(storageKey);
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
        usuario: session.usuario || session.empresa?.usuario,
        expiraEm: session.expiraEm || session.empresa?.expiraEm || session.empresa?.expiracao
    });
}

function buildAppConfig() {
    const runtimeOverrides = window.__APP_CONFIG_OVERRIDES__ || {};
    let config = deepMerge(DEFAULT_APP_CONFIG, runtimeOverrides);

    if (config.mode === 'client') {
        config = deepMerge(config, CLIENT_MODE_DEFAULTS);
        config = deepMerge(config, runtimeOverrides);
    }

    const storedSession = config.mode === 'client'
        ? safeReadStoredSession(config.auth?.storageKey)
        : null;
    const sessionEmpresaContext = getEmpresaContextFromSession(storedSession);

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
        safeReadStoredSession(APP_CONFIG.auth?.storageKey)
    );

    APP_CONFIG.empresaContext = sessionEmpresaContext;
    APP_CONFIG.empresaAtual = sessionEmpresaContext
        ? (sessionEmpresaContext.codigo || sessionEmpresaContext.sigla)
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
