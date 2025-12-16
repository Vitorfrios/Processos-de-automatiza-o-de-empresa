/* ==== json-editor.js ==== */
// json-editor.js - VERSÃO COMPLETA COM SCROLL FUNCIONAL (CORRIGIDO)

// ==================== ESTADO GLOBAL ====================
window.stagingData = null;
window.hasPendingChanges = false;
let isInitialized = false;

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Atualiza os números das linhas DINAMICAMENTE
 */
export function updateLineNumbers() {
    const editor = document.getElementById('jsonEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    const jsonContainer = document.querySelector('.json-container'); // Mudado de scrollWrapper para container
    
    if (!editor || !lineNumbers || !jsonContainer) {
        console.warn('Elementos do editor não encontrados');
        return;
    }
    
    try {
        // Conta as linhas do texto
        const text = editor.value;
        let lines = text.split('\n');
        
        // Se o texto terminar com quebra de linha, adiciona linha extra
        if (text.endsWith('\n')) {
            lines.push('');
        }
        
        const totalLines = Math.max(lines.length, 1);
        
        // Gera os números das linhas
        let numbersHTML = '';
        for (let i = 1; i <= totalLines; i++) {
            numbersHTML += `<div data-line="${i}">${i}</div>`;
        }
        
        // Atualiza o HTML
        lineNumbers.innerHTML = numbersHTML;
        
        // Calcula altura baseada no conteúdo
        const lineHeight = 20;
        const padding = 32;
        const minHeight = 200; // Altura mínima
        
        // Altura baseada no conteúdo
        const contentHeight = (totalLines * lineHeight) + padding;
        const finalHeight = Math.max(contentHeight, minHeight);
        
        // Ajusta alturas
        editor.style.height = finalHeight + 'px';
        lineNumbers.style.height = finalHeight + 'px';
        
        // Garante que o container tenha conteúdo suficiente
        setTimeout(() => {
            const containerHeight = jsonContainer.clientHeight;
            
            // Se o conteúdo for menor que o container, ajusta para preencher
            if (finalHeight < containerHeight) {
                editor.style.height = containerHeight + 'px';
                lineNumbers.style.height = containerHeight + 'px';
            }
            
            // Debug: verifica status do scroll
            const shouldScrollVertically = finalHeight > jsonContainer.clientHeight;
            console.log(`📏 Altura: ${finalHeight}px, Container: ${jsonContainer.clientHeight}px`);
            console.log(`📊 Scroll vertical necessário: ${shouldScrollVertically}`);
            
        }, 0);
        
    } catch (error) {
        console.error('Erro ao atualizar números das linhas:', error);
    }
}

/**
 * Ajusta o layout do editor (chamado em eventos)
 */
export function adjustEditorLayout() {
    updateLineNumbers();
    
    const editor = document.getElementById('jsonEditor');
    const jsonContainer = document.querySelector('.json-container'); // Mudado aqui também
    
    if (!editor || !jsonContainer) return;
    
    // Verifica se há necessidade de scroll horizontal
    const lines = editor.value.split('\n');
    const editorWidth = editor.clientWidth;
    
    // Cria elemento temporário para medir largura do texto
    const tempSpan = document.createElement('span');
    tempSpan.style.fontFamily = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";
    tempSpan.style.fontSize = '13px';
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'pre';
    tempSpan.style.pointerEvents = 'none';
    document.body.appendChild(tempSpan);
    
    let maxLineWidth = 0;
    for (const line of lines) {
        tempSpan.textContent = line;
        const width = tempSpan.offsetWidth;
        if (width > maxLineWidth) maxLineWidth = width;
    }
    
    document.body.removeChild(tempSpan);
    
    // Adiciona padding
    const totalWidth = maxLineWidth + 32; // 16px padding-left + 16px padding-right
    
    // Se alguma linha for mais larga que o editor, ajusta
    if (totalWidth > editorWidth) {
        console.log(`📏 Linha larga detectada: ${totalWidth}px > ${editorWidth}px`);
        
        // Força o container a mostrar scroll horizontal
        if (jsonContainer.scrollWidth <= jsonContainer.clientWidth) {
            // Cria um div fantasma para forçar largura
            const phantomDiv = document.createElement('div');
            phantomDiv.style.width = (totalWidth + 100) + 'px';
            phantomDiv.style.height = '1px';
            phantomDiv.style.position = 'absolute';
            phantomDiv.style.visibility = 'hidden';
            
            const editorWrapper = document.querySelector('.json-editor-wrapper');
            if (editorWrapper) {
                editorWrapper.appendChild(phantomDiv);
                setTimeout(() => {
                    if (phantomDiv.parentNode) {
                        phantomDiv.parentNode.removeChild(phantomDiv);
                    }
                }, 100);
            }
        }
    }
}

/**
 * Destaca uma linha específica
 * @param {number} lineNumber - Número da linha a destacar
 * @param {string} type - Tipo de highlight ('error', 'warning', 'info')
 */
export function highlightLine(lineNumber, type = 'error') {
    const lineNumbers = document.getElementById('lineNumbers');
    if (!lineNumbers) return;
    
    // Remove destaque anterior
    const lines = lineNumbers.querySelectorAll('div');
    lines.forEach(line => {
        line.className = '';
    });
    
    // Aplica o novo destaque
    if (lineNumber > 0 && lineNumber <= lines.length) {
        const lineElement = lines[lineNumber - 1];
        lineElement.classList.add(`${type}-line`);
        
        // Scroll para a linha
        scrollToLine(lineNumber);
    }
}

/**
 * Faz scroll para uma linha específica
 * @param {number} lineNumber - Número da linha
 */
function scrollToLine(lineNumber) {
    const jsonContainer = document.querySelector('.json-container'); // Mudado aqui
    if (!jsonContainer) return;
    
    const lineHeight = 20;
    const scrollPosition = (lineNumber - 1) * lineHeight;
    
    jsonContainer.scrollTo({ // Mudado aqui
        top: Math.max(0, scrollPosition - 100),
        behavior: 'smooth'
    });
}

/**
 * Encontra a linha de um erro no JSON
 * @param {string} jsonString - String JSON com erro
 * @param {Error} error - Objeto de erro
 * @returns {number} Número da linha ou -1 se não encontrado
 */
export function findErrorLine(jsonString, error) {
    if (!error || !error.message || !jsonString) return -1;
    
    try {
        // Padrões comuns em mensagens de erro
        const patterns = [
            /position (\d+)/,
            /at line (\d+)/,
            /line (\d+)/,
            /linha (\d+)/
        ];
        
        for (const pattern of patterns) {
            const match = error.message.match(pattern);
            if (match && match[1]) {
                return parseInt(match[1]);
            }
        }
        
        // Fallback: conta linhas até a posição
        if (error.message.includes('position')) {
            const positionMatch = error.message.match(/position (\d+)/);
            if (positionMatch) {
                const position = parseInt(positionMatch[1]);
                const lines = jsonString.substring(0, position).split('\n');
                return lines.length;
            }
        }
    } catch (e) {
        console.error('Erro ao encontrar linha:', e);
    }
    
    return -1;
}

// ==================== INICIALIZAÇÃO DO EDITOR ====================

/**
 * Inicializa o editor JSON
 */
export function initJSONEditor() {
    console.log('🚀 Inicializando editor JSON...');
    
    if (isInitialized) {
        console.log('⚠️ Editor já inicializado');
        return;
    }
    
    const editor = document.getElementById('jsonEditor');
    if (!editor) {
        console.error('❌ Elemento #jsonEditor não encontrado!');
        return;
    }
    
    // Configurações iniciais
    editor.spellcheck = false;
    editor.autocomplete = 'off';
    editor.autocorrect = 'off';
    editor.autocapitalize = 'off';
    
    // Carrega dados iniciais
    const systemData = window.systemData || {};
    let initialContent = '';
    
    if (Object.keys(systemData).length > 0) {
        // Formata os dados existentes
        try {
            initialContent = JSON.stringify(systemData, null, 2);
            console.log('📁 Dados do sistema carregados');
        } catch (error) {
            console.warn('⚠️ Erro ao formatar dados iniciais:', error);
            initialContent = '{\n  "constants": {},\n  "machines": [],\n  "materials": {},\n  "empresas": []\n}';
        }
    } else {
        // Conteúdo inicial padrão
        initialContent = '{\n  "constants": {},\n  "machines": [],\n  "materials": {},\n  "empresas": []\n}';
        console.log('📄 Usando template inicial');
    }
    
    editor.value = initialContent;
    
    // Configura eventos
    editor.addEventListener('input', function() {
        updateLineNumbers();
        adjustEditorLayout();
        
        // Marca que há mudanças pendentes
        window.hasPendingChanges = true;
        updateApplyButtonState();
    });
    
    // Observa redimensionamento da janela
    window.addEventListener('resize', function() {
        setTimeout(() => {
            updateLineNumbers();
            adjustEditorLayout();
        }, 100);
    });
    
    // Configura detecção de ativação da tab
    setupTabActivation();
    
    // Inicialização inicial
    setTimeout(() => {
        updateLineNumbers();
        adjustEditorLayout();
        updateJSONStatus('✅ Editor JSON pronto. Digite ou cole seu JSON.', 'success');
        
        // Verificação final do scroll
        setTimeout(() => {
            const jsonContainer = document.querySelector('.json-container'); // Mudado aqui
            if (jsonContainer) {
                const hasScroll = jsonContainer.scrollHeight > jsonContainer.clientHeight;
                console.log(`✅ Scroll verificado: ${hasScroll ? 'ATIVO' : 'INATIVO'}`);
            }
        }, 500);
        
    }, 100);
    
    isInitialized = true;
    console.log('✅ Editor JSON inicializado com sucesso');
}

/**
 * Configura detecção de ativação da tab
 */
function setupTabActivation() {
    // Detecta quando qualquer tab é clicada
    document.addEventListener('click', function(event) {
        const target = event.target;
        const isTab = target.classList.contains('tab');
        const isTabChild = target.closest('.tab');
        const tabElement = isTab ? target : (isTabChild ? isTabChild : null);
        
        if (tabElement) {
            const tabText = tabElement.textContent.toLowerCase();
            if (tabText.includes('json') || tabText.includes('raw') || tabText.includes('bruto')) {
                console.log('🎯 Tab JSON ativada, ajustando layout...');
                
                // Pequeno delay para garantir renderização
                setTimeout(() => {
                    updateLineNumbers();
                    adjustEditorLayout();
                }, 200);
            }
        }
    });
}

// ==================== FUNÇÕES DE FORMATAR/VALIDAR ====================

/**
 * Formata o JSON no editor
 */
export function formatJSON() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) return;
    
    try {
        const parsed = JSON.parse(editor.value);
        editor.value = JSON.stringify(parsed, null, 2);
        
        updateLineNumbers();
        adjustEditorLayout();
        highlightLine(-1); // Remove highlight
        updateJSONStatus('✅ JSON formatado com sucesso!', 'success');
        
        // Marca que há mudanças
        window.hasPendingChanges = true;
        updateApplyButtonState();
        
    } catch (error) {
        const errorLine = findErrorLine(editor.value, error);
        
        if (errorLine > 0) {
            highlightLine(errorLine, 'error');
        }
        
        updateJSONStatus(`❌ Erro de formatação: ${error.message}`, 'error');
    }
}

/**
 * Valida o JSON no editor
 * @returns {boolean} true se válido, false se inválido
 */
export function validateJSON() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) return false;
    
    try {
        const parsed = JSON.parse(editor.value);
        
        // Valida estrutura básica
        const validation = validateJSONStructure(parsed);
        
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        
        highlightLine(-1); // Remove highlight
        updateJSONStatus('✅ JSON válido e com estrutura correta', 'success');
        return true;
        
    } catch (error) {
        const errorLine = findErrorLine(editor.value, error);
        
        if (errorLine > 0) {
            highlightLine(errorLine, 'error');
        }
        
        updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Valida a estrutura do JSON
 * @param {object} data - Dados JSON
 * @returns {object} Resultado da validação
 */
export function validateJSONStructure(data) {
    const errors = [];
    
    if (!data.constants || typeof data.constants !== 'object') {
        errors.push('"constants" deve ser um objeto');
    }
    
    if (!data.machines || !Array.isArray(data.machines)) {
        errors.push('"machines" deve ser um array');
    }
    
    if (!data.materials || typeof data.materials !== 'object') {
        errors.push('"materials" deve ser um objeto');
    }
    
    if (!data.empresas || !Array.isArray(data.empresas)) {
        errors.push('"empresas" deve ser um array');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Atualiza a mensagem de status
 * @param {string} message - Mensagem a mostrar
 * @param {string} type - Tipo ('success', 'error', 'warning', 'info')
 */
export function updateJSONStatus(message, type = 'info') {
    const status = document.getElementById('jsonStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = 'json-status';
    status.classList.add(type);
}

/**
 * Atualiza o estado do botão "Aplicar JSON"
 */
export function updateApplyButtonState() {
    const applyButton = document.getElementById('applyJsonBtn');
    if (!applyButton) {
        console.warn('⚠️ Botão applyJsonBtn não encontrado');
        return;
    }
    
    if (window.hasPendingChanges) {
        applyButton.disabled = false;
        applyButton.classList.remove('disabled');
        applyButton.innerHTML = '<i class="icon-check"></i> Aplicar JSON';
        applyButton.title = 'Aplicar alterações do JSON';
        console.log('🔄 Botão "Aplicar JSON" ativado');
    } else {
        applyButton.disabled = true;
        applyButton.classList.add('disabled');
        applyButton.innerHTML = '<i class="icon-check"></i> Nada para aplicar';
        applyButton.title = 'Nenhuma alteração pendente';
    }
}

/**
 * Converte arquivo para base64
 * @param {File} file - Arquivo a converter
 * @returns {Promise<string>} Promise com base64
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

/**
 * Limpa e reinicializa o editor
 */
export function resetJSONEditor() {
    console.log('🔄 Reinicializando editor JSON...');
    
    isInitialized = false;
    
    const editor = document.getElementById('jsonEditor');
    if (editor) {
        editor.value = '{\n  "constants": {},\n  "machines": [],\n  "materials": {},\n  "empresas": []\n}';
    }
    
    const lineNumbers = document.getElementById('lineNumbers');
    if (lineNumbers) {
        lineNumbers.innerHTML = '';
    }
    
    // Re-inicializa após um breve delay
    setTimeout(initJSONEditor, 100);
}

/**
 * Função para forçar atualização de layout (útil para debugging)
 */
export function forceLayoutUpdate() {
    console.log('🔧 Forçando atualização de layout...');
    updateLineNumbers();
    adjustEditorLayout();
}

// ==================== FUNÇÕES DE IMPORT/EXPORT ====================

/**
 * Exporta dados para JSON
 */
export function exportToJSON() {
    try {
        const systemData = window.systemData || {};
        const dataStr = JSON.stringify(systemData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `sistema_dados_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        updateJSONStatus('✅ JSON exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar JSON:', error);
        updateJSONStatus('❌ Erro ao exportar JSON.', 'error');
    }
}

/**
 * Importa dados de JSON
 */
export function importFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validar estrutura básica
                const validation = validateJSONStructure(importedData);
                
                if (!validation.valid) {
                    throw new Error(validation.errors.join('; '));
                }
                
                // Armazenar em staging
                window.stagingData = importedData;
                window.hasPendingChanges = true;
                
                // Exibir no editor JSON Bruto
                const editor = document.getElementById('jsonEditor');
                if (editor) {
                    editor.value = JSON.stringify(importedData, null, 2);
                    updateLineNumbers();
                    adjustEditorLayout();
                }
                
                updateJSONStatus('JSON carregado na área de staging. Clique em "Aplicar JSON" para confirmar.', 'warning');
                updateApplyButtonState();
                
            } catch (error) {
                console.error('Erro ao importar JSON:', error);
                updateJSONStatus(`❌ Erro ao importar JSON: ${error.message}`, 'error');
            }
        };
        
        reader.onerror = function() {
            updateJSONStatus('❌ Erro ao ler o arquivo.', 'error');
        };
        
        reader.readAsText(file);
    };
    
    document.body.appendChild(input);
    input.click();
    
    setTimeout(() => {
        if (document.body.contains(input)) {
            document.body.removeChild(input);
        }
    }, 100);
}

// ==================== FUNÇÃO APLICAR JSON ====================

/**
 * Aplica o JSON do editor ao sistema
 */
export async function applyJSON() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) {
        updateJSONStatus('❌ Editor JSON não encontrado', 'error');
        return;
    }
    
    try {
        const proposedData = JSON.parse(editor.value);
        const validation = validateJSONStructure(proposedData);
        
        if (!validation.valid) {
            updateJSONStatus('❌ JSON inválido. Corrija os erros antes de aplicar.', 'error');
            return;
        }
        
        // Confirmação (simplificada)
        const confirmed = confirm('Deseja aplicar as alterações do JSON ao sistema?');
        
        if (!confirmed) {
            updateJSONStatus('Aplicação cancelada pelo usuário.', 'info');
            return;
        }
        
        // Aplica os dados
        window.systemData = proposedData;
        window.stagingData = null;
        window.hasPendingChanges = false;
        
        // Dispara evento de dados aplicados
        window.dispatchEvent(new CustomEvent('dataApplied', { 
            detail: { data: proposedData } 
        }));
        
        // Atualiza UI
        updateApplyButtonState();
        updateJSONStatus('✅ JSON aplicado ao sistema com sucesso!', 'success');
        
        // Atualiza outras tabs se as funções existirem
        if (window.loadConstants) window.loadConstants();
        if (window.loadMachines) window.loadMachines();
        if (window.loadMaterials) window.loadMaterials();
        if (window.loadEmpresas) window.loadEmpresas();
        
    } catch (error) {
        console.error('Erro ao aplicar JSON:', error);
        updateJSONStatus(`❌ Erro ao aplicar JSON: ${error.message}`, 'error');
    }
}

// ==================== FUNÇÕES DE DEBUG ====================

/**
 * Debug do scroll (chamar no console)
 */
window.debugScroll = function() {
    console.log('=== DEBUG SCROLL ===');
    
    const jsonContainer = document.querySelector('.json-container'); // Mudado aqui
    const editor = document.getElementById('jsonEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    
    if (!jsonContainer || !editor || !lineNumbers) {
        console.error('❌ Elementos não encontrados');
        return;
    }
    
    console.log(`📊 jsonContainer: ${jsonContainer.clientWidth}x${jsonContainer.clientHeight}`);
    console.log(`📊 jsonContainer scroll: ${jsonContainer.scrollWidth}x${jsonContainer.scrollHeight}`);
    console.log(`📊 Editor: ${editor.clientWidth}x${editor.clientHeight}`);
    console.log(`📊 Editor scroll: ${editor.scrollWidth}x${editor.scrollHeight}`);
    console.log(`📊 LineNumbers: ${lineNumbers.clientWidth}x${lineNumbers.clientHeight}`);
    
    const hasVerticalScroll = jsonContainer.scrollHeight > jsonContainer.clientHeight;
    const hasHorizontalScroll = jsonContainer.scrollWidth > jsonContainer.clientWidth;
    
    console.log(`📊 Scroll vertical: ${hasVerticalScroll ? '✅ ATIVO' : '❌ INATIVO'}`);
    console.log(`📊 Scroll horizontal: ${hasHorizontalScroll ? '✅ ATIVO' : '❌ INATIVO'}`);
    
    if (!hasVerticalScroll) {
        console.log('💡 Dica: Adicione mais linhas para ativar scroll vertical');
    }
    
    if (!hasHorizontalScroll) {
        console.log('💡 Dica: Adicione uma linha longa para ativar scroll horizontal');
        console.log('💡 Exemplo: "chave_muito_longa": "valor_ainda_mais_longo_que_ultrapassa_a_largura"');
    }
};

/**
 * Testa scroll horizontal automaticamente
 */
window.testHorizontalScroll = function() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) return;
    
    const testContent = `{
  "chave_normal": "valor",
  "uma_chave_extremamente_longa_que_vai_forcar_o_scroll_horizontal_a_aparecer_quando_voce_digitar_uma_linha_muito_longa": "este_valor_tambem_e_muito_longo_para_garantir_que_o_scroll_horizontal_funcione_corretamente",
  "outra_chave": "valor"
}`;
    
    editor.value = testContent;
    updateLineNumbers();
    adjustEditorLayout();
    console.log('✅ Teste de scroll horizontal aplicado!');
};

// ==================== EXPORTAÇÃO GLOBAL ====================

// Torna as funções disponíveis globalmente
window.updateLineNumbers = updateLineNumbers;
window.highlightLine = highlightLine;
window.formatJSON = formatJSON;
window.validateJSON = validateJSON;
window.updateJSONStatus = updateJSONStatus;
window.resetJSONEditor = resetJSONEditor;
window.forceLayoutUpdate = forceLayoutUpdate;
window.exportToJSON = exportToJSON;
window.importFromJSON = importFromJSON;
window.applyJSON = applyJSON;
window.initJSONEditor = initJSONEditor;

// Inicialização automática quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM carregado, inicializando editor...');
        setTimeout(initJSONEditor, 300);
    });
} else {
    console.log('📄 DOM já carregado, inicializando editor...');
    setTimeout(initJSONEditor, 300);
}

// Inicializa quando os dados do sistema são carregados
window.addEventListener('dataLoaded', function() {
    console.log('📂 Dados carregados, atualizando editor...');
    setTimeout(() => {
        resetJSONEditor();
        updateApplyButtonState();
    }, 200);
});

window.addEventListener('dataImported', function() {
    console.log('📥 Dados importados, atualizando editor...');
    setTimeout(() => {
        resetJSONEditor();
        updateApplyButtonState();
    }, 200);
});

window.addEventListener('dataApplied', function() {
    console.log('✅ Dados aplicados, atualizando editor...');
    setTimeout(() => {
        resetJSONEditor();
        updateApplyButtonState();
    }, 200);
});

/* ==== FIM: json-editor.js ==== */