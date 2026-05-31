// lib/tenant-registry.ts
// STUB — futuramente buscar do banco master em runtime

export function getTenantFromHost(host: string): string | null {
  const staticMap: Record<string, string> = {
    'heliodoro.sigmilitar.com.br': 'eecmheliodoro',
    'joaobatista.sigmilitar.com.br': 'eecmprofjoaobatista',
    'tangara.sigmilitar.com.br': 'eecmtangara',
  };
  return staticMap[host] ?? null;
}
