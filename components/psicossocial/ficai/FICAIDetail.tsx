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
              {entry.nomeResponsavel && ` · Responsável Principal: ${entry.nomeResponsavel}`}
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
        {fields.map(f => (
          <div key={f.label} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 p-3 flex flex-col justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500">{f.label}</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1 truncate">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Seção de Contatos dos Responsáveis */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850/60">
        <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          📞 Contatos de Responsáveis (Supabase)
        </p>
        
        {entry.contacts && entry.contacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entry.contacts.map((contact, idx) => {
              const waUrl = formatPhoneForWhatsApp(contact.phone || '', entry.nomeAluno);
              return (
                <div 
                  key={idx} 
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200"
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {contact.name || `Contato ${idx + 1}`}
                    </span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-0.5">{contact.phone || 'Sem telefone'}</p>
                  </div>
                  
                  {contact.phone && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 dark:border-slate-850/30">
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400 bg-blue-500/5 px-2 py-1 rounded-lg border border-blue-500/10 active:scale-95 transition-transform shrink-0"
                        title={`Ligar para ${contact.name}`}
                      >
                        <Phone className="h-3 w-3 text-blue-500 shrink-0" />
                        Ligar
                      </a>
                      
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:underline dark:text-emerald-450 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10 active:scale-95 transition-transform shrink-0"
                          title={`Enviar WhatsApp para ${contact.name}`}
                        >
                          <MessageCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-amber-500/5 border border-dashed border-amber-500/20 p-4 text-center">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Nenhum contato de responsável encontrado no Supabase para este aluno.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
