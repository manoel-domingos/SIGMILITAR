'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, ThumbsUp, ArrowLeftRight, MessageSquare, Tag, CheckCircle2, Award, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: 'Pedagógico' | 'Disciplinar' | 'Drive' | 'Geral' | 'Design';
  status: 'Aberto' | 'Em Análise' | 'Planejado' | 'Em Desenvolvimento' | 'Finalizado';
  votes: number;
  votedBy: string[]; // emails
  createdBy: string;
  createdByName: string;
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
    status: 'Em Desenvolvimento',
    votes: 42,
    votedBy: [],
    createdBy: 'diretor@escola.gov.br',
    createdByName: 'Diretor João',
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
    createdAt: '2026-05-20T14:30:00Z',
  },
  {
    id: 'idea-3',
    title: 'Relatório unificado de recidiva por turma',
    description: 'Gráfico e tabela exportáveis mostrando o índice de alunos recorrentes em infrações graves em cada turma para acompanhamento psicossocial.',
    category: 'Pedagógico',
    status: 'Em Análise',
    votes: 19,
    votedBy: [],
    createdBy: 'psicologa@escola.gov.br',
    createdByName: 'Dra. Ana (Psicóloga)',
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
    createdAt: '2026-05-30T11:45:00Z',
  },
  {
    id: 'idea-5',
    title: 'Bypass de segurança automático para conexões do Vercel',
    description: 'Automatizado envio de variáveis de ambiente do Drive para evitar erros de autenticação na hospedagem da nuvem.',
    category: 'Geral',
    status: 'Finalizado',
    votes: 35,
    votedBy: [],
    createdBy: 'admin@meg.com.br',
    createdByName: 'Administrador Global',
    createdAt: '2026-05-28T16:00:00Z',
  }
];

export default function CannyKanbanModal({ isOpen, onClose, currentUser, currentUserRole }: CannyKanbanModalProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<Idea['category']>('Geral');

  const userEmail = currentUser?.email || 'anonimo@escola.gov.br';
  const userName = currentUser?.name || 'Usuário Escola';
  const canManageStatus = currentUserRole === 'admin_global' || currentUserRole === 'GESTOR';

  // Carrega do localStorage ou inicia com padrões
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('meg_canny_ideas');
      if (stored) {
        try {
          setIdeas(JSON.parse(stored));
        } catch (e) {
          setIdeas(DEFAULT_IDEAS);
        }
      } else {
        setIdeas(DEFAULT_IDEAS);
        localStorage.setItem('meg_canny_ideas', JSON.stringify(DEFAULT_IDEAS));
      }
    }
  }, []);

  const saveIdeas = (updatedIdeas: Idea[]) => {
    setIdeas(updatedIdeas);
    localStorage.setItem('meg_canny_ideas', JSON.stringify(updatedIdeas));
  };

  const handleVote = (ideaId: string) => {
    const updated = ideas.map(idea => {
      if (idea.id === ideaId) {
        const hasVoted = idea.votedBy.includes(userEmail);
        const votedBy = hasVoted 
          ? idea.votedBy.filter(email => email !== userEmail)
          : [...idea.votedBy, userEmail];
        const votes = hasVoted ? idea.votes - 1 : idea.votes + 1;
        
        if (!hasVoted) {
          toast.success('Sugestão apoiada com sucesso! Obrigado pelo feedback.');
        }
        
        return { ...idea, votes, votedBy };
      }
      return idea;
    });
    saveIdeas(updated);
  };

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const newIdea: Idea = {
      id: `idea-${Date.now()}`,
      title: newTitle,
      description: newDescription,
      category: newCategory,
      status: 'Aberto',
      votes: 1,
      votedBy: [userEmail],
      createdBy: userEmail,
      createdByName: userName,
      createdAt: new Date().toISOString(),
    };

    saveIdeas([newIdea, ...ideas]);
    setIsNewIdeaOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewCategory('Geral');
    toast.success('Sua ideia foi publicada no Quadro de Melhorias!');
  };

  const handleMoveStatus = (ideaId: string, direction: 'left' | 'right') => {
    const statuses: Idea['status'][] = ['Aberto', 'Em Análise', 'Planejado', 'Em Desenvolvimento', 'Finalizado'];
    const updated = ideas.map(idea => {
      if (idea.id === ideaId) {
        const currentIndex = statuses.indexOf(idea.status);
        let nextIndex = currentIndex;
        if (direction === 'left' && currentIndex > 0) nextIndex--;
        if (direction === 'right' && currentIndex < statuses.length - 1) nextIndex++;
        
        if (nextIndex !== currentIndex) {
          const newStatus = statuses[nextIndex];
          toast.info(`Status atualizado para: ${newStatus}`);
          return { ...idea, status: newStatus };
        }
      }
      return idea;
    });
    saveIdeas(updated);
  };

  const handleDeleteIdea = (ideaId: string) => {
    if (confirm('Tem certeza que deseja remover esta sugestão?')) {
      const filtered = ideas.filter(idea => idea.id !== ideaId);
      saveIdeas(filtered);
      toast.success('Sugestão removida.');
    }
  };

  if (!isOpen) return null;

  const columns: { label: Idea['status']; color: string; bg: string }[] = [
    { label: 'Aberto', color: 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800', bg: 'bg-slate-50/50 dark:bg-slate-900/50' },
    { label: 'Em Análise', color: 'text-amber-600 border-amber-200 dark:border-amber-900/30', bg: 'bg-amber-50/30 dark:bg-amber-950/10' },
    { label: 'Planejado', color: 'text-blue-600 border-blue-200 dark:border-blue-900/30', bg: 'bg-blue-50/30 dark:bg-blue-950/10' },
    { label: 'Em Desenvolvimento', color: 'text-purple-600 border-purple-200 dark:border-purple-900/30', bg: 'bg-purple-50/30 dark:bg-purple-950/10' },
    { label: 'Finalizado', color: 'text-emerald-600 border-emerald-200 dark:border-emerald-900/30', bg: 'bg-emerald-50/30 dark:bg-emerald-950/10' }
  ];

  return (
    <div className="fixed inset-0 glass-overlay z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-modal max-w-7xl w-full h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewIdeaOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition text-xs shadow-lg shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              Sugerir Melhoria
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Kanban Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-slate-50/50 dark:bg-slate-950/20 flex gap-4">
          {columns.map(col => {
            const colIdeas = ideas.filter(idea => idea.status === col.label).sort((a, b) => b.votes - a.votes);
            return (
              <div key={col.label} className="w-80 shrink-0 flex flex-col h-full rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4">
                
                {/* Column Title */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.label === 'Aberto' ? 'bg-slate-400' : col.label === 'Em Análise' ? 'bg-amber-400' : col.label === 'Planejado' ? 'bg-blue-400' : col.label === 'Em Desenvolvimento' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                    {col.label}
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
                    {colIdeas.length}
                  </span>
                </div>

                {/* Ideas list scrollable */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colIdeas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300 dark:text-slate-700 text-center">
                      <Clock className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-xs font-semibold">Sem sugestões aqui</p>
                    </div>
                  ) : (
                    colIdeas.map(idea => {
                      const hasVoted = idea.votedBy.includes(userEmail);
                      return (
                        <div
                          key={idea.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300/80 dark:hover:border-slate-700 transition duration-200 flex flex-col gap-3 group relative"
                        >
                          {/* Category and Actions */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200/40 dark:border-slate-700/40 flex items-center gap-1 shrink-0">
                              <Tag className="w-2.5 h-2.5" />
                              {idea.category}
                            </span>
                            
                            {canManageStatus && (
                              <div className="flex items-center gap-1 opacity-65 group-hover:opacity-100 transition shrink-0">
                                <button
                                  onClick={() => handleMoveStatus(idea.id, 'left')}
                                  disabled={col.label === 'Aberto'}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded disabled:opacity-30"
                                  title="Mover para esquerda"
                                >
                                  ←
                                </button>
                                <button
                                  onClick={() => handleMoveStatus(idea.id, 'right')}
                                  disabled={col.label === 'Finalizado'}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded disabled:opacity-30"
                                  title="Mover para direita"
                                >
                                  →
                                </button>
                                <button
                                  onClick={() => handleDeleteIdea(idea.id)}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded"
                                  title="Deletar sugestão"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                              {idea.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed break-words">
                              {idea.description}
                            </p>
                          </div>

                          {/* Author & Vote Row */}
                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                            <div>
                              por <strong className="text-slate-600 dark:text-slate-400">{idea.createdByName}</strong>
                            </div>
                            <button
                              onClick={() => handleVote(idea.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all border font-bold ${
                                hasVoted 
                                  ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' 
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-500 dark:bg-slate-900 dark:border-slate-800'
                              }`}
                            >
                              <ThumbsUp className={`w-3 h-3 ${hasVoted ? 'fill-current' : ''}`} />
                              {idea.votes}
                            </button>
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

      </div>

      {/* Modal Nova Ideia */}
      {isNewIdeaOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Sugerir Nova Melhoria
              </h3>
              <button
                onClick={() => setIsNewIdeaOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIdea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Título da Sugestão *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  placeholder="Ex: Assinatura eletrônica no prontuário..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="Geral">Geral / Outros</option>
                  <option value="Pedagógico">Pedagógico</option>
                  <option value="Disciplinar">Disciplinar</option>
                  <option value="Drive">Google Drive</option>
                  <option value="Design">Design e UI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Detalhes / Explicação *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 leading-relaxed"
                  placeholder="Explique o que deve mudar e qual o impacto pedagógico ou de gestão..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewIdeaOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newDescription.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2 rounded-xl transition text-xs shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar e Postar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
