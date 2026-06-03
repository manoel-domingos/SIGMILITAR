import { X, Phone, User, Award, ShieldCheck, MessageCircle } from 'lucide-react'
import type { FICAIEntry } from '@/types/ficai'
import { formatPhoneForWhatsApp } from '@/lib/utils'

interface FICAIDetailProps {
  entry: FICAIEntry
  onClose: () => void
}

export function FICAIDetail({ entry, onClose }: FICAIDetailProps) {
  const fields = [
    { label: '% Faltas Geral',    value: entry.faltasGeral !== null ? `${entry.faltasGeral}%` : '—' },
    { label: '1° Bimestre',       value: entry.faltas1Bim  !== null ? `${entry.faltas1Bim}%`  : '—' },
    { label: '2° Bimestre',       value: entry.faltas2Bim  !== null ? `${entry.faltas2Bim}%`  : '—' },
    { label: 'Telefone Aluno',    value: entry.telefone || 'Não cadastrado' },
    { label: 'Responsável',       value: entry.nomeResponsavel || '—' },
    { label: 'Tel. Responsável',  value: entry.telefoneResponsavel || '—' },
    { label: 'FICAI',             value: entry.ficaiAberto ? entry.dataFicai : 'Não aberta' },
    { label: 'Encaminhamento',    value: entry.encaminhado ? entry.dataEncaminhamento : 'Não encaminhado' },
    { label: 'Match Supabase',    value: entry.matched ? `${Math.round(entry.matchScore * 100)}%` : 'Sem correspondência' },
  ]

  return (
    <div className="rounded-3xl border border-blue-500/10 bg-blue-500/[0.02] dark:bg-blue-500/[0.03] p-5 shadow-inner animate-in slide-in-from-bottom-5 duration-300">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-slate-800 dark:text-slate-100 leading-tight text-sm sm:text-base">{entry.nomeAluno}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              Turma: <span className="text-slate-500 dark:text-slate-450">{entry.turma}</span> · Turno: <span className="text-slate-500 dark:text-slate-450">{entry.turno}</span>
              {entry.nomeResponsavel && ` · Responsável: ${entry.nomeResponsavel}`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-600 dark:hover:text-slate-200 transition active:scale-95 cursor-pointer"
          aria-label="Fechar detalhes"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fields.map(f => {
          const isPhone = f.label.startsWith('Tel') && f.value !== '—' && f.value !== 'Não cadastrado';
          return (
            <div key={f.label} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 p-3 flex flex-col justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500">{f.label}</p>
              {isPhone ? (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <a 
                    href={`tel:${f.value}`} 
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 active:scale-95 transition-transform shrink-0"
                  >
                    <Phone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    {f.value}
                  </a>
                  {(() => {
                    const waUrl = formatPhoneForWhatsApp(f.value || '', entry.nomeAluno);
                    if (!waUrl) return null;
                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-450 active:scale-95 transition-transform shrink-0"
                        title="Enviar mensagem no WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        WhatsApp
                      </a>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1 truncate">{f.value}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}
