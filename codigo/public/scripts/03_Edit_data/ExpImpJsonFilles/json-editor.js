/* ==== INÍCIO: config/ExpImpJsonFilles/json-editor.js ==== */
// json-editor.js - CÓDIGO COMPLETO E FUNCIONAL - VERSÃO CORRIGIDA

// ==================== ESTADO GLOBAL ====================
window.stagingData = null;
window.hasPendingChanges = false;
let isInitialized = false;
let resizeObserver = null;

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Atualiza os números das linhas DINAMICAMENTE
 */
export function updateLineNumbers() {
    console.log('🔄 Atualizando números das linhas...');
    
    const editor = document.getElementById('jsonEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    
    if (!editor || !lineNumbers) {
        console.warn('❌ Elementos do editor não encontrados');
        return;
    }
    
    try {
        // Conta as linhas do texto
        const text = editor.value;
        const lines = text.split('\n');
        const totalLines = lines.length;
        
        console.log(`📊 Total de linhas: ${totalLines}`);
        
        // Gera os números das linhas
        let numbersHTML = '';
        for (let i = 1; i <= totalLines; i++) {
            numbersHTML += `<div data-line="${i}">${i}</div>`;
        }
        
        // Atualiza o HTML
        lineNumbers.innerHTML = numbersHTML;
        
        // Ajusta as alturas
        adjustEditorHeights();
        
        // Sincroniza o scroll se necessário
        syncScrollIfNeeded();
        
    } catch (error) {
        console.error('❌ Erro ao atualizar números das linhas:', error);
    }
}

/**
 * Ajusta as alturas do editor e dos números
 */
function adjustEditorHeights() {
    const editor = document.getElementById('jsonEditor');
    const lineNumbers = document.getElementById('lineNumbers');
    const editorWrapper = document.querySelector('.json-editor-wrapper');
    
    if (!editor || !lineNumbers || !editorWrapper) return;
    
    try {
        // Calcula a altura necessária baseada no conteúdo
        const contentHeight = editor.scrollHeight;
        
        // Define alturas mínimas
        const minHeight = 200;
        const calculatedHeight = Math.max(contentHeight, minHeight);
        
        // Aplica as alturas
        editor.style.height = calculatedHeight + 'px';
        lineNumbers.style.height = calculatedHeight + 'px';
        editorWrapper.style.minHeight = calculatedHeight + 'px';
        
        console.log(`📏 Altura ajustada: ${calculatedHeight}px`);
        
    } catch (error) {
        console.error('❌ Erro ao ajustar alturas:', error);
    }
}

/**
 * Sincroniza o scroll se necessário
 */
function syncScrollIfNeeded() {
    const editor = document.getElementById('jsonEditor');
    const lineNumbersWrapper = document.querySelector('.line-numbers-wrapper');
    
    if (!editor || !lineNumbersWrapper) return;
    
    // Remove event listeners anteriores para evitar duplicação
    editor.removeEventListener('scroll', handleEditorScroll);
    
    // Adiciona novo listener
    editor.addEventListener('scroll', handleEditorScroll);
}

/**
 * Manipula o scroll do editor para sincronizar
 */
function handleEditorScroll() {
    const editor = document.getElementById('jsonEditor');
    const lineNumbersWrapper = document.querySelector('.line-numbers-wrapper');
    
    if (!editor || !lineNumbersWrapper) return;
    
    // Sincroniza a posição vertical do scroll
    lineNumbersWrapper.scrollTop = editor.scrollTop;
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
    const editor = document.getElementById('jsonEditor');
    if (!editor) return;
    
    const lineHeight = 20; // Altura de cada linha em pixels
    const scrollPosition = (lineNumber - 1) * lineHeight;
    
    editor.scrollTo({
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
        
        // Marca que há mudanças pendentes
        window.hasPendingChanges = true;
        updateApplyButtonState();
    });
    
    editor.addEventListener('scroll', handleEditorScroll);
    
    // Observa redimensionamento
    setupResizeObserver();
    
    // Inicialização inicial
    setTimeout(() => {
        updateLineNumbers();
        updateJSONStatus('✅ Editor JSON pronto. Digite ou cole seu JSON.', 'success');
        
        // Força um redimensionamento após tudo carregar
        setTimeout(() => {
            adjustEditorHeights();
        }, 200);
    }, 100);
    
    isInitialized = true;
    console.log('✅ Editor JSON inicializado com sucesso');
}

/**
 * Configura o observer para redimensionamento
 */
function setupResizeObserver() {
    const editor = document.getElementById('jsonEditor');
    const jsonContainer = document.querySelector('.json-container');
    
    if (!editor || !jsonContainer) return;
    
    // Remove observer anterior se existir
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
    
    // Cria novo observer
    resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
            adjustEditorHeights();
            updateLineNumbers();
        });
    });
    
    // Observa o container e o editor
    resizeObserver.observe(jsonContainer);
    resizeObserver.observe(editor);
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
    
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    
    // Re-inicializa após um breve delay
    setTimeout(initJSONEditor, 100);
}

// ==================== EXPORTAÇÃO GLOBAL ====================

// Torna as funções disponíveis globalmente
window.updateLineNumbers = updateLineNumbers;
window.highlightLine = highlightLine;
window.formatJSON = formatJSON;
window.validateJSON = validateJSON;
window.updateJSONStatus = updateJSONStatus;
window.resetJSONEditor = resetJSONEditor;

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

// Inicializa quando a tab JSON é ativada
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('tab') && 
        (event.target.textContent.includes('JSON') || 
         event.target.textContent.includes('Raw') ||
         event.target.getAttribute('onclick')?.includes('raw'))) {
        
        console.log('🔍 Tab JSON ativada, verificando editor...');
        setTimeout(() => {
            if (!isInitialized) {
                initJSONEditor();
            } else {
                // Atualiza números das linhas se já inicializado
                updateLineNumbers();
            }
        }, 100);
    }
});

// Re-inicializa quando os dados do sistema são carregados
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

/* ==== FIM: config/ExpImpJsonFilles/json-editor.js ==== */