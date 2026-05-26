'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { Award, AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/lib/store';

export default function FechamentoAno() {
  const { students, currentUserRole } = useAppContext();
  const [confirmText, setConfirmText] = useState('');

  if (currentUserRole !== 'GESTOR') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-12 text-center">
           <AlertTriangle className="w-12 h-12 text-orange-400 mb-4" />
           <h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2>
           <p className="text-slate-500 mt-2">Somente gestores podem realizar o fechamento do ano letivo.</p>
        </div>
      </AppShell>
    );
  }

  const handleCloseYear = () => {
    if (confirmText !== 'FECHAR 2026') return;
    alert('Ano letivo fechado! Todas as notas atuais foram salvas como base para o ano seguinte. Novo ano letivo: 2027 iniciado.');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-blue-400 mb-1">
          <Award className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Ação Crítica</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Fechamento do Ano Letivo</h1>

        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl text-slate-600">
           <div className="flex items-start gap-4 mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
             <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
             <div>
               <h3 className="font-bold text-red-400 mb-1">Atenção: Ação Irreversível</h3>
               <p className="text-sm text-red-200">
                 O fechamento do ano letivo irá consolidar todas as ocorrências e notas de comportamento. 
                 As notas finais ({students.length} alunos) se tornarão o ponto de partida (nota base) para o próximo ano letivo, conforme previsto no regulamento.
               </p>
             </div>
           </div>
           
           <div className="space-y-4 mb-6">
             <label className="block text-sm font-medium">Digite <strong className="text-slate-800 select-all">FECHAR 2026</strong> para confirmar:</label>
             <input 
               type="text" 
               value={confirmText}
               onChange={(e) => setConfirmText(e.target.value)}
               className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800" 
               placeholder="FECHAR 2026"
             />
           </div>

           <button 
             onClick={handleCloseYear}
             disabled={confirmText !== 'FECHAR 2026'}
             className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium w-full transition"
           >
             Encerrar Ano Letivo e Iniciar 2027
           </button>
        </div>
      </div>
    </AppShell>
  );
}
