import { createClient } from '@supabase/supabase-js';

let _supabase: any = null;
let _initialized = false;

function getSupabase(): any {
  // Só inicializa uma vez por ciclo de vida do módulo
  if (_initialized) return _supabase;
  _initialized = true;

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}`;
  }

  // Rejeita placeholders e keys claramente inválidas
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === 'https://your-project-url.supabase.co' ||
    supabaseUrl.includes('YOUR_SUPABASE') ||
    supabaseAnonKey.length < 20
  ) {
    if (typeof window !== 'undefined') {
      console.warn('[supabase] Credenciais ausentes — modo offline ativo.',
        'URL:', supabaseUrl ? 'presente' : 'AUSENTE',
        'KEY:', supabaseAnonKey ? `presente (${supabaseAnonKey.length} chars)` : 'AUSENTE'
      );
    }
    _supabase = null;
    return null;
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'eecm-auth-token',
      flowType: 'pkce',
    },
  });

  return _supabase;
}

/**
 * Retorna true SOMENTE se o cliente Supabase foi inicializado com credenciais válidas.
 * Use isto em vez de `if (supabase)` — o Proxy sempre é truthy mesmo sem credenciais.
 */
export function isSupabaseReady(): boolean {
  return getSupabase() !== null;
}

export const supabase = new Proxy({}, {
  get: (_target, prop) => {
    const client = getSupabase();
    return client ? (client as any)[prop as string] : null;
  }
}) as any;

