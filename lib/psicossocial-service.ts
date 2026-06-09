import { supabase } from './supabase';
import { Ocorrencia, FichaNotificacao, Acompanhamento, AgendaPreventiva } from './data';

import { getDbSchoolId } from './useTenantConfig';

// Helper to wrap queries with school_id filter
const bySchool = (query: any, schoolId: string) => {
  const dbSchoolId = getDbSchoolId(schoolId);
  return dbSchoolId && dbSchoolId !== 'DRE' ? query.eq('school_id', dbSchoolId) : query;
};

export const psicossocialService = {
  // Fetch all data for the psicossocial module
  async fetchAll(schoolId: string) {
    try {
      const [{ data: ocorrencias }, { data: fichas }, { data: acompanhamentos }, { data: agenda }] = await Promise.all([
        bySchool(supabase.from('ocorrencias').select('*').order('data_notificacao', { ascending: false }), schoolId),
        bySchool(supabase.from('fichas_notificacao').select('*').order('data_notificacao', { ascending: false }), schoolId),
        bySchool(supabase.from('acompanhamentos').select('*').order('data_registro', { ascending: false }), schoolId),
        bySchool(supabase.from('agenda_preventiva').select('*').order('data_inicio', { ascending: false }), schoolId),
      ]);

      return {
        ocorrencias: (ocorrencias || []) as Ocorrencia[],
        fichasNotificacao: (fichas || []) as FichaNotificacao[],
        acompanhamentos: (acompanhamentos || []) as Acompanhamento[],
        agendaPreventiva: (agenda || []) as AgendaPreventiva[],
      };
    } catch (err: any) {
      console.error('Error fetching psicossocial data:', err);
      throw new Error(err.message || 'Erro ao carregar dados do Módulo Psicossocial.');
    }
  },

  // Ocorrencias CRUD
  async addOcorrencia(o: Omit<Ocorrencia, 'id'>, schoolId: string, userId?: string) {
    try {
      const payload = {
        school_id: getDbSchoolId(schoolId),
        data_notificacao: o.data_notificacao,
        municipio: o.municipio || null,
        uf: o.uf || 'MT',
        escola_nome: o.escola_nome || null,
        estudantes: o.estudantes || [],
        responsaveis: o.responsaveis || [],
        tipos_violencia: o.tipos_violencia || [],
        relato: o.relato,
        testemunhas: o.testemunhas || [],
        procedimento_executado: o.procedimento_executado || null,
        responsaveis_acionados: o.responsaveis_acionados || null,
        motivo_nao_acionamento: o.motivo_nao_acionamento || null,
        conversa_registrada_ata: o.conversa_registrada_ata ?? false,
        responsaveis_concordaram: o.responsaveis_concordaram ?? false,
        motivo_discordancia: o.motivo_discordancia || null,
        orientados_bo: o.orientados_bo ?? false,
        motivo_sem_bo: o.motivo_sem_bo || null,
        historico_estudante: o.historico_estudante ?? false,
        historico_descricao: o.historico_descricao || null,
        quem_preencheu: o.quem_preencheu || null,
        assinatura_gestao: o.assinatura_gestao || null,
        status: o.status || 'aberto',
        created_by: userId || null
      };

      const { data, error } = await supabase
        .from('ocorrencias')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as Ocorrencia;
    } catch (err: any) {
      console.error('Error adding ocorrencia:', err);
      throw new Error(err.message || 'Erro ao registrar nova ocorrência.');
    }
  },

  async updateOcorrencia(id: string, o: Partial<Ocorrencia>) {
    try {
      const payload: any = { ...o };
      delete payload.id;
      delete payload.school_id;
      delete payload.created_at;
      delete payload.created_by;
      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('ocorrencias')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Ocorrencia;
    } catch (err: any) {
      console.error('Error updating ocorrencia:', err);
      throw new Error(err.message || 'Erro ao atualizar ocorrência.');
    }
  },

  async deleteOcorrencia(id: string) {
    try {
      const { error } = await supabase
        .from('ocorrencias')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting ocorrencia:', err);
      throw new Error(err.message || 'Erro ao excluir ocorrência.');
    }
  },

  // Fichas Notificacao CRUD
  async addFichaNotificacao(f: Omit<FichaNotificacao, 'id'>, schoolId: string, userId?: string) {
    try {
      const payload = {
        school_id: getDbSchoolId(schoolId),
        ocorrencia_id: f.ocorrencia_id || null,
        data_notificacao: f.data_notificacao,
        municipio_notificacao: f.municipio_notificacao || null,
        uf: f.uf || 'MT',
        escola_nome: f.escola_nome || null,
        endereco_escola: f.endereco_escola || null,
        nome_estudante: f.nome_estudante,
        data_nascimento: f.data_nascimento || null,
        idade: f.idade || null,
        sexo: f.sexo || null,
        cartao_sus: f.cartao_sus || null,
        escolaridade: f.escolaridade || null,
        deficiencia: f.deficiencia || null,
        responsaveis: f.responsaveis || [],
        endereco_responsavel: f.endereco_responsavel || null,
        telefone: f.telefone || null,
        cep: f.cep || null,
        tipo_violacao: f.tipo_violacao || [],
        informacoes_complementares: f.informacoes_complementares || null,
        nome_diretor: f.nome_diretor || null,
        assinatura_diretor: f.assinatura_diretor || null,
        ficha_enviada_em: f.ficha_enviada_em || null,
        ficha_enviada_para: f.ficha_enviada_para || [],
        created_by: userId || null
      };

      const { data, error } = await supabase
        .from('fichas_notificacao')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as FichaNotificacao;
    } catch (err: any) {
      console.error('Error adding ficha notificacao:', err);
      throw new Error(err.message || 'Erro ao registrar nova ficha de notificação.');
    }
  },

  async updateFichaNotificacao(id: string, f: Partial<FichaNotificacao>) {
    try {
      const payload: any = { ...f };
      delete payload.id;
      delete payload.school_id;
      delete payload.created_at;
      delete payload.created_by;

      const { data, error } = await supabase
        .from('fichas_notificacao')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FichaNotificacao;
    } catch (err: any) {
      console.error('Error updating ficha notificacao:', err);
      throw new Error(err.message || 'Erro ao atualizar ficha de notificação.');
    }
  },

  async deleteFichaNotificacao(id: string) {
    try {
      const { error } = await supabase
        .from('fichas_notificacao')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting ficha notificacao:', err);
      throw new Error(err.message || 'Erro ao excluir ficha de notificação.');
    }
  },

  // Acompanhamentos CRUD
  async addAcompanhamento(a: Omit<Acompanhamento, 'id'>, schoolId: string, userId?: string) {
    try {
      const payload = {
        school_id: getDbSchoolId(schoolId),
        ocorrencia_id: a.ocorrencia_id,
        data_registro: a.data_registro,
        descricao: a.descricao,
        tipo_acao: a.tipo_acao || null,
        responsavel: a.responsavel || null,
        created_by: userId || null
      };

      const { data, error } = await supabase
        .from('acompanhamentos')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as Acompanhamento;
    } catch (err: any) {
      console.error('Error adding acompanhamento:', err);
      throw new Error(err.message || 'Erro ao registrar acompanhamento.');
    }
  },

  async deleteAcompanhamento(id: string) {
    try {
      const { error } = await supabase
        .from('acompanhamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting acompanhamento:', err);
      throw new Error(err.message || 'Erro ao excluir acompanhamento.');
    }
  },

  // Agenda Preventiva CRUD
  async fetchAgendaPreventiva(schoolId: string) {
    try {
      const { data, error } = await bySchool(
        supabase.from('agenda_preventiva').select('*').order('data_inicio', { ascending: true }),
        schoolId
      );

      if (error) throw error;
      return (data || []) as AgendaPreventiva[];
    } catch (err: any) {
      console.error('Error fetching agenda preventiva:', err);
      throw new Error(err.message || 'Erro ao carregar agenda preventiva.');
    }
  },

  async addAgendaPreventiva(p: Omit<AgendaPreventiva, 'id'>, schoolId: string, userId?: string) {
    try {
      const payload = {
        school_id: getDbSchoolId(schoolId),
        titulo: p.titulo,
        descricao: p.descricao || null,
        tematica: p.tematica || null,
        eixo: p.eixo || null,
        data_inicio: p.data_inicio || null,
        data_fim: p.data_fim || null,
        periodicidade: p.periodicidade || null,
        publico_alvo: p.publico_alvo || null,
        status: p.status || 'planejado',
        occurrence_id: p.occurrence_id || null,
        student_id: p.student_id || null,
        source: p.source || null,
        metadata: p.metadata || {},
        created_by: userId || null
      };

      const { data, error } = await supabase
        .from('agenda_preventiva')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as AgendaPreventiva;
    } catch (err: any) {
      console.error('Error adding agenda preventiva:', err);
      throw new Error(err.message || 'Erro ao registrar atividade preventiva.');
    }
  },

  async updateAgendaPreventiva(id: string, p: Partial<AgendaPreventiva>) {
    try {
      const payload: any = { ...p };
      delete payload.id;
      delete payload.school_id;
      delete payload.created_at;
      delete payload.created_by;

      const { data, error } = await supabase
        .from('agenda_preventiva')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AgendaPreventiva;
    } catch (err: any) {
      console.error('Error updating agenda preventiva:', err);
      throw new Error(err.message || 'Erro ao atualizar atividade preventiva.');
    }
  },

  async syncDisciplinaryRetentionEvent(payload: {
    schoolId: string;
    occurrenceId: string;
    studentId: string;
    studentName: string;
    className?: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    measure: string;
    ruleCodes?: number[];
    registeredBy?: string;
    userId?: string;
  }) {
    try {
      const eventPayload = {
        school_id: getDbSchoolId(payload.schoolId),
        titulo: 'Retenção do intervalo - ' + payload.studentName,
        descricao: 'Medida disciplinar vinculada à ocorrência ' + payload.occurrenceId + '.',
        tematica: 'disciplina',
        eixo: 'acao_intervencao',
        data_inicio: payload.startDate,
        data_fim: payload.endDate,
        periodicidade: 'eventual',
        publico_alvo: 'estudantes',
        status: 'planejado',
        occurrence_id: payload.occurrenceId,
        student_id: payload.studentId,
        source: 'disciplinary_retention',
        metadata: {
          turma: payload.className || null,
          medida: payload.measure,
          durationDays: payload.durationDays,
          ruleCodes: payload.ruleCodes || [],
          registeredBy: payload.registeredBy || null
        },
        created_by: payload.userId || null
      };

      const { data: existing, error: findError } = await supabase
        .from('agenda_preventiva')
        .select('id')
        .eq('school_id', getDbSchoolId(payload.schoolId))
        .eq('occurrence_id', payload.occurrenceId)
        .eq('source', 'disciplinary_retention')
        .maybeSingle();

      if (findError) throw findError;

      const query = existing?.id
        ? supabase.from('agenda_preventiva').update(eventPayload).eq('id', existing.id)
        : supabase.from('agenda_preventiva').insert([eventPayload]);

      const { data, error } = await query.select().single();
      if (error) throw error;
      return data as AgendaPreventiva;
    } catch (err: any) {
      console.error('Error syncing disciplinary retention event:', err);
      throw new Error(err.message || 'Erro ao sincronizar retenção na agenda.');
    }
  },

  async cancelDisciplinaryRetentionEvent(occurrenceId: string, schoolId: string) {
    try {
      const { error } = await supabase
        .from('agenda_preventiva')
        .update({ status: 'cancelado' })
        .eq('school_id', getDbSchoolId(schoolId))
        .eq('occurrence_id', occurrenceId)
        .eq('source', 'disciplinary_retention');

      if (error) throw error;
    } catch (err: any) {
      console.error('Error canceling disciplinary retention event:', err);
      throw new Error(err.message || 'Erro ao cancelar retenção na agenda.');
    }
  },

  async deleteAgendaPreventiva(id: string) {
    try {
      const { error } = await supabase
        .from('agenda_preventiva')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting agenda preventiva:', err);
      throw new Error(err.message || 'Erro ao excluir atividade preventiva.');
    }
  }
};
