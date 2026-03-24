import { createSmartLogger } from '../core/logger.js';
import { APP_CONFIG } from '../core/config.js';

const embedParams = new URLSearchParams(window.location.search);

Object.defineProperty(window, 'logger', {
    value: createSmartLogger({
        ...APP_CONFIG,
        logger: {
            ...(APP_CONFIG.logger || {}),
            announceCommands: false
        }
    }),
    configurable: true,
    writable: true,
    enumerable: APP_CONFIG.mode !== 'client'
});

const toggleSystemLogger = function(enable = null) {
    if (window.logger && typeof window.toggleLogger === 'function') {
        return window.toggleLogger(enable);
    }

    console.warn('Logger não disponível para controle');
    return false;
};

Object.defineProperty(window, 'toggleSystemLogger', {
    value: toggleSystemLogger,
    configurable: true,
    writable: true,
    enumerable: APP_CONFIG.mode !== 'client'
});

function setStatus(message, type = 'info') {
    const statusElement = document.getElementById('obraEmbedStatus');
    if (!statusElement) {
        return;
    }

    statusElement.textContent = message;
    statusElement.dataset.type = type;
    statusElement.hidden = false;
}

function hideStatus() {
    const statusElement = document.getElementById('obraEmbedStatus');
    if (statusElement) {
        statusElement.hidden = true;
    }
}

function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

function getRequestedObra() {
    return {
        obraId: String(embedParams.get('obraId') || '').trim(),
        obraNome: String(embedParams.get('obra') || '').trim()
    };
}

async function fetchObraCatalog() {
    const response = await fetch('/api/obras/catalog');
    if (!response.ok) {
        throw new Error(`Falha ao carregar catalogo: ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload?.obras) ? payload.obras : [];
}

async function fetchObraById(obraId) {
    const response = await fetch(`/obras/${encodeURIComponent(obraId)}`);
    if (!response.ok) {
        throw new Error(`Falha ao carregar obra ${obraId}: ${response.status}`);
    }

    return response.json();
}

function findRequestedObra(obras) {
    const { obraId, obraNome } = getRequestedObra();
    const normalizedName = normalizeText(obraNome);

    if (obraId) {
        const obraById = obras.find((obra) => String(obra?.id || '').trim() === obraId);
        if (obraById) {
            return obraById;
        }
    }

    if (normalizedName) {
        return obras.find((obra) => normalizeText(obra?.nome) === normalizedName) || null;
    }

    return null;
}

function expandLoadedObra(obraId) {
    if (!obraId) {
        return;
    }

    const obraContent = document.getElementById(`obra-content-${obraId}`);
    if (obraContent) {
        obraContent.classList.remove('collapsed');
    }

    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    const minimizer = obraBlock?.querySelector('.obra-header .minimizer');
    if (minimizer) {
        minimizer.textContent = '−';
    }
}

function bootstrapEmbedGlobals() {
    if (typeof window.systemConstants === 'undefined') {
        window.systemConstants = null;
    }

    if (typeof window.obraCounter === 'undefined') {
        window.obraCounter = 0;
    }

    if (typeof window.GeralCount === 'undefined') {
        window.GeralCount = 0;
    }

    if (typeof window.systemLoaded === 'undefined') {
        window.systemLoaded = false;
    }
}

async function loadRequestedObra(loadSingleObra, removeBaseObraFromHTML) {
    {
        const { obraId } = getRequestedObra();
        let obraSolicitada = null;

        if (obraId) {
            obraSolicitada = await fetchObraById(obraId);
        } else {
            const obrasCatalogo = await fetchObraCatalog();
            const obraCatalogo = findRequestedObra(obrasCatalogo);
            if (obraCatalogo?.id) {
                obraSolicitada = await fetchObraById(obraCatalogo.id);
            }
        }

        if (!obraSolicitada) {
            throw new Error('Obra solicitada nao encontrada.');
        }

        removeBaseObraFromHTML();

        const carregadas = await loadSingleObra(obraSolicitada);
        if (!carregadas) {
            throw new Error('Nao foi possivel renderizar a obra selecionada.');
        }

        expandLoadedObra(obraSolicitada.id);
        document.title = `${obraSolicitada.nome || obraSolicitada.id} | Sistema ESI`;
        hideStatus();
        return;
    }

    const obras = await fetchBackupObras();
    const obra = findRequestedObra(obras);

    if (!obra) {
        throw new Error('Obra solicitada não encontrada no backup.');
    }

    removeBaseObraFromHTML();

    const loadedCount = await loadSingleObra(obra);
    if (!loadedCount) {
        throw new Error('Não foi possível renderizar a obra selecionada.');
    }

    expandLoadedObra(obra.id);
    document.title = `${obra.nome || obra.id} | Sistema ESI`;
    hideStatus();
}

async function initializeEmbedPage() {
    try {
        bootstrapEmbedGlobals();
        setStatus('Inicializando visualização da obra...');

        const [
            systemInitModule,
            obraLoaderModule
        ] = await Promise.all([
            import('../main-folder/system-init.js'),
            import('../data/adapters/obra-adapter-folder/obra-data-loader.js'),
            import('../data/empresa-system/empresa-form-manager.js')
        ]);

        const { initializeSystem } = systemInitModule;
        const { loadSingleObra, removeBaseObraFromHTML } = obraLoaderModule;

        const systemInitialized = await initializeSystem();
        if (systemInitialized === false) {
            setStatus('Acesso indisponível para carregar a obra.', 'error');
            return;
        }

        setStatus('Carregando dados da obra...');
        await loadRequestedObra(loadSingleObra, removeBaseObraFromHTML);
    } catch (error) {
        console.error('[OBRA-EMBED] Erro ao inicializar visualização da obra:', error);
        setStatus(error.message || 'Erro ao carregar a obra.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', initializeEmbedPage);
