# Processos de automatização de empresa

Aplicação single-page que centraliza cadastro de obras, projetos, salas e cálculos de climatização, integrada a um backend Python simples que persiste dados em JSON e expõe tudo via HTTP local.

## Visão geral rápida

- SPA modular construída em JavaScript puro (`codigo/public/scripts/01_Create_Obra`) organizada pelas camadas `core`, `data`, `features` e `ui`.
- Camada de dados garante IDs seguros (`obra_`, `project_`, `room_`), reconstrói obras e sincroniza informações com a sessão ativa do usuário.
- Cadastro inline de empresas traz autocomplete conectado a `codigo/json/dados.json`, formata cabeçalhos e grava `data-*` na obra.
- Servidor Python (`codigo/servidor.py` + `servidor_modules`) atende `/obras`, `/api/session-obras`, `/api/dados/empresas` e demais rotas REST gravando em JSON.
- Scripts auxiliares em `utilitarios py` aceleram geração de builders e mantêm o histórico em `backup de arquivos`.

## Requisitos e execução local

1. Python 3.11+ (o projeto usa apenas a biblioteca padrão e os pacotes listados em `requirements.txt`).
2. (Opcional) `python -m venv .venv` e ative a virtualenv.
3. `pip install -r requirements.txt`.
4. Execute `python codigo/servidor.py` para subir o backend, carregar constantes e iniciar monitores.
5. Acesse `http://127.0.0.1:8000/codigo/public/pages/01_Create_Obra/index.html`.
6. `dados.json`, `backup.json` e `sessions.json` são criados/atualizados automaticamente quando novas obras são salvas.

## Estrutura de pastas

```text
Processos-de-automatiza-o-de-empresa/
├── README.md
├── codigo/
│   ├── servidor.py
│   ├── servidor_modules/
│   │   ├── core/ (server_core.py, routes_core.py, sessions_core.py)
│   │   ├── handlers/ (http_handler.py, route_handler.py)
│   │   └── utils/ (file_utils.py, cache_cleaner.py, browser_monitor.py, server_utils.py)
│   ├── json/ (backup.json, dados.json, sessions.json)
│   └── public/
│       ├── pages/01_Create_Obra/index.html
│       ├── scripts/01_Create_Obra/
│       │   ├── main.js
│       │   ├── core/
│       │   ├── data/ (adapters, builders, modules, utils)
│       │   ├── features/ (calculations, managers)
│       │   └── ui/ (components, helpers, interface)
│       └── static/01_Create_Obra/ (base, components, layout, pages, empresa-cadastro-inline.css)
├── backup de arquivos/ (snapshot da versão anterior do front-end)
└── utilitarios py/ (scripts de apoio, ex.: funções.py)
```

## Fluxo principal do sistema

1. `main.js` busca constantes em `/constants`, carrega todos os módulos via import dinâmico, tenta restaurar uma sessão com obras salvas e cria uma obra/projeto/sala base caso nada exista.
2. `core/app.js` inicializa `EventBus`, estado global e sistema de eventos `app:*`, expondo funções críticas via `window`.
3. Adaptadores (`data/adapters`) conectam a camada de dados às fontes externas: carregam obras do servidor, mantêm `sessions.json`, tratam desligamento e sincronizam cadastro de empresa.
4. Builders (`data/builders`) convertem DOM ⇄ JSON: constroem trechos HTML, preenchem seções, exportam dados de salas e garantem compatibilidade com as rotinas de persistência.
5. Gerenciadores (`features/managers`) criam/removem obras/projetos/salas, salvam no servidor, apresentam status e reagem a ações da UI.
6. Módulos de cálculo (`features/calculations` + `data/modules`) calculam vazão, ganhos térmicos, capacidade e constroem seções visuais como climatização, máquinas e configurações.
7. Componentes de UI (`ui/`) habilitam edição inline, modais de confirmação, banners de status e operações de download em PDF/Word.
8. O backend Python (`servidor.py`, `http_handler.py`, `route_handler.py`) recebe POST/PUT/DELETE, atualiza `codigo/json`, mantém sessões e responde autocompletes de empresa.

## Camadas do front-end (`codigo/public/scripts/01_Create_Obra`)

### Núcleo e bootstrap

| Arquivo | Funções/objetos em destaque | Responsabilidade |
| --- | --- | --- |
| `main.js` | `loadSystemConstants()`, `loadAllModules()`, `initializeEmpresaCadastro()`, `checkAndLoadExistingSession()`, `verifyAndCreateBaseObra()`, `verifyCriticalFunctions()` | Entry point do SPA: garante que constantes e módulos estejam disponíveis, injeta cadastro de empresa, restaura obras da sessão e monitora funções globais críticas antes de liberar o uso. |
| `core/app.js` | `initializeEventBus()`, `initializeState()`, `initializeInterface()`, `initializeCoreSystems()`, `bootstrapApplication()`, `reinitializeApplication()`, `getAppStatus()` | Inicializa EventBus e estado compartilhado (obras, salas, sessão, UI) e expõe funções para reinicializar e diagnosticar o aplicativo. |
| `core/constants.js` | `CALCULATION_CONSTANTS`, `UI_CONSTANTS`, `STORAGE_KEYS`, `API_CONSTANTS`, `MESSAGE_CONSTANTS`, `PERFORMANCE_CONSTANTS`, `getAllConstants()`, `getConstant()` | Centraliza constantes usadas em cálculos, UI e API; também publica-as em `window.APP_CONSTANTS` para facilitar debug. |
| `core/shared-utils.js` | `attachModuleToWindow()` | Utilitário único que percorre exports de cada módulo importado dinamicamente e disponibiliza funções no escopo global para manter compatibilidade com os HTMLs. |

### Data · Adapters (obras e empresa)

| Arquivo | Funções em destaque | Responsabilidade |
| --- | --- | --- |
| `data/adapters/obra-adapter.js` | Reexporta os adaptadores de obra, define `window.editarDadosEmpresa()`, `window.atualizarDadosEmpresa()`, `window.ocultarFormularioEmpresa()` e `window.ativarCadastroEmpresa()` | Fachada única para tudo que toca obras/empresas, garantindo que o cadastro inline seja acessível a partir do HTML legado. |
| `obra-adapter-folder/obra-data-loader.js` | `removeBaseObraFromHTML()`, `loadObrasFromServer()`, `loadSingleObra()`, `prepararDadosEmpresaNaObra()`, `obterDadosEmpresaDaObra()`, `debugLoadObras()` | Busca IDs da sessão, carrega as obras correspondentes via `/obras`, reconstrói DOM, injeta dados de empresa e oferece utilitário de debug. |
| `obra-adapter-folder/empresa-form-manager.js` | `atualizarInterfaceComEmpresa()`, `atualizarCamposEmpresaForm()`, `criarVisualizacaoEmpresa()`, `criarFormularioVazioEmpresa()` | Gerencia o formulário inline (vazio ou pré-preenchido), sincronizando cada input com a obra e renderizando a visualização após salvar. |
| `obra-adapter-folder/empresa-autocomplete.js` | `inicializarInputEmpresaHibrido()`, `filtrarEmpresas()`, `exibirSugestoes()`, `exibirTodasEmpresas()`, `navegarDropdown()`, `selecionarEmpresa()`, `selecionarOpcaoAtiva()` | Implementa autocomplete híbrido sigla/nome integrado ao backend (`/api/dados/empresas`), com teclado, mouse e fallback para listar todas as empresas. |
| `obra-adapter-folder/ui-helpers-obra-adapter.js` | `limparDadosSelecao()`, `inicializarDetectorBackspace()`, `corrigirPosicaoDropdown()`, `mostrarAvisoAutocompletado()`, `calcularNumeroClienteFinal()`, `calcularNumeroLocal()`, `atualizarNumeroClienteInput()`, `formatarData()` | Utilidades de UI para inputs de empresa: detectam backspace, reposicionam dropdown, calculam números de cliente/local e deixam tooltips em sincronia. |

### Data · Adapters (sessão e desligamento)

| Arquivo | Funções em destaque | Responsabilidade |
| --- | --- | --- |
| `session-adapter.js` | `isSessionActive()`, `startSessionOnFirstSave()`, `getSessionObras()`, `addObraToSession()`, `removeObraFromSessionLocal()`, `clearSessionObras()`, `initializeGeralCount()`, `incrementGeralCount()` | Controla o estado da sessão no navegador e no backend (`/api/session-obras`), adicionando/removendo IDs e expondo contadores usados na UI. |
| `shutdown-adapter.js` | `shutdownManual()`, `ensureSingleActiveSession()`, `initializeSession()`, `showShutdownMessage()`, `showFinalShutdownMessage()`, `showFinalMessageWithManualClose()` | Orquestra o desligamento seguro do sistema: mostra modais, garante que apenas uma sessão esteja ativa e dispara chamadas para `/api/sessions/shutdown`. |

### Data · Builders

| Arquivo | Funções em destaque | Responsabilidade |
| --- | --- | --- |
| `data-builders.js` | Reexporta builders e chama `attachModuleToWindow()` | Ponto único para carregar `obra-data-builder`, `room-data-extractors`, `machines-data-extractors` e `empresa-data-extractor` com import dinâmico. |
| `data-builders-folder/obra-data-builder.js` | `buildObraData()`, `buildProjectData()` | Lê o DOM de uma obra/projeto, agrega dados de empresa, projetos e salas e devolve JSON pronto para persistência. |
| `data-builders-folder/room-data-extractors.js` | `extractRoomData()`, `extractClimatizationInputs()`, `extractThermalGainsData()`, `extractCapacityData()`, `extractConfigurationData()` | Extrai todos os blocos de uma sala (inputs, ganhos térmicos, tabela de capacidade, configurações e dados auxiliares). |
| `data-builders-folder/machines-data-extractors.js` | `extractMachinesData()`, `extractClimatizationMachineData()` | Percorre o grid de máquinas, coleta opções selecionadas, preços e potências para cada unidade da sala. |
| `data-builders-folder/empresa-data-extractor.js` | `extractEmpresaData()` | Captura dados `data-*` referentes à empresa associada à obra, sincronizando com o formulário inline. |

### Data · Builders de UI

| Arquivo | Funções em destaque | Responsabilidade |
| --- | --- | --- |
| `ui-builders.js` | Reexporta renderers/preenchedores e chama `attachModuleToWindow()` | Disponibiliza `obra-renderer`, `project-renderer`, `room-renderer`, `machine-renderer` e `data-fillers` para outros módulos. |
| `ui-folder/obra-renderer.js` | `renderObraFromData()`, `populateObraData()` | Cria o HTML da obra com base no JSON e preenche seus atributos (nome, botões, cadastro de empresa). |
| `ui-folder/project-renderer.js` | `renderProjectFromData()`, `populateProjectData()` | Reconstrói cada projeto, incluindo cabeçalho, botões e vínculo com a obra, mantendo IDs seguros. |
| `ui-folder/room-renderer.js` | `renderRoomFromData()`, `populateRoomData()` | Monta o markup completo da sala (climatização, máquinas, capacidade, configurações) e mapeia os dados salvos para inputs. |
| `ui-folder/machine-renderer.js` | `findMachinesSection()`, `ensureMachinesSection()`, `fillMachinesData()`, `populateMachineData()` | Localiza/gera seções de máquinas, injeta itens salvos e garante que listas suspensas reflitam todas as opções disponíveis. |
| `ui-folder/data-fillers.js` | `fillClimatizationInputs()`, `fillThermalGainsData()`, `fillCapacityData()`, `fillConfigurationData()`, `ensureAllRoomSections()` | Preenche cada seção da sala com os dados persistidos antes de iniciar cálculos. |

### Cadastro de empresa inline

- `data/builders/empresa-cadastro-inline.js`: define a classe `EmpresaCadastroInline` e métodos como `ativarCadastro()`, `renderizarFormulario()`, `prepararDados()`, `prepararDadosObra()`, `cancelarCadastro()` e `atualizarHeaderObra()` para tratar a experiência completa do formulário inline e atualizar o header da obra.
- `public/static/01_Create_Obra/components/empresa-cadastro-inline.css`: estilos específicos para o formulário, dropdown hibrido, badges do header e estados de validação.

### Data · Modules

| Arquivo | Funções em destaque | Responsabilidade |
| --- | --- | --- |
| `data/modules/rooms.js` | `buildRoomHTML()`, `createEmptyRoom()`, `insertRoomIntoProject()`, `addNewRoom()`, `addNewRoomToProject()`, `deleteRoom()` | Cria salas vazias, injeta-as no projeto correto, garante IDs hierárquicos e remove salas de forma segura. |
| `data/modules/climatizacao.js` | `buildClimatizationSection()`, `buildClimatizationTable()`, `buildPressurizationRow()`, `buildThermalGainsSection()`, `togglePressurizationFields()` | Constrói a aba de climatização (inputs, tabelas, pressurização e ganhos térmicos) e alterna campos conforme necessário. |
| `data/modules/configuracao.js` | `buildConfigurationSection()` | Monta a seção de configurações/instalações, com switches e checkboxes atrelados a cada sala. |
| `data/modules/machines/machines-core.js` | `loadMachinesData()`, `buildMachinesSection()`, `addMachine()`, `loadSavedMachines()`, `updateMachineOptions()`, `updateMachineUI()`, `calculateMachinePrice()`, `calculateAllMachinesTotal()`, `deleteMachine()` | Responsável por buscar catálogo de máquinas, gerar formulários, atualizar selects dinâmicos e manter totais de custo por sala. |
| `data/modules/machines/capacity-calculator.js` | `initializeCapacitySystem()`, `applyFatorSeguranca()`, `calculateCapacitySolution()`, `saveCapacityData()`, `loadCapacityData()`, `applyCapacityData()`, `updateCapacityDisplay()`, `syncBackupWithClimaInputs()` | Controla a tabela de capacidade (TR, backup, folga), sincroniza com inputs de climatização e garante persistência das escolhas. |

### Data · Utils

| Arquivo | Funções em destaque | Responsabilidade |
| --- | --- | --- |
| `data/utils/data-utils.js` | `getNextProjectNumber()`, `getNextRoomNumber()`, `getNextObraNumber()`, `getRoomFullId()`, `getObraName()`, `getProjectName()`, `getRoomName()`, `extractNumberFromText()`, `getMachineName()`, `parseMachinePrice()`, `collectClimatizationInputs()`, `findClimatizationSection()` | Funções utilitárias para gerar nomes sequenciais, localizar elementos no DOM, extrair dados de climatização e debugar estruturas complexas. |
| `data/utils/id-generator.js` | `generateObraId()`, `generateProjectId()`, `generateRoomId()`, `ensureStringId()`, `isValidSecureId()`, `extractSequenceNumber()`, `generateMachineId()`, `sanitizeId()`, `generateSessionId()`, `validateIdHierarchy()`, `getNextSequenceNumber()` | Garante IDs seguros e hierárquicos (`obra_`, `project_`, `room_`) e oferece validadores compartilhados entre UI e persistência. |
| `data/utils/core-utils.js` | `waitForElement()`, `safeNumber()`, `updateElementText()`, `generateUniqueId()`, `isValidElement()`, `debounce()` | Utilidades menores usados em várias camadas (await pelo DOM, debounce, formatação). |

### Features · Managers

| Arquivo | Funções em destaque | Responsabilidade |
| --- | --- | --- |
| `features/managers/obra-manager.js` | Reexporta módulos de obra e ID, usa `attachModuleToWindow()` | Garante que `obra-creator`, `obra-persistence`, `obra-dom-manager`, `obra-save-handler` e `obra-utils` estejam disponíveis no `window` e compartilhados com o restante da aplicação. |
| `obra-folder/obra-creator.js` | `buildObraHTML()`, `buildObraActionsFooter()`, `insertObraIntoDOM()`, `createEmptyObra()`, `addNewObra()` | Cria toda a estrutura visual de uma obra, injeta no DOM e dispara criação automática de projeto/sala inicial. |
| `obra-folder/obra-dom-manager.js` | `findObraBlock()`, `findObraBlockWithRetry()`, `updateObraButtonAfterSave()` | Localiza blocos de obra no DOM (com retry) e ajusta os botões após salvar/atualizar. |
| `obra-folder/obra-save-handler.js` | `saveObra()` | Função principal de salvamento: coleta dados via builders, verifica se a obra é nova/existente, chama persistência e atualiza UI/status. |
| `obra-folder/obra-persistence.js` | `fetchObras()`, `supportFrom_saveObra()`, `atualizarObra()`, `deleteObraFromServer()` | Interface com o backend `/obras`: GET/POST/PUT/DELETE, valida IDs e usa `showSystemStatus()` para feedback do usuário. |
| `obra-folder/obra-utils.js` | `deleteObra()`, `verifyObraData()` | Remove obras com modal de confirmação e gera relatórios de preenchimento por projeto/sala usando `calculateRoomCompletionStats()`. |
| `features/managers/project-manager.js` | `buildProjectHTML()`, `createEmptyProject()`, `addNewProjectToObra()`, `deleteProject()` | Responsável por criar/remover projetos dentro de uma obra, mantendo botões e containers sincronizados. |

### Features · Calculations

| Arquivo | Funções em destaque | Responsabilidade |
| --- | --- | --- |
| `features/calculations/calculations-core.js` | `debouncedCalculation()`, `clearAllCalculationTimeouts()`, `waitForSystemConstants()`, `calculateVazaoArAndThermalGainsDebounced()`, `calculateVazaoArAndThermalGainsImmediate()`, `validateCalculationData()`, `prepareCalculationData()` | Camada intermediária que carrega constantes, valida dados e dispara cálculos de vazão/ganhos térmicos com debounce. |
| `features/calculations/air-flow.js` | `calculateDoorFlow()`, `computeAirFlowRate()`, `calculateVazaoAr()`, `calculateVazaoArAndThermalGains()`, `updateFlowRateDisplay()`, `validateAirFlowInputs()`, `prepareAirFlowData()`, `getAirFlowStats()` | Processa pressurização, número de portas, vazão externa e atualiza a UI com os resultados de vazão. |
| `features/calculations/thermal-gains.js` | `calculateCeilingGain()`, `calculateWallGain()`, `calculatePartitionGain()`, `calculateFloorGain()`, `calculateLightingGain()`, `calculateDissipationGain()`, `calculatePeopleGain()`, `calculateExternalAirSensibleGain()`, `calculateExternalAirLatentGain()`, `calculateTotals()`, `updateThermalGainsDisplay()`, `calculateUValues()`, `calculateAuxiliaryVariables()`, `calculateThermalGains()` | Calcula os ganhos térmicos completos (envoltória, carga interna, ar externo), atualiza a UI e alimenta a tabela de capacidade. |

### UI

| Arquivo | Funções em destaque | Responsabilidade |
| --- | --- | --- |
| `ui/interface.js` | `addNewProject()`, `toggleObra()`, `toggleProject()`, `toggleRoom()`, `toggleSection()`, `toggleSubsection()`, `downloadPDF()`, `downloadWord()`, `saveOrUpdateObra()` | Controla interações globais (expandir/colapsar, downloads, salvar) conectando botões HTML aos managers. |
| `ui/helpers.js` | `toggleElementVisibility()`, `expandElement()`, `collapseElement()`, `calculateRoomCompletionStats()`, `removeEmptyObraMessage()`, `showEmptyObraMessageIfNeeded()`, `removeEmptyProjectMessage()`, `showEmptyProjectMessageIfNeeded()`, `toggleAllElements()` | Utilidades de UI para manter mensagens de vazio, contadores e cálculo de preenchimento de sala. |
| `ui/components/edit.js` | `makeEditable()`, `enableEditing()`, `attachEditingEventListeners()`, `saveInlineEdit()`, `applyNameChange()`, `disableEditing()`, `validateEditedText()`, `makeAllEditable()`, `saveAllPendingEdits()`, `getEditStats()` | Sistema de edição inline usado em títulos de obra/projeto/sala com validação, undo básico e estatísticas. |
| `ui/components/status.js` | `showSystemStatus()`, `removeExistingStatusBanner()`, `removeAllStatusBanners()`, `createStatusBanner()`, `getStatusIcon()`, `getDefaultDuration()`, `insertStatusBanner()`, `scheduleStatusBannerRemoval()`, `showLoadingStatus()`, `showTemporaryStatus()`, `hasActiveStatusBanner()`, `getActiveBannersCount()` | Banners de status fixos/temporários que sinalizam sucesso, erro ou carregamento durante salvamentos e carregamentos. |
| `ui/components/modal/modal.js` | `showConfirmationModal()`, `closeConfirmationModal()`, `showToast()`, `hideSpecificToast()`, `hideToast()`, `undoDeletion()`, `confirmDeletion()`, `getPendingDeletion()` | Modal de confirmação de exclusão e sistema de "toast" com undo e countdown para remoção definitiva de obras. |
| `ui/components/modal/exit-modal.js` | `createModalHTML()`, `setupModalEvents()`, `removeExistingModal()`, `createShutdownModal()`, `showShutdownConfirmationModal()`, `showCustomShutdownModal()` | Modal de desligamento aplicado pelo `shutdown-adapter`, com timers e atalhos para encerramento seguro. |

### Estilos

Os estilos estão em `codigo/public/static/01_Create_Obra`, separados por responsabilidade:

- `base/`: variáveis e reset (`variables.css`, `reset.css`).
- `components/`: botões, cards, tabelas e `empresa-cadastro-inline.css`.
- `layout/`: grids, seções, modais.
- `pages/`: estilos específicos por página (ex.: `main.css`, `projects.css`, `thermal-calculation.css`).

## Dados auxiliares (`codigo/json`)

| Arquivo | Conteúdo | Observações |
| --- | --- | --- |
| `dados.json` | Catálogo de empresas e valores auxiliares usados pelo autocomplete e cabeçalho das obras. | Pode ser alimentado manualmente ou via rotas `/dados`. |
| `backup.json` | Snapshot completo das obras e projetos (utilizado para comparar durante atualizações). | Rota `/backup` atualiza/retorna este arquivo. |
| `sessions.json` | Lista a sessão/obras ativas para garantir exclusividade de edição. | Manipulado pelo `session-adapter` e pelas rotas `/api/sessions/*`. |

## Backend Python

| Arquivo | Componentes/funções | Responsabilidade |
| --- | --- | --- |
| `codigo/servidor.py` | `diagnostico_completo()`, `active_session_after_delay()`, `main()` | Inicializa o servidor HTTP, executa diagnósticos, configura portas, threads e monitora o tempo de atividade. |
| `servidor_modules/core/server_core.py` | Classe `ServerCore` | Encapsula criação do servidor, handlers de sinal, threads auxiliares, shutdown assíncrono e impressão de informações do sistema. |
| `servidor_modules/core/routes_core.py` | Classe `RoutesCore` | Agrupa as rotas REST, injeta dependências (sessões, FileUtils, CacheCleaner) e centraliza regras de roteamento. |
| `servidor_modules/core/sessions_core.py` | Classe `SessionsManager`, instância `sessions_manager` | Lê/escreve `sessions.json`, valida sessões únicas e é compartilhado com handlers e adaptadores JS. |
| `servidor_modules/handlers/http_handler.py` | `UniversalHTTPRequestHandler.do_GET/POST/PUT/DELETE()`, `send_json_response()` | Handler HTTP principal que roteia para `RouteHandler`, serve arquivos estáticos e expõe rotas como `/obras`, `/api/dados/empresas`, `/api/backup-completo`, `/api/sessions/*`. |
| `servidor_modules/handlers/route_handler.py` | Métodos `handle_get/post/put/delete_*` | Implementa a lógica de cada rota: CRUD de obras, controle de sessões, leitura de dados/backup e integrações específicas de empresas. |
| `servidor_modules/utils/file_utils.py` | `FileUtils.find_project_root()` e utilidades de paths | Resolve caminhos e garante que todos os handlers consigam achar `codigo/`, `json/` e assets. |
| `servidor_modules/utils/cache_cleaner.py` | Classe `CacheCleaner` | Limpa caches temporários e acompanha o ciclo de vida do servidor. |
| `servidor_modules/utils/browser_monitor.py` | `monitorar_navegador()` | Abre/monitora o navegador padrão quando o servidor sobe. |
| `servidor_modules/utils/server_utils.py` | Funções auxiliares de log e diagnósticos | Apoia `server_core` e os handlers com mensagens e verificações adicionais. |

## Scripts auxiliares

- `utilitarios py/funções.py`: gera automaticamente a pasta `data/builders/data-builders-folder` com arquivos base (obra, sala, climatização, máquinas, empresa etc.) para acelerar refatorações.

## Backup e referências

- `backup de arquivos/scripts/01_Create_Obra`: cópia congelada do front-end antes da refatoração atual. Útil para comparar comportamentos antigos ou recuperar trechos específicos.
- Sempre que uma nova função for criada, adicione-a às tabelas acima para manter o README sincronizado com a estrutura vigente.
