import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const maxDuration = 300;

interface Account {
  email: string;
  password: string;
}

interface JobRow {
  id: string;
  target_url: string;
  vote_selector: string;
  accounts: Account[];
}

interface AccountResult {
  email: string;
  success: boolean;
  message: string;
}

interface LogEntry {
  ts: string;
  email: string;
  step: string;
  ok: boolean;
}

async function appendLog(jobId: string, entry: LogEntry) {
  try {
    // Use raw SQL via rpc or just read-then-write (safe for low concurrency)
    const { data: row } = await supabaseAdmin
      .from('suparchef_jobs')
      .select('logs')
      .eq('id', jobId)
      .maybeSingle();

    const existing: LogEntry[] = Array.isArray(row?.logs) ? row.logs : [];
    existing.push(entry);

    await supabaseAdmin
      .from('suparchef_jobs')
      .update({ logs: existing, updated_at: new Date().toISOString() })
      .eq('id', jobId);
  } catch {
    // Non-critical — ignore log write failures
  }
}

function log(jobId: string, email: string, step: string, ok = true): Promise<void> {
  return appendLog(jobId, { ts: new Date().toISOString(), email, step, ok });
}

async function runAutomation(job: JobRow): Promise<AccountResult[]> {
  // Dynamic import so the build doesn't fail on Vercel where Playwright isn't available
  let chromium: typeof import('playwright').chromium;
  try {
    const playwright = await import('playwright');
    chromium = playwright.chromium;
  } catch {
    throw new Error('Playwright não está instalado neste ambiente. Execute via script local: node scripts/suparchef-bot.js --job ' + job.id);
  }

  const results: AccountResult[] = [];

  for (const account of job.accounts) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
      // 1. Navegar para o site alvo
      await log(job.id, account.email, `Navegando para ${job.target_url}…`);
      await page.goto(job.target_url, { waitUntil: 'networkidle', timeout: 30000 });

      // 2. Procurar botão "Login com Google" / "Entrar com Google"
      const googleLoginSelectors = [
        'button:has-text("Google")',
        'a:has-text("Google")',
        '[data-provider="google"]',
        '.google-login',
        '#google-login',
        'button:has-text("Entrar com Google")',
        'a:has-text("Entrar com Google")',
        'button:has-text("Login com Google")',
      ];

      await log(job.id, account.email, 'Procurando botão de login Google…');
      let clickedLogin = false;
      for (const sel of googleLoginSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 })) {
            await el.click();
            clickedLogin = true;
            break;
          }
        } catch { /* tenta próximo seletor */ }
      }

      if (!clickedLogin) {
        await log(job.id, account.email, 'Botão de login Google não encontrado', false);
        results.push({ email: account.email, success: false, message: 'Botão de login Google não encontrado na página' });
        await browser.close();
        continue;
      }

      // 3. Aguardar redirect para accounts.google.com
      await log(job.id, account.email, 'Aguardando redirect para Google…');
      await page.waitForURL(/accounts\.google\.com/, { timeout: 15000 });

      // 4. Preencher e-mail
      await log(job.id, account.email, 'Preenchendo e-mail…');
      await page.locator('input[type="email"]').fill(account.email);
      await page.locator('button:has-text("Próxima"), button:has-text("Next")').click();

      // 5. Aguardar campo de senha
      await log(job.id, account.email, 'Preenchendo senha…');
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.locator('input[type="password"]').fill(account.password);
      await page.locator('button:has-text("Próxima"), button:has-text("Next")').click();

      // 6. Aguardar redirect de volta ao site (timeout generoso para verificações 2FA)
      await log(job.id, account.email, 'Aguardando retorno ao site (pode levar até 30s)…');
      await page.waitForURL(url => !url.includes('accounts.google.com'), { timeout: 30000 });

      // 7. Aguardar carregar a página pós-login
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await log(job.id, account.email, 'Login concluído. Procurando elemento de voto…');

      // 8. Clicar no elemento de voto
      const voteEl = page.locator(job.vote_selector).first();
      await voteEl.waitFor({ state: 'visible', timeout: 15000 });
      await voteEl.click();

      // 9. Breve espera para confirmar ação
      await page.waitForTimeout(2000);

      await log(job.id, account.email, 'Voto registrado com sucesso ✓', true);
      results.push({ email: account.email, success: true, message: 'Voto registrado com sucesso' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await log(job.id, account.email, `Erro: ${msg.slice(0, 200)}`, false);
      results.push({ email: account.email, success: false, message: msg.slice(0, 200) });
    } finally {
      await browser.close();
    }
  }

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'jobId obrigatório' }, { status: 400 });

    const { data: job, error: fetchErr } = await supabaseAdmin
      .from('suparchef_jobs')
      .select('id, target_url, vote_selector, accounts')
      .eq('id', jobId)
      .maybeSingle();

    if (fetchErr || !job) {
      return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 });
    }

    // Marcar como running e limpar logs anteriores
    await supabaseAdmin
      .from('suparchef_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        error: null,
        results: null,
        logs: [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    let results: AccountResult[];
    try {
      results = await runAutomation(job as JobRow);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from('suparchef_jobs')
        .update({ status: 'failed', error: msg, finished_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', jobId);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const allOk = results.every(r => r.success);
    await supabaseAdmin
      .from('suparchef_jobs')
      .update({
        status: allOk ? 'done' : 'failed',
        results,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('school_id');
  if (!schoolId) return NextResponse.json({ error: 'school_id obrigatório' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('suparchef_jobs')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
