/* ==== INÍCIO: json-editor.js ==== */
/* ==== json-editor.js ==== */
// json-editor.js - VERSÃO CORRIGIDA COM DUTOS COMO ARRAY
// VERSÃO SEM NÚMEROS DE LINHA

// ==================== ESTADO GLOBAL ====================
window.stagingData = null;
window.hasPendingChanges = false;
let isInitialized = false;

// ==================== OTIMIZAÇÕES ====================
let updateTimeout = null;
let layoutTimeout = null;

// Cache de elementos DOM
let domCache = {
    editor: null,
    jsonContainer: null,
    applyButton: null,
    status: null
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Inicializa o cache de elementos DOM
 */
function initDomCache() {
    domCache.editor = document.getElementById('jsonEditor');
    domCache.jsonContainer = document.querySelector('.json-container');
    domCache.applyButton = document.getElementById('applyJsonBtn');
    domCache.status = document.getElementById('jsonStatus');
}

/**
 * Valida e garante estrutura mínima do systemData (CORRIGIDA - DUTOS COMO ARRAY)
 */
function validateAndEnsureStructure(data) {
    if (!data || typeof data !== 'object') {
        data = {};
    }
    
    // Garante que todos os campos obrigatórios existam
    const requiredFields = {
        constants: {},
        machines: [],
        materials: {},
        empresas: [],
        banco_equipamentos: {},
        dutos: []  // CORRIGIDO: campo para dutos como array
    };
    
    Object.keys(requiredFields).forEach(field => {
        if (data[field] === undefined) {
            console.log(`🔍 ${field} não encontrado, criando...`);
            data[field] = Array.isArray(requiredFields[field]) ? [] : {};
        }
    });
    
    return data;
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Ajusta o layout do editor com debouncing
 */
export function adjustEditorLayout() {
    if (layoutTimeout) clearTimeout(layoutTimeout);
    
    layoutTimeout = setTimeout(() => {
        if (!domCache.editor || !domCache.jsonContainer) return;

        const lines = domCache.editor.value.split('\n');
        if (lines.length > 100) return;

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
        const linesToCheck = Math.min(lines.length, 1000);
        for (let i = 0; i < linesToCheck; i++) {
            tempSpan.textContent = lines[i];
            maxLineWidth = Math.max(maxLineWidth, tempSpan.offsetWidth);
        }

        document.body.removeChild(tempSpan);

        const totalWidth = maxLineWidth + 32;
        if (totalWidth > domCache.editor.clientWidth && 
            domCache.jsonContainer.scrollWidth <= domCache.jsonContainer.clientWidth) {
            setTimeout(() => {
                if (domCache.jsonContainer) {
                    domCache.jsonContainer.style.overflowX = 'auto';
                }
            }, 50);
        }
        
        // Ajusta altura baseada no conteúdo
        const lineHeight = 20;
        const padding = 32;
        const contentHeight = (lines.length * lineHeight) + padding;
        const finalHeight = Math.max(contentHeight, 200);
        domCache.editor.style.height = finalHeight + 'px';
        
    }, 100);
}

/**
 * Destaca uma linha específica (versão simplificada sem números de linha)
 */
export function highlightLine(lineNumber, type = 'error') {
    if (!domCache.editor) {
        initDomCache();
        if (!domCache.editor) return;
    }

    // Remove qualquer destaque anterior
    domCache.editor.classList.remove('error-line-highlight', 'warning-line-highlight');
    
    if (lineNumber > 0) {
        // Adiciona classe para destaque (se necessário implementar no CSS)
        domCache.editor.classList.add(`${type}-line-highlight`);
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
    let initialContent = '';
    
    console.log('🔍 Verificando window.systemData...');
    console.log('🔍 systemData:', window.systemData);
    
    if (window.systemData && typeof window.systemData === 'object') {
        try {
            // Valida e garante estrutura
            const validatedData = validateAndEnsureStructure(window.systemData);
            console.log('✅ Dados validados:', {
                constants: Object.keys(validatedData.constants).length,
                machines: validatedData.machines.length,
                materials: Object.keys(validatedData.materials).length,
                empresas: validatedData.empresas.length,
                banco_equipamentos: Object.keys(validatedData.banco_equipamentos).length,
                dutos: validatedData.dutos.length  // CORRIGIDO
            });
            
            initialContent = JSON.stringify(validatedData, null, 2);
            console.log('✅ Conteúdo inicial gerado');
            
        } catch (error) {
            console.error('❌ Erro ao processar systemData:', error);
            initialContent = JSON.stringify(validateAndEnsureStructure({}), null, 2);
        }
    } else {
        console.warn('⚠️ window.systemData não encontrado');
        initialContent = JSON.stringify(validateAndEnsureStructure({}), null, 2);
    }
    
    domCache.editor.value = initialContent;

    // Event listeners
    domCache.editor.addEventListener('input', () => {
        window.hasPendingChanges = true;
        updateApplyButtonState();
        adjustEditorLayout();
    });

    // Observa redimensionamento
    window.addEventListener('resize', () => {
        adjustEditorLayout();
    });

    // Inicialização inicial
    setTimeout(() => {
        adjustEditorLayout();
        updateJSONStatus('✅ Editor JSON pronto. Digite ou cole seu JSON.', 'success');
        isInitialized = true;
        console.log('✅ Editor JSON inicializado com sucesso');
    }, 100);
}

/**
 * Função para forçar atualização de layout
 */
export function forceLayoutUpdate() {
    console.log('🔧 Forçando atualização de layout...');
    adjustEditorLayout();
}

/**
 * Atualiza o estado do botão "Aplicar JSON"
 */
export function updateApplyButtonState() {
    if (!domCache.applyButton) {
        initDomCache();
        if (!domCache.applyButton) return;
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
        if (errorLine > 0) highlightLine(errorLine, 'error');
        updateJSONStatus(`❌ Erro de formatação: ${error.message}`, 'error');
    }
}

/**
 * Valida o JSON no editor (CORRIGIDA - DUTOS COMO ARRAY)
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
        if (errorLine > 0) highlightLine(errorLine, 'error');
        updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Encontra a linha de um erro no JSON
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
 * Valida a estrutura do JSON (CORRIGIDA - DUTOS COMO ARRAY)
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

    if (!data.banco_equipamentos || typeof data.banco_equipamentos !== 'object') {
        errors.push('"banco_equipamentos" deve ser um objeto');
    }

    // CORRIGIDO: dutos deve ser um array
    if (!data.dutos || !Array.isArray(data.dutos)) {
        errors.push('"dutos" deve ser um array');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

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
        if (window.systemData && typeof window.systemData === 'object') {
            const validatedData = validateAndEnsureStructure(window.systemData);
            domCache.editor.value = JSON.stringify(validatedData, null, 2);
            console.log('✅ Editor resetado com dados validados');
        }
    }

    setTimeout(initJSONEditor, 50);
}

// ==================== DEBUG FUNCTIONS ====================

window.debugSystemData = function() {
    console.log('=== DEBUG SYSTEMDATA ===');
    console.log('systemData:', window.systemData);
    console.log('Tem dutos?', 'dutos' in (window.systemData || {}));
    console.log('dutos é array?', Array.isArray(window.systemData?.dutos));
    console.log('Número de dutos:', (window.systemData?.dutos || []).length);
    console.log('Dutos detalhados:', window.systemData?.dutos);
    
    const editor = document.getElementById('jsonEditor');
    if (editor && editor.value) {
        try {
            const parsed = JSON.parse(editor.value);
            console.log('Editor tem dutos?', 'dutos' in parsed);
            console.log('Editor dutos é array?', Array.isArray(parsed?.dutos));
            console.log('Dutos no editor:', (parsed?.dutos || []).length);
            console.log('Detalhes dutos editor:', parsed?.dutos);
        } catch(e) {
            console.error('Erro ao parsear editor:', e);
        }
    }
};

// ==================== EXPORTAÇÃO GLOBAL ====================

window.highlightLine = highlightLine;
window.formatJSON = formatJSON;
window.validateJSON = validateJSON;
window.updateJSONStatus = updateJSONStatus;
window.resetJSONEditor = resetJSONEditor;
window.forceLayoutUpdate = forceLayoutUpdate;
window.initJSONEditor = initJSONEditor;
window.fileToBase64 = fileToBase64;
window.validateJSONStructure = validateJSONStructure;

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initJSONEditor, 300);
    });
} else {
    setTimeout(initJSONEditor, 300);
}

// Event listeners para recarregar dados
window.addEventListener('dataLoaded', () => {
    setTimeout(() => {
        resetJSONEditor();
        updateApplyButtonState();
    }, 200);
});

window.addEventListener('dataImported', () => {
    setTimeout(() => {
        resetJSONEditor();
        updateApplyButtonState();
    }, 200);
});

window.addEventListener('dataApplied', () => {
    setTimeout(() => {
        resetJSONEditor();
        updateApplyButtonState();
    }, 200);
});

/* ==== FIM: json-editor.js ==== */