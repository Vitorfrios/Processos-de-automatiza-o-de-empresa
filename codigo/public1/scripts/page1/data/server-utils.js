// server-utils.js

// REMOVIDO NA REFACTOR: import { createEmptyProject } from '../ui/interface.js'
import { createEmptyRoom } from './rooms.js'
import { updateProjectButton } from './server.js'
import { calculateVazaoArAndThermalGains } from '../features/calculos/calculos-manager.js'
import { ensureStringId } from '../utils/utils.js'
import { getGeralCount, incrementGeralCount } from './server.js'
import { generateObraId } from './data-files/data-utils-core.js'

/**
 * Renderiza uma obra completa a partir dos dados carregados do servidor
 * Inclui projetos, salas e todas as configurações associadas
 * @param {Object} obraData - Dados completos da obra
 * @returns {void}
 */
function renderObraFromData(obraData) {
  const obraName = obraData.nome
  const obraId = ensureStringId(obraData.id)

  console.log(`🎯 Renderizando obra: ${obraName} (ID: ${obraId})`)

  // ✅ CORREÇÃO: Usar ID seguro na criação
  createEmptyObra(obraName, obraId)

  // Renderizar projetos da obra
  if (obraData.projetos && obraData.projetos.length > 0) {
    // ✅ CORREÇÃO: Buscar por ID único em vez de nome
    const obraContent = document.getElementById(`obra-content-${obraId}`)

    if (obraContent) {
      const emptyMessage = obraContent.querySelector(".empty-message")
      if (emptyMessage) {
        emptyMessage.remove()
      }

      setTimeout(() => {
        obraData.projetos.forEach((projectData) => {
          renderProjectFromData(projectData, obraId, obraName)
        })
      }, 100);
    }
  }

  console.log(`✅ Obra ${obraName} renderizada com sucesso (ID: ${obraId})`)
}

/**
 * Renderiza um projeto completo a partir dos dados carregados
 * Cria o projeto e todas as suas salas com configurações
 * @param {Object} projectData - Dados completos do projeto
 * @param {string} obraId - ID único da obra pai
 * @param {string} obraName - Nome da obra pai
 * @returns {void}
 */
function renderProjectFromData(projectData, obraId = null, obraName = null) {
  const projectName = projectData.nome
  const projectId = ensureStringId(projectData.id)

  console.log(`🎯 Renderizando projeto: ${projectName} (ID: ${projectId})`)

  // ✅ CORREÇÃO: Se não foi passada a obra, tentar encontrar pela estrutura do DOM usando ID
  if (!obraId) {
    // Buscar obra que contém este projeto
    const existingProject = document.querySelector(`[data-project-id="${projectId}"]`)
    obraId = existingProject?.dataset.obraId
    obraName = existingProject?.dataset.obraName
  }

  // Se ainda não tem obra, criar projeto na primeira obra ou criar uma nova
  if (!obraId) {
    const obras = document.querySelectorAll('.obra-block')
    if (obras.length > 0) {
      const primeiraObra = obras[0]
      obraId = primeiraObra.dataset.obraId
      obraName = primeiraObra.dataset.obraName
    } else {
      // ✅ CORREÇÃO: Criar obra com ID seguro
      obraName = 'Obra1'
      obraId = generateObraId() // Usar a função do sistema
      createEmptyObra(obraName, obraId)
    }
  }

  // ✅ CORREÇÃO: Passar IDs únicos corretamente
  createEmptyProject(obraId, obraName, projectId, projectName)

  if (projectData.salas && projectData.salas.length > 0) {
    // ✅ CORREÇÃO: Buscar por ID único do projeto
    const projectContent = document.getElementById(`project-content-${projectId}`)

    if (projectContent) {
      const emptyMessage = projectContent.querySelector(".empty-message")
      if (emptyMessage) {
        emptyMessage.remove()
      }

      setTimeout(() => {
        projectData.salas.forEach((roomData) => {
          renderRoomFromData(projectId, projectName, roomData, obraId, obraName)
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
 * Preenche todos os inputs, configurações e máquinas da sala
 * @param {string} projectId - ID único do projeto pai
 * @param {string} projectName - Nome do projeto pai
 * @param {Object} roomData - Dados completos da sala
 * @param {string} obraId - ID único da obra pai
 * @param {string} obraName - Nome da obra pai
 * @returns {void}
 */
function renderRoomFromData(projectId, projectName, roomData, obraId = null, obraName = null) {
  const roomName = roomData.nome
  const roomId = ensureStringId(roomData.id)

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
    // ✅ CORREÇÃO: Passar todos os IDs únicos
    createEmptyRoom(obraId, projectId, roomName, roomId)

    // Delay adicional para garantir que a sala foi criada antes de preencher inputs
    setTimeout(() => {
      populateRoomInputs(projectId, projectName, roomId, roomName, roomData, obraId, obraName)
    }, 100);
    
  }, 100);
}

/**
 * Preenche todos os inputs e configurações de uma sala com dados carregados
 * Processa inputs básicos, configurações, ganhos térmicos, capacidade e máquinas
 * @param {string} projectId - ID único do projeto
 * @param {string} projectName - Nome do projeto
 * @param {string} roomId - ID único da sala
 * @param {string} roomName - Nome da sala
 * @param {Object} roomData - Dados completos da sala
 * @param {string} obraId - ID único da obra
 * @param {string} obraName - Nome da obra
 * @returns {void}
 */
function populateRoomInputs(projectId, projectName, roomId, roomName, roomData, obraId = null, obraName = null) {
  let attempts = 0;
  const maxAttempts = 10;
  
  /**
   * Tenta preencher os dados da sala com retry em caso de elementos não carregados
   * @returns {void}
   */
  const tryPopulate = () => {
    // ✅ CORREÇÃO: Buscar sala usando ID único
    let roomBlock;
    if (obraId && projectId) {
      roomBlock = document.querySelector(`[data-obra-id="${obraId}"][data-project-id="${projectId}"][data-room-id="${roomId}"]`);
    } else if (roomId) {
      roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
    } else {
      // Fallback para busca por nome (compatibilidade)
      if (obraName) {
        roomBlock = document.querySelector(`[data-obra-name="${obraName}"] [data-room-name="${roomName}"]`);
      } else {
        roomBlock = document.querySelector(`[data-room-name="${roomName}"]`);
      }
    }
    
    if (!roomBlock && attempts < maxAttempts) {
      attempts++;
      console.log(`⏳ Tentativa ${attempts} - Sala ${roomName} (ID: ${roomId}) não encontrada, tentando novamente...`);
      setTimeout(tryPopulate, 100);
      return;
    }
    
    if (!roomBlock) {
      console.error(`❌ Sala ${roomName} (ID: ${roomId}) não encontrada após ${maxAttempts} tentativas`);
      return;
    }

    console.log(`✅ Sala ${roomName} encontrada (ID: ${roomId}), preenchendo dados...`);

    // 1. PREENCHER INPUTS BÁSICOS
    if (roomData.inputs && Object.keys(roomData.inputs).length > 0) {
      console.log(`📝 Preenchendo ${Object.keys(roomData.inputs).length} inputs`);
      populateBasicInputs(roomBlock, roomData.inputs, roomId);
    }

    // 2. PREENCHER CONFIGURAÇÕES
    if (roomData.configuracao && Object.keys(roomData.configuracao).length > 0) {
      console.log(`⚙️ Preenchendo ${Object.keys(roomData.configuracao).length} configurações`);
      populateConfiguration(roomBlock, roomData.configuracao, roomId);
    }

    // 3. PREENCHER GANHOS TÉRMICOS
    if (roomData.ganhosTermicos && Object.keys(roomData.ganhosTermicos).length > 0) {
      console.log(`🔥 Preenchendo ${Object.keys(roomData.ganhosTermicos).length} ganhos térmicos`);
      populateThermalGains(roomBlock, roomData.ganhosTermicos, roomId);
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

    console.log(`✅ Todos os dados da sala ${roomName} (ID: ${roomId}) preenchidos com sucesso`);
  };
  
  tryPopulate();
}

/**
 * Preenche inputs básicos da sala como temperatura, pressurização, etc.
 * @param {HTMLElement} roomBlock - Elemento HTML da sala
 * @param {Object} inputsData - Dados dos inputs básicos
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function populateBasicInputs(roomBlock, inputsData, roomId) {
  Object.entries(inputsData).forEach(([field, value]) => {
    if (value === null || value === undefined || value === '') return;

    // CORREÇÃO: Tratamento especial para pressurização
    if (field === 'pressurizacao') {
      const pressurizacaoValue = Boolean(value);
      const radioName = `pressurizacao-${roomId}`;
      
      // Encontrar o radio correto (sim/nao)
      const radioToCheck = roomBlock.querySelector(`input[type="radio"][name="${radioName}"][value="${pressurizacaoValue ? 'sim' : 'nao'}"]`);
      if (radioToCheck) {
        radioToCheck.checked = true;
        console.log(`✅ Pressurização definida como: ${pressurizacaoValue ? 'sim' : 'nao'}`);
        
        // Disparar evento para atualizar campos relacionados
        radioToCheck.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return; 
    }

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

    // ✅ CORREÇÃO: Se não encontrou pelo nome limpo, tentar com sufixo do roomId
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
 * Preenche configurações da sala como opções de instalação
 * @param {HTMLElement} roomBlock - Elemento HTML da sala
 * @param {Object} configData - Dados de configuração
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function populateConfiguration(roomBlock, configData, roomId) {

    // Preencher opções de instalação (array de checkboxes)
    if (configData.opcoesInstalacao && Array.isArray(configData.opcoesInstalacao)) {
        console.log(`⚙️ Preenchendo ${configData.opcoesInstalacao.length} opções de instalação`);
        
        configData.opcoesInstalacao.forEach(opcaoValue => {
            // ✅ CORREÇÃO: Buscar por name que inclui roomId
            const checkbox = roomBlock.querySelector(`input[name^="opcoesInstalacao-${roomId}"][value="${opcaoValue}"]`) ||
                            roomBlock.querySelector(`input[name^="opcoesInstalacao-"][value="${opcaoValue}"]`);
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
        if (field === 'opcoesInstalacao') return; 
        
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
 * Preenche dados de ganhos térmicos calculados da sala
 * @param {HTMLElement} roomBlock - Elemento HTML da sala
 * @param {Object} gainsData - Dados de ganhos térmicos
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function populateThermalGains(roomBlock, gainsData, roomId) {
  Object.entries(gainsData).forEach(([field, value]) => {
    if (value === null || value === undefined || value === '') return;

    // ✅ CORREÇÃO: Buscar por elementos com sufixo do roomId
    const selectors = [
      `[id="${field}-${roomId}"]`,
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
 * Preenche dados de capacidade de climatização da sala
 * @param {HTMLElement} roomBlock - Elemento HTML da sala
 * @param {Object} capacityData - Dados de capacidade
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function populateCapacityData(roomBlock, capacityData, roomId) {

  // ✅ CORREÇÃO: Obter projectId do roomBlock
  const projectBlock = roomBlock.closest('.project-block');
  const projectId = projectBlock ? projectBlock.getAttribute('data-project-id') : '';
  const projectName = projectBlock ? projectBlock.getAttribute('data-project-name') : '';
  
  Object.entries(capacityData).forEach(([field, value]) => {
    if (value === null || value === undefined || value === '') return;

    // ✅ CORREÇÃO: Buscar elementos de capacidade com roomId
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

  // ✅ CORREÇÃO: Usar roomId para carregar capacidade
  setTimeout(() => {
    if (typeof window.loadCapacityData !== 'undefined') {
      window.loadCapacityData(projectName, roomId);
    } else if (typeof window.calculateCapacitySolution !== 'undefined') {
      window.calculateCapacitySolution(roomId);
    }
  }, 800);
}

/**
 * Preenche máquinas de climatização da sala
 * @param {HTMLElement} roomBlock - Elemento HTML da sala
 * @param {Array} machinesData - Array de dados das máquinas
 * @param {string} roomId - ID único da sala
 * @returns {void}
 */
function populateMachines(roomBlock, machinesData, roomId) {
  console.log(`🤖 Iniciando carregamento de ${machinesData.length} máquinas para ${roomId}`);
  
  // ✅ CORREÇÃO: Usar loadSavedMachines com roomId
  if (typeof window.loadSavedMachines !== 'undefined') {
    console.log(`🔄 Chamando loadSavedMachines para ${roomId}`);
    window.loadSavedMachines(roomId, machinesData);
  } else {
    console.error('❌ loadSavedMachines não disponível');
  }
}


export {
  renderObraFromData, 
  renderProjectFromData,
  renderRoomFromData,
  populateRoomInputs,
}