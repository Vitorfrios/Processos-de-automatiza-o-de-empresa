import { 
  CALCULATION_CONSTANTS
} from '../config/config.js'

// Função auxiliar para converter valores vazios corretamente
function safeNumber(value, defaultValue = 0) {
  return (value !== "" && value !== undefined && value !== null) 
    ? Number(value) 
    : defaultValue
}

async function waitForSystemConstants() {
  let attempts = 0;
  const maxAttempts = 100;
  
  while ((!window.systemConstants || !window.systemConstants.VARIAVEL_PD) && attempts < maxAttempts) {
    console.log("[v0] Aguardando constantes do sistema...", attempts);
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    console.error("[v0] TIMEOUT: Constantes do sistema não carregadas após", maxAttempts, "tentativas");
    console.error("[v0] systemConstants atual:", window.systemConstants);
    throw new Error("Constantes do sistema não carregadas");
  }
  
  console.log("[v0] Constantes do sistema disponíveis após", attempts, "tentativas");
  return true;
}

function validateSystemConstants() {
  if (!window.systemConstants) {
    console.error("[v0] systemConstants é null ou undefined");
    return false;
  }
  
  // Verificar constantes específicas para ganhos térmicos
  const requiredConstants = [
    'VARIAVEL_PD', 'VARIAVEL_PS', 'AUX_U_Value_Piso', 'AUX_Fator_Iluminacao',
    'AUX_Fs_Iluminacao', 'AUX_Fator_Conver_Painel', 'AUX_Fs_Paineis',
    'AUX_OCp_Csp', 'AUX_OCp_Clp', 'Densi_ar', 'AUX_c_ArExterno',
    'AUX_deltaT_ArExterno', 'AUX_f_ArExterno', 'AUX_deltaUa_ArExterno',
    'deltaT_piso', 'deltaT_teto', 'deltaT_parede_Oes', 'deltaT_parede_Les',
    'deltaT_parede_Nor', 'deltaT_parede_Sul', 'deltaT_divi_N_clim1',
    'deltaT_divi_N_clim2', 'deltaT_divi_clim1', 'deltaT_divi_clim2'
  ];
  
  const missingConstants = requiredConstants.filter(constant => 
    window.systemConstants[constant] === undefined || window.systemConstants[constant] === null
  );
  
  if (missingConstants.length > 0) {
    console.error("[v0] Constantes faltando:", missingConstants);
    return false;
  }
  
  console.log("[v0] Todas as constantes necessárias estão disponíveis");
  return true;
}

function collectClimatizationInputs(climaSection, roomId) {
  const inputs = climaSection.querySelectorAll(".clima-input")
  const data = {}

  inputs.forEach((input) => {
    const field = input.dataset.field
    let value = input.value
    
    // DEBUG ESPECÍFICO PARA TIPO CONSTRUÇÃO
    if (field === "tipoConstrucao") {
      console.log(`[DEBUG COLLECT] Input tipoConstrucao encontrado:`)
      console.log(`[DEBUG COLLECT] - value: "${value}"`)
      console.log(`[DEBUG COLLECT] - selectedIndex: ${input.selectedIndex}`)
      console.log(`[DEBUG COLLECT] - options:`, Array.from(input.options).map(opt => ({value: opt.value, text: opt.text, selected: opt.selected})))
    }
    
    // Converter para número APENAS se for campo numérico E tiver valor
    if (input.type === 'number') {
      value = value !== "" ? Number.parseFloat(value) : ""
    } else if (input.tagName === 'SELECT' || input.type === 'text') {
      value = value !== "" ? value : ""
    }
    
    data[field] = value
  })

  console.log("[DEBUG COLLECT] Dados coletados para cálculo:", data)
  return data
}

function computeAirFlowRate(inputData) {
  // Usar função auxiliar para converter valores corretamente
  const numPortasDuplas = safeNumber(inputData.numPortasDuplas)
  const numPortasSimples = safeNumber(inputData.numPortasSimples)
  const pressurizacao = safeNumber(inputData.pressurizacao)

  console.log("[v0] ===== CÁLCULO DE VAZÃO =====")
  console.log("[v0] Portas Duplas:", numPortasDuplas)
  console.log("[v0] Portas Simples:", numPortasSimples)
  console.log("[v0] Pressurização (Pa):", pressurizacao)

  if (!window.systemConstants || !window.systemConstants.VARIAVEL_PD || !window.systemConstants.VARIAVEL_PS) {
    console.error("[v0] ERRO: Constantes do sistema não disponíveis para cálculo")
    alert("ERRO: Constantes do sistema não carregadas. Verifique o servidor.");
    return 0
  }

  const doubleDoorFlow = calculateDoorFlow(numPortasDuplas, window.systemConstants.VARIAVEL_PD, pressurizacao)
  const singleDoorFlow = calculateDoorFlow(numPortasSimples, window.systemConstants.VARIAVEL_PS, pressurizacao)

  console.log("[v0] Fluxo Portas Duplas:", doubleDoorFlow)
  console.log("[v0] Fluxo Portas Simples:", singleDoorFlow)

  const totalFlow = doubleDoorFlow + singleDoorFlow
  const adjustedFlow = totalFlow / CALCULATION_CONSTANTS.FLOW_DIVISOR
  const finalFlow = adjustedFlow * CALCULATION_CONSTANTS.SAFETY_FACTOR
  const roundedFlow = Math.ceil(finalFlow)

  console.log("[v0] Fluxo Total:", totalFlow)
  console.log("[v0] Fluxo Ajustado:", adjustedFlow)
  console.log("[v0] Fluxo Final:", finalFlow)
  console.log("[v0] Vazão Arredondada:", roundedFlow)
  console.log("[v0] ===== FIM DO CÁLCULO =====")

  return roundedFlow
}

function calculateDoorFlow(doorCount, doorVariable, pressure) {
  const count = safeNumber(doorCount)
  const variable = safeNumber(doorVariable)
  const press = safeNumber(pressure)
  
  console.log(`[v0] calculateDoorFlow: count=${count}, variable=${variable}, pressure=${press}`)
  
  const pressureExponent = press > 0 ? Math.pow(press, CALCULATION_CONSTANTS.PRESSURE_EXPONENT) : 0
  
  const flow = CALCULATION_CONSTANTS.FLOW_COEFFICIENT *
    count *
    variable *
    pressureExponent *
    CALCULATION_CONSTANTS.SECONDS_PER_HOUR
    
  console.log(`[v0] Fluxo calculado: ${flow}`)
  return flow
}

async function calculateVazaoAr(roomId, calculateThermal = true) {
  try {
    console.log(`[v0] Iniciando cálculo de vazão para ${roomId}`);
    
    await waitForSystemConstants();
    
    if (!validateSystemConstants()) {
      console.error("[v0] Constantes do sistema inválidas");
      return 0;
    }

    const roomContent = document.getElementById(`room-content-${roomId}`);
    if (!roomContent) {
      console.error("[v0] Sala não encontrada:", roomId);
      return 0;
    }

    const climaSection = roomContent.querySelector('[id*="-clima"]');
    if (!climaSection) {
      console.error("[v0] Seção de climatização não encontrada");
      return 0;
    }

    const inputData = collectClimatizationInputs(climaSection, roomId);
    const flowRate = computeAirFlowRate(inputData);

    updateFlowRateDisplay(roomId, flowRate);

    // CHAMAR CÁLCULO DE GANHOS TÉRMICOS AUTOMATICAMENTE
    if (calculateThermal) {
      console.log(`[v0] Chamando cálculo de ganhos térmicos para ${roomId}`);
      await calculateThermalGains(roomId, flowRate);
    }

    return flowRate;
  } catch (error) {
    console.error("[v0] Erro no cálculo de vazão:", error);
    alert("Erro ao calcular vazão. Verifique se as constantes do sistema foram carregadas.");
    return 0;
  }
}

function updateFlowRateDisplay(roomId, flowRate) {
  const resultElement = document.getElementById(`vazao-ar-${roomId}`)
  if (resultElement) {
    resultElement.textContent = flowRate
    console.log(`[DEBUG] Vazão atualizada para ${roomId}: ${flowRate} l/s`)
  }
}

async function calculateVazaoArAndThermalGains(roomId) {
  console.log(`[DEBUG] calculateVazaoArAndThermalGains iniciado para ${roomId}`);
  
  try {
    const flowRate = await calculateVazaoAr(roomId, false);
    console.log(`[DEBUG] Vazão calculada: ${flowRate}, chamando ganhos térmicos`);
    await calculateThermalGains(roomId, flowRate);
  } catch (error) {
    console.error(`[DEBUG] Erro em calculateVazaoArAndThermalGains:`, error);
  }
}

async function calculateThermalGains(roomId, vazaoArExterno = 0) {
  console.log(`[DEBUG] calculateThermalGains INICIADO para ${roomId}, vazao: ${vazaoArExterno}`);
  
  try {
    await waitForSystemConstants()

    if (!validateSystemConstants()) {
      console.error(`[DEBUG] validateSystemConstants FALHOU para ${roomId}`);
      return
    }

    const roomContent = document.getElementById(`room-content-${roomId}`)
    if (!roomContent) {
      console.error(`[DEBUG] room-content-${roomId} NÃO ENCONTRADO`);
      return
    }

    const climaSection = roomContent.querySelector('[id*="-clima"]')
    if (!climaSection) {
      console.error(`[DEBUG] Seção clima NÃO ENCONTRADA para ${roomId}`);
      return
    }

    const inputData = collectClimatizationInputs(climaSection, roomId)
    console.log(`[DEBUG] Dados coletados:`, inputData);
    
    // DEBUG ESPECÍFICO PARA TIPO DE CONSTRUÇÃO
    console.log(`[DEBUG CRÍTICO] TipoConstrucao: "${inputData.tipoConstrucao}"`);
    console.log(`[DEBUG CRÍTICO] Comparação com "eletrocentro": ${inputData.tipoConstrucao === "eletrocentro"}`);
    console.log(`[DEBUG CRÍTICO] Comparação com "alvenaria": ${inputData.tipoConstrucao === "alvenaria"}`);
    
    // Aplicar valores padrão APENAS para cálculos, mantendo inputs vazios
    const calcData = {
      ...inputData,
      area: safeNumber(inputData.area),
      paredeOeste: safeNumber(inputData.paredeOeste),
      paredeLeste: safeNumber(inputData.paredeLeste),
      paredeNorte: safeNumber(inputData.paredeNorte),
      paredeSul: safeNumber(inputData.paredeSul),
      peDireito: safeNumber(inputData.peDireito),
      divisoriaNaoClima1: safeNumber(inputData.divisoriaNaoClima1),
      divisoriaNaoClima2: safeNumber(inputData.divisoriaNaoClima2),
      divisoriaClima1: safeNumber(inputData.divisoriaClima1),
      divisoriaClima2: safeNumber(inputData.divisoriaClima2),
      dissipacao: safeNumber(inputData.dissipacao),
      numPessoas: safeNumber(inputData.numPessoas),
      vazaoArExterno: vazaoArExterno
    }

    console.log("[v0] ===== CÁLCULO DE GANHOS TÉRMICOS =====")
    console.log("[v0] Dados de entrada:", inputData)
    console.log("[v0] Dados para cálculo:", calcData)
    console.log("[v0] Vazão de ar externo:", vazaoArExterno)

    const uValues = calculateUValues(calcData.tipoConstrucao)
    console.log(`[DEBUG] UValues calculados:`, uValues);

    const auxVars = calculateAuxiliaryVariables({...calcData, vazaoArExterno})
    console.log(`[DEBUG] Variáveis auxiliares:`, auxVars);

    // CÁLCULOS INDIVIDUAIS COM DEBUG
    console.log(`[DEBUG] Iniciando cálculos individuais...`);
    
    const gains = {
      teto: calculateCeilingGain(calcData.area, uValues.teto, window.systemConstants.deltaT_teto),
      paredeOeste: calculateWallGain(calcData.paredeOeste, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_parede_Oes),
      paredeLeste: calculateWallGain(calcData.paredeLeste, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_parede_Les),
      paredeNorte: calculateWallGain(calcData.paredeNorte, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_parede_Nor),
      paredeSul: calculateWallGain(calcData.paredeSul, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_parede_Sul),
      divisoriaNaoClima1: calculatePartitionGain(calcData.divisoriaNaoClima1, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_divi_N_clim1),
      divisoriaNaoClima2: calculatePartitionGain(calcData.divisoriaNaoClima2, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_divi_N_clim2),
      divisoriaClima1: calculatePartitionGain(calcData.divisoriaClima1, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_divi_clim1),
      divisoriaClima2: calculatePartitionGain(calcData.divisoriaClima2, calcData.peDireito, uValues.parede, window.systemConstants.deltaT_divi_clim2),
      piso: calculateFloorGain(calcData.area, window.systemConstants),
      iluminacao: calculateLightingGain(calcData.area, window.systemConstants),
      dissipacao: calculateDissipationGain(calcData.dissipacao, window.systemConstants),
      pessoas: calculatePeopleGain(calcData.numPessoas, window.systemConstants),
      arSensivel: calculateExternalAirSensibleGain(vazaoArExterno, auxVars, window.systemConstants),
      arLatente: calculateExternalAirLatentGain(vazaoArExterno, window.systemConstants),
    }

    console.log(`[DEBUG] Cálculos individuais concluídos:`, gains);

    const totals = calculateTotals(gains)

    console.log("[v0] Ganhos calculados:", gains)
    console.log("[v0] Totais:", totals)
    console.log("[v0] ===== FIM DO CÁLCULO DE GANHOS TÉRMICOS =====")

    updateThermalGainsDisplay(roomId, gains, totals, uValues, {...inputData, vazaoArExterno})
    
    // FORÇAR ABRIR A SEÇÃO DE GANHOS TÉRMICOS
    const thermalSubsection = document.getElementById(`subsection-content-${roomId}-ganhos-termicos`);
    if (thermalSubsection) {
      thermalSubsection.classList.remove('collapsed');
      console.log(`[DEBUG] Seção de ganhos térmicos aberta para ${roomId}`);
    }
    
  } catch (error) {
    console.error(`[DEBUG] Erro em calculateThermalGains:`, error);
  }
}

function calculateUValues(tipoConstrucao) {
  const U_VALUE_ALVENARIA_TETO = 3.961
  const U_VALUE_ALVENARIA_PAREDE = 2.546
  const U_VALUE_LA_ROCHA_TETO = 1.145
  const U_VALUE_LA_ROCHA_PAREDE = 1.12

  console.log(`[DEBUG UVALUES] tipoConstrucao recebido: "${tipoConstrucao}"`)

  let uValueParede, uValueTeto

  // CORREÇÃO: Converter para minúsculas para comparar
  const tipoLower = tipoConstrucao ? tipoConstrucao.toLowerCase() : ""
  
  if (tipoLower === "eletrocentro") {
    console.log("[DEBUG UVALUES] ✅ ENTROU EM ELETROCENTRO")
    uValueParede = U_VALUE_LA_ROCHA_PAREDE
    uValueTeto = U_VALUE_LA_ROCHA_TETO
  } else if (tipoLower === "alvenaria") {
    console.log("[DEBUG UVALUES] ✅ ENTROU EM ALVENARIA")
    uValueParede = U_VALUE_ALVENARIA_PAREDE
    uValueTeto = U_VALUE_ALVENARIA_TETO
  } else {
    console.log("[DEBUG UVALUES] ❌ TIPO NÃO RECONHECIDO")
    uValueParede = 0
    uValueTeto = 0
  }

  const result = {
    parede: uValueParede,
    teto: uValueTeto,
    piso: window.systemConstants?.AUX_U_Value_Piso || 2.7,
  }

  console.log("[DEBUG UVALUES] UValues calculados:", result)
  return result
}

function calculateAuxiliaryVariables(inputData) {
  const vazaoArExterno = safeNumber(inputData.vazaoArExterno)
  const densiAr = window.systemConstants?.Densi_ar || 1.17

  console.log(`[DEBUG] calculateAuxiliaryVariables: vazaoArExterno=${vazaoArExterno}, densiAr=${densiAr}`);

  const m_ArExterno = vazaoArExterno * 3.6 * densiAr * 1000

  console.log(`[DEBUG] m_ArExterno calculado: ${m_ArExterno}`);

  return {
    m_ArExterno: m_ArExterno,
    vazaoArExterno: vazaoArExterno
  }
}

function calculateCeilingGain(area, uValue, deltaT) {
  const areaNum = safeNumber(area)
  const uValueNum = safeNumber(uValue)
  const deltaTNum = safeNumber(deltaT)
  const result = areaNum * uValueNum * deltaTNum
  console.log(`[DEBUG DETAIL] calculateCeilingGain: ${areaNum} * ${uValueNum} * ${deltaTNum} = ${result}`)
  return result
}

function calculateWallGain(comprimento, peDireito, uValue, deltaT) {
  const compNum = safeNumber(comprimento)
  const peDireitoNum = safeNumber(peDireito)
  const uValueNum = safeNumber(uValue)
  const deltaTNum = safeNumber(deltaT)
  const area = compNum * peDireitoNum
  const result = area * uValueNum * deltaTNum
  console.log(`[DEBUG DETAIL] calculateWallGain: (${compNum} * ${peDireitoNum}) = ${area}m² * ${uValueNum} * ${deltaTNum} = ${result}`)
  return result
}

function calculatePartitionGain(inputArea, peDireito, uValue, deltaT) {
  const area = safeNumber(inputArea) * safeNumber(peDireito)
  const result = area * uValue * deltaT
  console.log(`[DEBUG] calculatePartitionGain: (${inputArea} * ${peDireito}) * ${uValue} * ${deltaT} = ${result}`)
  return result
}

function calculateFloorGain(area, constants) {
  const uValue = window.systemConstants?.AUX_U_Value_Piso || 2.7
  const deltaT = window.systemConstants?.deltaT_piso || 7.5
  const result = safeNumber(area) * uValue * deltaT
  console.log(`[DEBUG] calculateFloorGain: ${area} * ${uValue} * ${deltaT} = ${result}`)
  return result
}

function calculateLightingGain(area, constants) {
  const fatorIluminacao = window.systemConstants?.AUX_Fator_Iluminacao || 7
  const fsIluminacao = window.systemConstants?.AUX_Fs_Iluminacao || 1
  const result = safeNumber(area) * fatorIluminacao * fsIluminacao
  console.log(`[DEBUG] calculateLightingGain: ${area} * ${fatorIluminacao} * ${fsIluminacao} = ${result}`)
  return result
}

function calculateDissipationGain(dissipacao, constants) {
  const fatorConversao = window.systemConstants?.AUX_Fator_Conver_Painel || 1
  const fsPaineis = window.systemConstants?.AUX_Fs_Paineis || 100
  const result = (fatorConversao * safeNumber(dissipacao) * fsPaineis) / 100
  console.log(`[DEBUG] calculateDissipationGain: (${fatorConversao} * ${dissipacao} * ${fsPaineis}) / 100 = ${result}`)
  return result
}

function calculatePeopleGain(numPessoas, constants) {
  const csp = window.systemConstants?.AUX_OCp_Csp || 86.5
  const clp = window.systemConstants?.AUX_OCp_Clp || 133.3
  const fsPessoas = 100
  const pessoas = safeNumber(numPessoas)
  const ganhoSensivel = (csp * pessoas * fsPessoas) / 100
  const ganhoLatente = (clp * pessoas * fsPessoas) / 100
  const result = ganhoSensivel + ganhoLatente
  console.log(`[DEBUG] calculatePeopleGain: (${csp} * ${pessoas} * ${fsPessoas}/100) + (${clp} * ${pessoas} * ${fsPessoas}/100) = ${result}`)
  return result
}

function calculateExternalAirSensibleGain(vazaoArExterno, auxVars, constants) {
  console.log(`[DEBUG] calculateExternalAirSensibleGain INICIADO: vazao=${vazaoArExterno}, auxVars=`, auxVars);
  
  const c_ArExterno = window.systemConstants?.AUX_c_ArExterno || 0.24
  const deltaT_ArExterno = window.systemConstants?.AUX_deltaT_ArExterno || 10
  
  const calc_Gsens_ArE = auxVars.m_ArExterno * c_ArExterno * deltaT_ArExterno
  const resultado = (calc_Gsens_ArE / 1000) * 1.16
  
  console.log(`[DEBUG] calculateExternalAirSensibleGain: (${auxVars.m_ArExterno} * ${c_ArExterno} * ${deltaT_ArExterno}) / 1000 * 1.16 = ${resultado}`)
  return resultado
}

function calculateExternalAirLatentGain(vazaoArExterno, constants) {
  const f_ArExterno = window.systemConstants?.AUX_f_ArExterno || 3.01
  const deltaUa_ArExterno = window.systemConstants?.AUX_deltaUa_ArExterno || 8.47
  
  console.log(`[DEBUG] calculateExternalAirLatentGain INICIADO: vazao=${vazaoArExterno}, f=${f_ArExterno}, deltaUa=${deltaUa_ArExterno}`)
  
  const vazao = safeNumber(vazaoArExterno)
  const ganho = vazao * f_ArExterno * deltaUa_ArExterno
  
  console.log(`[DEBUG] calculateExternalAirLatentGain: ${vazao} * ${f_ArExterno} * ${deltaUa_ArExterno} = ${ganho}`)
  return ganho
}

function calculateTotals(gains) {
  console.log(`[DEBUG] calculateTotals INICIADO:`, gains)
  
  const totalExterno = gains.teto + gains.paredeOeste + gains.paredeLeste + gains.paredeNorte + gains.paredeSul
  const totalDivisoes = gains.divisoriaNaoClima1 + gains.divisoriaNaoClima2 + gains.divisoriaClima1 + gains.divisoriaClima2
  const totalPiso = gains.piso
  const totalIluminacao = gains.iluminacao
  const totalEquipamentos = gains.dissipacao
  const totalPessoas = gains.pessoas
  const totalArSensivel = gains.arSensivel
  const totalArLatente = gains.arLatente
  const totalArExterno = totalArSensivel + totalArLatente

  const totalGeralW = totalExterno + totalDivisoes + totalPiso + totalIluminacao + totalEquipamentos + totalPessoas + totalArExterno
  const totalGeralTR = totalGeralW / 3517

  const totals = {
    externo: Math.ceil(totalExterno),
    divisoes: Math.ceil(totalDivisoes),
    piso: Math.ceil(totalPiso),
    iluminacao: Math.ceil(totalIluminacao),
    equipamentos: Math.ceil(totalEquipamentos),
    pessoas: Math.ceil(totalPessoas),
    arSensivel: Math.ceil(totalArSensivel),
    arLatente: Math.ceil(totalArLatente),
    arExterno: Math.ceil(totalArExterno),
    geralW: Math.ceil(totalGeralW),
    geralTR: Math.ceil(totalGeralTR),
  }

  console.log(`[DEBUG] calculateTotals RESULTADO:`, totals)
  return totals
}

function debugThermalElements(roomId) {
  console.log(`[DEBUG] === VERIFICANDO ELEMENTOS PARA ${roomId} ===`);
  
  const elementsToCheck = [
    `area-teto-${roomId}`,
    `uvalue-teto-${roomId}`,
    `deltat-teto-${roomId}`,
    `ganho-teto-${roomId}`,
    `area-parede-oeste-${roomId}`,
    `uvalue-parede-oeste-${roomId}`,
    `deltat-parede-oeste-${roomId}`,
    `ganho-parede-oeste-${roomId}`,
    `total-externo-${roomId}`,
    `area-divi-nc1-${roomId}`,
    `uvalue-divi-nc1-${roomId}`,
    `deltat-divi-nc1-${roomId}`,
    `ganho-divi-nc1-${roomId}`,
    `total-divisoes-${roomId}`
  ];
  
  elementsToCheck.forEach(id => {
    const element = document.getElementById(id);
    console.log(`[DEBUG] ${id}:`, element ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    if (element) {
      console.log(`[DEBUG]   Conteúdo atual: "${element.textContent}"`);
    }
  });
  
  console.log(`[DEBUG] === FIM DA VERIFICAÇÃO ===`);
}
function updateThermalGainsDisplay(roomId, gains, totals, uValues, inputData) {
  console.log(`[DEBUG] updateThermalGainsDisplay INICIADO para ${roomId}`);
  console.log(`[DEBUG] gains recebidos:`, gains);
  console.log(`[DEBUG] totals recebidos:`, totals);
  console.log(`[DEBUG] uValues recebidos:`, uValues);
  console.log(`[DEBUG] inputData recebidos:`, inputData);
  
  // DEBUG: Verificar elementos antes de atualizar
  debugThermalElements(roomId);
  
  // Atualizar totais gerais
  updateElementText(`total-ganhos-w-${roomId}`, totals.geralW)
  updateElementText(`total-tr-${roomId}`, totals.geralTR)

  // Ganho de paredes e teto
  updateElementText(`area-teto-${roomId}`, Math.ceil(inputData.area || 0))
  updateElementText(`uvalue-teto-${roomId}`, uValues.teto.toFixed(3))
  updateElementText(`deltat-teto-${roomId}`, window.systemConstants?.deltaT_teto || 20)
  updateElementText(`ganho-teto-${roomId}`, Math.ceil(gains.teto))

  updateWallDisplay(roomId, "oeste", gains.paredeOeste, uValues.parede, inputData.paredeOeste, inputData.peDireito, window.systemConstants?.deltaT_parede_Oes || 0)
  updateWallDisplay(roomId, "leste", gains.paredeLeste, uValues.parede, inputData.paredeLeste, inputData.peDireito, window.systemConstants?.deltaT_parede_Les || 0)
  updateWallDisplay(roomId, "norte", gains.paredeNorte, uValues.parede, inputData.paredeNorte, inputData.peDireito, window.systemConstants?.deltaT_parede_Nor || 0)
  updateWallDisplay(roomId, "sul", gains.paredeSul, uValues.parede, inputData.paredeSul, inputData.peDireito, window.systemConstants?.deltaT_parede_Sul || 0)

  // Ganho por divisórias
  updatePartitionDisplay(roomId, "nc1", gains.divisoriaNaoClima1, uValues.parede, inputData.divisoriaNaoClima1, inputData.peDireito, window.systemConstants?.deltaT_divi_N_clim1 || 0)
  updatePartitionDisplay(roomId, "nc2", gains.divisoriaNaoClima2, uValues.parede, inputData.divisoriaNaoClima2, inputData.peDireito, window.systemConstants?.deltaT_divi_N_clim2 || 0)
  updatePartitionDisplay(roomId, "c1", gains.divisoriaClima1, uValues.parede, inputData.divisoriaClima1, inputData.peDireito, window.systemConstants?.deltaT_divi_clim1 || 0)
  updatePartitionDisplay(roomId, "c2", gains.divisoriaClima2, uValues.parede, inputData.divisoriaClima2, inputData.peDireito, window.systemConstants?.deltaT_divi_clim2 || 0)

  // Ganho por piso
  updateElementText(`area-piso-${roomId}`, Math.ceil(inputData.area || 0))
  updateElementText(`uvalue-piso-${roomId}`, uValues.piso.toFixed(3))
  updateElementText(`deltat-piso-${roomId}`, window.systemConstants?.deltaT_piso || 5)
  updateElementText(`ganho-piso-${roomId}`, Math.ceil(gains.piso))
  updateElementText(`total-piso-${roomId}`, totals.piso)

  // Ganho por iluminação
  updateElementText(`area-iluminacao-${roomId}`, Math.ceil(inputData.area || 0))
  updateElementText(`fator-iluminacao-${roomId}`, window.systemConstants?.AUX_Fator_Iluminacao || 7)
  updateElementText(`fs-iluminacao-${roomId}`, window.systemConstants?.AUX_Fs_Iluminacao || 1)
  updateElementText(`ganho-iluminacao-${roomId}`, Math.ceil(gains.iluminacao))
  updateElementText(`total-iluminacao-${roomId}`, totals.iluminacao)

  // Dissipação térmica interna
  updateElementText(`fator-conversao-dissi-${roomId}`, window.systemConstants?.AUX_Fator_Conver_Painel || 1)
  updateElementText(`pe-dissi-${roomId}`, inputData.dissipacao || 0)
  updateElementText(`fs-dissi-${roomId}`, window.systemConstants?.AUX_Fs_Paineis || 100)
  updateElementText(`ganho-dissi-${roomId}`, Math.ceil(gains.dissipacao))
  updateElementText(`total-dissi-${roomId}`, totals.equipamentos)

  // Ganhos por ocupação de pessoas
  updateElementText(`csp-pessoas-${roomId}`, window.systemConstants?.AUX_OCp_Csp || 86.5)
  updateElementText(`clp-pessoas-${roomId}`, window.systemConstants?.AUX_OCp_Clp || 133.3)
  updateElementText(`o-pessoas-${roomId}`, inputData.numPessoas || 0)
  updateElementText(`fs-pessoas-${roomId}`, 100)
  updateElementText(`ganho-pessoas-${roomId}`, Math.ceil(gains.pessoas))
  updateElementText(`total-pessoas-${roomId}`, totals.pessoas)

  // Ganho sensível de ar externo
  const densiAr = window.systemConstants?.Densi_ar || 1.17
  const m_ArExterno = (inputData.vazaoArExterno || 0) * 3.6 * densiAr * 1000

  //updateElementText(`vazao-ar-externo-${roomId}`, inputData.vazaoArExterno || 0)
  updateElementText(`m-ar-sensivel-${roomId}`, Math.ceil(m_ArExterno))
  updateElementText(`c-ar-sensivel-${roomId}`, window.systemConstants?.AUX_c_ArExterno || 0.24)
  updateElementText(`deltat-ar-sensivel-${roomId}`, window.systemConstants?.AUX_deltaT_ArExterno || 10)
  updateElementText(`ganho-ar-sensivel-${roomId}`, Math.ceil(gains.arSensivel))
  updateElementText(`total-ar-sensivel-${roomId}`, totals.arSensivel)


  
  updateElementText(`var-ar-latente-${roomId}`, inputData.vazaoArExterno || 0)
  updateElementText(`f-ar-latente-${roomId}`, window.systemConstants?.AUX_f_ArExterno || 3.01)
  updateElementText(`deltaua-ar-latente-${roomId}`, window.systemConstants?.AUX_deltaUa_ArExterno || 8.47)
  updateElementText(`ganho-ar-latente-${roomId}`, Math.ceil(gains.arLatente))
  updateElementText(`total-ar-latente-${roomId}`, totals.arLatente)

  // Totais
  updateElementText(`total-externo-${roomId}`, totals.externo)
  updateElementText(`total-divisoes-${roomId}`, totals.divisoes)
  console.log(`[DEBUG] updateThermalGainsDisplay FINALIZADO para ${roomId}`);

}

function updateWallDisplay(roomId, direction, gain, uValue, inputWidth, peDireito, deltaT) {
  const area = safeNumber(inputWidth) * safeNumber(peDireito)
  updateElementText(`area-parede-${direction}-${roomId}`, Math.ceil(area))
  updateElementText(`uvalue-parede-${direction}-${roomId}`, uValue.toFixed(3))
  updateElementText(`deltat-parede-${direction}-${roomId}`, deltaT || 0)
  updateElementText(`ganho-parede-${direction}-${roomId}`, Math.ceil(gain))
}

function updatePartitionDisplay(roomId, type, gain, uValue, inputArea, peDireito, deltaT) {
  const areaCalculada = safeNumber(inputArea) * safeNumber(peDireito)
  updateElementText(`area-divi-${type}-${roomId}`, Math.ceil(areaCalculada))
  updateElementText(`uvalue-divi-${type}-${roomId}`, uValue.toFixed(3))
  updateElementText(`deltat-divi-${type}-${roomId}`, deltaT || 0)
  updateElementText(`ganho-divi-${type}-${roomId}`, Math.ceil(gain))
}

function updateElementText(elementId, value) {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = value
  } else {
    console.warn(`[DEBUG] Elemento ${elementId} não encontrado`)
  }
}

export {
  calculateVazaoAr,
  waitForSystemConstants,
  validateSystemConstants,
  collectClimatizationInputs,
  computeAirFlowRate,
  calculateDoorFlow,
  updateFlowRateDisplay,
  calculateVazaoArAndThermalGains,
  calculateThermalGains,
  calculateUValues,
  calculateAuxiliaryVariables,
  calculateCeilingGain,
  calculateWallGain,
  calculatePartitionGain,
  calculateFloorGain,
  calculateLightingGain,
  calculateDissipationGain,
  calculatePeopleGain,
  calculateExternalAirSensibleGain,
  calculateExternalAirLatentGain,
  calculateTotals,
  updateThermalGainsDisplay,
  updateWallDisplay,
  updatePartitionDisplay,
  updateElementText,
  debugThermalElements
}


