export type Severity = 'Leve' | 'Media' | 'Grave';
export type Shift = 'Matutino' | 'Vespertino' | 'Noturno';
export type BehaviorClass = 'Excepcional' | 'Ótimo' | 'Bom' | 'Regular' | 'Insuficiente' | 'Incompatível';
export type PraiseType = 'Individual' | 'Coletivo' | 'Art. 50' | 'Art. 51';

export interface Student {
  id: string;
  name: string;
  class: string;
  shift: Shift;
  points: number; // Starts at 10.0
  contacts?: { name: string, phone: string }[];
  observation?: string;
  address?: string;
  cpf?: string;
  registrationNumber?: string;
  birthDate?: string;
  archived?: boolean;
}

export interface DisciplineRule {
  code: number;
  description: string;
  severity: Severity;
  points: number; // e.g. -0.1, -0.3, -0.5
  measure: string;
}

export interface Occurrence {
  id: string;
  studentId: string;
  studentIds?: string[]; // Multiple students in one occurrence
  date: string;
  hour?: string;
  location?: string;
  locatedBy?: string;
  ruleCode: number;        // Primary rule (kept for backward compat)
  ruleCodes?: number[];    // All rules in this occurrence (multi-infraction)
  registeredBy: string;
  observations?: string;
  archived?: boolean;
  videoUrls?: string[];
  signedDocUrls?: string[];
  durationDays?: number;
  measure?: string;
  measures?: string[];     // Múltiplas medidas aplicadas (novo)
  resolved?: boolean;      // Se a ocorrência foi marcada como cumprida
  resolvedAt?: string;     // Timestamp da resolução
  attenuatingFactors?: string[];
  aggravatingFactors?: string[];
  createdAt?: string;      // Timestamp do servidor (para ordenação real)
}

export const AVAILABLE_MEASURES = [
  'Advertência Oral',
  'Advertência Escrita',
  'Acionar os pais',
  'Medida pedagógica',
  'Suspensão de Recreação',
  'Suspensão Escolar',
  'Ação Educativa',
  'Transferência Educativa',
] as const;

export interface StaffMember {
  id: string;
  name: string;
  role: 'Monitor' | 'Professor' | 'Coord.' | 'Diretora' | 'G1' | 'G2';
}

export interface Accident {
  id: string;
  studentId: string;
  date: string;
  location: string;
  type: string;
  description: string;
  bodyPart: string;
  registeredBy: string;
  parentsNotified: boolean;
  medicForwarded: boolean;
  observations?: string;
  archived?: boolean;
}

export interface Praise {
  id: string;
  studentId: string;
  date: string;
  type: PraiseType;
  description: string;
  registeredBy: string;
  archived?: boolean;
}

export interface Summons {
  id: string;
  studentId: string;
  date: string;
  time: string;
  reason: string;
  department: string;
  registeredBy: string;
  archived?: boolean;
}

export interface ConductTerm {
  id: string;
  studentId: string;
  date: string;
  guardianName: string;
  commitments: string;
  registeredBy: string;
  archived?: boolean;
}

export type AppUserRole = 'GESTOR' | 'COORD' | 'MONITOR';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: AppUserRole;
}

export interface AuditLog {
  id: string;
  date: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SYSTEM';
  entityName: string;
  entityId: string;
  details: string;
  userEmail: string;
}

export const INITIAL_RULES: DisciplineRule[] = [
  // NATUREZA LEVE (1-26)
  { code: 1, description: "Apresentar-se com uniforme diferente do estabelecido", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 2, description: "Apresentar-se com barba ou bigode sem fazer", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 3, description: "Cabelo desalinhado ou fora do padrão", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 4, description: "Chegar atrasado sem justificativa", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 5, description: "Comparecer sem material escolar necessário", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 6, description: "Adentrar dependências sem autorização", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 7, description: "Consumir alimentos ou mascar chicletes em aula/forma", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 8, description: "Conversar ou se mexer quando estiver em forma", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 9, description: "Deixar de entregar objeto encontrado na escola", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 10, description: "Deixar de retribuir cumprimentos ou sinais de respeito", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 11, description: "Deixar material/peças de uniforme em locais inapropriados", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 12, description: "Descartar lixo fora dos locais apropriados", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 13, description: "Dobrar peça de uniforme desfigurando originalidade", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 14, description: "Dormir durante o horário das aulas ou instruções", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 15, description: "Executar movimentos de ordem unida de forma displicente", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 16, description: "Provocar ruídos excessivos em dependências da escola", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 17, description: "Não informar autoridade sobre falta presenciada", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 18, description: "Perturbar o estudo dos colegas com ruídos/brincadeiras", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 19, description: "Utilizar publicação estranha à atividade escolar", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 20, description: "Retardar ou contribuir para o atraso de execuções", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 21, description: "Sentar-se no chão uniformizado (exceto Ed. Física)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 22, description: "Utilizar jogo, brinquedo ou coleções sem autorização", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 23, description: "Uso indevido de piercing/brincos (Alunas)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 24, description: "Uso indevido de piercing/brincos (Alunos)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 25, description: "Usar boné, capuz ou adornos uniformizado em aula", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 26, description: "Ficar na sala de aula durante intervalos/formaturas", severity: "Leve", points: -0.10, measure: "Advertência Oral" },

  // NATUREZA MÉDIA (27-62)
  { code: 27, description: "Atrasar ou não atender chamado da Diretoria/Coordenação", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 28, description: "Faltar a atividade extraclasse sem justificativa", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 29, description: "Faltar a atividades escolares ou formaturas", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 30, description: "Deixar de cumprir medidas disciplinares impostas", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 31, description: "Deixar de devolver documentos assinados no prazo", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 32, description: "Deixar de devolver livros ou materiais da biblioteca", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 33, description: "Não entregar documento encaminhado aos pais", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 34, description: "Deixar de executar tarefas atribuídas pela direção", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 35, description: "Desleixo com apresentação pessoal", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 36, description: "Dirigir memoriais ou petições sem autorização", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 37, description: "Entrar ou sair da escola por locais não permitidos", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 38, description: "Espalhar boatos ou notícias tendenciosas", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 39, description: "Tocar a sirene sem permissão", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 40, description: "Fumar uniformizado ou nas imediações da escola", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 41, description: "Ingressar ou sair sem uniforme ou trocar em locais proibidos", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 42, description: "Ler ou distribuir publicações contra disciplina/moral", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 43, description: "Contato físico de cunho amoroso uniformizado", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 44, description: "Não zelar pelo nome da Instituição (Uniformizado)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 45, description: "Negar-se a colaborar em eventos escolares oficiais", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 46, description: "Ofender moral de colegas ou membros da comunidade", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 47, description: "Portar-se de forma inconveniente em aula ou recreio", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 48, description: "Comportamento desrespeitoso em eventos sociais/esportivos", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 49, description: "Proferir palavras de baixo calão ou grafá-las", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 50, description: "Propor ou aceitar transação pecuniária sem autorização", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 51, description: "Provocar ou disseminar a discórdia entre colegas", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 52, description: "Exposição negativa de colegas em meios virtuais", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 53, description: "Retirar ou tentar retirar objeto sem autorização", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 54, description: "Sair da escola sem a devida autorização", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 55, description: "Entrar ou sair da sala de aula sem permissão", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 56, description: "Ser retirado de atividade por mau comportamento", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 57, description: "Simular doenças para esquivar-se de obrigações", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 58, description: "Tomar parte em jogos de azar ou apostas", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 59, description: "Usar instalações esportivas sem uniforme adequado", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 60, description: "Usar uniforme ou nome da escola em local inapropriado", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 61, description: "Uso não autorizado de telefone celular em aula", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 62, description: "Usar indevidamente distintivos ou insígnias", severity: "Media", points: -0.30, measure: "Advertência Escrita" },

  // NATUREZA GRAVE (63-91)
  { code: 63, description: "Assinar documento pelos pais ou responsáveis", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 64, description: "Causar danos intencionais ao patrimônio escolar", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 65, description: "Causar ou contribuir para acidentes de qualquer natureza", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 66, description: "Comunicação indevida (colar) em avaliações", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 67, description: "Denegrir nome da escola ou membros em redes sociais", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 68, description: "Desobedecer ou desafiar autoridade de Direção/Monitores", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 69, description: "Apologia a drogas, violência ou pornografia", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 70, description: "Entrar ou ausentar-se da escola sem autorização", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 71, description: "Extraviar documentos sob sua responsabilidade", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 72, description: "Faltar com a verdade ou usar anonimato indevido", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 73, description: "Uso ou indução ao uso de bebida alcoólica/drogas", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 74, description: "Hastear ou arriar bandeiras sem autorização", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 75, description: "Instigar colegas a cometerem faltas graves", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 76, description: "Contato físico com denotação libidinosa", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 77, description: "Publicação difamatória contra membros da comunidade", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 78, description: "Prática de Bullying ou Cyberbullying", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 79, description: "Pichar ou causar poluição visual/sonora nas imediações", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 80, description: "Portar armas ou objetos perfurocortantes (estiletes, etc)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 81, description: "Atos contrários ao respeito aos símbolos nacionais", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 82, description: "Macular nome da escola em manifestações coletivas", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 83, description: "Promover trotes de qualquer natureza", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 84, description: "Rixas ou luta corporal dentro ou fora da escola", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 85, description: "Participação em manifestações de natureza política", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 86, description: "Rasurar, violar ou alterar documentos oficiais", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 87, description: "Representar a escola sem estar autorizado", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 88, description: "Distribuir materiais de cunho político-partidário", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 89, description: "Subtrair indevidamente valores ou objetos alheios", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 90, description: "Processos fraudulentos em trabalhos acadêmicos", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 91, description: "Destruição do patrimônio pertencente à escola", severity: "Grave", points: -0.50, measure: "Suspensão" }
];

// Add dummy data for initial state
export const INITIAL_STUDENTS: Student[] = [
  { id: "S1", name: "Rafael Souza", class: "3º Ano C", shift: "Vespertino", points: 6.5 },
  { id: "S2", name: "Fernanda Castro", class: "2º Ano A", shift: "Vespertino", points: 8.5 },
  { id: "S3", name: "Pedro Santos", class: "8º Ano C", shift: "Matutino", points: 6.9 },
  { id: "S4", name: "Ana Costa", class: "9º Ano D", shift: "Matutino", points: 7.0 },
  { id: "S5", name: "Maria Oliveira", class: "7º Ano B", shift: "Vespertino", points: 7.7 },
  { id: "S6", name: "Bruno Andrade Tapajós", class: "1º A", shift: "Matutino", points: 8.0 }
];

export const INITIAL_OCCURRENCES: Occurrence[] = [
  { id: "O1", studentId: "S1", date: "2026-04-15", ruleCode: 26, registeredBy: "Prof. Marcos" },
  { id: "O2", studentId: "S1", date: "2026-04-16", ruleCode: 27, registeredBy: "Prof. Marcos" },
  { id: "O3", studentId: "S2", date: "2026-04-17", ruleCode: 25, registeredBy: "Prof. Julia" }
];

export const INITIAL_ACCIDENTS: Accident[] = [];
export const INITIAL_PRAISES: Praise[] = [];
