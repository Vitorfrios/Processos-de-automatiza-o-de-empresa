/* ==== INÍCIO: obras-filters.js ==== */
/**
 * obras-filters.js - Sistema de filtros avançados
 */

export class ObrasFilters {
    constructor(manager) {
        this.manager = manager;
        this.empresasCache = null;
    }
    
    async initialize() {
        console.log('🔍 Inicializando sistema de filtros...');
        
        // Carregar cache de empresas para autocomplete
        await this.loadEmpresasCache();
        
        // Configurar autocomplete para empresa
        this.setupEmpresaAutocomplete();
    }
    
    async loadEmpresasCache() {
        try {
            console.log('📦 Carregando cache de empresas...');
            
            const response = await fetch('/api/dados/empresas');
            if (response.ok) {
                const data = await response.json();
                this.empresasCache = data.empresas || [];
                console.log(`✅ ${this.empresasCache.length} empresas carregadas`);
            }
        } catch (error) {
            console.warn('⚠️ Não foi possível carregar empresas:', error);
            this.empresasCache = [];
        }
    }
    
    setupEmpresaAutocomplete() {
        const empresaInput = document.getElementById('filter-empresa');
        if (!empresaInput || !this.empresasCache) return;
        
        let dropdown = null;
        
        // Criar dropdown
        function createDropdown() {
            dropdown = document.createElement('div');
            dropdown.id = 'empresa-autocomplete-dropdown';
            dropdown.style.cssText = `
                position: absolute;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                max-height: 200px;
                overflow-y: auto;
                display: none;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                width: ${empresaInput.offsetWidth}px;
            `;
            
            document.body.appendChild(dropdown);
        }
        
        // Atualizar posição
        function updatePosition() {
            if (!dropdown) return;
            
            const rect = empresaInput.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
            dropdown.style.left = (rect.left + window.scrollX) + 'px';
            dropdown.style.width = rect.width + 'px';
        }
        
        // Filtrar empresas
        function filterEmpresas(term) {
            if (!term || term.length < 1) return [];
            
            const termoNormalizado = term.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            return this.empresasCache.filter(empresaObj => {
                const [sigla, nome] = Object.entries(empresaObj)[0];
                const nomeNormalizado = nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                return sigla === termoNormalizado ||
                       sigla.includes(termoNormalizado) ||
                       nomeNormalizado.includes(termoNormalizado);
            });
        }
        
        // Mostrar resultados
        function showResults(results) {
            if (!dropdown) createDropdown();
            
            if (results.length === 0) {
                dropdown.innerHTML = '<div style="padding: 10px; color: #666; font-style: italic;">Nenhuma empresa encontrada</div>';
            } else {
                dropdown.innerHTML = results.map(empresaObj => {
                    const [sigla, nome] = Object.entries(empresaObj)[0];
                    return `
                        <div class="empresa-option" 
                             data-sigla="${sigla}" 
                             data-nome="${nome}"
                             style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                             onmouseover="this.style.background='#f8f9fa'"
                             onmouseout="this.style.background='white'">
                            <strong>${sigla}</strong> 
                            <span style="color: #666;">- ${nome}</span>
                        </div>
                    `;
                }).join('');
                
                // Adicionar event listeners
                dropdown.querySelectorAll('.empresa-option').forEach(option => {
                    option.addEventListener('click', () => {
                        empresaInput.value = `${option.dataset.sigla} - ${option.dataset.nome}`;
                        dropdown.style.display = 'none';
                        
                        // Aplicar filtro automaticamente
                        setTimeout(() => {
                            document.getElementById('apply-filters').click();
                        }, 100);
                    });
                });
            }
            
            updatePosition();
            dropdown.style.display = 'block';
        }
        
        // Event listeners
        createDropdown();
        
        empresaInput.addEventListener('input', (e) => {
            const term = e.target.value.trim();
            
            if (!dropdown) createDropdown();
            
            if (term.length === 0) {
                dropdown.style.display = 'none';
                return;
            }
            
            const results = filterEmpresas.call(this, term);
            showResults(results.slice(0, 20)); // Limitar a 20 resultados
        });
        
        empresaInput.addEventListener('focus', () => {
            if (empresaInput.value.trim() === '' && this.empresasCache) {
                showResults(this.empresasCache.slice(0, 20));
            }
        });
        
        empresaInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (dropdown) dropdown.style.display = 'none';
            }, 200);
        });
        
        // Atualizar posição quando redimensionar
        window.addEventListener('resize', updatePosition);
    }
    
    clearInputs() {
        document.getElementById('filter-empresa').value = '';
        document.getElementById('filter-numero-cliente').value = '';
        document.getElementById('filter-nome-obra').value = '';
    }
}
/* ==== FIM: obras-filters.js ==== */