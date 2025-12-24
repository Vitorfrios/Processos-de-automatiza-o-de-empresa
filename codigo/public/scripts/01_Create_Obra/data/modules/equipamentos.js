/* ==== INÍCIO: data/modules/equipamentos.js ==== */
/**
 * equipamentos.js - Sistema de seleção de Equipamentos de Difusão
 * Interface para selecionar e adicionar equipamentos ao projeto
 */

// ✅ ADICIONAR: Função para preenchimento de dados (FALTANTE)
function fillEquipamentosData(roomElement, equipamentosData) {
    if (!roomElement || !equipamentosData) {
        console.error('❌ Elemento da sala ou dados de equipamentos inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🔄 Preenchendo equipamentos para sala ${roomId}:`, equipamentosData);

    // Verificar se a seção de equipamentos existe
    const equipamentosSection = roomElement.querySelector(`#section-content-${roomId}equipamentos`);
    if (!equipamentosSection) {
        console.error(`❌ Seção de equipamentos não encontrada para sala ${roomId}`);
        return;
    }

    // Se não houver equipamentos, sair
    if (!Array.isArray(equipamentosData) || equipamentosData.length === 0) {
        console.log(`ℹ️ Nenhum equipamento para preencher na sala ${roomId}`);
        return;
    }

    // Garantir que a tabela existe
    const tbodyId = `equipamentos-list-${roomId}`;
    let tbody = document.getElementById(tbodyId);
    
    if (!tbody) {
        console.log(`📋 Criando tabela de equipamentos para sala ${roomId}`);
        
        // Buscar o container da tabela
        const tableContainer = equipamentosSection.querySelector('.equipamentos-table-container');
        if (tableContainer) {
            // Criar tabela básica se não existir
            const tableHTML = `
                <table class="equipamentos-table" id="equipamentos-table-${roomId}">
                    <thead>
                        <tr>
                            <th width="30%">Equipamento</th>
                            <th width="25%">Dimensão</th>
                            <th width="15%">Qtd</th>
                            <th width="20%">Valor Unit.</th>
                            <th width="10%">Total</th>
                            <th width="10%">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="${tbodyId}">
                        <!-- Equipamentos serão adicionados aqui -->
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL:</td>
                            <td id="equipamentos-total-${roomId}" style="font-weight: bold;">R$ 0,00</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            `;
            
            tableContainer.innerHTML = tableHTML;
            tbody = document.getElementById(tbodyId);
        }
    }

    if (tbody) {
        // Limpar tabela atual
        tbody.innerHTML = '';
        
        // Adicionar cada equipamento
        equipamentosData.forEach(equipamento => {
            adicionarEquipamentoNaTabela(roomId, equipamento);
        });
        
        // Atualizar total
        atualizarTotalEquipamentos(roomId);
        
        console.log(`✅ ${equipamentosData.length} equipamento(s) preenchido(s) na sala ${roomId}`);
    }
}

/**
 * Constrói a seção de Equipamentos de Difusão e Controle de Ar
 */
function buildEquipamentosSection(obraId, projectId, roomName, finalRoomId) {
    // ✅ CORREÇÃO: Validar ID único
    if (!finalRoomId || finalRoomId === 'undefined' || finalRoomId === 'null') {
        console.error(`ERRO FALBACK (buildEquipamentosSection) equipamentos.js [Room ID inválido: ${finalRoomId}]`);
        return '';
    }
    
    const roomId = finalRoomId;
    console.log(`🔧 Construindo seção de Equipamentos para sala: ${roomName} (ID: ${roomId})`);
    
    return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}equipamentos')">+</button>
        <h4 class="section-title">Equipamentos de Difusão e Controle de Ar</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}equipamentos">
        <div class="form-grid">
          <!-- Seletor de Equipamentos -->
          <div class="form-group full-width">
            <label class="acess-label">Adicionar Equipamento:</label>
            <div class="equipamento-selector">
              <div class="selector-grid">
                <div class="selector-item">
                  <label for="equipamento-tipo-${roomId}">Tipo:</label>
                  <select id="equipamento-tipo-${roomId}" class="equipamento-select" onchange="loadEquipamentoDimensoes('${roomId}')">
                    <option value="">Selecione um tipo...</option>
                    <!-- Tipos serão carregados via JavaScript -->
                  </select>
                </div>
                <div class="selector-item">
                  <label for="equipamento-dimensao-${roomId}">Dimensão:</label>
                  <select id="equipamento-dimensao-${roomId}" class="equipamento-select" disabled>
                    <option value="">Selecione uma dimensão...</option>
                  </select>
                </div>
                <div class="selector-item">
                  <label for="equipamento-quantidade-${roomId}">Qtd:</label>
                  <input type="number" id="equipamento-quantidade-${roomId}" class="equipamento-input" value="1" min="1" max="100">
                </div>
                <div class="selector-item">
                  <label for="equipamento-valor-${roomId}">Valor:</label>
                  <input type="text" id="equipamento-valor-${roomId}" class="equipamento-input" placeholder="R$ 0,00" readonly>
                </div>
                <div class="selector-item">
                  <button class="btn-add-equipamento" onclick="adicionarEquipamento('${roomId}')">
                    <span class="btn-icon">+</span> Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tabela de Equipamentos Adicionados -->
          <div class="form-group full-width">
            <label class="acess-label">Equipamentos Selecionados:</label>
            <div class="equipamentos-table-container">
              <table class="equipamentos-table" id="equipamentos-table-${roomId}">
                <thead>
                  <tr>
                    <th width="30%">Equipamento</th>
                    <th width="25%">Dimensão</th>
                    <th width="15%">Qtd</th>
                    <th width="20%">Valor Unit.</th>
                    <th width="10%">Total</th>
                    <th width="10%">Ações</th>
                  </tr>
                </thead>
                <tbody id="equipamentos-list-${roomId}">
                  <!-- Lista de equipamentos será gerada dinamicamente -->
                  <tr class="empty-row">
                    <td colspan="6">Nenhum equipamento adicionado</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL:</td>
                    <td id="equipamentos-total-${roomId}" style="font-weight: bold;">R$ 0,00</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Botões de Ação -->
          <div class="form-group full-width text-center">
            <button class="btn-load-equipamentos" onclick="carregarEquipamentos('${roomId}')">
              📋 Carregar Salvos
            </button>
            <button class="btn-clear-equipamentos" onclick="limparEquipamentos('${roomId}')">
              🗑️ Limpar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
    `;
}

/**
 * Inicializa o sistema de equipamentos para uma sala
 */
function initEquipamentosSystem(roomId) {
    console.log(`🔧 Inicializando sistema de equipamentos para sala: ${roomId}`);
    
    // Carregar tipos de equipamentos da API
    carregarTiposEquipamentos(roomId);
    
    // Carregar equipamentos salvos
    carregarEquipamentos(roomId);
    
    // Inicializar eventos
    setupEquipamentosEvents(roomId);
}

/**
 * Carrega os tipos de equipamentos da API
 */
async function carregarTiposEquipamentos(roomId) {
    try {
        const response = await fetch('/api/equipamentos/types');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById(`equipamento-tipo-${roomId}`);
            if (!select) return;
            
            // Limpar opções existentes (exceto a primeira)
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Adicionar opções
            data.types.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                select.appendChild(option);
            });
            
            console.log(`✅ ${data.types.length} tipos de equipamentos carregados`);
        } else {
            console.error('❌ Erro ao carregar tipos:', data.error);
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

/**
 * Carrega as dimensões disponíveis para o equipamento selecionado
 */
async function loadEquipamentoDimensoes(roomId) {
    const tipoSelect = document.getElementById(`equipamento-tipo-${roomId}`);
    const dimensaoSelect = document.getElementById(`equipamento-dimensao-${roomId}`);
    const valorInput = document.getElementById(`equipamento-valor-${roomId}`);
    
    const tipo = tipoSelect.value;
    
    if (!tipo) {
        dimensaoSelect.disabled = true;
        valorInput.value = 'R$ 0,00';
        return;
    }
    
    try {
        const response = await fetch(`/api/equipamentos/type/${tipo}`);
        const data = await response.json();
        
        if (data.success) {
            const equipamento = data.equipamento;
            const valores = equipamento.valores_padrao || {};
            
            // Limpar e preencher dimensões
            dimensaoSelect.innerHTML = '<option value="">Selecione uma dimensão...</option>';
            
            Object.keys(valores).forEach(dimensao => {
                const option = document.createElement('option');
                option.value = dimensao;
                option.textContent = dimensao;
                option.setAttribute('data-valor', valores[dimensao]);
                dimensaoSelect.appendChild(option);
            });
            
            dimensaoSelect.disabled = false;
            valorInput.value = 'R$ 0,00';
            
            // Adicionar evento para atualizar valor
            dimensaoSelect.onchange = function() {
                const selectedOption = this.options[this.selectedIndex];
                const valor = selectedOption.getAttribute('data-valor');
                if (valor) {
                    const valorFormatado = formatarMoeda(parseFloat(valor));
                    valorInput.value = `R$ ${valorFormatado}`;
                } else {
                    valorInput.value = 'R$ 0,00';
                }
            };
            
            console.log(`✅ ${Object.keys(valores).length} dimensões carregadas para ${tipo}`);
        } else {
            console.error('❌ Erro ao carregar dimensões:', data.error);
            dimensaoSelect.disabled = true;
            valorInput.value = 'R$ 0,00';
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        dimensaoSelect.disabled = true;
        valorInput.value = 'R$ 0,00';
    }
}

/**
 * Adiciona um equipamento à lista
 */
function adicionarEquipamento(roomId) {
    const tipoSelect = document.getElementById(`equipamento-tipo-${roomId}`);
    const dimensaoSelect = document.getElementById(`equipamento-dimensao-${roomId}`);
    const quantidadeInput = document.getElementById(`equipamento-quantidade-${roomId}`);
    const valorInput = document.getElementById(`equipamento-valor-${roomId}`);
    
    // Validações
    if (!tipoSelect.value) {
        alert('Por favor, selecione um tipo de equipamento.');
        return;
    }
    
    if (!dimensaoSelect.value) {
        alert('Por favor, selecione uma dimensão.');
        return;
    }
    
    const quantidade = parseInt(quantidadeInput.value) || 1;
    if (quantidade < 1) {
        alert('A quantidade deve ser no mínimo 1.');
        return;
    }
    
    // Extrair valor (remover "R$ " e converter vírgula para ponto)
    let valorTexto = valorInput.value.replace('R$ ', '').replace('.', '').replace(',', '.');
    const valorUnitario = parseFloat(valorTexto) || 0;
    
    if (valorUnitario <= 0) {
        alert('Valor inválido.');
        return;
    }
    
    // Criar objeto do equipamento
    const equipamento = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        tipo: tipoSelect.value,
        dimensao: dimensaoSelect.value,
        quantidade: quantidade,
        valor_unitario: valorUnitario,
        valor_total: valorUnitario * quantidade,
        descricao: tipoSelect.options[tipoSelect.selectedIndex].textContent
    };
    
    // Adicionar à lista
    adicionarEquipamentoNaTabela(roomId, equipamento);
    
    // Limpar campos
    dimensaoSelect.selectedIndex = 0;
    quantidadeInput.value = 1;
    valorInput.value = 'R$ 0,00';
    
    console.log(`✅ Equipamento adicionado: ${equipamento.tipo} ${equipamento.dimensao}`);
}

/**
 * Adiciona equipamento na tabela HTML
 */
function adicionarEquipamentoNaTabela(roomId, equipamento) {
    const tbody = document.getElementById(`equipamentos-list-${roomId}`);
    const emptyRow = tbody.querySelector('.empty-row');
    
    // Remover linha vazia se existir
    if (emptyRow) {
        emptyRow.remove();
    }
    
    // Criar nova linha
    const row = document.createElement('tr');
    row.id = `equipamento-${equipamento.id}`;
    row.className = 'equipamento-row';
    row.setAttribute('data-equipamento', JSON.stringify(equipamento));
    
    row.innerHTML = `
        <td>${equipamento.descricao}</td>
        <td>${equipamento.dimensao}</td>
        <td>${equipamento.quantidade}</td>
        <td>R$ ${formatarMoeda(equipamento.valor_unitario)}</td>
        <td>R$ ${formatarMoeda(equipamento.valor_total)}</td>
        <td>
            <button class="btn-remove-equipamento" onclick="removerEquipamento('${roomId}', '${equipamento.id}')">
                🗑️
            </button>
            <button class="btn-edit-equipamento" onclick="editarEquipamento('${roomId}', '${equipamento.id}')">
                ✏️
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Atualizar total
    atualizarTotalEquipamentos(roomId);
}

/**
 * Remove um equipamento da lista
 */
function removerEquipamento(roomId, equipamentoId) {
    const row = document.getElementById(`equipamento-${equipamentoId}`);
    if (row) {
        row.remove();
        
        // Verificar se a tabela está vazia
        const tbody = document.getElementById(`equipamentos-list-${roomId}`);
        if (tbody.children.length === 0) {
            // Adicionar linha vazia
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-row';
            emptyRow.innerHTML = '<td colspan="6">Nenhum equipamento adicionado</td>';
            tbody.appendChild(emptyRow);
        }
        
        // Atualizar total
        atualizarTotalEquipamentos(roomId);
        
        console.log(`🗑️ Equipamento removido: ${equipamentoId}`);
    }
}

/**
 * Edita um equipamento existente
 */
function editarEquipamento(roomId, equipamentoId) {
    const row = document.getElementById(`equipamento-${equipamentoId}`);
    if (!row) return;
    
    const equipamentoData = JSON.parse(row.getAttribute('data-equipamento'));
    
    // Preencher campos de entrada
    const tipoSelect = document.getElementById(`equipamento-tipo-${roomId}`);
    const dimensaoSelect = document.getElementById(`equipamento-dimensao-${roomId}`);
    const quantidadeInput = document.getElementById(`equipamento-quantidade-${roomId}`);
    const valorInput = document.getElementById(`equipamento-valor-${roomId}`);
    
    // Selecionar tipo
    for (let i = 0; i < tipoSelect.options.length; i++) {
        if (tipoSelect.options[i].value === equipamentoData.tipo) {
            tipoSelect.selectedIndex = i;
            break;
        }
    }
    
    // Carregar dimensões e selecionar
    loadEquipamentoDimensoes(roomId).then(() => {
        setTimeout(() => {
            for (let i = 0; i < dimensaoSelect.options.length; i++) {
                if (dimensaoSelect.options[i].value === equipamentoData.dimensao) {
                    dimensaoSelect.selectedIndex = i;
                    break;
                }
            }
            
            // Preencher quantidade e valor
            quantidadeInput.value = equipamentoData.quantidade;
            valorInput.value = `R$ ${formatarMoeda(equipamentoData.valor_unitario)}`;
            
            // Remover equipamento da lista
            removerEquipamento(roomId, equipamentoId);
            
            console.log(`✏️ Equipamento em edição: ${equipamentoId}`);
        }, 500);
    });
}

/**
 * Atualiza o total de equipamentos
 */
function atualizarTotalEquipamentos(roomId) {
    const tbody = document.getElementById(`equipamentos-list-${roomId}`);
    const rows = tbody.querySelectorAll('.equipamento-row');
    
    let total = 0;
    
    rows.forEach(row => {
        const equipamentoData = JSON.parse(row.getAttribute('data-equipamento'));
        total += equipamentoData.valor_total;
    });
    
    const totalElement = document.getElementById(`equipamentos-total-${roomId}`);
    if (totalElement) {
        totalElement.textContent = `R$ ${formatarMoeda(total)}`;
    }
}



/**
 * Carrega equipamentos do localStorage
 */
function carregarEquipamentos(roomId) {
    const key = `equipamentos_${roomId}`;
    const equipamentosSalvos = localStorage.getItem(key);
    
    if (!equipamentosSalvos) {
        console.log(`📋 Nenhum equipamento salvo para sala ${roomId}`);
        return;
    }
    
    try {
        const equipamentos = JSON.parse(equipamentosSalvos);
        
        // Limpar lista atual
        const tbody = document.getElementById(`equipamentos-list-${roomId}`);
        tbody.innerHTML = '';
        
        // Adicionar equipamentos salvos
        equipamentos.forEach(equipamento => {
            adicionarEquipamentoNaTabela(roomId, equipamento);
        });
        
        console.log(`📋 ${equipamentos.length} equipamento(s) carregado(s) para sala ${roomId}`);
    } catch (error) {
        console.error('❌ Erro ao carregar equipamentos:', error);
    }
}

/**
 * Limpa todos os equipamentos
 */
function limparEquipamentos(roomId) {
    if (confirm('Tem certeza que deseja limpar todos os equipamentos?')) {
        const tbody = document.getElementById(`equipamentos-list-${roomId}`);
        tbody.innerHTML = '';
        
        // Adicionar linha vazia
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = '<td colspan="6">Nenhum equipamento adicionado</td>';
        tbody.appendChild(emptyRow);
        
        // Atualizar total
        atualizarTotalEquipamentos(roomId);
        
        // Limpar localStorage
        const key = `equipamentos_${roomId}`;
        localStorage.removeItem(key);
        
        console.log(`🗑️ Todos os equipamentos removidos da sala ${roomId}`);
    }
}

/**
 * Formata valor para moeda brasileira
 */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Configura eventos para o sistema de equipamentos
 */
function setupEquipamentosEvents(roomId) {
    const quantidadeInput = document.getElementById(`equipamento-quantidade-${roomId}`);
    if (quantidadeInput) {
        quantidadeInput.addEventListener('change', function() {
            if (this.value < 1) this.value = 1;
            if (this.value > 100) this.value = 100;
        });
    }
}

// ✅ CORREÇÃO: Exportar TODAS as funções
export {
    buildEquipamentosSection,
    fillEquipamentosData, // ← FUNÇÃO NOVA ADICIONADA
    initEquipamentosSystem,
    carregarTiposEquipamentos,
    loadEquipamentoDimensoes,
    adicionarEquipamento,
    adicionarEquipamentoNaTabela,
    removerEquipamento,
    editarEquipamento,
    atualizarTotalEquipamentos,
    carregarEquipamentos,
    limparEquipamentos,
    formatarMoeda,
    setupEquipamentosEvents,
};

// ✅ CORREÇÃO CRÍTICA: Tornar funções disponíveis globalmente
if (typeof window !== 'undefined') {
    window.fillEquipamentosData = fillEquipamentosData;
    window.initEquipamentosSystem = initEquipamentosSystem;
    window.adicionarEquipamentoNaTabela = adicionarEquipamentoNaTabela;
    window.atualizarTotalEquipamentos = atualizarTotalEquipamentos;
    window.formatarMoeda = formatarMoeda;
    window.buildEquipamentosSection = buildEquipamentosSection;
    window.carregarTiposEquipamentos = carregarTiposEquipamentos;
    window.loadEquipamentoDimensoes = loadEquipamentoDimensoes;
    window.adicionarEquipamento = adicionarEquipamento;
    window.carregarEquipamentos = carregarEquipamentos;
    window.limparEquipamentos = limparEquipamentos;
    window.removerEquipamento = removerEquipamento;
    window.editarEquipamento = editarEquipamento;
    
    // ✅ Helper para debug
    window.debugEquipamentosSystem = function(roomId) {
        console.log('🔍 Debug Sistema de Equipamentos:');
        console.log('- fillEquipamentosData:', typeof window.fillEquipamentosData);
        console.log('- initEquipamentosSystem:', typeof window.initEquipamentosSystem);
        console.log('- Sala:', roomId);
        console.log('- Tabela existe?', !!document.getElementById(`equipamentos-list-${roomId}`));
    };
}

/* ==== FIM: data/modules/equipamentos.js ==== */
