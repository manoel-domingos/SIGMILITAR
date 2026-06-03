import Papa from 'papaparse'
import type { FICAICSVRow, AlunoRecord, FICAIEntry } from '@/types/ficai'

// ─── Normalização de nome ────────────────────────────────────────────────────

const STOPWORDS = new Set(['DE', 'DA', 'DO', 'DOS', 'DAS', 'E', 'EM', 'NO', 'NA', 'O', 'A'])

export function normalizeName(name: string): string[] {
  return (name ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/[^A-Z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w))
}

// ─── Jaccard entre palavras ──────────────────────────────────────────────────

export function jaccardScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : intersection / union
}

// ─── Match aluno: código primeiro, nome como fallback ───────────────────────

export function matchAluno(
  row: FICAICSVRow,
  alunos: AlunoRecord[]
): { aluno: AlunoRecord | null; score: number } {
  const codAluno = parseInt(row['Cod Aluno'] ?? '0', 10)

  // 1. Match exato por código
  if (codAluno > 0) {
    const exact = alunos.find(a => a.cod_aluno === codAluno)
    if (exact) return { aluno: exact, score: 1.0 }
  }

  // 2. Similaridade de nome (fallback)
  const wordsCSV = normalizeName(row['Nome Aluno'] ?? '')
  let bestAluno: AlunoRecord | null = null
  let bestScore = 0

  for (const aluno of alunos) {
    const score = jaccardScore(wordsCSV, normalizeName(aluno.nome))
    if (score > bestScore) {
      bestScore = score
      bestAluno = aluno
    }
  }

  return bestScore >= 0.45
    ? { aluno: bestAluno, score: bestScore }
    : { aluno: null, score: bestScore }
}

// ─── Parse de porcentagem "22%" → 22 ────────────────────────────────────────

export function parsePct(s: string | undefined): number | null {
  if (!s || s.trim() === '') return null
  const n = parseInt(s.replace('%', '').trim(), 10)
  return isNaN(n) ? null : n
}

// ─── Processar CSV completo + cruzar com alunos do Supabase ─────────────────

export function processCSV(rawText: string, alunos: AlunoRecord[]): FICAIEntry[] {
  const { data, errors } = Papa.parse<FICAICSVRow>(rawText, {
    header: true,
    skipEmptyLines: true,
  })

  if (errors.length > 0) {
    console.warn('[FICAI] Avisos no parse do CSV:', errors.slice(0, 5))
  }

  return data.map(row => {
    const { aluno, score } = matchAluno(row, alunos)

    const faltasGeral = parsePct(row['Perc Faltas Geral Final'] ?? row['Perc Faltas Geral'])
    const faltas1Bim  = parsePct(row['Perc Faltas Final 1 Bim'] ?? row['Perc Faltas 1 Bim'])
    const faltas2Bim  = parsePct(row['Perc Faltas Final 2 Bim'] ?? row['Perc Faltas 2 Bim'])

    const dataFicai = (row['Data Abertura Ficha Ficai'] ?? '').trim()
    const ficaiAberto = dataFicai !== '' && dataFicai !== 'Não Aberto'

    const dataEncaminhamento = (row['Data Encaminhamento Conselho'] ?? '').trim()
    const encaminhado = dataEncaminhamento !== '' && dataEncaminhamento !== 'Não encaminhado'

    const alerta      = faltasGeral !== null && faltasGeral >= 10
    const alertaGrave = faltasGeral !== null && faltasGeral >= 25
    const ficaiNecessaria = alertaGrave && !ficaiAberto

    return {
      nomeAluno: row['Nome Aluno'] ?? '',
      turma: row['Turma'] ?? '',
      turno: row['Turno'] ?? '',
      modalidade: row['Modalidade'] ?? '',
      codAluno: codAlunoNum(row['Cod Aluno']),
      codMatricula: codAlunoNum(row['Cod Matricula']),

      faltasGeral,
      faltas1Bim,
      faltas2Bim,

      ficaiAberto,
      dataFicai,
      encaminhado,
      dataEncaminhamento,

      alunoId:              aluno?.id              ?? null,
      telefone:             aluno?.telefone        ?? null,
      nomeResponsavel:      aluno?.nome_responsavel      ?? null,
      telefoneResponsavel:  aluno?.telefone_responsavel  ?? null,
      matchScore: score,
      matched: !!aluno,

      alerta,
      alertaGrave,
      ficaiNecessaria,
    }
  })
}

function codAlunoNum(s: string | undefined): number | null {
  if (!s) return null
  const n = parseInt(s.trim(), 10)
  return isNaN(n) ? null : n
}

// ─── Ler File como texto UTF-8 ───────────────────────────────────────────────

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
    reader.readAsText(file, 'UTF-8')
  })
}
