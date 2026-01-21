import { ensureStringId } from '../../utils/id-generator.js';
import { waitForElement } from '../../utils/core-utils.js';
import { 
    buildObraHTML, 
    createEmptyObra,
    createObraFromServer 
} from '../../../features/managers/obra-folder/obra-creator.js';

/**
 * Função auxiliar para remover mensagem vazia de projetos
 */
function removeProjectEmptyMessage(obraId) {
    const projectsContainer = document.getElementById(`projects-${obraId}`);
    if (projectsContainer) {
        const emptyMessage = projectsContainer.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
    }
}

/**
 * Renderiza uma obra completa a partir dos dados carregados do servidor
 */
function renderObraFromData(obraData) {
    const obraName = obraData.nome;
    const obraId = ensureStringId(obraData.id);

    // Usa createEmptyObra com isFromServer = true
    createEmptyObra(obraName, obraId, true);

    if (obraData.projetos && obraData.projetos.length > 0) {
        const obraContent = document.getElementById(`obra-content-${obraId}`);

        if (obraContent) {
            removeProjectEmptyMessage(obraId);

            setTimeout(() => {
                obraData.projetos.forEach((projectData) => {
                    renderProjectFromData(projectData, obraId, obraName);
                });
            }, 100);
        }
    }
}

/**
 * Atualizar texto do botão de cadastro de empresa
 */
function atualizarTextoBotaoEmpresa(obraId, texto = "Visualizar campos de cadastro de empresas") {
    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraElement) return false;

    const botao = obraElement.querySelector('.btn-empresa-cadastro');
    if (botao) {
        botao.textContent = texto;
        return true;
    }

    return false;
}

/**
 * FUNÇÃO PARA ATUALIZAR TODOS OS BOTÕES DE EMPRESA (para obras existentes)
 */
function atualizarTodosBotoesEmpresa() {
    const botoes = document.querySelectorAll('.btn-empresa-cadastro');
    let atualizados = 0;

    botoes.forEach(botao => {
        const textoAtual = botao.textContent.trim();
        if (textoAtual === "Adicionar campos de cadastro de empresas") {
            botao.textContent = "Visualizar campos de cadastro de empresas";
            atualizados++;
        }
    });

    return atualizados;
}

/**
 * Preenche os dados de uma obra a partir do JSON
 */
async function populateObraData(obraData) {
    if (!obraData || typeof obraData !== 'object') return;

    const hasValidId = obraData.id && obraData.id !== "" && obraData.id !== "null" && obraData.id !== "undefined";
    const hasValidName = obraData.nome && obraData.nome !== "" && obraData.nome !== "null" && obraData.nome !== "undefined";

    if (!hasValidId && !hasValidName) return;

    const obraName = obraData.nome || `Obra-${obraData.id}`;
    const obraId = obraData.id;

    let obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);

    if (!obraElement) {
        const obraCriada = await createObraFromServer(obraData);
        
        if (!obraCriada) return;

        await new Promise(resolve => setTimeout(resolve, 150));

        obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    } else {
        atualizarTextoBotaoEmpresa(obraId, "Visualizar campos de cadastro de empresas");
        
        if (typeof window.updateObraButtonAfterSave === 'function') {
            window.updateObraButtonAfterSave(obraName, obraId);
        }
    }

    if (!obraElement) return;

    if (obraData.empresaSigla || obraData.empresaNome || obraData.empresa_id) {
        if (typeof window.prepararDadosEmpresaNaObra === 'function') {
            try {
                await window.prepararDadosEmpresaNaObra(obraData, obraElement);
            } catch (error) {}
        } else {
            const camposEmpresa = ['empresaSigla', 'empresaNome', 'empresa_id'];
            camposEmpresa.forEach(campo => {
                if (obraData[campo]) {
                    obraElement.dataset[campo] = obraData[campo];
                }
            });
        }
    }

    if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
        await new Promise(resolve => setTimeout(resolve, 500));

        if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
            return;
        }
    }

    const projectsContainer = obraElement.querySelector('.projects-container');
    if (projectsContainer) {
        const existingProjects = projectsContainer.querySelectorAll('.project-block');
        if (existingProjects.length > 0) {
            existingProjects.forEach(project => project.remove());
        }
    }

    const projetos = obraData.projetos || [];

    const projetosPromises = [];

    for (let i = 0; i < projetos.length; i++) {
        const projectData = projetos[i];
        if (!projectData || !projectData.nome) continue;

        const projectName = projectData.nome;
        const projectId = projectData.id;

        projetosPromises.push(processProjectAsync(projectData, obraId, obraName, i));

        if (projetosPromises.length >= 3) {
            await Promise.allSettled(projetosPromises);
            projetosPromises.length = 0;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    if (projetosPromises.length > 0) {
        await Promise.allSettled(projetosPromises);
    }

    // Remove mensagem vazia após processar todos os projetos
    removeProjectEmptyMessage(obraId);
}

/**
 * Processa um projeto de forma assíncrona
 */
async function processProjectAsync(projectData, obraId, obraName, index) {
    const projectName = projectData.nome;
    const projectId = projectData.id;

    try {
        const projectCreated = await window.createEmptyProject(obraId, obraName, projectId, projectName);

        if (!projectCreated) return false;

        await new Promise(resolve => setTimeout(resolve, 200));

        const projectElement = await waitForElement(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`, 3000);

        if (!projectElement) {
            const allProjects = document.querySelectorAll('.project-block');
            const foundProject = Array.from(allProjects).find(proj =>
                proj.dataset.projectId === projectId && proj.dataset.obraId === obraId
            );

            if (foundProject) {
                await populateProjectData(foundProject, projectData, obraId, obraName);
                return true;
            }

            return false;
        }

        if (projectData.servicos && (projectData.servicos.engenharia || projectData.servicos.adicionais?.length > 0)) {
            setTimeout(() => populateServicosData(projectElement, projectData.servicos), 300);
        }

        await populateProjectData(projectElement, projectData, obraId, obraName);
        return true;

    } catch (error) {
        return false;
    }
}

/**
 * Preenche os dados de serviços em um projeto
 */
async function populateServicosData(projectElement, servicosData) {
    try {
        let sectionBlock = projectElement.querySelector('.section-block[data-project-id]');
        if (!sectionBlock) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    sectionBlock = projectElement.querySelector('.section-block[data-project-id]');
                    if (sectionBlock) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }

        if (!sectionBlock) return;

        if (servicosData.engenharia) {
            const engenhariaBlock = sectionBlock.querySelector('.subsection-block:first-child');
            if (engenhariaBlock) {
                const valorInput = engenhariaBlock.querySelector('.input-valor');
                const descricaoTextarea = engenhariaBlock.querySelector('.input-texto');

                if (valorInput && servicosData.engenharia.valor) {
                    valorInput.value = servicosData.engenharia.valor;
                }

                if (descricaoTextarea && servicosData.engenharia.descricao) {
                    descricaoTextarea.value = servicosData.engenharia.descricao;
                }
            }
        }

        if (servicosData.adicionais && servicosData.adicionais.length > 0) {
            const container = sectionBlock.querySelector('.adicionais-container');

            if (container) {
                container.innerHTML = '';

                for (const adicional of servicosData.adicionais) {
                    const temValor = adicional.valor && adicional.valor > 0;
                    const temDescricao = adicional.descricao && adicional.descricao.trim() !== '';

                    if (temValor && temDescricao) {
                        if (typeof window.addAdicionalConjunto === 'function') {
                            const projectId = projectElement.dataset.projectId;
                            window.addAdicionalConjunto(projectId);

                            await new Promise(resolve => setTimeout(resolve, 50));

                            const ultimoItem = container.querySelector('.adicional-item:last-child');
                            if (ultimoItem) {
                                const valorInput = ultimoItem.querySelector('.input-valor');
                                const descricaoTextarea = ultimoItem.querySelector('.input-texto');

                                if (valorInput && adicional.valor) {
                                    valorInput.value = adicional.valor;
                                }
                                if (descricaoTextarea && adicional.descricao) {
                                    descricaoTextarea.value = adicional.descricao;
                                }
                            }
                        }
                    } else if (temValor) {
                        if (typeof window.addAdicionalValor === 'function') {
                            const projectId = projectElement.dataset.projectId;
                            window.addAdicionalValor(projectId);

                            await new Promise(resolve => setTimeout(resolve, 50));

                            const ultimoItem = container.querySelector('.adicional-item:last-child');
                            if (ultimoItem && adicional.valor) {
                                const valorInput = ultimoItem.querySelector('.input-valor');
                                if (valorInput) valorInput.value = adicional.valor;
                            }
                        }
                    } else if (temDescricao) {
                        if (typeof window.addAdicionalTexto === 'function') {
                            const projectId = projectElement.dataset.projectId;
                            window.addAdicionalTexto(projectId);

                            await new Promise(resolve => setTimeout(resolve, 50));

                            const ultimoItem = container.querySelector('.adicional-item:last-child');
                            if (ultimoItem && adicional.descricao) {
                                const descricaoTextarea = ultimoItem.querySelector('.input-texto');
                                if (descricaoTextarea) descricaoTextarea.value = adicional.descricao;
                            }
                        }
                    }

                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }

    } catch (error) {}
}

/**
 * Atualizar dados da empresa em todas as obras
 */
async function atualizarEmpresaEmTodasObras(empresaData) {
    const obras = document.querySelectorAll('.obra-block[data-obra-id]');

    for (const obraElement of obras) {
        try {
            const obraId = obraElement.dataset.obraId;

            if (typeof window.obterDadosEmpresaDaObra === 'function') {
                const dadosObra = window.obterDadosEmpresaDaObra(obraId);

                if (dadosObra && typeof window.prepararDadosEmpresaNaObra === 'function') {
                    await window.prepararDadosEmpresaNaObra(dadosObra, obraElement);
                }
            }
        } catch (error) {}
    }
}

// ADICIONAR FUNÇÕES AUXILIARES AO OBJETO GLOBAL
if (typeof window !== 'undefined') {
    window.atualizarEmpresaEmTodasObras = atualizarEmpresaEmTodasObras;
    window.atualizarTextoBotaoEmpresa = atualizarTextoBotaoEmpresa;
    window.atualizarTodosBotoesEmpresa = atualizarTodosBotoesEmpresa;
    window.populateServicosData = populateServicosData;
    window.removeProjectEmptyMessage = removeProjectEmptyMessage;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(atualizarTodosBotoesEmpresa, 1000);
        });
    } else {
        setTimeout(atualizarTodosBotoesEmpresa, 1000);
    }
}

// FUNÇÃO PARA ATUALIZAR BOTÕES DINAMICAMENTE
function inicializarAtualizacaoBotoesEmpresa() {
    atualizarTodosBotoesEmpresa();

    let tentativas = 0;
    const maxTentativas = 5;

    const intervalId = setInterval(() => {
        tentativas++;
        const atualizados = atualizarTodosBotoesEmpresa();

        if (atualizados > 0 || tentativas >= maxTentativas) {
            clearInterval(intervalId);
        }
    }, 2000);

    return intervalId;
}

// EXPORTS NO FINAL
export {
    renderObraFromData,
    populateObraData,
    processProjectAsync,
    populateServicosData, 
    atualizarEmpresaEmTodasObras,
    atualizarTextoBotaoEmpresa,
    atualizarTodosBotoesEmpresa,
    inicializarAtualizacaoBotoesEmpresa
};