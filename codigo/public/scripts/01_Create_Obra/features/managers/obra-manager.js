// features/managers/obra-manager.js - ARQUIVO PRINCIPAL ATUALIZADO
import { attachModuleToWindow } from '../../core/shared-utils.js';

// Re-export de todos os módulos de obra
export * from './obra-folder/obra-creator.js';
export * from './obra-folder/obra-persistence.js';
export * from './obra-folder/obra-dom-manager.js';
export * from './obra-folder/obra-save-handler.js';
export * from './obra-folder/obra-utils.js';

// Re-export de funções de ID
export { generateObraId, ensureStringId } from '../../data/utils/id-generator.js';

// COMPATIBILIDADE GLOBAL
if (typeof window !== 'undefined') {
    Promise.all([
        import('./obra-folder/obra-creator.js'),
        import('./obra-folder/obra-persistence.js'),
        import('./obra-folder/obra-dom-manager.js'),
        import('./obra-folder/obra-save-handler.js'),
        import('./obra-folder/obra-utils.js')
    ]).then(modules => {
        modules.forEach(attachModuleToWindow);
        
        // Funções de ID também precisam ser expostas
        window.generateObraId = generateObraId;
        window.ensureStringId = ensureStringId;
        
        console.log(' [obra-manager] Módulos de obra carregados no escopo global');
    }).catch(error => {
        console.error('[obra-manager] Erro ao carregar módulos de obra:', error);
    });
}
