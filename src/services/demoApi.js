import referenciaFixture from '../data/demo/referencia.json'
import transacoesFixture from '../data/demo/transacoes.json'
import { normalizar } from './csvParser.js'

const STORAGE_KEY = 'mobview:demo:upserts'

function chaveNormalizada(chave) {
  return normalizar(chave).replace(/\s+/g, '_')
}

function normalizarLinha(linha) {
  const obj = {}
  Object.keys(linha).forEach(chave => {
    obj[chaveNormalizada(chave)] = linha[chave]
  })
  return obj
}

function lerUpserts() {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY)
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function gravarUpserts(lista) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
  } catch (erro) {
    console.warn('[demo] Não foi possível salvar no localStorage:', erro)
  }
}

function dadosComUpserts() {
  const porCodigo = new Map()
  transacoesFixture.forEach(linha => {
    porCodigo.set(linha.codigo_unico, { ...linha })
  })
  lerUpserts().forEach(linha => {
    const codigo = linha.codigo_unico
    if (codigo) {
      porCodigo.set(codigo, { ...(porCodigo.get(codigo) || {}), ...linha })
    }
  })
  return Array.from(porCodigo.values())
}

export async function fetchReferenceData() {
  return referenciaFixture.map(linha => ({ ...linha }))
}

export async function fetchDadosDaPlanilha() {
  return dadosComUpserts()
}

export async function buscarDadosSalvos(secretaria, agrupamento, dataInicio, dataFim) {
  const dados = await fetchDadosDaPlanilha()
  return dados.filter(row => {
    const matchSec = normalizar(row.secretaria) === normalizar(secretaria)
    const matchAgrup = normalizar(row.nome_agrupamento) === normalizar(agrupamento)
    let matchData = true
    if (dataInicio && dataFim) {
      const rowData = row.dia_da_atualizacao
      matchData = rowData >= dataInicio && rowData <= dataFim
    }
    return matchSec && matchAgrup && matchData
  })
}

export async function upsertDados(dataToSend) {
  const recebidas = dataToSend.map(normalizarLinha)
  const atuais = lerUpserts()
  const indiceLocal = new Map(atuais.map((linha, i) => [linha.codigo_unico, i]))
  const codigosExistentes = new Set(transacoesFixture.map(linha => linha.codigo_unico))
  let inseridas = 0
  let atualizadas = 0

  recebidas.forEach(linha => {
    const codigo = linha.codigo_unico
    if (codigo && indiceLocal.has(codigo)) {
      atuais[indiceLocal.get(codigo)] = linha
      atualizadas++
    } else {
      atuais.push(linha)
      if (codigo) indiceLocal.set(codigo, atuais.length - 1)
      if (codigo && codigosExistentes.has(codigo)) atualizadas++
      else inseridas++
    }
  })

  gravarUpserts(atuais)
  return { ok: true, modo: 'demo', inseridas, atualizadas }
}

export function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY)
}

export function quantidadeAlteracoesLocais() {
  return lerUpserts().length
}
