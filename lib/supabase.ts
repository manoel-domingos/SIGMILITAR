import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Cliente Supabase para uso no browser (usa anon key)
 * Prioriza SOURCE_SUPABASE_* (banco externo) sobre NEXT_PUBLIC_SUPABASE_* (integração v0)
 */
function getSupabase(): SupabaseClient | null {
  if (!_supabase) {
    // Prioriza banco externo (SOURCE_*), fallback para integração atual
    let supabaseUrl = 
      process.env.NEXT_PUBLIC_SOURCE_SUPABASE_URL ||
      process.env.SOURCE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL || 
      '';
    
    const supabaseAnonKey = 
      process.env.NEXT_PUBLIC_SOURCE_SUPABASE_ANON_KEY ||
      process.env.SOURCE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      '';

    if (supabaseUrl && !supabaseUrl.startsWith('http')) {
      supabaseUrl = `https://${supabaseUrl}`;
    }

    // Check for placeholder or malformed values
    if (supabaseUrl === 'https://your-project-url.supabase.co' || supabaseUrl.includes('YOUR_SUPABASE')) {
      supabaseUrl = '';
    }

    if (supabaseUrl && supabaseAnonKey) {
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
    }
  }
  return _supabase;
}

/**
 * Cliente Supabase Admin para uso server-side (usa service role key)
 * Bypassa RLS - usar apenas em API routes e server actions
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!_supabaseAdmin) {
    let supabaseUrl = 
      process.env.SOURCE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SOURCE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL || 
      '';
    
    const serviceRoleKey = 
      process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      '';

    if (supabaseUrl && !supabaseUrl.startsWith('http')) {
      supabaseUrl = `https://${supabaseUrl}`;
    }

    if (supabaseUrl && serviceRoleKey) {
      _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }
  return _supabaseAdmin;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const client = getSupabase();
    return client ? (client as any)[prop as string] : null;
  }
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const client = getSupabaseAdmin();
    return client ? (client as any)[prop as string] : null;
  }
});
