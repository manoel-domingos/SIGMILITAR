import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY || '';
  // Prioriza SOURCE_* (banco externo) sobre NEXT_PUBLIC_* (integração v0)
  const supabaseUrl = 
    process.env.SOURCE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SOURCE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    '';
  const supabaseAnonKey = 
    process.env.SOURCE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SOURCE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    '';
  const supabaseServiceKey = 
    process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    '';

  // --- DeepSeek API oficial validation ---
  const deepseekConfigured = !!deepseekApiKey;
  let deepseekReachable = false;
  let deepseekModels: string[] = [];
  let deepseekError: string | null = null;

  if (deepseekConfigured) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/models', {
        headers: {
          Authorization: `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        deepseekReachable = true;
        const data = await res.json();
        deepseekModels = (data?.data ?? []).map((m: any) => m.id);
      } else {
        const text = await res.text();
        deepseekError = 'HTTP ' + res.status + ': ' + text.slice(0, 160);
      }
    } catch (err: unknown) {
      deepseekError = err instanceof Error ? err.message : String(err);
    }
  }

  // --- Supabase validation ---
  const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
  let supabaseReachable = false;
  let supabaseError: string | null = null;
  let supabaseQueryTest: { success: boolean; error?: string } | null = null;

  if (supabaseConfigured) {
    try {
      let url = supabaseUrl;
      if (!url.startsWith('http')) url = `https://${url}`;
      const healthRes = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
        headers: { apikey: supabaseAnonKey },
        signal: AbortSignal.timeout(8000),
      });

      if (healthRes.ok) {
        supabaseReachable = true;
        const keyToUse = supabaseServiceKey || supabaseAnonKey;
        const supabase = createClient(url, keyToUse);
        const { error } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true });
        supabaseQueryTest = error
          ? { success: false, error: error.message }
          : { success: true };
      } else {
        supabaseError = `Health check failed: HTTP ${healthRes.status}`;
      }
    } catch (err: unknown) {
      supabaseError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    deepseek: {
      configured: deepseekConfigured,
      reachable: deepseekReachable,
      models: deepseekModels,
      error: deepseekError,
    },
    supabase: {
      configured: supabaseConfigured,
      hasServiceKey: !!supabaseServiceKey,
      reachable: supabaseReachable,
      queryTest: supabaseQueryTest,
      error: supabaseError,
    },
    server: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
}
