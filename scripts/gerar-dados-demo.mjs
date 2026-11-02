#!/usr/bin/env node

/**
 * gerar-dados-demo.mjs — gera as fixtures anônimas do modo demonstração.
 *
 * Uso:
 *   npm run demo:gerar
 *
 * A saída é determinística (seed fixa), então rodar de novo não cria diffs
 * barulhentos. Os arquivos gerados ficam em src/data/demo/:
 *   - referencia.json  → catálogo fictício (secretarias, agrupamentos, serviços)
 *   - transacoes.json  → 24 semanas de snapshots fictícios
 *
 * Nenhum nome real de órgão, pessoa ou serviço da prefeitura é usado aqui.
 * Rode `npm run demo:verificar` para checar vazamentos antes de publicar.
 */

import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'src', 'data', 'demo')

const SEED = 20260101
const SEMANAS = 24
const ULTIMA_DATA = new Date(2026, 9, 26) // segunda-feira, 26/10/2026

// --- PRNG determinístico (mulberry32) -------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(SEED)
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const pick = arr => arr[randInt(0, arr.length - 1)]
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

// --- Catálogo fictício ----------------------------------------------------
const RESPONSAVEIS = ['Ana Souza', 'Bruno Lima', 'Carla Nogueira', 'Diego Alves', 'Elisa Prado', 'Felipe Maia']

const CATALOGO = [
  ['Secretaria de Obras', 'Obras e Infraestrutura', 'Tapa-buraco', 'Manutenção de vias', RESPONSAVEIS[0]],
  ['Secretaria de Obras', 'Obras e Infraestrutura', 'Recapeamento asfáltico', 'Manutenção de vias', RESPONSAVEIS[0]],
  ['Secretaria de Obras', 'Obras e Infraestrutura', 'Drenagem pluvial', 'Infraestrutura', RESPONSAVEIS[1]],
  ['Secretaria de Obras', 'Iluminação Pública', 'Reparo de luminária', 'Iluminação', RESPONSAVEIS[1]],
  ['Secretaria de Obras', 'Iluminação Pública', 'Instalação de poste', 'Iluminação', RESPONSAVEIS[1]],

  ['Secretaria de Saúde', 'Atenção Básica', 'Consulta médica', 'Atendimento', RESPONSAVEIS[2]],
  ['Secretaria de Saúde', 'Atenção Básica', 'Vacinação', 'Imunização', RESPONSAVEIS[2]],
  ['Secretaria de Saúde', 'Atenção Básica', 'Visita domiciliar', 'Atendimento', RESPONSAVEIS[3]],
  ['Secretaria de Saúde', 'Atenção Básica', 'Exames laboratoriais', 'Diagnóstico', RESPONSAVEIS[3]],
  ['Secretaria de Saúde', 'Vigilância Sanitária', 'Licença sanitária', 'Licenciamento', RESPONSAVEIS[2]],
  ['Secretaria de Saúde', 'Vigilância Sanitária', 'Inspeção de alimentos', 'Fiscalização', RESPONSAVEIS[3]],

  ['Secretaria de Educação', 'Matrícula e Vagas', 'Matrícula escolar', 'Matrícula', RESPONSAVEIS[4]],
  ['Secretaria de Educação', 'Matrícula e Vagas', 'Transferência de aluno', 'Matrícula', RESPONSAVEIS[4]],
  ['Secretaria de Educação', 'Transporte Escolar', 'Cadastro de rota', 'Transporte', RESPONSAVEIS[5]],
  ['Secretaria de Educação', 'Merenda Escolar', 'Entrega de merenda', 'Logística', RESPONSAVEIS[5]],

  ['Secretaria de Meio Ambiente', 'Licenciamento Ambiental', 'Licença ambiental', 'Licenciamento', RESPONSAVEIS[0]],
  ['Secretaria de Meio Ambiente', 'Licenciamento Ambiental', 'Poda de árvore', 'Manutenção', RESPONSAVEIS[1]],
  ['Secretaria de Meio Ambiente', 'Fiscalização Ambiental', 'Denúncia ambiental', 'Fiscalização', RESPONSAVEIS[1]],

  ['Secretaria de Mobilidade', 'Transporte Público', 'Bilhete estudantil', 'Benefício', RESPONSAVEIS[4]],
  ['Secretaria de Mobilidade', 'Transporte Público', 'Reclamação de transporte', 'Ouvidoria', RESPONSAVEIS[5]],
  ['Secretaria de Mobilidade', 'Sinalização Viária', 'Sinalização de via', 'Infraestrutura', RESPONSAVEIS[5]],

  ['Ouvidoria Geral', 'Atendimento ao Cidadão', 'Manifestação do cidadão', 'Elogio', RESPONSAVEIS[2]],
  ['Ouvidoria Geral', 'Atendimento ao Cidadão', 'Manifestação do cidadão', 'Reclamação', RESPONSAVEIS[3]],
  ['Ouvidoria Geral', 'Atendimento ao Cidadão', 'Manifestação do cidadão', 'Solicitação', RESPONSAVEIS[4]],
]

const OBSERVACOES = [
  'Aguardando peça de reposição',
  'Prazo estendido por demanda sazonal',
  'Atendimento dentro do prazo',
  'Prioridade alta definida pela equipe',
  'Sem ocorrências na semana',
]

// Mantém o mesmo formato que a leitura da planilha entrega ao app
// (headers normalizados: sem acentos, espaços → underscore).
const referencia = CATALOGO.map(([secretaria, nome_agrupamento, servico, subcategoria, responsavel]) => ({
  secretaria,
  nome_agrupamento,
  servico,
  subcategoria,
  responsavel,
}))

// Transações são por serviço (sem subcategoria), igual à aba real.
const servicosUnicos = []
const vistos = new Set()
for (const [secretaria, nome_agrupamento, servico, , responsavel] of CATALOGO) {
  const chave = `${secretaria}|${nome_agrupamento}|${servico}`
  if (vistos.has(chave)) continue
  vistos.add(chave)
  servicosUnicos.push({ secretaria, nome_agrupamento, servico, responsavel })
}

const pad = n => String(n).padStart(2, '0')
const formatarData = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`

// SHA-256 igual ao do UpdateForm: data + secretaria + agrupamento + serviço
const codigoUnico = (data, secretaria, agrupamento, servico) =>
  createHash('sha256').update(data + secretaria + agrupamento + servico).digest('hex')

const estado = new Map(
  servicosUnicos.map(s => [s.servico, { aberto: randInt(5, 30), andamento: randInt(1, 12), encerrado: randInt(10, 60) }])
)

const transacoes = []

for (let semana = SEMANAS - 1; semana >= 0; semana--) {
  const dia = new Date(ULTIMA_DATA)
  dia.setDate(dia.getDate() - semana * 7)
  const data = formatarData(dia)

  for (const { secretaria, nome_agrupamento, servico, responsavel } of servicosUnicos) {
    const st = estado.get(servico)

    st.aberto = clamp(st.aberto + randInt(-4, 6), 0, 60)
    st.andamento = clamp(st.andamento + randInt(-3, 4), 0, 40)
    st.encerrado = clamp(st.encerrado + randInt(0, 5), 0, 400)

    transacoes.push({
      dia_da_atualizacao: data,
      secretaria,
      nome_agrupamento,
      servico,
      aberto: st.aberto,
      andamento: st.andamento,
      encerrado: st.encerrado,
      responsavel,
      observacao: rand() < 0.15 ? pick(OBSERVACOES) : '',
      codigo_unico: codigoUnico(data, secretaria, nome_agrupamento, servico),
    })
  }
}

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'referencia.json'), JSON.stringify(referencia, null, 2) + '\n', 'utf-8')
writeFileSync(join(outDir, 'transacoes.json'), JSON.stringify(transacoes, null, 2) + '\n', 'utf-8')

console.log(`[demo] referencia.json  → ${referencia.length} linhas`)
console.log(`[demo] transacoes.json  → ${transacoes.length} linhas (${SEMANAS} semanas)`)
