/**
 * main.js
 * Entry point da Página 2 - Gerenciamento de Obras
 */

import { bootstrapManagerApplication } from './core/app.js';

// Carregar stubs seguros primeiro
import './utils/global-stubs.js';

/**
 * Inicialização quando o DOM estiver pronto
 */
function initialize() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrapManagerApplication);
    } else {
        bootstrapManagerApplication();
    }
}

// Inicializar aplicação
initialize();

// Disponibilizar globalmente para debug
window.bootstrapManagerApplication = bootstrapManagerApplication;

console.log('🚀 Página 2 - Gerenciamento de Obras carregada');