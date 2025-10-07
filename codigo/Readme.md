# 🧩 Sistema de Climatização e Gestão de Projetos

Este projeto é um sistema modular voltado para **gerenciamento e cálculo térmico de ambientes climatizados**, permitindo criar, salvar e verificar projetos de engenharia com base em dados estruturais, de ocupação e ventilação.

---

## 📁 Estrutura do Código

```txt
codigo/
├─ json/
│   ├─ backup.json
│   └─ dados.json
├─ markdown.md
└─ public/
    ├─ pages/
    │   └─ index.html
    ├─ pastas.py
    ├─ scripts/
    │   ├─ page1/
    │   │   ├─ calculos/
    │   │   │   └─ calculos.js
    │   │   ├─ config/
    │   │   │   └─ config.js
    │   │   ├─ data/
    │   │   │   ├─ projects.js
    │   │   │   ├─ rooms.js
    │   │   │   ├─ server.js
    │   │   │   ├─ server-utils.js
    │   │   │   └─ data-utils.js
    │   │   ├─ ui/
    │   │   │   ├─ interface.js
    │   │   │   └─ edit.js
    │   │   └─ utils/
    │   │       └─ utils.js
```

---

## ⚙️ ARQUIVOS E FUNÇÕES

### **config/config.js**

| Função/Constante | Descrição |
|-----------------|-----------|
| `API_CONFIG` | Configurações de endpoints da API |
| `CALCULATION_CONSTANTS` | Constantes para cálculos de engenharia |
| `NORMALIZATION_DONE_KEY` | Chave para controle de normalização de IDs |
| `REMOVED_PROJECTS_KEY` | Chave para lista de projetos removidos |
| `SESSION_STORAGE_KEY` | Chave para ID do primeiro projeto da sessão |
| `UI_CONSTANTS` | Constantes de interface do usuário |

---

### **data/server.js**

| Função | Descrição |
|--------|-----------|
| `incrementGeralCount()` | Incrementa contador global de projetos |
| `decrementGeralCount()` | Decrementa contador global de projetos |
| `getGeralCount()` | Retorna contador atual de projetos |
| `addProjectToRemovedList()` | Adiciona projeto à lista de removidos |
| `createSingleBaseProject()` | Cria projeto base único automaticamente |
| `debugGeralCount()` | Debug do contador de projetos |
| `getRemovedProjectsList()` | Retorna lista de projetos removidos |
| `isProjectRemoved()` | Verifica se projeto está na lista de removidos |
| `loadProjectsFromServer()` | Carrega projetos do servidor |
| `normalizeAllProjectsOnServer()` | Normaliza IDs no servidor |
| `removeBaseProjectFromHTML()` | Remove projetos base do HTML |
| `resetDisplayLogic()` | Reinicia lógica de exibição |
| `saveFirstProjectIdOfSession()` | Salva ID do primeiro projeto da sessão |
| `updateProjectButton()` | Atualiza texto do botão (Salvar/Atualizar) |

---

### **data/projects.js**

| Função | Descrição |
|--------|-----------|
| `atualizarProjeto()` | Atualiza projeto existente no servidor |
| `collapseProjectAfterSave()` | Colapsa projeto após salvar |
| `debugProjectsState()` | Debug do estado dos projetos |
| `deleteProject()` | Remove projeto da interface |
| `fetchProjects()` | Busca projetos do servidor |
| `generateProjectVerificationReport()` | Gera relatório de verificação |
| `getNextProjectId()` | Gera próximo ID de projeto |
| `getNextProjectNumber()` | Gera próximo número de projeto |
| `initializeProjectCounter()` | Inicializa contador de projetos |
| `normalizeProjectIds()` | Normaliza IDs de projetos |
| `salvarProjeto()` | Salva novo projeto no servidor |
| `saveProject()` | Salva/atualiza projeto (interface) |
| `verifyProjectData()` | Verifica dados do projeto |
| `calculateRoomCompletionStats()` | Calcula estatísticas de preenchimento |

---

### **data/server-utils.js**

| Função | Descrição |
|--------|-----------|
| `debugServerUtils()` | Debug das utilidades do servidor |
| `populateRoomInputs()` | Preenche inputs da sala com dados |
| `renderProjectFromData()` | Renderiza projeto a partir de dados |
| `renderRoomFromData()` | Renderiza sala a partir de dados |

---

### **data/data-utils.js**

| Função | Descrição |
|--------|-----------|
| `buildProjectData()` | Constrói objeto de dados do projeto |
| `extractRoomData()` | Extrai dados da sala |

---

### **data/rooms.js**

| Função | Descrição |
|--------|-----------|
| `addMachine()` | Adiciona máquina à sala |
| `addNewRoom()` | Adiciona nova sala ao projeto |
| `buildClimaCell()` | Constrói célula da tabela de climatização |
| `buildClimaRow()` | Constrói linha da tabela de climatização |
| `buildClimatizationSection()` | Constrói seção de climatização |
| `buildClimatizationTable()` | Constrói tabela de climatização |
| `buildConfigurationSection()` | Constrói seção de configuração |
| `buildMachineHTML()` | Constrói HTML da máquina |
| `buildMachinesSection()` | Constrói seção de máquinas |
| `buildResultRow()` | Constrói linha de resultados |
| `buildRoomActions()` | Constrói ações da sala |
| `buildRoomHeader()` | Constrói cabeçalho da sala |
| `buildRoomHTML()` | Constrói HTML da sala |
| `buildSelectInput()` | Constrói input select |
| `buildTextInput()` | Constrói input de texto |
| `buildThermalGainsSection()` | Constrói seção de ganhos térmicos |
| `createEmptyRoom()` | Cria sala vazia |
| `deleteMachine()` | Remove máquina da sala |
| `deleteRoom()` | Remove sala do projeto |
| `insertRoomIntoProject()` | Insere sala no projeto |
| `removeEmptyMachinesMessage()` | Remove mensagem de máquinas vazias |
| `showEmptyMachinesMessageIfNeeded()` | Mostra mensagem se não há máquinas |

---

### **ui/interface.js**

| Função | Descrição |
|--------|-----------|
| `addNewProject()` | Adiciona novo projeto (botão) |
| `buildProjectActionsFooter()` | Constrói rodapé de ações do projeto |
| `buildProjectHTML()` | Constrói HTML do projeto |
| `createEmptyProject()` | Cria projeto vazio |
| `createStatusBanner()` | Cria banner de status |
| `insertProjectIntoDOM()` | Insere projeto no DOM |
| `insertStatusBanner()` | Insere banner de status |
| `removeEmptyProjectMessage()` | Remove mensagem de projeto vazio |
| `removeExistingStatusBanner()` | Remove banner de status existente |
| `scheduleStatusBannerRemoval()` | Agenda remoção do banner |
| `showEmptyProjectMessageIfNeeded()` | Mostra mensagem se projeto vazio |
| `showSystemStatus()` | Mostra status do sistema |
| `toggleElementVisibility()` | Alterna visibilidade do elemento |
| `toggleProject()` | Alterna visibilidade do projeto |
| `toggleRoom()` | Alterna visibilidade da sala |
| `toggleSection()` | Alterna visibilidade da seção |
| `toggleSubsection()` | Alterna visibilidade da subseção |
| `collapseElement()` | Colapsa elemento |
| `expandElement()` | Expande elemento |

---

### **ui/edit.js**

| Função | Descrição |
|--------|-----------|
| `attachEditingEventListeners()` | Anexa listeners de edição |
| `cancelInlineEdit()` | Cancela edição inline |
| `disableEditing()` | Desabilita edição |
| `enableEditing()` | Habilita edição |
| `makeEditable()` | Torna elemento editável |
| `saveInlineEdit()` | Salva edição inline |
| `selectElementContent()` | Seleciona conteúdo do elemento |
| `validateEditedText()` | Valida texto editado |

---

### **calculos/calculos.js**

| Função | Descrição |
|--------|-----------|
| `calculateAuxiliaryVariables()` | Calcula variáveis auxiliares |
| `calculateCeilingGain()` | Calcula ganho do teto |
| `calculateDissipationGain()` | Calcula ganho por dissipação |
| `calculateDoorFlow()` | Calcula fluxo de portas |
| `calculateExternalAirLatentGain()` | Calcula ganho latente do ar externo |
| `calculateExternalAirSensibleGain()` | Calcula ganho sensível do ar externo |
| `calculateFloorGain()` | Calcula ganho do piso |
| `calculateLightingGain()` | Calcula ganho por iluminação |
| `calculatePartitionGain()` | Calcula ganho por divisórias |
| `calculatePeopleGain()` | Calcula ganho por pessoas |
| `calculateThermalGains()` | Calcula todos os ganhos térmicos |
| `calculateTotals()` | Calcula totais dos ganhos |
| `calculateUValues()` | Calcula valores U (coeficientes) |
| `calculateVazaoAr()` | Calcula vazão de ar |
| `calculateVazaoArAndThermalGains()` | Calcula vazão e ganhos térmicos |
| `calculateWallGain()` | Calcula ganho das paredes |
| `collectClimatizationInputs()` | Coleta inputs de climatização |
| `computeAirFlowRate()` | Calcula taxa de fluxo de ar |
| `updateElementText()` | Atualiza texto do elemento |
| `updateFlowRateDisplay()` | Atualiza display de vazão |
| `updatePartitionDisplay()` | Atualiza display de divisórias |
| `updateThermalGainsDisplay()` | Atualiza display de ganhos térmicos |
| `updateWallDisplay()` | Atualiza display de paredes |
| `validateSystemConstants()` | Valida constantes do sistema |
| `waitForSystemConstants()` | Aguarda constantes do sistema carregarem |

---

### **utils/utils.js**

| Função | Descrição |
|--------|-----------|
| `ensureStringId()` | Garante que ID seja string |

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

**📁 Projeto 1 (–)**

```txt
| **Ações** | Campo **Edit** | Campo **Add** | Campo **Dell** |
|:----------|:--------------:|:-------------:|:--------------:|
```

**🏠 Sala 1 (–)**

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

**⚙️ Ações do Projeto**

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
  - *Climatização* (tabela e cálculos)
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

| Carga Estimada N17 | Fator de Seg. O17 | Cap. Unit. P18 | Solução | Com back-up | TOTAL | FOLGA | |----------------|---------------|------------|---------|-------------|-------|--------| | 12 TR | 10,00% | 2 TR | 7 | n=solução se n/n+1/n+2 | 14 TR | 16,67% | solução =ROUNDUP((N17*(O17+1))/P17;0)