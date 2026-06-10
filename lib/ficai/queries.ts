import { supabase } from '@/lib/supabase'
import type { AlunoRecord, FICAIEntry } from '@/types/ficai'

/**
 * Busca todos os alunos do Supabase para o match com a planilha da escola específica.
 */
export async function fetchAlunosParaMatch(schoolId: string): Promise<AlunoRecord[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, registration_number, contacts')
    .eq('school_id', schoolId)
    .eq('archived', false)
    .order('name')

  if (error) throw new Error(`Erro ao buscar alunos: ${error.message}`)

  return (data ?? []).map((d: any) => {
    // Extract first contact's phone and name
    const contactsArray = d.contacts && Array.isArray(d.contacts) ? d.contacts : [];
    const firstContact = contactsArray.length > 0 ? contactsArray[0] : null;
    
    const codAlunoNum = d.registration_number ? parseInt(d.registration_number, 10) : null;

    return {
      id: d.id,
      cod_aluno: isNaN(codAlunoNum as any) ? null : codAlunoNum,
      nome: d.name,
      telefone: firstContact?.phone || null,
      nome_responsavel: firstContact?.name || null,
      telefone_responsavel: firstContact?.phone || null,
      contacts: contactsArray
    };
  });
}

/**
 * Salva os dados processados da planilha na tabela ficai_importacoes.
 * Upsert por (cod_aluno, ano) para rodar re-imports com segurança.
 */
export async function upsertFICAIImport(entries: FICAIEntry[], schoolId?: string): Promise<void> {
  const ano = new Date().getFullYear()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const rows = entries.map(e => ({
    ano,
    cod_aluno:          e.codAluno,
    cod_matricula:      e.codMatricula,
    nome_aluno:         e.nomeAluno,
    turma:              e.turma,
    turno:              e.turno,
    modalidade:         e.modalidade,
    perc_faltas_geral:  e.faltasGeral,
    perc_faltas_1bim:   e.faltas1Bim,
    perc_faltas_2bim:   e.faltas2Bim,
    ficai_aberto:       e.ficaiAberto,
    data_ficai:         e.dataFicai,
    encaminhado:        e.encaminhado,
    data_encaminhamento: e.dataEncaminhamento,
    aluno_id:           e.alunoId,
    match_score:        e.matchScore,
    school_id:          schoolId || null,
    importado_por:      user?.id ?? null,
    importado_em:       new Date().toISOString(),
  }))

  // Upsert em lotes de 200 para não estourar o request
  const BATCH = 200
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('ficai_importacoes')
      .upsert(batch, { onConflict: 'cod_aluno,ano' })

    if (error) throw new Error(`Erro ao salvar importação (lote ${i}): ${error.message}`)
  }
}

/**
 * Busca todos os registros salvos da tabela ficai_importacoes para a escola atual.
 */
export async function fetchSavedFICAIImports(schoolId: string): Promise<FICAIEntry[]> {
  const { data, error } = await supabase
    .from('ficai_importacoes')
    .select('*, students(contacts)')
    .eq('school_id', schoolId)
    .order('nome_aluno');

  if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`);

  let profiles: any[] = [];
  try {
    const { data: pData } = await supabase
      .from('user_profiles')
      .select('id, name');
    profiles = pData || [];
  } catch (err) {
    console.warn('[FICAI] Falha ao carregar nomes de perfis para importação:', err);
  }
  const profileMap = new Map<string, string>(profiles.map((p: any) => [p.id, p.name]));

  return (data || []).map((d: any) => {
    // Busca do contacts da relação students se existir
    const contactsArray = d.students?.contacts && Array.isArray(d.students.contacts) ? d.students.contacts : [];
    const firstContact = contactsArray.length > 0 ? contactsArray[0] : null;

    const faltasGeral = d.perc_faltas_geral;
    const ficaiAberto = d.ficai_aberto;
    const alertaGrave = faltasGeral !== null && faltasGeral >= 25;
    const ficaiNecessaria = alertaGrave && !ficaiAberto;

    return {
      nomeAluno: d.nome_aluno || '',
      turma: d.turma || '',
      turno: d.turno || '',
      modalidade: d.modalidade || '',
      codAluno: d.cod_aluno,
      codMatricula: d.cod_matricula,
      faltasGeral,
      faltas1Bim: d.perc_faltas_1bim,
      faltas2Bim: d.perc_faltas_2bim,
      ficaiAberto,
      dataFicai: d.data_ficai || '',
      encaminhado: d.encaminhado,
      dataEncaminhamento: d.data_encaminhamento || '',
      alunoId: d.aluno_id,
      telefone: firstContact?.phone || null,
      nomeResponsavel: firstContact?.name || null,
      telefoneResponsavel: firstContact?.phone || null,
      contacts: contactsArray,
      matchScore: d.match_score || 1.0,
      matched: !!d.aluno_id,
      alerta: d.perc_faltas_geral !== null && d.perc_faltas_geral >= 10,
      alertaGrave,
      ficaiNecessaria,
      importadoEm: d.importado_em || undefined,
      importadoPor: d.importado_por || undefined,
      importadoPorNome: d.importado_por ? profileMap.get(d.importado_por) || 'Desconhecido' : undefined,
    };
  });
}

/**
 * Atualiza o status do FICAI de um aluno específico no banco de dados, isolado por escola.
 */
export async function updateFICAIImportStatus(
  codAluno: number,
  ano: number,
  schoolId: string,
  updates: {
    ficai_aberto: boolean;
    data_ficai: string;
    encaminhado: boolean;
    data_encaminhamento: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('ficai_importacoes')
    .update(updates)
    .match({ cod_aluno: codAluno, ano, school_id: schoolId });

  if (error) throw new Error(`Erro ao atualizar status do FICAI: ${error.message}`);
}

/**
 * Atualiza o array de contatos (contacts) de um estudante específico no banco de dados.
 */
export async function updateStudentContacts(
  studentId: string,
  contacts: { name: string; phone: string }[]
): Promise<void> {
  const { error } = await supabase
    .from('students')
    .update({ contacts })
    .eq('id', studentId);

  if (error) throw new Error(`Erro ao atualizar contatos do estudante: ${error.message}`);
}

