# Documentação dos Arquivos e Funções do Sistema

Este documento lista os principais arquivos do projeto, o que cada um faz e as funções/handlers que expõem. A organização segue por camadas: Backend (Python), Frontend (HTML/JS/CSS) e Dados (JSON).

## Visão Geral

- Backend HTTP local em Python que serve a SPA e expõe APIs de obras, projetos, sessões e dados.
- Frontend em JavaScript modular (ES Modules) para modelagem de obras, projetos, salas, cálculos de vazão/ganhos térmicos e seleção de máquinas.
- Persistência em arquivos JSON (`codigo/json`): backup de obras/projetos, dados do sistema e sessões.

---

## Backend (Python)

- `codigo/servidor.py`
  - O que faz: ponto de entrada do servidor. Executa diagnóstico, configura sinais, escolhe porta disponível, cria servidor HTTP e inicia threads auxiliares (abrir navegador e monitor). Controla o loop principal.
  - Funções:
    - `diagnostico_completo()`: faz verificação básica de diretórios/arquivos e imports antes de iniciar.
    - `main()`: orquestra inicialização, cria `TCPServer`, inicia threads (`open_browser`, `browser_monitor.monitorar_navegador`), executa `run_server_loop` e trata encerramento/erros.

- `codigo/servidor_modules/config.py`
  - O que faz: centraliza flags de execução e constantes do servidor e do monitor.
  - Variáveis principais: `servidor_rodando`, `SERVER_TIMEOUT`, `DEFAULT_PORT`, `MAX_PORT_ATTEMPTS`, `MONITOR_*`, `MESSAGES`.

- `codigo/servidor_modules/server_utils.py`
  - O que faz: utilitários de infraestrutura do servidor (porta, sinais, criação e ciclo do servidor, threads auxiliares).
  - Funções:
    - `is_port_in_use(port)`: verifica se a porta está ocupada.
    - `kill_process_on_port(port)`: tenta finalizar processo que ocupa a porta (Windows).
    - `find_available_port(start_port, max_attempts)`: encontra porta livre (com fallback aleatório).
    - `setup_port(default_port)`: resolve porta a usar; tenta liberar/alternar.
    - `signal_handler(signum, frame)`: marca `servidor_rodando=False` para encerramento graceful.
    - `setup_signal_handlers()`: registra handlers de SIGINT/SIGTERM.
    - `create_server(port, handler_class)`: cria `socketserver.TCPServer` com timeout e reuse.
    - `print_server_info(port)`: exibe informações/controles e URL.
    - `open_browser(port)`: abre navegador padrão na URL da aplicação.
    - `start_server_threads(port, httpd, monitor_function)`: inicia threads de navegador e monitor.
    - `run_server_loop(httpd)`: loop principal com `handle_request()` e tratamento de exceções/timeouts.
    - `shutdown_server_async(httpd)`: encerra servidor em thread separada com timeout.

- `codigo/servidor_modules/file_utils.py`
  - O que faz: utilitários para localizar raiz do projeto e ler/gravar JSONs.
  - Funções:
    - `find_project_root()`: detecta pasta `codigo` com `public/pages/01_CreateProjects.html` a partir do CWD e pais.
    - `find_json_file(filename, project_root)`: resolve/localiza arquivo JSON em locais esperados, criando diretório `json` se necessário.
    - `load_json_file(filepath, default_data=None)`: abre JSON com fallback para criar com default.
    - `save_json_file(filepath, data)`: grava JSON com `ensure_ascii=False`.

- `codigo/servidor_modules/sessions_manager.py`
  - O que faz: gerencia arquivo de sessões (`codigo/json/sessions.json`) no modelo simplificado e estável: `{ "sessions": { "session_active": { "obras": ["id", ...] } } }`.
  - Classe `SessionsManager` (métodos principais):
    - Inicialização: `ensure_sessions_file()`, `_initialize_sessions_file()` criam/garantem arquivo com `{ sessions: { session_active: { obras: [] } } }`.
    - Sessão ativa: `get_current_session_id()` retorna sempre `"session_active"` (sessão única).
    - Obras (novo): `add_obra_to_session(obra_id)`, `remove_obra(obra_id)`, `get_session_obras()`.
    - Compatibilidade com projetos: `add_project_to_session(project_id)`, `remove_project(project_id)`, `get_session_projects()` — wrappers legados para manter compatibilidade (não manipulam mais projetos diretamente).
    - Limpeza/controle: `clear_session()`, `force_clear_all_sessions()`, `ensure_single_session()`.
    - I/O: `_load_sessions_data()`, `_save_sessions_data(data)` com validação/normalização da estrutura.
    - Consulta: `get_current_session()` retorna somente a sessão ativa no formato esperado por rotas.
    - Utilitário: `debug_sessions()` imprime estado atual para diagnóstico.
  - Instância global: `sessions_manager` (inicializa garantindo sessão única ativa e vazia).

- `codigo/servidor_modules/http_handler.py`
  - O que faz: handler HTTP que serve arquivos estáticos e roteia endpoints de API para `routes.RouteHandler`.
  - Classe `UniversalHTTPRequestHandler`:
    - `__init__(...)`: define `project_root`, instancia `RouteHandler`, e configura diretório de serviço.
    - `do_GET()`: rotas GET: `/projetos|/projects`, `/obras` (novo), `/constants|/system-constants`, `/dados`, `/backup`, `/machines`, `/health-check`, `/api/session-projects`, `/api/sessions/current`; fallback para arquivos estáticos.
    - `do_POST()`: rotas POST: `/api/sessions/shutdown`, `/api/shutdown`, `/projetos|/projects`, `/obras` (novo), `/dados`, `/backup`, `/api/sessions/ensure-single`.
    - `do_PUT()`: rotas PUT: `/obras/:id` (novo) e `/projetos/:id`.
    - `do_DELETE()`: rota DELETE: `/api/sessions/remove-project/:id`.
    - `send_json_response(data, status=200)`: resposta JSON com CORS.
    - `end_headers()`: acrescenta CORS por padrão.
    - `do_OPTIONS()`: responde CORS preflight.

- `codigo/servidor_modules/routes.py`
  - O que faz: implementa a lógica de cada rota de API (obras, projetos, dados, machines e sessões).
  - Classe `RouteHandler` (métodos principais):
    - Obras (novos):
      - `handle_get_obras(handler)`: lê `backup.json`, obtém lista de obras e filtra pelas IDs da sessão atual.
      - `handle_post_obras(handler)`: cria nova obra com ID único, associa projetos da obra à sessão e salva em `backup.json`.
      - `handle_put_obra(handler)`: atualiza uma obra por `id` em `backup.json`, sincronizando projetos associados na sessão.
    - Projetos/backup:
      - `handle_get_projetos(handler)`: lê `backup.json` e retorna lista de projetos (compatibilidade legada; filtragem por sessão pode não retornar itens em Setups só com obras).
      - `handle_post_projetos(handler)`: cria projeto com novo ID, salva em `backup.json` e associa ID à sessão atual (compatibilidade).
      - `handle_put_projeto(handler)`: atualiza projeto por `id` dentro de `backup.json`.
      - `handle_get_backup(handler)`: retorna `backup.json` completo.
    - Dados do sistema:
      - `handle_get_constants(handler)`: retorna `constants` de `dados.json`.
      - `handle_get_machines(handler)`: retorna `machines` de `dados.json`.
      - `handle_get_dados(handler)`: retorna `dados.json` completo.
      - `handle_post_dados(handler)`: sobrescreve `dados.json`.
      - `handle_post_backup(handler)`: sobrescreve `backup.json`.
    - Sessões (controle de sessão única e limpeza):
      - `handle_get_sessions_current(handler)`: retorna somente a sessão atual.
      - `handle_get_session_projects(handler)`: retorna `{session_id, projects}` (compatibilidade).
      - `handle_delete_sessions_remove_project(handler)`: remove um projeto específico da sessão (compatibilidade).
      - `handle_post_sessions_shutdown(handler)`: limpa completamente todas as sessões (com verificação e fallback forçado).
      - `handle_post_sessions_ensure_single(handler)`: garante sessão única ativa e retorna resumo.
    - Encerramento do servidor:
      - `handle_shutdown(handler)`: retorna JSON com instrução para fechar janela e encerra o processo Python.

- `codigo/servidor_modules/browser_monitor.py`
  - O que faz: monitor simplificado (mantém servidor aberto; encerramento automático desativado). Mantido por compatibilidade.
  - Funções:
    - `monitorar_navegador(port, httpd)`: laço simples que mantém a thread ativa e encerra via sinal manual.

- `codigo/servidor_modules/__init__.py`
  - O que faz: agrega e exporta submódulos do pacote `servidor_modules`.

---

## API Endpoints (Resumo)

- Obras:
  - `GET /obras` → lista obras da sessão atual (filtradas de `backup.json`).
  - `POST /obras` → cria obra e associa seus projetos à sessão atual.
  - `PUT /obras/:id` → atualiza obra existente.
- Projetos/Backup (compatibilidade):
  - `GET /projetos` → lista projetos (pode retornar vazio em setups só com obras).
  - `POST /projetos` → cria projeto e associa à sessão atual.
  - `PUT /projetos/:id` → atualiza projeto existente.
  - `GET /backup` / `POST /backup` → lê/salva backup completo.
- Dados do sistema (`dados.json`):
  - `GET /constants` → retorna `constants`.
  - `GET /machines` → retorna `machines`.
  - `GET /dados` / `POST /dados` → lê/salva dados completos.
- Sessões:
  - `GET /api/sessions/current` → sessão atual.
  - `GET /api/session-projects` → `{ session_id, projects: [ids] }`.
  - `POST /api/sessions/ensure-single` → enforce sessão única.
  - `DELETE /api/sessions/remove-project/:id` → remove id da sessão. {NÃO FUNCIONANDO}
  - `POST /api/sessions/shutdown` → zera todas as sessões.
- Infra:
  - `POST /api/shutdown` → encerra servidor (cliente fecha a aba). {ATUALIZAÇÃO precisa de uma "notificação de que o servidor fechará sozinho} {ERRO: servidor no terminal nao encerrando, só está encerrando na interface}
  - `GET /health-check` → status básico.

---

## Frontend (HTML/JS)

- `codigo/public/pages/01_CreateProjects.html`
  - O que faz: página inicial SPA. Define header, navegação, container de projetos e carrega `../scripts/page1/main.js` (ES Module).

- `codigo/public/scripts/page1/main.js`
  - O que faz: bootstrap do app no browser. Inicializa globais, carrega módulos, constantes e integra obras; gerencia shutdown manual.
  - Classes/Funções:
    - `class ShutdownManager`: cria botão “Encerrar Servidor”, desativa auto-shutdown, envia comandos `/api/sessions/shutdown` e `/api/shutdown`.
    - `loadAllModules()`: importa dinamicamente módulos de UI, edição, dados, cálculos e utils, e expõe no `window` (atualizado para obras).
    - `loadSystemConstants()`: busca `/constants` e valida presença de chaves críticas.
    - `verifyAndCreateBaseObra()`: verificação leve; sistema inicia vazio e sugere criação manual de obra.
    - `finalSystemDebug()`: logs de integridade pós-inicialização.
    - Listener `DOMContentLoaded`: orquestra sequência (shutdown → módulos → constantes → checagem inicial sem iniciar sessão → verificação de obras → debug).

- `codigo/public/scripts/page1/data/server.js`
  - O que faz: integração com backend + estado de sessão no `sessionStorage` + fluxo de obras na UI.
  - Sessão (chaves: `SESSION_ACTIVE_KEY`, `SESSION_OBRAS`):
    - `isSessionActive()`, `setSessionActive(active)`.
    - `getSessionObras()`, `setSessionObras(ids)`, `addObraToSession(id)`, `removeObraFromSessionLocal(id)`, `clearSessionObras()`.
  - Renderização/contador global:
    - `clearRenderedObras()`.
    - `initializeGeralCount()`, `incrementGeralCount()`, `decrementGeralCount()`, `getGeralCount()`.
  - Carregamento/normalização:
    - `removeBaseObraFromHTML()`.
    - `loadObrasFromServer()`: usa `/api/sessions/current` e `/obras` para carregar só as obras da sessão (com `loadProjectsAsFallback()` como reserva).
    - `loadProjectsAsFallback(obraIds)`: carrega projetos como fallback quando `/obras` indisponível.
  - Gestão de obra removida e utilitários:
    - `saveFirstObraIdOfSession(id)`, `addObraToRemovedList(id)`, `getRemovedObrasList()`, `isObraRemoved(id)`, `resetDisplayLogic()`.
  - Sessão ativa única e ciclo de vida:
    - `startNewSession()`, `startSessionOnFirstSave()`, `ensureSingleActiveSession()` (backend), `initializeSession()`.
    - `removeObraFromSession(id)`: remove no backend e local.
  - Encerramento:
    - `shutdownManual()`: limpa sessões (backend), limpa UI e fecha aba com mensagem e fechamento automático.
  - Exporta utilitários para outros módulos e anexa `window.shutdownManual`.

- `codigo/public/scripts/page1/data/projects.js`
  - O que faz: fluxo de obras (novo). Busca, salva e atualiza obras no backend; inclui utilitários de verificação e compatibilidade com remoção de projetos.
  - Funções principais:
    - Obras: `fetchObras()`, `salvarObra(obraData)`, `atualizarObra(obraId, obraData)`, `saveObra(obraName, event)`, `deleteObraFromServer(obraName, obraId)`.
    - Projetos (compatibilidade/UX): `deleteProject(obraName, projectName)`, `deleteProjectLegacy(projectName)`.
    - Verificação/relatórios: `verifyObraData(obraName)`, `calculateRoomCompletionStats(room)`.

- `codigo/public/scripts/page1/data/rooms.js`
  - O que faz: integra módulos de construção de sala, máquinas e configuração; inicializa inputs de capacidade com base em `systemConstants`.
  - Funções:
    - `initializeAllCapacityInputs()`: preenche valores padrão (ex.: `FATOR_SEGURANCA_CAPACIDADE`).
    - Reexporta: criação/remoção de salas e seções (vindo de `modules/room-operations.js`, `modules/salas.js`, `modules/maquinas.js`, `modules/configuracao.js`).

- `codigo/public/scripts/page1/data/data-utils.js`
  - O que faz: extrai do DOM os dados completos de obra/projeto/sala/máquinas para salvar no backend; gera IDs hierárquicos.
  - Funções principais:
    - IDs: `generateObraId()`, `generateProjectId(obraEl)`, `generateRoomId(projectEl)`.
    - Obra/Projeto/Sala: `buildObraData(obraElOrId)`, `getObraName(el)`, `buildProjectData(projectElOrId)`, `extractRoomData(roomEl, projectEl)`, `getProjectName(el)`, `getRoomName(el)`.
    - Inputs/Seções: `extractClimatizationInputs(roomEl)`, `extractCapacityData(roomEl)`, `extractConfigurationData(roomEl)`, `extractThermalGainsData(roomEl)`.
    - Máquinas: `extractClimatizationMachineData(machineEl)`, `getMachineName(...)`, `parseMachinePrice(text)`.
    - Util: `safeNumber(value)`.

- `codigo/public/scripts/page1/utils/utils.js`
  - O que faz: utilitários simples de id.
  - Funções: `ensureStringId(id)`.

- `codigo/public/scripts/page1/ui/interface.js`
  - O que faz: UI da SPA (banners de status, expandir/recolher seções); cria e gerencia obras/projetos; insere no DOM; botões e downloads.
  - Funções principais:
    - Status: `showSystemStatus(message, type)`, `removeExistingStatusBanner()`, `createStatusBanner(...)`, `insertStatusBanner(...)`, `scheduleStatusBannerRemoval(...)`.
    - Toggle/Expand/Collapse: `toggleElementVisibility(...)`, `expandElement(...)`, `collapseElement(...)`, `toggleObra(...)`, `toggleProject(...)`, `toggleRoom(...)`, `toggleSection(...)`, `toggleSubsection(...)`.
    - Obra: `createEmptyObra(name, id)`, `buildObraHTML(...)`, `buildObraActionsFooter(...)`, `insertObraIntoDOM(html)`, `addNewObra()`, `deleteObra(name)`, `saveOrUpdateObra(name)`, `updateObraButtonAfterSave(name, id)`, `getNextObraNumber()`, `removeEmptyObraMessage(...)`, `showEmptyObraMessageIfNeeded(...)`, `downloadPDF(...)`, `downloadWord(...)`.
    - Projeto: `createEmptyProject(obraName, name, id)`, `buildProjectHTML(...)`, `addNewProjectToObra(obraName)`, `getNextProjectNumber(obraName)`, `removeEmptyProjectMessage(...)`, `showEmptyProjectMessageIfNeeded(...)`.

- Cálculos (módulos):
  - `codigo/public/scripts/page1/calculos/calculos.js`: reexporta funções de helpers/airFlow/thermal.
  - `codigo/public/scripts/page1/calculos/utils/helpers.js`:
    - `safeNumber(value, default=0)`, `waitForSystemConstants()`, `validateSystemConstants()`, `collectClimatizationInputs(section, roomId)`, `updateElementText(id, value)`.
  - `codigo/public/scripts/page1/calculos/airFlow/airFlowCalculations.js`:
    - `calculateDoorFlow(count, variable, pressure)`, `computeAirFlowRate(inputData)`, `calculateVazaoAr(roomId, calculateThermal=true)`, `calculateVazaoArAndThermalGains(roomId)`.
  - `codigo/public/scripts/page1/calculos/airFlow/airFlowDisplay.js`:
    - `updateFlowRateDisplay(roomId, flowRate)`.
  - `codigo/public/scripts/page1/calculos/thermalGains/thermalCalculations.js`:
    - `calculateThermalGains(roomId, vazaoArExterno)`, `calculateUValues(tipoConstrucao)`, `calculateAuxiliaryVariables(inputData)`.
  - `codigo/public/scripts/page1/calculos/thermalGains/thermalComponents.js`:
    - `calculateCeilingGain(...)`, `calculateWallGain(...)`, `calculatePartitionGain(...)`, `calculateFloorGain(...)`, `calculateLightingGain(...)`, `calculateDissipationGain(...)`, `calculatePeopleGain(...)`, `calculateExternalAirSensibleGain(...)`, `calculateExternalAirLatentGain(...)`.
  - `codigo/public/scripts/page1/calculos/thermalGains/thermalDisplay.js`:
    - `calculateTotals(gains)`, `updateThermalGainsDisplay(roomId, gains, totals, uValues, inputData)`, `updateWallDisplay(...)`, `updatePartitionDisplay(...)`.

- Módulos de Salas/Máquinas/Capacidade:
  - `codigo/public/scripts/page1/data/modules/salas.js`:
    - `buildRoomHTML(projectName, roomName, roomId)`, `buildRoomHeader(...)`, `buildRoomActions(...)`.
  - `codigo/public/scripts/page1/data/modules/climatizacao.js`:
    - `buildClimatizationSection(projectName, roomName)`, `buildClimatizationTable(roomId)`, `buildClimaRow(fields, roomId)`, `buildClimaCell(field, roomId)`, `buildSelectInput(field, roomId)`, `buildTextInput(field, roomId)`, `buildResultRow(roomId)`, `buildThermalGainsSection(roomId)`.
  - `codigo/public/scripts/page1/data/modules/configuracao.js`:
    - `buildConfigurationSection(projectName, roomName)` (checkboxes de instalação).
  - `codigo/public/scripts/page1/data/modules/machines/utilities.js`:
    - `updateElementText(id, value)`, `removeEmptyMessage(container, selector)`, `showEmptyMessage(container, message)`, `findRoomId(element, prefix)`.
  - `codigo/public/scripts/page1/data/modules/machines/machinesBuilder.js`:
    - `buildMachinesSection(projectName, roomName)` (inclui tabela de capacidade e container de máquinas).
    - `loadMachinesData()` (fetch `/machines` com cache global).
    - `loadSavedMachines(roomId, savedMachines)` (recria UI a partir dos dados salvos).
    - `updateCapacityFromThermalGains(roomId)`, `initializeCapacityCalculations()`, `refreshAllCapacityCalculations()`.
  - `codigo/public/scripts/page1/data/modules/machines/machineManagement.js`:
    - Adição/gestão de máquinas: `addMachine(roomId)`, `buildClimatizationMachineHTML(machineId, machines)`.
    - UI/Seleção: `toggleMachineSection(btn)`, `updateMachineTitle(input, machineId)`, `updateMachineOptions(select)`, `updateOptionSelection(machineId, optionId)`, `handleOptionClick(machineId, optionId)`, `updateOptionValues(machineId)`, `handlePowerChange(machineId)`.
    - Preço: `calculateMachinePrice(machineId)`.
    - Remoção: `deleteClimatizationMachine(button)`.
    - Helpers UI: `updateSelect(selector, options, defaultText, disabled)`.
  - `codigo/public/scripts/page1/data/modules/machines/capacityCalculator.js`:
    - Tabela/Inicialização: `buildCapacityCalculationTable(roomId)`, `initializeStaticCapacityTable()`, `scheduleCapacityInit(roomId)`, `initializeCapacitySystem(roomId)`.
    - Cálculo e exibição: `calculateCapacitySolution(roomId)`, `updateCapacityDisplay(...)`.
    - Persistência: `getCapacityData(roomId)`, `saveCapacityData(projectName, roomName)`, `loadCapacityData(projectName, roomName)`, `applyCapacityData(roomId, capacityData)`.
    - Backup: `updateBackupConfiguration(select)`, `handleClimaInputBackupChange(roomId, value)`, `syncCapacityTableBackup(roomId)`.
    - Util: `applyFatorSeguranca(roomId, value)`, `applyBackupConfiguration(n, tipo)`, `getBackupFromClimatization(roomId)`, `getBackupFromClimaInputs(roomId)`.

- `codigo/public/scripts/page1/data/server-utils.js`
  - O que faz: utilitários de renderização a partir de dados salvos (obra, projeto e sala) e preenchimento do DOM; aciona cálculos e sincronizações.
  - Funções:
    - `renderObraFromData(obraData)`, `renderProjectFromData(projectData, obraName)`, `renderRoomFromData(projectName, roomData, obraName)`.
    - `populateRoomInputs(projectName, roomName, roomData, obraName)`, `populateBasicInputs(roomBlock, inputs, roomId)`, `populateConfiguration(roomBlock, config)`, `populateThermalGains(roomBlock, gains)`, `populateCapacityData(roomBlock, capacity, roomId)`, `populateMachines(roomBlock, machines, roomId)`.

- Arquivos de Dados (data-files):
  - `codigo/public/scripts/page1/data/data-files/data-utils-core.js`:
    - O que faz: utilitários core para geração de IDs, nomes e parsing numérico; helpers para compor IDs completos e debug.
    - Funções:
      - `generateObraId()`: gera ID global de obra (1001+). — Comentário: usa contador interno; retorna `string`.
      - `generateProjectId(obraElement)`: gera ID por obra. — Comentário: inspeciona `.project-block`; retorna `string`.
      - `generateRoomId(projectElement)`: gera ID por projeto. — Comentário: inspeciona `.room-block`; retorna `string`.
      - `getRoomFullId(roomElement)`: monta ID completo `ProjetoN-SalaM`. — Comentário: usa DOM e fallbacks.
      - `extractNumberFromText(text)`: extrai número de string. — Comentário: lida com vírgula/ponto.
      - `getObraName(obraElement)`, `getProjectName(projectElement)`, `getRoomName(roomElement)`: obtêm nomes seguros. — Comentário: priorizam títulos/datasets.
      - `getMachineName(machineElement, machineId)`: nome seguro da máquina. — Comentário: usa título editável.
      - `parseMachinePrice(priceText)`: converte “R$ …” para número. — Comentário: remove pontuação e converte.
      - `safeNumber(value)`: normaliza valores para número. — Comentário: retorna 0 em inválidos.
      - `debugThermalGainsElements(roomElement)`: imprime no console disponibilidade de elementos de ganhos. — Comentário: util para inspeção.
  - `codigo/public/scripts/page1/data/data-files/data-extractors.js`:
    - O que faz: extrai dados do DOM para salvar (clima, máquinas, capacidade, ganhos, configuração).
    - Funções:
      - `extractThermalGainsData(roomElement)`: coleta totais por componentes/gerais. — Comentário: usa IDs padronizados; fallback textual.
      - `extractClimatizationInputs(roomElement)`: coleta inputs de clima (inclui pressurização). — Comentário: radios/selects e defaults.
      - `extractMachinesData(roomElement)`: agrega máquinas da sala. — Comentário: usa `extractClimatizationMachineData`.
      - `extractClimatizationMachineData(machineElement)`: coleta tipo, potência, tensão, opções e preços. — Comentário: monta objeto máquina.
      - `extractCapacityData(roomElement)`: lê tabela de capacidade. — Comentário: pega valores e backup; lê input de carga-estimada.
      - `extractConfigurationData(roomElement)`: coleta checkboxes de instalação. — Comentário: monta `opcoesInstalacao`.
      - Interno: `attemptAlternativeSearch(key, roomFullId, gains)`: busca valores de ganhos por texto. — Comentário: fallback quando IDs não encontrados.
  - `codigo/public/scripts/page1/data/data-files/data-builders.js`:
    - O que faz: constrói objetos de dados de obra, projeto e sala a partir do DOM, compondo todas as seções.
    - Funções:
      - `buildObraData(obraIdOrElement)`: retorna `{id,nome,timestamp,projetos}`. — Comentário: aceita elemento/identificador; itera projetos.
      - `buildProjectData(projectIdOrElement)`: retorna `{id,nome,salas,timestamp}`. — Comentário: delibera ID por obra; itera salas.
      - `extractRoomData(roomElement, projectElement)`: retorna dados completos da sala. — Comentário: chama extratores para cada seção.

- UI Internos (intr-files):
  - `codigo/public/scripts/page1/ui/intr-files/status-manager.js`:
    - O que faz: gerencia banners de status (sucesso/erro/etc.).
    - Funções: `showSystemStatus(message, type)`, `removeExistingStatusBanner()`, `createStatusBanner(message, type)`, `insertStatusBanner(banner)`, `scheduleStatusBannerRemoval(banner)`.
  - `codigo/public/scripts/page1/ui/intr-files/obra-manager.js`:
    - O que faz: criação/rodapé/remoção e inserção de obras na UI; cálculo do próximo número; criação de nova obra.
    - Funções: `createEmptyObra(name, id)`, `buildObraHTML(name, id)`, `buildObraActionsFooter(name, hasId)`, `insertObraIntoDOM(html)`, `updateObraButtonAfterSave(name, id)`, `deleteObra(name)`, `getNextObraNumber()`, `addNewObra()`.
  - `codigo/public/scripts/page1/ui/intr-files/project-manager.js`:
    - O que faz: criação e gestão básica de projetos na obra; cálculo do próximo número.
    - Funções: `createEmptyProject(obraName, projectName, projectId)`, `buildProjectHTML(obraName, projectName, projectId)`, `addNewProjectToObra(obraName)`, `getNextProjectNumber(obraName)`.
  - `codigo/public/scripts/page1/ui/intr-files/ui-helpers.js`:
    - O que faz: utilidades de UI (toggle expandir/recolher; mensagens “vazio”; métricas de preenchimento de sala).
    - Funções: `toggleElementVisibility(contentId, btn)`, `expandElement(el, btn)`, `collapseElement(el, btn)`, `calculateRoomCompletionStats(room)`, `removeEmptyObraMessage(name)`, `showEmptyObraMessageIfNeeded(name)`, `removeEmptyProjectMessage(content)`, `showEmptyProjectMessageIfNeeded(content)`.

---

## Dados (JSON)

- `codigo/json/dados.json`
  - O que faz: dados operacionais do sistema usados no frontend/backend.
  - Estrutura relevante:
    - `constants`: constantes usadas nos cálculos (ex.: `VARIAVEL_PD`, `VARIAVEL_PS`, `AUX_*`, `deltaT_*`, etc.).
    - `machines`: lista de tipos de máquinas com `type`, `baseValues` por TR (ex.: `1TR`, `2TR`, `7,5TR`, ...), `options` (cada uma com `id`, `name`, `values` por TR) e `voltages` (`name` e `value`).

- `codigo/json/backup.json`
  - O que faz: armazenamento de obras e projetos salvos. Estrutura principal: lista `obras`, cada obra com `id`, `nome`, `timestamp` e lista `projetos`; cada projeto possui `id`, `nome`, `salas` e respectivos dados extraídos da UI (inputs, máquinas, capacidade, ganhos térmicos, configuração, timestamp).

- `codigo/json/sessions.json`
  - O que faz: estado de sessões do cliente. Estrutura estável e simplificada: `{ "sessions": { "session_active": { "obras": ["1001", ...] } } }` (sessão única ativa com IDs de obras).

- `data/sessions.json`
  - Observação: arquivo lateral no repositório com estrutura de sessão; não é usado diretamente pelo backend atual (que usa `codigo/json/sessions.json`).

---

## Estilos (CSS)

- Diretório base: `codigo/public/static/page1/`
  - `base/`: `reset.css`, `variables.css`, `backup.css` — resets, variáveis e estilos auxiliares.
  - `components/`: `buttons.css`, `cards.css`, `forms.css`, `header.css`, `machines.css`, `navigation.css`, `tables.css`, `capacity-tables.css` — componentes visuais da SPA.
  - `layout/`: `grid.css` — grid e layout geral.
  - `pages/`: `projects.css`, `thermal-calculation.css` — ajustes por página/seções.
  - `main.css`: folha principal agregando estilos da página.

---

## Scripts Auxiliares

- `codigo/public/pastas.py`
  - O que faz: cria pasta `templates` e 10 arquivos vazios `01.css` a `10.css` (script utilitário local).

---

## Observações

- Codificação de caracteres: alguns prints/logs nos arquivos Python/JS mostram caracteres corrompidos (acentos). Não afeta a execução, mas recomenda-se normalizar encoding (UTF-8) se for editar mensagens.
- Se desejar, posso gerar um diagrama dos fluxos (sessão → obras → projetos → cálculos → capacidade) ou uma visão de dependências entre módulos.
- Endpoints de obras: o frontend (`projects.js`) tenta usar `DELETE /obras/:id` e `GET /obras/:id` para alguns fluxos; esses endpoints não estão implementados no backend atual. Se quiser, posso alinhar a API (adicionar rotas) ou ajustar o frontend para compatibilidade total.

---

## Comentários por Arquivo e Funções

### Backend (Python) — Comentários

- `codigo/servidor.py`
  - Comentário do arquivo: ponto de entrada do servidor; faz diagnóstico, configura sinais, escolhe porta e controla ciclo de vida.
  - Funções:
    - `diagnostico_completo()`: sem parâmetros; imprime inspeções de estrutura/arquivos e imports; sem retorno.
    - `main()`: inicia servidor HTTP, threads auxiliares e loop; captura exceções; sem retorno.

- `codigo/servidor_modules/config.py`
  - Comentário do arquivo: centraliza flags, tempos e mensagens; define limites e origens permitidas para CORS.
  - Principais variáveis: `servidor_rodando`, `SERVER_TIMEOUT`, `DEFAULT_PORT`, `MAX_PORT_ATTEMPTS`, `MONITOR_*`, `HEARTBEAT_TIMEOUT`, `MESSAGES`, `MAX_REQUEST_SIZE`, `ALLOWED_ORIGINS`.

- `codigo/servidor_modules/server_utils.py`
  - Comentário do arquivo: infraestrutura de porta, sinais, criação/execução do servidor e threads auxiliares.
  - Funções: `is_port_in_use(port)`, `kill_process_on_port(port)`, `find_available_port(start_port, max_attempts)`, `setup_port(default_port)`, `signal_handler(signum, frame)`, `setup_signal_handlers()`, `create_server(port, handler_class)`, `print_server_info(port)`, `open_browser(port)`, `start_server_threads(port, httpd, monitor_function)`, `run_server_loop(httpd)`, `shutdown_server_async(httpd)` — cada uma com foco em preparar porta, iniciar/fechar servidor e dar experiência de uso (abrir navegador, logs).

- `codigo/servidor_modules/file_utils.py`
  - Comentário do arquivo: descoberta da raiz do projeto e I/O segura de JSONs.
  - Funções: `find_project_root()` (retorna `Path` raiz), `find_json_file(filename, project_root)` (garante/cria arquivo JSON mínimo e retorna `Path`), `load_json_file(filepath, default_data=None)` (retorna `dict|list` com fallback), `save_json_file(filepath, data)` (persiste JSON; retorna `bool`).

- `codigo/servidor_modules/sessions_manager.py`
  - Comentário do arquivo: gerencia `sessions.json` com uma sessão única ativa (`session_active`) contendo IDs de obras.
  - Métodos principais: `ensure_sessions_file()`, `_initialize_sessions_file()`, `get_current_session_id()`, `add_obra_to_session(obra_id)`, `remove_obra(obra_id)`, `get_session_obras()`, `clear_session()`, `force_clear_all_sessions()`, `ensure_single_session()`, `_load_sessions_data()`, `_save_sessions_data(data)`, `get_current_session()`, `debug_sessions()`; e métodos de compatibilidade com projetos (`add_project_to_session`, `remove_project`, `get_session_projects`).

- `codigo/servidor_modules/http_handler.py`
  - Comentário do arquivo: roteador HTTP + servidor de estáticos com CORS padrão.
  - Principais métodos: `do_GET()` (rotas `/projetos`, `/obras`, `/constants`, etc.), `do_POST()` (shutdown, dados, backup), `do_PUT()` (obras/projetos), `do_DELETE()` (remover id da sessão legada), `send_json_response(...)`, `end_headers()`, `do_OPTIONS()`.

- `codigo/servidor_modules/routes.py`
  - Comentário do arquivo: lógica das rotas (obras, projetos – compat., dados, máquinas, sessões e shutdown).
  - Principais métodos: `handle_get_obras`, `handle_post_obras`, `handle_put_obra`, `handle_get_projetos`, `handle_post_projetos`, `handle_put_projeto`, `handle_get_constants`, `handle_get_machines`, `handle_get_dados`, `handle_post_dados`, `handle_get_backup`, `handle_post_backup`, `handle_get_sessions_current`, `handle_get_session_projects`, `handle_delete_sessions_remove_project`, `handle_post_sessions_shutdown`, `handle_post_sessions_ensure_single`, `handle_shutdown`.

- `codigo/servidor_modules/browser_monitor.py`
  - Comentário do arquivo: monitor simplificado para manter thread viva; encerramento automático desativado (apenas logs periódicos).

- `codigo/servidor_modules/__init__.py`
  - Comentário do arquivo: agrega e exporta submódulos do pacote para facilitar imports (`from servidor_modules import ...`).

### Frontend (HTML/JS) — Comentários (Parte 1)

- `codigo/public/scripts/page1/main.js`
  - Comentário do arquivo: bootstrap do app no browser; publica funções globais e gerencia shutdown manual.
  - Principais itens: classe `ShutdownManager` (métodos `init`, `disableAutoShutdown`, `createShutdownButton`, `shutdownManual`), `loadAllModules()`, `loadSystemConstants()`, `verifyAndCreateBaseObra()`, `finalSystemDebug()`, listener `DOMContentLoaded`.

- `codigo/public/scripts/page1/data/server.js`
  - Comentário do arquivo: estado da sessão (local) e integração com endpoints; fluxo de carregamento/remoção de obras; UI de encerramento.
  - Funções: `isSessionActive`, `setSessionActive`, `getSessionObras`, `setSessionObras`, `addObraToSession`, `removeObraFromSessionLocal`, `clearSessionObras`, `clearRenderedObras`, `initializeGeralCount`, `incrementGeralCount`, `decrementGeralCount`, `getGeralCount`, `removeBaseObraFromHTML`, `loadObrasFromServer`, `loadProjectsAsFallback`, `resetDisplayLogic`, `startNewSession`, `startSessionOnFirstSave`, `shutdownManual`, `removeObraFromSession`, `ensureSingleActiveSession`, `saveFirstObraIdOfSession`, `addObraToRemovedList`, `getRemovedObrasList`, `isObraRemoved`, `initializeSession`.

- `codigo/public/scripts/page1/data/projects.js`
  - Comentário do arquivo: fluxo de salvar/atualizar obras; operações de verificação/relatório e compatibilidade com remoção de projetos.
  - Funções: `fetchObras`, `salvarObra`, `atualizarObra`, `saveObra`, `deleteProject`, `deleteProjectLegacy`, `deleteObraFromServer`, `verifyObraData`, `calculateRoomCompletionStats`.

- `codigo/public/scripts/page1/data/rooms.js`
  - Comentário do arquivo: compõe módulos de salas, máquinas e configuração; inicializa inputs de capacidade.
  - Funções: `initializeAllCapacityInputs` e reexportações para criação/remoção de salas e construção de seções.

- `codigo/public/scripts/page1/ui/interface.js`
  - Comentário do arquivo: camada de interface/DOM — status de sistema, criação e gestão de obras/projetos/salas, botões e downloads.
  - Funções: status (`showSystemStatus`, etc.), toggles (`toggleObra`, `toggleProject`, etc.), obra (`createEmptyObra`, `buildObraHTML`, `buildObraActionsFooter`, `insertObraIntoDOM`, `addNewObra`, `deleteObra`, `saveOrUpdateObra`, `updateObraButtonAfterSave`, `getNextObraNumber`, `removeEmptyObraMessage`, `showEmptyObraMessageIfNeeded`, `downloadPDF`, `downloadWord`), projeto (`createEmptyProject`, `buildProjectHTML`, `addNewProjectToObra`, `getNextProjectNumber`, `removeEmptyProjectMessage`, `showEmptyProjectMessageIfNeeded`).

### Frontend (HTML/JS) — Comentários (Parte 2)

- `codigo/public/scripts/page1/data/data-utils.js`
  - Comentário do arquivo: extrai/compõe dados hierárquicos (obra > projeto > sala) a partir do DOM; gera IDs e serializa seções.
  - Funções: geração de IDs (`generateObraId`, `generateProjectId`, `generateRoomId`), composição/extração (`buildObraData`, `getObraName`, `buildProjectData`, `extractRoomData`, `getProjectName`, `getRoomName`), seções (`extractClimatizationInputs`, `extractCapacityData`, `extractConfigurationData`, `extractThermalGainsData`), máquinas (`extractMachinesData`, `extractClimatizationMachineData`, `getMachineName`, `parseMachinePrice`), util (`safeNumber`).

- `codigo/public/scripts/page1/utils/utils.js`
  - Comentário do arquivo: utilitários simples para IDs.
  - Funções: `ensureStringId` (normaliza valores para `string` ou `null`).

- `codigo/public/scripts/page1/calculos/calculos.js`
  - Comentário do arquivo: barrel que reexporta funções de fluxo de ar e ganhos térmicos para consumo pela UI.

- `codigo/public/scripts/page1/calculos/airFlow/*`
  - Comentário dos arquivos: cálculos (`airFlowCalculations.js`) e exibição (`airFlowDisplay.js`) de vazão de ar; atualizam a UI por sala.

- `codigo/public/scripts/page1/calculos/thermalGains/*`
  - Comentário dos arquivos: cálculo de ganhos térmicos (`thermalCalculations.js`) e componentes (`thermalComponents.js`); exibição/totalização (`thermalDisplay.js`).

- `codigo/public/scripts/page1/data/modules/machines/utilities.js`
  - Comentário do arquivo: utilitários de UI (texto, mensagens, localização de roomId) usados pelas seções de máquinas/capacidade.

- `codigo/public/scripts/page1/data/modules/machines/machinesBuilder.js`
  - Comentário do arquivo: constrói UI de máquinas, carrega catálogo e dispara cálculos de capacidade.

- `codigo/public/scripts/page1/data/modules/machines/machineManagement.js`
  - Comentário do arquivo: gerencia ações do usuário nas máquinas (adicionar/remover, alternar, selecionar opções, preços).

- `codigo/public/scripts/page1/data/modules/machines/capacityCalculator.js`
  - Comentário do arquivo: gera tabela e calcula solução de capacidade (TR, backup, folga), persiste e recarrega dados por sala.

- `codigo/public/scripts/page1/data/server-utils.js`
  - Comentário do arquivo: renderiza obra/projeto/sala a partir de dados salvos e preenche inputs/seletores, disparando recálculos.

### Dados (JSON) — Comentários

- `codigo/json/dados.json`
  - Comentário do arquivo: constantes de cálculo e catálogo de máquinas usados por frontend e backend. — Estrutura: `constants` (parâmetros de fórmulas) e `machines` (tipos, potências, opções, tensões).

- `codigo/json/backup.json`
  - Comentário do arquivo: persistência de obras, projetos e salas com todos os dados serializados da UI. — Estrutura: `obras: [{ id, nome, timestamp, projetos: [{ id, nome, salas: [...] }] }]`.

- `codigo/json/sessions.json`
  - Comentário do arquivo: estado de sessão do cliente (sessão única). — Estrutura: `{ sessions: { session_active: { obras: ["1001", ...] } } }`.
- `codigo/public/scripts/page1/config/config.js`
  - O que faz: centraliza constantes de UI e de cálculo usadas no frontend, além de chaves de sessionStorage.
  - Constantes/Exportes:
    - `CALCULATION_CONSTANTS`: `FLOW_COEFFICIENT`, `SECONDS_PER_HOUR`, `FLOW_DIVISOR`, `SAFETY_FACTOR`, `PRESSURE_EXPONENT`.
    - `UI_CONSTANTS`: `MINIMIZED_SYMBOL`, `EXPANDED_SYMBOL`, `SUCCESS_MESSAGE_DURATION`, `COLLAPSED_CLASS`.
    - Chaves de sessão: `SESSION_STORAGE_KEY`, `REMOVED_PROJECTS_KEY`, `NORMALIZATION_DONE_KEY`, `SESSION_ACTIVE_KEY`.

- `codigo/public/scripts/page1/globals.js`
  - O que faz: agrega e publica funções globais no `window` para uso em onClicks e integrações de UI legadas.
  - Funções:
    - `initializeGlobals()`: registra funções de UI (toggle), edição, projetos, salas, cálculos e status no escopo global; logs de confirmação.
    - Exports individuais de helpers (`toggleProject`, `toggleRoom`, etc.) para import modular quando necessário.

- Página 2 (Projetos) — `codigo/public/scripts/page2/`
  - `index.js`:
    - O que faz: inicializa a página 02 (lista/atualiza/deleta projetos) reutilizando módulos da página 01; garante sessão ativa; carrega constantes; orquestra `initProjectsPage`.
    - Funções internas: `loadSystemConstants()`; listener `DOMContentLoaded` que ativa sessão, carrega constantes, inicializa contadores e chama `initProjectsPage()`.
  - `projects.repo.js`:
    - O que faz: camada de dados da página 02. Busca todos os projetos (preferindo `/backup`), normaliza IDs, atualiza e remove projetos via módulos da página 01.
    - Funções: `getAllProjects()`, `normalizeProject(project)`, `updateProjectById(id, data)`, `deleteProjectById(id)`.
  - `projects.controller.js`:
    - O que faz: coordena carregamento, ordenação (por timestamp desc), e renderização dos projetos na página 02.
    - Funções: `sortProjectsByTimestampDesc(projects)`, `initProjectsPage()`.
  - `project-card.view.js`:
    - O que faz: view para renderizar cards de projetos na página 02, reutilizando `renderProjectFromData` da página 01; garante estado colapsado.
    - Funções: `renderProjectCard(projectData)`, `ensureCollapsed(projectName)`, `removeProjectCardById(projectId)`.
