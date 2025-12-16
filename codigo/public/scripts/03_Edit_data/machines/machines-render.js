// scripts/03_Edit_data/machines/machines-render.js
// Funções de renderização HTML para as máquinas

import { escapeHtml } from '../ui.js';

// ===== FUNÇÕES DE RENDERIZAÇÃO HTML =====

export function loadConfiguracoesHTML(machine) {
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

export function loadBaseValuesHTML(machine) {
    const baseValues = machine.baseValues || {};
    const entries = Object.entries(baseValues);

    if (entries.length === 0) {
        return '<p class="empty-message">Nenhum valor base cadastrado.</p>';
    }

    return `
        <div class="base-values-list">
            ${entries.map(([key, value]) => `
                <div class="base-value-item" data-key="${key}">
                    <div class="base-value-header">
                        <label contenteditable="true" 
                               onblur="updateBaseValueKey('${key}', this.textContent.trim())"
                               onkeydown="if(event.key === 'Enter') { event.preventDefault(); this.blur(); }">
                            ${key}
                        </label>
                        <button class="btn btn-xs btn-danger" onclick="removeBaseValue('${key}', event)" title="Remover">
                            <i class="icon-delete"></i>
                        </button>
                    </div>
                    <input type="number" value="${value}" step="1"
                           placeholder="Valor"
                           onchange="updateBaseValue('${key}', this.value)"
                           class="form-input">
                </div>
            `).join('')}
        </div>
    `;
}

export function loadOptionsHTML(machine) {
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
                        <span>Opção ${index + 1}: ${escapeHtml(option.name || '')}</span>
                        <button class="btn btn-xs btn-danger" onclick="removeOption(${index}, event)" title="Remover">
                            <i class="icon-delete"></i>
                        </button>
                    </div>
                    <div class="option-content collapsed">
                        <div class="option-field">
                            <span class="option-label">Nome da Opção:</span>
                            <input type="text" 
                                   value="${escapeHtml(option.name || '')}" 
                                   placeholder="Nome da opção"
                                   oninput="syncOptionName(${index}, this.value)"
                                   onchange="updateOption(${index}, 'name', this.value)"
                                   class="form-input">
                        </div>
                        <div class="option-values">
                            <h5>Valores por Capacidade:</h5>
                            <div class="option-values-grid">
                                ${option.values ? Object.entries(option.values).map(([key, val]) => `
                                    <div class="option-value-item" data-key="${key}">
                                        <label contenteditable="true" 
                                               onblur="updateOptionCapacityLabel(${index}, '${key}', this.textContent.trim())"
                                               onkeydown="if(event.key === 'Enter') { event.preventDefault(); this.blur(); }">
                                            ${key}
                                        </label>
                                        <input type="number" value="${val}" step="1"
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

export function loadVoltagesHTML(machine) {
    const voltages = machine.voltages || [];

    if (voltages.length === 0) {
        return '<p class="empty-message">Nenhuma tensão cadastrada.</p>';
    }

    return `
        <div class="voltages-list">
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
    `;
}