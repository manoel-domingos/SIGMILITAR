import React from 'react';
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
 * Regras de detecção por substring do hostname.
 * Ordem importa: mais específico primeiro.
 */
const TENANT_HOSTNAME_RULES: Array<{ contains: string; tenant: string }> = [
  { contains: 'heliodoro', tenant: 'heliodoro' },
  { contains: 'tangara',   tenant: 'tangara' },
  // joaobatista é o fallback — não precisa de regra
];

/**
 * Função pura (sem hook) — pode ser chamada em qualquer contexto, inclusive store.
 * Detecção em dois passos:
 *   1. Match exato pelo TENANT_MAP (hosts conhecidos)
 *   2. Substring no hostname para cobrir previews e domínios customizados
 * Fallback: 'joaobatista'
 */
export function getTenantIdFromHost(): string {
  if (typeof window === 'undefined') return 'joaobatista';
  const host = window.location.host.toLowerCase();

  // Passo 1: match exato
  if (TENANT_MAP[host]) return TENANT_MAP[host];

  // Passo 2: substring (cobre eecmheliodoro-abc123.vercel.app, domínios customizados, etc.)
  for (const rule of TENANT_HOSTNAME_RULES) {
    if (host.includes(rule.contains)) return rule.tenant;
  }

  return 'joaobatista';
}

// João Batista usa .png, os demais .svg
const LOGO_EXT: Record<string, string> = {
  joaobatista: 'png',
  heliodoro: 'svg',
  tangara: 'svg',
};

const SCHOOL_NAMES: Record<string, string> = {
  joaobatista: 'EECM Prof. João Batista',
  heliodoro: 'EECM Heliodoro Capistrano',
  tangara: 'EECM Tangará',
};

const FUNDAMENTAL_GRADES = ['6º Ano', '7º Ano', '8º Ano', '9º Ano'];

export function useTenantConfig() {
  // Inicializa com 'joaobatista' no SSR para evitar hydration mismatch (React error #418).
  // O useEffect corrige para o valor real no cliente após a montagem.
  const [tenantId, setTenantId] = React.useState<string>('joaobatista');

  React.useEffect(() => {
    setTenantId(getTenantIdFromHost());
  }, []);

  const ext = LOGO_EXT[tenantId] || 'png';

  const config = getSchoolConfig(tenantId);

  const allGrades = [...FUNDAMENTAL_GRADES, ...config.grades, ...(config.specialYears ?? [])];
  const allClassNames = getAllClassNames(tenantId);

  return {
    tenantId,
    schoolName: SCHOOL_NAMES[tenantId] ?? SCHOOL_NAMES['joaobatista'],
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
