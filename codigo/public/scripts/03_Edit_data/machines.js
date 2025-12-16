// scripts/03_Edit_data/machines.js
// Gerenciamento de máquinas

import { systemData, addPendingChange, getCurrentMachineIndex, setCurrentMachineIndex, clearCurrentMachineIndex } from './state.js';
import { escapeHtml, showError, showInfo, showWarning, showSuccess, showConfirmation } from './ui.js';

export function loadMachines() {
    const container = document.getElementById('machinesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!systemData.machines || !Array.isArray(systemData.machines)) {
        systemData.machines = [];
        return;
    }
    
    if (systemData.machines.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="icon-machine" style="font-size: 48px; opacity: 0.5;"></i>
                <h3>Nenhuma máquina cadastrada</h3>
                <p>Clique no botão abaixo para adicionar sua primeira máquina.</p>
                <button class="btn btn-success" onclick="addMachine()">
                    <i class="icon-add"></i> Adicionar Primeira Máquina
                </button>
            </div>
        `;
        return;
    }
    
    systemData.machines.forEach((machine, index) => {
        const card = document.createElement('div');
        card.className = 'machine-card';
        card.innerHTML = `
            <div class="machine-card-header">
                <h3>${escapeHtml(machine.type || 'Sem nome')}</h3>
                <div class="machine-card-actions">
                    <button class="btn btn-small btn-primary" 
                            onclick="editMachine(${index})"
                            title="Editar máquina">
                        <i class="icon-edit"></i> Editar
                    </button>
                    <button class="btn btn-small btn-danger"
                            onclick="deleteMachine(${index})"
                            title="Excluir máquina">
                        <i class="icon-delete"></i>
                    </button>
                </div>
            </div>
            <div class="machine-card-body">
                <p><strong>Configurações:</strong> ${machine.configuracoes_instalacao?.length || 0}</p>
                <p><strong>Opções:</strong> ${machine.options?.length || 0}</p>
                <p><strong>Tensões:</strong> ${machine.voltages?.length || 0}</p>
                <p><strong>Valores base:</strong> ${Object.keys(machine.baseValues || {}).length}</p>
            </div>
            <div class="machine-card-footer">
                <span>ID: ${index}</span>
                <span>Tipo: ${machine.type || 'Não definido'}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

export function populateMachineFilter() {
    const filter = document.getElementById('machineTypeFilter');
    if (!filter) return;
    
    filter.innerHTML = '<option value="">Todas as máquinas</option>';
    
    systemData.machines.forEach((machine, index) => {
        const option = document.createElement('option');
        option.value = machine.type;
        option.textContent = machine.type || `Máquina ${index + 1}`;
        filter.appendChild(option);
    });
}

export function filterMachines() {
    const filterValue = document.getElementById('machineTypeFilter').value.toLowerCase();
    const cards = document.querySelectorAll('.machine-card');
    
    cards.forEach(card => {
        const machineType = card.querySelector('h3').textContent.toLowerCase();
        if (!filterValue || machineType.includes(filterValue)) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
        }
    });
}

export function addMachine() {
    const newMachine = {
        type: `NOVO_TIPO_${Date.now().toString().slice(-4)}`,
        impostos: {
            "PIS_COFINS": "INCL",
            "IPI": "ISENTO",
            "ICMS": "12%",
            "PRAZO": "45 a 60 dias",
            "FRETE": "FOB/Cabreúva/SP"
        },
        configuracoes_instalacao: [],
        baseValues: {},
        options: [],
        voltages: []
    };
    
    systemData.machines.push(newMachine);
    loadMachines();
    populateMachineFilter();
    editMachine(systemData.machines.length - 1);
    addPendingChange('machines');
    showInfo('Nova máquina adicionada. Configure os detalhes.');
}

export function editMachine(index) {
    if (index < 0 || index >= systemData.machines.length) return;
    
    const machine = systemData.machines[index];
    setCurrentMachineIndex(index);
    
    // Atualizar título
    document.getElementById('machineDetailTitle').textContent = machine.type || 'Nova Máquina';
    
    // Construir conteúdo de edição com toggles
    let content = `
        <div class="machine-edit-form">
            <div class="form-group">
                <label>Tipo de Máquina:</label>
                <input type="text" id="editMachineType" value="${escapeHtml(machine.type || '')}" 
                       class="form-control" onchange="updateMachineField('type', this.value)">
            </div>
            
            <div class="form-section">
                <div class="section-header" onclick="toggleSection('impostos', event)">
                    <button class="minimizer">+</button>
                    <h4>Impostos</h4>
                    <button class="btn btn-small btn-success" onclick="addImposto(event)">
                        <i class="icon-add"></i> Adicionar
                    </button>
                </div>
                <div id="impostosList" class="section-content collapsed">
                    <div class="impostos-grid">
                        ${Object.entries(machine.impostos || {}).map(([key, value]) => `
                            <div class="form-group impostos-item" data-key="${escapeHtml(key)}">
                                <input type="text" value="${escapeHtml(key)}" class="form-input-small impostos-key"
                                       onchange="updateImpostoKey('${key}', this.value)"
                                       placeholder="Nome do imposto">
                                <input type="text" value="${escapeHtml(value)}"
                                       onchange="updateImposto('${key}', this.value)"
                                       class="form-input-small"
                                       placeholder="Valor">
                                <button class="btn btn-xs btn-danger" onclick="removeImposto('${key}', event)" title="Remover">
                                    <i class="icon-delete"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <div class="text-center" style="margin-top: var(--spacing-md);">
                        <button class="btn btn-small btn-info" onclick="addImposto(event)">
                            <i class="icon-add"></i> Adicionar Imposto
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-header" onclick="toggleSection('configuracoes', event)">
                    <button class="minimizer">+</button>
                    <h4>Configurações de Instalação</h4>
                    <button class="btn btn-small btn-success" onclick="addConfiguracao(event)">
                        <i class="icon-add"></i> Adicionar
                    </button>
                </div>
                <div id="configuracoesList" class="section-content collapsed">
                    ${loadConfiguracoesHTML(machine)}
                    <div class="text-center" style="margin-top: var(--spacing-md);">
                        <button class="btn btn-small btn-info" onclick="addConfiguracao(event)">
                            <i class="icon-add"></i> Adicionar Configuração
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-header" onclick="toggleSection('valoresbase', event)">
                    <button class="minimizer">+</button>
                    <h4>Valores Base</h4>
                    <button class="btn btn-small btn-success" onclick="addBaseValue(event)">
                        <i class="icon-add"></i> Adicionar
                    </button>
                </div>
                <div id="baseValuesList" class="section-content collapsed">
                    ${loadBaseValuesHTML(machine)}
                    <div class="text-center" style="margin-top: var(--spacing-md);">
                        <button class="btn btn-small btn-info" onclick="addBaseValue(event)">
                            <i class="icon-add"></i> Adicionar Valor Base
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-header" onclick="toggleSection('opcoes', event)">
                    <button class="minimizer">+</button>
                    <h4>Opções</h4>
                    <button class="btn btn-small btn-success" onclick="addOption(event)">
                        <i class="icon-add"></i> Adicionar
                    </button>
                </div>
                <div id="optionsList" class="section-content collapsed">
                    ${loadOptionsHTML(machine)}
                    <div class="text-center" style="margin-top: var(--spacing-md);">
                        <button class="btn btn-small btn-info" onclick="addOption(event)">
                            <i class="icon-add"></i> Adicionar Opção
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-header" onclick="toggleSection('tensoes', event)">
                    <button class="minimizer">+</button>
                    <h4>Tensões</h4>
                    <button class="btn btn-small btn-success" onclick="addVoltage(event)">
                        <i class="icon-add"></i> Adicionar
                    </button>
                </div>
                <div id="voltagesList" class="section-content collapsed">
                    ${loadVoltagesHTML(machine)}
                    <div class="text-center" style="margin-top: var(--spacing-md);">
                        <button class="btn btn-small btn-info" onclick="addVoltage(event)">
                            <i class="icon-add"></i> Adicionar Tensão
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-success" onclick="saveMachineChanges()">
                    <i class="icon-save"></i> Salvar Alterações
                </button>
                <button class="btn btn-secondary" onclick="closeMachineDetail()">
                    <i class="icon-close"></i> Fechar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('machineDetailContent').innerHTML = content;
    document.getElementById('machineDetailView').style.display = 'block';
    
    // Restaurar estado dos toggles se existir
    restoreSectionStates();
    
    document.getElementById('machineDetailView').scrollIntoView({ behavior: 'smooth' });
}

function loadConfiguracoesHTML(machine) {
    const configuracoes = machine.configuracoes_instalacao || [];
    
    if (configuracoes.length === 0) {
        return '<p class="empty-message">Nenhuma configuração cadastrada.</p>';
    }
    
    return `
        <div class="configuracoes-list">
            ${configuracoes.map((config, index) => `
                <div class="config-item" data-index="${index}">
                    <div class="config-header">
                        <span>Configuração ${index + 1}</span>
                        <button class="btn btn-xs btn-danger" onclick="removeConfiguracao(${index}, event)" title="Remover">
                            <i class="icon-delete"></i>
                        </button>
                    </div>
                    <div class="config-content">
                        <div class="config-field">
                            <span class="config-label">Descrição:</span>
                            <input type="text" value="${escapeHtml(config.nome || '')}" 
                                   placeholder="Descrição da configuração"
                                   onchange="updateConfiguracao(${index}, 'nome', this.value)"
                                   class="form-input">
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function loadBaseValuesHTML(machine) {
    const baseValues = machine.baseValues || {};
    const entries = Object.entries(baseValues);
    
    if (entries.length === 0) {
        return '<p class="empty-message">Nenhum valor base cadastrado.</p>';
    }
    
    return `
        <div class="base-values-list">
            ${entries.map(([key, value], index) => `
                <div class="base-value-item" data-key="${key}">
                    <div class="base-value-header">
                        <input type="text" value="${escapeHtml(key)}" 
                               placeholder="Chave (ex: 1TR)"
                               onchange="updateBaseValueKey('${key}', this.value)"
                               class="form-input-small">
                        <button class="btn btn-xs btn-danger" onclick="removeBaseValue('${key}', event)" title="Remover">
                            <i class="icon-delete"></i>
                        </button>
                    </div>
                    <input type="number" value="${value}" step="0.01"
                           placeholder="Valor"
                           onchange="updateBaseValue('${key}', this.value)"
                           class="form-input">
                </div>
            `).join('')}
        </div>
    `;
}

function loadOptionsHTML(machine) {
    const options = machine.options || [];
    
    if (options.length === 0) {
        return '<p class="empty-message">Nenhuma opção cadastrada.</p>';
    }
    
    return `
        <div class="options-list">
            ${options.map((option, index) => `
                <div class="option-item" data-index="${index}">
                    <div class="option-header" onclick="toggleOptionItem(${index}, event)">
                        <button class="minimizer">+</button>
                        <span>Opção ${index + 1}: ${escapeHtml(option.name || 'Sem nome')}</span>
                        <button class="btn btn-xs btn-danger" onclick="removeOption(${index}, event)" title="Remover">
                            <i class="icon-delete"></i>
                        </button>
                    </div>
                    <div class="option-content collapsed">
                        <div class="option-field">
                            <span class="option-label">Nome da Opção:</span>
                            <input type="text" value="${escapeHtml(option.name || '')}" 
                                   placeholder="Nome da opção"
                                   onchange="updateOption(${index}, 'name', this.value)"
                                   class="form-input">
                        </div>
                        <div class="option-values">
                            <h5>Valores por Capacidade:</h5>
                            <div class="option-values-grid">
                                ${option.values ? Object.entries(option.values).map(([key, val]) => `
                                    <div class="option-value-item">
                                        <label>${key}</label>
                                        <input type="number" value="${val}" step="0.01"
                                               onchange="updateOptionValue(${index}, '${key}', this.value)"
                                               class="form-input-small">
                                    </div>
                                `).join('') : '<p>Sem valores definidos</p>'}
                            </div>
                            <div class="text-center" style="margin-top: var(--spacing-md);">
                                <button class="btn btn-xs btn-info" onclick="addOptionValue(${index}, event)">
                                    <i class="icon-add"></i> Adicionar Capacidade
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function loadVoltagesHTML(machine) {
    const voltages = machine.voltages || [];
    
    if (voltages.length === 0) {
        return '<p class="empty-message">Nenhuma tensão cadastrada.</p>';
    }
    
    return `
        <div class="voltages-list">
            <!-- Tabela para desktop -->
            <table class="voltages-table">
                <thead>
                    <tr>
                        <th>Tensão</th>
                        <th>Valor (R$)</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${voltages.map((voltage, index) => `
                        <tr data-index="${index}">
                            <td>
                                <input type="text" 
                                       value="${escapeHtml(voltage.name || '')}" 
                                       placeholder="Ex: 220V/1F"
                                       onchange="updateVoltage(${index}, 'name', this.value)"
                                       class="tensao-input">
                            </td>
                            <td>
                                <input type="number" 
                                       value="${voltage.value || 0}" 
                                       step="1"
                                       placeholder="0.00"
                                       onchange="updateVoltage(${index}, 'value', this.value)"
                                       class="valor-input">
                            </td>
                            <td>
                                <button class="delete-tensao-btn" 
                                        onclick="removeVoltage(${index}, event)" 
                                        title="Remover tensão">
                                    <i class="icon-delete"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- Grid 2x2 para mobile/tablet -->
            <div class="voltages-grid">
                ${voltages.map((voltage, index) => `
                    <div class="voltage-card" data-index="${index}">
                        <div class="voltage-card-header">
                            <span>Tensão ${index + 1}</span>
                            <button class="btn btn-xs btn-danger" 
                                    onclick="removeVoltage(${index}, event)" 
                                    title="Remover">
                                <i class="icon-delete"></i>
                            </button>
                        </div>
                        <div class="voltage-card-content">
                            <div class="voltage-card-field">
                                <label>Tensão:</label>
                                <input type="text" 
                                       value="${escapeHtml(voltage.name || '')}" 
                                       placeholder="Ex: 220V/1F"
                                       onchange="updateVoltage(${index}, 'name', this.value)"
                                       class="tensao-input">
                            </div>
                            <div class="voltage-card-field">
                                <label>Valor (R$):</label>
                                <input type="number" 
                                       value="${voltage.value || 0}" 
                                       step="1"
                                       placeholder="0.00"
                                       onchange="updateVoltage(${index}, 'value', this.value)"
                                       class="valor-input">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function closeMachineDetail() {
    document.getElementById('machineDetailView').style.display = 'none';
    clearCurrentMachineIndex();
}

export function updateMachineField(field, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        systemData.machines[currentIndex][field] = value;
        document.getElementById('machineDetailTitle').textContent = value;
        addPendingChange('machines');
    }
}

export function updateImposto(key, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        if (!systemData.machines[currentIndex].impostos) {
            systemData.machines[currentIndex].impostos = {};
        }
        systemData.machines[currentIndex].impostos[key] = value;
        addPendingChange('machines');
    }
}

export function updateImpostoKey(oldKey, newKey) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null && newKey && newKey.trim() !== '') {
        const machine = systemData.machines[currentIndex];
        if (machine.impostos && machine.impostos[oldKey] !== undefined) {
            const value = machine.impostos[oldKey];
            delete machine.impostos[oldKey];
            machine.impostos[newKey] = value;
            addPendingChange('machines');
            
            // Atualizar visualmente
            setTimeout(() => editMachine(currentIndex), 100);
        }
    }
}

export function removeImposto(key, event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.impostos && machine.impostos[key] !== undefined) {
            delete machine.impostos[key];
            addPendingChange('machines');
            // Não recarregar a tela inteira
            setTimeout(() => {
                const section = document.querySelector(`.impostos-item[data-key="${key}"]`);
                if (section) section.remove();
            }, 10);
        }
    }
}

export function addImposto(event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const newKey = `NOVO_IMPOSTO_${Date.now().toString().slice(-4)}`;
        if (!systemData.machines[currentIndex].impostos) {
            systemData.machines[currentIndex].impostos = {};
        }
        systemData.machines[currentIndex].impostos[newKey] = '';
        addPendingChange('machines');
        
        // Adicionar visualmente sem recarregar
        const impostosList = document.querySelector('.impostos-grid');
        if (impostosList) {
            const newItem = document.createElement('div');
            newItem.className = 'form-group impostos-item';
            newItem.setAttribute('data-key', newKey);
            newItem.innerHTML = `
                <input type="text" value="${newKey}" class="form-input-small impostos-key"
                       onchange="updateImpostoKey('${newKey}', this.value)"
                       placeholder="Nome do imposto">
                <input type="text" value=""
                       onchange="updateImposto('${newKey}', this.value)"
                       class="form-input-small"
                       placeholder="Valor">
                <button class="btn btn-xs btn-danger" onclick="removeImposto('${newKey}', event)" title="Remover">
                    <i class="icon-delete"></i>
                </button>
            `;
            impostosList.appendChild(newItem);
            
            // Focar no novo campo
            setTimeout(() => {
                const input = newItem.querySelector('.impostos-key');
                if (input) input.focus();
            }, 50);
        }
    }
}

// Funções para Configurações
export function addConfiguracao(event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (!machine.configuracoes_instalacao) {
            machine.configuracoes_instalacao = [];
        }
        
        const newIndex = machine.configuracoes_instalacao.length;
        machine.configuracoes_instalacao.push({
            nome: 'Nova Configuração'
            // Não incluir valor por padrão
        });
        
        addPendingChange('machines');
        
        // Adicionar visualmente sem recarregar tudo
        const configuracoesList = document.querySelector('.configuracoes-list');
        if (configuracoesList) {
            const newItem = document.createElement('div');
            newItem.className = 'config-item';
            newItem.setAttribute('data-index', newIndex);
            newItem.innerHTML = `
                <div class="config-header">
                    <span>Configuração ${newIndex + 1}</span>
                    <button class="btn btn-xs btn-danger" onclick="removeConfiguracao(${newIndex}, event)" title="Remover">
                        <i class="icon-delete"></i>
                    </button>
                </div>
                <div class="config-content">
                    <div class="config-field">
                        <span class="config-label">Descrição:</span>
                        <input type="text" value="Nova Configuração" 
                               placeholder="Descrição da configuração"
                               onchange="updateConfiguracao(${newIndex}, 'nome', this.value)"
                               class="form-input">
                    </div>
                </div>
            `;
            configuracoesList.appendChild(newItem);
            
            // Focar no novo campo
            setTimeout(() => {
                const input = newItem.querySelector('input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        } else {
            editMachine(currentIndex);
        }
    }
}

export function updateConfiguracao(index, field, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.configuracoes_instalacao && machine.configuracoes_instalacao[index]) {
            machine.configuracoes_instalacao[index][field] = value;
            addPendingChange('machines');
        }
    }
}

export function removeConfiguracao(index, event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    showConfirmation('Deseja remover esta configuração?', () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.configuracoes_instalacao) {
                machine.configuracoes_instalacao.splice(index, 1);
                addPendingChange('machines');
                
                // Remover visualmente
                const item = document.querySelector(`.config-item[data-index="${index}"]`);
                if (item) item.remove();
                
                // Renumerar os itens restantes
                const items = document.querySelectorAll('.config-item');
                items.forEach((item, newIndex) => {
                    item.setAttribute('data-index', newIndex);
                    const span = item.querySelector('.config-header span');
                    if (span) span.textContent = `Configuração ${newIndex + 1}`;
                    
                    // Atualizar eventos
                    const removeBtn = item.querySelector('button.btn-danger');
                    if (removeBtn) {
                        removeBtn.setAttribute('onclick', `removeConfiguracao(${newIndex}, event)`);
                    }
                    
                    const input = item.querySelector('input');
                    if (input) {
                        input.setAttribute('onchange', `updateConfiguracao(${newIndex}, 'nome', this.value)`);
                    }
                });
                
                showWarning('Configuração removida.');
            }
        }
    });
}

// Funções para Valores Base
export function addBaseValue(event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (!machine.baseValues) {
            machine.baseValues = {};
        }
        
        const newKey = `NOVA_CAPACIDADE_${Object.keys(machine.baseValues).length + 1}`;
        machine.baseValues[newKey] = 0;
        
        addPendingChange('machines');
        
        // Adicionar visualmente
        const baseValuesList = document.querySelector('.base-values-list');
        if (baseValuesList) {
            const newItem = document.createElement('div');
            newItem.className = 'base-value-item';
            newItem.setAttribute('data-key', newKey);
            newItem.innerHTML = `
                <div class="base-value-header">
                    <input type="text" value="${newKey}" 
                           placeholder="Chave (ex: 1TR)"
                           onchange="updateBaseValueKey('${newKey}', this.value)"
                           class="form-input-small">
                    <button class="btn btn-xs btn-danger" onclick="removeBaseValue('${newKey}', event)" title="Remover">
                        <i class="icon-delete"></i>
                    </button>
                </div>
                <input type="number" value="0" step="0.01"
                       placeholder="Valor"
                       onchange="updateBaseValue('${newKey}', this.value)"
                       class="form-input">
            `;
            baseValuesList.appendChild(newItem);
            
            // Focar no campo de chave
            setTimeout(() => {
                const input = newItem.querySelector('.form-input-small');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        } else {
            editMachine(currentIndex);
        }
    }
}

export function updateBaseValueKey(oldKey, newKey) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null && newKey && newKey.trim() !== '') {
        const machine = systemData.machines[currentIndex];
        if (machine.baseValues && machine.baseValues[oldKey] !== undefined) {
            const value = machine.baseValues[oldKey];
            delete machine.baseValues[oldKey];
            machine.baseValues[newKey] = value;
            addPendingChange('machines');
        }
    }
}

export function updateBaseValue(key, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.baseValues && machine.baseValues[key] !== undefined) {
            machine.baseValues[key] = parseFloat(value) || 0;
            addPendingChange('machines');
        }
    }
}

export function removeBaseValue(key, event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    showConfirmation(`Deseja remover o valor base "${key}"?`, () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.baseValues && machine.baseValues[key] !== undefined) {
                delete machine.baseValues[key];
                addPendingChange('machines');
                
                // Remover visualmente
                const item = document.querySelector(`.base-value-item[data-key="${key}"]`);
                if (item) item.remove();
                
                showWarning(`Valor base "${key}" removido.`);
            }
        }
    });
}

// Funções para Opções
export function addOption(event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (!machine.options) {
            machine.options = [];
        }
        
        const newIndex = machine.options.length;
        machine.options.push({
            id: newIndex + 1,
            name: 'Nova Opção',
            values: {}
        });
        
        addPendingChange('machines');
        editMachine(currentIndex); // Recarregar para mostrar o novo item
    }
}

export function addOptionValue(optionIndex, event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.options && machine.options[optionIndex]) {
            if (!machine.options[optionIndex].values) {
                machine.options[optionIndex].values = {};
            }
            
            // Encontrar a próxima capacidade disponível
            const capacities = Object.keys(machine.options[optionIndex].values);
            let newCapacity = '1TR';
            if (capacities.length > 0) {
                // Encontrar o maior número
                const numbers = capacities.map(cap => {
                    const match = cap.match(/(\d+(?:,\d+)?)TR/);
                    return match ? parseFloat(match[1].replace(',', '.')) : 0;
                });
                const maxNumber = Math.max(...numbers);
                newCapacity = `${maxNumber + 1}TR`;
            }
            
            machine.options[optionIndex].values[newCapacity] = 0;
            addPendingChange('machines');
            
            // Adicionar visualmente
            const optionValuesGrid = document.querySelector(`.option-item[data-index="${optionIndex}"] .option-values-grid`);
            if (optionValuesGrid) {
                const newItem = document.createElement('div');
                newItem.className = 'option-value-item';
                newItem.innerHTML = `
                    <label>${newCapacity}</label>
                    <input type="number" value="0" step="0.01"
                           onchange="updateOptionValue(${optionIndex}, '${newCapacity}', this.value)"
                           class="form-input-small">
                `;
                optionValuesGrid.appendChild(newItem);
                
                // Focar no novo campo
                setTimeout(() => {
                    const input = newItem.querySelector('input');
                    if (input) {
                        input.focus();
                        input.select();
                    }
                }, 50);
            }
        }
    }
}

export function updateOption(index, field, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.options && machine.options[index]) {
            machine.options[index][field] = value;
            addPendingChange('machines');
        }
    }
}

export function updateOptionValue(optionIndex, key, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.options && machine.options[optionIndex]) {
            if (!machine.options[optionIndex].values) {
                machine.options[optionIndex].values = {};
            }
            machine.options[optionIndex].values[key] = parseFloat(value) || 0;
            addPendingChange('machines');
        }
    }
}

export function removeOption(index, event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    showConfirmation('Deseja remover esta opção?', () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.options) {
                machine.options.splice(index, 1);
                addPendingChange('machines');
                editMachine(currentIndex); // Recarregar
                showWarning('Opção removida.');
            }
        }
    });
}

// Funções para Tensões
export function addVoltage(event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (!machine.voltages) {
            machine.voltages = [];
        }
        
        const newIndex = machine.voltages.length;
        machine.voltages.push({
            id: newIndex + 1,
            name: 'Nova Tensão',
            value: 0
        });
        
        addPendingChange('machines');
        editMachine(currentIndex); // Recarregar a view
    }
}

export function updateVoltage(index, field, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        const machine = systemData.machines[currentIndex];
        if (machine.voltages && machine.voltages[index]) {
            if (field === 'value') {
                machine.voltages[index][field] = parseFloat(value) || 0;
            } else {
                machine.voltages[index][field] = value;
            }
            addPendingChange('machines');
        }
    }
}

export function removeVoltage(index, event) {
    if (event) event.stopPropagation();
    event.preventDefault();
    
    showConfirmation('Deseja remover esta tensão?', () => {
        const currentIndex = getCurrentMachineIndex();
        if (currentIndex !== null) {
            const machine = systemData.machines[currentIndex];
            if (machine.voltages) {
                machine.voltages.splice(index, 1);
                addPendingChange('machines');
                
                // Remover visualmente
                const tableRow = document.querySelector(`.voltages-table tr[data-index="${index}"]`);
                const gridCard = document.querySelector(`.voltage-card[data-index="${index}"]`);
                
                if (tableRow) tableRow.remove();
                if (gridCard) gridCard.remove();
                
                // Renumerar os itens restantes
                document.querySelectorAll('.voltages-table tr[data-index]').forEach((row, newIndex) => {
                    row.setAttribute('data-index', newIndex);
                    const inputs = row.querySelectorAll('input');
                    inputs[0].setAttribute('onchange', `updateVoltage(${newIndex}, 'name', this.value)`);
                    inputs[1].setAttribute('onchange', `updateVoltage(${newIndex}, 'value', this.value)`);
                    const button = row.querySelector('button');
                    button.setAttribute('onclick', `removeVoltage(${newIndex}, event)`);
                });
                
                document.querySelectorAll('.voltage-card[data-index]').forEach((card, newIndex) => {
                    card.setAttribute('data-index', newIndex);
                    card.querySelector('.voltage-card-header span').textContent = `Tensão ${newIndex + 1}`;
                    const inputs = card.querySelectorAll('input');
                    inputs[0].setAttribute('onchange', `updateVoltage(${newIndex}, 'name', this.value)`);
                    inputs[1].setAttribute('onchange', `updateVoltage(${newIndex}, 'value', this.value)`);
                    const button = card.querySelector('button');
                    button.setAttribute('onclick', `removeVoltage(${newIndex}, event)`);
                });
                
                showWarning('Tensão removida.');
            }
        }
    });
}

export function saveMachineChanges() {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        addPendingChange('machines');
        showSuccess('Alterações na máquina salvas. Lembre-se de salvar todos os dados.');
        closeMachineDetail();
    }
}

export async function deleteMachine(index) {
    const machine = systemData.machines[index];
    const machineType = machine.type || `Máquina ${index + 1}`;
    
    showConfirmation(`Deseja excluir a máquina "${machineType}"?`, async () => {
        try {
            const response = await fetch('/api/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    path: ['machines', index.toString()] 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                systemData.machines.splice(index, 1);
                loadMachines();
                populateMachineFilter();
                closeMachineDetail();
                addPendingChange('machines');
                showWarning(`Máquina "${machineType}" excluída.`);
            } else {
                throw new Error(result.error || 'Erro ao excluir');
            }
        } catch (error) {
            console.error('Erro ao excluir máquina:', error);
            showError(`Erro ao excluir máquina: ${error.message}`);
        }
    });
}

// ===== FUNÇÕES PARA TOGGLES =====

export function toggleSection(sectionId, event) {
    if (!event) return;
    
    event.stopPropagation();
    
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    const minimizer = header.querySelector('.minimizer');
    
    if (!content || !minimizer) return;
    
    if (content.classList.contains('collapsed')) {
        // Expandir
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        minimizer.textContent = '−'; // Sinal de menos
        minimizer.title = 'Recolher seção';
        
        // Salvar estado como expandido
        saveSectionState(sectionId, 'expanded');
    } else {
        // Recolher
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        minimizer.textContent = '+'; // Sinal de mais
        minimizer.title = 'Expandir seção';
        
        // Salvar estado como recolhido
        saveSectionState(sectionId, 'collapsed');
    }
}

export function toggleOptionItem(index, event) {
    if (!event) return;
    
    event.stopPropagation();
    
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    const minimizer = header.querySelector('.minimizer');
    
    if (!content || !minimizer) return;
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        minimizer.textContent = '−';
    } else {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        minimizer.textContent = '+';
    }
}

export function saveSectionState(sectionId, state) {
    try {
        // Salvar no localStorage
        const sectionStates = JSON.parse(localStorage.getItem('machineSectionStates') || '{}');
        sectionStates[sectionId] = state;
        localStorage.setItem('machineSectionStates', JSON.stringify(sectionStates));
    } catch (error) {
        console.error('Erro ao salvar estado da seção:', error);
    }
}

export function restoreSectionStates() {
    try {
        const sectionStates = JSON.parse(localStorage.getItem('machineSectionStates') || '{}');
        
        // Para cada seção no DOM
        document.querySelectorAll('.form-section').forEach(section => {
            const header = section.querySelector('.section-header');
            const content = header?.nextElementSibling;
            const minimizer = header?.querySelector('.minimizer');
            
            if (!header || !content || !minimizer) return;
            
            // Determinar qual seção é baseada no conteúdo
            let sectionId = '';
            if (content.id.includes('impostos')) sectionId = 'impostos';
            else if (content.id.includes('configuracoes')) sectionId = 'configuracoes';
            else if (content.id.includes('baseValues')) sectionId = 'valoresbase';
            else if (content.id.includes('options')) sectionId = 'opcoes';
            else if (content.id.includes('voltages')) sectionId = 'tensoes';
            
            if (sectionId && sectionStates[sectionId] === 'expanded') {
                // Expandir se estava expandida
                content.classList.remove('collapsed');
                content.classList.add('expanded');
                minimizer.textContent = '−';
                minimizer.title = 'Recolher seção';
            } else {
                // Por padrão, colapsar
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                minimizer.textContent = '+';
                minimizer.title = 'Expandir seção';
            }
        });
        
        // Também restaurar estados dos option-items
        document.querySelectorAll('.option-item').forEach(optionItem => {
            const header = optionItem.querySelector('.option-header');
            const content = header?.nextElementSibling;
            const minimizer = header?.querySelector('.minimizer');
            
            if (header && content && minimizer) {
                // Option-items sempre começam colapsados
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                minimizer.textContent = '+';
            }
        });
    } catch (error) {
        console.error('Erro ao restaurar estados das seções:', error);
    }
}

// Exportar funções globalmente
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

// Novas funções para toggles
window.toggleSection = toggleSection;
window.toggleOptionItem = toggleOptionItem;
window.restoreSectionStates = restoreSectionStates;