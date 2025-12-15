/* ==== INÍCIO: features/filters/button-delete-universal.js ==== */

// Para adicionar um novo tipo de botão, basta adicionar no BUTTON_CONFIGS e seguir o template abaixo:
/*
'deleteNovoTipo': {
    type: 'novotipo',
    extractIds: (onclick) => {
        // Sua regex para extrair IDs do onclick
        const match = onclick.match(/deleteNovoTipo\('([^']+)',\s*'([^']+)'\)/);
        return match ? { id1: match[1], id2: match[2] } : null;
    },
    buildPath: (ids) => {
        // Construir path array para API
        return ids ? ['obras', ids.id1, 'novosegmento', ids.id2] : null;
    },
    confirmMessage: 'Mensagem de confirmação personalizada',
    successMessage: 'Item deletado com sucesso'
}*/


/**
 * ButtonDeleteUniversal - Sistema universal de deleção para QUALQUER item
 * Versão completa: inclui confirmação, modal, undo e deleção REAL do servidor
 */

class ButtonDeleteUniversal {
    constructor() {
        // 🔥 CONFIGURAÇÃO SIMPLES - baseada nos SEUS botões
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
        
        // Estado para controle de deleção com undo
        this.pendingDeletion = null;
        this.undoTimeout = null;
        this.toastContainer = null;
        
        console.log('✅ ButtonDeleteUniversal configurado (versão COMPLETA com deleção real)');
    }

    /**
     * Analisa um botão e retorna sua configuração
     */
    analyzeButton(button) {
        if (!button || !button.getAttribute) return null;
        
        const onclick = button.getAttribute('onclick') || '';
        const text = button.textContent?.trim() || '';
        
        for (const [funcName, config] of Object.entries(this.BUTTON_CONFIGS)) {
            if (onclick.includes(funcName)) {
                const ids = config.extractIds(onclick);
                if (ids) {
                    const path = config.buildPath(ids);
                    return {
                        button,
                        funcName,
                        config,
                        ids,
                        path,
                        originalText: text,
                        originalOnclick: onclick
                    };
                }
            }
        }
        
        return null;
    }

    /**
     * Configura UM botão específico
     */
    setupButton(button) {
        const buttonInfo = this.analyzeButton(button);
        if (!buttonInfo) {
            console.log('⚠️ Botão não identificado:', button);
            return;
        }
        
        console.log(`🔧 Configurando botão ${buttonInfo.config.type}:`, buttonInfo.ids);
        
        // Clonar botão para remover event listeners antigos
        const newButton = button.cloneNode(true);
        
        // 🔥 REMOVER onclick original completamente
        newButton.removeAttribute('onclick');
        
        // Guardar dados originais
        newButton.setAttribute('data-original-onclick', buttonInfo.originalOnclick);
        newButton.setAttribute('data-original-text', buttonInfo.originalText);
        newButton.setAttribute('data-button-type', buttonInfo.config.type);
        newButton.setAttribute('data-item-id', JSON.stringify(buttonInfo.ids));
        
        // 🔥 NOVO: Adicionar classe para indicar que é deletar (não apenas remover)
        newButton.classList.add('delete-real');
        
        // Adicionar novo evento - agora com confirmação avançada
        newButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            await this.showAdvancedConfirmation(buttonInfo);
        });
        
        // Substituir o botão antigo
        button.parentNode.replaceChild(newButton, button);
        
        console.log(`✅ Botão ${buttonInfo.config.type} configurado para deleção REAL`);
        return newButton;
    }

    /**
     * 🔥 NOVO: Mostra confirmação avançada (substitui modal antigo)
     */
    async showAdvancedConfirmation(buttonInfo) {
        const { config, ids, path } = buttonInfo;
        const itemName = ids.obraName || ids.machineId || ids.roomId || ids.projectId || 'Item';
        
        console.log(`🔔 Mostrando confirmação para deletar ${config.itemType}:`, itemName);
        
        // Criar modal de confirmação dinâmico
        const modalHTML = `
            <div id="universal-delete-modal" class="universal-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    transform: translateY(-20px);
                    transition: transform 0.3s;
                ">
                    <h3 style="margin-top: 0; color: #d32f2f;">
                        ⚠️ DELETAR ${config.itemType.toUpperCase()}
                    </h3>
                    
                    <div style="margin: 20px 0; padding: 15px; background: #fff8e1; border-radius: 8px; border-left: 4px solid #ff9800;">
                        <strong style="color: #d32f2f;">"${itemName}"</strong> será <span style="color: #d32f2f; font-weight: bold; text-decoration: underline;">DELETADO PERMANENTEMENTE</span>.
                        <br><br>
                        <div style="display: flex; align-items: flex-start; gap: 10px;">
                            <span style="color: #ff6b6b; font-size: 24px;">⚠️</span>
                            <small style="color: #666;">
                                Esta ação <strong>NÃO PODE</strong> ser desfeita. O item será removido do servidor e do backup.
                            </small>
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; font-size: 14px; color: #777;">
                        Tipo: ${config.itemType}<br>
                        ID: ${JSON.stringify(ids)}
                    </div>
                    
                    <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: flex-end;">
                        <button class="btn-cancel" style="
                            padding: 10px 25px;
                            background: #f5f5f5;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Cancelar</button>
                        <button class="btn-confirm-delete" style="
                            padding: 10px 25px;
                            background: #d32f2f;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: bold;
                        ">DELETAR Permanentemente</button>
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
        
        // Retornar Promise para aguardar decisão do usuário
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
                }, 300);
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
            
            // Remover listener quando modal fechar
            modal.addEventListener('modalClosed', () => {
                document.removeEventListener('keydown', escHandler);
            });
        });
    }

    /**
     * 🔥 EXECUTA deleção REAL (remove do servidor)
     */
    async executeRealDeletion(buttonInfo) {
        const { config, ids, path, button } = buttonInfo;
        const itemName = ids.obraName || ids.machineId || ids.roomId || ids.projectId || 'Item';
        
        console.log(`🗑️ Executando deleção REAL para ${config.itemType}:`, itemName, path);
        
        try {
            // 1. Mostrar toast de processamento
            this.showToast(`${config.itemType} "${itemName}" sendo deletado...`, 'processing');
            
            // 2. Chamar API para deletar REALMENTE
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    path: path,
                    itemType: config.type,
                    itemId: JSON.stringify(ids)
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ [DELETE-REAL] Sucesso: ${result.message}`);
                
                // 3. Remover elemento do DOM
                this.removeElementFromDOM(buttonInfo);
                
                // 4. Mostrar toast de sucesso
                this.showToast(`${config.itemType} "${itemName}" deletado permanentemente`, 'success');
                
                // 5. Se for obra, recarregar a lista
                if (config.type === 'obra') {
                    setTimeout(() => {
                        if (window.FilterSystem) {
                            window.FilterSystem.reloadObras();
                        } else {
                            window.location.reload();
                        }
                    }, 1500);
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

    /**
     * Remove elemento do DOM após deleção bem-sucedida
     */
    removeElementFromDOM(buttonInfo) {
        const { config, ids, button } = buttonInfo;
        
        // Encontrar o elemento pai apropriado para remover
        let elementToRemove = null;
        
        switch(config.type) {
            case 'obra':
                // Encontrar wrapper da obra
                const obraId = ids.obraId;
                elementToRemove = document.querySelector(`[data-obra-id="${obraId}"]`) || 
                                  document.querySelector(`#${obraId}`);
                break;
                
            case 'projeto':
                // Encontrar projeto dentro da obra
                const projectId = ids.projectId;
                elementToRemove = document.getElementById(projectId) || 
                                  document.querySelector(`[data-project-id="${projectId}"]`);
                break;
                
            case 'sala':
                // Encontrar sala dentro do projeto
                const roomId = ids.roomId;
                elementToRemove = document.getElementById(roomId) || 
                                  document.querySelector(`[data-room-id="${roomId}"]`);
                break;
                
            case 'maquina':
                // Encontrar máquina dentro da sala
                const machineId = ids.machineId;
                elementToRemove = document.getElementById(machineId) || 
                                  document.querySelector(`[data-machine-id="${machineId}"]`);
                break;
        }
        
        if (elementToRemove) {
            // Efeito visual de remoção
            elementToRemove.style.transition = 'all 0.5s ease';
            elementToRemove.style.opacity = '0';
            elementToRemove.style.transform = 'translateX(-100%)';
            elementToRemove.style.maxHeight = '0';
            elementToRemove.style.overflow = 'hidden';
            
            setTimeout(() => {
                if (elementToRemove.parentNode) {
                    elementToRemove.remove();
                    console.log(`✅ Elemento ${config.type} removido do DOM`);
                }
            }, 500);
        } else {
            console.warn(`⚠️ Não encontrou elemento para remover: ${config.type}`, ids);
            // Fallback: recarregar página
            setTimeout(() => window.location.reload(), 1000);
        }
    }

    /**
     * Sistema de toast simplificado
     */
    showToast(message, type = 'info') {
        // Criar container se não existir
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
        
        // Adicionar CSS para animação
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
        
        // Remover após alguns segundos
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, type === 'processing' ? 3000 : 5000);
    }

    /**
     * Configura TODOS os botões de deleção na página
     */
    setupAllDeleteButtons() {
        console.log('🔧 [DELETE-REAL] Buscando botões específicos...');
        
        // 🔥 BUSCAR TODOS OS BOTÕES COM onclick delete*
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
}

// 🔥 EXPORTAR COMO CLASSE
export { ButtonDeleteUniversal };

// 🔥 TAMBÉM EXPORTAR PARA WINDOW (para compatibilidade)
if (typeof window !== 'undefined') {
    window.ButtonDeleteUniversal = ButtonDeleteUniversal;
}
/* ==== FIM: features/filters/button-delete-universal.js ==== */