'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/lib/store';
import {
  resultadosByEixo, calcResultadoScore,
  CONFORMIDADE_LABELS, CONFORMIDADE_COLORS,
  type MegConformidade, type MegResultadoItem,
} from '@/lib/meg';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';

interface ResultadoRow {
  item: MegResultadoItem;
  resposta: MegConformidade | null;
}

interface ResultadoEstruturalChecklistProps {
  eixoId: string;
  schoolId: string;
  readonly?: boolean;
  ano?: number;
  baseline2025Resultado?: number; // pontuacao_obtida 2025 p/ badge
  onScoreChange?: (obtida: number, maxima: number) => void;
}

const CONFORMIDADE_ORDER: MegConformidade[] = ['satisfatorio', 'parcial', 'nao_conforme', 'na'];

const CONFORMIDADE_BUTTON: Record<MegConformidade, { label: string; short: string; cls: string }> = {
  satisfatorio: { label: 'Satisfatoriamente Conforme', short: 'S', cls: 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' },
  parcial:      { label: 'Parcialmente Conforme',      short: 'P', cls: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' },
  nao_conforme: { label: 'Não Conforme',               short: 'N', cls: 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600' },
  na:           { label: 'Não se Aplica',              short: 'NA', cls: 'bg-slate-300 text-slate-700 border-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' },
};

export default function ResultadoEstruturalChecklist({
  eixoId,
  schoolId,
  readonly = false,
  ano = new Date().getFullYear(),
  baseline2025Resultado,
  onScoreChange,
}: ResultadoEstruturalChecklistProps) {
  const { user } = useAppContext();
  const [rows, setRows] = useState<ResultadoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [saved, setSaved] = useState(false);

  const itens = useMemo(() => resultadosByEixo(eixoId), [eixoId]);

  useEffect(() => {
    if (!schoolId || !eixoId) return;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('meg_avaliacao_resultados')
          .select('respostas, observacoes')
          .eq('school_id', schoolId)
          .eq('eixo_id', eixoId)
          .gte('data_avaliacao', `${ano}-01-01`)
          .lte('data_avaliacao', `${ano}-12-31`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const respostasDB: Record<string, MegConformidade> = data?.respostas || {};
        setObservacoes(data?.observacoes || '');
        setRows(itens.map(it => ({
          item: it,
          resposta: respostasDB[it.id] ?? null,
        })));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eixoId, schoolId, ano, itens]);

  const respostasMap = useMemo(() => {
    const map: Record<string, MegConformidade> = {};
    rows.forEach(r => { if (r.resposta) map[r.item.id] = r.resposta; });
    return map;
  }, [rows]);

  const score = useMemo(() => calcResultadoScore(eixoId, respostasMap), [eixoId, respostasMap]);

  useEffect(() => {
    onScoreChange?.(score.obtida, score.maxima);
  }, [score.obtida, score.maxima, onScoreChange]);

  const handleResposta = (idx: number, val: MegConformidade) => {
    if (readonly) return;
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, resposta: val } : r));
    setSaved(false);
  };

  const handleSave = async () => {
    if (readonly || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('meg_avaliacao_resultados')
        .upsert({
          school_id: schoolId,
          eixo_id: eixoId,
          avaliador: user?.email ?? 'Avaliador',
          data_avaliacao: new Date().toISOString().split('T')[0],
          respostas: respostasMap,
          pontuacao_obtida: score.obtida,
          pontuacao_maxima: score.maxima > 0 ? score.maxima : (itens.filter(i => !i.opcional).reduce((s, i) => s + i.pesoMax, 0)),
          percentual: score.percentual,
          observacoes,
        }, { onConflict: 'eixo_id,school_id,data_avaliacao' });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Carregando checklist...</span>
      </div>
    );
  }

  const ambientes = Array.from(new Set(itens.map(i => i.ambiente)));

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-amber-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400">
            Pontuação de Resultado Estrutural
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Vistoria in loco — escala de conformidade do PDF SEDUC-MT
          </p>
          {baseline2025Resultado !== undefined && (
            <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              2025 (oficial): {baseline2025Resultado.toFixed(2)} pts
            </p>
          )}
        </div>
        <div className="text-center sm:text-right shrink-0">
          <p className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-100">
            {score.obtida}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {score.maxima > 0 ? score.maxima : '...'} pts</span>
          </p>
          <p className="text-[10px] font-bold text-emerald-600 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
            {score.percentual}%
          </p>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-2 px-1">
        {CONFORMIDADE_ORDER.map(c => (
          <span key={c} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${CONFORMIDADE_BUTTON[c].cls}`}>
            <span className="font-black">{CONFORMIDADE_BUTTON[c].short}</span>
            {CONFORMIDADE_LABELS[c]}
          </span>
        ))}
      </div>

      {/* Itens por ambiente */}
      {ambientes.map(ambiente => {
        const ambienteRows = rows.filter(r => r.item.ambiente === ambiente);
        const respondidos = ambienteRows.filter(r => r.resposta !== null).length;

        return (
          <div key={ambiente} className="space-y-1">
            <div className="flex items-center justify-between px-1 pb-1">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
                {ambiente}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {respondidos}/{ambienteRows.length} avaliados
              </span>
            </div>

            <div className="border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-white/60 dark:bg-slate-900/40">
              {ambienteRows.map((row) => {
                const globalIdx = rows.findIndex(r => r.item.id === row.item.id);

                return (
                  <div
                    key={row.item.id}
                    className={`p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-opacity ${
                      row.resposta === 'na' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                          {row.item.id.replace('e', 'E').split('_r')[1] ?? row.item.id}
                        </span>
                        {row.item.opcional && (
                          <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md tracking-wider shrink-0">
                            Opcional
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {row.item.pesoMax} pts
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                        {row.item.item}
                      </p>
                    </div>

                    {/* Botões de conformidade */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                      {CONFORMIDADE_ORDER.map(c => (
                        <button
                          key={c}
                          onClick={() => handleResposta(globalIdx, c)}
                          disabled={readonly}
                          title={CONFORMIDADE_LABELS[c]}
                          className={`w-7 h-7 sm:w-8 sm:h-8 text-[10px] font-extrabold rounded-lg border transition active:scale-95 disabled:cursor-not-allowed flex items-center justify-center
                            ${row.resposta === c
                              ? CONFORMIDADE_BUTTON[c].cls
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                        >
                          {CONFORMIDADE_BUTTON[c].short}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Observações */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Observações do Avaliador
        </label>
        <textarea
          value={observacoes}
          onChange={e => setObservacoes(e.target.value)}
          disabled={readonly}
          placeholder={readonly ? '' : 'Observações, pendências ou justificativas in loco...'}
          rows={3}
          className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-70 resize-none"
        />
      </div>

      {/* Save button */}
      {!readonly && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-3 text-sm font-extrabold rounded-2xl transition flex items-center gap-2 active:scale-95 disabled:opacity-70 shadow-sm ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? 'Salvo!' : 'Salvar Avaliação'}
          </button>
        </div>
      )}
    </div>
  );
}
