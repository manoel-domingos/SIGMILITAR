'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { psicossocialService } from '@/lib/psicossocial-service';
import { FichaNotificacao } from '@/lib/data';
import { VIOLACAO_LABELS } from '@/components/PsicossocialComponents';
import Link from 'next/link';
import { 
  Plus, Calendar, Trash2, FileText, Info, ChevronRight, X, Heart
} from 'lucide-react';

export default function FichasLista() {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;

  const { activeSchoolContext, isAuthRestored } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fichas, setFichas] = useState<FichaNotificacao[]>([]);

  useEffect(() => {
    if (!isAuthRestored) return;

    async function loadFichas() {
      try {
        setLoading(true);
        setError('');
        const res = await psicossocialService.fetchAll(activeSchoolContext);
        setFichas(res.fichasNotificacao);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar fichas de notificação.');
      } finally {
        setLoading(false);
      }
    }

    loadFichas();
  }, [activeSchoolContext, isAuthRestored]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta Ficha de Notificação permanente?')) return;
    try {
      await psicossocialService.deleteFichaNotificacao(id);
      setFichas(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir ficha.');
    }
  };

  const getViolacaoLabels = (tipos: string[]) => {
    return (tipos || []).map(t => VIOLACAO_LABELS[t] || t).join(', ');
  };

  const getDestinatariosLabels = (para: string[]) => {
    return (para || []).map(d => (d || '').replace('_', ' ')).join(', ');
  };

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
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            Fichas de Notificação de Violação de Direitos
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Notificação obrigatória de violação aos direitos da criança e do adolescente (Art. 56 ECA)</p>
        </div>
        <Link
          href={`/${schoolSlug}/psicossocial/notificacoes/nova`}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Ficha de Notificação
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main List Content */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        
        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {fichas.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              <Info className="w-6 h-6 mx-auto mb-2 text-slate-350" />
              Nenhuma ficha registrada.
            </div>
          ) : (
            fichas.map(f => (
              <div key={f.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    {new Date(f.data_notificacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Estudante</h4>
                  <p className="text-sm font-extrabold text-slate-850 dark:text-slate-150">{f.nome_estudante}</p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Violação</h4>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{getViolacaoLabels(f.tipo_violacao)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Enviada Para</h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">{getDestinatariosLabels(f.ficha_enviada_para || [])}</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-850">
                  <Link
                    href={`/${schoolSlug}/psicossocial/notificacoes/${f.id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 transition flex items-center gap-1"
                  >
                    Ver / Imprimir
                  </Link>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 font-bold font-mono">Data</th>
              <th className="py-3.5 px-4">Estudante</th>
              <th className="py-3.5 px-4">Tipo de Violação</th>
              <th className="py-3.5 px-4">Enviada Para</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
            {fichas.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <Info className="w-6 h-6 mx-auto mb-2 text-slate-350" />
                  Nenhuma ficha registrada.
                </td>
              </tr>
            ) : (
              fichas.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-slate-500">
                    {new Date(f.data_notificacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-4 px-4 font-extrabold text-slate-850 dark:text-slate-200">
                    {f.nome_estudante}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-350 max-w-[200px] truncate" title={getViolacaoLabels(f.tipo_violacao)}>
                    {getViolacaoLabels(f.tipo_violacao)}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-550 dark:text-slate-400 capitalize max-w-[200px] truncate" title={getDestinatariosLabels(f.ficha_enviada_para || [])}>
                    {getDestinatariosLabels(f.ficha_enviada_para || [])}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${schoolSlug}/psicossocial/notificacoes/${f.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 transition flex items-center gap-1"
                      >
                        Ver / Imprimir <ChevronRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
