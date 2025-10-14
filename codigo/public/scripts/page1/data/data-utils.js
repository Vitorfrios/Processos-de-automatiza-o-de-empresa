/**
 * Utilitários para extração e construção de dados - CORRIGIDO
 */

/**
 * Constrói o objeto de dados completo de um projeto a partir do HTML
 * @param {string|HTMLElement} projectIdOrElement - ID do projeto ou elemento do projeto
 * @returns {Object} Dados completos do projeto
 */
function buildProjectData(projectIdOrElement) {
    let projectElement;
    
    if (typeof projectIdOrElement === 'string') {
        projectElement = document.querySelector(`[data-project-name="${projectIdOrElement}"]`);
        if (!projectElement) {
            projectElement = document.getElementById(projectIdOrElement);
        }
    } else if (projectIdOrElement instanceof HTMLElement) {
        projectElement = projectIdOrElement;
    } else {
        console.error('❌ Tipo inválido para projectIdOrElement:', typeof projectIdOrElement, projectIdOrElement);
        return null;
    }

    if (!projectElement) {
        console.error('❌ Elemento do projeto não encontrado:', projectIdOrElement);
        return null;
    }

    const projectName = projectElement.dataset.projectName || projectElement.id;
    const projectId = projectElement.dataset.projectId;

    const shouldGenerateNewId = !projectId || 
                               projectId === '' || 
                               projectId === 'undefined' || 
                               projectId === 'null' ||
                               projectId.startsWith('temp-') ||
                               projectId.startsWith('Projeto');

    const projectData = {
        id: shouldGenerateNewId ? null : projectId,
        nome: getProjectName(projectElement),
        salas: [],
        timestamp: new Date().toISOString()
    };

    // IDs sequenciais simples (1, 2, 3...)
    const roomElements = projectElement.querySelectorAll('.room-block');
    console.log(`🔍 Encontradas ${roomElements.length} salas no projeto`);
    
    roomElements.forEach((roomElement, index) => {
        // Número sequencial começando em 1
        const roomNumber = index + 1;
        
        const roomData = extractRoomData(roomElement, roomNumber);
        if (roomData) {
            projectData.salas.push(roomData);
            console.log(`✅ Sala ${roomNumber} adicionada`);
        } else {
            console.warn(`⚠️ Sala ${roomNumber} ignorada`);
        }
    });

    console.log('📦 Dados do projeto construídos:', projectData);
    return projectData;
}


/**
 * Obtém o nome do projeto de forma segura 
 */
function getProjectName(projectElement) {
    
    const titleElement = projectElement.querySelector('.project-title');
    
    if (titleElement) {
        
        const titleText = titleElement.textContent || titleElement.innerText || '';
        const trimmedText = titleText.trim();
        
        if (trimmedText) {
            
            const projectMatch = trimmedText.match(/Projeto\s*(\d*)/i);
            if (projectMatch) {
                const number = projectMatch[1] || '1';
                return `Projeto${number}`; 
            }
            return trimmedText; 
        }
    }
    
    
    const projectNameFromData = projectElement.dataset.projectName;
    if (projectNameFromData) {
        const projectMatch = projectNameFromData.match(/Projeto\s*(\d*)/i);
        if (projectMatch) {
            const number = projectMatch[1] || '1';
            return `Projeto${number}`;
        }
        return projectNameFromData;
    }
    
    
    const allProjects = document.querySelectorAll('.project-block');
    const projectNumber = allProjects.length > 0 ? allProjects.length : 1;
    return `Projeto${projectNumber}`;
}

/**
 * Extrai todos os dados de uma sala a partir do elemento HTML
 * @param {HTMLElement} roomElement - Elemento da sala
 * @param {number} roomNumber - Número sequencial da sala (1, 2, 3...)
 * @returns {Object} Dados completos da sala
 */
function extractRoomData(roomElement, roomNumber) {
    if (!roomElement) {
        console.error('❌ Elemento da sala é nulo');
        return null;
    }

    // ID sempre numérico sequencial
    const roomId = roomNumber.toString();

    const roomData = {
        id: roomId,
        nome: getRoomName(roomElement) || `Sala ${roomId}`,
        inputs: {},
        maquinas: [],
        capacidade: {},
        ganhosTermicos: {},
        configuracao: {}
    };

    try {
        // 1. Extrai inputs de climatização
        const climaInputs = roomElement.querySelectorAll('.climatization-input');
        climaInputs.forEach(input => {
            const name = input.name || input.id;
            const value = input.type === 'checkbox' ? input.checked : input.value;
            if (name && value !== undefined && value !== '') {
                roomData.inputs[name] = value;
            }
        });

        // 2. Extrai dados de capacidade
        const capacityData = extractCapacityData(roomElement);
        if (capacityData && Object.keys(capacityData).length > 0) {
            roomData.capacidade = capacityData;
        }

        // 3. Extrai máquinas de climatização
        const machineElements = roomElement.querySelectorAll('.climatization-machine');
        machineElements.forEach(machineElement => {
            const machineData = extractClimatizationMachineData(machineElement);
            if (machineData) {
                roomData.maquinas.push(machineData);
            }
        });

        // 4. Extrai ganhos térmicos
        const thermalElements = roomElement.querySelectorAll('.thermal-result, .thermal-value');
        thermalElements.forEach(element => {
            const name = element.id || element.className;
            const value = element.textContent || element.value;
            if (name && value) {
                roomData.ganhosTermicos[name] = value;
            }
        });

        console.log(`📊 Dados extraídos da sala ${roomId}:`, roomData);
        return roomData;

    } catch (error) {
        console.error(`❌ Erro ao extrair dados da sala ${roomId}:`, error);
        // Retorna dados básicos mesmo com erro
        return {
            id: roomId,
            nome: getRoomName(roomElement) || `Sala ${roomId}`,
            inputs: {},
            maquinas: [],
            capacidade: {},
            ganhosTermicos: {},
            configuracao: {},
            erro: error.message
        };
    }
}





/**
 * Obtém o nome da sala de forma segura
 */
function getRoomName(roomElement) {
    const titleElement = roomElement.querySelector('.room-title');
    if (titleElement) {
        const name = titleElement.textContent || titleElement.value || titleElement.getAttribute('value');
        if (name && name.trim() !== '') return name.trim();
    }
    

    return null;
}

/**
 * Extrai dados de capacidade de refrigeração de uma sala
 * @param {HTMLElement} roomElement - Elemento da sala
 * @returns {Object} Dados de capacidade
 */
function extractCapacityData(roomElement) {
    const roomId = roomElement.id.replace('room-content-', '');
    const capacityData = {};

    try {
        // Fator de segurança
        const fatorSeguranca = document.getElementById(`fator-seguranca-${roomId}`);
        if (fatorSeguranca) {
            capacityData.fatorSeguranca = safeNumber(fatorSeguranca.value);
        }

        // Capacidade unitária
        const capacidadeUnitaria = document.getElementById(`capacidade-unitaria-${roomId}`);
        if (capacidadeUnitaria) {
            capacityData.capacidadeUnitaria = capacidadeUnitaria.value;
        }

        // Configuração de backup
        const backupConfig = document.getElementById(`backup-config-${roomId}`);
        if (backupConfig) {
            capacityData.backupConfig = backupConfig.value;
        }

        // Número de unidades
        const numUnidades = document.getElementById(`num-unidades-${roomId}`);
        if (numUnidades) {
            capacityData.numUnidades = safeNumber(numUnidades.value);
        }

        // Resultados calculados
        const capacidadeNecessaria = document.getElementById(`capacidade-necessaria-${roomId}`);
        if (capacidadeNecessaria) {
            capacityData.capacidadeNecessaria = parseMachinePrice(capacidadeNecessaria.textContent);
        }

        const capacidadeEfetiva = document.getElementById(`capacidade-efetiva-${roomId}`);
        if (capacidadeEfetiva) {
            capacityData.capacidadeEfetiva = parseMachinePrice(capacidadeEfetiva.textContent);
        }

        return capacityData;

    } catch (error) {
        console.error(`❌ Erro ao extrair dados de capacidade da sala ${roomId}:`, error);
        return capacityData;
    }
}

/**
 * Extrai dados de uma máquina de climatização individual
 * @param {HTMLElement} machineElement - Elemento da máquina
 * @returns {Object} Dados da máquina
 */
function extractClimatizationMachineData(machineElement) {
    const machineIndex = machineElement.getAttribute('data-machine-index');
    
    const machineData = {
        nome: getMachineName(machineElement, machineIndex),
        tipo: machineElement.querySelector('.machine-type-select')?.value || '',
        potencia: machineElement.querySelector('.machine-power-select')?.value || '',
        tensao: machineElement.querySelector('.machine-voltage-select')?.value || '',
        precoBase: 0,
        opcoesSelecionadas: [],
        precoTotal: 0
    };

    try {
        // Preço base
        const basePriceElement = document.getElementById(`base-price-${machineIndex}`);
        if (basePriceElement) {
            machineData.precoBase = parseMachinePrice(basePriceElement.textContent);
        }

        // Preço total
        const totalPriceElement = document.getElementById(`total-price-${machineIndex}`);
        if (totalPriceElement) {
            machineData.precoTotal = parseMachinePrice(totalPriceElement.textContent);
        }

        // Opções selecionadas
        const optionsContainer = document.getElementById(`options-container-${machineIndex}`);
        if (optionsContainer) {
            const selectedOptions = optionsContainer.querySelectorAll('input[type="checkbox"]:checked');
            selectedOptions.forEach(option => {
                const optionId = option.getAttribute('data-option-id');
                const optionValue = parseFloat(option.value) || 0;
                const optionName = option.closest('.option-item')?.querySelector('.option-name')?.textContent || `Opção ${optionId}`;
                
                machineData.opcoesSelecionadas.push({
                    id: parseInt(optionId),
                    name: optionName,
                    value: optionValue
                });
            });
        }

        return machineData;

    } catch (error) {
        console.error(`❌ Erro ao extrair dados da máquina ${machineIndex}:`, error);
        return machineData;
    }
}

/**
 * Obtém o nome da máquina de forma segura
 */
function getMachineName(machineElement, machineIndex) {
    const titleElement = machineElement.querySelector('.machine-title-editable');
    if (!titleElement) return `Máquina ${machineIndex}`;
    
    return titleElement.value || titleElement.textContent || titleElement.getAttribute('value') || `Máquina ${machineIndex}`;
}

/**
 * Converte texto de preço em número
 * @param {string} priceText - Texto do preço (ex: "R$ 1.500,00")
 * @returns {number} Valor numérico
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
        console.error('❌ Erro ao converter preço:', priceText, error);
        return 0;
    }
}

/**
 * Função auxiliar para converter valores para número com segurança
 */
function safeNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value.toString().replace(',', '.'));
    return isNaN(num) ? 0 : num;
}

export {
    buildProjectData,
    extractRoomData,
    extractCapacityData,
    extractClimatizationMachineData,
    parseMachinePrice,
    safeNumber
}