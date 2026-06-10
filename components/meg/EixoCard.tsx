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
  maxProcessos: number;
  maxResultado: number;
}

interface EixoCardProps {
  eixo: EixoProps;
  progressoAtual: number;         // % conclusão dos processos do ano atual (0-100)
  notaProcessos2025?: number;     // pts processos do baseline 2025 da escola
  notaResultado2025?: number;     // pts resultado do baseline 2025 da escola
  notaProcessosAtual?: number;    // pts processos calculados do ano atual
  notaResultadoAtual?: number;    // pts resultado do ano atual
  onClick: () => void;
}

export default function EixoCard({
  eixo,
  progressoAtual,
  notaProcessos2025,
  notaResultado2025,
  notaProcessosAtual,
  notaResultadoAtual,
  onClick,
}: EixoCardProps) {
  const IconComponent = (Icons as any)[eixo.icone] || Icons.HelpCircle;
  const meta = eixo.maxProcessos + eixo.maxResultado;

  const nota2025 = notaProcessos2025 !== undefined && notaResultado2025 !== undefined
    ? parseFloat((notaProcessos2025 + notaResultado2025).toFixed(2))
    : undefined;

  const notaAtual = notaProcessosAtual !== undefined && notaResultadoAtual !== undefined
    ? parseFloat((notaProcessosAtual + notaResultadoAtual).toFixed(2))
    : undefined;

  const gap = nota2025 !== undefined && notaAtual !== undefined
    ? parseFloat((notaAtual - nota2025).toFixed(2))
    : undefined;

  const pct2025 = nota2025 !== undefined ? parseFloat(((nota2025 / meta) * 100).toFixed(1)) : undefined;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all duration-300 flex flex-col justify-between gap-5 shadow-sm hover:shadow-md group relative overflow-hidden ${eixo.borderColor}`}
      title={`Acessar eixo ${eixo.numero}: ${eixo.nome}`}
    >
      {/* Decorative glow */}
      <div className={`absolute -right-12 -top-12 w-28 h-28 rounded-full bg-gradient-to-br ${eixo.bgGradient} blur-2xl group-hover:scale-125 transition-transform duration-500`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 border ${eixo.borderColor} shadow-inner shrink-0 transition-transform duration-300 group-hover:scale-110`}>
          <IconComponent className={`w-6 h-6 ${eixo.color}`} />
        </div>
        <div className="text-right space-y-0.5">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded-md font-mono block">
            Eixo {eixo.numero}
          </span>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">
            meta {meta} pts
          </span>
        </div>
      </div>

      {/* Nome */}
      <div className="relative z-10">
        <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {eixo.nome}
        </h4>
      </div>

      {/* Scores 2025 vs atual */}
      {(nota2025 !== undefined || notaAtual !== undefined) && (
        <div className="relative z-10 grid grid-cols-2 gap-2">
          {nota2025 !== undefined && (
            <div className="p-2 rounded-xl bg-indigo-500/8 border border-indigo-500/15 dark:bg-indigo-500/10">
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">2025</p>
              <p className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-100">
                {nota2025} <span className="text-[10px] text-slate-400 font-normal">pts</span>
              </p>
              <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">{pct2025}%</p>
            </div>
          )}
          {notaAtual !== undefined && (
            <div className={`p-2 rounded-xl border ${
              gap !== undefined
                ? gap >= 0
                  ? 'bg-emerald-500/8 border-emerald-500/15 dark:bg-emerald-500/10'
                  : 'bg-rose-500/8 border-rose-500/15 dark:bg-rose-500/10'
                : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/40'
            }`}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Atual</p>
              <p className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-100">
                {notaAtual} <span className="text-[10px] text-slate-400 font-normal">pts</span>
              </p>
              {gap !== undefined && (
                <p className={`text-[10px] font-bold ${gap >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {gap >= 0 ? '+' : ''}{gap} pts
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full relative z-10 pt-2 border-t border-slate-100 dark:border-slate-700/30 space-y-1">
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>Processos {new Date().getFullYear()}</span>
          <span>{Math.round(progressoAtual)}%</span>
        </div>
        <ProgressBar value={progressoAtual} size="sm" showText={false} />
      </div>
    </button>
  );
}
