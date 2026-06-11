import { supabase } from '@/lib/supabase'
import type { AlunoRecord, FICAIAcao, FICAIEntry, FICAIHistoricoPoint, FICAIImportSession } from '@/types/ficai'
import { deriveFicaiFlags } from './constants'

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
 * Retorna informações do usuário autenticado (id + nome do perfil).
 */
export async function getCurrentUserInfo(): Promise<{ id: string | null; name: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return { id: null, name: 'Desconhecido' }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()
  return { id: user.id, name: profile?.name || 'Desconhecido' }
}

/**
 * Salva os dados processados da planilha na tabela ficai_importacoes.
 * Merge de histórico: adiciona ponto novo só quando % mudou vs último registro.
 * NÃO cria sessão de importação — responsabilidade do caller.
 */
export async function upsertFICAIImport(entries: FICAIEntry[], schoolId?: string, refDateISO?: string | null): Promise<void> {
  const ano = new Date().getFullYear()
  const nowISO = new Date().toISOString()
  // Data do ponto de histórico = data da planilha (nome do arquivo) quando
  // disponível; senão, o instante da importação.
  const pointDateISO = refDateISO || nowISO

  const { id: userId } = await getCurrentUserInfo()

  // Buscar registros existentes para merge de histórico e preservar status_manual/historico_acoes
  const codsAluno = entries.map(e => e.codAluno).filter(Boolean)
  let existingMap = new Map<number, {
    perc_faltas_geral: number | null;
    historico_faltas: FICAIHistoricoPoint[];
    importado_em: string | null;
    status_manual: string | null;
    historico_acoes: FICAIAcao[];
  }>()

  if (codsAluno.length > 0) {
    const { data: existingRows } = await supabase
      .from('ficai_importacoes')
      .select('cod_aluno, perc_faltas_geral, historico_faltas, importado_em, status_manual, historico_acoes')
      .eq('school_id', schoolId || '')
      .eq('ano', ano)
      .in('cod_aluno', codsAluno)

    for (const row of existingRows ?? []) {
      existingMap.set(row.cod_aluno, {
        perc_faltas_geral: row.perc_faltas_geral,
        historico_faltas: Array.isArray(row.historico_faltas) ? row.historico_faltas : [],
        importado_em: row.importado_em,
        status_manual: row.status_manual ?? null,
        historico_acoes: Array.isArray(row.historico_acoes) ? row.historico_acoes : [],
      })
    }
  }

  const rows = entries.map(e => {
    const existing = e.codAluno ? existingMap.get(e.codAluno) : undefined
    let hist: FICAIHistoricoPoint[] = existing?.historico_faltas ?? []

    // Semear histórico a partir de dado legado se vazio
    if (hist.length === 0 && existing && existing.perc_faltas_geral !== null) {
      hist = [{
        data: existing.importado_em ?? pointDateISO,
        perc: existing.perc_faltas_geral,
        perc1Bim: null,
        perc2Bim: null,
      }]
    }

    // Append só se % mudou vs último ponto
    const ultimoPerc = hist.length > 0 ? hist[hist.length - 1].perc : null
    if (e.faltasGeral !== null && e.faltasGeral !== ultimoPerc) {
      hist = [...hist, {
        data: pointDateISO,
        perc: e.faltasGeral,
        perc1Bim: e.faltas1Bim ?? null,
        perc2Bim: e.faltas2Bim ?? null,
      }]
    }

    return {
      ano,
      cod_aluno:           e.codAluno,
      cod_matricula:       e.codMatricula,
      nome_aluno:          e.nomeAluno,
      turma:               e.turma,
      turno:               e.turno,
      modalidade:          e.modalidade,
      perc_faltas_geral:   e.faltasGeral,
      perc_faltas_1bim:    e.faltas1Bim,
      perc_faltas_2bim:    e.faltas2Bim,
      ficai_aberto:        e.ficaiAberto,
      data_ficai:          e.dataFicai,
      encaminhado:         e.encaminhado,
      data_encaminhamento: e.dataEncaminhamento,
      aluno_id:            e.alunoId,
      match_score:         e.matchScore,
      school_id:           schoolId || null,
      importado_por:       userId ?? null,
      importado_em:        nowISO,
      historico_faltas:    hist,
      // preservar status_manual e historico_acoes existentes
      status_manual:       existing?.status_manual ?? null,
      historico_acoes:     existing?.historico_acoes ?? [],
    }
  })

  // Só persistir alunos matched — índice único é parcial (WHERE cod_aluno IS NOT NULL)
  const persistibleRows = rows.filter(r => r.cod_aluno !== null)

  const BATCH = 200
  for (let i = 0; i < persistibleRows.length; i += BATCH) {
    const batch = persistibleRows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('ficai_importacoes')
      .upsert(batch, { onConflict: 'school_id,cod_aluno,ano' })

    if (error) throw new Error(`Erro ao salvar importação (lote ${i}): ${error.message}`)
  }
}

export function buildSessionStats(entries: FICAIEntry[]) {
  return {
    totalAlunos: entries.length,
    totalAlertas: entries.filter(e => e.alerta).length,
    totalGraves: entries.filter(e => e.alertaGrave).length,
    totalFicaisAbertas: entries.filter(e => e.ficaiAberto).length,
    totalEncaminhados: entries.filter(e => e.encaminhado).length,
    totalMatched: entries.filter(e => e.matched).length,
  }
}

export async function createImportSession(
  schoolId: string,
  nomeArquivo: string,
  stats: { totalAlunos: number; totalAlertas: number; totalGraves: number; totalFicaisAbertas: number; totalEncaminhados: number; totalMatched: number },
  userId?: string | null,
  userNome?: string
): Promise<string | null> {
  const { data, error } = await supabase.from('ficai_import_sessions').insert({
    school_id: schoolId,
    nome_arquivo: nomeArquivo,
    importado_por: userId || null,
    importado_por_nome: userNome || null,
    total_alunos: stats.totalAlunos,
    total_alertas: stats.totalAlertas,
    total_graves: stats.totalGraves,
    total_ficais_abertas: stats.totalFicaisAbertas,
    total_encaminhados: stats.totalEncaminhados,
    total_matched: stats.totalMatched,
  }).select('id').maybeSingle()
  if (error) console.error('[FICAI] Erro ao criar sessão de importação:', error.message)
  return data?.id ?? null
}

export async function updateImportSession(
  sessionId: string,
  stats: { totalAlunos: number; totalAlertas: number; totalGraves: number; totalFicaisAbertas: number; totalEncaminhados: number; totalMatched: number }
): Promise<void> {
  const { error } = await supabase
    .from('ficai_import_sessions')
    .update({
      total_alunos: stats.totalAlunos,
      total_alertas: stats.totalAlertas,
      total_graves: stats.totalGraves,
      total_ficais_abertas: stats.totalFicaisAbertas,
      total_encaminhados: stats.totalEncaminhados,
      total_matched: stats.totalMatched,
      importado_em: new Date().toISOString(),
    })
    .eq('id', sessionId)
  if (error) console.error('[FICAI] Erro ao atualizar sessão de importação:', error.message)
}

/**
 * Cria OU atualiza a sessão de importação pelo nome do arquivo — garante 1
 * entrada por planilha em "Importações anteriores" (re-upload do mesmo arquivo
 * atualiza em vez de duplicar). Retorna o id da sessão.
 */
export async function upsertImportSessionByName(
  schoolId: string,
  nomeArquivo: string,
  stats: { totalAlunos: number; totalAlertas: number; totalGraves: number; totalFicaisAbertas: number; totalEncaminhados: number; totalMatched: number },
  userId?: string | null,
  userNome?: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('ficai_import_sessions')
    .select('id')
    .eq('school_id', schoolId)
    .eq('nome_arquivo', nomeArquivo)
    .order('importado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    await updateImportSession(existing.id, stats)
    return existing.id
  }
  return createImportSession(schoolId, nomeArquivo, stats, userId, userNome)
}

export async function fetchImportSessions(schoolId: string): Promise<FICAIImportSession[]> {
  const { data, error } = await supabase
    .from('ficai_import_sessions')
    .select('*')
    .eq('school_id', schoolId)
    .order('importado_em', { ascending: false })
    .limit(10)
  if (error) { console.error('[FICAI] Erro ao buscar sessões de importação:', error.message); return [] }
  // Dedupe por nome de arquivo — mantém a mais recente (já vem ordenado desc).
  // Protege a UI contra duplicatas legadas de antes do upsert por nome.
  const seen = new Set<string>()
  return (data || []).reduce((acc: FICAIImportSession[], d: any) => {
    if (seen.has(d.nome_arquivo)) return acc
    seen.add(d.nome_arquivo)
    acc.push({
      id: d.id,
      nomeArquivo: d.nome_arquivo,
      importadoEm: d.importado_em,
      importadoPorNome: d.importado_por_nome || undefined,
      totalAlunos: d.total_alunos,
      totalAlertas: d.total_alertas,
      totalGraves: d.total_graves,
      totalFicaisAbertas: d.total_ficais_abertas,
      totalEncaminhados: d.total_encaminhados,
      totalMatched: d.total_matched,
    })
    return acc
  }, [])
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
    const contactsArray = d.students?.contacts && Array.isArray(d.students.contacts) ? d.students.contacts : [];
    const firstContact = contactsArray.length > 0 ? contactsArray[0] : null;

    const faltasGeral = d.perc_faltas_geral;
    const ficaiAberto = d.ficai_aberto;
    const derived = deriveFicaiFlags(faltasGeral, ficaiAberto)

    // status_manual sobrepõe derivação quando definido explicitamente
    const ficaiNecessaria = d.status_manual === 'ficai_necessaria' ? true
      : d.status_manual === 'nao_aberta' ? false
      : derived.ficaiNecessaria

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
      alerta: derived.alerta,
      alertaGrave: derived.alertaGrave,
      ficaiNecessaria,
      historicoFaltas: Array.isArray(d.historico_faltas) ? d.historico_faltas : [],
      statusManual: d.status_manual ?? null,
      historicoAcoes: Array.isArray(d.historico_acoes) ? d.historico_acoes : [],
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
    status_manual?: 'ficai_necessaria' | 'nao_aberta' | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from('ficai_importacoes')
    .update(updates)
    .match({ cod_aluno: codAluno, ano, school_id: schoolId });

  if (error) throw new Error(`Erro ao atualizar status do FICAI: ${error.message}`);
}

/**
 * Appenda uma ação ao historico_acoes de um aluno (read-modify-write).
 */
export async function appendFICAIAcao(
  codAluno: number,
  ano: number,
  schoolId: string,
  acao: FICAIAcao
): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('ficai_importacoes')
    .select('historico_acoes')
    .match({ cod_aluno: codAluno, ano, school_id: schoolId })
    .maybeSingle()

  if (fetchError) throw new Error(`Erro ao buscar historico_acoes: ${fetchError.message}`)

  const acoes: FICAIAcao[] = Array.isArray(data?.historico_acoes) ? data.historico_acoes : []
  const updated = [...acoes, acao]

  const { error: updateError } = await supabase
    .from('ficai_importacoes')
    .update({ historico_acoes: updated })
    .match({ cod_aluno: codAluno, ano, school_id: schoolId })

  if (updateError) throw new Error(`Erro ao salvar historico_acoes: ${updateError.message}`)
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
