import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json().catch(() => ({}));
    if (!jobId) {
      return NextResponse.json({ error: 'jobId obrigatório' }, { status: 400 });
    }

    const token = process.env.GITHUB_PAT;

    // Se possui GITHUB_PAT, envia para o GitHub Actions
    if (token) {
      const res = await fetch(
        'https://api.github.com/repos/manoel-domingos/SIGMILITAR/actions/workflows/suparchef.yml/dispatches',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main',
            inputs: { job_id: jobId },
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `GitHub API: ${res.status} — ${text}` }, { status: 502 });
      }

      return NextResponse.json({ ok: true, message: 'Workflow disparado no GitHub Actions.' });
    }

    // Se NÃO possui GITHUB_PAT, enfileira o job mudando o status para 'idle'
    // O daemon rodando na VPS detectará este status e executará o Playwright
    const { error: updateErr } = await supabaseAdmin
      .from('suparchef_jobs')
      .update({
        status: 'idle',
        started_at: null,
        finished_at: null,
        error: null,
        results: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateErr) {
      return NextResponse.json({ error: 'Erro ao agendar job no banco: ' + updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Job agendado com sucesso para execução na VPS.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

