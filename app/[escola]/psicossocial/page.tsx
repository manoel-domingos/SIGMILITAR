'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { psicossocialService } from '@/lib/psicossocial-service';
import { Ocorrencia, FichaNotificacao, AgendaPreventiva } from '@/lib/data';
import { StatusBadge, ViolenciaTagList, VIOLENCIA_LABELS } from '@/components/PsicossocialComponents';
import Link from 'next/link';
import { 
  Heart, AlertTriangle, FileText, Calendar, 
  Activity, Users, Loader2, ArrowRight, Plus, 
  FileEdit, ClipboardList, Info
} from 'lucide-react';

export default function PsicossocialDashboard() {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;

  const { activeSchoolContext, isAuthRestored, contextSchools } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    ocorrencias: Ocorrencia[];
    fichasNotificacao: FichaNotificacao[];
    agendaPreventiva: AgendaPreventiva[];
  }>({
    ocorrencias: [],
    fichasNotificacao: [],
    agendaPreventiva: [],
  });

  const currentSchool = contextSchools.find(s => s.id === activeSchoolContext);
  const schoolName = currentSchool?.name || 'EECM';

  useEffect(() => {
    if (!isAuthRestored) return;

    async function loadData() {
      try {
        setLoading(true);
        setError('');
        const res = await psicossocialService.fetchAll(activeSchoolContext);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do painel.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeSchoolContext, isAuthRestored]);

  // Calculations for dashboard
  const totalAbertas = data.ocorrencias.filter(o => o.status === 'aberto').length;
  const emAcompanhamento = data.ocorrencias.filter(o => o.status === 'em_acompanhamento').length;
  
  // Fichas notificadas this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const fichasEsteMes = data.fichasNotificacao.filter(f => {
    const d = new Date(f.data_notificacao + 'T00:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Planned preventive actions
  const acoesPlanejadas = data.agendaPreventiva.filter(p => p.status === 'planejado').length;

  // Chart stats: Occurrences by type of violence (last 30 days)
  const statsByViolencia = React.useMemo(() => {
    const map: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    data.ocorrencias.forEach(o => {
      const oDate = new Date(o.data_notificacao + 'T00:00:00');
      if (oDate >= thirtyDaysAgo) {
        o.tipos_violencia.forEach(t => {
          map[t] = (map[t] || 0) + 1;
        });
      }
    });

    return Object.entries(map)
      .map(([tipo, count]) => ({
        label: VIOLENCIA_LABELS[tipo] || tipo,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [data.ocorrencias]);

  const recentOcorrencias = data.ocorrencias.slice(0, 5);

  if (!isAuthRestored || loading) {
    return (
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-pulse">
        <div className="h-40 w-full bg-slate-200 dark:bg-slate-800/50 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-in fade-in duration-300">
      
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600/90 via-teal-600/95 to-emerald-700 p-4 sm:py-5 sm:px-6 text-white shadow-xl border border-emerald-500/20 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            <Heart className="w-4 h-4 text-rose-300" />
            NÚCLEO DE MEDIAÇÃO ESCOLAR — SEDUC-MT
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Módulo Psicossocial
            </h1>
            <p className="text-sm sm:text-base text-emerald-100 font-light mt-1">
              Acompanhamento protetivo, ações preventivas e direcionamento frente às violências. Unidade:
              <span className="font-semibold text-white ml-1">{schoolName}</span>
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
          <Link
            href={`/${schoolSlug}/psicossocial/ficai`}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow transition flex items-center justify-center gap-2 active:scale-95 border border-white/20"
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            Painel FICAI
          </Link>
          <Link
            href={`/${schoolSlug}/psicossocial/ocorrencias/nova`}
            className="bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow transition flex items-center justify-center gap-2 active:scale-95 border border-white/20"
          >
            <Plus className="w-4 h-4" />
            Nova Ocorrência
          </Link>
          <Link
            href={`/${schoolSlug}/psicossocial/notificacoes/nova`}
            className="bg-emerald-500 text-white hover:bg-emerald-400 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow transition flex items-center justify-center gap-2 active:scale-95 border border-emerald-400/20"
          >
            <Plus className="w-4 h-4" />
            Nova Ficha Notificação
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              Ocorrências Abertas
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
              {totalAbertas}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              Em Acompanhamento
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
              {emAcompanhamento}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              Notificações (Mês)
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
              {fichasEsteMes}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              Ações Preventivas
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
              {acoesPlanejadas}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Recent Occurrences */}
        <div className="lg:col-span-2 space-y-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              Ocorrências Recentes
            </h2>
            <Link 
              href={`/${schoolSlug}/psicossocial/ocorrencias`}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 hover:underline transition"
            >
              Ver Todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentOcorrencias.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                <Info className="w-6 h-6 mx-auto mb-2 text-slate-350" />
                Nenhuma ocorrência registrada.
              </div>
            ) : (
              recentOcorrencias.map(o => {
                const studentsList = o.estudantes.map(e => e.nome).join(', ') || 'Nenhum informado';
                return (
                  <div key={o.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(o.data_notificacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <StatusBadge status={o.status} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                        {studentsList}
                      </h4>
                      <ViolenciaTagList tipos={o.tipos_violencia} />
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Link
                        href={`/${schoolSlug}/psicossocial/casos/${o.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition"
                      >
                        Ver Acompanhamento
                      </Link>
                      <Link
                        href={`/${schoolSlug}/psicossocial/ocorrencias/${o.id}/editar`}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
                        title="Editar Ocorrência"
                      >
                        <FileEdit className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Violent Types statistics */}
        <div className="space-y-5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" />
              Tipos de Violência (30 dias)
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Top 5 violências notificadas no período.</p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            {statsByViolencia.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                <Info className="w-6 h-6 mx-auto mb-2 text-slate-350" />
                Sem registros nos últimos 30 dias.
              </div>
            ) : (
              statsByViolencia.map((stat, idx) => {
                const maxCount = statsByViolencia[0].count;
                const widthPercent = (stat.count / maxCount) * 100;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span className="truncate pr-4">{stat.label}</span>
                      <span className="font-mono">{stat.count}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
