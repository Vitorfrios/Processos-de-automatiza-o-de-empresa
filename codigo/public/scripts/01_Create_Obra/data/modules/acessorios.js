/**
 * acessorios.js - ATUALIZADO COM IDs SEGUROS
 * Constrói a seção de Acessórios de Difusão e Controle de Ar para uma sala
 */

/**
 * Constrói a seção de Acessórios de Difusão e Controle de Ar para uma sala
 * Inclui opções de instalação de climatização em formato de grid com checkboxes
 * @param {string} obraId - ID único da obra
 * @param {string} projectId - ID único do projeto
 * @param {string} roomName - Nome da sala
 * @param {string} finalRoomId - ID único da sala
 * @returns {string} HTML da seção de Acessorios
 */
function buildAccessoriesSection(obraId, projectId, roomName, finalRoomId) {
    // ✅ CORREÇÃO: Validar ID único
    if (!finalRoomId || finalRoomId === 'undefined' || finalRoomId === 'null') {
        console.error(`ERRO FALBACK (buildAccessoriesSection) acessorios.js [Room ID inválido: ${finalRoomId}]`);
        return '';
    }
    
    const roomId = finalRoomId;
    console.log(`🔧 Construindo seção de Acessorios para sala: ${roomName} (ID: ${roomId})`);
    
    return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}accessory')">+</button>
        <h4 class="section-title">Acessórios de Difusão e Controle de Ar</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}accessory">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="acess-label">Opções de Acessorios (selecione uma ou mais):</label>
            <div class="checkbox-options-grid">
              <div class="checkbox-column">
                <div class="checkbox-option">
                  <input type="checkbox" id="opcao1-${roomId}" name="opcoesInstalacao-${roomId}" value="bocal_insuflamento_protegido" data-field="opcoesInstalacao">
                  <label for="opcao1-${roomId}">Bocal de insuflamento protegido por grelha diretamente no ambiente</label>
                </div>
                <div class="checkbox-option">
                  <input type="checkbox" id="opcao2-${roomId}" name="opcoesInstalacao-${roomId}" value="bocal_acoplado_dutos" data-field="opcoesInstalacao">
                  <label for="opcao2-${roomId}">Bocal acoplado à rede de dutos por lona flexível. Distribuição por grelhas</label>
                </div>
                <div class="checkbox-option">
                  <input type="checkbox" id="opcao3-${roomId}" name="opcoesInstalacao-${roomId}" value="condicionadores_externos_se" data-field="opcoesInstalacao">
                  <label for="opcao3-${roomId}">Condicionadores fixados externamente à SE, sobre mão-francesa na parede</label>
                </div>
              </div>
              <div class="checkbox-column">
                <div class="checkbox-option">
                  <input type="checkbox" id="opcao4-${roomId}" name="opcoesInstalacao-${roomId}" value="evaporadoras_internas" data-field="opcoesInstalacao">
                  <label for="opcao4-${roomId}">Evaporadoras internas ao ambiente climatizado</label>
                </div>
                <div class="checkbox-option">
                  <input type="checkbox" id="opcao5-${roomId}" name="opcoesInstalacao-${roomId}" value="evaporadoras_casa_maquinas" data-field="opcoesInstalacao">
                  <label for="opcao5-${roomId}">Evaporadoras em casa de máquinas</label>
                </div>
                <div class="checkbox-option">
                  <input type="checkbox" id="opcao6-${roomId}" name="opcoesInstalacao-${roomId}" value="condensadores_externos" data-field="opcoesInstalacao">
                  <label for="opcao6-${roomId}">Condensadores fixados externamente à sala elétrica</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
} //exemplo de como ficaria, mas os acessorios são preenchidos automaticamente pelo json 

export {
  buildAccessoriesSection
}