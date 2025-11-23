/**
 * data/adapters/obras-adapter.js
 * Adaptador para carregar e manipular obras do backup.json
 */

import { BACKUP_ENDPOINTS, MESSAGES } from '../../core/constants.js';
import { showSystemStatus } from '../../../01_Create_Obra/ui/components/status.js';

/**
 * Carrega todas as obras do backup.json
 */
export async function loadBackupObras() {
    try {
        console.log('📂 Carregando obras do backup...');
        
        const response = await fetch(BACKUP_ENDPOINTS.LOAD);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        const obras = normalizeBackup(data);
        
        console.log(`✅ ${obras.length} obra(s) carregada(s) do backup`);
        return obras;
        
    } catch (error) {
        console.error('❌ Erro ao carregar obras do backup:', error);
        showSystemStatus(MESSAGES.LOAD_ERROR, 'error');
        return [];
    }
}

/**
 * Normaliza os dados do backup para array de obras
 */
export function normalizeBackup(backupData) {
    if (!backupData) {
        console.warn('⚠️ Dados do backup vazios ou nulos');
        return [];
    }
    
    let obras = [];
    
    // Caso 1: Backup é um objeto com propriedade 'obras'
    if (backupData.obras && Array.isArray(backupData.obras)) {
        obras = backupData.obras;
    }
    // Caso 2: Backup é diretamente um array
    else if (Array.isArray(backupData)) {
        obras = backupData;
    }
    // Caso 3: Backup é um objeto único (tratar como array com um elemento)
    else if (typeof backupData === 'object' && backupData.id) {
        obras = [backupData];
    }
    
    console.log(`📊 Backup normalizado: ${obras.length} obra(s)`);
    
    // Garantir que todas as obras tenham ID e nome
    return obras.map(obra => ({
        id: obra.id || `obra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nome: obra.nome || 'Obra sem nome',
        projetos: obra.projetos || [],
        timestamp: obra.timestamp || new Date().toISOString(),
        ...obra
    }));
}

/**
 * Remove uma obra do backup (persistente)
 */
export async function removeObraFromBackup(obraId) {
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error('❌ ID da obra inválido para remoção:', obraId);
        showSystemStatus('ID da obra inválido', 'error');
        return false;
    }
    
    try {
        console.log(`🗑️ Removendo obra ${obraId} do backup...`);
        
        // Tentar endpoint específico primeiro
        let response = await fetch(BACKUP_ENDPOINTS.REMOVE_OBRA, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ obraId })
        });
        
        // Se endpoint não implementado, tentar alternativa
        if (response.status === 501 || response.status === 404) {
            console.log('🔄 Endpoint específico não implementado, tentando alternativa...');
            
            // Alternativa: carregar backup completo, remover obra e salvar
            response = await fetch(BACKUP_ENDPOINTS.LOAD);
            if (!response.ok) {
                throw new Error(`Erro ao carregar backup: ${response.status}`);
            }
            
            const backupData = await response.json();
            const obras = backupData.obras || backupData;
            
            // Remover a obra do array
            const obrasAtualizadas = obras.filter(obra => obra.id !== obraId);
            
            // Salvar backup atualizado
            const saveResponse = await fetch(BACKUP_ENDPOINTS.UPDATE_BACKUP, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(obrasAtualizadas)
            });
            
            if (!saveResponse.ok) {
                throw new Error(`Erro ao salvar backup: ${saveResponse.status}`);
            }
            
            console.log(`✅ Obra removida do backup via método alternativo`);
            showSystemStatus(MESSAGES.DELETE_SUCCESS, 'success');
            return true;
        }
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log(`✅ Obra removida do backup:`, result);
        showSystemStatus(MESSAGES.DELETE_SUCCESS, 'success');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao remover obra do backup:', error);
        
        if (error.message.includes('501') || error.message.includes('404')) {
            showSystemStatus('Funcionalidade de exclusão não disponível no servidor', 'warning');
        } else {
            showSystemStatus(MESSAGES.DELETE_ERROR, 'error');
        }
        
        return false;
    }
}