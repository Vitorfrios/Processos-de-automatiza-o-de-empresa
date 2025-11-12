/**
 * features/managers/obras-manager.js
 * Gerenciador principal da Página 2 - VERSÃO CORRIGIDA SEM STUBS
 */

import { loadBackupObras, removeObraFromBackup } from '../../data/adapters/obras-adapter.js';
import { getObraStats, formatObraStats, applyFilters as applyObraFilters } from '../../data/builders/obras-builder.js';
import { showSystemStatus } from '../../../01_Create_Obra/ui/components/status.js';
import { showConfirmationModal } from '../../../01_Create_Obra/ui/components/modal/modal.js';
import { waitForConstants, validateRequiredConstants } from '../../data/adapters/constants-adapter.js';

// Mapeamento correto dos imports da Página 1
const PAGE_1_BASE_PATH = '/public/scripts/01_Create_Obra';

// Cache para funções da Página 1
let page1Functions = null;
let globalFunctionsLoaded = false;

/**
 * 🎯 REMOVER STUBS E CARREGAR FUNÇÕES REAIS
 */
async function removeStubsAndLoadRealFunctions() {
    console.log('🚨 REMOVENDO STUBS CONFLITANTES...');
    
    // Remover stubs que bloqueiam funções reais
    const stubsToRemove = [
        'calculateVazaoArAndThermalGains',
        'calculateCapacitySolution', 
        'updateCapacityFromThermalGains'
    ];
    
    stubsToRemove.forEach(stub => {
        if (window[stub] && window[stub].toString().includes('STUB')) {
            delete window[stub];
            console.log(`✅ Stub removido: ${stub}`);
        }
    });
    
    // Carregar funções reais
    await loadRealCalculationFunctions();
}

/**
 * 🎯 CARREGAR FUNÇÕES REAIS DE CÁLCULO
 */
async function loadRealCalculationFunctions() {
    console.log('🎯 CARREGANDO FUNÇÕES REAIS DE CÁLCULO...');
    
    try {
        // Carregar air-flow.js
        const airFlowModule = await import(`${PAGE_1_BASE_PATH}/features/calculations/air-flow.js`);
        if (airFlowModule && airFlowModule.calculateVazaoArAndThermalGains) {
            window.calculateVazaoArAndThermalGains = airFlowModule.calculateVazaoArAndThermalGains;
            console.log('✅ calculateVazaoArAndThermalGains REAL carregada');
        }
        
        // Carregar capacity-calculator.js
        const capacityModule = await import(`${PAGE_1_BASE_PATH}/data/modules/machines/capacity-calculator.js`);
        if (capacityModule) {
            if (capacityModule.calculateCapacitySolution) {
                window.calculateCapacitySolution = capacityModule.calculateCapacitySolution;
                console.log('✅ calculateCapacitySolution REAL carregada');
            }
            if (capacityModule.updateCapacityFromThermalGains) {
                window.updateCapacityFromThermalGains = capacityModule.updateCapacityFromThermalGains;
                console.log('✅ updateCapacityFromThermalGains REAL carregada');
            }
        }
        
        // Carregar thermal-gains.js
        const thermalModule = await import(`${PAGE_1_BASE_PATH}/features/calculations/thermal-gains.js`);
        if (thermalModule) {
            console.log('✅ thermal-gains.js REAL carregado');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar funções reais:', error);
        return false;
    }
}

/**
 * 🎯 ATUALIZAR DISPLAY DA VAZÃO
 */
function updateVazaoDisplay(roomId, vazaoValue) {
    console.log(`🎯 ATUALIZANDO DISPLAY: ${roomId} = ${vazaoValue} l/s`);
    
    const vazaoElement = document.getElementById(`vazao-ar-${roomId}`);
    if (vazaoElement) {
        vazaoElement.textContent = vazaoValue;
        
        
        console.log(`✅ Vazão atualizada no HTML: ${vazaoValue} l/s`);
    } else {
        console.error(`❌ Elemento vazao-ar-${roomId} não encontrado`);
    }
}

/**
 * 🎯 WRAPPER PARA CÁLCULO COM ATUALIZAÇÃO AUTOMÁTICA
 */
function calculateVazaoArWithDisplay(roomId) {
    console.log(`🎯 CALCULANDO VAZÃO COM DISPLAY: ${roomId}`);
    
    if (typeof window.calculateVazaoArAndThermalGains === 'function' && 
        !window.calculateVazaoArAndThermalGains.toString().includes('STUB')) {
        
        const vazaoResult = window.calculateVazaoArAndThermalGains(roomId);
        console.log(`📊 Resultado cálculo REAL: ${vazaoResult} l/s`);
        
        // ATUALIZA O DISPLAY IMEDIATAMENTE
        updateVazaoDisplay(roomId, vazaoResult);
        
        return vazaoResult;
    } else {
        console.error('❌ calculateVazaoArAndThermalGains não disponível ou ainda é stub');
        return 0;
    }
}

/**
 * 🎯 SISTEMA DE OBSERVAÇÃO PARA ATUALIZAÇÃO EM TEMPO REAL
 */
function setupRealTimeUpdates() {
    console.log('🎯 CONFIGURANDO ATUALIZAÇÕES EM TEMPO REAL...');
    
    // Observar mudanças no DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const roomInputs = node.querySelectorAll ? node.querySelectorAll('[data-room-id]') : [];
                    roomInputs.forEach(setupInputListeners);
                    
                    if (node.hasAttribute && node.hasAttribute('data-room-id')) {
                        setupInputListeners(node);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Configurar listeners para inputs existentes
    document.querySelectorAll('[data-room-id]').forEach(setupInputListeners);
    
    console.log('✅ Sistema de atualização em tempo real configurado');
}

/**
 * 🎯 CONFIGURAR LISTENERS PARA INPUTS
 */
function setupInputListeners(element) {
    const roomId = element.getAttribute('data-room-id');
    if (!roomId) return;
    
    const criticalFields = ['area', 'numPessoas', 'setpointTemp', 'pressurizacaoSetpoint'];
    
    criticalFields.forEach(field => {
        const input = element.querySelector(`[data-field="${field}"]`);
        if (input) {
            // Remover listeners existentes
            input.removeEventListener('input', handleVazaoUpdate);
            input.removeEventListener('change', handleVazaoUpdate);
            
            // Adicionar novos listeners
            input.addEventListener('input', handleVazaoUpdate);
            input.addEventListener('change', handleVazaoUpdate);
            
            console.log(`✅ Listener configurado para ${field} em ${roomId}`);
        }
    });
}

/**
 * 🎯 MANIPULADOR DE ATUALIZAÇÃO DE VAZÃO
 */
function handleVazaoUpdate(event) {
    const input = event.target;
    const roomId = input.closest('[data-room-id]')?.getAttribute('data-room-id');
    
    if (roomId) {
        console.log(`🔄 Input alterado: ${input.dataset.field} = ${input.value} para ${roomId}`);
        
        clearTimeout(window.vazaoUpdateTimeout);
        window.vazaoUpdateTimeout = setTimeout(() => {
            calculateVazaoArWithDisplay(roomId);
        }, 300);
    }
}

/**
 * 🎯 CARREGAR MÓDULOS DA PÁGINA 1
 */
async function loadPage1Module(modulePath, moduleName) {
    try {
        const module = await import(modulePath);
        console.log(`✅ ${moduleName} carregado`);
        return module;
    } catch (error) {
        console.error(`❌ Erro ao carregar ${moduleName}:`, error.message);
        return null;
    }
}

/**
 * 🎯 CARREGAR TODOS OS MÓDULOS NECESSÁRIOS
 */
async function loadAllPage1Modules() {
    const modules = [
        { path: `${PAGE_1_BASE_PATH}/features/managers/obra-manager.js`, name: 'obra-manager' },
        { path: `${PAGE_1_BASE_PATH}/data/builders/ui-builders.js`, name: 'ui-builders' },
        { path: `${PAGE_1_BASE_PATH}/ui/helpers.js`, name: 'helpers' },
        { path: `${PAGE_1_BASE_PATH}/data/modules/rooms.js`, name: 'rooms' },
        { path: `${PAGE_1_BASE_PATH}/data/modules/climatizacao.js`, name: 'climatizacao' },
        { path: `${PAGE_1_BASE_PATH}/data/modules/configuracao.js`, name: 'configuracao' },
        { path: `${PAGE_1_BASE_PATH}/data/modules/machines/machines-core.js`, name: 'machines-core' },
        { path: `${PAGE_1_BASE_PATH}/features/calculations/calculations-core.js`, name: 'calculations-core' },
        { path: `${PAGE_1_BASE_PATH}/features/calculations/air-flow.js`, name: 'air-flow' },
        { path: `${PAGE_1_BASE_PATH}/features/calculations/thermal-gains.js`, name: 'thermal-gains' },
        { path: `${PAGE_1_BASE_PATH}/data/modules/machines/capacity-calculator.js`, name: 'capacity-calculator' }
    ];

    const results = [];
    
    for (const module of modules) {
        const result = await loadPage1Module(module.path, module.name);
        results.push({ name: module.name, success: !!result, module: result });
    }
    
    console.log(`📊 Resumo carregamento: ${results.filter(r => r.success).length}/${modules.length} módulos carregados`);
    return results;
}

/**
 * 🎯 CARREGAR FUNÇÕES GLOBAIS DA PÁGINA 1
 */
async function loadAllPage1Functions() {
    if (globalFunctionsLoaded) {
        console.log('🔁 Funções já carregadas, pulando...');
        return;
    }
    
    try {
        console.log('📦 Carregando TODAS as funções da Página 1...');
        
        // PRIMEIRO: Remover stubs e carregar funções reais
        await removeStubsAndLoadRealFunctions();
        
        // Garantir constantes
        await waitForConstants();
        console.log('✅ Constantes verificadas');
        
        // Carregar módulos
        const loadResults = await loadAllPage1Modules();
        
        const obraManagerModule = loadResults.find(r => r.name === 'obra-manager')?.module;
        const uiBuildersModule = loadResults.find(r => r.name === 'ui-builders')?.module;
        
        if (obraManagerModule && uiBuildersModule) {
            page1Functions = {
                createEmptyObra: obraManagerModule.createEmptyObra,
                insertObraIntoDOM: obraManagerModule.insertObraIntoDOM,
                populateObraData: uiBuildersModule.populateObraData,
                updateObraButtonAfterSave: obraManagerModule.updateObraButtonAfterSave,
            };
        } else {
            console.error('❌ Módulos críticos da Página 1 não carregados');
            throw new Error('Módulos críticos da Página 1 não carregados');
        }
        
        console.log('✅ Funções da Página 1 carregadas');
        globalFunctionsLoaded = true;
        
    } catch (error) {
        console.error('❌ Erro ao carregar funções da Página 1:', error);
        throw error;
    }
}

/**
 * 🎯 RENDERIZAR OBRA COM CÁLCULOS REAIS
 */
async function renderObra(obraData) {
    try {
        await loadAllPage1Functions();
        
        if (!page1Functions) {
            console.error('❌ Funções da Página 1 não disponíveis');
            return false;
        }
        
        const { createEmptyObra, populateObraData } = page1Functions;
        
        console.log(`🎨 Renderizando obra: ${obraData.nome} (ID: ${obraData.id})`);
        
        const obraCreated = await createEmptyObra(obraData.nome, obraData.id);
        
        if (!obraCreated) {
            console.error(`❌ Falha ao criar obra: ${obraData.nome}`);
            return false;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await populateObraData(obraData);
        
        // ✅ CONFIGURAR ATUALIZAÇÃO EM TEMPO REAL APÓS RENDERIZAÇÃO
        setTimeout(() => {
            setupRoomListeners(obraData.id);
            
            // ✅ FORÇAR CÁLCULO INICIAL COM FUNÇÕES REAIS
            forceRealVazaoCalculation(obraData.id);
        }, 1000);
        
        console.log(`✅ Obra renderizada: ${obraData.nome}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Erro ao renderizar obra ${obraData.nome}:`, error);
        return false;
    }
}

/**
 * 🎯 FORÇAR CÁLCULO REAL DA VAZÃO
 */
function forceRealVazaoCalculation(obraId) {
    console.log(`🎯 FORÇANDO CÁLCULO REAL DA VAZÃO: ${obraId}`);
    
    const roomElements = document.querySelectorAll(`[data-room-id*="${obraId}"]`);
    console.log(`📊 ${roomElements.length} salas encontradas para cálculo real`);
    
    roomElements.forEach(roomElement => {
        const roomId = roomElement.dataset.roomId;
        if (roomId) {
            setTimeout(() => {
                console.log(`🔧 Cálculo real forçado para: ${roomId}`);
                calculateVazaoArWithDisplay(roomId);
            }, 500);
        }
    });
}

/**
 * 🎯 CONFIGURAR LISTENERS PARA SALAS
 */
function setupRoomListeners(obraId) {
    console.log(`🎯 CONFIGURANDO LISTENERS PARA OBRA: ${obraId}`);
    
    const roomElements = document.querySelectorAll(`[data-room-id*="${obraId}"]`);
    console.log(`📊 ${roomElements.length} salas encontradas para configuração`);
    
    roomElements.forEach(roomElement => {
        const roomId = roomElement.dataset.roomId;
        if (roomId) {
            setTimeout(() => {
                setupInputListeners(roomElement);
            }, 100);
        }
    });
}

/**
 * APLICAR PÓS-PROCESSAMENTO
 */
function applyPage2PostProcessing() {
    console.log('🔧 Aplicando pós-processamento da Página 2...');
    
    const saveButtons = document.querySelectorAll('.btn-salvar');
    saveButtons.forEach(btn => {
        btn.style.display = 'none';
    });
    
    const addSections = document.querySelectorAll('.add-project-section, .add-room-section');
    addSections.forEach(section => {
        section.style.display = 'none';
    });
    
    const obraHeaders = document.querySelectorAll('.obra-header');
    obraHeaders.forEach(header => {
        const deleteBtn = header.querySelector('.btn-delete');
        if (deleteBtn) {
            const obraId = deleteBtn.closest('.obra-block').dataset.obraId;
            const obraName = deleteBtn.closest('.obra-block').dataset.obraName;
            
            deleteBtn.textContent = 'Excluir do Backup';
            deleteBtn.className = 'btn btn-manager-delete';
            deleteBtn.onclick = () => handleObraDeletion(obraId, obraName);
        }
    });
    
    const obraBlocks = document.querySelectorAll('.obra-block');
    obraBlocks.forEach(obraBlock => {
        const obraId = obraBlock.dataset.obraId;
        addObraStatsToHeader(obraBlock, obraId);
    });
    
    console.log('✅ Pós-processamento aplicado');
}

/**
 * ADICIONAR ESTATÍSTICAS AO HEADER
 */
function addObraStatsToHeader(obraBlock, obraId) {
    const spacer = obraBlock.querySelector('.obra-header-spacer');
    
    if (spacer) {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (obraElement) {
            const projetos = obraElement.querySelectorAll('.project-block');
            let totalSalas = 0;
            let totalMaquinas = 0;
            
            projetos.forEach(projeto => {
                const salas = projeto.querySelectorAll('.room-block');
                totalSalas += salas.length;
                
                salas.forEach(sala => {
                    const maquinas = sala.querySelectorAll('.climatization-machine, .machine-block');
                    totalMaquinas += maquinas.length;
                });
            });
            
            const statsText = formatObraStats({
                projetos: projetos.length,
                salas: totalSalas,
                maquinas: totalMaquinas
            });
            
            spacer.innerHTML = `<span>${statsText}</span>`;
        }
    }
}

/**
 * MANIPULAR EXCLUSÃO DE OBRA
 */
async function handleObraDeletion(obraId, obraName) {
    console.log(`🗑️ Iniciando exclusão da obra: ${obraName} (ID: ${obraId})`);
    
    showConfirmationModal(obraName, obraId, document.querySelector(`[data-obra-id="${obraId}"]`));
    
    window.confirmDeletion = async () => {
        console.log(`✅ Confirmada exclusão da obra: ${obraName}`);
        
        try {
            const success = await removeObraFromBackup(obraId);
            
            if (success) {
                const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
                if (obraBlock) {
                    obraBlock.remove();
                    console.log(`✅ Obra ${obraName} removida do DOM`);
                }
                
                showSystemStatus(`Obra "${obraName}" removida do backup`, 'success');
            } else {
                const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
                if (obraBlock) {
                    obraBlock.remove();
                    showSystemStatus(`Obra "${obraName}" removida da visualização`, 'warning');
                }
            }
            
        } catch (error) {
            console.error('❌ Erro na exclusão:', error);
            showSystemStatus('Erro ao remover obra', 'error');
        }
    };
}

/**
 * 🎯 CARREGAR E RENDERIZAR OBRAS COM CÁLCULOS REAIS
 */
export async function loadAndRenderObras() {
    try {
        console.log('🚀 Iniciando carregamento e renderização de obras...');
        showSystemStatus('Carregando obras...', 'info');
        
        // ✅ PRIMEIRO: Carregar funções reais (sem stubs)
        await loadAllPage1Functions();
        
        const obras = await loadBackupObras();
        
        if (obras.length === 0) {
            showSystemStatus('Nenhuma obra encontrada no backup', 'warning');
            return;
        }
        
        console.log(`📊 ${obras.length} obra(s) para renderizar`);
        
        let successCount = 0;
        for (const obra of obras) {
            const success = await renderObra(obra);
            if (success) successCount++;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        applyPage2PostProcessing();
        
        // ✅ INICIAR SISTEMA DE ATUALIZAÇÃO EM TEMPO REAL
        setupRealTimeUpdates();
        
        // ✅ FORÇAR CÁLCULO FINAL DE TODAS AS OBRAS
        setTimeout(() => {
            console.log('🎯 CÁLCULO FINAL DE TODAS AS VAZÕES');
            obras.forEach(obra => {
                forceRealVazaoCalculation(obra.id);
            });
        }, 3000);
        
        console.log(`🎉 Renderização concluída: ${successCount}/${obras.length} obra(s)`);
        showSystemStatus(`${successCount} obra(s) carregada(s)`, 'success');
        
    } catch (error) {
        console.error('❌ Erro no carregamento e renderização:', error);
        showSystemStatus('Erro ao carregar obras', 'error');
    }
}

/**
 * STUB PARA FILTROS FUTUROS
 */
export function applyFilters(criteria = {}) {
    console.log('🔍 Aplicando filtros (stub):', criteria);
    
    const filteredObras = applyObraFilters([], criteria);
    
    return {
        criteria,
        filteredCount: filteredObras.length,
        message: 'Sistema de filtros será implementado futuramente',
        timestamp: new Date().toISOString()
    };
}

// Exportações
export {
    renderObra,
    applyPage2PostProcessing,
    handleObraDeletion,
    loadAllPage1Functions,
    updateVazaoDisplay,
    calculateVazaoArWithDisplay
};