const HIDDEN_MANAGE_SECTION_TITLES = new Set([
    'Tabela de Inputs',
    'Climatização',
    'Ventilação',
]);

function hideManageSections() {
    document.querySelectorAll('#projects-container .section-block').forEach((section) => {
        const title = section.querySelector(':scope > .section-header .section-title');
        if (title && HIDDEN_MANAGE_SECTION_TITLES.has(title.textContent.trim())) {
            section.hidden = true;
        }
    });
}

function initializeManageSectionVisibility() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    hideManageSections();
    new MutationObserver(hideManageSections).observe(container, {
        childList: true,
        subtree: true,
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeManageSectionVisibility, { once: true });
} else {
    initializeManageSectionVisibility();
}
