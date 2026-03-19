/**
 * logger.js
 * Smart console filter with a silent client mode.
 */

function resolveAppConfig(appConfig) {
    if (appConfig) {
        return appConfig;
    }

    if (typeof window === 'undefined') {
        return {};
    }

    return window.APP_CONFIG || window.__APP_CONFIG_OVERRIDES__ || {};
}

export function createSmartLogger(appConfig = null) {
    class SmartLogger {
        constructor(runtimeAppConfig) {
            this.appConfig = resolveAppConfig(runtimeAppConfig);
            this.isClientMode = this.appConfig?.mode === 'client';

            this.levels = {
                NONE: -1,
                ERROR: 0,
                WARN: 1,
                INFO: 2,
                DEBUG: 3
            };

            this.config = {
                globalLevel: this.isClientMode ? 'NONE' : 'WARN',
                enabled: true,
                announceCommands: !this.isClientMode,
                silentPatterns: [
                    'VazÃ£o atualizada para', 'Salvando dados para sala', 'Iniciando cÃ¡lculos para sala',
                    'Ganhos calculados para', 'Dados coletados para', 'Tentando atualizar tabela',
                    'Obras carregadas:', 'Sala ainda nÃ£o salva', 'Procurando sala:',
                    'SincronizaÃ§Ã£o configurada', 'Observer configurado', 'VERIFICAÃ‡ÃƒO COMPLETA',
                    'Elementos encontrados', 'Construindo seÃ§Ã£o de', 'ðŸ§± SincronizaÃ§Ã£o paredes',
                    'ðŸ”§ Configurando par', 'âœ… SincronizaÃ§Ã£o configurada', 'âš¡ INICIALIZANDO VALORES PADRÃƒO',
                    'ðŸŽ¯ CONFIGURANDO TODAS AS SINCRONIZAÃ‡Ã•ES', 'ðŸ”§ CONFIGURANDO SINCRONIZAÃ‡ÃƒO BIDIRECIONAL',
                    'MÃ³dulos carregados', 'FunÃ§Ãµes crÃ­ticas', 'DEBUG FINAL', 'Carregando constantes',
                    'Inicializando sistema', 'âœ… Constantes carregadas', 'ðŸ“¦ Carregando mÃ³dulos',
                    'ðŸ” Verificando sessÃ£o', 'ðŸ“Š SessÃ£o encontrada', 'ðŸ”’ Sistema de shutdown',
                    'ðŸ¢ Inicializando sistema', 'â„¹ï¸ Display tÃ©rmico atualizado',
                    'ðŸ”¥ [THERMAL]', '[THERMAL] Iniciando cÃ¡lculos', '[THERMAL] Ganhos calculados',
                    '[THERMAL] Totais para', '[THERMAL] Tentando atualizar',
                    '[CAPACITY] Salvando dados', '[CAPACITY] Obras carregadas', '[CAPACITY] Sala ainda nÃ£o salva',
                    'ðŸ“ [COLLECT] Coletando inputs', 'ðŸŽ¯ [COLLECT] Estado da pressurizaÃ§Ã£o',
                    'âœ… [COLLECT] dados coletados', 'âœ… [FIND] SeÃ§Ã£o encontrada',
                    'ðŸ” VERIFICAÃ‡ÃƒO COMPLETA DA SALA', 'ðŸ“Š TÃ­tulo: âœ… Encontrado',
                    'ðŸŽ‰ TODOS OS ELEMENTOS ENCONTRADOS',
                    'âœ… MÃ¡quina adicionada Ã  sala', 'ðŸ” Procurando mÃ¡quinas apÃ³s clique',
                    'ðŸ–Šï¸ Preenchendo campos', 'ðŸ”§ Encontradas mÃ¡quinas', 'ðŸ”§ Preenchendo apenas a PRIMEIRA',
                    'ðŸ”§ Preenchendo mÃ¡quina', 'âœ… Tipo de mÃ¡quina selecionado', 'âœ… Capacidade selecionada',
                    'âœ… TensÃ£o selecionada', 'ðŸŽ² Selecionando opÃ§Ãµes aleatÃ³rias', 'ðŸ”§ Encontrados checkboxes',
                    'âœ… OpÃ§Ã£o selecionada', 'ðŸŽ² opÃ§Ãµes selecionadas aleatoriamente',
                    'ðŸ’¾ BotÃ£o Salvar Obra clicado', ' Alterando TODOS os valores', 'âœ… TODOS os valores alterados',
                    'ðŸ’¾ Chamando funÃ§Ã£o original', 'ðŸ’¾ SALVANDO OBRA pelo ID', 'ðŸ” Buscando obra com retry',
                    'âœ… Obra encontrada na tentativa', 'ðŸ”’ REFERÃŠNCIA SALVA', 'âœ… Obra confirmada no DOM',
                    'ðŸ”¨ Construindo dados da obra', 'ðŸš¨ buildObraData INICIADA', 'ðŸ“¦ Construindo dados da obra',
                    'ðŸ” [EXTRACT EMPRESA]', 'ðŸ“‹ [EXTRACT EMPRESA]', 'âœ… [EXTRACT EMPRESA]',
                    'ðŸ¢ [EXTRACT EMPRESA]', 'ðŸ”¢ [EXTRACT EMPRESA]', 'ðŸŽ¯ [EXTRACT EMPRESA]',
                    'ðŸ“… [EXTRACT EMPRESA]',
                    'ðŸ” Encontrados projetos', 'ðŸ“ Processando projeto', 'ðŸ” Encontradas salas',
                    'ðŸ” Extraindo dados da sala', 'ðŸ“ Inputs de climatizaÃ§Ã£o', 'ðŸ”§ Extraindo dados da mÃ¡quina',
                    'âœ… MÃ¡quina extraÃ­da', 'ðŸ¤– mÃ¡quina(s) extraÃ­da(s)', 'â„ï¸ Dados de capacidade',
                    'ðŸ”¥ ganhos tÃ©rmicos', 'âš™ï¸ opÃ§Ãµes de instalaÃ§Ã£o', 'ðŸ“Š Dados extraÃ­dos da sala',
                    'âœ… Projeto processado', 'âœ… Projeto adicionado Ã  obra', 'ðŸ“¦ Dados da obra construÃ­dos',
                    'ðŸ” VERIFICAÃ‡ÃƒO FINAL', 'ðŸ” VERIFICAÃ‡ÃƒO DE OBRA MELHORADA', 'ðŸ†• SALVANDO COMO NOVA OBRA',
                    'ðŸ“¤ SALVANDO NOVA OBRA', 'ðŸ“ Adicionando obra Ã  sessÃ£o', 'âœ… NOVA OBRA SALVA',
                    'âœ… Obra confirmada no DOM', ' Atualizando botÃ£o da obra', 'âœ… BotÃ£o atualizado para',
                    ' [HEADER] Chamando', ' [HEADER] Iniciando', 'ðŸ” [HEADER] Extraindo',
                    'ðŸ“Š [HEADER] Dados extraÃ­dos', 'ðŸŽ¨ [HEADER] Chamando', 'ðŸ”§ Inicializando tooltip',
                    'âœ… Tooltip inicializado', 'âœ… Header da obra atualizado', 'âœ… [EMPRESA] Interface atualizada',
                    'âœ… [HEADER] Header atualizado', 'âœ… OBRA SALVA/ATUALIZADA',
                    'ðŸ­ Escondendo', ' Backup alterado no form'
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
            this.interceptConsole();
            this.registerLoggerCommands();

            if (this.config.announceCommands) {
                this.showLoggerCommands();
            }
        }

        interceptConsole() {
            const self = this;

            console.log = function (...args) {
                if (!self.config.enabled) {
                    self.originalConsole.log(...args);
                    return;
                }
                self.processLog('INFO', args);
            };

            console.info = function (...args) {
                if (!self.config.enabled) {
                    self.originalConsole.info(...args);
                    return;
                }
                self.processLog('INFO', args);
            };

            console.warn = function (...args) {
                if (!self.config.enabled) {
                    self.originalConsole.warn(...args);
                    return;
                }
                self.processLog('WARN', args);
            };

            console.error = function (...args) {
                if (!self.config.enabled) {
                    self.originalConsole.error(...args);
                    return;
                }
                self.processLog('ERROR', args);
            };

            console.debug = function (...args) {
                if (!self.config.enabled) {
                    self.originalConsole.debug(...args);
                    return;
                }
                self.processLog('DEBUG', args);
            };
        }

        processLog(level, args) {
            const message = args.map((arg) =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');

            if (this.shouldSilence(message)) {
                return;
            }

            if (!this.shouldShow(level)) {
                return;
            }

            const icon = this.getIcon(level);
            const method = level === 'INFO' ? 'log' : level.toLowerCase();
            this.originalConsole[method](icon, ...args);
        }

        shouldSilence(message) {
            return this.config.silentPatterns.some((pattern) => message.includes(pattern));
        }

        shouldShow(level) {
            return this.levels[level] <= this.levels[this.config.globalLevel];
        }

        getIcon(level) {
            const icons = {
                ERROR: 'X',
                WARN: '!',
                INFO: 'i',
                DEBUG: '>'
            };

            return icons[level] || '-';
        }

        defineHiddenGlobal(name, value) {
            if (typeof window === 'undefined') {
                return;
            }

            Object.defineProperty(window, name, {
                value,
                configurable: true,
                writable: true,
                enumerable: false
            });
        }

        toggleFiltering(enable = null) {
            if (enable === null) {
                this.config.enabled = !this.config.enabled;
            } else {
                this.config.enabled = Boolean(enable);
            }

            if (this.isClientMode) {
                return this.config.enabled;
            }

            const status = this.config.enabled ? 'ATIVADO' : 'DESATIVADO';
            const behavior = this.config.enabled ? 'filtrados' : 'mostrados';
            this.originalConsole.log(
                `%cLogger ${status} - logs serao ${behavior}`,
                'color: #ffffff; background: #1976d2; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
            );

            return this.config.enabled;
        }

        getStatus() {
            const status = {
                enabled: this.config.enabled,
                level: this.config.globalLevel,
                filteredPatterns: this.config.silentPatterns.length,
                mode: this.isClientMode ? 'client-stealth' : 'admin'
            };

            if (!this.isClientMode) {
                this.originalConsole.log('%cLogger status:', 'color: #1976d2; font-weight: bold;', status);
            }

            return status;
        }

        restoreConsole() {
            console.log = this.originalConsole.log;
            console.warn = this.originalConsole.warn;
            console.error = this.originalConsole.error;
            console.info = this.originalConsole.info;
            console.debug = this.originalConsole.debug;

            if (!this.isClientMode) {
                this.originalConsole.log(
                    '%cConsole original restaurado',
                    'color: #ffffff; background: #d32f2f; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
                );
            }
        }

        registerLoggerCommands() {
            const api = {
                toggle: (enable = null) => this.toggleFiltering(enable),
                on: () => this.toggleFiltering(true),
                off: () => this.toggleFiltering(false),
                status: () => this.getStatus(),
                restore: () => this.restoreConsole(),
                instance: this
            };

            this.defineHiddenGlobal('__esiLogger', api);

            const debugNamespace = window.__esiDebug && typeof window.__esiDebug === 'object'
                ? { ...window.__esiDebug, logger: api }
                : { logger: api };

            this.defineHiddenGlobal('__esiDebug', debugNamespace);
            this.defineHiddenGlobal('toggleLogger', api.toggle);
            this.defineHiddenGlobal('loggerOn', api.on);
            this.defineHiddenGlobal('loggerOff', api.off);
            this.defineHiddenGlobal('getLoggerStatus', api.status);
            this.defineHiddenGlobal('restoreOriginalConsole', api.restore);
        }

        showLoggerCommands() {
            setTimeout(() => {
                this.originalConsole.log(
                    '%cFILTRO DE LOGS ATIVADO',
                    'color: #ffffff; background: #388e3c; padding: 3px 5px; border-radius: 4px; font-size: 14px;'
                );
                this.originalConsole.log('%cComandos disponiveis:', 'color: #1976d2; font-weight: bold;');
                this.originalConsole.log('   - toggleLogger()       - Alternar filtro de logs');
                this.originalConsole.log('   - loggerOn()           - Ativar filtro');
                this.originalConsole.log('   - loggerOff()          - Desativar filtro (mostrar tudo)');
                this.originalConsole.log('   - getLoggerStatus()    - Ver status atual');
                this.originalConsole.log('   - restoreOriginalConsole() - Remover filtros completamente');
                this.originalConsole.log('   - __esiLogger.status() - API discreta');
                this.originalConsole.log('');
            }, 100);
        }
    }

    return new SmartLogger(appConfig);
}
