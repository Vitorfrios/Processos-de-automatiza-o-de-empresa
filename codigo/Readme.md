# Sistema de Climatização e Gestão de Obras/Projetos

Aplicação modular para planejamento e cálculos de climatização em obras e projetos: criação e edição de obras, projetos e salas; cálculos de vazão e ganhos térmicos; seleção de máquinas; persistência em arquivos JSON; servidor Python local com SPA moderna em ES Modules.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Como Executar](#como-executar)
- [Guia Rápido (Primeiro Uso)](#guia-rápido-primeiro-uso)
- [Mapa Visual de Rotas (API)](#mapa-visual-de-rotas-api)
- [Exemplos de Requisições](#exemplos-de-requisições)
- [Modelos de Dados (JSON)](#modelos-de-dados-json)
- [Fluxos Comuns](#fluxos-comuns)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Página 2: Lista/Atualiza/Remove Projetos](#página-2-listaatualizaremover-projetos)
- [Dicas de Depuração](#dicas-de-depuração)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Notas de Compatibilidade](#notas-de-compatibilidade)
- [Desenvolvimento](#desenvolvimento)

---

## Visão Geral

- Backend: servidor HTTP em Python (porta padrão 8000) servindo arquivos estáticos e APIs de dados, sessões e obras/projetos.
- Frontend: SPA (ES Modules) para criar/editar obras, projetos e salas; executa cálculos e salva no backend.
- Persistência: arquivos JSON em `codigo/json` (`dados.json`, `backup.json`, `sessions.json`).

---

## Arquitetura

```
┌───────────────────────────────┐      ┌──────────────────────────┐
│           Frontend            │      │          Backend         │
│   SPA (ES Modules)            │      │  Python HTTP Server      │
│   - UI (interface + intr)     │      │  - http_handler (rotas)  │
│   - Data (server/projects/…)  │◀────▶│  - routes (lógica API)   │
│   - Cálculos (air/thermal)    │      │  - sessions_manager      │
└──────────────┬────────────────┘      │  - server_utils/config   │
               │                       └───────────┬──────────────┘
               │                                   │
               ▼                                   ▼
         Arquivos JSON                        Persistência Local
         (dados/backup/sessions)              (codigo/json/*.json)
```

---

## Como Executar

1) Pré‑requisitos

- Python 3.11+ (sem dependências externas obrigatórias)

2) Iniciar o servidor

- Abrir um terminal na raiz do repositório
- Executar: `python codigo/servidor.py`

3) Acessar a aplicação

- O servidor abre o navegador automaticamente, ou acesse:
  - `http://localhost:8000/public/pages/01_CreateProjects.html`

Encerrar

- Use o botão “Encerrar Servidor” (chama `/api/sessions/shutdown` e `/api/shutdown`) ou Ctrl+C no terminal.

---

## Guia Rápido (Primeiro Uso)

- Clique em “Nova Obra”.
- Dentro da obra, clique em “+ Adicionar Projeto” e, no projeto, “+ Adicionar Nova Sala”.
- Preencha os campos da sala (área, paredes, pessoas, etc.).
- Clique em “Verificar Dados” (opcional) e depois “Salvar Obra”.
- Para alterações futuras, use “Atualizar Obra”.

Checklist

- [ ] Criar 1 obra
- [ ] Adicionar 1 projeto
- [ ] Adicionar 1 sala
- [ ] Preencher entradas de climatização
- [ ] Salvar Obra

---

## Mapa Visual de Rotas (API)

| Grupo       | Método | Path                              | Descrição                                                |
|-------------|--------|-----------------------------------|----------------------------------------------------------|
| Obras       | GET    | `/obras`                          | Lista obras visíveis na sessão atual                     |
| Obras       | POST   | `/obras`                          | Cria obra e associa seus projetos à sessão ativa         |
| Obras       | PUT    | `/obras/:id`                      | Atualiza obra existente e sincroniza projetos na sessão  |
| Projetos    | GET    | `/projetos`                       | Lista projetos (compatibilidade)                         |
| Projetos    | POST   | `/projetos`                       | Cria projeto (compatibilidade)                           |
| Projetos    | PUT    | `/projetos/:id`                   | Atualiza projeto (compatibilidade)                       |
| Dados       | GET    | `/constants`                      | Retorna `constants` de `dados.json`                      |
| Dados       | GET    | `/machines`                       | Retorna `machines` de `dados.json`                       |
| Dados       | GET/POST | `/dados`                        | Lê/salva `dados.json` completo                           |
| Dados       | GET/POST | `/backup`                       | Lê/salva `backup.json` completo                          |
| Sessões     | GET    | `/api/sessions/current`           | Sessão atual (única)                                     |
| Sessões     | GET    | `/api/session-projects`           | IDs de projetos (compat.)                                |
| Sessões     | POST   | `/api/sessions/ensure-single`     | Garante sessão única ativa                               |
| Sessões     | DELETE | `/api/sessions/remove-project/:id`| Remove ID (compat.)                                      |
| Infra       | POST   | `/api/sessions/shutdown`          | Zera todas as sessões                                    |
| Infra       | POST   | `/api/shutdown`                   | Encerra servidor (cliente fecha a aba)                   |

Observação: Endpoints por ID de obra (`GET/DELETE /obras/:id`) não estão implementados por padrão.

---

## Exemplos de Requisições

Obras — criar

```bash
curl -X POST http://localhost:8000/obras \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Obra Demo",
    "projetos": [
      { "nome": "Projeto1", "salas": [ { "nome": "Sala1" } ] }
    ]
  }'
```

Obras — atualizar

```bash
curl -X PUT http://localhost:8000/obras/1001 \
  -H "Content-Type: application/json" \
  -d '{ "id": "1001", "nome": "Obra Demo (rev)", "projetos": [] }'
```

Obras — listar da sessão atual

```bash
curl http://localhost:8000/obras
```

Sessão — estado atual

```bash
curl http://localhost:8000/api/sessions/current
```

Dados — constantes e máquinas

```bash
curl http://localhost:8000/constants
curl http://localhost:8000/machines
```

Frontend (fetch) — exemplo

```js
async function criarObra() {
  const resp = await fetch('/obras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Obra API', projetos: [] })
  });
  const json = await resp.json();
  console.log('Obra criada:', json);
}
```

---

## Modelos de Dados (JSON)

Sessões — `sessions.json`

```json
{
  "sessions": {
    "session_active": { "obras": ["1001", "1002"] }
  }
}
```

Backup — `backup.json` (recorte)

```json
{
  "obras": [
    {
      "id": "1001",
      "nome": "Obra1",
      "timestamp": "2025-10-25T20:07:46.332Z",
      "projetos": [
        {
          "id": "1",
          "nome": "Projeto1",
          "salas": [
            {
              "id": "1",
              "nome": "Sala1",
              "inputs": { "area": 50, "numPessoas": 10 },
              "maquinas": [],
              "capacidade": { "backup": "n+1" },
              "ganhosTermicos": {},
              "configuracao": { "opcoesInstalacao": [] }
            }
          ],
          "timestamp": "2025-10-25T20:07:46.333Z"
        }
      ]
    }
  ]
}
```

Dados do sistema — `dados.json` (estrutura mínima)

```json
{
  "constants": { "VARIAVEL_PD": 1, "VARIAVEL_PS": 1 },
  "machines": [
    {
      "type": "Tubo Axial",
      "baseValues": { "1TR": 1, "2TR": 2 },
      "options": [ { "id": 1, "name": "Grade de Proteção", "values": { "1TR": 5 } } ],
      "voltages": [ { "name": "220V/1F", "value": "220V/1F" } ]
    }
  ]
}
```

---

## Fluxos Comuns

- Salvar obra: o browser monta dados (obra → projetos → salas) e envia via `POST /obras`.
- Atualizar obra: envia via `PUT /obras/:id` e sincroniza projetos na sessão.
- Remover projeto (visual): botão “Remover” no card do projeto (UI); persiste ao salvar obra.
- Remover obra da sessão: “Encerrar Servidor” limpa `sessions.json`; obras permanecem no backup.
- Carregar obras da sessão: `GET /api/sessions/current` + `GET /obras` (filtra por IDs da sessão).

---

## Estrutura de Pastas

```txt
codigo/
├─ servidor.py                 # Ponto de entrada do servidor
├─ servidor_modules/
│  ├─ http_handler.py          # Handler HTTP + roteamento
│  ├─ routes.py                # Lógica de rotas (obras, dados, sessões)
│  ├─ sessions_manager.py      # Sessão única: { session_active: { obras: [] } }
│  ├─ server_utils.py, config.py, file_utils.py, browser_monitor.py
│  └─ __init__.py
├─ public/
│  ├─ pages/
│  │  └─ 01_CreateProjects.html
│  ├─ scripts/
│  │  ├─ page1/
│  │  │  ├─ main.js, globals.js
│  │  │  ├─ config/config.js
│  │  │  ├─ ui/ (interface.js, edit.js)
│  │  │  │  └─ intr-files/ (status-manager.js, obra-manager.js, project-manager.js, ui-helpers.js)
│  │  │  ├─ data/ (server.js, projects.js, rooms.js, server-utils.js)
│  │  │  │  └─ data-files/ (data-utils-core.js, data-extractors.js, data-builders.js)
│  │  │  ├─ calculos/ (airFlow/*, thermalGains/*, utils/helpers.js)
│  │  │  └─ data/modules/machines/* (capacityCalculator.js, ...)
│  │  └─ page2/ (index.js, projects.controller.js, projects.repo.js, project-card.view.js)
│  └─ static/page1/ (CSS base, components, layout, pages)
└─ json/
   ├─ dados.json   # constants + machines
   ├─ backup.json  # obras -> projetos -> salas (dados completos)
   └─ sessions.json# { sessions: { session_active: { obras: [] } } }
```

---

## Página 2: Lista/Atualiza/Remover Projetos

- URL: `public/scripts/page2/index.html` (ou integração conforme sua estrutura de páginas).
- Reutiliza módulos da página 1 para renderização e persistência.
- Fluxo:
  1. Garante sessão ativa (`setSessionActive(true)`).
  2. Carrega `constants`.
  3. Busca projetos (preferência por `/backup`, fallback `/projetos`).
  4. Renderiza cards e permite atualização/remoção.

---

## Dicas de Depuração

- Ative o console do navegador (F12) e filtre por `dY` (logs presentes no código).
- Verifique `codigo/json/backup.json` após salvar para confirmar a persistência.
- Use `GET /health-check` para conferir se o servidor está online.
- Se o navegador não abrir, acesse manualmente a URL impressa no terminal.

---

## Troubleshooting

| Sintoma                                 | Causa Provável                        | Ação Sugerida                                                  |
|----------------------------------------|---------------------------------------|----------------------------------------------------------------|
| Porta 8000 ocupada                      | Outra app usando a porta              | O servidor tenta liberar/alternar; veja o log da porta final   |
| Página não abre automaticamente         | Bloqueio do SO ao abrir browser       | Acesse manualmente `http://localhost:<porta>/public/pages/...` |
| Sessão não carrega obras                | Sessão não iniciada                   | Salve a primeira obra ou chame `startNewSession()`             |
| “Atualizar Obra” não muda o botão       | ID não setado no DOM                  | Ver `updateObraButtonAfterSave(obraName, id)`                  |
| Dados inconsistentes na UI              | Cache de sessão local                 | Use “Encerrar Servidor” (limpa sessões e reinicia o ciclo)     |

---

## FAQ

- Posso rodar sem internet? Sim. Tudo é local.
- Onde ficam os dados? Em `codigo/json/backup.json`, `dados.json` e `sessions.json`.
- O que acontece ao encerrar o servidor? As sessões são zeradas; o backup permanece.
- E se eu só quiser projetos (sem obras)? As rotas de projetos existem por compatibilidade, mas o fluxo principal usa obras.

---

## Roadmap

- [ ] Implementar `GET/DELETE /obras/:id` no backend.
- [ ] Telas dedicadas para listagem e busca de obras.
- [ ] Exportações melhoradas (PDF/Word com layout).
- [ ] Internacionalização (pt-BR/en-US) no frontend.

---

## Notas de Compatibilidade

- Alguns módulos e logs usam acentuação que pode aparecer corrompida em certos consoles.
- A API de projetos é mantida para fluxos legados; preferir o uso de obras.

---

## Desenvolvimento

- Organização de módulos (UI/data/cálculos) documentada em `DOCUMENTACAO_ARQUIVOS_FUNCOES.md`.
- “data-files/” concentra utilitários de dados (IDs, extração e construção de objetos).
- “intr-files/” agrupa helpers internos de UI (status, obra, projeto e utilidades visuais).
