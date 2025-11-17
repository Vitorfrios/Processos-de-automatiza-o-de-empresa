import { generateRoomId } from '../../utils/id-generator.js';
import { extractNumberFromText } from '../../utils/data-utils.js';

/**
 * Extrai todos os dados de uma sala a partir do elemento HTML
 */
function extractRoomData(roomElement, projectElement) {
    if (!roomElement || !projectElement) {
        console.error('❌ Elemento da sala ou projeto é nulo');
        return null;
    }

    const roomId = roomElement.dataset.roomId || generateRoomId(projectElement);
    const roomName = roomElement.dataset.roomName || `Sala ${roomId}`;

    console.log(`🔍 Extraindo dados da sala: "${roomName}" (ID: ${roomId})`);

    const roomData = {
        id: roomId,
        nome: roomName,
        inputs: extractClimatizationInputs(roomElement),
        maquinas: extractMachinesData(roomElement),
        capacidade: extractCapacityData(roomElement),
        ganhosTermicos: extractThermalGainsData(roomElement),
        configuracao: extractConfigurationData(roomElement)
    };

    console.log(`📊 Dados extraídos da sala ${roomId}:`, {
        inputs: Object.keys(roomData.inputs).length,
        maquinas: roomData.maquinas.length,
        capacidade: Object.keys(roomData.capacidade).length,
        ganhosTermicos: Object.keys(roomData.ganhosTermicos).length,
        configuracao: Object.keys(roomData.configuracao).length
    });
    
    return roomData;
}

/**
 * Extrai inputs de climatização de uma sala
 */
function extractClimatizationInputs(roomElement) {
    const inputs = {};
    
    if (!roomElement?.dataset.roomId) {
        console.error('❌ Elemento da sala inválido para extração de inputs');
        return inputs;
    }
    
    // Extrair inputs de texto/number
    const textInputs = roomElement.querySelectorAll('.clima-input[type="text"], .clima-input[type="number"], .clima-input[data-field]');
    textInputs.forEach(input => {
        const field = input.getAttribute('data-field');
        if (!field) return;
        
        let value = input.value;
        if (input.type === 'number' && value !== '') {
            value = parseFloat(value) || 0;
        }
        
        if (value !== undefined && value !== '' && value !== null) {
            inputs[field] = value;
        }
    });

    // Extrair pressurização (radio buttons)
    const pressurizacaoRadios = roomElement.querySelectorAll('input[name*="pressurizacao"][type="radio"]');
    let pressurizacaoValue = false;
    
    pressurizacaoRadios.forEach(radio => {
        if (radio.checked) pressurizacaoValue = radio.value === 'sim';
    });
    
    inputs.pressurizacao = pressurizacaoValue;
    
    // Campos específicos da pressurização
    if (pressurizacaoValue) {
        const pressurizacaoInput = roomElement.querySelector('.clima-input[data-field="pressurizacaoSetpoint"]');
        const portasDuplasInput = roomElement.querySelector('.clima-input[data-field="numPortasDuplas"]');
        const portasSimplesInput = roomElement.querySelector('.clima-input[data-field="numPortasSimples"]');
        
        if (pressurizacaoInput) inputs.pressurizacaoSetpoint = parseFloat(pressurizacaoInput.value) || 25;
        if (portasDuplasInput) inputs.numPortasDuplas = parseFloat(portasDuplasInput.value) || 0;
        if (portasSimplesInput) inputs.numPortasSimples = parseFloat(portasSimplesInput.value) || 0;
    } else {
        inputs.pressurizacaoSetpoint = 0;
        inputs.numPortasDuplas = 0;
        inputs.numPortasSimples = 0;
    }

    // Extrair selects
    const selectInputs = roomElement.querySelectorAll('select.clima-input[data-field]');
    selectInputs.forEach(select => {
        const field = select.getAttribute('data-field');
        if (!field || inputs[field] !== undefined) return;
        
        const value = select.value;
        if (value !== undefined && value !== '' && value !== null) {
            inputs[field] = value;
        }
    });

    console.log(`📝 Inputs de climatização coletados: ${Object.keys(inputs).length}`);
    return inputs;
}

/**
 * Extrai dados de ganhos térmicos de uma sala
 */
function extractThermalGainsData(roomElement) {
    const gains = {};
    const roomId = roomElement.dataset.roomId;
    
    if (!roomId) {
        console.error('❌ ID da sala inválido para extração de ganhos térmicos');
        return gains;
    }
    
    const totalSelectors = {
        'total-ganhos-w': `#total-ganhos-w-${roomId}`,
        'total-tr': `#total-tr-${roomId}`,
        'total-externo': `#total-externo-${roomId}`,
        'total-divisoes': `#total-divisoes-${roomId}`,
        'total-piso': `#total-piso-${roomId}`,
        'total-iluminacao': `#total-iluminacao-${roomId}`,
        'total-dissi': `#total-dissi-${roomId}`,
        'total-pessoas': `#total-pessoas-${roomId}`,
        'total-ar-sensivel': `#total-ar-sensivel-${roomId}`,
        'total-ar-latente': `#total-ar-latente-${roomId}`
    };
    
    Object.entries(totalSelectors).forEach(([key, selector]) => {
        try {
            const element = document.querySelector(selector);
            if (element) {
                let value = element.textContent || '';
                if (value && value.trim() !== '') {
                    value = value.replace(/<[^>]*>/g, '').trim();
                    const numericMatch = value.match(/-?\d+(?:[.,]\d+)?/);
                    
                    if (numericMatch) {
                        const numericValue = parseFloat(numericMatch[0].replace(',', '.'));
                        gains[key] = isNaN(numericValue) ? 0 : numericValue;
                    } else {
                        gains[key] = 0;
                    }
                } else {
                    gains[key] = 0;
                }
            } else {
                gains[key] = 0;
            }
        } catch (error) {
            console.error(`💥 Erro ao processar ${selector}:`, error);
            gains[key] = 0;
        }
    });
    
    console.log(`🔥 ${Object.keys(gains).length} ganhos térmicos coletados`);
    return gains;
}

/**
 * Extrai dados de capacidade de refrigeração de uma sala
 */
function extractCapacityData(roomElement) {
    const capacityData = {};
    const roomId = roomElement.dataset.roomId;

    if (!roomId) {
        console.error('❌ ID da sala inválido para extração de capacidade');
        return capacityData;
    }

    try {
        const specificSelectors = {
            fatorSeguranca: `#fator-seguranca-${roomId}`,
            capacidadeUnitaria: `#capacidade-unitaria-${roomId}`,
            solucao: `#solucao-${roomId}`,
            solucaoBackup: `#solucao-backup-${roomId}`,
            totalCapacidade: `#total-capacidade-${roomId}`,
            folga: `#folga-${roomId}`
        };

        Object.entries(specificSelectors).forEach(([key, selector]) => {
            const element = roomElement.querySelector(selector);
            if (element) {
                let value = element.textContent || element.value;
                if (key === 'folga' && typeof value === 'string') {
                    value = value.replace('%', '');
                }
                
                if (value && !isNaN(value.replace(',', '.'))) {
                    value = parseFloat(value.replace(',', '.'));
                }
                
                capacityData[key] = value;
            }
        });

        const backupSelect = roomElement.querySelector('.backup-select');
        if (backupSelect) {
            capacityData.backup = backupSelect.value;
        }

        console.log(`❄️ Dados de capacidade coletados: ${Object.keys(capacityData).length}`);
        return capacityData;

    } catch (error) {
        console.error(`❌ Erro ao extrair dados de capacidade da sala ${roomId}:`, error);
        return capacityData;
    }
}

/**
 * Extrai dados de configuração de instalação de uma sala
 */
function extractConfigurationData(roomElement) {
    const config = { opcoesInstalacao: [] };
    
    if (!roomElement?.dataset.roomId) {
        console.error('❌ Elemento da sala inválido para extração de configuração');
        return config;
    }
    
    const opcoesInstalacaoCheckboxes = roomElement.querySelectorAll('input[name^="opcoesInstalacao-"][type="checkbox"]');
    
    opcoesInstalacaoCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            config.opcoesInstalacao.push(checkbox.value);
        }
    });
    
    console.log(`⚙️ ${config.opcoesInstalacao.length} opções de instalação coletadas`);
    return config;
}

// EXPORTS NO FINAL
export {
    extractRoomData,
    extractClimatizationInputs,
    extractThermalGainsData,
    extractCapacityData,
    extractConfigurationData
};