'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { psicossocialService } from '@/lib/psicossocial-service';
import { Ocorrencia, OcorrenciaEstudante, OcorrenciaResponsavel, OcorrenciaTestemunha } from '@/lib/data';
import { FormStep, VIOLENCIA_LABELS } from './PsicossocialComponents';
import { 
  ArrowLeft, ArrowRight, Save, Plus, Trash2, 
  AlertTriangle, Check, Loader2, Sparkles 
} from 'lucide-react';

interface OcorrenciaFormProps {
  mode: 'nova' | 'editar';
  id?: string;
}

const DEFAULT_ESTUDANTE: OcorrenciaEstudante = {
  nome: '',
  serie: '',
  turma: '',
  idade: 14,
  situacao: 'vítima'
};

const DEFAULT_RESPONSAVEL: OcorrenciaResponsavel = {
  nome: '',
  telefone: '',
  parentesco: 'mãe'
};

export default function OcorrenciaForm({ mode, id }: OcorrenciaFormProps) {
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.escola as string;

  const { activeSchoolContext, isAuthRestored, user } = useAppContext();

  // Multi-step form step
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === 'editar');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form State
  const [dataNotificacao, setDataNotificacao] = useState(new Date().toISOString().split('T')[0]);
  const [municipio, setMunicipio] = useState('Cuiabá');
  const [uf, setUf] = useState('MT');
  const [escolaNome, setEscolaNome] = useState('');
  
  // Dynamic fields
  const [estudantes, setEstudantes] = useState<OcorrenciaEstudante[]>([{ ...DEFAULT_ESTUDANTE }]);
  const [responsaveis, setResponsaveis] = useState<OcorrenciaResponsavel[]>([{ ...DEFAULT_RESPONSAVEL }]);
  const [tiposViolencia, setTiposViolencia] = useState<string[]>([]);
  const [outroViolencia, setOutroViolencia] = useState('');
  const [relato, setRelato] = useState('');
  
  const [temTestemunhas, setTemTestemunhas] = useState(false);
  const [testemunhas, setTestemunhas] = useState<OcorrenciaTestemunha[]>([]);
  
  // Encaminhamentos
  const [procedimentoExecutado, setProcedimentoExecutado] = useState('mediacao_professor_psicossocial');
  const [outroProcedimento, setOutroProcedimento] = useState('');
  const [responsaveisAcionados, setResponsaveisAcionados] = useState('telefone');
  const [motivoNaoAcionamento, setMotivoNaoAcionamento] = useState('');
  const [conversaRegistradaAta, setConversaRegistradaAta] = useState(false);
  const [responsaveisConcordaram, setResponsaveisConcordaram] = useState(true);
  const [motivoDiscordancia, setMotivoDiscordancia] = useState('');
  const [orientadosBo, setOrientadosBo] = useState(false);
  const [motivoSemBo, setMotivoSemBo] = useState('');
  const [historicoEstudante, setHistoricoEstudante] = useState(false);
  const [historicoDescricao, setHistoricoDescricao] = useState('');
  const [quemPreencheu, setQuemPreencheu] = useState('');
  const [assinaturaGestao, setAssinaturaGestao] = useState('');

  // Load school name from context on mount
  useEffect(() => {
    if (activeSchoolContext) {
      if (activeSchoolContext === 'joaobatista') setEscolaNome('EECM Prof. João Batista');
      else if (activeSchoolContext === 'heliodoro') setEscolaNome('EECM Heliodoro Capistrano');
      else if (activeSchoolContext === 'tangara') setEscolaNome('EECM Tangará');
    }
  }, [activeSchoolContext]);

  // Load data for editing mode
  useEffect(() => {
    if (mode !== 'editar' || !id || !isAuthRestored) return;

    async function loadOccurrence() {
      try {
        setFetching(true);
        const res = await psicossocialService.fetchAll(activeSchoolContext);
        const o = res.ocorrencias.find(item => item.id === id);
        
        if (!o) {
          setError('Ocorrência não encontrada.');
          return;
        }

        // Fill form fields
        setDataNotificacao(o.data_notificacao);
        setMunicipio(o.municipio || '');
        setUf(o.uf || 'MT');
        setEscolaNome(o.escola_nome || '');
        setEstudantes(o.estudantes || [{ ...DEFAULT_ESTUDANTE }]);
        setResponsaveis(o.responsaveis || [{ ...DEFAULT_RESPONSAVEL }]);
        setTiposViolencia(o.tipos_violencia || []);
        
        // Find if "outro" violence has custom text
        const customViolencias = o.tipos_violencia.filter(t => !Object.keys(VIOLENCIA_LABELS).includes(t));
        if (customViolencias.length > 0) {
          setTiposViolencia(prev => [...prev.filter(t => Object.keys(VIOLENCIA_LABELS).includes(t)), 'outro']);
          setOutroViolencia(customViolencias[0]);
        }

        setRelato(o.relato || '');
        
        if (o.testemunhas && o.testemunhas.length > 0) {
          setTemTestemunhas(true);
          setTestemunhas(o.testemunhas);
        }

        if (o.procedimento_executado) {
          const validProcs = ['mediacao_professor_psicossocial', 'mediacao_equipe_gestora', 'conselho_tutelar', 'policia_militar'];
          if (validProcs.includes(o.procedimento_executado)) {
            setProcedimentoExecutado(o.procedimento_executado);
          } else {
            setProcedimentoExecutado('outro');
            setOutroProcedimento(o.procedimento_executado);
          }
        }

        setResponsaveisAcionados(o.responsaveis_acionados || 'telefone');
        setMotivoNaoAcionamento(o.motivo_nao_acionamento || '');
        setConversaRegistradaAta(o.conversa_registrada_ata);
        setResponsaveisConcordaram(o.responsaveis_concordaram);
        setMotivoDiscordancia(o.motivo_discordancia || '');
        setOrientadosBo(o.orientados_bo);
        setMotivoSemBo(o.motivo_sem_bo || '');
        setHistoricoEstudante(o.historico_estudante);
        setHistoricoDescricao(o.historico_descricao || '');
        setQuemPreencheu(o.quem_preencheu || '');
        setAssinaturaGestao(o.assinatura_gestao || '');
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados da ocorrência.');
      } finally {
        setFetching(false);
      }
    }

    loadOccurrence();
  }, [mode, id, activeSchoolContext, isAuthRestored]);

  // Validation
  const validateStep = (currentStep: number) => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      const today = new Date().toISOString().split('T')[0];
      if (dataNotificacao > today) {
        errs.dataNotificacao = 'A data de notificação não pode ser futura.';
      }
      if (!municipio.trim()) {
        errs.municipio = 'O município é obrigatório.';
      }
      estudantes.forEach((e, idx) => {
        if (!e.nome.trim()) {
          errs[`estudante_${idx}_nome`] = 'Nome do estudante é obrigatório.';
        }
        if (!e.serie.trim()) {
          errs[`estudante_${idx}_serie`] = 'Série é obrigatória.';
        }
      });
    }

    if (currentStep === 2) {
      if (tiposViolencia.length === 0) {
        errs.tiposViolencia = 'Selecione pelo menos um tipo de violência.';
      }
      if (tiposViolencia.includes('outro') && !outroViolencia.trim()) {
        errs.outroViolencia = 'Especifique o outro tipo de violência.';
      }
      if (!relato.trim()) {
        errs.relato = 'O relato é obrigatório.';
      } else if (relato.trim().length < 50) {
        errs.relato = `O relato deve conter pelo menos 50 caracteres (atual: ${relato.length}).`;
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setLoading(true);
      setError('');

      // Process "outro" values
      const finalTiposViolencia = tiposViolencia.map(t => t === 'outro' ? outroViolencia.trim() : t);
      const finalProcedimento = procedimentoExecutado === 'outro' ? outroProcedimento.trim() : procedimentoExecutado;

      const payload: Omit<Ocorrencia, 'id'> = {
        school_id: activeSchoolContext,
        data_notificacao: dataNotificacao,
        municipio: municipio.trim(),
        uf,
        escola_nome: escolaNome.trim(),
        estudantes,
        responsaveis,
        tipos_violencia: finalTiposViolencia,
        relato: relato.trim(),
        testemunhas: temTestemunhas ? testemunhas : [],
        procedimento_executado: finalProcedimento,
        responsaveis_acionados: responsaveisAcionados,
        motivo_nao_acionamento: responsaveisAcionados === 'nao_acionado' ? motivoNaoAcionamento.trim() : '',
        conversa_registrada_ata: conversaRegistradaAta,
        responsaveis_concordaram: responsaveisConcordaram,
        motivo_discordancia: !responsaveisConcordaram ? motivoDiscordancia.trim() : '',
        orientados_bo: orientadosBo,
        motivo_sem_bo: !orientadosBo ? motivoSemBo.trim() : '',
        historico_estudante: historicoEstudante,
        historico_descricao: historicoEstudante ? historicoDescricao.trim() : '',
        quem_preencheu: quemPreencheu.trim(),
        assinatura_gestao: assinaturaGestao.trim(),
        status: 'aberto'
      };

      if (mode === 'editar' && id) {
        await psicossocialService.updateOcorrencia(id, payload);
        router.push(`/${schoolSlug}/psicossocial/ocorrencias`);
      } else {
        const created = await psicossocialService.addOcorrencia(payload, activeSchoolContext, user?.id);
        
        // Auto Ficha Notificacao Trigger Warning check
        const violacaoCrítica = ['tentativa_homicidio', 'homicidio', 'violencia_sexual', 'autolesao', 'maus_tratos'];
        const matchesCritical = finalTiposViolencia.some(t => violacaoCrítica.includes(t));

        if (matchesCritical) {
          if (confirm('Esta situação pode exigir notificação formal da Violação de Direitos (Art. 56 ECA). Deseja preencher a Ficha de Notificação agora?')) {
            router.push(`/${schoolSlug}/psicossocial/notificacoes/nova?ocorrencia_id=${created.id}`);
            return;
          }
        }
        
        router.push(`/${schoolSlug}/psicossocial/ocorrencias`);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ocorrência.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic arrays triggers
  const addEstudante = () => setEstudantes(prev => [...prev, { ...DEFAULT_ESTUDANTE }]);
  const removeEstudante = (idx: number) => setEstudantes(prev => prev.filter((_, i) => i !== idx));

  const addResponsavel = () => setResponsaveis(prev => [...prev, { ...DEFAULT_RESPONSAVEL }]);
  const removeResponsavel = (idx: number) => setResponsaveis(prev => prev.filter((_, i) => i !== idx));

  const addTestemunha = () => setTestemunhas(prev => [...prev, { nome: '' }]);
  const removeTestemunha = (idx: number) => setTestemunhas(prev => prev.filter((_, i) => i !== idx));

  const handleTipoViolenciaChange = (tipo: string) => {
    setTiposViolencia(prev => 
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  // Critical Notification warning preview inside step 2
  const showCriticalWarning = tiposViolencia.some(t => 
    ['tentativa_homicidio', 'homicidio', 'violencia_sexual', 'autolesao', 'maus_tratos'].includes(t)
  );

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs text-slate-400">Carregando dados da ocorrência...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
          {mode === 'editar' ? 'Editar Ocorrência Psicossocial' : 'Registrar Ocorrência Psicossocial'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stepper */}
      <FormStep 
        current={step} 
        total={3} 
        labels={['Identificação', 'Relato e Fatos', 'Encaminhamentos']} 
      />

      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* ================== ETAPA 1: IDENTIFICAÇÃO ================== */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Dados Iniciais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Data da Notificação *</label>
                <input 
                  type="date"
                  value={dataNotificacao}
                  onChange={(e) => setDataNotificacao(e.target.value)}
                  className={`glass-input w-full text-xs ${validationErrors.dataNotificacao ? 'border-red-500' : ''}`}
                />
                {validationErrors.dataNotificacao && (
                  <p className="text-[10px] text-red-500 mt-1">{validationErrors.dataNotificacao}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Município *</label>
                <input 
                  type="text"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className={`glass-input w-full text-xs ${validationErrors.municipio ? 'border-red-500' : ''}`}
                />
                {validationErrors.municipio && (
                  <p className="text-[10px] text-red-500 mt-1">{validationErrors.municipio}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">UF</label>
                <input 
                  type="text"
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>
            </div>

            {/* Estudantes Envolvidos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Estudantes Envolvidos *</h3>
                <button
                  type="button"
                  onClick={addEstudante}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Estudante
                </button>
              </div>

              {estudantes.map((e, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40 relative space-y-4">
                  {estudantes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEstudante(idx)}
                      className="absolute right-4 top-4 p-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-500 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo *</label>
                      <input 
                        type="text"
                        value={e.nome}
                        onChange={(val) => {
                          const updated = [...estudantes];
                          updated[idx].nome = val.target.value;
                          setEstudantes(updated);
                        }}
                        className={`glass-input w-full text-xs ${validationErrors[`estudante_${idx}_nome`] ? 'border-red-500' : ''}`}
                        placeholder="Ex: Rafael Souza"
                      />
                      {validationErrors[`estudante_${idx}_nome`] && (
                        <p className="text-[10px] text-red-500 mt-1">{validationErrors[`estudante_${idx}_nome`]}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Série *</label>
                      <input 
                        type="text"
                        value={e.serie}
                        onChange={(val) => {
                          const updated = [...estudantes];
                          updated[idx].serie = val.target.value;
                          setEstudantes(updated);
                        }}
                        className={`glass-input w-full text-xs ${validationErrors[`estudante_${idx}_serie`] ? 'border-red-500' : ''}`}
                        placeholder="Ex: 3º Ano"
                      />
                      {validationErrors[`estudante_${idx}_serie`] && (
                        <p className="text-[10px] text-red-500 mt-1">{validationErrors[`estudante_${idx}_serie`]}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Turma</label>
                      <input 
                        type="text"
                        value={e.turma}
                        onChange={(val) => {
                          const updated = [...estudantes];
                          updated[idx].turma = val.target.value;
                          setEstudantes(updated);
                        }}
                        className="glass-input w-full text-xs"
                        placeholder="Ex: C"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Idade</label>
                      <input 
                        type="number"
                        value={e.idade}
                        onChange={(val) => {
                          const updated = [...estudantes];
                          updated[idx].idade = parseInt(val.target.value) || 0;
                          setEstudantes(updated);
                        }}
                        className="glass-input w-full text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Situação</label>
                      <select
                        value={e.situacao}
                        onChange={(val) => {
                          const updated = [...estudantes];
                          updated[idx].situacao = val.target.value;
                          setEstudantes(updated);
                        }}
                        className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                      >
                        <option value="vítima">Vítima</option>
                        <option value="autor_infracao">Autor de Infração</option>
                        <option value="testemunha">Testemunha</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Responsáveis */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Pais ou Responsáveis</h3>
                <button
                  type="button"
                  onClick={addResponsavel}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Responsável
                </button>
              </div>

              {responsaveis.map((r, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40 relative space-y-4">
                  {responsaveis.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResponsavel(idx)}
                      className="absolute right-4 top-4 p-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-500 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                      <input 
                        type="text"
                        value={r.nome}
                        onChange={(val) => {
                          const updated = [...responsaveis];
                          updated[idx].nome = val.target.value;
                          setResponsaveis(updated);
                        }}
                        className="glass-input w-full text-xs"
                        placeholder="Ex: Maria Souza"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Telefone / Contato</label>
                      <input 
                        type="tel"
                        value={r.telefone}
                        onChange={(val) => {
                          const updated = [...responsaveis];
                          updated[idx].telefone = val.target.value;
                          setResponsaveis(updated);
                        }}
                        className="glass-input w-full text-xs"
                        placeholder="Ex: (65) 99999-9999"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Parentesco</label>
                      <input 
                        type="text"
                        value={r.parentesco}
                        onChange={(val) => {
                          const updated = [...responsaveis];
                          updated[idx].parentesco = val.target.value;
                          setResponsaveis(updated);
                        }}
                        className="glass-input w-full text-xs"
                        placeholder="Ex: Mãe, Pai, Tio..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================== ETAPA 2: RELATO E FATOS ================== */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Tipos de Violência */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2">
                Tipos de Violência (SEDUC/MT) *
              </h3>
              {validationErrors.tiposViolencia && (
                <p className="text-xs text-red-500 font-semibold">{validationErrors.tiposViolencia}</p>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(VIOLENCIA_LABELS).map(([key, label]) => (
                  <label 
                    key={key} 
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                      tiposViolencia.includes(key)
                        ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 dark:text-emerald-450 dark:border-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={tiposViolencia.includes(key)}
                      onChange={() => handleTipoViolenciaChange(key)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs font-bold leading-tight">{label}</span>
                  </label>
                ))}
              </div>

              {tiposViolencia.includes('outro') && (
                <div className="pt-2 animate-in slide-in-from-top-1 duration-150">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Especifique o outro tipo de violência *</label>
                  <input 
                    type="text"
                    value={outroViolencia}
                    onChange={(e) => setOutroViolencia(e.target.value)}
                    className={`glass-input w-full text-xs ${validationErrors.outroViolencia ? 'border-red-500' : ''}`}
                    placeholder="Escreva aqui..."
                  />
                  {validationErrors.outroViolencia && (
                    <p className="text-[10px] text-red-500 mt-1">{validationErrors.outroViolencia}</p>
                  )}
                </div>
              )}
            </div>

            {/* Critical Notification Warning */}
            {showCriticalWarning && (
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-400 animate-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-extrabold">Atenção — Medicação Crítica Requerida</p>
                  <p className="font-medium">Esta situação pode exigir notificação formal da Violação de Direitos aos órgãos protetivos (Art. 56 ECA / Lei 13.431/2017) após a finalização deste formulário.</p>
                </div>
              </div>
            )}

            {/* Relato */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Relato da Situação *</label>
                <span className="text-[10px] text-slate-400 font-medium">Mínimo 50 caracteres (digitado: {relato.length})</span>
              </div>
              <textarea 
                value={relato}
                onChange={(e) => setRelato(e.target.value)}
                className={`glass-input w-full min-h-[160px] text-xs leading-relaxed py-2 px-3 ${validationErrors.relato ? 'border-red-500' : ''}`}
                placeholder="Narrar os fatos ocorridos. Importante: não inserir julgamento pessoal ou juízo de valor."
              />
              {validationErrors.relato && (
                <p className="text-[10px] text-red-500 mt-1">{validationErrors.relato}</p>
              )}
            </div>

            {/* Testemunhas */}
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-350">
                <input 
                  type="checkbox"
                  checked={temTestemunhas}
                  onChange={() => setTemTestemunhas(!temTestemunhas)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                Houve testemunhas da situação?
              </label>

              {temTestemunhas && (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">Testemunhas</h4>
                    <button
                      type="button"
                      onClick={addTestemunha}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3" /> Adicionar Testemunha
                    </button>
                  </div>

                  {testemunhas.map((t, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text"
                        value={t.nome}
                        onChange={(e) => {
                          const updated = [...testemunhas];
                          updated[idx].nome = e.target.value;
                          setTestemunhas(updated);
                        }}
                        className="glass-input flex-1 py-1.5 px-3 text-xs"
                        placeholder="Nome completo da testemunha"
                      />
                      {testemunhas.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeTestemunha(idx)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-500 rounded-lg transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================== ETAPA 3: ENCAMINHAMENTOS ================== */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2">
              Encaminhamentos e Deliberações
            </h3>

            {/* Procedimento Executado */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Procedimento de Intervenção Executado *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'mediacao_professor_psicossocial', label: 'Mediação Professor / Equipe Psicossocial' },
                  { value: 'mediacao_equipe_gestora', label: 'Mediação pela Equipe Gestora' },
                  { value: 'conselho_tutelar', label: 'Acionamento do Conselho Tutelar' },
                  { value: 'policia_militar', label: 'Acionamento da Polícia Militar' },
                  { value: 'outro', label: 'Outro Procedimento' }
                ].map(p => (
                  <label 
                    key={p.value}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                      procedimentoExecutado === p.value
                        ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 dark:text-emerald-450 dark:border-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350'
                    }`}
                  >
                    <input 
                      type="radio"
                      name="procedimento"
                      checked={procedimentoExecutado === p.value}
                      onChange={() => setProcedimentoExecutado(p.value)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs font-bold leading-tight">{p.label}</span>
                  </label>
                ))}
              </div>

              {procedimentoExecutado === 'outro' && (
                <div className="pt-2 animate-in slide-in-from-top-1 duration-150">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Especifique o procedimento *</label>
                  <input 
                    type="text"
                    value={outroProcedimento}
                    onChange={(e) => setOutroProcedimento(e.target.value)}
                    className="glass-input w-full text-xs"
                    placeholder="Descreva a ação tomada..."
                  />
                </div>
              )}
            </div>

            {/* Responsáveis Acionados */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 font-bold">Contato com Responsáveis *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'telefone', label: 'Contatado por Telefone' },
                  { value: 'reuniao', label: 'Convocado para Reunião Presencial' },
                  { value: 'nao_acionado', label: 'Não acionados' }
                ].map(r => (
                  <label 
                    key={r.value}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                      responsaveisAcionados === r.value
                        ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 dark:text-emerald-450 dark:border-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350'
                    }`}
                  >
                    <input 
                      type="radio"
                      name="responsaveis_acionados"
                      checked={responsaveisAcionados === r.value}
                      onChange={() => setResponsaveisAcionados(r.value)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs font-bold leading-tight">{r.label}</span>
                  </label>
                ))}
              </div>

              {responsaveisAcionados === 'nao_acionado' && (
                <div className="pt-2 animate-in slide-in-from-top-1 duration-150">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Motivo do não acionamento *</label>
                  <input 
                    type="text"
                    value={motivoNaoAcionamento}
                    onChange={(e) => setMotivoNaoAcionamento(e.target.value)}
                    className="glass-input w-full text-xs"
                    placeholder="Escreva o motivo técnico justificável..."
                  />
                </div>
              )}
            </div>

            {/* Questions yes/no block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Conversa em ata? */}
              <div className="p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">A conversa foi devidamente registrada em ata escolar?</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setConversaRegistradaAta(true)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${conversaRegistradaAta ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Sim
                  </button>
                  <button 
                    type="button"
                    onClick={() => setConversaRegistradaAta(false)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${!conversaRegistradaAta ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {/* Responsáveis concordaram? */}
              <div className="p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 font-bold">Os responsáveis concordaram com o encaminhamento proposto?</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setResponsaveisConcordaram(true)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${responsaveisConcordaram ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Sim
                  </button>
                  <button 
                    type="button"
                    onClick={() => setResponsaveisConcordaram(false)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${!responsaveisConcordaram ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Não
                  </button>
                </div>
                {!responsaveisConcordaram && (
                  <div className="pt-2 animate-in slide-in-from-top-1 duration-150">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivo da discordância *</label>
                    <input 
                      type="text"
                      value={motivoDiscordancia}
                      onChange={(e) => setMotivoDiscordancia(e.target.value)}
                      className="glass-input w-full text-xs"
                      placeholder="Descreva as objeções apontadas..."
                    />
                  </div>
                )}
              </div>

              {/* Orientados a registrar BO? */}
              <div className="p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 font-bold">Os envolvidos foram orientados a lavrar Boletim de Ocorrência policial?</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setOrientadosBo(true)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${orientadosBo ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Sim
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOrientadosBo(false)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${!orientadosBo ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Não
                  </button>
                </div>
                {!orientadosBo && (
                  <div className="pt-2 animate-in slide-in-from-top-1 duration-150">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivo da não orientação *</label>
                    <input 
                      type="text"
                      value={motivoSemBo}
                      onChange={(e) => setMotivoSemBo(e.target.value)}
                      className="glass-input w-full text-xs"
                      placeholder="Descreva o motivo..."
                    />
                  </div>
                )}
              </div>

              {/* Histórico anterior? */}
              <div className="p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Há histórico de registros anteriores envolvendo o estudante?</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setHistoricoEstudante(true)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${historicoEstudante ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Sim
                  </button>
                  <button 
                    type="button"
                    onClick={() => setHistoricoEstudante(false)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${!historicoEstudante ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Não
                  </button>
                </div>
                {historicoEstudante && (
                  <div className="pt-2 animate-in slide-in-from-top-1 duration-150">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição do histórico *</label>
                    <input 
                      type="text"
                      value={historicoDescricao}
                      onChange={(e) => setHistoricoDescricao(e.target.value)}
                      className="glass-input w-full text-xs"
                      placeholder="Identifique as ocorrências/evidências prévias..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Assinaturas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Quem preencheu a ficha?</label>
                <input 
                  type="text"
                  value={quemPreencheu}
                  onChange={(e) => setQuemPreencheu(e.target.value)}
                  className="glass-input w-full text-xs"
                  placeholder="Nome do servidor..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Autorização da Direção / Gestão Escolar</label>
                <input 
                  type="text"
                  value={assinaturaGestao}
                  onChange={(e) => setAssinaturaGestao(e.target.value)}
                  className="glass-input w-full text-xs"
                  placeholder="Nome do diretor..."
                />
              </div>
            </div>

          </div>
        )}

        {/* Stepper Actions footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <button
            type="button"
            onClick={step === 1 ? () => router.back() : handleBack}
            className="px-4 py-2 text-xs font-extrabold text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition active:scale-95 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          
          <button
            type="button"
            onClick={step === 3 ? handleSubmit : handleNext}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-md transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : step === 3 ? (
              <>
                <Save className="w-4 h-4" />
                Finalizar Registro
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
