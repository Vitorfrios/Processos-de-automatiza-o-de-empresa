import '../../03_Edit_data/config/request-bridge.js';
import { normalizeEmpresa } from '../core/shared-utils.js';
import { carregarEmpresasComCache } from '../data/empresa-system/empresa-core.js';

const FILTER_FIELDS = [
    ['manage-obras-filter-empresa', obra => [obra.dataset.empresaSigla, obra.dataset.empresaNome].join(' ')],
    ['manage-obras-filter-numero-cliente', obra => obra.dataset.numeroClienteFinal || ''],
    ['manage-obras-filter-nome-obra', obra => obra.dataset.obraName || obra.querySelector('.obra-title')?.textContent || ''],
];

let empresas = [];
let activeCompanyIndex = -1;

function normalize(value) {
    return String(value || '')
        .trim()
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function applyManageObrasFilter() {
    const obras = document.querySelectorAll('#projects-container > .obra-block');
    const values = FILTER_FIELDS.map(([id]) => normalize(document.getElementById(id)?.value));

    obras.forEach((obra) => {
        const matches = FILTER_FIELDS.every(([, getValue], index) => {
            const filterValue = values[index];
            return !filterValue || normalize(getValue(obra)).includes(filterValue);
        });
        obra.style.display = matches ? '' : 'none';
    });
}

function renderCompanyOptions(searchValue = '') {
    const input = document.getElementById('manage-obras-filter-empresa');
    const dropdown = document.getElementById('manage-obras-filter-empresa-dropdown');
    if (!input || !dropdown) return;

    const normalizedSearch = normalize(searchValue);
    const matchingEmpresas = empresas.filter((empresa) => {
        const label = `${empresa.codigo} - ${empresa.nome}`;
        return !normalizedSearch || normalize(label).includes(normalizedSearch);
    });

    dropdown.innerHTML = matchingEmpresas.length
        ? matchingEmpresas.map((empresa, index) => `
            <button type="button" class="manage-obras-company-option${index === activeCompanyIndex ? ' is-active' : ''}"
                data-company-code="${encodeURIComponent(empresa.codigo)}"
                data-company-name="${encodeURIComponent(empresa.nome)}"
                role="option">
                ${escapeHtml(`${empresa.codigo} - ${empresa.nome}`)}
            </button>
        `).join('')
        : '<div class="manage-obras-company-option">Nenhuma empresa encontrada</div>';

    dropdown.style.display = 'block';
    dropdown.querySelectorAll('[data-company-code]').forEach((option) => {
        option.addEventListener('mousedown', (event) => event.preventDefault());
        option.addEventListener('click', () => {
            input.value = `${decodeURIComponent(option.dataset.companyCode)} - ${decodeURIComponent(option.dataset.companyName)}`;
            dropdown.style.display = 'none';
            activeCompanyIndex = -1;
            applyManageObrasFilter();
        });
    });
}

function escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = value;
    return element.innerHTML;
}

async function initializeCompanyAutocomplete() {
    const input = document.getElementById('manage-obras-filter-empresa');
    const dropdown = document.getElementById('manage-obras-filter-empresa-dropdown');
    if (!input || !dropdown) return;

    try {
        const empresasCarregadas = await carregarEmpresasComCache();
        empresas = empresasCarregadas.map(normalizeEmpresa).filter(Boolean);
    } catch (error) {
        empresas = [];
        console.error('[GERENCIAR OBRAS] Erro ao carregar empresas:', error);
    }

    input.addEventListener('focus', () => renderCompanyOptions(input.value));
    input.addEventListener('input', () => {
        activeCompanyIndex = -1;
        renderCompanyOptions(input.value);
        applyManageObrasFilter();
    });
    input.addEventListener('keydown', (event) => {
        const options = [...dropdown.querySelectorAll('[data-company-code]')];
        if (!options.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            activeCompanyIndex = (activeCompanyIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
            renderCompanyOptions(input.value);
        } else if (event.key === 'Enter' && activeCompanyIndex >= 0) {
            event.preventDefault();
            options[activeCompanyIndex]?.click();
        } else if (event.key === 'Escape') {
            dropdown.style.display = 'none';
        }
    });
    input.addEventListener('blur', () => setTimeout(() => { dropdown.style.display = 'none'; }, 120));
    document.addEventListener('click', (event) => {
        if (!input.contains(event.target) && !dropdown.contains(event.target)) dropdown.style.display = 'none';
    });
}

function initializeManageObrasFilter() {
    FILTER_FIELDS.forEach(([id]) => {
        document.getElementById(id)?.addEventListener('input', applyManageObrasFilter);
    });

    const container = document.getElementById('projects-container');
    if (!container) return;

    new MutationObserver(applyManageObrasFilter).observe(container, {
        childList: true,
        subtree: true,
    });

    applyManageObrasFilter();
    initializeCompanyAutocomplete();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeManageObrasFilter, { once: true });
} else {
    initializeManageObrasFilter();
}
