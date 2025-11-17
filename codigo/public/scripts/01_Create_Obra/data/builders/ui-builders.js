// data/builders/ui-builders.js - ARQUIVO PRINCIPAL ATUALIZADO
import { attachModuleToWindow } from '../../core/shared-utils.js';

// Re-export de todos os módulos de UI
export * from './ui-folder/obra-renderer.js';
export * from './ui-folder/project-renderer.js';
export * from './ui-folder/room-renderer.js';
export * from './ui-folder/machine-renderer.js';
export * from './ui-folder/data-fillers.js';

// 🔥 COMPATIBILIDADE GLOBAL
if (typeof window !== 'undefined') {
    Promise.all([
        import('./ui-folder/obra-renderer.js'),
        import('./ui-folder/project-renderer.js'),
        import('./ui-folder/room-renderer.js'),
        import('./ui-folder/machine-renderer.js'),
        import('./ui-folder/data-fillers.js')
    ]).then(modules => {
        modules.forEach(attachModuleToWindow);
        console.log('✅ [ui-builders] Módulos de UI carregados no escopo global');
    }).catch(error => {
        console.error('[ui-builders] Erro ao carregar módulos de UI:', error);
    });
}