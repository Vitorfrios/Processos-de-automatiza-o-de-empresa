import { ensureStringId } from '../../utils/id-generator.js';

/**
 * Renderiza uma sala individual a partir dos dados carregados
 */
function renderRoomFromData(projectId, projectName, roomData, obraId = null, obraName = null) {
    const roomName = roomData.nome;
    const roomId = ensureStringId(roomData.id);

    console.log(`🎯 Renderizando sala: ${roomName} no projeto ${projectName}`, {
        obra: obraName,
        projectId: projectId,
        roomId: roomId,
        inputs: Object.keys(roomData.inputs || {}).length,
        maquinas: roomData.maquinas?.length || 0,
        capacidade: Object.keys(roomData.capacidade || {}).length,
        ganhosTermicos: Object.keys(roomData.ganhosTermicos || {}).length,
        acessorio: Object.keys(roomData.acessorios || {}).length
        // adicionar aqui tubulação e dutos
    });

    setTimeout(() => {
        createEmptyRoom(obraId, projectId, roomName, roomId);

        setTimeout(() => {
            populateRoomInputs(projectId, projectName, roomId, roomName, roomData, obraId, obraName);
        }, 100);
        
    }, 100);
}

/**
 * Preenche uma sala específica dentro de um projeto
 */
async function populateRoomData(roomElement, roomData) {
    if (!roomElement || !roomData) {
        console.error('❌ Elemento da sala ou dados inválidos');
        return false;
    }

    const roomId = roomElement.dataset.roomId;
    const roomName = roomElement.dataset.roomName;
    
    // ✅ CORREÇÃO: Validar roomId antes de prosseguir
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`❌ Room ID inválido no populateRoomData: "${roomId}"`);
        console.log('🔍 Elemento da sala:', roomElement);
        console.log('🔍 Dataset:', roomElement.dataset);
        return false;
    }
    
    console.log(`🔄 Preenchendo sala "${roomName}" (ID: ${roomId})`, roomData);

    try {
        // ✅ CORREÇÃO: Garantir que todas as seções existam antes de preencher
        console.log(`🏗️ Garantindo que todas as seções existem para sala ${roomName}`);
        const sectionsReady = await ensureAllRoomSections(roomElement);
        if (!sectionsReady) {
            console.error(`❌ Não foi possível garantir seções para sala ${roomName}`);
            return false;
        }

        const roomTitle = roomElement.querySelector('.room-title');
        if (roomTitle && roomData.nome) {
            roomTitle.textContent = roomData.nome;
            console.log(`✅ Título da sala atualizado: ${roomData.nome}`);
        }

        if (roomData.inputs) {
            console.log(`🌡️ Preenchendo inputs de climatização para sala ${roomName}`);
            fillClimatizationInputs(roomElement, roomData.inputs);
        }

        if (roomData.ganhosTermicos) {
            console.log(`📊 Preenchendo ganhos térmicos para sala ${roomName}`);
            fillThermalGainsData(roomElement, roomData.ganhosTermicos);
        }

        if (roomData.capacidade) {
            console.log(`⚡ Preenchendo dados de capacidade para sala ${roomName}`);
            fillCapacityData(roomElement, roomData.capacidade);
        }

        if (roomData.acessorios) {
            console.log(`⚙️ Preenchendo acessorios para sala ${roomName}`);
            fillAccessoriesData(roomElement, roomData.acessorios);
        }

        if (roomData.maquinas && Array.isArray(roomData.maquinas)) {
            console.log(`🤖 Agendando preenchimento de ${roomData.maquinas.length} máquina(s) para sala ${roomName}`);
            
            // ✅ Aumentar o tempo de espera para garantir que tudo esteja carregado
            setTimeout(async () => {
                try {
                    console.log(`🚀 Iniciando preenchimento de máquinas para sala ${roomName}`);
                    
                    // ✅ Verificar novamente se as seções estão prontas
                    const sectionsReady = await ensureAllRoomSections(roomElement);
                    if (!sectionsReady) {
                        console.error(`❌ Seções não prontas para preencher máquinas`);
                        return;
                    }
                    
                    const success = await fillMachinesData(roomElement, roomData.maquinas);
                    
                    if (success) {
                        console.log(`🎉 Todas as máquinas preenchidas com sucesso para sala ${roomName}`);
                    } else {
                        console.error(`❌ Falha ao preencher máquinas para sala ${roomName}`);
                    }
                } catch (error) {
                    console.error(`💥 Erro ao preencher máquinas para sala ${roomName}:`, error);
                }
            }, 3000); // ✅ Aumentado para 3 segundos
        }

        console.log(`✅ Sala "${roomName}" preenchida com sucesso`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher sala "${roomName}":`, error);
        return false;
    }
}

// EXPORTS NO FINAL
export {
    renderRoomFromData,
    populateRoomData
};