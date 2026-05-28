// components/meg/MegFormulario.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, X, Plus, Trash2, Loader2, Check, AlertCircle, FileText, 
  HelpCircle, ShieldCheck, ClipboardCheck, Play, PlusCircle, CheckCircle, BookOpen
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/lib/store';

interface FormProps {
  tipo: string;
  evidenciaId: string;
  schoolId: string;
  readonly: boolean;
  onClose: () => void;
  onSaveSuccess: (msg: string) => void;
}

export default function MegFormulario({
  tipo,
  evidenciaId,
  schoolId,
  readonly,
  onClose,
  onSaveSuccess
}: FormProps) {
  const { user, contextSchools, activeSchoolContext } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState<any>({});
  const [status, setStatus] = useState<string>('rascunho');

  const school = contextSchools.find(s => s.id === (schoolId || activeSchoolContext));
  const schoolName = school?.name || 'EECM';

  // Load existing form data from Supabase
  useEffect(() => {
    async function loadFormData() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: dbErr } = await supabase
          .from('meg_formularios')
          .select('*')
          .eq('evidencia_id', evidenciaId)
          .eq('school_id', schoolId)
          .maybeSingle();

        if (dbErr) throw dbErr;

        if (data) {
          setDados(data.dados || {});
          setStatus(data.status || 'rascunho');
        } else {
          // Initialize empty structure based on form type
          setDados(getInitialData(tipo));
          setStatus('rascunho');
        }
      } catch (err: any) {
        console.error('Error loading form data:', err);
        setError('Não foi possível carregar os dados salvos.');
      } finally {
        setLoading(false);
      }
    }

    loadFormData();
  }, [evidenciaId, schoolId, tipo]);

  // Initial template generators
  const getInitialData = (type: string) => {
    const base = {
      unidade_escolar: schoolName,
      codigo_escola: schoolId,
      municipio: 'Cuiabá', // Fallback default
      dre: 'DRE Cuiabá',
      diretor: 'Gestor Escolar'
    };

    switch (type) {
      case 'cronograma_patrimonial':
        return {
          ...base,
          subcomissao: '',
          acoes: [
            { acao: 'Ata de Abertura de Inventário Anual', data: '', situacao: 'pendente' },
            { acao: 'Formação/substituição da Subcomissão local', data: '', situacao: 'pendente' },
            { acao: 'Verificação das Notas Fiscais para tombamento', data: '', situacao: 'pendente' },
            { acao: 'Levantamento físico dos bens móveis e Ficha cadastral imóveis', data: '', situacao: 'pendente' },
            { acao: 'Período de ajuste patrimonial', data: '', situacao: 'pendente' },
            { acao: 'Elaboração de relatório final e ata de encerramento', data: '', situacao: 'pendente' }
          ]
        };
      case 'dfd_pcr':
        return {
          orgao: 'SECRETARIA DE ESTADO DE EDUCAÇÃO - SEDUC',
          unidade_orcamentaria: '14101',
          setor_requisitante: '',
          responsavel_demanda: '',
          matricula: '',
          email: user?.email || '',
          telefone: '',
          tipo_recurso: 'RU',
          objeto: '',
          descricao_demanda: '',
          justificativa: '',
          valor_estimado: 0,
          enviado_dre: false,
          data_envio_dre: ''
        };
      case 'ficha_cadastral_imovel':
        return {
          identificacao_imovel_rip: '',
          matricula: '',
          municipio: 'Cuiabá',
          endereco: '',
          numero: '',
          cep: '',
          bairro: '',
          complemento: '',
          latitude: '',
          longitude: '',
          ponto_referencia: '',
          ocupacao: 'Ocupado',
          tipo_uso: 'Individual',
          orgao_entidade: 'SEDUC-MT',
          destinacao: 'Ensino Regular cívico-militar',
          responsavel: '',
          telefone: '',
          email: '',
          possui_termo_outorga: false,
          tipo_outorga: 'Cessão',
          area_terreno_m2: 0,
          area_construida_m2: 0,
          num_pisos: 1,
          tipo_imovel: 'Urbano',
          categoria: 'Prédio',
          estado_conservacao: 'Bom',
          caracteristicas_topograficas: 'Plana',
          pesquisa_cartoraria: false,
          num_matricula: ''
        };
      case 'checklist_tti':
        return {
          assinaturas_presentes: false,
          pasta_fisica_identificada: false,
          digitalizacao_pdf: false,
          observacoes: ''
        };
      case 'lancamento_nota_fiscal':
        return {
          total_notas_pagas: 0,
          saldo_atual: 0,
          notas_lancadas: []
        };
      case 'relatorio_ean':
        return {
          dre: 'DRE',
          municipio: 'Cuiabá',
          codigo_escola: schoolId,
          responsavel: '',
          introducao: '',
          contexto_justificativa: '',
          ponto_de_partida: '',
          objetivos: [''],
          acoes: []
        };
      case 'pesquisa_satisfacao_alimentacao':
        return {
          respostas: [
            { pergunta: 'Como você avalia o SABOR da alimentação escolar?', resposta: 'Excelente' },
            { pergunta: 'Como você avalia a VARIEDADE dos alimentos?', resposta: 'Excelente' },
            { pergunta: 'Como você avalia a QUANTIDADE servida?', resposta: 'Excelente' },
            { pergunta: 'Como você avalia a HIGIENE no preparo?', resposta: 'Excelente' },
            { pergunta: 'Como você avalia a TEMPERATURA dos alimentos?', resposta: 'Excelente' }
          ]
        };
      case 'controle_recursos_limpeza':
        return {
          materiais_consumo: [
            { material: 'Detergente', quantidade_atual: 0, unidade: 'Litros', consumo_mensal_medio: 0, ponto_reposicao: 2 },
            { material: 'Desinfetante', quantidade_atual: 0, unidade: 'Litros', consumo_mensal_medio: 0, ponto_reposicao: 2 },
            { material: 'Álcool 70%', quantidade_atual: 0, unidade: 'Litros', consumo_mensal_medio: 0, ponto_reposicao: 3 },
            { material: 'Sabão em pó', quantidade_atual: 0, unidade: 'Kg', consumo_mensal_medio: 0, ponto_reposicao: 5 }
          ],
          equipamentos: [
            { equipamento: 'Mop Úmido', quantidade_em_uso: 0, situacao: 'Bom', necessita_reposicao: false },
            { equipamento: 'Balde Espremedor', quantidade_em_uso: 0, situacao: 'Bom', necessita_reposicao: false },
            { equipamento: 'Vassoura de Nylon', quantidade_em_uso: 0, situacao: 'Bom', necessita_reposicao: false }
          ]
        };
      case 'cronograma_verificacao_limpeza':
        return {
          ambiente: '',
          mes: 'Maio',
          registros: []
        };
      case 'registro_ocorrencia_limpeza':
        return {
          servidor: '',
          turno: 'Matutino',
          data_ocorrencia: new Date().toISOString().split('T')[0],
          horario: '',
          ambiente: '',
          descricao_problema: '',
          gravidade: 'Média',
          providencia_tomada: '',
          foto_url: ''
        };
      case 'pesquisa_percepcao_limpeza':
        return {
          publico: 'Aluno(a)',
          respostas: [
            { pergunta: 'Os ambientes estão, em geral, limpos?', resposta: 'Sempre' },
            { pergunta: 'Os banheiros estão em condições adequadas de uso?', resposta: 'Sempre' },
            { pergunta: 'O pátio e áreas externas estão limpos e organizados?', resposta: 'Sempre' },
            { pergunta: 'A cozinha e refeitório estão higienizados?', resposta: 'Sempre' },
            { pergunta: 'Há materiais de limpeza disponíveis (sabonete, papel)?', resposta: 'Sempre' }
          ]
        };
      case 'cronograma_inspecoes':
        return {
          ...base,
          itens: [
            { numero: 1, item: 'Sistema Construtivo', periodicidade: '1x ao ano', meses_programados: [], opcional: false, escola_nao_possui: false },
            { numero: 2, item: 'Cobertura', periodicidade: '2x ao ano (pré-chuvas)', meses_programados: [], opcional: false, escola_nao_possui: false },
            { numero: 3, item: 'Forro', periodicidade: '2x ao ano (férias)', meses_programados: [], opcional: true, escola_nao_possui: false },
            { numero: 4, item: 'Pisos e Revestimentos', periodicidade: '1x ao ano (férias)', meses_programados: [], opcional: false, escola_nao_possui: false },
            { numero: 5, item: 'Pintura', periodicidade: 'internas 3 anos / externas 2 anos', meses_programados: [], opcional: false, escola_nao_possui: false },
            { numero: 6, item: 'Esquadrias', periodicidade: '2 ou 3 anos', meses_programados: [], opcional: false, escola_nao_possui: false },
            { numero: 7, item: 'Instalações Elétricas Baixa Tensão', periodicidade: '1x ao ano + limpeza 3x', meses_programados: [], opcional: false, school_id: schoolId, escola_nao_possui: false },
            { numero: 8, item: 'SPDA', periodicidade: 'conforme Manual', meses_programados: [], opcional: false, escola_nao_possui: false },
            { numero: 9, item: 'Posto de Transformação', periodicidade: 'conforme Manual', meses_programados: [], opcional: true, escola_nao_possui: false },
            { numero: 10, item: "Caixa d'água e Cisterna", periodicidade: '1x ao ano', meses_programados: [], opcional: false, escola_nao_possui: false }
          ]
        };
      case 'checklist_intervencoes':
        return {
          ...base,
          intervencoes: []
        };
      case 'justificativa_pendencias':
        return {
          pendencias: []
        };
      case 'indicadores_busca_ativa':
        return {
          indice_abandono: 0,
          indice_evasao: 0,
          total_alunos_matriculados: 0,
          acoes_inicio_ano: '',
          acoes_enfrentamento_abandono: '',
          acoes_escola_protege: '',
          acoes_cartilha_escolar_iii: ''
        };
      case 'gestao_financeira':
        return {
          alimentacao: { executado: 0, saldo: 0 },
          recurso_unico: { executado: 0, saldo: 0 },
          pdde_estrutura: {
            agua: false, esgoto: false, sanitario: false,
            escola_campo: false, sala_recursos_multifuncionais: false,
            escola_acessivel: false
          },
          pdde_qualidade: {
            inovacao_educacao_conectada: false,
            novo_ensino_medio: false,
            escola_familia: false,
            escola_adolescencias: false,
            escola_tempo_integral: false,
            itinerario_formativo: false
          },
          pdde_basico: { executado: 0, saldo: 0 }
        };
      default:
        return {};
    }
  };

  const handleSave = async (novoStatus = 'rascunho') => {
    if (readonly || saving) return;
    setSaving(true);
    setError(null);

    try {
      const { error: dbErr } = await supabase
        .from('meg_formularios')
        .upsert({
          evidencia_id: evidenciaId,
          school_id: schoolId,
          tipo_formulario: tipo,
          dados,
          status: novoStatus,
          criado_por: user?.email || 'Sistema',
          atualizado_por: user?.email || 'Sistema',
          atualizado_em: new Date().toISOString()
        }, {
          onConflict: 'evidencia_id,school_id'
        });

      if (dbErr) throw dbErr;

      // Update meg_checklist status automatically
      await supabase
        .from('meg_checklist')
        .upsert({
          school_id: schoolId,
          evidencia_id: evidenciaId,
          status: novoStatus === 'enviado' ? 'concluido' : 'em_andamento',
          atualizado_por: user?.email || 'Sistema',
          atualizado_em: new Date().toISOString()
        }, {
          onConflict: 'school_id,evidencia_id'
        });

      onSaveSuccess(`Formulário salvo como ${novoStatus === 'enviado' ? 'enviado' : 'rascunho'} com sucesso!`);
      onClose();
    } catch (err: any) {
      console.error('Error saving form data:', err);
      setError(err.message || 'Falha ao salvar formulário no banco de dados.');
    } finally {
      setSaving(false);
    }
  };

  const updateDado = (key: string, value: any) => {
    setDados((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-2" />
        <span>Carregando estrutura do formulário...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Render the specific form content */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {renderFormInputs(tipo, dados, updateDado, readonly)}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Cancelar
        </button>
        {!readonly && (
          <>
            <button
              onClick={() => handleSave('rascunho')}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-slate-500" />}
              Salvar Rascunho
            </button>
            <button
              onClick={() => handleSave('enviado')}
              disabled={saving}
              className="px-5 py-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4 text-white" />}
              Enviar e Concluir
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Input Renderers per Form ────────────────────────────────────────────────
function renderFormInputs(
  tipo: string,
  dados: any,
  set: (k: string, v: any) => void,
  readonly: boolean
) {
  const INPUT = "w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50";
  const SELECT = INPUT + " cursor-pointer";
  const CHECKBOX = "w-4 h-4 text-blue-600 rounded border-slate-250 focus:ring-blue-500 cursor-pointer disabled:opacity-50";

  switch (tipo) {
    case 'cronograma_patrimonial':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Subcomissão Responsável</label>
              <input 
                className={INPUT} 
                value={dados.subcomissao || ''} 
                onChange={e => set('subcomissao', e.target.value)} 
                disabled={readonly}
                placeholder="Ex: Subcomissão de Inventário EECM" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Unidade Escolar</label>
              <input className={INPUT} value={dados.unidade_escolar || ''} disabled={true} />
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Ações Patrimoniais</h5>
            <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-150 dark:divide-slate-800">
              {dados.acoes?.map((ac: any, i: number) => (
                <div key={i} className="p-3 flex flex-col sm:flex-row items-center gap-3 justify-between bg-white/40 dark:bg-slate-900/30">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1">{ac.acao}</span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input 
                      type="date" 
                      className={INPUT + " sm:w-36"} 
                      value={ac.data || ''} 
                      onChange={e => {
                        const copy = [...dados.acoes];
                        copy[i].data = e.target.value;
                        set('acoes', copy);
                      }}
                      disabled={readonly}
                    />
                    <select 
                      className={SELECT + " sm:w-36"}
                      value={ac.situacao}
                      onChange={e => {
                        const copy = [...dados.acoes];
                        copy[i].situacao = e.target.value;
                        set('acoes', copy);
                      }}
                      disabled={readonly}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'dfd_pcr':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Setor Requisitante</label>
              <input className={INPUT} value={dados.setor_requisitante || ''} onChange={e => set('setor_requisitante', e.target.value)} disabled={readonly} placeholder="Ex: Secretaria Escolar" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Responsável pela Demanda</label>
              <input className={INPUT} value={dados.responsavel_demanda || ''} onChange={e => set('responsavel_demanda', e.target.value)} disabled={readonly} placeholder="Ex: Maria Souza" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Matrícula</label>
              <input className={INPUT} value={dados.matricula || ''} onChange={e => set('matricula', e.target.value)} disabled={readonly} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">E-mail</label>
              <input className={INPUT} value={dados.email || ''} onChange={e => set('email', e.target.value)} disabled={readonly} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Telefone</label>
              <input className={INPUT} value={dados.telefone || ''} onChange={e => set('telefone', e.target.value)} disabled={readonly} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tipo de Recurso</label>
            <select className={SELECT} value={dados.tipo_recurso} onChange={e => set('tipo_recurso', e.target.value)} disabled={readonly}>
              <option value="RU">Recurso Único (RU)</option>
              <option value="FNDE">FNDE</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Objeto da Demanda</label>
            <input className={INPUT} value={dados.objeto || ''} onChange={e => set('objeto', e.target.value)} disabled={readonly} placeholder="Breve título do objeto a ser contratado" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Descrição Detalhada</label>
            <textarea className={INPUT} rows={3} value={dados.descricao_demanda || ''} onChange={e => set('descricao_demanda', e.target.value)} disabled={readonly} placeholder="Insira o detalhamento da contratação/aquisição..." />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Valor Estimado (R$)</label>
            <input type="number" className={INPUT} value={dados.valor_estimado || 0} onChange={e => set('valor_estimado', parseFloat(e.target.value))} disabled={readonly} />
          </div>
        </div>
      );

    case 'ficha_cadastral_imovel':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">RIP Imóvel</label>
              <input className={INPUT} value={dados.identificacao_imovel_rip || ''} onChange={e => set('identificacao_imovel_rip', e.target.value)} disabled={readonly} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nº Matrícula Cartório</label>
              <input className={INPUT} value={dados.matricula || ''} onChange={e => set('matricula', e.target.value)} disabled={readonly} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Endereço Completo</label>
            <input className={INPUT} value={dados.endereco || ''} onChange={e => set('endereco', e.target.value)} disabled={readonly} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Área Terreno (m²)</label>
              <input type="number" className={INPUT} value={dados.area_terreno_m2 || 0} onChange={e => set('area_terreno_m2', parseFloat(e.target.value))} disabled={readonly} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Área Construída (m²)</label>
              <input type="number" className={INPUT} value={dados.area_construida_m2 || 0} onChange={e => set('area_construida_m2', parseFloat(e.target.value))} disabled={readonly} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nº Pisos</label>
              <input type="number" className={INPUT} value={dados.num_pisos || 1} onChange={e => set('num_pisos', parseInt(e.target.value))} disabled={readonly} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Estado de Conservação</label>
              <select className={SELECT} value={dados.estado_conservacao} onChange={e => set('estado_conservacao', e.target.value)} disabled={readonly}>
                <option value="Ótimo">Ótimo</option>
                <option value="Bom">Bom</option>
                <option value="Ruim">Ruim</option>
                <option value="Péssimo">Péssimo</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Imóvel Regularizado (Termo Outorga)?</label>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" className={CHECKBOX} checked={dados.possui_termo_outorga || false} onChange={e => set('possui_termo_outorga', e.target.checked)} disabled={readonly} />
                <span className="text-xs text-slate-600 dark:text-slate-400">Sim, possui outorga</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'checklist_tti':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Conformidades TTI</h5>
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <input type="checkbox" className={CHECKBOX} checked={dados.assinaturas_presentes || false} onChange={e => set('assinaturas_presentes', e.target.checked)} disabled={readonly} />
                <span className="text-xs text-slate-700 dark:text-slate-300">Assinaturas presentes (Cedente, Recebedor e Patrimônio)</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className={CHECKBOX} checked={dados.pasta_fisica_identificada || false} onChange={e => set('pasta_fisica_identificada', e.target.checked)} disabled={readonly} />
                <span className="text-xs text-slate-700 dark:text-slate-300">Pasta física da unidade catalogada e identificada</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className={CHECKBOX} checked={dados.digitalizacao_pdf || false} onChange={e => set('digitalizacao_pdf', e.target.checked)} disabled={readonly} />
                <span className="text-xs text-slate-700 dark:text-slate-300">Documento digitalizado em formato PDF inserido no sistema</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Anotações e Observações</label>
            <textarea className={INPUT} rows={3} value={dados.observacoes || ''} onChange={e => set('observacoes', e.target.value)} disabled={readonly} placeholder="Informações de histórico ou transferências pendentes..." />
          </div>
        </div>
      );

    case 'lancamento_nota_fiscal':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total de Notas Pagas (R$)</label>
              <input type="number" className={INPUT} value={dados.total_notas_pagas || 0} onChange={e => set('total_notas_pagas', parseFloat(e.target.value))} disabled={readonly} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Saldo Atual da Alimentação (R$)</label>
              <input type="number" className={INPUT} value={dados.saldo_atual || 0} onChange={e => set('saldo_atual', parseFloat(e.target.value))} disabled={readonly} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Notas Fiscais Lançadas</h5>
              {!readonly && (
                <button
                  type="button"
                  onClick={() => {
                    const copy = [...(dados.notas_lancadas || [])];
                    copy.push({ numero_nf: '', fornecedor: '', valor: 0, data_lancamento: '', tipo: 'agricultura_familiar' });
                    set('notas_lancadas', copy);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-[11px] font-bold rounded-lg shadow-sm transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Adicionar Nota
                </button>
              )}
            </div>

            {(!dados.notas_lancadas || dados.notas_lancadas.length === 0) ? (
              <div className="p-8 text-center border border-dashed rounded-2xl text-slate-400 text-xs">
                Nenhuma nota fiscal adicionada ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {dados.notas_lancadas.map((nf: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl relative space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Nº da Nota</label>
                        <input className={INPUT} value={nf.numero_nf} onChange={e => {
                          const copy = [...dados.notas_lancadas];
                          copy[idx].numero_nf = e.target.value;
                          set('notas_lancadas', copy);
                        }} disabled={readonly} />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Fornecedor</label>
                        <input className={INPUT} value={nf.fornecedor} onChange={e => {
                          const copy = [...dados.notas_lancadas];
                          copy[idx].fornecedor = e.target.value;
                          set('notas_lancadas', copy);
                        }} disabled={readonly} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Valor (R$)</label>
                        <input type="number" className={INPUT} value={nf.valor} onChange={e => {
                          const copy = [...dados.notas_lancadas];
                          copy[idx].valor = parseFloat(e.target.value);
                          set('notas_lancadas', copy);
                        }} disabled={readonly} />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Data</label>
                        <input type="date" className={INPUT} value={nf.data_lancamento} onChange={e => {
                          const copy = [...dados.notas_lancadas];
                          copy[idx].data_lancamento = e.target.value;
                          set('notas_lancadas', copy);
                        }} disabled={readonly} />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400">Tipo</label>
                        <select className={SELECT} value={nf.tipo} onChange={e => {
                          const copy = [...dados.notas_lancadas];
                          copy[idx].tipo = e.target.value;
                          set('notas_lancadas', copy);
                        }} disabled={readonly}>
                          <option value="agricultura_familiar">Agri. Familiar</option>
                          <option value="fornecedor_licitado">Fornecedor Licitado</option>
                        </select>
                      </div>
                    </div>

                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => {
                          const copy = dados.notas_lancadas.filter((_: any, i: number) => i !== idx);
                          set('notas_lancadas', copy);
                        }}
                        className="absolute top-2 right-2 text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition"
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
      );

    case 'pesquisa_satisfacao_alimentacao':
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Avalie cada critério de satisfação da alimentação escolar na escala de Muito Ruim a Excelente:</p>
          
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {dados.respostas?.map((res: any, idx: number) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 dark:bg-slate-900/30">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1">{res.pergunta}</span>
                <select
                  className={SELECT + " sm:w-48 shrink-0"}
                  value={res.resposta}
                  onChange={e => {
                    const copy = [...dados.respostas];
                    copy[idx].resposta = e.target.value;
                    set('respostas', copy);
                  }}
                  disabled={readonly}
                >
                  <option value="Muito Ruim">Muito Ruim</option>
                  <option value="Ruim">Ruim</option>
                  <option value="Regular">Regular</option>
                  <option value="Bom">Bom</option>
                  <option value="Excelente">Excelente</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      );

    case 'controle_recursos_limpeza':
      return (
        <div className="space-y-6">
          {/* Materiais de Consumo */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Materiais de Consumo de Limpeza</h5>
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {dados.materiais_consumo?.map((mc: any, idx: number) => (
                <div key={idx} className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center bg-white/40 dark:bg-slate-900/30">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{mc.material}</span>
                  <div className="flex gap-2 items-center">
                    <input type="number" className={INPUT} value={mc.quantidade_atual} onChange={e => {
                      const copy = [...dados.materiais_consumo];
                      copy[idx].quantidade_atual = parseInt(e.target.value);
                      set('materiais_consumo', copy);
                    }} disabled={readonly} />
                    <span className="text-xs text-slate-400">{mc.unidade}</span>
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-slate-400 block sm:hidden">Média Mensal</label>
                    <input type="number" className={INPUT} value={mc.consumo_mensal_medio} onChange={e => {
                      const copy = [...dados.materiais_consumo];
                      copy[idx].consumo_mensal_medio = parseInt(e.target.value);
                      set('materiais_consumo', copy);
                    }} disabled={readonly} placeholder="Média Mensal" />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-slate-400 block sm:hidden">Ponto Reposição</label>
                    <input type="number" className={INPUT} value={mc.ponto_reposicao} onChange={e => {
                      const copy = [...dados.materiais_consumo];
                      copy[idx].ponto_reposicao = parseInt(e.target.value);
                      set('materiais_consumo', copy);
                    }} disabled={readonly} placeholder="Ponto Reposição" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Equipamentos */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Equipamentos</h5>
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {dados.equipamentos?.map((eq: any, idx: number) => (
                <div key={idx} className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center bg-white/40 dark:bg-slate-900/30">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{eq.equipamento}</span>
                  <input type="number" className={INPUT} value={eq.quantidade_em_uso} onChange={e => {
                    const copy = [...dados.equipamentos];
                    copy[idx].quantidade_em_uso = parseInt(e.target.value);
                    set('equipamentos', copy);
                  }} disabled={readonly} />
                  <select className={SELECT} value={eq.situacao} onChange={e => {
                    const copy = [...dados.equipamentos];
                    copy[idx].situacao = e.target.value;
                    set('equipamentos', copy);
                  }} disabled={readonly}>
                    <option value="Bom">Bom</option>
                    <option value="Ruim">Ruim</option>
                  </select>
                  <div className="flex items-center gap-1.5 justify-end">
                    <input type="checkbox" className={CHECKBOX} checked={eq.necessita_reposicao} onChange={e => {
                      const copy = [...dados.equipamentos];
                      copy[idx].necessita_reposicao = e.target.checked;
                      set('equipamentos', copy);
                    }} disabled={readonly} />
                    <span className="text-[10px] text-slate-500">Repor</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'cronograma_inspecoes':
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Programação anual de inspeções baseada nas diretrizes do MEG Educação. Marque em quais meses as vistorias prediais serão realizadas:</p>
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {dados.itens?.map((it: any, idx: number) => (
              <div key={idx} className="p-4 space-y-2 bg-white/40 dark:bg-slate-900/30">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Item {it.numero}: {it.item} <span className="text-[10px] text-slate-400 font-normal">({it.periodicidade})</span></span>
                  {it.opcional && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input type="checkbox" className={CHECKBOX} checked={it.escola_nao_possui} onChange={e => {
                        const copy = [...dados.itens];
                        copy[idx].escola_nao_possui = e.target.checked;
                        set('itens', copy);
                      }} disabled={readonly} />
                      <span className="text-[10px] font-bold text-rose-500">Não possui</span>
                    </div>
                  )}
                </div>

                {!it.escola_nao_possui && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map(m => {
                      const isSelected = it.meses_programados?.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            if (readonly) return;
                            const copy = [...dados.itens];
                            let list = copy[idx].meses_programados || [];
                            if (isSelected) {
                              list = list.filter((item: string) => item !== m);
                            } else {
                              list.push(m);
                            }
                            copy[idx].meses_programados = list;
                            set('itens', copy);
                          }}
                          disabled={readonly}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'indicadores_busca_ativa':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Índice Abandono (%)</label>
              <input type="number" step="0.01" className={INPUT} value={dados.indice_abandono} onChange={e => set('indice_abandono', parseFloat(e.target.value))} disabled={readonly} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Índice Evasão (%)</label>
              <input type="number" step="0.01" className={INPUT} value={dados.indice_evasao} onChange={e => set('indice_evasao', parseFloat(e.target.value))} disabled={readonly} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Alunos Matriculados</label>
              <input type="number" className={INPUT} value={dados.total_alunos_matriculados} onChange={e => set('total_alunos_matriculados', parseInt(e.target.value))} disabled={readonly} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Ações Realizadas no Início do Ano</label>
            <textarea className={INPUT} rows={2} value={dados.acoes_inicio_ano || ''} onChange={e => set('acoes_inicio_ano', e.target.value)} disabled={readonly} placeholder="Ações para mitigar o abandono..." />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Ações Enfrentamento Abandono</label>
            <textarea className={INPUT} rows={2} value={dados.acoes_enfrentamento_abandono || ''} onChange={e => set('acoes_enfrentamento_abandono', e.target.value)} disabled={readonly} />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Ações Escola Protege / Cartilha Escolar</label>
            <textarea className={INPUT} rows={2} value={dados.acoes_escola_protege || ''} onChange={e => set('acoes_escola_protege', e.target.value)} disabled={readonly} />
          </div>
        </div>
      );

    case 'gestao_financeira':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Recursos de Alimentação (R$)</h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] uppercase font-bold text-slate-400">Executado</label>
                  <input type="number" className={INPUT} value={dados.alimentacao?.executado || 0} onChange={e => set('alimentacao', { ...dados.alimentacao, executado: parseFloat(e.target.value) })} disabled={readonly} />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-slate-400">Saldo</label>
                  <input type="number" className={INPUT} value={dados.alimentacao?.saldo || 0} onChange={e => set('alimentacao', { ...dados.alimentacao, saldo: parseFloat(e.target.value) })} disabled={readonly} />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Recurso Único (R$)</h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] uppercase font-bold text-slate-400">Executado</label>
                  <input type="number" className={INPUT} value={dados.recurso_unico?.executado || 0} onChange={e => set('recurso_unico', { ...dados.recurso_unico, executado: parseFloat(e.target.value) })} disabled={readonly} />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-slate-400">Saldo</label>
                  <input type="number" className={INPUT} value={dados.recurso_unico?.saldo || 0} onChange={e => set('recurso_unico', { ...dados.recurso_unico, saldo: parseFloat(e.target.value) })} disabled={readonly} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">PDDE Estrutura (Módulos Concluídos)</h5>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { k: 'agua', label: 'Água Potável' },
                { k: 'esgoto', label: 'Esgotamento Sanitário' },
                { k: 'sanitario', label: 'Sanitário Adequado' },
                { k: 'escola_campo', label: 'Escola do Campo' },
                { k: 'sala_recursos_multifuncionais', label: 'Sala de Recursos Multifuncionais' },
                { k: 'escola_acessivel', label: 'Escola Acessível' }
              ].map(item => (
                <div key={item.k} className="flex items-center gap-2">
                  <input type="checkbox" className={CHECKBOX} checked={dados.pdde_estrutura?.[item.k] || false} onChange={e => set('pdde_estrutura', { ...dados.pdde_estrutura, [item.k]: e.target.checked })} disabled={readonly} />
                  <span className="text-[10px] text-slate-700 dark:text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-8 text-center text-slate-400 text-xs">
          O formulário digital para este tipo não requer campos customizados adicionais. Marque o status acima.
        </div>
      );
  }
}
