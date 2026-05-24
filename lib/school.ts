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
