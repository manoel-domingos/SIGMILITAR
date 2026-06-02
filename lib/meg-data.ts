// lib/meg-data.ts
// Dados estáticos de suporte ao Módulo Pedagógico - MEG Educação (SEDUC-MT)
// ✅ Atualizado em 2025: sub-etapas de Planejamento e Execução inseridas conforme avaliação MEG SEDUC-MT

export interface MegEixo {
  id: string;
  numero: number;
  nome: string;
  slug: string;
  icone: string;
  color: string;
  bgGradient: string;
  borderColor: string;
}

export interface MegFase {
  id: string;
  numero: number;
  nome: string;
  slug: string;
  sigla?: string;
  sinonimo?: string;
}

export type MegStatus2025 = 'possui' | 'nao_possui' | 'incompleto' | null;

export interface MegEvidencia {
  id: string;
  eixoId: string;
  faseId: string;
  nome: string;
  descricao: string;
  ordem: number;
  /** Documento exigido na avaliação MEG SEDUC-MT */
  documento?: string;
  /** Código do critério no formulário MEG (ex: "1.1.1") */
  codigoPDF?: string;
  /** Resultados históricos por ano { ano: { status, nota } } */
  resultados?: Record<number, { status: MegStatus2025; nota: number }>;
}

// ---------------------------------------------------------------------------
// Interface e dados de Resultados Anuais por Eixo
// ---------------------------------------------------------------------------

export interface MegResultadoAnual {
  ano: number;
  eixoId: string;
  dimensaoProcessos: number;
  maxProcessos: number;
  dimensaoResultado: number;
  maxResultado: number;
}

/** Pontuações consolidadas por eixo — avaliação MEG SEDUC-MT */
export const MEG_RESULTADOS_ANUAIS: MegResultadoAnual[] = [
  // ── 2025 ──────────────────────────────────────────────────────────────────
  // Fonte: Avaliação MEG SEDUC-MT — Escola Prof. João Batista (jun/2025)
  {
    ano: 2025,
    eixoId: 'patrimonio',
    dimensaoProcessos: 35.9,
    maxProcessos: 75,
    dimensaoResultado: 88.0,
    maxResultado: 110,
  },
  {
    ano: 2025,
    eixoId: 'lideranca',       // Alimentação Escolar
    dimensaoProcessos: 54.4,
    maxProcessos: 75,
    dimensaoResultado: 89.8,
    maxResultado: 110,
  },
  {
    ano: 2025,
    eixoId: 'pedagogico',      // Limpeza e Organização
    dimensaoProcessos: 9.4,
    maxProcessos: 75,
    dimensaoResultado: 84.6,
    maxResultado: 110,
  },
  {
    ano: 2025,
    eixoId: 'gestao-escolar',  // Manutenção e Conservação
    dimensaoProcessos: 18.8,
    maxProcessos: 75,
    dimensaoResultado: 91.1,
    maxResultado: 110,
  },
  {
    ano: 2025,
    eixoId: 'clima-escolar',   // Gestão Escolar e Pedagógica
    dimensaoProcessos: 97.9,
    maxProcessos: 115,
    dimensaoResultado: 140.0,
    maxResultado: 160,
  },
];

/** Totais gerais por ano */
export const MEG_TOTAIS_ANUAIS: Record<
  number,
  { processos: number; resultado: number; final: number }
> = {
  2025: { processos: 216.4, resultado: 493.5, final: 709.94 },
};

// ---------------------------------------------------------------------------
// Eixos e Fases (sem alteração)
// ---------------------------------------------------------------------------

export const MEG_EIXOS: MegEixo[] = [
  {
    id: 'patrimonio',
    numero: 1,
    nome: 'Patrimônio Mobiliário e Imobiliário',
    slug: 'patrimonio',
    icone: 'Building',
    color: 'text-amber-500 dark:text-amber-400',
    bgGradient: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-500/20 dark:border-amber-500/30',
  },
  {
    id: 'lideranca',
    numero: 2,
    nome: 'Alimentação Escolar',
    slug: 'lideranca',
    icone: 'Users',
    color: 'text-purple-500 dark:text-purple-400',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/20 dark:border-purple-500/30',
  },
  {
    id: 'pedagogico',
    numero: 3,
    nome: 'Limpeza e Organização',
    slug: 'pedagogico',
    icone: 'GraduationCap',
    color: 'text-emerald-500 dark:text-emerald-400',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
    borderColor: 'border-emerald-500/20 dark:border-emerald-500/30',
  },
  {
    id: 'gestao-escolar',
    numero: 4,
    nome: 'Manutenção e Conservação',
    slug: 'gestao-escolar',
    icone: 'ClipboardList',
    color: 'text-blue-500 dark:text-blue-400',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
    borderColor: 'border-blue-500/20 dark:border-blue-500/30',
  },
  {
    id: 'clima-escolar',
    numero: 5,
    nome: 'Gestão Escolar e Pedagógica',
    slug: 'clima-escolar',
    icone: 'LineChart',
    color: 'text-rose-500 dark:text-rose-400',
    bgGradient: 'from-rose-500/10 to-red-500/10',
    borderColor: 'border-rose-500/20 dark:border-rose-500/30',
  },
];

export const MEG_FASES: MegFase[] = [
  { id: 'planejamento', numero: 1, nome: 'Planejamento',                                      slug: 'planejamento', sigla: 'P', sinonimo: 'Planejamento (P)' },
  { id: 'execucao',     numero: 2, nome: 'Execução',                                          slug: 'execucao',     sigla: 'D', sinonimo: 'Execução / Fazer (D)' },
  { id: 'controle',     numero: 3, nome: 'Controle e Avaliação de Qualidade e Eficiência',    slug: 'controle',     sigla: 'C', sinonimo: 'Controle / Checar (C)' },
  { id: 'melhorias',    numero: 4, nome: 'Implementação de Melhorias',                        slug: 'melhorias',    sigla: 'A', sinonimo: 'Melhorias / Agir (A)' },
  { id: 'resultados',   numero: 5, nome: 'Avaliação de Resultados',                           slug: 'resultados',   sigla: 'R', sinonimo: 'Resultados (R)' },
];

// ---------------------------------------------------------------------------
// Evidências — base existente + sub-etapas MEG SEDUC-MT 2025
// ---------------------------------------------------------------------------

export const MEG_EVIDENCIAS: MegEvidencia[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // EIXO 1 (gestao-escolar) — Manutenção e Conservação da Infraestrutura
  // ══════════════════════════════════════════════════════════════════════════

  // — Planejamento —
  {
    id: 'e1_f1_1',
    eixoId: 'gestao-escolar',
    faseId: 'planejamento',
    nome: 'Projeto Político Pedagógico (PPP) Atualizado',
    descricao: 'PPP revisado e alinhado com as diretrizes do MEG Educação.',
    ordem: 1,
  },
  {
    id: 'e1_f1_2',
    eixoId: 'gestao-escolar',
    faseId: 'planejamento',
    nome: 'Plano de Ação Anual da Escola',
    descricao: 'Documento contendo metas, prazos e responsabilidades para o ano letivo.',
    ordem: 2,
  },
  // ✅ Sub-etapas MEG 2025 — Manutenção e Conservação (Planejamento)
  {
    id: 'e1_f1_meg25_1',
    eixoId: 'gestao-escolar',
    faseId: 'planejamento',
    nome: 'Elaborar Cronograma de Inspeções Prediais',
    descricao: 'Cronograma de vistorias estruturais e registros de inspeções periódicas.',
    ordem: 10,
    codigoPDF: '4.1.1',
    documento: 'Cronograma de Inspeções; Ficha de Inspeção',
    resultados: {
      2025: { status: 'possui', nota: 9.38 },
    },
  },
  {
    id: 'e1_f1_meg25_2',
    eixoId: 'gestao-escolar',
    faseId: 'planejamento',
    nome: 'Realizar Inspeções Prediais Conforme Cronograma',
    descricao: 'Execução das inspeções planejadas com preenchimento das fichas de vistoria.',
    ordem: 11,
    codigoPDF: '4.1.2',
    documento: 'Ficha de Inspeção preenchida',
    resultados: {
      2025: { status: 'nao_possui', nota: 0 },
    },
  },

  // — Execução —
  {
    id: 'e1_f2_1',
    eixoId: 'gestao-escolar',
    faseId: 'execucao',
    nome: 'Registro de Reuniões de Alinhamento Coletivo',
    descricao: 'Atas e fotos de reuniões realizadas com a equipe escolar.',
    ordem: 1,
  },
  // ✅ Sub-etapas MEG 2025 — Manutenção e Conservação (Execução)
  {
    id: 'e1_f2_meg25_1',
    eixoId: 'gestao-escolar',
    faseId: 'execucao',
    nome: 'Executar Manutenções Corretivas Registradas',
    descricao: 'Realização das manutenções corretivas com registro fotográfico e justificativa de pendências.',
    ordem: 10,
    codigoPDF: '4.3.1',
    documento: 'Relatório de verificação com registro fotográfico; Relatório de justificativa de pendências',
    resultados: {
      2025: { status: 'possui', nota: 9.38 },
    },
  },
  {
    id: 'e1_f2_meg25_2',
    eixoId: 'gestao-escolar',
    faseId: 'execucao',
    nome: 'Acompanhar Levantamento de Demandas das Manutenções',
    descricao: 'Monitoramento do levantamento de demandas e atrasos ou pendências registradas.',
    ordem: 11,
    codigoPDF: '4.3.2',
    documento: 'Relatório de Demanda; Checklist de intervenções',
    resultados: {
      2025: { status: 'possui', nota: 9.38 },
    },
  },

  // — Controle, Melhorias, Resultados —
  {
    id: 'e1_f3_1',
    eixoId: 'gestao-escolar',
    faseId: 'controle',
    nome: 'Relatório de Acompanhamento das Metas do PPP',
    descricao: 'Planilha ou relatório indicando a evolução do cumprimento das metas.',
    ordem: 1,
  },
  {
    id: 'e1_f4_1',
    eixoId: 'gestao-escolar',
    faseId: 'melhorias',
    nome: 'Plano de Intervenção para Metas Não Atingidas',
    descricao: 'Ações corretivas traçadas após a análise das metas do semestre.',
    ordem: 1,
  },
  {
    id: 'e1_f5_1',
    eixoId: 'gestao-escolar',
    faseId: 'resultados',
    nome: 'Relatório de Avaliação Institucional',
    descricao: 'Resultados de questionários aplicados à comunidade escolar sobre a gestão.',
    ordem: 1,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EIXO 2 (lideranca) — Alimentação Escolar
  // ══════════════════════════════════════════════════════════════════════════

  // — Planejamento —
  {
    id: 'e2_f1_1',
    eixoId: 'lideranca',
    faseId: 'planejamento',
    nome: 'Plano de Formação Continuada dos Servidores',
    descricao: 'Cronograma e temas de treinamento para professores e funcionários.',
    ordem: 1,
  },
  // ✅ Sub-etapas MEG 2025 — Alimentação Escolar (Planejamento)
  {
    id: 'e2_f1_meg25_1',
    eixoId: 'lideranca',
    faseId: 'planejamento',
    nome: 'Disponibilizar Cardápio Impresso e Controle de Estoque',
    descricao: 'Cardápio 2025 afixado, diário de alimentação servida e controle de estoque atualizado.',
    ordem: 10,
    codigoPDF: '2.1.1',
    documento: 'Cardápio 2025; Diário de alimentação servida; Controle de estoque',
    resultados: {
      2025: { status: 'possui', nota: 3.75 },
    },
  },
  {
    id: 'e2_f1_meg25_2',
    eixoId: 'lideranca',
    faseId: 'planejamento',
    nome: 'Fixar Placas Orientativas de Higiene na Cozinha',
    descricao: 'Afixar placas sobre lavagem de mãos, antissepsia e demais hábitos higiênicos exigidos.',
    ordem: 11,
    codigoPDF: '2.1.2',
    documento: 'Placas orientativas',
    resultados: {
      2025: { status: 'possui', nota: 3.75 },
    },
  },
  {
    id: 'e2_f1_meg25_3',
    eixoId: 'lideranca',
    faseId: 'planejamento',
    nome: 'Documentar Registros de Saúde das Merendeiras/AAE',
    descricao: 'Manter laudos médicos ou Carteira de Saúde de todos os manipuladores de alimentos efetivos e contratados.',
    ordem: 12,
    codigoPDF: '2.1.3',
    documento: 'Laudo médico ou Carteira de Saúde das AAE/Nutrição Escolar',
    resultados: {
      2025: { status: 'possui', nota: 3.75 },
    },
  },
  {
    id: 'e2_f1_meg25_4',
    eixoId: 'lideranca',
    faseId: 'planejamento',
    nome: 'Disponibilizar Lista de Fornecedores Licitados',
    descricao: 'Planilha com fornecedores e marcas de produtos licitados para consulta dos fiscais de contrato e merendeiros.',
    ordem: 13,
    codigoPDF: '2.1.4',
    documento: 'Planilha com fornecedores e marcas de produtos na cozinha',
    resultados: {
      2025: { status: 'possui', nota: 3.75 },
    },
  },
  {
    id: 'e2_f1_meg25_5',
    eixoId: 'lideranca',
    faseId: 'planejamento',
    nome: 'Disponibilizar Uniformes e EPIs às Merendeiras',
    descricao: 'Entregar e registrar o fornecimento de uniformes completos e equipamentos de proteção individual às AAE.',
    ordem: 14,
    codigoPDF: '2.1.5',
    documento: 'Termo de recebimento de uniformes para AAE/nutrição',
    resultados: {
      2025: { status: 'incompleto', nota: 1.88 },
    },
  },

  // — Execução —
  {
    id: 'e2_f2_1',
    eixoId: 'lideranca',
    faseId: 'execucao',
    nome: 'Portfólio de Formações Realizadas na Escola',
    descricao: 'Certificados, listas de presença e registros de oficinas executadas.',
    ordem: 1,
  },
  // ✅ Sub-etapas MEG 2025 — Alimentação Escolar (Execução)
  {
    id: 'e2_f2_meg25_1',
    eixoId: 'lideranca',
    faseId: 'execucao',
    nome: 'Priorizar Fornecedores da Agricultura Familiar',
    descricao: 'Utilizar e registrar os pedidos dos fornecedores da Chamada Pública (Agricultura Familiar) semanal ou quinzenalmente.',
    ordem: 10,
    codigoPDF: '2.2.1',
    documento: 'Notas fiscais da agricultura familiar (semanal ou quinzenal)',
    resultados: {
      2025: { status: 'possui', nota: 6.25 },
    },
  },
  {
    id: 'e2_f2_meg25_2',
    eixoId: 'lideranca',
    faseId: 'execucao',
    nome: 'Preencher Diário de Alimentação Servida e Controle de Estoque',
    descricao: 'Manter o diário de alimentação servida e o controle de estoque preenchidos e com lançamentos atualizados.',
    ordem: 11,
    codigoPDF: '2.2.2',
    documento: 'Diário de alimentação servida e controle de estoque — Lançamentos',
    resultados: {
      2025: { status: 'possui', nota: 6.25 },
    },
  },
  {
    id: 'e2_f2_meg25_3',
    eixoId: 'lideranca',
    faseId: 'execucao',
    nome: 'Inserir Notas Fiscais no SIGEDUCA/GPO e BB Ágil',
    descricao: 'Lançamento mensal das notas fiscais nos sistemas SIGEDUCA/GPO e BB Ágil com Prestação de Contas e Manutenção de Despesa e Consumo.',
    ordem: 12,
    codigoPDF: '2.2.3',
    documento: 'Sistema Sigeduca GPO — Prestação de Contas; Lançamentos; Manutenção de Despesa e Consumo',
    resultados: {
      2025: { status: 'possui', nota: 18.75 },
    },
  },

  // — Controle, Melhorias, Resultados —
  {
    id: 'e2_f3_1',
    eixoId: 'lideranca',
    faseId: 'controle',
    nome: 'Fichas de Avaliação de Desempenho e Feedback',
    descricao: 'Registros de conversas de feedback e metas profissionais de desenvolvimento.',
    ordem: 1,
  },
  {
    id: 'e2_f4_1',
    eixoId: 'lideranca',
    faseId: 'melhorias',
    nome: 'Plano de Redirecionamento de Liderança',
    descricao: 'Medidas adotadas para resolver lacunas de capacitação da equipe.',
    ordem: 1,
  },
  {
    id: 'e2_f5_1',
    eixoId: 'lideranca',
    faseId: 'resultados',
    nome: 'Pesquisa de Clima Organizacional Interno',
    descricao: 'Avaliação anual da satisfação e motivação da equipe escolar.',
    ordem: 1,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EIXO 3 (pedagogico) — Limpeza e Organização dos Ambientes Escolares
  // ══════════════════════════════════════════════════════════════════════════

  // — Planejamento —
  {
    id: 'e3_f1_1',
    eixoId: 'pedagogico',
    faseId: 'planejamento',
    nome: 'Planejamento de Aulas por Área do Conhecimento',
    descricao: 'Planos de ensino mensais ou bimestrais elaborados pelos docentes.',
    ordem: 1,
  },
  {
    id: 'e3_f1_2',
    eixoId: 'pedagogico',
    faseId: 'planejamento',
    nome: 'Plano de Recuperação Paralela de Aprendizagem',
    descricao: 'Estratégia para alunos com aproveitamento abaixo do esperado.',
    ordem: 2,
  },
  // ✅ Sub-etapas MEG 2025 — Limpeza e Organização (Planejamento)
  {
    id: 'e3_f1_meg25_1',
    eixoId: 'pedagogico',
    faseId: 'planejamento',
    nome: 'Elaborar Cronograma/Escala de Limpeza por Ambiente',
    descricao: 'Formulário de escala de limpeza (mural), plano de trabalho com identificação de ambientes, preenchido e assinado.',
    ordem: 10,
    codigoPDF: '3.1.1',
    documento: 'Formulário de escala de limpeza (mural); Plano de trabalho e identificação de ambientes preenchido e assinado',
    resultados: {
      2025: { status: 'nao_possui', nota: 0 },
    },
  },
  {
    id: 'e3_f1_meg25_2',
    eixoId: 'pedagogico',
    faseId: 'planejamento',
    nome: 'Planejar Materiais de Limpeza e EPIs',
    descricao: 'Levantamento e aquisição de materiais de limpeza e EPIs com nota fiscal e termo de recebimento.',
    ordem: 11,
    codigoPDF: '3.1.2',
    documento: 'Nota fiscal de aquisição dos produtos; Termo de recebimento de EPIs',
    resultados: {
      2025: { status: 'incompleto', nota: 0 },
    },
  },
  {
    id: 'e3_f1_meg25_3',
    eixoId: 'pedagogico',
    faseId: 'planejamento',
    nome: 'Fornecer Protocolo de Limpeza e Orientações Técnicas',
    descricao: 'Disponibilizar o protocolo de limpeza impresso com registro de entrega e orientação técnica aos funcionários.',
    ordem: 12,
    codigoPDF: '3.1.3',
    documento: 'Protocolo impresso; Registro de entrega do protocolo de limpeza',
    resultados: {
      2025: { status: 'nao_possui', nota: 0 },
    },
  },

  // — Execução —
  {
    id: 'e3_f2_1',
    eixoId: 'pedagogico',
    faseId: 'execucao',
    nome: 'Diários de Classe Homologados e Fichas de Aula',
    descricao: 'Registro de conteúdos ministrados e frequência dos alunos.',
    ordem: 1,
  },
  // ✅ Sub-etapas MEG 2025 — Limpeza e Organização (Execução)
  {
    id: 'e3_f2_meg25_1',
    eixoId: 'pedagogico',
    faseId: 'execucao',
    nome: 'Executar Limpezas Planejadas e Registrar Tarefas',
    descricao: 'Execução das limpezas conforme cronograma e protocolo, com registro das tarefas realizadas por ambiente.',
    ordem: 10,
    codigoPDF: '3.2.1',
    documento: 'Cronograma de verificação de limpeza conforme protocolo',
    resultados: {
      2025: { status: 'nao_possui', nota: 0 },
    },
  },
  {
    id: 'e3_f2_meg25_2',
    eixoId: 'pedagogico',
    faseId: 'execucao',
    nome: 'Comunicar Problemas Identificados Durante a Limpeza',
    descricao: 'Registrar e comunicar ocorrências identificadas durante os processos de limpeza (ex: vazamentos, quebras, pragas).',
    ordem: 11,
    codigoPDF: '3.2.2',
    documento: 'Registro de ocorrência',
    resultados: {
      2025: { status: 'possui', nota: 6.25 },
    },
  },
  {
    id: 'e3_f2_meg25_3',
    eixoId: 'pedagogico',
    faseId: 'execucao',
    nome: 'Contratar e Fiscalizar Serviços Terceirizados de Limpeza',
    descricao: 'Contratação de empresa terceirizada de limpeza com emissão e arquivamento de notas fiscais.',
    ordem: 12,
    codigoPDF: '3.2.3',
    documento: 'Notas fiscais dos Serviços contratados',
    resultados: {
      2025: { status: 'possui', nota: 6.25 },
    },
  },

  // — Controle, Melhorias, Resultados —
  {
    id: 'e3_f3_1',
    eixoId: 'pedagogico',
    faseId: 'controle',
    nome: 'Relatório Mensal de Faltas e Notas Pedagógicas',
    descricao: 'Planilha consolidada de acompanhamento de notas e faltas.',
    ordem: 1,
  },
  {
    id: 'e3_f4_1',
    eixoId: 'pedagogico',
    faseId: 'melhorias',
    nome: 'Ações de Reforço Escolar Desenvolvidas no Período',
    descricao: 'Cronograma e lista de estudantes participantes do contraturno.',
    ordem: 1,
  },
  {
    id: 'e3_f5_1',
    eixoId: 'pedagogico',
    faseId: 'resultados',
    nome: 'Planilha de Desempenho nas Avaliações Externas',
    descricao: 'Resultados do IDEB, Avalia-MT e simulados escolares.',
    ordem: 1,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EIXO 4 (patrimonio) — Patrimônio Mobiliário e Imobiliário Escolar
  // ══════════════════════════════════════════════════════════════════════════

  // — Planejamento —
  {
    id: 'e4_f1_1',
    eixoId: 'patrimonio',
    faseId: 'planejamento',
    nome: 'Plano de Manutenção Preventiva do Prédio Escolar',
    descricao: 'Cronograma de vistorias prediais e reparos periódicos.',
    ordem: 1,
  },
  {
    id: 'e4_f1_2',
    eixoId: 'patrimonio',
    faseId: 'planejamento',
    nome: 'Orçamento e Plano de Aplicação de Recursos Financeiros',
    descricao: 'Detalhamento de gastos planejados com verbas recebidas.',
    ordem: 2,
  },
  // ✅ Sub-etapas MEG 2025 — Patrimônio Mobiliário e Imobiliário (Planejamento)
  {
    id: 'e4_f1_meg25_1',
    eixoId: 'patrimonio',
    faseId: 'planejamento',
    nome: 'Elaborar Cronograma de Inventário Anual de Bens Móveis e Imóveis',
    descricao: 'Elaborar o cronograma para o processo de Inventário Anual de Bens Móveis, Imóveis e Desfazimento de Bens Móveis Inservíveis.',
    ordem: 10,
    codigoPDF: '1.1.1',
    documento: 'Cronograma para processo de Inventário de Bens Móveis, Imóveis e Desfazimento de Bens Móveis Inservíveis',
    resultados: {
      2025: { status: 'nao_possui', nota: 0 },
    },
  },
  {
    id: 'e4_f1_meg25_2',
    eixoId: 'patrimonio',
    faseId: 'planejamento',
    nome: 'Elaborar Cronograma para Processo de Desfazimento',
    descricao: 'Cronograma específico para processo de desfazimento de Bens Móveis Inservíveis conforme legislação.',
    ordem: 11,
    codigoPDF: '1.1.2',
    documento: 'Cronograma para processo de Desfazimento de Bens Móveis Inservíveis',
    resultados: {
      2025: { status: 'nao_possui', nota: 0 },
    },
  },

  // — Execução —
  {
    id: 'e4_f2_1',
    eixoId: 'patrimonio',
    faseId: 'execucao',
    nome: 'Livro de Controle de Almoxarifado e Estoque',
    descricao: 'Registro de entrada e saída de materiais didáticos e consumo.',
    ordem: 1,
  },
  {
    id: 'e4_f2_2',
    eixoId: 'patrimonio',
    faseId: 'execucao',
    nome: 'Registro de Manutenção Corretiva Executada',
    descricao: 'Notas fiscais e ordens de serviço de reformas urgentes.',
    ordem: 2,
  },
  // ✅ Sub-etapas MEG 2025 — Patrimônio Mobiliário e Imobiliário (Execução)
  {
    id: 'e4_f2_meg25_1',
    eixoId: 'patrimonio',
    faseId: 'execucao',
    nome: 'Executar Inventário Anual de Bens Móveis e Inservíveis',
    descricao: 'Execução do cronograma de Inventário Anual com protocolo formal do processo e planilha de bens inservíveis.',
    ordem: 10,
    codigoPDF: '1.2.1',
    documento: 'Protocolo do processo de Inventário de Bens Móveis, Imóveis e Desfazimento; Planilha de Inventário de Bens Móveis Inservíveis',
    resultados: {
      2025: { status: 'possui', nota: 12.50 },
    },
  },
  {
    id: 'e4_f2_meg25_2',
    eixoId: 'patrimonio',
    faseId: 'execucao',
    nome: 'Executar Levantamento Cadastral Imobiliário',
    descricao: 'Executar o cronograma para levantamento cadastral do imóvel com ficha cadastral e Termo de Responsabilidade assinado.',
    ordem: 11,
    codigoPDF: '1.2.2',
    documento: 'Ficha de Levantamento Cadastral Imobiliário; Termo de Responsabilidade',
    resultados: {
      2025: { status: 'possui', nota: 6.25 },
    },
  },

  // — Controle, Melhorias, Resultados —
  {
    id: 'e4_f3_1',
    eixoId: 'patrimonio',
    faseId: 'controle',
    nome: 'Prestação de Contas Aprovada pelo Conselho Escolar',
    descricao: 'Balancete financeiro assinado pela comunidade e conselho.',
    ordem: 1,
  },
  {
    id: 'e4_f4_1',
    eixoId: 'patrimonio',
    faseId: 'melhorias',
    nome: 'Plano de Otimização do Consumo de Recursos',
    descricao: 'Estratégia para redução de perdas de água, energia ou papel.',
    ordem: 1,
  },
  {
    id: 'e4_f5_1',
    eixoId: 'patrimonio',
    faseId: 'resultados',
    nome: 'Termo de Inventário Patrimonial Anual Consolidado',
    descricao: 'Lista de todos os bens tombados e em uso na unidade escolar.',
    ordem: 1,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EIXO 5 (clima-escolar) — Gestão Escolar e Pedagógica
  // ══════════════════════════════════════════════════════════════════════════

  // — Planejamento —
  // ✅ Sub-etapas MEG 2025 — Gestão Escolar e Pedagógica (Planejamento)
  {
    id: 'e5_f1_meg25_1',
    eixoId: 'clima-escolar',
    faseId: 'planejamento',
    nome: 'Elaborar e/ou Atualizar o Plano de Gestão Escolar',
    descricao: 'Elaborar ou atualizar o Plano de Gestão da unidade escolar para o ano letivo vigente.',
    ordem: 10,
    codigoPDF: '5.1.1',
    documento: 'Plano de Gestão',
    resultados: {
      2025: { status: 'possui', nota: 4.17 },
    },
  },
  {
    id: 'e5_f1_meg25_2',
    eixoId: 'clima-escolar',
    faseId: 'planejamento',
    nome: 'Revisar e/ou Atualizar o Projeto Político Pedagógico (PPP)',
    descricao: 'Revisão e atualização do PPP com participação da comunidade escolar.',
    ordem: 11,
    codigoPDF: '5.1.2',
    documento: 'Projeto Político Pedagógico (PPP)',
    resultados: {
      2025: { status: 'possui', nota: 4.17 },
    },
  },
  {
    id: 'e5_f1_meg25_3',
    eixoId: 'clima-escolar',
    faseId: 'planejamento',
    nome: 'Elaborar Plano Financeiro (PDDE e Recursos)',
    descricao: 'Elaborar o Plano Financeiro contemplando PDDE, recursos estaduais e outras fontes de financiamento.',
    ordem: 12,
    codigoPDF: '5.1.3',
    documento: 'Plano Financeiro (PDDE)',
    resultados: {
      2025: { status: 'incompleto', nota: 2.08 },
    },
  },
  {
    id: 'e5_f1_meg25_4',
    eixoId: 'clima-escolar',
    faseId: 'planejamento',
    nome: 'Elaborar e/ou Atualizar o Regimento Interno Escolar',
    descricao: 'Manter o Regimento Interno atualizado com as normas de convivência e organização escolar.',
    ordem: 13,
    codigoPDF: '5.1.4',
    documento: 'Regimento Interno',
    resultados: {
      2025: { status: 'possui', nota: 4.17 },
    },
  },
  {
    id: 'e5_f1_meg25_5',
    eixoId: 'clima-escolar',
    faseId: 'planejamento',
    nome: 'Constituir o Conselho Deliberativo da Comunidade Escolar (CDE)',
    descricao: 'Formalizar a constituição do CDE com ata registrada em cartório.',
    ordem: 14,
    codigoPDF: '5.1.5',
    documento: 'Ata registrada no cartório',
    resultados: {
      2025: { status: 'possui', nota: 4.17 },
    },
  },
  {
    id: 'e5_f1_meg25_6',
    eixoId: 'clima-escolar',
    faseId: 'planejamento',
    nome: 'Implementar Ato Autorizativo da Unidade Escolar',
    descricao: 'Manter o protocolo do ato autorizativo da escola devidamente regularizado junto à SEDUC-MT.',
    ordem: 15,
    codigoPDF: '5.1.6',
    documento: 'Protocolo do ato autorizativo',
    resultados: {
      2025: { status: 'possui', nota: 4.17 },
    },
  },

  // — Execução —
  {
    id: 'e5_f2_1',
    eixoId: 'clima-escolar',
    faseId: 'execucao',
    nome: 'Registro de Atividades Cívicas e Projetos Sociais',
    descricao: 'Atividades realizadas de civismo, eventos beneficentes ou palestras.',
    ordem: 1,
  },
  // ✅ Sub-etapas MEG 2025 — Gestão Escolar e Pedagógica (Execução)
  {
    id: 'e5_f2_meg25_1',
    eixoId: 'clima-escolar',
    faseId: 'execucao',
    nome: 'Operacionalizar Ficha de Comunicação de Aluno Infrequente (Busca Ativa)',
    descricao: 'Operacionalizar a Ficha de Comunicação de Aluno Infrequente, Indisciplinado e Infrator (Ficha Fiscal), com designação do servidor responsável e registro das ações.',
    ordem: 10,
    codigoPDF: '5.2.1',
    documento: 'Documento de designação do servidor; Registro das ações da busca ativa',
    resultados: {
      2025: { status: 'possui', nota: 5.00 },
    },
  },
  {
    id: 'e5_f2_meg25_2',
    eixoId: 'clima-escolar',
    faseId: 'execucao',
    nome: 'Garantir Recomposição da Aprendizagem dos Alunos em Busca Ativa',
    descricao: 'Elaborar e executar plano de recomposição da aprendizagem para alunos retornados via busca ativa.',
    ordem: 11,
    codigoPDF: '5.2.2',
    documento: 'Plano de recomposição',
    resultados: {
      2025: { status: 'possui', nota: 5.00 },
    },
  },
  {
    id: 'e5_f2_meg25_3',
    eixoId: 'clima-escolar',
    faseId: 'execucao',
    nome: 'Identificar Salas e Turmas no Sistema da Equipe Gestora',
    descricao: 'Manter salas e turmas devidamente identificadas de acordo com o sistema da equipe gestora.',
    ordem: 12,
    codigoPDF: '5.2.3',
    documento: 'Salas e turmas identificadas',
    resultados: {
      2025: { status: 'possui', nota: 5.00 },
    },
  },
  {
    id: 'e5_f2_meg25_4',
    eixoId: 'clima-escolar',
    faseId: 'execucao',
    nome: 'Realizar Dependências de Alunos com Progressão Parcial',
    descricao: 'Executar as dependências dos alunos com resultado final em progressão parcial de anos anteriores.',
    ordem: 13,
    codigoPDF: '5.2.4',
    documento: 'Resultado da avaliação da progressão',
    resultados: {
      2025: { status: 'possui', nota: 5.00 },
    },
  },
  {
    id: 'e5_f2_meg25_5',
    eixoId: 'clima-escolar',
    faseId: 'execucao',
    nome: 'Implementar Calendários de Avaliações Externas (SAEB)',
    descricao: 'Divulgar e implementar os calendários de avaliações externas e da Secretaria de Educação, com resultados publicados.',
    ordem: 14,
    codigoPDF: '5.2.5',
    documento: 'Resultados no SAEB publicados',
    resultados: {
      2025: { status: 'possui', nota: 5.00 },
    },
  },

  // — Controle, Melhorias, Resultados —
  {
    id: 'e5_f3_1',
    eixoId: 'clima-escolar',
    faseId: 'controle',
    nome: 'Relatório Consolidado de Ocorrências e Convivência',
    descricao: 'Estatísticas de infrações disciplinares analisadas periodicamente.',
    ordem: 1,
  },
  {
    id: 'e5_f4_1',
    eixoId: 'clima-escolar',
    faseId: 'melhorias',
    nome: 'Plano de Mediação de Conflitos e Círculos Restaurativos',
    descricao: 'Projetos pedagógicos focados na redução da violência escolar.',
    ordem: 1,
  },
  {
    id: 'e5_f5_1',
    eixoId: 'clima-escolar',
    faseId: 'resultados',
    nome: 'Índice de Evasão e Reprovação Escolar Reduzidos',
    descricao: 'Comparativo estatístico anual dos índices de evasão/sucesso.',
    ordem: 1,
  },
];

// ---------------------------------------------------------------------------
// Mapeamento de formulários (sem alteração nas chaves existentes)
// ---------------------------------------------------------------------------

export const EVIDENCIA_FORM_MAP: Record<string, { tipo: string; label: string }> = {
  // Eixo 4 - Patrimônio
  'e4_f5_1':       { tipo: 'cronograma_patrimonial',    label: 'Cronograma Patrimonial' },
  'e4_f1_2':       { tipo: 'dfd_pcr',                   label: 'Documento de Formalização de Demanda (DFD)' },
  'e4_f2_1':       { tipo: 'ficha_cadastral_imovel',     label: 'Ficha Cadastral Imobiliária' },
  'e4_f2_2':       { tipo: 'checklist_tti',              label: 'Checklist de Transferência Interna (TTI)' },
  'e4_f2_meg25_1': { tipo: 'inventario_bens_moveis',     label: 'Protocolo de Inventário de Bens Móveis' },
  'e4_f2_meg25_2': { tipo: 'ficha_cadastral_imovel',     label: 'Ficha de Levantamento Cadastral Imobiliário' },

  // Eixo 2 - Alimentação
  'e2_f1_1':       { tipo: 'lancamento_nota_fiscal',     label: 'Lançamento de Nota Fiscal no GPO' },
  'e2_f2_1':       { tipo: 'relatorio_ean',              label: 'Relatório de Ações de Educação Alimentar (EAN)' },
  'e2_f5_1':       { tipo: 'pesquisa_satisfacao_alim',   label: 'Pesquisa de Satisfação da Alimentação' },
  'e2_f2_meg25_3': { tipo: 'lancamento_nota_fiscal',     label: 'Inserção de Nota Fiscal no SIGEDUCA/GPO' },

  // Eixo 3 - Limpeza
  'e3_f1_1':       { tipo: 'controle_recursos_limpeza',  label: 'Controle de Recursos de Limpeza' },
  'e3_f2_1':       { tipo: 'cronograma_verif_limpeza',   label: 'Cronograma de Verificação de Limpeza' },
  'e3_f3_1':       { tipo: 'registro_ocorrencia_limpeza',label: 'Registro de Ocorrências de Limpeza' },
  'e3_f5_1':       { tipo: 'pesquisa_percepcao_limpeza', label: 'Pesquisa de Percepção de Limpeza' },

  // Eixo 1 - Manutenção
  'e1_f1_1':       { tipo: 'cronograma_inspecoes',       label: 'Cronograma de Inspeções Prediais' },
  'e1_f2_1':       { tipo: 'checklist_intervencoes',     label: 'Checklist de Intervenções' },
  'e1_f4_1':       { tipo: 'justificativa_pendencias',   label: 'Justificativa de Pendências' },
  'e1_f1_meg25_1': { tipo: 'cronograma_inspecoes',       label: 'Cronograma de Inspeções Prediais (MEG)' },
  'e1_f2_meg25_1': { tipo: 'relatorio_manutencao',       label: 'Relatório de Verificação com Registro Fotográfico' },

  // Eixo 5 - Gestão Escolar e Pedagógica
  'e5_f3_1':       { tipo: 'indicadores_busca_ativa',    label: 'Indicadores de Busca Ativa' },
  'e5_f5_1':       { tipo: 'gestao_financeira',          label: 'Gestão Financeira (PDDE e Recursos)' },
  'e5_f1_meg25_3': { tipo: 'plano_financeiro_pdde',      label: 'Plano Financeiro (PDDE)' },
  'e5_f2_meg25_1': { tipo: 'ficha_busca_ativa',          label: 'Ficha de Comunicação de Aluno Infrequente' },
};

// ---------------------------------------------------------------------------
// Configurações de pontuação máxima por eixo
// ✅ Corrigido: clima-escolar maxProcessos de 100 → 115 (conforme avaliação SEDUC-MT)
// ---------------------------------------------------------------------------

export const MEG_AXIS_CONFIGS: Record<string, {
  nome: string;
  maxProcessos: number;
  maxResultados: number;
  slug: string;
  numero: number;
}> = {
  'patrimonio': {
    nome: 'Patrimônio Mobiliário e Imobiliário',
    maxProcessos: 75,
    maxResultados: 110,
    slug: 'patrimonio',
    numero: 1,
  },
  'lideranca': {
    nome: 'Alimentação Escolar',
    maxProcessos: 75,
    maxResultados: 110,
    slug: 'lideranca',
    numero: 2,
  },
  'pedagogico': {
    nome: 'Limpeza e Organização',
    maxProcessos: 75,
    maxResultados: 110,
    slug: 'pedagogico',
    numero: 3,
  },
  'gestao-escolar': {
    nome: 'Manutenção e Conservação',
    maxProcessos: 75,
    maxResultados: 110,
    slug: 'gestao-escolar',
    numero: 4,
  },
  'clima-escolar': {
    nome: 'Gestão Escolar e Pedagógica',
    maxProcessos: 115, // ✅ Corrigido: era 100
    maxResultados: 160,
    slug: 'clima-escolar',
    numero: 5,
  },
};
