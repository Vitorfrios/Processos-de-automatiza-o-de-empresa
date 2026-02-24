/* ==== INÍCIO: main-folder/filter-init.js ==== */
/**
 * filter-init.js - SISTEMA DE FILTROS E DELEÇÃO UNIVERSAL
 * 🔥 Contém todas as funções relacionadas a filtros e deleção
 * VERSÃO CORRIGIDA: Só ativa deleção universal quando filtro ligado
 */

// 🔥 IMPORTS: Sistemas de deleção universal
import { ButtonDeleteUniversal } from '../features/filters/button-delete-universal.js';
import { ButtonModeManager } from '../features/filters/button-mode-manager.js';
import { UniversalDeleteModal } from '../features/filters/universal-delete-modal.js';

/**
 * 🔥 FUNÇÕES DE SUPORTE PARA EXTRAÇÃO DE IDs
 */
const extractRoomIdFromDOM = (roomElement) => {
  const roomId = roomElement.getAttribute('data-room-id');
  if (roomId) {
    return roomId.replace(/\s+/g, '');
  }
  
  const elementId = roomElement.id;
  if (elementId && elementId.includes('sala')) {
    return elementId.replace(/\s+/g, '');
  }
  
  const roomIdElement = roomElement.querySelector('[data-room-id]');
  if (roomIdElement) {
    const foundId = roomIdElement.getAttribute('data-room-id');
    return foundId ? foundId.replace(/\s+/g, '') : null;
  }
  
  return null;
};

const extractProjectIdFromDOM = (projectElement) => {
  const projectId = projectElement.getAttribute('data-project-id');
  if (projectId) {
    return projectId.replace(/\s+/g, '');
  }
  
  const elementId = projectElement.id;
  if (elementId && elementId.includes('proj')) {
    return elementId.replace(/\s+/g, '');
  }
  
  return null;
};

const findRoomElement = (roomId) => {
  let roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
  if (roomElement) return roomElement;
  
  roomElement = document.getElementById(roomId);
  if (roomElement) return roomElement;
  
  const partialMatch = document.querySelector(`[id*="${roomId}"]`);
  if (partialMatch) return partialMatch;
  
  const allElements = document.querySelectorAll('[id]');
  for (const el of allElements) {
    if (el.id && el.id.includes(roomId)) {
      return el;
    }
  }
  
  return null;
};

const findAllMachineElementsInRoom = (roomElement) => {
  const selectors = [
    '.machine-item',
    '.maquina-item',
    '[id*="maq"]',
    '[id*="machine"]',
    '.equipment-item'
  ];
  
  const results = [];
  
  selectors.forEach(selector => {
    try {
      const elements = roomElement.querySelectorAll(selector);
      elements.forEach(el => {
        if (!results.includes(el)) {
          results.push(el);
        }
      });
    } catch (e) {}
  });
  
  return results;
};

const applyRemovalAnimation = (element) => {
  const originalHeight = element.scrollHeight;
  
  element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  element.style.overflow = 'hidden';
  
  requestAnimationFrame(() => {
    element.style.opacity = '0';
    element.style.transform = 'translateX(-20px) scale(0.95)';
    element.style.maxHeight = originalHeight + 'px';
    
    requestAnimationFrame(() => {
      element.style.maxHeight = '0';
      element.style.marginTop = '0';
      element.style.marginBottom = '0';
      element.style.paddingTop = '0';
      element.style.paddingBottom = '0';
      element.style.borderWidth = '0';
    });
  });
};

const removeElementFromDOM = (itemType, itemId, additionalIds = {}) => {
  console.log(`🗑️ Removendo ${itemType} ${itemId} do DOM...`);
  
  let element = null;
  const itemTypeLower = itemType.toLowerCase();

  switch (itemTypeLower) {
    case 'obra':
      element = document.querySelector(`[data-obra-id="${itemId}"]`) || document.getElementById(itemId);
      break;

    case 'projeto':
      element = document.getElementById(itemId) || document.querySelector(`[data-project-id="${itemId}"]`);
      break;

    case 'sala':
      element = document.querySelector(`[data-room-id="${itemId}"]`) || document.getElementById(itemId);
      break;

    case 'maquina':
      if (additionalIds.originalMachineId) {
        const originalId = additionalIds.originalMachineId;
        element = document.getElementById(originalId) || document.querySelector(`[data-machine-id="${originalId}"]`);
      }
      
      if (!element && additionalIds.roomId) {
        const roomElement = findRoomElement(additionalIds.roomId);
        if (roomElement) {
          const machineElements = findAllMachineElementsInRoom(roomElement);
          const index = parseInt(itemId);
          if (!isNaN(index) && index < machineElements.length) {
            element = machineElements[index];
          } else if (machineElements.length === 1) {
            element = machineElements[0];
          }
        }
      }
      break;
  }

  if (element) {
    console.log(`✅ Elemento encontrado para remoção`);
    applyRemovalAnimation(element);
    
    setTimeout(() => {
      if (element.parentNode) {
        element.remove();
        console.log(`✅ Elemento ${itemType} removido do DOM`);
      }
    }, 50);
  } else {
    console.warn(`⚠️ Não encontrou elemento ${itemType} ${itemId} no DOM`);
  }
};

/**
 * 🔥 Configura deleção universal SOMENTE quando filtro ativo
 */
function setupUniversalDeletionOverride() {
    console.log("🔄 [FILTER-INIT] Preparando sobrescrita do sistema de deleção...");

    // Guardar referências às funções originais
    const originalFunctions = {
        deleteObra: window.deleteObra,
        deleteProject: window.deleteProject,
        deleteRoom: window.deleteRoom,
        deleteMachine: window.deleteMachine
    };

    let isOverrideActive = false;

    // Função para ativar/desativar a sobrescrita
    function toggleOverride(active) {
        if (active === isOverrideActive) return;

        console.log(`🔄 [UNIVERSAL-DELETE] ${active ? 'Ativando' : 'Desativando'} sobrescrita`);

        if (active) {
            // 🔥 ATIVAR: Substituir por versão universal
            window.deleteObra = async function (obraName, obraId) {
                const cleanObraId = obraId.replace(/\s+/g, '');
                return handleUniversalDeletion('obra', obraName, cleanObraId);
            };

            window.deleteProject = async function (obraId, projectId) {
                console.log(`🔧 deleteProject chamado: obraId="${obraId}", projectId="${projectId}"`);
                
                const cleanObraId = obraId.replace(/\s+/g, '');
                const cleanProjectId = projectId.replace(/\s+/g, '');
                
                const projectElement = document.getElementById(projectId);
                let projectName = `Projeto ${projectId}`;

                if (projectElement) {
                    const header = projectElement.querySelector('.project-header h3');
                    if (header) {
                        projectName = header.textContent || projectName;
                    }
                    
                    const extractedProjectId = extractProjectIdFromDOM(projectElement);
                    if (extractedProjectId) {
                        projectId = extractedProjectId;
                    }
                }

                return handleUniversalDeletion('projeto', projectName, cleanProjectId, { 
                    obraId: cleanObraId 
                });
            };

            window.deleteRoom = async function (obraId, projectId, roomId) {
                console.log(`🔧 deleteRoom chamado: obraId="${obraId}", projectId="${projectId}", roomId="${roomId}"`);
                
                const cleanObraId = obraId.replace(/\s+/g, '');
                const cleanProjectId = projectId.replace(/\s+/g, '');
                const cleanRoomId = roomId.replace(/\s+/g, '');
                
                const roomElement = document.getElementById(roomId);
                let roomName = `Sala ${roomId}`;

                if (roomElement) {
                    const header = roomElement.querySelector('.room-header h4');
                    if (header) {
                        roomName = header.textContent || roomName;
                    }
                    
                    const extractedRoomId = extractRoomIdFromDOM(roomElement);
                    if (extractedRoomId) {
                        roomId = extractedRoomId;
                    }
                }

                return handleUniversalDeletion('sala', roomName, cleanRoomId, { 
                    obraId: cleanObraId, 
                    projectId: cleanProjectId 
                });
            };

            window.deleteMachine = async function (machineId) {
                console.log(`🔧 deleteMachine chamado com ID: ${machineId}`);
                
                const cleanMachineId = machineId.replace(/\s+/g, '');
                
                const machineElement = document.getElementById(machineId);
                let machineName = `Máquina ${machineId}`;

                if (machineElement) {
                    const nameElement = machineElement.querySelector('.machine-name');
                    if (nameElement) {
                        machineName = nameElement.textContent || machineName;
                    }
                }

                const parts = cleanMachineId.split('_');
                
                if (parts.length >= 5) {
                    const obraId = `obra_${parts[1]}`;
                    const projectId = `${obraId}_proj_${parts[3]}_${parts[4]}`;
                    const roomId = `${projectId}_sala_${parts[6]}_${parts[7]}`;
                    
                    // Usar o último número como índice
                    let machineIndex = 0;
                    for (let i = parts.length - 1; i >= 0; i--) {
                        const num = parseInt(parts[i]);
                        if (!isNaN(num)) {
                            machineIndex = num;
                            break;
                        }
                    }

                    return handleUniversalDeletion('maquina', machineName, machineIndex.toString(), {
                        obraId,
                        projectId,
                        roomId,
                        originalMachineId: machineId,
                        machineName: machineName
                    });
                }
                
                throw new Error(`Estrutura inválida de machineId: ${cleanMachineId}`);
            };

            console.log("✅ Funções de deleção universais ATIVADAS");
        } else {
            // 🔥 DESATIVAR: Restaurar funções originais
            window.deleteObra = originalFunctions.deleteObra;
            window.deleteProject = originalFunctions.deleteProject;
            window.deleteRoom = originalFunctions.deleteRoom;
            window.deleteMachine = originalFunctions.deleteMachine;

            console.log("✅ Funções de deleção originais RESTAURADAS");
        }

        isOverrideActive = active;
    }

    // 🔥 FUNÇÃO DE DELEÇÃO UNIVERSAL
    const handleUniversalDeletion = async (itemType, itemName, itemId, additionalIds = {}) => {
        console.log(`🔄 [UNIVERSAL-DELETE] Iniciando deleção para ${itemType}: ${itemName} (ID: ${itemId})`);

        const confirmed = await window.UniversalDeleteModal.confirmDelete(
            itemType,
            itemName,
            `ID: ${itemId}`
        );

        if (!confirmed) {
            console.log(`❌ Deleção de ${itemType} cancelada pelo usuário`);
            return false;
        }

        let pathArray = null;
        
        switch (itemType.toLowerCase()) {
            case 'obra':
                pathArray = ['obras', itemId];
                break;
            case 'projeto':
                const obraId = additionalIds.obraId;
                if (!obraId) {
                    throw new Error(`Obra ID não fornecido para deletar projeto ${itemId}`);
                }
                pathArray = ['obras', obraId, 'projetos', itemId];
                break;
            case 'sala':
                const salaObraId = additionalIds.obraId;
                const salaProjectId = additionalIds.projectId;
                if (!salaObraId || !salaProjectId) {
                    throw new Error(`IDs necessários não fornecidos para deletar sala ${itemId}`);
                }
                pathArray = ['obras', salaObraId, 'projetos', salaProjectId, 'salas', itemId];
                break;
            case 'maquina':
                const machineObraId = additionalIds.obraId;
                const machineProjectId = additionalIds.projectId;
                const machineRoomId = additionalIds.roomId;
                
                if (!machineObraId || !machineProjectId || !machineRoomId) {
                    throw new Error(`IDs necessários não fornecidos para deletar máquina ${itemId}`);
                }
                
                const machineIndex = parseInt(itemId);
                if (isNaN(machineIndex)) {
                    throw new Error(`Índice de máquina inválido: ${itemId}`);
                }
                
                pathArray = ['obras', machineObraId, 'projetos', machineProjectId, 'salas', machineRoomId, 'maquinas', machineIndex];
                break;
            default:
                throw new Error(`Tipo de item não suportado: ${itemType}`);
        }

        console.log(`🔧 Path para deleção:`, pathArray);

        // Executar deleção via API
        const response = await fetch('/api/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: pathArray,
                itemType: itemType,
                itemName: itemName,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro HTTP ${response.status} ao deletar ${itemType}: ${errorText}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log(`✅ ${itemType} "${itemName}" deletado com sucesso`);

            if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.showToast) {
                window.ButtonDeleteUniversal.showToast(`${itemType} "${itemName}" deletado permanentemente`, 'success');
            }

            removeElementFromDOM(itemType, itemId, additionalIds);

            if (itemType === 'obra') {
                setTimeout(() => {
                    if (window.FilterSystem) {
                        window.FilterSystem.reloadObras();
                    }
                }, 187);
            }

            return true;
        } else {
            throw new Error(`Erro ao deletar ${itemType}: ${result.error}`);
        }
    };

    // Configurar listener para mudanças no filtro
    function setupFilterListener() {
        const filterToggle = document.getElementById('filter-toggle');
        if (filterToggle) {
            filterToggle.addEventListener('change', function(e) {
                toggleOverride(e.target.checked);
            });

            // Verificar estado inicial
            toggleOverride(filterToggle.checked);
            console.log(`🎚️ Estado inicial do filtro: ${filterToggle.checked ? 'ATIVO' : 'INATIVO'}`);
        } else if (window.FilterSystem) {
            // Usar FilterSystem para detectar mudanças
            const originalToggleChange = window.FilterSystem.handleFilterToggleChange;
            if (originalToggleChange) {
                window.FilterSystem.handleFilterToggleChange = function(isActive) {
                    originalToggleChange.call(this, isActive);
                    toggleOverride(isActive);
                };
            }
        }
    }

    // Inicializar listener
    setTimeout(() => setupFilterListener(), 125);

    console.log("✅ Sistema de sobrescrita condicional configurado");
}

/**
 * 🔥 Configura integração com FilterSystem
 */
function setupFilterSystemIntegration() {
    console.log("🔧 [FILTER-INIT] Configurando integração com FilterSystem...");

    if (!window.FilterSystem) {
        console.warn("⚠️ [FILTER-INIT] FilterSystem não disponível para integração");
        return;
    }

    if (!window.ButtonModeManager) {
        console.error("❌ [FILTER-INIT] ButtonModeManager não disponível para integração");
        return;
    }

    const originalHandleToggleChange = window.FilterSystem.handleFilterToggleChange;

    if (typeof originalHandleToggleChange === 'function') {
        window.FilterSystem.handleFilterToggleChange = function (isActive) {
            console.log(`🎛️ [INTEGRAÇÃO] Filtro ${isActive ? 'ATIVADO' : 'DESATIVADO'}`);

            originalHandleToggleChange.call(this, isActive);

            if (isActive) {
                if (window.ButtonModeManager && window.ButtonModeManager.enableFilterMode) {
                    window.ButtonModeManager.enableFilterMode();
                }
            } else {
                if (window.ButtonModeManager && window.ButtonModeManager.disableFilterMode) {
                    window.ButtonModeManager.disableFilterMode();
                }
            }
        };

        console.log("✅ [FILTER-INIT] Integração FilterSystem-ButtonModeManager configurada");
    }
}

/**
 * 🔥 Aplica configuração inicial dos botões após carregar obras
 */
function setupInitialButtonConfiguration() {
    console.log("🔧 [FILTER-INIT] Configurando botões inicialmente...");

    // Apenas configurar se filtro já estiver ativo
    const filterToggle = document.getElementById('filter-toggle');
    if (filterToggle && filterToggle.checked) {
        if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.setupAllDeleteButtons) {
            setTimeout(() => {
                const buttonsConfigured = window.ButtonDeleteUniversal.setupAllDeleteButtons();
                console.log(`✅ [FILTER-INIT] ${buttonsConfigured} botões de deleção REAL configurados`);
            }, 62);
        }
    }

    if (window.ButtonModeManager && typeof window.ButtonModeManager.applyMode === 'function') {
        setTimeout(() => {
            window.ButtonModeManager.applyMode();
            console.log("✅ [FILTER-INIT] Modo inicial aplicado aos botões");
        }, 75);
    }
}

/**
 * Configura listeners para detectar novas obras carregadas
 */
function setupDynamicButtonConfiguration() {
    console.log("🔗 [FILTER-INIT] Configurando listeners de carregamento...");

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const hasObras = Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === 1 &&
                    (node.classList?.contains('obra-wrapper') ||
                        node.querySelector?.('.obra-wrapper'))
                );

                if (hasObras) {
                    console.log("👀 [FILTER-INIT] Novas obras detectadas, reconfigurando botões...");
                    setTimeout(() => {
                        if (window.ButtonModeManager && window.ButtonModeManager.applyMode) {
                            window.ButtonModeManager.applyMode();
                        }
                        // Só configurar botões universais se filtro ativo
                        const filterToggle = document.getElementById('filter-toggle');
                        if (filterToggle && filterToggle.checked) {
                            if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.setupAllDeleteButtons) {
                                window.ButtonDeleteUniversal.setupAllDeleteButtons();
                            }
                        }
                    }, 62);
                }
            }
        });
    });

    const projectsContainer = document.getElementById('projects-container');
    if (projectsContainer) {
        observer.observe(projectsContainer, { childList: true, subtree: true });
        console.log("🔍 [FILTER-INIT] Observer configurado para projetos-container");
    }
}

/**
 * Aguardar sistema carregar
 */
function waitForSystemLoad() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
            return;
        }

        const checkInterval = setInterval(() => {
            if (window.systemLoaded || document.readyState === 'complete') {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Timeout de segurança
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
        }, 500);
    });
}

/**
 * Inicializa o sistema de filtros e deleção
 */
export async function initializeFilterSystem() {
    try {
        console.log("🔧 [FILTER-INIT] Inicializando sistema de filtros...");

        // Aguardar sistema carregar
        await waitForSystemLoad();

        console.log("🔧 [FILTER-INIT] Criando sistemas...");
        window.ButtonDeleteUniversal = new ButtonDeleteUniversal();
        window.ButtonModeManager = new ButtonModeManager();
        window.UniversalDeleteModal = UniversalDeleteModal;

        console.log("✅ [FILTER-INIT] Sistemas criados");

        console.log("🔧 [FILTER-INIT] Inicializando ButtonModeManager...");
        if (window.ButtonModeManager && window.ButtonModeManager.initialize) {
            await window.ButtonModeManager.initialize();
        }

        console.log("🔄 [FILTER-INIT] Configurando sistema de deleção condicional...");
        setupUniversalDeletionOverride();

        console.log("🔗 [FILTER-INIT] Configurando integrações...");
        setupFilterSystemIntegration();

        console.log("🔧 [FILTER-INIT] Agendando configuração inicial dos botões...");
        setupInitialButtonConfiguration();

        console.log("🔗 [FILTER-INIT] Configurando listeners dinâmicos...");
        setupDynamicButtonConfiguration();

        console.log("✅ [FILTER-INIT] Sistema de filtros completamente inicializado");
        return true;

    } catch (error) {
        console.error("❌ [FILTER-INIT] ERRO na inicialização do sistema de filtros:", error);
        throw error;
    }
}
/* ==== FIM: main-folder/filter-init.js ==== */