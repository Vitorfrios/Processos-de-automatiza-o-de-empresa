/**
 * utils/global-stubs.js
 * Stubs para funções globais que podem não estar disponíveis
 */


console.log('🚀 global-stubs.js CARREGANDO...');

// Verificar se toggleSection já existe ANTES de definir o stub
console.log(`🔍 toggleSection existe antes do stub? ${typeof window.toggleSection}`);
console.log(`🔍 toggleSubsection existe antes do stub? ${typeof window.toggleSubsection}`);


// Stub para calculateVazaoArAndThermalGains
if (typeof window.calculateVazaoArAndThermalGains !== 'function') {
    window.calculateVazaoArAndThermalGains = function(roomId) {
        console.log(`🔧 calculateVazaoArAndThermalGains stub chamado para sala: ${roomId}`);
        // Esta função será substituída quando o módulo real for carregado
    };
}

// Stub para toggleObra
if (typeof window.toggleObra !== 'function') {
    window.toggleObra = function(obraId, event) {
        if (event) event.stopPropagation();
        console.log(`🔧 toggleObra stub chamado para obra: ${obraId}`);
        
        const obraContent = document.getElementById(`obra-content-${obraId}`);
        const minimizer = event?.target;
        
        if (obraContent && minimizer) {
            const isCollapsed = obraContent.classList.contains('collapsed');
            obraContent.classList.toggle('collapsed', !isCollapsed);
            minimizer.textContent = isCollapsed ? '−' : '+';
        }
    };
}

// Stub para toggleRoom
if (typeof window.toggleRoom !== 'function') {
    window.toggleRoom = function(roomId, event) {
        if (event) event.stopPropagation();
        console.log(`🔧 toggleRoom stub chamado para sala: ${roomId}`);
        
        const roomContent = document.getElementById(`room-content-${roomId}`);
        const minimizer = event?.target;
        
        if (roomContent && minimizer) {
            const isCollapsed = roomContent.classList.contains('collapsed');
            roomContent.classList.toggle('collapsed', !isCollapsed);
            minimizer.textContent = isCollapsed ? '−' : '+';
        }
    };
}

// Stub para toggleProject
if (typeof window.toggleProject  !== 'function') {
    window.toggleProject  = function(projectId, event) {
        if (event) event.stopPropagation();
        console.log(`🔧 toggleProject  stub chamado para sala: ${projectId}`);
        
        const projectContent = document.getElementById(`project-content-${projectId}`);
        const minimizer = event?.target;
        
        if (projectContent && minimizer) {
            const isCollapsed = projectContent.classList.contains('collapsed');
            projectContent.classList.toggle('collapsed', !isCollapsed);
            minimizer.textContent = isCollapsed ? '−' : '+';
        }
    };
}

// Stub para toggleSubsection - VERSÃO DEFINITIVA
if (typeof window.toggleSubsection !== 'function') {
    window.toggleSubsection = function(subsectionId, event) {
        if (event) event.stopPropagation();
        console.log(`🔧 toggleSubsection stub chamado para subseção: ${subsectionId}`);
        
        // ✅ USAR O ID EXATO QUE ESTÁ NO DOM
        const contentId = `subsection-content-${subsectionId}`;
        const content = document.getElementById(contentId);
        const minimizer = event?.target;
        
        if (content && minimizer) {
            const isCollapsed = content.classList.contains('collapsed');
            content.classList.toggle('collapsed', !isCollapsed);
            minimizer.textContent = isCollapsed ? '−' : '+';
            
            // Também alternar a classe no bloco pai para estilização
            const subsectionBlock = content.closest('.subsection-block');
            if (subsectionBlock) {
                subsectionBlock.classList.toggle('collapsed', !isCollapsed);
            }
            
            console.log(`✅ Subseção ${subsectionId} ${isCollapsed ? 'expandida' : 'recolhida'}`);
        } else {
            console.error(`❌ Conteúdo da subseção não encontrado: ${contentId}`);
            
            // ✅ MÉTODO ALTERNATIVO
            if (minimizer) {
                const subsectionBlock = minimizer.closest('.subsection-block');
                if (subsectionBlock) {
                    const altContent = subsectionBlock.querySelector('.subsection-content');
                    if (altContent) {
                        const isCollapsed = altContent.classList.contains('collapsed');
                        altContent.classList.toggle('collapsed', !isCollapsed);
                        minimizer.textContent = isCollapsed ? '−' : '+';
                        subsectionBlock.classList.toggle('collapsed', !isCollapsed);
                        console.log(`✅ Subseção encontrada via método alternativo: ${isCollapsed ? 'expandida' : 'recolhida'}`);
                    }
                }
            }
        }
    };
}

// Stub para toggleMachineSection - VERSÃO DEFINITIVA
if (typeof window.toggleMachineSection !== 'function') {
    window.toggleMachineSection = function(machineId, event) {
        if (event) event.stopPropagation();
        console.log(`🔧 toggleMachineSection stub chamado para máquina: ${machineId}`);
        
        // ✅ USAR O ID EXATO QUE ESTÁ NO DOM
        const contentId = `machine-content-${machineId}`;
        const content = document.getElementById(contentId);
        const minimizer = event?.target;
        
        if (content && minimizer) {
            const isCollapsed = content.classList.contains('collapsed');
            content.classList.toggle('collapsed', !isCollapsed);
            minimizer.textContent = isCollapsed ? '−' : '+';
            
            console.log(`✅ Máquina ${machineId} ${isCollapsed ? 'expandida' : 'recolhida'}`);
        } else {
            console.error(`❌ Conteúdo da máquina não encontrado: ${contentId}`);
            
            // ✅ MÉTODO ALTERNATIVO
            if (minimizer) {
                const machineElement = minimizer.closest('.climatization-machine, .machine-block');
                if (machineElement) {
                    const altContent = machineElement.querySelector('.machine-content');
                    if (altContent) {
                        const isCollapsed = altContent.classList.contains('collapsed');
                        altContent.classList.toggle('collapsed', !isCollapsed);
                        minimizer.textContent = isCollapsed ? '−' : '+';
                        console.log(`✅ Máquina encontrada via método alternativo: ${isCollapsed ? 'expandida' : 'recolhida'}`);
                    }
                }
            }
        }
    };
}

// Stub para makeEditable
if (typeof window.makeEditable !== 'function') {
    window.makeEditable = function(element, type) {
        console.log(`🔧 makeEditable stub chamado para: ${type}`);
        
        if (element.getAttribute('contenteditable') === 'true') return;
        
        element.setAttribute('contenteditable', 'true');
        element.classList.add('editing');
        element.focus();
        
        const originalText = element.textContent;
        
        function saveChanges() {
            element.setAttribute('contenteditable', 'false');
            element.classList.remove('editing');
            console.log(`✅ ${type} atualizado: ${element.textContent}`);
        }
        
        element.addEventListener('blur', saveChanges, { once: true });
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveChanges();
            } else if (e.key === 'Escape') {
                element.textContent = originalText;
                saveChanges();
            }
        });
    };
}

// Stub para outras funções comuns
const stubFunctions = [
    'toggleMachineSection',
    'updateMachineTitle', 
    'deleteMachine',
    'updateMachineOptions',
    'handlePowerChange',
    'calculateMachinePrice',
    'updateBackupConfiguration',
    'initializeFatorSeguranca',
    'syncCapacityTableBackup'
];

stubFunctions.forEach(funcName => {
    if (typeof window[funcName] !== 'function') {
        window[funcName] = function(...args) {
            console.log(`🔧 ${funcName} stub chamado com:`, args);
            // Stub vazio - será substituído quando o módulo real for carregado
        };
    }
});

console.log('✅ Stubs globais carregados');