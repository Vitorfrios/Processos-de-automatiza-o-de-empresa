import { ensureStringId } from '../utils/utils.js'

function buildProjectData(projectBlock, projectId) {
  const projectData = {
    nome: projectBlock.querySelector(".project-title").textContent.trim(),
    salas: [],
  }

  if (projectId !== null && projectId !== undefined) {
    projectData.id = ensureStringId(projectId)
  }

  const roomBlocks = projectBlock.querySelectorAll(".room-block")
  roomBlocks.forEach((roomBlock, index) => {
    const roomData = extractRoomData(roomBlock)
    roomData.id = ensureStringId(index + 1)
    projectData.salas.push(roomData)
  })

  console.log('[DATA-UTILS] Dados do projeto coletados:', projectData)
  return projectData
}

function extractRoomData(roomBlock) {
  const roomData = {
    nome: roomBlock.querySelector(".room-title").textContent.trim(),
    inputs: {},
  }

  const roomId = roomBlock.querySelector('[id^="room-content-"]')?.id.replace("room-content-", "")
  if (roomId) {
    // Coletar inputs de climatização
    const climaInputs = roomBlock.querySelectorAll(".clima-input")
    climaInputs.forEach((input) => {
      const field = input.dataset.field
      const value = input.value

      if (value === "" || value === null || value === undefined) {
        roomData.inputs[field] = input.type === "number" ? 0 : ""
        return
      }

      if (input.tagName === "SELECT" || input.type === "text") {
        roomData.inputs[field] = value
      } else if (input.type === "number") {
        roomData.inputs[field] = Number.parseFloat(value) || 0
      } else {
        roomData.inputs[field] = value
      }
    })

    // CORREÇÃO: Coletar opções de instalação (checkboxes) como ARRAY
    const opcoesInstalacaoCheckboxes = roomBlock.querySelectorAll('input[name^="opcoesInstalacao-"]:checked')
    const opcoesSelecionadas = Array.from(opcoesInstalacaoCheckboxes).map(checkbox => checkbox.value)
    
    if (opcoesSelecionadas.length > 0) {
      roomData.configuracoes = {
        opcoesInstalacao: opcoesSelecionadas
      }
    }

    // ========== COLETA DAS MÁQUINAS DE CLIMATIZAÇÃO ==========
    const climatizationMachines = roomBlock.querySelectorAll('.climatization-machine')
    if (climatizationMachines.length > 0) {
      roomData.maquinasClimatizacao = []
      climatizationMachines.forEach((machineElement) => {
        const machineData = extractClimatizationMachineData(machineElement)
        if (Object.keys(machineData).length > 0) {
          roomData.maquinasClimatizacao.push(machineData)
        }
      })
      console.log(`[DATA-UTILS] ${roomData.maquinasClimatizacao.length} máquina(s) de climatização coletadas para sala ${roomData.nome}`)
    }

    // Coletar dados das máquinas antigas (se ainda existirem)
    const machineItems = roomBlock.querySelectorAll('.machine-item')
    if (machineItems.length > 0) {
      roomData.maquinas = []
      machineItems.forEach((machineItem, index) => {
        const machineData = {}
        const machineInputs = machineItem.querySelectorAll('input[data-field], select[data-field]')
        
        machineInputs.forEach((input) => {
          const field = input.dataset.field.replace('maquina_', '') // Remove prefixo
          if (input.type === 'number') {
            machineData[field] = input.value ? Number.parseFloat(input.value) : 0
          } else {
            machineData[field] = input.value || ""
          }
        })
        
        if (Object.keys(machineData).length > 0) {
          roomData.maquinas.push(machineData)
        }
      })
    }

    // Coletar vazão de ar
    const vazaoElement = document.getElementById(`vazao-ar-${roomId}`)
    if (vazaoElement) {
      const vazaoValue = vazaoElement.textContent.trim()
      roomData.inputs.vazaoArExterno = Number.parseInt(vazaoValue) || 0
    }

    // Coletar ganhos térmicos
    const totalGanhosElement = document.getElementById(`total-ganhos-w-${roomId}`)
    const totalTRElement = document.getElementById(`total-tr-${roomId}`)

    const totalExternoElement = document.getElementById(`total-externo-${roomId}`)
    const totalDivisoesElement = document.getElementById(`total-divisoes-${roomId}`)
    const totalPisoElement = document.getElementById(`total-piso-${roomId}`)
    const totalIluminacaoElement = document.getElementById(`total-iluminacao-${roomId}`)
    const totalDissiElement = document.getElementById(`total-dissi-${roomId}`)
    const totalPessoasElement = document.getElementById(`total-pessoas-${roomId}`)

    const totalArSensivelElement = document.getElementById(`total-ar-sensivel-${roomId}`)
    const totalArLatenteElement = document.getElementById(`total-ar-latente-${roomId}`)
    const totalArExterno =
      (Number.parseInt(totalArSensivelElement?.textContent) || 0) +
      (Number.parseInt(totalArLatenteElement?.textContent) || 0)

    if (totalGanhosElement && totalTRElement) {
      roomData.ganhosTermicos = {
        totalW: Number.parseInt(totalGanhosElement.textContent) || 0,
        totalTR: Number.parseInt(totalTRElement.textContent) || 0,
        totalExterno: Number.parseInt(totalExternoElement?.textContent) || 0,
        totalDivisoes: Number.parseInt(totalDivisoesElement?.textContent) || 0,
        totalPiso: Number.parseInt(totalPisoElement?.textContent) || 0,
        totalIluminacao: Number.parseInt(totalIluminacaoElement?.textContent) || 0,
        totalEquipamentos: Number.parseInt(totalDissiElement?.textContent) || 0,
        totalPessoas: Number.parseInt(totalPessoasElement?.textContent) || 0,
        totalArExterno: totalArExterno,
      }
    }
  }

  return roomData
}

// ========== FUNÇÃO PARA COLETAR DADOS DAS MÁQUINAS DE CLIMATIZAÇÃO ==========

function extractClimatizationMachineData(machineElement) {
  const machineData = {
    nome: machineElement.querySelector('.machine-title-editable')?.value || '',
    tipo: machineElement.querySelector('.machine-type-select')?.value || '',
    potencia: machineElement.querySelector('.machine-potency-select')?.value || '',
    tensao: machineElement.querySelector('.machine-voltage-select')?.value || '',
    precoBase: parseMachinePrice(machineElement.querySelector('.price-display')?.textContent),
    opcoesSelecionadas: [],
    precoTotal: parseMachinePrice(machineElement.querySelector('.machine-total-price span')?.textContent)
  };

  // Coletar opções selecionadas
  const opcoesCheckboxes = machineElement.querySelectorAll('.option-checkbox input[type="checkbox"]:checked');
  opcoesCheckboxes.forEach(checkbox => {
    const optionElement = checkbox.closest('.option-checkbox');
    machineData.opcoesSelecionadas.push({
      id: parseInt(checkbox.dataset.optionId) || 0,
      nome: optionElement.querySelector('.option-name')?.textContent || '',
      valor: parseFloat(checkbox.value) || 0
    });
  });

  console.log('[DATA-UTILS] Máquina coletada:', machineData)
  return machineData;
}

// Função auxiliar para parsear preços
function parseMachinePrice(priceText) {
  if (!priceText) return 0;
  return parseFloat(priceText.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
}

export {
  buildProjectData,
  extractRoomData,
  extractClimatizationMachineData
}