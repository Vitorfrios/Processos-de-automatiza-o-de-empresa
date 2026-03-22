# Sistema ESI

Sistema web para criação de obras, composição técnica de projetos e salas, cálculo de climatização, gestão de catálogos do sistema e exportação de documentos Word com envio por email.

O projeto combina:

- frontend em JavaScript modular, sem framework SPA tradicional;
- backend Python com servidor HTTP próprio;
- persistência híbrida com SQLite e documentos JSON de apoio/compatibilidade;
- autenticação para cliente e administrador;
- exportação de propostas técnicas e comerciais;
- sincronização de empresas, credenciais de acesso e dados de obra.

## Visão geral

O fluxo principal do produto é:

1. cadastrar ou abrir uma obra;
2. vincular a obra a uma empresa;
3. montar projetos e salas;
4. preencher dados técnicos;
5. calcular carga térmica, ventilação e solução de máquinas;
6. salvar a obra;
7. exportar PT/PC por download ou email.

Além disso, o sistema possui um painel administrativo para editar os bancos internos:

- credenciais ADM;
- configuração SMTP;
- empresas;
- máquinas;
- materiais;
- acessórios;
- dutos;
- tubos;
- constantes;
- JSON bruto.

## Perfis de uso

Na prática, o sistema trabalha com 3 perfis de operação, embora o frontend principal use 2 modos de execução (`user` e `client`).

### 1. Cliente

Perfil autenticado por usuário + token da empresa.

Características:

- entra pela tela de login;
- acessa apenas a própria empresa;
- a empresa fica travada no formulário;
- não vê o painel de edição de dados;
- não usa filtros globais de obras;
- pode criar/editar obras dentro do contexto da empresa autenticada;
- pode recuperar token por email, se houver email de recuperação cadastrado;
- ao salvar obra, dispara notificação ao ADM.

### 2. Usuário interno / operação

É o uso interno do módulo de criação de obras em modo `user`.

Características:

- acesso amplo à tela de obras;
- pode escolher qualquer empresa;
- pode usar filtros;
- pode acessar a navegação administrativa;
- pode preencher dados de credenciais da empresa diretamente no cadastro da obra;
- pode exportar documentos e enviar email.

### 3. Administrador

É o perfil com login administrativo, redirecionado para o ambiente `/admin`.

Características:

- acessa o cadastro de obras pelo caminho administrativo;
- acessa o painel `/admin/data`;
- gerencia credenciais ADM;
- configura o remetente SMTP;
- altera os bancos estruturais do sistema;
- cria, edita ou remove credenciais de acesso das empresas.

## Modos do frontend

### Modo `user`

Configuração padrão do app principal.

Comportamento:

- autenticação de cliente desativada;
- filtros habilitados;
- navegação para editar dados habilitada;
- botão de desligar servidor habilitado;
- empresa livre no formulário.

Arquivo-base:

- [config.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/core/config.js)

### Modo `client`

Ativado por `window.__APP_CONFIG_OVERRIDES__` nas páginas de login e obra do cliente.

Comportamento:

- autenticação obrigatória;
- sessão do cliente em `sessionStorage`;
- empresa resolvida a partir da sessão;
- campo de empresa bloqueado;
- filtros desabilitados;
- acesso administrativo oculto;
- shutdown oculto.

Arquivos principais:

- [config.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/core/config.js)
- [auth.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/core/auth.js)
- [client-mode.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/main-folder/client-mode.js)

## Rotas e páginas principais

### Login

- `/login`
  Tela única de autenticação.

Detalhe importante:

- o login primeiro tenta autenticar como ADM;
- se não passar, tenta autenticar como cliente;
- a mesma tela atende os dois cenários.

Arquivos:

- [index.html](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/pages/login/index.html)
- [client-login.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/pages/client-login.js)

### Obras do cliente

- `/obras/create`

Uso:

- ambiente restrito para clientes autenticados;
- empresa herdada da sessão;
- mesma base funcional do módulo de obras, com restrições de UI.

Arquivo:

- [create.html](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/pages/obras/create.html)

### Obras administrativas

- `/admin/obras/create`

Uso:

- tela principal de criação, edição e atualização de obras no modo interno;
- permite preencher dados completos da empresa e credenciais de acesso.

Arquivo:

- [create.html](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/pages/admin/obras/create.html)

### Obras em modo embed

- `/admin/obras/embed`

Uso:

- variante embutida para visualização/integração;
- filtros e navegação administrativa ocultos.

Arquivo:

- [embed.html](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/pages/admin/obras/embed.html)

### Painel de dados administrativos

- `/admin/data`

Uso:

- manutenção dos bancos do sistema;
- gestão de empresas, credenciais, SMTP e catálogos.

Arquivo:

- [index.html](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/pages/admin/data/index.html)

## O que o sistema faz

### Cadastro estrutural

- cria obras;
- cria projetos dentro da obra;
- cria salas dentro de cada projeto;
- mantém identificadores derivados de empresa e número do cliente;
- sincroniza cabeçalho e metadados da obra após salvamento.

### Cálculo técnico

- vazão de ar externo;
- ganhos térmicos;
- pressurização;
- capacidade de refrigeração;
- solução de máquinas;
- ventilação;
- componentes associados.

### Catálogos de apoio

- máquinas;
- materiais;
- acessórios;
- dutos;
- tubos;
- constantes do sistema.

### Exportação

- proposta técnica;
- proposta comercial;
- ambos;
- download;
- envio por email;
- fluxo combinado de download + email.

## Credenciais e empresas

O sistema hoje trata credenciais de empresa como parte do cadastro da empresa, mas também permite preenchê-las a partir da obra no ambiente administrativo.

### Campos de credencial de empresa

- usuário de acesso;
- email de recuperação;
- token de acesso;
- tempo de uso;
- data de criação;
- data de expiração.

### Fluxo atual de sincronização

#### Obra para empresa

Quando a obra é salva ou atualizada:

- os dados da empresa são extraídos do formulário;
- `empresaCredenciais` segue no payload da obra quando houver token;
- o backend faz `upsert` das credenciais no cadastro da empresa.

Arquivos centrais:

- [empresa-data-extractor.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/data/empresa-system/empresa-data-extractor.js)
- [obra-save-handler.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/features/managers/obra-folder/obra-save-handler.js)
- [routes_core.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/core/routes_core.py)
- [empresa_repository.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/database/repositories/empresa_repository.py)

#### Empresa para obra

No ambiente administrativo:

- ao selecionar empresa na obra, o formulário tenta preencher as credenciais já cadastradas;
- se não existir credencial salva, os campos ficam vazios para criação manual;
- ao editar credenciais no grid de empresas, os blocos de obra renderizados para a mesma empresa são atualizados localmente.

Arquivos centrais:

- [empresa-form-manager.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/data/empresa-system/empresa-form-manager.js)
- [empresa-ui-helpers.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/data/empresa-system/empresa-ui-helpers.js)
- [empresas.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/03_Edit_data/core/empresas.js)

### Regras importantes

- limpar a empresa limpa também email, usuário e token no formulário administrativo;
- o sistema não deve fabricar credencial automaticamente só por trocar empresa;
- token novo nasce apenas por ação explícita do usuário;
- o email da empresa também alimenta o fluxo de recuperação de token e exportação;
- o cliente só autentica se o token estiver válido e não expirado.

## Credenciais ADM e SMTP

O painel administrativo possui uma aba específica para:

- credenciais de administradores;
- email de recuperação dos administradores;
- configuração SMTP do remetente do sistema.

Essa configuração SMTP é usada em:

- exportação por email;
- recuperação de token por email;
- notificações automáticas ao ADM.

Arquivos:

- [admin-credentials.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/03_Edit_data/core/admin-credentials.js)
- [admin-credentials.css](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/static/03_Edit_data/admin-credentials.css)

Endpoints:

- `GET /api/admin/email-config`
- `POST /api/admin/email-config`

## Recuperação de token por email

A tela de login oferece recuperação de token.

Fluxo:

1. usuário informa usuário + email de recuperação;
2. backend procura correspondência em ADM e empresas;
3. se encontrar uma conta única compatível, envia o token atual por email.

Endpoint:

- `POST /api/auth/recover-token`

Observações:

- depende de SMTP configurado;
- depende de email cadastrado corretamente;
- se houver ambiguidade, o backend bloqueia o envio.

## Exportação de documentos e envio por email

O sistema possui dois fluxos de exportação.

### 1. Geração Word clássica

Usa os geradores de documento para PT, PC ou ambos.

Rotas:

- `GET /api/word/models`
- `GET /api/word/templates`
- `POST /api/word/generate/proposta-comercial`
- `POST /api/word/generate/proposta-tecnica`
- `POST /api/word/generate/ambos`
- `GET /api/word/download?id=...`

### 2. Exportação unificada

Fluxo mais novo orientado a download, email ou ambos.

Endpoint:

- `POST /api/export`

Modos:

- `download`
- `email`
- `completo`

Formatos:

- `pc`
- `pt`
- `ambos`

Comportamento:

- monta os arquivos temporários da obra;
- opcionalmente registra downloads para retirada posterior;
- opcionalmente envia anexos por email;
- trabalha com jobs assíncronos de background.

Arquivos:

- [export-modal.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/ui/download/export-modal.js)
- [word-modal.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/ui/download/word-modal.js)
- [http_handler.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/handlers/http_handler.py)
- [wordPT_generator.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/generators/wordPT_generator.py)
- [wordPC_generator.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/generators/wordPC_generator.py)

### Notificação automática ao ADM

Quando uma obra é salva no modo cliente:

- o frontend chama `/api/obra/notificar`;
- o backend pode gerar os anexos;
- o envio usa o remetente SMTP cadastrado.

Arquivo:

- [obra-save-handler.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/features/managers/obra-folder/obra-save-handler.js)

## Arquitetura do repositório

```text
.
├─ README.md
├─ requirements.txt
├─ setup.py
├─ codigo/
│  ├─ servidor.py
│  ├─ database/
│  │  └─ app.sqlite3
│  ├─ json/
│  ├─ public/
│  │  ├─ pages/
│  │  ├─ scripts/
│  │  ├─ static/
│  │  └─ images/
│  ├─ servidor_modules/
│  │  ├─ core/
│  │  ├─ database/
│  │  ├─ generators/
│  │  ├─ handlers/
│  │  └─ utils/
│  └─ word_templates/
├─ scripts/
└─ utilitarios py/
```

### Frontend principal

Raiz:

- [01_Create_Obra](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra)

Pastas:

- `core/`
  configuração, autenticação, bootstrap e utilitários compartilhados.
- `data/`
  builders, extração de dados, adapters e sistema de empresa.
- `features/`
  managers e cálculos.
- `main-folder/`
  inicialização da aplicação e modo cliente.
- `pages/`
  scripts de entrada das páginas.
- `ui/`
  componentes visuais, status, modal e exportação.

### Painel administrativo

Raiz:

- [03_Edit_data](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/03_Edit_data)

Responsabilidades:

- carregar `systemData`;
- editar bancos estruturais;
- controlar pendências de salvamento;
- renderizar tabs administrativas;
- persistir alterações do painel.

### Backend

Arquivos centrais:

- [servidor.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor.py)
- [server_core.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/core/server_core.py)
- [http_handler.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/handlers/http_handler.py)
- [routes_core.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/core/routes_core.py)

Responsabilidades:

- servir HTML, JS, CSS e assets;
- expor APIs JSON;
- autenticar cliente e ADM;
- persistir dados;
- gerar documentos Word;
- enviar emails;
- coordenar exportações assíncronas.

## Persistência de dados

O sistema hoje é híbrido.

### SQLite

Banco principal:

- [app.sqlite3](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/database/app.sqlite3)

Schema central:

- `admins`
- `empresas`
- `obras`
- `projetos`
- `salas`
- `sala_maquinas`
- `materials`
- `machine_catalog`
- `acessorios`
- `dutos`
- `tubos`
- `sessions`
- `admin_email_config`
- `obra_notifications`

Arquivo:

- [connection.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/database/connection.py)

### JSON

O projeto ainda mantém documentos JSON e camadas de compatibilidade para:

- dados agregados;
- backup;
- sessões;
- migração/convivência com estrutura legada.

Diretório:

- [json](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/json)

## Bootstrap e carregamento de dados

O frontend usa payloads de bootstrap para evitar múltiplas consultas fragmentadas.

Endpoints principais:

- `GET /api/runtime/bootstrap`
- `GET /api/runtime/system-bootstrap`

Uso:

- carregar obras visíveis;
- carregar catálogos e bancos administrativos;
- preencher contexto de empresa;
- alimentar autocomplete, filtros e grids.

Arquivo:

- [system-bootstrap.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/core/system-bootstrap.js)

## Como executar

### Requisitos

- Python 3.x
- dependências de [requirements.txt](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/requirements.txt)

Dependências principais:

- Flask
- pandas
- numpy
- openpyxl
- python-docx
- docxtpl
- Jinja2
- Pillow
- lxml

### Instalação

```bash
pip install -r requirements.txt
```

### Execução local

```bash
python codigo/servidor.py
```

Comportamento esperado:

- o servidor procura a porta `8000`;
- se necessário, tenta liberar a porta ou escolher outra;
- abre o navegador automaticamente em `/admin/obras/create`.

## Operação diária recomendada

### Para criar obras internas

1. abra `/admin/obras/create`;
2. selecione a empresa;
3. preencha projeto, salas e dados técnicos;
4. se necessário, preencha credenciais da empresa;
5. salve a obra;
6. exporte PT/PC por download ou email.

### Para configurar email do sistema

1. abra `/admin/data`;
2. vá para `Credenciais ADM`;
3. preencha email, token SMTP e nome do remetente;
4. salve;
5. valide a exportação por email.

### Para gerenciar acesso do cliente

1. abra `/admin/data`;
2. vá para `Empresas`;
3. crie ou atualize usuário, email e token;
4. defina validade;
5. salve o painel administrativo.

## Pontos importantes do comportamento atual

- o login de cliente e de ADM compartilha a mesma tela;
- o modo cliente restringe empresa, filtros e navegação administrativa;
- a obra administrativa consegue criar credenciais da empresa sem sair da tela;
- o grid de empresas também consegue criar e editar credenciais;
- a sincronização empresa ↔ obra depende do salvamento do fluxo correspondente;
- exportação por email depende de SMTP configurado;
- recuperação de token depende de email de recuperação válido;
- tokens podem ter validade e expiração;
- há limpeza e saneamento de credenciais expiradas em fluxos do backend.

## Arquivos mais críticos do sistema

- [servidor.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor.py)
- [http_handler.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/handlers/http_handler.py)
- [routes_core.py](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/servidor_modules/core/routes_core.py)
- [empresa-form-manager.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/data/empresa-system/empresa-form-manager.js)
- [empresa-data-extractor.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/data/empresa-system/empresa-data-extractor.js)
- [empresas.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/03_Edit_data/core/empresas.js)
- [admin-credentials.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/03_Edit_data/core/admin-credentials.js)
- [obra-save-handler.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/features/managers/obra-folder/obra-save-handler.js)
- [export-modal.js](/c:/Users/vitor/OneDrive/Repositórios/app.esienergia/codigo/public/scripts/01_Create_Obra/ui/download/export-modal.js)

## Resumo executivo

Este sistema não é apenas um formulário de obras. Ele reúne, no mesmo produto:

- CRM técnico de empresas e obras;
- cálculo de climatização e ventilação;
- catálogo editável de máquinas e componentes;
- autenticação por empresa;
- recuperação de token;
- exportação documental;
- entrega por email;
- painel administrativo de manutenção de dados.

Se o próximo passo for melhorar a documentação ainda mais, o ideal é quebrar este README em documentos menores por domínio:

- `docs/arquitetura.md`
- `docs/fluxo-de-credenciais.md`
- `docs/exportacao-email.md`
- `docs/modo-cliente.md`
- `docs/backend-e-apis.md`
