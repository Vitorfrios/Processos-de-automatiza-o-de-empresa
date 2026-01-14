// json-import-export.js - Versão simplificada COM TUBOS

export function exportToJSON() {
    console.log('📤 Exportando JSON...');
    try {
        const systemData = window.systemData || {};
        console.log('📊 Dados para exportação:', {
            constants: Object.keys(systemData.constants || {}).length,
            machines: systemData.machines?.length || 0,
            materials: Object.keys(systemData.materials || {}).length,
            empresas: systemData.empresas?.length || 0,
            banco_equipamentos: Object.keys(systemData.banco_equipamentos || {}).length,
            dutos: systemData.dutos?.length || 0,
            tubos: systemData.tubos?.length || 0  // ✅ Adicionado tubos
        });
        
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
        
        if (window.showSuccess) {
            window.showSuccess('JSON exportado com sucesso!');
        } else {
            alert('JSON exportado com sucesso!');
        }
        
        console.log('✅ JSON exportado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao exportar JSON:', error);
        
        if (window.showError) {
            window.showError('Erro ao exportar JSON.');
        } else {
            alert('Erro ao exportar JSON.');
        }
    }
}

export function importFromJSON() {
    console.log('📥 Importando JSON...');
    
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
                console.log('📁 Arquivo selecionado:', file.name);
                
                const importedData = JSON.parse(e.target.result);
                
                // Validar estrutura COM TUBOS
                const requiredKeys = ['constants', 'machines', 'materials', 'empresas', 'banco_equipamentos', 'dutos', 'tubos'];
                const missingKeys = requiredKeys.filter(key => !(key in importedData));
                
                if (missingKeys.length > 0) {
                    throw new Error(`Campos ausentes: ${missingKeys.join(', ')}`);
                }
                
                console.log('✅ JSON válido:', {
                    constants: Object.keys(importedData.constants || {}).length,
                    machines: importedData.machines?.length || 0,
                    materials: Object.keys(importedData.materials || {}).length,
                    empresas: importedData.empresas?.length || 0,
                    banco_equipamentos: Object.keys(importedData.banco_equipamentos || {}).length,
                    dutos: importedData.dutos?.length || 0,
                    tubos: importedData.tubos?.length || 0  // ✅ Adicionado tubos
                });
                
                // Armazenar em staging
                window.stagingData = importedData;
                window.hasPendingChanges = true;
                
                // Exibir no editor
                const editor = document.getElementById('jsonEditor');
                if (editor) {
                    editor.value = JSON.stringify(importedData, null, 2);
                                        
                    if (window.switchTab) {
                        window.switchTab('raw');
                    }
                }
                
                if (window.showWarning) {
                    window.showWarning('JSON carregado na área de staging.');
                }
                
                if (window.updateJSONStatus) {
                    window.updateJSONStatus('JSON carregado em staging.', 'warning');
                }
                
                if (window.updateApplyButtonState) {
                    window.updateApplyButtonState();
                }
                
                console.log('✅ JSON importado para staging');
                
            } catch (error) {
                console.error('❌ Erro ao importar JSON:', error);
                
                if (window.showError) {
                    window.showError(`Erro ao importar JSON: ${error.message}`);
                } else {
                    alert(`Erro ao importar JSON: ${error.message}`);
                }
                
                if (window.updateJSONStatus) {
                    window.updateJSONStatus(`❌ JSON inválido: ${error.message}`, 'error');
                }
            }
        };
        
        reader.onerror = function() {
            console.error('❌ Erro ao ler o arquivo');
            if (window.showError) {
                window.showError('Erro ao ler o arquivo.');
            } else {
                alert('Erro ao ler o arquivo.');
            }
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

export function exportToExcel() {
    console.log('📤 Exportando Excel...');
    
    try {
        const systemData = window.systemData || {};
        
        // Validar dados COM TUBOS
        const requiredKeys = ['constants', 'machines', 'materials', 'empresas', 'banco_equipamentos', 'dutos', 'tubos'];
        const missingKeys = requiredKeys.filter(key => !(key in systemData));
        
        if (missingKeys.length > 0) {
            throw new Error(`Dados incompletos: ${missingKeys.join(', ')}`);
        }
        
        console.log('📊 Dados para exportação Excel:', {
            dutos: systemData.dutos?.length || 0,
            tubos: systemData.tubos?.length || 0  // ✅ Adicionado tubos
        });
        
        // Chamar API para gerar Excel
        fetch('/api/excel/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(systemData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                // Decodificar base64
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
                
                console.log('✅ Excel exportado com sucesso!');
                
                if (window.showSuccess) {
                    window.showSuccess('Excel exportado com sucesso!');
                } else {
                    alert('Excel exportado com sucesso!');
                }
                
            } else {
                throw new Error(result.error || 'Erro na geração');
            }
        })
        .catch(error => {
            console.error('❌ Erro ao exportar Excel:', error);
            
            if (window.showError) {
                window.showError(`Erro ao exportar Excel: ${error.message}`);
            } else {
                alert(`Erro ao exportar Excel: ${error.message}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao exportar Excel:', error);
        
        if (window.showError) {
            window.showError(`Erro ao exportar Excel: ${error.message}`);
        } else {
            alert(`Erro ao exportar Excel: ${error.message}`);
        }
    }
}

export function importFromExcel() {
    console.log('📥 Importando Excel...');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.style.display = 'none';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            const errorMsg = 'Selecione um arquivo Excel (.xlsx ou .xls)';
            console.error('❌', errorMsg);
            
            if (window.showError) {
                window.showError(errorMsg);
            } else {
                alert(errorMsg);
            }
            return;
        }
        
        console.log('📁 Arquivo Excel selecionado:', file.name);
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e) {
            const base64 = e.target.result.split(',')[1];
            
            fetch('/api/excel/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: file.name,
                    file: base64
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                if (!result.success) {
                    throw new Error(result.error || 'Erro na conversão');
                }
                
                console.log('✅ Excel convertido:', {
                    dutos: result.data.dutos?.length || 0,
                    tubos: result.data.tubos?.length || 0  // ✅ Adicionado tubos
                });
                
                // Armazenar em staging
                window.stagingData = result.data;
                window.hasPendingChanges = true;
                
                // Exibir no editor
                const editor = document.getElementById('jsonEditor');
                if (editor) {
                    editor.value = JSON.stringify(result.data, null, 2);
                    
                    if (window.switchTab) {
                        window.switchTab('raw');
                    }
                }
                
                console.log('✅ Excel convertido e carregado em staging');
                
                if (window.showSuccess) {
                    window.showSuccess('Excel convertido para JSON!');
                } else {
                    alert('Excel convertido para JSON!');
                }
                
                if (window.updateJSONStatus) {
                    window.updateJSONStatus('✅ Excel convertido.', 'success');
                }
                
                if (window.updateApplyButtonState) {
                    window.updateApplyButtonState();
                }
                
            })
            .catch(error => {
                console.error('❌ Erro ao importar Excel:', error);
                
                if (window.showError) {
                    window.showError(`Erro ao importar Excel: ${error.message}`);
                } else {
                    alert(`Erro ao importar Excel: ${error.message}`);
                }
                
                if (window.updateJSONStatus) {
                    window.updateJSONStatus(`❌ Erro: ${error.message}`, 'error');
                }
            });
        };
        
        reader.onerror = function() {
            console.error('❌ Erro ao ler arquivo Excel');
            
            if (window.showError) {
                window.showError('Erro ao ler o arquivo Excel.');
            } else {
                alert('Erro ao ler o arquivo Excel.');
            }
        };
    };
    
    document.body.appendChild(input);
    input.click();
    
    setTimeout(() => {
        if (document.body.contains(input)) {
            document.body.removeChild(input);
        }
    }, 100);
}

// Exportar funções para o escopo global
if (typeof window !== 'undefined') {
    window.exportToJSON = exportToJSON;
    window.importFromJSON = importFromJSON;
    window.exportToExcel = exportToExcel;
    window.importFromExcel = importFromExcel;
    
    console.log('✅ Funções de import/export expostas globalmente');
}