/**
 * dutos.js - Sistema de seleção de Dutos para Climatização
 * Interface para selecionar e adicionar dutos ao projeto
 */

/**
 * Função para preenchimento de dados
 */
function fillDutosData(roomElement, dutosData) {
    if (!roomElement || !dutosData) {
        return;
    }

    const roomId = roomElement.dataset.roomId;
    const dutosSection = roomElement.querySelector(`#section-content-${roomId}dutos`);
    
    if (!dutosSection) {
        return;
    }

    if (!Array.isArray(dutosData) || dutosData.length === 0) {
        return;
    }

    const tbodyId = `dutos-list-${roomId}`;
    let tbody = document.getElementById(tbodyId);
    
    if (!tbody) {
        const tableContainer = dutosSection.querySelector('.dutos-table-container');
        if (tableContainer) {
            const tableHTML = `
                <table class="dutos-table" id="dutos-table-${roomId}">
                    <thead>
                        <tr>
                            <th width="25%">Tipo de Duto</th>
                            <th width="25%">Opcional</th>
                            <th width="14%">KG</th>
                            <th width="14%">Qtd</th>
                            <th width="14%">Valor Tipo</th>
                            <th width="14%">Valor Opcional</th>
                            <th width="10%">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="${tbodyId}"></tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" style="text-align: right; font-weight: bold;">TOTAL:</td>
                            <td id="dutos-total-${roomId}" style="font-weight: bold;">R$ 0,00</td>
                        </tr>
                    </tfoot>
                </table>
            `;
            
            tableContainer.innerHTML = tableHTML;
            tbody = document.getElementById(tbodyId);
        }
    }

    if (tbody) {
        tbody.innerHTML = '';
        
        dutosData.forEach(duto => {
            adicionarDutoNaTabela(roomId, duto);
        });
        
        atualizarTotalDutos(roomId);
    }
}

/**
 * Constrói a seção de Dutos para Climatização
 */
function buildDutosSection(obraId, projectId, roomName, finalRoomId) {
    if (!finalRoomId) return '';

    const roomId = finalRoomId;

    const html = `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}dutos')">+</button>
        <h4 class="section-title">Dutos para Climatização</h4>
      </div>

      <div class="section-content collapsed" id="section-content-${roomId}dutos">
        <div class="form-grid">

          <!-- LINHA SUPERIOR: ADICIONAR DUTO + VALOR DO COBRE -->
          <div class="form-group full-width duto-header-line">

            <label class="acess-label duto-header-label">
              Adicionar duto:
            </label>

            <div class="cobre-inline">
              <span class="cobre-label">Valor do Cobre (por KG):</span>

              <input type="number"
                     id="valor-cobre-${roomId}"
                     class="cobre-input"
                     value="0"
                     min="0"
                     step="0.01"
                     onchange="atualizarValorCobre('${roomId}')">

              <button class="btn-cobre-default"
                      onclick="carregarValorCobrePadrao('${roomId}')"
                      title="Carregar valor padrão da API">
                🔄 Restaurar
              </button>
            </div>

          </div>

          <!-- SELECTOR DE DUTO -->
          <div class="form-group full-width">
            <div class="duto-selector">
              <div class="selector-grid">

                <div class="selector-item">
                  <label for="duto-tipo-${roomId}">Tipo:</label>
                  <select id="duto-tipo-${roomId}"
                          class="duto-select"
                          onchange="loadDutoOpcionais('${roomId}')">
                    <option value="">Selecione um tipo...</option>
                  </select>
                </div>

                <div class="selector-item">
                  <label for="duto-opcional-${roomId}">Opcional:</label>
                  <select id="duto-opcional-${roomId}"
                          class="duto-select"
                          disabled
                          onchange="calcularValorDuto('${roomId}')">
                    <option value="">Selecione um opcional...</option>
                  </select>
                </div>

                <div class="selector-item">
                  <label for="duto-kg-${roomId}">KG:</label>
                  <input type="number"
                         id="duto-kg-${roomId}"
                         class="duto-input"
                         value="1"
                         min="0.1"
                         max="1000"
                         step="0.1"
                         onchange="calcularValorDuto('${roomId}')">
                </div>

                <div class="selector-item">
                  <label for="duto-quantidade-${roomId}">Qtd:</label>
                  <input type="number"
                         id="duto-quantidade-${roomId}"
                         class="duto-input"
                         value="1"
                         min="1"
                         max="1000"
                         onchange="calcularValorDuto('${roomId}')">
                </div>

                <div class="selector-item">
                  <label for="duto-valor-tipo-${roomId}">Valor Tipo:</label>
                  <input type="text"
                         id="duto-valor-tipo-${roomId}"
                         class="duto-input"
                         readonly>
                </div>

                <div class="selector-item">
                  <label for="duto-valor-opcional-${roomId}">Valor Opcional:</label>
                  <input type="text"
                         id="duto-valor-opcional-${roomId}"
                         class="duto-input"
                         readonly>
                </div>

                <div class="selector-item">
                  <button class="btn-add-duto"
                          onclick="adicionarDuto('${roomId}')">
                    <span class="btn-icon">+</span> Adicionar
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- TABELA -->
          <div class="form-group full-width">
            <label class="acess-label">Dutos Selecionados:</label>

            <div class="dutos-table-container">
              <table class="dutos-table" id="dutos-table-${roomId}">
                <thead>
                  <tr>
                    <th width="25%">Tipo de Duto</th>
                    <th width="25%">Opcional</th>
                    <th width="14%">KG</th>
                    <th width="14%">Qtd</th>
                    <th width="14%">Valor Tipo</th>
                    <th width="14%">Valor Opcional</th>
                    <th width="10%">Ações</th>
                  </tr>
                </thead>

                <tbody id="dutos-list-${roomId}">
                  <tr class="empty-row">
                    <td colspan="7">Nenhum duto adicionado</td>
                  </tr>
                </tbody>

                <tfoot>
                  <tr>
                    <td colspan="6" style="text-align: right; font-weight: bold;">TOTAL:</td>
                    <td id="dutos-total-${roomId}" style="font-weight: bold;">R$ 0,00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- BOTÕES INFERIORES -->
          <div class="form-group full-width text-center">
            <button class="btn-load-dutos"
                    onclick="carregarDutos('${roomId}')">
              📋 Carregar Salvos
            </button>

            <button class="btn-clear-dutos"
                    onclick="limparDutos('${roomId}')">
              🗑️ Limpar Tudo
            </button>
          </div>

        </div>
      </div>
    </div>
    `;

    // Inicialização pós-render
    setTimeout(() => {
        initDutosSystem(roomId);
    }, 100);

    return html;
}

/**
 * Inicializa o sistema de dutos para uma sala
 */
async function initDutosSystem(roomId) {
    console.log(`🚀 Inicializando dutos para sala: ${roomId}`);
    
    // Verificar se o select existe
    const select = document.getElementById(`duto-tipo-${roomId}`);
    if (!select) {
        console.error(`❌ Select não encontrado: duto-tipo-${roomId}`);
        return;
    }
    
    // Carregar tipos
    await carregarTiposDutos(roomId);
    
    // Carregar valor do cobre da API
    await carregarValorCobre(roomId);
    
    // Configurar evento no input do cobre
    const cobreInput = document.getElementById(`valor-cobre-${roomId}`);
    if (cobreInput) {
        cobreInput.addEventListener('input', () => atualizarValorCobre(roomId));
        cobreInput.addEventListener('change', () => atualizarValorCobre(roomId));
    }
    
    // Carregar dutos salvos
    carregarDutos(roomId);
    
    // Configurar eventos
    setupDutosEvents(roomId);
    
    console.log(`✅ Dutos inicializados para sala ${roomId}`);
}

/**
 * Carrega os tipos de dutos da API
 */
async function carregarTiposDutos(roomId) {
    try {
        const select = document.getElementById(`duto-tipo-${roomId}`);
        if (!select) return;
        
        const response = await fetch('/api/dutos/types');
        if (!response.ok) return;
        
        const data = await response.json();
        if (!data.success || !data.types) return;
        
        // Limpar opções (exceto a primeira)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Adicionar opções
        data.types.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.value || tipo.type || '';
            option.textContent = tipo.label || tipo.value || '';
            select.appendChild(option);
        });
        
        console.log(`✅ ${data.types.length} tipos carregados para sala ${roomId}`);
        
    } catch (error) {
        console.error('Erro ao carregar tipos:', error);
    }
}

/**
 * Carrega os opcionais para o tipo selecionado
 */
async function loadDutoOpcionais(roomId) {
    const tipoSelect = document.getElementById(`duto-tipo-${roomId}`);
    const opcionalSelect = document.getElementById(`duto-opcional-${roomId}`);
    const valorTipoInput = document.getElementById(`duto-valor-tipo-${roomId}`);
    
    const tipo = tipoSelect.value;
    if (!tipo) return;
    
    try {
        const response = await fetch(`/api/dutos/type/${encodeURIComponent(tipo)}`);
        if (!response.ok) return;
        
        const data = await response.json();
        if (!data.success || !data.duto) return;
        
        const duto = data.duto;
        
        // Limpar opcionais
        opcionalSelect.innerHTML = '<option value="">Selecione um opcional...</option>';
        
        // Adicionar opcionais
        if (duto.opcionais && Array.isArray(duto.opcionais)) {
            duto.opcionais.forEach(opcional => {
                const option = document.createElement('option');
                option.value = opcional.id;
                option.textContent = opcional.nome || `Opcional ${opcional.id}`;
                option.setAttribute('data-valor', opcional.value || 0);
                opcionalSelect.appendChild(option);
            });
            
            opcionalSelect.disabled = false;
        }
        
        // Atualizar valor do tipo
        valorTipoInput.value = `R$ ${formatarMoeda(duto.valor || 0)}`;
        
    } catch (error) {
        opcionalSelect.disabled = true;
    }
}

/**
 * Carrega valor do cobre da API e atualiza o input
 */
async function carregarValorCobre(roomId) {
    try {
        console.log('📡 Buscando valor do cobre da API...');
        const response = await fetch('/api/materials');
        const data = await response.json();
        
        console.log('📦 Dados recebidos da API:', data);
        
        let valorCobre = 0;
        
        // Verificar diferentes estruturas de dados
        if (data.materials) {
            if (Array.isArray(data.materials)) {
                // Estrutura 1: materials é um array
                const cobre = data.materials.find(m => m.codigo === 'COBRE');
                if (cobre && cobre.valor !== undefined) {
                    valorCobre = cobre.valor;
                    console.log(`✅ Cobre encontrado em array: R$ ${valorCobre}`);
                }
            } else if (typeof data.materials === 'object' && data.materials.COBRE) {
                // Estrutura 2: materials é um objeto com COBRE
                valorCobre = data.materials.COBRE.value || 0;
                console.log(`✅ Cobre encontrado em objeto: R$ ${valorCobre}`);
            }
        } else if (data.COBRE) {
            // Estrutura 3: direto no objeto
            valorCobre = data.COBRE.value || 0;
            console.log(`✅ Cobre encontrado direto: R$ ${valorCobre}`);
        }
        
        if (valorCobre > 0) {
            window.valorCobrePorKg = valorCobre;
            
            // Atualizar o input com o valor da API
            const cobreInput = document.getElementById(`valor-cobre-${roomId}`);
            if (cobreInput) {
                cobreInput.value = valorCobre.toFixed(2);
                console.log(`✅ Input atualizado com valor: R$ ${valorCobre.toFixed(2)}`);
            } else {
                console.error(`❌ Input não encontrado: valor-cobre-${roomId}`);
            }
        } else {
            console.warn('⚠️ Valor do cobre não encontrado ou é zero');
            window.valorCobrePorKg = 0;
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar cobre:', error);
        window.valorCobrePorKg = 0;
    }
}

/**
 * Carrega o valor padrão do cobre da API
 */
async function carregarValorCobrePadrao(roomId) {
    try {
        console.log('🔄 Restaurando valor padrão do cobre...');
        const response = await fetch('/api/materials');
        const data = await response.json();
        
        let valorCobre = 0;
        
        // Verificar diferentes estruturas
        if (data.materials) {
            if (Array.isArray(data.materials)) {
                const cobre = data.materials.find(m => m.codigo === 'COBRE');
                if (cobre && cobre.valor !== undefined) {
                    valorCobre = cobre.valor;
                }
            } else if (typeof data.materials === 'object' && data.materials.COBRE) {
                valorCobre = data.materials.COBRE.value || 0;
            }
        } else if (data.COBRE) {
            valorCobre = data.COBRE.value || 0;
        }
        
        if (valorCobre > 0) {
            window.valorCobrePorKg = valorCobre;
            
            const cobreInput = document.getElementById(`valor-cobre-${roomId}`);
            if (cobreInput) {
                cobreInput.value = valorCobre.toFixed(2);
                
                // Mostrar confirmação visual
                cobreInput.style.borderColor = '#48BB78';
                cobreInput.style.boxShadow = '0 0 0 3px rgba(72, 187, 120, 0.1)';
                
                setTimeout(() => {
                    cobreInput.style.borderColor = '';
                    cobreInput.style.boxShadow = '';
                }, 1500);
                
                console.log(`✅ Valor padrão restaurado: R$ ${valorCobre.toFixed(2)}/kg`);
            }
            
            // Recalcular todos os dutos existentes
            recalcDutosComNovoCobre(roomId);
            
            alert(`✅ Valor do cobre restaurado para R$ ${valorCobre.toFixed(2)}/kg`);
        } else {
            alert('⚠️ Valor do cobre não encontrado na API');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar cobre padrão:', error);
        alert('❌ Erro ao carregar valor padrão do cobre');
    }
}

/**
 * Atualiza o valor do cobre manualmente
 */
function atualizarValorCobre(roomId) {
    const cobreInput = document.getElementById(`valor-cobre-${roomId}`);
    if (!cobreInput) return;
    
    const novoValor = parseFloat(cobreInput.value);
    
    if (isNaN(novoValor) || novoValor < 0) {
        alert('❌ Por favor, insira um valor válido para o cobre');
        cobreInput.value = window.valorCobrePorKg ? window.valorCobrePorKg.toFixed(2) : '0.00';
        return;
    }
    
    window.valorCobrePorKg = novoValor;
    console.log(`🔄 Valor do cobre atualizado para: R$ ${novoValor.toFixed(2)}/kg`);
    
    // Recalcular todos os dutos existentes
    recalcDutosComNovoCobre(roomId);
}

/**
 * Recalcula todos os dutos com o novo valor do cobre
 */
function recalcDutosComNovoCobre(roomId) {
    const tbody = document.getElementById(`dutos-list-${roomId}`);
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('.duto-row');
    
    rows.forEach(row => {
        try {
            const duto = JSON.parse(row.getAttribute('data-duto'));
            
            // Recalcular valor total com novo valor do cobre
            const valorCobre = window.valorCobrePorKg || 0;
            const valorKg = duto.kg * valorCobre;
            const valorUnitario = duto.valor_tipo + duto.valor_opcional + valorKg;
            const valorTotal = valorUnitario * duto.quantidade;
            
            // Atualizar objeto duto
            duto.valor_total = valorTotal;
            row.setAttribute('data-duto', JSON.stringify(duto));
            
            // Atualizar células na tabela (removida a coluna de total individual)
            // Não precisamos atualizar células pois a coluna de total foi removida
            
        } catch (error) {
            console.error('Erro ao recalcular duto:', error);
        }
    });
    
    // Atualizar total geral
    atualizarTotalDutos(roomId);
    
    // Salvar alterações
    salvarDutosLocalStorage(roomId);
}

function calcularValorDuto(roomId) {
    const tipoSelect = document.getElementById(`duto-tipo-${roomId}`);
    const opcionalSelect = document.getElementById(`duto-opcional-${roomId}`);
    const kgInput = document.getElementById(`duto-kg-${roomId}`);
    const quantidadeInput = document.getElementById(`duto-quantidade-${roomId}`);
    const valorTipoInput = document.getElementById(`duto-valor-tipo-${roomId}`);
    const valorOpcionalInput = document.getElementById(`duto-valor-opcional-${roomId}`);
    
    const kg = parseFloat(kgInput.value) || 0;
    const quantidade = parseInt(quantidadeInput.value) || 1;
    
    // Obter valor do tipo
    const valorTipoTexto = valorTipoInput.value.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
    const valorTipo = parseFloat(valorTipoTexto) || 0;
    
    // Obter valor do opcional selecionado
    let valorOpcional = 0;
    if (opcionalSelect.value) {
        const opcionalOption = opcionalSelect.options[opcionalSelect.selectedIndex];
        valorOpcional = parseFloat(opcionalOption.getAttribute('data-valor')) || 0;
    }
    
    // Obter valor do cobre do input
    const cobreInput = document.getElementById(`valor-cobre-${roomId}`);
    const valorCobre = cobreInput ? parseFloat(cobreInput.value) || 0 : 0;
    
    // Calcular valor do cobre para este duto
    const valorKg = kg * valorCobre;
    
    // Calcular total: Valor Tipo + Valor Opcional + (KG * Valor do Cobre)
    const valorUnitario = valorTipo + valorOpcional + valorKg;
    const valorTotal = valorUnitario * quantidade;
    
    // Atualizar campos
    valorOpcionalInput.value = `R$ ${formatarMoeda(valorOpcional)}`;
    
    console.log(`📊 Cálculo: ${valorTipo.toFixed(2)} + ${valorOpcional.toFixed(2)} + (${kg} × ${valorCobre.toFixed(2)}) = ${valorUnitario.toFixed(2)} × ${quantidade} = ${valorTotal.toFixed(2)}`);
}

/**
 * Adiciona duto à lista
 */
function adicionarDuto(roomId) {
    const tipoSelect = document.getElementById(`duto-tipo-${roomId}`);
    const opcionalSelect = document.getElementById(`duto-opcional-${roomId}`);
    const kgInput = document.getElementById(`duto-kg-${roomId}`);
    const quantidadeInput = document.getElementById(`duto-quantidade-${roomId}`);
    const valorTipoInput = document.getElementById(`duto-valor-tipo-${roomId}`);
    const cobreInput = document.getElementById(`valor-cobre-${roomId}`);
    
    if (!tipoSelect.value || !opcionalSelect.value) {
        alert('Selecione tipo e opcional');
        return;
    }
    
    const kg = parseFloat(kgInput.value) || 0;
    const quantidade = parseInt(quantidadeInput.value) || 1;
    const valorCobre = cobreInput ? parseFloat(cobreInput.value) || 0 : 0;
    
    if (kg <= 0 || quantidade <= 0) {
        alert('KG e Quantidade devem ser maiores que zero');
        return;
    }
    
    // Extrair valor do tipo
    const valorTipoTexto = valorTipoInput.value.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
    const valorTipo = parseFloat(valorTipoTexto) || 0;
    
    // Obter valor do opcional
    const opcionalOption = opcionalSelect.options[opcionalSelect.selectedIndex];
    const valorOpcional = parseFloat(opcionalOption.getAttribute('data-valor')) || 0;
    
    // Calcular valor total
    const valorKg = kg * valorCobre;
    const valorUnitario = valorTipo + valorOpcional + valorKg;
    const valorTotal = valorUnitario * quantidade;
    
    if (valorTotal <= 0) {
        alert('Valor inválido');
        return;
    }
    
    // Obter nome do opcional
    const opcionalNome = opcionalOption.textContent;
    
    // Criar objeto do duto
    const duto = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        tipo: tipoSelect.value,
        tipo_descricao: tipoSelect.options[tipoSelect.selectedIndex].textContent,
        opcional_id: opcionalSelect.value,
        opcional_nome: opcionalNome,
        kg: kg,
        quantidade: quantidade,
        valor_tipo: valorTipo,
        valor_opcional: valorOpcional,
        valor_cobre_por_kg: valorCobre,
        valor_total: valorTotal
    };
    
    // Adicionar à tabela
    adicionarDutoNaTabela(roomId, duto);
    
    // Limpar campos
    kgInput.value = '1';
    quantidadeInput.value = '1';
    tipoSelect.selectedIndex = 0;
    opcionalSelect.selectedIndex = 0;
    opcionalSelect.disabled = true;
    valorTipoInput.value = 'R$ 0,00';
    document.getElementById(`duto-valor-opcional-${roomId}`).value = 'R$ 0,00';
}

/**
 * Adiciona duto na tabela
 */
function adicionarDutoNaTabela(roomId, duto) {
    const tbody = document.getElementById(`dutos-list-${roomId}`);
    if (!tbody) return;
    
    const emptyRow = tbody.querySelector('.empty-row');
    if (emptyRow) emptyRow.remove();
    
    const row = document.createElement('tr');
    row.id = `duto-${duto.id}`;
    row.className = 'duto-row';
    row.setAttribute('data-duto', JSON.stringify(duto));
    
    row.innerHTML = `
        <td>${duto.tipo_descricao}</td>
        <td>${duto.opcional_nome}</td>
        <td>${duto.kg.toFixed(2)} kg</td>
        <td>${duto.quantidade}</td>
        <td>R$ ${formatarMoeda(duto.valor_tipo)}</td>
        <td>R$ ${formatarMoeda(duto.valor_opcional)}</td>
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
    atualizarTotalDutos(roomId);
    salvarDutosLocalStorage(roomId);
}

/**
 * Edita um duto existente
 */
function editarDuto(roomId, dutoId) {
    const row = document.getElementById(`duto-${dutoId}`);
    if (!row) return;
    
    try {
        const duto = JSON.parse(row.getAttribute('data-duto'));
        
        // Preencher os campos do formulário com os valores do duto
        const tipoSelect = document.getElementById(`duto-tipo-${roomId}`);
        const opcionalSelect = document.getElementById(`duto-opcional-${roomId}`);
        const kgInput = document.getElementById(`duto-kg-${roomId}`);
        const quantidadeInput = document.getElementById(`duto-quantidade-${roomId}`);
        
        // Encontrar e selecionar o tipo
        for (let i = 0; i < tipoSelect.options.length; i++) {
            if (tipoSelect.options[i].value === duto.tipo) {
                tipoSelect.selectedIndex = i;
                break;
            }
        }
        
        // Carregar opcionais para o tipo selecionado
        loadDutoOpcionais(roomId).then(() => {
            // Esperar um pouco para os opcionais carregarem
            setTimeout(() => {
                // Encontrar e selecionar o opcional
                for (let i = 0; i < opcionalSelect.options.length; i++) {
                    if (opcionalSelect.options[i].value === duto.opcional_id) {
                        opcionalSelect.selectedIndex = i;
                        break;
                    }
                }
                
                // Preencher outros campos
                kgInput.value = duto.kg;
                quantidadeInput.value = duto.quantidade;
                
                // Calcular valores
                calcularValorDuto(roomId);
                
                // Remover o duto da lista
                removerDuto(roomId, dutoId);
                
                alert('✏️ Duto carregado para edição. Ajuste os valores e clique em Adicionar para salvar.');
            }, 300);
        });
        
    } catch (error) {
        console.error('Erro ao editar duto:', error);
        alert('Erro ao carregar duto para edição');
    }
}

/**
 * Remove duto
 */
function removerDuto(roomId, dutoId) {
    const row = document.getElementById(`duto-${dutoId}`);
    if (!row) return;
    
    row.remove();
    
    const tbody = document.getElementById(`dutos-list-${roomId}`);
    if (tbody.children.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = '<td colspan="7">Nenhum duto adicionado</td>';
        tbody.appendChild(emptyRow);
    }
    
    atualizarTotalDutos(roomId);
    salvarDutosLocalStorage(roomId);
}

/**
 * Atualiza total
 */
function atualizarTotalDutos(roomId) {
    const tbody = document.getElementById(`dutos-list-${roomId}`);
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('.duto-row');
    let total = 0;
    
    rows.forEach(row => {
        try {
            const duto = JSON.parse(row.getAttribute('data-duto'));
            total += duto.valor_total;
        } catch (error) {
            console.error('Erro ao calcular total:', error);
        }
    });
    
    const totalElement = document.getElementById(`dutos-total-${roomId}`);
    if (totalElement) {
        totalElement.textContent = `R$ ${formatarMoeda(total)}`;
    }
}

/**
 * Salva no localStorage
 */
function salvarDutosLocalStorage(roomId) {
    const tbody = document.getElementById(`dutos-list-${roomId}`);
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('.duto-row');
    const dutos = [];
    
    rows.forEach(row => {
        try {
            dutos.push(JSON.parse(row.getAttribute('data-duto')));
        } catch (error) {
            console.error('Erro ao salvar:', error);
        }
    });
    
    localStorage.setItem(`dutos_${roomId}`, JSON.stringify(dutos));
}

/**
 * Carrega do localStorage
 */
function carregarDutos(roomId) {
    try {
        const dados = localStorage.getItem(`dutos_${roomId}`);
        if (!dados) return;
        
        const dutos = JSON.parse(dados);
        const tbody = document.getElementById(`dutos-list-${roomId}`);
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        dutos.forEach(duto => {
            adicionarDutoNaTabela(roomId, duto);
        });
        
    } catch (error) {
        console.error('Erro ao carregar:', error);
    }
}

/**
 * Limpa tudo
 */
function limparDutos(roomId) {
    if (!confirm('Limpar todos os dutos?')) return;
    
    const tbody = document.getElementById(`dutos-list-${roomId}`);
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'empty-row';
    emptyRow.innerHTML = '<td colspan="7">Nenhum duto adicionado</td>';
    tbody.appendChild(emptyRow);
    
    atualizarTotalDutos(roomId);
    localStorage.removeItem(`dutos_${roomId}`);
}

/**
 * Formata moeda
 */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Configura eventos
 */
function setupDutosEvents(roomId) {
    const kgInput = document.getElementById(`duto-kg-${roomId}`);
    const quantidadeInput = document.getElementById(`duto-quantidade-${roomId}`);
    
    if (kgInput) {
        kgInput.addEventListener('input', () => calcularValorDuto(roomId));
        kgInput.addEventListener('change', () => calcularValorDuto(roomId));
    }
    
    if (quantidadeInput) {
        quantidadeInput.addEventListener('input', () => calcularValorDuto(roomId));
        quantidadeInput.addEventListener('change', () => calcularValorDuto(roomId));
    }
}

// Exportar
export {
    buildDutosSection,
    fillDutosData,
    initDutosSystem,
    carregarTiposDutos,
    loadDutoOpcionais,
    carregarValorCobre,
    carregarValorCobrePadrao,
    atualizarValorCobre,
    calcularValorDuto,
    adicionarDuto,
    adicionarDutoNaTabela,
    removerDuto,
    editarDuto,
    atualizarTotalDutos,
    carregarDutos,
    limparDutos,
    formatarMoeda
};

// Global
if (typeof window !== 'undefined') {
    window.buildDutosSection = buildDutosSection;
    window.fillDutosData = fillDutosData;
    window.initDutosSystem = initDutosSystem;
    window.carregarTiposDutos = carregarTiposDutos;
    window.loadDutoOpcionais = loadDutoOpcionais;
    window.carregarValorCobre = carregarValorCobre;
    window.carregarValorCobrePadrao = carregarValorCobrePadrao;
    window.atualizarValorCobre = atualizarValorCobre;
    window.calcularValorDuto = calcularValorDuto;
    window.adicionarDuto = adicionarDuto;
    window.editarDuto = editarDuto;
    window.carregarDutos = carregarDutos;
    window.limparDutos = limparDutos;
    window.removerDuto = removerDuto;
    window.formatarMoeda = formatarMoeda;
}