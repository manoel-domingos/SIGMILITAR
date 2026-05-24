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

  // Extensões de arquivo por tenant (João Batista usa .png, outros usam .svg)
  const logoExtensions: Record<string, string> = {
    'joaobatista': 'png',
    'heliodoro': 'svg',
    'tangara': 'svg',
  };

  // Detecta o host atual
  const host = typeof window !== 'undefined' ? window.location.host : '';
  
  // Debug
  if (typeof window !== 'undefined') {
    console.log("[v0] useTenantConfig - host:", host);
    console.log("[v0] useTenantConfig - tenantMap keys:", Object.keys(tenantMap));
  }
  
  // Resolve o tenant ID: usa o mapa ou fallback para João Batista
  const tenantId = tenantMap[host] || 'joaobatista';
  const ext = logoExtensions[tenantId] || 'png';
  
  console.log("[v0] useTenantConfig - detected tenantId:", tenantId, "ext:", ext);

  return {
    tenantId,
    logoSidebar: `/schools/${tenantId}/nova_logo.${ext}`,
    logoDash: `/schools/${tenantId}/logo_dash.svg`,
    logoLogin: `/schools/${tenantId}/logo_login.svg`,
  };
}
