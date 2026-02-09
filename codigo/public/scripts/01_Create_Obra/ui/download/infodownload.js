// infodownload.js (atualizado)
import { showWordModelModal } from './word-modal.js';
import { showSystemStatus } from '../interface.js';

/**
 * Gera e inicia o download de um documento Word para uma obra ou projeto específico
 * @param {string} obraId - ID da obra
 * @param {string|null} projectName - Nome do projeto (opcional)
 * @returns {void}
 */
export function downloadWord(obraId, projectName = null) {
    // Buscar obra por ID
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraBlock) {
        console.error(`❌ Obra com ID "${obraId}" não encontrada para Word`);
        showSystemStatus(`ERRO: Obra não encontrada`, "error");
        return;
    }

    const obraName = obraBlock.dataset.obraName;
    const target = projectName ? `projeto ${projectName} da obra ${obraName}` : `obra ${obraName}`;
    
    console.log(`📝 Gerando Word para ${target} (ID: ${obraId})`);
    
    // Mostrar modal de seleção
    showWordModelModal(obraId, obraName);
}