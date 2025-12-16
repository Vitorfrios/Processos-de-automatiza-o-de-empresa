// scripts/03_Edit_data/state.js
// Estado global do sistema

import { showError } from './ui.js';

export let systemData = {
    constants: {},
    machines: [],
    materials: {},
    empresas: []
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
        empresas: Array.isArray(newData.empresas) ? newData.empresas : []
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

export function validateData() {
    try {
        // Validar constantes (novo formato)
        for (const [key, constant] of Object.entries(systemData.constants)) {
            if (typeof constant !== 'object' || constant === null) {
                showError(`Estrutura inválida para constante "${key}"`);
                return false;
            }
            
            if (typeof constant.value !== 'number' || isNaN(constant.value)) {
                showError(`Valor inválido para constante "${key}": ${constant.value}`);
                return false;
            }
            
            if (constant.description && typeof constant.description !== 'string') {
                showError(`Descrição inválida para constante "${key}"`);
                return false;
            }
        }
        
        // Validar máquinas
        for (const machine of systemData.machines) {
            if (!machine.type || typeof machine.type !== 'string') {
                showError('Tipo de máquina inválido ou não especificado');
                return false;
            }
            
            // Validar valores base
            if (machine.baseValues) {
                for (const [key, value] of Object.entries(machine.baseValues)) {
                    if (typeof value !== 'number' || isNaN(value)) {
                        showError(`Valor base inválido para "${key}" na máquina "${machine.type}": ${value}`);
                        return false;
                    }
                }
            }
        }
        
        // Validar materiais (novo formato)
        for (const [key, material] of Object.entries(systemData.materials)) {
            if (typeof material !== 'object' || material === null) {
                showError(`Estrutura inválida para material "${key}"`);
                return false;
            }
            
            if (typeof material.value !== 'number' || isNaN(material.value) || material.value < 0) {
                showError(`Preço inválido para material "${key}": ${material.value}`);
                return false;
            }
            
            if (!material.unit || typeof material.unit !== 'string') {
                showError(`Unidade inválida para material "${key}"`);
                return false;
            }
            
            if (material.description && typeof material.description !== 'string') {
                showError(`Descrição inválida para material "${key}"`);
                return false;
            }
        }
        
        // Validar empresas
        for (const empresa of systemData.empresas) {
            if (typeof empresa !== 'object' || empresa === null) {
                showError('Estrutura de empresa inválida');
                return false;
            }
            
            const sigla = Object.keys(empresa)[0];
            if (!sigla || typeof sigla !== 'string' || sigla.trim() === '') {
                showError('Sigla de empresa inválida');
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Erro na validação:', error);
        showError(`Erro na validação: ${error.message}`);
        return false;
    }
}