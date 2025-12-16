/* ==== json-editor.js ==== */
// json-editor.js - VERSÃO OTIMIZADA PARA PERFORMANCE

// ==================== ESTADO GLOBAL ====================
window.stagingData = null;
window.hasPendingChanges = false;
let isInitialized = false;

// ==================== OTIMIZAÇÕES ====================
let updateTimeout = null;
let layoutTimeout = null;
let lastLineCount = 0;

// Cache de elementos DOM
let domCache = {
    editor: null,
    lineNumbers: null,
    jsonContainer: null,
    applyButton: null,
    status: null
};

/**
 * Inicializa o cache de elementos DOM
 */
function initDomCache() {
    domCache.editor = document.getElementById('jsonEditor');
    domCache.lineNumbers = document.getElementById('lineNumbers');
    domCache.jsonContainer = document.querySelector('.json-container');
    domCache.applyButton = document.getElementById('applyJsonBtn');
    domCache.status = document.getElementById('jsonStatus');
}

// ==================== FUNÇÕES PRINCIPAIS (OTIMIZADAS) ====================

/**
 * Atualiza os números das linhas com debouncing
 */
export function updateLineNumbers() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }
    
    updateTimeout = setTimeout(() => {
        _updateLineNumbers();
    }, 50); // Debounce de 50ms
}

/**
 * Função interna de atualização de números de linha
 */
function _updateLineNumbers() {
    if (!domCache.editor || !domCache.lineNumbers || !domCache.jsonContainer) {
        initDomCache();
        if (!domCache.editor || !domCache.lineNumbers) return;
    }
    
    try {
        const text = domCache.editor.value;
        const lines = text.split('\n');
        const totalLines = Math.max(lines.length, 1);
        
        // Só atualiza se o número de linhas mudou
        if (totalLines === lastLineCount && lastLineCount > 0) {
            return;
        }
        
        lastLineCount = totalLines;
        
        // Gera os números das linhas de forma eficiente
        let numbersHTML = '';
        for (let i = 1; i <= totalLines; i++) {
            numbersHTML += `<div data-line="${i}">${i}</div>`;
        }
        
        // Atualiza o HTML de uma vez
        domCache.lineNumbers.innerHTML = numbersHTML;
        
        // Calcula altura de forma otimizada
        const lineHeight = 20;
        const padding = 32;
        const contentHeight = (totalLines * lineHeight) + padding;
        const finalHeight = Math.max(contentHeight, 200);
        
        // Aplica alturas de forma otimizada
        domCache.editor.style.height = finalHeight + 'px';
        domCache.lineNumbers.style.height = finalHeight + 'px';
        
        // Verificação de container em um timeout separado
        setTimeout(() => {
            if (domCache.jsonContainer && finalHeight < domCache.jsonContainer.clientHeight) {
                const containerHeight = domCache.jsonContainer.clientHeight;
                domCache.editor.style.height = containerHeight + 'px';
                domCache.lineNumbers.style.height = containerHeight + 'px';
            }
        }, 0);
        
    } catch (error) {
        console.error('Erro ao atualizar números das linhas:', error);
    }
}

/**
 * Ajusta o layout do editor com debouncing
 */
export function adjustEditorLayout() {
    if (layoutTimeout) {
        clearTimeout(layoutTimeout);
    }
    
    layoutTimeout = setTimeout(() => {
        _adjustEditorLayout();
    }, 100); // Debounce maior para layout (mais pesado)
}

/**
 * Função interna de ajuste de layout
 */
function _adjustEditorLayout() {
    // Atualiza números primeiro
    _updateLineNumbers();
    
    if (!domCache.editor || !domCache.jsonContainer) return;
    
    // Verifica se há necessidade de scroll horizontal
    const lines = domCache.editor.value.split('\n');
    if (lines.length > 100) {
        // Para arquivos muito grandes, não verifica largura linha por linha
        return;
    }
    
    // Medição de largura otimizada
    const tempSpan = document.createElement('span');
    tempSpan.style.cssText = `
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 13px;
        visibility: hidden;
        position: absolute;
        white-space: pre;
        pointer-events: none;
    `;
    document.body.appendChild(tempSpan);
    
    let maxLineWidth = 0;
    // Limita a verificação às primeiras 1000 linhas para performance
    const linesToCheck = Math.min(lines.length, 1000);
    for (let i = 0; i < linesToCheck; i++) {
        tempSpan.textContent = lines[i];
        maxLineWidth = Math.max(maxLineWidth, tempSpan.offsetWidth);
    }
    
    document.body.removeChild(tempSpan);
    
    // Verifica se precisa de scroll horizontal
    const totalWidth = maxLineWidth + 32;
    if (totalWidth > domCache.editor.clientWidth) {
        // Força scroll horizontal se necessário
        if (domCache.jsonContainer.scrollWidth <= domCache.jsonContainer.clientWidth) {
            setTimeout(() => {
                if (domCache.jsonContainer) {
                    domCache.jsonContainer.style.overflowX = 'auto';
                }
            }, 50);
        }
    }
}

/**
 * Destaca uma linha específica
 */
export function highlightLine(lineNumber, type = 'error') {
    if (!domCache.lineNumbers) {
        initDomCache();
        if (!domCache.lineNumbers) return;
    }
    
    const lines = domCache.lineNumbers.querySelectorAll('div');
    
    // Apenas atualiza se necessário
    let needsUpdate = false;
    lines.forEach((line, index) => {
        const shouldBeHighlighted = (index === lineNumber - 1);
        const isHighlighted = line.classList.contains(`${type}-line`);
        
        if (shouldBeHighlighted !== isHighlighted) {
            needsUpdate = true;
        }
    });
    
    if (!needsUpdate) return;
    
    // Atualiza destaque
    lines.forEach(line => {
        line.className = '';
    });
    
    if (lineNumber > 0 && lineNumber <= lines.length) {
        const lineElement = lines[lineNumber - 1];
        lineElement.classList.add(`${type}-line`);
        
        scrollToLine(lineNumber);
    }
}

/**
 * Faz scroll para uma linha específica
 */
function scrollToLine(lineNumber) {
    if (!domCache.jsonContainer) {
        initDomCache();
        if (!domCache.jsonContainer) return;
    }
    
    const lineHeight = 20;
    const scrollPosition = (lineNumber - 1) * lineHeight;
    
    domCache.jsonContainer.scrollTo({
        top: Math.max(0, scrollPosition - 100),
        behavior: 'smooth'
    });
}

// ==================== INICIALIZAÇÃO DO EDITOR (OTIMIZADA) ====================

/**
 * Inicializa o editor JSON
 */
export function initJSONEditor() {
    console.log('🚀 Inicializando editor JSON (otimizado)...');
    
    if (isInitialized) {
        console.log('⚠️ Editor já inicializado');
        return;
    }
    
    initDomCache();
    
    if (!domCache.editor) {
        console.error('❌ Elemento #jsonEditor não encontrado!');
        return;
    }
    
    // Configurações iniciais
    domCache.editor.spellcheck = false;
    domCache.editor.autocomplete = 'off';
    domCache.editor.autocorrect = 'off';
    domCache.editor.autocapitalize = 'off';
    
    // Carrega dados iniciais
    const systemData = window.systemData || {};
    let initialContent = '';
    
    if (Object.keys(systemData).length > 0) {
        try {
            initialContent = JSON.stringify(systemData, null, 2);
        } catch (error) {
            initialContent = '{\n  "constants": {},\n  "machines": [],\n  "materials": {},\n  "empresas": []\n}';
        }
    } else {
        initialContent = '{\n  "constants": {},\n  "machines": [],\n  "materials": {},\n  "empresas": []\n}';
    }
    
    domCache.editor.value = initialContent;
    
    // Eventos otimizados
    domCache.editor.addEventListener('input', function() {
        // Marca que há mudanças pendentes
        window.hasPendingChanges = true;
        updateApplyButtonState();
        
        // Atualizações otimizadas
        updateLineNumbers(); // Debounced
        adjustEditorLayout(); // Debounced
    });
    
    // Evento de teclas para melhor performance
    let lastKeyTime = 0;
    domCache.editor.addEventListener('keydown', function(e) {
        const now = Date.now();
        const timeSinceLastKey = now - lastKeyTime;
        lastKeyTime = now;
        
        // Para teclas de navegação, não faz update pesado
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
            if (timeSinceLastKey > 100) { // Se foi uma pausa
                updateLineNumbers();
            }
        }
    });
    
    // Observa redimensionamento com debouncing
    let resizeTimeout;
    window.addEventListener('resize', function() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateLineNumbers();
            adjustEditorLayout();
        }, 200);
    });
    
    // Configura detecção de ativação da tab
    setupTabActivation();
    
    // Inicialização inicial
    setTimeout(() => {
        _updateLineNumbers(); // Chamada direta (sem debouncing)
        adjustEditorLayout(); // Com debouncing
        
        updateJSONStatus('✅ Editor JSON pronto. Digite ou cole seu JSON.', 'success');
        
        setTimeout(() => {
            if (domCache.jsonContainer) {
                const hasScroll = domCache.jsonContainer.scrollHeight > domCache.jsonContainer.clientHeight;
                console.log(`✅ Scroll verificado: ${hasScroll ? 'ATIVO' : 'INATIVO'}`);
            }
        }, 500);
        
    }, 100);
    
    isInitialized = true;
    console.log('✅ Editor JSON inicializado com sucesso');
}

// ==================== FUNÇÕES RESTANTES (OTIMIZADAS) ====================

/**
 * Configura detecção de ativação da tab
 */
function setupTabActivation() {
    let tabClickTimeout;
    
    document.addEventListener('click', function(event) {
        const target = event.target;
        const isTab = target.classList.contains('tab');
        const isTabChild = target.closest('.tab');
        const tabElement = isTab ? target : (isTabChild ? isTabChild : null);
        
        if (tabElement) {
            const tabText = tabElement.textContent.toLowerCase();
            if (tabText.includes('json') || tabText.includes('raw') || tabText.includes('bruto')) {
                if (tabClickTimeout) clearTimeout(tabClickTimeout);
                tabClickTimeout = setTimeout(() => {
                    forceLayoutUpdate();
                }, 100);
            }
        }
    });
}

/**
 * Função para forçar atualização de layout
 */
export function forceLayoutUpdate() {
    console.log('🔧 Forçando atualização de layout...');
    _updateLineNumbers();
    _adjustEditorLayout();
}

/**
 * Atualiza o estado do botão "Aplicar JSON"
 */
export function updateApplyButtonState() {
    if (!domCache.applyButton) {
        initDomCache();
        if (!domCache.applyButton) {
            console.warn('⚠️ Botão applyJsonBtn não encontrado');
            return;
        }
    }
    
    if (window.hasPendingChanges) {
        domCache.applyButton.disabled = false;
        domCache.applyButton.classList.remove('disabled');
        domCache.applyButton.innerHTML = '<i class="icon-check"></i> Aplicar JSON';
        domCache.applyButton.title = 'Aplicar alterações do JSON';
    } else {
        domCache.applyButton.disabled = true;
        domCache.applyButton.classList.add('disabled');
        domCache.applyButton.innerHTML = '<i class="icon-check"></i> Nada para aplicar';
        domCache.applyButton.title = 'Nenhuma alteração pendente';
    }
}

/**
 * Atualiza a mensagem de status
 */
export function updateJSONStatus(message, type = 'info') {
    if (!domCache.status) {
        initDomCache();
        if (!domCache.status) return;
    }
    
    domCache.status.textContent = message;
    domCache.status.className = 'json-status';
    domCache.status.classList.add(type);
}

// ==================== FUNÇÕES DE FORMATAR/VALIDAR ====================

/**
 * Formata o JSON no editor
 */
export function formatJSON() {
    if (!domCache.editor) return;
    
    try {
        const parsed = JSON.parse(domCache.editor.value);
        domCache.editor.value = JSON.stringify(parsed, null, 2);
        
        forceLayoutUpdate();
        highlightLine(-1);
        updateJSONStatus('✅ JSON formatado com sucesso!', 'success');
        
        window.hasPendingChanges = true;
        updateApplyButtonState();
        
    } catch (error) {
        const errorLine = findErrorLine(domCache.editor.value, error);
        if (errorLine > 0) {
            highlightLine(errorLine, 'error');
        }
        updateJSONStatus(`❌ Erro de formatação: ${error.message}`, 'error');
    }
}

/**
 * Valida o JSON no editor
 */
export function validateJSON() {
    if (!domCache.editor) return false;
    
    try {
        const parsed = JSON.parse(domCache.editor.value);
        const validation = validateJSONStructure(parsed);
        
        if (!validation.valid) {
            throw new Error(validation.errors.join('; '));
        }
        
        highlightLine(-1);
        updateJSONStatus('✅ JSON válido e com estrutura correta', 'success');
        return true;
        
    } catch (error) {
        const errorLine = findErrorLine(domCache.editor.value, error);
        if (errorLine > 0) {
            highlightLine(errorLine, 'error');
        }
        updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Encontra a linha de um erro no JSON (mantida igual)
 */
export function findErrorLine(jsonString, error) {
    if (!error || !error.message || !jsonString) return -1;
    
    try {
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

/**
 * Valida a estrutura do JSON (mantida igual)
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

// ==================== FUNÇÕES RESTANTES (MANTIDAS) ====================

/**
 * Converte arquivo para base64
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
    
    if (domCache.editor) {
        domCache.editor.value = '{\n  "constants": {},\n  "machines": [],\n  "materials": {},\n  "empresas": []\n}';
    }
    
    if (domCache.lineNumbers) {
        domCache.lineNumbers.innerHTML = '';
    }
    
    setTimeout(initJSONEditor, 100);
}

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
                const validation = validateJSONStructure(importedData);
                
                if (!validation.valid) {
                    throw new Error(validation.errors.join('; '));
                }
                
                window.stagingData = importedData;
                window.hasPendingChanges = true;
                
                if (domCache.editor) {
                    domCache.editor.value = JSON.stringify(importedData, null, 2);
                    forceLayoutUpdate();
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

/**
 * Aplica o JSON do editor ao sistema
 */
export async function applyJSON() {
    if (!domCache.editor) {
        updateJSONStatus('❌ Editor JSON não encontrado', 'error');
        return;
    }
    
    try {
        const proposedData = JSON.parse(domCache.editor.value);
        const validation = validateJSONStructure(proposedData);
        
        if (!validation.valid) {
            updateJSONStatus('❌ JSON inválido. Corrija os erros antes de aplicar.', 'error');
            return;
        }
        
        const confirmed = confirm('Deseja aplicar as alterações do JSON ao sistema?');
        
        if (!confirmed) {
            updateJSONStatus('Aplicação cancelada pelo usuário.', 'info');
            return;
        }
        
        window.systemData = proposedData;
        window.stagingData = null;
        window.hasPendingChanges = false;
        
        window.dispatchEvent(new CustomEvent('dataApplied', { 
            detail: { data: proposedData } 
        }));
        
        updateApplyButtonState();
        updateJSONStatus('✅ JSON aplicado ao sistema com sucesso!', 'success');
        
        if (window.loadConstants) window.loadConstants();
        if (window.loadMachines) window.loadMachines();
        if (window.loadMaterials) window.loadMaterials();
        if (window.loadEmpresas) window.loadEmpresas();
        
    } catch (error) {
        console.error('Erro ao aplicar JSON:', error);
        updateJSONStatus(`❌ Erro ao aplicar JSON: ${error.message}`, 'error');
    }
}

// ==================== DEBUG FUNCTIONS ====================

window.debugScroll = function() {
    console.log('=== DEBUG SCROLL ===');
    
    initDomCache();
    
    if (!domCache.jsonContainer || !domCache.editor || !domCache.lineNumbers) {
        console.error('❌ Elementos não encontrados');
        return;
    }
    
    console.log(`📊 jsonContainer: ${domCache.jsonContainer.clientWidth}x${domCache.jsonContainer.clientHeight}`);
    console.log(`📊 jsonContainer scroll: ${domCache.jsonContainer.scrollWidth}x${domCache.jsonContainer.scrollHeight}`);
    console.log(`📊 Editor: ${domCache.editor.clientWidth}x${domCache.editor.clientHeight}`);
    console.log(`📊 LineNumbers: ${domCache.lineNumbers.clientWidth}x${domCache.lineNumbers.clientHeight}`);
    
    const hasVerticalScroll = domCache.jsonContainer.scrollHeight > domCache.jsonContainer.clientHeight;
    const hasHorizontalScroll = domCache.jsonContainer.scrollWidth > domCache.jsonContainer.clientWidth;
    
    console.log(`📊 Scroll vertical: ${hasVerticalScroll ? '✅ ATIVO' : '❌ INATIVO'}`);
    console.log(`📊 Scroll horizontal: ${hasHorizontalScroll ? '✅ ATIVO' : '❌ INATIVO'}`);
};

window.testHorizontalScroll = function() {
    if (!domCache.editor) return;
    
    const testContent = `{
  "chave_normal": "valor",
  "uma_chave_extremamente_longa_que_vai_forcar_o_scroll_horizontal_a_aparecer_quando_voce_digitar_uma_linha_muito_longa": "este_valor_tambem_e_muito_longo_para_garantir_que_o_scroll_horizontal_funcione_corretamente",
  "outra_chave": "valor"
}`;
    
    domCache.editor.value = testContent;
    forceLayoutUpdate();
    console.log('✅ Teste de scroll horizontal aplicado!');
};

// ==================== EXPORTAÇÃO GLOBAL ====================

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

// Inicialização automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initJSONEditor, 300);
    });
} else {
    setTimeout(initJSONEditor, 300);
}

// Event listeners otimizados
window.addEventListener('dataLoaded', function() {
    setTimeout(() => {
        resetJSONEditor();
        updateApplyButtonState();
    }, 200);
});

window.addEventListener('dataImported', function() {
    setTimeout(() => {
        resetJSONEditor();
        updateApplyButtonState();
    }, 200);
});

window.addEventListener('dataApplied', function() {
    setTimeout(() => {
        resetJSONEditor();
        updateApplyButtonState();
    }, 200);
});

/* ==== FIM: json-editor.js ==== */