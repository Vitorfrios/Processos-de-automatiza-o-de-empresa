import { createEmptyProject } from '../ui/interface.js'
import { createEmptyRoom } from './rooms.js'
import { updateProjectButton } from './server.js'
import { calculateVazaoArAndThermalGains } from '../calculos/calculos.js'
import { ensureStringId } from '../utils/utils.js'
import { getGeralCount, incrementGeralCount } from './server.js'

/**
 * Renderiza um projeto completo a partir dos dados carregados
 * Cria a estrutura do projeto e todas as suas salas
 * @param {Object} projectData - Dados completos do projeto
 */
function renderProjectFromData(projectData) {
  const projectName = projectData.nome
  const projectId = ensureStringId(projectData.id)

  console.log(`🎯 Renderizando projeto: ${projectName} (ID: ${projectId})`)

  createEmptyProject(projectName, projectId)

  if (projectData.salas && projectData.salas.length > 0) {
    const projectContent = document.getElementById(`project-content-${projectName}`)

    if (projectContent) {
      const emptyMessage = projectContent.querySelector(".empty-message")
      if (emptyMessage) {
        emptyMessage.remove()
      }

      setTimeout(() => {
        projectData.salas.forEach((roomData) => {
          renderRoomFromData(projectName, roomData)
        })
      }, 100);
    }
  }

  if (projectId) {
    updateProjectButton(projectName, true)
  }

  // Atualizar o contador quando renderizar projeto existente
  if (projectId && projectId !== "" && projectId !== "null") {
    const currentCount = getGeralCount();
    if (currentCount === 0) {
      incrementGeralCount();
      console.log(`🔢 Projeto renderizado - GeralCount incrementado para: ${getGeralCount()}`)
    }
  }

  const projectNumber = Number.parseInt(projectName.replace("Projeto", "")) || 0
  if (projectNumber > window.projectCounter) {
    window.projectCounter = projectNumber
  }

  console.log(`✅ Projeto ${projectName} renderizado com sucesso - GeralCount: ${getGeralCount()}`)
}

/**
 * Renderiza uma sala individual a partir dos dados carregados
 * Cria a sala e preenche todos os inputs e configurações
 * @param {string} projectName - Nome do projeto
 * @param {Object} roomData - Dados completos da sala
 */
function renderRoomFromData(projectName, roomData) {
  const roomName = roomData.nome
  const roomId = ensureStringId(roomData.id)

  console.log(`🎯 Renderizando sala: ${roomName} no projeto ${projectName}`, {
    inputs: Object.keys(roomData.inputs || {}).length,
    maquinas: roomData.maquinas?.length || 0,
    capacidade: Object.keys(roomData.capacidade || {}).length,
    ganhosTermicos: Object.keys(roomData.ganhosTermicos || {}).length,
    configuracao: Object.keys(roomData.configuracao || {}).length
  });

  setTimeout(() => {
    createEmptyRoom(projectName, roomName, roomId)

    // Delay adicional para garantir que a sala foi criada antes de preencher inputs
    setTimeout(() => {
      populateRoomInputs(projectName, roomName, roomData)
    }, 100);
    
  }, 100);
}

/**
 * Preenche todos os inputs e configurações de uma sala com dados carregados
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {Object} roomData - Dados completos da sala
 */
function populateRoomInputs(projectName, roomName, roomData) {
  let attempts = 0;
  const maxAttempts = 10;
  
  const tryPopulate = () => {
    const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`);
    const roomId = `${projectName}-${roomName}`;
    
    if (!roomBlock && attempts < maxAttempts) {
      attempts++;
      console.log(`⏳ Tentativa ${attempts} - Sala ${roomName} não encontrada, tentando novamente...`);
      setTimeout(tryPopulate, 100);
      return;
    }
    
    if (!roomBlock) {
      console.error(`❌ Sala ${roomName} não encontrada após ${maxAttempts} tentativas`);
      return;
    }

    console.log(`✅ Sala ${roomName} encontrada, preenchendo dados...`);

    // 1. PREENCHER INPUTS BÁSICOS
    if (roomData.inputs && Object.keys(roomData.inputs).length > 0) {
      console.log(`📝 Preenchendo ${Object.keys(roomData.inputs).length} inputs`);
      populateBasicInputs(roomBlock, roomData.inputs, roomId);
    }

    // 2. PREENCHER CONFIGURAÇÕES
    if (roomData.configuracao && Object.keys(roomData.configuracao).length > 0) {
      console.log(`⚙️ Preenchendo ${Object.keys(roomData.configuracao).length} configurações`);
      populateConfiguration(roomBlock, roomData.configuracao);
    }

    // 3. PREENCHER GANHOS TÉRMICOS
    if (roomData.ganhosTermicos && Object.keys(roomData.ganhosTermicos).length > 0) {
      console.log(`🔥 Preenchendo ${Object.keys(roomData.ganhosTermicos).length} ganhos térmicos`);
      populateThermalGains(roomBlock, roomData.ganhosTermicos);
    }

    // 4. PREENCHER CAPACIDADE
    if (roomData.capacidade && Object.keys(roomData.capacidade).length > 0) {
      console.log(`❄️ Preenchendo ${Object.keys(roomData.capacidade).length} dados de capacidade`);
      populateCapacityData(roomBlock, roomData.capacidade, roomId);
    }

    // 5. PREENCHER MÁQUINAS
    if (roomData.maquinas && roomData.maquinas.length > 0) {
      console.log(`🤖 Preenchendo ${roomData.maquinas.length} máquinas`);
      populateMachines(roomBlock, roomData.maquinas, roomId);
    }

    // 6. RECALCULAR TUDO APÓS PREENCHIMENTO
    setTimeout(() => {
      console.log(`🔄 Recalculando vazão e ganhos térmicos para ${roomId}`);
      calculateVazaoArAndThermalGains(roomId);
      
      // Recalcular capacidade se a função existir
      setTimeout(() => {
        if (typeof window.calculateCapacitySolution !== 'undefined') {
          console.log(`🔄 Recalculando capacidade para ${roomId}`);
          window.calculateCapacitySolution(roomId);
        }
      }, 300);
    }, 500);

    console.log(`✅ Todos os dados da sala ${roomName} preenchidos com sucesso`);
  };
  
  tryPopulate();
}

/**
 * Preenche inputs básicos da sala
 */
function populateBasicInputs(roomBlock, inputsData, roomId) {
  Object.entries(inputsData).forEach(([field, value]) => {
    if (value === null || value === undefined || value === '') return;

    // Buscar por múltiplos seletores possíveis para inputs de climatização
    const selectors = [
      `[data-field="${field}"]`,
      `.clima-input[data-field="${field}"]`,
      `[name="${field}"]`,
      `[id="${field}"]`,
      `input[data-field="${field}"]`,
      `select[data-field="${field}"]`
    ];

    let element = null;
    for (const selector of selectors) {
      element = roomBlock.querySelector(selector);
      if (element) break;
    }

    // Se não encontrou pelo nome limpo, tentar com sufixo da sala
    if (!element) {
      const selectorsWithSuffix = [
        `[data-field="${field}-${roomId}"]`,
        `[name="${field}-${roomId}"]`,
        `[id="${field}-${roomId}"]`
      ];
      
      for (const selector of selectorsWithSuffix) {
        element = roomBlock.querySelector(selector);
        if (element) break;
      }
    }

    if (element) {
      try {
        if (element.type === 'checkbox') {
          element.checked = Boolean(value);
        } else if (element.type === 'radio') {
          const radioToCheck = roomBlock.querySelector(`input[type="radio"][name="${element.name}"][value="${value}"]`);
          if (radioToCheck) {
            radioToCheck.checked = true;
          }
        } else if (element.tagName === 'SELECT') {
          // Para selects, procurar option com valor correspondente
          const optionToSelect = element.querySelector(`option[value="${value}"]`);
          if (optionToSelect) {
            element.value = value;
          } else {
            // Tentar definir diretamente
            element.value = value;
          }
        } else {
          element.value = value;
        }
        
        console.log(`✅ Campo ${field} preenchido com:`, value);
      } catch (error) {
        console.warn(`⚠️ Erro ao preencher campo ${field}:`, error);
      }
    } else {
      console.warn(`⚠️ Campo ${field} não encontrado na interface`);
    }
  });
}

/**
 * Preenche configurações da sala (CORRIGIDO para opções de instalação)
 */
function populateConfiguration(roomBlock, configData, roomId) {
    // Preencher opções de instalação (array de checkboxes)
    if (configData.opcoesInstalacao && Array.isArray(configData.opcoesInstalacao)) {
        console.log(`⚙️ Preenchendo ${configData.opcoesInstalacao.length} opções de instalação`);
        
        configData.opcoesInstalacao.forEach(opcaoValue => {
            const checkbox = roomBlock.querySelector(`input[name^="opcoesInstalacao-"][value="${opcaoValue}"]`);
            if (checkbox) {
                checkbox.checked = true;
                console.log(`✅ Opção de instalação marcada: ${opcaoValue}`);
            } else {
                console.warn(`⚠️ Opção de instalação não encontrada: ${opcaoValue}`);
            }
        });
    }
    
    // Preencher outras configurações
    Object.entries(configData).forEach(([field, value]) => {
        if (field === 'opcoesInstalacao') return; // Já processado acima
        
        if (value === null || value === undefined || value === '') return;

        const element = roomBlock.querySelector(`[name="${field}"], [id="${field}"], [data-field="${field}"]`);
        if (element) {
            try {
                if (element.type === 'checkbox') {
                    element.checked = Boolean(value);
                } else if (element.type === 'radio') {
                    const radioToCheck = roomBlock.querySelector(`input[type="radio"][name="${element.name}"][value="${value}"]`);
                    if (radioToCheck) {
                        radioToCheck.checked = true;
                    }
                } else if (element.tagName === 'SELECT') {
                    element.value = value;
                } else {
                    element.value = value;
                }
                
                console.log(`✅ Configuração ${field} preenchida com:`, value);
            } catch (error) {
                console.warn(`⚠️ Erro ao preencher configuração ${field}:`, error);
            }
        }
    });
}

/**
 * Preenche ganhos térmicos
 */
function populateThermalGains(roomBlock, gainsData) {
  Object.entries(gainsData).forEach(([field, value]) => {
    if (value === null || value === undefined || value === '') return;

    // Buscar por elementos de resultado térmico
    const selectors = [
      `[id="${field}"]`,
      `.thermal-result[id="${field}"]`,
      `.result-value[id="${field}"]`,
      `.calculated-value[id="${field}"]`,
      `[class*="thermal"][id="${field}"]`
    ];

    let element = null;
    for (const selector of selectors) {
      element = roomBlock.querySelector(selector);
      if (element) break;
    }

    if (element) {
      try {
        // Se for elemento de input, preencher value, senão textContent
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
          element.value = value;
        } else {
          element.textContent = typeof value === 'number' ? value.toFixed(2) : value;
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao preencher ganho térmico ${field}:`, error);
      }
    }
  });
}

/**
 * Preenche dados de capacidade
 */
function populateCapacityData(roomBlock, capacityData, roomId) {
  // ✅ CORREÇÃO: Obter projectName do roomBlock
  const projectBlock = roomBlock.closest('.project-block');
  const projectName = projectBlock ? projectBlock.getAttribute('data-project-name') : '';
  
  Object.entries(capacityData).forEach(([field, value]) => {
    if (value === null || value === undefined || value === '') return;

    // Buscar elementos de capacidade
    const selectors = [
      `[id="${field}-${roomId}"]`,
      `[id="${field}"]`,
      `[name="${field}"]`,
      `[data-field="${field}"]`
    ];

    let element = null;
    for (const selector of selectors) {
      element = roomBlock.querySelector(selector);
      if (element) break;
    }

    if (element) {
      try {
        if (element.type === 'checkbox') {
          element.checked = Boolean(value);
        } else if (element.tagName === 'SELECT') {
          const optionToSelect = element.querySelector(`option[value="${value}"]`);
          if (optionToSelect) {
            element.value = value;
          }
        } else if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
          element.value = value;
        } else {
          // Elementos de exibição (span, div, etc)
          element.textContent = typeof value === 'number' ? value.toFixed(2) : value;
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao preencher capacidade ${field}:`, error);
      }
    }
  });

  // ✅ CORREÇÃO: Usar roomId em vez de projectName e roomName separados
  setTimeout(() => {
    if (typeof window.loadCapacityData !== 'undefined') {
      // Extrair roomName do roomId se necessário
      const roomName = roomId.split('-').slice(1).join('-');
      window.loadCapacityData(projectName, roomName);
    } else if (typeof window.calculateCapacitySolution !== 'undefined') {
      window.calculateCapacitySolution(roomId);
    }
  }, 800);
}

/**
 * Preenche máquinas de climatização
 */
function populateMachines(roomBlock, machinesData, roomId) {
  // Limpar máquinas existentes se houver
  const machinesContainer = document.getElementById(`machines-${roomId}`);
  if (machinesContainer) {
    const existingMachines = machinesContainer.querySelectorAll('.climatization-machine');
    existingMachines.forEach(machine => machine.remove());
    
    // Remover mensagem de vazio
    const emptyMessage = machinesContainer.querySelector('.empty-message');
    if (emptyMessage) {
      emptyMessage.remove();
    }
  }

  // Adicionar máquinas salvas
  machinesData.forEach((machineData, index) => {
    setTimeout(() => {
      if (typeof window.addMachine !== 'undefined') {
        window.addMachine(roomId);
        
        // Preencher dados da máquina após ser criada
        setTimeout(() => {
          const machineElements = roomBlock.querySelectorAll('.climatization-machine');
          const lastMachine = machineElements[machineElements.length - 1];
          
          if (lastMachine) {
            // Preencher dados básicos da máquina
            const typeSelect = lastMachine.querySelector('.machine-type-select');
            const powerSelect = lastMachine.querySelector('.machine-power-select');
            const voltageSelect = lastMachine.querySelector('.machine-voltage-select');
            const titleInput = lastMachine.querySelector('.machine-title-editable');
            
            if (typeSelect && machineData.tipo) typeSelect.value = machineData.tipo;
            if (powerSelect && machineData.potencia) powerSelect.value = machineData.potencia;
            if (voltageSelect && machineData.tensao) voltageSelect.value = machineData.tensao;
            if (titleInput && machineData.nome) titleInput.value = machineData.nome;
            
            // Disparar evento de change para carregar opções
            if (typeSelect) {
              typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Preencher opções selecionadas após um delay
            setTimeout(() => {
              if (machineData.opcoesSelecionadas && machineData.opcoesSelecionadas.length > 0) {
                machineData.opcoesSelecionadas.forEach(opcao => {
                  const optionCheckbox = lastMachine.querySelector(`input[data-option-id="${opcao.id}"]`);
                  if (optionCheckbox) {
                    optionCheckbox.checked = true;
                  }
                });
                
                // Recalcular preço
                if (typeof window.calculateMachinePrice !== 'undefined') {
                  const machineIndex = lastMachine.getAttribute('data-machine-index');
                  window.calculateMachinePrice(machineIndex);
                }
              }
            }, 200);
          }
        }, 100);
      }
    }, index * 300); // Delay entre máquinas para evitar conflitos
  });
}

export {
  renderProjectFromData,
  renderRoomFromData,
  populateRoomInputs,
}