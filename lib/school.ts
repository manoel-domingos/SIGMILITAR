/**
 * Identidade da escola — lida via variáveis de ambiente.
 *
 * Cada deploy independente define:
 *   NEXT_PUBLIC_SCHOOL_ID    → ex: "joaobatista" | "heliodoro" | "tangara"
 *   NEXT_PUBLIC_SCHOOL_NAME  → ex: "EECM Prof. João Batista"
 *   NEXT_PUBLIC_SCHOOL_SUBTITLE → (opcional)
 *
 * Logos ficam em public/schools/<SCHOOL_ID>/:
 *   nova_logo.svg  — sidebar/menu
 *   logo_dash.svg  — header do dashboard
 *   logo_login.svg — tela de login (card + fundo)
 */

export const SCHOOL_ID: string =
  process.env.NEXT_PUBLIC_SCHOOL_ID ?? 'joaobatista';

export const SCHOOL_NAME: string =
  process.env.NEXT_PUBLIC_SCHOOL_NAME ?? 'EECM Prof. João Batista';

export const SCHOOL_SUBTITLE: string =
  process.env.NEXT_PUBLIC_SCHOOL_SUBTITLE ?? 'Disciplina e Monitoramento Escolar';

/** Retorna true quando o deploy é de uma escola individual (não DRE central). */
export const IS_STANDALONE_SCHOOL: boolean = SCHOOL_ID !== 'DRE';

/** Caminhos das logos para o tenant ativo */
export const SCHOOL_LOGO_SIDEBAR  = `/schools/${SCHOOL_ID}/nova_logo.svg`;
export const SCHOOL_LOGO_DASH     = `/schools/${SCHOOL_ID}/logo_dash.svg`;
export const SCHOOL_LOGO_LOGIN    = `/schools/${SCHOOL_ID}/logo_login.svg`;

// ─── Configuração de anos e turmas por tenant ────────────────────────────────

export interface SchoolConfig {
  /** Anos disponíveis, ex: ["1º Ano", "2º Ano", "3º Ano"] */
  grades: string[];
  /** Letras de turma disponíveis, ex: ["A", "B", "C"] */
  classLetters: string[];
  /** Anos adicionais/especiais que aparecem somente nesta escola */
  specialYears?: string[];
}

const TENANT_CONFIGS: Record<string, SchoolConfig> = {
  joaobatista: {
    grades: ['1º Ano', '2º Ano', '3º Ano'],
    classLetters: ['A', 'B', 'C', 'D'],
  },
  heliodoro: {
    grades: ['1º Ano', '2º Ano', '3º Ano'],
    classLetters: ['A', 'B', 'C'],
    specialYears: ['PRA'],
  },
  tangara: {
    grades: ['1º Ano', '2º Ano', '3º Ano'],
    classLetters: ['A', 'B', 'C'],
  },
};

const FUNDAMENTAL_GRADES = ['6º Ano', '7º Ano', '8º Ano', '9º Ano'];

/** Retorna a configuração de anos/turmas para o tenant informado */
export function getSchoolConfig(tenantId?: string): SchoolConfig {
  const id = tenantId ?? SCHOOL_ID;
  return TENANT_CONFIGS[id] ?? TENANT_CONFIGS['joaobatista'];
}

/**
 * Retorna todos os nomes de turma possíveis para o tenant informado.
 * Ex: ["1º Ano A", "1º Ano B", ..., "PRA A", "PRA B"]
 */
export function getAllClassNames(tenantId?: string): string[] {
  const config = getSchoolConfig(tenantId);
  const allGrades = [...FUNDAMENTAL_GRADES, ...config.grades, ...(config.specialYears ?? [])];
  const names: string[] = [];
  for (const grade of allGrades) {
    for (const letter of config.classLetters) {
      names.push(`${grade} ${letter}`);
    }
  }
  return names;
}
