'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from 'recharts';
import { MEG_EIXOS } from '@/lib/meg';

interface BarDataPoint {
  eixo: string;
  processos2025?: number;
  resultado2025?: number;
  processosAtual?: number;
  resultadoAtual?: number;
  maxProcessos: number;
  maxResultado: number;
}

interface MegBarChartProps {
  data: {
    eixoId: string;
    processos2025?: number;
    resultado2025?: number;
    processosAtual?: number;
    resultadoAtual?: number;
  }[];
  titulo?: string;
  altura?: number;
}

export default function MegBarChart({ data, titulo, altura = 280 }: MegBarChartProps) {
  const chartData: BarDataPoint[] = data.map(d => {
    const eixo = MEG_EIXOS.find(e => e.id === d.eixoId);
    return {
      eixo: `E${eixo?.numero ?? '?'}`,
      processos2025: d.processos2025,
      resultado2025: d.resultado2025,
      processosAtual: d.processosAtual,
      resultadoAtual: d.resultadoAtual,
      maxProcessos: eixo?.maxProcessos ?? 75,
      maxResultado: eixo?.maxResultado ?? 110,
    };
  });

  const has2025 = data.some(d => d.processos2025 !== undefined || d.resultado2025 !== undefined);
  const hasAtual = data.some(d => d.processosAtual !== undefined || d.resultadoAtual !== undefined);

  return (
    <div className="space-y-2">
      {titulo && (
        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-center">
          {titulo}
        </p>
      )}
      <ResponsiveContainer width="100%" height={altura}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="eixo"
            tick={{ fontSize: 11, fontWeight: 700 }}
            className="text-slate-500"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            className="text-slate-400"
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(15,23,42,0.9)',
              color: '#e2e8f0',
            }}
          />
          {(has2025 || hasAtual) && (
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          )}
          {has2025 && (
            <Bar dataKey="processos2025" name="Proc. 2025" fill="#3b82f6" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={28} />
          )}
          {has2025 && (
            <Bar dataKey="resultado2025" name="Res. 2025" fill="#6366f1" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={28} />
          )}
          {hasAtual && (
            <Bar dataKey="processosAtual" name="Proc. Atual" fill="#10b981" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={28} />
          )}
          {hasAtual && (
            <Bar dataKey="resultadoAtual" name="Res. Atual" fill="#34d399" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={28} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
