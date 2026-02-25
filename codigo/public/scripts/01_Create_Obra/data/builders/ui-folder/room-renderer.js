/*
* ARQUIVO DE RENDERIZAÇÃO DE salas
*/

import { ensureStringId } from '../../utils/id-generator.js';
import { ensureTableSectionExists } from './data-fillers.js';

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
        acessorios: roomData.acessorios?.length || 0,
        dutos: roomData.dutos?.length || 0, // ✅ ADICIONADO: dutos
        conjuntosTubulacao: roomData.tubulacao?.conjuntos?.length || 0
    });

    setTimeout(() => {
        // Criar sala básica
        createEmptyRoom(obraId, projectId, roomName, roomId);
        
        // Aguardar criação e garantir todas as seções
        setTimeout(() => {
            const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
            if (roomElement) {
                // ✅ GARANTIR que TODAS as seções sejam criadas (incluindo dutos)
                ensureAllRoomSections(roomElement).then(sectionsReady => {
                    if (sectionsReady) {
                        console.log(`✅ Todas as seções criadas para ${roomName} - Iniciando preenchimento`);
                        populateRoomData(roomElement, roomData);
                    } else {
                        console.error(`❌ Falha ao criar seções para ${roomName}`);
                    }
                }).catch(error => {
                    console.error(`❌ Erro ao garantir seções para ${roomName}:`, error);
                    throw error;
                });
            } else {
                console.error(`❌ Elemento da sala ${roomId} não encontrado após criação`);
            }
        }, 150);
        
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
    
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.error(`❌ Room ID inválido no populateRoomData: "${roomId}"`);
        return false;
    }
    
    console.log(`🔄 Preenchendo sala "${roomName}" (ID: ${roomId})`);

    try {
        const tableExists = ensureTableSectionExists(roomElement);
        if (!tableExists) {
            setTimeout(() => {
                console.warn(`⚠️ Tabela de inputs não encontrada para ${roomName}, criando...`);
            }, 200);
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
        
        if (roomData.ventilacao && Object.keys(roomData.ventilacao).length > 0) {
            console.log(`🌬️ Preenchendo dados de ventilação para sala ${roomName}`);
            
            setTimeout(() => {
                if (typeof window.fillVentilacaoInputs === 'function') {
                    window.fillVentilacaoInputs(roomElement, roomData.ventilacao);
                    console.log(`✅ Ventilação preenchida via função global`);
                } else {
                    console.error(`❌ Função fillVentilacaoInputs não disponível no window`);
                }
            }, 350); // Delay apropriado
        }

        // ✅ Preencher acessorios
        if (roomData.acessorios && Array.isArray(roomData.acessorios)) {
            console.log(`🔧 Preenchendo ${roomData.acessorios.length} acessorio(s) para sala ${roomName}`);
            
            // Aguardar um pouco para garantir que a seção foi criada
            setTimeout(() => {
                if (typeof window.fillAcessoriosData === 'function') {
                    window.fillAcessoriosData(roomElement, roomData.acessorios);
                    console.log(`✅ Acessorios preenchidos via função global`);
                } else {
                    console.error(`❌ Função fillAcessoriosData não disponível no window`);
                }
            }, 400);
        }

        // ✅ Preencher dutos
        if (roomData.dutos && Array.isArray(roomData.dutos)) {
            console.log(`📏 Preenchendo ${roomData.dutos.length} duto(s) para sala ${roomName}`);
            
            // Aguardar um pouco para garantir que a seção foi criada
            setTimeout(() => {
                if (typeof window.fillDutosData === 'function') {
                    window.fillDutosData(roomElement, roomData.dutos);
                    console.log(`✅ Dutos preenchidos via função global`);
                } else {
                    console.error(`❌ Função fillDutosData não disponível no window`);
                }
            }, 500);
        }

        // ✅ CORREÇÃO CRÍTICA: Preencher tubulação - CUIDADO COM A ESTRUTURA
        if (roomData.tubulacao && roomData.tubulacao.conjuntos && Array.isArray(roomData.tubulacao.conjuntos)) {
            console.log(`🔧 Preenchendo ${roomData.tubulacao.conjuntos.length} conjunto(s) de tubulação para sala ${roomName}`);
            
            // Aguardar mais tempo para garantir que a seção de tubulação foi criada
            setTimeout(() => {
                if (typeof window.fillTubulacaoData === 'function') {
                    // ✅ CORREÇÃO: Passar o objeto completo de tubulação
                    window.fillTubulacaoData(roomElement, roomData.tubulacao);
                    console.log(`✅ Tubulação preenchida via função global`, {
                        conjuntos: roomData.tubulacao.conjuntos.length,
                        estrutura: 'conjuntos array dentro de objeto tubulacao'
                    });
                } else {
                    console.error(`❌ Função fillTubulacaoData não disponível no window - Verifique se tubos.js foi carregado`);
                }
            }, 750);
        } else if (roomData.tubulacao) {
            console.warn(`⚠️ Estrutura de tubulação inválida ou vazia para sala ${roomName}:`, roomData.tubulacao);
        }

        // ✅ Preencher máquinas
        if (roomData.maquinas && Array.isArray(roomData.maquinas)) {
            console.log(`🤖 Agendando preenchimento de ${roomData.maquinas.length} máquina(s) para sala ${roomName}`);
            
            // Aguardar mais tempo para garantir que todas as outras seções foram preenchidas
            setTimeout(async () => {
                try {
                    console.log(`🚀 Iniciando preenchimento de máquinas para sala ${roomName}`);
                    
                    const success = await fillMachinesData(roomElement, roomData.maquinas);
                    
                    if (success) {
                        console.log(`🎉 Todas as máquinas preenchidas com sucesso para sala ${roomName}`);
                    } else {
                        console.error(`❌ Falha ao preencher máquinas para sala ${roomName}`);
                    }
                } catch (error) {
                    console.error(`💥 Erro ao preencher máquinas para sala ${roomName}:`, error);
                }
            }, 800);
        }

        console.log(`✅ Sala "${roomName}" preenchida com sucesso`);
        return true;

    } catch (error) {
        console.error(`❌ Erro ao preencher sala "${roomName}":`, error);
        return false;
    }
}

/**
 * Preenche os inputs de uma sala específica
 */
function populateRoomInputs(projectId, projectName, roomId, roomName, roomData, obraId, obraName) {
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomElement) {
        populateRoomData(roomElement, roomData);
    } else {
        console.error(`❌ Elemento da sala ${roomId} não encontrado no DOM`);
    }
}

// EXPORTS NO FINAL
export {
    renderRoomFromData,
    populateRoomData,
    populateRoomInputs
};