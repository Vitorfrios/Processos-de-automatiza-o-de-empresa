// climatizacao.js
import { calculateVazaoArAndThermalGains } from '../../calculos/calculos-manager.js'

/**
 * Constrói seção completa de climatização para uma sala específica
 * Organiza inputs de dados e resultados de cálculos térmicos de forma hierárquica
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @returns {string} HTML completo da seção de climatização
 */
function buildClimatizationSection(projectName, roomName) {
  const roomId = `${projectName}-${roomName}`
  return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}-clima')">+</button>
        <h4 class="section-title">Climatização</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}-clima">
        <div class="subsection-block">
          <div class="subsection-header">
            <button class="minimizer" onclick="toggleSubsection('${roomId}-clima-table')">+</button>
            <h5 class="subsection-title">Tabela de Inputs</h5>
          </div>
          <div class="subsection-content collapsed" id="subsection-content-${roomId}-clima-table">
            ${buildClimatizationTable(roomId)}
          </div>
        </div>
        ${buildThermalGainsSection(roomId)}
      </div>
    </div>
  `
}

// =============================================================================
// SEÇÃO: CONSTRUÇÃO DA INTERFACE DE INPUTS
// =============================================================================

/**
 * Constrói tabela completa de inputs para dados de climatização
 * Agrupa campos relacionados para melhor organização visual e usabilidade
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML da tabela de inputs de climatização
 */
function buildClimatizationTable(roomId) {
  return `
    <div class="clima-table">
      ${buildClimaRow(
    [
      { label: "Ambiente:", field: "ambiente", type: "text", placeholder: "Ex: Sala de Servidores" },
      { label: "Back-up:", field: "backup", type: "select", options: ["", "n", "n+1", "n+2"] },
    ],
    roomId,
  )}
      ${buildClimaRow(
    [
      { label: "Área (m²):", field: "area", type: "number", placeholder: "Ex: 50" },
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
      { label: "Parede Oeste (m):", field: "paredeOeste", type: "number", placeholder: "Ex: 5.5" },
      { label: "Parede Leste (m):", field: "paredeLeste", type: "number", placeholder: "Ex: 5.5" },
    ],
    roomId,
  )}
      ${buildClimaRow(
    [
      { label: "Parede Norte (m):", field: "paredeNorte", type: "number", placeholder: "Ex: 8.0" },
      { label: "Parede Sul (m):", field: "paredeSul", type: "number", placeholder: "Ex: 8.0" },
    ],
    roomId,
  )}
      ${buildClimaRow(
    [{ label: "Pé Direito (m):", field: "peDireito", type: "number", placeholder: "Ex: 3.0" }, null],
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
      { label: "Dissipação (W):", field: "dissipacao", type: "number", placeholder: "Ex: 5000" },
      { label: "N° Pessoas:", field: "numPessoas", type: "number", placeholder: "Ex: 10" },
    ],
    roomId,
  )}
      ${buildPressurizationRow(roomId)}
      ${buildResultRow(roomId)}
    </div>
  `
}

/**
 * Constrói linha específica para pressurização com lógica Sim/Não
 * Inclui campos condicionais que aparecem apenas quando pressurização é ativada
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML da linha de pressurização
 */
function buildPressurizationRow(roomId) {
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
                   onchange="togglePressurizationFields('${roomId}', true)">
            Sim
          </label>
          <label class="radio-label">
            <input type="radio" 
                   name="pressurizacao-${roomId}" 
                   value="nao" 
                   checked
                   onchange="togglePressurizationFields('${roomId}', false)">
            Não
          </label>
        </div>
        <input type="number"
          class="form-input clima-input"
          data-field="pressurizacao"
          data-room-id="${roomId}"
          placeholder="Ex: 25"
          value="25"
          step="1"
          disabled
          onchange="calculateVazaoArAndThermalGains('${roomId}')">
      

      </div>
      <!-- célula vazia p/ grid 2 colunas -->
      <div class="clima-cell">
        <label>Setpoint °C:</label>

        <input type="number"
               class="form-input clima-input"
               data-field="setpointPressurizacao"
               data-room-id="${roomId}"
               placeholder="Ex: 25"
               value="25"
               step="0.1"
               onchange="calculateVazaoArAndThermalGains('${roomId}')">
      </div>
    </div>

    <!-- Linha 3: portas (mostra somente se Sim) -->
    <div class="clima-row clima-row-2cols" id="pressurizacao-portas-${roomId}" style="display:none;">
      <div class="clima-cell">
        <label>N° Portas Simples:</label>
        <input type="number"
               class="form-input clima-input"
               data-field="numPortasSimples"
               data-room-id="${roomId}"
               placeholder="Ex: 3"
               min="0"
               disabled
               onchange="calculateVazaoArAndThermalGains('${roomId}')">
      </div>
      <div class="clima-cell">
        <label>N° Portas Duplas:</label>
        <input type="number"
               class="form-input clima-input"
               data-field="numPortasDuplas"
               data-room-id="${roomId}"
               placeholder="Ex: 2"
               min="0"
               disabled
               onchange="calculateVazaoArAndThermalGains('${roomId}')">
      </div>
    </div>
  `;
}

/**
 * Constrói linha da tabela com campos de input
 * Permite células vazias para layout flexível de formulário
 * @param {Array} fields - Array de definições de campos
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML da linha da tabela
 */
function buildClimaRow(fields, roomId) {
  const cells = fields
    .map((field) => {
      if (!field) return '<div class="clima-cell clima-cell-empty"></div>'
      return buildClimaCell(field, roomId)
    })
    .join("")

  return `<div class="clima-row">${cells}</div>`
}

/**
 * Constrói célula individual com label e campo de input
 * Define estrutura consistente para diferentes tipos de campos
 * @param {Object} field - Definição do campo (label, type, placeholder, etc)
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML da célula com campo de input
 */
function buildClimaCell(field, roomId) {
  const input = field.type === "select" ? buildSelectInput(field, roomId) : buildTextInput(field, roomId)

  return `
    <div class="clima-cell">
      <label>${field.label}</label>
      ${input}
    </div>
  `
}

/**
 * Constrói elemento select com opções pré-definidas
 * Inclui placeholder padrão para indicar seleção obrigatória
 * @param {Object} field - Definição do campo select
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML do elemento select
 */
function buildSelectInput(field, roomId) {
  const options = field.options
    .map((opt) => `<option value="${opt}">${opt === "" ? "Selecione" : opt}</option>`)
    .join("")

  return `
    <select class="form-input clima-input" data-field="${field.field}" onchange="calculateVazaoArAndThermalGains('${roomId}')">
      ${options}
    </select>
  `
}

/**
 * Constrói campo de input textual ou numérico
 * Aplica validações específicas baseadas no tipo de campo
 * @param {Object} field - Definição do campo de input
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML do campo de input
 */
function buildTextInput(field, roomId) {
  const step = field.type === "number" ? 'step="1"' : ""

  // Prevenir valores negativos para quantidades
  const min = field.field.includes("num") ? 'min="0"' : "" 
  const value = field.value ? `value="${field.value}"` : ""

  return `
    <input
      type="${field.type}"
      class="form-input clima-input"
      data-field="${field.field}"
      placeholder="${field.placeholder}"
      ${step}
      ${min}
      ${value}
      onchange="calculateVazaoArAndThermalGains('${roomId}')"
    >
  `
}

/**
 * Constrói linha de exibição de resultado calculado
 * Mostra vazão de ar externo como resultado primário dos cálculos
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML da linha de resultados
 */
function buildResultRow(roomId) {
  return `
    <div class="clima-row">
      <div class="clima-cell clima-cell-result">
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
  `
}

// =============================================================================
// FUNÇÕES DE CONTROLE DE PRESSURIZAÇÃO
// =============================================================================

/**
 * Controla a exibição e estado dos campos de pressurização
 * Habilita/desabilita campos baseado na seleção do usuário
 * @param {string} roomId - ID único da sala
 * @param {boolean} enabled - Se a pressurização está habilitada
 * @returns {void}
 */
function togglePressurizationFields(roomId, enabled) {
  const pressurizacaoInput = document.querySelector(`input[data-field="pressurizacao"][data-room-id="${roomId}"]`);
  const portasSection = document.getElementById(`pressurizacao-portas-${roomId}`);
  const portasSimples = document.querySelector(`input[data-field="numPortasSimples"][data-room-id="${roomId}"]`);
  const portasDuplas = document.querySelector(`input[data-field="numPortasDuplas"][data-room-id="${roomId}"]`);
  const setpointInput = document.querySelector(`input[data-field="setpointPressurizacao"][data-room-id="${roomId}"]`);

  if (enabled) {
    pressurizacaoInput.disabled = false;
    portasSection.style.display = 'grid';
    portasSimples.disabled = false;
    portasDuplas.disabled = false;
  } else {
    pressurizacaoInput.disabled = true;
    pressurizacaoInput.value = '25';

    portasSection.style.display = 'none';
    portasSimples.disabled = true; portasSimples.value = '';
    portasDuplas.disabled = true; portasDuplas.value = '';

    // mantém o setpoint coerente e o badge formatado
    if (setpointInput && setpointInput.value === '') setpointInput.value = '25';
    syncSetpointBadge(roomId, setpointInput ? setpointInput.value : '25');
  }

  calculateVazaoArAndThermalGains(roomId);
}

// =============================================================================
// SEÇÃO: CONSTRUÇÃO DA INTERFACE DE RESULTADOS TÉRMICOS
// =============================================================================

/**
 * Constrói seção completa de resultados de ganhos térmicos
 * Organiza dados calculados em tabelas categorizadas para análise detalhada
 * @param {string} roomId - ID único da sala
 * @returns {string} HTML completo da seção de ganhos térmicos
 */
function buildThermalGainsSection(roomId) {
  return `
    <div class="subsection-block">
      <div class="subsection-header">
        <button class="minimizer" onclick="toggleSubsection('${roomId}-ganhos')">+</button>
        <h5 class="subsection-title">Cálculo de Ganhos Térmicos</h5>
      </div>
      <div class="subsection-content collapsed" id="subsection-content-${roomId}-ganhos">
        <!-- Conteúdo dos ganhos térmicos -->
        <div class="thermal-summary">
          <div class="thermal-summary-item">
            <span class="thermal-summary-label">Total de Ganhos Térmicos:</span>
            <span class="thermal-summary-value" id="total-ganhos-w-${roomId}">0</span>
            <span class="thermal-summary-unit">W</span>
          </div>
          <div class="thermal-summary-item">
            <span class="thermal-summary-label">Total em TR:</span>
            <span class="thermal-summary-value" id="total-tr-${roomId}">0</span>
            <span class="thermal-summary-unit">TR</span>
          </div>
        </div>
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
  `
}

// Exportar a nova função para controle global
window.togglePressurizationFields = togglePressurizationFields

export {
  buildClimatizationSection,
  buildClimatizationTable,
  buildClimaRow,
  buildClimaCell,
  buildSelectInput,
  buildTextInput,
  buildResultRow,
  buildThermalGainsSection,
  buildPressurizationRow,
  togglePressurizationFields
}