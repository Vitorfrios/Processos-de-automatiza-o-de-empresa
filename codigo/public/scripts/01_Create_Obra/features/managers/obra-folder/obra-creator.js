import { getNextObraNumber } from '../../../data/utils/data-utils.js';
import { generateObraId } from '../../../data/utils/id-generator.js';

/**
 * 🏗️ FUNÇÕES DE CONSTRUÇÃO DE INTERFACE - FONTE ÚNICA
 */

function buildObraHTML(obraName, obraId, hasId = false, isFromServer = false) {
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        obraId = generateObraId();
    }

    // Determina texto do botão de empresa
    const buttonText = isFromServer ?
        "Visualizar campos de cadastro de empresas" :
        "Adicionar campos de cadastro de empresas";

    return `
    <div class="obra-block" data-obra-id="${obraId}" data-obra-name="${obraName}">
        <div class="obra-header">
            <button class="minimizer" onclick="toggleObra('${obraId}', event)">+</button>
            <h2 class="obra-title compact-title editable-title" data-editable="true" onclick="makeEditable(this, 'obra')">${obraName}</h2>
            <div class="obra-header-spacer"></div>
            <div class="obra-actions">
                <button class="btn btn-delete" onclick="window.deleteObra('${obraName}', '${obraId}')">Remover Obra</button>
            </div>
        </div>

        <div class="obra-content collapsed" id="obra-content-${obraId}">
            <div class="projetc-header-record very-dark">
                <button class="btn-empresa-cadastro" onclick="window.ativarCadastroEmpresa('${obraId}')">
                    ${buttonText}
                </button>
            </div>
            <div class="projects-container" id="projects-${obraId}">
                <!-- A mensagem será removida quando projetos forem adicionados -->
                <p class="empty-message">Nenhum projeto adicionado ainda. Adicione o primeiro projeto!</p>
            </div>
            
            <!-- Seção para adicionar projeto com total da obra -->
            <div class="add-project-section">
                <button class="btn btn-add-secondary" onclick="addNewProjectToObra('${obraId}')">+ Adicionar Projeto</button>
                
                <!-- Span com valor total da obra -->
                <span class="obra-total-value" id="total-obra-valor-${obraId}" 
                      data-obra-id="${obraId}" 
                      title="Valor total da obra (soma de todos os projetos)">
                    R$ 0,00
                </span>
            </div>
            
            ${buildObraActionsFooter(obraId, obraName, hasId)} 
        </div>
    </div>
    `;
}

function buildObraActionsFooter(obraId, _obraName, hasId = false) {
    console.log('=== DEBUG buildObraActionsFooter ===');
    console.log('obraId:', obraId);
    console.log('hasId:', hasId);
    console.log('typeof hasId:', typeof hasId);
    
    // Converter hasId para booleano de forma robusta
    const hasIdBool = Boolean(hasId) && 
                     hasId !== 'false' && 
                     hasId !== '0' && 
                     hasId !== '' && 
                     hasId !== null && 
                     hasId !== undefined;
    
    console.log('hasIdBool:', hasIdBool);
    console.log('buttonText:', hasIdBool ? "Atualizar Obra" : "Salvar Obra");
    
    const buttonText = hasIdBool ? "Atualizar Obra" : "Salvar Obra";
    const buttonClass = hasIdBool ? "btn-update" : "btn-save";

    const html = `
    <div class="obra-actions-footer">
        <button class="btn btn-verify" onclick="verifyObraData('${obraId}')">Verificar Dados</button>
        <button class="btn ${buttonClass}" onclick="event.preventDefault(); saveOrUpdateObra('${obraId}')">${buttonText}</button>
        ${hasIdBool ? `
        <button class="btn btn-download" onclick="downloadWord('${obraId}')" style="background-color: blue; color: white;">Baixar Word</button>
        ` : ''}
    </div>
    `;
    
    console.log('HTML gerado:', html);
    return html;
}

async function insertObraIntoDOM(obraHTML, obraId, hasProjects = false) {
    const projectsContainer = document.getElementById("projects-container");

    if (!projectsContainer) {
        const mainContent = document.querySelector('main, body');
        if (mainContent) {
            const newContainer = document.createElement('div');
            newContainer.id = 'projects-container';
            newContainer.innerHTML = '<!-- Hierarquia: Obra → Projeto → Sala -->';
            mainContent.appendChild(newContainer);
            return insertObraIntoDOM(obraHTML, obraId, hasProjects);
        }
        return false;
    }

    try {
        projectsContainer.insertAdjacentHTML("beforeend", obraHTML);

        setTimeout(() => {
            const obraInserida = document.querySelector(`[data-obra-id="${obraId}"]`);
            if (obraInserida) {
                // Remove mensagem se a obra já tem projetos
                if (hasProjects) {
                    const emptyMessage = obraInserida.querySelector('.empty-message');
                    if (emptyMessage) {
                        emptyMessage.remove();
                    }
                }

                // Inicializa o total da obra após inserção
                if (window.obraTotalManager && typeof window.obraTotalManager.initializeObraTotal === 'function') {
                    setTimeout(() => {
                        window.obraTotalManager.initializeObraTotal(obraId);
                    }, 300);
                }
            }
        }, 50);

        return true;
    } catch (error) {
        return false;
    }
}

async function createEmptyObra(obraName, obraId, isFromServer = false, hasProjects = false) {
    const finalObraId = obraId || generateObraId();
    const obraHTML = buildObraHTML(obraName, finalObraId, isFromServer, isFromServer);

    const inserted = await insertObraIntoDOM(obraHTML, finalObraId, hasProjects);

    if (inserted) {
        setTimeout(() => {
            const obraNoDOM = document.querySelector(`[data-obra-id="${finalObraId}"]`);
            if (obraNoDOM) {
                // Dispara evento para inicializar o total da obra
                document.dispatchEvent(new CustomEvent('obraCreated', {
                    detail: { obraId: finalObraId }
                }));

                // Se for do servidor, atualiza botão de empresa
                if (isFromServer && window.atualizarTextoBotaoEmpresa) {
                    window.atualizarTextoBotaoEmpresa(finalObraId, "Visualizar campos de cadastro de empresas");
                }
            }
        }, 100);
    }

    return inserted;
}

/**
 * 🚀 FUNÇÕES PRINCIPAIS DE GERENCIAMENTO
 */

async function addNewObra() {
    try {
        const obraNumber = getNextObraNumber();
        const obraName = `Obra${obraNumber}`;
        const obraId = generateObraId();

        await createEmptyObra(obraName, obraId, false, false);

        setTimeout(async () => {
            if (typeof window.addNewProjectToObra === 'function') {
                await window.addNewProjectToObra(obraId);
                
                // Atualiza o total da obra após criar projeto
                if (window.obraTotalManager && typeof window.obraTotalManager.updateObraTotal === 'function') {
                    setTimeout(() => {
                        window.obraTotalManager.updateObraTotal(obraId);
                    }, 500);
                }
            }
        }, 300);

    } catch (error) {
        alert("Erro ao criar nova obra.");
    }
}

// Função para criação de obra a partir de dados do servidor
async function createObraFromServer(obraData) {
    try {
        const obraName = obraData.nome;
        const obraId = obraData.id;

        await createEmptyObra(obraName, obraId, true);

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 🔥 SISTEMA DE GERENCIAMENTO DE TOTAL DA OBRA - VERSÃO CORRIGIDA
 */
class ObraTotalManager {
    constructor() {
        this.obraTotals = new Map();
        this.initialized = new Set();
        this.timeouts = {};
        this.setupObservers();
    }

    setupObservers() {
        // 1. Observador de mutação SIMPLIFICADO
        try {
            const mutationObserver = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                
                mutations.forEach((mutation) => {
                    // Verifica mudanças em texto
                    if (mutation.type === 'characterData') {
                        const target = mutation.target;
                        if (target.nodeType === Node.TEXT_NODE) {
                            const parent = target.parentElement;
                            if (parent && this.isValueElement(parent)) {
                                shouldUpdate = true;
                            }
                        }
                    }
                    
                    // Verifica adição/remoção de elementos
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Verifica se é elemento de valor
                                if (this.isValueElement(node)) {
                                    shouldUpdate = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldUpdate) {
                    this.scheduleFullUpdate();
                }
            });

            // Configuração CORRETA do MutationObserver
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: false  // Desabilitado para evitar erro
            });

            console.log('✅ MutationObserver configurado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao configurar MutationObserver:', error);
            // Fallback: usar polling
            this.startPollingFallback();
        }

        // 2. Observador de eventos de input
        document.addEventListener('input', (event) => {
            const target = event.target;
            if (target.type === 'number' || target.classList.contains('input-valor')) {
                this.scheduleFullUpdate();
            }
        });

        // 3. Observador de eventos customizados
        document.addEventListener('valorAtualizado', () => this.scheduleFullUpdate());
        document.addEventListener('projectTotalUpdated', (e) => {
            if (e.detail && e.detail.projectId) {
                this.updateObraFromProject(e.detail.projectId);
            }
        });

        // 4. Polling de segurança
        this.startSafetyPolling();
    }

    startPollingFallback() {
        // Polling mais agressivo se MutationObserver falhar
        console.log('🔄 Usando polling como fallback');
        setInterval(() => {
            this.scheduleFullUpdate();
        }, 1000);
    }

    isValueElement(element) {
        if (!element || !element.textContent) return false;
        
        const text = element.textContent.trim();
        const id = element.id || '';
        const className = element.className || '';
        
        // É elemento monetário?
        const isMonetary = text.includes('R$') || 
                          (text.match(/[\d.,]+\s*[Rr]\$?/) !== null);
        
        // É elemento de total?
        const isTotalElement = id.includes('total-') || 
                              id.includes('valor-') ||
                              id.includes('-total') ||
                              id.includes('-valor') ||
                              className.includes('total-value') ||
                              className.includes('valor-total') ||
                              className.includes('project-total') ||
                              className.includes('obra-total');
        
        return isMonetary || isTotalElement;
    }

    startSafetyPolling() {
        // Polling a cada 3 segundos para garantir
        setInterval(() => {
            this.updateAllObrasIfChanged();
        }, 3000);
    }

    scheduleFullUpdate() {
        // Atualiza todas as obras
        const obraBlocks = document.querySelectorAll('.obra-block');
        obraBlocks.forEach(obra => {
            const obraId = obra.dataset.obraId;
            if (obraId) this.scheduleObraUpdate(obraId);
        });
    }

    updateAllObrasIfChanged() {
        const obraBlocks = document.querySelectorAll('.obra-block');
        obraBlocks.forEach(obra => {
            const obraId = obra.dataset.obraId;
            if (obraId) {
                const currentTotal = this.calculateObraTotal(obraId);
                const lastTotal = this.obraTotals.get(obraId) || 0;
                
                if (Math.abs(currentTotal - lastTotal) > 0.01) {
                    this.updateObraTotal(obraId);
                }
            }
        });
    }

    updateObraFromProject(projectId) {
        const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
        if (projectElement) {
            const obraId = projectElement.dataset.obraId;
            if (obraId) {
                this.scheduleObraUpdate(obraId);
            }
        }
    }

    scheduleObraUpdate(obraId) {
        // Limpa timeout anterior
        if (this.timeouts[obraId]) {
            clearTimeout(this.timeouts[obraId]);
        }
        
        // Agenda nova atualização
        this.timeouts[obraId] = setTimeout(() => {
            this.updateObraTotal(obraId);
            delete this.timeouts[obraId];
        }, 300);
    }

    calculateObraTotal(obraId) {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) return 0;

        let total = 0;
        const projectElements = obraElement.querySelectorAll('.project-block');

        projectElements.forEach((project) => {
            const projectId = project.dataset.projectId;
            total += this.getProjectTotal(projectId);
        });

        return total;
    }

    getProjectTotal(projectId) {
        // Tenta múltiplas formas de encontrar o total
        let totalElement = null;
        
        // 1. ID exato
        totalElement = document.getElementById(`total-projeto-valor-${projectId}`);
        
        // 2. Dentro do projeto
        if (!totalElement) {
            const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
            if (projectElement) {
                totalElement = projectElement.querySelector('.project-total-value');
            }
        }

        if (totalElement) {
            const texto = totalElement.textContent || totalElement.innerText || '';
            return this.parseCurrency(texto);
        }

        return 0;
    }

    updateObraTotal(obraId) {
        const total = this.calculateObraTotal(obraId);
        const obraTotalElement = document.getElementById(`total-obra-valor-${obraId}`);

        // Salva o total anterior para comparação
        const lastTotal = this.obraTotals.get(obraId) || 0;
        
        // Se não mudou, não atualiza (evita flicker)
        if (Math.abs(total - lastTotal) < 0.01 && obraTotalElement && obraTotalElement.textContent !== 'R$ 0,00') {
            return;
        }

        this.obraTotals.set(obraId, total);

        if (obraTotalElement) {
            const formattedValue = this.formatCurrency(total);
            
            // Só atualiza se realmente mudou
            if (obraTotalElement.textContent !== formattedValue) {
                obraTotalElement.textContent = formattedValue;
                
                // Removidas as classes zero, has-value e high-value
                // Não adiciona nenhuma classe de estilo baseada no valor
            }
        } else {
            // Cria o elemento se não existir
            this.createObraTotalElement(obraId, total);
        }
    }

    createObraTotalElement(obraId, total = 0) {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) return;

        const addProjectSection = obraElement.querySelector('.add-project-section');
        if (addProjectSection) {
            const formattedValue = this.formatCurrency(total);
            
            // Removida a lógica de classes baseadas no valor
            const spanHTML = `<span class="obra-total-value" 
                  id="total-obra-valor-${obraId}" 
                  data-obra-id="${obraId}" 
                  title="Valor total da obra (soma de todos os projetos)">
                ${formattedValue}
            </span>`;
            
            addProjectSection.insertAdjacentHTML('beforeend', spanHTML);
        }
    }

    formatCurrency(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return 'R$ 0,00';
        }

        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    parseCurrency(text) {
        if (!text || typeof text !== 'string') return 0;

        // Limpa o texto
        let cleaned = text
            .replace(/R\$/g, '')
            .replace(/&nbsp;/g, '')
            .replace(/\s/g, '')
            .replace(/[^\d,.-]/g, '')
            .trim();

        if (!cleaned) return 0;

        // Detecta formato
        if (cleaned.includes('.') && cleaned.includes(',')) {
            // Formato brasileiro: 1.234.567,89
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (cleaned.includes(',')) {
            // Formato com vírgula decimal
            cleaned = cleaned.replace(',', '.');
        } else if (cleaned.includes('.')) {
            // Verifica se é separador de milhar
            const parts = cleaned.split('.');
            if (parts.length > 2) {
                // Múltiplos pontos = separadores de milhar
                cleaned = cleaned.replace(/\./g, '');
            }
        }

        const result = parseFloat(cleaned);
        return isNaN(result) ? 0 : result;
    }

    /**
     * Inicializa o total para uma obra específica
     */
    initializeObraTotal(obraId) {
        if (this.initialized.has(obraId)) {
            return;
        }

        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            return;
        }

        // Verifica se já tem o elemento de total
        let totalElement = document.getElementById(`total-obra-valor-${obraId}`);

        if (!totalElement) {
            this.createObraTotalElement(obraId);
        } else {
            // Se já existe, força atualização
            this.updateObraTotal(obraId);
        }

        this.initialized.add(obraId);
    }

    // Inicializa totais para obras existentes
    initializeExistingObraTotals() {
        const obraBlocks = document.querySelectorAll('.obra-block');

        obraBlocks.forEach((obra) => {
            const obraId = obra.dataset.obraId;
            if (obraId) {
                this.initializeObraTotal(obraId);
            }
        });

        // Atualização periódica
        setTimeout(() => this.updateAllObraTotals(), 2000);
    }

    updateAllObraTotals() {
        const obraBlocks = document.querySelectorAll('.obra-block');
        
        obraBlocks.forEach((obra) => {
            const obraId = obra.dataset.obraId;
            if (obraId) {
                this.updateObraTotal(obraId);
            }
        });
    }

    // 🔥 Função de correção manual
    forceUpdateObra(obraId) {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) return false;

        let total = 0;
        const projects = obraElement.querySelectorAll('.project-block');
        
        projects.forEach(project => {
            const projectId = project.dataset.projectId;
            const totalElement = document.getElementById(`total-projeto-valor-${projectId}`);
            
            if (totalElement) {
                const texto = totalElement.textContent;
                const valor = this.parseCurrency(texto);
                total += valor;
            }
        });

        // Atualiza ou cria o elemento
        let obraTotalElement = document.getElementById(`total-obra-valor-${obraId}`);
        const formatted = this.formatCurrency(total);
        
        if (obraTotalElement) {
            obraTotalElement.textContent = formatted;
            // Removida a lógica de classes baseadas no valor
            return true;
        } else {
            // Cria elemento sem classes de estilo baseadas no valor
            const addProjectSection = obraElement.querySelector('.add-project-section');
            if (addProjectSection) {
                addProjectSection.insertAdjacentHTML('beforeend', 
                    `<span class="obra-total-value" id="total-obra-valor-${obraId}" 
                          data-obra-id="${obraId}" title="Valor total da obra">
                        ${formatted}
                    </span>`);
                return true;
            }
        }
        
        return false;
    }
}

// Inicializa o gerenciador global
const obraTotalManager = new ObraTotalManager();

// ADICIONAR FUNÇÕES GLOBAIS
if (typeof window !== 'undefined') {
    window.obraTotalManager = obraTotalManager;

    window.updateObraTotal = (obraId) => {
        if (obraTotalManager) {
            obraTotalManager.updateObraTotal(obraId);
        }
    };

    window.forceUpdateObra = (obraId) => {
        if (obraTotalManager && obraTotalManager.forceUpdateObra) {
            return obraTotalManager.forceUpdateObra(obraId);
        }
        return false;
    };

    window.updateAllObraTotals = () => {
        if (obraTotalManager && obraTotalManager.updateAllObraTotals) {
            obraTotalManager.updateAllObraTotals();
        }
    };

    window.initializeAllObraTotals = () => {
        if (obraTotalManager && obraTotalManager.initializeExistingObraTotals) {
            obraTotalManager.initializeExistingObraTotals();
        }
    };
    
    // 🔥 Função de correção de emergência
    window.emergencyFixObra = (obraId) => {
        if (!obraId) {
            // Corrige todas as obras
            const obras = document.querySelectorAll('.obra-block');
            let corrigidas = 0;
            obras.forEach(obra => {
                const id = obra.dataset.obraId;
                if (id && window.forceUpdateObra(id)) {
                    corrigidas++;
                }
            });
            console.log(`✅ ${corrigidas} obras corrigidas`);
            return corrigidas;
        } else {
            // Corrige obra específica
            return window.forceUpdateObra(obraId);
        }
    };
}

// Inicialização automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.obraTotalManager) {
                window.obraTotalManager.initializeExistingObraTotals();
            }
        }, 1000);
    });
} else {
    setTimeout(() => {
        if (window.obraTotalManager) {
            window.obraTotalManager.initializeExistingObraTotals();
        }
    }, 1000);
}

// EXPORTS NO FINAL
export {
    buildObraHTML,
    buildObraActionsFooter,
    insertObraIntoDOM,
    createEmptyObra,
    addNewObra,
    createObraFromServer,
    obraTotalManager
};