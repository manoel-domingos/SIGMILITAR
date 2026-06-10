import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_PAT não configurado nas variáveis de ambiente do Vercel.' },
      { status: 501 },
    );
  }

  const { jobId } = await req.json().catch(() => ({}));

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
        inputs: { job_id: jobId ?? '' },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `GitHub API: ${res.status} — ${text}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: 'Workflow disparado no GitHub Actions.' });
}
