'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Tag, Clock, Send, Award, Sparkles, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: 'Pedagógico' | 'Disciplinar' | 'Drive' | 'Geral' | 'Design';
  status: 'Aberto' | 'Planejado' | 'Em progresso' | 'Concluido';
  votes: number;
  votedBy: string[]; // emails
  createdBy: string;
  createdByName: string;
  createdSchool: string;
  createdAt: string;
}

interface CannyKanbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email?: string | null; name?: string } | null;
  currentUserRole: string;
}

const DEFAULT_IDEAS: Idea[] = [
  {
    id: 'idea-1',
    title: 'Integração de assinatura digital para Termo de Compromisso',
    description: 'Permitir que os responsáveis assinem os termos de ocorrências diretamente pela tela do celular usando assinatura na tela (touch).',
    category: 'Disciplinar',
    status: 'Em progresso',
    votes: 42,
    votedBy: [],
    createdBy: 'diretor@escola.gov.br',
    createdByName: 'Diretor João',
    createdSchool: 'EECM João Batista',
    createdAt: '2026-05-15T10:00:00Z',
  },
  {
    id: 'idea-2',
    title: 'Upload automático em lote de fotos de alunos',
    description: 'Uma área para fazer upload de múltiplos arquivos de fotos nomeados pelo número de matrícula do aluno e associar automaticamente.',
    category: 'Pedagógico',
    status: 'Planejado',
    votes: 28,
    votedBy: [],
    createdBy: 'coordenador@escola.gov.br',
    createdByName: 'Coordenadora Maria',
    createdSchool: 'EECM Heliodoro',
    createdAt: '2026-05-20T14:30:00Z',
  },
  {
    id: 'idea-3',
    title: 'Relatório unificado de recidiva por turma',
    description: 'Gráfico e tabela exportáveis mostrando o índice de alunos recorrentes em infrações graves em cada turma para acompanhamento psicossocial.',
    category: 'Pedagógico',
    status: 'Aberto',
    votes: 19,
    votedBy: [],
    createdBy: 'psicologa@escola.gov.br',
    createdByName: 'Dra. Ana (Psicóloga)',
    createdSchool: 'EECM João Batista',
    createdAt: '2026-05-25T09:15:00Z',
  },
  {
    id: 'idea-4',
    title: 'Indicador visual de espaço ocupado no Google Drive',
    description: 'Exibir no painel de configurações a porcentagem de armazenamento restante e os MBs consumidos na pasta do Drive configurada.',
    category: 'Drive',
    status: 'Aberto',
    votes: 11,
    votedBy: [],
    createdBy: 'suporte@meg.com.br',
    createdByName: 'Técnico Carlos',
    createdSchool: 'EECM Heliodoro',
    createdAt: '2026-05-30T11:45:00Z',
  },
  {
    id: 'idea-5',
    title: 'Bypass de segurança automático para conexões do Vercel',
    description: 'Automatizado envio de variáveis de ambiente do Drive para evitar erros de autenticação na hospedagem da nuvem.',
    category: 'Geral',
    status: 'Concluido',
    votes: 35,
    votedBy: [],
    createdBy: 'admin@meg.com.br',
    createdByName: 'Administrador Global',
    createdSchool: 'EECM João Batista',
    createdAt: '2026-05-28T16:00:00Z',
  }
];

export default function CannyKanbanModal({ isOpen, onClose, currentUser, currentUserRole }: CannyKanbanModalProps) {
  const { contextSchools, activeSchoolContext } = useAppContext();
  
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTab, setActiveTab] = useState<'Aberto' | 'Planejado' | 'Em progresso' | 'Concluido'>('Aberto');
  
  // States do Formulário
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<Idea['category']>('Geral');
  const [authorName, setAuthorName] = useState('');
  const [authorSchool, setAuthorSchool] = useState('');

  const userEmail = currentUser?.email || 'anonimo@escola.gov.br';
  const detectSchoolName = useMemo(() => {
    const currentSchool = contextSchools?.find(s => s.id === activeSchoolContext);
    return currentSchool?.name || 'EECM João Batista';
  }, [contextSchools, activeSchoolContext]);

  const canManageStatus = currentUserRole === 'admin_global' || currentUserRole === 'GESTOR';

  // Carrega do Supabase com sincronização em tempo real
  const fetchIdeas = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('meg_canny_ideas')
      .select('*')
      .order('votes', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    if (data) {
      const mapped: Idea[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        category: item.category as any,
        status: item.status as any,
        votes: item.votes || 0,
        votedBy: item.voted_by || [],
        createdBy: item.created_by,
        createdByName: item.created_by_name || '',
        createdSchool: item.created_school || '',
        createdAt: item.created_at,
      }));
      setIdeas(mapped);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIdeas();
      
      // Realtime subscription
      const channel = supabase
        .channel('meg_canny_ideas_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meg_canny_ideas' }, () => {
          fetchIdeas();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen]);

  // Preenche dados padrão ao abrir
  useEffect(() => {
    if (isOpen) {
      setAuthorName(currentUser?.name || 'Sugerente Escola');
      setAuthorSchool(detectSchoolName);
    }
  }, [isOpen, currentUser, detectSchoolName]);

  const handleVote = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const hasVoted = idea.votedBy.includes(userEmail);
    const votedBy = hasVoted 
      ? idea.votedBy.filter(email => email !== userEmail)
      : [...idea.votedBy, userEmail];
    const votes = hasVoted ? idea.votes - 1 : idea.votes + 1;

    // Optimistic update
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, votes, votedBy } : i));

    if (!supabase) return;
    const { error } = await supabase
      .from('meg_canny_ideas')
      .update({ votes, voted_by: votedBy })
      .eq('id', ideaId);

    if (error) {
      toast.error('Erro ao registrar voto.');
      fetchIdeas(); // revert
    } else {
      if (!hasVoted) {
        toast.success('Sugestão apoiada com sucesso!');
      }
    }
  };

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !authorName.trim() || !authorSchool.trim()) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    const ideaId = `idea-${Date.now()}`;
    const newIdea: Idea = {
      id: ideaId,
      title: newTitle,
      description: newDescription,
      category: newCategory,
      status: 'Aberto',
      votes: 1,
      votedBy: [userEmail],
      createdBy: userEmail,
      createdByName: authorName,
      createdSchool: authorSchool,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setIdeas(prev => [newIdea, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setNewCategory('Geral');

    if (!supabase) return;
    const { error } = await supabase
      .from('meg_canny_ideas')
      .insert({
        id: ideaId,
        school_id: activeSchoolContext || 'joaobatista',
        title: newIdea.title,
        description: newIdea.description,
        category: newIdea.category,
        status: newIdea.status,
        votes: newIdea.votes,
        voted_by: newIdea.votedBy,
        created_by: newIdea.createdBy,
        created_by_name: newIdea.createdByName,
        created_school: newIdea.createdSchool,
        created_at: newIdea.createdAt,
      });

    if (error) {
      toast.error('Erro ao publicar sugestão.');
      fetchIdeas(); // revert
    } else {
      toast.success('Sua sugestão foi publicada com sucesso!');
      // Espelha no painel Canny (fire-and-forget — falha silenciosa)
      fetch('/api/canny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: newIdea.title,
          description: newIdea.description,
          userEmail: newIdea.createdBy,
          authorName: newIdea.createdByName,
        }),
      }).catch(() => {/* silencioso */});
    }
  };

  // Funções de HTML5 Drag and Drop para Admin
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Idea['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const idea = ideas.find(i => i.id === id);
    if (!idea) return;

    if (idea.status === targetStatus) return;

    // Optimistic update
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status: targetStatus } : i));

    if (!supabase) return;
    const { error } = await supabase
      .from('meg_canny_ideas')
      .update({ status: targetStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status.');
      fetchIdeas(); // revert
    } else {
      toast.info(`Status atualizado para: ${targetStatus}`);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (confirm('Tem certeza que deseja remover esta sugestão?')) {
      // Optimistic update
      setIdeas(prev => prev.filter(i => i.id !== ideaId));

      if (!supabase) return;
      const { error } = await supabase
        .from('meg_canny_ideas')
        .delete()
        .eq('id', ideaId);

      if (error) {
        toast.error('Erro ao remover sugestão.');
        fetchIdeas(); // revert
      } else {
        toast.success('Sugestão removida.');
      }
    }
  };

  if (!isOpen) return null;

  // Filtragem dos cards
  const abas: { id: Idea['status']; label: string; count: number }[] = [
    { id: 'Aberto', label: 'Aberto', count: ideas.filter(i => i.status === 'Aberto').length },
    { id: 'Planejado', label: 'Planejado', count: ideas.filter(i => i.status === 'Planejado').length },
    { id: 'Em progresso', label: 'Em progresso', count: ideas.filter(i => i.status === 'Em progresso').length },
    { id: 'Concluido', label: 'Concluido', count: ideas.filter(i => i.status === 'Concluido').length }
  ];

  const currentTabIdeas = ideas.filter(i => i.status === activeTab).sort((a, b) => b.votes - a.votes);

  return (
    <div className="fixed inset-0 glass-overlay z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-modal max-w-7xl w-full h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              MEG
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Quadro de Ideias e Sugestões
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                  Canny Integrado
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Contribua para o aprimoramento da nossa plataforma pedagógica MEG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação (Canny Style) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 shrink-0 bg-white dark:bg-slate-900 z-10">
          {abas.map(aba => (
            <button
              key={aba.id}
              onClick={() => setActiveTab(aba.id)}
              className={`relative px-5 py-4 text-sm font-bold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
                activeTab === aba.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <span>{aba.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === aba.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {aba.count}
              </span>
            </button>
          ))}
        </div>

        {/* Grid de Conteúdo Principal */}
        <div className="flex-1 overflow-hidden flex bg-slate-50/50 dark:bg-slate-950/20">
          
          {/* FLUXO A: Sugestões Abertas (Aba Aberto) */}
          {activeTab === 'Aberto' ? (
            <div className="w-full flex h-full overflow-hidden p-6 gap-6">
              
              {/* Lista de Feedbacks (Lado Esquerdo 65%) */}
              <div className="w-full lg:w-8/12 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 shrink-0">
                  <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                    Sugestões Recentes
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Ordenado por votos
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {currentTabIdeas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-350 dark:text-slate-700 text-center">
                      <Clock className="w-10 h-10 mb-3 opacity-40 animate-pulse" />
                      <p className="text-sm font-bold">Nenhuma sugestão enviada ainda</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[280px]">Seja o primeiro a enviar uma melhoria no painel ao lado!</p>
                    </div>
                  ) : (
                    currentTabIdeas.map(idea => {
                      const hasVoted = idea.votedBy.includes(userEmail);
                      return (
                        <div
                          key={idea.id}
                          draggable={canManageStatus}
                          onDragStart={(e) => handleDragStart(e, idea.id)}
                          className="flex gap-4 items-start p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300/80 dark:hover:border-slate-700 transition duration-200 group relative"
                        >
                          {/* Upvote Button (Canny Style) */}
                          <button
                            onClick={() => handleVote(idea.id)}
                            className={`flex flex-col items-center justify-center w-12 h-14 rounded-xl border shrink-0 transition-all font-bold ${
                              hasVoted
                                ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-blue-500 dark:bg-slate-900 dark:border-slate-800'
                            }`}
                          >
                            <span className="text-base leading-none">^</span>
                            <span className="text-xs mt-1 leading-none">{idea.votes}</span>
                          </button>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug break-words">
                                {idea.title}
                              </h4>
                              {canManageStatus && (
                                <button
                                  onClick={() => handleDeleteIdea(idea.id)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs transition p-1 rounded shrink-0"
                                >
                                  × Remover
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed break-words">
                              {idea.description}
                            </p>

                            <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                              <span>SUGESTÕES</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] rounded font-semibold text-slate-600 dark:text-slate-400">
                                {idea.category}
                              </span>
                              {idea.createdByName && (
                                <>
                                  <span>•</span>
                                  <span className="normal-case font-normal text-slate-500 dark:text-slate-400">
                                    por <strong className="font-semibold text-slate-600 dark:text-slate-300">{idea.createdByName}</strong> ({idea.createdSchool})
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Formulário Inline Canny (Lado Direito 35%) */}
              <div className="hidden lg:flex w-4/12 flex-col h-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 overflow-y-auto">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                    Sugerir uma melhoria
                  </h3>
                </div>

                <form onSubmit={handleCreateIdea} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Título da Sugestão *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                      placeholder="Ex: Assinatura na tela do celular..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Categoria
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Geral">Geral / Outros</option>
                      <option value="Pedagógico">Pedagógico</option>
                      <option value="Disciplinar">Disciplinar</option>
                      <option value="Drive">Google Drive</option>
                      <option value="Design">Design e UI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Detalhes da Sugestão *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 leading-relaxed"
                      placeholder="Explique sua ideia..."
                    />
                  </div>

                  {/* IDENTIFICAÇÃO DO USER (Editável, pré-puxado pelo sistema) */}
                  <div className="h-px bg-slate-100 dark:bg-slate-850 my-2" />
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Seu Nome (Editável)
                    </label>
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-250 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      Sua Escola (Editável)
                    </label>
                    <input
                      type="text"
                      required
                      value={authorSchool}
                      onChange={(e) => setAuthorSchool(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-250 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition text-xs shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar Sugestão
                  </button>
                </form>
              </div>

            </div>
          ) : (
            
            /* FLUXO B: Visualização de Roadmap (Abas Planejado, Em progresso ou Concluido) */
            /* Apresenta as 3 colunas de Roadmap lado a lado, com Drag and Drop funcional se for admin */
            <div className="w-full h-full overflow-hidden p-6 flex gap-4">
              
              {/* Colunas do Roadmap */}
              {(['Planejado', 'Em progresso', 'Concluido'] as Idea['status'][]).map(statusKey => {
                const colIdeas = ideas.filter(i => i.status === statusKey).sort((a, b) => b.votes - a.votes);
                
                // Cor e cabeçalho da coluna
                const title = statusKey === 'Planejado' ? 'Planned' : statusKey === 'Em progresso' ? 'In Progress' : 'Complete';
                const colColor = statusKey === 'Planejado' ? 'bg-blue-500' : statusKey === 'Em progresso' ? 'bg-purple-500' : 'bg-emerald-500';
                
                // Destaca coluna se for a aba ativamente selecionada
                const isSelectedCol = activeTab === statusKey;

                return (
                  <div
                    key={statusKey}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, statusKey)}
                    className={`w-1/3 shrink-0 flex flex-col h-full rounded-2xl border bg-white dark:bg-slate-900/60 p-4 transition-all duration-300 ${
                      isSelectedCol
                        ? 'border-blue-400 ring-2 ring-blue-500/10 dark:border-blue-500/40 shadow-md bg-white dark:bg-slate-900/90'
                        : 'border-slate-200/60 dark:border-slate-800/80 opacity-90'
                    }`}
                  >
                    {/* Header de Coluna (Canny Style) */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colColor}`} />
                        {title}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
                        {colIdeas.length}
                      </span>
                    </div>

                    {/* Lista com suporte a Drag and Drop */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {colIdeas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-700 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-xl">
                          <Clock className="w-8 h-8 mb-2 opacity-40" />
                          <p className="text-xs font-semibold">Sem tarefas nesta etapa</p>
                          {canManageStatus && <p className="text-[10px] text-slate-400 mt-1">Arraste tarefas aqui</p>}
                        </div>
                      ) : (
                        colIdeas.map(idea => {
                          const hasVoted = idea.votedBy.includes(userEmail);
                          return (
                            <div
                              key={idea.id}
                              draggable={canManageStatus}
                              onDragStart={(e) => handleDragStart(e, idea.id)}
                              className={`flex gap-3 items-start p-4 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition duration-250 flex-row relative group ${
                                canManageStatus ? 'cursor-grab active:cursor-grabbing' : ''
                              }`}
                            >
                              {/* Upvote Box */}
                              <button
                                onClick={() => handleVote(idea.id)}
                                className={`flex flex-col items-center justify-center w-11 h-12 rounded-xl border shrink-0 transition-all font-bold ${
                                  hasVoted
                                    ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-blue-500 dark:bg-slate-900 dark:border-slate-800'
                                }`}
                              >
                                <span className="text-sm leading-none">^</span>
                                <span className="text-[10px] mt-0.5 leading-none">{idea.votes}</span>
                              </button>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 leading-snug break-words">
                                  {idea.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal break-words line-clamp-3" title={idea.description}>
                                  {idea.description}
                                </p>
                                
                                <div className="flex items-center gap-2 mt-3 text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                                  <span>SUGESTÕES</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
