/* ==== INÍCIO: main.js ==== */
/**
 * main.js - Ponto de entrada do sistema de gerenciamento
 * Página 2: Gerenciamento de Projetos (Sistema SEMPRE ativo)
 */

import { ObrasManager } from './obras-manager.js';

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando Sistema de Gerenciamento de Obras...');
    
    try {
        // Limpar qualquer conteúdo inicial
        const container = document.getElementById('projects-container');
        if (container) {
            // Remover apenas o loading inicial, manter estrutura básica
            const initialLoading = container.querySelector('.initial-loading');
            if (initialLoading) {
                initialLoading.remove();
            }
        }
        
        // Criar e inicializar o gerenciador
        window.obrasManager = new ObrasManager();
        await window.obrasManager.initialize();
        
        console.log('✅ Sistema de Gerenciamento inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema:', error);
        showErrorMessage('Erro ao carregar sistema. Recarregue a página.');
    }
});

function showErrorMessage(message) {
    const container = document.getElementById('projects-container');
    if (container) {
        container.innerHTML = `
            <div class="error-container">
                <h3>Erro no Sistema</h3>
                <p>${message}</p>
                <button onclick="location.reload()">Recarregar Página</button>
            </div>
        `;
    }
}
/* ==== FIM: main.js ==== */