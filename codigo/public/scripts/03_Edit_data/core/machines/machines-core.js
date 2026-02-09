/* ==== INÍCIO: core/machines/machines-core.js ==== */
// scripts/03_Edit_data/machines/machines-core.js
// Funções principais de carregamento e gerenciamento de máquinas

import { systemData, addPendingChange, getCurrentMachineIndex, setCurrentMachineIndex, clearCurrentMachineIndex } from '../../config/state.js';
import { escapeHtml, showError, showInfo, showWarning, showSuccess, showConfirmation } from '../../config/ui.js';

// Importar funções de renderização
import {
    loadConfiguracoesHTML,
    loadBaseValuesHTML,
    loadOptionsHTML,
    loadVoltagesHTML
} from './machines-render.js';

// ===== DEFINIÇÃO DAS APLICAÇÕES DISPONÍVEIS =====
const APLICACOES_DISPONIVEIS = [
    { tipo: "climatizacao", nome: "Climatização" },
    { tipo: "pressurizacao_ventilacao", nome: "Pressurização/Ventilação" },
    { tipo: "exaustao_bateria", nome: "Exaustão Sala de Bateria" },
    { tipo: "exaustao_baia_trafo", nome: "Exaustão Baia de Trafo" }
];

// ===== FUNÇÕES UTILITÁRIAS =====
let originalMachineState = null;

// Função para garantir que FORNECEDOR sempre exista nos impostos
function ensureFornecedorExists(machine) {
    if (!machine.impostos) {
        machine.impostos = {};
    }
    
    if (!machine.impostos.FORNECEDOR) {
        machine.impostos.FORNECEDOR = 'TOSI'; // Valor padrão
    }
    
    return machine;
}

// Seleciona texto no label
export function selectTextInLabel(label) {
    const range = document.createRange();
    const textNode = label.firstChild;
    
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        range.selectNodeContents(textNode);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

// ===== FUNÇÕES PRINCIPAIS =====

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
        // Garantir que FORNECEDOR existe
        ensureFornecedorExists(machine);
        
        // Encontrar o nome da aplicação
        const aplicacaoInfo = APLICACOES_DISPONIVEIS.find(app => app.tipo === machine.aplicacao);
        const aplicacaoNome = aplicacaoInfo ? aplicacaoInfo.nome : machine.aplicacao || 'N/A';
        
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
                <p><strong>Aplicação:</strong> ${escapeHtml(aplicacaoNome)}</p>
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
        aplicacao: 'climatizacao', // Valor padrão
        impostos: {
            "PIS_COFINS": "INCL",
            "IPI": "ISENTO",
            "ICMS": "12%",
            "PRAZO": "45 a 60 dias",
            "FRETE": "FOB/Cabreúva/SP",
            "FORNECEDOR": "TOSI"
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
    
    // Garantir que FORNECEDOR existe
    ensureFornecedorExists(machine);
    
    originalMachineState = JSON.parse(JSON.stringify(machine));
    
    setCurrentMachineIndex(index);

    document.getElementById('machineDetailTitle').textContent = machine.type || 'Nova Máquina';

    // Gerar options para o select de aplicação
    const aplicacaoOptions = APLICACOES_DISPONIVEIS.map(app => `
        <option value="${app.tipo}" ${machine.aplicacao === app.tipo ? 'selected' : ''}>
            ${app.nome}
        </option>
    `).join('');

    let content = `
        <div class="machine-edit-form">
            <div class="machine-type-container">
                <div class="form-group machine-type-group">
                    <label>Tipo de Máquina:</label>
                    <input type="text" id="editMachineType" value="${escapeHtml(machine.type || '')}" 
                           class="form-control" onchange="updateMachineField('type', this.value)">
                </div>
                <div class="form-group machine-application-group">
                    <label>Aplicação:</label>
                    <select id="editMachineApplication" 
                            class="form-control" 
                            onchange="updateMachineField('aplicacao', this.value)">
                        ${aplicacaoOptions}
                    </select>
                </div>
            </div>
            
            <div class="form-section">
                <div class="machine-section-header" onclick="toggleSection('impostos', event)">
                    <button class="minimizer">+</button>
                    <h4>Detalhes</h4>
                </div>
                <div id="impostosList" class="section-content collapsed">
                    <div class="impostos-grid">
                        ${Object.entries(machine.impostos || {}).map(([key, value]) => `
                            <div class="imposto-item ${key === 'FORNECEDOR' ? 'fornecedor-item' : ''}" data-key="${escapeHtml(key)}">
                                <div class="imposto-header">
                                    <input type="text" value="${escapeHtml(key)}" 
                                        class="form-input-small ${key === 'FORNECEDOR' ? 'fornecedor-input' : ''}"
                                        onchange="updateImpostoKey('${key}', this.value)"
                                        placeholder="${key === 'FORNECEDOR' ? 'Fornecedor' : 'Nome do imposto'}"
                                        ${key === 'FORNECEDOR' ? 'readonly' : ''}>
                                    <button class="btn btn-xs btn-danger" 
                                            onclick="removeImposto('${key}', event)" 
                                            title="Remover">
                                        <i class="icon-delete"></i>
                                    </button>
                                </div>
                                <div class="imposto-value">
                                    <input type="text" value="${escapeHtml(value)}"
                                        onchange="updateImposto('${key}', this.value)"
                                        class="form-input ${key === 'FORNECEDOR' ? 'fornecedor-value-input' : ''}"
                                        placeholder="${key === 'FORNECEDOR' ? 'Nome do fornecedor' : 'Valor do imposto'}">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="text-center" style="margin-top: var(--spacing-lg);">
                        <button class="btn btn-info" onclick="addImposto(event)">
                            <i class="icon-add"></i> Adicionar Imposto
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="machine-section-header" onclick="toggleSection('configuracoes', event)">
                    <button class="minimizer">+</button>
                    <h4>Configurações de Instalação</h4>
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
                <div class="machine-section-header" onclick="toggleSection('valoresbase', event)">
                    <button class="minimizer">+</button>
                    <h4>Valores Base</h4>
                </div>
                <div id="baseValuesList" class="section-content collapsed">
                    <h5>Valores Base por Capacidade:</h5>
                    ${loadBaseValuesHTML(machine)}
                    <div class="text-center" style="margin-top: var(--spacing-md);">
                        <button class="btn btn-small btn-info" onclick="addBaseValue(event)">
                            <i class="icon-add"></i> Adicionar Valor Base
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="machine-section-header" onclick="toggleSection('opcoes', event)">
                    <button class="minimizer">+</button>
                    <h4>Opções</h4>
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
                <div class="machine-section-header" onclick="toggleSection('tensoes', event)">
                    <button class="minimizer">+</button>
                    <h4>Tensões</h4>
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
                <button class="btn btn-warning" onclick="resetMachineChanges()" style="margin-left: auto;">
                    <i class="icon-reset"></i> Descartar Alterações
                </button>
            </div>
        </div>
    `;

    document.getElementById('machineDetailContent').innerHTML = content;
    document.getElementById('machineDetailView').style.display = 'block';
    restoreSectionStates();
    document.getElementById('machineDetailView').scrollIntoView({ behavior: 'smooth' });
}

export function closeMachineDetail() {
    document.getElementById('machineDetailView').style.display = 'none';
    clearCurrentMachineIndex();
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
            // Verificar se a máquina existe
            if (!systemData.machines || !systemData.machines[index]) {
                throw new Error(`Máquina não encontrada no índice ${index}`);
            }

            // Primeiro remover localmente para feedback imediato
            const deletedMachine = systemData.machines.splice(index, 1)[0];
            loadMachines();
            populateMachineFilter();
            closeMachineDetail();
            addPendingChange('machines');
            
            // Tentar excluir no servidor
            try {
                const response = await fetch('/api/machines/delete', {
                    method: 'POST',  // Mude para POST se DELETE não funcionar
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: deletedMachine.type,
                        index: index
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.warn('Erro na API ao excluir máquina:', errorText);
                    showWarning(`Máquina "${machineType}" removida localmente, mas houve erro no servidor.`);
                } else {
                    const result = await response.json();
                    if (result.success) {
                        showSuccess(`Máquina "${machineType}" excluída com sucesso.`);
                    } else {
                        showWarning(`Máquina "${machineType}" removida localmente: ${result.error || 'Erro no servidor'}`);
                    }
                }
            } catch (apiError) {
                console.warn('Erro na API (continuação local):', apiError);
                showWarning(`Máquina "${machineType}" removida localmente. Erro de conexão com o servidor.`);
            }
            
        } catch (error) {
            console.error('Erro ao excluir máquina:', error);
            showError(`Erro ao excluir máquina: ${error.message}`);
        }
    });
}

export function updateMachineField(field, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        systemData.machines[currentIndex][field] = value;
        if (field === 'type') {
            document.getElementById('machineDetailTitle').textContent = value;
        }
        addPendingChange('machines');
    }
}

export function preventScroll(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Prevenir scroll da página
        window.scrollTo(window.scrollX, window.scrollY);
        return false;
    }
}

export function resetMachineChanges() {
    const currentIndex = getCurrentMachineIndex();
    
    if (currentIndex !== null && originalMachineState) {
        showConfirmation(
            'Deseja descartar todas as alterações feitas nesta máquina? Esta ação não pode ser desfeita.',
            () => {
                // Restaura o estado original
                systemData.machines[currentIndex] = JSON.parse(JSON.stringify(originalMachineState));
                
                // Atualiza a interface
                document.getElementById('machineDetailTitle').textContent = 
                    systemData.machines[currentIndex].type || 'Nova Máquina';
                
                // Recarrega os dados na interface
                const machine = systemData.machines[currentIndex];
                
                // Atualiza os campos editáveis
                const typeInput = document.getElementById('editMachineType');
                if (typeInput) {
                    typeInput.value = machine.type || '';
                }
                
                showWarning('Alterações descartadas. Dados restaurados ao estado original.');
                
                // Recarregar toda a visualização
                editMachine(currentIndex);
            },
            'Descartar Alterações',
            'Cancelar'
        );
    } else {
        showWarning('Não há alterações para descartar ou nenhuma máquina está sendo editada.');
    }
}

// ===== FUNÇÕES AUXILIARES PARA IMPOSTOS =====

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
    if (currentIndex !== null && systemData.machines[currentIndex].impostos) {
        const value = systemData.machines[currentIndex].impostos[oldKey];
        delete systemData.machines[currentIndex].impostos[oldKey];
        systemData.machines[currentIndex].impostos[newKey] = value;
        addPendingChange('machines');
    }
}

export function removeImposto(key, event) {
    if (event) event.stopPropagation();
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null && systemData.machines[currentIndex].impostos) {
        delete systemData.machines[currentIndex].impostos[key];
        addPendingChange('machines');
        
        // Recarregar a seção de impostos
        editMachine(currentIndex);
    }
}

export function addImposto(event) {
    if (event) event.stopPropagation();
    
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        if (!systemData.machines[currentIndex].impostos) {
            systemData.machines[currentIndex].impostos = {};
        }
        
        const newKey = `NOVO_IMPOSTO_${Date.now().toString().slice(-4)}`;
        systemData.machines[currentIndex].impostos[newKey] = "VALOR";
        addPendingChange('machines');
        
        // Recarregar a seção de impostos
        editMachine(currentIndex);
    }
}

// ===== FUNÇÕES DE GERENCIAMENTO DE SEÇÕES =====

export function toggleSection(sectionId, event) {
    if (event) event.stopPropagation();
    
    const section = document.getElementById(sectionId + 'List');
    if (section) {
        const isCollapsed = section.classList.contains('collapsed');
        section.classList.toggle('collapsed');
        
        const minimizer = event?.currentTarget?.querySelector('.minimizer');
        if (minimizer) {
            minimizer.textContent = isCollapsed ? '-' : '+';
        }
        
        // Salvar o estado da seção
        saveSectionState(sectionId, !isCollapsed);
    }
}

export function saveSectionState(sectionId, isExpanded) {
    const sectionStates = JSON.parse(localStorage.getItem('machineSectionStates') || '{}');
    sectionStates[sectionId] = isExpanded;
    localStorage.setItem('machineSectionStates', JSON.stringify(sectionStates));
}

export function restoreSectionStates() {
    const sectionStates = JSON.parse(localStorage.getItem('machineSectionStates') || '{}');
    
    Object.keys(sectionStates).forEach(sectionId => {
        const section = document.getElementById(sectionId + 'List');
        if (section) {
            const isExpanded = sectionStates[sectionId];
            section.classList.toggle('collapsed', !isExpanded);
            
            const minimizer = document.querySelector(`[onclick*="${sectionId}"] .minimizer`);
            if (minimizer) {
                minimizer.textContent = isExpanded ? '-' : '+';
            }
        }
    });
}

// ===== EXPORTAÇÃO GLOBAL =====

window.loadMachines = loadMachines;
window.populateMachineFilter = populateMachineFilter;
window.filterMachines = filterMachines;
window.addMachine = addMachine;
window.editMachine = editMachine;
window.closeMachineDetail = closeMachineDetail;
window.saveMachineChanges = saveMachineChanges;
window.deleteMachine = deleteMachine;
window.updateMachineField = updateMachineField;
window.updateImposto = updateImposto;
window.updateImpostoKey = updateImpostoKey;
window.removeImposto = removeImposto;
window.addImposto = addImposto;
window.resetMachineChanges = resetMachineChanges;
window.toggleSection = toggleSection;
/* ==== FIM: core/machines/machines-core.js ==== */