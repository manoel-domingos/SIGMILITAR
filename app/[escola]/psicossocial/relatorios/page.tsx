'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { psicossocialService } from '@/lib/psicossocial-service';
import { Ocorrencia, FichaNotificacao, AgendaPreventiva } from '@/lib/data';
import { StatusBadge, VIOLENCIA_LABELS, VIOLACAO_LABELS, TEMATICA_LABELS } from '@/components/PsicossocialComponents';
import { 
  Printer, Calendar, Filter, Info, FileText, BarChart, 
  ChevronRight, ArrowLeft 
} from 'lucide-react';

export default function RelatoriosPage() {
  const params = useParams();
  const schoolSlug = params.escola as string;

  const { activeSchoolContext, isAuthRestored, contextSchools } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data
  const [data, setData] = useState<{
    ocorrencias: Ocorrencia[];
    fichasNotificacao: FichaNotificacao[];
    agendaPreventiva: AgendaPreventiva[];
  }>({
    ocorrencias: [],
    fichasNotificacao: [],
    agendaPreventiva: [],
  });

  // Filter periods: defaults to this year
  const currentYear = new Date().getFullYear();
  const [dataInicio, setDataInicio] = useState(`${currentYear}-01-01`);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);

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
        setError(err.message || 'Erro ao carregar dados do relatório.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeSchoolContext, isAuthRestored]);

  // Compiled Stats filtered by date range
  const filteredData = React.useMemo(() => {
    const start = dataInicio;
    const end = dataFim;

    const occurrences = data.ocorrencias.filter(o => o.data_notificacao >= start && o.data_notificacao <= end);
    const fichas = data.fichasNotificacao.filter(f => f.data_notificacao >= start && f.data_notificacao <= end);
    const actions = data.agendaPreventiva.filter(p => {
      if (!p.data_inicio) return false;
      return p.data_inicio >= start && p.data_inicio <= end;
    });

    return { occurrences, fichas, actions };
  }, [data, dataInicio, dataFim]);

  // 1. Ocorrências por Tipo de Violência
  const violenciasStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.occurrences.forEach(o => {
      o.tipos_violencia.forEach(t => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([tipo, count]) => ({
        label: VIOLENCIA_LABELS[tipo] || tipo,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData.occurrences]);

  // 2. Casos Protetivos por Status
  const statusStats = React.useMemo(() => {
    let aberto = 0, emAcompanhamento = 0, encerrado = 0;
    filteredData.occurrences.forEach(o => {
      if (o.status === 'aberto') aberto++;
      else if (o.status === 'em_acompanhamento') emAcompanhamento++;
      else if (o.status === 'encerrado') encerrado++;
    });
    const total = filteredData.occurrences.length;
    return {
      aberto,
      emAcompanhamento,
      encerrado,
      total,
      abertoPct: total > 0 ? Math.round((aberto / total) * 100) : 0,
      emAcompanhamentoPct: total > 0 ? Math.round((emAcompanhamento / total) * 100) : 0,
      encerradoPct: total > 0 ? Math.round((encerrado / total) * 100) : 0,
    };
  }, [filteredData.occurrences]);

  // 3. Ações Preventivas por Temática
  const tematicaStats = React.useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.actions.forEach(a => {
      if (a.tematica) {
        map[a.tematica] = (map[a.tematica] || 0) + 1;
      }
    });
    return Object.entries(map).map(([tem, count]) => ({
      label: TEMATICA_LABELS[tem] || tem,
      count
    })).sort((a, b) => b.count - a.count);
  }, [filteredData.actions]);

  if (!isAuthRestored || loading) {
    return (
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800/50 rounded-xl" />
        <div className="h-96 w-full bg-slate-200 dark:bg-slate-800/50 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 min-h-screen pb-24 animate-in fade-in duration-300">
      
      {/* Header and Print Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart className="w-6 h-6 text-emerald-500" />
            Relatórios e Estatísticas Psicossociais
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Exportação consolidade de ocorrências, notificações e cronogramas preventivos</p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          Exportar Relatório (PDF)
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 print:hidden">
          {error}
        </div>
      )}

      {/* Date Filter Panel */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-emerald-500" />
          Período do Relatório
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Data Início</label>
            <input 
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="glass-input w-full text-xs py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Data Fim</label>
            <input 
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="glass-input w-full text-xs py-2 px-3"
            />
          </div>
        </div>
      </div>

      {/* Compiled Reports Grid view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        
        {/* Ocorrencias por tipo */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2 flex items-center gap-2">
            Ocorrências por Tipo de Violência
          </h3>
          <div className="space-y-3">
            {violenciasStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhum registro no período.</p>
            ) : (
              violenciasStats.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-650 dark:text-slate-350">
                  <span className="truncate pr-4">{item.label}</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Casos por Status */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2">
            Casos Protetivos por Status
          </h3>
          <div className="space-y-4">
            {statusStats.total === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhum registro no período.</p>
            ) : (
              <div className="space-y-3.5">
                {/* Aberto */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-blue-600">Aberto</span>
                    <span className="font-mono">{statusStats.aberto} ({statusStats.abertoPct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${statusStats.abertoPct}%` }} />
                  </div>
                </div>

                {/* Acompanhamento */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-amber-600">Acompanhamento</span>
                    <span className="font-mono">{statusStats.emAcompanhamento} ({statusStats.emAcompanhamentoPct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${statusStats.emAcompanhamentoPct}%` }} />
                  </div>
                </div>

                {/* Encerrado */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-600">Encerrado</span>
                    <span className="font-mono">{statusStats.encerrado} ({statusStats.encerradoPct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${statusStats.encerradoPct}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fichas notificadas */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2">
            Fichas de Notificação Emitidas
          </h3>
          <div className="space-y-3">
            {filteredData.fichas.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma notificação emitida.</p>
            ) : (
              filteredData.fichas.map(f => (
                <div key={f.id} className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-850/60 pb-1.5">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{f.nome_estudante}</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">
                      Enviada em: {new Date(f.data_notificacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                    ECA Notified
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Acoes Preventivas por tematica */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2">
            Mapa de Ações Preventivas por Temática
          </h3>
          <div className="space-y-3">
            {tematicaStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma ação agendada.</p>
            ) : (
              tematicaStats.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-650 dark:text-slate-350">
                  <span>{item.label}</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">{item.count} realizadas/planejadas</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ================== PRINT RELATÓRIO A4 ================== */}
      <div className="hidden print:block w-full max-w-[800px] mx-auto bg-white text-black p-8 font-serif leading-relaxed text-xs">
        {/* Header */}
        <div className="text-center space-y-1.5 border-b-2 border-black pb-4 mb-6">
          <h2 className="text-sm font-bold uppercase">Estado de Mato Grosso</h2>
          <h2 className="text-sm font-bold uppercase">Secretaria de Estado de Educação — SEDUC</h2>
          <h3 className="text-xs font-semibold uppercase">{schoolName}</h3>
          <h4 className="text-[10px] italic">Relatório Geral Consolidated — Módulo Psicossocial</h4>
          <p className="text-[9px]">Período de Referência: {new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Section 1 */}
        <div className="border border-black p-4 mb-4 space-y-3">
          <h4 className="font-bold border-b border-black pb-1 mb-1 text-[10px] uppercase">1. Conformidade Geral de Ocorrências</h4>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="border-r border-black">
              <p><strong>Total Abertas</strong></p>
              <p className="text-base font-bold font-mono mt-1">{statusStats.aberto}</p>
            </div>
            <div className="border-r border-black">
              <p><strong>Em Acompanhamento</strong></p>
              <p className="text-base font-bold font-mono mt-1">{statusStats.emAcompanhamento}</p>
            </div>
            <div>
              <p><strong>Total Encerradas</strong></p>
              <p className="text-base font-bold font-mono mt-1">{statusStats.encerrado}</p>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="border border-black p-4 mb-4 space-y-3">
          <h4 className="font-bold border-b border-black pb-1 mb-1.5 text-[10px] uppercase">2. Ocorrências por Tipo de Violência</h4>
          <table className="w-full text-left text-[9px]">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="py-1">Violência</th>
                <th className="py-1 text-right">Ocorrências</th>
              </tr>
            </thead>
            <tbody>
              {violenciasStats.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-1">{item.label}</td>
                  <td className="py-1 text-right font-mono">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3 */}
        <div className="border border-black p-4 mb-4 space-y-3">
          <h4 className="font-bold border-b border-black pb-1 mb-1.5 text-[10px] uppercase">3. Notificações ECA Emitidas no Período</h4>
          <table className="w-full text-left text-[9px]">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="py-1">Estudante</th>
                <th className="py-1">Motivo / Tipo Violação</th>
                <th className="py-1 text-right">Data de Emissão</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.fichas.map(f => (
                <tr key={f.id} className="border-b border-slate-100">
                  <td className="py-1 font-bold">{f.nome_estudante}</td>
                  <td className="py-1">{(f.tipo_violacao || []).map(v => VIOLACAO_LABELS[v] || v).join(', ')}</td>
                  <td className="py-1 text-right font-mono">{new Date(f.data_notificacao + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4 */}
        <div className="border border-black p-4 mb-6 space-y-3">
          <h4 className="font-bold border-b border-black pb-1 mb-1.5 text-[10px] uppercase">4. Ações Preventivas Mapeadas</h4>
          <table className="w-full text-left text-[9px]">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="py-1">Tema da Ação</th>
                <th className="py-1">Eixo Rotinas</th>
                <th className="py-1 text-right">Data Agendamento</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.actions.map(a => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="py-1">{a.titulo}</td>
                  <td className="py-1 capitalize">{(a.eixo || '').replace('_', ' ')}</td>
                  <td className="py-1 text-right font-mono">{a.data_inicio ? new Date(a.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature */}
        <div className="pt-12 text-center text-[10px] max-w-[300px] mx-auto">
          <div className="border-t border-black pt-2">
            <p><strong>Direção Geral Escolar</strong></p>
            <p className="text-[8px] uppercase">{schoolName}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
