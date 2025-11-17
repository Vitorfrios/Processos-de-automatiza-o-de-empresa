// ui-helpers-obra-adapters.js

/**
 * 🆕 LIMPAR DADOS DE SELEÇÃO
 */
function limparDadosSelecao(input, obraId) {
    delete input.dataset.siglaSelecionada;
    delete input.dataset.nomeSelecionado;
    limparNumeroCliente(obraId);
    console.log('🔄 Dados de seleção limpos');
}

/**
 * 🆕 DETECTAR BACKSPACE/DELETE DE FORMA MAIS PRECISA
 */
function criarSistemaBackspaceDetector(input) {
    let pressionandoBackspace = false;
    let timeoutBackspace;
    
    input.addEventListener('keydown', function(e) {
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
    
    input.addEventListener('keyup', function(e) {
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
    input.addEventListener('input', function(e) {
        if (pressionandoBackspace && this.value.length === 0) {
            console.log('🎯 Usuário apagou tudo - reset completo');
            limparDadosSelecao(input, input.closest('[data-obra-id]')?.dataset.obraId);
        }
    });
}

/**
 * 🆕 INICIALIZAR DETECTOR DE BACKSPACE SEPARADAMENTE (CORRIGIDO)
 */
function inicializarDetectorBackspace(input, obraId) {
    console.log(`⌫ [BACKSPACE] Inicializando detector para obra ${obraId}`);
    
    let pressionandoBackspace = false;
    let timeoutBackspace;
    
    input.addEventListener('keydown', function(e) {
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
    
    input.addEventListener('keyup', function(e) {
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
    input.addEventListener('input', function(e) {
        if (pressionandoBackspace && this.value.length === 0) {
            console.log('🎯 Usuário apagou tudo - reset completo');
            limparDadosSelecao(input, obraId);
        }
    });
}

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

/**
 * 🆕 CALCULAR NÚMERO DO CLIENTE FINAL - CORRIGIDO E MAIS ROBUSTO
 */
async function calcularNumeroClienteFinal(sigla, obraId) {
    try {
        console.log(`🔢 [EMPRESA] Calculando número para: ${sigla}`);
        
        // Tentar a API primeiro
        const response = await fetch(`/api/dados/empresas/numero/${encodeURIComponent(sigla)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const dados = await response.json();
        
        if (dados.success) {
            const novoNumero = dados.numero;
            atualizarNumeroClienteInput(novoNumero, obraId);
            console.log(`✅ [EMPRESA] Número da API: ${novoNumero} para ${sigla}`);
        } else {
            console.warn('⚠️ [EMPRESA] API retornou erro, usando cálculo local:', dados.error);
            calcularNumeroLocal(sigla, obraId);
        }
        
    } catch (error) {
        console.warn('⚠️ [EMPRESA] Erro na API, usando cálculo local:', error.message);
        calcularNumeroLocal(sigla, obraId);
    }
}

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

// Event listeners globais
window.addEventListener('resize', corrigirPosicaoDropdown);

// 🔥 CORRIGIR NO SCROLL (para casos de virtual keyboard)
window.addEventListener('scroll', corrigirPosicaoDropdown);

// 🔥 INICIALIZAR DETECTOR EM TODOS OS INPUTS EXISTENTES
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const inputs = document.querySelectorAll('.empresa-input-cadastro');
        inputs.forEach(input => {
            criarSistemaBackspaceDetector(input);
        });
    }, 1000);
});

// EXPORTS NO FINAL
export {
    limparDadosSelecao,
    criarSistemaBackspaceDetector,
    inicializarDetectorBackspace,
    corrigirPosicaoDropdown,
    limparNumeroCliente,
    mostrarAvisoAutocompletado,
    calcularNumeroClienteFinal,
    calcularNumeroLocal,
    atualizarNumeroClienteInput,
    formatarData
};