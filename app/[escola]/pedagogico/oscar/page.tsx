// app/[escola]/pedagogico/oscar/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { MEG_EIXOS, MEG_FASES, MEG_EVIDENCIAS, MEG_AXIS_CONFIGS } from '@/lib/meg-data';
import MegProgressRing from '@/components/meg/MegProgressRing';
import MegChecklist from '@/components/meg/MegChecklist';
import ProgressBar from '@/components/meg/ProgressBar';
import { 
  ChevronRight, Calendar, ArrowLeft, Check, X,
  GraduationCap, ClipboardCheck, Award, Info, RefreshCw, Clipboard, ListTodo
} from 'lucide-react';
import Link from 'next/link';

export default function OscarPage() {
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
  const [resultadosData, setResultadosData] = useState<any[]>([]);
  
  // Modal states for conducting Hasil Evaluation
  const [activeChecklistEixo, setActiveChecklistEixo] = useState<string | null>(null);
  const [activeChecklistEixoNome, setActiveChecklistEixoNome] = useState<string>('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // Mapped school name
  const currentSchool = contextSchools.find(s => s.id === activeSchoolContext);
  const schoolName = currentSchool?.name || 'EECM';

  // Fetch checklist (processos) and avaliacoes (resultados) records
  const fetchAllData = async () => {
    try {
      if (!activeSchoolContext) return;
      setLoading(true);

      // 1. Fetch checklist items
      const { data: checks, error: err1 } = await supabase
        .from('meg_checklist')
        .select('*')
        .eq('school_id', activeSchoolContext);
      if (err1) throw err1;
      setChecklistData(checks || []);

      // 2. Fetch results evaluation records
      const { data: res, error: err2 } = await supabase
        .from('meg_avaliacao_resultados')
        .select('*')
        .eq('school_id', activeSchoolContext);
      if (err2) throw err2;
      setResultadosData(res || []);

    } catch (err) {
      console.error('Error fetching Oscar da Educação data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthRestored) return;
    fetchAllData();
  }, [activeSchoolContext, isAuthRestored]);

  const isReadonly = 
    currentUserRole !== 'admin_global' && 
    currentUserRole !== 'GESTOR' && 
    currentUserRole !== 'COORD';

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    fetchAllData(); // Refresh the numbers
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Mathematical Calculations (useMemo) ───────────────────────────────────
  const scoreMetrics = useMemo(() => {
    const eixoBreakdown: Record<string, {
      id: string;
      nome: string;
      numero: number;
      processosObtida: number;
      processosMaxima: number;
      resultadosObtida: number;
      resultadosMaxima: number;
      totalObtida: number;
      totalMaxima: number;
      percentual: number;
    }> = {};

    let grandTotalProcessosObtida = 0;
    let grandTotalProcessosMaxima = 0;
    let grandTotalResultadosObtida = 0;
    let grandTotalResultadosMaxima = 0;

    MEG_EIXOS.forEach(e => {
      const config = MEG_AXIS_CONFIGS[e.id] || {
        nome: e.nome,
        maxProcessos: 75,
        maxResultados: 110,
        numero: e.numero
      };

      // 1. Calculate Processos Score for this Eixo
      // Weight per phase: maxProcessos / 5 (since there are 5 phases)
      const maxProcessosEixo = config.maxProcessos;
      const weightPerPhase = maxProcessosEixo / 5;
      let earnedProcessosEixo = 0;

      MEG_FASES.forEach(f => {
        // Static evidences for this Eixo and Fase
        const staticEvidences = MEG_EVIDENCIAS.filter(
          ev => ev.eixoId === e.id && ev.faseId === f.id
        );
        const totalEvs = staticEvidences.length;

        if (totalEvs === 0) {
          // If no evidence is configured, count phase as full points
          earnedProcessosEixo += weightPerPhase;
        } else {
          const completedEvs = staticEvidences.filter(ev => {
            const check = checklistData.find(c => c.evidencia_id === ev.id);
            return check && check.status === 'concluido';
          }).length;

          earnedProcessosEixo += (completedEvs / totalEvs) * weightPerPhase;
        }
      });

      earnedProcessosEixo = parseFloat(earnedProcessosEixo.toFixed(2));

      // 2. Calculate Resultados Score for this Eixo
      // Find latest record in db for this eixo
      const resultsRecord = resultadosData.find(r => r.eixo_id === e.id);
      const earnedResultadosEixo = resultsRecord ? parseFloat(resultsRecord.pontuacao_obtida) : 0;
      const maxResultadosEixo = config.maxResultados;

      const totalObtidaEixo = parseFloat((earnedProcessosEixo + earnedResultadosEixo).toFixed(2));
      const totalMaximaEixo = maxProcessosEixo + maxResultadosEixo;
      const percentualEixo = parseFloat(((totalObtidaEixo / totalMaximaEixo) * 100).toFixed(1));

      eixoBreakdown[e.id] = {
        id: e.id,
        nome: config.nome,
        numero: config.numero,
        processosObtida: earnedProcessosEixo,
        processosMaxima: maxProcessosEixo,
        resultadosObtida: earnedResultadosEixo,
        resultadosMaxima: maxResultadosEixo,
        totalObtida: totalObtidaEixo,
        totalMaxima: totalMaximaEixo,
        percentual: percentualEixo
      };

      grandTotalProcessosObtida += earnedProcessosEixo;
      grandTotalProcessosMaxima += maxProcessosEixo;
      grandTotalResultadosObtida += earnedResultadosEixo;
      grandTotalResultadosMaxima += maxResultadosEixo;
    });

    const totalObtida = parseFloat((grandTotalProcessosObtida + grandTotalResultadosObtida).toFixed(2));
    const totalMaxima = grandTotalProcessosMaxima + grandTotalResultadosMaxima; // 1000 pts
    const percentual = totalMaxima > 0 ? parseFloat(((totalObtida / totalMaxima) * 100).toFixed(1)) : 0;

    // Classification Label
    let classification = 'Não Conforme';
    let classColor = 'text-rose-500 bg-rose-500/10 border-rose-500/25';
    if (totalObtida >= 900) {
      classification = 'Excelente 🏆';
      classColor = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400';
    } else if (totalObtida >= 700) {
      classification = 'Satisfatório 👍';
      classColor = 'text-blue-600 bg-blue-500/10 border-blue-500/30 dark:text-blue-400';
    } else if (totalObtida >= 500) {
      classification = 'Parcialmente Conforme ⚠️';
      classColor = 'text-amber-600 bg-amber-500/10 border-amber-500/30 dark:text-amber-400';
    } else if (totalObtida >= 300) {
      classification = 'Pouco Conforme 🛑';
      classColor = 'text-orange-600 bg-orange-500/10 border-orange-500/30 dark:text-orange-400';
    }

    return {
      eixoBreakdown,
      processosObtida: parseFloat(grandTotalProcessosObtida.toFixed(2)),
      processosMaxima: grandTotalProcessosMaxima,
      resultadosObtida: parseFloat(grandTotalResultadosObtida.toFixed(2)),
      resultadosMaxima: grandTotalResultadosMaxima,
      totalObtida,
      totalMaxima,
      percentual,
      classification,
      classColor
    };
  }, [checklistData, resultadosData]);

  if (!isAuthRestored || loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 min-h-screen pb-24 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/50 rounded" />
        <div className="h-28 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-in fade-in duration-300">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 dark:text-slate-500">
        <Link href={`/${schoolSlug}/pedagogico`} className="hover:text-blue-500 transition-colors">
          Gestão Pedagógica
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          Oscar da Educação
        </span>
      </div>

      {/* Header section with back button */}
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
            Consolidado da pontuação de Processos (400 pts) e Resultados (600 pts) da escola <span className="font-semibold text-slate-500 dark:text-slate-400">{schoolName}</span>
          </p>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Circular Ring Score Card */}
        <div className="lg:col-span-1 p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 backdrop-blur-xl flex flex-col items-center justify-center gap-6 shadow-sm">
          <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-center">
            Pontuação Geral Consolidada
          </h3>

          <MegProgressRing 
            value={scoreMetrics.totalObtida} 
            max={scoreMetrics.totalMaxima} 
            size={240}
            strokeWidth={18}
            title={`${Math.round(scoreMetrics.totalObtida)} / 1000`}
            sub={`${scoreMetrics.percentual}%`}
          />

          <div className="text-center space-y-2">
            <span className={`inline-flex items-center px-4 py-1.5 rounded-2xl border text-sm font-black tracking-wide leading-none ${scoreMetrics.classColor}`}>
              {scoreMetrics.classification}
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal max-w-xs mt-1">
              Classificação baseada nas diretrizes do Modelo de Excelência em Gestão (MEG Educação)
            </p>
          </div>
        </div>

        {/* Right Details Card */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 backdrop-blur-xl flex flex-col justify-between gap-6 shadow-sm">
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              Análise Dual de Dimensões
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Processos */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-blue-500 shrink-0">
                  <Clipboard className="w-5 h-5" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">Processos (Evidências)</h4>
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {scoreMetrics.processosObtida} <span className="text-xs text-slate-400 font-normal">/ {scoreMetrics.processosMaxima} pts</span>
                </p>
                <ProgressBar value={(scoreMetrics.processosObtida / scoreMetrics.processosMaxima) * 100} size="sm" showText={true} />
              </div>

              {/* Resultados */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-500 shrink-0">
                  <ListTodo className="w-5 h-5" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">Resultados (Avaliações)</h4>
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {scoreMetrics.resultadosObtida} <span className="text-xs text-slate-400 font-normal">/ {scoreMetrics.resultadosMaxima} pts</span>
                </p>
                <ProgressBar value={(scoreMetrics.resultadosObtida / scoreMetrics.resultadosMaxima) * 100} size="sm" showText={true} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Como a pontuação é formada?</span>
              A dimensão de <strong className="text-blue-600 dark:text-blue-400">Processos</strong> reflete o andamento e conclusão dos documentos/evidências ao longo das fases. A dimensão de <strong className="text-amber-600 dark:text-amber-400">Resultados</strong> é baseada em vistorias in loco na escala de Conformidade de 0 a 4.
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown per Axis Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Award className="w-4 h-4" />
            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              Desempenho Detalhado por Eixo Estratégico
            </h3>
          </div>
          {isReadonly && (
            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded text-[10px] font-bold">
              <Info className="w-3.5 h-3.5" />
              Leitura
            </span>
          )}
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Table for Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  <th className="p-4 pl-6">Nº / Eixo</th>
                  <th className="p-4 text-center">Processos (pts)</th>
                  <th className="p-4 text-center">Resultados (pts)</th>
                  <th className="p-4 text-center">Total Eixo</th>
                  <th className="p-4">Desempenho Geral Eixo</th>
                  <th className="p-4 pr-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60 text-xs font-semibold">
                {MEG_EIXOS.map(e => {
                  const bd = scoreMetrics.eixoBreakdown[e.id] || {
                    id: e.id,
                    nome: e.nome,
                    numero: e.numero,
                    processosObtida: 0,
                    processosMaxima: 75,
                    resultadosObtida: 0,
                    resultadosMaxima: 110,
                    totalObtida: 0,
                    totalMaxima: 185,
                    percentual: 0
                  };

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                            {bd.numero}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {bd.nome}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                        {bd.processosObtida} <span className="text-[10px] text-slate-400">/ {bd.processosMaxima}</span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                        {bd.resultadosObtida} <span className="text-[10px] text-slate-400">/ {bd.resultadosMaxima}</span>
                      </td>
                      <td className="p-4 text-center font-mono font-extrabold text-slate-800 dark:text-slate-100">
                        {bd.totalObtida} <span className="text-[10px] text-slate-400">/ {bd.totalMaxima}</span>
                      </td>
                      <td className="p-4 w-72">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
                            <span>Conformidade</span>
                            <span>{bd.percentual}%</span>
                          </div>
                          <ProgressBar value={bd.percentual} size="sm" showText={false} />
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => {
                            setActiveChecklistEixo(e.id);
                            setActiveChecklistEixoNome(bd.nome);
                          }}
                          className={`px-3 py-1.5 text-[10px] font-extrabold rounded-xl transition shadow-sm active:scale-95 ${
                            isReadonly
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
                          }`}
                        >
                          {isReadonly ? 'Visualizar Avaliação' : 'Avaliar Resultados'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards for Mobile */}
          <div className="flex flex-col gap-4 p-4 md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {MEG_EIXOS.map(e => {
              const bd = scoreMetrics.eixoBreakdown[e.id] || {
                id: e.id,
                nome: e.nome,
                numero: e.numero,
                processosObtida: 0,
                processosMaxima: 75,
                resultadosObtida: 0,
                resultadosMaxima: 110,
                totalObtida: 0,
                totalMaxima: 185,
                percentual: 0
              };

              return (
                <div key={e.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold font-mono text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg shrink-0">
                      {bd.numero}
                    </span>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-250 leading-snug">
                      {bd.nome}
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <p className="text-[9px] uppercase font-bold text-slate-400 leading-none">Processos</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono mt-1">
                        {bd.processosObtida}/{bd.processosMaxima}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <p className="text-[9px] uppercase font-bold text-slate-400 leading-none">Resultados</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono mt-1">
                        {bd.resultadosObtida}/{bd.resultadosMaxima}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <p className="text-[9px] uppercase font-bold text-slate-400 leading-none">Total Eixo</p>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 font-mono mt-1">
                        {bd.totalObtida}/{bd.totalMaxima}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono">
                      <span>Conformidade</span>
                      <span>{bd.percentual}%</span>
                    </div>
                    <ProgressBar value={bd.percentual} size="sm" showText={false} />
                  </div>

                  <button
                    onClick={() => {
                      setActiveChecklistEixo(e.id);
                      setActiveChecklistEixoNome(bd.nome);
                    }}
                    className={`w-full py-2 text-[10px] font-extrabold rounded-xl transition shadow-sm active:scale-95 ${
                      isReadonly
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
                    }`}
                  >
                    {isReadonly ? 'Visualizar Avaliação' : 'Avaliar Resultados'}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Results Evaluation Modal Overlay */}
      {activeChecklistEixo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveChecklistEixo(null); }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Avaliação in loco de Resultados</span>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight mt-0.5">{activeChecklistEixoNome}</h3>
              </div>
              <button 
                onClick={() => setActiveChecklistEixo(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <MegChecklist
                eixoId={activeChecklistEixo}
                schoolId={activeSchoolContext}
                readonly={isReadonly}
                onSaveSuccess={(msg) => {
                  showToast(msg, 'ok');
                  setActiveChecklistEixo(null);
                }}
                onSaveError={(msg) => {
                  showToast(msg, 'err');
                }}
              />
            </div>
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
  );
}
