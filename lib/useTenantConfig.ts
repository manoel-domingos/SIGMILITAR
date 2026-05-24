/**
 * Hook para detectar o tenant pela URL e retornar caminhos de logo dinâmicos
 * Mapeia domínios/subdomínios para IDs de tenant
 */

export function useTenantConfig() {
  // Mapeamento de domínios para tenant IDs
  const tenantMap: Record<string, string> = {
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

  // Detecta o host atual
  const host = typeof window !== 'undefined' ? window.location.host : '';
  
  // Resolve o tenant ID: usa o mapa ou fallback para João Batista
  const tenantId = tenantMap[host] || 'joaobatista';

  return {
    tenantId,
    logoSidebar: `/schools/${tenantId}/nova_logo.svg`,
    logoDash: `/schools/${tenantId}/logo_dash.svg`,
    logoLogin: `/schools/${tenantId}/logo_login.svg`,
  };
}
