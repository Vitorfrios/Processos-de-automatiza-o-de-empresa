import { showConfirmationModal } from "../../../ui/components/modal/modal.js";

/**
 * FUNÇÕES DE REMOÇÃO
 */

async function deleteObra(obraName, obraId) {
  const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
  if (!obraBlock) {
    console.error(` Obra com ID ${obraId} não encontrada`);
    return;
  }

  showConfirmationModal(obraName, obraId, obraBlock);
}

export { deleteObra };
