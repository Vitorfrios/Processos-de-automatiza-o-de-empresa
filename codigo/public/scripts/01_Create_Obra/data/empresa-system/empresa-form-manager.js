// empresa-form-manager.js
/**
 * 📝 EMPRESA-FORM-MANAGER.JS - Gerenciamento de Formulários de Empresa
 * ✅ Responsabilidade: Formulários inline, datepicker, validação, campos de data
 * ✅ Arquivo 3 de 5 na refatoração do sistema de empresa
 */

import { EmpresaCadastroInline } from './empresa-core.js';
import { inicializarInputEmpresaHibrido } from './empresa-autocomplete.js';
import { 
    formatarDataEmTempoReal, 
    validarDataInput, 
    permitirApenasNumerosEControles 
} from './empresa-ui-helpers.js';

const empresa = new EmpresaCadastroInline();

/* ==== SEÇÃO 1: GERENCIAMENTO DE FORMULÁRIOS ==== */

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
                input.value = empresa.formatarData(obraData[dataField]);
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
    if (idObraValue && obraData.idGerado) {
        idObraValue.textContent = obraData.idGerado;
    }
}

/**
 * 🆕 CRIA FORMULÁRIO DE EMPRESA COM DADOS EXISTENTES - CORRIGIDO
 */
// empresa-form-manager.js - VERSÃO UNIFICADA

/**
 * 🎯 ÚNICO FORMULÁRIO DE EMPRESA - Inteligente (criação/visualização)
 */
function criarFormularioEmpresa(obraId, container, dadosExistentes = null) {
    console.log(`📋 [EMPRESA] Criando formulário para obra ${obraId}`, dadosExistentes ? 'com dados' : 'vazio');
    
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const modoEdicao = !!dadosExistentes; // true se tem dados
    
    // Preparar valores
    const valorEmpresa = dadosExistentes?.empresaSigla && dadosExistentes?.empresaNome 
        ? `${dadosExistentes.empresaSigla} - ${dadosExistentes.empresaNome}` 
        : '';
    
    const numeroCliente = dadosExistentes?.numeroClienteFinal || '';
    const clienteFinal = dadosExistentes?.clienteFinal || '';
    const codigoCliente = dadosExistentes?.codigoCliente || '';
    const dataCadastro = dadosExistentes?.dataCadastro ? formatarData(dadosExistentes.dataCadastro) : dataAtual;
    const orcamentista = dadosExistentes?.orcamentistaResponsavel || '';
    
    const formularioHTML = `
    <div class="empresa-formulario-ativo" data-modo="${modoEdicao ? 'edicao' : 'criacao'}">
        <h4>${modoEdicao ? 'Dados da Empresa' : 'Cadastro de Empresa'}</h4>

        <div class="empresa-form-grid-horizontal">
            <!-- EMPRESA (sempre editável) -->
            <div class="form-group-horizontal">
                <label>Empresa ${!modoEdicao ? '*' : ''}</label>
                <div class="empresa-input-container">
                    <input type="text" 
                           class="empresa-input-cadastro" 
                           id="empresa-input-${obraId}"
                           value="${valorEmpresa}"
                           placeholder="Digite sigla ou nome ou selecione..."
                           autocomplete="off"
                           ${modoEdicao ? '' : 'required'}>
                    <div class="empresa-dropdown" id="empresa-dropdown-${obraId}">
                        <div class="dropdown-options" id="empresa-options-${obraId}"></div>
                    </div>
                </div>
            </div>

            <!-- Nº CLIENTE (NUNCA readonly) -->
            <div class="form-group-horizontal">
                <label>Nº Cliente</label>
                <input type="text" 
                       class="numero-cliente-input" 
                       id="numero-cliente-${obraId}"
                       value="${numeroCliente}"
                       placeholder="${modoEdicao ? 'Número do cliente' : 'Será gerado automaticamente'}"
                       ${modoEdicao ? '' : 'readonly'}> <!-- Apenas readonly em criação até selecionar empresa -->
            </div>

            <!-- CLIENTE FINAL (sempre editável) -->
            <div class="form-group-horizontal">
                <label>Cliente Final</label>
                <input type="text" 
                       class="cliente-final-input" 
                       id="cliente-final-${obraId}"
                       value="${clienteFinal}"
                       placeholder="Nome do cliente final">
            </div>

            <!-- CÓDIGO (sempre editável) -->
            <div class="form-group-horizontal">
                <label>Código</label>
                <input type="text" 
                       class="codigo-cliente-input" 
                       id="codigo-cliente-${obraId}"
                       value="${codigoCliente}"
                       placeholder="Código do cliente">
            </div>

            <!-- DATA (sempre editável, com fallback) -->
            <div class="form-group-horizontal">
                <label>Data</label>
                <div class="date-input-container">
                    <input type="text" 
                           class="data-cadastro-input" 
                           id="data-cadastro-${obraId}"
                           value="${dataCadastro}"
                           placeholder="DD/MM/AAAA"
                           maxlength="10">
                    <span class="calendar-icon" onclick="window.alternarDatePicker('${obraId}')">📅</span>
                </div>
            </div>

            <!-- ORÇAMENTISTA (sempre editável) -->
            <div class="form-group-horizontal">
                <label>Orçamentista</label>
                <input type="text" 
                       class="orcamentista-input" 
                       id="orcamentista-${obraId}"
                       value="${orcamentista}"
                       placeholder="Nome do orçamentista">
            </div>
        </div>

        <!-- BOTÕES: SEMPRE OCULTAR + LIMPAR -->
        <div class="empresa-form-actions">
            <button type="button" class="btn-ocultar" 
                    onclick="window.ocultarFormularioEmpresa('${obraId}')">
                Ocultar
            </button>
            <button type="button" class="btn-limpar" 
                    onclick="window.limparFormularioEmpresa('${obraId}')">
                Limpar
            </button>
        </div>
    </div>
    `;
    
    // Remover formulário anterior se existir
    const formularioAnterior = container.querySelector('.empresa-formulario-ativo');
    if (formularioAnterior) formularioAnterior.remove();
    
    // Inserir novo formulário
    container.insertAdjacentHTML('beforeend', formularioHTML);
    
    // Configurar após inserção
    setTimeout(() => {
        // Inicializar autocomplete
        if (typeof window.inicializarInputEmpresaHibrido === 'function') {
            window.inicializarInputEmpresaHibrido(obraId);
        }
        
        // Configurar campo de data
        const dataCampo = document.getElementById(`data-cadastro-${obraId}`);
        if (dataCampo) configurarCampoDataEspecifico(dataCampo);
        
        // Se tem dados, configurar data attributes
        if (dadosExistentes) {
            const empresaInput = document.getElementById(`empresa-input-${obraId}`);
            if (empresaInput && dadosExistentes.empresaSigla) {
                empresaInput.dataset.siglaSelecionada = dadosExistentes.empresaSigla;
                empresaInput.dataset.nomeSelecionado = dadosExistentes.empresaNome || '';
            }
            
            // Número do cliente SEMPRE editável
            const numeroInput = document.getElementById(`numero-cliente-${obraId}`);
            if (numeroInput) {
                numeroInput.removeAttribute('readonly');
                numeroInput.readOnly = false;
            }
        }
        
        console.log(`✅ [EMPRESA] Formulário ${modoEdicao ? 'de edição' : 'de criação'} criado para obra ${obraId}`);
    }, 12);
}

/**
 * 🆕 VINCULAR EVENTOS DE MUDANÇA PARA OS CAMPOS
 */
function vincularEventosMudanca(obraId, container) {
    // Vincular evento change para cada campo editável
    const campos = [
        { selector: '.cliente-final-input', campo: 'clienteFinal' },
        { selector: '.codigo-cliente-input', campo: 'codigoCliente' },
        { selector: '.orcamentista-responsavel-input', campo: 'orcamentistaResponsavel' }
    ];
    
    campos.forEach(({ selector, campo }) => {
        const input = container.querySelector(selector);
        if (input) {
            // Remover event listener anterior se existir
            input.removeEventListener('change', input._changeHandler);
            
            // Adicionar novo handler
            input._changeHandler = function() {
                window.atualizarDadosEmpresa(this, campo, obraId);
            };
            
            input.addEventListener('change', input._changeHandler);
        }
    });
}

/**
 * 🆕 CRIA FORMULÁRIO VAZIO DE EMPRESA
 */
function criarFormularioVazioEmpresa(obraId, container) {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const formularioHTML = `
    <div class="empresa-formulario-ativo">
        <h4>Cadastro de Empresa</h4>

        <div class="empresa-form-grid-horizontal">
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

            <div class="form-group-horizontal">
                <label>Nº Cliente</label>
                <input type="text" class="numero-cliente-final-cadastro"
                    placeholder="Será gerado automaticamente">
            </div>

            <div class="form-group-horizontal">
                <label>Cliente Final</label>
                <input type="text" 
                       class="cliente-final-cadastro" 
                       id="cliente-final-${obraId}"
                       placeholder="Nome do cliente final">
            </div>

            <div class="form-group-horizontal">
                <label>Código</label>
                <input type="text" 
                       class="codigo-cliente-cadastro" 
                       id="codigo-cliente-${obraId}"
                       placeholder="Código do cliente">
            </div>

            <div class="form-group-horizontal">
                <label>Data</label>
                <div class="date-input-container">
                    <input type="text" 
                           class="data-cadastro-cadastro" 
                           id="data-cadastro-${obraId}"
                           placeholder="DD/MM/AAAA"
                           value="${dataAtual}"
                           maxlength="10">
                    <span class="calendar-icon" onclick="window.alternarDatePicker('${obraId}', 'cadastro')">📅</span>
                </div>
            </div>

            <div class="form-group-horizontal">
                <label>Orçamentista</label>
                <input type="text" 
                       class="orcamentista-responsavel-cadastro" 
                       id="orcamentista-${obraId}"
                       placeholder="Nome do orçamentista">
            </div>
        </div>

        <div class="empresa-form-actions">
            <button type="button" class="btn-ocultar" 
                    onclick="window.ocultarFormularioEmpresa('${obraId}')">
                Ocultar
            </button>
            <button type="button" class="btn-limpar" 
                    onclick="window.limparFormularioEmpresa('${obraId}')">
                Limpar
            </button>
        </div>
    </div>
    `;
    
    container.insertAdjacentHTML('beforeend', formularioHTML);
    
    setTimeout(() => {
        inicializarInputEmpresaHibrido(obraId);
        
        // 🆕 CONFIGURAR AUTO-FORMATAÇÃO PARA O CAMPO DE DATA
        const dataCampo = container.querySelector(`#data-cadastro-${obraId}`);
        if (dataCampo) {
            configurarCampoDataEspecifico(dataCampo);
        }
        
    }, 37);
}

/* ==== SEÇÃO 2: SISTEMA DE DATEPICKER E FORMATAÇÃO DE DATA ==== */

/**
 * 🆕 CONFIGURAR AUTO-FORMATAÇÃO PARA TODOS OS CAMPOS DE DATA
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
 * 🆕 ALTERNA ENTRE INPUT TEXT E DATE QUANDO CLICA NO ÍCONE
 */
window.alternarDatePicker = function(obraId, tipo) {
    const textInput = document.getElementById(`data-cadastro-${tipo === 'edit' ? '' : ''}${obraId}`);
    const container = textInput?.closest('.date-input-container');
    
    if (!textInput || !container) return;
    
    textInput.style.display = 'none';
    
    const datePickerHTML = `
        <div class="date-picker-visible-wrapper" id="date-picker-wrapper-${obraId}">
            <input type="date" 
                   class="date-picker-visible"
                   id="date-picker-temp-${obraId}"
                   onchange="window.aplicarDataDoDatePicker('${obraId}', '${tipo}', this.value)"
                   onblur="window.restaurarInputTexto('${obraId}', '${tipo}')">
            <div class="date-display-overlay" id="date-display-${obraId}"></div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', datePickerHTML);
    
    const datePicker = container.querySelector('.date-picker-visible');
    const dateDisplay = container.querySelector(`#date-display-${obraId}`);
    
    let dataInicial = 'DD/MM/AAAA';
    if (textInput.value && /^\d{2}\/\d{2}\/\d{4}$/.test(textInput.value)) {
        const [dia, mes, ano] = textInput.value.split('/');
        datePicker.value = `${ano}-${mes}-${dia}`;
        dataInicial = textInput.value;
    }
    
    atualizarDisplayData(dateDisplay, dataInicial);
    
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
    
    setTimeout(() => {
        datePicker.focus();
        datePicker.showPicker();
    }, 12);
    
    console.log('✅ Date picker ativado para obra:', obraId);
};

/**
 * 🆕 APLICA A DATA SELECIONADA NO DATEPICKER AO CAMPO DE TEXTO
 */
window.aplicarDataDoDatePicker = function(obraId, tipo, dataISO) {
    const container = document.querySelector(`#data-cadastro-${obraId}`)?.closest('.date-input-container');
    const textInput = container?.querySelector(`#data-cadastro-${obraId}`);
    
    const datePickerWrapper = document.getElementById(`date-picker-wrapper-${obraId}`);
    if (datePickerWrapper && datePickerWrapper.parentNode) {
        try {
            datePickerWrapper.remove();
        } catch (error) {
            console.log('⚠️ Date picker já foi removido:', error.message);
        }
    }
    
    if (dataISO && textInput) {
        const [ano, mes, dia] = dataISO.split('-');
        const dataBrasileira = `${dia}/${mes}/${ano}`;
        textInput.value = dataBrasileira;
    }
    
    if (textInput) {
        textInput.style.display = 'block';
        setTimeout(() => {
            textInput.focus();
            textInput.setSelectionRange(textInput.value.length, textInput.value.length);
        }, 50);
    }
    
    if (dataISO && textInput) {
        const event = new Event('change', { bubbles: true });
        textInput.dispatchEvent(event);
        console.log('✅ Data do date picker aplicada:', textInput.value);
    }
};

/**
 * 🆕 RESTAURA O INPUT DE TEXTO SE O USUÁRIO CANCELAR
 */
window.restaurarInputTexto = function(obraId, tipo) {
    const container = document.querySelector(`#data-cadastro-${obraId}`)?.closest('.date-input-container');
    const textInput = container?.querySelector(`#data-cadastro-${obraId}`);
    
    const datePickerWrapper = document.getElementById(`date-picker-wrapper-${obraId}`);
    if (datePickerWrapper && datePickerWrapper.parentNode) {
        try {
            datePickerWrapper.remove();
        } catch (error) {
            console.log('⚠️ Date picker já foi removido (blur):', error.message);
        }
    }
    
    if (textInput) {
        textInput.style.display = 'block';
        setTimeout(() => {
            textInput.focus();
            textInput.setSelectionRange(textInput.value.length, textInput.value.length);
        }, 50);
    }
    
    console.log('✅ Input de texto restaurado');
};

/**
 * 🆕 ATUALIZA O DISPLAY VISUAL DA DATA
 */
function atualizarDisplayData(dateDisplay, dataFormatada) {
    if (!dateDisplay) return;
    
    dateDisplay.textContent = dataFormatada;
    
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

/* ==== SEÇÃO 3: UTILITÁRIOS DE DATA ==== */

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

/* ==== SEÇÃO 4: OCULTAR FORMULÁRIO E LIMPEZA ==== */

/**
 * 🆕 FUNÇÃO PARA FORÇAR LIMPEZA COMPLETA DOS CAMPOS
 * (Pode ser chamada de qualquer lugar)
 */
function limparCamposEmpresaCompletamente(obraId) {
    try {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) return;
        
        console.log(`🧹 [EMPRESA] Forçando limpeza completa para obra ${obraId}`);
        
        // 🔥 1. Todos os inputs de empresa (em qualquer formulário)
        const todosInputsEmpresa = obraElement.querySelectorAll(`
            .empresa-input-cadastro, 
            .empresa-input,
            .numero-cliente-final-cadastro,
            .numero-cliente-final-readonly,
            .cliente-final-cadastro,
            .cliente-final-input,
            .codigo-cliente-cadastro,
            .codigo-cliente-input,
            .data-cadastro-cadastro,
            .data-cadastro-input,
            .orcamentista-responsavel-cadastro,
            .orcamentista-responsavel-input
        `);
        
        todosInputsEmpresa.forEach(input => {
            // Remover atributo value
            input.removeAttribute('value');
            
            // Limpar valor
            if (input.readOnly || input.disabled) {
                input.setAttribute('value', '');
            }
            input.value = '';
            
            // Limpar data attributes
            delete input.dataset.siglaSelecionada;
            delete input.dataset.nomeSelecionado;
            
            // Restaurar placeholders
            if (input.classList.contains('empresa-input-cadastro') || 
                input.classList.contains('empresa-input')) {
                input.placeholder = 'Digite sigla ou nome...';
            } else if (input.classList.contains('numero-cliente-final-readonly') ||
                      input.classList.contains('numero-cliente-final-cadastro')) {
                input.placeholder = 'Número do cliente';
            }
        });
        
        // 🔥 2. Remover dropdowns de autocomplete
        const dropdowns = obraElement.querySelectorAll('.empresa-dropdown');
        dropdowns.forEach(dropdown => dropdown.remove());
        
        // 🔥 3. Limpar data attributes da obra
        const camposParaLimpar = [
            'empresaSigla', 'empresaNome', 'numeroClienteFinal',
            'clienteFinal', 'codigoCliente', 'dataCadastro',
            'orcamentistaResponsavel', 'idGerado', 'identificadorObra'
        ];
        
        camposParaLimpar.forEach(campo => {
            delete obraElement.dataset[campo];
        });
        
        // 🔥 4. Restaurar botão se necessário
        const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');
        if (empresaContainer && !empresaContainer.querySelector('.btn-empresa-cadastro')) {
            empresaContainer.innerHTML = '';
            const botao = document.createElement('button');
            botao.className = 'btn-empresa-cadastro';
            botao.textContent = 'Adicionar campos de cadastro de empresas';
            botao.onclick = () => window.ativarCadastroEmpresa(obraId);
            empresaContainer.appendChild(botao);
        }
        
        console.log(`✅ [EMPRESA] Limpeza completa realizada para obra ${obraId}`);
        
    } catch (error) {
        console.error('❌ [EMPRESA] Erro na limpeza completa:', error);
    }
}

/**
 * 🆕 OCULTAR FORMULÁRIO SEM LIMPAR DADOS - CORRIGIDO
 */
window.ocultarFormularioEmpresa = function(obraId) {
    try {
        console.log(`👁️ [EMPRESA] Ocultando formulário para obra ${obraId}`);
        
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) return;
        
        const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');
        if (!empresaContainer) return;
        
        const formulario = empresaContainer.querySelector('.empresa-formulario-ativo');
        if (formulario) {
            formulario.style.display = 'none';
            
            // 🔥 VERIFICAR SE TEM DADOS PARA MOSTRAR BOTÃO CORRETO
            const temDados = obraElement.dataset.empresaSigla || 
                            obraElement.dataset.empresaNome || 
                            obraElement.dataset.numeroClienteFinal;
            
            // Remover qualquer botão existente
            const botoesExistentes = empresaContainer.querySelectorAll('.btn-empresa-cadastro, .btn-empresa-visualizar');
            botoesExistentes.forEach(btn => btn.remove());
            
            // Criar botão apropriado
            const novoBotao = document.createElement('button');
            
            if (temDados) {
                novoBotao.className = 'btn-empresa-visualizar';
                novoBotao.textContent = 'Visualizar campos de cadastro de empresas';
            } else {
                novoBotao.className = 'btn-empresa-cadastro';
                novoBotao.textContent = 'Adicionar campos de cadastro de empresas';
            }
            
            novoBotao.onclick = () => window.ativarCadastroEmpresa(obraId);
            empresaContainer.appendChild(novoBotao);
            
            console.log(`👁️ [EMPRESA] Botão ${temDados ? 'visualizar' : 'cadastro'} criado`);
        }
        
    } catch (error) {
        console.error('❌ [EMPRESA] Erro ao ocultar:', error);
    }
};

// Limpar campos (exceto data)
window.limparFormularioEmpresa = function(obraId) {
    try {
        console.log(`🧹 [EMPRESA] Limpando campos para obra ${obraId}`);
        
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) return;
        
        const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');
        if (!empresaContainer) return;
        
        const formulario = empresaContainer.querySelector('.empresa-formulario-ativo');
        if (!formulario) return;
        
        // 🔥 Limpar campos
        const camposParaLimpar = [
            '#empresa-input-' + obraId,
            '#numero-cliente-' + obraId,
            '#cliente-final-' + obraId,
            '#codigo-cliente-' + obraId,
            '#orcamentista-' + obraId
        ];
        
        camposParaLimpar.forEach(seletor => {
            const campo = formulario.querySelector(seletor);
            if (campo) {
                campo.value = '';
                campo.removeAttribute('value');
                
                if (seletor.includes('empresa-input')) {
                    delete campo.dataset.siglaSelecionada;
                    delete campo.dataset.nomeSelecionado;
                }
                
                if (seletor.includes('numero-cliente')) {
                    campo.removeAttribute('readonly');
                    campo.readOnly = false;
                    campo.placeholder = 'Será gerado automaticamente';
                }
            }
        });
        
        // Manter data atual
        const dataCampo = formulario.querySelector('#data-cadastro-' + obraId);
        if (dataCampo) {
            dataCampo.value = new Date().toLocaleDateString('pt-BR');
        }
        
        // Limpar data attributes da obra
        const camposParaRemover = [
            'empresaSigla', 'empresaNome', 'numeroClienteFinal',
            'clienteFinal', 'codigoCliente', 'orcamentistaResponsavel',
            'idGerado', 'identificadorObra'
        ];
        
        camposParaRemover.forEach(campo => delete obraElement.dataset[campo]);
        
        // 🔥 APÓS LIMPAR, FECHAR O FORMULÁRIO E MOSTRAR BOTÃO DE CADASTRO
        formulario.style.display = 'none';
        
        // Remover botões existentes
        const botoesExistentes = empresaContainer.querySelectorAll('.btn-empresa-cadastro, .btn-empresa-visualizar');
        botoesExistentes.forEach(btn => btn.remove());
        
        // Criar botão de cadastro (vazio)
        const novoBotao = document.createElement('button');
        novoBotao.className = 'btn-empresa-cadastro';
        novoBotao.textContent = 'Adicionar campos de cadastro de empresas';
        novoBotao.onclick = () => window.ativarCadastroEmpresa(obraId);
        empresaContainer.appendChild(novoBotao);
        
        // Resetar título
        const tituloElement = obraElement.querySelector('.obra-title');
        if (tituloElement) {
            tituloElement.textContent = 'Nova Obra';
        }
        
        console.log(`✅ [EMPRESA] Campos limpos, formulário ocultado, botão de cadastro criado`);
        
    } catch (error) {
        console.error('❌ [EMPRESA] Erro ao limpar formulário:', error);
    }
};



/* ==== SEÇÃO 5: INICIALIZAÇÃO ==== */
export { 
    atualizarInterfaceComEmpresa,
    atualizarCamposEmpresaForm,
    vincularEventosMudanca,
    configurarAutoFormatacaoData,
    configurarCampoDataEspecifico,
    atualizarDisplayData,
    obterDataFormatadaDoCampo,
    definirDataNoCampo,
    validarTodosCamposDataNoFormulario,
    limparCampoData,
    limparCamposEmpresaCompletamente,
    criarFormularioEmpresa
}

// Compatibilidade global
if (typeof window !== 'undefined') {
    window.atualizarInterfaceComEmpresa = atualizarInterfaceComEmpresa;
    window.atualizarCamposEmpresaForm = atualizarCamposEmpresaForm;
    window.criarFormularioEmpresa = criarFormularioEmpresa;
    window.vincularEventosMudanca = vincularEventosMudanca;
    window.configurarAutoFormatacaoData = configurarAutoFormatacaoData;
    window.configurarCampoDataEspecifico = configurarCampoDataEspecifico;
    window.atualizarDisplayData = atualizarDisplayData;
    window.obterDataFormatadaDoCampo = obterDataFormatadaDoCampo;
    window.definirDataNoCampo = definirDataNoCampo;
    window.validarTodosCamposDataNoFormulario = validarTodosCamposDataNoFormulario;
    window.limparCampoData = limparCampoData;
    window.limparCamposEmpresaCompletamente = limparCamposEmpresaCompletamente;
}


// 🆕 INICIALIZAR CONFIGURAÇÃO DE DATA QUANDO O MÓDULO FOR CARREGADO
document.addEventListener('DOMContentLoaded', function() {
    configurarAutoFormatacaoData();
    console.log('✅ empresa-form-manager.js carregado com sucesso');
});