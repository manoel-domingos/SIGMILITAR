'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
 Users, AlertTriangle, Star, Activity, Shield, Award,
 Zap, CheckCircle2, TrendingUp, TrendingDown, Minus,
 AlertCircle, Trophy, FileWarning, SlidersHorizontal, ChevronDown,
 Building2, BookOpen, GraduationCap, Filter,
} from 'lucide-react';
import {
 BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
 PieChart, Pie, Cell,
 LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
export interface SleepBucket { label: string; value: number; date: string; }
export interface SleepData { byWeek: SleepBucket[]; byMonth: SleepBucket[]; }

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
 sleepData?: SleepData;
 onSchoolClick?: (schoolId: string) => void;
 onNavigate?: (route: string) => void;
}

// ─────────────────────────────────────────────
// Helpers visuais
// ─────────────────────────────────────────────
const RISK_META = {
 low: { label: 'Baixo', color: '#10b981', bg: 'bg-emerald-50 ', text: 'text-emerald-600 ', border: 'border-emerald-200 ' },
 medium: { label: 'Medio', color: '#f59e0b', bg: 'bg-amber-50 ', text: 'text-amber-600 ', border: 'border-amber-200 ' },
 high: { label: 'Alto', color: '#f97316', bg: 'bg-orange-50 ', text: 'text-orange-600 ', border: 'border-orange-200 ' },
 critical: { label: 'Critico', color: '#f43f5e', bg: 'bg-rose-50 ', text: 'text-rose-600 ', border: 'border-rose-200 ' },
};

// Labels de severidade para filtros de ocorrências
const SEV_FILTERS = [
 { id: 'todas', label: 'Todas' },
 { id: 'Grave', label: 'Graves' },
 { id: 'Media', label: 'Medias' },
 { id: 'Leve', label: 'Leves' },
] as const;
type SevFilter = typeof SEV_FILTERS[number]['id'];

function Skeleton({ className = '' }: { className?: string }) {
 return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
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
 <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100 " />
 <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke}
 strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
 style={{ transition: 'stroke-dasharray 0.8s ease' }}
 />
 </svg>
 <span className="absolute inset-0 flex items-center justify-center font-black text-[#2B2C33] " style={{ fontSize: size * 0.22 }}>
 {value}
 </span>
 </div>
 );
}

// Gauge semicircular para o KPI de implantação na sidebar
function SemiGauge({ value }: { value: number }) {
 const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#f43f5e';
 const r = 52;
 const cx = 70;
 const cy = 70;
 const startAngle = Math.PI;
 const endAngle = 2 * Math.PI;
 const range = endAngle - startAngle;
 const filled = startAngle + (value / 100) * range;

 const toXY = (angle: number, radius: number) => ({
 x: cx + radius * Math.cos(angle),
 y: cy + radius * Math.sin(angle),
 });

 // Track arc (completo)
 const trackStart = toXY(startAngle, r);
 const trackEnd = toXY(endAngle, r);
 const trackD = `M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;

 // Fill arc
 const fillStart = toXY(startAngle, r);
 const fillEnd = toXY(filled, r);
 const largeArc = filled - startAngle > Math.PI ? 1 : 0;
 const fillD = `M ${fillStart.x} ${fillStart.y} A ${r} ${r} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`;

 return (
 <div className="flex flex-col items-center">
 <svg width="140" height="80" viewBox="0 0 140 80" className="overflow-visible">
 {/* Trilho */}
 <path d={trackD} fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 " strokeLinecap="round" />
 {/* Preenchimento */}
 {value > 0 && (
 <path d={fillD} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
 style={{ transition: 'stroke-dasharray 0.8s ease' }}
 />
 )}
 {/* Valor central */}
 <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-800 " fontSize="20" fontWeight="900">
 {value}%
 </text>
 <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-400 " fontSize="9" fontWeight="600">
 da rede
 </text>
 </svg>
 </div>
 );
}

// Barra de progresso
function BarPill({ value, max, color }: { value: number; max: number; color: string }) {
 const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
 return (
 <div className="relative w-full mt-2">
 <div className="w-full h-1.5 bg-slate-100 rounded-full">
 <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
 </div>
 <div
 className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all duration-700 ${color}`}
 style={{ left: `${pct}%` }}
 aria-hidden="true"
 />
 </div>
 );
}

function TrendBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
 const good = inverse ? value < 0 : value > 0;
 if (value === 0) return <span className="text-[#2B2C33]/50 text-xs flex items-center gap-0.5"><Minus className="w-3 h-3" />—</span>;
 return (
 <span className={`flex items-center gap-0.5 text-xs font-semibold ${good ? 'text-emerald-500' : 'text-rose-500'}`}>
 {good ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
 {Math.abs(value)}%
 </span>
 );
}

// ─────────────────────────────────────────────
// Tipo auxiliar para "ocorrência simulada" na lista
// ────────────────────────────────────��────────
interface OccRow {
 id: string;
 schoolName: string;
 schoolId: string;
 studentName: string;
 severity: 'Grave' | 'Media' | 'Leve';
 description: string;
 count: number;
}

// ─────────────────────────────────────────────
// Gera lista de ocorrências a partir dos stats
// ─────────────────────────────────────────────
function buildOccRows(stats: SchoolStats[]): OccRow[] {
 const rows: OccRow[] = [];
 stats.forEach(school => {
 if (school.graves > 0) {
 rows.push({
 id: `${school.id}-grave`,
 schoolId: school.id,
 schoolName: school.name.replace('EECM Prof. ', ''),
 studentName: 'Multiplos alunos',
 severity: 'Grave',
 description: `${school.graves} ocorrencia${school.graves > 1 ? 's' : ''} grave${school.graves > 1 ? 's' : ''} registrada${school.graves > 1 ? 's' : ''}`,
 count: school.graves,
 });
 }
 if (school.medias > 0) {
 rows.push({
 id: `${school.id}-media`,
 schoolId: school.id,
 schoolName: school.name.replace('EECM Prof. ', ''),
 studentName: 'Multiplos alunos',
 severity: 'Media',
 description: `${school.medias} ocorrencia${school.medias > 1 ? 's' : ''} de severidade media`,
 count: school.medias,
 });
 }
 if (school.leves > 0) {
 rows.push({
 id: `${school.id}-leve`,
 schoolId: school.id,
 schoolName: school.name.replace('EECM Prof. ', ''),
 studentName: 'Multiplos alunos',
 severity: 'Leve',
 description: `${school.leves} ocorrencia${school.leves > 1 ? 's' : ''} de severidade leve`,
 count: school.leves,
 });
 }
 });
 return rows.sort((a, b) => {
 const sOrder = { Grave: 0, Media: 1, Leve: 2 };
 return sOrder[a.severity] - sOrder[b.severity] || b.count - a.count;
 });
}

const SEV_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
 Grave: { bg: 'bg-rose-50 ', text: 'text-rose-600 ', border: 'border-rose-200 ', dot: 'bg-rose-500' },
 Media: { bg: 'bg-amber-50 ', text: 'text-amber-600 ', border: 'border-amber-200 ', dot: 'bg-amber-400' },
 Leve: { bg: 'bg-blue-50 ', text: 'text-blue-600 ', border: 'border-blue-200 ', dot: 'bg-blue-400' },
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
type Period = 'dia' | 'semana' | 'mes';

const PERIOD_LABELS: Record<Period, string> = {
 dia: 'Hoje',
 semana: 'Esta semana',
 mes: 'Este mes',
};

export default function DreDashboard({ stats, loading, isVisible, sleepData, onSchoolClick, onNavigate }: Props) {
 const nav = (route: string) => onNavigate?.(route);

 // ─── Filtros locais ───────────────────────────
 const [selectedSchoolId, setSelectedSchoolId] = useState<string>('todas');
 const [selectedPeriod, setSelectedPeriod] = useState<Period>('mes');
 const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
 const schoolDropdownRef = useRef<HTMLDivElement>(null);

 // Filtro de ocorrências
 const [occSevFilter, setOccSevFilter] = useState<SevFilter>('todas');
 const [occSchoolFilter, setOccSchoolFilter] = useState<string>('todas');

 // Filtros de período dos gráficos
 const [barPeriod, setBarPeriod] = useState<Period>('mes');
 const [piePeriod, setPiePeriod] = useState<Period>('mes');
 const [sleepPeriod, setSleepPeriod] = useState<'semana' | 'mes'>('semana');
 const [sleepDropOpen, setSleepDropOpen] = useState(false);
 const sleepDropRef = useRef<HTMLDivElement>(null);
 const [barDropOpen, setBarDropOpen] = useState(false);
 const [pieDropOpen, setPieDropOpen] = useState(false);
 const barDropRef = useRef<HTMLDivElement>(null);
 const pieDropRef = useRef<HTMLDivElement>(null);

 // Fecha dropdowns ao clicar fora
 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (barDropRef.current && !barDropRef.current.contains(e.target as Node)) setBarDropOpen(false);
 if (pieDropRef.current && !pieDropRef.current.contains(e.target as Node)) setPieDropOpen(false);
 if (sleepDropRef.current && !sleepDropRef.current.contains(e.target as Node)) setSleepDropOpen(false);
 };
 document.addEventListener('mousedown', handler);
 return () => document.removeEventListener('mousedown', handler);
 }, []);

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

 // Aplica filtro de escola
 const filteredStats = selectedSchoolId === 'todas'
 ? stats
 : stats.filter(s => s.id === selectedSchoolId);

 // ─── KPIs calculados ───────────────────────────
 const totalStudents = filteredStats.reduce((s, x) => s + x.students, 0);
 const totalOcc = filteredStats.reduce((s, x) => s + x.occurrences, 0);
 const totalPraises = filteredStats.reduce((s, x) => s + x.praises, 0);
 const totalAccidents = filteredStats.reduce((s, x) => s + x.accidents, 0);
 const totalGraves = filteredStats.reduce((s, x) => s + x.graves, 0);
 const totalLeves = filteredStats.reduce((s, x) => s + x.leves, 0);
 const totalMedias = filteredStats.reduce((s, x) => s + x.medias, 0);
 const avgDiscipline = filteredStats.length > 0 ? Math.round(filteredStats.reduce((s, x) => s + x.disciplineIndex, 0) / filteredStats.length) : 0;
 const globalGravityRate = totalOcc > 0 ? Math.round((totalGraves / totalOcc) * 100) : 0;
 const globalPraiseRatio = totalStudents > 0 ? Math.round((totalPraises / totalStudents) * 100) : 0;
 const alertSchools = filteredStats.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length;
 const ranked = [...filteredStats].sort((a, b) => b.disciplineIndex - a.disciplineIndex);

 const totalImpl = filteredStats.reduce((s, x) => s + x.implantacaoTotal, 0);
 const doneImpl = filteredStats.reduce((s, x) => s + x.implantacaoDone, 0);
 const pctImpl = totalImpl > 0 ? Math.round((doneImpl / totalImpl) * 100) : 0;

 // Ranking de alunos por elogios (por escola, aproximado via praiseRatio)
 const rankedStudentSchools = [...filteredStats].sort((a, b) => b.praiseRatio - a.praiseRatio);

 // Dados para gráfico comparativo
 const barData = filteredStats.map(s => ({
 name: s.name.replace('EECM Prof. ', '').substring(0, 10),
 fullName: s.name,
 Disciplina: s.disciplineIndex,
 Ocorrencias: s.occurrences,
 Elogios: s.praises,
 }));

 // Dados para pizza de severidade
 const severityData = [
 { name: 'Leves', value: totalLeves, fill: '#f59e0b' },
 { name: 'Medias', value: totalMedias, fill: '#f97316' },
 { name: 'Graves', value: totalGraves, fill: '#f43f5e' },
 ].filter(d => d.value > 0);

 // Ocorrências para a lista
 const allOccRows = buildOccRows(filteredStats);
 const filteredOccRows = allOccRows.filter(r => {
 const sevOk = occSevFilter === 'todas' || r.severity === occSevFilter;
 const schoolOk = occSchoolFilter === 'todas' || r.schoolId === occSchoolFilter;
 return sevOk && schoolOk;
 });

 // ─── Loading skeleton ───────────────────────
 if (loading) {
 return (
 <div className="space-y-6">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
 <Skeleton className="lg:col-span-2 h-80" />
 <Skeleton className="h-80" />
 </div>
 </div>
 );
 }

 if (stats.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-20 text-center">
 <FileWarning className="w-10 h-10 text-slate-300 mb-3" />
 <p className="text-[#2B2C33]/60 font-medium">Nenhuma escola encontrada.</p>
 <p className="text-[#2B2C33]/50 text-sm mt-1">Verifique a conexao e atualize.</p>
 </div>
 );
 }

 const selectedSchoolName = selectedSchoolId === 'todas'
 ? 'Todas as escolas'
 : (stats.find(s => s.id === selectedSchoolId)?.name ?? 'Escola');

 // ── Dropdown reutilizável de período para gráficos ──
 const PeriodBtn = ({
 period, open, setOpen, dropRef, onSelect,
 }: {
 period: Period;
 open: boolean;
 setOpen: (v: boolean) => void;
 dropRef: React.RefObject<HTMLDivElement | null>;
 onSelect: (p: Period) => void;
 }) => (
 <div className="relative" ref={dropRef}>
 <button
 onClick={() => setOpen(!open)}
 className="flex items-center gap-1.5 px-3 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-[#2B2C33]/10 text-[#2B2C33]/70 text-xs font-semibold transition-colors"
 >
 {PERIOD_LABELS[period]}
 <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
 </button>
 {open && (
 <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-[#2B2C33]/10 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
 {(['dia', 'semana', 'mes'] as Period[]).map(p => (
 <button
 key={p}
 onClick={() => { onSelect(p); setOpen(false); }}
 className={`w-full text-left px-4 py-2 text-xs transition-colors ${period === p ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-[#2B2C33] hover:bg-[#F4F5F7]'}`}
 >
 {PERIOD_LABELS[p]}
 </button>
 ))}
 </div>
 )}
 </div>
 );

 return (
 <div className="space-y-5">

 {/* ══════════════════════════════════════════
 BARRA DE FILTROS
 ══════════════════════════════════════════ */}
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div>
 <h2 className="text-[#2B2C33] font-bold text-lg leading-tight">Visao Consolidada</h2>
 <p className="text-[#2B2C33]/60 text-xs mt-0.5">
 {selectedSchoolId === 'todas' ? `${stats.length} escolas · ` : ''}{PERIOD_LABELS[selectedPeriod]}
 </p>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 <button
 aria-label="Ajustes de filtros"
 className="w-9 h-9 rounded-full bg-white hover:bg-white/20 border border-[#2B2C33]/10 text-[#2B2C33] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
 className="flex items-center gap-2 h-9 px-3 rounded-full bg-white hover:bg-white/20 border border-[#2B2C33]/10 text-[#2B2C33] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 min-w-[148px]"
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
 className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-[#2B2C33]/10 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
 >
 {[{ id: 'todas', name: 'Todas as escolas' }, ...stats.map(s => ({ id: s.id, name: s.name }))].map(opt => (
 <button
 key={opt.id}
 role="option"
 aria-selected={selectedSchoolId === opt.id}
 onClick={() => { setSelectedSchoolId(opt.id); setSchoolDropdownOpen(false); }}
 className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedSchoolId === opt.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-[#2B2C33] hover:bg-[#F4F5F7]'}`}
 >
 {opt.name}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Pills de período */}
 <div className="flex items-center bg-white border border-[#2B2C33]/10 rounded-full p-0.5" role="group" aria-label="Selecionar periodo">
 {(['dia', 'semana', 'mes'] as Period[]).map(p => (
 <button
 key={p}
 onClick={() => setSelectedPeriod(p)}
 aria-pressed={selectedPeriod === p}
 className={`px-3 h-7 rounded-full text-xs font-semibold transition-all ${selectedPeriod === p ? 'bg-white text-blue-700 shadow-sm' : 'text-[#2B2C33]/80 hover:text-[#2B2C33]'}`}
 >
 {p === 'dia' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mes'}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* ══════════════════════════════════════════
 LAYOUT PRINCIPAL: painel central + sidebar
 ══════════════════════════════════════════ */}
 <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">

 {/* ── PAINEL CENTRAL ── */}
 <div className="space-y-5 min-w-0">

 {/* ── KPIs PRIMÁRIOS — estilo Analytics (imagem 2) ── */}
 {isVisible('kpis_primarios') && (
 <section>
 <p className="text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-widest mb-3">Visao Geral da Rede</p>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

 {/* Card herói — Índice de Disciplina */}
 <button
 onClick={() => nav('/relatorios')}
 aria-label={`Indice disciplinar medio da rede: ${avgDiscipline}. Clique para ver relatorios`}
 className="row-span-2 col-span-2 md:col-span-1 md:row-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-5 text-white shadow-lg shadow-blue-500/25 flex flex-col justify-between min-h-[150px] w-full text-left cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-800"
 >
 {/* Decorativo */}
 <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-xl" />
 <div className="absolute -right-2 bottom-4 w-16 h-16 bg-white/10 rounded-full blur-lg" />
 <div className="relative flex items-start justify-between">
 <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100">Indice Disciplinar</p>
 <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
 <Shield className="w-4 h-4 text-white" aria-hidden="true" />
 </div>
 </div>
 <div className="relative">
 <div className="flex items-end gap-3 mt-2">
 <p className="text-6xl font-black tracking-tighter leading-none text-white">{avgDiscipline}</p>
 <div className="pb-1">
 <p className="text-xs text-blue-100">/ 100</p>
 <p className="text-[10px] text-blue-200 mt-0.5">media da rede</p>
 </div>
 </div>
 <div className="relative w-full mt-3">
 <div className="w-full h-1.5 bg-white/20 rounded-full">
 <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${avgDiscipline}%` }} />
 </div>
 </div>
 <p className="text-[10px] text-blue-100 mt-2 font-medium">
 {avgDiscipline >= 75 ? 'Rede em boa situacao' : avgDiscipline >= 55 ? 'Atencao em algumas escolas' : 'Intervencao recomendada'}
 </p>
 </div>
 </button>

 {/* Alunos */}
 <button
 onClick={() => nav('/alunos')}
 aria-label={`${totalStudents} alunos ativos`}
 className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px] w-full text-left cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-blue-300 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
 >
 <div className="flex items-start justify-between">
 <p className="text-[11px] font-bold text-[#2B2C33]/60 uppercase tracking-wide">Alunos Ativos</p>
 <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <Users className="w-4 h-4" aria-hidden="true" />
 </div>
 </div>
 <div>
 <p className="text-3xl font-black text-[#2B2C33] tracking-tight leading-none mt-2">{totalStudents.toLocaleString('pt-BR')}</p>
 <div className="flex items-center gap-1.5 mt-1.5">
 <TrendBadge value={0} />
 <span className="text-[10px] text-[#2B2C33]/50">{stats.length} escolas</span>
 </div>
 </div>
 </button>

 {/* Ocorrências */}
 <button
 onClick={() => nav('/registro-disciplinar')}
 aria-label={`${totalOcc} ocorrencias`}
 className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px] w-full text-left cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-amber-300 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
 >
 <div className="flex items-start justify-between">
 <p className="text-[11px] font-bold text-[#2B2C33]/60 uppercase tracking-wide">Ocorrencias</p>
 <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
 <AlertTriangle className="w-4 h-4" aria-hidden="true" />
 </div>
 </div>
 <div>
 <p className="text-3xl font-black text-[#2B2C33] tracking-tight leading-none mt-2">{totalOcc}</p>
 <div className="flex gap-1.5 flex-wrap mt-1.5">
 {totalLeves > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 ">L {totalLeves}</span>}
 {totalMedias > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200 ">M {totalMedias}</span>}
 {totalGraves > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 ">G {totalGraves}</span>}
 {totalOcc === 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 ">Nenhuma</span>}
 </div>
 </div>
 </button>

 {/* Elogios */}
 <button
 onClick={() => nav('/elogios')}
 aria-label={`${totalPraises} elogios`}
 className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px] w-full text-left cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-emerald-300 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
 >
 <div className="flex items-start justify-between">
 <p className="text-[11px] font-bold text-[#2B2C33]/60 uppercase tracking-wide">Elogios</p>
 <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <Star className="w-4 h-4" aria-hidden="true" />
 </div>
 </div>
 <div>
 <p className="text-3xl font-black text-[#2B2C33] tracking-tight leading-none mt-2">{totalPraises}</p>
 <div className="flex items-center gap-1.5 mt-1.5">
 <TrendBadge value={0} />
 <span className="text-[10px] text-[#2B2C33]/50">{globalPraiseRatio} por 100 alunos</span>
 </div>
 </div>
 </button>
 </div>
 </section>
 )}

 {/* ── KPIs SECUNDÁRIOS ── */}
 {isVisible('kpis_secundarios') && (
 <section>
 <p className="text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-widest mb-3">Metricas Derivadas</p>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

 {/* Taxa de gravidade */}
 <button
 onClick={() => nav('/registro-disciplinar')}
 aria-label={`Taxa de gravidade: ${globalGravityRate}%`}
 className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm text-left w-full cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-rose-300 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex flex-col justify-between min-h-[120px]"
 >
 <div className="flex items-start justify-between">
 <p className="text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-wide">Taxa Gravidade</p>
 <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${globalGravityRate > 30 ? 'bg-rose-100 text-rose-600 ' : globalGravityRate > 15 ? 'bg-amber-100 text-amber-600 ' : 'bg-emerald-100 text-emerald-600 '}`}>
 <Zap className="w-4 h-4" aria-hidden="true" />
 </div>
 </div>
 <div>
 <p className="text-4xl font-black text-[#2B2C33] leading-none mt-2">{globalGravityRate}<span className="text-xl font-medium text-[#2B2C33]/50 ml-0.5">%</span></p>
 <BarPill value={globalGravityRate} max={100} color={globalGravityRate > 30 ? 'bg-rose-500' : globalGravityRate > 15 ? 'bg-amber-400' : 'bg-emerald-400'} />
 <p className="text-[10px] text-[#2B2C33]/50 mt-3">graves / total</p>
 </div>
 </button>

 {/* Razão E/O */}
 <button
 onClick={() => nav('/elogios')}
 aria-label="Razao elogio sobre ocorrencia"
 className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm text-left w-full cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-emerald-300 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex flex-col justify-between min-h-[120px]"
 >
 <div className="flex items-start justify-between">
 <p className="text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-wide">Razao E/O</p>
 <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
 <Award className="w-4 h-4" aria-hidden="true" />
 </div>
 </div>
 <div>
 <p className="text-4xl font-black text-[#2B2C33] leading-none mt-2">
 {totalOcc > 0 ? (totalPraises / totalOcc).toFixed(1) : '—'}<span className="text-xl font-medium text-[#2B2C33]/50 ml-1">x</span>
 </p>
 <BarPill value={Math.min(totalPraises, totalOcc * 2)} max={totalOcc * 2 || 1} color="bg-emerald-400" />
 <p className="text-[10px] text-[#2B2C33]/50 mt-3">{totalPraises > totalOcc ? 'acima do esperado' : 'abaixo do esperado'}</p>
 </div>
 </button>

 {/* Acidentes */}
 <button
 onClick={() => nav('/acidentes')}
 aria-label={`${totalAccidents} acidentes`}
 className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm text-left w-full cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-violet-300 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex flex-col justify-between min-h-[120px]"
 >
 <div className="flex items-start justify-between">
 <p className="text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-wide">Acidentes</p>
 <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
 <Activity className="w-4 h-4" aria-hidden="true" />
 </div>
 </div>
 <div>
 <p className="text-4xl font-black text-[#2B2C33] leading-none mt-2">{totalAccidents}</p>
 <p className="text-[10px] text-[#2B2C33]/50 mt-1">
 {totalStudents > 0 ? ((totalAccidents / totalStudents) * 1000).toFixed(1) : '0'} por mil alunos
 </p>
 <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${totalAccidents === 0 ? 'bg-emerald-50 text-emerald-600 ' : 'bg-amber-50 text-amber-600 '}`}>
 {totalAccidents === 0 ? 'Zero acidentes' : 'Requer atencao'}
 </div>
 </div>
 </button>

 {/* Alertas */}
 <button
 onClick={() => nav('/comportamento')}
 aria-label={`${alertSchools} escolas em alerta`}
 className={`rounded-2xl p-5 shadow-sm border text-left w-full cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex flex-col justify-between min-h-[120px] ${alertSchools > 0 ? 'bg-rose-50 border-rose-200 hover:border-rose-400' : 'bg-white border-[#2B2C33]/10 hover:border-blue-300'}`}
 >
 <div className="flex items-start justify-between">
 <p className="text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-wide">Alertas</p>
 <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${alertSchools > 0 ? 'bg-rose-100 text-rose-600 ' : 'bg-slate-100 text-[#2B2C33]/50 '}`}>
 <AlertCircle className="w-4 h-4" aria-hidden="true" />
 </div>
 </div>
 <div>
 <p className={`text-4xl font-black leading-none mt-2 ${alertSchools > 0 ? 'text-rose-600 ' : 'text-[#2B2C33] '}`}>{alertSchools}</p>
 <p className="text-[10px] text-[#2B2C33]/50 mt-1">
 {alertSchools === 0 ? 'Nenhuma escola em alerta' : `escola${alertSchools > 1 ? 's' : ''} acima do limiar`}
 </p>
 <div className="flex gap-1 flex-wrap mt-2">
 {filteredStats.filter(s => s.riskLevel === 'critical').length > 0 && (
 <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-600 ">
 {filteredStats.filter(s => s.riskLevel === 'critical').length} CRITICO
 </span>
 )}
 {filteredStats.filter(s => s.riskLevel === 'high').length > 0 && (
 <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-600 ">
 {filteredStats.filter(s => s.riskLevel === 'high').length} ALTO
 </span>
 )}
 {alertSchools === 0 && (
 <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-600 ">TUDO OK</span>
 )}
 </div>
 </div>
 </button>
 </div>
 </section>
 )}

 {/* ── GRÁFICOS ── */}
 {isVisible('kpis_primarios') && stats.length > 0 && (
 <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 {/* Gráfico comparativo */}
 <div className="lg:col-span-2 bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm">
 <div className="flex items-center justify-between mb-4">
 <div>
 <p className="text-sm font-bold text-[#2B2C33] ">Comparativo por Escola</p>
 <p className="text-[11px] text-[#2B2C33]/50 ">Indice de disciplina vs ocorrencias</p>
 </div>
 <PeriodBtn
 period={barPeriod}
 open={barDropOpen}
 setOpen={setBarDropOpen}
 dropRef={barDropRef}
 onSelect={setBarPeriod}
 />
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
 <span className="text-[10px] text-[#2B2C33]/50 ">{l.label}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Pizza — severidade */}
 <div className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm flex flex-col">
 <div className="flex items-start justify-between mb-3">
 <div>
 <p className="text-sm font-bold text-[#2B2C33] ">Severidade</p>
 <p className="text-[11px] text-[#2B2C33]/50 ">Distribuicao das ocorrencias</p>
 </div>
 <PeriodBtn
 period={piePeriod}
 open={pieDropOpen}
 setOpen={setPieDropOpen}
 dropRef={pieDropRef}
 onSelect={setPiePeriod}
 />
 </div>
 {totalOcc === 0 ? (
 <div className="flex-1 flex items-center justify-center">
 <div className="text-center">
 <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
 <p className="text-sm text-[#2B2C33]/50 font-medium">Sem ocorrencias</p>
 </div>
 </div>
 ) : (
 <>
 <ResponsiveContainer width="100%" height={140}>
 <PieChart>
 <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
 {severityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
 </Pie>
 <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, fontSize: 12, color: '#e2e8f0' }} />
 </PieChart>
 </ResponsiveContainer>
 <div className="space-y-1.5 mt-2">
 {severityData.map(d => (
 <div key={d.name} className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
 <span className="text-[11px] text-[#2B2C33]/70 ">{d.name}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[11px] font-bold text-[#2B2C33] ">{d.value}</span>
 <span className="text-[10px] text-[#2B2C33]/50">{totalOcc > 0 ? Math.round((d.value / totalOcc) * 100) : 0}%</span>
 </div>
 </div>
 ))}
 </div>
 </>
 )}
 </div>
 </section>
 )}

 {/* ── KPI: DORMIR EM SALA ── */}
 {sleepData && (sleepData.byWeek.length > 0 || sleepData.byMonth.length > 0) && (() => {
 const chartData = sleepPeriod === 'semana' ? sleepData.byWeek : sleepData.byMonth;
 const buckets = chartData.length;
 const current = chartData[buckets - 1]?.value ?? 0;
 const previous = chartData[buckets - 2]?.value ?? 0;
 const delta = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
 const totalPeriod = chartData.reduce((s, b) => s + b.value, 0);
 const isReduction = delta < 0;
 const deltaColor = isReduction ? 'text-emerald-500' : delta > 0 ? 'text-rose-500' : 'text-[#2B2C33]/50';
 const deltaBg = isReduction ? 'bg-emerald-50 border-emerald-200 ' : delta > 0 ? 'bg-rose-50 border-rose-200 ' : 'bg-[#F4F5F7] border-[#2B2C33]/10 ';

 return (
 <section className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm">
 {/* Cabeçalho */}
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
 <BookOpen className="w-4 h-4 text-indigo-600 " />
 </div>
 <div>
 <p className="text-sm font-bold text-[#2B2C33] leading-tight">Dormir em Sala de Aula</p>
 <p className="text-[11px] text-[#2B2C33]/50 ">Reg. 14 — Debrucar-se / dormir (comparativo)</p>
 </div>
 </div>
 {/* Seletor semana / mês */}
 <div className="flex items-center gap-2">
 <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${deltaBg} ${deltaColor}`}>
 {isReduction
 ? <TrendingDown className="w-3 h-3" />
 : delta > 0
 ? <TrendingUp className="w-3 h-3" />
 : <Minus className="w-3 h-3" />}
 {delta === 0 ? 'Estavel' : `${Math.abs(delta)}% ${isReduction ? 'reducao' : 'aumento'}`}
 </div>
 <div className="relative" ref={sleepDropRef}>
 <button
 onClick={() => setSleepDropOpen(o => !o)}
 className="flex items-center gap-1.5 px-3 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-[#2B2C33]/10 text-[#2B2C33]/70 text-xs font-semibold transition-colors"
 >
 {sleepPeriod === 'semana' ? 'Por Semana' : 'Por Mes'}
 <ChevronDown className={`w-3 h-3 transition-transform ${sleepDropOpen ? 'rotate-180' : ''}`} />
 </button>
 {sleepDropOpen && (
 <div className="absolute right-0 top-full mt-1.5 w-32 bg-white border border-[#2B2C33]/10 rounded-xl shadow-lg overflow-hidden z-50">
 {(['semana', 'mes'] as const).map(p => (
 <button
 key={p}
 onClick={() => { setSleepPeriod(p); setSleepDropOpen(false); }}
 className={`w-full text-left px-4 py-2 text-xs transition-colors ${sleepPeriod === p ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-[#2B2C33] hover:bg-[#F4F5F7]'}`}
 >
 {p === 'semana' ? 'Por Semana' : 'Por Mes'}
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Metricas rápidas */}
 <div className="grid grid-cols-3 gap-3 mb-4">
 <div className="bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-center">
 <p className="text-[10px] text-[#2B2C33]/50 font-medium uppercase tracking-wide mb-1">
 {sleepPeriod === 'semana' ? 'Esta Semana' : 'Este Mes'}
 </p>
 <p className="text-2xl font-black text-[#2B2C33] leading-none">{current}</p>
 </div>
 <div className="bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-center">
 <p className="text-[10px] text-[#2B2C33]/50 font-medium uppercase tracking-wide mb-1">
 {sleepPeriod === 'semana' ? 'Semana Anterior' : 'Mes Anterior'}
 </p>
 <p className="text-2xl font-black text-[#2B2C33] leading-none">{previous}</p>
 </div>
 <div className="bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-center">
 <p className="text-[10px] text-[#2B2C33]/50 font-medium uppercase tracking-wide mb-1">
 Total no Periodo
 </p>
 <p className="text-2xl font-black text-[#2B2C33] leading-none">{totalPeriod}</p>
 </div>
 </div>

 {/* Gráfico de linha */}
 <ResponsiveContainer width="100%" height={140}>
 <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
 <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
 <Tooltip
 contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, fontSize: 12, color: '#e2e8f0' }}
 formatter={(val: any) => [val, 'Ocorrencias']}
 />
 {previous > 0 && (
 <ReferenceLine y={previous} stroke="#94a3b8" strokeDasharray="4 4" strokeOpacity={0.6}
 label={{ value: 'anterior', position: 'insideTopRight', fontSize: 9, fill: '#94a3b8' }}
 />
 )}
 <Line
 type="monotone"
 dataKey="value"
 stroke="#6366f1"
 strokeWidth={2.5}
 dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
 activeDot={{ r: 6, fill: '#4f46e5' }}
 />
 </LineChart>
 </ResponsiveContainer>

 <p className="text-[10px] text-[#2B2C33]/50 text-center mt-2">
 Linha tracejada = valor do periodo anterior · Tendencia positiva indica reducao das ocorrencias
 </p>
 </section>
 );
 })()}

 {/* ── IMPLANTAÇÃO ── */}
 {isVisible('implantacao') && (
 <section className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm">
 <div className="flex items-center justify-between mb-5">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
 <CheckCircle2 className="w-4 h-4 text-blue-600 " />
 </div>
 <div>
 <p className="text-sm font-bold text-[#2B2C33] ">Implantacao da Rede</p>
 <p className="text-[11px] text-[#2B2C33]/50 ">{doneImpl} de {totalImpl} itens concluidos</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="text-right">
 <p className="text-2xl font-black text-[#2B2C33] leading-none">{pctImpl}%</p>
 <p className="text-[10px] text-[#2B2C33]/50 ">concluido</p>
 </div>
 <IndexRing value={pctImpl} size={52} stroke={5} />
 </div>
 </div>
 <BarPill value={doneImpl} max={totalImpl || 1} color={pctImpl >= 80 ? 'bg-emerald-500' : pctImpl >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
 {stats.length > 0 && (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 ">
 {stats.map(school => {
 const pct = school.implantacaoTotal > 0 ? Math.round((school.implantacaoDone / school.implantacaoTotal) * 100) : 0;
 return (
 <div key={school.id} className="space-y-1.5">
 <div className="flex justify-between items-center">
 <p className="text-[11px] font-semibold text-[#2B2C33]/70 truncate pr-2">{school.name.replace('EECM Prof. ', '')}</p>
 <span className={`text-[10px] font-bold shrink-0 ${pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{pct}%</span>
 </div>
 <BarPill value={school.implantacaoDone} max={school.implantacaoTotal || 1} color={pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
 <p className="text-[10px] text-[#2B2C33]/50 ">{school.implantacaoDone}/{school.implantacaoTotal} itens</p>
 </div>
 );
 })}
 </div>
 )}
 </section>
 )}

 {/* ── RANKING DISCIPLINAR + CARDS DE ESCOLAS ── */}
 {isVisible('ranking') && (
 <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
 {stats.map(school => {
 const risk = RISK_META[school.riskLevel];
 const pct = school.implantacaoTotal > 0 ? Math.round((school.implantacaoDone / school.implantacaoTotal) * 100) : 0;
 return (
 <div
 key={school.id}
 onClick={() => onSchoolClick?.(school.id)}
 className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${onSchoolClick ? 'cursor-pointer' : ''} ${school.riskLevel === 'critical' ? 'border-rose-300 ' : school.riskLevel === 'high' ? 'border-orange-300 ' : 'border-[#2B2C33]/10 '}`}
 >
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1 min-w-0 pr-2">
 <p className="text-sm font-bold text-[#2B2C33] truncate leading-tight">{school.name}</p>
 <p className="text-[11px] text-[#2B2C33]/50 mt-0.5">{school.students} alunos</p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}>
 <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ background: risk.color }} />
 {risk.label}
 </span>
 <IndexRing value={school.disciplineIndex} size={40} stroke={4} />
 </div>
 </div>
 <div className="grid grid-cols-3 gap-2 mb-4">
 {[
 { label: 'Ocorr.', value: school.occurrences, color: 'text-amber-600 ' },
 { label: 'Elogios', value: school.praises, color: 'text-emerald-600 ' },
 { label: 'Acid.', value: school.accidents, color: 'text-violet-600 ' },
 ].map(m => (
 <div key={m.label} className="text-center bg-[#F4F5F7] rounded-xl py-2">
 <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
 <p className="text-[10px] text-[#2B2C33]/50 font-medium">{m.label}</p>
 </div>
 ))}
 </div>
 {school.occurrences > 0 && (
 <div className="mb-3">
 <div className="flex gap-1 h-2 rounded-full overflow-hidden">
 {school.leves > 0 && <div className="bg-amber-400 rounded-full" style={{ flex: school.leves }} />}
 {school.medias > 0 && <div className="bg-orange-500 rounded-full" style={{ flex: school.medias }} />}
 {school.graves > 0 && <div className="bg-rose-500 rounded-full" style={{ flex: school.graves }} />}
 </div>
 <div className="flex gap-3 mt-1">
 <span className="text-[9px] text-amber-500 font-semibold">L {school.leves}</span>
 <span className="text-[9px] text-orange-500 font-semibold">M {school.medias}</span>
 <span className="text-[9px] text-rose-500 font-bold">G {school.graves}</span>
 </div>
 </div>
 )}
 {school.implantacaoTotal > 0 && (
 <div>
 <div className="flex justify-between items-center mb-1">
 <p className="text-[10px] text-[#2B2C33]/50 font-medium">Implantacao</p>
 <p className="text-[10px] font-bold text-[#2B2C33]/60 ">{pct}%</p>
 </div>
 <BarPill value={school.implantacaoDone} max={school.implantacaoTotal} color={pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
 </div>
 )}
 </div>
 );
 })}
 </section>
 )}

 </div>{/* fim painel central */}

 {/* ══════════════════════════════════════════
 SIDEBAR DIREITA
 ══════════════════════════════════════════ */}
 <aside className="space-y-4 xl:sticky xl:top-4">

 {/* ── KPI: % Implantação do Sistema na Rede ── */}
 <div className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm">
 <div className="flex items-center justify-between mb-1">
 <p className="text-sm font-bold text-[#2B2C33] ">Implantacao do Sistema</p>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pctImpl >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 ' : pctImpl >= 50 ? 'bg-amber-50 text-amber-600 border border-amber-200 ' : 'bg-rose-50 text-rose-600 border border-rose-200 '}`}>
 {pctImpl >= 80 ? 'Em dia' : pctImpl >= 50 ? 'Em progresso' : 'Atrasado'}
 </span>
 </div>
 <p className="text-[11px] text-[#2B2C33]/50 mb-3">% de implantacao na rede escolar</p>
 {/* Gauge semicircular */}
 <SemiGauge value={pctImpl} />
 {/* Detalhe */}
 <div className="mt-2 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 ">
 <div className="text-center">
 <p className="text-lg font-black text-[#2B2C33] ">{doneImpl}</p>
 <p className="text-[10px] text-[#2B2C33]/50 ">itens concluidos</p>
 </div>
 <div className="text-center">
 <p className="text-lg font-black text-[#2B2C33] ">{totalImpl - doneImpl}</p>
 <p className="text-[10px] text-[#2B2C33]/50 ">pendentes</p>
 </div>
 </div>
 </div>

 {/* ── Ranking das Escolas (disciplina) ── */}
 <div className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Building2 className="w-4 h-4 text-blue-500" aria-hidden="true" />
 <p className="text-sm font-bold text-[#2B2C33] ">Ranking Escolas</p>
 </div>
 <span className="text-[10px] text-[#2B2C33]/50 ">indice disciplinar</span>
 </div>
 <div className="space-y-3">
 {ranked.map((school, idx) => {
 const risk = RISK_META[school.riskLevel];
 const medals = ['1°', '2°', '3°'];
 return (
 <div
 key={school.id}
 onClick={() => onSchoolClick?.(school.id)}
 className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${onSchoolClick ? 'cursor-pointer hover:bg-[#F4F5F7]' : ''}`}
 >
 <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${idx === 0 ? 'bg-amber-400 text-[#2B2C33]' : idx === 1 ? 'bg-slate-300 text-[#2B2C33] ' : idx === 2 ? 'bg-orange-300 text-[#2B2C33]' : 'bg-slate-100 text-[#2B2C33]/60 '}`}>
 {idx < 3 ? medals[idx] : idx + 1}
 </span>
 <IndexRing value={school.disciplineIndex} size={36} stroke={4} />
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-[#2B2C33] truncate leading-tight">{school.name.replace('EECM Prof. ', '')}</p>
 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${risk.bg} ${risk.text}`}>{risk.label}</span>
 </div>
 <span className="text-[10px] text-[#2B2C33]/50 shrink-0">{school.occurrences} ocorr.</span>
 </div>
 );
 })}
 {ranked.length === 0 && (
 <p className="text-xs text-[#2B2C33]/50 py-4 text-center">Sem dados de escolas.</p>
 )}
 </div>
 </div>

 {/* ── Ranking de Alunos (elogios por escola) ── */}
 <div className="bg-white border border-[#2B2C33]/10 rounded-2xl p-5 shadow-sm">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <GraduationCap className="w-4 h-4 text-emerald-500" aria-hidden="true" />
 <p className="text-sm font-bold text-[#2B2C33] ">Ranking Alunos</p>
 </div>
 <span className="text-[10px] text-[#2B2C33]/50 ">elogios / 100 alunos</span>
 </div>
 <div className="space-y-3">
 {rankedStudentSchools.map((school, idx) => (
 <div
 key={school.id}
 onClick={() => onSchoolClick?.(school.id)}
 className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${onSchoolClick ? 'cursor-pointer hover:bg-[#F4F5F7]' : ''}`}
 >
 <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${idx === 0 ? 'bg-emerald-500 text-white' : idx === 1 ? 'bg-emerald-300 text-[#2B2C33]' : idx === 2 ? 'bg-emerald-200 text-emerald-800 ' : 'bg-slate-100 text-[#2B2C33]/60'}`}>
 {idx + 1}
 </span>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-[#2B2C33] truncate leading-tight">{school.name.replace('EECM Prof. ', '')}</p>
 <div className="flex items-center gap-1.5 mt-0.5">
 <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(school.praiseRatio, 100)}%` }} />
 </div>
 </div>
 </div>
 <div className="text-right shrink-0">
 <span className="text-xs font-black text-emerald-600 ">{school.praiseRatio}</span>
 <p className="text-[9px] text-[#2B2C33]/50">elogios</p>
 </div>
 </div>
 ))}
 {rankedStudentSchools.length === 0 && (
 <p className="text-xs text-[#2B2C33]/50 py-4 text-center">Sem dados de alunos.</p>
 )}
 </div>
 </div>

 </aside>
 </div>{/* fim grid principal */}

 {/* ══════════════════════════════════════════
 LISTA DE OCORRÊNCIAS COM FILTROS
 (Imagem 1 — tabela + filtros pill)
 ══════════════════════════════════════════ */}
 <section className="bg-white border border-[#2B2C33]/10 rounded-2xl shadow-sm overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-slate-100 ">
 <div className="flex items-center gap-2">
 <FileWarning className="w-4 h-4 text-rose-500" aria-hidden="true" />
 <h2 className="text-sm font-bold text-[#2B2C33] ">Lista de Ocorrencias</h2>
 {totalGraves > 0 && (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 ">
 {totalGraves} graves
 </span>
 )}
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 {/* Filtro por severidade */}
 <div className="flex items-center gap-1 bg-slate-100 rounded-full p-0.5" role="group" aria-label="Filtrar por severidade">
 {SEV_FILTERS.map(f => (
 <button
 key={f.id}
 onClick={() => setOccSevFilter(f.id)}
 aria-pressed={occSevFilter === f.id}
 className={`px-3 h-7 rounded-full text-xs font-semibold transition-all ${
 occSevFilter === f.id
 ? f.id === 'Grave' ? 'bg-rose-500 text-white shadow-sm'
 : f.id === 'Media' ? 'bg-amber-500 text-white shadow-sm'
 : f.id === 'Leve' ? 'bg-blue-500 text-[#2B2C33] shadow-sm'
 : 'bg-white text-[#2B2C33] shadow-sm'
 : 'text-[#2B2C33]/60 hover:text-[#2B2C33]'
 }`}
 >
 {f.label}
 </button>
 ))}
 </div>
 {/* Filtro por escola */}
 <select
 value={occSchoolFilter}
 onChange={e => setOccSchoolFilter(e.target.value)}
 aria-label="Filtrar por escola"
 className="h-8 px-2 rounded-full text-xs font-medium bg-slate-100 border-0 text-[#2B2C33] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
 >
 <option value="todas">Todas as escolas</option>
 {stats.map(s => (
 <option key={s.id} value={s.id}>{s.name.replace('EECM Prof. ', '')}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Tabela */}
 <div className="overflow-x-auto">
 <table className="w-full text-sm" role="table">
 <thead>
 <tr className="border-b border-slate-100 ">
 <th className="px-5 py-3 text-left text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-wide whitespace-nowrap">Escola</th>
 <th className="px-5 py-3 text-left text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-wide whitespace-nowrap">Descricao</th>
 <th className="px-5 py-3 text-center text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-wide whitespace-nowrap">Qtd</th>
 <th className="px-5 py-3 text-center text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-wide whitespace-nowrap">Progresso</th>
 <th className="px-5 py-3 text-center text-[11px] font-bold text-[#2B2C33]/50 uppercase tracking-wide whitespace-nowrap">Severidade</th>
 </tr>
 </thead>
 <tbody>
 {filteredOccRows.length === 0 ? (
 <tr>
 <td colSpan={5} className="px-5 py-10 text-center text-[#2B2C33]/50 text-sm">
 <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
 Nenhuma ocorrencia encontrada com os filtros selecionados.
 </td>
 </tr>
 ) : (
 filteredOccRows.map(row => {
 const sty = SEV_STYLE[row.severity] ?? SEV_STYLE['Leve'];
 const maxForSev = filteredOccRows
 .filter(r => r.severity === row.severity)
 .reduce((m, r) => Math.max(m, r.count), 1);
 const pctBar = Math.min((row.count / maxForSev) * 100, 100);
 return (
 <tr key={row.id} className="border-b border-slate-50 hover:bg-[#F4F5F7] transition-colors">
 {/* Escola */}
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
 <Building2 className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
 </div>
 <div>
 <p className="font-semibold text-[#2B2C33] text-xs leading-tight">{row.schoolName}</p>
 <p className="text-[10px] text-[#2B2C33]/50 ">{row.studentName}</p>
 </div>
 </div>
 </td>
 {/* Descrição */}
 <td className="px-5 py-3.5">
 <p className="text-xs text-[#2B2C33]/70 max-w-[240px] truncate">{row.description}</p>
 </td>
 {/* Quantidade */}
 <td className="px-5 py-3.5 text-center">
 <span className="text-sm font-black text-[#2B2C33] ">{row.count}</span>
 </td>
 {/* Barra de progresso */}
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-2 min-w-[80px]">
 <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-500 ${
 row.severity === 'Grave' ? 'bg-rose-500' :
 row.severity === 'Media' ? 'bg-amber-400' : 'bg-blue-400'
 }`}
 style={{ width: `${pctBar}%` }}
 />
 </div>
 <span className="text-[10px] text-[#2B2C33]/50 shrink-0 w-7 text-right">{Math.round(pctBar)}%</span>
 </div>
 </td>
 {/* Badge severidade */}
 <td className="px-5 py-3.5 text-center">
 <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sty.bg} ${sty.text} ${sty.border}`}>
 <span className={`w-1.5 h-1.5 rounded-full ${sty.dot}`} aria-hidden="true" />
 {row.severity}
 </span>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 {/* Footer */}
 {filteredOccRows.length > 0 && (
 <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
 <p className="text-[11px] text-[#2B2C33]/50 ">
 {filteredOccRows.length} registro{filteredOccRows.length !== 1 ? 's' : ''} exibido{filteredOccRows.length !== 1 ? 's' : ''}
 </p>
 <button
 onClick={() => nav('/registro-disciplinar')}
 className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
 >
 Ver registro completo
 </button>
 </div>
 )}
 </section>

 </div>
 );
}
