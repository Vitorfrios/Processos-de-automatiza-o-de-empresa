import { ensureStringId } from '../../../data/utils/id-generator.js';
import { buildObraData } from '../../../data/builders/data-builders.js';
import { showSystemStatus } from '../../../ui/components/status.js';
import { isSessionActive, startSessionOnFirstSave } from '../../../data/adapters/session-adapter.js';
import { findObraBlockWithRetry } from './obra-dom-manager.js';
import { salvarObra, atualizarObra } from './obra-persistence.js';

/**
 * 💾 FUNÇÃO PRINCIPAL DE SALVAMENTO
 */

async function saveObra(obraId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log(`💾 SALVANDO OBRA pelo ID: "${obraId}"`);

    let obraBlock = await findObraBlockWithRetry(obraId, 15);
    
    if (!obraBlock) {
        console.error('❌ Obra não encontrada no DOM após múltiplas tentativas:', obraId);
        
        const todasObras = document.querySelectorAll('[data-obra-id]');
        console.log('📋 Obras disponíveis no DOM:', Array.from(todasObras).map(o => ({
            id: o.dataset.obraId,
            name: o.dataset.obraName
        })));
        
        showSystemStatus("ERRO: Obra não encontrada na interface", "error");
        return;
    }

    const obraOriginalReference = obraBlock;
    const obraContainer = obraBlock.parentElement;
    
    console.log('🔒 REFERÊNCIA SALVA:', {
        obra: obraOriginalReference,
        container: obraContainer,
        obraNoContainer: obraContainer.contains(obraOriginalReference)
    });

    if (!isSessionActive()) {
        console.log("🆕 Iniciando sessão para primeira obra...");
        await startSessionOnFirstSave();
    }

    if (!isSessionActive()) {
        console.warn("⚠️ Sessão não está ativa - obra não será salva");
        showSystemStatus("ERRO: Sessão não está ativa. Obra não salva.", "error");
        return;
    }

    console.log('✅ Obra confirmada no DOM:', {
        element: obraBlock,
        dataset: obraBlock.dataset,
        id: obraBlock.dataset.obraId,
        name: obraBlock.dataset.obraName
    });

    console.log('🔨 Construindo dados da obra...');
    const obraData = buildObraData(obraBlock);

    if (!obraData) {
        console.error('❌ Falha ao construir dados da obra');
        showSystemStatus("ERRO: Falha ao construir dados da obra", "error");
        return;
    }

    const obraIdFromDOM = obraBlock.dataset.obraId;
    const obraIdFromData = obraData.id;
    const finalObraId = obraIdFromDOM || obraIdFromData;
    
    console.log('🔍 VERIFICAÇÃO DE OBRA MELHORADA:');
    console.log('- ID no DOM:', obraIdFromDOM);
    console.log('- ID nos dados:', obraIdFromData);
    console.log('- ID final para uso:', finalObraId);
    console.log('- É ID seguro?:', finalObraId?.startsWith('obra_'));
    
    let isNewObra = true;
    
    try {
        const todasObrasResponse = await fetch('/api/backup-completo');
        if (todasObrasResponse.ok) {
            const backupData = await todasObrasResponse.json();
            const todasObras = backupData.obras || [];
            const obraExistente = todasObras.find(obra => String(obra.id) === String(finalObraId));
            
            isNewObra = !obraExistente;
            console.log(`- Já existe no servidor?: ${!isNewObra}`);
        }
    } catch (error) {
        console.log('- Não foi possível verificar servidor, assumindo como nova obra');
    }

    console.log('- É nova obra?:', isNewObra);

    let result = null;
    
    if (isNewObra) {
        console.log('🆕 SALVANDO COMO NOVA OBRA COM ID SEGURO:', finalObraId);
        
        obraData.id = finalObraId;
        
        if (!obraData.id || !obraData.id.startsWith('obra_')) {
            console.error('❌ Obra não possui ID seguro válido para salvar');
            showSystemStatus("ERRO: Obra não possui ID válido", "error");
            return;
        }
        
        result = await salvarObra(obraData);
    } else {
        console.log('📝 ATUALIZANDO OBRA EXISTENTE, ID SEGURO:', finalObraId);
        
        if (!finalObraId.startsWith('obra_')) {
            console.error(`ERRO: ID não seguro para atualização: ${finalObraId}`);
            showSystemStatus("ERRO: ID da obra inválido para atualização", "error");
            return;
        }
        
        result = await atualizarObra(finalObraId, obraData);
    }

    if (result) {
        const finalId = ensureStringId(result.id);
        
        let obraBlockAtual = document.querySelector(`[data-obra-id="${finalId}"]`);
        
        if (!obraBlockAtual) {
            console.error('❌ CRÍTICO: Obra desapareceu do DOM durante salvamento!');
            console.log('🔍 Tentando recuperar da referência original...');
            
            if (obraContainer && document.body.contains(obraContainer)) {
                const obrasNoContainer = obraContainer.querySelectorAll('[data-obra-id]');
                console.log(`📦 Obras no container original: ${obrasNoContainer.length}`);
                
                if (obraContainer.contains(obraOriginalReference)) {
                    obraBlockAtual = obraOriginalReference;
                    console.log('✅ Obra recuperada da referência original');
                } else {
                    console.error('❌ Obra não está mais no container original');
                    showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
                    return;
                }
            } else {
                console.error('❌ Container original não encontrado');
                showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
                return;
            }
        }

        obraBlockAtual.dataset.obraId = finalId;
        obraBlockAtual.dataset.obraName = obraData.nome;
        
        const titleElement = obraBlockAtual.querySelector('.obra-title');
        if (titleElement && titleElement.textContent !== obraData.nome) {
            titleElement.textContent = obraData.nome;
        }

        if (typeof updateObraButtonAfterSave === 'function' && document.body.contains(obraBlockAtual)) {
            console.log("✅ Obra confirmada no DOM, atualizando botão...");
            updateObraButtonAfterSave(obraData.nome, finalId);
        } else {
            console.error('❌ Obra não está no DOM para atualizar botão');
        }

        console.log(`✅ OBRA SALVA/ATUALIZADA COM SUCESSO! ID SEGURO: ${finalId}`);
        
        showSystemStatus("Obra salva com sucesso!", "success");
    } else {
        console.error('❌ FALHA AO SALVAR OBRA NO SERVIDOR');
        showSystemStatus("ERRO: Falha ao salvar obra no servidor", "error");
    }
}

// EXPORTS NO FINAL
export {
    saveObra
};