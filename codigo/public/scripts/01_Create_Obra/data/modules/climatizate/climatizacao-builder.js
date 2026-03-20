// data/modules/climatizacao/climatizacao-builder.js
// FUNÇÕES DE CONSTRUÇÃO HTML

import { calculateVazaoArAndThermalGains } from "../../../features/calculations/air-flow.js";
import { buildCapacityCalculationTable } from "../machines/capacity-calculator.js";
import { isClientMode } from "../../../core/config.js";

/**
 * Constrói seção completa de climatização para uma sala específica
 */
function buildClimatizationSection(obraId, projectId, roomName, finalRoomId) {
  // Validar ID único da sala
  if (!finalRoomId || finalRoomId === "undefined" || finalRoomId === "null") {
    console.error(
      `ERRO FALBACK (buildClimatizationSection) [Room ID inválido: ${finalRoomId}]`,
    );
    return "";
  }

  const roomId = finalRoomId;
  console.log(
    ` Construindo seção de climatização para sala: ${roomName} (ID: ${roomId})`,
  );

  return `
 <div class="section-block">
 <div class="section-header">
 <button class="minimizer" onclick="toggleSection('${roomId}-clima')">+</button>
 <h4 class="section-title">Climatização</h4>
 </div>
 <div class="section-content collapsed" id="section-content-${roomId}-clima">
 ${buildThermalGainsSection(roomId)}
 ${buildThermalSummaryRow(roomId)}
 ${buildCapacityCalculationTable(finalRoomId)}
 </div>
 </div>
 `;
}

/**
 * Constrói seção da tabela de inputs de climatização
 */
function buildTableSection(roomId, roomName = "Sala") {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildTableSection) [Room ID inválido: ${roomId}]`,
    );
    return "";
  }

  return `
 <div class="section-block">
 <div class="section-header">
 <button class="minimizer" onclick="toggleSection('${roomId}-input-table')">+</button>
 <h5 class="section-title">Tabela de Inputs</h5>
 </div>
 <div class="section-content collapsed" id="section-content-${roomId}-input-table">
 ${buildClimatizationTable(roomId, roomName)}
 </div>
 </div>
 `;
}

/**
 * Constrói tabela completa de inputs para dados de climatização
 */
function buildClimatizationTable(roomId, roomName = "Sala") {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildClimatizationTable) [Room ID inválido: ${roomId}]`,
    );
    return "";
  }

  console.log(` Construindo tabela de climatização para sala ID: ${roomId}`);

  return `
 <div class="clima-table">
 ${buildClimaRow(
   [
     {
       label: "Ambiente:",
       field: "ambiente",
       type: "text",
       placeholder: roomName,
       value: roomName,
     },
     {
       label: "Back-up:",
       field: "backup",
       type: "select",
       options: ["", "n", "n+1", "n+2"],
     },
   ],
   roomId,
 )}
 ${buildClimaRow(
   [
     {
       label: "Pé Direito (m):",
       field: "peDireito",
       type: "number",
       placeholder: "Ex: 3.0",
       value: "3.0",
       step: "0.1",
     },
     {
       label: "Tipo de Construção:",
       field: "tipoConstrucao",
       type: "select",
       options: ["", "Alvenaria", "Eletrocentro"],
     },
   ],
   roomId,
 )}
 ${buildClimaRow(
   [
     {
       label: "Parede Oeste (m):",
       field: "paredeOeste",
       type: "number",
       placeholder: "Ex: 5.5",
     },
     {
       label: "Parede Leste (m):",
       field: "paredeLeste",
       type: "number",
       placeholder: "Ex: 5.5",
     },
   ],
   roomId,
 )}
 ${buildClimaRow(
   [
     {
       label: "Parede Norte (m):",
       field: "paredeNorte",
       type: "number",
       placeholder: "Ex: 8.0",
     },
     {
       label: "Parede Sul (m):",
       field: "paredeSul",
       type: "number",
       placeholder: "Ex: 8.0",
     },
   ],
   roomId,
 )}
 ${buildClimaRow(
   [
     {
       label: "Área (m²):",
       field: "area",
       type: "number",
       placeholder: "Calculado automaticamente",
       value: "0",
       step: "1",
     },
     {
       label: "Volume (m³):",
       field: "volume",
       type: "number",
       value: "0",
       step: "1",
       id: `volume-${roomId}`,
     },
   ],
   roomId,
 )}
 ${buildClimaRow(
   [
     {
       label: "Divisória Área Não Climatizada 1 (m²):",
       field: "divisoriaNaoClima1",
       type: "number",
       placeholder: "Ex: 10",
     },
     {
       label: "Divisória Área Não Climatizada 2 (m²):",
       field: "divisoriaNaoClima2",
       type: "number",
       placeholder: "Ex: 10",
     },
   ],
   roomId,
 )}
 ${buildClimaRow(
   [
     {
       label: "Divisória Área Climatizada 1 (m²):",
       field: "divisoriaClima1",
       type: "number",
       placeholder: "Ex: 15",
     },
     {
       label: "Divisória Área Climatizada 2 (m²):",
       field: "divisoriaClima2",
       type: "number",
       placeholder: "Ex: 15",
     },
   ],
   roomId,
 )}
 ${buildClimaRow(
   [
     {
       label: "Dissipação (W):",
       field: "dissipacao",
       type: "number",
       placeholder: "Ex: 5000",
     },
     {
       label: "N° Pessoas:",
       field: "numPessoas",
       type: "number",
       placeholder: "Ex: 10",
       value: "1",
       min: "1",
     },
   ],
   roomId,
 )}
 ${buildPressurizationRow(roomId)}
 ${buildResultRow(roomId)}
 </div>
 `;
}

/**
 * Constrói linha específica para pressurização
 */
function buildPressurizationRow(roomId) {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildPressurizationRow) [Room ID inválido: ${roomId}]`,
    );
    return "";
  }

  return `
 <!-- Linha 1: rádios -->
 <div class="clima-row clima-row-2cols">
 <div class="clima-cell">
 <div class="radio-group">
 <label>Pressurização (TR):</label>
 <label class="radio-label">
 <input type="radio" 
 name="pressurizacao-${roomId}" 
 value="sim"
 checked
 onchange="togglePressurizationFields('${roomId}', true)">
 Sim
 </label>
 <label class="radio-label">
 <input type="radio" 
 name="pressurizacao-${roomId}" 
 value="nao" 
 onchange="togglePressurizationFields('${roomId}', false)">
 Não
 </label>
 </div>
 <input type="number"
 class="form-input clima-input"
 data-field="pressurizacaoSetpoint"
 data-room-id="${roomId}"
 placeholder="Ex: 25"
 value="25"
 step="5" 
 onchange="calculateVazaoArAndThermalGains('${roomId}')">
 </div>
 <!-- célula vazia p/ grid 2 colunas -->
 <div class="clima-cell">
 <label>Setpoint °C:</label>
 <input type="number"
 class="form-input clima-input"
 data-field="setpointTemp"
 data-room-id="${roomId}"
 placeholder="Ex: 25"
 value="25"
 step="0.5" 
 onchange="calculateVazaoArAndThermalGains('${roomId}')">
 </div>
 </div>

 <!-- Linha 3: portas (mostra por padrão porque "Sim" está marcado) -->
 <div class="clima-row clima-row-2cols" id="pressurizacao-portas-${roomId}">
 <div class="clima-cell">
 <label>N° Portas Duplas:</label>
 <input type="number"
 class="form-input clima-input"
 data-field="numPortasDuplas"
 data-room-id="${roomId}"
 placeholder="Ex: 2"
 min="0"
 onchange="calculateVazaoArAndThermalGains('${roomId}')">
 </div>
 
 <div class="clima-cell">
 <label>N° Portas Simples:</label>
 <input type="number"
 class="form-input clima-input"
 data-field="numPortasSimples"
 data-room-id="${roomId}"
 placeholder="Ex: 3"
 min="0"
 onchange="calculateVazaoArAndThermalGains('${roomId}')">
 </div>
 </div>
 `;
}

/**
 * Constrói linha da tabela com campos de input
 */
function buildClimaRow(fields, roomId) {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(`ERRO FALBACK (buildClimaRow) [Room ID inválido: ${roomId}]`);
    return '<div class="clima-row"><div class="clima-cell">Erro: ID inválido</div></div>';
  }

  const cells = fields
    .map((field) => {
      if (!field) return '<div class="clima-cell clima-cell-empty"></div>';
      return buildClimaCell(field, roomId);
    })
    .join("");

  return `<div class="clima-row">${cells}</div>`;
}

/**
 * Constrói célula individual com label e campo de input
 */
function buildClimaCell(field, roomId) {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildClimaCell) [Room ID inválido: ${roomId}]`,
    );
    return '<div class="clima-cell">Erro: ID inválido</div>';
  }

  const input =
    field.type === "select"
      ? buildSelectInput(field, roomId)
      : buildTextInput(field, roomId);

  return `
 <div class="clima-cell">
 <label>${field.label}</label>
 ${input}
 </div>
 `;
}

/**
 * Constrói elemento select com opções pré-definidas
 */
function buildSelectInput(field, roomId) {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildSelectInput) [Room ID inválido: ${roomId}]`,
    );
    return '<select class="form-input clima-input" disabled><option>Erro: ID inválido</option></select>';
  }

  const options = field.options
    .map(
      (opt) =>
        `<option value="${opt}">${opt === "" ? "Selecione" : opt}</option>`,
    )
    .join("");

  // MODIFICAÇÃO: Para campo backup, usar função específica que evita loop
  const onChangeHandler =
    field.field === "backup"
      ? `handleClimaBackupChange('${roomId}', this.value)`
      : `calculateVazaoArAndThermalGains('${roomId}')`;

  return `
 <select class="form-input clima-input" data-field="${field.field}" onchange="${onChangeHandler}">
 ${options}
 </select>
 `;
}

/**
 * Constrói campo de input textual ou numérico
 */
function buildTextInput(field, roomId) {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildTextInput) [Room ID inválido: ${roomId}]`,
    );
    return '<input type="text" class="form-input clima-input" disabled placeholder="Erro: ID inválido">';
  }

  // Suportar step customizado
  const step = field.step
    ? `step="${field.step}"`
    : field.type === "number"
      ? 'step="1"'
      : "";
  const min = field.min
    ? `min="${field.min}"`
    : field.field && field.field.includes("num")
      ? 'min="0"'
      : "";
  const value = field.value ? `value="${field.value}"` : "";
  const id = field.id ? `id="${field.id}"` : "";
  const readonly = field.readonly ? "readonly" : "";

  // Determinar eventos onchange
  let onInputEvents = "";

  // Para campo de volume, não adicionar eventos de cálculo
  if (field.field === "volume") {
    onInputEvents = "";
  }
  // Para campo de pé direito, adicionar evento específico para atualizar volume
  else if (field.field === "peDireito") {
    onInputEvents = `onchange="updateRoomVolume(this); calculateVazaoArAndThermalGains('${roomId}')" oninput="updateRoomVolume(this)"`;
  }
  // Para campo de área, adicionar evento para atualizar volume
  else if (field.field === "area") {
    onInputEvents = `onchange="updateRoomVolumeFromArea(this); calculateVazaoArAndThermalGains('${roomId}')"`;
  } else if (field.field && field.type !== "text") {
    onInputEvents = `onchange="calculateVazaoArAndThermalGains('${roomId}')"`;
  }

  // Sincronização para paredes e recálculo automático da área
  if (field.field && field.field.includes("parede")) {
    onInputEvents =
      `onchange="if(window.updateRoomAreaFromWalls) window.updateRoomAreaFromWalls('${roomId}'); calculateVazaoArAndThermalGains('${roomId}')"` +
      ` oninput="if(window.handleWallInputSync) window.handleWallInputSync('${roomId}', '${field.field}', this.value); if(window.updateRoomAreaFromWalls) window.updateRoomAreaFromWalls('${roomId}')"`;
  }

  // Sincronização para campo ambiente
  if (field.field === "ambiente") {
    onInputEvents += ` oninput="if(window.syncAmbienteToTitle) window.syncAmbienteToTitle('${roomId}', this.value)"`;
  }

  return `
 <input
 type="${field.type}"
 class="form-input clima-input"
 data-field="${field.field || ""}"
 data-room-id="${roomId}"
 placeholder="${field.placeholder || ""}"
 ${step}
 ${min}
 ${value}
 ${id}
 ${readonly}
 ${onInputEvents}
 >
 `;
}

/**
 * Constrói linha de resumo dos ganhos térmicos
 */
function buildThermalSummaryRow(roomId) {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildThermalSummaryRow) [Room ID inválido: ${roomId}]`,
    );
    return '<div class="clima-row"><div class="clima-cell">Erro: ID inválido</div></div>';
  }

  return `
 <div class="clima-row">
 <div class="thermal-summary">
 <div class="thermal-summary-item">
 <span class="thermal-summary-label">Total de Ganhos Térmicos:</span>
 <span class="thermal-summary-value" id="total-ganhos-w-${roomId}">0</span>
 <span class="thermal-summary-unit">W</span>
 </div>
 <div class="thermal-summary-item">
 <span class="thermal-summary-label">Total em TR Aproximado:</span>
 <span class="thermal-summary-value" id="total-tr-aprox-${roomId}">0</span>
 <span class="thermal-summary-unit">TR</span>
 </div>
 <div class="thermal-summary-item-noaprox">
 <span class="thermal-summary-label">Total em TR:</span>
 <span class="thermal-summary-value" id="total-tr-exato-${roomId}">0</span>
 <span class="thermal-summary-unit">TR</span>
 </div>
 </div>
 </div>
 `;
}

/**
 * Constrói linha de exibição de resultado calculado
 */
function buildResultRow(roomId) {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildResultRow) [Room ID inválido: ${roomId}]`,
    );
    return '<div class="clima-row"><div class="clima-cell">Erro: ID inválido</div></div>';
  }

  return `
 <div class="clima-row">
 <div class="clima-cell clima-cell-result client-hidden">
 <label>Vazão de Ar Externo (l/s):</label>
 <div class="result-value-inline" id="vazao-ar-${roomId}">0</div>
 </div>
 <div class="clima-cell">
 <label>Combate a Incêndio:</label>
 <select class="form-input clima-input" data-field="combateIncendio" onchange="calculateVazaoArAndThermalGains('${roomId}')">
 <option value="">Selecione</option>
 <option value="manual">Manual</option>
 <option value="fm200">FM200</option>
 <option value="novec">Novec</option>
 <option value="firepro">FirePro</option>
 <option value="ni">NI</option>
 </select>
 </div>
 </div>
 `;
}

// =============================================================================
// SEÇÃO: CONSTRUÇÃO DA INTERFACE DE RESULTADOS TÉRMICOS
// =============================================================================

/**
 * Constrói seção completa de resultados de ganhos térmicos
 */
function buildThermalGainsSection(roomId) {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (buildThermalGainsSection) climatizacao.js [Room ID inválido: ${roomId}]`,
    );
    return "";
  }

  if (isClientMode()) {
    return "";
  }

  console.log(` Construindo seção de ganhos térmicos para sala ID: ${roomId}`);

  return `
 <div class="subsection-block">
 <div class="subsection-header">
 <button class="minimizer" onclick="toggleSubsection('${roomId}-ganhos')">+</button>
 <h5 class="subsection-title">Cálculo de Ganhos Térmicos</h5>
 </div>
 <div class="subsection-content collapsed" id="subsection-content-${roomId}-ganhos">
 <!-- Tabela de Paredes Externas e Teto -->
 <div class="thermal-table-container">
 <h6 class="thermal-table-title">Ganhos por Paredes Externas e Teto</h6>
 <table class="thermal-table">
 <thead>
 <tr>
 <th>Elemento</th>
 <th>Área (m²)</th>
 <th>U-Value</th>
 <th>ΔT (°C)</th>
 <th>Ganho (W)</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td>Teto</td>
 <td id="area-teto-${roomId}">0</td>
 <td id="uvalue-teto-${roomId}">0</td>
 <td id="deltat-teto-${roomId}">0</td>
 <td id="ganho-teto-${roomId}">0</td>
 </tr>
 <tr>
 <td>Parede Oeste</td>
 <td id="area-parede-oeste-${roomId}">0</td>
 <td id="uvalue-parede-oeste-${roomId}">0</td>
 <td id="deltat-parede-oeste-${roomId}">0</td>
 <td id="ganho-parede-oeste-${roomId}">0</td>
 </tr>
 <tr>
 <td>Parede Leste</td>
 <td id="area-parede-leste-${roomId}">0</td>
 <td id="uvalue-parede-leste-${roomId}">0</td>
 <td id="deltat-parede-leste-${roomId}">0</td>
 <td id="ganho-parede-leste-${roomId}">0</td>
 </tr>
 <tr>
 <td>Parede Norte</td>
 <td id="area-parede-norte-${roomId}">0</td>
 <td id="uvalue-parede-norte-${roomId}">0</td>
 <td id="deltat-parede-norte-${roomId}">0</td>
 <td id="ganho-parede-norte-${roomId}">0</td>
 </tr>
 <tr>
 <td>Parede Sul</td>
 <td id="area-parede-sul-${roomId}">0</td>
 <td id="uvalue-parede-sul-${roomId}">0</td>
 <td id="deltat-parede-sul-${roomId}">0</td>
 <td id="ganho-parede-sul-${roomId}">0</td>
 </tr>
 <tr class="thermal-table-total">
 <td colspan="4">Total Paredes Externas e Teto</td>
 <td id="total-externo-${roomId}">0</td>
 </tr>
 </tbody>
 </table>
 </div>

 <!-- Tabela de Divisórias -->
 <div class="thermal-table-container">
 <h6 class="thermal-table-title">Ganhos por Divisórias</h6>
 <table class="thermal-table">
 <thead>
 <tr>
 <th>Tipo</th>
 <th>Área (m²)</th>
 <th>U-Value</th>
 <th>ΔT (°C)</th>
 <th>Ganho (W)</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td>Divisória Não Climatizada 1</td>
 <td id="area-divi-nc1-${roomId}">0</td>
 <td id="uvalue-divi-nc1-${roomId}">0</td>
 <td id="deltat-divi-nc1-${roomId}">0</td>
 <td id="ganho-divi-nc1-${roomId}">0</td>
 </tr>
 <tr>
 <td>Divisória Não Climatizada 2</td>
 <td id="area-divi-nc2-${roomId}">0</td>
 <td id="uvalue-divi-nc2-${roomId}">0</td>
 <td id="deltat-divi-nc2-${roomId}">0</td>
 <td id="ganho-divi-nc2-${roomId}">0</td>
 </tr>
 <tr>
 <td>Divisória Climatizada 1</td>
 <td id="area-divi-c1-${roomId}">0</td>
 <td id="uvalue-divi-c1-${roomId}">0</td>
 <td id="deltat-divi-c1-${roomId}">0</td>
 <td id="ganho-divi-c1-${roomId}">0</td>
 </tr>
 <tr>
 <td>Divisória Climatizada 2</td>
 <td id="area-divi-c2-${roomId}">0</td>
 <td id="uvalue-divi-c2-${roomId}">0</td>
 <td id="deltat-divi-c2-${roomId}">0</td>
 <td id="ganho-divi-c2-${roomId}">0</td>
 </tr>
 <tr class="thermal-table-total">
 <td colspan="4">Total Divisórias</td>
 <td id="total-divisoes-${roomId}">0</td>
 </tr>
 </tbody>
 </table>
 </div>

 <!-- Tabela de Piso -->
 <div class="thermal-table-container">
 <h6 class="thermal-table-title">Ganhos por Piso</h6>
 <table class="thermal-table">
 <thead>
 <tr>
 <th>Elemento</th>
 <th>Área (m²)</th>
 <th>U-Value</th>
 <th>ΔT (°C)</th>
 <th>Ganho (W)</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td>Piso</td>
 <td id="area-piso-${roomId}">0</td>
 <td id="uvalue-piso-${roomId}">0</td>
 <td id="deltat-piso-${roomId}">0</td>
 <td id="ganho-piso-${roomId}">0</td>
 </tr>
 <tr class="thermal-table-total">
 <td colspan="4">Total Piso</td>
 <td id="total-piso-${roomId}">0</td>
 </tr>
 </tbody>
 </table>
 </div>

 <!-- Tabela de Iluminação -->
 <div class="thermal-table-container">
 <h6 class="thermal-table-title">Ganhos por Iluminação</h6>
 <table class="thermal-table">
 <thead>
 <tr>
 <th>Elemento</th>
 <th>Área (m²)</th>
 <th>Fator</th>
 <th>Fs</th>
 <th>Ganho (W)</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td>Iluminação</td>
 <td id="area-iluminacao-${roomId}">0</td>
 <td id="fator-iluminacao-${roomId}">0</td>
 <td id="fs-iluminacao-${roomId}">0</td>
 <td id="ganho-iluminacao-${roomId}">0</td>
 </tr>
 <tr class="thermal-table-total">
 <td colspan="4">Total Iluminação</td>
 <td id="total-iluminacao-${roomId}">0</td>
 </tr>
 </tbody>
 </table>
 </div>

 <!-- Tabela de Dissipação Térmica Interna -->
 <div class="thermal-table-container">
 <h6 class="thermal-table-title">Dissipação Térmica Interna</h6>
 <table class="thermal-table">
 <thead>
 <tr>
 <th>Elemento</th>
 <th>Fator Conversão</th>
 <th>Pe (W)</th>
 <th>Fs (%)</th>
 <th>Ganho (W)</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td>Equipamentos</td>
 <td id="fator-conversao-dissi-${roomId}">0</td>
 <td id="pe-dissi-${roomId}">0</td>
 <td id="fs-dissi-${roomId}">0</td>
 <td id="ganho-dissi-${roomId}">0</td>
 </tr>
 <tr class="thermal-table-total">
 <td colspan="4">Total Equipamentos</td>
 <td id="total-dissi-${roomId}">0</td>
 </tr>
 </tbody>
 </table>
 </div>

 <!-- Tabela de Ocupação de Pessoas -->
 <div class="thermal-table-container">
 <h6 class="thermal-table-title">Ganhos por Ocupação de Pessoas</h6>
 <table class="thermal-table">
 <thead>
 <tr>
 <th>Elemento</th>
 <th>Csp</th>
 <th>Clp</th>
 <th>O</th>
 <th>Fs (%)</th>
 <th>Ganho (W)</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td>Pessoas</td>
 <td id="csp-pessoas-${roomId}">0</td>
 <td id="clp-pessoas-${roomId}">0</td>
 <td id="o-pessoas-${roomId}">0</td>
 <td id="fs-pessoas-${roomId}">0</td>
 <td id="ganho-pessoas-${roomId}">0</td>
 </tr>
 <tr class="thermal-table-total">
 <td colspan="5">Total Pessoas</td>
 <td id="total-pessoas-${roomId}">0</td>
 </tr>
 </tbody>
 </table>
 </div>

 <!-- Tabela de Ar Externo Sensível -->
 <div class="thermal-table-container">
 <h6 class="thermal-table-title">Ganhos de Ar Externo - Sensível</h6>
 <table class="thermal-table">
 <thead>
 <tr>
 <th>Elemento</th>
 <th>m</th>
 <th>c</th>
 <th>ΔT (°C)</th>
 <th>Ganho (W)</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td>Ar Externo Sensível</td>
 <td id="m-ar-sensivel-${roomId}">0</td>
 <td id="c-ar-sensivel-${roomId}">0</td>
 <td id="deltat-ar-sensivel-${roomId}">0</td>
 <td id="ganho-ar-sensivel-${roomId}">0</td>
 </tr>
 <tr class="thermal-table-total">
 <td colspan="4">Total Ar Externo Sensível</td>
 <td id="total-ar-sensivel-${roomId}">0</td>
 </tr>
 </tbody>
 </table>
 </div>

 <!-- Tabela de Ar Externo Latente -->
 <div class="thermal-table-container">
 <h6 class="thermal-table-title">Ganhos de Ar Externo - Latente</h6>
 <table class="thermal-table">
 <thead>
 <tr>
 <th>Elemento</th>
 <th>Var</th>
 <th>f</th>
 <th>ΔUa</th>
 <th>Ganho (W)</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td>Ar Externo Latente</td>
 <td id="var-ar-latente-${roomId}">0</td>
 <td id="f-ar-latente-${roomId}">0</td>
 <td id="deltaua-ar-latente-${roomId}">0</td>
 <td id="ganho-ar-latente-${roomId}">0</td>
 </tr>
 <tr class="thermal-table-total">
 <td colspan="4">Total Ar Externo Latente</td>
 <td id="total-ar-latente-${roomId}">0</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>
 `;
}

// =============================================================================
// SEÇÃO: FUNÇÕES DE CÁLCULO DE VOLUME
// =============================================================================

/**
 * Atualiza o campo de volume baseado na área e pé direito
 * @param {HTMLElement} inputElement - Elemento do input de pé direito
 */
function updateRoomVolume(inputElement) {
  // Obter o roomId do elemento
  const roomId = inputElement.dataset.roomId;
  if (!roomId) return;

  // Obter o valor do pé direito
  const peDireito = parseFloat(inputElement.value) || 0;

  // Obter o valor da área
  const areaInput = document.querySelector(
    `input[data-field="area"][data-room-id="${roomId}"]`,
  );
  const area = areaInput ? parseFloat(areaInput.value) || 0 : 0;

  // Calcular volume
  const volume = area * peDireito;

  // Atualizar campo de volume
  const volumeInput = document.querySelector(
    `input[data-field="volume"][data-room-id="${roomId}"]`,
  );
  if (volumeInput) {
    volumeInput.value = volume.toFixed(2);
  }
}

function getWallInputValue(roomId, fieldName) {
  const input = document.querySelector(
    `input[data-field="${fieldName}"][data-room-id="${roomId}"]`,
  );
  return input ? parseFloat(input.value) || 0 : 0;
}

function calculateAverageDimension(values) {
  const validValues = values.filter(
    (value) => Number.isFinite(value) && value > 0,
  );
  if (validValues.length === 0) return 0;

  const total = validValues.reduce((sum, value) => sum + value, 0);
  return total / validValues.length;
}

function calculateRoomAreaFromWalls(roomId) {
  if (!roomId) return 0;

  const mediaOesteLeste = calculateAverageDimension([
    getWallInputValue(roomId, "paredeOeste"),
    getWallInputValue(roomId, "paredeLeste"),
  ]);

  const mediaNorteSul = calculateAverageDimension([
    getWallInputValue(roomId, "paredeNorte"),
    getWallInputValue(roomId, "paredeSul"),
  ]);

  return mediaOesteLeste * mediaNorteSul;
}

function updateRoomAreaFromWalls(roomIdOrInput) {
  const roomId =
    typeof roomIdOrInput === "string"
      ? roomIdOrInput
      : roomIdOrInput?.dataset?.roomId;

  if (!roomId) return 0;

  const area = calculateRoomAreaFromWalls(roomId);
  const areaInput = document.querySelector(
    `input[data-field="area"][data-room-id="${roomId}"]`,
  );

  if (areaInput) {
    areaInput.value = area.toFixed(2);
    updateRoomVolumeFromArea(areaInput);
  }

  return area;
}

/**
 * Atualiza o volume quando a área é modificada
 * @param {HTMLElement} inputElement - Elemento do input de área
 */
function updateRoomVolumeFromArea(inputElement) {
  const roomId = inputElement.dataset.roomId;
  if (!roomId) return;

  const peDireitoInput = document.querySelector(
    `input[data-field="peDireito"][data-room-id="${roomId}"]`,
  );
  if (peDireitoInput) {
    updateRoomVolume(peDireitoInput);
  }
}

/**
 * Inicializa os listeners para atualização automática do volume
 * @param {string} roomId - ID da sala
 */
function initVolumeListeners(roomId) {
  if (!roomId) return;

  // Listener para mudanças na área
  const areaInput = document.querySelector(
    `input[data-field="area"][data-room-id="${roomId}"]`,
  );
  if (areaInput) {
    // Remover listener anterior se existir
    areaInput.removeEventListener("change", handleAreaChange);
    areaInput.removeEventListener("input", handleAreaChange);

    // Adicionar listener
    areaInput.addEventListener("change", function () {
      updateRoomVolumeFromArea(this);
    });
  }

  // Listener para mudanças no pé direito
  const peDireitoInput = document.querySelector(
    `input[data-field="peDireito"][data-room-id="${roomId}"]`,
  );
  if (peDireitoInput) {
    // Remover listener anterior se existir
    peDireitoInput.removeEventListener("input", handlePeDireitoInput);
    peDireitoInput.removeEventListener("change", handlePeDireitoChange);

    // Adicionar listener
    peDireitoInput.addEventListener("input", function () {
      updateRoomVolume(this);
    });
    peDireitoInput.addEventListener("change", function () {
      updateRoomVolume(this);
    });
  }
}

// Handlers auxiliares para remoção de listeners
function handleAreaChange(e) {
  updateRoomVolumeFromArea(e.target);
}

function handlePeDireitoInput(e) {
  updateRoomVolume(e.target);
}

function handlePeDireitoChange(e) {
  updateRoomVolume(e.target);
}

/**
 * Controla a exibição e estado dos campos de pressurização
 */
function togglePressurizationFields(roomId, enabled) {
  // Validar ID único
  if (!roomId || roomId === "undefined" || roomId === "null") {
    console.error(
      `ERRO FALBACK (togglePressurizationFields) [Room ID inválido: ${roomId}]`,
    );
    return;
  }

  const pressurizacaoInput = document.querySelector(
    `input[data-field="pressurizacaoSetpoint"][data-room-id="${roomId}"]`,
  );
  const portasSection = document.getElementById(
    `pressurizacao-portas-${roomId}`,
  );
  const portasSimples = document.querySelector(
    `input[data-field="numPortasSimples"][data-room-id="${roomId}"]`,
  );
  const portasDuplas = document.querySelector(
    `input[data-field="numPortasDuplas"][data-room-id="${roomId}"]`,
  );
  const setpointInput = document.querySelector(
    `input[data-field="setpointTemp"][data-room-id="${roomId}"]`,
  );

  if (enabled) {
    pressurizacaoInput.disabled = false;
    portasSection.style.display = "grid";
    portasSimples.disabled = false;
    portasDuplas.disabled = false;
  } else {
    pressurizacaoInput.disabled = true;
    pressurizacaoInput.value = "25";

    portasSection.style.display = "none";
    portasSimples.disabled = true;
    portasSimples.value = "";
    portasDuplas.disabled = true;
    portasDuplas.value = "";

    // mantém o setpoint coerente e o badge formatado
    if (setpointInput && setpointInput.value === "") setpointInput.value = "25";
  }

  calculateVazaoArAndThermalGains(roomId);
}

// Exportar funções de construção
export {
  buildClimatizationSection,
  buildTableSection,
  buildClimatizationTable,
  buildClimaRow,
  buildClimaCell,
  buildSelectInput,
  buildTextInput,
  buildResultRow,
  buildThermalGainsSection,
  buildPressurizationRow,
  togglePressurizationFields,
  calculateRoomAreaFromWalls,
  updateRoomAreaFromWalls,
  updateRoomVolume,
  updateRoomVolumeFromArea,
  initVolumeListeners,
};

((window.calculateRoomAreaFromWalls = calculateRoomAreaFromWalls),
  (window.updateRoomAreaFromWalls = updateRoomAreaFromWalls),
  (window.updateRoomVolume = updateRoomVolume),
  (window.updateRoomVolumeFromArea = updateRoomVolumeFromArea),
  (window.initVolumeListeners = initVolumeListeners));
