import { ensureStringId, generateObraId } from '../../utils/id-generator.js';
import { waitForElement } from '../../utils/core-utils.js';

/**
 * Renderiza uma obra completa a partir dos dados carregados do servidor
 */
function renderObraFromData(obraData) {
    const obraName = obraData.nome;
    const obraId = ensureStringId(obraData.id);

    console.log(`🎯 Renderizando obra: ${obraName} (ID: ${obraId})`);

    createEmptyObra(obraName, obraId);

    if (obraData.projetos && obraData.projetos.length > 0) {
        const obraContent = document.getElementById(`obra-content-${obraId}`);

        if (obraContent) {
            const emptyMessage = obraContent.querySelector(".empty-message");
            if (emptyMessage) {
                emptyMessage.remove();
            }

            setTimeout(() => {
                obraData.projetos.forEach((projectData) => {
                    renderProjectFromData(projectData, obraId, obraName);
                });
            }, 100);
        }
    }

    console.log(`✅ Obra ${obraName} renderizada com sucesso (ID: ${obraId})`);
}

/**
 * Preenche os dados de uma obra a partir do JSON
 */
async function populateObraData(obraData) {
    if (!obraData || typeof obraData !== 'object') {
        console.error('❌ Dados inválidos recebidos para populateObraData:', obraData);
        return;
    }
    
    const hasValidId = obraData.id && obraData.id !== "" && obraData.id !== "null" && obraData.id !== "undefined";
    const hasValidName = obraData.nome && obraData.nome !== "" && obraData.nome !== "null" && obraData.nome !== "undefined";
    
    if (!hasValidId && !hasValidName) {
        console.error('❌ Dados da obra sem ID ou nome válido:', obraData);
        return;
    }

    const obraName = obraData.nome || `Obra-${obraData.id}`;
    const obraId = obraData.id;
    
    console.log(`🔄 Preenchendo obra "${obraName}" com dados do JSON`, { 
        id: obraId, 
        nome: obraName, 
        projetos: obraData.projetos?.length || 0 
    });

    let obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    
    if (!obraElement) {
        console.log(`🔨 Criando nova obra: "${obraName}"`);
        
        const obraHTML = buildObraHTML(obraName, obraId, true);
        
        const container = document.getElementById("projects-container");
        if (container) {
            container.insertAdjacentHTML("beforeend", obraHTML);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
            console.log(`✅ Obra criada no DOM: ${obraName} com botão "Atualizar Obra"`);
        } else {
            console.error('❌ Container de projetos não encontrado');
            return;
        }
    } else {
        console.log(`✅ Obra já existe no DOM: ${obraName}`, obraElement);
        updateObraButtonAfterSave(obraName, obraId);
    }

    if (!obraElement) {
        console.error(`❌ Elemento da obra não encontrado no DOM após criação: ${obraId}`);
        return;
    }

    console.log(`✅ Elemento da obra confirmado:`, {
        element: obraElement,
        dataset: obraElement.dataset
    });

    if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
        console.error('❌ Funções necessárias não disponíveis:', {
            createEmptyProject: typeof window.createEmptyProject,
            createEmptyRoom: typeof window.createEmptyRoom
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
            console.error('❌ Funções ainda não disponíveis após espera');
            return;
        }
    }

    console.log(`🔧 Funções disponíveis: createEmptyProject: function, createEmptyRoom: function`);

    const projectsContainer = obraElement.querySelector('.projects-container');
    if (projectsContainer) {
        const existingProjects = projectsContainer.querySelectorAll('.project-block');
        if (existingProjects.length > 0) {
            console.log(`🗑️ Removendo ${existingProjects.length} projetos existentes antes do preenchimento`);
            existingProjects.forEach(project => project.remove());
        }
    }

    const projetos = obraData.projetos || [];
    console.log(`📁 Processando ${projetos.length} projeto(s) para a obra "${obraName}"`);
    
    for (let i = 0; i < projetos.length; i++) {
        const projectData = projetos[i];
        if (!projectData || !projectData.nome) {
            console.warn(`⚠️ Projeto ${i} inválido ou sem nome:`, projectData);
            continue;
        }
        
        const projectName = projectData.nome;
        const projectId = projectData.id;
        
        console.log(`📁 [${i + 1}/${projetos.length}] Criando projeto: ${projectName} (ID: ${projectId})`);

        try {
            console.log(`🎯 Chamando createEmptyProject para obra "${obraName}" (${obraId}), projeto "${projectName}" (${projectId})`);
            
            const projectCreated = await window.createEmptyProject(obraId, obraName, projectId, projectName);
            
            if (!projectCreated) {
                console.error(`❌ Falha ao criar projeto ${projectName}`);
                continue;
            }

            const projectElement = await waitForElement(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`, 5000);
            
            if (!projectElement) {
                console.error(`❌ Projeto ${projectName} não encontrado no DOM após criação`);
                
                const allProjects = document.querySelectorAll('.project-block');
                console.log(`🔍 Projetos no DOM: ${allProjects.length}`);
                allProjects.forEach((proj, idx) => {
                    console.log(`  ${idx + 1}. Projeto: "${proj.dataset.projectName}", ID: "${proj.dataset.projectId}", Obra: "${proj.dataset.obraId}"`);
                });
                continue;
            }

            console.log(`✅ Projeto criado e encontrado: ${projectName}`, {
                element: projectElement,
                dataset: projectElement.dataset
            });

            await populateProjectData(projectElement, projectData, obraId, obraName);

        } catch (error) {
            console.error(`❌ Erro ao criar projeto ${projectName}:`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Obra "${obraName}" preenchida com sucesso - ${projetos.length} projeto(s) processado(s)`);
}

// EXPORTS NO FINAL
export {
    renderObraFromData,
    populateObraData
};