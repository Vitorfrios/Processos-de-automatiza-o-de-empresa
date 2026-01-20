/**
 * data/modules/climatizacao/data-fill.js
 * ARQUIVO DE PREENCHER AS SALAS - VERSÃO CORRIGIDA
 */

import { calculateVazaoArAndThermalGains } from '../../../features/calculations/air-flow.js';
import { triggerCalculation } from '../../../core/shared-utils.js';

/**
 * Preenche os campos de climatização
 */
/**
 * Preenche os campos de climatização
 */
function fillClimatizationInputs(roomElement, inputsData) {
    if (!roomElement || !inputsData) {
        console.error('❌ Elemento da sala ou dados inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    const roomName = roomElement.dataset.roomName;
    
    // Preencher ambiente com nome da sala se estiver vazio
    const ambienteInput = roomElement.querySelector(`input[data-field="ambiente"]`);
    if (ambienteInput && (!inputsData.ambiente || inputsData.ambiente === '') && roomName) {
        inputsData.ambiente = roomName;
    }
    
    // Processar pressurização
    if (inputsData.pressurizacao !== undefined) {
        const isPressurizacaoAtiva = typeof inputsData.pressurizacao === 'boolean' 
            ? inputsData.pressurizacao 
            : inputsData.pressurizacao === 'true' || inputsData.pressurizacao === true || inputsData.pressurizacao === 1;
        
        const pressurizacaoValue = isPressurizacaoAtiva ? 'sim' : 'nao';
        
        const pressurizacaoRadios = roomElement.querySelectorAll(`input[type="radio"][name*="pressurizacao"]`);
        
        let radioToCheck = null;
        pressurizacaoRadios.forEach(radio => {
            if (radio.value === pressurizacaoValue) {
                radioToCheck = radio;
            }
        });

        if (radioToCheck) {
            pressurizacaoRadios.forEach(radio => {
                radio.checked = false;
            });
            
            radioToCheck.checked = true;
            
            setTimeout(() => {
                const event = new Event('change', { bubbles: true });
                radioToCheck.dispatchEvent(event);
            }, 100);
        }
    }

    // Preencher outros inputs após delay
    setTimeout(() => {
        const textInputs = roomElement.querySelectorAll('.clima-input[type="text"], .clima-input[type="number"], .clima-input[data-field]');
        
        textInputs.forEach(input => {
            const field = input.getAttribute('data-field');
            if (!field || inputsData[field] === undefined) return;

            // Apenas pula pressurizacaoSetpoint se a pressurização não estiver ativa
            if (field === 'pressurizacaoSetpoint') {
                // Verificar se a pressurização está ativa
                const pressurizacaoValue = inputsData.pressurizacao;
                const isPressurizacaoAtiva = typeof pressurizacaoValue === 'boolean' 
                    ? pressurizacaoValue 
                    : pressurizacaoValue === 'true' || pressurizacaoValue === true || pressurizacaoValue === 1;
                
                if (!isPressurizacaoAtiva) {
                    return; // Não preencher setpoint se pressurização não estiver ativa
                }
            }
            
            let value = inputsData[field];
            
            if (input.type === 'number') {
                if (value === false || value === 'false' || value === null || value === '') {
                    value = 0;
                }
                if (value === true || value === 'true') {
                    value = 1;
                }
                
                const numericValue = parseFloat(value);
                value = isNaN(numericValue) ? 0 : numericValue;
            }
            
            input.value = value;

            setTimeout(() => {
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }, 50);
        });

        // Preencher selects
        const selectInputs = roomElement.querySelectorAll('select.clima-input[data-field]');
        selectInputs.forEach(select => {
            const field = select.getAttribute('data-field');
            if (!field || inputsData[field] === undefined) return;

            const value = inputsData[field];
            select.value = value;

            setTimeout(() => {
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
            }, 50);
        });

        // Configurar sincronizações
        setTimeout(() => {
            setupRoomTitleChangeListener(roomId);
            
            if (typeof window.setupCompleteRoomSync === 'function') {
                window.setupCompleteRoomSync(roomId);
            }
        }, 500);

        // Disparar cálculo final
        if (roomId && typeof calculateVazaoArAndThermalGains === 'function') {
            setTimeout(() => {
                calculateVazaoArAndThermalGains(roomId);
            }, 300);
        }

    }, 400);
}

/**
 * Configura listener de título
 */
function setupRoomTitleChangeListener(roomId) {
    const roomTitle = document.querySelector(`[data-room-id="${roomId}"] .room-title`);
    const ambienteInput = document.querySelector(`input[data-field="ambiente"][data-room-id="${roomId}"]`);
    
    if (roomTitle && ambienteInput) {
        ambienteInput.addEventListener('input', function() {
            if (this.value && this.value.trim() !== '' && this.value !== roomTitle.textContent) {
                if (typeof window.syncAmbienteToTitle === 'function') {
                    window.syncAmbienteToTitle(roomId, this.value);
                } else {
                    roomTitle.textContent = this.value;
                    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
                    if (roomBlock) {
                        roomBlock.dataset.roomName = this.value;
                    }
                }
                triggerCalculation(roomId);
            }
        });
    }
}

/**
 * Preenche ganhos térmicos
 */
function fillThermalGainsData(roomElement, thermalGainsData) {
    if (!roomElement || !thermalGainsData) {
        console.error('❌ Elemento da sala ou dados inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;

    const gainSelectors = {
        'total-ganhos-w': `#total-ganhos-w-${roomId}`,
        'total-tr-aprox': `#total-tr-aprox-${roomId}`,
        'total-tr-exato': `#total-tr-exato-${roomId}`,
        'total-externo': `#total-externo-${roomId}`,
        'total-divisoes': `#total-divisoes-${roomId}`,
        'total-piso': `#total-piso-${roomId}`,
        'total-iluminacao': `#total-iluminacao-${roomId}`,
        'total-dissi': `#total-dissi-${roomId}`,
        'total-pessoas': `#total-pessoas-${roomId}`,
        'total-ar-sensivel': `#total-ar-sensivel-${roomId}`,
        'total-ar-latente': `#total-ar-latente-${roomId}`
    };

    Object.entries(gainSelectors).forEach(([key, selector]) => {
        const element = document.querySelector(selector);
        if (element && thermalGainsData[key] !== undefined) {
            if (key === 'total-tr-exato' && typeof thermalGainsData[key] === 'number') {
                element.textContent = thermalGainsData[key].toFixed(3);
            } else {
                element.textContent = thermalGainsData[key];
            }
        }
    });
}

/**
 * Preenche dados de capacidade
 */
function fillCapacityData(roomElement, capacityData) {
    if (!roomElement || !capacityData) {
        console.error('❌ Elemento da sala ou dados inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;

    const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`);
    if (fatorSegurancaInput && capacityData.fatorSeguranca !== undefined) {
        fatorSegurancaInput.value = capacityData.fatorSeguranca;
    }

    const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`);
    if (capacidadeUnitariaSelect && capacityData.capacidadeUnitaria !== undefined) {
        capacidadeUnitariaSelect.value = capacityData.capacidadeUnitaria;
    }

    const backupSelect = roomElement.querySelector('.backup-select');
    if (backupSelect && capacityData.backup !== undefined) {
        backupSelect.value = capacityData.backup;
    }
}

/**
 * Garante todas as seções da sala - VERSÃO SIMPLIFICADA E CORRETA
 */
async function ensureAllRoomSections(roomElement) {
    if (!roomElement) {
        console.error('❌ Elemento da sala inválido');
        return false;
    }

    const obraId = roomElement.dataset.obraId;
    const projectId = roomElement.dataset.projectId; 
    const roomName = roomElement.dataset.roomName;
    const roomId = roomElement.dataset.roomId;

    if (!roomId) {
        console.error(`❌ Room ID inválido`);
        return false;
    }

    console.log(`🔨 Verificando seções da sala ${roomName}`);

    // Função simples para verificar seção
    const checkSection = (title) => {
        const sections = roomElement.querySelectorAll('.section-title');
        for (let sectionTitle of sections) {
            if (sectionTitle.textContent.includes(title)) {
                return true;
            }
        }
        return false;
    };

    // Verificar seções
    const climatizationExists = checkSection('Climatização');
    const machinesExists = checkSection('Máquinas');
    const acessoriosExists = checkSection('Acessorios');
    const dutosExists = checkSection('Dutos');
    const tubosExists = checkSection('Tubulação');

    console.log(`📋 Seções existentes:`, {
        climatization: climatizationExists,
        machines: machinesExists,
        acessorios: acessoriosExists,
        dutos: dutosExists,
        tubos: tubosExists
    });

    // Verificar se há duplicação de tubos
    const tubosSections = roomElement.querySelectorAll('.section-title');
    let tubosCount = 0;
    tubosSections.forEach(title => {
        if (title.textContent.includes('Tubulação de Cobre')) {
            tubosCount++;
        }
    });

    if (tubosCount > 1) {
        console.warn(`⚠️ DUPLICAÇÃO DETECTADA: ${tubosCount} seções de Tubulação`);
        fixDuplicatedSections(roomElement, 'Tubulação de Cobre');
        return true; // Já corrigiu, não precisa criar
    }

    // Se todas existem, retornar true
    if (climatizationExists && machinesExists && acessoriosExists && dutosExists && tubosExists) {
        console.log(`✅ Todas as seções já existem`);
        return true;
    }

    console.log(`🔄 Criando seções faltantes`);

    try {
        const roomContent = roomElement.querySelector('.room-content');
        if (!roomContent) {
            console.error(`❌ Container de conteúdo da sala não encontrado`);
            return false;
        }

        // Obter última seção
        let lastSection = roomContent.querySelector('.section-block:last-child');
        
        // Criar apenas o que falta, na ORDEM CORRETA
        const sectionsToCreate = [];
        
        if (!climatizationExists) sectionsToCreate.push({type: 'climatization', func: window.buildClimatizationSection});
        if (!machinesExists) sectionsToCreate.push({type: 'machines', func: window.buildMachinesSection});
        if (!acessoriosExists) sectionsToCreate.push({type: 'acessorios', func: window.buildAcessoriosSection});
        if (!dutosExists) sectionsToCreate.push({type: 'dutos', func: window.buildDutosSection});
        if (!tubosExists) sectionsToCreate.push({type: 'tubos', func: window.buildTubosSection});

        console.log(`🏗️ Criando ${sectionsToCreate.length} seções`);

        // Criar seções na ordem correta
        for (let i = 0; i < sectionsToCreate.length; i++) {
            const section = sectionsToCreate[i];
            if (typeof section.func === 'function') {
                console.log(`📦 Criando seção: ${section.type}`);
                
                const html = await section.func(obraId, projectId, roomName, roomId);
                if (html) {
                    if (lastSection) {
                        lastSection.insertAdjacentHTML('afterend', html);
                    } else {
                        roomContent.insertAdjacentHTML('beforeend', html);
                    }
                    
                    lastSection = roomContent.querySelector('.section-block:last-child');
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
        }

        console.log(`✅ Seções criadas para ${roomName}`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao criar seções:`, error);
        return false;
    }
}

/**
 * Corrige seções duplicadas
 */
function fixDuplicatedSections(roomElement, sectionTitle) {
    const roomContent = roomElement.querySelector('.room-content');
    if (!roomContent) return;
    
    const allSections = roomContent.querySelectorAll('.section-block');
    const targetSections = [];
    
    // Encontrar todas as seções com o título especificado
    allSections.forEach(section => {
        const titleElement = section.querySelector('.section-title');
        if (titleElement && titleElement.textContent.includes(sectionTitle)) {
            targetSections.push(section);
        }
    });
    
    // Se tem mais de uma, remover as extras
    if (targetSections.length > 1) {
        console.log(`🗑️ Removendo ${targetSections.length - 1} seções duplicadas de "${sectionTitle}"`);
        
        // Manter a primeira, remover as outras
        for (let i = 1; i < targetSections.length; i++) {
            targetSections[i].remove();
        }
        
        console.log(`✅ Duplicação corrigida`);
    }
}

/**
 * Função auxiliar para encontrar seção
 */
function findSectionByTitle(roomElement, title) {
    const sections = roomElement.querySelectorAll('.section-block');
    for (let section of sections) {
        const sectionTitle = section.querySelector('.section-title');
        if (sectionTitle && sectionTitle.textContent.includes(title)) {
            return section;
        }
    }
    return null;
}

/**
 * Função auxiliar para encontrar seção de máquinas
 */
function findMachinesSection(roomElement) {
    return roomElement.querySelector('.machines-section') || 
           roomElement.querySelector('[id*="machines"]');
}

// Exportações
export {
    fillClimatizationInputs,
    fillThermalGainsData,
    fillCapacityData,
    ensureAllRoomSections,
    setupRoomTitleChangeListener,
    fixDuplicatedSections,
    findSectionByTitle,
    findMachinesSection
};

// Compatibilidade global
if (typeof window !== 'undefined') {
    window.setupRoomTitleChangeListener = setupRoomTitleChangeListener;
    window.fixDuplicatedSections = fixDuplicatedSections;
}