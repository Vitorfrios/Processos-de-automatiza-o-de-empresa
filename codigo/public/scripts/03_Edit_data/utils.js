// scripts/03_Edit_data/utils.js
// Utilitários gerais

import { escapeHtml } from './ui.js';
import { showError } from './ui.js';





export function exportToJSON() {
    try {
        const systemData = window.systemData || {};
        const dataStr = JSON.stringify(systemData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `sistema_dados_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        showSuccess('JSON exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar JSON:', error);
        showError('Erro ao exportar JSON.');
    }
}

export function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.constants || !importedData.machines || 
                !importedData.materials || !importedData.empresas) {
                throw new Error('Estrutura de dados inválida. Arquivo deve conter: constants, machines, materials, empresas');
            }
            
            if (typeof importedData.constants !== 'object') {
                throw new Error('constants deve ser um objeto');
            }
            if (!Array.isArray(importedData.machines)) {
                throw new Error('machines deve ser um array');
            }
            if (typeof importedData.materials !== 'object') {
                throw new Error('materials deve ser um objeto');
            }
            if (!Array.isArray(importedData.empresas)) {
                throw new Error('empresas deve ser um array');
            }
            
            window.systemData = importedData;
            
            window.dispatchEvent(new CustomEvent('dataImported', { 
                detail: importedData 
            }));
            
            showSuccess('Dados importados com sucesso!');
            
        } catch (error) {
            console.error('Erro ao importar JSON:', error);
            showError(`Erro ao importar JSON: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        showError('Erro ao ler o arquivo.');
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

export function formatJSON() {
    const editor = document.getElementById('jsonEditor');
    try {
        const parsed = JSON.parse(editor.value);
        editor.value = JSON.stringify(parsed, null, 2);
        updateJSONStatus('JSON formatado com sucesso', 'success');
    } catch (error) {
        updateJSONStatus(`Erro de formatação: ${error.message}`, 'error');
    }
}

export function validateJSON() {
    const editor = document.getElementById('jsonEditor');
    try {
        const parsed = JSON.parse(editor.value);
        
        const requiredKeys = ['constants', 'machines', 'materials', 'empresas'];
        const missingKeys = requiredKeys.filter(key => !(key in parsed));
        
        if (missingKeys.length > 0) {
            throw new Error(`Campos ausentes: ${missingKeys.join(', ')}`);
        }
        
        if (typeof parsed.constants !== 'object') {
            throw new Error('constants deve ser um objeto');
        }
        if (!Array.isArray(parsed.machines)) {
            throw new Error('machines deve ser um array');
        }
        if (typeof parsed.materials !== 'object') {
            throw new Error('materials deve ser um objeto');
        }
        if (!Array.isArray(parsed.empresas)) {
            throw new Error('empresas deve ser um array');
        }
        
        updateJSONStatus('✅ JSON válido e com estrutura correta', 'success');
        return true;
        
    } catch (error) {
        updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
        return false;
    }
}

function updateJSONStatus(message, type) {
    const status = document.getElementById('jsonStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = 'json-status-message';
    
    switch (type) {
        case 'success':
            status.classList.add('success');
            break;
        case 'error':
            status.classList.add('error');
            break;
        case 'info':
            status.classList.add('info');
            break;
        default:
            status.classList.add('info');
    }
}

// Exportar funções globalmente
window.exportToJSON = exportToJSON;
window.importFromJSON = importFromJSON;
window.formatJSON = formatJSON;
window.validateJSON = validateJSON;