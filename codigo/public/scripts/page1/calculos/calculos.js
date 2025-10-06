import { 
  CALCULATION_CONSTANTS
} from '../config/config.js'

async function waitForSystemConstants() {
  let attempts = 0;
  const maxAttempts = 100; // Aumentei para dar mais tempo
  
  while ((!window.systemConstants || !window.systemConstants.VARIAVEL_PD) && attempts < maxAttempts) {
    console.log("[v0] Aguardando constantes do sistema...", attempts);
    await new Promise((resolve) => setTimeout(resolve, 200)); // Aumentei o intervalo
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
  
  if (!window.systemConstants.VARIAVEL_PD) {
    console.error("[v0] VARIAVEL_PD não encontrada:", window.systemConstants.VARIAVEL_PD);
    return false;
  }
  
  if (!window.systemConstants.VARIAVEL_PS) {
    console.error("[v0] VARIAVEL_PS não encontrada:", window.systemConstants.VARIAVEL_PS);
    return false;
  }
  
  console.log("[v0] Constantes validadas com sucesso");
  return true;
}

function collectClimatizationInputs(climaSection, roomId) {
  const inputs = climaSection.querySelectorAll(".clima-input")
  const data = {}

  inputs.forEach((input) => {
    const field = input.dataset.field
    let value = input.value
    
    // Converter para número se for campo numérico
    if (input.type === 'number' || input.tagName === 'SELECT') {
      value = value !== "" ? Number.parseFloat(value) || 0 : 0
    }
    
    data[field] = value
  })

  // Garantir valores padrão para campos obrigatórios
  const requiredFields = ['peDireito', 'numPortasDuplas', 'numPortasSimples', 'pressurizacao'];
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      data[field] = 0;
    }
  });

  console.log("[v0] Dados coletados para cálculo:", data)
  return data
}

function computeAirFlowRate(inputData) {
  const { numPortasDuplas = 0, numPortasSimples = 0, pressurizacao = 0 } = inputData

  console.log("[v0] ===== CÁLCULO DE VAZÃO =====")
  console.log("[v0] Portas Duplas:", numPortasDuplas)
  console.log("[v0] Portas Simples:", numPortasSimples)
  console.log("[v0] Pressurização (Pa):", pressurizacao)

  // Obter constantes do sistema
  console.log("[v0] Constantes do sistema:", window.systemConstants)

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
  // Garantir que todos os valores são números válidos
  const count = Number(doorCount) || 0
  const variable = Number(doorVariable) || 0
  const press = Number(pressure) || 0
  
  console.log(`[v0] calculateDoorFlow: count=${count}, variable=${variable}, pressure=${press}`)
  
  // Verificar se pressure é maior que 0 para evitar NaN
  const pressureExponent = press > 0 ? Math.pow(press, CALCULATION_CONSTANTS.PRESSURE_EXPONENT) : 0
  
  const flow = CALCULATION_CONSTANTS.FLOW_COEFFICIENT *
    count *
    variable *
    pressureExponent *
    CALCULATION_CONSTANTS.SECONDS_PER_HOUR
    
  console.log(`[v0] Fluxo calculado: ${flow}`)
  return flow
}

async function calculateVazaoAr(roomId) {
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
  }
}

async function calculateVazaoArAndThermalGains(roomId) {
  const flowRate = await calculateVazaoAr(roomId)
  await calculateThermalGains(roomId, flowRate)
}

async function calculateThermalGains(roomId, vazaoArExterno = 0) {
  await waitForSystemConstants()

  if (!validateSystemConstants()) return

  const roomContent = document.getElementById(`room-content-${roomId}`)
  if (!roomContent) return

  const climaSection = roomContent.querySelector('[id*="-clima"]')
  if (!climaSection) return

  const inputData = collectClimatizationInputs(climaSection, roomId)
  inputData.vazaoArExterno = vazaoArExterno

  console.log("[v0] ===== CÁLCULO DE GANHOS TÉRMICOS =====")
  console.log("[v0] Dados de entrada:", inputData)
  console.log("[v0] Vazão de ar externo:", vazaoArExterno)

  const uValues = calculateUValues(inputData.tipoConstrucao)
  const auxVars = calculateAuxiliaryVariables(inputData)

  const gains = {
    teto: calculateCeilingGain(inputData.area, uValues.teto, systemConstants.deltaT_teto),
    paredeOeste: calculateWallGain(
      inputData.paredeOeste,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_parede_Oes,
    ),
    paredeLeste: calculateWallGain(
      inputData.paredeLeste,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_parede_Les,
    ),
    paredeNorte: calculateWallGain(
      inputData.paredeNorte,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_parede_Nor,
    ),
    paredeSul: calculateWallGain(
      inputData.paredeSul,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_parede_Sul,
    ),
    divisoriaNaoClima1: calculatePartitionGain(
      inputData.divisoriaNaoClima1,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_divi_N_clim1,
    ),
    divisoriaNaoClima2: calculatePartitionGain(
      inputData.divisoriaNaoClima2,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_divi_N_clim2,
    ),
    divisoriaClima1: calculatePartitionGain(
      inputData.divisoriaClima1,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_divi_clim1,
    ),
    divisoriaClima2: calculatePartitionGain(
      inputData.divisoriaClima2,
      inputData.peDireito,
      uValues.parede,
      systemConstants.deltaT_divi_clim2,
    ),
    piso: calculateFloorGain(inputData.area, systemConstants),
    iluminacao: calculateLightingGain(inputData.area, systemConstants),
    dissipacao: calculateDissipationGain(inputData.dissipacao, systemConstants),
    pessoas: calculatePeopleGain(inputData.numPessoas, systemConstants),
    arSensivel: calculateExternalAirSensibleGain(inputData.vazaoArExterno || 0, auxVars, systemConstants),
    arLatente: calculateExternalAirLatentGain(inputData.vazaoArExterno || 0, systemConstants),
  }

  const totals = calculateTotals(gains)

  console.log("[v0] Ganhos calculados:", gains)
  console.log("[v0] Totais:", totals)
  console.log("[v0] ===== FIM DO CÁLCULO DE GANHOS TÉRMICOS =====")

  updateThermalGainsDisplay(roomId, gains, totals, uValues, inputData)
}

function calculateUValues(tipoConstrucao) {
  const constants = systemConstants.get();
  const U_VALUE_ALVENARIA_TETO = 3.961
  const U_VALUE_ALVENARIA_PAREDE = 2.546
  const U_VALUE_LA_ROCHA_TETO = 1.145
  const U_VALUE_LA_ROCHA_PAREDE = 1.12

  let uValueParede, uValueTeto

  if (tipoConstrucao === "eletrocentro") {
    uValueParede = U_VALUE_LA_ROCHA_PAREDE
    uValueTeto = U_VALUE_LA_ROCHA_TETO
  } else if (tipoConstrucao === "alvenaria") {
    uValueParede = U_VALUE_ALVENARIA_PAREDE
    uValueTeto = U_VALUE_ALVENARIA_TETO
  } else {
    console.error("[v0] Tipo de construção inválido:", tipoConstrucao)
    uValueParede = 0
    uValueTeto = 0
  }

  return {
    parede: uValueParede,
    teto: uValueTeto,
    piso: constants?.AUX_U_Value_Piso || 2.7,
  }
}

function calculateAuxiliaryVariables(inputData) {
  const vazaoArExterno = inputData.vazaoArExterno || 0
  const densiAr = systemConstants.Densi_ar || 1.17
  const m_ArExterno = vazaoArExterno * 3.6 * densiAr * 1000

  return {
    m_ArExterno: m_ArExterno,
  }
}

function calculateCeilingGain(area, uValue, deltaT) {
  return (area || 0) * uValue * deltaT
}

function calculateWallGain(comprimento, peDireito, uValue, deltaT) {
  const area = (comprimento || 0) * (peDireito || 0)
  return area * uValue * deltaT
}

function calculatePartitionGain(inputArea, peDireito, uValue, deltaT) {
  const area = (inputArea || 0) * (peDireito || 0)
  return area * uValue * deltaT
}

function calculateFloorGain(area, constants) {
  const uValue = constants.AUX_U_Value_Piso || 2.7
  const deltaT = constants.deltaT_piso || 7.5
  return (area || 0) * uValue * deltaT
}

function calculateLightingGain(area, constants) {
  const fatorIluminacao = constants.AUX_Fator_Iluminacao || 7
  const fsIluminacao = constants.AUX_Fs_Iluminacao || 1
  return (area || 0) * fatorIluminacao * fsIluminacao
}

function calculateDissipationGain(dissipacao, constants) {
  const fatorConversao = constants.AUX_Fator_Conver_Painel || 1
  const fsPaineis = constants.AUX_Fs_Paineis || 100
  return (fatorConversao * (dissipacao || 0) * fsPaineis) / 100
}

function calculatePeopleGain(numPessoas, constants) {
  const csp = constants.AUX_OCp_Csp || 86.5
  const clp = constants.AUX_OCp_Clp || 133.3
  const fsPessoas = 100
  const pessoas = numPessoas || 0
  const ganhoSensivel = (csp * pessoas * fsPessoas) / 100
  const ganhoLatente = (clp * pessoas * fsPessoas) / 100
  return ganhoSensivel + ganhoLatente
}

function calculateExternalAirSensibleGain(vazaoArExterno, auxVars, constants) {
  const c_ArExterno = constants.AUX_c_ArExterno || 0.24
  const deltaT_ArExterno = constants.AUX_deltaT_ArExterno || 10
  const calc_Gsens_ArE = auxVars.m_ArExterno * c_ArExterno * deltaT_ArExterno
  return (calc_Gsens_ArE / 1000) * 1.16
}

function calculateExternalAirLatentGain(vazaoArExterno, constants) {
  const f_ArExterno = constants.AUX_f_ArExterno || 3.01
  const deltaUa_ArExterno = constants.AUX_deltaUa_ArExterno || 8.47
  return (vazaoArExterno || 0) * f_ArExterno * deltaUa_ArExterno
}

function calculateTotals(gains) {
  const totalExterno = gains.teto + gains.paredeOeste + gains.paredeLeste + gains.paredeNorte + gains.paredeSul
  const totalDivisoes =
    gains.divisoriaNaoClima1 + gains.divisoriaNaoClima2 + gains.divisoriaClima1 + gains.divisoriaClima2
  const totalPiso = gains.piso
  const totalIluminacao = gains.iluminacao
  const totalEquipamentos = gains.dissipacao
  const totalPessoas = gains.pessoas
  const totalArSensivel = gains.arSensivel
  const totalArLatente = gains.arLatente
  const totalArExterno = totalArSensivel + totalArLatente

  const totalGeralW =
    totalExterno + totalDivisoes + totalPiso + totalIluminacao + totalEquipamentos + totalPessoas + totalArExterno

  const totalGeralTR = totalGeralW / 3517

  return {
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
}

function updateThermalGainsDisplay(roomId, gains, totals, uValues, inputData) {
  updateElementText(`total-ganhos-w-${roomId}`, totals.geralW)
  updateElementText(`total-tr-${roomId}`, totals.geralTR)

  updateElementText(`area-teto-${roomId}`, Math.ceil(inputData.area || 0))
  updateElementText(`uvalue-teto-${roomId}`, uValues.teto.toFixed(3))
  updateElementText(`deltat-teto-${roomId}`, systemConstants.deltaT_teto || 20)
  updateElementText(`ganho-teto-${roomId}`, Math.ceil(gains.teto))

  updateWallDisplay(
    roomId,
    "oeste",
    gains.paredeOeste,
    uValues.parede,
    inputData.paredeOeste,
    inputData.peDireito,
    systemConstants.deltaT_parede_Oes,
  )

  updateWallDisplay(
    roomId,
    "leste",
    gains.paredeLeste,
    uValues.parede,
    inputData.paredeLeste,
    inputData.peDireito,
    systemConstants.deltaT_parede_Les,
  )

  updateWallDisplay(
    roomId,
    "norte",
    gains.paredeNorte,
    uValues.parede,
    inputData.paredeNorte,
    inputData.peDireito,
    systemConstants.deltaT_parede_Nor,
  )

  updateWallDisplay(
    roomId,
    "sul",
    gains.paredeSul,
    uValues.parede,
    inputData.paredeSul,
    inputData.peDireito,
    systemConstants.deltaT_parede_Sul,
  )

  updatePartitionDisplay(
    roomId,
    "nc1",
    gains.divisoriaNaoClima1,
    uValues.parede,
    inputData.divisoriaNaoClima1,
    inputData.peDireito,
    systemConstants.deltaT_divi_N_clim1,
  )

  updatePartitionDisplay(
    roomId,
    "nc2",
    gains.divisoriaNaoClima2,
    uValues.parede,
    inputData.divisoriaNaoClima2,
    inputData.peDireito,
    systemConstants.deltaT_divi_N_clim2,
  )

  updatePartitionDisplay(
    roomId,
    "c1",
    gains.divisoriaClima1,
    uValues.parede,
    inputData.divisoriaClima1,
    inputData.peDireito,
    systemConstants.deltaT_divi_clim1,
  )

  updatePartitionDisplay(
    roomId,
    "c2",
    gains.divisoriaClima2,
    uValues.parede,
    inputData.divisoriaClima2,
    inputData.peDireito,
    systemConstants.deltaT_divi_clim2,
  )

  updateElementText(`area-piso-${roomId}`, Math.ceil(inputData.area || 0))
  updateElementText(`uvalue-piso-${roomId}`, uValues.piso.toFixed(3))
  updateElementText(`deltat-piso-${roomId}`, systemConstants.deltaT_piso || 5)
  updateElementText(`ganho-piso-${roomId}`, Math.ceil(gains.piso))
  updateElementText(`total-piso-${roomId}`, totals.piso)

  updateElementText(`area-iluminacao-${roomId}`, Math.ceil(inputData.area || 0))
  updateElementText(`fator-iluminacao-${roomId}`, systemConstants.AUX_Fator_Iluminacao || 7)
  updateElementText(`fs-iluminacao-${roomId}`, systemConstants.AUX_Fs_Iluminacao || 1)
  updateElementText(`ganho-iluminacao-${roomId}`, Math.ceil(gains.iluminacao))
  updateElementText(`total-iluminacao-${roomId}`, totals.iluminacao)

  updateElementText(`fator-conversao-dissi-${roomId}`, systemConstants.AUX_Fator_Conver_Painel || 1)
  updateElementText(`pe-dissi-${roomId}`, inputData.dissipacao || 0)
  updateElementText(`fs-dissi-${roomId}`, systemConstants.AUX_Fs_Paineis || 100)
  updateElementText(`ganho-dissi-${roomId}`, Math.ceil(gains.dissipacao))
  updateElementText(`total-dissi-${roomId}`, totals.equipamentos)

  updateElementText(`csp-pessoas-${roomId}`, systemConstants.AUX_OCp_Csp || 86.5)
  updateElementText(`clp-pessoas-${roomId}`, systemConstants.AUX_OCp_Clp || 133.3)
  updateElementText(`o-pessoas-${roomId}`, inputData.numPessoas || 0)
  updateElementText(`fs-pessoas-${roomId}`, 100)
  updateElementText(`ganho-pessoas-${roomId}`, Math.ceil(gains.pessoas))
  updateElementText(`total-pessoas-${roomId}`, totals.pessoas)

  const vazaoArExterno = inputData.vazaoArExterno || 0
  const densiAr = systemConstants.Densi_ar || 1.17
  const m_ArExterno = vazaoArExterno * 3.6 * densiAr * 1000

  updateElementText(`vazao-ar-externo-${roomId}`, vazaoArExterno)
  updateElementText(`m-ar-sensivel-${roomId}`, Math.ceil(m_ArExterno))
  updateElementText(`c-ar-sensivel-${roomId}`, systemConstants.AUX_c_ArExterno || 0.24)
  updateElementText(`deltat-ar-sensivel-${roomId}`, systemConstants.AUX_deltaT_ArExterno || 10)
  updateElementText(`ganho-ar-sensivel-${roomId}`, Math.ceil(gains.arSensivel))
  updateElementText(`total-ar-sensivel-${roomId}`, totals.arSensivel)

  updateElementText(`var-ar-latente-${roomId}`, vazaoArExterno)
  updateElementText(`f-ar-latente-${roomId}`, systemConstants.AUX_f_ArExterno || 3.01)
  updateElementText(`deltaua-ar-latente-${roomId}`, systemConstants.AUX_deltaUa_ArExterno || 8.47)
  updateElementText(`ganho-ar-latente-${roomId}`, Math.ceil(gains.arLatente))
  updateElementText(`total-ar-latente-${roomId}`, totals.arLatente)

  updateElementText(`total-externo-${roomId}`, totals.externo)
  updateElementText(`total-divisoes-${roomId}`, totals.divisoes)
}

function updateWallDisplay(roomId, direction, gain, uValue, inputWidth, peDireito, deltaT) {
  const area = (inputWidth || 0) * (peDireito || 0)
  updateElementText(`area-parede-${direction}-${roomId}`, Math.ceil(area))
  updateElementText(`uvalue-parede-${direction}-${roomId}`, uValue.toFixed(3))
  updateElementText(`deltat-parede-${direction}-${roomId}`, deltaT || 0)
  updateElementText(`ganho-parede-${direction}-${roomId}`, Math.ceil(gain))
}

function updatePartitionDisplay(roomId, type, gain, uValue, inputArea, peDireito, deltaT) {
  const areaCalculada = (inputArea || 0) * (peDireito || 0)
  updateElementText(`area-divi-${type}-${roomId}`, Math.ceil(areaCalculada))
  updateElementText(`uvalue-divi-${type}-${roomId}`, uValue.toFixed(3))
  updateElementText(`deltat-divi-${type}-${roomId}`, deltaT || 0)
  updateElementText(`ganho-divi-${type}-${roomId}`, Math.ceil(gain))
}

function updateElementText(elementId, value) {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = value
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
  updateElementText
}