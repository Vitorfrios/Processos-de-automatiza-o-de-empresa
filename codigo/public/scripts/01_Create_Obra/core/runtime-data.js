const RUNTIME_BOOTSTRAP_ENDPOINT = '/api/runtime/bootstrap';
const RUNTIME_ROUTE_BUILDERS = {
    '/api/dados/empresas': (payload) => ({
        success: true,
        empresas: payload.empresas || []
    }),
    '/api/backup-completo': (payload) => payload.backup || { obras: [] },
    '/api/session-obras': (payload) => payload.sessionObras || { session_id: null, obras: [] }
};

let runtimeBootstrapCache = null;
let runtimeBootstrapPromise = null;

function createEmptyRuntimePayload() {
    return {
        success: true,
        empresas: [],
        sessionObras: {
            session_id: null,
            obras: []
        },
        backup: {
            obras: []
        },
        obrasSessao: []
    };
}

function normalizeRuntimePayload(payload = {}) {
    const fallback = createEmptyRuntimePayload();
    const sessionObras = payload.sessionObras || payload.session_obras || fallback.sessionObras;
    const backup = payload.backup || fallback.backup;
    const obrasSessao = Array.isArray(payload.obrasSessao) ? payload.obrasSessao : fallback.obrasSessao;

    return {
        success: payload.success !== false,
        empresas: Array.isArray(payload.empresas) ? payload.empresas : fallback.empresas,
        sessionObras: {
            session_id: sessionObras.session_id || null,
            obras: Array.isArray(sessionObras.obras) ? sessionObras.obras : []
        },
        backup: {
            ...backup,
            obras: Array.isArray(backup.obras) ? backup.obras : []
        },
        obrasSessao
    };
}

async function requestRuntimeBootstrap() {
    const response = await fetch(RUNTIME_BOOTSTRAP_ENDPOINT);

    if (!response.ok) {
        throw new Error(`Erro HTTP ao carregar bootstrap: ${response.status}`);
    }

    const payload = await response.json();
    return normalizeRuntimePayload(payload);
}

export async function loadRuntimeBootstrap(options = {}) {
    const forceReload = options === true || options.force === true;

    if (forceReload) {
        invalidateRuntimeBootstrap();
    }

    if (runtimeBootstrapCache) {
        return runtimeBootstrapCache;
    }

    if (!runtimeBootstrapPromise) {
        runtimeBootstrapPromise = requestRuntimeBootstrap()
            .then((payload) => {
                runtimeBootstrapCache = payload;
                runtimeBootstrapPromise = null;
                return payload;
            })
            .catch((error) => {
                runtimeBootstrapPromise = null;
                throw error;
            });
    }

    return runtimeBootstrapPromise;
}

export function invalidateRuntimeBootstrap() {
    runtimeBootstrapCache = null;
    runtimeBootstrapPromise = null;
}

function createJsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

function shouldInvalidateRuntimeCache(method, pathname) {
    const upperMethod = String(method || 'GET').toUpperCase();

    if (upperMethod === 'GET') {
        return false;
    }

    if (pathname.startsWith('/api/dados/empresas') || pathname === '/obras') {
        return true;
    }

    if (pathname.startsWith('/obras/')) {
        return true;
    }

    if (pathname.startsWith('/api/sessions/')) {
        return true;
    }

    return false;
}

export function installRuntimeFetchBridge() {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
        return;
    }

    if (window.__runtimeFetchBridgeInstalled) {
        return;
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = async function runtimeFetchBridge(input, init) {
        const requestUrl = typeof input === 'string' ? input : input?.url;
        const requestMethod = init?.method || (typeof input !== 'string' ? input?.method : null) || 'GET';
        const normalizedUrl = new URL(requestUrl, window.location.origin);
        const routeBuilder = RUNTIME_ROUTE_BUILDERS[normalizedUrl.pathname];

        if (String(requestMethod).toUpperCase() === 'GET' && routeBuilder) {
            const payload = await loadRuntimeBootstrap();
            return createJsonResponse(routeBuilder(payload));
        }

        const response = await originalFetch(input, init);

        if (shouldInvalidateRuntimeCache(requestMethod, normalizedUrl.pathname)) {
            invalidateRuntimeBootstrap();
        }

        return response;
    };

    window.__runtimeFetchBridgeInstalled = true;
    window.__runtimeOriginalFetch = originalFetch;
}

export async function getEmpresasRuntimeData(options = {}) {
    const payload = await loadRuntimeBootstrap(options);
    return payload.empresas || [];
}

export async function getBackupRuntimeData(options = {}) {
    const payload = await loadRuntimeBootstrap(options);
    return payload.backup || { obras: [] };
}

export async function getBackupObrasRuntimeData(options = {}) {
    const backup = await getBackupRuntimeData(options);
    return Array.isArray(backup.obras) ? backup.obras : [];
}

export async function getSessionObrasRuntimeData(options = {}) {
    const payload = await loadRuntimeBootstrap(options);
    return payload.sessionObras || { session_id: null, obras: [] };
}

export async function getSessionScopedObrasRuntimeData(options = {}) {
    const payload = await loadRuntimeBootstrap(options);
    return Array.isArray(payload.obrasSessao) ? payload.obrasSessao : [];
}

if (typeof window !== 'undefined') {
    window.loadRuntimeBootstrap = loadRuntimeBootstrap;
    window.invalidateRuntimeBootstrap = invalidateRuntimeBootstrap;
    installRuntimeFetchBridge();
}
