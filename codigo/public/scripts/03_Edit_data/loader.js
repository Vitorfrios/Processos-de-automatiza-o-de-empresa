// scripts/03_Edit_data/loader.js
// Carregador de módulos

export async function loadModules() {
    try {
        console.log('🔧 Iniciando carregamento de módulos...');
        
        // Carrega os módulos na ordem correta
        const modules = [
            './editorJson/json-editor.js',
            './editorJson/json-utils.js',
            './config/state.js',
            './config/api.js',
            './config/ui.js',
            './core/constants.js',
            './core/machines.js',
            './core/materials.js',
            './core/empresas.js',
            './core/acessorios.js',
            './core/dutos.js',
            './core/tubos.js'  // ADICIONADO: Módulo de tubos
        ];

        for (const module of modules) {
            try {
                console.log(`📦 Carregando: ${module}`);
                await import(module);
                console.log(`✅ Módulo carregado: ${module}`);
            } catch (error) {
                console.warn(`⚠️  Não foi possível carregar ${module}:`, error.message);
                // Continue carregando outros módulos mesmo se um falhar
            }
        }

        // Expor funções principais globalmente
        window.loadData = window.loadData || async function () {
            console.log('🔧 Carregando dados do sistema...');
            
            try {
                // Carrega dados do sistema
                const response = await fetch('/api/system-data');
                if (response.ok) {
                    const data = await response.json();
                    
                    console.log('📥 Dados carregados do sistema:', {
                        constants: Object.keys(data.constants || {}).length,
                        machines: data.machines?.length || 0,
                        materials: Object.keys(data.materials || {}).length,
                        empresas: data.empresas?.length || 0,
                        banco_acessorios: Object.keys(data.banco_acessorios || {}).length,
                        dutos: data.dutos?.length || 0,
                        tubos: data.tubos?.length || 0  // ADICIONADO
                    });
                    
                    // Atualiza systemData
                    if (typeof window.updateSystemData === 'function') {
                        window.updateSystemData(data);
                    }
                    
                    // Dispara evento para inicializar todos os componentes
                    const event = new CustomEvent('dataLoaded', {
                        detail: data
                    });
                    window.dispatchEvent(event);
                    
                    return data;
                } else {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('❌ Erro ao carregar dados:', error);
                throw error;
            }
        };

        console.log('🎯 Todos os módulos foram carregados com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro crítico ao carregar módulos:', error);
        return false;
    }
}

// Carrega automaticamente quando o script é importado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 DOM pronto, carregando módulos...');
        setTimeout(() => loadModules(), 100);
    });
} else {
    console.log('🚀 DOM já pronto, carregando módulos...');
    setTimeout(() => loadModules(), 100);
}