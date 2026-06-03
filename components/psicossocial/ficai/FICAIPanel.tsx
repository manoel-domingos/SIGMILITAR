'use client'

import { useFICAIPanel } from '@/hooks/useFICAIPanel'
import { FICAIUpload }    from './FICAIUpload'
import { FICAIStatsCards }from './FICAIStats'
import { FICAITable }     from './FICAITable'
import { FICAIDetail }    from './FICAIDetail'
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850/60 pb-5">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-850 dark:text-slate-100 leading-tight">Painel FICAI</h2>
          <p className="text-xs sm:text-sm text-slate-450 dark:text-slate-550">
            Acompanhamento de infrequência escolar · Módulo Psicossocial
          </p>
        </div>
        {hasData && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              onClick={reset}
              disabled={loading || saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              Nova planilha
            </button>
            <button
              onClick={saveToDatabase}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/10"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Salvar no banco
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Upload ou painel */}
      {!hasData ? (
        <FICAIUpload onFile={processFile} loading={loading} />
      ) : (
        <>
          {loading && (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-450 bg-blue-500/5 px-4 py-3 rounded-2xl border border-blue-500/10 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Cruzando alunos com a base do Supabase...
            </div>
          )}

          {/* Stats */}
          <FICAIStatsCards stats={stats} />

          {/* Filtros + busca */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              placeholder="Buscar aluno..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-full sm:w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
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
