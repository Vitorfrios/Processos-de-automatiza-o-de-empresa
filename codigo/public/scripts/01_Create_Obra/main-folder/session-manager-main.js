/**
 * session-manager-main.js - GERENCIADOR DE SESSAO
 * Controla sessoes existentes e carregamento de obras
 */

import { loadObrasFromServer } from '../data/adapters/obra-adapter-folder/obra-data-loader.js'
import { isClientMode } from '../core/config.js'
import { getSessionObrasRuntimeData } from '../core/runtime-data.js'

/**
 * Verifica e carrega sessao existente
 */
export async function checkAndLoadExistingSession() {
    try {
        console.log('[SESSION] Verificando se ha sessao com obras salvas...')

        const sessionData = await getSessionObrasRuntimeData()
        let obraIds = []

        if (sessionData?.obras && Array.isArray(sessionData.obras)) {
            obraIds = sessionData.obras
        } else if (sessionData?.sessions?.session_active?.obras) {
            obraIds = sessionData.sessions.session_active.obras
        }

        console.log(`[SESSION] Sessao encontrada com ${obraIds.length} obra(s):`, obraIds)

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
            console.log('[SESSION] Carregando obras existentes da sessao...')

            try {
                sessionStorage.setItem('session_active', 'true')
                console.log('[SESSION] Sessao ativada via sessionStorage')
            } catch (error) {
                console.error('[SESSION] Erro ao ativar sessao:', error)
            }

            const loadedCount = await loadObrasFromServer()
            console.log(`[SESSION] Sessao existente carregada automaticamente com ${loadedCount} obra(s)`)
            return loadedCount > 0
        }

        console.log('[SESSION] Nenhuma sessao com obras encontrada - sistema inicia vazio')
        return false
    } catch (error) {
        console.log('[SESSION] Nenhuma sessao ativa ou erro ao verificar:', error)
        return false
    }
}

/**
 * Verifica funcoes criticas do sistema
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

    console.log('[SESSION] Verificando funcoes criticas...')
    criticalFunctions.forEach((funcName) => {
        if (typeof window[funcName] !== 'function') {
            console.error(`[SESSION] CRITICO: ${funcName} nao esta disponivel globalmente`)
        } else {
            console.log(`[SESSION] ${funcName} disponivel globalmente`)
        }
    })
}
