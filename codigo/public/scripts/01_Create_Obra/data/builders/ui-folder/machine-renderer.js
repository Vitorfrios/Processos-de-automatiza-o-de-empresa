import { buildMachinesSection, addMachine } from '../../modules/machines/machines-core.js';

/**
 * Encontra seção de máquinas pelo título
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

/**
 * ✅ FUNÇÃO AUXILIAR: Encontrar seção por título
 */
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
 * Garante que a seção de máquinas existe e está inicializada - VERSÃO CORRIGIDA
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
 * Preenche os dados individuais de uma máquina
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

// EXPORTS NO FINAL
export {
    findMachinesSection,
    findSectionByTitle,
    ensureMachinesSection,
    fillMachinesData,
    populateMachineData
};