/**
 * interface.js - CORREÇÃO DO SISTEMA DE TOGGLE
 * SISTEMA CORRIGIDO COM IDs ÚNICOS
 */

import { 
    showSystemStatus,
    removeExistingStatusBanner,
    createStatusBanner,
    insertStatusBanner,
    scheduleStatusBannerRemoval,
} from './intr-files/status-manager.js'

import { 
    toggleElementVisibility,
    expandElement,
    collapseElement,
    calculateRoomCompletionStats,
    removeEmptyObraMessage,
    showEmptyObraMessageIfNeeded,
    removeEmptyProjectMessage,
    showEmptyProjectMessageIfNeeded,
} from './intr-files/ui-helpers.js'

import { 
    createEmptyObra,
    buildObraHTML,
    buildObraActionsFooter,
    insertObraIntoDOM,
    updateObraButtonAfterSave,
    deleteObra,
    getNextObraNumber,
    addNewObra,
} from './intr-files/obra-manager.js'

import { 
    createEmptyProject,
    buildProjectHTML,
    addNewProjectToObra,
    getNextProjectNumber,
} from './intr-files/project-manager.js'

import { createEmptyRoom } from '../data/modules/room-operations.js'

// Re-exportações para manter compatibilidade
export {
    showSystemStatus,
    removeExistingStatusBanner,
    createStatusBanner,
    insertStatusBanner,
    scheduleStatusBannerRemoval,
    toggleElementVisibility,
    expandElement,
    collapseElement,
    calculateRoomCompletionStats,
    removeEmptyObraMessage,
    showEmptyObraMessageIfNeeded,
    removeEmptyProjectMessage,
    showEmptyProjectMessageIfNeeded,
    createEmptyObra,
    buildObraHTML,
    buildObraActionsFooter,
    insertObraIntoDOM,
    updateObraButtonAfterSave,
    deleteObra,
    getNextObraNumber,
    addNewObra,
    createEmptyProject,
    buildProjectHTML,
    addNewProjectToObra,
    getNextProjectNumber,
    createEmptyRoom,
}

/**
 * Adiciona um novo projeto à obra mais recente
 * @returns {void}
 * 
 * @example
 * addNewProject() // Cria uma nova obra e adiciona um projeto nela
 */
function addNewProject() {
  addNewObra().then(() => {
    const obraNumber = getNextObraNumber() - 1
    const obraName = `Obra${obraNumber}`
    addNewProjectToObra(obraName)
  })
}

// =============================================================================
// SISTEMA DE TOGGLE CORRIGIDO - IDs ÚNICOS
// =============================================================================

/**
 * Alterna a visibilidade do conteúdo de uma obra (expandir/recolher) - CORREÇÃO COMPLETA
 * @param {string} obraId - ID único da obra a ser alternada
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 * 
 * @example
 * toggleObra('obra_a42', event) // Expande ou recolhe a obra com ID 'obra_a42'
 */
function toggleObra(obraId, event) {
    console.log(`🔧 Toggle Obra chamado: ${obraId}`);
    
    // ✅ CORREÇÃO: Validar ID único
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (toggleObra) interface.js [ID de obra inválido: ${obraId}]`);
        return;
    }
    
    // ✅ CORREÇÃO: Buscar APENAS por ID único
    const contentId = `obra-content-${obraId}`;
    const content = document.getElementById(contentId);
    
    if (!content) {
        console.error(`❌ Conteúdo da obra ${obraId} não encontrado`);
        console.log('🔍 Conteúdos de obra disponíveis:');
        document.querySelectorAll('[id^="obra-content-"]').forEach(content => {
            console.log(`  - ${content.id}`);
        });
        return;
    }

    const isCollapsed = content.classList.contains("collapsed");
    const minimizer = event.target;

    if (isCollapsed) {
        content.classList.remove("collapsed");
        minimizer.textContent = "−";
        console.log(`📂 Obra ${obraId} expandida`);
    } else {
        content.classList.add("collapsed");
        minimizer.textContent = "+";
        console.log(`📁 Obra ${obraId} recolhida`);
    }
}

/**
 * Alterna a visibilidade do conteúdo de um projeto (expandir/recolher) - CORREÇÃO COMPLETA
 * @param {string} projectId - ID único do projeto a ser alternado
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 * 
 * @example
 * toggleProject('obra_a42_proj1', event) // Expande ou recolhe o projeto com ID 'obra_a42_proj1'
 */
function toggleProject(projectId, event) {
    console.log(`🔧 Toggle Project chamado: ${projectId}`);
    
    // ✅ CORREÇÃO: Validar ID único
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
        console.error(`ERRO FALBACK (toggleProject) interface.js [ID de projeto inválido: ${projectId}]`);
        return;
    }
    
    // ✅ CORREÇÃO: Buscar APENAS por ID único
    const contentId = `project-content-${projectId}`;
    const content = document.getElementById(contentId);
    
    if (!content) {
        console.error(`❌ Conteúdo do projeto ${projectId} não encontrado`);
        console.log('🔍 Conteúdos de projeto disponíveis:');
        document.querySelectorAll('[id^="project-content-"]').forEach(content => {
            console.log(`  - ${content.id}`);
        });
        return;
    }

    const isCollapsed = content.classList.contains("collapsed");
    const minimizer = event.target;

    if (isCollapsed) {
        content.classList.remove("collapsed");
        minimizer.textContent = "−";
        console.log(`📂 Projeto ${projectId} expandido`);
    } else {
        content.classList.add("collapsed");
        minimizer.textContent = "+";
        console.log(`📁 Projeto ${projectId} recolhido`);
    }
}

/**
 * Alterna a visibilidade do conteúdo de uma sala (expandir/recolher) - CORREÇÃO COMPLETA
 * @param {string} roomId - ID único da sala
 * @param {Event} event - Evento de clique do usuário
 * @returns {void}
 * 
 * @example
 * toggleRoom('obra_a42_proj1_sala1', event) // Expande ou recolhe a sala com ID 'obra_a42_proj1_sala1'
 */
function toggleRoom(roomId, event) {
    console.log(`🔧 Toggle Sala chamado: ID ${roomId}`, event);
    
    // ✅ CORREÇÃO: Validar ID único
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`ERRO FALBACK (toggleRoom) interface.js [ID de sala inválido: ${roomId}]`);
        return;
    }
    
    // ✅ CORREÇÃO: Buscar APENAS por ID único
    const contentId = `room-content-${roomId}`;
    const content = document.getElementById(contentId);
    
    if (!content) {
        console.error(`❌ Conteúdo da sala ${roomId} não encontrado`);
        console.log(`🔍 Procurando por: ${contentId}`);
        console.log('🔍 Conteúdos de sala disponíveis:');
        document.querySelectorAll('[id^="room-content-"]').forEach(content => {
            console.log(`  - ${content.id}`);
        });
        return;
    }

    const isCollapsed = content.classList.contains("collapsed");
    const minimizer = event.target;

    console.log(`📂 Estado da sala ${roomId}: ${isCollapsed ? 'recolhida' : 'expandida'}`);

    if (isCollapsed) {
        content.classList.remove("collapsed");
        minimizer.textContent = "−";
        console.log(`📂 Sala ${roomId} EXPANDIDA`);
    } else {
        content.classList.add("collapsed");
        minimizer.textContent = "+";
        console.log(`📁 Sala ${roomId} RECOLHIDA`);
    }
}

/**
 * Alterna a visibilidade de uma seção
 * @param {string} sectionId - ID da seção
 * @returns {void}
 * 
 * @example
 * toggleSection('materiais') // Alterna visibilidade da seção de materiais
 */
function toggleSection(sectionId) {
    // ✅ CORREÇÃO: Validar ID
    if (!sectionId || sectionId === 'undefined' || sectionId === 'null') {
        console.error(`ERRO FALBACK (toggleSection) interface.js [ID de seção inválido: ${sectionId}]`);
        return;
    }
    toggleElementVisibility(`section-content-${sectionId}`, event.target);
}

/**
 * Alterna a visibilidade de uma subseção
 * @param {string} subsectionId - ID da subseção
 * @returns {void}
 * 
 * @example
 * toggleSubsection('pintura') // Alterna visibilidade da subseção de pintura
 */
function toggleSubsection(subsectionId) {
    // ✅ CORREÇÃO: Validar ID
    if (!subsectionId || subsectionId === 'undefined' || subsectionId === 'null') {
        console.error(`ERRO FALBACK (toggleSubsection) interface.js [ID de subseção inválido: ${subsectionId}]`);
        return;
    }
    toggleElementVisibility(`subsection-content-${subsectionId}`, event.target);
}

// =============================================================================
// FUNÇÕES DE DOWNLOAD E SALVAMENTO
// =============================================================================

/**
 * Gera e inicia o download de um PDF para uma obra ou projeto específico
 * @param {string} obraName - Nome da obra
 * @param {string|null} projectName - Nome do projeto (opcional)
 * @returns {void}
 * 
 * @example
 * downloadPDF('Obra1') // Gera PDF para a Obra1
 * downloadPDF('Obra1', 'ProjetoA') // Gera PDF para o ProjetoA da Obra1
 */
function downloadPDF(obraName, projectName = null) {
    const target = projectName ? `projeto ${projectName} da obra ${obraName}` : `obra ${obraName}`;
    console.log(`📄 Gerando PDF para ${target}`);
    showSystemStatus(`Gerando PDF para ${target}...`, "info");
}

/**
 * Gera e inicia o download de um documento Word para uma obra ou projeto específico
 * @param {string} obraName - Nome da obra
 * @param {string|null} projectName - Nome do projeto (opcional)
 * @returns {void}
 * 
 * @example
 * downloadWord('Obra1') // Gera Word para a Obra1
 * downloadWord('Obra1', 'ProjetoA') // Gera Word para o ProjetoA da Obra1
 */
function downloadWord(obraName, projectName = null) {
    const target = projectName ? `projeto ${projectName} da obra ${obraName}` : `obra ${obraName}`;
    console.log(`📝 Gerando Word para ${target}`);
    showSystemStatus(`Gerando documento Word para ${target}...`, "info");
}

/**
 * Salva ou atualiza os dados de uma obra no sistema
 * @param {string} obraName - Nome da obra a ser salva/atualizada
 * @param {Event} event - Evento que triggered a ação
 * @returns {void}
 * 
 * @example
 * saveOrUpdateObra('Obra1', event) // Salva/atualiza a Obra1
 */
function saveOrUpdateObra(obraName, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log(`💾 SALVANDO/ATUALIZANDO OBRA: "${obraName}"`);

    // ✅ CORREÇÃO: Buscar por nome (compatibilidade)
    const obraBlock = document.querySelector(`[data-obra-name="${obraName}"]`);
    if (!obraBlock) {
        console.error(`❌ Obra "${obraName}" não encontrada no DOM para salvar`);
        console.log('🔍 Obras disponíveis no DOM:');
        document.querySelectorAll('[data-obra-name]').forEach(obra => {
            console.log(`  - ${obra.dataset.obraName} (ID: ${obra.dataset.obraId})`);
        });
        showSystemStatus(`ERRO: Obra "${obraName}" não encontrada`, "error");
        return;
    }

    console.log(`✅ Obra encontrada no DOM:`, obraBlock.dataset);

    if (typeof window.saveObra === 'function') {
        window.saveObra(obraName, event);
    } else {
        console.error('❌ Função saveObra não encontrada no window');
        showSystemStatus("ERRO: Funcionalidade de salvar não disponível", "error");
    }
}

// =============================================================================
// FUNÇÕES DE EDIÇÃO (COMPATIBILIDADE)
// =============================================================================

/**
 * Torna um elemento editável - FUNÇÃO DE COMPATIBILIDADE
 * @param {HTMLElement} element - Elemento a ser editado
 * @param {string} type - Tipo do elemento ('obra', 'project', 'room')
 * @returns {void}
 */
function makeEditable(element, type) {
    console.log(`✏️ Tornando ${type} editável:`, element);
    // Implementação básica - pode ser expandida conforme necessário
    if (element.isContentEditable) {
        element.contentEditable = false;
        element.blur();
    } else {
        element.contentEditable = true;
        element.focus();
    }
}

/**
 * Verifica dados de uma obra - FUNÇÃO DE COMPATIBILIDADE
 * @param {string} obraName - Nome da obra a ser verificada
 * @returns {void}
 */
function verifyObraData(obraName) {
    console.log(`🔍 Verificando dados da obra: ${obraName}`);
    showSystemStatus(`Verificando dados da obra "${obraName}"...`, "info");
}

// =============================================================================
// EXPORTAÇÕES ADICIONAIS
// =============================================================================

export {
    addNewProject,
    toggleObra,
    toggleProject,
    toggleRoom,
    downloadPDF,
    downloadWord,
    saveOrUpdateObra,
    toggleSubsection,
    toggleSection,
    makeEditable,
    verifyObraData
}

// =============================================================================
// DISPONIBILIZAÇÃO GLOBAL DAS FUNÇÕES
// =============================================================================

if (typeof window !== 'undefined') {
    window.addNewObra = addNewObra;
    window.addNewProjectToObra = addNewProjectToObra;
    window.toggleObra = toggleObra;
    window.toggleProject = toggleProject;
    window.toggleRoom = toggleRoom;
    window.toggleSubsection = toggleSubsection;
    window.toggleSection = toggleSection;
    window.getNextObraNumber = getNextObraNumber;
    window.deleteObra = deleteObra;
    window.saveOrUpdateObra = saveOrUpdateObra;
    window.downloadPDF = downloadPDF;
    window.downloadWord = downloadWord;
    window.addNewProject = addNewProject;
    window.createEmptyProject = createEmptyProject;
    window.makeEditable = makeEditable;
    window.verifyObraData = verifyObraData;
}