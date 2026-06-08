'use client';

import React from 'react';
import { getSchoolConfig, getAllClassNames } from './school';

// Contexto para prover o tenantId obtido no servidor
export const TenantContext = React.createContext<string | null>(null);

export function TenantProvider({ tenantId, children }: { tenantId: string; children: React.ReactNode }) {
  return React.createElement(TenantContext.Provider, { value: tenantId }, children);
}

/**
 * Mapeamento de hostname → tenant ID.
 * Usado tanto no hook (client) quanto no store (runtime).
 */
export const TENANT_MAP: Record<string, string> = {
  // João Batista
  'joaobatista.sigmilitar.com.br': 'eecmprofjoaobatista',
  'www.joaobatista.sigmilitar.com.br': 'eecmprofjoaobatista',
  'localhost': 'eecmprofjoaobatista',
  'localhost:3000': 'eecmprofjoaobatista',

  // Heliodoro Capistrano
  'heliodoro.sigmilitar.com.br': 'eecmheliodoro',
  'www.heliodoro.sigmilitar.com.br': 'eecmheliodoro',

  // Tangará
  'tangara.sigmilitar.com.br': 'eecmtangara',
  'www.tangara.sigmilitar.com.br': 'eecmtangara',

  // Central Domain
  'sigmilitar.com.br': 'central',
  'www.sigmilitar.com.br': 'central',
};

/**
 * Regras de detecção por substring do hostname.
 * Ordem importa: mais específico primeiro.
 */
const TENANT_HOSTNAME_RULES: Array<{ contains: string; tenant: string }> = [
  { contains: 'heliodoro', tenant: 'eecmheliodoro' },
  { contains: 'joaobatista', tenant: 'eecmprofjoaobatista' },
];

/**
 * Extrai o tenant ID a partir do primeiro segmento do path da URL,
 * caso seja um slug válido de escola.
 */
export function getTenantIdFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    const firstSegment = segments[0].toLowerCase();
    if (/^eecm[a-z0-9]+$/.test(firstSegment)) {
      return firstSegment;
    }
  }
  return null;
}

/**
 * Retorna o link ajustado com o tenant/escola prefixado caso esteja em modo slug.
 */
export function getLinkHref(href: string, tenantId: string, rawPathname: string | null): string {
  if (!href || href.startsWith('http') || href.startsWith('//')) return href;
  const segments = (rawPathname || '').split('/').filter(Boolean);
  const isSlugMode = segments.length > 0 && /^eecm[a-z0-9]+$/.test(segments[0].toLowerCase());
  
  if (isSlugMode && tenantId) {
    const cleanHref = href.startsWith('/') ? href : `/${href}`;
    if (
      cleanHref.startsWith('/dre') ||
      cleanHref.startsWith('/api') ||
      cleanHref.startsWith('/login')
    ) {
      return cleanHref;
    }
    if (cleanHref.startsWith(`/${tenantId}/`) || cleanHref === `/${tenantId}`) {
      return cleanHref;
    }
    return `/${tenantId}${cleanHref}`;
  }
  return href;
}


/**
 * Função pura (sem hook) — pode ser chamada em qualquer contexto, inclusive store.
 * Detecção em dois passos:
 *   1. Extrai o tenant a partir do path (caso esteja no domínio central ou com slug)
 *   2. Match exato pelo TENANT_MAP (hosts conhecidos)
 *   3. Substring no hostname para cobrir previews e domínios customizados
 * Fallback: 'eecmprofjoaobatista'
 */
export function getTenantIdFromHost(): string {
  if (typeof window === 'undefined') return 'eecmprofjoaobatista';

  // Passo 1: Tenta extrair a partir do path (prioridade para domínio central com slug)
  const pathTenant = getTenantIdFromPath();
  if (pathTenant) return pathTenant;

  const host = window.location.host.toLowerCase();

  // Passo 2: match exato pelo Hostname
  if (TENANT_MAP[host]) {
    // Se o match for 'central', podemos tentar usar um fallback padrão ou deixar central
    if (TENANT_MAP[host] === 'central') return 'eecmprofjoaobatista';
    return TENANT_MAP[host];
  }

  // Passo 3: substring (cobre eecmheliodoro-abc123.vercel.app, domínios customizados, etc.)
  for (const rule of TENANT_HOSTNAME_RULES) {
    if (host.includes(rule.contains)) return rule.tenant;
  }

  return 'eecmprofjoaobatista';
}

/**
 * Mapeia o tenant ID para o identificador usado nas colunas school_id no banco de dados.
 * Evita a necessidade de migrar todas as linhas existentes do Supabase.
 */
export function getDbSchoolId(tenantId: string): string {
  if (tenantId === 'eecmprofjoaobatista') return 'joaobatista';
  if (tenantId === 'eecmheliodoro') return 'heliodoro';
  if (tenantId === 'eecmtangara') return 'tangara';
  if (tenantId.startsWith('eecm')) return tenantId.slice(4);
  return tenantId;
}

export function getTenantSlugFromSchoolId(schoolId: string): string {
  if (schoolId === 'joaobatista') return 'eecmprofjoaobatista';
  if (schoolId === 'heliodoro') return 'eecmheliodoro';
  if (schoolId === 'tangara') return 'eecmtangara';
  if (!schoolId) return '';
  return schoolId.startsWith('eecm') ? schoolId : `eecm${schoolId}`;
}

// João Batista usa .png, os demais .svg
const LOGO_EXT: Record<string, string> = {
  joaobatista: 'png',
  eecmprofjoaobatista: 'png',
  heliodoro: 'svg',
  eecmheliodoro: 'svg',
  tangara: 'svg',
};

const SCHOOL_NAMES: Record<string, string> = {
  joaobatista: 'EECM Prof. João Batista',
  eecmprofjoaobatista: 'EECM Prof. João Batista',
  heliodoro: 'EECM Heliodoro Capistrano',
  eecmheliodoro: 'EECM Heliodoro Capistrano',
  tangara: 'EECM Tangará',
};

const FUNDAMENTAL_GRADES = ['6º Ano', '7º Ano', '8º Ano', '9º Ano'];

export function useTenantConfig() {
  const contextTenantId = React.useContext(TenantContext);
  
  // Inicializa com o valor do contexto (ou fallback do SSR) e depois sincroniza
  const [tenantId, setTenantId] = React.useState<string>(contextTenantId ?? 'eecmprofjoaobatista');

  React.useEffect(() => {
    if (contextTenantId) {
      setTenantId(contextTenantId);
    } else {
      setTenantId(getTenantIdFromHost());
    }
  }, [contextTenantId]);

  const ext = LOGO_EXT[tenantId] || 'png';
  const config = getSchoolConfig(tenantId);
  const allGrades = [...FUNDAMENTAL_GRADES, ...config.grades, ...(config.specialYears ?? [])];
  const allClassNames = getAllClassNames(tenantId);
  
  const dbSchoolId = getDbSchoolId(tenantId);

  return {
    tenantId,
    schoolName: SCHOOL_NAMES[tenantId] ?? SCHOOL_NAMES['eecmprofjoaobatista'],
    logoSidebar: `/schools/${dbSchoolId}/nova_logo.${ext}`,
    logoDash: `/schools/${dbSchoolId}/logo_dash.svg`,
    logoLogin: `/schools/${dbSchoolId}/logo_login.svg`,
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
