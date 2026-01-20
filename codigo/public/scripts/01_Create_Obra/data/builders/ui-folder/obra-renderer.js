import { ensureStringId, generateObraId } from '../../utils/id-generator.js';
import { waitForElement } from '../../utils/core-utils.js';

/**
 * Renderiza uma obra completa a partir dos dados carregados do servidor - ATUALIZADO COM SERVIÇOS
 */
function renderObraFromData(obraData) {
    const obraName = obraData.nome;
    const obraId = ensureStringId(obraData.id);

    console.log(`🎯 Renderizando obra: ${obraName} (ID: ${obraId})`);

    createEmptyObra(obraName, obraId);

    if (obraData.projetos && obraData.projetos.length > 0) {
        const obraContent = document.getElementById(`obra-content-${obraId}`);

        if (obraContent) {
            const emptyMessage = obraContent.querySelector(".empty-message");
            if (emptyMessage) {
                emptyMessage.remove();
            }

            setTimeout(() => {
                obraData.projetos.forEach((projectData) => {
                    renderProjectFromData(projectData, obraId, obraName);
                });
            }, 100);
        }
    }

    console.log(`✅ Obra ${obraName} renderizada com sucesso (ID: ${obraId})`);
}

/**
 * 🔥 NOVA FUNÇÃO: Atualizar texto do botão de cadastro de empresa
 */
function atualizarTextoBotaoEmpresa(obraId, texto = "Visualizar campos de cadastro de empresas") {
    const obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    if (!obraElement) {
        console.warn(`⚠️ Obra ${obraId} não encontrada para atualizar botão`);
        return false;
    }
    
    const botao = obraElement.querySelector('.btn-empresa-cadastro');
    if (botao) {
        const botaoAntigo = botao.textContent;
        botao.textContent = texto;
        console.log(`✅ Texto do botão atualizado: "${botaoAntigo}" → "${texto}"`);
        return true;
    }
    
    console.warn(`⚠️ Botão de empresa não encontrado na obra ${obraId}`);
    return false;
}

/**
 * 🔥 FUNÇÃO PARA ATUALIZAR TODOS OS BOTÕES DE EMPRESA (para obras existentes)
 */
function atualizarTodosBotoesEmpresa() {
    console.log('🔄 Atualizando texto de todos os botões de empresa...');
    
    const botoes = document.querySelectorAll('.btn-empresa-cadastro');
    let atualizados = 0;
    
    botoes.forEach(botao => {
        const textoAtual = botao.textContent.trim();
        if (textoAtual === "Adicionar campos de cadastro de empresas") {
            botao.textContent = "Visualizar campos de cadastro de empresas";
            atualizados++;
        }
    });
    
    console.log(`✅ ${atualizados} botões de empresa atualizados`);
    return atualizados;
}

/**
 * 🔥 MODIFICAR A FUNÇÃO buildObraHTML (ou criar uma versão atualizada)
 */
function buildObraHTML(obraName, obraId, isFromServer = false) {
    const buttonText = isFromServer ? 
        "Visualizar campos de cadastro de empresas" : 
        "Adicionar campos de cadastro de empresas";
    
    return `
        <div class="obra-block" data-obra-id="${obraId}" data-obra-name="${obraName}">
            <div class="obra-header">
                <div class="obra-title-section">
                    <h2 class="obra-title">${obraName}</h2>
                    <span class="obra-id">ID: ${obraId}</span>
                </div>
                <div class="obra-actions">
                    <button class="btn-empresa-cadastro" onclick="window.ativarCadastroEmpresa('${obraId}')" 
                            style="display: block;">
                        ${buttonText}
                    </button>
                    <button class="btn-update" onclick="updateObra('${obraId}')">Atualizar Obra</button>
                    <button class="btn-remove-obra" onclick="removeObra('${obraId}')">Remover Obra</button>
                </div>
            </div>
            <div class="obra-content" id="obra-content-${obraId}">
                <div class="projects-container">
                    <p class="empty-message">Nenhum projeto adicionado ainda. Adicione o primeiro projeto!</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Preenche os dados de uma obra a partir do JSON - ATUALIZADO COM SERVIÇOS
 */
async function populateObraData(obraData) {
    if (!obraData || typeof obraData !== 'object') {
        console.error('❌ Dados inválidos recebidos para populateObraData:', obraData);
        return;
    }
    
    const hasValidId = obraData.id && obraData.id !== "" && obraData.id !== "null" && obraData.id !== "undefined";
    const hasValidName = obraData.nome && obraData.nome !== "" && obraData.nome !== "null" && obraData.nome !== "undefined";
    
    if (!hasValidId && !hasValidName) {
        console.error('❌ Dados da obra sem ID ou nome válido:', obraData);
        return;
    }

    const obraName = obraData.nome || `Obra-${obraData.id}`;
    const obraId = obraData.id;
    
    console.log(`🔄 Preenchendo obra "${obraName}" com dados do JSON`, { 
        id: obraId, 
        nome: obraName, 
        projetos: obraData.projetos?.length || 0,
        empresaSigla: obraData.empresaSigla,
        empresaNome: obraData.empresaNome,
        empresa_id: obraData.empresa_id
    });

    let obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
    
    if (!obraElement) {
        console.log(`🔨 Criando nova obra: "${obraName}"`);
        
        const obraHTML = buildObraHTML(obraName, obraId, true);
        
        const container = document.getElementById("projects-container");
        if (container) {
            container.insertAdjacentHTML("beforeend", obraHTML);
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            obraElement = document.querySelector(`[data-obra-id="${obraId}"]`);
            console.log(`✅ Obra criada no DOM: ${obraName} com botão "Visualizar campos de cadastro de empresas"`);
        } else {
            console.error('❌ Container de projetos não encontrado');
            return;
        }
    } else {
        console.log(`✅ Obra já existe no DOM: ${obraName}`, obraElement);
        
        atualizarTextoBotaoEmpresa(obraId, "Visualizar campos de cadastro de empresas");
        updateObraButtonAfterSave(obraName, obraId);
    }

    if (!obraElement) {
        console.error(`❌ Elemento da obra não encontrado no DOM após criação: ${obraId}`);
        return;
    }

    console.log(`✅ Elemento da obra confirmado:`, {
        element: obraElement,
        dataset: obraElement.dataset
    });

    if (obraData.empresaSigla || obraData.empresaNome || obraData.empresa_id) {
        console.log('🏢 [POPULATE OBRA] Dados de empresa detectados, preparando...');
        
        if (typeof window.prepararDadosEmpresaNaObra === 'function') {
            try {
                console.log('🔧 [POPULATE OBRA] Chamando prepararDadosEmpresaNaObra...');
                await window.prepararDadosEmpresaNaObra(obraData, obraElement);
                console.log('✅ [POPULATE OBRA] Dados de empresa preparados com sucesso');
            } catch (error) {
                console.error('❌ [POPULATE OBRA] Erro ao preparar dados da empresa:', error);
            }
        } else {
            console.warn('⚠️ [POPULATE OBRA] Função prepararDadosEmpresaNaObra não encontrada');
            
            const camposEmpresa = ['empresaSigla', 'empresaNome', 'empresa_id'];
            camposEmpresa.forEach(campo => {
                if (obraData[campo]) {
                    obraElement.dataset[campo] = obraData[campo];
                    console.log(`✅ [POPULATE OBRA] Atribuído manualmente ${campo}: "${obraData[campo]}"`);
                }
            });
        }
    } else {
        console.log('📭 [POPULATE OBRA] Obra não possui dados de empresa');
    }

    if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
        console.error('❌ Funções necessárias não disponíveis:', {
            createEmptyProject: typeof window.createEmptyProject,
            createEmptyRoom: typeof window.createEmptyRoom
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (typeof window.createEmptyProject !== 'function' || typeof window.createEmptyRoom !== 'function') {
            console.error('❌ Funções ainda não disponíveis após espera');
            return;
        }
    }

    console.log(`🔧 Funções disponíveis: createEmptyProject: function, createEmptyRoom: function`);

    const projectsContainer = obraElement.querySelector('.projects-container');
    if (projectsContainer) {
        const existingProjects = projectsContainer.querySelectorAll('.project-block');
        if (existingProjects.length > 0) {
            console.log(`🗑️ Removendo ${existingProjects.length} projetos existentes antes do preenchimento`);
            existingProjects.forEach(project => project.remove());
        }
    }

    const projetos = obraData.projetos || [];
    console.log(`📁 Processando ${projetos.length} projeto(s) para a obra "${obraName}"`);
    
    const projetosPromises = [];
    
    for (let i = 0; i < projetos.length; i++) {
        const projectData = projetos[i];
        if (!projectData || !projectData.nome) {
            console.warn(`⚠️ Projeto ${i} inválido ou sem nome:`, projectData);
            continue;
        }
        
        const projectName = projectData.nome;
        const projectId = projectData.id;
        
        console.log(`📁 [${i + 1}/${projetos.length}] Preparando projeto: ${projectName} (ID: ${projectId})`);

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

    console.log(`✅ Obra "${obraName}" preenchida com sucesso - ${projetos.length} projeto(s) processado(s)`);
}

/**
 * 🔥 NOVA FUNÇÃO AUXILIAR: Processa um projeto de forma assíncrona - ATUALIZADA COM SERVIÇOS
 */
async function processProjectAsync(projectData, obraId, obraName, index) {
    const projectName = projectData.nome;
    const projectId = projectData.id;
    
    try {
        console.log(`🎯 [${index + 1}] Chamando createEmptyProject para projeto "${projectName}"`);
        
        const projectCreated = await window.createEmptyProject(obraId, obraName, projectId, projectName);
        
        if (!projectCreated) {
            console.error(`❌ [${index + 1}] Falha ao criar projeto ${projectName}`);
            return false;
        }

        await new Promise(resolve => setTimeout(resolve, 200)); // ✅ Aumentado para garantir carregamento dos serviços
        
        const projectElement = await waitForElement(`[data-obra-id="${obraId}"][data-project-id="${projectId}"]`, 3000);
        
        if (!projectElement) {
            console.error(`❌ [${index + 1}] Projeto ${projectName} não encontrado no DOM após criação`);
            
            const allProjects = document.querySelectorAll('.project-block');
            const foundProject = Array.from(allProjects).find(proj => 
                proj.dataset.projectId === projectId && proj.dataset.obraId === obraId
            );
            
            if (foundProject) {
                console.log(`✅ [${index + 1}] Projeto encontrado via busca alternativa`);
                await populateProjectData(foundProject, projectData, obraId, obraName);
                return true;
            }
            
            return false;
        }

        console.log(`✅ [${index + 1}] Projeto criado e encontrado: ${projectName}`);

        // ✅ NOVO: Preencher dados de serviços se existirem
        if (projectData.servicos && (projectData.servicos.engenharia || projectData.servicos.adicionais?.length > 0)) {
            console.log(`💰 [${index + 1}] Projeto possui dados de serviços, preenchendo...`);
            setTimeout(() => populateServicosData(projectElement, projectData.servicos), 300);
        }

        await populateProjectData(projectElement, projectData, obraId, obraName);
        return true;

    } catch (error) {
        console.error(`❌ [${index + 1}] Erro ao criar projeto ${projectName}:`, error);
        return false;
    }
}

/**
 * Preenche os dados de serviços em um projeto (simplificado)
 */
async function populateServicosData(projectElement, servicosData) {
    try {
        console.log(`💰 Preenchendo dados de serviços no projeto "${projectElement.dataset.projectName}"`);
        
        // Aguardar a seção de serviços estar disponível
        let sectionBlock = projectElement.querySelector('.section-block[data-project-id]');
        if (!sectionBlock) {
            console.log(`🕐 Aguardando seção de serviços...`);
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

        if (!sectionBlock) {
            console.warn(`⚠️ Seção de serviços não encontrada no projeto`);
            return;
        }

        // Preencher Engenharia
        if (servicosData.engenharia) {
            const engenhariaBlock = sectionBlock.querySelector('.subsection-block:first-child');
            if (engenhariaBlock) {
                const valorInput = engenhariaBlock.querySelector('.input-valor');
                const descricaoTextarea = engenhariaBlock.querySelector('.input-texto');
                
                if (valorInput && servicosData.engenharia.valor) {
                    valorInput.value = servicosData.engenharia.valor;
                    console.log(`💰 Engenharia: Valor preenchido: ${servicosData.engenharia.valor}`);
                }
                
                if (descricaoTextarea && servicosData.engenharia.descricao) {
                    descricaoTextarea.value = servicosData.engenharia.descricao;
                    console.log(`💰 Engenharia: Descrição preenchida`);
                }
            }
        }

        // Preencher Adicionais (SIMPLIFICADO)
        if (servicosData.adicionais && servicosData.adicionais.length > 0) {
            const container = sectionBlock.querySelector('.adicionais-container');
            
            if (container) {
                // Limpar container antes de preencher
                container.innerHTML = '';
                
                for (const adicional of servicosData.adicionais) {
                    console.log(`➕ Preenchendo adicional:`, adicional);
                    
                    // Verificar se tem valor OU descrição
                    const temValor = adicional.valor && adicional.valor > 0;
                    const temDescricao = adicional.descricao && adicional.descricao.trim() !== '';
                    
                    if (temValor && temDescricao) {
                        // Tem valor e descrição = Conjunto
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
                        // Só tem valor = Valor
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
                        // Só tem descrição = Texto
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
                    
                    // Pequena pausa entre adicionais
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }

        console.log(`✅ Dados de serviços preenchidos com sucesso`);
        
    } catch (error) {
        console.error('❌ Erro ao preencher dados de serviços:', error);
    }
}

/**
 * 🔥 NOVA FUNÇÃO AUXILIAR: Atualizar dados da empresa em todas as obras
 */
async function atualizarEmpresaEmTodasObras(empresaData) {
    console.log('🏢 Atualizando dados de empresa em todas as obras visíveis...');
    
    const obras = document.querySelectorAll('.obra-block[data-obra-id]');
    console.log(`🔍 Encontradas ${obras.length} obras para atualizar empresa`);
    
    for (const obraElement of obras) {
        try {
            const obraId = obraElement.dataset.obraId;
            
            if (typeof window.obterDadosEmpresaDaObra === 'function') {
                const dadosObra = window.obterDadosEmpresaDaObra(obraId);
                
                if (dadosObra && typeof window.prepararDadosEmpresaNaObra === 'function') {
                    await window.prepararDadosEmpresaNaObra(dadosObra, obraElement);
                    console.log(`✅ Dados de empresa atualizados para obra ${obraId}`);
                }
            }
        } catch (error) {
            console.error(`❌ Erro ao atualizar empresa na obra ${obraElement.dataset.obraId}:`, error);
        }
    }
    
    console.log('✅ Atualização de empresa concluída');
}

// 🔥 ADICIONAR FUNÇÕES AUXILIARES AO OBJETO GLOBAL
if (typeof window !== 'undefined') {
    window.atualizarEmpresaEmTodasObras = atualizarEmpresaEmTodasObras;
    window.atualizarTextoBotaoEmpresa = atualizarTextoBotaoEmpresa;
    window.atualizarTodosBotoesEmpresa = atualizarTodosBotoesEmpresa;
    window.populateServicosData = populateServicosData; // ✅ NOVA FUNÇÃO GLOBAL
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM carregado, atualizando botões de empresa...');
            setTimeout(atualizarTodosBotoesEmpresa, 1000);
        });
    } else {
        console.log('📄 DOM já carregado, atualizando botões de empresa...');
        setTimeout(atualizarTodosBotoesEmpresa, 1000);
    }
    
    if (typeof window.createEmptyObra === 'undefined') {
        console.warn('⚠️ Função createEmptyObra não definida, criando stub...');
        window.createEmptyObra = function(obraName, obraId) {
            console.log(`🔄 Criando obra stub: ${obraName} (${obraId})`);
            
            const obraHTML = buildObraHTML(obraName, obraId, false);
            
            const container = document.getElementById("projects-container");
            if (container) {
                container.insertAdjacentHTML("beforeend", obraHTML);
                console.log(`✅ Obra stub criada: ${obraName}`);
                return true;
            }
            
            console.error('❌ Container de projetos não encontrado');
            return false;
        };
    }
}

// 🔥 FUNÇÃO PARA ATUALIZAR BOTÕES DINAMICAMENTE
function inicializarAtualizacaoBotoesEmpresa() {
    console.log('🚀 Inicializando atualização de botões de empresa...');
    
    atualizarTodosBotoesEmpresa();
    
    let tentativas = 0;
    const maxTentativas = 5;
    
    const intervalId = setInterval(() => {
        tentativas++;
        const atualizados = atualizarTodosBotoesEmpresa();
        
        if (atualizados > 0 || tentativas >= maxTentativas) {
            clearInterval(intervalId);
            console.log(`✅ Atualização de botões finalizada após ${tentativas} tentativas`);
        }
    }, 2000);
    
    return intervalId;
}

// EXPORTS NO FINAL
export {
    renderObraFromData,
    populateObraData,
    processProjectAsync,
    populateServicosData, // ✅ NOVO EXPORT
    atualizarEmpresaEmTodasObras,
    atualizarTextoBotaoEmpresa,
    atualizarTodosBotoesEmpresa,
    buildObraHTML,
    inicializarAtualizacaoBotoesEmpresa
};