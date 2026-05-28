'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { psicossocialService } from '@/lib/psicossocial-service';
import { Ocorrencia } from '@/lib/data';
import { StatusBadge, ViolenciaTagList, VIOLENCIA_LABELS } from '@/components/PsicossocialComponents';
import Link from 'next/link';
import { 
  Plus, Search, Calendar, Filter, 
  Trash2, FileEdit, Eye, EyeOff, FileText, ClipboardList, Info, ChevronRight, X
} from 'lucide-react';

export default function OcorrenciasLista() {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;

  const { activeSchoolContext, isAuthRestored } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  
  // Filters state
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [violenciaFilter, setViolenciaFilter] = useState('');

  useEffect(() => {
    if (!isAuthRestored) return;

    async function loadOcorrencias() {
      try {
        setLoading(true);
        setError('');
        const res = await psicossocialService.fetchAll(activeSchoolContext);
        setOcorrencias(res.ocorrencias);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar ocorrências.');
      } finally {
        setLoading(false);
      }
    }

    loadOcorrencias();
  }, [activeSchoolContext, isAuthRestored]);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ocorrência permanente?')) return;
    try {
      await psicossocialService.deleteOcorrencia(id);
      setOcorrencias(prev => prev.filter(o => o.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir ocorrência.');
    }
  };

  // Filtered occurrences logic
  const filteredOcorrencias = React.useMemo(() => {
    return ocorrencias.filter(o => {
      // Date filter
      if (dataInicio && o.data_notificacao < dataInicio) return false;
      if (dataFim && o.data_notificacao > dataFim) return false;

      // Status filter
      if (statusFilter && o.status !== statusFilter) return false;

      // Type of violence filter
      if (violenciaFilter && !o.tipos_violencia.includes(violenciaFilter)) return false;

      return true;
    });
  }, [ocorrencias, dataInicio, dataFim, statusFilter, violenciaFilter]);

  if (!isAuthRestored || loading) {
    return (
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800/50 rounded-xl" />
        <div className="h-20 w-full bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
        <div className="h-96 w-full bg-slate-200 dark:bg-slate-800/50 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 min-h-screen pb-24 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-500" />
            Registro de Ocorrências Psicossociais
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Direcionamentos e registros oficiais do Núcleo de Mediação Escolar</p>
        </div>
        <Link
          href={`/${schoolSlug}/psicossocial/ocorrencias/nova`}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Ocorrência
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Premium Filters Panel */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-500" />
          Filtros de Busca
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Data Inicio */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Data Início</label>
            <input 
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="glass-input w-full py-2 px-3 text-xs"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Data Fim</label>
            <input 
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="glass-input w-full py-2 px-3 text-xs"
            />
          </div>

          {/* Tipo Violencia */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Tipo de Violência</label>
            <select
              value={violenciaFilter}
              onChange={(e) => setViolenciaFilter(e.target.value)}
              className="glass-input w-full py-2 px-3 text-xs bg-transparent dark:bg-slate-900"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(VIOLENCIA_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input w-full py-2 px-3 text-xs bg-transparent dark:bg-slate-900"
            >
              <option value="">Todos os status</option>
              <option value="aberto">Aberto</option>
              <option value="em_acompanhamento">Acompanhamento</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(dataInicio || dataFim || statusFilter || violenciaFilter) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setDataInicio('');
                setDataFim('');
                setStatusFilter('');
                setViolenciaFilter('');
              }}
              className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 active:scale-95 transition"
            >
              <X className="w-3.5 h-3.5" />
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Main List Content */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredOcorrencias.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              <Info className="w-6 h-6 mx-auto mb-2 text-slate-350" />
              Nenhuma ocorrência encontrada.
            </div>
          ) : (
            filteredOcorrencias.map(o => {
              const studentsList = o.estudantes.map(e => `${e.nome} (${e.serie} ${e.turma})`).join(', ');
              return (
                <div key={o.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                      {new Date(o.data_notificacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-0.5">Estudantes</h4>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{studentsList || 'Nenhum'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-1">Violência</h4>
                    <ViolenciaTagList tipos={o.tipos_violencia} />
                  </div>
                  {o.procedimento_executado && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 mb-0.5">Procedimento</h4>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-350">{o.procedimento_executado}</p>
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-850">
                    <Link
                      href={`/${schoolSlug}/psicossocial/casos/${o.id}`}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 transition"
                    >
                      Acompanhamento
                    </Link>
                    <Link
                      href={`/${schoolSlug}/psicossocial/ocorrencias/${o.id}/editar`}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
                    >
                      <FileEdit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 font-bold font-mono">Data</th>
              <th className="py-3.5 px-4">Estudantes</th>
              <th className="py-3.5 px-4">Tipos de Violência</th>
              <th className="py-3.5 px-4">Procedimento</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
            {filteredOcorrencias.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <Info className="w-6 h-6 mx-auto mb-2 text-slate-350" />
                  Nenhuma ocorrência encontrada.
                </td>
              </tr>
            ) : (
              filteredOcorrencias.map(o => {
                const studentsList = o.estudantes.map(e => `${e.nome} (${e.serie} ${e.turma})`).join(', ');
                return (
                  <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-500">
                      {new Date(o.data_notificacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-800 dark:text-slate-250 max-w-[200px] truncate" title={studentsList}>
                      {studentsList}
                    </td>
                    <td className="py-4 px-4">
                      <ViolenciaTagList tipos={o.tipos_violencia} />
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={o.procedimento_executado}>
                      {o.procedimento_executado || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/${schoolSlug}/psicossocial/casos/${o.id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 transition flex items-center gap-1"
                        >
                          Acompanhamento <ChevronRight className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/${schoolSlug}/psicossocial/ocorrencias/${o.id}/editar`}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white rounded-lg transition"
                          title="Editar"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(o.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
