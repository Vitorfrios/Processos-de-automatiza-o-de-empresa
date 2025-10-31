// projects.js
import { ensureStringId } from "../utils/utils.js"
import { buildObraData } from "./data-utils.js"
import { showSystemStatus} from '../ui/intr-files/status-manager.js'
import{ updateObraButtonAfterSave } from "../ui/intr-files/obra-manager.js"
import { isSessionActive, startSessionOnFirstSave } from "./server.js";

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
 * Atualiza uma obra existente no servidor
 * @param {string|number} obraId - ID da obra
 * @param {Object} obraData - Dados atualizados da obra
 * @returns {Promise<Object|null>} Obra atualizada ou null em caso de erro
 */
async function atualizarObra(obraId, obraData) {
  try {
    // ✅ CORREÇÃO: Validar ID seguro antes de processar
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
      console.error(`ERRO FALBACK (atualizarObra) projects.js [ID de obra inválido: ${obraId}]`);
      showSystemStatus("ERRO: ID da obra inválido para atualização", "error");
      return null;
    }

    // Só atualizar se sessão estiver ativa
    if (!isSessionActive()) {
      console.warn("⚠️ Sessão não está ativa - obra não será atualizada");
      showSystemStatus("ERRO: Sessão não está ativa. Obra não atualizada.", "error");
      return null;
    }

    obraId = ensureStringId(obraId);

    console.log(`🔍 Verificando se obra ${obraId} existe no servidor...`);
    
    // Buscar TODAS as obras usando o novo endpoint
    const todasObrasResponse = await fetch('/api/backup-completo');
    if (!todasObrasResponse.ok) {
      throw new Error('Falha ao carregar backup para verificação');
    }
    
    const backupData = await todasObrasResponse.json();
    const todasObras = backupData.obras || [];
    const obraExistente = todasObras.find(obra => String(obra.id) === String(obraId));
    
    console.log(`📊 Verificação: Obra ${obraId} existe? ${!!obraExistente}`);
    console.log(`📋 TODAS as obras no backup:`, todasObras.map(o => ({ id: o.id, nome: o.nome })));

    if (!obraExistente) {
      console.log(`❌ Obra ${obraId} não encontrada no backup, criando nova...`);

      // ✅ CORREÇÃO: Se obra não existe, criar como nova preservando ID seguro
      console.log(`🆕 Criando nova obra com ID seguro preservado: ${obraId}`);
      obraData.id = obraId; // ✅ PRESERVAR ID SEGUR
      return await salvarObra(obraData);
    }

    // ✅ CORREÇÃO: Garantir que o ID nos dados seja o correto (já está correto)
    console.log('🔄 ATUALIZANDO OBRA EXISTENTE:', {
      id: obraData.id,
      nome: obraData.nome,
      projetos: obraData.projetos?.length || 0
    });

    // Usar PUT para /obras/{id}
    const url = `/obras/${obraId}`;
    console.log(`🎯 Fazendo PUT para: ${url}`);
    
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
    
    console.log('✅ OBRA ATUALIZADA:', {
      id: updatedObra.id,
      nome: updatedObra.nome,
      projetos: updatedObra.projetos?.length || 0
    });
    return updatedObra;
  } catch (error) {
    console.error("❌ Erro ao ATUALIZAR obra:", error);
    showSystemStatus("ERRO: Não foi possível atualizar a obra", "error");
    return null;
  }
}

/**
 * Salva uma nova obra no servidor e adiciona à sessão atual
 * @param {Object} obraData - Dados da obra a ser salva
 * @returns {Promise<Object|null>} Obra criada ou null em caso de erro
 */
async function salvarObra(obraData) {
  try {
    // ✅ CORREÇÃO: Validar dados da obra antes de salvar
    if (!obraData || !obraData.nome) {
      console.error(`ERRO FALBACK (salvarObra) projects.js [Dados da obra inválidos: ${JSON.stringify(obraData)}]`);
      showSystemStatus("ERRO: Dados da obra inválidos", "error");
      return null;
    }

    // Só salvar se sessão estiver ativa
    if (!isSessionActive()) {
      console.warn("⚠️ Sessão não está ativa - obra não será salva");
      showSystemStatus("ERRO: Sessão não está ativa. Obra não salva.", "error");
      return null;
    }

    // ✅ CORREÇÃO: Garantir que obra tenha ID seguro
    if (!obraData.id || obraData.id === 'undefined' || obraData.id === 'null') {
      console.error(`ERRO FALBACK (salvarObra) projects.js [Obra sem ID seguro: ${obraData.id}]`);
      showSystemStatus("ERRO: Obra não possui ID válido", "error");
      return null;
    }

    console.log('📤 SALVANDO NOVA OBRA:', {
      id: obraData.id,
      nome: obraData.nome,
      projetos: obraData.projetos?.length || 0,
      timestamp: obraData.timestamp
    });

    // Sempre usar POST para nova obra
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
    
    // Adicionar obra à sessão
    console.log(`📝 Adicionando obra ${createdObra.id} à sessão...`);
    await fetch('/api/sessions/add-obra', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obra_id: createdObra.id })
    });
    
    showSystemStatus("Obra salva com sucesso!", "success");
    
    console.log('✅ NOVA OBRA SALVA E ADICIONADA À SESSÃO:', {
      id: createdObra.id,
      nome: createdObra.nome,
      projetos: createdObra.projetos?.length || 0
    });
    return createdObra;
  } catch (error) {
    console.error("❌ Erro ao SALVAR obra:", error);
    showSystemStatus("ERRO: Não foi possível salvar a obra", "error");
    return null;
  }
}


/**
 * Encontra o elemento HTML de uma obra pelo ID
 * @param {string} obraId - ID da obra a ser encontrada
 * @returns {HTMLElement|null} Elemento da obra ou null se não encontrado
 */
function findObraBlock(obraId) {
    console.log(`🔍 Buscando obra pelo ID: "${obraId}"`);
    
    // ✅ CORREÇÃO: Buscar APENAS por ID único
    // 1. Tentar pelo ID exato (mais específico)
    let obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (obraBlock) {
        console.log(`✅ Obra encontrada por ID exato: "${obraId}"`);
        return obraBlock;
    }
    
    
    // 3. Listar todas as obras disponíveis para debug
    const todasObras = document.querySelectorAll('[data-obra-id]');
    console.log(`📋 Obras encontradas no DOM: ${todasObras.length}`);
    
    todasObras.forEach((obra, index) => {
        console.log(`  ${index + 1}.`, {
            id: obra.dataset.obraId,
            name: obra.dataset.obraName,
            classes: obra.className
        });
    });
    
    // ❌ REMOVIDO: NUNCA retornar obra errada como fallback
    console.log(`❌ Obra com ID "${obraId}" não encontrada no DOM`);
    return null;
}


/**
 * Aguarda até que um elemento esteja disponível no DOM
 * @param {string} selector - Seletor do elemento
 * @param {number} timeout - Timeout em milissegundos
 * @returns {Promise<HTMLElement>}
 */
function waitForElement(selector, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function check() {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Elemento encontrado: ${selector}`);
                resolve(element);
                return;
            }
            
            if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout: Elemento não encontrado - ${selector}`));
                return;
            }
            
            setTimeout(check, 100);
        }
        
        check();
    });
}

/**
 * Verifica se uma obra existe no DOM com retry
 * @param {string} obraId - ID da obra
 * @param {number} maxAttempts - Número máximo de tentativas
 * @returns {Promise<HTMLElement|null>}
 */
async function findObraBlockWithRetry(obraId, maxAttempts = 10) {
    console.log(`🔍 Buscando obra com retry: "${obraId}"`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
        
        if (obraBlock) {
            console.log(`✅ Obra encontrada na tentativa ${attempt}/${maxAttempts}`);
            return obraBlock;
        }
        
        console.log(`⏳ Tentativa ${attempt}/${maxAttempts} - obra não encontrada, aguardando...`);
        
        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    console.log(`❌ Obra não encontrada após ${maxAttempts} tentativas`);
    return null;
}






/**
 * Salva ou atualiza uma obra no servidor (função principal)
 * @param {string} obraId - ID da obra
 * @param {Event} event - Evento do clique
 * @returns {Promise<void>}
 */
async function saveObra(obraId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log(`💾 SALVANDO OBRA pelo ID: "${obraId}"`);

    // ✅ CORREÇÃO 1: AGUARDAR obra estar no DOM antes de qualquer operação
    console.log(`⏳ Aguardando obra "${obraId}" estar no DOM...`);
    
    let obraBlock = await findObraBlockWithRetry(obraId, 15);
    
    if (!obraBlock) {
        console.error('❌ Obra não encontrada no DOM após múltiplas tentativas:', obraId);
        
        // Debug detalhado
        const todasObras = document.querySelectorAll('[data-obra-id]');
        console.log('📋 Obras disponíveis no DOM:', Array.from(todasObras).map(o => ({
            id: o.dataset.obraId,
            name: o.dataset.obraName
        })));
        
        showSystemStatus("ERRO: Obra não encontrada na interface", "error");
        return;
    }

    // ✅ CORREÇÃO CRÍTICA: SALVAR REFERÊNCIA ANTES de buildObraData
    const obraOriginalReference = obraBlock;
    const obraContainer = obraBlock.parentElement;
    
    console.log('🔒 REFERÊNCIA SALVA:', {
        obra: obraOriginalReference,
        container: obraContainer,
        obraNoContainer: obraContainer.contains(obraOriginalReference)
    });

    // ✅ CORREÇÃO 2: Verificar se a sessão está ativa APÓS confirmar que a obra existe
    if (!isSessionActive()) {
        console.log("🆕 Iniciando sessão para primeira obra...");
        await startSessionOnFirstSave();
    }

    // Log para sessão ativa
    if (!isSessionActive()) {
        console.warn("⚠️ Sessão não está ativa - obra não será salva");
        showSystemStatus("ERRO: Sessão não está ativa. Obra não salva.", "error");
        return;
    }

    console.log('✅ Obra confirmada no DOM:', {
        element: obraBlock,
        dataset: obraBlock.dataset,
        id: obraBlock.dataset.obraId,
        name: obraBlock.dataset.obraName
    });

    console.log('🔨 Construindo dados da obra...');
    const obraData = buildObraData(obraBlock);

    if (!obraData) {
        console.error('❌ Falha ao construir dados da obra');
        showSystemStatus("ERRO: Falha ao construir dados da obra", "error");
        return;
    }

    // ✅ CORREÇÃO 3: Lógica MELHORADA para determinar se é nova obra
    const obraIdFromDOM = obraBlock.dataset.obraId;
    const obraIdFromData = obraData.id;
    
    // ✅ VERIFICAÇÃO MAIS ROBUSTA - usar o ID que veio do DOM como fonte da verdade
    const finalObraId = obraIdFromDOM || obraIdFromData;
    
    console.log('🔍 VERIFICAÇÃO DE OBRA MELHORADA:');
    console.log('- ID no DOM:', obraIdFromDOM);
    console.log('- ID nos dados:', obraIdFromData);
    console.log('- ID final para uso:', finalObraId);
    console.log('- É ID seguro?:', finalObraId?.startsWith('obra_'));
    
    // ✅ CORREÇÃO: Determinar se é nova obra baseado na presença no servidor
    let isNewObra = true; // Assume que é nova por padrão
    
    try {
        // Verificar se a obra já existe no servidor
        const todasObrasResponse = await fetch('/api/backup-completo');
        if (todasObrasResponse.ok) {
            const backupData = await todasObrasResponse.json();
            const todasObras = backupData.obras || [];
            const obraExistente = todasObras.find(obra => String(obra.id) === String(finalObraId));
            
            isNewObra = !obraExistente;
            console.log(`- Já existe no servidor?: ${!isNewObra}`);
        }
    } catch (error) {
        console.log('- Não foi possível verificar servidor, assumindo como nova obra');
    }

    console.log('- É nova obra?:', isNewObra);

    let result = null;
    
    if (isNewObra) {
        console.log('🆕 SALVANDO COMO NOVA OBRA COM ID SEGURO:', finalObraId);
        
        // ✅ CORREÇÃO: Garantir que obraData tenha o ID correto
        obraData.id = finalObraId;
        
        if (!obraData.id || !obraData.id.startsWith('obra_')) {
            console.error('❌ Obra não possui ID seguro válido para salvar');
            showSystemStatus("ERRO: Obra não possui ID válido", "error");
            return;
        }
        
        result = await salvarObra(obraData);
    } else {
        console.log('📝 ATUALIZANDO OBRA EXISTENTE, ID SEGURO:', finalObraId);
        
        // ✅ CORREÇÃO: Validar ID seguro antes de atualizar
        if (!finalObraId.startsWith('obra_')) {
            console.error(`ERRO: ID não seguro para atualização: ${finalObraId}`);
            showSystemStatus("ERRO: ID da obra inválido para atualização", "error");
            return;
        }
        
        result = await atualizarObra(finalObraId, obraData);
    }

    if (result) {
        const finalId = ensureStringId(result.id);
        
        // ✅ CORREÇÃO CRÍTICA: VERIFICAR SE OBRA AINDA EXISTE NO DOM
        let obraBlockAtual = document.querySelector(`[data-obra-id="${finalId}"]`);
        
        if (!obraBlockAtual) {
            console.error('❌ CRÍTICO: Obra desapareceu do DOM durante salvamento!');
            console.log('🔍 Tentando recuperar da referência original...');
            
            // Tentar recuperar do container original
            if (obraContainer && document.body.contains(obraContainer)) {
                const obrasNoContainer = obraContainer.querySelectorAll('[data-obra-id]');
                console.log(`📦 Obras no container original: ${obrasNoContainer.length}`);
                
                // Se a obra original ainda existe no container
                if (obraContainer.contains(obraOriginalReference)) {
                    obraBlockAtual = obraOriginalReference;
                    console.log('✅ Obra recuperada da referência original');
                } else {
                    console.error('❌ Obra não está mais no container original');
                    showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
                    return;
                }
            } else {
                console.error('❌ Container original não encontrado');
                showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
                return;
            }
        }

        // ✅ ATUALIZAR DOM com o ID seguro correto
        obraBlockAtual.dataset.obraId = finalId;
        obraBlockAtual.dataset.obraName = obraData.nome;
        
        // Atualizar título se necessário
        const titleElement = obraBlockAtual.querySelector('.obra-title');
        if (titleElement && titleElement.textContent !== obraData.nome) {
            titleElement.textContent = obraData.nome;
        }

        // ✅ CORREÇÃO: VERIFICAR NOVAMENTE antes de atualizar botão
        if (typeof updateObraButtonAfterSave === 'function' && document.body.contains(obraBlockAtual)) {
            console.log("✅ Obra confirmada no DOM, atualizando botão...");
            updateObraButtonAfterSave(obraData.nome, finalId);
        } else {
            console.error('❌ Obra não está no DOM para atualizar botão');
        }

        console.log(`✅ OBRA SALVA/ATUALIZADA COM SUCESSO! ID SEGURO: ${finalId}`);
        
        showSystemStatus("Obra salva com sucesso!", "success");
    } else {
        console.error('❌ FALHA AO SALVAR OBRA NO SERVIDOR');
        showSystemStatus("ERRO: Falha ao salvar obra no servidor", "error");
    }
}


/**
 * Deleta uma obra do servidor
 * @param {string} obraName - Nome da obra
 * @param {string} obraId - ID da obra
 * @returns {Promise<void>}
 */
async function deleteObraFromServer(obraName, obraId) {
  try {
    // ✅ CORREÇÃO: Validar ID seguro antes de deletar
    if (!obraId || obraId === 'undefined' || obraId === 'null' || !obraId.startsWith('obra_')) {
      console.error(`ERRO FALBACK (deleteObraFromServer) projects.js [ID de obra inválido: ${obraId}]`);
      showSystemStatus("ERRO: ID da obra inválido para remoção", "error");
      return;
    }

    if (!isSessionActive()) {
      console.warn("⚠️ Sessão não está ativa - obra não será removida do servidor");
      return;
    }

    obraId = ensureStringId(obraId);

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
 * Verifica os dados de uma obra e gera relatório de completude
 * @param {string} obraId - ID da obra
 * @returns {void}
 */
function verifyObraData(obraId) {
  const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
  if (!obraBlock) {
    console.error(`❌ Obra com ID "${obraId}" não encontrada para verificação`);
    alert(`ERRO: Obra com ID "${obraId}" não encontrada`);
    return;
  }

  const obraName = obraBlock.dataset.obraName;
  const projects = obraBlock.querySelectorAll(".project-block");
  let totalRooms = 0;
  
  let report = `Verificação da Obra "${obraName}" (ID: ${obraId}):\n\n`;
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

  console.log(`🔍 Relatório gerado para obra: ${obraName} (ID: ${obraId})`);
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


// Exportações para compatibilidade
window.saveObra = saveObra;
window.verifyObraData = verifyObraData;

export {
  fetchObras,
  salvarObra,
  atualizarObra,
  saveObra,

  deleteObraFromServer,
  verifyObraData,
  calculateRoomCompletionStats,
  findObraBlock,
}