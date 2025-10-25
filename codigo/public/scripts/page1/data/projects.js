import { UI_CONSTANTS } from "../config/config.js"
import { ensureStringId } from "../utils/utils.js"
import { buildObraData } from "./data-utils.js"
import { showSystemStatus, updateObraButtonAfterSave } from "../ui/interface.js"
import { isSessionActive } from "./server.js"

/**
 * Busca todas as obras do servidor
 * @returns {Promise<Array>} Lista de obras
 */
async function fetchObras() {
  try {
    const response = await fetch('/obras')

    if (!response.ok) {
      // Se o endpoint não existir, retorna array vazio (para obras novas)
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const obras = await response.json()
    return obras || [];
  } catch (error) {
    console.error("❌ Erro ao buscar obras:", error)
    // Em caso de erro, assumir que não há obras (para desenvolvimento)
    return [];
  }
}


/**
 * Salva uma nova OBRA no servidor - CORREÇÃO PARA EVITAR 404
 * @param {Object} obraData - Dados da obra a ser salva
 * @returns {Promise<Object|null>} Obra criada ou null em caso de erro
 */
async function salvarObra(obraData) {
  try {
    // REGRA: Só salvar se sessão estiver ativa
    if (!isSessionActive()) {
      console.warn("⚠️ Sessão não está ativa - obra não será salva");
      showSystemStatus("ERRO: Sessão não está ativa. Obra não salva.", "error");
      return null;
    }

    console.log('📤 SALVANDO NOVA OBRA:', {
      id: obraData.id,
      nome: obraData.nome,
      projetos: obraData.projetos?.length || 0,
      timestamp: obraData.timestamp
    });

    // CORREÇÃO: Sempre usar POST para nova obra, mesmo que tenha ID
    const response = await fetch('/obras', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(obraData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao salvar obra: ${errorText}`);
    }

    const createdObra = await response.json();
    showSystemStatus("Obra salva com sucesso!", "success");
    
    console.log('✅ NOVA OBRA SALVA:', createdObra);
    return createdObra;
  } catch (error) {
    console.error("❌ Erro ao SALVAR obra:", error);
    showSystemStatus("ERRO: Não foi possível salvar a obra", "error");
    return null;
  }
}

/**
 * Atualiza uma obra existente no servidor - CORREÇÃO PARA VERIFICAR EXISTÊNCIA
 * @param {string|number} obraId - ID da obra
 * @param {Object} obraData - Dados atualizados da obra
 * @returns {Promise<Object|null>} Obra atualizada ou null em caso de erro
 */
async function atualizarObra(obraId, obraData) {
  try {
    // REGRA: Só atualizar se sessão estiver ativa
    if (!isSessionActive()) {
      console.warn("⚠️ Sessão não está ativa - obra não será atualizada");
      showSystemStatus("ERRO: Sessão não está ativa. Obra não atualizada.", "error");
      return null;
    }

    obraId = ensureStringId(obraId);

    if (!obraId) {
      console.error("❌ ERRO: ID da obra inválido para atualização");
      showSystemStatus("ERRO: ID da obra inválido para atualização", "error");
      return null;
    }

    // CORREÇÃO: Verificar se a obra existe antes de tentar atualizar
    console.log(`🔍 Verificando se obra ${obraId} existe no servidor...`);
    const checkResponse = await fetch(`/obras/${obraId}`);
    
    if (!checkResponse.ok) {
      if (checkResponse.status === 404) {
        console.log(`📝 Obra ${obraId} não encontrada, salvando como nova...`);
        return await salvarObra(obraData);
      } else {
        const errorText = await checkResponse.text();
        throw new Error(`Erro ao verificar obra: ${errorText}`);
      }
    }

    // Se chegou aqui, a obra existe - pode atualizar
    obraData.id = obraId;

    console.log('🔄 ATUALIZANDO OBRA EXISTENTE:', {
      id: obraData.id,
      nome: obraData.nome,
      projetos: obraData.projetos?.length || 0
    });

    const url = `/obras/${obraId}`;
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
    
    console.log('✅ OBRA ATUALIZADA:', updatedObra);
    return updatedObra;
  } catch (error) {
    console.error("❌ Erro ao ATUALIZAR obra:", error);
    showSystemStatus("ERRO: Não foi possível atualizar a obra", "error");
    return null;
  }
}

/**
 * Salva ou atualiza uma OBRA (função principal) - CORREÇÃO FINAL
 * @param {string} obraName - Nome da obra
 * @param {Event} event - Evento do clique
 */
async function saveObra(obraName, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log(`💾 SALVANDO OBRA: "${obraName}"`);

    if (!isSessionActive()) {
        console.warn("⚠️ Sessão não está ativa - obra não será salva");
        showSystemStatus("ERRO: Sessão não está ativa. Obra não salva.", "error");
        return;
    }

    const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`);
    if (!obraBlock) {
        console.error('❌ Obra não encontrada:', obraName);
        showSystemStatus("ERRO: Obra não encontrada na interface", "error");
        return;
    }

    // Construir dados da obra (inclui projetos e salas)
    console.log('🔨 Construindo dados da obra...');
    const obraData = buildObraData(obraBlock);

    if (!obraData) {
        console.error('❌ Falha ao construir dados da obra');
        showSystemStatus("ERRO: Falha ao construir dados da obra", "error");
        return;
    }

    // CORREÇÃO: Lógica melhorada para determinar se é nova obra ou atualização
    const obraIdFromDOM = obraBlock.dataset.obraId;
    const isNewObra = !obraIdFromDOM || obraIdFromDOM === "" || obraIdFromDOM === "null" || obraIdFromDOM === "undefined";

    console.log('🔍 VERIFICAÇÃO DE OBRA:');
    console.log('- ID no DOM:', obraIdFromDOM);
    console.log('- ID nos dados:', obraData.id);
    console.log('- É nova obra?:', isNewObra);

    let result = null;
    
    if (isNewObra) {
        console.log('🆕 SALVANDO COMO NOVA OBRA');
        result = await salvarObra(obraData);
    } else {
        const finalId = obraIdFromDOM || obraData.id;
        console.log('📝 ATUALIZANDO OBRA EXISTENTE, ID:', finalId);
        result = await atualizarObra(finalId, obraData);
    }

    if (result) {
        const finalId = ensureStringId(result.id);
        
        // Atualizar DOM com o ID correto
        obraBlock.dataset.obraId = finalId;
        obraBlock.dataset.obraName = obraData.nome;
        
        // Atualizar título se necessário
        const titleElement = obraBlock.querySelector('.obra-title');
        if (titleElement && titleElement.textContent !== obraData.nome) {
            titleElement.textContent = obraData.nome;
        }

        // CORREÇÃO: Atualizar o botão para "Atualizar Obra"
        if (typeof updateObraButtonAfterSave === 'function') {
            updateObraButtonAfterSave(obraName, finalId);
        }

        console.log(`✅ OBRA SALVA COM SUCESSO! ID: ${finalId}`);
        
        showSystemStatus("Obra salva com sucesso!", "success");
    } else {
        console.error('❌ FALHA AO SALVAR OBRA NO SERVIDOR');
        showSystemStatus("ERRO: Falha ao salvar obra no servidor", "error");
    }
}


/**
 * Deleta um projeto da interface (apenas remoção visual)
 * @param {string} obraName - Nome da obra
 * @param {string} projectName - Nome do projeto a ser deletado
 */
async function deleteProject(obraName, projectName) {
  const confirmMessage = "Tem certeza que deseja remover este projeto da obra?"

  if (!confirm(confirmMessage)) return

  const projectBlock = document.querySelector(`[data-project-name="${projectName}"][data-obra-name="${obraName}"]`)
  if (!projectBlock) return

  // Apenas remove da interface - o salvamento da obra atualizada vai refletir a remoção
  projectBlock.remove()

  console.log(`🗑️ Projeto ${projectName} removido da obra ${obraName}`)
  showSystemStatus("Projeto removido da obra", "success")
}

/**
 * Deleta uma obra do servidor
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra
 */
async function deleteObraFromServer(obraName, obraId) {
  try {
    if (!isSessionActive()) {
      console.warn("⚠️ Sessão não está ativa - obra não será removida do servidor");
      return;
    }

    obraId = ensureStringId(obraId);

    if (!obraId) {
      console.error("❌ ERRO: ID da obra inválido para remoção");
      return;
    }

    console.log(`🗑️ Removendo obra ${obraId} do servidor...`);

    const response = await fetch(`/obras/${obraId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao remover obra: ${errorText}`);
    }

    console.log(`✅ Obra ${obraId} removida do servidor`);
    showSystemStatus("Obra removida do servidor com sucesso", "success");
  } catch (error) {
    console.error("❌ Erro ao remover obra do servidor:", error);
    showSystemStatus("ERRO: Não foi possível remover a obra do servidor", "error");
  }
}

/**
 * Verifica os dados de uma obra e gera relatório
 * @param {string} obraName - Nome da obra
 */
function verifyObraData(obraName) {
  const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`);
  if (!obraBlock) return;

  const projects = obraBlock.querySelectorAll(".project-block");
  let totalRooms = 0;
  let report = `Verificação da Obra "${obraName}":\n\n`;
  report += `Total de projetos: ${projects.length}\n\n`;

  projects.forEach((project, index) => {
    const projectName = project.dataset.projectName;
    const rooms = project.querySelectorAll(".room-block");
    totalRooms += rooms.length;
    
    report += `Projeto ${index + 1}: ${projectName}\n`;
    report += `  - Salas: ${rooms.length}\n`;
    
    rooms.forEach((room, roomIndex) => {
      const roomName = room.querySelector(".room-title")?.textContent || `Sala ${roomIndex + 1}`;
      const stats = calculateRoomCompletionStats(room);
      report += `    - ${roomName}: ${stats.filled}/${stats.total} campos (${stats.percentage}%)\n`;
    });
    report += '\n';
  });

  report += `RESUMO: ${projects.length} projetos, ${totalRooms} salas`;

  alert(report);
}

/**
 * Calcula estatísticas de preenchimento de uma sala
 * @param {HTMLElement} room - Elemento da sala
 * @returns {Object} Estatísticas de preenchimento
 */
function calculateRoomCompletionStats(room) {
  const inputs = room.querySelectorAll(".form-input, .clima-input");
  const filledInputs = Array.from(inputs).filter((input) => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      return input.checked;
    }
    return input.value && input.value.trim() !== "";
  }).length;
  
  const totalInputs = inputs.length;
  const percentage = totalInputs > 0 ? ((filledInputs / totalInputs) * 100).toFixed(1) : 0;

  return {
    filled: filledInputs,
    total: totalInputs,
    percentage: percentage,
  };
}

// Função de compatibilidade para código existente
async function deleteProjectLegacy(projectName) {
    // Tenta encontrar a obra do projeto
    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`);
    const obraName = projectBlock?.dataset.obraName;
    
    if (obraName) {
        return deleteProject(obraName, projectName);
    } else {
        console.error('❌ Não foi possível determinar a obra do projeto:', projectName);
        showSystemStatus("ERRO: Projeto não está associado a uma obra", "error");
    }
}

// Exportações para compatibilidade
window.saveObra = saveObra;
window.verifyObraData = verifyObraData;
window.deleteProject = deleteProjectLegacy;

export {
  fetchObras,
  salvarObra,
  atualizarObra,
  saveObra,
  deleteProject,
  deleteProjectLegacy,
  deleteObraFromServer,
  verifyObraData,
  calculateRoomCompletionStats,
}