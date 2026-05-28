// lib/meg-data.ts
// Dados estáticos de suporte ao Módulo Pedagógico - MEG Educação (SEDUC-MT)

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
}

export interface MegEvidencia {
  id: string;
  eixoId: string;
  faseId: string;
  nome: string;
  descricao: string;
  ordem: number;
}

export const MEG_EIXOS: MegEixo[] = [
  {
    id: 'gestao-escolar',
    numero: 1,
    nome: 'Planejamento Estratégico e Gestão Escolar',
    slug: 'gestao-escolar',
    icone: 'ClipboardList',
    color: 'text-blue-500 dark:text-blue-400',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
    borderColor: 'border-blue-500/20 dark:border-blue-500/30'
  },
  {
    id: 'lideranca',
    numero: 2,
    nome: 'Gestão de Pessoas e Liderança',
    slug: 'lideranca',
    icone: 'Users',
    color: 'text-purple-500 dark:text-purple-400',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/20 dark:border-purple-500/30'
  },
  {
    id: 'pedagogico',
    numero: 3,
    nome: 'Gestão de Processos Pedagógicos',
    slug: 'pedagogico',
    icone: 'GraduationCap',
    color: 'text-emerald-500 dark:text-emerald-400',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
    borderColor: 'border-emerald-500/20 dark:border-emerald-500/30'
  },
  {
    id: 'patrimonio',
    numero: 4,
    nome: 'Gestão de Recursos e Patrimônio',
    slug: 'patrimonio',
    icone: 'Building',
    color: 'text-amber-500 dark:text-amber-400',
    bgGradient: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-500/20 dark:border-amber-500/30'
  },
  {
    id: 'clima-escolar',
    numero: 5,
    nome: 'Gestão de Resultados e Clima Escolar',
    slug: 'clima-escolar',
    icone: 'LineChart',
    color: 'text-rose-500 dark:text-rose-400',
    bgGradient: 'from-rose-500/10 to-red-500/10',
    borderColor: 'border-rose-500/20 dark:border-rose-500/30'
  }
];

export const MEG_FASES: MegFase[] = [
  { id: 'planejamento', numero: 1, nome: 'Planejamento', slug: 'planejamento' },
  { id: 'execucao', numero: 2, nome: 'Execução', slug: 'execucao' },
  { id: 'controle', numero: 3, nome: 'Controle e Avaliação de Qualidade e Eficiência', slug: 'controle' },
  { id: 'melhorias', numero: 4, nome: 'Implementação de Melhorias', slug: 'melhorias' },
  { id: 'resultados', numero: 5, nome: 'Avaliação de Resultados', slug: 'resultados' }
];

export const MEG_EVIDENCIAS: MegEvidencia[] = [
  // Eixo 1 - Gestão Escolar
  {
    id: 'e1_f1_1',
    eixoId: 'gestao-escolar',
    faseId: 'planejamento',
    nome: 'Projeto Político Pedagógico (PPP) Atualizado',
    descricao: 'PPP revisado e alinhado com as diretrizes do MEG Educação.',
    ordem: 1
  },
  {
    id: 'e1_f1_2',
    eixoId: 'gestao-escolar',
    faseId: 'planejamento',
    nome: 'Plano de Ação Anual da Escola',
    descricao: 'Documento contendo metas, prazos e responsabilidades para o ano letivo.',
    ordem: 2
  },
  {
    id: 'e1_f2_1',
    eixoId: 'gestao-escolar',
    faseId: 'execucao',
    nome: 'Registro de Reuniões de Alinhamento Coletivo',
    descricao: 'Atas e fotos de reuniões realizadas com a equipe escolar.',
    ordem: 1
  },
  {
    id: 'e1_f3_1',
    eixoId: 'gestao-escolar',
    faseId: 'controle',
    nome: 'Relatório de Acompanhamento das Metas do PPP',
    descricao: 'Planilha ou relatório indicando a evolução do cumprimento das metas.',
    ordem: 1
  },
  {
    id: 'e1_f4_1',
    eixoId: 'gestao-escolar',
    faseId: 'melhorias',
    nome: 'Plano de Intervenção para Metas Não Atingidas',
    descricao: 'Ações corretivas traçadas após a análise das metas do semestre.',
    ordem: 1
  },
  {
    id: 'e1_f5_1',
    eixoId: 'gestao-escolar',
    faseId: 'resultados',
    nome: 'Relatório de Avaliação Institucional',
    descricao: 'Resultados de questionários aplicados à comunidade escolar sobre a gestão.',
    ordem: 1
  },

  // Eixo 2 - Liderança
  {
    id: 'e2_f1_1',
    eixoId: 'lideranca',
    faseId: 'planejamento',
    nome: 'Plano de Formação Continuada dos Servidores',
    descricao: 'Cronograma e temas de treinamento para professores e funcionários.',
    ordem: 1
  },
  {
    id: 'e2_f2_1',
    eixoId: 'lideranca',
    faseId: 'execucao',
    nome: 'Portfólio de Formações Realizadas na Escola',
    descricao: 'Certificados, listas de presença e registros de oficinas executadas.',
    ordem: 1
  },
  {
    id: 'e2_f3_1',
    eixoId: 'lideranca',
    faseId: 'controle',
    nome: 'Fichas de Avaliação de Desempenho e Feedback',
    descricao: 'Registros de conversas de feedback e metas profissionais de desenvolvimento.',
    ordem: 1
  },
  {
    id: 'e2_f4_1',
    eixoId: 'lideranca',
    faseId: 'melhorias',
    nome: 'Plano de Redirecionamento de Liderança',
    descricao: 'Medidas adotadas para resolver lacunas de capacitação da equipe.',
    ordem: 1
  },
  {
    id: 'e2_f5_1',
    eixoId: 'lideranca',
    faseId: 'resultados',
    nome: 'Pesquisa de Clima Organizacional Interno',
    descricao: 'Avaliação anual da satisfação e motivação da equipe escolar.',
    ordem: 1
  },

  // Eixo 3 - Processos Pedagógicos
  {
    id: 'e3_f1_1',
    eixoId: 'pedagogico',
    faseId: 'planejamento',
    nome: 'Planejamento de Aulas por Área do Conhecimento',
    descricao: 'Planos de ensino mensais ou bimestrais elaborados pelos docentes.',
    ordem: 1
  },
  {
    id: 'e3_f1_2',
    eixoId: 'pedagogico',
    faseId: 'planejamento',
    nome: 'Plano de Recuperação Paralela de Aprendizagem',
    descricao: 'Estratégia para alunos com aproveitamento abaixo do esperado.',
    ordem: 2
  },
  {
    id: 'e3_f2_1',
    eixoId: 'pedagogico',
    faseId: 'execucao',
    nome: 'Diários de Classe Homologados e Fichas de Aula',
    descricao: 'Registro de conteúdos ministrados e frequência dos alunos.',
    ordem: 1
  },
  {
    id: 'e3_f3_1',
    eixoId: 'pedagogico',
    faseId: 'controle',
    nome: 'Relatório Mensal de Faltas e Notas Pedagógicas',
    descricao: 'Planilha consolidada de acompanhamento de notas e faltas.',
    ordem: 1
  },
  {
    id: 'e3_f4_1',
    eixoId: 'pedagogico',
    faseId: 'melhorias',
    nome: 'Ações de Reforço Escolar Desenvolvidas no Período',
    descricao: 'Cronograma e lista de estudantes participantes do contraturno.',
    ordem: 1
  },
  {
    id: 'e3_f5_1',
    eixoId: 'pedagogico',
    faseId: 'resultados',
    nome: 'Planilha de Desempenho nas Avaliações Externas',
    descricao: 'Resultados do IDEB, Avalia-MT e simulados escolares.',
    ordem: 1
  },

  // Eixo 4 - Recursos e Patrimônio
  {
    id: 'e4_f1_1',
    eixoId: 'patrimonio',
    faseId: 'planejamento',
    nome: 'Plano de Manutenção Preventiva do Prédio Escolar',
    descricao: 'Cronograma de vistorias prediais e reparos periódicos.',
    ordem: 1
  },
  {
    id: 'e4_f1_2',
    eixoId: 'patrimonio',
    faseId: 'planejamento',
    nome: 'Orçamento e Plano de Aplicação de Recursos Financeiros',
    descricao: 'Detalhamento de gastos planejados com verbas recebidas.',
    ordem: 2
  },
  {
    id: 'e4_f2_1',
    eixoId: 'patrimonio',
    faseId: 'execucao',
    nome: 'Livro de Controle de Almoxarifado e Estoque',
    descricao: 'Registro de entrada e saída de materiais didáticos e consumo.',
    ordem: 1
  },
  {
    id: 'e4_f2_2',
    eixoId: 'patrimonio',
    faseId: 'execucao',
    nome: 'Registro de Manutenção Corretiva Executada',
    descricao: 'Notas fiscais e ordens de serviço de reformas urgentes.',
    ordem: 2
  },
  {
    id: 'e4_f3_1',
    eixoId: 'patrimonio',
    faseId: 'controle',
    nome: 'Prestação de Contas Aprovada pelo Conselho Escolar',
    descricao: 'Balancete financeiro assinado pela comunidade e conselho.',
    ordem: 1
  },
  {
    id: 'e4_f4_1',
    eixoId: 'patrimonio',
    faseId: 'melhorias',
    nome: 'Plano de Otimização do Consumo de Recursos',
    descricao: 'Estratégia para redução de perdas de água, energia ou papel.',
    ordem: 1
  },
  {
    id: 'e4_f5_1',
    eixoId: 'patrimonio',
    faseId: 'resultados',
    nome: 'Termo de Inventário Patrimonial Anual Consolidado',
    descricao: 'Lista de todos os bens tombados e em uso na unidade escolar.',
    ordem: 1
  },

  // Eixo 5 - Clima Escolar e Resultados
  {
    id: 'e5_f2_1',
    eixoId: 'clima-escolar',
    faseId: 'execucao',
    nome: 'Registro de Atividades Cívicas e Projetos Sociais',
    descricao: 'Atividades realizadas de civismo, eventos beneficentes ou palestras.',
    ordem: 1
  },
  {
    id: 'e5_f3_1',
    eixoId: 'clima-escolar',
    faseId: 'controle',
    nome: 'Relatório Consolidado de Ocorrências e Convivência',
    descricao: 'Estatísticas de infrações disciplinares analisadas periodicamente.',
    ordem: 1
  },
  {
    id: 'e5_f4_1',
    eixoId: 'clima-escolar',
    faseId: 'melhorias',
    nome: 'Plano de Mediação de Conflitos e Círculos Restaurativos',
    descricao: 'Projetos pedagogicos focados na redução da violência escolar.',
    ordem: 1
  },
  {
    id: 'e5_f5_1',
    eixoId: 'clima-escolar',
    faseId: 'resultados',
    nome: 'Índice de Evasão e Reprovação Escolar Reduzidos',
    descricao: 'Comparativo estatístico anual dos índices de evasão/sucesso.',
    ordem: 1
  }
];

export const EVIDENCIA_FORM_MAP: Record<string, { tipo: string; label: string }> = {
  // Eixo 4 - Patrimonio (Gestão de Recursos e Patrimônio) -> Eixo 1: Patrimônio Mobiliário e Imobiliário
  'e4_f5_1': { tipo: 'cronograma_patrimonial', label: 'Cronograma Patrimonial' },
  'e4_f1_2': { tipo: 'dfd_pcr', label: 'Documento de Formalização de Demanda (DFD)' },
  'e4_f2_1': { tipo: 'ficha_cadastral_imovel', label: 'Ficha Cadastral Imobiliária' },
  'e4_f2_2': { tipo: 'checklist_tti', label: 'Checklist de Transferência Interna (TTI)' },

  // Eixo 2 - Liderança (Gestão de Pessoas e Liderança) -> Eixo 2: Alimentação Escolar
  'e2_f1_1': { tipo: 'lancamento_nota_fiscal', label: 'Lançamento de Nota Fiscal no GPO' },
  'e2_f2_1': { tipo: 'relatorio_ean', label: 'Relatório de Ações de Educação Alimentar (EAN)' },
  'e2_f5_1': { tipo: 'pesquisa_satisfacao_alimentacao', label: 'Pesquisa de Satisfação da Alimentação' },

  // Eixo 3 - Pedagogico (Gestão de Processos Pedagógicos) -> Eixo 3: Limpeza e Organização
  'e3_f1_1': { tipo: 'controle_recursos_limpeza', label: 'Controle de Recursos de Limpeza' },
  'e3_f2_1': { tipo: 'cronograma_verificacao_limpeza', label: 'Cronograma de Verificação de Limpeza' },
  'e3_f3_1': { tipo: 'registro_ocorrencia_limpeza', label: 'Registro de Ocorrências de Limpeza' },
  'e3_f5_1': { tipo: 'pesquisa_percepcao_limpeza', label: 'Pesquisa de Percepção de Limpeza' },

  // Eixo 1 - Gestão Escolar (Planejamento Estratégico e Gestão Escolar) -> Eixo 4: Manutenção e Conservação
  'e1_f1_1': { tipo: 'cronograma_inspecoes', label: 'Cronograma de Inspeções Prediais' },
  'e1_f2_1': { tipo: 'checklist_intervencoes', label: 'Checklist de Intervenções' },
  'e1_f4_1': { tipo: 'justificativa_pendencias', label: 'Justificativa de Pendências' },

  // Eixo 5 - Clima Escolar (Gestão de Resultados e Clima Escolar) -> Eixo 5: Gestão Escolar e Pedagógica
  'e5_f3_1': { tipo: 'indicadores_busca_ativa', label: 'Indicadores de Busca Ativa' },
  'e5_f5_1': { tipo: 'gestao_financeira', label: 'Gestão Financeira (PDDE e Recursos)' }
};

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
    numero: 1
  },
  'lideranca': {
    nome: 'Alimentação Escolar',
    maxProcessos: 75,
    maxResultados: 110,
    slug: 'lideranca',
    numero: 2
  },
  'pedagogico': {
    nome: 'Limpeza e Organização',
    maxProcessos: 75,
    maxResultados: 110,
    slug: 'pedagogico',
    numero: 3
  },
  'gestao-escolar': {
    nome: 'Manutenção e Conservação',
    maxProcessos: 75,
    maxResultados: 110,
    slug: 'gestao-escolar',
    numero: 4
  },
  'clima-escolar': {
    nome: 'Gestão Escolar e Pedagógica',
    maxProcessos: 100,
    maxResultados: 160,
    slug: 'clima-escolar',
    numero: 5
  }
};

