'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { psicossocialService } from '@/lib/psicossocial-service';
import { FichaNotificacao, OcorrenciaResponsavel } from '@/lib/data';
import { VIOLACAO_LABELS } from './PsicossocialComponents';
import { 
  ArrowLeft, Save, Loader2, Sparkles, Printer, FileText 
} from 'lucide-react';

interface FichaNotificacaoFormProps {
  mode: 'nova' | 'visualizar';
  id?: string;
}

export default function FichaNotificacaoForm({ mode, id }: FichaNotificacaoFormProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const schoolSlug = params.escola as string;

  const { activeSchoolContext, isAuthRestored, user } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === 'visualizar');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Ficha Form State
  const [ocorrenciaId, setOcorrenciaId] = useState(searchParams.get('ocorrencia_id') || '');
  const [enviadaPara, setEnviadaPara] = useState<string[]>([]);
  const [dataNotificacao, setDataNotificacao] = useState(new Date().toISOString().split('T')[0]);
  const [municipio, setMunicipio] = useState('Cuiabá');
  const [uf, setUf] = useState('MT');
  
  const [escolaNome, setEscolaNome] = useState('');
  const [enderecoEscola, setEnderecoEscola] = useState('');
  
  // Student
  const [nomeEstudante, setNomeEstudante] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [idade, setIdade] = useState<number | ''>('');
  const [sexo, setSexo] = useState('M');
  const [cartaoSus, setCartaoSus] = useState('');
  const [escolaridade, setEscolaridade] = useState('');
  const [deficiencia, setDeficiencia] = useState('');

  // Responsável
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelEndereco, setResponsavelEndereco] = useState('');
  const [responsavelTelefone, setResponsavelTelefone] = useState('');
  const [responsavelCep, setResponsavelCep] = useState('');

  // Violação
  const [tipoViolacao, setTipoViolacao] = useState<string[]>([]);
  const [outroViolacao, setOutroViolacao] = useState('');
  const [informacoesComplementares, setInformacoesComplementares] = useState('');
  const [nomeDiretor, setNomeDiretor] = useState('Edma');
  const [assinaturaDiretor, setAssinaturaDiretor] = useState('');
  const [fichaEnviadaEm, setFichaEnviadaEm] = useState(new Date().toISOString());

  // Set default school address and details on load
  useEffect(() => {
    if (activeSchoolContext) {
      if (activeSchoolContext === 'joaobatista') {
        setEscolaNome('EECM Prof. João Batista');
        setEnderecoEscola('Rua Principal, 123 - Cuiabá - MT');
      } else if (activeSchoolContext === 'heliodoro') {
        setEscolaNome('EECM Heliodoro Capistrano');
        setEnderecoEscola('Av. Central, 456 - Cuiabá - MT');
      } else if (activeSchoolContext === 'tangara') {
        setEscolaNome('EECM Tangará');
        setEnderecoEscola('Rua das Flores, 789 - Tangará da Serra - MT');
      }
    }
  }, [activeSchoolContext]);

  // Load from linked occurrence if provided
  useEffect(() => {
    const linkedOcorrenciaId = searchParams.get('ocorrencia_id');
    if (!linkedOcorrenciaId || mode !== 'nova' || !isAuthRestored) return;

    async function loadFromOcorrencia() {
      try {
        setFetching(true);
        const res = await psicossocialService.fetchAll(activeSchoolContext);
        const o = res.ocorrencias.find(item => item.id === linkedOcorrenciaId);
        
        if (o && o.estudantes.length > 0) {
          const mainEst = o.estudantes[0];
          setNomeEstudante(mainEst.nome);
          setIdade(mainEst.idade || '');
          setEscolaridade(mainEst.serie + ' ' + mainEst.turma);

          if (o.responsaveis && o.responsaveis.length > 0) {
            const mainResp = o.responsaveis[0];
            setResponsavelNome(mainResp.nome);
            setResponsavelTelefone(mainResp.telefone);
          }

          // Pre-select related violation types
          const violacoes: string[] = [];
          if (o.tipos_violencia.includes('lesao_corporal') || o.tipos_violencia.includes('vias_de_fato_rixas')) {
            violacoes.push('violencia_fisica');
          }
          if (o.tipos_violencia.includes('violencia_sexual')) {
            violacoes.push('violencia_sexual');
          }
          if (o.tipos_violencia.includes('autolesao')) {
            violacoes.push('autolesao');
          }
          if (o.tipos_violencia.includes('maus_tratos')) {
            violacoes.push('maus_tratos');
          }
          setTipoViolacao(violacoes);
          
          setInformacoesComplementares(`Registrado automaticamente a partir do relato da Ocorrência:\n"${o.relato}"`);
        }
      } catch (err) {
        console.error('Error auto-filling from occurrence:', err);
      } finally {
        setFetching(false);
      }
    }

    loadFromOcorrencia();
  }, [mode, searchParams, activeSchoolContext, isAuthRestored]);

  // Load existing Ficha
  useEffect(() => {
    if (mode !== 'visualizar' || !id || !isAuthRestored) return;

    async function loadFicha() {
      try {
        setFetching(true);
        const res = await psicossocialService.fetchAll(activeSchoolContext);
        const f = res.fichasNotificacao.find(item => item.id === id);

        if (!f) {
          setError('Ficha de Notificação não encontrada.');
          return;
        }

        setOcorrenciaId(f.ocorrencia_id || '');
        setEnviadaPara(f.ficha_enviada_para || []);
        setDataNotificacao(f.data_notificacao);
        setMunicipio(f.municipio_notificacao || '');
        setUf(f.uf || 'MT');
        setEscolaNome(f.escola_nome || '');
        setEnderecoEscola(f.endereco_escola || '');
        setNomeEstudante(f.nome_estudante);
        setDataNascimento(f.data_nascimento || '');
        setIdade(f.idade || '');
        setSexo(f.sexo || 'M');
        setCartaoSus(f.cartao_sus || '');
        setEscolaridade(f.escolaridade || '');
        setDeficiencia(f.deficiencia || '');

        if (f.responsaveis && f.responsaveis.length > 0) {
          const r = f.responsaveis[0];
          setResponsavelNome(r.nome || '');
          setResponsavelTelefone(r.telefone || '');
        }
        setResponsavelEndereco(f.endereco_responsavel || '');
        setResponsavelCep(f.cep || '');

        // Pre-select violations
        const standardKeys = Object.keys(VIOLACAO_LABELS);
        const stViolations = f.tipo_violacao.filter(t => standardKeys.includes(t));
        const customViolations = f.tipo_violacao.filter(t => !standardKeys.includes(t));
        
        if (customViolations.length > 0) {
          setTipoViolacao([...stViolations, 'outro']);
          setOutroViolacao(customViolations[0]);
        } else {
          setTipoViolacao(stViolations);
        }

        setInformacoesComplementares(f.informacoes_complementares || '');
        setNomeDiretor(f.nome_diretor || '');
        setAssinaturaDiretor(f.assinatura_diretor || '');
        setFichaEnviadaEm(f.ficha_enviada_em || '');
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar Ficha.');
      } finally {
        setFetching(false);
      }
    }

    loadFicha();
  }, [mode, id, activeSchoolContext, isAuthRestored]);

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};

    if (!nomeEstudante.trim()) {
      errs.nomeEstudante = 'O nome do estudante é obrigatório.';
    }
    if (tipoViolacao.length === 0) {
      errs.tipoViolacao = 'Selecione pelo menos um tipo de violação.';
    }
    if (tipoViolacao.includes('outro') && !outroViolacao.trim()) {
      errs.outroViolacao = 'Especifique a outra violação.';
    }
    if (enviadaPara.length === 0) {
      errs.enviadaPara = 'Selecione pelo menos um destinatário de envio.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setError('');

      const finalViolacao = tipoViolacao.map(t => t === 'outro' ? outroViolacao.trim() : t);
      
      const payload: Omit<FichaNotificacao, 'id'> = {
        school_id: activeSchoolContext,
        ocorrencia_id: ocorrenciaId || undefined,
        data_notificacao: dataNotificacao,
        municipio_notificacao: municipio.trim(),
        uf,
        escola_nome: escolaNome.trim(),
        endereco_escola: enderecoEscola.trim(),
        nome_estudante: nomeEstudante.trim(),
        data_nascimento: dataNascimento || undefined,
        idade: idade !== '' ? Number(idade) : undefined,
        sexo,
        cartao_sus: cartaoSus.trim(),
        escolaridade: escolaridade.trim(),
        deficiencia: deficiencia.trim(),
        responsaveis: [{ nome: responsavelNome.trim(), telefone: responsavelTelefone.trim(), parentesco: 'responsável' }],
        endereco_responsavel: responsavelEndereco.trim(),
        telefone: responsavelTelefone.trim(),
        cep: responsavelCep.trim(),
        tipo_violacao: finalViolacao,
        informacoes_complementares: informacoesComplementares.trim(),
        nome_diretor: nomeDiretor.trim(),
        assinatura_diretor: assinaturaDiretor.trim(),
        ficha_enviada_para: enviadaPara,
        ficha_enviada_em: fichaEnviadaEm
      };

      if (mode === 'visualizar' && id) {
        await psicossocialService.updateFichaNotificacao(id, payload);
      } else {
        await psicossocialService.addFichaNotificacao(payload, activeSchoolContext, user?.id);
      }

      router.push(`/${schoolSlug}/psicossocial/notificacoes`);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ficha.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviadaParaChange = (dest: string) => {
    setEnviadaPara(prev => 
      prev.includes(dest) ? prev.filter(d => d !== dest) : [...prev, dest]
    );
  };

  const handleTipoViolacaoChange = (viol: string) => {
    setTipoViolacao(prev => 
      prev.includes(viol) ? prev.filter(v => v !== viol) : [...prev, viol]
    );
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs text-slate-400">Carregando dados da ficha...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Printable Sheet Wrapper */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
            {mode === 'visualizar' ? 'Ficha de Notificação de Violação de Direitos' : 'Nova Ficha de Notificação (Art. 56 ECA)'}
          </h1>
        </div>

        {mode === 'visualizar' && (
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" />
            Imprimir PDF
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs text-red-600 dark:text-red-400 print:hidden">
          {error}
        </div>
      )}

      {/* Main Interactive Form Page */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6 print:hidden">
        
        {/* Destinatários */}
        <div className="p-4 bg-amber-50/20 border border-amber-200/50 rounded-2xl space-y-3">
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 uppercase">Enviar Notificação Para (Destinatários) *</label>
          {validationErrors.enviadaPara && (
            <p className="text-[10px] text-red-500 font-semibold">{validationErrors.enviadaPara}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'conselho_tutelar', label: 'Conselho Tutelar' },
              { value: 'autoridade_policial', label: 'Autoridade Policial' },
              { value: 'sistema_saude', label: 'Sistema de Saúde' },
              { value: 'assistencia_social', label: 'Assistência Social' }
            ].map(d => (
              <label 
                key={d.value}
                className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                  enviadaPara.includes(d.value)
                    ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 dark:text-emerald-450 dark:border-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350'
                }`}
              >
                <input 
                  type="checkbox"
                  checked={enviadaPara.includes(d.value)}
                  onChange={() => handleEnviadaParaChange(d.value)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-bold leading-none">{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Informações Iniciais */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" /> Identificação e Localidade
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Data da Ficha *</label>
              <input 
                type="date"
                value={dataNotificacao}
                onChange={(e) => setDataNotificacao(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Município de Notificação</label>
              <input 
                type="text"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Escola</label>
              <input 
                type="text"
                value={escolaNome}
                onChange={(e) => setEscolaNome(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Endereço da Escola</label>
              <input 
                type="text"
                value={enderecoEscola}
                onChange={(e) => setEnderecoEscola(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
          </div>
        </div>

        {/* Estudante */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2">Dados do Estudante</h3>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nome Completo *</label>
              <input 
                type="text"
                value={nomeEstudante}
                onChange={(e) => setNomeEstudante(e.target.value)}
                className={`glass-input w-full text-xs ${validationErrors.nomeEstudante ? 'border-red-500' : ''}`}
                placeholder="Ex: Pedro Silva"
              />
              {validationErrors.nomeEstudante && (
                <p className="text-[10px] text-red-500 mt-1">{validationErrors.nomeEstudante}</p>
              )}
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Data Nascimento</label>
              <input 
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Idade</label>
              <input 
                type="number"
                value={idade}
                onChange={(e) => setIdade(e.target.value !== '' ? parseInt(e.target.value) : '')}
                className="glass-input w-full text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Sexo</label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Cartão SUS</label>
              <input 
                type="text"
                value={cartaoSus}
                onChange={(e) => setCartaoSus(e.target.value)}
                className="glass-input w-full text-xs"
                placeholder="Ex: 000.0000.0000.0000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Série / Escolaridade</label>
              <input 
                type="text"
                value={escolaridade}
                onChange={(e) => setEscolaridade(e.target.value)}
                className="glass-input w-full text-xs"
                placeholder="Ex: 9º Ano A"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Deficiência ou Transtorno</label>
              <input 
                type="text"
                value={deficiencia}
                onChange={(e) => setDeficiencia(e.target.value)}
                className="glass-input w-full text-xs"
                placeholder="Escreva caso houver..."
              />
            </div>
          </div>
        </div>

        {/* Responsável */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2">Pais ou Responsável Legal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nome do Responsável</label>
              <input 
                type="text"
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                className="glass-input w-full text-xs"
                placeholder="Ex: Sandra Silva"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Endereço de Residência</label>
              <input 
                type="text"
                value={responsavelEndereco}
                onChange={(e) => setResponsavelEndereco(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Telefone / Contato</label>
              <input 
                type="text"
                value={responsavelTelefone}
                onChange={(e) => setResponsavelTelefone(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">CEP</label>
              <input 
                type="text"
                value={responsavelCep}
                onChange={(e) => setResponsavelCep(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
          </div>
        </div>

        {/* Tipo de Violação */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b pb-2">
            Motivo da Notificação — Tipo de Violação *
          </h3>
          {validationErrors.tipoViolacao && (
            <p className="text-xs text-red-500 font-semibold">{validationErrors.tipoViolacao}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(VIOLACAO_LABELS).map(([key, label]) => (
              <label 
                key={key} 
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                  tipoViolacao.includes(key)
                    ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 dark:text-emerald-450 dark:border-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350'
                }`}
              >
                <input 
                  type="checkbox"
                  checked={tipoViolacao.includes(key)}
                  onChange={() => handleTipoViolacaoChange(key)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-bold leading-none">{label}</span>
              </label>
            ))}
          </div>

          {tipoViolacao.includes('outro') && (
            <div className="pt-2 animate-in slide-in-from-top-1 duration-150">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Especifique a outra violação de direitos *</label>
              <input 
                type="text"
                value={outroViolacao}
                onChange={(e) => setOutroViolacao(e.target.value)}
                className={`glass-input w-full text-xs ${validationErrors.outroViolacao ? 'border-red-500' : ''}`}
                placeholder="Descreva aqui..."
              />
              {validationErrors.outroViolacao && (
                <p className="text-[10px] text-red-500 mt-1">{validationErrors.outroViolacao}</p>
              )}
            </div>
          )}
        </div>

        {/* Informações Complementares */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Informações Complementares e Encaminhamentos</label>
          <textarea 
            value={informacoesComplementares}
            onChange={(e) => setInformacoesComplementares(e.target.value)}
            className="glass-input w-full min-h-[120px] text-xs leading-relaxed py-2 px-3"
            placeholder="Descreva as evidências observadas, as atitudes do estudante, e as providências preliminares adotadas na escola..."
          />
        </div>

        {/* Direção e Assinaturas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Diretor(a) Responsável</label>
            <input 
              type="text"
              value={nomeDiretor}
              onChange={(e) => setNomeDiretor(e.target.value)}
              className="glass-input w-full text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Assinatura Digital Direção</label>
            <input 
              type="text"
              value={assinaturaDiretor}
              onChange={(e) => setAssinaturaDiretor(e.target.value)}
              className="glass-input w-full text-xs"
              placeholder="Digite o nome para assinar..."
            />
          </div>
        </div>

        {/* Action Button footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-xs font-extrabold text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition active:scale-95 flex items-center gap-1.5"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Notificação
              </>
            )}
          </button>
        </div>

      </div>

      {/* ================== PREMIUM PRINT A4 TEMPLATE ================== */}
      <div className="hidden print:block w-full max-w-[800px] mx-auto bg-white text-black p-8 font-serif leading-relaxed text-xs">
        {/* Official Header */}
        <div className="text-center space-y-1.5 border-b-2 border-black pb-4 mb-6">
          <h2 className="text-sm font-bold uppercase">Estado de Mato Grosso</h2>
          <h2 className="text-sm font-bold uppercase">Secretaria de Estado de Educação — SEDUC</h2>
          <h3 className="text-xs font-semibold uppercase">{escolaNome}</h3>
          <p className="text-[10px] italic">Notificação de Violação de Direitos da Criança e do Adolescente (Art. 56 do ECA)</p>
        </div>

        {/* Local & Destinatários */}
        <div className="grid grid-cols-2 gap-4 border border-black p-3 mb-4">
          <div>
            <p><strong>Município:</strong> {municipio} — {uf}</p>
            <p><strong>Data de Notificação:</strong> {new Date(dataNotificacao + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p><strong>Notificação Enviada Para:</strong></p>
            <ul className="list-disc pl-4 text-[10px] space-y-0.5">
              {enviadaPara.map(d => (
                <li key={d} className="capitalize">{(d || '').replace('_', ' ')}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Escola */}
        <div className="border border-black p-3 mb-4 space-y-1">
          <h4 className="font-bold border-b border-black pb-1 mb-1.5 text-[10px] uppercase">1. Identificação da Unidade Escolar</h4>
          <p><strong>Unidade de Ensino:</strong> {escolaNome}</p>
          <p><strong>Endereço:</strong> {enderecoEscola}</p>
        </div>

        {/* Estudante */}
        <div className="border border-black p-3 mb-4 space-y-1">
          <h4 className="font-bold border-b border-black pb-1 mb-1.5 text-[10px] uppercase">2. Identificação do Estudante</h4>
          <div className="grid grid-cols-2 gap-2">
            <p><strong>Nome Completo:</strong> {nomeEstudante}</p>
            <p><strong>Sexo:</strong> {sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Feminino' : 'Outro'}</p>
            <p><strong>Data de Nascimento:</strong> {dataNascimento ? new Date(dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
            <p><strong>Idade:</strong> {idade} anos</p>
            <p><strong>Série / Escolaridade:</strong> {escolaridade}</p>
            <p><strong>Cartão SUS:</strong> {cartaoSus || 'Não informado'}</p>
            <p><strong>Necessidades Especiais/Deficiência:</strong> {deficiencia || 'Não'}</p>
          </div>
        </div>

        {/* Responsáveis */}
        <div className="border border-black p-3 mb-4 space-y-1">
          <h4 className="font-bold border-b border-black pb-1 mb-1.5 text-[10px] uppercase">3. Pais ou Responsável Legal</h4>
          <p><strong>Nome do Responsável:</strong> {responsavelNome}</p>
          <p><strong>Endereço Residencial:</strong> {responsavelEndereco}</p>
          <div className="grid grid-cols-2 gap-2">
            <p><strong>Telefone de Contato:</strong> {responsavelTelefone}</p>
            <p><strong>CEP:</strong> {responsavelCep}</p>
          </div>
        </div>

        {/* Violações */}
        <div className="border border-black p-3 mb-4 space-y-1">
          <h4 className="font-bold border-b border-black pb-1 mb-1.5 text-[10px] uppercase">4. Motivo da Notificação (Violações de Direitos)</h4>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {tipoViolacao.map(v => (
              <p key={v} className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-black" />
                <strong>{VIOLACAO_LABELS[v] || v === 'outro' ? outroViolacao : v}</strong>
              </p>
            ))}
          </div>
        </div>

        {/* Relato */}
        <div className="border border-black p-3 mb-6 space-y-1.5">
          <h4 className="font-bold border-b border-black pb-1 mb-1.5 text-[10px] uppercase">5. Informações Complementares e Medidas Adotadas</h4>
          <p className="text-[10px] leading-relaxed whitespace-pre-line">{informacoesComplementares || 'Nenhuma informação adicional cadastrada.'}</p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px]">
          <div className="space-y-4">
            <div className="border-t border-black pt-2">
              <p><strong>{nomeDiretor}</strong></p>
              <p className="text-[8px] uppercase">Diretor(a) Escolar Responsável</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="border-t border-black pt-2">
              <p><strong>{assinaturaDiretor || '_______________________________'}</strong></p>
              <p className="text-[8px] uppercase">Assinatura Digital / Carimbo</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
