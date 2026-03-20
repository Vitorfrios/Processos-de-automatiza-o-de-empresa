import { ensureStringId } from "../../../data/utils/id-generator.js";
import { showSystemStatus } from "../../../ui/components/status.js";
import { isSessionActive } from "../../../data/adapters/session-adapter.js";

/**
 * FUNÇÕES DE PERSISTÊNCIA
 */

async function fetchObras() {
  try {
    const response = await fetch("/obras");

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const obras = await response.json();
    return obras || [];
  } catch (error) {
    console.error(" Erro ao buscar obras:", error);
    return [];
  }
}

async function atualizarObra(obraId, obraData) {
  try {
    if (!obraId || obraId === "undefined" || obraId === "null") {
      console.error(
        `ERRO FALBACK (atualizarObra) [ID de obra inválido: ${obraId}]`,
      );
      showSystemStatus("ERRO: ID da obra inválido para atualização", "error");
      return null;
    }

    if (!isSessionActive()) {
      console.warn(" Sessão não está ativa - obra não será atualizada");
      showSystemStatus(
        "ERRO: Sessão não está ativa. Obra não atualizada.",
        "error",
      );
      return null;
    }

    obraId = ensureStringId(obraId);

    console.log(` Verificando se obra ${obraId} existe no servidor...`);

    const todasObrasResponse = await fetch("/api/backup-completo");
    if (!todasObrasResponse.ok) {
      throw new Error("Falha ao carregar backup para verificação");
    }

    const backupData = await todasObrasResponse.json();
    const todasObras = backupData.obras || [];
    const obraExistente = todasObras.find(
      (obra) => String(obra.id) === String(obraId),
    );

    console.log(` Verificação: Obra ${obraId} existe? ${!!obraExistente}`);
    console.log(
      ` TODAS as obras no backup:`,
      todasObras.map((o) => ({ id: o.id, nome: o.nome })),
    );

    if (!obraExistente) {
      console.log(` Obra ${obraId} não encontrada no backup, criando nova...`);
      console.log(` Criando nova obra com ID seguro preservado: ${obraId}`);
      obraData.id = obraId;
      return await supportFrom_saveObra(obraData);
    }

    console.log(" ATUALIZANDO OBRA EXISTENTE:", {
      id: obraData.id,
      nome: obraData.nome,
      projetos: obraData.projetos?.length || 0,
    });

    const url = `/obras/${obraId}`;
    console.log(` Fazendo PUT para: ${url}`);

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(obraData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao atualizar obra: ${errorText}`);
    }

    const updatedObra = await response.json();
    showSystemStatus("Obra atualizada com sucesso!", "success");

    console.log(" OBRA ATUALIZADA:", {
      id: updatedObra.id,
      nome: updatedObra.nome,
      projetos: updatedObra.projetos?.length || 0,
    });
    return updatedObra;
  } catch (error) {
    console.error(" Erro ao ATUALIZAR obra:", error);
    showSystemStatus("ERRO: Não foi possível atualizar a obra", "error");
    return null;
  }
}

async function supportFrom_saveObra(obraData) {
  try {
    if (!obraData || !obraData.nome) {
      console.error(
        `ERRO FALBACK (supportFrom_saveObra) [Dados da obra inválidos: ${JSON.stringify(obraData)}]`,
      );
      showSystemStatus("ERRO: Dados da obra inválidos", "error");
      return null;
    }

    if (!isSessionActive()) {
      console.warn(" Sessão não está ativa - obra não será salva");
      showSystemStatus("ERRO: Sessão não está ativa. Obra não salva.", "error");
      return null;
    }

    if (!obraData.id || obraData.id === "undefined" || obraData.id === "null") {
      console.error(
        `ERRO FALBACK (supportFrom_saveObra) [Obra sem ID seguro: ${obraData.id}]`,
      );
      showSystemStatus("ERRO: Obra não possui ID válido", "error");
      return null;
    }

    console.log(" SALVANDO NOVA OBRA:", {
      id: obraData.id,
      nome: obraData.nome,
      projetos: obraData.projetos?.length || 0,
    });

    const response = await fetch("/obras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(obraData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao salvar obra: ${errorText}`);
    }

    const createdObra = await response.json();

    console.log(` Adicionando obra ${createdObra.id} à sessão...`);
    await fetch("/api/sessions/add-obra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obra_id: createdObra.id }),
    });

    showSystemStatus("Obra salva com sucesso!", "success");

    console.log(" NOVA OBRA SALVA E ADICIONADA À SESSÃO:", {
      id: createdObra.id,
      nome: createdObra.nome,
      projetos: createdObra.projetos?.length || 0,
    });
    return createdObra;
  } catch (error) {
    console.error(" Erro ao SALVAR obra:", error);
    showSystemStatus("ERRO: Não foi possível salvar a obra", "error");
    return null;
  }
}

async function deleteObraFromServer(obraName, obraId) {
  try {
    if (
      !obraId ||
      obraId === "undefined" ||
      obraId === "null" ||
      !obraId.startsWith("obra_")
    ) {
      console.error(
        `ERRO FALBACK (deleteObraFromServer) [ID de obra inválido: ${obraId}]`,
      );
      showSystemStatus("ERRO: ID da obra inválido para remoção", "error");
      return;
    }

    if (!isSessionActive()) {
      console.warn(
        " Sessão não está ativa - obra não será removida do servidor",
      );
      return;
    }

    obraId = ensureStringId(obraId);

    console.log(` Removendo obra ${obraId} do servidor...`);

    const response = await fetch(`/obras/${obraId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao remover obra: ${errorText}`);
    }

    console.log(` Obra ${obraId} removida do servidor`);
    showSystemStatus("Obra removida do servidor com sucesso", "success");
  } catch (error) {
    console.error(" Erro ao remover obra do servidor:", error);
    showSystemStatus(
      "ERRO: Não foi possível remover a obra do servidor",
      "error",
    );
  }
}

export {
  fetchObras,
  supportFrom_saveObra,
  atualizarObra,
  deleteObraFromServer,
};
