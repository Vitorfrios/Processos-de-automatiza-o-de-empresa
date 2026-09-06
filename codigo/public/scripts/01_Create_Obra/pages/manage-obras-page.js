import "../../03_Edit_data/config/request-bridge.js";

const managedObrasElement = document.getElementById('managed-obras');
const refreshButton = document.getElementById('refresh-obras');

const monetaryKeyPattern = /(preco|price|currency|valor.*(total|base|unit)|total.*valor)/i;

function escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = value == null ? '' : String(value);
    return element.innerHTML;
}

function isVisibleValue(key, value) {
    if (monetaryKeyPattern.test(String(key))) return false;
    if (typeof value === 'string' && /R\$\s*[\d.,]+/i.test(value)) return false;
    return value !== null && value !== undefined && value !== '';
}

function formatValue(value) {
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (Array.isArray(value)) return value.length ? `${value.length} item(ns)` : '';
    if (typeof value === 'object') return '';
    return String(value);
}

function renderData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return '';

    const entries = Object.entries(data).filter(([key, value]) => isVisibleValue(key, value));
    if (!entries.length) return '<p class="management-empty">Nenhum dado preenchido.</p>';

    return `<dl class="management-data">${entries.map(([key, value]) => {
        const formattedValue = formatValue(value);
        if (!formattedValue) return '';
        return `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(formattedValue)}</dd></div>`;
    }).join('')}</dl>`;
}

function renderItems(items) {
    if (!Array.isArray(items) || !items.length) {
        return '<p class="management-empty">Nenhum item preenchido.</p>';
    }

    return items.map((item, index) => {
        if (typeof item !== 'object' || item === null) {
            return `<div class="management-data"><div><dt>Item ${index + 1}</dt><dd>${escapeHtml(item)}</dd></div></div>`;
        }
        return renderData(item);
    }).join('');
}

function renderToggleSection(title, content, sectionId) {
    return `
        <section class="management-section">
            <div class="management-section-header">
                <button type="button" class="management-toggle" data-target="${sectionId}" aria-expanded="false">+</button>
                <h4>${escapeHtml(title)}</h4>
            </div>
            <div id="${sectionId}" class="management-section-content management-collapsed">${content}</div>
        </section>
    `;
}

function renderRoom(room, roomIndex) {
    const roomId = `managed-room-${room.id || roomIndex}`;
    const sectionPrefix = `${roomId}-section`;
    const sections = [
        renderToggleSection('Tabela de Inputs', renderData({ ...room.inputs, ...room.capacidade, ...room.ganhosTermicos }), `${sectionPrefix}-inputs`),
        renderToggleSection('Climatização', renderItems(room.maquinas), `${sectionPrefix}-climatizacao`),
        renderToggleSection('Ventilação', renderData(room.ventilacao), `${sectionPrefix}-ventilacao`),
        renderToggleSection('Acessórios de Difusão e Controle de Ar', renderItems(room.acessorios), `${sectionPrefix}-acessorios`),
        renderToggleSection('Tubulação de Cobre', renderItems(room.tubulacao?.conjuntos), `${sectionPrefix}-tubulacao`),
        renderToggleSection('Dutos para Climatização', renderItems(room.dutos), `${sectionPrefix}-dutos`),
    ].join('');

    return `
        <article class="managed-room">
            <div class="managed-room-header">
                <button type="button" class="management-toggle" data-target="${roomId}-content" aria-expanded="false">+</button>
                <h4 class="managed-room-title">${escapeHtml(room.nome || `Sala ${roomIndex + 1}`)}</h4>
            </div>
            <div id="${roomId}-content" class="managed-room-content management-collapsed">${sections}</div>
        </article>
    `;
}

function renderProject(project, projectIndex) {
    const projectId = `managed-project-${project.id || projectIndex}`;
    const rooms = Array.isArray(project.salas) && project.salas.length
        ? project.salas.map(renderRoom).join('')
        : '<p class="management-empty">Nenhuma sala cadastrada.</p>';
    const projectAdditional = renderToggleSection('Adicionais do projeto', renderItems(project.adicionaisProjeto), `${projectId}-adicionais`);
    const serviceAdditional = renderToggleSection('Adicionais de Serviços', renderItems(project.servicos?.adicionais), `${projectId}-servicos-adicionais`);

    return `
        <article class="managed-project">
            <div class="managed-project-header">
                <button type="button" class="management-toggle" data-target="${projectId}-content" aria-expanded="false">+</button>
                <h3 class="managed-project-title">${escapeHtml(project.nome || `Projeto ${projectIndex + 1}`)}</h3>
            </div>
            <div id="${projectId}-content" class="managed-project-content management-collapsed">
                ${projectAdditional}
                ${serviceAdditional}
                ${rooms}
            </div>
        </article>
    `;
}

function renderObra(obra, obraIndex) {
    const obraId = `managed-obra-${obra.id || obraIndex}`;
    const projects = Array.isArray(obra.projetos) && obra.projetos.length
        ? obra.projetos.map(renderProject).join('')
        : '<p class="management-empty">Nenhum projeto cadastrado.</p>';

    return `
        <article class="managed-obra">
            <div class="managed-obra-header">
                <button type="button" class="management-toggle" data-target="${obraId}-content" aria-expanded="false">+</button>
                <h2 class="managed-obra-title">${escapeHtml(obra.nome || `Obra ${obraIndex + 1}`)}</h2>
            </div>
            <div id="${obraId}-content" class="managed-obra-content management-collapsed">${projects}</div>
        </article>
    `;
}

function bindToggles() {
    managedObrasElement.querySelectorAll('[data-target]').forEach((button) => {
        button.addEventListener('click', () => {
            const target = document.getElementById(button.dataset.target);
            if (!target) return;
            const isCollapsed = target.classList.toggle('management-collapsed');
            button.textContent = isCollapsed ? '+' : '−';
            button.setAttribute('aria-expanded', String(!isCollapsed));
        });
    });
}

async function loadObras() {
    managedObrasElement.innerHTML = '<p class="management-status">Carregando obras salvas...</p>';

    try {
        const response = await fetch('/api/obras/catalog');
        if (!response.ok) throw new Error(`Falha ao carregar obras: ${response.status}`);
        const payload = await response.json();
        const obras = Array.isArray(payload.obras) ? payload.obras : [];

        if (!obras.length) {
            managedObrasElement.innerHTML = '<p class="management-status">Nenhuma obra salva encontrada.</p>';
            return;
        }

        const completeObras = await Promise.all(obras.map(async (obra) => {
            if (Array.isArray(obra.projetos)) return obra;
            const detailResponse = await fetch(`/obras/${encodeURIComponent(obra.id)}`);
            return detailResponse.ok ? detailResponse.json() : obra;
        }));

        managedObrasElement.innerHTML = completeObras.map(renderObra).join('');
        bindToggles();
    } catch (error) {
        managedObrasElement.innerHTML = `<p class="management-status">Não foi possível carregar as obras.</p>`;
        console.error('[GERENCIAR OBRAS]', error);
    }
}

refreshButton?.addEventListener('click', loadObras);
loadObras();
