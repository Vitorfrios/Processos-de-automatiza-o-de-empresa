/**
 * core/app.js
 * Bootstrap e inicialização da Página 2
 */

import { initializeManagerInterface } from '../ui/interface.js';
import { showSystemStatus } from '../../01_Create_Obra/ui/components/status.js';
import { loadSystemConstantsFromJSON } from '../data/adapters/constants-adapter.js';
// ✅ CORREÇÃO: Importar modal universal
import '../ui/components/modal/universal-modal.js';

/**
 * Bootstrap da aplicação da Página 2
 */
export async function bootstrapManagerApplication() {
    console.log('🎯 Iniciando bootstrap da Página 2 (Gerenciamento)...');
    
    // Verificar se já está inicializado
    if (window.managerInitialized) {
        console.log('⚠️ Gerenciador já inicializado');
        return;
    }
    
    try {
        // 1. PRIMEIRO: Carregar constantes do sistema
        console.log('📥 Carregando constantes do sistema...');
        await loadSystemConstantsFromJSON();
        
        // 2. VERIFICAR se as constantes estão disponíveis
        if (!window.systemConstants) {
            throw new Error('Constantes do sistema não carregadas');
        }
        
        console.log('✅ Constantes carregadas:', Object.keys(window.systemConstants).length, 'constantes disponíveis');
        
        // 3. Configurar contexto global
        window.managerContext = {
            page: 'manager',
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            constantsLoaded: true,
            constantsCount: Object.keys(window.systemConstants).length
        };
        
        // 4. Inicializar interface (que carregará as obras)
        initializeManagerInterface();
        
        // 5. Marcar como inicializado
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
        constantsLoaded: !!window.systemConstants,
        context: window.managerContext || {},
        obrasCount: document.querySelectorAll('.obra-block').length,
        timestamp: new Date().toISOString()
    };
}