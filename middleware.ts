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
    host === 'www.dretga.vercel.app';

  if (isDreDomain) {
    // Já está no login DRE — deixa passar
    if (pathname === '/dre-login') {
      return NextResponse.next();
    }
    // Raiz "/" ou "/login" → redireciona para /dre-login
    if (pathname === '/' || pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/dre-login';
      return NextResponse.redirect(url);
    }
    // /dre e qualquer rota autenticada — passa normalmente
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
