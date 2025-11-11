/**
 * features/managers/obra-manager.js
 * 🎯 FUSÃO COMPLETA: projects.js + obra-manager.js
 * ⚡ REDUÇÃO: 2 arquivos → 1 arquivo (~700 → ~450 linhas)
 */
import{getNextObraNumber} from '../../data/utils/data-utils.js'
import { ensureStringId, generateObraId } from '../../data/utils/id-generator.js';
import { buildObraData } from '../../data/builders/data-builders.js';
import { showSystemStatus } from '../../ui/components/status.js';
import { showConfirmationModal } from '../../ui/components/modal.js';
import { addNewProjectToObra } from './project-manager.js';
import { isSessionActive, startSessionOnFirstSave } from '../../data/adapters/session-adapter.js';
import { calculateRoomCompletionStats } from '../../ui/helpers.js';

/**
 * 🏗️ FUNÇÕES DE CONSTRUÇÃO DE INTERFACE (obra-manager.js)
 */

function buildObraHTML(obraName, obraId, hasId = false) {
    if (!obraId || obraId === 'undefined' || obraId === 'null') {
        console.error(`ERRO FALBACK (buildObraHTML) [ID de obra inválido: ${obraId}]`);
        obraId = generateObraId();
    }
    
    console.log(`🔍 Build Obra HTML: ${obraName}, ID: ${obraId}`);

    return `
    <div class="obra-block" data-obra-id="${obraId}" data-obra-name="${obraName}">
        <div class="obra-header">
            <button class="minimizer" onclick="toggleObra('${obraId}', event)">+</button>
            <h2 class="obra-title compact-title editable-title" data-editable="true" onclick="makeEditable(this, 'obra')">${obraName}</h2>
            <div class="obra-header-spacer"><span>Adicionar campos de cadastro de empresas</span></div>
            <div class="obra-actions">
                <button class="btn btn-delete" onclick="window.deleteObra('${obraName}', '${obraId}')">Remover Obra</button>
            </div>
        </div>

        <div class="obra-content collapsed" id="obra-content-${obraId}">
            <div class="projetc-header-record very-dark">
                <span>Adicionar campos de cadastro de empresas</span>
            </div>
            <div class="projects-container" id="projects-${obraId}"></div>
            <div class="add-project-section">
                <button class="btn btn-add-secondary" onclick="addNewProjectToObra('${obraId}')">+ Adicionar Projeto</button>
            </div>
            ${buildObraActionsFooter(obraId, obraName, hasId)} 
        </div>
    </div>
    `;
}

function buildObraActionsFooter(obraId, obraName, hasId = false) {
    const buttonText = hasId ? "Atualizar Obra" : "Salvar Obra";
    const buttonClass = hasId ? "btn-update" : "btn-save";

    console.log(`🔧 Build Obra Footer: ${obraName}, ID: ${obraId}, HasId: ${hasId}, Button: ${buttonText}`);

    return `
    <div class="obra-actions-footer">
        <button class="btn btn-verify" onclick="verifyObraData('${obraId}')">Verificar Dados</button>
        <button class="btn ${buttonClass}" onclick="event.preventDefault(); saveOrUpdateObra('${obraId}')">${buttonText}</button>      
        <button class="btn btn-download" onclick="downloadPDF('${obraId}')">Baixar PDF</button>
        <button class="btn btn-download" onclick="downloadWord('${obraId}')">Baixar Word</button>
    </div>
    `;
}

async function insertObraIntoDOM(obraHTML, obraId) {
    console.log(`📤 Inserindo obra no DOM: ${obraId}`);
    
    const projectsContainer = document.getElementById("projects-container");
    
    if (!projectsContainer) {
        console.error('❌ Container de projetos não encontrado');
        
        const mainContent = document.querySelector('main, body');
        if (mainContent) {
            const newContainer = document.createElement('div');
            newContainer.id = 'projects-container';
            newContainer.innerHTML = '<!-- Hierarquia: Obra → Projeto → Sala -->';
            mainContent.appendChild(newContainer);
            console.log('✅ projects-container criado');
            return insertObraIntoDOM(obraHTML, obraId);
        }
        
        return false;
    }
    
    console.log(`✅ Container encontrado, inserindo obra ${obraId}...`);
    console.log(`📦 Container antes:`, projectsContainer.children.length, 'elementos');
    
    try {
        projectsContainer.insertAdjacentHTML("beforeend", obraHTML);
        
        setTimeout(() => {
            const obraInserida = document.querySelector(`[data-obra-id="${obraId}"]`);
            if (obraInserida) {
                console.log(`✅ Obra ${obraId} INSERIDA COM SUCESSO no container`);
                console.log(`📦 Container depois:`, projectsContainer.children.length, 'elementos');
            } else {
                console.error(`❌ FALHA: Obra ${obraId} NÃO FOI INSERIDA no container`);
            }
        }, 50);
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao inserir obra no DOM:', error);
        return false;
    }
}

async function createEmptyObra(obraName, obraId) {
    const finalObraId = obraId || generateObraId();
    const obraHTML = buildObraHTML(obraName, finalObraId);
    
    console.log(`🏗️ Criando obra: ${obraName} com ID: ${finalObraId}`);
    console.log(`📝 HTML gerado:`, obraHTML.substring(0, 200) + '...');
    
    const inserted = await insertObraIntoDOM(obraHTML, finalObraId);
    
    if (inserted) {
        console.log(`✅ Obra ${obraName} criada e INSERIDA NO DOM - ID: ${finalObraId}`);
        
        setTimeout(() => {
            const obraNoDOM = document.querySelector(`[data-obra-id="${finalObraId}"]`);
            if (obraNoDOM) {
                console.log(`✅ CONFIRMADO: Obra ${finalObraId} encontrada no DOM`);
            } else {
                console.error(`❌ FALHA CRÍTICA: Obra ${finalObraId} NÃO está no DOM após criação`);
            }
        }, 100);
    } else {
        console.error(`❌ FALHA: Obra ${obraName} NÃO FOI INSERIDA NO DOM`);
    }
    
    return inserted;
}

/**
 * 🔄 FUNÇÕES DE ATUALIZAÇÃO DE INTERFACE
 */

function updateObraButtonAfterSave(obraName, obraId) {
    console.log(`🔄 Atualizando botão da obra: ${obraName} (${obraId})`);
    
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraBlock) {
        console.error(`❌ Obra com ID ${obraId} não encontrada para atualizar botão`);
        return;
    }

    obraBlock.dataset.obraId = obraId;

    const obraContent = document.getElementById(`obra-content-${obraId}`);
    if (!obraContent) {
        console.error(`❌ Conteúdo da obra ${obraId} não encontrado`);
        return;
    }

    const oldFooter = obraContent.querySelector('.obra-actions-footer');
    if (!oldFooter) {
        console.error(`❌ Rodapé não encontrado na obra ${obraId}`);
        return;
    }

    const saveButton = oldFooter.querySelector('.btn-save, .btn-update');
    if (saveButton) {
        saveButton.textContent = "Atualizar Obra";
        saveButton.className = "btn btn-update";
        saveButton.setAttribute('onclick', `event.preventDefault(); saveOrUpdateObra('${obraId}')`);
        console.log(`✅ Botão atualizado para: "Atualizar Obra" (ID: ${obraId})`);
    } else {
        console.error(`❌ Botão de salvar não encontrado na obra ${obraId}`);
    }

    const projectsContainer = document.getElementById(`projects-${obraId}`);
    if (!projectsContainer) {
        console.error(`❌ CRÍTICO: Container de projetos PERDIDO na obra ${obraId}!`);
    }
}



/**
 * 🚀 FUNÇÕES PRINCIPAIS DE GERENCIAMENTO
 */

async function addNewObra() {
    try {
        const obraNumber = getNextObraNumber();
        const obraName = `Obra${obraNumber}`;
        const obraId = generateObraId();

        console.log(`🏗️ Criando nova obra: ${obraName} com ID: ${obraId}`);
        await createEmptyObra(obraName, obraId);
        console.log(`✅ ${obraName} adicionada com ID único: ${obraId}`);

        setTimeout(async () => {
            console.log(`🔄 Criando projeto e sala automáticos para ${obraName}`);
            if (typeof window.addNewProjectToObra === 'function') {
                await window.addNewProjectToObra(obraId);
                console.log(`✅ Projeto e sala automáticos criados para ${obraName}`);
            } else {
                console.error('❌ addNewProjectToObra não disponível');
            }
        }, 500);

    } catch (error) {
        console.error("❌ Erro ao adicionar nova obra:", error);
        alert("Erro ao criar nova obra. Verifique o console para detalhes.");
    }
}

async function deleteObra(obraName, obraId) {
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraBlock) {
        console.error(`❌ Obra com ID ${obraId} não encontrada`);
        return;
    }

    showConfirmationModal(obraName, obraId, obraBlock);
}

/**
 * 💾 FUNÇÕES DE PERSISTÊNCIA (projects.js)
 */

async function fetchObras() {
    try {
        const response = await fetch('/obras');

        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const obras = await response.json();
        return obras || [];
    } catch (error) {
        console.error("❌ Erro ao buscar obras:", error);
        return [];
    }
}

async function atualizarObra(obraId, obraData) {
    try {
        if (!obraId || obraId === 'undefined' || obraId === 'null') {
            console.error(`ERRO FALBACK (atualizarObra) [ID de obra inválido: ${obraId}]`);
            showSystemStatus("ERRO: ID da obra inválido para atualização", "error");
            return null;
        }

        if (!isSessionActive()) {
            console.warn("⚠️ Sessão não está ativa - obra não será atualizada");
            showSystemStatus("ERRO: Sessão não está ativa. Obra não atualizada.", "error");
            return null;
        }

        obraId = ensureStringId(obraId);

        console.log(`🔍 Verificando se obra ${obraId} existe no servidor...`);
        
        const todasObrasResponse = await fetch('/api/backup-completo');
        if (!todasObrasResponse.ok) {
            throw new Error('Falha ao carregar backup para verificação');
        }
        
        const backupData = await todasObrasResponse.json();
        const todasObras = backupData.obras || [];
        const obraExistente = todasObras.find(obra => String(obra.id) === String(obraId));
        
        console.log(`📊 Verificação: Obra ${obraId} existe? ${!!obraExistente}`);
        console.log(`📋 TODAS as obras no backup:`, todasObras.map(o => ({ id: o.id, nome: o.nome })));

        if (!obraExistente) {
            console.log(`❌ Obra ${obraId} não encontrada no backup, criando nova...`);
            console.log(`🆕 Criando nova obra com ID seguro preservado: ${obraId}`);
            obraData.id = obraId;
            return await salvarObra(obraData);
        }

        console.log('🔄 ATUALIZANDO OBRA EXISTENTE:', {
            id: obraData.id,
            nome: obraData.nome,
            projetos: obraData.projetos?.length || 0
        });

        const url = `/obras/${obraId}`;
        console.log(`🎯 Fazendo PUT para: ${url}`);
        
        const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(obraData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao atualizar obra: ${errorText}`);
        }

        const updatedObra = await response.json();
        showSystemStatus("Obra atualizada com sucesso!", "success");
        
        console.log('✅ OBRA ATUALIZADA:', {
            id: updatedObra.id,
            nome: updatedObra.nome,
            projetos: updatedObra.projetos?.length || 0
        });
        return updatedObra;
    } catch (error) {
        console.error("❌ Erro ao ATUALIZAR obra:", error);
        showSystemStatus("ERRO: Não foi possível atualizar a obra", "error");
        return null;
    }
}

async function salvarObra(obraData) {
    try {
        if (!obraData || !obraData.nome) {
            console.error(`ERRO FALBACK (salvarObra) [Dados da obra inválidos: ${JSON.stringify(obraData)}]`);
            showSystemStatus("ERRO: Dados da obra inválidos", "error");
            return null;
        }

        if (!isSessionActive()) {
            console.warn("⚠️ Sessão não está ativa - obra não será salva");
            showSystemStatus("ERRO: Sessão não está ativa. Obra não salva.", "error");
            return null;
        }

        if (!obraData.id || obraData.id === 'undefined' || obraData.id === 'null') {
            console.error(`ERRO FALBACK (salvarObra) [Obra sem ID seguro: ${obraData.id}]`);
            showSystemStatus("ERRO: Obra não possui ID válido", "error");
            return null;
        }

        console.log('📤 SALVANDO NOVA OBRA:', {
            id: obraData.id,
            nome: obraData.nome,
            projetos: obraData.projetos?.length || 0,
            timestamp: obraData.timestamp
        });

        const response = await fetch('/obras', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(obraData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao salvar obra: ${errorText}`);
        }

        const createdObra = await response.json();
        
        console.log(`📝 Adicionando obra ${createdObra.id} à sessão...`);
        await fetch('/api/sessions/add-obra', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ obra_id: createdObra.id })
        });
        
        showSystemStatus("Obra salva com sucesso!", "success");
        
        console.log('✅ NOVA OBRA SALVA E ADICIONADA À SESSÃO:', {
            id: createdObra.id,
            nome: createdObra.nome,
            projetos: createdObra.projetos?.length || 0
        });
        return createdObra;
    } catch (error) {
        console.error("❌ Erro ao SALVAR obra:", error);
        showSystemStatus("ERRO: Não foi possível salvar a obra", "error");
        return null;
    }
}

/**
 * 🔍 FUNÇÕES AUXILIARES DE BUSCA E VERIFICAÇÃO
 */

function findObraBlock(obraId) {
    console.log(`🔍 Buscando obra pelo ID: "${obraId}"`);
    
    let obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (obraBlock) {
        console.log(`✅ Obra encontrada por ID exato: "${obraId}"`);
        return obraBlock;
    }
    
    const todasObras = document.querySelectorAll('[data-obra-id]');
    console.log(`📋 Obras encontradas no DOM: ${todasObras.length}`);
    
    todasObras.forEach((obra, index) => {
        console.log(`  ${index + 1}.`, {
            id: obra.dataset.obraId,
            name: obra.dataset.obraName,
            classes: obra.className
        });
    });
    
    console.log(`❌ Obra com ID "${obraId}" não encontrada no DOM`);
    return null;
}

async function findObraBlockWithRetry(obraId, maxAttempts = 10) {
    console.log(`🔍 Buscando obra com retry: "${obraId}"`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
        
        if (obraBlock) {
            console.log(`✅ Obra encontrada na tentativa ${attempt}/${maxAttempts}`);
            return obraBlock;
        }
        
        console.log(`⏳ Tentativa ${attempt}/${maxAttempts} - obra não encontrada, aguardando...`);
        
        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    console.log(`❌ Obra não encontrada após ${maxAttempts} tentativas`);
    return null;
}



/**
 * 💾 FUNÇÃO PRINCIPAL DE SALVAMENTO
 */

async function saveObra(obraId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log(`💾 SALVANDO OBRA pelo ID: "${obraId}"`);

    let obraBlock = await findObraBlockWithRetry(obraId, 15);
    
    if (!obraBlock) {
        console.error('❌ Obra não encontrada no DOM após múltiplas tentativas:', obraId);
        
        const todasObras = document.querySelectorAll('[data-obra-id]');
        console.log('📋 Obras disponíveis no DOM:', Array.from(todasObras).map(o => ({
            id: o.dataset.obraId,
            name: o.dataset.obraName
        })));
        
        showSystemStatus("ERRO: Obra não encontrada na interface", "error");
        return;
    }

    const obraOriginalReference = obraBlock;
    const obraContainer = obraBlock.parentElement;
    
    console.log('🔒 REFERÊNCIA SALVA:', {
        obra: obraOriginalReference,
        container: obraContainer,
        obraNoContainer: obraContainer.contains(obraOriginalReference)
    });

    if (!isSessionActive()) {
        console.log("🆕 Iniciando sessão para primeira obra...");
        await startSessionOnFirstSave();
    }

    if (!isSessionActive()) {
        console.warn("⚠️ Sessão não está ativa - obra não será salva");
        showSystemStatus("ERRO: Sessão não está ativa. Obra não salva.", "error");
        return;
    }

    console.log('✅ Obra confirmada no DOM:', {
        element: obraBlock,
        dataset: obraBlock.dataset,
        id: obraBlock.dataset.obraId,
        name: obraBlock.dataset.obraName
    });

    console.log('🔨 Construindo dados da obra...');
    const obraData = buildObraData(obraBlock);

    if (!obraData) {
        console.error('❌ Falha ao construir dados da obra');
        showSystemStatus("ERRO: Falha ao construir dados da obra", "error");
        return;
    }

    const obraIdFromDOM = obraBlock.dataset.obraId;
    const obraIdFromData = obraData.id;
    const finalObraId = obraIdFromDOM || obraIdFromData;
    
    console.log('🔍 VERIFICAÇÃO DE OBRA MELHORADA:');
    console.log('- ID no DOM:', obraIdFromDOM);
    console.log('- ID nos dados:', obraIdFromData);
    console.log('- ID final para uso:', finalObraId);
    console.log('- É ID seguro?:', finalObraId?.startsWith('obra_'));
    
    let isNewObra = true;
    
    try {
        const todasObrasResponse = await fetch('/api/backup-completo');
        if (todasObrasResponse.ok) {
            const backupData = await todasObrasResponse.json();
            const todasObras = backupData.obras || [];
            const obraExistente = todasObras.find(obra => String(obra.id) === String(finalObraId));
            
            isNewObra = !obraExistente;
            console.log(`- Já existe no servidor?: ${!isNewObra}`);
        }
    } catch (error) {
        console.log('- Não foi possível verificar servidor, assumindo como nova obra');
    }

    console.log('- É nova obra?:', isNewObra);

    let result = null;
    
    if (isNewObra) {
        console.log('🆕 SALVANDO COMO NOVA OBRA COM ID SEGURO:', finalObraId);
        
        obraData.id = finalObraId;
        
        if (!obraData.id || !obraData.id.startsWith('obra_')) {
            console.error('❌ Obra não possui ID seguro válido para salvar');
            showSystemStatus("ERRO: Obra não possui ID válido", "error");
            return;
        }
        
        result = await salvarObra(obraData);
    } else {
        console.log('📝 ATUALIZANDO OBRA EXISTENTE, ID SEGURO:', finalObraId);
        
        if (!finalObraId.startsWith('obra_')) {
            console.error(`ERRO: ID não seguro para atualização: ${finalObraId}`);
            showSystemStatus("ERRO: ID da obra inválido para atualização", "error");
            return;
        }
        
        result = await atualizarObra(finalObraId, obraData);
    }

    if (result) {
        const finalId = ensureStringId(result.id);
        
        let obraBlockAtual = document.querySelector(`[data-obra-id="${finalId}"]`);
        
        if (!obraBlockAtual) {
            console.error('❌ CRÍTICO: Obra desapareceu do DOM durante salvamento!');
            console.log('🔍 Tentando recuperar da referência original...');
            
            if (obraContainer && document.body.contains(obraContainer)) {
                const obrasNoContainer = obraContainer.querySelectorAll('[data-obra-id]');
                console.log(`📦 Obras no container original: ${obrasNoContainer.length}`);
                
                if (obraContainer.contains(obraOriginalReference)) {
                    obraBlockAtual = obraOriginalReference;
                    console.log('✅ Obra recuperada da referência original');
                } else {
                    console.error('❌ Obra não está mais no container original');
                    showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
                    return;
                }
            } else {
                console.error('❌ Container original não encontrado');
                showSystemStatus("ERRO: Obra perdida durante salvamento", "error");
                return;
            }
        }

        obraBlockAtual.dataset.obraId = finalId;
        obraBlockAtual.dataset.obraName = obraData.nome;
        
        const titleElement = obraBlockAtual.querySelector('.obra-title');
        if (titleElement && titleElement.textContent !== obraData.nome) {
            titleElement.textContent = obraData.nome;
        }

        if (typeof updateObraButtonAfterSave === 'function' && document.body.contains(obraBlockAtual)) {
            console.log("✅ Obra confirmada no DOM, atualizando botão...");
            updateObraButtonAfterSave(obraData.nome, finalId);
        } else {
            console.error('❌ Obra não está no DOM para atualizar botão');
        }

        console.log(`✅ OBRA SALVA/ATUALIZADA COM SUCESSO! ID SEGURO: ${finalId}`);
        
        showSystemStatus("Obra salva com sucesso!", "success");
    } else {
        console.error('❌ FALHA AO SALVAR OBRA NO SERVIDOR');
        showSystemStatus("ERRO: Falha ao salvar obra no servidor", "error");
    }
}

/**
 * 🗑️ FUNÇÕES DE REMOÇÃO E VERIFICAÇÃO
 */

async function deleteObraFromServer(obraName, obraId) {
    try {
        if (!obraId || obraId === 'undefined' || obraId === 'null' || !obraId.startsWith('obra_')) {
            console.error(`ERRO FALBACK (deleteObraFromServer) [ID de obra inválido: ${obraId}]`);
            showSystemStatus("ERRO: ID da obra inválido para remoção", "error");
            return;
        }

        if (!isSessionActive()) {
            console.warn("⚠️ Sessão não está ativa - obra não será removida do servidor");
            return;
        }

        obraId = ensureStringId(obraId);

        console.log(`🗑️ Removendo obra ${obraId} do servidor...`);

        const response = await fetch(`/obras/${obraId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao remover obra: ${errorText}`);
        }

        console.log(`✅ Obra ${obraId} removida do servidor`);
        showSystemStatus("Obra removida do servidor com sucesso", "success");
    } catch (error) {
        console.error("❌ Erro ao remover obra do servidor:", error);
        showSystemStatus("ERRO: Não foi possível remover a obra do servidor", "error");
    }
}

function verifyObraData(obraId) {
    const obraBlock = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraBlock) {
        console.error(`❌ Obra com ID "${obraId}" não encontrada para verificação`);
        alert(`ERRO: Obra com ID "${obraId}" não encontrada`);
        return;
    }

    const obraName = obraBlock.dataset.obraName;
    const projects = obraBlock.querySelectorAll(".project-block");
    let totalRooms = 0;
    
    let report = `Verificação da Obra "${obraName}" (ID: ${obraId}):\n\n`;
    report += `Total de projetos: ${projects.length}\n\n`;

    projects.forEach((project, index) => {
        const projectName = project.dataset.projectName;
        const rooms = project.querySelectorAll(".room-block");
        totalRooms += rooms.length;
        
        report += `Projeto ${index + 1}: ${projectName}\n`;
        report += `  - Salas: ${rooms.length}\n`;
        
        rooms.forEach((room, roomIndex) => {
            const roomName = room.querySelector(".room-title")?.textContent || `Sala ${roomIndex + 1}`;
            const stats = calculateRoomCompletionStats(room);
            report += `    - ${roomName}: ${stats.filled}/${stats.total} campos (${stats.percentage}%)\n`;
        });
        report += '\n';
    });

    report += `RESUMO: ${projects.length} projetos, ${totalRooms} salas`;

    console.log(`🔍 Relatório gerado para obra: ${obraName} (ID: ${obraId})`);
    alert(report);
}

/**
 * 🌐 EXPORTAÇÕES E COMPATIBILIDADE GLOBAL
 */

// Exportações para módulos ES6
export {
    // Interface
    createEmptyObra,
    buildObraHTML,
    buildObraActionsFooter,
    insertObraIntoDOM,
    updateObraButtonAfterSave,
    addNewObra,
    deleteObra,
    
    // Persistência
    fetchObras,
    salvarObra,
    atualizarObra,
    saveObra,
    deleteObraFromServer,
    
    // Utilitários
    verifyObraData,
    findObraBlock,
    findObraBlockWithRetry,

    // IDs
    generateObraId,
    ensureStringId
};

// Compatibilidade global para scripts legados
if (typeof window !== 'undefined') {
    window.deleteObra = deleteObra;
    window.addNewObra = addNewObra;
    window.saveObra = saveObra;
    window.verifyObraData = verifyObraData;
    window.findObraBlock = findObraBlock;
    window.generateObraId = generateObraId;
    window.ensureStringId = ensureStringId;
}