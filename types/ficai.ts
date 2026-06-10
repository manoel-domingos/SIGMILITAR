// Estrutura raw do CSV (colunas com espaços como no arquivo exportado)
export interface FICAICSVRow {
  Ano: string
  DRE: string
  Municipio: string
  'Cod Lotacao': string
  Lotacao: string
  Turma: string
  'Cod Matriz': string
  Matriz: string
  'Etapa Educacenso': string
  Modalidade: string
  Turno: string
  'Cod Matricula': string
  'Cod Aluno': string
  'Nome Aluno': string
  Idade: string
  EJA: string
  'CH Anual': string
  'TF Geral': string
  'TF Geral Final': string
  'Perc Faltas Geral': string
  'Perc Faltas Geral Final': string
  'Qtde Lancamentos': string
  'Perc Faltas Lancamento': string
  'Perc Faltas Lancamento Final': string
  'TF 1 Bim': string
  'TF Final 1 Bim': string
  'Perc Faltas 1 Bim': string
  'Perc Faltas Final 1 Bim': string
  'TF 2 Bim': string
  'TF Final 2 Bim': string
  'Perc Faltas 2 Bim': string
  'Perc Faltas Final 2 Bim': string
  'Data Abertura Ficha Ficai': string
  'Data Encaminhamento Conselho': string
}

// Aluno conforme cadastrado no Supabase
export interface AlunoRecord {
  id: string
  cod_aluno: number | null
  nome: string
  telefone: string | null
  nome_responsavel: string | null
  telefone_responsavel: string | null
  contacts?: { name: string; phone: string }[]
}

// Ponto de histórico de infrequência (timeline somada)
export interface FICAIHistoricoPoint {
  data: string          // ISO timestamp da leitura
  perc: number | null
  perc1Bim: number | null
  perc2Bim: number | null
}

// Entrada processada: dados do CSV + dados puxados do Supabase
export interface FICAIEntry {
  // Identificação
  nomeAluno: string
  turma: string
  turno: string
  modalidade: string
  codAluno: number | null
  codMatricula: number | null

  // Frequência
  faltasGeral: number | null
  faltas1Bim: number | null
  faltas2Bim: number | null

  // FICAI
  ficaiAberto: boolean
  dataFicai: string
  encaminhado: boolean
  dataEncaminhamento: string

  // Dados do Supabase (match)
  alunoId: string | null
  telefone: string | null
  nomeResponsavel: string | null
  telefoneResponsavel: string | null
  contacts?: { name: string; phone: string }[]
  matchScore: number
  matched: boolean

  // Alertas derivados (>=10% necessária, >=15% grave)
  alerta: boolean
  alertaGrave: boolean
  ficaiNecessaria: boolean

  // Timeline de infrequência (somada, nunca substituída)
  historicoFaltas?: FICAIHistoricoPoint[]

  // Auditoria de importação
  importadoEm?: string
  importadoPor?: string
  importadoPorNome?: string
}

export type FICAIFilterKey =
  | 'todos'
  | 'grave'
  | 'ficai_necessaria'
  | 'ficai_aberta'
  | 'encaminhado'
  | 'sem_tel'

export interface FICAIStats {
  total: number
  comAlerta: number
  alertaGrave: number
  ficaiAberta: number
  encaminhados: number
  comTelefone: number
  ficaiNecessaria: number
}

export interface FICAIImportSession {
  id: string
  nomeArquivo: string
  importadoEm: string
  importadoPorNome?: string
  totalAlunos: number
  totalAlertas: number
  totalGraves: number
  totalFicaisAbertas: number
  totalEncaminhados: number
  totalMatched: number
}
