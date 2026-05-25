import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mapa de hostnames de produção para tenants
const hostToTenant: Record<string, string> = {
  'eecmheliodoro.vercel.app': 'eecmheliodoro',
  'eecmprofjoaobatista.vercel.app': 'eecmprofjoaobatista',
  'eecmheliodoro.kallyteros.com.br': 'eecmheliodoro',
  'eecmprofjoaobatista.kallyteros.com.br': 'eecmprofjoaobatista',
};

export function middleware(request: NextRequest) {
  const rawHost = request.headers.get('host') ?? '';
  const host = rawHost.split(':')[0].toLowerCase().replace(/^www\./, '');
  const pathname = request.nextUrl.pathname;

  // ─── 1. LÓGICA DRE (mantida intacta) ───────────────────────────
  const isDreDomain =
    host.startsWith('dre.') ||
    host === 'dretga.kallyteros.com.br' ||
    host === 'www.dretga.kallyteros.com.br';

  if (isDreDomain) {
    if (pathname === '/dre-login' || pathname.startsWith('/dre')) {
      return NextResponse.next();
    }
    const hasSession =
      request.cookies.has('sb-access-token') ||
      request.cookies.has('sb-refresh-token') ||
      request.cookies.has('eecm_session');

    if (pathname === '/login' || (pathname === '/' && !hasSession)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dre-login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ─── 2. IDENTIFICAÇÃO DO TENANT ────────────────────────────────

  // Prioridade 1: variável de ambiente (desenvolvimento local)
  let tenant = process.env.NEXT_PUBLIC_TENANT ?? '';

  // Prioridade 2: mapa de hostnames conhecidos (produção)
  if (!tenant && hostToTenant[host]) {
    tenant = hostToTenant[host];
  }

  // Prioridade 3: subdomínio de *.kallyteros.com.br (futuro)
  if (!tenant && host.endsWith('.kallyteros.com.br')) {
    tenant = host.replace('.kallyteros.com.br', '');
  }

  // ─── 3. INJETA O TENANT NOS HEADERS ────────────────────────────
  if (tenant) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant', tenant);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
