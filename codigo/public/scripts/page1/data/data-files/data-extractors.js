/**
 * data-extractors.js
 * Módulo de extração de dados dos elementos HTML
 * Responsável por coletar dados de salas, máquinas, ganhos térmicos, etc.
 */

// Importações necessárias
import { getRoomFullId, getMachineName, parseMachinePrice, extractNumberFromText } from './data-utils-core.js'

/**
 * Extrai dados de ganhos térmicos de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Object} Dados de ganhos térmicos
 */
function extractThermalGainsData(roomElement) {
    console.log('🎯 FUNÇÃO extractThermalGainsData CHAMADA!')
    
    const gains = {}
    const roomId = roomElement.id.replace('room-content-', '')
    const roomFullId = getRoomFullId(roomElement)
    
    console.log(`🔑 ID completo da sala: ${roomFullId}`)
    
    const totalSelectors = {
        'total-ganhos-w': `#total-ganhos-w-${roomFullId}`,
        'total-tr': `#total-tr-${roomFullId}`,
        'total-externo': `#total-externo-${roomFullId}`,
        'total-divisoes': `#total-divisoes-${roomFullId}`,
        'total-piso': `#total-piso-${roomFullId}`,
        'total-iluminacao': `#total-iluminacao-${roomFullId}`,
        'total-dissi': `#total-dissi-${roomFullId}`,
        'total-pessoas': `#total-pessoas-${roomFullId}`,
        'total-ar-sensivel': `#total-ar-sensivel-${roomFullId}`,
        'total-ar-latente': `#total-ar-latente-${roomFullId}`
    }
    
    let encontrados = 0
    
    Object.entries(totalSelectors).forEach(([key, selector]) => {
        try {
            const element = document.querySelector(selector)
            
            if (element) {
                let value = element.textContent || element.innerText || element.innerHTML || ''
                
                if (value && value.trim() !== '') {
                    value = value.replace(/<[^>]*>/g, '').trim()
                    const numericMatch = value.match(/-?\d+(?:[.,]\d+)?/)
                    
                    if (numericMatch) {
                        const numericString = numericMatch[0].replace(',', '.')
                        const numericValue = parseFloat(numericString)
                        
                        if (!isNaN(numericValue)) {
                            gains[key] = numericValue
                            encontrados++
                        } else {
                            gains[key] = 0
                        }
                    } else {
                        gains[key] = 0
                    }
                } else {
                    gains[key] = 0
                }
            } else {
                gains[key] = 0
                attemptAlternativeSearch(key, roomFullId, gains)
            }
        } catch (error) {
            console.error(`💥 Erro ao processar ${selector}:`, error)
            gains[key] = 0
        }
    })
    
    console.log(`🔥 ${encontrados} ganhos térmicos coletados:`, gains)
    return gains
}

/**
 * Extrai inputs de climatização de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Object} Dados dos inputs de climatização
 */
function extractClimatizationInputs(roomElement) {
    const inputs = {}
    
    const textInputs = roomElement.querySelectorAll('.clima-input[type="text"], .clima-input[type="number"], .clima-input[data-field]')
    textInputs.forEach(input => {
        const field = input.getAttribute('data-field')
        if (!field) return
        
        let value = input.value
        
        if (input.type === 'number' && value !== '') {
            value = parseFloat(value) || 0
        }
        
        if (value !== undefined && value !== '' && value !== null) {
            inputs[field] = value
        }
    })

    const pressurizacaoRadios = roomElement.querySelectorAll('input[name*="pressurizacao"][type="radio"]')
    let pressurizacaoValue = false
    
    pressurizacaoRadios.forEach(radio => {
        if (radio.checked) {
            pressurizacaoValue = radio.value === 'sim'
        }
    })
    
    inputs.pressurizacao = pressurizacaoValue
    
    if (!pressurizacaoValue) {
        inputs.pressurizacaoSetpoint = "25"
        inputs.numPortasDuplas = "0"
        inputs.numPortasSimples = "0"
    } else {
        const setpointInput = roomElement.querySelector('.clima-input[data-field="pressurizacaoSetpoint"]')
        const portasDuplasInput = roomElement.querySelector('.clima-input[data-field="numPortasDuplas"]')
        const portasSimplesInput = roomElement.querySelector('.clima-input[data-field="numPortasSimples"]')
        
        if (setpointInput) inputs.pressurizacaoSetpoint = setpointInput.value || "25"
        if (portasDuplasInput) inputs.numPortasDuplas = portasDuplasInput.value || "0"
        if (portasSimplesInput) inputs.numPortasSimples = portasSimplesInput.value || "0"
    }

    const selectInputs = roomElement.querySelectorAll('.clima-input[data-field]')
    selectInputs.forEach(select => {
        const field = select.getAttribute('data-field')
        if (!field || inputs[field] !== undefined) return
        
        const value = select.value
        if (value !== undefined && value !== '' && value !== null) {
            inputs[field] = value
        }
    })

    console.log(`📝 Inputs de climatização coletados: ${Object.keys(inputs).length}`, inputs)
    return inputs
}

/**
 * Extrai dados das máquinas de climatização de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Array} Lista de dados das máquinas
 */
function extractMachinesData(roomElement) {
    const machines = []
    const machineElements = roomElement.querySelectorAll('.climatization-machine')
    
    machineElements.forEach(machineElement => {
        const machineData = extractClimatizationMachineData(machineElement)
        if (machineData) {
            machines.push(machineData)
        }
    })
    
    console.log(`🤖 ${machines.length} máquina(s) extraída(s) da sala`)
    return machines
}

/**
 * Extrai dados de uma máquina de climatização individual
 * @param {HTMLElement} machineElement - Elemento HTML da máquina
 * @returns {Object} Dados da máquina
 */
function extractClimatizationMachineData(machineElement) {
    const machineId = machineElement.getAttribute('data-machine-id') || `machine-${Date.now()}`

    const machineData = {
        nome: getMachineName(machineElement, machineId),
        tipo: machineElement.querySelector('.machine-type-select')?.value || '',
        potencia: machineElement.querySelector('.machine-power-select')?.value || '',
        tensao: machineElement.querySelector('.machine-voltage-select')?.value || '',
        precoBase: 0,
        opcoesSelecionadas: [],
        precoTotal: 0,
        potenciaSelecionada: machineElement.querySelector('.machine-power-select')?.value || '',
        tipoSelecionado: machineElement.querySelector('.machine-type-select')?.value || ''
    }

    try {
        const basePriceElement = document.getElementById(`base-price-${machineId}`)
        if (basePriceElement) {
            machineData.precoBase = parseMachinePrice(basePriceElement.textContent)
        }

        const selectedOptions = []
        const optionCheckboxes = machineElement.querySelectorAll('input[type="checkbox"]:checked')
        
        optionCheckboxes.forEach((checkbox, index) => {
            const optionId = checkbox.getAttribute('data-option-id') || (index + 1).toString()
            const optionValue = parseFloat(checkbox.value) || 0
            const optionName = checkbox.getAttribute('data-option-name') || `Opção ${optionId}`
            
            selectedOptions.push({
                id: parseInt(optionId) || (index + 1),
                name: optionName.replace(/\s*R\$\s*[\d.,]+/, '').trim(),
                value: optionValue,
                originalName: optionName,
                potenciaAplicada: machineData.potencia
            })
        })

        machineData.opcoesSelecionadas = selectedOptions

        const totalPriceElement = document.getElementById(`total-price-${machineId}`)
        if (totalPriceElement) {
            machineData.precoTotal = parseMachinePrice(totalPriceElement.textContent)
        } else {
            machineData.precoTotal = machineData.precoBase + 
                selectedOptions.reduce((sum, option) => sum + option.value, 0)
        }

        console.log(`✅ Máquina ${machineId} extraída:`, {
            nome: machineData.nome,
            tipo: machineData.tipo,
            potencia: machineData.potencia,
            precoBase: machineData.precoBase,
            opcoes: machineData.opcoesSelecionadas.length,
            precoTotal: machineData.precoTotal
        })

        return machineData

    } catch (error) {
        console.error(`❌ Erro ao extrair dados da máquina ${machineId}:`, error)
        return machineData
    }
}

/**
 * Extrai dados de capacidade de refrigeração de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Object} Dados de capacidade
 */
function extractCapacityData(roomElement) {
    const capacityData = {}
    const roomId = roomElement.id.replace('room-content-', '')

    try {
        const specificSelectors = {
            fatorSeguranca: `#fator-seguranca-${roomId}`,
            capacidadeUnitaria: `#capacidade-unitaria-${roomId}`,
            solucao: `#solucao-${roomId}`,
            solucaoBackup: `#solucao-backup-${roomId}`,
            totalCapacidade: `#total-capacidade-${roomId}`,
            folga: `#folga-${roomId}`
        }

        Object.entries(specificSelectors).forEach(([key, selector]) => {
            const element = roomElement.querySelector(selector)
            if (element) {
                let value = element.textContent || element.value
                
                if (key === 'folga' && typeof value === 'string') {
                    value = value.replace('%', '')
                }
                
                if (value && !isNaN(value.replace(',', '.'))) {
                    value = parseFloat(value.replace(',', '.'))
                }
                
                capacityData[key] = value
            }
        })

        const backupSelect = roomElement.querySelector('.backup-select')
        if (backupSelect) {
            capacityData.backup = backupSelect.value
        }

        const cargaEstimadaElement = document.getElementById(`carga-estimada-${roomId}`)
        if (cargaEstimadaElement) {
            const input = cargaEstimadaElement.querySelector('input')
            if (input) {
                capacityData.cargaEstimada = parseInt(input.value) || 0
            } else {
                capacityData.cargaEstimada = parseInt(cargaEstimadaElement.textContent) || 0
            }
        }

        console.log(`❄️ Dados de capacidade coletados: ${Object.keys(capacityData).length}`, capacityData)
        return capacityData

    } catch (error) {
        console.error(`❌ Erro ao extrair dados de capacidade da sala ${roomId}:`, error)
        return capacityData
    }
}

/**
 * Extrai dados de configuração de instalação de uma sala
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @returns {Object} Dados de configuração
 */
function extractConfigurationData(roomElement) {
    const config = {
        opcoesInstalacao: []
    }
    
    console.log('🔍 Buscando configurações na sala...')
    
    const opcoesInstalacaoCheckboxes = roomElement.querySelectorAll('input[name^="opcoesInstalacao-"][type="checkbox"]')
    
    console.log(`📋 Encontrados ${opcoesInstalacaoCheckboxes.length} checkboxes de opções de instalação`)
    
    opcoesInstalacaoCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const value = checkbox.value
            config.opcoesInstalacao.push(value)
            console.log(`✅ Opção de instalação selecionada: ${value}`)
        }
    })
    
    console.log(`⚙️ Configurações coletadas:`, {
        opcoesInstalacao: config.opcoesInstalacao.length
    }, config)
    
    return config
}

/**
 * Busca alternativa por texto quando o elemento não é encontrado pelo ID
 * @param {string} key - Chave do ganho térmico
 * @param {string} roomFullId - ID completo da sala
 * @param {Object} gains - Objeto de ganhos térmicos
 * @returns {void}
 */
function attemptAlternativeSearch(key, roomFullId, gains) {
    const textMap = {
        'total-ganhos-w': 'Total de Ganhos Térmicos:',
        'total-tr': 'Total em TR:',
        'total-externo': 'Total Paredes Externas e Teto',
        'total-divisoes': 'Total Divisórias',
        'total-piso': 'Total Piso',
        'total-iluminacao': 'Total Iluminação',
        'total-dissi': 'Total Equipamentos',
        'total-pessoas': 'Total Pessoas',
        'total-ar-sensivel': 'Total Ar Externo Sensível',
        'total-ar-latente': 'Total Ar Externo Latente'
    }
    
    const textToFind = textMap[key]
    if (!textToFind) return
    
    console.log(`🔍 Buscando alternativa para ${key}: "${textToFind}"`)
    
    const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || el.innerText || ''
        return text.includes(textToFind)
    })
    
    if (elements.length > 0) {
        for (const element of elements) {
            const selfText = element.textContent || element.innerText || ''
            const selfNumber = extractNumberFromText(selfText)
            if (selfNumber !== null) {
                gains[key] = selfNumber
                console.log(`✅ ${key}: ${selfNumber} -> SALVO (via texto próprio)`)
                return
            }
            
            const parent = element.parentElement
            if (parent) {
                const parentText = parent.textContent || parent.innerText || ''
                const parentNumber = extractNumberFromText(parentText)
                if (parentNumber !== null) {
                    gains[key] = parentNumber
                    console.log(`✅ ${key}: ${parentNumber} -> SALVO (via texto pai)`)
                    return
                }
            }
        }
    }
}

export {
    extractThermalGainsData,
    extractClimatizationInputs,
    extractMachinesData,
    extractClimatizationMachineData,
    extractCapacityData,
    extractConfigurationData
}