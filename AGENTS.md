# AGENTS.md — monitoramento-servicos-template

## Stack

Vue 3 (JS) + Vite + Vue Router (hash history) + Pinia.
Bootstrap 5.3, Flatpickr e Chart.js — todos via CDN no `index.html`.

## Commands

```bash
npm run dev             # dev server (Vite) — modo demo por padrão
npm run build           # produz dist/
npm run preview         # serve dist/ localmente
npm run setup           # inicialização interativa (nome, título, modo demo/sheets)
npm run demo:gerar      # regenera src/data/demo/*.json (seed fixa)
npm run demo:verificar  # falha se houver termo real/dado sensível nas fixtures
```

Não há testes nem linter configurados. Build + `demo:verificar` são a verificação.

## Modos de dados

`config.dataMode` é resolvido em `src/config.js`:

- `demo` — padrão quando faltam `VITE_SPREADSHEET_ID`/`VITE_APPS_SCRIPT_URL`;
  lê `src/data/demo/*.json` e grava upserts em `localStorage` (`mobview:demo:upserts`).
- `sheets` — leitura via Google Sheets API v4 e escrita via Apps Script.
- `VITE_DATA_MODE` força `demo` ou `sheets`; vazio = detecção automática.
  Se `sheets` for forçado sem credenciais, cai em `demo` com warning.

Todo acesso a dados passa por `src/services/dataProvider.js` (seam único). Views e store
não importam `sheetApi`/`sheetWriter`/`demoApi` diretamente — só o provider.

## Estrutura

```
src/
  config.js             # lê import.meta.env.VITE_* e resolve dataMode
  services/
    csvParser.js        # normalizar() helper
    dataProvider.js     # escolhe adaptador (demo | sheets)
    demoApi.js          # fixtures + upsert em localStorage
    sheetApi.js         # GET Google Sheets API v4 (leitura)
    sheetWriter.js      # POST Google Apps Script (escrita/upsert)
  data/demo/            # fixtures anônimas (referencia.json, transacoes.json)
  stores/
    monitorStore.js     # Pinia: estado global
  components/
    AppHeader.vue       # navegação (router-link)
    DemoBanner.vue      # aviso de modo demo + reset
    FilterPanel.vue     # selects + data + botão Filtrar
    ServiceCard.vue     # formulário individual
    UpdateForm.vue      # ServiceCards + "Puxar dados" + "Atualizar"
    DataTable.vue       # tabela com paginação (20 itens/página)
    BarChart.vue        # gráfico de barras
    LineChart.vue       # gráfico de linha
  views/
    UpdatePage.vue      # rota /
    OverviewPage.vue    # rota /visao-geral
scripts/
  setup.js              # inicialização interativa
  gerar-dados-demo.mjs  # gerador determinístico das fixtures
  verificar-anonimizacao.mjs  # lista de termos reais proibidos
```

## Dados de demonstração

- `scripts/gerar-dados-demo.mjs` usa PRNG com seed fixa (`20260101`), 24 semanas
  terminando em 26/10/2026, ~528 linhas. Rode de novo para regenerar sem diff barulhento.
- Formato das fixtures é igual ao retorno de `parseSheetData` (headers normalizados,
  sem acento, `servico` sem cedilha) — não use chaves com acento.
- `codigo_unico` é SHA-256 de `data + secretaria + agrupamento + servico`, igual ao
  `UpdateForm`, para que "Puxar dados salvos" + "Atualizar" casem com o upsert local.
- `scripts/verificar-anonimizacao.mjs` bloqueia órgãos/pessoas reais, e-mail, CPF e
  telefone. Ele roda no workflow de deploy antes do build — mantenha a lista atualizada.

## Fluxo de dados (modo sheets)

- **Leitura referência**: Sheets API v4 (`GET .../values/{range}?key={API_KEY}`) → FilterPanel
- **Leitura planilha**: Sheets API v4 → OverviewPage / "Puxar dados salvos"
- **Escrita**: POST para Google Apps Script Web App (upsert por `codigo_unico`)
- **Hash único**: SHA-256 via `crypto.subtle.digest` quando não existe `codigo_unico` salvo

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`):
- `npm ci` → `demo:verificar` → cria `.env.production` com secrets → `npm run build` → `gh-pages`
- Push em `main` ou `workflow_dispatch` aciona o deploy
- Sem secrets o Pages publica o modo demo (vitrine do template)
- `base` do Vite vem de `VITE_BASE_URL`; fallback no CI é `/<nome-do-repo>/`; local é `/`

## Branch & PR

- Trabalho em `feat/*` ou `fix/*`, com PR → `main`
- A branch `template/public` é legada (o sanitizado agora é o modo demo)
