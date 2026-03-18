// empresa-autocomplete.js
/**
 * 🔍 EMPRESA-AUTOCOMPLETE.JS - Sistema de Busca/Autocomplete de Empresas
 * ✅ Responsabilidade: Input híbrido, filtragem, navegação por teclado, seleção
 * ✅ Arquivo 2 de 5 na refatoração do sistema de empresa
 */

import {
    carregarEmpresasComCache,
    EmpresaCadastroInline
} from './empresa-core.js';
import {
    inicializarDetectorBackspace,
    corrigirPosicaoDropdown,
    mostrarAvisoAutocompletado,
    limparDadosSelecao
} from './empresa-ui-helpers.js';
import { normalizeEmpresa } from '../../core/shared-utils.js';




/* ==== SEÇÃO 1: INICIALIZAÇÃO DO INPUT HÍBRIDO ==== */

/**
 * INICIALIZAR INPUT HÍBRIDO - OTIMIZADO
 */
async function inicializarInputEmpresaHibrido(obraId) {
    console.log(`🔧 [INPUT HÍBRIDO] Inicializando para obra: ${obraId}`);

    const input = document.getElementById(`empresa-input-${obraId}`);
    const dropdown = document.getElementById(`empresa-dropdown-${obraId}`);
    const optionsContainer = document.getElementById(`empresa-options-${obraId}`);

    if (!input) {
        console.error(`❌ [INPUT HÍBRIDO] Input não encontrado para obra ${obraId}`);
        return;
    }

    // 🔥 CORREÇÃO: CARREGAR EMPRESAS COM CACHE
    let empresas = [];
    try {
        empresas = await carregarEmpresasComCache();
        console.log(`✅ [INPUT HÍBRIDO] ${empresas.length} empresas disponíveis`);
    } catch (error) {
        console.error(`❌ [INPUT HÍBRIDO] Erro ao carregar empresas:`, error);
        empresas = [];
    }

    // 🔥 DEBOUNCE PARA EVITAR MUITAS BUSCAS RÁPIDAS
    let timeoutBusca;

    // 🔥 INICIALIZAR DETECTOR DE BACKSPACE
    inicializarDetectorBackspace(input, obraId);

    // 🔥 EVENTO DE INPUT OTIMIZADO
    input.addEventListener('input', function (e) {
        const termo = e.target.value.trim();

        // Limpa timeout anterior
        if (timeoutBusca) {
            clearTimeout(timeoutBusca);
        }

        // 🔥 DEBOUNCE: Aguarda 150ms antes de processar
        timeoutBusca = setTimeout(() => {
            processarInputEmpresa(termo, input, dropdown, optionsContainer, obraId, empresas);
        }, 150);
    });

    // 🔥 EVENTO DE FOCO - MAIS RÁPIDO
    input.addEventListener('focus', function () {
        window.usuarioEstaApagando = false;
        window.ultimoValorInput = this.value;

        const valorAtual = this.value.trim();
        const empresaJaSelecionada = this.dataset.siglaSelecionada;

        if (valorAtual.length === 0) {
            exibirTodasEmpresas(empresas, optionsContainer, input, dropdown, obraId);
        } else if (empresaJaSelecionada && valorAtual === `${this.dataset.siglaSelecionada} - ${this.dataset.nomeSelecionado}`) {
            dropdown.style.display = 'none';
        } else {
            const sugestoes = filtrarEmpresas(valorAtual, empresas);
            exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
        }
    });

    // 🔥 EVENTO DE BLUR
    input.addEventListener('blur', function () {
        if (timeoutBusca) {
            clearTimeout(timeoutBusca);
        }
        setTimeout(() => {
            window.usuarioEstaApagando = false;
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }, 25);
    });

    // 🔥 EVENTO DE TECLADO OTIMIZADO
    input.addEventListener('keydown', function (e) {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
            e.preventDefault();

            switch (e.key) {
                case 'ArrowDown':
                    navegarDropdown('down', optionsContainer, input, dropdown, obraId);
                    break;
                case 'ArrowUp':
                    navegarDropdown('up', optionsContainer, input, dropdown, obraId);
                    break;
                case 'Enter':
                case 'Tab':
                    if (dropdown.style.display === 'block') {
                        selecionarOpcaoAtiva(optionsContainer, input, dropdown, obraId);
                    } else {
                        dropdown.style.display = 'none';
                        input.blur();
                    }
                    break;
                case 'Escape':
                    dropdown.style.display = 'none';
                    input.blur();
                    break;
            }
        }
    });

    // 🔥 EVENTO DE CLIQUE FORA - OTIMIZADO
    const fecharDropdownHandler = function (e) {
        if (input && dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    };

    document.addEventListener('click', fecharDropdownHandler);

    // 🔥 LIMPEZA AO DESTRUIR COMPONENTE
    input._cleanup = () => {
        document.removeEventListener('click', fecharDropdownHandler);
        if (timeoutBusca) {
            clearTimeout(timeoutBusca);
        }
    };

    console.log(`✅ [INPUT HÍBRIDO] Inicializado com sucesso para obra ${obraId}`);
}

/* ==== SEÇÃO 2: PROCESSAMENTO E FILTRAGEM ==== */

/**
 * PROCESSAR INPUT COM DEBOUNCE
 */
function processarInputEmpresa(termo, input, dropdown, optionsContainer, obraId, empresas) {
    console.log(`🔍 [INPUT] Processando: "${termo}" | Apagando: ${window.usuarioEstaApagando}`);

    // 🔥 PRIORIDADE MÁXIMA: Se usuário está apagando, NUNCA fazer autocomplete
    if (window.usuarioEstaApagando) {
        console.log('🚫 Autocomplete bloqueado - usuário apagando');
        
        // Se o termo está vazio, exibir todas empresas (para seleção)
        if (termo.length === 0) {
            limparDadosSelecao(input, obraId);
            exibirTodasEmpresas(empresas, optionsContainer, input, dropdown, obraId);
        } else {
            // Apenas filtrar, nunca autocompletar
            const sugestoes = filtrarEmpresas(termo, empresas);
            exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
        }

        // Resetar flag após um tempo
        setTimeout(() => {
            window.usuarioEstaApagando = false;
        }, 200); // ✅ Aumentar tempo para evitar recompletação
        return;
    }

    // 🔥 COMPORTAMENTO NORMAL (apenas quando NÃO está apagando)
    if (termo.length === 0) {
        limparDadosSelecao(input, obraId);
        exibirTodasEmpresas(empresas, optionsContainer, input, dropdown, obraId);
        return;
    }

    const sugestoes = filtrarEmpresas(termo, empresas);

    // 🔥 AUTOCOMPLETE MAIS CONSERVADOR
    if (sugestoes.length === 1 && termo.length >= 3) { // ✅ Mínimo 3 caracteres
        const empresa = normalizeEmpresa(sugestoes[0]);
        if (!empresa || !empresa.codigo) {
            exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
            return;
        }
        const sigla = empresa.codigo;
        const nome = empresa.nome || '';
        
        // Verificar se é um match exato da sigla
        if (sigla === termo.toUpperCase()) {
            selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'autocomplete');
            return;
        }
    }

    exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
}

/**
 * FILTRAR EMPRESAS OTIMIZADO
 */
function filtrarEmpresas(termo, empresas) {
    if (!termo || termo.length < 1) return [];

    const termoNormalizado = termo.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return empresas.filter(empresaObj => {
        const empresa = normalizeEmpresa(empresaObj);
        if (!empresa || !empresa.codigo) return false;
        const sigla = empresa.codigo;
        const nome = empresa.nome || '';
        const nomeNormalizado = nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        return sigla === termoNormalizado ||
            sigla.includes(termoNormalizado) ||
            nomeNormalizado.includes(termoNormalizado);
    });
}

/* ==== SEÇÃO 3: EXIBIÇÃO DE SUGESTÕES ==== */

/**
 * EXIBIR SUGESTÕES OTIMIZADO - COM SUPORTE TOUCHPAD
 */
function exibirSugestoes(sugestoes, container, input, dropdown, obraId) {
    const valorAtual = input.value.trim();
    const empresaJaSelecionada = input.dataset.siglaSelecionada;

    if (empresaJaSelecionada && valorAtual === `${input.dataset.siglaSelecionada} - ${input.dataset.nomeSelecionado}`) {
        container.innerHTML = '';
        dropdown.style.display = 'none';
        return;
    }

    if (!sugestoes || sugestoes.length === 0) {
        container.innerHTML = valorAtual.length > 0
            ? `<div class="dropdown-no-results">📝 Nenhuma empresa encontrada<br><small>Criando nova empresa: "${valorAtual}"</small></div>`
            : '<div class="dropdown-no-results">Digite para buscar empresas</div>';

        dropdown.style.display = 'block';
        return;
    }

    const sugestoesLimitadas = sugestoes.slice(0, 50);

    // 🔥 BLOQUEAR SELEÇÃO AUTOMÁTICA SE ESTÁ APAGANDO
    if (sugestoesLimitadas.length === 1 && valorAtual.length > 0 && !window.usuarioEstaApagando) {
        const empresa = normalizeEmpresa(sugestoesLimitadas[0]);
        if (!empresa || !empresa.codigo) {
            return;
        }
        const sigla = empresa.codigo;
        const nome = empresa.nome || '';
        const matchForte = valorAtual === sigla || valorAtual.length >= 3;

        if (matchForte) {
            selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'autocomplete');
            return;
        }
    }

    // 🔥 RENDERIZAÇÃO MAIS RÁPIDA
    container.innerHTML = sugestoesLimitadas.map(empresaObj => {
        const empresa = normalizeEmpresa(empresaObj);
        if (!empresa || !empresa.codigo) return '';
        const sigla = empresa.codigo;
        const nome = empresa.nome || '';
        return `
            <div class="dropdown-option" data-sigla="${sigla}" data-nome="${nome}" title="${nome}">
                <strong>${sigla}</strong> 
                <div class="nome-empresa">- ${nome}</div>
            </div>
        `;
    }).join('');

    dropdown.style.display = 'block';
    setTimeout(corrigirPosicaoDropdown, 10);

    // Selecionar primeira opção
    const primeiraOpcao = container.querySelector('.dropdown-option');
    if (primeiraOpcao) {
        primeiraOpcao.classList.add('active');
    }

    // ✅ CORREÇÃO: APLICAR EVENT LISTENERS DIRETOS PARA SUPORTE TOUCHPAD
    aplicarEventListenersDiretos(container, input, dropdown, obraId);

    console.log(`🔍 [EMPRESA] Exibindo ${sugestoesLimitadas.length} sugestões`);
}

/**
 * EXIBIR TODAS AS EMPRESAS - COM SUPORTE TOUCHPAD
 */
function exibirTodasEmpresas(empresas, container, input, dropdown, obraId) {
    const empresaJaSelecionada = input.dataset.siglaSelecionada;

    if (empresaJaSelecionada) {
        container.innerHTML = '';
        dropdown.style.display = 'none';
        return;
    }

    if (!empresas || empresas.length === 0) {
        container.innerHTML = `
            <div class="dropdown-no-results">
                📝 Nenhuma empresa cadastrada<br>
                <small>Digite o nome para criar uma nova</small>
            </div>
        `;
        dropdown.style.display = 'block';
        return;
    }

    const empresasLimitadas = empresas.slice(0, 50);

    const html = empresasLimitadas.map(empresaObj => {
        const empresa = normalizeEmpresa(empresaObj);
        if (!empresa || !empresa.codigo) return '';
        const sigla = empresa.codigo;
        const nome = empresa.nome || '';

        return `
            <div class="dropdown-option" data-sigla="${sigla}" data-nome="${nome}" title="${nome}">
                <strong>${sigla}</strong> 
                <div class="nome-empresa">- ${nome}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
    dropdown.style.display = 'block';
    setTimeout(corrigirPosicaoDropdown, 10);

    setTimeout(() => {
        if (dropdown.scrollHeight > 200) {
            dropdown.style.overflowY = 'auto';
            dropdown.style.maxHeight = '200px';
        }
    }, 10);

    // ✅ CORREÇÃO: APLICAR EVENT LISTENERS DIRETOS PARA SUPORTE TOUCHPAD
    aplicarEventListenersDiretos(container, input, dropdown, obraId);

    console.log(`📊 [EMPRESA] Exibindo ${empresasLimitadas.length} de ${empresas.length} empresas`);
}

/* ==== SEÇÃO 4: NAVEGAÇÃO E SELEÇÃO ==== */

/**
 * NAVEGAR NO DROPDOWN COM TECLADO - COM LOOP (FINAL → INÍCIO)
 */
function navegarDropdown(direcao, container, input, dropdown, obraId) {
    const options = container.querySelectorAll('.dropdown-option');
    if (options.length === 0) return;

    const activeOption = container.querySelector('.dropdown-option.active');
    let nextIndex = 0;

    if (activeOption) {
        const currentIndex = Array.from(options).indexOf(activeOption);

        // 🔥 COMPORTAMENTO EXCEL COM LOOP
        if (direcao === 'down') {
            // Para baixo: se está no último, volta para o primeiro
            nextIndex = currentIndex === options.length - 1 ? 0 : currentIndex + 1;
        } else {
            // Para cima: se está no primeiro, vai para o último
            nextIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
        }

        console.log(`🔄 Navegação: ${currentIndex} → ${nextIndex} (total: ${options.length})`);
    } else {
        // Se não há opção ativa, começa na primeira (down) ou última (up)
        nextIndex = direcao === 'down' ? 0 : options.length - 1;
    }

    // Remove active de todas e aplica na nova
    options.forEach(opt => opt.classList.remove('active'));
    options[nextIndex].classList.add('active');

    // 🔥 COMPORTAMENTO EXCEL: Atualiza o input em tempo real durante navegação
    const sigla = options[nextIndex].dataset.sigla;
    const nome = options[nextIndex].dataset.nome;
    input.value = `${sigla} - ${nome}`;

    // Scroll para a opção ativa
    options[nextIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
    });

    console.log(`🎯 Navegando para: ${sigla} - ${nome} (${nextIndex + 1}/${options.length})`);
}

/**
 * SELECIONAR EMPRESA - COM ATUALIZAÇÃO DO NÚMERO DO CLIENTE
 */
function selecionarEmpresa(sigla, nome, input, dropdown, obraId, tipoSelecao = 'manual') {
    console.log('🎯 Selecionando empresa:', sigla, nome, 'Tipo:', tipoSelecao);

    // 🔥 1. Atualizar o campo da empresa
    if (input) {
        input.removeAttribute('value');
        input.value = `${sigla} - ${nome}`;
        input.dataset.siglaSelecionada = sigla;
        input.dataset.nomeSelecionado = nome;
    }

    // 🔥 2. Atualizar dados da obra
    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (obraElement) {
        obraElement.dataset.empresaSigla = sigla;
        obraElement.dataset.empresaNome = nome;
        obraElement.dataset.dataCadastro = new Date().toLocaleDateString('pt-BR');
    }

    // 🔥 3. FECHAR DROPDOWN
    if (dropdown) {
        dropdown.style.display = 'none';
    }

    // 🔥 4. CALCULAR NÚMERO DO CLIENTE
    setTimeout(() => {
        if (window.empresaCadastro && typeof window.empresaCadastro.calcularNumeroClienteFinal === 'function') {
            window.empresaCadastro.calcularNumeroClienteFinal(sigla, obraId);
        } else {
            // Fallback: calcular localmente
            import('./empresa-ui-helpers.js').then(helpers => {
                helpers.calcularNumeroLocal(sigla, obraId);
            });
        }
    }, 50); // ✅ Delay para garantir que o DOM atualizou

    // 🔥 5. LIMPAR OUTROS CAMPOS
    setTimeout(() => {
        if (obraElement) {
            const formEmpresa = obraElement.querySelector('.empresa-formulario-ativo');
            if (formEmpresa) {
                const camposParaLimpar = [
                    '.cliente-final-cadastro',
                    '.codigo-cliente-cadastro',
                    '.orcamentista-responsavel-cadastro'
                ];

                camposParaLimpar.forEach(seletor => {
                    const campo = formEmpresa.querySelector(seletor);
                    if (campo) campo.value = '';
                });
            }
        }
        if (input) input.blur();
    }, 100);

    console.log(`✅ Empresa selecionada: ${sigla} - ${nome}`);
}

/**
 * SELECIONAR OPÇÃO ATIVA (ENTER/TAB)
 */
function selecionarOpcaoAtiva(container, input, dropdown, obraId) {
    const activeOption = container.querySelector('.dropdown-option.active');
    if (activeOption) {
        const sigla = activeOption.dataset.sigla;
        const nome = activeOption.dataset.nome;
        console.log('⌨️ Seleção por teclado');

        // 🔥 TIPO: manual (usuário usou teclado)
        selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'manual');
    }
}

/* ==== SEÇÃO 5: EVENT LISTENERS E TOUCH SUPPORT ==== */

/**
 * APLICAR EVENT LISTENERS DIRETOS - SUPORTE TOUCHPAD
 */
function aplicarEventListenersDiretos(container, input, dropdown, obraId) {
    const options = container.querySelectorAll('.dropdown-option');

    options.forEach(option => {
        // Remove listeners antigos
        option._clickHandler && option.removeEventListener('click', option._clickHandler);
        option._pointerHandler && option.removeEventListener('pointerdown', option._pointerHandler);
        option._touchHandler && option.removeEventListener('touchend', option._touchHandler);

        // Novo handler para click
        option._clickHandler = function (e) {
            e.preventDefault();
            e.stopPropagation();
            const sigla = this.dataset.sigla;
            const nome = this.dataset.nome;
            console.log('🖱️ Seleção por CLICK direto');
            selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'manual');
        };

        // Novo handler para pointer (touchpad)
        option._pointerHandler = function (e) {
            e.preventDefault();
            e.stopPropagation();
            const sigla = this.dataset.sigla;
            const nome = this.dataset.nome;
            console.log('🖱️ Seleção por POINTER direto');
            selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'manual');
        };

        // Novo handler para touch
        option._touchHandler = function (e) {
            e.preventDefault();
            e.stopPropagation();
            const sigla = this.dataset.sigla;
            const nome = this.dataset.nome;
            console.log('🖱️ Seleção por TOUCH direto');
            selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'manual');
        };

        // Aplicar todos os listeners
        option.addEventListener('click', option._clickHandler);
        option.addEventListener('pointerdown', option._pointerHandler);
        option.addEventListener('touchend', option._touchHandler);
    });
}

/**
 * INICIALIZAR EVENT DELEGATION PARA CLIQUE NAS OPÇÕES
 * ✅ CORREÇÃO: Suporte para touchpad, mouse e touch
 */
function inicializarEventDelegationClique() {
    // Event delegation global para todos os dropdowns de empresa
    // Captura múltiplos tipos de eventos para suporte completo

    const eventos = ['click', 'pointerdown', 'touchend'];

    eventos.forEach(eventType => {
        document.addEventListener(eventType, function (e) {
            const option = e.target.closest('.dropdown-option');
            if (option) {
                e.preventDefault();
                e.stopPropagation();

                // Encontrar o input e dropdown pai
                const dropdown = option.closest('.empresa-dropdown');
                if (!dropdown) return;

                const dropdownId = dropdown.id;
                const obraId = dropdownId.replace('empresa-dropdown-', '');
                const input = document.getElementById(`empresa-input-${obraId}`);

                if (input && dropdown) {
                    const sigla = option.dataset.sigla;
                    const nome = option.dataset.nome;
                    console.log(`🖱️ Seleção por ${eventType}`);

                    selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'manual');
                }
            }
        });
    });
}

/* ==== SEÇÃO 6: INICIALIZAÇÃO GLOBAL ==== */

// ✅ INICIALIZAR EVENT DELEGATION QUANDO O MÓDULO FOR CARREGADO
document.addEventListener('DOMContentLoaded', function () {
    inicializarEventDelegationClique();
    console.log('✅ [EMPRESA-AUTOCOMPLETE] Event delegation inicializado');
});



export {
    inicializarInputEmpresaHibrido,
    processarInputEmpresa,
    filtrarEmpresas,
    exibirSugestoes,
    exibirTodasEmpresas,
    navegarDropdown,
    selecionarEmpresa,
    selecionarOpcaoAtiva,
    aplicarEventListenersDiretos,
    inicializarEventDelegationClique
}

// Compatibilidade global
if (typeof window !== 'undefined') {
    window.inicializarInputEmpresaHibrido = inicializarInputEmpresaHibrido;
    window.processarInputEmpresa = processarInputEmpresa;
    window.filtrarEmpresas = filtrarEmpresas;
    window.exibirSugestoes = exibirSugestoes;
    window.exibirTodasEmpresas = exibirTodasEmpresas;
    window.navegarDropdown = navegarDropdown;
    window.selecionarEmpresa = selecionarEmpresa;
    window.selecionarOpcaoAtiva = selecionarOpcaoAtiva;
    window.aplicarEventListenersDiretos = aplicarEventListenersDiretos;
    window.inicializarEventDelegationClique = inicializarEventDelegationClique;
}
