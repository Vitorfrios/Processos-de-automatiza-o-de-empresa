/**
 * session-manager-main.js - GERENCIADOR DE SESSÃO
 * Controla sessões existentes e carregamento de obras
 */

import { loadObrasFromServer } from '../data/adapters/obra-adapter-folder/obra-data-loader.js'
import { isClientMode } from '../core/config.js'
import { getSessionObrasRuntimeData } from '../core/runtime-data.js'

/**
 * Verifica e carrega sessão existente
 */
export async function checkAndLoadExistingSession() {
    try {
        console.log('[SESSION] Verificando se há sessão com obras salvas...')

        const sessionData = await getSessionObrasRuntimeData()
        let obraIds = []

        if (sessionData?.obras && Array.isArray(sessionData.obras)) {
            obraIds = sessionData.obras
        } else if (sessionData?.sessions?.session_active?.obras) {
            obraIds = sessionData.sessions.session_active.obras
        }

        console.log(`[SESSION] Sessão encontrada com ${obraIds.length} obra(s):`, obraIds)

        if (isClientMode()) {
            console.log('[SESSION] Modo client ativo - carregando todas as obras da empresa autenticada')
            const loadedCount = await loadObrasFromServer()

            if (loadedCount > 0) {
                console.log(`[SESSION] ${loadedCount} obra(s) da empresa carregadas automaticamente`)
                return true
            }

            console.log('[SESSION] Nenhuma obra encontrada para a empresa autenticada')
            return false
        }

        if (obraIds.length > 0) {
            console.log('[SESSION] Carregando obras existentes da sessão...')

            try {
                sessionStorage.setItem('session_active', 'true')
                console.log('[SESSION] Sessão ativada via sessionStorage')
            } catch (error) {
                console.error('[SESSION] Erro ao ativar sessão:', error)
            }

            const loadedCount = await loadObrasFromServer()
            console.log(`[SESSION] Sessão existente carregada automaticamente com ${loadedCount} obra(s)`)
            return loadedCount > 0
        }

        console.log('[SESSION] Nenhuma sessão com obras encontrada - sistema inicia vazio')
        return false
    } catch (error) {
        console.log('[SESSION] Nenhuma sessão ativa ou erro ao verificar:', error)
        return false
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
    ]

    console.log('[SESSION] Verificando funções críticas...')
    criticalFunctions.forEach((funcName) => {
        if (typeof window[funcName] !== 'function') {
            console.error(`[SESSION] CRÍTICO: ${funcName} não está disponível globalmente`)
        } else {
            console.log(`[SESSION] ${funcName} disponível globalmente`)
        }
    })
}
