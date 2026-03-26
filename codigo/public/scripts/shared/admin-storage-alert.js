const ADMIN_STORAGE_ALERT_ENDPOINT = "/api/system/database-size";
const ADMIN_STORAGE_ALERT_HOST_ID = "adminStorageAlertHost";
const ADMIN_STORAGE_ALERT_STYLE_ID = "adminStorageAlertStyles";
const STORAGE_MUTATION_PATH_PREFIXES = [
    "/obras",
    "/api/system-data/save",
    "/api/constants/save",
    "/api/materials/save",
    "/api/empresas/save",
    "/api/machines/save",
    "/api/machines/add",
    "/api/machines/update",
    "/api/machines/delete",
    "/api/acessorios/add",
    "/api/acessorios/update",
    "/api/acessorios/delete",
    "/api/dutos/add",
    "/api/dutos/update",
    "/api/dutos/delete",
    "/api/tubos/add",
    "/api/tubos/update",
    "/api/tubos/delete"
];

let adminStorageAlertRefreshTimeoutId = null;
let adminStorageAlertFetchInstalled = false;

function isAdminStorageAlertPage() {
    const pathname = String(window.location.pathname || "");
    const searchParams = new URLSearchParams(window.location.search || "");

    if (searchParams.get("embed") === "1") {
        return false;
    }

    return pathname === "/admin/data" || pathname === "/admin/obras/create";
}

function normalizeUsage(payload) {
    const usedMb = Number(payload?.used_mb || 0);
    const limitMb = Number(payload?.limit_mb || 500);
    const percentUsed = Number(payload?.percent_used || 0);

    return {
        used_mb: Number.isFinite(usedMb) ? usedMb : 0,
        limit_mb: Number.isFinite(limitMb) && limitMb > 0 ? limitMb : 500,
        percent_used: Number.isFinite(percentUsed) ? percentUsed : 0,
        public_schema_mb: Number.isFinite(Number(payload?.public_schema_mb))
            ? Number(payload?.public_schema_mb)
            : 0,
        active_app_mb: Number.isFinite(Number(payload?.active_app_mb))
            ? Number(payload?.active_app_mb)
            : 0,
        active_app_percent_of_limit: Number.isFinite(Number(payload?.active_app_percent_of_limit))
            ? Number(payload?.active_app_percent_of_limit)
            : 0,
        other_schemas_mb: Number.isFinite(Number(payload?.other_schemas_mb))
            ? Number(payload?.other_schemas_mb)
            : 0
    };
}

function formatMb(value) {
    const numericValue = Number(value || 0);
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: numericValue < 100 ? 2 : 1,
        maximumFractionDigits: numericValue < 100 ? 2 : 1
    }).format(numericValue);
}

function getUsageStatus(databaseUsage) {
    const percentUsed = Number(databaseUsage?.percent_used || 0);

    if (percentUsed >= 95) {
        return {
            level: "critical",
            title: "Memoria do banco quase cheia",
            subtitle: "O sistema está muito perto do limite configurado. Remova algumas obras e dados pesados agora.",
            color: "#c53030",
            accent: "#742a2a",
            background: "linear-gradient(135deg, rgba(197,48,48,0.14) 0%, rgba(159,18,57,0.2) 100%)",
            buttonLabel: "Revisar obras",
            buttonHref: "/admin/obras/create?filtro=1"
        };
    }

    if (percentUsed >= 80) {
        return {
            level: "warning",
            title: "Memoria do banco em alerta",
            subtitle: "O limite configurado está perto. Vale limpar obras antigas antes de travar o cadastro.",
            color: "#b7791f",
            accent: "#744210",
            background: "linear-gradient(135deg, rgba(214,158,46,0.14) 0%, rgba(183,121,31,0.18) 100%)",
            buttonLabel: "Abrir obras",
            buttonHref: "/admin/obras/create?filtro=1"
        };
    }

    return null;
}

function ensureStyles() {
    if (document.getElementById(ADMIN_STORAGE_ALERT_STYLE_ID)) {
        return;
    }

    const style = document.createElement("style");
    style.id = ADMIN_STORAGE_ALERT_STYLE_ID;
    style.textContent = `
        .admin-storage-alert-host {
            width: min(1180px, calc(100% - 32px));
            margin: 16px auto 0;
        }

        .admin-storage-alert {
            display: grid;
            gap: 12px;
            padding: 16px 18px;
            border-radius: 16px;
            border: 1px solid rgba(226, 232, 240, 0.9);
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
            backdrop-filter: blur(18px);
        }

        .admin-storage-alert-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
        }

        .admin-storage-alert-title {
            font-size: 1.08rem;
            font-weight: 700;
            color: #1a202c;
            margin: 0;
        }

        .admin-storage-alert-subtitle {
            margin: 4px 0 0;
            color: #4a5568;
            line-height: 1.45;
        }

        .admin-storage-alert-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            font-size: 0.82rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #fff;
            box-shadow: 0 10px 18px rgba(15, 23, 42, 0.12);
        }

        .admin-storage-alert-stats {
            display: grid;
            grid-template-columns: minmax(0, 1.5fr) minmax(180px, 0.7fr);
            gap: 18px;
            align-items: end;
        }

        .admin-storage-alert-usage {
            font-size: 1.5rem;
            font-weight: 800;
            color: #111827;
            letter-spacing: -0.02em;
        }

        .admin-storage-alert-meta {
            color: #4b5563;
            font-size: 0.94rem;
        }

        .admin-storage-alert-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .admin-storage-alert-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 40px;
            padding: 0 14px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        }

        .admin-storage-alert-btn:hover {
            transform: translateY(-1px);
            opacity: 0.96;
        }

        .admin-storage-alert-btn-primary {
            color: #fff;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
        }

        .admin-storage-alert-btn-secondary {
            background: rgba(255, 255, 255, 0.72);
            color: #1f2937;
            border: 1px solid rgba(148, 163, 184, 0.28);
        }

        .admin-storage-alert-progress {
            position: relative;
            height: 14px;
            border-radius: 999px;
            overflow: hidden;
            background: rgba(226, 232, 240, 0.95);
        }

        .admin-storage-alert-progress-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 0.35s ease;
        }

        @media (max-width: 720px) {
            .admin-storage-alert-host {
                width: calc(100% - 20px);
                margin-top: 12px;
            }

            .admin-storage-alert {
                padding: 14px;
            }

            .admin-storage-alert-stats {
                grid-template-columns: 1fr;
            }

            .admin-storage-alert-actions {
                justify-content: flex-start;
            }

            .admin-storage-alert-usage {
                font-size: 1.25rem;
            }
        }
    `;

    document.head.appendChild(style);
}

function ensureHost() {
    let host = document.getElementById(ADMIN_STORAGE_ALERT_HOST_ID);
    if (host) {
        return host;
    }

    host = document.createElement("div");
    host.id = ADMIN_STORAGE_ALERT_HOST_ID;
    host.className = "admin-storage-alert-host";

    const navbar = document.querySelector(".navbar");
    const main = document.querySelector("main");

    if (navbar?.parentNode) {
        navbar.parentNode.insertBefore(host, main || navbar.nextSibling);
        return host;
    }

    if (main?.parentNode) {
        main.parentNode.insertBefore(host, main);
        return host;
    }

    document.body.insertBefore(host, document.body.firstChild);
    return host;
}

function clearAlert() {
    const host = document.getElementById(ADMIN_STORAGE_ALERT_HOST_ID);
    if (host) {
        host.innerHTML = "";
    }
}

function renderAlert(databaseUsage) {
    const status = getUsageStatus(databaseUsage);
    const host = ensureHost();

    if (!status) {
        host.innerHTML = "";
        return;
    }

    const progressPercent = Math.max(0, Math.min(Number(databaseUsage.percent_used || 0), 100));
    const isCreatePage = window.location.pathname === "/admin/obras/create";
    const secondaryHref = isCreatePage ? "/admin/data" : "/admin/obras/create";
    const secondaryLabel = isCreatePage ? "Abrir editar dados" : "Abrir criar obras";

    host.innerHTML = `
        <section class="admin-storage-alert" style="background:${status.background};">
            <div class="admin-storage-alert-header">
                <div>
                    <p class="admin-storage-alert-title">${status.title}</p>
                    <p class="admin-storage-alert-subtitle">${status.subtitle}</p>
                </div>
                <span class="admin-storage-alert-badge" style="background:${status.color};">
                    ${status.level === "critical" ? "Critico" : "Alerta"} • ${formatMb(databaseUsage.percent_used)}%
                </span>
            </div>

            <div class="admin-storage-alert-stats">
                <div>
                    <div class="admin-storage-alert-usage">
                        ${formatMb(databaseUsage.used_mb)} MB / ${formatMb(databaseUsage.limit_mb)} MB
                    </div>

                    <div class="admin-storage-alert-meta" style="margin-top:4px;">
                        Dados ativos do app: <strong>${formatMb(databaseUsage.active_app_mb)} MB</strong>
                        (${formatMb(databaseUsage.active_app_percent_of_limit)}% do limite).
                    </div>
                    <div class="admin-storage-alert-meta" style="margin-top:4px;">
                        Tabelas do sistema em <code>public</code>: ${formatMb(databaseUsage.public_schema_mb)} MB.
                        Base do projeto, extensoes e schemas padrao: ${formatMb(databaseUsage.other_schemas_mb)} MB.
                    </div>
                </div>
                <div class="admin-storage-alert-actions">
                    <a class="admin-storage-alert-btn admin-storage-alert-btn-primary" href="${status.buttonHref}" style="background:${status.color};">
                        ${status.buttonLabel}
                    </a>
                    <a class="admin-storage-alert-btn admin-storage-alert-btn-secondary" href="${secondaryHref}">
                        ${secondaryLabel}
                    </a>
                </div>
            </div>

            <div class="admin-storage-alert-progress" aria-label="Uso atual do banco">
                <div class="admin-storage-alert-progress-fill" style="width:${progressPercent}%; background:linear-gradient(90deg, ${status.accent} 0%, ${status.color} 100%);"></div>
            </div>
        </section>
    `;
}

async function fetchDatabaseUsage() {
    const cacheBuster = `t=${Date.now()}`;
    const separator = ADMIN_STORAGE_ALERT_ENDPOINT.includes("?") ? "&" : "?";
    const response = await fetch(`${ADMIN_STORAGE_ALERT_ENDPOINT}${separator}${cacheBuster}`, {
        cache: "no-store",
        headers: {
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Falha ao carregar uso do banco: ${response.status}`);
    }

    return normalizeUsage(await response.json());
}

async function refreshAdminStorageAlert() {
    if (!isAdminStorageAlertPage()) {
        clearAlert();
        return;
    }

    try {
        const databaseUsage = await fetchDatabaseUsage();
        renderAlert(databaseUsage);
    } catch (error) {
        console.warn("[storage-alert] erro ao atualizar aviso de armazenamento:", error);
        clearAlert();
    }
}

function scheduleAdminStorageAlertRefresh(delayMs = 180) {
    if (!isAdminStorageAlertPage()) {
        return;
    }

    if (adminStorageAlertRefreshTimeoutId) {
        window.clearTimeout(adminStorageAlertRefreshTimeoutId);
    }

    adminStorageAlertRefreshTimeoutId = window.setTimeout(() => {
        adminStorageAlertRefreshTimeoutId = null;
        refreshAdminStorageAlert();
    }, delayMs);
}

function shouldRefreshFromMutation(method, pathname) {
    const normalizedMethod = String(method || "GET").toUpperCase();
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(normalizedMethod)) {
        return false;
    }

    return STORAGE_MUTATION_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function installStorageMutationListeners() {
    if (adminStorageAlertFetchInstalled || typeof window.fetch !== "function") {
        return;
    }

    const originalFetch = window.fetch.bind(window);
    window.fetch = async function(input, init) {
        const requestUrl = typeof input === "string" ? input : input?.url || "";
        const requestMethod = init?.method || (typeof input !== "string" ? input?.method : "") || "GET";
        const response = await originalFetch(input, init);

        try {
            const pathname = new URL(requestUrl, window.location.origin).pathname;
            if (response.ok && shouldRefreshFromMutation(requestMethod, pathname)) {
                scheduleAdminStorageAlertRefresh();
            }
        } catch (error) {
            console.warn("[storage-alert] falha ao analisar mutacao de armazenamento:", error);
        }

        return response;
    };

    adminStorageAlertFetchInstalled = true;
    window.addEventListener("dataApplied", () => scheduleAdminStorageAlertRefresh(), { passive: true });
}

function startAdminStorageAlert() {
    if (!isAdminStorageAlertPage()) {
        return;
    }

    ensureStyles();
    installStorageMutationListeners();
    refreshAdminStorageAlert();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAdminStorageAlert, { once: true });
} else {
    startAdminStorageAlert();
}
