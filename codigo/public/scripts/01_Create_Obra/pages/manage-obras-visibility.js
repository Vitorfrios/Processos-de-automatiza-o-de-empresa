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

function removeManageFinancialElement(element) {
    if (element?.parentNode) {
        element.parentNode.removeChild(element);
    }
}

function removeManageFinancialUi() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    container.querySelectorAll(
        '.climatization-form-grid .form-group:has(.price-display), ' +
        '.option-price, ' +
        '.all-machines-total-price, ' +
        '.room-total-container, ' +
        '.project-total-value, ' +
        '.obra-total-value, ' +
        '.tubos-total-geral, ' +
        '.field-group:has(.input-valor), ' +
        '.total-item-valor, ' +
        '.duto-header-line .material-inline, ' +
        '.duto-selector .selector-item:has([id^="duto-valor-tipo-"]), ' +
        '.duto-selector .selector-item:has([id^="duto-valor-opcional-"]), ' +
        '.duto-selector .selector-item:has([id^="duto-valor-total-"]), ' +
        '.acessorio-selector .selector-item:has([id^="acessorio-valor-"])'
    ).forEach(removeManageFinancialElement);

    container.querySelectorAll('[id^="total-geral-valor-"]').forEach((element) => {
        removeManageFinancialElement(element.closest('.total-geral-item') || element);
    });

    container.querySelectorAll('.dutos-table').forEach((table) => {
        table.querySelectorAll('tr').forEach((row) => {
            [7, 6, 5].forEach((index) => {
                if (row.children[index]) removeManageFinancialElement(row.children[index]);
            });
        });
        table.querySelectorAll('tfoot').forEach(removeManageFinancialElement);
    });

    container.querySelectorAll('.acessorios-table').forEach((table) => {
        table.querySelectorAll('tr').forEach((row) => {
            [5, 4].forEach((index) => {
                if (row.children[index]) removeManageFinancialElement(row.children[index]);
            });
        });
        table.querySelectorAll('tfoot').forEach(removeManageFinancialElement);
    });
}

function initializeManageSectionVisibility() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    hideManageSections();
    removeManageFinancialUi();
    new MutationObserver(() => {
        hideManageSections();
        removeManageFinancialUi();
    }).observe(container, {
        childList: true,
        subtree: true,
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeManageSectionVisibility, { once: true });
} else {
    initializeManageSectionVisibility();
}
