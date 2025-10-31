/**
 * data-builders.js - VERSÃO CORRIGIDA
 * SISTEMA NÃO-DESTRUTIVO - NÃO MODIFICA O DOM
 */

import { generateObraId, generateProjectId, generateRoomId, getObraName, getProjectName, getRoomName } from './data-utils-core.js'
import { extractClimatizationInputs, extractMachinesData, extractCapacityData, extractThermalGainsData, extractConfigurationData } from './data-extractors.js'

/**
 * Constrói o objeto de dados completo de uma obra a partir do HTML - VERSÃO CORRIGIDA
 * @param {string|HTMLElement} obraIdOrElement - ID da obra ou elemento HTML
 * @returns {Object|null} Dados completos da obra ou null em caso de erro
 */
function buildObraData(obraIdOrElement) {
    console.log('🚨 buildObraData INICIADA - buscando elemento...');
    
    let obraElement
    
    if (typeof obraIdOrElement === 'string') {
        // ✅ CORREÇÃO: Buscar apenas por ID único, SEM recriar elementos
        obraElement = document.querySelector(`[data-obra-id="${obraIdOrElement}"]`);
        
        if (!obraElement) {
            console.error('❌ Obra não encontrada pelo ID:', obraIdOrElement);
            
            // Debug: listar todas as obras disponíveis
            const todasObras = document.querySelectorAll('[data-obra-id]');
            console.log('📋 Obras disponíveis no DOM:', 
                Array.from(todasObras).map(o => ({
                    id: o.dataset.obraId,
                    name: o.dataset.obraName
                }))
            );
            return null;
        }
    } else if (obraIdOrElement instanceof HTMLElement) {
        if (obraIdOrElement.classList.contains('obra-block')) {
            obraElement = obraIdOrElement
        } else {
            console.error('❌ Elemento não é uma obra:', obraIdOrElement)
            return null
        }
    } else {
        console.error('❌ Tipo inválido para obraIdOrElement:', typeof obraIdOrElement, obraIdOrElement)
        return null
    }

    // ✅ CORREÇÃO CRÍTICA: VERIFICAR SE ELEMENTO AINDA ESTÁ NO DOM
    if (!document.body.contains(obraElement)) {
        console.error('❌ CRÍTICO: Elemento da obra NÃO ESTÁ MAIS NO DOM!');
        return null;
    }

    const obraName = obraElement.dataset.obraName;
    const obraId = obraElement.dataset.obraId;

    console.log(`📦 Construindo dados da obra: "${obraName}" (ID: ${obraId}) - ELEMENTO NO DOM: ${document.body.contains(obraElement)}`);

    // ✅ CORREÇÃO: SEMPRE usar ID único existente, NÃO gerar novo
    const finalObraId = obraId || generateObraId();
    
    const obraData = {
        id: finalObraId,
        nome: obraName, // ✅ USAR DIRETAMENTE do dataset - MAIS SEGURO
        timestamp: new Date().toISOString(),
        projetos: []
    }

    // ✅ CORREÇÃO: EXTRAIR DADOS DOS PROJETOS SEM MODIFICAR O DOM
    const projectElements = obraElement.querySelectorAll('.project-block');
    console.log(`🔍 Encontrados ${projectElements.length} projetos na obra "${obraName}"`);
    
    let projetosProcessados = 0;
    
    projectElements.forEach((projectElement, index) => {
        console.log(`📝 Processando projeto ${index + 1}/${projectElements.length}`);
        
        // ✅ CORREÇÃO: Verificar se projeto ainda está no DOM
        if (!document.body.contains(projectElement)) {
            console.error(`❌ Projeto ${index} foi removido do DOM durante o processamento!`);
            return;
        }
        
        const projectData = buildProjectData(projectElement);
        if (projectData) {
            obraData.projetos.push(projectData);
            projetosProcessados++;
            console.log(`✅ Projeto "${projectData.nome}" adicionado à obra "${obraName}"`);
        } else {
            console.error(`❌ Falha ao construir projeto ${index} da obra "${obraName}"`);
        }
    });

    console.log('📦 Dados da obra construídos:', {
        obra: obraData.nome,
        id: obraData.id,
        projetos: `${projetosProcessados}/${projectElements.length} processados`
    });
    
    // ✅ VERIFICAÇÃO FINAL: A obra ainda está no DOM?
    console.log('🔍 VERIFICAÇÃO FINAL - Obra ainda no DOM?:', 
        document.body.contains(obraElement) ? '✅ SIM' : '❌ NÃO');
    
    return obraData;
}

/**
 * Constrói o objeto de dados completo de um projeto a partir do HTML - VERSÃO CORRIGIDA
 * @param {string|HTMLElement} projectIdOrElement - ID do projeto ou elemento HTML
 * @returns {Object|null} Dados completos do projeto ou null em caso de erro
 */
function buildProjectData(projectIdOrElement) {
    let projectElement;
    
    if (typeof projectIdOrElement === 'string') {
        projectElement = document.querySelector(`[data-project-name="${projectIdOrElement}"]`);
    } else if (projectIdOrElement instanceof HTMLElement) {
        projectElement = projectIdOrElement;
    } else {
        console.error('❌ Tipo inválido para projectIdOrElement:', projectIdOrElement);
        return null;
    }

    if (!projectElement) {
        console.error('❌ Elemento do projeto não encontrado:', projectIdOrElement);
        return null;
    }

    // ✅ CORREÇÃO: Verificar se elemento ainda está no DOM
    if (!document.body.contains(projectElement)) {
        console.error('❌ CRÍTICO: Elemento do projeto NÃO ESTÁ MAIS NO DOM!');
        return null;
    }

    const projectName = projectElement.dataset.projectName || projectElement.id;
    const projectId = projectElement.dataset.projectId;
    const obraElement = projectElement.closest('.obra-block');

    if (!obraElement) {
        console.error('❌ Elemento da obra pai não encontrado para projeto:', projectName);
        return null;
    }

    // ✅ CORREÇÃO: Usar ID existente, NÃO gerar novo
    const finalProjectId = projectId || generateProjectId(obraElement);

    const projectData = {
        id: finalProjectId,
        nome: projectName, // ✅ USAR DIRETAMENTE do dataset
        salas: [],
        timestamp: new Date().toISOString()
    };

    // ✅ CORREÇÃO: Extrair salas SEM modificar DOM
    const roomElements = projectElement.querySelectorAll('.room-block');
    console.log(`🔍 Encontradas ${roomElements.length} salas no projeto "${projectName}"`);
    
    let salasProcessadas = 0;
    
    roomElements.forEach((roomElement, index) => {
        // ✅ CORREÇÃO: Verificar se sala ainda está no DOM
        if (!document.body.contains(roomElement)) {
            console.error(`❌ Sala ${index} foi removida do DOM durante o processamento!`);
            return;
        }
        
        const roomData = extractRoomData(roomElement, projectElement);
        if (roomData) {
            projectData.salas.push(roomData);
            salasProcessadas++;
        }
    });

    console.log(`✅ Projeto "${projectName}" processado: ${salasProcessadas}/${roomElements.length} salas`);
    return projectData;
}

/**
 * Extrai todos os dados de uma sala a partir do elemento HTML - VERSÃO CORRIGIDA
 * @param {HTMLElement} roomElement - Elemento HTML da sala
 * @param {HTMLElement} projectElement - Elemento HTML do projeto pai
 * @returns {Object|null} Dados completos da sala ou null em caso de erro
 */
function extractRoomData(roomElement, projectElement) {
    if (!roomElement) {
        console.error('❌ Elemento da sala é nulo');
        return null;
    }

    if (!projectElement) {
        console.error('❌ Elemento do projeto pai é nulo');
        return null;
    }

    // ✅ CORREÇÃO: Verificar se elementos ainda estão no DOM
    if (!document.body.contains(roomElement) || !document.body.contains(projectElement)) {
        console.error('❌ CRÍTICO: Elemento da sala ou projeto NÃO ESTÁ MAIS NO DOM!');
        return null;
    }

    // ✅ CORREÇÃO: Usar ID existente, NÃO gerar novo
    const roomId = roomElement.dataset.roomId || generateRoomId(projectElement);
    const roomName = roomElement.dataset.roomName || `Sala ${roomId}`;

    console.log(`🔍 Extraindo dados da sala: "${roomName}" (ID: ${roomId}) - NO DOM: ${document.body.contains(roomElement)}`);

    const roomData = {
        id: roomId,
        nome: roomName,
        inputs: extractClimatizationInputs(roomElement),
        maquinas: extractMachinesData(roomElement),
        capacidade: extractCapacityData(roomElement),
        ganhosTermicos: extractThermalGainsData(roomElement),
        configuracao: extractConfigurationData(roomElement)
    };

    console.log(`📊 Dados extraídos da sala ${roomId} "${roomData.nome}":`, {
        inputs: Object.keys(roomData.inputs).length,
        maquinas: roomData.maquinas.length,
        capacidade: Object.keys(roomData.capacidade).length,
        ganhosTermicos: Object.keys(roomData.ganhosTermicos).length,
        configuracao: Object.keys(roomData.configuracao).length
    });
    
    return roomData;
}

export {
    buildObraData,
    buildProjectData,
    extractRoomData
}