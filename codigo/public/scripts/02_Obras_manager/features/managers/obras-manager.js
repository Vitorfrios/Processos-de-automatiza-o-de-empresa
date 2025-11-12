/**
 * features/managers/obras-manager.js
 * Gerenciador principal da Página 2 - Coordena carregamento e renderização
 */

import { loadBackupObras, removeObraFromBackup } from '../../data/adapters/obras-adapter.js';
import { getObraStats, formatObraStats, applyFilters as applyObraFilters } from '../../data/builders/obras-builder.js';
import { showSystemStatus } from '../../../../01_Create_Obra/scripts/ui/components/status.js';
import { showConfirmationModal } from '../../../../01_Create_Obra/scripts/ui/components/modal/modal.js';

// Cache para funções da Página 1
let page1Functions = null;
let globalFunctionsLoaded = false;
let systemConstantsLoaded = false;

/**
 * Carrega as constantes do sistema da Página 1
 */
async function loadSystemConstants() {
    if (systemConstantsLoaded) return;
    
    try {
        console.log('📊 Carregando constantes do sistema...');
        
        // Carregar o módulo de constantes
        const constantsModule = await import('../../../../01_Create_Obra/scripts/core/constants.js');
        
        // Carregar o sistema de cálculos que inicializa as constantes
        const calculationsCore = await import('../../../../01_Create_Obra/scripts/features/calculations/calculations-core.js');
        
        // Se houver uma função para inicializar constantes, chamá-la
        if (typeof window.initializeSystemConstants === 'function') {
            await window.initializeSystemConstants();
        }
        
        // Verificar se as constantes estão disponíveis
        if (window.systemConstants) {
            console.log('✅ Constantes do sistema carregadas:', Object.keys(window.systemConstants).length, 'constantes');
            systemConstantsLoaded = true;
        } else {
            console.warn('⚠️ Constantes do sistema não carregadas - cálculos podem falhar');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar constantes do sistema:', error);
    }
}

/**
 * Carrega TODAS as funções globais da Página 1
 */
async function loadAllPage1Functions() {
    if (globalFunctionsLoaded) return;
    
    try {
        console.log('📦 Carregando TODAS as funções da Página 1...');
        
        // 1. PRIMEIRO: Carregar constantes do sistema
        await loadSystemConstants();
        
        // 2. Carregar funções essenciais da Página 1
        const obraManager = await import('../../../../01_Create_Obra/scripts/features/managers/obra-manager.js');
        const uiBuilders = await import('../../../../01_Create_Obra/scripts/data/builders/ui-builders.js');
        const interfaceModule = await import('../../../../01_Create_Obra/scripts/ui/interface.js');
        
        // 3. Carregar módulos que definem funções globais
        await import('../../../../01_Create_Obra/scripts/features/calculations/air-flow.js');
        await import('../../../../01_Create_Obra/scripts/features/calculations/thermal-gains.js');
        await import('../../../../01_Create_Obra/scripts/ui/helpers.js');
        await import('../../../../01_Create_Obra/scripts/data/modules/climatizacao.js');
        await import('../../../../01_Create_Obra/scripts/data/modules/machines/machines-core.js');
        await import('../../../../01_Create_Obra/scripts/data/modules/rooms.js');
        
        page1Functions = {
            createEmptyObra: obraManager.createEmptyObra,
            insertObraIntoDOM: obraManager.insertObraIntoDOM,
            populateObraData: uiBuilders.populateObraData,
            updateObraButtonAfterSave: obraManager.updateObraButtonAfterSave,
        };
        
        console.log('✅ TODAS as funções da Página 1 carregadas');
        
        // Verificar se as funções principais foram carregadas
        const requiredFunctions = [
            'toggleObra', 'toggleRoom', 'toggleProject', 'toggleSection', 'toggleSubsection',
            'toggleMachineSection', 'calculateVazaoArAndThermalGains', 'makeEditable'
        ];
        
        let loadedFunctions = [];
        let missingFunctions = [];
        
        requiredFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                loadedFunctions.push(funcName);
            } else {
                missingFunctions.push(funcName);
            }
        });
        
        console.log(`📊 Funções carregadas: ${loadedFunctions.length}/${requiredFunctions.length}`);
        console.log('✅ Carregadas:', loadedFunctions);
        if (missingFunctions.length > 0) {
            console.warn('⚠️ Faltando:', missingFunctions);
        }
        
        globalFunctionsLoaded = true;
        
    } catch (error) {
        console.error('❌ Erro ao carregar funções da Página 1:', error);
        throw error;
    }
}

/**
 * Renderiza uma obra usando as funções da Página 1
 */
async function renderObra(obraData) {
    try {
        // ✅ CARREGAR TODAS AS FUNÇÕES E CONSTANTES PRIMEIRO
        await loadAllPage1Functions();
        
        const { createEmptyObra, populateObraData } = page1Functions;
        
        console.log(`🎨 Renderizando obra: ${obraData.nome} (ID: ${obraData.id})`);
        
        // Criar obra vazia usando função da Página 1
        const obraCreated = await createEmptyObra(obraData.nome, obraData.id);
        
        if (!obraCreated) {
            console.error(`❌ Falha ao criar obra: ${obraData.nome}`);
            return false;
        }
        
        // Aguardar a obra ser inserida no DOM
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Popular dados completos usando função da Página 1
        await populateObraData(obraData);
        
        console.log(`✅ Obra renderizada: ${obraData.nome}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Erro ao renderizar obra ${obraData.nome}:`, error);
        return false;
    }
}

/**
 * Aplica pós-processamento específico da Página 2
 */
function applyPage2PostProcessing() {
    console.log('🔧 Aplicando pós-processamento da Página 2...');
    
    // 1. Esconder botões de Salvar
    const saveButtons = document.querySelectorAll('.btn-salvar');
    saveButtons.forEach(btn => {
        btn.style.display = 'none';
    });
    
    // 2. Esconder seções de adicionar projeto/sala
    const addSections = document.querySelectorAll('.add-project-section, .add-room-section');
    addSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // 3. Atualizar textos e adicionar badge
    const obraHeaders = document.querySelectorAll('.obra-header');
    obraHeaders.forEach(header => {

        
        // Atualizar ação de deletar para usar adapter da Página 2
        const deleteBtn = header.querySelector('.btn-delete');
        if (deleteBtn) {
            const obraId = deleteBtn.closest('.obra-block').dataset.obraId;
            const obraName = deleteBtn.closest('.obra-block').dataset.obraName;
            
            deleteBtn.textContent = 'Excluir do Backup';
            deleteBtn.className = 'btn btn-manager-delete';
            deleteBtn.onclick = () => handleObraDeletion(obraId, obraName);
        }
    });
    
    // 4. Adicionar estatísticas às obras
    const obraBlocks = document.querySelectorAll('.obra-block');
    obraBlocks.forEach(obraBlock => {
        const obraId = obraBlock.dataset.obraId;
        addObraStatsToHeader(obraBlock, obraId);
    });
    
    console.log('✅ Pós-processamento aplicado');
}

/**
 * Adiciona estatísticas ao header da obra
 */
function addObraStatsToHeader(obraBlock, obraId) {
    const obraHeader = obraBlock.querySelector('.obra-header');
    const spacer = obraBlock.querySelector('.obra-header-spacer');
    
    if (spacer) {
        // Buscar dados da obra para calcular estatísticas
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
 * Manipula a exclusão de obra (Página 2)
 */
async function handleObraDeletion(obraId, obraName) {
    console.log(`🗑️ Iniciando exclusão da obra: ${obraName} (ID: ${obraId})`);
    
    // Usar modal de confirmação da Página 1, mas com comportamento da Página 2
    showConfirmationModal(obraName, obraId, document.querySelector(`[data-obra-id="${obraId}"]`));
    
    // Sobrescrever o comportamento padrão do modal
    window.confirmDeletion = async () => {
        console.log(`✅ Confirmada exclusão da obra: ${obraName}`);
        
        try {
            // Remover do backup usando adapter da Página 2
            const success = await removeObraFromBackup(obraId);
            
            if (success) {
                // Remover do DOM
                const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
                if (obraBlock) {
                    obraBlock.remove();
                    console.log(`✅ Obra ${obraName} removida do DOM`);
                }
                
                showSystemStatus(`Obra "${obraName}" removida do backup`, 'success');
            } else {
                // Fallback: remover apenas do DOM se o servidor não suportar
                console.log('🔄 Fallback: removendo apenas do DOM');
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
 * Carrega e renderiza todas as obras do backup
 */
export async function loadAndRenderObras() {
    try {
        console.log('🚀 Iniciando carregamento e renderização de obras...');
        showSystemStatus('Carregando obras...', 'info');
        
        // Carregar obras do backup
        const obras = await loadBackupObras();
        
        if (obras.length === 0) {
            showSystemStatus('Nenhuma obra encontrada no backup', 'warning');
            return;
        }
        
        console.log(`📊 ${obras.length} obra(s) para renderizar`);
        
        // Renderizar cada obra
        let successCount = 0;
        for (const obra of obras) {
            const success = await renderObra(obra);
            if (success) successCount++;
            
            // Pequena pausa entre renderizações
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Aplicar pós-processamento da Página 2
        applyPage2PostProcessing();
        
        console.log(`🎉 Renderização concluída: ${successCount}/${obras.length} obra(s)`);
        showSystemStatus(`${successCount} obra(s) carregada(s)`, 'success');
        
    } catch (error) {
        console.error('❌ Erro no carregamento e renderização:', error);
        showSystemStatus('Erro ao carregar obras', 'error');
    }
}

/**
 * Stub para filtros futuros
 */
export function applyFilters(criteria = {}) {
    console.log('🔍 Aplicando filtros (stub):', criteria);
    
    // Usar a função do builder com alias para evitar conflito
    const filteredObras = applyObraFilters([], criteria); // Array vazio por enquanto
    
    // Esta função será conectada ao UI de busca quando implementado
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
    handleObraDeletion
};