import { createClient } from '@supabase/supabase-js';

let _supabase: any = null;

function getSupabase(): any {
  if (!_supabase) {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

export const supabase = new Proxy({}, {
  get: (_target, prop) => {
    const client = getSupabase();
    return client ? (client as any)[prop as string] : null;
  }
}) as any;

