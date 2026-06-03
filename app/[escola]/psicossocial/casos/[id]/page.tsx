'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { psicossocialService } from '@/lib/psicossocial-service';
import { Ocorrencia, Acompanhamento } from '@/lib/data';
import { 
  StatusBadge, TimelineAcompanhamento, ViolenciaTagList, 
  VIOLENCIA_LABELS 
} from '@/components/PsicossocialComponents';
import Link from 'next/link';
import { 
  ArrowLeft, FileText, Plus, Save, Loader2, Info, CheckCircle, AlertTriangle 
} from 'lucide-react';
import AppShell from '@/components/AppShell';


export default function CasoAcompanhamentoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const schoolSlug = params.escola as string;

  const { activeSchoolContext, isAuthRestored, user } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([]);

  // Add Entry Form state
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [tipoAcao, setTipoAcao] = useState('acolhimento');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState('');

  // Status Change Confirmation Modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Ocorrencia['status']>('aberto');

  useEffect(() => {
    if (!isAuthRestored || !id) return;

    async function loadData() {
      try {
        setLoading(true);
        setError('');
        const res = await psicossocialService.fetchAll(activeSchoolContext);
        const o = res.ocorrencias.find(item => item.id === id);
        
        if (!o) {
          setError('Ocorrência não encontrada.');
          return;
        }

        setOcorrencia(o);
        setAcompanhamentos(res.acompanhamentos.filter(a => a.ocorrencia_id === id));
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do caso.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, activeSchoolContext, isAuthRestored]);

  // Handle Add Entry
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    try {
      setSaving(true);
      setError('');
      
      const payload: Omit<Acompanhamento, 'id'> = {
        school_id: activeSchoolContext,
        ocorrencia_id: id,
        data_registro: dataRegistro,
        descricao: descricao.trim(),
        tipo_acao: tipoAcao,
        responsavel: responsavel.trim()
      };

      const created = await psicossocialService.addAcompanhamento(payload, activeSchoolContext, user?.id);
      
      // Update locally
      setAcompanhamentos(prev => [created, ...prev]);
      setDescricao('');
      setResponsavel('');
      setSuccess('Acompanhamento registrado com sucesso!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar acompanhamento.');
    } finally {
      setSaving(false);
    }
  };

  // Status Change click trigger
  const handleStatusChangeClick = (status: Ocorrencia['status']) => {
    if (status === 'encerrado') {
      setPendingStatus('encerrado');
      setShowStatusModal(true);
    } else {
      updateStatus(status);
    }
  };

  // Actual status update service call
  const updateStatus = async (status: Ocorrencia['status']) => {
    if (!ocorrencia) return;

    try {
      setLoading(true);
      setError('');
      const updated = await psicossocialService.updateOcorrencia(ocorrencia.id, { status });
      setOcorrencia(updated);
      setShowStatusModal(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !ocorrencia) {
    return (
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800/50 rounded-xl" />
        <div className="h-48 w-full bg-slate-200 dark:bg-slate-800/50 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!ocorrencia) return null;

  const studentsList = ocorrencia.estudantes.map(e => `${e.nome} (${e.serie} ${e.turma})`).join(', ');  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-8 min-h-screen pb-24 animate-in fade-in duration-300">
        
        {/* Header back button */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
              Acompanhamento de Caso Psicossocial
            </h1>
          </div>
          
          <Link
            href={`/${schoolSlug}/psicossocial/notificacoes/nova?ocorrencia_id=${ocorrencia.id}`}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-2 active:scale-95 border border-emerald-400/20"
          >
            <FileText className="w-4 h-4" />
            Gerar Ficha de Notificação
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Case Summary Panel (Read-only) */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
              <span>Ocorrência em: <strong>{new Date(ocorrencia.data_notificacao + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></span>
              <span>•</span>
              <span>Unidade: <strong>{ocorrencia.escola_nome}</strong></span>
            </div>
            
            {/* Status buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => handleStatusChangeClick('aberto')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition ${ocorrencia.status === 'aberto' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Aberto
              </button>
              <button
                onClick={() => handleStatusChangeClick('em_acompanhamento')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition ${ocorrencia.status === 'em_acompanhamento' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Acompanhamento
              </button>
              <button
                onClick={() => handleStatusChangeClick('encerrado')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition ${ocorrencia.status === 'encerrado' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Encerrado
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estudante(s) Envolvido(s)</h4>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{studentsList}</p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tipos de Violência Relacionados</h4>
                <div className="mt-1.5">
                  <ViolenciaTagList tipos={ocorrencia.tipos_violencia} />
                </div>
              </div>
              {ocorrencia.procedimento_executado && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Procedimento de Intervenção Inicial</h4>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize mt-0.5">
                    {(ocorrencia.procedimento_executado || '').replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Relato Oficial</h4>
              <p className="text-xs text-slate-600 dark:text-slate-355 leading-relaxed whitespace-pre-line italic">
                &quot;{ocorrencia.relato}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Timeline & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Timeline (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
              Linha do Tempo de Acolhimento
            </h3>
            <TimelineAcompanhamento entries={acompanhamentos} />
          </div>

          {/* Add Entry Form (Right col) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
              Registrar Ação / Acolhimento
            </h3>

            <form onSubmit={handleAddEntry} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
              {/* Data */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data do Registro</label>
                <input 
                  type="date"
                  value={dataRegistro}
                  onChange={(e) => setDataRegistro(e.target.value)}
                  className="glass-input w-full text-xs"
                  required
                />
              </div>

              {/* Tipo de Acao */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Ação</label>
                <select
                  value={tipoAcao}
                  onChange={(e) => setTipoAcao(e.target.value)}
                  className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                >
                  <option value="acolhimento">Acolhimento Individual</option>
                  <option value="encaminhamento">Encaminhamento Externo</option>
                  <option value="retorno">Retorno / Feedbacks</option>
                  <option value="reuniao">Reunião com Colegiado</option>
                  <option value="outro">Outro Procedimento</option>
                </select>
              </div>

              {/* Descricao */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição Detalhada *</label>
                <textarea 
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="glass-input w-full min-h-[100px] text-xs leading-relaxed py-1.5 px-3"
                  placeholder="Descreva as deliberações, o estado emocional do estudante, o contato com psicólogos, conselho tutelar etc."
                  required
                />
              </div>

              {/* Responsavel */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Profissional Responsável</label>
                <input 
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="glass-input w-full text-xs"
                  placeholder="Nome do profissional psicossocial..."
                />
              </div>

              <button
                type="submit"
                disabled={saving || !descricao.trim()}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Salvar Acolhimento
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* Confirmation Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowStatusModal(false); }}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Encerrar Caso Protetivo?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Confirma o encerramento deste caso? Esta ação pode ser desfeita pelo Diretor.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-2 px-3 text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-850 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition"
                >
                  Voltar
                </button>
                <button
                  onClick={() => updateStatus(pendingStatus)}
                  className="flex-1 py-2 px-3 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
