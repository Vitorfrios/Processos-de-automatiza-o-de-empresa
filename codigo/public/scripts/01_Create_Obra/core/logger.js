/**
 * SISTEMA CENTRALIZADO DE LOGS AUTOMÁTICO
 * 🎯 Reduz logs em 90% SEM modificar código existente
 * 📍 Localização: /core/logger.js
 */

(function() {
    'use strict';
    
    class SmartLogger {
        constructor() {
            this.levels = { 
                ERROR: 0, 
                WARN: 1, 
                INFO: 2, 
                DEBUG: 3
            };
            
            // ✅ CONFIGURAÇÃO ÚNICA - AJUSTE AQUI!
            this.config = {
                globalLevel: 'WARN', // ERROR, WARN, INFO, DEBUG
                silentPatterns: [
                    'Vazão atualizada para',
                    'Salvando dados para sala',
                    'Iniciando cálculos para sala',
                    'Ganhos calculados para',
                    'Dados coletados para',
                    'Tentando atualizar tabela',
                    'Obras carregadas:',
                    'Sala ainda não salva',
                    'Procurando sala:',
                    'Sincronização configurada',
                    'Observer configurado',
                    'VERIFICAÇÃO COMPLETA',
                    'Elementos encontrados',
                    'Construindo seção de',
                    'Módulos carregados',
                    'Funções críticas',
                    'DEBUG FINAL',
                    'Carregando constantes',
                    'Inicializando sistema',
                    '✅ Constantes carregadas',
                    '📦 Carregando módulos',
                    '🔍 Verificando sessão',
                    '📊 Sessão encontrada',
                    '🔒 Sistema de shutdown',
                    '🏢 Inicializando sistema',
                    'ℹ️ Display térmico atualizado',
                    '🔥 [THERMAL]',
                    '[CAPACITY]',
                    '📝 [COLLECT]',
                    '🎯 [COLLECT]',
                    '✅ [COLLECT]',
                    '✅ [FIND]',
                    '🧱 Sincronização paredes',
                    '🔧 Configurando par',
                    '✅ Sincronização configurada',
                    '⚡ INICIALIZANDO VALORES PADRÃO',
                    '🎯 CONFIGURANDO TODAS AS SINCRONIZAÇÕES',
                    '🔧 CONFIGURANDO SINCRONIZAÇÃO BIDIRECIONAL',
                    '🔍 VERIFICAÇÃO COMPLETA DA SALA',
                    '📊 Título: ✅ Encontrado',
                    '🎉 TODOS OS ELEMENTOS ENCONTRADOS',
                    '🔄 Backup alterado no form',
                    '🔧 Construindo seção de',
                    '🔧 Construindo tabela de',
                    '✅ Máquina adicionada à sala',
                    '🔍 Procurando máquinas após clique',
                    '🖊️ Preenchendo campos',
                    '🔧 Encontradas máquinas',
                    '🔧 Preenchendo apenas a PRIMEIRA',
                    '🔧 Preenchendo máquina',
                    '✅ Tipo de máquina selecionado',
                    '✅ Capacidade selecionada',
                    '✅ Tensão selecionada',
                    '🎲 Selecionando opções aleatórias',
                    '🔧 Encontrados checkboxes',
                    '✅ Opção selecionada',
                    '🎲 opções selecionadas aleatoriamente',
                    '💾 Botão Salvar Obra clicado',
                    '🔄 Alterando TODOS os valores',
                    '✅ TODOS os valores alterados',
                    '💾 Chamando função original',
                    '💾 SALVANDO OBRA pelo ID',
                    '🔍 Buscando obra com retry',
                    '✅ Obra encontrada na tentativa',
                    '🔒 REFERÊNCIA SALVA',
                    '✅ Obra confirmada no DOM',
                    '🔨 Construindo dados da obra',
                    '🚨 buildObraData INICIADA',
                    '📦 Construindo dados da obra',
                    '🔍 [EXTRACT EMPRESA]',
                    '📋 [EXTRACT EMPRESA]',
                    '✅ [EXTRACT EMPRESA]',
                    '🏢 [EXTRACT EMPRESA]',
                    '🔢 [EXTRACT EMPRESA]',
                    '🎯 [EXTRACT EMPRESA]',
                    '📅 [EXTRACT EMPRESA]',
                    '🔍 Encontrados projetos',
                    '📝 Processando projeto',
                    '🔍 Encontradas salas',
                    '🔍 Extraindo dados da sala',
                    '📝 Inputs de climatização',
                    '🔧 Extraindo dados da máquina',
                    '✅ Máquina extraída',
                    '🤖 máquina(s) extraída(s)',
                    '❄️ Dados de capacidade',
                    '🔥 ganhos térmicos',
                    '⚙️ opções de instalação',
                    '📊 Dados extraídos da sala',
                    '✅ Projeto processado',
                    '✅ Projeto adicionado à obra',
                    '📦 Dados da obra construídos',
                    '🔍 VERIFICAÇÃO FINAL',
                    '🔍 VERIFICAÇÃO DE OBRA MELHORADA',
                    '🆕 SALVANDO COMO NOVA OBRA',
                    '📤 SALVANDO NOVA OBRA',
                    '📝 Adicionando obra à sessão',
                    '✅ NOVA OBRA SALVA',
                    '✅ Obra confirmada no DOM',
                    '🔄 Atualizando botão da obra',
                    '✅ Botão atualizado para',
                    '🔄 [HEADER] Chamando',
                    '🔄 [HEADER] Iniciando',
                    '🔍 [HEADER] Extraindo',
                    '📊 [HEADER] Dados extraídos',
                    '🎨 [HEADER] Chamando',
                    '🔧 Inicializando tooltip',
                    '✅ Tooltip inicializado',
                    '✅ Header da obra atualizado',
                    '✅ [EMPRESA] Interface atualizada',
                    '✅ [HEADER] Header atualizado',
                    '✅ OBRA SALVA/ATUALIZADA',
                    '🐭 Escondendo'
                ]
            };
            
            this.originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info,
                debug: console.debug
            };
            
            this.initialize();
        }
        
        initialize() {
            console.log('🔧 Sistema de logs AUTOMÁTICO inicializado');
            this.interceptConsole();
        }
        
        /**
         * 🎯 INTERCEPTA console.log GLOBALMENTE
         */
        interceptConsole() {
            const self = this;
            
            console.log = function(...args) {
                self.handleLog('INFO', args);
            };
            
            console.info = function(...args) {
                self.handleLog('INFO', args);
            };
            
            console.warn = function(...args) {
                self.handleLog('WARN', args);
            };
            
            console.error = function(...args) {
                self.handleLog('ERROR', args);
            };
            
            console.debug = function(...args) {
                self.handleLog('DEBUG', args);
            };
            
            console.log('✅ Console interceptado - logs automáticos ativados');
        }
        
        /**
         * 🎯 Processa logs automaticamente
         */
        handleLog(level, args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            
            // 🚫 Verificar se deve silenciar
            if (this.shouldSilence(message)) {
                return;
            }
            
            // 📊 Verificar se deve logar
            if (this.shouldLog(level)) {
                this.originalConsole[level === 'INFO' ? 'log' : level.toLowerCase()](
                    this.getIcon(level),
                    ...args
                );
            }
        }
        
        /**
         * 🚫 Verifica se deve silenciar a mensagem
         */
        shouldSilence(message) {
            return this.config.silentPatterns.some(pattern => message.includes(pattern));
        }
        
        /**
         * 📊 Verifica se deve logar baseado no nível
         */
        shouldLog(level) {
            return this.levels[level] <= this.levels[this.config.globalLevel];
        }
        
        /**
         * 🎯 Retorna ícone para o nível
         */
        getIcon(level) {
            const icons = { 
                ERROR: '❌', 
                WARN: '⚠️', 
                INFO: 'ℹ️', 
                DEBUG: '🔍'
            };
            return icons[level] || '💬';
        }
    }

    // 🎯 CRIAR INSTÂNCIA GLOBAL
    window.logger = new SmartLogger();

})();