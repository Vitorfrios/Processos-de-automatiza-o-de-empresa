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
            ${entries.map(([key, value], index) => `
                <div class="base-value-item" data-key="${escapeHtml(key)}">
                    <div class="base-value-header">
                        <span>Valor Base ${index + 1}</span>
                        <button class="btn btn-xs btn-danger" onclick="removeBaseValue('${escapeHtml(key)}', event)" title="Remover">
                            <i class="icon-delete"></i>
                        </button>
                    </div>
                    <div class="base-value-content">
                        <div class="base-value-field">
                            <label>Capacidade:</label>
                            <input type="text" 
                                   value="${escapeHtml(key)}" 
                                   placeholder="Ex: 35TR, 3100m³/h"
                                   onchange="updateBaseValueKey('${escapeHtml(key)}', this.value)"
                                   class="form-input">
                        </div>
                        <div class="base-value-field">
                            <label>Valor (R$):</label>
                            <input type="number" 
                                   value="${value}" 
                                   step="1"
                                   placeholder="0.00"
                                   onchange="updateBaseValue('${escapeHtml(key)}', this.value)"
                                   class="form-input">
                        </div>
                    </div>
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
            ${options.map((option, optionIndex) => {
                const values = option.values || {};
                const entries = Object.entries(values);
                
                return `
                <div class="option-item" data-index="${optionIndex}">
                    <div class="option-header" onclick="toggleOptionItem(${optionIndex}, event)">
                        <button class="minimizer">+</button>
                        <span>Opção ${optionIndex + 1}: ${escapeHtml(option.name || '')}</span>
                        <button class="btn btn-xs btn-danger" onclick="removeOption(${optionIndex}, event)" title="Remover">
                            <i class="icon-delete"></i>
                        </button>
                    </div>
                    <div class="option-content collapsed">
                        <div class="option-field">
                            <span class="option-label">Nome da Opção:</span>
                            <input type="text" 
                                   value="${escapeHtml(option.name || '')}" 
                                   placeholder="Nome da opção"
                                   oninput="syncOptionName(${optionIndex}, this.value)"
                                   onchange="updateOption(${optionIndex}, 'name', this.value)"
                                   class="form-input">
                        </div>
                        <div class="option-values">
                            <h5>Valores por Capacidade:</h5>
                            <div class="option-values-grid">
                                ${entries.map(([key, val], capacityIndex) => `
                                    <div class="option-value-item" data-key="${escapeHtml(key)}">
                                        <div class="option-value-header">
                                            <span>Capacidade ${capacityIndex + 1}</span>
                                            <button class="btn btn-xs btn-danger" 
                                                    onclick="removeOptionCapacity(${optionIndex}, '${escapeHtml(key)}', event)" 
                                                    title="Remover capacidade">
                                                <i class="icon-delete"></i>
                                            </button>
                                        </div>
                                        <div class="option-value-content">
                                            <div class="option-value-field">
                                                <label>Capacidade:</label>
                                                <input type="text" 
                                                    value="${escapeHtml(key)}" 
                                                    placeholder="Ex: 35TR, 3100m³/h"
                                                    onchange="updateOptionCapacityLabel(${optionIndex}, '${escapeHtml(key)}', this.value)"
                                                    class="form-input-small">
                                            </div>
                                            <div class="option-value-field">
                                                <label>Valor (R$):</label>
                                                <input type="number" 
                                                    value="${val}" 
                                                    step="1"
                                                    onchange="updateOptionValue(${optionIndex}, '${escapeHtml(key)}', this.value)"
                                                    class="form-input-small">
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                                ${entries.length === 0 ? '<p>Sem valores definidos</p>' : ''}
                            </div>
                            <div class="text-center" style="margin-top: var(--spacing-md);">
                                <button class="btn btn-xs btn-info" onclick="addOptionValue(${optionIndex}, event)">
                                    <i class="icon-add"></i> Adicionar Capacidade
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('')}
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