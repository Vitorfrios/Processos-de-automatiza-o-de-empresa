# Sistema ESI - README Geral

## 1. Visao geral

Este repositorio concentra um sistema completo para:

- criar e editar obras;
- montar projetos e salas dentro de cada obra;
- calcular vazao de ar, ganhos termicos e capacidade;
- selecionar maquinas e componentes associados;
- gerenciar empresas, materiais, acessorios, dutos e tubos;
- persistir os dados em arquivos JSON;
- operar em modo `USER` e em modo `CLIENT`;
- gerar documentos Word a partir das obras salvas.

O projeto foi construido com:

- frontend em JavaScript puro, modularizado;
- backend Python com servidor HTTP proprio;
- persistencia baseada em JSON local;
- interface web com paginas separadas por funcao;
- adaptacao por configuracao, sem duplicar o sistema principal.

Hoje, a base principal do frontend esta em `codigo/public/scripts/01_Create_Obra`, e o backend esta em `codigo/servidor.py` mais `codigo/servidor_modules`.

## 2. Objetivo do sistema

O sistema existe para centralizar o fluxo operacional de orcamento e estruturacao tecnica de obras. Na pratica, ele permite:

- cadastrar uma obra vinculada a uma empresa;
- criar projetos dentro da obra;
- criar salas dentro de cada projeto;
- preencher dados tecnicos das salas;
- calcular automaticamente parametros de climatizacao;
- selecionar maquinas e extras;
- salvar tudo no backend;
- restaurar sessao de trabalho;
- editar a base do sistema em uma pagina administrativa;
- restringir o acesso do cliente a apenas sua propria empresa.

## 3. Modos de operacao

O sistema opera hoje em dois modos logicos.

### 3.1. Modo USER

Modo padrao de uso interno.

Caracteristicas:

- sem autenticacao obrigatoria no frontend principal;
- acesso completo a criacao de obras;
- acesso a filtros de obras;
- acesso ao link de edicao de dados;
- campo de empresa com autocomplete;
- botao de shutdown habilitado.

Pagina principal:

- `codigo/public/pages/01_Create_Obras.html`

### 3.2. Modo CLIENT

Modo restrito para clientes autenticados por usuario e token.

Caracteristicas:

- login obrigatorio;
- sessao salva em `localStorage`;
- empresa definida automaticamente pela sessao;
- empresa travada no formulario;
- filtros desativados;
- navegacao para editar dados removida;
- botao de shutdown escondido;
- carregamento de obras filtrado pela empresa autenticada.

Paginas:

- `codigo/public/pages/00_Client_Login.html`
- `codigo/public/pages/01_Create_Obras_Client.html`

Base tecnica do modo CLIENT:

- `codigo/public/scripts/01_Create_Obra/core/config.js`
- `codigo/public/scripts/01_Create_Obra/core/auth.js`
- `codigo/public/scripts/01_Create_Obra/main-folder/client-mode.js`

## 4. Estrutura geral do repositorio

```text
.
|-- README.md
|-- requirements.txt
|-- setup.py
|-- codigo/
|   |-- servidor.py
|   |-- json/
|   |   |-- dados.json
|   |   |-- backup.json
|   |   |-- sessions.json
|   |-- public/
|   |   |-- pages/
|   |   |-- scripts/
|   |   |-- static/
|   |   `-- images/
|   |-- servidor_modules/
|   |   |-- core/
|   |   |-- handlers/
|   |   |-- generators/
|   |   `-- utils/
|   `-- word_templates/
|-- arquivos/
|-- arquivostxt/
`-- utilitarios py/
```

### 4.1. Pastas mais importantes

- `codigo/public/pages`
  contem as paginas HTML de entrada do sistema.
- `codigo/public/scripts/01_Create_Obra`
  contem o modulo principal da aplicacao.
- `codigo/public/scripts/03_Edit_data`
  contem a interface administrativa para editar os dados estruturais do sistema.
- `codigo/public/scripts/02_Client`
  hoje esta reservada estruturalmente, mas o modo CLIENT atual reutiliza o codigo de `01_Create_Obra`.
- `codigo/public/static`
  contem CSS e assets visuais.
- `codigo/json`
  contem a persistencia principal do sistema.
- `codigo/servidor_modules`
  contem o backend modular.
- `codigo/word_templates`
  contem os templates DOCX usados na geracao de documentos.

## 5. Paginas do sistema

### 5.1. `00_Login.html`

Pagina de login geral/legada. Existe no projeto, mas o modo CLIENT hoje usa a pagina especifica `00_Client_Login.html`.

### 5.2. `00_Client_Login.html`

Tela de autenticacao do cliente.

Responsabilidades:

- receber `usuario` e `token`;
- validar credenciais contra as empresas cadastradas;
- bloquear acesso se o token estiver expirado;
- salvar a sessao client;
- redirecionar para `01_Create_Obras_Client.html`.

### 5.3. `01_Create_Obras.html`

Pagina principal do modo USER.

Responsabilidades:

- carregar a SPA principal;
- permitir criacao de obras;
- permitir filtros;
- permitir navegacao para `03_Edit_data.html`;
- restaurar sessao de obras em andamento.

### 5.4. `01_Create_Obras_Client.html`

Versao CLIENT da pagina de criacao de obras.

Responsabilidades:

- reutilizar o mesmo sistema principal da pagina USER;
- ativar o modo `client` via `window.__APP_CONFIG_OVERRIDES__`;
- esconder recursos nao permitidos;
- trabalhar sempre no contexto da empresa autenticada;
- nao exibir navegacao de editar dados.

### 5.5. `03_Edit_data.html`

Painel administrativo de edicao dos dados do sistema.

Responsabilidades:

- editar constantes;
- editar maquinas;
- editar materiais;
- editar empresas;
- editar acessorios;
- editar dutos;
- editar tubos;
- editar JSON bruto.

## 6. Arquitetura do frontend principal

O frontend principal esta em `codigo/public/scripts/01_Create_Obra` e segue uma divisao por responsabilidade.

### 6.1. `core/`

Camada de base da aplicacao.

Arquivos importantes:

- `config.js`
  centraliza `APP_CONFIG`, flags de feature, contexto da empresa e definicao de modo.
- `auth.js`
  implementa autenticacao do CLIENT, validacao de token, sessao e redirecionamento.
- `shared-utils.js`
  contem helpers compartilhados; inclui a compatibilidade temporaria para normalizar empresa do formato legado para o formato atual.
- `logger.js`
  controla o logger do frontend.

### 6.2. `main-folder/`

Orquestracao de bootstrap.

Arquivos importantes:

- `system-init.js`
  carrega constantes, modulos, sistema de empresa e filtros; no CLIENT tambem valida acesso e aplica restricoes.
- `session-manager-main.js`
  restaura obras da sessao ativa.
- `client-mode.js`
  aplica restricoes de UI e trava empresa no CLIENT.
- `filter-init.js`
  inicializa o sistema de filtros.
- `error-handler.js`
  trata erros de inicializacao e indisponibilidade do servidor.

### 6.3. `data/`

Camada de dados e integracao.

Subareas importantes:

- `adapters/`
  integra frontend com backend e com persistencia.
- `builders/`
  monta e extrai estruturas de obra, projeto e sala.
- `empresa-system/`
  contem toda a logica de empresa, formulario, autocomplete e extracao.
- `modules/`
  contem os modulos funcionais de salas, climatizacao, maquinas e outros blocos da obra.
- `utils/`
  utilitarios tecnicos de apoio.

### 6.4. `features/`

Camada de comportamento de negocio da tela.

Subpastas:

- `calculations/`
  calculos de vazao, ganhos termicos e capacidade.
- `filters/`
  filtro de obras na interface.
- `managers/`
  cria, remove, salva e atualiza obras, projetos e salas.

### 6.5. `ui/`

Camada de interface e componentes.

Responsabilidades:

- expandir e recolher blocos;
- edicao inline;
- banners de status;
- modais;
- integracao com download de arquivos.

## 7. Fluxo de bootstrap da pagina principal

O fluxo principal do frontend acontece assim:

1. `main.js` e carregado pela pagina HTML.
2. O logger e inicializado.
3. No modo CLIENT, `bootstrapClientMode()` valida a sessao antes de seguir.
4. `initializeSystem()` em `system-init.js`:
   - valida acesso client;
   - aplica restricoes de interface;
   - carrega constantes via backend;
   - importa os modulos dinamicamente;
   - inicializa o sistema de empresa;
   - inicializa filtros somente se a feature estiver habilitada.
5. O gerenciador de sessao consulta `/api/session-obras`.
6. `loadObrasFromServer()` busca `/obras`.
7. As obras retornadas sao renderizadas no DOM.

## 8. Sistema de empresas

O sistema de empresas e uma parte central do projeto, porque influencia:

- titulo da obra;
- cabecalho visual;
- numeracao de cliente;
- autocomplete;
- filtro de contexto no CLIENT;
- autenticacao de clientes.

### 8.1. Formato antigo

Historicamente o sistema usava empresas no formato:

```json
{ "ACT": "ACTEMIUM" }
```

### 8.2. Formato atual

O formato oficial atual e:

```json
{
  "codigo": "ACT",
  "nome": "ACTEMIUM",
  "credenciais": {
    "usuario": "awffr",
    "token": "fefefeeef",
    "data_criacao": "2026-03-10T09:30:00Z",
    "tempoUso": 90
  }
}
```

### 8.3. Compatibilidade temporaria

Durante a migracao, o frontend usa `normalizeEmpresa()` e `normalizeEmpresas()` em:

- `codigo/public/scripts/01_Create_Obra/core/shared-utils.js`

Isso permite:

- aceitar temporariamente dados no formato antigo;
- normalizar para `{ codigo, nome, credenciais }`;
- evitar quebra imediata durante a transicao.

### 8.4. Sistema de empresa no frontend

Arquivos centrais:

- `empresa-core.js`
- `empresa-autocomplete.js`
- `empresa-form-manager.js`
- `empresa-data-extractor.js`
- `empresa-ui-helpers.js`

Responsabilidades do bloco de empresa:

- carregar lista de empresas;
- exibir autocomplete;
- preencher `empresaSigla`, `empresaCodigo` e `empresaNome`;
- calcular numero sequencial do cliente;
- atualizar header visual da obra;
- manter campos sincronizados com o dataset da obra;
- no CLIENT, bloquear edicao e esconder acoes nao permitidas.

## 9. Sistema de autenticacao CLIENT

O modo CLIENT nao reimplementa a pagina inteira. Ele reaproveita o sistema principal com configuracao.

### 9.1. Configuracao global

`config.js` define `APP_CONFIG`.

Campos relevantes:

```js
{
  mode: "user" | "client",
  empresaAtual: null | "ACT",
  empresaContext: null | { codigo, nome, usuario, expiraEm },
  auth: {
    required: boolean,
    storageKey: "esi_client_session",
    loginPage: "./00_Client_Login.html",
    redirectAfterLogin: "./01_Create_Obras_Client.html"
  },
  features: {
    empresaAutocomplete: boolean,
    filtros: boolean,
    editDataNavigation: boolean,
    shutdown: boolean
  },
  ui: {
    lockEmpresaField: boolean
  }
}
```

### 9.2. Credenciais usadas

O login do cliente usa:

- `credenciais.usuario`;
- `credenciais.token`.

Empresas com `credenciais: null` sao ignoradas para autenticacao.

### 9.3. Expiracao de token

A expiracao e calculada por:

- `data_criacao + tempoUso (dias)`

O resultado e salvo em `expiraEm`.

### 9.4. Sessao client

Formato salvo no `localStorage`:

```json
{
  "empresaCodigo": "ACT",
  "empresaNome": "ACTEMIUM",
  "usuario": "awffr",
  "token": "fefefeeef",
  "expiraEm": "2026-06-08T09:30:00.000Z"
}
```

### 9.5. Funcoes principais do auth

Em `core/auth.js`:

- `loginClient()`;
- `validateToken()`;
- `getClientSession()`;
- `ensureClientAccess()`;
- `logoutClient()`;
- `redirectToClientApp()`.

### 9.6. Restricoes aplicadas no CLIENT

O arquivo `client-mode.js` cuida de:

- esconder link de editar dados;
- esconder botao de shutdown;
- esconder bloco visual de filtros;
- atualizar titulo da pagina com o nome da empresa;
- travar o campo de empresa;
- esconder botoes de cadastro/visualizacao de empresa;
- impedir carregamento de obras de outras empresas.

## 10. Filtros e controle por empresa

O sistema de filtros continua existindo no codigo principal, mas no CLIENT ele e desativado por feature flag.

Pontos relevantes:

- `features.filtros = false` no CLIENT;
- `initializeSystem()` nao inicializa os filtros quando a feature esta desligada;
- `main.js` tambem respeita essa flag antes de subir a camada de filtro;
- `obra-data-loader.js` usa `matchesEmpresaContext()` para filtrar obras no CLIENT.

Isso garante duas coisas:

- o modo USER continua funcionando igual;
- o CLIENT nao ve nem carrega obras fora do seu contexto.

## 11. Sistema de obras, projetos e salas

O dominio principal do projeto e a hierarquia:

- obra;
- projeto;
- sala.

### 11.1. Obra

A obra e o container raiz.

Ela guarda, entre outros:

- id;
- nome;
- empresaSigla e empresaCodigo;
- empresaNome;
- numeroClienteFinal;
- clienteFinal;
- codigoCliente;
- dataCadastro;
- orcamentistaResponsavel;
- projetos.

### 11.2. Projeto

Cada obra pode ter varios projetos.

O projeto organiza:

- nome;
- id;
- lista de salas.

### 11.3. Sala

A sala concentra os dados tecnicos:

- ambiente;
- medidas e areas;
- pressurizacao;
- pessoas;
- dissipacao;
- dados termicos;
- maquinas;
- configuracao;
- acessorios;
- dutos;
- tubos.

## 12. Calculos tecnicos

Os calculos ficam principalmente em:

- `features/calculations/air-flow.js`;
- `features/calculations/thermal-gains.js`;
- `features/calculations/calculations-core.js`;
- `data/modules/machines/capacity-calculator.js`.

Os calculos incluem:

- vazao de ar;
- ganhos por superficies;
- ganhos por pessoas;
- ganhos por ar externo;
- capacidade total;
- configuracao de backup;
- combinacao de maquinas.

## 13. Editor de dados do sistema

O modulo administrativo esta em `codigo/public/scripts/03_Edit_data`.

### 13.1. Objetivo

Permitir manutencao do banco de configuracao sem editar JSON manualmente.

### 13.2. Estrutura

Arquivos principais:

- `main.js`;
- `loader.js`;
- `config/api.js`;
- `config/state.js`;
- `config/ui.js`;
- `core/constants.js`;
- `core/machines.js`;
- `core/materials.js`;
- `core/empresas.js`;
- `core/acessorios.js`;
- `core/dutos.js`;
- `core/tubos.js`;
- `editorJson/json-editor.js`.

### 13.3. O que pode ser editado

- constantes de calculo;
- catalogo de maquinas;
- materiais;
- empresas;
- banco de acessorios;
- dutos;
- tubos;
- JSON bruto completo.

### 13.4. Observacao sobre empresas

O editor ja foi adaptado para o novo formato de empresa estruturada.

Ao adicionar empresas novas, ele grava:

```json
{
  "codigo": "ABC",
  "nome": "EMPRESA ABC",
  "credenciais": null
}
```

## 14. Backend Python

O backend local e iniciado por:

- `codigo/servidor.py`

Ele usa modulos de apoio em:

- `codigo/servidor_modules/core`
- `codigo/servidor_modules/handlers`
- `codigo/servidor_modules/utils`

### 14.1. Responsabilidades do backend

- servir arquivos estaticos;
- expor APIs REST do sistema;
- ler e gravar `dados.json`;
- ler e gravar `backup.json`;
- ler e gravar `sessions.json`;
- responder buscas de empresa;
- persistir obras;
- gerenciar sessao ativa;
- gerar documentos Word.

### 14.2. Modulos importantes

- `core/routes_core.py`
  regras principais de CRUD e sessao.
- `core/sessions_core.py`
  controle de `sessions.json`.
- `handlers/http_handler.py`
  roteamento HTTP e mapeamento de endpoints.
- `handlers/route_handler.py`
  handlers operacionais do sistema.
- `handlers/empresa_handler.py`
  gestao de empresas, busca, numero de cliente e normalizacao.
- `handlers/word_handler.py`
  geracao e download de documentos Word.

## 15. Persistencia e arquivos JSON

### 15.1. `dados.json`

E o banco estrutural do sistema.

Contem, entre outros:

- `constants`;
- `machines`;
- `materials`;
- `empresas`;
- `banco_acessorios`;
- `dutos`;
- `tubos`.

Uso tipico:

- constantes para os calculos;
- catalogo de maquinas;
- base de empresas;
- catalogos auxiliares do sistema.

### 15.2. `backup.json`

E o banco operacional de obras salvas.

Contem:

- lista de obras completas;
- toda a hierarquia obra > projeto > sala;
- dados calculados e dados de maquina.

### 15.3. `sessions.json`

Guarda a sessao ativa de trabalho.

Uso:

- definir quais obras estao carregadas na sessao atual;
- restaurar o ambiente da pagina no reload;
- limpar sessao no shutdown.

Exemplo simplificado:

```json
{
  "sessions": {
    "session_active": {
      "obras": ["obra_x", "obra_y"]
    }
  }
}
```

## 16. Endpoints principais

O backend tem muitas rotas. Abaixo estao as mais importantes para operacao do sistema.

### 16.1. Sessao

- `GET /api/session-obras`
- `GET /api/sessions/current`
- `POST /api/sessions/add-obra`
- `DELETE /api/sessions/remove-obra/{id}`
- `POST /api/sessions/shutdown`
- `POST /api/sessions/ensure-single`

### 16.2. Obras

- `GET /obras`
- `GET /obras/{id}`
- `POST /obras`
- `PUT /obras/{id}`
- `DELETE /obras/{id}`
- `GET /api/backup-completo`

### 16.3. Dados estruturais

- `GET /constants`
- `GET /machines`
- `GET /dados`
- `POST /dados`
- `GET /backup`
- `POST /backup`
- `GET /api/system-data`
- `POST /api/system-data/save`
- `POST /api/system/apply-json`

### 16.4. Empresas

- `GET /api/dados/empresas`
- `GET /api/dados/empresas/buscar/{termo}`
- `GET /api/dados/empresas/numero/{sigla}`
- `POST /api/dados/empresas`
- `POST /api/dados/empresas/auto`
- `GET /api/empresas/all`
- `POST /api/empresas/save`
- `DELETE /api/empresas/{index}`

### 16.5. Catalogos auxiliares

- acessorios:
  - `GET /api/acessorios`
  - `GET /api/acessorios/types`
  - `GET /api/acessorios/dimensoes`
  - `GET /api/acessorios/type/{type}`
  - `GET /api/acessorios/search`
  - `POST /api/acessorios/add`
  - `POST /api/acessorios/update`
  - `POST /api/acessorios/delete`
- dutos:
  - `GET /api/dutos`
  - `GET /api/dutos/types`
  - `GET /api/dutos/opcionais`
  - `GET /api/dutos/type/{type}`
  - `GET /api/dutos/search`
  - `POST /api/dutos/add`
  - `POST /api/dutos/update`
  - `POST /api/dutos/delete`
- tubos:
  - `GET /api/tubos`
  - `GET /api/tubos/polegadas`
  - `GET /api/tubos/polegada/{polegada}`
  - `GET /api/tubos/search`
  - `POST /api/tubos/add`
  - `POST /api/tubos/update`
  - `POST /api/tubos/delete`

### 16.6. Word

- `GET /api/word/models`
- `GET /api/word/templates`
- `POST /api/word/generate/proposta-comercial`
- `POST /api/word/generate/proposta-tecnica`
- `POST /api/word/generate/ambos`
- `GET /api/word/download`

### 16.7. Sistema

- `GET /api/server/uptime`
- `POST /api/reload-page`
- `POST /api/shutdown`

## 17. Fluxo operacional completo

### 17.1. Fluxo USER

1. Abrir `01_Create_Obras.html`.
2. O frontend carrega constantes e modulos.
3. O sistema tenta restaurar a sessao.
4. O usuario cria uma nova obra.
5. O bloco de empresa permite selecionar ou cadastrar empresa.
6. Projetos e salas sao criados.
7. Os calculos sao executados conforme o preenchimento.
8. A obra e salva no backend.
9. O id da obra entra em `sessions.json`.
10. O backup completo vai para `backup.json`.

### 17.2. Fluxo CLIENT

1. Abrir `00_Client_Login.html`.
2. Informar `usuario` e `token`.
3. `auth.js` carrega empresas e valida credenciais.
4. O token e validado por expiracao.
5. A sessao client e gravada no `localStorage`.
6. O usuario e redirecionado para `01_Create_Obras_Client.html`.
7. O bootstrap aplica restricoes de interface.
8. As obras carregadas sao filtradas pela empresa autenticada.
9. O campo de empresa nasce preenchido e bloqueado.

### 17.3. Fluxo de edicao de dados

1. Abrir `03_Edit_data.html`.
2. Carregar os dados estruturais.
3. Editar o bloco desejado.
4. Validar as alteracoes.
5. Salvar pela API de dados.

## 18. Convencoes importantes do projeto

### 18.1. Reutilizacao acima de duplicacao

O projeto foi evoluido com a premissa de:

- nao duplicar sistema para CLIENT;
- nao quebrar comportamento do USER;
- desligar recursos por configuracao;
- manter modulos existentes e reaproveitados.

### 18.2. Empresa como contexto de negocio

Os acessos modernos devem priorizar:

- `empresa.codigo`;
- `empresa.nome`;
- `empresa.credenciais`.

Em vez de:

- `Object.keys(empresa)[0]`;
- `Object.values(empresa)[0]`;
- `empresa["SIGLA"]`.

### 18.3. Compatibilidade de migracao

Enquanto ainda existirem dados legados, a regra e:

- normalizar na entrada;
- trabalhar internamente no formato novo;
- evitar espalhar logica legado-novo pelo sistema.

## 19. Como rodar localmente

### 19.1. Requisitos

- Python 3.11 ou superior;
- dependencias instaladas via `requirements.txt`.

### 19.2. Passos

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python codigo/servidor.py
```

Depois, abra no navegador:

- `http://127.0.0.1:8000/codigo/public/pages/01_Create_Obras.html`

Ou, para CLIENT:

- `http://127.0.0.1:8000/codigo/public/pages/00_Client_Login.html`

## 20. Templates Word

O sistema possui templates em:

- `codigo/word_templates/proposta_comercial_template.docx`
- `codigo/word_templates/proposta_tecnica_template.docx`

Eles sao usados pelas rotas de geracao de Word para produzir documentos a partir dos dados das obras.

## 21. Troubleshooting

### 21.1. Frontend nao carrega

Verifique:

- se `python codigo/servidor.py` esta rodando;
- se `/constants` responde;
- se `dados.json` esta valido.

### 21.2. Sessao ficou presa

Verifique:

- `codigo/json/sessions.json`;
- endpoint `POST /api/sessions/shutdown`.

### 21.3. Cliente nao consegue entrar

Verifique:

- se a empresa possui `credenciais`;
- se `usuario` e `token` batem;
- se `data_criacao` e `tempoUso` geram um token ainda valido;
- se a sessao antiga no `localStorage` nao esta expirada.

### 21.4. Empresa nao aparece no autocomplete

Verifique:

- se ela esta em `dados.json.empresas`;
- se foi salva no formato estruturado;
- se a API `/api/dados/empresas` esta respondendo.

### 21.5. CLIENT ve obras erradas

Verifique:

- se a obra possui `empresaCodigo` ou `empresaSigla` corretos;
- se o `APP_CONFIG.empresaAtual` foi preenchido pelo login;
- se `matchesEmpresaContext()` esta retornando `true` so para a empresa correta.

## 22. Checklist de manutencao

Quando alterar o sistema, preserve estas regras:

- nao quebrar o modo USER;
- nao duplicar telas ou modulos sem necessidade;
- usar feature flags para comportamento restrito;
- manter empresa no formato estruturado;
- atualizar frontend e backend juntos quando mudar o contrato dos dados;
- validar `dados.json`, `backup.json` e `sessions.json` ao mexer em persistencia;
- atualizar este README quando houver mudanca relevante de arquitetura.

## 23. Estado atual resumido

Hoje o sistema esta organizado para:

- operar com um frontend principal modular;
- oferecer um painel administrativo de dados;
- oferecer modo CLIENT com autenticacao e restricoes;
- trabalhar com o novo formato de empresa estruturada;
- manter compatibilidade temporaria com dados legados via normalizacao;
- persistir tudo em JSON;
- gerar documentos Word a partir das obras.

Esse e o contrato atual do projeto. Qualquer evolucao futura deve partir desta base, preservando reutilizacao, modularidade e compatibilidade operacional.
