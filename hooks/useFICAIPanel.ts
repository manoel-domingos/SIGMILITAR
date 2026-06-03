import { useState, useCallback, useMemo, useEffect } from 'react'
import { processCSV, readFileAsText } from '@/lib/ficai/parser'
import { fetchAlunosParaMatch, upsertFICAIImport, fetchSavedFICAIImports, updateFICAIImportStatus, updateStudentContacts } from '@/lib/ficai/queries'
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

  // ── Carregar histórico do banco na inicialização ────────────────────────
  const loadSavedData = useCallback(async () => {
    if (!activeSchoolContext) return
    setLoading(true)
    try {
      const data = await fetchSavedFICAIImports(activeSchoolContext)
      setEntries(data)
    } catch (err) {
      console.error('[FICAI] Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }, [activeSchoolContext])

  useEffect(() => {
    loadSavedData()
  }, [loadSavedData])

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
      try {
        const ano = new Date().getFullYear();
        await updateFICAIImportStatus(entryToUpdate.codAluno, ano, {
          ficai_aberto: ficaiAberto,
          data_ficai: dataFicai,
          encaminhado,
          data_encaminhamento: dataEncaminhamento
        });
        toast.success(`Status de ${entryToUpdate.nomeAluno} atualizado com sucesso!`);
      } catch (err) {
        console.error('[FICAI] Erro ao atualizar status no Supabase:', err);
        toast.error('Erro ao salvar alteração de status no banco de dados.');
      }
    }
  }, [entries, filteredEntries]);

  const addContactToStudent = useCallback(async (studentId: string, contactName: string, contactPhone: string) => {
    try {
      const matchedEntry = entries.find(e => e.alunoId === studentId);
      const currentContacts = matchedEntry?.contacts || [];
      
      const updatedContacts = [...currentContacts, { name: contactName, phone: contactPhone }];
      
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
      
      toast.success('Contato registrado com sucesso!');
    } catch (err) {
      console.error('[FICAI] Erro ao adicionar contato:', err);
      toast.error('Erro ao salvar contato no banco de dados.');
    }
  }, [entries]);

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
    updateStatus,
    addContactToStudent,
    hasData: entries.length > 0,
  }
}
