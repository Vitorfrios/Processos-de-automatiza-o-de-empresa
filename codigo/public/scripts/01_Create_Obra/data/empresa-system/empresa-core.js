// empresa-core.js
/**
 * EMPRESA-CORE.JS - Núcleo do Sistema de Empresas
 * Responsabilidade: Inicialização, cache, funções fundamentais, classe principal
 */

/* ==== SEÇÃO 1: SISTEMA DE CACHE DE EMPRESAS ==== */

// 🆕 CACHE DE EMPRESAS - EVITA MÚLTIPLAS REQUISIÇÕES
window.empresasCache = null;
window.cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * CARREGAR EMPRESAS COM CACHE
 */
async function carregarEmpresasComCache() {
    const agora = Date.now();

    // Se tem cache válido, retorna do cache
    if (window.empresasCache && window.cacheTimestamp && (agora - window.cacheTimestamp) < CACHE_DURATION) {
        console.log('📦 [CACHE] Retornando empresas do cache');
        return window.empresasCache;
    }

    try {
        console.log('📦 [CACHE] Carregando empresas do servidor...');
        const response = await fetch('/api/dados/empresas');

        if (response.ok) {
            const data = await response.json();
            const empresas = data.empresas || [];

            // Atualiza cache
            window.empresasCache = empresas;
            window.cacheTimestamp = agora;

            console.log(`✅ [CACHE] ${empresas.length} empresas carregadas e cacheadas`);
            return empresas;
        } else {
            console.error('❌ [CACHE] Erro ao carregar empresas:', response.status);
            return [];
        }
    } catch (error) {
        console.error('❌ [CACHE] Erro no carregamento:', error);
        return window.empresasCache || []; // Retorna cache antigo se disponível
    }
}

/**
 * LIMPAR CACHE (para ser chamado quando novas empresas forem adicionadas)
 */
function limparCacheEmpresas() {
    window.empresasCache = null;
    window.cacheTimestamp = null;
    console.log('🧹 [CACHE] Cache de empresas limpo');
}

/* ==== SEÇÃO 2: CLASSE PRINCIPAL - EMPRESA CADASTRO INLINE ==== */

import { showSystemStatus } from '../../ui/components/status.js';

export class EmpresaCadastroInline {
    constructor() {
        this.empresas = [];
        this.obrasExistentes = [];
        this.container = null;
        this.isActive = false;

        this.init();
    }

    async init() {
        await this.carregarDados();
        this.vincularEventos();
    }

    async carregarDados() {
        try {
            // Carregar empresas do dados.json
            const responseEmpresas = await fetch('/api/dados/empresas');
            if (responseEmpresas.ok) {
                const dados = await responseEmpresas.json();
                this.empresas = dados.empresas || [];
            }

            // Carregar obras existentes do backup.json
            const responseBackup = await fetch('/api/backup-completo');
            if (responseBackup.ok) {
                const backup = await responseBackup.json();
                this.obrasExistentes = backup.obras || [];
            }

            console.log(`📊 Dados carregados: ${this.empresas.length} empresas, ${this.obrasExistentes.length} obras`);
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
        }
    }

    vincularEventos() {
        // Encontrar todos os spans de cadastro de empresas e transformar em botões
        const spansCadastro = document.querySelectorAll('.projetc-header-record.very-dark span');

        spansCadastro.forEach(span => {
            // Transformar span em botão
            const button = document.createElement('button');
            button.className = 'btn-empresa-cadastro';
            button.textContent = span.textContent;
            button.setAttribute('type', 'button');

            // Substituir span por botão
            span.parentNode.replaceChild(button, span);

            // Vincular eventos
            button.addEventListener('click', (e) => this.ativarCadastro(e));
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.ativarCadastro(e);
                }
            });
        });
    }

    ativarCadastro(event) {
        if (this.isActive) return;

        const span = event.target;
        this.container = span.closest('.projetc-header-record');

        if (!this.container) {
            console.error('❌ Container não encontrado');
            return;
        }

        // Ocultar span e mostrar formulário inline
        span.style.display = 'none';
        this.renderizarFormulario();
        this.isActive = true;

        // Inicializar campo de número do cliente
        const obraElement = this.container.closest('.obra-block');
        if (obraElement) {
            this.inicializarCampoNumeroCliente(obraElement);
        }

        console.log('✅ Cadastro inline ativado');
    }

    renderizarFormulario() {
        const formHTML = this.criarHTMLFormulario();
        this.container.insertAdjacentHTML('beforeend', formHTML);

        this.configurarEstadoCampos();
        this.vincularEventosFormulario();

        setTimeout(() => {
            const empresaInput = this.container.querySelector('#empresa-input');
            if (empresaInput) empresaInput.focus();
        }, 100);
    }

    configurarEstadoCampos() {
        const camposLiberados = [
            'empresa-input',
            'cliente-final',
            'codigo-cliente',
            'data-cadastro',
            'orcamentista-responsavel'
        ];

        camposLiberados.forEach(campoId => {
            const campo = this.container.querySelector(`#${campoId}`);
            if (campo) {
                campo.removeAttribute('readonly');
                campo.removeAttribute('disabled');
                campo.readOnly = false;
                campo.disabled = false;
                campo.style.backgroundColor = '#ffffff';
                campo.style.borderColor = '#007bff';
                campo.style.cursor = 'text';
                campo.style.color = '#000000';
            }
        });

        const camposBloqueados = [
            'numero-cliente-final'
        ];

        camposBloqueados.forEach(campoId => {
            const campo = this.container.querySelector(`#${campoId}`);
            if (campo) {
                campo.readOnly = true;
                campo.setAttribute('readonly', 'true');
                campo.style.backgroundColor = '#f8f9fa';
                campo.style.borderColor = '#ced4da';
                campo.style.cursor = 'not-allowed';
                campo.style.color = '#6c757d';
            }
        });

        this.configurarCampoData();
    }

    configurarCampoData() {
        const dataCampo = this.container.querySelector('#data-cadastro');
        if (dataCampo) {
            dataCampo.removeAttribute('readonly');
            dataCampo.readOnly = false;
            dataCampo.disabled = false;
            dataCampo.title = "Clique para editar a data (DD/MM/AAAA)";
            dataCampo.placeholder = "DD/MM/AAAA";
            dataCampo.style.backgroundColor = '#ffffff';
            dataCampo.style.borderColor = '#007bff';
            dataCampo.style.cursor = 'text';
            dataCampo.style.color = '#000000';

            dataCampo.addEventListener('input', (e) => {
                this.aplicarMascaraData(e.target);
            });

            dataCampo.addEventListener('blur', (e) => {
                this.validarData(e.target);
            });
        }
    }

    aplicarMascaraData(input) {
        let value = input.value.replace(/\D/g, '');

        if (value.length > 8) {
            value = value.substring(0, 8);
        }

        if (value.length > 4) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4) + '/' + value.substring(4);
        } else if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }

        input.value = value;
    }

    validarData(input) {
        const valor = input.value.trim();

        if (!valor) return true;

        const regexData = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = valor.match(regexData);

        if (!match) {
            showSystemStatus('Formato de data inválido. Use DD/MM/AAAA', 'warning');
            input.focus();
            return false;
        }

        const dia = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10);
        const ano = parseInt(match[3], 10);

        if (mes < 1 || mes > 12) {
            showSystemStatus('Mês deve estar entre 01 e 12', 'warning');
            input.focus();
            return false;
        }

        if (dia < 1 || dia > 31) {
            showSystemStatus('Dia deve estar entre 01 e 31', 'warning');
            input.focus();
            return false;
        }

        const data = new Date(ano, mes - 1, dia);
        if (data.getDate() !== dia || data.getMonth() + 1 !== mes || data.getFullYear() !== ano) {
            showSystemStatus('Data inválida para o mês especificado', 'warning');
            input.focus();
            return false;
        }

        return true;
    }

    criarHTMLFormulario() {
        const obraId = this.container?.closest('.obra-block')?.dataset?.obraId || 'temp';

        return `
        <div class="empresa-formulario-ativo" id="empresa-formulario-${obraId}">
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
                    <input type="text" 
                        class="numero-cliente-final-cadastro" 
                        id="numero-cliente-${obraId}"
                        placeholder="Será calculado automaticamente (pode editar)">
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
                            value="${new Date().toLocaleDateString('pt-BR')}"
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
                <button type="button" class="btn-cancel" 
                        onclick="window.empresaCadastro.cancelarCadastro()">
                    Cancelar
                </button>
            </div>
        </div>
        `;
    }

    vincularEventosFormulario() {
        const empresaInput = this.container.querySelector('#empresa-input');
        if (empresaInput) {
            empresaInput.addEventListener('input', (e) => this.buscarEmpresas(e.target.value));
            empresaInput.addEventListener('blur', () => {
                setTimeout(() => this.ocultarSugestoes(), 200);
            });
            empresaInput.addEventListener('keydown', (e) => this.tratarTecladoAutocomplete(e));
            this.observarMudancasEmpresa();
        }

        const dataCampo = this.container.querySelector('#data-cadastro');
        if (dataCampo) {
            dataCampo.addEventListener('change', () => {
                this.validarData(dataCampo);
            });
        }
    }

    async buscarEmpresas(termo) {
        if (!termo || termo.length < 2) {
            this.ocultarSugestoes();
            return;
        }

        const termoNormalizado = this.normalizarTermo(termo);
        const sugestoes = this.filtrarEmpresas(termoNormalizado);

        this.exibirSugestoes(sugestoes);
    }

    normalizarTermo(termo) {
        return termo.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    filtrarEmpresas(termo) {
        return this.empresas.filter(empresaObj => {
            const [sigla, nome] = Object.entries(empresaObj)[0];
            const nomeNormalizado = nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const primeiroNome = nome.split(' ')[0].toUpperCase();

            return sigla === termo ||
                nomeNormalizado.includes(termo) ||
                primeiroNome.includes(termo);
        });
    }

    exibirSugestoes(sugestoes) {
        const containerSugestoes = this.container.querySelector('#empresa-suggestions');
        if (!containerSugestoes) return;

        if (sugestoes.length === 0) {
            this.ocultarSugestoes();
            return;
        }

        const html = sugestoes.map(empresaObj => {
            const [sigla, nome] = Object.entries(empresaObj)[0];
            const primeiroNome = nome.split(' ')[0];

            return `
                <div class="dropdown-option" data-sigla="${sigla}" data-nome="${nome}">
                    <strong>${sigla}</strong> - ${primeiroNome}
                </div>
            `;
        }).join('');

        containerSugestoes.innerHTML = html;
        containerSugestoes.style.display = 'block';

        containerSugestoes.querySelectorAll('.dropdown-option').forEach(item => {
            item.addEventListener('click', () => {
                const sigla = item.dataset.sigla;
                const nome = item.dataset.nome;
                this.selecionarEmpresa(sigla, nome);
            });
        });
    }

    ocultarSugestoes() {
        const containerSugestoes = this.container.querySelector('#empresa-suggestions');
        if (containerSugestoes) {
            containerSugestoes.style.display = 'none';
        }
    }

    tratarTecladoAutocomplete(event) {
        const sugestoes = this.container.querySelectorAll('.dropdown-option');
        if (sugestoes.length === 0) return;

        const sugestaoAtiva = this.container.querySelector('.dropdown-option.active');

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.navegarSugestoes(sugestoes, sugestaoAtiva, 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.navegarSugestoes(sugestoes, sugestaoAtiva, -1);
                break;
            case 'Enter':
                event.preventDefault();
                if (sugestaoAtiva) {
                    const sigla = sugestaoAtiva.dataset.sigla;
                    const nome = sugestaoAtiva.dataset.nome;
                    this.selecionarEmpresa(sigla, nome);
                }
                break;
            case 'Escape':
                this.ocultarSugestoes();
                break;
        }
    }

    navegarSugestoes(sugestoes, atual, direcao) {
        let index = Array.from(sugestoes).indexOf(atual);

        if (index === -1) index = direcao > 0 ? -1 : sugestoes.length;

        index = (index + direcao + sugestoes.length) % sugestoes.length;

        sugestoes.forEach(s => s.classList.remove('active'));
        sugestoes[index].classList.add('active');
    }

    selecionarEmpresa(sigla, nome) {
        const empresaInput = this.container.querySelector('#empresa-input');
        if (empresaInput) {
            empresaInput.value = `${sigla} - ${nome}`;
            empresaInput.dataset.siglaSelecionada = sigla;
            empresaInput.dataset.nomeSelecionado = nome;
        }

        this.ocultarSugestoes();

        this.sincronizarTrocaEmpresa(sigla, empresaInput.dataset.siglaAnterior);

        empresaInput.dataset.siglaAnterior = sigla;
    }

    /**
     * CALCULAR NÚMERO DO CLIENTE FINAL PARA NOVA EMPRESA
     */
    calcularNumeroClienteFinal(sigla, obraId = null) {
        try {
            console.log(`🔢 [EMPRESA] Calculando número para empresa: ${sigla}, obra: ${obraId}`);

            if (!sigla) {
                console.log('❌ [EMPRESA] Sigla não fornecida');
                return 0;
            }

            // 🔥 Buscar obras da empresa específica
            const obrasDaEmpresa = this.obrasExistentes.filter(obra => {
                return obra.empresaSigla === sigla ||
                    obra.empresa_id === sigla;
            });

            console.log(`📊 [EMPRESA] Encontradas ${obrasDaEmpresa.length} obras para ${sigla}`);

            let maiorNumero = 0;
            obrasDaEmpresa.forEach(obra => {
                if (obra.numeroClienteFinal) {
                    const numero = parseInt(obra.numeroClienteFinal);
                    if (!isNaN(numero) && numero > maiorNumero) {
                        maiorNumero = numero;
                    }
                }
            });

            const novoNumero = maiorNumero + 1;

            // 🔥 Atualizar campo no DOM se tiver obraId
            if (obraId) {
                this.atualizarCampoNumeroCliente(obraId, novoNumero);
            }

            return novoNumero;

        } catch (error) {
            console.error('❌ [EMPRESA] Erro ao calcular número do cliente final:', error);
            return 0;
        }
    }

    // 🔥 NOVO MÉTODO PARA ATUALIZAR O CAMPO
    atualizarCampoNumeroCliente(obraId, numero) {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) return;

        const numeroInput = obraElement.querySelector('.numero-cliente-final-cadastro');
        if (numeroInput) {
            numeroInput.readOnly = false;
            numeroInput.removeAttribute('readonly');
            numeroInput.value = numero;
            console.log(`✅ [EMPRESA] Campo número atualizado: ${numero} (editável)`);
        }
    }

    atualizarNumeroClienteVisivel(sigla, numero) {
        const obraElement = this.container.closest('.obra-block');
        if (!obraElement) return;

        const numeroClienteInput = obraElement.querySelector('.numero-cliente-final-readonly');

        if (numeroClienteInput) {
            numeroClienteInput.value = numero;
            numeroClienteInput.setAttribute('data-sigla-empresa', sigla);

            obraElement.dataset.numeroClienteFinal = numero;
            obraElement.dataset.empresaSigla = sigla;
        }
    }

    sincronizarTrocaEmpresa(novaSigla, siglaAnterior = null) {
        try {
            const obraElement = this.container?.closest('.obra-block');
            if (!obraElement) return;

            this.calcularNumeroClienteFinal(novaSigla);

            console.log(`🔄 Empresa alterada de ${siglaAnterior || 'nenhuma'} para ${novaSigla}`);

        } catch (error) {
            console.error('❌ Erro ao sincronizar troca de empresa:', error);
        }
    }

    observarMudancasEmpresa() {
        const empresaInput = this.container?.querySelector('#empresa-input');
        if (!empresaInput) return;

        let valorAnterior = empresaInput.value;

        empresaInput.addEventListener('input', () => {
            const valorAtual = empresaInput.value;

            if (!valorAtual.trim() && valorAnterior.trim()) {
                this.limparDadosEmpresa();
            }

            valorAnterior = valorAtual;
        });

        empresaInput.addEventListener('blur', () => {
            if (!empresaInput.value.trim() && empresaInput.dataset.siglaSelecionada) {
                this.removerEmpresaSelecionada();
            }
        });
    }

    limparDadosEmpresa() {
        const obraElement = this.container?.closest('.obra-block');
        if (!obraElement) return;

        this.resetarNumeroClienteVisivel(obraElement);
        this.limparDadosTemporarios(obraElement);

        const headerSpacer = obraElement.querySelector('.obra-header-spacer span');
        if (headerSpacer) {
            this.resetHeaderObra(headerSpacer);
        }

        this.restaurarTituloOriginal(obraElement);
    }

    removerEmpresaSelecionada() {
        const empresaInput = this.container.querySelector('#empresa-input');
        if (empresaInput) {
            delete empresaInput.dataset.siglaSelecionada;
            delete empresaInput.dataset.nomeSelecionado;
            delete empresaInput.dataset.siglaAnterior;
        }

        this.limparDadosEmpresa();
    }

    inicializarCampoNumeroCliente(obraElement) {
        const numeroClienteInput = obraElement.querySelector('.numero-cliente-final-readonly');

        if (numeroClienteInput) {
            const empresaSigla = obraElement.dataset.empresaSigla;

            if (empresaSigla) {
                this.calcularNumeroClienteFinal(empresaSigla);
            } else {
                numeroClienteInput.value = '';
                numeroClienteInput.placeholder = 'Selecione uma empresa';
            }

            numeroClienteInput.readOnly = false; 
            numeroClienteInput.removeAttribute('readonly');
        }
    }

    atualizarHeaderObra(obraElement, dadosEmpresa) {
        try {
            const headerSpacer = obraElement.querySelector('.obra-header-spacer');
            if (!headerSpacer) {
                console.error('❌ Elemento .obra-header-spacer não encontrado');
                return;
            }

            headerSpacer.innerHTML = '';

            if (dadosEmpresa.empresaSigla && dadosEmpresa.numeroClienteFinal) {
                const span = document.createElement('span');
                span.className = 'empresa-identifier-display';
                const textoHeader = `${dadosEmpresa.empresaSigla}-${dadosEmpresa.numeroClienteFinal}`;
                span.textContent = textoHeader;
                span.setAttribute('data-tooltip', this.criarTooltipEmpresa(dadosEmpresa));

                this.inicializarTooltipJavaScript(span);

                headerSpacer.appendChild(span);

                this.sincronizarTituloObra(obraElement, dadosEmpresa);

                console.log(`✅ Header da obra atualizado: ${textoHeader}`);
            } else {
                this.resetHeaderObra(headerSpacer);
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar header da obra:', error);
        }
    }

    sincronizarTituloObra(obraElement, dadosEmpresa) {
        try {
            const tituloElement = obraElement.querySelector('.obra-title');

            if (!tituloElement) {
                console.warn('⚠️ Elemento .obra-title não encontrado na obra');
                return;
            }

            const identificadorObra = `${dadosEmpresa.empresaSigla}-${dadosEmpresa.numeroClienteFinal}`;

            // APENAS [SIGLA-NUMERO] - conforme solicitado
            tituloElement.textContent = identificadorObra;

            if (tituloElement.hasAttribute('data-editable-content')) {
                tituloElement.setAttribute('data-editable-content', identificadorObra);
            }

            this.dispararEventoTituloAtualizado(obraElement, identificadorObra, identificadorObra);

            console.log(`✅ Título da obra sincronizado: ${identificadorObra}`);

        } catch (error) {
            console.error('❌ Erro ao sincronizar título da obra:', error);
        }
    }

    restaurarTituloOriginal(obraElement) {
        const tituloElement = obraElement.querySelector('.obra-title');
        if (!tituloElement) return;

        tituloElement.textContent = 'Nova Obra';

        if (tituloElement.hasAttribute('data-editable-content')) {
            tituloElement.setAttribute('data-editable-content', 'Nova Obra');
        }
    }

    dispararEventoTituloAtualizado(obraElement, novoTitulo, identificadorObra) {
        const evento = new CustomEvent('obra:titulo-atualizado', {
            bubbles: true,
            detail: {
                obraElement: obraElement,
                tituloCompleto: novoTitulo,
                identificadorObra: identificadorObra,
                timestamp: new Date().toISOString()
            }
        });

        obraElement.dispatchEvent(evento);
    }

    criarTooltipEmpresa(dadosEmpresa) {
        const partes = [];

        if (dadosEmpresa.empresaNome) {
            partes.push(`Empresa: ${dadosEmpresa.empresaNome}`);
        }
        if (dadosEmpresa.clienteFinal) {
            partes.push(`Cliente: ${dadosEmpresa.clienteFinal}`);
        }
        if (dadosEmpresa.codigoCliente) {
            partes.push(`Código: ${dadosEmpresa.codigoCliente}`);
        }
        if (dadosEmpresa.dataCadastro) {
            const dataFormatada = this.formatarDataParaTooltip(dadosEmpresa.dataCadastro);
            partes.push(`Data: ${dataFormatada}`);
        }
        if (dadosEmpresa.orcamentistaResponsavel) {
            partes.push(`Orçamentista: ${dadosEmpresa.orcamentistaResponsavel}`);
        }

        return partes.join('\n');
    }

    formatarDataParaTooltip(dataString) {
        if (!dataString) return '';

        try {
            if (typeof dataString === 'string' && dataString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                return dataString;
            }

            const data = new Date(dataString);

            if (isNaN(data.getTime())) {
                return dataString;
            }

            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();

            return `${dia}/${mes}/${ano}`;

        } catch (error) {
            return dataString;
        }
    }

    resetHeaderObra(headerSpacer) {
        headerSpacer.innerHTML = '';
    }


    prepararDadosObra(dados) {
        const obraBlock = this.container.closest('.obra-block');
        if (obraBlock) {
            obraBlock.dataset.empresaSigla = dados.sigla;
            obraBlock.dataset.empresaNome = dados.nomeEmpresa;
            obraBlock.dataset.numeroClienteFinal = dados.numeroClienteFinal;
            obraBlock.dataset.clienteFinal = dados.clienteFinal;
            obraBlock.dataset.codigoCliente = dados.codigoCliente;

            const dataFormatada = this.formatarData(dados.dataCadastro);
            obraBlock.dataset.dataCadastro = dataFormatada;

            obraBlock.dataset.orcamentistaResponsavel = dados.orcamentistaResponsavel;
            obraBlock.dataset.idGerado = `obra_${dados.sigla}_${dados.numeroClienteFinal}`;
            obraBlock.dataset.identificadorObra = `${dados.sigla}-${dados.numeroClienteFinal}`;

            this.atualizarHeaderObra(obraBlock, {
                empresaSigla: dados.sigla,
                empresaNome: dados.nomeEmpresa,
                numeroClienteFinal: dados.numeroClienteFinal,
                clienteFinal: dados.clienteFinal,
                codigoCliente: dados.codigoCliente,
                dataCadastro: dataFormatada,
                orcamentistaResponsavel: dados.orcamentistaResponsavel
            });
        }
    }

    async prepararDados() {
        const dados = this.coletarDadosFormulario();

        if (!this.validarDados(dados)) {
            return;
        }

        if (!dados.empresaExistente) {
            const sucesso = await this.cadastrarNovaEmpresa(dados.sigla, dados.nomeEmpresa);
            if (!sucesso) return;
        }

        this.prepararDadosObra(dados);

        showSystemStatus('Dados da empresa preparados! Agora salve a obra.', 'success');

        this.ocultarFormulario();
    }

    coletarDadosFormulario() {
        const empresaInput = this.container.querySelector('#empresa-input');
        const siglaSelecionada = empresaInput?.dataset.siglaSelecionada;
        const nomeSelecionado = empresaInput?.dataset.nomeSelecionado;

        return {
            empresaInput: empresaInput?.value || '',
            sigla: siglaSelecionada,
            nomeEmpresa: nomeSelecionado,
            empresaExistente: !!siglaSelecionada,
            numeroClienteFinal: this.container.querySelector('#numero-cliente-final')?.value || '',
            clienteFinal: this.container.querySelector('#cliente-final')?.value || '',
            codigoCliente: this.container.querySelector('#codigo-cliente')?.value || '',
            dataCadastro: this.container.querySelector('#data-cadastro')?.value || '',
            orcamentistaResponsavel: this.container.querySelector('#orcamentista-responsavel')?.value || ''
        };
    }

    validarDados(dados) {
        if (!dados.empresaInput.trim()) {
            showSystemStatus('Por favor, informe a empresa', 'error');
            return false;
        }

        if (!dados.empresaExistente) {
            const regexSigla = /^[A-Z]{2,6}$/;

            if (regexSigla.test(dados.empresaInput)) {
                const nomeCompleto = prompt(`Você digitou apenas a sigla "${dados.empresaInput}". Por favor, informe o nome completo da empresa:`);
                if (!nomeCompleto || !nomeCompleto.trim()) {
                    showSystemStatus('Nome completo da empresa é obrigatório', 'error');
                    return false;
                }

                if (nomeCompleto.trim().length < 3) {
                    showSystemStatus('Nome da empresa deve ter pelo menos 3 caracteres', 'error');
                    return false;
                }

                dados.nomeEmpresa = nomeCompleto.trim();
                dados.sigla = dados.empresaInput.toUpperCase();

            } else {
                const primeiraPalavra = dados.empresaInput.split(' ')[0];
                const siglaSugerida = primeiraPalavra.substring(0, 3).toUpperCase();

                let siglaConfirmada = prompt(`Empresa não encontrada. Sugerimos a sigla "${siglaSugerida}". Confirme ou digite outra sigla (2-6 letras maiúsculas):`, siglaSugerida);

                if (!siglaConfirmada) {
                    showSystemStatus('Sigla é obrigatória', 'error');
                    return false;
                }

                siglaConfirmada = siglaConfirmada.trim().toUpperCase().replace(/[^A-Z]/g, '');

                if (!regexSigla.test(siglaConfirmada)) {
                    showSystemStatus('Sigla deve conter 2 a 6 letras maiúsculas, sem espaços ou caracteres especiais', 'error');
                    return false;
                }

                dados.sigla = siglaConfirmada;
                dados.nomeEmpresa = dados.empresaInput;
            }
        }

        return true;
    }

    async cadastrarNovaEmpresa(sigla, nome) {
        try {
            const siglaExistente = this.empresas.find(empresaObj => {
                const [siglaExistente] = Object.keys(empresaObj);
                return siglaExistente === sigla;
            });

            if (siglaExistente) {
                showSystemStatus(`Sigla ${sigla} já está em uso. Escolha outra sigla.`, 'error');
                return false;
            }

            const novaEmpresa = { [sigla]: nome };
            this.empresas.push(novaEmpresa);

            const response = await fetch('/api/dados/empresas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaEmpresa)
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar empresa');
            }

            showSystemStatus(`Empresa ${sigla} - ${nome} cadastrada com sucesso!`, 'success');
            return true;

        } catch (error) {
            console.error('❌ Erro ao cadastrar nova empresa:', error);
            showSystemStatus('Erro ao cadastrar empresa', 'error');
            return false;
        }
    }

    /**
     * 🔥 CORREÇÃO COMPLETA: CANCELAR CADASTRO
     */
    cancelarCadastro() {
        try {
            const obraBlock = this.container?.closest('.obra-block');

            if (obraBlock) {
                // 🔥 1. PRIMEIRO: Limpar campos readonly usando setAttribute
                const camposReadonly = obraBlock.querySelectorAll('input[readonly], input:disabled');
                camposReadonly.forEach(campo => {
                    campo.setAttribute('value', '');
                    campo.value = '';

                    // Restaurar placeholder específico
                    if (campo.classList.contains('numero-cliente-final-readonly')) {
                        campo.setAttribute('placeholder', 'Número do cliente');
                    }
                });

                // 🔥 2. SEGUNDO: Limpar campos editáveis
                const camposEditaveis = obraBlock.querySelectorAll('input:not([readonly]):not(:disabled)');
                camposEditaveis.forEach(campo => {
                    campo.value = '';

                    // Restaurar placeholders específicos
                    if (campo.classList.contains('empresa-input-cadastro') ||
                        campo.classList.contains('empresa-input')) {
                        campo.placeholder = 'Digite sigla ou nome...';
                    }
                });

                // 🔥 3. REMOVER VALOR HARDCODED do HTML (se existir)
                const empresaInputs = obraBlock.querySelectorAll('.empresa-input-cadastro, .empresa-input');
                empresaInputs.forEach(input => {
                    // Remove atributo value completamente
                    input.removeAttribute('value');
                    // Limpa data attributes do autocomplete
                    delete input.dataset.siglaSelecionada;
                    delete input.dataset.nomeSelecionado;
                });

                // 🔥 4. Limpar dados da obra
                this.limparDadosTemporarios(obraBlock);

                const tinhaDadosEmpresa = obraBlock.dataset.empresaSigla;

                if (tinhaDadosEmpresa) {
                    this.restaurarTituloOriginal(obraBlock);
                }
            }

            // 🔥 5. Ocultar formulário e mostrar botão
            this.ocultarFormulario();
            this.mostrarSpanOriginal();

            if (this.container) {
                const spanOriginal = this.container.querySelector('span');
                if (spanOriginal) {
                    spanOriginal.textContent = '+ Cadastrar Empresa';
                }
            }

            console.log('✅ Cadastro cancelado - todos os campos limpos');

        } catch (error) {
            console.error('❌ Erro ao cancelar cadastro:', error);
        }
    }

    // 🔥 NOVA FUNÇÃO: Resetar todos os campos da empresa
    resetarTodosCamposEmpresa(obraElement) {
        // Lista de todos os campos de empresa possíveis
        const camposEmpresa = [
            '.empresa-input-cadastro',
            '.empresa-input',
            '.numero-cliente-final-cadastro',
            '.numero-cliente-final-readonly',
            '.cliente-final-cadastro',
            '.cliente-final-input',
            '.codigo-cliente-cadastro',
            '.codigo-cliente-input',
            '.data-cadastro-cadastro',
            '.data-cadastro-input',
            '.orcamentista-responsavel-cadastro',
            '.orcamentista-responsavel-input'
        ];

        camposEmpresa.forEach(selector => {
            const campo = obraElement.querySelector(selector);
            if (campo) {
                // 🔥 CORREÇÃO: Para campos readonly, usar setAttribute
                if (campo.readOnly || campo.disabled) {
                    campo.setAttribute('value', '');
                    campo.value = '';

                    // Restaurar placeholder se existir
                    if (campo.classList.contains('numero-cliente-final-readonly')) {
                        campo.setAttribute('placeholder', 'Número do cliente');
                    }
                } else {
                    campo.value = '';
                }

                // Limpar data attributes específicos
                if (campo.dataset.siglaSelecionada) {
                    delete campo.dataset.siglaSelecionada;
                }
                if (campo.dataset.nomeSelecionado) {
                    delete campo.dataset.nomeSelecionado;
                }

                console.log(`🔄 Campo ${selector} limpo`);
            }
        });

        // Resetar campo específico de número do cliente
        this.resetarNumeroClienteVisivel(obraElement);
    }

    // 🔥 ATUALIZAR: resetarNumeroClienteVisivel
    resetarNumeroClienteVisivel(obraElement) {
        const numeroClienteInput = obraElement.querySelector('.numero-cliente-final-readonly');

        if (numeroClienteInput) {
            // 🔥 CORREÇÃO: Para readonly, usar setAttribute
            numeroClienteInput.setAttribute('value', '');
            numeroClienteInput.value = '';
            numeroClienteInput.setAttribute('placeholder', 'Número do cliente');
            console.log('🔄 Número do cliente resetado (readonly)');
        }

        const formNumeroInput = this.container?.querySelector('#numero-cliente-final');
        if (formNumeroInput) {
            formNumeroInput.value = '';
            formNumeroInput.placeholder = 'Será calculado automaticamente';
        }
    }

    limparDadosTemporarios(obraElement) {
        const camposParaLimpar = [
            'empresaSigla',
            'empresaNome',
            'numeroClienteFinal',
            'identificadorObra',
            'clienteFinal',
            'codigoCliente',
            'dataCadastro',
            'orcamentistaResponsavel',
            'idGerado'
        ];

        camposParaLimpar.forEach(campo => {
            delete obraElement.dataset[campo];
        });
    }

    ocultarFormulario() {
        const form = this.container.querySelector('#empresa-cadastro-inline');
        if (form) {
            form.remove();
        }
        this.isActive = false;
    }

    mostrarSpanOriginal() {
        const span = this.container.querySelector('span');
        if (span) {
            span.style.display = 'inline';
        }
    }

    obterDadosPreparados(obraId) {
        const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraBlock) return null;

        return {
            empresaSigla: obraBlock.dataset.empresaSigla,
            empresaNome: obraBlock.dataset.empresaNome,
            numeroClienteFinal: obraBlock.dataset.numeroClienteFinal ? parseInt(obraBlock.dataset.numeroClienteFinal) : null,
            clienteFinal: obraBlock.dataset.clienteFinal,
            codigoCliente: obraBlock.dataset.codigoCliente,
            dataCadastro: obraBlock.dataset.dataCadastro,
            orcamentistaResponsavel: obraBlock.dataset.orcamentistaResponsavel,
            idGerado: obraBlock.dataset.idGerado
        };
    }

    formatarData(dataString) {
        if (!dataString) return '';

        try {
            if (typeof dataString === 'string' && dataString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                return dataString;
            }

            const data = new Date(dataString);

            if (isNaN(data.getTime())) {
                return dataString;
            }

            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();

            return `${dia}/${mes}/${ano}`;

        } catch (error) {
            return dataString;
        }
    }

    inicializarTooltipJavaScript(element) {
        const isMobile = window.innerWidth <= 768;
        let autoCloseTimer = null;

        element.style.position = 'relative';
        element.style.overflow = 'visible';
        element.style.zIndex = '100';

        const tooltip = document.createElement('div');
        tooltip.className = 'empresa-tooltip';

        if (isMobile) {
            tooltip.classList.add('empresa-tooltip-mobile');

            const closeButton = document.createElement('button');
            closeButton.className = 'empresa-tooltip-close';
            closeButton.innerHTML = '×';
            closeButton.setAttribute('aria-label', 'Fechar tooltip');
            tooltip.appendChild(closeButton);

            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                esconderTooltip();
            });
        }

        document.body.appendChild(tooltip);

        const iniciarAutoCloseTimer = () => {
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
            }
            autoCloseTimer = setTimeout(() => {
                esconderTooltip();
            }, 5000);
        };

        const cancelarAutoCloseTimer = () => {
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
                autoCloseTimer = null;
            }
        };

        const atualizarPosicaoTooltip = () => {
            const rect = element.getBoundingClientRect();
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const isMobileNow = window.innerWidth <= 768;

            if (isMobileNow) {
                tooltip.style.position = 'fixed';
                tooltip.style.left = '50%';
                tooltip.style.top = '50%';
                tooltip.style.transform = 'translate(-50%, -50%)';
                tooltip.style.bottom = 'auto';
                tooltip.style.right = 'auto';
                tooltip.style.width = '90vw';
                tooltip.style.maxWidth = '320px';
                tooltip.style.maxHeight = '70vh';
                tooltip.style.overflowY = 'auto';
                tooltip.style.zIndex = '100000';
            } else {
                tooltip.style.position = 'fixed';
                tooltip.style.left = (rect.left + scrollX + (rect.width / 2)) + 'px';
                tooltip.style.bottom = (window.innerHeight - rect.top - scrollY + 8) + 'px';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.width = 'auto';
                tooltip.style.maxWidth = '380px';
                tooltip.style.maxHeight = 'none';
            }
        };

        const mostrarTooltip = () => {
            const tooltipText = element.getAttribute('data-tooltip');
            if (tooltipText) {
                const closeBtn = tooltip.querySelector('.empresa-tooltip-close');
                tooltip.innerHTML = tooltipText;
                if (closeBtn && isMobile) {
                    tooltip.appendChild(closeBtn);
                }

                tooltip.classList.add('show');
                atualizarPosicaoTooltip();

                if (isMobile) {
                    iniciarAutoCloseTimer();
                }
            }
        };

        const esconderTooltip = () => {
            tooltip.classList.remove('show');
            cancelarAutoCloseTimer();
        };

        if (isMobile) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (tooltip.classList.contains('show')) {
                    esconderTooltip();
                } else {
                    mostrarTooltip();
                }
            });

            document.addEventListener('click', (e) => {
                if (!element.contains(e.target) && !tooltip.contains(e.target)) {
                    esconderTooltip();
                }
            });

            window.addEventListener('scroll', esconderTooltip);
            window.addEventListener('orientationchange', esconderTooltip);

        } else {
            element.addEventListener('mouseenter', mostrarTooltip);
            element.addEventListener('mouseleave', esconderTooltip);
        }

        if (isMobile) {
            tooltip.addEventListener('touchstart', () => {
                cancelarAutoCloseTimer();
                iniciarAutoCloseTimer();
            });

            tooltip.addEventListener('click', () => {
                cancelarAutoCloseTimer();
                iniciarAutoCloseTimer();
            });
        }

        window.addEventListener('scroll', () => {
            if (tooltip.classList.contains('show')) {
                atualizarPosicaoTooltip();
            }
        });

        window.addEventListener('resize', () => {
            if (tooltip.classList.contains('show')) {
                atualizarPosicaoTooltip();
            }

            const novaCondicaoMobile = window.innerWidth <= 768;
            if (isMobile !== novaCondicaoMobile) {
                esconderTooltip();
                tooltip.remove();
                this.inicializarTooltipJavaScript(element);
            }
        });

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.removedNodes.length > 0) {
                    const removed = Array.from(mutation.removedNodes);
                    if (removed.includes(element) || element.parentNode === null) {
                        tooltip.remove();
                        cancelarAutoCloseTimer();
                        window.removeEventListener('scroll', atualizarPosicaoTooltip);
                        window.removeEventListener('resize', atualizarPosicaoTooltip);
                        document.removeEventListener('click', esconderTooltip);
                        window.removeEventListener('orientationchange', esconderTooltip);
                        observer.disconnect();
                    }
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}

/* ==== SEÇÃO 3: FUNÇÕES GLOBAIS (ex-obra-adapter.js) ==== */

/**
 * 🆕 FUNÇÃO GLOBAL PARA EDITAR DADOS DA EMPRESA
 */
window.editarDadosEmpresa = function (button, obraId = null) {
    try {
        const visualizacao = button.closest('.empresa-dados-visualizacao');
        let obraBlock;

        if (obraId) {
            // Se recebeu obraId, buscar por ID
            obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
        } else {
            // Buscar pelo DOM
            obraBlock = visualizacao.closest('.obra-block');
        }

        if (!obraBlock) {
            console.error('❌ [EMPRESA] Obra não encontrada para edição');
            return;
        }

        // Remover visualização se existir
        if (visualizacao) {
            visualizacao.remove();
        }

        // Mostrar span original para ativar cadastro
        const spanOriginal = obraBlock.querySelector('.projetc-header-record.very-dark span');
        if (spanOriginal) {
            spanOriginal.style.display = 'inline';

            // Simular clique para ativar cadastro
            if (window.empresaCadastro && typeof window.empresaCadastro.ativarCadastro === 'function') {
                const event = new Event('click');
                spanOriginal.dispatchEvent(event);
            } else {
                spanOriginal.click();
            }
        }

    } catch (error) {
        console.error('❌ [EMPRESA] Erro ao editar dados da empresa:', error);
    }
};

/**
 * 🆕 ATUALIZAR DADOS DA EMPRESA EM TEMPO REAL
 */
window.atualizarDadosEmpresa = function (input, campo, obraId) {
    try {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            console.error(`❌ [EMPRESA] Obra ${obraId} não encontrada`);
            return;
        }

        // Atualizar data attribute
        obraElement.dataset[campo] = input.value;

        console.log(`📝 [EMPRESA] Campo ${campo} atualizado para:`, input.value);

        // Se for cliente final ou orçamentista, atualizar tooltip do header
        if (campo === 'clienteFinal' || campo === 'orcamentistaResponsavel') {
            if (window.empresaCadastro && typeof window.empresaCadastro.atualizarHeaderObra === 'function') {
                const dadosAtuais = obterDadosEmpresaDaObra(obraId);
                if (dadosAtuais) {
                    window.empresaCadastro.atualizarHeaderObra(obraElement, dadosAtuais);
                }
            }
        }

    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao atualizar campo ${campo}:`, error);
    }
};

/**
 * 🆕 FUNÇÃO GLOBAL PARA ATIVAR CADASTRO DE EMPRESA - CORRIGIDA
 */
window.ativarCadastroEmpresa = function (obraId) {
    try {
        console.log(`🎯 [EMPRESA] Ativando cadastro para obra: ${obraId}`);

        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            console.error(`❌ [EMPRESA] Obra ${obraId} não encontrada`);
            return;
        }

        // Encontrar container de empresa
        const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');
        if (!empresaContainer) {
            console.error(`❌ [EMPRESA] Container de empresa não encontrado`);
            return;
        }

        // ✅ CORREÇÃO: Verificar se já existe formulário ativo
        const formularioExistente = empresaContainer.querySelector('.empresa-formulario-ativo');
        if (formularioExistente) {
            console.log(`✅ [EMPRESA] Formulário já está ativo para obra ${obraId}`);
            return; // ✅ IMPEDE EXECUÇÃO DUPLICADA
        }

        // Ocultar botão
        const botao = empresaContainer.querySelector('.btn-empresa-cadastro');
        if (botao) {
            botao.style.display = 'none';
        }

        // Verificar se há dados de empresa existentes
        const dadosEmpresa = obterDadosEmpresaDaObra(obraId);

        if (dadosEmpresa) {
            // Se já tem dados, criar formulário com dados existentes
            console.log(`📊 [EMPRESA] Criando formulário com dados existentes para obra ${obraId}`);
            // Função será importada de empresa-form-manager.js
            if (typeof criarVisualizacaoEmpresa === 'function') {
                criarVisualizacaoEmpresa({ ...dadosEmpresa, id: obraId }, empresaContainer);
            }
        } else {
            // Se não tem dados, criar formulário vazio para cadastro
            console.log(`🆕 [EMPRESA] Criando novo formulário para obra ${obraId}`);
            // Função será importada de empresa-form-manager.js
            if (typeof criarFormularioVazioEmpresa === 'function') {
                criarFormularioVazioEmpresa(obraId, empresaContainer);
            }
        }

    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao ativar cadastro para obra ${obraId}:`, error);
    }
};

/**
 * 🆕 OBTÉM DADOS DE EMPRESA DE UMA OBRA ESPECÍFICA
 */
function obterDadosEmpresaDaObra(obraId) {
    try {
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        if (!obraElement) {
            console.error(`❌ [EMPRESA] Obra com ID ${obraId} não encontrada`);
            return null;
        }

        const camposEmpresa = [
            'empresaSigla', 'empresaNome', 'numeroClienteFinal',
            'clienteFinal', 'codigoCliente', 'dataCadastro',
            'orcamentistaResponsavel', 'idGerado', 'empresa_id'
        ];

        const dadosEmpresa = {};
        let temDados = false;

        camposEmpresa.forEach(campo => {
            if (obraElement.dataset[campo]) {
                dadosEmpresa[campo] = obraElement.dataset[campo];
                temDados = true;
            }
        });

        if (temDados) {
            console.log(`✅ [EMPRESA] Dados recuperados para obra ${obraId}:`, dadosEmpresa);
        } else {
            console.log(`📭 [EMPRESA] Nenhum dado de empresa encontrado para obra ${obraId}`);
        }

        return temDados ? dadosEmpresa : null;

    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao obter dados de empresa:`, error);
        return null;
    }
}


/**
 * Atualizar texto do botão de cadastro de empresa
 */
function atualizarTextoBotaoEmpresa(obraId, texto = "Visualizar campos de cadastro de empresas") {
    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraElement) return false;

    const botao = obraElement.querySelector('.btn-empresa-cadastro');
    if (botao) {
        botao.textContent = texto;
        return true;
    }

    return false;
}

/**
 * FUNÇÃO PARA ATUALIZAR TODOS OS BOTÕES DE EMPRESA (para obras existentes)
 */
function atualizarTodosBotoesEmpresa() {
    const botoes = document.querySelectorAll('.btn-empresa-cadastro');
    let atualizados = 0;

    botoes.forEach(botao => {
        const textoAtual = botao.textContent.trim();
        if (textoAtual === "Adicionar campos de cadastro de empresas") {
            botao.textContent = "Visualizar campos de cadastro de empresas";
            atualizados++;
        }
    });

    return atualizados;
}


/* ==== SEÇÃO 4: INICIALIZAÇÃO DO SISTEMA ==== */

/**
 * INICIALIZAR SISTEMA DE EMPRESA
 */
function inicializarSistemaEmpresa() {
    console.log('🏢 [EMPRESA] Inicializando sistema de empresa...');

    try {
        // Criar instância global da classe
        window.empresaCadastro = new EmpresaCadastroInline();

        // Configurar evento de DOMContentLoaded se necessário
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('✅ [EMPRESA] Sistema de empresa inicializado após DOM carregado');
            });
        } else {
            console.log('✅ [EMPRESA] Sistema de empresa inicializado');
        }

        return true;
    } catch (error) {
        console.error('❌ [EMPRESA] Erro ao inicializar sistema:', error);
        return false;
    }
}

export {
    carregarEmpresasComCache,
    limparCacheEmpresas,
    obterDadosEmpresaDaObra,
    atualizarTextoBotaoEmpresa,
    atualizarTodosBotoesEmpresa,
    inicializarSistemaEmpresa,

}

// Compatibilidade global
if (typeof window !== 'undefined') {
    window.carregarEmpresasComCache = carregarEmpresasComCache;
    window.limparCacheEmpresas = limparCacheEmpresas;
    window.obterDadosEmpresaDaObra = obterDadosEmpresaDaObra;
    window.atualizarTextoBotaoEmpresa = atualizarTextoBotaoEmpresa;
    window.atualizarTodosBotoesEmpresa = atualizarTodosBotoesEmpresa;
    window.inicializarSistemaEmpresa = inicializarSistemaEmpresa
}