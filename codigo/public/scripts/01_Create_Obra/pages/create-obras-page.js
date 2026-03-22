import { APP_CONFIG } from '../core/config.js';

const DEFAULT_CREATE_TITLE = 'Criação de Obras';
const DEFAULT_EDIT_TITLE = 'Edicao de Obras';
const dashboardViewParams = new URLSearchParams(window.location.search);

function getModeBaseTitle(modoEdicao) {
    return modoEdicao ? DEFAULT_EDIT_TITLE : DEFAULT_CREATE_TITLE;
}

function getEmpresaTitleSuffix() {
    if (APP_CONFIG.mode !== 'client') {
        return '';
    }

    return APP_CONFIG.empresaContext?.nome || APP_CONFIG.empresaAtual || '';
}

function getPageTitleText(modoEdicao = false) {
    const baseTitle = getModeBaseTitle(modoEdicao);
    const empresaTitle = getEmpresaTitleSuffix();

    return empresaTitle ? `${baseTitle} - ${empresaTitle}` : baseTitle;
}

function updatePageTitle(modoEdicao = false) {
    const pageTitle = document.getElementById('page-title');
    const finalTitle = getPageTitleText(modoEdicao);

    if (pageTitle) {
        pageTitle.textContent = finalTitle;
    }

    document.title = `${finalTitle} | Sistema ESI`;
}

function shouldAutoEnableFilterMode() {
    return (
        dashboardViewParams.get('filtro') === '1' ||
        Boolean(
            dashboardViewParams.get('obra') ||
            dashboardViewParams.get('obraId') ||
            dashboardViewParams.get('empresa') ||
            dashboardViewParams.get('numero')
        )
    );
}

function clearAutoFilterParam() {
    const url = new URL(window.location.href);
    url.searchParams.delete('filtro');
    window.history.replaceState({}, '', url.toString());
}

function isEmbeddedObraView() {
    return dashboardViewParams.get('embed') === '1';
}

function applyEmbeddedObraView() {
    if (!isEmbeddedObraView()) {
        return;
    }

    document.body.classList.add('obra-embed-mode');
}

function applyRequestedFilters() {
    const empresa = dashboardViewParams.get('empresa')?.trim() || '';
    const numero = dashboardViewParams.get('numero')?.trim() || '';
    const obra = dashboardViewParams.get('obra')?.trim() || '';

    if (!empresa && !numero && !obra) {
        return;
    }

    const empresaInput = document.getElementById('filter-empresa');
    const numeroInput = document.getElementById('filter-numero-cliente');
    const nomeInput = document.getElementById('filter-nome-obra');

    if (empresaInput && empresa) {
        empresaInput.value = empresa;
        window.FilterSystem?.updateFilterValue('empresa', empresa);
    }

    if (numeroInput && numero) {
        numeroInput.value = numero;
        const parsedNumero = parseInt(numero, 10);
        window.FilterSystem?.updateFilterValue('numeroCliente', Number.isNaN(parsedNumero) ? null : parsedNumero);
    }

    if (nomeInput && obra) {
        nomeInput.value = obra;
        window.FilterSystem?.updateFilterValue('nomeObra', obra);
    }

    clearTimeout(window._dashboardRequestedFilterTimeout);
    window._dashboardRequestedFilterTimeout = setTimeout(() => {
        window.FilterSystem?.reloadObras?.();
    }, 120);
}

function enforceFocusedObra() {
    const obraId = dashboardViewParams.get('obraId')?.trim();
    if (!obraId) {
        return false;
    }

    const obraBlocks = Array.from(document.querySelectorAll('.obra-block[data-obra-id]'));
    if (obraBlocks.length === 0) {
        return false;
    }

    const targetBlock = obraBlocks.find((obraBlock) => String(obraBlock.dataset.obraId || '').trim() === obraId);
    if (!targetBlock) {
        return false;
    }

    obraBlocks.forEach((obraBlock) => {
        const isTarget = obraBlock === targetBlock;
        obraBlock.style.display = isTarget ? '' : 'none';
        obraBlock.setAttribute('aria-hidden', String(!isTarget));
    });

    return true;
}

function setupFocusedObraObserver() {
    if (!dashboardViewParams.get('obraId')) {
        return;
    }

    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) {
        return;
    }

    const applyFocus = () => {
        window.requestAnimationFrame(() => {
            enforceFocusedObra();
        });
    };

    applyFocus();

    const observer = new MutationObserver(applyFocus);
    observer.observe(projectsContainer, {
        childList: true,
        subtree: true
    });
}

function autoEnableFilterMode() {
    if (!shouldAutoEnableFilterMode()) {
        return;
    }

    let attempts = 0;
    const maxAttempts = 40;

    const enableFilterOnReady = () => {
        attempts += 1;

        const toggleSwitch = document.getElementById('filter-toggle');
        if (!toggleSwitch) {
            if (attempts >= maxAttempts) {
                clearInterval(intervalId);
            }
            return;
        }

        if (toggleSwitch.disabled || !window.FilterSystem) {
            if (attempts >= maxAttempts) {
                clearInterval(intervalId);
            }
            return;
        }

        clearInterval(intervalId);

        if (!toggleSwitch.checked) {
            toggleSwitch.checked = true;
            toggleSwitch.dispatchEvent(new Event('change', { bubbles: true }));
        }

        applyRequestedFilters();
        enforceFocusedObra();
        updatePageTitle(true);
        clearAutoFilterParam();
    };

    const intervalId = setInterval(enableFilterOnReady, 200);
    enableFilterOnReady();
}

function resolveActiveLink() {
    const currentPath = window.location.pathname.toLowerCase();

    if (currentPath.startsWith('/obras/create') || currentPath.startsWith('/admin/obras/create')) {
        return document.getElementById('nav-criar-obras');
    }

    if (currentPath.startsWith('/admin/data')) {
        return document.getElementById('nav-editar-dados');
    }

    return document.querySelector('.nav-list li a');
}

function highlightAndLockActivePage() {
    document.querySelectorAll('.nav-list li a').forEach((link) => {
        link.classList.remove('active');
    });

    const activeLink = resolveActiveLink();
    if (!activeLink) {
        return;
    }

    activeLink.classList.add('active');
    activeLink.setAttribute('data-current-page', 'true');

    activeLink.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }, true);
}

function bindFilterTitleUpdates() {
    const toggleSwitch = document.getElementById('filter-toggle');
    if (!toggleSwitch) {
        return;
    }

    toggleSwitch.addEventListener('change', function onToggleChange() {
        updatePageTitle(this.checked);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    window.updateCreateObrasPageTitle = updatePageTitle;
    window.updatePageTitle = updatePageTitle;

    applyEmbeddedObraView();
    highlightAndLockActivePage();
    bindFilterTitleUpdates();
    updatePageTitle(false);
    autoEnableFilterMode();
    setupFocusedObraObserver();

    setTimeout(highlightAndLockActivePage, 50);
});
