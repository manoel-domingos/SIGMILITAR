'use client'

import { useState } from 'react'
import { X, User, MessageCircle, Loader2 } from 'lucide-react'
import type { FICAIEntry } from '@/types/ficai'
import { formatPhoneForWhatsApp } from '@/lib/utils'

interface FICAIDetailProps {
  entry: FICAIEntry | null
  onClose: () => void
  onAddContact: (studentId: string, name: string, phone: string) => Promise<void>
}

type TabKey = 'dados' | 'historico'

export function FICAIDetail({ entry, onClose, onAddContact }: FICAIDetailProps) {
  const [addingContact, setAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('dados');
  const [selectedFaltaDay, setSelectedFaltaDay] = useState<string | null>(null);

  if (!entry) return null;

  // Chave de dia-calendário (YYYY-MM-DD em horário local) a partir de um ISO
  const dayKey = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatPhone = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 0) {
      if (v.length <= 2) return '(' + v;
      if (v.length <= 6) return '(' + v.slice(0, 2) + ') ' + v.slice(2);
      if (v.length <= 10) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
      return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
    }
    return v;
  };

  const fields = [
    { label: '% Faltas Geral',    value: entry.faltasGeral !== null ? `${entry.faltasGeral}%` : '—' },
    { label: '1° Bimestre',       value: entry.faltas1Bim  !== null ? `${entry.faltas1Bim}%`  : '—' },
    { label: '2° Bimestre',       value: entry.faltas2Bim  !== null ? `${entry.faltas2Bim}%`  : '—' },
    { label: 'FICAI',             value: entry.ficaiAberto ? entry.dataFicai : 'Não aberta' },
    { label: 'Encaminhamento',    value: entry.encaminhado ? entry.dataEncaminhamento : 'Não encaminhado' },
    { label: 'Match Supabase',    value: entry.matched ? `${Math.round(entry.matchScore * 100)}%` : 'Sem correspondência' },
    { label: 'Código do Aluno',   value: entry.codAluno !== null ? String(entry.codAluno) : '—' },
    { label: 'Cod. Matrícula',    value: entry.codMatricula !== null ? String(entry.codMatricula) : '—' },
  ]

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dados', label: 'DADOS' },
    { key: 'historico', label: 'HISTÓRICO DE FALTAS' },
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
                Turma: <span className="text-slate-500 dark:text-slate-450">{entry.turma}</span> · Turno: <span className="text-slate-500 dark:text-slate-450">{entry.turno}</span>{entry.codAluno !== null && ` · Código: ${entry.codAluno}`}
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

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-1 mr-6 text-[11px] font-black uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo do Drawer */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Tab: DADOS ──────────────────────────────────────────────── */}
          {activeTab === 'dados' && (
            <>
              {/* Grid de Indicadores Gerais */}
              <div>
                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  📊 Indicadores Gerais
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {fields.map(f => (
                    <div key={f.label} className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3.5 flex flex-col justify-between shadow-sm">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500">{f.label}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-355 mt-1 truncate">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Histórico de Ações */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  🕘 Histórico de Ações
                </p>
                {entry.historicoAcoes && entry.historicoAcoes.length > 0 ? (
                  <div className="space-y-2">
                    {[...entry.historicoAcoes].reverse().map((acao, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">{acao.descricao}</p>
                          <span className={`shrink-0 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                            acao.tipo === 'status'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {acao.tipo === 'status' ? 'Status' : 'Contato'}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(acao.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {acao.usuario ? ` · ${acao.usuario}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhuma ação registrada ainda.</p>
                )}
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
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-355 mt-0.5">{contact.phone || 'Sem telefone'}</p>
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

              {/* Formulário de Adicionar Contato */}
              {entry.matched && entry.alunoId && (
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    ➕ Adicionar Contato Definitivo
                  </p>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!contactName.trim() || !contactPhone.trim()) return;

                      setAddingContact(true);
                      try {
                        await onAddContact(entry.alunoId!, contactName.trim(), contactPhone.trim());
                        setContactName('');
                        setContactPhone('');
                      } finally {
                        setAddingContact(false);
                      }
                    }}
                    className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Nome / Parentesco</label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setContactName('Mãe')}
                            className="text-[9px] font-extrabold uppercase bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md transition active:scale-95"
                          >
                            Mãe
                          </button>
                          <button
                            type="button"
                            onClick={() => setContactName('Pai')}
                            className="text-[9px] font-extrabold uppercase bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md transition active:scale-95"
                          >
                            Pai
                          </button>
                          <button
                            type="button"
                            onClick={() => setContactName('Aluno')}
                            className="text-[9px] font-black uppercase bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md transition active:scale-95 border border-blue-200 dark:border-blue-800"
                          >
                            Aluno
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        name="contactName"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Ex: Mãe, Pai, Responsável Legal..."
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Telefone (WhatsApp)</label>
                      <input
                        type="text"
                        name="contactPhone"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(formatPhone(e.target.value))}
                        placeholder="Ex: (65) 99999-9999"
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingContact}
                      className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      {addingContact ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Contato'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          {/* ── Tab: HISTÓRICO DE FALTAS ─────────────────────────────────── */}
          {activeTab === 'historico' && (
            <div>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                📈 Histórico de Faltas
                {entry.historicoFaltas && entry.historicoFaltas.length > 0 && (
                  <span className="ml-1.5 text-slate-400 font-semibold normal-case tracking-normal">
                    ({entry.historicoFaltas.length} registro{entry.historicoFaltas.length !== 1 ? 's' : ''})
                  </span>
                )}
              </p>

              {entry.historicoFaltas && entry.historicoFaltas.length > 0 ? (
                <>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">Toque num dia para ver as ações registradas.</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.historicoFaltas.map((pt, pi) => {
                      const prev = entry.historicoFaltas![pi - 1]
                      const delta = prev && pt.perc !== null && prev.perc !== null ? pt.perc - prev.perc : null
                      const dk = dayKey(pt.data)
                      const isSel = selectedFaltaDay === dk
                      return (
                        <button
                          type="button"
                          key={pi}
                          onClick={() => setSelectedFaltaDay(isSel ? null : dk)}
                          title={new Date(pt.data).toLocaleString('pt-BR')}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold border transition active:scale-95 cursor-pointer ${
                            isSel ? 'ring-2 ring-blue-500/50 ' : ''
                          }${
                            pt.perc !== null && pt.perc >= 15
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                              : pt.perc !== null && pt.perc >= 10
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {new Date(pt.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          {' '}{pt.perc !== null ? `${pt.perc}%` : '—'}
                          {delta !== null && (
                            <span className={delta > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                              {delta > 0 ? ` ▲${delta}` : ` ▼${Math.abs(delta)}`}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Ações do dia selecionado */}
                  {selectedFaltaDay && (() => {
                    const acoesDoDia = (entry.historicoAcoes || []).filter(a => dayKey(a.data) === selectedFaltaDay)
                    const [yyyy, mm, dd] = selectedFaltaDay.split('-')
                    return (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                          🕘 Ações de {dd}/{mm}/{yyyy}
                        </p>
                        {acoesDoDia.length > 0 ? (
                          <div className="space-y-2">
                            {[...acoesDoDia].reverse().map((acao, i) => (
                              <div key={i} className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">{acao.descricao}</p>
                                  <span className={`shrink-0 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                    acao.tipo === 'status'
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    {acao.tipo === 'status' ? 'Status' : 'Contato'}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                                  {new Date(acao.data).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  {acao.usuario ? ` · ${acao.usuario}` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhuma ação registrada neste dia.</p>
                        )}
                      </div>
                    )
                  })()}
                </>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  Nenhum histórico de faltas registrado para este aluno.
                </p>
              )}
            </div>
          )}

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
