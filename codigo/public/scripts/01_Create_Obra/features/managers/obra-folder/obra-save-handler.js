import { ensureStringId } from "../../../data/utils/id-generator.js";
import { buildObraData } from "../../../data/builders/data-builders.js";
import { showSystemStatus } from "../../../ui/components/status.js";
import { APP_CONFIG } from "../../../core/config.js";
import {
  isSessionActive,
  startSessionOnFirstSave,
} from "../../../data/adapters/session-adapter.js";
import { findObraBlockWithRetry } from "./obra-dom-manager.js";
import { supportFrom_saveObra, atualizarObra } from "./obra-persistence.js";
import { prepararEmpresaParaSalvamento } from "../../../data/empresa-system/empresa-data-extractor.js";

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
    const todasObrasResponse = await fetch("/api/backup-completo");
    if (todasObrasResponse.ok) {
      const backupData = await todasObrasResponse.json();
      const todasObras = backupData.obras || [];
      const obraExistente = todasObras.find(
        (obra) => String(obra.id) === String(finalObraId),
      );

      isNewObra = !obraExistente;
      console.log(`- Já existe no servidor?: ${!isNewObra}`);
    }
  } catch (error) {
    console.log(
      "- Não foi possível verificar servidor, assumindo como nova obra",
    );
  }

  console.log("- É nova obra?:", isNewObra);

  let result = null;

  if (isNewObra) {
    console.log(" SALVANDO COMO NOVA OBRA COM ID SEGURO:", finalObraId);

    obraData.id = finalObraId;

    if (!obraData.id || !obraData.id.startsWith("obra_")) {
      console.error(" Obra não possui ID seguro válido para salvar");
      showSystemStatus("ERRO: Obra não possui ID válido", "error");
      return;
    }

    result = await supportFrom_saveObra(obraData);
  } else {
    console.log(" ATUALIZANDO OBRA EXISTENTE, ID SEGURO:", finalObraId);

    if (!finalObraId.startsWith("obra_")) {
      console.error(`ERRO: ID não seguro para atualização: ${finalObraId}`);
      showSystemStatus("ERRO: ID da obra inválido para atualização", "error");
      return;
    }

    result = await atualizarObra(finalObraId, obraData);
  }

  if (result) {
    const finalId = ensureStringId(result.id);

    let obraBlockAtual = document.querySelector(`[data-obra-id="${finalId}"]`);

    if (!obraBlockAtual) {
      console.error(" CRÍTICO: Obra desapareceu do DOM durante salvamento!");
      console.log(" Tentando recuperar da referência original...");

      if (obraContainer && document.body.contains(obraContainer)) {
        const obrasNoContainer =
          obraContainer.querySelectorAll("[data-obra-id]");
        console.log(` Obras no container original: ${obrasNoContainer.length}`);

        if (obraContainer.contains(obraOriginalReference)) {
          obraBlockAtual = obraOriginalReference;
          console.log(" Obra recuperada da referência original");
        } else {
          console.error(" Obra não está mais no container original");
          showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
          return;
        }
      } else {
        console.error(" Container original não encontrado");
        showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
        return;
      }
    }

    obraBlockAtual.dataset.obraId = finalId;
    obraBlockAtual.dataset.obraName = obraData.nome;

    const titleElement = obraBlockAtual.querySelector(".obra-title");
    if (titleElement && titleElement.textContent !== obraData.nome) {
      titleElement.textContent = obraData.nome;
    }

    if (
      typeof updateObraButtonAfterSave === "function" &&
      document.body.contains(obraBlockAtual)
    ) {
      console.log(" Obra confirmada no DOM, atualizando botão...");
      updateObraButtonAfterSave(obraData.nome, finalId);
    } else {
      console.error(" Obra não está no DOM para atualizar botão");
    }

    console.log(" [HEADER] Chamando atualização do header após salvamento...");
    await atualizarHeaderObraAposSalvamento(finalId);

    // Minimizar toggles após salvamento bem-sucedido
    console.log(" [SALVAMENTO] Minimizando toggles automaticamente...");
    await minimizarTogglesAposSalvamento(finalId);

    console.log(` OBRA SALVA/ATUALIZADA COM SUCESSO! ID SEGURO: ${finalId}`);
    let successMessage = "Obra salva com sucesso!";

    try {
      await notificarAdminSobreObra(finalId);
    } catch (notificationError) {
      console.error(" [NOTIFICACAO] Falha ao enviar email ao ADM:", notificationError);
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
