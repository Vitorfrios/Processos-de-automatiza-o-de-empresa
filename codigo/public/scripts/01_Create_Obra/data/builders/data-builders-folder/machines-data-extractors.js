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
        quantidade: 1,
        aplicacao_machines: '', // 🆕 NOVO CAMPO PARA APLICAÇÃO
        precoBase: 0,
        opcoesSelecionadas: [],
        configuracoesSelecionadas: [],
        precoTotal: 0,
        potenciaSelecionada: machineElement.querySelector('.machine-power-select')?.value || '',
        tipoSelecionado: machineElement.querySelector('.machine-type-select')?.value || ''
    };

    try {
        // Quantidade
        const qntInput = machineElement.querySelector('.machine-qnt-input');
        if (qntInput) {
            machineData.quantidade = parseInt(qntInput.value) || 1;
        }

        // 🆕 Aplicação da máquina
        const aplicacaoSelect = machineElement.querySelector('.machine-aplicacao-select');
        if (aplicacaoSelect) {
            machineData.aplicacao_machines = aplicacaoSelect.value || '';
            console.log(`✅ Aplicação extraída: ${machineData.aplicacao_machines}`);
        }

        // Preço base (unitário)
        const basePriceElement = document.getElementById(`base-price-${machineId}`);
        if (basePriceElement) {
            machineData.precoBase = parseMachinePrice(basePriceElement.textContent);
        }

        // Opções selecionadas
        const selectedOptions = [];
        const optionCheckboxes = machineElement.querySelectorAll('#options-container-' + machineId + ' input[type="checkbox"]:checked');
        
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

        // Configurações selecionadas
        const selectedConfigs = [];
        const configCheckboxes = machineElement.querySelectorAll('#config-container-' + machineId + ' input[type="checkbox"]:checked');
        
        configCheckboxes.forEach((checkbox, index) => {
            const configId = checkbox.getAttribute('data-config-id') || (index + 1).toString();
            const configName = checkbox.getAttribute('data-config-name') || `Configuração ${configId}`;
            
            selectedConfigs.push({
                id: parseInt(configId) || (index + 1),
                nome: configName,
            });
        });

        machineData.configuracoesSelecionadas = selectedConfigs;

        // Preço total
        const totalPriceElement = document.getElementById(`total-price-${machineId}`);
        if (totalPriceElement) {
            machineData.precoTotal = parseMachinePrice(totalPriceElement.textContent);
        } else {
            // Calcula manualmente se não tiver elemento
            const basePriceUnitario = machineData.precoBase;
            const optionsTotal = selectedOptions.reduce((sum, option) => sum + option.value, 0);
            machineData.precoTotal = (basePriceUnitario + optionsTotal) * machineData.quantidade;
        }

        console.log(`✅ Máquina ${machineId} extraída:`, {
            nome: machineData.nome,
            tipo: machineData.tipo,
            aplicacao_machines: machineData.aplicacao_machines,
            potencia: machineData.potencia,
            quantidade: machineData.quantidade,
            precoBase: machineData.precoBase,
            opcoes: machineData.opcoesSelecionadas.length,
            configuracoes: machineData.configuracoesSelecionadas.length,
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