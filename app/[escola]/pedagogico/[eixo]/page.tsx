// app/[escola]/pedagogico/[eixo]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { MEG_EIXOS, MEG_FASES, MEG_EVIDENCIAS, MEG_AXIS_CONFIGS } from '@/lib/meg-data';
import ProgressBar from '@/components/meg/ProgressBar';
import { supabase } from '@/lib/supabase';
import { 
  ChevronRight, Calendar, ArrowLeft, RefreshCw, 
  HelpCircle, AlertTriangle, CheckCircle, BookOpen 
} from 'lucide-react';
import Link from 'next/link';
import { getDbSchoolId } from '@/lib/useTenantConfig';
import AppShell from '@/components/AppShell';

export default function EixoPage() {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;
  const eixoSlug = params.eixo as string;

  const { 
    activeSchoolContext, 
    isAuthRestored,
    contextSchools
  } = useAppContext();

  const [loading, setLoading] = useState<boolean>(true);
  const [checklistData, setChecklistData] = useState<any[]>([]);
  const [faseMetrics, setFaseMetrics] = useState<Record<string, { percent: number; status: string; completed: number; total: number }>>({});

  const resolvedSchoolId = getDbSchoolId(schoolSlug);

  // Resolve active Eixo
  const rawEixo = MEG_EIXOS.find(e => e.slug === eixoSlug);
  const eixo = rawEixo ? {
    ...rawEixo,
    nome: MEG_AXIS_CONFIGS[rawEixo.id]?.nome || rawEixo.nome,
    numero: MEG_AXIS_CONFIGS[rawEixo.id]?.numero || rawEixo.numero
  } : null;

  // Mapped school name
  const currentSchool = contextSchools.find(s => s.id === resolvedSchoolId);
  const schoolName = currentSchool?.name || 'EECM';

  // Fetch checklist records
  useEffect(() => {
    if (!isAuthRestored || !eixo) return;

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
        console.error('Error fetching checklist for axis:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChecklist();
  }, [resolvedSchoolId, isAuthRestored, eixo?.id]);

  // Calculate metrics for each of the 5 phases
  useEffect(() => {
    if (!eixo) return;

    const metrics: Record<string, { percent: number; status: string; completed: number; total: number }> = {};

    MEG_FASES.forEach(f => {
      // Find all static evidences for this Eixo and this Fase
      const axisFaseEvidences = MEG_EVIDENCIAS.filter(ev => ev.eixoId === eixo.id && ev.faseId === f.id);
      const totalCount = axisFaseEvidences.length;

      if (totalCount === 0) {
        metrics[f.id] = { percent: 0, status: 'Sem evidências', completed: 0, total: 0 };
        return;
      }

      // Count completed evidences from Supabase
      let completedCount = 0;
      let hasProgress = false;

      axisFaseEvidences.forEach(ev => {
        const checkRecord = checklistData.find(c => c.evidencia_id === ev.id);
        if (checkRecord) {
          if (checkRecord.status === 'concluido') {
            completedCount += 1;
            hasProgress = true;
          } else if (checkRecord.status === 'em_andamento') {
            hasProgress = true;
          }
        }
      });

      const percent = (completedCount / totalCount) * 100;
      
      let statusText = 'Não Iniciado';
      if (percent === 100) {
        statusText = 'Concluído';
      } else if (hasProgress || percent > 0) {
        statusText = 'Em Andamento';
      }

      metrics[f.id] = {
        percent,
        status: statusText,
        completed: completedCount,
        total: totalCount
      };
    });

    setFaseMetrics(metrics);
  }, [checklistData, eixo?.id]);

  // Invalid Axis Guard
  if (isAuthRestored && !eixo) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-rose-500">Eixo não encontrado</h2>
        <p className="text-slate-500">O eixo solicitado não existe nas diretrizes do MEG Educação.</p>
        <button
          onClick={() => router.push(`/${schoolSlug}/pedagogico`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm"
        >
          Voltar para o Dashboard
        </button>
      </div>
    );
  }

  if (!isAuthRestored || loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 min-h-screen pb-24 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/50 rounded" />
        {/* Title Skeleton */}
        <div className="h-10 w-96 bg-slate-200 dark:bg-slate-800/50 rounded-lg" />
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-in fade-in duration-300">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 dark:text-slate-500">
          <Link href={`/${schoolSlug}/pedagogico`} className="hover:text-blue-500 transition-colors">
            Gestão Pedagógica
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            Eixo {eixo!.numero}
          </span>
        </div>

        {/* Axis Information Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/40 pb-6">
          <div className="space-y-2">
            <button
              onClick={() => router.push(`/${schoolSlug}/pedagogico`)}
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline font-bold"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar ao Painel
            </button>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
              Eixo {eixo!.numero}: {eixo!.nome}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
              Acompanhamento das 5 fases estratégicas na escola <span className="font-semibold text-slate-500 dark:text-slate-400">{schoolName}</span>
            </p>
          </div>
        </div>

        {/* Grid containing the 5 Phases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MEG_FASES.map(f => {
            const metrics = faseMetrics[f.id] || { percent: 0, status: 'Não Iniciado', completed: 0, total: 0 };
            
            let statusBadgeColor = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/30 dark:text-slate-500 dark:border-slate-700/50';
            let StatusIcon = HelpCircle;
            
            if (metrics.status === 'Concluído') {
              statusBadgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';
              StatusIcon = CheckCircle;
            } else if (metrics.status === 'Em Andamento') {
              statusBadgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400';
              StatusIcon = AlertTriangle;
            }

            return (
              <button
                key={f.id}
                onClick={() => router.push(`/${schoolSlug}/pedagogico/${eixoSlug}/${f.slug}`)}
                className="w-full text-left p-5 rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.99] transition-all duration-300 flex flex-col justify-between gap-5 shadow-sm hover:shadow-md group relative overflow-hidden"
                title={`Acessar fase ${f.numero}: ${f.nome}`}
              >
                {/* Header with Title and Status Badge */}
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider font-mono">
                      Fase {f.numero}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-snug group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      {f.nome}
                    </h4>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[10px] font-bold shrink-0 ${statusBadgeColor}`}>
                    <StatusIcon className="w-3 h-3" />
                    {metrics.status}
                  </span>
                </div>

                {/* Progress Summary and Bar */}
                <div className="space-y-2 w-full pt-3 border-t border-slate-100 dark:border-slate-800/30">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
                    <span>Evidências validadas</span>
                    <span className="font-bold font-mono text-slate-600 dark:text-slate-300">
                      {metrics.completed} de {metrics.total}
                    </span>
                  </div>
                  <ProgressBar value={metrics.percent} size="sm" showText={false} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
