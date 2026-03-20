/**
 * data/utils/data-utils.js
 * Utilitários de dados unificados
 * Sistema completo de IDs, numeração, nomeação e utilitários
 */

import { 
    safeNumber} from './core-utils.js';


// =============================================================================
// FUNÇÕES DE NUMERAÇÃO (De data-utils-core.js)
// =============================================================================

/**
 * Obtém o próximo número de projeto disponível PARA UMA OBRA ESPECÍFICA - 
 * @param {string} obraId - ID único da obra
 * @returns {number} Próximo número disponível para projeto na obra específica
 */
function getNextProjectNumber(obraId) {
    try {
        //  Buscar apenas projetos DESTA obra específica
        const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraBlock) {
            console.warn(` Obra ${obraId} não encontrada, usando projeto 1`);
            return 1;
        }

        const projectBlocks = obraBlock.querySelectorAll('.project-block');
        let maxNumber = 0;

        projectBlocks.forEach(project => {
            const projectName = project.dataset.projectName || 
                             project.querySelector('.project-title')?.textContent || '';
            
            if (projectName) {
                // Suporta: "Projeto1", "Projeto 2", "Projeto-3", etc.
                const match = projectName.match(/Projeto\s*[-_]?\s*(\d+)/i);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxNumber) maxNumber = num;
                }
            }
        });

        console.log(` Next project number for obra ${obraId}: ${maxNumber + 1} (max found: ${maxNumber})`);
        return maxNumber + 1;

    } catch (error) {
        console.error(' Erro em getNextProjectNumber:', error);
        return 1; // Fallback seguro
    }
}

/**
 * Obtém o próximo número de sala - 
 * @param {string} projectId - ID do projeto
 * @returns {number} Próximo número disponível para sala
 */
function getNextRoomNumber(projectId) {
    try {
        const projectBlock = document.querySelector(`[data-project-id="${projectId}"]`);
        if (!projectBlock) {
            console.warn(` Projeto ${projectId} não encontrado, usando sala 1`);
            return 1;
        }

        const roomBlocks = projectBlock.querySelectorAll('.room-block');
        let maxNumber = 0;

        roomBlocks.forEach(room => {
            const roomName = room.dataset.roomName || 
                          room.querySelector('.room-title')?.textContent || '';

            if (roomName) {
                // Suporta: "Sala1", "Sala 2", "Sala-3", etc.
                const match = roomName.match(/Sala\s*[-_]?\s*(\d+)/i);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxNumber) maxNumber = num;
                }
            }
        });

        console.log(` Next room number for project ${projectId}: ${maxNumber + 1}`);
        return maxNumber + 1;

    } catch (error) {
        console.error(' Erro em getNextRoomNumber:', error);
        return 1; // Fallback seguro
    }
}

/**
 * Obtém o próximo número de obra disponível
 * @returns {number} Próximo número disponível para obra
 */
function getNextObraNumber() {
    try {
        const obraBlocks = document.querySelectorAll('.obra-block');
        let maxNumber = 0;

        obraBlocks.forEach(obra => {
            const obraName = obra.dataset.obraName || 
                          obra.querySelector('.obra-title')?.textContent || '';
            
            if (obraName) {
                // Suporta: "Obra1", "Obra 2", "Obra-3", etc.
                const match = obraName.match(/Obra\s*[-_]?\s*(\d+)/i);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxNumber) maxNumber = num;
                }
            }
        });

        console.log(` Next obra number: ${maxNumber + 1} (max found: ${maxNumber})`);
        return maxNumber + 1;

    } catch (error) {
        console.error(' Erro em getNextObraNumber:', error);
        return 1; // Fallback seguro
    }
}

// =============================================================================
// FUNÇÕES DE NOMEAÇÃO (De data-utils-core.js)
// =============================================================================

/**
 * Obtém o ID completo da sala no formato correto
 * @param {HTMLElement} roomElement - Elemento da sala
 * @returns {string} ID completo da sala
 */
function getRoomFullId(roomElement) {
    const roomId = roomElement.dataset.roomId;
    
    if (!roomId || roomId === 'undefined' || roomId === 'null' || roomId.includes('undefined')) {
        console.error(`ERRO FALBACK (getRoomFullId) [Room ID inválido: ${roomId}]`);
        return generateSecureId('sala');
    }
    
    console.log(` ID da sala obtido do data attribute: ${roomId}`);
    return roomId;
}

/**
 * Obtém o nome da obra a partir do elemento - 
 * @param {HTMLElement} obraElement - Elemento da obra
 * @returns {string} Nome da obra
 */
function getObraName(obraElement) {
    if (!obraElement) {
        console.error(`ERRO FALBACK (getObraName) [Elemento da obra não fornecido]`);
        return 'Obra_Erro';
    }

    const titleElement = obraElement.querySelector('.obra-title');
    if (titleElement) {
        const name = titleElement.textContent || titleElement.innerText || '';
        const trimmedText = name.trim();
        if (trimmedText && trimmedText !== 'Obra') {
            return trimmedText;
        }
    }
    
    const obraNameFromData = obraElement.dataset.obraName;
    if (obraNameFromData && obraNameFromData !== 'undefined' && obraNameFromData !== 'null') {
        return obraNameFromData;
    }
    
    console.error(`ERRO FALBACK (getObraName) [Nome da obra não encontrado]`);
    return 'Obra_Erro';
}

/**
 * Obtém o nome do projeto a partir do elemento - 
 * @param {HTMLElement} projectElement - Elemento do projeto
 * @returns {string} Nome do projeto
 */
function getProjectName(projectElement) {
    if (!projectElement) {
        console.error(`ERRO FALBACK (getProjectName) [Elemento do projeto não fornecido]`);
        return 'Projeto_Erro';
    }

    const titleElement = projectElement.querySelector('.project-title');
    if (titleElement) {
        const titleText = titleElement.textContent || titleElement.innerText || '';
        const trimmedText = titleText.trim();
        if (trimmedText && trimmedText !== 'Projeto') {
            console.log(` Nome do projeto obtido do título: "${trimmedText}"`);
            return trimmedText;
        }
    }
    
    const projectNameFromData = projectElement.dataset.projectName;
    if (projectNameFromData && projectNameFromData !== 'undefined' && projectNameFromData !== 'null' && projectNameFromData !== 'Projeto') {
        console.log(` Nome do projeto obtido do data attribute: "${projectNameFromData}"`);
        return projectNameFromData;
    }
    
    console.error(`ERRO FALBACK (getProjectName) [Nome do projeto não encontrado]`);
    return 'Projeto_Erro';
}

/**
 * Obtém o nome da sala a partir do elemento - 
 * @param {HTMLElement} roomElement - Elemento da sala
 * @returns {string} Nome da sala
 */
function getRoomName(roomElement) {
    if (!roomElement) {
        console.error(`ERRO FALBACK (getRoomName) [Elemento da sala não fornecido]`);
        return 'Sala_Erro';
    }

    const titleElement = roomElement.querySelector('.room-title');
    if (titleElement) {
        const name = titleElement.textContent || titleElement.value || titleElement.getAttribute('value') || '';
        const trimmedName = name.trim();
        if (trimmedName) return trimmedName;
    }
    
    const roomNameFromData = roomElement.dataset.roomName;
    if (roomNameFromData && roomNameFromData !== 'undefined' && roomNameFromData !== 'null') {
        return roomNameFromData;
    }
    
    const roomId = roomElement.dataset.roomId;
    if (roomId && roomId !== 'undefined' && roomId !== 'null') {
        return `Sala ${roomId.split('_').pop()}`;
    }
    
    console.error(`ERRO FALBACK (getRoomName) [Nome da sala não encontrado]`);
    return 'Sala_Erro';
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS (De data-utils-core.js)
// =============================================================================

/**
 * Extrai número de um texto, convertendo vírgula para ponto decimal
 * @param {string} text - Texto contendo número
 * @returns {number|null} Número extraído ou null se não encontrado
 */
function extractNumberFromText(text) {
    if (!text) return null;
    
    const numberMatch = text.match(/-?\d+(?:[.,]\d+)?/);
    if (numberMatch) {
        const numericString = numberMatch[0].replace(',', '.');
        const numericValue = parseFloat(numericString);
        return isNaN(numericValue) ? null : numericValue;
    }
    
    return null;
}

/**
 * Obtém o nome da máquina a partir do elemento
 * @param {HTMLElement} machineElement - Elemento da máquina
 * @param {string} machineId - ID da máquina
 * @returns {string} Nome da máquina
 */
function getMachineName(machineElement, machineId) {
    const titleElement = machineElement.querySelector('.machine-title-editable');
    if (!titleElement) return `Máquina ${machineId}`;
    
    const name = titleElement.value || titleElement.textContent || titleElement.getAttribute('value') || `Máquina ${machineId}`;
    return name.trim() || `Máquina${machineId}`;
}

/**
 * Converte texto de preço em número
 * @param {string} priceText - Texto do preço no formato "R$ X.XXX,XX"
 * @returns {number} Valor numérico do preço
 */
function parseMachinePrice(priceText) {
    if (!priceText || priceText === 'R$ 0,00') return 0;
    
    try {
        const cleaned = priceText.replace('R$', '')
                                .replace(/\./g, '')
                                .replace(',', '.')
                                .trim();
        return parseFloat(cleaned) || 0;
    } catch (error) {
        console.error(' Erro ao converter preço:', priceText, error);
        return 0;
    }
}

/**
 * Função de debug para mostrar todos os elementos de ganhos térmicos disponíveis
 * @param {HTMLElement} roomElement - Elemento da sala para debug
 * @returns {void}
 */
function debugThermalGainsElements(roomElement) {
    const roomFullId = getRoomFullId(roomElement);
    console.log(' DEBUG: Todos os elementos de ganhos térmicos disponíveis:');
    
    //   Incluir os novos IDs de TR
    const selectors = [
        'total-ganhos-w', 'total-tr-aprox', 'total-tr-exato', 'total-externo', 'total-divisoes',
        'total-piso', 'total-iluminacao', 'total-dissi', 'total-pessoas',
        'total-ar-sensivel', 'total-ar-latente'
    ];
    
    selectors.forEach(selector => {
        const element = document.querySelector(`#${selector}-${roomFullId}`);
        console.log(` ${selector}-${roomFullId}:`, element ? `ENCONTRADO - "${element.textContent}"` : 'NÃO ENCONTRADO');
    });
}



/**
 * Verifica se os elementos de TR estão corretamente configurados
 * @param {string} roomId - ID da sala
 * @returns {boolean} True se ambos os elementos existem
 */
function validateTRElements(roomId) {
    const elementAprox = document.getElementById(`total-tr-aprox-${roomId}`);
    const elementExato = document.getElementById(`total-tr-exato-${roomId}`);
    
    const isValid = !!(elementAprox && elementExato);
    
    if (!isValid) {
        console.warn(` [TR VALIDATE] Elementos de TR incompletos para sala ${roomId}:`, {
            aprox: !!elementAprox,
            exato: !!elementExato
        });
    } else {
        console.log(` [TR VALIDATE] Elementos de TR válidos para sala ${roomId}`);
    }
    
    return isValid;
}

// =============================================================================
// FUNÇÕES DE COLETA DE DADOS (De helpers.js)
// =============================================================================

/**
 * Coleta dados de entrada da interface para processamento de climatização
 * @param {HTMLElement} climaSection - Elemento HTML da seção de climatização
 * @param {string} roomId - ID único da sala (formato: obra_w12_proj_t34_1_sala_r21_1)
 * @returns {Object} Dados coletados dos inputs
 */
function collectClimatizationInputs(climaSection, roomId) {
    console.log(`  Coletando inputs para sala: ${roomId}`);
    
    const inputs = climaSection.querySelectorAll(".clima-input, input[data-field], select[data-field]");
    const data = {};

    inputs.forEach((input) => {
        const field = input.dataset.field;
        let value;
        
        //  Tratar diferentes tipos de input
        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'number' || input.type === 'text') {
            value = input.value !== "" ? (input.type === 'number' ? Number.parseFloat(input.value) : input.value) : "";
        } else if (input.tagName === 'SELECT') {
            value = input.value !== "" ? input.value : "";
        }
        
        if (field) {
            data[field] = value;
        }
    });

    //  Coletar estado da pressurização dos RADIO BUTTONS
    if (data.pressurizacao === undefined) {
        const radioSim = climaSection.querySelector('input[type="radio"][value="sim"]');
        const radioNao = climaSection.querySelector('input[type="radio"][value="nao"]');
        
        // Se o radio "sim" estiver marcado, pressurização está ativa
        data.pressurizacao = radioSim ? radioSim.checked : false;
        
        console.log(`  Estado da pressurização:`, {
            radioSimChecked: radioSim?.checked,
            radioNaoChecked: radioNao?.checked,
            pressurizacao: data.pressurizacao
        });
    }
    
    //  Garantir que setpointTemp esteja presente
    if (data.setpointTemp === undefined) {
        const setpointInput = climaSection.querySelector('input[data-field="setpointTemp"]');
        data.setpointTemp = setpointInput ? safeNumber(setpointInput.value) : 0;
    }

    //  Garantir que pressurizacaoSetpoint esteja presente
    if (data.pressurizacaoSetpoint === undefined) {
        const pressurizacaoInput = climaSection.querySelector('input[data-field="pressurizacaoSetpoint"]');
        data.pressurizacaoSetpoint = pressurizacaoInput ? safeNumber(pressurizacaoInput.value) : 0;
        
        console.log(`  Valor da pressurização:`, {
            pressurizacaoSetpoint: data.pressurizacaoSetpoint,
            inputValue: pressurizacaoInput?.value
        });
    }

    console.log(`  ${Object.keys(data).length} dados coletados para ${roomId}:`, data);
    return data;
}

/**
 * Encontra a seção de climatização de uma sala pelo ID único
 * @param {string} roomId - ID único da sala
 * @returns {HTMLElement|null} Elemento da seção de climatização
 */
function findClimatizationSection(roomId) {
    //  Buscar APENAS por ID único
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (!roomElement) {
        console.error(`  Sala não encontrada: ${roomId}`);
        return null;
    }
    
    const climaSection = roomElement.querySelector('#section-content-' + roomId + '-clima');
    if (!climaSection) {
        console.error(`  Seção de climatização não encontrada para: ${roomId}`);
        return null;
    }
    
    console.log(`  Seção encontrada para: ${roomId}`);
    return climaSection;
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

export {
    // Sistema de Numeração
    getNextProjectNumber,
    getNextRoomNumber,
    getNextObraNumber,
    
    // Funções de Nomeação
    getRoomFullId,
    getObraName,
    getProjectName,
    getRoomName,
    
    // Utilitários Gerais
    extractNumberFromText,
    getMachineName,
    parseMachinePrice,
    debugThermalGainsElements,
    validateTRElements, //  NOVA: Validação dos elementos
    
    // Coleta de Dados
    collectClimatizationInputs,
    findClimatizationSection,
};

// Disponibilização global para compatibilidade
if (typeof window !== 'undefined') {
    // Sistema de numeração
    window.getNextProjectNumber = getNextProjectNumber;
    window.getNextRoomNumber = getNextRoomNumber;
    window.getNextObraNumber = getNextObraNumber;
    
    // Utilitários
    window.getRoomFullId = getRoomFullId;
    window.debugThermalGainsElements = debugThermalGainsElements;
    window.validateTRElements = validateTRElements; //  NOVA
}
