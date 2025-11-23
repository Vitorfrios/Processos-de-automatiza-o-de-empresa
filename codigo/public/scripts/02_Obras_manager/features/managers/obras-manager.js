/**
 * features/managers/obras-manager.js
 * Gerenciador principal da Página 2
 */

import { page1Adapter } from '../../data/adapters/page1-functions-adapter.js';
import { loadBackupObras } from '../../data/adapters/obras-adapter.js';
import { showSystemStatus } from '../../../01_Create_Obra/ui/components/status.js';
import { showUniversalDeleteModal } from '../../ui/components/modal/universal-modal.js';

/**
 * Carregar e renderizar obras
 */
async function loadAndRenderObras() {
    try {
        console.log('🚀 Iniciando carregamento de obras...');
        showSystemStatus('Carregando obras...', 'info');
        
        // 1. INICIALIZAR ADAPTER COM FUNÇÕES REAIS
        await page1Adapter.initialize();
        
        // 2. CARREGAR OBRAS DO BACKUP
        const obras = await loadBackupObras();
        
        if (obras.length === 0) {
            showSystemStatus('Nenhuma obra encontrada no backup', 'warning');
            renderEmptyState();
            return;
        }
        
        console.log(`📊 ${obras.length} obra(s) para renderizar`);
        
        // 3. RENDERIZAR CADA OBRA COM FUNÇÕES REAIS
        let successCount = 0;
        for (const obra of obras) {
            const success = await renderObra(obra);
            if (success) successCount++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 4. APLICAR CONTEXTO DA PÁGINA 2
        applyManagerContext();
        
        console.log(`🎉 Renderização concluída: ${successCount}/${obras.length} obra(s)`);
        showSystemStatus(`${successCount} obra(s) carregada(s)`, 'success');
        
    } catch (error) {
        console.error('❌ Erro no carregamento de obras:', error);
        showSystemStatus('Erro ao carregar obras', 'error');
        renderErrorState(error);
    }
}

/**
 * Renderizar obra usando funções reais da Página 1
 */
async function renderObra(obraData) {
    try {
        console.log(`🎨 Renderizando obra: ${obraData.nome} (ID: ${obraData.id})`);
        
        // USAR FUNÇÃO REAL da Página 1
        const obraCreated = await page1Adapter.createEmptyObra(obraData.nome, obraData.id);
        
        if (!obraCreated) {
            console.error(`❌ Falha ao criar obra: ${obraData.nome}`);
            return false;
        }
        
        // Pequeno delay para DOM atualizar
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // USAR FUNÇÃO REAL para popular dados
        await page1Adapter.populateObraData(obraData);
        
        console.log(`✅ Obra renderizada: ${obraData.nome}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Erro ao renderizar obra ${obraData.nome}:`, error);
        return false;
    }
}

/**
 * Aplicar contexto específico da Página 2
 */
function applyManagerContext() {
    console.log('🔧 Aplicando contexto da Página 2...');
    
    // 1. Esconder botões de salvar
    document.querySelectorAll('.btn-salvar, .btn-save').forEach(btn => {
        btn.style.display = 'none';
    });
    
    // 2. Esconder seções de adicionar
    document.querySelectorAll('.add-project-section, .add-room-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 3. ✅ CORREÇÃO: Substituir funcionalidade dos botões existentes
    replaceExistingDeleteButtons();
    
    console.log('✅ Contexto da Página 2 aplicado');
}

/**
 * ✅ CORREÇÃO: Substituir funcionalidade dos botões existentes SEM modificar HTML
 */
function replaceExistingDeleteButtons() {
    console.log('🔧 Substituindo funcionalidade dos botões de exclusão...');
    
    // Substituir botões de exclusão de obras
    document.querySelectorAll('.obra-block .btn-delete').forEach(deleteBtn => {
        const obraBlock = deleteBtn.closest('.obra-block');
        const obraId = obraBlock.dataset.obraId;
        const obraName = obraBlock.querySelector('.obra-title')?.textContent || 'Obra sem nome';
        
        // ✅ MANTER texto original, apenas substituir onclick
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showUniversalDeleteModal('obra', obraId, obraName, obraBlock);
        };
        
        console.log(`✅ Botão de obra configurado: ${obraName}`);
    });
    
    // Substituir botões de exclusão de projetos
    document.querySelectorAll('.project-block .btn-delete').forEach(deleteBtn => {
        const projectBlock = deleteBtn.closest('.project-block');
        const projectId = projectBlock.dataset.projectId;
        const projectName = projectBlock.querySelector('.project-title')?.textContent || 'Projeto sem nome';
        const obraBlock = projectBlock.closest('.obra-block');
        const obraId = obraBlock?.dataset.obraId;
        const obraName = obraBlock?.querySelector('.obra-title')?.textContent || 'Obra sem nome';
        
        // ✅ MANTER texto original, apenas substituir onclick
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showUniversalDeleteModal('project', projectId, projectName, projectBlock, { 
                parentId: obraId, 
                parentName: obraName 
            });
        };
        
        console.log(`✅ Botão de projeto configurado: ${projectName}`);
    });
    
    // Substituir botões de exclusão de salas
    document.querySelectorAll('.room-block .btn-delete').forEach(deleteBtn => {
        const roomBlock = deleteBtn.closest('.room-block');
        const roomId = roomBlock.dataset.roomId;
        const roomName = roomBlock.querySelector('.room-title')?.textContent || 'Sala sem nome';
        const projectBlock = roomBlock.closest('.project-block');
        const projectId = projectBlock?.dataset.projectId;
        const projectName = projectBlock?.querySelector('.project-title')?.textContent || 'Projeto sem nome';
        const obraBlock = projectBlock?.closest('.obra-block');
        const obraName = obraBlock?.querySelector('.obra-title')?.textContent || 'Obra sem nome';
        
        // ✅ MANTER texto original, apenas substituir onclick
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showUniversalDeleteModal('room', roomId, roomName, roomBlock, { 
                parentId: projectId, 
                parentName: `${projectName} (${obraName})` 
            });
        };
        
        console.log(`✅ Botão de sala configurado: ${roomName}`);
    });
    
    // Substituir botões de exclusão de máquinas
    document.querySelectorAll('.climatization-machine .btn-delete, .machine-block .btn-delete').forEach(deleteBtn => {
        const machineBlock = deleteBtn.closest('.climatization-machine, .machine-block');
        const machineId = machineBlock.dataset.machine || machineBlock.id;
        const machineName = machineBlock.querySelector('.machine-title, .machine-name')?.textContent || 'Máquina sem nome';
        const roomBlock = machineBlock.closest('.room-block');
        const roomId = roomBlock?.dataset.roomId;
        const roomName = roomBlock?.querySelector('.room-title')?.textContent || 'Sala sem nome';
        const projectBlock = roomBlock?.closest('.project-block');
        const projectName = projectBlock?.querySelector('.project-title')?.textContent || 'Projeto sem nome';
        const obraBlock = projectBlock?.closest('.obra-block');
        const obraName = obraBlock?.querySelector('.obra-title')?.textContent || 'Obra sem nome';
        
        // ✅ MANTER texto original, apenas substituir onclick
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showUniversalDeleteModal('machine', machineId, machineName, machineBlock, { 
                parentId: roomId, 
                parentName: `${roomName} → ${projectName} → ${obraName}` 
            });
        };
        
        console.log(`✅ Botão de máquina configurado: ${machineName}`);
    });
    
    console.log('✅ Todos os botões de exclusão substituídos');
}

/**
 * Renderizar estado vazio
 */
function renderEmptyState() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>Nenhuma obra encontrada</h3>
            <p>Não há obras salvas no backup do servidor.</p>
        </div>
    `;
}

/**
 * Renderizar estado de erro
 */
function renderErrorState(error) {
    const container = document.getElementById('projects-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Erro ao carregar obras</h3>
            <p>${error.message}</p>
            <button onclick="window.location.reload()" class="btn btn-primary">
                Tentar Novamente
            </button>
        </div>
    `;
}

// Exportações
export {
    renderObra,
    applyManagerContext,
    loadAndRenderObras
};