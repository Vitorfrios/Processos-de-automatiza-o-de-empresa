/**
 * data-populate.js
 * Módulo unificado para preenchimento de dados nos formulários
 * Contém todas as funções necessárias para preencher obras, projetos e salas com dados do JSON
 */





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


/**
 * Preenche uma obra completa com dados do JSON incluindo projetos e salas
 * @param {HTMLElement} obraElement - Elemento HTML da obra
 * @param {Object} obraData - Dados completos da obra do JSON
 * @param {Function} createEmptyProjectFn - Função para criar projetos
 * @param {Function} createEmptyRoomFn - Função para criar salas
 * @returns {Promise<boolean>} True se o preenchimento foi bem-sucedido
 */
async function populateObraData(obraElement, obraData, createEmptyProjectFn, createEmptyRoomFn) {
    if (!obraElement || !obraData) {
        console.error('❌ Elemento da obra ou dados inválidos para preenchimento');
        return false;
    }

    console.log(`🔄 Preenchendo obra "${obraData.nome}" com dados do JSON`, obraData);
    console.log(`🔧 Funções disponíveis: createEmptyProject: ${typeof createEmptyProjectFn}, createEmptyRoom: ${typeof createEmptyRoomFn}`);

    try {
        // Preencher nome da obra
        const obraTitle = obraElement.querySelector('.obra-title');
        if (obraTitle && obraData.nome) {
            obraTitle.textContent = obraData.nome;
        }

        // Preencher projetos - CRIAR projetos primeiro e AGUARDAR criação
        if (obraData.projetos && Array.isArray(obraData.projetos)) {
            for (const projetoData of obraData.projetos) {
                // ✅ CORREÇÃO: Verificar se projeto já existe ANTES de criar
                let projectElement = obraElement.querySelector(`.project-block[data-project-name="${projetoData.nome}"]`);
                
                if (!projectElement) {
                    console.log(`📁 Criando projeto: ${projetoData.nome}`);
                    if (typeof createEmptyProjectFn === 'function') {
                        // ✅ CORREÇÃO: USAR A FUNÇÃO PASSADA COMO PARÂMETRO
                        createEmptyProjectFn(obraData.nome, projetoData.nome, projetoData.id);
                        
                        // Aguardar a criação do projeto no DOM
                        try {
                            projectElement = await waitForElement(`.project-block[data-obra-name="${obraData.nome}"][data-project-name="${projetoData.nome}"]`, 2000);
                            console.log(`✅ Projeto criado e encontrado: ${projetoData.nome}`, projectElement);
                        } catch (error) {
                            console.error(`❌ Falha ao criar projeto ${projetoData.nome}:`, error);
                            continue; // Pular para o próximo projeto se este falhar
                        }
                    } else {
                        console.error(`❌ createEmptyProjectFn não é uma função`);
                        continue;
                    }
                } else {
                    console.log(`✅ Projeto já existe: ${projetoData.nome}`);
                }
                
                // Preencher dados do projeto após criação
                console.log(`🎯 Preenchendo projeto: ${projetoData.nome}`);
                const success = await populateProjectData(obraElement, projetoData, createEmptyRoomFn);
                if (!success) {
                    console.error(`❌ Falha ao preencher projeto ${projetoData.nome}`);
                }
            }
        }

        console.log(`✅ Obra "${obraData.nome}" preenchida com sucesso`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher obra "${obraData.nome}":`, error);
        return false;
    }
}

/**
 * Preenche um projeto específico dentro de uma obra
 * @param {HTMLElement} obraElement - Elemento HTML da obra
 * @param {Object} projetoData - Dados do projeto do JSON
 * @param {Function} createEmptyRoomFn - Função para criar salas
 * @returns {Promise<boolean>} True se o preenchimento foi bem-sucedido
 */
async function populateProjectData(obraElement, projetoData, createEmptyRoomFn) {
    if (!obraElement || !projetoData) {
        console.error('❌ Elemento da obra ou dados do projeto inválidos');
        return false;
    }

    // Buscar projeto com múltiplos seletores
    let projectElement = obraElement.querySelector(`.project-block[data-project-name="${projetoData.nome}"]`);
    
    if (!projectElement) {
        // Tentar seletor alternativo
        projectElement = document.querySelector(`[data-project-name="${projetoData.nome}"][data-obra-name="${obraElement.dataset.obraName}"]`);
    }
    
    if (!projectElement) {
        console.error(`❌ Projeto "${projetoData.nome}" não encontrado na obra ${obraElement.dataset.obraName}`);
        console.log(`🔍 Todos os projetos no DOM:`, Array.from(document.querySelectorAll('.project-block')).map(p => ({
            name: p.dataset.projectName,
            obra: p.dataset.obraName,
            element: p
        })));
        return false;
    }

    console.log(`✅ Projeto encontrado:`, projectElement);
    console.log(`🔄 Preenchendo projeto "${projetoData.nome}"`, projetoData);

    try {
        // Preencher nome do projeto
        const projectTitle = projectElement.querySelector('.project-title');
        if (projectTitle && projetoData.nome) {
            projectTitle.textContent = projetoData.nome;
        }

        // Preencher salas - CRIAR salas primeiro e AGUARDAR criação
        if (projetoData.salas && Array.isArray(projetoData.salas)) {
            for (const salaData of projetoData.salas) {
                // Criar sala se não existir
                const existingRoom = projectElement.querySelector(`[data-room-id="${salaData.id}"]`);
                if (!existingRoom) {
                    console.log(`🚪 Criando sala: ${salaData.nome} (ID: ${salaData.id})`);
                    if (typeof createEmptyRoomFn === 'function') {
                        // ✅ CORREÇÃO: USAR A FUNÇÃO PASSADA COMO PARÂMETRO
                        createEmptyRoomFn(obraElement.dataset.obraName, projetoData.nome, salaData.nome, salaData.id);
                        
                        // Aguardar a criação da sala no DOM
                        try {
                            await waitForElement(`[data-room-id="${salaData.id}"]`, 2000);
                            console.log(`✅ Sala criada e encontrada: ${salaData.nome}`);
                        } catch (error) {
                            console.error(`❌ Falha ao criar sala ${salaData.nome}:`, error);
                            continue;
                        }
                    } else {
                        console.error(`❌ createEmptyRoomFn não é uma função`);
                        continue;
                    }
                } else {
                    console.log(`✅ Sala já existe: ${salaData.nome}`);
                }
                
                // Preencher dados da sala após criação
                console.log(`🎯 Preenchendo sala: ${salaData.nome}`);
                const success = await populateRoomData(projectElement, salaData);
                if (!success) {
                    console.error(`❌ Falha ao preencher sala ${salaData.nome}`);
                }
            }
        }

        console.log(`✅ Projeto "${projetoData.nome}" preenchido com sucesso`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher projeto "${projetoData.nome}":`, error);
        return false;
    }
}

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

/**
 * Preenche uma sala específica dentro de um projeto
 * @param {HTMLElement} projectElement - Elemento HTML do projeto
 * @param {Object} roomData - Dados da sala do JSON
 * @returns {Promise<boolean>} True se o preenchimento foi bem-sucedido
 */
async function populateRoomData(projectElement, roomData) {
    if (!projectElement || !roomData) {
        console.error('❌ Elemento do projeto ou dados da sala inválidos');
        return false;
    }

    const roomElement = projectElement.querySelector(`[data-room-id="${roomData.id}"]`);
    if (!roomElement) {
        console.error(`❌ Sala "${roomData.nome}" (ID: ${roomData.id}) não encontrada no projeto`);
        return false;
    }

    console.log(`🔄 Preenchendo sala "${roomData.nome}" (ID: ${roomData.id})`, roomData);

    try {
        // Preencher nome da sala
        const roomTitle = roomElement.querySelector('.room-title');
        if (roomTitle && roomData.nome) {
            roomTitle.textContent = roomData.nome;
        }

        // Preencher inputs de climatização
        if (roomData.inputs) {
            fillClimatizationInputs(roomElement, roomData.inputs);
        }

        // Preencher ganhos térmicos
        if (roomData.ganhosTermicos) {
            fillThermalGainsData(roomElement, roomData.ganhosTermicos);
        }

        // Preencher capacidade
        if (roomData.capacidade) {
            fillCapacityData(roomElement, roomData.capacidade);
        }

        // Preencher configurações
        if (roomData.configuracao) {
            fillConfigurationData(roomElement, roomData.configuracao);
        }

        // ✅ NOVO: Preencher máquinas (aguardar um pouco para garantir que a seção esteja carregada)
        // ✅ NOVO: Preencher máquinas (com timing melhorado)
        if (roomData.maquinas && Array.isArray(roomData.maquinas)) {
            setTimeout(async () => {
                console.log(`🤖 Iniciando preenchimento de ${roomData.maquinas.length} máquina(s) para sala ${roomData.nome}`);
                const success = await fillMachinesData(roomElement, roomData.maquinas);
                if (success) {
                    console.log(`🎉 Todas as máquinas preenchidas com sucesso para sala ${roomData.nome}`);
                    
                    // ✅ CORREÇÃO: VERIFICAR SE AS MÁQUINAS ESTÃO VISÍVEIS
                    setTimeout(() => {
                        const machinesContainer = document.getElementById(`machines-${roomData.id}`);
                        if (machinesContainer) {
                            const visibleMachines = machinesContainer.querySelectorAll('.climatization-machine');
                            console.log(`📊 Máquinas visíveis no DOM: ${visibleMachines.length}`);
                            visibleMachines.forEach((machine, index) => {
                                console.log(`  Máquina ${index + 1}:`, {
                                    name: machine.querySelector('.machine-name-input')?.value,
                                    type: machine.querySelector('.machine-type-select')?.value,
                                    power: machine.querySelector('.machine-power-select')?.value
                                });
                            });
                        }
                    }, 2000);
                } else {
                    console.error(`❌ Falha ao preencher máquinas para sala ${roomData.nome}`);
                }
            }, 1500); // ✅ Aumentar delay para garantir que a seção esteja completamente carregada
        }

        console.log(`✅ Sala "${roomData.nome}" preenchida com sucesso`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher sala "${roomData.nome}":`, error);
        return false;
    }
}

// Exportar todas as funções de preenchimento
export {
    populateObraData,
    populateProjectData,
    populateRoomData,
    fillClimatizationInputs,
    fillThermalGainsData,
    fillCapacityData,
    fillConfigurationData,
    fillMachinesData,
    populateMachineData,
    waitForElement
}