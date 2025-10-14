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
            console.log(`✅ Sala ${roomNumber} adicionada:`, {
                nome: roomData.nome,
                inputs: Object.keys(roomData.inputs || {}).length,
                maquinas: roomData.maquinas.length,
                capacidade: Object.keys(roomData.capacidade || {}).length,
                ganhosTermicos: Object.keys(roomData.ganhosTermicos || {}).length,
                configuracao: Object.keys(roomData.configuracao || {}).length
            });
        } else {
            console.warn(`⚠️ Sala ${roomNumber} ignorada`);
        }
    });

    console.log('📦 Dados do projeto construídos:', projectData);
    return projectData;
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
        // 1. Extrai TODOS os inputs da sala (CORRIGIDO - foco em inputs de climatização)
        roomData.inputs = extractClimatizationInputs(roomElement);
        
        // 2. Extrai dados de capacidade
        roomData.capacidade = extractCapacityData(roomElement);
        
        // 3. Extrai máquinas de climatização
        const machineElements = roomElement.querySelectorAll('.climatization-machine');
        machineElements.forEach(machineElement => {
            const machineData = extractClimatizationMachineData(machineElement);
            if (machineData) {
                roomData.maquinas.push(machineData);
            }
        });

        // 4. Extrai ganhos térmicos
        roomData.ganhosTermicos = extractThermalGainsData(roomElement);
        
        // 5. Extrai configuração (CORRIGIDO - foco em opções de instalação)
        roomData.configuracao = extractConfigurationData(roomElement);

        console.log(`📊 Dados extraídos da sala ${roomId} "${roomData.nome}":`, {
            inputs: Object.keys(roomData.inputs).length,
            maquinas: roomData.maquinas.length,
            capacidade: Object.keys(roomData.capacidade).length,
            ganhosTermicos: Object.keys(roomData.ganhosTermicos).length,
            configuracao: Object.keys(roomData.configuracao).length
        });
        
        return roomData;

    } catch (error) {
        console.error(`❌ Erro ao extrair dados da sala ${roomId}:`, error);
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
 * Extrai inputs de climatização (CORRIGIDO - seletor compatível)
 */
function extractClimatizationInputs(roomElement) {
    const inputs = {};
    
    // Encontrar a seção de climatização de forma compatível
    let climaSection = null;
    const sections = roomElement.querySelectorAll('.section-block');
    
    for (const section of sections) {
        const title = section.querySelector('.section-title');
        if (title && title.textContent.includes('Climatização')) {
            climaSection = section;
            break;
        }
    }
    
    if (climaSection) {
        // Inputs de texto/número da tabela de inputs
        const textInputs = climaSection.querySelectorAll('input[type="text"], input[type="number"], select');
        textInputs.forEach(input => {
            const name = input.name || input.id || input.getAttribute('data-field');
            if (!name) return;
            
            let value = input.value;
            
            // Para selects, pegar o valor selecionado
            if (input.tagName === 'SELECT') {
                value = input.value;
            }
            
            // Só adiciona se tiver valor (incluindo zero)
            if (value !== undefined && value !== '' && value !== null) {
                // Limpar nome para ser mais genérico
                const cleanName = name.replace(/-\w+-\w+$/, ''); // Remove sufixos como "-Projeto1-Sala1"
                inputs[cleanName] = value;
            }
        });
        
        console.log(`📝 Inputs de climatização coletados: ${Object.keys(inputs).length}`, inputs);
    } else {
        console.warn('⚠️ Seção de climatização não encontrada');
        
        // Fallback: buscar inputs de climatização em toda a sala
        const fallbackInputs = roomElement.querySelectorAll('.clima-input, [data-field]');
        fallbackInputs.forEach(input => {
            const name = input.name || input.id || input.getAttribute('data-field');
            if (!name) return;
            
            let value = input.value;
            
            if (input.tagName === 'SELECT') {
                value = input.value;
            }
            
            if (value !== undefined && value !== '' && value !== null) {
                const cleanName = name.replace(/-\w+-\w+$/, '');
                inputs[cleanName] = value;
            }
        });
        
        console.log(`📝 Inputs de climatização (fallback): ${Object.keys(inputs).length}`, inputs);
    }
    
    return inputs;
}

/**
 * Extrai dados de configuração (CORRIGIDO para opções de instalação)
 */
function extractConfigurationData(roomElement) {
    const config = {
        opcoesInstalacao: []
    };
    
    console.log('🔍 Buscando configurações na sala...');
    
    // Busca ESPECÍFICA por opções de instalação (checkboxes com mesmo name)
    const opcoesInstalacaoCheckboxes = roomElement.querySelectorAll('input[name^="opcoesInstalacao-"][type="checkbox"]');
    
    console.log(`📋 Encontrados ${opcoesInstalacaoCheckboxes.length} checkboxes de opções de instalação`);
    
    opcoesInstalacaoCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const value = checkbox.value;
            config.opcoesInstalacao.push(value);
            console.log(`✅ Opção de instalação selecionada: ${value}`);
        }
    });
    
    // Busca por outras configurações (selects, radios, etc.)
    const otherConfigElements = roomElement.querySelectorAll(`
        .configuration-section input,
        .configuration-section select,
        .configuration-section textarea,
        [class*="config"] input,
        [class*="config"] select,
        [id*="config"] input,
        [id*="config"] select
    `);
    
    otherConfigElements.forEach(element => {
        // Pular opções de instalação que já foram processadas
        if (element.name && element.name.startsWith('opcoesInstalacao-')) {
            return;
        }
        
        const name = element.name || element.id || element.getAttribute('data-field');
        if (!name) return;
        
        let value;
        
        if (element.type === 'checkbox') {
            value = element.checked;
        } else if (element.type === 'radio') {
            if (element.checked) {
                value = element.value;
            } else {
                return;
            }
        } else {
            value = element.value;
        }
        
        if (value !== undefined && value !== '' && value !== null) {
            const cleanName = name.replace(/-\w+-\w+$/, '');
            config[cleanName] = value;
            console.log(`⚙️ Configuração ${cleanName}: ${value}`);
        }
    });
    
    console.log(`⚙️ Configurações coletadas:`, {
        opcoesInstalacao: config.opcoesInstalacao.length,
        outras: Object.keys(config).filter(key => key !== 'opcoesInstalacao').length
    }, config);
    
    return config;
}

/**
 * Extrai dados de ganhos térmicos
 */
function extractThermalGainsData(roomElement) {
    const gains = {};
    
    // Procura por elementos de resultados térmicos
    const thermalElements = roomElement.querySelectorAll('[id*="thermal"], [class*="thermal"], [id*="ganho"], [class*="ganho"]');
    
    thermalElements.forEach(element => {
        const id = element.id;
        let value = element.textContent || element.value;
        
        // Tenta extrair valor numérico do texto
        if (value && typeof value === 'string') {
            const numericMatch = value.match(/(\d+[.,]?\d*)/);
            if (numericMatch) {
                value = parseFloat(numericMatch[0].replace(',', '.'));
            }
        }
        
        if (id && value !== undefined && value !== '') {
            gains[id] = value;
        }
    });
    
    // Busca também por elementos específicos de resultados
    const resultElements = roomElement.querySelectorAll('.result-value, .calculated-value');
    resultElements.forEach(element => {
        const id = element.id;
        if (id && !gains[id]) {
            let value = element.textContent || element.value;
            if (value && typeof value === 'string') {
                const numericMatch = value.match(/(\d+[.,]?\d*)/);
                if (numericMatch) {
                    value = parseFloat(numericMatch[0].replace(',', '.'));
                    gains[id] = value;
                }
            }
        }
    });
    
    console.log(`🔥 Ganhos térmicos coletados: ${Object.keys(gains).length}`);
    return gains;
}

/**
 * Extrai dados de capacidade de refrigeração de uma sala
 */
function extractCapacityData(roomElement) {
    const capacityData = {};
    const roomId = roomElement.id.replace('room-content-', '');

    try {
        // Coleta todos os elementos de capacidade por seletor mais amplo
        const capacityElements = roomElement.querySelectorAll('[id*="capacidade"], [id*="fator"], [id*="backup"], [id*="unidade"]');
        
        capacityElements.forEach(element => {
            const id = element.id;
            let value = element.value || element.textContent;
            
            if (element.type === 'checkbox') {
                value = element.checked;
            }
            
            if (value !== undefined && value !== '') {
                // Converte para número se possível
                if (typeof value === 'string' && !isNaN(value.replace(',', '.'))) {
                    value = parseFloat(value.replace(',', '.'));
                }
                
                const cleanKey = id.replace(`-${roomId}`, '').replace('capacity-', '');
                capacityData[cleanKey] = value;
            }
        });

        // Dados específicos por ID (fallback)
        const specificSelectors = {
            fatorSeguranca: `#fator-seguranca-${roomId}, [name="fator-seguranca"]`,
            capacidadeUnitaria: `#capacidade-unitaria-${roomId}, [name="capacidade-unitaria"]`,
            backupConfig: `#backup-config-${roomId}, [name="backup-config"]`,
            numUnidades: `#num-unidades-${roomId}, [name="num-unidades"]`
        };

        Object.entries(specificSelectors).forEach(([key, selector]) => {
            const element = roomElement.querySelector(selector);
            if (element && !capacityData[key]) {
                let value = element.value || element.textContent;
                if (value) {
                    if (typeof value === 'string' && !isNaN(value.replace(',', '.'))) {
                        value = parseFloat(value.replace(',', '.'));
                    }
                    capacityData[key] = value;
                }
            }
        });

        console.log(`❄️ Dados de capacidade coletados: ${Object.keys(capacityData).length}`);
        return capacityData;

    } catch (error) {
        console.error(`❌ Erro ao extrair dados de capacidade da sala ${roomId}:`, error);
        return capacityData;
    }
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
 * Obtém o nome da sala de forma segura
 */
function getRoomName(roomElement) {
    const titleElement = roomElement.querySelector('.room-title');
    if (titleElement) {
        const name = titleElement.textContent || titleElement.value || titleElement.getAttribute('value');
        if (name && name.trim() !== '') return name.trim();
    }
    
    // Fallback para data attributes
    const roomNameFromData = roomElement.dataset.roomName;
    if (roomNameFromData) return roomNameFromData;
    
    return null;
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

        console.log(`🤖 Máquina ${machineIndex} extraída:`, {
            nome: machineData.nome,
            tipo: machineData.tipo,
            opcoes: machineData.opcoesSelecionadas.length,
            precoTotal: machineData.precoTotal
        });

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