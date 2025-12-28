// data/modules/climatizacao/data-fill.js

/*
* ARQUIVO DE PREENCHER AS salas
*/

import { calculateVazaoArAndThermalGains } from '../../../features/calculations/air-flow.js';
import { triggerCalculation } from '../../../core/shared-utils.js';

// ✅ ADICIONAR: Funções de sincronização locais
function setupRoomTitleChangeListener(roomId) {
    console.log(`🎯 Configurando listener de título para sala: ${roomId}`);
    
    const roomTitle = document.querySelector(`[data-room-id="${roomId}"] .room-title`);
    const ambienteInput = document.querySelector(`input[data-field="ambiente"][data-room-id="${roomId}"]`);
    
    if (roomTitle && ambienteInput) {
        // Sincronização Ambiente → Título
        ambienteInput.addEventListener('input', function() {
            if (this.value && this.value.trim() !== '' && this.value !== roomTitle.textContent) {
                if (typeof window.syncAmbienteToTitle === 'function') {
                    window.syncAmbienteToTitle(roomId, this.value);
                } else {
                    // Fallback direto
                    roomTitle.textContent = this.value;
                    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
                    if (roomBlock) {
                        roomBlock.dataset.roomName = this.value;
                    }
                    console.log(`🔄 Ambiente → Título: "${this.value}"`);
                }
                triggerCalculation(roomId);
            }
        });
        
        console.log(`✅ Listener título↔ambiente configurado para ${roomId}`);
    }
}

// ✅ ADICIONAR: Tornar funções globais para compatibilidade
if (typeof window !== 'undefined') {
    window.setupRoomTitleChangeListener = setupRoomTitleChangeListener;
}

/**
 * Preenche os campos de climatização de uma sala com dados do JSON
 */
function fillClimatizationInputs(roomElement, inputsData) {
    if (!roomElement || !inputsData) {
        console.error('❌ Elemento da sala ou dados inválidos para preenchimento');
        return;
    }

    console.log(`🔄 Preenchendo inputs de climatização:`, inputsData);

    const roomId = roomElement.dataset.roomId;
    const roomName = roomElement.dataset.roomName;
    
    // ✅ CORREÇÃO: Preencher campo ambiente com nome da sala se estiver vazio
    const ambienteInput = roomElement.querySelector(`input[data-field="ambiente"]`);
    if (ambienteInput && (!inputsData.ambiente || inputsData.ambiente === '') && roomName) {
        inputsData.ambiente = roomName;
        console.log(`✅ Campo ambiente preenchido automaticamente com nome da sala: "${roomName}"`);
    }
    
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
            
            // ✅ CORREÇÃO MELHORADA: Configurar TODAS as sincronizações após preenchimento
            setTimeout(() => {
                console.log(`🎯 CONFIGURANDO TODAS AS SINCRONIZAÇÕES PARA: ${roomId}`);
                
                // 1. Sincronização Título ↔ Ambiente
                setupRoomTitleChangeListener(roomId);
                
                // 2. Sincronização das Paredes usando a lógica escolhida
                if (typeof window.setupCompleteRoomSync === 'function') {
                    window.setupCompleteRoomSync(roomId);
                }
                
                console.log(`✅ Todas as sincronizações configuradas para: ${roomId}`);
            }, 500);

            console.log(`✅ Processo de preenchimento iniciado para sala ${roomId}`);
            
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
 */
function fillThermalGainsData(roomElement, thermalGainsData) {
    if (!roomElement || !thermalGainsData) {
        console.error('❌ Elemento da sala ou dados de ganhos térmicos inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🔄 Preenchendo ganhos térmicos para sala ${roomId}:`, thermalGainsData);

    // ✅ CORREÇÃO: Atualizar os seletores para os novos IDs
    const gainSelectors = {
        'total-ganhos-w': `#total-ganhos-w-${roomId}`,
        'total-tr-aprox': `#total-tr-aprox-${roomId}`,
        'total-tr-exato': `#total-tr-exato-${roomId}`,
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
            // ✅ CORREÇÃO: Para valor TR exato, manter 3 casas decimais
            if (key === 'total-tr-exato' && typeof thermalGainsData[key] === 'number') {
                element.textContent = thermalGainsData[key].toFixed(3);
            } else {
                element.textContent = thermalGainsData[key];
            }
            console.log(`✅ ${key} preenchido: ${thermalGainsData[key]}`);
        }
    });

    console.log(`✅ Ganhos térmicos preenchidos para sala ${roomId}`);
}

/**
 * Preenche os dados de capacidade de refrigeração da sala
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
    const equipamentosSection = findSectionByTitle(roomElement, 'Equipamentos de Difusão e Controle de Ar');
    const dutosSection = findSectionByTitle(roomElement, 'Dutos para Climatização'); // ✅ ADICIONADO: Dutos
    const tubosSection = findSectionByTitle(roomElement, 'Tubos e Conexões');

    // Verificar quais seções já existem
    const existingSections = {
        climatization: !!climatizationSection,
        machines: !!machinesSection,
        equipamentos: !!equipamentosSection,
        dutos: !!dutosSection, // ✅ ADICIONADO: Dutos
        tubos: !!tubosSection
    };

    console.log(`📋 Seções existentes:`, existingSections);

    const allRequiredSections = existingSections.climatization && 
                               existingSections.machines && 
                               existingSections.equipamentos &&
                               existingSections.dutos && // ✅ ADICIONADO: Dutos (agora obrigatório)
                               existingSections.tubos; // Tubulação (opcional)

    if (allRequiredSections) {
        console.log(`✅ Todas as seções necessárias já existem para sala ${roomName}`);
        return true;
    }

    console.log(`🔄 Criando seções faltantes para sala ${roomName}`);

    try {
        const roomContent = roomElement.querySelector('.room-content');
        if (!roomContent) {
            console.error(`❌ Container de conteúdo da sala não encontrado`);
            return false;
        }

        // Se não temos nenhuma seção, criar todas
        if (!climatizationSection && !machinesSection && !equipamentosSection && !dutosSection) {
            console.log(`🏗️ Criando todas as seções para sala ${roomName}`);

            // ✅ CORREÇÃO: Verificar TODAS as funções necessárias
            const requiredFunctions = [
                'buildClimatizationSection',
                'buildMachinesSection', 
                'buildEquipamentosSection',
                'buildDutosSection', // ✅ ADICIONADO: Dutos
                'buildTubosSection'
            ];

            for (const funcName of requiredFunctions) {
                if (typeof window[funcName] !== 'function') {
                    console.warn(`⚠️ Função ${funcName} não disponível ainda`);
                }
            }

            // Criar seção de climatização
            if (typeof window.buildClimatizationSection === 'function') {
                const climatizationHTML = await window.buildClimatizationSection(obraId, projectId, roomName, roomId);
                if (climatizationHTML) {
                    roomContent.insertAdjacentHTML('beforeend', climatizationHTML);
                    console.log(`✅ Seção de climatização criada`);
                }
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Criar seção de máquinas
            if (typeof window.buildMachinesSection === 'function') {
                const machinesHTML = await window.buildMachinesSection(obraId, projectId, roomName, roomId);
                if (machinesHTML) {
                    roomContent.insertAdjacentHTML('beforeend', machinesHTML);
                    console.log(`✅ Seção de máquinas criada`);
                }
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Criar seção de equipamentos
            if (typeof window.buildEquipamentosSection === 'function') {
                const equipamentosHTML = await window.buildEquipamentosSection(obraId, projectId, roomName, roomId);
                if (equipamentosHTML) {
                    roomContent.insertAdjacentHTML('beforeend', equipamentosHTML);
                    console.log(`✅ Seção de equipamentos criada`);
                }
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // ✅ Criar seção de dutos
            if (typeof window.buildDutosSection === 'function') {
                const dutosHTML = await window.buildDutosSection(obraId, projectId, roomName, roomId);
                if (dutosHTML) {
                    roomContent.insertAdjacentHTML('beforeend', dutosHTML);
                    console.log(`✅ Seção de dutos criada`);
                }
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Criar seção de tubos
            if (typeof window.buildTubosSection === 'function') {
                const tubosHTML = await window.buildTubosSection(obraId, projectId, roomName, roomId);
                if (tubosHTML) {
                    roomContent.insertAdjacentHTML('beforeend', tubosHTML);
                    console.log(`✅ Seção de tubos criada`);
                }
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // ✅ CORREÇÃO: Inicializar sistemas após criação
            setTimeout(() => {
                if (typeof window.initEquipamentosSystem === 'function') {
                    window.initEquipamentosSystem(roomId);
                    console.log(`✅ Sistema de equipamentos inicializado`);
                }
                
                if (typeof window.initDutosSystem === 'function') { // ✅ ADICIONADO: Inicializar dutos
                    window.initDutosSystem(roomId);
                    console.log(`✅ Sistema de dutos inicializado`);
                }
                
                if (typeof window.initTubulacaoSystem === 'function') {
                    window.initTubulacaoSystem(roomId);
                    console.log(`✅ Sistema de tubulação inicializado`);
                }
            }, 800);

            console.log(`✅ Todas as seções criadas para sala ${roomName}`);
            return true;
        }

        // Se temos algumas seções, criar apenas as faltantes
        let lastSection = climatizationSection || machinesSection || equipamentosSection || dutosSection || tubosSection;
        
        // Criar seção de máquinas se faltar
        if (!machinesSection && typeof window.buildMachinesSection === 'function') {
            const machinesHTML = await window.buildMachinesSection(obraId, projectId, roomName, roomId);
            if (machinesHTML && lastSection) {
                lastSection.insertAdjacentHTML('afterend', machinesHTML);
                console.log(`✅ Seção de máquinas criada`);
                lastSection = document.querySelector(`#section-content-${roomId}machines`)?.parentElement;
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // Criar seção de equipamentos se faltar
        if (!equipamentosSection && typeof window.buildEquipamentosSection === 'function') {
            const equipamentosHTML = await window.buildEquipamentosSection(obraId, projectId, roomName, roomId);
            if (equipamentosHTML && lastSection) {
                lastSection.insertAdjacentHTML('afterend', equipamentosHTML);
                console.log(`✅ Seção de equipamentos criada`);
                lastSection = document.querySelector(`#section-content-${roomId}equipamentos`)?.parentElement;
                
                setTimeout(() => {
                    if (typeof window.initEquipamentosSystem === 'function') {
                        window.initEquipamentosSystem(roomId);
                    }
                }, 500);
                
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // ✅ Criar seção de dutos se faltar
        if (!dutosSection && typeof window.buildDutosSection === 'function') {
            const dutosHTML = await window.buildDutosSection(obraId, projectId, roomName, roomId);
            if (dutosHTML && lastSection) {
                lastSection.insertAdjacentHTML('afterend', dutosHTML);
                console.log(`✅ Seção de dutos criada`);
                lastSection = document.querySelector(`#section-content-${roomId}dutos`)?.parentElement;
                
                setTimeout(() => {
                    if (typeof window.initDutosSystem === 'function') {
                        window.initDutosSystem(roomId);
                    }
                }, 500);
                
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // Criar seção de tubos se faltar
        if (!tubosSection && typeof window.buildTubosSection === 'function') {
            const tubosHTML = await window.buildTubosSection(obraId, projectId, roomName, roomId);
            if (tubosHTML && lastSection) {
                lastSection.insertAdjacentHTML('afterend', tubosHTML);
                console.log(`✅ Seção de tubos criada`);
                lastSection = document.querySelector(`#section-content-${roomId}tubos`)?.parentElement;
                
                setTimeout(() => {
                    if (typeof window.initTubulacaoSystem === 'function') {
                        window.initTubulacaoSystem(roomId);
                    }
                }, 500);
                
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // ✅ CORREÇÃO: Configurar sincronizações
        setTimeout(() => {
            console.log(`🔧 CONFIGURANDO SINCRONIZAÇÕES APÓS CRIAR SEÇÕES: ${roomId}`);
            
            if (typeof window.setupCompleteRoomSync === 'function') {
                window.setupCompleteRoomSync(roomId);
            }
            
            console.log(`✅ Sincronizações configuradas após criação de seções: ${roomId}`);
        }, 1000);

        // Verificar se temos pelo menos as seções principais
        const hasRequiredSections = !!findSectionByTitle(roomElement, 'Climatização') &&
                                   !!findMachinesSection(roomElement) &&
                                   !!findSectionByTitle(roomElement, 'Equipamentos de Difusão e Controle de Ar') &&
                                   !!findSectionByTitle(roomElement, 'Dutos para Climatização'); // ✅ ADICIONADO: Dutos

        if (hasRequiredSections) {
            console.log(`✅ Seções necessárias criadas para sala ${roomName}`);
            return true;
        }

        console.log(`❌ Não foi possível criar todas as seções para sala ${roomName}`);
        return false;

    } catch (error) {
        console.error(`❌ Erro ao criar seções da sala ${roomName}:`, error);
        return false;
    }
}

// ✅ CORREÇÃO: Adicionar funções auxiliares faltantes
function findSectionByTitle(roomElement, title) {
    const sections = roomElement.querySelectorAll('.section-block');
    for (let section of sections) {
        const sectionTitle = section.querySelector('.section-title');
        if (sectionTitle && sectionTitle.textContent.includes(title)) {
            return section;
        }
    }
    return null;
}

function findMachinesSection(roomElement) {
    return roomElement.querySelector('.machines-section') || 
           roomElement.querySelector('[id*="machines"]') ||
           roomElement.querySelector('[class*="machine"]');
}

// EXPORTS NO FINAL
export {
    fillClimatizationInputs,
    fillThermalGainsData,
    fillCapacityData,
    ensureAllRoomSections,
    setupRoomTitleChangeListener
};