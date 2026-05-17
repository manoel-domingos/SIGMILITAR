import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;

  // Detecta domínio DRE: subdomínio dre.* ou domínio dedicado dretga.vercel.app
  const isDreDomain = host.startsWith('dre.') || host === 'dretga.vercel.app';

  if (isDreDomain) {
    // Raiz "/" → login DRE
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/dre-login', request.url));
    }
    // /login → login DRE
    if (pathname === '/login') {
      return NextResponse.rewrite(new URL('/dre-login', request.url));
    }
    // /dre e /dre-login passam normalmente
    // Qualquer outra rota também passa (usuário já autenticado)
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
