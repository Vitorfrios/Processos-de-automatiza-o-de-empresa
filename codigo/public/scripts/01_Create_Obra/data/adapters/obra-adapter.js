// adapters/obra-adapter.js - 

export * from './obra-adapter-folder/obra-data-loader.js';
export * from './obra-adapter-folder/empresa-form-manager.js';
export * from './obra-adapter-folder/empresa-autocomplete.js';
export * from './obra-adapter-folder/ui-helpers-obra-adapter.js';

import {obterDadosEmpresaDaObra }from './obra-adapter-folder/obra-data-loader.js'
import {criarVisualizacaoEmpresa,criarFormularioVazioEmpresa }from './obra-adapter-folder/empresa-form-manager.js'
/**
 * 🆕 FUNÇÃO GLOBAL PARA EDITAR DADOS DA EMPRESA
 */
window.editarDadosEmpresa = function(button, obraId = null) {
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
window.atualizarDadosEmpresa = function(input, campo, obraId) {
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
 * 🆕 OCULTAR FORMULÁRIO DE EMPRESA E RESTAURAR BOTÃO
 */
window.ocultarFormularioEmpresa = function(button, obraId) {
    try {
        const formulario = button.closest('.empresa-formulario-ativo');
        const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
        
        if (!obraElement) {
            console.error(`❌ [EMPRESA] Obra ${obraId} não encontrada`);
            return;
        }
        
        // Encontrar o container de empresa
        const empresaContainer = obraElement.querySelector('.projetc-header-record.very-dark');
        if (!empresaContainer) {
            console.error(`❌ [EMPRESA] Container de empresa não encontrado`);
            return;
        }
        
        // Remover formulário se existir
        if (formulario) {
            formulario.remove();
        }
        
        // Verificar se já existe botão
        const botaoExistente = empresaContainer.querySelector('.btn-empresa-cadastro');
        if (!botaoExistente) {
            // Criar e adicionar botão
            const botao = document.createElement('button');
            botao.className = 'btn-empresa-cadastro';
            botao.textContent = 'Adicionar campos de cadastro de empresas';
            botao.onclick = () => window.ativarCadastroEmpresa(obraId);
            
            empresaContainer.appendChild(botao);
        } else {
            // Garantir que o botão está visível
            botaoExistente.style.display = 'block';
        }
        
        console.log(`👁️ [EMPRESA] Formulário ocultado e botão restaurado para obra ${obraId}`);
        
    } catch (error) {
        console.error('❌ [EMPRESA] Erro ao ocultar formulário:', error);
    }
};

/**
 * 🆕 FUNÇÃO GLOBAL PARA ATIVAR CADASTRO DE EMPRESA - CORRIGIDA
 */
window.ativarCadastroEmpresa = function(obraId) {
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
            criarVisualizacaoEmpresa({...dadosEmpresa, id: obraId}, empresaContainer);
        } else {
            // Se não tem dados, criar formulário vazio para cadastro
            console.log(`🆕 [EMPRESA] Criando novo formulário para obra ${obraId}`);
            criarFormularioVazioEmpresa(obraId, empresaContainer);
        }
        
    } catch (error) {
        console.error(`❌ [EMPRESA] Erro ao ativar cadastro para obra ${obraId}:`, error);
    }
};