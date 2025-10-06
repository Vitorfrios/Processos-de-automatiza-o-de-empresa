import { 
  SESSION_STORAGE_KEY, 
  REMOVED_PROJECTS_KEY, 
  NORMALIZATION_DONE_KEY
} from '../config/config.js'
import { ensureStringId } from '../utils/utils.js'
import { fetchProjects, normalizeProjectIds, atualizarProjeto } from './projects.js'
import { showSystemStatus } from '../ui/interface.js'
import { renderProjectFromData, renderRoomFromData, populateRoomInputs } from './server-utils.js'

// CORREÇÃO 1: Inicialização robusta do GeralCount
function initializeGeralCount() {
  if (typeof window.GeralCount === 'undefined' || window.GeralCount === null) {
    window.GeralCount = 0;
    console.log("[v0] window.GeralCount inicializado como 0");
  }
  return window.GeralCount;
}

// Inicializar imediatamente
initializeGeralCount();

function removeBaseProjectFromHTML() {
  const projectsContainer = document.getElementById("projects-container")
  if (!projectsContainer) {
    console.error("[v0] Container de projetos não encontrado para remoção");
    return;
  }
  
  const existingProjects = projectsContainer.querySelectorAll(".project-block")
  console.log(`[v0] Removendo ${existingProjects.length} projetos base do HTML`);

  existingProjects.forEach((project) => {
    project.remove()
  })

  console.log("[v0] Projetos base do HTML removidos")
}

async function loadProjectsFromServer() {
  console.log("[v0] Verificando projetos da sessão atual...")

  const firstProjectId = sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (!firstProjectId) {
    console.log("[v0] Nenhum projeto salvo nesta sessão");
    // CORREÇÃO 2: Garantir que o projeto base seja criado
    setTimeout(() => {
      if (getGeralCount() === 0) {
        console.log("[v0] Nenhum projeto encontrado - criando projeto base");
        createSingleBaseProject();
      }
    }, 100);
    return;
  }

  console.log(`[v0] Carregando projetos a partir do ID ${firstProjectId}...`)

  const allProjects = await fetchProjects()

  if (allProjects.length === 0) {
    console.log("[v0] Nenhum projeto encontrado no servidor")
    // CORREÇÃO 3: Criar projeto base se não há projetos
    setTimeout(() => {
      if (getGeralCount() === 0) {
        createSingleBaseProject();
      }
    }, 100);
    return;
  }

  const sessionProjects = allProjects.filter((project) => {
    const isFromSession = project.id >= Number.parseInt(firstProjectId)
    const isNotRemoved = !isProjectRemoved(project.id)
    return isFromSession && isNotRemoved
  })

  if (sessionProjects.length === 0) {
    console.log("[v0] Nenhum projeto da sessão atual encontrado (ou todos foram removidos)")
    resetDisplayLogic()
    // CORREÇÃO 4: Criar projeto base após reset
    setTimeout(() => {
      createSingleBaseProject();
    }, 100);
    return;
  }

  console.log(`[v0] ${sessionProjects.length} projeto(s) da sessão atual encontrado(s)`)

  window.GeralCount = sessionProjects.length;
  console.log(`[v0] GeralCount definido como: ${window.GeralCount}`)

  removeBaseProjectFromHTML()

  for (const projectData of sessionProjects) {
    renderProjectFromData(projectData)
  }

  console.log("[v0] Todos os projetos da sessão foram carregados e renderizados")
}

// FUNÇÕES PARA GERENCIAR O CONTADOR - CORRIGIDAS
function incrementGeralCount() {
  initializeGeralCount(); // Garantir que está inicializado
  window.GeralCount++;
  console.log(`[v0] GeralCount incrementado para: ${window.GeralCount}`);
  return window.GeralCount;
}

function decrementGeralCount() {
  initializeGeralCount(); // Garantir que está inicializado
  
  if (window.GeralCount > 0) {
    window.GeralCount--;
    console.log(`[v0] GeralCount decrementado para: ${window.GeralCount}`);
    
    // VERIFICAR SE PRECISA RESETAR
    if (window.GeralCount === 0) {
      console.log("[v0] GeralCount chegou a ZERO - reiniciando lógica de exibição");
      resetDisplayLogic();
      // CORREÇÃO 5: Pequeno delay para garantir que o DOM está pronto
      setTimeout(() => {
        createSingleBaseProject();
      }, 50);
    }
  }
  return window.GeralCount;
}

function getGeralCount() {
  initializeGeralCount(); // Sempre garantir que está inicializado
  return window.GeralCount;
}

function resetDisplayLogic() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  sessionStorage.removeItem(REMOVED_PROJECTS_KEY)
  window.GeralCount = 0;
  console.log("[v0] Lógica de exibição reiniciada - próximo save será o novo ponto inicial")
}

// FUNÇÃO PARA CRIAR APENAS 1 PROJETO BASE - CORRIGIDA
function createSingleBaseProject() {
  console.log("[v0] Criando projeto base único...");
  
  const projectsContainer = document.getElementById("projects-container");
  if (!projectsContainer) {
    console.error("[v0] Container de projetos não encontrado");
    setTimeout(() => {
      const retryContainer = document.getElementById("projects-container");
      if (retryContainer) {
        console.log("[v0] Container encontrado na segunda tentativa");
        createProjectBaseHTML(retryContainer);
      } else {
        console.error("[v0] Container de projetos ainda não encontrado após retry");
      }
    }, 1000);
    return;
  }
  
  createProjectBaseHTML(projectsContainer);
}

function createProjectBaseHTML(container) {
  // Limpar container completamente
  container.innerHTML = '';
  
  // Criar apenas UM projeto base
  const projectHTML = `
    <div class="project-block" data-project-id="" data-project-name="Projeto1">
      <div class="project-header">
        <button class="minimizer" onclick="toggleProject('Projeto1')">+</button>
        <h2 class="project-title editable-title" data-editable="true" onclick="makeEditable(this, 'project')">Projeto1</h2>
        <div class="project-actions">
          <button class="btn btn-delete" onclick="deleteProject('Projeto1')">Remover</button>
        </div>
      </div>
      <div class="project-content collapsed" id="project-content-Projeto1">
        <p class="empty-message">Nenhuma sala adicionada ainda.</p>
        <div class="add-room-section">
          <button class="btn btn-add-secondary" onclick="addNewRoom('Projeto1')">+ Adicionar Nova Sala</button>
        </div>
        <div class="project-actions-footer">
          <button class="btn btn-verify" onclick="verifyProjectData('Projeto1')">Verificar Dados</button>
          <button class="btn btn-save project-save-btn" onclick="saveProject('Projeto1', event)" data-project-name="Projeto1">Salvar Projeto</button>
          <button class="btn btn-download" onclick="downloadPDF('Projeto1')">Baixar PDF</button>
          <button class="btn btn-download" onclick="downloadWord('Projeto1')">Baixar Word</button>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = projectHTML;
  
  // CORREÇÃO: CRIAR PRIMEIRA SALA AUTOMATICAMENTE
  setTimeout(() => {
    console.log("[v0] Criando primeira sala automaticamente para Projeto1");
    addNewRoom('Projeto1'); // ← ADICIONAR ESTA LINHA
  }, 800);
  
  // CORREÇÃO 7: Atualizar o contador após criar o projeto base
  window.GeralCount = 1;
  console.log("[v0] Projeto base único criado com sucesso - GeralCount: 1");
}

// MODIFICAR: Função saveFirstProjectIdOfSession para usar o contador
function saveFirstProjectIdOfSession(projectId) {
  const existingId = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!existingId) {
    const idAsInteger = ensureStringId(projectId)
    if (idAsInteger !== null) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, idAsInteger.toString())
      console.log(`[v0] Primeiro projeto da sessão salvo: ID ${idAsInteger}`)
      
      // CORREÇÃO 8: Usar incrementGeralCount em vez de setar diretamente
      incrementGeralCount();
    }
  }
}

// MODIFICAR: Função addProjectToRemovedList para decrementar contador
function addProjectToRemovedList(projectId) {
  projectId = ensureStringId(projectId)

  const removedList = getRemovedProjectsList()

  if (!removedList.includes(projectId)) {
    removedList.push(projectId)
    sessionStorage.setItem(REMOVED_PROJECTS_KEY, JSON.stringify(removedList))
    console.log(`[v0] Projeto ID ${projectId} adicionado à lista de removidos`)
    
    // DECREMENTAR CONTADOR
    decrementGeralCount();
  }
}

function getRemovedProjectsList() {
  const stored = sessionStorage.getItem(REMOVED_PROJECTS_KEY)
  return stored ? JSON.parse(stored) : []
}

function isProjectRemoved(projectId) {
  const removedList = getRemovedProjectsList()
  return removedList.includes(projectId)
}

function updateProjectButton(projectName, hasId) {
  const projectBlock = document.querySelector(`[data-project-name="${projectName}"]`)
  if (!projectBlock) {
    console.warn(`[v0] Projeto ${projectName} não encontrado para atualizar botão`);
    return;
  }

  const saveButton = projectBlock.querySelector(
    ".project-actions-footer .btn-save, .project-actions-footer .btn-update",
  )
  if (!saveButton) {
    console.warn(`[v0] Botão de save não encontrado no projeto ${projectName}`);
    return;
  }

  if (hasId) {
    saveButton.textContent = "Atualizar Projeto"
    saveButton.classList.remove("btn-save")
    saveButton.classList.add("btn-update")
    console.log(`[v0] Botão do projeto ${projectName} alterado para "Atualizar Projeto"`)
  } else {
    saveButton.textContent = "Salvar Projeto"
    saveButton.classList.remove("btn-update")
    saveButton.classList.add("btn-save")
    console.log(`[v0] Botão do projeto ${projectName} alterado para "Salvar Projeto"`)
  }
}

async function normalizeAllProjectsOnServer() {
  const alreadyNormalized = sessionStorage.getItem(NORMALIZATION_DONE_KEY)
  if (alreadyNormalized === "true") {
    console.log("[v0] IDs já foram normalizados nesta sessão")
    return
  }

  console.log("[v0] Iniciando normalização de IDs no servidor...")

  try {
    const allProjects = await fetchProjects()

    if (allProjects.length === 0) {
      console.log("[v0] Nenhum projeto para normalizar")
      sessionStorage.setItem(NORMALIZATION_DONE_KEY, "true")
      return
    }

    console.log(`[v0] Normalizando ${allProjects.length} projeto(s)...`)

    let normalizedCount = 0
    for (const project of allProjects) {
      const needsNormalization = typeof project.id === "string"

      if (needsNormalization) {
        const normalizedProject = normalizeProjectIds(project)
        const result = await atualizarProjeto(normalizedProject.id, normalizedProject)

        if (result) {
          normalizedCount++
          console.log(`[v0] Projeto ID ${normalizedProject.id} normalizado no servidor`)
        }
      }
    }

    if (normalizedCount > 0) {
      console.log(`[v0] ${normalizedCount} projeto(s) normalizado(s) no servidor`)
      showSystemStatus(`${normalizedCount} projeto(s) com IDs corrigidos no servidor`, "success")
    } else {
      console.log("[v0] Todos os projetos já estavam com IDs corretos")
    }

    sessionStorage.setItem(NORMALIZATION_DONE_KEY, "true")
  } catch (error) {
    console.error("[v0] Erro ao normalizar IDs no servidor:", error)
    showSystemStatus("ERRO: Não foi possível normalizar IDs no servidor", "error")
  }
}

// CORREÇÃO 9: Adicionar função de debug
function debugGeralCount() {
  console.log('=== DEBUG GERALCOUNT ===');
  console.log('- window.GeralCount:', window.GeralCount);
  console.log('- getGeralCount():', getGeralCount());
  console.log('- sessionStorage SESSION_STORAGE_KEY:', sessionStorage.getItem(SESSION_STORAGE_KEY));
  console.log('- Projetos no DOM:', document.querySelectorAll('.project-block').length);
  console.log('- Container encontrado:', !!document.getElementById('projects-container'));
}

// EXPORTAR AS NOVAS FUNÇÕES DO CONTADOR
export {
  loadProjectsFromServer,
  removeBaseProjectFromHTML,
  renderProjectFromData,
  renderRoomFromData,
  populateRoomInputs,
  normalizeAllProjectsOnServer,
  saveFirstProjectIdOfSession,
  addProjectToRemovedList,
  getRemovedProjectsList,
  isProjectRemoved,
  updateProjectButton,
  resetDisplayLogic,
  // NOVAS FUNÇÕES DO CONTADOR
  incrementGeralCount,
  decrementGeralCount,
  getGeralCount,
  createSingleBaseProject,
  debugGeralCount // Adicionar debug para testes
}