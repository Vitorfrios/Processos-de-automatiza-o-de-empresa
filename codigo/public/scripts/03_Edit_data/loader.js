// scripts/03_Edit_data/loader.js
// Carregador de módulos

export async function loadModules() {
    try {
        // Carrega os módulos na ordem correta
        const modules = [
            './ExpImpJsonFilles/json-import-export.js',
            './ExpImpJsonFilles/json-editor.js',
            './ExpImpJsonFilles/json-utils.js',
            './config/state.js',
            './config/api.js',
            './config/ui.js',
            './core/constants.js',
            './core/machines.js',
            './core/materials.js',
            './core/empresas.js',
            './core/equipamentos.js',
            './core/dutos.js'  // NOVO: Módulo de dutos adicionado

        ];

        for (const module of modules) {
            try {
                await import(module);
                console.log(`✅ Módulo carregado: ${module}`);
            } catch (error) {
                console.warn(`⚠️  Não foi possível carregar ${module}:`, error);
            }
        }

        // Expor funções principais globalmente
        window.loadData = window.loadData || async function () {
            console.log('🔧 Sistema de edição de dados inicializado');
            // A função real será definida no main.js
        };

        console.log('🎯 Todos os módulos foram carregados com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar módulos:', error);
        return false;
    }
}

// Carrega automaticamente quando o script é importado
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => loadModules(), 100);
});