/* ==== INÍCIO: obras-ui.js ==== */
/**
 * obras-ui.js - Interface do sistema de gerenciamento
 * REUTILIZA as mesmas funções do sistema de filtro da página 1
 */

export class ObrasUI {
    constructor(manager) {
        this.manager = manager;
        this.container = document.getElementById('projects-container');
        this.toastContainer = null;
    }
    
    initialize() {
        console.log('🎨 Inicializando UI do gerenciador...');
        
        // HABILITAR inputs que já existem no HTML
        this.enableExistingFilters();
        
        // Configurar botões de ação
        this.setupFilterControls();
    }
    
    enableExistingFilters() {
        console.log('🔧 Habilitando filtros existentes...');
        
        // HABILITAR inputs que já estão no HTML
        const inputs = [
            'filter-empresa',
            'filter-numero-cliente', 
            'filter-nome-obra'
        ];
        
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.disabled = false;
                input.style.opacity = '1';
                input.style.pointerEvents = 'auto';
                console.log(`✅ Input ${id} habilitado`);
            } else {
                console.warn(`⚠️ Input ${id} não encontrado no HTML`);
            }
        });
    }
    
    setupFilterControls() {
        console.log('🎧 Configurando controles de filtro...');
        
        // Aplicar filtros
        const applyBtn = document.getElementById('apply-filters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const empresa = document.getElementById('filter-empresa')?.value.trim() || null;
                const numeroCliente = document.getElementById('filter-numero-cliente')?.value.trim() || null;
                const nomeObra = document.getElementById('filter-nome-obra')?.value.trim() || null;
                
                console.log('🎯 Aplicando filtros:', { empresa, numeroCliente, nomeObra });
                this.manager.applyFilters({ empresa, numeroCliente, nomeObra });
            });
        } else {
            console.warn('⚠️ Botão apply-filters não encontrado, criando...');
            this.createActionButtons();
        }
        
        // Limpar filtros
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.log('🧹 Limpando filtros...');
                this.manager.clearFilters();
            });
        }
        
        // Recarregar obras
        const reloadBtn = document.getElementById('reload-obras');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', async () => {
                console.log('🔄 Recarregando obras...');
                await this.manager.reloadObras();
            });
        }
        
        // Debounce para inputs (usar mesma lógica da página 1)
        this.setupInputListeners();
    }
    
    createActionButtons() {
        // Encontrar container de filtros
        const filterContainer = document.querySelector('.filtro-inputs-area') || 
                                document.getElementById('filtros-inputs') ||
                                this.container;
        
        if (!filterContainer) return;
        
        // Criar div para botões (igual ao da página 1)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'filter-actions';
        actionsDiv.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 15px;
        `;
        
        // Botões (mesmo estilo da página 1)
        const buttons = [
            { id: 'apply-filters', text: 'Aplicar Filtros', color: '#4CAF50' },
            { id: 'clear-filters', text: 'Limpar Filtros', color: '#6c757d' },
            { id: 'reload-obras', text: '🔄 Recarregar', color: '#2196F3' }
        ];
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.textContent = btn.text;
            button.style.cssText = `
                padding: 10px 20px;
                background: ${btn.color};
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: ${btn.id === 'apply-filters' ? 'bold' : 'normal'};
            `;
            actionsDiv.appendChild(button);
        });
        
        filterContainer.appendChild(actionsDiv);
        
        // Reconfigurar listeners após criar botões
        this.setupFilterControls();
    }
    
    setupInputListeners() {
        // Debounce igual ao da página 1 (500ms)
        const inputIds = ['filter-empresa', 'filter-numero-cliente', 'filter-nome-obra'];
        const applyBtn = document.getElementById('apply-filters');
        
        if (!applyBtn) return;
        
        inputIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                let timeout;
                input.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        applyBtn.click();
                    }, 500); // Mesmo debounce da página 1
                });
            }
        });
    }
    
    async renderObras(obras) {
        console.log(`🎨 Renderizando ${obras.length} obras...`);
        
        // 🔥 REUTILIZAR SISTEMA DE RENDERIZAÇÃO DA PÁGINA 1
        
        // Opção 1: Usar função global do sistema
        if (typeof window.renderObrasFromFilter === 'function') {
            console.log('🔄 Usando renderObrasFromFilter do sistema de filtro');
            window.renderObrasFromFilter(obras, this.container);
            return;
        }
        
        // Opção 2: Usar loadSingleObra (sistema original)
        if (typeof window.loadSingleObra === 'function') {
            console.log('🔄 Usando loadSingleObra do sistema original');
            await this.renderUsingLoadSingleObra(obras);
            return;
        }
        
        // Opção 3: Usar createEmptyObra + populateObraData
        if (typeof window.createEmptyObra === 'function' && 
            typeof window.populateObraData === 'function') {
            console.log('🔄 Usando createEmptyObra + populateObraData');
            await this.renderUsingCreateEmptyObra(obras);
            return;
        }
        
        // Opção 4: Usar função do FilterSystem se disponível
        if (window.FilterSystem && typeof window.FilterSystem.loadObraIntoDOM === 'function') {
            console.log('🔄 Usando FilterSystem.loadObraIntoDOM');
            await this.renderUsingFilterSystem(obras);
            return;
        }
        
        // Opção 5: Fallback - renderização básica
        console.warn('⚠️ Nenhuma função de renderização encontrada, usando fallback');
        this.renderBasic(obras);
    }
    
    async renderUsingLoadSingleObra(obras) {
        // Limpar container
        this.container.innerHTML = '';
        
        // Para cada obra, usar loadSingleObra
        for (const obra of obras) {
            try {
                await window.loadSingleObra(obra);
            } catch (error) {
                console.error(`❌ Erro ao carregar obra ${obra.id}:`, error);
            }
        }
    }
    
    async renderUsingCreateEmptyObra(obras) {
        // Limpar container (mas manter filtros)
        const filterSection = document.querySelector('.filtro-inputs-area');
        this.container.innerHTML = '';
        if (filterSection) {
            this.container.appendChild(filterSection);
        }
        
        // Para cada obra, criar vazia e depois preencher
        for (const obra of obras) {
            try {
                await window.createEmptyObra(
                    obra.nome || `Obra ${obra.id}`, 
                    obra.id
                );
                
                // Aguardar criação no DOM
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Preencher dados
                const obraElement = document.querySelector(`[data-obra-id="${obra.id}"]`);
                if (obraElement && window.populateObraData) {
                    await window.populateObraData(obra);
                }
            } catch (error) {
                console.error(`❌ Erro ao criar obra ${obra.id}:`, error);
            }
        }
    }
    
    async renderUsingFilterSystem(obras) {
        // Limpar obras atuais (mesma função do FilterSystem)
        if (typeof window.removeBaseObraFromHTML === 'function') {
            window.removeBaseObraFromHTML();
        } else {
            this.container.innerHTML = '';
        }
        
        // Carregar cada obra
        for (const obra of obras) {
            try {
                await window.FilterSystem.loadObraIntoDOM(obra);
            } catch (error) {
                console.error(`❌ Erro ao carregar obra ${obra.id}:`, error);
            }
        }
    }
    
    renderBasic(obras) {
        // Limpar container (mas manter filtros)
        const filterSection = document.querySelector('.filtro-inputs-area');
        this.container.innerHTML = '';
        if (filterSection) {
            this.container.appendChild(filterSection);
        }
        
        if (obras.length === 0) {
            this.container.innerHTML += `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h3>📭 Nenhuma obra encontrada</h3>
                    <p>Tente ajustar os filtros</p>
                </div>
            `;
            return;
        }
        
        // Renderização básica de fallback
        obras.forEach((obra, index) => {
            const obraId = obra.id || `obra_${index}`;
            const obraName = obra.nome || obra.titulo || 'Obra sem nome';
            const empresa = obra.empresa || obra.empresaSigla || 'Sem empresa';
            
            const obraHTML = `
                <div class="obra-wrapper" data-obra-id="${obraId}" style="margin-bottom: 20px;">
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
                        <h3 style="margin: 0 0 10px 0;">${obraName}</h3>
                        <div style="color: #666; margin-bottom: 15px;">
                            <strong>Empresa:</strong> ${empresa} | 
                            <strong>ID:</strong> ${obraId}
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.location.href='/obras/${obraId}'"
                                    style="padding: 8px 15px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Ver Detalhes
                            </button>
                            <button onclick="deleteObra('${obraName}', '${obraId}')"
                                    style="padding: 8px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                                🗑️ Deletar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            this.container.insertAdjacentHTML('beforeend', obraHTML);
        });
    }
    
    showLoading() {
        // Manter filtros visíveis, mostrar loading abaixo
        const filterSection = document.querySelector('.filtro-inputs-area');
        const loadingHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 40px; margin-bottom: 20px;">⏳</div>
                <h3>Carregando obras...</h3>
                <p>Aguarde enquanto buscamos todas as obras do sistema.</p>
            </div>
        `;
        
        if (filterSection && filterSection.nextSibling) {
            filterSection.insertAdjacentHTML('afterend', loadingHTML);
        } else {
            this.container.insertAdjacentHTML('beforeend', loadingHTML);
        }
    }
    
    showError(message) {
        const errorHTML = `
            <div style="text-align: center; padding: 30px; background: #ffebee; border: 1px solid #ffcdd2; border-radius: 8px; color: #c62828; margin: 20px 0;">
                <div style="font-size: 40px; margin-bottom: 15px;">❌</div>
                <h3 style="margin: 0 0 10px 0;">Erro ao Carregar Obras</h3>
                <p style="margin: 0 0 20px 0;">${message}</p>
                <button onclick="location.reload()" 
                        style="padding: 10px 20px; background: #c62828; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Tentar Novamente
                </button>
            </div>
        `;
        
        // Inserir após os filtros
        const filterSection = document.querySelector('.filtro-inputs-area');
        if (filterSection) {
            filterSection.insertAdjacentHTML('afterend', errorHTML);
        } else {
            this.container.innerHTML = errorHTML;
        }
    }
    
    showToast(message, type = 'info') {
        // Mesma função toast da página 1
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'obras-manager-toast';
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
            background: ${colors[type]};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 250px;
            transform: translateX(100%);
            opacity: 0;
            animation: slideIn 0.3s forwards;
        `;
        
        toast.innerHTML = `
            <span style="font-size: 18px;">${icons[type]}</span>
            <span style="font-size: 14px;">${message}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Animação
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
        
        // Adicionar animações CSS se não existirem
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
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
    }
}
/* ==== FIM: obras-ui.js ==== */