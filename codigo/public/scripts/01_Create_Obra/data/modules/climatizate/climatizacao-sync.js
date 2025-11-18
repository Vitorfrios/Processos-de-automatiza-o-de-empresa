// data/modules/climatizacao/climatizacao-sync.js
// VERSÃO COMPLETA COM TODAS AS EXPORTAÇÕES

import { calculateVazaoArAndThermalGains } from '../../../features/calculations/air-flow.js';

// =============================================================================
// SINCRONIZAÇÃO GLOBAL - FUNÇÕES COMPLETAS
// =============================================================================

// ✅ CORREÇÃO: Exportações corretas
let handleWallInputSync;
let syncTitleToAmbiente; 
let syncAmbienteToTitle;
let setupCompleteRoomSync;

if (typeof window !== 'undefined') {
    // ============================================
    // 🔄 SINCRONIZAÇÃO APENAS NA PRIMEIRA INTERAÇÃO PAREDES
    // ============================================
    window.handleWallInputSyncFirstInteraction = function(roomId, field, value) {
        console.log(`🔄 [PRIMEIRA-INTERAÇÃO] Sincronização de parede: ${field} = ${value}`);
        
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        
        // Sincronizar paredes leste/oeste
        if (field === 'paredeOeste' || field === 'paredeLeste') {
            const otherField = field === 'paredeOeste' ? 'paredeLeste' : 'paredeOeste';
            const otherInput = document.querySelector(`input[data-field="${otherField}"][data-room-id="${roomId}"]`);
            if (otherInput) {
                const otherValue = otherInput.value;
                const isPlaceholder = otherValue === '' || otherValue === 'Ex: 5.5' || otherValue === 'Ex: 8.0';
                
                if (isPlaceholder) {
                    otherInput.value = numValue;
                    console.log(`✅ [PRIMEIRA-INTERAÇÃO] ${field} → ${otherField}: ${numValue}`);
                    triggerCalculation(roomId);
                }
            }
        }
        
        // Sincronizar paredes norte/sul
        if (field === 'paredeNorte' || field === 'paredeSul') {
            const otherField = field === 'paredeNorte' ? 'paredeSul' : 'paredeNorte';
            const otherInput = document.querySelector(`input[data-field="${otherField}"][data-room-id="${roomId}"]`);
            if (otherInput) {
                const otherValue = otherInput.value;
                const isPlaceholder = otherValue === '' || otherValue === 'Ex: 5.5' || otherValue === 'Ex: 8.0';
                
                if (isPlaceholder) {
                    otherInput.value = numValue;
                    console.log(`✅ [PRIMEIRA-INTERAÇÃO] ${field} → ${otherField}: ${numValue}`);
                    triggerCalculation(roomId);
                }
            }
        }
    };

    // Usar sincronização apenas na primeira interação
    window.handleWallInputSync = window.handleWallInputSyncFirstInteraction;
    console.log('🎯 LÓGICA ATIVA: Sincronização APENAS NA PRIMEIRA INTERAÇÃO');

    // ============================================
    // SINCRONIZAÇÃO TÍTULO ↔ AMBIENTE
    // ============================================

    // Função de sincronização título→ambiente
    window.syncTitleToAmbiente = function(roomId, newTitle) {
        console.log(`🔄 Título → Ambiente: "${newTitle}" para sala ${roomId}`);
        const ambienteInput = document.querySelector(`input[data-field="ambiente"][data-room-id="${roomId}"]`);
        if (ambienteInput && ambienteInput.value !== newTitle) {
            ambienteInput.value = newTitle;
            console.log(`✅ Título → Ambiente: "${newTitle}"`);
            triggerCalculation(roomId);
        }
    };

    // Função de sincronização ambiente→título
    window.syncAmbienteToTitle = function(roomId, newAmbiente) {
        const roomTitle = document.querySelector(`[data-room-id="${roomId}"] .room-title`);
        if (roomTitle && roomTitle.textContent !== newAmbiente) {
            roomTitle.textContent = newAmbiente;
            const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
            if (roomBlock) {
                roomBlock.dataset.roomName = newAmbiente;
            }
            console.log(`✅ Ambiente → Título: "${newAmbiente}"`);
        }
    };

    // ✅ CORREÇÃO: Função setupCompleteRoomSync adicionada de volta
    window.setupCompleteRoomSync = function(roomId) {
        console.log(`🎯 CONFIGURANDO SINCRONIZAÇÃO COMPLETA PARA SALA: ${roomId}`);
        
        // Configurar paredes
        setupWallEventListenersDirect(roomId);
        
        // Configurar título↔ambiente
        setupTitleAmbienteSyncDirect(roomId);
        
        console.log(`✅ SINCRONIZAÇÃO COMPLETA CONFIGURADA PARA: ${roomId}`);
    };

    // ✅ FUNÇÃO AUXILIAR PARA CONFIGURAR PAREDES
    function setupWallEventListenersDirect(roomId) {
        console.log(`🧱 CONFIGURANDO EVENT LISTENERS PARA PAREDES: ${roomId}`);
        
        const setupWallInput = (field, placeholder) => {
            const input = document.querySelector(`input[data-field="${field}"][data-room-id="${roomId}"]`);
            if (input) {
                input.addEventListener('input', function() {
                    if (this.value && this.value !== placeholder) {
                        window.handleWallInputSync(roomId, field, this.value);
                    }
                });
                return true;
            }
            return false;
        };
        
        const walls = [
            { field: 'paredeOeste', placeholder: 'Ex: 5.5' },
            { field: 'paredeLeste', placeholder: 'Ex: 5.5' },
            { field: 'paredeNorte', placeholder: 'Ex: 8.0' },
            { field: 'paredeSul', placeholder: 'Ex: 8.0' }
        ];
        
        walls.forEach(wall => {
            if (setupWallInput(wall.field, wall.placeholder)) {
                console.log(`✅ Listener configurado para ${wall.field}`);
            }
        });
    }

    // ✅ FUNÇÃO AUXILIAR PARA CONFIGURAR TÍTULO↔AMBIENTE
    function setupTitleAmbienteSyncDirect(roomId) {
        const roomTitle = document.querySelector(`[data-room-id="${roomId}"] .room-title`);
        const ambienteInput = document.querySelector(`input[data-field="ambiente"][data-room-id="${roomId}"]`);
        
        if (roomTitle && ambienteInput) {
            // Sincronização Ambiente → Título
            ambienteInput.addEventListener('input', function() {
                if (this.value && this.value.trim() !== '' && this.value !== roomTitle.textContent) {
                    roomTitle.textContent = this.value;
                    const roomBlock = document.querySelector(`[data-room-id="${roomId}"]`);
                    if (roomBlock) {
                        roomBlock.dataset.roomName = this.value;
                    }
                    console.log(`🔄 Ambiente → Título: "${this.value}"`);
                    triggerCalculation(roomId);
                }
            });
            
            // Sincronização inicial
            if (!ambienteInput.value || ambienteInput.value.trim() === '') {
                ambienteInput.value = roomTitle.textContent;
                console.log(`✅ Sincronização inicial: Título → Ambiente: "${roomTitle.textContent}"`);
            }
        }
    }

    // ✅ FUNÇÃO AUXILIAR PARA CÁLCULOS
    function triggerCalculation(roomId) {
        setTimeout(() => {
            if (typeof calculateVazaoArAndThermalGains === 'function') {
                calculateVazaoArAndThermalGains(roomId);
            }
        }, 100);
    }

    // Atribuir às variáveis de exportação
    handleWallInputSync = window.handleWallInputSync;
    syncTitleToAmbiente = window.syncTitleToAmbiente;
    syncAmbienteToTitle = window.syncAmbienteToTitle;
    setupCompleteRoomSync = window.setupCompleteRoomSync;
}

// =============================================================================
// EXPORTAÇÕES COMPLETAS
// =============================================================================

export {
    handleWallInputSync,
    syncTitleToAmbiente,
    syncAmbienteToTitle,
    setupCompleteRoomSync
};