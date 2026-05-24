export interface TenantConfig {
  id: string;
  name: string;
  subtitle: string;
  logoLogin: string;
  logoDash: string;
  primaryColor: string;
}

export const TENANTS: Record<string, TenantConfig> = {
  joaobatista: {
    id: 'joaobatista',
    name: 'EECM PROF. JOÃO BATISTA',
    subtitle: 'Disciplina e Monitoramento Escolar',
    logoLogin: '/logo_login.svg',
    logoDash: '/logo_dash.svg',
    primaryColor: '#2563eb', // blue-600
  },
  heliodoro: {
    id: 'heliodoro',
    name: 'EECM HELIODORO CAPISTRANO',
    subtitle: 'Disciplina e Monitoramento Escolar',
    logoLogin: '/nova_logo.svg', // Assumindo que a Heliodoro usa a nova logo
    logoDash: '/nova_logo.svg',
    primaryColor: '#2563eb',
  }
};

export function getTenantByHost(host: string): TenantConfig {
  const normalizedHost = host.toLowerCase();
  
  if (normalizedHost.includes('heliodoro')) {
    return TENANTS.heliodoro;
  }
  
  // Default para João Batista
  return TENANTS.joaobatista;
}
