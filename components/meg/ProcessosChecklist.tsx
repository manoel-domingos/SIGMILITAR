'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/lib/store';
import { processosByEixo, EVIDENCIA_FORM_MAP, type MegProcessoCriterio } from '@/lib/meg';
import { Check, AlertTriangle, X, FileText, Upload, Loader2 } from 'lucide-react';
import MegFormulario from './MegFormulario';

type StatusProcesso = 'pendente' | 'em_andamento' | 'concluido';

interface ProcessoRow {
  criterio: MegProcessoCriterio;
  status: StatusProcesso;
  observacao: string;
  arquivo_url: string | null;
  baseline2025?: { status: string; nota: number } | null;
}

interface ProcessosChecklistProps {
  eixoId: string;
  schoolId: string;
  readonly?: boolean;
  ano?: number;
  baseline2025?: Record<string, { status: string; nota: number }>;
  onScoreChange?: (obtida: number, maxima: number) => void;
}

const STATUS_CYCLE: StatusProcesso[] = ['pendente', 'em_andamento', 'concluido'];

const STATUS_STYLE: Record<StatusProcesso, { bg: string; icon: React.ReactNode; label: string }> = {
  pendente:     { bg: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400', icon: <X className="w-3 h-3" />, label: 'Pendente' },
  em_andamento: { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400', icon: <AlertTriangle className="w-3 h-3" />, label: 'Em andamento' },
  concluido:    { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400', icon: <Check className="w-3 h-3" />, label: 'Concluído' },
};

const BASELINE_LABELS: Record<string, string> = {
  possui: 'Possuía',
  nao_possui: 'Não Possuía',
  incompleto: 'Incompleto',
};

export default function ProcessosChecklist({
  eixoId,
  schoolId,
  readonly = false,
  ano = new Date().getFullYear(),
  baseline2025,
  onScoreChange,
}: ProcessosChecklistProps) {
  const { user } = useAppContext();
  const [rows, setRows] = useState<ProcessoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  const criterios = useMemo(() => processosByEixo(eixoId), [eixoId]);

  // Load checklist data from DB
  useEffect(() => {
    if (!schoolId || !eixoId) return;

    async function load() {
      setLoading(true);
      try {
        const evidenciaIds = criterios.map(c => c.id);
        const { data, error } = await supabase
          .from('meg_checklist')
          .select('evidencia_id, status, observacao, arquivo_url')
          .eq('school_id', schoolId)
          .eq('ano', ano)
          .in('evidencia_id', evidenciaIds);

        if (error) throw error;

        const dbMap: Record<string, any> = {};
        (data || []).forEach(r => { dbMap[r.evidencia_id] = r; });

        setRows(criterios.map(c => ({
          criterio: c,
          status: (dbMap[c.id]?.status as StatusProcesso) || 'pendente',
          observacao: dbMap[c.id]?.observacao || '',
          arquivo_url: dbMap[c.id]?.arquivo_url || null,
          baseline2025: baseline2025?.[c.id] ?? null,
        })));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eixoId, schoolId, ano, criterios, baseline2025]);

  // Score calculation
  useEffect(() => {
    if (!onScoreChange) return;
    const maxima = criterios.reduce((s, c) => s + c.pesoMax, 0);
    const obtida = rows.reduce((s, r) => {
      if (r.status === 'concluido') return s + r.criterio.pesoMax;
      if (r.status === 'em_andamento') return s + r.criterio.pesoMax * 0.5;
      return s;
    }, 0);
    onScoreChange(parseFloat(obtida.toFixed(2)), parseFloat(maxima.toFixed(2)));
  }, [rows, criterios, onScoreChange]);

  const handleCycleStatus = async (idx: number) => {
    if (readonly) return;
    const row = rows[idx];
    const currentIdx = STATUS_CYCLE.indexOf(row.status);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    setRows(prev => prev.map((r, i) => i === idx ? { ...r, status: nextStatus } : r));
    setSaving(prev => ({ ...prev, [row.criterio.id]: true }));

    try {
      await supabase.from('meg_checklist').upsert({
        school_id: schoolId,
        evidencia_id: row.criterio.id,
        ano,
        status: nextStatus,
        observacao: row.observacao,
        arquivo_url: row.arquivo_url,
        atualizado_por: user?.email ?? null,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'school_id,evidencia_id,ano' });
    } catch (err) {
      console.error('Erro ao salvar status:', err);
    } finally {
      setSaving(prev => ({ ...prev, [row.criterio.id]: false }));
    }
  };

  const handleObservacao = async (idx: number, value: string) => {
    if (readonly) return;
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, observacao: value } : r));
  };

  const handleObservacaoBlur = async (idx: number) => {
    if (readonly) return;
    const row = rows[idx];
    try {
      await supabase.from('meg_checklist').upsert({
        school_id: schoolId,
        evidencia_id: row.criterio.id,
        ano,
        status: row.status,
        observacao: row.observacao,
        arquivo_url: row.arquivo_url,
        atualizado_por: user?.email ?? null,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'school_id,evidencia_id,ano' });
    } catch (err) {
      console.error('Erro ao salvar observação:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Carregando critérios...</span>
      </div>
    );
  }

  // Group by grupo
  const grupos = Array.from(new Set(criterios.map(c => c.grupo)));

  return (
    <div className="space-y-6">
      {grupos.map(grupo => {
        const grupoRows = rows.filter(r => r.criterio.grupo === grupo);
        const concluidos = grupoRows.filter(r => r.status === 'concluido').length;
        const totalGrupo = grupoRows.length;

        return (
          <div key={grupo} className="space-y-1">
            {/* Grupo header */}
            <div className="flex items-center justify-between px-1 pb-1">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
                {grupo}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {concluidos}/{totalGrupo}
              </span>
            </div>

            <div className="border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-white/60 dark:bg-slate-900/40">
              {grupoRows.map((row, _) => {
                const idx = rows.findIndex(r => r.criterio.id === row.criterio.id);
                const style = STATUS_STYLE[row.status];
                const formConfig = EVIDENCIA_FORM_MAP[row.criterio.id];

                return (
                  <div key={row.criterio.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {/* Code badge */}
                      <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg shrink-0 mt-0.5">
                        {row.criterio.id}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                          {row.criterio.criterio}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                          📄 {row.criterio.documento}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {/* Peso badge */}
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                            meta: {row.criterio.pesoMax} pts
                          </span>
                          {/* Baseline 2025 badge */}
                          {row.baseline2025 && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                              2025: {BASELINE_LABELS[row.baseline2025.status] ?? row.baseline2025.status} ({row.baseline2025.nota} pts)
                            </span>
                          )}
                          {/* arquivo URL */}
                          {row.arquivo_url && (
                            <a
                              href={row.arquivo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 underline flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              Arquivo
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Status toggle */}
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleCycleStatus(idx)}
                          disabled={readonly || saving[row.criterio.id]}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-extrabold transition active:scale-95 disabled:opacity-60 ${style.bg}`}
                          title={readonly ? style.label : `Clique para avançar status`}
                        >
                          {saving[row.criterio.id] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : style.icon}
                          {style.label}
                        </button>
                        {formConfig && !readonly && (
                          <button
                            onClick={() => setActiveFormId(row.criterio.id)}
                            className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            Preencher formulário
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Observação */}
                    {(row.status !== 'pendente' || !readonly) && (
                      <textarea
                        value={row.observacao}
                        onChange={e => handleObservacao(idx, e.target.value)}
                        onBlur={() => handleObservacaoBlur(idx)}
                        disabled={readonly}
                        placeholder={readonly ? '' : 'Observações sobre este critério...'}
                        rows={2}
                        className="w-full text-[11px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-60 resize-none leading-relaxed"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Digital form modal */}
      {activeFormId && (
        <MegFormulario
          tipo={EVIDENCIA_FORM_MAP[activeFormId]?.tipo ?? activeFormId}
          evidenciaId={activeFormId}
          schoolId={schoolId}
          readonly={readonly ?? false}
          onClose={() => setActiveFormId(null)}
          onSaveSuccess={() => setActiveFormId(null)}
        />
      )}
    </div>
  );
}
