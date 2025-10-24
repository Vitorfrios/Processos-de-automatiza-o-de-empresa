# Documentação dos Arquivos e Funções do Sistema

Este documento lista os principais arquivos do projeto, o que cada um faz e as funções/handlers que expõem. A organização segue por camadas: Backend (Python), Frontend (HTML/JS/CSS) e Dados (JSON).

## Visão Geral

- Backend HTTP local em Python que serve a SPA e expõe APIs de projetos, sessões e dados.
- Frontend em JavaScript modular (ES Modules) para modelagem de projetos, salas, cálculos de vazão/ganhos térmicos e seleção de máquinas.
- Persistência em arquivos JSON (`codigo/json`): backup de projetos, dados do sistema e sessões.

---

## Backend (Python)

- `codigo/servidor.py`
  - O que faz: ponto de entrada do servidor. Configura sinais, escolhe porta disponível, cria servidor HTTP e inicia threads auxiliares (abrir navegador e monitorar navegador). Controla o loop principal.
  - Funções:
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
  - O que faz: gerencia arquivo de sessões (`codigo/json/sessions.json`) com estrutura simplificada: `{ "sessions": { "session_<hora>": { "projects": ["id", ...] }}}`.
  - Classe `SessionsManager` (métodos principais):
    - `ensure_sessions_file()`, `_initialize_sessions_file()`: garante arquivo vazio `{sessions:{}}`.
    - `get_current_session_id()`: id baseado em janelas horárias (epoch arredondado por hora).
    - `add_project_to_session(project_id)`: adiciona ID à lista da sessão atual.
    - `remove_project(project_id)`: remove ID da sessão atual.
    - `clear_session()`: limpa completamente todas as sessões (arquivo fica `{sessions:{}}`).
    - `force_clear_all_sessions()`: deleta arquivo e recria vazio.
    - `ensure_single_session()`: mantém somente a sessão atual com seus projetos.
    - `get_session_projects()`: retorna lista de IDs da sessão atual.
    - `_load_sessions_data()`, `_save_sessions_data(data)`: I/O do `sessions.json` com validação da estrutura.
    - `get_current_session()`: retorna somente a sessão atual no formato esperado por rotas.
  - Instância global: `sessions_manager`.

- `codigo/servidor_modules/http_handler.py`
  - O que faz: handler HTTP que serve arquivos estáticos e roteia endpoints de API para `routes.RouteHandler`.
  - Classe `UniversalHTTPRequestHandler`:
    - `__init__(...)`: define `project_root`, instancia `RouteHandler`, e configura diretório de serviço.
    - `do_GET()`: rotas GET: `/projetos|/projects`, `/constants|/system-constants`, `/dados`, `/backup`, `/machines`, `/health-check`, `/api/session-projects`, `/api/sessions/current`; fallback para arquivos estáticos.
    - `do_POST()`: rotas POST: `/api/sessions/shutdown`, `/api/shutdown`, `/projetos|/projects`, `/dados`, `/backup`, `/api/sessions/ensure-single`.
    - `do_PUT()`: rota PUT: `/projetos/:id`.
    - `do_DELETE()`: rota DELETE: `/api/sessions/remove-project/:id`.
    - `send_json_response(data, status=200)`: resposta JSON com CORS.
    - `end_headers()`: acrescenta CORS por padrão.
    - `do_OPTIONS()`: responde CORS preflight.

- `codigo/servidor_modules/routes.py`
  - O que faz: implementa a lógica de cada rota de API (projetos, dados, machines e sessões).
  - Classe `RouteHandler` (métodos principais):
    - Projetos/backup:
      - `handle_get_projetos(handler)`: lê `backup.json`, filtra projetos pertencentes à sessão atual e retorna lista.
      - `handle_post_projetos(handler)`: cria projeto com novo ID, salva em `backup.json` e associa ID à sessão atual.
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
      - `handle_get_session_projects(handler)`: retorna `{session_id, projects}` (IDs da sessão atual).
      - `handle_delete_sessions_remove_project(handler)`: remove um projeto específico da sessão.
      - `handle_post_sessions_shutdown(handler)`: limpa completamente todas as sessões (com verificação e fallback forçado).
      - `handle_post_sessions_ensure_single(handler)`: garante sessão única ativa e retorna resumo.
    - Encerramento do servidor:
      - `handle_shutdown(handler)`: retorna JSON com instrução para fechar janela e encerra processo Python.

- `codigo/servidor_modules/browser_monitor.py`
  - O que faz: monitora processos de navegadores via `psutil` e dispara encerramento rápido quando nenhum está em execução.
  - Funções:
    - `is_browser_connected(port)`: verifica existência de processos de navegador em execução.
    - `monitorar_navegador(port, httpd)`: laço que observa e aciona shutdown do servidor quando o navegador fecha.

- `codigo/servidor_modules/__init__.py`
  - O que faz: agrega e exporta submódulos do pacote `servidor_modules`.

---

## API Endpoints (Resumo)

- Projetos/Backup:
  - `GET /projetos` → lista projetos da sessão atual (filtrados de `backup.json`).
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
  - `DELETE /api/sessions/remove-project/:id` → remove id da sessão.
  - `POST /api/sessions/shutdown` → zera todas as sessões.
- Infra:
  - `POST /api/shutdown` → encerra servidor (cliente fecha a aba).
  - `GET /health-check` → status básico.

---

## Frontend (HTML/JS)

- `codigo/public/pages/01_CreateProjects.html`
  - O que faz: página inicial SPA. Define header, navegação, container de projetos e carrega `../scripts/page1/main.js` (ES Module).

- `codigo/public/scripts/page1/main.js`
  - O que faz: bootstrap do app no browser. Inicializa globais, carrega módulos, constantes e projetos; gerencia shutdown manual.
  - Classes/Funções:
    - `class ShutdownManager`: cria botão “Encerrar Servidor”, desativa auto-shutdown, envia comandos `/api/sessions/shutdown` e `/api/shutdown`.
    - `loadAllModules()`: importa dinamicamente módulos de UI, edição, dados, cálculos e utils, e expõe no `window`.
    - `loadSystemConstants()`: busca `/constants` e valida presença de chaves críticas.
    - `verifyAndCreateBaseProject()`: verificação leve de necessidade de projeto base (fallback).
    - `finalSystemDebug()`: logs de integridade pós-inicialização.
    - Listener `DOMContentLoaded`: orquestra sequência (shutdown → módulos → constantes → sessão → normalização → projetos → contadores → debug).

- `codigo/public/scripts/page1/data/server.js`
  - O que faz: camada de integração com backend + estado de sessão no `sessionStorage` + renderização de projetos salvos.
  - Sessão (chaves: `SESSION_ACTIVE_KEY`, `session_projects`):
    - `isSessionActive()`, `setSessionActive(active)`.
    - `getSessionProjects()`, `setSessionProjects(ids)`, `addProjectToSession(id)`, `removeProjectFromSessionLocal(id)`, `clearSessionProjects()`.
  - Renderização/contador global:
    - `clearRenderedProjects()`.
    - `initializeGeralCount()`, `incrementGeralCount()`, `decrementGeralCount()`, `getGeralCount()`.
  - Carregamento/normalização:
    - `removeBaseProjectFromHTML()`.
    - `loadProjectsFromServer()`: usa `/api/sessions/current` e `/projetos` para carregar só os projetos da sessão.
    - `normalizeAllProjectsOnServer()`: corrige IDs numéricos no backup via `PUT`.
  - Gestão de projeto removido:
    - `addProjectToRemovedList(id)`, `getRemovedProjectsList()`, `isProjectRemoved(id)`.
  - Botões/estado UI:
    - `updateProjectButton(projectName, hasId)`.
  - Sessão ativa única e ciclo de vida:
    - `startNewSession()`, `ensureSingleActiveSession()` (backend), `initializeSession()`.
  - Encerramento:
    - `shutdownManual()`: limpa sessões (backend), limpa UI e fecha aba (mensagem visual).
  - Exporta utilitários para outros módulos e anexa `window.shutdownManual`.

- `codigo/public/scripts/page1/data/projects.js`
  - O que faz: busca/normaliza projetos e salva/atualiza projetos no backend; também operações de UI relacionadas.
  - Funções principais:
    - Carregamento/IDs: `fetchProjects()`, `getNextProjectId()`, `initializeProjectCounter()`, `getNextProjectNumber()`, `normalizeProjectIds(project)`.
    - CRUD: `salvarProjeto(project)`, `atualizarProjeto(id, project)`.
    - Ação principal: `saveProject(projectName, event)` (decide entre salvar/atualizar, garante sessão única para novos, atualiza DOM e contadores).
    - UI: `collapseProjectAfterSave(...)`, `deleteProject(projectName)` (remove da sessão backend), `verifyProjectData`, `generateProjectVerificationReport`, `calculateRoomCompletionStats`, `collapseElement` (versão local).

- `codigo/public/scripts/page1/data/rooms.js`
  - O que faz: integra módulos de construção de sala, máquinas e configuração; inicializa inputs de capacidade com base em `systemConstants`.
  - Funções:
    - `initializeAllCapacityInputs()`: preenche valores padrão (ex.: `FATOR_SEGURANCA_CAPACIDADE`).
    - Reexporta: criação/remoção de salas e seções (vindo de `modules/projeto.js`, `modules/salas.js`, `modules/maquinas.js`, `modules/configuracao.js`).

- `codigo/public/scripts/page1/data/data-utils.js`
  - O que faz: extrai do DOM os dados completos de projeto/sala/máquinas para salvar no backend.
  - Funções principais:
    - Projeto/Sala: `buildProjectData(projectElOrId)`, `extractRoomData(roomEl, roomNumber)`, `getProjectName(el)`, `getRoomName(el)`.
    - Inputs/Seções: `extractClimatizationInputs(roomEl)`, `extractCapacityData(roomEl)`, `extractConfigurationData(roomEl)`, `extractThermalGainsData(roomEl)`.
    - Máquinas: `extractClimatizationMachineData(machineEl)`, `getMachineName(...)`, `parseMachinePrice(text)`.
    - Util: `safeNumber(value)`.

- `codigo/public/scripts/page1/utils/utils.js`
  - O que faz: utilitários simples de id.
  - Funções: `ensureStringId(id)`.

- `codigo/public/scripts/page1/ui/interface.js`
  - O que faz: UI da SPA (banners de status, expandir/recolher seções, criar projeto vazio, inserir no DOM, botões).
  - Funções principais:
    - Status: `showSystemStatus(message, type)`, `removeExistingStatusBanner()`, `createStatusBanner(...)`, `insertStatusBanner(...)`, `scheduleStatusBannerRemoval(...)`.
    - Toggle/Expand/Collapse: `toggleElementVisibility(...)`, `expandElement(...)`, `collapseElement(...)`, `toggleProject(...)`, `toggleRoom(...)`, `toggleSection(...)`, `toggleSubsection(...)`.
    - Projeto: `createEmptyProject(name, id)`, `buildProjectHTML(...)`, `buildProjectActionsFooter(...)`, `insertProjectIntoDOM(html)`, `addNewProject()`, `removeEmptyProjectMessage(...)`, `showEmptyProjectMessageIfNeeded(...)`.

- `codigo/public/scripts/page1/ui/edit.js`
  - O que faz: edição inline de títulos (projeto/sala) com contentEditable.
  - Funções: `makeEditable(el, type)`, `enableEditing(el)`, `selectElementContent(el)`, `attachEditingEventListeners(el, type)`, `saveInlineEdit(el, type)`, `disableEditing(el)`, `validateEditedText(newText, original, el)`, `cancelInlineEdit(el)`.

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

---

## Dados (JSON)

- `codigo/json/dados.json`
  - O que faz: dados operacionais do sistema usados no frontend/backend.
  - Estrutura relevante:
    - `constants`: constantes usadas nos cálculos (ex.: `VARIAVEL_PD`, `VARIAVEL_PS`, `AUX_*`, `deltaT_*`, etc.).
    - `machines`: lista de tipos de máquinas com `type`, `baseValues` por TR (ex.: `1TR`, `2TR`, `7,5TR`, ...), `options` (cada uma com `id`, `name`, `values` por TR) e `voltages` (`name` e `value`).

- `codigo/json/backup.json`
  - O que faz: armazenamento de projetos salvos (lista `projetos`), cada projeto com `id`, `nome`, `salas` e respectivos dados extraídos da UI (inputs, máquinas, capacidade, ganhos térmicos, configuração, timestamp).

- `codigo/json/sessions.json`
  - O que faz: estado de sessões do cliente (IDs de projetos visíveis por janela de sessão). Estrutura: `{ "sessions": { "session_<epoch_hora>": { "projects": ["1001", ...] } } }`.

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
- Se desejar, posso gerar um diagrama dos fluxos (sessão → projetos → cálculos → capacidade) ou uma visão de dependências entre módulos.
