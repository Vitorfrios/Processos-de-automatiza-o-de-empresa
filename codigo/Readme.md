# 🧩 Sistema de Climatização e Gestão de Projetos

Este projeto é um sistema modular voltado para **gerenciamento e cálculo térmico de ambientes climatizados**, permitindo criar, salvar e verificar projetos de engenharia com base em dados estruturais, de ocupação e ventilação.

---

## 📁 Estrutura do Código

```txt
codigo/
├─ servidor.py
├─ Readme.md
├─ json
│   ├─ backup.json   
│   └─ dados.json    
└─ public
    ├─ pages
    │   └─ index.html
    ├─ pastas.py     
    ├─ scripts       
    │   ├─ page1
    │   │   ├─ calculos
    │   │   │   ├─ airFlow
    │   │   │   │   ├─ airFlowCalculations.js
    │   │   │   │   └─ airFlowDisplay.js
    │   │   │   ├─ calculos.js
    │   │   │   ├─ thermalGains
    │   │   │   │   ├─ thermalCalculations.js
    │   │   │   │   ├─ thermalComponents.js
    │   │   │   │   └─ thermalDisplay.js
    │   │   │   └─ utils
    │   │   │       └─ helpers.js
    │   │   ├─ config
    │   │   │   └─ config.js
    │   │   ├─ data
    │   │   │   ├─ data-utils.js
    │   │   │   ├─ modules
    │   │   │   │   ├─ climatizacao.js
    │   │   │   │   ├─ configuracao.js
    │   │   │   │   ├─ machines
    │   │   │   │   │   ├─ capacityCalculator.js
    │   │   │   │   │   ├─ machineManagement.js
    │   │   │   │   │   ├─ machinesBuilder.js
    │   │   │   │   │   └─ utilities.js
    │   │   │   │   ├─ maquinas.js
    │   │   │   │   ├─ projeto.js
    │   │   │   │   └─ salas.js
    │   │   │   ├─ projects.js
    │   │   │   ├─ rooms.js
    │   │   │   ├─ server-utils.js
    │   │   │   └─ server.js
    │   │   ├─ globals.js
    │   │   ├─ main.js
    │   │   ├─ ui
    │   │   │   ├─ edit.js
    │   │   │   └─ interface.js
    │   │   └─ utils
    │   │       └─ utils.js
    │   └─ page2
    └─ static
        ├─ page1
        │   ├─ base
        │   │   ├─ reset.css
        │   │   └─ variables.css
        │   ├─ components
        │   │   ├─ buttons.css
        │   │   ├─ cards.css
        │   │   ├─ forms.css
        │   │   ├─ header.css
        │   │   ├─ machines.css
        │   │   ├─ navigation.css
        │   │   └─ tables.css
        │   ├─ layout
        │   │   ├─ grid.css
        │   │   └─ sections.css
        │   ├─ main.css
        │   └─ pages
        │       ├─ projects.css
        │       └─ thermal-calculation.css
        └─ page2

```

---

## ⚙️ ARQUIVOS E FUNÇÕES

### [globals.js]

| Função | Descrição |

- **initializeGlobals**: | Função para inicializar todas as funções globais

### [main.js]

| Função | Descrição |

- **loadAllModules**: | Carrega todos os módulos do sistema dinamicamente e os atribui ao escopo global. Garante que todas as funções estejam disponíveis no objeto window
- **loadSystemConstants**: | Carrega as constantes do sistema do servidor. Essenciais para todos os cálculos do sistema
- **verifyAndCreateBaseProject**: | Verifica se é necessário criar um projeto base quando não há projetos existentes. Garante que o usuário sempre tenha pelo menos um projeto para trabalhar
- **finalSystemDebug**: | Função de debug para verificar o estado final do sistema após inicialização. Exibe informações detalhadas sobre projetos, salas e módulos carregados

### [airFlowCalculations.js]

| Função | Descrição |

- **calculateDoorFlow**: | Calcula fluxo de ar individual por porta
- **computeAirFlowRate**: | Calcula vazão total de ar baseada em portas e pressurização
- **calculateVazaoAr**: | Orquestra cálculo completo de vazão com validações
- **calculateVazaoArAndThermalGains**: | Coordena cálculo sequencial de vazão e ganhos térmicos

### [airFlowDisplay.js]

| Função | Descrição |

- **updateFlowRateDisplay**: | Atualiza exibição do resultado de vazão na interface

### [thermalCalculations.js]

| Função | Descrição |

- **calculateThermalGains**: | Calcula ganhos térmicos totais do ambiente
- **calculateUValues**: | Determina coeficientes de transferência térmica
- **calculateAuxiliaryVariables**: | Calcula variáveis auxiliares para cálculos de ar externo

### [thermalComponents.js]

| Função | Descrição |

- **calculateCeilingGain**: | Calcula ganho térmico através do teto por condução
- **calculateWallGain**: | Calcula ganho térmico através de paredes
- **calculatePartitionGain**: | Calcula ganho térmico através de divisórias internas
- **calculateFloorGain**: | Calcula ganho térmico através do piso
- **calculateLightingGain**: | Calcula ganho térmico da iluminação artificial
- **calculateDissipationGain**: | Calcula ganho térmico de equipamentos elétricos
- **calculatePeopleGain**: | Calcula ganho térmico por ocupação humana
- **calculateExternalAirSensibleGain**: | Calcula ganho sensível do ar externo
- **calculateExternalAirLatentGain**: | Calcula ganho latente do ar externo

### [thermalDisplay.js]

| Função | Descrição |

- **calculateTotals**: | Consolida totais de ganhos térmicos
- **updateThermalGainsDisplay**: | Atualiza interface com resultados detalhados
- **updateWallDisplay**: | Atualiza exibição de dados de parede específica
- **updatePartitionDisplay**: | Atualiza exibição de dados de divisória específica

### [helpers.js]

| Função | Descrição |

- **safeNumber**: | Converte valores de entrada de forma segura para números, tratando casos vazios
- **waitForSystemConstants**: | Aguarda carregamento assíncrono das constantes do sistema
- **validateSystemConstants**: | Valida integridade das constantes do sistema
- **collectClimatizationInputs**: | Coleta dados de entrada da interface para processamento
- **updateElementText**: | Atualiza elemento de texto genérico

### [data-utils.js]

| Função | Descrição |

- **buildProjectData**: | Constrói o objeto de dados completo de um projeto a partir do HTML. Coleta nome do projeto, salas e todos os dados associados
- **extractRoomData**: | Extrai todos os dados de uma sala a partir do elemento HTML. Coleta inputs, configurações, máquinas, ganhos térmicos e capacidade
- **extractCapacityData**: | Extrai dados de capacidade de refrigeração de uma sala. Coleta fator de segurança, capacidade unitária, backup e cálculos
- **extractClimatizationMachineData**: | Extrai dados de uma máquina de climatização individual. Coleta tipo, potência, tensão, preço e opções selecionadas
- **parseMachinePrice**: | Função auxiliar para converter texto de preço em número. Remove formatação brasileira (R$, pontos e vírgulas)

### [projects.js]

| Função | Descrição |

- **fetchProjects**: | Busca todos os projetos do servidor e normaliza os IDs
- **getNextProjectId**: | Obtém o próximo ID disponível para um novo projeto
- **initializeProjectCounter**: | Inicializa o contador de projetos baseado nos projetos existentes no DOM
- **getNextProjectNumber**: | Retorna o próximo número de projeto disponível
- **normalizeProjectIds**: | Normaliza todos os IDs de um projeto (projeto e salas)
- **salvarProjeto**: | Salva um novo projeto no servidor
- **atualizarProjeto**: | Atualiza um projeto existente no servidor
- **saveProject**: | Salva ou atualiza um projeto (função principal chamada pela interface)
- **collapseProjectAfterSave**: | Colapsa o projeto após salvar
- **deleteProject**: | Deleta um projeto da interface
- **verifyProjectData**: | Verifica os dados de um projeto e gera relatório
- **generateProjectVerificationReport**: | Gera relatório de verificação do projeto
- **calculateRoomCompletionStats**: | Calcula estatísticas de preenchimento de uma sala
- **collapseElement**: | Colapsa um elemento na interface

### [rooms.js]

| Função | Descrição |

- **initializeAllCapacityInputs**: | Inicializando todos os inputs de capacidade

### [server-utils.js]

| Função | Descrição |

- **renderProjectFromData**: | Renderiza um projeto completo a partir dos dados carregados. Cria a estrutura do projeto e todas as suas salas
- **renderRoomFromData**: | Renderiza uma sala individual a partir dos dados carregados. Cria a sala e preenche todos os inputs e configurações
- **populateRoomInputs**: | Preenche todos os inputs e configurações de uma sala com dados carregados. Inclui inputs de climatização, opções, máquinas e dados de capacidade

### [server.js]

| Função | Descrição |

- **initializeGeralCount**: | Inicializa o contador global de projetos
- **removeBaseProjectFromHTML**: | Remove todos os projetos base do HTML
- **loadProjectsFromServer**: | Carrega projetos salvos do servidor para a sessão atual
- **loadSavedMachinesForRoom**: | Carrega máquinas salvas para uma sala específica
- **incrementGeralCount**: | Incrementa o contador global de projetos
- **decrementGeralCount**: | Decrementa o contador global de projetos
- **getGeralCount**: | Retorna o valor atual do contador global
- **resetDisplayLogic**: | Reseta a lógica de exibição de projetos
- **createSingleBaseProject**: | Cria um único projeto base na interface
- **createProjectBaseHTML**: | Cria o HTML do projeto base
- **saveFirstProjectIdOfSession**: | Salva o ID do primeiro projeto da sessão
- **addProjectToRemovedList**: | Adiciona um projeto à lista de removidos
- **getRemovedProjectsList**: | Retorna a lista de projetos removidos
- **isProjectRemoved**: | Verifica se um projeto foi removido
- **updateProjectButton**: | Atualiza o botão de salvar/atualizar do projeto
- **normalizeAllProjectsOnServer**: | Normaliza todos os IDs de projetos no servidor

### [climatizacao.js]

| Função | Descrição |

- **buildClimatizationSection**: | Constrói seção completa de climatização para uma sala específica. Organiza inputs de dados e resultados de cálculos térmicos de forma hierárquica
- **buildClimatizationTable**: | Constrói tabela completa de inputs para dados de climatização. Agrupa campos relacionados para melhor organização visual e usabilidade
- **buildClimaRow**: | Constrói linha da tabela com campos de input. Permite células vazias para layout flexível de formulário
- **buildClimaCell**: | Constrói célula individual com label e campo de input. Define estrutura consistente para diferentes tipos de campos
- **buildSelectInput**: | Constrói elemento select com opções pré-definidas. Inclui placeholder padrão para indicar seleção obrigatória
- **buildTextInput**: | Constrói campo de input textual ou numérico. Aplica validações específicas baseadas no tipo de campo
- **buildResultRow**: | Constrói linha de exibição de resultado calculado. Mostra vazão de ar externo como resultado primário dos cálculos
- **buildThermalGainsSection**: | Constrói seção completa de resultados de ganhos térmicos. Organiza dados calculados em tabelas categorizadas para análise detalhada

### [configuracao.js]

| Função | Descrição |

- **buildConfigurationSection**: | Criação da seção de configuração

### [maquinas.js]

| Função | Descrição |

- **initializeMachinesModule**: | Inicialização
- **initializeBackupSync**: | Sem descrição
- **initializeClimaInputBackupListener**: | Sem descrição
- **initializeFatorSegurancaListeners**: | Sem descrição

### [projeto.js]

| Função | Descrição |

- **createEmptyRoom**: | Cria uma nova sala vazia no projeto especificado. Insere o HTML da sala e inicializa componentes necessários
- **insertRoomIntoProject**: | Insere o HTML de uma sala no conteúdo do projeto
- **addNewRoom**: | Adiciona uma nova sala ao projeto com nome automático
- **fixExistingCapacityInputs**: | Corrige inputs de fator de segurança que estejam vazios. Aplica valores padrão baseados nas constantes do sistema
- **deleteRoom**: | Remove uma sala do projeto após confirmação do usuário

### [salas.js]

| Função | Descrição |

- **buildRoomHTML**: | Constrói o HTML completo de uma sala com todas as seções
- **buildRoomHeader**: | Constrói o cabeçalho da sala com título editável e botões de ação
- **buildRoomActions**: | Constrói a seção de ações da sala (atualmente vazia)

### [capacityCalculator.js]

| Função | Descrição |

- **buildCapacityCalculationTable**: | Constrói a tabela de cálculo de capacidade de refrigeração para uma sala
- **initializeStaticCapacityTable**: | Inicializa a tabela de capacidade estática (para casos específicos)
- **scheduleCapacityInit**: | Agenda a inicialização do sistema de capacidade para uma sala
- **initializeCapacitySystem**: | Inicializa o sistema de capacidade com tentativas de fallback
- **applyFatorSeguranca**: | Aplica o fator de segurança ao input correspondente
- **getThermalLoadTR**: | Obtém a carga térmica em TR (Tons de Refrigeração) para uma sala
- **calculateCapacitySolution**: | Calcula a solução de capacidade de refrigeração baseada nos parâmetros
- **getCapacityData**: | Obtém os dados atuais de capacidade de uma sala
- **saveCapacityData**: | Salva os dados de capacidade no servidor
- **loadCapacityData**: | Carrega os dados de capacidade do servidor para uma sala
- **applyCapacityData**: | Aplica os dados de capacidade carregados aos elementos da interface
- **applyBackupConfiguration**: | Aplica a configuração de backup ao número de unidades
- **getBackupFromClimatization**: | Obtém o tipo de backup configurado para climatização da sala
- **getBackupFromClimaInputs**: | Obtém o backup dos inputs de clima da sala
- **updateCapacityDisplay**: | Atualiza a exibição dos resultados de capacidade na tabela
- **updateBackupConfiguration**: | Atualiza a configuração de backup quando alterada pelo usuário
- **handleClimaInputBackupChange**: | Manipula mudanças no backup provenientes dos inputs de clima
- **syncBackupWithClimaInputs**: | Sincroniza o backup com os inputs de clima da sala
- **syncCapacityTableBackup**: | Sincroniza o backup da tabela de capacidade com os valores atuais

### [machineManagement.js]

| Função | Descrição |

- **addMachine**: | Adiciona uma nova máquina de climatização à sala especificada. Carrega dados das máquinas e constrói a interface HTML
- **buildClimatizationMachineHTML**: | Constrói o HTML completo para uma máquina de climatização. Inclui cabeçalho, formulário de configuração e seção de opções
- **buildFormGroup**: | Constrói um grupo de formulário com label e conteúdo
- **buildSelect**: | Constrói um elemento select com opções e handlers
- **buildOptionsHTML**: | Constrói a interface de opções adicionais da máquina
- **toggleMachineSection**: | Alterna a exibição da seção da máquina (expandir/recolher)
- **updateMachineTitle**: | Atualiza o título da máquina quando editado pelo usuário
- **updateMachineOptions**: | Atualiza as opções da máquina quando o tipo é alterado. Carrega novos dados de potência, tensão e opções
- **updateSelect**: | Atualiza as opções de um elemento select
- **calculateMachinePrice**: | Calcula o preço total da máquina considerando preço base e opções selecionadas
- **deleteClimatizationMachine**: | Remove uma máquina de climatização após confirmação do usuário

### [machinesBuilder.js]

| Função | Descrição |

- **buildMachinesSection**: | Constrói a seção completa de máquinas para uma sala. Inclui tabela de capacidade e container para máquinas
- **loadMachinesData**: | Carrega os dados das máquinas do servidor com cache
- **loadSavedMachines**: | Carrega máquinas salvas previamente para uma sala
- **buildClimatizationMachineFromSavedData**: | Constrói uma máquina de climatização a partir de dados salvos
- **buildFormGroup**: | Constrói um grupo de formulário com label e conteúdo
- **buildSelectWithSelected**: | Constrói um elemento select com opção pré-selecionada
- **buildSavedOptionsHTML**: | Constrói opções com seleções pré-definidas a partir de dados salvos
- **buildFallbackMachineFromSavedData**: | Constrói uma máquina fallback quando o tipo não é encontrado
- **updateCapacityFromThermalGains**: | Atualiza os cálculos de capacidade quando os ganhos térmicos mudam
- **initializeCapacityCalculations**: | Inicializa os cálculos de capacidade com múltiplas tentativas. Usa timeouts progressivos para garantir que a DOM esteja pronta
- **refreshAllCapacityCalculations**: | Atualiza todos os cálculos de capacidade em todas as salas. Útil para recálculos em lote

### [utilities.js]

| Função | Descrição |

- **updateElementText**: | Atualiza o texto de um elemento HTML baseado no seu ID. Função utilitária para manipulação segura de elementos DOM
- **removeEmptyMessage**: | Remove mensagens de "vazio" de um container. Usado para limpar mensagens padrão quando conteúdo é adicionado
- **showEmptyMessage**: | Exibe uma mensagem de "vazio" em um container se estiver vazio. Útil para fornecer feedback visual quando não há conteúdo
- **findRoomId**: | Encontra o ID da sala a partir de um elemento dentro dela. Navega pela árvore DOM para encontrar o container da sala

### [edit.js]

| Função | Descrição |

- **makeEditable**: | Inicia o modo de edição inline para um elemento (projeto ou sala). Permite que o usuário edite o texto diretamente no elemento
- **enableEditing**: | Habilita a edição do elemento configurando contentEditable
- **selectElementContent**: | Seleciona todo o conteúdo do elemento para facilitar a edição
- **attachEditingEventListeners**: | Anexa event listeners para tratar teclas e perda de foco durante edição
- **handleKeydown**: | Sem descrição
- **handleBlur**: | Sem descrição
- **saveInlineEdit**: | Salva as alterações feitas durante a edição inline
- **disableEditing**: | Desabilita o modo de edição do elemento
- **validateEditedText**: | Valida o texto editado pelo usuário
- **cancelInlineEdit**: | Cancela a edição e restaura o texto original

### [interface.js]

| Função | Descrição |

- **showSystemStatus**: | Exibe um banner de status do sistema (sucesso, erro, etc.)
- **removeExistingStatusBanner**: | Remove qualquer banner de status existente
- **createStatusBanner**: | Cria um elemento de banner de status
- **insertStatusBanner**: | Insere o banner de status no DOM
- **scheduleStatusBannerRemoval**: | Agenda a remoção automática do banner de sucesso
- **toggleElementVisibility**: | Alterna a visibilidade de um elemento (expandir/recolher)
- **expandElement**: | Expande um elemento na interface
- **collapseElement**: | Recolhe um elemento na interface
- **toggleProject**: | Alterna a visibilidade de um projeto
- **toggleRoom**: | Alterna a visibilidade de uma sala
- **toggleSection**: | Alterna a visibilidade de uma seção
- **toggleSubsection**: | Alterna a visibilidade de uma subseção
- **createEmptyProject**: | Cria um projeto vazio na interface
- **buildProjectHTML**: | Constrói o HTML de um projeto
- **buildProjectActionsFooter**: | Constrói o rodapé de ações do projeto
- **insertProjectIntoDOM**: | Insere o HTML do projeto no DOM
- **addNewProject**: | Adiciona um novo projeto à interface
- **removeEmptyProjectMessage**: | Remove a mensagem de "projeto vazio" quando salas são adicionadas
- **showEmptyProjectMessageIfNeeded**: | Exibe mensagem de "projeto vazio" se não houver salas

---

## 🏗️ Estrutura Visual do Sistema

### **🧭 Sistema de Climatização**

#### 🏢 Cabeçalho

```txt
| 🏢 Logo | **Nome do Sistema** | 🏢 Logo |
|:-------:|:-------------------:|:-------:|
```

#### 📋 Navegação Principal

```txt
| Nome da Aba | Campo **Add Project** | Campo **Dell** |
|:------------|:---------------------:|:--------------:|
```

#### 🗂️ Gerenciamento do Projeto

##### **📁 Projeto1 (–)**

```txt
| **Ações** | Campo **Edit** | Campo **Add** | Campo **Dell** |
|:----------|:--------------:|:-------------:|:--------------:|
```

###### **🏠 Sala 1 (–)**

```txt
| **Ação** | Campo **Edit** |
|:---------|:--------------:|

📁 Climatização (–)
📁 Máquinas (–)
  🔧 Configuração de cada máquina (–)
📁 Configuração Geral (–)

| **Ações Globais** |          |
|:------------------|:---------|
| 🔄 Atualizar Dados | 💾 Salvar |
```

##### **⚙️ Ações do Projeto**

```txt
| **Ações do Projeto** |          |                   |
|:---------------------|:---------|:------------------|
| 🧾 Verificar Dados    | 💾 Salvar | 📥 Baixar PDF/Word |
```

---

## 📊 Tabela de Inputs - Climatização

| Input                   | Input                    |
|:----------------------------|:-------------------------------------------|
| Ambiente                    | Back-up n/n+1/n+2                          |
| Área em m²                  | Tipo de Construção (Alvenaria/Eletrocentro)|
| Parede Oeste/Leste/Norte/Sul| Comprimentos em metros                     |
| Pé Direito                  | Altura em metros                           |
| Divisórias                  | Com áreas climatizadas e não climatizadas  |
| Dissipação (W)              | Carga térmica dos equipamentos             |
| Nº Pessoas                  | Ocupação                                   |
| Nº Portas Duplas/Simples    | Quantidade por tipo                        |
| Pressurização (Pa)          | Pressão diferencial                        |
| Setpoint (°C)               | Temperatura desejada                       |
| Vazão de Ar Externo (l/s)   | Resultado do cálculo                       |
| Combate a Incêndio          | Manual/Detecção/FM200/NOVEC/FirePRO/N/I    |

---

## 🔍 Correlação entre Células e Inputs

| Célula | Input Correspondente |
|--------|---------------------|
| B2  | Ambiente |
| B3  | Back-up |
| B4  | Área |
| B5  | Tipo de Construção |
| B6  | Parede Oeste |
| B7  | Parede Leste |
| B8  | Parede Norte |
| B9  | Parede Sul |
| B10 | Pé Direito |
| B11 | Divisória Área Não Climatizada 1 |
| B12 | Divisória Área Não Climatizada 2 |
| B13 | Divisória Área Climatizada 1 |
| B14 | Divisória Área Climatizada 2 |
| B15 | Dissipação |
| B16 | Nº Pessoas |
| B17 | Vazão de Ar Externo |
| B18 | Nº Portas Duplas |
| B19 | Nº Portas Simples |
| B20 | Pressurização |
| B21 | Setpoint |
| B22 | Combate a Incêndio |
| B23 | U-Value 1 (Alvenaria Teto) — 3,961 |
| B24 | U-Value 2 (Alvenaria Parede) — 2,546 |
| B25 | U-Value 3 (Lã de Rocha Teto) — 1,145 |
| B26 | U-Value 4 (Lã de Rocha Parede) — 1,12 |

---

## 📐 Variáveis Auxiliares

| Variável | Fórmula / Valor |
|----------|----------------|
| AUX_U_Value_Parede | `=IF(B5="Eletrocentro";B26;IF(B5="Alvenaria";B24;"ERRO"))` |
| AUX_U_Value_Teto | `=IF(B5="Eletrocentro";B25;IF(B5="Alvenaria";B23;"ERRO"))` |
| AUX_U_Value_Piso | 2,7 |
| AUX_Fator_Iluminacao | 7 |
| AUX_Fs_Iluminacao | 1 |
| AUX_Fator_Conver_Painel | 1 |
| AUX_Fs_Paineis | 100 |
| AUX_OCp_Csp | 86,5 |
| AUX_OCp_Clp | 133,3 |
| Densi_ar | 1,17 |
| AUX_m_ArExterno | `=B17*3,6*Densi_ar*1000` |
| AUX_c_ArExterno | 0,24 |
| AUX_deltaT_ArExterno | 10 |
| AUX_f_ArExterno | 3,01 |
| AUX_deltaUa_ArExterno | 8,47 |

---

## 🧮 Fórmulas e Cálculos Principais

### 🔹 Vazão de Ar Externo

**Fórmula Excel:**

```excel
=ROUNDUP((B39+B40)/3,6*1,25*1;0)
```

**Componentes:**

- `B39` = AUX Portas Duplas
- `B40` = AUX Portas Simples

**AUX Portas Duplas:**

```excel
(0,827 * B18 * VARIAVEL_PD * (POWER(B20;0,5)) * 3600)
```

- `B18` = Nº Portas Duplas
- `B20` = Pressurização (Pa)
- `VARIAVEL_PD` = 0,042 (armazenada em `dados.json`)

**AUX Portas Simples:**

```excel
(0,827 * B19 * VARIAVEL_PS * (POWER(B20;0,5)) * 3600)
```

- `B19` = Nº Portas Simples
- `VARIAVEL_PS` = 0,024 (armazenada em `dados.json`)

---

## 🌡️ Diferenças de Temperatura (ΔT)

| Superfície | ΔT |
|------------|----|
| Piso | 7,5 |
| Teto | 20 |
| Paredes (Oeste/Leste/Norte/Sul) | 13 |
| Divisória Não Climatizada 1 e 2 | 10 |
| Divisória Climatizada 1 e 2 | 3 |

---

## 🧪 Cálculos Específicos

### Dissipação Térmica Interna

```excel
Calc_Dissp_Term = AUX_Fator_Conversao_Painel * B15 * AUX_Fs_Paineis / 100
```

### Ocupação

```excel
Calc_Ocp_Pss_C1 = AUX_OCp_Csp * B16 * AUX_Fs_OCp_Pessoas / 100
Calc_Ocp_Pss_C2 = AUX_OCp_Clp * B16 * AUX_Fs_OCp_Pessoas / 100
```

### Ar Externo

```excel
Calc_Gsens_ArE = AUX_m_ArExterno * AUX_c_ArExterno * AUX_deltaT_ArExterno
```

---

## 📈 Ganhos por Elemento

## 📊 Tabelas de Cálculos Térmicos

## 🧱 Ganho de Paredes e Teto

| Elemento | INPUT | Área (m²) | U-Value (W/m².K) | ΔT corrigido (°C) | Ganho Térmico (W) |
|:---------|:-----:|:---------:|:----------------:|:-----------------:|:-----------------:|
| ganho_teto | B4 | B4 | AUX_U_Value_Teto | deltaT_teto | =B4*AUX_U_Value_Teto*deltaT_teto |
| ganho_parede_oeste | B6 | =B6*$B$10 | AUX_U_Value_Parede | deltaT_parede_Oes | ``=B5*AUX_U_Value_Parede*deltaT_parede_Oes`` |
| ganho_parede_leste | B7 | =B7*$B$10 | AUX_U_Value_Parede | deltaT_parede_Les | ``=B6*AUX_U_Value_Parede*deltaT_parede_Les`` |
| ganho_parede_norte | B8 | =B8*$B$10 | AUX_U_Value_Parede | deltaT_parede_Nor | ``=B7*AUX_U_Value_Parede*deltaT_parede_Nor`` |
| ganho_parede_sul | B9 | =B9*$B$10 | AUX_U_Value_Parede | deltaT_parede_Sul | ``=B8*AUX_U_Value_Parede*deltaT_parede_Sul`` |
| **total_externo** | = | ganho_teto | + ganho_parede_oeste | + ganho_parede_leste | + ganho_parede_norte + ganho_parede_sul |

---

## 🚪 Ganho por Divisórias

| Elemento | INPUT | Área (m²) | U-Value | ΔT | Ganho Térmico (W) |
|:---------|:-----:|:---------:|:-------:|:--:|:-----------------:|
| ganho_divi_Anc1 | B11 | =B11*$B$10 | AUX_U_Value_Parede | deltaT_divi_An_clim1 | ``=B11*AUX_U_Value_Parede*deltaT_divi_N_clim1`` |
| ganho_divi_Anc2 | B12 | =B12*$B$10 | AUX_U_Value_Parede | deltaT_divi_An_clim2 | ``=B12*AUX_U_Value_Parede*deltaT_divi_N_clim2`` |
| ganho_divi_c1 | B13 | =B13*$B$10 | AUX_U_Value_Parede | deltaT_divi_clim1 | ``=B13*AUX_U_Value_Parede*deltaT_divi_clim1`` |
| ganho_divi_c2 | B14 | =B14*$B$10 | AUX_U_Value_Parede | deltaT_divi_clim2 | ``=B14*AUX_U_Value_Parede*deltaT_divi_clim2`` |
| **total_divisoes** | = | ganho_divi_nc1 | + ganho_divi_Anc2 | + ganho_divi_c1 | + ganho_divi_c2 |

---

## 🟫 Ganho por Piso

| Elemento | INPUT | Área (m²) | U-Value | ΔT | Ganho Térmico (W) |
|:---------|:-----:|:---------:|:-------:|:--:|:-----------------:|
| ganho_piso | B4 | B4 | AUX_U_Value_Piso | deltaT_piso | ``=B4*AUX_U_Value_Piso*deltaT_piso`` |
| **total_piso** | = | ganho_piso | | | |

---

## 💡 Ganho por Iluminação

| Elemento | INPUT | Área (m²) | Fator (W/m²) | Fs | Ganho Térmico (W) |
|:---------|:-----:|:---------:|:------------:|:--:|:-----------------:|
| ganho_iluminacao | B4 | B4 | AUX_Fator_Iluminacao | AUX_Fs_Iluminacao | ``=B4*AUX_Fator_Iluminacao*AUX_Fs_Iluminacao`` |
| **total_iluminacao** | = | ganho_iluminacao | | | |

---

## 🔥 Dissipação Térmica Interna

| Elemento | Fator Conversão | Pe (W) | Fs | Ganho Térmico (W) |
|:---------|:---------------:|:------:|:--:|:-----------------:|
| ganho_dissi_termicaI | AUX_Fator_Conversao_Painel | B15 | AUX_Fs_Paineis | ``=Calc_Dissp_Term`` |
| **Total** | = | ganho_dissi_termicaI | | |

---

## 👥 Ganhos por Ocupação de Pessoas

| Elemento | Csp | Clp | O | Fs | Ganho Térmico (W) |
|:---------|:---:|:---:|:-:|:--:|:-----------------:|
| ganho_ocupacao_pessoas | AUX_OCp_Csp | AUX_OCp_Clp | B16 | AUX_Fs_OCp_Pessoas | ``=(Calc_Ocp_Pss_C1) + (Calc_Ocp_Pss_C2)`` |
| **total_pessoas** | = | ganho_ocupacao_pessoas | | | |

---

## 🌬️ Ganho Sensível de Ar Externo

| Elemento | m (kg) | c | ΔT (°C) | Ganho Térmico (W) |
|:---------|:------:|:-:|:-------:|:-----------------:|
| ganho_ar_sensivel | AUX_m_ArExterno | AUX_c_ArExterno | AUX_deltaT_ArExterno | ``= Calc_Gsens_ArE / 1000 * 1,16`` |
| **total_ar_sensivel** | = | ganho_ar_sensivel | | |

---

## 💧 Ganho Latente de Ar Externo

| Elemento | Var (l/s) | f | ΔUa (g/Kg) | Ganho Térmico (W) |
|:---------|:---------:|:-:|:----------:|:-----------------:|
| ganho_ar_latente | B17 | AUX_f_ArExterno | AUX_deltaUa_ArExterno | ``= B17*AUX_f_ArExterno*AUX_deltaUa_ArExterno`` |
| **total_ar_latente** | = | ganho_ar_latente | | |

---

## 📈 Somatório das Principais Cargas

| Descrição | Variável | Cálculo |
|:----------|:---------|:--------|
| Total Paredes Externas | total_externo | =ROUNDUP(total_externo;0) |
| Total Divisórias Internas | total_divisoes | =ROUNDUP(total_divisoes;0) |
| Total Piso | total_piso | =ROUNDUP(total_piso;0) |
| Total Iluminação | total_iluminacao | =ROUNDUP(total_iluminacao;0) |
| Total Equipamentos | total_equipamentos | =ROUNDUP(total_equipamentos;0) |
| Total Pessoas | total_pessoas | =ROUNDUP(total_pessoas;0) |
| Total Ar Externo | total_ArExterno | =ROUNDUP(total_ArExterno;0) |
| **TOTAL EM W** | total_geral | =ROUNDUP(total_geral;0) |
| **TOTAL EM TR** | total_geral_tr | =ROUNDUP(total_geral / 3517;0) |

---

## 📝 Observações do Sistema

- Cada **projeto** pode conter **n salas**
- Cada **sala** possui suas **seções independentes**:
|   - *Climatização* (tabela e cálculos)
  - *Máquinas* (cada uma com configuração própria)
  - *Configuração geral* (dados globais da sala)
- Todos os botões de **salvar**, **editar** e **deletar** estão conectados a funções JS específicas
- O layout segue a ideia de **"projetos → salas → seções → ações"**
- Sistema desenvolvido para **engenharia de climatização** com cálculos baseados em normas técnicas

---

| Carga Estimada N17 | Fator de Seg. O17 | Cap. Unit. P18  | Solução | Com back-up | TOTAL | FOLGA  |
|----------------|---------------|------------|---------|-------------|-------|--------|
| 12 TR          | 10,00%        | 2 TR       | 7       | n=solução se n/n+1/n+2         | 14 TR | 16,67% |

solução =ROUNDUP((N17*(O17+1))/P17;0)

| Carga Estimada N17 | Fator de Seg. O17 | Cap. Unit. P18 | Solução | Com back-up | TOTAL | FOLGA | |----------------|---------------|------------|---------|-------------|-------|--------| | 12 TR | 10,00% | 2 TR | 7 | n=solução se n/n+1/n+2 | 14 TR | 16,67% | solução =ROUNDUP((N17*(O17+1))/P17;0) | | | | |
