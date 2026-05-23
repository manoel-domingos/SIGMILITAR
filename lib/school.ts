/**
 * Identidade da escola — lida via variáveis de ambiente.
 *
 * Para a escola João Batista (original): sem NEXT_PUBLIC_SCHOOL_ID = comportamento padrão.
 * Para escolas independentes (ex: Heliodoro): definir NEXT_PUBLIC_SCHOOL_ID=heliodoro
 *   e NEXT_PUBLIC_SCHOOL_NAME="EECM Heliodoro" no projeto Vercel.
 */

export const SCHOOL_ID: string | null =
  process.env.NEXT_PUBLIC_SCHOOL_ID ?? null;

export const SCHOOL_NAME: string =
  process.env.NEXT_PUBLIC_SCHOOL_NAME ?? 'EECM Prof. João Batista';

export const SCHOOL_SUBTITLE: string =
  process.env.NEXT_PUBLIC_SCHOOL_SUBTITLE ?? 'Disciplina e Monitoramento Escolar';

/** Retorna true quando o deploy é de uma escola individual (não DRE central). */
export const IS_STANDALONE_SCHOOL: boolean = !!SCHOOL_ID;
