// app/[escola]/pedagogico/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { MEG_EIXOS, MEG_TOTAIS, processosByEixo, getMegClassificacao } from '@/lib/meg';
import EixoCard from '@/components/meg/EixoCard';
import ProgressBar from '@/components/meg/ProgressBar';
import MegRadarChart from '@/components/meg/MegRadarChart';
import MegBarChart from '@/components/meg/MegBarChart';
import { supabase } from '@/lib/supabase';
import {
  GraduationCap, Award, ClipboardCheck, AlertTriangle,
  TrendingUp, BookOpen, BarChart2
} from 'lucide-react';
import Link from 'next/link';
import { getDbSchoolId } from '@/lib/useTenantConfig';
import AppShell from '@/components/AppShell';

interface AvaliacaoAnual {
  eixo_id: string;
  dimensao: string;
  pontuacao_obtida: number;
  pontuacao_maxima: number;
  percentual: number;
}

interface ChecklistItem {
  evidencia_id: string;
  status: string;
}

export default function PedagogicoDashboard() {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;

  const { isAuthRestored, contextSchools } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [baseline2025, setBaseline2025] = useState<AvaliacaoAnual[]>([]);
  const [checklistAtual, setChecklistAtual] = useState<ChecklistItem[]>([]);
  const [resultadosAtual, setResultadosAtual] = useState<AvaliacaoAnual[]>([]);

  const resolvedSchoolId = getDbSchoolId(schoolSlug);
  const anoAtual = new Date().getFullYear();

  const currentSchool = contextSchools.find(s => s.id === resolvedSchoolId);
  const schoolName = currentSchool?.name || 'EECM';

  useEffect(() => {
    if (!isAuthRestored) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [baselineRes, checklistRes, resultadosRes] = await Promise.all([
          supabase
            .from('meg_avaliacoes_anuais')
            .select('eixo_id, dimensao, pontuacao_obtida, pontuacao_maxima, percentual')
            .eq('school_id', resolvedSchoolId)
            .eq('ano', 2025),
          supabase
            .from('meg_checklist')
            .select('evidencia_id, status')
            .eq('school_id', resolvedSchoolId)
            .eq('ano', anoAtual),
          supabase
            .from('meg_avaliacao_resultados')
            .select('eixo_id, pontuacao_obtida, pontuacao_maxima, percentual')
            .eq('school_id', resolvedSchoolId)
            .gte('data_avaliacao', `${anoAtual}-01-01`)
            .lte('data_avaliacao', `${anoAtual}-12-31`),
        ]);

        setBaseline2025((baselineRes.data || []) as AvaliacaoAnual[]);
        setChecklistAtual(checklistRes.data || []);
        setResultadosAtual((resultadosRes.data || []) as AvaliacaoAnual[]);
      } catch (err) {
        console.error('Erro ao carregar dados MEG:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [resolvedSchoolId, isAuthRestored, anoAtual]);

  // Por eixo: processos e resultado, 2025 e atual
  const eixoMetrics = useMemo(() => {
    return MEG_EIXOS.map(eixo => {
      const proc2025 = baseline2025.find(b => b.eixo_id === eixo.id && b.dimensao === 'processos');
      const res2025 = baseline2025.find(b => b.eixo_id === eixo.id && b.dimensao === 'resultado');

      // Processos do ano atual — % de conclusão × maxProcessos
      const criterios = processosByEixo(eixo.id);
      const total = criterios.length;
      let completedPts = 0;
      let maxPts = 0;
      criterios.forEach(c => {
        maxPts += c.pesoMax;
        const check = checklistAtual.find(ch => ch.evidencia_id === c.id);
        if (check?.status === 'concluido') completedPts += c.pesoMax;
        else if (check?.status === 'em_andamento') completedPts += c.pesoMax * 0.5;
      });
      const procAtualPts = parseFloat(completedPts.toFixed(2));
      const procAtualPct = maxPts > 0 ? (completedPts / maxPts) * 100 : 0;

      // Resultado atual (vistoria)
      const resAtual = resultadosAtual.find(r => r.eixo_id === eixo.id);

      return {
        eixo,
        proc2025: proc2025?.pontuacao_obtida,
        res2025: res2025?.pontuacao_obtida,
        procAtualPts,
        procAtualPct,
        resAtualPts: resAtual?.pontuacao_obtida,
        total2025: proc2025 && res2025
          ? parseFloat((proc2025.pontuacao_obtida + res2025.pontuacao_obtida).toFixed(2))
          : undefined,
        totalAtual: parseFloat((completedPts + (resAtual?.pontuacao_obtida ?? 0)).toFixed(2)),
      };
    });
  }, [baseline2025, checklistAtual, resultadosAtual]);

  const globalMetrics = useMemo(() => {
    const totalAtual = eixoMetrics.reduce((s, e) => s + e.totalAtual, 0);
    const totalMaxima = MEG_TOTAIS.maxTotal;
    const pctAtual = parseFloat(((totalAtual / totalMaxima) * 100).toFixed(1));

    const total2025 = eixoMetrics.every(e => e.total2025 !== undefined)
      ? parseFloat(eixoMetrics.reduce((s, e) => s + (e.total2025 ?? 0), 0).toFixed(2))
      : undefined;

    const concluidos = checklistAtual.filter(c => c.status === 'concluido').length;
    const totalEvidencias = MEG_EIXOS.reduce((s, e) => s + processosByEixo(e.id).length, 0);

    return { totalAtual, totalMaxima, pctAtual, total2025, concluidos, totalEvidencias };
  }, [eixoMetrics, checklistAtual]);

  const classificacao = getMegClassificacao(globalMetrics.totalAtual);

  const has2025 = baseline2025.length > 0;

  const radarData = eixoMetrics.map(e => ({
    eixoId: e.eixo.id,
    meta: e.eixo.maxProcessos,
    baseline2025: e.proc2025,
    atual: e.procAtualPts,
  }));

  const barData = eixoMetrics.map(e => ({
    eixoId: e.eixo.id,
    processos2025: e.proc2025,
    resultado2025: e.res2025,
    processosAtual: e.procAtualPts,
    resultadoAtual: e.resAtualPts,
  }));

  if (!isAuthRestored || loading) {
    return (
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-pulse">
        <div className="h-40 w-full bg-slate-200 dark:bg-slate-800/50 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-in fade-in duration-300">

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-blue-700 p-6 sm:p-8 text-white shadow-lg border border-blue-500/20 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10 space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              <GraduationCap className="w-4 h-4 text-cyan-300" />
              MEG EDUCAÇÃO — SEDUC-MT {anoAtual}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Gestão Pedagógica
            </h1>
            <p className="text-sm text-blue-100 font-light">
              Modelo de Excelência em Gestão •
              <span className="font-semibold text-white ml-1">{schoolName}</span>
            </p>
            {has2025 && globalMetrics.total2025 !== undefined && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="bg-white/15 px-3 py-1 rounded-full text-xs font-bold">
                  2025 (oficial): {globalMetrics.total2025.toFixed(2)} / {MEG_TOTAIS.maxTotal} pts
                  ({((globalMetrics.total2025 / MEG_TOTAIS.maxTotal) * 100).toFixed(1)}%)
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-2xl border text-xs font-black ${classificacao.color}`}>
                  {getMegClassificacao(globalMetrics.total2025).label}
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/${schoolSlug}/pedagogico/oscar`}
            className="relative z-10 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 px-5 py-3 rounded-2xl text-sm font-extrabold shadow-lg transition flex items-center justify-center gap-2 shrink-0 self-start md:self-auto border border-white/20"
          >
            <Award className="w-4 h-4 text-amber-500" />
            Oscar da Educação 🏆
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><Award className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Conformidade Atual</p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">{globalMetrics.pctAtual}%</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><ClipboardCheck className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Evidências Concluídas</p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                {globalMetrics.concluidos}/{globalMetrics.totalEvidencias}
              </p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Nota Máxima (Meta)</p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">{MEG_TOTAIS.maxTotal} pts</p>
            </div>
          </div>
        </div>

        {/* Barra geral */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/40 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                {globalMetrics.totalAtual.toFixed(2)}
              </span>
              <span className="ml-2 text-sm font-bold text-slate-500">/ {MEG_TOTAIS.maxTotal} pts</span>
            </div>
            <span className="text-xs text-slate-400 font-mono font-semibold">
              {globalMetrics.pctAtual}% conformidade
            </span>
          </div>
          <div className="h-3.5 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-700 bg-blue-500"
              style={{ width: `${Math.min(globalMetrics.pctAtual, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/30">
            {eixoMetrics.map(e => {
              const pct = Math.round(e.procAtualPct);
              const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div key={e.eixo.id} className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-semibold">Eixo {e.eixo.numero}</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 font-mono">{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráficos recharts */}
        {(has2025 || eixoMetrics.some(e => e.procAtualPts > 0)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-100 dark:border-slate-700/40 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500">Radar — Processos por Eixo</h3>
              </div>
              <MegRadarChart data={radarData} altura={280} />
            </div>
            <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-100 dark:border-slate-700/40 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500">Barras — 2025 vs Atual</h3>
              </div>
              <MegBarChart data={barData} altura={280} />
            </div>
          </div>
        )}

        {/* Grid de eixos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              Eixos MEG — {anoAtual}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eixoMetrics.map(e => (
              <EixoCard
                key={e.eixo.id}
                eixo={e.eixo}
                progressoAtual={e.procAtualPct}
                notaProcessos2025={e.proc2025}
                notaResultado2025={e.res2025}
                notaProcessosAtual={e.procAtualPts}
                notaResultadoAtual={e.resAtualPts}
                onClick={() => router.push(`/${schoolSlug}/pedagogico/${e.eixo.slug}`)}
              />
            ))}
          </div>
        </div>

        {/* Empty state para escolas sem baseline */}
        {!has2025 && (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Sem avaliação MEG 2025 registrada para esta escola
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              O comparativo com 2025 aparecerá quando a avaliação oficial for importada.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
