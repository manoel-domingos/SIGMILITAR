'use client'

import { AlertTriangle, CheckCircle, Flame, Phone, MessageCircle } from 'lucide-react'
import type { FICAIEntry } from '@/types/ficai'
import { cn, formatPhoneForWhatsApp } from '@/lib/utils'

interface FICAITableProps {
  entries: FICAIEntry[]
  total: number
  selectedIdx: number | null
  onSelect: (idx: number) => void
}

function PctCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-400 dark:text-slate-600 font-semibold">—</span>
  const cls =
    value >= 25 ? 'text-rose-600 font-bold dark:text-rose-500'
    : value >= 10 ? 'text-amber-600 font-semibold dark:text-amber-500'
    : 'text-emerald-600 font-medium dark:text-emerald-555'
  return <span className={cls}>{value}%</span>
}

function AlertIcon({ entry }: { entry: FICAIEntry }) {
  if (entry.alertaGrave) return <Flame className="h-4 w-4 text-rose-500 shrink-0" />
  if (entry.alerta)      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
  return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
}

function FICAIBadge({ entry }: { entry: FICAIEntry }) {
  if (entry.ficaiNecessaria)
    return <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-600 dark:text-rose-400 border border-rose-500/15">Necessária!</span>
  if (entry.encaminhado)
    return <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-450 border border-emerald-500/15">Encaminhado</span>
  if (entry.ficaiAberto)
    return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400 border border-amber-500/15">{entry.dataFicai}</span>
  return <span className="text-xs text-slate-400 dark:text-slate-600">Não aberta</span>
}

export function FICAITable({ entries, total, selectedIdx, onSelect }: FICAITableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-slate-450 dark:text-slate-650 bg-white/50 dark:bg-slate-900/10 border border-dashed rounded-2xl">
        Nenhum aluno encontrado
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-850/80 bg-white dark:bg-slate-900/60 shadow-sm animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3.5 text-left">Aluno</th>
              <th className="px-5 py-3.5 text-left">Turma</th>
              <th className="px-5 py-3.5 text-left">Telefone</th>
              <th className="px-5 py-3.5 text-center">Geral</th>
              <th className="px-5 py-3.5 text-center">1°Bim</th>
              <th className="px-5 py-3.5 text-center">2°Bim</th>
              <th className="px-5 py-3.5 text-left">FICAI</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <tr
                  key={idx}
                  onClick={() => onSelect(idx)}
                  className={cn(
                    'cursor-pointer border-b border-slate-100 dark:border-slate-850/40 transition-colors last:border-0 text-slate-700 dark:text-slate-300',
                    isSelected
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 font-medium'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/30'
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <AlertIcon entry={entry} />
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-bold leading-tight text-slate-800 dark:text-slate-200">
                          {entry.nomeAluno}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{entry.turno}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-450">{entry.turma}</td>
                  <td className="px-5 py-3">
                    {entry.telefone ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`tel:${entry.telefone}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10 active:scale-95 transition-transform shrink-0"
                        >
                          <Phone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          {entry.telefone}
                        </a>
                        {(() => {
                          const waUrl = formatPhoneForWhatsApp(entry.telefone || '', entry.nomeAluno);
                          if (!waUrl) return null;
                          return (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-450 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 active:scale-95 transition-transform shrink-0"
                              title="Enviar mensagem no WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              WhatsApp
                            </a>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center text-sm font-semibold"><PctCell value={entry.faltasGeral} /></td>
                  <td className="px-5 py-3 text-center text-sm font-semibold"><PctCell value={entry.faltas1Bim} /></td>
                  <td className="px-5 py-3 text-center text-sm font-semibold"><PctCell value={entry.faltas2Bim} /></td>
                  <td className="px-5 py-3"><FICAIBadge entry={entry} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-5 py-3.5 text-right text-xs font-bold text-slate-450 dark:text-slate-550 border-t border-slate-100 dark:border-slate-850/40 bg-slate-50/20 dark:bg-slate-950/10">
        Exibindo {entries.length} de {total} alunos · clique na linha para ver mais detalhes
      </p>
    </div>
  )
}
