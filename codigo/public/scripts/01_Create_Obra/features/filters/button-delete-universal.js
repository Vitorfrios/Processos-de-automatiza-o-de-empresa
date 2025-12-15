/* ==== INÍCIO: features/filters/button-delete-universal.js ==== */
/**
 * ButtonDeleteUniversal - Sistema universal de deleção para qualquer item
 * Versão em Classe ES6 para compatibilidade com import/export
 * Funciona para: Obras, Projetos, Salas, Máquinas
 */

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
 * ButtonDeleteUniversal - Sistema universal de deleção para QUALQUER botão com onclick delete*
 * Versão SIMPLES e DIRETA para seus botões específicos
 */
class ButtonDeleteUniversal {
    constructor() {
        // 🔥 CONFIGURAÇÃO SIMPLES - baseada nos SEUS botões
        this.BUTTON_CONFIGS = {
            // Configurações por FUNÇÃO no onclick
            'deleteMachine': {
                type: 'maquina',
                extractIds: (onclick) => {
                    // onclick="deleteMachine('machine_id')"
                    const match = onclick.match(/deleteMachine\('([^']+)'\)/);
                    return match ? { machineId: match[1] } : null;
                },
                buildPath: (ids) => {
                    // Extrair obra, projeto, sala e índice da máquina do machineId
                    const parts = ids.machineId.split('_');
                    if (parts.length >= 5) {
                        const obraId = `obra_${parts[1]}`;
                        const projectId = `${obraId}_proj_${parts[3]}_${parts[4]}`;
                        const roomId = `${projectId}_sala_${parts[6]}_${parts[7]}`;
                        
                        // 🔥 CORREÇÃO: Extrair índice correto da máquina
                        // Procura por maquina_ seguido de números no final do ID
                        const machineIndexMatch = ids.machineId.match(/maquina_(\d+)$/);
                        let machineIndex = 0;
                        
                        if (machineIndexMatch) {
                            machineIndex = parseInt(machineIndexMatch[1]);
                        } else {
                            // Fallback: tentar extrair da estrutura
                            for (let i = 0; i < parts.length; i++) {
                                if (parts[i] === 'maquina' && i + 1 < parts.length) {
                                    machineIndex = parseInt(parts[i + 1]) || 0;
                                    break;
                                }
                            }
                        }
                        
                        console.log(`🔧 [DELETE] Path para máquina:`, {
                            obraId,
                            projectId,
                            roomId,
                            machineIndex,
                            originalId: ids.machineId
                        });
                        
                        return ['obras', obraId, 'projetos', projectId, 'salas', roomId, 'maquinas', machineIndex];
                    }
                    return null;
                },
                confirmMessage: 'Tem certeza que deseja deletar esta MÁQUINA?',
                successMessage: 'Máquina deletada com sucesso'
            },
            'deleteRoom': {
                type: 'sala',
                extractIds: (onclick) => {
                    // onclick="deleteRoom('obra_id', 'project_id', 'room_id')"
                    const match = onclick.match(/deleteRoom\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/);
                    return match ? { obraId: match[1], projectId: match[2], roomId: match[3] } : null;
                },
                buildPath: (ids) => ids ? ['obras', ids.obraId, 'projetos', ids.projectId, 'salas', ids.roomId] : null,
                confirmMessage: 'Tem certeza que deseja deletar esta SALA? Todas as máquinas serão perdidas.',
                successMessage: 'Sala deletada com sucesso'
            },
            'deleteProject': {
                type: 'projeto',
                extractIds: (onclick) => {
                    // onclick="deleteProject('obra_id', 'project_id')"
                    const match = onclick.match(/deleteProject\('([^']+)',\s*'([^']+)'\)/);
                    return match ? { obraId: match[1], projectId: match[2] } : null;
                },
                buildPath: (ids) => ids ? ['obras', ids.obraId, 'projetos', ids.projectId] : null,
                confirmMessage: 'Tem certeza que deseja deletar este PROJETO? Todas as salas e máquinas serão perdidas.',
                successMessage: 'Projeto deletado com sucesso'
            },
            'deleteObra': {
                type: 'obra',
                extractIds: (onclick) => {
                    // onclick="window.deleteObra('Obra1', 'obra_id')"
                    const match = onclick.match(/deleteObra\('([^']+)',\s*'([^']+)'\)/);
                    return match ? { obraName: match[1], obraId: match[2] } : null;
                },
                buildPath: (ids) => ids ? ['obras', ids.obraId] : null,
                confirmMessage: 'Tem certeza que deseja deletar esta OBRA? Todos os projetos, salas e máquinas serão perdidos.',
                successMessage: 'Obra deletada com sucesso'
            }
        };
        
        console.log('✅ ButtonDeleteUniversal configurado para SEUS botões específicos');
    }

    /**
     * Analisa um botão e retorna sua configuração
     */
    analyzeButton(button) {
        if (!button || !button.getAttribute) return null;
        
        const onclick = button.getAttribute('onclick') || '';
        const text = button.textContent?.trim() || '';
        
        // Verificar cada configuração
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
        
        // 🔥 MANTER AS CLASSES ORIGINAIS (IMPORTANTE!)
        // Não alteramos as classes - mantemos btn btn-delete, btn btn-delete-small
        
        // 🔥 ALTERAR APENAS o onclick e texto quando filtro ativo
        newButton.setAttribute('data-original-onclick', buttonInfo.originalOnclick);
        newButton.setAttribute('data-original-text', buttonInfo.originalText);
        newButton.setAttribute('data-button-type', buttonInfo.config.type);
        
        // Adicionar novo evento
        newButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            await this.deleteEntityUniversal(buttonInfo.path, {
                confirmMessage: buttonInfo.config.confirmMessage,
                successMessage: buttonInfo.config.successMessage
            });
        });
        
        // Substituir o botão antigo
        button.parentNode.replaceChild(newButton, button);
        
        console.log(`✅ Botão ${buttonInfo.config.type} configurado`);
        return newButton;
    }

    /**
     * Configura TODOS os botões de deleção na página
     */
    setupAllDeleteButtons() {
        console.log('🔧 [DELETE-UNIVERSAL] Buscando botões específicos...');
        
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
        
        console.log(`🎯 [DELETE-UNIVERSAL] ${configuredButtons} botões configurados`);
        return configuredButtons;
    }

    /**
     * Deleta uma entidade usando a API universal (MESMA FUNÇÃO)
     */
    async deleteEntityUniversal(pathArray, options = {}) {
        try {
            if (!pathArray) {
                console.error('❌ Path inválido');
                return false;
            }

            console.log('🗑️ [DELETE-UNIVERSAL] Iniciando deleção:', pathArray);

            const {
                confirmMessage = 'Tem certeza que deseja deletar este item?',
                successMessage = 'Item deletado com sucesso'
            } = options;

            if (!confirm(confirmMessage)) {
                console.log('❌ Deleção cancelada pelo usuário');
                return false;
            }

            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: pathArray })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ [DELETE-UNIVERSAL] Sucesso: ${result.message}`);
                alert(successMessage);
                
                // Recarregar após deleção
                this.handlePostDeletion(pathArray);
                return true;
            } else {
                console.error('❌ [DELETE-UNIVERSAL] Erro:', result.error);
                alert(`Erro ao deletar: ${result.error}`);
                return false;
            }

        } catch (error) {
            console.error('❌ [DELETE-UNIVERSAL] Exceção:', error);
            alert('Erro ao conectar com o servidor.');
            return false;
        }
    }

    /**
     * Lida com recarregamento após deleção
     */
    handlePostDeletion(pathArray) {
        console.log('🔄 [DELETE-UNIVERSAL] Processando pós-deleção...');
        
        if (pathArray.length === 2 && pathArray[0] === 'obras') {
            this.reloadObrasAfterDeletion();
        } else {
            // Para projetos, salas, máquinas - recarregar a obra
            const obraId = pathArray[1];
            if (obraId) {
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        }
    }

    /**
     * Recarrega todas as obras após deleção
     */
    reloadObrasAfterDeletion() {
        console.log('🔄 [DELETE-UNIVERSAL] Recarregando obras...');
        
        if (window.FilterSystem) {
            const state = window.FilterSystem.getState();
            if (state && state.active) {
                if (typeof window.FilterSystem.reloadObrasWithCurrentEndpoint === 'function') {
                    window.FilterSystem.reloadObrasWithCurrentEndpoint();
                    return;
                }
            }
        }
        
        // Fallback: recarregar página
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// 🔥 EXPORTAR COMO CLASSE
export { ButtonDeleteUniversal };

// 🔥 TAMBÉM EXPORTAR PARA WINDOW (para compatibilidade)
if (typeof window !== 'undefined') {
    window.ButtonDeleteUniversal = ButtonDeleteUniversal;
}
/* ==== FIM: features/filters/button-delete-universal.js ==== */