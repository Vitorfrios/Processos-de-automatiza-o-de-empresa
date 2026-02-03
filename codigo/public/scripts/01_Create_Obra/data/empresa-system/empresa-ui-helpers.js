// empresa-ui-helpers.js
/**
 * 🎨 EMPRESA-UI-HELPERS.JS - Helpers de UI e Eventos para Sistema de Empresa
 * ✅ Responsabilidade: Eventos, detectores, correções de UI, tooltips, formatação
 */

/* ==== SEÇÃO 1: DETECTORES DE BACKSPACE E EVENTOS ==== */

/**
 * 🆕 DETECTAR BACKSPACE/DELETE DE FORMA MAIS PRECISA
 */
function criarSistemaBackspaceDetector(input) {
    let pressionandoBackspace = false;
    let timeoutBackspace;

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            pressionandoBackspace = true;
            window.usuarioEstaApagando = true;

            // Limpar timeout anterior
            if (timeoutBackspace) clearTimeout(timeoutBackspace);

            // Timeout para resetar se parou de apertar
            timeoutBackspace = setTimeout(() => {
                pressionandoBackspace = false;
                window.usuarioEstaApagando = false;
            }, 500);

            console.log('⌫ Tecla de apagar pressionada');
        }
    });

    input.addEventListener('keyup', function (e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            // Pequeno delay para garantir que o input foi processado
            setTimeout(() => {
                if (!pressionandoBackspace) {
                    window.usuarioEstaApagando = false;
                }
            }, 50);
        }
    });

    // Detectar seleção total (Ctrl+A) + Backspace
    input.addEventListener('input', function (e) {
        if (pressionandoBackspace && this.value.length === 0) {
            console.log('🎯 Usuário apagou tudo - reset completo');
            limparDadosSelecao(input, input.closest('[data-obra-id]')?.dataset.obraId);
        }
    });
}

/**
 * 🆕 INICIALIZAR DETECTOR DE BACKSPACE SEPARADAMENTE
 */
function inicializarDetectorBackspace(input, obraId) {
    console.log(`⌫ [BACKSPACE] Inicializando detector para obra ${obraId}`);

    let pressionandoBackspace = false;
    let timeoutBackspace;

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            window.usuarioEstaApagando = true;
            pressionandoBackspace = true;

            console.log('⌫ Tecla de apagar pressionada - bloqueando autocomplete');

            // Limpar timeout anterior
            if (timeoutBackspace) clearTimeout(timeoutBackspace);

            // Timeout para resetar se parou de apertar
            timeoutBackspace = setTimeout(() => {
                pressionandoBackspace = false;
                window.usuarioEstaApagando = false;
                console.log('🔄 Resetando flag de apagamento');
            }, 500);
        }

        // Salvar valor atual para comparação
        window.ultimoValorInput = this.value;
    });

    input.addEventListener('keyup', function (e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            // Pequeno delay para garantir que o input foi processado
            setTimeout(() => {
                if (!pressionandoBackspace) {
                    window.usuarioEstaApagando = false;
                    console.log('🔄 Tecla de apagar liberada');
                }
            }, 50);
        }
    });

    // Detectar seleção total (Ctrl+A) + Backspace
    input.addEventListener('input', function (e) {
        if (pressionandoBackspace && this.value.length === 0) {
            console.log('🎯 Usuário apagou tudo - reset completo');
            limparDadosSelecao(input, obraId);
        }
    });
}

/**
 * 🆕 LIMPAR DADOS DE SELEÇÃO
 */
function limparDadosSelecao(input, obraId) {
    if (input) {
        delete input.dataset.siglaSelecionada;
        delete input.dataset.nomeSelecionado;
    }
    limparNumeroCliente(obraId);
    console.log('🔄 Dados de seleção limpos');
}

/* ==== SEÇÃO 2: CORREÇÕES DE UI E POSICIONAMENTO ==== */

/**
 * 🆕 CORRIGIR POSIÇÃO DO DROPDOWN EM DISPOSITIVOS MÓVEIS
 */
function corrigirPosicaoDropdown() {
    const dropdowns = document.querySelectorAll('.empresa-dropdown');

    dropdowns.forEach(dropdown => {
        const input = dropdown.previousElementSibling;
        if (input && input.classList.contains('empresa-input-cadastro')) {
            // 🔥 GARANTIR QUE O DROPDOWN FIQUE EXATAMENTE ABAIXO DO INPUT
            const rect = input.getBoundingClientRect();
            dropdown.style.width = rect.width + 'px';
            dropdown.style.left = '0';
            dropdown.style.right = 'auto';
        }
    });
}

/**
 * 🆕 LIMPAR NÚMERO DO CLIENTE QUANDO EMPRESA FOR REMOVIDA
 */
function limparNumeroCliente(obraId) {
    const numeroInput = document.querySelector(`[data-obra-id="${obraId}"] .numero-cliente-final-cadastro`);
    if (numeroInput) {
        numeroInput.value = '';
        console.log(`🔄 [EMPRESA] Número do cliente limpo para obra ${obraId}`);
    }
}

/* ==== SEÇÃO 3: AVISOS E NOTIFICAÇÕES ==== */

/**
 * 🆕 MOSTRAR AVISO DE AUTOCOMPLETE - CSS EXTERNO
 */
function mostrarAvisoAutocompletado(input, tipoSelecao = 'manual') {
    if (tipoSelecao !== 'autocomplete') return;

    // Remove avisos anteriores
    document.querySelectorAll('.aviso-autocomplete-relativo').forEach(aviso => aviso.remove());

    // Encontrar container
    const container = input.closest('.form-group-horizontal') ||
        input.closest('.empresa-input-container') ||
        input.parentNode;

    if (!container) return;

    // Criar aviso
    const aviso = document.createElement('div');
    aviso.className = 'aviso-autocomplete-relativo';
    aviso.textContent = 'Empresa autocompletada ✓';

    // Adicionar ao container
    container.appendChild(aviso);

    // Animação
    setTimeout(() => aviso.classList.add('show'), 50);

    // Remover
    setTimeout(() => {
        aviso.classList.remove('show');
        setTimeout(() => aviso.remove(), 300);
    }, 1200);
}

/* ==== SEÇÃO 4: FORMATAÇÃO E VALIDAÇÃO DE DATA ==== */

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

/* ==== SEÇÃO 5: CÁLCULO LOCAL DE NÚMERO DO CLIENTE ==== */

/**
 * 🆕 CALCULAR NÚMERO LOCALMENTE COMO FALLBACK
 */
async function calcularNumeroLocal(sigla, obraId) {
    try {
        // Buscar todas as obras para calcular localmente
        const response = await fetch('/api/backup-completo');
        if (!response.ok) {
            throw new Error('Não foi possível carregar obras');
        }

        const backup = await response.json();
        const obrasExistentes = backup.obras || [];

        // Filtrar obras da mesma empresa
        const obrasDaEmpresa = obrasExistentes.filter(obra =>
            obra.empresaSigla === sigla ||
            (obra.idGerado && obra.idGerado.startsWith(`obra_${sigla}_`))
        );

        // Encontrar maior número
        let maiorNumero = 0;
        obrasDaEmpresa.forEach(obra => {
            if (obra.numeroClienteFinal && obra.numeroClienteFinal > maiorNumero) {
                maiorNumero = obra.numeroClienteFinal;
            }

            if (obra.idGerado) {
                const match = obra.idGerado.match(new RegExp(`obra_${sigla}_(\\d+)`));
                if (match) {
                    const numero = parseInt(match[1]);
                    if (numero > maiorNumero) maiorNumero = numero;
                }
            }
        });

        const novoNumero = maiorNumero + 1;
        atualizarNumeroClienteInput(novoNumero, obraId);
        console.log(`🔢 [EMPRESA] Número local: ${novoNumero} para ${sigla}`);

    } catch (error) {
        console.error('❌ [EMPRESA] Erro no cálculo local:', error);
        // Fallback final: número aleatório
        const numeroFallback = Math.floor(Math.random() * 100) + 1;
        atualizarNumeroClienteInput(numeroFallback, obraId);
        console.log(`🔄 [EMPRESA] Número fallback: ${numeroFallback} para ${sigla}`);
    }
}

/**
 * 🆕 ATUALIZAR INPUT DO NÚMERO DO CLIENTE
 */
function atualizarNumeroClienteInput(numero, obraId) {
    const numeroInput = document.querySelector(`[data-obra-id="${obraId}"] .numero-cliente-final-cadastro`);
    if (numeroInput) {
        numeroInput.value = numero;
    }
}

/* ==== SEÇÃO 6: FORMATAÇÃO DE DATA ==== */

/**
 * 🆕 FORMATA DATA PARA dd/mm/aaaa
 */
function formatarData(dataString) {
    if (!dataString) return '';

    try {
        // Se já estiver no formato dd/mm/aaaa, retornar como está
        if (typeof dataString === 'string' && dataString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return dataString;
        }

        // Tentar parse como Date
        const data = new Date(dataString);

        // Verificar se é uma data válida
        if (isNaN(data.getTime())) {
            console.warn(`⚠️ [EMPRESA] Data inválida: ${dataString}`);
            return dataString; // Retorna original se não conseguir formatar
        }

        // Formatar para dd/mm/aaaa
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();

        return `${dia}/${mes}/${ano}`;

    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao formatar data ${dataString}:`, error);
        return dataString; // Retorna original em caso de erro
    }
}

/* ==== SEÇÃO 7: EVENT LISTENERS GLOBAIS ==== */

// Event listeners globais para correção de dropdown
window.addEventListener('resize', corrigirPosicaoDropdown);
window.addEventListener('scroll', corrigirPosicaoDropdown);

// 🔥 INICIALIZAR DETECTOR EM TODOS OS INPUTS EXISTENTES
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        const inputs = document.querySelectorAll('.empresa-input-cadastro');
        inputs.forEach(input => {
            criarSistemaBackspaceDetector(input);
        });

        console.log('✅ [EMPRESA-UI-HELPERS] Sistema de backspace inicializado');
    }, 1000);
});

export {
    criarSistemaBackspaceDetector,
    inicializarDetectorBackspace,
    limparDadosSelecao,
    corrigirPosicaoDropdown,
    limparNumeroCliente,
    mostrarAvisoAutocompletado,
    formatarDataEmTempoReal,
    permitirApenasNumerosEControles,
    validarDataInput,
    calcularNumeroLocal,
    atualizarNumeroClienteInput,
    formatarData
}

// Compatibilidade global
if (typeof window !== 'undefined') {
    window.criarSistemaBackspaceDetector = criarSistemaBackspaceDetector;
    window.inicializarDetectorBackspace = inicializarDetectorBackspace;
    window.limparDadosSelecao = limparDadosSelecao;
    window.corrigirPosicaoDropdown = corrigirPosicaoDropdown;
    window.limparNumeroCliente = limparNumeroCliente;
    window.mostrarAvisoAutocompletado = mostrarAvisoAutocompletado;
    window.formatarDataEmTempoReal = formatarDataEmTempoReal;
    window.permitirApenasNumerosEControles = permitirApenasNumerosEControles;
    window.validarDataInput = validarDataInput;
    window.calcularNumeroLocal = calcularNumeroLocal;
    window.atualizarNumeroClienteInput = atualizarNumeroClienteInput;
    window.formatarData = formatarData;
}
console.log('✅ empresa-ui-helpers.js carregado com sucesso');