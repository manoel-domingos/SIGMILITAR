// app/[escola]/pedagogico/[eixo]/[fase]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { MEG_EIXOS, MEG_FASES, MEG_EVIDENCIAS } from '@/lib/meg-data';
import EvidenciaItem from '@/components/meg/EvidenciaItem';
import ProgressBar from '@/components/meg/ProgressBar';
import { supabase } from '@/lib/supabase';
import { 
  ChevronRight, Calendar, ArrowLeft, Check, X,
  GraduationCap, ClipboardCheck, Award, Info
} from 'lucide-react';
import Link from 'next/link';

export default function FasePage() {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;
  const eixoSlug = params.eixo as string;
  const faseSlug = params.fase as string;

  const { 
    activeSchoolContext, 
    currentUserRole, 
    user, 
    isAuthRestored,
    contextSchools
  } = useAppContext();

  const [loading, setLoading] = useState<boolean>(true);
  const [checklistData, setChecklistData] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // Resolve Axis and Phase
  const eixo = MEG_EIXOS.find(e => e.slug === eixoSlug);
  const fase = MEG_FASES.find(f => f.slug === faseSlug);

  // Mapped school name
  const currentSchool = contextSchools.find(s => s.id === activeSchoolContext);
  const schoolName = currentSchool?.name || 'EECM';

  // Filter static evidences belonging to this eixo and fase
  const evidencesList = MEG_EVIDENCIAS.filter(
    ev => ev.eixoId === (eixo?.id || '') && ev.faseId === (fase?.id || '')
  );

  // Fetch school checklist records
  const fetchChecklist = async () => {
    try {
      if (!activeSchoolContext) return;
      const { data, error } = await supabase
        .from('meg_checklist')
        .select('*')
        .eq('school_id', activeSchoolContext);

      if (error) throw error;
      setChecklistData(data || []);
    } catch (err) {
      console.error('Error fetching checklist items:', err);
    }
  };

  useEffect(() => {
    if (!isAuthRestored || !eixo || !fase) return;

    async function initFetch() {
      setLoading(true);
      await fetchChecklist();
      setLoading(false);
    }

    initFetch();
  }, [activeSchoolContext, isAuthRestored, eixo, fase]);

  // Determine read-only state based on approved roles: admin_global, GESTOR, and COORD are allowed to write/edit
  const isReadonly = 
    currentUserRole !== 'admin_global' && 
    currentUserRole !== 'GESTOR' && 
    currentUserRole !== 'COORD';

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    // Refresh local data dynamically to ensure progress bars sync immediately
    fetchChecklist();
    setTimeout(() => setToast(null), 3500);
  };

  // Calculate local progress for this phase
  const totalEvidences = evidencesList.length;
  const completedEvidences = evidencesList.filter(ev => {
    const check = checklistData.find(c => c.evidencia_id === ev.id);
    return check && check.status === 'concluido';
  }).length;
  const phaseProgress = totalEvidences > 0 ? (completedEvidences / totalEvidences) * 100 : 0;

  // Invalid Guard
  if (isAuthRestored && (!eixo || !fase)) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-rose-500">Página não encontrada</h2>
        <p className="text-slate-500">O eixo ou fase solicitada não existe nas diretrizes do MEG Educação.</p>
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
        <div className="h-5 w-72 bg-slate-200 dark:bg-slate-800/50 rounded" />
        {/* Title Skeleton */}
        <div className="h-10 w-96 bg-slate-200 dark:bg-slate-800/50 rounded-lg" />
        {/* Progress Bar Skeleton */}
        <div className="h-16 w-full bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
        {/* Items Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-in fade-in duration-300">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 dark:text-slate-500 flex-wrap">
        <Link href={`/${schoolSlug}/pedagogico`} className="hover:text-blue-500 transition-colors">
          Gestão Pedagógica
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/${schoolSlug}/pedagogico/${eixoSlug}`} className="hover:text-blue-500 transition-colors">
          Eixo {eixo!.numero}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
          Fase {fase!.numero}
        </span>
      </div>

      {/* Header section with titles and navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/40 pb-6">
        <div className="space-y-2">
          <button
            onClick={() => router.push(`/${schoolSlug}/pedagogico/${eixoSlug}`)}
            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline font-bold"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar ao Eixo
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
            Fase {fase!.numero}: {fase!.nome}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Preenchimento de evidências e upload de documentos regulamentares da escola: 
            <span className="font-semibold text-slate-500 dark:text-slate-400 ml-1">{schoolName}</span>
          </p>
        </div>
      </div>

      {/* Progress tracking banner */}
      <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              Progresso da Fase
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {completedEvidences} de {totalEvidences} evidências entregues
            </p>
          </div>
        </div>
        <div className="w-full sm:w-80">
          <ProgressBar value={phaseProgress} size="sm" showText={true} />
        </div>
      </div>

      {/* Evidences list */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Award className="w-4 h-4" />
            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              Lista de Evidências Regulatórias
            </h3>
          </div>
          {isReadonly && (
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
              <Info className="w-3 h-3" />
              Somente Leitura
            </div>
          )}
        </div>

        {evidencesList.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
            Nenhuma evidência cadastrada para esta fase.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {evidencesList.map(ev => {
              const check = checklistData.find(c => c.evidencia_id === ev.id);
              return (
                <EvidenciaItem
                  key={ev.id}
                  evidencia={ev}
                  checklist={check}
                  schoolId={activeSchoolContext}
                  eixoNome={eixo!.nome}
                  faseNome={fase!.nome}
                  currentUser={user}
                  readonly={isReadonly}
                  onSaveSuccess={(msg) => showToast(msg, 'ok')}
                  onSaveError={(msg) => showToast(msg, 'err')}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Toast Alert Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 text-xs sm:text-sm px-4 py-3.5 rounded-xl shadow-xl border flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'err' 
            ? 'bg-rose-600 border-rose-500/20 text-white' 
            : 'bg-slate-900 border-slate-800 text-white dark:bg-slate-850 dark:border-slate-800'
        }`}>
          {toast.type === 'ok' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <X className="w-4 h-4 text-white shrink-0" />
          )} 
          <span className="font-semibold">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
