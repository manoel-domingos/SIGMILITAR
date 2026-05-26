'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { supabase as supabaseClient } from '@/lib/supabase';
import type { LucideProps } from 'lucide-react';
import {
  ShieldCheck, Star, Sparkles, Search, ChevronDown, Plus, Trash2,
  Check, X, MessageSquare, Calendar, RotateCcw, Loader2
} from 'lucide-react';
import { useTenantConfig, getDbSchoolId } from '@/lib/useTenantConfig';

// supabase nunca e null neste contexto — assert para evitar TS18047
const supabase = supabaseClient!;

// ---------- tipos ----------
type XerifeRole = 'Xerife' | 'Sub-Xerife' | 'Pelotao da Faxina';

interface XerifeEntry {
  id: string;
  student_id: string;
  student_name: string;
  class: string;
  role: XerifeRole;
  week_start: string;
  week_end: string;
  feedback?: string;
  created_by?: string;
}

type IconComp = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
const ROLE_CONFIG: Record<XerifeRole, { label: string; icon: IconComp; color: string; bg: string; border: string }> = {
  'Xerife':           { label: 'Xerife',            icon: ShieldCheck, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30' },
  'Sub-Xerife':        { label: 'Sub-Xerife',           icon: Star,      color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-200 dark:border-blue-500/30'   },
  'Pelotao da Faxina': { label: 'Pelotão da Faxina',   icon: Sparkles,  color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-500/10',  border: 'border-green-200 dark:border-green-500/30' },
};

// Semana atual (segunda a sexta)
function getCurrentWeek(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=dom, 1=seg...
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(monday), end: fmt(friday) };
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ---------- componente ----------
export default function XerifePage() {
  const { students, user, activeSchoolContext } = useAppContext();
  const { tenantId } = useTenantConfig();
  const dbSchoolId = getDbSchoolId(activeSchoolContext || tenantId);
  const week = getCurrentWeek();

  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<XerifeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form de adição
  const [addOpen, setAddOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState('');
  const [addRole, setAddRole] = useState<XerifeRole>('Xerife');
  const [studentSearch, setStudentSearch] = useState('');

  // feedback
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // modal de detalhe do aluno + confirmacao de remocao
  const [detailEntry, setDetailEntry] = useState<XerifeEntry | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<XerifeEntry | null>(null);

  // classes disponíveis
  const classes = Array.from(new Set(students.filter(s => !s.archived).map(s => s.class))).sort();

  // filtragem de alunos no form
  const studentsInClass = students.filter(s => !s.archived && (!selectedClass || s.class === selectedClass));
  const normStr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filteredForSearch = studentsInClass.filter(s =>
    normStr(s.name).includes(normStr(studentSearch))
  );

  // ---------- load ----------
  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('xerifes')
      .select('*')
      .eq('week_start', week.start)
      .eq('school_id', dbSchoolId)
      .order('role')
      .order('class');
    setEntries((data as XerifeEntry[]) ?? []);
    setLoading(false);
  }, [week.start, dbSchoolId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ---------- filtragem da lista ----------
  const displayEntries = entries.filter(e =>
    (!selectedClass || e.class === selectedClass)
  );

  // ---------- adicionar ----------
  const handleAdd = async () => {
    if (!addStudentId) return;
    const student = students.find(s => s.id === addStudentId);
    if (!student) return;

    // Impede duplicata na mesma semana com mesmo papel
    const already = entries.find(e => e.student_id === addStudentId && e.role === addRole);
    if (already) return;

    setSaving(true);
    const { data, error } = await supabase.from('xerifes').insert({
      student_id: student.id,
      student_name: student.name,
      class: student.class,
      role: addRole,
      week_start: week.start,
      week_end: week.end,
      created_by: (user as any)?.email ?? 'sistema',
      school_id: dbSchoolId,
    }).select().single();

    if (!error && data) {
      setEntries(prev => [...prev, data as XerifeEntry]);
    }
    setSaving(false);
    setAddOpen(false);
    setAddStudentId('');
    setStudentSearch('');
    setAddRole('Xerife');
  };

  // ---------- remover ----------
  const handleRemove = async (id: string) => {
    await supabase.from('xerifes').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // ---------- salvar feedback ----------
  const handleSaveFeedback = async () => {
    if (!feedbackId) return;
    await supabase.from('xerifes').update({ feedback: feedbackText, updated_at: new Date().toISOString() }).eq('id', feedbackId);
    setEntries(prev => prev.map(e => e.id === feedbackId ? { ...e, feedback: feedbackText } : e));
    setFeedbackId(null);
    setFeedbackText('');
  };

  // agrupado por papel
  const byRole = (role: XerifeRole) => displayEntries.filter(e => e.role === role);

  return (
    <AppShell>
      <div className="space-y-6 pb-16 max-w-5xl mx-auto">

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Gestao Semanal
            </p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Xerifes e Pelotao</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Semana de {fmtDate(week.start)} a {fmtDate(week.end)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* filtro turma */}
            <div className="relative">
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
              >
                <option value="">Todas as turmas</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* botão adicionar */}
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        {/* Filtro rápido por turma */}
        {!loading && classes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedClass('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedClass === ''
                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600'
              }`}
            >
              Todas
            </button>
            {classes.map(c => {
              const allRolesFilled = (Object.keys(ROLE_CONFIG) as XerifeRole[]).every(r =>
                entries.some(e => e.class === c && e.role === r)
              );
              const isActive = selectedClass === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedClass(isActive ? '' : c)}
                  title={allRolesFilled ? `${c} — completo` : `${c} — pendente`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isActive
                      ? allRolesFilled
                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                        : 'bg-rose-500 border-rose-500 text-white shadow-sm'
                      : allRolesFilled
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600'
                        : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {/* Cards por papel */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(ROLE_CONFIG) as XerifeRole[]).map(role => {
              const cfg = ROLE_CONFIG[role];
              const Icon = cfg.icon;
              const list = byRole(role);

              return (
                <div key={role} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                    <h2 className={`font-bold text-base ${cfg.color}`}>{cfg.label}</h2>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 ${cfg.color}`}>
                      {list.length}
                    </span>
                  </div>

                  {list.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Nenhum aluno designado para esta semana.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {list.map(entry => (
                        <div
                          key={entry.id}
                          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-2 border border-slate-100 dark:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => setDetailEntry(entry)}
                              className="text-left group min-w-0"
                            >
                              <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors underline-offset-2 group-hover:underline">
                                {entry.student_name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{entry.class}</p>
                            </button>
                            <button
                              onClick={() => { setFeedbackId(entry.id); setFeedbackText(entry.feedback ?? ''); }}
                              title="Registrar feedback"
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors shrink-0"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {entry.feedback && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2.5 py-2 italic">
                              &ldquo;{entry.feedback}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Histórico de semanas anteriores */}
        <PreviousWeeks dbSchoolId={dbSchoolId} />

      </div>

      {/* Modal — detalhe do aluno */}
      {detailEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailEntry(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ROLE_CONFIG[detailEntry.role].bg} ${ROLE_CONFIG[detailEntry.role].border} border`}>
                  {React.createElement(ROLE_CONFIG[detailEntry.role].icon, { className: `w-5 h-5 ${ROLE_CONFIG[detailEntry.role].color}` })}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-base leading-tight">{detailEntry.student_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detailEntry.class} · {ROLE_CONFIG[detailEntry.role].label}</p>
                </div>
              </div>
              <button onClick={() => setDetailEntry(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Semana */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {fmtDate(detailEntry.week_start)} a {fmtDate(detailEntry.week_end)}
              </span>
            </div>

            {/* Feedback */}
            {detailEntry.feedback && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Feedback</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 italic">&ldquo;{detailEntry.feedback}&rdquo;</p>
              </div>
            )}

            {/* Acoes */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => { setFeedbackId(detailEntry.id); setFeedbackText(detailEntry.feedback ?? ''); setDetailEntry(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Feedback
              </button>
              <button
                onClick={() => { setConfirmRemove(detailEntry); setDetailEntry(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup — confirmacao de remocao */}
      {confirmRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col gap-5">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center justify-center mb-1">
                <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <p className="text-slate-800 dark:text-white font-semibold text-base leading-snug">
                Tem certeza que deseja remover{' '}
                <span className="text-slate-900 dark:text-white font-bold">{confirmRemove.student_name}</span>{' '}
                da funcao{' '}
                <span className="font-bold">{ROLE_CONFIG[confirmRemove.role].label}</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition-colors"
              >
                Nao
              </button>
              <button
                onClick={async () => { await handleRemove(confirmRemove.id); setConfirmRemove(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — adicionar */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 dark:text-white text-lg">Adicionar Xerife</h2>
              <button onClick={() => setAddOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            {/* Selecionar papel */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Funcao</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ROLE_CONFIG) as XerifeRole[]).map(r => {
                  const cfg = ROLE_CONFIG[r];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={r}
                      onClick={() => setAddRole(r)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${addRole === r ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      <Icon className="w-5 h-5" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro turma */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Turma</label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={e => { setSelectedClass(e.target.value); setAddStudentId(''); setStudentSearch(''); }}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">Todas as turmas</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Busca de aluno */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aluno</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar aluno..."
                  value={studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); setAddStudentId(''); }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* lista de resultados */}
              {studentSearch.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredForSearch.length === 0 ? (
                    <p className="text-xs text-slate-400 px-3 py-3">Nenhum aluno encontrado.</p>
                  ) : (
                    filteredForSearch.slice(0, 12).map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setAddStudentId(s.id); setStudentSearch(s.name); }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between ${addStudentId === s.id ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        <span>{s.name}</span>
                        <span className="text-xs text-slate-400">{s.class}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {addStudentId && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {students.find(s => s.id === addStudentId)?.name} selecionado
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setAddOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={!addStudentId || saving}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — feedback */}
      {feedbackId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFeedbackId(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-500" /> Feedback da Semana</h2>
              <button onClick={() => setFeedbackId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              rows={5}
              placeholder="Desempenho, observacoes, pontos positivos e negativos..."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setFeedbackId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
              <button onClick={handleSaveFeedback} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ---------- histórico ----------
function PreviousWeeks({ dbSchoolId }: { dbSchoolId: string }) {
  const [history, setHistory] = useState<XerifeEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const week = getCurrentWeek();

  const load = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('xerifes')
      .select('*')
      .eq('school_id', dbSchoolId)
      .lt('week_start', week.start)
      .order('week_start', { ascending: false })
      .limit(50);
    setHistory((data as XerifeEntry[]) ?? []);
    setLoadingHistory(false);
  };

  const handleToggle = () => {
    if (!open) load();
    setOpen(o => !o);
  };

  // agrupar por semana
  const weeks = Array.from(new Set(history.map(e => e.week_start)));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors"
      >
        <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-slate-400" /> Historico de Semanas Anteriores</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...</div>
          ) : weeks.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4">Nenhum historico encontrado.</p>
          ) : (
            <div className="space-y-4">
              {weeks.map(ws => {
                const items = history.filter(e => e.week_start === ws);
                const we = items[0]?.week_end ?? ws;
                return (
                  <div key={ws} className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{fmtDate(ws)} a {fmtDate(we)}</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {items.map(e => (
                        <div key={e.id} className="px-4 py-3 flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_CONFIG[e.role].bg} ${ROLE_CONFIG[e.role].color}`}>{ROLE_CONFIG[e.role].label}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-200 font-medium flex-1">{e.student_name}</span>
                          <span className="text-xs text-slate-400">{e.class}</span>
                          {e.feedback && (
                            <span title={e.feedback}>
                              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
