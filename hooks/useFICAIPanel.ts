import { useState, useCallback, useMemo } from 'react'
import { processCSV, readFileAsText } from '@/lib/ficai/parser'
import { fetchAlunosParaMatch, upsertFICAIImport } from '@/lib/ficai/queries'
import type { FICAIEntry, FICAIFilterKey, FICAIStats } from '@/types/ficai'
import { normalizeName, jaccardScore } from '@/lib/ficai/parser'
import { useAppContext } from '@/lib/store'
import { toast } from 'sonner'

export function useFICAIPanel() {
  const { activeSchoolContext } = useAppContext()
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
      await upsertFICAIImport(entries, activeSchoolContext || undefined)
      toast.success('Importação salva no banco com sucesso')
    } catch (err) {
      toast.error('Erro ao salvar: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }, [entries, activeSchoolContext])

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
