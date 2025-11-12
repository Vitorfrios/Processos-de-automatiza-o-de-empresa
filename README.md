# Processos de automatização de empresa

## Visão geral

- Aplicação web single-page para gestão de obras, projetos, salas e cálculos de climatização, alimentada por um backend Python em `codigo/servidor.py`.
- O front-end moderno vive em `codigo/public/scripts/01_Create_Obra`, organizado por camadas (`core`, `data`, `features`, `ui`, `utils`) e carregado dinamicamente por `main.js`.
- A pasta `backup de arquivos` guarda uma cópia completa do código JavaScript antes da refatoração; ela serve como referência histórica.
- Ferramentas auxiliares em `utilitarios py` automatizam geração de CSS/JS e consolidação de arquivos.

## Estrutura de pastas

```text
Processos-de-automatiza-o-de-empresa/
├─ app.py
├─ codigo/
│  ├─ servidor.py                        # ponto de entrada do backend
│  ├─ servidor_modules/
│  │  ├─ core/                           # rotas, sessões, server_core, routes_core
│  │  ├─ handlers/                       # http_handler, route_handler etc.
│  │  └─ utils/                          # file_utils, server_utils, cache_cleaner, browser_monitor
│  ├─ json/                              # configurações e bases auxiliares
│  └─ public/
│     ├─ pages/                          # HTMLs (01_Create_Obra)
│     ├─ scripts/01_Create_Obra/                  # JavaScript modular (documentado abaixo)
│     └─ static/01_Create_Obra/
│        ├─ base/                        # variables.css, reset.css
│        ├─ components/                  # buttons.css, cards.css, tables.css, machines.css...
│        ├─ layout/                      # grid.css, sections.css, modal.css, exit-modal.css
│        └─ pages/                       # thermal-calculation.css, projects.css, main.css
├─ backup de arquivos/
│  └─ scripts/01_Create_Obra/                     # versão anterior completa do front-end
├─ utilitarios py/                       # scripts Python de apoio (Detalhes*, juntar_linhas.py)
└─ requirements.txt, runtime.txt, rander.yml, CNAME
```

## Documentação dos arquivos JavaScript

Cada tabela indica as funções ou classes expostas por arquivo e seu objetivo principal.

### Aplicação atual (`codigo/public/scripts/01_Create_Obra`)

#### Núcleo e bootstrap

| Arquivo | Funções/Classes chave | O que faz |
| --- | --- | --- |
| `main.js` | `ShutdownManager`, `loadSystemConstants()`, `loadAllModules()`, `checkAndLoadExistingSession()`, `verifyCriticalFunctions()` | Entry point do front-end: inicializa botões de desligamento, busca constantes no backend, carrega módulos dinamicamente, sincroniza sessões e expõe no `window` todas as funções globais usadas pelos HTMLs. |
| `core/app.js` | `EventBus`, `ApplicationState`, `bootstrapApplication()`, `reinitializeApplication()`, `getAppStatus()` | Une antigo bootstrap/event-bus/state; registra listeners, mantém estado global (obras/projetos/salas/sessão) e dispara eventos `app:*`. Exporta inicialização automática quando o DOM carrega. |
| `core/constants.js` | `CALCULATION_CONSTANTS`, `UI_CONSTANTS`, `STORAGE_KEYS`, `VALIDATION_CONSTANTS`, `API_CONSTANTS`, `MESSAGE_CONSTANTS`, `PERFORMANCE_CONSTANTS`, `getAllConstants()`, `getConstant()` | Central de constantes usadas em cálculos, UI, sessão e API. Facilita import único e expõe `window.APP_CONSTANTS` para scripts legados. |
| `utils/core-utils.js` | `waitForElement()`, `safeNumber()`, `updateElementText()`, `generateUniqueId()`, `debounce()` | Utilidades genéricas (await de elementos, sanitização numérica, atualização de DOM, geração de IDs e debounce) utilizadas por módulos de cálculo e UI. |

#### Adaptadores, sessão e shutdown

| Arquivo | Funções/Classes chave | O que faz |
| --- | --- | --- |
| `data/adapters/obra-adapter.js` | `loadObrasFromServer()`, `migrateSessionToNewIds()`, `loadSingleObra()`, `debugLoadObras()` | Consome `/api/session-obras` e `/obras`, converte IDs antigos/novos, remove obras base duplicadas e orquestra `createEmptyObra`/`populateObraData`. |
| `data/adapters/session-adapter.js` | `isSessionActive()`, `setSessionActive()`, `getSessionObras()`, `addObraToSession()`, `clearSessionObras()`, `clearRenderedObras()`, `getGeralCount()`, `startNewSession()`, `startSessionOnFirstSave()` | Controle fino de sessão no `sessionStorage`, contador global de obras e limpeza seletiva do DOM preservando obras já salvas. |
| `data/adapters/shutdown-adapter.js` | `shutdownManual()`, `ensureSingleActiveSession()`, `initializeSession()`, `showShutdownMessage()` | Fluxo completo de desligamento manual: modal customizado, limpeza de sessões (frontend/backend) e POST `/api/shutdown`, além de overlays amigáveis em caso de erro. |

#### Construtores e utilitários de dados

| Arquivo | Funções/Classes chave | O que faz |
| --- | --- | --- |
| `data/builders/data-builders.js` | `buildObraData()`, `buildProjectData()`, `extractRoomData()`, `extractThermalGainsData()`, `extractClimatizationInputs()`, `extractMachinesData()`, `extractCapacityData()`, `extractConfigurationData()` | Percorre o DOM para montar JSON completo de obra/projeto/sala com seções de clima, máquinas, capacidade e configuração antes de salvar no servidor. |
| `data/builders/ui-builders.js` | `renderObraFromData()`, `renderProjectFromData()`, `renderRoomFromData()`, `fillClimatizationInputs()`, `fillThermalGainsData()`, `fillCapacityData()`, `fillConfigurationData()`, `ensureAllRoomSections()`, `ensureMachinesSection()`, `populateObraData()`, `populateMachineData()` | Processo inverso: recebe JSON e reconstrói a interface, incluindo fallback para IDs, preenchimento das tabelas e disparo de cálculos após render. |
| `data/utils/data-utils.js` | `getNextObraNumber()`, `getNextProjectNumber()`, `getNextRoomNumber()`, `getRoomFullId()`, `getObraName()`, `getProjectName()`, `collectClimatizationInputs()`, `findClimatizationSection()` | Utilidades para numerar nomes, garantir IDs seguros, extrair nomes/IDs do DOM e coletar inputs usados em cálculos de ar/ganhos térmicos. |
| `data/utils/id-generator.js` | `generateObraId()`, `generateProjectId()`, `generateRoomId()`, `generateMachineId()`, `ensureStringId()`, `isValidSecureId()`, `validateIdHierarchy()`, `sanitizeId()` | Sistema único de IDs hierárquicos (`obra_*`, `*_proj_*`, `*_sala_*`), com validações, extração de sequências e helpers para sessões e máquinas. |

#### Módulos de dados (salas, climatização e máquinas)

| Arquivo | Funções/Classes chave | O que faz |
| --- | --- | --- |
| `data/modules/rooms.js` | `buildRoomHTML()`, `createEmptyRoom()`, `initializeRoomComponents()`, `addNewRoom()`, `deleteRoom()`, `fixExistingCapacityInputs()` | Gera o markup completo das salas (clima+mísquinas+config), injeta no projeto correto, garante IDs válidos e inicializa dependências com tentativas progressivas. |
| `data/modules/climatizacao.js` | `buildClimatizationSection()`, `buildClimatizationTable()`, `buildPressurizationRow()` | Monta inputs hierárquicos da seção de climatização com validações de ID e handlers conectados aos cálculos de vazão e ganhos térmicos. |
| `data/modules/configuracao.js` | `buildConfigurationSection()` | Renderiza a grade de checkboxes de configuração de instalação com nomes únicos por sala. |
| `data/modules/machines/machines-core.js` | `loadMachinesData()`, `buildMachinesSection()`, `addMachine()`, `loadSavedMachines()`, `updateMachineOptions()`, `calculateMachinePrice()`, `toggleOption()`, `deleteMachine()`, `calculateAllMachinesTotal()` | Garante cache de dados `/machines`, monta cards de máquinas, trata selects dependentes, cálculo de preço/opções e sincroniza total geral da sala. |
| `data/modules/machines/capacity-calculator.js` | `buildCapacityCalculationTable()`, `scheduleCapacityInit()`, `initializeCapacitySystem()`, `calculateCapacitySolution()`, `updateCapacityDisplay()`, `updateBackupConfiguration()`, `syncBackupWithClimaInputs()` | Responsável pelos cálculos de capacidade/TR e pelo acoplamento entre backup configurado nas entradas de climatização e na tabela de capacidade. |

#### Funcionalidades de cálculo

| Arquivo | Funções/Classes chave | O que faz |
| --- | --- | --- |
| `features/calculations/air-flow.js` | `calculateVazaoAr()`, `calculateVazaoArAndThermalGains()`, `computeAirFlowRate()`, `updateFlowRateDisplay()`, `validateAirFlowInputs()` | Calcula vazão de ar considerando portas/pressurização, garante constantes carregadas e encadeia ganhos térmicos quando necessário. |
| `features/calculations/calculations-core.js` | `debouncedCalculation()`, `clearAllCalculationTimeouts()`, `waitForSystemConstants()`, `validateSystemConstants()`, `calculateVazaoArAndThermalGainsDebounced()`, `calculateVazaoArAndThermalGainsImmediate()`, `validateCalculationData()` | Núcleo compartilhado de cálculos: trata debounce por sala, checa constantes obrigatórias e expõe helpers reutilizados pelos módulos de ar e térmicos. |
| `features/calculations/thermal-gains.js` | `calculateThermalGains()`, `calculateCeilingGain()`, `calculateWallGain()`, `calculateExternalAirSensibleGain()`, `calculateExternalAirLatentGain()`, `updateThermalGainsDisplay()` | Consolida lógicas de componentes/totais/visualização dos ganhos térmicos (paredes, piso, iluminação, pessoas, ar externo) e informa a tabela de capacidade. |

#### Gerenciadores e camada de negócio

| Arquivo | Funções/Classes chave | O que faz |
| --- | --- | --- |
| `features/managers/obra-manager.js` | `buildObraHTML()`, `insertObraIntoDOM()`, `createEmptyObra()`, `addNewObra()`, `saveObra()`, `salvarObra()`, `atualizarObra()`, `deleteObra()`, `fetchObras()`, `verifyObraData()` | Fabrica e injeta o container de obra, coordena criação automática de projeto inicial, integração com backend (`/obras`), atualização de botões e remoção segura. |
| `features/managers/project-manager.js` | `buildProjectHTML()`, `createEmptyProject()`, `addNewProjectToObra()`, `deleteProject()` | Responsável pelo ciclo de vida dos projetos dentro de cada obra e por disparar a criação da primeira sala quando necessário. |

#### Interface e componentes

| Arquivo | Funções/Classes chave | O que faz |
| --- | --- | --- |
| `ui/interface.js` | `addNewProject()`, `toggleObra()`, `toggleProject()`, `toggleRoom()`, `toggleSection()`, `toggleSubsection()`, `downloadPDF()`, `downloadWord()`, `saveOrUpdateObra()` | Cola a UI com os managers: registra toggles com IDs únicos, encaminha downloads e encapsula chamadas a `saveObra`/`updateObra`. |
| `ui/helpers.js` | `toggleElementVisibility()`, `expandElement()`, `collapseElement()`, `removeEmptyObraMessage()`, `showEmptyObraMessageIfNeeded()`, `removeEmptyProjectMessage()`, `showEmptyProjectMessageIfNeeded()`, `toggleAllElements()` | Helpers visuais para mensagens de vazio e animação de colapsar/expandir seções. |
| `ui/components/edit.js` | `makeEditable()`, `saveInlineEdit()`, `applyNameChange()`, `disableEditing()`, `validateEditedText()`, `cancelInlineEdit()`, `makeAllEditable()`, `saveAllPendingEdits()` | Componente inline-edit com suporte a atalhos, validações e contabilidade de edições pendentes antes de sair da página. |
| `ui/components/status.js` | `showSystemStatus()`, `createStatusBanner()`, `insertStatusBanner()`, `scheduleStatusBannerRemoval()`, `showLoadingStatus()`, `showTemporaryStatus()`, `getActiveBannersCount()` | Sistema de toasts/banners reutilizado por `main.js` e managers para avisos de sessão, erros e progresso. |
| `ui/components/modal/modal.js` | `showConfirmationModal()`, `closeConfirmationModal()`, `showToast()`, `undoDeletion()`, `confirmDeletion()`, `getPendingDeletion()` | Modal reutilizável para confirmação e undo de exclusões, com toasts temporizados e contagem regressiva. |
| `ui/components/modal/exit-modal.js` | `showShutdownConfirmationModal()`, `showCustomShutdownModal()`, `createModalHTML()`, `setupModalEvents()` | Modal específico para desligamento, com promessa que resolve apenas após clique explícito do usuário. |

### Scripts legados (`backup de arquivos/scripts/01_Create_Obra`)

Estes arquivos preservam a versão anterior do front-end. Mantêm o mesmo domínio funcional da versão atual, porém sem o carregamento dinâmico e com código mais verboso. Servem para consulta ou rollback.

#### Núcleo e configuração legados

| Arquivo legado | Responsabilidade e funções |
| --- | --- |
| `backup de arquivos/scripts/01_Create_Obra/globals.js` | Define e inicializa variáveis globais usadas pelo front-end antigo (contadores, seletores de DOM, flags de sessão). |
| `.../main.js` | Antigo bootstrap que fazia import estático dos módulos, registrava eventos e cuidava de timers de sessão antes da refatoração. |
| `.../config/config.js` | Versão anterior das constantes de cálculo, UI e API, hoje consolidadas em `core/constants.js`. |
| `.../core/bootstrap.js` | Orquestrador antigo que carregava helpers de UI e iniciava listeners sem EventBus. |
| `.../core/event-bus.js` | Implementação original do pub/sub (mesmo conceito que migrou para `core/app.js`). |
| `.../core/state.js` | Estado global legado com arrays de obras/projetos/salas e flags de sessão. |

#### Dados e adaptadores legados

| Arquivo legado | Responsabilidade e funções |
| --- | --- |
| `.../data/data-utils.js` | Helpers antigos de IDs e coleta de inputs (hoje substituídos por `data/utils` unificado). |
| `.../data/projects.js` | Operações de CRUD dos projetos (pré-refatoração dos managers). |
| `.../data/rooms.js` | Criação/remoção de salas e binding de eventos no modelo antigo. |
| `.../data/server-utils.js` | Funções auxiliares para comunicação com o backend (fetch genéricos, normalização de respostas). |
| `.../data/server.js` | Barramento que reexportava adapters e inicializava contadores na versão antiga do app. |
| `.../data/adapters/obra-adapter.js` | Pipeline legado de carregamento de obras e sincronismo com DOM, antes do suporte a IDs seguros. |
| `.../data/adapters/session-adapter.js` | Gestão de sessão no `sessionStorage` antigo, com funções como `startNewSession()` e `saveFirstObraIdOfSession()`. |
| `.../data/adapters/shutdown-adapter.js` | Tratamento anterior de shutdown manual, com fluxos baseados em `confirm()` nativo. |
| `.../data/data-files/data-builders.js` | Construtores de JSON por obra/projeto/sala da versão antiga (sem fusão com extractors). |
| `.../data/data-files/data-extractors.js` | Rotinas específicas para extrair dados do DOM antes de salvar. |
| `.../data/data-files/data-populate.js` | Preenchimento do DOM a partir de dados recebidos do servidor, anterior ao `ui-builders.js`. |
| `.../data/data-files/data-utils-core.js` | Núcleo duplicado de helpers (IDs, buscas no DOM) que foi absorvido pelo novo `data/utils`. |

#### Módulos legados de salas, climatização e máquinas

| Arquivo legado | Responsabilidade e funções |
| --- | --- |
| `.../data/modules/climatizacao.js` | Construção das seções de climatização antes da reorganização por IDs seguros. |
| `.../data/modules/configuracao.js` | UI antiga da grade de configurações de instalação. |
| `.../data/modules/maquinas.js` | Barramento que juntava utilities, builder e management de máquinas (hoje condensado em `machines-core.js`). |
| `.../data/modules/room-operations.js` | Controlava inserção e remoção de salas com base em IDs não padronizados. |
| `.../data/modules/salas.js` | Layout antigo das salas e binding de botões "Adicionar Sala". |
| `.../data/modules/machines/capacityCalculator.js` | Versão anterior da tabela de capacidade e sincronismo de backup. |
| `.../data/modules/machines/machineManagement.js` | Funções de CRUD de máquinas legadas (`addMachine`, `updateMachineOptions`, etc.). |
| `.../data/modules/machines/machinesBuilder.js` | Renderização dos cards de máquinas antes da fusão com management. |
| `.../data/modules/machines/utilities.js` | Helpers antigos para formatar preços, montar selects e normalizar opções. |

#### Funcionalidades de cálculo legadas

| Arquivo legado | Responsabilidade e funções |
| --- | --- |
| `.../features/calculos/calculos-manager.js` | Coordenava manualmente callbacks de cálculo (sem debounce central). |
| `.../features/calculos/calculos-view.js` | Atualizava DOM dos resultados (vazão/carga) no layout anterior. |
| `.../features/calculos/airFlow/airFlowCalculations.js` | Fórmulas antigas de vazão. |
| `.../features/calculos/airFlow/airFlowDisplay.js` | Atualização visual das tabelas de vazão. |
| `.../features/calculos/thermalGains/thermalCalculations.js` | Cálculos de ganho térmico legados. |
| `.../features/calculos/thermalGains/thermalComponents.js` | Funções auxiliares (tetos, paredes, divisórias) anteriores. |
| `.../features/calculos/thermalGains/thermalDisplay.js` | Renderização dos resultados térmicos na UI antiga. |
| `.../features/calculos/utils/helpers.js` | Pequenos utilitários de formatação de números e debounce legado. |

#### Features de obras/projetos/salas legadas

| Arquivo legado | Responsabilidade e funções |
| --- | --- |
| `.../features/obras/obras-controller.js` | Controlador antigo das ações de obra (criar, salvar, remover). |
| `.../features/obras/obras-view.js` | Templates de obra no layout pré-refatoração. |
| `.../features/projetos/projetos-controller.js` | Controller legado para projetos. |
| `.../features/projetos/projetos-view.js` | HTML helper antigo de projetos. |
| `.../features/salas/salas-controller.js` | Controller legada das salas. |
| `.../features/salas/salas-view.js` | Templates de sala antes da fusão com `rooms.js`. |

#### Interface e utilidades legadas

| Arquivo legado | Responsabilidade e funções |
| --- | --- |
| `.../ui/edit.js` | Componente inline-edit predecessor (sem estatísticas/atalhos atuais). |
| `.../ui/interface.js` | Bridge antigo que conectava botões do HTML aos controllers legados. |
| `.../ui/intr-files/obra-manager.js` | Camada intermediária para criar/remover obras no layout antigo. |
| `.../ui/intr-files/project-manager.js` | Idem para projetos. |
| `.../ui/intr-files/status-manager.js` | Toasts/banners anteriores ao componente `status.js`. |
| `.../ui/intr-files/ui-helpers.js` | Funções utilitárias usadas pela interface pré-refatorada. |
| `.../ui/intr-files/modal/modal.js` | Modal legacy para exclusão. |
| `.../ui/intr-files/modal/exit-modal.js` | Modal legacy para shutdown/exit. |
| `.../utils/utils.js` | Coleção de helpers genéricos (debounce, formatadores) usada pelo bundle antigo. |

---

Para evoluções futuras, concentre novos desenvolvimentos em `codigo/public/scripts/01_Create_Obra`. Os arquivos em `backup de arquivos` podem ser excluídos quando a migração estiver 100% validada.

## Resumo detalhado das funções (comentários condensados)

### codigo/public/scripts/01_Create_Obra/main.js

- `ShutdownManager`: encapsula o “Sistema de shutdown manual – ATUALIZADO”.
  - `init()` executa logo após o construtor, registra logs e chama as rotinas que removem listeners nativos e criam o botão dedicado.
  - `disableAutoShutdown()` limpa `beforeunload`, `unload` e `pagehide`, garantindo que apenas o fluxo manual finalize a página.
  - `createShutdownButton()` insere um único botão `.shutdown-btn` em `.header-right`, define título “Encerrar Servidor” e delega o clique para `shutdownManual()`.
  - `shutdownManual()` confirma com o usuário, importa `shutdownManual` do adaptador, envia o comando assíncrono e trata quedas do servidor.
- `window.createEmptyObra(obraName, obraId)`: import lazy de `features/managers/obra-manager.js` para criar obras vazias com IDs controlados; registra erros quando o módulo não é encontrado.
- `window.createEmptyProject(obraId, obraName, projectId, projectName)`: usa `project-manager.js` somente quando o usuário adiciona um projeto, mantendo o padrão de IDs seguros.
- `window.populateObraData(obraData)`: injeta `data/builders/ui-builders.js` sob demanda e executa `populateObraData` para preencher obras restauradas do backend.
- `window.createEmptyRoom(obraId, projectId, roomName, roomId)`: carrega `data/modules/rooms.js` no momento da necessidade e delega a criação de salas com validações de ID.
- `loadSystemConstants()`: busca `/constants`, valida os campos essenciais (`VARIAVEL_PD`, `VARIAVEL_PS`), popula `window.systemConstants` e lança erros amigáveis quando o fetch falha.
- `loadAllModules()`: descrito no código como “Carrega todos os módulos do sistema dinamicamente – ”; importa interface, componentes, managers, módulos de dados, cálculos e utils, expondo cada função crítica no `window`.
- `checkAndLoadExistingSession()`: consulta `/api/session-obras`, compara os IDs retornados, marca a sessão como ativa no `sessionStorage` e chama `loadObrasFromServer()` quando há obras pendentes.
- `verifyAndCreateBaseObra()`: após curto atraso, compara `window.GeralCount` com o total de `.obra-block` e orienta o usuário quando o sistema carrega vazio.
- `finalSystemDebug()`: imprime no console um “DEBUG FINAL DO SISTEMA” com contadores, flags e disponibilidade das funções de toggle.
- `showServerOfflineMessage()`: monta o overlay “Servidor Offline” descrito no comentário (mensagem amigável, animação `iconPulse`, countdown de 10 s e fechamento automático).
- `verifyCriticalFunctions()`: percorre a lista de “funções críticas” e denuncia bindings ausentes após a inicialização.
- `window.addEventListener("DOMContentLoaded", ...)`: a sequência “Inicialização principal do sistema – ” instancia `ShutdownManager`, garante que as funções globais existam, baixa constantes, carrega módulos, procura sessões existentes, mostra banners de status, executa `finalSystemDebug`/`verifyCriticalFunctions` via `setTimeout` e trata erros de rede mostrando `showServerOfflineMessage()`.

### codigo/public/scripts/01_Create_Obra/core/app.js

- `EventBus`: substitui o antigo `event-bus.js`.
  - `on(event, callback)`: adiciona listeners por evento.
  - `off(event, callback)`: remove callbacks previamente registrados.
  - `emit(event, data)`: dispara callbacks com `try/catch` para logar “Erro no listener do evento”.
  - `clear(event)`: remove ouvintes de um evento específico ou limpa tudo quando chamado sem parâmetros.
- `ApplicationState`: fusão do antigo `state.js`.
  - `setObras`, `setProjetos`, `setSalas`: atualizam coleções e emitem `state:*-changed`.
  - `setCurrentObra`, `setCurrentProject`, `setCurrentRoom`: armazenam o registro selecionado, disparando eventos correspondentes.
  - `setSessionActive(active)`: sinaliza se há sessão ativa e emite `state:session-changed`.
  - `setSystemConstants(constants)`: armazena constantes carregadas e emite `state:constants-loaded`.
  - `getConstant(key)`: leitura segura das constantes persistidas.
  - `clear()`: zera todas as coleções, flags e referências, emitindo `state:cleared`.
- `initializeEventBus()`: expõe `window.eventBus` e registra “Event Bus inicializado”.
- `initializeState()`: expõe `window.appState` com o mesmo padrão de log.
- `initializeInterface()`: importa `../ui/interface.js` de forma assíncrona para evitar dependências circulares, chamando `initializeInterface()` se a função existir.
- `initializeCoreSystems()`: orquestra EventBus, State e Interface; em caso de sucesso emite `app:core-ready`, senão `app:core-error`.
- `bootstrapApplication()`: evita execuções duplicadas com `window.appInitialized`, chama `initializeCoreSystems()` e expõe helpers globais.
- `reinitializeApplication()`: limpa estado, zera listeners, redefine `window.appInitialized` e reinicia o bootstrap.
- `getAppStatus()`: devolve um snapshot do estado (quantidade de obras/projetos/salas e estado da sessão) para inspeção externa.

### codigo/public/scripts/01_Create_Obra/core/constants.js

- `CALCULATION_CONSTANTS`: coeficientes usados em vazão de ar, ganhos térmicos, fatores de segurança e tolerâncias.
- `UI_CONSTANTS`: símbolos de toggle, timeouts, classes CSS e breakpoints responsáveis pela UX.
- `STORAGE_KEYS`: chaves usadas no `localStorage/sessionStorage` para sessão, cache e preferências do usuário.
- `VALIDATION_CONSTANTS`: limites de comprimento, faixas numéricas e regex (e-mail, telefone, IDs) utilizados nas validações.
- `API_CONSTANTS`: URLs base, endpoints (`/obras`, `/api/sessions`, etc.), timeouts e headers padrão.
- `MESSAGE_CONSTANTS`: textos pré-definidos de sucesso, erro, aviso e informação herdados do antigo `config.js`.
- `PERFORMANCE_CONSTANTS`: ajustes de debounce, tamanhos de lote e limites de cache/memória.
- `getAllConstants()`: retorna todos os blocos em um único objeto, conforme comentado na seção “UTILITÁRIOS DE CONSTANTES”.
- `hasConstant(category, key)`: confirma a existência de uma chave antes de usá-la.
- `getConstant(category, key, defaultValue)`: busca segura com fallback quando a constante não foi definida.

### codigo/public/scripts/01_Create_Obra/data/adapters/obra-adapter.js

- `removeBaseObraFromHTML()`: limpa `.obra-block` placeholders antes de repintar dados vindos do backend.
- `loadObrasFromServer()`: fluxo “” — lê `/api/session-obras`, busca todas as obras em `/obras`, converte IDs numéricos em strings, filtra as obras da sessão e chama `loadSingleObra()`; quando não encontra correspondentes, chama `migrateSessionToNewIds()`.
- `migrateSessionToNewIds(oldObraIds, todasObras)`: substitui os IDs da sessão por IDs seguros (novos) e reexecuta o carregamento.
- `loadSingleObra(obraData)`: garante que cada obra exista no DOM (criando via `window.createEmptyObra()` se necessário) e preenche os dados com `window.populateObraData()`.
- `debugLoadObras()`: utilitário mencionado como “Função alternativa para debug” que lista funções globais e obras quando há inconsistência no carregamento.

### codigo/public/scripts/01_Create_Obra/data/adapters/session-adapter.js

- `isSessionActive()`: retorna o valor de `SESSION_ACTIVE_KEY` no `sessionStorage`.
- `setSessionActive(active)`: grava o estado da sessão e, ao desativar, chama `clearSessionObras()` e `clearRenderedObras()` para sincronizar interface e storage.
- `getSessionObras()` / `setSessionObras(obraIds)`: leem/escrevem a lista serializada usada para restaurar obras.
- `addObraToSession(obraId)` / `removeObraFromSessionLocal(obraId)`: mantêm a lista sem duplicidades.
- `clearSessionObras()`: remove os registros de obras e a lista de projetos removidos (`REMOVED_PROJECTS_KEY`).
- `clearRenderedObras()`: rotina “” que percorre todas as `.obra-block`, preserva obras salvas ou com conteúdo e remove apenas placeholders vazios, ajustando `window.GeralCount`.
- `isObraInSession(obraId)`: helper utilizado durante a limpeza para decidir se uma obra pode ser removida.
- `initializeGeralCount()`, `incrementGeralCount()`, `decrementGeralCount()`, `getGeralCount()`: garantem que o contador global existe, mantém coerência com o DOM e não fica negativo.
- `resetDisplayLogic()`: desativa a sessão, limpa storage, remove obras e zera o contador global.
- `startNewSession()` / `startSessionOnFirstSave()`: iniciam a sessão manualmente ou no momento em que a primeira obra é salva, conforme comentários.
- `saveFirstObraIdOfSession(obraId)`: usa `ensureStringId` para gravar o primeiro ID válido e adicioná-lo à lista da sessão.
- `addObraToRemovedList(obraId)`, `getRemovedObrasList()`, `isObraRemoved(obraId)`: mantêm a lista de obras removidas para que não ressurgam após recarregar a página.

### codigo/public/scripts/01_Create_Obra/data/adapters/shutdown-adapter.js

- `shutdownManual()`: “Encerra o servidor e a sessão atual de forma controlada” — abre o modal customizado, limpa sessões backend/frontend, zera `window.GeralCount`, envia `POST /api/shutdown` e controla os overlays/mensagens até fechar a aba.
- `ensureSingleActiveSession()`: chama `/api/sessions/ensure-single` para garantir exclusividade da sessão ativa.
- `initializeSession()`: se `isSessionActive()` retornar verdadeiro, chama `loadObrasFromServer()` para restaurar o estado.
- `showShutdownMessage(message)`: cria o overlay full-screen com animações `fadeIn`/`pulse` descritas no comentário.
- `showFinalShutdownMessage()` / `showFinalMessageWithManualClose()`: atualizam o overlay após completar o shutdown, exibindo feedback positivo ou oferecendo o botão “Fechar Janela”.

### codigo/public/scripts/01_Create_Obra/data/builders/data-builders.js

- `buildObraData(obraIdOrElement)`: garante que o elemento da obra ainda está no DOM, coleta os projetos e monta um objeto com ID, nome e timestamp.
- `buildProjectData(projectIdOrElement)`: valida o elemento do projeto e constrói o payload com ID, nome, salas e timestamp.
- `extractRoomData(roomElement, projectElement)`: extrai os blocos de uma sala (inputs, máquinas, capacidade, ganhos térmicos, configuração) e devolve um objeto consolidado.
- `extractThermalGainsData(roomElement)`: lê todos os elementos `total-*` (W e TR), limpando HTML e convertendo texto em número; usa `attemptAlternativeSearch()` quando algum seletor não existe mais.
- `extractClimatizationInputs(roomElement)`: percorre `.clima-input`, rádios de pressurização e selects para montar o dicionário de inputs de climatização.
- `extractMachinesData(roomElement)`: coleta todas as `.climatization-machine`, chamando `extractClimatizationMachineData()` para cada item.
- `extractClimatizationMachineData(machineElement)`: monta o objeto da máquina (nome, tipo, potência, tensão, preços e opções selecionadas) a partir dos elementos DOM e textos exibidos.
- `extractCapacityData(roomElement)`: lê fator de segurança, capacidade unitária, solução com/sem backup, total, folga, backup selecionado e carga estimada (em texto ou input).
- `extractConfigurationData(roomElement)`: reúne as opções de instalação (checkboxes) marcadas para a sala.
- `attemptAlternativeSearch(key, roomId, gains)`: fallback textual para capturar números quando os elementos identificados por ID não estão no DOM (busca por rótulos como “Total Piso”).

### codigo/public/scripts/01_Create_Obra/data/builders/ui-builders.js

- `renderObraFromData(obraData)`: cria a obra com `createEmptyObra()`, remove mensagens vazias e agenda o render de cada projeto retornado do backend.
- `renderProjectFromData(projectData, obraId, obraName)`: garante que exista uma obra alvo, cria o projeto e prepara os contêineres de salas antes de preenchê-los.
- `renderRoomFromData(projectId, projectName, roomData, obraId, obraName)`: chama `createEmptyRoom`, aguarda o DOM montar todas as seções e preenche os dados da sala.
- `fillClimatizationInputs(roomElement, inputsData)`: percorre cada campo do formulário de climatização e aplica os valores persistidos (incluindo radiobuttons e selects).
- `fillThermalGainsData(roomElement, thermalGainsData)`: atualiza os elementos `total-*` com os valores recuperados do servidor.
- `fillCapacityData(roomElement, capacityData)`: restaura fator de segurança, capacidade unitária, soluções, total, folga e backup configurado.
- `fillConfigurationData(roomElement, configData)`: marca as checkboxes de opções de instalação usadas anteriormente.
- `findMachinesSection(roomElement)` / `findSectionByTitle(roomElement, titleText)`: utilitários para localizar contêineres antes de injetar dados.
- `ensureAllRoomSections(roomElement)`: garante que climatização, máquinas e configuração existam, chamando os builders correspondentes quando necessário.
- `ensureMachinesSection(roomElement)`: fluxo específico para montar (ou remontar) a seção de máquinas e a tabela de capacidade.
- `fillMachinesData(roomElement, machinesData)`: recria cada máquina salva, chamando `addMachine()` e reaplicando tipo/potência/tensão/opções/preços.
- `populateObraData(obraData)`: orquestra todo o preenchimento de uma obra (projetos → salas → seções), tratando cenários onde os módulos globais ainda não foram carregados.
- `populateProjectData(projectElement, projectData, obraId, obraName)`: atualiza um projeto específico, criando salas ausentes e preenchendo as existentes.
- `populateRoomData(roomElement, roomData)`: garante seções, aplica inputs, restaura máquinas e dispara cálculos (`calculateVazaoArAndThermalGains`) para atualizar resultados.
- `populateMachineData(machineElement, machineData)`: aplica os dados de uma máquina individual (nome, selects, opções, preços) e recalcula totais.

### codigo/public/scripts/01_Create_Obra/data/utils/data-utils.js

- `getNextProjectNumber(obraId)`: lê os nomes dos projetos de uma obra no DOM para sugerir o próximo número sequencial.
- `getNextRoomNumber(projectId)`: faz o mesmo para salas dentro de um projeto específico.
- `getNextObraNumber()`: inspeciona todas as obras renderizadas e retorna o próximo índice amigável.
- `getRoomFullId(roomElement)`, `getObraName(obraElement)`, `getProjectName(projectElement)`, `getRoomName(roomElement)`: helpers que recuperam IDs/nomes válidos, com fallback quando o DOM ainda não atualizou.
- `extractNumberFromText(text)`: usado pelos extratores para converter textos como “Total Piso: 500 W” em números.
- `getMachineName(machineElement, machineId)` / `parseMachinePrice(priceText)`: padronizam nomes de máquinas e convertem strings monetárias em números.
- `debugThermalGainsElements(roomElement)`: imprime elementos relacionados a ganhos térmicos quando algo não é encontrado.
- `collectClimatizationInputs(climaSection, roomId)`: coleta todos os inputs relevantes para cômputo de vazão e ganhos térmicos (incluindo pressurização).
- `findClimatizationSection(roomId)`: devolve o elemento da seção de climatização de uma sala específica para uso pelos cálculos.

### codigo/public/scripts/01_Create_Obra/data/utils/id-generator.js

- `generateObraId()`, `generateProjectId(...)`, `generateRoomId(...)`: criam IDs hierárquicos seguros (`obra_w12`, `obra_w12_proj_t34_1`, `obra_w12_proj_t34_1_sala_r21_1`) usando timestamp, letras aleatórias e contadores.
- `getProjectCountInObra(obraId)` / `getRoomCountInProjectFromId(projectId)`: contam quantos projetos/salas existem para montar os sufixos sequenciais.
- `ensureStringId(id)`: converte qualquer valor em string e rejeita `undefined/null`.
- `isValidSecureId(id)`: valida se o ID respeita os padrões seguros definidos nos comentários.
- `extractSequenceNumber(id, type)`: captura o número final de um ID de projeto (`_1`) ou sala (`_sala_*_1`).
- `extractObraBaseFromId(id)` / `areIdsFromSameObra(id1, id2)`: verificam se IDs hierárquicos pertencem à mesma obra.
- `generateMachineId(roomId)`: cria IDs únicos para máquinas (baseados em timestamp + sufixo aleatório).
- `sanitizeId(id)`: remove fragmentos inválidos como `-undefined` e caracteres fora do padrão.
- `hasValidSecureId(element, expectedType)`: inspeciona atributos `data-obra-id`, `data-project-id` ou `data-room-id` para confirmar se são seguros.
- `generateSessionId()`: cria identificadores únicos de sessão (`session_<timestamp>_<random>`).
- `validateIdHierarchy(obraId, projectId, roomId)`: garante que IDs de projeto e sala pertençam à mesma obra antes de continuar.
- `getNextSequenceNumber(parentId, childType)`: calcula o próximo número sequencial olhando para os elementos filhos existentes (`project` ou `room`).

### codigo/public/scripts/01_Create_Obra/data/modules/climatizacao.js

- `buildClimatizationSection(obraId, projectId, roomName, finalRoomId)`: retorna o bloco completo de climatização (cabeçalho, tabela de inputs e seção de ganhos térmicos) validando o ID único da sala.
- `buildClimatizationTable(roomId)`: monta a tabela com inputs agrupados (ambiente, backup, área, paredes, divisórias, dissipação, pessoas).
- `buildPressurizationRow(roomId)`: adiciona rádios “Pressurização (TR) Sim/Não” com inputs condicionais e callback `togglePressurizationFields`.
- `buildClimaRow(fields, roomId)` / `buildClimaCell(field, roomId)`: helpers que constroem cada linha/célula de formulário e amarram atributos `data-field`.
- `buildSelectInput(field, roomId)` / `buildTextInput(field, roomId)`: geram selects e inputs text/number com placeholders e `onchange` configurados.
- `buildResultRow(roomId)`: produz a linha de resultados (vazão/ganhos) no final da tabela.
- `togglePressurizationFields(roomId, enabled)`: trata o estado habilitado/desabilitado dos campos dependentes de pressurização.
- `buildThermalGainsSection(roomId)`: adiciona o bloco “Tabela de Resultados de Ganhos Térmicos” linkado aos cálculos automáticos.

### codigo/public/scripts/01_Create_Obra/data/modules/configuracao.js

- `buildConfigurationSection(obraId, projectId, roomName, finalRoomId)`: gera o grid de checkboxes das “Opções de Instalação”, com IDs exclusivos e validação para campos indefinidos conforme descrito em “ATUALIZADO COM IDs SEGUROS”.

### codigo/public/scripts/01_Create_Obra/data/modules/rooms.js

- `buildRoomHTML(obraId, projectId, roomName, roomId)`: monta a estrutura completa da sala (header, botões, seções de climatização/máquinas/configuração) validando todos os IDs, conforme os comentários “ERRO FALBACK”.
- `buildRoomHeader(...)`: gera apenas o cabeçalho (título/editável/botão remover) para usos futuros.
- `buildRoomActions(roomId)`: placeholder reservado para futuras ações.
- `loadMachinesPreloadModule()`: importa `machines/machines-core.js` uma única vez para pré-carregar dados de máquinas.
- `createEmptyRoom(...)`: gera um ID seguro (quando não informado), injeta o HTML na posição correta do projeto, remove mensagens “empty”, pré-carrega dados de máquinas e inicializa componentes específicos da sala.
- `getRoomCountInProject(obraId, projectId)`: conta quantas salas existem naquele projeto para auxiliar na geração do ID.
- `initializeRoomComponents(...)`: chama funções globais (como `calculateVazaoArAndThermalGains`) com tentativas escalonadas usando o helper `initializeWithRetry`.
- `safeInitializeFatorSeguranca(roomId)`: tenta invocar `initializeFatorSeguranca` caso ela já esteja carregada.
- `insertRoomIntoProject(obraId, projectId, roomHTML, roomId)`: injeta o HTML antes da `.add-room-section` ou no final do `.project-content`.
- `addNewRoom(obraId, projectId)`: fluxo moderno para adicionar salas usando `createEmptyRoom`.
- `addNewRoomToProject(obraId, projectId)`: mapeia o botão “Adicionar Sala” para `addNewRoom`.
- `addNewRoomLegacy(projectName)`: versão de compatibilidade que continua aceitando apenas o nome do projeto.
- `deleteRoom(obraId, projectId, roomId)`: remove a sala, atualiza mensagens de vazio e chama `showEmptyProjectMessageIfNeeded`.
- `deleteRoomLegacy(projectName, roomName)`: preserva o comportamento antigo usado por templates legados.
- `fixExistingCapacityInputs()` + listener `DOMContentLoaded`: asseguram que inputs antigos da tabela de capacidade tenham atributos e IDs corretos ao carregar a página.

### codigo/public/scripts/01_Create_Obra/data/modules/machines/machines-core.js

- `loadMachinesData()`: busca `/machines`, armazena em `window.machinesDataCache` e retorna os dados (ou cache) para os demais fluxos.
- `buildMachinesSection(...)`: gera o bloco de máquinas da sala, incluindo o botão “+ Adicionar” e a tabela de capacidade proveniente de `buildCapacityCalculationTable`.
- `buildMachineHTML(...)`: desenha o formulário completo de uma nova máquina com inputs de tipo, capacidade, tensão, preços e opções adicionais.
- `buildMachineFromSavedData(...)`: recria uma máquina a partir dos dados salvos no servidor (tipo, potência, tensão, opções e preços).
- `buildFormGroup(label, content)`: helper para manter a estrutura `<label> + conteúdo`.
- `buildSelect(...)`: gera selects com as opções fornecidas, controlando estado `disabled` e valores pré-selecionados.
- `buildOptionsHTML(...)`: renderiza cada opção adicional, exibindo preço incremental e ligando o clique ao `toggleOption`.
- `addMachine(roomId)`: monta uma nova máquina (criando ID com `generateMachineId`), injeta no DOM e inicializa campos básicos.
- `loadSavedMachines(roomId, savedMachines)`: percorre a lista de máquinas salvas e chama `buildMachineFromSavedData`.
- `updateMachineOptions(selectElement)`: ao selecionar o tipo de máquina, habilita e preenche selects de potência/tensão.
- `updateMachineUI(machineId, machine)`: aplica valores nos selects/labels de uma máquina específica a partir do objeto `machine`.
- `updateSelectUI(selector, options, disabled)`: helper reutilizado para gerar `<option>` dinamicamente.
- `resetMachineFields(machineId)`: limpa as escolhas quando os dados dependentes não estão disponíveis.
- `calculateMachinePrice(machineId)`: soma preço base + opções marcadas e atualiza os displays `#base-price-*` e `#total-price-*`.
- `updateOptionValues(machineId)`: recalcula os preços das opções com base na potência selecionada.
- `calculateAllMachinesTotal(roomId)` / `updateAllMachinesTotal(roomId)`: agregam o custo de todas as máquinas de uma sala e exibem em `#total-all-machines-price-*`.
- `saveTotalToRoom(roomId, total)`: armazena o total geral como atributo da sala.
- `toggleMachineSection(button)`: expande/recolhe o conteúdo de uma máquina individual.
- `updateMachineTitle(input, machineId)`: atualiza o nome exibido no cabeçalho da máquina após edição.
- `toggleOption(machineId, optionId)` / `updateOptionSelection(machineId, optionId)`: gerenciam o estado visual e lógico das opções adicionais.
- `handlePowerChange(machineId)`: responde a mudanças de potência recalculando preços e opções.
- `deleteMachine(machineId)`: remove o card e, se não houver outras máquinas, mostra a mensagem “Nenhuma máquina adicionada ainda”.
- `showEmptyMessage(container, message)` / `removeEmptyMessage(container)`: exibem ou removem mensagens padrão dentro da seção de máquinas.
- No final, `Object.assign(window, functions)` expõe todas as funções globalmente para compatibilidade.

### codigo/public/scripts/01_Create_Obra/data/modules/machines/capacity-calculator.js

- `findRoomId(element)`: sobe a árvore do DOM (via `closest`) para descobrir o `data-room-id` associado a uma tabela de capacidade.
- `buildCapacityCalculationTable(roomId)`: constrói a tabela “Cálculo de Capacidade de Refrigeração” com campos para carga estimada, fator de segurança, capacidade unitária, solução e backup.
- `initializeStaticCapacityTable()`: inicializa uma tabela estática especial caso exista fora das salas.
- `scheduleCapacityInit(roomId)`: adiciona a sala ao mapa `capacityState` e agenda `initializeCapacitySystem()`.
- `initializeCapacitySystem(roomId)`: aplica o fator de segurança configurado em `systemConstants` (ou um fallback) após algumas tentativas.
- `applyFatorSeguranca(roomId, fatorSeguranca)`: grava o valor e dispara `calculateCapacitySolution()`.
- `getThermalLoadTR(roomId)`: lê o TR total (`#total-tr-*`) ou converte Watts em TR quando necessário.
- `calculateCapacitySolution(roomId)`: lê os inputs, calcula quantas unidades são necessárias (com e sem backup) e atualiza as colunas da tabela.
- `getCapacityData(roomId)` / `saveCapacityData(roomId)`: coletam/persistem os valores atuais da tabela para uso de outros módulos.
- `loadCapacityData(roomId)` / `applyCapacityData(roomId, capacityData)`: reaplicam valores armazenados em todos os campos do formulário de capacidade.
- `applyBackupConfiguration(unidadesOperacionais, backupType)`: calcula quantas unidades adicionais são necessárias com base em `n/n+1/n+2`.
- `getBackupFromClimatization(roomId)` / `getBackupFromClimaInputs(roomId)`: mantêm o backup escolhido sincronizado entre a tabela e o formulário de climatização.
- `updateCapacityDisplay(...)`: atualiza os elementos de resultado (`solução`, `solução com backup`, `TOTAL`, `FOLGA`).
- `updateCargaEstimadaInput(roomId, value)`: escreve o valor recalculado de carga estimada.
- `updateBackupConfiguration(selectElement)`: responde a alterações no select de backup presente na tabela.
- `handleClimaInputBackupChange(roomId, newBackupValue)` / `syncBackupWithClimaInputs(roomId, backupValue)` / `syncCapacityTableBackup(roomId)`: mantêm os selects de backup alinhados em ambos os formulários.

### codigo/public/scripts/01_Create_Obra/features/calculations/air-flow.js

- `calculateDoorFlow(doorCount, doorVariable, pressure)`: aplica coeficiente de fluxo, variáveis das portas e expoente de pressão para estimar m³/h por conjunto de portas.
- `computeAirFlowRate(inputData)`: combina fluxos de portas duplas/simples, converte para l/s e aplica o fator de segurança (`SAFETY_FACTOR`).
- `calculateVazaoAr(roomId, calculateThermal = true)`: aguarda `systemConstants`, coleta inputs de climatização, calcula vazão e, opcionalmente, aciona `calculateThermalGains`.
- `calculateVazaoArAndThermalGains(roomId)`: executa `calculateVazaoAr` sem recalcular ganhos e depois chama explicitamente `calculateThermalGains`.
- `updateFlowRateDisplay(roomId, flowRate)`: escreve o resultado em `#vazao-ar-{roomId}` e registra logs.
- `validateAirFlowInputs(inputData)`: garante que os campos obrigatórios existam e não sejam negativos.
- `prepareAirFlowData(rawData)` / `getAirFlowStats(inputData, result)`: normalizam entradas e produzem estatísticas auxiliares úteis para depuração.

### codigo/public/scripts/01_Create_Obra/features/calculations/calculations-core.js

- `debouncedCalculation(roomId, calculationFunction, delay)`: armazena timeouts por sala e evita cálculos consecutivos enquanto o usuário digita.
- `clearAllCalculationTimeouts()`: limpa todos os timeouts pendentes no mapa `calculationTimeouts`.
- `waitForSystemConstants()`: aguarda até 100 tentativas (intervalos de 200 ms) até que `window.systemConstants` tenha `VARIAVEL_PD`.
- `validateSystemConstants()`: verifica a lista de constantes obrigatórias antes de permitir cálculos.
- `calculateVazaoArAndThermalGainsDebounced(roomId)`: usa o debounce para chamar `calculateVazaoAr` e `calculateThermalGains` em sequência.
- `calculateVazaoArAndThermalGainsImmediate(roomId)`: aciona os dois cálculos imediatamente, sem debounce.
- `validateCalculationData(inputData)`: verifica campos mínimos (`area`, `altura`, `qtdPessoas`, `qtdEquipamentos`) e emite avisos quando faltam dados.
- `prepareCalculationData(rawData)`: normaliza valores numéricos (substituindo vírgulas, convertendo strings) para uso posterior.
- O arquivo também reexporta `collectClimatizationInputs`, `findClimatizationSection`, `safeNumber` e `updateElementText` para compatibilidade com scripts legados.

### codigo/public/scripts/01_Create_Obra/features/calculations/thermal-gains.js

- `calculateCeilingGain(area, uValue, deltaT)`: multiplica área, valor-U e ΔT, registrando o cálculo completo para debug.
- `calculateWallGain(comprimento, peDireito, uValue, deltaT)`: calcula área de cada parede e aplica os fatores para obter o ganho.
- `calculatePartitionGain(inputArea, peDireito, uValue, deltaT)`: converte as divisórias (climatizadas e não climatizadas) em ganhos térmicos.
- `calculateFloorGain(area, constants)`: usa os fatores `AUX_U_Value_Piso` e `deltaT_piso` para calcular a contribuição do piso.
- `calculateLightingGain(area, constants)`: aplica `AUX_Fator_Iluminacao` e `AUX_Fs_Iluminacao`.
- `calculateDissipationGain(dissipacao, constants)`: transforma dissipação (W) em ganho térmico usando `AUX_Fator_Conver_Painel` e `AUX_Fs_Paineis`.
- `calculatePeopleGain(numPessoas, constants)`: soma ganhos sensíveis e latentes das pessoas com base em `AUX_OCp_Csp` e `AUX_OCp_Clp`.
- `calculateExternalAirSensibleGain(...)` / `calculateExternalAirLatentGain(...)`: convertem vazão de ar externo em cargas sensíveis/latentes usando as constantes auxiliares.
- `calculateTotals(gains)`: agrega cada componente (externo, divisões, piso, iluminação, equipamentos, pessoas, ar externo) e converte de Watts para TR.
- `updateWallDisplay(...)` / `updatePartitionDisplay(...)`: escrevem valores individuais na UI, mostrando U, dimensões e ΔT utilizados.
- `updateThermalGainsDisplay(roomId, gains, totals, uValues, inputData)`: atualiza todos os elementos visuais de resultados (incluindo totais e TR).
- `findRoomContentThermal(roomId)`: localiza o container de resultados térmicos da sala.
- `calculateUValues(tipoConstrucao)`: define os valores U conforme o tipo de construção (alvenaria, eletrocentro, etc.).
- `calculateAuxiliaryVariables(inputData)`: calcula massa de ar externo e fatores auxiliares necessários para `calculateExternalAir*`.
- `calculateThermalGains(roomId, vazaoArExterno)`: pipeline completo — coleta inputs, calcula cada componente, atualiza a UI e informa a tabela de capacidade quando novas cargas são obtidas.

### codigo/public/scripts/01_Create_Obra/features/managers/obra-manager.js

- `buildObraHTML(obraName, obraId, hasId)`: retorna o HTML principal de uma obra, com cabeçalho editável, contadores e botões “Salvar/Atualizar/Remover”.
- `buildObraActionsFooter(obraId, obraName, hasId)`: cria o bloco de botões inferiores (download, salvar, excluir) adaptando os textos conforme a obra já tem ID persistido.
- `insertObraIntoDOM(obraHTML, obraId)`: injeta o template no container e evita duplicações.
- `createEmptyObra(obraName, obraId)`: aponta o local correto no DOM, cria a obra, ajusta contadores globais e garante que mensagens vazias desapareçam.
- `updateObraButtonAfterSave(obraName, obraId)`: troca o botão “Salvar” por “Atualizar” e ajusta atributos `data-*` após o primeiro persist.
- `addNewObra()`: gera IDs, chama `createEmptyObra()` e adiciona automaticamente um projeto se `window.addNewProjectToObra` estiver disponível.
- `deleteObra(obraName, obraId)`: aciona o modal de confirmação, remove o bloco e chama `deleteObraFromServer()` para excluir no backend.
- `fetchObras()`: ponto único de leitura (`GET /obras`) usado por outros adaptadores.
- `atualizarObra(obraId, obraData)`: envia `PUT /obras/{id}` com o payload montado pelo builder.
- `salvarObra(obraData)` / `saveObra(obraId, event)`: chamadas `POST /obras` que lidam com status, mensagens e início automático da sessão.
- `findObraBlock(obraId)` / `findObraBlockWithRetry(obraId, maxAttempts)`: localizam o elemento no DOM, repetindo a busca quando a renderização ainda não terminou.
- `deleteObraFromServer(obraName, obraId)`: executa a exclusão no backend e retorna o resultado bruto.
- `verifyObraData(obraId)`: validações finais antes de permitir salvar/atualizar.

### codigo/public/scripts/01_Create_Obra/features/managers/project-manager.js

- `buildProjectHTML(obraId, obraName, projectId, projectName)`: template dos projetos com cabeçalho, botão “Adicionar Sala” e os contêineres de salas.
- `createEmptyProject(obraId, obraName, projectId, projectName)`: injeta o projeto na obra correspondente, remove mensagens “empty” e expõe as ações.
- `addNewProjectToObra(obraId)`: obtém o próximo número de projeto, cria o projeto e adiciona uma sala inicial quando `window.addNewRoomToProject` está disponível.
- `deleteProject(obraId, projectId)`: remove o projeto do DOM e atualiza as mensagens de vazio/contadores.

### codigo/public/scripts/01_Create_Obra/ui/interface.js

- `addNewProject()`: wrapper legado que cria uma nova obra e adiciona um projeto imediatamente (conforme o exemplo do comentário).
- `toggleObra(obraId, event)`: implementa o “Sistema de toggle corrigido com IDs únicos” para expandir/recolher `#obra-content-{id}`.
- `toggleProject(projectId, event)` / `toggleRoom(roomId, event)`: mesma lógica aplicada aos níveis de projeto e sala.
- `toggleSection(sectionId)` / `toggleSubsection(subsectionId)`: controlam blocos internos dentro das seções de sala.
- `downloadPDF(obraId, projectName)` / `downloadWord(obraId, projectName)`: iniciam downloads de relatórios baseados na obra ou projeto selecionado.
- `saveOrUpdateObra(obraParam, event)`: decide entre `salvarObra` e `atualizarObra` dependendo do estado atual da obra, impedindo submits duplicados.

### codigo/public/scripts/01_Create_Obra/ui/helpers.js

- `toggleElementVisibility(contentId, minimizerElement)`: alterna `collapsed` em um container genérico e atualiza o minimizer.
- `expandElement(element, minimizerElement)` / `collapseElement(element, minimizerElement)`: manipulam explicitamente o estado (expandido/recolhido) e alteram o símbolo exibido.
- `calculateRoomCompletionStats(room)`: conta quantas seções de uma sala estão preenchidas para exibir indicadores de progresso.
- `removeEmptyObraMessage(obraName)` / `showEmptyObraMessageIfNeeded(obraName)`: removem ou mostram mensagens “Nenhuma obra” dependendo do conteúdo.
- `removeEmptyProjectMessage(projectContent)` / `showEmptyProjectMessageIfNeeded(projectContent)`: equivalentes para os contêineres de salas.
- `isElementVisible(elementId)`: retorna um booleano indicando se um bloco está expandido.
- `toggleAllElements(containerId, expand = true)`: expande ou recolhe todas as seções de um container (por exemplo, todas as salas de uma obra).

### codigo/public/scripts/01_Create_Obra/ui/components/edit.js

- `makeEditable(element, type)`: entrada principal que habilita edição inline para títulos de obra/projeto/sala.
- `enableEditing(element)` / `selectElementContent(element)`: ativam `contentEditable`, aplicam classes auxiliares e selecionam o texto para facilitar a edição.
- `attachEditingEventListeners(element, type)`: registra listeners (`handleKeydown`, `handleBlur`) que salvam com Enter/Tab e cancelam com Esc.
- `saveInlineEdit(element, type)`: valida o texto, aplica a mudança com `applyNameChange()` e desativa o modo de edição.
- `applyNameChange(element, newText, type, originalText)`: atualiza atributos `data-*`, IDs relacionados e o texto exibido, conforme o tipo editado.
- `disableEditing(element)`: reverte `contentEditable` e remove estilos/handlers temporários.
- `validateEditedText(newText, originalText, element)`: impede textos vazios ou iguais, exibindo mensagens amigáveis.
- `showEditError(message)`: usa `showSystemStatus` para avisar o usuário sobre falhas de validação.
- `cancelInlineEdit(element)`: descarta alterações e restaura o texto original.
- `makeAllEditable(selector, type)` / `disableAllEditing()`: permitem ligar/desligar edição em massa.
- `saveAllPendingEdits()` / `hasPendingEdits()` / `getEditStats()`: controlam o estado de edições ativas, inclusive o alerta `beforeunload` registrado no final do arquivo.
- `makeEditableCompatibility(element, type)`: mantém compatibilidade com scripts que chamavam a versão antiga da API.
- Listeners globais (`document.keydown`, `window.beforeunload`) reforçam o comportamento descrito nos comentários, evitando perdas de dados.

### codigo/public/scripts/01_Create_Obra/ui/components/status.js

- `showSystemStatus(message, type = 'info', duration = null)`: renderiza um banner de status com ícone e duração apropriados.
- `removeExistingStatusBanner()` / `removeAllStatusBanners()`: limpam banners existentes antes de mostrar um novo.
- `createStatusBanner(message, type)`: monta o HTML do banner usando o ícone fornecido por `getStatusIcon(type)`.
- `getStatusIcon(type)` / `getDefaultDuration(type)`: mapeiam tipos (success/error/warning/info) para ícones e tempos padrão.
- `insertStatusBanner(banner)` / `scheduleStatusBannerRemoval(banner, duration)`: inserem o banner no DOM e agendam sua remoção automática.
- `showLoadingStatus(message)` / `showTemporaryStatus(message, type, duration, callback)`: atalhos para mensagens de carregamento ou temporárias com callback após encerramento.
- `hasActiveStatusBanner()` / `getActiveBannersCount()`: métodos auxiliares para saber se ainda existe um banner na tela.

### codigo/public/scripts/01_Create_Obra/ui/components/modal/modal.js

- `showConfirmationModal(obraName, obraId, obraBlock)`: exibe o modal de confirmação de exclusão de obra, salvando o pending deletion em memória.
- `closeConfirmationModal()` / `closeConfirmationModalWithoutClearing()`: fecham o modal, removendo ou preservando os dados pendentes.
- `createToastContainer()`: garante que exista um container para toasts de undo/erro.
- `showToast(obraName, type = 'undo', obraId = null)`: cria toasts temporizados, disparando `startCountdown()` para mostrar quanto tempo resta.
- `startCountdown(toastElement, seconds)`: atualiza o contador visível e executa o callback quando o tempo expira.
- `animateAndRemove(el)` / `sweepDanglingToasts()`: aplicam animações de saída e limpam toasts antigos.
- `hideSpecificToast(toastId)` / `hideToast()`: APIs públicas para remover toasts em andamento.
- `undoDeletion(obraId, obraName)`: restaura a obra caso o usuário clique em “Desfazer” antes do deadline.
- `completeDeletion(obraId, obraName)` / `completeDeletionImmediate(obraId, obraName)`: executam a remoção no backend ao final do countdown ou imediatamente.
- `verificarObraNoServidor(obraId)`: confirma se a obra ainda existe antes de deletar definitivamente.
- `confirmDeletion()`: é chamado pelo botão “Confirmar exclusão” do modal para iniciar `completeDeletion`.
- `getPendingDeletion()`: expõe o item que está aguardando undo, útil para outros módulos consultarem o estado.

### codigo/public/scripts/01_Create_Obra/ui/components/modal/exit-modal.js

- `createModalHTML(config)`: monta o HTML completo do modal de desligamento (título, texto, botões) usando o objeto de configuração.
- `setupModalEvents(modalElement, resolve)`: registra os botões “Cancelar/Encerrar”, fecha o modal nos cliques corretos e resolve a Promise que sinaliza a escolha do usuário.
- `removeExistingModal()`: garante que apenas um modal de saída esteja aberto por vez.
- `createShutdownModal(config)`: helper que compõe `createModalHTML`, injeta no DOM e retorna o elemento pronto.
- `showShutdownConfirmationModal()`: fluxo padrão chamado pelo adaptador de shutdown; retorna uma Promise que resolve somente após a confirmação.
- `showCustomShutdownModal(options)`: permite abrir variações personalizadas reutilizando a mesma infraestrutura.

### codigo/public/scripts/01_Create_Obra/utils/core-utils.js

- `waitForElement(selector, timeout = 3000)`: retorna uma Promise que resolve quando o elemento aparece no DOM ou rejeita ao atingir o timeout.
- `safeNumber(value, defaultValue = 0)`: converte valores em números válidos, retornando `defaultValue` quando o input é inválido.
- `updateElementText(elementId, value)`: encapsula o acesso ao DOM, atualizando o texto apenas se o elemento existir.
- `generateUniqueId(prefix = 'item')`: cria IDs simples baseados em timestamp/random para componentes que não dependem dos geradores hierárquicos.
- `isValidElement(element)`: confirma se o objeto recebido é um elemento DOM antes de manipulá-lo.
- `debounce(func, wait)`: implementação reutilizável de debounce utilizada por inputs e cálculos intensivos.
