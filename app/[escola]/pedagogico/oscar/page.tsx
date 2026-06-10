// app/[escola]/pedagogico/oscar/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  MEG_EIXOS, MEG_TOTAIS, processosByEixo,
  getMegClassificacao,
} from '@/lib/meg';
import MegProgressRing from '@/components/meg/MegProgressRing';
import ResultadoEstruturalChecklist from '@/components/meg/ResultadoEstruturalChecklist';
import ProgressBar from '@/components/meg/ProgressBar';
import {
  ChevronRight, ArrowLeft, X,
  Award, Info, Clipboard, ListTodo
} from 'lucide-react';
import Link from 'next/link';
import { getDbSchoolId } from '@/lib/useTenantConfig';
import AppShell from '@/components/AppShell';

export default function OscarPage() {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;

  const { isAuthRestored, currentUserRole, contextSchools } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [checklistAtual, setChecklistAtual] = useState<any[]>([]);
  const [resultadosAtual, setResultadosAtual] = useState<any[]>([]);
  const [baseline2025, setBaseline2025] = useState<any[]>([]);
  const [activeEixoId, setActiveEixoId] = useState<string | null>(null);

  const resolvedSchoolId = getDbSchoolId(schoolSlug);
  const anoAtual = new Date().getFullYear();
  const currentSchool = contextSchools.find(s => s.id === resolvedSchoolId);
  const schoolName = currentSchool?.name || 'EECM';

  const isReadonly =
    currentUserRole !== 'admin_global' &&
    currentUserRole !== 'GESTOR' &&
    currentUserRole !== 'COORD';

  const fetchAllData = async () => {
    if (!resolvedSchoolId) return;
    setLoading(true);
    try {
      const [chkRes, resRes, baseRes] = await Promise.all([
        supabase
          .from('meg_checklist')
          .select('evidencia_id, status')
          .eq('school_id', resolvedSchoolId)
          .eq('ano', anoAtual),
        supabase
          .from('meg_avaliacao_resultados')
          .select('eixo_id, pontuacao_obtida, pontuacao_maxima')
          .eq('school_id', resolvedSchoolId)
          .gte('data_avaliacao', `${anoAtual}-01-01`)
          .lte('data_avaliacao', `${anoAtual}-12-31`),
        supabase
          .from('meg_avaliacoes_anuais')
          .select('eixo_id, dimensao, pontuacao_obtida')
          .eq('school_id', resolvedSchoolId)
          .eq('ano', 2025),
      ]);
      setChecklistAtual(chkRes.data || []);
      setResultadosAtual(resRes.data || []);
      setBaseline2025(baseRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados Oscar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthRestored) return;
    fetchAllData();
  }, [resolvedSchoolId, isAuthRestored]);

  const scoreMetrics = useMemo(() => {
    const eixoBreakdown: Record<string, {
      id: string; nome: string; numero: number;
      processosObtida: number; processosMaxima: number;
      resultadosObtida: number; resultadosMaxima: number;
      totalObtida: number; totalMaxima: number; percentual: number;
      proc2025?: number; res2025?: number; total2025?: number;
    }> = {};

    let grandProcObtida = 0; let grandProcMaxima = 0;
    let grandResObtida = 0; let grandResMaxima = 0;
    let grandProc2025 = 0; let grandRes2025 = 0;
    let has2025 = false;

    MEG_EIXOS.forEach(e => {
      const criterios = processosByEixo(e.id);
      const maxProcessos = e.maxProcessos;
      const maxResultados = e.maxResultado;

      // Processos do ano atual (ponderado por pesoMax)
      let procObtida = 0;
      criterios.forEach(c => {
        const check = checklistAtual.find(ch => ch.evidencia_id === c.id);
        if (check?.status === 'concluido') procObtida += c.pesoMax;
        else if (check?.status === 'em_andamento') procObtida += c.pesoMax * 0.5;
      });
      procObtida = parseFloat(procObtida.toFixed(2));

      // Resultado atual (vistoria)
      const resRecord = resultadosAtual.find(r => r.eixo_id === e.id);
      const resObtida = resRecord ? parseFloat(resRecord.pontuacao_obtida) : 0;

      // Baseline 2025 da escola (não de outra)
      const proc2025Record = baseline2025.find(b => b.eixo_id === e.id && b.dimensao === 'processos');
      const res2025Record = baseline2025.find(b => b.eixo_id === e.id && b.dimensao === 'resultado');
      const proc2025 = proc2025Record ? parseFloat(proc2025Record.pontuacao_obtida) : undefined;
      const res2025 = res2025Record ? parseFloat(res2025Record.pontuacao_obtida) : undefined;
      const total2025 = proc2025 !== undefined && res2025 !== undefined
        ? parseFloat((proc2025 + res2025).toFixed(2)) : undefined;

      if (proc2025 !== undefined) { grandProc2025 += proc2025; has2025 = true; }
      if (res2025 !== undefined) grandRes2025 += res2025;

      const totalObtida = parseFloat((procObtida + resObtida).toFixed(2));
      const totalMaxima = maxProcessos + maxResultados;
      const percentual = parseFloat(((totalObtida / totalMaxima) * 100).toFixed(1));

      eixoBreakdown[e.id] = {
        id: e.id, nome: e.nome, numero: e.numero,
        processosObtida: procObtida, processosMaxima: maxProcessos,
        resultadosObtida: resObtida, resultadosMaxima: maxResultados,
        totalObtida, totalMaxima, percentual,
        proc2025, res2025, total2025,
      };

      grandProcObtida += procObtida; grandProcMaxima += maxProcessos;
      grandResObtida += resObtida; grandResMaxima += maxResultados;
    });

    const totalObtida = parseFloat((grandProcObtida + grandResObtida).toFixed(2));
    const totalMaxima = MEG_TOTAIS.maxTotal; // 1010
    const percentual = parseFloat(((totalObtida / totalMaxima) * 100).toFixed(1));

    const total2025 = has2025
      ? parseFloat((grandProc2025 + grandRes2025).toFixed(2))
      : undefined;

    const classificacao = getMegClassificacao(totalObtida);

    return {
      eixoBreakdown,
      processosObtida: parseFloat(grandProcObtida.toFixed(2)),
      processosMaxima: grandProcMaxima,
      resultadosObtida: parseFloat(grandResObtida.toFixed(2)),
      resultadosMaxima: grandResMaxima,
      totalObtida, totalMaxima, percentual,
      total2025, has2025,
      classificacao,
    };
  }, [checklistAtual, resultadosAtual, baseline2025]);

  if (!isAuthRestored || loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 min-h-screen pb-24 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/50 rounded" />
        <div className="h-28 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    );
  }

  const { classificacao } = scoreMetrics;

  return (
    <AppShell>
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-in fade-in duration-300">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 dark:text-slate-500">
          <Link href={`/${schoolSlug}/pedagogico`} className="hover:text-blue-500 transition-colors">
            Gestão Pedagógica
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">Oscar da Educação</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/40 pb-6">
          <div className="space-y-2">
            <button
              onClick={() => router.push(`/${schoolSlug}/pedagogico`)}
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline font-bold"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar ao Painel
            </button>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
              🏆 Oscar da Educação — MEG
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
              Consolidado Processos ({MEG_TOTAIS.maxProcessos} pts) + Resultado ({MEG_TOTAIS.maxResultado} pts)
              = <strong className="text-slate-600 dark:text-slate-300">{MEG_TOTAIS.maxTotal} pts</strong> •{' '}
              <span className="font-semibold">{schoolName}</span>
            </p>
          </div>
        </div>

        {/* Main cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-1 p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 backdrop-blur-xl flex flex-col items-center justify-center gap-6 shadow-sm">
            <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-center">
              Pontuação {anoAtual}
            </h3>
            <MegProgressRing
              value={scoreMetrics.totalObtida}
              max={scoreMetrics.totalMaxima}
              size={220}
              strokeWidth={16}
              title={`${scoreMetrics.totalObtida.toFixed(1)} / ${MEG_TOTAIS.maxTotal}`}
              sub={`${scoreMetrics.percentual}%`}
            />
            <div className="text-center space-y-2">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-2xl border text-sm font-black tracking-wide ${classificacao.color}`}>
                {classificacao.label}
              </span>
              {scoreMetrics.has2025 && scoreMetrics.total2025 !== undefined && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  2025 (oficial): {scoreMetrics.total2025.toFixed(2)} pts
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 backdrop-blur-xl flex flex-col justify-between gap-6 shadow-sm">
            <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              Dimensões — {anoAtual}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-blue-500">
                  <Clipboard className="w-5 h-5" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">Processos</h4>
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {scoreMetrics.processosObtida}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ {scoreMetrics.processosMaxima} pts</span>
                </p>
                <ProgressBar value={(scoreMetrics.processosObtida / scoreMetrics.processosMaxima) * 100} size="sm" showText />
              </div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-500">
                  <ListTodo className="w-5 h-5" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">Resultado Estrutural</h4>
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {scoreMetrics.resultadosObtida}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ {scoreMetrics.resultadosMaxima} pts</span>
                </p>
                <ProgressBar value={scoreMetrics.resultadosMaxima > 0 ? (scoreMetrics.resultadosObtida / scoreMetrics.resultadosMaxima) * 100 : 0} size="sm" showText />
              </div>
            </div>
            <div className="p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong className="text-blue-600 dark:text-blue-400">Processos ({MEG_TOTAIS.maxProcessos} pts)</strong> — critérios documentais por eixo.{' '}
                <strong className="text-amber-600 dark:text-amber-400">Resultado Estrutural ({MEG_TOTAIS.maxResultado} pts)</strong> — vistoria in loco de ambientes.{' '}
                Total máximo: <strong>{MEG_TOTAIS.maxTotal} pts</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Tabela por eixo */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              Desempenho por Eixo
            </h3>
            {isReadonly && (
              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 text-slate-500 px-2.5 py-0.5 rounded text-[10px] font-bold">
                Visualização
              </span>
            )}
          </div>

          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="p-4 pl-6">Eixo</th>
                    <th className="p-4 text-center">Proc. {anoAtual}</th>
                    <th className="p-4 text-center">Res. {anoAtual}</th>
                    <th className="p-4 text-center">Total {anoAtual}</th>
                    {scoreMetrics.has2025 && <th className="p-4 text-center">Total 2025</th>}
                    {scoreMetrics.has2025 && <th className="p-4 text-center">Gap</th>}
                    <th className="p-4">Conformidade</th>
                    <th className="p-4 pr-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                  {MEG_EIXOS.map(e => {
                    const bd = scoreMetrics.eixoBreakdown[e.id];
                    if (!bd) return null;
                    const gap = bd.total2025 !== undefined
                      ? parseFloat((bd.totalObtida - bd.total2025).toFixed(2))
                      : undefined;

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{bd.numero}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{bd.nome}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-400">
                          {bd.processosObtida} <span className="text-[10px] text-slate-400">/{bd.processosMaxima}</span>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-400">
                          {bd.resultadosObtida} <span className="text-[10px] text-slate-400">/{bd.resultadosMaxima}</span>
                        </td>
                        <td className="p-4 text-center font-mono font-extrabold text-slate-800 dark:text-slate-100">
                          {bd.totalObtida} <span className="text-[10px] text-slate-400 font-normal">/{bd.totalMaxima}</span>
                        </td>
                        {scoreMetrics.has2025 && (
                          <td className="p-4 text-center font-mono text-indigo-600 dark:text-indigo-400">
                            {bd.total2025 !== undefined ? bd.total2025 : '—'}
                          </td>
                        )}
                        {scoreMetrics.has2025 && (
                          <td className="p-4 text-center font-mono font-extrabold">
                            {gap !== undefined ? (
                              <span className={gap >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                                {gap >= 0 ? '+' : ''}{gap}
                              </span>
                            ) : '—'}
                          </td>
                        )}
                        <td className="p-4 w-60">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                              <span>Conformidade</span>
                              <span>{bd.percentual}%</span>
                            </div>
                            <ProgressBar value={bd.percentual} size="sm" showText={false} />
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => setActiveEixoId(e.id)}
                            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-xl transition shadow-sm active:scale-95 ${
                              isReadonly
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
                            }`}
                          >
                            {isReadonly ? 'Ver Avaliação' : 'Avaliar Resultado'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-4 p-4 md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {MEG_EIXOS.map(e => {
                const bd = scoreMetrics.eixoBreakdown[e.id];
                if (!bd) return null;
                return (
                  <div key={e.id} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold font-mono text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg shrink-0">{bd.numero}</span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{bd.nome}</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Proc', val: `${bd.processosObtida}/${bd.processosMaxima}` },
                        { label: 'Res', val: `${bd.resultadosObtida}/${bd.resultadosMaxima}` },
                        { label: 'Total', val: `${bd.totalObtida}/${bd.totalMaxima}` },
                      ].map(item => (
                        <div key={item.label} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                          <p className="text-[9px] uppercase font-bold text-slate-400">{item.label}</p>
                          <p className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">{item.val}</p>
                        </div>
                      ))}
                    </div>
                    <ProgressBar value={bd.percentual} size="sm" showText />
                    <button
                      onClick={() => setActiveEixoId(e.id)}
                      className={`w-full py-2 text-[10px] font-extrabold rounded-xl transition active:scale-95 ${
                        isReadonly
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {isReadonly ? 'Ver Avaliação' : 'Avaliar Resultado'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Resultado Estrutural */}
        {activeEixoId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
            onMouseDown={e => { if (e.target === e.currentTarget) setActiveEixoId(null); }}
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Avaliação in loco</span>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mt-0.5">
                    {MEG_EIXOS.find(e => e.id === activeEixoId)?.nome}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveEixoId(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <ResultadoEstruturalChecklist
                  eixoId={activeEixoId}
                  schoolId={resolvedSchoolId}
                  readonly={isReadonly}
                  ano={anoAtual}
                  onScoreChange={() => fetchAllData()}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
