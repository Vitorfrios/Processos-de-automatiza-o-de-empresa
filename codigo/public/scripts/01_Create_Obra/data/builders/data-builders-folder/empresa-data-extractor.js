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

    console.log('🔍 [EXTRACT EMPRESA] INICIANDO extração para obra:', obraElement.dataset.obraId);

    const camposEmpresa = [
        'empresaSigla', 'empresaNome', 'numeroClienteFinal', 
        'clienteFinal', 'codigoCliente', 'dataCadastro', 
        'orcamentistaResponsavel', 'idGerado'
    ];

    // 🆕 ESTRATÉGIA: PRIMEIRO buscar nos INPUTS ATUAIS (valores mais recentes)
    console.log('🔍 [EXTRACT EMPRESA] FASE 1 - Buscando nos INPUTS ATUAIS do formulário...');
    
    const formEmpresa = obraElement.querySelector('.empresa-formulario-ativo');
    if (formEmpresa) {
        console.log('📋 [EXTRACT EMPRESA] Formulário ativo encontrado, extraindo dados atuais...');
        
        const mapeamentoCampos = {
            // 🆕 PRIORIDADE: Inputs de cadastro/edição (valores mais recentes)
            'empresa-input-cadastro': ['empresaSigla', 'empresaNome'],
            'numero-cliente-final-cadastro': ['numeroClienteFinal'], 
            'cliente-final-cadastro': ['clienteFinal'],
            'codigo-cliente-cadastro': ['codigoCliente'],
            'data-cadastro-cadastro': ['dataCadastro'],
            'orcamentista-responsavel-cadastro': ['orcamentistaResponsavel'],
            
            // 🆕 Inputs de visualização/readonly
            'empresa-input-readonly': ['empresaSigla', 'empresaNome'],
            'numero-cliente-final-readonly': ['numeroClienteFinal'],
            'cliente-final-input': ['clienteFinal'],
            'codigo-cliente-input': ['codigoCliente'], 
            'data-cadastro-readonly': ['dataCadastro'],
            'orcamentista-responsavel-input': ['orcamentistaResponsavel']
        };

        Object.entries(mapeamentoCampos).forEach(([inputClass, camposAlvo]) => {
            const input = formEmpresa.querySelector(`.${inputClass}`);
            
            if (input && input.value && input.value.trim() !== '') {
                let valor = input.value.trim();
                console.log(`✅ [EXTRACT EMPRESA] Input ${inputClass} encontrado: "${valor}"`);
                
                camposAlvo.forEach(campo => {
                    if (!empresaData[campo]) { // Só preenche se ainda não tem valor
                        if (campo === 'numeroClienteFinal') {
                            empresaData[campo] = parseInt(valor) || 0;
                            console.log(`🔢 [EXTRACT EMPRESA] ${campo} convertido para número: ${empresaData[campo]}`);
                        } else if (campo === 'empresaSigla' && valor.includes(' - ')) {
                            // Extrair sigla e nome do formato "SIGLA - Nome"
                            const partes = valor.split(' - ');
                            empresaData.empresaSigla = partes[0];
                            if (partes[1]) {
                                empresaData.empresaNome = partes[1];
                            }
                            console.log(`🏢 [EXTRACT EMPRESA] Empresa extraída: ${empresaData.empresaSigla} - ${empresaData.empresaNome}`);
                        } else if (campo === 'empresaNome' && !valor.includes(' - ')) {
                            // Se for apenas o nome, sem sigla
                            empresaData[campo] = valor;
                        } else if (campo !== 'empresaSigla') {
                            // Para outros campos
                            empresaData[campo] = valor;
                        }
                    }
                });
            }
        });

        // 🆕 BUSCAR DADOS DO AUTOCOMPLETE (prioridade máxima)
        const empresaInput = formEmpresa.querySelector('.empresa-input-cadastro');
        if (empresaInput && empresaInput.dataset.siglaSelecionada) {
            console.log('🎯 [EXTRACT EMPRESA] Dados do autocomplete encontrados:', {
                sigla: empresaInput.dataset.siglaSelecionada,
                nome: empresaInput.dataset.nomeSelecionado
            });
            
            // 🆕 SOBRESCREVER com dados do autocomplete (são os mais confiáveis)
            empresaData.empresaSigla = empresaInput.dataset.siglaSelecionada;
            empresaData.empresaNome = empresaInput.dataset.nomeSelecionado;
        }
    } else {
        console.log('❌ [EXTRACT EMPRESA] Formulário ativo não encontrado');
    }

    // 🆕 FASE 2: Só buscar nos data attributes os campos que ainda estão faltando
    console.log('🔍 [EXTRACT EMPRESA] FASE 2 - Buscando campos faltantes nos data attributes...');
    
    const camposFaltantes = camposEmpresa.filter(campo => !empresaData[campo]);
    console.log(`📋 [EXTRACT EMPRESA] Campos ainda faltantes: ${camposFaltantes.join(', ')}`);
    
    camposFaltantes.forEach(campo => {
        const valorDataAttr = obraElement.dataset[campo];
        if (valorDataAttr) {
            if (campo === 'numeroClienteFinal') {
                empresaData[campo] = parseInt(valorDataAttr) || 0;
            } else {
                empresaData[campo] = valorDataAttr;
            }
            console.log(`📦 [EXTRACT EMPRESA] ${campo} extraído do data-attribute: ${empresaData[campo]}`);
        }
    });

    // 🆕 VALIDAÇÃO FINAL E CORREÇÕES
    console.log('🔍 [EXTRACT EMPRESA] FASE 3 - Validação final...');
    
    // 🆕 CORRIGIR: Se temos empresaSigla mas não temos empresaNome (ou vice-versa)
    if (empresaData.empresaSigla && !empresaData.empresaNome) {
        console.log('⚠️ [EXTRACT EMPRESA] Temos sigla mas não nome, buscando nome...');
        // Tentar buscar o nome de outra fonte
        const empresaInput = formEmpresa?.querySelector('.empresa-input-cadastro, .empresa-input-readonly');
        if (empresaInput?.value && empresaInput.value.includes(' - ')) {
            const partes = empresaInput.value.split(' - ');
            if (partes[0] === empresaData.empresaSigla && partes[1]) {
                empresaData.empresaNome = partes[1];
                console.log(`✅ [EXTRACT EMPRESA] Nome recuperado: ${empresaData.empresaNome}`);
            }
        }
    }

    // 🆕 CORRIGIR: Formatar data se necessário
    if (empresaData.dataCadastro && !empresaData.dataCadastro.includes('T')) {
        console.log(`📅 [EXTRACT EMPRESA] Data no formato local: ${empresaData.dataCadastro}`);
        // Manter formato local se não for ISO
    }

    console.log('🏢 [EXTRACT EMPRESA] DADOS FINAIS EXTRAÍDOS:', empresaData);
    
    // 🆕 VERIFICAÇÃO CRÍTICA
    const statusCampos = {};
    camposEmpresa.forEach(campo => {
        statusCampos[campo] = empresaData[campo] 
            ? `✅ ${empresaData[campo]}` 
            : '❌ AUSENTE';
    });
    
    console.log('📋 [EXTRACT EMPRESA] STATUS FINAL:', statusCampos);
    
    return empresaData;
}



// EXPORTS NO FINAL
export {
    extractEmpresaData
};