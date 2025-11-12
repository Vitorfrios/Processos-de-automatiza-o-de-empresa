/**
 * utils/global-stubs.js
 * Stubs para funções globais que podem não estar disponíveis
 */

console.log('🚀 global-stubs.js CARREGANDO...');

// Verificar se toggleSection já existe ANTES de definir o stub
console.log(`🔍 toggleSection existe antes do stub? ${typeof window.toggleSection}`);
console.log(`🔍 toggleSubsection existe antes do stub? ${typeof window.toggleSubsection}`);




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

// TOGGLE SECTION - VERSÃO DEFINITIVA CORRIGIDA
if (typeof window.toggleSection !== 'function') {
    window.toggleSection = function(sectionId, event) {
        console.log(`🔧 toggleSection DEFINITIVO chamado para: ${sectionId}`);
        
        // Se não tem event, tentar obter do window.event (para navegadores antigos)
        if (!event && window.event) {
            event = window.event;
        }
        
        if (event) {
            event.stopPropagation();
        }
        
        let content = null;
        let minimizer = event?.target;
        
        // ESTRATÉGIA 1: ID exato como está no DOM
        const contentId = `section-content-${sectionId}`;
        content = document.getElementById(contentId);
        
        // ESTRATÉGIA 2: Se não encontrou o minimizer no event, tentar encontrar pelo ID
        if (!minimizer) {
            console.log('🔄 Minimizer não veio no event, buscando pelo contexto...');
            // Buscar o minimizer que tem o onclick com este sectionId
            const possibleMinimizers = document.querySelectorAll('.minimizer, .section-minimizer');
            for (let min of possibleMinimizers) {
                const onclickAttr = min.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes(`toggleSection('${sectionId}'`)) {
                    minimizer = min;
                    console.log(`📍 Minimizer encontrado via onclick:`, minimizer);
                    break;
                }
            }
        }
        
        // ESTRATÉGIA 3: Buscar pelo elemento pai do minimizer
        if (!content && minimizer) {
            console.log('🔍 Buscando via elemento pai do minimizer...');
            const sectionBlock = minimizer.closest('.section-block');
            if (sectionBlock) {
                content = sectionBlock.querySelector('.section-content');
                if (content) {
                    console.log(`📍 Encontrado via elemento pai: ${content.id}`);
                }
            }
        }
        
        // ESTRATÉGIA 4: Buscar diretamente pelo ID
        if (!content) {
            console.log(`🔍 Buscando diretamente por ID: ${contentId}`);
            content = document.getElementById(contentId);
        }
        
        // SE ENCONTRAMOS O CONTEÚDO E TEMOS MINIMIZER
        if (content) {
            // Se não temos minimizer, tentar encontrar um
            if (!minimizer) {
                const sectionBlock = content.closest('.section-block');
                if (sectionBlock) {
                    minimizer = sectionBlock.querySelector('.minimizer, .section-minimizer');
                }
            }
            
            const isCollapsed = content.classList.contains('collapsed');
            content.classList.toggle('collapsed', !isCollapsed);
            
            // Atualizar o texto do minimizer se existir
            if (minimizer && minimizer.textContent) {
                minimizer.textContent = isCollapsed ? '−' : '+';
            }
            
            console.log(`✅ Seção ${sectionId} ${isCollapsed ? 'expandida' : 'recolhida'}`);
            console.log(`🔍 Elemento: ${content.id}, Estado: ${content.classList.contains('collapsed') ? 'collapsed' : 'expanded'}`);
            
            return true;
            
        } else {
            console.error(`❌ Conteúdo da seção não encontrado: ${sectionId}`);
            console.log(`🔍 Procurando por ID: ${contentId}`);
            
            // DEBUG: Mostrar o que existe no DOM
            const existingContents = document.querySelectorAll('.section-content');
            console.log(`📋 ${existingContents.length} elementos .section-content encontrados:`);
            existingContents.forEach((el, index) => {
                console.log(`   ${index + 1}. ID: "${el.id}" | Classes: "${el.className}"`);
            });
            
            return false;
        }
    };
}

// TOGGLE SUBSECTION - VERSÃO DEFINITIVA CORRIGIDA
if (typeof window.toggleSubsection !== 'function') {
    window.toggleSubsection = function(subsectionId, event) {
        console.log(`🔧 toggleSubsection DEFINITIVO chamado para: ${subsectionId}`);
        
        // Se não tem event, tentar obter do window.event (para navegadores antigos)
        if (!event && window.event) {
            event = window.event;
        }
        
        if (event) {
            event.stopPropagation();
        }
        
        let content = null;
        let minimizer = event?.target;
        
        // ESTRATÉGIA 1: ID exato como está no DOM
        const contentId = `subsection-content-${subsectionId}`;
        content = document.getElementById(contentId);
        
        // ESTRATÉGIA 2: Se não encontrou o minimizer no event, tentar encontrar pelo ID
        if (!minimizer) {
            console.log('🔄 Minimizer não veio no event, buscando pelo contexto...');
            // Buscar o minimizer que tem o onclick com este subsectionId
            const possibleMinimizers = document.querySelectorAll('.minimizer, .subsection-minimizer');
            for (let min of possibleMinimizers) {
                const onclickAttr = min.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes(`toggleSubsection('${subsectionId}'`)) {
                    minimizer = min;
                    console.log(`📍 Minimizer encontrado via onclick:`, minimizer);
                    break;
                }
            }
        }
        
        // ESTRATÉGIA 3: Buscar pelo elemento pai do minimizer
        if (!content && minimizer) {
            console.log('🔍 Buscando via elemento pai do minimizer...');
            const subsectionBlock = minimizer.closest('.subsection-block');
            if (subsectionBlock) {
                content = subsectionBlock.querySelector('.subsection-content');
                if (content) {
                    console.log(`📍 Encontrado via elemento pai: ${content.id}`);
                }
            }
        }
        
        // ESTRATÉGIA 4: Buscar diretamente pelo ID
        if (!content) {
            console.log(`🔍 Buscando diretamente por ID: ${contentId}`);
            content = document.getElementById(contentId);
        }
        
        // SE ENCONTRAMOS O CONTEÚDO E TEMOS MINIMIZER
        if (content) {
            // Se não temos minimizer, tentar encontrar um
            if (!minimizer) {
                const subsectionBlock = content.closest('.subsection-block');
                if (subsectionBlock) {
                    minimizer = subsectionBlock.querySelector('.minimizer, .subsection-minimizer');
                }
            }
            
            const isCollapsed = content.classList.contains('collapsed');
            content.classList.toggle('collapsed', !isCollapsed);
            
            // Atualizar o texto do minimizer se existir
            if (minimizer && minimizer.textContent) {
                minimizer.textContent = isCollapsed ? '−' : '+';
            }
            
            console.log(`✅ Subseção ${subsectionId} ${isCollapsed ? 'expandida' : 'recolhida'}`);
            console.log(`🔍 Elemento: ${content.id}, Estado: ${content.classList.contains('collapsed') ? 'collapsed' : 'expanded'}`);
            
            return true;
            
        } else {
            console.error(`❌ Conteúdo da subseção não encontrado: ${subsectionId}`);
            console.log(`🔍 Procurando por ID: ${contentId}`);
            
            // DEBUG: Mostrar o que existe no DOM
            const existingContents = document.querySelectorAll('.subsection-content');
            console.log(`📋 ${existingContents.length} elementos .subsection-content encontrados:`);
            existingContents.forEach((el, index) => {
                console.log(`   ${index + 1}. ID: "${el.id}" | Classes: "${el.className}"`);
            });
            
            return false;
        }
    };
}

// TOGGLE MACHINE SECTION - VERSÃO DEFINITIVA CORRIGIDA
if (typeof window.toggleMachineSection !== 'function') {
    window.toggleMachineSection = function(machineId, event) {
        if (event) event.stopPropagation();
        console.log(`🔧 toggleMachineSection DEFINITIVO chamado para máquina: ${machineId}`);
        
        let content = null;
        let minimizer = event?.target;
        let machineBlock = null;
        
        // ESTRATÉGIA 1: ID exato como está no DOM
        const contentId = `machine-content-${machineId}`;
        content = document.getElementById(contentId);
        
        // ESTRATÉGIA 2: Buscar por data attributes
        if (!content) {
            content = document.querySelector(`[data-machine="${machineId}"]`);
        }
        
        // ESTRATÉGIA 3: Buscar por classe contendo o ID
        if (!content) {
            content = document.querySelector(`[class*="${machineId}"]`);
        }
        
        // ESTRATÉGIA 4: Buscar no elemento pai do minimizer
        if (!content && minimizer) {
            machineBlock = minimizer.closest('.climatization-machine, .machine-block, [data-machine]');
            if (machineBlock) {
                content = machineBlock.querySelector('.machine-content, [data-machine-content]');
            }
        }
        
        // ESTRATÉGIA 5: Buscar por qualquer elemento com o ID
        if (!content) {
            const possibleElements = document.querySelectorAll(`[id*="${machineId}"]`);
            content = possibleElements[0] || null;
        }
        
        // SE ENCONTRAMOS O CONTEÚDO
        if (content && minimizer) {
            const isCollapsed = content.classList.contains('collapsed');
            content.classList.toggle('collapsed', !isCollapsed);
            
            // Atualizar o texto do minimizer se existir
            if (minimizer.textContent) {
                minimizer.textContent = isCollapsed ? '−' : '+';
            }
            
            // Encontrar o bloco pai se não encontrado ainda
            if (!machineBlock) {
                machineBlock = content.closest('.climatization-machine, .machine-block, [data-machine]');
            }
            
            // Alternar classe no bloco pai para estilização
            if (machineBlock) {
                machineBlock.classList.toggle('collapsed', !isCollapsed);
            }
            
            console.log(`✅ Máquina ${machineId} ${isCollapsed ? 'expandida' : 'recolhida'}`);
            return true;
            
        } else {
            console.error(`❌ Conteúdo da máquina não encontrado: ${machineId}`);
            console.log('🔍 Elementos disponíveis com machine:');
            const allMachines = document.querySelectorAll('[id*="machine"], [class*="machine"]');
            allMachines.forEach(el => {
                console.log(`   - ${el.id || el.className}:`, el);
            });
            
            return false;
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

// FUNÇÃO DE INICIALIZAÇÃO PARA TODOS OS TOGGLES
window.initializeAllToggles = function() {
    console.log('🔧 INICIALIZANDO TODOS OS TOGGLES...');
    
    // Inicializar seções
    const sections = document.querySelectorAll('.section-block, [data-section]');
    sections.forEach((section, index) => {
        const minimizer = section.querySelector('.section-minimizer, .minimizer');
        if (minimizer && !minimizer.hasAttribute('data-initialized')) {
            const sectionId = section.id?.replace('section-', '') || 
                            section.dataset.section || 
                            `section-${index}`;
            
            minimizer.addEventListener('click', (e) => {
                window.toggleSection(sectionId, e);
            });
            minimizer.setAttribute('data-initialized', 'true');
        }
    });
    
    // Inicializar subseções
    const subsections = document.querySelectorAll('.subsection-block, [data-subsection]');
    subsections.forEach((subsection, index) => {
        const minimizer = subsection.querySelector('.subsection-minimizer, .minimizer');
        if (minimizer && !minimizer.hasAttribute('data-initialized')) {
            const subsectionId = subsection.id?.replace('subsection-', '') || 
                               subsection.dataset.subsection || 
                               `subsection-${index}`;
            
            minimizer.addEventListener('click', (e) => {
                window.toggleSubsection(subsectionId, e);
            });
            minimizer.setAttribute('data-initialized', 'true');
        }
    });
    
    // Inicializar máquinas
    const machines = document.querySelectorAll('.climatization-machine, .machine-block, [data-machine]');
    machines.forEach((machine, index) => {
        const minimizer = machine.querySelector('.machine-minimizer, .minimizer');
        if (minimizer && !minimizer.hasAttribute('data-initialized')) {
            const machineId = machine.id?.replace('machine-', '') || 
                            machine.dataset.machine || 
                            `machine-${index}`;
            
            minimizer.addEventListener('click', (e) => {
                window.toggleMachineSection(machineId, e);
            });
            minimizer.setAttribute('data-initialized', 'true');
        }
    });
    
    console.log(`✅ ${sections.length} seções, ${subsections.length} subseções e ${machines.length} máquinas inicializadas`);
};

// Executar inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.initializeAllToggles();
        }, 100);
    });
} else {
    setTimeout(() => {
        window.initializeAllToggles();
    }, 100);
}

// ✅ STUBS DEFINITIVOS PARA AS FUNÇÕES FALTANTES
if (typeof window.calculateCapacitySolution !== 'function') {
    window.calculateCapacitySolution = function(roomId) {
        console.log(`🔧 calculateCapacitySolution STUB DEFINITIVO para ${roomId}`);
        
        // Cálculo básico de capacidade
        const totalGainsElement = document.getElementById(`total-ganhos-w-${roomId}`);
        const totalGains = totalGainsElement ? parseInt(totalGainsElement.textContent) || 0 : 0;
        
        // Converter W para TR (1 TR ≈ 3516.85 W)
        const capacityTR = totalGains / 3516.85;
        const capacityBTU = totalGains * 3.412;
        
        return {
            capacityBTU: Math.round(capacityBTU),
            capacityTR: Math.round(capacityTR * 100) / 100,
            sensibleLoad: Math.round(totalGains * 0.7),
            latentLoad: Math.round(totalGains * 0.3),
            totalLoad: totalGains,
            roomId: roomId,
            timestamp: new Date().toISOString()
        };
    };
}

if (typeof window.updateCapacityFromThermalGains !== 'function') {
    window.updateCapacityFromThermalGains = function(roomId, thermalGains) {
        console.log(`🔧 updateCapacityFromThermalGains STUB DEFINITIVO para ${roomId}`, thermalGains);
        
        // Calcular capacidade baseada nos ganhos térmicos
        const capacitySolution = calculateCapacitySolution(roomId);
        
        // Atualizar elementos DOM se existirem
        const elements = {
            capacityTR: document.getElementById(`total-tr-${roomId}`),
            capacityBTU: document.getElementById(`total-btu-${roomId}`)
        };
        
        if (elements.capacityTR) {
            elements.capacityTR.textContent = capacitySolution.capacityTR.toFixed(1);
        }
        
        return {
            success: true,
            capacitySolution: capacitySolution,
            thermalGains: thermalGains,
            message: 'Capacidade atualizada com sucesso (stub)'
        };
    };
}

// ✅ STUB DEFINITIVO PARA calculateVazaoArAndThermalGains
if (typeof window.calculateVazaoArAndThermalGains !== 'function') {
    window.calculateVazaoArAndThermalGains = function(roomId) {
        console.log(`🔧 calculateVazaoArAndThermalGains STUB DEFINITIVO para ${roomId}`);
        
        try {
            // Simular cálculo básico de vazão de ar
            const areaElement = document.querySelector(`[data-field="area"][data-room-id="${roomId}"]`);
            const area = areaElement ? parseFloat(areaElement.value) || 0 : 0;
            
            // Cálculo simplificado: 10 l/s por m²
            const vazaoAr = Math.round(area * 10);
            
            // Atualizar display se existir
            const vazaoDisplay = document.getElementById(`vazao-ar-${roomId}`);
            if (vazaoDisplay) {
                vazaoDisplay.textContent = vazaoAr;
            }
            
            // Disparar cálculo de ganhos térmicos se a função existir
            if (typeof window.updateThermalGains === 'function') {
                setTimeout(() => {
                    window.updateThermalGains(roomId);
                }, 100);
            }
            
            console.log(`✅ Vazão calculada (stub): ${vazaoAr} l/s para sala ${roomId}`);
            return vazaoAr;
            
        } catch (error) {
            console.error(`❌ Erro no stub calculateVazaoArAndThermalGains:`, error);
            return 0;
        }
    };
}

// Stub para outras funções comuns
const stubFunctions = [
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