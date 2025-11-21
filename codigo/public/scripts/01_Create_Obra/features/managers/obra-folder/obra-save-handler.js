import { ensureStringId } from '../../../data/utils/id-generator.js';
import { buildObraData } from '../../../data/builders/data-builders.js';
import { showSystemStatus } from '../../../ui/components/status.js';
import { isSessionActive, startSessionOnFirstSave } from '../../../data/adapters/session-adapter.js';
import { findObraBlockWithRetry } from './obra-dom-manager.js';
import { supportFrom_saveObra, atualizarObra } from './obra-persistence.js';


// NO obra-save-handler.js - SUBSTITUA a função salvarEmpresaAutomaticamente por:

/**
 * 🆕 VERIFICA E PREPARA EMPRESA PARA SALVAMENTO (APENAS NA HORA DE SALVAR OBRA)
 * Detecta quando o usuário digitou uma empresa não cadastrada e a prepara para salvar junto com a obra
 */
async function prepararEmpresaParaSalvamento(obraElement) {
    try {
        console.log('🔍 [EMPRESA] Verificando empresa para salvamento com obra...');
        
        // Buscar inputs de empresa
        const empresaInput = obraElement.querySelector('.empresa-input-cadastro, .empresa-input-readonly');
        const numeroInput = obraElement.querySelector('.numero-cliente-final-cadastro');
        
        if (!empresaInput || !empresaInput.value) {
            console.log('❌ [EMPRESA] Nenhuma empresa digitada');
            return false;
        }
        
        // Se já tem sigla selecionada (empresa já cadastrada), não faz nada
        if (empresaInput.dataset.siglaSelecionada) {
            console.log('✅ [EMPRESA] Empresa já cadastrada:', empresaInput.dataset.siglaSelecionada);
            return true;
        }
        
        const nomeEmpresa = empresaInput.value.trim();
        if (!nomeEmpresa) {
            console.log('❌ [EMPRESA] Nome da empresa vazio');
            return false;
        }
        
        console.log('🆕 [EMPRESA] Nova empresa detectada para salvar com obra:', nomeEmpresa);
        
        // Extrair sigla (primeiras 3 letras em maiúsculo)
        let sigla = nomeEmpresa.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        
        // Garantir que a sigla tenha pelo menos 2 caracteres
        if (sigla.length < 2) {
            sigla = nomeEmpresa.substring(0, 2).toUpperCase() + 'X';
        }
        if (sigla.length > 6) {
            sigla = sigla.substring(0, 6);
        }
        
        console.log(`🆕 [EMPRESA] Preparando empresa: ${sigla} - ${nomeEmpresa}`);
        
        // 🆕 NÃO SALVA A EMPRESA AQUI - APENAS PREPARA OS DADOS
        // A empresa será salva junto com a obra no processo normal
        
        // Atualizar a obra com os dados da nova empresa
        obraElement.dataset.empresaSigla = sigla;
        obraElement.dataset.empresaNome = nomeEmpresa;
        obraElement.dataset.numeroClienteFinal = '1'; // Número inicial para empresa nova
        
        // Atualizar inputs
        if (empresaInput) {
            empresaInput.value = `${sigla} - ${nomeEmpresa}`;
            empresaInput.dataset.siglaSelecionada = sigla;
            empresaInput.dataset.nomeSelecionado = nomeEmpresa;
        }
        
        if (numeroInput) {
            numeroInput.value = '1';
        }
        
        console.log(`✅ [EMPRESA] Empresa preparada para salvamento: ${sigla} - ${nomeEmpresa}`);
        showSystemStatus(`Empresa ${sigla} preparada para salvar com a obra!`, 'success');
        return true;
        
    } catch (error) {
        console.error('❌ [EMPRESA] Erro ao preparar empresa:', error);
        showSystemStatus('Erro ao preparar empresa para salvamento', 'error');
        return false;
    }
}



/**
 * 🆕 MINIMIZAR TODOS OS TOGGLES AO SALVAR
 */
async function minimizarTogglesAposSalvamento(obraId) {
    console.log(`📁 [TOGGLES] Minimizando todos os toggles para obra: ${obraId}`);
    
    try {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            console.error(`❌ [TOGGLES] Obra ${obraId} não encontrada`);
            return;
        }

        // 🆕 MINIMIZAR OBRA PRINCIPAL
        const obraContent = obraElement.querySelector('.obra-content');
        const obraMinimizer = obraElement.querySelector('.minimizer');
        if (obraContent && obraMinimizer) {
            collapseElement(obraContent, obraMinimizer);
        }

        // 🆕 MINIMIZAR TODOS OS PROJETOS
        const projetos = obraElement.querySelectorAll('.project-block');
        projetos.forEach(projeto => {
            const projectContent = projeto.querySelector('.project-content');
            const projectMinimizer = projeto.querySelector('.minimizer');
            if (projectContent && projectMinimizer) {
                collapseElement(projectContent, projectMinimizer);
            }

            // 🆕 MINIMIZAR TODAS AS SALAS
            const salas = projeto.querySelectorAll('.room-block');
            salas.forEach(sala => {
                const roomContent = sala.querySelector('.room-content');
                const roomMinimizer = sala.querySelector('.minimizer');
                if (roomContent && roomMinimizer) {
                    collapseElement(roomContent, roomMinimizer);
                }
            });
        });

        console.log(`✅ [TOGGLES] Todos os toggles minimizados para obra ${obraId}`);
        
    } catch (error) {
        console.error(`❌ [TOGGLES] Erro ao minimizar toggles:`, error);
    }
}

/**
 * 💾 FUNÇÃO PRINCIPAL DE SALVAMENTO - ATUALIZADA COM TOGGLES
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
        showSystemStatus("ERRO: Obra não encontrada na interface", "error");
        return;
    }

    const obraOriginalReference = obraBlock;
    const obraContainer = obraBlock.parentElement;

    // 🆕 🆕 🆕 PREPARAR EMPRESA PARA SALVAMENTO (APENAS PREPARA, NÃO SALVA AINDA)
    console.log('🔍 [SALVAMENTO] Preparando empresa para salvamento com obra...');
    await prepararEmpresaParaSalvamento(obraBlock);
    
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
        
        result = await supportFrom_saveObra(obraData);
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

        // 🆕 🆕 🆕 ATUALIZAR HEADER APÓS SALVAMENTO
        console.log('🔄 [HEADER] Chamando atualização do header após salvamento...');
        await atualizarHeaderObraAposSalvamento(finalId);

        // 🆕 MINIMIZAR TOGGLES APÓS SALVAMENTO BEM-SUCEDIDO
        console.log('📁 [SALVAMENTO] Minimizando toggles automaticamente...');
        await minimizarTogglesAposSalvamento(finalId);

        console.log(`✅ OBRA SALVA/ATUALIZADA COM SUCESSO! ID SEGURO: ${finalId}`);
        showSystemStatus("Obra salva com sucesso!", "success");
    } else {
        console.error('❌ FALHA AO SALVAR OBRA NO SERVIDOR');
        showSystemStatus("ERRO: Falha ao salvar obra no servidor", "error");
    }
}

/**
 * 🆕 ATUALIZA O HEADER DA OBRA APÓS SALVAMENTO
 */
async function atualizarHeaderObraAposSalvamento(obraId) {
    try {
        console.log(`🔄 [HEADER] Iniciando atualização do header para obra: ${obraId}`);
        
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            console.error(`❌ [HEADER] Obra ${obraId} não encontrada no DOM`);
            return;
        }

        // Importar as funções necessárias
        const { extractEmpresaData } = await import('../../../data/builders/data-builders-folder/empresa-data-extractor.js');
        const { atualizarInterfaceComEmpresa } = await import('../../../data/adapters/obra-adapter-folder/empresa-form-manager.js');
        
        // Extrair dados atualizados da empresa
        console.log('🔍 [HEADER] Extraindo dados da empresa...');
        const empresaData = extractEmpresaData(obraElement);
        
        console.log('📊 [HEADER] Dados extraídos:', empresaData);
        
        if (!empresaData.empresaSigla || !empresaData.empresaNome) {
            console.log('⚠️ [HEADER] Dados de empresa incompletos para atualizar header');
            return;
        }

        // Atualizar a interface
        console.log('🎨 [HEADER] Chamando atualizarInterfaceComEmpresa...');
        await atualizarInterfaceComEmpresa(obraElement, empresaData);
        
        console.log('✅ [HEADER] Header atualizado com sucesso!');

    } catch (error) {
        console.error('❌ [HEADER] Erro ao atualizar header:', error);
    }
}



// EXPORTS NO FINAL
export {
    saveObra,
    atualizarHeaderObraAposSalvamento,
};