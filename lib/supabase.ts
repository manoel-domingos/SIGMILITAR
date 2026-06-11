import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Instâncias separadas para SSR e cliente — evita que o singleton do SSR
// (onde window é undefined) bloqueie a inicialização no browser.
let _clientInstance: SupabaseClient | null = null;
let _serverInstance: SupabaseClient | null = null;

function buildClient(): SupabaseClient | null {
  // .trim() defensivo — env vars do Vercel já vieram com espaço/CRLF no fim
  // (NEXT_PUBLIC_SUPABASE_URL = "...supabase.co "), o que quebra a base URL e
  // faz o gateway responder "No API key found in request".
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'eecm-auth-token',
      flowType: 'pkce',
    },
  });
}

function getSupabase(): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    // Contexto do browser — singleton por aba
    if (!_clientInstance) _clientInstance = buildClient();
    return _clientInstance;
  } else {
    // Contexto SSR — singleton por processo
    if (!_serverInstance) _serverInstance = buildClient();
    return _serverInstance;
  }
}

/**
 * Retorna true SOMENTE se o cliente Supabase foi inicializado com credenciais válidas.
 * Use isto em vez de `if (supabase)` — o Proxy sempre é truthy mesmo sem credenciais.
 */
export function isSupabaseReady(): boolean {
  return getSupabase() !== null;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const client = getSupabase();
    if (!client) return undefined;
    const value = (client as any)[prop as string];
    return typeof value === 'function' ? value.bind(client) : value;
  },
}) as SupabaseClient;

