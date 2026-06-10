'use client';

import React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, Tooltip, ResponsiveContainer
} from 'recharts';
import { MEG_EIXOS } from '@/lib/meg';

interface RadarDataPoint {
  eixo: string;
  meta: number;
  atual?: number;
  baseline2025?: number;
}

interface MegRadarChartProps {
  data: {
    eixoId: string;
    meta: number;
    atual?: number;
    baseline2025?: number;
  }[];
  titulo?: string;
  altura?: number;
}

export default function MegRadarChart({ data, titulo, altura = 320 }: MegRadarChartProps) {
  const chartData: RadarDataPoint[] = data.map(d => {
    const eixo = MEG_EIXOS.find(e => e.id === d.eixoId);
    return {
      eixo: `E${eixo?.numero ?? '?'}`,
      meta: 100,
      atual: d.atual !== undefined ? parseFloat(((d.atual / d.meta) * 100).toFixed(1)) : undefined,
      baseline2025: d.baseline2025 !== undefined ? parseFloat(((d.baseline2025 / d.meta) * 100).toFixed(1)) : undefined,
    };
  });

  const has2025 = data.some(d => d.baseline2025 !== undefined);
  const hasAtual = data.some(d => d.atual !== undefined);

  return (
    <div className="space-y-2">
      {titulo && (
        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-center">
          {titulo}
        </p>
      )}
      <ResponsiveContainer width="100%" height={altura}>
        <RadarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="rgba(148,163,184,0.2)" />
          <PolarAngleAxis
            dataKey="eixo"
            tick={{ fontSize: 11, fontWeight: 700, fill: 'currentColor' }}
            className="text-slate-500 dark:text-slate-400"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={6}
            tick={{ fontSize: 9, fill: 'rgba(148,163,184,0.6)' }}
          />
          {has2025 && (
            <Radar
              name="2025 (oficial)"
              dataKey="baseline2025"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          )}
          {hasAtual && (
            <Radar
              name={new Date().getFullYear().toString()}
              dataKey="atual"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          )}
          <Tooltip
            formatter={(value: number) => [`${value}%`]}
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(15,23,42,0.9)',
              color: '#e2e8f0',
            }}
          />
          {(has2025 || hasAtual) && (
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 11 }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
