import { ensureStringId, generateObraId } from '../../../data/utils/id-generator.js';

/**
 * 🔍 FUNÇÕES AUXILIARES DE BUSCA E VERIFICAÇÃO
 */

function findObraBlock(obraId) {
    console.log(`🔍 Buscando obra pelo ID: "${obraId}"`);
    
    let obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (obraBlock) {
        console.log(`✅ Obra encontrada por ID exato: "${obraId}"`);
        return obraBlock;
    }
    
    const todasObras = document.querySelectorAll('[data-obra-id]');
    console.log(`📋 Obras encontradas no DOM: ${todasObras.length}`);
    
    todasObras.forEach((obra, index) => {
        console.log(`  ${index + 1}.`, {
            id: obra.dataset.obraId,
            name: obra.dataset.obraName,
            classes: obra.className
        });
    });
    
    console.log(`❌ Obra com ID "${obraId}" não encontrada no DOM`);
    return null;
}

async function findObraBlockWithRetry(obraId, maxAttempts = 10) {
    console.log(`🔍 Buscando obra com retry: "${obraId}"`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
        
        if (obraBlock) {
            console.log(`✅ Obra encontrada na tentativa ${attempt}/${maxAttempts}`);
            return obraBlock;
        }
        
        console.log(`⏳ Tentativa ${attempt}/${maxAttempts} - obra não encontrada, aguardando...`);
        
        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    console.log(`❌ Obra não encontrada após ${maxAttempts} tentativas`);
    return null;
}

/**
 * 🔄 FUNÇÕES DE ATUALIZAÇÃO DE INTERFACE
 */

function updateObraButtonAfterSave(obraName, obraId) {
    console.log('🔄=== updateObraButtonAfterSave CHAMADO ===');
    console.log('obraName:', obraName);
    console.log('obraId:', obraId);
    
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraBlock) {
        console.error(`❌ Obra com ID ${obraId} não encontrada para atualizar botão`);
        return;
    }

    obraBlock.dataset.obraId = obraId;

    const obraContent = document.getElementById(`obra-content-${obraId}`);
    if (!obraContent) {
        console.error(`❌ Conteúdo da obra ${obraId} não encontrado`);
        return;
    }

    const oldFooter = obraContent.querySelector('.obra-actions-footer');
    if (!oldFooter) {
        console.error(`❌ Rodapé não encontrado na obra ${obraId}`);
        return;
    }

    // REMOVER O FOOTER ANTIGO E ADICIONAR NOVO
    oldFooter.remove();
    
    // Criar novo footer com hasId = true
    const newFooterHTML = buildObraActionsFooter(obraId, obraName, true);
    
    // Inserir antes do fechamento do obra-content
    const addProjectSection = obraContent.querySelector('.add-project-section');
    if (addProjectSection) {
        addProjectSection.insertAdjacentHTML('afterend', newFooterHTML);
        console.log(`✅ Footer atualizado com botões de download para obra ${obraId}`);
    } else {
        obraContent.insertAdjacentHTML('beforeend', newFooterHTML);
        console.log(`✅ Footer atualizado (fallback) para obra ${obraId}`);
    }
}

// EXPORTS NO FINAL
export {
    findObraBlock,
    findObraBlockWithRetry,
    updateObraButtonAfterSave
};