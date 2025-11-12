/**
 * data/builders/ui-builders.js
 * 🎯 FUSÃO COMPLETA: data-populate.js + server-utils.js
 * ⚡ REDUÇÃO: 2 arquivos → 1 arquivo (~900 → ~600 linhas)
 */
import { buildMachinesSection, addMachine } from '../modules/machines/machines-core.js';
import { updateObraButtonAfterSave } from '../../features/managers/obra-manager.js';
import { createEmptyRoom } from '../modules/rooms.js';
import { calculateVazaoArAndThermalGains } from '../../features/calculations/air-flow.js';
import { ensureStringId, generateObraId } from '../utils/id-generator.js';
import {waitForElement} from '../../utils/core-utils.js'
/**
 * 🏗️ FUNÇÕES DE RENDERIZAÇÃO (server-utils.js)
 */

/**
 * Renderiza uma obra completa a partir dos dados carregados do servidor
 * @param {Object} obraData - Dados completos da obra
 * @returns {void}
 */
function renderObraFromData(obraData) {
    const obraName = obraData.nome;
    const obraId = ensureStringId(obraData.id);

    console.log(`🎯 Renderizando obra: ${obraName} (ID: ${obraId})`);

    createEmptyObra(obraName, obraId);

    if (obraData.projetos && obraData.projetos.length > 0) {
        const obraContent = document.getElementById(`obra-content-${obraId}`);

        if (obraContent) {
            const emptyMessage = obraContent.querySelector(".empty-message");
            if (emptyMessage) {
                emptyMessage.remove();
            }

            setTimeout(() => {
                obraData.projetos.forEach((projectData) => {
                    renderProjectFromData(projectData, obraId, obraName);
                });
            }, 100);
        }
    }

    console.log(`✅ Obra ${obraName} renderizada com sucesso (ID: ${obraId})`);
}

/**
 * Renderiza um projeto completo a partir dos dados carregados
 * @param {Object} projectData - Dados completos do projeto
 * @param {string} obraId - ID único da obra pai
 * @param {string} obraName - Nome da obra pai
 * @returns {void}
 */
function renderProjectFromData(projectData, obraId = null, obraName = null) {
    const projectName = projectData.nome;
    const projectId = ensureStringId(projectData.id);

    console.log(`🎯 Renderizando projeto: ${projectName} (ID: ${projectId})`);

    if (!obraId) {
        const existingProject = document.querySelector(`[data-project-id="${projectId}"]`);
        obraId = existingProject?.dataset.obraId;
        obraName = existingProject?.dataset.obraName;
    }

    if (!obraId) {
        const obras = document.querySelectorAll('.obra-block');
        if (obras.length > 0) {
            const primeiraObra = obras[0];
            obraId = primeiraObra.dataset.obraId;
            obraName = primeiraObra.dataset.obraName;
        } else {
            obraName = 'Obra1';
            obraId = generateObraId();
            createEmptyObra(obraName, obraId);
        }
    }

    createEmptyProject(obraId, obraName, projectId, projectName);

    if (projectData.salas && projectData.salas.length > 0) {
        const projectContent = document.getElementById(`project-content-${projectId}`);

        if (projectContent) {
            const emptyMessage = projectContent.querySelector(".empty-message");
            if (emptyMessage) {
                emptyMessage.remove();
            }

            setTimeout(() => {
                projectData.salas.forEach((roomData) => {
                    renderRoomFromData(projectId, projectName, roomData, obraId, obraName);
                });
            }, 100);
        }
    }

    if (projectId) {
        updateProjectButton(projectName, true);
    }

    console.log(`✅ Projeto ${projectName} renderizado com sucesso`);
}

/**
 * Renderiza uma sala individual a partir dos dados carregados
 * @param {string} projectId - ID único do projeto pai
 * @param {string} projectName - Nome do projeto pai
 * @param {Object} roomData - Dados completos da sala
 * @param {string} obraId - ID único da obra pai
 * @param {string} obraName - Nome da obra pai
 * @returns {void}
 */
function renderRoomFromData(projectId, projectName, roomData, obraId = null, obraName = null) {
    const roomName = roomData.nome;
    const roomId = ensureStringId(roomData.id);

    console.log(`🎯 Renderizando sala: ${roomName} no projeto ${projectName}`, {
        obra: obraName,
        projectId: projectId,
        roomId: roomId,
        inputs: Object.keys(roomData.inputs || {}).length,
        maquinas: roomData.maquinas?.length || 0,
        capacidade: Object.keys(roomData.capacidade || {}).length,
        ganhosTermicos: Object.keys(roomData.ganhosTermicos || {}).length,
        configuracao: Object.keys(roomData.configuracao || {}).length
    });

    setTimeout(() => {
        createEmptyRoom(obraId, projectId, roomName, roomId);

        setTimeout(() => {
            populateRoomInputs(projectId, projectName, roomId, roomName, roomData, obraId, obraName);
        }, 100);
        
    }, 100);
}

/**
 * 🔧 FUNÇÕES DE PREENCHIMENTO ESPECÍFICAS (data-populate.js)
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

    const roomId = roomElement.dataset.roomId;
    
    // PRIMEIRO: Processar pressurização (radio buttons) - CRÍTICO
    if (inputsData.pressurizacao !== undefined) {
        console.log(`🎯 Processando pressurização para sala ${roomId}:`, inputsData.pressurizacao);
        
        // ✅ CORREÇÃO: Garantir que pressurizacao seja boolean
        const isPressurizacaoAtiva = typeof inputsData.pressurizacao === 'boolean' 
            ? inputsData.pressurizacao 
            : inputsData.pressurizacao === 'true' || inputsData.pressurizacao === true || inputsData.pressurizacao === 1;
        
        const pressurizacaoValue = isPressurizacaoAtiva ? 'sim' : 'nao';
        
        console.log(`🔍 Buscando radio buttons para sala ${roomId}, valor: ${pressurizacaoValue}`);
        
        // Buscar todos os radios de pressurização na sala
        const pressurizacaoRadios = roomElement.querySelectorAll(`input[type="radio"][name*="pressurizacao"]`);
        
        console.log(`📻 Encontrados ${pressurizacaoRadios.length} radios de pressurização`);
        
        let radioToCheck = null;
        pressurizacaoRadios.forEach(radio => {
            console.log(`🔘 Radio: value="${radio.value}", checked=${radio.checked}`);
            if (radio.value === pressurizacaoValue) {
                radioToCheck = radio;
            }
        });

        if (radioToCheck) {
            // Desselecionar todos primeiro
            pressurizacaoRadios.forEach(radio => {
                radio.checked = false;
            });
            
            // Selecionar o correto
            radioToCheck.checked = true;
            console.log(`✅ Pressurização definida: ${pressurizacaoValue} para sala ${roomId}`);
            
            // Disparar evento change para atualizar campos dependentes
            setTimeout(() => {
                console.log(`🎬 Disparando evento change para pressurização`);
                const event = new Event('change', { bubbles: true });
                radioToCheck.dispatchEvent(event);
            }, 100);
        } else {
            console.error(`❌ Radio button de pressurização não encontrado para valor: ${pressurizacaoValue}`);
        }
    }

    // SEGUNDO: Preencher inputs específicos da pressurização primeiro
    setTimeout(() => {
        console.log(`🔧 Preenchendo campos específicos de pressurização para ${roomId}`);
        
        // ✅ CORREÇÃO: Preencher pressurizacaoSetpoint como número
        if (inputsData.pressurizacaoSetpoint !== undefined) {
            const pressurizacaoInput = roomElement.querySelector(`.clima-input[data-field="pressurizacaoSetpoint"]`);
            if (pressurizacaoInput) {
                // Converter para número garantido
                const numericValue = parseFloat(inputsData.pressurizacaoSetpoint) || 25;
                pressurizacaoInput.value = numericValue;
                console.log(`✅ Campo pressurizacaoSetpoint definido: ${numericValue}`);
                
                setTimeout(() => {
                    const event = new Event('change', { bubbles: true });
                    pressurizacaoInput.dispatchEvent(event);
                }, 50);
            } else {
                console.warn(`⚠️ Campo pressurizacaoSetpoint não encontrado na sala ${roomId}`);
            }
        }

        // ✅ CORREÇÃO: Preencher numPortasDuplas como número
        if (inputsData.numPortasDuplas !== undefined) {
            const portasDuplasInput = roomElement.querySelector(`.clima-input[data-field="numPortasDuplas"]`);
            if (portasDuplasInput) {
                const numericValue = parseFloat(inputsData.numPortasDuplas) || 0;
                portasDuplasInput.value = numericValue;
                console.log(`✅ Campo numPortasDuplas definido: ${numericValue}`);
            }
        }

        // ✅ CORREÇÃO: Preencher numPortasSimples como número
        if (inputsData.numPortasSimples !== undefined) {
            const portasSimplesInput = roomElement.querySelector(`.clima-input[data-field="numPortasSimples"]`);
            if (portasSimplesInput) {
                const numericValue = parseFloat(inputsData.numPortasSimples) || 0;
                portasSimplesInput.value = numericValue;
                console.log(`✅ Campo numPortasSimples definido: ${numericValue}`);
            }
        }

    }, 200);

    // TERCEIRO: Preencher outros inputs gerais
    setTimeout(() => {
        const textInputs = roomElement.querySelectorAll('.clima-input[type="text"], .clima-input[type="number"], .clima-input[data-field]');
        console.log(`📋 Encontrados ${textInputs.length} inputs para processar`);
        
        textInputs.forEach(input => {
            const field = input.getAttribute('data-field');
            if (!field || inputsData[field] === undefined) {
                console.log(`⏭️  Campo ${field} não encontrado nos dados, pulando`);
                return;
            }

            // Pular campos já preenchidos específicos da pressurização
            if (field === 'pressurizacaoSetpoint' || field === 'numPortasDuplas' || field === 'numPortasSimples') {
                console.log(`⏭️  Campo ${field} já preenchido, pulando`);
                return;
            }
            
            let value = inputsData[field];
            
            // ✅ CORREÇÃO: Converter boolean e valores inválidos para número
            if (input.type === 'number') {
                if (value === false || value === 'false' || value === null || value === '') {
                    value = 0;
                }
                if (value === true || value === 'true') {
                    value = 1;
                }
                
                // Garantir que é um número válido
                const numericValue = parseFloat(value);
                value = isNaN(numericValue) ? 0 : numericValue;
            }
            
            input.value = value;
            console.log(`✅ Campo ${field} preenchido: ${value}`);

            setTimeout(() => {
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }, 50);
        });

        // QUARTO: Preencher selects
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

        // QUINTO: Verificação final do estado
        setTimeout(() => {
            console.log(`🔍 Verificação final do estado para sala ${roomId}`);
            
            // Verificar estado dos campos de pressurização
            const pressurizacaoInput = roomElement.querySelector('.clima-input[data-field="pressurizacaoSetpoint"]');
            const portasDuplasInput = roomElement.querySelector('.clima-input[data-field="numPortasDuplas"]');
            const portasSimplesInput = roomElement.querySelector('.clima-input[data-field="numPortasSimples"]');
            
            console.log(`📊 Estado final dos campos:`);
            console.log(`- Pressurização Setpoint:`, pressurizacaoInput?.value);
            console.log(`- Portas Duplas:`, portasDuplasInput?.value);
            console.log(`- Portas Simples:`, portasSimplesInput?.value);
            console.log(`- Pressurização ativa:`, inputsData.pressurizacao);
            
            // Se pressurização for false, garantir que campos relacionados estejam zerados
            if (inputsData.pressurizacao === false) {
                console.log(`🔒 Pressurização desativada - verificando campos`);
                if (pressurizacaoInput && (!inputsData.pressurizacaoSetpoint || inputsData.pressurizacaoSetpoint === "0" || inputsData.pressurizacaoSetpoint === 0)) {
                    pressurizacaoInput.value = "0";
                    console.log(`✅ Pressurização desativada - setpoint zerado`);
                }
                if (portasDuplasInput && (!inputsData.numPortasDuplas || inputsData.numPortasDuplas === "0" || inputsData.numPortasDuplas === 0)) {
                    portasDuplasInput.value = "0";
                    console.log(`✅ Pressurização desativada - portas duplas zeradas`);
                }
                if (portasSimplesInput && (!inputsData.numPortasSimples || inputsData.numPortasSimples === "0" || inputsData.numPortasSimples === 0)) {
                    portasSimplesInput.value = "0";
                    console.log(`✅ Pressurização desativada - portas simples zeradas`);
                }
            }
            
            // Disparar cálculo final após todos os campos estarem preenchidos
            if (roomId && typeof calculateVazaoArAndThermalGains === 'function') {
                setTimeout(() => {
                    console.log(`🧮 Disparando cálculo final para sala ${roomId}`);
                    calculateVazaoArAndThermalGains(roomId);
                }, 300);
            }
        }, 150);

    }, 400); // Delay maior para garantir que a pressurização foi processada primeiro

    console.log(`✅ Processo de preenchimento iniciado para sala ${roomId}`);
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

    const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`);
    if (fatorSegurancaInput && capacityData.fatorSeguranca !== undefined) {
        fatorSegurancaInput.value = capacityData.fatorSeguranca;
        console.log(`✅ Fator segurança preenchido: ${capacityData.fatorSeguranca}`);
    }

    const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`);
    if (capacidadeUnitariaSelect && capacityData.capacidadeUnitaria !== undefined) {
        capacidadeUnitariaSelect.value = capacityData.capacidadeUnitaria;
        console.log(`✅ Capacidade unitária preenchida: ${capacityData.capacidadeUnitaria}`);
    }

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
 * Encontra seção de máquinas pelo título
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {HTMLElement|null} Elemento da seção de máquinas
 */
function findMachinesSection(roomElement) {
    if (!roomElement) return null;
    
    // Buscar todas as seções .section-block
    const allSections = roomElement.querySelectorAll('.section-block');
    
    // Encontrar a que tem "Máquinas" no título
    for (let section of allSections) {
        const title = section.querySelector('.section-title');
        if (title && title.textContent.includes('Máquinas')) {
            return section;
        }
    }
    
    return null;
}

// ✅ FUNÇÃO AUXILIAR: Encontrar seção por título
function findSectionByTitle(roomElement, titleText) {
    if (!roomElement) return null;
    
    const allSections = roomElement.querySelectorAll('.section-block');
    
    for (let section of allSections) {
        const title = section.querySelector('.section-title');
        if (title && title.textContent.includes(titleText)) {
            return section;
        }
    }
    
    return null;
}

/**
 * Garante que todas as seções da sala estão criadas e inicializadas
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Promise<boolean>} True se todas as seções foram criadas
 */
async function ensureAllRoomSections(roomElement) {
    if (!roomElement) {
        console.error('❌ Elemento da sala inválido');
        return false;
    }

    const obraId = roomElement.dataset.obraId;
    const projectId = roomElement.dataset.projectId; 
    const roomName = roomElement.dataset.roomName;
    const roomId = roomElement.dataset.roomId;

    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`❌ Room ID inválido: "${roomId}" para sala ${roomName}`);
        return false;
    }

    console.log(`🔨 Verificando seções da sala ${roomName} (ID: ${roomId})`);

    // ✅ CORREÇÃO: Usar as novas funções para verificar seções
    const climatizationSection = findSectionByTitle(roomElement, 'Climatização');
    const machinesSection = findMachinesSection(roomElement);
    const configurationSection = findSectionByTitle(roomElement, 'Configuração');

    if (climatizationSection && machinesSection && configurationSection) {
        console.log(`✅ Todas as seções já existem para sala ${roomName}`);
        return true;
    }

    console.log(`🔄 Criando seções faltantes para sala ${roomName}`);

    try {
        const roomContent = roomElement.querySelector('.room-content');
        if (!roomContent) {
            console.error(`❌ Container de conteúdo da sala não encontrado`);
            return false;
        }

        if (!climatizationSection) {
            console.log(`🏗️ Criando todas as seções para sala ${roomName}`);

            if (typeof window.buildClimatizationSection !== 'function' || 
                typeof buildMachinesSection !== 'function' ||
                typeof window.buildConfigurationSection !== 'function') {
                console.error('❌ Funções de construção de seções não disponíveis');
                return false;
            }

            // Criar seção de climatização
            const climatizationHTML = await window.buildClimatizationSection(obraId, projectId, roomName, roomId);
            if (climatizationHTML) {
                roomContent.insertAdjacentHTML('beforeend', climatizationHTML);
                console.log(`✅ Seção de climatização criada`);
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // Criar seção de máquinas
            const machinesHTML = await buildMachinesSection(obraId, projectId, roomName, roomId);
            if (machinesHTML) {
                roomContent.insertAdjacentHTML('beforeend', machinesHTML);
                console.log(`✅ Seção de máquinas criada`);
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // Criar seção de configuração
            const configurationHTML = await window.buildConfigurationSection(obraId, projectId, roomName, roomId);
            if (configurationHTML) {
                roomContent.insertAdjacentHTML('beforeend', configurationHTML);
                console.log(`✅ Seção de configuração criada`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            console.log(`✅ Todas as seções criadas para sala ${roomName}`);
            return true;
        }

        // Criar apenas seções faltantes
        if (climatizationSection && !machinesSection) {
            console.log(`🔨 Criando apenas seção de máquinas para sala ${roomName}`);

            const machinesHTML = await buildMachinesSection(obraId, projectId, roomName, roomId);
            if (machinesHTML) {
                climatizationSection.insertAdjacentHTML('afterend', machinesHTML);
                console.log(`✅ Seção de máquinas criada`);
                
                await new Promise(resolve => setTimeout(resolve, 500));
                return true;
            }
        }

        console.log(`❌ Não foi possível criar todas as seções para sala ${roomName}`);
        return false;

    } catch (error) {
        console.error(`❌ Erro ao criar seções da sala ${roomName}:`, error);
        return false;
    }
}


/**
 * Garante que a seção de máquinas existe e está inicializada - VERSÃO CORRIGIDA
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Promise<HTMLElement>} Elemento da seção de máquinas
 */
async function ensureMachinesSection(roomElement) {
    if (!roomElement) {
        console.error('❌ Elemento da sala inválido');
        return null;
    }

    const obraId = roomElement.dataset.obraId;
    const projectId = roomElement.dataset.projectId;
    const roomName = roomElement.dataset.roomName;
    const roomId = roomElement.dataset.roomId;

    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`❌ Room ID inválido: "${roomId}" para sala ${roomName}`);
        return null;
    }

    console.log(`🔨 Garantindo seção de máquinas para sala ${roomName} (ID: ${roomId})`);

    // Primeiro garantir que todas as seções existem
    const sectionsReady = await ensureAllRoomSections(roomElement);
    if (!sectionsReady) {
        console.error(`❌ Não foi possível garantir todas as seções para sala ${roomName}`);
        return null;
    }

    // ✅ CORREÇÃO: Buscar por .section-block que contenha "Máquinas" no título
    let machinesSection = findMachinesSection(roomElement);
    
    if (machinesSection) {
        console.log(`✅ Seção de máquinas encontrada para sala ${roomName}`);
        return machinesSection;
    }

    // Se ainda não existe, tentar criar apenas a seção de máquinas
    console.log(`🔄 Tentando criar apenas seção de máquinas para sala ${roomName}`);

    // Encontrar a última seção para inserir após ela
    const lastSection = roomElement.querySelector('.section-block:last-child') || 
                       roomElement.querySelector('.room-content > :last-child');

    if (!lastSection) {
        console.error(`❌ Nenhuma seção encontrada para inserir máquinas`);
        return null;
    }

    if (typeof buildMachinesSection !== 'function') {
        console.error('❌ Função buildMachinesSection não disponível');
        return null;
    }

    try {
        const machinesHTML = await buildMachinesSection(obraId, projectId, roomName, roomId);
        if (!machinesHTML) {
            console.error('❌ HTML da seção de máquinas não gerado');
            return null;
        }

        lastSection.insertAdjacentHTML('afterend', machinesHTML);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ✅ CORREÇÃO: Usar a nova função para encontrar a seção
        machinesSection = findMachinesSection(roomElement);
        if (machinesSection) {
            console.log(`✅ Seção de máquinas criada com sucesso para sala ${roomName}`);
            return machinesSection;
        } else {
            console.error(`❌ Seção de máquinas não encontrada após criação`);
            return null;
        }

    } catch (error) {
        console.error(`❌ Erro ao criar seção de máquinas:`, error);
        return null;
    }
}

/**
 * Preenche os dados das máquinas de uma sala - VERSÃO CORRIGIDA
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {Array} machinesData - Array de dados das máquinas
 * @returns {Promise<boolean>} True se o preenchimento foi bem-sucedido
 */
async function fillMachinesData(roomElement, machinesData) {
    if (!roomElement || !machinesData || !Array.isArray(machinesData)) {
        console.error('❌ Elemento da sala ou dados de máquinas inválidos');
        return false;
    }

    const roomId = roomElement.dataset.roomId;
    const roomName = roomElement.dataset.roomName;
    
    console.log(`🔄 Preenchendo ${machinesData.length} máquina(s) para sala ${roomName} (ID: ${roomId})`);

    // ✅ CORREÇÃO: Verificar se há máquinas para preencher
    if (machinesData.length === 0) {
        console.log(`ℹ️ Nenhuma máquina para preencher na sala ${roomName}`);
        return true; // Retorna true porque não há erro, só não há máquinas
    }

    try {
        const machinesSection = await ensureMachinesSection(roomElement);
        if (!machinesSection) {
            console.error(`❌ Não foi possível criar/obter seção de máquinas para sala ${roomName}`);
            return false;
        }

        const machinesContainer = machinesSection.querySelector('.machines-container');
        if (!machinesContainer) {
            console.error(`❌ Container de máquinas não encontrado para sala ${roomName}`);
            return false;
        }

        console.log(`✅ Container de máquinas encontrado`);

        // Limpar máquinas existentes
        const existingMachines = machinesContainer.querySelectorAll('.climatization-machine, .machine-block');
        if (existingMachines.length > 0) {
            console.log(`🗑️ Removendo ${existingMachines.length} máquina(s) existente(s)`);
            existingMachines.forEach(machine => machine.remove());
        }

        let successCount = 0;

        // Adicionar cada máquina
        for (let i = 0; i < machinesData.length; i++) {
            const machineData = machinesData[i];
            
            if (!machineData || !machineData.tipo) {
                console.warn(`⚠️ Dados da máquina ${i} inválidos:`, machineData);
                continue;
            }

            console.log(`🤖 [${i + 1}/${machinesData.length}] Adicionando máquina: ${machineData.tipo}`);

            try {
                // ✅ CORREÇÃO: Usar addMachine com retry
                let machineAdded = false;
                let retryCount = 0;
                
                while (!machineAdded && retryCount < 3) {
                    machineAdded = await addMachine(roomId, machineData.tipo);
                    
                    if (!machineAdded) {
                        retryCount++;
                        console.log(`🔄 Tentativa ${retryCount}/3 para adicionar máquina ${machineData.tipo}`);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                
                if (!machineAdded) {
                    console.error(`❌ Falha ao adicionar máquina ${machineData.tipo} após ${retryCount} tentativas`);
                    continue;
                }

                console.log(`✅ Máquina ${machineData.tipo} adicionada, aguardando renderização...`);

                // Aguardar renderização completa
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Encontrar a máquina mais recente
                const machineElements = machinesContainer.querySelectorAll('.climatization-machine');
                const lastMachine = machineElements[machineElements.length - 1];
                
                if (!lastMachine) {
                    console.error(`❌ Elemento da máquina não encontrado após adição`);
                    continue;
                }

                console.log(`✅ Elemento da máquina encontrado, preenchendo dados...`);

                // Preencher dados da máquina
                const populated = await populateMachineData(lastMachine, machineData);
                if (populated) {
                    successCount++;
                    console.log(`🎉 Máquina ${machineData.tipo} preenchida com sucesso`);
                } else {
                    console.error(`❌ Falha ao preencher dados da máquina ${machineData.tipo}`);
                }

            } catch (error) {
                console.error(`❌ Erro ao processar máquina ${machineData.tipo}:`, error);
            }

            // Pequena pausa entre máquinas
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`✅ ${successCount}/${machinesData.length} máquina(s) preenchida(s) com sucesso para sala ${roomName}`);
        
        // ✅ CORREÇÃO: Retorna true se pelo menos uma máquina foi preenchida, ou se não havia máquinas
        return successCount > 0 || machinesData.length === 0;

    } catch (error) {
        console.error(`❌ Erro crítico ao preencher máquinas para sala ${roomName}:`, error);
        return false;
    }
}


/**
 * 🎯 FUNÇÕES DE PREENCHIMENTO HIERÁRQUICO
 */


/**
 * Preenche os dados de uma obra a partir do JSON
 * @param {Object} obraData - Dados da obra do JSON
 * @returns {Promise<void>}
 */
async function populateObraData(obraData) {
    if (!obraData || typeof obraData !== 'object') {
        console.error('❌ Dados inválidos recebidos para populateObraData:', obraData);
        return;
    }
    
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

    let obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    
    if (!obraElement) {
        console.log(`🔨 Criando nova obra: "${obraName}"`);
        
        const obraHTML = buildObraHTML(obraName, obraId, true);
        
        const container = document.getElementById("projects-container");
        if (container) {
            container.insertAdjacentHTML("beforeend", obraHTML);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
            console.log(`✅ Obra criada no DOM: ${obraName} com botão "Atualizar Obra"`);
        } else {
            console.error('❌ Container de projetos não encontrado');
            return;
        }
    } else {
        console.log(`✅ Obra já existe no DOM: ${obraName}`, obraElement);
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

    if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
        console.error('❌ Funções necessárias não disponíveis:', {
            createEmptyProject: typeof window.createEmptyProject,
            createEmptyRoom: typeof window.createEmptyRoom
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
            console.error('❌ Funções ainda não disponíveis após espera');
            return;
        }
    }

    console.log(`🔧 Funções disponíveis: createEmptyProject: function, createEmptyRoom: function`);

    const projectsContainer = obraElement.querySelector('.projects-container');
    if (projectsContainer) {
        const existingProjects = projectsContainer.querySelectorAll('.project-block');
        if (existingProjects.length > 0) {
            console.log(`🗑️ Removendo ${existingProjects.length} projetos existentes antes do preenchimento`);
            existingProjects.forEach(project => project.remove());
        }
    }

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
            console.log(`🎯 Chamando createEmptyProject para obra "${obraName}" (${obraId}), projeto "${projectName}" (${projectId})`);
            
            const projectCreated = await window.createEmptyProject(obraId, obraName, projectId, projectName);
            
            if (!projectCreated) {
                console.error(`❌ Falha ao criar projeto ${projectName}`);
                continue;
            }

            const projectElement = await waitForElement(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`, 5000);
            
            if (!projectElement) {
                console.error(`❌ Projeto ${projectName} não encontrado no DOM após criação`);
                
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

            await populateProjectData(projectElement, projectData, obraId, obraName);

        } catch (error) {
            console.error(`❌ Erro ao criar projeto ${projectName}:`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Obra "${obraName}" preenchida com sucesso - ${projetos.length} projeto(s) processado(s)`);
}

/**
 * Preenche os dados de um projeto a partir do JSON
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

    const roomsContainer = projectElement.querySelector('.rooms-container');
    if (roomsContainer) {
        const existingRooms = roomsContainer.querySelectorAll('.room-block');
        if (existingRooms.length > 0) {
            console.log(`🗑️ Removendo ${existingRooms.length} salas existentes antes do preenchimento`);
            existingRooms.forEach(room => room.remove());
        }
    }

    const salas = projectData.salas || [];
    console.log(`🚪 Processando ${salas.length} sala(s) para o projeto "${projectName}"`);
    
    for (let i = 0; i < salas.length; i++) {
        const roomData = salas[i];
        const roomName = roomData.nome;
        const roomId = roomData.id;
        
        if (!roomName || !roomId) {
            console.warn(`⚠️ Sala ${i} inválida ou sem nome/ID:`, roomData);
            continue;
        }

        console.log(`🚪 [${i + 1}/${salas.length}] Criando sala: ${roomName} (ID: ${roomId})`);

        try {
            if (typeof window.createEmptyRoom !== 'function') {
                console.error('❌ createEmptyRoom não disponível');
                continue;
            }

            const roomCreated = await window.createEmptyRoom(obraId, projectId, roomName, roomId);
            
            if (!roomCreated) {
                console.error(`❌ Falha ao criar sala ${roomName}`);
                continue;
            }

            const roomElement = await waitForElement(`[data-room-id="${roomId}"]`, 3000);
            
            if (!roomElement) {
                console.error(`❌ Sala ${roomName} não encontrada no DOM após criação`);
                
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

            await populateRoomData(roomElement, roomData);

        } catch (error) {
            console.error(`❌ Falha ao criar sala ${roomName}:`, error);
        }
        
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
    
    // ✅ CORREÇÃO: Validar roomId antes de prosseguir
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`❌ Room ID inválido no populateRoomData: "${roomId}"`);
        console.log('🔍 Elemento da sala:', roomElement);
        console.log('🔍 Dataset:', roomElement.dataset);
        return false;
    }
    
    console.log(`🔄 Preenchendo sala "${roomName}" (ID: ${roomId})`, roomData);

    try {
        // ✅ CORREÇÃO: Garantir que todas as seções existam antes de preencher
        console.log(`🏗️ Garantindo que todas as seções existem para sala ${roomName}`);
        const sectionsReady = await ensureAllRoomSections(roomElement);
        if (!sectionsReady) {
            console.error(`❌ Não foi possível garantir seções para sala ${roomName}`);
            return false;
        }

        const roomTitle = roomElement.querySelector('.room-title');
        if (roomTitle && roomData.nome) {
            roomTitle.textContent = roomData.nome;
            console.log(`✅ Título da sala atualizado: ${roomData.nome}`);
        }

        if (roomData.inputs) {
            console.log(`🌡️ Preenchendo inputs de climatização para sala ${roomName}`);
            fillClimatizationInputs(roomElement, roomData.inputs);
        }

        if (roomData.ganhosTermicos) {
            console.log(`📊 Preenchendo ganhos térmicos para sala ${roomName}`);
            fillThermalGainsData(roomElement, roomData.ganhosTermicos);
        }

        if (roomData.capacidade) {
            console.log(`⚡ Preenchendo dados de capacidade para sala ${roomName}`);
            fillCapacityData(roomElement, roomData.capacidade);
        }

        if (roomData.configuracao) {
            console.log(`⚙️ Preenchendo configurações para sala ${roomName}`);
            fillConfigurationData(roomElement, roomData.configuracao);
        }

        if (roomData.maquinas && Array.isArray(roomData.maquinas)) {
            console.log(`🤖 Agendando preenchimento de ${roomData.maquinas.length} máquina(s) para sala ${roomName}`);
            
            // ✅ Aumentar o tempo de espera para garantir que tudo esteja carregado
            setTimeout(async () => {
                try {
                    console.log(`🚀 Iniciando preenchimento de máquinas para sala ${roomName}`);
                    
                    // ✅ Verificar novamente se as seções estão prontas
                    const sectionsReady = await ensureAllRoomSections(roomElement);
                    if (!sectionsReady) {
                        console.error(`❌ Seções não prontas para preencher máquinas`);
                        return;
                    }
                    
                    const success = await fillMachinesData(roomElement, roomData.maquinas);
                    
                    if (success) {
                        console.log(`🎉 Todas as máquinas preenchidas com sucesso para sala ${roomName}`);
                    } else {
                        console.error(`❌ Falha ao preencher máquinas para sala ${roomName}`);
                    }
                } catch (error) {
                    console.error(`💥 Erro ao preencher máquinas para sala ${roomName}:`, error);
                }
            }, 3000); // ✅ Aumentado para 3 segundos
        }

        console.log(`✅ Sala "${roomName}" preenchida com sucesso`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher sala "${roomName}":`, error);
        return false;
    }
}

/**
 * Preenche os dados individuais de uma máquina
 * @param {HTMLElement} machineElement - Elemento HTML da máquina
 * @param {Object} machineData - Dados da máquina
 * @returns {Promise<boolean>}
 */
async function populateMachineData(machineElement, machineData) {
    if (!machineElement || !machineData) {
        console.error('❌ Elemento da máquina ou dados inválidos');
        return false;
    }

    console.log(`🔧 Preenchendo dados da máquina:`, machineData);

    try {
        const machineId = machineElement.dataset.machineId;

        // 1. DEFINIR TIPO (se disponível)
        const typeSelect = machineElement.querySelector('.machine-type-select');
        if (typeSelect && machineData.tipo) {
            typeSelect.value = machineData.tipo;
            const typeEvent = new Event('change', { bubbles: true });
            typeSelect.dispatchEvent(typeEvent);
            console.log(`✅ Tipo definido: ${machineData.tipo}`);
            
            // Aguardar processamento do tipo
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 2. DEFINIR CAPACIDADE (se disponível e habilitado)
        const powerSelect = machineElement.querySelector('.machine-power-select');
        if (powerSelect && machineData.potencia) {
            // Aguardar até que o select esteja habilitado (máx 3 segundos)
            let attempts = 0;
            while (powerSelect.disabled && attempts < 6) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
                console.log(`⏳ Aguardando habilitação da capacidade... (${attempts}/6)`);
            }
            
            if (!powerSelect.disabled) {
                const powerOption = Array.from(powerSelect.options).find(opt => 
                    opt.text.includes(machineData.potencia) || 
                    opt.value.includes(machineData.potencia) ||
                    opt.text.toLowerCase().includes(machineData.potencia.toLowerCase())
                );
                
                if (powerOption) {
                    powerSelect.value = powerOption.value;
                    const powerEvent = new Event('change', { bubbles: true });
                    powerSelect.dispatchEvent(powerEvent);
                    console.log(`✅ Capacidade definida: ${powerOption.value}`);
                    
                    // Aguardar processamento da capacidade
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    console.log(`⚠️ Capacidade "${machineData.potencia}" não encontrada`);
                }
            } else {
                console.log(`⚠️ Select de capacidade permanece desabilitado`);
            }
        }

        // 3. DEFINIR TENSÃO (se disponível e habilitado)
        const voltageSelect = machineElement.querySelector('.machine-voltage-select');
        if (voltageSelect && machineData.tensao) {
            // Aguardar até que o select esteja habilitado (máx 3 segundos)
            let attempts = 0;
            while (voltageSelect.disabled && attempts < 6) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
                console.log(`⏳ Aguardando habilitação da tensão... (${attempts}/6)`);
            }
            
            if (!voltageSelect.disabled) {
                const voltageOption = Array.from(voltageSelect.options).find(opt => 
                    opt.text.includes(machineData.tensao) || 
                    opt.value.includes(machineData.tensao) ||
                    opt.text.toLowerCase().includes(machineData.tensao.toLowerCase())
                );
                
                if (voltageOption) {
                    voltageSelect.value = voltageOption.value;
                    const voltageEvent = new Event('change', { bubbles: true });
                    voltageSelect.dispatchEvent(voltageEvent);
                    console.log(`✅ Tensão definida: ${voltageOption.value}`);
                } else {
                    console.log(`⚠️ Tensão "${machineData.tensao}" não encontrada`);
                }
            } else {
                console.log(`⚠️ Select de tensão permanece desabilitado`);
            }
        }

        // 4. DEFINIR OPÇÕES SELECIONADAS (se disponíveis)
        if (machineData.opcoesSelecionadas && Array.isArray(machineData.opcoesSelecionadas)) {
            // Aguardar carregamento das opções
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const optionsContainer = machineElement.querySelector('.options-grid');
            
            if (optionsContainer) {
                const allCheckboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
                console.log(`🔍 Encontrados ${allCheckboxes.length} checkboxes de opções`);

                let optionsMarked = 0;
                machineData.opcoesSelecionadas.forEach(optionObj => {
                    // ✅ CORREÇÃO: Suporta tanto array de strings quanto array de objetos
                    let optionName;
                    if (typeof optionObj === 'string') {
                        optionName = optionObj;
                    } else if (typeof optionObj === 'object') {
                        optionName = optionObj.name || optionObj.originalName;
                    }
                    
                    if (!optionName) {
                        console.log(`⚠️ Opção inválida:`, optionObj);
                        return;
                    }

                    console.log(`Procurando opção: "${optionName}"`);
                    
                    // Buscar pelo data-option-name (mais confiável)
                    const checkbox = Array.from(allCheckboxes).find(cb => {
                        const dataName = cb.getAttribute('data-option-name');
                        return dataName === optionName;
                    });
                    
                    if (checkbox) {
                        checkbox.checked = true;
                        const checkboxEvent = new Event('change', { bubbles: true });
                        checkbox.dispatchEvent(checkboxEvent);
                        optionsMarked++;
                        console.log(`✅ Opção marcada: ${optionName}`);
                    } else {
                        console.log(`❌ Opção não encontrada: "${optionName}"`);
                        
                        // Debug: tentar encontrar por texto do label
                        const allOptions = optionsContainer.querySelectorAll('.option-item');
                        const foundByText = Array.from(allOptions).find(optionItem => {
                            const nameElement = optionItem.querySelector('.option-name');
                            return nameElement && nameElement.textContent.includes(optionName);
                        });
                        
                        if (foundByText) {
                            const checkboxInItem = foundByText.querySelector('input[type="checkbox"]');
                            if (checkboxInItem) {
                                checkboxInItem.checked = true;
                                const checkboxEvent = new Event('change', { bubbles: true });
                                checkboxInItem.dispatchEvent(checkboxEvent);
                                optionsMarked++;
                                console.log(`✅ Opção marcada (por texto): ${optionName}`);
                            }
                        }
                    }
                });
                
                console.log(`📊 Opções marcadas: ${optionsMarked}/${machineData.opcoesSelecionadas.length}`);
            } else {
                console.log(`⚠️ Container de opções não encontrado`);
            }
        }

        // 5. DEFINIR PREÇOS (se disponíveis)
        if (machineData.precoBase !== undefined) {
            const basePriceElement = document.getElementById(`base-price-${machineId}`);
            if (basePriceElement) {
                basePriceElement.textContent = `R$ ${machineData.precoBase.toLocaleString('pt-BR')}`;
                console.log(`✅ Preço base definido: R$ ${machineData.precoBase}`);
            }
        }

        if (machineData.precoTotal !== undefined) {
            const totalPriceElement = document.getElementById(`total-price-${machineId}`);
            if (totalPriceElement) {
                totalPriceElement.textContent = `R$ ${machineData.precoTotal.toLocaleString('pt-BR')}`;
                console.log(`✅ Preço total definido: R$ ${machineData.precoTotal}`);
            }
        }

        // 6. DEFINIR NOME (se disponível)
        if (machineData.nome) {
            const nameInput = machineElement.querySelector('.machine-title-editable');
            if (nameInput) {
                nameInput.value = machineData.nome;
                console.log(`✅ Nome definido: ${machineData.nome}`);
            }
        }

        // 7. DISPARAR CÁLCULO FINAL
        setTimeout(() => {
            if (typeof calculateMachinePrice === 'function') {
                calculateMachinePrice(machineId);
                console.log('✅ Cálculo de preço finalizado');
            }
        }, 500);

        console.log(`✅ Dados da máquina preenchidos com sucesso`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher dados da máquina:`, error);
        return false;
    }
}


/**
 * 🌐 EXPORTAÇÕES E COMPATIBILIDADE GLOBAL
 */

// Exportações para módulos ES6
export {
    // Renderização
    renderObraFromData,
    renderProjectFromData,
    renderRoomFromData,
    
    // Preenchimento específico
    fillClimatizationInputs,
    fillThermalGainsData,
    fillCapacityData,
    fillConfigurationData,
    ensureAllRoomSections,
    ensureMachinesSection, 
    fillMachinesData,           
    
    // Preenchimento hierárquico
    populateObraData,
    populateProjectData,
    populateRoomData,
    populateMachineData,  
    

};

// Compatibilidade global para scripts legados
if (typeof window !== 'undefined') {
    window.renderObraFromData = renderObraFromData;
    window.renderProjectFromData = renderProjectFromData;
    window.renderRoomFromData = renderRoomFromData;
    window.populateObraData = populateObraData;
    window.populateProjectData = populateProjectData;
    window.populateRoomData = populateRoomData;
    window.ensureMachinesSection = ensureMachinesSection;
    window.ensureAllRoomSections = ensureAllRoomSections;
    window.buildMachinesSection = buildMachinesSection;
    window.addMachine = addMachine;
    window.populateMachineData = populateMachineData;
    window.fillMachinesData = fillMachinesData;
}