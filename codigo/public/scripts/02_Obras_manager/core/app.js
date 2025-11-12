/**
 * core/app.js
 * Bootstrap e inicialização da Página 2
 */

import { initializeManagerInterface } from '../ui/interface.js';
import { showSystemStatus } from '../../01_Create_Obra/ui/components/status.js';

/**
 * Bootstrap da aplicação da Página 2
 */
export function bootstrapManagerApplication() {
    console.log('🎯 Iniciando bootstrap da Página 2 (Gerenciamento)...');
    
    // Verificar se já está inicializado
    if (window.managerInitialized) {
        console.log('⚠️ Gerenciador já inicializado');
        return;
    }
    
    try {
        // 1. Configurar contexto global
        window.managerContext = {
            page: 'manager',
            version: '2.0.0',
            timestamp: new Date().toISOString()
        };
        
        // 2. Inicializar interface
        initializeManagerInterface();
        
        // 3. Marcar como inicializado
        window.managerInitialized = true;
        
        console.log('✅ Bootstrap da Página 2 concluído');
        showSystemStatus('Gerenciamento de obras carregado', 'success');
        
    } catch (error) {
        console.error('❌ Erro no bootstrap da Página 2:', error);
        showSystemStatus('Erro ao carregar gerenciamento', 'error');
    }
}

/**
 * Reinicializa o gerenciador
 */
export function reinitializeManager() {
    console.log('🔄 Reinicializando gerenciador...');
    
    window.managerInitialized = false;
    
    // Limpar interface
    if (typeof clearManagerInterface === 'function') {
        clearManagerInterface();
    }
    
    // Recarregar
    setTimeout(bootstrapManagerApplication, 500);
}

/**
 * Status do gerenciador
 */
export function getManagerStatus() {
    return {
        initialized: !!window.managerInitialized,
        context: window.managerContext || {},
        obrasCount: document.querySelectorAll('.obra-block').length,
        timestamp: new Date().toISOString()
    };
}