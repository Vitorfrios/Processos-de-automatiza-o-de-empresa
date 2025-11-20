/**
 * logger.js
 * 🎯 Reduz logs em 90% - Filtro automático de mensagens
 */

export function createSmartLogger() {
    'use strict';
    
    class SmartLogger {
        constructor() {
            this.levels = { 
                ERROR: 0, 
                WARN: 1, 
                INFO: 2, 
                DEBUG: 3
            };
            
            // ✅ CONFIGURAÇÃO DE FILTROS
            this.config = {
                globalLevel: 'WARN', // Só mostra ERROR e WARN por padrão
                enabled: true, // ✅ INICIA ATIVADO
                silentPatterns: [
                    // Cálculos térmicos
                    'Vazão atualizada para', 'Salvando dados para sala', 'Iniciando cálculos para sala',
                    'Ganhos calculados para', 'Dados coletados para', 'Tentando atualizar tabela',
                    'Obras carregadas:', 'Sala ainda não salva', 'Procurando sala:',
                    
                    // Sincronização
                    'Sincronização configurada', 'Observer configurado', 'VERIFICAÇÃO COMPLETA',
                    'Elementos encontrados', 'Construindo seção de', '🧱 Sincronização paredes',
                    '🔧 Configurando par', '✅ Sincronização configurada', '⚡ INICIALIZANDO VALORES PADRÃO',
                    '🎯 CONFIGURANDO TODAS AS SINCRONIZAÇÕES', '🔧 CONFIGURANDO SINCRONIZAÇÃO BIDIRECIONAL',
                    
                    // UI e componentes
                    'Módulos carregados', 'Funções críticas', 'DEBUG FINAL', 'Carregando constantes',
                    'Inicializando sistema', '✅ Constantes carregadas', '📦 Carregando módulos',
                    '🔍 Verificando sessão', '📊 Sessão encontrada', '🔒 Sistema de shutdown',
                    '🏢 Inicializando sistema', 'ℹ️ Display térmico atualizado',
                    
                    // Thermal gains
                    '🔥 [THERMAL]', '[THERMAL] Iniciando cálculos', '[THERMAL] Ganhos calculados',
                    '[THERMAL] Totais para', '[THERMAL] Tentando atualizar',
                    
                    // Capacity calculator
                    '[CAPACITY] Salvando dados', '[CAPACITY] Obras carregadas', '[CAPACITY] Sala ainda não salva',
                    
                    // Data collection
                    '📝 [COLLECT] Coletando inputs', '🎯 [COLLECT] Estado da pressurização',
                    '✅ [COLLECT] dados coletados', '✅ [FIND] Seção encontrada',
                    
                    // Room verification
                    '🔍 VERIFICAÇÃO COMPLETA DA SALA', '📊 Título: ✅ Encontrado',
                    '🎉 TODOS OS ELEMENTOS ENCONTRADOS',
                    
                    // Machines
                    '✅ Máquina adicionada à sala', '🔍 Procurando máquinas após clique',
                    '🖊️ Preenchendo campos', '🔧 Encontradas máquinas', '🔧 Preenchendo apenas a PRIMEIRA',
                    '🔧 Preenchendo máquina', '✅ Tipo de máquina selecionado', '✅ Capacidade selecionada',
                    '✅ Tensão selecionada', '🎲 Selecionando opções aleatórias', '🔧 Encontrados checkboxes',
                    '✅ Opção selecionada', '🎲 opções selecionadas aleatoriamente',
                    
                    // Obra saving
                    '💾 Botão Salvar Obra clicado', '🔄 Alterando TODOS os valores', '✅ TODOS os valores alterados',
                    '💾 Chamando função original', '💾 SALVANDO OBRA pelo ID', '🔍 Buscando obra com retry',
                    '✅ Obra encontrada na tentativa', '🔒 REFERÊNCIA SALVA', '✅ Obra confirmada no DOM',
                    '🔨 Construindo dados da obra', '🚨 buildObraData INICIADA', '📦 Construindo dados da obra',
                    
                    // Empresa data extraction
                    '🔍 [EXTRACT EMPRESA]', '📋 [EXTRACT EMPRESA]', '✅ [EXTRACT EMPRESA]',
                    '🏢 [EXTRACT EMPRESA]', '🔢 [EXTRACT EMPRESA]', '🎯 [EXTRACT EMPRESA]',
                    '📅 [EXTRACT EMPRESA]',
                    
                    // Project and room data
                    '🔍 Encontrados projetos', '📝 Processando projeto', '🔍 Encontradas salas',
                    '🔍 Extraindo dados da sala', '📝 Inputs de climatização', '🔧 Extraindo dados da máquina',
                    '✅ Máquina extraída', '🤖 máquina(s) extraída(s)', '❄️ Dados de capacidade',
                    '🔥 ganhos térmicos', '⚙️ opções de instalação', '📊 Dados extraídos da sala',
                    '✅ Projeto processado', '✅ Projeto adicionado à obra', '📦 Dados da obra construídos',
                    
                    // Obra persistence
                    '🔍 VERIFICAÇÃO FINAL', '🔍 VERIFICAÇÃO DE OBRA MELHORADA', '🆕 SALVANDO COMO NOVA OBRA',
                    '📤 SALVANDO NOVA OBRA', '📝 Adicionando obra à sessão', '✅ NOVA OBRA SALVA',
                    '✅ Obra confirmada no DOM', '🔄 Atualizando botão da obra', '✅ Botão atualizado para',
                    
                    // Header updates
                    '🔄 [HEADER] Chamando', '🔄 [HEADER] Iniciando', '🔍 [HEADER] Extraindo',
                    '📊 [HEADER] Dados extraídos', '🎨 [HEADER] Chamando', '🔧 Inicializando tooltip',
                    '✅ Tooltip inicializado', '✅ Header da obra atualizado', '✅ [EMPRESA] Interface atualizada',
                    '✅ [HEADER] Header atualizado', '✅ OBRA SALVA/ATUALIZADA',
                    
                    // Misc
                    '🐭 Escondendo', '🔄 Backup alterado no form'
                ]
            };
            
            // Salvar console original
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
            this.interceptConsole();
            
            // ✅ MOSTRAR COMANDOS COM PRIORIDADE MÁXIMA (nunca filtrar)
            this.showLoggerCommands();
        }
        
        /**
         * 🎯 INTERCEPTA console.log GLOBALMENTE
         */
        interceptConsole() {
            const self = this;
            
            console.log = function(...args) {
                if (!self.config.enabled) {
                    self.originalConsole.log(...args); // Mostra tudo se desativado
                    return;
                }
                self.processLog('INFO', args);
            };
            
            console.info = function(...args) {
                if (!self.config.enabled) {
                    self.originalConsole.info(...args);
                    return;
                }
                self.processLog('INFO', args);
            };
            
            console.warn = function(...args) {
                if (!self.config.enabled) {
                    self.originalConsole.warn(...args);
                    return;
                }
                self.processLog('WARN', args);
            };
            
            console.error = function(...args) {
                if (!self.config.enabled) {
                    self.originalConsole.error(...args);
                    return;
                }
                self.processLog('ERROR', args);
            };
            
            console.debug = function(...args) {
                if (!self.config.enabled) {
                    self.originalConsole.debug(...args);
                    return;
                }
                self.processLog('DEBUG', args);
            };
        }
        
        /**
         * 🎯 Processa cada log automaticamente
         */
        processLog(level, args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            
            // 🚫 Pular logs silenciados
            if (this.shouldSilence(message)) {
                return;
            }
            
            // 📊 Mostrar apenas logs importantes
            if (this.shouldShow(level)) {
                const icon = this.getIcon(level);
                const method = level === 'INFO' ? 'log' : level.toLowerCase();
                this.originalConsole[method](icon, ...args);
            }
        }
        
        /**
         * 🚫 Verifica se deve silenciar a mensagem
         */
        shouldSilence(message) {
            return this.config.silentPatterns.some(pattern => message.includes(pattern));
        }
        
        /**
         * 📊 Verifica se deve mostrar baseado no nível
         */
        shouldShow(level) {
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
        
        /**
         * 🔥 MOSTRAR COMANDOS COM PRIORIDADE MÁXIMA
         * Nunca é filtrado - sempre aparece
         */
        showLoggerCommands() {
            const self = this;
            
            // ✅ Função para ativar/desativar logs
            window.toggleLogger = function(enable = null) {
                if (enable === null) {
                    // Alternar estado atual
                    self.config.enabled = !self.config.enabled;
                } else {
                    // Definir estado específico
                    self.config.enabled = Boolean(enable);
                }
                
                const status = self.config.enabled ? '✅ ATIVADO' : '❌ DESATIVADO';
                const message = `🔧 Logger ${status} - Todos os logs serão ${self.config.enabled ? 'filtrados' : 'mostrados'}`;
                
                // ✅ MOSTRAR STATUS SEMPRE (nunca filtrar)
                self.originalConsole.log('%c' + message, 
                    'color: #ffffff; background: #1976d2; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
                
                return self.config.enabled;
            };
            
            // ✅ Função para ver status
            window.getLoggerStatus = function() {
                const status = {
                    enabled: self.config.enabled,
                    level: self.config.globalLevel,
                    filteredPatterns: self.config.silentPatterns.length
                };
                
                // ✅ MOSTRAR STATUS SEMPRE (nunca filtrar)
                self.originalConsole.log('%c🔧 Status do Logger:', 
                    'color: #1976d2; font-weight: bold;', status);
                
                return status;
            };
            
            // ✅ Função para restaurar console original
            window.restoreOriginalConsole = function() {
                console.log = self.originalConsole.log;
                console.warn = self.originalConsole.warn;
                console.error = self.originalConsole.error;
                console.info = self.originalConsole.info;
                console.debug = self.originalConsole.debug;
                
                // ✅ MOSTRAR MENSAGEM SEMPRE (nunca filtrar)
                self.originalConsole.log('%c🔧 Console original restaurado - filtros removidos', 
                    'color: #ffffff; background: #d32f2f; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
            };
            
            // ✅ Adicionar atalhos rápidos
            window.loggerOn = () => window.toggleLogger(true);
            window.loggerOff = () => window.toggleLogger(false);
            
            // ✅ MOSTRAR COMANDOS INICIAIS COM PRIORIDADE MÁXIMA
            setTimeout(() => {
                self.originalConsole.log('%c🔧 FILTRO DE LOGS ATIVADO', 
                    'color: #ffffff; background: #388e3c; padding: 3px 5px; border-radius: 4px; font-size: 14px;');
                
                self.originalConsole.log('%cComandos disponíveis:', 'color: #1976d2; font-weight: bold;');
                self.originalConsole.log('   - toggleLogger()       - Alternar filtro de logs');
                self.originalConsole.log('   - loggerOn()           - Ativar filtro');
                self.originalConsole.log('   - loggerOff()          - Desativar filtro (mostrar tudo)');
                self.originalConsole.log('   - getLoggerStatus()    - Ver status atual');
                self.originalConsole.log('   - restoreOriginalConsole() - Remover filtros completamente');
                self.originalConsole.log('');
            }, 100);
        }
    }

    return new SmartLogger();
}