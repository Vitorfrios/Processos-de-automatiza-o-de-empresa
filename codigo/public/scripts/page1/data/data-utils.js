import { ensureStringId } from '../utils/utils.js'

/**
 * Constrói o objeto de dados completo de um projeto a partir do HTML
 * Coleta nome do projeto, salas e todos os dados associados
 * @param {HTMLElement} projectBlock - Elemento HTML do projeto
 * @param {string|number} projectId - ID único do projeto
 * @returns {Object} Dados estruturados do projeto
 */
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

/**
 * Extrai todos os dados de uma sala a partir do elemento HTML
 * Coleta inputs, configurações, máquinas, ganhos térmicos e capacidade
 * @param {HTMLElement} roomBlock - Elemento HTML da sala
 * @returns {Object} Dados completos da sala
 */
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

    // ========== COLETA DOS DADOS DE CAPACIDADE DE REFRIGERAÇÃO ==========
    const capacityData = extractCapacityData(roomBlock, roomId)
    if (capacityData && Object.keys(capacityData).length > 0) {
      roomData['Cálculo_Capacidade_Refrigeração'] = capacityData
      console.log(`[DATA-UTILS] Dados de capacidade coletados para sala ${roomData.nome}:`, capacityData)
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

/**
 * Extrai dados de capacidade de refrigeração de uma sala
 * Coleta fator de segurança, capacidade unitária, backup e cálculos
 * @param {HTMLElement} roomBlock - Elemento HTML da sala
 * @param {string} roomId - ID único da sala
 * @returns {Object|null} Dados de capacidade ou null se inválidos
 */
function extractCapacityData(roomBlock, roomId) {
  try {
    const fatorSegurancaInput = document.getElementById(`fator-seguranca-${roomId}`)
    const capacidadeUnitariaSelect = document.getElementById(`capacidade-unitaria-${roomId}`)
    const backupSelect = roomBlock.querySelector('.backup-select')
    
    const cargaEstimadaElement = document.getElementById(`carga-estimada-${roomId}`)
    const solucaoElement = document.getElementById(`solucao-${roomId}`)
    const solucaoBackupElement = document.getElementById(`solucao-backup-${roomId}`)
    const totalCapacidadeElement = document.getElementById(`total-capacidade-${roomId}`)
    const folgaElement = document.getElementById(`folga-${roomId}`)

    // Verificar se todos os elementos necessários existem
    if (!fatorSegurancaInput || !capacidadeUnitariaSelect || !backupSelect) {
      console.warn(`[DATA-UTILS] Elementos de capacidade não encontrados para sala ${roomId}`)
      return null
    }

    const capacityData = {
      fatorSeguranca: Number.parseFloat(fatorSegurancaInput.value) || 10,
      capacidadeUnitaria: Number.parseFloat(capacidadeUnitariaSelect.value) || 1,
      backup: backupSelect.value || "n",
      cargaEstimada: parseFloat(cargaEstimadaElement?.textContent) || 0,
      solucao: solucaoElement?.textContent || "0",
      solucaoBackup: solucaoBackupElement?.textContent || "0",
      totalCapacidade: parseFloat(totalCapacidadeElement?.textContent) || 0,
      folga: folgaElement?.textContent || "0%"
    }

    // Validar se os dados são significativos (não apenas zeros)
    const hasValidData = Object.values(capacityData).some(value => {
      if (typeof value === 'number') return value !== 0
      if (typeof value === 'string') return value !== "0" && value !== "0%"
      return true
    })

    return hasValidData ? capacityData : null

  } catch (error) {
    console.error(`[DATA-UTILS] Erro ao extrair dados de capacidade para ${roomId}:`, error)
    return null
  }
}

/**
 * Extrai dados de uma máquina de climatização individual
 * Coleta tipo, potência, tensão, preço e opções selecionadas
 * @param {HTMLElement} machineElement - Elemento HTML da máquina
 * @returns {Object} Dados completos da máquina
 */
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

/**
 * Função auxiliar para converter texto de preço em número
 * Remove formatação brasileira (R$, pontos e vírgulas)
 * @param {string} priceText - Texto do preço formatado
 * @returns {number} Valor numérico do preço
 */
function parseMachinePrice(priceText) {
  if (!priceText) return 0;
  return parseFloat(priceText.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
}

export {
  buildProjectData,
  extractRoomData,
  extractClimatizationMachineData,
  extractCapacityData
}