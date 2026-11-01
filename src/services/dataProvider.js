import { config } from '../config.js'
import {
  fetchDadosDaPlanilha as fetchDadosSheets,
  fetchReferenceData as fetchReferenciaSheets,
  buscarDadosSalvos as buscarDadosSheets,
} from './sheetApi.js'
import { upsertDados as upsertSheets } from './sheetWriter.js'
import {
  fetchDadosDaPlanilha as fetchDadosDemo,
  fetchReferenceData as fetchReferenciaDemo,
  buscarDadosSalvos as buscarDadosDemo,
  upsertDados as upsertDemo,
  resetDemoData,
  quantidadeAlteracoesLocais,
} from './demoApi.js'

export const isDemo = config.dataMode === 'demo'

export const fetchDadosDaPlanilha = isDemo ? fetchDadosDemo : fetchDadosSheets
export const fetchReferenceData = isDemo ? fetchReferenciaDemo : fetchReferenciaSheets
export const buscarDadosSalvos = isDemo ? buscarDadosDemo : buscarDadosSheets
export const upsertDados = isDemo ? upsertDemo : upsertSheets

export { resetDemoData, quantidadeAlteracoesLocais }
