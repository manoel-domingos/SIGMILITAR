'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase as supabaseClient } from '@/lib/supabase';
import {
  Building2, Users, AlertTriangle, Star, Activity,
  RefreshCw, ShieldCheck, SwitchCamera, TrendingUp,
  TrendingDown, Minus, Shield, Award, Zap, AlertCircle,
  ChevronRight, BarChart3, LayoutDashboard, GripVertical,
  ToggleLeft, ToggleRight, X, CheckCircle2,
} from 'lucide-react';

const supabase = supabaseClient!;

interface SchoolStats {
  id: string;
  name: string;
  students: number;
  occurrences: number;
  praises: number;
  accidents: number;
  leves: number;
  medias: number;
  graves: number;
  implantacaoTotal: number;
  implantacaoDone: number;
  // Indices calculados
  disciplineIndex: number;   // 0-100: 100 = perfeito
  gravityRate: number;       // % de ocorrencias graves
  praiseRatio: number;       // elogios por 100 alunos
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcDisciplineIndex(s: SchoolStats): number {
  if (s.students === 0) return 100;
  const occRate = Math.min(s.occurrences / s.students, 1);
  const gravPenalty = s.graves * 2;
  const praiseBonus = Math.min(s.praises / s.students, 0.5) * 20;
  const raw = 100 - occRate * 60 - (gravPenalty / Math.max(s.students, 1)) * 20 + praiseBonus;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function calcRisk(s: SchoolStats): SchoolStats['riskLevel'] {
  if (s.graves >= 10 || s.disciplineIndex < 30) return 'critical';
  if (s.graves >= 5  || s.disciplineIndex < 55) return 'high';
  if (s.graves >= 2  || s.disciplineIndex < 75) return 'medium';
  return 'low';
}

const RISK_META = {
  low:      { label: 'Baixo',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', dot: 'bg-emerald-500' },
  medium:   { label: 'Medio',    color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-500/10',     dot: 'bg-amber-400' },
  high:     { label: 'Alto',     color: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-500/10',   dot: 'bg-orange-500' },
  critical: { label: 'Critico',  color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-500/10',       dot: 'bg-rose-500' },
};

function TrendBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value < 0 : value > 0;
  const neutral = value === 0;
  if (neutral) return <span className="flex items-center gap-0.5 text-slate-400 text-xs"><Minus className="w-3 h-3" /> —</span>;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
      {good ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

// Barra de progresso reutilizável
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Indicador circular de índice de disciplina
function DisciplineRing({ value }: { value: number }) {
  const color = value >= 75 ? '#10b981' : value >= 55 ? '#f59e0b' : value >= 30 ? '#f97316' : '#f43f5e';
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-700" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200">
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function DrePage() {
  const router = useRouter();
  const { currentUserRole, currentUserSchoolId, setActiveSchoolContext, openContextModal } = useAppContext();

  const [stats, setStats] = useState<SchoolStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  type DREPanel = { id: string; label: string; enabled: boolean };
  const DRE_DEFAULT_PANELS: DREPanel[] = [
    { id: 'kpis_primarios',   label: 'KPIs Primarios',        enabled: true },
    { id: 'kpis_secundarios', label: 'KPIs Secundarios',      enabled: true },
    { id: 'implantacao',      label: 'KPI Implantacao',        enabled: true },
    { id: 'ranking',          label: 'Ranking Disciplinar',    enabled: true },
    { id: 'escolas',          label: 'Cards de Escolas',       enabled: true },
  ];
  const [panels, setPanels] = React.useState<DREPanel[]>(DRE_DEFAULT_PANELS);

  const togglePanel = (id: string) => setPanels(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  const movePanel = (from: number, to: number) => {
    const next = [...panels]; const [item] = next.splice(from, 1); next.splice(to, 0, item); setPanels(next);
  };
  const isVisible = (id: string) => panels.find(p => p.id === id)?.enabled ?? true;

  useEffect(() => {
    if (currentUserRole !== 'admin_global' && currentUserSchoolId !== 'DRE') {
      router.replace('/');
    }
  }, [currentUserRole, currentUserSchoolId, router]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_dre_school_stats');
      if (error) throw error;

      const statsArr: SchoolStats[] = (data ?? []).map((row: any) => {
        const partial = {
          id:               row.school_id,
          name:             row.school_name,
          students:         Number(row.students)          || 0,
          occurrences:      Number(row.occurrences)       || 0,
          leves:            Number(row.leves)             || 0,
          medias:           Number(row.medias)            || 0,
          graves:           Number(row.graves)            || 0,
          praises:          Number(row.praises)           || 0,
          accidents:        Number(row.accidents)         || 0,
          implantacaoTotal: Number(row.implantacao_total) || 0,
          implantacaoDone:  Number(row.implantacao_done)  || 0,
        };
        const disciplineIndex = calcDisciplineIndex(partial as SchoolStats);
        const gravityRate     = partial.occurrences > 0 ? Math.round((partial.graves / partial.occurrences) * 100) : 0;
        const praiseRatio     = partial.students    > 0 ? Math.round((partial.praises / partial.students)    * 100) : 0;
        const full = { ...partial, disciplineIndex, gravityRate, praiseRatio, riskLevel: 'low' as const };
        return { ...full, riskLevel: calcRisk(full) };
      });

      setStats(statsArr);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // KPIs consolidados
  const totalStudents    = stats.reduce((s, x) => s + x.students, 0);
  const totalOcc         = stats.reduce((s, x) => s + x.occurrences, 0);
  const totalPraises     = stats.reduce((s, x) => s + x.praises, 0);
  const totalAccidents   = stats.reduce((s, x) => s + x.accidents, 0);
  const totalGraves      = stats.reduce((s, x) => s + x.graves, 0);
  const avgDiscipline    = stats.length > 0 ? Math.round(stats.reduce((s, x) => s + x.disciplineIndex, 0) / stats.length) : 0;
  const globalGravityRate = totalOcc > 0 ? Math.round((totalGraves / totalOcc) * 100) : 0;
  const globalPraiseRatio = totalStudents > 0 ? Math.round((totalPraises / totalStudents) * 100) : 0;
  const alertSchools     = stats.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length;

  // Ranking por disciplina
  const ranked = [...stats].sort((a, b) => b.disciplineIndex - a.disciplineIndex);

  if (currentUserRole !== 'admin_global') return null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* ---- HEADER ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Painel DRE</h1>
              {alertSchools > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-500/30">
                  <AlertCircle className="w-3 h-3" /> {alertSchools} alerta{alertSchools > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Gestao regional consolidada · {stats.length} escola{stats.length !== 1 ? 's' : ''}
              {lastUpdated && (
                <span className="ml-2 text-slate-400 dark:text-slate-500">
                  · {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openContextModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <SwitchCamera className="w-4 h-4" />
            <span className="hidden sm:inline">Trocar Escola</span>
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Editar Painel</span>
          </button>
          <button
            onClick={() => load()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* ---- DRAWER EDITAR PAINEL ---- */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white text-base">Configurar Painel DRE</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ative, desative e reordene</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {panels.map((panel, idx) => (
                <div
                  key={panel.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => { if (dragIdx !== null && dragIdx !== idx) movePanel(dragIdx, idx); setDragIdx(null); }}
                  onDragEnd={() => setDragIdx(null)}
                  className={'flex items-center gap-3 px-3 py-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ' + (dragIdx === idx ? 'opacity-40 scale-95' : '') + ' ' + (panel.enabled ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50')}
                >
                  <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  <span className={'flex-1 text-sm font-medium ' + (panel.enabled ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 line-through')}>{panel.label}</span>
                  <button onClick={() => togglePanel(panel.id)} className="shrink-0 transition-colors" title={panel.enabled ? 'Desativar' : 'Ativar'}>
                    {panel.enabled
                      ? <ToggleRight className="w-7 h-7 text-blue-500" />
                      : <ToggleLeft  className="w-7 h-7 text-slate-300 dark:text-slate-600" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setPanels(DRE_DEFAULT_PANELS)} className="w-full text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                Restaurar padrao
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---- KPIs PRIMÁRIOS (linha grande) ---- */}
      {isVisible('kpis_primarios') && <section className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* Indice Global de Disciplina — destaque */}
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-lg shadow-blue-500/20 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Indice de Disciplina</p>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-5xl font-black tracking-tight">{avgDiscipline}</p>
              <p className="text-xs text-blue-200 mt-1">media da rede · /100</p>
            </div>
            <Shield className="w-10 h-10 text-blue-300/60" />
          </div>
          <ProgressBar value={avgDiscipline} max={100} color="bg-white/40" />
          <p className="text-[10px] text-blue-200 mt-1">
            {avgDiscipline >= 75 ? 'Rede em boa situacao disciplinar' : avgDiscipline >= 55 ? 'Atencao necessaria em algumas escolas' : 'Intervencao recomendada'}
          </p>
        </div>

        {/* Total alunos */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </div>
            <TrendBadge value={0} />
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white mt-3 tracking-tight">{totalStudents.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium uppercase tracking-wide">Alunos Ativos</p>
          <p className="text-[11px] text-slate-400 mt-1">{stats.length} escola{stats.length !== 1 ? 's' : ''} ativas</p>
        </div>

        {/* Ocorrencias */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <TrendBadge value={0} inverse />
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white mt-3 tracking-tight">{totalOcc}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium uppercase tracking-wide">Ocorrencias</p>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] text-amber-500 font-medium">L {stats.reduce((s,x)=>s+x.leves,0)}</span>
            <span className="text-[10px] text-orange-500 font-medium">M {stats.reduce((s,x)=>s+x.medias,0)}</span>
            <span className="text-[10px] text-rose-500 font-bold">G {totalGraves}</span>
          </div>
        </div>

        {/* Elogios */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <TrendBadge value={0} />
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white mt-3 tracking-tight">{totalPraises}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium uppercase tracking-wide">Elogios</p>
          <p className="text-[11px] text-slate-400 mt-1">{globalPraiseRatio} por 100 alunos</p>
        </div>
      </section>}

      {/* ---- KPIs SECUNDÁRIOS (indices calculados) ---- */}
      {isVisible('kpis_secundarios') && <section className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-rose-500" />
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Taxa de Gravidade</p>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{globalGravityRate}<span className="text-base font-medium text-slate-400">%</span></p>
          <ProgressBar value={globalGravityRate} max={100} color={globalGravityRate > 30 ? 'bg-rose-500' : globalGravityRate > 15 ? 'bg-amber-400' : 'bg-emerald-400'} />
          <p className="text-[10px] text-slate-400 mt-1">ocorrencias graves / total</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Razao Elogio/Ocorrencia</p>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            {totalOcc > 0 ? (totalPraises / totalOcc).toFixed(1) : '—'}
            <span className="text-sm font-medium text-slate-400 ml-1">x</span>
          </p>
          <ProgressBar value={Math.min(totalPraises, totalOcc * 2)} max={totalOcc * 2 || 1} color="bg-emerald-400" />
          <p className="text-[10px] text-slate-400 mt-1">{totalPraises > totalOcc ? 'acima do esperado' : 'abaixo do esperado'}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-violet-500" />
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Acidentes Registrados</p>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{totalAccidents}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            {totalStudents > 0 ? ((totalAccidents / totalStudents) * 1000).toFixed(1) : '0'} por mil alunos
          </p>
          <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${totalAccidents === 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
            {totalAccidents === 0 ? 'Zero acidentes' : 'Requer atencao'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Alertas Ativos</p>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{alertSchools}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            {alertSchools === 0 ? 'Nenhuma escola em alerta' : `${alertSchools} escola${alertSchools > 1 ? 's' : ''} acima do limiar`}
          </p>
          <div className="flex gap-1 mt-2">
            {stats.filter(s => s.riskLevel === 'critical').length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                {stats.filter(s => s.riskLevel === 'critical').length} CRITICO
              </span>
            )}
            {stats.filter(s => s.riskLevel === 'high').length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                {stats.filter(s => s.riskLevel === 'high').length} ALTO
              </span>
            )}
            {alertSchools === 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">TUDO OK</span>
            )}
          </div>
        </div>
      </section>}

      {/* ---- KPI IMPLANTACAO ---- */}
      {isVisible('implantacao') && (() => {
        const totalImpl = stats.reduce((s, x) => s + x.implantacaoTotal, 0);
        const doneImpl  = stats.reduce((s, x) => s + x.implantacaoDone, 0);
        const pctImpl   = totalImpl > 0 ? Math.round((doneImpl / totalImpl) * 100) : 0;
        return (
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Implantacao da Rede</h2>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pctImpl >= 80 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : pctImpl >= 50 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                {pctImpl}% concluido
              </span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{doneImpl}<span className="text-base font-medium text-slate-400 ml-1">/ {totalImpl}</span></p>
              <div className="flex-1">
                <ProgressBar value={doneImpl} max={totalImpl || 1} color={pctImpl >= 80 ? 'bg-emerald-500' : pctImpl >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
                <p className="text-[10px] text-slate-400 mt-1">itens concluidos de {totalImpl} no total da rede</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              {stats.map(school => {
                const pct = school.implantacaoTotal > 0 ? Math.round((school.implantacaoDone / school.implantacaoTotal) * 100) : 0;
                return (
                  <div key={school.id} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">{school.name.replace('EECM Prof. ', '')}</p>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{pct}%</span>
                    </div>
                    <ProgressBar value={school.implantacaoDone} max={school.implantacaoTotal || 1} color={pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
                    <p className="text-[10px] text-slate-400">{school.implantacaoDone}/{school.implantacaoTotal} itens</p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ---- RANKING + CARDS DE ESCOLAS ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ display: (!isVisible('ranking') && !isVisible('escolas')) ? 'none' : undefined }}>

        {/* Ranking de disciplina */}
        {isVisible('ranking') && <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ranking Disciplinar</h2>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse"/>)}</div>
          ) : ranked.length === 0 ? (
            <p className="text-sm text-slate-400">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {ranked.map((school, idx) => {
                const risk = RISK_META[school.riskLevel];
                return (
                  <div key={school.id} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                    <DisciplineRing value={school.disciplineIndex} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{school.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                        <span className={`text-[10px] font-medium ${risk.color}`}>{risk.label}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setActiveSchoolContext(school.id); router.push('/'); }}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>}

        {/* Cards de escolas */}
        {isVisible('escolas') && <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Escolas da Rede</h2>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"/>)}</div>
          ) : stats.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma escola encontrada.</p>
          ) : (
            stats.map(school => {
              const risk = RISK_META[school.riskLevel];
              return (
                <div key={school.id} className={`bg-white dark:bg-slate-800 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group ${school.riskLevel === 'critical' ? 'border-rose-300 dark:border-rose-500/40' : school.riskLevel === 'high' ? 'border-orange-200 dark:border-orange-500/30' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50'}`}>

                  {/* Cabecalho do card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{school.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                          <span className={`text-[10px] font-semibold ${risk.color}`}>Risco {risk.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DisciplineRing value={school.disciplineIndex} />
                      <button
                        onClick={() => { setActiveSchoolContext(school.id); router.push('/'); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition opacity-0 group-hover:opacity-100"
                      >
                        Ver <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Grid de métricas */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[
                      { label: 'Alunos',    value: school.students,    color: 'text-slate-700 dark:text-white' },
                      { label: 'Ocorr.',    value: school.occurrences, color: 'text-amber-600 dark:text-amber-400' },
                      { label: 'Graves',    value: school.graves,      color: 'text-rose-600 dark:text-rose-400' },
                      { label: 'Elogios',   value: school.praises,     color: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'Acidentes', value: school.accidents,   color: 'text-violet-600 dark:text-violet-400' },
                    ].map(m => (
                      <div key={m.label} className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-2">
                        <p className={`text-base font-black ${m.color}`}>{m.value}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Indices calculados */}
                  <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-500 dark:text-slate-400">Taxa graves</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{school.gravityRate}%</span>
                      </div>
                      <ProgressBar value={school.gravityRate} max={100} color={school.gravityRate > 30 ? 'bg-rose-400' : school.gravityRate > 15 ? 'bg-amber-400' : 'bg-emerald-400'} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-500 dark:text-slate-400">Elogios/100 alunos</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{school.praiseRatio}</span>
                      </div>
                      <ProgressBar value={school.praiseRatio} max={100} color="bg-emerald-400" />
                    </div>
                  </div>

                  {/* Barra de severidade de ocorrências */}
                  {school.occurrences > 0 && (
                    <div className="mt-3">
                      <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Distribuicao de ocorrencias</p>
                      <div className="flex h-2 rounded-full overflow-hidden gap-px">
                        {school.leves  > 0 && <div className="bg-amber-300 dark:bg-amber-500 rounded-l-full" style={{ width: `${(school.leves/school.occurrences)*100}%` }} title={`Leves: ${school.leves}`} />}
                        {school.medias > 0 && <div className="bg-orange-400 dark:bg-orange-500" style={{ width: `${(school.medias/school.occurrences)*100}%` }} title={`Medias: ${school.medias}`} />}
                        {school.graves > 0 && <div className="bg-rose-500 dark:bg-rose-600 rounded-r-full" style={{ width: `${(school.graves/school.occurrences)*100}%` }} title={`Graves: ${school.graves}`} />}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>}
      </div>
    </div>
  );
}
