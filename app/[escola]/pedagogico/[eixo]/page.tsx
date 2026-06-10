// app/[escola]/pedagogico/[eixo]/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import {
  getEixoBySlug, processosByEixo, resultadosByEixo,
  MEG_EIXOS, MEG_TOTAIS,
} from '@/lib/meg';
import ProcessosChecklist from '@/components/meg/ProcessosChecklist';
import ResultadoEstruturalChecklist from '@/components/meg/ResultadoEstruturalChecklist';
import ProgressBar from '@/components/meg/ProgressBar';
import { supabase } from '@/lib/supabase';
import { ChevronRight, ArrowLeft, FileText, ClipboardList, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getDbSchoolId } from '@/lib/useTenantConfig';
import AppShell from '@/components/AppShell';

type Aba = 'processos' | 'resultado';

export default function EixoPage() {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;
  const eixoSlug = params.eixo as string;

  const { isAuthRestored, currentUserRole, contextSchools } = useAppContext();
  const [aba, setAba] = useState<Aba>('processos');
  const [baseline2025, setBaseline2025] = useState<{
    processos?: { pontuacao_obtida: number; respostas: Record<string, any> };
    resultado?: { pontuacao_obtida: number };
  }>({});
  const [loadingBaseline, setLoadingBaseline] = useState(true);
  const [procScore, setProcScore] = useState({ obtida: 0, maxima: 0 });
  const [resScore, setResScore] = useState({ obtida: 0, maxima: 0 });

  const resolvedSchoolId = getDbSchoolId(schoolSlug);
  const anoAtual = new Date().getFullYear();
  const eixo = getEixoBySlug(eixoSlug);

  const currentSchool = contextSchools.find(s => s.id === resolvedSchoolId);
  const schoolName = currentSchool?.name || 'EECM';

  const isReadonly =
    currentUserRole !== 'admin_global' &&
    currentUserRole !== 'GESTOR' &&
    currentUserRole !== 'COORD';

  useEffect(() => {
    if (!isAuthRestored || !eixo) return;

    async function fetchBaseline() {
      setLoadingBaseline(true);
      try {
        const { data, error } = await supabase
          .from('meg_avaliacoes_anuais')
          .select('dimensao, pontuacao_obtida, respostas')
          .eq('school_id', resolvedSchoolId)
          .eq('ano', 2025)
          .eq('eixo_id', eixo.id);

        if (error) throw error;

        const map: typeof baseline2025 = {};
        (data || []).forEach((row: any) => {
          if (row.dimensao === 'processos') {
            map.processos = { pontuacao_obtida: parseFloat(row.pontuacao_obtida), respostas: row.respostas || {} };
          } else if (row.dimensao === 'resultado') {
            map.resultado = { pontuacao_obtida: parseFloat(row.pontuacao_obtida) };
          }
        });
        setBaseline2025(map);
      } finally {
        setLoadingBaseline(false);
      }
    }

    fetchBaseline();
  }, [resolvedSchoolId, isAuthRestored, eixo?.id]);

  const handleProcScore = useCallback((obtida: number, maxima: number) => {
    setProcScore({ obtida, maxima });
  }, []);

  const handleResScore = useCallback((obtida: number, maxima: number) => {
    setResScore({ obtida, maxima });
  }, []);

  // Baseline respostas de processos — mapeado por criterioId
  const baseline2025Processos = useMemo(() => {
    if (!baseline2025.processos) return undefined;
    const map: Record<string, { status: string; nota: number }> = {};
    const respostas = baseline2025.processos.respostas || {};
    Object.entries(respostas).forEach(([id, val]: [string, any]) => {
      if (val) map[id] = { status: val.status, nota: val.nota ?? 0 };
    });
    return map;
  }, [baseline2025.processos]);

  const meta = eixo ? eixo.maxProcessos + eixo.maxResultado : 0;
  const totalAtual = parseFloat((procScore.obtida + resScore.obtida).toFixed(2));
  const pctAtual = meta > 0 ? parseFloat(((totalAtual / meta) * 100).toFixed(1)) : 0;

  if (isAuthRestored && !eixo) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-rose-500">Eixo não encontrado</h2>
        <p className="text-slate-500">O eixo "{eixoSlug}" não existe no MEG SEDUC-MT.</p>
        <button
          onClick={() => router.push(`/${schoolSlug}/pedagogico`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm"
        >
          Voltar ao Painel
        </button>
      </div>
    );
  }

  if (!isAuthRestored) {
    return (
      <div className="p-4 sm:p-8 space-y-6 min-h-screen pb-24 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/50 rounded" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-8 space-y-6 min-h-screen pb-24 animate-in fade-in duration-300">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 dark:text-slate-500">
          <Link href={`/${schoolSlug}/pedagogico`} className="hover:text-blue-500 transition-colors">
            Gestão Pedagógica
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {eixo!.nome}
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/40 pb-6">
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
              <span className="font-semibold">{schoolName}</span>
              {isReadonly && (
                <span className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
                  Visualização
                </span>
              )}
            </p>
          </div>

          {/* Score summary */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="text-right space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Meta</p>
              <p className="text-base font-extrabold font-mono text-blue-600 dark:text-blue-400">{meta} pts</p>
            </div>
            {baseline2025.processos && (
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">2025</p>
                <p className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {((baseline2025.processos?.pontuacao_obtida ?? 0) + (baseline2025.resultado?.pontuacao_obtida ?? 0)).toFixed(2)} pts
                </p>
              </div>
            )}
            <div className="text-right space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{anoAtual}</p>
              <p className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{totalAtual} pts</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Conformidade</p>
              <p className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-100">{pctAtual}%</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>Conformidade Geral do Eixo {anoAtual}</span>
            <span>{pctAtual}% de {meta} pts</span>
          </div>
          <ProgressBar value={pctAtual} size="sm" showText={false} />
        </div>

        {/* Info 2025 vs atual */}
        {baseline2025.processos && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Processos 2025', val: baseline2025.processos?.pontuacao_obtida?.toFixed(2), max: eixo!.maxProcessos, color: 'indigo' },
              { label: 'Resultado 2025', val: baseline2025.resultado?.pontuacao_obtida?.toFixed(2), max: eixo!.maxResultado, color: 'indigo' },
              { label: `Processos ${anoAtual}`, val: procScore.obtida.toFixed(2), max: eixo!.maxProcessos, color: 'emerald' },
              { label: `Resultado ${anoAtual}`, val: resScore.obtida.toFixed(2), max: eixo!.maxResultado, color: 'emerald' },
            ].map(item => (
              <div key={item.label} className={`p-3 rounded-xl border ${
                item.color === 'indigo'
                  ? 'bg-indigo-500/8 border-indigo-500/20 dark:bg-indigo-500/10'
                  : 'bg-emerald-500/8 border-emerald-500/20 dark:bg-emerald-500/10'
              }`}>
                <p className={`text-[9px] uppercase font-bold tracking-wider ${
                  item.color === 'indigo' ? 'text-indigo-500' : 'text-emerald-600 dark:text-emerald-400'
                }`}>{item.label}</p>
                <p className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {item.val ?? '—'}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">/{item.max}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setAba('processos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              aba === 'processos'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Processos / Documentos
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
              aba === 'processos' ? 'bg-blue-500/15 text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              {processosByEixo(eixo!.id).length}
            </span>
          </button>
          <button
            onClick={() => setAba('resultado')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              aba === 'resultado'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Resultado Estrutural
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
              aba === 'resultado' ? 'bg-amber-500/15 text-amber-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              {resultadosByEixo(eixo!.id).length}
            </span>
          </button>
        </div>

        {/* Conteúdo da aba */}
        {aba === 'processos' ? (
          <ProcessosChecklist
            eixoId={eixo!.id}
            schoolId={resolvedSchoolId}
            readonly={isReadonly}
            ano={anoAtual}
            baseline2025={baseline2025Processos}
            onScoreChange={handleProcScore}
          />
        ) : (
          <ResultadoEstruturalChecklist
            eixoId={eixo!.id}
            schoolId={resolvedSchoolId}
            readonly={isReadonly}
            ano={anoAtual}
            baseline2025Resultado={baseline2025.resultado?.pontuacao_obtida}
            onScoreChange={handleResScore}
          />
        )}
      </div>
    </AppShell>
  );
}
