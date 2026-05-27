// components/meg/EixoCard.tsx
'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import ProgressBar from './ProgressBar';

interface EixoProps {
  id: string;
  numero: number;
  nome: string;
  slug: string;
  icone: string;
  color: string;
  bgGradient: string;
  borderColor: string;
}

interface EixoCardProps {
  eixo: EixoProps;
  progresso: number;
  onClick: () => void;
}

export default function EixoCard({ eixo, progresso, onClick }: EixoCardProps) {
  // Resolve Lucide icon dynamically from string name
  const IconComponent = (Icons as any)[eixo.icone] || Icons.HelpCircle;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all duration-300 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md group relative overflow-hidden ${eixo.borderColor}`}
      title={`Acessar eixo ${eixo.numero}: ${eixo.nome}`}
    >
      {/* Decorative colored glow in background */}
      <div className={`absolute -right-12 -top-12 w-28 h-28 rounded-full bg-gradient-to-br ${eixo.bgGradient} blur-2xl group-hover:scale-125 transition-transform duration-500`} />

      {/* Header section with icon and number */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 border ${eixo.borderColor} shadow-inner shrink-0 transition-transform duration-300 group-hover:scale-110`}>
          <IconComponent className={`w-6 h-6 ${eixo.color}`} />
        </div>
        <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded-md font-mono">
          Eixo {eixo.numero}
        </span>
      </div>

      {/* Title and metadata */}
      <div className="space-y-1 relative z-10 flex-1">
        <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {eixo.nome}
        </h4>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Clique para ver as 5 fases e evidências pedagógicas
        </p>
      </div>

      {/* Footer section with progress bar */}
      <div className="w-full relative z-10 pt-2 border-t border-slate-100 dark:border-slate-700/30">
        <ProgressBar value={progresso} size="sm" />
      </div>
    </button>
  );
}
