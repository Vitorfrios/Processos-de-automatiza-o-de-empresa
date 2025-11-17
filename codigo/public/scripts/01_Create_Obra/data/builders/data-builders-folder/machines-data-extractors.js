import { getMachineName, parseMachinePrice } from '../../utils/data-utils.js';

/**
 * Extrai dados das máquinas de climatização de uma sala
 */
function extractMachinesData(roomElement) {
    const machines = [];
    
    if (!roomElement?.dataset.roomId) {
        console.error('❌ Elemento da sala inválido para extração de máquinas');
        return machines;
    }
    
    const machineElements = roomElement.querySelectorAll('.climatization-machine');
    
    machineElements.forEach(machineElement => {
        const machineData = extractClimatizationMachineData(machineElement);
        if (machineData) {
            machines.push(machineData);
        }
    });
    
    console.log(`🤖 ${machines.length} máquina(s) extraída(s) da sala ${roomElement.dataset.roomId}`);
    return machines;
}

/**
 * Extrai dados de uma máquina de climatização individual
 */
function extractClimatizationMachineData(machineElement) {
    if (!machineElement) {
        console.error('❌ Elemento da máquina é nulo');
        return null;
    }

    const machineId = machineElement.getAttribute('data-machine-id') || `machine-${Date.now()}`;
    const roomId = machineElement.getAttribute('data-room-id');

    console.log(`🔧 Extraindo dados da máquina ${machineId} na sala ${roomId}`);

    const machineData = {
        nome: getMachineName(machineElement, machineId),
        tipo: machineElement.querySelector('.machine-type-select')?.value || '',
        potencia: machineElement.querySelector('.machine-power-select')?.value || '',
        tensao: machineElement.querySelector('.machine-voltage-select')?.value || '',
        precoBase: 0,
        opcoesSelecionadas: [],
        precoTotal: 0,
        potenciaSelecionada: machineElement.querySelector('.machine-power-select')?.value || '',
        tipoSelecionado: machineElement.querySelector('.machine-type-select')?.value || ''
    };

    try {
        // Preço base
        const basePriceElement = document.getElementById(`base-price-${machineId}`);
        if (basePriceElement) {
            machineData.precoBase = parseMachinePrice(basePriceElement.textContent);
        }

        // Opções selecionadas
        const selectedOptions = [];
        const optionCheckboxes = machineElement.querySelectorAll('input[type="checkbox"]:checked');
        
        optionCheckboxes.forEach((checkbox, index) => {
            const optionId = checkbox.getAttribute('data-option-id') || (index + 1).toString();
            const optionValue = parseFloat(checkbox.value) || 0;
            const optionName = checkbox.getAttribute('data-option-name') || `Opção ${optionId}`;
            
            selectedOptions.push({
                id: parseInt(optionId) || (index + 1),
                name: optionName.replace(/\s*R\$\s*[\d.,]+/, '').trim(),
                value: optionValue,
                originalName: optionName,
                potenciaAplicada: machineData.potencia
            });
        });

        machineData.opcoesSelecionadas = selectedOptions;

        // Preço total
        const totalPriceElement = document.getElementById(`total-price-${machineId}`);
        if (totalPriceElement) {
            machineData.precoTotal = parseMachinePrice(totalPriceElement.textContent);
        } else {
            machineData.precoTotal = machineData.precoBase + 
                selectedOptions.reduce((sum, option) => sum + option.value, 0);
        }

        console.log(`✅ Máquina ${machineId} extraída:`, {
            nome: machineData.nome,
            tipo: machineData.tipo,
            potencia: machineData.potencia,
            precoBase: machineData.precoBase,
            opcoes: machineData.opcoesSelecionadas.length,
            precoTotal: machineData.precoTotal
        });

        return machineData;

    } catch (error) {
        console.error(`❌ Erro ao extrair dados da máquina ${machineId}:`, error);
        return machineData;
    }
}

// EXPORTS NO FINAL
export {
    extractMachinesData,
    extractClimatizationMachineData
};