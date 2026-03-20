import {
    APP_CONFIG,
    isClientMode,
    isFeatureEnabled,
    getEmpresaContext
} from '../core/config.js';
import { ensureClientAccess } from '../core/auth.js';

function getEmpresaDisplayName() {
    const empresaContext = getEmpresaContext();
    if (!empresaContext) {
        return '';
    }

    return empresaContext.nome || empresaContext.codigo || empresaContext.sigla || '';
}

function hideElement(selector) {
    const element = document.querySelector(selector);
    if (!element) return;

    element.style.display = 'none';
    element.setAttribute('aria-hidden', 'true');
}

function setDisabled(input, disabled = true) {
    if (!input) return;

    input.disabled = disabled;
    input.readOnly = disabled;
    input.setAttribute('aria-disabled', String(disabled));
    input.style.cursor = disabled ? 'not-allowed' : 'text';
}

function applyStaticUiRestrictions() {
    if (!isClientMode()) {
        return;
    }

    document.body.classList.add('client-mode');

    if (!isFeatureEnabled('editDataNavigation')) {
        const editNavLink = document.getElementById('nav-editar-dados');
        if (editNavLink?.parentElement) {
            editNavLink.parentElement.style.display = 'none';
        } else {
            hideElement('#nav-editar-dados');
        }
    }

    if (!isFeatureEnabled('shutdown')) {
        hideElement('.shutdown-btn');
    }

    if (!isFeatureEnabled('filtros')) {
        hideElement('.filtro-bloco-altura');
    }
}

function updateClientPageTitle() {
    if (!isClientMode()) {
        return;
    }

    if (typeof window.updateCreateObrasPageTitle === 'function') {
        window.updateCreateObrasPageTitle(false);
        return;
    }

    const pageTitle = document.getElementById('page-title');
    const empresaDisplayName = getEmpresaDisplayName();

    if (pageTitle && empresaDisplayName) {
        const finalTitle = `Criacao de Obras - ${empresaDisplayName}`;
        pageTitle.textContent = finalTitle;
        document.title = `${finalTitle} | Sistema ESI`;
    }
}

function parsePositiveInteger(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const parsed = parseInt(String(value).trim(), 10);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractNumeroFromIdentifier(value, empresaSigla = '') {
    const text = String(value || '').trim();
    if (!text) {
        return null;
    }

    if (empresaSigla) {
        const escapedSigla = escapeRegExp(empresaSigla);
        const matchBySigla = text.match(new RegExp(`${escapedSigla}-(\\d+)$`, 'i')) ||
            text.match(new RegExp(`obra_${escapedSigla}_(\\d+)$`, 'i'));

        if (matchBySigla) {
            return parsePositiveInteger(matchBySigla[1]);
        }
    }

    const genericMatch = text.match(/-(\d+)$/) || text.match(/obra_[A-Za-z0-9]+_(\d+)$/i);
    return genericMatch ? parsePositiveInteger(genericMatch[1]) : null;
}

function resolveNumeroClienteFinal(obraElement, obraData = null, empresaSigla = '') {
    return parsePositiveInteger(obraData?.numeroClienteFinal) ||
        parsePositiveInteger(obraElement.dataset.numeroClienteFinal) ||
        extractNumeroFromIdentifier(obraData?.identificadorObra, empresaSigla) ||
        extractNumeroFromIdentifier(obraData?.idGerado, empresaSigla) ||
        extractNumeroFromIdentifier(obraData?.nome, empresaSigla) ||
        extractNumeroFromIdentifier(obraElement.dataset.identificadorObra, empresaSigla) ||
        extractNumeroFromIdentifier(obraElement.dataset.idGerado, empresaSigla) ||
        extractNumeroFromIdentifier(obraElement.dataset.obraName, empresaSigla) ||
        extractNumeroFromIdentifier(obraElement.querySelector('.obra-title')?.textContent, empresaSigla);
}

function sincronizarIdentificadoresObra(obraElement, empresaSigla, numeroClienteFinal) {
    if (!obraElement || !empresaSigla || !numeroClienteFinal) {
        return;
    }

    obraElement.dataset.numeroClienteFinal = String(numeroClienteFinal);
    obraElement.dataset.idGerado = `obra_${empresaSigla}_${numeroClienteFinal}`;
    obraElement.dataset.identificadorObra = `${empresaSigla}-${numeroClienteFinal}`;
}

function applyClientEmpresaRestrictions(obraId, obraData = null) {
    if (!isClientMode() || !APP_CONFIG.ui?.lockEmpresaField) {
        return false;
    }

    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    const empresaContext = getEmpresaContext();

    if (!obraElement || !empresaContext) {
        return false;
    }

    const empresaInput = document.getElementById(`empresa-input-${obraId}`);
    const numeroClienteInput = document.getElementById(`numero-cliente-${obraId}`);
    const dropdown = document.getElementById(`empresa-dropdown-${obraId}`);
    const formElement = obraElement.querySelector('.empresa-formulario-ativo');
    const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');

    if (!empresaInput || !formElement) {
        return false;
    }

    const empresaSigla = (
        obraData?.empresaCodigo ||
        obraData?.empresaSigla ||
        obraElement.dataset.empresaCodigo ||
        obraElement.dataset.empresaSigla ||
        empresaContext.codigo ||
        empresaContext.sigla ||
        ''
    ).trim();
    const empresaNome = (obraData?.empresaNome || obraElement.dataset.empresaNome || empresaContext.nome || '').trim();
    const empresaValue = [empresaSigla, empresaNome].filter(Boolean).join(' - ');

    if (!obraElement.dataset.empresaCodigo && empresaSigla) {
        obraElement.dataset.empresaCodigo = empresaSigla;
    }

    if (!obraElement.dataset.empresaSigla && empresaSigla) {
        obraElement.dataset.empresaSigla = empresaSigla;
    }

    if (!obraElement.dataset.empresaNome && empresaNome) {
        obraElement.dataset.empresaNome = empresaNome;
    }

    if (!obraElement.dataset.dataCadastro) {
        obraElement.dataset.dataCadastro = new Date().toLocaleDateString('pt-BR');
    }

    empresaInput.value = empresaValue;
    empresaInput.dataset.siglaSelecionada = empresaSigla;
    empresaInput.dataset.nomeSelecionado = empresaNome;

    const numeroExistente = resolveNumeroClienteFinal(obraElement, obraData, empresaSigla);

    if (numeroExistente) {
        sincronizarIdentificadoresObra(obraElement, empresaSigla, numeroExistente);
    } else if (typeof window.empresaCadastro?.calcularNumeroClienteFinal === 'function') {
        const novoNumero = window.empresaCadastro.calcularNumeroClienteFinal(empresaSigla, obraId);
        if (novoNumero) {
            sincronizarIdentificadoresObra(obraElement, empresaSigla, novoNumero);
        }
    }

    if (numeroClienteInput && obraElement.dataset.numeroClienteFinal) {
        numeroClienteInput.value = obraElement.dataset.numeroClienteFinal;
    }

    setDisabled(empresaInput, true);
    setDisabled(numeroClienteInput, true);

    if (dropdown) {
        dropdown.style.display = 'none';
    }

    const clearButton = formElement.querySelector('.btn-limpar');
    if (clearButton) {
        clearButton.style.display = 'none';
    }

    const hideButton = formElement.querySelector('.btn-ocultar');
    if (hideButton) {
        hideButton.textContent = 'Fechar';
    }

    if (empresaContainer) {
        empresaContainer.querySelectorAll('.btn-empresa-cadastro, .btn-empresa-visualizar').forEach((button) => {
            button.style.display = 'none';
        });
    }

    if (typeof window.empresaCadastro?.atualizarHeaderObra === 'function' && obraElement.dataset.numeroClienteFinal) {
        window.empresaCadastro.atualizarHeaderObra(obraElement, {
            empresaSigla,
            empresaNome,
            numeroClienteFinal: obraElement.dataset.numeroClienteFinal,
            clienteFinal: obraElement.dataset.clienteFinal || '',
            codigoCliente: obraElement.dataset.codigoCliente || '',
            dataCadastro: obraElement.dataset.dataCadastro || '',
            orcamentistaResponsavel: obraElement.dataset.orcamentistaResponsavel || ''
        });
    }

    return true;
}

function ensureClientEmpresaForm(obraId, obraData = null) {
    if (!isClientMode()) {
        return false;
    }

    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraElement) {
        return false;
    }

    const formElement = obraElement.querySelector('.empresa-formulario-ativo');
    if (!formElement && typeof window.ativarCadastroEmpresa === 'function') {
        window.ativarCadastroEmpresa(obraId);
    }

    return applyClientEmpresaRestrictions(obraId, obraData);
}

function setupClientObservers() {
    if (!isClientMode()) {
        return;
    }

    document.addEventListener('obraCreated', (event) => {
        const obraId = event.detail?.obraId;
        if (!obraId) return;

        setTimeout(() => {
            ensureClientEmpresaForm(obraId);
        }, 120);
    });
}

function bootstrapClientMode() {
    if (!isClientMode()) {
        return {
            allowed: true,
            session: null
        };
    }

    const access = ensureClientAccess();
    if (!access.allowed) {
        return access;
    }

    applyStaticUiRestrictions();
    updateClientPageTitle();
    setupClientObservers();

    return access;
}

if (typeof window !== 'undefined') {
    window.applyClientEmpresaRestrictions = applyClientEmpresaRestrictions;
}

export {
    bootstrapClientMode,
    applyStaticUiRestrictions,
    updateClientPageTitle,
    applyClientEmpresaRestrictions,
    ensureClientEmpresaForm,
    getEmpresaDisplayName
};
