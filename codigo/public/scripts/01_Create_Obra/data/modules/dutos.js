/* ==== INÍCIO: data/modules/dutos.js ==== */
/**
 * dutos.js - Sistema de seleção de Dutos para Climatização
 * Interface para selecionar e adicionar dutos ao projeto
 */

// ✅ ADICIONAR: Função para preenchimento de dados
function fillDutosData(roomElement, dutosData) {
    if (!roomElement || !dutosData) {
        console.error('❌ Elemento da sala ou dados de dutos inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🔄 Preenchendo dutos para sala ${roomId}:`, dutosData);

    // Verificar se a seção de dutos existe
    const dutosSection = roomElement.querySelector(`#section-content-${roomId}dutos`);
    if (!dutosSection) {
        console.error(`❌ Seção de dutos não encontrada para sala ${roomId}`);
        return;
    }

    // Se não houver dutos, sair
    if (!Array.isArray(dutosData) || dutosData.length === 0) {
        console.log(`ℹ️ Nenhum duto para preencher na sala ${roomId}`);
        return;
    }

    // Garantir que a tabela existe
    const tbodyId = `dutos-list-${roomId}`;
    let tbody = document.getElementById(tbodyId);
    
    if (!tbody) {
        console.log(`📋 Criando tabela de dutos para sala ${roomId}`);
        
        // Buscar o container da tabela
        const tableContainer = dutosSection.querySelector('.dutos-table-container');
        if (tableContainer) {
            // Criar tabela básica se não existir
            const tableHTML = `
                <table class="dutos-table" id="dutos-table-${roomId}">
                    <thead>
                        <tr>
                            <th width="20%">Tipo de Duto</th>
                            <th width="20%">Opcional</th>
                            <th width="15%">KG</th>
                            <th width="15%">Valor Tipo</th>
                            <th width="15%">Valor Opcional</th>
                            <th width="15%">Total</th>
                            <th width="10%">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="${tbodyId}">
                        <!-- Dutos serão adicionados aqui -->
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" style="text-align: right; font-weight: bold;">TOTAL:</td>
                            <td id="dutos-total-${roomId}" style="font-weight: bold;">R$ 0,00</td>
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
        
        // Adicionar cada duto
        dutosData.forEach(duto => {
            adicionarDutoNaTabela(roomId, duto);
        });
        
        // Atualizar total
        atualizarTotalDutos(roomId);
        
        console.log(`✅ ${dutosData.length} duto(s) preenchido(s) na sala ${roomId}`);
    }
}

/**
 * Constrói a seção de Dutos para Climatização
 */
function buildDutosSection(obraId, projectId, roomName, finalRoomId) {
    // ✅ CORREÇÃO: Validar ID único
    if (!finalRoomId || finalRoomId === 'undefined' || finalRoomId === 'null') {
        console.error(`ERRO FALBACK (buildDutosSection) dutos.js [Room ID inválido: ${finalRoomId}]`);
        return '';
    }
    
    const roomId = finalRoomId;
    console.log(`🔧 Construindo seção de Dutos para sala: ${roomName} (ID: ${roomId})`);
    
    return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}dutos')">+</button>
        <h4 class="section-title">Dutos para Climatização</h4>
      </div>
      <div class="section-content collapsed" id="section-content-${roomId}dutos">
        <div class="form-grid">
          <!-- Seletor de Dutos -->
          <div class="form-group full-width">
            <label class="acess-label">Adicionar Duto:</label>
            <div class="duto-selector">
              <div class="selector-grid">
                <div class="selector-item">
                  <label for="duto-tipo-${roomId}">Tipo:</label>
                  <select id="duto-tipo-${roomId}" class="duto-select" onchange="loadDutoOpcionais('${roomId}')">
                    <option value="">Selecione um tipo...</option>
                    <!-- Tipos serão carregados via JavaScript -->
                  </select>
                </div>
                <div class="selector-item">
                  <label for="duto-opcional-${roomId}">Opcional:</label>
                  <select id="duto-opcional-${roomId}" class="duto-select" disabled>
                    <option value="">Selecione um opcional...</option>
                  </select>
                </div>
                <div class="selector-item">
                  <label for="duto-kg-${roomId}">KG:</label>
                  <input type="number" id="duto-kg-${roomId}" class="duto-input" 
                         value="1" min="0.1" max="1000" step="0.1"
                         onchange="calcularValorDuto('${roomId}')">
                </div>
                <div class="selector-item">
                  <label for="duto-valor-tipo-${roomId}">Valor Tipo:</label>
                  <input type="text" id="duto-valor-tipo-${roomId}" class="duto-input" readonly>
                </div>
                <div class="selector-item">
                  <label for="duto-valor-opcional-${roomId}">Valor Opcional:</label>
                  <input type="text" id="duto-valor-opcional-${roomId}" class="duto-input" readonly>
                </div>
                <div class="selector-item">
                  <label for="duto-valor-total-${roomId}">Valor Total:</label>
                  <input type="text" id="duto-valor-total-${roomId}" class="duto-input" placeholder="R$ 0,00" readonly>
                </div>
                <div class="selector-item">
                  <button class="btn-add-duto" onclick="adicionarDuto('${roomId}')">
                    <span class="btn-icon">+</span> Adicionar
                  </button>
                </div>
              </div>
              <div class="kg-info" id="kg-info-${roomId}" style="margin-top: 10px; font-size: 12px; color: #666;">
                <!-- Informações sobre valor do cobre serão exibidas aqui -->
              </div>
            </div>
          </div>
          
          <!-- Tabela de Dutos Adicionados -->
          <div class="form-group full-width">
            <label class="acess-label">Dutos Selecionados:</label>
            <div class="dutos-table-container">
              <table class="dutos-table" id="dutos-table-${roomId}">
                <thead>
                  <tr>
                    <th width="20%">Tipo de Duto</th>
                    <th width="20%">Opcional</th>
                    <th width="15%">KG</th>
                    <th width="15%">Valor Tipo</th>
                    <th width="15%">Valor Opcional</th>
                    <th width="15%">Total</th>
                    <th width="10%">Ações</th>
                  </tr>
                </thead>
                <tbody id="dutos-list-${roomId}">
                  <!-- Lista de dutos será gerada dinamicamente -->
                  <tr class="empty-row">
                    <td colspan="7">Nenhum duto adicionado</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="5" style="text-align: right; font-weight: bold;">TOTAL:</td>
                    <td id="dutos-total-${roomId}" style="font-weight: bold;">R$ 0,00</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Botões de Ação -->
          <div class="form-group full-width text-center">
            <button class="btn-load-dutos" onclick="carregarDutos('${roomId}')">
              📋 Carregar Salvos
            </button>
            <button class="btn-clear-dutos" onclick="limparDutos('${roomId}')">
              🗑️ Limpar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
    `;
}

/**
 * Inicializa o sistema de dutos para uma sala
 */
function initDutosSystem(roomId) {
    console.log(`🔧 Inicializando sistema de dutos para sala: ${roomId}`);
    
    // Carregar tipos de dutos da API
    carregarTiposDutos(roomId);
    
    // Carregar valor do cobre
    carregarValorCobre(roomId);
    
    // Carregar dutos salvos
    carregarDutos(roomId);
    
    // Inicializar eventos
    setupDutosEvents(roomId);
}

/**
 * Carrega os tipos de dutos da API
 */
async function carregarTiposDutos(roomId) {
    try {
        const response = await fetch('/api/dutos/types');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById(`duto-tipo-${roomId}`);
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
            
            console.log(`✅ ${data.types.length} tipos de dutos carregados`);
        } else {
            console.error('❌ Erro ao carregar tipos:', data.error);
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

/**
 * Carrega os opcionais disponíveis para o tipo de duto selecionado
 */
async function loadDutoOpcionais(roomId) {
    const tipoSelect = document.getElementById(`duto-tipo-${roomId}`);
    const opcionalSelect = document.getElementById(`duto-opcional-${roomId}`);
    const valorTipoInput = document.getElementById(`duto-valor-tipo-${roomId}`);
    const valorOpcionalInput = document.getElementById(`duto-valor-opcional-${roomId}`);
    const valorTotalInput = document.getElementById(`duto-valor-total-${roomId}`);
    
    const tipo = tipoSelect.value;
    
    if (!tipo) {
        opcionalSelect.disabled = true;
        valorTipoInput.value = 'R$ 0,00';
        valorOpcionalInput.value = 'R$ 0,00';
        valorTotalInput.value = 'R$ 0,00';
        return;
    }
    
    try {
        const response = await fetch(`/api/dutos?type=${encodeURIComponent(tipo)}`);
        const data = await response.json();
        
        if (data.success && data.dutos && data.dutos.length > 0) {
            const duto = data.dutos[0];
            
            // Limpar e preencher opcionais
            opcionalSelect.innerHTML = '<option value="">Selecione um opcional...</option>';
            
            duto.opcionais.forEach(opcional => {
                const option = document.createElement('option');
                option.value = opcional.id;
                option.textContent = opcional.nome;
                option.setAttribute('data-valor', opcional.value);
                option.setAttribute('data-nome', opcional.nome);
                opcionalSelect.appendChild(option);
            });
            
            // Atualizar valor do tipo
            valorTipoInput.value = `R$ ${formatarMoeda(duto.valor)}`;
            
            // Resetar outros valores
            valorOpcionalInput.value = 'R$ 0,00';
            valorTotalInput.value = 'R$ 0,00';
            opcionalSelect.disabled = false;
            
            // Adicionar evento para calcular valor
            opcionalSelect.onchange = function() {
                calcularValorDuto(roomId);
            };
            
            console.log(`✅ ${duto.opcionais.length} opcionais carregados para ${tipo}`);
        } else {
            console.error('❌ Erro ao carregar opcionais:', data.error);
            opcionalSelect.disabled = true;
            valorTipoInput.value = 'R$ 0,00';
            valorOpcionalInput.value = 'R$ 0,00';
            valorTotalInput.value = 'R$ 0,00';
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        opcionalSelect.disabled = true;
        valorTipoInput.value = 'R$ 0,00';
        valorOpcionalInput.value = 'R$ 0,00';
        valorTotalInput.value = 'R$ 0,00';
    }
}

/**
 * Carrega o valor do cobre da API de materiais
 */
async function carregarValorCobre(roomId) {
    try {
        const response = await fetch('/api/materials');
        const data = await response.json();
        
        if (data.success && data.materials) {
            const cobre = data.materials.find(m => m.codigo === 'COBRE');
            if (cobre) {
                window.valorCobrePorKg = cobre.valor;
                
                const kgInfoDiv = document.getElementById(`kg-info-${roomId}`);
                if (kgInfoDiv) {
                    kgInfoDiv.innerHTML = `
                        <strong>Valor do Cobre por KG:</strong> R$ ${formatarMoeda(window.valorCobrePorKg)}
                    `;
                }
                
                console.log(`✅ Valor do cobre carregado: R$ ${formatarMoeda(window.valorCobrePorKg)}/kg`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar valor do cobre:', error);
    }
}

/**
 * Calcula o valor total do duto
 */
async function calcularValorDuto(roomId) {
    const tipoSelect = document.getElementById(`duto-tipo-${roomId}`);
    const opcionalSelect = document.getElementById(`duto-opcional-${roomId}`);
    const kgInput = document.getElementById(`duto-kg-${roomId}`);
    const valorTipoInput = document.getElementById(`duto-valor-tipo-${roomId}`);
    const valorOpcionalInput = document.getElementById(`duto-valor-opcional-${roomId}`);
    const valorTotalInput = document.getElementById(`duto-valor-total-${roomId}`);
    
    const tipo = tipoSelect.value;
    const opcionalId = opcionalSelect.value;
    const kg = parseFloat(kgInput.value) || 0;
    
    if (!tipo || !opcionalId || kg <= 0) {
        valorOpcionalInput.value = 'R$ 0,00';
        valorTotalInput.value = 'R$ 0,00';
        return;
    }
    
    try {
        // Buscar dados do duto
        const dutoResponse = await fetch(`/api/dutos?type=${encodeURIComponent(tipo)}`);
        const dutoData = await dutoResponse.json();
        
        if (!dutoData.success || !dutoData.dutos || dutoData.dutos.length === 0) {
            valorOpcionalInput.value = 'R$ 0,00';
            valorTotalInput.value = 'R$ 0,00';
            return;
        }
        
        const duto = dutoData.dutos[0];
        
        // Encontrar o opcional selecionado
        const opcionalSelecionado = duto.opcionais.find(op => op.id == opcionalId);
        if (!opcionalSelecionado) {
            valorOpcionalInput.value = 'R$ 0,00';
            valorTotalInput.value = 'R$ 0,00';
            return;
        }
        
        // Atualizar valor do opcional
        valorOpcionalInput.value = `R$ ${formatarMoeda(opcionalSelecionado.value)}`;
        
        // Calcular valores
        const valorTipo = duto.valor;
        const valorOpcional = opcionalSelecionado.value;
        const valorCobre = window.valorCobrePorKg || 0;
        const valorKg = kg * valorCobre;
        
        // Fórmula: TOTAL = valorTipo + valorOpcional + (KG * valorCobrePorKg)
        const valorTotal = valorTipo + valorOpcional + valorKg;
        
        valorTotalInput.value = `R$ ${formatarMoeda(valorTotal)}`;
        
    } catch (error) {
        console.error('❌ Erro ao calcular valor:', error);
        valorOpcionalInput.value = 'R$ 0,00';
        valorTotalInput.value = 'R$ 0,00';
    }
}

/**
 * Adiciona um duto à lista
 */
async function adicionarDuto(roomId) {
    const tipoSelect = document.getElementById(`duto-tipo-${roomId}`);
    const opcionalSelect = document.getElementById(`duto-opcional-${roomId}`);
    const kgInput = document.getElementById(`duto-kg-${roomId}`);
    const valorTipoInput = document.getElementById(`duto-valor-tipo-${roomId}`);
    const valorOpcionalInput = document.getElementById(`duto-valor-opcional-${roomId}`);
    const valorTotalInput = document.getElementById(`duto-valor-total-${roomId}`);
    
    // Validações
    if (!tipoSelect.value) {
        alert('Por favor, selecione um tipo de duto.');
        return;
    }
    
    if (!opcionalSelect.value) {
        alert('Por favor, selecione um opcional.');
        return;
    }
    
    const kg = parseFloat(kgInput.value) || 0;
    if (kg <= 0) {
        alert('A quantidade de KG deve ser maior que zero.');
        return;
    }
    
    // Extrair valores
    const valorTipoTexto = valorTipoInput.value.replace('R$ ', '').replace('.', '').replace(',', '.');
    const valorOpcionalTexto = valorOpcionalInput.value.replace('R$ ', '').replace('.', '').replace(',', '.');
    const valorTotalTexto = valorTotalInput.value.replace('R$ ', '').replace('.', '').replace(',', '.');
    
    const valorTipo = parseFloat(valorTipoTexto) || 0;
    const valorOpcional = parseFloat(valorOpcionalTexto) || 0;
    const valorTotal = parseFloat(valorTotalTexto) || 0;
    
    if (valorTotal <= 0) {
        alert('Valor inválido. Verifique os campos KG e opcionais.');
        return;
    }
    
    // Buscar informações adicionais
    try {
        const response = await fetch(`/api/dutos?type=${encodeURIComponent(tipoSelect.value)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Erro ao buscar dados do duto');
        }
        
        const dutoInfo = data.dutos[0];
        const opcionalSelecionado = dutoInfo.opcionais.find(op => op.id == opcionalSelect.value);
        
        if (!opcionalSelecionado) {
            throw new Error('Opcional não encontrado');
        }
        
        // Criar objeto do duto
        const duto = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            tipo: tipoSelect.value,
            tipo_descricao: tipoSelect.options[tipoSelect.selectedIndex].textContent,
            opcional_id: opcionalSelect.value,
            opcional_nome: opcionalSelecionado.nome,
            opcional_descricao: opcionalSelecionado.descricao,
            kg: kg,
            valor_tipo: valorTipo,
            valor_opcional: valorOpcional,
            valor_cobre_por_kg: window.valorCobrePorKg || 0,
            valor_kg_cobre: kg * (window.valorCobrePorKg || 0),
            valor_total: valorTotal,
            calculo: `R$ ${formatarMoeda(valorTipo)} + R$ ${formatarMoeda(valorOpcional)} + (${kg}kg × R$ ${formatarMoeda(window.valorCobrePorKg || 0)})`
        };
        
        // Adicionar à lista
        adicionarDutoNaTabela(roomId, duto);
        
        // Limpar campos
        kgInput.value = '1';
        tipoSelect.selectedIndex = 0;
        opcionalSelect.selectedIndex = 0;
        opcionalSelect.disabled = true;
        valorTipoInput.value = 'R$ 0,00';
        valorOpcionalInput.value = 'R$ 0,00';
        valorTotalInput.value = 'R$ 0,00';
        
        console.log(`✅ Duto adicionado: ${duto.tipo} | ${duto.opcional_nome} | ${duto.kg}kg | Total: R$ ${formatarMoeda(duto.valor_total)}`);
        
    } catch (error) {
        console.error('❌ Erro ao adicionar duto:', error);
        alert('Erro ao processar o duto. Tente novamente.');
    }
}

/**
 * Adiciona duto na tabela HTML
 */
function adicionarDutoNaTabela(roomId, duto) {
    const tbody = document.getElementById(`dutos-list-${roomId}`);
    const emptyRow = tbody.querySelector('.empty-row');
    
    // Remover linha vazia se existir
    if (emptyRow) {
        emptyRow.remove();
    }
    
    // Criar nova linha
    const row = document.createElement('tr');
    row.id = `duto-${duto.id}`;
    row.className = 'duto-row';
    row.setAttribute('data-duto', JSON.stringify(duto));
    
    row.innerHTML = `
        <td>${duto.tipo_descricao}</td>
        <td>${duto.opcional_nome}</td>
        <td>${duto.kg.toFixed(2)} kg</td>
        <td>R$ ${formatarMoeda(duto.valor_tipo)}</td>
        <td>R$ ${formatarMoeda(duto.valor_opcional)}</td>
        <td>R$ ${formatarMoeda(duto.valor_total)}</td>
        <td>
            <button class="btn-remove-duto" onclick="removerDuto('${roomId}', '${duto.id}')">
                🗑️
            </button>
            <button class="btn-edit-duto" onclick="editarDuto('${roomId}', '${duto.id}')">
                ✏️
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Atualizar total
    atualizarTotalDutos(roomId);
    
    // Salvar no localStorage
    salvarDutosLocalStorage(roomId);
}

/**
 * Remove um duto da lista
 */
function removerDuto(roomId, dutoId) {
    const row = document.getElementById(`duto-${dutoId}`);
    if (row) {
        row.remove();
        
        // Verificar se a tabela está vazia
        const tbody = document.getElementById(`dutos-list-${roomId}`);
        if (tbody.children.length === 0) {
            // Adicionar linha vazia
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-row';
            emptyRow.innerHTML = '<td colspan="7">Nenhum duto adicionado</td>';
            tbody.appendChild(emptyRow);
        }
        
        // Atualizar total
        atualizarTotalDutos(roomId);
        
        // Salvar no localStorage
        salvarDutosLocalStorage(roomId);
        
        console.log(`🗑️ Duto removido: ${dutoId}`);
    }
}

/**
 * Edita um duto existente
 */
function editarDuto(roomId, dutoId) {
    const row = document.getElementById(`duto-${dutoId}`);
    if (!row) return;
    
    const dutoData = JSON.parse(row.getAttribute('data-duto'));
    
    // Preencher campos de entrada
    const tipoSelect = document.getElementById(`duto-tipo-${roomId}`);
    const opcionalSelect = document.getElementById(`duto-opcional-${roomId}`);
    const kgInput = document.getElementById(`duto-kg-${roomId}`);
    const valorTipoInput = document.getElementById(`duto-valor-tipo-${roomId}`);
    const valorOpcionalInput = document.getElementById(`duto-valor-opcional-${roomId}`);
    const valorTotalInput = document.getElementById(`duto-valor-total-${roomId}`);
    
    // Selecionar tipo
    for (let i = 0; i < tipoSelect.options.length; i++) {
        if (tipoSelect.options[i].value === dutoData.tipo) {
            tipoSelect.selectedIndex = i;
            break;
        }
    }
    
    // Carregar opcionais e selecionar
    loadDutoOpcionais(roomId).then(() => {
        setTimeout(() => {
            for (let i = 0; i < opcionalSelect.options.length; i++) {
                if (opcionalSelect.options[i].value == dutoData.opcional_id) {
                    opcionalSelect.selectedIndex = i;
                    break;
                }
            }
            
            // Preencher KG
            kgInput.value = dutoData.kg;
            
            // Atualizar valores
            setTimeout(() => {
                calcularValorDuto(roomId).then(() => {
                    // Remover duto da lista
                    removerDuto(roomId, dutoId);
                    
                    console.log(`✏️ Duto em edição: ${dutoId}`);
                });
            }, 300);
        }, 500);
    });
}

/**
 * Atualiza o total de dutos
 */
function atualizarTotalDutos(roomId) {
    const tbody = document.getElementById(`dutos-list-${roomId}`);
    const rows = tbody.querySelectorAll('.duto-row');
    
    let total = 0;
    
    rows.forEach(row => {
        const dutoData = JSON.parse(row.getAttribute('data-duto'));
        total += dutoData.valor_total;
    });
    
    const totalElement = document.getElementById(`dutos-total-${roomId}`);
    if (totalElement) {
        totalElement.textContent = `R$ ${formatarMoeda(total)}`;
    }
}

/**
 * Salva dutos no localStorage
 */
function salvarDutosLocalStorage(roomId) {
    const tbody = document.getElementById(`dutos-list-${roomId}`);
    const rows = tbody.querySelectorAll('.duto-row');
    
    const dutos = [];
    rows.forEach(row => {
        const dutoData = JSON.parse(row.getAttribute('data-duto'));
        dutos.push(dutoData);
    });
    
    const key = `dutos_${roomId}`;
    localStorage.setItem(key, JSON.stringify(dutos));
}

/**
 * Carrega dutos do localStorage
 */
function carregarDutos(roomId) {
    const key = `dutos_${roomId}`;
    const dutosSalvos = localStorage.getItem(key);
    
    if (!dutosSalvos) {
        console.log(`📋 Nenhum duto salvo para sala ${roomId}`);
        return;
    }
    
    try {
        const dutos = JSON.parse(dutosSalvos);
        
        // Limpar lista atual
        const tbody = document.getElementById(`dutos-list-${roomId}`);
        tbody.innerHTML = '';
        
        // Adicionar dutos salvos
        dutos.forEach(duto => {
            adicionarDutoNaTabela(roomId, duto);
        });
        
        console.log(`📋 ${dutos.length} duto(s) carregado(s) para sala ${roomId}`);
    } catch (error) {
        console.error('❌ Erro ao carregar dutos:', error);
    }
}

/**
 * Limpa todos os dutos
 */
function limparDutos(roomId) {
    if (confirm('Tem certeza que deseja limpar todos os dutos?')) {
        const tbody = document.getElementById(`dutos-list-${roomId}`);
        tbody.innerHTML = '';
        
        // Adicionar linha vazia
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = '<td colspan="7">Nenhum duto adicionado</td>';
        tbody.appendChild(emptyRow);
        
        // Atualizar total
        atualizarTotalDutos(roomId);
        
        // Limpar localStorage
        const key = `dutos_${roomId}`;
        localStorage.removeItem(key);
        
        console.log(`🗑️ Todos os dutos removidos da sala ${roomId}`);
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
 * Configura eventos para o sistema de dutos
 */
function setupDutosEvents(roomId) {
    const kgInput = document.getElementById(`duto-kg-${roomId}`);
    
    if (kgInput) {
        kgInput.addEventListener('change', function() {
            if (this.value < 0.1) this.value = 0.1;
            if (this.value > 1000) this.value = 1000;
            calcularValorDuto(roomId);
        });
        
        kgInput.addEventListener('input', function() {
            calcularValorDuto(roomId);
        });
    }
}

// ✅ Exportar TODAS as funções
export {
    buildDutosSection,
    fillDutosData,
    initDutosSystem,
    carregarTiposDutos,
    loadDutoOpcionais,
    carregarValorCobre,
    calcularValorDuto,
    adicionarDuto,
    adicionarDutoNaTabela,
    removerDuto,
    editarDuto,
    atualizarTotalDutos,
    salvarDutosLocalStorage,
    carregarDutos,
    limparDutos,
    formatarMoeda,
    setupDutosEvents,
};

// ✅ Tornar funções disponíveis globalmente
if (typeof window !== 'undefined') {
    window.fillDutosData = fillDutosData;
    window.initDutosSystem = initDutosSystem;
    window.adicionarDutoNaTabela = adicionarDutoNaTabela;
    window.atualizarTotalDutos = atualizarTotalDutos;
    window.formatarMoeda = formatarMoeda;
    window.buildDutosSection = buildDutosSection;
    window.carregarTiposDutos = carregarTiposDutos;
    window.loadDutoOpcionais = loadDutoOpcionais;
    window.carregarValorCobre = carregarValorCobre;
    window.calcularValorDuto = calcularValorDuto;
    window.adicionarDuto = adicionarDuto;
    window.carregarDutos = carregarDutos;
    window.limparDutos = limparDutos;
    window.removerDuto = removerDuto;
    window.editarDuto = editarDuto;
    
    // ✅ Helper para debug
    window.debugDutosSystem = function(roomId) {
        console.log('🔍 Debug Sistema de Dutos:');
        console.log('- fillDutosData:', typeof window.fillDutosData);
        console.log('- initDutosSystem:', typeof window.initDutosSystem);
        console.log('- Sala:', roomId);
        console.log('- Tabela existe?', !!document.getElementById(`dutos-list-${roomId}`));
        console.log('- Valor do cobre:', window.valorCobrePorKg);
    };
}

/* ==== FIM: data/modules/dutos.js ==== */