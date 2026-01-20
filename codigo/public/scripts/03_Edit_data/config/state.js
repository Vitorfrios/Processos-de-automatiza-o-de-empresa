// scripts/03_Edit_data/state.js
// Estado global do sistema

import { showError } from './ui.js';

export let systemData = {
    constants: {},
    machines: [],
    materials: {},
    empresas: [],
    banco_acessorios: {},
    dutos: [],
    tubos: [] 
};

export let originalData = {};
export let pendingChanges = new Set();
export let currentEditItem = null;
export let currentEditType = null;

// Variável interna para gerenciar o índice da máquina atual
let _currentMachineIndex = null;

// Exportar para acesso global
window.systemData = systemData;

export function updateSystemData(newData) {
    systemData = {
        constants: newData.constants || {},
        machines: Array.isArray(newData.machines) ? newData.machines : [],
        materials: newData.materials || {},
        empresas: Array.isArray(newData.empresas) ? newData.empresas : [],
        banco_acessorios: newData.banco_acessorios || {},
        dutos: Array.isArray(newData.dutos) ? newData.dutos : [],
        tubos: Array.isArray(newData.tubos) ? newData.tubos : []  // ADICIONADO
    };
    
    // Manter referência global
    window.systemData = systemData;
    originalData = JSON.parse(JSON.stringify(systemData));
}

export function updateOriginalData(newData) {
    originalData = JSON.parse(JSON.stringify(newData));
}

// Funções para gerenciar currentMachineIndex
export function getCurrentMachineIndex() {
    return _currentMachineIndex;
}

export function setCurrentMachineIndex(index) {
    _currentMachineIndex = index;
}

export function clearCurrentMachineIndex() {
    _currentMachineIndex = null;
}

export function addPendingChange(type) {
    pendingChanges.add(type);
    updateSaveButton();
}

export function clearPendingChanges() {
    pendingChanges.clear();
    updateSaveButton();
}

export function updateSaveButton() {
    const saveBtn = document.querySelector('.btn-success[onclick*="saveData"]');
    if (!saveBtn) return;
    
    if (pendingChanges.size > 0) {
        saveBtn.innerHTML = '<i class="icon-save"></i> Salvar (' + pendingChanges.size + ')';
        saveBtn.classList.add('has-changes');
    } else {
        saveBtn.innerHTML = '<i class="icon-save"></i> Salvar Tudo';
        saveBtn.classList.remove('has-changes');
    }
}

// Função auxiliar para mostrar erro detalhado
function showValidationError(context, message, data = null) {
    const fullMessage = `[${context}] ${message}`;
    console.error('❌ ' + fullMessage, data || '');
    showError(fullMessage);
    return false;
}

// Versão debug da validação
export function validateDataDebug() {
    console.group('🔍 VALIDAÇÃO DE DETALHADA');
    console.log('Iniciando validação de dados...');
    
    try {
        // Validar constantes
        console.log('📋 Validando constantes...');
        for (const [key, constant] of Object.entries(systemData.constants)) {
            if (typeof constant !== 'object' || constant === null) {
                return showValidationError('Constantes', `Estrutura inválida para constante "${key}"`, constant);
            }
            
            if (typeof constant.value !== 'number' || isNaN(constant.value)) {
                return showValidationError('Constantes', `Valor inválido para constante "${key}": ${constant.value}`, constant);
            }
        }
        console.log('✅ Constantes OK');
        
        // Validar máquinas
        console.log('⚙️ Validando máquinas...');
        for (const [index, machine] of systemData.machines.entries()) {
            if (!machine.type || typeof machine.type !== 'string') {
                return showValidationError('Máquinas', `Máquina ${index}: Tipo inválido ou não especificado`, machine);
            }
            
            // Validar valores base
            if (machine.baseValues) {
                for (const [key, value] of Object.entries(machine.baseValues)) {
                    if (typeof value !== 'number' || isNaN(value)) {
                        return showValidationError('Máquinas', `Máquina "${machine.type}": Valor base inválido para "${key}": ${value}`, machine);
                    }
                }
            }
        }
        console.log('✅ Máquinas OK');
        
        // Validar materiais
        console.log('📦 Validando materiais...');
        for (const [key, material] of Object.entries(systemData.materials)) {
            if (typeof material !== 'object' || material === null) {
                return showValidationError('Materiais', `Estrutura inválida para material "${key}"`, material);
            }
            
            if (typeof material.value !== 'number' || isNaN(material.value) || material.value < 0) {
                return showValidationError('Materiais', `Preço inválido para material "${key}": ${material.value}`, material);
            }
        }
        console.log('✅ Materiais OK');
        
        // Validar empresas
        console.log('🏢 Validando empresas...');
        for (const [index, empresa] of systemData.empresas.entries()) {
            if (typeof empresa !== 'object' || empresa === null) {
                return showValidationError('Empresas', `Empresa ${index}: Estrutura inválida`, empresa);
            }
            
            const sigla = Object.keys(empresa)[0];
            if (!sigla || typeof sigla !== 'string' || sigla.trim() === '') {
                return showValidationError('Empresas', `Empresa ${index}: Sigla inválida: "${sigla}"`, empresa);
            }
        }
        console.log('✅ Empresas OK');
        
        // Validar banco_acessorios
        console.log('🔧 Validando acessorios...');
        if (systemData.banco_acessorios && typeof systemData.banco_acessorios === 'object') {
            for (const [id, acessorio] of Object.entries(systemData.banco_acessorios)) {
                console.log(`  Validando acessorio ${id}...`);
                
                if (typeof acessorio !== 'object' || acessorio === null) {
                    return showValidationError('Acessorios', `ID ${id}: Estrutura inválida`, acessorio);
                }
                
                if (!acessorio.codigo || typeof acessorio.codigo !== 'string') {
                    return showValidationError('Acessorios', `ID ${id}: Código inválido: "${acessorio.codigo}"`, acessorio);
                }
                
                if (!acessorio.descricao || typeof acessorio.descricao !== 'string') {
                    return showValidationError('Acessorios', `ID ${id}: Descrição inválida: "${acessorio.descricao}"`, acessorio);
                }
                
                // Validar valores_padrao
                if (acessorio.valores_padrao && typeof acessorio.valores_padrao === 'object') {
                    for (const [tamanho, valor] of Object.entries(acessorio.valores_padrao)) {
                        if (typeof valor !== 'number' || isNaN(valor)) {
                            return showValidationError('Acessorios', `Acessorio "${acessorio.codigo}": Valor inválido para tamanho "${tamanho}": ${valor}`, {tamanho, valor});
                        }
                    }
                }
            }
        }
        console.log('✅ Acessorios OK');
        
        // Validar dutos
        console.log('📏 Validando dutos...');
        console.log('Dutos encontrados:', systemData.dutos?.length || 0);
        
        if (Array.isArray(systemData.dutos)) {
            for (const [index, duto] of systemData.dutos.entries()) {
                console.log(`  Validando duto ${index}...`, duto);
                
                if (typeof duto !== 'object' || duto === null) {
                    return showValidationError('Dutos', `Duto ${index}: Estrutura inválida`, duto);
                }
                
                if (!duto.type || typeof duto.type !== 'string') {
                    return showValidationError('Dutos', `Duto ${index}: Tipo inválido: "${duto.type}"`, duto);
                }
                
                console.log(`  Valor do duto ${index} (${duto.type}):`, duto.valor, 'Tipo:', typeof duto.valor);
                
                if (typeof duto.valor !== 'number' || isNaN(duto.valor)) {
                    return showValidationError('Dutos', `Duto "${duto.type}": Valor inválido: ${duto.valor} (tipo: ${typeof duto.valor})`, duto);
                }
                
                if (duto.descricao && typeof duto.descricao !== 'string') {
                    return showValidationError('Dutos', `Duto "${duto.type}": Descrição inválida: "${duto.descricao}"`, duto);
                }
                
                // Validar opcionais se existirem
                if (Array.isArray(duto.opcionais)) {
                    console.log(`    Duto ${index} tem ${duto.opcionais.length} opcionais`);
                    for (const [opcIndex, opcional] of duto.opcionais.entries()) {
                        if (typeof opcional !== 'object' || opcional === null) {
                            return showValidationError('Dutos', `Duto "${duto.type}": Opcional ${opcIndex} estrutura inválida`, opcional);
                        }
                        
                        if (!opcional.nome || typeof opcional.nome !== 'string') {
                            return showValidationError('Dutos', `Duto "${duto.type}": Opcional ${opcIndex} nome inválido: "${opcional.nome}"`, opcional);
                        }
                        
                        console.log(`    Opcional ${opcIndex} (${opcional.nome}) valor:`, opcional.value, 'Tipo:', typeof opcional.value);
                        
                        if (typeof opcional.value !== 'number' || isNaN(opcional.value)) {
                            return showValidationError('Dutos', `Duto "${duto.type}": Opcional "${opcional.nome}" valor inválido: ${opcional.value} (tipo: ${typeof opcional.value})`, opcional);
                        }
                        
                        if (opcional.descricao && typeof opcional.descricao !== 'string') {
                            return showValidationError('Dutos', `Duto "${duto.type}": Opcional "${opcional.nome}" descrição inválida: "${opcional.descricao}"`, opcional);
                        }
                    }
                }
            }
        }
        console.log('✅ Dutos OK');
        
        // ADICIONADO: Validar tubos
        console.log('📏 Validando tubos...');
        console.log('Tubos encontrados:', systemData.tubos?.length || 0);
        
        if (Array.isArray(systemData.tubos)) {
            for (const [index, tubo] of systemData.tubos.entries()) {
                console.log(`  Validando tubo ${index}...`, tubo);
                
                if (typeof tubo !== 'object' || tubo === null) {
                    return showValidationError('Tubos', `Tubo ${index}: Estrutura inválida`, tubo);
                }
                
                if (!tubo.polegadas || typeof tubo.polegadas !== 'string') {
                    return showValidationError('Tubos', `Tubo ${index}: Polegadas inválidas: "${tubo.polegadas}"`, tubo);
                }
                
                console.log(`  Polegadas do tubo ${index}:`, tubo.polegadas, 'Tipo:', typeof tubo.polegadas);
                console.log(`  Milímetros do tubo ${index}:`, tubo.mm, 'Tipo:', typeof tubo.mm);
                console.log(`  Valor do tubo ${index}:`, tubo.valor, 'Tipo:', typeof tubo.valor);
                
                // Validar mm (pode ser string ou number)
                if (tubo.mm !== undefined && typeof tubo.mm !== 'number' && typeof tubo.mm !== 'string') {
                    return showValidationError('Tubos', `Tubo "${tubo.polegadas}": Milímetros inválidos: ${tubo.mm} (tipo: ${typeof tubo.mm})`, tubo);
                }
                
                // Validar valor (pode ser string ou number)
                if (tubo.valor !== undefined && typeof tubo.valor !== 'number' && typeof tubo.valor !== 'string') {
                    return showValidationError('Tubos', `Tubo "${tubo.polegadas}": Valor inválido: ${tubo.valor} (tipo: ${typeof tubo.valor})`, tubo);
                }
                
                if (tubo.descricao && typeof tubo.descricao !== 'string') {
                    return showValidationError('Tubos', `Tubo "${tubo.polegadas}": Descrição inválida: "${tubo.descricao}"`, tubo);
                }
            }
        }
        console.log('✅ Tubos OK');
        
        console.log('🎉 Validação concluída com sucesso!');
        console.groupEnd();
        return true;
        
    } catch (error) {
        console.error('❌ Erro na validação:', error);
        showError(`Erro na validação: ${error.message}`);
        console.groupEnd();
        return false;
    }
}

// Função para limpar e normalizar dados
export function normalizeSystemData() {
    console.log('🔄 Normalizando dados do sistema...');
    let changes = 0;
    
    // Normalizar dutos
    if (Array.isArray(systemData.dutos)) {
        systemData.dutos.forEach((duto, index) => {
            // Garantir que type é string
            if (typeof duto.type !== 'string') {
                console.warn(`Normalizando duto ${index}: type "${duto.type}" -> string`);
                duto.type = String(duto.type || 'Duto sem nome');
                changes++;
            }
            
            // Garantir que valor é número
            if (typeof duto.valor !== 'number' || isNaN(duto.valor)) {
                console.warn(`Normalizando duto ${index} (${duto.type}): valor "${duto.valor}" -> 0`);
                duto.valor = parseFloat(duto.valor) || 0;
                changes++;
            }
            
            // Normalizar opcionais
            if (duto.opcionais) {
                if (!Array.isArray(duto.opcionais)) {
                    console.warn(`Normalizando duto ${index}: opcionais não é array`);
                    duto.opcionais = [];
                    changes++;
                } else {
                    duto.opcionais.forEach((opcional, opcIndex) => {
                        if (typeof opcional.value !== 'number' || isNaN(opcional.value)) {
                            console.warn(`Normalizando opcional ${opcIndex} do duto ${index}: valor "${opcional.value}" -> 0`);
                            opcional.value = parseFloat(opcional.value) || 0;
                            changes++;
                        }
                    });
                }
            }
        });
    }
    
    // Normalizar acessorios
    if (systemData.banco_acessorios && typeof systemData.banco_acessorios === 'object') {
        Object.entries(systemData.banco_acessorios).forEach(([id, acessorio]) => {
            // Garantir código string
            if (typeof acessorio.codigo !== 'string') {
                console.warn(`Normalizando acessorio ${id}: codigo "${acessorio.codigo}" -> string`);
                acessorio.codigo = String(acessorio.codigo || `EQ${id.slice(-3)}`);
                changes++;
            }
            
            // Garantir descrição string
            if (typeof acessorio.descricao !== 'string') {
                console.warn(`Normalizando acessorio ${id}: descricao "${acessorio.descricao}" -> string`);
                acessorio.descricao = String(acessorio.descricao || 'Acessorio sem descrição');
                changes++;
            }
            
            // Normalizar valores_padrao
            if (acessorio.valores_padrao && typeof acessorio.valores_padrao === 'object') {
                Object.entries(acessorio.valores_padrao).forEach(([tamanho, valor]) => {
                    if (typeof valor !== 'number' || isNaN(valor)) {
                        console.warn(`Normalizando acessorio ${id} tamanho ${tamanho}: valor "${valor}" -> 0`);
                        acessorio.valores_padrao[tamanho] = parseFloat(valor) || 0;
                        changes++;
                    }
                });
            }
        });
    }
    
    // ADICIONADO: Normalizar tubos
    if (Array.isArray(systemData.tubos)) {
        systemData.tubos.forEach((tubo, index) => {
            // Garantir que polegadas é string
            if (typeof tubo.polegadas !== 'string') {
                console.warn(`Normalizando tubo ${index}: polegadas "${tubo.polegadas}" -> string`);
                tubo.polegadas = String(tubo.polegadas || '');
                changes++;
            }
            
            // Garantir que mm é número
            if (typeof tubo.mm !== 'number' || isNaN(tubo.mm)) {
                console.warn(`Normalizando tubo ${index} (${tubo.polegadas}): mm "${tubo.mm}" -> 0`);
                tubo.mm = parseFloat(tubo.mm) || 0;
                changes++;
            }
            
            // Garantir que valor é número
            if (typeof tubo.valor !== 'number' || isNaN(tubo.valor)) {
                console.warn(`Normalizando tubo ${index} (${tubo.polegadas}): valor "${tubo.valor}" -> 0`);
                tubo.valor = parseFloat(tubo.valor) || 0;
                changes++;
            }
            
            // Garantir que descrição é string se existir
            if (tubo.descricao && typeof tubo.descricao !== 'string') {
                console.warn(`Normalizando tubo ${index} (${tubo.polegadas}): descricao "${tubo.descricao}" -> string`);
                tubo.descricao = String(tubo.descricao || '');
                changes++;
            }
        });
    }
    
    if (changes > 0) {
        console.log(`✅ ${changes} alterações de normalização aplicadas.`);
        // Atualizar referências globais
        window.systemData = systemData;
        return true;
    }
    
    return false;
}

// Mantém a função original para compatibilidade
export function validateData() {
    return validateDataDebug();
}

// Função para obter tubos ordenados por polegadas
export function getSortedTubos() {
    if (!Array.isArray(systemData.tubos)) return [];
    
    // Converter polegadas para número para ordenação
    const parsePolegadas = (polegadas) => {
        if (!polegadas) return 0;
        try {
            let str = polegadas.toString().trim();
            str = str.replace(/["]/g, '');
            
            // Se contém espaço e fração (ex: "1 1/4")
            if (str.includes(' ') && str.includes('/')) {
                const parts = str.split(' ');
                if (parts.length === 2) {
                    const integer = parseFloat(parts[0]) || 0;
                    const fractionParts = parts[1].split('/');
                    if (fractionParts.length === 2) {
                        const numerator = parseFloat(fractionParts[0]) || 0;
                        const denominator = parseFloat(fractionParts[1]) || 1;
                        return integer + (numerator / denominator);
                    }
                }
            }
            
            // Se é apenas fração (ex: "1/2")
            if (str.includes('/')) {
                const fractionParts = str.split('/');
                if (fractionParts.length === 2) {
                    const numerator = parseFloat(fractionParts[0]) || 0;
                    const denominator = parseFloat(fractionParts[1]) || 1;
                    return numerator / denominator;
                }
            }
            
            // Se é número decimal
            return parseFloat(str) || 0;
        } catch (e) {
            console.warn('Erro ao converter polegadas:', polegadas, e);
            return 0;
        }
    };
    
    return [...systemData.tubos].sort((a, b) => {
        const aVal = parsePolegadas(a.polegadas);
        const bVal = parsePolegadas(b.polegadas);
        return aVal - bVal;
    });
}

// Função para encontrar tubo por polegadas
export function findTuboByPolegadas(polegadas) {
    if (!Array.isArray(systemData.tubos)) return null;
    return systemData.tubos.find(t => t.polegadas === polegadas);
}

// Exportar funções globalmente
window.validateData = validateDataDebug; // Usar versão debug
window.validateDataDebug = validateDataDebug;
window.normalizeSystemData = normalizeSystemData;
window.validateDataOriginal = validateData; // Manter original se necessário
window.getSortedTubos = getSortedTubos;
window.findTuboByPolegadas = findTuboByPolegadas;