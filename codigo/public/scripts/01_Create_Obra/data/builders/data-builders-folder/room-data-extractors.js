/*
 * ARQUIVO DE EXTRAÇÃO DE DADOS DE salas
 */

import { generateRoomId } from "../../utils/id-generator.js";
import { extractNumberFromText } from "../../utils/data-utils.js";
import { extractMachinesData } from "./machines-data-extractors.js";

/**
 * Extrai todos os dados de uma sala a partir do elemento HTML
 */
function extractRoomData(roomElement, projectElement) {
  if (!roomElement || !document.body.contains(roomElement)) {
    console.error(" Elemento da sala inválido ou removido do DOM");
    return null;
  }

  // Sincronizar título da sala
  const roomTitleElement = roomElement.querySelector(".room-title");
  if (roomTitleElement) {
    const currentTitle = roomTitleElement.textContent?.trim();
    const dataName = roomElement.dataset.roomName;

    if (currentTitle && currentTitle !== dataName) {
      console.log(
        ` Sincronizando sala: data-room-name "${dataName}" → "${currentTitle}"`,
      );
      roomElement.dataset.roomName = currentTitle;
    }
  }

  const roomId = roomElement.dataset.roomId;
  const roomName = roomElement.dataset.roomName;

  if (!roomId || !roomName) {
    console.error(" Sala sem ID ou nome válido:", { roomId, roomName });
    return null;
  }

  console.log(` Extraindo dados da sala: "${roomName}" (ID: ${roomId})`);

  const roomData = {
    id: roomId,
    nome: roomName,
    inputs: extractClimatizationInputs(roomElement),
    maquinas: extractMachinesData(roomElement),
    capacidade: extractCapacityData(roomElement),
    ventilacao: extractVentilacaoData(roomElement),
    ganhosTermicos: extractThermalGainsData(roomElement),
    acessorios: extractAcessoriosData(roomElement),
    dutos: extractDutosData(roomElement),
    tubulacao: extractTubulacaoData(roomElement),
  };

  console.log(` Dados extraídos da sala ${roomId}:`, {
    inputs: Object.keys(roomData.inputs).length,
    maquinas: roomData.maquinas.length,
    capacidade: Object.keys(roomData.capacidade).length,
    ganhosTermicos: Object.keys(roomData.ganhosTermicos).length,
    acessorios: roomData.acessorios.length,
    dutos: roomData.dutos.length,
    conjuntosTubulacao: roomData.tubulacao.conjuntos?.length || 0,
  });

  return roomData;
}

/**
 * Extrai inputs de climatização de uma sala
 */
function extractClimatizationInputs(roomElement) {
  const inputs = {};

  if (!roomElement?.dataset.roomId) {
    console.error(" Elemento da sala inválido para extração de inputs");
    return inputs;
  }

  // Extrair inputs de texto/number
  const textInputs = roomElement.querySelectorAll(
    '.clima-input[type="text"], .clima-input[type="number"], .clima-input[data-field]',
  );
  textInputs.forEach((input) => {
    const field = input.getAttribute("data-field");
    if (!field) return;

    let value = input.value;
    if (input.type === "number" && value !== "") {
      value = parseFloat(value) || 0;
    }

    if (value !== undefined && value !== "" && value !== null) {
      inputs[field] = value;
    }
  });

  // Extrair pressurização (radio buttons)
  const pressurizacaoRadios = roomElement.querySelectorAll(
    'input[name*="pressurizacao"][type="radio"]',
  );
  let pressurizacaoValue = false;

  pressurizacaoRadios.forEach((radio) => {
    if (radio.checked) pressurizacaoValue = radio.value === "sim";
  });

  inputs.pressurizacao = pressurizacaoValue;

  // Campos específicos da pressurização
  if (pressurizacaoValue) {
    const pressurizacaoInput = roomElement.querySelector(
      '.clima-input[data-field="pressurizacaoSetpoint"]',
    );
    const portasDuplasInput = roomElement.querySelector(
      '.clima-input[data-field="numPortasDuplas"]',
    );
    const portasSimplesInput = roomElement.querySelector(
      '.clima-input[data-field="numPortasSimples"]',
    );

    if (pressurizacaoInput)
      inputs.pressurizacaoSetpoint = parseFloat(pressurizacaoInput.value) || 25;
    if (portasDuplasInput)
      inputs.numPortasDuplas = parseFloat(portasDuplasInput.value) || 0;
    if (portasSimplesInput)
      inputs.numPortasSimples = parseFloat(portasSimplesInput.value) || 0;
  } else {
    inputs.pressurizacaoSetpoint = 0;
    inputs.numPortasDuplas = 0;
    inputs.numPortasSimples = 0;
  }

  // Extrair selects
  const selectInputs = roomElement.querySelectorAll(
    "select.clima-input[data-field]",
  );
  selectInputs.forEach((select) => {
    const field = select.getAttribute("data-field");
    if (!field || inputs[field] !== undefined) return;

    const value = select.value;
    if (value !== undefined && value !== "" && value !== null) {
      inputs[field] = value;
    }
  });

  console.log(
    ` Inputs de climatização coletados: ${Object.keys(inputs).length}`,
  );
  return inputs;
}

/**
 * Extrai dados de ganhos térmicos de uma sala
 */
function extractThermalGainsData(roomElement) {
  const gains = {};
  const roomId = roomElement.dataset.roomId;

  if (!roomId) {
    console.error(" ID da sala inválido para extração de ganhos térmicos");
    return gains;
  }

  const totalSelectors = {
    "total-ganhos-w": `#total-ganhos-w-${roomId}`,
    "total-tr-aprox": `#total-tr-aprox-${roomId}`,
    "total-tr-exato": `#total-tr-exato-${roomId}`,
    "total-externo": `#total-externo-${roomId}`,
    "total-divisoes": `#total-divisoes-${roomId}`,
    "total-piso": `#total-piso-${roomId}`,
    "total-iluminacao": `#total-iluminacao-${roomId}`,
    "total-dissi": `#total-dissi-${roomId}`,
    "total-pessoas": `#total-pessoas-${roomId}`,
    "total-ar-sensivel": `#total-ar-sensivel-${roomId}`,
    "total-ar-latente": `#total-ar-latente-${roomId}`,
  };

  Object.entries(totalSelectors).forEach(([key, selector]) => {
    try {
      const element = document.querySelector(selector);
      if (element) {
        let value = element.textContent || "";
        if (value && value.trim() !== "") {
          value = value.replace(/<[^>]*>/g, "").trim();
          const numericMatch = value.match(/-?\d+(?:[.,]\d+)?/);

          if (numericMatch) {
            const numericValue = parseFloat(numericMatch[0].replace(",", "."));
            gains[key] = isNaN(numericValue) ? 0 : numericValue;
          } else {
            gains[key] = 0;
          }
        } else {
          gains[key] = 0;
        }
      } else {
        gains[key] = 0;
      }
    } catch (error) {
      console.error(` Erro ao processar ${selector}:`, error);
      gains[key] = 0;
    }
  });

  console.log(` ${Object.keys(gains).length} ganhos térmicos coletados`);
  return gains;
}

/**
 * Extrai dados de capacidade de refrigeração de uma sala
 */
function extractCapacityData(roomElement) {
  const capacityData = {};
  const roomId = roomElement.dataset.roomId;

  if (!roomId) {
    console.error(" ID da sala inválido para extração de capacidade");
    return capacityData;
  }

  try {
    const specificSelectors = {
      fatorSeguranca: `#fator-seguranca-${roomId}`,
      capacidadeUnitaria: `#capacidade-unitaria-${roomId}`,
      solucao: `#solucao-${roomId}`,
      solucaoBackup: `#solucao-backup-${roomId}`,
      totalCapacidade: `#total-capacidade-${roomId}`,
      folga: `#folga-${roomId}`,
    };

    Object.entries(specificSelectors).forEach(([key, selector]) => {
      const element = roomElement.querySelector(selector);
      if (element) {
        let value;

        // Para selects e inputs, pega o value; para outros, textContent
        if (element.tagName === "SELECT" || element.tagName === "INPUT") {
          value = element.value;
        } else {
          value = element.textContent;
        }

        // Se for o campo folga, remove o símbolo de %
        if (key === "folga" && typeof value === "string") {
          value = value.replace("%", "");
        }

        // Tenta converter para número se for string numérica
        if (
          value &&
          typeof value === "string" &&
          !isNaN(value.replace(",", "."))
        ) {
          value = parseFloat(value.replace(",", "."));
        } else if (typeof value === "string" && value.trim() === "") {
          value = ""; // mantém vazio
        }

        capacityData[key] = value;
      }
    });

    const backupSelect = roomElement.querySelector(".backup-select");
    if (backupSelect) {
      capacityData.backup = backupSelect.value;
    }

    console.log(
      ` Dados de capacidade coletados: ${Object.keys(capacityData).length}`,
    );
    return capacityData;
  } catch (error) {
    console.error(
      ` Erro ao extrair dados de capacidade da sala ${roomId}:`,
      error,
    );
    return capacityData;
  }
}

/**
 * Extrai dados de ventilação da sala (apenas potência, temp interna e temp externa)
 * @param {HTMLElement} roomElement - Elemento da sala
 * @returns {Object} Dados de ventilação
 */
function extractVentilacaoData(roomElement) {
  const ventilacaoData = {};

  if (!roomElement?.dataset.roomId) {
    console.error(" Elemento da sala inválido para extração de ventilação");
    return ventilacaoData;
  }

  const roomId = roomElement.dataset.roomId;

  // Mapeamento dos campos de ventilação
  const fieldMappings = [
    { id: `potencia-${roomId}`, field: "potencia" },
    { id: `temp-interna-${roomId}`, field: "tempInterna" },
    { id: `temp-externa-${roomId}`, field: "tempExterna" },
  ];

  fieldMappings.forEach((mapping) => {
    const element = document.getElementById(mapping.id);
    if (element) {
      const value = element.value;
      if (value !== undefined && value !== "") {
        ventilacaoData[mapping.field] = parseFloat(value) || 0;
      }
    }
  });

  console.log(
    ` Dados de ventilação extraídos da sala ${roomId}:`,
    ventilacaoData,
  );
  return ventilacaoData;
}

/**
 * Extrai dados dos acessorios de uma sala
 */
function extractAcessoriosData(roomElement) {
  const acessorios = [];

  if (!roomElement?.dataset.roomId) {
    console.error(" Elemento da sala inválido para extração de acessorios");
    return acessorios;
  }

  const roomId = roomElement.dataset.roomId;

  // Buscar todos os acessorios na tabela
  const tbody = document.getElementById(`acessorios-list-${roomId}`);
  if (!tbody) {
    console.log(` Nenhum acessorio encontrado para sala ${roomId}`);
    return acessorios;
  }

  // Buscar todas as linhas de acessorios (exceto linha vazia)
  const acessorioRows = tbody.querySelectorAll(".acessorio-row");

  acessorioRows.forEach((row) => {
    try {
      const acessorioData = JSON.parse(row.getAttribute("data-acessorio"));
      acessorios.push(acessorioData);
    } catch (error) {
      console.error(" Erro ao extrair dados do acessorio:", error);
    }
  });

  console.log(
    ` ${acessorios.length} acessorio(s) extraído(s) da sala ${roomId}`,
  );
  return acessorios;
}

/**
 * Extrai dados dos dutos de uma sala
 */
function extractDutosData(roomElement) {
  const dutos = [];

  if (!roomElement?.dataset.roomId) {
    console.error(" Elemento da sala inválido para extração de dutos");
    return dutos;
  }

  const roomId = roomElement.dataset.roomId;

  // Buscar todos os dutos na tabela
  const tbody = document.getElementById(`dutos-list-${roomId}`);
  if (!tbody) {
    console.log(` Nenhum duto encontrado para sala ${roomId}`);
    return dutos;
  }

  // Buscar todas as linhas de dutos (exceto linha vazia)
  const dutoRows = tbody.querySelectorAll(".duto-row");

  dutoRows.forEach((row) => {
    try {
      const dutoData = JSON.parse(row.getAttribute("data-duto"));
      dutos.push(dutoData);
    } catch (error) {
      console.error(" Erro ao extrair dados do duto:", error);
    }
  });

  console.log(` ${dutos.length} duto(s) extraído(s) da sala ${roomId}`);
  return dutos;
}

function extractTubulacaoData(roomElement) {
  const resultado = {
    conjuntos: [],
    valorTotalGeralTubos: 0,
  };

  if (!roomElement?.dataset.roomId) {
    console.error(" Elemento da sala inválido para extração de tubulação");
    return resultado;
  }

  const roomId = roomElement.dataset.roomId;
  console.log(` Extraindo dados de tubulação para sala ${roomId}`);

  // Buscar todos os conjuntos de tubulação na sala
  const conjuntos = roomElement.querySelectorAll(
    `[data-conjunto-id^="${roomId}-"]`,
  );

  if (conjuntos.length === 0) {
    console.log(` Nenhum conjunto de tubulação encontrado para sala ${roomId}`);
    return resultado;
  }

  console.log(
    ` Encontrados ${conjuntos.length} conjunto(s) de tubulação na sala ${roomId}`,
  );

  conjuntos.forEach((conjuntoElement, index) => {
    const conjuntoId = conjuntoElement.getAttribute("data-conjunto-id");
    const conjuntoNum =
      conjuntoElement.getAttribute("data-conjunto-num") ||
      (index + 1).toString();

    // Obter quantidade do conjunto
    const quantidadeInput = document.getElementById(
      `tubulacao-quantidade-${conjuntoId}`,
    );
    const quantidade = quantidadeInput
      ? parseInt(quantidadeInput.value) || 1
      : 1;

    // Buscar totais do conjunto
    const totalLSmetros = document.getElementById(
      `total-ls-metros-${conjuntoId}`,
    );
    const totalLSkg = document.getElementById(`total-ls-kg-${conjuntoId}`);
    const totalLLmetros = document.getElementById(
      `total-ll-metros-${conjuntoId}`,
    );
    const totalLLkg = document.getElementById(`total-ll-kg-${conjuntoId}`);
    const totalCabos = document.getElementById(`total-cabos-${conjuntoId}`);
    const totalLuvas = document.getElementById(`total-luvas-${conjuntoId}`);
    const totalReducoes = document.getElementById(
      `total-reducoes-${conjuntoId}`,
    );
    const totalGeralKg = document.getElementById(
      `total-geral-kg-${conjuntoId}`,
    );
    const totalValor = document.getElementById(`total-valor-${conjuntoId}`);

    // Extrair valores numéricos dos totais
    const extrairNumero = (element) => {
      if (!element) return 0;
      const text = element.textContent || "0";
      return parseFloat(text.replace(",", ".")) || 0;
    };

    // Extrair valor monetário
    const extrairValor = (element) => {
      if (!element) return 0;
      const text = element.textContent || "R$ 0,00";
      const valor = parseFloat(text.replace("R$", "").replace(",", ".").trim());
      return isNaN(valor) ? 0 : valor;
    };

    const conjuntoData = {
      id: conjuntoId,
      numero: parseInt(conjuntoNum),
      quantidade: quantidade,
      cabos: Math.round(extrairNumero(totalCabos)),
      luvas: extrairNumero(totalLuvas),
      reducoes: Math.round(extrairNumero(totalReducoes)),
      totalLSmetros: extrairNumero(totalLSmetros),
      totalLSkg: extrairNumero(totalLSkg),
      totalLLmetros: extrairNumero(totalLLmetros),
      totalLLkg: extrairNumero(totalLLkg),
      totalKG: extrairNumero(totalGeralKg),
      valorTotal: extrairValor(totalValor),
      linhas: [],
    };

    // Adicionar ao valor total geral
    resultado.valorTotal += conjuntoData.valorTotal;

    // Buscar todas as linhas deste conjunto
    const tbody = document.getElementById(`tubos-list-${conjuntoId}`);
    if (tbody) {
      const linhas = tbody.querySelectorAll(".linha-tubulacao");

      linhas.forEach((row) => {
        try {
          const linhaData = JSON.parse(row.getAttribute("data-linha"));

          // Mapear para o formato desejado
          const linhaFormatada = {
            id: linhaData.id,
            tipo: linhaData.tipo,
            pol: linhaData.polegadas || "",
            expe: linhaData.espessura || "",
            compr: parseFloat(linhaData.comprimentoInterligacao || 0),
            numC: parseInt(linhaData.numCircuitos || 0),
            numCu: parseInt(linhaData.numCurvas || 0),
            Cee: parseFloat(linhaData.comprimentoEquivalenteCurva || 0),
            Lsm: parseFloat(linhaData.LSmetros || linhaData.LLmetros || 0),
            LSkg: parseFloat(linhaData.LSkg || linhaData.LLkg || 0),
            valorTotal: parseFloat(linhaData.valorTotal || 0),
          };

          conjuntoData.linhas.push(linhaFormatada);
        } catch (error) {
          console.error(" Erro ao extrair dados da linha:", error);
        }
      });
    }

    resultado.conjuntos.push(conjuntoData);
  });

  console.log(
    ` ${resultado.conjuntos.length} conjunto(s) de tubulação extraído(s) da sala ${roomId}`,
  );
  console.log(
    ` Valor total da tubulação: R$ ${resultado.valorTotal.toFixed(2)}`,
  );
  return resultado;
}

// Exporte todas as funções
export {
  extractRoomData,
  extractClimatizationInputs,
  extractThermalGainsData,
  extractCapacityData,
  extractVentilacaoData,
  extractAcessoriosData,
  extractDutosData,
  extractTubulacaoData,
};
