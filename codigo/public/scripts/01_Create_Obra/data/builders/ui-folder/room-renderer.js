/**
 * data/modules/climatizacao/render-rooms.js
 * ARQUIVO DE RENDERIZAÇÃO DE SALAS - VERSÃO CORRIGIDA
 */

import { ensureStringId } from '../../utils/id-generator.js';

/**
 * Renderiza uma sala a partir dos dados
 */
function renderRoomFromData(projectId, projectName, roomData, obraId = null, obraName = null) {
    const roomName = roomData.nome;
    const roomId = ensureStringId(roomData.id);

    console.log(`🎯 Renderizando sala: ${roomName}`);

    // Verificar se a sala já existe
    const existingRoom = document.querySelector(`[data-room-id="${roomId}"]`);
    
    if (existingRoom) {
        console.log(`✅ Sala já existe, preenchendo dados`);
        
        // Verificar duplicação antes
        if (typeof window.fixDuplicatedSections === 'function') {
            window.fixDuplicatedSections(existingRoom, 'Tubulação de Cobre');
        }
        
        return populateRoomData(existingRoom, roomData);
    }

    // Criar nova sala
    setTimeout(() => {
        createEmptyRoom(obraId, projectId, roomName, roomId);
        
        setTimeout(() => {
            const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
            if (roomElement) {
                // Verificar duplicação após criação
                if (typeof window.fixDuplicatedSections === 'function') {
                    window.fixDuplicatedSections(roomElement, 'Tubulação de Cobre');
                }
                
                // Garantir seções e preencher
                ensureAllRoomSections(roomElement).then(sectionsReady => {
                    if (sectionsReady) {
                        populateRoomData(roomElement, roomData);
                    }
                });
            }
        }, 500);
        
    }, 100);
}

/**
 * Preenche dados da sala
 */
async function populateRoomData(roomElement, roomData) {
    if (!roomElement || !roomData) {
        console.error('❌ Elemento da sala ou dados inválidos');
        return false;
    }

    const roomId = roomElement.dataset.roomId;
    const roomName = roomElement.dataset.roomName;
    
    if (!roomId) {
        console.error(`❌ Room ID inválido`);
        return false;
    }
    
    console.log(`🔄 Preenchendo sala "${roomName}"`);

    try {
        // Atualizar título
        const roomTitle = roomElement.querySelector('.room-title');
        if (roomTitle && roomData.nome) {
            roomTitle.textContent = roomData.nome;
        }

        // Preencher dados
        if (roomData.inputs) {
            fillClimatizationInputs(roomElement, roomData.inputs);
        }

        if (roomData.ganhosTermicos) {
            fillThermalGainsData(roomElement, roomData.ganhosTermicos);
        }

        if (roomData.capacidade) {
            fillCapacityData(roomElement, roomData.capacidade);
        }

        // Preencher equipamentos com delay
        if (roomData.equipamentos && Array.isArray(roomData.equipamentos)) {
            setTimeout(() => {
                if (typeof window.fillEquipamentosData === 'function') {
                    window.fillEquipamentosData(roomElement, roomData.equipamentos);
                }
            }, 600);
        }

        // Preencher dutos com delay
        if (roomData.dutos && Array.isArray(roomData.dutos)) {
            setTimeout(() => {
                if (typeof window.fillDutosData === 'function') {
                    window.fillDutosData(roomElement, roomData.dutos);
                }
            }, 700);
        }

        // Preencher tubulação com delay
        if (roomData.tubulacao && roomData.tubulacao.conjuntos && Array.isArray(roomData.tubulacao.conjuntos)) {
            setTimeout(() => {
                if (typeof window.fillTubulacaoData === 'function') {
                    window.fillTubulacaoData(roomElement, roomData.tubulacao);
                }
            }, 800);
        }

        // Preencher máquinas com delay
        if (roomData.maquinas && Array.isArray(roomData.maquinas)) {
            setTimeout(async () => {
                try {
                    await fillMachinesData(roomElement, roomData.maquinas);
                } catch (error) {
                    console.error(`❌ Erro ao preencher máquinas:`, error);
                }
            }, 500);
        }

        console.log(`✅ Sala "${roomName}" preenchida`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher sala:`, error);
        return false;
    }
}

/**
 * Preenche inputs específicos
 */
function populateRoomInputs(projectId, projectName, roomId, roomName, roomData, obraId, obraName) {
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomElement) {
        populateRoomData(roomElement, roomData);
    } else {
        console.error(`❌ Elemento da sala não encontrado`);
    }
}

// Exportações
export {
    renderRoomFromData,
    populateRoomData,
    populateRoomInputs
};