import { getNextObraNumber } from '../../../data/utils/data-utils.js';
import { generateObraId } from '../../../data/utils/id-generator.js';

/**
 * 🏗️ FUNÇÕES DE CONSTRUÇÃO DE INTERFACE
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
            <div class="obra-header-spacer"></div>
            <div class="obra-actions">
                <button class="btn btn-delete" onclick="window.deleteObra('${obraName}', '${obraId}')">Remover Obra</button>
            </div>
        </div>

        <div class="obra-content collapsed" id="obra-content-${obraId}">
            <div class="projetc-header-record very-dark">
                <button class="btn-empresa-cadastro" onclick="window.ativarCadastroEmpresa('${obraId}')">Adicionar campos de cadastro de empresas</button>
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

// EXPORTS NO FINAL
export {
    buildObraHTML,
    buildObraActionsFooter,
    insertObraIntoDOM,
    createEmptyObra,
    addNewObra
};