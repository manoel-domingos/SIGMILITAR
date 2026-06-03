import { supabase } from '@/lib/supabase'
import type { AlunoRecord, FICAIEntry } from '@/types/ficai'

/**
 * Busca todos os alunos do Supabase para o match com a planilha.
 */
export async function fetchAlunosParaMatch(): Promise<AlunoRecord[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, registration_number, contacts')
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
      telefone_responsavel: firstContact?.phone || null
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
