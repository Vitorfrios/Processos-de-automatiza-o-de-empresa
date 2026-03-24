const RUNTIME_BOOTSTRAP_ENDPOINT = '/api/runtime/bootstrap';
const RUNTIME_ROUTE_BUILDERS = {
    '/api/dados/empresas': (payload) => ({
        success: true,
        empresas: payload.empresas || []
    }),
    '/api/obras/catalog': (payload) => payload.obraCatalog || { obras: [] },
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
        obraCatalog: {
            obras: []
        },
        obrasSessao: []
    };
}

function normalizeRuntimePayload(payload = {}) {
    const fallback = createEmptyRuntimePayload();
    const sessionObras = payload.sessionObras || payload.session_obras || fallback.sessionObras;
    const obraCatalog = payload.obraCatalog || payload.backup || fallback.obraCatalog;
    const obrasSessao = Array.isArray(payload.obrasSessao) ? payload.obrasSessao : fallback.obrasSessao;

    return {
        success: payload.success !== false,
        empresas: Array.isArray(payload.empresas) ? payload.empresas : fallback.empresas,
        sessionObras: {
            session_id: sessionObras.session_id || null,
            obras: Array.isArray(sessionObras.obras) ? sessionObras.obras : []
        },
        obraCatalog: {
            ...obraCatalog,
            obras: Array.isArray(obraCatalog.obras) ? obraCatalog.obras : []
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

    if (pathname === '/api/delete') {
        return true;
    }

    return false;
}

export function removeObraFromRuntimeBootstrap(obraId) {
    const obraIdStr = String(obraId || '').trim();
    if (!obraIdStr) {
        return false;
    }

    const prunePayload = (payload) => {
        if (!payload || typeof payload !== 'object') {
            return false;
        }

        let removed = false;

        if (payload.obraCatalog && Array.isArray(payload.obraCatalog.obras)) {
            const previousLength = payload.obraCatalog.obras.length;
            payload.obraCatalog.obras = payload.obraCatalog.obras.filter(
                (obra) => String(obra?.id || '').trim() !== obraIdStr
            );
            removed = removed || payload.obraCatalog.obras.length !== previousLength;
        }

        if (payload.sessionObras && Array.isArray(payload.sessionObras.obras)) {
            const previousLength = payload.sessionObras.obras.length;
            payload.sessionObras.obras = payload.sessionObras.obras.filter(
                (id) => String(id || '').trim() !== obraIdStr
            );
            removed = removed || payload.sessionObras.obras.length !== previousLength;
        }

        if (Array.isArray(payload.obrasSessao)) {
            const previousLength = payload.obrasSessao.length;
            payload.obrasSessao = payload.obrasSessao.filter(
                (obra) => String(obra?.id || '').trim() !== obraIdStr
            );
            removed = removed || payload.obrasSessao.length !== previousLength;
        }

        return removed;
    };

    const removedFromCache = prunePayload(runtimeBootstrapCache);

    if (typeof window !== 'undefined' && window.__RUNTIME_BOOTSTRAP__) {
        prunePayload(window.__RUNTIME_BOOTSTRAP__);
    }

    return removedFromCache;
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
    return payload.obraCatalog || { obras: [] };
}

export async function getBackupObrasRuntimeData(options = {}) {
    const backup = await getBackupRuntimeData(options);
    return Array.isArray(backup.obras) ? backup.obras : [];
}

export async function getObraCatalogRuntimeData(options = {}) {
    const catalog = await getBackupRuntimeData(options);
    return Array.isArray(catalog.obras) ? catalog.obras : [];
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
    if (window.__RUNTIME_BOOTSTRAP__) {
        runtimeBootstrapCache = normalizeRuntimePayload(window.__RUNTIME_BOOTSTRAP__);
    }
    window.loadRuntimeBootstrap = loadRuntimeBootstrap;
    window.invalidateRuntimeBootstrap = invalidateRuntimeBootstrap;
    window.removeObraFromRuntimeBootstrap = removeObraFromRuntimeBootstrap;
    installRuntimeFetchBridge();
}
