document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const form = document.getElementById('form-carga-termica');
    const previewContainer = document.createElement('div');
    previewContainer.id = 'data-preview';
    previewContainer.style.display = 'none';
    previewContainer.style.marginTop = '30px';
    previewContainer.style.padding = '20px';
    previewContainer.style.backgroundColor = '#f8f9fa';
    previewContainer.style.borderRadius = '8px';
    previewContainer.style.border = '1px solid #ddd';
    
    form.parentNode.insertBefore(previewContainer, form.nextSibling);

    // Botão de preview
    const previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.id = 'preview-btn';
    previewBtn.className = 'btn';
    previewBtn.style.backgroundColor = '#6c757d';
    previewBtn.style.marginRight = '10px';
    previewBtn.textContent = 'Visualizar Dados';
    form.querySelector('button[type="submit"]').insertAdjacentElement('beforebegin', previewBtn);

    // Botão de voltar ao formulário
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.id = 'back-btn';
    backBtn.className = 'btn';
    backBtn.style.backgroundColor = '#6c757d';
    backBtn.style.display = 'none';
    backBtn.textContent = 'Voltar ao Formulário';
    previewContainer.insertAdjacentElement('afterend', backBtn);

    // Botão de edição
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.id = 'edit-btn';
    editBtn.className = 'btn';
    editBtn.style.backgroundColor = '#17a2b8';
    editBtn.style.display = 'none';
    editBtn.style.marginLeft = '10px';
    editBtn.textContent = 'Editar Dados';
    backBtn.insertAdjacentElement('afterend', editBtn);

    // Event listeners
    previewBtn.addEventListener('click', showPreview);
    backBtn.addEventListener('click', backToForm);
    editBtn.addEventListener('click', enableEditing);

    // Variável para armazenar dados do formulário
    let formDataObj = {};

    function showPreview() {
        if (!validateForm()) {
            alert('Por favor, preencha todos os campos obrigatórios antes de visualizar.');
            return;
        }

        const formData = new FormData(form);
        formDataObj = {};
        
        // Converter FormData para objeto
        for (let [key, value] of formData.entries()) {
            if (value !== '') {
                // Criar estrutura de objetos aninhados
                const keys = key.split(/\[|\]/).filter(k => k);
                keys.reduce((acc, k, i) => {
                    if (i === keys.length - 1) {
                        acc[k] = value;
                    } else {
                        acc[k] = acc[k] || {};
                    }
                    return acc[k];
                }, formDataObj);
            }
        }

        // Calcular carga térmica estimada
        const cargaTermica = calcularCargaTermica(formDataObj);

        // Gerar HTML do preview
        let previewHTML = `
            <h2 style="color: #0056b3; margin-bottom: 20px;">Pré-visualização dos Dados</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        `;

        // Seção Cliente
        previewHTML += `
            <div class="preview-section">
                <h3 style="color: #003366; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Dados do Cliente</h3>
                <p><strong>Nome:</strong> <span data-field="cliente.nome">${formDataObj.cliente?.nome || 'Não informado'}</span></p>
                <p><strong>Empresa:</strong> <span data-field="cliente.empresa">${formDataObj.cliente?.empresa || 'Não informado'}</span></p>
                <p><strong>CNPJ:</strong> <span data-field="cliente.cnpj">${formDataObj.cliente?.cnpj || 'Não informado'}</span></p>
                <p><strong>E-mail:</strong> <span data-field="cliente.email">${formDataObj.cliente?.email || 'Não informado'}</span></p>
                <p><strong>Telefone:</strong> <span data-field="cliente.telefone">${formDataObj.cliente?.telefone || 'Não informado'}</span></p>
            </div>
        `;

        // Seção Projeto
        previewHTML += `
            <div class="preview-section">
                <h3 style="color: #003366; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Dados do Projeto</h3>
                <p><strong>Nome do Projeto:</strong> <span data-field="ambiente.projeto">${formDataObj.ambiente?.projeto || 'Não informado'}</span></p>
                <p><strong>Área:</strong> <span data-field="ambiente.area">${formDataObj.ambiente?.area ? formDataObj.ambiente.area + ' m²' : 'Não informado'}</span></p>
                <p><strong>Pé-direito:</strong> <span data-field="ambiente.pe_direito">${formDataObj.ambiente?.pe_direito ? formDataObj.ambiente.pe_direito + ' m' : 'Não informado'}</span></p>
                <p><strong>Tipo de Construção:</strong> <span data-field="ambiente.tipo_construcao">${formDataObj.ambiente?.tipo_construcao === 'eletrocentro' ? 'Eletrocentro' : 
                formDataObj.ambiente?.tipo_construcao === 'alvenaria' ? 'Alvenaria' : 'Não informado'}</span></p>
            </div>
        `;

        // Seção Paredes
        previewHTML += `
            <div class="preview-section">
                <h3 style="color: #003366; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Paredes Externas</h3>
                <p><strong>Oeste:</strong> <span data-field="paredes.oeste">${formDataObj.paredes?.oeste ? formDataObj.paredes.oeste + ' m' : 'Não informado'}</span></p>
                <p><strong>Leste:</strong> <span data-field="paredes.leste">${formDataObj.paredes?.leste ? formDataObj.paredes.leste + ' m' : 'Não informado'}</span></p>
                <p><strong>Norte:</strong> <span data-field="paredes.norte">${formDataObj.paredes?.norte ? formDataObj.paredes.norte + ' m' : 'Não informado'}</span></p>
                <p><strong>Sul:</strong> <span data-field="paredes.sul">${formDataObj.paredes?.sul ? formDataObj.paredes.sul + ' m' : 'Não informado'}</span></p>
            </div>
        `;

        // Seção Divisórias
        previewHTML += `
            <div class="preview-section">
                <h3 style="color: #003366; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Divisórias Internas</h3>
                <p><strong>Não Climatizada 1:</strong> <span data-field="divisorias.nao_climatizada_1">${formDataObj.divisorias?.nao_climatizada_1 ? formDataObj.divisorias.nao_climatizada_1 + ' m' : 'Não informado'}</span></p>
                <p><strong>Não Climatizada 2:</strong> <span data-field="divisorias.nao_climatizada_2">${formDataObj.divisorias?.nao_climatizada_2 ? formDataObj.divisorias.nao_climatizada_2 + ' m' : 'Não informado'}</span></p>
                <p><strong>Climatizada 1:</strong> <span data-field="divisorias.climatizada_1">${formDataObj.divisorias?.climatizada_1 ? formDataObj.divisorias.climatizada_1 + ' m' : 'Não informado'}</span></p>
                <p><strong>Climatizada 2:</strong> <span data-field="divisorias.climatizada_2">${formDataObj.divisorias?.climatizada_2 ? formDataObj.divisorias.climatizada_2 + ' m' : 'Não informado'}</span></p>
            </div>
        `;

        // Seção Configurações
        previewHTML += `
            <div class="preview-section">
                <h3 style="color: #003366; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Configurações</h3>
                <p><strong>Redundância:</strong> <span data-field="config.backup">${formDataObj.config?.backup === 'N' ? 'N (Sem redundância)' : 
                formDataObj.config?.backup === 'N+1' ? 'N+1 (Redundância parcial)' : 
                formDataObj.config?.backup === '2N' ? '2N (Redundância total)' : 'Não informado'}</span></p>
                <p><strong>Temperatura Desejada:</strong> <span data-field="setpoint.temperatura">${formDataObj.setpoint?.temperatura ? formDataObj.setpoint.temperatura + '°C' : 'Não informado'}</span></p>
                <p><strong>Pressurização:</strong> <span data-field="pressurizacao.necessaria">${formDataObj.pressurizacao?.necessaria === '1' ? 'Sim' : 'Não'}</span></p>
                ${formDataObj.pressurizacao?.necessaria === '1' ? `<p><strong>Pressão:</strong> <span data-field="pressurizacao.delta_p">${formDataObj.pressurizacao?.delta_p ? formDataObj.pressurizacao.delta_p + ' Pa' : 'Não informado'}</span></p>` : ''}
                <p><strong>Exaustão:</strong> <span data-field="exaustao.necessaria">${formDataObj.exaustao?.necessaria === '1' ? 'Sim' : 'Não'}</span></p>
            </div>
        `;

        // Seção Carga Térmica
        previewHTML += `
            <div class="preview-section">
                <h3 style="color: #003366; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Carga Térmica</h3>
                <p><strong>Dissipação:</strong> <span data-field="carga_interna.dissipacao">${formDataObj.carga_interna?.dissipacao ? formDataObj.carga_interna.dissipacao + ' W' : 'Não informado'}</span></p>
                <p><strong>Número de Pessoas:</strong> <span data-field="carga_interna.n_pessoas">${formDataObj.carga_interna?.n_pessoas || 'Não informado'}</span></p>
                <p><strong>Vazão de Ar:</strong> <span data-field="carga_interna.vazao_ar">${formDataObj.carga_interna?.vazao_ar ? formDataObj.carga_interna.vazao_ar + ' l/s' : 'Não informado'}</span></p>
            </div>
        `;

        // Seção Resumo de Cálculos
        previewHTML += `
            <div class="preview-section" style="grid-column: span 2;">
                <h3 style="color: #003366; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Resumo de Cálculos</h3>
                <div style="background: #e9ecef; padding: 15px; border-radius: 5px;">
                    <p><strong>Carga Térmica Total Estimada:</strong> ${cargaTermica.total_w ? (cargaTermica.total_w / 1000).toFixed(2) + ' kW' : 'Não calculado'}</p>
                    <p><strong>Capacidade em TR (Tons de Refrigeração):</strong> ${cargaTermica.total_tr ? cargaTermica.total_tr.toFixed(2) + ' TR' : 'Não calculado'}</p>
                    <p><strong>Solução Recomendada:</strong> ${cargaTermica.solucao ? cargaTermica.solucao : 'Não calculada'}</p>
                    <p><strong>Equipamentos Necessários:</strong> ${cargaTermica.equipamentos ? cargaTermica.equipamentos : 'Não calculado'}</p>
                </div>
            </div>
        `;

        previewHTML += `</div>`;
        previewContainer.innerHTML = previewHTML;

        // Mostrar preview e esconder formulário
        form.style.display = 'none';
        previewContainer.style.display = 'block';
        backBtn.style.display = 'inline-block';
        editBtn.style.display = 'inline-block';
        previewBtn.style.display = 'none';
    }

    function backToForm() {
        form.style.display = 'block';
        previewContainer.style.display = 'none';
        backBtn.style.display = 'none';
        editBtn.style.display = 'none';
        document.getElementById('preview-btn').style.display = 'inline-block';
    }

    function enableEditing() {
        const previewSections = previewContainer.querySelectorAll('.preview-section');
        
        previewSections.forEach(section => {
            const fields = section.querySelectorAll('[data-field]');
            
            fields.forEach(field => {
                const fieldName = field.getAttribute('data-field');
                const value = field.textContent.replace('Não informado', '').trim();
                const fieldType = determineFieldType(fieldName);
                
                let inputElement;
                
                if (fieldName === 'ambiente.tipo_construcao' || fieldName === 'config.backup' || 
                    fieldName === 'pressurizacao.necessaria' || fieldName === 'exaustao.necessaria') {
                    // Campo select
                    inputElement = document.createElement('select');
                    
                    if (fieldName === 'ambiente.tipo_construcao') {
                        inputElement.innerHTML = `
                            <option value="">Selecione...</option>
                            <option value="eletrocentro" ${value === 'Eletrocentro' ? 'selected' : ''}>Eletrocentro</option>
                            <option value="alvenaria" ${value === 'Alvenaria' ? 'selected' : ''}>Alvenaria</option>
                        `;
                    } else if (fieldName === 'config.backup') {
                        inputElement.innerHTML = `
                            <option value="N" ${value.includes('N (Sem redundância)') ? 'selected' : ''}>N (Sem redundância)</option>
                            <option value="N+1" ${value.includes('N+1 (Redundância parcial)') ? 'selected' : ''}>N+1 (Redundância parcial)</option>
                            <option value="2N" ${value.includes('2N (Redundância total)') ? 'selected' : ''}>2N (Redundância total)</option>
                        `;
                    } else {
                        inputElement.innerHTML = `
                            <option value="0" ${value === 'Não' ? 'selected' : ''}>Não</option>
                            <option value="1" ${value === 'Sim' ? 'selected' : ''}>Sim</option>
                        `;
                    }
                } else {
                    // Campo input
                    inputElement = document.createElement('input');
                    inputElement.type = fieldType === 'number' ? 'number' : 'text';
                    inputElement.value = value.replace(/[^\d.,-]/g, '');
                    
                    if (fieldType === 'number') {
                        inputElement.step = fieldName.includes('temperatura') ? '0.1' : '0.01';
                    }
                }
                
                inputElement.style.width = '100%';
                inputElement.style.padding = '5px';
                inputElement.setAttribute('data-field', fieldName);
                
                field.innerHTML = '';
                field.appendChild(inputElement);
            });
        });
        
        // Alterar botões
        editBtn.textContent = 'Salvar Alterações';
        editBtn.removeEventListener('click', enableEditing);
        editBtn.addEventListener('click', saveEditedData);
    }

    function saveEditedData() {
        const inputs = previewContainer.querySelectorAll('[data-field]');
        
        inputs.forEach(input => {
            const fieldName = input.getAttribute('data-field');
            const keys = fieldName.split('.');
            let value = input.value;
            
            // Atualizar o objeto formDataObj
            let current = formDataObj;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
        });
        
        // Atualizar o preview com os novos dados
        showPreview();
    }

    function determineFieldType(fieldName) {
        if (fieldName.includes('area') || fieldName.includes('pe_direito') || 
            fieldName.includes('oeste') || fieldName.includes('leste') || 
            fieldName.includes('norte') || fieldName.includes('sul') || 
            fieldName.includes('nao_climatizada') || fieldName.includes('climatizada') || 
            fieldName.includes('dissipacao') || fieldName.includes('vazao_ar') || 
            fieldName.includes('temperatura') || fieldName.includes('delta_p')) {
            return 'number';
        }
        return 'text';
    }

    function calcularCargaTermica(data) {
        // Cálculos simplificados para demonstração
        // Você deve substituir por seus cálculos reais
        
        const area = parseFloat(data.ambiente?.area) || 0;
        const peDireito = parseFloat(data.ambiente?.pe_direito) || 0;
        const dissipacao = parseFloat(data.carga_interna?.dissipacao) || 0;
        const nPessoas = parseInt(data.carga_interna?.n_pessoas) || 0;
        
        // Cálculo fictício - substitua pelo seu cálculo real
        const total_w = area * peDireito * 10 + dissipacao + nPessoas * 100;
        const total_tr = total_w / 3517; // 1 TR ≈ 3517 W
        
        // Solução recomendada fictícia
        let solucao = '';
        let equipamentos = '';
        
        if (total_tr < 5) {
            solucao = '1 equipamento de 5 TR';
            equipamentos = 'Wall Mounted 5 TR';
        } else if (total_tr < 10) {
            solucao = '2 equipamentos de 5 TR (N+1)';
            equipamentos = '2x Wall Mounted 5 TR';
        } else {
            solucao = '3 equipamentos de 7.5 TR (N+1)';
            equipamentos = '3x Wall Mounted 7.5 TR';
        }
        
        return {
            total_w,
            total_tr,
            solucao,
            equipamentos
        };
    }

    function validateForm() {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value) {
                field.style.borderColor = 'red';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });

        return isValid;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-carga-termica');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Mostrar loading
        const loading = document.createElement('div');
        loading.id = 'loading';
        loading.style.position = 'fixed';
        loading.style.top = '0';
        loading.style.left = '0';
        loading.style.width = '100%';
        loading.style.height = '100%';
        loading.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loading.style.display = 'flex';
        loading.style.justifyContent = 'center';
        loading.style.alignItems = 'center';
        loading.style.zIndex = '1000';
        loading.innerHTML = '<div style="color: white; font-size: 24px;">Gerando PDFs, por favor aguarde...</div>';
        document.body.appendChild(loading);
        
        // Coletar dados do formulário
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            const keys = key.split(/\[|\]/).filter(k => k);
            keys.reduce((acc, k, i) => {
                if (i === keys.length - 1) {
                    acc[k] = value;
                } else {
                    acc[k] = acc[k] || {};
                }
                return acc[k];
            }, data);
        }
        
        // Enviar para o servidor
        fetch('processa.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'sucesso') {
                // Função para baixar múltiplos PDFs
                baixarPDFs(data.pdfs.pc, data.nomes_arquivos.pc, data.pdfs.pt, data.nomes_arquivos.pt);
            } else {
                throw new Error(data.mensagem || 'Erro ao gerar PDFs');
            }
        })
        .catch(error => {
            alert('Erro: ' + error.message);
        })
        .finally(() => {
            // Esconder loading
            document.body.removeChild(loading);
        });
    });
});

// Função para baixar múltiplos PDFs
function baixarPDFs(base64PC, nomePC, base64PT, nomePT) {
    // Função auxiliar para criar e disparar download
    const criarDownload = (base64Data, fileName) => {
        // Converter base64 para Blob
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, {type: 'application/pdf'});
        const url = URL.createObjectURL(blob);
        
        // Criar link e disparar download
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Limpeza
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    };

    // Baixar Proposta Comercial
    criarDownload(base64PC, nomePC);
    
    // Baixar Proposta Técnica com pequeno delay
    setTimeout(() => {
        criarDownload(base64PT, nomePT);
    }, 500);
}