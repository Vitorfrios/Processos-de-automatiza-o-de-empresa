/* ==== INÍCIO: obras-delete.js ==== */
/**
 * obras-delete.js - Sistema de deleção permanente
 * SEMPRE ativo na página de gerenciamento
 */

export class ObrasDelete {
    constructor(manager) {
        this.manager = manager;
        this.modal = null;
    }
    
    initialize() {
        console.log('🗑️ Inicializando sistema de deleção...');
        this.createModal();
        this.overrideDeleteFunctions();
    }
    
    createModal() {
        if (document.getElementById('obras-delete-modal')) return;
        
        const modalHTML = `
            <div id="obras-delete-modal" class="obras-delete-modal" style="display:none;">
                <div class="modal-content" style="background:white;padding:30px;border-radius:8px;max-width:500px;">
                    <div class="modal-header" style="text-align:center;margin-bottom:20px;">
                        <div style="font-size:40px;">⚠️</div>
                        <h2 style="color:#d32f2f;margin:10px 0 5px 0;">DELETAR PERMANENTEMENTE</h2>
                        <p style="color:#666;">Esta ação não pode ser desfeita</p>
                    </div>
                    
                    <div id="obras-delete-message" style="text-align:center;margin:20px 0;"></div>
                    
                    <div class="modal-details" style="background:#f9f9f9;padding:15px;border-radius:5px;margin:20px 0;">
                        <div id="obras-delete-details"></div>
                    </div>
                    
                    <div class="modal-actions" style="display:flex;gap:15px;margin-top:30px;">
                        <button id="obras-delete-cancel" style="flex:1;padding:12px;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer;">
                            Cancelar (ESC)
                        </button>
                        <button id="obras-delete-confirm" style="flex:1;padding:12px;background:#d32f2f;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">
                            DELETAR AGORA
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('obras-delete-modal');
        
        // Estilos
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        // Event listeners
        document.getElementById('obras-delete-cancel').addEventListener('click', () => this.hide());
        document.getElementById('obras-delete-confirm').addEventListener('click', async () => {
            if (this.confirmCallback) {
                await this.confirmCallback();
            }
            this.hide();
        });
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.hide();
            }
        });
        
        // Fechar ao clicar fora
        this.modal.addEventListener('click', (e) => {
            if (e.target.id === 'obras-delete-modal') {
                this.hide();
            }
        });
    }
    
    async confirmDelete(itemType, itemName, details = '') {
        return new Promise((resolve) => {
            this.confirmCallback = async () => {
                resolve(true);
            };
            
            // Configurar modal
            document.getElementById('obras-delete-message').innerHTML = `
                <div style="font-size:18px;">
                    <strong>"${itemName}"</strong> será 
                    <span style="color:#d32f2f;font-weight:bold;">DELETADO PERMANENTEMENTE</span>
                </div>
                <p style="margin-top:10px;color:#666;font-size:14px;">
                    Esta ação não pode ser desfeita.
                </p>
            `;
            
            document.getElementById('obras-delete-details').innerHTML = `
                <div style="display:grid;grid-template-columns:auto 1fr;gap:8px;font-size:14px;">
                    <strong>Tipo:</strong> <span>${itemType}</span>
                    <strong>Nome:</strong> <span>${itemName}</span>
                    <strong>Data:</strong> <span>${new Date().toLocaleString()}</span>
                    ${details ? `<strong>Detalhes:</strong> <span>${details}</span>` : ''}
                </div>
            `;
            
            this.show();
            
            // Rejeitar se usuário fechar modal
            const rejectHandler = () => {
                this.modal.removeEventListener('click', rejectHandler);
                resolve(false);
            };
            
            document.getElementById('obras-delete-cancel').addEventListener('click', rejectHandler, { once: true });
        });
    }
    
    show() {
        this.modal.style.display = 'flex';
        setTimeout(() => {
            this.modal.style.opacity = '1';
        }, 10);
        document.body.style.overflow = 'hidden';
    }
    
    hide() {
        this.modal.style.opacity = '0';
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }
    
    overrideDeleteFunctions() {
        console.log('🔄 Sobrescrevendo funções de deleção...');
        
        // Guardar funções originais
        this.originalFunctions = {
            deleteObra: window.deleteObra,
            deleteProject: window.deleteProject,
            deleteRoom: window.deleteRoom,
            deleteMachine: window.deleteMachine
        };
        
        // 🔥 FUNÇÃO DELEÇÃO OBRA (sempre deleta permanentemente aqui)
        window.deleteObra = async (obraName, obraId) => {
            console.log(`🗑️ [GERENCIAMENTO] Deletar obra: ${obraName} (${obraId})`);
            
            const confirmed = await this.confirmDelete('Obra', obraName);
            if (!confirmed) return false;
            
            try {
                const response = await fetch('/api/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: ['obras', obraId],
                        itemType: 'obra',
                        itemName: obraName
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        // Notificar manager para atualizar lista
                        if (this.manager.deleteObra) {
                            await this.manager.deleteObra(obraId, obraName);
                        }
                        return true;
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao deletar obra:', error);
            }
            
            return false;
        };
        
        // 🔥 FUNÇÃO DELEÇÃO PROJETO
        window.deleteProject = async (obraId, projectId) => {
            const projectName = `Projeto ${projectId}`;
            
            const confirmed = await this.confirmDelete('Projeto', projectName);
            if (!confirmed) return false;
            
            try {
                const response = await fetch('/api/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: ['obras', obraId, 'projetos', projectId],
                        itemType: 'projeto',
                        itemName: projectName
                    })
                });
                
                if (response.ok) {
                    // Recarregar obras
                    if (this.manager.reloadObras) {
                        await this.manager.reloadObras();
                    }
                    return true;
                }
            } catch (error) {
                console.error('❌ Erro ao deletar projeto:', error);
            }
            
            return false;
        };
        
        // 🔥 FUNÇÃO DELEÇÃO SALA
        window.deleteRoom = async (obraId, projectId, roomId) => {
            const roomName = `Sala ${roomId}`;
            
            const confirmed = await this.confirmDelete('Sala', roomName);
            if (!confirmed) return false;
            
            try {
                const response = await fetch('/api/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: ['obras', obraId, 'projetos', projectId, 'salas', roomId],
                        itemType: 'sala',
                        itemName: roomName
                    })
                });
                
                if (response.ok) {
                    // Recarregar obras
                    if (this.manager.reloadObras) {
                        await this.manager.reloadObras();
                    }
                    return true;
                }
            } catch (error) {
                console.error('❌ Erro ao deletar sala:', error);
            }
            
            return false;
        };
        
        // 🔥 FUNÇÃO DELEÇÃO MÁQUINA
        window.deleteMachine = async (machineId) => {
            const machineName = `Máquina ${machineId}`;
            
            const confirmed = await this.confirmDelete('Máquina', machineName);
            if (!confirmed) return false;
            
            try {
                // Extrair path da machineId
                const parts = machineId.split('_');
                if (parts.length >= 5) {
                    const obraId = `obra_${parts[1]}`;
                    const projectId = `${obraId}_proj_${parts[3]}_${parts[4]}`;
                    const roomId = `${projectId}_sala_${parts[6]}_${parts[7]}`;
                    
                    // Encontrar índice da máquina
                    let machineIndex = 0;
                    for (let i = 0; i < parts.length; i++) {
                        if (parts[i] === 'maquina' && i + 1 < parts.length) {
                            machineIndex = parseInt(parts[i + 1]) || 0;
                            break;
                        }
                    }
                    
                    const response = await fetch('/api/delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            path: ['obras', obraId, 'projetos', projectId, 'salas', roomId, 'maquinas', machineIndex],
                            itemType: 'maquina',
                            itemName: machineName
                        })
                    });
                    
                    if (response.ok) {
                        // Recarregar obras
                        if (this.manager.reloadObras) {
                            await this.manager.reloadObras();
                        }
                        return true;
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao deletar máquina:', error);
            }
            
            return false;
        };
        
        console.log('✅ Funções de deleção sobrescritas para modo permanente');
    }
    
    // Método para deletar via API (usado pelo manager)
    async deleteObra(obraId) {
        try {
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: ['obras', obraId],
                    itemType: 'obra'
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('❌ Erro na deleção:', error);
            return false;
        }
    }
}
/* ==== FIM: obras-delete.js ==== */