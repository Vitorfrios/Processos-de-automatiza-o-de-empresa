/**
 * data/adapters/constants-adapter.js
 * Carrega constantes do sistema do arquivo JSON
 */

let constantsLoaded = false;
let constantsPromise = null;

export async function loadSystemConstantsFromJSON() {
    // Retornar promise existente se já estiver carregando
    if (constantsPromise) {
        return constantsPromise;
    }
    
    constantsPromise = new Promise(async (resolve, reject) => {
        try {
            console.log('📦 Carregando constantes do sistema do JSON...');
            
            const response = await fetch('/json/dados.json');
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // ✅ CORREÇÃO: As constantes estão dentro do objeto "constants"
            if (!data.constants) {
                throw new Error('Estrutura do JSON inválida: objeto "constants" não encontrado');
            }
            
            const constants = data.constants;
            
            // Disponibilizar globalmente (como na Página 1)
            window.systemConstants = constants;
            constantsLoaded = true;
            
            console.log('✅ Constantes do sistema carregadas do JSON:', Object.keys(constants).length, 'constantes');
            resolve(constants);
            
        } catch (error) {
            console.error('❌ Erro ao carregar constantes do JSON:', error);
            constantsPromise = null;
            reject(error);
        }
    });
    
    return constantsPromise;
}

/**
 * Verifica se as constantes já foram carregadas
 */
export function areConstantsLoaded() {
    return constantsLoaded && window.systemConstants && Object.keys(window.systemConstants).length > 0;
}

/**
 * Aguarda o carregamento das constantes
 */
export async function waitForConstants() {
    if (areConstantsLoaded()) {
        return window.systemConstants;
    }
    
    // Se já está carregando, esperar a promise existente
    if (constantsPromise) {
        return constantsPromise;
    }
    
    // Se não, iniciar o carregamento
    return loadSystemConstantsFromJSON();
}

/**
 * Valida se as constantes necessárias estão disponíveis
 */
export function validateRequiredConstants() {
    if (!areConstantsLoaded()) {
        console.error('❌ Constantes não carregadas');
        return false;
    }
    
    const requiredConstants = [
        'VARIAVEL_PD', 'VARIAVEL_PS', 'AUX_U_Value_Piso', 'AUX_Fator_Iluminacao',
        'AUX_Fs_Iluminacao', 'AUX_Fator_Conver_Painel', 'AUX_Fs_Paineis',
        'AUX_OCp_Csp', 'AUX_OCp_Clp', 'Densi_ar'
    ];
    
    const missing = requiredConstants.filter(constant => 
        window.systemConstants[constant] === undefined || window.systemConstants[constant] === null
    );
    
    if (missing.length > 0) {
        console.error('❌ Constantes necessárias faltando:', missing);
        return false;
    }
    
    console.log('✅ Todas as constantes necessárias estão disponíveis');
    return true;
}