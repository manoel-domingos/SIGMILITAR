'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactDOM from 'react-dom';
import { useAppContext } from '@/lib/store';
import { supabase as supabaseClient } from '@/lib/supabase';
import { getTenantSlugFromSchoolId } from '@/lib/useTenantConfig';
import {
  Building2, Users, AlertTriangle, Star, Activity,
  RefreshCw, SwitchCamera, TrendingUp, TrendingDown, Minus,
  Shield, ShieldCheck, Award, Zap, AlertCircle, ChevronRight, ChevronDown,
  BarChart3, LayoutDashboard, GripVertical,
  ToggleLeft, ToggleRight, X, CheckCircle2, Trophy, FileWarning,
  Moon, Sun, LogOut, Settings, CloudCheck, CloudOff, BookOpen,
} from 'lucide-react';
import DreDashboard, { type SleepData } from '@/components/DreDashboard';
import AIChat from '@/components/AIChat';

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
  low:      { label: 'Baixo',    color: 'text-emerald-600 ', bg: 'bg-emerald-50 ', dot: 'bg-emerald-500' },
  medium:   { label: 'Medio',    color: 'text-amber-600 ',     bg: 'bg-amber-50 ',     dot: 'bg-amber-400' },
  high:     { label: 'Alto',     color: 'text-orange-600 ',   bg: 'bg-orange-50 ',   dot: 'bg-orange-500' },
  critical: { label: 'Critico',  color: 'text-rose-600 ',       bg: 'bg-rose-50 ',       dot: 'bg-rose-500' },
};

function TrendBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value < 0 : value > 0;
  const neutral = value === 0;
  if (neutral) return <span className="flex items-center gap-0.5 text-[#2B2C33]/80 dark:text-slate-300 text-xs"><Minus className="w-3 h-3" /> —</span>;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${good ? 'text-emerald-600 ' : 'text-rose-500 '}`}>
      {good ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

// Barra de progresso reutilizável
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-[#F4F5F7] dark:bg-[#0F1115]  rounded-full overflow-hidden">
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
        <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-[#2B2C33] dark:text-slate-100 " />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#2B2C33] dark:text-slate-100 ">
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
  const {
    currentUserRole, currentUserSchoolId, setActiveSchoolContext, openContextModal,
    showContextModal, setShowContextModal, contextSchools, logout, user,
    isSupabaseConnected, isSyncing, refreshData, isAuthRestored,
    activePanelModule, setActivePanelModule
  } = useAppContext();

  const handleAdminSelection = (schoolId: string, module: 'civico-militar' | 'pedagogico') => {
    const schoolExists = contextSchools.some(s => s.id === schoolId);
    if (!schoolExists) return;
    const slug = getTenantSlugFromSchoolId(schoolId);
    setActivePanelModule(module);
    setActiveSchoolContext(schoolId);
    
    // Salva no sessionStorage para evitar popup subsequente
    const key = 'dre_context_chosen_' + new Date().toDateString();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, schoolId);
    }
    
    setShowContextModal(false);
    setExpandedSchool(null);
    router.push('/' + slug + (module === 'pedagogico' ? '/pedagogico' : ''));
  };

  const chooseContext = (schoolId: string) => {
    setActiveSchoolContext(schoolId);
    const key = 'dre_context_chosen_' + new Date().toDateString();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, schoolId);
    }
    setShowContextModal(false);
    setExpandedSchool(null);
    if (schoolId === 'DRE') {
      router.push('/dre');
    }
  };

  const resolveSchoolPath = (schoolId: string): string => {
    if (typeof window === 'undefined') return '/';
    const hostname = window.location.hostname.toLowerCase();
    const isCentral = hostname.includes('sigmilitar') ||
                      hostname.includes('localhost');

    if (!isCentral) return '/';

    const slug = getTenantSlugFromSchoolId(schoolId);

    return `/${slug}/`;
  };

  // Redirect para /dre ao entrar (admin_global já está cá, outros vão para /)
  useEffect(() => {
    if (isAuthRestored && currentUserRole && currentUserRole !== 'admin_global') {
      router.replace('/');
    }
  }, [isAuthRestored, currentUserRole, router]);

  // Evita spam de requisições paralelas: throttling de 2 segundos a cada clique
  const lastRefreshTime = useRef<number>(0);
  const handleGlobalClick = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshTime.current > 2000) {
      lastRefreshTime.current = now;
      console.log('[DRE REFRESH] Clique detectado, atualizando dados consolidada...');
      refreshData();
    }
  }, [refreshData]);

  useEffect(() => {
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [handleGlobalClick]);

  const [stats, setStats] = useState<SchoolStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sleepData, setSleepData] = useState<SleepData>({ byWeek: [], byMonth: [] });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Perfil dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMenuPos, setProfileMenuPos] = useState<{ top: number; right: number } | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const el = profileTriggerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setProfileMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    const close = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node) &&
          profileTriggerRef.current && !profileTriggerRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Gestor';
  const userInitials = userName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  // Dark mode — mesmo padrão do AppShell
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Expansão de KPIs por escola
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  type SchoolDetail = {
    topStudents: { name: string; class_name: string; praiseCount: number }[];
    topInfractions: { student_name: string; class_name: string; severity: string; count: number }[];
  };
  const [schoolDetails, setSchoolDetails] = useState<Record<string, SchoolDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const fetchSchoolDetail = useCallback(async (schoolId: string) => {
    if (schoolDetails[schoolId]) return;
    setLoadingDetail(schoolId);
    try {
      const [{ data: praisesData }, { data: occData }] = await Promise.all([
        supabase.from('praises').select('student_id, students(name, class_name)').eq('school_id', schoolId).limit(200),
        supabase.from('occurrences').select('student_id, students(name, class_name)').eq('school_id', schoolId).limit(500),
      ]);
      // Top alunos com mais elogios
      const praiseMap: Record<string, { name: string; class_name: string; praiseCount: number }> = {};
      for (const p of (praisesData ?? []) as any[]) {
        const sid = p.student_id;
        if (!praiseMap[sid]) praiseMap[sid] = { name: p.students?.name ?? '—', class_name: p.students?.class_name ?? '—', praiseCount: 0 };
        praiseMap[sid].praiseCount++;
      }
      const topStudents = Object.values(praiseMap).sort((a, b) => b.praiseCount - a.praiseCount).slice(0, 5);
      // Top alunos com mais ocorrências (infrações)
      const infraMap: Record<string, { student_name: string; class_name: string; count: number }> = {};
      for (const o of (occData ?? []) as any[]) {
        const sid = o.student_id;
        if (!infraMap[sid]) infraMap[sid] = { student_name: o.students?.name ?? '—', class_name: o.students?.class_name ?? '—', count: 0 };
        infraMap[sid].count++;
      }
      const topInfractions = Object.values(infraMap).sort((a, b) => b.count - a.count).slice(0, 5);
      setSchoolDetails(prev => ({ ...prev, [schoolId]: { topStudents, topInfractions } } as Record<string, SchoolDetail>));
    } finally {
      setLoadingDetail(null);
    }
  }, [schoolDetails]);

  const toggleSchool = useCallback((schoolId: string) => {
    setExpandedSchool(prev => {
      if (prev === schoolId) return null;
      fetchSchoolDetail(schoolId);
      return schoolId;
    });
  }, [fetchSchoolDetail]);

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
    if (isAuthRestored && currentUserRole !== 'admin_global' && currentUserSchoolId !== 'DRE') {
      router.replace('/');
    }
  }, [isAuthRestored, currentUserRole, currentUserSchoolId, router]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // 5 queries leves e independentes em paralelo — sem JOIN pesado ou RPC
      const [
        { data: schoolsData, error: schoolsErr },
        { data: allStudents, error: studentsErr },
        { data: allOcc, error: occErr },
        { data: allPraises, error: praisesErr },
        { data: allAccidents, error: accidentsErr },
        { data: allImpl, error: implErr },
        { data: allRules, error: rulesErr },
      ] = await Promise.all([
        supabase.from('schools').select('id, name').neq('id', 'DRE').order('name'),
        supabase.from('students').select('school_id').eq('archived', false),
        supabase.from('occurrences').select('school_id, rule_code, date'),
        supabase.from('praises').select('school_id'),
        supabase.from('accidents').select('school_id'),
        supabase.from('implantacao_items').select('school_id, done'),
        supabase.from('rules').select('code, severity, school_id'),
      ]);

      // Verificar erros nas queries
      if (schoolsErr) throw new Error(`schools: ${schoolsErr.message}`);
      if (studentsErr) throw new Error(`students: ${studentsErr.message}`);
      if (occErr) throw new Error(`occurrences: ${occErr.message}`);
      if (praisesErr) throw new Error(`praises: ${praisesErr.message}`);
      if (accidentsErr) throw new Error(`accidents: ${accidentsErr.message}`);
      if (implErr) throw new Error(`implantacao_items: ${implErr.message}`);
      if (rulesErr) throw new Error(`rules: ${rulesErr.message}`);

      const schools = schoolsData ?? [];
      const allOccRows = allOcc ?? [];
      const allRulesRows = allRules ?? [];

      // Mapa code -> severity para lookup rápido
      const ruleSeverityMap: Record<string, string> = {};
      for (const r of allRulesRows) {
        ruleSeverityMap[String(r.code)] = r.severity ?? 'Leve';
      }

      // Classifica gravidade de uma ocorrência pelo pior rule_code
      function occSeverity(ruleCode: any): string {
        const codes: string[] = Array.isArray(ruleCode) ? ruleCode.map(String) : [];
        const sevs = codes.map(c => ruleSeverityMap[c] ?? 'Leve');
        if (sevs.includes('Grave')) return 'Grave';
        if (sevs.includes('Media')) return 'Media';
        return 'Leve';
      }

      const statsArr: SchoolStats[] = schools.map((school: { id: string; name: string }) => {
        const sid = school.id;
        const occ = allOccRows.filter((o: any) => o.school_id === sid);
        const leves  = occ.filter((o: any) => occSeverity(o.rule_code) === 'Leve').length;
        const medias = occ.filter((o: any) => occSeverity(o.rule_code) === 'Media').length;
        const graves = occ.filter((o: any) => occSeverity(o.rule_code) === 'Grave').length;

        const implRows = (allImpl ?? []).filter((i: any) => i.school_id === sid);
        const partial = {
          id:               sid,
          name:             school.name,
          students:         (allStudents  ?? []).filter((s: any) => s.school_id === sid).length,
          occurrences:      occ.length,
          leves,
          medias,
          graves,
          praises:          (allPraises   ?? []).filter((p: any) => p.school_id === sid).length,
          accidents:        (allAccidents ?? []).filter((a: any) => a.school_id === sid).length,
          implantacaoTotal: implRows.length,
          implantacaoDone:  implRows.filter((i: any) => i.done === true).length,
        };
        const disciplineIndex = calcDisciplineIndex(partial as SchoolStats);
        const gravityRate     = partial.occurrences > 0 ? Math.round((partial.graves / partial.occurrences) * 100) : 0;
        const praiseRatio     = partial.students    > 0 ? Math.round((partial.praises / partial.students)    * 100) : 0;
        const full = { ...partial, disciplineIndex, gravityRate, praiseRatio, riskLevel: 'low' as const };
        return { ...full, riskLevel: calcRisk(full) };
      });

      setStats(statsArr);

      // ── Calcula dados de "dormir em sala" (rule_code contém 14) por semana e mês ──
      const sleepRows = (allOcc ?? []).filter((o: any) => {
        const codes: any[] = Array.isArray(o.rule_code) ? o.rule_code : [];
        return codes.map(String).includes('14');
      });
      const weekMap: Record<string, number> = {};
      const monthMap: Record<string, number> = {};
      const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const nowD = new Date();
      sleepRows.forEach((o: any) => {
        if (!o.date) return;
        const d = new Date(o.date);
        const dow = d.getDay();
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - dow);
        const wKey = weekStart.toISOString().split('T')[0];
        weekMap[wKey] = (weekMap[wKey] ?? 0) + 1;
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[mKey] = (monthMap[mKey] ?? 0) + 1;
      });
      const byWeek: { label: string; value: number; date: string }[] = [];
      for (let w = 7; w >= 0; w--) {
        const d = new Date(nowD);
        d.setDate(nowD.getDate() - nowD.getDay() - w * 7);
        const key = d.toISOString().split('T')[0];
        byWeek.push({ label: `${d.getDate()}/${MONTHS_PT[d.getMonth()]}`, value: weekMap[key] ?? 0, date: key });
      }
      const byMonth: { label: string; value: number; date: string }[] = [];
      for (let m = 5; m >= 0; m--) {
        const d = new Date(nowD.getFullYear(), nowD.getMonth() - m, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        byMonth.push({ label: MONTHS_PT[d.getMonth()], value: monthMap[key] ?? 0, date: key });
      }
      setSleepData({ byWeek, byMonth });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[DRE] load error:', err);
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
    <>
    {/* ── Fundo azul igual ao login DRE ── */}
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0F1115] text-[#2B2C33] dark:text-slate-100 relative">
      {/* Blobs decorativos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        
        
      </div>

      {/* ── Header pill — mesmo estilo das escolas ── */}
      <header className="z-30 px-4 pt-3 pb-2 pointer-events-none" role="banner">
        <div className="pointer-events-auto bg-white dark:bg-[#181A20]  backdrop-blur-2xl border border-[#2B2C33]/10 dark:border-white/10  shadow-sm rounded-full flex items-center justify-between gap-3 px-4 md:px-6 py-1.5 max-w-7xl mx-auto">

          {/* Esquerda: logo + título */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo_dre_color.svg" alt="Logo DRE" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-base md:text-lg font-bold text-[#2B2C33] dark:text-slate-100  leading-tight truncate">
                <span className="font-extrabold">Painel</span>{' '}
                <span className="text-[#2B2C33]/80 dark:text-slate-300  font-normal">DRE</span>
              </h1>
              <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300  uppercase tracking-wider">
                Gestao Regional de Educacao
              </p>
            </div>
            {/* Badge alerta */}
            {alertSchools > 0 && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50  text-rose-600  text-[10px] font-bold border border-rose-200  shrink-0">
                <AlertCircle className="w-3 h-3" aria-hidden="true" /> {alertSchools} alerta{alertSchools > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Direita: controles */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" role="toolbar" aria-label="Controles do painel DRE">

            {/* Status ONLINE */}
            <div
              className={'inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ' + (isSupabaseConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200   ' : 'bg-rose-50 text-rose-600 border border-rose-200   ')}
              aria-label={isSupabaseConnected ? 'Conectado ao servidor' : 'Sem conexao'}
            >
              {isSupabaseConnected ? <CloudCheck className="w-3.5 h-3.5" aria-hidden="true" /> : <CloudOff className="w-3.5 h-3.5" aria-hidden="true" />}
              <span className="hidden xs:inline">{isSupabaseConnected ? 'Online' : 'Offline'}</span>
            </div>

            {/* Trocar escola */}
            <button
              onClick={() => openContextModal()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#2B2C33]/70 dark:text-slate-300  bg-white dark:bg-[#181A20]  backdrop-blur-xl border border-[#2B2C33]/10 dark:border-white/10  hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115] active:scale-95 transition shadow-sm"
              aria-label="Trocar escola"
              title="Trocar Escola"
            >
              <SwitchCamera className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Editar painel */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#2B2C33]/70 dark:text-slate-300  bg-white dark:bg-[#181A20]  backdrop-blur-xl border border-[#2B2C33]/10 dark:border-white/10  hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115] active:scale-95 transition shadow-sm"
              aria-label="Editar painel"
              title="Editar Painel"
            >
              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Dark mode */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#2B2C33]/70 dark:text-slate-300  bg-white dark:bg-[#181A20]  backdrop-blur-xl border border-[#2B2C33]/10 dark:border-white/10  hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115] active:scale-95 transition shadow-sm"
              aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
            </button>

            {/* Atualizar */}
            <button
              onClick={() => load()}
              disabled={loading}
              className={'w-9 h-9 rounded-full flex items-center justify-center text-[#2B2C33]/70 dark:text-slate-300  bg-white dark:bg-[#181A20]  backdrop-blur-xl border border-[#2B2C33]/10 dark:border-white/10  hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115] active:scale-95 transition shadow-sm disabled:opacity-50 ' + (loading ? 'animate-spin text-[#0052CC] dark:text-blue-400' : '')}
              aria-label="Atualizar dados"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Perfil */}
            <button
              ref={profileTriggerRef}
              onClick={() => setProfileOpen(o => !o)}
              aria-haspopup="true"
              aria-expanded={profileOpen}
              aria-label={`Menu do usuario ${userName}`}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-white dark:bg-[#181A20]  backdrop-blur-xl border border-[#2B2C33]/10 dark:border-white/10  hover:bg-white/90 active:scale-95 transition shadow-sm"
            >
              {user?.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold flex items-center justify-center" aria-hidden="true">
                  {userInitials}
                </span>
              )}
              <div className="text-left hidden sm:block leading-tight pr-1">
                <p className="text-xs font-semibold text-[#2B2C33] dark:text-slate-100 ">{userName}</p>
                <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300 ">admin global</p>
              </div>
            </button>

            {/* Dropdown perfil via portal */}
            {mounted && profileOpen && profileMenuPos && ReactDOM.createPortal(
              <div
                ref={profileMenuRef}
                role="menu"
                aria-label="Menu de perfil"
                className="fixed w-64 glass-dropdown overflow-hidden text-sm animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ top: profileMenuPos.top, right: profileMenuPos.right, zIndex: 99999 }}
              >
                <div className="p-4 border-b border-[#2B2C33]/10 dark:border-white/10  bg-[#F4F5F7] dark:bg-[#0F1115]/80 ">
                  <p className="font-semibold text-[#2B2C33] dark:text-slate-100  truncate">{userName}</p>
                  <p className="text-[#2B2C33]/80 dark:text-slate-300  text-xs truncate">{user?.email || 'admin@dre.local'}</p>
                </div>
                <div className="py-2" role="none">
                  <button
                    role="menuitem"
                    onClick={() => { router.push('/dretga/configuracoes'); setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115] text-purple-600  flex items-center gap-3 transition-colors"
                  >
                    <Settings className="w-4 h-4" aria-hidden="true" /> Configuracao do Sistema
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { logout(); setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115] text-rose-600  flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" /> Sair
                  </button>
                </div>
                <div className="px-4 py-2.5 border-t border-[#2B2C33]/10 dark:border-white/10  bg-[#F4F5F7] dark:bg-[#0F1115]/80 ">
                  <p className="text-[11px] text-[#2B2C33]/80 dark:text-slate-300  italic text-center">
                    DRE · Gestao Regional
                  </p>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </header>

    <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24">

      {/* ---- DRAWER EDITAR PAINEL ---- */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-[#181A20]  shadow-2xl z-50 flex flex-col border-l border-[#2B2C33]/10 dark:border-white/10 ">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B2C33]/10 dark:border-white/10 ">
              <div>
                <h2 className="font-bold text-[#2B2C33] dark:text-slate-100  text-base">Configurar Painel DRE</h2>
                <p className="text-xs text-[#2B2C33]/80 dark:text-slate-300  mt-0.5">Ative, desative e reordene</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115] text-[#2B2C33]/80 dark:text-slate-300 hover:text-[#2B2C33]/70 dark:text-slate-300 transition-colors">
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
                  className={'flex items-center gap-3 px-3 py-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ' + (dragIdx === idx ? 'opacity-40 scale-95' : '') + ' ' + (panel.enabled ? 'bg-white dark:bg-[#181A20]  border-[#2B2C33]/10 dark:border-white/10  shadow-sm' : 'bg-[#F4F5F7] dark:bg-[#0F1115]  border-[#2B2C33]/10 dark:border-white/10 ')}
                >
                  <GripVertical className="w-4 h-4 text-[#2B2C33]/70 dark:text-slate-300  shrink-0" />
                  <span className={'flex-1 text-sm font-medium ' + (panel.enabled ? 'text-[#2B2C33] dark:text-slate-100 ' : 'text-[#2B2C33]/80 dark:text-slate-300  line-through')}>{panel.label}</span>
                  <button onClick={() => togglePanel(panel.id)} className="shrink-0 transition-colors" title={panel.enabled ? 'Desativar' : 'Ativar'}>
                    {panel.enabled
                      ? <ToggleRight className="w-7 h-7 text-[#0052CC] dark:text-blue-400" />
                      : <ToggleLeft  className="w-7 h-7 text-[#2B2C33]/70 dark:text-slate-300 " />}
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-4 border-t border-[#2B2C33]/10 dark:border-white/10 ">
              <button onClick={() => setPanels(DRE_DEFAULT_PANELS)} className="w-full text-xs text-[#2B2C33]/80 dark:text-slate-300 hover:text-[#2B2C33] dark:text-slate-100 transition-colors py-2 rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115]">
                Restaurar padrao
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---- DASHBOARD KPIs ---- */}
      <DreDashboard
        stats={stats}
        loading={loading}
        isVisible={isVisible}
        sleepData={sleepData}
        onSchoolClick={(schoolId) => {
          setExpandedSchool(schoolId);
          openContextModal();
        }}
        onNavigate={(route) => router.push(route)}
      />

      {/* ---- KPIs PRIMÁRIOS (linha grande) — substituído por DreDashboard acima ---- */}
      {false && <section className="hidden">

        {/* Indice Global de Disciplina — destaque */}
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br bg-white dark:bg-[#181A20] rounded-2xl p-5 shadow-lg shadow-sm text-[#2B2C33] dark:text-slate-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2B2C33]/60 dark:text-slate-400">Indice de Disciplina</p>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-5xl font-black tracking-tight">{avgDiscipline}</p>
              <p className="text-xs text-[#2B2C33]/60 dark:text-slate-400 mt-1">media da rede · /100</p>
            </div>
            <Shield className="w-10 h-10 text-[#0052CC] dark:text-blue-400/40" />
          </div>
          <ProgressBar value={avgDiscipline} max={100} color="bg-white/40" />
          <p className="text-[10px] text-[#2B2C33]/60 dark:text-slate-400 mt-1">
            {avgDiscipline >= 75 ? 'Rede em boa situacao disciplinar' : avgDiscipline >= 55 ? 'Atencao necessaria em algumas escolas' : 'Intervencao recomendada'}
          </p>
        </div>

        {/* Total alunos */}
        <div className="bg-white dark:bg-[#181A20]  border border-[#2B2C33]/10 dark:border-white/10  rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#F4F5F7] dark:bg-[#0F1115]  flex items-center justify-center">
              <Users className="w-4 h-4 text-[#2B2C33]/70 dark:text-slate-300 " />
            </div>
            <TrendBadge value={0} />
          </div>
          <p className="text-3xl font-black text-[#2B2C33] dark:text-slate-100  mt-3 tracking-tight">{totalStudents.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[#2B2C33]/80 dark:text-slate-300  mt-0.5 font-medium uppercase tracking-wide">Alunos Ativos</p>
          <p className="text-[11px] text-[#2B2C33]/80 dark:text-slate-300 mt-1">{stats.length} escola{stats.length !== 1 ? 's' : ''} ativas</p>
        </div>

        {/* Ocorrencias */}
        <div className="bg-white dark:bg-[#181A20]  border border-[#2B2C33]/10 dark:border-white/10  rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50  flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600 " />
            </div>
            <TrendBadge value={0} inverse />
          </div>
          <p className="text-3xl font-black text-[#2B2C33] dark:text-slate-100  mt-3 tracking-tight">{totalOcc}</p>
          <p className="text-xs text-[#2B2C33]/80 dark:text-slate-300  mt-0.5 font-medium uppercase tracking-wide">Ocorrencias</p>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] text-amber-500 font-medium">L {stats.reduce((s,x)=>s+x.leves,0)}</span>
            <span className="text-[10px] text-orange-500 font-medium">M {stats.reduce((s,x)=>s+x.medias,0)}</span>
            <span className="text-[10px] text-rose-500 font-bold">G {totalGraves}</span>
          </div>
        </div>

        {/* Elogios */}
        <div className="bg-white dark:bg-[#181A20]  border border-[#2B2C33]/10 dark:border-white/10  rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50  flex items-center justify-center">
              <Star className="w-4 h-4 text-emerald-600 " />
            </div>
            <TrendBadge value={0} />
          </div>
          <p className="text-3xl font-black text-[#2B2C33] dark:text-slate-100  mt-3 tracking-tight">{totalPraises}</p>
          <p className="text-xs text-[#2B2C33]/80 dark:text-slate-300  mt-0.5 font-medium uppercase tracking-wide">Elogios</p>
          <p className="text-[11px] text-[#2B2C33]/80 dark:text-slate-300 mt-1">{globalPraiseRatio} por 100 alunos</p>
        </div>
      </section>}

      {/* ---- KPIs SECUNDÁRIOS — substituído por DreDashboard ---- */}
      {false && <section className="hidden">

        <div className="bg-white dark:bg-[#181A20]  border border-[#2B2C33]/10 dark:border-white/10  rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-rose-500" />
            <p className="text-[11px] font-semibold text-[#2B2C33]/80 dark:text-slate-300  uppercase tracking-wide">Taxa de Gravidade</p>
          </div>
          <p className="text-2xl font-black text-[#2B2C33] dark:text-slate-100 ">{globalGravityRate}<span className="text-base font-medium text-[#2B2C33]/80 dark:text-slate-300">%</span></p>
          <ProgressBar value={globalGravityRate} max={100} color={globalGravityRate > 30 ? 'bg-rose-500' : globalGravityRate > 15 ? 'bg-amber-400' : 'bg-emerald-400'} />
          <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300 mt-1">ocorrencias graves / total</p>
        </div>

        <div className="bg-white dark:bg-[#181A20]  border border-[#2B2C33]/10 dark:border-white/10  rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <p className="text-[11px] font-semibold text-[#2B2C33]/80 dark:text-slate-300  uppercase tracking-wide">Razao Elogio/Ocorrencia</p>
          </div>
          <p className="text-2xl font-black text-[#2B2C33] dark:text-slate-100 ">
            {totalOcc > 0 ? (totalPraises / totalOcc).toFixed(1) : '—'}
            <span className="text-sm font-medium text-[#2B2C33]/80 dark:text-slate-300 ml-1">x</span>
          </p>
          <ProgressBar value={Math.min(totalPraises, totalOcc * 2)} max={totalOcc * 2 || 1} color="bg-emerald-400" />
          <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300 mt-1">{totalPraises > totalOcc ? 'acima do esperado' : 'abaixo do esperado'}</p>
        </div>

        <div className="bg-white dark:bg-[#181A20]  border border-[#2B2C33]/10 dark:border-white/10  rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-violet-500" />
            <p className="text-[11px] font-semibold text-[#2B2C33]/80 dark:text-slate-300  uppercase tracking-wide">Acidentes Registrados</p>
          </div>
          <p className="text-2xl font-black text-[#2B2C33] dark:text-slate-100 ">{totalAccidents}</p>
          <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300 mt-1">
            {totalStudents > 0 ? ((totalAccidents / totalStudents) * 1000).toFixed(1) : '0'} por mil alunos
          </p>
          <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${totalAccidents === 0 ? 'bg-emerald-50  text-emerald-600 ' : 'bg-amber-50  text-amber-600 '}`}>
            {totalAccidents === 0 ? 'Zero acidentes' : 'Requer atencao'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#181A20]  border border-[#2B2C33]/10 dark:border-white/10  rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <p className="text-[11px] font-semibold text-[#2B2C33]/80 dark:text-slate-300  uppercase tracking-wide">Alertas Ativos</p>
          </div>
          <p className="text-2xl font-black text-[#2B2C33] dark:text-slate-100 ">{alertSchools}</p>
          <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300 mt-1">
            {alertSchools === 0 ? 'Nenhuma escola em alerta' : `${alertSchools} escola${alertSchools > 1 ? 's' : ''} acima do limiar`}
          </p>
          <div className="flex gap-1 mt-2">
            {stats.filter(s => s.riskLevel === 'critical').length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100  text-rose-600 ">
                {stats.filter(s => s.riskLevel === 'critical').length} CRITICO
              </span>
            )}
            {stats.filter(s => s.riskLevel === 'high').length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100  text-orange-600 ">
                {stats.filter(s => s.riskLevel === 'high').length} ALTO
              </span>
            )}
            {alertSchools === 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100  text-emerald-600 ">TUDO OK</span>
            )}
          </div>
        </div>
      </section>}

      {/* ---- KPI IMPLANTACAO — substituído por DreDashboard ---- */}
      {false && (() => {
        const totalImpl = stats.reduce((s, x) => s + x.implantacaoTotal, 0);
        const doneImpl  = stats.reduce((s, x) => s + x.implantacaoDone, 0);
        const pctImpl   = totalImpl > 0 ? Math.round((doneImpl / totalImpl) * 100) : 0;
        return (
          <section className="bg-white dark:bg-[#181A20]  border border-[#2B2C33]/10 dark:border-white/10  rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0052CC] dark:text-blue-400 " />
                <h2 className="text-sm font-semibold text-[#2B2C33] dark:text-slate-100  uppercase tracking-wide">Implantacao da Rede</h2>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pctImpl >= 80 ? 'bg-emerald-50  text-emerald-600 ' : pctImpl >= 50 ? 'bg-amber-50  text-amber-600 ' : 'bg-rose-50  text-rose-600 '}`}>
                {pctImpl}% concluido
              </span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <p className="text-4xl font-black text-[#2B2C33] dark:text-slate-100  tracking-tight">{doneImpl}<span className="text-base font-medium text-[#2B2C33]/80 dark:text-slate-300 ml-1">/ {totalImpl}</span></p>
              <div className="flex-1">
                <ProgressBar value={doneImpl} max={totalImpl || 1} color={pctImpl >= 80 ? 'bg-emerald-500' : pctImpl >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
                <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300 mt-1">itens concluidos de {totalImpl} no total da rede</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#2B2C33]/10 dark:border-white/10 ">
              {stats.map(school => {
                const pct = school.implantacaoTotal > 0 ? Math.round((school.implantacaoDone / school.implantacaoTotal) * 100) : 0;
                return (
                  <div key={school.id} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] font-medium text-[#2B2C33]/70 dark:text-slate-300  truncate">{school.name.replace('EECM Prof. ', '')}</p>
                      <span className="text-[10px] font-bold text-[#2B2C33]/80 dark:text-slate-300 ">{pct}%</span>
                    </div>
                    <ProgressBar value={school.implantacaoDone} max={school.implantacaoTotal || 1} color={pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
                    <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300">{school.implantacaoDone}/{school.implantacaoTotal} itens</p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ---- RANKING + CARDS DE ESCOLAS — substituído por DreDashboard ---- */}
      {false && <div className="hidden">

        {/* Ranking de disciplina */}
        {isVisible('ranking') && <div className="bg-white dark:bg-[#181A20]  border border-[#2B2C33]/10 dark:border-white/10  rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#0052CC] dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-[#2B2C33] dark:text-slate-100 ">Ranking Disciplinar</h2>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-[#F4F5F7] dark:bg-[#0F1115]  rounded-lg animate-pulse"/>)}</div>
          ) : ranked.length === 0 ? (
            <p className="text-sm text-[#2B2C33]/80 dark:text-slate-300">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {ranked.map((school, idx) => {
                const risk = RISK_META[school.riskLevel];
                return (
                  <div key={school.id} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-bold text-[#2B2C33]/80 dark:text-slate-300">{idx + 1}</span>
                    <DisciplineRing value={school.disciplineIndex} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2B2C33] dark:text-slate-100  truncate">{school.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                        <span className={`text-[10px] font-medium ${risk.color}`}>{risk.label}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setActiveSchoolContext(school.id); router.push(resolveSchoolPath(school.id)); }}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115] text-[#2B2C33]/80 dark:text-slate-300 hover:text-[#0052CC] dark:text-blue-400 transition-colors"
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
          <h2 className="text-xs font-semibold text-[#2B2C33]/80 dark:text-slate-300 uppercase tracking-widest">Escolas da Rede</h2>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-44 rounded-2xl bg-[#F4F5F7] dark:bg-[#0F1115]  animate-pulse"/>)}</div>
          ) : stats.length === 0 ? (
            <p className="text-sm text-[#2B2C33]/80 dark:text-slate-300">Nenhuma escola encontrada.</p>
          ) : (
            stats.map(school => {
              const risk = RISK_META[school.riskLevel];
              const isExpanded = expandedSchool === school.id;
              const detail = schoolDetails[school.id];
              const isLoadingThis = loadingDetail === school.id;
              const kpis = [
                { label: 'Alunos',    value: school.students,    color: 'text-[#2B2C33] dark:text-slate-100 ',          bg: 'bg-[#F4F5F7] dark:bg-[#0F1115] ',        activeBg: 'bg-[#F4F5F7] dark:bg-[#0F1115] ' },
                { label: 'Ocorr.',    value: school.occurrences, color: 'text-amber-600 ',      bg: 'bg-amber-50/60 ',     activeBg: 'bg-amber-100 ' },
                { label: 'Graves',    value: school.graves,      color: 'text-rose-600 ',        bg: 'bg-rose-50/60 ',       activeBg: 'bg-rose-100 ' },
                { label: 'Elogios',   value: school.praises,     color: 'text-emerald-600 ',  bg: 'bg-emerald-50/60 ', activeBg: 'bg-emerald-100 ' },
                { label: 'Acidentes', value: school.accidents,   color: 'text-violet-600 ',    bg: 'bg-violet-50/60 ',   activeBg: 'bg-violet-100 ' },
              ];
              return (
                <div
                  key={school.id}
                  className={`bg-white dark:bg-[#181A20]  border rounded-2xl shadow-sm transition-all duration-300
                    ${isExpanded
                      ? 'border-blue-400  shadow-blue-100  shadow-md ring-2 ring-blue-200 '
                      : school.riskLevel === 'critical' ? 'border-rose-300  hover:shadow-md'
                      : school.riskLevel === 'high' ? 'border-orange-200  hover:shadow-md'
                      : 'border-[#2B2C33]/10 dark:border-white/10  hover:border-blue-300 :border-blue-500/50 hover:shadow-md'
                    }`}
                >
                  {/* Cabecalho clicavel */}
                  <button
                    onClick={() => toggleSchool(school.id)}
                    className="w-full p-5 text-left"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-100 ' : 'bg-blue-50 '}`}>
                          <ShieldCheck className={`w-5 h-5 transition-colors ${isExpanded ? 'text-blue-700 ' : 'text-[#0052CC] dark:text-blue-400 '}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#2B2C33] dark:text-slate-100  text-sm">{school.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                            <span className={`text-[10px] font-semibold ${risk.color}`}>Risco {risk.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DisciplineRing value={school.disciplineIndex} />
                        <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${isExpanded ? 'bg-blue-100  text-blue-700 ' : 'bg-[#F4F5F7] dark:bg-[#0F1115]  text-[#2B2C33]/80 dark:text-slate-300 '}`}>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {/* Grid de KPIs — clicável */}
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {kpis.map(m => (
                        <div
                          key={m.label}
                          className={`text-center rounded-lg py-2 transition-all duration-200 ${isExpanded ? m.activeBg + ' scale-[1.03] shadow-sm' : m.bg}`}
                        >
                          <p className={`text-base font-black ${m.color}`}>{m.value}</p>
                          <p className="text-[9px] text-[#2B2C33]/80 dark:text-slate-300 mt-0.5">{m.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Indices calculados */}
                    <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[#2B2C33]/80 dark:text-slate-300 ">Taxa graves</span>
                          <span className="font-semibold text-[#2B2C33] dark:text-slate-100 ">{school.gravityRate}%</span>
                        </div>
                        <ProgressBar value={school.gravityRate} max={100} color={school.gravityRate > 30 ? 'bg-rose-400' : school.gravityRate > 15 ? 'bg-amber-400' : 'bg-emerald-400'} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[#2B2C33]/80 dark:text-slate-300 ">Elogios/100 alunos</span>
                          <span className="font-semibold text-[#2B2C33] dark:text-slate-100 ">{school.praiseRatio}</span>
                        </div>
                        <ProgressBar value={school.praiseRatio} max={100} color="bg-emerald-400" />
                      </div>
                    </div>

                    {/* Barra de distribuicao */}
                    {school.occurrences > 0 && (
                      <div className="mt-3">
                        <p className="text-[9px] text-[#2B2C33]/80 dark:text-slate-300 mb-1 uppercase tracking-wide">Distribuicao de ocorrencias</p>
                        <div className="flex h-2 rounded-full overflow-hidden gap-px">
                          {school.leves  > 0 && <div className="bg-amber-300  rounded-l-full" style={{ width: `${(school.leves/school.occurrences)*100}%` }} />}
                          {school.medias > 0 && <div className="bg-orange-400 " style={{ width: `${(school.medias/school.occurrences)*100}%` }} />}
                          {school.graves > 0 && <div className="bg-rose-500  rounded-r-full" style={{ width: `${(school.graves/school.occurrences)*100}%` }} />}
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Painel expandido */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5 border-t border-[#2B2C33]/10 dark:border-white/10  pt-4 space-y-5">

                      {isLoadingThis ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-[#2B2C33]/80 dark:text-slate-300 text-sm">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Carregando detalhes...
                        </div>
                      ) : detail ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                          {/* Rankings dos alunos */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 mb-3">
                              <Trophy className="w-4 h-4 text-amber-500" />
                              <span className="text-xs font-bold text-[#2B2C33] dark:text-slate-100  uppercase tracking-wide">Ranking de Elogios</span>
                            </div>
                            {detail.topStudents.length === 0 ? (
                              <p className="text-xs text-[#2B2C33]/80 dark:text-slate-300 py-2">Nenhum elogio registrado.</p>
                            ) : detail.topStudents.map((s, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50  hover:bg-emerald-100 :bg-emerald-500/20 transition-colors">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-[#2B2C33] dark:text-slate-100' : i === 2 ? 'bg-orange-300 text-white' : 'bg-[#F4F5F7] dark:bg-[#0F1115]  text-[#2B2C33]/80 dark:text-slate-300'}`}>{i+1}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-[#2B2C33] dark:text-slate-100  truncate">{s.name}</p>
                                  <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300">{s.class_name}</p>
                                </div>
                                <span className="text-xs font-black text-emerald-600  shrink-0">{s.praiseCount}x</span>
                              </div>
                            ))}
                          </div>

                          {/* Top infrações */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 mb-3">
                              <FileWarning className="w-4 h-4 text-rose-500" />
                              <span className="text-xs font-bold text-[#2B2C33] dark:text-slate-100  uppercase tracking-wide">Top Infrações</span>
                            </div>
                            {detail.topInfractions.length === 0 ? (
                              <p className="text-xs text-[#2B2C33]/80 dark:text-slate-300 py-2">Nenhuma infração registrada.</p>
                            ) : detail.topInfractions.map((inf, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-rose-50  hover:bg-rose-100 :bg-rose-500/20 transition-colors">
                                <span className="w-5 h-5 rounded-full bg-rose-100  flex items-center justify-center text-[10px] font-black text-rose-600  shrink-0">{i+1}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-[#2B2C33] dark:text-slate-100  truncate">{inf.student_name}</p>
                                  <p className="text-[10px] text-[#2B2C33]/80 dark:text-slate-300">{inf.class_name}</p>
                                </div>
                                <span className="text-xs font-black text-rose-600  shrink-0">{inf.count}x</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Botão acessar escola */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveSchoolContext(school.id); router.push(resolveSchoolPath(school.id)); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0052CC] dark:bg-blue-600 hover:bg-[#0052CC] dark:hover:bg-blue-700 dark:bg-blue-600 active:scale-95 text-white text-sm font-semibold transition-all"
                      >
                        Acessar painel da escola <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>}
      </div>}
    </div>

    {/* Modal de seleção de escola — renderizado direto na DRE pois não usa AppShell */}
    {showContextModal && (
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowContextModal(false); setExpandedSchool(null); } }}
      >
        <div className="bg-white dark:bg-[#181A20] border border-[#2B2C33]/10 dark:border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95 fade-in duration-200">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-[#0052CC] dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#2B2C33] dark:text-slate-100">Qual painel deseja ver?</h3>
            <p className="text-sm text-[#2B2C33]/80 dark:text-slate-300">Você pode alternar a qualquer momento pelo botão Trocar Escola.</p>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => chooseContext('DRE')}
              className="w-full py-3 rounded-xl bg-[#0052CC] dark:bg-blue-600 hover:bg-[#0052CC] dark:hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <Building2 className="w-4 h-4" /> Painel DRE — Visão Consolidada
            </button>
            {contextSchools.map(s => {
              const isExpanded = expandedSchool === s.id;
              return (
                <div key={s.id} className="w-full border border-[#2B2C33]/10 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => setExpandedSchool(prev => prev === s.id ? null : s.id)}
                    className="w-full py-3 px-4 text-sm font-semibold text-[#2B2C33] dark:text-slate-100 hover:bg-[#F4F5F7] dark:hover:bg-[#22252D] dark:bg-[#0F1115] transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-left">{s.name}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="bg-slate-50 dark:bg-slate-950/40 px-3 pb-3 pt-1 border-t border-[#2B2C33]/10 dark:border-white/10 space-y-1 animate-in slide-in-from-top-1 fade-in duration-150">
                      <button
                        onClick={() => handleAdminSelection(s.id, 'civico-militar')}
                        className="w-full py-2.5 px-4 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Gestão Cívico Militar
                      </button>
                      <button
                        onClick={() => handleAdminSelection(s.id, 'pedagogico')}
                        className="w-full py-2.5 px-4 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Gestão Pedagógica
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}

      {/* ── Flutuante de IA — mesmo do AppShell ── */}
      <AIChat />

    </div>{/* fim fundo azul */}
    </>
  );
}
