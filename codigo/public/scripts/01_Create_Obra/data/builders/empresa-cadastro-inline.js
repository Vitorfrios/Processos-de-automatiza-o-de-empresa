/**
 * features/empresa-cadastro-inline.js
 * Sistema de cadastro inline de empresas para Página 1
 * Integração com dados.json (empresas) e backup.json (obras)
 */

import { showSystemStatus } from '../../ui/components/status.js';
import { extractNumberFromText } from '../../data/utils/data-utils.js';

class EmpresaCadastroInline {
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

        console.log('✅ Cadastro inline ativado');
    }

    renderizarFormulario() {
        const formHTML = this.criarHTMLFormulario();
        this.container.insertAdjacentHTML('beforeend', formHTML);
        
        // Vincular eventos do formulário
        this.vincularEventosFormulario();
        
        // Focar no primeiro campo
        setTimeout(() => {
            const empresaInput = this.container.querySelector('#empresa-input');
            if (empresaInput) empresaInput.focus();
        }, 100);
    }

    criarHTMLFormulario() {
        return `
        <div class="empresa-cadastro-inline" id="empresa-cadastro-inline">
            <div class="empresa-form-grid">
                <!-- Empresa -->
                <div class="form-group">
                    <label for="empresa-input">Empresa *</label>
                    <input type="text" 
                           id="empresa-input" 
                           class="empresa-input" 
                           placeholder="Digite sigla ou nome..."
                           autocomplete="off">
                    <div class="autocomplete-suggestions" id="empresa-suggestions"></div>
                </div>

                <!-- Número Cliente Final -->
                <div class="form-group">
                    <label for="numero-cliente-final">Número Cliente Final</label>
                    <input type="text" 
                           id="numero-cliente-final" 
                           class="numero-cliente-final" 
                           readonly
                           placeholder="Será calculado automaticamente">
                </div>

                <!-- Cliente Final -->
                <div class="form-group">
                    <label for="cliente-final">Cliente Final</label>
                    <input type="text" 
                           id="cliente-final" 
                           class="cliente-final" 
                           placeholder="Nome do cliente final">
                </div>

                <!-- Código Cliente -->
                <div class="form-group">
                    <label for="codigo-cliente">Código Cliente</label>
                    <input type="text" 
                           id="codigo-cliente" 
                           class="codigo-cliente" 
                           placeholder="Código interno do cliente">
                </div>

                <!-- Data do Cadastro -->
                <div class="form-group">
                    <label for="data-cadastro">Data do Cadastro</label>
                    <input type="text" 
                           id="data-cadastro" 
                           class="data-cadastro" 
                           readonly
                           value="${new Date().toLocaleString('pt-BR')}">
                </div>

                <!-- Orçamentista Responsável -->
                <div class="form-group">
                    <label for="orcamentista-responsavel">Orçamentista Responsável</label>
                    <input type="text" 
                           id="orcamentista-responsavel" 
                           class="orcamentista-responsavel" 
                           placeholder="Nome do orçamentista">
                </div>
            </div>

            <div class="empresa-form-actions">
                <button type="button" class="btn btn-cancel" onclick="window.empresaCadastro.cancelarCadastro()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-confirm" onclick="window.empresaCadastro.prepararDados()">
                    Confirmar Dados
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

        // Vincular eventos de clique nas sugestões
        containerSugestoes.querySelectorAll('.suggestion-item').forEach(item => {
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
        const sugestoes = this.container.querySelectorAll('.suggestion-item');
        if (sugestoes.length === 0) return;

        const sugestaoAtiva = this.container.querySelector('.suggestion-item.active');
        
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
        this.calcularNumeroClienteFinal(sigla);
    }

    calcularNumeroClienteFinal(sigla) {
        // Filtrar obras existentes pela sigla
        const obrasDaEmpresa = this.obrasExistentes.filter(obra => {
            return obra.empresaSigla === sigla || 
                   (obra.idGerado && obra.idGerado.startsWith(`obra_${sigla}_`));
        });

        // Encontrar maior número existente
        let maiorNumero = 0;
        obrasDaEmpresa.forEach(obra => {
            if (obra.numeroClienteFinal && obra.numeroClienteFinal > maiorNumero) {
                maiorNumero = obra.numeroClienteFinal;
            }
            
            // Também tentar extrair do ID gerado
            if (obra.idGerado) {
                const match = obra.idGerado.match(new RegExp(`obra_${sigla}_(\\d+)`));
                if (match) {
                    const numero = parseInt(match[1]);
                    if (numero > maiorNumero) maiorNumero = numero;
                }
            }
        });

        const novoNumero = maiorNumero + 1;
        
        const numeroInput = this.container.querySelector('#numero-cliente-final');
        if (numeroInput) {
            numeroInput.value = novoNumero;
        }

        // Atualizar preview do ID da obra
        this.atualizarPreviewIdObra(sigla, novoNumero);
    }

    atualizarPreviewIdObra(sigla, numero) {
        const idObraValue = this.container.querySelector('#obra-id-value');
        
        if (idObraContainer && idObraValue) {
            const idObra = `obra_${sigla}_${numero}`;
            idObraValue.textContent = idObra;
            idObraContainer.style.display = 'block';
        }
    }

    async prepararDados() {
        const dados = this.coletarDadosFormulario();
        
        if (!this.validarDados(dados)) {
            return;
        }

        // Verificar se precisa cadastrar nova empresa
        if (!dados.empresaExistente) {
            const sucesso = await this.cadastrarNovaEmpresa(dados.sigla, dados.nomeEmpresa);
            if (!sucesso) return;
        }

        // Preparar dados para a obra
        this.prepararDadosObra(dados);
        
        showSystemStatus('Dados da empresa preparados! Agora salve a obra.', 'success');
        
        // Ocultar formulário mas manter dados preparados
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
            // Validar formato da sigla para nova empresa
            const siglaMatch = dados.empresaInput.match(/^[A-Za-z]{3}$/);
            if (siglaMatch) {
                // Usuário digitou apenas sigla - solicitar nome completo
                const nomeCompleto = prompt(`Você digitou apenas a sigla "${dados.empresaInput}". Por favor, informe o nome completo da empresa:`);
                if (!nomeCompleto || !nomeCompleto.trim()) {
                    showSystemStatus('Nome completo da empresa é obrigatório', 'error');
                    return false;
                }
                dados.nomeEmpresa = nomeCompleto.trim();
                dados.sigla = dados.empresaInput.toUpperCase();
            } else {
                // Usuário digitou nome - sugerir sigla
                const primeiraPalavra = dados.empresaInput.split(' ')[0];
                const siglaSugerida = primeiraPalavra.substring(0, 3).toUpperCase();
                
                const siglaConfirmada = prompt(`Empresa não encontrada. Sugerimos a sigla "${siglaSugerida}". Confirme ou digite outra sigla de 3 letras:`, siglaSugerida);
                
                if (!siglaConfirmada || siglaConfirmada.length !== 3) {
                    showSystemStatus('Sigla deve ter exatamente 3 letras', 'error');
                    return false;
                }
                
                dados.sigla = siglaConfirmada.toUpperCase();
                dados.nomeEmpresa = dados.empresaInput;
            }
        }

        return true;
    }

    async cadastrarNovaEmpresa(sigla, nome) {
        try {
            // Verificar se sigla já existe
            const siglaExistente = this.empresas.find(empresaObj => {
                const [siglaExistente] = Object.keys(empresaObj);
                return siglaExistente === sigla;
            });

            if (siglaExistente) {
                showSystemStatus(`Sigla ${sigla} já está em uso. Escolha outra sigla.`, 'error');
                return false;
            }

            // Adicionar nova empresa
            const novaEmpresa = { [sigla]: nome };
            this.empresas.push(novaEmpresa);

            // Salvar no dados.json
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
     * Atualiza o header da obra com a sigla e numeração
     * @param {HTMLElement} obraElement - Elemento da obra
     * @param {Object} dadosEmpresa - Dados da empresa
     */

    atualizarHeaderObra(obraElement, dadosEmpresa) {
        try {
            const headerSpacer = obraElement.querySelector('.obra-header-spacer');
            if (!headerSpacer) {
                console.error('❌ Elemento .obra-header-spacer não encontrado');
                return;
            }

            // Limpar conteúdo atual
            headerSpacer.innerHTML = '';

            if (dadosEmpresa.empresaSigla && dadosEmpresa.numeroClienteFinal) {
                // 🆕 CRIAR SPAN COM IDENTIFICADOR DA EMPRESA (não botão)
                const span = document.createElement('span');
                span.className = 'empresa-identifier-display';
                const textoHeader = `${dadosEmpresa.empresaSigla}-${dadosEmpresa.numeroClienteFinal}`;
                span.textContent = textoHeader;
                span.setAttribute('data-tooltip', this.criarTooltipEmpresa(dadosEmpresa));
                
                // 🆕 ADICIONAR SISTEMA DE TOOLTIP VIA JAVASCRIPT
                this.inicializarTooltipJavaScript(span);
                
                headerSpacer.appendChild(span);
                console.log(`✅ Header da obra atualizado para SPAN: ${textoHeader}`);
            } else {
                // Botão padrão para cadastro
                this.resetHeaderObra(headerSpacer);
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar header da obra:', error);
        }
    }

    /**
     * 🆕 INICIALIZAR TOOLTIP - VERSÃO QUE FUNCIONA
     */
    inicializarTooltipJavaScript(element) {
        console.log('🔧 Inicializando tooltip para:', element);
        
        // FORÇAR posição relativa
        element.style.position = 'relative';
        element.style.overflow = 'visible';
        
        // Criar tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'empresa-tooltip';
        
        // Adicionar ao span
        element.appendChild(tooltip);
        
        // Event listeners simples
        element.addEventListener('mouseenter', function(e) {
            console.log('🐭 Mouse ENTER no span');
            const tooltipText = this.getAttribute('data-tooltip');
            if (tooltipText) {
                tooltip.textContent = tooltipText;
                tooltip.classList.add('show');
                console.log('🔦 Tooltip mostrado:', tooltipText);
            }
        });

        element.addEventListener('mouseleave', function() {
            console.log('🐭 Mouse LEAVE no span');
            tooltip.classList.remove('show');
        });
        
        console.log('✅ Tooltip inicializado');
    }



    /**
     * Cria texto de tooltip com informações completas da empresa
     * @param {Object} dadosEmpresa - Dados da empresa
     * @returns {string} Texto do tooltip
     */
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
            // 🆕 FORMATAR DATA PARA dd/mm/aaaa
            const dataFormatada = this.formatarDataParaTooltip(dadosEmpresa.dataCadastro);
            partes.push(`Data: ${dataFormatada}`);
        }
        if (dadosEmpresa.orcamentistaResponsavel) {
            partes.push(`Orçamentista: ${dadosEmpresa.orcamentistaResponsavel}`);
        }
        
        return partes.join('\n');
    }

    /**
     * Formata data para o formato dd/mm/aaaa no tooltip
     * @param {string} dataString - Data em qualquer formato
     * @returns {string} Data formatada como dd/mm/aaaa
     */
    formatarDataParaTooltip(dataString) {
        if (!dataString) return '';
        
        try {
            // Se já estiver no formato dd/mm/aaaa, retornar como está
            if (typeof dataString === 'string' && dataString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                return dataString;
            }
            
            // Tentar converter para Date
            const data = new Date(dataString);
            
            if (isNaN(data.getTime())) {
                console.warn(`⚠️ Data inválida no tooltip: ${dataString}`);
                return dataString;
            }
            
            // Formatar para dd/mm/aaaa
            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();
            
            return `${dia}/${mes}/${ano}`;
            
        } catch (error) {
            console.error(`❌ Erro ao formatar data para tooltip ${dataString}:`, error);
            return dataString;
        }
    }

    /**
     * Reseta o header para o estado original
     * @param {HTMLElement} headerSpacer - Elemento do header
     */
    resetHeaderObra(headerSpacer) {
        const button = document.createElement('button');
        button.className = 'btn-empresa-cadastro';
        button.textContent = 'Adicionar campos de cadastro de empresas';
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const obraBlock = headerSpacer.closest('.obra-block');
            if (obraBlock && obraBlock.dataset.obraId) {
                window.ativarCadastroEmpresa(obraBlock.dataset.obraId);
            }
        };
        
        headerSpacer.innerHTML = '';
        headerSpacer.appendChild(button);
    }

    /**
     * Prepara dados da obra e atualiza o header
     * @param {Object} dados - Dados coletados do formulário
     */
    prepararDadosObra(dados) {
        // Armazenar dados no container da obra para uso posterior
        const obraBlock = this.container.closest('.obra-block');
        if (obraBlock) {
            obraBlock.dataset.empresaSigla = dados.sigla;
            obraBlock.dataset.empresaNome = dados.nomeEmpresa;
            obraBlock.dataset.numeroClienteFinal = dados.numeroClienteFinal;
            obraBlock.dataset.clienteFinal = dados.clienteFinal;
            obraBlock.dataset.codigoCliente = dados.codigoCliente;
            
            // 🆕 USAR DATA FORMATADA
            const dataFormatada = this.formatarData(dados.dataCadastro);
            obraBlock.dataset.dataCadastro = dataFormatada;
            
            obraBlock.dataset.orcamentistaResponsavel = dados.orcamentistaResponsavel;
            obraBlock.dataset.idGerado = `obra_${dados.sigla}_${dados.numeroClienteFinal}`;
            
            // 🆕 ATUALIZAR HEADER DA OBRA
            this.atualizarHeaderObra(obraBlock, {
                empresaSigla: dados.sigla,
                empresaNome: dados.nomeEmpresa,
                numeroClienteFinal: dados.numeroClienteFinal,
                clienteFinal: dados.clienteFinal,
                codigoCliente: dados.codigoCliente,
                dataCadastro: dataFormatada, // 🆕 DATA FORMATADA
                orcamentistaResponsavel: dados.orcamentistaResponsavel
            });
            
            console.log('📦 Dados da obra preparados:', obraBlock.dataset);
        }
    }

    cancelarCadastro() {
        this.ocultarFormulario();
        this.mostrarSpanOriginal();
        
        // 🆕 RESETAR HEADER SE NÃO HOUVER DADOS DE EMPRESA
        const obraBlock = this.container.closest('.obra-block');
        if (obraBlock) {
            const headerSpacer = obraBlock.querySelector('.obra-header-spacer span');
            if (headerSpacer && !obraBlock.dataset.empresaSigla) {
                this.resetHeaderObra(headerSpacer);
            }
        }
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

    // Método para obter dados preparados (usado pelo sistema de salvamento)
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
    /**
     * Formata data para dd/mm/aaaa
     */
    formatarData(dataString) {
        if (!dataString) return '';
        
        try {
            // Se já estiver no formato dd/mm/aaaa, retornar como está
            if (typeof dataString === 'string' && dataString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                return dataString;
            }
            
            const data = new Date(dataString);
            
            if (isNaN(data.getTime())) {
                console.warn(`⚠️ Data inválida: ${dataString}`);
                return dataString;
            }
            
            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();
            
            return `${dia}/${mes}/${ano}`;
            
        } catch (error) {
            console.error(`❌ Erro ao formatar data ${dataString}:`, error);
            return dataString;
        }
    }
}

// Exportação e inicialização
export default EmpresaCadastroInline;

if (typeof window !== 'undefined') {
    window.EmpresaCadastroInline = EmpresaCadastroInline;
    
    // Inicializar quando DOM estiver pronto
    document.addEventListener('DOMContentLoaded', () => {
        window.empresaCadastro = new EmpresaCadastroInline();
    });
}


