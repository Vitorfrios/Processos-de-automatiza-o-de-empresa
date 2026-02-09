/* ==== INÍCIO: data/modules/acessorios.js ==== */
/**
 * acessorios.js - Sistema de seleção de Acessorios de Difusão
 * Interface para selecionar e adicionar acessorios ao projeto
 */

// ✅ ADICIONAR: Função para preenchimento de dados (FALTANTE)
function fillAcessoriosData(roomElement, acessoriosData) {
    if (!roomElement || !acessoriosData) {
        console.error('❌ Elemento da sala ou dados de acessorios inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🔄 Preenchendo acessorios para sala ${roomId}:`, acessoriosData);

    // Verificar se a seção de acessorios existe
    const acessoriosSection = roomElement.querySelector(`#section-content-${roomId}acessorios`);
    if (!acessoriosSection) {
        console.error(`❌ Seção de acessorios não encontrada para sala ${roomId}`);
        return;
    }

    // Se não houver acessorios, sair
    if (!Array.isArray(acessoriosData) || acessoriosData.length === 0) {
        console.log(`ℹ️ Nenhum acessorio para preencher na sala ${roomId}`);
        return;
    }

    // Garantir que a tabela existe
    const tbodyId = `acessorios-list-${roomId}`;
    let tbody = document.getElementById(tbodyId);
    
    if (!tbody) {
        console.log(`📋 Criando tabela de acessorios para sala ${roomId}`);
        
        // Buscar o container da tabela
        const tableContainer = acessoriosSection.querySelector('.acessorios-table-container');
        if (tableContainer) {
            // Criar tabela básica se não existir
            const tableHTML = `
                <table class="acessorios-table" id="acessorios-table-${roomId}">
                    <thead>
                        <tr>
                            <th width="20%">Aplicação</th>
                            <th width="20%">Acessorio</th>
                            <th width="20%">Dimensão</th>
                            <th width="15%">Qtd</th>
                            <th width="15%">Valor Unit.</th>
                            <th width="10%">Total</th>
                            <th width="10%">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="${tbodyId}">
                        <!-- Acessorios serão adicionados aqui -->
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" style="font-weight: bold;">TOTAL:</td>
                            <td id="acessorios-total-${roomId}" style="font-weight: bold;">R$ 0,00</td>
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
        
        // Adicionar cada acessorio
        acessoriosData.forEach(acessorio => {
            adicionarAcessorioNaTabela(roomId, acessorio);
        });
        
        // Atualizar total
        atualizarTotalAcessorios(roomId);
        
        console.log(`✅ ${acessoriosData.length} acessorio(s) preenchido(s) na sala ${roomId}`);
    }
}

/**
 * Constrói a seção de Acessorios de Difusão e Controle de Ar
 */
function buildAcessoriosSection(obraId, projectId, roomName, finalRoomId) {
    // ✅ CORREÇÃO: Validar ID único
    if (!finalRoomId || finalRoomId === 'undefined' || finalRoomId === 'null') {
        console.error(`ERRO FALBACK (buildAcessoriosSection) acessorios.js [Room ID inválido: ${finalRoomId}]`);
        return '';
    }
    
    const roomId = finalRoomId;
    console.log(`🔧 Construindo seção de Acessorios para sala: ${roomName} (ID: ${roomId})`);
    
    return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}acessorios')">+</button>
        <h4 class="section-title">Acessorios de Difusão e Controle de Ar</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}acessorios">
        <div class="form-grid">
          <!-- Seletor de Acessorios -->
          <div class="form-group full-width">
            <label class="acess-label">Adicionar Acessorio:</label>
            <div class="acessorio-selector">
              <div class="selector-grid">
                <div class="selector-item">
                  <label for="aplicacao-${roomId}">Aplicação:</label>
                  <select id="aplicacao-${roomId}" class="aplicacao-select">
                    <option value="">Selecione uma aplicação...</option>
                    <option value="climatizacao">Climatização</option>
                    <option value="pressurizacao">Pressurização</option>
                    <option value="exaustao_bateria">Exaustão da sala de bateria</option>
                    <option value="exaustao_baia_trafo">Exaustão da sala baia de trafo</option>
                  </select>
                </div>
                <div class="selector-item">
                  <label for="acessorio-tipo-${roomId}">Tipo:</label>
                  <select id="acessorio-tipo-${roomId}" class="acessorio-select" onchange="loadAcessorioDimensoes('${roomId}')">
                    <option value="">Selecione um tipo...</option>
                    <!-- Tipos serão carregados via JavaScript -->
                  </select>
                </div>
                <div class="selector-item">
                  <label for="acessorio-dimensao-${roomId}">Dimensão:</label>
                  <select id="acessorio-dimensao-${roomId}" class="acessorio-select" disabled>
                    <option value="">Selecione uma dimensão...</option>
                  </select>
                </div>
                <div class="selector-item">
                  <label for="acessorio-quantidade-${roomId}">Qtd:</label>
                  <input type="number" id="acessorio-quantidade-${roomId}" class="acessorio-input" value="1" min="1" max="100">
                </div>
                <div class="selector-item">
                  <label for="acessorio-valor-${roomId}">Valor:</label>
                  <input type="text" id="acessorio-valor-${roomId}" class="acessorio-input" placeholder="R$ 0,00" readonly>
                </div>
                <div class="selector-item">
                  <button class="btn-add-acessorio" onclick="adicionarAcessorio('${roomId}')">
                    <span class="btn-icon">+</span> Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tabela de Acessorios Adicionados -->
          <div class="form-group full-width">
            <label class="acess-label">Acessorios Selecionados:</label>
            <div class="acessorios-table-container">
              <table class="acessorios-table" id="acessorios-table-${roomId}">
                <thead>
                  <tr>
                    <th width="20%">Aplicação</th>
                    <th width="20%">Acessorio</th>
                    <th width="20%">Dimensão</th>
                    <th width="15%">Qtd</th>
                    <th width="15%">Valor Unit.</th>
                    <th width="10%">Total</th>
                    <th width="10%">Ações</th>
                  </tr>
                </thead>
                <tbody id="acessorios-list-${roomId}">
                  <!-- Lista de acessorios será gerada dinamicamente -->
                  <tr class="empty-row">
                    <td colspan="7">Nenhum acessorio adicionado</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="5" style="font-weight: bold;">TOTAL:</td>
                    <td id="acessorios-total-${roomId}" style="font-weight: bold;">R$ 0,00</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Botões de Ação -->
          <div class="form-group full-width text-center">
            <button class="btn-clear-acessorios" onclick="limparAcessorios('${roomId}')">
              🗑️ Limpar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
    `;
}

/**
 * Inicializa o sistema de acessorios para uma sala
 */
function initAcessoriosSystem(roomId) {
    console.log(`🔧 Inicializando sistema de acessorios para sala: ${roomId}`);
    
    // Carregar tipos de acessorios da API
    carregarTiposAcessorios(roomId);
    
    // Carregar acessorios salvos automaticamente
    carregarAcessoriosSilencioso(roomId);
    
    // Inicializar eventos
    setupAcessoriosEvents(roomId);
}

/**
 * Carrega os tipos de acessorios da API
 */
async function carregarTiposAcessorios(roomId) {
    try {
        const response = await fetch('/api/acessorios/types');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById(`acessorio-tipo-${roomId}`);
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
            
            console.log(`✅ ${data.types.length} tipos de acessorios carregados`);
        } else {
            console.error('❌ Erro ao carregar tipos:', data.error);
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

/**
 * Carrega as dimensões disponíveis para o acessorio selecionado
 */
async function loadAcessorioDimensoes(roomId) {
    const tipoSelect = document.getElementById(`acessorio-tipo-${roomId}`);
    const dimensaoSelect = document.getElementById(`acessorio-dimensao-${roomId}`);
    const valorInput = document.getElementById(`acessorio-valor-${roomId}`);
    
    const tipo = tipoSelect.value;
    
    if (!tipo) {
        dimensaoSelect.disabled = true;
        valorInput.value = 'R$ 0,00';
        return;
    }
    
    try {
        const response = await fetch(`/api/acessorios/type/${tipo}`);
        const data = await response.json();
        
        if (data.success) {
            const acessorio = data.acessorio;
            const valores = acessorio.valores_padrao || {};
            
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
 * Limpa todos os campos de entrada
 */
function limparCamposAcessorio(roomId) {
    const aplicacaoSelect = document.getElementById(`aplicacao-${roomId}`);
    const tipoSelect = document.getElementById(`acessorio-tipo-${roomId}`);
    const dimensaoSelect = document.getElementById(`acessorio-dimensao-${roomId}`);
    const quantidadeInput = document.getElementById(`acessorio-quantidade-${roomId}`);
    const valorInput = document.getElementById(`acessorio-valor-${roomId}`);
    
    // Resetar todos os campos para valores padrão
    aplicacaoSelect.selectedIndex = 0;
    tipoSelect.selectedIndex = 0;
    dimensaoSelect.selectedIndex = 0;
    dimensaoSelect.disabled = true;
    quantidadeInput.value = 1;
    valorInput.value = 'R$ 0,00';
    
    console.log(`🧹 Campos de acessorio limpos para sala ${roomId}`);
}

/**
 * Adiciona um acessorio à lista
 */
function adicionarAcessorio(roomId) {
    const aplicacaoSelect = document.getElementById(`aplicacao-${roomId}`);
    const tipoSelect = document.getElementById(`acessorio-tipo-${roomId}`);
    const dimensaoSelect = document.getElementById(`acessorio-dimensao-${roomId}`);
    const quantidadeInput = document.getElementById(`acessorio-quantidade-${roomId}`);
    const valorInput = document.getElementById(`acessorio-valor-${roomId}`);
    
    // Validações MÍNIMAS (sem obrigatoriedade)
    const tipo = tipoSelect.value;
    const quantidade = parseInt(quantidadeInput.value) || 1;
    
    if (quantidade < 1) {
        alert('A quantidade deve ser no mínimo 1.');
        return;
    }
    
    // Extrair valor (remover "R$ " e converter vírgula para ponto)
    let valorTexto = valorInput.value.replace('R$ ', '').replace('.', '').replace(',', '.');
    const valorUnitario = parseFloat(valorTexto) || 0;
    
    // Se não tem valor, usar 0 (não é obrigatório)
    if (valorUnitario < 0) {
        alert('O valor não pode ser negativo.');
        return;
    }
    
    // Obter nome da aplicação selecionada para exibição
    const aplicacaoNomeDisplay = aplicacaoSelect.value ? 
        aplicacaoSelect.options[aplicacaoSelect.selectedIndex].textContent : 'Outro';
    
    // CORREÇÃO: Salvar apenas aplicacao_Acessorio (valor, não nome)
    const aplicacao_Acessorio = aplicacaoSelect.value || 'outro';
    
    // Obter descrição do tipo
    const descricaoTipo = tipoSelect.value ? 
        tipoSelect.options[tipoSelect.selectedIndex].textContent : 'Personalizado';
    
    // Determinar dimensão
    let dimensao = dimensaoSelect.value || 'N/A';
    if (!dimensaoSelect.value && tipo) {
        // Se tem tipo mas não tem dimensão selecionada, usar primeira disponível
        if (dimensaoSelect.options.length > 1) {
            dimensao = dimensaoSelect.options[1].value || 'N/A';
        }
    }
    
    // CORREÇÃO: Criar objeto do acessorio apenas com aplicacao_Acessorio
    const acessorio = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        aplicacao_Acessorio: aplicacao_Acessorio, // Apenas este campo para aplicação
        tipo: tipo || 'acessorio_personalizado',
        dimensao: dimensao,
        quantidade: quantidade,
        valor_unitario: valorUnitario,
        valor_total: valorUnitario * quantidade,
        descricao: descricaoTipo
    };
    
    // Adicionar à lista
    adicionarAcessorioNaTabela(roomId, acessorio);
    
    // Limpar TODOS os campos
    limparCamposAcessorio(roomId);
    
    console.log(`✅ Acessorio adicionado: ${aplicacaoNomeDisplay} - ${acessorio.descricao}`);
}

/**
 * Adiciona acessorio na tabela HTML
 */
function adicionarAcessorioNaTabela(roomId, acessorio) {
    const tbody = document.getElementById(`acessorios-list-${roomId}`);
    const emptyRow = tbody.querySelector('.empty-row');
    
    // Remover linha vazia se existir
    if (emptyRow) {
        emptyRow.remove();
    }
    
    // Mapear valor da aplicação para nome de exibição
    const aplicacaoDisplayMap = {
        'climatizacao': 'Climatização',
        'pressurizacao': 'Pressurização',
        'exaustao_bateria': 'Exaustão da sala de bateria',
        'exaustao_baia_trafo': 'Exaustão da sala baia de trafo',
        'outro': 'Outro'
    };
    
    // Obter nome para exibição
    const aplicacaoDisplay = aplicacaoDisplayMap[acessorio.aplicacao_Acessorio] || 'Outro';
    
    // Criar nova linha
    const row = document.createElement('tr');
    row.id = `acessorio-${acessorio.id}`;
    row.className = 'acessorio-row';
    row.setAttribute('data-acessorio', JSON.stringify(acessorio));
    
    row.innerHTML = `
        <td>${aplicacaoDisplay}</td>
        <td>${acessorio.descricao}</td>
        <td>${acessorio.dimensao}</td>
        <td>${acessorio.quantidade}</td>
        <td>R$ ${formatarMoeda(acessorio.valor_unitario)}</td>
        <td>R$ ${formatarMoeda(acessorio.valor_total)}</td>
        <td>
            <button class="btn-remove-acessorio" onclick="removerAcessorio('${roomId}', '${acessorio.id}')">
                🗑️
            </button>
            <button class="btn-edit-acessorio" onclick="editarAcessorio('${roomId}', '${acessorio.id}')">
                ✏️
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Atualizar total
    atualizarTotalAcessorios(roomId);
    
    // Salvar no localStorage
    salvarAcessorios(roomId);
}

/**
 * Remove um acessorio da lista
 */
function removerAcessorio(roomId, acessorioId) {
    const row = document.getElementById(`acessorio-${acessorioId}`);
    if (row) {
        row.remove();
        
        // Verificar se a tabela está vazia
        const tbody = document.getElementById(`acessorios-list-${roomId}`);
        if (tbody.children.length === 0) {
            // Adicionar linha vazia
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-row';
            emptyRow.innerHTML = '<td colspan="7">Nenhum acessorio adicionado</td>';
            tbody.appendChild(emptyRow);
        }
        
        // Atualizar total
        atualizarTotalAcessorios(roomId);
        
        // Salvar no localStorage
        salvarAcessorios(roomId);
        
        console.log(`🗑️ Acessorio removido: ${acessorioId}`);
    }
}

/**
 * Edita um acessorio existente
 */
function editarAcessorio(roomId, acessorioId) {
    const row = document.getElementById(`acessorio-${acessorioId}`);
    if (!row) return;
    
    const acessorioData = JSON.parse(row.getAttribute('data-acessorio'));
    
    // Preencher campos de entrada
    const aplicacaoSelect = document.getElementById(`aplicacao-${roomId}`);
    const tipoSelect = document.getElementById(`acessorio-tipo-${roomId}`);
    const dimensaoSelect = document.getElementById(`acessorio-dimensao-${roomId}`);
    const quantidadeInput = document.getElementById(`acessorio-quantidade-${roomId}`);
    const valorInput = document.getElementById(`acessorio-valor-${roomId}`);
    
    // CORREÇÃO: Selecionar aplicação usando aplicacao_Acessorio
    for (let i = 0; i < aplicacaoSelect.options.length; i++) {
        if (aplicacaoSelect.options[i].value === acessorioData.aplicacao_Acessorio) {
            aplicacaoSelect.selectedIndex = i;
            break;
        }
    }
    
    // Selecionar tipo
    for (let i = 0; i < tipoSelect.options.length; i++) {
        if (tipoSelect.options[i].value === acessorioData.tipo) {
            tipoSelect.selectedIndex = i;
            break;
        }
    }
    
    // Carregar dimensões e selecionar
    if (acessorioData.tipo && acessorioData.tipo !== 'acessorio_personalizado') {
        loadAcessorioDimensoes(roomId).then(() => {
            setTimeout(() => {
                for (let i = 0; i < dimensaoSelect.options.length; i++) {
                    if (dimensaoSelect.options[i].value === acessorioData.dimensao) {
                        dimensaoSelect.selectedIndex = i;
                        break;
                    }
                }
                
                // Preencher quantidade e valor
                quantidadeInput.value = acessorioData.quantidade;
                valorInput.value = `R$ ${formatarMoeda(acessorioData.valor_unitario)}`;
                
                // Remover acessorio da lista
                removerAcessorio(roomId, acessorioId);
                
                console.log(`✏️ Acessorio em edição: ${acessorioId}`);
            }, 500);
        });
    } else {
        // Para acessorios personalizados, apenas preencher campos básicos
        dimensaoSelect.disabled = true;
        dimensaoSelect.selectedIndex = 0;
        
        // Preencher quantidade e valor
        quantidadeInput.value = acessorioData.quantidade;
        valorInput.value = `R$ ${formatarMoeda(acessorioData.valor_unitario)}`;
        
        // Remover acessorio da lista
        removerAcessorio(roomId, acessorioId);
        
        console.log(`✏️ Acessorio personalizado em edição: ${acessorioId}`);
    }
}

/**
 * Atualiza o total de acessorios
 */
function atualizarTotalAcessorios(roomId) {
    const tbody = document.getElementById(`acessorios-list-${roomId}`);
    const rows = tbody.querySelectorAll('.acessorio-row');
    
    let total = 0;
    
    rows.forEach(row => {
        const acessorioData = JSON.parse(row.getAttribute('data-acessorio'));
        total += acessorioData.valor_total;
    });
    
    const totalElement = document.getElementById(`acessorios-total-${roomId}`);
    if (totalElement) {
        totalElement.textContent = `R$ ${formatarMoeda(total)}`;
        
        // 🔥 NOVO: Dispara evento de atualização
        const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
        if (roomElement) {
            const projectId = roomElement.dataset.projectId;
            if (projectId) {
                document.dispatchEvent(new CustomEvent('valorAtualizado', {
                    detail: { 
                        tipo: 'acessorio',
                        roomId,
                        projectId,
                        valor: total
                    }
                }));
            }
        }
    }
}

/**
 * Carrega acessorios do localStorage (silenciosamente - sem botão)
 */
function carregarAcessoriosSilencioso(roomId) {
    const key = `acessorios_${roomId}`;
    const acessoriosSalvos = localStorage.getItem(key);
    
    if (!acessoriosSalvos) {
        console.log(`📋 Nenhum acessorio salvo para sala ${roomId}`);
        return;
    }
    
    try {
        const acessorios = JSON.parse(acessoriosSalvos);
        
        // Limpar lista atual
        const tbody = document.getElementById(`acessorios-list-${roomId}`);
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Adicionar acessorios salvos
        acessorios.forEach(acessorio => {
            adicionarAcessorioNaTabela(roomId, acessorio);
        });
        
        console.log(`📋 ${acessorios.length} acessorio(s) carregado(s) automaticamente para sala ${roomId}`);
    } catch (error) {
        console.error('❌ Erro ao carregar acessorios:', error);
    }
}

/**
 * Salva acessorios no localStorage
 */
function salvarAcessorios(roomId) {
    const tbody = document.getElementById(`acessorios-list-${roomId}`);
    const rows = tbody.querySelectorAll('.acessorio-row');
    
    const acessorios = [];
    
    rows.forEach(row => {
        const acessorioData = JSON.parse(row.getAttribute('data-acessorio'));
        acessorios.push(acessorioData);
    });
    
    const key = `acessorios_${roomId}`;
    localStorage.setItem(key, JSON.stringify(acessorios));
    
    console.log(`💾 ${acessorios.length} acessorio(s) salvos para sala ${roomId}`);
}

/**
 * Limpa todos os acessorios
 */
function limparAcessorios(roomId) {
    if (confirm('Tem certeza que deseja limpar todos os acessorios?')) {
        const tbody = document.getElementById(`acessorios-list-${roomId}`);
        tbody.innerHTML = '';
        
        // Adicionar linha vazia
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = '<td colspan="7">Nenhum acessorio adicionado</td>';
        tbody.appendChild(emptyRow);
        
        // Atualizar total
        atualizarTotalAcessorios(roomId);
        
        // Limpar localStorage
        const key = `acessorios_${roomId}`;
        localStorage.removeItem(key);
        
        console.log(`🗑️ Todos os acessorios removidos da sala ${roomId}`);
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
 * Configura eventos para o sistema de acessorios
 */
function setupAcessoriosEvents(roomId) {
    const quantidadeInput = document.getElementById(`acessorio-quantidade-${roomId}`);
    if (quantidadeInput) {
        quantidadeInput.addEventListener('change', function() {
            if (this.value < 1) this.value = 1;
            if (this.value > 100) this.value = 100;
        });
    }
    
    // Salvar automaticamente ao sair da página
    window.addEventListener('beforeunload', function() {
        salvarAcessorios(roomId);
    });
}

// ✅ CORREÇÃO: Exportar TODAS as funções
export {
    buildAcessoriosSection,
    fillAcessoriosData,
    initAcessoriosSystem,
    carregarTiposAcessorios,
    loadAcessorioDimensoes,
    limparCamposAcessorio,
    adicionarAcessorio,
    adicionarAcessorioNaTabela,
    removerAcessorio,
    editarAcessorio,
    atualizarTotalAcessorios,
    salvarAcessorios,
    limparAcessorios,
    formatarMoeda,
    setupAcessoriosEvents,
};

// ✅ CORREÇÃO CRÍTICA: Tornar funções disponíveis globalmente
if (typeof window !== 'undefined') {
    window.fillAcessoriosData = fillAcessoriosData;
    window.initAcessoriosSystem = initAcessoriosSystem;
    window.adicionarAcessorioNaTabela = adicionarAcessorioNaTabela;
    window.atualizarTotalAcessorios = atualizarTotalAcessorios;
    window.formatarMoeda = formatarMoeda;
    window.buildAcessoriosSection = buildAcessoriosSection;
    window.carregarTiposAcessorios = carregarTiposAcessorios;
    window.loadAcessorioDimensoes = loadAcessorioDimensoes;
    window.limparCamposAcessorio = limparCamposAcessorio;
    window.adicionarAcessorio = adicionarAcessorio;
    window.salvarAcessorios = salvarAcessorios;
    window.limparAcessorios = limparAcessorios;
    window.removerAcessorio = removerAcessorio;
    window.editarAcessorio = editarAcessorio;
    
    // ✅ Helper para debug
    window.debugAcessoriosSystem = function(roomId) {
        console.log('🔍 Debug Sistema de Acessorios:');
        console.log('- fillAcessoriosData:', typeof window.fillAcessoriosData);
        console.log('- initAcessoriosSystem:', typeof window.initAcessoriosSystem);
        console.log('- adicionarAcessorioNaTabela:', typeof window.adicionarAcessorioNaTabela);
        console.log('- loadAcessorioDimensoes:', typeof window.loadAcessorioDimensoes);
        console.log('- adicionarAcessorio:', typeof window.adicionarAcessorio);
        console.log('- Sala:', roomId);
        console.log('- Tabela existe?', !!document.getElementById(`acessorios-list-${roomId}`));
    };
}

/* ==== FIM: data/modules/acessorios.js ==== */