'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { psicossocialService } from '@/lib/psicossocial-service';
import { AgendaPreventiva } from '@/lib/data';
import { AgendaCalendar, TEMATICA_LABELS } from '@/components/PsicossocialComponents';
import AppShell from '@/components/AppShell';
import { 
  Plus, Calendar, List, Info, Loader2, Save, X, Trash2, Edit 
} from 'lucide-react';

export default function AgendaPage() {
  const params = useParams();
  const schoolSlug = params.escola as string;

  const { activeSchoolContext, isAuthRestored, user } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<AgendaPreventiva[]>([]);

  // View state: 'lista' | 'calendario'
  const [view, setView] = useState<'lista' | 'calendario'>('lista');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'nova' | 'editar'>('nova');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tematica, setTematica] = useState('acolhimento');
  const [eixo, setEixo] = useState<'prevencao' | 'acao_intervencao' | 'pos_violencia'>('prevencao');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [periodicidade, setPeriodicidade] = useState('eventual');
  const [publicoAlvo, setPublicoAlvo] = useState('todos');
  const [status, setStatus] = useState<AgendaPreventiva['status']>('planejado');

  useEffect(() => {
    if (!isAuthRestored) return;

    async function loadEvents() {
      try {
        setLoading(true);
        setError('');
        const res = await psicossocialService.fetchAll(activeSchoolContext);
        setEvents(res.agendaPreventiva);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar agenda preventiva.');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [activeSchoolContext, isAuthRestored]);

  // Open modal for creation
  const handleNewAction = () => {
    setModalMode('nova');
    setSelectedEventId(null);
    setTitulo('');
    setDescricao('');
    setTematica('acolhimento');
    setEixo('prevencao');
    setDataInicio(new Date().toISOString().split('T')[0]);
    setDataFim(new Date().toISOString().split('T')[0]);
    setPeriodicidade('eventual');
    setPublicoAlvo('todos');
    setStatus('planejado');
    setShowModal(true);
  };

  // Open modal for editing
  const handleEditAction = (ev: AgendaPreventiva) => {
    setModalMode('editar');
    setSelectedEventId(ev.id);
    setTitulo(ev.titulo);
    setDescricao(ev.descricao || '');
    setTematica(ev.tematica || 'acolhimento');
    setEixo(ev.eixo || 'prevencao');
    setDataInicio(ev.data_inicio || '');
    setDataFim(ev.data_fim || '');
    setPeriodicidade(ev.periodicidade || 'eventual');
    setPublicoAlvo(ev.publico_alvo || 'todos');
    setStatus(ev.status || 'planejado');
    setShowModal(true);
  };

  // Delete Action
  const handleDeleteAction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir esta atividade preventiva permanente?')) return;

    try {
      setLoading(true);
      await psicossocialService.deleteAgendaPreventiva(id);
      setEvents(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir atividade.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Modal Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    try {
      setSaving(true);
      setError('');

      const payload: Omit<AgendaPreventiva, 'id'> = {
        school_id: activeSchoolContext,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        tematica,
        eixo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        periodicidade,
        publico_alvo: publicoAlvo,
        status
      };

      if (modalMode === 'editar' && selectedEventId) {
        const updated = await psicossocialService.updateAgendaPreventiva(selectedEventId, payload);
        setEvents(prev => prev.map(item => item.id === selectedEventId ? updated : item));
      } else {
        const created = await psicossocialService.addAgendaPreventiva(payload, activeSchoolContext, user?.id);
        setEvents(prev => [created, ...prev]);
      }

      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar atividade.');
    } finally {
      setSaving(false);
    }
  };

  const getEixoLabel = (ex?: string) => {
    switch (ex) {
      case 'prevencao': return 'Prevenção';
      case 'acao_intervencao': return 'Ação e Intervenção';
      case 'pos_violencia': return 'Pós-Violência';
      default: return ex;
    }
  };

  const getStatusBadge = (st?: string) => {
    switch (st) {
      case 'planejado': return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/50';
      case 'em_andamento': return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50';
      case 'realizado': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50';
      case 'cancelado': return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  if (!isAuthRestored || loading) {
    return (
      <div className="p-4 sm:p-8 space-y-8 min-h-screen pb-24 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800/50 rounded-xl" />
        <div className="h-96 w-full bg-slate-200 dark:bg-slate-800/50 rounded-3xl" />
      </div>
      return (
    <AppShell>
      <div className="p-4 sm:p-8 space-y-6 min-h-screen pb-24 animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-emerald-500" />
              Agenda de Ações Preventivas
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Planejamento e ações de mediação e convivência pacífica do Caderno II da SEDUC/MT</p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Toggle View */}
            <div className="flex items-center bg-slate-150 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setView('lista')}
                className={`p-1.5 rounded-lg transition active:scale-95 ${view === 'lista' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}
                title="Visualização em Lista"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('calendario')}
                className={`p-1.5 rounded-lg transition active:scale-95 ${view === 'calendario' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}
                title="Visualização em Calendário"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleNewAction}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Ação Preventiva
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Main Content Area */}
        {view === 'calendario' ? (
          <AgendaCalendar events={events} onSelectEvent={handleEditAction} />
        ) : (
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
            
            {/* Mobile list view */}
            <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {events.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                  <Info className="w-6 h-6 mx-auto mb-2 text-slate-350" />
                  Nenhuma ação preventiva agendada.
                </div>
              ) : (
                events.map(ev => (
                  <div key={ev.id} className="p-4 space-y-3 cursor-pointer" onClick={() => handleEditAction(ev)}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                        {ev.data_inicio ? new Date(ev.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${getStatusBadge(ev.status)}`}>
                        {ev.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{ev.titulo}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ev.descricao}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                        {TEMATICA_LABELS[ev.tematica || ''] || ev.tematica}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-bold text-emerald-600">
                        {getEixoLabel(ev.eixo)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden sm:table">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold font-mono">Data</th>
                  <th className="py-3.5 px-4">Ação</th>
                  <th className="py-3.5 px-4">Temática</th>
                  <th className="py-3.5 px-4">Eixo</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <Info className="w-6 h-6 mx-auto mb-2 text-slate-350" />
                      Nenhuma ação preventiva agendada.
                    </td>
                  </tr>
                ) : (
                  events.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors cursor-pointer" onClick={() => handleEditAction(ev)}>
                      <td className="py-4 px-4 font-mono font-bold text-slate-500">
                        {ev.data_inicio ? new Date(ev.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-4 px-4 font-extrabold text-slate-850 dark:text-slate-200">
                        <div>
                          <p>{ev.titulo}</p>
                          {ev.descricao && <p className="text-[10px] text-slate-400 font-light mt-0.5 max-w-[250px] truncate">{ev.descricao}</p>}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-350">
                        {TEMATICA_LABELS[ev.tematica || ''] || ev.tematica}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-bold text-emerald-600">
                          {getEixoLabel(ev.eixo)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${getStatusBadge(ev.status)}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditAction(ev); }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-855 dark:hover:text-white rounded-lg transition"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteAction(ev.id, e)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-500 rounded-lg transition"
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
        )}

        {/* Modal Form Dialog */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  {modalMode === 'editar' ? 'Editar Ação Preventiva' : 'Nova Ação Preventiva'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-655 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Titulo */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Título da Atividade *</label>
                  <input 
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="glass-input w-full text-xs"
                    placeholder="Ex: Palestra sobre Bullying no Ambiente Escolar"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tematica */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Temática Principal</label>
                    <select
                      value={tematica}
                      onChange={(e) => setTematica(e.target.value)}
                      className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                    >
                      <option value="acolhimento">Acolhimento</option>
                      <option value="bullying">Bullying / Cyberbullying</option>
                      <option value="violencia_fisica">Violência Física</option>
                      <option value="racismo">Racismo / Preconceito</option>
                      <option value="intolerancia_religiosa">Intolerância Religiosa</option>
                      <option value="violencia_contra_mulheres">Violência contra Mulheres</option>
                      <option value="sexualidade">Sexualidade e Efetividade</option>
                      <option value="boa_convivencia">Boa Convivência</option>
                      <option value="diversidade_inclusao">Diversidade e Inclusão</option>
                      <option value="saude_mental">Saúde Mental / Emoções</option>
                      <option value="uso_substancias">Prevenção ao Uso de Substâncias</option>
                      <option value="atrasos">Atitudes / Pontualidade</option>
                      <option value="outros">Outros Temas</option>
                    </select>
                  </div>

                  {/* Eixo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Eixo das Rotinas IV</label>
                    <select
                      value={eixo}
                      onChange={(e) => setEixo(e.target.value as any)}
                      className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                    >
                      <option value="prevencao">Prevenção</option>
                      <option value="acao_intervencao">Ação e Intervenção</option>
                      <option value="pos_violencia">Pós-Violência</option>
                    </select>
                  </div>
                </div>

                {/* Descricao */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Descrição</label>
                  <textarea 
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="glass-input w-full min-h-[80px] text-xs leading-relaxed py-1.5 px-3"
                    placeholder="Detalhamento metodológico, cronograma de execução, parcerias com psicólogos e equipe multidisciplinar..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Data Inicio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Data Início</label>
                    <input 
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>

                  {/* Data Fim */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Data Fim</label>
                    <input 
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Periodicidade */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Periodicidade</label>
                    <select
                      value={periodicidade}
                      onChange={(e) => setPeriodicidade(e.target.value)}
                      className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                    >
                      <option value="eventual">Eventual</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  {/* Publico Alvo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Público-Alvo</label>
                    <select
                      value={publicoAlvo}
                      onChange={(e) => setPublicoAlvo(e.target.value)}
                      className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                    >
                      <option value="todos">Todos</option>
                      <option value="estudantes">Estudantes</option>
                      <option value="professores">Professores</option>
                      <option value="pais">Pais e Responsáveis</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as AgendaPreventiva['status'])}
                      className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                    >
                      <option value="planejado">Planejado</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="realizado">Realizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !titulo.trim()}
                    className="flex-1 py-2.5 text-xs font-extrabold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition shadow flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar Ação
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
