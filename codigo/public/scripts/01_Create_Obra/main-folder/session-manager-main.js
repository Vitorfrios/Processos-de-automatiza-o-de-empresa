/**
 * session-manager-main.js - GERENCIADOR DE SESSÃO
 * 🎯 Controla sessões existentes e carregamento de obras
 */

// ✅ IMPORTAR COM CAMINHO CORRETO
import { loadObrasFromServer } from "../data/adapters/obra-adapter-folder/obra-data-loader.js";


/**
 * Verifica e carrega sessão existente
 */
export async function checkAndLoadExistingSession() {
  try {
    console.log("🔍 Verificando se há sessão com obras salvas...");
    
    const sessionResponse = await fetch('/api/session-obras');
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      
      let obraIds = [];
      
      if (sessionData.obras && Array.isArray(sessionData.obras)) {
        obraIds = sessionData.obras;
      } else if (sessionData.sessions && sessionData.sessions.session_active && sessionData.sessions.session_active.obras) {
        obraIds = sessionData.sessions.session_active.obras;
      }
      
      console.log(`📊 Sessão encontrada com ${obraIds.length} obras:`, obraIds);
      
      if (obraIds.length > 0) {
        console.log("🔄 Carregando obras existentes da sessão...");
        
        try {
          sessionStorage.setItem('session_active', 'true');
          console.log("✅ Sessão ativada via sessionStorage");
        } catch (error) {
          console.error("❌ Erro ao ativar sessão:", error);
        }
        
        await loadObrasFromServer();
        console.log("✅ Sessão existente carregada automaticamente");
        return true;
      }
    }
    
    console.log("📭 Nenhuma sessão com obras encontrada - sistema inicia vazio");
    return false;
    
  } catch (error) {
    console.log("📭 Nenhuma sessão ativa ou erro ao verificar:", error);
    return false;
  }
}

/**
 * Verifica funções críticas do sistema
 */
export function verifyCriticalFunctions() {
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
        'makeEditable',
        'obterDadosEmpresa'
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