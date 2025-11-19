// empresa-form-manager.js
import { formatarData } from './ui-helpers-obra-adapter.js'
import { inicializarInputEmpresaHibrido } from './empresa-autocomplete.js'

/**
 * 🆕 ATUALIZA A INTERFACE COM OS DADOS DA EMPRESA
 */
async function atualizarInterfaceComEmpresa(obraElement, obraData) {
    try {
        // Encontrar o container de cadastro de empresas
        const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');
        if (!empresaContainer) {
            console.log(`❌ [EMPRESA] Container de empresa não encontrado na obra "${obraData.nome}"`);
            return;
        }
        
        // 🆕 ATUALIZAR HEADER DA OBRA COM SPAN (não botão)
        if (window.empresaCadastro && typeof window.empresaCadastro.atualizarHeaderObra === 'function') {
            window.empresaCadastro.atualizarHeaderObra(obraElement, obraData);
        }
        
        console.log(`✅ [EMPRESA] Interface atualizada com SPAN no header`);
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao atualizar interface:`, error);
    }
}

/**
 * 🆕 ATUALIZA CAMPOS DO FORMULÁRIO DE EMPRESA EXISTENTE - COM DATA FORMATADA
 */
function atualizarCamposEmpresaForm(obraData, formElement) {
    const camposMapping = {
        'empresaSigla': 'empresa-input',
        'numeroClienteFinal': 'numero-cliente-final',
        'clienteFinal': 'cliente-final',
        'codigoCliente': 'codigo-cliente',
        'dataCadastro': 'data-cadastro',
        'orcamentistaResponsavel': 'orcamentista-responsavel'
    };
    
    Object.entries(camposMapping).forEach(([dataField, inputId]) => {
        const input = formElement.querySelector(`#${inputId}`);
        if (input && obraData[dataField]) {
            // 🆕 FORMATAR DATA SE FOR O CAMPO dataCadastro
            if (dataField === 'dataCadastro') {
                input.value = formatarData(obraData[dataField]);
            } else {
                input.value = obraData[dataField];
            }
            
            // Configurar dados adicionais para empresa
            if (dataField === 'empresaSigla' && obraData.empresaNome) {
                input.dataset.siglaSelecionada = obraData.empresaSigla;
                input.dataset.nomeSelecionado = obraData.empresaNome;
            }
        }
    });
    
    // Atualizar preview do ID da obra
    const idObraValue = formElement.querySelector('#obra-id-value');
    if (idObraContainer && idObraValue && obraData.idGerado) {
        idObraValue.textContent = obraData.idGerado;
        idObraContainer.style.display = 'block';
    }
}

/**
 * 🆕 CRIA FORMULÁRIO DE EMPRESA COM DADOS EXISTENTES - COM DATA FORMATADA E DATEPICKER DINÂMICO
 */
function criarVisualizacaoEmpresa(obraData, container) {
    // Ocultar botão se existir
    const botao = container.querySelector('.btn-empresa-cadastro');
    if (botao) {
        botao.style.display = 'none';
    }
    
    // 🆕 FORMATAR DATA
    const dataFormatada = formatarData(obraData.dataCadastro);
    
    // Criar formulário
    const formularioHTML = `
    <div class="empresa-formulario-ativo">
        <h4>Dados da Empresa</h4>

        <div class="empresa-form-grid-horizontal">
            <div class="form-group-horizontal">
                <label>Empresa</label>
                <input type="text" class="empresa-input-readonly" 
                    value="${obraData.empresaSigla || ''} - ${obraData.empresaNome || ''}" readonly>
            </div>

            <div class="form-group-horizontal">
                <label>Nº Cliente</label>
                <input type="text" class="numero-cliente-final-readonly" 
                    value="${obraData.numeroClienteFinal || ''}" readonly>
            </div>

            <div class="form-group-horizontal">
                <label>Cliente Final</label>
                <input type="text" class="cliente-final-input" 
                    value="${obraData.clienteFinal || ''}" 
                    onchange="atualizarDadosEmpresa(this, 'clienteFinal', '${obraData.id}')">
            </div>

            <div class="form-group-horizontal">
                <label>Código</label>
                <input type="text" class="codigo-cliente-input" 
                    value="${obraData.codigoCliente || ''}" 
                    onchange="atualizarDadosEmpresa(this, 'codigoCliente', '${obraData.id}')">
            </div>

            <!-- 🆕 CAMPO DE DATA COM DATEPICKER DINÂMICO -->
            <div class="form-group-horizontal">
                <label>Data</label>
                <div class="date-input-container">
                    <input type="text" 
                           class="data-cadastro-input" 
                           id="data-cadastro-edit-${obraData.id}"
                           value="${dataFormatada}" 
                           placeholder="DD/MM/AAAA"
                           maxlength="10"
                           onchange="atualizarDadosEmpresa(this, 'dataCadastro', '${obraData.id}')">
                    <span class="calendar-icon" onclick="alternarDatePicker('${obraData.id}', 'edit')">📅</span>
                </div>
            </div>

            <div class="form-group-horizontal">
                <label>Orçamentista</label>
                <input type="text" class="orcamentista-responsavel-input" 
                    value="${obraData.orcamentistaResponsavel || ''}" 
                    onchange="atualizarDadosEmpresa(this, 'orcamentistaResponsavel', '${obraData.id}')">
            </div>
        </div>

        <div class="empresa-form-actions">
            <button type="button" class="btn-cancel" 
                    onclick="window.ocultarFormularioEmpresa(this, '${obraData.id}')">
                Ocultar
            </button>
        </div>
    </div>
    `;
    
    container.insertAdjacentHTML('beforeend', formularioHTML);
    
    // 🆕 CONFIGURAR AUTO-FORMATAÇÃO PARA O CAMPO DE DATA
    setTimeout(() => {
        const dataCampo = container.querySelector(`#data-cadastro-edit-${obraData.id}`);
        if (dataCampo) {
            configurarCampoDataEspecifico(dataCampo);
        }
    }, 100);
    
    console.log(`✅ [EMPRESA] Formulário criado para obra ${obraData.id} com data: ${dataFormatada}`);
}

/**
 * 🆕 CRIA FORMULÁRIO VAZIO DE EMPRESA COM DATEPICKER DINÂMICO
 */
function criarFormularioVazioEmpresa(obraId, container) {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const formularioHTML = `
    <div class="empresa-formulario-ativo">
        <h4>Cadastro de Empresa</h4>

        <div class="empresa-form-grid-horizontal">
            <!-- Empresa 🟢 EDITÁVEL -->
            <div class="form-group-horizontal">
                <label>Empresa *</label>
                <div class="empresa-input-container">
                    <input type="text" 
                           class="empresa-input-cadastro" 
                           id="empresa-input-${obraId}"
                           placeholder="Digite sigla ou nome ou selecione..."
                           autocomplete="off">
                    <div class="empresa-dropdown" id="empresa-dropdown-${obraId}">
                        <div class="dropdown-options" id="empresa-options-${obraId}"></div>
                    </div>
                </div>
            </div>

            <!-- Nº Cliente 🔴 SOMENTE LEITURA -->
            <div class="form-group-horizontal">
                <label>Nº Cliente</label>
                <input type="text" class="numero-cliente-final-cadastro" readonly
                    placeholder="Será gerado automaticamente">
            </div>

            <!-- Cliente Final 🟢 EDITÁVEL -->
            <div class="form-group-horizontal">
                <label>Cliente Final</label>
                <input type="text" class="cliente-final-cadastro" 
                    placeholder="Nome do cliente final">
            </div>

            <!-- Código 🟢 EDITÁVEL -->
            <div class="form-group-horizontal">
                <label>Código</label>
                <input type="text" class="codigo-cliente-cadastro" 
                    placeholder="Código do cliente">
            </div>

            <!-- Data 🟢 EDITÁVEL COM DATEPICKER DINÂMICO -->
            <div class="form-group-horizontal">
                <label>Data</label>
                <div class="date-input-container">
                    <input type="text" 
                           class="data-cadastro-cadastro" 
                           id="data-cadastro-${obraId}"
                           placeholder="DD/MM/AAAA"
                           value="${dataAtual}"
                           maxlength="10">
                    <span class="calendar-icon" onclick="alternarDatePicker('${obraId}', 'cadastro')">📅</span>
                </div>
            </div>

            <!-- Orçamentista 🟢 EDITÁVEL -->
            <div class="form-group-horizontal">
                <label>Orçamentista</label>
                <input type="text" class="orcamentista-responsavel-cadastro" 
                    placeholder="Nome do orçamentista">
            </div>
        </div>

        <div class="empresa-form-actions">
            <button type="button" class="btn-cancel" 
                    onclick="window.ocultarFormularioEmpresa(this, '${obraId}')">
                Cancelar
            </button>
        </div>
    </div>
    `;
    
    container.insertAdjacentHTML('beforeend', formularioHTML);
    
    // 🔥 INICIALIZAR COM TIMEOUT
    setTimeout(() => {
        inicializarInputEmpresaHibrido(obraId);
        
        // 🆕 CONFIGURAR AUTO-FORMATAÇÃO PARA O CAMPO DE DATA
        const dataCampo = container.querySelector(`#data-cadastro-${obraId}`);
        if (dataCampo) {
            configurarCampoDataEspecifico(dataCampo);
            console.log('✅ Auto-formatação de data configurada');
        }
        
    }, 300);
}

/**
 * 🆕 ALTERNA ENTRE INPUT TEXT E DATE QUANDO CLICA NO ÍCONE
 */
function alternarDatePicker(obraId, tipo) {
    const textInput = document.getElementById(`data-cadastro-${tipo === 'edit' ? 'edit-' : ''}${obraId}`);
    const container = textInput.closest('.date-input-container');
    
    if (!textInput) return;
    
    // 🆕 NÃO ESCONDE O ÍCONE - apenas o texto
    textInput.style.display = 'none';
    
    // 🆕 CRIA UM INPUT DATE VISÍVEL MAS COM FORMATAÇÃO BRASILEIRA
    const datePickerHTML = `
        <div class="date-picker-visible-wrapper" id="date-picker-wrapper-${obraId}">
            <input type="date" 
                   class="date-picker-visible"
                   id="date-picker-temp-${obraId}"
                   onchange="aplicarDataDoDatePicker('${obraId}', '${tipo}', this.value)"
                   onblur="restaurarInputTexto('${obraId}', '${tipo}')">
            <div class="date-display-overlay" id="date-display-${obraId}"></div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', datePickerHTML);
    
    const datePicker = container.querySelector('.date-picker-visible');
    const dateDisplay = container.querySelector(`#date-display-${obraId}`);
    
    // Define valor inicial baseado no texto atual
    let dataInicial = 'DD/MM/AAAA';
    if (textInput.value && /^\d{2}\/\d{2}\/\d{4}$/.test(textInput.value)) {
        const [dia, mes, ano] = textInput.value.split('/');
        datePicker.value = `${ano}-${mes}-${dia}`;
        dataInicial = textInput.value;
    }
    
    // 🆕 ATUALIZA O DISPLAY VISUAL COM FORMATAÇÃO BRASILEIRA
    atualizarDisplayData(dateDisplay, dataInicial);
    
    // 🆕 OBSERVA MUDANÇAS NO DATE PICKER PARA ATUALIZAR O DISPLAY
    datePicker.addEventListener('input', function() {
        if (this.value) {
            const [ano, mes, dia] = this.value.split('-');
            const dataBrasileira = `${dia}/${mes}/${ano}`;
            atualizarDisplayData(dateDisplay, dataBrasileira);
        } else {
            atualizarDisplayData(dateDisplay, 'DD/MM/AAAA');
        }
    });
    
    datePicker.addEventListener('change', function() {
        if (this.value) {
            const [ano, mes, dia] = this.value.split('-');
            const dataBrasileira = `${dia}/${mes}/${ano}`;
            atualizarDisplayData(dateDisplay, dataBrasileira);
        }
    });
    
    // Foca e abre o calendário
    setTimeout(() => {
        datePicker.focus();
        datePicker.showPicker();
    }, 100);
    
    console.log('✅ Date picker com formatação brasileira ativado para obra:', obraId);
}

/**
 * 🆕 APLICA A DATA SELECIONADA NO DATEPICKER AO CAMPO DE TEXTO
 */
function aplicarDataDoDatePicker(obraId, tipo, dataISO) {
    const container = document.querySelector(`#data-cadastro-${tipo === 'edit' ? 'edit-' : ''}${obraId}`).closest('.date-input-container');
    const textInput = container.querySelector(`#data-cadastro-${tipo === 'edit' ? 'edit-' : ''}${obraId}`);
    
    // 🆕 VERIFICAÇÃO MAIS ROBUSTA PARA REMOVER O DATE PICKER
    const datePickerWrapper = document.getElementById(`date-picker-wrapper-${obraId}`);
    if (datePickerWrapper && datePickerWrapper.parentNode) {
        try {
            datePickerWrapper.remove();
            console.log('✅ Date picker removido com sucesso');
        } catch (error) {
            console.log('⚠️ Date picker já foi removido:', error.message);
        }
    }
    
    if (dataISO) {
        // Converte YYYY-MM-DD para DD/MM/AAAA
        const [ano, mes, dia] = dataISO.split('-');
        const dataBrasileira = `${dia}/${mes}/${ano}`;
        
        // Aplica ao campo de texto
        textInput.value = dataBrasileira;
    }
    
    // Restaura a visualização normal
    if (textInput) {
        textInput.style.display = 'block';
        // Foca no campo de texto para continuar a digitação
        setTimeout(() => {
            textInput.focus();
            // Posiciona o cursor no final do texto
            textInput.setSelectionRange(textInput.value.length, textInput.value.length);
        }, 50);
    }
    
    // Dispara evento change se houve alteração
    if (dataISO) {
        const event = new Event('change', { bubbles: true });
        textInput.dispatchEvent(event);
        validarDataInput(textInput);
        console.log('✅ Data do date picker aplicada:', textInput.value);
    } else {
        console.log('✅ Date picker cancelado');
    }
}

/**
 * 🆕 RESTAURA O INPUT DE TEXTO SE O USUÁRIO CANCELAR
 */
function restaurarInputTexto(obraId, tipo) {
    const container = document.querySelector(`#data-cadastro-${tipo === 'edit' ? 'edit-' : ''}${obraId}`).closest('.date-input-container');
    const textInput = container.querySelector(`#data-cadastro-${tipo === 'edit' ? 'edit-' : ''}${obraId}`);
    
    // 🆕 VERIFICAÇÃO MAIS ROBUSTA PARA REMOVER O DATE PICKER
    const datePickerWrapper = document.getElementById(`date-picker-wrapper-${obraId}`);
    if (datePickerWrapper && datePickerWrapper.parentNode) {
        try {
            datePickerWrapper.remove();
            console.log('✅ Date picker removido com sucesso (blur)');
        } catch (error) {
            console.log('⚠️ Date picker já foi removido (blur):', error.message);
        }
    }
    
    // Restaura o input de texto
    if (textInput) {
        textInput.style.display = 'block';
        setTimeout(() => {
            textInput.focus();
            textInput.setSelectionRange(textInput.value.length, textInput.value.length);
        }, 50);
    }
    
    console.log('✅ Input de texto restaurado');
}

/**
 * 🆕 ATUALIZA O DISPLAY VISUAL DA DATA
 */
function atualizarDisplayData(dateDisplay, dataFormatada) {
    dateDisplay.textContent = dataFormatada;
    
    // Destaca visualmente se for uma data válida
    if (dataFormatada && /^\d{2}\/\d{2}\/\d{4}$/.test(dataFormatada)) {
        dateDisplay.style.color = '#000';
        dateDisplay.style.fontWeight = 'normal';
        dateDisplay.style.fontStyle = 'normal';
    } else {
        dateDisplay.style.color = '#999';
        dateDisplay.style.fontWeight = 'normal';
        dateDisplay.style.fontStyle = 'italic';
    }
}



/**
 * 🆕 FORMATA AUTOMATICAMENTE O CAMPO DE DATA ENQUANTO DIGITA
 * Formato: DD/MM/AAAA
 */
function configurarAutoFormatacaoData() {
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('data-cadastro-cadastro') || 
            e.target.classList.contains('data-cadastro-input')) {
            formatarDataEmTempoReal(e.target);
        }
    });
    
    // Também prevenir caracteres não numéricos
    document.addEventListener('keydown', function(e) {
        if (e.target.classList.contains('data-cadastro-cadastro') || 
            e.target.classList.contains('data-cadastro-input')) {
            permitirApenasNumerosEControles(e);
        }
    });
    
    // Validação ao sair do campo
    document.addEventListener('blur', function(e) {
        if (e.target.classList.contains('data-cadastro-cadastro') || 
            e.target.classList.contains('data-cadastro-input')) {
            validarDataInput(e.target);
        }
    }, true);
    
    console.log('✅ Sistema de auto-formatação de data configurado');
}

/**
 * 🆕 FORMATA DATA EM TEMPO REAL
 */
function formatarDataEmTempoReal(input) {
    let value = input.value.replace(/\D/g, ''); // Remove não números
    
    // Aplica formatação automática
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length > 5) {
        value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    
    input.value = value;
    
    // 🆕 VALIDAÇÃO BÁSICA DA DATA
    validarDataInput(input);
}

/**
 * 🆕 PERMITE APENAS NÚMEROS E TECLAS DE CONTROLE
 */
function permitirApenasNumerosEControles(event) {
    const teclasPermitidas = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 
        'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    
    if (teclasPermitidas.includes(event.key)) {
        return; // Permite teclas de controle
    }
    
    // Permite apenas números
    if (!/^\d$/.test(event.key)) {
        event.preventDefault();
        return;
    }
    
    // 🆕 LIMITA O TAMANHO MÁXIMO (10 caracteres com formatação)
    const input = event.target;
    if (input.value.replace(/\D/g, '').length >= 8 && !teclasPermitidas.includes(event.key)) {
        event.preventDefault();
        return;
    }
}

/**
 * 🆕 VALIDAÇÃO BÁSICA DA DATA
 */
function validarDataInput(input) {
    const value = input.value;
    
    // Verifica se está vazio
    if (!value) {
        input.style.borderColor = '';
        return true;
    }
    
    // Verifica formato básico
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        input.style.borderColor = '#ff4444';
        return false;
    }
    
    // Extrai dia, mês e ano
    const [dia, mes, ano] = value.split('/').map(Number);
    
    // Validações básicas
    if (dia < 1 || dia > 31) {
        input.style.borderColor = '#ff4444';
        return false;
    }
    
    if (mes < 1 || mes > 12) {
        input.style.borderColor = '#ff4444';
        return false;
    }
    
    if (ano < 1900 || ano > 2100) {
        input.style.borderColor = '#ff4444';
        return false;
    }
    
    // Valida meses com 30 dias
    const meses30Dias = [4, 6, 9, 11];
    if (meses30Dias.includes(mes) && dia > 30) {
        input.style.borderColor = '#ff4444';
        return false;
    }
    
    // Valida fevereiro e anos bissextos
    if (mes === 2) {
        const isBissexto = (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
        if (dia > (isBissexto ? 29 : 28)) {
            input.style.borderColor = '#ff4444';
            return false;
        }
    }
    
    // Data válida
    input.style.borderColor = '#4CAF50';
    return true;
}

/**
 * 🆕 CONFIGURA AUTO-FORMATAÇÃO PARA UM CAMPO ESPECÍFICO
 */
function configurarCampoDataEspecifico(inputElement) {
    if (!inputElement) return;
    
    inputElement.addEventListener('input', function() {
        formatarDataEmTempoReal(this);
    });
    
    inputElement.addEventListener('keydown', function(e) {
        permitirApenasNumerosEControles(e);
    });
    
    inputElement.addEventListener('blur', function() {
        validarDataInput(this);
    });
    
    // 🆕 CONFIGURA PLACEHOLDER E ATRIBUTOS
    inputElement.placeholder = 'DD/MM/AAAA';
    inputElement.maxLength = 10;
    
    console.log('✅ Campo de data configurado com auto-formatação:', inputElement.id);
}

/**
 * 🆕 OBTÉM DATA FORMATADA DO CAMPO
 * Retorna no formato DD/MM/AAAA para armazenamento (igual ao JSON)
 */
function obterDataFormatadaDoCampo(inputElement) {
    if (!inputElement || !inputElement.value) return null;
    
    const value = inputElement.value;
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
    
    // 🆕 RETORNA NO FORMATO DD/MM/AAAA (igual ao JSON)
    return value;
}

/**
 * 🆕 DEFINE DATA NO CAMPO FORMATADO
 * Aceita formato YYYY-MM-DD ou DD/MM/AAAA
 */
function definirDataNoCampo(inputElement, data) {
    if (!inputElement || !data) return;
    
    let dataFormatada;
    
    if (data.includes('-')) {
        // Formato YYYY-MM-DD
        const [ano, mes, dia] = data.split('-');
        dataFormatada = `${dia}/${mes}/${ano}`;
    } else if (data.includes('/')) {
        // Já está no formato DD/MM/AAAA
        dataFormatada = data;
    } else {
        console.warn('Formato de data não reconhecido:', data);
        return;
    }
    
    inputElement.value = dataFormatada;
    validarDataInput(inputElement);
}

/**
 * 🆕 VALIDA TODOS OS CAMPOS DE DATA DO FORMULÁRIO
 */
function validarTodosCamposDataNoFormulario(formElement) {
    const camposData = formElement.querySelectorAll('.data-cadastro-cadastro, .data-cadastro-input');
    let todosValidos = true;
    
    camposData.forEach(campo => {
        if (!validarDataInput(campo)) {
            todosValidos = false;
        }
    });
    
    return todosValidos;
}

/**
 * 🆕 LIMPA E RESETA CAMPO DE DATA
 */
function limparCampoData(inputElement) {
    if (!inputElement) return;
    
    inputElement.value = '';
    inputElement.style.borderColor = '';
    inputElement.placeholder = 'DD/MM/AAAA';
}

// 🆕 EXPORTA AS FUNÇÕES
export {
    atualizarInterfaceComEmpresa,
    atualizarCamposEmpresaForm,
    criarVisualizacaoEmpresa,
    criarFormularioVazioEmpresa,
    configurarAutoFormatacaoData,
    configurarCampoDataEspecifico,
    obterDataFormatadaDoCampo,
    definirDataNoCampo,
    validarTodosCamposDataNoFormulario,
    limparCampoData,
    alternarDatePicker,
    aplicarDataDoDatePicker,
    restaurarInputTexto,
    atualizarDisplayData
};

// 🆕 TORNA AS FUNÇÕES DISPONÍVEIS GLOBALMENTE PARA OS EVENTOS HTML
window.alternarDatePicker = alternarDatePicker;
window.aplicarDataDoDatePicker = aplicarDataDoDatePicker;
window.restaurarInputTexto = restaurarInputTexto;