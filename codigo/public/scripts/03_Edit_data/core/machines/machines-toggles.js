// scripts/03_Edit_data/machines/machines-toggles.js
// Funções para toggles e estados de seções

export function toggleSection(sectionId, event) {
    if (!event) return;

    event.stopPropagation();

    const header = event.currentTarget;
    const content = header.nextElementSibling;
    const minimizer = header.querySelector('.minimizer');

    if (!content || !minimizer) return;

    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        minimizer.textContent = '−';
        minimizer.title = 'Recolher seção';
        saveSectionState(sectionId, 'expanded');
    } else {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        minimizer.textContent = '+';
        minimizer.title = 'Expandir seção';
        saveSectionState(sectionId, 'collapsed');
    }
}

export function toggleOptionItem(index, event) {
    if (!event) return;

    event.stopPropagation();

    const header = event.currentTarget;
    const content = header.nextElementSibling;
    const minimizer = header.querySelector('.minimizer');

    if (!content || !minimizer) return;

    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        minimizer.textContent = '−';
    } else {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        minimizer.textContent = '+';
    }
}

export function saveSectionState(sectionId, state) {
    try {
        const sectionStates = JSON.parse(localStorage.getItem('machineSectionStates') || '{}');
        sectionStates[sectionId] = state;
        localStorage.setItem('machineSectionStates', JSON.stringify(sectionStates));
    } catch (error) {
        console.error('Erro ao salvar estado da seção:', error);
    }
}

export function restoreSectionStates() {
    try {
        const sectionStates = JSON.parse(localStorage.getItem('machineSectionStates') || '{}');

        document.querySelectorAll('.form-section').forEach(section => {
            const header = section.querySelector('.section-header');
            const content = header?.nextElementSibling;
            const minimizer = header?.querySelector('.minimizer');

            if (!header || !content || !minimizer) return;

            let sectionId = '';
            if (content.id.includes('impostos')) sectionId = 'impostos';
            else if (content.id.includes('configuracoes')) sectionId = 'configuracoes';
            else if (content.id.includes('baseValues')) sectionId = 'valoresbase';
            else if (content.id.includes('options')) sectionId = 'opcoes';
            else if (content.id.includes('voltages')) sectionId = 'tensoes';

            if (sectionId && sectionStates[sectionId] === 'expanded') {
                content.classList.remove('collapsed');
                content.classList.add('expanded');
                minimizer.textContent = '−';
                minimizer.title = 'Recolher seção';
            } else {
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                minimizer.textContent = '+';
                minimizer.title = 'Expandir seção';
            }
        });

        document.querySelectorAll('.option-item').forEach(optionItem => {
            const header = optionItem.querySelector('.option-header');
            const content = header?.nextElementSibling;
            const minimizer = header?.querySelector('.minimizer');

            if (header && content && minimizer) {
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                minimizer.textContent = '+';
            }
        });
    } catch (error) {
        console.error('Erro ao restaurar estados das seções:', error);
    }
}