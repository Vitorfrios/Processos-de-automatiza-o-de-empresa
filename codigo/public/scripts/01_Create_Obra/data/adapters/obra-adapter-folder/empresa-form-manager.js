// empresa-form-manager.js
import {formatarData } from './ui-helpers-obra-adapter.js'
import {inicializarInputEmpresaHibrido } from './empresa-autocomplete.js'

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
 * 🆕 CRIA FORMULÁRIO DE EMPRESA COM DADOS EXISTENTES - COM DATA FORMATADA
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

            <div class="form-group-horizontal">
                <label>Data</label>
                <input type="text" class="data-cadastro-readonly" 
                    value="${dataFormatada}" readonly>
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
    console.log(`✅ [EMPRESA] Formulário criado para obra ${obraData.id} com data: ${dataFormatada}`);
}

/**
 * 🆕 CRIA FORMULÁRIO VAZIO PARA NOVO CADASTRO COM INPUT HÍBRIDO
 */
function criarFormularioVazioEmpresa(obraId, container) {
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
                <input type="text" class="numero-cliente-final-cadastro" readonly
                    placeholder="Será gerado automaticamente">
            </div>

            <div class="form-group-horizontal">
                <label>Cliente Final</label>
                <input type="text" class="cliente-final-cadastro" 
                    placeholder="Nome do cliente final">
            </div>

            <div class="form-group-horizontal">
                <label>Código</label>
                <input type="text" class="codigo-cliente-cadastro" 
                    placeholder="Código do cliente">
            </div>

            <div class="form-group-horizontal">
                <label>Data</label>
                <input type="text" class="data-cadastro-cadastro" 
                    value="${new Date().toLocaleDateString('pt-BR')}" readonly>
            </div>

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
    
    // 🔥 CORREÇÃO: Inicializar com timeout maior para garantir que o DOM está pronto
    setTimeout(() => {
        inicializarInputEmpresaHibrido(obraId);
    }, 300);
}

// EXPORTS NO FINAL
export {
    atualizarInterfaceComEmpresa,
    atualizarCamposEmpresaForm,
    criarVisualizacaoEmpresa,
    criarFormularioVazioEmpresa
};