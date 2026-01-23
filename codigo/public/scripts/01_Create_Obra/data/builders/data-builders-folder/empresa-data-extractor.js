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

    console.log('🔍 [EXTRACT EMPRESA] FASE 1 - Buscando nos INPUTS ATUAIS do formulário...');
    
    const formEmpresa = obraElement.querySelector('.empresa-formulario-ativo');
    if (formEmpresa) {
        console.log('📋 [EXTRACT EMPRESA] Formulário ativo encontrado, extraindo dados atuais...');
        
        // 🆕 PRIORIDADE 1: Buscar dados do autocomplete (são os mais confiáveis)
        const empresaInput = formEmpresa.querySelector('.empresa-input-cadastro');
        if (empresaInput && empresaInput.dataset.siglaSelecionada) {
            console.log('🎯 [EXTRACT EMPRESA] Dados do autocomplete encontrados:', {
                sigla: empresaInput.dataset.siglaSelecionada,
                nome: empresaInput.dataset.nomeSelecionado
            });
            
            empresaData.empresaSigla = empresaInput.dataset.siglaSelecionada;
            empresaData.empresaNome = empresaInput.dataset.nomeSelecionado || '';
        }
        
        // 🆕 PRIORIDADE 2: Buscar nos campos de empresa (caso autocomplete não tenha dados)
        if (!empresaData.empresaSigla || !empresaData.empresaNome) {
            console.log('🔍 [EXTRACT EMPRESA] Buscando em campos de input...');
            
            // Buscar em todos os campos de empresa possíveis
            const empresaInputs = [
                ...formEmpresa.querySelectorAll('.empresa-input-cadastro, .empresa-input-readonly')
            ];
            
            for (const input of empresaInputs) {
                if (input && input.value && input.value.trim() !== '') {
                    const valor = input.value.trim();
                    console.log(`🏢 [EXTRACT EMPRESA] Campo empresa encontrado: "${valor}"`);
                    
                    // Verificar se está no formato "SIGLA - Nome"
                    if (valor.includes(' - ')) {
                        const partes = valor.split(' - ');
                        if (!empresaData.empresaSigla) empresaData.empresaSigla = partes[0].trim();
                        if (!empresaData.empresaNome) empresaData.empresaNome = partes.slice(1).join(' - ').trim();
                        console.log(`✅ [EXTRACT EMPRESA] Empresa extraída do formato combinado: ${empresaData.empresaSigla} - ${empresaData.empresaNome}`);
                    } else {
                        // Se não tem hífen, verificar se é sigla ou nome
                        if (!empresaData.empresaSigla && valor.length <= 10) {
                            // Se for curto, assume que é sigla
                            empresaData.empresaSigla = valor;
                            console.log(`🏢 [EXTRACT EMPRESA] Sigla identificada: ${empresaData.empresaSigla}`);
                        } else if (!empresaData.empresaNome) {
                            // Se for mais longo, assume que é nome
                            empresaData.empresaNome = valor;
                            console.log(`🏢 [EXTRACT EMPRESA] Nome identificado: ${empresaData.empresaNome}`);
                        }
                    }
                    break;
                }
            }
        }

        // 🆕 BUSCAR CAMPOS SEPARADOS ESPECÍFICOS (se existirem campos dedicados)
        console.log('🔍 [EXTRACT EMPRESA] Buscando campos específicos...');
        
        // Mapeamento dos outros campos
        const mapeamentoCampos = {
            // Campos de empresa separados (caso existam)
            'empresa-sigla-input': ['empresaSigla'],
            'empresa-nome-input': ['empresaNome'],
            
            // Outros campos
            'numero-cliente-final-cadastro': ['numeroClienteFinal'], 
            'cliente-final-cadastro': ['clienteFinal'],
            'codigo-cliente-cadastro': ['codigoCliente'],
            'data-cadastro-cadastro': ['dataCadastro'],
            'orcamentista-responsavel-cadastro': ['orcamentistaResponsavel'],
            
            // Inputs de visualização/readonly
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
                            // Extrair só a sigla do formato "SIGLA - Nome"
                            const partes = valor.split(' - ');
                            empresaData.empresaSigla = partes[0].trim();
                            console.log(`🏢 [EXTRACT EMPRESA] Sigla extraída de campo combinado: ${empresaData.empresaSigla}`);
                        } else if (campo === 'empresaNome' && valor.includes(' - ')) {
                            // Extrair só o nome do formato "SIGLA - Nome"
                            const partes = valor.split(' - ');
                            empresaData.empresaNome = partes.slice(1).join(' - ').trim();
                            console.log(`🏢 [EXTRACT EMPRESA] Nome extraído de campo combinado: ${empresaData.empresaNome}`);
                        } else {
                            empresaData[campo] = valor;
                        }
                    }
                });
            }
        });
    } else {
        console.log('❌ [EXTRACT EMPRESA] Formulário ativo não encontrado');
    }

    // 🆕 FASE 2: Buscar nos data attributes os campos que ainda estão faltando
    console.log('🔍 [EXTRACT EMPRESA] FASE 2 - Buscando campos faltantes nos data attributes...');
    
    const camposFaltantes = camposEmpresa.filter(campo => !empresaData[campo]);
    console.log(`📋 [EXTRACT EMPRESA] Campos ainda faltantes: ${camposFaltantes.join(', ')}`);
    
    camposFaltantes.forEach(campo => {
        const valorDataAttr = obraElement.dataset[campo];
        if (valorDataAttr !== undefined && valorDataAttr !== null && valorDataAttr !== '') {
            console.log(`📦 [EXTRACT EMPRESA] Data-attribute ${campo}: "${valorDataAttr}"`);
            
            if (campo === 'numeroClienteFinal') {
                empresaData[campo] = parseInt(valorDataAttr) || 0;
            } else if (campo === 'empresaSigla') {
                // Extrair sigla do data-attribute
                if (valorDataAttr.includes(' - ')) {
                    const partes = valorDataAttr.split(' - ');
                    empresaData.empresaSigla = partes[0].trim();
                    console.log(`🏢 [EXTRACT EMPRESA] Sigla extraída do data-attribute combinado: ${empresaData.empresaSigla}`);
                    
                    // Se também precisar do nome e não tiver ainda
                    if (!empresaData.empresaNome && partes[1]) {
                        empresaData.empresaNome = partes.slice(1).join(' - ').trim();
                        console.log(`🏢 [EXTRACT EMPRESA] Nome extraído do data-attribute combinado: ${empresaData.empresaNome}`);
                    }
                } else {
                    empresaData.empresaSigla = valorDataAttr;
                }
            } else if (campo === 'empresaNome') {
                // Extrair nome do data-attribute
                if (valorDataAttr.includes(' - ')) {
                    const partes = valorDataAttr.split(' - ');
                    empresaData.empresaNome = partes.slice(1).join(' - ').trim();
                    console.log(`🏢 [EXTRACT EMPRESA] Nome extraído do data-attribute combinado: ${empresaData.empresaNome}`);
                    
                    // Se também precisar da sigla e não tiver ainda
                    if (!empresaData.empresaSigla && partes[0]) {
                        empresaData.empresaSigla = partes[0].trim();
                        console.log(`🏢 [EXTRACT EMPRESA] Sigla extraída do data-attribute combinado: ${empresaData.empresaSigla}`);
                    }
                } else {
                    empresaData.empresaNome = valorDataAttr;
                }
            } else {
                empresaData[campo] = valorDataAttr;
            }
        }
    });

    console.log('🔍 [EXTRACT EMPRESA] FASE 3 - Validação final...');
    
    // VERIFICAÇÃO FINAL - garantir que temos pelo menos sigla ou nome
    if (!empresaData.empresaSigla && empresaData.empresaNome) {
        console.log('⚠️ [EXTRACT EMPRESA] Temos nome mas não sigla');
    } else if (empresaData.empresaSigla && !empresaData.empresaNome) {
        console.log('⚠️ [EXTRACT EMPRESA] Temos sigla mas não nome');
    } else if (empresaData.empresaSigla && empresaData.empresaNome) {
        console.log(`✅ [EXTRACT EMPRESA] Empresa completa: ${empresaData.empresaSigla} - ${empresaData.empresaNome}`);
    } else {
        console.log('❌ [EXTRACT EMPRESA] Nenhum dado de empresa encontrado');
    }

    console.log('🏢 [EXTRACT EMPRESA] DADOS FINAIS EXTRAÍDOS:', empresaData);
    
    // VERIFICAÇÃO CRÍTICA
    const statusCampos = {};
    camposEmpresa.forEach(campo => {
        statusCampos[campo] = empresaData[campo] !== undefined 
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