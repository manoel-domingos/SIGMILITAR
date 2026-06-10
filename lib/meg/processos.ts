// lib/meg/processos.ts
// Critérios de Processos por eixo — FRAMEWORK PURO (sem notas de escola)
// Fonte: Formulário MEG SEDUC-MT 2025

export interface MegProcessoCriterio {
  id: string;       // código do critério no PDF (ex: "1.1.1")
  eixoId: string;
  grupo: string;    // nome do grupo (ex: "Planejamento/Inventário")
  criterio: string; // nome do critério
  documento: string;// documento exigido
  pesoMax: number;  // pontuação máxima do critério
}

export const MEG_PROCESSOS: MegProcessoCriterio[] = [

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 1 — Patrimônio Mobiliário e Imobiliário (total processos: 75)
  // ═══════════════════════════════════════════════════════════════════════

  // Grupo 1.1 — Planejamento (total: 12.5)
  { id: '1.1.1', eixoId: 'patrimonio', grupo: 'Planejamento de Inventário',
    criterio: 'Elaborar Cronograma de Inventário Anual de Bens Móveis, Imóveis e Desfazimento',
    documento: 'Cronograma para processo de Inventário de Bens Móveis, Imóveis e Desfazimento de Bens Móveis Inservíveis',
    pesoMax: 6.25 },
  { id: '1.1.2', eixoId: 'patrimonio', grupo: 'Planejamento de Inventário',
    criterio: 'Elaborar Cronograma específico para processo de Desfazimento de Bens Móveis Inservíveis',
    documento: 'Cronograma para processo de Desfazimento de Bens Móveis Inservíveis',
    pesoMax: 6.25 },

  // Grupo 1.2 — Execução (total: 18.75)
  { id: '1.2.1', eixoId: 'patrimonio', grupo: 'Execução do Inventário',
    criterio: 'Executar Inventário Anual de Bens Móveis, Imóveis e Bens Inservíveis',
    documento: 'Protocolo do processo de Inventário de Bens Móveis, Imóveis e Desfazimento; Planilha de Inventário de Bens Móveis Inservíveis',
    pesoMax: 12.5 },
  { id: '1.2.2', eixoId: 'patrimonio', grupo: 'Execução do Inventário',
    criterio: 'Executar Levantamento Cadastral Imobiliário',
    documento: 'Ficha de Levantamento Cadastral Imobiliário; Termo de Responsabilidade',
    pesoMax: 6.25 },

  // Grupo 1.3 — Controle e Regularização (total: 25)
  { id: '1.3.1', eixoId: 'patrimonio', grupo: 'Controle e Regularização Patrimonial',
    criterio: 'Manter Plaquetamento e Registro Patrimonial atualizado no SIGEDUCA',
    documento: 'Relatório de bens tombados no SIGEDUCA; Etiquetas patrimoniais',
    pesoMax: 12.5 },
  { id: '1.3.2', eixoId: 'patrimonio', grupo: 'Controle e Regularização Patrimonial',
    criterio: 'Registrar e comunicar Bens Móveis Inservíveis para desfazimento',
    documento: 'Relatório de bens inservíveis; Comunicação formal para desfazimento',
    pesoMax: 12.5 },

  // Grupo 1.4 — Resultado e Prestação de Contas (total: 18.75)
  { id: '1.4.1', eixoId: 'patrimonio', grupo: 'Resultado e Prestação de Contas',
    criterio: 'Consolidar Termo de Inventário Patrimonial Anual',
    documento: 'Termo de Inventário Patrimonial Anual assinado',
    pesoMax: 9.375 },
  { id: '1.4.2', eixoId: 'patrimonio', grupo: 'Resultado e Prestação de Contas',
    criterio: 'Apresentar Prestação de Contas Patrimonial ao Conselho Escolar',
    documento: 'Ata de aprovação do Conselho Escolar com balanço patrimonial',
    pesoMax: 9.375 },

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 2 — Alimentação Escolar (total processos: 75)
  // ═══════════════════════════════════════════════════════════════════════

  // Grupo 2.1 — Planejamento e Organização (total: 18.75)
  { id: '2.1.1', eixoId: 'alimentacao', grupo: 'Planejamento e Organização da Alimentação',
    criterio: 'Disponibilizar Cardápio Impresso e Controle de Estoque atualizados',
    documento: 'Cardápio 2025 afixado; Diário de alimentação servida; Controle de estoque',
    pesoMax: 3.75 },
  { id: '2.1.2', eixoId: 'alimentacao', grupo: 'Planejamento e Organização da Alimentação',
    criterio: 'Fixar Placas Orientativas de Higiene na Cozinha',
    documento: 'Placas orientativas sobre lavagem de mãos, antissepsia e hábitos higiênicos',
    pesoMax: 3.75 },
  { id: '2.1.3', eixoId: 'alimentacao', grupo: 'Planejamento e Organização da Alimentação',
    criterio: 'Documentar Registros de Saúde das Merendeiras/AAE',
    documento: 'Laudo médico ou Carteira de Saúde das AAE/Nutrição Escolar',
    pesoMax: 3.75 },
  { id: '2.1.4', eixoId: 'alimentacao', grupo: 'Planejamento e Organização da Alimentação',
    criterio: 'Disponibilizar Lista de Fornecedores Licitados na cozinha',
    documento: 'Planilha com fornecedores e marcas de produtos licitados na cozinha',
    pesoMax: 3.75 },
  { id: '2.1.5', eixoId: 'alimentacao', grupo: 'Planejamento e Organização da Alimentação',
    criterio: 'Disponibilizar Uniformes completos e EPIs às Merendeiras/AAE',
    documento: 'Termo de recebimento de uniformes para AAE/nutrição',
    pesoMax: 3.75 },

  // Grupo 2.2 — Execução (total: 31.25)
  { id: '2.2.1', eixoId: 'alimentacao', grupo: 'Execução e Controle da Alimentação',
    criterio: 'Priorizar Fornecedores da Agricultura Familiar (Chamada Pública)',
    documento: 'Notas fiscais da agricultura familiar (semanal ou quinzenal)',
    pesoMax: 6.25 },
  { id: '2.2.2', eixoId: 'alimentacao', grupo: 'Execução e Controle da Alimentação',
    criterio: 'Preencher Diário de Alimentação Servida e Controle de Estoque com lançamentos atualizados',
    documento: 'Diário de alimentação servida e controle de estoque — Lançamentos',
    pesoMax: 6.25 },
  { id: '2.2.3', eixoId: 'alimentacao', grupo: 'Execução e Controle da Alimentação',
    criterio: 'Inserir Notas Fiscais no SIGEDUCA/GPO e BB Ágil mensalmente',
    documento: 'Sistema SIGEDUCA GPO — Prestação de Contas; Lançamentos; Manutenção de Despesa e Consumo',
    pesoMax: 18.75 },

  // Grupo 2.3 — Monitoramento e Avaliação (total: 10)
  { id: '2.3.1', eixoId: 'alimentacao', grupo: 'Monitoramento e Avaliação da Alimentação',
    criterio: 'Realizar Ações de Educação Alimentar e Nutricional (EAN) com alunos',
    documento: 'Registro de atividades de EAN; Listas de presença',
    pesoMax: 5.0 },
  { id: '2.3.2', eixoId: 'alimentacao', grupo: 'Monitoramento e Avaliação da Alimentação',
    criterio: 'Aplicar Pesquisa de Satisfação da Alimentação Escolar',
    documento: 'Resultado de pesquisa de satisfação da alimentação escolar',
    pesoMax: 5.0 },

  // Grupo 2.4 — Resultado e Prestação de Contas (total: 15)
  { id: '2.4.1', eixoId: 'alimentacao', grupo: 'Resultado e Prestação de Contas da Alimentação',
    criterio: 'Consolidar Prestação de Contas da Alimentação Escolar',
    documento: 'Relatório de prestação de contas da alimentação; Balancete',
    pesoMax: 5.0 },
  { id: '2.4.2', eixoId: 'alimentacao', grupo: 'Resultado e Prestação de Contas da Alimentação',
    criterio: 'Apresentar resultados da alimentação ao Conselho Escolar (CDE)',
    documento: 'Ata de reunião do CDE com pautas de alimentação',
    pesoMax: 5.0 },
  { id: '2.4.3', eixoId: 'alimentacao', grupo: 'Resultado e Prestação de Contas da Alimentação',
    criterio: 'Manter transparência dos gastos com alimentação no Portal da Transparência',
    documento: 'Comprovante de publicação no Portal da Transparência',
    pesoMax: 5.0 },

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 3 — Limpeza e Organização dos Ambientes (total processos: 75)
  // ═══════════════════════════════════════════════════════════════════════

  // Grupo 3.1 — Planejamento (total: 18.75)
  { id: '3.1.1', eixoId: 'limpeza', grupo: 'Planejamento da Limpeza',
    criterio: 'Elaborar Cronograma/Escala de Limpeza por Ambiente (formulário de escala de limpeza mural)',
    documento: 'Formulário de escala de limpeza (mural); Plano de trabalho com identificação de ambientes, preenchido e assinado',
    pesoMax: 6.25 },
  { id: '3.1.2', eixoId: 'limpeza', grupo: 'Planejamento da Limpeza',
    criterio: 'Planejar e adquirir Materiais de Limpeza e EPIs com nota fiscal',
    documento: 'Nota fiscal de aquisição dos produtos; Termo de recebimento de EPIs',
    pesoMax: 6.25 },
  { id: '3.1.3', eixoId: 'limpeza', grupo: 'Planejamento da Limpeza',
    criterio: 'Fornecer Protocolo de Limpeza impresso com registro de entrega e orientação técnica',
    documento: 'Protocolo impresso; Registro de entrega do protocolo de limpeza',
    pesoMax: 6.25 },

  // Grupo 3.2 — Execução (total: 18.75)
  { id: '3.2.1', eixoId: 'limpeza', grupo: 'Execução das Limpezas',
    criterio: 'Executar Limpezas conforme cronograma e protocolo com registro das tarefas por ambiente',
    documento: 'Cronograma de verificação de limpeza conforme protocolo',
    pesoMax: 6.25 },
  { id: '3.2.2', eixoId: 'limpeza', grupo: 'Execução das Limpezas',
    criterio: 'Comunicar e registrar Problemas Identificados durante a Limpeza (vazamentos, quebras, pragas)',
    documento: 'Registro de ocorrência',
    pesoMax: 6.25 },
  { id: '3.2.3', eixoId: 'limpeza', grupo: 'Execução das Limpezas',
    criterio: 'Contratar e fiscalizar Serviços Terceirizados de Limpeza com emissão de notas fiscais',
    documento: 'Notas fiscais dos serviços contratados',
    pesoMax: 6.25 },

  // Grupo 3.3 — Controle e Monitoramento (total: 12.5)
  { id: '3.3.1', eixoId: 'limpeza', grupo: 'Controle e Monitoramento da Limpeza',
    criterio: 'Realizar inspeções periódicas de limpeza e registrar conformidades por ambiente',
    documento: 'Formulário de inspeção de limpeza; Registro fotográfico',
    pesoMax: 6.25 },
  { id: '3.3.2', eixoId: 'limpeza', grupo: 'Controle e Monitoramento da Limpeza',
    criterio: 'Monitorar o uso e consumo de materiais de limpeza e EPI pelos funcionários',
    documento: 'Controle de estoque de materiais de limpeza; Controle de EPI',
    pesoMax: 6.25 },

  // Grupo 3.4 — Resultado e Avaliação (total: 25)
  { id: '3.4.1', eixoId: 'limpeza', grupo: 'Resultado e Avaliação da Limpeza',
    criterio: 'Aplicar pesquisa de percepção de limpeza com a comunidade escolar',
    documento: 'Pesquisa de percepção de limpeza; Resultado consolidado',
    pesoMax: 6.25 },
  { id: '3.4.2', eixoId: 'limpeza', grupo: 'Resultado e Avaliação da Limpeza',
    criterio: 'Consolidar relatório de conformidade geral de limpeza por semestre',
    documento: 'Relatório semestral de conformidade de limpeza',
    pesoMax: 6.25 },
  { id: '3.4.3', eixoId: 'limpeza', grupo: 'Resultado e Avaliação da Limpeza',
    criterio: 'Apresentar resultados da limpeza ao Conselho Escolar',
    documento: 'Ata de reunião do CDE com pauta de limpeza',
    pesoMax: 6.25 },
  { id: '3.4.4', eixoId: 'limpeza', grupo: 'Resultado e Avaliação da Limpeza',
    criterio: 'Implementar melhorias com base nas não-conformidades identificadas',
    documento: 'Plano de ação corretivo de limpeza',
    pesoMax: 6.25 },

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 4 — Manutenção e Conservação da Infraestrutura (total processos: 75)
  // ═══════════════════════════════════════════════════════════════════════

  // Grupo 4.1 — Planejamento de Inspeções (total: 18.75)
  { id: '4.1.1', eixoId: 'manutencao', grupo: 'Planejamento de Inspeções Prediais',
    criterio: 'Elaborar Cronograma de Inspeções Prediais com fichas de vistoria',
    documento: 'Cronograma de inspeções; Ficha de Inspeção',
    pesoMax: 9.375 },
  { id: '4.1.2', eixoId: 'manutencao', grupo: 'Planejamento de Inspeções Prediais',
    criterio: 'Realizar Inspeções Prediais conforme Cronograma com preenchimento das fichas',
    documento: 'Ficha de Inspeção preenchida',
    pesoMax: 9.375 },

  // Grupo 4.2 — Planejamento de Manutenções (total: 18.75)
  { id: '4.2.1', eixoId: 'manutencao', grupo: 'Planejamento de Manutenções',
    criterio: 'Elaborar Plano de Manutenção Preventiva e Corretiva para o ano letivo',
    documento: 'Plano de manutenção preventiva e corretiva',
    pesoMax: 9.375 },
  { id: '4.2.2', eixoId: 'manutencao', grupo: 'Planejamento de Manutenções',
    criterio: 'Realizar Levantamento de Demandas de Manutenção com priorização',
    documento: 'Relatório de Demanda; Checklist de intervenções priorizadas',
    pesoMax: 9.375 },

  // Grupo 4.3 — Execução de Manutenções (total: 18.75)
  { id: '4.3.1', eixoId: 'manutencao', grupo: 'Execução de Manutenções',
    criterio: 'Executar Manutenções Corretivas com registro fotográfico e justificativa de pendências',
    documento: 'Relatório de verificação com registro fotográfico; Relatório de justificativa de pendências',
    pesoMax: 9.375 },
  { id: '4.3.2', eixoId: 'manutencao', grupo: 'Execução de Manutenções',
    criterio: 'Acompanhar e registrar Levantamento de Demandas com atrasos e pendências',
    documento: 'Relatório de Demanda; Checklist de intervenções',
    pesoMax: 9.375 },

  // Grupo 4.4 — Resultado e Prestação de Contas (total: 18.75)
  { id: '4.4.1', eixoId: 'manutencao', grupo: 'Resultado e Prestação de Contas de Manutenção',
    criterio: 'Consolidar Relatório Anual de Manutenções Realizadas vs Planejadas',
    documento: 'Relatório anual de manutenções realizadas e pendentes',
    pesoMax: 9.375 },
  { id: '4.4.2', eixoId: 'manutencao', grupo: 'Resultado e Prestação de Contas de Manutenção',
    criterio: 'Apresentar Prestação de Contas de Manutenção ao Conselho Escolar',
    documento: 'Ata de reunião CDE com balanço de manutenções e recursos aplicados',
    pesoMax: 9.375 },

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 5 — Gestão Escolar e Pedagógica (total processos: 110)
  // ═══════════════════════════════════════════════════════════════════════

  // Grupo 5.1 — Planejamento Institucional (total: 25)
  { id: '5.1.1', eixoId: 'gestao', grupo: 'Planejamento Institucional',
    criterio: 'Elaborar e/ou Atualizar o Plano de Gestão Escolar para o ano letivo',
    documento: 'Plano de Gestão',
    pesoMax: 4.17 },
  { id: '5.1.2', eixoId: 'gestao', grupo: 'Planejamento Institucional',
    criterio: 'Revisar e/ou Atualizar o Projeto Político Pedagógico (PPP) com participação da comunidade',
    documento: 'Projeto Político Pedagógico (PPP)',
    pesoMax: 4.17 },
  { id: '5.1.3', eixoId: 'gestao', grupo: 'Planejamento Institucional',
    criterio: 'Elaborar Plano Financeiro contemplando PDDE e recursos estaduais',
    documento: 'Plano Financeiro (PDDE)',
    pesoMax: 4.17 },
  { id: '5.1.4', eixoId: 'gestao', grupo: 'Planejamento Institucional',
    criterio: 'Elaborar e/ou Atualizar o Regimento Interno Escolar',
    documento: 'Regimento Interno',
    pesoMax: 4.17 },
  { id: '5.1.5', eixoId: 'gestao', grupo: 'Planejamento Institucional',
    criterio: 'Constituir o Conselho Deliberativo da Comunidade Escolar (CDE) com ata em cartório',
    documento: 'Ata registrada no cartório',
    pesoMax: 4.17 },
  { id: '5.1.6', eixoId: 'gestao', grupo: 'Planejamento Institucional',
    criterio: 'Implementar Ato Autorizativo da Unidade Escolar junto à SEDUC-MT',
    documento: 'Protocolo do ato autorizativo',
    pesoMax: 4.17 },

  // Grupo 5.2 — Execução Pedagógica (total: 25)
  { id: '5.2.1', eixoId: 'gestao', grupo: 'Execução Pedagógica e Busca Ativa',
    criterio: 'Operacionalizar Ficha de Comunicação de Aluno Infrequente (Busca Ativa)',
    documento: 'Documento de designação do servidor; Registro das ações da busca ativa',
    pesoMax: 5.0 },
  { id: '5.2.2', eixoId: 'gestao', grupo: 'Execução Pedagógica e Busca Ativa',
    criterio: 'Garantir Recomposição da Aprendizagem dos alunos retornados via Busca Ativa',
    documento: 'Plano de recomposição da aprendizagem',
    pesoMax: 5.0 },
  { id: '5.2.3', eixoId: 'gestao', grupo: 'Execução Pedagógica e Busca Ativa',
    criterio: 'Identificar Salas e Turmas no sistema da equipe gestora',
    documento: 'Salas e turmas identificadas',
    pesoMax: 5.0 },
  { id: '5.2.4', eixoId: 'gestao', grupo: 'Execução Pedagógica e Busca Ativa',
    criterio: 'Realizar Dependências de alunos com Progressão Parcial de anos anteriores',
    documento: 'Resultado da avaliação da progressão',
    pesoMax: 5.0 },
  { id: '5.2.5', eixoId: 'gestao', grupo: 'Execução Pedagógica e Busca Ativa',
    criterio: 'Implementar Calendários de Avaliações Externas (SAEB) com resultados publicados',
    documento: 'Resultados no SAEB publicados',
    pesoMax: 5.0 },

  // Grupo 5.3 — Gestão Financeira e Recursos (total: 30)
  { id: '5.3.1', eixoId: 'gestao', grupo: 'Gestão Financeira e Recursos',
    criterio: 'Executar e prestar contas da Alimentação Escolar regularmente',
    documento: 'Prestação de contas da alimentação; Balancete',
    pesoMax: 5.0 },
  { id: '5.3.2', eixoId: 'gestao', grupo: 'Gestão Financeira e Recursos',
    criterio: 'Executar Recurso Único (RU) em conformidade com plano de aplicação',
    documento: 'Plano de aplicação do RU; Prestação de contas',
    pesoMax: 5.0 },
  { id: '5.3.3', eixoId: 'gestao', grupo: 'Gestão Financeira e Recursos',
    criterio: 'Executar PDDE Estrutura (módulos: Água, Esgoto, Sanitário, Sala de Recursos)',
    documento: 'Relatório de execução do PDDE Estrutura; Comprovantes',
    pesoMax: 5.0 },
  { id: '5.3.4', eixoId: 'gestao', grupo: 'Gestão Financeira e Recursos',
    criterio: 'Executar PDDE Qualidade (Itinerários, Inovação, Educação Integral)',
    documento: 'Relatório de execução do PDDE Qualidade',
    pesoMax: 5.0 },
  { id: '5.3.5', eixoId: 'gestao', grupo: 'Gestão Financeira e Recursos',
    criterio: 'Executar PDDE Básico com regularidade na execução e saldo conciliado',
    documento: 'Extrato bancário conciliado; Relatório de execução do PDDE Básico',
    pesoMax: 5.0 },
  { id: '5.3.6', eixoId: 'gestao', grupo: 'Gestão Financeira e Recursos',
    criterio: 'Manter transparência de gastos e recursos no Portal da Transparência',
    documento: 'Comprovante de publicação no Portal da Transparência',
    pesoMax: 5.0 },

  // Grupo 5.4 — Avaliação e Resultados Pedagógicos (total: 30)
  { id: '5.4.1', eixoId: 'gestao', grupo: 'Avaliação e Resultados Pedagógicos',
    criterio: 'Monitorar Desempenho geral nas avaliações do Avalia MT',
    documento: 'Relatório de resultados do Avalia MT por turma e escola',
    pesoMax: 6.0 },
  { id: '5.4.2', eixoId: 'gestao', grupo: 'Avaliação e Resultados Pedagógicos',
    criterio: 'Garantir taxa de participação acima de 85% no Avalia MT',
    documento: 'Comprovante de participação no Avalia MT ≥ 85%',
    pesoMax: 6.0 },
  { id: '5.4.3', eixoId: 'gestao', grupo: 'Avaliação e Resultados Pedagógicos',
    criterio: 'Implementar ações de melhoria com base nos resultados do SAEB/IDEB',
    documento: 'Plano de ação pedagógico baseado no SAEB/IDEB',
    pesoMax: 6.0 },
  { id: '5.4.4', eixoId: 'gestao', grupo: 'Avaliação e Resultados Pedagógicos',
    criterio: 'Reduzir índices de Evasão e Abandono escolar ano a ano',
    documento: 'Comparativo estatístico anual de evasão/abandono',
    pesoMax: 6.0 },
  { id: '5.4.5', eixoId: 'gestao', grupo: 'Avaliação e Resultados Pedagógicos',
    criterio: 'Elaborar e executar Plano de Recuperação Paralela para alunos com dificuldades',
    documento: 'Plano de recuperação paralela; Listas de alunos atendidos',
    pesoMax: 6.0 },
];
