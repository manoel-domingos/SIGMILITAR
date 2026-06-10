'use client'

import { AlertTriangle, CheckCircle, Flame, Phone, MessageCircle } from 'lucide-react'
import type { FICAIEntry } from '@/types/ficai'
import { cn, formatPhoneForWhatsApp } from '@/lib/utils'

interface FICAITableProps {
  entries: FICAIEntry[]
  total: number
  selectedIdx: number | null
  onSelect: (idx: number) => void
  onUpdateStatus: (idx: number, status: 'nao_aberta' | 'ficai_necessaria' | 'ficai_aberta' | 'encaminhado', date?: string) => void
  onReminder?: () => void
}

function PctCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-400 dark:text-slate-600 font-semibold">—</span>
  const cls =
    value >= 15 ? 'text-rose-600 font-bold dark:text-rose-500'
    : value >= 10 ? 'text-amber-600 font-semibold dark:text-amber-500'
    : 'text-emerald-600 font-medium dark:text-emerald-555'
  return <span className={cls}>{value}%</span>
}

function AlertIcon({ entry }: { entry: FICAIEntry }) {
  if (entry.alertaGrave) return <Flame className="h-4 w-4 text-rose-500 shrink-0" />
  if (entry.alerta)      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
  return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
}

export function FICAITable({ entries, total, selectedIdx, onSelect, onUpdateStatus, onReminder }: FICAITableProps) {
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
              <th className="px-5 py-3.5 text-left">Contato (Whats)</th>
              <th className="px-5 py-3.5 text-center">Geral</th>
              <th className="px-5 py-3.5 text-center">1°Bim</th>
              <th className="px-5 py-3.5 text-center">2°Bim</th>
              <th className="px-5 py-3.5 text-left">Status FICAI</th>
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
                        {(() => {
                          const waUrl = formatPhoneForWhatsApp(entry.telefone || '', entry.nomeAluno);
                          if (!waUrl) return <span className="text-xs text-slate-450">{entry.telefone}</span>;
                          return (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => { e.stopPropagation(); onReminder?.() }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-450 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 active:scale-95 transition-transform shrink-0"
                              title={`Enviar mensagem para ${entry.nomeResponsavel || entry.nomeAluno}`}
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              WhatsApp {entry.nomeResponsavel && `(${entry.nomeResponsavel})`}
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
                  <td className="px-5 py-3">
                    <select
                      value={
                        entry.encaminhado ? 'encaminhado'
                        : entry.ficaiAberto ? 'ficai_aberta'
                        : entry.ficaiNecessaria ? 'ficai_necessaria'
                        : 'nao_aberta'
                      }
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        const val = e.target.value as any;
                        let dateVal = '';
                        if (val === 'ficai_aberta' || val === 'encaminhado') {
                          const today = new Date().toLocaleDateString('pt-BR');
                          dateVal = prompt(`Digite a data (DD/MM/AAAA) ou clique em OK para usar hoje:`, today) || today;
                          onReminder?.();
                        }
                        onUpdateStatus(idx, val, dateVal);
                      }}
                      className={cn(
                        'bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs font-extrabold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95 transition-all text-center',
                        entry.encaminhado ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                        : entry.ficaiAberto ? 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5'
                        : entry.ficaiNecessaria ? 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/5'
                        : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      <option value="nao_aberta">Não aberta</option>
                      <option value="ficai_necessaria">⚠️ Necessária!</option>
                      <option value="ficai_aberta">📝 Aberta {entry.dataFicai && `(${entry.dataFicai})`}</option>
                      <option value="encaminhado">🚀 Encaminhado {entry.dataEncaminhamento && `(${entry.dataEncaminhamento})`}</option>
                    </select>
                  </td>
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
