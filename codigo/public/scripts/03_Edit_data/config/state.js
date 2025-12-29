// scripts/03_Edit_data/state.js
// Estado global do sistema

import { showError } from './ui.js';

export let systemData = {
    constants: {},
    machines: [],
    materials: {},
    empresas: [],
    banco_equipamentos: {},
    dutos: []
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
        banco_equipamentos: newData.banco_equipamentos || {},
        dutos: Array.isArray(newData.dutos) ? newData.dutos : []
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
        
        // Validar banco_equipamentos
        console.log('🔧 Validando equipamentos...');
        if (systemData.banco_equipamentos && typeof systemData.banco_equipamentos === 'object') {
            for (const [id, equipamento] of Object.entries(systemData.banco_equipamentos)) {
                console.log(`  Validando equipamento ${id}...`);
                
                if (typeof equipamento !== 'object' || equipamento === null) {
                    return showValidationError('Equipamentos', `ID ${id}: Estrutura inválida`, equipamento);
                }
                
                if (!equipamento.codigo || typeof equipamento.codigo !== 'string') {
                    return showValidationError('Equipamentos', `ID ${id}: Código inválido: "${equipamento.codigo}"`, equipamento);
                }
                
                if (!equipamento.descricao || typeof equipamento.descricao !== 'string') {
                    return showValidationError('Equipamentos', `ID ${id}: Descrição inválida: "${equipamento.descricao}"`, equipamento);
                }
                
                // Validar valores_padrao
                if (equipamento.valores_padrao && typeof equipamento.valores_padrao === 'object') {
                    for (const [tamanho, valor] of Object.entries(equipamento.valores_padrao)) {
                        if (typeof valor !== 'number' || isNaN(valor)) {
                            return showValidationError('Equipamentos', `Equipamento "${equipamento.codigo}": Valor inválido para tamanho "${tamanho}": ${valor}`, {tamanho, valor});
                        }
                    }
                }
            }
        }
        console.log('✅ Equipamentos OK');
        
        // Validar dutos - VERIFICAR AQUI PRIMEIRO
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

// Mantém a função original para compatibilidade
export function validateData() {
    return validateDataDebug();
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
    
    // Normalizar equipamentos
    if (systemData.banco_equipamentos && typeof systemData.banco_equipamentos === 'object') {
        Object.entries(systemData.banco_equipamentos).forEach(([id, equipamento]) => {
            // Garantir código string
            if (typeof equipamento.codigo !== 'string') {
                console.warn(`Normalizando equipamento ${id}: codigo "${equipamento.codigo}" -> string`);
                equipamento.codigo = String(equipamento.codigo || `EQ${id.slice(-3)}`);
                changes++;
            }
            
            // Garantir descrição string
            if (typeof equipamento.descricao !== 'string') {
                console.warn(`Normalizando equipamento ${id}: descricao "${equipamento.descricao}" -> string`);
                equipamento.descricao = String(equipamento.descricao || 'Equipamento sem descrição');
                changes++;
            }
            
            // Normalizar valores_padrao
            if (equipamento.valores_padrao && typeof equipamento.valores_padrao === 'object') {
                Object.entries(equipamento.valores_padrao).forEach(([tamanho, valor]) => {
                    if (typeof valor !== 'number' || isNaN(valor)) {
                        console.warn(`Normalizando equipamento ${id} tamanho ${tamanho}: valor "${valor}" -> 0`);
                        equipamento.valores_padrao[tamanho] = parseFloat(valor) || 0;
                        changes++;
                    }
                });
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

// Exportar funções globalmente
window.validateData = validateDataDebug; // Usar versão debug
window.validateDataDebug = validateDataDebug;
window.normalizeSystemData = normalizeSystemData;
window.validateDataOriginal = validateData; // Manter original se necessário