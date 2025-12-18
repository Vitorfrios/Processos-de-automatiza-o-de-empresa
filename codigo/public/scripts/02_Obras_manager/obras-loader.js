/* ==== INÍCIO: obras-loader.js ==== */
/**
 * obras-loader.js - Carrega TODAS as obras do sistema
 * APENAS endpoint: /api/backup-completo
 */

export class ObrasLoader {
    constructor(manager) {
        this.manager = manager;
        this.cache = null;
        this.lastFetch = null;
    }
    
    async loadAllObras() {
        console.log('🌐 Buscando todas as obras...');
        
        // Configurar timeout de 30 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
            console.log(`🔍 Endpoint: /api/backup-completo`);
            
            const response = await fetch('/api/backup-completo', {
                signal: controller.signal
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 Resposta do endpoint:', data);
            
            // 🔥 CORREÇÃO: Extrair obras corretamente
            const obras = this.extractObrasFromData(data);
            
            if (!obras) {
                throw new Error('Estrutura de resposta inválida');
            }
            
            console.log(`✅ ${obras.length} obras carregadas`);
            
            // Limpar timeout
            clearTimeout(timeoutId);
            
            // Salvar cache
            this.cache = obras;
            this.lastFetch = Date.now();
            
            return obras;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.error('❌ Timeout ao carregar obras');
                throw new Error('Timeout: o servidor demorou muito para responder');
            }
            
            console.error('❌ Erro ao carregar obras:', error);
            throw error;
        }
    }
    
    extractObrasFromData(data) {
        console.log('🔍 Analisando estrutura da resposta:', data);
        
        // 🔥 CORREÇÃO: Tratar múltiplas estruturas possíveis
        if (Array.isArray(data)) {
            console.log('📊 Estrutura: Array direto');
            return data;
        }
        
        if (data && typeof data === 'object') {
            // Tentar diferentes propriedades
            if (data.obras && Array.isArray(data.obras)) {
                console.log('📊 Estrutura: { obras: [] }');
                return data.obras;
            }
            
            if (data.data && Array.isArray(data.data)) {
                console.log('📊 Estrutura: { data: [] }');
                return data.data;
            }
            
            if (data.items && Array.isArray(data.items)) {
                console.log('📊 Estrutura: { items: [] }');
                return data.items;
            }
            
            if (data.result && Array.isArray(data.result)) {
                console.log('📊 Estrutura: { result: [] }');
                return data.result;
            }
            
            // Verificar se tem propriedades que são arrays
            for (const key in data) {
                if (Array.isArray(data[key]) && 
                    (key.toLowerCase().includes('obra') || 
                     key.toLowerCase().includes('project') ||
                     data[key].length > 0)) {
                    console.log(`📊 Estrutura: { ${key}: [] }`);
                    return data[key];
                }
            }
            
            // Se for objeto vazio ou com propriedades não-array
            console.warn('⚠️ Estrutura não reconhecida, retornando array vazio');
            return [];
        }
        
        console.error('❌ Dados inválidos recebidos');
        return [];
    }
    
    clearCache() {
        this.cache = null;
        this.lastFetch = null;
    }
}
/* ==== FIM: obras-loader.js ==== */