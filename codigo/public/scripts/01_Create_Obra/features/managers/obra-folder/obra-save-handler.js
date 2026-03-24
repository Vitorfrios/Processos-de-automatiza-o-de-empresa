import { ensureStringId } from "../../../data/utils/id-generator.js";
import { buildObraData } from "../../../data/builders/data-builders.js";
import { showSystemStatus } from "../../../ui/components/status.js";
import { APP_CONFIG } from "../../../core/config.js";
import {
  isSessionActive,
  startSessionOnFirstSave,
} from "../../../data/adapters/session-adapter.js";
import {
  findObraBlockWithRetry,
  updateObraButtonAfterSave,
} from "./obra-dom-manager.js";
import { supportFrom_saveObra, atualizarObra } from "./obra-persistence.js";
import { prepararEmpresaParaSalvamento } from "../../../data/empresa-system/empresa-data-extractor.js";
import { collapseElement } from "../../../ui/helpers.js";

/**
 * Minimizar todos os toggles ao salvar
 */
async function minimizarTogglesAposSalvamento(obraId) {
  console.log(` [TOGGLES] Minimizando todos os toggles para obra: ${obraId}`);

  try {
    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraElement) {
      console.error(` [TOGGLES] Obra ${obraId} não encontrada`);
      return;
    }

    // Minimizar obra principal
    const obraContent = obraElement.querySelector(".obra-content");
    const obraMinimizer = obraElement.querySelector(".minimizer");
    if (obraContent && obraMinimizer) {
      collapseElement(obraContent, obraMinimizer);
    }

    // Minimizar todos os projetos
    const projetos = obraElement.querySelectorAll(".project-block");
    projetos.forEach((projeto) => {
      const projectContent = projeto.querySelector(".project-content");
      const projectMinimizer = projeto.querySelector(".minimizer");
      if (projectContent && projectMinimizer) {
        collapseElement(projectContent, projectMinimizer);
      }

      // Minimizar todas as salas
      const salas = projeto.querySelectorAll(".room-block");
      salas.forEach((sala) => {
        const roomContent = sala.querySelector(".room-content");
        const roomMinimizer = sala.querySelector(".minimizer");
        if (roomContent && roomMinimizer) {
          collapseElement(roomContent, roomMinimizer);
        }
      });
    });

    console.log(` [TOGGLES] Todos os toggles minimizados para obra ${obraId}`);
  } catch (error) {
    console.error(` [TOGGLES] Erro ao minimizar toggles:`, error);
  }
}

async function notificarAdminSobreObra(obraId) {
  if (APP_CONFIG.mode !== "client") {
    return;
  }

  const response = await fetch("/api/obra/notificar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ obraId }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Falha ao enviar notificação ao ADM.");
  }
}

/**
 * Função principal de salvamento
 */
async function saveObra(obraId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log(` SALVANDO OBRA pelo ID: "${obraId}"`);

  let obraBlock = await findObraBlockWithRetry(obraId, 15);

  if (!obraBlock) {
    console.error(
      " Obra não encontrada no DOM após múltiplas tentativas:",
      obraId,
    );
    showSystemStatus("ERRO: Obra não encontrada na interface", "error");
    return;
  }

  const obraOriginalReference = obraBlock;
  const obraContainer = obraBlock.parentElement;

  // Prepara os dados da empresa antes do salvamento da obra
  console.log(" [SALVAMENTO] Preparando empresa para salvamento com obra...");
  await prepararEmpresaParaSalvamento(obraBlock);

  console.log(" REFERÊNCIA SALVA:", {
    obra: obraOriginalReference,
    container: obraContainer,
    obraNoContainer: obraContainer.contains(obraOriginalReference),
  });

  if (!isSessionActive()) {
    console.log(" Iniciando sessão para primeira obra...");
    await startSessionOnFirstSave();
  }

  if (!isSessionActive()) {
    console.warn(" Sessão não está ativa - obra não será salva");
    showSystemStatus("ERRO: Sessão não está ativa. Obra não salva.", "error");
    return;
  }

  console.log(" Obra confirmada no DOM:", {
    element: obraBlock,
    dataset: obraBlock.dataset,
    id: obraBlock.dataset.obraId,
    name: obraBlock.dataset.obraName,
  });

  console.log(" Construindo dados da obra...");
  const obraData = buildObraData(obraBlock);

  if (!obraData) {
    console.error(" Falha ao construir dados da obra");
    showSystemStatus("ERRO: Falha ao construir dados da obra", "error");
    return;
  }

  if (!String(obraData.emailEmpresa || "").trim()) {
    showSystemStatus(
      "O email da empresa não foi preenchido. Isso pode dificultar a recuperação do acesso posteriormente.",
      "warning",
    );
  }

  const obraIdFromDOM = obraBlock.dataset.obraId;
  const obraIdFromData = obraData.id;
  const finalObraId = obraIdFromDOM || obraIdFromData;

  console.log(" VERIFICAÇÃO DE OBRA MELHORADA:");
  console.log("- ID no DOM:", obraIdFromDOM);
  console.log("- ID nos dados:", obraIdFromData);
  console.log("- ID final para uso:", finalObraId);
  console.log("- É ID seguro?:", finalObraId?.startsWith("obra_"));

  let isNewObra = true;

  try {
    {
      const obraExistenteResponse = await fetch(
        `/obras/${encodeURIComponent(finalObraId)}`,
      );
      if (obraExistenteResponse.ok) {
        isNewObra = false;
      } else if (obraExistenteResponse.status === 404) {
        isNewObra = true;
      }
      console.log(`- Ja existe no servidor?: ${!isNewObra}`);
    }
  } catch (error) {
    console.log(
      "- Nao foi possivel verificar servidor, assumindo como nova obra",
    );
  }

  console.log("- E nova obra?:", isNewObra);

  let novoFluxoResultado = null;

  if (isNewObra) {
    console.log(" SALVANDO COMO NOVA OBRA COM ID SEGURO:", finalObraId);

    obraData.id = finalObraId;

    if (!obraData.id || !obraData.id.startsWith("obra_")) {
      console.error(" Obra nao possui ID seguro valido para salvar");
      showSystemStatus("ERRO: Obra nao possui ID valido", "error");
      return;
    }

    novoFluxoResultado = await supportFrom_saveObra(obraData);
  } else {
    console.log(" ATUALIZANDO OBRA EXISTENTE, ID SEGURO:", finalObraId);

    if (!finalObraId.startsWith("obra_")) {
      console.error(`ERRO: ID nao seguro para atualizacao: ${finalObraId}`);
      showSystemStatus("ERRO: ID da obra invalido para atualizacao", "error");
      return;
    }

    novoFluxoResultado = await atualizarObra(finalObraId, obraData);
  }

  if (novoFluxoResultado) {
    const novoFluxoFinalId = ensureStringId(novoFluxoResultado.id);

    let obraBlockAtualNovo = document.querySelector(
      `[data-obra-id="${novoFluxoFinalId}"]`,
    );

    if (!obraBlockAtualNovo) {
      console.error(" CRITICO: Obra desapareceu do DOM durante salvamento!");
      console.log(" Tentando recuperar da referencia original...");

      if (obraContainer && document.body.contains(obraContainer)) {
        const obrasNoContainer =
          obraContainer.querySelectorAll("[data-obra-id]");
        console.log(` Obras no container original: ${obrasNoContainer.length}`);

        if (obraContainer.contains(obraOriginalReference)) {
          obraBlockAtualNovo = obraOriginalReference;
          console.log(" Obra recuperada da referencia original");
        } else {
          console.error(" Obra nao esta mais no container original");
          showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
          return;
        }
      } else {
        console.error(" Container original nao encontrado");
        showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
        return;
      }
    }

    obraBlockAtualNovo.dataset.obraId = novoFluxoFinalId;
    obraBlockAtualNovo.dataset.obraName = obraData.nome;

    const titleElement = obraBlockAtualNovo.querySelector(".obra-title");
    if (titleElement && titleElement.textContent !== obraData.nome) {
      titleElement.textContent = obraData.nome;
    }

    if (
      typeof updateObraButtonAfterSave === "function" &&
      document.body.contains(obraBlockAtualNovo)
    ) {
      console.log(" Obra confirmada no DOM, atualizando botao...");
      updateObraButtonAfterSave(obraData.nome, novoFluxoFinalId);
    } else {
      console.error(" Obra nao esta no DOM para atualizar botao");
    }

    console.log(" OBRA SALVA/ATUALIZADA:", {
      id: novoFluxoFinalId,
      nome: obraData.nome,
      isNew: isNewObra,
    });

    if (typeof window.invalidateRuntimeBootstrap === "function") {
      window.invalidateRuntimeBootstrap();
    }

    console.log(" [HEADER] Chamando atualização do header após salvamento...");
    await atualizarHeaderObraAposSalvamento(novoFluxoFinalId);

    console.log(" [SALVAMENTO] Minimizando toggles automaticamente...");
    await minimizarTogglesAposSalvamento(novoFluxoFinalId);

    console.log(
      ` OBRA SALVA/ATUALIZADA COM SUCESSO! ID SEGURO: ${novoFluxoFinalId}`,
    );
    let successMessage = isNewObra
      ? "Obra salva com sucesso!"
      : "Obra atualizada com sucesso!";

    try {
      await notificarAdminSobreObra(novoFluxoFinalId);
    } catch (notificationError) {
      console.error(
        " [NOTIFICACAO] Falha ao enviar email ao ADM:",
        notificationError,
      );
      successMessage = "Obra salva, mas a notificação ao ADM não foi enviada.";
    }

    showSystemStatus(
      successMessage,
      successMessage.includes("não foi enviada") ? "warning" : "success",
    );
  } else {
    console.error(" FALHA AO SALVAR OBRA NO SERVIDOR");
    showSystemStatus("ERRO: Falha ao salvar obra no servidor", "error");
  }
}

/**
 * Atualiza o header da obra após salvamento
 */
async function atualizarHeaderObraAposSalvamento(obraId) {
  try {
    console.log(
      ` [HEADER] Iniciando atualização do header para obra: ${obraId}`,
    );

    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraElement) {
      console.error(` [HEADER] Obra ${obraId} não encontrada no DOM`);
      return;
    }

    // Importar as funções necessárias
    const { extractEmpresaData } =
      await import("../../../data/empresa-system/empresa-data-extractor.js");
    const { atualizarInterfaceComEmpresa } =
      await import("../../../data/empresa-system/empresa-form-manager.js");

    // Extrair dados atualizados da empresa
    console.log(" [HEADER] Extraindo dados da empresa...");
    const empresaData = extractEmpresaData(obraElement);

    console.log(" [HEADER] Dados extraídos:", empresaData);

    if (!empresaData.empresaSigla || !empresaData.empresaNome) {
      console.log(
        " [HEADER] Dados de empresa incompletos para atualizar header",
      );
      return;
    }

    // Atualizar a interface
    console.log(" [HEADER] Chamando atualizarInterfaceComEmpresa...");
    await atualizarInterfaceComEmpresa(obraElement, empresaData);

    console.log(" [HEADER] Header atualizado com sucesso!");
  } catch (error) {
    console.error(" [HEADER] Erro ao atualizar header:", error);
  }
}

export { saveObra, atualizarHeaderObraAposSalvamento };
