'use client';

import { useFICAIPanel } from '@/hooks/useFICAIPanel'
import { FICAIUpload }    from './FICAIUpload'
import { FICAIStatsCards }from './FICAIStats'
import { FICAITable }     from './FICAITable'
import { FICAIDetail }    from './FICAIDetail'
import { cn }             from '@/lib/utils'
import { RefreshCw, Save, Loader2, Heart, ArrowLeft } from 'lucide-react'
import type { FICAIFilterKey } from '@/types/ficai'
import { useParams } from 'next/navigation'
import { useAppContext } from '@/lib/store'
import Link from 'next/link'

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
  const { activeSchoolContext, contextSchools } = useAppContext()
  const params = useParams()
  const schoolSlug = params.escola as string
  const currentSchool = contextSchools.find(s => s.id === activeSchoolContext)
  const schoolName = currentSchool?.name || 'EECM'

  const {
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
    hasData,
  } = useFICAIPanel()


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Premium Hero Header (Cabeçalho Padrão Verde Reduzido) */}
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
            <>
              <button
                onClick={reset}
                disabled={loading || saving}
                className="bg-white text-emerald-700 hover:bg-emerald-50 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 text-emerald-600" />
                Nova planilha
              </button>
              <button
                onClick={saveToDatabase}
                disabled={saving || loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer border border-emerald-400/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar no banco
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Caixa de Importação - Sempre visível (Variante compacta se já houver dados) */}
      <FICAIUpload onFile={processFile} loading={loading} compact={hasData} />

      {loading && (
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-455 bg-blue-500/5 px-4 py-3 rounded-2xl border border-blue-500/10 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          Processando registros e realizando correspondências de alunos...
        </div>
      )}

      {hasData ? (
        <>
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
              Suba a planilha CSV de frequência no painel acima para registrar e acompanhar os alunos infrequentes.
            </p>
          </div>
        )
      )}
    </div>
  )
}
