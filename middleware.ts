import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Remove porta do host para comparação (ex: "dretga.vercel.app:443" → "dretga.vercel.app")
  const rawHost = request.headers.get('host') ?? '';
  const host = rawHost.split(':')[0].toLowerCase();
  const pathname = request.nextUrl.pathname;

  // Detecta domínio DRE: subdomínio dre.* ou domínio dedicado dretga.vercel.app
  const isDreDomain =
    host.startsWith('dre.') ||
    host === 'dretga.vercel.app' ||
    host === 'www.dretga.vercel.app' ||
    host.includes('dre-'); // Para suportar previews da Vercel que contenham 'dre-'

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
