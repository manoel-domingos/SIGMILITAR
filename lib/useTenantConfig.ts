import { getSchoolConfig, getAllClassNames } from './school';

/**
 * Mapeamento de hostname → tenant ID.
 * Usado tanto no hook (client) quanto no store (runtime).
 */
export const TENANT_MAP: Record<string, string> = {
  // João Batista
  'joaobatista.vercel.app': 'joaobatista',
  'www.joaobatista.vercel.app': 'joaobatista',
  'localhost': 'joaobatista',
  'localhost:3000': 'joaobatista',

  // Heliodoro Capistrano
  'eecmheliodoro.vercel.app': 'heliodoro',
  'www.eecmheliodoro.vercel.app': 'heliodoro',
  'heliodoro.vercel.app': 'heliodoro',

  // Tangará
  'eecmtangara.vercel.app': 'tangara',
  'www.eecmtangara.vercel.app': 'tangara',
  'tangara.vercel.app': 'tangara',
};

/**
 * Função pura (sem hook) — pode ser chamada em qualquer contexto, inclusive store.
 * Retorna o tenant ID detectado pelo hostname atual ou fallback para 'joaobatista'.
 */
export function getTenantIdFromHost(): string {
  if (typeof window === 'undefined') return 'joaobatista';
  return TENANT_MAP[window.location.host] || 'joaobatista';
}

// João Batista usa .png, os demais .svg
const LOGO_EXT: Record<string, string> = {
  joaobatista: 'png',
  heliodoro: 'svg',
  tangara: 'svg',
};

const FUNDAMENTAL_GRADES = ['6º Ano', '7º Ano', '8º Ano', '9º Ano'];

export function useTenantConfig() {
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const tenantId = TENANT_MAP[host] || 'joaobatista';
  const ext = LOGO_EXT[tenantId] || 'png';

  const config = getSchoolConfig(tenantId);

  const allGrades = [...FUNDAMENTAL_GRADES, ...config.grades, ...(config.specialYears ?? [])];
  const allClassNames = getAllClassNames(tenantId);

  return {
    tenantId,
    logoSidebar: `/schools/${tenantId}/nova_logo.${ext}`,
    logoDash: `/schools/${tenantId}/logo_dash.svg`,
    logoLogin: `/schools/${tenantId}/logo_login.svg`,
    /** Anos disponíveis no tenant (inclui fundamental + médio + especiais) */
    grades: allGrades,
    /** Apenas anos do ensino médio + especiais (sem fundamental) */
    seniorGrades: [...config.grades, ...(config.specialYears ?? [])],
    /** Letras de turma disponíveis (simples, ex: A B C) */
    classLetters: config.classLetters,
    /** Todos os nomes de turma completos ex: "1º Ano A" ou "1º Ano A-LING" */
    allClassNames,
    /** Sufixos de turma por ano (ex: { "1º Ano": ["A-LING", "B-CHS"] }) — null se não definido */
    classSuffixesByGrade: config.classSuffixesByGrade ?? null,
    /** Turmas independentes (sem ano) ex: ["EPT-AUTOMAC"] */
    standaloneClasses: config.standaloneClasses ?? [],
    /** true se o tenant usa turmas compostas (sufixos) em vez de letras simples */
    hasCompoundClasses: !!config.classSuffixesByGrade,
  };
}
