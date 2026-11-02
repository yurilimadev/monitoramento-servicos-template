#!/usr/bin/env node

/**
 * setup.js — Script de inicialização do template
 *
 * Uso:
 *   npm run setup
 *
 * Pergunta nome, título, autor, modo de dados e atualiza os placeholders.
 * Cria o .env conforme o modo escolhido e instala as dependências.
 */

import { createInterface } from 'readline'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function main() {
  console.log('\n=== Monitoramento de Serviços — Template Setup ===\n')

  const projectName = (await ask('Nome do projeto (ex: meu-monitoramento): ')) || 'meu-monitoramento'
  const appTitle = (await ask('Título do app (ex: Monitoramento - Meu Setor): ')) || 'Monitoramento de Serviços'
  const author = await ask('Autor (para o footer): ')
  const baseUrlInput = await ask('Base URL do deploy (ex: /meu-repo/ — Enter para /): ')
  const baseUrl = baseUrlInput
    ? `/${baseUrlInput.replace(/^\/+|\/+$/g, '')}/`
    : '/'

  console.log('\nModo de dados:')
  console.log('  1) demo   — dados fictícios locais, roda sem configurar nada (recomendado para começar)')
  console.log('  2) sheets — planilha Google Sheets real (exige credenciais)')
  const modoEscolha = (await ask('Escolha [1/2] (padrão 1): ')) || '1'
  const dataMode = modoEscolha === '2' ? 'sheets' : 'demo'

  const filesToUpdate = [
    'index.html',
    'src/components/AppHeader.vue',
    'src/App.vue',
    'README.md',
  ]

  for (const file of filesToUpdate) {
    const filePath = join(root, file)
    if (!existsSync(filePath)) {
      console.warn(`  [AVISO] ${file} não encontrado — pulando`)
      continue
    }
    let content = readFileSync(filePath, 'utf-8')
    content = content
      .replace(/Monitoramento de Serviços — Template/g, appTitle)
      .replace(/Monitoramento - APP Mobby/g, appTitle)
      .replace(/Monitoramento de Serviços/g, appTitle)
      .replace(/Feito com Vue 3 \+ Google Sheets — adapte para seus dados/g,
        `Feito com Vue 3 + Google Sheets${author ? ' - ' + author : ''}`)
    writeFileSync(filePath, content, 'utf-8')
    console.log(`  [OK] ${file} atualizado`)
  }

  const envPath = join(root, '.env')
  if (existsSync(envPath)) {
    console.log('  [OK] .env já existe — mantido')
  } else {
    const env = readFileSync(join(root, '.env.example'), 'utf-8')
      .replace('VITE_DATA_MODE=', `VITE_DATA_MODE=${dataMode}`)
      .replace('VITE_BASE_URL=/', `VITE_BASE_URL=${baseUrl}`)
    writeFileSync(envPath, env, 'utf-8')
    console.log(`  [OK] .env criado (modo ${dataMode})`)
  }

  const pkgPath = join(root, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    pkg.name = projectName
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    console.log(`  [OK] package.json name → ${projectName}`)
  }

  console.log('\nInstalando dependências...')
  try {
    execSync('npm install', { cwd: root, stdio: 'inherit' })
    console.log('  [OK] npm install concluído')
  } catch {
    console.warn('  [AVISO] npm install falhou — execute manualmente')
  }

  console.log('\n=== Próximos passos ===')
  if (dataMode === 'demo') {
    console.log('1. npm run dev        # já abre com dados fictícios')
    console.log('2. Para usar dados reais: preencha o .env e ajuste VITE_DATA_MODE=sheets')
  } else {
    console.log('1. Preencha o .env com suas credenciais')
    console.log('2. npm run dev')
  }
  console.log('3. npm run build      # produzir dist/ para deploy')
  console.log('4. Crie os secrets no GitHub e faça push para main\n')

  rl.close()
}

main()
