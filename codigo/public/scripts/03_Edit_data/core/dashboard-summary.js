import { showInfo, showWarning } from '../config/ui.js';

const dashboardState = {
    initialized: false
};

function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(Number(value || 0));
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function safeObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeDutos(dutos) {
    if (Array.isArray(dutos)) {
        return dutos;
    }

    if (dutos && typeof dutos === 'object' && Array.isArray(dutos.tipos)) {
        return dutos.tipos;
    }

    return [];
}

function hasEmpresaLogin(empresa) {
    const credenciais = safeObject(empresa?.credenciais);
    const usuario = String(credenciais.usuario || '').trim();
    const token = String(credenciais.token || '').trim();

    return Boolean(usuario && token);
}

function parseDate(value) {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getCredenciaisExpirationDate(credenciais) {
    const expirationDate = parseDate(
        credenciais.data_expiracao ||
        credenciais.expiracao ||
        credenciais.expiraEm ||
        credenciais.expiresAt ||
        credenciais.expiration
    );

    if (expirationDate) {
        return expirationDate;
    }

    const createdAt = parseDate(credenciais.data_criacao || credenciais.createdAt);
    const usageDays = Number(
        credenciais.tempoUso ||
        credenciais.validadeDias ||
        credenciais.validade ||
        0
    );

    if (!createdAt || !Number.isFinite(usageDays) || usageDays <= 0) {
        return null;
    }

    const calculatedExpiration = new Date(createdAt);
    calculatedExpiration.setDate(calculatedExpiration.getDate() + usageDays);
    return calculatedExpiration;
}

function hasEmpresaActiveLogin(empresa) {
    if (!hasEmpresaLogin(empresa)) {
        return false;
    }

    const credenciais = safeObject(empresa?.credenciais);
    const expirationDate = getCredenciaisExpirationDate(credenciais);

    if (!expirationDate) {
        return true;
    }

    return expirationDate.getTime() > Date.now();
}

function hasLoadedSystemData(data) {
    const safeData = safeObject(data);

    return (
        safeArray(safeData.empresas).length > 0 ||
        safeArray(safeData.machines).length > 0 ||
        normalizeDutos(safeData.dutos).length > 0 ||
        safeArray(safeData.tubos).length > 0 ||
        Object.keys(safeObject(safeData.banco_acessorios)).length > 0 ||
        Object.keys(safeObject(safeData.constants)).length > 0 ||
        Boolean(window.hasPendingChanges)
    );
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Falha em ${url}: ${response.status}`);
    }

    return response.json();
}

async function fetchDashboardData() {
    console.log(' Buscando dados para o dashboard...');

    const localSystemData = safeObject(window.systemData);
    let backupData = { obras: [] };
    let systemData = {};

    if (hasLoadedSystemData(localSystemData)) {
        systemData = localSystemData;
    } else {
        try {
            systemData = safeObject(await fetchJson('/api/system-data'));
        } catch (error) {
            console.warn('Erro ao buscar dados do sistema para o dashboard:', error);
            systemData = localSystemData;
        }
    }

    try {
        backupData = safeObject(await fetchJson('/api/backup-completo'));
    } catch (error) {
        console.warn('Erro ao buscar backup completo para o dashboard:', error);
    }

    const data = {
        empresas: safeArray(systemData.empresas),
        obras: safeArray(backupData.obras),
        maquinas: safeArray(systemData.machines),
        dutos: normalizeDutos(systemData.dutos),
        tubos: safeArray(systemData.tubos),
        acessorios: safeObject(systemData.banco_acessorios),
        constants: safeObject(systemData.constants)
    };

    console.log('✅ Dados do dashboard carregados:', {
        empresas: data.empresas.length,
        obras: data.obras.length,
        maquinas: data.maquinas.length,
        dutos: data.dutos.length,
        tubos: data.tubos.length,
        acessorios: Object.keys(data.acessorios).length
    });

    return data;
}

function processDashboardData(data) {
    return {
        totalEmpresas: data.empresas.length,
        empresasComLogin: data.empresas.filter(hasEmpresaActiveLogin).length,
        totalObras: data.obras.length,
        totalMaquinas: data.maquinas.length,
        totalDutos: data.dutos.length,
        totalAcessorios: Object.keys(data.acessorios).length,
        totalTubos: data.tubos.length,
        distribuicaoTipos: {
            labels: ['Maquinas', 'Acessorios', 'Dutos', 'Tubos'],
            data: [
                data.maquinas.length,
                Object.keys(data.acessorios).length,
                data.dutos.length,
                data.tubos.length
            ]
        }
    };
}

function renderKPIs(stats) {
    const kpis = [
        {
            label: 'Empresas',
            value: stats.totalEmpresas,
            color: '#4A5568',
            secondaryLabel: 'Com login ativo',
            secondaryValue: stats.empresasComLogin
        },
        { label: 'Obras', value: stats.totalObras, color: '#2B6CB0' },
        { label: 'Máquinas', value: stats.totalMaquinas, color: '#D69E2E' },
        { label: 'Dutos', value: stats.totalDutos, color: '#C53030' },
        { label: 'Acessórios', value: stats.totalAcessorios, color: '#805AD5' },
        { label: 'Tubos', value: stats.totalTubos, color: '#0F766E' }
    ];

    return kpis.map((kpi) => `
        <div class="dashboard-card" style="border-top: 4px solid ${kpi.color}">
            <div class="kpi-content">
                ${kpi.secondaryLabel ? `
                    <div class="kpi-split">
                        <div class="kpi-split-item">
                            <div class="kpi-label">${kpi.label}</div>
                            <div class="kpi-value">${formatNumber(kpi.value)}</div>
                        </div>
                        <div class="kpi-split-item kpi-split-item-secondary">
                            <div class="kpi-label">${kpi.secondaryLabel}</div>
                            <div class="kpi-value kpi-value-secondary">${formatNumber(kpi.secondaryValue)}</div>
                        </div>
                    </div>
                ` : `
                    <div class="kpi-label">${kpi.label}</div>
                    <div class="kpi-value">${formatNumber(kpi.value)}</div>
                `}
            </div>
        </div>
    `).join('');
}

function buildPieGradient(data, colors) {
    const total = data.reduce((sum, value) => sum + value, 0);

    if (total === 0) {
        return 'conic-gradient(#E2E8F0 0deg 360deg)';
    }

    let currentAngle = 0;
    const segments = [];

    data.forEach((value, index) => {
        if (value <= 0) {
            return;
        }

        const angle = (value / total) * 360;
        const nextAngle = currentAngle + angle;
        const color = colors[index % colors.length];

        segments.push(`${color} ${currentAngle}deg ${nextAngle}deg`);
        currentAngle = nextAngle;
    });

    if (segments.length === 0) {
        return 'conic-gradient(#E2E8F0 0deg 360deg)';
    }

    return `conic-gradient(${segments.join(', ')})`;
}

function renderPieChart(containerId, data, labels, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = data.reduce((sum, value) => sum + value, 0);

    if (total === 0) {
        container.innerHTML = `
            <div class="chart-header">
                <h4>${escapeHtml(title)}</h4>
            </div>
            <div class="empty-state">Sem dados disponiveis.</div>
        `;
        return;
    }

    const colors = ['#D69E2E', '#805AD5', '#C53030', '#0F766E'];
    const gradient = buildPieGradient(data, colors);

    const legend = data.map((value, index) => {
        if (value <= 0) {
            return '';
        }

        const percent = ((value / total) * 100).toFixed(1);

        return `
            <div class="pie-legend-item">
                <span class="pie-legend-color" style="background: ${colors[index % colors.length]}"></span>
                <span class="pie-legend-label">${escapeHtml(labels[index])}</span>
                <span class="pie-legend-value">${formatNumber(value)} (${percent}%)</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="chart-header">
            <h4>${escapeHtml(title)}</h4>
            <span class="chart-total">Total: ${formatNumber(total)} tipos</span>
        </div>
        <div class="pie-container">
            <div class="pie-chart-visual" style="background: ${gradient}">
                <div class="pie-center">${formatNumber(total)}</div>
            </div>
            <div class="pie-legend">${legend}</div>
        </div>
    `;
}

export async function renderDashboard() {
    const container = document.getElementById('dashboardContent');
    if (!container) return;

    container.innerHTML = '<div class="dashboard-loading">Carregando dados...</div>';

    try {
        const data = await fetchDashboardData();
        const stats = processDashboardData(data);

        container.innerHTML = `
            <div class="dashboard-kpis">
                ${renderKPIs(stats)}
            </div>

            <div class="dashboard-grid charts">
                <section class="chart-card">
                    <div class="chart-title-row">
                    </div>
                    <div id="distribuicaoChart" class="chart-frame chart-frame-pie"></div>
                </section>
            </div>
        `;

        renderPieChart(
            'distribuicaoChart',
            stats.distribuicaoTipos.data,
            stats.distribuicaoTipos.labels,
            'Distribuição dos Tipos Cadastrados'
        );
    } catch (error) {
        console.error('❌ Erro ao renderizar dashboard:', error);
        container.innerHTML = '<div class="empty-state">Nao foi possivel carregar o dashboard.</div>';
        showWarning('Erro ao carregar dados do dashboard');
    }
}

export function initializeDashboard() {
    console.log(' Inicializando dashboard...');

    renderDashboard();

    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            renderDashboard();
            showInfo('Dashboard atualizado');
        };
    }

    if (dashboardState.initialized) {
        return;
    }

    window.addEventListener('dataLoaded', renderDashboard);
    window.addEventListener('dataImported', renderDashboard);
    window.addEventListener('dataApplied', renderDashboard);

    dashboardState.initialized = true;
}
