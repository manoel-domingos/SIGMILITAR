// app/[escola]/pedagogico/[eixo]/[fase]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { MEG_EIXOS, MEG_FASES, MEG_EVIDENCIAS, MEG_AXIS_CONFIGS } from '@/lib/meg-data';
import EvidenciaItem from '@/components/meg/EvidenciaItem';
import ProgressBar from '@/components/meg/ProgressBar';
import { supabase } from '@/lib/supabase';
import { 
  ChevronRight, Calendar, ArrowLeft, Check, X,
  GraduationCap, ClipboardCheck, Award, Info,
  Columns, PanelRight, ExternalLink, FolderOpen
} from 'lucide-react';
import Link from 'next/link';
import { getDbSchoolId } from '@/lib/useTenantConfig';
import AppShell from '@/components/AppShell';

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
  
  // Dual-layout mode states
  const [layoutMode, setLayoutMode] = useState<'split' | 'drawer'>('split');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const resolvedSchoolId = getDbSchoolId(schoolSlug);

  // Resolve Axis and Phase
  const rawEixo = MEG_EIXOS.find(e => e.slug === eixoSlug);
  const eixo = rawEixo ? {
    ...rawEixo,
    nome: MEG_AXIS_CONFIGS[rawEixo.id]?.nome || rawEixo.nome,
    numero: MEG_AXIS_CONFIGS[rawEixo.id]?.numero || rawEixo.numero
  } : null;
  const fase = MEG_FASES.find(f => f.slug === faseSlug);

  // Mapped school name
  const currentSchool = contextSchools.find(s => s.id === resolvedSchoolId);
  const schoolName = currentSchool?.name || 'EECM';

  // Select the Drive Folder ID dynamically depending on the active tenant
  const driveFolderId = 
    resolvedSchoolId === 'joaobatista' ? '1fasylhHJEZcy4zCRPFyy7rPwFQhyttvA' :
    resolvedSchoolId === 'heliodoro' ? '1fasylhHJEZcy4zCRPFyy7rPwFQhyttvA' : 
    '1fasylhHJEZcy4zCRPFyy7rPwFQhyttvA'; // Fallback

  // Filter static evidences belonging to this eixo and fase
  const evidencesList = MEG_EVIDENCIAS.filter(
    ev => ev.eixoId === (eixo?.id || '') && ev.faseId === (fase?.id || '')
  );

  // Fetch school checklist records
  const fetchChecklist = async () => {
    try {
      if (!resolvedSchoolId) return;
      const { data, error } = await supabase
        .from('meg_checklist')
        .select('*')
        .eq('school_id', resolvedSchoolId);

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
  }, [resolvedSchoolId, isAuthRestored, eixo?.id, fase?.id]);

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
    <AppShell>
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

        {/* Header section with layout selector */}
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

          {/* Premium Layout Toggle Button (Split vs Panel) */}
          <div className="flex items-center bg-white/60 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-full p-0.5 gap-0.5 shadow-sm self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setLayoutMode('split')}
              title="Lado a Lado — visualização integrada"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                layoutMode === 'split' 
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Lado a Lado
            </button>
            <button
              type="button"
              onClick={() => { setLayoutMode('drawer'); setIsDrawerOpen(false); }}
              title="Painel Lateral — visualização sob demanda"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                layoutMode === 'drawer' 
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <PanelRight className="w-3.5 h-3.5" />
              Painel Lateral
            </button>
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

        {/* Dual Layout Rendering */}
        {layoutMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Evidences list (Col span 5) */}
            <div className="lg:col-span-5 space-y-6">
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
                        schoolId={resolvedSchoolId}
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

            {/* Right Column: Google Drive Iframe (Col span 7) */}
            <div className="lg:col-span-7 bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 rounded-3xl p-5 shadow-sm sticky top-8 flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Repositório Google Drive
                  </span>
                </div>
                <a
                  href={`https://drive.google.com/drive/folders/${driveFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 font-bold hover:underline flex items-center gap-1 transition-colors"
                >
                  Abrir no Drive <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <iframe
                src={`https://drive.google.com/embeddedfolderview?id=${driveFolderId}#list`}
                className="w-full border-0 rounded-2xl shadow-inner bg-slate-50 dark:bg-slate-900/50"
                style={{ height: '720px' }}
                title="Painel Integrado do Google Drive"
                allow="autoplay"
              />
            </div>

          </div>
        ) : (
          // Layout 2: Full Width List
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Award className="w-4 h-4" />
                <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  Lista de Evidências Regulatórias
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20 px-3.5 py-1.5 rounded-xl border border-blue-500/20 text-xs font-extrabold transition-all active:scale-95 shadow-sm"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Abrir Pasta do Drive
                </button>
                {isReadonly && (
                  <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
                    <Info className="w-3 h-3" />
                    Somente Leitura
                  </div>
                )}
              </div>
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
                      schoolId={resolvedSchoolId}
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
        )}

        {/* Dynamic sliding side Drawer for Google Drive */}
        {layoutMode === 'drawer' && isDrawerOpen && (
          <div 
            className="fixed inset-0 z-[9995] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setIsDrawerOpen(false); }}
          >
            <div className="w-full sm:w-[50vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Painel Lateral</span>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight mt-0.5">Arquivos da Pasta</h3>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://drive.google.com/drive/folders/${driveFolderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 font-bold hover:underline flex items-center gap-1 transition-colors"
                  >
                    Abrir no Drive <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                    title="Fechar painel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <iframe
                src={`https://drive.google.com/embeddedfolderview?id=${driveFolderId}#list`}
                className="w-full border-0 rounded-2xl shadow-inner bg-slate-50 dark:bg-slate-900/50 flex-1"
                title="Painel Lateral do Google Drive"
                allow="autoplay"
              />
            </div>
          </div>
        )}

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
    </AppShell>
  );
}
