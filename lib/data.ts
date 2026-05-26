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
  photoUrl?: string;
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
  ataNumber?: number;      // Número sequencial fixo da ATA (auto-incremento)
  studentId: string;
  studentIds?: string[]; // Multiple students in one occurrence
  date: string;
  hour?: string;
  location?: string;
  locatedBy?: string;
  linkedProfessor?: string;
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

export type AppUserRole = 'GESTOR' | 'COORD' | 'MONITOR' | 'PROFESSOR' | 'admin_global';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: AppUserRole;
  school_id?: string;
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
  { code: 1,  description: "Apresentar-se com uniforme diferente do estabelecido: (Trajar-se, exibir-se)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 2,  description: "Apresentar-se com barba ou bigode sem fazer: (Cútis descuidada, rosto por fazer)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 3,  description: "Comparecer à EECM com cabelo em desalinho: (Despenteado, desarrumado)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 4,  description: "Chegar atrasado a EECM: (Retardar-se, demorar-se)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 5,  description: "Comparecer a EECM sem levar o material necessário: (Ausência, falta)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 6,  description: "Adentrar ou permanecer em dependência sem autorização: (Ingressar, ficar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 7,  description: "Consumir alimentos ou mascar chicletes sem autorização: (Ingerir, mastigar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 8,  description: "Conversar ou se mexer quando estiver em forma: (Dialogar, movimentar-se)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 9,  description: "Deixar de entregar objeto que não lhe pertença: (Omitir, abdicar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 10, description: "Deixar de retribuir cumprimentos ou sinais de respeito: (Ignorar, negligenciar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 11, description: "Deixar material em locais inapropriados: (Abandonar, esquecer)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 12, description: "Descartar papéis ou restos de comida no chão: (Jogar, atirar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 13, description: "Dobrar peça de uniforme para desfigurar originalidade: (Pregar, vincar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 14, description: "Debruçar-se sobre a carteira e/ou dormir: (Apoiar-se, repousar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 15, description: "Executar movimentos de forma displicente: (Relapsa, desatenta)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 16, description: "Fazer ou provocar excessivo barulho: (Ruído, algazarra)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 17, description: "Não levar ao conhecimento irregularidade que presenciar: (Omitir, calar-se)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 18, description: "Perturbar o estudo do colega: (Atrapalhar, incomodar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 19, description: "Utilizar publicação estranha à atividade escolar: (Empregar, manusear)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 20, description: "Retardar ou contribuir para o atraso de atividade: (Dificultar, protelar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 21, description: "Sentar-se no chão, atentando contra a postura: (Acomodar-se, prostrar-se)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 22, description: "Utilizar qualquer tipo de jogo ou brinquedo: (Brincar, manusear)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 23, description: "Usar (aluna) piercing ou brinco fora do padrão: (Portar, ostentar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 24, description: "Usar (aluno) piercings ou brinco fora do padrão: (Portar, ostentar)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 25, description: "Usar boné, capuz ou outros adornos: (Utilizar, vestir)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },
  { code: 26, description: "Ficar na sala durante intervalos e formaturas: (Permanecer, deter-se)", severity: "Leve", points: -0.10, measure: "Advertência Oral" },

  // NATUREZA MÉDIA (27-62)
  { code: 27, description: "Atrasar ou deixar de atender ao chamado: (Demorar, ignorar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 28, description: "Deixar de comparecer a atividade extraclasse: (Faltar, ausentar-se)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 29, description: "Deixar de comparecer às atividades escolares: (Faltar, ausentar-se)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 30, description: "Esquivar-se de medidas disciplinares: (Fugir, evitar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 31, description: "Deixar de devolver documentos assinados no prazo: (Reter, atrasar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 32, description: "Deixar de devolver livros ou materiais no prazo: (Reter, atrasar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 33, description: "Deixar de entregar documento ao responsável: (Reter, omitir)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 34, description: "Deixar de executar tarefas atribuídas: (Descumprir, negligenciar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 35, description: "Deixar de zelar por sua apresentação pessoal: (Descuidar, desleixar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 36, description: "Dirigir memoriais ou petições inadequadamente: (Encaminhar, enviar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 37, description: "Entrar ou sair da EECM por locais não permitidos: (Acessar, evadir-se)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 38, description: "Espalhar boatos ou notícias tendenciosas: (Difundir, boatar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 39, description: "Tocar a sirene sem ordem: (Acionar, soar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 40, description: "Fumar dentro ou nas imediações da EECM: (Pitar, tabagismo)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 41, description: "Trocar de roupa (trajes civis) dentro da EECM: (Mudar, substituir)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 42, description: "Ler ou distribuir publicações contra a disciplina: (Circular, disseminar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 43, description: "Manter contato físico de cunho amoroso: (Namorar, cariciar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 44, description: "Não zelar pelo nome da Instituição: (Desonrar, desprestigiar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 45, description: "Negar-se a colaborar em eventos ou desfiles: (Recusar-se, abster-se)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 46, description: "Ofender colegas por atos, gestos ou palavras: (Insultar, afrontar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 47, description: "Portar-se de forma inconveniente em sala: (Comportar-se, agir)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 48, description: "Portar-se de maneira desrespeitosa em eventos: (Comportar-se, agir)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 49, description: "Proferir palavras de baixo calão: (Xingar, blasfemar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 50, description: "Propor ou aceitar transação pecuniária: (Negociar, comercializar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 51, description: "Provocar ou disseminar a discórdia: (Instigar, semear)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 52, description: "Publicar mensagens ou fotos que exponham outrem: (Postar, divulgar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 53, description: "Retirar objeto sem ordem do responsável: (Remover, subtrair)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 54, description: "Sair de forma sem autorização: (Retirar-se, ausentar-se)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 55, description: "Sair, entrar ou permanecer na sala sem permissão: (Circular, ficar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 56, description: "Ser retirado por mau comportamento: (Expulso, removido)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 57, description: "Simular doenças para esquivar-se de obrigações: (Fingir, aparentar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 58, description: "Tomar parte em jogos de azar ou apostas: (Participar, jogar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 59, description: "Usar instalações esportivas sem autorização: (Utilizar, aproveitar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 60, description: "Usar o uniforme em ambiente inapropriado: (Trajar, vestir)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 61, description: "Utilizar celulares durante as atividades: (Manusear, operar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },
  { code: 62, description: "Usar indevidamente distintivos ou insígnias: (Ostentar, portar)", severity: "Media", points: -0.30, measure: "Advertência Escrita" },

  // NATUREZA GRAVE (63-91)
  { code: 63, description: "Assinar pelo responsável: (Falsificar, forjar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 64, description: "Causar danos ao patrimônio: (Depredar, avariar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 65, description: "Causar ou contribuir para acidentes: (Provocar, gerar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 66, description: "Comunicar-se ou usar meio não permitido em provas: (Colar, fraudar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 67, description: "Denegrir o nome da EECM: (Difamar, manchar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 68, description: "Desrespeitar, desobedecer ou desafiar autoridade: (Afrontar, insubordinar-se)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 69, description: "Divulgar matéria de apologia às drogas ou violência: (Propagar, promover)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 70, description: "Entrar ou ausentar-se da unidade sem autorização: (Acessar, evadir-se)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 71, description: "Extraviar documentos sob sua responsabilidade: (Perder, sumir)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 72, description: "Faltar com a verdade ou usar anonimato: (Mentir, ludibriar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 73, description: "Fazer uso ou portar bebidas e entorpecentes: (Consumir, ingerir)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 74, description: "Hastear ou arriar bandeiras sem autorização: (Içar, baixar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 75, description: "Instigar colegas a cometer faltas: (Incite, induzir)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 76, description: "Contato físico com denotação libidinosa: (Lascivo, erótico)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 77, description: "Obter publicação difamatória contra membros: (Conseguir, produzir)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 78, description: "Ofender com a prática de Bullying: (Assediar, acossar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 79, description: "Pichar ou causar poluição visual/sonora: (Grafitar, sujar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 80, description: "Portar objetos que ameacem a segurança: (Carregar, deter)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 81, description: "Praticar atos contrários aos símbolos nacionais: (Desrespeitar, ultrajar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 82, description: "Promover ou tomar parte em manifestação coletiva: (Organizar, integrar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 83, description: "Promover trotes de qualquer natureza: (Realizar, praticar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 84, description: "Promover, incitar ou envolver-se em rixa: (Brigar, lutar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 85, description: "Tomar parte em manifestações políticas: (Participar, envolver-se)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 86, description: "Rasurar, violar ou alterar documentos: (Adulterar, modificar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 87, description: "Representar a EECM sem estar autorizado: (Personificar, atuar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 88, description: "Ter em seu poder publicações contra a moral: (Possuir, deter)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 89, description: "Utilizar ou subtrair objetos alheios: (Furtar, apossar-se)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 90, description: "Utilizar processos fraudulentos em trabalhos: (Trapacear, burlar)", severity: "Grave", points: -0.50, measure: "Suspensão" },
  { code: 91, description: "Causar destruição do patrimônio da EECM: (Arruinar, depredar)", severity: "Grave", points: -0.50, measure: "Suspensão" }
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
