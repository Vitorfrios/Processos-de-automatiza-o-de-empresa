/**
 * MÓDULO DE VENTILAÇÃO - INTEGRAÇÃO COM SISTEMA DE MÁQUINAS EXISTENTE
 * @module data/modules/ventilacao.js
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
function extractCapacidadeValue(capacidadeValue) {
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
    
    console.log(`   - Elemento vazao-ar-${roomId}:`, vazaoArElement ? 'Encontrado' : 'NÃO ENCONTRADO');
    console.log(`   - Elemento volume-${roomId}:`, volumeElement ? 'Encontrado' : 'NÃO ENCONTRADO');
    console.log(`   - Elemento potencia-${roomId}:`, potenciaElement ? 'Encontrado' : 'NÃO ENCONTRADO');
    
    // Para vazaoAr, pode ser um div com textContent ou um input
    if (vazaoArElement) {
        if (vazaoArElement.tagName === 'DIV' || vazaoArElement.classList.contains('result-value-inline')) {
            inputs.vazaoAr = parseFloat(vazaoArElement.textContent);
            console.log(`   - vazaoAr (de div.textContent) = ${vazaoArElement.textContent} → ${inputs.vazaoAr}`);
        } else if (vazaoArElement.tagName === 'INPUT') {
            inputs.vazaoAr = parseFloat(vazaoArElement.value);
            console.log(`   - vazaoAr (de input.value) = ${vazaoArElement.value} → ${inputs.vazaoAr}`);
        }
    } else {
        inputs.vazaoAr = null;
        console.log(`   - vazaoAr = null (elemento não encontrado)`);
    }
    
    inputs.volume = volumeElement ? parseFloat(volumeElement.value) : null;
    inputs.potencia = potenciaElement ? parseFloat(potenciaElement.value) : null;
    inputs.tempInterna = tempInternaElement ? parseFloat(tempInternaElement.value) : 45;
    inputs.tempExterna = tempExternaElement ? parseFloat(tempExternaElement.value) : 35;
    
    console.log(`   - volume = ${inputs.volume}`);
    console.log(`   - potencia = ${inputs.potencia}`);
    console.log(`   - tempInterna = ${inputs.tempInterna}`);
    console.log(`   - tempExterna = ${inputs.tempExterna}`);
    
    console.log(`📦 [collectRoomInputs] Inputs coletados:`, inputs);
    
    return inputs;
}

// =============================================================================
// FUNÇÕES DE CÁLCULO
// =============================================================================

/**
 * CALCULA VAZÃO POR APLICAÇÃO
 */
function calculateVazaoByAplicacao(aplicacao, roomId, inputs) {
    console.log(`🔢 [calculateVazaoByAplicacao] Iniciando cálculo para:`);
    console.log(`   - Aplicação: ${aplicacao}`);
    console.log(`   - RoomId: ${roomId}`);
    console.log(`   - Inputs recebidos:`, JSON.stringify(inputs, null, 2));
    
    switch (aplicacao) {
        case 'pressurizacao': {
            console.log(`📊 [PRESSURIZAÇÃO] Verificando inputs.vazaoAr:`);
            console.log(`   - inputs.vazaoAr = ${inputs.vazaoAr} (tipo: ${typeof inputs.vazaoAr})`);
            console.log(`   - isNaN(inputs.vazaoAr) = ${isNaN(inputs.vazaoAr)}`);
            
            if (!inputs.vazaoAr || isNaN(inputs.vazaoAr)) {
                console.warn(`⚠️ [PRESSURIZAÇÃO] Vazão de ar inválida ou não disponível`);
                console.warn(`   - Valor: ${inputs.vazaoAr}`);
                console.warn(`   - Elemento vazao-ar-${roomId} existe?`, 
                    document.getElementById(`vazao-ar-${roomId}`) ? 'Sim' : 'Não');
                return null;
            }
            
            const resultado = inputs.vazaoAr * FATOR_PRESSURIZACAO;
            console.log(`✅ [PRESSURIZAÇÃO] Cálculo realizado:`);
            console.log(`   - inputs.vazaoAr = ${inputs.vazaoAr}`);
            console.log(`   - FATOR_PRESSURIZACAO = ${FATOR_PRESSURIZACAO}`);
            console.log(`   - RESULTADO = ${resultado} m³/h`);
            return resultado;
        }
        
        case 'exaustao_bateria': {
            console.log(`📊 [EXAUSTÃO BATERIA] Verificando inputs.volume:`);
            console.log(`   - inputs.volume = ${inputs.volume} (tipo: ${typeof inputs.volume})`);
            console.log(`   - isNaN(inputs.volume) = ${isNaN(inputs.volume)}`);
            
            if (!inputs.volume || isNaN(inputs.volume)) {
                console.warn(`⚠️ [EXAUSTÃO BATERIA] Volume inválido ou não disponível`);
                console.warn(`   - Valor: ${inputs.volume}`);
                console.warn(`   - Elemento volume-${roomId} existe?`, 
                    document.getElementById(`volume-${roomId}`) ? 'Sim' : 'Não');
                return null;
            }
            
            const resultado = inputs.volume * 12;
            console.log(`✅ [EXAUSTÃO BATERIA] Cálculo realizado:`);
            console.log(`   - inputs.volume = ${inputs.volume}`);
            console.log(`   - RESULTADO = ${resultado} m³/h`);
            return resultado;
        }
        
        case 'exaustao_baia_trafo': {
            console.log(`📊 [EXAUSTÃO TRAFO] Verificando inputs:`);
            console.log(`   - inputs.potencia = ${inputs.potencia} (tipo: ${typeof inputs.potencia})`);
            console.log(`   - inputs.tempInterna = ${inputs.tempInterna}`);
            console.log(`   - inputs.tempExterna = ${inputs.tempExterna}`);
            
            if (!inputs.potencia || isNaN(inputs.potencia)) {
                console.warn(`⚠️ [EXAUSTÃO TRAFO] Potência inválida ou não disponível`);
                console.warn(`   - Valor: ${inputs.potencia}`);
                console.warn(`   - Elemento potencia-${roomId} existe?`, 
                    document.getElementById(`potencia-${roomId}`) ? 'Sim' : 'Não');
                return null;
            }
            
            const deltaT = inputs.tempInterna - inputs.tempExterna;
            const deltaTAbs = Math.abs(deltaT);
            
            console.log(`   - deltaT calculado = ${deltaT}`);
            console.log(`   - deltaTAbs = ${deltaTAbs}`);
            
            if (deltaTAbs === 0) {
                console.warn(`⚠️ [EXAUSTÃO TRAFO] Delta T é zero, não é possível calcular`);
                return null;
            }
            
            const constants = getSystemConstants();
            console.log(`   - Constantes obtidas:`, constants);
            
            if (!constants) {
                console.error(`❌ [EXAUSTÃO TRAFO] Não foi possível obter constantes do sistema`);
                return null;
            }
            
            const Q = inputs.potencia * FATOR_CONVERSAO_W_CAL;
            console.log(`   - Q (cal/h) = ${inputs.potencia} * ${FATOR_CONVERSAO_W_CAL} = ${Q}`);
            
            const massaGR = Q / (constants.fatorEspecifico * deltaTAbs);
            console.log(`   - massaGR = ${Q} / (${constants.fatorEspecifico} * ${deltaTAbs}) = ${massaGR} g/h`);
            
            const massaAr = massaGR / 1000;
            console.log(`   - massaAr = ${massaGR} / 1000 = ${massaAr} kg/h`);
            
            const vazao = massaAr / constants.Densi_ar;
            console.log(`   - vazao = ${massaAr} / ${constants.Densi_ar} = ${vazao} m³/h`);
            
            const resultado = deltaT < 0 ? -vazao : vazao;
            console.log(`✅ [EXAUSTÃO TRAFO] Resultado final:`);
            console.log(`   - deltaT < 0? ${deltaT < 0}`);
            console.log(`   - RESULTADO = ${resultado} m³/h`);
            
            return resultado;
        }
        
        default:
            console.warn(`⚠️ [calculateVazaoByAplicacao] Aplicação desconhecida: ${aplicacao}`);
            return null;
    }
}

// =============================================================================
// ATUALIZAÇÃO DAS TABELAS
// =============================================================================

/**
 * ATUALIZA TABELA 1 - Cálculo Técnico
 */
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
                el.classList.remove('negative'); // Remove classe negativa se existir
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
        
        // Atualiza Q (cal/h) - sempre positivo
        if (elements.q) {
            elements.q.textContent = formatNumber(Q);
            elements.q.classList.remove('negative');
        }
        
        // Atualiza ΔT com classe negativa se necessário
        if (elements.deltaT) {
            elements.deltaT.textContent = formatNumber(deltaT, 1);
            if (deltaT < 0) {
                elements.deltaT.classList.add('negative');
            } else {
                elements.deltaT.classList.remove('negative');
            }
        }
        
        // Atualiza Massa (gramas) com classe negativa se necessário
        if (elements.massaGrama) {
            elements.massaGrama.textContent = formatNumber(massaGR);
            if (massaGR < 0) {
                elements.massaGrama.classList.add('negative');
            } else {
                elements.massaGrama.classList.remove('negative');
            }
        }
        
        // Atualiza Massa de Ar (kg/h) com classe negativa se necessário
        if (elements.massa) {
            elements.massa.textContent = formatNumber(massaAr);
            if (massaAr < 0) {
                elements.massa.classList.add('negative');
            } else {
                elements.massa.classList.remove('negative');
            }
        }
        
        // Atualiza Vazão (m³/h) com classe negativa se necessário
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
    const machinesContainer = document.getElementById(`machines-${roomId}`);
    if (!machinesContainer) {
        // Agenda retry se container não existir
        setTimeout(() => updateSolutionTable(roomId, inputs), 500);
        return;
    }
    
    const tableBody = document.getElementById(`solucao-body-${roomId}`);
    if (!tableBody) return;
    
    const machines = machinesContainer.querySelectorAll('.climatization-machine');
    
    // Limpa tabela
    tableBody.innerHTML = '';
    
    let hasVentilationMachines = false;
    
    // 🔥 PRIMEIRO: Calcula a vazão necessária para a sala (independente das máquinas)
    let vazaoNecessaria = null;
    let vazaoNecessariaAbs = null;
    let aplicacaoSala = null;
    
    // Pega a primeira máquina de ventilação para determinar a aplicação da sala
    // (assumimos que todas as máquinas na sala têm a mesma aplicação de ventilação)
    for (const machine of machines) {
        const machineId = machine.dataset.machineId;
        const aplicacaoSelect = document.getElementById(`aplicacao-${machineId}`);
        if (!aplicacaoSelect) continue;
        
        const aplicacao = aplicacaoSelect.value;
        if (VALID_APPLICATIONS.includes(aplicacao)) {
            aplicacaoSala = aplicacao;
            vazaoNecessaria = calculateVazaoByAplicacao(aplicacao, roomId, inputs);
            if (vazaoNecessaria !== null && !isNaN(vazaoNecessaria)) {
                vazaoNecessariaAbs = Math.abs(vazaoNecessaria);
            }
            break;
        }
    }
    
    // Formata a vazão necessária para exibição (usada como referência)
    const vazaoNecessariaDisplay = vazaoNecessariaAbs ? formatNumber(vazaoNecessariaAbs) : '-';
    
    // Itera sobre TODAS as máquinas
    machines.forEach(machine => {
        const machineId = machine.dataset.machineId;
        
        const titleInput = document.getElementById(`title-${machineId}`);
        const tipoSelect = document.getElementById(`tipo-${machineId}`);
        const aplicacaoSelect = document.getElementById(`aplicacao-${machineId}`);
        const capacidadeSelect = document.getElementById(`capacidade-${machineId}`);
        const qntInput = document.getElementById(`solution-${machineId}`); // Input de quantidade da máquina
        
        if (!titleInput || !tipoSelect || !aplicacaoSelect || !capacidadeSelect || !qntInput) return;
        
        const aplicacao = aplicacaoSelect.value;
        
        // 🚫 SE FOR CLIMATIZAÇÃO OU APLICAÇÃO VAZIA, PULA COMPLETAMENTE (NÃO MOSTRA NA TABELA)
        if (aplicacao === 'climatizacao' || !aplicacao) {
            return;
        }
        
        const aplicacaoTexto = APPLICATION_TEXT_MAP[aplicacao] || aplicacao || 'Não definido';
        const titulo = titleInput.value || 'Máquina sem nome';
        const tipo = tipoSelect.options[tipoSelect.selectedIndex]?.text || 'Não definido';
        
        // Extrai capacidade se existir
        const capacidadeValue = extractCapacidadeValue(capacidadeSelect.value);
        const capacidadeDisplay = capacidadeValue ? formatNumber(capacidadeValue) : '-';
        
        // 🔥 CÁLCULOS SEPARADOS:
        // 1. VAZÃO: depende apenas da aplicação e inputs (independente da capacidade)
        // 2. SOLUÇÃO/PERDA/DISSIPAÇÃO: dependem da capacidade selecionada
        
        // Sempre calcula a vazão para esta máquina (baseado na aplicação)
        // Só calcula se for uma aplicação válida
        let vazaoMaquinaAbs = null;
        let vazaoMaquinaDisplay = '-';
        
        if (VALID_APPLICATIONS.includes(aplicacao)) {
            const vazaoMaquina = calculateVazaoByAplicacao(aplicacao, roomId, inputs);
            if (vazaoMaquina !== null && !isNaN(vazaoMaquina)) {
                vazaoMaquinaAbs = Math.abs(vazaoMaquina);
                vazaoMaquinaDisplay = formatNumber(vazaoMaquinaAbs);
            }
        }
        
        // Variáveis para solução, perda e dissipação (dependem da capacidade)
        let solucaoValue = '-';
        let perdaDisplay = '-';
        let dissipacaoDisplay = '-';
        
        // Só calcula solução/perda/dissipação se tiver capacidade E vazão necessária
        if (capacidadeValue && vazaoNecessariaAbs) {
            // Solução = Vazão Necessária / Capacidade (arredondado para cima)
            solucaoValue = Math.ceil(vazaoNecessariaAbs / capacidadeValue);
            
            // Perda = Capacidade * Quantidade
            const perdaValue = capacidadeValue * solucaoValue;
            perdaDisplay = formatNumber(perdaValue);
            
            // Dissipação = Perda - Vazão Necessária
            const dissipacaoValue = perdaValue - vazaoNecessariaAbs;
            dissipacaoDisplay = formatNumber(dissipacaoValue);
            
            // 🔥 ATUALIZA O CAMPO QUANTIDADE DA MÁQUINA COM O VALOR DA SOLUÇÃO
            if (qntInput) {
                const currentValue = parseInt(qntInput.value) || 1;
                if (currentValue !== solucaoValue) {
                    qntInput.value = solucaoValue;
                    
                    if (window.calculateMachinePrice) {
                        window.calculateMachinePrice(machineId);
                    }
                    
                    console.log(`📊 [Ventilação] Quantidade da máquina ${machineId} atualizada para ${solucaoValue} (solução calculada)`);
                }
            }
        }
        
        // ✅ MOSTRA APENAS MÁQUINAS DE VENTILAÇÃO
        const row = document.createElement('tr');
        row.dataset.machineId = machine.machineId;
        
        // Calcula se dissipação é negativa (se tivermos o valor)
        let dissipacaoClass = '';
        if (dissipacaoDisplay !== '-') {
            // Converte de volta para número (considerando formato brasileiro)
            const dissipacaoNum = parseFloat(dissipacaoDisplay.replace(/\./g, '').replace(',', '.'));
            if (dissipacaoNum < 0) {
                dissipacaoClass = 'class="negative"';
            }
        }
        
        row.innerHTML = `
            <td><span id="solucao-title-${machine.machineId}" class="solution-title">${titulo}</span></td>
            <td><span id="solucao-tipo-${machine.machineId}" class="solution-type">${tipo}</span></td>
            <td><span id="solucao-aplicacao-${machine.machineId}" class="solution-application">${aplicacaoTexto}</span></td>
            <td><span id="solucao-capacidade-${machine.machineId}" class="solution-capacity">${capacidadeDisplay}</span></td>
            <td><span id="solucao-qtd-${machine.machineId}" class="solution-quantity">${solucaoValue}</span></td>
            <td><span id="solucao-vazao-${machine.machineId}" class="solution-flow">${vazaoMaquinaDisplay}</span></td>
            <td><span id="solucao-perda-${machine.machineId}" class="solution-loss">${perdaDisplay}</span></td>
            <td><span id="solucao-dissipacao-${machine.machineId}" class="solution-dissipation" ${dissipacaoClass}>${dissipacaoDisplay}</span></td>
        `;
        
        tableBody.appendChild(row);
        hasVentilationMachines = true;
    });
    
    // Se não há nenhuma máquina de ventilação, mostra mensagem
    if (!hasVentilationMachines) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 20px; color: var(--color-gray-500);">
                Nenhuma máquina com aplicação válida para ventilação
            </td>
        `;
        tableBody.appendChild(row);
    }
    
    // 🔥 Atualiza o total de todas as máquinas após as mudanças nas quantidades
    if (window.updateAllMachinesTotal) {
        window.updateAllMachinesTotal(roomId);
    }
}

// =============================================================================
// HANDLERS DE EVENTOS (GLOBAIS)
// =============================================================================

/**
 * Handler para mudança na aplicação
 */
window.handleVentilacaoAplicacaoChange = function(machineId) {
    const aplicacaoSelect = document.getElementById(`aplicacao-${machineId}`);
    const capacidadeSelect = document.getElementById(`capacidade-${machineId}`);
    const machine = document.getElementById(`tipo-${machineId}`)?.closest('.climatization-machine');
    const roomId = machine?.dataset.roomId;
    
    if (!roomId) return;
    
    const aplicacao = aplicacaoSelect?.value;
    
    // Habilita/desabilita select de capacidade baseado na aplicação
    if (capacidadeSelect) {
        capacidadeSelect.disabled = !VALID_APPLICATIONS.includes(aplicacao);
        if (capacidadeSelect.disabled) {
            capacidadeSelect.value = '';
        }
    }
    
    // Atualiza ventilação
    refreshVentilationForRoom(roomId);
};

/**
 * Handler para mudança na capacidade
 */
window.handleVentilacaoPowerChange = function(machineId) {
    const capacidadeSelect = document.getElementById(`capacidade-${machineId}`);
    const machine = capacidadeSelect?.closest('.climatization-machine');
    const roomId = machine?.dataset.roomId;
    
    if (roomId) {
        refreshVentilationForRoom(roomId);
    }
};

/**
 * Handler para mudança no tipo
 */
window.handleVentilacaoTipoChange = function(machineId) {
    const tipoSelect = document.getElementById(`tipo-${machineId}`);
    const machine = tipoSelect?.closest('.climatization-machine');
    const roomId = machine?.dataset.roomId;
    
    if (roomId) {
        refreshVentilationForRoom(roomId);
    }
};

// =============================================================================
// FUNÇÃO PRINCIPAL DE REFRESH
// =============================================================================

/**
 * REFRESH COMPLETO DA SEÇÃO DE VENTILAÇÃO
 */
window.refreshVentilationForRoom = function(roomId) {
    // Só processa se for um ID de sala válido
    if (!roomId || !roomId.includes('_proj_') || !roomId.includes('_sala_')) {
        return;
    }
    
    // Aguarda constantes do sistema
    if (!window.systemConstants) {
        setTimeout(() => refreshVentilationForRoom(roomId), 500);
        return;
    }
    
    // Usa requestAnimationFrame para evitar múltiplas atualizações
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
// CONFIGURAÇÃO DE LISTENERS
// =============================================================================

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
            // Remove listener antigo se existir
            if (element._ventListener) {
                element.removeEventListener('input', element._ventListener);
                element.removeEventListener('change', element._ventListener);
            }
            
            // Cria novo listener
            element._ventListener = () => refreshVentilationForRoom(roomId);
            element.addEventListener('input', element._ventListener);
            element.addEventListener('change', element._ventListener);
        }
    });
}

/**
 * Configura observer para novas máquinas
 */
function setupMachinesObserver(roomId) {
    // Se já tem observer para esta sala, não cria outro
    if (ventilationState.get(roomId)?.observer) return;
    
    const observer = new MutationObserver((mutations) => {
        let shouldRefresh = false;
        
        mutations.forEach(mutation => {
            // Verifica se foram adicionadas/removidas máquinas
            if (mutation.type === 'childList') {
                if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                    shouldRefresh = true;
                }
            }
            
            // Verifica se foram alterados atributos (como value de selects)
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
    
    // Observa o container de máquinas e toda a árvore abaixo
    const machinesContainer = document.getElementById(`machines-${roomId}`);
    if (machinesContainer) {
        observer.observe(machinesContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['value']
        });
        
        ventilationState.set(roomId, { observer });
    }
}

/**
 * Configura tudo para uma sala
 */
function setupVentilationForRoom(roomId) {
    // Só configura se for ID de sala válido
    if (!roomId || !roomId.includes('_proj_') || !roomId.includes('_sala_')) {
        return;
    }
    
    // Evita configurar múltiplas vezes
    if (ventilationState.get(roomId)?.configured) return;
    
    // Configura listeners dos inputs técnicos
    setupTechnicalListeners(roomId);
    
    // Tenta configurar observer para máquinas
    const checkContainer = setInterval(() => {
        const container = document.getElementById(`machines-${roomId}`);
        if (container) {
            clearInterval(checkContainer);
            setupMachinesObserver(roomId);
            
            // Marca como configurado
            ventilationState.set(roomId, { 
                ...ventilationState.get(roomId),
                configured: true 
            });
            
            // Faz primeira atualização
            refreshVentilationForRoom(roomId);
        }
    }, 500);
    
    // Guarda o intervalo para poder limpar depois
    ventilationState.set(roomId, { 
        ...ventilationState.get(roomId),
        checkInterval: checkContainer 
    });
}

// =============================================================================
// FUNÇÃO PRINCIPAL EXPORTADA
// =============================================================================

/**
 * CONSTRÓI SEÇÃO DE VENTILAÇÃO
 * @param {string} roomId - ID completo da sala (ex: obra_t33_proj_e71_3_sala_1)
 * @returns {string} HTML da seção
 */
export function buildVentilacaoSection(roomId) {
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`❌ buildVentilacaoSection: Room ID inválido`);
        return '';
    }
    
    // Valida formato do ID
    if (!roomId.includes('_proj_') || !roomId.includes('_sala_')) {
        console.warn(`⚠️ ID não parece ser de sala: ${roomId}`);
        return '';
    }
    
    // Agenda configuração após inserção no DOM
    setTimeout(() => {
        setupVentilationForRoom(roomId);
    }, 100);
    
    return `
    <div class="section-block ventilation-section" id="ventilacao-section-${roomId}">
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
                  <th>Tipo</th>
                  <th>Aplicação</th>
                  <th>Capacidade (m³/h)</th>
                  <th>Solução (Qtd)</th>
                  <th>Vazão da Máquina (m³/h)</th>
                  <th>Perda (m³/h)</th>
                  <th>Dissipação (m³/h)</th>
                </tr>
              </thead>
              <tbody id="solucao-body-${roomId}">
                <tr>
                  <td colspan="6" style="text-align: center; padding: 20px; color: var(--color-gray-500);">
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

