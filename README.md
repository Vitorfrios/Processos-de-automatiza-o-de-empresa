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

## Documentação detalhada de pastas, arquivos e funções

### Pastas

- `codigo/`: núcleo do projeto.
  - `public/`: entrega a SPA e assets estáticos. Dentro dela ficam:
    - `pages/01_Create_Obra`, `02_Manager_Obras` e `03_Edit_data`: páginas HTML que carregam o front-end.
    - `scripts/01_Create_Obra`: SPA principal com subpastas `core/` (bootstrap, logger, app state), `main-folder/` (entrypoints), `data/` (adapters, builders, modules e utils), `features/` (cálculos e managers) e `ui/` (componentes visuais).
    - `scripts/02_Obras_manager`: módulo auxiliar para revisar obras salvas.
    - `static/01_Create_Obra` e `static/02_Obras_manager`: CSS, grid e assets visuais.
  - `servidor_modules/`: backend modular em Python dividido em `core/` (server_core, routes_core, sessions_core), `handlers/` (HTTP e rotas REST) e `utils/` (file utils, cache cleaner, browser monitor).
  - `json/`: bancos de dados simplificados (`dados.json`, `backup.json`, `sessions.json`) persistidos pelo backend.
  - `servidor.py`: servidor local usado em desenvolvimento.
  - `app.py`: wrapper Flask usado em produção (Render) para servir os assets estáticos.
- `arquivostxt/`: relatórios gerados pelos utilitários (status, diagnósticos de JS) e snapshots do código.
- `utilitarios py/`: scripts auxiliares para auditar pastas, consolidar funções JS/CSS ou gerar relatórios automáticos.
- `backup de arquivos/`: cópia da versão anterior do front-end para referência.
- `s/`: área de rascunhos do usuário.

### Arquivos

#### Front-end `codigo/public/scripts/01_Create_Obra`

- `main.js`: protege o botão “Nova Obra”, inicializa o logger inteligente, monitora o carregamento de módulos e dispara verificações finais após o `DOMContentLoaded`.
- `main-folder/system-init.js`: monta o bootstrap completo — `ShutdownManager`, carregamento de constantes, import dinâmico dos módulos e inicialização do cadastro inline de empresas.
- `main-folder/session-manager-main.js`: consulta `/api/session-obras`, restaura obras existentes e denuncia funções críticas ausentes.
- `main-folder/error-handler.js`: exibe overlays de servidor offline e delega avisos visuais usando o componente de status.
- `core/app.js`: consolida o `EventBus`, o `ApplicationState` global e o bootstrap automático da interface.
- `core/constants.js`: centraliza todas as constantes do sistema (cálculo, UI, storage, mensagens) com utilitários para consulta e validação.
- `core/logger.js`: intercepta `console.*`, aplica filtros e emojis nos logs e permite restaurar o console original.
- `core/shared-utils.js`: helpers globais para anexar módulos no `window`, reexecutar cálculos térmicos e sincronizar título ↔ ambiente.
- `data/adapters/obra-adapter.js`: expõe utilitários globais para editar dados de empresa diretamente no DOM e reusa os módulos do subfolder `obra-adapter-folder/`.
- `data/adapters/obra-adapter-folder/empresa-autocomplete.js`: input híbrido com cache de empresas, dropdown avançado, seleção por teclado e salvamento dos `data-*` da obra.
- `data/adapters/obra-adapter-folder/empresa-form-manager.js`: renderiza formulários/visualizações de empresa com formatação de datas e integração com o cadastro inline.
- `data/adapters/obra-adapter-folder/obra-data-loader.js`: busca obras da sessão, cria DOM sob demanda, sincroniza dados de empresa e expõe um modo de debug.
- `data/adapters/obra-adapter-folder/ui-helpers-obra-adapter.js`: utilidades de UI (detector de backspace, posicionamento de dropdown, geração de número de cliente, alertas).
- `data/adapters/session-adapter.js`: aplica regras de sessão (`sessionStorage`), mantém `GeralCount`, gerencia listas de obras removidas e normaliza o DOM quando a sessão é resetada.
- `data/adapters/shutdown-adapter.js`: implementa o fluxo de desligamento seguro (confirmação customizada, limpeza de sessão local/servidor e mensagens de status).
- `data/builders/empresa-cadastro-inline.js`: classe que injeta o pequeno CRM de empresas na página, controla tooltips e grava os campos nos `data-*` da obra.
- `data/builders/data-builders.js` e `ui-builders.js`: reexportam builders de dados/UI e anexam suas funções globais para compatibilidade com scripts antigos.
- `data/builders/data-builders-folder/*`: extraem dados estruturados (`obra-data-builder`, `room-data-extractors`, `machines-data-extractors`, `empresa-data-extractor`).
- `data/builders/ui-folder/*`: preenchem HTML já existente com dados (obras/projetos/salas, climatização, máquinas, sincronização de inputs).
- `data/modules/rooms.js`: fabrica o HTML completo das salas, garante IDs seguros, sincroniza paredes/títulos e expõe `addNewRoom`, `deleteRoom` etc.
- `data/modules/climatizacao.js`: reexporta os builders e sincronizadores de climatização.
- `data/modules/climatizate/climatizacao-builder.js`: gera seções de inputs/ganhos térmicos completos com IDs seguros.
- `data/modules/climatizate/climatizacao-sync.js`: listeners que sincronizam paredes, título ↔ ambiente e pressurização.
- `data/modules/configuracao.js`: seção de opções de instalação com checkboxes e IDs configurados por sala.
- `data/modules/machines/machines-core.js`: cria seções de máquinas, renderiza cards, carrega catálogos com cache e controla cálculos de preço.
- `data/modules/machines/capacity-calculator.js`: tabela de capacidade/backup com sincronização bidirecional com os inputs de climatização.
- `data/utils/id-generator.js`: gera IDs seguros para obra/projeto/sala/máquina e valida hierarquia.
- `data/utils/data-utils.js`: helpers para numeração sequencial, obtenção de nomes, parsing de preços e coleta de inputs para cálculos.
- `data/utils/core-utils.js`: utilidades genéricas (esperar elemento, `safeNumber`, debounce etc).
- `features/calculations/air-flow.js`: cálculo de vazão com base em pressurização e número de portas, além do orquestrador `calculateVazaoArAndThermalGains`.
- `features/calculations/thermal-gains.js`: cálculos de ganhos térmicos por superfície/pessoas/ar externo e atualização do painel de resultados.
- `features/calculations/calculations-core.js`: debounce dos cálculos, validações, helpers para aguardar constantes e versão imediata dos cálculos.
- `features/managers/obra-folder/*`: criação de obras, persistência no backend, tratamento do DOM, salvamento e utilidades.
- `features/managers/project-manager.js`: cria projetos e salas vazias, remove projetos e expõe funções globais.
- `ui/components/status.js`, `ui/components/modal/*`, `ui/components/edit.js`: componentes reutilizáveis para banners de status, modais/TOASTs e edição inline.
- `ui/helpers.js` e `ui/interface.js`: utilitários para minimizar/expandir blocos, métricas de preenchimento e handlers básicos de UI.
- `ui/components/status.js`: banner sticky utilizado em toda a página para mostrar avisos.

#### Front-end `codigo/public/scripts/02_Obras_manager`

- `main.js`: carrega constantes, inicializa o app simplificado e conecta com o backend para listar obras prontas.
- `core/app.js`: controla bootstrap, reinicialização e status do gerenciador.
- `core/constants.js`: cacheia constantes reutilizadas pelo módulo.
- `data/adapters/constants-adapter.js`: baixa/valida constantes antes de carregar o restante da interface.
- `data/adapters/obras-adapter.js`: manipula `backup.json` (load, normalização, remoção e gravação) para a visualização simplificada.
- `data/builders/obras-builder.js`: agrega estatísticas das obras, extrai metadados e aplica filtros.
- `features/managers/obras-manager.js`: aciona cálculos reais da página 1, sincroniza listeners, garante que as funções críticas existam e força recalculos quando necessário.
- `ui/components/cards.js`: pinta cards-resumo com dados importados (ex.: `powerMatch` aplica cores/ícones conforme vazão).
- `ui/components/modal/*`, `ui/components/search.js`, `ui/interface.js`: variação simplificada dos componentes de modal, busca e montagem da interface.
- `utils/global-stubs.js`: mocks para funções que não existem nesse contexto, permitindo navegação segura.

#### Backend Python

- `servidor.py`: servidor HTTP nativo usado em desenvolvimento; integra `ServerCore`, imprime diagnósticos e garante shutdown seguro.
- `app.py`: servidor Flask minimalista para deployment (com health check e bloqueio de shutdown).
- `codigo/servidor_modules/config.py`: configura caminhos e parâmetros globais usados pelos módulos do servidor.
- `codigo/servidor_modules/core/server_core.py`: abstrai criação de servidor HTTP, seleção de porta, threads auxiliares e desligamento.
- `codigo/servidor_modules/core/routes_core.py`: roteador REST que conecta endpoints (`/obras`, `/api/session-obras`, `/api/dados/empresas`) aos handlers.
- `codigo/servidor_modules/core/sessions_core.py`: gerencia `sessions.json` (CRUD de obras/projetos na sessão, limpeza e single-session enforcement).
- `codigo/servidor_modules/handlers/http_handler.py`: `BaseHTTPRequestHandler` customizado com CORS, logging reduzido e roteamento para `RouteHandler`.
- `codigo/servidor_modules/handlers/route_handler.py`: aplica regras de negócio (CRUD de obras, empresas, constantes, backup, projetos, shutdown).
- `codigo/servidor_modules/handlers/empresa_handler.py`: operações específicas de autocomplete de empresa (buscar, adicionar, obter número).
- `codigo/servidor_modules/utils/file_utils.py`: procura arquivos JSON e oferece helpers para carregar/salvar.
- `codigo/servidor_modules/utils/cache_cleaner.py`: remove `__pycache__` em background e permite limpeza à força no shutdown.
- `codigo/servidor_modules/utils/browser_monitor.py`: abre o navegador padrão quando o servidor sobe em modo local.
- `codigo/servidor_modules/utils/server_utils.py`: versões reutilizáveis de handlers de sinal, impressão de status e abertura de browser.

#### Outros artefatos

- `arquivostxt/status.txt`: status externo editado pelo usuário.
- `arquivostxt/relatorio_js_detalhado.txt`: relatório gerado pelos utilitários Python para mapear funções JS.
- `utilitarios py/*.py`: scripts de inspeção (pastas, juntar linhas, detalhamento de JS/CSS).
- `requirements.txt`, `runtime.txt`, `CNAME`, `rander.yml`: arquivos de infraestrutura/deployment.

### Funções (por arquivo)

#### Front-end `codigo/public/scripts/01_Create_Obra`

##### `main.js`

- `setupLoggerControl` (`codigo/public/scripts/01_Create_Obra/main.js:33`): adiciona `window.toggleLogger`/`window.getLoggerStatus`, permitindo ativar ou silenciar o logger inteligente a qualquer momento.
- `checkSystemLoaded` (`:76`): verifica se o banner de sucesso está no DOM, define `window.systemLoaded` e libera o botão “Nova Obra”.
- `updateAddObraButtonState` (`:93`): habilita ou bloqueia o botão principal ajustando `disabled`, `opacity`, `cursor` e tooltip conforme o estado global.
- `showSystemNotLoadedMessage` (`:120`): mostra um toast temporário quando o usuário tenta criar uma obra antes do carregamento completo.
- `setupAddObraButtonProtection` (`:164`): envolve `window.addNewObra` com uma guarda que cancela execuções enquanto `systemLoaded` for falso.
- `setupDirectButtonProtection` (`:192`): clona o botão no DOM, remove listeners legados e injeta um `click` guardado que só prossegue após o carregamento.
- `setupSystemLoadObserver` (`:226`): usa `MutationObserver`, `setInterval` e timeout para marcar o sistema como carregado assim que os widgets críticos aparecem.
- `finalSystemDebug` (`:265`): imprime no console um resumo do estado global, funções expostas e contagens de obras/projetos/salas.
- `verifyAndCreateBaseObra` (`:291`): compara `GeralCount` com o DOM e, caso tudo esteja vazio, orienta o usuário a criar a primeira obra manualmente.
- `handleInitializationError` (`:310`): trata falhas de fetch/servidor e, quando necessário, chama `showServerOfflineMessage`.
- `showSystemStatusMessage` (`:333`): usa `window.showSystemStatus` para avisar se obras foram restauradas ou se o sistema iniciou vazio.
- `verifyCriticalFunctions` (`:347`): confirma se as funções essenciais estão expostas no `window` e lista quais ficaram ausentes.
- `setupContinuousButtonMonitoring` (`:398`): revalida o botão e o wrapper de `addNewObra` por até 60 segundos para cobrir carregamentos tardios.

##### `main-folder/system-init.js`

- `ShutdownManager.init/disableAutoShutdown/createShutdownButton/shutdownManual` (`codigo/public/scripts/01_Create_Obra/main-folder/system-init.js:14`): classe que remove listeners padrão de `beforeunload`, injeta um botão ⚙️ no header e chama o adapter de shutdown com confirmação customizada.
- `loadSystemConstants` (`:69`): baixa `/constants`, valida campos críticos (`VARIAVEL_PD/PS`) e coloca o resultado em `window.systemConstants`.
- `loadAllModules` (`:105`): importa dinamicamente todos os módulos de UI, managers, builders, utils e cálculos e anexa as funções relevantes ao `window`.
- `initializeEmpresaCadastro` (`:284`): aguarda o DOM, instância `EmpresaCadastroInline` e loga quantos spans estavam disponíveis.
- `initializeSystem` (`:310`): orquestra shutdown manual, carregamento de constantes, módulos e cadastro de empresas, lançando exceções quando algo falha.

##### `main-folder/session-manager-main.js`

- `checkAndLoadExistingSession` (`:12`): consulta `/api/session-obras`, ativa `sessionStorage`, chama `loadObrasFromServer` e retorna `true` quando obras foram restauradas.
- `verifyCriticalFunctions` (`:58`): loga em `console.error` qualquer função crítica não exposta globalmente, ajudando no diagnóstico de bundles quebrados.

##### `main-folder/error-handler.js`

- `showServerOfflineMessage` (`:9`): renderiza um overlay fullscreen com contagem regressiva, instruções e botão de fechamento quando o backend cai.
- `showSystemWarning` (`:164`): delega uma mensagem de aviso/erro ao componente `showSystemStatus`, mantendo o console sincronizado.

##### `core/app.js`

- `EventBus.on/off/emit/clear` (`codigo/public/scripts/01_Create_Obra/core/app.js:10`): registram e disparam eventos globais (`app:*`, `state:*`), garantindo isolamento entre módulos.
- `ApplicationState.setObras/setProjetos/setSalas` (`:76`): atualizam listas internas e notificam interessados via `eventBus`.
- `ApplicationState.setCurrentObra/setCurrentProject/setCurrentRoom` (`:115`): trocam seleções ativas e propagam eventos `state:*-changed`.
- `ApplicationState.setSessionActive/setSystemConstants/getConstant/clear` (`:142`): gerenciam flags de sessão, armazenam constantes e limpam todo o estado quando necessário.
- `initializeEventBus` (`:194`): coloca o `eventBus` no `window` e registra o log de inicialização.
- `initializeState` (`:202`): expõe `appState` globalmente para compatibilidade com scripts legados.
- `initializeInterface` (`:210`): importa `ui/interface.js` on demand e chama `initializeInterface` se existir.
- `initializeCoreSystems` (`:228`): executa a sequência “event bus → state → interface”, logando erros no console e emitindo `app:core-ready`.
- `bootstrapApplication` (`:256`): impede bootstraps duplicados, chama `initializeCoreSystems` e marca `window.appInitialized`.
- `reinitializeApplication` (`:277`): limpa estado/eventos e roda novamente o bootstrap, útil em hot reload.
- `getAppStatus` (`:294`): retorna um snapshot com métricas básicas (`initialized`, `listeners`, contagens de obras/projetos/salas).

##### `core/constants.js`

- `getAllConstants` (`codigo/public/scripts/01_Create_Obra/core/constants.js:262`): agrega todos os blocos de constantes em um único objeto pronto para serialização.
- `hasConstant` (`:280`): verifica de maneira segura se uma chave específica existe dentro de uma categoria.
- `getConstant` (`:301`): retorna uma constante específica ou um fallback caso ela não esteja carregada.

##### `core/logger.js`

- `createSmartLogger` (`codigo/public/scripts/01_Create_Obra/core/logger.js:6`): instancia o logger inteligente, guarda ponteiros para o console original e expõe filtros por nível/padrão.
- `SmartLogger.initialize/interceptConsole/processLog/shouldSilence/shouldShow/getIcon` (`:21`): internas responsáveis por interceptar `console.*`, aplicar filtros de mensagens e adicionar ícones (❌/⚠️/ℹ️/🔍).

##### `core/shared-utils.js`

- `attachModuleToWindow` (`codigo/public/scripts/01_Create_Obra/core/shared-utils.js:2`): itera sobre um módulo e expõe automaticamente as funções públicas no `window`.
- `triggerCalculation` (`:16`): agenda a execução de `calculateVazaoArAndThermalGains` para um `roomId` válido, mesmo quando a função só existe no `window`.
- `syncTitleToAmbienteDirect` (`:40`): força o input “ambiente” a acompanhar o título da sala e dispara os cálculos após a sincronização.

##### `data/adapters/obra-adapter.js`

- `window.editarDadosEmpresa` (`codigo/public/scripts/01_Create_Obra/data/adapters/obra-adapter.js:11`): substitui a visualização de empresa pelo formulário editável correspondente à obra clicada.
- `window.atualizarDadosEmpresa` (`:34`): sincroniza inputs de empresa com os `data-*` da obra e atualiza tooltips conforme necessário.
- `window.ocultarFormularioEmpresa` (`:59`): remove o formulário ativo, restabelece o botão “Adicionar campos” e garante consistência do container.
- `window.ativarCadastroEmpresa` (`:92`): cria o formulário inline correto (com dados existentes ou vazios) e evita instâncias duplicadas por obra.

##### `data/adapters/obra-adapter-folder/empresa-autocomplete.js`

- `carregarEmpresasComCache` (`codigo/public/scripts/01_Create_Obra/data/adapters/obra-adapter-folder/empresa-autocomplete.js:19`): baixa `/api/dados/empresas`, guarda o resultado por 5 minutos e reutiliza se houver cache válido.
- `inicializarInputEmpresaHibrido` (`:55`): associa eventos de input/focus/blur/keydown ao campo de empresa e injeta o dropdown customizado.
- `processarInputEmpresa` (`:181`): aplica debounce e escolhe entre mostrar todas as empresas, filtrar ou esconder o dropdown conforme o termo digitado.
- `filtrarEmpresas` (`:228`): filtra a lista cacheada comparando sigla ou nome normalizado.
- `exibirSugestoes` (`:246`): desenha as opções do dropdown, configura data-attributes e listeners de clique.
- `exibirTodasEmpresas` (`:313`): fallback que lista todo o catálogo quando o usuário abre o campo vazio.
- `navegarDropdown` (`:371`): permite navegar com ↑/↓ mantendo o item ativo visível.
- `selecionarEmpresa` (`:420`): preenche o input, atualiza `data-*` da obra, salva campos extras e dispara avisos de autocomplete.
- `selecionarOpcaoAtiva` (`:497`): seleciona via teclado a opção destacada e aciona `selecionarEmpresa`.
- `limparCacheEmpresas` (`:512`): invalida o cache global quando novas empresas forem adicionadas.

##### `data/adapters/obra-adapter-folder/empresa-form-manager.js`

- `atualizarInterfaceComEmpresa` (`codigo/public/scripts/01_Create_Obra/data/adapters/obra-adapter-folder/empresa-form-manager.js:8`): injeta o resumo da empresa na barra da obra e atualiza tooltips via `EmpresaCadastroInline`.
- `atualizarCamposEmpresaForm` (`:32`): popula inputs e spans de um formulário existente com os dados da obra, formatando datas.
- `criarVisualizacaoEmpresa` (`:71`): monta o painel readonly da empresa com inputs editáveis apenas para campos críticos.
- `criarFormularioVazioEmpresa` (`:140`): gera o formulário editável padrão e inicializa o autocomplete após um pequeno delay.

##### `data/adapters/obra-adapter-folder/obra-data-loader.js`

- `removeBaseObraFromHTML` (`codigo/public/scripts/01_Create_Obra/data/adapters/obra-adapter-folder/obra-data-loader.js:7`): limpa todas as obras do container antes de um carregamento completo.
- `loadObrasFromServer` (`:18`): restaura as obras da sessão atual, buscando `/api/session-obras` e `/obras`, e monta cada obra individualmente.
- `loadSingleObra` (`:92`): garante que uma obra exista no DOM, invoca `createEmptyObra` se necessário e preenche com `populateObraData`.
- `prepararDadosEmpresaNaObra` (`:152`): copia campos de empresa da resposta para os `data-*` da obra e atualiza a interface visual.
- `obterDadosEmpresaDaObra` (`:219`): coleta os `data-*` relacionados à empresa para uma obra específica.
- `debugLoadObras` (`:252`): imprime diagnósticos (funções globais disponíveis e obras retornadas pelo servidor) para troubleshooting.

##### `data/adapters/obra-adapter-folder/ui-helpers-obra-adapter.js`

- `limparDadosSelecao` (`codigo/public/scripts/01_Create_Obra/data/adapters/obra-adapter-folder/ui-helpers-obra-adapter.js:6`): remove `dataset.sigla/nome` do input e reseta o número do cliente.
- `criarSistemaBackspaceDetector` (`:16`) e `inicializarDetectorBackspace` (`:61`): controlam flags globais de “usuário está apagando” para evitar autocomplete involuntário.
- `corrigirPosicaoDropdown` (`:113`): recalcula largura/posição dos dropdowns de empresa em scroll/resize.
- `limparNumeroCliente` (`:131`): esvazia o input de número do cliente quando o usuário limpa o campo.
- `mostrarAvisoAutocompletado` (`:142`): dispara um aviso visual informando se a seleção foi manual ou automática.
- `calcularNumeroClienteFinal` (`:176`): chama a API para obter o próximo número sequencial da empresa (com fallback local em `calcularNumeroLocal`).
- `calcularNumeroLocal` (`:207`): percorre `backup.json` para inferir o próximo número disponível quando a API não responde.
- `atualizarNumeroClienteInput` (`:256`): escreve o número calculado no input somente leitura do formulário.
- `formatarData` (`:266`): converte datas salvas (ISO ou Date) para `dd/mm/aaaa`, mantendo o formato se já estiver correto.

##### `data/adapters/session-adapter.js`

- `isSessionActive/setSessionActive` (`codigo/public/scripts/01_Create_Obra/data/adapters/session-adapter.js:12`): verificam/definem a flag `session_active` no `sessionStorage`, limpando dados locais quando desativada.
- `getSessionObras/setSessionObras/addObraToSession/removeObraFromSessionLocal` (`:31`): CRUD da lista de IDs de obras controlada pela sessão atual.
- `clearSessionObras` (`:73`): limpa a lista de obras e reseta o histórico de projetos removidos.
- `clearRenderedObras` (`:85`): percorre o DOM e remove apenas obras vazias/não salvas, preservando itens já persistidos no servidor.
- `isObraInSession` (`:147`): atalho para saber se uma obra específica faz parte da lista ativa.
- `initializeGeralCount/incrementGeralCount/decrementGeralCount/getGeralCount` (`:155`): inicializam e ajustam o contador global usado para nomes sequenciais.
- `resetDisplayLogic` (`:211`): limpa toda a UI e o armazenamento para iniciar uma nova sessão.
- `startNewSession/startSessionOnFirstSave` (`:224`): inicializam a sessão manualmente ou automaticamente quando a primeira obra é salva.
- `saveFirstObraIdOfSession` (`:247`): grava o ID original da primeira obra para referencia cruzada com o servidor.
- `addObraToRemovedList/getRemovedObrasList/isObraRemoved` (`:264`): mantém histórico de obras removidas e evita inconsistências na contagem.

##### `data/adapters/shutdown-adapter.js`

- `shutdownManual` (`codigo/public/scripts/01_Create_Obra/data/adapters/shutdown-adapter.js:8`): pede confirmação via modal customizado, limpa sessões (local e via `/api/sessions/shutdown`) e chama `/api/shutdown`.
- `ensureSingleActiveSession` (`:96`): aciona `/api/sessions/ensure-single` para forçar uma única sessão ativa no backend.
- `initializeSession` (`:118`): checa se há sessão ativa e, se sim, carrega as obras automaticamente ao abrir a página.
- `showShutdownMessage` (`:136`), `showFinalShutdownMessage` (`:211`) e `showFinalMessageWithManualClose` (`:257`): constroem overlays animados que informam o progresso do shutdown e instruem o usuário sobre o fechamento da janela.

##### `data/builders/empresa-cadastro-inline.js`

- `constructor/init/carregarDados` (`codigo/public/scripts/01_Create_Obra/data/builders/empresa-cadastro-inline.js:6`): inicializam o componente, carregam `dados.json`/`backup.json` e armazenam listas de empresas/obras.
- `vincularEventos` (`:47`): converte spans em botões e liga os handlers necessários para abrir o cadastro inline.
- `ativarCadastro` (`:72`): garante que apenas um formulário esteja ativo por vez e dispara `renderizarFormulario`.
- `renderizarFormulario` (`:94`): injeta o HTML retornado por `criarHTMLFormulario`, configura o estado dos campos e associa eventos.
- `configurarEstadoCampos/configurarCampoData/aplicarMascaraData/validarData` (`:114`): definem quais campos são editáveis, aplicam máscaras e validam datas digitadas.
- `criarHTMLFormulario` (`:275`): gera o markup reutilizado tanto no modo cadastro quanto edição/visualização.
- `vincularEventosFormulario` (`:350`): conecta listeners para autocomplete, botões de cancelar e fechamento automático do dropdown.
- `normalizarTermo/filtrarEmpresas/exibirSugestoes/ocultarSugestoes/tratarTecladoAutocomplete/navegarSugestoes/selecionarEmpresa` (`:373`): implementam o autocomplete interno do cadastro inline, reutilizando o catálogo pré-carregado.
- `calcularNumeroClienteFinal` (`:481`): aplica a mesma lógica de `carregarEmpresasComCache`, mas integrada ao builder inline (preenche `numeroClienteFinal` e preview de ID).
- `atualizarPreviewIdObra` (`:516`): mostra no formulário o ID gerado (`obra_SIGLA_numero`).
- `coletarDadosFormulario/validarDados` (`:548`): reúnem os valores digitados, rodam validações e exibem mensagens pelo `showSystemStatus`.
- `atualizarHeaderObra` (`:671`): atualiza os spans/tooltip do cabeçalho da obra com os dados recém-salvos.
- `inicializarTooltipJavaScript/criarTooltipEmpresa/formatarDataParaTooltip` (`:707`): constroem um tooltip customizado com animações e auto-close.
- `resetHeaderObra` (`:991`): volta o header para o estado default quando os dados foram limpos.
- `prepararDadosObra` (`:1012`): grava os dados estruturados no `data-*` da obra e dispara `atualizarHeaderObra`.
- `cancelarCadastro/ocultarFormulario/mostrarSpanOriginal` (`:1044`): limpam o formulário, removem o HTML e exibem novamente o botão inicial.
- `obterDadosPreparados` (`:1074`): retorna os dados armazenados na obra (usado pelo processo de salvamento).
- `formatarData` (`:1092`): helper interno para conversões de data dentro do builder.

##### `data/builders/data-builders-folder/room-data-extractors.js`

- `extractRoomData` (`codigo/public/scripts/01_Create_Obra/data/builders/data-builders-folder/room-data-extractors.js:7`): monta um objeto completo de sala (inputs, máquinas, capacidade, ganhos e configuração).
- `extractClimatizationInputs` (`:42`): lê todos os inputs/seletores de climatização, inclusive pressurização e campos dependentes.
- `extractThermalGainsData` (`:110`): captura os totais numéricos da tabela de ganhos térmicos via `document.querySelector`.
- `extractCapacityData` (`:166`): obtém valores da tabela de capacidade (TRs, solução, backup, folga).
- `extractConfigurationData` (`:218`): coleta checkboxes marcados na seção de configuração.

##### `data/builders/data-builders-folder/machines-data-extractors.js`

- `extractMachinesData` (`codigo/public/scripts/01_Create_Obra/data/builders/data-builders-folder/machines-data-extractors.js:6`): percorre `.climatization-machine` e chama o extractor individual para cada card.
- `extractClimatizationMachineData` (`:30`): lê selects (tipo/potência/tensão), preços base/total e opções extras marcadas.

##### `data/builders/data-builders-folder/obra-data-builder.js`

- `buildObraData` (`codigo/public/scripts/01_Create_Obra/data/builders/data-builders-folder/obra-data-builder.js:9`): garante que a obra existe no DOM, coleta dados de empresa e itera sobre todos os projetos.
- `buildProjectData` (`:102`): valida o elemento do projeto, gera um ID seguro e itera sobre as salas chamando `extractRoomData`.

##### `data/builders/data-builders-folder/empresa-data-extractor.js`

- `extractEmpresaData` (`codigo/public/scripts/01_Create_Obra/data/builders/data-builders-folder/empresa-data-extractor.js:8`): busca dados atualizados primeiro nos inputs ativos e depois nos `data-*` caso o formulário não esteja aberto.

##### `data/builders/ui-folder/machine-renderer.js`

- `findMachinesSection/findSectionByTitle` (`codigo/public/scripts/01_Create_Obra/data/builders/ui-folder/machine-renderer.js:6`): localizam seções no DOM pelo título para reutilizar espaços existentes.
- `ensureMachinesSection` (`:44`): garante que a seção de máquinas exista (ou cria uma nova via `buildMachinesSection`) antes de qualquer preenchimento.
- `fillMachinesData` (`:123`): remove máquinas anteriores, chama `addMachine` com retry e delega cada card para `populateMachineData`.
- `populateMachineData` (`:242`): define tipo/potência/tensão, marca opções extras, atualiza preços e dispara o cálculo final.

##### `data/builders/ui-folder/data-fillers.js`

- `setupRoomTitleChangeListener` (`codigo/public/scripts/01_Create_Obra/data/builders/ui-folder/data-fillers.js:7`): sincroniza o input “Ambiente” com o título da sala e dispara cálculos após alterações.
- `fillClimatizationInputs` (`:44`): popula todos os inputs de climatização (pressurização, paredes, setpoints) e dispara `calculateVazaoArAndThermalGains`.
- `fillThermalGainsData` (`:279`): escreve os valores de ganhos térmicos nos cards correspondentes e atualiza totais.
- `fillCapacityData` (`:322`): preenche a tabela de capacidade e sincroniza o select de backup.
- `fillConfigurationData` (`:355`): marca checkboxes da seção de configuração conforme os dados carregados.
- `ensureAllRoomSections` (`:380`): monta ou reconstrói as seções de climatização, máquinas e configuração para garantir que existam antes do preenchimento.

##### `data/builders/ui-folder/obra-renderer.js`

- `renderObraFromData` (`codigo/public/scripts/01_Create_Obra/data/builders/ui-folder/obra-renderer.js:5`): cria uma obra vazia e delega projetos para `renderProjectFromData`.
- `populateObraData` (`:20`): cria a obra caso não exista, garante que `createEmptyProject`/`createEmptyRoom` estejam disponíveis e preenche todos os projetos em sequência.

##### `data/builders/ui-folder/project-renderer.js`

- `renderProjectFromData` (`codigo/public/scripts/01_Create_Obra/data/builders/ui-folder/project-renderer.js:5`): cria um projeto vazio na obra correta e renderiza as salas vindas do JSON.
- `populateProjectData` (`:20`): remove salas antigas, chama `createEmptyRoom` + `populateRoomData` para cada sala persistida.

##### `data/builders/ui-folder/room-renderer.js`

- `renderRoomFromData` (`codigo/public/scripts/01_Create_Obra/data/builders/ui-folder/room-renderer.js:5`): cria a sala e chama `populateRoomInputs`.
- `populateRoomData` (`:20`): garante a existência das seções, atualiza o título, preenche inputs/ganhos/capacidade/configuração e agenda o preenchimento de máquinas com retries.

##### `data/modules/rooms.js`

- `buildRoomHTML` (`codigo/public/scripts/01_Create_Obra/data/modules/rooms.js:29`): gera o HTML completo da sala (cabeçalho, conteúdo e seções) com IDs seguros.
- `buildRoomHeader/buildRoomActions` (`:74`): produzem apenas o cabeçalho ou bloco de ações quando necessário.
- `loadMachinesPreloadModule` (`:106`): importa antecipadamente o módulo de máquinas para reduzir atrasos quando uma sala nova é criada.
- `createEmptyRoom` (`:126`): valida IDs, instancia seções, atualiza `GeralCount` e injeta a sala no projeto correto.
- `getRoomCountInProject` (`:212`): retorna quantas salas já existem em um projeto para ajudar na nomeação sequencial.
- `initializeRoomComponents` (`:229`): configura listeners de título, sincronia de paredes e valores padrão assim que a sala é adicionada.
- `setupBidirectionalTitleAmbienteSync` (`:275`): conecta o título editable e o input “ambiente” mantendo ambos sincronizados.
- `setupTitleChangeObserver` (`:320`): controla eventos `click`/`blur` nos títulos para disparar sincronia e recalcular estatísticas.
- `setupFirstInteractionWallSync/setupFirstInteractionWallPair` (`:365`): na primeira interação com cada par de paredes, copia o valor para o lado oposto quando ainda está vazio.
- `initializeDefaultValues` (`:441`): aplica valores default (como pressurização, altura e setpoints) em inputs recém-criados.
- `syncOppositeWallInitial/findAmbienteInput/verifyRoomSetupComplete` (`:464`): helpers para sincronizar paredes imediatamente, localizar inputs e confirmar se a sala possui todos os elementos.
- `safeInitializeFatorSeguranca` (`:569`): garante que o campo “Fator de Segurança” foi inicializado antes do uso.
- `insertRoomIntoProject` (`:590`): posiciona o HTML da sala no local correto (antes da seção “Adicionar sala”).
- `addNewRoom/addNewRoomToProject/addNewRoomLegacy` (`:620`): variações para criar salas via botões modernos ou antigos, respeitando possíveis parâmetros (obra/projeto/nome).
- `deleteRoom/deleteRoomLegacy` (`:684`): remove a sala do DOM, atualiza mensagens de vazio e garante que listeners sejam limpos.
- `fixExistingCapacityInputs` (`:734`): normaliza inputs de capacidade quando o HTML antigo é carregado.

##### `data/modules/configuracao.js`

- `buildConfigurationSection` (`codigo/public/scripts/01_Create_Obra/data/modules/configuracao.js:11`): cria a UI de checkboxes com IDs únicos por sala para cada opção de instalação.

##### `data/modules/climatizate/climatizacao-builder.js`

- `buildClimatizationSection` (`codigo/public/scripts/01_Create_Obra/data/modules/climatizate/climatizacao-builder.js:9`): monta a seção completa de climatização com tabela de inputs e bloco de ganhos térmicos.
- `buildClimatizationTable` (`:44`): cria a tabela principal com linhas geradas por `buildClimaRow`.
- `buildPressurizationRow` (`:186`): constrói o grupo de campos específicos de pressurização (radios, setpoint e contagem de portas).
- `buildClimaRow/buildClimaCell` (`:271`): helpers para montar pares de campos (labels, inputs, placeholders e atributos).
- `buildSelectInput/buildTextInput` (`:311`): geram selects e inputs numéricos/texto com atributos padronizados e placeholders.
- `buildThermalSummaryRow/buildResultRow` (`:378`): criam linhas de totais para a tabela de resultados.
- `buildThermalGainsSection` (`:447`): retorna toda a estrutura com tabelas de teto/parede/divisões/piso/pessoas/ar externo.
- `togglePressurizationFields` (`:754`): habilita/desabilita campos vinculados à pressurização e reseta valores quando necessário.

##### `data/modules/climatizate/climatizacao-sync.js`

- `window.handleWallInputSyncFirstInteraction/handleWallInputSync` (`codigo/public/scripts/01_Create_Obra/data/modules/climatizate/climatizacao-sync.js:18`): sincronizam automaticamente pares de paredes apenas na primeira interação para evitar valores inconsistentes.
- `window.syncTitleToAmbiente/window.syncAmbienteToTitle` (`:51`): refletem alterações de título↔input ambiente e disparam recalculagens.
- `window.setupCompleteRoomSync` (`:72`): executa `setupWallEventListenersDirect` e `setupTitleAmbienteSyncDirect`, preparando toda a sala recém-criada.
- `setupWallEventListenersDirect/setupTitleAmbienteSyncDirect` (`:85`): funções auxiliares usadas internamente para ligar eventos de input e iniciar sincronias iniciais.

##### `data/modules/machines/machines-core.js`

- `loadMachinesData` (`codigo/public/scripts/01_Create_Obra/data/modules/machines/machines-core.js:27`): busca `/machines` uma vez, guarda os dados em cache global e retorna uma lista pronta para consumo.
- `buildMachinesSection` (`:56`): gera o HTML da seção, incluindo a tabela de capacidade e o container onde os cards serão inseridos.
- `buildMachineHTML` (`:84`): retorna o markup completo de uma máquina (cabeçalho, selects, preços e opções).
- `buildMachineFromSavedData` (`:116`): reconstrói uma máquina a partir de dados salvos, aplicando seletores corretos.
- `buildFormGroup/buildSelect/buildOptionsHTML` (`:156`): helpers para montar grupos de campos, selects reusáveis e a grid de opções addon.
- `addMachine` (`:210`): adiciona uma máquina ao container de uma sala, cria IDs via `generateMachineId` e dispara listeners iniciais.
- `loadSavedMachines` (`:240`): recarrega o estado de máquinas previamente salvas (por exemplo, em `populateRoomData`).
- `updateMachineOptions` (`:280`): quando o tipo muda, atualiza os selects dependentes (potência/tensão) e reseta campos incompatíveis.
- `updateMachineUI/updateSelectUI/resetMachineFields` (`:307`): sincronizam selects com as opções do catálogo e limpam preços/textos quando necessário.
- `calculateMachinePrice` (`:360`): soma preço base + adicionais e atualiza tanto o card quanto o total da sala.
- `updateOptionValues` (`:409`): recalcula o valor de cada checkbox com base na potência escolhida.
- `calculateAllMachinesTotal/updateAllMachinesTotal/saveTotalToRoom` (`:447`): consolidam o total em R$ e gravam o valor na sala para uso posterior.
- `toggleMachineSection` (`:506`): minimiza/expande um card específico.
- `updateMachineTitle` (`:512`): sincroniza o input editável com o `data-machine-id`.
- `toggleOption/updateOptionSelection` (`:516`): tratam cliques nos checkboxes de opcionais.
- `handlePowerChange` (`:532`): quando a potência muda, força o recálculo dos opcionais e dos preços.
- `deleteMachine` (`:537`): remove o card e atualiza mensagens/total.
- `showEmptyMessage/removeEmptyMessage` (`:558`): exibem ou escondem a mensagem de “Nenhuma máquina” conforme a quantidade atual.

##### `data/modules/machines/capacity-calculator.js`

- `findRoomId` (`codigo/public/scripts/01_Create_Obra/data/modules/machines/capacity-calculator.js:11`): resolve o `roomId` baseado em qualquer elemento (select/input) clicado dentro da sala.
- `buildCapacityCalculationTable` (`:51`): retorna o HTML da tabela de capacidade e agenda a inicialização dos listeners.
- `initializeStaticCapacityTable` (`:115`): fallback para inicializar o widget em páginas legadas que só têm uma sala.
- `scheduleCapacityInit/initializeCapacitySystem` (`:127`): evitam inicializações duplicadas por sala e ligam listeners para fator de segurança/capacidade/backup.
- `applyFatorSeguranca` (`:163`): sincroniza o campo `fator-seguranca` com valores default ou salvos.
- `getThermalLoadTR` (`:176`): converte ganhos térmicos somados em TR para alimentar a tabela.
- `calculateCapacitySolution` (`:207`): calcula quantidade de unidades, backup e folga com base na carga e nos inputs do usuário.
- `getCapacityData/saveCapacityData/loadCapacityData/applyCapacityData` (`:245`): leem, persistem em `dataset` e reaplicam os dados de capacidade de cada sala.
- `applyBackupConfiguration` (`:435`): converte o tipo de backup (n, n+1, n+2) em contagem extra de unidades.
- `getBackupFromClimatization/getBackupFromClimaInputs` (`:451`): detectam o valor padrão do backup vindo dos inputs de climatização.
- `updateCapacityDisplay` (`:486`): atualiza os elementos da tabela (carga, solução, total, folga).
- `updateCargaEstimadaInput` (`:508`): escreve a carga estimada (TR) na célula correspondente.
- `updateBackupConfiguration` (`:545`): handler do select que sincroniza com os inputs de climatização e dispara o recálculo.
- `handleClimaInputBackupChange/handleClimaBackupChange/handleClimaInputBackupChangeFromEvent` (`:563`/`:633`/`:661`): respondem a alterações feitas no formulário de climatização, sincronizando o select da capacidade sem gerar loops.
- `syncBackupWithClimaInputs/syncCapacityTableBackup` (`:584`/`:611`): mantêm o valor de backup alinhado entre os dois módulos.

##### `data/utils/id-generator.js`

- `generateObraId/generateProjectId/generateRoomId` (`codigo/public/scripts/01_Create_Obra/data/utils/id-generator.js:8`): criam IDs seguros seguindo o padrão `obra_xx`, `obra_xx_proj_xx_seq` e `..._sala_xx_seq`.
- `getProjectCountInObra/getRoomCountInProjectFromId` (`:45`): contam elementos no DOM para auxiliar na geração de IDs sequenciais.
- `ensureStringId` (`:63`): converte qualquer entrada em string válida, rejeitando `undefined/null`.
- `isValidSecureId` (`:77`): checa se a string segue os padrões aceitos para obra/projeto/sala.
- `extractSequenceNumber/extractObraBaseFromId/areIdsFromSameObra` (`:107`): utilitários para comparar hierarquias e validar relacionamentos.
- `generateMachineId` (`:133`): cria IDs únicos (`machine_timestamp_random`) para cards de máquinas.
- `sanitizeId/hasValidSecureId` (`:141`): limpam caracteres inválidos e verificam se elementos DOM têm IDs corretos.
- `generateSessionId/validateIdHierarchy/getNextSequenceNumber` (`:155`): mantêm consistência de sessões e ajudam na numeração incremental.

##### `data/utils/data-utils.js`

- `getNextProjectNumber/getNextRoomNumber/getNextObraNumber` (`codigo/public/scripts/01_Create_Obra/data/utils/data-utils.js:20`): inspecionam títulos existentes para sugerir a próxima numeração amigável.
- `getRoomFullId/getObraName/getProjectName/getRoomName` (`:135`): retornam nomes e IDs completos a partir do DOM.
- `extractNumberFromText/getMachineName/parseMachinePrice` (`:248`): helpers para parsing de números, nomes de máquina e preços formatados.
- `debugThermalGainsElements/getThermalLoadTRForCalculations/validateTRElements` (`:300`): ferramentas de diagnóstico para os cálculos térmicos/capacidade.
- `collectClimatizationInputs` (`:390`): conversão centralizada dos inputs de climatização em um objeto pronto para cálculos.
- `findClimatizationSection` (`:455`): encontra a seção de climatização correspondente ao `roomId` fornecido.

##### `data/utils/core-utils.js`

- `waitForElement` (`codigo/public/scripts/01_Create_Obra/data/utils/core-utils.js:11`): aguarda até que um seletor seja encontrado ou lança timeout.
- `safeNumber` (`:27`): converte valores para `Number`, aplicando padrões e tratando vírgula como decimal.
- `updateElementText` (`:42`): altera `textContent` (com logs quando o elemento não existe).
- `generateUniqueId` (`:52`): cria IDs a partir de timestamp e random string.
- `isValidElement` (`:60`): valida se o elemento é um nó do DOM presente em `document.body`.
- `debounce` (`:68`): wrapper genérico para debouncing de funções.

##### `features/calculations/air-flow.js`

- `calculateDoorFlow` (`codigo/public/scripts/01_Create_Obra/features/calculations/air-flow.js:17`): calcula a contribuição de cada tipo de porta com base nas constantes de fluxo.
- `computeAirFlowRate` (`:33`): combina portas duplas/simples, pressão e fatores de segurança para retornar a vazão final.
- `calculateVazaoAr` (`:57`): orquestra o cálculo para um `roomId`, incluindo coleta de inputs e updates no DOM.
- `calculateVazaoArAndThermalGains` (`:88`): dispara vazão e, em seguida, os ganhos térmicos, respeitando a ordem correta.
- `updateFlowRateDisplay` (`:118`): escreve o resultado de vazão no elemento `#vazao-ar-room`.
- `validateAirFlowInputs/prepareAirFlowData/getAirFlowStats` (`:128`/`:150`/`:169`): valida dados de entrada, aplica conversões e retorna estatísticas para logs/dashboards.

##### `features/calculations/thermal-gains.js`

- `calculateCeilingGain/calculateWallGain/calculatePartitionGain/calculateFloorGain/calculateLightingGain/calculateDissipationGain/calculatePeopleGain` (`codigo/public/scripts/01_Create_Obra/features/calculations/thermal-gains.js:20`): funções individuais que tratam cada componente de ganho térmico com base nas constantes carregadas.
- `calculateExternalAirSensibleGain/calculateExternalAirLatentGain` (`:78`): calculam os ganhos de ar externo (sensível e latente) convertendo resultados para W/TR.
- `calculateTotals` (`:102`): soma todos os ganhos e converte o total para TR, retornando um objeto consolidado.
- `updateWallDisplay/updatePartitionDisplay` (`:134`): preenchem o DOM com os valores calculados para cada superfície.
- `updateThermalGainsDisplay` (`:150`): escreve totais e detalhes nas tabelas de ganhos.
- `findRoomContentThermal` (`:223`): helper para localizar a seção de ganhos de um `roomId`.
- `calculateUValues/calculateAuxiliaryVariables` (`:260`/`:293`): determinam valores de U/Fs com base no tipo de construção e inputs.
- `calculateThermalGains` (`:309`): fluxo completo que coleta dados, calcula todos os ganhos, atualiza o DOM e, se possível, dispara o recálculo de capacidade.

##### `features/calculations/calculations-core.js`

- `debouncedCalculation` (`codigo/public/scripts/01_Create_Obra/features/calculations/calculations-core.js:25`): aplica debounce por `roomId`, evitando chamadas redundantes de cálculo.
- `clearAllCalculationTimeouts` (`:40`): mata todos os timeouts pendentes (usado em unload ou reinicializações).
- `waitForSystemConstants/validateSystemConstants` (`:52`/`:70`): aguardam o carregamento das constantes e validam se todas as chaves necessárias estão presentes.
- `calculateVazaoArAndThermalGainsDebounced/calculateVazaoArAndThermalGainsImmediate` (`:134`/`:153`): versões com e sem debounce que importam os módulos dinamicamente.
- `validateCalculationData/prepareCalculationData` (`:178`/`:196`): verificam se os campos mínimos foram preenchidos e convertem valores antes dos cálculos.

##### `features/managers/obra-folder/obra-creator.js`

- `buildObraHTML` (`codigo/public/scripts/01_Create_Obra/features/managers/obra-folder/obra-creator.js:8`): retorna o HTML de uma obra completa incluindo header, conteúdo e botões.
- `buildObraActionsFooter` (`:41`): gera o rodapé com botões de salvar/atualizar e status.
- `insertObraIntoDOM` (`:57`): injeta o HTML no container principal e remove mensagens vazias.
- `createEmptyObra` (`:101`): cria a estrutura no DOM, garante IDs seguros e inicializa o cadastro de empresa.
- `addNewObra` (`:132`): função pública para criar uma nova obra (usada pelo botão principal).

##### `features/managers/obra-folder/obra-dom-manager.js`

- `findObraBlock` (`codigo/public/scripts/01_Create_Obra/features/managers/obra-folder/obra-dom-manager.js:7`): localiza a obra pelo ID e retorna o elemento correspondente.
- `findObraBlockWithRetry` (`:31`): repete a busca algumas vezes quando o DOM ainda está sendo montado.
- `updateObraButtonAfterSave` (`:57`): troca o botão “Salvar” por “Atualizar” após o primeiro POST bem-sucedido.

##### `features/managers/obra-folder/obra-persistence.js`

- `fetchObras` (`codigo/public/scripts/01_Create_Obra/features/managers/obra-folder/obra-persistence.js:9`): carrega `/obras` do backend, tratando erros e logs.
- `atualizarObra` (`:28`): envia PUT para `/obras/:id` com os dados construídos por `buildObraData`.
- `supportFrom_saveObra` (`:101`): rotina auxiliar que prepara o payload, chama POST/PUT e trata respostas.
- `deleteObraFromServer` (`:162`): remove uma obra do backend e retorna o sucesso para os handlers de UI.

##### `features/managers/obra-folder/obra-save-handler.js`

- `minimizarTogglesAposSalvamento` (`codigo/public/scripts/01_Create_Obra/features/managers/obra-folder/obra-save-handler.js:16`): recolhe seções e reduz ruído visual após um salvamento completo.
- `saveObra` (`:63`): pipeline principal de salvamento (valida dados, constrói payload, chama `supportFrom_saveObra` e atualiza a interface).
- `atualizarHeaderObraAposSalvamento` (`:239`): sincroniza informações do header (empresa, datas, status) depois de um POST/PUT bem-sucedido.

##### `features/managers/obra-folder/obra-utils.js`

- `deleteObra` (`codigo/public/scripts/01_Create_Obra/features/managers/obra-folder/obra-utils.js:8`): remove a obra do DOM e aciona a exclusão no backend.
- `verifyObraData` (`:18`): faz validações básicas antes do salvamento (existência de projetos/salas, dados obrigatórios).

##### `features/managers/project-manager.js`

- `buildProjectHTML` (`codigo/public/scripts/01_Create_Obra/features/managers/project-manager.js:19`): gera o HTML completo de um projeto (header, conteúdo e botão “Adicionar sala”).
- `createEmptyProject` (`:74`): adiciona o projeto ao DOM da obra certa e inicializa a primeira sala caso solicitado.
- `addNewProjectToObra` (`:133`): handler público usado para criar projetos via botão da UI.
- `deleteProject` (`:179`): remove o projeto e atualiza mensagens/contadores associados.

##### `ui/components/status.js`

- `showSystemStatus` (`codigo/public/scripts/01_Create_Obra/ui/components/status.js:22`): cria/adiciona um banner fixo no topo com mensagem e ícone adequados.
- `removeExistingStatusBanner/removeAllStatusBanners` (`:44`/`:55`): removem banners individuais ou todos os existentes.
- `createStatusBanner` (`:70`): constrói o elemento com classes, ícone e texto.
- `getStatusIcon/getDefaultDuration` (`:93`/`:109`): definem ícones e tempo de vida padrão por tipo (success/warning/error/info/loading).
- `insertStatusBanner/scheduleStatusBannerRemoval` (`:124`/`:146`): inserem o banner no DOM e agendam sua remoção automática.
- `showLoadingStatus/showTemporaryStatus` (`:162`/`:184`): versões convenientes para estados de loading ou mensagens temporárias.
- `hasActiveStatusBanner/getActiveBannersCount` (`:196`/`:204`): consultam o estado atual do componente.

##### `ui/helpers.js`

- `toggleElementVisibility/expandElement/collapseElement` (`codigo/public/scripts/01_Create_Obra/ui/helpers.js:18`): controlam classes `collapsed`/`hidden` e atualizam indicadores visuais.
- `calculateRoomCompletionStats` (`:59`): gera métricas simples (quantidade de inputs preenchidos) para mostrar progresso.
- `removeEmptyObraMessage/showEmptyObraMessageIfNeeded` (`:82`/`:97`): exibem/ocultam mensagens de lista vazia para obras.
- `removeEmptyProjectMessage/showEmptyProjectMessageIfNeeded` (`:121`/`:133`): mesmas funções porém no escopo de projetos.
- `isElementVisible/toggleAllElements` (`:155`/`:165`): testam visibilidade e alternam seções em lote.
- `collapseElementWithAnimation/expandElementWithAnimation` (`:188`/`:220`): adicionam animações CSS durante a expansão/colapso.

##### `ui/interface.js`

- `addNewProject` (`codigo/public/scripts/01_Create_Obra/ui/interface.js:88`): wrapper para `addNewProjectToObra` usado pelo botão “Novo projeto”.
- `toggleObra/toggleProject/toggleRoom` (`:109`/`:154`/`:199`): minimizam/expande blocos específicos atualizando as classes de estado.
- `toggleSection/toggleSubsection` (`:246`/`:263`): controlam colapsos em seções internas (climatização, máquinas, etc.).
- `downloadPDF/downloadWord` (`:286`/`:315`): placeholders para fluxos de exportação (mantidos por compatibilidade).
- `saveOrUpdateObra` (`:343`): chama `saveObra` ou `atualizarObra` conforme o botão disponível.

##### `ui/components/modal/modal.js`

- `showConfirmationModal` (`codigo/public/scripts/01_Create_Obra/ui/components/modal/modal.js:26`): cria um modal genérico com botões confirm/cancel, callbacks e títulos customizados.
- `closeConfirmationModal/closeConfirmationModalWithoutClearing` (`:77`/`:96`): fecham o modal atual com ou sem limpar o cache.
- `createToastContainer/showToast/startCountdown/animateAndRemove/sweepDanglingToasts/hideSpecificToast/hideToast` (`:111`/`:122`/`:219`/`:252`/`:264`/`:277`/`:307`): constróem e controlam o sistema de toasts usado para confirmações de exclusão.
- `undoDeletion/completeDeletion/completeDeletionImmediate` (`:320`/`:376`/`:384`): lidam com o fluxo “desfazer” após remover uma obra/projeto.
- `verificarObraNoServidor/confirmDeletion/getPendingDeletion` (`:424`/`:455`/`:507`): verificam se a obra ainda existe, disparam exclusão e mantêm um mapa das remoções pendentes.

##### `ui/components/modal/exit-modal.js`

- `createModalHTML/setupModalEvents/cleanup` (`codigo/public/scripts/01_Create_Obra/ui/components/modal/exit-modal.js:24`): constroem o modal específico de shutdown e seus listeners.
- `onConfirm/onCancel/onBackdropClick/onKeyDown` (`:89`/`:94`/`:99`/`:105`): tratam interações do usuário.
- `removeExistingModal/createShutdownModal/showShutdownConfirmationModal/showCustomShutdownModal` (`:126`/`:138`/`:156`/`:174`): controlam a criação e exibição das variações do modal de saída.

##### `ui/components/edit.js`

- `makeEditable` (`codigo/public/scripts/01_Create_Obra/ui/components/edit.js:25`): transforma títulos em inputs editáveis e dispara listeners.
- `enableEditing/selectElementContent/attachEditingEventListeners` (`:53`/`:72`/`:97`): tratam a ativação do modo edição, seleção de texto e binding de eventos.
- `handleKeydown/handleBlur` (`:103`/`:128`): salvam ou cancelam edições com Enter/Esc e ao perder o foco.
- `saveInlineEdit/applyNameChange` (`:144`/`:176`): validam e aplicam a alteração no DOM e nos `data-*`.
- `disableEditing/validateEditedText/showEditError/cancelInlineEdit` (`:231`/`:252`/`:289`/`:306`): encerram o modo edição, checando valores vazios/inválidos.
- `makeAllEditable/disableAllEditing/saveAllPendingEdits/hasPendingEdits/getEditStats/makeEditableCompatibility` (`:332`/`:348`/`:361`/`:375`/`:383`/`:408`): utilitários globais para controlar múltiplas edições e manter compatibilidade com scripts antigos.

#### Front-end `codigo/public/scripts/02_Obras_manager`

- `core/app.js`:
  - `bootstrapManagerApplication` (`:13`): inicia o mini-aplicativo somente uma vez, carregando constantes e interface.
  - `reinitializeManager` (`:77`): limpa estado/listeners do gerenciador e executa o bootstrap novamente.
  - `getManagerStatus` (`:94`): expõe informações básicas (estado da inicialização, quantidade de listeners) para diagnósticos.
- `data/adapters/constants-adapter.js`:
  - `loadSystemConstantsFromJSON` (`:9`): baixa `/constants`, guarda em cache e mapeia apenas os campos usados pelo manager.
  - `areConstantsLoaded/waitForConstants` (`:54`/`:61`): verificam/aguardam o carregamento dessas constantes.
  - `validateRequiredConstants` (`:78`): garante que campos necessários estejam presentes antes de liberar o restante da interface.
- `data/adapters/obras-adapter.js`:
  - `loadBackupObras` (`:13`): carrega `backup.json` para alimentar os cards do manager.
  - `normalizeBackup` (`:41`): homogeneíza campos (IDs, datas, status) independentemente da versão do arquivo.
  - `removeObraFromBackup` (`:79`): exclui uma obra específica do JSON e salva novamente.
  - `updateBackupFile` (`:162`): grava as alterações no arquivo persistido.
- `data/builders/obras-builder.js`:
  - `getObraStats` (`:11`): calcula métricas (salas, máquinas, totais) por obra carregada.
  - `formatObraStats` (`:38`): prepara os valores em formato amigável (texto, ícones, cores).
  - `extractObraMetadata` (`:61`): retorna metadados utilizados nos cards (empresa, data, status).
  - `applyFilters` (`:83`): aplica filtros simples (texto, status) antes de renderizar.
- `features/managers/obras-manager.js`:
  - `removeStubsAndLoadRealFunctions` (`:22`): substitui funções falsas por importações reais da página 1.
  - `loadRealCalculationFunctions/loadPage1Module/loadAllPage1Modules/loadAllPage1Functions` (`:46`/`:200`/`:214`/`:250`): importam módulos reais da página 1 para reutilizar cálculos/clonar comportamentos.
  - `updateVazaoDisplay/calculateVazaoArWithDisplay` (`:86`/`:103`): calculam vazão real e exibem o resultado nos cards.
  - `setupRealTimeUpdates/setupInputListeners/setupRoomListeners` (`:125`/`:158`/`:433`): ligam listeners em inputs para recalcular automaticamente.
  - `handleVazaoUpdate` (`:183`): atualiza o DOM quando os cálculos terminam.
  - `ensureRequiredFunctions` (`:330`): valida se as funções críticas do front principal foram carregadas antes de usá-las aqui.
  - `renderObra` (`:366`): cria os cards/listas referentes a cada obra carregada.
  - `forceRealVazaoCalculation` (`:413`): dispara manualmente uma recalculagem completa para uma sala.
- `ui/components/cards.js`:
  - `powerMatch` (`:201`): atribui classes/cores a cards com base no status da obra (vazão adequada, divergências, etc.).
- `ui/components/modal/exit-modal.js` e `ui/components/modal/modal.js`: implementam as mesmas funções descritas para a página principal, mas voltadas ao fluxo simplificado de shutdown/undo dentro do gerenciador.
- `ui/components/search.js`:
  - `applyFilters` (`:10`): filtra obras por texto/status.
  - `initializeSearchSystem` (`:26`): liga inputs de busca aos filtros em tempo real.
- `ui/interface.js`:
  - `initializeManagerInterface` (`:13`): desenha o layout do manager e dispara o carregamento das obras.
  - `addManagerHeader` (`:42`): cria o cabeçalho com botão de shutdown.
  - `setupProjectsContainer` (`:63`): injeta o container principal onde os cards ficarão.
  - `setupShutdownButton` (`:83`): conecta o botão de desligamento ao adapter compartilhado.
  - `clearManagerInterface` (`:108`): remove elementos existentes antes de uma recarga completa.
- `utils/global-stubs.js`:
  - `saveChanges` (`:339`): stub que alerta o usuário para cair na página 1 antes de tentar salvar, evitando operações não suportadas.

#### Backend Python

- `servidor.py`:
  - `diagnostico_completo` (`:22`): imprime no console a existência de diretórios/arquivos críticos antes de inicializar o servidor.
  - `active_session_after_delay`/`monitor` (`:80`): thread auxiliar que loga há quanto tempo o servidor está ativo.
  - `main` (`:115`): instancia `ServerCore`, configura porta, inicia threads e executa o loop principal, tratando exceções e shutdown.
- `app.py`:
  - `health_check`/`status` (`:6`): endpoints usados pelo Render para verificar se o serviço está saudável.
  - `index/serve_static` (`:17`/`:24`): servem os assets estáticos nas rotas básicas.
  - `shutdown` (`:34`): bloqueia tentativas de desligar o servidor em produção (retorna 403).
- `codigo/servidor_modules/core/server_core.py`:
  - `__init__/_find_project_root` (`:19`): configuram caminhos e flags iniciais.
  - `is_port_in_use/kill_process_on_port/find_available_port/setup_port` (`:28`/`:38`/`:75`/`:91`): verificam porta, matam processos conflitantes e retornam uma porta disponível.
  - `setup_signal_handlers/signal_handler` (`:117`/`:126`): registram handlers para SIGINT/SIGTERM.
  - `create_server` (`:131`): cria o `HTTPServer` com o handler desejado.
  - `print_server_info/open_browser/start_server_threads/run_server_loop` (`:143`/`:155`/`:170`/`:186`): imprimem informações, abrem navegador e controlam threads de monitoramento.
  - `shutdown_server_async/shutdown_task` (`:209`): desligam o servidor HTTP e executam limpezas (ex.: `CacheCleaner`).
- `codigo/servidor_modules/core/routes_core.py`:
  - Métodos `handle_*` (`:30` em diante): implementam cada rota do backend (`/obras`, `/api/session-obras`, `/api/dados/empresas`, `/api/shutdown`, `/constants`, etc.), delegando para os handlers adequados e convertendo respostas em JSON.
- `codigo/servidor_modules/core/sessions_core.py`:
  - `SessionsManager` (primeiros métodos): garante que `sessions.json` exista, adiciona/remove obras/projetos, força single-session e expõe utilidades (`get_session_obras`, `debug_sessions`).
  - A classe duplicada (compatibilidade legada) repete as mesmas assinaturas para manter APIs antigas (todos os métodos listados a partir da linha 370).
- `codigo/servidor_modules/handlers/empresa_handler.py`:
  - `obter_empresas` (`:22`): devolve a lista de empresas.
  - `adicionar_empresa` (`:33`): insere uma nova empresa em `dados.json`.
  - `buscar_empresa_por_termo` (`:63`): implementa o autocomplete filtrando por sigla/nome.
  - `obter_proximo_numero_cliente` (`:92`): retorna o próximo número sequencial por empresa.
- `codigo/servidor_modules/handlers/http_handler.py`:
  - `do_GET/do_POST/do_PUT/do_DELETE` (`:52`/`:110`/`:147`/`:165`): sobrescrevem o `BaseHTTPRequestHandler`, chamando o `RouteHandler` adequado e adicionando CORS/log reduzido.
  - `send_json_response/end_headers/do_OPTIONS/log_message` (`:192`/`:204`/`:211`/`:216`): utilidades para padronizar respostas JSON, tratar CORS e silenciar logs.
- `codigo/servidor_modules/handlers/route_handler.py`:
  - `handle_get_obras` etc. (`:30` em diante): ponto central que mapeia rotas HTTP para funções de `RoutesCore`, convertendo entradas/saídas e lidando com erros.
- `codigo/servidor_modules/utils/file_utils.py`:
  - `find_project_root` (`:13`): encontra a raiz do projeto para facilitar leituras.
  - `find_json_file` (`:28`): resolve caminhos relativos aos arquivos JSON.
  - `load_json_file/save_json_file` (`:56`/`:73`): wrappers de leitura/escrita com tratamento de erro.
- `codigo/servidor_modules/utils/cache_cleaner.py`:
  - `clean_pycache/clean_pycache_async/cleanup_task` (`:21`/`:82`/`:87`): limpam diretórios `__pycache__` de maneira síncrona ou assíncrona.
  - `clean_on_shutdown/force_cleanup` (`:110`/`:116`): gatilhos para executar a limpeza antes do desligamento.
- `codigo/servidor_modules/utils/browser_monitor.py`:
  - `monitorar_navegador` (`:8`): tenta abrir o navegador padrão apontando para a porta do servidor.
- `codigo/servidor_modules/utils/server_utils.py`:
  - Fornece implementações auxiliares de `setup_signal_handlers`, `print_server_info`, `open_browser` e `start_server_threads` para scripts externos.

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
