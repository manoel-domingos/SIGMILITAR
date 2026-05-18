'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import CustomSelect from '@/components/CustomSelect';
import { useAppContext } from '@/lib/store';
import { FileText, AlertTriangle, Users, Star, ArrowRight, HeartPulse, Award, TrendingUp, ChevronDown, ClipboardList, X, Rocket, Settings2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';
import { hasPendingTasks, loadChecklists } from '@/components/OccurrenceChecklist';
import { createClient } from '@supabase/supabase-js';
import StudentSheet from '@/components/StudentSheet';

let _supabase: any = null;
function supabase(): any {
  return (_supabase ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
}

type PanelConfig = { id: string; label: string; enabled: boolean };

const DEFAULT_PANELS: PanelConfig[] = [
  { id: 'kpis',        label: 'Cards de KPIs',              enabled: true },
  { id: 'alertas',     label: 'Alertas Críticos',           enabled: true },
  { id: 'disciplina',  label: 'Painel Disciplina',          enabled: true },
  { id: 'elogios',     label: 'Painel Elogios e Bônus',     enabled: true },
  { id: 'acidentes',   label: 'Painel Acidentes',           enabled: true },
  { id: 'tendencia',   label: 'Gráfico Tendência Mensal',   enabled: true },
  { id: 'gravidade',   label: 'Gráfico Distribuição',       enabled: true },
];

function mergePanels(saved: PanelConfig[]): PanelConfig[] {
  const ids = saved.map(p => p.id);
  return [...saved, ...DEFAULT_PANELS.filter(d => !ids.includes(d.id))];
}

export default function Dashboard() {
  const { students, occurrences, accidents, praises, rules, getStudentPoints, user } = useAppContext();
  const userId = (user as any)?.email ?? 'guest';
  const [pendingBanner, setPendingBanner] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [implantacaoProgress, setImplantacaoProgress] = useState<{ total: number; done: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panels, setPanels] = useState<PanelConfig[]>(DEFAULT_PANELS);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Carrega painéis do Supabase ao montar
  useEffect(() => {
    if (!userId || userId === 'guest') return;
    supabase()
      .from('dashboard_panels')
      .select('panels')
      .eq('user_id', userId)
      .single()
      .then(({ data }: { data: { panels: PanelConfig[] } | null }) => {
        if (data?.panels && Array.isArray(data.panels)) {
          setPanels(mergePanels(data.panels));
        }
      });
  }, [userId]);

  const savePanels = (next: PanelConfig[]) => {
    setPanels(next);
    if (!userId || userId === 'guest') return;
    supabase()
      .from('dashboard_panels')
      .upsert({ user_id: userId, panels: next, updated_at: new Date().toISOString() })
      .then(() => {});
  };

  const togglePanel = (id: string) => {
    savePanels(panels.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const movePanel = (from: number, to: number) => {
    const next = [...panels];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    savePanels(next);
  };

  const isVisible = (id: string) => panels.find(p => p.id === id)?.enabled ?? true;

  useEffect(() => {
    supabase()
      .from('implantacao_items')
      .select('done')
      .then(({ data }: { data: { done: boolean }[] | null }) => {
        if (data) {
          setImplantacaoProgress({ total: data.length, done: data.filter(i => i.done).length });
        }
      });
  }, []);

  useEffect(() => {
    const tasks = loadChecklists(userId);
    const count = tasks.reduce((acc, t) => acc + t.items.filter(i => !i.done).length, 0);
    if (count > 0) {
      setPendingCount(count);
      setPendingBanner(true);
    }
  }, [userId]);

  const [selectedMonth, setSelectedMonth] = useState('Selecionar...');
  const [selectedClass, setSelectedClass] = useState('Todas as turmas');
  const [selectedShift, setSelectedShift] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState('2026');

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const classes = Array.from(new Set(students.map(s => s.class))).sort();

  const filteredOccurrences = occurrences.filter(o => {
    const defaultDate = new Date(o.date);
    const monthIndex = parseInt(o.date.split('-')[1]) - 1; 
    const month = months[monthIndex] || months[defaultDate.getMonth()];
    
    const student = students.find(s => s.id === o.studentId);
    const className = student?.class || '';
    const shift = student?.shift || '';

    const matchMonth = selectedMonth === 'Selecionar...' || selectedMonth === '' || month.toLowerCase() === selectedMonth.toLowerCase();
    const matchClass = selectedClass === 'Todas as turmas' || selectedClass === '' || className.toLowerCase() === selectedClass.toLowerCase();
    const matchShift = selectedShift === 'Todos' || shift.toLowerCase() === selectedShift.toLowerCase();
    const matchYear = o.date.startsWith(selectedYear);
    
    return matchMonth && matchClass && matchShift && matchYear;
  });

  const totalOccurrences = filteredOccurrences.length;
  
  const occurrencesWithSeverity = filteredOccurrences.map(o => {
    const rule = rules.find(r => r.code === o.ruleCode);
    return { ...o, severity: rule?.severity || 'Leve' };
  });

  const graveCount = occurrencesWithSeverity.filter(o => o.severity === 'Grave').length;
  const mediaCount = occurrencesWithSeverity.filter(o => o.severity === 'Media').length;
  const leveCount = occurrencesWithSeverity.filter(o => o.severity === 'Leve').length;
  
  const gravePercent = totalOccurrences > 0 ? Math.round((graveCount / totalOccurrences) * 100) : 0;
  
  const impactedStudentsCount = new Set(filteredOccurrences.map(o => o.studentId)).size;
  const impactedStudentsPercent = students.length > 0 ? Math.round((impactedStudentsCount / students.length) * 100) : 0;
  
  // calculate total average
  let totalPointsAccumulated = students.reduce((acc, student) => acc + getStudentPoints(student.id), 0);
  const averagePointsStr = students.length > 0 ? (totalPointsAccumulated / students.length).toFixed(1) : '10.0';
  const averagePoints = parseFloat(averagePointsStr);
  const studentsAbove7 = students.filter(s => getStudentPoints(s.id) >= 7.0).length;
  const percentAbove7 = students.length > 0 ? Math.round((studentsAbove7 / students.length) * 100) : 0;

  const severityData = [
    { name: 'Leve', value: leveCount, color: '#10b981' }, // green
    { name: 'Média', value: mediaCount, color: '#f59e0b' }, // yellow
    { name: 'Grave', value: graveCount, color: '#ef4444' } // red
  ];

  // Dummy monthly data for the chart based on occurrences
  const monthlyData = months.map((m, i) => {
    const count = occurrencesWithSeverity.filter(o => {
      const monthIndex = parseInt(o.date.split('-')[1]) - 1;
      return monthIndex === i;
    }).length;
    return { 
      name: m.substring(0, 3), 
      ocorrencias: count,
      graves: occurrencesWithSeverity.filter(o => parseInt(o.date.split('-')[1]) - 1 === i && o.severity === 'Grave').length
    };
  });

  return (
    <>
    <AppShell>
      <div className="space-y-6 max-w-[1400px] mx-auto">

        {/* Banner de pendencias */}
        {pendingBanner && (
          <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                Voce tem <span className="font-bold">{pendingCount}</span> {pendingCount === 1 ? 'pendencia' : 'pendencias'} em aberto de ocorrencias anteriores.
              </p>
              <Link
                href="/registro-disciplinar"
                className="text-xs font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors whitespace-nowrap"
              >
                Ver pendencias
              </Link>
            </div>
            <button onClick={() => setPendingBanner(false)} className="text-amber-400 hover:text-amber-700 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header & Filters */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#5e6ad2]">PAINEL EXECUTIVO</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mt-2 tracking-tight">Dashboard Disciplinar</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visão consolidada • Escola Cívico-Militar • {selectedYear}</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
            <div className="flex flex-col gap-1 w-full sm:w-28">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Ano</label>
              <CustomSelect 
                options={[
                  { value: '2026', label: '2026' },
                  { value: '2025', label: '2025' }
                ]}
                value={selectedYear}
                onChange={setSelectedYear}
              />
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-40">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Mês</label>
              <CustomSelect 
                options={[
                  { value: 'Selecionar...', label: 'Selecionar...' },
                  ...months.map(m => ({ value: m, label: m }))
                ]}
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-36">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Turno</label>
              <CustomSelect 
                options={[
                  { value: 'Todos', label: 'Todos' },
                  { value: 'Matutino', label: 'Matutino' },
                  { value: 'Vespertino', label: 'Vespertino' },
                  { value: 'Noturno', label: 'Noturno' }
                ]}
                value={selectedShift}
                onChange={setSelectedShift}
              />
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-48">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Turma</label>
              <CustomSelect 
                options={[
                  { value: 'Todas as turmas', label: 'Todas as turmas' },
                  ...classes.map(c => ({ value: c, label: c }))
                ]}
                value={selectedClass}
                onChange={setSelectedClass}
              />
            </div>

            {/* Botão configurar painéis */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-transparent uppercase tracking-widest px-1 select-none">.</label>
              <button
                onClick={() => setDrawerOpen(true)}
                title="Configurar painéis"
                className="flex items-center gap-2 px-3 h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm text-xs font-semibold whitespace-nowrap"
              >
                <Settings2 className="w-4 h-4" />
                Painéis
              </button>
            </div>
          </div>
        </div>

        {/* Drawer de configuração de painéis */}
        {drawerOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-white text-base">Configurar Painéis</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ative, desative e reordene</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {panels.map((panel, idx) => (
                  <div
                    key={panel.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={() => { if (dragIdx !== null && dragIdx !== idx) movePanel(dragIdx, idx); setDragIdx(null); }}
                    onDragEnd={() => setDragIdx(null)}
                    className={'flex items-center gap-3 px-3 py-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ' + (dragIdx === idx ? 'opacity-40 scale-95' : 'opacity-100') + ' ' + (panel.enabled ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50')}
                  >
                    <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    <span className={'flex-1 text-sm font-medium ' + (panel.enabled ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 line-through')}>
                      {panel.label}
                    </span>
                    <button
                      onClick={() => togglePanel(panel.id)}
                      className="shrink-0 transition-colors"
                      title={panel.enabled ? 'Desativar' : 'Ativar'}
                    >
                      {panel.enabled
                        ? <ToggleRight className="w-7 h-7 text-blue-500" />
                        : <ToggleLeft className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                      }
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => savePanels(DEFAULT_PANELS)}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Restaurar padrão
                </button>
              </div>
            </div>
          </>
        )}

        {/* Row 1: KPI Cards */}
        {isVisible('kpis') && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link 
            href={'/registro-disciplinar?year=' + selectedYear + '&month=' + (selectedMonth === 'Selecionar...' ? '' : selectedMonth) + '&shift=' + (selectedShift === 'Todos' ? '' : selectedShift) + '&class=' + (selectedClass === 'Todas as turmas' ? '' : selectedClass)}
            className="p-5 flex flex-col justify-between h-36 rounded-2xl border border-blue-200/50 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/5 hover:bg-blue-100/80 dark:hover:bg-blue-500/15 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
          >
            <div className="w-9 h-9 bg-white dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mb-1">Total de Ocorrências</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalOccurrences}</p>
              </div>
              <p className="text-blue-600/50 dark:text-blue-400/50 text-xs mt-1 font-medium">No período selecionado</p>
            </div>
          </Link>

          <Link 
            href={'/registro-disciplinar?year=' + selectedYear + '&month=' + (selectedMonth === 'Selecionar...' ? '' : selectedMonth) + '&severity=Grave&shift=' + (selectedShift === 'Todos' ? '' : selectedShift) + '&class=' + (selectedClass === 'Todas as turmas' ? '' : selectedClass)}
            className="p-5 flex flex-col justify-between h-36 rounded-2xl border border-red-200/50 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/5 hover:bg-red-100/80 dark:hover:bg-red-500/15 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
          >
            <div className="w-9 h-9 bg-white dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-wider mb-1">Casos Graves</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{graveCount}</p>
              </div>
              <p className="text-red-600/50 dark:text-red-400/50 text-xs mt-1 font-medium">de {totalOccurrences} ocorrências - {gravePercent}%</p>
            </div>
          </Link>

          <Link 
            href={'/comportamento?year=' + selectedYear + '&month=' + (selectedMonth === 'Selecionar...' ? '' : selectedMonth) + '&class=' + (selectedClass === 'Todas as turmas' ? '' : selectedClass)}
            className="p-5 flex flex-col justify-between h-36 rounded-2xl border border-purple-200/50 dark:border-purple-500/20 bg-purple-50/60 dark:bg-purple-500/5 hover:bg-purple-100/80 dark:hover:bg-purple-500/15 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
          >
            <div className="w-9 h-9 bg-white dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wider mb-1">Alunos com Registros</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{impactedStudentsCount}</p>
              </div>
              <p className="text-purple-600/50 dark:text-purple-400/50 text-xs mt-1 font-medium">de {students.length} alunos - {impactedStudentsPercent}%</p>
            </div>
          </Link>

          <Link 
            href={'/comportamento?year=' + selectedYear + '&month=' + (selectedMonth === 'Selecionar...' ? '' : selectedMonth) + '&class=' + (selectedClass === 'Todas as turmas' ? '' : selectedClass)}
            className="p-5 flex flex-col justify-between h-36 rounded-2xl border border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/15 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
          >
            <div className="w-9 h-9 bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shadow-sm">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-1">Nota Média Geral</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{averagePointsStr}</p>
              </div>
              <p className="text-emerald-600/50 dark:text-emerald-400/50 text-xs mt-1 font-medium">{percentAbove7}% com nota &gt; 7.0</p>
            </div>
          </Link>
          {/* KPI Implantação */}
          <Link
            href="/implantacao"
            className="p-5 flex flex-col justify-between h-36 rounded-2xl border border-indigo-200/50 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 hover:bg-indigo-100/80 dark:hover:bg-indigo-500/15 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shadow-sm">
                <Rocket className="w-4 h-4" />
              </div>
              {implantacaoProgress && (
                <span className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full">
                  {implantacaoProgress.done}/{implantacaoProgress.total}
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mb-1">Implantação</p>
              {implantacaoProgress ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                      {implantacaoProgress.total > 0 ? Math.round((implantacaoProgress.done / implantacaoProgress.total) * 100) : 0}%
                    </p>
                  </div>
                  <div className="relative w-full mt-1.5">
                    <div className="w-full h-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: implantacaoProgress.total > 0 ? (implantacaoProgress.done / implantacaoProgress.total) * 100 + '%' : '0%' }}
                      />
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white dark:border-indigo-900 shadow-sm transition-all duration-500"
                      style={{ left: implantacaoProgress.total > 0 ? (implantacaoProgress.done / implantacaoProgress.total) * 100 + '%' : '0%' }}
                      aria-hidden="true"
                    />
                  </div>
                </>
              ) : (
                <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">—</p>
              )}
            </div>
          </Link>
        </div>}

        {/* Alerts Section */}
        {isVisible('alertas') && (() => {
          const criticalStudents = students.map(s => ({...s, currentPoints: getStudentPoints(s.id)})).filter(s => s.currentPoints < 5.0).sort((a,b) => a.currentPoints - b.currentPoints);
          if (criticalStudents.length === 0) return null;
          return (
            <div className="bg-red-50 dark:bg-[#2b1616] border border-red-200 dark:border-red-900/50 rounded-2xl p-5 mb-2 mt-4 shadow-sm">
              <h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" />
                Atenção Crítica: Alunos Próximos de Suspensão / Desligamento (Abaixo de 5.0 pts)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {criticalStudents.slice(0, 8).map(s => (
                  <button key={s.id} onClick={() => setSelectedStudentId(s.id)}
                    className="bg-white dark:bg-[#1a1f2e] p-3 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm flex justify-between items-center hover:-translate-y-0.5 transition-all duration-300 w-full text-left cursor-pointer hover:border-red-300 dark:hover:border-red-700">
                    <div className="truncate pr-2">
                      <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.class}</p>
                    </div>
                    <span className="font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded text-xs shrink-0">
                      {s.currentPoints.toFixed(1)} pts
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Row 2: Bento Grid Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          
          {/* Disciplina */}
          {isVisible('disciplina') && <div className="glass-card p-5 flex flex-col group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-slate-800/50 rounded-lg">
                   <FileText className="text-blue-500 dark:text-blue-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 dark:text-white font-bold">Disciplina</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Ocorrências registradas</p>
                </div>
              </div>
              <Link 
                href={'/registro-disciplinar?year=' + selectedYear + '&month=' + selectedMonth + '&shift=' + selectedShift + '&class=' + selectedClass}
                className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all hover:bg-blue-100 dark:hover:bg-blue-500/20"
              >
                Ver tudo <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-2 flex-1 items-center">
              <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-3 rounded-2xl flex flex-col items-center justify-center border border-emerald-500/20">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{leveCount}</span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-500 font-semibold mt-1">Leve</span>
              </div>
              <div className="bg-amber-500/10 dark:bg-amber-500/20 p-3 rounded-2xl flex flex-col items-center justify-center border border-amber-500/20">
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{mediaCount}</span>
                <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-500 font-semibold mt-1">Média</span>
              </div>
              <div className="bg-red-500/10 dark:bg-red-500/20 p-3 rounded-2xl flex flex-col items-center justify-center border border-red-500/20">
                <span className="text-xl font-bold text-red-600 dark:text-red-400">{graveCount}</span>
                <span className="text-[10px] uppercase tracking-wider text-red-700 dark:text-red-500 font-semibold mt-1">Grave</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">Nota comportamental média</span>
              <span className={'font-bold ' + (averagePoints >= 7 ? 'text-emerald-600 dark:text-emerald-400' : averagePoints >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400')}>
                {averagePointsStr} • {averagePoints >= 7 ? 'Bom' : averagePoints >= 5 ? 'Atenção' : 'Crítico'}
              </span>
            </div>
          </div>}

          {/* Elogios e Bonificações */}
          {isVisible('elogios') && <div className="glass-card p-5 flex flex-col group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-slate-800/50 rounded-lg">
                   <Award className="text-amber-500 dark:text-amber-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 dark:text-white font-bold">Elogios e Bonificações</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Reconhecimentos positivos</p>
                </div>
              </div>
              <Link 
                href={'/elogios?year=' + selectedYear + '&month=' + selectedMonth + '&shift=' + selectedShift + '&class=' + selectedClass}
                className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
              >
                Ver tudo <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-2 flex-1 items-center">
              <div className="bg-slate-50 dark:bg-[#202832] p-3 rounded-xl flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{praises?.length || 0}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">Total</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#1e2a24] p-3 rounded-xl flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">0</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">Alunos</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#1f2430] p-3 rounded-xl flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">0</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">Média/ST</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-center items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">{praises?.length > 0 ? praises.length + ' elogios no per\u00edodo' : 'Nenhum elogio no per\u00edodo'}</span>
            </div>
          </div>}

          {/* Acidentes */}
          {isVisible('acidentes') && <div className="glass-card p-5 flex flex-col group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-slate-800/50 rounded-lg">
                   <HeartPulse className="text-orange-500 dark:text-orange-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 dark:text-white font-bold">Acidentes</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Registros de segurança</p>
                </div>
              </div>
              <Link 
                href={'/acidentes?year=' + selectedYear + '&month=' + selectedMonth + '&shift=' + selectedShift + '&class=' + selectedClass}
                className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-3 py-1.5 rounded-lg text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all hover:bg-orange-100 dark:hover:bg-orange-500/20"
              >
                Ver tudo <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {(() => {
              const filteredAccidents = accidents.filter(a => !a.archived && a.date?.startsWith(selectedYear));
              const totalAcc = filteredAccidents.length;
              const withColleges = filteredAccidents.filter(a => a.parentsNotified).length;
              const withMedic = filteredAccidents.filter(a => a.medicForwarded).length;
              const topLocation = filteredAccidents.reduce<Record<string, number>>((acc, a) => {
                if (a.location) acc[a.location] = (acc[a.location] || 0) + 1;
                return acc;
              }, {});
              const topLocationEntry = Object.entries(topLocation).sort((a, b) => b[1] - a[1])[0];
              return (
                <>
                  <div className="grid grid-cols-3 gap-2 flex-1 items-center">
                    <div className="bg-slate-50 dark:bg-[#28211b] p-3 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{totalAcc}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">Total</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#281a1d] p-3 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-red-400">{withColleges}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">C/ Colégios</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#1c212e] p-3 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-blue-400">{withMedic}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">Médico</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs">
                    {topLocationEntry ? (
                      <>
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          {topLocationEntry[0]}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{topLocationEntry[1]}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs">Nenhum acidente no período</span>
                    )}
                  </div>
                </>
              );
            })()}
          </div>}

        </div>

        {/* Row 3: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {isVisible('tendencia') && <div className="glass-card p-5 col-span-1 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Tendência Mensal de Ocorrências
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selectedYear}</span>
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOcorrencias" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGraves" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="ocorrencias" name="Totais" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOcorrencias)" />
                  <Area type="monotone" dataKey="graves" name="Graves" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGraves)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>}

          {isVisible('gravidade') && <div className="glass-card p-5 flex flex-col">
            <h3 className="text-slate-800 dark:text-white font-bold mb-4 text-center lg:text-left">Distribuição por Gravidade</h3>
            <div className="flex-1 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="48%"
                    innerRadius={60}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={'cell-' + index} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>}
        </div>
      </div>
    </AppShell>

    {/* Ficha do aluno — abre ao clicar em card de aluno crítico */}
    {selectedStudentId && (
      <StudentSheet
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    )}
    </>
  );
}

