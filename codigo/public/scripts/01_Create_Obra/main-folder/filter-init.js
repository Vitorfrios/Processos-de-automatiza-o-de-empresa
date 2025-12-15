/* ==== INÍCIO: main-folder/filter-init.js ==== */
/**
 * filter-init.js - SISTEMA DE FILTROS E DELEÇÃO UNIVERSAL
 * 🔥 Contém todas as funções relacionadas a filtros e deleção
 */

// 🔥 IMPORTS: Sistemas de deleção universal
import { ButtonDeleteUniversal } from '../features/filters/button-delete-universal.js';
import { ButtonModeManager } from '../features/filters/button-mode-manager.js';
import { UniversalDeleteModal } from '../features/filters/universal-delete-modal.js';

/**
 * 🔥 FUNÇÕES DE SUPORTE PARA EXTRAÇÃO DE IDs
 */

/**
 * Extrai ID da sala do DOM corretamente (remove espaços)
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

/**
 * Extrai ID de projeto do DOM corretamente (remove espaços)
 */
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

/**
 * Busca o índice correto da máquina na estrutura da sala
 */
const findMachineIndexInRoom = async (obraId, projectId, roomId, machineElementId) => {
  try {
    console.log(`🔍 Buscando índice da máquina: ${machineElementId}`);
    
    // Buscar obra completa para encontrar posição da máquina
    const response = await fetch(`/obras/${obraId}`);
    
    if (!response.ok) {
      throw new Error(`Não foi possível buscar obra ${obraId}`);
    }
    
    const obra = await response.json();
    if (!obra || !obra.projetos) {
      throw new Error(`Obra ${obraId} não encontrada ou sem projetos`);
    }
    
    // Encontrar projeto
    const projeto = obra.projetos.find(p => p.id === projectId);
    if (!projeto || !projeto.salas) {
      throw new Error(`Projeto ${projectId} não encontrado ou sem salas`);
    }
    
    // Encontrar sala
    const sala = projeto.salas.find(s => s.id === roomId);
    if (!sala || !sala.maquinas) {
      throw new Error(`Sala ${roomId} não encontrada ou sem máquinas`);
    }
    
    console.log(`🔍 Sala encontrada com ${sala.maquinas.length} máquina(s)`);
    
    // Buscar por correspondência exata
    for (let i = 0; i < sala.maquinas.length; i++) {
      const maquina = sala.maquinas[i];
      
      // Tentar por nome da máquina
      if (maquina.nome) {
        const cleanMachineName = maquina.nome.toLowerCase().replace(/\s+/g, '');
        const cleanElementId = machineElementId.toLowerCase().replace(/\s+/g, '');
        
        if (cleanElementId.includes(cleanMachineName)) {
          console.log(`✅ Encontrada máquina por nome '${maquina.nome}' no índice ${i}`);
          return i;
        }
      }
      
      // Tentar por ID da máquina (se existir)
      if (maquina.id && machineElementId.includes(maquina.id)) {
        console.log(`✅ Encontrada máquina por ID '${maquina.id}' no índice ${i}`);
        return i;
      }
    }
    
    // Se não encontrou correspondência, usar a primeira máquina
    console.log(`⚠️ Não encontrou correspondência exata, usando primeira máquina`);
    return 0;
    
  } catch (error) {
    console.error(`❌ Erro ao buscar índice da máquina:`, error);
    throw error;
  }
};

/**
 * Encontra elemento de sala por múltiplos métodos
 */
const findRoomElement = (roomId) => {
  // Método 1: data-room-id
  let roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
  if (roomElement) return roomElement;
  
  // Método 2: ID direto
  roomElement = document.getElementById(roomId);
  if (roomElement) return roomElement;
  
  // Método 3: ID parcial
  const partialMatch = document.querySelector(`[id*="${roomId}"]`);
  if (partialMatch) return partialMatch;
  
  // Método 4: Buscar por conteúdo
  const allElements = document.querySelectorAll('[id]');
  for (const el of allElements) {
    if (el.id && el.id.includes(roomId)) {
      return el;
    }
  }
  
  return null;
};

/**
 * Encontra todos os elementos de máquina dentro de uma sala
 */
const findAllMachineElementsInRoom = (roomElement) => {
  const selectors = [
    '.machine-item',
    '.maquina-item',
    '[id*="maq"]',
    '[id*="machine"]',
    '.equipment-item',
    '.machine-container > *',
    '.maquinas-container > *',
    '[class*="machine"]',
    '[class*="maquina"]'
  ];
  
  const results = [];
  
  selectors.forEach(selector => {
    try {
      const elements = roomElement.querySelectorAll(selector);
      elements.forEach(el => {
        // Evitar duplicados
        if (!results.includes(el)) {
          results.push(el);
        }
      });
    } catch (e) {
      // Ignorar seletores inválidos
    }
  });
  
  return results;
};

/**
 * Encontra máquina pelo nome
 */
const findMachineByName = (machineElements, machineName) => {
  if (!machineName) return null;
  
  const cleanSearchName = machineName.toLowerCase().replace(/\s+/g, '');
  
  for (const element of machineElements) {
    // Verificar no texto do elemento
    const elementText = element.textContent.toLowerCase().replace(/\s+/g, '');
    if (elementText.includes(cleanSearchName) || cleanSearchName.includes(elementText)) {
      return element;
    }
    
    // Verificar em elementos filhos com classe .machine-name, .name, etc.
    const nameElements = element.querySelectorAll('.machine-name, .name, .maquina-nome, .equipment-name');
    for (const nameEl of nameElements) {
      const nameText = nameEl.textContent.toLowerCase().replace(/\s+/g, '');
      if (nameText.includes(cleanSearchName) || cleanSearchName.includes(nameText)) {
        return element;
      }
    }
    
    // Verificar no título ou aria-label
    const title = element.getAttribute('title') || element.getAttribute('aria-label') || '';
    if (title.toLowerCase().includes(machineName.toLowerCase())) {
      return element;
    }
  }
  
  return null;
};

/**
 * Aplica animação de remoção ao elemento
 */
const applyRemovalAnimation = (element) => {
  // Salvar altura original para animação suave
  const originalHeight = element.scrollHeight;
  const originalMargin = window.getComputedStyle(element).margin;
  const originalPadding = window.getComputedStyle(element).padding;
  
  // Configurar transição
  element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  element.style.overflow = 'hidden';
  
  // Animar
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

/**
 * Atualiza contador de máquinas na sala
 */
const updateMachineCountInRoom = (roomId) => {
  if (!roomId) return;
  
  const roomElement = findRoomElement(roomId);
  if (!roomElement) return;
  
  const machineElements = findAllMachineElementsInRoom(roomElement);
  const count = machineElements.length;
  
  console.log(`🔍 Sala ${roomId} agora tem ${count} máquina(s)`);
  
  // Atualizar elementos de contador
  updateCounterElements(roomElement, count, 'máquina', 'máquinas');
};

/**
 * Atualiza elementos de contador
 */
const updateCounterElements = (containerElement, count, singular, plural) => {
  // Buscar elementos de contador existentes
  const counterSelectors = [
    `.${singular}-count`,
    `.${plural}-count`,
    `.count`,
    `[data-count="${singular}"]`,
    `[data-count="${plural}"]`
  ];
  
  counterSelectors.forEach(selector => {
    const elements = containerElement.querySelectorAll(selector);
    elements.forEach(el => {
      el.textContent = count;
      el.setAttribute('data-count', count);
    });
  });
  
  // Mostrar/ocultar mensagem de "vazio"
  const emptyMessageSelectors = [
    `.no-${plural}-message`,
    `.empty-${singular}-message`,
    `[data-empty="${singular}"]`
  ];
  
  if (count === 0) {
    // Mostrar mensagem se não existir
    let emptyMessage = null;
    emptyMessageSelectors.forEach(selector => {
      const msg = containerElement.querySelector(selector);
      if (msg) emptyMessage = msg;
    });
    
    if (!emptyMessage) {
      emptyMessage = createEmptyMessage(singular, plural);
      containerElement.appendChild(emptyMessage);
    }
  } else {
    // Remover mensagens de vazio
    emptyMessageSelectors.forEach(selector => {
      const messages = containerElement.querySelectorAll(selector);
      messages.forEach(msg => msg.remove());
    });
  }
};

/**
 * Cria mensagem de "vazio"
 */
const createEmptyMessage = (singular, plural) => {
  const message = document.createElement('div');
  message.className = `no-${plural}-message empty-message`;
  message.setAttribute('data-empty', singular);
  message.textContent = `Nenhuma ${singular} adicionada`;
  message.style.cssText = `
    text-align: center;
    padding: 20px;
    color: #666;
    font-style: italic;
    background: #f9f9f9;
    border-radius: 4px;
    margin: 10px 0;
  `;
  return message;
};

/**
 * Verifica se sala está vazia
 */
const checkIfRoomIsEmpty = (roomId) => {
  const roomElement = findRoomElement(roomId);
  if (!roomElement) return;
  
  const machineElements = findAllMachineElementsInRoom(roomElement);
  if (machineElements.length === 0) {
    console.log(`📭 Sala ${roomId} está vazia`);
    // Pode adicionar lógica adicional aqui
  }
};

/**
 * Limpa containers vazios
 */
const cleanupEmptyContainers = (parentElement) => {
  if (!parentElement) return;
  
  // Verificar se o container está vazio
  const hasVisibleChildren = Array.from(parentElement.children).some(child => {
    return child.style.display !== 'none' && 
           child.style.opacity !== '0' &&
           !child.classList.contains('empty-message');
  });
  
  if (!hasVisibleChildren) {
    // Se container está vazio, pode adicionar mensagem ou remover
    const isEmptyContainer = parentElement.classList.contains('machines-container') ||
                            parentElement.classList.contains('rooms-container') ||
                            parentElement.classList.contains('projects-container');
    
    if (isEmptyContainer) {
      // Adicionar mensagem de vazio se não existir
      const existingMessage = parentElement.querySelector('.empty-container-message');
      if (!existingMessage) {
        const message = document.createElement('div');
        message.className = 'empty-container-message';
        message.textContent = 'Este container está vazio';
        message.style.cssText = `
          text-align: center;
          padding: 15px;
          color: #999;
          font-style: italic;
          font-size: 0.9em;
        `;
        parentElement.appendChild(message);
      }
    }
  } else {
    // Remover mensagens de container vazio se existirem
    const emptyMessages = parentElement.querySelectorAll('.empty-container-message');
    emptyMessages.forEach(msg => msg.remove());
  }
};

/**
 * Tenta recuperação removendo elementos invisíveis
 */
const attemptRecoveryRemoval = (itemType) => {
  if (itemType !== 'maquina') return;
  
  console.log(`🔄 Tentando recuperação para máquinas...`);
  
  // Buscar elementos invisíveis ou com opacidade 0
  const invisibleSelectors = [
    '[style*="opacity: 0"]',
    '[style*="display: none"]',
    '[style*="visibility: hidden"]',
    '.removing',
    '.deleting',
    '.hidden-machine'
  ];
  
  invisibleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`🔍 Encontrados ${elements.length} elementos com ${selector}`);
      elements.forEach(el => {
        if (el.parentNode) {
          el.remove();
          console.log(`🗑️ Removido elemento invisível: ${el.id || 'sem id'}`);
        }
      });
    }
  });
};

/**
 * Remove elemento do DOM baseado no tipo e ID - COMPLETA E CORRIGIDA
 */
const removeElementFromDOM = (itemType, itemId, additionalIds = {}) => {
  console.log(`🗑️ Removendo ${itemType} ${itemId} do DOM...`);
  console.log(`🔍 Additional IDs:`, additionalIds);

  let element = null;
  let foundBy = '';
  const itemTypeLower = itemType.toLowerCase();

  switch (itemTypeLower) {
    case 'obra':
      // Buscar obra por data-attribute ou ID
      element = document.querySelector(`[data-obra-id="${itemId}"]`);
      if (element) {
        foundBy = 'data-obra-id';
      } else {
        element = document.getElementById(itemId);
        foundBy = element ? 'id' : 'not found';
      }
      break;

    case 'projeto':
      // Buscar projeto por ID ou data-attribute
      element = document.getElementById(itemId);
      if (element) {
        foundBy = 'id';
      } else {
        element = document.querySelector(`[data-project-id="${itemId}"]`);
        foundBy = element ? 'data-project-id' : 'not found';
      }
      break;

    case 'sala':
      // Buscar sala por data-attribute ou ID
      element = document.querySelector(`[data-room-id="${itemId}"]`);
      if (element) {
        foundBy = 'data-room-id';
      } else {
        element = document.getElementById(itemId);
        foundBy = element ? 'id' : 'not found';
      }
      break;

    case 'maquina':
      // 🔥 CORREÇÃO CRÍTICA: Para máquinas, temos múltiplas estratégias
      
      // ESTRATÉGIA 1: Usar ID original se disponível
      if (additionalIds.originalMachineId) {
        const originalId = additionalIds.originalMachineId;
        console.log(`🔍 Estratégia 1: Buscando pelo ID original: ${originalId}`);
        
        element = document.getElementById(originalId);
        if (element) {
          foundBy = 'id (original)';
          break;
        }
        
        // Tentar data-machine-id
        element = document.querySelector(`[data-machine-id="${originalId}"]`);
        if (element) {
          foundBy = 'data-machine-id';
          break;
        }
      }
      
      // ESTRATÉGIA 2: Usar roomId para buscar na sala específica
      if (additionalIds.roomId && !element) {
        console.log(`🔍 Estratégia 2: Buscando na sala ${additionalIds.roomId}`);
        
        // Encontrar a sala
        const roomElement = findRoomElement(additionalIds.roomId);
        if (roomElement) {
          console.log(`✅ Sala encontrada`);
          
          // Buscar todas as máquinas dentro da sala
          const machineElements = findAllMachineElementsInRoom(roomElement);
          console.log(`🔍 Encontradas ${machineElements.length} máquinas na sala`);
          
          if (machineElements.length > 0) {
            // Tentar usar o índice (itemId é o índice da máquina)
            const index = parseInt(itemId);
            if (!isNaN(index) && index < machineElements.length) {
              element = machineElements[index];
              foundBy = `índice ${index} na sala`;
              break;
            }
            
            // Se só tem uma máquina, usar ela
            if (machineElements.length === 1) {
              element = machineElements[0];
              foundBy = 'única máquina na sala';
              break;
            }
            
            // Tentar encontrar pelo nome da máquina
            if (additionalIds.machineName && !element) {
              element = findMachineByName(machineElements, additionalIds.machineName);
              if (element) {
                foundBy = 'nome da máquina';
                break;
              }
            }
          }
        }
      }
      
      // ESTRATÉGIA 3: Buscar em todo o documento
      if (!element) {
        console.log(`🔍 Estratégia 3: Buscando em todo o documento`);
        
        // Buscar todos os elementos que parecem ser máquinas
        const allMachineElements = document.querySelectorAll(`
          [id*="maq"], 
          [id*="machine"],
          .machine-item,
          .maquina-item,
          .equipment-item,
          [class*="machine"],
          [class*="maquina"]
        `);
        
        console.log(`🔍 Encontrados ${allMachineElements.length} elementos no total`);
        
        if (allMachineElements.length > 0) {
          // Usar índice se disponível
          const index = parseInt(itemId);
          if (!isNaN(index) && index < allMachineElements.length) {
            element = allMachineElements[index];
            foundBy = `índice ${index} global`;
            break;
          }
          
          // Se só tem um, usar ele
          if (allMachineElements.length === 1) {
            element = allMachineElements[0];
            foundBy = 'única máquina global';
            break;
          }
        }
      }
      
      // Se não encontrou por nenhum método
      if (!element) {
        foundBy = 'not found';
        console.warn(`⚠️ Não conseguiu encontrar elemento de máquina`);
      }
      break;

    default:
      console.warn(`⚠️ Tipo de item desconhecido: ${itemType}`);
      return;
  }

  // 🔥 REMOVER ELEMENTO SE ENCONTRADO
  if (element) {
    console.log(`✅ Elemento encontrado (${foundBy}):`, element);
    console.log(`✅ ID do elemento: ${element.id || 'sem id'}`);
    console.log(`✅ Classes: ${element.className.substring(0, 100)}...`);
    
    // 🔥 ANIMAÇÃO DE REMOÇÃO SUAVE
    applyRemovalAnimation(element);
    
    // 🔥 REMOVER APÓS ANIMAÇÃO
    setTimeout(() => {
      if (element.parentNode) {
        const parent = element.parentNode;
        element.remove();
        console.log(`✅ Elemento ${itemType} removido do DOM`);
        
        // 🔥 ATUALIZAÇÕES PÓS-REMOÇÃO
        if (itemTypeLower === 'maquina') {
          // Atualizar contador de máquinas na sala
          updateMachineCountInRoom(additionalIds.roomId);
          
          // Verificar se sala ficou vazia
          if (additionalIds.roomId) {
            checkIfRoomIsEmpty(additionalIds.roomId);
          }
        }
        
        // Limpar elementos vazios no parent
        cleanupEmptyContainers(parent);
      }
    }, 400);
    
  } else {
    console.warn(`⚠️ Não encontrou elemento ${itemType} ${itemId} no DOM`);
    console.warn(`⚠️ Método usado: ${foundBy}`);
    
    // 🔥 TENTATIVA DE RECUPERAÇÃO: Remover elementos invisíveis
    attemptRecoveryRemoval(itemTypeLower);
  }
};

/**
 * 🔥 Configura deleção universal para substituir sistema antigo
 */
function setupUniversalDeletionOverride() {
  console.log("🔄 [FILTER-INIT] Configurando sobrescrita do sistema de deleção...");

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
        
        // 🔥 CORREÇÃO: Usar 'maquinas' SEM ACENTO
        pathArray = ['obras', machineObraId, 'projetos', machineProjectId, 'salas', machineRoomId, 'maquinas', machineIndex];
        break;
      default:
        throw new Error(`Tipo de item não suportado: ${itemType}`);
    }

    if (!pathArray) {
      throw new Error(`Não foi possível determinar path para ${itemType}`);
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
        }, 1500);
      }

      return true;
    } else {
      throw new Error(`Erro ao deletar ${itemType}: ${result.error}`);
    }
  };

  // 🔥 SOBRESCREVER FUNÇÕES ORIGINAIS

  if (window.deleteObra) {
    window.deleteObra = async function (obraName, obraId) {
      const cleanObraId = obraId.replace(/\s+/g, '');
      return handleUniversalDeletion('obra', obraName, cleanObraId);
    };
    console.log("✅ Função deleteObra sobrescrita para deleção universal");
  }

  if (window.deleteProject) {
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
    console.log("✅ Função deleteProject sobrescrita para deleção universal");
  }

  if (window.deleteRoom) {
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
    console.log("✅ Função deleteRoom sobrescrita para deleção universal");
  }

  if (window.deleteMachine) {
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
        
        const machineIndex = await findMachineIndexInRoom(obraId, projectId, roomId, cleanMachineId);
        
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
    console.log("✅ Função deleteMachine sobrescrita para deleção universal");
  }

  console.log("✅ Sistema de deleção universal configurado para substituir funções originais");
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
        window.ButtonModeManager.enableFilterMode();
      } else {
        window.ButtonModeManager.disableFilterMode();
      }

      if (window.ButtonModeManager && typeof window.ButtonModeManager.applyMode === 'function') {
        window.ButtonModeManager.applyMode();
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

  if (window.ButtonDeleteUniversal && typeof window.ButtonDeleteUniversal.setupAllDeleteButtons === 'function') {
    setTimeout(() => {
      const buttonsConfigured = window.ButtonDeleteUniversal.setupAllDeleteButtons();
      console.log(`✅ [FILTER-INIT] ${buttonsConfigured} botões de deleção REAL configurados`);
    }, 500);
  }

  if (window.ButtonModeManager && typeof window.ButtonModeManager.applyMode === 'function') {
    setTimeout(() => {
      window.ButtonModeManager.applyMode();
      console.log("✅ [FILTER-INIT] Modo inicial aplicado aos botões");
    }, 600);
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
            if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.setupAllDeleteButtons) {
              window.ButtonDeleteUniversal.setupAllDeleteButtons();
            }
          }, 500);
        }
      }
    });
  });

  const projectsContainer = document.getElementById('projects-container');
  if (projectsContainer) {
    observer.observe(projectsContainer, { childList: true, subtree: true });
    console.log("🔍 [FILTER-INIT] Observer configurado para projetos-container");
  }

  // Forçar configuração após timeout
  setTimeout(() => {
    console.log("⏰ [FILTER-INIT] Forçando configuração de botões");
    if (window.ButtonDeleteUniversal && window.ButtonDeleteUniversal.setupAllDeleteButtons) {
      window.ButtonDeleteUniversal.setupAllDeleteButtons();
    }
  }, 3000);
}

/**
 * Inicializa o sistema de filtros e deleção
 */
export async function initializeFilterSystem() {
  try {
    console.log("🔧 [FILTER-INIT] Inicializando sistema de filtros...");

    console.log("🔧 [FILTER-INIT] Criando sistemas de deleção...");
    window.ButtonDeleteUniversal = new ButtonDeleteUniversal();
    window.ButtonModeManager = new ButtonModeManager();
    window.UniversalDeleteModal = UniversalDeleteModal;

    console.log("✅ [FILTER-INIT] Sistemas de deleção preparados");

    console.log("🔧 [FILTER-INIT] Inicializando ButtonModeManager...");
    if (window.ButtonModeManager && window.ButtonModeManager.initialize) {
      await window.ButtonModeManager.initialize();
    }
    console.log("✅ [FILTER-INIT] ButtonModeManager inicializado");

    console.log("🔄 [FILTER-INIT] Configurando sistema de deleção universal...");
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