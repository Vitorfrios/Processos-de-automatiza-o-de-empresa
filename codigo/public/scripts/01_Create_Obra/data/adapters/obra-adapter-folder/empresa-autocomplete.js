 // empresa-autocomplete.js

import {
    inicializarDetectorBackspace,
    corrigirPosicaoDropdown,
    calcularNumeroClienteFinal,
    mostrarAvisoAutocompletado,
    limparDadosSelecao     } from './ui-helpers-obra-adapter.js'

/**
 * 🆕 SISTEMA DE DETECÇÃO DE BACKSPACE/DELETE
 */
window.usuarioEstaApagando = false;
window.ultimoValorInput = '';

/**
 * INICIALIZAR INPUT HÍBRIDO - COM CONTROLE DE BACKSPACE (CORRIGIDO)
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
    
    // 🔥 CORREÇÃO: CARREGAR EMPRESAS ANTES DE TUDO
    let empresas = [];
    try {
        console.log(`📦 [INPUT HÍBRIDO] Carregando empresas para obra ${obraId}...`);
        const response = await fetch('/api/dados/empresas');
        if (response.ok) {
            const data = await response.json();
            empresas = data.empresas || [];
            console.log(`✅ [INPUT HÍBRIDO] ${empresas.length} empresas carregadas`);
        } else {
            console.error(`❌ [INPUT HÍBRIDO] Erro ao carregar empresas: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ [INPUT HÍBRIDO] Erro no carregamento de empresas:`, error);
    }

    // 🔥 INICIALIZAR DETECTOR DE BACKSPACE PRIMEIRO
    inicializarDetectorBackspace(input, obraId);
    
    // 🔥 EVENTO DE INPUT ATUALIZADO - RESPEITAR BACKSPACE
    input.addEventListener('input', function(e) {
        const termo = e.target.value.trim();
        console.log(`🔍 [INPUT] Digitando: "${termo}" | Apagando: ${window.usuarioEstaApagando}`);
        
        // 🔥 SE USUÁRIO ESTÁ APAGANDO, NÃO FAZER AUTOCOMPLETE
        if (window.usuarioEstaApagando) {
            console.log('🚫 Autocomplete bloqueado - usuário apagando');
            
            // Apenas busca normal, sem autocomplete automático
            if (termo.length === 0) {
                limparDadosSelecao(input, obraId);
                exibirTodasEmpresas(empresas, optionsContainer, input, dropdown, obraId);
            } else {
                const sugestoes = filtrarEmpresas(termo, empresas);
                exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
            }
            
            // Resetar flag após processar o input
            setTimeout(() => {
                window.usuarioEstaApagando = false;
            }, 100);
            return;
        }
        
        // 🔥 COMPORTAMENTO NORMAL (não está apagando)
        if (termo.length === 0) {
            console.log('🔄 Campo apagado - mostrando todas empresas');
            limparDadosSelecao(input, obraId);
            exibirTodasEmpresas(empresas, optionsContainer, input, dropdown, obraId);
            return;
        }
        
        const sugestoes = filtrarEmpresas(termo, empresas);
        console.log(`🎯 [INPUT] ${sugestoes.length} sugestões para "${termo}"`);
        
        // 🔥 AUTOCOMPLETE SÓ SE NÃO ESTIVER APAGANDO
        if (sugestoes.length === 1 && termo.length > 0 && !window.usuarioEstaApagando) {
            const [sigla, nome] = Object.entries(sugestoes[0])[0];
            
            // Verificar se é um match forte (usuário digitou sigla completa ou nome significativo)
            const matchForte = termo === sigla || termo.length >= 3;
            
            if (matchForte) {
                console.log(`✅ [AUTOCOMPLETE] Única sugestão: ${sigla} - ${nome}`);
                selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'autocomplete');
                return;
            }
        }
        
        exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
    });
    
    // 🔥 EVENTO DE FOCO - RESETAR FLAGS E MOSTRAR EMPRESAS
    input.addEventListener('focus', function() {
        window.usuarioEstaApagando = false;
        window.ultimoValorInput = this.value;
        
        const valorAtual = this.value.trim();
        const empresaJaSelecionada = this.dataset.siglaSelecionada;
        
        if (valorAtual.length === 0) {
            exibirTodasEmpresas(empresas, optionsContainer, input, dropdown, obraId);
        } else if (empresaJaSelecionada && valorAtual === `${this.dataset.siglaSelecionada} - ${this.dataset.nomeSelecionado}`) {
            // Empresa já selecionada, não mostrar dropdown
            dropdown.style.display = 'none';
        } else {
            const sugestoes = filtrarEmpresas(valorAtual, empresas);
            exibirSugestoes(sugestoes, optionsContainer, input, dropdown, obraId);
        }
    });
    
    // 🔥 EVENTO DE BLUR - RESETAR FLAGS
    input.addEventListener('blur', function() {
        setTimeout(() => {
            window.usuarioEstaApagando = false;
        }, 200);
    });
    
    // Evento de teclado para navegação
    input.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            navegarDropdown('down', optionsContainer, input, dropdown, obraId);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navegarDropdown('up', optionsContainer, input, dropdown, obraId);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            
            // 🔥 COMPORTAMENTO EXCEL: Se o dropdown está aberto, seleciona a opção ativa
            if (dropdown.style.display === 'block') {
                selecionarOpcaoAtiva(optionsContainer, input, dropdown, obraId);
            } else {
                // Se o dropdown está fechado mas há uma empresa já preenchida, apenas fecha
                dropdown.style.display = 'none';
                input.blur();
            }
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
            input.blur();
        } else if (e.key === 'Tab') {
            // 🔥 COMPORTAMENTO EXCEL: Tab também seleciona a opção ativa
            if (dropdown.style.display === 'block') {
                e.preventDefault();
                selecionarOpcaoAtiva(optionsContainer, input, dropdown, obraId);
            }
        }
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (input && dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    console.log(`✅ [INPUT HÍBRIDO] Inicializado com sucesso para obra ${obraId}`);
}

/**
 * FILTRAR EMPRESAS POR TERMO
 */
function filtrarEmpresas(termo, empresas) {
    if (!termo || termo.length < 1) return [];
    
    const termoNormalizado = termo.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return empresas.filter(empresaObj => {
        const [sigla, nome] = Object.entries(empresaObj)[0];
        const nomeNormalizado = nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        return sigla === termoNormalizado || 
               sigla.includes(termoNormalizado) ||
               nomeNormalizado.includes(termoNormalizado);
    });
}

/**
 * EXIBIR SUGESTÕES NO DROPDOWN - COM COMPORTAMENTO EXCEL CORRIGIDO
 */
function exibirSugestoes(sugestoes, container, input, dropdown, obraId) {
    const valorAtual = input.value.trim();
    const empresaJaSelecionada = input.dataset.siglaSelecionada;
    
    // 🔥 NÃO FAZER AUTOCOMPLETE SE USUÁRIO ESTÁ APAGANDO
    if (window.usuarioEstaApagando) {
        console.log('🚫 Autocomplete ignorado - modo apagando ativo');
        // Mostrar sugestões normais, mas não auto-selecionar
    }
    
    if (empresaJaSelecionada && valorAtual === `${input.dataset.siglaSelecionada} - ${input.dataset.nomeSelecionado}`) {
        container.innerHTML = '';
        dropdown.style.display = 'none';
        return;
    }
    
    if (!sugestoes || sugestoes.length === 0) {
        if (valorAtual.length > 0) {
            container.innerHTML = `
                <div class="dropdown-no-results">
                    📝 Nenhuma empresa encontrada<br>
                    <small>Criando nova empresa: "${valorAtual}"</small>
                </div>
            `;
        } else {
            container.innerHTML = '<div class="dropdown-no-results">Digite para buscar empresas</div>';
        }
        dropdown.style.display = 'block';
        return;
    }
    
    const sugestoesLimitadas = sugestoes.slice(0, 50);
    
    // 🔥 BLOQUEAR SELEÇÃO AUTOMÁTICA SE ESTÁ APAGANDO
    if (sugestoesLimitadas.length === 1 && valorAtual.length > 0 && !window.usuarioEstaApagando) {
        const [sigla, nome] = Object.entries(sugestoesLimitadas[0])[0];
        console.log(`✅ [AUTOCOMPLETE] Única sugestão: ${sigla} - ${nome}`);
        selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'autocomplete');
        return;
    }
    
    const html = sugestoesLimitadas.map(empresaObj => {
        const [sigla, nome] = Object.entries(empresaObj)[0];
        
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

    // COMPORTAMENTO EXCEL: Se há poucas sugestões, seleciona a primeira automaticamente para navegação com setas
    if (sugestoesLimitadas.length > 0) {
        const primeiraOpcao = container.querySelector('.dropdown-option');
        if (primeiraOpcao) {
            primeiraOpcao.classList.add('active');
        }
    }
    
    setTimeout(() => {
        if (dropdown.scrollHeight > 200) {
            dropdown.style.overflowY = 'auto';
            dropdown.style.maxHeight = '200px';
        }
    }, 10);
    
    // Vincular eventos de clique
    container.querySelectorAll('.dropdown-option').forEach(option => {
        // 2. NO CLIQUE MANUAL (dropdown)
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const sigla = this.dataset.sigla;
            const nome = this.dataset.nome;
            console.log('🖱️ Clique manual na opção');
            
            // 🔥 TIPO: manual (usuário clicou)
            selecionarEmpresa(sigla, nome, input, dropdown, obraId, 'manual');
        });
    });
    
    console.log(`🔍 [EMPRESA] Exibindo ${sugestoesLimitadas.length} sugestões`);
}

/**
 * EXIBIR TODAS AS EMPRESAS
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
        const [sigla, nome] = Object.entries(empresaObj)[0];
        
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
    
    container.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function() {
            const sigla = this.dataset.sigla;
            const nome = this.dataset.nome;
            selecionarEmpresa(sigla, nome, input, dropdown, obraId);
        });
    });
    
    console.log(`📊 [EMPRESA] Exibindo ${empresasLimitadas.length} de ${empresas.length} empresas`);
}

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
 * SELECIONAR EMPRESA - COM CONTROLE DE TIPO DE SELEÇÃO
 */



function selecionarEmpresa(sigla, nome, input, dropdown, obraId, tipoSelecao = 'manual') {
    console.log('🎯 Selecionando empresa:', sigla, nome, 'Tipo:', tipoSelecao);
    
    // Preenche o input
    input.value = `${sigla} - ${nome}`;
    input.dataset.siglaSelecionada = sigla;
    input.dataset.nomeSelecionado = nome;
    
    // ✅ CORREÇÃO: SALVAR TODOS OS DADOS NOS DATA ATTRIBUTES DA OBRA
    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (obraElement) {
        // Dados básicos da empresa
        obraElement.dataset.empresaSigla = sigla;
        obraElement.dataset.empresaNome = nome;
        obraElement.dataset.dataCadastro = new Date().toLocaleDateString('pt-BR');
        
        // ✅ BUSCAR E SALVAR OS DEMAIS CAMPOS DO FORMULÁRIO
        const formEmpresa = obraElement.querySelector('.empresa-formulario-ativo');
        if (formEmpresa) {
            // Buscar número do cliente
            const numeroClienteInput = formEmpresa.querySelector('.numero-cliente-final-cadastro');
            if (numeroClienteInput?.value) {
                obraElement.dataset.numeroClienteFinal = numeroClienteInput.value;
            }
            
            // Buscar cliente final
            const clienteFinalInput = formEmpresa.querySelector('.cliente-final-cadastro');
            if (clienteFinalInput?.value) {
                obraElement.dataset.clienteFinal = clienteFinalInput.value;
            }
            
            // Buscar código do cliente
            const codigoClienteInput = formEmpresa.querySelector('.codigo-cliente-cadastro');
            if (codigoClienteInput?.value) {
                obraElement.dataset.codigoCliente = codigoClienteInput.value;
            }
            
            // Buscar orçamentista
            const orcamentistaInput = formEmpresa.querySelector('.orcamentista-responsavel-cadastro');
            if (orcamentistaInput?.value) {
                obraElement.dataset.orcamentistaResponsavel = orcamentistaInput.value;
            }
        }
        
        console.log(`💾 TODOS os dados salvos na obra ${obraId}:`, {
            empresaSigla: sigla,
            empresaNome: nome,
            numeroClienteFinal: obraElement.dataset.numeroClienteFinal,
            clienteFinal: obraElement.dataset.clienteFinal,
            codigoCliente: obraElement.dataset.codigoCliente,
            orcamentistaResponsavel: obraElement.dataset.orcamentistaResponsavel
        });
    }
    
    // Fecha dropdown
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    // Remove foco do input
    setTimeout(() => {
        input.blur();
        
        // 🔥 MOSTRAR AVISO APENAS SE FOR AUTOCOMPLETE
        mostrarAvisoAutocompletado(input, tipoSelecao);
    }, 10);
    
    // Calcula o número do cliente
    calcularNumeroClienteFinal(sigla, obraId);
    
    console.log(`✅ Empresa selecionada e TODOS os dados salvos: ${sigla} - ${nome}`);
}

/**
 * ATUALIZAR EVENTO DE ENTER - CORRIGIDO
 */
// 3. NO ENTER/TAB (navegação)
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

// EXPORTS NO FINAL
export {
    inicializarInputEmpresaHibrido,
    filtrarEmpresas,
    exibirSugestoes,
    exibirTodasEmpresas,
    navegarDropdown,
    selecionarEmpresa,
    selecionarOpcaoAtiva
};