import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Cliente Supabase para uso no browser (usa anon key)
 * Prioriza SOURCE_SUPABASE_* (banco externo) sobre NEXT_PUBLIC_SUPABASE_* (integração v0)
 */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    // Server-side: não criar cliente browser
    return null;
  }
  
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

    console.log('[v0] Supabase config:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl?.substring(0, 30) 
    });

    if (supabaseUrl && !supabaseUrl.startsWith('http')) {
      supabaseUrl = `https://${supabaseUrl}`;
    }

    // Check for placeholder or malformed values
    if (supabaseUrl === 'https://your-project-url.supabase.co' || supabaseUrl.includes('YOUR_SUPABASE')) {
      supabaseUrl = '';
    }

    if (supabaseUrl && supabaseAnonKey) {
      try {
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
        console.log('[v0] Supabase client created successfully');
      } catch (err) {
        console.error('[v0] Error creating Supabase client:', err);
        return null;
      }
    } else {
      console.log('[v0] Supabase not configured - missing URL or key');
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

// Lazy-initialized client — só cria quando acessado no browser
export const supabase: SupabaseClient | null = typeof window !== 'undefined' 
  ? null // será inicializado via getSupabase() no primeiro uso
  : null;

// Export getter para uso no store.tsx
export { getSupabase as getSupabaseClient };

export const supabaseAdmin: SupabaseClient | null = null;
