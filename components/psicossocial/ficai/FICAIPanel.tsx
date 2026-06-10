'use client';

import { useState } from 'react'
import { useFICAIPanel } from '@/hooks/useFICAIPanel'
import { FICAIUpload }    from './FICAIUpload'
import { FICAIStatsCards }from './FICAIStats'
import { FICAITable }     from './FICAITable'
import { FICAIDetail }    from './FICAIDetail'
import { cn }             from '@/lib/utils'
import { RefreshCw, Loader2, Heart, ArrowLeft, CheckCircle, ExternalLink, X, AlertTriangle, History, Save, Table as TableIcon } from 'lucide-react'
import type { FICAIFilterKey, FICAIImportSession } from '@/types/ficai'
import { useParams } from 'next/navigation'
import { useAppContext } from '@/lib/store'
import Link from 'next/link'

const FILTERS: Array<{ key: FICAIFilterKey; label: string }> = [
  { key: 'todos',           label: 'Todos' },
  { key: 'ficai_necessaria',label: '❗ FICAI necessária +10%' },
  { key: 'grave',           label: '🔴 Grave +15%' },
  { key: 'ficai_aberta',    label: 'FICAI aberta' },
  { key: 'encaminhado',     label: 'Encaminhado' },
  { key: 'sem_tel',         label: 'Sem telefone' },
]

const EXTERNAL_SYSTEMS = [
  {
    label: 'Sistema FICAI SEDUC',
    url: 'http://ficai.seduc.mt.gov.br/wplogin.aspx',
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20',
  },
  {
    label: 'Abandono Escolar SEDUC',
    url: 'https://abandonoescolar.seduc.mt.gov.br/entrar',
    color: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20',
  },
]

function ReminderModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500/10 p-2 border border-amber-500/20 shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">Lançar nos sistemas externos</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Registre também nos portais da SEDUC-MT</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-2">
          {EXTERNAL_SYSTEMS.map(sys => (
            <a
              key={sys.url}
              href={sys.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-extrabold transition-all active:scale-95',
                sys.color
              )}
            >
              {sys.label}
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </a>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 text-xs font-extrabold hover:opacity-90 transition active:scale-95"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}

function ImportSessionModal({ session, onClose }: { session: FICAIImportSession; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 border border-blue-500/20 shrink-0">
              <TableIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 break-all">{session.nomeArquivo}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {new Date(session.importadoEm).toLocaleString('pt-BR')}
                {session.importadoPorNome && ` · ${session.importadoPorNome}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total', value: session.totalAlunos, color: 'text-slate-700 dark:text-slate-300' },
            { label: 'Alertas ≥10%', value: session.totalAlertas, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Graves ≥15%', value: session.totalGraves, color: 'text-rose-600 dark:text-rose-400' },
            { label: 'FICAI Aberta', value: session.totalFicaisAbertas, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Encaminhados', value: session.totalEncaminhados, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Cruzados', value: session.totalMatched, color: 'text-violet-600 dark:text-violet-400' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-center">
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 text-xs font-extrabold hover:opacity-90 transition active:scale-95"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

export function FICAIPanel() {
  const { activeSchoolContext, contextSchools } = useAppContext()
  const params = useParams()
  const schoolSlug = params.escola as string
  const currentSchool = contextSchools.find(s => s.id === activeSchoolContext)
  const schoolName = currentSchool?.name || 'EECM'
  const [showReminder, setShowReminder] = useState(false)

  const {
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
    hasData,
  } = useFICAIPanel()


  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600/90 via-teal-600/95 to-emerald-700 p-4 sm:py-5 sm:px-6 text-white shadow-xl border border-emerald-500/20 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
            <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300/10" />
            NÚCLEO DE MEDIAÇÃO ESCOLAR — SEDUC-MT
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Painel FICAI
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 font-light mt-1">
              Acompanhamento de infrequência escolar e abertura de fichas de comunicação. Unidade:
              <span className="font-semibold text-white ml-1">{schoolName}</span>
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5 shrink-0 self-start md:self-center">
          <Link
            href={`/${schoolSlug}/psicossocial`}
            className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow transition flex items-center justify-center gap-1.5 active:scale-95 border border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Psico
          </Link>

          {hasData && (
            <button
              onClick={reset}
              disabled={loading}
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 text-emerald-600" />
              Nova planilha
            </button>
          )}
        </div>
      </div>

      {/* Banner fixo — sistemas externos */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/8 px-4 py-3 text-xs">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-extrabold shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          Lançar também nos portais SEDUC-MT:
        </div>
        <div className="flex flex-wrap gap-2">
          {EXTERNAL_SYSTEMS.map(sys => (
            <a
              key={sys.url}
              href={sys.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[11px] transition-all active:scale-95',
                sys.color
              )}
            >
              {sys.label}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
            </a>
          ))}
        </div>
      </div>

      {/* Caixa de Importação */}
      <FICAIUpload onFile={processFile} loading={loading} compact={hasData} />

      {/* Histórico de Importações */}
      {sessions.length > 0 && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 px-1">
            <History className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500">Importações anteriores</p>
          </div>
          <div className="space-y-1.5">
            {sessions.slice(0, 5).map(session => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-850 transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TableIcon className="h-4 w-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 truncate">{session.nomeArquivo}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(session.importadoEm).toLocaleString('pt-BR')} · {session.totalAlunos} alunos
                      {session.totalGraves > 0 && <span className="text-rose-500 font-bold"> · {session.totalGraves} graves</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-slate-400">ver detalhes</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-455 bg-blue-500/5 px-4 py-3 rounded-2xl border border-blue-500/10 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          Processando registros e realizando correspondências de alunos...
        </div>
      )}

      {hasData ? (
        <>
          {/* Informações da última planilha */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400 animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">📊 Planilha Atual:</span>
              <span>{stats.total} alunos carregados no sistema.</span>
            </div>
            {entries[0]?.importadoEm && (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Importado em:</span>
                <span>
                  {new Date(entries[0].importadoEm).toLocaleString('pt-BR')}
                  {entries[0]?.importadoPorNome && ` por ${entries[0].importadoPorNome}`}
                </span>
              </div>
            )}
            <button
              onClick={manualSave}
              disabled={savingStatus === 'saving'}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-emerald-500" />
              Salvar agora
            </button>
          </div>

          {/* Stats Cards */}
          <FICAIStatsCards stats={stats} />

          {/* Filtros + busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-[10px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm',
                    filter === f.key
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <input
              placeholder="Buscar aluno por nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-full sm:w-56 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          {/* Tabela de Resultados */}
          <FICAITable
            entries={filteredEntries}
            total={stats.total}
            selectedIdx={selectedIdx}
            onSelect={toggleSelected}
            onUpdateStatus={updateStatus}
            onReminder={() => setShowReminder(true)}
          />

          {/* Drawer Detalhes do Aluno */}
          {selectedEntry && (
            <FICAIDetail
              entry={selectedEntry}
              onClose={() => toggleSelected(selectedIdx!)}
              onAddContact={addContactToStudent}
            />
          )}
        </>
      ) : (
        !loading && (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/20 dark:bg-slate-900/10">
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">
              Nenhum dado do FICAI importado anteriormente para esta unidade de ensino.
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Suba a planilha CSV ou XLSX de frequência no painel acima para registrar e acompanhar os alunos infrequentes.
            </p>
          </div>
        )
      )}

      {/* Barrinha de salvamento */}
      {savingStatus !== 'idle' && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 shadow-lg text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          {savingStatus === 'saving' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
              <span className="text-slate-600 dark:text-slate-300">Salvando…</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Salvo</span>
            </>
          )}
        </div>
      )}

      {/* Modal lembrete sistemas externos */}
      {showReminder && <ReminderModal onClose={() => setShowReminder(false)} />}

      {/* Modal detalhe de sessão de importação */}
      {selectedSession && <ImportSessionModal session={selectedSession} onClose={() => setSelectedSession(null)} />}
    </div>
  )
}
