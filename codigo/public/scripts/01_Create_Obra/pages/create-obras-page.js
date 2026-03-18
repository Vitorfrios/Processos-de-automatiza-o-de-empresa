import { APP_CONFIG } from '../core/config.js';

const DEFAULT_CREATE_TITLE = 'Criacao de Obras';
const DEFAULT_EDIT_TITLE = 'Edicao de Obras';

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

    highlightAndLockActivePage();
    bindFilterTitleUpdates();
    updatePageTitle(false);

    setTimeout(highlightAndLockActivePage, 50);
});
