import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Mapa de hostnames de producao para tenants ───────────────────────────────
const hostToTenant: Record<string, string> = {
  'heliodoro.sigmilitar.com.br': 'eecmheliodoro',
  'joaobatista.sigmilitar.com.br': 'eecmprofjoaobatista',
  'tangara.sigmilitar.com.br': 'eecmtangara',
};

// ── Rate Limiting Store (in-memory por instancia Edge) ───────────────────────
//
// NOTA: Em producao com multiplas instancias serverless cada instancia tem
// seu proprio Map. Para protecao distribuida completa use Vercel KV ou Redis.
// Este store ainda e eficaz contra ataques concentrados numa unica instancia.
//
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitRule {
  limit: number;    // maximo de requisicoes
  windowMs: number; // janela de tempo em ms
}

// Regras por padrao de rota (mais especifico primeiro)
const RATE_LIMIT_RULES: Array<{ pattern: RegExp; rule: RateLimitRule }> = [
  // Rota de login: max 10 tentativas por minuto por IP (anti brute-force)
  { pattern: /^\/login$/, rule: { limit: 10, windowMs: 60_000 } },
  // APIs criticas (criacao de usuario, etc): max 20 por minuto
  { pattern: /^\/api\/admin\//, rule: { limit: 20, windowMs: 60_000 } },
  // Demais APIs: max 60 por minuto
  { pattern: /^\/api\//, rule: { limit: 60, windowMs: 60_000 } },
  // Geral: max 200 requisicoes por minuto
  { pattern: /.*/, rule: { limit: 200, windowMs: 60_000 } },
];

// Cleanup periodico do store (a cada ~500 chamadas)
let cleanupCounter = 0;
function periodicCleanup() {
  if (++cleanupCounter % 500 !== 0) return;
  const now = Date.now();
  for (const [key, val] of rateLimitStore.entries()) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
}

/**
 * Verifica o rate limit para uma chave (IP + rota).
 * Retorna true se a requisicao e permitida, false se deve ser bloqueada.
 */
function checkRateLimit(key: string, rule: RateLimitRule): boolean {
  periodicCleanup();
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true; // primeira requisicao na janela - permitido
  }

  if (entry.count >= rule.limit) {
    return false; // limite excedido - bloqueado
  }

  entry.count++;
  return true; // dentro do limite - permitido
}

/**
 * Encontra a regra de rate limit para o pathname dado.
 */
function getRuleForPath(pathname: string): RateLimitRule {
  for (const { pattern, rule } of RATE_LIMIT_RULES) {
    if (pattern.test(pathname)) return rule;
  }
  return { limit: 200, windowMs: 60_000 };
}

/**
 * Extrai o IP real do usuario considerando proxies e CDN (Vercel).
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

// ── Middleware Principal ─────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const rawHost = request.headers.get('host') ?? '';
  const host = rawHost.split(':')[0].toLowerCase().replace(/^www\./, '');
  const pathname = request.nextUrl.pathname;
  const ip = getClientIP(request);

  const isCentralDomain = host === 'sigmilitar.com.br' || host.endsWith('.sigmilitar.com.br') || host === 'localhost';

  // ─── 1. Rate Limiting ────────────────────────────────────────────────────
  const rule = getRuleForPath(pathname);
  const rateLimitKey = ip + ':' + pathname.split('/').slice(0, 3).join('/');

  if (!checkRateLimit(rateLimitKey, rule)) {
    return new NextResponse(
      JSON.stringify({
        error: 'Muitas requisicoes. Aguarde alguns segundos e tente novamente.',
        retryAfter: Math.ceil(rule.windowMs / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(rule.windowMs / 1000)),
          'X-RateLimit-Limit': String(rule.limit),
        },
      }
    );
  }

  // ─── 2. LOGICA DRE (mantida intacta) ────────────────────────────────────
  const isDreDomain =
    host.startsWith('dre.') ||
    host === 'dre.sigmilitar.com.br';

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

  // ─── 3. IDENTIFICACAO DO TENANT ─────────────────────────────────────────

  const validTenants = ['eecmheliodoro', 'eecmprofjoaobatista', 'eecmtangara'];

  // Prioridade 1: Extrair o primeiro segmento da URL (se for um slug válido de escola)
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();
  const pathHasValidTenant = firstSegment && validTenants.includes(firstSegment);

  if (pathHasValidTenant) {
    const tenant = firstSegment;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant', tenant);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Prioridade 2: Variável de ambiente (desenvolvimento local/deploy dedicado)
  let tenant = process.env.NEXT_PUBLIC_TENANT ?? '';

  // Prioridade 3: Mapa de hostnames conhecidos (produção)
  if (!tenant && hostToTenant[host]) {
    tenant = hostToTenant[host];
  }

  // Prioridade 4: Subdomínio removido

  // ─── 4. REWRITE PARA ROTAS LEGADAS OU REDIRECIONAMENTO DE CENTRAL ─────────
  if (tenant && validTenants.includes(tenant)) {
    const isGlobalRoute =
      pathname === '/login' ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/dre') ||
      pathname.startsWith('/dre-login');

    if (!isGlobalRoute) {
      // Faz rewrite transparente para a pasta do tenant /escola
      const url = request.nextUrl.clone();
      url.pathname = `/${tenant}${pathname}`;

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-tenant', tenant);

      return NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
    } else {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-tenant', tenant);

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
