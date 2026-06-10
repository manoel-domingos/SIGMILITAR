// lib/meg/forms.ts
// Mapeamento critério → tipo de formulário digital disponível
// Chaveado pelos novos IDs de critério (código PDF)

export const EVIDENCIA_FORM_MAP: Record<string, { tipo: string; label: string }> = {
  // Eixo 1 — Patrimônio
  '1.2.1': { tipo: 'inventario_bens_moveis',   label: 'Protocolo de Inventário de Bens Móveis' },
  '1.2.2': { tipo: 'ficha_cadastral_imovel',    label: 'Ficha de Levantamento Cadastral Imobiliário' },
  '1.4.1': { tipo: 'cronograma_patrimonial',    label: 'Cronograma Patrimonial' },

  // Eixo 2 — Alimentação
  '2.2.3': { tipo: 'lancamento_nota_fiscal',    label: 'Inserção de NF no SIGEDUCA/GPO' },
  '2.3.2': { tipo: 'pesquisa_satisfacao_alim',  label: 'Pesquisa de Satisfação da Alimentação' },
  '2.4.1': { tipo: 'relatorio_ean',             label: 'Relatório de Ações de Educação Alimentar (EAN)' },

  // Eixo 3 — Limpeza
  '3.1.1': { tipo: 'cronograma_verif_limpeza',  label: 'Cronograma de Verificação de Limpeza' },
  '3.2.2': { tipo: 'registro_ocorrencia_limpeza', label: 'Registro de Ocorrências de Limpeza' },
  '3.4.1': { tipo: 'pesquisa_percepcao_limpeza', label: 'Pesquisa de Percepção de Limpeza' },
  '3.3.1': { tipo: 'controle_recursos_limpeza', label: 'Controle de Recursos de Limpeza' },

  // Eixo 4 — Manutenção
  '4.1.1': { tipo: 'cronograma_inspecoes',      label: 'Cronograma de Inspeções Prediais' },
  '4.3.1': { tipo: 'relatorio_manutencao',      label: 'Relatório de Verificação com Registro Fotográfico' },
  '4.3.2': { tipo: 'checklist_intervencoes',    label: 'Checklist de Intervenções' },

  // Eixo 5 — Gestão
  '5.1.3': { tipo: 'plano_financeiro_pdde',     label: 'Plano Financeiro (PDDE)' },
  '5.2.1': { tipo: 'ficha_busca_ativa',         label: 'Ficha de Comunicação de Aluno Infrequente' },
  '5.3.1': { tipo: 'gestao_financeira',         label: 'Gestão Financeira — Alimentação' },
  '5.3.2': { tipo: 'gestao_financeira',         label: 'Gestão Financeira — Recurso Único (RU)' },
  '5.4.1': { tipo: 'indicadores_busca_ativa',   label: 'Indicadores de Desempenho Avalia MT' },
};
