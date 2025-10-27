/**
 * Utilitários para extração e construção de dados - CORRIGIDO para hierarquia Obra→Projeto→Sala
 * VERSÃO OTIMIZADA E TESTADA
 */

// Debug global
console.log('🔄 data-utils.js carregado - versão otimizada');

/**
 * Gera ID para obra (inicia em 1001, global)
 */
function generateObraId() {
    // Buscar todas as obras existentes no DOM
    const obras = document.querySelectorAll('.obra-block');
    const obraIds = Array.from(obras).map(obra => {
        const id = obra.dataset.obraId;
        return id ? parseInt(id) : 0;
    }).filter(id => id > 0);
    
    if (obraIds.length === 0) {
        return "1001"; // Primeira obra
    }
    
    const maxId = Math.max(...obraIds);
    return (maxId + 1).toString();
}

/**
 * Gera ID para projeto (reinicia por obra)
 */
function generateProjectId(obraElement) {
    // Buscar projetos dentro da obra específica
    const projects = obraElement.querySelectorAll('.project-block');
    const projectIds = Array.from(projects).map(project => {
        const id = project.dataset.projectId;
        return id ? parseInt(id) : 0;
    }).filter(id => id > 0);
    
    if (projectIds.length === 0) {
        return "1"; // Primeiro projeto na obra
    }
    
    const maxId = Math.max(...projectIds);
    return (maxId + 1).toString();
}

/**
 * Gera ID para sala (reinicia por projeto)
 */
function generateRoomId(projectElement) {
    // Buscar salas dentro do projeto específico
    const rooms = projectElement.querySelectorAll('.room-block');
    const roomIds = Array.from(rooms).map(room => {
        const id = room.dataset.roomId;
        return id ? parseInt(id) : 0;
    }).filter(id => id > 0);
    
    if (roomIds.length === 0) {
        return "1"; // Primeira sala no projeto
    }
    
    const maxId = Math.max(...roomIds);
    return (maxId + 1).toString();
}

/**
 * Obtém o ID completo da sala (ex: "Projeto1-Sala1")
 */
function getRoomFullId(roomElement) {
    // Tentar obter do data attribute primeiro
    const roomName = roomElement.dataset.roomName;
    const projectElement = roomElement.closest('.project-block');
    const projectName = projectElement ? getProjectName(projectElement) : 'Projeto1';
    
    if (roomName) {
        return `${projectName}-${roomName}`;
    }
    
    // Fallback: buscar elementos com IDs que contenham o padrão
    const possibleIds = [
        'total-ganhos-w-', 'total-tr-', 'total-externo-', 
        'total-divisoes-', 'total-piso-', 'total-iluminacao-'
    ];
    
    for (const prefix of possibleIds) {
        const element = document.querySelector(`[id^="${prefix}"]`);
        if (element) {
            const fullId = element.id.replace(prefix, '');
            if (fullId && fullId.includes('-')) {
                console.log(`🔍 ID completo detectado: ${fullId}`);
                return fullId;
            }
        }
    }
    
    // Último fallback
    return 'Projeto1-Sala1';
}

/**
 * Extrai número de um texto
 */
function extractNumberFromText(text) {
    if (!text) return null;
    
    // Buscar por padrões numéricos
    const numberMatch = text.match(/-?\d+(?:[.,]\d+)?/);
    if (numberMatch) {
        const numericString = numberMatch[0].replace(',', '.');
        const numericValue = parseFloat(numericString);
        return isNaN(numericValue) ? null : numericValue;
    }
    
    return null;
}

/**
 * Busca alternativa por texto quando o elemento não é encontrado pelo ID
 */
function attemptAlternativeSearch(key, roomFullId, gains) {
    const textMap = {
        'total-ganhos-w': 'Total de Ganhos Térmicos:',
        'total-tr': 'Total em TR:',
        'total-externo': 'Total Paredes Externas e Teto',
        'total-divisoes': 'Total Divisórias',
        'total-piso': 'Total Piso',
        'total-iluminacao': 'Total Iluminação',
        'total-dissi': 'Total Equipamentos',
        'total-pessoas': 'Total Pessoas',
        'total-ar-sensivel': 'Total Ar Externo Sensível',
        'total-ar-latente': 'Total Ar Externo Latente'
    };
    
    const textToFind = textMap[key];
    if (!textToFind) return;
    
    console.log(`🔍 Buscando alternativa para ${key}: "${textToFind}"`);
    
    // Buscar elementos que contenham o texto
    const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || el.innerText || '';
        return text.includes(textToFind);
    });
    
    if (elements.length > 0) {
        console.log(`🔍 Encontrado texto "${textToFind}" em:`, elements[0]);
        
        // Tentar encontrar o número próximo ao texto
        for (const element of elements) {
            // Olhar no próprio elemento
            const selfText = element.textContent || element.innerText || '';
            const selfNumber = extractNumberFromText(selfText);
            if (selfNumber !== null) {
                gains[key] = selfNumber;
                console.log(`✅ ${key}: ${selfNumber} -> SALVO (via texto próprio)`);
                return;
            }
            
            // Olhar no elemento pai
            const parent = element.parentElement;
            if (parent) {
                const parentText = parent.textContent || parent.innerText || '';
                const parentNumber = extractNumberFromText(parentText);
                if (parentNumber !== null) {
                    gains[key] = parentNumber;
                    console.log(`✅ ${key}: ${parentNumber} -> SALVO (via texto pai)`);
                    return;
                }
            }
            
            // Olhar nos irmãos
            const siblings = Array.from(element.parentElement?.children || []);
            for (const sibling of siblings) {
                if (sibling !== element) {
                    const siblingText = sibling.textContent || sibling.innerText || '';
                    const siblingNumber = extractNumberFromText(siblingText);
                    if (siblingNumber !== null) {
                        gains[key] = siblingNumber;
                        console.log(`✅ ${key}: ${siblingNumber} -> SALVO (via texto irmão)`);
                        return;
                    }
                }
            }
        }
    }
}

/**
 * Função auxiliar para debug - mostra todos os elementos de ganhos térmicos disponíveis
 */
function debugThermalGainsElements(roomElement) {
    const roomFullId = getRoomFullId(roomElement);
    console.log('🐛 DEBUG: Todos os elementos de ganhos térmicos disponíveis:');
    
    const selectors = [
        'total-ganhos-w', 'total-tr', 'total-externo', 'total-divisoes',
        'total-piso', 'total-iluminacao', 'total-dissi', 'total-pessoas',
        'total-ar-sensivel', 'total-ar-latente'
    ];
    
    selectors.forEach(selector => {
        const element = document.querySelector(`#${selector}-${roomFullId}`);
        console.log(`🔍 ${selector}-${roomFullId}:`, element ? `ENCONTRADO - "${element.textContent}"` : 'NÃO ENCONTRADO');
    });
}

/**
 * Extrai dados de ganhos térmicos - VERSÃO CORRIGIDA COM PADRÃO DE IDs
 */
function extractThermalGainsData(roomElement) {
    console.log('🎯 FUNÇÃO extractThermalGainsData CHAMADA!');
    
    const gains = {};
    const roomId = roomElement.id.replace('room-content-', '');
    
    console.log(`🔥 Buscando ganhos térmicos para sala: ${roomId}`);
    
    // Obter o ID completo da sala (ex: "Projeto1-Sala1")
    const roomFullId = getRoomFullId(roomElement);
    console.log(`🔑 ID completo da sala: ${roomFullId}`);
    
    // Lista de todos os totais com os IDs CORRETOS baseados no HTML
    const totalSelectors = {
        'total-ganhos-w': `#total-ganhos-w-${roomFullId}`,
        'total-tr': `#total-tr-${roomFullId}`,
        'total-externo': `#total-externo-${roomFullId}`,
        'total-divisoes': `#total-divisoes-${roomFullId}`,
        'total-piso': `#total-piso-${roomFullId}`,
        'total-iluminacao': `#total-iluminacao-${roomFullId}`,
        'total-dissi': `#total-dissi-${roomFullId}`,
        'total-pessoas': `#total-pessoas-${roomFullId}`,
        'total-ar-sensivel': `#total-ar-sensivel-${roomFullId}`,
        'total-ar-latente': `#total-ar-latente-${roomFullId}`
    };
    
    let encontrados = 0;
    
    // Buscar cada elemento pelos IDs CORRETOS
    Object.entries(totalSelectors).forEach(([key, selector]) => {
        try {
            const element = document.querySelector(selector);
            
            if (element) {
                console.log(`🔍 Elemento encontrado: ${selector}`, element);
                
                // Obter o texto diretamente do elemento
                let value = element.textContent || element.innerText || element.innerHTML || '';
                console.log(`📝 Valor bruto de ${selector}: "${value}"`);
                
                // Limpar e converter o valor
                if (value && value.trim() !== '') {
                    // Remover qualquer HTML e espaços extras
                    value = value.replace(/<[^>]*>/g, '').trim();
                    
                    // Extrair apenas números (incluindo decimais)
                    const numericMatch = value.match(/-?\d+(?:[.,]\d+)?/);
                    
                    if (numericMatch) {
                        // Substituir vírgula por ponto para parseFloat
                        const numericString = numericMatch[0].replace(',', '.');
                        const numericValue = parseFloat(numericString);
                        
                        if (!isNaN(numericValue)) {
                            gains[key] = numericValue;
                            encontrados++;
                            console.log(`✅ ${key}: ${numericValue} -> SALVO`);
                        } else {
                            console.log(`❌ ${key}: Não consegui converter "${value}" para número`);
                            gains[key] = 0;
                        }
                    } else {
                        console.log(`❌ ${key}: Nenhum número encontrado em "${value}"`);
                        gains[key] = 0;
                    }
                } else {
                    console.log(`⚠️ ${selector}: Valor vazio, definindo como 0`);
                    gains[key] = 0;
                }
            } else {
                console.log(`❌ ${selector}: Elemento não encontrado no DOM`);
                gains[key] = 0;
                
                // Tentar buscar por texto alternativo
                attemptAlternativeSearch(key, roomFullId, gains);
            }
        } catch (error) {
            console.error(`💥 Erro ao processar ${selector}:`, error);
            gains[key] = 0;
        }
    });
    
    console.log(`🔥 ${encontrados} ganhos térmicos coletados:`, gains);
    return gains;
}

/**
 * Constrói o objeto de dados completo de uma OBRA a partir do HTML
 */
function buildObraData(obraIdOrElement) {
    let obraElement;
    
    if (typeof obraIdOrElement === 'string') {
        obraElement = document.querySelector(`.obra-block[data-obra-id="${obraIdOrElement}"]`) || 
                     document.querySelector(`.obra-block[data-obra-name="${obraIdOrElement}"]`);
    } else if (obraIdOrElement instanceof HTMLElement) {
        if (obraIdOrElement.classList.contains('obra-block')) {
            obraElement = obraIdOrElement;
        } else {
            console.error('❌ Elemento não é uma obra:', obraIdOrElement);
            return null;
        }
    } else {
        console.error('❌ Tipo inválido para obraIdOrElement:', typeof obraIdOrElement, obraIdOrElement);
        return null;
    }

    if (!obraElement) {
        console.error('❌ Elemento da obra não encontrado:', obraIdOrElement);
        return null;
    }

    const obraName = obraElement.dataset.obraName;
    const obraId = obraElement.dataset.obraId;

    console.log(`📦 Construindo dados da obra: "${obraName}" (ID: ${obraId})`);

    const obraData = {
        id: obraId || generateObraId(),
        nome: getObraName(obraElement),
        timestamp: new Date().toISOString(),
        projetos: []
    };

    // Buscar projetos DENTRO da obra específica
    const projectElements = obraElement.querySelectorAll('.project-block');
    console.log(`🔍 Encontrados ${projectElements.length} projetos na obra "${obraName}"`);
    
    projectElements.forEach((projectElement, index) => {
        const projectData = buildProjectData(projectElement);
        if (projectData) {
            obraData.projetos.push(projectData);
            console.log(`✅ Projeto "${projectData.nome}" adicionado à obra "${obraName}"`);
        } else {
            console.error(`❌ Falha ao construir projeto ${index} da obra "${obraName}"`);
        }
    });

    console.log('📦 Dados da obra construídos:', {
        obra: obraData.nome,
        id: obraData.id,
        projetos: obraData.projetos.length
    });
    
    return obraData;
}

/**
 * Obtém o nome da obra de forma segura
 */
function getObraName(obraElement) {
    const titleElement = obraElement.querySelector('.obra-title');
    if (titleElement) {
        const name = titleElement.textContent || titleElement.innerText || '';
        const trimmedText = name.trim();
        if (trimmedText && trimmedText !== 'Obra') {
            return trimmedText;
        }
    }
    
    const obraNameFromData = obraElement.dataset.obraName;
    if (obraNameFromData) return obraNameFromData;
    
    const allObras = document.querySelectorAll('.obra-block');
    const obraNumber = allObras.length > 0 ? allObras.length : 1;
    return `Obra${obraNumber}`;
}

/**
 * Constrói o objeto de dados completo de um projeto a partir do HTML
 */
function buildProjectData(projectIdOrElement) {
    let projectElement;
    
    if (typeof projectIdOrElement === 'string') {
        projectElement = document.querySelector(`[data-project-name="${projectIdOrElement}"]`);
    } else if (projectIdOrElement instanceof HTMLElement) {
        projectElement = projectIdOrElement;
    } else {
        console.error('❌ Tipo inválido para projectIdOrElement:', projectIdOrElement);
        return null;
    }

    if (!projectElement) {
        console.error('❌ Elemento do projeto não encontrado:', projectIdOrElement);
        return null;
    }

    const projectName = projectElement.dataset.projectName || projectElement.id;
    const projectId = projectElement.dataset.projectId;
    const obraElement = projectElement.closest('.obra-block');

    const projectData = {
        id: projectId || (obraElement ? generateProjectId(obraElement) : "1"),
        nome: getProjectName(projectElement),
        salas: [],
        timestamp: new Date().toISOString()
    };

    // Extrair salas do projeto
    const roomElements = projectElement.querySelectorAll('.room-block');
    console.log(`🔍 Encontradas ${roomElements.length} salas no projeto "${projectName}"`);
    
    roomElements.forEach((roomElement, index) => {
        const roomData = extractRoomData(roomElement, projectElement);
        if (roomData) {
            projectData.salas.push(roomData);
        }
    });

    return projectData;
}

/**
 * Extrai todos os dados de uma sala a partir do elemento HTML
 */
function extractRoomData(roomElement, projectElement) {
    if (!roomElement) {
        console.error('❌ Elemento da sala é nulo');
        return null;
    }

    const roomId = roomElement.dataset.roomId || (projectElement ? generateRoomId(projectElement) : "1");
    const roomName = getRoomName(roomElement) || `Sala ${roomId}`;

    const roomData = {
        id: roomId,
        nome: roomName,
        inputs: extractClimatizationInputs(roomElement),
        maquinas: extractMachinesData(roomElement),
        capacidade: extractCapacityData(roomElement),
        ganhosTermicos: extractThermalGainsData(roomElement), // ✅ AGORA FUNCIONA
        configuracao: extractConfigurationData(roomElement)
    };

    console.log(`📊 Dados extraídos da sala ${roomId} "${roomData.nome}":`, {
        inputs: Object.keys(roomData.inputs).length,
        maquinas: roomData.maquinas.length,
        capacidade: Object.keys(roomData.capacidade).length,
        ganhosTermicos: Object.keys(roomData.ganhosTermicos).length,
        configuracao: Object.keys(roomData.configuracao).length
    });
    
    return roomData;
}

/**
 * Extrai inputs de climatização
 */
function extractClimatizationInputs(roomElement) {
    const inputs = {};
    
    // Inputs de texto/número
    const textInputs = roomElement.querySelectorAll('.clima-input[type="text"], .clima-input[type="number"], .clima-input[data-field]');
    textInputs.forEach(input => {
        const field = input.getAttribute('data-field');
        if (!field) return;
        
        let value = input.value;
        
        // Converter para número se for campo numérico
        if (input.type === 'number' && value !== '') {
            value = parseFloat(value) || 0;
        }
        
        if (value !== undefined && value !== '' && value !== null) {
            inputs[field] = value;
        }
    });

    // Pressurização (radio buttons)
    const pressurizacaoRadios = roomElement.querySelectorAll('input[name*="pressurizacao"][type="radio"]');
    let pressurizacaoValue = false;
    let pressurizacaoSetpoint = "25"; // valor padrão
    
    pressurizacaoRadios.forEach(radio => {
        if (radio.checked) {
            pressurizacaoValue = radio.value === 'sim';
        }
    });
    
    inputs.pressurizacao = pressurizacaoValue;
    
    // Se pressurização for false, definir valores padrão
    if (!pressurizacaoValue) {
        inputs.pressurizacaoSetpoint = "25";
        inputs.numPortasDuplas = "0";
        inputs.numPortasSimples = "0";
    } else {
        // Se for true, buscar os valores dos campos
        const setpointInput = roomElement.querySelector('.clima-input[data-field="pressurizacaoSetpoint"]');
        const portasDuplasInput = roomElement.querySelector('.clima-input[data-field="numPortasDuplas"]');
        const portasSimplesInput = roomElement.querySelector('.clima-input[data-field="numPortasSimples"]');
        
        if (setpointInput) inputs.pressurizacaoSetpoint = setpointInput.value || "25";
        if (portasDuplasInput) inputs.numPortasDuplas = portasDuplasInput.value || "0";
        if (portasSimplesInput) inputs.numPortasSimples = portasSimplesInput.value || "0";
    }

    // Selects
    const selectInputs = roomElement.querySelectorAll('.clima-input[data-field]');
    selectInputs.forEach(select => {
        const field = select.getAttribute('data-field');
        if (!field || inputs[field] !== undefined) return;
        
        const value = select.value;
        if (value !== undefined && value !== '' && value !== null) {
            inputs[field] = value;
        }
    });

    console.log(`📝 Inputs de climatização coletados: ${Object.keys(inputs).length}`, inputs);
    return inputs;
}

/**
 * Extrai dados das máquinas
 */
function extractMachinesData(roomElement) {
    const machines = [];
    const machineElements = roomElement.querySelectorAll('.climatization-machine');
    
    machineElements.forEach(machineElement => {
        const machineData = extractClimatizationMachineData(machineElement);
        if (machineData) {
            machines.push(machineData);
        }
    });
    
    console.log(`🤖 ${machines.length} máquina(s) extraída(s) da sala`);
    return machines;
}

/**
 * Extrai dados de uma máquina individual
 */
function extractClimatizationMachineData(machineElement) {
    const machineId = machineElement.getAttribute('data-machine-id') || `machine-${Date.now()}`;

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

/**
 * Extrai dados de capacidade
 */
function extractCapacityData(roomElement) {
    const capacityData = {};
    const roomId = roomElement.id.replace('room-content-', '');

    try {
        // Dados principais da tabela de capacidade
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
                
                // Remover símbolo de porcentagem da folga
                if (key === 'folga' && typeof value === 'string') {
                    value = value.replace('%', '');
                }
                
                // Converter para número se possível
                if (value && !isNaN(value.replace(',', '.'))) {
                    value = parseFloat(value.replace(',', '.'));
                }
                
                capacityData[key] = value;
            }
        });

        // Backup configuration
        const backupSelect = roomElement.querySelector('.backup-select');
        if (backupSelect) {
            capacityData.backup = backupSelect.value;
        }

        // Carga estimada (input editável)
        const cargaEstimadaElement = document.getElementById(`carga-estimada-${roomId}`);
        if (cargaEstimadaElement) {
            const input = cargaEstimadaElement.querySelector('input');
            if (input) {
                capacityData.cargaEstimada = parseInt(input.value) || 0;
            } else {
                capacityData.cargaEstimada = parseInt(cargaEstimadaElement.textContent) || 0;
            }
        }

        console.log(`❄️ Dados de capacidade coletados: ${Object.keys(capacityData).length}`, capacityData);
        return capacityData;

    } catch (error) {
        console.error(`❌ Erro ao extrair dados de capacidade da sala ${roomId}:`, error);
        return capacityData;
    }
}

/**
 * Extrai dados de configuração
 */
function extractConfigurationData(roomElement) {
    const config = {
        opcoesInstalacao: []
    };
    
    console.log('🔍 Buscando configurações na sala...');
    
    // Busca por opções de instalação
    const opcoesInstalacaoCheckboxes = roomElement.querySelectorAll('input[name^="opcoesInstalacao-"][type="checkbox"]');
    
    console.log(`📋 Encontrados ${opcoesInstalacaoCheckboxes.length} checkboxes de opções de instalação`);
    
    opcoesInstalacaoCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const value = checkbox.value;
            config.opcoesInstalacao.push(value);
            console.log(`✅ Opção de instalação selecionada: ${value}`);
        }
    });
    
    console.log(`⚙️ Configurações coletadas:`, {
        opcoesInstalacao: config.opcoesInstalacao.length
    }, config);
    
    return config;
}

/**
 * Obtém o nome do projeto de forma segura
 */
function getProjectName(projectElement) {
    // PRIMEIRO: Tentar obter do elemento de título editável
    const titleElement = projectElement.querySelector('.project-title');
    
    if (titleElement) {
        const titleText = titleElement.textContent || titleElement.innerText || '';
        const trimmedText = titleText.trim();
        
        if (trimmedText && trimmedText !== 'Projeto') {
            console.log(`📝 Nome do projeto obtido do título: "${trimmedText}"`);
            return trimmedText;
        }
    }
    
    // SEGUNDO: Tentar obter do data attribute
    const projectNameFromData = projectElement.dataset.projectName;
    if (projectNameFromData && projectNameFromData !== 'Projeto') {
        console.log(`📝 Nome do projeto obtido do data attribute: "${projectNameFromData}"`);
        return projectNameFromData;
    }
    
    // TERCEIRO: Tentar obter do ID do projeto
    const projectId = projectElement.id;
    if (projectId && projectId.startsWith('project-')) {
        const nameFromId = projectId.replace('project-', '');
        if (nameFromId && nameFromId !== 'Projeto') {
            console.log(`📝 Nome do projeto obtido do ID: "${nameFromId}"`);
            return nameFromId;
        }
    }
    
    // FALLBACK: Usar nome padrão com número sequencial
    const allProjects = document.querySelectorAll('.project-block');
    const projectNumber = allProjects.length > 0 ? allProjects.length : 1;
    const defaultName = `Projeto${projectNumber}`;
    console.log(`📝 Nome do projeto usando fallback: "${defaultName}"`);
    
    return defaultName;
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
    
    return `Sala ${roomElement.dataset.roomId || ''}`;
}

/**
 * Obtém o nome da máquina de forma segura
 */
function getMachineName(machineElement, machineId) {
    const titleElement = machineElement.querySelector('.machine-title-editable');
    if (!titleElement) return `Máquina ${machineId}`;
    
    const name = titleElement.value || titleElement.textContent || titleElement.getAttribute('value') || `Máquina ${machineId}`;
    return name.trim() || `Máquina${machineId}`;
}

/**
 * Converte texto de preço em número
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

// Exportações atualizadas - ORDEM CORRIGIDA
export {
    buildObraData,
    buildProjectData,
    extractRoomData,
    extractClimatizationInputs,
    extractMachinesData,
    extractClimatizationMachineData,
    extractCapacityData,
    extractThermalGainsData, // ✅ AGORA EXPORTADA CORRETAMENTE
    extractConfigurationData,
    getProjectName,
    getRoomName,
    getMachineName,
    parseMachinePrice,
    safeNumber,
    generateObraId,
    generateProjectId,  
    generateRoomId
}

console.log('✅ data-utils.js carregado com sucesso - todas as funções disponíveis');