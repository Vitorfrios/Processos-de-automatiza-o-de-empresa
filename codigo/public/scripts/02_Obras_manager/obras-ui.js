/* ==== INÍCIO: obras-ui.js ==== */
/**
 * obras-ui.js - Interface do sistema de gerenciamento
 * VERSÃO SIMPLIFICADA: Usa inputs do HTML, sem criação dinâmica
 */

export class ObrasUI {
    constructor(manager) {
        this.manager = manager;
        this.container = document.getElementById('projects-container');
        this.toastContainer = null;
    }
    
    initialize() {
        console.log('🎨 Inicializando UI do gerenciador...');
        
        // 🔥 NÃO criar filtros dinamicamente - já existem no HTML
        // Apenas habilitar e configurar
        this.enableExistingFilters();
    }
    
    enableExistingFilters() {
        console.log('🔧 Habilitando filtros existentes...');
        
        // Os inputs já devem existir no HTML
        const empresaInput = document.getElementById('filter-empresa');
        const numeroInput = document.getElementById('filter-numero-cliente');
        const nomeInput = document.getElementById('filter-nome-obra');
        
        // Verificar se existem
        if (!empresaInput || !numeroInput || !nomeInput) {
            console.warn('⚠️ Inputs de filtro não encontrados no HTML');
            return;
        }
        
        // HABILITAR inputs
        [empresaInput, numeroInput, nomeInput].forEach(input => {
            if (input) {
                input.disabled = false;
                input.style.opacity = '1';
                input.style.pointerEvents = 'auto';
            }
        });
        
        console.log('✅ Filtros habilitados');
        
        // Configurar botões de ação (devem existir no HTML ou criar se necessário)
        this.setupFilterControls();
    }
    
    setupFilterControls() {
        console.log('🎧 Configurando controles de filtro...');
        
        // Verificar se botões já existem
        let applyBtn = document.getElementById('apply-filters');
        let clearBtn = document.getElementById('clear-filters');
        let reloadBtn = document.getElementById('reload-obras');
        
        // Criar botões se não existirem
        if (!applyBtn || !clearBtn || !reloadBtn) {
            console.log('🔨 Criando botões de ação...');
            this.createActionButtons();
            applyBtn = document.getElementById('apply-filters');
            clearBtn = document.getElementById('clear-filters');
            reloadBtn = document.getElementById('reload-obras');
        }
        
        // Configurar event listeners
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const empresa = document.getElementById('filter-empresa')?.value.trim() || null;
                const numeroCliente = document.getElementById('filter-numero-cliente')?.value.trim() || null;
                const nomeObra = document.getElementById('filter-nome-obra')?.value.trim() || null;
                
                console.log('🎯 Aplicando filtros:', { empresa, numeroCliente, nomeObra });
                this.manager.applyFilters({ empresa, numeroCliente, nomeObra });
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.log('🧹 Limpando filtros...');
                this.manager.clearFilters();
            });
        }
        
        if (reloadBtn) {
            reloadBtn.addEventListener('click', async () => {
                console.log('🔄 Recarregando obras...');
                await this.manager.reloadObras();
            });
        }
        
        // Debounce para inputs (300ms)
        ['filter-empresa', 'filter-numero-cliente', 'filter-nome-obra'].forEach(id => {
            const input = document.getElementById(id);
            if (input && applyBtn) {
                let timeout;
                input.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        applyBtn.click();
                    }, 300);
                });
            }
        });
    }
    
    createActionButtons() {
        // Encontrar container de filtros
        const filterContainer = document.querySelector('.filtro-inputs-area') || 
                                document.getElementById('filtros-inputs') ||
                                this.container;
        
        if (!filterContainer) {
            console.error('❌ Container de filtros não encontrado');
            return;
        }
        
        // Criar div para botões
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'filtro-actions';
        actionsDiv.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;';
        
        // Botões
        const buttons = [
            { id: 'apply-filters', text: '🔍 Aplicar Filtros', bgColor: '#4CAF50' },
            { id: 'clear-filters', text: '🧹 Limpar', bgColor: '#757575' },
            { id: 'reload-obras', text: '🔄 Recarregar', bgColor: '#2196F3' }
        ];
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.textContent = btn.text;
            button.style.cssText = `
                padding: 10px 20px;
                background: ${btn.bgColor};
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            `;
            actionsDiv.appendChild(button);
        });
        
        // Adicionar ao container
        filterContainer.appendChild(actionsDiv);
    }
    
    async renderObras(obras) {
        console.log(`🎨 Renderizando ${obras.length} obras...`);
        
        // Limpar container
        this.container.innerHTML = '';
        
        if (obras.length === 0) {
            this.container.innerHTML = `
                <div class="no-obras" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
                    <h3 style="color: #6c757d; margin-bottom: 10px;">Nenhuma obra encontrada</h3>
                    <p style="color: #adb5bd;">Tente ajustar os filtros ou criar novas obras.</p>
                </div>
            `;
            return;
        }
        
        // Usar função do sistema original se disponível
        if (typeof window.renderObras === 'function') {
            console.log('🔄 Usando renderObras do sistema original');
            window.renderObras(obras, this.container);
        } else {
            // Renderização básica
            this.renderObrasBasic(obras);
        }
    }
    
    renderObrasBasic(obras) {
        console.log('🎨 Renderizando obras (básico)...');
        
        obras.forEach((obra, index) => {
            const obraId = obra.id || `obra_${index}`;
            const obraName = obra.nome || obra.titulo || 'Obra sem nome';
            const empresa = obra.empresa || obra.empresaSigla || 'Sem empresa';
            
            const obraHTML = `
                <div class="obra-wrapper" 
                     data-obra-id="${obraId}"
                     style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px; overflow: hidden;">
                    
                    <div class="obra-header" 
                         style="background: #f5f5f5; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e0e0e0;">
                        
                        <div>
                            <h3 style="margin: 0 0 5px 0; color: #333; font-size: 18px;">
                                ${obraName}
                            </h3>
                            <div style="font-size: 14px; color: #666;">
                                <span style="margin-right: 15px;"><strong>Empresa:</strong> ${empresa}</span>
                                <span><strong>ID:</strong> ${obraId}</span>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.location.href='/obras/${obraId}'"
                                    style="padding: 8px 15px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                👁️ Ver
                            </button>
                            
                            <button onclick="deleteObra('${obraName}', '${obraId}')"
                                    style="padding: 8px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">
                                🗑️ Deletar
                            </button>
                        </div>
                    </div>
                    
                    <div class="obra-content" style="padding: 20px;">
                        <div class="projetos-container" id="projetos-${obraId}">
                            <p style="color: #999; font-style: italic;">Carregando projetos...</p>
                        </div>
                    </div>
                </div>
            `;
            
            this.container.insertAdjacentHTML('beforeend', obraHTML);
        });
    }
    
    showLoading() {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                <h3>Carregando obras...</h3>
                <p>Por favor, aguarde.</p>
            </div>
        `;
    }
    
    showError(message) {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #ffebee; border: 1px solid #ffcdd2; border-radius: 8px; color: #c62828; margin: 20px 0;">
                <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                <h3>Erro ao carregar obras</h3>
                <p>${message}</p>
                <button onclick="location.reload()" 
                        style="margin-top: 20px; padding: 10px 20px; background: #c62828; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Tentar novamente
                </button>
            </div>
        `;
    }
    
    showToast(message, type = 'info') {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'obras-toast-container';
            this.toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(this.toastContainer);
        }
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3',
            warning: '#FF9800'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 250px;
            transform: translateX(100%);
            opacity: 0;
            animation: toastSlideIn 0.3s forwards;
        `;
        
        toast.innerHTML = `
            <span style="font-size: 18px;">${icons[type] || 'ℹ️'}</span>
            <span style="font-size: 14px;">${message}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Animação
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
        
        // CSS para animações
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes toastSlideIn {
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}
/* ==== FIM: obras-ui.js ==== */