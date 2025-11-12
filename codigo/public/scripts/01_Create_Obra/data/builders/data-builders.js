/**
 * data/builders/data-builders.js
 * 🎯 FUSÃO COMPLETA: data-builders.js + data-extractors.js
 * ⚡ REDUÇÃO: 2 arquivos → 1 arquivo (~500 → ~350 linhas)
 */

import { 
    generateObraId, 
    generateProjectId, 
    generateRoomId,
     
} from '../utils/id-generator.js';

import{extractNumberFromText,getMachineName,parseMachinePrice } from '../utils/data-utils.js'

/**
 * 🏗️ FUNÇÕES DE CONSTRUÇÃO DE DADOS (data-builders.js)
 */

/**
 * Constrói o objeto de dados completo de uma obra a partir do HTML - VERSÃO CORRIGIDA
 * @param {string|HTMLElement} obraIdOrElement - ID da obra ou elemento HTML
 * @returns {Object|null} Dados completos da obra ou null em caso de erro
 */
function buildObraData(obraIdOrElement) {
    console.log('🚨 buildObraData INICIADA - buscando elemento...');
    
    let obraElement;
    
    if (typeof obraIdOrElement === 'string') {
        obraElement = document.querySelector(`[data-obra-id="${obraIdOrElement}"]`);
        
        if (!obraElement) {
            console.error('❌ Obra não encontrada pelo ID:', obraIdOrElement);
            
            const todasObras = document.querySelectorAll('[data-obra-id]');
            console.log('📋 Obras disponíveis no DOM:', 
                Array.from(todasObras).map(o => ({
                    id: o.dataset.obraId,
                    name: o.dataset.obraName
                }))
            );
            return null;
        }
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

    if (!document.body.contains(obraElement)) {
        console.error('❌ CRÍTICO: Elemento da obra NÃO ESTÁ MAIS NO DOM!');
        return null;
    }

    const obraName = obraElement.dataset.obraName;
    const obraId = obraElement.dataset.obraId;

    console.log(`📦 Construindo dados da obra: "${obraName}" (ID: ${obraId}) - ELEMENTO NO DOM: ${document.body.contains(obraElement)}`);

    const finalObraId = obraId || generateObraId();
    
    const obraData = {
        id: finalObraId,
        nome: obraName,
        timestamp: new Date().toISOString(),
        projetos: []
    };

    const projectElements = obraElement.querySelectorAll('.project-block');
    console.log(`🔍 Encontrados ${projectElements.length} projetos na obra "${obraName}"`);
    
    let projetosProcessados = 0;
    
    projectElements.forEach((projectElement, index) => {
        console.log(`📝 Processando projeto ${index + 1}/${projectElements.length}`);
        
        if (!document.body.contains(projectElement)) {
            console.error(`❌ Projeto ${index} foi removido do DOM durante o processamento!`);
            return;
        }
        
        const projectData = buildProjectData(projectElement);
        if (projectData) {
            obraData.projetos.push(projectData);
            projetosProcessados++;
            console.log(`✅ Projeto "${projectData.nome}" adicionado à obra "${obraName}"`);
        } else {
            console.error(`❌ Falha ao construir projeto ${index} da obra "${obraName}"`);
        }
    });

    console.log('📦 Dados da obra construídos:', {
        obra: obraData.nome,
        id: obraData.id,
        projetos: `${projetosProcessados}/${projectElements.length} processados`
    });
    
    console.log('🔍 VERIFICAÇÃO FINAL - Obra ainda no DOM?:', 
        document.body.contains(obraElement) ? '✅ SIM' : '❌ NÃO');
    
    return obraData;
}

/**
 * Constrói o objeto de dados completo de um projeto a partir do HTML
 * @param {string|HTMLElement} projectIdOrElement - ID do projeto ou elemento HTML
 * @returns {Object|null} Dados completos do projeto ou null em caso de erro
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

    if (!document.body.contains(projectElement)) {
        console.error('❌ CRÍTICO: Elemento do projeto NÃO ESTÁ MAIS NO DOM!');
        return null;
    }

    const projectName = projectElement.dataset.projectName || projectElement.id;
    const projectId = projectElement.dataset.projectId;
    const obraElement = projectElement.closest('.obra-block');

    if (!obraElement) {
        console.error('❌ Elemento da obra pai não encontrado para projeto:', projectName);
        return null;
    }

    const finalProjectId = projectId || generateProjectId(obraElement);

    const projectData = {
        id: finalProjectId,
        nome: projectName,
        salas: [],
        timestamp: new Date().toISOString()
    };

    const roomElements = projectElement.querySelectorAll('.room-block');
    console.log(`🔍 Encontradas ${roomElements.length} salas no projeto "${projectName}"`);
    
    let salasProcessadas = 0;
    
    roomElements.forEach((roomElement, index) => {
        if (!document.body.contains(roomElement)) {
            console.error(`❌ Sala ${index} foi removida do DOM durante o processamento!`);
            return;
        }
        
        const roomData = extractRoomData(roomElement, projectElement);
        if (roomData) {
            projectData.salas.push(roomData);
            salasProcessadas++;
        }
    });

    console.log(`✅ Projeto "${projectName}" processado: ${salasProcessadas}/${roomElements.length} salas`);
    return projectData;
}

/**
 * Extrai todos os dados de uma sala a partir do elemento HTML
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {HTMLElement} projectElement - Elemento HTML do projeto pai
 * @returns {Object|null} Dados completos da sala ou null em caso de erro
 */
function extractRoomData(roomElement, projectElement) {
    if (!roomElement) {
        console.error('❌ Elemento da sala é nulo');
        return null;
    }

    if (!projectElement) {
        console.error('❌ Elemento do projeto pai é nulo');
        return null;
    }

    if (!document.body.contains(roomElement) || !document.body.contains(projectElement)) {
        console.error('❌ CRÍTICO: Elemento da sala ou projeto NÃO ESTÁ MAIS NO DOM!');
        return null;
    }

    const roomId = roomElement.dataset.roomId || generateRoomId(projectElement);
    const roomName = roomElement.dataset.roomName || `Sala ${roomId}`;

    console.log(`🔍 Extraindo dados da sala: "${roomName}" (ID: ${roomId}) - NO DOM: ${document.body.contains(roomElement)}`);

    const roomData = {
        id: roomId,
        nome: roomName,
        inputs: extractClimatizationInputs(roomElement),
        maquinas: extractMachinesData(roomElement),
        capacidade: extractCapacityData(roomElement),
        ganhosTermicos: extractThermalGainsData(roomElement),
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
 * 🔍 FUNÇÕES DE EXTRAÇÃO DE DADOS (data-extractors.js)
 */

/**
 * Extrai dados de ganhos térmicos de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Object} Dados de ganhos térmicos
 */
function extractThermalGainsData(roomElement) {
    console.log('🎯 FUNÇÃO extractThermalGainsData CHAMADA!');
    
    const gains = {};
    
    const roomId = roomElement.dataset.roomId;
    
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error('❌ ID da sala inválido ou contém undefined:', roomId);
        return gains;
    }
    
    console.log(`🔑 ID da sala para extração: ${roomId}`);
    
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
    
    let encontrados = 0;
    
    Object.entries(totalSelectors).forEach(([key, selector]) => {
        try {
            const element = document.querySelector(selector);
            
            if (element) {
                let value = element.textContent || element.innerText || element.innerHTML || '';
                
                if (value && value.trim() !== '') {
                    value = value.replace(/<[^>]*>/g, '').trim();
                    const numericMatch = value.match(/-?\d+(?:[.,]\d+)?/);
                    
                    if (numericMatch) {
                        const numericString = numericMatch[0].replace(',', '.');
                        const numericValue = parseFloat(numericString);
                        
                        if (!isNaN(numericValue)) {
                            gains[key] = numericValue;
                            encontrados++;
                        } else {
                            gains[key] = 0;
                        }
                    } else {
                        gains[key] = 0;
                    }
                } else {
                    gains[key] = 0;
                }
            } else {
                gains[key] = 0;
                attemptAlternativeSearch(key, roomId, gains);
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
 * Extrai inputs de climatização de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Object} Dados dos inputs de climatização
 */
function extractClimatizationInputs(roomElement) {
    const inputs = {};
    
    if (!roomElement || !roomElement.dataset.roomId) {
        console.error('❌ Elemento da sala inválido para extração de inputs');
        return inputs;
    }
    
    // Primeiro: extrair todos os inputs de texto/number
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

    // Segundo: extrair o valor da pressurização (radio buttons)
    const pressurizacaoRadios = roomElement.querySelectorAll('input[name*="pressurizacao"][type="radio"]');
    let pressurizacaoValue = false;
    
    pressurizacaoRadios.forEach(radio => {
        if (radio.checked) {
            pressurizacaoValue = radio.value === 'sim';
        }
    });
    
    inputs.pressurizacao = pressurizacaoValue;
    
    // Terceiro: se pressurização for SIM, buscar os campos específicos
    // Se for NÃO, definir valores padrão ou zerados
    if (pressurizacaoValue) {
        const pressurizacaoInput = roomElement.querySelector('.clima-input[data-field="pressurizacaoSetpoint"]');
        const portasDuplasInput = roomElement.querySelector('.clima-input[data-field="numPortasDuplas"]');
        const portasSimplesInput = roomElement.querySelector('.clima-input[data-field="numPortasSimples"]');
        
        // ✅ CORREÇÃO: Converter para número
        if (pressurizacaoInput) inputs.pressurizacaoSetpoint = parseFloat(pressurizacaoInput.value) || 25;
        if (portasDuplasInput) inputs.numPortasDuplas = parseFloat(portasDuplasInput.value) || 0;
        if (portasSimplesInput) inputs.numPortasSimples = parseFloat(portasSimplesInput.value) || 0;
    } else {
        // ✅ CORREÇÃO: Zerar como números
        inputs.pressurizacaoSetpoint = 0;
        inputs.numPortasDuplas = 0;
        inputs.numPortasSimples = 0;
    }

    // Quarto: extrair selects (se houver)
    const selectInputs = roomElement.querySelectorAll('select.clima-input[data-field]');
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
 * Extrai dados das máquinas de climatização de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Array} Lista de dados das máquinas
 */
function extractMachinesData(roomElement) {
    const machines = [];
    
    if (!roomElement || !roomElement.dataset.roomId) {
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
 * @param {HTMLElement} machineElement - Elemento HTML da máquina
 * @returns {Object} Dados da máquina
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
        const basePriceElement = document.getElementById(`base-price-${machineId}`);
        if (basePriceElement) {
            machineData.precoBase = parseMachinePrice(basePriceElement.textContent);
        }

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
 * Extrai dados de capacidade de refrigeração de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Object} Dados de capacidade
 */
function extractCapacityData(roomElement) {
    const capacityData = {};
    
    const roomId = roomElement.dataset.roomId;

    if (!roomId || roomId === 'undefined' || roomId === 'null') {
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
 * Extrai dados de configuração de instalação de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Object} Dados de configuração
 */
function extractConfigurationData(roomElement) {
    const config = {
        opcoesInstalacao: []
    };
    
    if (!roomElement || !roomElement.dataset.roomId) {
        console.error('❌ Elemento da sala inválido para extração de configuração');
        return config;
    }
    
    console.log('🔍 Buscando configurações na sala...');
    
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
 * Busca alternativa por texto quando o elemento não é encontrado pelo ID
 * @param {string} key - Chave do ganho térmico
 * @param {string} roomId - ID único da sala
 * @param {Object} gains - Objeto de ganhos térmicos
 * @returns {void}
 */
function attemptAlternativeSearch(key, roomId, gains) {
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
    
    const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || el.innerText || '';
        return text.includes(textToFind);
    });
    
    if (elements.length > 0) {
        for (const element of elements) {
            const selfText = element.textContent || el.innerText || '';
            const selfNumber = extractNumberFromText(selfText);
            if (selfNumber !== null) {
                gains[key] = selfNumber;
                console.log(`✅ ${key}: ${selfNumber} -> SALVO (via texto próprio)`);
                return;
            }
            
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
        }
    }
}

/**
 * 🌐 EXPORTAÇÕES E COMPATIBILIDADE GLOBAL
 */

// Exportações para módulos ES6
export {
    // Construção
    buildObraData,
    buildProjectData,
    extractRoomData,
    
    // Extração
    extractThermalGainsData,
    extractClimatizationInputs,
    extractMachinesData,
    extractClimatizationMachineData,
    extractCapacityData,
    extractConfigurationData,
    
    // Utilitários
    attemptAlternativeSearch
};

// Compatibilidade global para scripts legados
if (typeof window !== 'undefined') {
    window.buildObraData = buildObraData;
    window.buildProjectData = buildProjectData;
    window.extractRoomData = extractRoomData;
    window.extractThermalGainsData = extractThermalGainsData;
    window.extractClimatizationInputs = extractClimatizationInputs;
    window.extractMachinesData = extractMachinesData;
    window.extractClimatizationMachineData = extractClimatizationMachineData;
    window.extractCapacityData = extractCapacityData;
    window.extractConfigurationData = extractConfigurationData;
}