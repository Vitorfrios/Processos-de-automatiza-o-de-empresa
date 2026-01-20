/**
 * servicos.js
 * Gerenciador dinâmico de seções de serviços - VERSÃO SIMPLIFICADA
 */

/**
 * Constrói o HTML dos serviços para um projeto
 */
function buildServicosInProject(projectId) {
    if (!projectId) {
        console.error('❌ Project ID inválido para construir serviços')
        return ''
    }

    console.log(`🔨 [BUILD SERVICOS] Construindo serviços para projeto: ${projectId}`)

    return `
        <div class="section-block" data-project-id="${projectId}">
            <div class="section-header">
                <button class="minimizer" onclick="toggleSection('servicos-${projectId}')">+</button>
                <h4 class="section-title">Serviços</h4>
            </div>

            <div class="section-content collapsed" id="section-content-servicos-${projectId}">
                <!-- ENGENHARIA -->
                <div class="subsection-block">
                    <div class="subsection-header">
                        <button class="minimizer" onclick="toggleSubsection('engenharia-${projectId}')">−</button>
                        <h5 class="subsection-title">Engenharia</h5>
                    </div>

                    <div class="subsection-content" id="subsection-content-engenharia-${projectId}">
                        <div class="field-group">
                            <label>Valor</label>
                            <input type="number" class="input-valor" placeholder="R$ 0,00">
                        </div>
                        <div class="field-group">
                            <label>Descrição</label>
                            <textarea class="input-texto" placeholder="Descreva o serviço de engenharia"></textarea>
                        </div>
                    </div>
                </div>

                <!-- ADICIONAIS -->
                <div class="subsection-block">
                    <div class="subsection-header">
                        <button class="minimizer" onclick="toggleSubsection('adicionais-${projectId}')">−</button>
                        <h5 class="subsection-title">Adicionais</h5>
                    </div>

                    <div class="subsection-content" id="subsection-content-adicionais-${projectId}">
                        <div class="adicionais-container" id="adicionais-container-${projectId}"></div>

                        <div class="adicionais-actions">
                            <button class="btn btn-add-secondary" onclick="addAdicionalConjunto('${projectId}')">+ Conjunto</button>
                            <button class="btn btn-add-secondary" onclick="addAdicionalValor('${projectId}')">+ Valor</button>
                            <button class="btn btn-add-secondary" onclick="addAdicionalTexto('${projectId}')">+ Texto</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

/**
 * Alterna visibilidade da seção principal
 */
function toggleSection(sectionId) {
    const section = document.getElementById(`section-content-${sectionId}`)
    const button = document.querySelector(`[onclick="toggleSection('${sectionId}')"]`)

    if (!section || !button) return

    if (section.classList.contains('collapsed')) {
        section.classList.remove('collapsed')
        button.textContent = '−'
    } else {
        section.classList.add('collapsed')
        button.textContent = '+'
    }
}

/**
 * Alterna visibilidade da subseção
 */
function toggleSubsection(subsectionId) {
    const subsection = document.getElementById(`subsection-content-${subsectionId}`)
    const button = document.querySelector(`[onclick="toggleSubsection('${subsectionId}')"]`)

    if (!subsection || !button) return

    if (subsection.classList.contains('collapsed')) {
        subsection.classList.remove('collapsed')
        button.textContent = '−'
    } else {
        subsection.classList.add('collapsed')
        button.textContent = '+'
    }
}

/**
 * Adiciona um conjunto de adicional (SIMPLIFICADO - sem nome)
 */
function addAdicionalConjunto(projectId) {
    const container = document.getElementById(`adicionais-container-${projectId}`)
    if (!container) return

    const itemId = `adicional-${Date.now()}`
    const html = `
        <div class="adicional-item" data-item-id="${itemId}">
            <div class="field-group">
                <label>Valor</label>
                <input type="number" class="input-valor" placeholder="R$ 0,00">
            </div>
            
            <div class="field-group">
                <label>Descrição</label>
                <textarea placeholder="Descrição" 
                      class="input-texto"></textarea>
            </div>    
            <button class="btn btn-remove" onclick="removeAdicionalItem('${projectId}', '${itemId}')">×</button>
        </div>
    `

    container.insertAdjacentHTML('beforeend', html)
}

/**
 * Adiciona um adicional do tipo valor
 */
function addAdicionalValor(projectId) {
    const container = document.getElementById(`adicionais-container-${projectId}`)
    if (!container) return

    const itemId = `adicional-${Date.now()}`
    const html = `
        <div class="adicional-item" data-item-id="${itemId}">
            <input type="number" 
                   placeholder="Valor" 
                   class="input-valor">
            <button class="btn btn-remove" onclick="removeAdicionalItem('${projectId}', '${itemId}')">×</button>
        </div>
    `

    container.insertAdjacentHTML('beforeend', html)
}

/**
 * Adiciona um adicional do tipo texto
 */
function addAdicionalTexto(projectId) {
    const container = document.getElementById(`adicionais-container-${projectId}`)
    if (!container) return

    const itemId = `adicional-${Date.now()}`
    const html = `
        <div class="adicional-item" data-item-id="${itemId}">
            <textarea placeholder="Descrição" 
                      class="input-texto"></textarea>
            <button class="btn btn-remove" onclick="removeAdicionalItem('${projectId}', '${itemId}')">×</button>
        </div>
    `

    container.insertAdjacentHTML('beforeend', html)
}

/**
 * Remove um item adicional
 */
function removeAdicionalItem(projectId, itemId) {
    const container = document.getElementById(`adicionais-container-${projectId}`)
    if (!container) return

    const item = container.querySelector(`[data-item-id="${itemId}"]`)
    if (item) {
        item.remove()
    }
}

// Adiciona ao escopo global
if (typeof window !== 'undefined') {
    window.buildServicosInProject = buildServicosInProject
    window.toggleSection = toggleSection
    window.toggleSubsection = toggleSubsection
    window.addAdicionalConjunto = addAdicionalConjunto
    window.addAdicionalValor = addAdicionalValor
    window.addAdicionalTexto = addAdicionalTexto
    window.removeAdicionalItem = removeAdicionalItem
}

export {
    buildServicosInProject,
    toggleSection,
    toggleSubsection,
    addAdicionalConjunto,
    addAdicionalValor,
    addAdicionalTexto,
    removeAdicionalItem
}