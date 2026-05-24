import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Instâncias separadas para SSR e cliente — evita que o singleton do SSR
// (onde window é undefined) bloqueie a inicialização no browser.
let _clientInstance: SupabaseClient | null = null;
let _serverInstance: SupabaseClient | null = null;

function buildClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
    return client ? (client as any)[prop as string] : undefined;
  },
}) as SupabaseClient;

