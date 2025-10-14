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

  console.log(` Renderizando projeto: ${projectName} (ID: ${projectId})`)

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
      console.log(` Projeto renderizado - GeralCount incrementado para: ${getGeralCount()}`)
    }
  }

  const projectNumber = Number.parseInt(projectName.replace("Projeto", "")) || 0
  if (projectNumber > window.projectCounter) {
    window.projectCounter = projectNumber
  }

  console.log(` Projeto ${projectName} renderizado com sucesso - GeralCount: ${getGeralCount()}`)
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

  console.log(` Renderizando sala: ${roomName} no projeto ${projectName}`)


  setTimeout(() => {
    createEmptyRoom(projectName, roomName, roomId)

    // Delay adicional para garantir que a sala foi criada antes de preencher inputs
    setTimeout(() => {
      if (roomData.inputs || roomData.configuracoes || roomData.maquinas || roomData.maquinasClimatizacao) {


        const maquinasUnificadas = {
          maquinas: roomData.maquinas,
          maquinasClimatizacao: roomData.maquinasClimatizacao
        };
        
        populateRoomInputs(
          projectName, 
          roomName, 
          roomData.inputs || {}, 
          roomData.ganhosTermicos, 
          maquinasUnificadas, 
          roomData.configuracoes,
          roomData 
        )
      }
    }, 50);
    
  }, 50);


  setTimeout(() => {
    calculateVazaoArAndThermalGains(roomId);
    

    setTimeout(() => {
      if (typeof window.calculateCapacitySolution !== 'undefined') {
        console.log(`[SERVER-UTILS] Acionando cálculo de capacidade para ${roomId}`);
        window.calculateCapacitySolution(roomId);
      }
    }, 200);
  }, 150);
}

/**
 * Preenche todos os inputs e configurações de uma sala com dados carregados
 * Inclui inputs de climatização, opções, máquinas e dados de capacidade
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @param {Object} inputsData - Dados dos inputs da sala
 * @param {Object} ganhosTermicos - Dados de ganhos térmicos
 * @param {Object} maquinasData - Dados das máquinas (legado e novo sistema)
 * @param {Object} configuracoesData - Configurações e opções da sala
 * @param {Object} roomData - Dados completos da sala (inclui capacidade)
 */
function populateRoomInputs(projectName, roomName, inputsData, ganhosTermicos, maquinasData, configuracoesData, roomData = null) {
  // Tentar encontrar a sala múltiplas vezes com timeout
  let attempts = 0;
  const maxAttempts = 10;
  
  const tryPopulate = () => {
    const roomBlock = document.querySelector(`[data-room-name="${roomName}"]`)
    
    if (!roomBlock && attempts < maxAttempts) {
      attempts++;
      console.log(` Tentativa ${attempts} - Sala ${roomName} não encontrada, tentando novamente...`)
      setTimeout(tryPopulate, 100);
      return;
    }
    
    if (!roomBlock) {
      console.error(` Sala ${roomName} não encontrada após ${maxAttempts} tentativas`)
      return;
    }

    const roomId = `${projectName}-${roomName}`

    // Preencher inputs de climatização
    Object.entries(inputsData).forEach(([field, value]) => {
      if (field === "vazaoArExterno") {
        const vazaoElement = document.getElementById(`vazao-ar-${roomId}`)
        if (vazaoElement) {
          vazaoElement.textContent = value
        }
        return
      }

      // Preencher inputs de configuração geral (se houver)
      const configInput = roomBlock.querySelector(`.section-content [data-field="${field}"]`)
      if (configInput) {
        if (configInput.type === 'radio' || configInput.type === 'checkbox') {
          configInput.checked = (configInput.value === value)
        } else {
          configInput.value = value || ""
        }
        return
      }

      // Preencher inputs de climatização
      const input = roomBlock.querySelector(`.clima-input[data-field="${field}"]`)
      if (input) {

        if (value === 0 || value === "0") {
          input.value = ""; 
        } else {
          input.value = value
        }
      }
    })

    // Preencher opções de instalação (checkboxes) do objeto configuracoes
    if (configuracoesData && configuracoesData.opcoesInstalacao) {
      console.log(` Preenchendo opções de instalação:`, configuracoesData.opcoesInstalacao)
      
      configuracoesData.opcoesInstalacao.forEach(opcao => {
        const checkboxInput = roomBlock.querySelector(`input[name^="opcoesInstalacao-"][value="${opcao}"]`)
        if (checkboxInput) {
          checkboxInput.checked = true
          console.log(` Checkbox ${opcao} marcado`)
        } else {
          console.warn(` Checkbox não encontrado para opção: ${opcao}`)
        }
      })
    }

    // ========== CARREGAR DADOS DE CAPACIDADE DE REFRIGERAÇÃO ==========

    if (roomData && roomData['Cálculo_Capacidade_Refrigeração']) {
      console.log(`[SERVER-UTILS] Carregando dados de capacidade de refrigeração para ${roomName}`);
      

      setTimeout(() => {
        if (typeof window.loadCapacityData !== 'undefined') {
          window.loadCapacityData(projectName, roomName);
        } else {
          console.warn('[SERVER-UTILS] Função loadCapacityData não disponível ainda');

          setTimeout(() => {
            if (typeof window.loadCapacityData !== 'undefined') {
              window.loadCapacityData(projectName, roomName);
            }
          }, 1000);
        }
      }, 600);
    }

    // ========== CARREGAR MÁQUINAS DE CLIMATIZAÇÃO ==========
    if (maquinasData && maquinasData.maquinasClimatizacao && Array.isArray(maquinasData.maquinasClimatizacao)) {
      console.log(`[SERVER-UTILS] Carregando ${maquinasData.maquinasClimatizacao.length} máquina(s) de climatização para ${roomName}`);
      

      setTimeout(() => {
        if (typeof window.loadSavedMachines !== 'undefined') {
          window.loadSavedMachines(roomId, maquinasData.maquinasClimatizacao);
        } else {
          console.warn('[SERVER-UTILS] Função loadSavedMachines não disponível ainda');

          setTimeout(() => {
            if (typeof window.loadSavedMachines !== 'undefined') {
              window.loadSavedMachines(roomId, maquinasData.maquinasClimatizacao);
            }
          }, 1000);
        }
      }, 800);
    }

    // Manter compatibilidade com máquinas antigas se existirem
    if (maquinasData && Array.isArray(maquinasData) && maquinasData.length > 0) {
      console.log(` ${maquinasData.length} máquina(s) legada(s) encontrada(s) - compatibilidade mantida`);
      
      // Remover máquina padrão se existir
      const emptyMessage = document.getElementById(`machines-${roomId}`)?.querySelector('.empty-message')
      if (emptyMessage) {
        emptyMessage.remove()
      }

      // Adicionar máquinas
      maquinasData.forEach((machineData, index) => {
        // Adicionar máquina
        const addMachineButton = roomBlock.querySelector(`button[onclick="addMachine('${roomId}')"]`)
        if (addMachineButton) {
          addMachineButton.click()
          
          // Preencher dados da máquina após ser adicionada
          setTimeout(() => {
            const machineContainer = document.getElementById(`machines-${roomId}`)
            if (machineContainer) {
              const machineItems = machineContainer.querySelectorAll('.machine-item')
              const lastMachine = machineItems[machineItems.length - 1]
              
              if (lastMachine) {
                Object.entries(machineData).forEach(([field, value]) => {
                  const machineInput = lastMachine.querySelector(`[data-field="maquina_${field}"]`)
                  if (machineInput) {
                    machineInput.value = value || ""
                  }
                })
              }
            }
          }, 50)
        }
      })
    }

    // Delay para garantir que os inputs foram renderizados
    setTimeout(() => {
      calculateVazaoArAndThermalGains(roomId)
    }, 150);

    console.log(` Inputs da sala ${roomName} preenchidos e cálculos recalculados`)
  };
  
  tryPopulate();
}

export {
  renderProjectFromData,
  renderRoomFromData,
  populateRoomInputs,
}