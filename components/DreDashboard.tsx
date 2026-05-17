'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users, AlertTriangle, Star, Activity, Shield, Award,
  Zap, CheckCircle2, TrendingUp, TrendingDown, Minus,
  AlertCircle, Trophy, FileWarning, SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell, PieChart, Pie,
} from 'recharts';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
export interface SchoolStats {
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
  disciplineIndex: number;
  gravityRate: number;
  praiseRatio: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface Props {
  stats: SchoolStats[];
  loading: boolean;
  isVisible: (id: string) => boolean;
  onSchoolClick?: (schoolId: string) => void;
  onNavigate?: (route: string) => void;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const RISK_META = {
  low:      { label: 'Baixo',   color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30' },
  medium:   { label: 'Medio',   color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-500/30' },
  high:     { label: 'Alto',    color: '#f97316', bg: 'bg-orange-50 dark:bg-orange-500/10',   text: 'text-orange-600 dark:text-orange-400',   border: 'border-orange-200 dark:border-orange-500/30' },
  critical: { label: 'Critico', color: '#f43f5e', bg: 'bg-rose-50 dark:bg-rose-500/10',       text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-200 dark:border-rose-500/30' },
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-slate-700 rounded-xl ${className}`} />;
}

// Anel circular de índice
function IndexRing({ value, size = 64, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const color = value >= 75 ? '#10b981' : value >= 55 ? '#f59e0b' : value >= 30 ? '#f97316' : '#f43f5e';
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const cx = size / 2;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100 dark:text-slate-700" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-black text-slate-700 dark:text-slate-200" style={{ fontSize: size * 0.22 }}>
        {value}
      </span>
    </div>
  );
}

// Barra de progresso
function Bar2({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TrendBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value < 0 : value > 0;
  if (value === 0) return <span className="text-slate-400 text-xs flex items-center gap-0.5"><Minus className="w-3 h-3" />—</span>;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${good ? 'text-emerald-500' : 'text-rose-500'}`}>
      {good ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

// ─────────────────────────────────────────────
// Card de KPI primário (hero) — clicável
// ─────────────────────────────────────────────
function HeroKpi({ label, value, sub, icon: Icon, accentClass, iconPillClass, trend = 0, inverse = false, onClick, ariaLabel }:
  { label: string; value: string | number; sub?: string; icon: React.ElementType; accentClass: string; iconPillClass?: string; trend?: number; inverse?: boolean; onClick?: () => void; ariaLabel?: string }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between min-h-[130px] w-full text-left ${accentClass} ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {/* Ícone no canto superior direito — estilo pill circular */}
      <div className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${iconPillClass ?? 'bg-white/20'}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="pr-10">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
        <p className="text-5xl font-black tracking-tight leading-none mt-3">{value}</p>
        {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
        <div className="mt-2">
          <TrendBadge value={trend} inverse={inverse} />
        </div>
      </div>
    </Tag>
  );
}

// ─────────────────────────────────────────────
// Card de KPI secundário — clicável
// ─────────────────────────────────────────────
function SecKpi({ label, value, sub, icon: Icon, iconBg, children, onClick, ariaLabel }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; children?: React.ReactNode;
  onClick?: () => void; ariaLabel?: string;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col gap-3 w-full text-left ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/40 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {/* Ícone pill no canto superior direito — referência dashboard */}
      <div className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${iconBg}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="pr-10">
        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{value}</p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {children}
    </Tag>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
type Period = 'dia' | 'semana' | 'mes';

const PERIOD_LABELS: Record<Period, string> = {
  dia: 'Hoje',
  semana: 'Esta semana',
  mes: 'Este mes',
};

export default function DreDashboard({ stats, loading, isVisible, onSchoolClick, onNavigate }: Props) {
  const nav = (route: string) => onNavigate?.(route);

  // ─── Filtros locais ───────────────────────────
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('todas');
  const [selectedPeriod, setSelectedPeriod]     = useState<Period>('mes');
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!schoolDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(e.target as Node)) {
        setSchoolDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [schoolDropdownOpen]);

  // Aplica filtro de escola (os dados de período viriam do backend num app real;
  // aqui apenas filtramos por escola localmente)
  const filteredStats = selectedSchoolId === 'todas'
    ? stats
    : stats.filter(s => s.id === selectedSchoolId);

  const totalStudents   = filteredStats.reduce((s, x) => s + x.students, 0);
  const totalOcc        = filteredStats.reduce((s, x) => s + x.occurrences, 0);
  const totalPraises    = filteredStats.reduce((s, x) => s + x.praises, 0);
  const totalAccidents  = filteredStats.reduce((s, x) => s + x.accidents, 0);
  const totalGraves     = filteredStats.reduce((s, x) => s + x.graves, 0);
  const totalLeves      = filteredStats.reduce((s, x) => s + x.leves, 0);
  const totalMedias     = filteredStats.reduce((s, x) => s + x.medias, 0);
  const avgDiscipline   = filteredStats.length > 0 ? Math.round(filteredStats.reduce((s, x) => s + x.disciplineIndex, 0) / filteredStats.length) : 0;
  const globalGravityRate = totalOcc > 0 ? Math.round((totalGraves / totalOcc) * 100) : 0;
  const globalPraiseRatio = totalStudents > 0 ? Math.round((totalPraises / totalStudents) * 100) : 0;
  const alertSchools    = filteredStats.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length;
  const ranked          = [...filteredStats].sort((a, b) => b.disciplineIndex - a.disciplineIndex);

  const totalImpl = filteredStats.reduce((s, x) => s + x.implantacaoTotal, 0);
  const doneImpl  = filteredStats.reduce((s, x) => s + x.implantacaoDone, 0);
  const pctImpl   = totalImpl > 0 ? Math.round((doneImpl / totalImpl) * 100) : 0;

  // Dados para o gráfico de barras comparativo
  const barData = filteredStats.map(s => ({
    name: s.name.replace('EECM Prof. ', '').substring(0, 10),
    fullName: s.name,
    Disciplina: s.disciplineIndex,
    Ocorrencias: s.occurrences,
    Elogios: s.praises,
  }));

  // Dados para o gráfico de severidade (pizza)
  const severityData = [
    { name: 'Leves',  value: totalLeves,  fill: '#f59e0b' },
    { name: 'Medias', value: totalMedias, fill: '#f97316' },
    { name: 'Graves', value: totalGraves, fill: '#f43f5e' },
  ].filter(d => d.value > 0);

  // ─── Loading skeleton ───────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-60" />
          <Skeleton className="h-60" />
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileWarning className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma escola encontrada.</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Verifique a conexao e atualize.</p>
      </div>
    );
  }

  // Nome da escola selecionada para exibição
  const selectedSchoolName = selectedSchoolId === 'todas'
    ? 'Todas as escolas'
    : (stats.find(s => s.id === selectedSchoolId)?.name ?? 'Escola');

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════
          BARRA DE FILTROS — Ajustes + Escola + Periodo
      ══════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Label esquerda */}
        <div>
          <h2 className="text-white font-bold text-lg leading-tight">Visao Consolidada</h2>
          <p className="text-blue-200/70 text-xs mt-0.5">
            {selectedSchoolId === 'todas' ? `${stats.length} escolas · ` : ''}{PERIOD_LABELS[selectedPeriod]}
          </p>
        </div>

        {/* Controles direita — igual à referência */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Ícone de ajustes */}
          <button
            aria-label="Ajustes de filtros"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Dropdown — Escola */}
          <div className="relative" ref={schoolDropdownRef}>
            <button
              onClick={() => setSchoolDropdownOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={schoolDropdownOpen}
              aria-label="Selecionar escola"
              className="flex items-center gap-2 h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 min-w-[148px]"
            >
              <span className="truncate max-w-[120px]">
                {selectedSchoolId === 'todas' ? 'Todas as escolas' : selectedSchoolName.replace(/EECM Prof\. /i, '')}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${schoolDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {schoolDropdownOpen && (
              <div
                role="listbox"
                aria-label="Selecionar escola"
                className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                {[{ id: 'todas', name: 'Todas as escolas' }, ...stats.map(s => ({ id: s.id, name: s.name }))].map(opt => (
                  <button
                    key={opt.id}
                    role="option"
                    aria-selected={selectedSchoolId === opt.id}
                    onClick={() => { setSelectedSchoolId(opt.id); setSchoolDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedSchoolId === opt.id ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pills de período */}
          <div className="flex items-center bg-white/10 border border-white/20 rounded-full p-0.5" role="group" aria-label="Selecionar periodo">
            {(['dia', 'semana', 'mes'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                aria-pressed={selectedPeriod === p}
                className={`px-3 h-7 rounded-full text-xs font-semibold transition-all ${selectedPeriod === p ? 'bg-white text-blue-700 shadow-sm' : 'text-white/80 hover:text-white'}`}
              >
                {p === 'dia' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          KPIs PRIMÁRIOS — Bento Grid Hero
      ══════════════════════════════════════════ */}
      {isVisible('kpis_primarios') && (
        <section>
          {/* Label de seção */}
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Visao Geral da Rede</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* Card herói — Índice de Disciplina (2 colunas mobile, 1 desktop) */}
            <button
              onClick={() => nav('/relatorios')}
              aria-label={`Indice disciplinar medio da rede: ${avgDiscipline}. Clique para ver relatorios`}
              className="col-span-2 md:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-5 text-white shadow-lg shadow-blue-500/25 flex flex-col justify-between min-h-[140px] w-full text-left cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-800"
            >
              {/* Decorativo */}
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -right-2 bottom-4 w-16 h-16 bg-white/5 rounded-full" />
              {/* Ícone pill canto superior direito */}
              <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div className="relative pr-10">
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-200">Indice Disciplinar</p>
                <div className="flex items-end gap-3 mt-2">
                  <p className="text-6xl font-black tracking-tighter leading-none">{avgDiscipline}</p>
                  <div className="pb-1">
                    <p className="text-xs text-blue-200">/ 100</p>
                    <p className="text-[10px] text-blue-300 mt-0.5">media da rede</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-3">
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/70 rounded-full transition-all duration-1000" style={{ width: `${avgDiscipline}%` }} />
                </div>
                <p className="text-[10px] text-blue-200 mt-1.5">
                  {avgDiscipline >= 75 ? 'Rede em boa situacao' : avgDiscipline >= 55 ? 'Atencao em algumas escolas' : 'Intervencao recomendada'}
                </p>
              </div>
            </button>

            {/* Alunos Ativos */}
            <SecKpi label="Alunos Ativos" value={totalStudents.toLocaleString('pt-BR')}
              sub={`${stats.length} escola${stats.length !== 1 ? 's' : ''} ativas`}
              icon={Users} iconBg="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
              onClick={() => nav('/alunos')} ariaLabel={`${totalStudents} alunos ativos. Clique para ver lista de alunos`}>
              <Bar2 value={totalStudents} max={1000} color="bg-blue-400" />
            </SecKpi>

            {/* Ocorrências */}
            <SecKpi label="Ocorrencias" value={totalOcc}
              sub=""
              icon={AlertTriangle} iconBg="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
              onClick={() => nav('/registro-disciplinar')} ariaLabel={`${totalOcc} ocorrencias. Clique para ver registro disciplinar`}>
              <div className="flex gap-1.5 flex-wrap">
                {totalLeves > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">L {totalLeves}</span>}
                {totalMedias > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">M {totalMedias}</span>}
                {totalGraves > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">G {totalGraves}</span>}
                {totalOcc === 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Nenhuma</span>}
              </div>
            </SecKpi>

            {/* Elogios */}
            <SecKpi label="Elogios" value={totalPraises}
              sub={`${globalPraiseRatio} por 100 alunos`}
              icon={Star} iconBg="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              onClick={() => nav('/elogios')} ariaLabel={`${totalPraises} elogios. Clique para ver elogios e bonificacoes`}>
              <Bar2 value={totalPraises} max={Math.max(totalOcc, totalPraises, 1)} color="bg-emerald-400" />
            </SecKpi>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          KPIs SECUNDÁRIOS — métricas derivadas
      ══════════════════════════════════════════ */}
      {isVisible('kpis_secundarios') && (
        <section>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Metricas Derivadas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* Taxa de gravidade */}
            <button
              onClick={() => nav('/registro-disciplinar')}
              aria-label={`Taxa de gravidade: ${globalGravityRate}%. Clique para ver registro disciplinar`}
              className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm text-left w-full cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-rose-300 dark:hover:border-rose-500/40 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <div className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${globalGravityRate > 30 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : globalGravityRate > 15 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                <Zap className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide pr-10 mb-3">Taxa Gravidade</p>
              <p className="text-4xl font-black text-slate-800 dark:text-white leading-none pr-10">{globalGravityRate}<span className="text-xl font-medium text-slate-400 ml-0.5">%</span></p>
              <Bar2 value={globalGravityRate} max={100} color={globalGravityRate > 30 ? 'bg-rose-500' : globalGravityRate > 15 ? 'bg-amber-400' : 'bg-emerald-400'} />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">graves / total</p>
            </button>

            {/* Razão elogio/ocorrência */}
            <button
              onClick={() => nav('/elogios')}
              aria-label="Razao elogio sobre ocorrencia. Clique para ver elogios"
              className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm text-left w-full cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/40 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                <Award className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide pr-10 mb-3">Razao E/O</p>
              <p className="text-4xl font-black text-slate-800 dark:text-white leading-none pr-10">
                {totalOcc > 0 ? (totalPraises / totalOcc).toFixed(1) : '—'}<span className="text-xl font-medium text-slate-400 ml-1">x</span>
              </p>
              <Bar2 value={Math.min(totalPraises, totalOcc * 2)} max={totalOcc * 2 || 1} color="bg-emerald-400" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{totalPraises > totalOcc ? 'acima do esperado' : 'abaixo do esperado'}</p>
            </button>

            {/* Acidentes */}
            <button
              onClick={() => nav('/acidentes')}
              aria-label={`${totalAccidents} acidentes registrados. Clique para ver registro de acidentes`}
              className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm text-left w-full cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500/40 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide pr-10 mb-3">Acidentes</p>
              <p className="text-4xl font-black text-slate-800 dark:text-white leading-none pr-10">{totalAccidents}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {totalStudents > 0 ? ((totalAccidents / totalStudents) * 1000).toFixed(1) : '0'} por mil alunos
              </p>
              <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${totalAccidents === 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                {totalAccidents === 0 ? 'Zero acidentes' : 'Requer atencao'}
              </div>
            </button>

            {/* Alertas */}
            <button
              onClick={() => nav('/comportamento')}
              aria-label={`${alertSchools} escolas em alerta. Clique para ver comportamento e rankings`}
              className={`relative rounded-2xl p-5 shadow-sm border text-left w-full cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${alertSchools > 0 ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/30 hover:border-rose-400 dark:hover:border-rose-400/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/40'}`}
            >
              <div className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${alertSchools > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                <Zap className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide pr-10 mb-2">Alertas</p>
              <p className={`text-4xl font-black leading-none pr-10 ${alertSchools > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>{alertSchools}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {alertSchools === 0 ? 'Nenhuma escola em alerta' : `escola${alertSchools > 1 ? 's' : ''} acima do limiar`}
              </p>
              <div className="flex gap-1 flex-wrap mt-2">
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
            </button>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          GRÁFICOS — Comparativo + Severidade
      ══════════════════════════════════════════ */}
      {isVisible('kpis_primarios') && stats.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Gráfico de barras comparativo */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Comparativo por Escola</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Indice de disciplina vs ocorrencias</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barSize={18} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, fontSize: 12, color: '#e2e8f0' }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Bar dataKey="Disciplina" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ocorrencias" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Elogios" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2">
              {[{color:'bg-blue-500',label:'Disciplina'},{color:'bg-orange-500',label:'Ocorrencias'},{color:'bg-emerald-500',label:'Elogios'}].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de pizza — severidade */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="mb-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Severidade</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Distribuicao das ocorrencias</p>
            </div>
            {totalOcc === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">Sem ocorrencias</p>
                </div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                      {severityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, fontSize: 12, color: '#e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {severityData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{d.value}</span>
                        <span className="text-[10px] text-slate-400">{totalOcc > 0 ? Math.round((d.value / totalOcc) * 100) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          IMPLANTAÇÃO
      ══════════════════════════════════════════ */}
      {isVisible('implantacao') && (
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Implantacao da Rede</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{doneImpl} de {totalImpl} itens concluidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{pctImpl}%</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">concluido</p>
              </div>
              <IndexRing value={pctImpl} size={52} stroke={5} />
            </div>
          </div>
          <Bar2 value={doneImpl} max={totalImpl || 1} color={pctImpl >= 80 ? 'bg-emerald-500' : pctImpl >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
          {stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
              {stats.map(school => {
                const pct = school.implantacaoTotal > 0 ? Math.round((school.implantacaoDone / school.implantacaoTotal) * 100) : 0;
                return (
                  <div key={school.id} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate pr-2">{school.name.replace('EECM Prof. ', '')}</p>
                      <span className={`text-[10px] font-bold shrink-0 ${pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{pct}%</span>
                    </div>
                    <Bar2 value={school.implantacaoDone} max={school.implantacaoTotal || 1} color={pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{school.implantacaoDone}/{school.implantacaoTotal} itens</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════
          RANKING + CARDS DE ESCOLAS
      ══════════════════════════════════════════ */}
      {(isVisible('ranking') || isVisible('escolas')) && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Ranking */}
          {isVisible('ranking') && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Ranking Disciplinar</p>
              </div>
              <div className="space-y-4">
                {ranked.map((school, idx) => {
                  const risk = RISK_META[school.riskLevel];
                  const medals = ['🥇','🥈','🥉'];
                  return (
                    <div key={school.id} className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm shrink-0">
                        {idx < 3 ? medals[idx] : <span className="text-xs font-bold text-slate-400">{idx + 1}</span>}
                      </span>
                      <IndexRing value={school.disciplineIndex} size={44} stroke={5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">{school.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${risk.bg} ${risk.text} border ${risk.border}`}>
                            {risk.label}
                          </span>
                          <span className="text-[10px] text-slate-400">{school.occurrences} ocorr.</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cards de escolas expandidos */}
          {isVisible('escolas') && (
            <div className={`${isVisible('ranking') ? 'lg:col-span-2' : 'lg:col-span-3'} grid grid-cols-1 sm:grid-cols-2 gap-4 content-start`}>
              {stats.map(school => {
                const risk = RISK_META[school.riskLevel];
                const pctImpl = school.implantacaoTotal > 0 ? Math.round((school.implantacaoDone / school.implantacaoTotal) * 100) : 0;
                return (
                  <div
                    key={school.id}
                    onClick={() => onSchoolClick?.(school.id)}
                    className={`bg-white dark:bg-slate-800 border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${onSchoolClick ? 'cursor-pointer' : ''} ${school.riskLevel === 'critical' ? 'border-rose-300 dark:border-rose-500/40' : school.riskLevel === 'high' ? 'border-orange-300 dark:border-orange-500/40' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    {/* Header do card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">{school.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{school.students} alunos</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ background: risk.color }} />
                          {risk.label}
                        </span>
                        <IndexRing value={school.disciplineIndex} size={40} stroke={4} />
                      </div>
                    </div>

                    {/* Métricas do card */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: 'Ocorr.', value: school.occurrences, color: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Elogios', value: school.praises, color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Acid.', value: school.accidents, color: 'text-violet-600 dark:text-violet-400' },
                      ].map(m => (
                        <div key={m.label} className="text-center bg-slate-50 dark:bg-slate-700/40 rounded-xl py-2">
                          <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{m.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Barras L/M/G */}
                    {school.occurrences > 0 && (
                      <div className="mb-3">
                        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                          {school.leves > 0  && <div className="bg-amber-400 rounded-full transition-all" style={{ flex: school.leves }} />}
                          {school.medias > 0 && <div className="bg-orange-500 rounded-full transition-all" style={{ flex: school.medias }} />}
                          {school.graves > 0 && <div className="bg-rose-500 rounded-full transition-all" style={{ flex: school.graves }} />}
                        </div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[9px] text-amber-500 font-semibold">L {school.leves}</span>
                          <span className="text-[9px] text-orange-500 font-semibold">M {school.medias}</span>
                          <span className="text-[9px] text-rose-500 font-bold">G {school.graves}</span>
                        </div>
                      </div>
                    )}

                    {/* Implantação */}
                    {school.implantacaoTotal > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Implantacao</p>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{pctImpl}%</p>
                        </div>
                        <Bar2 value={school.implantacaoDone} max={school.implantacaoTotal} color={pctImpl >= 80 ? 'bg-emerald-500' : pctImpl >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
