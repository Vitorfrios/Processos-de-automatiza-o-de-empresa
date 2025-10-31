/**
 * data-populate.js
 * Módulo unificado para preenchimento de dados nos formulários
 * Contém todas as funções necessárias para preencher obras, projetos e salas com dados do JSON
 * SISTEMA CORRIGIDO COM IDs ÚNICOS
 */

import{updateObraButtonAfterSave } from '../../ui/intr-files/obra-manager.js'

// =============================================================================
// FUNÇÕES DE PREENCHIMENTO ESPECÍFICAS POR SEÇÃO
// =============================================================================

/**
 * Preenche os campos de climatização de uma sala com dados do JSON
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {Object} inputsData - Dados dos inputs de climatização
 * @returns {void}
 */
function fillClimatizationInputs(roomElement, inputsData) {
    if (!roomElement || !inputsData) {
        console.error('❌ Elemento da sala ou dados inválidos para preenchimento');
        return;
    }

    console.log(`🔄 Preenchendo inputs de climatização:`, inputsData);

    // Preencher inputs de texto e número
    const textInputs = roomElement.querySelectorAll('.clima-input[type="text"], .clima-input[type="number"], .clima-input[data-field]');
    textInputs.forEach(input => {
        const field = input.getAttribute('data-field');
        if (!field || inputsData[field] === undefined) return;

        const value = inputsData[field];
        input.value = value;
        console.log(`✅ Campo ${field} preenchido: ${value}`);

        // Disparar evento change para cálculos automáticos
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
        console.log(`✅ Select ${field} preenchido: ${value}`);

        setTimeout(() => {
            const event = new Event('change', { bubbles: true });
            select.dispatchEvent(event);
        }, 50);
    });

    // Preencher pressurização (radios)
    if (inputsData.pressurizacao !== undefined) {
        const pressurizacaoValue = inputsData.pressurizacao ? 'sim' : 'nao';
        const roomId = roomElement.dataset.roomId;
        const radioName = `pressurizacao-${roomId}`;
        const radioToCheck = roomElement.querySelector(`input[name="${radioName}"][value="${pressurizacaoValue}"]`);
        
        if (radioToCheck) {
            radioToCheck.checked = true;
            console.log(`✅ Pressurização definida: ${pressurizacaoValue}`);
            
            setTimeout(() => {
                const event = new Event('change', { bubbles: true });
                radioToCheck.dispatchEvent(event);
            }, 50);
        }
    }

    console.log(`✅ Inputs de climatização preenchidos para sala ${roomElement.dataset.roomId}`);
}

/**
 * Preenche os dados de ganhos térmicos nos elementos da sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {Object} thermalGainsData - Dados de ganhos térmicos
 * @returns {void}
 */
function fillThermalGainsData(roomElement, thermalGainsData) {
    if (!roomElement || !thermalGainsData) {
        console.error('❌ Elemento da sala ou dados de ganhos térmicos inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🔄 Preenchendo ganhos térmicos para sala ${roomId}:`, thermalGainsData);

    // Mapeamento de seletores para campos de ganhos térmicos
    const gainSelectors = {
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

    Object.entries(gainSelectors).forEach(([key, selector]) => {
        const element = document.querySelector(selector);
        if (element && thermalGainsData[key] !== undefined) {
            element.textContent = thermalGainsData[key];
            console.log(`✅ ${key} preenchido: ${thermalGainsData[key]}`);
        }
    });

    console.log(`✅ Ganhos térmicos preenchidos para sala ${roomId}`);
}

/**
 * Preenche os dados de capacidade de refrigeração da sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {Object} capacityData - Dados de capacidade
 * @returns {void}
 */
function fillCapacityData(roomElement, capacityData) {
    if (!roomElement || !capacityData) {
        console.error('❌ Elemento da sala ou dados de capacidade inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🔄 Preenchendo dados de capacidade para sala ${roomId}:`, capacityData);

    // Preencher fator de segurança
    const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`);
    if (fatorSegurancaInput && capacityData.fatorSeguranca !== undefined) {
        fatorSegurancaInput.value = capacityData.fatorSeguranca;
        console.log(`✅ Fator segurança preenchido: ${capacityData.fatorSeguranca}`);
    }

    // Preencher capacidade unitária
    const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`);
    if (capacidadeUnitariaSelect && capacityData.capacidadeUnitaria !== undefined) {
        capacidadeUnitariaSelect.value = capacityData.capacidadeUnitaria;
        console.log(`✅ Capacidade unitária preenchida: ${capacityData.capacidadeUnitaria}`);
    }

    // Preencher backup
    const backupSelect = roomElement.querySelector('.backup-select');
    if (backupSelect && capacityData.backup !== undefined) {
        backupSelect.value = capacityData.backup;
        console.log(`✅ Backup preenchido: ${capacityData.backup}`);
    }

    console.log(`✅ Dados de capacidade preenchidos para sala ${roomId}`);
}

/**
 * Preenche as configurações de instalação da sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {Object} configData - Dados de configuração
 * @returns {void}
 */
function fillConfigurationData(roomElement, configData) {
    if (!roomElement || !configData) {
        console.error('❌ Elemento da sala ou dados de configuração inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🔄 Preenchendo configurações para sala ${roomId}:`, configData);

    // Preencher opções de instalação (checkboxes)
    if (configData.opcoesInstalacao && Array.isArray(configData.opcoesInstalacao)) {
        configData.opcoesInstalacao.forEach(optionValue => {
            const checkbox = roomElement.querySelector(`input[name^="opcoesInstalacao-"][value="${optionValue}"]`);
            if (checkbox) {
                checkbox.checked = true;
                console.log(`✅ Checkbox marcado: ${optionValue}`);
            }
        });
    }

    console.log(`✅ Configurações preenchidas para sala ${roomId}`);
}

// =============================================================================
// FUNÇÕES DE PREENCHIMENTO DE MÁQUINAS
// =============================================================================

/**
 * Preenche os dados das máquinas de climatização de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {Array} machinesData - Dados das máquinas do JSON
 * @returns {Promise<boolean>} True se o preenchimento foi bem-sucedido
 */
async function fillMachinesData(roomElement, machinesData) {
    if (!roomElement || !machinesData || !Array.isArray(machinesData)) {
        console.error('❌ Elemento da sala ou dados das máquinas inválidos');
        return false;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🔄 Preenchendo ${machinesData.length} máquina(s) para sala ${roomId}`);

    try {
        // Verificar se o módulo de máquinas está disponível
        let machinesModule;
        try {
            machinesModule = await import('../modules/maquinas.js');
            console.log(`✅ Módulo de máquinas carregado para sala ${roomId}`);
        } catch (error) {
            console.error(`❌ Erro ao carregar módulo de máquinas:`, error);
            return false;
        }

        // Para cada máquina nos dados
        for (const machineData of machinesData) {
            console.log(`🤖 Processando máquina: ${machineData.nome}`);
            
            // ✅ CORREÇÃO: PRIMEIRO ADICIONAR A MÁQUINA
            if (machinesModule.addMachine && typeof machinesModule.addMachine === 'function') {
                console.log(`➕ Adicionando máquina vazia: ${machineData.nome}`);
                machinesModule.addMachine(roomId);
                
                // ✅ CORREÇÃO: AGUARDAR A MÁQUINA SER CRIADA NO DOM
                console.log(`⏳ Aguardando criação da máquina no DOM...`);
                await waitForElement(`#machines-${roomId} .climatization-machine:last-child`, 3000);
                
                // ✅ CORREÇÃO: AGORA PREENCHER OS DADOS
                console.log(`🎯 Preenchendo dados da máquina: ${machineData.nome}`);
                const success = await populateMachineData(roomElement, machineData);
                
                if (success) {
                    console.log(`✅ Máquina "${machineData.nome}" adicionada e preenchida com sucesso`);
                } else {
                    console.error(`❌ Falha ao preencher máquina "${machineData.nome}"`);
                }
                
                // Aguardar um pouco entre máquinas
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } else {
                console.error(`❌ Função addMachine não disponível`);
            }
        }

        console.log(`✅ ${machinesData.length} máquina(s) processada(s) para sala ${roomId}`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher máquinas para sala ${roomId}:`, error);
        return false;
    }
}

/**
 * Preenche os dados de uma máquina individual
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {Object} machineData - Dados da máquina do JSON
 * @returns {Promise<boolean>} True se o preenchimento foi bem-sucedido
 */
async function populateMachineData(roomElement, machineData) {
    if (!roomElement || !machineData) {
        console.error('❌ Elemento da sala ou dados da máquina inválidos');
        return false;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🎯 Preenchendo máquina: ${machineData.nome} na sala ${roomId}`);

    try {
        // ✅ CORREÇÃO: ENCONTRAR A ÚLTIMA MÁQUINA ADICIONADA (mais recente)
        const machinesContainer = document.getElementById(`machines-${roomId}`);
        if (!machinesContainer) {
            console.error(`❌ Container de máquinas não encontrado: machines-${roomId}`);
            return false;
        }

        const machineElements = machinesContainer.querySelectorAll('.climatization-machine');
        if (machineElements.length === 0) {
            console.error(`❌ Nenhuma máquina encontrada no container machines-${roomId}`);
            return false;
        }

        const lastMachine = machineElements[machineElements.length - 1];
        console.log(`✅ Máquina encontrada:`, lastMachine);

        // ✅ CORREÇÃO: AGUARDAR UM POUCO PARA GARANTIR QUE OS ELEMENTOS ESTEJAM CARREGADOS
        await new Promise(resolve => setTimeout(resolve, 200));

        // Preencher nome da máquina
        const nameInput = lastMachine.querySelector('.machine-name-input');
        if (nameInput && machineData.nome) {
            nameInput.value = machineData.nome;
            console.log(`✅ Nome da máquina preenchido: ${machineData.nome}`);
            
            // Disparar evento input
            const inputEvent = new Event('input', { bubbles: true });
            nameInput.dispatchEvent(inputEvent);
        }

        // Preencher tipo da máquina
        const typeSelect = lastMachine.querySelector('.machine-type-select');
        if (typeSelect && machineData.tipo) {
            typeSelect.value = machineData.tipo;
            console.log(`✅ Tipo da máquina preenchido: ${machineData.tipo}`);
            
            // Disparar evento change para carregar opções
            setTimeout(() => {
                const changeEvent = new Event('change', { bubbles: true });
                typeSelect.dispatchEvent(changeEvent);
            }, 100);
        }

        // Preencher potência da máquina (aguardar mais para opções carregarem)
        const powerSelect = lastMachine.querySelector('.machine-power-select');
        if (powerSelect && machineData.potencia) {
            setTimeout(() => {
                powerSelect.value = machineData.potencia;
                console.log(`✅ Potência da máquina preenchida: ${machineData.potencia}`);
                
                // Disparar evento change para cálculos
                const changeEvent = new Event('change', { bubbles: true });
                powerSelect.dispatchEvent(changeEvent);
            }, 300);
        }

        // Preencher tensão
        const voltageSelect = lastMachine.querySelector('.machine-voltage-select');
        if (voltageSelect && machineData.tensao) {
            setTimeout(() => {
                voltageSelect.value = machineData.tensao;
                console.log(`✅ Tensão da máquina preenchida: ${machineData.tensao}`);
            }, 400);
        }

        // Preencher opções selecionadas (aguardar mais para todas as opções carregarem)
        if (machineData.opcoesSelecionadas && Array.isArray(machineData.opcoesSelecionadas)) {
            setTimeout(() => {
                console.log(`🔧 Preenchendo ${machineData.opcoesSelecionadas.length} opções...`);
                
                machineData.opcoesSelecionadas.forEach((option, index) => {
                    setTimeout(() => {
                        // Tentar múltiplos seletores para encontrar o checkbox
                        const selectors = [
                            `input[type="checkbox"][data-option-id="${option.id}"]`,
                            `input[type="checkbox"][value="${option.value}"]`,
                            `input[type="checkbox"][data-option-name*="${option.name}"]`
                        ];
                        
                        let checkbox = null;
                        for (const selector of selectors) {
                            checkbox = lastMachine.querySelector(selector);
                            if (checkbox) break;
                        }
                        
                        if (checkbox) {
                            checkbox.checked = true;
                            console.log(`✅ Opção selecionada: ${option.name} (ID: ${option.id})`);
                            
                            // Disparar evento para cálculos
                            const changeEvent = new Event('change', { bubbles: true });
                            checkbox.dispatchEvent(changeEvent);
                        } else {
                            console.warn(`⚠️ Opção não encontrada: ${option.name} (ID: ${option.id})`);
                        }
                    }, index * 100); // Delay entre opções
                });
            }, 600);
        }

        console.log(`✅ Máquina "${machineData.nome}" preenchida com sucesso`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher máquina "${machineData.nome}":`, error);
        return false;
    }
}

// =============================================================================
// FUNÇÕES DE PREENCHIMENTO HIERÁRQUICO (OBRA → PROJETO → SALA)
// =============================================================================

/**
 * Preenche os dados de uma obra a partir do JSON - VERSÃO COMPLETA CORRIGIDA
 * @param {Object} obraData - Dados da obra do JSON
 * @returns {Promise<void>}
 */
async function populateObraData(obraData) {
    // ✅ CORREÇÃO: Verificação mais robusta dos dados
    if (!obraData || typeof obraData !== 'object') {
        console.error('❌ Dados inválidos recebidos para populateObraData:', obraData);
        return;
    }
    
    // Verificar se temos pelo menos nome ou ID
    const hasValidId = obraData.id && obraData.id !== "" && obraData.id !== "null" && obraData.id !== "undefined";
    const hasValidName = obraData.nome && obraData.nome !== "" && obraData.nome !== "null" && obraData.nome !== "undefined";
    
    if (!hasValidId && !hasValidName) {
        console.error('❌ Dados da obra sem ID ou nome válido:', obraData);
        return;
    }

    const obraName = obraData.nome || `Obra-${obraData.id}`;
    const obraId = obraData.id;
    
    console.log(`🔄 Preenchendo obra "${obraName}" com dados do JSON`, { 
        id: obraId, 
        nome: obraName, 
        projetos: obraData.projetos?.length || 0 
    });

    // ✅ CORREÇÃO: Buscar APENAS por ID único
    let obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    
    if (!obraElement) {
        console.log(`🔨 Criando nova obra: "${obraName}"`);
        
        // ✅✅✅ CORREÇÃO CRÍTICA: Passar hasId=true para obras carregadas da sessão
        const obraHTML = buildObraHTML(obraName, obraId, true); // ← hasId=true para obras da sessão
        
        const container = document.getElementById("projects-container");
        if (container) {
            container.insertAdjacentHTML("beforeend", obraHTML);
            
            // Aguardar um pouco para o DOM atualizar
            await new Promise(resolve => setTimeout(resolve, 100));
            
            obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
            console.log(`✅ Obra criada no DOM: ${obraName} com botão "Atualizar Obra"`);
        } else {
            console.error('❌ Container de projetos não encontrado');
            return;
        }
    } else {
        console.log(`✅ Obra já existe no DOM: ${obraName}`, obraElement);
        
        // ✅ CORREÇÃO: Se a obra já existe, garantir que o botão está correto
        updateObraButtonAfterSave(obraName, obraId);
    }

    if (!obraElement) {
        console.error(`❌ Elemento da obra não encontrado no DOM após criação: ${obraId}`);
        return;
    }

    console.log(`✅ Elemento da obra confirmado:`, {
        element: obraElement,
        dataset: obraElement.dataset
    });

    // ✅ CORREÇÃO: Verificar funções de forma mais robusta
    if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
        console.error('❌ Funções necessárias não disponíveis:', {
            createEmptyProject: typeof window.createEmptyProject,
            createEmptyRoom: typeof window.createEmptyRoom
        });
        
        // Tentar recarregar as funções
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
            console.error('❌ Funções ainda não disponíveis após espera');
            return;
        }
    }

    console.log(`🔧 Funções disponíveis: createEmptyProject: function, createEmptyRoom: function`);

    // ✅ CORREÇÃO: Limpar projetos existentes antes de preencher (evitar duplicação)
    const projectsContainer = obraElement.querySelector('.projects-container');
    if (projectsContainer) {
        const existingProjects = projectsContainer.querySelectorAll('.project-block');
        if (existingProjects.length > 0) {
            console.log(`🗑️ Removendo ${existingProjects.length} projetos existentes antes do preenchimento`);
            existingProjects.forEach(project => project.remove());
        }
    }

    // Para cada projeto na obra
    const projetos = obraData.projetos || [];
    console.log(`📁 Processando ${projetos.length} projeto(s) para a obra "${obraName}"`);
    
    for (let i = 0; i < projetos.length; i++) {
        const projectData = projetos[i];
        if (!projectData || !projectData.nome) {
            console.warn(`⚠️ Projeto ${i} inválido ou sem nome:`, projectData);
            continue;
        }
        
        const projectName = projectData.nome;
        const projectId = projectData.id;
        
        console.log(`📁 [${i + 1}/${projetos.length}] Criando projeto: ${projectName} (ID: ${projectId})`);

        try {
            // ✅ CORREÇÃO: Passar obraId e projectId corretamente
            console.log(`🎯 Chamando createEmptyProject para obra "${obraName}" (${obraId}), projeto "${projectName}" (${projectId})`);
            
            const projectCreated = await window.createEmptyProject(obraId, obraName, projectId, projectName);
            
            if (!projectCreated) {
                console.error(`❌ Falha ao criar projeto ${projectName}`);
                continue;
            }

            // ✅ CORREÇÃO: Aguardar o projeto ser criado no DOM com timeout
            const projectElement = await waitForElement(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`, 5000);
            
            if (!projectElement) {
                console.error(`❌ Projeto ${projectName} não encontrado no DOM após criação`);
                
                // Debug: listar projetos criados
                const allProjects = document.querySelectorAll('.project-block');
                console.log(`🔍 Projetos no DOM: ${allProjects.length}`);
                allProjects.forEach((proj, idx) => {
                    console.log(`  ${idx + 1}. Projeto: "${proj.dataset.projectName}", ID: "${proj.dataset.projectId}", Obra: "${proj.dataset.obraId}"`);
                });
                continue;
            }

            console.log(`✅ Projeto criado e encontrado: ${projectName}`, {
                element: projectElement,
                dataset: projectElement.dataset
            });

            // Preencher dados do projeto
            await populateProjectData(projectElement, projectData, obraId, obraName);

        } catch (error) {
            console.error(`❌ Erro ao criar projeto ${projectName}:`, error);
        }
        
        // ✅ CORREÇÃO: Pequeno delay entre projetos para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Obra "${obraName}" preenchida com sucesso - ${projetos.length} projeto(s) processado(s)`);
}

/**
 * Preenche os dados de um projeto a partir do JSON - CORREÇÃO
 * @param {HTMLElement} projectElement - Elemento do projeto
 * @param {Object} projectData - Dados do projeto do JSON
 * @param {string} obraId - ID único da obra
 * @param {string} obraName - Nome da obra
 * @returns {Promise<void>}
 */
async function populateProjectData(projectElement, projectData, obraId, obraName) {
    const projectName = projectData.nome;
    const projectId = projectData.id;
    
    console.log(`🎯 Preenchendo projeto: ${projectName}`, { 
        salas: projectData.salas?.length,
        obraId: obraId,
        projectId: projectId
    });

    console.log(`✅ Projeto encontrado:`, projectElement.dataset);

    // ✅ CORREÇÃO: Limpar salas existentes antes de preencher
    const roomsContainer = projectElement.querySelector('.rooms-container');
    if (roomsContainer) {
        const existingRooms = roomsContainer.querySelectorAll('.room-block');
        if (existingRooms.length > 0) {
            console.log(`🗑️ Removendo ${existingRooms.length} salas existentes antes do preenchimento`);
            existingRooms.forEach(room => room.remove());
        }
    }

    // Para cada sala no projeto
    const salas = projectData.salas || [];
    console.log(`🚪 Processando ${salas.length} sala(s) para o projeto "${projectName}"`);
    
    for (let i = 0; i < salas.length; i++) {
        const roomData = salas[i];
        const roomName = roomData.nome;
        const roomId = roomData.id; // ✅ ID da sala do JSON
        
        if (!roomName || !roomId) {
            console.warn(`⚠️ Sala ${i} inválida ou sem nome/ID:`, roomData);
            continue;
        }

        console.log(`🚪 [${i + 1}/${salas.length}] Criando sala: ${roomName} (ID: ${roomId})`);

        try {
            // ✅ CORREÇÃO: Verificar se createEmptyRoom está disponível
            if (typeof window.createEmptyRoom !== 'function') {
                console.error('❌ createEmptyRoom não disponível');
                continue;
            }

            // ✅ CORREÇÃO: Passar obraId e projectId corretamente
            const roomCreated = await window.createEmptyRoom(obraId, projectId, roomName, roomId);
            
            if (!roomCreated) {
                console.error(`❌ Falha ao criar sala ${roomName}`);
                continue;
            }

            // ✅ CORREÇÃO: Aguardar a sala ser criada no DOM
            const roomElement = await waitForElement(`[data-room-id="${roomId}"]`, 3000);
            
            if (!roomElement) {
                console.error(`❌ Sala ${roomName} não encontrada no DOM após criação`);
                
                // Debug: listar salas criadas
                const allRooms = document.querySelectorAll('.room-block');
                console.log(`🔍 Salas no DOM: ${allRooms.length}`);
                allRooms.forEach((room, idx) => {
                    console.log(`  ${idx + 1}. Sala: "${room.dataset.roomName}", ID: "${room.dataset.roomId}", Projeto: "${room.dataset.projectId}"`);
                });
                continue;
            }

            console.log(`✅ Sala criada e encontrada: ${roomName}`, {
                element: roomElement,
                dataset: roomElement.dataset
            });

            // Preencher dados da sala
            await populateRoomData(roomElement, roomData);

        } catch (error) {
            console.error(`❌ Falha ao criar sala ${roomName}:`, error);
        }
        
        // ✅ CORREÇÃO: Pequeno delay entre salas para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`✅ Projeto "${projectName}" preenchido com sucesso - ${salas.length} sala(s) processada(s)`);
}

/**
 * Preenche uma sala específica dentro de um projeto
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {Object} roomData - Dados da sala do JSON
 * @returns {Promise<boolean>} True se o preenchimento foi bem-sucedido
 */
async function populateRoomData(roomElement, roomData) {
    if (!roomElement || !roomData) {
        console.error('❌ Elemento da sala ou dados inválidos');
        return false;
    }

    const roomId = roomElement.dataset.roomId;
    const roomName = roomElement.dataset.roomName;
    
    console.log(`🔄 Preenchendo sala "${roomName}" (ID: ${roomId})`, roomData);

    try {
        // Preencher nome da sala
        const roomTitle = roomElement.querySelector('.room-title');
        if (roomTitle && roomData.nome) {
            roomTitle.textContent = roomData.nome;
            console.log(`✅ Título da sala atualizado: ${roomData.nome}`);
        }

        // Preencher inputs de climatização
        if (roomData.inputs) {
            console.log(`🌡️ Preenchendo inputs de climatização para sala ${roomName}`);
            fillClimatizationInputs(roomElement, roomData.inputs);
        }

        // Preencher ganhos térmicos
        if (roomData.ganhosTermicos) {
            console.log(`📊 Preenchendo ganhos térmicos para sala ${roomName}`);
            fillThermalGainsData(roomElement, roomData.ganhosTermicos);
        }

        // Preencher capacidade
        if (roomData.capacidade) {
            console.log(`⚡ Preenchendo dados de capacidade para sala ${roomName}`);
            fillCapacityData(roomElement, roomData.capacidade);
        }

        // Preencher configurações
        if (roomData.configuracao) {
            console.log(`⚙️ Preenchendo configurações para sala ${roomName}`);
            fillConfigurationData(roomElement, roomData.configuracao);
        }

        // ✅ CORREÇÃO: Preencher máquinas com timing melhorado
        if (roomData.maquinas && Array.isArray(roomData.maquinas)) {
            console.log(`🤖 Agendando preenchimento de ${roomData.maquinas.length} máquina(s) para sala ${roomName}`);
            
            // Aguardar um pouco mais para garantir que a seção esteja completamente carregada
            setTimeout(async () => {
                try {
                    console.log(`🚀 Iniciando preenchimento de máquinas para sala ${roomName}`);
                    const success = await fillMachinesData(roomElement, roomData.maquinas);
                    
                    if (success) {
                        console.log(`🎉 Todas as máquinas preenchidas com sucesso para sala ${roomName}`);
                    } else {
                        console.error(`❌ Falha ao preencher máquinas para sala ${roomName}`);
                    }
                } catch (error) {
                    console.error(`💥 Erro ao preencher máquinas para sala ${roomName}:`, error);
                }
            }, 2000); // ✅ Aumentar delay para garantir carregamento completo
        }

        console.log(`✅ Sala "${roomName}" preenchida com sucesso`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher sala "${roomName}":`, error);
        return false;
    }
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Aguarda até que um elemento esteja disponível no DOM
 * @param {string} selector - Seletor CSS do elemento
 * @param {number} timeout - Timeout em milissegundos
 * @returns {Promise<HTMLElement>} Elemento encontrado
 */
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function checkElement() {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Elemento encontrado: ${selector}`);
                resolve(element);
            } else if (Date.now() - startTime >= timeout) {
                console.error(`❌ Timeout: Elemento não encontrado: ${selector} (${timeout}ms)`);
                reject(new Error(`Elemento não encontrado: ${selector} (timeout: ${timeout}ms)`));
            } else {
                setTimeout(checkElement, 100);
            }
        }
        
        console.log(`🔍 Aguardando elemento: ${selector}`);
        checkElement();
    });
}

// =============================================================================
// EXPORTAÇÕES ORDENADAS
// =============================================================================

// Funções de preenchimento específicas por seção
export {
    fillClimatizationInputs,
    fillThermalGainsData,
    fillCapacityData,
    fillConfigurationData,
    fillMachinesData,
    populateMachineData
}

// Funções de preenchimento hierárquico
export {
    populateObraData,
    populateProjectData,
    populateRoomData
}

// Funções utilitárias
export {
    waitForElement
}