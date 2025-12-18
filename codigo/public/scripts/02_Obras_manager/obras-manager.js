/* ==== INÍCIO: obras-manager.js ==== */
/**
 * obras-manager.js - Sistema principal de gerenciamento
 * SEMPRE ativo na página 2
 */

import { ObrasLoader } from './obras-loader.js';
import { ObrasDelete } from './obras-delete.js';
import { ObrasUI } from './obras-ui.js';


export class ObrasManager {
    constructor() {
        this.state = {
            isLoading: false,
            isLocked: false,
            obras: [],
            filters: {
                empresa: null,
                numeroCliente: null,
                nomeObra: null
            }
        };
        
        this.loader = null;
        this.deleter = null;
        this.ui = null;
        
        console.log('🏗️ ObrasManager criado');
    }
    
    async initialize() {
        try {
            console.log('🔧 Inicializando módulos...');
            
            // Inicializar módulos
            this.loader = new ObrasLoader(this);
            this.deleter = new ObrasDelete(this);
            this.ui = new ObrasUI(this);
            
            // Configurar UI
            this.ui.initialize();
            
            // Carregar todas as obras
            await this.loadAllObras();
            
            // Configurar sistema de deleção
            this.deleter.initialize();
            
            console.log('✅ Sistema de gerenciamento pronto');
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.ui.showError('Erro ao inicializar sistema: ' + error.message);
        }
    }
    
    async loadAllObras() {
        if (this.state.isLocked) {
            console.log('⏭️ Operação já em andamento, ignorando...');
            return;
        }
        
        this.state.isLocked = true;
        this.state.isLoading = true;
        
        try {
            console.log('📥 Carregando TODAS as obras...');
            this.ui.showLoading();
            
            const obras = await this.loader.loadAllObras();
            this.state.obras = obras;
            
            // Renderizar na UI
            await this.ui.renderObras(obras);
            
            console.log(`✅ ${obras.length} obras carregadas`);
        } catch (error) {
            console.error('❌ Erro ao carregar obras:', error);
            this.ui.showError('Não foi possível carregar as obras: ' + error.message);
        } finally {
            this.state.isLoading = false;
            this.state.isLocked = false;
        }
    }
    
    async reloadObras() {
        console.log('🔄 Recarregando obras...');
        await this.loadAllObras();
    }
    
    async applyFilters(filters) {
        clearTimeout(this.filterTimeout);
        
        this.filterTimeout = setTimeout(async () => {
            try {
                this.state.filters = { ...this.state.filters, ...filters };
                
                let filtered = this.state.obras;
                
                if (filters.empresa) {
                    const term = filters.empresa.toLowerCase();
                    filtered = filtered.filter(obra => 
                        (obra.empresa || '').toLowerCase().includes(term) ||
                        (obra.empresaSigla || '').toLowerCase().includes(term)
                    );
                }
                
                if (filters.numeroCliente) {
                    filtered = filtered.filter(obra => 
                        obra.numeroCliente == filters.numeroCliente ||
                        obra.clienteNumero == filters.numeroCliente
                    );
                }
                
                if (filters.nomeObra) {
                    const term = filters.nomeObra.toLowerCase();
                    filtered = filtered.filter(obra => 
                        (obra.nome || '').toLowerCase().includes(term) ||
                        (obra.titulo || '').toLowerCase().includes(term)
                    );
                }
                
                console.log(`🎯 ${filtered.length} obras após filtros`);
                await this.ui.renderObras(filtered);
            } catch (error) {
                console.error('❌ Erro ao aplicar filtros:', error);
            }
        }, 300);
    }
    
    clearFilters() {
        const empresaInput = document.getElementById('filter-empresa');
        const numeroInput = document.getElementById('filter-numero-cliente');
        const nomeInput = document.getElementById('filter-nome-obra');
        
        if (empresaInput) empresaInput.value = '';
        if (numeroInput) numeroInput.value = '';
        if (nomeInput) nomeInput.value = '';
        
        this.ui.renderObras(this.state.obras);
    }
}
/* ==== FIM: obras-manager.js ==== */
/* ==== FIM: obras-manager.js ==== */