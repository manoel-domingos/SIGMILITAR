"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, ChevronDown, ChevronUp, Copy, Check, Trash2, Cpu, Hash } from 'lucide-react';
import { globalAILogs, subscribeToAILogs, AILog } from '@/lib/ai';

export default function DebugAIPanel() {
  const [logs, setLogs] = useState<AILog[]>(globalAILogs);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    return subscribeToAILogs((newLogs) => {
      setLogs(newLogs);
    });
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-24 right-6 bg-slate-800 text-white p-3 rounded-full shadow-xl hover:bg-slate-700 transition-all z-[110] border border-slate-600"
        title="Abrir Console de Depuração IA"
      >
        <Terminal size={20} />
      </button>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 w-[500px] max-h-[70vh] bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 flex flex-col z-[120] overflow-hidden"
    >
      <style jsx global>{`
        .debug-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .debug-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .debug-scroll::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 10px;
        }
        .debug-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1);
        }
      `}</style>
      <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-blue-400" />
          <h3 className="font-bold text-sm">Console de Depuração IA</h3>
          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
            {logs.length} Logs
          </span>
        </div>
        <button onClick={() => setIsVisible(false)} className="hover:bg-slate-700 p-1.5 rounded-lg transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-950/50 debug-scroll">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm italic">
            Nenhuma interação com a IA registrada ainda.
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id} 
              className={'border rounded-xl overflow-hidden transition-all ' + (log.status === 'error' ? 'border-red-900/50 bg-red-950/10' : 'border-slate-800 bg-slate-900/50')}
            >
              <div 
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/50"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={'w-2 h-2 rounded-full ' + (log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500')} />
                    <span className="font-mono text-[10px] font-bold text-slate-300">{log.model}</span>
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[300px]">
                    {log.prompt.substring(0, 60)}...
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {log.tokens && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Hash size={10} /> {log.tokens} tk
                    </span>
                  )}
                  {expandedId === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === log.id && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-slate-800"
                  >
                    <div className="p-3 space-y-4 text-[11px] font-mono">
                      <div>
                        <div className="flex justify-between items-center mb-1 text-blue-400 font-bold uppercase tracking-wider">
                          <span>Input (Prompt)</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(log.prompt, log.id + 'in'); }}
                            className="hover:text-white transition-colors"
                          >
                            {copiedId === log.id + 'in' ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <pre className="bg-slate-950 p-2 rounded border border-slate-800 whitespace-pre-wrap break-all max-h-40 overflow-y-auto text-slate-300">
                          {log.prompt}
                        </pre>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1 text-emerald-400 font-bold uppercase tracking-wider">
                          <span>Output (Response)</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(log.response || log.error || '', log.id + 'out'); }}
                            className="hover:text-white transition-colors"
                          >
                            {copiedId === log.id + 'out' ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <pre className={'p-2 rounded border whitespace-pre-wrap break-all max-h-40 overflow-y-auto ' + (log.status === 'error' ? 'bg-red-950/20 border-red-900/30 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-300')}>
                          {log.response || log.error}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold tracking-widest">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Cpu size={10}/> GPU Híbrida</span>
          <span className="flex items-center gap-1"><Terminal size={10}/> Modo Root</span>
        </div>
        <span>v2.0.debug</span>
      </div>
    </motion.div>
  );
}
