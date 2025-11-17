import { ensureStringId } from '../../utils/id-generator.js';
import { waitForElement } from '../../utils/core-utils.js';

/**
 * Renderiza um projeto completo a partir dos dados carregados
 */
function renderProjectFromData(projectData, obraId = null, obraName = null) {
    const projectName = projectData.nome;
    const projectId = ensureStringId(projectData.id);

    console.log(`🎯 Renderizando projeto: ${projectName} (ID: ${projectId})`);

    if (!obraId) {
        const existingProject = document.querySelector(`[data-project-id="${projectId}"]`);
        obraId = existingProject?.dataset.obraId;
        obraName = existingProject?.dataset.obraName;
    }

    if (!obraId) {
        const obras = document.querySelectorAll('.obra-block');
        if (obras.length > 0) {
            const primeiraObra = obras[0];
            obraId = primeiraObra.dataset.obraId;
            obraName = primeiraObra.dataset.obraName;
        } else {
            obraName = 'Obra1';
            obraId = generateObraId();
            createEmptyObra(obraName, obraId);
        }
    }

    createEmptyProject(obraId, obraName, projectId, projectName);

    if (projectData.salas && projectData.salas.length > 0) {
        const projectContent = document.getElementById(`project-content-${projectId}`);

        if (projectContent) {
            const emptyMessage = projectContent.querySelector(".empty-message");
            if (emptyMessage) {
                emptyMessage.remove();
            }

            setTimeout(() => {
                projectData.salas.forEach((roomData) => {
                    renderRoomFromData(projectId, projectName, roomData, obraId, obraName);
                });
            }, 100);
        }
    }

    if (projectId) {
        updateProjectButton(projectName, true);
    }

    console.log(`✅ Projeto ${projectName} renderizado com sucesso`);
}

/**
 * Preenche os dados de um projeto a partir do JSON
 */
async function populateProjectData(projectElement, projectData, obraId, obraName) {
    const projectName = projectData.nome;
    const projectId = projectData.id;
    
    console.log(`🎯 Preenchendo projeto: ${projectName}`, { 
        salas: projectData.salas?.length,
        obraId: obraId,
        projectId: projectId
    });

    console.log(`✅ Projeto encontrado:`, projectElement.dataset);

    const roomsContainer = projectElement.querySelector('.rooms-container');
    if (roomsContainer) {
        const existingRooms = roomsContainer.querySelectorAll('.room-block');
        if (existingRooms.length > 0) {
            console.log(`🗑️ Removendo ${existingRooms.length} salas existentes antes do preenchimento`);
            existingRooms.forEach(room => room.remove());
        }
    }

    const salas = projectData.salas || [];
    console.log(`🚪 Processando ${salas.length} sala(s) para o projeto "${projectName}"`);
    
    for (let i = 0; i < salas.length; i++) {
        const roomData = salas[i];
        const roomName = roomData.nome;
        const roomId = roomData.id;
        
        if (!roomName || !roomId) {
            console.warn(`⚠️ Sala ${i} inválida ou sem nome/ID:`, roomData);
            continue;
        }

        console.log(`🚪 [${i + 1}/${salas.length}] Criando sala: ${roomName} (ID: ${roomId})`);

        try {
            if (typeof window.createEmptyRoom !== 'function') {
                console.error('❌ createEmptyRoom não disponível');
                continue;
            }

            const roomCreated = await window.createEmptyRoom(obraId, projectId, roomName, roomId);
            
            if (!roomCreated) {
                console.error(`❌ Falha ao criar sala ${roomName}`);
                continue;
            }

            const roomElement = await waitForElement(`[data-room-id="${roomId}"]`, 3000);
            
            if (!roomElement) {
                console.error(`❌ Sala ${roomName} não encontrada no DOM após criação`);
                
                const allRooms = document.querySelectorAll('.room-block');
                console.log(`🔍 Salas no DOM: ${allRooms.length}`);
                allRooms.forEach((room, idx) => {
                    console.log(`  ${idx + 1}. Sala: "${room.dataset.roomName}", ID: "${room.dataset.roomId}", Projeto: "${room.dataset.projectId}"`);
                });
                continue;
            }

            console.log(`✅ Sala criada e encontrada: ${roomName}`, {
                element: roomElement,
                dataset: roomElement.dataset
            });

            await populateRoomData(roomElement, roomData);

        } catch (error) {
            console.error(`❌ Falha ao criar sala ${roomName}:`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`✅ Projeto "${projectName}" preenchido com sucesso - ${salas.length} sala(s) processada(s)`);
}

// EXPORTS NO FINAL
export {
    renderProjectFromData,
    populateProjectData
};