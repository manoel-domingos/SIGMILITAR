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
  'eecmprofjoaobatista.vercel.app': 'eecmprofjoaobatista',
  'www.eecmprofjoaobatista.vercel.app': 'eecmprofjoaobatista',
  'joaobatista.vercel.app': 'eecmprofjoaobatista',
  'localhost': 'eecmprofjoaobatista',
  'localhost:3000': 'eecmprofjoaobatista',

  // Heliodoro Capistrano
  'eecmheliodoro.vercel.app': 'eecmheliodoro',
  'www.eecmheliodoro.vercel.app': 'eecmheliodoro',
  'heliodoro.vercel.app': 'eecmheliodoro',
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
 * Função pura (sem hook) — pode ser chamada em qualquer contexto, inclusive store.
 * Detecção em dois passos:
 *   1. Match exato pelo TENANT_MAP (hosts conhecidos)
 *   2. Substring no hostname para cobrir previews e domínios customizados
 * Fallback: 'eecmprofjoaobatista'
 */
export function getTenantIdFromHost(): string {
  if (typeof window === 'undefined') return 'eecmprofjoaobatista';
  const host = window.location.host.toLowerCase();

  // Passo 1: match exato
  if (TENANT_MAP[host]) return TENANT_MAP[host];

  // Passo 2: substring (cobre eecmheliodoro-abc123.vercel.app, domínios customizados, etc.)
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
  return tenantId;
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

  return {
    tenantId,
    schoolName: SCHOOL_NAMES[tenantId] ?? SCHOOL_NAMES['eecmprofjoaobatista'],
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
