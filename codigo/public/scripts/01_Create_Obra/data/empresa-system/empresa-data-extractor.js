// empresa-data-extractor.js
/**
 * EMPRESA-DATA-EXTRACTOR.JS - Extração e Processamento de Dados de Empresa
 * Responsabilidade: Extrair dados do DOM, preparar para salvamento, cálculos
 */

import { calcularNumeroLocal } from "./empresa-ui-helpers.js";

/* ==== SEÇÃO 1: EXTRAÇÃO DE DADOS DO DOM ==== */

/**
 * Extrai dados de empresa cadastrados inline
 */
function extractEmpresaData(obraElement) {
  const empresaData = {};

  if (!obraElement) {
    console.error(" Elemento da obra é nulo para extração de empresa");
    return empresaData;
  }

  console.log(
    " [EXTRACT EMPRESA] INICIANDO extração para obra:",
    obraElement.dataset.obraId,
  );

  const camposEmpresa = [
    "empresaSigla",
    "empresaNome",
    "numeroClienteFinal",
    "clienteFinal",
    "codigoCliente",
    "emailEmpresa",
    "dataCadastro",
    "orcamentistaResponsavel",
    "idGerado",
  ];

  console.log(
    " [EXTRACT EMPRESA] FASE 1 - Buscando nos INPUTS ATUAIS do formulário...",
  );

  const formEmpresa = obraElement.querySelector(".empresa-formulario-ativo");
  if (formEmpresa) {
    console.log(
      " [EXTRACT EMPRESA] Formulário ativo encontrado, extraindo dados atuais...",
    );

    // PRIORIDADE 1: Buscar dados do autocomplete (são os mais confiáveis)
    const empresaInput = formEmpresa.querySelector(".empresa-input-cadastro");
    if (empresaInput && empresaInput.dataset.siglaSelecionada) {
      console.log(" [EXTRACT EMPRESA] Dados do autocomplete encontrados:", {
        sigla: empresaInput.dataset.siglaSelecionada,
        nome: empresaInput.dataset.nomeSelecionado,
      });

      empresaData.empresaSigla = empresaInput.dataset.siglaSelecionada;
      empresaData.empresaNome = empresaInput.dataset.nomeSelecionado || "";
    }

    // PRIORIDADE 2: Buscar nos campos de empresa (caso autocomplete não tenha dados)
    if (!empresaData.empresaSigla || !empresaData.empresaNome) {
      console.log(" [EXTRACT EMPRESA] Buscando em campos de input...");

      // Buscar em todos os campos de empresa possíveis
      const empresaInputs = [
        ...formEmpresa.querySelectorAll(
          ".empresa-input-cadastro, .empresa-input-readonly",
        ),
      ];

      for (const input of empresaInputs) {
        if (input && input.value && input.value.trim() !== "") {
          const valor = input.value.trim();
          console.log(
            ` [EXTRACT EMPRESA] Campo empresa encontrado: "${valor}"`,
          );

          // Verificar se está no formato "SIGLA - Nome"
          if (valor.includes(" - ")) {
            const partes = valor.split(" - ");
            if (!empresaData.empresaSigla)
              empresaData.empresaSigla = partes[0].trim();
            if (!empresaData.empresaNome)
              empresaData.empresaNome = partes.slice(1).join(" - ").trim();
            console.log(
              ` [EXTRACT EMPRESA] Empresa extraída do formato combinado: ${empresaData.empresaSigla} - ${empresaData.empresaNome}`,
            );
          } else {
            // Se não tem hífen, verificar se é sigla ou nome
            if (!empresaData.empresaSigla && valor.length <= 10) {
              // Se for curto, assume que é sigla
              empresaData.empresaSigla = valor;
              console.log(
                ` [EXTRACT EMPRESA] Sigla identificada: ${empresaData.empresaSigla}`,
              );
            } else if (!empresaData.empresaNome) {
              // Se for mais longo, assume que é nome
              empresaData.empresaNome = valor;
              console.log(
                ` [EXTRACT EMPRESA] Nome identificado: ${empresaData.empresaNome}`,
              );
            }
          }
          break;
        }
      }
    }

    // BUSCAR CAMPOS SEPARADOS ESPECÍFICOS (se existirem campos dedicados)
    console.log(" [EXTRACT EMPRESA] Buscando campos específicos...");

    // Mapeamento dos outros campos
    const mapeamentoCampos = {
      // Campos de empresa separados (caso existam)
      "empresa-sigla-input": ["empresaSigla"],
      "empresa-nome-input": ["empresaNome"],

      // Outros campos
      "numero-cliente-final-cadastro": ["numeroClienteFinal"],
      "cliente-final-cadastro": ["clienteFinal"],
      "codigo-cliente-cadastro": ["codigoCliente"],
      "email-empresa-cadastro": ["emailEmpresa"],
      "data-cadastro-cadastro": ["dataCadastro"],
      "orcamentista-responsavel-cadastro": ["orcamentistaResponsavel"],

      // Inputs de visualização/readonly
      "numero-cliente-final-readonly": ["numeroClienteFinal"],
      "cliente-final-input": ["clienteFinal"],
      "codigo-cliente-input": ["codigoCliente"],
      "email-empresa-input": ["emailEmpresa"],
      "data-cadastro-readonly": ["dataCadastro"],
      "orcamentista-responsavel-input": ["orcamentistaResponsavel"],
    };

    Object.entries(mapeamentoCampos).forEach(([inputClass, camposAlvo]) => {
      const input = formEmpresa.querySelector(`.${inputClass}`);

      if (input && input.value && input.value.trim() !== "") {
        let valor = input.value.trim();
        console.log(
          ` [EXTRACT EMPRESA] Input ${inputClass} encontrado: "${valor}"`,
        );

        camposAlvo.forEach((campo) => {
          if (!empresaData[campo]) {
            // Só preenche se ainda não tem valor
            if (campo === "numeroClienteFinal") {
              empresaData[campo] = parseInt(valor) || 0;
              console.log(
                ` [EXTRACT EMPRESA] ${campo} convertido para número: ${empresaData[campo]}`,
              );
            } else if (campo === "empresaSigla" && valor.includes(" - ")) {
              // Extrair só a sigla do formato "SIGLA - Nome"
              const partes = valor.split(" - ");
              empresaData.empresaSigla = partes[0].trim();
              console.log(
                ` [EXTRACT EMPRESA] Sigla extraída de campo combinado: ${empresaData.empresaSigla}`,
              );
            } else if (campo === "empresaNome" && valor.includes(" - ")) {
              // Extrair só o nome do formato "SIGLA - Nome"
              const partes = valor.split(" - ");
              empresaData.empresaNome = partes.slice(1).join(" - ").trim();
              console.log(
                ` [EXTRACT EMPRESA] Nome extraído de campo combinado: ${empresaData.empresaNome}`,
              );
            } else {
              empresaData[campo] = valor;
            }
          }
        });
      }
    });
  } else {
    console.log(" [EXTRACT EMPRESA] Formulário ativo não encontrado");
  }

  // FASE 2: Buscar nos data attributes os campos que ainda estão faltando
  console.log(
    " [EXTRACT EMPRESA] FASE 2 - Buscando campos faltantes nos data attributes...",
  );

  const camposFaltantes = camposEmpresa.filter((campo) => !empresaData[campo]);
  console.log(
    ` [EXTRACT EMPRESA] Campos ainda faltantes: ${camposFaltantes.join(", ")}`,
  );

  camposFaltantes.forEach((campo) => {
    const valorDataAttr =
      campo === "emailEmpresa"
        ? obraElement.dataset.emailEmpresa || obraElement.dataset.empresaEmail
        : obraElement.dataset[campo];
    if (
      valorDataAttr !== undefined &&
      valorDataAttr !== null &&
      valorDataAttr !== ""
    ) {
      console.log(
        ` [EXTRACT EMPRESA] Data-attribute ${campo}: "${valorDataAttr}"`,
      );

      if (campo === "numeroClienteFinal") {
        empresaData[campo] = parseInt(valorDataAttr) || 0;
      } else if (campo === "empresaSigla") {
        // Extrair sigla do data-attribute
        if (valorDataAttr.includes(" - ")) {
          const partes = valorDataAttr.split(" - ");
          empresaData.empresaSigla = partes[0].trim();
          console.log(
            ` [EXTRACT EMPRESA] Sigla extraída do data-attribute combinado: ${empresaData.empresaSigla}`,
          );

          // Se também precisar do nome e não tiver ainda
          if (!empresaData.empresaNome && partes[1]) {
            empresaData.empresaNome = partes.slice(1).join(" - ").trim();
            console.log(
              ` [EXTRACT EMPRESA] Nome extraído do data-attribute combinado: ${empresaData.empresaNome}`,
            );
          }
        } else {
          empresaData.empresaSigla = valorDataAttr;
        }
      } else if (campo === "empresaNome") {
        // Extrair nome do data-attribute
        if (valorDataAttr.includes(" - ")) {
          const partes = valorDataAttr.split(" - ");
          empresaData.empresaNome = partes.slice(1).join(" - ").trim();
          console.log(
            ` [EXTRACT EMPRESA] Nome extraído do data-attribute combinado: ${empresaData.empresaNome}`,
          );

          // Se também precisar da sigla e não tiver ainda
          if (!empresaData.empresaSigla && partes[0]) {
            empresaData.empresaSigla = partes[0].trim();
            console.log(
              ` [EXTRACT EMPRESA] Sigla extraída do data-attribute combinado: ${empresaData.empresaSigla}`,
            );
          }
        } else {
          empresaData.empresaNome = valorDataAttr;
        }
      } else {
        empresaData[campo] = valorDataAttr;
      }
    }
  });

  console.log(" [EXTRACT EMPRESA] FASE 3 - Validação final...");

  // VERIFICAÇÃO FINAL - garantir que temos pelo menos sigla ou nome
  if (!empresaData.empresaSigla && empresaData.empresaNome) {
    console.log(" [EXTRACT EMPRESA] Temos nome mas não sigla");
  } else if (empresaData.empresaSigla && !empresaData.empresaNome) {
    console.log(" [EXTRACT EMPRESA] Temos sigla mas não nome");
  } else if (empresaData.empresaSigla && empresaData.empresaNome) {
    console.log(
      ` [EXTRACT EMPRESA] Empresa completa: ${empresaData.empresaSigla} - ${empresaData.empresaNome}`,
    );
  } else {
    console.log(" [EXTRACT EMPRESA] Nenhum dado de empresa encontrado");
  }

  console.log(" [EXTRACT EMPRESA] DADOS FINAIS EXTRAÍDOS:", empresaData);

  const statusCampos = {};
  camposEmpresa.forEach((campo) => {
    statusCampos[campo] =
      empresaData[campo] !== undefined ? ` ${empresaData[campo]}` : " AUSENTE";
  });

  console.log(" [EXTRACT EMPRESA] STATUS FINAL:", statusCampos);

  return empresaData;
}

/* ==== SEÇÃO 2: PREPARAÇÃO DE DADOS PARA SALVAMENTO ==== */

/**
 * Verifica e prepara empresa para salvamento (apenas na hora de salvar obra)
 * Detecta quando o usuário digitou uma empresa não cadastrada e a prepara para salvar junto com a obra
 */
async function prepararEmpresaParaSalvamento(obraElement) {
  try {
    console.log(" [EMPRESA] Verificando empresa para salvamento com obra...");

    // Buscar inputs de empresa
    const empresaInput = obraElement.querySelector(
      ".empresa-input-cadastro, .empresa-input-readonly",
    );
    const numeroInput = obraElement.querySelector(
      ".numero-cliente-final-cadastro",
    );

    if (!empresaInput || !empresaInput.value) {
      console.log(" [EMPRESA] Nenhuma empresa digitada");
      return false;
    }

    // Se já tem sigla selecionada (empresa já cadastrada), não faz nada
    if (empresaInput.dataset.siglaSelecionada) {
      console.log(
        " [EMPRESA] Empresa já cadastrada:",
        empresaInput.dataset.siglaSelecionada,
      );
      return true;
    }

    const nomeEmpresa = empresaInput.value.trim();
    if (!nomeEmpresa) {
      console.log(" [EMPRESA] Nome da empresa vazio");
      return false;
    }

    console.log(
      " [EMPRESA] Nova empresa detectada para salvar com obra:",
      nomeEmpresa,
    );

    // Extrair sigla (primeiras 3 letras em maiúsculo)
    let sigla = nomeEmpresa
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    // Garantir que a sigla tenha pelo menos 2 caracteres
    if (sigla.length < 2) {
      sigla = nomeEmpresa.substring(0, 2).toUpperCase() + "X";
    }
    if (sigla.length > 6) {
      sigla = sigla.substring(0, 6);
    }

    console.log(` [EMPRESA] Preparando empresa: ${sigla} - ${nomeEmpresa}`);

    // Atualizar a obra com os dados da nova empresa
    obraElement.dataset.empresaSigla = sigla;
    obraElement.dataset.empresaNome = nomeEmpresa;
    obraElement.dataset.numeroClienteFinal = "1"; // Número inicial para empresa nova

    // Atualizar inputs
    if (empresaInput) {
      empresaInput.value = `${sigla} - ${nomeEmpresa}`;
      empresaInput.dataset.siglaSelecionada = sigla;
      empresaInput.dataset.nomeSelecionado = nomeEmpresa;
    }

    if (numeroInput) {
      numeroInput.value = "1";
    }

    console.log(
      ` [EMPRESA] Empresa preparada para salvamento: ${sigla} - ${nomeEmpresa}`,
    );

    // Usar showSystemStatus se disponível
    if (typeof window.showSystemStatus === "function") {
      window.showSystemStatus(
        `Empresa ${sigla} preparada para salvar com a obra!`,
        "success",
      );
    }

    return true;
  } catch (error) {
    console.error(" [EMPRESA] Erro ao preparar empresa:", error);
    if (typeof window.showSystemStatus === "function") {
      window.showSystemStatus(
        "Erro ao preparar empresa para salvamento",
        "error",
      );
    }
    return false;
  }
}

/**
 * Prepara dados de empresa na obra carregada
 */
async function prepararDadosEmpresaNaObra(obraData, obraElement) {
  try {
    // Verificar se a obra tem dados de empresa
    const camposEmpresa = [
      "empresaSigla",
      "empresaNome",
      "numeroClienteFinal",
      "clienteFinal",
      "codigoCliente",
      "emailEmpresa",
      "dataCadastro",
      "orcamentistaResponsavel",
      "idGerado",
    ];

    // Log detalhado dos dados recebidos
    console.log(
      " [EMPRESA] Preparando dados para obra:",
      obraData.nome || obraData.id,
    );
    console.log(" [EMPRESA] Dados disponíveis:", {
      empresaSigla: obraData.empresaSigla,
      empresaNome: obraData.empresaNome,
      numeroClienteFinal: obraData.numeroClienteFinal,
      empresa_id: obraData.empresa_id,
    });

    // Verificar se temos dados de empresa
    const temDadosEmpresa =
      camposEmpresa.some((campo) => {
        const valor = obraData[campo];
        return (
          valor !== undefined &&
          valor !== null &&
          valor.toString().trim() !== ""
        );
      }) ||
      (obraData.empresa_id && obraData.empresa_id.toString().trim() !== "");

    if (!temDadosEmpresa) {
      console.log(" [EMPRESA] Obra não possui dados de empresa identificáveis");
      return;
    }

    console.log(" [EMPRESA] Dados de empresa detectados, preparando...");

    // Mapear todos os campos possíveis
    const mapeamentoCampos = {
      empresaSigla: obraData.empresaSigla,
      empresaNome: obraData.empresaNome,
      numeroClienteFinal: obraData.numeroClienteFinal,
      clienteFinal: obraData.clienteFinal,
      codigoCliente: obraData.codigoCliente,
      emailEmpresa: obraData.emailEmpresa || obraData.empresaEmail,
      dataCadastro: obraData.dataCadastro,
      orcamentistaResponsavel: obraData.orcamentistaResponsavel,
      idGerado: obraData.idGerado,
      empresa_id: obraData.empresa_id, // Adicionar este campo
    };

    // Atribuir aos data attributes
    Object.entries(mapeamentoCampos).forEach(([campo, valor]) => {
      if (valor && valor.toString().trim() !== "") {
        const valorAntigo = obraElement.dataset[campo];
        obraElement.dataset[campo] = valor.toString().trim();
        console.log(
          ` [EMPRESA] ${campo}: "${valorAntigo || "vazio"}" → "${valor}"`,
        );
      }
    });

    // CHAVE: Atualizar a interface COM OS DADOS DA OBRA
    // A função será importada de empresa-form-manager.js
    if (typeof window.atualizarInterfaceComEmpresa === "function") {
      await window.atualizarInterfaceComEmpresa(obraElement, obraData);
    } else if (typeof atualizarInterfaceComEmpresa === "function") {
      // Se estiver no escopo local (import direto)
      await atualizarInterfaceComEmpresa(obraElement, obraData);
    }

    console.log(" [EMPRESA] Preparação concluída com sucesso");
  } catch (error) {
    console.error(" [EMPRESA] Erro ao preparar dados:", error);
  }
}

/* ==== SEÇÃO 3: CÁLCULO DE NÚMERO DO CLIENTE ==== */

/**
 * Atualizar input do número do cliente
 */
function atualizarNumeroClienteInput(numero, obraId) {
  const numeroInput = document.querySelector(
    `[data-obra-id="${obraId}"] .numero-cliente-final-cadastro`,
  );
  if (numeroInput) {
    numeroInput.value = numero;
  }
}

/* ==== SEÇÃO 4: FUNÇÕES AUXILIARES PARA DEBUG ==== */

/**
 * Forçar atualização de empresa em uma obra específica
 */
async function forcarAtualizacaoEmpresa(obraId) {
  try {
    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraElement) {
      console.error(` [FORÇAR EMPRESA] Obra ${obraId} não encontrada`);
      return false;
    }

    // Obter dados atualizados do servidor
    const response = await fetch(`/obras/${obraId}`);
    if (!response.ok) {
      console.error(` [FORÇAR EMPRESA] Erro ao buscar obra ${obraId}`);
      return false;
    }

    const obraData = await response.json();

    // Atualizar dados da empresa
    await prepararDadosEmpresaNaObra(obraData, obraElement);

    console.log(` [FORÇAR EMPRESA] Empresa atualizada para obra ${obraId}`);
    return true;
  } catch (error) {
    console.error(` [FORÇAR EMPRESA] Erro:`, error);
    return false;
  }
}

/**
 * Atualizar dados da empresa em todas as obras
 */
// REMOÇÃO POSSIVEL VERIFICAR DEPOIS
async function atualizarEmpresaEmTodasObras(empresaData) {
  const obras = document.querySelectorAll(".obra-block[data-obra-id]");

  for (const obraElement of obras) {
    try {
      const obraId = obraElement.dataset.obraId;

      if (typeof window.obterDadosEmpresaDaObra === "function") {
        const dadosObra = window.obterDadosEmpresaDaObra(obraId);

        if (
          dadosObra &&
          typeof window.prepararDadosEmpresaNaObra === "function"
        ) {
          await window.prepararDadosEmpresaNaObra(dadosObra, obraElement);
        }
      }
    } catch (error) {
      console.error(` Erro ao atualizar empresa na obra ${obraId}:`, error);
    }
  }
}

/**
 * Função para debug
 */
async function debugExtractEmpresaData() {
  console.log(" [DEBUG] Testando extração de dados de empresa...");

  const obras = document.querySelectorAll(".obra-block");
  console.log(` ${obras.length} obras encontradas no DOM`);

  obras.forEach((obra, index) => {
    const obraId = obra.dataset.obraId;
    console.log(` Obra ${index + 1}: ${obraId}`);

    const dados = extractEmpresaData(obra);
    console.log(` Dados extraídos:`, dados);
  });
}

/* ==== SEÇÃO 5: EXPORTS E INICIALIZAÇÃO ==== */

export {
  extractEmpresaData,
  prepararEmpresaParaSalvamento,
  prepararDadosEmpresaNaObra,
  atualizarNumeroClienteInput,
  forcarAtualizacaoEmpresa,
  atualizarEmpresaEmTodasObras,
  debugExtractEmpresaData,
};

// Compatibilidade global
if (typeof window !== "undefined") {
  window.extractEmpresaData = extractEmpresaData;
  window.prepararEmpresaParaSalvamento = prepararEmpresaParaSalvamento;
  window.prepararDadosEmpresaNaObra = prepararDadosEmpresaNaObra;
  window.atualizarNumeroClienteInput = atualizarNumeroClienteInput;
  window.forcarAtualizacaoEmpresa = forcarAtualizacaoEmpresa;
  window.atualizarEmpresaEmTodasObras = atualizarEmpresaEmTodasObras;
  window.debugExtractEmpresaData = debugExtractEmpresaData;
}
