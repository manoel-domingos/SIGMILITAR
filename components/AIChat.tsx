'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Brain, X, Send, Loader2, Sparkles, ChevronDown, Activity, Clock, ArrowRight, Trash2, AlertTriangle, CheckCircle2, RefreshCw, ClipboardList } from 'lucide-react';
import { loadChecklists, OccurrenceTask, toggleChecklistItem, removeOccurrenceTask } from '@/components/OccurrenceChecklist';
import { useAppContext } from '@/lib/store';

// ---------------------------------------------------------------------------
// Log Store global — qualquer chamada streamAI alimenta este store
// ---------------------------------------------------------------------------
export interface AILogEntry {
  id: number;
  type: string;
  model: string;
  httpStatus: number | null;
  input: string;
  output: string;
  error: string | null;
  durationMs: number;
  tokensDelta: number;
  timestamp: Date;
  status: 'pending' | 'streaming' | 'ok' | 'error';
}

let _logId = 0;
const _listeners = new Set<() => void>();
const _logs: AILogEntry[] = [];

function notifyListeners() {
  _listeners.forEach(fn => fn());
}

function addLog(entry: Omit<AILogEntry, 'id'>): number {
  const id = ++_logId;
  _logs.push({ ...entry, id });
  notifyListeners();
  return id;
}

function updateLog(id: number, patch: Partial<AILogEntry>) {
  const idx = _logs.findIndex(l => l.id === id);
  if (idx !== -1) {
    Object.assign(_logs[idx], patch);
    notifyListeners();
  }
}

function useLogs() {
  const [, forceRender] = useState(0);
  useEffect(() => {
    const fn = () => forceRender(n => n + 1);
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  }, []);
  return [..._logs].reverse(); // mais recente primeiro
}

// ---------------------------------------------------------------------------
// streamAI — utilitário SSE reutilizável exportado para o resto da app
// ---------------------------------------------------------------------------
export async function streamAI(
  type: string,
  payload: Record<string, any>,
  onDelta: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const inputSummary = type === 'chat'
    ? payload.message
    : Object.entries(payload).map(([k, v]) => `${k}: ${String(v).slice(0, 60)}`).join(' | ');

  const logId = addLog({
    type,
    model: 'deepseek-v4-flash',
    httpStatus: null,
    input: inputSummary,
    output: '',
    error: null,
    durationMs: 0,
    tokensDelta: 0,
    timestamp: new Date(),
    status: 'pending',
  });

  const start = Date.now();

  let res: Response;
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
      signal,
    });
  } catch (err: any) {
    updateLog(logId, { status: 'error', error: err?.message || 'Falha na conexão', durationMs: Date.now() - start });
    throw err;
  }

  updateLog(logId, { httpStatus: res.status });

  if (!res.ok || !res.body) {
    let errText = `HTTP ${res.status}`;
    try { const j = await res.json(); errText = j.error || errText; } catch { /* noop */ }
    updateLog(logId, { status: 'error', error: errText, durationMs: Date.now() - start });
    throw new Error(errText);
  }

  updateLog(logId, { status: 'streaming' });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let tokens = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(line.slice(6));

          // Eventos de metadados — modelo tentado, fallback, tempo do 1o chunk
          if (json.meta) {
            const m = json.meta;
            if (m.fallback) {
              updateLog(logId, {
                model: m.to,
                error: `Fallback: ${m.from} → ${m.to} (${m.reason})`,
                status: 'streaming',
              });
            } else if (m.model) {
              updateLog(logId, { model: m.model });
            }
            continue;
          }

          if (json.error) {
            updateLog(logId, {
              status: 'error',
              error: json.error,
              httpStatus: json.httpStatus ?? null,
              output: json.raw ? `RAW: ${json.raw}` : full,
              durationMs: Date.now() - start,
            });
            throw new Error(json.error);
          }
          if (json.delta) {
            full += json.delta;
            tokens += json.delta.length;
            onDelta(json.delta);
            updateLog(logId, { output: full, tokensDelta: tokens, status: 'streaming' });
          }
          if (json.done) {
            const finalResult = json.result ?? full;
            updateLog(logId, {
              output: finalResult,
              tokensDelta: tokens,
              status: 'ok',
              httpStatus: 200,
              durationMs: Date.now() - start,
            });
            return finalResult;
          }
        } catch (e: any) {
          if (e.message?.includes('Unexpected end')) continue;
          throw e;
        }
      }
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      updateLog(logId, { status: 'error', error: err?.message, durationMs: Date.now() - start });
    }
    throw err;
  }

  updateLog(logId, { output: full, tokensDelta: tokens, status: 'ok', durationMs: Date.now() - start });
  return full;
}

// ---------------------------------------------------------------------------
// Tipos internos do chat
// ---------------------------------------------------------------------------
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  durationMs?: number;
  streaming?: boolean;
}

type Panel = 'pendencias' | 'chat' | 'logs';

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function AIChat() {
  const { user } = useAppContext();
  const userId = (user as any)?.email ?? 'guest';
  const [checklistTasks, setChecklistTasks] = useState<OccurrenceTask[]>([]);

  useEffect(() => {
    setChecklistTasks(loadChecklists(userId));
  }, [userId]);

  const pendingCount = checklistTasks.reduce(
    (acc, t) => acc + t.items.filter((i) => !i.done).length,
    0
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>('pendencias');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou a ARIA. Como posso ajudar?', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const logs = useLogs();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (activePanel === 'chat') {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen, activePanel]);

  // Auto-abrir aba de logs quando chegar novo log externo (ATA, análise, relatório)
  useEffect(() => {
    const chatTypes = new Set(['chat']);
    const hasExternal = logs.some(l => !chatTypes.has(l.type) && (l.status === 'streaming' || l.status === 'pending'));
    if (hasExternal && isOpen) setActivePanel('logs');
  }, [logs, isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const trimmed = text.trim();
    const ts = new Date();
    const start = Date.now();

    setMessages(prev => [...prev, { role: 'user', content: trimmed, timestamp: ts }]);
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date(), streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const reply = await streamAI(
        'chat',
        { message: trimmed },
        (delta) => {
          setMessages(prev => prev.map((m, i) =>
            i === prev.length - 1 && m.streaming ? { ...m, content: m.content + delta } : m
          ));
        },
        abortRef.current.signal
      );
      const durationMs = Date.now() - start;
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 && m.streaming ? { ...m, content: reply, streaming: false, durationMs } : m
      ));
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const durationMs = Date.now() - start;
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 && m.streaming
          ? { ...m, content: `Erro: ${err?.message || 'Tente novamente.'}`, streaming: false, durationMs }
          : m
      ));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading]);

  const handleSend = () => sendMessage(input);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const streamingCount = logs.filter(l => l.status === 'streaming' || l.status === 'pending').length;
  const errorCount = logs.filter(l => l.status === 'error').length;

  const statusColor = (s: AILogEntry['status'], httpStatus: number | null) => {
    if (s === 'error') return 'bg-rose-400';
    if (s === 'streaming' || s === 'pending') return 'bg-amber-400 animate-pulse';
    if (httpStatus && httpStatus >= 400) return 'bg-rose-400';
    return 'bg-emerald-400';
  };

  const httpBadgeColor = (code: number | null) => {
    if (code === null) return 'text-slate-400 bg-slate-100 dark:bg-slate-700';
    if (code >= 500) return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 font-bold';
    if (code >= 400) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 font-bold';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  const typeLabel: Record<string, string> = {
    chat: 'Chat', ata: 'ATA', analise: 'Análise', relatorio: 'Relatório',
  };

  const suggestions = [
    'Diferença entre advertência oral e escrita?',
    'Como registrar uma ocorrência?',
    'O que é reincidência?',
  ];

  return (
    <>
      {/* Botão FAB */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Fechar ARIA' : 'Abrir assistente ARIA'}
        className="fixed bottom-6 right-6 z-[9800] flex items-center gap-2 px-4 py-3 rounded-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-200 print:hidden"
      >
        {isOpen
          ? <ChevronDown className="w-5 h-5" />
          : isLoading ? <Loader2 className="w-5 h-5 animate-spin" />
          : <Sparkles className="w-5 h-5" />}
        <span className="text-sm font-semibold tracking-wide">ARIA</span>
        {/* Badge de streaming */}
        {streamingCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-amber-400 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1 animate-pulse">
            {streamingCount}
          </span>
        )}
        {/* Badge de erro */}
        {errorCount > 0 && streamingCount === 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1">
            !
          </span>
        )}
        {/* Badge de logs ok */}
        {logs.length > 0 && streamingCount === 0 && errorCount === 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-emerald-400 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1">
            {logs.length > 9 ? '9+' : logs.length}
          </span>
        )}
      </button>

      {/* Painel flutuante */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Assistente ARIA"
        className={`fixed bottom-20 right-6 z-[9800] w-80 sm:w-[28rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden print:hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ maxHeight: '580px' }}
      >
        {/* Header */}
        <div className="bg-violet-600 text-white shrink-0">
          <div className="flex items-center justify-between px-4 pt-3 pb-0">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <div>
                <p className="text-sm font-bold leading-none">ARIA</p>
                <p className="text-[10px] text-violet-200 leading-none mt-0.5">
                  deepseek-v4-flash
                  {streamingCount > 0 && <span className="ml-1 text-amber-300 animate-pulse">· processando...</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isLoading && (
                <button onClick={() => abortRef.current?.abort()} className="text-[10px] text-violet-200 hover:text-white border border-violet-400/40 rounded-lg px-2 py-1 transition">
                  Cancelar
                </button>
              )}
              <button onClick={() => setIsOpen(false)} aria-label="Fechar painel" className="text-violet-200 hover:text-white p-1 rounded-lg hover:bg-violet-500/40 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Abas */}
          <div className="flex mt-2 px-4">
            <button
              onClick={() => setActivePanel('pendencias')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                activePanel === 'pendencias' ? 'border-white text-white' : 'border-transparent text-violet-300 hover:text-violet-100'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Pendencias
              {pendingCount > 0 && (
                <span className="ml-1 bg-red-500 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePanel('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                activePanel === 'chat' ? 'border-white text-white' : 'border-transparent text-violet-300 hover:text-violet-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Chat
            </button>
            <button
              onClick={() => setActivePanel('logs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                activePanel === 'logs' ? 'border-white text-white' : 'border-transparent text-violet-300 hover:text-violet-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Logs IA
              {logs.length > 0 && (
                <span className="ml-1 bg-white/20 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                  {logs.length}
                  {errorCount > 0 && <span className="ml-0.5 text-rose-300">!</span>}
                  {streamingCount > 0 && <span className="ml-0.5 text-amber-300 animate-pulse">•</span>}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ---- PAINEL PENDENCIAS ---- */}
        {activePanel === 'pendencias' && (
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900" style={{ maxHeight: '480px' }}>
            {checklistTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
                <ClipboardList className="w-9 h-9 opacity-25" />
                <p className="text-sm font-medium">Nenhuma pendencia</p>
                <p className="text-xs text-center px-8 opacity-70">Pendencias de ocorrencias registradas aparecem aqui.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {checklistTasks.map((task) => {
                  const allDone = task.items.every((i) => i.done);
                  const pending = task.items.filter((i) => !i.done).length;
                  return (
                    <div key={task.occurrenceId} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{task.occurrenceNum} — {task.studentName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {allDone
                              ? <span className="text-emerald-600 font-medium">Concluido</span>
                              : `${pending} pendente${pending > 1 ? 's' : ''}`}
                          </p>
                        </div>
                        {allDone && (
                          <button
                            onClick={() => setChecklistTasks(removeOccurrenceTask(userId, task.occurrenceId))}
                            className="text-slate-300 hover:text-slate-500 transition-colors"
                            aria-label="Remover"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <ul className="space-y-1.5">
                        {task.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-2 cursor-pointer"
                            onClick={() => setChecklistTasks(toggleChecklistItem(userId, task.occurrenceId, item.id))}
                          >
                            <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                              item.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                            }`}>
                              {item.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-xs leading-relaxed ${item.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {item.label}
                            </span>
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

        {/* ---- PAINEL CHAT ---- */}
        {activePanel === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '400px' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                  }`}>
                    {msg.content}
                    {msg.streaming && <span className="inline-block w-1.5 h-3.5 bg-violet-400 rounded-sm ml-0.5 animate-pulse align-middle" />}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <Clock className="w-2.5 h-2.5 text-slate-300" />
                    <span className="text-[9px] text-slate-400">{formatTime(msg.timestamp)}</span>
                    {msg.durationMs != null && !msg.streaming && (
                      <span className="text-[9px] text-slate-400">· {(msg.durationMs / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              ))}
              {messages.length === 1 && !isLoading && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs text-slate-400 font-medium">Sugestoes rapidas:</p>
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800 transition">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 p-3 flex gap-2 shrink-0">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Escreva sua duvida..." disabled={isLoading}
                className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 dark:text-slate-200" />
              <button onClick={handleSend} disabled={!input.trim() || isLoading} aria-label="Enviar"
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white transition active:scale-95">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ---- PAINEL LOGS ---- */}
        {activePanel === 'logs' && (
          <>
            {logs.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700/60 shrink-0 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{logs.length} chamada{logs.length > 1 ? 's' : ''}</span>
                  {errorCount > 0 && <span className="text-rose-500 font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errorCount} erro{errorCount > 1 ? 's' : ''}</span>}
                  {streamingCount > 0 && <span className="text-amber-500 font-semibold flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />{streamingCount} ativo{streamingCount > 1 ? 's' : ''}</span>}
                </div>
                <button onClick={() => { _logs.length = 0; notifyListeners(); setExpandedLog(null); }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition">
                  <Trash2 className="w-3 h-3" /> Limpar
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '480px' }}>
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                  <Activity className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Nenhuma chamada registrada.</p>
                  <p className="text-xs text-center px-6">Todas as chamadas a IA aparecerão aqui com status HTTP, tempo e conteudo real.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {logs.map((log) => {
                    const isExpanded = expandedLog === log.id;
                    const hasError = log.status === 'error' || (log.httpStatus !== null && log.httpStatus >= 400);
                    return (
                      <div key={log.id}
                        className={`transition-colors ${
                          hasError ? 'bg-rose-50/60 dark:bg-rose-900/10'
                          : log.status === 'streaming' || log.status === 'pending' ? 'bg-amber-50/60 dark:bg-amber-900/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Row de resumo — sempre visivel */}
                        <button
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor(log.status, log.httpStatus)}`} />

                          {/* HTTP status */}
                          <span className={`shrink-0 text-[10px] font-mono font-bold rounded px-1.5 py-0.5 ${httpBadgeColor(log.httpStatus)}`}>
                            {log.httpStatus !== null ? `HTTP ${log.httpStatus}` : '...'}
                          </span>

                          {/* Tipo */}
                          <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded px-1.5 py-0.5 shrink-0">
                            {typeLabel[log.type] ?? log.type}
                          </span>

                          {/* Modelo */}
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[80px]" title={log.model}>
                            {log.model.replace('deepseek-ai/', '')}
                          </span>

                          {/* Tempo */}
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {log.status === 'streaming' || log.status === 'pending'
                              ? <span className="text-amber-500 animate-pulse">aguardando...</span>
                              : `${(log.durationMs / 1000).toFixed(1)}s`}
                          </span>

                          <span className="ml-auto text-[10px] text-slate-400 shrink-0">{formatTime(log.timestamp)}</span>
                        </button>

                        {/* Detalhe expandido */}
                        {isExpanded && (
                          <div className="px-4 pb-3 space-y-2">
                            {/* Model */}
                            <div className="text-[10px] text-slate-400 font-mono">modelo: {log.model}</div>

                            {/* Tokens */}
                            {log.tokensDelta > 0 && (
                              <div className="text-[10px] text-slate-400 font-mono">tokens output: ~{log.tokensDelta}</div>
                            )}

                            {/* IN */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-violet-500 bg-violet-50 dark:bg-violet-900/20 rounded px-1.5 py-0.5">IN</span>
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono leading-relaxed break-all">
                                {log.input}
                              </p>
                            </div>

                            {/* OUT ou ERRO */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {hasError
                                  ? <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded px-1.5 py-0.5">ERRO</span>
                                  : <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded px-1.5 py-0.5">OUT</span>}
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                {log.status === 'streaming' && (
                                  <span className="text-[9px] text-amber-500 animate-pulse font-semibold">recebendo...</span>
                                )}
                              </div>

                              {hasError ? (
                                <div className="rounded-lg border border-rose-200 dark:border-rose-800 overflow-hidden">
                                  {/* Mensagem formatada DeepSeek */}
                                  <div className="px-3 py-2 bg-rose-50 dark:bg-rose-900/20">
                                    <p className="text-xs text-rose-700 dark:text-rose-300 font-mono leading-relaxed break-all">
                                      {log.error || `HTTP ${log.httpStatus}`}
                                    </p>
                                  </div>
                                  {/* RAW se disponivel */}
                                  {log.output?.startsWith('RAW:') && (
                                    <div className="px-3 py-1.5 bg-slate-800 border-t border-rose-200 dark:border-rose-800">
                                      <p className="text-[10px] text-slate-400 font-mono break-all">{log.output}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono leading-relaxed break-all max-h-40 overflow-y-auto">
                                  {log.output || '...'}
                                  {log.status === 'streaming' && (
                                    <span className="inline-block w-1 h-3 bg-amber-400 rounded-sm ml-0.5 animate-pulse align-middle" />
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
