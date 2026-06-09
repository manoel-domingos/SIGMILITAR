"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, MessageSquare, History, ShieldAlert, BookOpen, PenTool, ClipboardList, ChevronUp, ChevronDown } from 'lucide-react';
import { streamAI } from '@/components/AIChat';
import { addAILog } from '@/lib/ai';
import { useAppContext } from '@/lib/store';
import { useTenantConfig } from '@/lib/useTenantConfig';
import OccurrenceChecklist, { loadChecklists, OccurrenceTask, toggleChecklistItem, removeOccurrenceTask } from './OccurrenceChecklist';

type Tab = 'pendencias' | 'chat';

function BrainWithBeret({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Cérebro (Brain) deslocado para baixo para a boina */}
      <g transform="translate(0, 3) scale(0.85)">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M12 5v14" />
      </g>
      {/* Boina Militar (Beret) */}
      <path d="M4 6.5C4 5 7.5 3.5 12 3.5s8 1.5 8 3c0 .8-.5 1.5-1.5 1.8H5.5C4.5 8 4 7.3 4 6.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
      <path d="M17.5 7.8c1.5 0 2.5-.5 2.5-1.3 0-.3-.3-.6-.8-.8l-1.7 2.1Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
      <circle cx="8" cy="5.8" r="1.1" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5" />
    </svg>
  );
}

export default function AIAssistant() {
  const { students, occurrences, rules, user, activeSchoolContext } = useAppContext();
  const { schoolName } = useTenantConfig();

  const currentSchoolName = activeSchoolContext ? (
    activeSchoolContext === 'joaobatista' ? 'EECM Prof. João Batista' :
    activeSchoolContext === 'heliodoro' ? 'EECM Heliodoro Capistrano' :
    activeSchoolContext === 'tangara' ? 'EECM Tangará' :
    schoolName
  ) : schoolName;

  const userId = (user as any)?.email ?? 'guest';
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('pendencias');
  const [checklistTasks, setChecklistTasks] = useState<OccurrenceTask[]>([]);

  useEffect(() => {
    setChecklistTasks(loadChecklists(userId));
  }, [userId]);

  const pendingCount = checklistTasks.reduce(
    (acc, t) => acc + t.items.filter((i) => !i.done).length,
    0
  );

  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Olá! Sou seu assistente de gestão disciplinar. Como posso ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage = { role: 'user' as const, content: messageText };
    setMessages(prev => [...prev, userMessage]);
    if (!text) setInput('');
    setIsLoading(true);

    try {
      const historyContext = messages.map(m => (m.role === 'user' ? 'Usu\u00e1rio' : 'Assistente') + ': ' + m.content).join('\n');
      
      const rulesContext = rules.slice(0, 10).map(r => r.code + ': ' + r.description + ' (' + r.points + ' pts)').join('; ');
      const prompt = [
        'Voc\u00ea \u00e9 um Assistente de Gest\u00e3o Disciplinar Escolar da escola ' + currentSchoolName + '.',
        'Sua fun\u00e7\u00e3o \u00e9 ajudar os gestores e professores a:',
        '1. Escrever observa\u00e7\u00f5es e atas de ocorr\u00eancias de forma profissional e clara.',
        '2. Sugerir medidas disciplinares baseadas nas regras da escola.',
        '3. Analisar o hist\u00f3rico de alunos para identificar padr\u00f5es de comportamento.',
        '',
        'DADOS ATUAIS DA ESCOLA (' + currentSchoolName + '):',
        '- Total de alunos: ' + students.length,
        '- Regras Disciplinares (algumas): ' + rulesContext,
        '',
        'HIST\u00d3RICO DA CONVERSA:',
        historyContext,
        '',
        'PERGUNTA DO USU\u00c1RIO:',
        messageText,
        '',
        'Responda em Portugu\u00eas do Brasil de forma direta e profissional.',
      ].join('\n');

      // Mensagem placeholder do assistente — preenchida ao vivo conforme o stream chega
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      let acc = '';
      const aiResponse = await streamAI(
        'chat',
        { message: prompt },
        (delta) => {
          acc += delta;
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: 'assistant', content: acc };
            return copy;
          });
        },
        undefined,
        activeSchoolContext || undefined,
      );

      addAILog({ model: 'deepseek-v4-pro', prompt, response: aiResponse, status: 'success', provider: 'deepseek' });
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      addAILog({ model: 'deepseek-v4-pro', prompt: messageText, response: '', status: 'error', error: error?.message, provider: 'deepseek' });
      setMessages(prev => {
        // Substitui o placeholder vazio (se houver) pela mensagem de erro
        const copy = [...prev];
        const errMsg = { role: 'assistant' as const, content: `Erro: ${error.message || 'Falha na IA'}. Tente novamente em instantes.` };
        if (copy.length && copy[copy.length - 1].role === 'assistant' && copy[copy.length - 1].content === '') {
          copy[copy.length - 1] = errMsg;
          return copy;
        }
        return [...copy, errMsg];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { icon: <PenTool size={14}/>, label: 'Ajudar na escrita', text: 'Pode me ajudar a escrever uma ata sobre um aluno que desrespeitou um professor em sala?' },
    { icon: <ShieldAlert size={14}/>, label: 'Sugerir Medida', text: 'Quais medidas são recomendadas para um aluno que cometeu uma falta grave pela segunda vez?' },
    { icon: <History size={14}/>, label: 'Analisar Padrão', text: 'Como identificar se um aluno está apresentando um padrão de indisciplina crescente?' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-96 h-[550px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0052cc] p-4 flex justify-between items-center text-white border-b border-blue-700/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center shadow-inner">
                  <BrainWithBeret className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-wide">ARI — Assistente Regimental Inteligente</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[9px] text-blue-200 font-semibold uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Abas */}
            <div className="flex bg-slate-800 border-b border-slate-700">
              <button
                onClick={() => setActiveTab('pendencias')}
                className={'flex items-center gap-1.5 flex-1 justify-center py-2.5 text-xs font-semibold transition-colors ' + (activeTab === 'pendencias' ? 'text-white border-b-2 border-[#0052cc]' : 'text-slate-400 hover:text-slate-200')}
              >
                <ClipboardList size={13} />
                Pendências
                {pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={'flex items-center gap-1.5 flex-1 justify-center py-2.5 text-xs font-semibold transition-colors ' + (activeTab === 'chat' ? 'text-white border-b-2 border-[#0052cc]' : 'text-slate-400 hover:text-slate-200')}
              >
                <MessageSquare size={13} />
                Chat
              </button>
            </div>

            {/* Aba Pendencias */}
            {activeTab === 'pendencias' && (
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {checklistTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 py-12">
                    <ClipboardList size={36} className="opacity-30" />
                    <p className="text-sm font-medium">Nenhuma pendencia</p>
                    <p className="text-xs text-center px-8 opacity-70">As pendencias de ocorrencias registradas aparecem aqui.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {checklistTasks.map((task) => {
                      const allDone = task.items.every((i) => i.done);
                      const pending = task.items.filter((i) => !i.done).length;
                      return (
                        <div key={task.occurrenceId} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{task.occurrenceNum} — {task.studentName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {allDone ? <span className="text-emerald-600 font-medium">Concluido</span> : `${pending} pendente${pending > 1 ? 's' : ''}`}
                              </p>
                            </div>
                            {allDone && (
                              <button
                                onClick={() => setChecklistTasks(removeOccurrenceTask(userId, task.occurrenceId))}
                                className="text-slate-300 hover:text-slate-500 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          <ul className="space-y-1.5">
                            {task.items.map((item) => (
                              <li key={item.id}
                                className="flex items-start gap-2 cursor-pointer"
                                onClick={() => setChecklistTasks(toggleChecklistItem(userId, task.occurrenceId, item.id))}
                              >
                                <div className={'mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ' + (item.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300')}>
                                  {item.done && <div className="w-1.5 h-1 border-b-2 border-r-2 border-white rotate-45 -translate-y-px" />}
                                </div>
                                <span className={'text-xs leading-relaxed ' + (item.done ? 'line-through text-slate-400' : 'text-slate-700')}>{item.label}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Aba Chat */}
            {activeTab === 'chat' && (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                  {messages.map((m, i) => (
                    <div key={i} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={'max-w-[85%] p-3 rounded-2xl text-sm ' + (m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-md' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm')}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                {messages.length < 3 && (
                  <div className="px-4 py-2 flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-950/50">
                    {quickActions.map((action, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSend(action.text)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all shadow-sm"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Descreva o ocorrido ou peça ajuda..."
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    />
                    <button 
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-5 py-3 bg-[#0052cc] text-white rounded-full shadow-2xl hover:bg-[#0047b3] active:scale-95 transition-all duration-200 font-semibold text-sm"
      >
        <BrainWithBeret className="w-6 h-6 text-white" />
        <span>{isOpen ? 'Fechar ARI' : 'ARI'}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
    </div>
  );
}
