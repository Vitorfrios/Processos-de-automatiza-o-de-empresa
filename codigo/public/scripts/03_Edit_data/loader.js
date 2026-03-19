// scripts/03_Edit_data/loader.js
// Carregador de módulos

export async function loadModules() {
    try {
        console.log('Iniciando carregamento de modulos...');

        const modules = [
            './config/state.js',
            './config/api.js',
            './config/ui.js',
            './core/constants.js',
            './core/machines.js',
            './core/materials.js',
            './core/empresas.js',
            './core/acessorios.js',
            './core/dutos.js',
            './core/tubos.js',
            './core/dashboard-summary.js',
            './core/admin-credentials.js'
        ];

        for (const module of modules) {
            try {
                console.log(`Carregando: ${module}`);
                await import(module);
                console.log(`Modulo carregado: ${module}`);
            } catch (error) {
                console.warn(`Nao foi possivel carregar ${module}:`, error.message);
            }
        }

        window.loadData = window.loadData || async function () {
            console.log('Carregando dados do sistema...');

            try {
                const response = await fetch('/api/system-data');
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                console.log('Dados carregados do sistema:', {
                    constants: Object.keys(data.constants || {}).length,
                    machines: data.machines?.length || 0,
                    materials: Object.keys(data.materials || {}).length,
                    empresas: data.empresas?.length || 0,
                    banco_acessorios: Object.keys(data.banco_acessorios || {}).length,
                    dutos: data.dutos?.length || 0,
                    tubos: data.tubos?.length || 0
                });

                if (typeof window.updateSystemData === 'function') {
                    window.updateSystemData(data);
                }

                window.dispatchEvent(new CustomEvent('dataLoaded', {
                    detail: data
                }));

                return data;
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                throw error;
            }
        };

        console.log('Todos os modulos foram carregados com sucesso.');
        return true;
    } catch (error) {
        console.error('Erro critico ao carregar modulos:', error);
        return false;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => loadModules(), 100);
    });
} else {
    setTimeout(() => loadModules(), 100);
}
