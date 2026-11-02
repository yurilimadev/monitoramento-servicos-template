# Monitoramento de Serviços — Template

![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Bootstrap 5.3](https://img.shields.io/badge/Bootstrap_5.3-7952B3?logo=bootstrap&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-FFD859?logo=pinia&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chart.js&logoColor=white)
![Google Sheets API](https://img.shields.io/badge/Google_Sheets_API-34A853?logo=googlesheets&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?logo=githubpages&logoColor=white)

Aplicação Vue 3 + Google Sheets para **monitorar dados transacionais** de serviços públicos (ou qualquer processo que precise de registro periódico). Permite filtrar, atualizar e visualizar informações com gráficos e tabela paginada.

---

## Rodando sem configurar nada (modo demonstração)

O template já vem com um **dataset fictício** embutido. Não precisa de planilha, Apps Script nem chave de API:

```bash
npm install
npm run dev
```

O app detecta a ausência das credenciais `VITE_SPREADSHEET_ID`/`VITE_APPS_SCRIPT_URL` e entra em **modo demo**:

- catálogo e transações vêm de `src/data/demo/*.json` (24 semanas de snapshots, dados 100% inventados);
- "Atualizar" grava em `localStorage` do navegador (persiste no refresh, não sai da sua máquina);
- um banner no topo avisa que é demonstração e oferece **Resetar dados demo**;
- nenhuma requisição ao Google é feita.

Para usar uma planilha real, basta preencher o `.env` (ou definir `VITE_DATA_MODE=sheets`); o restante do app não muda.

### Dados de demonstração

| Arquivo | Conteúdo |
|---|---|
| `src/data/demo/referencia.json` | catálogo fictício (secretarias, agrupamentos, serviços, responsáveis) |
| `src/data/demo/transacoes.json` | 24 semanas de snapshots fictícios (~528 linhas) |
| `scripts/gerar-dados-demo.mjs` | regenera as fixtures com seed fixa (saída determinística) |
| `scripts/verificar-anonimizacao.mjs` | falha se aparecer termo real, e-mail, CPF ou telefone |

```bash
npm run demo:gerar      # regenera as fixtures
npm run demo:verificar  # checagem de anonimização (também roda no CI)
```

> Se for publicar este template, rode `npm run demo:verificar` antes. A lista de termos bloqueados fica em `scripts/verificar-anonimizacao.mjs`.

---

## Funcionalidades

- **Atualizar Dados** — Formulário dinâmico com accordion para preencher métricas (Aberto, Andamento, Encerrado, Observação) por serviço, com upsert automático na planilha (ou em `localStorage` no modo demo).
- **Visão Geral** — Tabela paginada com ordenação por coluna, filtros por Secretaria, Agrupamento, Serviço (autocomplete) e Período (range de datas). Gráficos de barras e linhas lado a lado para análise de série histórica.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Vue 3 (Composition API, JS) |
| Build | Vite |
| Roteamento | Vue Router (hash history) |
| Estado | Pinia |
| Estilo | Bootstrap 5.3 + Bootstrap Icons (via CDN) |
| Data | Flatpickr (via CDN) |
| Gráficos | Chart.js (via CDN) |
| Planilha | Google Sheets API v4 + Google Apps Script |

---

## Passo a passo (usar uma planilha real)

> Só siga esta seção se quiser trocar o modo demo por uma planilha de verdade. Para apenas explorar o app, pule para [Comandos](#comandos).

### Pré-requisitos

- Node.js 20+
- Conta Google (Gmail)
- Conta GitHub

### 1. Crie sua planilha Google Sheets

Use o modelo abaixo como base — faça uma cópia:

**[Modelo de Planilha — Fazer uma cópia](https://docs.google.com/spreadsheets/d/1Delbh5o2f6cX9lH1WFRFJ3Kic131BXUKm4ng3oOIK2I/copy)**

A planilha precisa de **duas abas**:

#### Aba `referencia_servicos` (catálogo)

Serve para popular os selects de Secretaria, Agrupamento e Responsável.

| secretaria | nome_agrupamento | serviço | subcategoria | responsavel |
|---|---|---|---|---|
| SECRETARIA A | Agrupamento X | Serviço 1 | Categoria A | João |
| SECRETARIA A | Agrupamento X | Serviço 2 | Categoria B | João |
| SECRETARIA B | Agrupamento Y | Serviço 3 | | Maria |

#### Aba `transacoes` (lançamentos)

Aqui os dados são registrados — seja manualmente, seja via o formulário do app.

| dia_da_atualizacao | secretaria | nome_agrupamento | serviço | aberto | andamento | encerrado | responsavel | observacao | codigo_unico |
|---|---|---|---|---|---|---|---|---|---|
| 01/01/2026 | SECRETARIA A | Agrupamento X | Serviço 1 | 5 | 3 | 2 | João | | a1b2c3... |
| 02/01/2026 | SECRETARIA A | Agrupamento X | Serviço 1 | 4 | 2 | 4 | João | | d4e5f6... |

> A coluna `codigo_unico` é gerada automaticamente pelo app via SHA-256. Não precisa preencher manualmente.

### 2. Crie o Google Apps Script

O app usa um Web App do Google Apps Script para **escrever/atualizar** dados na planilha.

1. Na sua planilha, vá em **Extensões → Apps Script**
2. Cole o conteúdo do arquivo [`APPS_SCRIPT.gs`](APPS_SCRIPT.gs) deste repositório
3. Clique em **Implantar → Novo deployment**
   - **Tipo:** Web App
   - **Executar como:** Eu
   - **Quem tem acesso:** Qualquer pessoa
4. Copie a **URL do Web App** gerada

### 3. Configure o projeto

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
cp .env.example .env
```

Preencha o arquivo `.env`:

```env
VITE_DATA_MODE=sheets             # opcional; vazio detecta pelas credenciais
VITE_SHEETS_API_KEY=AIzaSy...     # Chave da Google Sheets API
VITE_SPREADSHEET_ID=1ABC...       # ID da sua planilha
VITE_SHEETS_RANGE=transacoes
VITE_REFERENCE_RANGE=referencia_servicos
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

Instale e rode:

```bash
npm install
npm run dev
```

### 4. Deploy com GitHub Pages

O repositório já vem com GitHub Actions configurado (`.github/workflows/deploy.yml`).

No seu repositório no GitHub, vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Finalidade |
|---|---|
| `SHEETS_API_KEY` | Chave da Google Sheets API v4 |
| `SPREADSHEET_ID` | ID da planilha |
| `APPS_SCRIPT_URL` | URL do Web App do Apps Script |
| `VITE_DATA_MODE` | Opcional: `demo` ou `sheets` (vazio = detecta) |

Faça push na branch `main` e o deploy será automático.

> Sem secrets configurados, o Pages publica o **modo demo** — útil como vitrine do template. A `base` do Vite é derivada do nome do repositório (`/<repo>/`); sobrescreva com o secret `VITE_BASE_URL` se precisar de outro caminho.

### 5. Customize

#### Título e identidade visual

Edite estes arquivos:

- `index.html` — título da aba
- `src/components/AppHeader.vue` — título do header e gradiente (CSS `background: linear-gradient(...)`)
- `src/App.vue` — footer
- `public/` — adicione seu próprio logo (faça referência em `UpdatePage.vue` e `OverviewPage.vue`)

#### Colunas da tabela

Em `src/views/OverviewPage.vue`, altere o array `tableColumns`:

```js
const tableColumns = [
  { key: 'dia_da_atualizacao', label: 'Data' },
  { key: 'secretaria', label: 'Secretaria' },
  // adicione ou remova colunas aqui
]
```

#### Nomes das abas da planilha

Se quiser usar nomes diferentes de `transacoes` e `referencia_servicos`, altere no `.env`:

```env
VITE_SHEETS_RANGE=minha_aba_de_dados
VITE_REFERENCE_RANGE=meu_catalogo
```

---

## Estrutura do Projeto

```
src/
  config.js             # Lê import.meta.env.VITE_* e resolve o modo (demo | sheets)
  services/
    csvParser.js        # normalizar() helper
    dataProvider.js     # escolhe o adaptador de dados (demo ou sheets)
    demoApi.js          # leitura das fixtures + escrita em localStorage
    sheetApi.js         # Leitura via Google Sheets API v4
    sheetWriter.js      # Escrita via Apps Script
  data/demo/            # fixtures fictícias (referencia.json, transacoes.json)
  stores/
    monitorStore.js     # Pinia (estado global)
  components/
    AppHeader.vue       # Navegação
    DemoBanner.vue      # Aviso de modo demo + reset
    FilterPanel.vue     # Filtros (Secretaria, Agrupamento, Serviço, Período)
    ServiceCard.vue     # Formulário de serviço
    UpdateForm.vue      # Accordion + formulário de atualização
    DataTable.vue       # Tabela paginada com ordenação
    BarChart.vue        # Gráfico de barras (série histórica)
    LineChart.vue       # Gráfico de linhas (tendência)
  views/
    UpdatePage.vue      # Rota / (atualização)
    OverviewPage.vue    # Rota /visao-geral (visualização)
scripts/
  setup.js              # Inicialização interativa (nome, título, modo demo/sheets)
  gerar-dados-demo.mjs  # Regenera as fixtures fictícias
  verificar-anonimizacao.mjs  # Barreira contra dados reais
public/
  .gitkeep              # Pasta para seus assets (favicon, logo, etc.)
```

## Assets personalizados

Coloque suas imagens na pasta `public/`:

- `public/favicon.png` — ícone de aba do navegador
- `public/logo.png` — logo para o cabeçalho (referencie no `AppHeader.vue` como `import logoUrl from '/logo.png'`)

Arquivos em `public/` são copiados automaticamente para o build.

## Comandos

```bash
npm run dev      # Servidor de desenvolvimento (modo demo por padrão)
npm run build    # Produz dist/ para deploy
npm run preview  # Serve dist/ localmente
npm run setup    # Script interativo de inicialização (nome, título, modo)
npm run demo:gerar      # Regenera as fixtures fictícias
npm run demo:verificar  # Checa anonimização das fixtures
```

---

## Licença

MIT — sinta-se livre para usar, modificar e distribuir.