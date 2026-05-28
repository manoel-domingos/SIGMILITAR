// components/meg/MegChecklist.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Loader2, Save, AlertCircle, HelpCircle, ShieldCheck, 
  ToggleLeft, ToggleRight, FileText, CheckCircle2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/lib/store';

interface MegChecklistProps {
  eixoId: string;
  schoolId: string;
  readonly: boolean;
  onSaveSuccess: (msg: string) => void;
  onSaveError: (msg: string) => void;
}

export interface ChecklistItem {
  id: string;
  texto: string;
  opcional?: boolean;
  isBinary?: boolean; // 0 or 4 points
}

// Static Checklist configurations per axis (based on real documents)
const CHECKLIST_DEFINITIONS: Record<string, ChecklistItem[]> = {
  'patrimonio': [
    { id: '1.1', texto: 'Conservação dos Bens Móveis (estado físico do mobiliário por ambiente: Sala de Aula, Secretaria, Diretoria, Laboratório, Biblioteca, Refeitório, Cozinha, Banheiros, Quadra, Depósito, Sala dos Professores)' },
    { id: '1.2', texto: 'Emplaquetamento e Registro Patrimonial (% de bens móveis com placa de patrimônio oficial legível e cadastrada)' },
    { id: '1.3', texto: 'Conformidade Patrimonial: bens de alto valor estão fisicamente presentes na unidade escolar conforme a lista consolidada' },
    { id: '1.4', texto: 'Alocação Correta: bens móveis encontram-se nos respectivos ambientes designados sem deslocamentos indevidos' }
  ],
  'lideranca': [
    { id: '2.1', texto: '1.1 Merendeiras: Utilizar uniformes completos, limpos e em bom estado de conservação' },
    { id: '2.2', texto: '1.2 Merendeiras: Disponibilizar e utilizar corretamente luvas, toucas, aventais e calçados fechados' },
    { id: '2.3', texto: '2.1 Alimentos e Cardápios: Seguir rigorosamente o cardápio oficial de alimentação escolar' },
    { id: '2.4', texto: '2.2 Alimentos e Cardápios: Gêneros alimentícios adquiridos pertencem às marcas homologadas/adjudicadas' },
    { id: '2.5', texto: '2.3 Alimentos e Cardápios: Dispor e organizar os alimentos na prateleira da despensa de forma higiênica e adequada' },
    { id: '2.6', texto: '3.1 Equipamentos e Utensílios: Equipamentos e mobiliários da cozinha funcionando normalmente (freezers, geladeiras, fogão)' },
    { id: '2.7', texto: '3.2 Equipamentos e Utensílios: Inexistência de móveis de madeira na cozinha (em conformidade com as regras ANVISA)' },
    { id: '2.8', texto: '3.3 Equipamentos e Utensílios: Utilização de utensílios em materiais permitidos, sem utensílios de madeira (regras ANVISA)' },
    { id: '2.9', texto: '3.4 Equipamentos e Utensílios: Existência de lixeiras com tampa acionada por pedal e saco plástico' },
    { id: '2.10', texto: '3.5 Equipamentos e Utensílios: Existência de despensa separada da área de preparo da cozinha' },
    { id: '2.11', texto: '3.6 Equipamentos e Utensílios: Limpeza e higienização interna e externa periódica dos freezers e geladeiras' },
    { id: '2.12', texto: '3.7 Equipamentos e Utensílios: Presença de tela milimétrica instalada nas portas e janelas da cozinha' }
  ],
  'pedagogico': [
    { id: '3.1', texto: 'Ambientes Gerais: Aparelhos de TV, Armários, Balcões, Batentes e Bebedouros limpos e livres de pó/resíduos' },
    { id: '3.2', texto: 'Ambientes Gerais: Cadeiras, Carteiras, Cestos de lixo, Cortinas e Corrimãos higienizados e bem conservados' },
    { id: '3.3', texto: 'Ambientes Gerais: Divisórias, Dispensadores de papel toalha e papel higiênico abastecidos e higienizados' },
    { id: '3.4', texto: 'Ambientes Gerais: Escadas, Extintores de incêndio, Espelhos e Interruptores limpos e funcionais' },
    { id: '3.5', texto: 'Ambientes Gerais: Mesas, Murais, Móveis em geral e Prateleiras sem acúmulo de sujeira ou poeira' },
    { id: '3.6', texto: 'Ambientes Gerais: Paredes, Pias, Torneiras e Placas indicativas devidamente conservadas e limpas' },
    { id: '3.7', texto: 'Ambientes Gerais: Tomadas, Pisos, Peitoril das janelas, Portas e Persianas higienizados de forma periódica' },
    { id: '3.8', texto: 'Ambientes Gerais: Quadros brancos/negros, Ralos e Rodapés limpos e sem obstruções em todos os ambientes' }
  ],
  'gestao-escolar': [
    { id: '4.1', texto: '1.1 Geral: Sistema Construtivo e alvenaria sem patologias graves aparentes' },
    { id: '4.2', texto: '1.2 Geral: Coberturas e telhados sem vazamentos ou infiltrações' },
    { id: '4.3', texto: '1.3 Geral: Forros e tetos em perfeitas condições [OPCIONAL]', opcional: true },
    { id: '4.4', texto: '1.4 Geral: Pisos e revestimentos sem quebras ou desgastes graves' },
    { id: '4.5', texto: '1.5 Geral: Pintura interna e externa limpa e bem conservada' },
    { id: '4.6', texto: '1.6 Geral: Esquadrias, portas e janelas abrindo e fechando corretamente' },
    { id: '4.7', texto: '1.7 Geral: Áreas Molhadas (louças, metais, bancadas e divisórias dos sanitários)' },
    { id: '4.8', texto: '1.8 Geral: Piscina e Casa de Máquinas limpas e em conformidade [OPCIONAL]', opcional: true },
    { id: '4.9', texto: '2.1 Instalações Elétricas: Redes de Baixa Tensão e quadros elétricos seguros e tampados' },
    { id: '4.10', texto: '3.1 Instalações Hidrossanitárias: Caixa d\'água e Cisterna limpas e vedadas' },
    { id: '4.11', texto: '3.2 Instalações Hidrossanitárias: Ralos e sifões sem vazamento ou entupimento' },
    { id: '4.12', texto: '3.3 Instalações Hidrossanitárias: Válvulas e registros de água funcionando corretamente' },
    { id: '4.13', texto: '3.4 Instalações Hidrossanitárias: Sistema de Tratamento de Esgoto / Fossa Séptica' },
    { id: '4.14', texto: '3.5 Instalações Hidrossanitárias: Caixas de Gordura higienizadas e desobstruídas' },
    { id: '4.15', texto: '3.6 Instalações Hidrossanitárias: Instalações e abrigos de Gás conformes [OPCIONAL]', opcional: true },
    { id: '4.16', texto: '4.1 Combate a Incêndio: Extintores de incêndio com carga dentro da validade' },
    { id: '4.17', texto: '4.2 Combate a Incêndio: Hidrantes e Mangueiras em perfeito estado [OPCIONAL]', opcional: true },
    { id: '4.18', texto: '4.3 Combate a Incêndio: Sinalização de Emergência e Rotas de Fuga desobstruídas [OPCIONAL]', opcional: true },
    { id: '4.19', texto: '4.4 Combate a Incêndio: Sistemas de acionamento de alarme conformes [OPCIONAL]', opcional: true },
    { id: '4.20', texto: '5.1 Implantação: Pórtico da escola bem conservado e com logo oficial [OPCIONAL]', opcional: true },
    { id: '4.21', texto: '5.2 Implantação: Muro e gradil da escola seguros e pintados' },
    { id: '4.22', texto: '5.3 Implantação: Depósito de resíduos sólidos (lixeira externa) estruturado [OPCIONAL]', opcional: true },
    { id: '4.23', texto: '5.4 Implantação: Calçamentos externos e acessos seguros sem buracos' },
    { id: '4.24', texto: '5.5 Implantação: Paisagismo e áreas verdes limpas e cuidadas [OPCIONAL]', opcional: true },
    { id: '4.25', texto: '6.1 Acessibilidade: Escadas e rampas com rampa de acesso normativa [OPCIONAL]', opcional: true },
    { id: '4.26', texto: '6.2 Acessibilidade: Corrimão, guarda-corpo e barras de apoio em banheiros PNE [OPCIONAL]', opcional: true },
    { id: '4.27', texto: '6.3 Acessibilidade: Placas de sinalização PNE, mapas e pisos táteis [OPCIONAL]', opcional: true },
    { id: '4.28', texto: '7.1 Quadra Poliesportiva: Pintura, traves, redes e demarcação da quadra [OPCIONAL]', opcional: true }
  ],
  'clima-escolar': [
    { id: '5.1', texto: '1.1 Busca Ativa: Índice de Abandono Escolar mantido abaixo da meta anual' },
    { id: '5.2', texto: '1.2 Busca Ativa: Índice de Evasão Escolar zerado ou reduzido drasticamente' },
    { id: '5.3', texto: '2.1 Gestão Financeira: Alimentação Escolar executada e prestada conta de forma regular', isBinary: true },
    { id: '5.4', texto: '2.2 Gestão Financeira: Recurso Único (RU) executado em conformidade com plano de aplicação', isBinary: true },
    { id: '5.5', texto: '2.3 Gestão Financeira: PDDE Estrutura (Módulos Concluídos: Água, Esgoto, Sanitário, Sala de Recursos)' },
    { id: '5.6', texto: '2.4 Gestão Financeira: PDDE Qualidade (Execução Física e Pedagógica de Itinerários, Inovação, Educação Integral)' },
    { id: '5.7', texto: '2.5 Gestão Financeira: PDDE Básico (Regularidade na execução e saldo conciliado)' },
    { id: '5.8', texto: '3.1 Pedagógico: Desempenho geral nas avaliações do Avalia MT (escala 0-4)' },
    { id: '5.9', texto: '3.2 Pedagógico: Taxa de participação dos alunos matriculados no Avalia MT acima de 85%' }
  ]
};

// Max point value of Results for this eixo
const PONTUACAO_MAXIMA_EIXOS: Record<string, number> = {
  'patrimonio': 110,
  'lideranca': 110,
  'pedagogico': 110,
  'gestao-escolar': 110,
  'clima-escolar': 160
};

export default function MegChecklist({
  eixoId,
  schoolId,
  readonly,
  onSaveSuccess,
  onSaveError
}: MegChecklistProps) {
  const { user } = useAppContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [opcionaisNaoPossui, setOpcionaisNaoPossui] = useState<Record<string, boolean>>({});
  const [observacoes, setObservacoes] = useState<string>('');
  const [hasData, setHasData] = useState<boolean>(false);

  const items = CHECKLIST_DEFINITIONS[eixoId] || [];
  const maxScore = PONTUACAO_MAXIMA_EIXOS[eixoId] || 110;

  // Load existing results evaluation from database
  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('meg_avaliacao_resultados')
          .select('*')
          .eq('eixo_id', eixoId)
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const resp = data.respostas || {};
          setRespostas(resp);
          setObservacoes(data.observacoes || '');
          
          // Map N/A answers back to opcionaisNaoPossui toggles
          const optToggles: Record<string, boolean> = {};
          items.forEach(it => {
            if (it.opcional && resp[it.id] === 'NA') {
              optToggles[it.id] = true;
            }
          });
          setOpcionaisNaoPossui(optToggles);
          setHasData(true);
        } else {
          // Initialize empty answers
          const initialResp: Record<string, any> = {};
          items.forEach(it => {
            initialResp[it.id] = it.isBinary ? 0 : 4; // Default to best or zero for binary
          });
          setRespostas(initialResp);
          setOpcionaisNaoPossui({});
          setObservacoes('');
          setHasData(false);
        }
      } catch (err: any) {
        console.error('Error loading results checklist:', err);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [eixoId, schoolId, items]);

  // Handle Score selection
  const handleScoreChange = (itemId: string, val: any) => {
    if (readonly) return;
    setRespostas(prev => ({
      ...prev,
      [itemId]: val
    }));
  };

  // Handle Optional Toggle
  const handleToggleOpcional = (itemId: string, checked: boolean) => {
    if (readonly) return;
    setOpcionaisNaoPossui(prev => ({
      ...prev,
      [itemId]: checked
    }));

    setRespostas(prev => ({
      ...prev,
      [itemId]: checked ? 'NA' : 4 // Default back to 4 if unchecked
    }));
  };

  // Math calculation via useMemo
  const metrics = useMemo(() => {
    if (items.length === 0) return { obtida: 0, percentual: 0, maxScore };

    let totalWeightCount = 0;
    let earnedWeightSum = 0;

    items.forEach(it => {
      const resp = respostas[it.id];
      if (resp === 'NA' || opcionaisNaoPossui[it.id]) {
        // N/A is skipped entirely, it doesn't lower the score
        return;
      }

      totalWeightCount += 1;

      if (it.isBinary) {
        // Binary items are worth either 0 or 4 points
        const val = parseFloat(resp) || 0;
        earnedWeightSum += val === 4 ? 1 : 0;
      } else {
        // 0-4 scale converted to percentage: 0 -> 0%, 1 -> 15%, 2 -> 50%, 3 -> 80%, 4 -> 100%
        const score = parseInt(resp);
        let ratio = 0;
        if (score === 1) ratio = 0.15;
        else if (score === 2) ratio = 0.50;
        else if (score === 3) ratio = 0.80;
        else if (score === 4) ratio = 1.0;
        
        earnedWeightSum += ratio;
      }
    });

    const percentual = totalWeightCount > 0 ? (earnedWeightSum / totalWeightCount) * 100 : 100;
    const obtida = parseFloat(((percentual / 100) * maxScore).toFixed(2));

    return {
      obtida,
      percentual: parseFloat(percentual.toFixed(1)),
      maxScore
    };
  }, [respostas, opcionaisNaoPossui, items, maxScore]);

  // Save changes to database
  const handleSaveChecklist = async () => {
    if (readonly || saving) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('meg_avaliacao_resultados')
        .upsert({
          eixo_id: eixoId,
          school_id: schoolId,
          avaliador: user?.email || 'Avaliador Oficial',
          data_avaliacao: new Date().toISOString().split('T')[0],
          respostas,
          pontuacao_obtida: metrics.obtida,
          pontuacao_maxima: maxScore,
          percentual: metrics.percentual,
          observacoes
        }, {
          onConflict: 'eixo_id,school_id,data_avaliacao'
        });

      if (error) throw error;

      onSaveSuccess('Avaliação de resultados salva com sucesso no banco!');
    } catch (err: any) {
      console.error('Error saving evaluation checklist:', err);
      onSaveError(`Falha ao salvar checklist: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mr-2" />
        <span>Carregando checklist de avaliação...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header card with current live score math */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-orange-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Pontuação de Resultados (Calculada ao Vivo)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Escala de Conformidade: 0 (Não Conforme) a 4 (Totalmente Conforme)
            </p>
          </div>
        </div>
        <div className="text-center sm:text-right shrink-0">
          <p className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Pontuação Obtida</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
            {metrics.obtida} <span className="text-xs sm:text-sm font-semibold text-slate-400">/ {maxScore} pts</span>
          </p>
          <p className="text-[10px] font-bold text-emerald-600 font-mono mt-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
            {metrics.percentual}% de Conformidade
          </p>
        </div>
      </div>

      {/* Items list */}
      <div className="border border-slate-150 dark:border-slate-800/80 rounded-3xl overflow-hidden divide-y divide-slate-150 dark:divide-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        {items.map((it, idx) => {
          const isNA = opcionaisNaoPossui[it.id] || respostas[it.id] === 'NA';
          const score = respostas[it.id];

          return (
            <div 
              key={it.id} 
              className={`p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-opacity duration-300 ${
                isNA ? 'opacity-40 select-none bg-slate-50/50 dark:bg-slate-800/10' : ''
              }`}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black font-mono text-slate-400 dark:text-slate-500 shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                    Item {it.id}
                  </span>
                  {it.opcional && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                      Opcional
                    </span>
                  )}
                  {isNA && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                      N/A — Não se Aplica
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                  {it.texto}
                </p>
              </div>

              {/* Action Buttons (NA checkbox / Scale selectors) */}
              <div className="flex items-center gap-4 self-end md:self-auto shrink-0 flex-wrap">
                {/* Optional NA Toggle */}
                {it.opcional && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 select-none active:scale-95 transition-transform">
                    <input 
                      type="checkbox"
                      checked={!!opcionaisNaoPossui[it.id]}
                      onChange={(e) => handleToggleOpcional(it.id, e.target.checked)}
                      disabled={readonly}
                      className="hidden"
                    />
                    {opcionaisNaoPossui[it.id] ? (
                      <ToggleRight className="w-8 h-8 text-rose-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    )}
                    <span>Não possui</span>
                  </label>
                )}

                {/* Score scale selection buttons */}
                {!isNA && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                    {it.isBinary ? (
                      // Binary: 0 or 4 points
                      [
                        { val: 0, label: '0 (Não Executado)' },
                        { val: 4, label: '4 (Executado)' }
                      ].map(option => {
                        const isSelected = parseFloat(score) === option.val;
                        return (
                          <button
                            key={option.val}
                            type="button"
                            onClick={() => handleScoreChange(it.id, option.val)}
                            disabled={readonly}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition active:scale-95 ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                            }`}
                            title={option.label}
                          >
                            {option.val === 0 ? '0 - Não' : '4 - Sim'}
                          </button>
                        );
                      })
                    ) : (
                      // Standard Scale 0 to 4
                      [0, 1, 2, 3, 4].map(s => {
                        const isSelected = parseInt(score) === s;
                        let desc = 'Não Conforme (0%)';
                        if (s === 1) desc = 'Pouco Conforme (15%)';
                        else if (s === 2) desc = 'Parcialmente (50%)';
                        else if (s === 3) desc = 'Satisfatório (80%)';
                        else if (s === 4) desc = 'Totalmente (100%)';

                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleScoreChange(it.id, s)}
                            disabled={readonly}
                            className={`w-7 h-7 sm:w-8 sm:h-8 text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-sm font-black'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                            }`}
                            title={desc}
                          >
                            {s}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Observations Box */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Anotações do Avaliador e Justificativas de Resultados
        </label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          disabled={readonly}
          placeholder={readonly ? 'Nenhuma observação informada.' : 'Justifique pontuações, pendências ou observações in loco...'}
          rows={3}
          className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 disabled:opacity-75 disabled:cursor-not-allowed transition resize-none leading-relaxed shadow-sm"
        />
      </div>

      {/* Action Footer Buttons */}
      {!readonly && (
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleSaveChecklist}
            disabled={saving}
            className="px-6 py-3 text-sm font-extrabold rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Avaliação de Resultados
          </button>
        </div>
      )}
    </div>
  );
}
