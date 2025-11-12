/**
 * ui/interface.js
 * Interface e gerenciamento de eventos da Página 2
 */

import { loadAndRenderObras } from '../features/managers/obras-manager.js';
import { showShutdownConfirmationModal } from '../../01_Create_Obra/ui/components/modal/exit-modal.js';
import { MESSAGES, SELECTORS } from '../core/constants.js';

/**
 * Inicializa a interface da Página 2
 */
export function initializeManagerInterface() {
    console.log('🎯 Inicializando interface do gerenciador...');
    
    try {
        // 1. Configurar contexto da Página 2
        document.body.dataset.page = 'manager';
        
        // 2. Adicionar header específico
        addManagerHeader();
        
        // 3. Configurar container de projetos
        setupProjectsContainer();
        
        // 4. Configurar botão de shutdown
        setupShutdownButton();
        
        // 5. Carregar e renderizar obras
        loadAndRenderObras();
        
        console.log('✅ Interface do gerenciador inicializada');
        
    } catch (error) {
        console.error('❌ Erro na inicialização da interface:', error);
    }
}

/**
 * Adiciona header específico da Página 2
 */
function addManagerHeader() {
    const mainContent = document.querySelector('main, .main-content') || document.body;
    
    const managerHeader = document.createElement('div');
    managerHeader.className = 'manager-header';
    managerHeader.innerHTML = `
        <h1>Gerenciamento de Obras <span class="manager-badge">Todos os Registros</span></h1>
        <div class="subtitle">Visualize, atualize e gerencie todas as obras do sistema</div>
    `;
    
    // Inserir no início do conteúdo principal
    if (mainContent.firstChild) {
        mainContent.insertBefore(managerHeader, mainContent.firstChild);
    } else {
        mainContent.appendChild(managerHeader);
    }
}

/**
 * Configura o container de projetos para a Página 2
 */
function setupProjectsContainer() {
    let container = document.getElementById('projects-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'projects-container';
        
        const mainContent = document.querySelector('main, .main-content') || document.body;
        mainContent.appendChild(container);
    }
    
    // Limpar conteúdo existente (se houver)
    container.innerHTML = '<!-- Obras carregadas do backup.json -->';
    
    console.log('✅ Container de projetos configurado');
}

/**
 * Configura botão de shutdown (se existir)
 */
function setupShutdownButton() {
    const shutdownBtn = document.querySelector('.shutdown-btn');
    
    if (shutdownBtn) {
        shutdownBtn.addEventListener('click', async () => {
            console.log('🔄 Botão de shutdown clicado na Página 2');
            
            const confirmed = await showShutdownConfirmationModal();
            
            if (confirmed) {
                console.log('✅ Confirmação de shutdown recebida');
                // O modal já cuida do shutdown, apenas log
                showSystemStatus('Servidor sendo encerrado...', 'warning');
            } else {
                console.log('❌ Shutdown cancelado pelo usuário');
            }
        });
        
        console.log('✅ Botão de shutdown configurado');
    }
}

/**
 * Limpa a interface (para futuros recarregamentos)
 */
export function clearManagerInterface() {
    const container = document.getElementById('projects-container');
    if (container) {
        container.innerHTML = '';
    }
    
    const managerHeader = document.querySelector('.manager-header');
    if (managerHeader) {
        managerHeader.remove();
    }
    
    console.log('✅ Interface do gerenciador limpa');
}