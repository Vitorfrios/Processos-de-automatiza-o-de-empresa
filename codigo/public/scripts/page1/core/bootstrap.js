// bootstrap.js
// ponto único de entrada do app (substitui main.js)

import { initializeEventBus } from './event-bus.js';
import { initializeState } from './state.js';
import { initializeInterface } from '../ui/interface.js';

export function bootstrapApplication() {
    console.log('🚀 Inicializando aplicação...');
    
    // Inicializa sistemas core
    initializeEventBus();
    initializeState();
    
    // Inicializa interface
    initializeInterface();
    
    console.log('✅ Aplicação inicializada com sucesso');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApplication);
} else {
    bootstrapApplication();
}
