import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { readSpreadsheet, processRows } from '@/lib/ficai/parser'
import {
  fetchAlunosParaMatch,
  upsertFICAIImport,
  fetchSavedFICAIImports,
  updateFICAIImportStatus,
  updateStudentContacts,
  fetchImportSessions,
  createImportSession,
  updateImportSession,
  appendFICAIAcao,
  buildSessionStats,
  getCurrentUserInfo,
} from '@/lib/ficai/queries'
import type { FICAIEntry, FICAIFilterKey, FICAIStats, FICAIImportSession } from '@/types/ficai'
import { normalizeName, jaccardScore } from '@/lib/ficai/parser'
import { useAppContext } from '@/lib/store'
import { getDbSchoolId } from '@/lib/useTenantConfig'
import { toast } from 'sonner'

export function useFICAIPanel() {
  const { activeSchoolContext } = useAppContext()
  // Normaliza para o school_id real do banco (ex.: 'eecmprofjoaobatista' → 'joaobatista').
  // Todo o resto do app usa getDbSchoolId(); o FICAI precisa do mesmo para não
  // consultar um school_id inexistente → painel vazio / "subir planilha não faz nada".
  const schoolId = useMemo(
    () => (activeSchoolContext ? getDbSchoolId(activeSchoolContext) : ''),
    [activeSchoolContext]
  )
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
    if (!schoolId) return
    setLoading(true)
    try {
      const [data, sessionData] = await Promise.all([
        fetchSavedFICAIImports(schoolId),
        fetchImportSessions(schoolId),
      ])
      setEntries(data)
      setSessions(sessionData)
      if (sessionData.length > 0) setCurrentFileName(sessionData[0].nomeArquivo)
    } catch (err) {
      console.error('[FICAI] Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }, [schoolId])

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

    if (!schoolId) {
      toast.error('Nenhuma escola ativa selecionada — recarregue a página e tente de novo')
      return
    }

    setLoading(true)
    setEntries([])
    setSelectedIdx(null)
    setCurrentFileName(file.name)

    try {
      // 1. Parse primeiro — falha aqui é o único motivo legítimo de não exibir nada
      const rows = await readSpreadsheet(file)

      // 2. Cruzamento com cadastro é OPCIONAL (só preenche telefones). Falha não
      //    pode abortar a importação — antes derrubava tudo silenciosamente.
      let alunos: Awaited<ReturnType<typeof fetchAlunosParaMatch>> = []
      try {
        alunos = await fetchAlunosParaMatch(schoolId)
      } catch (matchErr) {
        console.warn('[FICAI] Falha ao cruzar alunos (seguindo sem telefones):', matchErr)
        toast.warning('Não foi possível cruzar telefones do cadastro — importando mesmo assim')
      }

      const processed = processRows(rows, alunos)

      if (processed.length === 0) {
        toast.error('Nenhum aluno encontrado no arquivo')
        return
      }

      // 3. Exibe imediatamente — a partir daqui o painel NUNCA fica vazio
      setEntries(processed)
      const comMatch = processed.filter(e => e.matched).length
      toast.success(
        `${processed.length} alunos carregados · ${comMatch} cruzados com o sistema`
      )

      // 4. Persistência — falha aqui mantém os dados na tela + erro explícito
      setSavingStatus('saving')
      try {
        await upsertFICAIImport(processed, schoolId)

        const { id: userId, name: userName } = await getCurrentUserInfo()
        const stats = buildSessionStats(processed)
        await createImportSession(schoolId, file.name, stats, userId, userName)

        const saved = await fetchSavedFICAIImports(schoolId)
        if (saved.length > 0) setEntries(saved) // guarda: nunca substituir por vazio
        const newSessions = await fetchImportSessions(schoolId)
        setSessions(newSessions)
        setSaved()
      } catch (persistErr) {
        setSavingStatus('idle')
        toast.error('Dados exibidos, mas falha ao salvar no banco: ' + (persistErr as Error).message)
      }
    } catch (err) {
      setSavingStatus('idle')
      toast.error('Erro ao processar planilha: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [schoolId, setSaved])

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

  // ── Labels legíveis de status para log ─────────────────────────────────
  function statusLabel(s: string): string {
    switch (s) {
      case 'nao_aberta':      return 'Não aberta'
      case 'ficai_necessaria': return '⚠️ Necessária'
      case 'ficai_aberta':    return '📝 Aberta'
      case 'encaminhado':     return '🚀 Encaminhado'
      default:                return s
    }
  }

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

    // status_manual: gravar escolha explícita só para necessaria/nao_aberta;
    // aberta/encaminhado têm campos próprios, manual fica null
    const statusManual: 'ficai_necessaria' | 'nao_aberta' | null =
      status === 'ficai_necessaria' ? 'ficai_necessaria'
      : status === 'nao_aberta' ? 'nao_aberta'
      : null

    const nowISO = new Date().toISOString()

    setEntries(prev => {
      const next = [...prev];
      next[realIdx] = {
        ...next[realIdx],
        ficaiAberto,
        dataFicai,
        encaminhado,
        dataEncaminhamento,
        ficaiNecessaria,
        statusManual,
      };
      return next;
    });

    if (entryToUpdate.codAluno) {
      setSavingStatus('saving')
      try {
        const ano = new Date().getFullYear();
        await updateFICAIImportStatus(entryToUpdate.codAluno, ano, schoolId, {
          ficai_aberto: ficaiAberto,
          data_ficai: dataFicai,
          encaminhado,
          data_encaminhamento: dataEncaminhamento,
          status_manual: statusManual,
        });

        // Registrar ação no histórico
        const { name: userName } = await getCurrentUserInfo()
        const oldLabel = statusLabel(
          entryToUpdate.encaminhado ? 'encaminhado'
          : entryToUpdate.ficaiAberto ? 'ficai_aberta'
          : entryToUpdate.ficaiNecessaria ? 'ficai_necessaria'
          : 'nao_aberta'
        )
        const newLabel = statusLabel(status)
        const acao = {
          data: nowISO,
          tipo: 'status' as const,
          descricao: `Status FICAI: ${oldLabel} → ${newLabel}`,
          usuario: userName,
        }
        try {
          await appendFICAIAcao(entryToUpdate.codAluno, ano, schoolId, acao)
          setEntries(prev => {
            const next = [...prev];
            const ri = next.findIndex(e => e.codAluno === entryToUpdate.codAluno);
            if (ri !== -1) {
              next[ri] = {
                ...next[ri],
                historicoAcoes: [...(next[ri].historicoAcoes || []), acao],
              }
            }
            return next;
          })
        } catch (logErr) {
          console.warn('[FICAI] Falha ao registrar ação de status:', logErr)
        }

        setSaved()
      } catch (err) {
        setSavingStatus('idle')
        console.error('[FICAI] Erro ao atualizar status no Supabase:', err);
        toast.error('Erro ao salvar alteração de status no banco de dados.');
      }
    }
  }, [entries, filteredEntries, schoolId, setSaved]);

  // ── Salvar manualmente (atualiza sessão existente, não cria nova) ────────
  const manualSave = useCallback(async () => {
    if (!entries.length || !schoolId) return
    setSavingStatus('saving')
    try {
      await upsertFICAIImport(entries, schoolId)
      const sessionStats = buildSessionStats(entries)

      if (sessions.length > 0) {
        // Atualizar sessão existente — não duplicar em "Importações Anteriores"
        await updateImportSession(sessions[0].id, sessionStats)
      } else {
        const { id: userId, name: userName } = await getCurrentUserInfo()
        await createImportSession(schoolId, currentFileName, sessionStats, userId, userName)
      }

      const newSessions = await fetchImportSessions(schoolId)
      setSessions(newSessions)
      setSaved()
    } catch (err) {
      setSavingStatus('idle')
      toast.error('Erro ao salvar: ' + (err as Error).message)
    }
  }, [entries, schoolId, currentFileName, sessions, setSaved])

  // ── Adicionar contato permanente ao aluno ───────────────────────────────
  const addContactToStudent = useCallback(async (studentId: string, contactName: string, contactPhone: string) => {
    const matchedEntry = entries.find(e => e.alunoId === studentId);
    const currentContacts = matchedEntry?.contacts || [];
    const updatedContacts = [...currentContacts, { name: contactName, phone: contactPhone }];

    setSavingStatus('saving')
    try {
      await updateStudentContacts(studentId, updatedContacts);

      const nowISO = new Date().toISOString()

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

      // Registrar ação no histórico (não bloqueia o save)
      if (matchedEntry?.codAluno) {
        const { name: userName } = await getCurrentUserInfo()
        const acao = {
          data: nowISO,
          tipo: 'contato' as const,
          descricao: `Contato adicionado: ${contactName} — ${contactPhone}`,
          usuario: userName,
        }
        try {
          const ano = new Date().getFullYear()
          await appendFICAIAcao(matchedEntry.codAluno, ano, schoolId, acao)
          setEntries(prev => prev.map(e => {
            if (e.alunoId === studentId) {
              return { ...e, historicoAcoes: [...(e.historicoAcoes || []), acao] }
            }
            return e
          }))
        } catch (logErr) {
          console.warn('[FICAI] Falha ao registrar ação de contato:', logErr)
        }
      }
    } catch (err) {
      setSavingStatus('idle')
      console.error('[FICAI] Erro ao adicionar contato:', err);
      toast.error('Erro ao salvar contato no banco de dados.');
    }
  }, [entries, schoolId, setSaved]);

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
