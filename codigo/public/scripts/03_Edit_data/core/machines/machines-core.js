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

// ===== FUNÇÕES UTILITÁRIAS =====
let originalMachineState = null;


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
    
    originalMachineState = JSON.parse(JSON.stringify(machine));
    
    setCurrentMachineIndex(index);

    document.getElementById('machineDetailTitle').textContent = machine.type || 'Nova Máquina';

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
                </div>
                <div id="impostosList" class="section-content collapsed">
                    <div class="impostos-grid">
                        ${Object.entries(machine.impostos || {}).map(([key, value]) => `
                            <div class="imposto-item" data-key="${escapeHtml(key)}">
                                <div class="imposto-header">
                                    <input type="text" value="${escapeHtml(key)}" 
                                        class="form-input-small"
                                        onchange="updateImpostoKey('${key}', this.value)"
                                        placeholder="Nome do imposto">
                                    <button class="btn btn-xs btn-danger" 
                                            onclick="removeImposto('${key}', event)" 
                                            title="Remover">
                                        <i class="icon-delete"></i>
                                    </button>
                                </div>
                                <div class="imposto-value">
                                    <input type="text" value="${escapeHtml(value)}"
                                        onchange="updateImposto('${key}', this.value)"
                                        class="form-input"
                                        placeholder="Valor do imposto">
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
                <div class="section-header" onclick="toggleSection('configuracoes', event)">
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
                <div class="section-header" onclick="toggleSection('valoresbase', event)">
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
                <div class="section-header" onclick="toggleSection('opcoes', event)">
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
                <div class="section-header" onclick="toggleSection('tensoes', event)">
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

export function updateMachineField(field, value) {
    const currentIndex = getCurrentMachineIndex();
    if (currentIndex !== null) {
        systemData.machines[currentIndex][field] = value;
        document.getElementById('machineDetailTitle').textContent = value;
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
                
                // Remove o pending change se houver
                // Nota: Você pode precisar ajustar isso dependendo de como sua função addPendingChange funciona
                
                showWarning('Alterações descartadas. Dados restaurados ao estado original.');
                
                // Opcional: Fechar o detalhe após reset
                closeMachineDetail();
                
                // Opcional: Recarregar toda a visualização
                editMachine(currentIndex);
            },
            'Descartar Alterações',
            'Cancelar'
        );
    } else {
        showWarning('Não há alterações para descartar ou nenhuma máquina está sendo editada.');
    }
}