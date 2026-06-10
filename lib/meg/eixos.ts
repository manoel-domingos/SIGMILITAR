// lib/meg/eixos.ts
// FRAMEWORK PURO — sem nenhuma nota/resposta de escola específica

export interface MegEixo {
  id: string;       // slug canônico
  numero: number;
  nome: string;
  slug: string;
  icone: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  maxProcessos: number;
  maxResultado: number;
}

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
    maxProcessos: 75,
    maxResultado: 110,
  },
  {
    id: 'alimentacao',
    numero: 2,
    nome: 'Alimentação Escolar',
    slug: 'alimentacao',
    icone: 'UtensilsCrossed',
    color: 'text-purple-500 dark:text-purple-400',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/20 dark:border-purple-500/30',
    maxProcessos: 75,
    maxResultado: 110,
  },
  {
    id: 'limpeza',
    numero: 3,
    nome: 'Limpeza e Organização dos Ambientes',
    slug: 'limpeza',
    icone: 'Sparkles',
    color: 'text-emerald-500 dark:text-emerald-400',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
    borderColor: 'border-emerald-500/20 dark:border-emerald-500/30',
    maxProcessos: 75,
    maxResultado: 110,
  },
  {
    id: 'manutencao',
    numero: 4,
    nome: 'Manutenção e Conservação da Infraestrutura',
    slug: 'manutencao',
    icone: 'Wrench',
    color: 'text-blue-500 dark:text-blue-400',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
    borderColor: 'border-blue-500/20 dark:border-blue-500/30',
    maxProcessos: 75,
    maxResultado: 110,
  },
  {
    id: 'gestao',
    numero: 5,
    nome: 'Gestão Escolar e Pedagógica',
    slug: 'gestao',
    icone: 'LineChart',
    color: 'text-rose-500 dark:text-rose-400',
    bgGradient: 'from-rose-500/10 to-red-500/10',
    borderColor: 'border-rose-500/20 dark:border-rose-500/30',
    maxProcessos: 100,
    maxResultado: 160,
  },
];

export const MEG_TOTAIS = {
  maxProcessos: 400,
  maxResultado: 600,
  maxTotal: 1000,
} as const;
