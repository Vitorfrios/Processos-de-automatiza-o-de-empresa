// data/builders/data-builders-folder/empresa-data-extractor.js

/**
 * Extrai dados de empresa cadastrados inline
 */


function extractEmpresaData(obraElement) {
    const empresaData = {};
    
    if (!obraElement) {
        console.error('❌ Elemento da obra é nulo para extração de empresa');
        return empresaData;
    }

    console.log('🔍 Extraindo dados de empresa da obra:', obraElement.dataset.obraId);

    // PRIMEIRO: Buscar nos data attributes (se já foi salvo antes)
    const camposEmpresa = [
        'empresaSigla', 'empresaNome', 'numeroClienteFinal', 
        'clienteFinal', 'codigoCliente', 'dataCadastro', 
        'orcamentistaResponsavel', 'idGerado'
    ];

    let dadosEncontrados = 0;
    
    camposEmpresa.forEach(campo => {
        if (obraElement.dataset[campo]) {
            if (campo === 'numeroClienteFinal') {
                empresaData[campo] = parseInt(obraElement.dataset[campo]) || 0;
            } else {
                empresaData[campo] = obraElement.dataset[campo];
            }
            dadosEncontrados++;
            console.log(`✅ [DATA-ATTR] ${campo}: ${empresaData[campo]}`);
        }
    });

    // SEGUNDO: Buscar nos inputs do formulário (para campos faltantes)
    console.log('🔍 Buscando campos faltantes nos inputs...');
    
    const formEmpresa = obraElement.querySelector('.empresa-formulario-ativo');
    if (formEmpresa) {
        console.log('📋 Formulário de empresa encontrado, extraindo campos faltantes...');
        
        // Mapeamento completo de todos os campos
        const mapeamentoCampos = {
            // Campos de entrada
            'empresa-input-cadastro': 'empresaSigla',
            'numero-cliente-final-cadastro': 'numeroClienteFinal', 
            'cliente-final-cadastro': 'clienteFinal',
            'codigo-cliente-cadastro': 'codigoCliente',
            'data-cadastro-cadastro': 'dataCadastro',
            'orcamentista-responsavel-cadastro': 'orcamentistaResponsavel',
            
            // Campos de visualização (readonly)
            'empresa-input-readonly': 'empresaSigla',
            'numero-cliente-final-readonly': 'numeroClienteFinal',
            'cliente-final-input': 'clienteFinal',
            'codigo-cliente-input': 'codigoCliente', 
            'data-cadastro-readonly': 'dataCadastro',
            'orcamentista-responsavel-input': 'orcamentistaResponsavel'
        };

        // Buscar em TODOS os inputs possíveis
        Object.entries(mapeamentoCampos).forEach(([inputClass, campo]) => {
            // Se o campo já foi encontrado, pular
            if (empresaData[campo]) {
                console.log(`⏭️  Campo ${campo} já extraído, pulando...`);
                return;
            }
            
            const input = formEmpresa.querySelector(`.${inputClass}`);
            if (input && input.value && input.value.trim() !== '') {
                let valor = input.value.trim();
                
                console.log(`🔍 Encontrado input ${inputClass}: "${valor}"`);
                
                // Processar campos especiais
                if (campo === 'numeroClienteFinal') {
                    empresaData[campo] = parseInt(valor) || 0;
                    console.log(`✅ [INPUT] ${campo}: ${empresaData[campo]}`);
                } else if (campo === 'empresaSigla' && valor.includes(' - ')) {
                    // Já está no formato "SIGLA - Nome", extrair apenas a sigla
                    const partes = valor.split(' - ');
                    empresaData.empresaSigla = partes[0];
                    if (partes[1] && !empresaData.empresaNome) {
                        empresaData.empresaNome = partes[1];
                    }
                    console.log(`✅ [INPUT] empresaSigla: ${empresaData.empresaSigla}, empresaNome: ${empresaData.empresaNome}`);
                } else {
                    empresaData[campo] = valor;
                    console.log(`✅ [INPUT] ${campo}: ${valor}`);
                }
                
                dadosEncontrados++;
            }
        });

        // Buscar dados específicos do input de empresa (autocomplete)
        const empresaInput = formEmpresa.querySelector('.empresa-input-cadastro');
        if (empresaInput && empresaInput.dataset.siglaSelecionada && !empresaData.empresaSigla) {
            empresaData.empresaSigla = empresaInput.dataset.siglaSelecionada;
            empresaData.empresaNome = empresaInput.dataset.nomeSelecionado;
            console.log(`✅ [INPUT-DATA] empresaSigla: ${empresaData.empresaSigla}, empresaNome: ${empresaData.empresaNome}`);
            dadosEncontrados += 2;
        }
    }

    // TERCEIRO: Buscar campos que ainda estão faltando
    const camposFaltantes = camposEmpresa.filter(campo => !empresaData[campo]);
    if (camposFaltantes.length > 0) {
        console.log(`🔍 Campos ainda faltantes: ${camposFaltantes.join(', ')}`);
        
        // Tentar buscar em inputs genéricos
        const todosInputs = obraElement.querySelectorAll('input');
        todosInputs.forEach(input => {
            const valor = input.value?.trim();
            if (!valor) return;
            
            // Tentar identificar o campo pelo placeholder, name ou classe
            const identificadores = [
                input.placeholder,
                input.name,
                input.className
            ].join(' ').toLowerCase();
            
            camposFaltantes.forEach(campo => {
                if (!empresaData[campo]) {
                    const mapeamentos = {
                        'numerocliente': 'numeroClienteFinal',
                        'clientefinal': 'clienteFinal', 
                        'codigocliente': 'codigoCliente',
                        'orcamentista': 'orcamentistaResponsavel',
                        'responsavel': 'orcamentistaResponsavel'
                    };
                    
                    for (const [chave, campoMapeado] of Object.entries(mapeamentos)) {
                        if (identificadores.includes(chave) && campoMapeado === campo) {
                            empresaData[campo] = valor;
                            console.log(`✅ [INPUT-GENÉRICO] ${campo}: ${valor} (encontrado por: ${chave})`);
                            dadosEncontrados++;
                            break;
                        }
                    }
                }
            });
        });
    }

    console.log(`🏢 RESUMO: ${dadosEncontrados} dados de empresa extraídos:`, empresaData);
    
    // VALIDAÇÃO: Verificar se temos os campos mínimos
    const camposObrigatorios = ['empresaSigla', 'empresaNome'];
    const camposPresentes = camposObrigatorios.filter(campo => empresaData[campo]);
    
    if (camposPresentes.length === camposObrigatorios.length) {
        console.log('✅ Dados de empresa válidos para salvamento');
    } else {
        console.warn('⚠️ Dados de empresa incompletos:', {
            faltantes: camposObrigatorios.filter(campo => !empresaData[campo]),
            presentes: camposPresentes
        });
    }
    
    return empresaData;
}

// Função auxiliar para mapear campos da visualização
function mapearCampoVisualizacao(campo) {
    const mapeamento = {
        'empresa-input': 'empresaSigla',
        'numero-cliente-final': 'numeroClienteFinal',
        'cliente-final': 'clienteFinal', 
        'codigo-cliente': 'codigoCliente',
        'data-cadastro': 'dataCadastro',
        'orcamentista-responsavel': 'orcamentistaResponsavel'
    };
    return mapeamento[campo];
}

// EXPORTS NO FINAL
export {
    extractEmpresaData
};