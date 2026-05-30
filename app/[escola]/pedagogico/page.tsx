// app/[escola]/pedagogico/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { MEG_EIXOS, MEG_EVIDENCIAS, MEG_AXIS_CONFIGS } from '@/lib/meg-data';
import EixoCard from '@/components/meg/EixoCard';
import ProgressBar from '@/components/meg/ProgressBar';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, ClipboardCheck, AlertTriangle, ShieldCheck, 
  TrendingUp, Award, Calendar, BookOpen 
} from 'lucide-react';
import Link from 'next/link';
import { useTenantConfig, getLinkHref, getDbSchoolId } from '@/lib/useTenantConfig';
import { usePathname } from 'next/navigation';
import AppShell from '@/components/AppShell';

export default function PedagogicoDashboard() {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;

  const { 
    activeSchoolContext, 
    currentUserRole, 
    user, 
    isAuthRestored,
    contextSchools
  } = useAppContext();

  const [loading, setLoading] = useState<boolean>(true);
  const [checklistData, setChecklistData] = useState<any[]>([]);
  const [progressByEixo, setProgressByEixo] = useState<Record<string, number>>({});
  const [overallProgress, setOverallProgress] = useState<number>(0);

  const resolvedSchoolId = getDbSchoolId(schoolSlug);

  // Mapped school name
  const currentSchool = contextSchools.find(s => s.id === resolvedSchoolId);
  const schoolName = currentSchool?.name || 'EECM';

  // Fetch checklist records
  useEffect(() => {
    if (!isAuthRestored) return;

    async function fetchChecklist() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('meg_checklist')
          .select('*')
          .eq('school_id', resolvedSchoolId);

        if (error) throw error;
        setChecklistData(data || []);
      } catch (err) {
        console.error('Error fetching MEG checklist:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChecklist();
  }, [resolvedSchoolId, isAuthRestored]);

  // Calculate percentages and metrics
  useEffect(() => {
    const counts: Record<string, { total: number; completed: number }> = {};

    // Initialize counts for each eixo
    MEG_EIXOS.forEach(e => {
      counts[e.id] = { total: 0, completed: 0 };
    });

    // Populate total counts from static definition
    MEG_EVIDENCIAS.forEach(ev => {
      if (counts[ev.eixoId]) {
        counts[ev.eixoId].total += 1;
      }
    });

    // Populate completed counts from Supabase results
    checklistData.forEach(item => {
      const ev = MEG_EVIDENCIAS.find(e => e.id === item.evidencia_id);
      if (ev && counts[ev.eixoId] && item.status === 'concluido') {
        counts[ev.eixoId].completed += 1;
      }
    });

    // Calculate final percentages
    const progress: Record<string, number> = {};
    let totalCompleted = 0;
    let totalEvidences = MEG_EVIDENCIAS.length;

    MEG_EIXOS.forEach(e => {
      const c = counts[e.id];
      progress[e.id] = c.total > 0 ? (c.completed / c.total) * 100 : 0;
      totalCompleted += c.completed;
    });

    setProgressByEixo(progress);
    setOverallProgress(totalEvidences > 0 ? (totalCompleted / totalEvidences) * 100 : 0);
  }, [checklistData]);

  // Handle navigation
  const handleEixoClick = (eixoSlug: string) => {
    router.push(`/${schoolSlug}/pedagogico/${eixoSlug}`);
  };

  if (!isAuthRestored || loading) {
    return (
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-40 w-full bg-slate-200 dark:bg-slate-800/50 rounded-3xl" />
        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
        </div>
        {/* Grid Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-in fade-in duration-300">
        
        {/* Premium Gradient Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-blue-700 p-6 sm:p-8 text-white shadow-lg border border-blue-500/20 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              <GraduationCap className="w-4 h-4 text-cyan-300" />
              MEG EDUCAÇÃO — SEDUC-MT
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Gestão Pedagógica
              </h1>
              <p className="text-sm sm:text-base text-blue-100 font-light mt-1">
                Modelo de Excelência em Gestão e Acompanhamento de Evidências Escolares na unidade:
                <span className="font-semibold text-white ml-1">{schoolName}</span>
              </p>
            </div>
          </div>

          <Link
            href={`/${schoolSlug}/pedagogico/oscar`}
            className="relative z-10 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 px-5 py-3 rounded-2xl text-sm font-extrabold shadow-lg transition flex items-center justify-center gap-2 shrink-0 self-start md:self-auto border border-white/20 active:scale-95"
          >
            <Award className="w-4 h-4 text-amber-500" />
            Oscar da Educação 🏆
          </Link>
        </div>

        {/* KPI Cards Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Conformidade Geral
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                {Math.round(overallProgress)}%
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Evidências Aprovadas
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                {checklistData.filter(c => c.status === 'concluido').length} de {MEG_EVIDENCIAS.length}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Fases em Aberto
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                {MEG_EVIDENCIAS.length - checklistData.filter(c => c.status === 'concluido').length} pendentes
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Overview Card (Semelhante ao Painel de Implantação) */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/40 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                {Math.round(overallProgress)}%
              </span>
              <span className="ml-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                {overallProgress < 25 ? 'Iniciando' : 
                 overallProgress < 50 ? 'Em andamento' :
                 overallProgress < 75 ? 'Avançando' : 
                 overallProgress < 100 ? 'Quase concluído' : 'Concluído!'}
              </span>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-semibold">
              {checklistData.filter(c => c.status === 'concluido').length} de {MEG_EVIDENCIAS.length} etapas concluídas
            </span>
          </div>
          
          {/* Barra principal consolidada */}
          <div className="h-3.5 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallProgress < 25 ? 'bg-rose-500 shadow-rose-500/20' :
                overallProgress < 50 ? 'bg-amber-500 shadow-amber-500/20' :
                overallProgress < 75 ? 'bg-blue-500 shadow-blue-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Mini barras horizontais por Eixo (semelhante ao implantação) */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/30">
            {MEG_EIXOS.map(e => {
              const pct = Math.round(progressByEixo[e.id] || 0);
              const eixoConfig = MEG_AXIS_CONFIGS[e.id] || { nome: e.nome, numero: e.numero };
              
              // Determine tiny color
              let barColor = 'bg-rose-500';
              if (pct >= 80) barColor = 'bg-emerald-500';
              else if (pct >= 50) barColor = 'bg-amber-500';

              return (
                <div key={e.id} className="space-y-1.5 min-w-0">
                  <div className="flex justify-between gap-2 text-[10px] sm:text-xs">
                    <span className="text-slate-500 dark:text-slate-400 truncate font-semibold" title={eixoConfig.nome}>
                      Eixo {eixoConfig.numero}
                    </span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 font-mono">{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid of the 5 MEG Eixos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              Eixos do MEG Educação
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MEG_EIXOS.map(e => {
              const eixoConfig = MEG_AXIS_CONFIGS[e.id] || { nome: e.nome, numero: e.numero };
              return (
                <EixoCard
                  key={e.id}
                  eixo={{
                    ...e,
                    nome: eixoConfig.nome,
                    numero: eixoConfig.numero
                  }}
                  progresso={progressByEixo[e.id] || 0}
                  onClick={() => handleEixoClick(e.slug)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
