const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID
const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL

const modoSolicitado = (import.meta.env.VITE_DATA_MODE || '').toLowerCase()
const temCredenciaisSheets = Boolean(spreadsheetId && appsScriptUrl)

function resolverModo() {
  if (modoSolicitado === 'demo') return 'demo'
  if (modoSolicitado === 'sheets') {
    if (temCredenciaisSheets) return 'sheets'
    console.warn(
      '[config] VITE_DATA_MODE=sheets, mas VITE_SPREADSHEET_ID/VITE_APPS_SCRIPT_URL não estão definidos. Usando modo demo.'
    )
    return 'demo'
  }
  return temCredenciaisSheets ? 'sheets' : 'demo'
}

const dataMode = resolverModo()

export const config = {
  dataMode,
  isDemo: dataMode === 'demo',
  apiKey: import.meta.env.VITE_SHEETS_API_KEY,
  spreadsheetId,
  range: import.meta.env.VITE_SHEETS_RANGE || 'transacoes',
  referenceRange: import.meta.env.VITE_REFERENCE_RANGE || 'referencia_servicos',
  appsScriptUrl,
}
