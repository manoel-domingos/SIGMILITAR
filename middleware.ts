import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Mapeamento de hostname completo → tenant ID.
 * Usado pelo middleware para injetar o header x-tenant nas requisições,
 * permitindo que Server Components e API routes saibam o tenant sem
 * depender de window.location.
 */
const HOST_TO_TENANT: Record<string, string> = {
  // João Batista
  'eecmprofjoaobatista.vercel.app': 'joaobatista',
  'joaobatista.vercel.app': 'joaobatista',

  // Heliodoro Capistrano
  'eecmheliodoro.vercel.app': 'heliodoro',
  'heliodoro.vercel.app': 'heliodoro',

  // Tangará
  'eecmtangara.vercel.app': 'tangara',
  'tangara.vercel.app': 'tangara',

  // Desenvolvimento local
  'localhost': 'joaobatista',
  'localhost:3000': 'joaobatista',
};

/** Regras de fallback por substring — cobre previews com hash (ex: eecmheliodoro-abc.vercel.app) */
const TENANT_SUBSTRING_RULES: Array<{ contains: string; tenant: string }> = [
  { contains: 'heliodoro', tenant: 'heliodoro' },
  { contains: 'tangara',   tenant: 'tangara' },
  { contains: 'joaobatista', tenant: 'joaobatista' },
];

function resolveTenantFromHost(host: string): string | null {
  const h = host.toLowerCase();

  // Passo 1: match exato
  if (HOST_TO_TENANT[h]) return HOST_TO_TENANT[h];

  // Passo 2: substring (cobre deploy previews com hash)
  for (const rule of TENANT_SUBSTRING_RULES) {
    if (h.includes(rule.contains)) return rule.tenant;
  }

  return null; // não reconhecido
}

export function middleware(request: NextRequest) {
  // Remove porta do host para comparação (ex: "dretga.vercel.app:443" → "dretga.vercel.app")
  const rawHost = request.headers.get('host') ?? '';
  const host = rawHost.split(':')[0].toLowerCase();
  const pathname = request.nextUrl.pathname;

  // Detecta domínio DRE: subdomínio dre.* ou domínio dedicado dretga.vercel.app
  const isDreDomain =
    host.startsWith('dre.') ||
    host === 'dretga.vercel.app' ||
    host === 'www.dretga.vercel.app';

  if (isDreDomain) {
    // Já está no login DRE ou numa rota interna — deixa passar
    if (pathname === '/dre-login' || pathname.startsWith('/dre')) {
      return NextResponse.next();
    }

    // Verifica se há sessão ativa (cookie ou header de sessão)
    const hasSession = request.cookies.has('sb-access-token') ||
      request.cookies.has('sb-refresh-token') ||
      request.cookies.has('eecm_session');

    // Só redireciona para login DRE se não houver sessão
    // Raiz "/" sem sessão → /dre-login
    // "/login" sempre → /dre-login (sem exceção)
    if (pathname === '/login' || (pathname === '/' && !hasSession)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dre-login';
      return NextResponse.redirect(url);
    }

    // "/" com sessão ativa (usuário veio do modal de escolas) — deixa passar
  }

  // Injeta x-tenant no header da requisição para uso em Server Components e API routes.
  // O cliente continua usando window.location.host via getTenantIdFromHost().
  const tenantId = resolveTenantFromHost(rawHost);
  if (tenantId) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant', tenantId);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - arquivos com extensão (png, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
