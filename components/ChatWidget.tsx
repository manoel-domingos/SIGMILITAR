"use client";
import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function ChatWidget({ forceOpen, forceOnClose }: { forceOpen?: boolean, forceOnClose?: () => void }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = forceOpen !== undefined ? forceOpen : internalIsOpen;
  
  const handleClose = () => {
    if (forceOnClose) forceOnClose();
    else setInternalIsOpen(false);
  };

  const [messages, setMessages] = useState<{role: 'user' | 'agent', text: string}[]>([
    { role: 'agent', text: 'Olá! O painel de importação melhorou, conseguimos recuperar os telefones e tentar adivinhar a linha do cabeçalho de forma mais inteligente. O que acha de uma interface manual para selecionar as linhas caso falhe? Podemos implementar depois.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'agent', text: 'Entendido! Estou registrando suas ideias para nossa próxima iteração.' }]);
    }, 1000);
  };

  if (forceOpen && !isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[999]">
      {isOpen ? (
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-80 flex flex-col overflow-hidden transition-all duration-300">
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Chat de Suporte</span>
            </div>
            <button onClick={handleClose} className="text-blue-100 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-64 flex flex-col flex-1 p-3 overflow-y-auto gap-3 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={'max-w-[85%] rounded-lg p-2.5 text-sm ' + (msg.role === 'agent' ? 'bg-white border border-slate-100 text-slate-800 self-start' : 'bg-blue-600 text-white self-end')}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 p-2 bg-white flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..." 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : forceOpen === undefined ? (
        <button 
          onClick={() => setInternalIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center animate-bounce duration-1000"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      ) : null}
    </div>
  );
}
