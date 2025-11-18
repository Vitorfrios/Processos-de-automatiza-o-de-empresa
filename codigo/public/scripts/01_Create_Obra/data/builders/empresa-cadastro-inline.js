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

    /**
     * 🆕 RENDERIZAR FORMULÁRIO COM CAMPOS CORRETAMENTE LIBERADOS/BLOQUEADOS
     */
    renderizarFormulario() {
        const formHTML = this.criarHTMLFormulario();
        this.container.insertAdjacentHTML('beforeend', formHTML);
        
        // 🆕 CONFIGURAR ESTADO DOS CAMPOS APÓS RENDERIZAÇÃO
        this.configurarEstadoCampos();
        
        // Vincular eventos do formulário
        this.vincularEventosFormulario();
        
        // Focar no primeiro campo
        setTimeout(() => {
            const empresaInput = this.container.querySelector('#empresa-input');
            if (empresaInput) empresaInput.focus();
        }, 100);
    }

    /**
     * 🆕 CONFIGURAR ESTADO CORRETO DOS CAMPOS - LIBERADOS vs BLOQUEADOS
     */
    configurarEstadoCampos() {
        // 🟢 CAMPOS QUE DEVEM FICAR SEMPRE LIBERADOS (editáveis)
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
                // 🟢 REMOVER COMPLETAMENTE READONLY E DISABLED
                campo.removeAttribute('readonly');
                campo.removeAttribute('disabled');
                
                // 🟢 GARANTIR QUE ESTEJAM EDITÁVEIS
                campo.readOnly = false;
                campo.disabled = false;
                
                // 🟢 ESTILOS VISUAIS DE CAMPO EDITÁVEL
                campo.style.backgroundColor = '#ffffff';
                campo.style.borderColor = '#007bff';
                campo.style.cursor = 'text';
                campo.style.color = '#000000';
                
                console.log(`🟢 Campo LIBERADO: ${campoId}`);
            }
        });
        
        // 🔴 CAMPOS QUE DEVEM FICAR BLOQUEADOS (somente leitura)
        const camposBloqueados = [
            'numero-cliente-final'
        ];
        
        camposBloqueados.forEach(campoId => {
            const campo = this.container.querySelector(`#${campoId}`);
            if (campo) {
                // 🔴 MANTER COMO SOMENTE LEITURA
                campo.readOnly = true;
                campo.setAttribute('readonly', 'true');
                
                // 🔴 ESTILOS VISUAIS DE CAMPO BLOQUEADO
                campo.style.backgroundColor = '#f8f9fa';
                campo.style.borderColor = '#ced4da';
                campo.style.cursor = 'not-allowed';
                campo.style.color = '#6c757d';
                
                console.log(`🔴 Campo BLOQUEADO: ${campoId}`);
            }
        });
        
        // 🟢 CONFIGURAÇÃO ESPECIAL PARA O CAMPO DE DATA
        this.configurarCampoData();
    }

    /**
     * 🆕 CONFIGURAR CAMPO DE DATA COMO EDITÁVEL
     */
    configurarCampoData() {
        const dataCampo = this.container.querySelector('#data-cadastro');
        if (dataCampo) {
            // 🟢 REMOVER COMPLETAMENTE O READONLY
            dataCampo.removeAttribute('readonly');
            dataCampo.readOnly = false;
            
            // 🟢 TORNAR EDITÁVEL
            dataCampo.disabled = false;
            
            // 🟢 MELHORAR USABILIDADE
            dataCampo.title = "Clique para editar a data (DD/MM/AAAA)";
            dataCampo.placeholder = "DD/MM/AAAA";
            
            // 🟢 ESTILOS DE CAMPO EDITÁVEL
            dataCampo.style.backgroundColor = '#ffffff';
            dataCampo.style.borderColor = '#007bff';
            dataCampo.style.cursor = 'text';
            dataCampo.style.color = '#000000';
            
            // 🟢 ADICIONAR MÁSCARA DE DATA EM TEMPO REAL
            dataCampo.addEventListener('input', (e) => {
                this.aplicarMascaraData(e.target);
            });
            
            // 🟢 VALIDAR DATA AO PERDER O FOCO
            dataCampo.addEventListener('blur', (e) => {
                this.validarData(e.target);
            });
            
            console.log('🟢 Campo de DATA configurado como editável');
        }
    }

    /**
     * 🆕 APLICAR MÁSCARA DE DATA EM TEMPO REAL
     */
    aplicarMascaraData(input) {
        let value = input.value.replace(/\D/g, '');
        
        // Limitar a 8 dígitos (DDMMAAAA)
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
        // Aplicar máscara
        if (value.length > 4) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4) + '/' + value.substring(4);
        } else if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        
        input.value = value;
    }

    /**
     * 🆕 VALIDAR DATA AO PERDER FOCO
     */
    validarData(input) {
        const valor = input.value.trim();
        
        if (!valor) return true; // Campo vazio é válido
        
        // Validar formato DD/MM/AAAA
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
        
        // Validar valores
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
        
        // Validar fevereiro e meses com 30 dias
        const data = new Date(ano, mes - 1, dia);
        if (data.getDate() !== dia || data.getMonth() + 1 !== mes || data.getFullYear() !== ano) {
            showSystemStatus('Data inválida para o mês especificado', 'warning');
            input.focus();
            return false;
        }
        
        return true;
    }

    criarHTMLFormulario() {
        return `
        <div class="empresa-cadastro-inline" id="empresa-cadastro-inline">
            <div class="empresa-form-grid">
                <!-- Empresa 🟢 EDITÁVEL -->
                <div class="form-group">
                    <label for="empresa-input">Empresa *</label>
                    <input type="text" 
                        id="empresa-input" 
                        class="empresa-input" 
                        placeholder="Digite sigla ou nome..."
                        autocomplete="off">
                    <div class="autocomplete-suggestions" id="empresa-suggestions"></div>
                </div>

                <!-- Número Cliente Final 🔴 SOMENTE LEITURA -->
                <div class="form-group">
                    <label for="numero-cliente-final">Número Cliente Final</label>
                    <input type="text" 
                        id="numero-cliente-final" 
                        class="numero-cliente-final" 
                        readonly
                        placeholder="Será calculado automaticamente">
                </div>

                <!-- Cliente Final 🟢 EDITÁVEL -->
                <div class="form-group">
                    <label for="cliente-final">Cliente Final</label>
                    <input type="text" 
                        id="cliente-final" 
                        class="cliente-final" 
                        placeholder="Nome do cliente final">
                </div>

                <!-- Código Cliente 🟢 EDITÁVEL -->
                <div class="form-group">
                    <label for="codigo-cliente">Código Cliente</label>
                    <input type="text" 
                        id="codigo-cliente" 
                        class="codigo-cliente" 
                        placeholder="Código interno do cliente">
                </div>

                <!-- Data do Cadastro 🟢 EDITÁVEL -->
                <div class="form-group">
                    <label for="data-cadastro">Data do Cadastro</label>
                    <input type="text" 
                        id="data-cadastro" 
                        class="data-cadastro" 
                        placeholder="DD/MM/AAAA"
                        value="${new Date().toLocaleDateString('pt-BR')}">
                </div>

                <!-- Orçamentista Responsável 🟢 EDITÁVEL -->
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

    /**
     * 🆕 VALIDAÇÃO CORRIGIDA DA SIGLA - COM REGEX E TOOLTIP
     */
    validarDados(dados) {
        if (!dados.empresaInput.trim()) {
            showSystemStatus('Por favor, informe a empresa', 'error');
            return false;
        }

        if (!dados.empresaExistente) {
            // 🆕 VALIDAÇÃO CORRIGIDA DA SIGLA - REGEX MELHORADO
            const regexSigla = /^[A-Z]{2,6}$/; // 2 a 6 letras maiúsculas
            
            // Verificar se usuário digitou apenas sigla
            if (regexSigla.test(dados.empresaInput)) {
                // Usuário digitou apenas sigla - solicitar nome completo
                const nomeCompleto = prompt(`Você digitou apenas a sigla "${dados.empresaInput}". Por favor, informe o nome completo da empresa:`);
                if (!nomeCompleto || !nomeCompleto.trim()) {
                    showSystemStatus('Nome completo da empresa é obrigatório', 'error');
                    return false;
                }
                
                // 🆕 VALIDAR FORMATO DO NOME
                if (nomeCompleto.trim().length < 3) {
                    showSystemStatus('Nome da empresa deve ter pelo menos 3 caracteres', 'error');
                    return false;
                }
                
                dados.nomeEmpresa = nomeCompleto.trim();
                dados.sigla = dados.empresaInput.toUpperCase();
                
            } else {
                // Usuário digitou nome - sugerir sigla válida
                const primeiraPalavra = dados.empresaInput.split(' ')[0];
                const siglaSugerida = primeiraPalavra.substring(0, 3).toUpperCase();
                
                // 🆕 GARANTIR QUE SIGLA TENHA FORMATO VÁLIDO
                let siglaConfirmada = prompt(`Empresa não encontrada. Sugerimos a sigla "${siglaSugerida}". Confirme ou digite outra sigla (2-6 letras maiúsculas):`, siglaSugerida);
                
                if (!siglaConfirmada) {
                    showSystemStatus('Sigla é obrigatória', 'error');
                    return false;
                }
                
                // 🆕 NORMALIZAR SIGLA
                siglaConfirmada = siglaConfirmada.trim().toUpperCase().replace(/[^A-Z]/g, '');
                
                // 🆕 VALIDAR FORMATO DA SIGLA
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
     * 🆕 INICIALIZAR TOOLTIP - VERSÃO COM AUTO-CLOSE NO MOBILE
     */
    inicializarTooltipJavaScript(element) {
        console.log('🔧 Inicializando tooltip RESPONSIVO com auto-close');
        
        // 🆕 DETECTAR SE É MOBILE
        const isMobile = window.innerWidth <= 768;
        
        // 🆕 VARIÁVEL PARA CONTROLAR O TIMER
        let autoCloseTimer = null;
        
        // FORÇAR ESTILOS PARA GARANTIR VISIBILIDADE
        element.style.position = 'relative';
        element.style.overflow = 'visible';
        element.style.zIndex = '100';
        
        // Criar tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'empresa-tooltip';
        
        // 🆕 ADICIONAR CLASSE PARA MOBILE
        if (isMobile) {
            tooltip.classList.add('empresa-tooltip-mobile');
            
            // 🆕 ADICIONAR BOTÃO DE FECHAR NO MOBILE
            const closeButton = document.createElement('button');
            closeButton.className = 'empresa-tooltip-close';
            closeButton.innerHTML = '×';
            closeButton.setAttribute('aria-label', 'Fechar tooltip');
            tooltip.appendChild(closeButton);
            
            // 🆕 EVENTO PARA FECHAR COM BOTÃO
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                esconderTooltip();
            });
        }
        
        // 🆕 POSICIONAR O TOOLTIP FORA DA HIERARQUIA DO ELEMENTO
        document.body.appendChild(tooltip);
        
        // 🆕 FUNÇÃO PARA INICIAR TIMER DE AUTO-CLOSE
        const iniciarAutoCloseTimer = () => {
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
            }
            // 🆕 FECHAR AUTOMATICAMENTE APÓS 5 SEGUNDOS NO MOBILE
            autoCloseTimer = setTimeout(() => {
                console.log('⏰ Auto-close do tooltip no mobile');
                esconderTooltip();
            }, 5000); // 5 segundos
        };
        
        // 🆕 FUNÇÃO PARA CANCELAR TIMER
        const cancelarAutoCloseTimer = () => {
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
                autoCloseTimer = null;
            }
        };
        
        // 🆕 FUNÇÃO PARA ATUALIZAR POSIÇÃO DO TOOLTIP - VERSÃO RESPONSIVA
        const atualizarPosicaoTooltip = () => {
            const rect = element.getBoundingClientRect();
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const isMobileNow = window.innerWidth <= 768;
            
            if (isMobileNow) {
                // 🆕 POSICIONAMENTO PARA MOBILE
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
                // 🆕 POSICIONAMENTO PARA DESKTOP
                tooltip.style.position = 'fixed';
                tooltip.style.left = (rect.left + scrollX + (rect.width / 2)) + 'px';
                tooltip.style.bottom = (window.innerHeight - rect.top - scrollY + 8) + 'px';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.width = 'auto';
                tooltip.style.maxWidth = '380px';
                tooltip.style.maxHeight = 'none';
            }
        };
        
        // 🆕 FUNÇÃO PARA MOSTRAR TOOLTIP
        const mostrarTooltip = () => {
            console.log('🐭 Mouse ENTER/TAP no span');
            const tooltipText = element.getAttribute('data-tooltip');
            if (tooltipText) {
                // 🆕 ATUALIZAR CONTEÚDO (exceto botão de fechar se existir)
                const closeBtn = tooltip.querySelector('.empresa-tooltip-close');
                tooltip.innerHTML = tooltipText;
                if (closeBtn && isMobile) {
                    tooltip.appendChild(closeBtn);
                }
                
                tooltip.classList.add('show');
                atualizarPosicaoTooltip();
                
                // 🆕 INICIAR TIMER DE AUTO-CLOSE NO MOBILE
                if (isMobile) {
                    iniciarAutoCloseTimer();
                }
                
                console.log('🔦 Tooltip mostrado:', tooltipText);
            }
        };
        
        // 🆕 FUNÇÃO PARA ESCONDER TOOLTIP
        const esconderTooltip = () => {
            console.log('🐭 Escondendo tooltip');
            tooltip.classList.remove('show');
            cancelarAutoCloseTimer(); // 🆕 CANCELAR TIMER AO ESCONDER
        };
        
        // 🆕 EVENT LISTENERS DIFERENCIADOS PARA MOBILE/DESKTOP
        if (isMobile) {
            // 🆕 PARA MOBILE: USAR CLICK/TOUCH
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (tooltip.classList.contains('show')) {
                    esconderTooltip();
                } else {
                    mostrarTooltip();
                }
            });
            
            // 🆕 FECHAR TOOLTIP AO CLICAR FORA (MOBILE)
            document.addEventListener('click', (e) => {
                if (!element.contains(e.target) && !tooltip.contains(e.target)) {
                    esconderTooltip();
                }
            });
            
            // 🆕 FECHAR TOOLTIP AO ROLAR (MOBILE)
            window.addEventListener('scroll', esconderTooltip);
            
            // 🆕 FECHAR TOOLTIP AO MUDAR ORIENTAÇÃO (MOBILE)
            window.addEventListener('orientationchange', esconderTooltip);
            
        } else {
            // 🆕 PARA DESKTOP: USAR HOVER
            element.addEventListener('mouseenter', mostrarTooltip);
            element.addEventListener('mouseleave', esconderTooltip);
        }
        
        // 🆕 REINICIAR TIMER SE O USUÁRIO INTERAGIR COM O TOOLTIP (MOBILE)
        if (isMobile) {
            tooltip.addEventListener('touchstart', () => {
                cancelarAutoCloseTimer(); // Cancelar timer atual
                iniciarAutoCloseTimer();  // Reiniciar timer
            });
            
            tooltip.addEventListener('click', () => {
                cancelarAutoCloseTimer(); // Cancelar timer atual  
                iniciarAutoCloseTimer();  // Reiniciar timer
            });
        }
        
        // 🆕 ATUALIZAR POSIÇÃO AO ROLAR/REDIMENSIONAR
        window.addEventListener('scroll', () => {
            if (tooltip.classList.contains('show')) {
                atualizarPosicaoTooltip();
            }
        });
        
        window.addEventListener('resize', () => {
            if (tooltip.classList.contains('show')) {
                atualizarPosicaoTooltip();
            }
            
            // 🆕 RECARREGAR COMPORTAMENTO AO REDIMENSIONAR ENTRE MOBILE/DESKTOP
            const novaCondicaoMobile = window.innerWidth <= 768;
            if (isMobile !== novaCondicaoMobile) {
                console.log('🔄 Mudança entre mobile/desktop detectada');
                esconderTooltip();
                // Recriar tooltip com novo comportamento
                tooltip.remove();
                this.inicializarTooltipJavaScript(element);
            }
        });
        
        // 🆕 LIMPAR EVENT LISTENERS QUANDO ELEMENTO FOR REMOVIDO
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
        
        console.log('✅ Tooltip inicializado (com auto-close) - Mobile:', isMobile);
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


