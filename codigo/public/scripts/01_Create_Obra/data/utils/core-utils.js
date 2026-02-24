/**
 * utils/core-utils.js
 * Utilitários globais centralizados - ELIMINA DUPLICATAS
 */

// =============================================================================
// FUNÇÕES DUPLICADAS UNIFICADAS
// =============================================================================

/**
 * Aguarda até que um elemento esteja disponível no DOM
 * @param {string} selector - Seletor do elemento
 * @param {number} timeout - Timeout em milissegundos
 * @returns {Promise<HTMLElement>}
 */
function waitForElement(selector, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function check() {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Elemento encontrado: ${selector}`);
                resolve(element);
                return;
            }
            
            if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout: Elemento não encontrado - ${selector}`));
                return;
            }
            
            setTimeout(check, 12);
        }
        
        check();
    });
}

/**
 * Converte valores para número com tratamento de segurança
 * @param {any} value - Valor a ser convertido
 * @param {number} defaultValue - Valor padrão
 * @returns {number} Valor numérico
 */
function safeNumber(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') return defaultValue;
    
    // Tratamento unificado das duas implementações
    if (value !== "" && value !== undefined && value !== null) {
        return Number(value);
    }
    
    const num = parseFloat(value.toString().replace(',', '.'));
    return isNaN(num) ? defaultValue : num;
}

/**
 * Atualiza elemento de texto genérico no DOM
 * @param {string} elementId - ID do elemento a ser atualizado
 * @param {any} value - Novo valor a ser definido
 * @returns {void}
 */
function updateElementText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    } else {
        console.log(`⚠️  [DEBUG] Elemento ${elementId} não encontrado`);
    }
}

// =============================================================================
// NOVAS FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Gera um ID único baseado em timestamp e random
 * @param {string} prefix - Prefixo para o ID
 * @returns {string} ID único
 */
function generateUniqueId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Valida se um elemento existe e está no DOM
 * @param {HTMLElement} element - Elemento a validar
 * @returns {boolean}
 */
function isValidElement(element) {
    return element && element.nodeType === 1 && document.body.contains(element);
}

/**
 * Debounce function para otimizar eventos
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export {
    waitForElement,
    safeNumber, 
    updateElementText,
    generateUniqueId,
    isValidElement,
    debounce
};
