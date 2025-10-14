import { UI_CONSTANTS } from "../config/config.js"
import { ensureStringId } from "../utils/utils.js"
import { showSystemStatus } from "../ui/interface.js"
import { buildProjectData } from "./data-utils.js"
import {
  incrementGeralCount,
  decrementGeralCount,
  getGeralCount,
  addProjectToRemovedList,
  saveFirstProjectIdOfSession,
  updateProjectButton,
} from "./server.js"

/**
 * Busca todos os projetos do servidor e normaliza os IDs
 * @returns {Promise<Array>} Lista de projetos normalizados
 */
async function fetchProjects() {
  try {
    const response = await fetch('/projetos')

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const projects = await response.json()

    const normalizedProjects = projects.map((project) => {
      if (project.id !== undefined && project.id !== null) {
        project.id = ensureStringId(project.id)
      }

      if (project.salas && Array.isArray(project.salas)) {
        project.salas = project.salas.map((sala) => {
          if (sala.id !== undefined && sala.id !== null) {
            sala.id = ensureStringId(sala.id)
          }
          return sala
        })
      }

      return project
    })

    return normalizedProjects
  } catch (error) {
    console.error("❌ Erro ao buscar projetos:", error)
    showSystemStatus("ERRO: Não foi possível carregar projetos", "error")
    return []
  }
}

/**
 * Obtém o próximo ID disponível para um novo projeto
 * @returns {Promise<number>} Próximo ID de projeto
 */
async function getNextProjectId() {
  const projects = await fetchProjects()

  if (projects.length === 0) {
    return ensureStringId(UI_CONSTANTS.INITIAL_PROJECT_ID)
  }

  const maxId = Math.max(...projects.map((p) => Number(p.id) || 0))
  const nextId = maxId >= UI_CONSTANTS.INITIAL_PROJECT_ID ? maxId + 1 : UI_CONSTANTS.INITIAL_PROJECT_ID
  return ensureStringId(nextId)
}

/**
 * Inicializa o contador de projetos baseado nos projetos existentes no DOM
 */
async function initializeProjectCounter() {
  const projects = document.querySelectorAll(".project-block")

  if (projects.length === 0) {
    window.projectCounter = 0
    return
  }

  const projectNumbers = Array.from(projects)
    .map((project) => {
      const match = project.dataset.projectName.match(/Projeto(\d+)/)
      return match ? Number.parseInt(match[1]) : 0
    })
    .filter((num) => num > 0)

  const maxProjectNumber = projectNumbers.length > 0 ? Math.max(...projectNumbers) : 0
  window.projectCounter = maxProjectNumber
}

/**
 * Retorna o próximo número de projeto disponível
 * @returns {number} Próximo número de projeto
 */
function getNextProjectNumber() {
  if (typeof window.projectCounter === "undefined") {
    window.projectCounter = 0
  }
  window.projectCounter++
  return window.projectCounter
}

/**
 * Normaliza todos os IDs de um projeto (projeto e salas)
 * @param {Object} projectData - Dados do projeto
 * @returns {Object} Projeto com IDs normalizados
 */
function normalizeProjectIds(projectData) {
  if (projectData.id !== undefined && projectData.id !== null) {
    projectData.id = ensureStringId(projectData.id)
  }

  if (projectData.salas && Array.isArray(projectData.salas)) {
    projectData.salas.forEach((sala) => {
      if (sala.id !== undefined && sala.id !== null) {
        sala.id = ensureStringId(sala.id)
      }
    })
  }

  return projectData
}

/**
 * Salva um novo projeto no servidor
 * @param {Object} projectData - Dados do projeto a ser salvo
 * @returns {Promise<Object|null>} Projeto criado ou null em caso de erro
 */
async function salvarProjeto(projectData) {
  try {
    if (!projectData.id) {
      projectData.id = await getNextProjectId()
    }

    projectData = normalizeProjectIds(projectData)

    console.log('📤 SALVANDO NOVO PROJETO:', {
      id: projectData.id,
      nome: projectData.nome,
      salas: projectData.salas?.length || 0,
      timestamp: projectData.timestamp
    });

    const response = await fetch('/projetos', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro ao salvar projeto: ${errorText}`)
    }

    const createdProject = await response.json()
    createdProject.id = ensureStringId(createdProject.id)
    showSystemStatus("Projeto salvo com sucesso!", "success")
    
    console.log('✅ NOVO PROJETO SALVO:', createdProject);
    return createdProject
  } catch (error) {
    console.error("❌ Erro ao SALVAR projeto:", error)
    showSystemStatus("ERRO: Não foi possível salvar o projeto", "error")
    return null
  }
}

/**
 * Atualiza um projeto existente no servidor
 * @param {string|number} projectId - ID do projeto
 * @param {Object} projectData - Dados atualizados do projeto
 * @returns {Promise<Object|null>} Projeto atualizado ou null em caso de erro
 */
async function atualizarProjeto(projectId, projectData) {
  try {
    projectId = ensureStringId(projectId)

    if (!projectId) {
      console.error("❌ ERRO: ID do projeto inválido para atualização")
      showSystemStatus("ERRO: ID do projeto inválido para atualização", "error")
      return null
    }

    projectData = normalizeProjectIds(projectData)
    projectData.id = projectId

    console.log('🔄 ATUALIZANDO PROJETO EXISTENTE:', {
      id: projectData.id,
      nome: projectData.nome,
      salas: projectData.salas?.length || 0,
      dadosPorSala: projectData.salas?.map(sala => ({
        nome: sala.nome,
        inputs: Object.keys(sala.inputs || {}).length,
        maquinas: sala.maquinas?.length || 0,
        capacidade: Object.keys(sala.capacidade || {}).length,
        ganhosTermicos: Object.keys(sala.ganhosTermicos || {}).length,
        configuracao: Object.keys(sala.configuracao || {}).length
      }))
    });

    const url = `/projetos/${projectId}`

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro ao atualizar projeto: ${errorText}`)
    }

    const updatedProject = await response.json()
    updatedProject.id = ensureStringId(updatedProject.id)
    showSystemStatus("Projeto atualizado com sucesso!", "success")
    
    console.log('✅ PROJETO ATUALIZADO:', updatedProject);
    return updatedProject
  } catch (error) {
    console.error("❌ Erro ao ATUALIZAR projeto:", error)
    showSystemStatus("ERRO: Não foi possível atualizar o projeto", "error")
    return null
  }
}

/**
 * Salva ou atualiza um projeto (função principal chamada pela interface)
 * @param {string} projectName - Nome do projeto
 * @param {Event} event - Evento do clique
 */
async function saveProject(projectName, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log(`💾 INICIANDO SALVAMENTO do projeto: "${projectName}"`);

    const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`);
    if (!projectBlock) {
        console.error('❌ Projeto não encontrado:', projectName);
        showSystemStatus("ERRO: Projeto não encontrado na interface", "error");
        return;
    }

    // Construir dados do projeto
    console.log('🔨 Construindo dados do projeto...');
    const projectData = buildProjectData(projectBlock);

    if (!projectData) {
        console.error('❌ Falha ao construir dados do projeto');
        showSystemStatus("ERRO: Falha ao construir dados do projeto", "error");
        return;
    }

    // VALIDAÇÃO DOS DADOS CONSTRUÍDOS
    console.log('📋 VALIDAÇÃO DOS DADOS:');
    console.log('- Nome do projeto:', projectData.nome);
    console.log('- ID atual:', projectData.id);
    console.log('- Número de salas:', projectData.salas?.length || 0);
    
    if (projectData.salas && projectData.salas.length > 0) {
        projectData.salas.forEach((sala, index) => {
            console.log(`  Sala ${index + 1} "${sala.nome}":`, {
                inputs: Object.keys(sala.inputs || {}).length,
                maquinas: sala.maquinas?.length || 0,
                capacidade: Object.keys(sala.capacidade || {}).length,
                ganhosTermicos: Object.keys(sala.ganhosTermicos || {}).length,
                configuracao: Object.keys(sala.configuracao || {}).length
            });
        });
    }

    // DETERMINAR SE É NOVO PROJETO (CORRIGIDO)
    const projectIdFromDOM = projectBlock.dataset.projectId;
    const hasValidId = projectData.id && 
                      projectData.id !== 'null' && 
                      projectData.id !== 'undefined' && 
                      !projectData.id.startsWith('temp-');
    
    const isNewProject = !hasValidId && !projectIdFromDOM;

    console.log('🔍 VERIFICAÇÃO DE PROJETO NOVO:');
    console.log('- ID nos dados:', projectData.id);
    console.log('- ID no DOM:', projectIdFromDOM);
    console.log('- Tem ID válido?:', hasValidId);
    console.log('- É novo projeto?:', isNewProject);

    let result = null;
    
    if (isNewProject) {
        console.log('🆕 SALVANDO COMO NOVO PROJETO');
        result = await salvarProjeto(projectData);
    } else {
        // Usar ID do DOM se disponível, caso contrário usar ID dos dados
        const finalId = projectIdFromDOM || projectData.id;
        console.log('📝 ATUALIZANDO PROJETO EXISTENTE, ID:', finalId);
        result = await atualizarProjeto(finalId, projectData);
    }

    if (result) {
        const finalId = ensureStringId(result.id);
        
        // ATUALIZAR DOM COM O ID CORRETO
        projectBlock.dataset.projectId = finalId;
        projectBlock.dataset.projectName = projectData.nome;
        
        // Atualizar título se necessário
        const titleElement = projectBlock.querySelector('.project-title');
        if (titleElement && titleElement.textContent !== projectData.nome) {
            titleElement.textContent = projectData.nome;
        }

        updateProjectButton(projectName, true);
        saveFirstProjectIdOfSession(finalId);

        if (isNewProject) {
            incrementGeralCount();
        }

        collapseProjectAfterSave(projectName, projectBlock);
        
        console.log(`✅ PROJETO SALVO COM SUCESSO! ID: ${finalId}`);
        
        // Log final para debug
        console.log('🎯 ESTADO FINAL DO PROJETO:', {
            id: finalId,
            nome: projectData.nome,
            salas: projectData.salas?.length || 0,
            timestamp: projectData.timestamp
        });
    } else {
        console.error('❌ FALHA AO SALVAR PROJETO NO SERVIDOR');
        showSystemStatus("ERRO: Falha ao salvar projeto no servidor", "error");
    }
}

/**
 * Colapsa o projeto após salvar
 * @param {string} projectName - Nome do projeto
 * @param {HTMLElement} projectBlock - Elemento do projeto
 */
function collapseProjectAfterSave(projectName, projectBlock) {
  const projectContent = document.getElementById(`project-content-${projectName}`)
  const minimizer = projectBlock.querySelector(".project-header .minimizer")

  if (projectContent && !projectContent.classList.contains(UI_CONSTANTS.COLLAPSED_CLASS)) {
    collapseElement(projectContent, minimizer)
  }
}

/**
 * Deleta um projeto da interface
 * @param {string} projectName - Nome do projeto a ser deletado
 */
function deleteProject(projectName) {
  const confirmMessage = "Tem certeza que deseja deletar este projeto? Os dados permanecerão no servidor."

  if (!confirm(confirmMessage)) return

  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  if (!projectBlock) return

  const projectId = projectBlock.dataset.projectId ? ensureStringId(projectBlock.dataset.projectId) : null

  projectBlock.remove()

  if (projectId) {
    addProjectToRemovedList(projectId)
  } else {
    decrementGeralCount()
  }

  setTimeout(() => {
    const remainingProjects = document.querySelectorAll(".project-block")
    if (remainingProjects.length === 0 && getGeralCount() === 0) {
      // Lógica para quando não há projetos
    }
  }, 200)
}

/**
 * Verifica os dados de um projeto e gera relatório
 * @param {string} projectName - Nome do projeto
 */
function verifyProjectData(projectName) {
  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  if (!projectBlock) return

  const rooms = projectBlock.querySelectorAll(".room-block")

  const report = generateProjectVerificationReport(rooms)

  alert(report)
}

/**
 * Gera relatório de verificação do projeto
 * @param {NodeList} rooms - Lista de salas do projeto
 * @returns {string} Relatório formatado
 */
function generateProjectVerificationReport(rooms) {
  let report = `Verificação do Projeto:\n\n`
  report += `Total de salas: ${rooms.length}\n\n`

  rooms.forEach((room) => {
    const roomName = room.querySelector(".room-title")?.textContent || "Sala sem nome"
    const stats = calculateRoomCompletionStats(room)

    report += `${roomName}: ${stats.filled}/${stats.total} campos preenchidos (${stats.percentage}%)\n`
  })

  return report
}

/**
 * Calcula estatísticas de preenchimento de uma sala
 * @param {HTMLElement} room - Elemento da sala
 * @returns {Object} Estatísticas de preenchimento
 */
function calculateRoomCompletionStats(room) {
  const inputs = room.querySelectorAll(".form-input")
  const filledInputs = Array.from(inputs).filter((input) => input.value.trim() !== "").length
  const totalInputs = inputs.length
  const percentage = totalInputs > 0 ? ((filledInputs / totalInputs) * 100).toFixed(1) : 0

  return {
    filled: filledInputs,
    total: totalInputs,
    percentage: percentage,
  }
}

/**
 * Colapsa um elemento na interface
 * @param {HTMLElement} element - Elemento a ser colapsado
 * @param {HTMLElement} minimizerElement - Botão minimizador
 */
function collapseElement(element, minimizerElement) {
  if (!element || !minimizerElement) return

  element.classList.add(UI_CONSTANTS.COLLAPSED_CLASS)
  minimizerElement.textContent = UI_CONSTANTS.MINIMIZED_SYMBOL
}

export {
  fetchProjects,
  getNextProjectId,
  getNextProjectNumber,
  initializeProjectCounter,
  normalizeProjectIds,
  salvarProjeto,
  atualizarProjeto,
  saveProject,
  collapseProjectAfterSave,
  deleteProject,
  verifyProjectData,
  generateProjectVerificationReport,
  calculateRoomCompletionStats,
}