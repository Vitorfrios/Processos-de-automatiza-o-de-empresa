// configuracao.js

/**
 * Constrói a seção de configuração de instalação para uma sala
 * Inclui opções de instalação de climatização em formato de grid com checkboxes
 * @param {string} projectName - Nome do projeto
 * @param {string} roomName - Nome da sala
 * @returns {string} HTML da seção de configuração
 */
function buildConfigurationSection(projectName, roomName) {
  const roomId = `${projectName}-${roomName}`
  return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}-config')">+</button>
        <h4 class="section-title">Configuração de Instalação</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}-config">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="config-label">Opções de Instalação (selecione uma ou mais):</label>
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
}

export {
  buildConfigurationSection
}