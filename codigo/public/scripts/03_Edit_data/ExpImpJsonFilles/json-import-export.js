// json-import-export.js
import { showError, showSuccess, showWarning } from '../config/ui.js';
import {
    updateLineNumbers,
    updateJSONStatus,
    updateApplyButtonState,
    fileToBase64,
    validateJSONStructure
} from './json-editor.js';


// Função para exportar JSON
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

// Função para importar JSON
export function importFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validar estrutura básica
                const validation = validateJSONStructure(importedData);
                
                if (!validation.valid) {
                    throw new Error(validation.errors.join('; '));
                }
                
                // Armazenar em staging
                window.stagingData = importedData;
                window.hasPendingChanges = true;
                
                // Exibir no editor JSON Bruto
                const editor = document.getElementById('jsonEditor');
                if (editor) {
                    editor.value = JSON.stringify(importedData, null, 2);
                    updateLineNumbers();
                    switchTab('raw');
                }
                
                showWarning('JSON carregado na área de staging. Clique em "Aplicar JSON" para confirmar as alterações.');
                updateJSONStatus('JSON carregado em staging. Aguardando aplicação.', 'warning');
                updateApplyButtonState();
                
            } catch (error) {
                console.error('Erro ao importar JSON:', error);
                showError(`Erro ao importar JSON: ${error.message}`);
                updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
            }
        };
        
        reader.onerror = function() {
            showError('Erro ao ler o arquivo.');
        };
        
        reader.readAsText(file);
    };
    
    document.body.appendChild(input);
    input.click();
    
    setTimeout(() => {
        if (document.body.contains(input)) {
            document.body.removeChild(input);
        }
    }, 100);
}

// Função para importar Excel
export function importFromExcel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.style.display = 'none';
    
    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            showError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
            return;
        }
        
        showWarning('Convertendo Excel para JSON...');
        
        try {
            const base64File = await fileToBase64(file);
            
            const response = await fetch('/api/excel/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: file.name,
                    file: base64File
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erro na conversão: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Erro desconhecido na conversão');
            }
            
            // Armazenar em staging
            window.stagingData = result.data;
            window.hasPendingChanges = true;
            
            // Exibir no editor
            const editor = document.getElementById('jsonEditor');
            if (editor) {
                editor.value = JSON.stringify(result.data, null, 2);
                updateLineNumbers();
                switchTab('raw');
            }
            
            showSuccess('Excel convertido para JSON com sucesso!');
            updateJSONStatus('✅ Excel convertido. Dados em staging.', 'success');
            updateApplyButtonState();
            
        } catch (error) {
            console.error('Erro ao importar Excel:', error);
            showError(`Erro ao importar Excel: ${error.message}`);
            updateJSONStatus(`❌ Erro na conversão: ${error.message}`, 'error');
        }
    };
    
    document.body.appendChild(input);
    input.click();
    
    setTimeout(() => {
        if (document.body.contains(input)) {
            document.body.removeChild(input);
        }
    }, 100);
}

// Função para exportar Excel
export async function exportToExcel() {
    try {
        const systemData = window.systemData || {};
        
        const validation = validateJSONStructure(systemData);
        if (!validation.valid) {
            showError('Dados do sistema inválidos para exportação');
            return;
        }
        
        showWarning('Gerando arquivo Excel...');
        
        const response = await fetch('/api/excel/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(systemData)
        });
        
        if (!response.ok) {
            throw new Error(`Erro na geração: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro desconhecido na geração');
        }
        
        // Decodificar base64 e fazer download
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'sistema_export.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSuccess('Excel exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        showError(`Erro ao exportar Excel: ${error.message}`);
    }
}

// Função auxiliar para mudar de tab
function switchTab(tabName) {
    if (typeof window.switchTab === 'function') {
        window.switchTab(tabName);
    }
}

window.exportToJSON = exportToJSON;
window.importFromJSON = importFromJSON;
window.importFromExcel = importFromExcel;
window.exportToExcel = exportToExcel;