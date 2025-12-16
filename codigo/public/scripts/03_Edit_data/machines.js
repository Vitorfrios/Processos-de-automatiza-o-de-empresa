// scripts/03_Edit_data/machines-main.js
// Arquivo principal que importa e organiza todos os módulos de máquinas

import { systemData, addPendingChange, getCurrentMachineIndex, setCurrentMachineIndex, clearCurrentMachineIndex } from './state.js';
import { escapeHtml, showError, showInfo, showWarning, showSuccess, showConfirmation } from './ui.js';

// Importar módulos
import {
    loadMachines,
    populateMachineFilter,
    filterMachines,
    addMachine,
    editMachine,
    closeMachineDetail,
    saveMachineChanges,
    deleteMachine,
    updateMachineField,
    ensureTRSuffix,
    selectTextInLabel
} from './machines/machines-core.js';

import {
    updateImposto,
    updateImpostoKey,
    removeImposto,
    addImposto
} from './machines/machines-impostos.js';

import {
    addConfiguracao,
    updateConfiguracao,
    removeConfiguracao,
    addBaseValue,
    updateBaseValueKey,
    updateBaseValue,
    removeBaseValue
} from './machines/machines-configs.js';

import {
    addOption,
    addOptionValue,
    updateOption,
    updateOptionValue,
    removeOption,
    syncOptionName,
    updateOptionCapacityLabel
} from './machines/machines-options.js';

import {
    addVoltage,
    updateVoltage,
    removeVoltage
} from './machines/machines-voltages.js';

import {
    loadConfiguracoesHTML,
    loadBaseValuesHTML,
    loadOptionsHTML,
    loadVoltagesHTML
} from './machines/machines-render.js';

import {
    toggleSection,
    toggleOptionItem,
    saveSectionState,
    restoreSectionStates
} from './machines/machines-toggles.js';

// Exportar todas as funções
export {
    // Funções principais
    loadMachines,
    populateMachineFilter,
    filterMachines,
    addMachine,
    editMachine,
    closeMachineDetail,
    saveMachineChanges,
    deleteMachine,
    updateMachineField,
    ensureTRSuffix,
    selectTextInLabel,
    
    // Impostos
    updateImposto,
    updateImpostoKey,
    removeImposto,
    addImposto,
    
    // Configurações e valores base
    addConfiguracao,
    updateConfiguracao,
    removeConfiguracao,
    addBaseValue,
    updateBaseValueKey,
    updateBaseValue,
    removeBaseValue,
    
    // Opções
    addOption,
    addOptionValue,
    updateOption,
    updateOptionValue,
    removeOption,
    syncOptionName,
    updateOptionCapacityLabel,
    
    // Tensões
    addVoltage,
    updateVoltage,
    removeVoltage,
    
    // Renderização
    loadConfiguracoesHTML,
    loadBaseValuesHTML,
    loadOptionsHTML,
    loadVoltagesHTML,
    
    // Toggles
    toggleSection,
    toggleOptionItem,
    restoreSectionStates,
    saveSectionState
};

// Exportar funções para o objeto window
export function exposeToWindow() {
    window.loadMachines = loadMachines;
    window.populateMachineFilter = populateMachineFilter;
    window.filterMachines = filterMachines;
    window.addMachine = addMachine;
    window.editMachine = editMachine;
    window.closeMachineDetail = closeMachineDetail;
    window.updateMachineField = updateMachineField;
    window.updateImposto = updateImposto;
    window.updateImpostoKey = updateImpostoKey;
    window.removeImposto = removeImposto;
    window.addImposto = addImposto;
    window.addConfiguracao = addConfiguracao;
    window.updateConfiguracao = updateConfiguracao;
    window.removeConfiguracao = removeConfiguracao;
    window.addBaseValue = addBaseValue;
    window.updateBaseValueKey = updateBaseValueKey;
    window.updateBaseValue = updateBaseValue;
    window.removeBaseValue = removeBaseValue;
    window.addOption = addOption;
    window.addOptionValue = addOptionValue;
    window.updateOption = updateOption;
    window.updateOptionValue = updateOptionValue;
    window.removeOption = removeOption;
    window.addVoltage = addVoltage;
    window.updateVoltage = updateVoltage;
    window.removeVoltage = removeVoltage;
    window.saveMachineChanges = saveMachineChanges;
    window.deleteMachine = deleteMachine;
    window.toggleSection = toggleSection;
    window.toggleOptionItem = toggleOptionItem;
    window.restoreSectionStates = restoreSectionStates;
    window.syncOptionName = syncOptionName;
    window.updateOptionCapacityLabel = updateOptionCapacityLabel;
    
    // Funções de renderização (se necessário globalmente)
    window.loadConfiguracoesHTML = loadConfiguracoesHTML;
    window.loadBaseValuesHTML = loadBaseValuesHTML;
    window.loadOptionsHTML = loadOptionsHTML;
    window.loadVoltagesHTML = loadVoltagesHTML;
}

// Inicializar
exposeToWindow();

// Exportar também para uso em outros lugares
export default {
    loadMachines,
    populateMachineFilter,
    filterMachines,
    addMachine,
    editMachine,
    closeMachineDetail,
    saveMachineChanges,
    deleteMachine,
    updateMachineField,
    updateImposto,
    updateImpostoKey,
    removeImposto,
    addImposto,
    addConfiguracao,
    updateConfiguracao,
    removeConfiguracao,
    addBaseValue,
    updateBaseValueKey,
    updateBaseValue,
    removeBaseValue,
    addOption,
    addOptionValue,
    updateOption,
    updateOptionValue,
    removeOption,
    syncOptionName,
    updateOptionCapacityLabel,
    addVoltage,
    updateVoltage,
    removeVoltage,
    toggleSection,
    toggleOptionItem,
    restoreSectionStates,
    exposeToWindow
};