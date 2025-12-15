// scripts/03_Edit_data/state.js
// Estado global do sistema

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
export let currentMachineIndex = null;

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
        // Validar constantes
        for (const [key, value] of Object.entries(systemData.constants)) {
            if (typeof value !== 'number' || isNaN(value)) {
                showError(`Valor inválido para constante "${key}": ${value}`);
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
        
        // Validar materiais
        for (const [key, value] of Object.entries(systemData.materials)) {
            if (typeof value !== 'number' || isNaN(value) || value < 0) {
                showError(`Preço inválido para material "${key}": ${value}`);
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