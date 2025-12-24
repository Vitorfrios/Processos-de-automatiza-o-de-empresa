function buildTubosSection(obraId, projectId, roomName, finalRoomId) {
    // Validação mínima de segurança
    if (!finalRoomId || finalRoomId === 'undefined' || finalRoomId === 'null') {
        console.error(`ERRO FALBACK (buildTubosSection) [Room ID inválido: ${finalRoomId}]`);
        return '';
    }

    const roomId = finalRoomId;

    return `
    <div class="section-block">
      <div class="section-header">
        <button class="minimizer" onclick="toggleSection('${roomId}tubos')">+</button>
        <h4 class="section-title">Tubulação de Cobre</h4>
      </div>

      <div class="section-content collapsed" id="section-content-${roomId}tubos">
        <div class="tubos-container">
          <!-- Mensagem inicial (vai sumir quando adicionar primeiro conjunto) -->
          <div class="tubos-empty-message" id="tubos-empty-${roomId}">
            <p>Adicione um sistema de tubulação para começar</p>
          </div>
          <!-- Área para conjuntos será adicionada dinamicamente -->
        </div>
        
        <div class="tubos-actions">
          <button class="btn btn-add-secondary" onclick="addTubulacaoConjunto('${roomId}')">+ Adicionar Conjunto</button>
          <button class="btn btn-clear" onclick="limparTubulacao('${roomId}')">🗑️ Limpar Tudo</button>
        </div>
      </div>
    </div>
    `;
}

// ==============================================
// TABELAS BASE (APENAS LOOKUP - NÃO CALCULAR)
// ==============================================

// Bitolas disponíveis (polegadas -> mm)
const bitolasDisponiveis = [
    { polegadas: '1/4', mm: 6.35 },
    { polegadas: '3/8', mm: 9.52 },
    { polegadas: '1/2', mm: 12.7 },
    { polegadas: '5/8', mm: 15.87 },
    { polegadas: '3/4', mm: 19.05 },
    { polegadas: '7/8', mm: 22.22 },
    { polegadas: '1', mm: 25.4 },
    { polegadas: '1.1/4', mm: 31.75 },
    { polegadas: '1.3/8', mm: 34.92 },
    { polegadas: '1.1/2', mm: 38.1 },
    { polegadas: '1.5/8', mm: 41.27 },
    { polegadas: '1.7/8', mm: 47.62 }
];

// Tabela kg/m - Espessura 0,80 mm
const kgm_080mm = [
    0.123, 0.193, 0.263, 0.333, 0.403, 0.473,
    0.544, 0.684, 0.754, 0.824, 0.894, 1.034
];

// Tabela kg/m - Espessura 1,59 mm
const kgm_159mm = [
    0.212, 0.353, 0.494, 0.635, 0.776, 0.917,
    1.059, 1.341, 1.482, 1.623, 1.764, 2.046
];

// Função para obter kg/m (APENAS LOOKUP)
function getKgPorMetro(polegadas, espessura) {
    const index = bitolasDisponiveis.findIndex(b => b.polegadas === polegadas);
    if (index === -1) return null;
    
    if (espessura === '0,80') {
        return kgm_080mm[index];
    } else if (espessura === '1,59') {
        return kgm_159mm[index];
    }
    
    return null;
}

// ==============================================
// FUNÇÕES DE CÁLCULO (EXATAMENTE COMO NA PLANILHA)
// ==============================================

function calcularLSmetros(comprimentoInterligacao, numCircuitos, numCurvas, comprimentoEquivalenteCurva) {
    const parte1 = (comprimentoInterligacao || 0) * (numCircuitos || 0);
    const parte2 = (numCurvas || 0) * (comprimentoEquivalenteCurva || 0);
    return parte1 + parte2;
}

function calcularLLmetros(LSmetros) {
    return LSmetros;
}

function calcularLSkg(LSmetros, polegadasLS, espessuraLS) {
    if (!polegadasLS || !espessuraLS || !LSmetros) return 0;
    
    const kgPorMetro = getKgPorMetro(polegadasLS, espessuraLS);
    if (!kgPorMetro) return 0;
    
    return LSmetros * kgPorMetro;
}

function calcularLLkg(LLmetros, polegadasLL, espessuraLL) {
    if (!polegadasLL || !espessuraLL || !LLmetros) return 0;
    
    const kgPorMetro = getKgPorMetro(polegadasLL, espessuraLL);
    if (!kgPorMetro) return 0;
    
    return LLmetros * kgPorMetro;
}

function calcularCabos(comprimentoInterligacao) {
    return (comprimentoInterligacao || 0) + 6;
}

function calcularLuvas(LSmetros) {
    if (!LSmetros) return 0;
    return (LSmetros / 5) * 2;
}

function calcularReducoes(numCircuitos) {
    return (numCircuitos || 0) * 4;
}

// ==============================================
// FUNÇÕES DO SISTEMA
// ==============================================

// Função para preencher dados de tubulação
function fillTubulacaoData(roomElement, tubulacaoData) {
    if (!roomElement || !tubulacaoData) {
        console.error('❌ Elemento da sala ou dados de tubulação inválidos');
        return;
    }

    const roomId = roomElement.dataset.roomId;
    console.log(`🔄 Preenchendo tubulação para sala ${roomId}`, tubulacaoData);

    // Limpar container primeiro
    const emptyMessage = document.getElementById(`tubos-empty-${roomId}`);
    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }

    // Remover conjuntos existentes
    const container = roomElement.querySelector(`#section-content-${roomId}tubos .tubos-container`);
    if (container) {
        const conjuntosExistentes = container.querySelectorAll('.tubos-conjunto');
        conjuntosExistentes.forEach(conjunto => conjunto.remove());
    }

    // Verificar se há dados para preencher
    if (tubulacaoData.conjuntos && Array.isArray(tubulacaoData.conjuntos) && tubulacaoData.conjuntos.length > 0) {
        // Criar cada conjunto a partir dos dados
        tubulacaoData.conjuntos.forEach((conjuntoData, index) => {
            setTimeout(() => {
                addTubulacaoConjunto(roomId, conjuntoData);
            }, index * 200);
        });

        console.log(`✅ ${tubulacaoData.conjuntos.length} conjunto(s) de tubulação preenchido(s)`);
    } else {
        // Mostrar mensagem de vazio
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
        }
        console.log(`ℹ️ Nenhum dado de tubulação para preencher na sala ${roomId}`);
    }
}

// Controle de primeira interação por coluna e por conjunto
const primeiraInteracaoPorColuna = {};

function verificarPrimeiraInteracao(conjuntoId, coluna) {
    const chave = `${conjuntoId}_${coluna}`;
    
    if (!primeiraInteracaoPorColuna[chave]) {
        primeiraInteracaoPorColuna[chave] = true;
        return true;
    }
    
    return false;
}

function sincronizarPrimeiraInteracao(conjuntoId, coluna, valor, linhaAtualId) {
    const tbody = document.getElementById(`tubos-list-${conjuntoId}`);
    if (!tbody) return;
    
    const linhas = tbody.querySelectorAll('.linha-tubulacao');
    let linhaDestino = null;
    
    for (let linha of linhas) {
        const linhaId = linha.id;
        const linhaTipo = linha.getAttribute('data-tipo');
        const linhaAtualTipo = document.getElementById(linhaAtualId)?.getAttribute('data-tipo');
        
        if (linhaId !== linhaAtualId && linhaTipo !== linhaAtualTipo) {
            linhaDestino = linha;
            break;
        }
    }
    
    if (linhaDestino) {
        const inputClassMap = {
            'comprimento': '.comprimento-input',
            'circuitos': '.circuitos-input',
            'curvas': '.curvas-input',
            'cecurva': '.ce-curva-input'
        };
        
        const inputClass = inputClassMap[coluna];
        if (inputClass) {
            const inputDestino = linhaDestino.querySelector(inputClass);
            if (inputDestino) {
                inputDestino.value = valor;
                const event = new Event('change', { bubbles: true });
                inputDestino.dispatchEvent(event);
            }
        }
    }
}

function handleColunaChange(linhaId, coluna, valor) {
    const row = document.getElementById(`linha-${linhaId}`);
    if (!row || valor === '') return;
    
    const conjuntoId = row.getAttribute('data-conjunto');
    const chave = `${conjuntoId}_${coluna}`;
    
    if (verificarPrimeiraInteracao(conjuntoId, coluna)) {
        sincronizarPrimeiraInteracao(conjuntoId, coluna, valor, `linha-${linhaId}`);
    }
    
    calcularLinha(linhaId);
}

// Adicionar nova linha L.S. - com valores padrão
function addLinhaLS(roomId, conjuntoNum = '1') {
    const conjuntoId = `${roomId}-${conjuntoNum}`;
    const tbody = document.getElementById(`tubos-list-${conjuntoId}`);

    if (!tbody) {
        console.error(`❌ Tabela não encontrada para conjunto ${conjuntoId}`);
        return;
    }

    const linha = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        tipo: 'L.S.',
        polegadas: '1.1/4',
        espessura: '1,59',
        comprimentoInterligacao: '',
        numCircuitos: '',
        numCurvas: '',
        comprimentoEquivalenteCurva: '',
        LSmetros: 0,
        LSkg: 0,
        cabos: 0,
        luvas: 0,
        reducoes: 0
    };

    adicionarLinhaNaTabela(conjuntoId, linha);
}

// Adicionar nova linha L.L. - com valores padrão
function addLinhaLL(roomId, conjuntoNum = '1') {
    const conjuntoId = `${roomId}-${conjuntoNum}`;
    const tbody = document.getElementById(`tubos-list-${conjuntoId}`);

    if (!tbody) {
        console.error(`❌ Tabela não encontrada para conjunto ${conjuntoId}`);
        return;
    }

    const linha = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        tipo: 'L.L.',
        polegadas: '7/8',
        espessura: '0,80',
        comprimentoInterligacao: '',
        numCircuitos: '',
        numCurvas: '',
        comprimentoEquivalenteCurva: '',
        LLmetros: 0,
        LLkg: 0
    };

    adicionarLinhaNaTabela(conjuntoId, linha);
}

// Adicionar linha na tabela HTML
function adicionarLinhaNaTabela(conjuntoId, linha) {
    const tbody = document.getElementById(`tubos-list-${conjuntoId}`);

    if (!tbody) {
        console.error(`❌ TBody não encontrado: tubos-list-${conjuntoId}`);
        return;
    }

    const row = document.createElement('tr');
    row.id = `linha-${linha.id}`;
    row.className = 'linha-tubulacao';
    row.setAttribute('data-linha', JSON.stringify(linha));
    row.setAttribute('data-conjunto', conjuntoId);
    row.setAttribute('data-tipo', linha.tipo);

    // Gerar opções de bitola
    const opcoesBitola = bitolasDisponiveis.map(b => 
        `<option value="${b.polegadas}" ${linha.polegadas === b.polegadas ? 'selected' : ''}>${b.polegadas}"</option>`
    ).join('');

    // Gerar opções de espessura
    const opcoesEspessura = `
        <option value="">-</option>
        <option value="0,80" ${linha.espessura === '0,80' ? 'selected' : ''}>0,80 mm</option>
        <option value="1,59" ${linha.espessura === '1,59' ? 'selected' : ''}>1,59 mm</option>
    `;

    // Determinar valores padrão baseados no tipo
    if (linha.tipo === 'L.S.') {
        linha.polegadas = linha.polegadas || '1.1/4';
        linha.espessura = linha.espessura || '1,59';
    } else {
        linha.polegadas = linha.polegadas || '7/8';
        linha.espessura = linha.espessura || '0,80';
    }

    row.innerHTML = `
        <td>${linha.tipo}</td>
        <td>
            <select class="polegadas-select" onchange="calcularLinha('${linha.id}')">
                <option value="">-</option>
                ${opcoesBitola}
            </select>
        </td>
        <td>
            <select class="espessura-select" onchange="calcularLinha('${linha.id}')">
                ${opcoesEspessura}
            </select>
        </td>
        <td>
            <input type="number" class="comprimento-input" min="0" step="0.1" value="${linha.comprimentoInterligacao || ''}" 
                   onchange="handleColunaChange('${linha.id}', 'comprimento', this.value)" 
                   placeholder="0.0" style="width: 80px;">
        </td>
        <td>
            <input type="number" class="circuitos-input" min="0" value="${linha.numCircuitos || ''}" 
                   onchange="handleColunaChange('${linha.id}', 'circuitos', this.value)" 
                   placeholder="0" style="width: 60px;">
        </td>
        <td>
            <input type="number" class="curvas-input" min="0" value="${linha.numCurvas || ''}" 
                   onchange="handleColunaChange('${linha.id}', 'curvas', this.value)" 
                   placeholder="0" style="width: 60px;">
        </td>
        <td>
            <input type="number" class="ce-curva-input" min="0" step="0.1" value="${linha.comprimentoEquivalenteCurva || ''}" 
                   onchange="handleColunaChange('${linha.id}', 'cecurva', this.value)" 
                   placeholder="0.0" style="width: 70px;">
        </td>
        <td>
            <button class="btn-remove" onclick="removerLinha('${linha.id}')" title="Remover">🗑️</button>
        </td>
    `;

    tbody.appendChild(row);
    
    // Se a linha já tiver valores, calcular
    if (linha.comprimentoInterligacao || linha.numCircuitos || linha.numCurvas || linha.comprimentoEquivalenteCurva) {
        setTimeout(() => {
            calcularLinha(linha.id);
        }, 100);
    }
}

// Adicionar novo conjunto de tubulação
function addTubulacaoConjunto(roomId, conjuntoData = null) {
    // Contar quantos conjuntos já existem
    const conjuntos = document.querySelectorAll(`[data-conjunto-id^="${roomId}-"]`);
    const novoNum = conjuntos.length + 1;
    const novoConjuntoId = `${roomId}-${novoNum}`;

    // Remover mensagem "vazio" se for o primeiro conjunto
    const emptyMessage = document.getElementById(`tubos-empty-${roomId}`);
    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }

    // Criar novo conjunto
    const tubosContainer = document.querySelector(`#section-content-${roomId}tubos .tubos-container`);

    const novoConjunto = document.createElement('div');
    novoConjunto.className = 'tubos-conjunto';
    novoConjunto.id = `conjunto-${novoConjuntoId}`;
    novoConjunto.setAttribute('data-conjunto-id', novoConjuntoId);
    novoConjunto.setAttribute('data-conjunto-num', novoNum);

    novoConjunto.innerHTML = `
        <div class="conjunto-header">
            <h5>Conjunto ${novoNum}</h5>
            <div class="conjunto-info">
                <div class="selector-conj">
                    <label for="tubulacao-quantidade-${novoConjuntoId}">Qtd:</label>
                    <input type="number" id="tubulacao-quantidade-${novoConjuntoId}" class="quantidade-input" value="${conjuntoData?.quantidade || 1}" min="1" max="100" onchange="atualizarTotaisConjunto('${novoConjuntoId}')">
                </div>
                <div class="conjunto-buttons">
                    <button type="button" class="btn btn-small btn-ls" onclick="addLinhaLS('${roomId}', '${novoNum}')">+ L.S.</button>
                    <button type="button" class="btn btn-small btn-ll" onclick="addLinhaLL('${roomId}', '${novoNum}')">+ L.L.</button>
                </div>
            </div>
        </div>
        
        <div class="tabela-container">
            <table class="tubos-table" id="tubos-table-${novoConjuntoId}">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Bitola</th>
                        <th>Espessura</th>
                        <th>Comp. Interlig. (m)</th>
                        <th>N° Circ.</th>
                        <th>N° Curvas</th>
                        <th>C.E. Curva (m)</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tubos-list-${novoConjuntoId}">
                    <!-- Linhas serão adicionadas dinamicamente -->
                </tbody>
            </table>
        </div>
        
        <div class="tubos-totais">
            <div class="totais-resumo">
                <div class="total-item">
                    <span class="total-label">Total L.S. (m):</span>
                    <span class="total-value" id="total-ls-metros-${novoConjuntoId}">0.00</span>
                </div>
                <div class="total-item">
                    <span class="total-label">Total L.S. (kg):</span>
                    <span class="total-value" id="total-ls-kg-${novoConjuntoId}">0.00</span>
                </div>
                <div class="total-item">
                    <span class="total-label">Total L.L. (m):</span>
                    <span class="total-value" id="total-ll-metros-${novoConjuntoId}">0.00</span>
                </div>
                <div class="total-item">
                    <span class="total-label">Total L.L. (kg):</span>
                    <span class="total-value" id="total-ll-kg-${novoConjuntoId}">0.00</span>
                </div>
                <div class="total-item">
                    <span class="total-label">Total Cabos:</span>
                    <span class="total-value" id="total-cabos-${novoConjuntoId}">0</span>
                </div>
                <div class="total-item">
                    <span class="total-label">Total Luvas:</span>
                    <span class="total-value" id="total-luvas-${novoConjuntoId}">0.00</span>
                </div>
                <div class="total-item">
                    <span class="total-label">Total Reduções:</span>
                    <span class="total-value" id="total-reducoes-${novoConjuntoId}">0</span>
                </div>
                <div class="total-item">
                    <span class="total-label">Total Geral (kg):</span>
                    <span class="total-value" id="total-geral-kg-${novoConjuntoId}">0.00</span>
                </div>
            </div>
        </div>
    `;

    tubosContainer.appendChild(novoConjunto);

    // Se houver dados para preencher
    if (conjuntoData && conjuntoData.linhas) {
        setTimeout(() => {
            // Resetar controle de primeira interação para este conjunto
            ['comprimento', 'circuitos', 'curvas', 'cecurva'].forEach(coluna => {
                const chave = `${novoConjuntoId}_${coluna}`;
                delete primeiraInteracaoPorColuna[chave];
            });
            
            // Adicionar cada linha
            conjuntoData.linhas.forEach((linha, linhaIndex) => {
                setTimeout(() => {
                    // Converter do formato curto para o formato completo
                    const linhaCompleta = {
                        id: linha.id || Date.now() + linhaIndex + Math.random().toString(36).substr(2, 9),
                        tipo: linha.tipo || 'L.S.',
                        polegadas: linha.pol || '',
                        espessura: linha.expe || '',
                        comprimentoInterligacao: linha.compr || '',
                        numCircuitos: linha.numC || '',
                        numCurvas: linha.numCu || '',
                        comprimentoEquivalenteCurva: linha.Cee || '',
                        LSmetros: linha.Lsm || 0,
                        LSkg: linha.LSkg || 0
                    };
                    
                    if (linha.tipo === 'L.L.') {
                        linhaCompleta.LLmetros = linha.Lsm || 0;
                        linhaCompleta.LLkg = linha.LSkg || 0;
                    }
                    
                    adicionarLinhaNaTabela(novoConjuntoId, linhaCompleta);
                    
                    // Se for a última linha, atualizar totais
                    if (linhaIndex === conjuntoData.linhas.length - 1) {
                        setTimeout(() => {
                            atualizarTotaisConjunto(novoConjuntoId);
                        }, 100);
                    }
                }, linhaIndex * 50);
            });
        }, 100);
    } else {
        // Adicionar automaticamente 2 linhas (L.S. e L.L.) ao criar um novo conjunto vazio
        setTimeout(() => {
            addLinhaLS(roomId, novoNum);
            setTimeout(() => {
                addLinhaLL(roomId, novoNum);
            }, 100);
        }, 200);
    }

    return novoConjuntoId;
}

// Calcular linha completa
function calcularLinha(linhaId) {
    const row = document.getElementById(`linha-${linhaId}`);
    if (!row) return;

    const linhaData = JSON.parse(row.getAttribute('data-linha'));
    const conjuntoId = row.getAttribute('data-conjunto');
    const tipo = linhaData.tipo;

    // Obter valores dos inputs
    const polegadas = row.querySelector('.polegadas-select')?.value || '';
    const espessura = row.querySelector('.espessura-select')?.value || '';
    const comprimentoInterligacao = row.querySelector('.comprimento-input')?.value || '';
    const numCircuitos = row.querySelector('.circuitos-input')?.value || '';
    const numCurvas = row.querySelector('.curvas-input')?.value || '';
    const ceCurva = row.querySelector('.ce-curva-input')?.value || '';

    // Atualizar dados
    linhaData.polegadas = polegadas;
    linhaData.espessura = espessura;
    linhaData.comprimentoInterligacao = comprimentoInterligacao;
    linhaData.numCircuitos = numCircuitos;
    linhaData.numCurvas = numCurvas;
    linhaData.comprimentoEquivalenteCurva = ceCurva;

    // Converter para números
    const compIntNum = comprimentoInterligacao ? parseFloat(comprimentoInterligacao) : 0;
    const numCircNum = numCircuitos ? parseInt(numCircuitos) : 0;
    const numCurvNum = numCurvas ? parseInt(numCurvas) : 0;
    const ceCurvaNum = ceCurva ? parseFloat(ceCurva) : 0;

    if (tipo === 'L.S.') {
        const LSmetros = calcularLSmetros(compIntNum, numCircNum, numCurvNum, ceCurvaNum);
        const LSkg = calcularLSkg(LSmetros, polegadas, espessura);
        const cabos = calcularCabos(compIntNum);
        const luvas = calcularLuvas(LSmetros);
        const reducoes = calcularReducoes(numCircNum);

        linhaData.LSmetros = LSmetros;
        linhaData.LSkg = LSkg;
        linhaData.cabos = cabos;
        linhaData.luvas = luvas;
        linhaData.reducoes = reducoes;
    } else {
        const LSmetros = calcularLSmetros(compIntNum, numCircNum, numCurvNum, ceCurvaNum);
        const LLmetros = calcularLLmetros(LSmetros);
        const LLkg = calcularLLkg(LLmetros, polegadas, espessura);

        linhaData.LLmetros = LLmetros;
        linhaData.LLkg = LLkg;
    }

    // Atualizar atributo data
    row.setAttribute('data-linha', JSON.stringify(linhaData));

    // Atualizar totais do conjunto
    atualizarTotaisConjunto(conjuntoId);
}

// Atualizar totais do conjunto
function atualizarTotaisConjunto(conjuntoId) {
    const conjuntoElement = document.getElementById(`conjunto-${conjuntoId}`);
    if (!conjuntoElement) return;

    const linhas = conjuntoElement.querySelectorAll('.linha-tubulacao');
    
    let totalLSmetros = 0;
    let totalLSkg = 0;
    let totalLLmetros = 0;
    let totalLLkg = 0;
    let totalCabos = 0;
    let totalLuvas = 0;
    let totalReducoes = 0;

    linhas.forEach(row => {
        const linhaData = JSON.parse(row.getAttribute('data-linha'));
        
        if (linhaData.tipo === 'L.S.') {
            totalLSmetros += linhaData.LSmetros || 0;
            totalLSkg += linhaData.LSkg || 0;
            totalCabos += linhaData.cabos || 0;
            totalLuvas += linhaData.luvas || 0;
            totalReducoes += linhaData.reducoes || 0;
        } else if (linhaData.tipo === 'L.L.') {
            totalLLmetros += linhaData.LLmetros || 0;
            totalLLkg += linhaData.LLkg || 0;
        }
    });

    // Obter quantidade do conjunto
    const quantidadeInput = document.getElementById(`tubulacao-quantidade-${conjuntoId}`);
    const quantidade = quantidadeInput ? parseInt(quantidadeInput.value) || 1 : 1;

    // Calcular totais multiplicados pela quantidade
    const totalGeralKg = (totalLSkg + totalLLkg) * quantidade;
    const totalCabosMulti = totalCabos * quantidade;
    const totalLuvasMulti = totalLuvas * quantidade;
    const totalReducoesMulti = totalReducoes * quantidade;

    // Atualizar totais no HTML
    document.getElementById(`total-ls-metros-${conjuntoId}`).textContent = (totalLSmetros * quantidade).toFixed(2);
    document.getElementById(`total-ls-kg-${conjuntoId}`).textContent = (totalLSkg * quantidade).toFixed(2);
    document.getElementById(`total-ll-metros-${conjuntoId}`).textContent = (totalLLmetros * quantidade).toFixed(2);
    document.getElementById(`total-ll-kg-${conjuntoId}`).textContent = (totalLLkg * quantidade).toFixed(2);
    document.getElementById(`total-cabos-${conjuntoId}`).textContent = Math.round(totalCabosMulti);
    document.getElementById(`total-luvas-${conjuntoId}`).textContent = totalLuvasMulti.toFixed(2);
    document.getElementById(`total-reducoes-${conjuntoId}`).textContent = Math.round(totalReducoesMulti);
    document.getElementById(`total-geral-kg-${conjuntoId}`).textContent = totalGeralKg.toFixed(2);
}

// Remover linha
function removerLinha(linhaId) {
    const row = document.getElementById(`linha-${linhaId}`);
    if (!row) return;

    const conjuntoId = row.getAttribute('data-conjunto');

    if (confirm('Tem certeza que deseja remover esta linha?')) {
        row.remove();
        atualizarTotaisConjunto(conjuntoId);
        console.log(`🗑️ Linha removida: ${linhaId}`);
    }
}

// Limpar toda a tubulação
function limparTubulacao(roomId) {
    if (confirm('Tem certeza que deseja limpar toda a tubulação desta sala?')) {
        const container = document.querySelector(`#section-content-${roomId}tubos .tubos-container`);
        if (container) {
            const conjuntos = container.querySelectorAll('.tubos-conjunto');
            conjuntos.forEach(conjunto => conjunto.remove());

            const emptyMessage = document.getElementById(`tubos-empty-${roomId}`);
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
        }

        console.log(`🗑️ Todas as tubulações removidas da sala ${roomId}`);
    }
}

// Inicializar sistema de tubulação
function initTubulacaoSystem(roomId) {
    console.log(`🔧 Inicializando sistema de tubulação para sala: ${roomId}`);
}

// Função para extrair dados no formato específico
function extractTubulacaoData(roomElement) {
    const resultado = {
        conjuntos: []
    };
    
    if (!roomElement?.dataset.roomId) {
        console.error('❌ Elemento da sala inválido para extração de tubulação');
        return resultado;
    }
    
    const roomId = roomElement.dataset.roomId;
    
    // Buscar todos os conjuntos de tubulação na sala
    const conjuntos = roomElement.querySelectorAll(`[data-conjunto-id^="${roomId}-"]`);
    
    if (conjuntos.length === 0) {
        return resultado;
    }
    
    conjuntos.forEach((conjuntoElement, index) => {
        const conjuntoId = conjuntoElement.getAttribute('data-conjunto-id');
        const conjuntoNum = conjuntoElement.getAttribute('data-conjunto-num') || (index + 1).toString();
        
        // Obter quantidade do conjunto
        const quantidadeInput = document.getElementById(`tubulacao-quantidade-${conjuntoId}`);
        const quantidade = quantidadeInput ? parseInt(quantidadeInput.value) || 1 : 1;
        
        // Extrair totais
        const extrairNumero = (elementId) => {
            const element = document.getElementById(`${elementId}-${conjuntoId}`);
            if (!element) return 0;
            const text = element.textContent || '0';
            return parseFloat(text.replace(',', '.')) || 0;
        };
        
        const conjuntoData = {
            id: conjuntoId,
            numero: parseInt(conjuntoNum),
            quantidade: quantidade,
            cabos: Math.round(extrairNumero('total-cabos')),
            luvas: extrairNumero('total-luvas'),
            reducoes: Math.round(extrairNumero('total-reducoes')),
            totalGeralKG: extrairNumero('total-geral-kg'),
            linhas: []
        };
        
        // Buscar linhas
        const tbody = document.getElementById(`tubos-list-${conjuntoId}`);
        if (tbody) {
            const linhas = tbody.querySelectorAll('.linha-tubulacao');
            
            linhas.forEach(row => {
                try {
                    const linhaData = JSON.parse(row.getAttribute('data-linha'));
                    
                    const linhaFormatada = {
                        id: linhaData.id,
                        tipo: linhaData.tipo,
                        pol: linhaData.polegadas || '',
                        expe: linhaData.espessura || '',
                        compr: parseFloat(linhaData.comprimentoInterligacao || 0),
                        numC: parseInt(linhaData.numCircuitos || 0),
                        numCu: parseInt(linhaData.numCurvas || 0),
                        Cee: parseFloat(linhaData.comprimentoEquivalenteCurva || 0),
                        Lsm: parseFloat(linhaData.LSmetros || linhaData.LLmetros || 0),
                        LSkg: parseFloat(linhaData.LSkg || linhaData.LLkg || 0)
                    };
                    
                    conjuntoData.linhas.push(linhaFormatada);
                } catch (error) {
                    console.error('❌ Erro ao extrair linha:', error);
                }
            });
        }
        
        resultado.conjuntos.push(conjuntoData);
    });
    
    return resultado;
}

// Exportar funções globalmente
if (typeof window !== 'undefined') {
    window.fillTubulacaoData = fillTubulacaoData;
    window.addLinhaLS = addLinhaLS;
    window.addLinhaLL = addLinhaLL;
    window.addTubulacaoConjunto = addTubulacaoConjunto;
    window.calcularLinha = calcularLinha;
    window.atualizarTotaisConjunto = atualizarTotaisConjunto;
    window.removerLinha = removerLinha;
    window.limparTubulacao = limparTubulacao;
    window.initTubulacaoSystem = initTubulacaoSystem;
    window.buildTubosSection = buildTubosSection;
    window.extractTubulacaoData = extractTubulacaoData;
    window.handleColunaChange = handleColunaChange;
}

// Exportar todas as funções
export {
    buildTubosSection,
    fillTubulacaoData,
    addLinhaLS,
    addLinhaLL,
    addTubulacaoConjunto,
    calcularLinha,
    calcularLSmetros,
    calcularLLmetros,
    calcularLSkg,
    calcularLLkg,
    calcularCabos,
    calcularLuvas,
    calcularReducoes,
    getKgPorMetro,
    atualizarTotaisConjunto,
    removerLinha,
    limparTubulacao,
    initTubulacaoSystem,
    extractTubulacaoData,
    bitolasDisponiveis,
    kgm_080mm,
    kgm_159mm,
    handleColunaChange
};