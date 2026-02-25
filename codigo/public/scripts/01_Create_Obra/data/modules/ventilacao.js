/**
 * MÓDULO DE VENTILAÇÃO - INTEGRAÇÃO COM SISTEMA DE MÁQUINAS EXISTENTE
 * @module data/modules/ventilacao.js
 * 
 * CORRIGIDO: 
 * - Quantidade NUNCA reseta após edição manual
 * - Só recalcula se tipo/aplicação/capacidade mudarem
 */

// =============================================================================
// CONSTANTES E CONFIGURAÇÕES
// =============================================================================

// Mapeamento aplicação → texto legível
const APPLICATION_TEXT_MAP = {
    'pressurizacao': 'Pressurização',
    'exaustao_bateria': 'Exaustão da Sala de Bateria',
    'exaustao_baia_trafo': 'Exaustão da Baia de Trafo'
};

// Aplicações válidas que disparam cálculos
const VALID_APPLICATIONS = ['pressurizacao', 'exaustao_bateria', 'exaustao_baia_trafo'];

// Fatores de conversão
const FATOR_CONVERSAO_W_CAL = 859.85;
const FATOR_PRESSURIZACAO = 3.6;

// Store para controle por sala
const ventilationState = new Map();


// =============================================================================
// CONTROLE DE CARREGAMENTO - EVITA RECÁLCULOS DURANTE PREENCHIMENTO
// =============================================================================

// Flag global para indicar que está em processo de carregamento
window._isLoadingData = false;

// Contador para rastrear quantas salas estão sendo carregadas
window._loadingRooms = new Set();

/**
 * Inicia o modo de carregamento para uma sala específica
 * @param {string} roomId - ID da sala
 */
export function startRoomLoading(roomId) {
    if (!window._loadingRooms) window._loadingRooms = new Set();
    window._loadingRooms.add(roomId);
    window._isLoadingData = true;
    console.log(`🔄 [MODO CARREGAMENTO] Ativado para sala ${roomId}`);
}

/**
 * Finaliza o modo de carregamento para uma sala específica
 * @param {string} roomId - ID da sala
 * @param {boolean} triggerRefresh - Se deve disparar refresh após finalizar
 */
export function finishRoomLoading(roomId, triggerRefresh = true) {
    if (!window._loadingRooms) return;
    
    window._loadingRooms.delete(roomId);
    
    // Se não há mais salas carregando, desativa o flag global
    if (window._loadingRooms.size === 0) {
        window._isLoadingData = false;
        console.log('🔄 [MODO CARREGAMENTO] Finalizado - todas as salas carregadas');
    }
    
    // Dispara refresh se solicitado
    if (triggerRefresh && window.refreshVentilationForRoom) {
        setTimeout(() => {
            window.refreshVentilationForRoom(roomId);
        }, 12);
    }
}

/**
 * Verifica se está em modo de carregamento para uma sala
 * @param {string} roomId - ID da sala
 * @returns {boolean}
 */
export function isLoadingForRoom(roomId) {
    return window._isLoadingData === true || 
           (window._loadingRooms && window._loadingRooms.has(roomId));
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * OBTÉM CONSTANTES DO SISTEMA
 */
function getSystemConstants() {
    if (!window.systemConstants) {
        throw new Error('window.systemConstants não disponível');
    }

    const Densi_ar = window.systemConstants.Densi_ar?.value;
    const fatorEspecifico = window.systemConstants.fatorEspecifico?.value;

    if (!Densi_ar || typeof Densi_ar !== 'number') {
        throw new Error('Constante Densi_ar não encontrada');
    }
    if (!fatorEspecifico || typeof fatorEspecifico !== 'number') {
        throw new Error('Constante fatorEspecifico não encontrada');
    }

    return { Densi_ar, fatorEspecifico };
}

/**
 * EXTRAI VALOR NUMÉRICO DO SELECT DE CAPACIDADE
 */
export function extractCapacidadeValue(capacidadeValue) {
    if (!capacidadeValue) return null;
    const match = capacidadeValue.match(/^(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
}

/**
 * FORMATA NÚMERO PARA EXIBIÇÃO
 */
function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return '-';
    const formatted = value.toFixed(decimals).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
}

/**
 * COLETA INPUTS TÉCNICOS DA SALA
 */
function collectRoomInputs(roomId) {
    console.log(`📊 [collectRoomInputs] Coletando inputs para sala ${roomId}`);
    
    const inputs = {};
    
    // Busca pelos elementos específicos
    const vazaoArElement = document.getElementById(`vazao-ar-${roomId}`);
    const volumeElement = document.getElementById(`volume-${roomId}`);
    const potenciaElement = document.getElementById(`potencia-${roomId}`);
    const tempInternaElement = document.getElementById(`temp-interna-${roomId}`);
    const tempExternaElement = document.getElementById(`temp-externa-${roomId}`);
    
    // Para vazaoAr, pode ser um div com textContent ou um input
    if (vazaoArElement) {
        if (vazaoArElement.tagName === 'DIV' || vazaoArElement.classList.contains('result-value-inline')) {
            inputs.vazaoAr = parseFloat(vazaoArElement.textContent);
        } else if (vazaoArElement.tagName === 'INPUT') {
            inputs.vazaoAr = parseFloat(vazaoArElement.value);
        }
    } else {
        inputs.vazaoAr = null;
    }
    
    inputs.volume = volumeElement ? parseFloat(volumeElement.value) : null;
    inputs.potencia = potenciaElement ? parseFloat(potenciaElement.value) : null;
    inputs.tempInterna = tempInternaElement ? parseFloat(tempInternaElement.value) : 45;
    inputs.tempExterna = tempExternaElement ? parseFloat(tempExternaElement.value) : 35;
    
    return inputs;
}

// =============================================================================
// FUNÇÕES DE CÁLCULO
// =============================================================================

/**
 * CALCULA VAZÃO POR APLICAÇÃO
 */
function calculateVazaoByAplicacao(aplicacao, roomId, inputs) {
    switch (aplicacao) {
        case 'pressurizacao': {
            if (!inputs.vazaoAr || isNaN(inputs.vazaoAr)) {
                return null;
            }
            return inputs.vazaoAr * FATOR_PRESSURIZACAO;
        }
        
        case 'exaustao_bateria': {
            if (!inputs.volume || isNaN(inputs.volume)) {
                return null;
            }
            return inputs.volume * 12;
        }
        
        case 'exaustao_baia_trafo': {
            if (!inputs.potencia || isNaN(inputs.potencia)) {
                return null;
            }
            
            const deltaT = inputs.tempInterna - inputs.tempExterna;
            const deltaTAbs = Math.abs(deltaT);
            
            if (deltaTAbs === 0) {
                return null;
            }
            
            const constants = getSystemConstants();
            const Q = inputs.potencia * FATOR_CONVERSAO_W_CAL;
            const massaGR = Q / (constants.fatorEspecifico * deltaTAbs);
            const massaAr = massaGR / 1000;
            const vazao = massaAr / constants.Densi_ar;
            
            return deltaT < 0 ? -vazao : vazao;
        }
        
        default:
            return null;
    }
}

// =============================================================================
// ATUALIZAÇÃO DAS TABELAS
// =============================================================================

/**
 * ATUALIZA TABELA 1 - Cálculo Técnico
 */
function updateTechnicalTable(roomId, inputs) {
    const elements = {
        q: document.getElementById(`q-cal-${roomId}`),
        deltaT: document.getElementById(`delta-t-${roomId}`),
        massaGrama: document.getElementById(`massa-gramas-${roomId}`),
        massa: document.getElementById(`massa-ar-${roomId}`),
        vazao: document.getElementById(`vazao-${roomId}`)
    };
    
    // Se não tem potência, limpa resultados
    if (!inputs.potencia || isNaN(inputs.potencia)) {
        Object.values(elements).forEach(el => {
            if (el) {
                el.textContent = '-';
                el.classList.remove('negative');
            }
        });
        return;
    }
    
    const deltaT = inputs.tempInterna - inputs.tempExterna;
    const isDeltaTNegative = deltaT < 0;
    const deltaTAbs = Math.abs(deltaT);
    
    try {
        const constants = getSystemConstants();
        const Q = inputs.potencia * FATOR_CONVERSAO_W_CAL;
        
        let massaGR, massaAr, vazao;
        
        if (deltaTAbs > 0) {
            massaGR = Q / (constants.fatorEspecifico * deltaTAbs);
            massaAr = massaGR / 1000;
            vazao = massaAr / constants.Densi_ar;
            
            if (isDeltaTNegative) {
                massaGR = -massaGR;
                massaAr = -massaAr;
                vazao = -vazao;
            }
        } else {
            massaGR = 0;
            massaAr = 0;
            vazao = 0;
        }
        
        if (elements.q) {
            elements.q.textContent = formatNumber(Q);
            elements.q.classList.remove('negative');
        }
        
        if (elements.deltaT) {
            elements.deltaT.textContent = formatNumber(deltaT, 1);
            if (deltaT < 0) {
                elements.deltaT.classList.add('negative');
            } else {
                elements.deltaT.classList.remove('negative');
            }
        }
        
        if (elements.massaGrama) {
            elements.massaGrama.textContent = formatNumber(massaGR);
            if (massaGR < 0) {
                elements.massaGrama.classList.add('negative');
            } else {
                elements.massaGrama.classList.remove('negative');
            }
        }
        
        if (elements.massa) {
            elements.massa.textContent = formatNumber(massaAr);
            if (massaAr < 0) {
                elements.massa.classList.add('negative');
            } else {
                elements.massa.classList.remove('negative');
            }
        }
        
        if (elements.vazao) {
            elements.vazao.textContent = formatNumber(vazao);
            if (vazao < 0) {
                elements.vazao.classList.add('negative');
            } else {
                elements.vazao.classList.remove('negative');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar tabela técnica:', error);
    }
}

/**
 * ATUALIZA TABELA 2 - Solução das Máquinas
 */
function updateSolutionTable(roomId, inputs) {
    // 🚫 BLOQUEIA SE ESTIVER CARREGANDO
    if (window.isLoadingForRoom && window.isLoadingForRoom(roomId)) {
        console.log(`⏸️ [updateSolutionTable] Bloqueado - sala ${roomId} em carregamento`);
        return;
    }
    
    const machinesContainer = document.getElementById(`machines-${roomId}`);
    if (!machinesContainer) {
        setTimeout(() => updateSolutionTable(roomId, inputs), 500);
        return;
    }
    
    
    const tableBody = document.getElementById(`solucao-body-${roomId}`);
    if (!tableBody) return;
    
    const machines = machinesContainer.querySelectorAll('.climatization-machine');
    
    // Limpa tabela
    tableBody.innerHTML = '';
    
    let hasVentilationMachines = false;
    
    // Calcula a vazão necessária para a sala
    let vazaoNecessaria = null;
    let vazaoNecessariaAbs = null;
    
    // Pega a primeira máquina de ventilação para determinar a aplicação da sala
    for (const machine of machines) {
        const machineId = machine.dataset.machineId;
        const aplicacaoSelect = document.getElementById(`aplicacao-${machineId}`);
        if (!aplicacaoSelect) continue;
        
        const aplicacao = aplicacaoSelect.value;
        if (VALID_APPLICATIONS.includes(aplicacao)) {
            vazaoNecessaria = calculateVazaoByAplicacao(aplicacao, roomId, inputs);
            if (vazaoNecessaria !== null && !isNaN(vazaoNecessaria)) {
                vazaoNecessariaAbs = Math.abs(vazaoNecessaria);
            }
            break;
        }
    }
    
    // Itera sobre todas as máquinas
    machines.forEach(machine => {
        const machineId = machine.dataset.machineId;
        
        const titleInput = document.getElementById(`title-${machineId}`);
        const tipoSelect = document.getElementById(`tipo-${machineId}`);
        const aplicacaoSelect = document.getElementById(`aplicacao-${machineId}`);
        const capacidadeSelect = document.getElementById(`capacidade-${machineId}`);
        const qntInput = document.getElementById(`solution-${machineId}`);
        
        if (!titleInput || !tipoSelect || !aplicacaoSelect || !capacidadeSelect || !qntInput) return;
        
        const aplicacao = aplicacaoSelect.value;
        
        // Pula se for climatização ou aplicação vazia
        if (aplicacao === 'climatizacao' || !aplicacao) {
            return;
        }
        
        const aplicacaoTexto = APPLICATION_TEXT_MAP[aplicacao] || aplicacao;
        const titulo = titleInput.value || 'Máquina sem nome';
        const tipo = tipoSelect.options[tipoSelect.selectedIndex]?.text || 'Não definido';
        
        // Extrai capacidade
        const capacidadeValue = extractCapacidadeValue(capacidadeSelect.value);
        const capacidadeDisplay = capacidadeValue ? formatNumber(capacidadeValue) : '-';
        
        // Calcula vazão da máquina
        let vazaoMaquinaDisplay = '-';
        if (VALID_APPLICATIONS.includes(aplicacao)) {
            const vazaoMaquina = calculateVazaoByAplicacao(aplicacao, roomId, inputs);
            if (vazaoMaquina !== null && !isNaN(vazaoMaquina)) {
                vazaoMaquinaDisplay = formatNumber(Math.abs(vazaoMaquina));
            }
        }
        
        // 🔥 SISTEMA DE CONTROLE DE QUANTIDADE - CORRIGIDO
        // Inicializa os atributos se não existirem
        if (!qntInput.hasAttribute('data-user-edited')) {
            qntInput.setAttribute('data-user-edited', 'false');
        }
        if (!qntInput.hasAttribute('data-last-params')) {
            qntInput.setAttribute('data-last-params', '');
        }
        
        // 🔥 CALCULA A SOLUÇÃO (valor teórico)
        let solucaoNumerica = 1;
        if (
            capacidadeValue > 0 &&
            vazaoNecessariaAbs > 0 &&
            VALID_APPLICATIONS.includes(aplicacao)
        ){
            solucaoNumerica = Math.ceil(vazaoNecessariaAbs / capacidadeValue);
        }
        
        // Verifica se os parâmetros críticos mudaram
        const lastParams = qntInput.getAttribute('data-last-params') || '';
        
        // 🔥 IMPORTANTE: Inclui o tipo na chave de parâmetros
        // Porque se mudar de Tubo Axial para outro tipo, deve recalcular
        const currentParams = `${tipo}_${aplicacao}_${capacidadeValue}_${vazaoNecessariaAbs}`;
        
        const userEdited = qntInput.getAttribute('data-user-edited') === 'true';
        const paramsChanged = lastParams !== currentParams;
        
        console.log(`🔍 [Quantidade] machineId=${machineId}, userEdited=${userEdited}, paramsChanged=${paramsChanged}`);
        console.log(`   lastParams: ${lastParams}`);
        console.log(`   currentParams: ${currentParams}`);
        
        // 🔥 REGRA DE QUANTIDADE CORRIGIDA:
        // - Se NUNCA foi editado: usa solução
        // - Se JÁ foi editado: MANTÉM valor manual, mesmo se parâmetros mudaram
        // - Só recalcula se parâmetros mudaram E nunca foi editado
        
        if (!userEdited) {
            // Nunca foi editado - pode atualizar
            if (paramsChanged) {
                // Parâmetros mudaram - atualiza para nova solução
                qntInput.value = solucaoNumerica;
                qntInput.setAttribute('data-last-params', currentParams);
                
                console.log(`📊 [Ventilação] Parâmetros mudaram. Quantidade da máquina ${machineId} atualizada para ${solucaoNumerica}`);
                
                if (window.calculateMachinePrice) {
                    window.calculateMachinePrice(machineId);
                }
            } else {
                // Parâmetros iguais - verifica se precisa atualizar
                const currentValue = parseInt(qntInput.value) || 1;
                if (currentValue !== solucaoNumerica) {
                    qntInput.value = solucaoNumerica;
                    qntInput.setAttribute('data-last-params', currentParams);
                    
                    if (window.calculateMachinePrice) {
                        window.calculateMachinePrice(machineId);
                    }
                }
            }
        } else {
            // 🔥 JÁ FOI EDITADO - NUNCA RESETA!
            // Só atualiza os parâmetros salvos se mudaram, mas MANTÉM o valor manual
            if (paramsChanged) {
                // Atualiza os parâmetros salvos, mas NÃO altera o valor
                qntInput.setAttribute('data-last-params', currentParams);
                console.log(`📝 [Ventilação] Parâmetros mudaram, mas quantidade manual da máquina ${machineId} foi PRESERVADA: ${qntInput.value}`);
            }
        }
        
        // Obtém a quantidade ATUAL (pode ser automática ou manual)
        const quantidadeAtual = parseInt(qntInput.value) || 1;
        
        // 🔥 CALCULA PERDA E DISSIPAÇÃO com a quantidade ATUAL
        let perdaDisplay = '-';
        let dissipacaoDisplay = '-';
        let dissipacaoClass = '';
        
        if (capacidadeValue && vazaoNecessariaAbs) {
            // Perda = Capacidade * Quantidade ATUAL
            const perdaValue = capacidadeValue * quantidadeAtual;
            perdaDisplay = formatNumber(perdaValue);
            
            // Dissipação = Perda - Vazão Necessária
            const dissipacaoValue = perdaValue - vazaoNecessariaAbs;
            dissipacaoDisplay = formatNumber(dissipacaoValue);
            
            if (dissipacaoValue < 0) {
                dissipacaoClass = 'negative';
            } else if (dissipacaoValue > 0) {
                dissipacaoClass = 'positive';
            }
        }
        
        // Cria a linha da tabela
        const row = document.createElement('tr');
        row.dataset.machineId = machine.machineId;
        
        row.innerHTML = `
            <td><span id="solucao-title-${machine.machineId}" class="solution-title">${titulo}</span></td>
            <td><span id="solucao-tipo-${machine.machineId}" class="solution-type">${tipo}</span></td>
            <td><span id="solucao-aplicacao-${machine.machineId}" class="solution-application">${aplicacaoTexto}</span></td>
            <td><span id="solucao-capacidade-${machine.machineId}" class="solution-capacity">${capacidadeDisplay}</span></td>
            <td><span id="solucao-qtd-${machine.machineId}" class="solution-quantity">${solucaoNumerica}</span></td>
            <td><span id="solucao-vazao-${machine.machineId}" class="solution-flow">${vazaoMaquinaDisplay}</span></td>
            <td><span id="solucao-qtd-atual-${machine.machineId}" class="solution-current-quantity" style="font-weight: bold; color: #2563eb;">${quantidadeAtual}</span></td>
            <td><span id="solucao-perda-${machine.machineId}" class="solution-loss">${perdaDisplay}</span></td>
            <td><span id="solucao-dissipacao-${machine.machineId}" class="solution-balance ${dissipacaoClass}">${dissipacaoDisplay}</span></td>
        `;
        
        tableBody.appendChild(row);
        hasVentilationMachines = true;
    });
    
    // Mensagem se não há máquinas de ventilação
    if (!hasVentilationMachines) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="9" style="text-align: center; padding: 20px; color: var(--color-gray-500);">
                Nenhuma máquina com aplicação válida para ventilação
            </td>
        `;
        tableBody.appendChild(row);
    }
    
    if (window.updateAllMachinesTotal) {
        window.updateAllMachinesTotal(roomId);
    }
}

// =============================================================================
// HANDLER DE EDIÇÃO MANUAL
// =============================================================================

/**
 * Handler para quando o usuário edita manualmente a quantidade
 */
window.handleManualQuantityEdit = function(machineId) {
    const qntInput = document.getElementById(`solution-${machineId}`);
    const machine = document.getElementById(`tipo-${machineId}`)?.closest('.climatization-machine');
    const roomId = machine?.dataset.roomId;
    
    if (!qntInput) return;
    
    // 🚫 SE ESTIVER CARREGANDO, NÃO MARCA COMO EDIÇÃO MANUAL
    if (roomId && isLoadingForRoom(roomId)) {
        console.log(`⏸️ [VENTILAÇÃO] Edição manual ignorada - sala ${roomId} em carregamento`);
        return;
    }
    
    // Marca que o usuário editou manualmente
    qntInput.setAttribute('data-user-edited', 'true');
    
    // 🔥 SALVA OS PARÂMETROS ATUAIS PARA REFERÊNCIA FUTURA
    if (roomId) {
        const tipoSelect = document.getElementById(`tipo-${machineId}`);
        const aplicacaoSelect = document.getElementById(`aplicacao-${machineId}`);
        const capacidadeSelect = document.getElementById(`capacidade-${machineId}`);
        
        const tipo = tipoSelect?.value || '';
        const aplicacao = aplicacaoSelect?.value || '';
        const capacidadeValue = extractCapacidadeValue(capacidadeSelect?.value);
        
        // Calcula vazão necessária
        const inputs = collectRoomInputs(roomId);
        let vazaoNecessariaAbs = null;
        
        if (VALID_APPLICATIONS.includes(aplicacao)) {
            const vazaoNecessaria = calculateVazaoByAplicacao(aplicacao, roomId, inputs);
            if (vazaoNecessaria !== null && !isNaN(vazaoNecessaria)) {
                vazaoNecessariaAbs = Math.abs(vazaoNecessaria);
            }
        }
        
        const currentParams = `${tipo}_${aplicacao}_${capacidadeValue}_${vazaoNecessariaAbs}`;
        qntInput.setAttribute('data-last-params', currentParams);
    }
    
    console.log(`📝 [Ventilação] Usuário editou manualmente quantidade da máquina ${machineId} para ${qntInput.value}`);
    
    // Dispara o recalculo da ventilação para atualizar perda/dissipação
    if (roomId) {
        setTimeout(() => {
            refreshVentilationForRoom(roomId);
        }, 6);
    }
    
    if (window.calculateMachinePrice) {
        window.calculateMachinePrice(machineId);
    }
};

// =============================================================================
// CONFIGURAÇÃO DE LISTENERS
// =============================================================================

/**
 * Configura listener para input de quantidade
 */
function setupQuantityInputListener(machineId) {
    const qntInput = document.getElementById(`solution-${machineId}`);
    if (qntInput) {
        // Remove listener antigo
        if (qntInput._manualEditHandler) {
            qntInput.removeEventListener('change', qntInput._manualEditHandler);
            qntInput.removeEventListener('input', qntInput._manualEditHandler);
        }
        
        // Adiciona novo handler
        qntInput._manualEditHandler = function() {
            window.handleManualQuantityEdit(machineId);
        };
        
        qntInput.addEventListener('change', qntInput._manualEditHandler);
        qntInput.addEventListener('input', qntInput._manualEditHandler);
        
        // Inicializa os atributos
        if (!qntInput.hasAttribute('data-user-edited')) {
            qntInput.setAttribute('data-user-edited', 'false');
        }
        if (!qntInput.hasAttribute('data-last-params')) {
            qntInput.setAttribute('data-last-params', '');
        }
    }
}

/**
 * Configura listeners para inputs técnicos
 */
function setupTechnicalListeners(roomId) {
    const inputIds = [
        `potencia-${roomId}`,
        `temp-interna-${roomId}`,
        `temp-externa-${roomId}`,
        `vazao-ar-${roomId}`,
        `volume-${roomId}`
    ];
    
    inputIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element._ventListener) {
                element.removeEventListener('input', element._ventListener);
                element.removeEventListener('change', element._ventListener);
            }
            
            element._ventListener = () => refreshVentilationForRoom(roomId);
            element.addEventListener('input', element._ventListener);
            element.addEventListener('change', element._ventListener);
        }
    });
    
    // Configura listeners para inputs de quantidade
    const machines = document.querySelectorAll(`[data-room-id="${roomId}"]`);
    machines.forEach(container => {
        const machineId = container.dataset.machineId;
        if (machineId) {
            setupQuantityInputListener(machineId);
        }
    });
}

/**
 * Configura observer para novas máquinas
 */
function setupMachinesObserver(roomId) {
    if (ventilationState.get(roomId)?.observer) return;
    
    const observer = new MutationObserver((mutations) => {
        let shouldRefresh = false;
        
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                    shouldRefresh = true;
                    
                    // Configura listeners para novas máquinas
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                const newMachines = node.querySelectorAll('[data-machine-id]');
                                newMachines.forEach(machine => {
                                    const machineId = machine.dataset.machineId;
                                    if (machineId) {
                                        setupQuantityInputListener(machineId);
                                    }
                                });
                            }
                        });
                    }
                }
            }
            
            if (mutation.type === 'attributes') {
                const target = mutation.target;
                if (target.id?.startsWith('aplicacao-') || 
                    target.id?.startsWith('capacidade-') ||
                    target.id?.startsWith('tipo-')) {
                    shouldRefresh = true;
                }
            }
        });
        
        if (shouldRefresh) {
            refreshVentilationForRoom(roomId);
        }
    });
    
    const machinesContainer = document.getElementById(`machines-${roomId}`);
    if (machinesContainer) {
        observer.observe(machinesContainer, {
            childList: true,
            subtree: true,
            attributes: false
        });
        
        ventilationState.set(roomId, { observer });
    }
}

// =============================================================================
// FUNÇÃO PRINCIPAL DE REFRESH
// =============================================================================

window.refreshVentilationForRoom = function(roomId) {
    // 🚫 BLOQUEIA CÁLCULOS DURANTE CARREGAMENTO
    if (isLoadingForRoom(roomId)) {
        console.log(`⏸️ [VENTILAÇÃO] Cálculo bloqueado - sala ${roomId} em carregamento`);
        return;
    }
    
    if (!roomId || !roomId.includes('_proj_') || !roomId.includes('_sala_')) {
        return;
    }
    
    if (!window.systemConstants) {
        setTimeout(() => refreshVentilationForRoom(roomId), 62);
        return;
    }
    
    if (window[`_vent_frame_${roomId}`]) {
        cancelAnimationFrame(window[`_vent_frame_${roomId}`]);
    }
    
    window[`_vent_frame_${roomId}`] = requestAnimationFrame(() => {
        const inputs = collectRoomInputs(roomId);
        updateTechnicalTable(roomId, inputs);
        updateSolutionTable(roomId, inputs);
        delete window[`_vent_frame_${roomId}`];
    });
};

// =============================================================================
// HANDLERS DE EVENTOS (GLOBAIS)
// =============================================================================

window.handleVentilacaoAplicacaoChange = function(machineId) {
    const machine = document.getElementById(`tipo-${machineId}`)?.closest('.climatization-machine');
    const roomId = machine?.dataset.roomId;
    
    // 🚫 BLOQUEIA DURANTE CARREGAMENTO
    if (roomId && isLoadingForRoom(roomId)) {
        console.log(`⏸️ [VENTILAÇÃO] Aplicação alterada ignorada - sala ${roomId} em carregamento`);
        return;
    }
    
    const aplicacaoSelect = document.getElementById(`aplicacao-${machineId}`);
    const capacidadeSelect = document.getElementById(`capacidade-${machineId}`);
    
    if (!roomId) return;
    
    const aplicacao = aplicacaoSelect?.value;
    
    if (capacidadeSelect) {
        capacidadeSelect.disabled = !VALID_APPLICATIONS.includes(aplicacao);
        if (capacidadeSelect.disabled) {
            capacidadeSelect.value = '';
        }
    }
    
    refreshVentilationForRoom(roomId);
};

window.handleVentilacaoPowerChange = function(machineId) {
    const capacidadeSelect = document.getElementById(`capacidade-${machineId}`);
    const machine = capacidadeSelect?.closest('.climatization-machine');
    const roomId = machine?.dataset.roomId;
    
    // 🚫 BLOQUEIA DURANTE CARREGAMENTO
    if (roomId && isLoadingForRoom(roomId)) {
        console.log(`⏸️ [VENTILAÇÃO] Capacidade alterada ignorada - sala ${roomId} em carregamento`);
        return;
    }
    
    if (roomId) {
        refreshVentilationForRoom(roomId);
    }
};

window.handleVentilacaoTipoChange = function(machineId) {
    const tipoSelect = document.getElementById(`tipo-${machineId}`);
    const machine = tipoSelect?.closest('.climatization-machine');
    const roomId = machine?.dataset.roomId;
    
    // 🚫 BLOQUEIA DURANTE CARREGAMENTO
    if (roomId && isLoadingForRoom(roomId)) {
        console.log(`⏸️ [VENTILAÇÃO] Tipo alterado ignorado - sala ${roomId} em carregamento`);
        return;
    }
    
    if (roomId) {
        refreshVentilationForRoom(roomId);
    }
};

// =============================================================================
// CONFIGURAÇÃO INICIAL
// =============================================================================

function setupVentilationForRoom(roomId) {
    if (!roomId || !roomId.includes('_proj_') || !roomId.includes('_sala_')) {
        return;
    }
    
    if (ventilationState.get(roomId)?.configured) return;
    
    setupTechnicalListeners(roomId);
    
    const checkContainer = setInterval(() => {
        const container = document.getElementById(`machines-${roomId}`);
        if (container) {
            clearInterval(checkContainer);
            setupMachinesObserver(roomId);
            
            ventilationState.set(roomId, { 
                ...ventilationState.get(roomId),
                configured: true 
            });
            
            refreshVentilationForRoom(roomId);
        }
    }, 500);
    
    ventilationState.set(roomId, { 
        ...ventilationState.get(roomId),
        checkInterval: checkContainer 
    });
}


/**
 * PREENCHE OS INPUTS DE VENTILAÇÃO
 * Função para preencher os campos de ventilação com dados salvos
 * @param {HTMLElement} roomElement - Elemento da sala
 * @param {Object} ventilacaoData - Dados de ventilação { potencia, tempInterna, tempExterna }
 */
export function fillVentilacaoInputs(roomElement, ventilacaoData) {
    if (!roomElement || !ventilacaoData) {
        console.error('❌ Elemento da sala ou dados de ventilação inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    if (!roomId) {
        console.error('❌ Room ID não encontrado');
        return;
    }

    console.log(`🌬️ Preenchendo inputs de ventilação para sala ${roomId}`, ventilacaoData);

    // Mapeamento dos campos
    const fieldMappings = [
        { id: `potencia-${roomId}`, field: 'potencia' },
        { id: `temp-interna-${roomId}`, field: 'tempInterna' },
        { id: `temp-externa-${roomId}`, field: 'tempExterna' }
    ];

    // Preencher cada campo
    fieldMappings.forEach(mapping => {
        const element = document.getElementById(mapping.id);
        if (element && ventilacaoData[mapping.field] !== undefined) {
            const value = ventilacaoData[mapping.field];
            
            // Garantir que é número
            const numericValue = parseFloat(value);
            element.value = isNaN(numericValue) ? '' : numericValue;
            
            console.log(`  ✅ Campo ${mapping.field} = ${element.value}`);
            
            // Disparar evento change para ativar cálculos
            setTimeout(() => {
                const event = new Event('change', { bubbles: true });
                element.dispatchEvent(event);
            }, 50);
        }
    });
}

// Adicione ao objeto window para compatibilidade global
if (typeof window !== 'undefined') {
    window.fillVentilacaoInputs = fillVentilacaoInputs;
}


// =============================================================================
// FUNÇÃO PRINCIPAL EXPORTADA
// =============================================================================

export function buildVentilacaoSection(roomId) {
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`❌ buildVentilacaoSection: Room ID inválido`);
        return '';
    }
    
    if (!roomId.includes('_proj_') || !roomId.includes('_sala_')) {
        console.warn(`⚠️ ID não parece ser de sala: ${roomId}`);
        return '';
    }
    
    setTimeout(() => {
        setupVentilationForRoom(roomId);
    }, 12);
    
    return `
    <div class="section-block ventilation-section" id="ventilacao-section-${roomId}" data-room-id="${roomId}">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}ventilacao')">+</button>
        <h4 class="section-title">Ventilação</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}ventilacao">
        
        <!-- TABELA 1 - CÁLCULO TÉCNICO -->
        <div class="technical-table">
          <h5>Cálculo Técnico</h5>
          <div class="vertical-table-container">
            <table class="vertical-table">
              <tr>
                <td>Potência (kW)</td>
                <td>
                  <input type="number" 
                         id="potencia-${roomId}" 
                         class="vertical-input" 
                         step="any" 
                         placeholder="Ex: 100">
                </td>
              </tr>
              <tr>
                <td>Temp. Int. (°C)</td>
                <td>
                  <input type="number" 
                         id="temp-interna-${roomId}" 
                         class="vertical-input" 
                         step="any" 
                         value="45"
                         placeholder="°C">
                </td>
              </tr>
              <tr>
                <td>Temp. Ext. (°C)</td>
                <td>
                  <input type="number" 
                         id="temp-externa-${roomId}" 
                         class="vertical-input" 
                         step="any" 
                         value="35"
                         placeholder="°C">
                </td>
              </tr>
              <tr>
                <td>Q (cal/h)</td>
                <td><span id="q-cal-${roomId}" class="result-venti-value">-</span></td>
              </tr>
              <tr>
                <td>Massa (gramas)</td>
                <td><span id="massa-gramas-${roomId}" class="result-venti-value">-</span></td>
              </tr>
              <tr>
                <td>ΔT (°C)</td>
                <td><span id="delta-t-${roomId}" class="result-venti-value">-</span></td>
              </tr>
              <tr>
                <td>Massa de Ar (kg/h)</td>
                <td><span id="massa-ar-${roomId}" class="result-venti-value">-</span></td>
              </tr>
              <tr>
                <td>Vaz. Vol. (m³/h)</td>
                <td><span id="vazao-${roomId}" class="result-venti-value">-</span></td>
              </tr>
            </table>
          </div>
        </div>

        <!-- TABELA 2 - SOLUÇÃO DAS MÁQUINAS -->
        <div class="solution-table">
          <h5>Solução das Máquinas</h5>
          <div class="horizontal-table-container">
            <table class="machines-solution-table">
              <thead>
                <tr>
                  <th>Nome da Máquina</th>
                  <th>Tipo de Ventilador / Filtro</th>
                  <th>Aplicação</th>
                  <th>Cap. Unit. (m³/h)</th>
                  <th>Solução</th>
                  <th>Vazão (m³/h)</th>
                  <th>Qtd. Inst.</th>
                  <th>Cap. Total (m³/h)</th>
                  <th>Saldo (m³/h)</th>
                </tr>
              </thead>
              <tbody id="solucao-body-${roomId}">
                <tr>
                  <td colspan="9" style="text-align: center; padding: 20px; color: var(--color-gray-500);">
                    Aguardando máquinas...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}