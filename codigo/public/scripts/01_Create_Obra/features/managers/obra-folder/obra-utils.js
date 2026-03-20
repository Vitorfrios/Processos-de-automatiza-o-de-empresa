import { showConfirmationModal } from "../../../ui/components/modal/modal.js";
import { calculateRoomCompletionStats } from "../../../ui/helpers.js";

/**
 * FUNÇÕES DE REMOÇÃO E VERIFICAÇÃO
 */

async function deleteObra(obraName, obraId) {
  const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
  if (!obraBlock) {
    console.error(` Obra com ID ${obraId} não encontrada`);
    return;
  }

  showConfirmationModal(obraName, obraId, obraBlock);
}

function verifyObraData(obraId) {
  const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
  if (!obraBlock) {
    console.error(` Obra com ID "${obraId}" não encontrada para verificação`);
    alert(`ERRO: Obra com ID "${obraId}" não encontrada`);
    return;
  }

  const obraName = obraBlock.dataset.obraName;
  const projects = obraBlock.querySelectorAll(".project-block");
  let totalRooms = 0;

  let report = `Verificação da Obra "${obraName}" (ID: ${obraId}):\n\n`;
  report += `Total de projetos: ${projects.length}\n\n`;

  projects.forEach((project, index) => {
    const projectName = project.dataset.projectName;
    const rooms = project.querySelectorAll(".room-block");
    totalRooms += rooms.length;

    report += `Projeto ${index + 1}: ${projectName}\n`;
    report += ` - Salas: ${rooms.length}\n`;

    rooms.forEach((room, roomIndex) => {
      const roomName =
        room.querySelector(".room-title")?.textContent ||
        `Sala ${roomIndex + 1}`;
      const stats = calculateRoomCompletionStats(room);
      report += ` - ${roomName}: ${stats.filled}/${stats.total} campos (${stats.percentage}%)\n`;
    });
    report += "\n";
  });

  report += `RESUMO: ${projects.length} projetos, ${totalRooms} salas`;

  console.log(` Relatório gerado para obra: ${obraName} (ID: ${obraId})`);
  alert(report);
}

export { deleteObra, verifyObraData };
