/* ==== INÍCIO: button-delete-universal.js ==== */

class ButtonDeleteUniversal {
    constructor() {
        this.BUTTON_CONFIGS = {
            'deleteMachine': {
                type: 'maquina',
                extractIds: (onclick) => {
                    const match = onclick.match(/deleteMachine\('([^']+)'\)/);
                    return match ? { machineId: match[1] } : null;
                },
                buildPath: (ids) => {
                    const parts = ids.machineId.split('_');
                    if (parts.length >= 5) {
                        const obraId = `obra_${parts[1]}`;
                        const projectId = `${obraId}_proj_${parts[3]}_${parts[4]}`;
                        const roomId = `${projectId}_sala_${parts[6]}_${parts[7]}`;
                        
                        const machineIndexMatch = ids.machineId.match(/maquina_(\d+)$/);
                        let machineIndex = 0;
                        
                        if (machineIndexMatch) {
                            machineIndex = parseInt(machineIndexMatch[1]);
                        } else {
                            for (let i = 0; i < parts.length; i++) {
                                if (parts[i] === 'maquina' && i + 1 < parts.length) {
                                    machineIndex = parseInt(parts[i + 1]) || 0;
                                    break;
                                }
                            }
                        }
                        
                        return ['obras', obraId, 'projetos', projectId, 'salas', roomId, 'maquinas', machineIndex];
                    }
                    return null;
                },
                confirmMessage: 'Tem certeza que deseja DELETAR esta MÁQUINA? Esta ação é permanente e não pode ser desfeita.',
                successMessage: 'Máquina deletada com sucesso',
                itemType: 'máquina'
            },
            'deleteRoom': {
                type: 'sala',
                extractIds: (onclick) => {
                    const match = onclick.match(/deleteRoom\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/);
                    return match ? { obraId: match[1], projectId: match[2], roomId: match[3] } : null;
                },
                buildPath: (ids) => ids ? ['obras', ids.obraId, 'projetos', ids.projectId, 'salas', ids.roomId] : null,
                confirmMessage: 'Tem certeza que deseja DELETAR esta SALA? Todas as máquinas serão perdidas. Esta ação é permanente!',
                successMessage: 'Sala deletada com sucesso',
                itemType: 'sala'
            },
            'deleteProject': {
                type: 'projeto',
                extractIds: (onclick) => {
                    const match = onclick.match(/deleteProject\('([^']+)',\s*'([^']+)'\)/);
                    return match ? { obraId: match[1], projectId: match[2] } : null;
                },
                buildPath: (ids) => ids ? ['obras', ids.obraId, 'projetos', ids.projectId] : null,
                confirmMessage: 'Tem certeza que deseja DELETAR este PROJETO? Todas as salas e máquinas serão perdidas. Esta ação é permanente!',
                successMessage: 'Projeto deletado com sucesso',
                itemType: 'projeto'
            },
            'deleteObra': {
                type: 'obra',
                extractIds: (onclick) => {
                    const match = onclick.match(/deleteObra\('([^']+)',\s*'([^']+)'\)/);
                    return match ? { obraName: match[1], obraId: match[2] } : null;
                },
                buildPath: (ids) => ids ? ['obras', ids.obraId] : null,
                confirmMessage: 'Tem certeza que deseja DELETAR esta OBRA? Todos os projetos, salas e máquinas serão perdidos. Esta ação é permanente!',
                successMessage: 'Obra deletada com sucesso',
                itemType: 'obra'
            }
        };
        
        this.pendingDeletion = null;
        this.undoTimeout = null;
        this.toastContainer = null;
        
        console.log('✅ ButtonDeleteUniversal configurado (versão COM NOMES)');
    }

    /**
     * 🔥 NOVO: Verifica se deve configurar botão (apenas com filtro ativo)
     */
    shouldSetupButton() {
        // Verificar se FilterSystem existe e está ativo
        if (window.FilterSystem && window.FilterSystem.isFilterActive) {
            return window.FilterSystem.isFilterActive();
        }
        
        // Fallback: verificar estado do toggle
        const filterToggle = document.getElementById('filter-toggle');
        if (filterToggle) {
            return filterToggle.checked;
        }
        
        return false; // Por padrão, não configurar
    }

    /**
     * 🔥 NOVO: Busca o nome do item no DOM baseado no tipo
     */
    getItemNameFromDOM(button, itemType, ids) {
        console.log(`🔍 Buscando nome para ${itemType}...`, ids);
        
        let titleElement = null;
        
        // Subir na hierarquia para encontrar container
        let container = button.closest('.item-container, .obra-container, .projeto-container, .sala-container, .maquina-container, .card, tr, li');
        
        if (!container) {
            // Tentar encontrar por ID se não encontrar por classe
            if (ids.obraId) {
                container = document.getElementById(ids.obraId) || 
                           document.querySelector(`[data-obra-id="${ids.obraId}"]`);
            }
            if (ids.projectId && !container) {
                container = document.getElementById(ids.projectId) || 
                           document.querySelector(`[data-project-id="${ids.projectId}"]`);
            }
            if (ids.roomId && !container) {
                container = document.getElementById(ids.roomId) || 
                           document.querySelector(`[data-room-id="${ids.roomId}"]`);
            }
            if (ids.machineId && !container) {
                container = document.getElementById(ids.machineId) || 
                           document.querySelector(`[data-machine-id="${ids.machineId}"]`);
            }
        }
        
        if (container) {
            console.log('📦 Container encontrado:', container);
            
            // Buscar título baseado no tipo
            switch(itemType) {
                case 'obra':
                    // Procurar título da obra
                    titleElement = container.querySelector('.obra-title, h2.obra-title, [data-obra-nome]');
                    if (!titleElement) {
                        // Se não encontrar classe específica, procurar h2
                        titleElement = container.querySelector('h2');
                    }
                    break;
                    
                case 'projeto':
                    // Procurar título do projeto
                    titleElement = container.querySelector('.project-title, .projeto-title, h3.project-title');
                    if (!titleElement) {
                        titleElement = container.querySelector('h3');
                    }
                    break;
                    
                case 'sala':
                    // Procurar título da sala
                    titleElement = container.querySelector('.room-title, .sala-title, h4.room-title');
                    if (!titleElement) {
                        titleElement = container.querySelector('h4');
                    }
                    break;
                    
                case 'maquina':
                    // Procurar título da máquina (pode ser input)
                    titleElement = container.querySelector('.machine-title-editable, input.machine-title-editable');
                    if (!titleElement) {
                        titleElement = container.querySelector('input[type="text"][value]');
                    }
                    break;
            }
            
            // Se encontrou elemento, extrair o texto
            if (titleElement) {
                let itemName = '';
                
                if (titleElement.tagName === 'INPUT' || titleElement.tagName === 'TEXTAREA') {
                    itemName = titleElement.value.trim();
                } else {
                    itemName = titleElement.textContent.trim();
                }
                
                if (itemName && itemName.length > 0) {
                    console.log(`✅ Nome encontrado para ${itemType}: "${itemName}"`);
                    return itemName;
                }
            } else {
                console.warn(`⚠️ Não encontrou elemento de título para ${itemType}`);
                
                // Fallback: buscar qualquer texto que pareça nome
                const allText = container.textContent || '';
                const lines = allText.split('\n').map(line => line.trim()).filter(line => 
                    line.length > 2 && 
                    !line.includes('Delete') && 
                    !line.includes('Editar') &&
                    !line.match(/^[a-z]+_[a-z0-9_]+$/i)
                );
                
                if (lines.length > 0) {
                    console.log(`✅ Nome encontrado (fallback): "${lines[0].substring(0, 50)}"`);
                    return lines[0].substring(0, 50); // Limitar tamanho
                }
            }
        } else {
            console.warn('⚠️ Container não encontrado para buscar nome');
        }
        
        // Último fallback: usar ID formatado
        console.warn('⚠️ Usando fallback com ID');
        if (itemType === 'obra' && ids.obraName) {
            return ids.obraName;
        }
        if (ids.machineId) {
            return `Máquina (${ids.machineId})`;
        }
        if (ids.roomId) {
            return `Sala (${ids.roomId})`;
        }
        if (ids.projectId) {
            return `Projeto (${ids.projectId})`;
        }
        
        return 'Item sem nome';
    }

    analyzeButton(button) {
        if (!button || !button.getAttribute) return null;
        
        const onclick = button.getAttribute('onclick') || '';
        const text = button.textContent?.trim() || '';
        
        for (const [funcName, config] of Object.entries(this.BUTTON_CONFIGS)) {
            if (onclick.includes(funcName)) {
                const ids = config.extractIds(onclick);
                if (ids) {
                    const path = config.buildPath(ids);
                    
                    // 🔥 AGORA: Buscar o nome correto no DOM
                    const itemName = this.getItemNameFromDOM(button, config.type, ids);
                    
                    return {
                        button,
                        funcName,
                        config,
                        ids,
                        path,
                        itemName,
                        originalText: text,
                        originalOnclick: onclick
                    };
                }
            }
        }
        
        return null;
    }

    setupButton(button) {
        // 🔥 VERIFICAR SE FILTRO ESTÁ ATIVO
        if (!this.shouldSetupButton()) {
            console.log('⏭️ Botão não configurado - filtro desativado');
            return;
        }
        
        const buttonInfo = this.analyzeButton(button);
        if (!buttonInfo) {
            console.log('⚠️ Botão não identificado:', button);
            return;
        }
        
        console.log(`🔧 Configurando botão ${buttonInfo.config.type}:`, buttonInfo.itemName);
        
        // Clonar botão para remover event listeners antigos
        const newButton = button.cloneNode(true);
        
        // Remover onclick original
        newButton.removeAttribute('onclick');
        
        // Guardar dados originais + nome
        newButton.setAttribute('data-original-onclick', buttonInfo.originalOnclick);
        newButton.setAttribute('data-original-text', buttonInfo.originalText);
        newButton.setAttribute('data-button-type', buttonInfo.config.type);
        newButton.setAttribute('data-item-id', JSON.stringify(buttonInfo.ids));
        newButton.setAttribute('data-item-name', buttonInfo.itemName);
        
        // Adicionar classe
        newButton.classList.add('delete-real');
        
        // Adicionar novo evento
        newButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            await this.showAdvancedConfirmation(buttonInfo);
        });
        
        // Substituir o botão antigo
        button.parentNode.replaceChild(newButton, button);
        
        console.log(`✅ Botão ${buttonInfo.config.type} configurado para "${buttonInfo.itemName}"`);
        return newButton;
    }

    /**
     * 🔥 CORRIGIDO: Mostra confirmação com NOME correto
     */
    async showAdvancedConfirmation(buttonInfo) {
        const { config, ids, itemName } = buttonInfo;
        
        console.log(`🔔 Mostrando confirmação para deletar ${config.itemType}: "${itemName}"`);
        
        // Verificar se o UniversalDeleteModal está disponível
        if (window.UniversalDeleteModal) {
            // Usar o UniversalDeleteModal se disponível
            const confirmed = await UniversalDeleteModal.confirmDelete(
                config.itemType,
                itemName,
                `Tipo: ${config.itemType}\nID: ${JSON.stringify(ids)}`
            );
            
            if (confirmed) {
                await this.executeRealDeletion(buttonInfo);
            }
        } else {
            // Fallback: usar modal próprio
            const modalHTML = `
                <div id="universal-delete-modal" class="universal-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="warning-icon">⚠️</div>
                            <h3>DELETAR ${config.itemType.toUpperCase()}</h3>
                            <p>Esta ação não pode ser desfeita</p>
                        </div>
                        
                        <div class="modal-body">
                            <div class="warning-message">
                                <strong>"${itemName}"</strong> será 
                                <span class="highlight-delete">DELETADO PERMANENTEMENTE</span> 
                                do sistema.
                            </div>
                            
                            <div class="item-details">
                                <strong>Tipo:</strong> ${config.itemType}<br>
                                <strong>Nome:</strong> ${itemName}<br>
                                <strong>Data:</strong> ${new Date().toLocaleString()}
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button class="btn-cancel">Cancelar (ESC)</button>
                            <button class="btn-confirm-delete">DELETAR Permanentemente</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal anterior se existir
            const existingModal = document.getElementById('universal-delete-modal');
            if (existingModal) existingModal.remove();
            
            // Adicionar novo modal ao DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Animar entrada
            setTimeout(() => {
                const modal = document.getElementById('universal-delete-modal');
                const content = modal.querySelector('.modal-content');
                modal.style.opacity = '1';
                content.style.transform = 'translateY(0)';
            }, 10);
            
            // Retornar Promise
            return new Promise((resolve) => {
                const modal = document.getElementById('universal-delete-modal');
                const btnCancel = modal.querySelector('.btn-cancel');
                const btnConfirm = modal.querySelector('.btn-confirm-delete');
                
                const closeModal = (confirmed) => {
                    modal.style.opacity = '0';
                    const content = modal.querySelector('.modal-content');
                    content.style.transform = 'translateY(-20px)';
                    
                    setTimeout(() => {
                        modal.remove();
                        resolve(confirmed);
                    }, 37);
                };
                
                btnCancel.addEventListener('click', () => {
                    console.log('❌ Deleção cancelada pelo usuário');
                    closeModal(false);
                });
                
                btnConfirm.addEventListener('click', async () => {
                    console.log('✅ Usuário confirmou deleção permanente');
                    closeModal(true);
                    
                    // Executar deleção real
                    await this.executeRealDeletion(buttonInfo);
                });
                
                // Fechar ao clicar fora
                modal.addEventListener('click', (e) => {
                    if (e.target.id === 'universal-delete-modal') {
                        closeModal(false);
                    }
                });
                
                // Fechar com ESC
                const escHandler = (e) => {
                    if (e.key === 'Escape') closeModal(false);
                };
                document.addEventListener('keydown', escHandler);
            });
        }
    }

    async executeRealDeletion(buttonInfo) {
        const { config, ids, path, button, itemName } = buttonInfo;
        
        console.log(`🗑️ Executando deleção REAL para ${config.itemType}: "${itemName}"`, path);
        
        try {
            this.showToast(`${config.itemType} "${itemName}" sendo deletado...`, 'processing');
            
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    path: path,
                    itemType: config.type,
                    itemId: JSON.stringify(ids),
                    itemName: itemName
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ [DELETE-REAL] Sucesso: ${result.message}`);
                
                this.removeElementFromDOM(buttonInfo);
                this.showToast(`${config.itemType} "${itemName}" deletado permanentemente`, 'success');
                
                if (config.type === 'obra') {
                    setTimeout(() => {
                        if (window.FilterSystem) {
                            window.FilterSystem.reloadObras();
                        } else {
                            window.location.reload();
                        }
                    }, 187);
                }
                
                return true;
            } else {
                console.error('❌ [DELETE-REAL] Erro:', result.error);
                this.showToast(`Erro ao deletar ${config.itemType}: ${result.error}`, 'error');
                return false;
            }

        } catch (error) {
            console.error('❌ [DELETE-REAL] Exceção:', error);
            this.showToast('Erro ao conectar com o servidor', 'error');
            return false;
        }
    }

    removeElementFromDOM(buttonInfo) {
        const { config, ids, button, itemName } = buttonInfo;
        
        let elementToRemove = null;
        
        switch(config.type) {
            case 'obra':
                const obraId = ids.obraId;
                elementToRemove = document.querySelector(`[data-obra-id="${obraId}"]`) || 
                                  document.querySelector(`#${obraId}`);
                break;
                
            case 'projeto':
                const projectId = ids.projectId;
                elementToRemove = document.getElementById(projectId) || 
                                  document.querySelector(`[data-project-id="${projectId}"]`);
                break;
                
            case 'sala':
                const roomId = ids.roomId;
                elementToRemove = document.getElementById(roomId) || 
                                  document.querySelector(`[data-room-id="${roomId}"]`);
                break;
                
            case 'maquina':
                const machineId = ids.machineId;
                elementToRemove = document.getElementById(machineId) || 
                                  document.querySelector(`[data-machine-id="${machineId}"]`);
                break;
        }
        
        if (elementToRemove) {
            elementToRemove.style.transition = 'all 0.5s ease';
            elementToRemove.style.opacity = '0';
            elementToRemove.style.transform = 'translateX(-100%)';
            elementToRemove.style.maxHeight = '0';
            elementToRemove.style.overflow = 'hidden';
            
            setTimeout(() => {
                if (elementToRemove.parentNode) {
                    elementToRemove.remove();
                    console.log(`✅ Elemento "${itemName}" removido do DOM`);
                }
            }, 62);
        } else {
            console.warn(`⚠️ Não encontrou elemento para remover: ${config.type}`, ids);
            setTimeout(() => window.location.reload(), 125);
        }
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'universal-toast-container';
            this.toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(this.toastContainer);
        }
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3',
            processing: '#9C27B0'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            processing: '⏳'
        };
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            max-width: 400px;
            transform: translateX(100%);
            opacity: 0;
            animation: slideIn 0.3s forwards;
        `;
        
        toast.innerHTML = `
            <span style="font-size: 20px;">${icons[type] || 'ℹ️'}</span>
            <span>${message}</span>
        `;
        
        if (!document.querySelector('#toast-animation')) {
            const style = document.createElement('style');
            style.id = 'toast-animation';
            style.textContent = `
                @keyframes slideIn {
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 37);
        }, type === 'processing' ? 3000 : 5000);
    }

    setupAllDeleteButtons() {
        // Verificar se filtro está ativo
        if (!this.shouldSetupButton()) {
            console.log('⏭️ [DELETE-REAL] Filtro não está ativo - ignorando configuração de botões');
            return 0;
        }
        
        console.log('🔧 [DELETE-REAL] Buscando botões específicos (filtro ATIVO)...');
        
        const allButtons = document.querySelectorAll('button');
        let configuredButtons = 0;
        
        allButtons.forEach(button => {
            const onclick = button.getAttribute('onclick') || '';
            if (onclick.includes('delete')) {
                const setup = this.setupButton(button);
                if (setup) configuredButtons++;
            }
        });
        
        console.log(`🎯 [DELETE-REAL] ${configuredButtons} botões configurados para deleção REAL`);
        return configuredButtons;
    }

    /**
     * 🔥 NOVO: Restaura botões para estado original
     */
    restoreOriginalButtons() {
        console.log('🔄 [DELETE-REAL] Restaurando botões originais...');
        
        const universalButtons = document.querySelectorAll('.delete-real');
        let restoredCount = 0;
        
        universalButtons.forEach(button => {
            const originalOnclick = button.getAttribute('data-original-onclick');
            const originalText = button.getAttribute('data-original-text');
            
            if (originalOnclick) {
                button.setAttribute('onclick', originalOnclick);
            }
            
            if (originalText) {
                button.textContent = originalText;
            }
            
            // Remover atributos e classes
            button.classList.remove('delete-real');
            button.removeAttribute('data-original-onclick');
            button.removeAttribute('data-original-text');
            button.removeAttribute('data-button-type');
            button.removeAttribute('data-item-id');
            button.removeAttribute('data-item-name');
            
            // Remover event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            restoredCount++;
        });
        
        console.log(`✅ [DELETE-REAL] ${restoredCount} botões restaurados para estado original`);
        return restoredCount;
    }
}

export { ButtonDeleteUniversal };

if (typeof window !== 'undefined') {
    window.ButtonDeleteUniversal = ButtonDeleteUniversal;
}
/* ==== FIM: button-delete-universal.js ==== */