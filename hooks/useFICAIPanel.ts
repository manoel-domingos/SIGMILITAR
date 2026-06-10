import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { readSpreadsheet, processRows } from '@/lib/ficai/parser'
import { fetchAlunosParaMatch, upsertFICAIImport, fetchSavedFICAIImports, updateFICAIImportStatus, updateStudentContacts, fetchImportSessions } from '@/lib/ficai/queries'
import type { FICAIEntry, FICAIFilterKey, FICAIStats, FICAIImportSession } from '@/types/ficai'
import { normalizeName, jaccardScore } from '@/lib/ficai/parser'
import { useAppContext } from '@/lib/store'
import { toast } from 'sonner'

export function useFICAIPanel() {
  const { activeSchoolContext } = useAppContext()
  const [entries, setEntries]       = useState<FICAIEntry[]>([])
  const [loading, setLoading]       = useState(false)
  const [filter, setFilter]         = useState<FICAIFilterKey>('todos')
  const [search, setSearch]         = useState('')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sessions, setSessions] = useState<FICAIImportSession[]>([])
  const [selectedSession, setSelectedSession] = useState<FICAIImportSession | null>(null)
  const [currentFileName, setCurrentFileName] = useState<string>('Planilha')

  const setSaved = useCallback(() => {
    setSavingStatus('saved')
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSavingStatus('idle'), 1500)
  }, [])

  // ── Carregar histórico do banco na inicialização ────────────────────────
  const loadSavedData = useCallback(async () => {
    if (!activeSchoolContext) return
    setLoading(true)
    try {
      const [data, sessionData] = await Promise.all([
        fetchSavedFICAIImports(activeSchoolContext),
        fetchImportSessions(activeSchoolContext),
      ])
      setEntries(data)
      setSessions(sessionData)
    } catch (err) {
      console.error('[FICAI] Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }, [activeSchoolContext])

  useEffect(() => {
    loadSavedData()
  }, [loadSavedData])

  // ── Upload + processamento + auto-save ─────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Selecione um arquivo CSV ou XLSX')
      return
    }

    setLoading(true)
    setEntries([])
    setSelectedIdx(null)
    setCurrentFileName(file.name)

    try {
      const [rows, alunos] = await Promise.all([
        readSpreadsheet(file),
        fetchAlunosParaMatch(activeSchoolContext || ''),
      ])

      const processed = processRows(rows, alunos)

      if (processed.length === 0) {
        toast.error('Nenhum aluno encontrado no arquivo')
        return
      }

      setEntries(processed)
      const comMatch = processed.filter(e => e.matched).length
      toast.success(
        `${processed.length} alunos carregados · ${comMatch} cruzados com o sistema`
      )

      // Auto-save
      setSavingStatus('saving')
      await upsertFICAIImport(processed, activeSchoolContext || undefined, file.name)
      const saved = await fetchSavedFICAIImports(activeSchoolContext || '')
      setEntries(saved)
      const newSessions = await fetchImportSessions(activeSchoolContext || '')
      setSessions(newSessions)
      setSaved()
    } catch (err) {
      setSavingStatus('idle')
      toast.error('Erro ao processar planilha: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [activeSchoolContext, setSaved])

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
      case 'grave':            return rows.filter(r => r.alertaGrave)
      case 'ficai_necessaria': return rows.filter(r => r.ficaiNecessaria)
      case 'ficai_aberta':     return rows.filter(r => r.ficaiAberto)
      case 'encaminhado':      return rows.filter(r => r.encaminhado)
      case 'sem_tel':          return rows.filter(r => !r.matched)
      default:                 return rows
    }
  }, [entries, filter, search])

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo<FICAIStats>(() => ({
    total:           entries.length,
    comAlerta:       entries.filter(r => r.alerta).length,
    alertaGrave:     entries.filter(r => r.alertaGrave).length,
    ficaiAberta:     entries.filter(r => r.ficaiAberto).length,
    encaminhados:    entries.filter(r => r.encaminhado).length,
    comTelefone:     entries.filter(r => r.matched).length,
    ficaiNecessaria: entries.filter(r => r.ficaiNecessaria).length,
  }), [entries])

  // ── Seleção de linha ────────────────────────────────────────────────────
  const toggleSelected = useCallback((idx: number) => {
    setSelectedIdx(prev => (prev === idx ? null : idx))
  }, [])

  const selectedEntry = selectedIdx !== null ? filteredEntries[selectedIdx] ?? null : null

  // ── Atualizar status de um registro ─────────────────────────────────────
  const updateStatus = useCallback(async (idx: number, status: 'nao_aberta' | 'ficai_necessaria' | 'ficai_aberta' | 'encaminhado', date?: string) => {
    const entryToUpdate = filteredEntries[idx];
    if (!entryToUpdate) return;

    const realIdx = entries.findIndex(e => e.codAluno === entryToUpdate.codAluno);
    if (realIdx === -1) return;

    const ficaiAberto = status === 'ficai_aberta';
    const dataFicai = status === 'ficai_aberta' ? (date || '') : '';
    const encaminhado = status === 'encaminhado';
    const dataEncaminhamento = status === 'encaminhado' ? (date || '') : '';
    const ficaiNecessaria = status === 'ficai_necessaria';

    setEntries(prev => {
      const next = [...prev];
      next[realIdx] = {
        ...next[realIdx],
        ficaiAberto,
        dataFicai,
        encaminhado,
        dataEncaminhamento,
        ficaiNecessaria
      };
      return next;
    });

    if (entryToUpdate.codAluno) {
      setSavingStatus('saving')
      try {
        const ano = new Date().getFullYear();
        await updateFICAIImportStatus(entryToUpdate.codAluno, ano, activeSchoolContext || '', {
          ficai_aberto: ficaiAberto,
          data_ficai: dataFicai,
          encaminhado,
          data_encaminhamento: dataEncaminhamento
        });
        setSaved()
      } catch (err) {
        setSavingStatus('idle')
        console.error('[FICAI] Erro ao atualizar status no Supabase:', err);
        toast.error('Erro ao salvar alteração de status no banco de dados.');
      }
    }
  }, [entries, filteredEntries, activeSchoolContext, setSaved]);

  const manualSave = useCallback(async () => {
    if (!entries.length || !activeSchoolContext) return
    setSavingStatus('saving')
    try {
      await upsertFICAIImport(entries, activeSchoolContext, currentFileName)
      const newSessions = await fetchImportSessions(activeSchoolContext)
      setSessions(newSessions)
      setSaved()
    } catch (err) {
      setSavingStatus('idle')
      toast.error('Erro ao salvar: ' + (err as Error).message)
    }
  }, [entries, activeSchoolContext, currentFileName, setSaved])

  const addContactToStudent = useCallback(async (studentId: string, contactName: string, contactPhone: string) => {
    const matchedEntry = entries.find(e => e.alunoId === studentId);
    const currentContacts = matchedEntry?.contacts || [];
    const updatedContacts = [...currentContacts, { name: contactName, phone: contactPhone }];

    setSavingStatus('saving')
    try {
      await updateStudentContacts(studentId, updatedContacts);

      setEntries(prev => prev.map(e => {
        if (e.alunoId === studentId) {
          return {
            ...e,
            telefone: contactPhone,
            telefoneResponsavel: contactPhone,
            nomeResponsavel: contactName,
            contacts: updatedContacts
          };
        }
        return e;
      }));

      setSaved()
      toast.success('Contato registrado com sucesso!');
    } catch (err) {
      setSavingStatus('idle')
      console.error('[FICAI] Erro ao adicionar contato:', err);
      toast.error('Erro ao salvar contato no banco de dados.');
    }
  }, [entries, setSaved]);

  return {
    entries,
    filteredEntries,
    stats,
    loading,
    savingStatus,
    filter,
    setFilter,
    search,
    setSearch,
    selectedIdx,
    selectedEntry,
    toggleSelected,
    processFile,
    reset,
    updateStatus,
    addContactToStudent,
    manualSave,
    sessions,
    selectedSession,
    setSelectedSession,
    hasData: entries.length > 0,
  }
}
