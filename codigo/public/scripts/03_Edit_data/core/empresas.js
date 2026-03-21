// scripts/03_Edit_data/empresas.js
// Gerenciamento de empresas com credenciais - Integrado com sistema geral

import { systemData, addPendingChange } from '../config/state.js';
import { escapeHtml, showError, showInfo, showWarning, showConfirmation, showSuccess } from '../config/ui.js';
import { normalizeEmpresa, normalizeEmpresas } from '../../01_Create_Obra/core/shared-utils.js';

// Função para formatar data no padrão DD/MM/AAAA
function formatarData(dataISO) {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para gerar token mais complexo usando hexadecimal e formatos variados
function generateToken(length = 32) {
    // Múltiplos formatos para tornar o token mais complexo
    const formats = [
        // UUID-like format (8-4-4-4-12)
        () => {
            const hex = () => Math.floor(Math.random() * 16).toString(16);
            const group = (size) => Array(size).fill().map(hex).join('');
            return `${group(8)}-${group(4)}-${group(4)}-${group(4)}-${group(12)}`;
        },
        // Base64-like com caracteres especiais
        () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            return Array(length).fill().map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
        },
        // Hexadecimal puro
        () => {
            return Array(length).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        },
        // Formato com timestamp e hash
        () => {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 15);
            const hash = Array(8).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            return `${timestamp}.${random}.${hash}`;
        }
    ];
    
    // Selecionar formato aleatório
    const selectedFormat = formats[Math.floor(Math.random() * formats.length)];
    let token = selectedFormat();
    
    // Garantir o tamanho mínimo
    if (token.length < length) {
        token += Array(length - token.length).fill().map(() => 
            Math.floor(Math.random() * 16).toString(16)).join('');
    }
    
    return token;
}

// Calcular data de expiração baseada no tempo de uso
function calcularDataExpiracao(tempoUso) {
    const data = new Date();
    data.setDate(data.getDate() + tempoUso);
    return data.toISOString();
}

// Função para atualizar a data de expiração no modal em tempo real
function atualizarDataExpiracao() {
    const tempoUsoRadio = document.querySelector('input[name="tempoUso"]:checked');
    if (!tempoUsoRadio) return;
    
    let tempoUso;
    
    if (tempoUsoRadio.value === 'personalizado') {
        const tempoPersonalizado = document.getElementById('tempoPersonalizado')?.value;
        tempoUso = parseInt(tempoPersonalizado);
        if (!tempoPersonalizado || isNaN(tempoUso) || tempoUso < 1) return;
    } else {
        tempoUso = parseInt(tempoUsoRadio.value);
    }
    
    const dataExpiracao = calcularDataExpiracao(tempoUso);
    const dataExpiracaoElement = document.getElementById('dataExpiracaoDisplay');
    if (dataExpiracaoElement) {
        dataExpiracaoElement.textContent = formatarData(dataExpiracao);
    }
}

// Modal de gerenciamento de credenciais - MODO ESCURO (apenas o modal)
function showCredentialsModal(index) {
    // Validar índice
    if (index === undefined || index === null || !systemData.empresas || !systemData.empresas[index]) {
        showError('Empresa não encontrada');
        return;
    }
    
    const empresa = normalizeEmpresa(systemData.empresas[index]);
    
    // Validar empresa
    if (!empresa) {
        showError('Dados da empresa inválidos');
        return;
    }
    
    // Remover modal existente se houver
    const existingModal = document.getElementById('credentialsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Verificar credenciais de forma segura
    const temCredenciais = empresa.credenciais && 
                          typeof empresa.credenciais === 'object' && 
                          empresa.credenciais !== null;
    
    // Valores padrão para o formulário
    const credenciais = temCredenciais ? empresa.credenciais : {
        usuario: '',
        email: '',
        token: generateToken(32),
        data_criacao: new Date().toISOString(),
        data_expiracao: calcularDataExpiracao(30),
        tempoUso: 30
    };
    
    // Garantir que todos os campos existam
    const usuarioAtual = credenciais.usuario || '';
    const emailAtual = credenciais.email || credenciais.recoveryEmail || '';
    const tokenAtual = credenciais.token || generateToken(32);
    const tempoUsoAtual = credenciais.tempoUso || 30;
    const dataCriacaoAtual = credenciais.data_criacao;
    const dataExpiracaoAtual = credenciais.data_expiracao;
    
    // Verificar se o tempo atual está nos valores predefinidos
    const isPredefinedTime = [30, 60, 90].includes(tempoUsoAtual);
    
    // Criar modal - MODO ESCURO (apenas o modal)
    const modal = document.createElement('div');
    modal.id = 'credentialsModal';
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    `;
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: #1a2634;
        padding: 24px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
        border: 1px solid #2d3748;
        color: #e2e8f0;
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #2d3748; padding-bottom: 16px;">
            <h2 style="margin: 0; color: #f7fafc; font-size: 1.5rem; font-weight: 600;">
                ${temCredenciais ? 'Editar' : 'Criar'} Credenciais - ${escapeHtml(empresa.codigo || '')}
            </h2>
            <button class="modal-close" style="
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #a0aec0;
                padding: 0 8px;
                line-height: 1;
                transition: all 0.2s ease;
                border-radius: 4px;
            " onmouseover="this.style.color='#f7fafc'; this.style.background='#2d3748'" 
               onmouseout="this.style.color='#a0aec0'; this.style.background='none'">&times;</button>
        </div>
        
        <div style="margin-bottom: 20px; background: #25303f; padding: 12px; border-radius: 6px; border-left: 4px solid #4a5568;">
            <p style="margin: 0 0 5px 0;"><strong style="color: #cbd5e0;">Empresa:</strong> <span style="color: #f7fafc;">${escapeHtml(empresa.nome || '')}</span></p>
            ${dataCriacaoAtual ? `
                <p style="margin: 0 0 5px 0;"><strong style="color: #cbd5e0;">Data de Criação:</strong> <span style="color: #f7fafc;">${formatarData(dataCriacaoAtual)}</span></p>
            ` : ''}
            <p style="margin: 0;"><strong style="color: #cbd5e0;">Data de Expiração:</strong> <span id="dataExpiracaoDisplay" style="color: #f7fafc; font-weight: 500;">${formatarData(dataExpiracaoAtual)}</span></p>
        </div>
        
        <form id="credentialsForm">
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #cbd5e0;">
                    Usuário:
                </label>
                <input type="text" id="usuarioInput" value="${escapeHtml(usuarioAtual)}" 
                       placeholder="Nome de usuário para acesso"
                       required
                       style="width: 100%; padding: 8px; border: 1px solid #2d3748; border-radius: 6px; font-size: 1rem; transition: all 0.2s ease; background: #2d3748; color: #f7fafc;"
                       onfocus="this.style.borderColor='#4a5568'; this.style.boxShadow='0 0 0 3px rgba(74, 85, 104, 0.3)'; this.style.outline='none'"
                       onblur="this.style.borderColor='#2d3748'; this.style.boxShadow='none'">
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #cbd5e0;">
                    Email de recuperacao:
                </label>
                <input type="email" id="emailInput" value="${escapeHtml(emailAtual)}" 
                       placeholder="Email usado para recuperar o token"
                       style="width: 100%; padding: 8px; border: 1px solid #2d3748; border-radius: 6px; font-size: 1rem; transition: all 0.2s ease; background: #2d3748; color: #f7fafc;"
                       onfocus="this.style.borderColor='#4a5568'; this.style.boxShadow='0 0 0 3px rgba(74, 85, 104, 0.3)'; this.style.outline='none'"
                       onblur="this.style.borderColor='#2d3748'; this.style.boxShadow='none'">
                <small style="color: #a0aec0; display: block; margin-top: 5px; font-size: 0.85rem;">
                    Este email recebera o token caso o cliente esqueca o acesso.
                </small>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #cbd5e0;">
                    Token de Acesso:
                </label>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <input type="text" id="tokenInput" value="${escapeHtml(tokenAtual)}" 
                           placeholder="Token gerado automaticamente"
                           readonly
                           required
                           style="flex: 1; padding: 8px; border: 1px solid #2d3748; border-radius: 6px; background: #25303f; font-family: monospace; font-size: 0.9rem; color: #cbd5e0;">
                    <button type="button" onclick="window.generateNewToken()" 
                            class="btn btn-secondary"
                            style="padding: 8px 16px; white-space: nowrap; background: #4a5568; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s ease;"
                            onmouseover="this.style.background='#5f6b7a'" 
                            onmouseout="this.style.background='#4a5568'">
                        Gerar Novo
                    </button>
                </div>
                <small style="color: #a0aec0; display: block; font-size: 0.85rem;">
                    Token complexo gerado automaticamente com formatos variados (hex, uuid, base64)
                </small>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #cbd5e0;">
                    Tempo de Uso (dias):
                </label>
                <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 10px;">
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #cbd5e0;">
                        <input type="radio" name="tempoUso" value="30" ${isPredefinedTime && tempoUsoAtual === 30 ? 'checked' : ''} onchange="window.atualizarDataExpiracao(); toggleTempoPersonalizado(false);" style="accent-color: #4a5568;">
                        <span>30 dias</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #cbd5e0;">
                        <input type="radio" name="tempoUso" value="60" ${isPredefinedTime && tempoUsoAtual === 60 ? 'checked' : ''} onchange="window.atualizarDataExpiracao(); toggleTempoPersonalizado(false);" style="accent-color: #4a5568;">
                        <span>60 dias</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #cbd5e0;">
                        <input type="radio" name="tempoUso" value="90" ${isPredefinedTime && tempoUsoAtual === 90 ? 'checked' : ''} onchange="window.atualizarDataExpiracao(); toggleTempoPersonalizado(false);" style="accent-color: #4a5568;">
                        <span>90 dias</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #cbd5e0;">
                        <input type="radio" name="tempoUso" value="personalizado" ${!isPredefinedTime ? 'checked' : ''} onchange="window.atualizarDataExpiracao(); toggleTempoPersonalizado(true);" style="accent-color: #4a5568;">
                        <span>Personalizado</span>
                    </label>
                </div>
                
                <div id="tempoPersonalizadoContainer" style="margin-top: 10px; ${!isPredefinedTime ? 'display: block;' : 'display: none;'}">
                    <input type="number" id="tempoPersonalizado" 
                           value="${!isPredefinedTime ? tempoUsoAtual : ''}" 
                           placeholder="Digite o número de dias"
                           min="1" max="999"
                           oninput="window.atualizarDataExpiracao()"
                           style="width: 100%; padding: 8px; border: 1px solid #2d3748; border-radius: 6px; font-size: 1rem; background: #2d3748; color: #f7fafc;"
                           onfocus="this.style.borderColor='#4a5568'; this.style.outline='none'"
                           onblur="this.style.borderColor='#2d3748'">
                    <small style="color: #a0aec0; display: block; margin-top: 5px; font-size: 0.85rem;">
                        Digite um valor personalizado (1 a 999 dias)
                    </small>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; border-top: 1px solid #2d3748; padding-top: 20px;">
                <button type="button" onclick="document.getElementById('credentialsModal')?.remove()" 
                        class="btn btn-secondary"
                        style="padding: 8px 16px; background: #4a5568; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s ease;"
                        onmouseover="this.style.background='#5f6b7a'" 
                        onmouseout="this.style.background='#4a5568'">
                    Cancelar
                </button>
                <button type="submit" class="btn btn-success"
                        style="padding: 8px 16px; background: linear-gradient(135deg, #2D774E 0%, #298650 100%); color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: opacity 0.2s ease;"
                        onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                    ${temCredenciais ? 'Atualizar' : 'Salvar'} Credenciais
                </button>
            </div>
        </form>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Adicionar eventos
    const closeBtn = modalContent.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    const form = document.getElementById('credentialsForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCredentials(index);
    });
    
    // Adicionar funções globais para o modal
    window.toggleTempoPersonalizado = function(show) {
        const container = document.getElementById('tempoPersonalizadoContainer');
        if (container) {
            container.style.display = show ? 'block' : 'none';
        }
    };
    
    window.atualizarDataExpiracao = atualizarDataExpiracao;
}

// Função global para gerar novo token
window.generateNewToken = function() {
    const tokenInput = document.getElementById('tokenInput');
    if (tokenInput) {
        tokenInput.value = generateToken(32);
    }
};

// Função para salvar credenciais (apenas localmente, sem chamada API)
window.saveCredentials = function(empresaIndex) {
    try {
        const usuario = document.getElementById('usuarioInput')?.value;
        const email = document.getElementById('emailInput')?.value?.trim() || '';
        const token = document.getElementById('tokenInput')?.value;
        
        // Pegar o valor do radio button selecionado
        const tempoUsoRadio = document.querySelector('input[name="tempoUso"]:checked');
        
        if (!tempoUsoRadio) {
            showError('Selecione o tempo de uso');
            return;
        }
        
        let tempoUso;
        
        if (tempoUsoRadio.value === 'personalizado') {
            // Usar valor personalizado
            const tempoPersonalizado = document.getElementById('tempoPersonalizado')?.value;
            tempoUso = parseInt(tempoPersonalizado);
            
            if (!tempoPersonalizado || isNaN(tempoUso) || tempoUso < 1) {
                showError('Digite um valor válido para o tempo personalizado (mínimo 1 dia)');
                return;
            }
            
            if (tempoUso > 999) {
                showError('O tempo máximo é 999 dias');
                return;
            }
        } else {
            // Usar valor predefinido
            tempoUso = parseInt(tempoUsoRadio.value);
        }
        
        // Validações
        if (!usuario || usuario.trim() === '') {
            showError('O campo usuário é obrigatório');
            return;
        }
        
        if (!token || token.trim() === '') {
            showError('O token é obrigatório. Clique em "Gerar Novo" para criar um token.');
            return;
        }
        
        // Validar empresa
        if (!systemData.empresas || !systemData.empresas[empresaIndex]) {
            showError('Empresa não encontrada');
            return;
        }
        
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Informe um email valido para recuperacao.');
            return;
        }

        const empresa = normalizeEmpresa(systemData.empresas[empresaIndex]);
        
        // Calcular datas
        const dataCriacao = new Date().toISOString();
        const dataExpiracao = calcularDataExpiracao(tempoUso);
        
        // Criar objeto de credenciais
        const credenciais = {
            usuario: usuario.trim(),
            email,
            token: token.trim(),
            data_criacao: dataCriacao,
            data_expiracao: dataExpiracao,
            tempoUso: tempoUso
        };
        
        // Atualizar localmente
        systemData.empresas[empresaIndex] = {
            ...empresa,
            credenciais: credenciais
        };
        
        // Fechar modal
        document.getElementById('credentialsModal')?.remove();
        
        // Recarregar tabela
        loadEmpresas();
        
        // Sinalizar que houve mudança para o sistema geral de salvamento
        addPendingChange('empresas');
        
        showSuccess(`Credenciais ${empresa.credenciais ? 'atualizadas' : 'criadas'} com sucesso!`);
        
    } catch (error) {
        console.error('Erro no formulário:', error);
        showError('Erro ao processar formulário');
    }
};

// Função para remover credenciais (apenas localmente, sem chamada API)
async function removeCredentials(index, sigla) {
    try {
        if (!systemData.empresas || !systemData.empresas[index]) {
            showError('Empresa não encontrada');
            return;
        }
        
        const empresa = normalizeEmpresa(systemData.empresas[index]);
        
        showConfirmation(`Deseja remover as credenciais da empresa "${sigla}"?`, async () => {
            try {
                // Atualizar localmente
                systemData.empresas[index] = {
                    ...empresa,
                    credenciais: null
                };
                
                loadEmpresas();
                
                // Sinalizar que houve mudança para o sistema geral de salvamento
                addPendingChange('empresas');
                
                showWarning(`Credenciais removidas da empresa "${sigla}".`);
                
            } catch (error) {
                console.error('Erro ao remover credenciais:', error);
                showError(`Erro ao remover credenciais: ${error.message}`);
            }
        });
    } catch (error) {
        console.error('Erro ao processar remoção:', error);
        showError('Erro ao processar remoção de credenciais');
    }
}

export function loadEmpresas() {
    const tbody = document.getElementById('empresasTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!systemData.empresas || !Array.isArray(systemData.empresas)) {
        systemData.empresas = [];
        return;
    }

    systemData.empresas = normalizeEmpresas(systemData.empresas);
    
    if (systemData.empresas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: var(--spacing-xl, 30px);">
                    <div class="empty-state">
                        <i class="icon-company" style="font-size: 48px; opacity: 0.5; color: var(--color-gray-400, #94A3B8);"></i>
                        <h3 style="color: var(--color-gray-700, #334155); margin: var(--spacing-md, 16px) 0 var(--spacing-sm, 8px);">Nenhuma empresa cadastrada</h3>
                        <p style="color: var(--color-gray-500, #64748B); margin-bottom: var(--spacing-lg, 20px);">Clique no botão abaixo para adicionar sua primeira empresa.</p>
                        <button class="btn btn-success" onclick="addEmpresa()" style="padding: var(--spacing-sm, 8px) var(--spacing-lg, 20px); background: var(--success-gradient); color: var(--text-primary, white); border: none; border-radius: var(--border-radius, 4px); font-weight: 500; cursor: pointer; transition: opacity 0.2s ease;">
                            <i class="icon-add"></i> Adicionar Primeira Empresa
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    systemData.empresas.forEach((empresa, index) => {
        const empresaNormalizada = normalizeEmpresa(empresa);
        const sigla = empresaNormalizada?.codigo || '';
        const nome = empresaNormalizada?.nome || '';
        const temCredenciais = empresaNormalizada?.credenciais && 
                              typeof empresaNormalizada.credenciais === 'object' && 
                              empresaNormalizada.credenciais !== null;
        const credenciais = temCredenciais ? empresaNormalizada.credenciais : null;
        
        // Verificar se token está expirado
        const tokenExpirado = credenciais?.data_expiracao ? 
            new Date(credenciais.data_expiracao) < new Date() : false;
        
        const row = document.createElement('tr');
        row.style.cssText = `
            border-bottom: 1px solid var(--color-gray-200, #E2E8F0);
            transition: background 0.2s ease;
        `;
        row.addEventListener('mouseover', () => {
            row.style.background = 'var(--color-gray-50, #F8FAFC)';
        });
        row.addEventListener('mouseout', () => {
            row.style.background = 'transparent';
        });
        
        row.innerHTML = `
            <td style="padding: var(--spacing-sm, 8px);">
                <input type="text" value="${escapeHtml(sigla)}"
                       onchange="updateEmpresaSigla(${index}, this.value)"
                       placeholder="Sigla"
                       class="form-input" maxlength="10"
                       style="width: 100%; padding: var(--spacing-xs, 6px) var(--spacing-sm, 10px); border: 1px solid var(--color-gray-300, #CBD5E0); border-radius: var(--border-radius, 4px); font-size: 0.95rem; transition: border-color 0.2s ease;"
                       onfocus="this.style.borderColor='var(--color-primary, #4A5568)'"
                       onblur="this.style.borderColor='var(--color-gray-300, #CBD5E0)'">
            </td>
            <td style="padding: var(--spacing-sm, 8px);">
                <input type="text" value="${escapeHtml(nome)}"
                       onchange="updateEmpresaNome(${index}, this.value)"
                       placeholder="Nome completo da empresa"
                       class="form-input"
                       style="width: 100%; padding: var(--spacing-xs, 6px) var(--spacing-sm, 10px); border: 1px solid var(--color-gray-300, #CBD5E0); border-radius: var(--border-radius, 4px); font-size: 0.95rem; transition: border-color 0.2s ease;"
                       onfocus="this.style.borderColor='var(--color-primary, #4A5568)'"
                       onblur="this.style.borderColor='var(--color-gray-300, #CBD5E0)'">
            </td>
            <td class="credentials-cell" style="padding: var(--spacing-sm, 8px);">
                ${temCredenciais ? `
                    <div class="credentials-info" style="display: flex; align-items: center; gap: var(--spacing-sm, 10px); justify-content: center; flex-wrap: wrap;">
                        <span class="badge ${tokenExpirado ? 'badge-danger' : 'badge-success'}" style="
                            background: ${tokenExpirado ? 'var(--danger-gradient, #C53030)' : 'var(--success-gradient, #2D774E)'};
                            color: var(--text-primary, white);
                            padding: 4px var(--spacing-xs, 8px);
                            border-radius: var(--border-radius, 4px);
                            font-size: 12px;
                            white-space: nowrap;
                            font-weight: 500;
                        ">
                            <i class="icon-${tokenExpirado ? 'warning' : 'check'}"></i> 
                            ${tokenExpirado ? 'Expirado' : 'Ativo'}
                        </span>
                        <small style="color: var(--color-gray-500, #666);" title="Expira em: ${credenciais?.data_expiracao ? formatarData(credenciais.data_expiracao) : ''}">
                            ${escapeHtml(credenciais?.usuario || '')} | ${credenciais?.tempoUso || 30}d
                        </small>
                        <small style="color: var(--color-gray-500, #666);">
                            ${escapeHtml(credenciais?.email || credenciais?.recoveryEmail || 'Sem email cadastrado')}
                        </small>
                        <div style="display: flex; gap: var(--spacing-xs, 5px);">
                            <button class="btn btn-small btn-info" 
                                    onclick="showCredentialsModal(${index})"
                                    title="Editar credenciais"
                                    style="padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); background: var(--info-gradient, linear-gradient(135deg, #3182CE 0%, #63B3ED 100%)); color: var(--text-primary, white); border: none; border-radius: var(--border-radius, 4px); cursor: pointer; transition: opacity 0.2s ease;"
                                    onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                                <i class="icon-edit"></i>
                            </button>
                            <button class="btn btn-small btn-warning" 
                                    onclick="removeCredentials(${index}, '${sigla}')"
                                    title="Remover credenciais"
                                    style="padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); background: var(--warning-gradient, linear-gradient(135deg, #139090 0%)); color: var(--text-primary, white); border: none; border-radius: var(--border-radius, 4px); cursor: pointer; transition: opacity 0.2s ease;"
                                    onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                                <i class="icon-delete"></i>
                            </button>
                        </div>
                    </div>
                ` : `
                    <button class="btn btn-small btn-success" 
                            onclick="showCredentialsModal(${index})"
                            title="Criar credenciais"
                            style="padding: var(--spacing-xs, 4px) var(--spacing-sm, 10px); background: var(--success-gradient); color: var(--text-primary, white); border: none; border-radius: var(--border-radius, 4px); cursor: pointer; font-size: 0.9rem; transition: opacity 0.2s ease;"
                            onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                        <i class="icon-add"></i> Criar Login
                    </button>
                `}
            </td>
            <td class="actions-cell" style="padding: var(--spacing-sm, 8px); text-align: center;">
                <button class="btn btn-small btn-danger"
                        onclick="deleteEmpresa(${index}, '${sigla}')"
                        title="Excluir empresa"
                        style="padding: var(--spacing-xs, 4px) var(--spacing-sm, 10px); background: var(--danger-gradient); color: var(--text-primary, white); border: none; border-radius: var(--border-radius, 4px); cursor: pointer; transition: opacity 0.2s ease;"
                        onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                    <i class="icon-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
        <td colspan="4" style="text-align: center; padding: var(--spacing-lg, 20px); background: var(--color-gray-50, #F8FAFC);">
            <button class="btn btn-success" onclick="addEmpresa()" style="padding: var(--spacing-sm, 8px) var(--spacing-lg, 20px); background: var(--success-gradient); color: var(--text-primary, white); border: none; border-radius: var(--border-radius, 4px); font-weight: 500; cursor: pointer; transition: opacity 0.2s ease;">
                <i class="icon-add"></i> Adicionar Nova Empresa
            </button>
        </td>
    `;
    tbody.appendChild(emptyRow);
}

export function addEmpresa() {
    const newSigla = `NOV${Date.now().toString().slice(-3)}`;
    systemData.empresas.push({ 
        codigo: newSigla, 
        nome: `Nova Empresa ${newSigla}`, 
        credenciais: null 
    });
    loadEmpresas();
    addPendingChange('empresas');
    showInfo('Nova empresa adicionada. Edite os detalhes.');
    
    setTimeout(() => {
        const lastRow = document.querySelector('#empresasTableBody tr:nth-last-child(2)');
        if (lastRow) {
            lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = lastRow.querySelector('input[type="text"]');
            if (input) input.focus();
        }
    }, 100);
}

export function updateEmpresaSigla(index, newSigla) {
    try {
        if (!systemData.empresas || !systemData.empresas[index]) {
            showError('Empresa não encontrada');
            return;
        }
        
        const empresa = normalizeEmpresa(systemData.empresas[index]);
        const oldSigla = empresa?.codigo;
        
        if (newSigla && newSigla.trim() !== '' && newSigla !== oldSigla) {
            const siglaExists = systemData.empresas.some((emp, idx) => {
                if (idx === index) return false;
                const empSigla = normalizeEmpresa(emp)?.codigo;
                return empSigla === newSigla;
            });
            
            if (siglaExists) {
                showError(`A sigla "${newSigla}" já existe!`);
                return;
            }
            
            systemData.empresas[index] = {
                ...empresa,
                codigo: newSigla
            };
            loadEmpresas();
            addPendingChange('empresas');
            showInfo(`Sigla alterada: "${oldSigla}" → "${newSigla}"`);
        }
    } catch (error) {
        console.error('Erro ao atualizar sigla:', error);
        showError('Erro ao atualizar sigla');
    }
}

export function updateEmpresaNome(index, newNome) {
    try {
        if (!systemData.empresas || !systemData.empresas[index]) {
            showError('Empresa não encontrada');
            return;
        }
        
        const empresa = normalizeEmpresa(systemData.empresas[index]);
        
        if (newNome && newNome.trim() !== '' && newNome !== empresa?.nome) {
            systemData.empresas[index] = {
                ...empresa,
                nome: newNome
            };
            addPendingChange('empresas');
        }
    } catch (error) {
        console.error('Erro ao atualizar nome:', error);
        showError('Erro ao atualizar nome');
    }
}

export async function deleteEmpresa(index, sigla) {
    try {
        if (!systemData.empresas || !systemData.empresas[index]) {
            showError('Empresa não encontrada');
            return;
        }
        
        const empresa = normalizeEmpresa(systemData.empresas[index]);
        const nome = empresa?.nome || '';
        
        showConfirmation(`Deseja excluir a empresa "${sigla} - ${nome}"?`, async () => {
            try {
                // Remover localmente
                systemData.empresas.splice(index, 1);
                loadEmpresas();
                
                // Sinalizar que houve mudança para o sistema geral de salvamento
                addPendingChange('empresas');
                
                showWarning(`Empresa "${sigla}" excluída.`);
                
            } catch (error) {
                console.error('Erro ao excluir empresa:', error);
                showError(`Erro ao excluir empresa: ${error.message}`);
            }
        });
    } catch (error) {
        console.error('Erro ao processar exclusão:', error);
        showError('Erro ao processar exclusão da empresa');
    }
}

// Exportar funções globalmente
window.loadEmpresas = loadEmpresas;
window.addEmpresa = addEmpresa;
window.updateEmpresaSigla = updateEmpresaSigla;
window.updateEmpresaNome = updateEmpresaNome;
window.deleteEmpresa = deleteEmpresa;
window.showCredentialsModal = showCredentialsModal;
window.removeCredentials = removeCredentials;
window.generateToken = generateToken;
