// data/builders/data-builders-folder/obra-data-builder.js
// Responsável por montar o objeto completo da obra - VERSÃO SIMPLIFICADA
import { generateObraId, generateProjectId, generateRoomId } from '../../utils/id-generator.js';
import { extractEmpresaData } from './empresa-data-extractor.js';

/**
 * Constrói o objeto de dados completo de uma obra a partir do HTML
 */
function buildObraData(obraIdOrElement) {
    console.log('🚨 buildObraData INICIADA - buscando elemento...');
    
    let obraElement;
    
    if (typeof obraIdOrElement === 'string') {
        obraElement = document.querySelector(`[data-obra-id="${obraIdOrElement}"]`);
        
        if (!obraElement) {
            console.error('❌ Obra não encontrada pelo ID:', obraIdOrElement);
            return null;
        }
    } else if (obraIdOrElement instanceof HTMLElement) {
        if (obraIdOrElement.classList.contains('obra-block')) {
            obraElement = obraIdOrElement;
        } else {
            console.error('❌ Elemento não é uma obra:', obraIdOrElement);
            return null;
        }
    } else {
        console.error('❌ Tipo inválido para obraIdOrElement:', typeof obraIdOrElement, obraIdOrElement);
        return null;
    }

    if (!document.body.contains(obraElement)) {
        console.error('❌ CRÍTICO: Elemento da obra NÃO ESTÁ MAIS NO DOM!');
        return null;
    }

    const obraName = obraElement.dataset.obraName;
    const obraId = obraElement.dataset.obraId;

    console.log(`📦 Construindo dados da obra: "${obraName}" (ID: ${obraId})`);

    const finalObraId = obraId || generateObraId();
    const empresaData = extractEmpresaData(obraElement);
    
    const obraData = {
        id: finalObraId,
        nome: obraName,
        empresa_id: `empresa_${finalObraId}`,
        ...empresaData,
        projetos: []
    };

    const projectElements = obraElement.querySelectorAll('.project-block');
    console.log(`🔍 Encontrados ${projectElements.length} projetos na obra "${obraName}"`);
    
    let projetosProcessados = 0;
    
    projectElements.forEach((projectElement, index) => {
        console.log(`📝 Processando projeto ${index + 1}/${projectElements.length}`);
        
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
    
    return obraData;
}

/**
 * Constrói o objeto de dados completo de um projeto a partir do HTML
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

    const finalProjectId = projectId || generateProjectId(obraElement);

    const projectData = {
        id: finalProjectId,
        nome: projectName,
        salas: [],
        servicos: extractServicosData(projectElement) // ✅ Extrair dados de serviços
    };

    const roomElements = projectElement.querySelectorAll('.room-block');
    console.log(`🔍 Encontradas ${roomElements.length} salas no projeto "${projectName}"`);
    
    let salasProcessadas = 0;
    
    roomElements.forEach((roomElement, index) => {
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
    console.log(`📊 Serviços extraídos:`, projectData.servicos);
    
    return projectData;
}

/**
 * ✅ FUNÇÃO: Extrai dados dos serviços de um projeto (SIMPLIFICADA)
 */
function extractServicosData(projectElement) {
    const sectionBlock = projectElement.querySelector('.section-block[data-project-id]');
    if (!sectionBlock) {
        console.log(`📭 Projeto não possui seção de serviços`);
        return {
            engenharia: null,
            adicionais: []
        };
    }

    const servicosData = {
        engenharia: extractEngenhariaData(sectionBlock),
        adicionais: extractAdicionaisData(sectionBlock)
    };

    console.log(`📊 Dados de serviços extraídos:`, servicosData);
    return servicosData;
}

/**
 * ✅ FUNÇÃO: Extrai dados da subseção de Engenharia
 */
function extractEngenhariaData(sectionBlock) {
    const engenhariaBlock = sectionBlock.querySelector('.subsection-block:first-child');
    if (!engenhariaBlock) return null;

    const valorInput = engenhariaBlock.querySelector('.input-valor');
    const descricaoTextarea = engenhariaBlock.querySelector('.input-texto');

    return {
        valor: valorInput ? parseFloat(valorInput.value) || 0 : 0,
        descricao: descricaoTextarea ? descricaoTextarea.value : ''
    };
}

/**
 * ✅ FUNÇÃO: Extrai dados dos adicionais (SIMPLIFICADA - sem tipo)
 */
function extractAdicionaisData(sectionBlock) {
    const adicionaisContainer = sectionBlock.querySelector('.adicionais-container');
    if (!adicionaisContainer) return [];

    const adicionais = [];
    const adicionaisItems = adicionaisContainer.querySelectorAll('.adicional-item');

    adicionaisItems.forEach((item, index) => {
        const valorInput = item.querySelector('.input-valor');
        const descricaoTextarea = item.querySelector('.input-texto');
        
        const adicionalData = {
            id: item.dataset.itemId || `adicional-${index}`,
            valor: valorInput ? parseFloat(valorInput.value) || 0 : 0,
            descricao: descricaoTextarea ? descricaoTextarea.value : ''
        };

        adicionais.push(adicionalData);
    });

    return adicionais;
}

// EXPORTS NO FINAL
export {
    buildObraData,
    buildProjectData,
    extractServicosData
};