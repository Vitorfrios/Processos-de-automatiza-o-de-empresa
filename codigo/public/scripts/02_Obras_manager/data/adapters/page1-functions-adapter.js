/**
 * data/adapters/page1-functions-adapter.js
 * Adaptador para usar funções da Página 1 na Página 2
 */

import { loadPage1Functions, removeConflictingStubs } from '../../utils/page1-functions-loader.js';

/**
 * Adaptador para usar funções da Página 1 na Página 2
 */
export class Page1FunctionsAdapter {
    constructor() {
        this.functions = null;
        this.initialized = false;
    }
    
    /**
     * Inicializa o adapter (carrega funções reais)
     */
    async initialize() {
        if (this.initialized) {
            return this.functions;
        }
        
        try {
            console.log('🎯 Inicializando Page1FunctionsAdapter...');
            
            // 1. Remover stubs conflitantes
            removeConflictingStubs();
            
            // 2. Carregar funções reais
            this.functions = await loadPage1Functions();
            
            // ✅ CORREÇÃO: Verificar se functions foi carregado
            if (!this.functions) {
                throw new Error('Funções da Página 1 não foram carregadas');
            }
            
            // 3. Validar funções essenciais
            this._validateEssentialFunctions();
            
            // ✅ CORREÇÃO CRÍTICA: Disponibilizar funções globalmente
            this._makeFunctionsGlobal();
            
            this.initialized = true;
            console.log('✅ Page1FunctionsAdapter inicializado com sucesso');
            
            return this.functions;
            
        } catch (error) {
            console.error('❌ Falha na inicialização do adapter:', error);
            throw error;
        }
    }
    
    /**
     * Valida funções essenciais para renderização
     */
    _validateEssentialFunctions() {
        const essentialFunctions = [
            'createEmptyObra',
            'populateObraData',
            'calculateVazaoArAndThermalGains',
            'calculateCapacitySolution'
        ];
        
        const missing = essentialFunctions.filter(func => !this.functions[func]);
        
        if (missing.length > 0) {
            throw new Error(`Funções essenciais não carregadas: ${missing.join(', ')}`);
        }
        
        console.log('✅ Todas as funções essenciais validadas');
    }
    
    /**
     * ✅ CORREÇÃO CRÍTICA: Disponibiliza funções no escopo global
     */
    _makeFunctionsGlobal() {
        console.log('🌐 Disponibilizando funções no escopo global...');
        
        const globalFunctions = [
            'calculateVazaoArAndThermalGains',
            'calculateCapacitySolution',
            'updateThermalGains',
            'togglePressurizationFields',
            'handleClimaBackupChange',
            'handleClimaInputBackupChange',
            'syncBackupWithClimaInputs'
        ];
        
        globalFunctions.forEach(funcName => {
            if (this.functions[funcName] && typeof this.functions[funcName] === 'function') {
                window[funcName] = this.functions[funcName];
                console.log(`✅ ${funcName} disponibilizada globalmente`);
            }
        });
        
        console.log('🌐 Funções críticas disponibilizadas no escopo global');
    }
    
    /**
     * Proxy para acessar funções
     */
    getFunction(name) {
        if (!this.initialized) {
            throw new Error(`Adapter não inicializado. Chame initialize() antes de usar ${name}`);
        }
        
        const func = this.functions[name];
        if (!func) {
            throw new Error(`Função ${name} não disponível na Página 1`);
        }
        
        return func;
    }
    
    // Métodos de conveniência para funções mais usadas
    async createEmptyObra(nome, id) {
        return this.getFunction('createEmptyObra')(nome, id);
    }
    
    async populateObraData(obraData) {
        return this.getFunction('populateObraData')(obraData);
    }
    
    calculateVazaoArAndThermalGains(roomId) {
        return this.getFunction('calculateVazaoArAndThermalGains')(roomId);
    }
    
    calculateCapacitySolution(roomId) {
        return this.getFunction('calculateCapacitySolution')(roomId);
    }
}

// Instância singleton
export const page1Adapter = new Page1FunctionsAdapter();