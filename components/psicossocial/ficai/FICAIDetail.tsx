'use client'

import { X, User, MessageCircle } from 'lucide-react'
import type { FICAIEntry } from '@/types/ficai'
import { formatPhoneForWhatsApp } from '@/lib/utils'

interface FICAIDetailProps {
  entry: FICAIEntry | null
  onClose: () => void
}

export function FICAIDetail({ entry, onClose }: FICAIDetailProps) {
  if (!entry) return null;

  const fields = [
    { label: '% Faltas Geral',    value: entry.faltasGeral !== null ? `${entry.faltasGeral}%` : '—' },
    { label: '1° Bimestre',       value: entry.faltas1Bim  !== null ? `${entry.faltas1Bim}%`  : '—' },
    { label: '2° Bimestre',       value: entry.faltas2Bim  !== null ? `${entry.faltas2Bim}%`  : '—' },
    { label: 'FICAI',             value: entry.ficaiAberto ? entry.dataFicai : 'Não aberta' },
    { label: 'Encaminhamento',    value: entry.encaminhado ? entry.dataEncaminhamento : 'Não encaminhado' },
    { label: 'Match Supabase',    value: entry.matched ? `${Math.round(entry.matchScore * 100)}%` : 'Sem correspondência' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-200" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <aside 
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 translate-x-0"
      >
        {/* Cabeçalho do Drawer */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-850 dark:text-slate-100 truncate leading-tight">
                {entry.nomeAluno}
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                Turma: <span className="text-slate-500 dark:text-slate-450">{entry.turma}</span> · Turno: <span className="text-slate-500 dark:text-slate-450">{entry.turno}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            aria-label="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Drawer */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          
          {/* Grid de Informações Gerais */}
          <div>
            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              📊 Indicadores Gerais
            </p>
            <div className="grid grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.label} className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3.5 flex flex-col justify-between shadow-sm">
                  <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500">{f.label}</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1 truncate">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Seção de Contatos dos Responsáveis */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              💬 Contatos de Responsáveis (Supabase)
            </p>
            
            {entry.contacts && entry.contacts.length > 0 ? (
              <div className="space-y-3">
                {entry.contacts.map((contact, idx) => {
                  const waUrl = formatPhoneForWhatsApp(contact.phone || '', entry.nomeAluno);
                  return (
                    <div 
                      key={idx} 
                      className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500 block">
                            {contact.name || `Responsável ${idx + 1}`}
                          </span>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-0.5">{contact.phone || 'Sem telefone'}</p>
                        </div>

                        {contact.phone && waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline dark:text-emerald-450 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 active:scale-95 transition-all shrink-0 shadow-sm"
                            title={`Enviar WhatsApp para ${contact.name}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-500/5 border border-dashed border-amber-500/25 p-4 text-center">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Nenhum contato de responsável encontrado no Supabase para este aluno.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Rodapé do Drawer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 flex">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          >
            Fechar Detalhes
          </button>
        </div>
      </aside>
    </>
  );
}
