// lib/meg/index.ts
// Ponto de entrada do módulo MEG — helpers puros (sem dados de escola)

export * from './eixos';
export * from './processos';
export * from './resultados';
export * from './forms';

import { MEG_EIXOS, MEG_TOTAIS, type MegEixo } from './eixos';
import { MEG_PROCESSOS, type MegProcessoCriterio } from './processos';
import { MEG_RESULTADO_ITENS, CONFORMIDADE_RATIOS, type MegResultadoItem, type MegConformidade } from './resultados';

// ─── Lookups ─────────────────────────────────────────────────────────────────

export function getEixoBySlug(slug: string): MegEixo | undefined {
  return MEG_EIXOS.find(e => e.slug === slug);
}

export function getEixoById(id: string): MegEixo | undefined {
  return MEG_EIXOS.find(e => e.id === id);
}

export function processosByEixo(eixoId: string): MegProcessoCriterio[] {
  return MEG_PROCESSOS.filter(p => p.eixoId === eixoId);
}

export function resultadosByEixo(eixoId: string): MegResultadoItem[] {
  return MEG_RESULTADO_ITENS.filter(r => r.eixoId === eixoId);
}

// ─── Cálculo de Processos ────────────────────────────────────────────────────

export type StatusProcesso = 'possui' | 'nao_possui' | 'incompleto' | null;

export interface RespostasProcessos {
  [criterioId: string]: { status: StatusProcesso; nota?: number };
}

export function calcProcessosScore(
  eixoId: string,
  respostas: RespostasProcessos
): { obtida: number; maxima: number; percentual: number } {
  const criterios = processosByEixo(eixoId);
  const maxima = criterios.reduce((s, c) => s + c.pesoMax, 0);
  let obtida = 0;

  criterios.forEach(c => {
    const r = respostas[c.id];
    if (!r) return;
    if (r.nota !== undefined) {
      obtida += r.nota;
    } else {
      if (r.status === 'possui') obtida += c.pesoMax;
      else if (r.status === 'incompleto') obtida += c.pesoMax * 0.5;
    }
  });

  return {
    obtida: parseFloat(obtida.toFixed(2)),
    maxima: parseFloat(maxima.toFixed(2)),
    percentual: maxima > 0 ? parseFloat(((obtida / maxima) * 100).toFixed(1)) : 0,
  };
}

// ─── Cálculo de Resultado Estrutural ────────────────────────────────────────

export interface RespostasResultado {
  [itemId: string]: MegConformidade;
}

export function calcResultadoScore(
  eixoId: string,
  respostas: RespostasResultado
): { obtida: number; maxima: number; percentual: number } {
  const itens = resultadosByEixo(eixoId);
  let maxima = 0;
  let obtida = 0;

  itens.forEach(it => {
    const resp = respostas[it.id];
    if (resp === 'na') return; // NA exclui do denominador
    maxima += it.pesoMax;
    if (resp) {
      obtida += it.pesoMax * CONFORMIDADE_RATIOS[resp];
    }
  });

  return {
    obtida: parseFloat(obtida.toFixed(2)),
    maxima: parseFloat(maxima.toFixed(2)),
    percentual: maxima > 0 ? parseFloat(((obtida / maxima) * 100).toFixed(1)) : 0,
  };
}

// ─── Cálculo Total por Eixo ──────────────────────────────────────────────────

export function calcEixoTotal(
  processosObtida: number,
  resultadoObtida: number,
  eixoId: string
): { totalObtida: number; totalMaxima: number; percentual: number } {
  const eixo = getEixoById(eixoId);
  const totalMaxima = (eixo?.maxProcessos ?? 75) + (eixo?.maxResultado ?? 110);
  const totalObtida = parseFloat((processosObtida + resultadoObtida).toFixed(2));
  return {
    totalObtida,
    totalMaxima,
    percentual: totalMaxima > 0 ? parseFloat(((totalObtida / totalMaxima) * 100).toFixed(1)) : 0,
  };
}

// ─── Classificação MEG ───────────────────────────────────────────────────────

export function getMegClassificacao(totalObtida: number): { label: string; color: string } {
  if (totalObtida >= 900) return { label: 'Excelente 🏆', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400' };
  if (totalObtida >= 700) return { label: 'Satisfatório 👍', color: 'text-blue-600 bg-blue-500/10 border-blue-500/30 dark:text-blue-400' };
  if (totalObtida >= 500) return { label: 'Parcialmente Conforme ⚠️', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30 dark:text-amber-400' };
  if (totalObtida >= 300) return { label: 'Pouco Conforme 🛑', color: 'text-orange-600 bg-orange-500/10 border-orange-500/30 dark:text-orange-400' };
  return { label: 'Não Conforme', color: 'text-rose-500 bg-rose-500/10 border-rose-500/25' };
}

export { MEG_EIXOS, MEG_TOTAIS };
