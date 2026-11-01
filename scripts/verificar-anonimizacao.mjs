#!/usr/bin/env node

/**
 * verificar-anonimizacao.mjs — barreira de segurança dos dados de demonstração.
 *
 * Uso:
 *   npm run demo:verificar
 *
 * Falha (exit 1) se as fixtures em src/data/demo contiverem termos do dataset
 * real da prefeitura, e-mails, CPF ou telefones. Roda no CI antes do build.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const demoDir = join(__dirname, '..', 'src', 'data', 'demo')

const TERMOS_PROIBIDOS = [
  // órgãos reais
  'ARSBAN', 'FUNCARTE', 'SECULT', 'PROCON', 'SEHARPE', 'SEINFRA',
  'SEL', 'SEMDES', 'SEMIDH', 'SEMSUR', 'SEMTAS', 'SEMUL', 'SME', 'SMS', 'STTU',
  'SEMPLA',
  // pessoas reais
  'Arthur', 'Nemi', 'Yuri', 'Dimitri',
]

const PADROES_SENSIVEIS = [
  { nome: 'e-mail', regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { nome: 'CPF', regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/ },
  { nome: 'telefone', regex: /\b\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/ },
]

const normalizar = texto =>
  (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function coletarTextos(valor, saida = []) {
  if (typeof valor === 'string') saida.push(valor)
  else if (Array.isArray(valor)) valor.forEach(item => coletarTextos(item, saida))
  else if (valor && typeof valor === 'object') Object.values(valor).forEach(item => coletarTextos(item, saida))
  return saida
}

const arquivos = readdirSync(demoDir).filter(nome => nome.endsWith('.json'))
if (arquivos.length === 0) {
  console.error('[demo:verificar] Nenhuma fixture encontrada em src/data/demo.')
  process.exit(1)
}

const termosNormalizados = TERMOS_PROIBIDOS.map(termo => ({
  original: termo,
  regex: new RegExp(`\\b${normalizar(termo)}\\b`, 'i'),
}))

const problemas = []

for (const arquivo of arquivos) {
  const caminho = join(demoDir, arquivo)
  const dados = JSON.parse(readFileSync(caminho, 'utf-8'))
  const textos = coletarTextos(dados)

  for (const texto of textos) {
    const alvo = normalizar(texto)

    for (const termo of termosNormalizados) {
      if (termo.regex.test(alvo)) {
        problemas.push(`${arquivo}: termo real "${termo.original}" em "${texto}"`)
      }
    }

    for (const padrao of PADROES_SENSIVEIS) {
      if (padrao.regex.test(texto)) {
        problemas.push(`${arquivo}: possível ${padrao.nome} em "${texto}"`)
      }
    }
  }
}

if (problemas.length > 0) {
  console.error('[demo:verificar] Dados sensíveis encontrados:')
  problemas.forEach(problema => console.error(`  - ${problema}`))
  process.exit(1)
}

console.log(`[demo:verificar] OK — ${arquivos.length} arquivo(s) sem termos reais nem dados sensíveis.`)
