// data/builders/data-builders.js - ARQUIVO PRINCIPAL SIMPLIFICADO


import { attachModuleToWindow } from '../../core/shared-utils.js';

// Re-export de todos os módulos (agora apenas 3 arquivos!)
export * from './data-builders-folder/obra-data-builder.js';
export * from './data-builders-folder/room-data-extractors.js';
export * from './data-builders-folder/machines-data-extractors.js';
export * from './data-builders-folder/empresa-data-extractor.js';

// 🔥 COMPATIBILIDADE GLOBAL
if (typeof window !== 'undefined') {


    // Agora só 4 imports em vez de 8!
    Promise.all([
        import('./data-builders-folder/obra-data-builder.js'),
        import('./data-builders-folder/room-data-extractors.js'),
        import('./data-builders-folder/machines-data-extractors.js'),
        import('./data-builders-folder/empresa-data-extractor.js')
    ]).then(modules => {
        modules.forEach(attachModuleToWindow);
        console.log('✅ [data-builders] Módulos carregados no escopo global');
    }).catch(error => {
        console.error('[data-builders] Erro ao carregar módulos:', error);
    });
}