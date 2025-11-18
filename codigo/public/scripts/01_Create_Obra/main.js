/**
 * main.js - ARQUIVO PRINCIPAL COM LOGGER 100% EMBUTIDO
 * 🎯 Reduz logs em 90% - ZERO dependências externas
 */

// ✅ LOGGER 100% EMBUTIDO - SEM tentar carregar arquivos externos
(function() {
    'use strict';
    
    console.log('🔧 Iniciando sistema de logs automático...');
    
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
            this.originalConsole.log('✅ Sistema de logs automático ativado - 90% dos logs serão filtrados');
        }
        
        /**
         * 🎯 INTERCEPTA console.log GLOBALMENTE
         */
        interceptConsole() {
            const self = this;
            
            console.log = function(...args) {
                self.processLog('INFO', args);
            };
            
            console.info = function(...args) {
                self.processLog('INFO', args);
            };
            
            console.warn = function(...args) {
                self.processLog('WARN', args);
            };
            
            console.error = function(...args) {
                self.processLog('ERROR', args);
            };
            
            console.debug = function(...args) {
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
    }

    // 🎯 INICIALIZAR LOGGER IMEDIATAMENTE
    window.logger = new SmartLogger();

})();

// ✅ SEU CÓDIGO ORIGINAL CONTINUA A PARTIR DAQUI
window.systemConstants = null;
window.obraCounter = 0;
window.GeralCount = 0;

console.log("🚀 Variáveis globais inicializadas:", {
  systemConstants: window.systemConstants,
  obraCounter: window.obraCounter,
  GeralCount: window.GeralCount
});

// ✅ IMPORTAR DOS MÓDULOS PRINCIPAIS
import { initializeSystem } from './main-folder/system-init.js';
import { checkAndLoadExistingSession } from './main-folder/session-manager-main.js';
import { showServerOfflineMessage } from './main-folder/error-handler.js';

/**
 * Função de debug para verificar o estado final do sistema
 */
function finalSystemDebug() {
  console.log('=== DEBUG FINAL DO SISTEMA ===');
  console.log('- window.GeralCount:', window.GeralCount);
  console.log('- getGeralCount():', window.getGeralCount ? window.getGeralCount() : 'N/A');
  console.log('- Obras no DOM:', document.querySelectorAll('.obra-block').length);
  console.log('- Projetos no DOM:', document.querySelectorAll('.project-block').length);
  console.log('- Salas no DOM:', document.querySelectorAll('.room-block').length);
  console.log('- Módulos carregados:', !!window.modulesLoaded);
  console.log('- Constantes carregadas:', !!window.systemConstants);
  console.log('- Shutdown Manager:', !!window.shutdownManager);
  console.log('- Empresa Cadastro:', !!window.empresaCadastro);
  
  console.log('- Funções de toggle disponíveis:', {
    toggleSection: typeof window.toggleSection,
    toggleSubsection: typeof window.toggleSubsection,
    toggleObra: typeof window.toggleObra,
    toggleProject: typeof window.toggleProject,
    toggleRoom: typeof window.toggleRoom
  });
}

/**
 * Verifica se é necessário criar uma obra base
 */
async function verifyAndCreateBaseObra() {
  console.log("🔍 Verificando obras existentes...");
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const currentCount = window.getGeralCount ? window.getGeralCount() : 0;
  const obrasInDOM = document.querySelectorAll('.obra-block').length;
  
  console.log(`📊 Estado atual - GeralCount: ${currentCount}, Obras no DOM: ${obrasInDOM}`);
  
  if (obrasInDOM === 0 && currentCount === 0) {
    console.log("📭 Sistema iniciado vazio - aguardando ação do usuário");
    console.log("💡 Dica: Clique em 'Nova Obra' para começar");
  }
}

/**
 * Handler para erros de inicialização
 */
function handleInitializationError(error) {
  console.error("❌ ERRO na inicialização do sistema:", error);
  
  if (error.message.includes('Failed to fetch') || 
      error.message.includes('ERR_CONNECTION_REFUSED') ||
      error.message.includes('404') ||
      error.message.includes('Not Found') ||
      error.name === 'TypeError') {
    console.log("🔌 Servidor offline detectado - mostrando mensagem...");
    showServerOfflineMessage();
  } else {
    setTimeout(() => {
      console.log("🔄 Sistema em estado de espera");
      if (window.showSystemStatus) {
        window.showSystemStatus("Sistema carregado com avisos", "error");
      }
    }, 1000);
  }
}

/**
 * Mostra mensagem de status do sistema para usuário
 */
function showSystemStatusMessage(hasExistingSession) {
  setTimeout(() => {
    if (window.showSystemStatus) {
      const message = hasExistingSession 
        ? `Sessão carregada com ${document.querySelectorAll('.obra-block').length} obra(s)!` 
        : "Sistema carregado. Clique em 'Nova Obra' para começar.";
      window.showSystemStatus(message, "success");
    }
  }, 500);
}

/**
 * Verifica funções críticas do sistema
 */
function verifyCriticalFunctions() {
    const criticalFunctions = [
        'createEmptyObra',
        'createEmptyProject', 
        'createEmptyRoom',
        'populateObraData',
        'addNewObra',
        'addNewProjectToObra',
        'addNewRoom',
        'deleteObra',
        'deleteRoom',
        'calculateVazaoArAndThermalGains',
        'makeEditable'
        // REMOVIDO: 'obterDadosEmpresa' - essa função pode não existir ainda
    ];
    
    console.log('🔍 Verificando funções críticas...');
    criticalFunctions.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            console.error(`❌ CRÍTICO: ${funcName} não está disponível globalmente`);
        } else {
            console.log(`✅ ${funcName} disponível globalmente`);
        }
    });
}

/**
 * Inicialização principal do sistema
 */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Inicializando sistema...");
  
  try {
    // ✅ O LOGGER JÁ ESTÁ ATIVO (embutido no início do arquivo)
    // NÃO há mais tentativa de carregar logger externo!
    
    // ✅ Inicializar sistema completo
    await initializeSystem();
    
    // ✅ Verificar e carregar sessão existente
    console.log("🔍 Verificando sessão existente...");
    const hasExistingSession = await checkAndLoadExistingSession();
    
    if (!hasExistingSession) {
      console.log("📭 Nenhuma sessão existente - sistema começa vazio");
      console.log("💡 Dica: Clique em 'Nova Obra' para começar");
    }
    
    // ✅ Verificar obras existentes
    await verifyAndCreateBaseObra();
    
    console.log("✅ Sistema inicializado com sucesso - PRONTO PARA USO");
    
    // ✅ Mostrar status para usuário
    showSystemStatusMessage(hasExistingSession);
    
    // ✅ Debug final
    setTimeout(finalSystemDebug, 1000);
    
    // ✅ Verificar funções críticas após inicialização completa
    setTimeout(verifyCriticalFunctions, 2000);
    
  } catch (error) {
    handleInitializationError(error);
  }
});