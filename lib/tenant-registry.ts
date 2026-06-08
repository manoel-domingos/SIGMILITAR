// lib/tenant-registry.ts
// STUB — futuramente buscar do banco master em runtime

const STATIC_HOST_TENANTS: Record<string, string> = {
  'heliodoro.sigmilitar.com.br': 'eecmheliodoro',
  'joaobatista.sigmilitar.com.br': 'eecmprofjoaobatista',
  'tangara.sigmilitar.com.br': 'eecmtangara',
};

const RESERVED_PATH_SEGMENTS = new Set([
  'api',
  'dre',
  'dre-login',
  'dretga',
  'login',
]);

export function getTenantFromPath(pathname: string): string | null {
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();

  if (!firstSegment || RESERVED_PATH_SEGMENTS.has(firstSegment)) return null;
  if (!/^[a-z0-9]+$/.test(firstSegment)) return null;

  return firstSegment;
}

export function getTenantFromHost(host: string, pathname = ''): string | null {
  const pathTenant = getTenantFromPath(pathname);
  if (pathTenant) return pathTenant;

  const normalizedHost = host.split(':')[0].toLowerCase().replace(/^www\./, '');
  return STATIC_HOST_TENANTS[normalizedHost] ?? null;
}
