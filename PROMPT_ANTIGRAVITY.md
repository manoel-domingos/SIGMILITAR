# Implementar: Painel FICAI no módulo Psicossocial — SIGMILITAR

## Contexto

Estamos adicionando uma funcionalidade ao sistema **SIGMILITAR** (https://github.com/manoel-domingos/SIGMILITAR).

O objetivo é criar um **Painel FICAI** dentro do módulo Psicossocial. O usuário sobe uma planilha CSV exportada do sistema estadual de frequência escolar (Mato Grosso / DRE Tangará da Serra). O sistema faz o cruzamento dos alunos da planilha com os alunos já cadastrados no Supabase (por `cod_aluno` primeiro, depois por similaridade de nome), puxa o telefone do responsável do banco, e exibe tudo em um painel com filtros, alertas de infrequência e status da FICAI.

---

## Stack do projeto

- **Next.js 14+** com App Router e TypeScript
- **Supabase** (PostgreSQL + Auth + RLS)
- **Tailwind CSS**
- **shadcn/ui** para componentes base
- **papaparse** para parsing de CSV (instalar se não existir)

---

## O que implementar — lista de arquivos

Criar ou modificar os seguintes arquivos. O código completo de cada um está na seção abaixo.

```
supabase/migrations/20260602_000000_ficai_importacoes.sql
types/ficai.ts
lib/ficai/parser.ts
lib/ficai/queries.ts
hooks/useFICAIPanel.ts
components/psicossocial/ficai/FICAIPanel.tsx
components/psicossocial/ficai/FICAIUpload.tsx
components/psicossocial/ficai/FICAIStats.tsx
components/psicossocial/ficai/FICAITable.tsx
components/psicossocial/ficai/FICAIDetail.tsx
app/(dashboard)/psicossocial/ficai/page.tsx
```

Além disso, **adicionar o link de navegação** para `/psicossocial/ficai` no menu lateral, dentro da seção Psicossocial (ou criar a seção se não existir).

---

## Regras de negócio

### Planilha CSV de entrada
Colunas relevantes (podem vir com encoding UTF-8 ou Latin-1):
- `Cod Aluno` → chave primária do aluno no sistema estadual
- `Nome Aluno`
- `Turma`, `Turno`, `Modalidade`
- `Perc Faltas Geral Final` (usa este; fallback: `Perc Faltas Geral`)
- `Perc Faltas Final 1 Bim` (fallback: `Perc Faltas 1 Bim`)
- `Perc Faltas Final 2 Bim` (fallback: `Perc Faltas 2 Bim`)
- `Data Abertura Ficha Ficai` → vazio ou "Não Aberto" = não tem FICAI
- `Data Encaminhamento Conselho` → "Não encaminhado" = não encaminhado

### Cruzamento com Supabase
1. Tentar match exato por `cod_aluno` (INT) na tabela `alunos`
2. Se não encontrar, usar similaridade Jaccard nas palavras do nome (ignorando preposições: DE, DA, DO, DOS, DAS, E)
3. Match aceito se score ≥ 0.45
4. Puxar do Supabase: `telefone` e/ou `telefone_responsavel`, `nome_responsavel`

### Alertas de infrequência
- **Verde**: < 10% de faltas
- **Laranja (⚠)**: ≥ 10% de faltas → `alerta = true`
- **Vermelho (🔴)**: ≥ 25% de faltas → `alertaGrave = true`

### Threshold legal FICAI (MT)
25% de faltas = obrigação legal de abrir FICAI. Destacar alunos que deveriam ter FICAI mas ainda não têm.

---

## Código completo de cada arquivo

---

### `supabase/migrations/20260602_000000_ficai_importacoes.sql`

```sql
-- Tabela para armazenar os dados importados da planilha FICAI
CREATE TABLE IF NOT EXISTS ficai_importacoes (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  ano             INTEGER      NOT NULL,
  cod_aluno       BIGINT,
  cod_matricula   BIGINT,
  nome_aluno      TEXT         NOT NULL,
  turma           TEXT,
  turno           TEXT,
  modalidade      TEXT,

  -- Frequência
  perc_faltas_geral   INTEGER,
  perc_faltas_1bim    INTEGER,
  perc_faltas_2bim    INTEGER,

  -- FICAI
  ficai_aberto        BOOLEAN  DEFAULT FALSE,
  data_ficai          TEXT,
  encaminhado         BOOLEAN  DEFAULT FALSE,
  data_encaminhamento TEXT,

  -- Referência ao aluno cadastrado no sistema
  aluno_id        UUID         REFERENCES alunos(id) ON DELETE SET NULL,
  match_score     FLOAT,

  -- Auditoria
  importado_em    TIMESTAMPTZ  DEFAULT NOW(),
  importado_por   UUID         REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS ficai_importacoes_cod_aluno_idx ON ficai_importacoes (cod_aluno);
CREATE INDEX IF NOT EXISTS ficai_importacoes_ano_idx       ON ficai_importacoes (ano);
CREATE UNIQUE INDEX IF NOT EXISTS ficai_importacoes_uniq   ON ficai_importacoes (cod_aluno, ano)
  WHERE cod_aluno IS NOT NULL;

-- Row Level Security
ALTER TABLE ficai_importacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem gerenciar importações FICAI"
  ON ficai_importacoes
  FOR ALL
  USING (auth.role() = 'authenticated');
```

---

### `types/ficai.ts`

```typescript
// Estrutura raw do CSV (colunas com espaços como no arquivo exportado)
export interface FICAICSVRow {
  Ano: string
  DRE: string
  Municipio: string
  'Cod Lotacao': string
  Lotacao: string
  Turma: string
  'Cod Matriz': string
  Matriz: string
  'Etapa Educacenso': string
  Modalidade: string
  Turno: string
  'Cod Matricula': string
  'Cod Aluno': string
  'Nome Aluno': string
  Idade: string
  EJA: string
  'CH Anual': string
  'TF Geral': string
  'TF Geral Final': string
  'Perc Faltas Geral': string
  'Perc Faltas Geral Final': string
  'Qtde Lancamentos': string
  'Perc Faltas Lancamento': string
  'Perc Faltas Lancamento Final': string
  'TF 1 Bim': string
  'TF Final 1 Bim': string
  'Perc Faltas 1 Bim': string
  'Perc Faltas Final 1 Bim': string
  'TF 2 Bim': string
  'TF Final 2 Bim': string
  'Perc Faltas 2 Bim': string
  'Perc Faltas Final 2 Bim': string
  'Data Abertura Ficha Ficai': string
  'Data Encaminhamento Conselho': string
}

// Aluno conforme cadastrado no Supabase (adapte os campos ao schema real do projeto)
export interface AlunoRecord {
  id: string
  cod_aluno: number | null
  nome: string
  telefone: string | null
  nome_responsavel: string | null
  telefone_responsavel: string | null
}

// Entrada processada: dados do CSV + dados puxados do Supabase
export interface FICAIEntry {
  // Identificação
  nomeAluno: string
  turma: string
  turno: string
  modalidade: string
  codAluno: number | null
  codMatricula: number | null

  // Frequência
  faltasGeral: number | null
  faltas1Bim: number | null
  faltas2Bim: number | null

  // FICAI
  ficaiAberto: boolean
  dataFicai: string
  encaminhado: boolean
  dataEncaminhamento: string

  // Dados do Supabase (match)
  alunoId: string | null
  telefone: string | null
  nomeResponsavel: string | null
  telefoneResponsavel: string | null
  matchScore: number
  matched: boolean

  // Alertas (derivados)
  alerta: boolean       // >= 10%
  alertaGrave: boolean  // >= 25%
  ficaiNecessaria: boolean  // >= 25% e sem FICAI aberta
}

export type FICAIFilterKey =
  | 'todos'
  | 'alerta'
  | 'grave'
  | 'ficai_necessaria'
  | 'ficai_aberta'
  | 'encaminhado'
  | 'sem_tel'

export interface FICAIStats {
  total: number
  comAlerta: number
  alertaGrave: number
  ficaiAberta: number
  encaminhados: number
  comTelefone: number
  ficaiNecessaria: number
}
```

---

### `lib/ficai/parser.ts`

```typescript
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
```

---

### `lib/ficai/queries.ts`

```typescript
import { createClient } from '@/lib/supabase/client'
import type { AlunoRecord, FICAIEntry } from '@/types/ficai'

/**
 * Busca todos os alunos do Supabase para o match com a planilha.
 * Adapte o nome da tabela e colunas ao schema real do projeto.
 */
export async function fetchAlunosParaMatch(): Promise<AlunoRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('alunos')
    .select('id, cod_aluno, nome, telefone, nome_responsavel, telefone_responsavel')
    .order('nome')

  if (error) throw new Error(`Erro ao buscar alunos: ${error.message}`)
  return (data ?? []) as AlunoRecord[]
}

/**
 * Salva os dados processados da planilha na tabela ficai_importacoes.
 * Upsert por (cod_aluno, ano) para rodar re-imports com segurança.
 */
export async function upsertFICAIImport(entries: FICAIEntry[]): Promise<void> {
  const supabase = createClient()
  const ano = new Date().getFullYear()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const rows = entries.map(e => ({
    ano,
    cod_aluno:          e.codAluno,
    cod_matricula:      e.codMatricula,
    nome_aluno:         e.nomeAluno,
    turma:              e.turma,
    turno:              e.turno,
    modalidade:         e.modalidade,
    perc_faltas_geral:  e.faltasGeral,
    perc_faltas_1bim:   e.faltas1Bim,
    perc_faltas_2bim:   e.faltas2Bim,
    ficai_aberto:       e.ficaiAberto,
    data_ficai:         e.dataFicai,
    encaminhado:        e.encaminhado,
    data_encaminhamento: e.dataEncaminhamento,
    aluno_id:           e.alunoId,
    match_score:        e.matchScore,
    importado_por:      user?.id ?? null,
    importado_em:       new Date().toISOString(),
  }))

  // Upsert em lotes de 200 para não estourar o request
  const BATCH = 200
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('ficai_importacoes')
      .upsert(batch, { onConflict: 'cod_aluno,ano' })

    if (error) throw new Error(`Erro ao salvar importação (lote ${i}): ${error.message}`)
  }
}
```

---

### `hooks/useFICAIPanel.ts`

```typescript
import { useState, useCallback, useMemo } from 'react'
import { processCSV, readFileAsText } from '@/lib/ficai/parser'
import { fetchAlunosParaMatch, upsertFICAIImport } from '@/lib/ficai/queries'
import type { FICAIEntry, FICAIFilterKey, FICAIStats } from '@/types/ficai'
import { normalizeName, jaccardScore } from '@/lib/ficai/parser'
import { toast } from 'sonner'

export function useFICAIPanel() {
  const [entries, setEntries]       = useState<FICAIEntry[]>([])
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [filter, setFilter]         = useState<FICAIFilterKey>('todos')
  const [search, setSearch]         = useState('')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // ── Upload + processamento ──────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Selecione um arquivo CSV')
      return
    }

    setLoading(true)
    setEntries([])
    setSelectedIdx(null)

    try {
      const [rawText, alunos] = await Promise.all([
        readFileAsText(file),
        fetchAlunosParaMatch(),
      ])

      const processed = processCSV(rawText, alunos)

      if (processed.length === 0) {
        toast.error('Nenhum aluno encontrado no arquivo')
        return
      }

      setEntries(processed)
      const comMatch = processed.filter(e => e.matched).length
      toast.success(
        `${processed.length} alunos carregados · ${comMatch} cruzados com o sistema`
      )
    } catch (err) {
      toast.error('Erro ao processar planilha: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Salvar no Supabase ──────────────────────────────────────────────────
  const saveToDatabase = useCallback(async () => {
    if (entries.length === 0) return
    setSaving(true)
    try {
      await upsertFICAIImport(entries)
      toast.success('Importação salva no banco com sucesso')
    } catch (err) {
      toast.error('Erro ao salvar: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }, [entries])

  // ── Reset ───────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setEntries([])
    setFilter('todos')
    setSearch('')
    setSelectedIdx(null)
  }, [])

  // ── Filtro + busca ──────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    let rows = entries

    if (search.trim()) {
      const q = normalizeName(search)
      rows = rows.filter(r => {
        const score = jaccardScore(q, normalizeName(r.nomeAluno))
        return score > 0.3 || normalizeName(r.nomeAluno).join(' ').includes(q.join(' '))
      })
    }

    switch (filter) {
      case 'alerta':         return rows.filter(r => r.alerta)
      case 'grave':          return rows.filter(r => r.alertaGrave)
      case 'ficai_necessaria': return rows.filter(r => r.ficaiNecessaria)
      case 'ficai_aberta':   return rows.filter(r => r.ficaiAberto)
      case 'encaminhado':    return rows.filter(r => r.encaminhado)
      case 'sem_tel':        return rows.filter(r => !r.matched)
      default:               return rows
    }
  }, [entries, filter, search])

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo<FICAIStats>(() => ({
    total:          entries.length,
    comAlerta:      entries.filter(r => r.alerta).length,
    alertaGrave:    entries.filter(r => r.alertaGrave).length,
    ficaiAberta:    entries.filter(r => r.ficaiAberto).length,
    encaminhados:   entries.filter(r => r.encaminhado).length,
    comTelefone:    entries.filter(r => r.matched).length,
    ficaiNecessaria: entries.filter(r => r.ficaiNecessaria).length,
  }), [entries])

  // ── Seleção de linha ────────────────────────────────────────────────────
  const toggleSelected = useCallback((idx: number) => {
    setSelectedIdx(prev => (prev === idx ? null : idx))
  }, [])

  const selectedEntry = selectedIdx !== null ? filteredEntries[selectedIdx] ?? null : null

  return {
    entries,
    filteredEntries,
    stats,
    loading,
    saving,
    filter,
    setFilter,
    search,
    setSearch,
    selectedIdx,
    selectedEntry,
    toggleSelected,
    processFile,
    saveToDatabase,
    reset,
    hasData: entries.length > 0,
  }
}
```

---

### `components/psicossocial/ficai/FICAIUpload.tsx`

```tsx
'use client'

import { useCallback, useState } from 'react'
import { Upload, TableIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FICAIUploadProps {
  onFile: (file: File) => void
  loading: boolean
}

export function FICAIUpload({ onFile, loading }: FICAIUploadProps) {
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (file) onFile(file)
    },
    [onFile]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      handleFile(e.dataTransfer.files[0])
    },
    [handleFile]
  )

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-colors',
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/50'
      )}
    >
      <div className="rounded-full bg-muted p-4">
        <TableIcon className="h-8 w-8 text-muted-foreground" />
      </div>

      <div>
        <p className="text-base font-medium">Planilha de frequência FICAI</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste o arquivo CSV ou clique para selecionar
        </p>
      </div>

      <label className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
        'border-input bg-background hover:bg-accent hover:text-accent-foreground',
        loading && 'pointer-events-none opacity-50'
      )}>
        <Upload className="h-4 w-4" />
        {loading ? 'Processando...' : 'Selecionar arquivo'}
        <input
          type="file"
          accept=".csv"
          className="sr-only"
          disabled={loading}
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </label>

      <div className="flex flex-wrap justify-center gap-2">
        {['Nome Aluno', 'Cod Aluno', '% Faltas', 'FICAI', '→ cruza Supabase', 'Telefone'].map(t => (
          <span
            key={t}
            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
```

---

### `components/psicossocial/ficai/FICAIStats.tsx`

```tsx
import {
  Users, AlertTriangle, Flame, FileWarning, Send, Phone, FileX
} from 'lucide-react'
import type { FICAIStats } from '@/types/ficai'

interface FICAIStatsProps {
  stats: FICAIStats
}

export function FICAIStatsCards({ stats }: FICAIStatsProps) {
  const cards = [
    { label: 'Total alunos',    value: stats.total,           icon: Users,         variant: 'default' },
    { label: 'Em alerta',       value: stats.comAlerta,       icon: AlertTriangle, variant: 'warning' },
    { label: 'Alerta grave',    value: stats.alertaGrave,     icon: Flame,         variant: 'danger'  },
    { label: 'FICAI necessária',value: stats.ficaiNecessaria, icon: FileX,         variant: 'danger'  },
    { label: 'FICAI aberta',    value: stats.ficaiAberta,     icon: FileWarning,   variant: 'info'    },
    { label: 'Encaminhados',    value: stats.encaminhados,    icon: Send,          variant: 'success' },
    { label: 'Com telefone',    value: stats.comTelefone,     icon: Phone,         variant: 'default' },
  ] as const

  const variantClasses: Record<string, string> = {
    default: 'bg-muted text-muted-foreground',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    danger:  'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    info:    'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    success: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {cards.map(card => {
        const Icon = card.icon
        const cls = variantClasses[card.variant]
        return (
          <div key={card.label} className={`rounded-lg p-3 ${cls}`}>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium opacity-80">
              <Icon className="h-3.5 w-3.5" />
              {card.label}
            </div>
            <p className="text-2xl font-semibold text-foreground">{card.value}</p>
          </div>
        )
      })}
    </div>
  )
}
```

---

### `components/psicossocial/ficai/FICAITable.tsx`

```tsx
'use client'

import { AlertTriangle, CheckCircle, Flame, Phone } from 'lucide-react'
import type { FICAIEntry } from '@/types/ficai'
import { cn } from '@/lib/utils'

interface FICAITableProps {
  entries: FICAIEntry[]
  total: number
  selectedIdx: number | null
  onSelect: (idx: number) => void
}

function PctCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  const cls =
    value >= 25 ? 'text-red-600 font-semibold'
    : value >= 10 ? 'text-amber-600 font-medium'
    : 'text-green-600'
  return <span className={cls}>{value}%</span>
}

function AlertIcon({ entry }: { entry: FICAIEntry }) {
  if (entry.alertaGrave) return <Flame className="h-3.5 w-3.5 text-red-500 shrink-0" />
  if (entry.alerta)      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
  return <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
}

function FICAIBadge({ entry }: { entry: FICAIEntry }) {
  if (entry.ficaiNecessaria)
    return <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">Necessária!</span>
  if (entry.encaminhado)
    return <span className="rounded-md bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">Encaminhado</span>
  if (entry.ficaiAberto)
    return <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{entry.dataFicai}</span>
  return <span className="text-xs text-muted-foreground">Não aberta</span>
}

export function FICAITable({ entries, total, selectedIdx, onSelect }: FICAITableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Nenhum aluno encontrado
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur">
          <tr className="border-b text-xs font-medium text-muted-foreground">
            <th className="px-3 py-2.5 text-left">Aluno</th>
            <th className="px-3 py-2.5 text-left">Turma</th>
            <th className="px-3 py-2.5 text-left">Telefone</th>
            <th className="px-3 py-2.5 text-center">Geral</th>
            <th className="px-3 py-2.5 text-center">1°Bim</th>
            <th className="px-3 py-2.5 text-center">2°Bim</th>
            <th className="px-3 py-2.5 text-left">FICAI</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr
              key={idx}
              onClick={() => onSelect(idx)}
              className={cn(
                'cursor-pointer border-b transition-colors last:border-0',
                selectedIdx === idx
                  ? 'bg-primary/5'
                  : idx % 2 === 0
                    ? 'bg-background hover:bg-muted/40'
                    : 'bg-muted/20 hover:bg-muted/40'
              )}
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <AlertIcon entry={entry} />
                  <div>
                    <p className="max-w-[200px] truncate font-medium leading-tight">
                      {entry.nomeAluno}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.turno}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{entry.turma}</td>
              <td className="px-3 py-2">
                {entry.telefone ? (
                  <a
                    href={`tel:${entry.telefone}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <Phone className="h-3 w-3" />
                    {entry.telefone}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-center"><PctCell value={entry.faltasGeral} /></td>
              <td className="px-3 py-2 text-center"><PctCell value={entry.faltas1Bim} /></td>
              <td className="px-3 py-2 text-center"><PctCell value={entry.faltas2Bim} /></td>
              <td className="px-3 py-2"><FICAIBadge entry={entry} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-right text-xs text-muted-foreground">
        {entries.length} de {total} alunos · clique na linha para detalhes
      </p>
    </div>
  )
}
```

---

### `components/psicossocial/ficai/FICAIDetail.tsx`

```tsx
import { X, Phone } from 'lucide-react'
import type { FICAIEntry } from '@/types/ficai'

interface FICAIDetailProps {
  entry: FICAIEntry
  onClose: () => void
}

export function FICAIDetail({ entry, onClose }: FICAIDetailProps) {
  const fields = [
    { label: '% Faltas geral',    value: entry.faltasGeral !== null ? `${entry.faltasGeral}%` : '—' },
    { label: '1° Bimestre',       value: entry.faltas1Bim  !== null ? `${entry.faltas1Bim}%`  : '—' },
    { label: '2° Bimestre',       value: entry.faltas2Bim  !== null ? `${entry.faltas2Bim}%`  : '—' },
    { label: 'Telefone aluno',    value: entry.telefone || 'Não cadastrado' },
    { label: 'Responsável',       value: entry.nomeResponsavel || '—' },
    { label: 'Tel. responsável',  value: entry.telefoneResponsavel || '—' },
    { label: 'FICAI',             value: entry.ficaiAberto ? entry.dataFicai : 'Não aberta' },
    { label: 'Encaminhamento',    value: entry.encaminhado ? entry.dataEncaminhamento : 'Não encaminhado' },
    { label: 'Match Supabase',    value: entry.matched ? `${Math.round(entry.matchScore * 100)}%` : 'Sem correspondência' },
  ]

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-semibold">{entry.nomeAluno}</p>
          <p className="text-sm text-muted-foreground">
            {entry.turma} · {entry.turno}
            {entry.nomeResponsavel && ` · Resp: ${entry.nomeResponsavel}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="Fechar detalhes"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {fields.map(f => (
          <div key={f.label} className="rounded-lg bg-background p-2.5">
            <p className="text-xs text-muted-foreground">{f.label}</p>
            {f.label.startsWith('Tel') && f.value !== '—' && f.value !== 'Não cadastrado' ? (
              <a href={`tel:${f.value}`} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                <Phone className="h-3 w-3" />{f.value}
              </a>
            ) : (
              <p className="text-sm font-medium">{f.value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### `components/psicossocial/ficai/FICAIPanel.tsx`  ← componente principal

```tsx
'use client'

import { useFICAIPanel } from '@/hooks/useFICAIPanel'
import { FICAIUpload }    from './FICAIUpload'
import { FICAIStatsCards }from './FICAIStats'
import { FICAITable }     from './FICAITable'
import { FICAIDetail }    from './FICAIDetail'
import { Button }         from '@/components/ui/button'
import { Input }          from '@/components/ui/input'
import { cn }             from '@/lib/utils'
import { RefreshCw, Save, Loader2 } from 'lucide-react'
import type { FICAIFilterKey } from '@/types/ficai'

const FILTERS: Array<{ key: FICAIFilterKey; label: string }> = [
  { key: 'todos',           label: 'Todos' },
  { key: 'alerta',          label: '⚠ Alerta +10%' },
  { key: 'grave',           label: '🔴 Grave +25%' },
  { key: 'ficai_necessaria',label: '❗ FICAI necessária' },
  { key: 'ficai_aberta',    label: 'FICAI aberta' },
  { key: 'encaminhado',     label: 'Encaminhado' },
  { key: 'sem_tel',         label: 'Sem telefone' },
]

export function FICAIPanel() {
  const {
    hasData,
    filteredEntries,
    stats,
    loading,
    saving,
    filter,
    setFilter,
    search,
    setSearch,
    selectedIdx,
    selectedEntry,
    toggleSelected,
    processFile,
    saveToDatabase,
    reset,
  } = useFICAIPanel()

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Painel FICAI</h2>
          <p className="text-sm text-muted-foreground">
            Infrequência escolar · Módulo Psicossocial
          </p>
        </div>
        {hasData && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={loading || saving}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Nova planilha
            </Button>
            <Button
              size="sm"
              onClick={saveToDatabase}
              disabled={saving}
            >
              {saving
                ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Salvando...</>
                : <><Save className="mr-1.5 h-3.5 w-3.5" />Salvar no banco</>
              }
            </Button>
          </div>
        )}
      </div>

      {/* Upload ou painel */}
      {!hasData ? (
        <FICAIUpload onFile={processFile} loading={loading} />
      ) : (
        <>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cruzando alunos com o banco...
            </div>
          )}

          {/* Stats */}
          <FICAIStatsCards stats={stats} />

          {/* Filtros + busca */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar aluno..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-48 text-sm"
            />
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                  filter === f.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tabela */}
          <FICAITable
            entries={filteredEntries}
            total={stats.total}
            selectedIdx={selectedIdx}
            onSelect={toggleSelected}
          />

          {/* Detalhe da linha selecionada */}
          {selectedEntry && (
            <FICAIDetail
              entry={selectedEntry}
              onClose={() => toggleSelected(selectedIdx!)}
            />
          )}
        </>
      )}
    </div>
  )
}
```

---

### `app/(dashboard)/psicossocial/ficai/page.tsx`

```tsx
import { FICAIPanel } from '@/components/psicossocial/ficai/FICAIPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FICAI · Psicossocial | SIGMILITAR',
  description: 'Painel de infrequência escolar e acompanhamento da FICAI',
}

export default function FICAIPage() {
  return (
    <main className="container max-w-7xl space-y-6 py-6">
      <FICAIPanel />
    </main>
  )
}
```

---

## Dependências a instalar (se ausentes)

```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

---

## Ajustes importantes ao integrar no projeto real

1. **Tabela `alunos`**: verificar o nome real da tabela e das colunas no Supabase do projeto. Os campos `cod_aluno`, `telefone`, `nome_responsavel`, `telefone_responsavel` podem ter nomes diferentes.

2. **`createClient`**: usar o helper de cliente do Supabase já existente no projeto (`@/lib/supabase/client` ou equivalente).

3. **`cn` / `shadcn/ui`**: se o projeto usa outro sistema de classes, adaptar os componentes de UI (Button, Input) para os equivalentes existentes.

4. **Navegação**: adicionar entrada no menu lateral para a rota `/psicossocial/ficai` com ícone `FileWarning` do lucide-react.

5. **Rodar a migration** no Supabase Studio ou via CLI antes de usar o botão "Salvar no banco":
   ```bash
   supabase db push
   ```
